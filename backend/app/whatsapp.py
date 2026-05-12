import os
import time
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

# Initialize Twilio client
twilio_client = Client(
    os.getenv("TWILIO_ACCOUNT_SID"),
    os.getenv("TWILIO_AUTH_TOKEN")
)

TWILIO_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER")


def send_message(to: str, message: str):
    """Send a WhatsApp message to a user"""
    try:
        twilio_client.messages.create(
            from_=TWILIO_NUMBER,
            to=f"whatsapp:{to}" if not to.startswith("whatsapp:") else to,
            body=message
        )
    except Exception as e:
        print(f"Error sending message: {e}")


def send_long_message(to: str, message: str):
    """
    WhatsApp has a 1600 character limit per message.
    This splits long messages into chunks automatically.
    """
    limit = 1500
    if len(message) <= limit:
        send_message(to, message)
        return

    # Split at newlines to avoid cutting mid-sentence
    chunks = []
    current = ""

    for line in message.split("\n"):
        if len(current) + len(line) + 1 > limit:
            if current:
                chunks.append(current.strip())
            current = line
        else:
            current += "\n" + line

    if current:
        chunks.append(current.strip())

    # Send each chunk with delay to guarantee delivery order
    total = len(chunks)
    for i, chunk in enumerate(chunks):
        is_last = i == total - 1
        send_message(to, chunk if is_last else chunk + "\n\n_(continued...)_")
        if not is_last:
            time.sleep(0.5)


def extract_message_data(form_data: dict) -> dict:
    """
    Extract the relevant fields from Twilio's
    incoming webhook payload
    """
    return {
        "from": form_data.get("From", ""),
        "body": form_data.get("Body", "").strip(),
        "num_media": int(form_data.get("NumMedia", 0)),
        "media_url": form_data.get("MediaUrl0", None),
        "media_type": form_data.get("MediaContentType0", None)
    }
    
def send_pdf(to: str, pdf_url: str):
    """Send a PDF document via WhatsApp using a public URL"""
    try:
        twilio_client.messages.create(
            from_=TWILIO_NUMBER,
            to=f"whatsapp:{to}" if not to.startswith("whatsapp:") else to,
            media_url=[pdf_url]
        )
    except Exception as e:
        print(f"Error sending PDF: {e}")
        send_message(to,
            "⚠️ Could not send the PDF.\n\n"
            "Try email instead. Reply *save* and choose option 2."
        )