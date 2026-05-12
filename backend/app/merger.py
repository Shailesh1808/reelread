def merge_sources(
    audio_transcript: str = "",
    onscreen_text: str = "",
    caption: str = ""
) -> str:
    """
    Merge all three content sources into one clean block.
    Each source is labelled so Claude understands the context.
    Returns None if no content found at all.
    """
    sections = []

    if caption and caption.strip():
        sections.append(f"CAPTION:\n{caption.strip()}")

    if audio_transcript and audio_transcript.strip():
        sections.append(f"SPOKEN CONTENT:\n{audio_transcript.strip()}")

    if onscreen_text and onscreen_text.strip():
        sections.append(f"ON-SCREEN TEXT:\n{onscreen_text.strip()}")

    if not sections:
        return None

    return "\n\n".join(sections)


def has_content(merged: str) -> bool:
    """Check if merged content has enough to summarize"""
    if not merged:
        return False
    # At least 50 characters of real content
    return len(merged.strip()) > 50