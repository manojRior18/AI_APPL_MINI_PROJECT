from typing import List, Dict

def reconcile_invoices(internal_records: List[Dict], external_records: List[Dict]):
    """
    Compares Internal Books vs External GST Records.
    Matches are based on GSTIN + Invoice Number.
    """
    reconciliation_results = []
    
    # Create a lookup map for external records for faster searching
    external_map = { (rec['gstin'], rec['invoice_number']): rec for rec in external_records }
    internal_checked_keys = set()

    for internal in internal_records:
        key = (internal['gstin'], internal['invoice_number'])
        internal_checked_keys.add(key)
        
        if key in external_map:
            external = external_map[key]
            # Check for value discrepancies (Taxable value or Tax amount)
            val_diff = abs(internal['taxable_value'] - external['taxable_value'])
            tax_diff = abs(internal['tax_amount'] - external['tax_amount'])
            
            if val_diff < 1.0 and tax_diff < 1.0:
                status = "Matched"
                message = "Invoice matches perfectly."
            else:
                status = "Mismatch"
                message = f"Value difference found: ₹{val_diff + tax_diff}"
            
            reconciliation_results.append({**internal, "status": status, "remarks": message})
        else:
            reconciliation_results.append({**internal, "status": "Missing in Portal", "remarks": "Not found in GST portal records."})

    # Find records that are in the Portal but NOT in our internal books
    for key, external in external_map.items():
        if key not in internal_checked_keys:
            reconciliation_results.append({**external, "status": "Missing in Books", "remarks": "Portal has this, but you haven't uploaded it."})

    return reconciliation_results