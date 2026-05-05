from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import database, models
from tally_client import tally, TallyConnectionError, TallyVoucherError

router = APIRouter(prefix="/tally", tags=["Tally Integration"])


class TallyConfig(BaseModel):
    tally_url: str = "http://localhost:9000"
    company_name: str


class PushRequest(BaseModel):
    invoice_ids: List[int]
    company_name: str


# ── GET /tally/test ───────────────────────────────────────────────────────────
# Test connection to TallyPrime.
# Returns: { connected: bool, companies: list, tally_url: str }
# On failure: returns { connected: false, error: "..." } with HTTP 200
# (never raise 500 — the frontend must handle gracefully)

@router.get("/test")
async def test_tally_connection(tally_url: str = Query("http://localhost:9000")):
    from tally_client import TallyClient
    client = TallyClient(url=tally_url)
    try:
        result = client.test_connection()
        return result
    except TallyConnectionError as e:
        return {"connected": False, "error": str(e), "tally_url": tally_url}


# ── GET /tally/companies ──────────────────────────────────────────────────────
# Returns list of companies currently open in TallyPrime.

@router.get("/companies")
async def get_companies(tally_url: str = Query("http://localhost:9000")):
    from tally_client import TallyClient
    client = TallyClient(url=tally_url)
    try:
        result = client.test_connection()
        return {"companies": result.get("companies", [])}
    except TallyConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))


# ── POST /tally/push/{invoice_id} ─────────────────────────────────────────────
# Push a single invoice to Tally.
# Body: { company_name: str }
# Returns: { success, invoice_number, voucher_type, message }

@router.post("/push/{invoice_id}")
async def push_single_invoice(
    invoice_id: int,
    body: dict = Body(...),
    db: Session = Depends(database.get_db),
):
    company_name = body.get("company_name", "")
    if not company_name:
        raise HTTPException(status_code=400, detail="company_name is required.")

    inv = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found.")

    invoice_dict = {
        "invoice_number": inv.invoice_number,
        "date": inv.date,
        "vendor_name":   getattr(inv, "vendor_name", None) or inv.gstin,
        "gstin":         inv.gstin,
        "taxable_value": inv.taxable_value,
        "cgst_amount":   getattr(inv, "cgst_amount", 0) or 0,
        "sgst_amount":   getattr(inv, "sgst_amount", 0) or 0,
        "igst_amount":   getattr(inv, "igst_amount", 0) or 0,
        "total_amount":  inv.total_amount,
    }

    from tally_client import TallyClient
    client = TallyClient()
    try:
        if inv.invoice_type == "sales":
            result = client.push_sales_voucher(invoice_dict, company_name)
        else:
            result = client.push_purchase_voucher(invoice_dict, company_name)

        # Mark invoice as exported to Tally in DB
        inv.tally_status = "Exported"
        db.commit()
        return result

    except TallyConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except TallyVoucherError as e:
        raise HTTPException(status_code=422, detail=str(e))


# ── POST /tally/push-batch ────────────────────────────────────────────────────
# Push multiple invoices in one call.
# Body: { invoice_ids: [1,2,3,...], company_name: "..." }
# Returns: { total, success_count, failed_count, results: [...] }

@router.post("/push-batch")
async def push_batch(body: PushRequest, db: Session = Depends(database.get_db)):
    from tally_client import TallyClient
    client = TallyClient()
    results = []
    success_count = 0
    failed_count  = 0

    for inv_id in body.invoice_ids:
        inv = db.query(models.Invoice).filter(models.Invoice.id == inv_id).first()
        if not inv:
            results.append({"invoice_id": inv_id, "success": False, "message": "Not found."})
            failed_count += 1
            continue

        invoice_dict = {
            "invoice_number": inv.invoice_number,
            "date":           inv.date,
            "vendor_name":    getattr(inv, "vendor_name", None) or inv.gstin,
            "gstin":          inv.gstin,
            "taxable_value":  inv.taxable_value,
            "cgst_amount":    getattr(inv, "cgst_amount", 0) or 0,
            "sgst_amount":    getattr(inv, "sgst_amount", 0) or 0,
            "igst_amount":    getattr(inv, "igst_amount", 0) or 0,
            "total_amount":   inv.total_amount,
        }

        try:
            if inv.invoice_type == "sales":
                res = client.push_sales_voucher(invoice_dict, body.company_name)
            else:
                res = client.push_purchase_voucher(invoice_dict, body.company_name)
            res["invoice_id"] = inv_id
            results.append(res)
            inv.tally_status = "Exported"
            success_count += 1
        except (TallyConnectionError, TallyVoucherError) as e:
            results.append({"invoice_id": inv_id, "success": False, "message": str(e)})
            inv.tally_status = "Failed"
            failed_count += 1

    db.commit()
    return {
        "total": len(body.invoice_ids),
        "success_count": success_count,
        "failed_count": failed_count,
        "results": results,
    }


# ── GET /tally/status ─────────────────────────────────────────────────────────
# Returns count of invoices by tally_status field.

@router.get("/status")
async def get_tally_export_status(db: Session = Depends(database.get_db)):
    from sqlalchemy import func
    from models import Invoice
    rows = (
        db.query(Invoice.tally_status, func.count(Invoice.id))
        .group_by(Invoice.tally_status)
        .all()
    )
    return {
        "status_counts": {row[0] or "Not Exported": row[1] for row in rows}
    }
