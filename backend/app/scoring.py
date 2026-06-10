from __future__ import annotations


def grade_mcq(submitted_answers: list[int], correct_answers: list[int]) -> tuple[float, int]:
    total_questions = len(correct_answers)
    correct_count = 0
    for index, correct_answer in enumerate(correct_answers):
        if index < len(submitted_answers) and submitted_answers[index] == correct_answer:
            correct_count += 1

    percentage = round((correct_count / total_questions) * 100, 2) if total_questions else 0.0
    return percentage, correct_count


def profile_quality_score(github_link: str, linkedin_link: str, resume_path: str) -> float:
    score = 0.0
    if github_link.strip():
        score += 40.0
    if linkedin_link.strip():
        score += 35.0
    if resume_path.strip():
        score += 25.0
    return round(min(score, 100.0), 2)


def form_completeness_score(fields: dict[str, str]) -> float:
    required_fields = list(fields.values())
    if not required_fields:
        return 0.0
    present = sum(1 for value in required_fields if str(value).strip())
    return round((present / len(required_fields)) * 100, 2)


def total_composite_score(mcq_score: float, profile_score: float, form_score: float) -> float:
    composite = (mcq_score * 0.5) + (profile_score * 0.3) + (form_score * 0.2)
    return round(composite, 2)
