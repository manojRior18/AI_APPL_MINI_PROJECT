import sqlite3

def migrate():
    conn = sqlite3.connect('gst_helper.db')
    cursor = conn.cursor()
    
    # Check existing columns
    cursor.execute('PRAGMA table_info(invoices)')
    columns = [row[1] for row in cursor.fetchall()]
    
    missing_columns = [
        ('supplier_gstin', 'TEXT'),
        ('buyer_gstin', 'TEXT'),
        ('vendor_name', 'TEXT'),
        ('hsn_code', 'TEXT'),
        ('place_of_supply', 'TEXT'),
        ('cgst_amount', 'REAL'),
        ('sgst_amount', 'REAL'),
        ('igst_amount', 'REAL'),
        ('filing_period', 'TEXT'),
        ('ocr_engine_used', 'TEXT')
    ]
    
    for col_name, col_type in missing_columns:
        if col_name not in columns:
            print(f"Adding column {col_name}...")
            cursor.execute(f'ALTER TABLE invoices ADD COLUMN {col_name} {col_type}')
    
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
