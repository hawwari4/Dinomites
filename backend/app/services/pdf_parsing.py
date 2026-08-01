"""Local, deterministic PDF -> JSON extraction for the two QSTP template documents (a
candidate CV and a startup job description) — pure text parsing, no external AI API call.
Built specifically around `Approved_Intern_Template.pdf` / `Approved_JD_Template.pdf`'s
labeled-section layout, but degrades gracefully (returns whatever it can find) on any
similarly-structured PDF."""

from __future__ import annotations

import re
from io import BytesIO

from pypdf import PdfReader

DEGREE_ABBREVIATIONS: dict[str, str] = {
    "bachelor of science": "BSc",
    "bachelor of arts": "BA",
    "bachelor of engineering": "BEng",
    "bachelor of business administration": "BBA",
    "master of science": "MSc",
    "master of arts": "MA",
    "master of business administration": "MBA",
    "master of engineering": "MEng",
    "doctor of philosophy": "PhD",
}

# Canonical skill vocabulary — matched case-insensitively against free-text resume/job
# bullets so extracted tags line up with the rest of the app's taxonomy (seed startup
# needs[], candidate skillSet[]). Longest phrases are matched first so e.g. "Tailwind CSS"
# wins over a bare "CSS".
SKILL_VOCABULARY: list[str] = [
    "JavaScript", "TypeScript", "Python", "SQL", "HTML/CSS", "HTML", "CSS",
    "React", "Node.js", "Tailwind CSS", "Bootstrap", "Vue", "Angular",
    "Git", "GitHub", "VS Code", "Figma", "Prototyping", "UX Research",
    "PyTorch", "TensorFlow", "MLOps", "Machine Learning", "A/B testing",
    "Kubernetes", "Docker", "Go", "GIS", "AWS", "Azure",
    "MATLAB", "SolidWorks", "CAD", "Aspen", "Process Design", "Sustainability",
    "Compliance", "Data Viz", "PowerBI", "Excel",
    "Java", "C++", "C#", "Swift", "Kotlin", "PHP", "Ruby",
]

_JD_SECTION_HEADERS = {"about us", "about", "role & responsibilities", "responsibilities", "required skills", "requirements", "qualifications"}


def extract_pdf_text(pdf_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(pdf_bytes))
    return "\n".join((page.extract_text() or "") for page in reader.pages)


def parse_cv_text(text: str) -> dict:
    """Best-effort structured extraction from a CV's plain text: name, contact links,
    education (university/degree/major/gradYear/academic status), and skills."""
    lines = _lines(text)
    if not lines:
        return {}

    result: dict = {"fullName": lines[0]}

    contact = lines[1] if len(lines) > 1 else ""
    email_m = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", contact)
    if email_m:
        result["email"] = email_m.group(0)
    linkedin_m = re.search(r"(https?://)?(www\.)?linkedin\.com/\S+", contact, re.IGNORECASE)
    if linkedin_m:
        handle = linkedin_m.group(0)
        result["linkedin"] = handle if handle.lower().startswith("http") else f"https://{handle}"

    headers = {i: l for i, l in enumerate(lines) if _is_shout_header(l)}
    starts = sorted(headers)

    def body_after(header_idx: int) -> list[str]:
        later = [i for i in starts if i > header_idx]
        end = later[0] if later else len(lines)
        return lines[header_idx + 1 : end]

    edu_idx = next((i for i, l in headers.items() if l.startswith("EDUCAT")), None)
    if edu_idx is not None:
        body = body_after(edu_idx)
        if body:
            result["university"] = re.split(r"\s[^\w\s]\s", body[0], maxsplit=1)[0].strip()
        if len(body) > 1:
            degree, major = _split_degree(body[1])
            if degree:
                result["degree"] = degree
            if major:
                result["major"] = major
        grad_line = next((l for l in body if "graduat" in l.lower()), None)
        if grad_line:
            year_m = re.search(r"(20\d{2})", grad_line)
            if year_m:
                result["gradYear"] = year_m.group(1)
            result["currentAcademicStatus"] = (
                "Pursuing" if "expected" in grad_line.lower() else "Graduated within 2 years"
            )

    skills_idx = next((i for i, l in headers.items() if l.startswith("SKILL")), None)
    skill_source = " ".join(body_after(skills_idx)) if skills_idx is not None else text
    skills = _find_skills(skill_source)
    if skills:
        result["skillSet"] = skills

    return result


def parse_job_text(text: str) -> dict:
    """Best-effort structured extraction from a startup job-description's plain text:
    position, commitment/hours, duration, and required skills."""
    lines = _lines(text)
    result: dict = {"skills": [], "summary": None}
    if not lines:
        return result

    def field(label: str) -> str | None:
        for l in lines:
            if l.lower().startswith(label.lower()) and ":" in l:
                return l.split(":", 1)[1].strip()
        return None

    position = field("Position:")
    if position:
        result["position"] = position

    duration = field("Duration:")
    if duration:
        weeks_m = re.search(r"(\d+)\s*weeks?", duration, re.IGNORECASE)
        if weeks_m:
            result["weeks"] = int(weeks_m.group(1))
        cycle_m = re.search(r"winter|summer|fall", duration, re.IGNORECASE)
        if cycle_m:
            result["cycle"] = cycle_m.group(0).lower()

    commitment_line = field("Commitment:")
    if commitment_line:
        if re.search(r"part[- ]?time", commitment_line, re.IGNORECASE):
            result["commitment"] = "PT"
        elif re.search(r"full[- ]?time", commitment_line, re.IGNORECASE):
            result["commitment"] = "FT"
        hours_m = re.search(r"(\d+)\s*hours?", commitment_line, re.IGNORECASE)
        if hours_m:
            result["weeklyHours"] = int(hours_m.group(1))

    skills_body = _section_body(lines, "required skills")
    skill_source = " ".join(skills_body) if skills_body else " ".join(lines)
    result["skills"] = _find_skills(skill_source)

    about_body = _section_body(lines, "about us") or _section_body(lines, "about")
    if about_body:
        result["summary"] = " ".join(about_body)[:300]

    return result


def _lines(text: str) -> list[str]:
    return [l.strip() for l in text.splitlines() if l.strip()]


def _is_shout_header(line: str) -> bool:
    letters = [c for c in line if c.isalpha()]
    return len(letters) >= 3 and line == line.upper()


def _split_degree(line: str) -> tuple[str | None, str | None]:
    lower = line.lower()
    for phrase, abbrev in DEGREE_ABBREVIATIONS.items():
        if phrase in lower:
            major_m = re.search(r"\bin\s+(.+)$", line, re.IGNORECASE)
            return abbrev, (major_m.group(1).strip() if major_m else None)
    return None, None


def _section_body(lines: list[str], header: str) -> list[str]:
    idx = next((i for i, l in enumerate(lines) if l.lower().strip(":") == header), None)
    if idx is None:
        return []
    body = []
    for l in lines[idx + 1 :]:
        if l.lower().strip(":") in _JD_SECTION_HEADERS:
            break
        body.append(l)
    return body


def _find_skills(text: str) -> list[str]:
    working = text
    matches: list[tuple[int, str]] = []
    for term in sorted(SKILL_VOCABULARY, key=len, reverse=True):
        pattern = re.compile(r"(?<![A-Za-z0-9])" + re.escape(term) + r"(?![A-Za-z0-9])", re.IGNORECASE)
        m = pattern.search(working)
        if m:
            matches.append((m.start(), term))
            working = working[: m.start()] + (" " * (m.end() - m.start())) + working[m.end() :]
    matches.sort(key=lambda x: x[0])
    return [term for _, term in matches]
