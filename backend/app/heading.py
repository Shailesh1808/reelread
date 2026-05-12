import os
import anthropic
from dotenv import load_dotenv
from app.prompts import HEADING_PROMPT

load_dotenv()

_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def generate_heading(merged_content: str, creator_name: str = "") -> str:
    snippet = (merged_content or "")[:500].strip()
    if not snippet:
        return _fallback(creator_name)
    try:
        response = _client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=30,
            messages=[{"role": "user", "content": HEADING_PROMPT.format(snippet=snippet)}],
        )
        heading = response.content[0].text.strip().strip('"').strip("'").rstrip(".,!?;:")
        words = heading.split()
        if len(words) > 6:
            heading = " ".join(words[:6])
        return heading if heading else _fallback(creator_name)
    except Exception as e:
        print(f"Heading generation error: {e}")
        return _fallback(creator_name)


def _fallback(creator_name: str) -> str:
    if creator_name and creator_name.lower() not in ("unknown", "unknown creator", ""):
        return f"Tips from @{creator_name}"
    return "Career Advice Summary"
