import os
import importlib


def get_prompt(name: str, fallback: str = "") -> str:
    """
    Load a prompt by priority:
    1. PROMPT_{name} environment variable  (Railway / production)
    2. app.prompts module                  (local development)
    3. fallback string                     (minimal working default)
    """
    env_value = os.getenv(f"PROMPT_{name}")
    if env_value:
        return env_value
    try:
        prompts = importlib.import_module("app.prompts")
        return getattr(prompts, name, fallback)
    except ImportError:
        return fallback
