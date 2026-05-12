import asyncio
import os
from datetime import datetime

from fastapi import BackgroundTasks, FastAPI, Request
from fastapi.responses import PlainTextResponse
from dotenv import load_dotenv

from app.whatsapp import send_message, send_long_message, extract_message_data
from app.database import (
    get_user, create_user,
    accept_terms, complete_onboarding,
    save_summary, get_last_summary,
    get_summary_history, get_active_summary,
    set_active_summary, get_daily_count, update_user,
    check_beta_access, is_waitlisted,
    get_total_count, save_rating,
    get_feedback, save_feedback,
    mark_summary_saved,
)
from app.detector import is_url, validate_url, detect_platform, detect_content_type
from app.downloader import download_video, download_audio_only, download_images, cleanup
from app.transcriber import transcribe_audio
from app.vision import extract_text_from_reel, extract_text_from_images
from app.merger import merge_sources
from app.moderator import moderate_content
from app.summarizer import summarize, summarize_followup
from app.heading import generate_heading

load_dotenv()

DAILY_LIMIT = int(os.getenv("DAILY_LIMIT", 20))
MAX_MESSAGE_LENGTH = 2000
RATING_MILESTONES = {5, 10, 15, 25, 50}
FOOTER = "─────────────────\n💾 Reply *save*\n📋 Reply *last*"

app = FastAPI()


def _first_line(text: str) -> str:
    """Fallback heading: first meaningful line of summary text."""
    for line in (text or "").split("\n"):
        stripped = line.strip().lstrip("*").rstrip("*").strip()
        if stripped and not stripped.startswith("─") and len(stripped) > 5:
            return stripped[:60]
    return "Career Advice Summary"


def _split_into_messages(text: str, max_len: int = 1500) -> list:
    """Split at sub-section boundaries to fit WhatsApp message limits."""
    if len(text) <= max_len:
        return [text]

    # Separate footer from body so it always stays on the last chunk
    footer_marker = "─────────────────"
    if footer_marker in text:
        body, footer_part = text.split(footer_marker, 1)
        footer = footer_marker + footer_part
    else:
        body = text
        footer = ""

    lines = body.split("\n")
    chunks = []
    current_lines = []
    current_len = 0

    for line in lines:
        line_len = len(line) + 1
        is_section_header = (
            line.strip().startswith("*")
            and line.strip().endswith("*")
            and len(line.strip()) > 2
        )

        # Flush at a section boundary if the current chunk is meaningfully full
        if is_section_header and current_len > max_len * 0.4 and current_lines:
            chunks.append("\n".join(current_lines).strip())
            current_lines = []
            current_len = 0

        # Hard flush if adding this line would exceed the limit
        if current_len + line_len > max_len and current_lines:
            chunks.append("\n".join(current_lines).strip())
            current_lines = []
            current_len = 0

        current_lines.append(line)
        current_len += line_len

    if current_lines:
        chunks.append("\n".join(current_lines).strip())

    # Attach footer to last chunk, or as its own chunk if it won't fit
    if footer:
        if chunks and len(chunks[-1]) + len(footer) + 1 <= max_len:
            chunks[-1] = chunks[-1] + "\n" + footer
        else:
            chunks.append(footer)

    return [c for c in chunks if c]


@app.get("/")
def root():
    return {"status": "ReelRead is running"}


# ─────────────────────────────────────────
# WEBHOOK - returns to Twilio immediately
# ─────────────────────────────────────────

@app.post("/webhook", response_class=PlainTextResponse)
async def webhook(request: Request, background_tasks: BackgroundTasks):
    form_data = await request.form()
    form_dict = dict(form_data)

    # ── Twilio signature verification (must happen before returning) ──
    if os.getenv("VALIDATE_TWILIO", "true").lower() == "true":
        from twilio.request_validator import RequestValidator
        validator = RequestValidator(os.getenv("TWILIO_AUTH_TOKEN"))
        proto = request.headers.get("X-Forwarded-Proto", request.url.scheme)
        url = str(request.url).replace(request.url.scheme + "://", proto + "://", 1)
        signature = request.headers.get("X-Twilio-Signature", "")
        if not validator.validate(url, form_dict, signature):
            return PlainTextResponse("Forbidden", status_code=403)

    data = extract_message_data(form_dict)
    sender = data["from"]
    message = data["body"]

    print(f"Message from {sender}: {message[:100]}")

    # Enqueue all processing; webhook returns immediately
    background_tasks.add_task(process_message, sender, message)
    return "OK"


# ─────────────────────────────────────────
# PROCESS MESSAGE - runs in background
# ─────────────────────────────────────────

async def process_message(sender: str, message: str) -> None:
    """All message handling logic. Runs after webhook has returned 200 to Twilio."""
    try:
        # ── Message length guard ──
        if len(message) > MAX_MESSAGE_LENGTH:
            send_message(sender,
                "⚠️ That message is too long.\n\n"
                "Please send a link or a short command like *help*."
            )
            return

        # ── Fetch user once (covers blocked check too) ──
        user = get_user(sender)
        if user and user.get("blocked"):
            return

        # ── Waitlisted check ──
        if not user and is_waitlisted(sender):
            send_message(sender,
                "You're on our waitlist! 🙏\n\n"
                "We'll message you as soon as a spot opens up."
            )
            return

        # ── Get or create user ──
        if not user:
            beta = check_beta_access(sender)
            if not beta["access"]:
                send_message(sender,
                    f"👋 Thanks for your interest in ReelRead!\n\n"
                    f"We're in a limited beta right now.\n"
                    f"You're *#{beta.get('position', '?')}* on the waitlist.\n\n"
                    "We'll message you when a spot opens up. 🙏"
                )
                return
            create_user(sender)
            send_long_message(sender,
                "👋 Welcome to *ReelRead*\n\n"
                "You know that feeling when you save a career "
                "advice Reel... and never go back to it?\n\n"
                "ReelRead fixes that.\n\n"
                "Instead of saving the video, send it here.\n"
                "I'll read the audio, the text on screen, "
                "and the caption, then send you everything "
                "as clean, structured text you can actually use.\n\n"
                "Works with Instagram Reels and TikTok videos.\n"
                "Career content only.\n\n"
                "─────────────────\n"
                "📋 *Terms of Service*\n"
                "By using ReelRead you agree that:\n"
                "• This is a beta product. Things may break.\n"
                "• We process content to generate summaries\n"
                "• We store your summaries for up to 30 days\n"
                "• We never sell your data\n"
                "• Career content only\n\n"
                "Reply *agree* to continue."
            )
            return

        # ── Onboarding: terms ──
        if not user.get("terms_accepted"):
            if message.lower() == "agree":
                accept_terms(sender)
                complete_onboarding(sender, "standard")
                send_message(sender,
                    "✅ Welcome to ReelRead.\n\n"
                    "Send me any Instagram or TikTok career advice link to get started 🎯\n\n"
                    "─────────────────\n"
                    f"You have *{DAILY_LIMIT} free summaries per day*\n"
                    "Reply *help* for all commands"
                )
            else:
                send_message(sender,
                    "Please reply *agree* to accept the "
                    "terms and start using ReelRead."
                )
            return

        # ── Help command ──
        if message.lower() == "help":
            send_message(sender,
                "📋 *ReelRead Commands*\n\n"
                "🔗 Send any Instagram or TikTok link\n"
                "   → Get a structured summary\n\n"
                "*save*       → Save the current summary\n"
                "*last*       → Retrieve your previous summary\n"
                "*history*    → See all recent summaries\n"
                "*feedback*   → Rate your experience\n"
                "*help*       → Show this menu\n\n"
                f"📊 Daily limit: {DAILY_LIMIT} summaries (resets midnight)"
            )
            return

        # ── Skip any pending prompt ──
        if message.lower() == "skip" and user.get("pending_action"):
            update_user(sender, {"pending_action": None})
            return

        # ── Rating response (milestone) ──
        if message in ["1", "2", "3", "4"] and user.get("pending_action") == "rating_requested":
            save_rating(sender, int(message))
            update_user(sender, {"pending_action": None})
            if int(message) >= 3:
                send_message(sender, "🙏 Thanks! Keep sending links.")
            else:
                send_message(sender,
                    "Thanks for the honest feedback 🙏\n\n"
                    "Reply *feedback* to share more. We read everything."
                )
            return

        # ── Rating response (feedback command) ──
        if message in ["1", "2", "3", "4"] and user.get("pending_action") == "feedback_rating":
            save_feedback(sender, int(message), "", "", "")
            update_user(sender, {"pending_action": None})
            send_message(sender, "🙏 Thanks for the feedback!")
            return

        # ── Last summary ──
        if message.lower() == "last":
            summary = get_last_summary(sender)
            if summary:
                set_active_summary(sender, summary["id"])
                body = summary['summary_text']
                if summary.get('heading'):
                    body = f"*{summary['heading']}*\n\n{body}"
                send_long_message(sender,
                    f"📋 *Your previous summary*\n"
                    f"👤 {summary.get('creator_name', 'Unknown')}\n"
                    f"🔗 {summary.get('source_url', '')}\n\n"
                    f"{body}"
                )
            else:
                send_message(sender,
                    "You don't have any previous summaries yet.\n\n"
                    "Send me an Instagram or TikTok link to get started!"
                )
            return

        # ── History ──
        if message.lower() == "history":
            summaries = get_summary_history(sender, limit=5)
            if summaries:
                from datetime import datetime as _dt
                lines = ["📋 *Your recent summaries*\n"]
                for i, s in enumerate(summaries, 1):
                    raw_date = s.get("created_at", "")[:10]
                    try:
                        date_display = _dt.strptime(raw_date, "%Y-%m-%d").strftime("%b %d").replace(" 0", " ") if raw_date else ""
                    except Exception:
                        date_display = raw_date
                    creator = s.get("creator_name", "")
                    creator_tag = f"@{creator}" if creator and creator.lower() not in ("unknown", "unknown creator") else ""
                    title = s.get("heading") or _first_line(s.get("summary_text", ""))
                    meta = " · ".join(filter(None, [creator_tag, date_display]))
                    lines.append(f"{i}. *{title}*\n   {meta}")
                lines.append("\nReply a number to see the full summary.")
                send_long_message(sender, "\n".join(lines))
            else:
                send_message(sender,
                    "You don't have any summaries yet.\n\n"
                    "Send me an Instagram or TikTok link to get started!"
                )
            return

        # ── History selection ──
        if message in ["1", "2", "3", "4", "5"] and not user.get("pending_action"):
            summaries = get_summary_history(sender, limit=5)
            idx = int(message) - 1
            if summaries and idx < len(summaries):
                s = summaries[idx]
                set_active_summary(sender, s["id"])
                body = s['summary_text']
                if s.get('heading'):
                    body = f"*{s['heading']}*\n\n{body}"
                send_long_message(sender,
                    f"📋 *Summary #{message}*\n"
                    f"👤 {s.get('creator_name', 'Unknown')}\n"
                    f"🔗 {s.get('source_url', '')}\n\n"
                    f"{body}"
                )
            return

        # ── Save command ──
        if message.lower() == "save":
            active = get_active_summary(sender)
            if active:
                update_user(sender, {"pending_action": "save_menu"})
                send_message(sender,
                    "Where would you like to save this?\n\n"
                    "1️⃣ 📱 Notes (Apple Notes / Google Keep)\n"
                    "2️⃣ 📧 Email it to myself\n"
                    "3️⃣ 📄 PDF\n\n"
                    "Reply 1, 2, or 3."
                )
            else:
                send_message(sender,
                    "No summary to save yet.\n\n"
                    "Send me a link first!"
                )
            return

        # ── Save destination selection ──
        if message in ["1", "2", "3"] and user.get("pending_action") == "save_menu":
            active = get_active_summary(sender)
            update_user(sender, {"pending_action": None})

            if message == "1":
                from app.saver import generate_notes_link
                notes = generate_notes_link(active)
                mark_summary_saved(active["id"])
                send_long_message(sender, notes["message"])

            elif message == "2":
                default_email = user.get("default_email")
                if default_email:
                    update_user(sender, {"pending_action": "email_confirm"})
                    send_message(sender,
                        f"Send to *{default_email}*?\n\n"
                        "Reply *yes* to confirm or send a different email address."
                    )
                else:
                    update_user(sender, {"pending_action": "awaiting_email"})
                    send_message(sender, "What email should I send this to?")

            elif message == "3":
                from app.saver import generate_pdf, upload_pdf
                from app.whatsapp import send_pdf
                import shutil
                send_message(sender, "⏳ Generating your PDF...")
                pdf_path = await asyncio.to_thread(generate_pdf, active)
                if pdf_path:
                    pdf_url = await asyncio.to_thread(upload_pdf, pdf_path)
                    shutil.rmtree(os.path.dirname(pdf_path), ignore_errors=True)
                    if pdf_url:
                        send_pdf(sender, pdf_url)
                        mark_summary_saved(active["id"])
                    else:
                        send_message(sender,
                            "⚠️ PDF upload failed. "
                            "Try email instead. Reply *save*"
                        )
                else:
                    send_message(sender,
                        "⚠️ PDF generation failed. "
                        "Try email instead. Reply *save*"
                    )
            return

        # ── Awaiting email address ──
        if user.get("pending_action") == "awaiting_email":
            if "@" in message and "." in message:
                from app.saver import send_email
                active = get_active_summary(sender)
                update_user(sender, {
                    "pending_action": None,
                    "default_email": message
                })
                send_message(sender, "⏳ Sending email...")
                result = await asyncio.to_thread(send_email, active, message)
                if result["success"]:
                    mark_summary_saved(active["id"])
                    send_message(sender,
                        f"✅ Sent to *{message}*\n\n"
                        "It has been saved as your default email."
                    )
                else:
                    send_message(sender, "⚠️ Email failed. Please try again.")
            else:
                send_message(sender,
                    "That doesn't look like a valid email.\n\n"
                    "Please send a valid email address."
                )
            return

        # ── Email confirm with default ──
        if user.get("pending_action") == "email_confirm":
            from app.saver import send_email
            active = get_active_summary(sender)
            email = message if "@" in message else user.get("default_email")
            update_user(sender, {"pending_action": None})
            send_message(sender, "⏳ Sending email...")
            result = await asyncio.to_thread(send_email, active, email)
            if result["success"]:
                mark_summary_saved(active["id"])
                send_message(sender, f"✅ Sent to *{email}*")
            else:
                send_message(sender, "⚠️ Email failed. Please try again.")
            return

        # ── Feedback command ──
        if message.lower() == "feedback":
            update_user(sender, {"pending_action": "feedback_rating"})
            send_message(sender,
                "📝 *Rate your ReelRead experience*\n\n"
                "1️⃣ Not good\n"
                "2️⃣ OK\n"
                "3️⃣ Good\n"
                "4️⃣ Great!\n\n"
                "Reply 1–4, or *skip*."
            )
            return

        # ── URL Processing ──
        if is_url(message):

            # Validate platform
            url_check = validate_url(message)
            if not url_check["allowed"]:
                send_message(sender, url_check["message"])
                return

            # Rate limit check
            daily_count = get_daily_count(sender)
            if daily_count >= DAILY_LIMIT:
                send_message(sender,
                    f"⚠️ You've reached your {DAILY_LIMIT} summary limit for today.\n\n"
                    "Your existing summaries are still available:\n"
                    "📋 Reply *last* for your most recent\n"
                    "📋 Reply *history* to see all of today's\n\n"
                    "Your limit resets at midnight. See you tomorrow! 🌙"
                )
                return

            send_message(sender, "⏳ Got it! Analyzing your content...")

            platform = detect_platform(message)
            content_type = detect_content_type(message)

            if content_type == "NOT_SUPPORTED":
                send_message(sender,
                    "⚠️ ReelRead currently supports:\n\n"
                    "📹 Instagram Reels\n"
                    "🎵 TikTok Videos\n\n"
                    "Send me a Reel or TikTok link instead!"
                )
                return

            audio_transcript = ""
            onscreen_text = ""
            caption = ""
            creator_name = ""
            temp_dir = None
            audio_temp_dir = None

            try:
                if content_type in ["REEL", "VIDEO"]:
                    # Parallel downloads: audio for transcription, video for vision
                    audio_dl, video_dl = await asyncio.gather(
                        asyncio.to_thread(download_audio_only, message),
                        asyncio.to_thread(download_video, message),
                        return_exceptions=True,
                    )
                    if isinstance(audio_dl, Exception):
                        print(f"Audio download error: {audio_dl}")
                        audio_dl = None
                    if isinstance(video_dl, Exception):
                        print(f"Video download error: {video_dl}")
                        video_dl = None

                    if audio_dl:
                        audio_temp_dir = audio_dl["temp_dir"]
                        caption = audio_dl.get("description", "")
                        creator_name = audio_dl.get("uploader", "")
                    if video_dl:
                        temp_dir = video_dl["temp_dir"]
                        caption = caption or video_dl.get("description", "")
                        creator_name = creator_name or video_dl.get("uploader", "")

                    # Parallel processing: transcription and vision
                    proc_tasks = []
                    proc_labels = []
                    if audio_dl:
                        proc_tasks.append(
                            asyncio.to_thread(transcribe_audio, audio_dl["audio_path"])
                        )
                        proc_labels.append("audio")
                    if video_dl:
                        proc_tasks.append(
                            asyncio.to_thread(extract_text_from_reel, video_dl["video_path"])
                        )
                        proc_labels.append("vision")

                    if proc_tasks:
                        results = await asyncio.gather(*proc_tasks, return_exceptions=True)
                        for label, result in zip(proc_labels, results):
                            if not isinstance(result, Exception):
                                if label == "audio":
                                    audio_transcript = result
                                else:
                                    onscreen_text = result
                            else:
                                print(f"{label} processing error: {result}")

                elif content_type == "POST":
                    result = await asyncio.to_thread(download_images, message)
                    if result:
                        temp_dir = result["temp_dir"]
                        caption = result.get("description", "")
                        creator_name = result.get("uploader", "")
                        if result.get("image_paths"):
                            onscreen_text = await asyncio.to_thread(
                                extract_text_from_images, result["image_paths"]
                            )

                else:
                    # Fallback: treat as video
                    audio_dl, video_dl = await asyncio.gather(
                        asyncio.to_thread(download_audio_only, message),
                        asyncio.to_thread(download_video, message),
                        return_exceptions=True,
                    )
                    if isinstance(audio_dl, Exception):
                        audio_dl = None
                    if isinstance(video_dl, Exception):
                        video_dl = None

                    if audio_dl:
                        audio_temp_dir = audio_dl["temp_dir"]
                        caption = audio_dl.get("description", "")
                        creator_name = audio_dl.get("uploader", "")
                    if video_dl:
                        temp_dir = video_dl["temp_dir"]
                        caption = caption or video_dl.get("description", "")
                        creator_name = creator_name or video_dl.get("uploader", "")

                    proc_tasks = []
                    proc_labels = []
                    if audio_dl:
                        proc_tasks.append(
                            asyncio.to_thread(transcribe_audio, audio_dl["audio_path"])
                        )
                        proc_labels.append("audio")
                    if video_dl:
                        proc_tasks.append(
                            asyncio.to_thread(extract_text_from_reel, video_dl["video_path"])
                        )
                        proc_labels.append("vision")

                    if proc_tasks:
                        results = await asyncio.gather(*proc_tasks, return_exceptions=True)
                        for label, result in zip(proc_labels, results):
                            if not isinstance(result, Exception):
                                if label == "audio":
                                    audio_transcript = result
                                else:
                                    onscreen_text = result

            except Exception as e:
                print(f"Extraction error: {e}")
                send_message(sender,
                    "⚠️ Something went wrong processing this content.\n\n"
                    "Please try again in a moment."
                )
                return

            finally:
                if audio_temp_dir:
                    cleanup(audio_temp_dir)
                if temp_dir:
                    cleanup(temp_dir)

            print("=== TRANSCRIPT ===")
            print(audio_transcript[:500] if audio_transcript else "EMPTY")
            print("==================")
            print("=== ONSCREEN TEXT ===")
            print(onscreen_text[:500] if onscreen_text else "EMPTY")
            print("====================")
            print("=== CAPTION ===")
            print(caption[:500] if caption else "EMPTY")
            print("===============")

            # Merge sources
            merged = merge_sources(audio_transcript, onscreen_text, caption)

            print("=== MERGED ===")
            print(merged[:1000] if merged else "EMPTY")
            print("==============")

            # Moderate content
            mod_check = moderate_content(merged or "", sender)
            if not mod_check["allowed"]:
                send_message(sender, mod_check["message"])
                return

            # Generate summary and heading in parallel
            summary_text, heading = await asyncio.gather(
                asyncio.to_thread(summarize, merged, creator_name),
                asyncio.to_thread(generate_heading, merged, creator_name),
            )
            full_output = f"*{heading}*\n\n{summary_text}\n\n{FOOTER}"

            # Save to database
            summary_id = save_summary(
                whatsapp_number=sender,
                platform=platform,
                content_type=content_type,
                source_url=message,
                creator_name=creator_name,
                summary_text=summary_text,
                merged_content=merged or "",
                mode="standard",
                heading=heading,
            )

            if summary_id:
                set_active_summary(sender, summary_id)

            parts = _split_into_messages(full_output)

            # Rating milestone prompt
            total = get_total_count(sender)
            if total in RATING_MILESTONES:
                update_user(sender, {"pending_action": "rating_requested"})
                for i, part in enumerate(parts):
                    if i > 0:
                        await asyncio.sleep(0.5)
                    await asyncio.to_thread(send_message, sender, part)
                send_message(sender,
                    f"🎉 *{total} summaries generated!*\n\n"
                    "Quick question: how's ReelRead working for you?\n\n"
                    "1️⃣ Not good\n"
                    "2️⃣ OK\n"
                    "3️⃣ Good\n"
                    "4️⃣ Great!\n\n"
                    "Reply 1–4, or *skip*."
                )
                return

            for i, part in enumerate(parts):
                if i > 0:
                    await asyncio.sleep(0.5)
                await asyncio.to_thread(send_message, sender, part)
            return

        # ── Unknown input ──
        send_message(sender,
            "I didn't quite get that.\n\n"
            "Send me an Instagram or TikTok link, "
            "or reply *help* for available commands."
        )

    except Exception as e:
        print(f"process_message error for {sender}: {e}")
        try:
            send_message(sender,
                "⚠️ Something went wrong on our end.\n\n"
                "Please try again in a moment."
            )
        except Exception:
            pass
