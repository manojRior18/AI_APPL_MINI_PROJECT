import re

def parse_invoice_data(raw_text: str):
    """
    Uses Regex to find GSTIN, Invoice Number, Dates, and Amounts.
    """
    # 1. GSTIN Pattern (India: 2 digits + 10 alphanumeric + 1 digit + Z + 1 alphanumeric)
    gstin_pattern = r"\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}"
    
    # 2. Invoice Number Pattern (Looking for labels like 'Inv No', 'Invoice #', etc.)
    inv_no_pattern = r"(?i)(?:Invoice\s?No|Inv\s?#|Bill\s?No)[:\s]*([A-Z0-9\/-]+)"
    
    # 3. Date Pattern (DD-MM-YYYY or DD/MM/YY)
    date_pattern = r"\d{2}[-\/\.]\d{2}[-\/\.]\d{2,4}"

    # 4. Amount Pattern (Looking for 'Total' or 'Grand Total' followed by a number)
    amount_pattern = r"(?i)(?:Total|Grand\s?Total|Amount)[:\s]*[₹Rs\.]?\s?([\d,]+\.\d{2})"

    # Extraction Logic
    gstin_match = re.search(gstin_pattern, raw_text)
    inv_match = re.search(inv_no_pattern, raw_text)
    date_match = re.search(date_pattern, raw_text)
    amount_match = re.search(amount_pattern, raw_text)

    # Clean up the amount (remove commas)
    final_amount = 0.0
    if amount_match:
        try:
            final_amount = float(amount_match.group(1).replace(',', ''))
        except ValueError:
            final_amount = 0.0

    return {
        "gstin": gstin_match.group(0) if gstin_match else "NOT_FOUND",
        "invoice_number": inv_match.group(1) if inv_match else "UNKNOWN",
        "date": date_match.group(0) if date_match else "UNKNOWN",
        "taxable_value": final_amount, # In a PoC, we simplify the math initially
        "tax_amount": round(final_amount * 0.18, 2), # Assuming 18% GST for PoC logic
        "status": "Pending" # Default status for reconciliation 
    }