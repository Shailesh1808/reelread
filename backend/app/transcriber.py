import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def transcribe_audio(video_path: str) -> str:
    """
    Transcribe speech from a video file using Whisper.
    Returns the transcript as a string, or empty string if failed.
    """
    if not video_path or not os.path.exists(video_path):
        print("Transcriber: video file not found")
        return ""

    try:
        with open(video_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="en"
            )
        transcript = response.text.strip()
        print(f"Transcriber: got {len(transcript)} characters")
        return transcript

    except Exception as e:
        print(f"Transcriber error: {e}")
        return ""