from __future__ import annotations

import os
import tempfile
from pathlib import Path

_TEST_DATA_DIR = Path(tempfile.mkdtemp(prefix="eve-ai-studio-tests-"))
os.environ["EVE_REQUIREMENTS_DB_PATH"] = str(_TEST_DATA_DIR / "requirements.sqlite3")
