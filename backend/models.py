from sqlalchemy import Column, Integer, String, Float
from database import Base  # Import the Base we created in database.py

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String)  # [cite: 18]
    gstin = Column(String)           # [cite: 18]
    date = Column(String)            # [cite: 18]
    taxable_value = Column(Float)    # [cite: 18]
    tax_amount = Column(Float)       # [cite: 18]
    
    # 'purchase' or 'sales' to help with reconciliation logic [cite: 19]
    invoice_type = Column(String) 
    
    # Status can be 'Pending', 'Verified', or 'Mismatch' [cite: 20]
    status = Column(String, default="Pending")