from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, EmailStr, Field


DomainName = Literal["AWS DevOps", "QA", "Salesforce"]


class CandidateCreateResponse(BaseModel):
    candidate_id: int
    verification_token: str
    verification_url: str
    message: str


class CandidateStatus(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    domain: DomainName
    is_verified: bool
    mcq_score: float
    profile_score: float
    form_completion_score: float
    total_composite_score: float
    verification_token: str
    why_join: str


class ApplicationCreateIn(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    github_link: str = ""
    linkedin_link: str = ""
    domain: DomainName
    why_join: str


class MentorIn(BaseModel):
    name: str
    title: str
    bio: str
    expertise: str = ""
    email: EmailStr | str = ""
    image_url: str = ""


class MentorOut(MentorIn):
    id: int


class CurriculumIn(BaseModel):
    title: str
    description: str
    track: str = "Core"
    order_index: int = 0
    active: bool = True


class CurriculumOut(CurriculumIn):
    id: int


class AdminLoginIn(BaseModel):
    username: str
    password: str


class AdminLoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: str


class ServiceIn(BaseModel):
    title: str
    description: str
    order_index: int = 0
    active: bool = True


class ServiceOut(ServiceIn):
    id: int


class SiteContentIn(BaseModel):
    key: str
    value: str


class SiteContentOut(SiteContentIn):
    id: int


class EmailOutboxOut(BaseModel):
    id: int
    recipient_email: str
    subject: str
    body: str
    status: str


class QuestionOut(BaseModel):
    id: int
    prompt: str
    options: list[str]


class QuizQuestionBatch(BaseModel):
    candidate_id: int
    domain: DomainName
    total_questions: int
    questions: list[QuestionOut]


class QuizSubmissionIn(BaseModel):
    candidate_id: int = Field(..., ge=1)
    answers: list[int]


class QuizSubmissionOut(BaseModel):
    candidate_id: int
    mcq_score: float
    profile_score: float
    form_completion_score: float
    total_composite_score: float
    total_questions: int
    correct_answers: int
    message: str


class VerificationOut(BaseModel):
    candidate_id: int
    is_verified: bool
    message: str


class ContactSubmissionIn(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    message: str = Field(..., min_length=10)


class ContactSubmissionOut(BaseModel):
    message: str
