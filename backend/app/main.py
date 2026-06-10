from __future__ import annotations

import os
import secrets
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import inspect, select, text
from sqlalchemy.orm import Session
from pydantic import EmailStr

from .database import Base, engine, get_db

load_dotenv()

from .models import AdminSession, Candidate, CurriculumItem, EmailOutbox, Mentor, QuizAttempt, QuizQuestion, ServiceItem, SiteContent
from .schemas import (
    CandidateCreateResponse,
    CandidateStatus,
    AdminLoginIn,
    AdminLoginOut,
    EmailOutboxOut,
    DomainName,
    CurriculumIn,
    CurriculumOut,
    MentorIn,
    MentorOut,
    QuestionOut,
    QuizQuestionBatch,
    QuizSubmissionIn,
    QuizSubmissionOut,
    ServiceIn,
    ServiceOut,
    SiteContentIn,
    SiteContentOut,
    VerificationOut,
)
from .scoring import form_completeness_score, grade_mcq, profile_quality_score, total_composite_score
from .seed import seed_questions


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
ALLOWED_DOMAINS = ["AWS DevOps", "QA", "Salesforce"]

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "change-me")
ADMIN_SESSION_HOURS = int(os.getenv("ADMIN_SESSION_HOURS", "12"))

# Comma-separated list of IPs allowed to access /api/admin/* and /admin.
# Example: ADMIN_ALLOWED_IPS=1.2.3.4,10.0.0.5
# Leave empty to allow all IPs (useful during initial setup, lock it down before production).
_raw_admin_ips = os.getenv("ADMIN_ALLOWED_IPS", "")
ADMIN_ALLOWED_IPS: set[str] = {ip.strip() for ip in _raw_admin_ips.split(",") if ip.strip()}

# AWS SES configuration
SES_REGION = os.getenv("AWS_SES_REGION", "us-east-1")
SES_SENDER_EMAIL = os.getenv("SES_SENDER_EMAIL", "")   # must be verified in SES
SES_SENDER_NAME = os.getenv("SES_SENDER_NAME", "DAAI Fellowship")
# AWS credentials are picked up automatically via environment variables
# AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (or IAM instance role when on EC2/ECS)

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title="DAAI Fellowship API")

# Thread pool for fire-and-forget email sends so API responses are never
# delayed by SES latency or transient failures.
_email_executor = ThreadPoolExecutor(max_workers=4)

cors_origins = [
    origin.strip()
    for origin in os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Admin IP allowlist middleware
# ---------------------------------------------------------------------------

@app.middleware("http")
async def admin_ip_guard(request: Request, call_next):
    """Block requests to admin routes from IPs not in ADMIN_ALLOWED_IPS.

    Checks both the direct client IP and the X-Forwarded-For header (for
    deployments behind a load balancer / reverse proxy).

    If ADMIN_ALLOWED_IPS is empty, all IPs are allowed (open mode).
    """
    if not ADMIN_ALLOWED_IPS:
        return await call_next(request)

    path = request.url.path
    is_admin_path = path.startswith("/api/admin") or path.startswith("/admin")
    if not is_admin_path:
        return await call_next(request)

    # Gather candidate IPs
    client_ip = request.client.host if request.client else ""
    forwarded_for = request.headers.get("X-Forwarded-For", "")
    # X-Forwarded-For can be a comma-separated list; take the first (leftmost) entry
    # which is the original client when behind a trusted proxy.
    forwarded_ips = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()]

    candidate_ips = {client_ip} | set(forwarded_ips)

    if candidate_ips & ADMIN_ALLOWED_IPS:
        return await call_next(request)

    return JSONResponse(status_code=403, content={"detail": "Access denied."})


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

@app.on_event("startup")
def startup() -> None:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("[DB] Connected to AWS RDS (PostgreSQL)")
    except Exception as exc:
        print(f"[DB] Connection failed: {exc}")

    Base.metadata.create_all(bind=engine)
    migrate_schema()
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    with Session(bind=engine) as db:
        seed_questions(db)
        seed_content(db)


def migrate_schema() -> None:
    """Add missing columns to existing tables (create_all won't add them)."""
    inspector = inspect(engine)
    for table, col, col_def in [
        ("mentors", "image_url", "VARCHAR(500) NOT NULL DEFAULT ''"),
        ("candidates", "why_join", "TEXT NOT NULL DEFAULT ''"),
    ]:
        existing_cols = {c["name"] for c in inspector.get_columns(table)}
        if col not in existing_cols:
            with engine.connect() as conn:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}"))
                conn.commit()
            print(f"[DB] Added {table}.{col} column")


def seed_content(db: Session) -> None:
    if db.scalar(select(SiteContent.id).limit(1)) is not None:
        return

    defaults = [
        SiteContent(key="hero_title", value="Build practical AI and data science skills with a focused fellowship path."),
        SiteContent(key="hero_subtitle", value="The DAAI Fellowship connects motivated learners to mentorship, industry projects, and a verified selection flow."),
        SiteContent(key="contact_email", value="hello@daai.org"),
        SiteContent(key="contact_phone", value="+1 555 0100"),
        SiteContent(key="contact_message", value="Reach out for applications, partnerships, or mentoring."),
        SiteContent(key="about_summary", value="DAAI exists to make practical AI education accessible, rigorous, and aligned with real-world hiring expectations."),
    ]
    db.add_all(defaults)
    db.add_all(
        [
            CurriculumItem(title="Foundation", description="Core thinking, workflow, and orientation for the fellowship.", track="Core", order_index=1),
            CurriculumItem(title="Applied Project", description="Hands-on track work tied to the selected domain.", track="Core", order_index=2),
            CurriculumItem(title="Capstone Review", description="Final review, scoring, and portfolio-ready feedback.", track="Core", order_index=3),
        ]
    )
    db.commit()


# ---------------------------------------------------------------------------
# Email via AWS SES
# ---------------------------------------------------------------------------

def send_email(db: Session, recipient: str, subject: str, body: str) -> None:
    """Send a transactional email via AWS SES and record it in the outbox."""
    outbox = EmailOutbox(recipient_email=recipient, subject=subject, body=body, status="queued")
    db.add(outbox)
    db.flush()

    sent = False

    if SES_SENDER_EMAIL:
        try:
            ses_client = boto3.client("ses", region_name=SES_REGION)
            ses_client.send_email(
                Source=f"{SES_SENDER_NAME} <{SES_SENDER_EMAIL}>",
                Destination={"ToAddresses": [recipient]},
                Message={
                    "Subject": {"Data": subject, "Charset": "UTF-8"},
                    "Body": {
                        "Text": {"Data": body, "Charset": "UTF-8"},
                        "Html": {
                            "Data": body.replace("\n", "<br>"),
                            "Charset": "UTF-8",
                        },
                    },
                },
            )
            sent = True
        except ClientError as exc:
            # Log the SES error code for easier debugging
            error_code = exc.response.get("Error", {}).get("Code", "Unknown")
            print(f"[SES] Send failed ({error_code}): {exc}")
            sent = False
        except Exception as exc:
            print(f"[SES] Unexpected error: {exc}")
            sent = False
    else:
        print("[SES] SES_SENDER_EMAIL is not configured — email not sent.")

    outbox.status = "sent" if sent else "failed"
    db.commit()


def send_email_background(recipient: str, subject: str, body: str) -> None:
    """Fire-and-forget email: opens its own DB session in a background thread
    so the calling request handler returns immediately without waiting for SES."""
    def _send() -> None:
        from .database import SessionLocal
        with SessionLocal() as db:
            send_email(db, recipient, subject, body)

    _email_executor.submit(_send)


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def create_admin_token(db: Session) -> tuple[str, datetime]:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=ADMIN_SESSION_HOURS)
    db.add(AdminSession(token=token, expires_at=expires_at))
    db.commit()
    return token, expires_at


def require_admin(
    authorization: str | None = Header(default=None),
    x_admin_token: str | None = Header(default=None, alias="X-Admin-Token"),
    db: Session = Depends(get_db),
) -> AdminSession:
    token = x_admin_token or authorization or ""
    if token.lower().startswith("bearer "):
        token = token[7:]
    token = token.strip()
    if not token:
        raise HTTPException(status_code=401, detail="Admin token is required.")

    session = db.scalar(select(AdminSession).where(AdminSession.token == token))
    if session is None:
        raise HTTPException(status_code=401, detail="Invalid admin session.")
    if session.expires_at < datetime.utcnow():
        db.delete(session)
        db.commit()
        raise HTTPException(status_code=401, detail="Admin session expired.")
    return session


# ---------------------------------------------------------------------------
# Email body helpers
# ---------------------------------------------------------------------------

def application_body(candidate: Candidate, verification_url: str) -> str:
    return (
        f"Hello {candidate.full_name},\n\n"
        f"We received your DAAI Fellowship application for {candidate.domain}.\n"
        f"Why do you want to join: {candidate.why_join}\n\n"
        f"Your application copy:\n"
        f"Name: {candidate.full_name}\nEmail: {candidate.email}\nPhone: {candidate.phone}\n"
        f"GitHub: {candidate.github_link or 'N/A'}\nLinkedIn: {candidate.linkedin_link or 'N/A'}\n\n"
        f"Verification link: {verification_url}\n\n"
        f"After verification, we will unlock your quiz link and send the next steps."
    )


# ---------------------------------------------------------------------------
# Serialisation helpers
# ---------------------------------------------------------------------------

def candidate_to_status(candidate: Candidate) -> CandidateStatus:
    return CandidateStatus(
        id=candidate.id,
        full_name=candidate.full_name,
        email=candidate.email,
        domain=candidate.domain,  # type: ignore[arg-type]
        is_verified=candidate.is_verified,
        mcq_score=candidate.mcq_score,
        profile_score=candidate.profile_score,
        form_completion_score=candidate.form_completion_score,
        total_composite_score=candidate.total_composite_score,
        verification_token=candidate.verification_token,
        why_join=candidate.why_join,
    )


def mentor_to_out(mentor: Mentor) -> MentorOut:
    return MentorOut(
        id=mentor.id,
        name=mentor.name,
        title=mentor.title,
        bio=mentor.bio,
        expertise=mentor.expertise,
        email=mentor.email,
        image_url=mentor.image_url,
    )


def curriculum_to_out(item: CurriculumItem) -> CurriculumOut:
    return CurriculumOut(
        id=item.id,
        title=item.title,
        description=item.description,
        track=item.track,
        order_index=item.order_index,
        active=item.active,
    )


# ---------------------------------------------------------------------------
# Public routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/domains")
def domains() -> dict[str, list[str]]:
    return {"domains": ALLOWED_DOMAINS}


@app.get("/api/curriculum", response_model=list[CurriculumOut])
def list_curriculum(db: Session = Depends(get_db)) -> list[CurriculumOut]:
    items = db.scalars(select(CurriculumItem).where(CurriculumItem.active == True).order_by(CurriculumItem.order_index.asc())).all()  # noqa: E712
    return [curriculum_to_out(item) for item in items]


@app.post("/api/applications", response_model=CandidateCreateResponse)
async def create_application(
    full_name: str = Form(...),
    email: EmailStr = Form(...),
    phone: str = Form(...),
    github_link: str = Form(""),
    linkedin_link: str = Form(""),
    domain: DomainName = Form(...),
    why_join: str = Form(...),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> CandidateCreateResponse:
    if len(full_name.strip()) < 3:
        raise HTTPException(status_code=400, detail="Full name must be at least 3 characters.")
    if len(phone.strip()) < 7:
        raise HTTPException(status_code=400, detail="Phone number is too short.")
    if len(why_join.strip()) < 20:
        raise HTTPException(status_code=400, detail="Please tell us more about why you want to join.")
    if not resume.filename or not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Resume must be a PDF file.")
    if github_link and not github_link.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="GitHub link must include http:// or https://")
    if linkedin_link and not linkedin_link.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="LinkedIn link must include http:// or https://")

    normalized_email = str(email).strip().lower()
    existing = db.scalar(select(Candidate).where(Candidate.email == normalized_email))
    if existing is not None:
        raise HTTPException(status_code=409, detail="An application already exists for this email.")

    verification_token = secrets.token_urlsafe(24)
    candidate = Candidate(
        full_name=full_name.strip(),
        email=normalized_email,
        phone=phone.strip(),
        github_link=github_link.strip(),
        linkedin_link=linkedin_link.strip(),
        domain=domain,
        verification_token=verification_token,
        why_join=why_join.strip(),
    )
    db.add(candidate)
    db.flush()

    safe_filename = f"candidate-{candidate.id}-{resume.filename}"
    file_path = UPLOAD_DIR / safe_filename
    with file_path.open("wb") as buffer:
        buffer.write(await resume.read())

    candidate.resume_path = str(file_path)
    candidate.profile_score = profile_quality_score(candidate.github_link, candidate.linkedin_link, candidate.resume_path)
    candidate.form_completion_score = form_completeness_score(
        {
            "full_name": candidate.full_name,
            "email": candidate.email,
            "phone": candidate.phone,
            "github_link": candidate.github_link,
            "linkedin_link": candidate.linkedin_link,
            "resume_path": candidate.resume_path,
            "domain": candidate.domain,
        }
    )
    candidate.total_composite_score = total_composite_score(candidate.mcq_score, candidate.profile_score, candidate.form_completion_score)
    db.commit()
    db.refresh(candidate)

    verification_url = f"{FRONTEND_URL}/verify-email?token={candidate.verification_token}&candidateId={candidate.id}"
    send_email_background(candidate.email, "DAAI Fellowship application received", application_body(candidate, verification_url))
    return CandidateCreateResponse(
        candidate_id=candidate.id,
        verification_token=candidate.verification_token,
        verification_url=verification_url,
        message="Application received. Check your email for verification.",
    )


@app.get("/api/applications/{candidate_id}", response_model=CandidateStatus)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)) -> CandidateStatus:
    candidate = db.get(Candidate, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return candidate_to_status(candidate)


@app.get("/api/verify", response_model=VerificationOut)
def verify_email(token: str, db: Session = Depends(get_db)) -> VerificationOut:
    candidate = db.scalar(select(Candidate).where(Candidate.verification_token == token))
    if candidate is None:
        raise HTTPException(status_code=404, detail="Invalid verification token.")

    # Already verified — return success without sending another email
    if candidate.is_verified:
        return VerificationOut(candidate_id=candidate.id, is_verified=True, message="Email already verified.")

    candidate.is_verified = True
    db.commit()
    return VerificationOut(candidate_id=candidate.id, is_verified=True, message="Email verified successfully.")


@app.get("/api/quiz/questions/{domain}", response_model=QuizQuestionBatch)
def get_quiz_questions(domain: DomainName, candidate_id: int, db: Session = Depends(get_db)) -> QuizQuestionBatch:
    candidate = db.get(Candidate, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    if not candidate.is_verified:
        raise HTTPException(status_code=403, detail="Email verification is required before taking the quiz.")
    if candidate.domain != domain:
        raise HTTPException(status_code=400, detail="Selected domain does not match the candidate record.")

    questions = db.scalars(
        select(QuizQuestion).where(QuizQuestion.domain == domain).order_by(QuizQuestion.position.asc())
    ).all()

    return QuizQuestionBatch(
        candidate_id=candidate.id,
        domain=domain,
        total_questions=len(questions),
        questions=[QuestionOut(id=q.id, prompt=q.prompt, options=q.options) for q in questions],
    )


@app.post("/api/quiz/submit", response_model=QuizSubmissionOut)
def submit_quiz(payload: QuizSubmissionIn, db: Session = Depends(get_db)) -> QuizSubmissionOut:
    candidate = db.get(Candidate, payload.candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    if not candidate.is_verified:
        raise HTTPException(status_code=403, detail="Email verification is required before scoring the quiz.")

    questions = db.scalars(
        select(QuizQuestion).where(QuizQuestion.domain == candidate.domain).order_by(QuizQuestion.position.asc())
    ).all()
    correct_answers = [q.correct_option_index for q in questions]
    mcq_score, correct_count = grade_mcq(payload.answers, correct_answers)

    profile_score = profile_quality_score(candidate.github_link, candidate.linkedin_link, candidate.resume_path)
    form_score = form_completeness_score(
        {
            "full_name": candidate.full_name,
            "email": candidate.email,
            "phone": candidate.phone,
            "github_link": candidate.github_link,
            "linkedin_link": candidate.linkedin_link,
            "resume_path": candidate.resume_path,
            "domain": candidate.domain,
        }
    )
    composite_score = total_composite_score(mcq_score, profile_score, form_score)

    candidate.mcq_score = mcq_score
    candidate.profile_score = profile_score
    candidate.form_completion_score = form_score
    candidate.total_composite_score = composite_score
    db.add(
        QuizAttempt(
            candidate_id=candidate.id,
            answers=payload.answers,
            mcq_score=mcq_score,
            composite_score=composite_score,
        )
    )
    db.commit()

    return QuizSubmissionOut(
        candidate_id=candidate.id,
        mcq_score=mcq_score,
        profile_score=profile_score,
        form_completion_score=form_score,
        total_composite_score=composite_score,
        total_questions=len(questions),
        correct_answers=correct_count,
        message="Quiz completed and scored successfully.",
    )


@app.get("/api/mentors", response_model=list[MentorOut])
def list_mentors(db: Session = Depends(get_db)) -> list[MentorOut]:
    mentors = db.scalars(select(Mentor).order_by(Mentor.created_at.desc())).all()
    return [mentor_to_out(m) for m in mentors]


@app.get("/api/services", response_model=list[ServiceOut])
def list_services(db: Session = Depends(get_db)) -> list[ServiceOut]:
    services = db.scalars(select(ServiceItem).where(ServiceItem.active == True).order_by(ServiceItem.order_index.asc())).all()  # noqa: E712
    return [ServiceOut(id=s.id, title=s.title, description=s.description, order_index=s.order_index, active=s.active) for s in services]


@app.get("/api/site-content", response_model=list[SiteContentOut])
def get_site_content(db: Session = Depends(get_db)) -> list[SiteContentOut]:
    rows = db.scalars(select(SiteContent).order_by(SiteContent.key.asc())).all()
    return [SiteContentOut(id=row.id, key=row.key, value=row.value) for row in rows]


# ---------------------------------------------------------------------------
# Admin routes
# ---------------------------------------------------------------------------

@app.post("/api/admin/login", response_model=AdminLoginOut)
def admin_login(payload: AdminLoginIn, db: Session = Depends(get_db)) -> AdminLoginOut:
    if payload.username != ADMIN_USERNAME or payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    token, expires_at = create_admin_token(db)
    return AdminLoginOut(access_token=token, expires_at=expires_at.isoformat())


@app.get("/api/admin/me")
def admin_me(session: AdminSession = Depends(require_admin)) -> dict[str, str]:
    return {"token": session.token, "expires_at": session.expires_at.isoformat()}


@app.post("/api/admin/logout")
def admin_logout(session: AdminSession = Depends(require_admin), db: Session = Depends(get_db)) -> dict[str, str]:
    db.delete(session)
    db.commit()
    return {"message": "Logged out."}


@app.get("/api/admin/applications", response_model=list[CandidateStatus])
def admin_applications(_: AdminSession = Depends(require_admin), db: Session = Depends(get_db)) -> list[CandidateStatus]:
    candidates = db.scalars(select(Candidate).order_by(Candidate.created_at.desc())).all()
    return [candidate_to_status(c) for c in candidates]


@app.get("/api/admin/applications/{candidate_id}", response_model=CandidateStatus)
def admin_application(candidate_id: int, _: AdminSession = Depends(require_admin), db: Session = Depends(get_db)) -> CandidateStatus:
    candidate = db.get(Candidate, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return candidate_to_status(candidate)


@app.get("/api/admin/email-outbox", response_model=list[EmailOutboxOut])
def admin_email_outbox(_: AdminSession = Depends(require_admin), db: Session = Depends(get_db)) -> list[EmailOutboxOut]:
    rows = db.scalars(select(EmailOutbox).order_by(EmailOutbox.created_at.desc())).all()
    return [EmailOutboxOut(id=row.id, recipient_email=row.recipient_email, subject=row.subject, body=row.body, status=row.status) for row in rows]


@app.get("/api/admin/mentors", response_model=list[MentorOut])
def admin_mentors(_: AdminSession = Depends(require_admin), db: Session = Depends(get_db)) -> list[MentorOut]:
    mentors = db.scalars(select(Mentor).order_by(Mentor.created_at.desc())).all()
    return [mentor_to_out(m) for m in mentors]


@app.post("/api/admin/mentors", response_model=MentorOut)
def create_mentor(payload: MentorIn, _: AdminSession = Depends(require_admin), db: Session = Depends(get_db)) -> MentorOut:
    mentor = Mentor(
        name=payload.name.strip(),
        title=payload.title.strip(),
        bio=payload.bio.strip(),
        expertise=payload.expertise.strip(),
        email=str(payload.email).strip(),
        image_url=payload.image_url.strip(),
    )
    db.add(mentor)
    db.commit()
    db.refresh(mentor)
    return mentor_to_out(mentor)


@app.put("/api/admin/mentors/{mentor_id}", response_model=MentorOut)
def update_mentor(mentor_id: int, payload: MentorIn, _: AdminSession = Depends(require_admin), db: Session = Depends(get_db)) -> MentorOut:
    mentor = db.get(Mentor, mentor_id)
    if mentor is None:
        raise HTTPException(status_code=404, detail="Mentor not found.")
    mentor.name = payload.name.strip()
    mentor.title = payload.title.strip()
    mentor.bio = payload.bio.strip()
    mentor.expertise = payload.expertise.strip()
    mentor.email = str(payload.email).strip()
    mentor.image_url = payload.image_url.strip()
    db.commit()
    db.refresh(mentor)
    return mentor_to_out(mentor)


@app.delete("/api/admin/mentors/{mentor_id}")
def delete_mentor(mentor_id: int, _: AdminSession = Depends(require_admin), db: Session = Depends(get_db)) -> dict[str, str]:
    mentor = db.get(Mentor, mentor_id)
    if mentor is None:
        raise HTTPException(status_code=404, detail="Mentor not found.")
    db.delete(mentor)
    db.commit()
    return {"message": "Mentor deleted."}


@app.get("/api/admin/curriculum", response_model=list[CurriculumOut])
def admin_curriculum(_: AdminSession = Depends(require_admin), db: Session = Depends(get_db)) -> list[CurriculumOut]:
    items = db.scalars(select(CurriculumItem).order_by(CurriculumItem.order_index.asc())).all()
    return [curriculum_to_out(item) for item in items]


@app.post("/api/admin/curriculum", response_model=CurriculumOut)
def create_curriculum_item(payload: CurriculumIn, _: AdminSession = Depends(require_admin), db: Session = Depends(get_db)) -> CurriculumOut:
    item = CurriculumItem(
        title=payload.title.strip(),
        description=payload.description.strip(),
        track=payload.track.strip(),
        order_index=payload.order_index,
        active=payload.active,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return curriculum_to_out(item)


@app.put("/api/admin/curriculum/{item_id}", response_model=CurriculumOut)
def update_curriculum_item(item_id: int, payload: CurriculumIn, _: AdminSession = Depends(require_admin), db: Session = Depends(get_db)) -> CurriculumOut:
    item = db.get(CurriculumItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Curriculum item not found.")
    item.title = payload.title.strip()
    item.description = payload.description.strip()
    item.track = payload.track.strip()
    item.order_index = payload.order_index
    item.active = payload.active
    db.commit()
    db.refresh(item)
    return curriculum_to_out(item)


@app.delete("/api/admin/curriculum/{item_id}")
def delete_curriculum_item(item_id: int, _: AdminSession = Depends(require_admin), db: Session = Depends(get_db)) -> dict[str, str]:
    item = db.get(CurriculumItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Curriculum item not found.")
    db.delete(item)
    db.commit()
    return {"message": "Curriculum item deleted."}


@app.get("/api/admin/services", response_model=list[ServiceOut])
def admin_services(_: AdminSession = Depends(require_admin), db: Session = Depends(get_db)) -> list[ServiceOut]:
    services = db.scalars(select(ServiceItem).order_by(ServiceItem.order_index.asc())).all()
    return [ServiceOut(id=s.id, title=s.title, description=s.description, order_index=s.order_index, active=s.active) for s in services]


@app.post("/api/admin/services", response_model=ServiceOut)
def create_service(payload: ServiceIn, _: AdminSession = Depends(require_admin), db: Session = Depends(get_db)) -> ServiceOut:
    service = ServiceItem(title=payload.title.strip(), description=payload.description.strip(), order_index=payload.order_index, active=payload.active)
    db.add(service)
    db.commit()
    db.refresh(service)
    return ServiceOut(id=service.id, title=service.title, description=service.description, order_index=service.order_index, active=service.active)


@app.put("/api/admin/services/{service_id}", response_model=ServiceOut)
def update_service(service_id: int, payload: ServiceIn, _: AdminSession = Depends(require_admin), db: Session = Depends(get_db)) -> ServiceOut:
    service = db.get(ServiceItem, service_id)
    if service is None:
        raise HTTPException(status_code=404, detail="Service not found.")
    service.title = payload.title.strip()
    service.description = payload.description.strip()
    service.order_index = payload.order_index
    service.active = payload.active
    db.commit()
    db.refresh(service)
    return ServiceOut(id=service.id, title=service.title, description=service.description, order_index=service.order_index, active=service.active)


@app.delete("/api/admin/services/{service_id}")
def delete_service(service_id: int, _: AdminSession = Depends(require_admin), db: Session = Depends(get_db)) -> dict[str, str]:
    service = db.get(ServiceItem, service_id)
    if service is None:
        raise HTTPException(status_code=404, detail="Service not found.")
    db.delete(service)
    db.commit()
    return {"message": "Service deleted."}


@app.put("/api/admin/site-content", response_model=SiteContentOut)
def update_site_content(payload: SiteContentIn, _: AdminSession = Depends(require_admin), db: Session = Depends(get_db)) -> SiteContentOut:
    row = db.scalar(select(SiteContent).where(SiteContent.key == payload.key))
    if row is None:
        row = SiteContent(key=payload.key, value=payload.value.strip())
        db.add(row)
    else:
        row.value = payload.value.strip()
    db.commit()
    db.refresh(row)
    return SiteContentOut(id=row.id, key=row.key, value=row.value)
