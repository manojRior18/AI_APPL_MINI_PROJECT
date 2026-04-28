import re
from typing import Dict, Any, List
from datetime import datetime

VALID_GST_RATES = {0, 5, 12, 18, 28}

GSTIN_REGEX = re.compile(r"^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$")

VALID_STATE_CODES = {
    f"{i:02d}" for i in range(1, 40)
}
VALID_STATE_CODES.add("97")
VALID_STATE_CODES.add("99")

def _infer_filing_period(date_str: str) -> str:
    if not date_str or date_str == "UNKNOWN":
        return "UNKNOWN"
    try:
        # Try a few common formats
        dt = None
        for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y", "%Y-%m-%d"):
            try:
                dt = datetime.strptime(date_str, fmt)
                break
            except ValueError:
                continue
                
        if dt:
            month = dt.strftime("%B")
            year = dt.year
            # FY is April to March
            if dt.month >= 4:
                fy = f"FY{year}-{str(year+1)[-2:]}"
                q = (dt.month - 4) // 3 + 1
            else:
                fy = f"FY{year-1}-{str(year)[-2:]}"
                q = (dt.month + 8) // 3
            return f"{month} {year} \u2192 Q{q} {fy}"
    except Exception:
        pass
    return "UNKNOWN"

def validate_gst_data(data: Dict[str, Any]) -> Dict[str, Any]:
    errors: List[str] = []
    warnings: List[str] = []

    supplier_gstin = data.get("supplier_gstin")
    buyer_gstin = data.get("buyer_gstin")
    taxable = data.get("taxable_value", 0.0)
    tax = data.get("tax_amount", 0.0)
    total = data.get("total_amount", 0.0)
    invoice_number = data.get("invoice_number", "")
    date = data.get("date", "")
    
    cgst = data.get("cgst_amount", 0.0)
    sgst = data.get("sgst_amount", 0.0)
    igst = data.get("igst_amount", 0.0)
    
    hsn_code = data.get("hsn_code", "UNKNOWN")
    pos = data.get("place_of_supply", "UNKNOWN")

    # ── 1. GSTIN Validation ───────────────────────────────────────────────────
    for role, gstin in [("Supplier", supplier_gstin), ("Buyer", buyer_gstin)]:
        if gstin and gstin != "NOT_FOUND":
            if not GSTIN_REGEX.match(gstin):
                errors.append(f"{role} GSTIN '{gstin}' does not match the 15-character GST format.")
            else:
                state_code = gstin[:2]
                if state_code not in VALID_STATE_CODES:
                    warnings.append(f"State code '{state_code}' in {role} GSTIN is unrecognized.")
        elif role == "Supplier":
            errors.append("Supplier GSTIN could not be extracted from the document.")

    # ── 2. Invoice Number & Date ──────────────────────────────────────────────
    if invoice_number in ("UNKNOWN", "", None):
        warnings.append("Invoice number could not be extracted.")
    elif len(invoice_number) < 3:
        warnings.append("Invoice number seems too short; verify manually.")

    if date in ("UNKNOWN", "", None):
        warnings.append("Invoice date could not be extracted.")

    # ── 3. CGST / SGST / IGST Rules ───────────────────────────────────────────
    if cgst > 0 or sgst > 0:
        if abs(cgst - sgst) > 1.0: # small rounding tolerance
            errors.append(f"CGST (\u20b9{cgst}) and SGST (\u20b9{sgst}) must be equal.")
        if igst > 0:
            errors.append("IGST should not be present when CGST/SGST are charged.")
    elif igst > 0:
        if cgst > 0 or sgst > 0:
            errors.append("CGST/SGST should not be present when IGST is charged.")

    # ── 4. HSN Code Validation ────────────────────────────────────────────────
    if hsn_code and hsn_code != "UNKNOWN":
        if len(hsn_code) not in [4, 6, 8]:
            warnings.append(f"HSN code '{hsn_code}' has unusual length ({len(hsn_code)} digits). Expected 4, 6, or 8.")
    else:
        warnings.append("HSN/SAC code could not be extracted.")

    # ── 5. Place of Supply Validation ─────────────────────────────────────────
    if pos != "UNKNOWN" and buyer_gstin and buyer_gstin != "NOT_FOUND":
        buyer_state_code = buyer_gstin[:2]
        # Very basic check: If POS starts with a 2-digit number, check if it matches buyer
        pos_match = re.match(r"^(\d{2})", pos)
        if pos_match:
            pos_code = pos_match.group(1)
            if pos_code != buyer_state_code:
                warnings.append(f"Place of Supply code '{pos_code}' doesn't match Buyer GSTIN state code '{buyer_state_code}'.")

    # ── 6. Filing Period Inference ────────────────────────────────────────────
    filing_period = _infer_filing_period(date)
    data["filing_period"] = filing_period

    # ── 7. Tax Rate & Math Sanity ─────────────────────────────────────────────
    if taxable > 0 and tax > 0:
        rate = round((tax / taxable) * 100)
        if rate not in VALID_GST_RATES:
            nearest = min(VALID_GST_RATES, key=lambda x: abs(x - rate))
            if abs(rate - nearest) <= 1:
                warnings.append(f"Tax rate {rate}% is close to {nearest}% but may need rounding correction.")
            else:
                errors.append(f"Suspicious tax rate: {rate}% is not a valid GST rate (0/5/12/18/28%).")
    elif taxable == 0 and tax == 0:
        warnings.append("Both taxable value and tax amount are zero. Check OCR quality.")

    if taxable > 0 and tax > 0 and total > 0:
        expected_total = round(taxable + tax, 2)
        if abs(expected_total - total) > 10:  # ₹10 tolerance
            warnings.append(f"Total amount (\u20b9{total}) doesn't match taxable + tax (\u20b9{expected_total}).")

    if taxable < 0 or tax < 0:
        errors.append("Negative monetary values detected. Please verify the document.")

    if taxable > 10_000_000:
        warnings.append("Invoice value exceeds \u20b91 Crore. Please verify this is correct.")

    # ── Confidence Score ──────────────────────────────────────────────────────
    base_confidence = data.get("confidence_score", 0.5)
    penalty = len(errors) * 0.15 + len(warnings) * 0.05
    final_confidence = max(0.0, round(base_confidence - penalty, 2))

    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "confidence_score": final_confidence,
        "filing_period": filing_period,
        "tax_rate_detected": round((tax / taxable) * 100) if taxable > 0 and tax > 0 else None
    }