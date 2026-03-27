import re

def validate_gst_data(data: Dict):
    """
    Checks if extracted fields follow legal GST formats.
    """
    errors = []
    
    # 1. Validate GSTIN Format
    gstin_regex = r"\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}"
    if not re.fullmatch(gstin_regex, data.get('gstin', '')):
        errors.append("Invalid GSTIN format.")

    # 2. Check Math: Taxable Value + Tax should equal Total (if total exists)
    # Basic PoC Check: Tax should be roughly 5%, 12%, 18%, or 28% of taxable value
    tax = data.get('tax_amount', 0)
    val = data.get('taxable_value', 0)
    if val > 0:
        ratio = round((tax / val) * 100)
        if ratio not in [0, 5, 12, 18, 28]:
            errors.append(f"Suspicious Tax Rate: {ratio}% detected.")

    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "confidence_score": 0.95 if len(errors) == 0 else 0.40 # [cite: 25]
    }