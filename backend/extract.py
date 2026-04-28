import re
from typing import Dict, Any, List

# ─── Regex Patterns ────────────────────────────────────────────────────────────

GSTIN_PATTERN = re.compile(r"\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]\b")

# Priority Invoice Patterns
INV_PATTERNS = [
    re.compile(r"(?i)Invoice\s*(?:No|Number|#)[:\s#]*([A-Z0-9/\-]{3,25})"),
    re.compile(r"(?i)Inv\s*(?:No|Num)[:\s#]*([A-Z0-9/\-]{3,25})"),
    re.compile(r"(?i)Bill\s*(?:No|Number)[:\s#]*([A-Z0-9/\-]{3,25})"),
    re.compile(r"(?i)(?:Tax\s+)?Invoice\s+([A-Z0-9/\-]{3,25})"),
    re.compile(r"\b[A-Z]{2,4}[/-]\d{4}[/-]\d{2,6}\b")
]

DATE_PATTERNS = [
    re.compile(r"\b\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}\b"),  # DD/MM/YYYY etc.
    re.compile(r"\b\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2}\b"),  # YYYY-MM-DD
    re.compile(r"(?i)\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b") # Month DD YYYY
]

TAXABLE_PATTERN = re.compile(
    r"(?i)(?:Taxable\s*Value|Assessable\s*Value|Sub\s*Total|Basic\s*Amount|Amount\s*Before\s*Tax)[:\s₹Rs.]*([0-9,]+\.?\d{0,2})"
)

TOTAL_PATTERN = re.compile(
    r"(?i)(?:Grand\s*Total|Total\s*Amount|Net\s*Payable|Amount\s*Due|Total\s*Invoice\s*Value)[:\s₹Rs.]*([0-9,]+\.?\d{0,2})"
)

TAX_PATTERN = re.compile(
    r"(?i)(CGST|SGST|IGST|CESS)\s*(?:@\s*(\d{1,2}(?:\.\d{1,2})?)%)?.*?[:\s₹Rs.]*([0-9,]+\.?\d{0,2})"
)

HSN_LABEL_PATTERN = re.compile(r"(?i)(?:HSN|SAC).*?(\b\d{4,8}\b)")

POS_PATTERN = re.compile(r"(?i)Place\s*of\s*Supply.*?([A-Za-z\s]+|\b\d{2}\b)")

def _parse_amount(text: str) -> float:
    try:
        return float(text.replace(",", "").strip())
    except (ValueError, AttributeError):
        return 0.0

def _extract_vendor_name(raw_text: str, supplier_gstin: str) -> str:
    if not supplier_gstin:
        return "UNKNOWN"
    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
    
    # Common company suffixes/prefixes
    company_keywords = ["m/s", "to:", "from:", "pvt ltd", "ltd", "llp", "& co", "traders", "enterprises", "industries"]
    
    for i, line in enumerate(lines):
        if supplier_gstin in line:
            # Check a few lines above and below
            context_lines = lines[max(0, i-3):min(len(lines), i+4)]
            for ctx in context_lines:
                ctx_lower = ctx.lower()
                if any(k in ctx_lower for k in company_keywords) and supplier_gstin not in ctx:
                    # Clean up 'To:' or 'From:'
                    ctx = re.sub(r'(?i)^(To|From):\s*', '', ctx)
                    # Exclude lines that look like generic headers
                    if not re.search(r'(?i)tax invoice|invoice|bill', ctx):
                        return ctx
            # If no keyword matched, return line immediately above if it exists
            if i > 0 and len(lines[i-1]) > 3:
                return lines[i-1]
    return "UNKNOWN"

def parse_invoice_data(raw_text: str) -> Dict[str, Any]:
    if not raw_text:
        return _empty_result()
    
    # 1. GSTIN (Supplier & Buyer)
    all_gstins = GSTIN_PATTERN.findall(raw_text)
    # Filter unique while preserving order
    unique_gstins = list(dict.fromkeys(all_gstins))
    
    supplier_gstin = unique_gstins[0] if len(unique_gstins) > 0 else None
    buyer_gstin = unique_gstins[1] if len(unique_gstins) > 1 else None
    
    # 2. Invoice Number
    invoice_number = "UNKNOWN"
    for pattern in INV_PATTERNS:
        match = pattern.search(raw_text)
        if match:
            invoice_number = match.group(1).strip()
            break
            
    # 3. Date
    date = "UNKNOWN"
    for pattern in DATE_PATTERNS:
        match = pattern.search(raw_text)
        if match:
            date = match.group(0).strip()
            break
            
    # 4. Tax Amounts
    tax_data = {
        "cgst_amount": 0.0, "cgst_rate": 0.0,
        "sgst_amount": 0.0, "sgst_rate": 0.0,
        "igst_amount": 0.0, "igst_rate": 0.0,
        "cess_amount": 0.0
    }
    
    # Try line-by-line fallback if patterns fail
    lines = raw_text.split('\n')
    for i, line in enumerate(lines):
        line_lower = line.lower()
        # Look for labels and check next few lines for numbers if not on current line
        for match in TAX_PATTERN.finditer(line):
            tax_type = match.group(1).lower()
            amount = _parse_amount(match.group(3))
            if amount == 0 and i + 1 < len(lines):
                # Try next line
                amount = _parse_amount(lines[i+1])
            
            if tax_type == "cgst": tax_data["cgst_amount"] = max(tax_data["cgst_amount"], amount)
            elif tax_type == "sgst": tax_data["sgst_amount"] = max(tax_data["sgst_amount"], amount)
            elif tax_type == "igst": tax_data["igst_amount"] = max(tax_data["igst_amount"], amount)

    # 5. Taxable Value Fallback
    taxable_match = TAXABLE_PATTERN.search(raw_text)
    taxable_value = _parse_amount(taxable_match.group(1)) if taxable_match else 0.0
    
    if taxable_value == 0:
        # Search for "Taxable" or "Value" and look at lines below
        for i, line in enumerate(lines):
            if "taxable" in line.lower() or "assessable" in line.lower():
                for offset in range(1, 5):
                    if i + offset < len(lines):
                        val = _parse_amount(lines[i+offset])
                        if val > 0:
                            taxable_value = val
                            break
                if taxable_value > 0: break

    # 6. Grand Total Fallback
    total_match = TOTAL_PATTERN.search(raw_text)
    total_amount = _parse_amount(total_match.group(1)) if total_match else 0.0
    if total_amount == 0:
        for i, line in enumerate(lines):
            if "total" in line.lower() and "taxable" not in line.lower():
                for offset in range(1, 5):
                    if i + offset < len(lines):
                        val = _parse_amount(lines[i+offset])
                        if val > 0:
                            total_amount = val
                            break
                if total_amount > 0: break

    # Total tax
    tax_amount = tax_data["cgst_amount"] + tax_data["sgst_amount"] + tax_data["igst_amount"] + (tax_data.get("cess_amount") or 0.0)

    # 7. Vendor Name
    vendor_name = _extract_vendor_name(raw_text, supplier_gstin)
    
    # 8. HSN/SAC
    hsn_match = HSN_LABEL_PATTERN.search(raw_text)
    hsn_code = hsn_match.group(1).strip() if hsn_match else "UNKNOWN"
    
    # 9. Place of Supply
    pos_match = POS_PATTERN.search(raw_text)
    place_of_supply = pos_match.group(1).strip()[:50] if pos_match else "UNKNOWN"
    
    # 10. Confidence Score
    score = _compute_confidence(
        supplier_gstin, buyer_gstin, invoice_number, date, 
        taxable_value, tax_amount, vendor_name
    )
    
    result = {
        "supplier_gstin": supplier_gstin,
        "buyer_gstin": buyer_gstin,
        "vendor_name": vendor_name,
        "invoice_number": invoice_number,
        "date": date,
        "hsn_code": hsn_code,
        "place_of_supply": place_of_supply,
        "taxable_value": round(taxable_value, 2),
        "tax_amount": round(tax_amount, 2),
        "total_amount": round(total_amount, 2),
        "invoice_type": "purchase",
        "status": "Pending",
        "confidence_score": score,
    }
    result.update(tax_data)
    return result

def _compute_confidence(supp_gstin, buy_gstin, inv_no, date, taxable, tax, vendor) -> float:
    # Max score 1.0
    score = 0.0
    if supp_gstin: score += 0.20
    if buy_gstin: score += 0.10
    if inv_no != "UNKNOWN": score += 0.20
    if date != "UNKNOWN": score += 0.15
    if taxable > 0: score += 0.15
    if tax > 0: score += 0.10
    if vendor != "UNKNOWN": score += 0.10
    return round(score, 2)

def _empty_result() -> Dict[str, Any]:
    return {
        "supplier_gstin": None,
        "buyer_gstin": None,
        "vendor_name": "UNKNOWN",
        "invoice_number": "UNKNOWN",
        "date": "UNKNOWN",
        "hsn_code": "UNKNOWN",
        "place_of_supply": "UNKNOWN",
        "taxable_value": 0.0,
        "tax_amount": 0.0,
        "total_amount": 0.0,
        "cgst_amount": 0.0, "cgst_rate": 0.0,
        "sgst_amount": 0.0, "sgst_rate": 0.0,
        "igst_amount": 0.0, "igst_rate": 0.0,
        "cess_amount": 0.0,
        "invoice_type": "purchase",
        "status": "Pending",
        "confidence_score": 0.0,
    }