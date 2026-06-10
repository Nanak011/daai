# DAAI Fellowship Platform

Full-stack fellowship application and assessment platform.

## Stack

- **Frontend:** React 18, TypeScript, React Router, Tailwind CSS, Vite
- **Backend:** FastAPI, SQLAlchemy, Pydantic v2
- **Database:** AWS RDS (PostgreSQL)
- **Email:** AWS SES

## Quick start

```powershell
npm run dev
```

This starts both servers simultaneously:

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Public application |
| http://localhost:5173/admin.html | Admin portal |
| http://localhost:8001/docs | API docs (auto-generated) |

## First-time setup

```powershell
# 1. Create the Python virtual environment
python -m venv .venv
.venv\Scripts\pip install -r backend\requirements.txt

# 2. Install all JS dependencies (root + frontend)
npm run install:all
npm install
```

## Environment

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | AWS RDS PostgreSQL connection string |
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `SES_SENDER_EMAIL` | Verified sender address in AWS SES |
| `SES_SENDER_NAME` | Display name for outgoing emails |
| `AWS_SES_REGION` | AWS region where SES is configured |
| `ADMIN_USERNAME` | Admin portal login username |
| `ADMIN_PASSWORD` | Admin portal login password |
| `ADMIN_ALLOWED_IPS` | Comma-separated IPs allowed to access admin |

The frontend reads `VITE_API_URL` from `frontend/.env` (defaults to `http://localhost:8001/api`).
