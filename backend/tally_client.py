import httpx
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Optional
import os

TALLY_URL = os.getenv("TALLY_URL", "http://localhost:9000")
TALLY_TIMEOUT = int(os.getenv("TALLY_TIMEOUT", "10"))


class TallyConnectionError(Exception):
    pass

class TallyVoucherError(Exception):
    pass


class TallyClient:
    def __init__(self, url: str = TALLY_URL):
        self.url = url

    def _post(self, xml_body: str) -> str:
        """POST raw XML to Tally and return raw XML response string."""
        try:
            response = httpx.post(
                self.url,
                content=xml_body.encode("utf-8"),
                headers={"Content-Type": "application/xml"},
                timeout=TALLY_TIMEOUT,
            )
            response.raise_for_status()
            return response.text
        except httpx.ConnectError:
            raise TallyConnectionError(
                f"Cannot connect to TallyPrime at {self.url}. "
                "Ensure TallyPrime is open and XML API is enabled on port 9000."
            )
        except httpx.TimeoutException:
            raise TallyConnectionError(
                f"Tally connection timed out after {TALLY_TIMEOUT}s."
            )

    # ── Connection Test ────────────────────────────────────────────────────────

    def test_connection(self) -> dict:
        """Ping Tally and return company info if connected."""
        xml = """
        <ENVELOPE>
          <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
          </HEADER>
          <BODY>
            <EXPORTDATA>
              <REQUESTDESC>
                <REPORTNAME>List of Companies</REPORTNAME>
              </REQUESTDESC>
            </EXPORTDATA>
          </BODY>
        </ENVELOPE>
        """
        response_text = self._post(xml)
        companies = self._parse_company_list(response_text)
        return {
            "connected": True,
            "tally_url": self.url,
            "companies": companies,
        }

    def _parse_company_list(self, xml_text: str) -> list:
        """Parse Tally company list XML response."""
        try:
            root = ET.fromstring(xml_text)
            companies = []
            for company in root.iter("COMPANY"):
                name = company.findtext("NAME") or company.text
                if name:
                    companies.append(name.strip())
            return companies if companies else ["Default Company"]
        except ET.ParseError:
            return []

    # ── Ledger Management ──────────────────────────────────────────────────────

    def get_ledgers(self, company_name: str) -> list:
        """Fetch all ledgers from a Tally company."""
        xml = f"""
        <ENVELOPE>
          <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
          </HEADER>
          <BODY>
            <EXPORTDATA>
              <REQUESTDESC>
                <REPORTNAME>List of Ledgers</REPORTNAME>
                <STATICVARIABLES>
                  <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                  <SVCURRENTCOMPANY>{company_name}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
              </REQUESTDESC>
            </EXPORTDATA>
          </BODY>
        </ENVELOPE>
        """
        response_text = self._post(xml)
        return self._parse_ledger_list(response_text)

    def _parse_ledger_list(self, xml_text: str) -> list:
        try:
            root = ET.fromstring(xml_text)
            return [
                {"name": led.findtext("NAME", ""), "group": led.findtext("PARENT", "")}
                for led in root.iter("LEDGER")
            ]
        except ET.ParseError:
            return []

    def create_ledger(self, name: str, group: str, gstin: str = "",
                      company_name: str = "") -> bool:
        """Create a ledger in Tally if it does not exist."""
        gstin_tag = f"<GSTREGISTRATIONDETAILS.LIST><APPLICABLEFROM>20170701</APPLICABLEFROM><GSTIN>{gstin}</GSTIN></GSTREGISTRATIONDETAILS.LIST>" if gstin else ""
        xml = f"""
        <ENVELOPE>
          <HEADER>
            <TALLYREQUEST>Import Data</TALLYREQUEST>
          </HEADER>
          <BODY>
            <IMPORTDATA>
              <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES>
                  <SVCURRENTCOMPANY>{company_name}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
              </REQUESTDESC>
              <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                  <LEDGER NAME="{name}" Action="Create">
                    <NAME>{name}</NAME>
                    <PARENT>{group}</PARENT>
                    <TAXTYPE>GST</TAXTYPE>
                    {gstin_tag}
                  </LEDGER>
                </TALLYMESSAGE>
              </REQUESTDATA>
            </IMPORTDATA>
          </BODY>
        </ENVELOPE>
        """
        response_text = self._post(xml)
        return "CREATED" in response_text.upper() or "IMPORTED" in response_text.upper()

    def ensure_gst_ledgers(self, company_name: str):
        """
        Ensure standard GST tax ledgers exist in Tally.
        Creates: CGST, SGST, IGST under 'Duties & Taxes' group if missing.
        """
        existing = [l["name"].upper() for l in self.get_ledgers(company_name)]
        ledgers_needed = [
            ("CGST",  "Duties & Taxes"),
            ("SGST",  "Duties & Taxes"),
            ("IGST",  "Duties & Taxes"),
        ]
        for name, group in ledgers_needed:
            if name not in existing:
                self.create_ledger(name, group, company_name=company_name)

    # ── Voucher Creation ───────────────────────────────────────────────────────

    def push_purchase_voucher(self, invoice: dict, company_name: str) -> dict:
        """
        Push a purchase invoice into Tally as a Purchase Voucher.

        invoice dict keys:
          invoice_number, date (DD/MM/YYYY or YYYYMMDD), vendor_name,
          gstin (supplier GSTIN), taxable_value, cgst_amount, sgst_amount,
          igst_amount, total_amount
        """
        self.ensure_gst_ledgers(company_name)
        self._ensure_party_ledger(
            invoice.get("vendor_name", "Unknown Party"),
            "Sundry Creditors",
            invoice.get("gstin", ""),
            company_name,
        )

        date_str  = self._format_date(invoice.get("date", ""))
        inv_no    = invoice.get("invoice_number", "UNKNOWN")
        party     = invoice.get("vendor_name") or invoice.get("gstin", "Unknown Party")
        taxable   = float(invoice.get("taxable_value", 0))
        cgst      = float(invoice.get("cgst_amount", 0))
        sgst      = float(invoice.get("sgst_amount", 0))
        igst      = float(invoice.get("igst_amount", 0))
        total     = float(invoice.get("total_amount", 0)) or (taxable + cgst + sgst + igst)

        # Build ledger entries — must balance: Cr party = Dr purchases + Dr taxes
        ledger_entries = self._build_purchase_ledger_entries(
            party, taxable, cgst, sgst, igst, total
        )

        xml = f"""
        <ENVELOPE>
          <HEADER>
            <TALLYREQUEST>Import Data</TALLYREQUEST>
          </HEADER>
          <BODY>
            <IMPORTDATA>
              <REQUESTDESC>
                <REPORTNAME>Vouchers</REPORTNAME>
                <STATICVARIABLES>
                  <SVCURRENTCOMPANY>{company_name}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
              </REQUESTDESC>
              <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                  <VOUCHER VCHTYPE="Purchase" Action="Create" OBJVIEW="Invoice Voucher View">
                    <DATE>{date_str}</DATE>
                    <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
                    <VOUCHERNUMBER>{inv_no}</VOUCHERNUMBER>
                    <PARTYLEDGERNAME>{party}</PARTYLEDGERNAME>
                    <GSTREGISTRATIONNUMBER>{invoice.get("gstin","")}</GSTREGISTRATIONNUMBER>
                    {ledger_entries}
                  </VOUCHER>
                </TALLYMESSAGE>
              </REQUESTDATA>
            </IMPORTDATA>
          </BODY>
        </ENVELOPE>
        """
        response = self._post(xml)
        return self._parse_voucher_response(response, inv_no, "purchase")

    def push_sales_voucher(self, invoice: dict, company_name: str) -> dict:
        """
        Push a sales invoice into Tally as a Sales Voucher.
        Same invoice dict shape as push_purchase_voucher, but
        vendor_name = buyer name, gstin = buyer GSTIN.
        """
        self.ensure_gst_ledgers(company_name)
        self._ensure_party_ledger(
            invoice.get("vendor_name", "Cash"),
            "Sundry Debtors",
            invoice.get("gstin", ""),
            company_name,
        )

        date_str  = self._format_date(invoice.get("date", ""))
        inv_no    = invoice.get("invoice_number", "UNKNOWN")
        party     = invoice.get("vendor_name") or "Cash"
        taxable   = float(invoice.get("taxable_value", 0))
        cgst      = float(invoice.get("cgst_amount", 0))
        sgst      = float(invoice.get("sgst_amount", 0))
        igst      = float(invoice.get("igst_amount", 0))
        total     = float(invoice.get("total_amount", 0)) or (taxable + cgst + sgst + igst)

        ledger_entries = self._build_sales_ledger_entries(
            party, taxable, cgst, sgst, igst, total
        )

        xml = f"""
        <ENVELOPE>
          <HEADER>
            <TALLYREQUEST>Import Data</TALLYREQUEST>
          </HEADER>
          <BODY>
            <IMPORTDATA>
              <REQUESTDESC>
                <REPORTNAME>Vouchers</REPORTNAME>
                <STATICVARIABLES>
                  <SVCURRENTCOMPANY>{company_name}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
              </REQUESTDESC>
              <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                  <VOUCHER VCHTYPE="Sales" Action="Create" OBJVIEW="Invoice Voucher View">
                    <DATE>{date_str}</DATE>
                    <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                    <VOUCHERNUMBER>{inv_no}</VOUCHERNUMBER>
                    <PARTYLEDGERNAME>{party}</PARTYLEDGERNAME>
                    <GSTREGISTRATIONNUMBER>{invoice.get("gstin","")}</GSTREGISTRATIONNUMBER>
                    {ledger_entries}
                  </VOUCHER>
                </TALLYMESSAGE>
              </REQUESTDATA>
            </IMPORTDATA>
          </BODY>
        </ENVELOPE>
        """
        response = self._post(xml)
        return self._parse_voucher_response(response, inv_no, "sales")

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _ensure_party_ledger(self, name: str, group: str,
                              gstin: str, company_name: str):
        existing = [l["name"].upper() for l in self.get_ledgers(company_name)]
        if name.upper() not in existing:
            self.create_ledger(name, group, gstin, company_name)

    def _format_date(self, date_str: str) -> str:
        """Convert DD/MM/YYYY or DD-MM-YYYY to Tally YYYYMMDD format."""
        for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d.%m.%Y"):
            try:
                return datetime.strptime(date_str.strip(), fmt).strftime("%Y%m%d")
            except (ValueError, AttributeError):
                continue
        return datetime.today().strftime("%Y%m%d")  # fallback: today

    def _build_purchase_ledger_entries(self, party, taxable, cgst, sgst, igst, total):
        entries = f"""
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>{party}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>-{total:.2f}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Purchase</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>{taxable:.2f}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>"""
        if cgst > 0:
            entries += f"""
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>CGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>{cgst:.2f}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>"""
        if sgst > 0:
            entries += f"""
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>SGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>{sgst:.2f}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>"""
        if igst > 0:
            entries += f"""
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>IGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>{igst:.2f}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>"""
        return entries

    def _build_sales_ledger_entries(self, party, taxable, cgst, sgst, igst, total):
        entries = f"""
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>{party}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>{total:.2f}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Sales</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>-{taxable:.2f}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>"""
        if cgst > 0:
            entries += f"""
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>CGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>-{cgst:.2f}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>"""
        if sgst > 0:
            entries += f"""
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>SGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>-{sgst:.2f}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>"""
        if igst > 0:
            entries += f"""
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>IGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>-{igst:.2f}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>"""
        return entries

    def _parse_voucher_response(self, xml_text: str, inv_no: str, vtype: str) -> dict:
        """Parse Tally's import response to determine success/failure."""
        text_upper = xml_text.upper()

        if "LINEERROR" in text_upper:
            try:
                root = ET.fromstring(xml_text)
                errors = [e.text for e in root.iter("LINEERROR") if e.text]
            except ET.ParseError:
                errors = ["Unknown Tally error"]
            raise TallyVoucherError(
                f"Tally rejected voucher {inv_no}: {'; '.join(errors)}"
            )

        created = "CREATED" in text_upper or "IMPORTED" in text_upper
        ignored = "IGNORED" in text_upper
        combined = "COMBINED" in text_upper

        if ignored and not created:
            return {
                "success": False,
                "invoice_number": inv_no,
                "voucher_type": vtype,
                "message": "Voucher was ignored by Tally (likely a duplicate).",
                "raw_response": xml_text[:500],
            }

        return {
            "success": True,
            "invoice_number": inv_no,
            "voucher_type": vtype,
            "message": f"{vtype.capitalize()} voucher {'combined' if combined else 'created'} in Tally.",
            "raw_response": xml_text[:500],
        }


# Module-level singleton (used by FastAPI routes)
tally = TallyClient()
