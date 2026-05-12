import os
import yt_dlp
import tempfile

def get_metadata_only(url: str) -> dict:
    """
    Extract metadata without downloading the video.
    Gets caption, creator name, content type.
    """
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        "skip_download": True,
        "cookiefile": os.path.join(os.path.dirname(os.path.dirname(__file__)), "instagram_cookies.txt"),
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                "title": info.get("title", ""),
                "description": info.get("description", ""),
                "uploader": info.get("uploader", ""),
                "uploader_id": info.get("uploader_id", ""),
                "duration": info.get("duration", 0),
                "content_type": detect_type_from_info(info),
                "thumbnails": info.get("thumbnails", []),
                "entries": info.get("entries", None),
            }
    except Exception as e:
        print(f"Error getting metadata: {e}")
        return None


def download_audio_only(url: str) -> dict:
    """
    Download only the audio track from a Reel or TikTok.
    Much faster than full video, only needed for Whisper transcription.
    Returns path to audio file.
    """
    temp_dir = tempfile.mkdtemp()
    output_path = os.path.join(temp_dir, "audio.%(ext)s")

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "outtmpl": output_path,
        "format": "bestaudio/best",
        "cookiefile": os.path.join(os.path.dirname(os.path.dirname(__file__)), "instagram_cookies.txt"),
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "64",
        }],
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            audio_path = os.path.join(temp_dir, "audio.mp3")
            if os.path.exists(audio_path):
                return {
                    "audio_path": audio_path,
                    "temp_dir": temp_dir,
                    "description": info.get("description", ""),
                    "uploader": info.get("uploader", ""),
                    "duration": info.get("duration", 0),
                }
    except Exception as e:
        print(f"Error downloading audio: {e}")
    return None


def download_video(url: str) -> dict:
    """
    Download video and audio from a Reel or TikTok.
    Returns paths to the downloaded files.
    """
    temp_dir = tempfile.mkdtemp()
    output_path = os.path.join(temp_dir, "video.%(ext)s")

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "outtmpl": output_path,
        "format": "best",
        "cookiefile": os.path.join(os.path.dirname(os.path.dirname(__file__)), "instagram_cookies.txt"),
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            ext = info.get("ext", "mp4")
            video_path = os.path.join(temp_dir, f"video.{ext}")

            if os.path.exists(video_path):
                return {
                    "video_path": video_path,
                    "temp_dir": temp_dir,
                    "description": info.get("description", ""),
                    "uploader": info.get("uploader", ""),
                    "uploader_id": info.get("uploader_id", ""),
                    "duration": info.get("duration", 0),
                }
            return None
    except Exception as e:
        print(f"Error downloading video: {e}")
        return None


def download_images(url: str) -> dict:
    """
    Download all images from a carousel or single image post.
    Returns list of image paths.
    """
    temp_dir = tempfile.mkdtemp()

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "cookiefile": os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "instagram_cookies.txt"
        ),
        "outtmpl": os.path.join(temp_dir, "image_%(autonumber)s.%(ext)s"),
        "format": "best",
        "extract_flat": False,
        "writethumbnail": False,
        "skip_download": False,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)

            description = info.get("description", "")
            uploader = info.get("uploader", "")
            uploader_id = info.get("uploader_id", "")

            # Check for carousel entries
            entries = info.get("entries", None)
            if entries:
                print(f"Downloader: carousel with {len(entries)} entries")

            # Collect all downloaded files
            image_paths = []
            for f in sorted(os.listdir(temp_dir)):
                full_path = os.path.join(temp_dir, f)
                if os.path.isfile(full_path):
                    image_paths.append(full_path)

            print(f"Downloader: found {len(image_paths)} files")

            # If no images downloaded, try thumbnail extraction
            if not image_paths and entries:
                for i, entry in enumerate(entries):
                    thumbnails = entry.get("thumbnails", [])
                    if thumbnails:
                        thumb_url = thumbnails[-1].get("url", "")
                        if thumb_url:
                            import requests
                            img_path = os.path.join(
                                temp_dir, f"image_{i:04d}.jpg"
                            )
                            response = requests.get(thumb_url)
                            if response.status_code == 200:
                                with open(img_path, "wb") as f:
                                    f.write(response.content)
                                image_paths.append(img_path)

            print(f"Downloader: total {len(image_paths)} images")

            return {
                "image_paths": image_paths,
                "temp_dir": temp_dir,
                "description": description,
                "uploader": uploader,
                "uploader_id": uploader_id,
            }

    except Exception as e:
        print(f"Error downloading images: {e}")
        return None


def detect_type_from_info(info: dict) -> str:
    """Detect content type from yt-dlp metadata"""
    # Carousel has entries
    if info.get("entries"):
        return "CAROUSEL"

    # Check if it is a video
    if info.get("duration") and info.get("duration") > 0:
        return "VIDEO"

    # Default to image
    return "IMAGE"


def cleanup(temp_dir: str):
    """Delete temporary files after processing"""
    import shutil
    try:
        shutil.rmtree(temp_dir)
    except Exception as e:
        print(f"Error cleaning up: {e}")