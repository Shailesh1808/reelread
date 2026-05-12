from app.database import get_user, increment_violation, block_user

CAREER_SIGNALS = [
    "resume", "cv", "job", "career", "interview", "linkedin",
    "portfolio", "github", "salary", "offer", "recruiter",
    "application", "hiring", "skills", "experience", "prompt",
    "chatgpt", "ai tool", "cover letter", "networking", "internship",
    "work", "employment", "company", "position", "role", "applied",
    "gpa", "degree", "graduate", "college", "university", "study",
    "certification", "course", "learn", "project", "tech", "software",
    "engineer", "developer", "manager", "data", "design", "marketing",
    "finance", "accounting", "remote", "hybrid", "office", "startup",
    "corporate", "freelance", "promotion", "raise", "negotiat",
    "layoff", "fired", "quit", "resign", "transition", "pivot",
    "headhunter", "referral", "connection", "mentor", "feedback",
    "productivity", "focus", "study", "gpa", "grade", "exam",
    "how to", "tips", "advice", "guide", "hack", "trick", "mistake"
]

HARMFUL_SIGNALS = [
    "porn", "nude", "naked", "explicit adult content",
    "child abuse", "self-harm", "suicide",
    "terrorism", "extremist", "hate speech"
]


def moderate_content(merged_content: str,
                     whatsapp_number: str) -> dict:
    """
    Check content for:
    1. Harmful material: warn then block
    2. Career relevance: reject if off-topic
    """
    if not merged_content:
        return {
            "allowed": False,
            "message": (
                "⚠️ I couldn't extract any content from this post.\n\n"
                "This could mean:\n"
                "• The account is private\n"
                "• The post has been deleted\n"
                "• The link is incorrect\n\n"
                "Please check the link and try again."
            )
        }

    content_lower = merged_content.lower()

    # Check harmful content first (highest priority)
    harmful_matches = [
        s for s in HARMFUL_SIGNALS
        if s in content_lower
    ]

    if harmful_matches:
        return handle_violation(whatsapp_number)

    # Check career relevance
    career_matches = [
        s for s in CAREER_SIGNALS
        if s in content_lower
    ]

    if not career_matches:
        return {
            "allowed": False,
            "message": (
                "🎯 This doesn't appear to be career-related content.\n\n"
                "ReelRead is built for:\n"
                "• Job search tips\n"
                "• Resume and CV advice\n"
                "• Interview preparation\n"
                "• Portfolio and GitHub tips\n"
                "• Career tools and prompts\n"
                "• Study and productivity advice\n\n"
                "Send me a career-related post and I'll get to work 💼"
            )
        }

    return {"allowed": True}


def handle_violation(whatsapp_number: str) -> dict:
    """Issue warning on first violation, block on second"""
    user = get_user(whatsapp_number)
    violation_count = user.get("violation_count", 0) if user else 0

    if violation_count == 0:
        increment_violation(whatsapp_number)
        return {
            "allowed": False,
            "message": (
                "🚨 *Warning*\n\n"
                "This content violates ReelRead's content policy.\n\n"
                "ReelRead is a career advice tool. Harmful or "
                "inappropriate content is not allowed.\n\n"
                "⚠️ This is your first and only warning.\n"
                "A second violation will result in a permanent block."
            )
        }
    else:
        block_user(whatsapp_number)
        return {
            "allowed": False,
            "message": (
                "🚫 Your account has been permanently blocked "
                "due to repeated content policy violations.\n\n"
                "If you believe this is an error, contact: "
                "support@reelread.com"
            )
        }