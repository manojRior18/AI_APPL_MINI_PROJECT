from typing import List, Dict, Any


TOLERANCE = 1.0  # ₹1 tolerance for floating point / rounding differences


def reconcile_invoices(
    internal_records: List[Dict[str, Any]],
    external_records: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Reconciles internal invoice records (from DB) against external GST portal records.

    Match key: (GSTIN, Invoice Number)
    Statuses:
        - Matched            : Both found, values agree within tolerance
        - Mismatch           : Both found, but value discrepancy detected
        - Missing in Portal  : In internal books, not in GST portal
        - Missing in Books   : In GST portal, not in internal books
    """
    results: List[Dict[str, Any]] = []

    # Build lookup from external records
    external_map: Dict[tuple, Dict] = {}
    for rec in external_records:
        key = (_clean(rec.get("gstin", "")), _clean(rec.get("invoice_number", "")))
        external_map[key] = rec

    internal_keys_seen = set()

    for internal in internal_records:
        key = (_clean(internal.get("gstin", "")), _clean(internal.get("invoice_number", "")))
        internal_keys_seen.add(key)

        if key in external_map:
            external = external_map[key]
            val_diff = abs(
                float(internal.get("taxable_value", 0)) - float(external.get("taxable_value", 0))
            )
            tax_diff = abs(
                float(internal.get("tax_amount", 0)) - float(external.get("tax_amount", 0))
            )

            if val_diff <= TOLERANCE and tax_diff <= TOLERANCE:
                status = "Matched"
                remarks = "Invoice matches GST portal records perfectly."
            else:
                status = "Mismatch"
                parts = []
                if val_diff > TOLERANCE:
                    parts.append(f"Taxable value differs by ₹{val_diff:.2f}")
                if tax_diff > TOLERANCE:
                    parts.append(f"Tax amount differs by ₹{tax_diff:.2f}")
                remarks = "; ".join(parts) + ". Verify with your CA."

            results.append({
                **_safe_dict(internal),
                "status": status,
                "remarks": remarks,
                "external_taxable": float(external.get("taxable_value", 0)),
                "external_tax": float(external.get("tax_amount", 0)),
            })

        else:
            results.append({
                **_safe_dict(internal),
                "status": "Missing in Portal",
                "remarks": "Invoice found in your books but absent from GST portal. May indicate delayed filing.",
                "external_taxable": None,
                "external_tax": None,
            })

    # Records in portal but not in books
    for key, external in external_map.items():
        if key not in internal_keys_seen:
            results.append({
                "invoice_number": external.get("invoice_number", "UNKNOWN"),
                "gstin": external.get("gstin", ""),
                "taxable_value": float(external.get("taxable_value", 0)),
                "tax_amount": float(external.get("tax_amount", 0)),
                "total_amount": float(external.get("total_amount", 0)),
                "date": external.get("date", "UNKNOWN"),
                "invoice_type": external.get("invoice_type", "purchase"),
                "status": "Missing in Books",
                "remarks": "GST portal has this invoice but it has not been uploaded to the system.",
                "external_taxable": float(external.get("taxable_value", 0)),
                "external_tax": float(external.get("tax_amount", 0)),
            })

    return results


def generate_summary(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compute aggregate metrics from reconciliation results."""
    total = len(results)
    matched = sum(1 for r in results if r["status"] == "Matched")
    mismatch = sum(1 for r in results if r["status"] == "Mismatch")
    missing_portal = sum(1 for r in results if r["status"] == "Missing in Portal")
    missing_books = sum(1 for r in results if r["status"] == "Missing in Books")
    pending = sum(1 for r in results if r["status"] == "Pending")

    compliance_score = round((matched / total) * 100, 1) if total > 0 else 0.0
    total_tax = sum(r.get("tax_amount", 0) for r in results)

    return {
        "total": total,
        "matched": matched,
        "mismatch": mismatch,
        "missing_in_portal": missing_portal,
        "missing_in_books": missing_books,
        "pending": pending,
        "compliance_score": compliance_score,
        "total_tax_value": round(total_tax, 2),
    }


def _clean(value: str) -> str:
    return str(value).strip().upper()


def _safe_dict(record: Dict) -> Dict:
    """Remove SQLAlchemy internal state keys."""
    return {k: v for k, v in record.items() if not k.startswith("_")}