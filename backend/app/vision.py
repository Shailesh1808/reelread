import os
import base64
import anthropic
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
from dotenv import load_dotenv
from app.prompts import VISION_PROMPT

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def encode_image(image_path: str) -> str:
    """Convert image file to base64 string"""
    with open(image_path, "rb") as f:
        return base64.standard_b64encode(f.read()).decode("utf-8")


MAX_FRAMES = 10


def extract_frames(video_path: str, every_n_seconds: int = 2) -> tuple:
    """
    Extract frames from a video at intervals.
    Returns (list of frame image paths, temp_dir). Caller must delete temp_dir.
    """
    import cv2
    import tempfile

    frames = []
    temp_dir = tempfile.mkdtemp()

    try:
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        interval = int(fps * every_n_seconds)
        frame_count = 0
        saved_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_count % interval == 0:
                if saved_count >= MAX_FRAMES:
                    break
                frame_path = os.path.join(
                    temp_dir, f"frame_{saved_count:04d}.jpg"
                )
                cv2.imwrite(frame_path, frame)
                frames.append(frame_path)
                saved_count += 1
            frame_count += 1

        cap.release()
    except Exception as e:
        print(f"Frame extraction error: {e}")

    return frames, temp_dir


def read_text_from_image(image_path: str) -> str:
    """
    Use Claude Vision to read all text from an image.
    Returns extracted text or empty string.
    """
    try:
        image_data = encode_image(image_path)

        # Detect image format
        ext = os.path.splitext(image_path)[1].lower()
        media_type_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp"
        }
        media_type = media_type_map.get(ext, "image/jpeg")

        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1000,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": image_data,
                            },
                        },
                        {
                            "type": "text",
                            "text": VISION_PROMPT
                        }
                    ],
                }
            ],
        )
        return response.content[0].text.strip()

    except Exception as e:
        print(f"Vision error: {e}")
        return ""


GATING_PHRASES = (
    "check",
    "comment",
    "link in bio",
    "swipe",
    "tap",
    "click",
    "follow",
    "subscribe",
    "dm ",
    "save",
    "share",
)


def contains_gating_phrase(text: str) -> bool:
    """Return True if text contains a CTA/gating signal phrase."""
    lower = text.lower()
    return any(phrase in lower for phrase in GATING_PHRASES)


def deduplicate_texts(texts: list) -> str:
    """
    Remove duplicate text entries from frame extraction.
    Same text overlay appears across multiple frames.
    Texts containing gating phrases are always passed through as-is,
    even if partial/cut-off — the moderator and summarizer handle them.
    """
    seen = set()
    unique = []

    for text in texts:
        normalized = text.strip().lower()
        if not normalized:
            continue
        if contains_gating_phrase(normalized):
            unique.append(text.strip())
        elif normalized not in seen:
            seen.add(normalized)
            unique.append(text.strip())

    return "\n".join(unique)


def extract_text_from_reel(video_path: str) -> str:
    """
    Extract all on-screen text from a video Reel.
    Samples frames every 5 seconds (capped at MAX_FRAMES), processed in parallel.
    """
    import shutil

    print("Vision: extracting frames...")
    frames, frames_dir = extract_frames(video_path, every_n_seconds=5)
    print(f"Vision: processing {len(frames)} frames")

    def process_frame(frame_path):
        text = read_text_from_image(frame_path)
        return text

    try:
        with ThreadPoolExecutor(max_workers=5) as executor:
            results = list(executor.map(process_frame, frames))
    finally:
        shutil.rmtree(frames_dir, ignore_errors=True)

    return deduplicate_texts([t for t in results if t])


def extract_text_from_images(image_paths: list) -> str:
    """
    Extract text from carousel slides or single images.
    Preserves order, as each slide is intentionally unique.
    """
    texts = []
    for i, image_path in enumerate(image_paths):
        print(f"Vision: reading image {i + 1}/{len(image_paths)}")
        text = read_text_from_image(image_path)
        if text:
            texts.append(f"Slide {i + 1}:\n{text}")

    return "\n\n".join(texts)