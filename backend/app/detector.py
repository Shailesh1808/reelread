from urllib.parse import urlparse

ALLOWED_DOMAINS = [
    "instagram.com",
    "www.instagram.com",
    "tiktok.com",
    "www.tiktok.com",
    "vm.tiktok.com",
    "vt.tiktok.com"
]


def is_url(text: str) -> bool:
    """Check if a string is a URL"""
    try:
        result = urlparse(text)
        return result.scheme in ["http", "https"]
    except:
        return False


def validate_url(url: str) -> dict:
    """Check if URL is from an allowed platform"""
    try:
        domain = urlparse(url).netloc.lower()
        if domain in ALLOWED_DOMAINS:
            return {"allowed": True}
        return {
            "allowed": False,
            "message": (
                "⚠️ ReelRead only supports Instagram and TikTok links.\n\n"
                "Send me a link that looks like:\n"
                "• instagram.com/reel/...\n"
                "• instagram.com/p/...\n"
                "• tiktok.com/@.../video/..."
            )
        }
    except:
        return {
            "allowed": False,
            "message": "⚠️ That doesn't look like a valid link. Please try again."
        }


def detect_platform(url: str) -> str:
    """Detect whether URL is Instagram or TikTok"""
    domain = urlparse(url).netloc.lower()
    if "instagram.com" in domain:
        return "INSTAGRAM"
    if "tiktok.com" in domain:
        return "TIKTOK"
    return "UNKNOWN"


def detect_content_type(url: str) -> str:
    """
    Detect Instagram content type from URL pattern.
    TikTok is always VIDEO.
    """
    url_lower = url.lower()

    # TikTok
    if "tiktok.com" in url_lower:
        return "VIDEO"

    # Instagram Reels only
    if "/reel/" in url_lower:
        return "REEL"

    if "/tv/" in url_lower:
        return "REEL"

    # Instagram posts (/p/) - not supported yet
    if "/p/" in url_lower:
        return "NOT_SUPPORTED"

    return "UNKNOWN"

def is_command(text: str) -> bool:
    """Check if message is a ReelRead command"""
    commands = [
        "save", "last", "history", "mode",
        "help", "1", "2", "3"
    ]
    return text.lower().strip() in commands