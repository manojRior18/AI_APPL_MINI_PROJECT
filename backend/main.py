import os
import shutil
import time
from pathlib import Path
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Header, Query, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
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
import portal_record
from export import export_excel
from dotenv import load_dotenv

load_dotenv()

# ─── App Setup ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="GST AI Helper API",
    description="MSME GST & E-Invoicing Compliance Helper",
    version="1.0.0"
)

# Define API Router
api_router = APIRouter(prefix="/api")



# Parse ALLOWED_ORIGINS
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
allowed_origins = [o.strip() for o in allowed_origins_str.split(",")]

# Add regex support for ngrok domains (useful for demo)
class NgrokCORSMiddleware(CORSMiddleware):
    def is_allowed_origin(self, origin: str) -> bool:
        if super().is_allowed_origin(origin):
            return True
        return ".ngrok.io" in origin or ".ngrok-free.app" in origin or ".loca.lt" in origin


app.add_middleware(
    NgrokCORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Logging Middleware ────────────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000
    print(f"[ACCESS] {request.method} {request.url.path} - {response.status_code} - {duration_ms:.2f}ms")
    return response

# Create DB tables on startup
models.Base.metadata.create_all(bind=database.engine)
portal_record.Base.metadata.create_all(bind=database.engine)

# Create upload and reports directories
UPLOAD_DIR = Path("uploads")
REPORTS_DIR = Path("../reports")
UPLOAD_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

# ─── Dependency: DB Session ────────────────────────────────────────────────────

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    return auth.decode_token(token)

def log_audit(db: Session, action: str, invoice_id: Optional[int] = None, user_id: Optional[int] = None, details: str = "", ip_address: str = ""):
    log_entry = models.AuditLog(
        action=action,
        invoice_id=invoice_id,
        user_id=user_id,
        details=details,
        ip_address=ip_address
    )
    db.add(log_entry)
    db.commit()

# ─── Auth Routes ───────────────────────────────────────────────────────────────

@api_router.post("/auth/signup", tags=["Auth"])
async def signup(user_data: models.UserCreate, request: Request, db: Session = Depends(get_db)):
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

    log_audit(db, "SIGNUP", user_id=new_user.id, details=f"New user {new_user.email}", ip_address=request.client.host)

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

@api_router.post("/auth/login", tags=["Auth"])
async def login(credentials: models.UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not auth.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    log_audit(db, "LOGIN", user_id=user.id, details="User logged in", ip_address=request.client.host)

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

@api_router.post("/upload", tags=["Invoices"])
async def upload_invoice(
    request: Request,
    file: UploadFile = File(...),
    invoice_type: str = Query("purchase", enum=["purchase", "sales"]),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    # File size limit check (approx by reading to end and returning)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max size is 20MB.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not supported. Allowed: {ALLOWED_EXTENSIONS}"
        )

    safe_name = f"{os.urandom(8).hex()}_{file.filename}"
    file_path = UPLOAD_DIR / safe_name
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    raw_text = ocr.extract_text(str(file_path)).get("text", "")
    data = extract.parse_invoice_data(raw_text)
    data["invoice_type"] = invoice_type

    val_results = validation.validate_gst_data(data)
    data["confidence_score"] = val_results.get("confidence_score", 0.0)
    
    # Check for duplicates
    inv_num = data.get("invoice_number")
    supp_gstin = data.get("supplier_gstin")
    
    if inv_num and supp_gstin and inv_num != "UNKNOWN" and supp_gstin != "NOT_FOUND":
        duplicate = db.query(models.Invoice).filter(
            models.Invoice.invoice_number == inv_num,
            models.Invoice.supplier_gstin == supp_gstin
        ).first()
        
        if duplicate:
            # os.remove(file_path)
            # raise HTTPException(
            #     status_code=409, 
            #     detail=f"Duplicate invoice detected: {inv_num} from {supp_gstin} already exists."
            # )
            pass # Allow duplicates for demo purposes


    new_inv = models.Invoice(
        filename=safe_name,
        invoice_number=inv_num,
        gstin=supp_gstin, # legacy compat
        supplier_gstin=supp_gstin,
        buyer_gstin=data.get("buyer_gstin"),
        vendor_name=data.get("vendor_name"),
        hsn_code=data.get("hsn_code"),
        place_of_supply=data.get("place_of_supply"),
        date=data.get("date"),
        taxable_value=data.get("taxable_value", 0.0),
        tax_amount=data.get("tax_amount", 0.0),
        cgst_amount=data.get("cgst_amount", 0.0),
        sgst_amount=data.get("sgst_amount", 0.0),
        igst_amount=data.get("igst_amount", 0.0),
        total_amount=data.get("total_amount", 0.0),
        filing_period=data.get("filing_period"),
        ocr_engine_used="paddle",
        invoice_type=data["invoice_type"],
        status=data.get("status", "Pending"),
        confidence_score=data["confidence_score"],
        raw_text=raw_text[:5000],
        user_id=current_user["user_id"] if current_user else None,
    )
    db.add(new_inv)
    db.commit()
    db.refresh(new_inv)

    log_audit(
        db, "UPLOAD", invoice_id=new_inv.id, 
        user_id=current_user["user_id"] if current_user else None, 
        details=f"Uploaded {file.filename}", 
        ip_address=request.client.host
    )

    return {
        "message": "Invoice processed successfully.",
        "invoice_id": new_inv.id,
        "data": data,
        "validation": val_results,
        "raw_text_preview": raw_text[:500] if raw_text else "",
    }


@api_router.get("/invoices", tags=["Invoices"])
async def list_invoices(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    invoice_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Invoice)
    if status:
        query = query.filter(models.Invoice.status == status)
    if invoice_type:
        query = query.filter(models.Invoice.invoice_type == invoice_type)
        
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    invoices = query.order_by(models.Invoice.uploaded_at.desc()).offset(offset).limit(page_size).all()

    return {
        "items": [
            {
                "id": inv.id,
                "filename": inv.filename,
                "invoice_number": inv.invoice_number,
                "supplier_gstin": inv.supplier_gstin,
                "buyer_gstin": inv.buyer_gstin,
                "vendor_name": inv.vendor_name,
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
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@api_router.get("/invoices/{invoice_id}", tags=["Invoices"])
async def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    inv = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    return inv

@api_router.patch("/invoices/{invoice_id}", tags=["Invoices"])
async def update_invoice(
    invoice_id: int, 
    update_data: models.InvoiceUpdate, 
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    inv = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")
        
    update_dict = update_data.model_dump(exclude_unset=True)
    
    for key, value in update_dict.items():
        setattr(inv, key, value)
        
    db.commit()
    db.refresh(inv)
    
    user_id = current_user["user_id"] if current_user else None
    log_audit(db, "UPDATE", invoice_id=inv.id, user_id=user_id, details=f"Updated fields: {list(update_dict.keys())}", ip_address=request.client.host)
    
    return inv

@api_router.delete("/invoices/{invoice_id}", tags=["Invoices"])
async def delete_invoice(invoice_id: int, request: Request, db: Session = Depends(get_db), current_user: Optional[dict] = Depends(get_current_user)):
    inv = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    db.delete(inv)
    db.commit()
    
    user_id = current_user["user_id"] if current_user else None
    log_audit(db, "DELETE", invoice_id=invoice_id, user_id=user_id, details=f"Deleted invoice {inv.invoice_number}", ip_address=request.client.host)
    return {"message": f"Invoice {invoice_id} deleted."}

# ─── Reconciliation Routes ─────────────────────────────────────────────────────

@api_router.post("/reconcile/upload-portal-csv", tags=["Reconciliation"])
async def upload_portal_csv(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
        
    safe_name = f"portal_{os.urandom(4).hex()}_{file.filename}"
    file_path = UPLOAD_DIR / safe_name
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        records = portal_record.parse_portal_csv(str(file_path))
        batch_id = datetime.now().strftime("%Y%m%d%H%M%S")
        
        db_records = []
        for r in records:
            db_records.append(portal_record.PortalRecord(
                gstin=r.get("gstin"),
                invoice_number=r.get("invoice_number"),
                taxable_value=r.get("taxable_value"),
                tax_amount=r.get("tax_amount"),
                total_amount=r.get("total_amount"),
                date=r.get("date"),
                upload_batch_id=batch_id
            ))
            
        db.add_all(db_records)
        db.commit()
        
        user_id = current_user["user_id"] if current_user else None
        log_audit(db, "PORTAL_UPLOAD", user_id=user_id, details=f"Uploaded portal data with {len(records)} records", ip_address=request.client.host)
        
        return {"message": f"Successfully loaded {len(records)} portal records.", "batch_id": batch_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/reconcile", tags=["Reconciliation"])
async def run_reconciliation(db: Session = Depends(get_db), request: Request = None, current_user: Optional[dict] = Depends(get_current_user)):
    internal_invoices = db.query(models.Invoice).all()
    internal = [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "gstin": inv.supplier_gstin or inv.gstin,
            "taxable_value": inv.taxable_value,
            "tax_amount": inv.tax_amount,
            "total_amount": inv.total_amount,
            "date": inv.date,
            "invoice_type": inv.invoice_type,
            "status": inv.status,
            "confidence_score": inv.confidence_score,
        }
        for inv in internal_invoices
    ]

    portal_records = db.query(portal_record.PortalRecord).all()
    if portal_records:
        external = [
            {
                "gstin": p.gstin,
                "invoice_number": p.invoice_number,
                "taxable_value": p.taxable_value,
                "tax_amount": p.tax_amount,
                "total_amount": p.total_amount,
                "date": p.date,
            }
            for p in portal_records
        ]
    else:
        # Fallback to mock data if no portal data is uploaded yet
        external = []

    results = reconciliation.reconcile_invoices(internal, external)
    summary = reconciliation.generate_summary(results)

    for result in results:
        inv_no = result.get("invoice_number")
        gstin = result.get("gstin")
        new_status = result.get("status")
        if inv_no and gstin:
            db.query(models.Invoice).filter(
                models.Invoice.invoice_number == inv_no,
                (models.Invoice.supplier_gstin == gstin) | (models.Invoice.gstin == gstin),
            ).update({"status": new_status})
    db.commit()
    
    if request:
        user_id = current_user["user_id"] if current_user else None
        log_audit(db, "RECONCILE", user_id=user_id, details=f"Reconciled {len(internal)} invoices against {len(external)} portal records", ip_address=request.client.host)

    return {"results": results, "summary": summary}


# ─── Dashboard & Analytics ─────────────────────────────────────────────────────

@api_router.get("/dashboard", tags=["Dashboard"])
async def get_dashboard(db: Session = Depends(get_db)):
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

@api_router.get("/analytics", tags=["Dashboard"])
async def get_analytics(db: Session = Depends(get_db)):
    invoices = db.query(models.Invoice).all()
    
    # Simple aggregates in Python for SQLite (to avoid complex SQL date grouping across dialects)
    df = pd.DataFrame([
        {
            "id": i.id, "month": i.uploaded_at.strftime("%b %Y") if i.uploaded_at else "Unknown",
            "tax_amount": i.tax_amount, "status": i.status, "vendor_name": i.vendor_name or "Unknown",
            "cgst": i.cgst_amount, "sgst": i.sgst_amount, "igst": i.igst_amount
        } for i in invoices
    ])
    
    if df.empty:
        return {"monthly_uploads": [], "status_pie": [], "top_vendors": [], "tax_trend": []}
        
    monthly_uploads = df.groupby("month").agg({"id": "count", "tax_amount": "sum"}).reset_index()
    monthly_uploads = [{"month": row["month"], "count": row["id"], "tax_amount": row["tax_amount"]} for _, row in monthly_uploads.iterrows()]
    
    status_pie = df.groupby("status").size().reset_index(name="count")
    status_pie = [{"status": row["status"], "count": row["count"]} for _, row in status_pie.iterrows()]
    
    top_vendors = df.groupby("vendor_name").agg({"tax_amount": "sum"}).sort_values("tax_amount", ascending=False).head(5).reset_index()
    top_vendors = [{"vendor_name": row["vendor_name"], "total_tax": row["tax_amount"]} for _, row in top_vendors.iterrows()]
    
    tax_trend = df.groupby("month").agg({"cgst": "sum", "sgst": "sum", "igst": "sum"}).reset_index()
    tax_trend = [{"month": row["month"], "cgst": row["cgst"], "sgst": row["sgst"], "igst": row["igst"]} for _, row in tax_trend.iterrows()]

    return {
        "monthly_uploads": monthly_uploads,
        "status_pie": status_pie,
        "top_vendors": top_vendors,
        "tax_trend": tax_trend
    }

# ─── Export Route ──────────────────────────────────────────────────────────────

@app.get("/export", tags=["Reports"])
async def export_report(request: Request, db: Session = Depends(get_db), current_user: Optional[dict] = Depends(get_current_user)):
    invoices = db.query(models.Invoice).all()
    if not invoices:
        raise HTTPException(status_code=404, detail="No invoices to export.")
        
    # Get reconciliation results to include in export
    inv_dicts = []
    for inv in invoices:
        inv_dicts.append({
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "gstin": inv.supplier_gstin or inv.gstin,
            "supplier_gstin": inv.supplier_gstin,
            "buyer_gstin": inv.buyer_gstin,
            "vendor_name": inv.vendor_name,
            "taxable_value": inv.taxable_value,
            "tax_amount": inv.tax_amount,
            "total_amount": inv.total_amount,
            "date": inv.date,
            "filing_period": inv.filing_period,
            "invoice_type": inv.invoice_type,
            "status": inv.status,
            "confidence_score": inv.confidence_score,
            "uploaded_at": str(inv.uploaded_at) if inv.uploaded_at else "",
        })
        
    portal_records = db.query(portal_record.PortalRecord).all()
    external = [{"gstin": p.gstin, "invoice_number": p.invoice_number, "taxable_value": p.taxable_value, "tax_amount": p.tax_amount, "total_amount": p.total_amount, "date": p.date} for p in portal_records]
    
    results = reconciliation.reconcile_invoices(inv_dicts, external)

    export_path = str(REPORTS_DIR / "GST_Reconciliation_Report.xlsx")
    export_excel(inv_dicts, results, export_path)

    user_id = current_user["user_id"] if current_user else None
    log_audit(db, "EXPORT", user_id=user_id, details="Exported Excel report", ip_address=request.client.host)

    return FileResponse(
        path=export_path,
        filename="GST_Reconciliation_Report.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

app.include_router(api_router)

# Mount static files (must be after all other routes)
FRONTEND_DIR = Path(__file__).parent / ".." / "frontend" / "dist"

if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}", response_class=HTMLResponse)
    async def serve_frontend(full_path: str):
        index_file = FRONTEND_DIR / "index.html"
        if index_file.exists():
            return HTMLResponse(content=index_file.read_text(), status_code=200)
        return HTMLResponse(content="Frontend build not found.", status_code=404)
else:
    @app.get("/")
    async def root():
        return {"status": "ok", "message": "GST AI Helper API is running. Frontend dist not found."}