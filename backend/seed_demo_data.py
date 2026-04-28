import sqlite3
from datetime import datetime
import os

def seed_data():
    db_path = 'gst_helper.db'
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Create a Demo User if not exists
    cursor.execute("INSERT OR IGNORE INTO users (id, business_name, email, gstin, hashed_password) VALUES (?, ?, ?, ?, ?)",
                   (1, 'Demo Enterprises Pvt Ltd', 'demo@example.com', '27AAACD1234A1Z5', 'salt:hashed_password'))

    # 2. Clear existing demo data
    cursor.execute("DELETE FROM invoices")
    cursor.execute("DELETE FROM portal_records")
    cursor.execute("DELETE FROM reconciliation_logs") # Clear old logs if any

    # ─── SEED INVOICES (INTERNAL BOOKS) ───
    invoices = [
        # INV/2024/001 - TATA MOTORS (Perfect Match)
        {
            "filename": "inv_local_001.png",
            "invoice_number": "INV/2024/001",
            "supplier_gstin": "27AAACD1234A1Z5",
            "buyer_gstin": "27BBBCD5678B1Z2",
            "vendor_name": "TATA MOTORS LTD",
            "hsn_code": "8703",
            "place_of_supply": "27-Maharashtra",
            "date": "15-04-2024",
            "taxable_value": 100000.0,
            "tax_amount": 18000.0,
            "cgst_amount": 9000.0,
            "sgst_amount": 9000.0,
            "igst_amount": 0.0,
            "total_amount": 118000.0,
            "filing_period": "April 2024",
            "ocr_engine_used": "paddle",
            "invoice_type": "purchase",
            "status": "Pending",
            "confidence_score": 0.98,
            "raw_text": "TAX INVOICE\nTATA MOTORS LTD\nGSTIN: 27AAACD1234A1Z5\nInvoice No: INV/2024/001\nTaxable: 100000\nTotal: 118000",
            "user_id": 1
        },
        # AMZ-9901 - AMAZON (Mismatch Scenario)
        {
            "filename": "inv_mismatch_002.png",
            "invoice_number": "AMZ-9901",
            "supplier_gstin": "29AAACA1234A1Z5",
            "buyer_gstin": "27AAACD1234A1Z5",
            "vendor_name": "AMAZON SELLER SERVICES",
            "hsn_code": "9983",
            "place_of_supply": "27-Maharashtra",
            "date": "10-05-2024",
            "taxable_value": 20000.0,
            "tax_amount": 3600.0,
            "cgst_amount": 0.0,
            "sgst_amount": 0.0,
            "igst_amount": 3600.0,
            "total_amount": 23600.0,
            "filing_period": "May 2024",
            "ocr_engine_used": "paddle",
            "invoice_type": "purchase",
            "status": "Pending",
            "confidence_score": 0.92,
            "raw_text": "AMAZON\nInv: AMZ-9901\nTaxable: 20000\nIGST: 3600",
            "user_id": 1
        },
        # LOCAL-STORE-01 - MODERN STATIONERY (Missing in Portal)
        {
            "filename": "inv_missing_003.png",
            "invoice_number": "LOCAL-STORE-01",
            "supplier_gstin": "27MMMAD1234A1Z5",
            "buyer_gstin": "27AAACD1234A1Z5",
            "vendor_name": "MODERN STATIONERY",
            "hsn_code": "4817",
            "place_of_supply": "27-Maharashtra",
            "date": "12-05-2024",
            "taxable_value": 5000.0,
            "tax_amount": 250.0,
            "cgst_amount": 125.0,
            "sgst_amount": 125.0,
            "igst_amount": 0.0,
            "total_amount": 5250.0,
            "filing_period": "May 2024",
            "ocr_engine_used": "paddle",
            "invoice_type": "purchase",
            "status": "Pending",
            "confidence_score": 0.88,
            "raw_text": "MODERN STATIONERY\nInv: LOCAL-STORE-01\nTotal: 5250",
            "user_id": 1
        }
    ]

    for inv in invoices:
        cursor.execute("""
            INSERT INTO invoices (
                filename, invoice_number, gstin, supplier_gstin, buyer_gstin, vendor_name, 
                hsn_code, place_of_supply, date, taxable_value, tax_amount, 
                cgst_amount, sgst_amount, igst_amount, total_amount, 
                filing_period, ocr_engine_used, invoice_type, status, confidence_score, 
                raw_text, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            inv["filename"], inv["invoice_number"], inv["supplier_gstin"], inv["supplier_gstin"], 
            inv["buyer_gstin"], inv["vendor_name"], inv["hsn_code"], inv["place_of_supply"], 
            inv["date"], inv["taxable_value"], inv["tax_amount"], inv["cgst_amount"], 
            inv["sgst_amount"], inv["igst_amount"], inv["total_amount"], inv["filing_period"], 
            inv["ocr_engine_used"], inv["invoice_type"], inv["status"], inv["confidence_score"], 
            inv["raw_text"], inv["user_id"]
        ))

    # ─── SEED PORTAL RECORDS (GSTR-2B) ───
    portal_records = [
        # Matches INV/2024/001
        {
            "gstin": "27AAACD1234A1Z5",
            "invoice_number": "INV/2024/001",
            "taxable_value": 100000.0,
            "tax_amount": 18000.0,
            "total_amount": 118000.0,
            "date": "15-04-2024",
            "batch": "DEMO_BATCH_01"
        },
        # Mismatches AMZ-9901 (Portal has different tax)
        {
            "gstin": "29AAACA1234A1Z5",
            "invoice_number": "AMZ-9901",
            "taxable_value": 20000.0,
            "tax_amount": 3100.0, # Difference!
            "total_amount": 23100.0,
            "date": "10-05-2024",
            "batch": "DEMO_BATCH_01"
        },
        # Missing in Books (Only in Portal)
        {
            "gstin": "07AAACR1234R1Z1",
            "invoice_number": "MISC/882",
            "taxable_value": 15000.0,
            "tax_amount": 1800.0,
            "total_amount": 16800.0,
            "date": "20-05-2024",
            "batch": "DEMO_BATCH_01"
        }
    ]

    for p in portal_records:
        cursor.execute("""
            INSERT INTO portal_records (
                gstin, invoice_number, taxable_value, tax_amount, total_amount, date, upload_batch_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            p["gstin"], p["invoice_number"], p["taxable_value"], p["tax_amount"], 
            p["total_amount"], p["date"], p["batch"]
        ))

    conn.commit()
    conn.close()
    print("Demo data (Invoices + Portal Records) seeded successfully!")

if __name__ == "__main__":
    seed_data()
