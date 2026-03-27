from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, database, ocr, extract, validation, reconciliation

app = FastAPI()

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=database.engine)

@app.post("/auth/login")
async def login():
    return {"token": "mock-session-token-123", "user": "MSME Owner"}

@app.post("/upload")
async def handle_upload(file: UploadFile = File(...), db: Session = Depends(database.SessionLocal)):
    # 1. Save and OCR
    temp_path = f"../uploads/{file.filename}"
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())
    
    raw_text = ocr.get_raw_text(temp_path)
    data = extract.parse_invoice_data(raw_text)
    
    # 2. Validate
    val_results = validation.validate_gst_data(data)
    
    # 3. Save to DB
    new_inv = models.Invoice(**data)
    db.add(new_inv)
    db.commit()
    
    return {"data": data, "validation": val_results}

@app.get("/reconcile")
async def get_reconciliation(db: Session = Depends(database.SessionLocal)):
    # Mocking external portal data for the PoC demo
    internal = [inv.__dict__ for inv in db.query(models.Invoice).all()]
    external = [{"gstin": "27BKZPM...", "invoice_number": "INV-99", "taxable_value": 1000.0, "tax_amount": 180.0}]
    
    return reconciliation.reconcile_invoices(internal, external)