from pathlib import Path
import json
from appdirs import user_data_dir

APP_VENDOR = "OurDevices"
APP_NAME = "OurDevicesClient"

def _session_dir():
    base = Path(user_data_dir(APP_NAME, APP_VENDOR))
    base.mkdir(parents=True, exist_ok=True)
    return base

def _session_file():
    return _session_dir() / "session.json"

def save_session(token: str, user: dict):
    data = {"token": token, "user": user}
    _session_file().write_text(json.dumps(data), encoding="utf-8")

def load_session():
    f = _session_file()
    if not f.exists():
        return None
    try:
        return json.loads(f.read_text(encoding="utf-8"))
    except Exception:
        return None

def clear_session():
    f = _session_file()
    if f.exists():
        f.unlink()
