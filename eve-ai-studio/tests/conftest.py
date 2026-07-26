from __future__ import annotations

import os
import tempfile
from pathlib import Path

_TEST_DATA_DIR = Path(tempfile.mkdtemp(prefix="eve-ai-studio-tests-"))
os.environ["EVE_REQUIREMENTS_DB_PATH"] = str(_TEST_DATA_DIR / "requirements.sqlite3")
os.environ["EVE_PROMPTS_DB_PATH"] = str(_TEST_DATA_DIR / "prompts.sqlite3")
os.environ["EVE_EVALUATIONS_DB_PATH"] = str(_TEST_DATA_DIR / "evaluations.sqlite3")
os.environ["EVE_PROVIDER_TELEMETRY_DB_PATH"] = str(
    _TEST_DATA_DIR / "provider-telemetry.sqlite3"
)
os.environ["EVE_MATERIALS_DB_PATH"] = str(_TEST_DATA_DIR / "materials.sqlite3")
os.environ["EVE_EXTERNAL_PROVIDERS_ENABLED"] = "false"
