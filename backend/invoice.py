from PIL import Image, ImageDraw, ImageFont

def create_demo_invoice(filename, gstin, inv_no, total):
    # Create a white canvas
    img = Image.new('RGB', (600, 400), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    
    # Simple Text (Tesseract loves this)
    text = f"""
    TAX INVOICE
    
    Supplier: Demo Corp
    GSTIN: {gstin}
    Invoice No: {inv_no}
    Date: 24-04-2026
    
    ----------------------------
    Total Taxable: {total}.00
    GST (18%): {float(total)*0.18}
    GRAND TOTAL: {float(total)*1.18}
    ----------------------------
    """
    d.text((50, 50), text, fill=(0, 0, 0))
    img.save(filename)

# Generate one for your demo
create_demo_invoice("match_test.png", "27ABCDE1234F1Z5", "INV-101", "10000")