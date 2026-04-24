import re
from typing import Dict, Any, List


# Valid Indian GST tax rates (%)
VALID_GST_RATES = {0, 5, 12, 18, 28}

GSTIN_REGEX = re.compile(
    r"^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$"
)

# Valid 2-digit Indian state codes
VALID_STATE_CODES = {
    "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
    "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
    "31", "32", "33", "34", "35", "36", "37", "38", "97", "99"
}


def validate_gst_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates extracted invoice fields against GST compliance rules.
    Returns a validation report with errors, warnings, and a confidence score.
    """
    errors: List[str] = []
    warnings: List[str] = []

    gstin = data.get("gstin", "")
    taxable = data.get("taxable_value", 0.0)
    tax = data.get("tax_amount", 0.0)
    total = data.get("total_amount", 0.0)
    invoice_number = data.get("invoice_number", "")
    date = data.get("date", "")

    # ── 1. GSTIN Validation ───────────────────────────────────────────────────
    if gstin == "NOT_FOUND" or not gstin:
        errors.append("GSTIN could not be extracted from the document.")
    elif not GSTIN_REGEX.match(gstin):
        errors.append(f"GSTIN '{gstin}' does not match the 15-character GST format.")
    else:
        state_code = gstin[:2]
        if state_code not in VALID_STATE_CODES:
            warnings.append(f"State code '{state_code}' in GSTIN is unrecognized.")

    # ── 2. Invoice Number ─────────────────────────────────────────────────────
    if invoice_number in ("UNKNOWN", "", None):
        warnings.append("Invoice number could not be extracted.")
    elif len(invoice_number) < 3:
        warnings.append("Invoice number seems too short; verify manually.")

    # ── 3. Date Validation ────────────────────────────────────────────────────
    if date in ("UNKNOWN", "", None):
        warnings.append("Invoice date could not be extracted.")

    # ── 4. Tax Rate Validation ────────────────────────────────────────────────
    if taxable > 0 and tax > 0:
        rate = round((tax / taxable) * 100)
        if rate not in VALID_GST_RATES:
            # Allow slight rounding tolerance
            nearest = min(VALID_GST_RATES, key=lambda x: abs(x - rate))
            if abs(rate - nearest) <= 1:
                warnings.append(
                    f"Tax rate {rate}% is close to {nearest}% but may need rounding correction."
                )
            else:
                errors.append(
                    f"Suspicious tax rate: {rate}% is not a valid GST rate (0/5/12/18/28%)."
                )
    elif taxable == 0 and tax == 0:
        warnings.append("Both taxable value and tax amount are zero. Check OCR quality.")

    # ── 5. Math Consistency Check ─────────────────────────────────────────────
    if taxable > 0 and tax > 0 and total > 0:
        expected_total = round(taxable + tax, 2)
        if abs(expected_total - total) > 10:  # ₹10 tolerance
            warnings.append(
                f"Total amount (₹{total}) doesn't match taxable + tax (₹{expected_total}). Possible extraction error."
            )

    # ── 6. Value Sanity ───────────────────────────────────────────────────────
    if taxable < 0 or tax < 0:
        errors.append("Negative monetary values detected. Please verify the document.")

    if taxable > 10_000_000:  # ₹1 Crore
        warnings.append("Invoice value exceeds ₹1 Crore. Please verify this is correct.")

    # ── Confidence Score ──────────────────────────────────────────────────────
    base_confidence = data.get("confidence_score", 0.5)
    penalty = len(errors) * 0.15 + len(warnings) * 0.05
    final_confidence = max(0.0, round(base_confidence - penalty, 2))

    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "confidence_score": final_confidence,
        "tax_rate_detected": (
            round((tax / taxable) * 100) if taxable > 0 and tax > 0 else None
        ),
    }