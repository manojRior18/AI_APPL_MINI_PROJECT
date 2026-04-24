import os
import shutil
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

import models
import database
import ocr
import extract
import validation
import reconciliation
import auth
import pandas as pd

# ─── App Setup ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="GST AI Helper API",
    description="MSME GST & E-Invoicing Compliance Helper",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create DB tables on startup
models.Base.metadata.create_all(bind=database.engine)

# Create upload and reports directories
UPLOAD_DIR = Path("uploads")
REPORTS_DIR = Path("../reports")
UPLOAD_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp"}


# ─── Dependency: DB Session ────────────────────────────────────────────────────

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Dependency: Auth ──────────────────────────────────────────────────────────

def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """Extract user from Bearer token header (optional – doesn't block routes)."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    return auth.decode_token(token)


# ─── Auth Routes ───────────────────────────────────────────────────────────────

@app.post("/auth/signup", tags=["Auth"])
async def signup(user_data: models.UserCreate, db: Session = Depends(get_db)):
    """Register a new business account."""
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    hashed_pw = auth.hash_password(user_data.password)
    new_user = models.User(
        business_name=user_data.business_name,
        email=user_data.email,
        gstin=user_data.gstin,
        hashed_password=hashed_pw,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = auth.create_token(new_user.id, new_user.email, new_user.business_name)
    return {
        "token": token,
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "business_name": new_user.business_name,
            "gstin": new_user.gstin,
        }
    }


@app.post("/auth/login", tags=["Auth"])
async def login(credentials: models.UserLogin, db: Session = Depends(get_db)):
    """Login with email and password."""
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not auth.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = auth.create_token(user.id, user.email, user.business_name)
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "business_name": user.business_name,
            "gstin": user.gstin,
        }
    }


# ─── Upload & OCR Routes ───────────────────────────────────────────────────────

@app.post("/upload", tags=["Invoices"])
async def upload_invoice(
    file: UploadFile = File(...),
    invoice_type: str = Query("purchase", enum=["purchase", "sales"]),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """
    Upload a GST invoice (PDF/image), run OCR extraction and validation.
    Saves result to database and returns extracted data + validation report.
    """
    # ── File type check ────────────────────────────────────────────────────────
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not supported. Allowed: {ALLOWED_EXTENSIONS}"
        )

    # ── Save file ──────────────────────────────────────────────────────────────
    safe_name = f"{os.urandom(8).hex()}_{file.filename}"
    file_path = UPLOAD_DIR / safe_name
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # ── OCR ────────────────────────────────────────────────────────────────────
    raw_text = ocr.get_raw_text(str(file_path))

    # ── Extract fields ─────────────────────────────────────────────────────────
    data = extract.parse_invoice_data(raw_text)
    data["invoice_type"] = invoice_type

    # ── Validate ───────────────────────────────────────────────────────────────
    val_results = validation.validate_gst_data(data)
    data["confidence_score"] = val_results["confidence_score"]

    # ── Save to DB ─────────────────────────────────────────────────────────────
    new_inv = models.Invoice(
        filename=safe_name,
        invoice_number=data["invoice_number"],
        gstin=data["gstin"],
        date=data["date"],
        taxable_value=data["taxable_value"],
        tax_amount=data["tax_amount"],
        total_amount=data["total_amount"],
        invoice_type=data["invoice_type"],
        status=data["status"],
        confidence_score=data["confidence_score"],
        raw_text=raw_text[:5000],  # Store first 5000 chars only
        user_id=current_user["user_id"] if current_user else None,
    )
    db.add(new_inv)
    db.commit()
    db.refresh(new_inv)

    return {
        "message": "Invoice processed successfully.",
        "invoice_id": new_inv.id,
        "data": data,
        "validation": val_results,
        "raw_text_preview": raw_text[:500] if raw_text else "",
    }


@app.get("/invoices", tags=["Invoices"])
async def list_invoices(
    status: Optional[str] = Query(None),
    invoice_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List all invoices with optional filtering."""
    query = db.query(models.Invoice)
    if status:
        query = query.filter(models.Invoice.status == status)
    if invoice_type:
        query = query.filter(models.Invoice.invoice_type == invoice_type)
    total = query.count()
    invoices = query.order_by(models.Invoice.uploaded_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "invoices": [
            {
                "id": inv.id,
                "filename": inv.filename,
                "invoice_number": inv.invoice_number,
                "gstin": inv.gstin,
                "date": inv.date,
                "taxable_value": inv.taxable_value,
                "tax_amount": inv.tax_amount,
                "total_amount": inv.total_amount,
                "invoice_type": inv.invoice_type,
                "status": inv.status,
                "confidence_score": inv.confidence_score,
                "uploaded_at": str(inv.uploaded_at),
            }
            for inv in invoices
        ]
    }


@app.delete("/invoices/{invoice_id}", tags=["Invoices"])
async def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Delete an invoice by ID."""
    inv = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    db.delete(inv)
    db.commit()
    return {"message": f"Invoice {invoice_id} deleted."}


# ─── Reconciliation Routes ─────────────────────────────────────────────────────

# Mock external GST portal data (replace with real API call in production)
MOCK_PORTAL_DATA = [
    {
        "gstin": "27AABCU9603R1ZX",
        "invoice_number": "INV-2024-001",
        "taxable_value": 50000.00,
        "tax_amount": 9000.00,
        "total_amount": 59000.00,
        "date": "01/03/2024",
    },
    {
        "gstin": "29GGGGG1314R9Z6",
        "invoice_number": "INV-2024-005",
        "taxable_value": 25000.00,
        "tax_amount": 4500.00,
        "total_amount": 29500.00,
        "date": "15/03/2024",
    },
    {
        "gstin": "07AAACP0165G1ZL",
        "invoice_number": "PORTAL-ONLY-99",
        "taxable_value": 12000.00,
        "tax_amount": 2160.00,
        "total_amount": 14160.00,
        "date": "20/03/2024",
    },
    {
    "gstin": "27ABCDE1234F1Z5",
    "invoice_number": "INV-101",
    "taxable_value": 10000.00,
    "tax_amount": 1800.00,
    "total_amount": 11800.00,
    "date": "15/04/2026"
  },
  {
    "gstin": "09PQRST5678G2Z1",
    "invoice_number": "INV-102",
    "taxable_value": 5000.00,
    "tax_amount": 900.00,
    "total_amount": 5900.00,
    "date": "20/04/2026"
  },
  {
    "gstin": "07AAACP0165G1ZL",
    "invoice_number": "PORTAL-ONLY-99",
    "taxable_value": 12000.00,
    "tax_amount": 2160.00,
    "total_amount": 14160.00,
    "date": "20/03/2026"
  },
]


@app.get("/reconcile", tags=["Reconciliation"])
async def run_reconciliation(db: Session = Depends(get_db)):
    """
    Run reconciliation between uploaded invoices and mock GST portal data.
    Returns line-by-line results and a summary.
    """
    internal = [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "gstin": inv.gstin,
            "taxable_value": inv.taxable_value,
            "tax_amount": inv.tax_amount,
            "total_amount": inv.total_amount,
            "date": inv.date,
            "invoice_type": inv.invoice_type,
            "status": inv.status,
            "confidence_score": inv.confidence_score,
        }
        for inv in db.query(models.Invoice).all()
    ]

    results = reconciliation.reconcile_invoices(internal, MOCK_PORTAL_DATA)
    summary = reconciliation.generate_summary(results)

    # Update statuses in DB
    for result in results:
        inv_no = result.get("invoice_number")
        gstin = result.get("gstin")
        new_status = result.get("status")
        if inv_no and gstin:
            db.query(models.Invoice).filter(
                models.Invoice.invoice_number == inv_no,
                models.Invoice.gstin == gstin,
            ).update({"status": new_status})
    db.commit()

    return {"results": results, "summary": summary}


# ─── Dashboard Stats ───────────────────────────────────────────────────────────

@app.get("/dashboard", tags=["Dashboard"])
async def get_dashboard(db: Session = Depends(get_db)):
    """Return aggregated stats for the dashboard."""
    total = db.query(func.count(models.Invoice.id)).scalar() or 0
    matched = db.query(func.count(models.Invoice.id)).filter(models.Invoice.status == "Matched").scalar() or 0
    mismatch = db.query(func.count(models.Invoice.id)).filter(models.Invoice.status == "Mismatch").scalar() or 0
    missing_portal = db.query(func.count(models.Invoice.id)).filter(models.Invoice.status == "Missing in Portal").scalar() or 0
    missing_books = db.query(func.count(models.Invoice.id)).filter(models.Invoice.status == "Missing in Books").scalar() or 0
    pending = db.query(func.count(models.Invoice.id)).filter(models.Invoice.status == "Pending").scalar() or 0
    total_tax = db.query(func.sum(models.Invoice.tax_amount)).scalar() or 0.0

    compliance_score = round((matched / total) * 100, 1) if total > 0 else 0.0

    return {
        "total_invoices": total,
        "matched": matched,
        "mismatches": mismatch,
        "missing_in_portal": missing_portal,
        "missing_in_books": missing_books,
        "pending": pending,
        "total_tax_value": round(float(total_tax), 2),
        "compliance_score": compliance_score,
    }


# ─── Export Route ──────────────────────────────────────────────────────────────

@app.get("/export", tags=["Reports"])
async def export_report(db: Session = Depends(get_db)):
    """Export reconciliation report as Excel (.xlsx)."""
    invoices = db.query(models.Invoice).all()

    data = [
        {
            "Invoice Number": inv.invoice_number,
            "GSTIN": inv.gstin,
            "Date": inv.date,
            "Invoice Type": inv.invoice_type,
            "Taxable Value (₹)": inv.taxable_value,
            "Tax Amount (₹)": inv.tax_amount,
            "Total Amount (₹)": inv.total_amount,
            "Status": inv.status,
            "Confidence Score": inv.confidence_score,
            "Uploaded At": str(inv.uploaded_at),
        }
        for inv in invoices
    ]

    if not data:
        raise HTTPException(status_code=404, detail="No invoices to export.")

    df = pd.DataFrame(data)
    export_path = REPORTS_DIR / "GST_Reconciliation_Report.xlsx"
    df.to_excel(str(export_path), index=False)

    return FileResponse(
        path=str(export_path),
        filename="GST_Reconciliation_Report.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "GST AI Helper API is running."}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "version": "1.0.0"}