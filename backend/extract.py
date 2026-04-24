import re
from typing import Dict, Any


# ─── Regex Patterns ────────────────────────────────────────────────────────────

# Indian GSTIN: 2-digit state code + PAN + 1 entity number + Z + 1 checksum
GSTIN_PATTERN = re.compile(
    r"\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]\b"
)

# Invoice number: after common labels
INV_NO_PATTERN = re.compile(
    r"(?i)(?:Invoice\s*(?:No|Number|#)|Inv\s*(?:No|#)|Bill\s*(?:No|Number)|Challan\s*No)[:\s#]*([A-Z0-9/\-]{3,20})"
)

# Date: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY or YYYY-MM-DD
DATE_PATTERN = re.compile(
    r"\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})\b"
)

# Taxable value (before GST)
TAXABLE_PATTERN = re.compile(
    r"(?i)(?:Taxable\s*(?:Value|Amount)|Sub\s*Total|Basic\s*Amount)[:\s₹Rs.]*([0-9,]+\.?\d{0,2})"
)

# CGST / SGST / IGST amounts
CGST_PATTERN = re.compile(
    r"(?i)CGST[:\s@%\d.]*(?:Amount)?[:\s₹Rs.]*([0-9,]+\.?\d{0,2})"
)
SGST_PATTERN = re.compile(
    r"(?i)SGST[:\s@%\d.]*(?:Amount)?[:\s₹Rs.]*([0-9,]+\.?\d{0,2})"
)
IGST_PATTERN = re.compile(
    r"(?i)IGST[:\s@%\d.]*(?:Amount)?[:\s₹Rs.]*([0-9,]+\.?\d{0,2})"
)

# Grand total
TOTAL_PATTERN = re.compile(
    r"(?i)(?:Grand\s*Total|Total\s*Amount|Amount\s*Payable|Net\s*Payable)[:\s₹Rs.]*([0-9,]+\.?\d{0,2})"
)

# Generic total fallback
GENERIC_TOTAL_PATTERN = re.compile(
    r"(?i)Total[:\s₹Rs.]*([0-9,]{4,}\.?\d{0,2})"
)


def _parse_amount(text: str) -> float:
    """Strip commas and convert to float."""
    try:
        return float(text.replace(",", "").strip())
    except (ValueError, AttributeError):
        return 0.0


def parse_invoice_data(raw_text: str) -> Dict[str, Any]:
    """
    Extracts structured invoice fields from raw OCR text using regex.
    Returns a dict with all fields and a confidence score.
    """
    if not raw_text:
        return _empty_result()

    # ── GSTIN ──────────────────────────────────────────────────────────────────
    all_gstins = GSTIN_PATTERN.findall(raw_text)
    # Prefer the second GSTIN (buyer's) if multiple found, else first
    if len(all_gstins) >= 2:
        gstin = all_gstins[1]
    elif len(all_gstins) == 1:
        gstin = all_gstins[0]
    else:
        gstin = "NOT_FOUND"

    # ── Invoice Number ─────────────────────────────────────────────────────────
    inv_match = INV_NO_PATTERN.search(raw_text)
    invoice_number = inv_match.group(1).strip() if inv_match else "UNKNOWN"

    # ── Date ───────────────────────────────────────────────────────────────────
    date_match = DATE_PATTERN.search(raw_text)
    date = date_match.group(0) if date_match else "UNKNOWN"

    # ── Tax Amounts ────────────────────────────────────────────────────────────
    cgst_match = CGST_PATTERN.search(raw_text)
    sgst_match = SGST_PATTERN.search(raw_text)
    igst_match = IGST_PATTERN.search(raw_text)

    cgst = _parse_amount(cgst_match.group(1)) if cgst_match else 0.0
    sgst = _parse_amount(sgst_match.group(1)) if sgst_match else 0.0
    igst = _parse_amount(igst_match.group(1)) if igst_match else 0.0
    tax_amount = round(cgst + sgst + igst, 2)

    # ── Taxable Value ──────────────────────────────────────────────────────────
    taxable_match = TAXABLE_PATTERN.search(raw_text)
    if taxable_match:
        taxable_value = _parse_amount(taxable_match.group(1))
    elif tax_amount > 0:
        # Reverse-calculate: assume 18% GST as fallback
        taxable_value = round(tax_amount / 0.18, 2)
    else:
        taxable_value = 0.0

    # ── Grand Total ────────────────────────────────────────────────────────────
    total_match = TOTAL_PATTERN.search(raw_text) or GENERIC_TOTAL_PATTERN.search(raw_text)
    if total_match:
        total_amount = _parse_amount(total_match.group(1))
    else:
        total_amount = round(taxable_value + tax_amount, 2)

    # If still no tax, infer from taxable + total
    if tax_amount == 0.0 and total_amount > taxable_value > 0:
        tax_amount = round(total_amount - taxable_value, 2)

    # If taxable_value still 0 but total exists, estimate
    if taxable_value == 0.0 and total_amount > 0:
        taxable_value = round(total_amount / 1.18, 2)
        tax_amount = round(total_amount - taxable_value, 2)

    # ── Confidence Score ───────────────────────────────────────────────────────
    score = _compute_confidence(gstin, invoice_number, date, taxable_value, tax_amount)

    return {
        "gstin": gstin,
        "invoice_number": invoice_number,
        "date": date,
        "taxable_value": round(taxable_value, 2),
        "tax_amount": round(tax_amount, 2),
        "total_amount": round(total_amount, 2),
        "invoice_type": "purchase",
        "status": "Pending",
        "confidence_score": score,
    }


def _compute_confidence(gstin, inv_no, date, taxable, tax) -> float:
    """Simple heuristic to score extraction quality (0.0 – 1.0)."""
    score = 0.0
    if gstin != "NOT_FOUND":
        score += 0.30
    if inv_no != "UNKNOWN":
        score += 0.25
    if date != "UNKNOWN":
        score += 0.20
    if taxable > 0:
        score += 0.15
    if tax > 0:
        score += 0.10
    return round(score, 2)


def _empty_result() -> Dict[str, Any]:
    return {
        "gstin": "NOT_FOUND",
        "invoice_number": "UNKNOWN",
        "date": "UNKNOWN",
        "taxable_value": 0.0,
        "tax_amount": 0.0,
        "total_amount": 0.0,
        "invoice_type": "purchase",
        "status": "Pending",
        "confidence_score": 0.0,
    }