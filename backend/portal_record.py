from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from database import Base
import pandas as pd
from typing import List, Dict

class PortalRecord(Base):
    __tablename__ = "portal_records"

    id = Column(Integer, primary_key=True, index=True)
    gstin = Column(String, index=True)
    invoice_number = Column(String, index=True)
    taxable_value = Column(Float)
    tax_amount = Column(Float)
    total_amount = Column(Float)
    date = Column(String)
    upload_batch_id = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

def parse_portal_csv(file_path: str) -> List[Dict]:
    """Parse and validate portal CSV data."""
    try:
        df = pd.read_csv(file_path)
        # Handle different potential column names gracefully if needed, but here we expect specific ones
        required_cols = ["gstin", "invoice_number", "taxable_value", "tax_amount", "total_amount", "date"]
        
        # Check required columns
        for col in required_cols:
            if col not in df.columns:
                # Try case insensitive match or mapping
                cols_lower = {c.lower(): c for c in df.columns}
                if col in cols_lower:
                    df = df.rename(columns={cols_lower[col]: col})
                else:
                    raise ValueError(f"Missing required column: {col}")
                
        # Clean data: drop completely empty rows
        df = df.dropna(how='all')
        
        # Fill NaN values with defaults to avoid float/None issues
        df["taxable_value"] = pd.to_numeric(df["taxable_value"], errors="coerce").fillna(0.0)
        df["tax_amount"] = pd.to_numeric(df["tax_amount"], errors="coerce").fillna(0.0)
        df["total_amount"] = pd.to_numeric(df["total_amount"], errors="coerce").fillna(0.0)
        
        # Convert all to list of dicts
        records = df.to_dict(orient="records")
        return records
    except Exception as e:
        raise ValueError(f"Error parsing CSV: {str(e)}")
