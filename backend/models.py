from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from pydantic import BaseModel, Field
from typing import Optional
from database import Base


# ─── SQLAlchemy ORM Models ─────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    business_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    gstin = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    invoice_number = Column(String, index=True)
    gstin = Column(String, index=True)  # legacy
    supplier_gstin = Column(String, index=True)
    buyer_gstin = Column(String, index=True)
    vendor_name = Column(String)
    hsn_code = Column(String)
    place_of_supply = Column(String)
    date = Column(String)
    taxable_value = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    cgst_amount = Column(Float, default=0.0)
    sgst_amount = Column(Float, default=0.0)
    igst_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    filing_period = Column(String)
    ocr_engine_used = Column(String)
    # 'purchase' or 'sales'
    invoice_type = Column(String, default="purchase")
    # 'Pending', 'Matched', 'Mismatch', 'Missing in Portal', 'Missing in Books'
    status = Column(String, default="Pending")
    confidence_score = Column(Float, default=0.0)
    raw_text = Column(String, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, nullable=True)


class ReconciliationLog(Base):
    __tablename__ = "reconciliation_logs"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, nullable=True)
    invoice_number = Column(String)
    gstin = Column(String)
    internal_taxable = Column(Float, default=0.0)
    internal_tax = Column(Float, default=0.0)
    external_taxable = Column(Float, nullable=True)
    external_tax = Column(Float, nullable=True)
    status = Column(String)
    remarks = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    invoice_id = Column(Integer, nullable=True)
    user_id = Column(Integer, nullable=True)
    details = Column(String)
    ip_address = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ─── Pydantic Schemas ──────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    business_name: str
    email: str
    gstin: Optional[str] = None
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class InvoiceOut(BaseModel):
    id: int
    filename: Optional[str]
    invoice_number: str
    gstin: Optional[str] = None
    supplier_gstin: Optional[str] = None
    buyer_gstin: Optional[str] = None
    vendor_name: Optional[str] = None
    hsn_code: Optional[str] = None
    place_of_supply: Optional[str] = None
    date: str
    taxable_value: float
    tax_amount: float
    cgst_amount: Optional[float] = 0.0
    sgst_amount: Optional[float] = 0.0
    igst_amount: Optional[float] = 0.0
    total_amount: float
    filing_period: Optional[str] = None
    ocr_engine_used: Optional[str] = None
    invoice_type: str
    status: str
    confidence_score: float
    uploaded_at: Optional[str] = None
    raw_text: Optional[str] = None

    class Config:
        from_attributes = True


class InvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = None
    gstin: Optional[str] = None
    supplier_gstin: Optional[str] = None
    buyer_gstin: Optional[str] = None
    date: Optional[str] = None
    taxable_value: Optional[float] = None
    tax_amount: Optional[float] = None
    total_amount: Optional[float] = None
    invoice_type: Optional[str] = None


class AuditLogOut(BaseModel):
    id: int
    action: str
    invoice_id: Optional[int] = None
    user_id: Optional[int] = None
    details: str
    ip_address: Optional[str] = None
    created_at: Optional[str] = None
    
    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    message: str
    data: dict
    validation: dict


class ReconciliationItem(BaseModel):
    invoice_number: str
    gstin: str
    taxable_value: float
    tax_amount: float
    status: str
    remarks: str
    external_taxable: Optional[float] = None
    external_tax: Optional[float] = None


class DashboardStats(BaseModel):
    total_invoices: int
    matched: int
    mismatches: int
    missing_in_portal: int
    missing_in_books: int
    pending: int
    total_tax_value: float
    compliance_score: float