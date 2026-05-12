import os
import uuid
import urllib.parse
from fpdf import FPDF
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

_supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)
PDF_BUCKET = "reelread-pdfs"


# ─────────────────────────────────────────
# NOTES / SAVE AS TEXT
# ─────────────────────────────────────────

def _clean_summary_for_save(text: str) -> str:
    """Strip bot command footer from summary text."""
    divider = "─────────────────"
    if divider in text:
        return text[:text.index(divider)].strip()
    return text.strip()


def generate_notes_link(summary: dict) -> dict:
    """
    Format the summary as clean text with Notes save instructions.
    """
    creator = (summary.get("creator_name") or "").strip()
    raw_date = (summary.get("created_at") or "")[:10]
    url = summary.get("source_url") or ""
    text = summary.get("summary_text") or ""
    heading = summary.get("heading") or ""

    if raw_date:
        try:
            dt = datetime.strptime(raw_date, "%Y-%m-%d")
            date_display = dt.strftime("%b %d").replace(" 0", " ")
        except Exception:
            date_display = raw_date
    else:
        date_display = ""

    clean_text = _clean_summary_for_save(text)

    creator_tag = (
        f"@{creator}"
        if creator and creator.lower() not in ("unknown", "unknown creator")
        else ""
    )

    header_lines = []
    if heading:
        header_lines.append(f"*{heading}*")
    if creator_tag:
        header_lines.append(f"Creator: {creator_tag}")
    if url:
        header_lines.append(f"Source: {url}")
    if date_display:
        header_lines.append(f"Date: {date_display}")

    message = (
        "\n".join(header_lines) + "\n\n"
        "─────────────────\n"
        f"{clean_text}\n"
        "─────────────────\n\n"
        "To save to Notes:\n"
        "1. Long press this message\n"
        "2. Tap Forward\n"
        "3. Tap the Share icon\n"
        "4. Select Notes or Google Keep\n\n"
        "Works on both iPhone and Android."
    )

    return {"message": message}


# ─────────────────────────────────────────
# EMAIL
# ─────────────────────────────────────────

def send_email(summary: dict, to_email: str) -> dict:
    """
    Send summary via email using SendGrid.
    Returns success/failure dict.
    """
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail

        sg = sendgrid.SendGridAPIClient(
            api_key=os.getenv("SENDGRID_API_KEY")
        )

        creator = summary.get("creator_name", "Unknown")
        date = summary.get("created_at", "")[:10]
        url = summary.get("source_url", "")
        text = summary.get("summary_text", "")

        subject = f"ReelRead Summary: {creator}"

        # Plain text version
        plain_body = (
            f"REELREAD SUMMARY\n"
            f"{'=' * 40}\n\n"
            f"Creator: {creator}\n"
            f"Source: {url}\n"
            f"Date: {date}\n\n"
            f"{'─' * 40}\n\n"
            f"{text}\n\n"
            f"{'─' * 40}\n"
            f"Saved via ReelRead"
        )

        # HTML version
        formatted_text = text.replace("\n", "<br>")
        html_body = f"""
        <div style="font-family: Arial, sans-serif; 
                    max-width: 600px; margin: 0 auto;
                    padding: 20px;">
            <h2 style="color: #1a1a1a;">📌 ReelRead Summary</h2>
            <div style="background: #f5f5f5; 
                        padding: 15px; 
                        border-radius: 8px;
                        margin-bottom: 20px;">
                <p><strong>Creator:</strong> {creator}</p>
                <p><strong>Source:</strong> 
                   <a href="{url}">{url}</a></p>
                <p><strong>Date:</strong> {date}</p>
            </div>
            <div style="line-height: 1.6; color: #333;">
                {formatted_text}
            </div>
            <hr style="margin-top: 30px; border: none; 
                       border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
                Saved via ReelRead
            </p>
        </div>
        """

        message = Mail(
            from_email="noreply@reelread.com",
            to_emails=to_email,
            subject=subject,
            plain_text_content=plain_body,
            html_content=html_body
        )

        sg.send(message)
        return {"success": True}

    except Exception as e:
        print(f"Email error: {e}")
        return {"success": False, "error": str(e)}


# ─────────────────────────────────────────
# PDF
# ─────────────────────────────────────────

def generate_pdf(summary: dict) -> str:
    """
    Generate a PDF from a summary.
    Returns the path to the generated PDF file.
    """
    try:
        creator = summary.get("creator_name", "Unknown")
        date = summary.get("created_at", "")[:10]
        url = summary.get("source_url", "")
        text = summary.get("summary_text", "")

        pdf = FPDF()
        pdf.add_page()

        # Header
        pdf.set_font("Helvetica", "B", size=16)
        pdf.set_text_color(26, 26, 26)
        pdf.cell(0, 10, "ReelRead Summary", ln=True)
        pdf.ln(4)

        # Metadata box
        pdf.set_fill_color(245, 245, 245)
        pdf.set_font("Helvetica", size=10)
        pdf.set_text_color(80, 80, 80)
        pdf.multi_cell(0, 7,
            f"Creator: {creator}\n"
            f"Source: {url}\n"
            f"Date: {date}",
            fill=True
        )
        pdf.ln(6)

        # Divider
        pdf.set_draw_color(200, 200, 200)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(6)

        # Summary content
        pdf.set_font("Helvetica", size=11)
        pdf.set_text_color(33, 33, 33)

        # Clean text for PDF: remove WhatsApp markdown
        clean_text = text
        clean_text = clean_text.replace("*", "")
        clean_text = clean_text.replace("_", "")
        clean_text = clean_text.replace("─────────────────", "")

        pdf.multi_cell(0, 7, clean_text)
        pdf.ln(8)

        # Footer
        pdf.set_font("Helvetica", "I", size=9)
        pdf.set_text_color(150, 150, 150)
        pdf.cell(0, 10, "Saved via ReelRead", ln=True)

        # Save to temp file
        import tempfile
        temp_dir = tempfile.mkdtemp()
        filename = f"ReelRead_{creator}_{date}.pdf".replace(" ", "_")
        pdf_path = os.path.join(temp_dir, filename)
        pdf.output(pdf_path)

        return pdf_path

    except Exception as e:
        print(f"PDF generation error: {e}")
        return None


# ─────────────────────────────────────────
# PDF UPLOAD
# ─────────────────────────────────────────

def upload_pdf(pdf_path: str) -> str:
    """
    Upload a PDF to Supabase Storage and return its public URL.
    Returns None if upload fails.
    """
    try:
        filename = f"{uuid.uuid4()}.pdf"
        with open(pdf_path, "rb") as f:
            data = f.read()

        _supabase.storage.from_(PDF_BUCKET).upload(
            filename,
            data,
            {"content-type": "application/pdf"}
        )

        return _supabase.storage.from_(PDF_BUCKET).get_public_url(filename)

    except Exception as e:
        print(f"PDF upload error: {e}")
        return None