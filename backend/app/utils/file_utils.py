import json
from pathlib import Path
from typing import Any


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    tmp.replace(path)


def check_data_integrity(data_dir: Path, filenames: list[str]) -> list[str]:
    """Verify every expected JSON file parses as valid JSON (a list). Returns problem descriptions."""
    problems = []
    for name in filenames:
        path = data_dir / name
        if not path.exists():
            problems.append(f"{name}: missing")
            continue
        try:
            with path.open("r", encoding="utf-8") as f:
                content = json.load(f)
            if not isinstance(content, list):
                problems.append(f"{name}: expected a JSON list, got {type(content).__name__}")
        except json.JSONDecodeError as e:
            problems.append(f"{name}: malformed JSON ({e})")
    return problems
