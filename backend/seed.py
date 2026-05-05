import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine
import models
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

if db.query(models.User).filter_by(email="demo@khannatextile.com").first():
    print("✓ Already seeded. Skipping.")
    db.close()
    sys.exit(0)

from auth import hash_password

user = models.User(
    business_name="Khanna Textile Pvt Ltd",
    email="demo@khannatextile.com",
    gstin="27AABCK2177P1ZX",
    hashed_password=hash_password("Demo@1234"),
)
db.add(user)
db.flush()

invoices = [
    dict(invoice_number="RF/2024/0892",  gstin="27AABCR4321Q1ZY",
         vendor_name="Raj Fabrics Ltd",        date="05/01/2024",
         taxable_value=85000,  cgst_amount=7650,  sgst_amount=7650,
         igst_amount=0,        tax_amount=15300,  total_amount=100300,
         invoice_type="purchase", status="Matched",
         confidence_score=0.95, tally_status="Exported",   ocr_engine_used="gcv"),

    dict(invoice_number="MD/INV/2478",   gstin="27AABCM9988R1ZP",
         vendor_name="Mumbai Dyeing Co",       date="12/01/2024",
         taxable_value=42000,  cgst_amount=2100,  sgst_amount=2100,
         igst_amount=0,        tax_amount=4200,   total_amount=46200,
         invoice_type="purchase", status="Matched",
         confidence_score=0.91, tally_status="Exported",   ocr_engine_used="gcv"),

    dict(invoice_number="SS-2024-115",   gstin="24AABCS5571K1ZT",
         vendor_name="Surat Silk House",       date="18/01/2024",
         taxable_value=120000, cgst_amount=0,     sgst_amount=0,
         igst_amount=21600,    tax_amount=21600,  total_amount=141600,
         invoice_type="purchase", status="Matched",
         confidence_score=0.88, tally_status="Exported",   ocr_engine_used="gcv"),

    dict(invoice_number="RYT/2024/00445",gstin="27AAACR5055K1Z5",
         vendor_name="Reliance Yarn Trading",  date="25/01/2024",
         taxable_value=200000, cgst_amount=18000, sgst_amount=18000,
         igst_amount=0,        tax_amount=36000,  total_amount=236000,
         invoice_type="purchase", status="Matched",
         confidence_score=0.97, tally_status="Exported",   ocr_engine_used="gcv"),

    dict(invoice_number="DT/INV/889",    gstin="07AABCD7788Q1ZM",
         vendor_name="Delhi Threads & Co",     date="08/02/2024",
         taxable_value=55000,  cgst_amount=4950,  sgst_amount=4950,
         igst_amount=0,        tax_amount=9900,   total_amount=64900,
         invoice_type="purchase", status="Mismatch",
         confidence_score=0.72, tally_status="Not Exported", ocr_engine_used="paddle"),

    dict(invoice_number="LK-2024-0234",  gstin="03AABCL4432P1ZK",
         vendor_name="Ludhiana Knitwear Mills", date="14/02/2024",
         taxable_value=78500,  cgst_amount=3925,  sgst_amount=3925,
         igst_amount=0,        tax_amount=7850,   total_amount=86350,
         invoice_type="purchase", status="Mismatch",
         confidence_score=0.69, tally_status="Failed",      ocr_engine_used="paddle"),

    dict(invoice_number="CCI/2024/677",  gstin="33AABCC8821R1ZJ",
         vendor_name="Coimbatore Cotton Industries", date="22/02/2024",
         taxable_value=35000,  cgst_amount=0,     sgst_amount=0,
         igst_amount=6300,     tax_amount=6300,   total_amount=41300,
         invoice_type="purchase", status="Missing in Portal",
         confidence_score=0.83, tally_status="Not Exported", ocr_engine_used="gcv"),

    dict(invoice_number="TH/INV/2024/112", gstin="33AABCT9911S1ZQ",
         vendor_name="Tirupur Hosiery Works",  date="01/03/2024",
         taxable_value=62000,  cgst_amount=5580,  sgst_amount=5580,
         igst_amount=0,        tax_amount=11160,  total_amount=73160,
         invoice_type="purchase", status="Pending",
         confidence_score=0.61, tally_status="Not Exported", ocr_engine_used="paddle"),

    dict(invoice_number="KTL/2024/S001", gstin="29AABCF3344T1ZN",
         vendor_name="Fashion Studio Bengaluru", date="10/01/2024",
         taxable_value=150000, cgst_amount=0,     sgst_amount=0,
         igst_amount=27000,    tax_amount=27000,  total_amount=177000,
         invoice_type="sales",   status="Matched",
         confidence_score=0.96, tally_status="Exported",   ocr_engine_used="gcv"),

    dict(invoice_number="KTL/2024/S002", gstin="27AABCP7756U1ZR",
         vendor_name="Pune Garment Factory",   date="20/01/2024",
         taxable_value=95000,  cgst_amount=8550,  sgst_amount=8550,
         igst_amount=0,        tax_amount=17100,  total_amount=112100,
         invoice_type="sales",   status="Matched",
         confidence_score=0.93, tally_status="Exported",   ocr_engine_used="gcv"),

    dict(invoice_number="KTL/2024/S003", gstin="07AABCD4455V1ZS",
         vendor_name="Delhi Boutique House",   date="15/02/2024",
         taxable_value=220000, cgst_amount=0,     sgst_amount=0,
         igst_amount=39600,    tax_amount=39600,  total_amount=259600,
         invoice_type="sales",   status="Matched",
         confidence_score=0.94, tally_status="Not Exported", ocr_engine_used="gcv"),

    dict(invoice_number="KTL/2024/S004", gstin="08AABCJ9900W1ZT",
         vendor_name="Jaipur Export House",    date="28/02/2024",
         taxable_value=175000, cgst_amount=0,     sgst_amount=0,
         igst_amount=31500,    tax_amount=31500,  total_amount=206500,
         invoice_type="sales",   status="Mismatch",
         confidence_score=0.76, tally_status="Not Exported", ocr_engine_used="paddle"),

    dict(invoice_number="KTL/2024/S005", gstin="09AABCK1122X1ZU",
         vendor_name="Kanpur Kurti Kreations", date="10/03/2024",
         taxable_value=45000,  cgst_amount=0,     sgst_amount=0,
         igst_amount=8100,     tax_amount=8100,   total_amount=53100,
         invoice_type="sales",   status="Missing in Books",
         confidence_score=0.80, tally_status="Not Exported", ocr_engine_used="gcv"),

    dict(invoice_number="KTL/2024/S006", gstin="36AABCH5577Y1ZV",
         vendor_name="Hyderabad Fashion Mart", date="18/03/2024",
         taxable_value=98000,  cgst_amount=0,     sgst_amount=0,
         igst_amount=17640,    tax_amount=17640,  total_amount=115640,
         invoice_type="sales",   status="Pending",
         confidence_score=0.58, tally_status="Not Exported", ocr_engine_used="paddle"),
]

for data in invoices:
    db.add(models.Invoice(user_id=user.id, filename=f"demo_{data['invoice_number']}.pdf",
                          supplier_gstin=data["gstin"], buyer_gstin="27AABCK2177P1ZX",
                          filing_period="FY 2024-25", **data))

db.commit()
db.close()
print(f"✅ Seeded: 1 user + {len(invoices)} invoices")
print("   Login → demo@khannatextile.com / Demo@1234")
