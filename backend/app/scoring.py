from __future__ import annotations

import re


# ---------------------------------------------------------------------------
# MCQ grading
# ---------------------------------------------------------------------------

def grade_mcq(submitted_answers: list[int], correct_answers: list[int]) -> tuple[float, int]:
    total_questions = len(correct_answers)
    correct_count = 0
    for index, correct_answer in enumerate(correct_answers):
        if index < len(submitted_answers) and submitted_answers[index] == correct_answer:
            correct_count += 1
    percentage = round((correct_count / total_questions) * 100, 2) if total_questions else 0.0
    return percentage, correct_count


# ---------------------------------------------------------------------------
# Resume keyword scoring
#
# Extracts text from the PDF and checks for keyword signals across three
# buckets. Returns a score 0-100.
#
# Buckets (total = 30 raw points, normalised to 100):
#   Projects       12 pts  — practical work signal
#   Certifications 10 pts  — formal training signal
#   Education       8 pts  — academic background signal
# ---------------------------------------------------------------------------

_PROJECT_KEYWORDS = [
    "project", "built", "developed", "implemented", "deployed",
    "github", "portfolio", "capstone", "hackathon", "open source",
]

_CERT_KEYWORDS = [
    "certification", "certified", "certificate", "aws certified",
    "salesforce certified", "istqb", "comptia", "microsoft certified",
    "google certified", "coursera", "udemy", "pluralsight", "training",
]

_EDUCATION_KEYWORDS = [
    "bachelor", "master", "msc", "bsc", "b.sc", "m.sc", "b.tech", "m.tech",
    "university", "college", "degree", "diploma", "graduate", "undergraduate",
    "computer science", "information technology", "engineering",
]


def _extract_pdf_text(pdf_path: str) -> str:
    """Extract plain text from a PDF file. Returns empty string on failure."""
    try:
        import pypdf  # optional dependency
        text_parts: list[str] = []
        with open(pdf_path, "rb") as fh:
            reader = pypdf.PdfReader(fh)
            for page in reader.pages:
                text_parts.append(page.extract_text() or "")
        return " ".join(text_parts).lower()
    except Exception:
        return ""


def _keyword_hit(text: str, keywords: list[str]) -> bool:
    """Return True if any keyword appears as a word/phrase in text."""
    for kw in keywords:
        if re.search(r'\b' + re.escape(kw) + r'\b', text):
            return True
    return False


def resume_score(pdf_path: str) -> float:
    """
    Score the resume 0-100 based on keyword presence.

    If PDF parsing is unavailable (pypdf not installed) or the file is
    missing, falls back to 50 so it doesn't unfairly penalise candidates
    on a setup issue.
    """
    if not pdf_path or not pdf_path.strip():
        return 0.0

    text = _extract_pdf_text(pdf_path)

    if not text.strip():
        # File present but unreadable — give benefit of the doubt
        return 50.0

    raw = 0.0
    if _keyword_hit(text, _PROJECT_KEYWORDS):
        raw += 12.0
    if _keyword_hit(text, _CERT_KEYWORDS):
        raw += 10.0
    if _keyword_hit(text, _EDUCATION_KEYWORDS):
        raw += 8.0

    # Normalise 0-30 → 0-100
    return round((raw / 30.0) * 100, 2)


# ---------------------------------------------------------------------------
# Composite score  (70% MCQ + 30% resume)
# ---------------------------------------------------------------------------

def total_composite_score(mcq_score: float, resume_score_val: float) -> float:
    return round((mcq_score * 0.70) + (resume_score_val * 0.30), 2)
