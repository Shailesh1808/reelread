import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# ─────────────────────────────────────────
# USER FUNCTIONS
# ─────────────────────────────────────────

def get_user(whatsapp_number: str):
    """Get a user by their WhatsApp number"""
    try:
        result = supabase.table("users")\
            .select("*")\
            .eq("whatsapp_number", whatsapp_number)\
            .execute()
        if result.data:
            return result.data[0]
        return None
    except Exception as e:
        print(f"Error getting user: {e}")
        return None


def create_user(whatsapp_number: str):
    """Create a new user"""
    try:
        result = supabase.table("users")\
            .insert({"whatsapp_number": whatsapp_number})\
            .execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Error creating user: {e}")
        return None


def update_user(whatsapp_number: str, updates: dict):
    """Update any user fields"""
    try:
        result = supabase.table("users")\
            .update(updates)\
            .eq("whatsapp_number", whatsapp_number)\
            .execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Error updating user: {e}")
        return None


def is_blocked(whatsapp_number: str) -> bool:
    """Check if a user is blocked"""
    user = get_user(whatsapp_number)
    if not user:
        return False
    return user.get("blocked", False)


def block_user(whatsapp_number: str):
    """Block a user permanently"""
    update_user(whatsapp_number, {
        "blocked": True,
        "blocked_at": datetime.now(timezone.utc).isoformat()
    })


def increment_violation(whatsapp_number: str):
    """Increment violation count by 1"""
    user = get_user(whatsapp_number)
    if user:
        current = user.get("violation_count", 0)
        update_user(whatsapp_number, {
            "violation_count": current + 1
        })


def accept_terms(whatsapp_number: str):
    """Mark terms as accepted"""
    update_user(whatsapp_number, {
        "terms_accepted": True,
        "terms_accepted_at": datetime.now(timezone.utc).isoformat()
    })


def complete_onboarding(whatsapp_number: str, mode: str):
    """Mark onboarding as complete and set summary mode"""
    update_user(whatsapp_number, {
        "onboarding_complete": True,
        "summary_mode": mode
    })


def set_active_summary(whatsapp_number: str, summary_id: str):
    """Set which summary is currently active for this user"""
    update_user(whatsapp_number, {
        "active_summary_id": summary_id
    })


# ─────────────────────────────────────────
# SUMMARY FUNCTIONS
# ─────────────────────────────────────────

def save_summary(whatsapp_number: str, platform: str,
                 content_type: str, source_url: str,
                 creator_name: str, summary_text: str,
                 mode: str, merged_content: str = "",
                 heading: str = "") -> str:
    """Save a new summary and return its ID"""
    try:
        result = supabase.table("summaries")\
            .insert({
                "whatsapp_number": whatsapp_number,
                "platform": platform,
                "content_type": content_type,
                "source_url": source_url,
                "creator_name": creator_name,
                "summary_text": summary_text,
                "merged_content": merged_content,
                "mode": mode,
                "heading": heading or None,
            })\
            .execute()
        if result.data:
            return result.data[0]["id"]
        return None
    except Exception as e:
        print(f"Error saving summary: {e}")
        return None


def _owned_by(row: dict, whatsapp_number: str) -> bool:
    """Return True if row belongs to this user. Logs mismatches."""
    if row.get("whatsapp_number") != whatsapp_number:
        print(f"SECURITY: row owner {row.get('whatsapp_number')} != {whatsapp_number}")
        return False
    return True


def get_summary_by_id(summary_id: str, whatsapp_number: str | None = None):
    """Get a specific summary by ID, optionally scoped to a user."""
    try:
        q = supabase.table("summaries").select("*").eq("id", summary_id)
        if whatsapp_number:
            q = q.eq("whatsapp_number", whatsapp_number)
        result = q.execute()
        if not result.data:
            return None
        row = result.data[0]
        if whatsapp_number and not _owned_by(row, whatsapp_number):
            return None
        return row
    except Exception as e:
        print(f"Error getting summary: {e}")
        return None


def get_last_summary(whatsapp_number: str):
    """Get the most recent summary for a user"""
    try:
        result = supabase.table("summaries")\
            .select("*")\
            .eq("whatsapp_number", whatsapp_number)\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        if not result.data:
            return None
        row = result.data[0]
        return row if _owned_by(row, whatsapp_number) else None
    except Exception as e:
        print(f"Error getting last summary: {e}")
        return None


def get_summary_history(whatsapp_number: str, limit: int = 5):
    """Get recent summaries for a user"""
    try:
        result = supabase.table("summaries")\
            .select("*")\
            .eq("whatsapp_number", whatsapp_number)\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
        if not result.data:
            return []
        return [r for r in result.data if _owned_by(r, whatsapp_number)]
    except Exception as e:
        print(f"Error getting history: {e}")
        return []


def get_daily_count(whatsapp_number: str) -> int:
    """Count how many summaries a user has generated today"""
    try:
        today = datetime.now(timezone.utc).date().isoformat()
        result = supabase.table("summaries")\
            .select("id")\
            .eq("whatsapp_number", whatsapp_number)\
            .gte("created_at", f"{today}T00:00:00")\
            .execute()
        return len(result.data) if result.data else 0
    except Exception as e:
        print(f"Error getting daily count: {e}")
        return 0


def mark_summary_saved(summary_id: str):
    """Mark a summary as saved by the user"""
    try:
        supabase.table("summaries")\
            .update({"saved": True})\
            .eq("id", summary_id)\
            .execute()
    except Exception as e:
        print(f"Error marking summary saved: {e}")


def get_active_summary(whatsapp_number: str):
    """Get the currently active summary for a user"""
    user = get_user(whatsapp_number)
    if not user or not user.get("active_summary_id"):
        return get_last_summary(whatsapp_number)
    # Pass whatsapp_number so the query is scoped and post-validated
    return get_summary_by_id(user["active_summary_id"], whatsapp_number)


def get_total_count(whatsapp_number: str) -> int:
    """Count all summaries ever generated by a user"""
    try:
        result = supabase.table("summaries")\
            .select("id")\
            .eq("whatsapp_number", whatsapp_number)\
            .execute()
        return len(result.data) if result.data else 0
    except Exception as e:
        print(f"Error getting total count: {e}")
        return 0


# ─────────────────────────────────────────
# BETA ACCESS
# ─────────────────────────────────────────

BETA_LIMIT = int(os.getenv("BETA_LIMIT", 20))


def check_beta_access(whatsapp_number: str) -> dict:
    """
    Returns {"access": True} if the number may use the service.
    Returns {"access": False, "position": N} if waitlisted.
    Fails open on DB errors so a bad DB connection never blocks users.
    """
    try:
        # Already a registered user → always has access
        if get_user(whatsapp_number):
            return {"access": True}

        # Pre-approved beta tester
        bt = supabase.table("beta_testers")\
            .select("whatsapp_number")\
            .eq("whatsapp_number", whatsapp_number)\
            .eq("is_active", True)\
            .execute()
        if bt.data:
            return {"access": True}

        # Count active beta testers
        count_result = supabase.table("beta_testers")\
            .select("whatsapp_number")\
            .eq("is_active", True)\
            .execute()
        count = len(count_result.data) if count_result.data else 0

        if count < BETA_LIMIT:
            supabase.table("beta_testers")\
                .insert({"whatsapp_number": whatsapp_number})\
                .execute()
            return {"access": True}

        # No capacity, add to waitlist
        try:
            supabase.table("waitlist")\
                .insert({"phone": whatsapp_number, "source": "whatsapp"})\
                .execute()
        except Exception:
            pass  # Already waitlisted

        wl = supabase.table("waitlist")\
            .select("phone")\
            .order("joined_at", desc=False)\
            .execute()
        position = 1
        if wl.data:
            for i, row in enumerate(wl.data):
                if row.get("phone") == whatsapp_number:
                    position = i + 1
                    break

        return {"access": False, "position": position}

    except Exception as e:
        print(f"Beta access check error: {e}")
        return {"access": True}  # Fail open


def is_waitlisted(phone: str) -> bool:
    """Check if a phone number is on the waitlist"""
    try:
        result = supabase.table("waitlist")\
            .select("id")\
            .eq("phone", phone)\
            .execute()
        return bool(result.data)
    except Exception:
        return False


# ─────────────────────────────────────────
# RATINGS
# ─────────────────────────────────────────

def save_rating(whatsapp_number: str, rating: int):
    """Save a 1-4 star rating from the WhatsApp milestone prompt"""
    try:
        supabase.table("ratings")\
            .insert({
                "whatsapp_number": whatsapp_number,
                "rating": rating
            })\
            .execute()
    except Exception as e:
        print(f"Error saving rating: {e}")


# ─────────────────────────────────────────
# FEEDBACK
# ─────────────────────────────────────────

def get_feedback(whatsapp_number: str):
    """Get existing feedback for a user"""
    try:
        result = supabase.table("feedback")\
            .select("*")\
            .eq("whatsapp_number", whatsapp_number)\
            .execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Error getting feedback: {e}")
        return None


def save_feedback(whatsapp_number: str, rating: int | None,
                  liked_most: str, want_to_see: str, bugs: str):
    """Upsert feedback for a user"""
    try:
        supabase.table("feedback")\
            .upsert({
                "whatsapp_number": whatsapp_number,
                "rating": rating,
                "liked_most": liked_most or None,
                "want_to_see": want_to_see or None,
                "bugs": bugs or None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }, on_conflict="whatsapp_number")\
            .execute()
        return True
    except Exception as e:
        print(f"Error saving feedback: {e}")
        return False