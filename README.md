# DAAI Fellowship Application

A full-stack web application for managing fellowship applications with automated candidate evaluation through MCQ tests and resume analysis.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Application Flow](#application-flow)
- [Candidate Scoring](#candidate-scoring)
- [Security](#security)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [AWS Deployment](#aws-deployment)
- [Environment Variables](#environment-variables)
- [Production URLs](#production-urls)

---

## 🎯 Overview

**DAAI Fellowship** is a comprehensive fellowship management system that includes:
- Public-facing website for applicants
- Automated candidate evaluation (MCQ + Resume analysis)
- Email verification and notifications
- Secure admin panel for managing applications, mentors, curriculum, and content

---

## 🏗️ Architecture
<img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/41cee849-849f-4c88-a849-4742f9724980" />

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │     AWS EC2 (Ubuntu 26.04)         │
        │     IP: 107.23.114.31              │
        │                                     │
        │  ┌──────────────────────────────┐  │
        │  │   Nginx (Port 80)            │  │
        │  │   - Serves Frontend          │  │
        │  │   - Proxies /api to Backend  │  │
        │  │   - Serves /uploads files    │  │
        │  │   - IP restriction on /admin │  │
        │  └──────────┬───────────────────┘  │
        │             │                       │
        │  ┌──────────▼───────────────────┐  │
        │  │  FastAPI Backend (Port 8001) │  │
        │  │  - REST API endpoints        │  │
        │  │  - File uploads handler      │  │
        │  │  - Email via AWS SES         │  │
        │  │  - Resume scoring (pypdf)    │  │
        │  └──────────┬───────────────────┘  │
        │             │                       │
        └─────────────┼───────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
┌─────────────────┐      ┌──────────────────┐
│  AWS RDS        │      │   AWS SES        │
│  PostgreSQL     │      │   Email Service  │
│  - Database     │      │   - Verification │
│  - Port 5432    │      │   - Notifications│
└─────────────────┘      └──────────────────┘
```

### Key Components

1. **Nginx**: Reverse proxy and static file server
2. **FastAPI Backend**: REST API with Python
3. **React Frontend**: Single-page application
4. **PostgreSQL (RDS)**: Managed database
5. **AWS SES**: Email delivery service

---

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Custom DAAI theme** - Orange brand colors

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL ORM
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server
- **pypdf** - PDF parsing for resume analysis
- **boto3** - AWS SDK for Python (SES integration)

### Database
- **PostgreSQL** hosted on AWS RDS
- **Tables**: candidates, quiz_questions, quiz_attempts, mentors, curriculum_items, service_items, site_content, email_outbox, admin_sessions

### Infrastructure
- **AWS EC2** - Ubuntu 26.04 (t3.small instance)
- **AWS RDS** - PostgreSQL database
- **AWS SES** - Email service
- **Nginx** - Reverse proxy and web server
- **systemd** - Service management

---

## ✨ Features

### Public Website
- 🏠 **Home Page** - Fellowship overview and call-to-action
- ℹ️ **About Page** - Mission and vision
- 📚 **Curriculum Page** - Course structure (admin-editable)
- 🎯 **Services Page** - Fellowship tracks (admin-editable)
- 👥 **Mentors Page** - Meet the mentors with photos
- 📧 **Contact Page** - Get in touch
- 📝 **Application Form** - Multi-field form with PDF upload

### Candidate Flow
- ✅ **Email Verification** - Secure token-based verification
- 📝 **Domain-Specific MCQ Quiz** - 5 questions, 5-minute timer
- 🎯 **Automated Scoring** - 70% MCQ + 30% resume analysis
- 📊 **Results Page** - Detailed score breakdown

### Admin Panel
- 📊 **Dashboard** - Statistics and overview
- 👤 **Application Management** - View all candidates with scores
- 👔 **Mentor Management** - CRUD operations with image upload
- 📚 **Curriculum Management** - Add/edit/delete curriculum items
- 🎯 **Services Management** - Manage fellowship tracks
- ✏️ **Content Management** - Edit site text content
- 📧 **Email Outbox** - View sent emails

### Developer Experience
- 🚀 Single command dev server: `npm run dev`
- 🔥 Hot reload for frontend and backend
- 🔒 Type safety with TypeScript
- ⚙️ Environment-based configuration

---

## 🔄 Application Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    APPLICATION FLOW                          │
└──────────────────────────────────────────────────────────────┘

1. CANDIDATE APPLICATION
   │
   ├─► User visits website (http://107.23.114.31)
   │   │
   │   ├─► Browses: Home, About, Curriculum, Services, Mentors
   │   │
   │   └─► Clicks "Apply Now"
   │
   ├─► Application Form
   │   ├─► Name, Email, Phone
   │   ├─► GitHub, LinkedIn (optional)
   │   ├─► Domain selection (AWS DevOps, QA, Salesforce)
   │   ├─► "Why do you want to join?" (min 20 chars)
   │   └─► Resume upload (PDF only)
   │
   ├─► Backend Processing
   │   ├─► Saves candidate to PostgreSQL
   │   ├─► Uploads resume to /uploads/ directory
   │   ├─► Calculates initial resume score (30% weight)
   │   │   └─► Keywords: projects, certifications, education
   │   └─► Generates verification token
   │
   └─► Email Sent (AWS SES)
       └─► Contains verification link
       
       ↓

2. EMAIL VERIFICATION
   │
   ├─► Candidate clicks verification link
   │   └─► URL: /verify-email?token=xxx&candidateId=yyy
   │
   ├─► Backend updates is_verified = true
   │
   └─► Redirects to Quiz Page
   
       ↓

3. MCQ QUIZ (5 minutes, 5 questions)
   │
   ├─► Backend fetches 5 domain-specific questions
   │
   ├─► Candidate answers questions
   │
   ├─► Timer expires or Submit clicked
   │
   ├─► Backend Scoring
   │   ├─► MCQ Score (70% weight)
   │   ├─► Resume Score (30% weight)
   │   └─► Total Composite Score = (MCQ × 0.7) + (Resume × 0.3)
   │
   └─► Shows results page with breakdown
   
       ↓

4. ADMIN REVIEW
   │
   ├─► Admin logs in (http://107.23.114.31/admin.html)
   │   └─► IP-restricted + password protected
   │
   ├─► Dashboard shows:
   │   ├─► Total applications
   │   ├─► Verified candidates
   │   ├─► Score breakdowns
   │   └─► Email outbox
   │
   └─► Admin can:
       ├─► View all applications
       ├─► Manage mentors (with image upload)
       ├─► Update curriculum items
       ├─► Edit services
       └─► Update site content
```

---

## 🎯 Candidate Scoring

### Resume Scoring (30% weight)

The system analyzes uploaded PDFs for specific keywords:

```python
Keywords Checked:
├─► Projects (12 points)
│   └─► "project", "built", "developed", "github", "portfolio",
│       "deployed", "implemented", "capstone", "hackathon"
│
├─► Certifications (10 points)
│   └─► "certification", "certified", "certificate",
│       "aws certified", "salesforce certified", "istqb",
│       "comptia", "coursera", "udemy", "pluralsight"
│
└─► Education (8 points)
    └─► "bachelor", "master", "msc", "bsc", "university",
        "college", "degree", "diploma", "graduate",
        "computer science", "engineering"

Total: 30 points → normalized to 0-100 scale
```

### MCQ Scoring (70% weight)

```python
Score = (Correct Answers / Total Questions) × 100
```

### Final Composite Score

```python
Total Composite Score = (MCQ_Score × 0.70) + (Resume_Score × 0.30)
```

**Example:**
- MCQ Score: 80%
- Resume Score: 60%
- Total = (80 × 0.7) + (60 × 0.3) = 56 + 18 = **74%**

---

## 🔐 Security Implementation

### 1. IP-Based Access Control

Admin panel is restricted to whitelisted IPs via Nginx:

```nginx
location /admin.html {
    allow 110.44.117.228;  # Home IP
    allow 120.89.112.98;   # Office IP
    allow 103.190.41.169;  # Secondary IP
    deny all;
}
```

- Configured at Nginx level (no backend bypass possible)
- Easy to update via SSH when IP changes

### 2. Admin Authentication

- Session-based authentication with secure tokens
- Password stored in environment variables (not hardcoded)
- 12-hour session expiry
- Tokens stored in database with expiry timestamps

### 3. Database Security

- **RDS Security Group**: Only allows EC2 private IP (172.31.33.149/32)
- No public internet access to database
- Database credentials in `.env` (gitignored)
- Connection pooling with `pool_size=5` and `pool_pre_ping=True`

### 4. Email Security

- AWS SES with verified sender domain
- IAM credentials for SES access (not root keys)
- Background email sending (non-blocking with ThreadPoolExecutor)
- Email outbox for audit trail

### 5. File Upload Security

- **Resume uploads**: PDF-only validation
- **Mentor images**: JPEG, PNG, WebP, GIF only
- **File size limit**: 20MB (configured in Nginx)
- **Safe filenames**: Generated with `secrets.token_hex()`
- **Storage**: Isolated `/uploads/` directory

### 6. CORS Protection

```python
BACKEND_CORS_ORIGINS=http://localhost:5173,http://107.23.114.31
```

- Only allows requests from known origins
- Prevents unauthorized API access

---

## 🗄️ Database Schema

```sql
-- Candidates
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    github_link VARCHAR(500),
    linkedin_link VARCHAR(500),
    domain VARCHAR(50) NOT NULL,
    why_join TEXT NOT NULL,
    resume_path VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    mcq_score FLOAT DEFAULT 0.0,
    profile_score FLOAT DEFAULT 0.0,
    form_completion_score FLOAT DEFAULT 0.0,
    total_composite_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz Questions
CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    options JSON NOT NULL,
    correct_option_index INTEGER NOT NULL,
    position INTEGER NOT NULL
);

-- Quiz Attempts
CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(id),
    answers JSON NOT NULL,
    mcq_score FLOAT,
    composite_score FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mentors
CREATE TABLE mentors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    bio TEXT NOT NULL,
    expertise TEXT NOT NULL,
    email VARCHAR(255) NOT NULL,
    image_url VARCHAR(500) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Curriculum Items
CREATE TABLE curriculum_items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    track VARCHAR(100) NOT NULL,
    order_index INTEGER NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

-- Service Items
CREATE TABLE service_items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

-- Site Content
CREATE TABLE site_content (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL
);

-- Email Outbox
CREATE TABLE email_outbox (
    id SERIAL PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Sessions
CREATE TABLE admin_sessions (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📁 Project Structure

```
daai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI routes and endpoints
│   │   ├── database.py          # SQLAlchemy configuration
│   │   ├── models.py            # Database models
│   │   ├── schemas.py           # Pydantic schemas for validation
│   │   ├── scoring.py           # Scoring algorithms (MCQ + Resume)
│   │   └── seed.py              # Database seeding (questions)
│   ├── uploads/                 # Uploaded files (resumes, images)
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Backend environment variables
│   └── .env.example            # Example environment variables
│
├── frontend/
│   ├── src/
│   │   ├── pages/              # Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── AboutPage.tsx
│   │   │   ├── CurriculumPage.tsx
│   │   │   ├── ServicesPage.tsx
│   │   │   ├── MentorsPage.tsx
│   │   │   ├── ContactPage.tsx
│   │   │   ├── ApplyPage.tsx
│   │   │   ├── VerifyEmailPage.tsx
│   │   │   ├── QuizPage.tsx
│   │   │   ├── QuizCompletedPage.tsx
│   │   │   ├── AdminPage.tsx
│   │   │   └── ApplicationSubmittedPage.tsx
│   │   ├── components/         # Reusable components
│   │   │   └── Layout.tsx
│   │   ├── lib/
│   │   │   └── api.ts          # API client functions
│   │   ├── admin/              # Admin app entry
│   │   │   ├── AdminApp.tsx
│   │   │   └── main.tsx
│   │   ├── App.tsx             # Main app component
│   │   ├── main.tsx            # Frontend entry point
│   │   └── styles.css          # Tailwind styles
│   ├── public/
│   │   └── daai.png            # Logo image
│   ├── index.html              # Main HTML entry
│   ├── admin.html              # Admin panel HTML entry
│   ├── package.json            # Frontend dependencies
│   ├── vite.config.ts          # Vite configuration
│   ├── tailwind.config.cjs     # Tailwind configuration
│   ├── tsconfig.json           # TypeScript configuration
│   └── .env                    # Frontend environment variables
│
├── dev.mjs                     # Local development server script
├── package.json                # Root npm scripts
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

---

## 💻 Local Development

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **PostgreSQL** (or use AWS RDS)
- **Git**

### Setup Steps

1. **Clone the repository**

```bash
git clone https://github.com/Nanak011/daai.git
cd daai
```

2. **Install dependencies**

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
```

3. **Configure environment variables**

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database and AWS credentials

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env (default localhost should work)
```

4. **Start development servers**

```bash
npm run dev
```

This starts both backend and frontend:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8001
- **Admin Panel**: http://localhost:5173/admin.html

### Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin` (change in `.env`)

---

## 🚀 AWS Deployment

### Prerequisites

- AWS Account
- EC2 instance (Ubuntu 26.04, t3.small or larger)
- RDS PostgreSQL instance
- SES verified sender email
- Domain/IP for accessing the application

### Step 1: Launch EC2 Instance

```bash
# Instance type: t3.small
# OS: Ubuntu 26.04
# Security Group:
#   - SSH (22) from your IP
#   - HTTP (80) from 0.0.0.0/0
```

### Step 2: Connect and Install Dependencies

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3 python3-venv python3-pip git nginx nodejs npm

# Verify Python version
python3 --version  # Should be 3.12+
```

### Step 3: Clone and Setup Backend

```bash
# Clone repository
cd ~
git clone https://github.com/Nanak011/daai.git
cd daai

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install Python packages
pip install -r backend/requirements.txt

# Create .env file
nano backend/.env
# Add your production environment variables

# Test backend
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8001
# Press Ctrl+C after testing
```

### Step 4: Setup systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/daai.service
```

**Service file content:**

```ini
[Unit]
Description=DAAI Fellowship API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/daai/backend
Environment="PATH=/home/ubuntu/daai/.venv/bin"
ExecStart=/home/ubuntu/daai/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable and start service:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable daai
sudo systemctl start daai
sudo systemctl status daai
```

### Step 5: Build and Deploy Frontend

```bash
cd ~/daai/frontend

# Install dependencies
npm install

# Create production .env
nano .env
# Add: VITE_API_URL=http://YOUR_EC2_IP/api

# Build
npm run build

# Set permissions
chmod -R 755 /home/ubuntu/daai/frontend/dist
chmod 755 /home/ubuntu
```

### Step 6: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/daai
```

**Nginx configuration:**

```nginx
server {
    listen 80;
    server_name _;
    root /home/ubuntu/daai/frontend/dist;
    index index.html;

    # Serve uploaded files (mentor images, resumes)
    location /uploads/ {
        alias /home/ubuntu/daai/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /admin.html {
        allow YOUR_IP_HERE;  # Replace with your IP
        deny all;
        try_files $uri =404;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 20M;
    }
}
```

**Enable site:**

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/daai /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 7: Setup RDS PostgreSQL

1. Create RDS PostgreSQL instance
2. Database name: `daai`
3. Update Security Group to allow EC2 private IP:
   - Type: PostgreSQL
   - Port: 5432
   - Source: EC2 Private IP/32 (e.g., 172.31.33.149/32)

### Step 8: Setup AWS SES

1. Verify sender email in AWS SES
2. Create IAM user with SES send permissions
3. Add credentials to backend `.env`:
   ```
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   SES_SENDER_EMAIL=your_verified_email@domain.com
   ```

### Step 9: Create Uploads Directory

```bash
mkdir -p ~/daai/backend/uploads
chmod 755 ~/daai/backend/uploads
```

### Step 10: Test Deployment

```bash
# Test backend
curl http://localhost:8001/api/health

# Test frontend
curl http://localhost/

# Test uploads path
curl -I http://localhost/uploads/

# Check logs
sudo journalctl -u daai -f
```

---

## 🔧 Environment Variables

### Backend `.env`

```env
# Database
DATABASE_URL=postgresql+psycopg://username:password@host:5432/daai

# Frontend URL (for email links)
FRONTEND_URL=http://107.23.114.31

# CORS Origins
BACKEND_CORS_ORIGINS=http://localhost:5173,http://107.23.114.31

# File Uploads
UPLOAD_DIR=uploads

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
ADMIN_SESSION_HOURS=12

# Admin IP Whitelist (optional - Nginx handles this)
ADMIN_ALLOWED_IPS=

# AWS SES
SES_SENDER_EMAIL=your_email@domain.com
SES_SENDER_NAME=DAAI Fellowship
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Frontend `.env`

**Local Development:**
```env
VITE_API_URL=http://localhost:8001/api
```

**Production (on EC2):**
```env
VITE_API_URL=http://YOUR_EC2_IP/api
```

---

## 🌐 Production URLs

- **Website**: http://107.23.114.31
- **Admin Panel**: http://107.23.114.31/admin.html
- **API Health Check**: http://107.23.114.31/api/health
- **API Documentation**: http://107.23.114.31/api/docs (if enabled)

---

## 🔄 Updating Production

### Update Code

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@107.23.114.31

# Pull latest changes
cd ~/daai
git pull

# Install new dependencies (if any)
source .venv/bin/activate
pip install -r backend/requirements.txt

# Restart backend
sudo systemctl restart daai

# Rebuild frontend
cd frontend
npm install  # Only if package.json changed
npm run build
chmod -R 755 /home/ubuntu/daai/frontend/dist

# Reload Nginx
sudo systemctl reload nginx
```

### Update Admin IP Whitelist

```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/daai

# Update the allow directive with new IP
allow NEW_IP_HERE;

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🐛 Troubleshooting

### Backend Issues

```bash
# Check backend logs
sudo journalctl -u daai -f

# Check backend status
sudo systemctl status daai

# Restart backend
sudo systemctl restart daai

# Test backend directly
curl http://localhost:8001/api/health
```

### Frontend Issues

```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check file permissions
ls -la /home/ubuntu/daai/frontend/dist
```

### Database Issues

```bash
# Test RDS connection from EC2
nc -zv your-rds-endpoint.rds.amazonaws.com 5432

# Check RDS Security Group
# Ensure it allows EC2 private IP on port 5432
```

### Email Issues

```bash
# Check SES sending limits
# Verify sender email is verified in SES
# Check AWS credentials in .env
# View email outbox via admin panel
```

### Image Upload Issues

```bash
# Check uploads directory exists
ls -la ~/daai/backend/uploads/

# Create if missing
mkdir -p ~/daai/backend/uploads
chmod 755 ~/daai/backend/uploads

# Test uploads endpoint
curl -I http://localhost/uploads/

# Check Nginx config has /uploads/ location
```

---

## 📊 Monitoring

### Application Metrics

```bash
# CPU and Memory usage
htop

# Disk usage
df -h

# Backend process
ps aux | grep uvicorn

# Nginx connections
sudo systemctl status nginx
```

### Log Files

```bash
# Backend logs
sudo journalctl -u daai -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🧪 Testing

### Manual Testing Checklist

**Public Website:**
- [ ] Home page loads
- [ ] Navigation works
- [ ] All pages accessible
- [ ] Logo displays correctly
- [ ] Responsive design works

**Application Flow:**
- [ ] Can submit application with resume
- [ ] Verification email received
- [ ] Email link works and verifies email
- [ ] Quiz loads with 5 questions
- [ ] Timer counts down (5 minutes)
- [ ] Can submit quiz
- [ ] Results page shows correct scores

**Admin Panel:**
- [ ] Can login with credentials
- [ ] Dashboard shows statistics
- [ ] Can view applications
- [ ] Can add/edit/delete mentors
- [ ] Image upload works for mentors
- [ ] Can manage curriculum items
- [ ] Can manage services
- [ ] Can edit site content

---
