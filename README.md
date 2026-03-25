# Jobie: The AI-Driven Career Intelligence Platform

**Version:** 1.0.0-beta &gt; **Codename:** *Project Supernova* &gt; **Initiated:** 2025 &gt; **Status:** Active Development &gt; **License:** Proprietary

---

## 📌 Executive Summary

**Jobie** is a next-generation, AI-driven talent acquisition and career intelligence platform built on the MERN+ stack (MongoDB, Express.js, React/Next.js, Node.js — augmented with MySQL, Firebase, and Groq AI). It fundamentally reimagines how talent meets opportunity by replacing the broken resume-first paradigm with a **proof-of-work, skills-verified, data-driven hiring ecosystem**.

Traditional job portals suffer from three critical failures:
1.  **Signal-to-noise collapse** — Resumes are self-reported, unverified documents that recruiters can't trust.
2.  **Manual screening paralysis** — Recruiters spend 23 seconds per resume on average, missing qualified candidates.
3.  **Career development blindness** — Candidates have zero insight into what skills they need to acquire next.

Jobie solves all three by introducing:
- **GitHub-verified skill profiles** with confidence scoring
- **AI-powered match scoring** between candidates and jobs
- **ATS resume analysis** with actionable gap remediation
- **Career roadmap generation** with learning paths
- **Intelligent candidate ranking** for recruiters
- **Real-time platform analytics** for administrators

---

## 🎯 Vision & Mission

### Vision

To become the **global standard for skills-verified hiring** — where every candidate is evaluated on what they can *build*, not just what they *claim*.

### Mission

Eliminate hiring friction by connecting verified talent with the right opportunities through AI-powered matching, GitHub skill verification, and data-driven career intelligence — making hiring faster, fairer, and fundamentally better for all parties.

### Core Principles

| Principle | Description |
|---|---|
| **Proof Over Promise** | Verified GitHub data &gt; self-reported resume claims |
| **AI-Augmented, Not AI-Replaced** | AI assists humans in decisions; it never replaces judgment |
| **Transparency First** | Explainable match scores — candidates know *why* they match |
| **Career Growth Engine** | Not just a job board — a platform that grows careers |
| **Data-Driven Everything** | Every feature backed by analytics and measurable outcomes |

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│ CLIENT LAYER                                                         │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐     │
│ │ Next.js 16 (App Router + Turbopack)                          │     │
│ │ ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐         │     │
│ │ │ Tailwind│ │ GSAP    │ │ Framer   │ │ Recharts /   │         │     │
│ │ │ CSS v4  │ │ ScrollT │ │ Motion   │ │ Chart.js     │         │     │
│ │ └─────────┘ └─────────┘ └──────────┘ └──────────────┘         │     │
│ │ ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐         │     │
│ │ │ Firebase    │ │ Lucide Icons │ │ React Icons      │         │     │
│ │ │ Auth SDK    │ │              │ │                  │         │     │
│ │ └─────────────┘ └──────────────┘ └──────────────────┘         │     │
│ └──────────────────────────────────────────────────────────────┘     │
│                                REST API                              │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────┐
│ API GATEWAY                                                          │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐     │
│ │ Express.js 5 (TypeScript)                                    │     │
│ │                                                              │     │
│ │ /api/auth       — Authentication & Registration              │     │
│ │ /api/jobs       — Job CRUD & Search                          │     │
│ │ /api/applications — Application Management                   │     │
│ │ /api/profile    — Candidate Profile CRUD                     │     │
│ │ /api/match      — Smart Match Scoring Engine                 │     │
│ │ /api/admin      — Platform Administration                    │     │
│ │ /api/github     — GitHub Skill Verification                  │     │
│ │ /api/resume     — AI Resume Parsing & Analysis               │     │
│ │ /api/ats        — ATS Compatibility Checker                  │     │
│ │ /api/uploads    — File Upload Management                     │     │
│ └──────────────────────────────────────────────────────────────┘     │
│                                │                                     │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐         │
│ │ JWT Auth     │ │ Firebase     │ │ Multer               │         │
│ │ Middleware   │ │ Admin SDK    │ │ (File Uploads)       │         │
│ └──────────────┘ └──────────────┘ └──────────────────────┘         │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────┐
│ SERVICE LAYER                                                        │
│                                                                      │
│ ┌────────────────┐ ┌──────────────────┐ ┌───────────────────┐        │
│ │ ATS Service    │ │ GitHub Service   │ │ Resume Service    │        │
│ │ (Groq AI)      │ │ (GitHub API)     │ │ (Groq + Parse)    │        │
│ └────────────────┘ └──────────────────┘ └───────────────────┘        │
│ ┌────────────────┐ ┌──────────────────┐ ┌───────────────────┐        │
│ │ Match Service  │ │ Roadmap Service  │ │ DB Fallback Svc   │        │
│ │ (Scoring Algo) │ │ (Career Paths)   │ │ (MySQL→Mongo)     │        │
│ └────────────────┘ └──────────────────┘ └───────────────────┘        │
│ ┌────────────────┐                                                   │
│ │ Parser Service │                                                   │
│ │ (PDF/DOCX)     │                                                   │
│ └────────────────┘                                                   │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────┐
│ DATA LAYER                                                           │
│                                                                      │
│ ┌─────────────────────┐ ┌─────────────────────────────┐              │
│ │ MySQL (Sequelize)   │ │ MongoDB (Mongoose)          │              │
│ │                     │ │                             │              │
│ │ • Users             │ │ • MongoUser (fallback)      │              │
│ │ • Jobs              │ │ • MongoProfile (fallback)   │              │
│ │ • Applications      │ │ • Session data              │              │
│ │ • Profiles          │ │ • Unstructured analytics    │              │
│ │ • AtsChecks         │ │                             │              │
│ │ • AtsRoadmaps       │ │                             │              │
│ └─────────────────────┘ └─────────────────────────────┘              │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐     │
│ │ External Services                                            │     │
│ │ • Firebase Auth (Google/GitHub OAuth)                        │     │
│ │ • Groq AI (LLaMA-based LLM inference)                        │     │
│ │ • GitHub REST API (Skill verification)                       │     │
│ │ • Nodemailer/Gmail (Email notifications)                     │     │
│ └──────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
```

### Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Dual Database** | MySQL (primary) + MongoDB (fallback) | Relational integrity for core data; document flexibility for unstructured AI outputs; fault-tolerant with automatic fallback |
| **ORM** | Sequelize (MySQL) + Mongoose (MongoDB) | Type-safe models with migration support; Mongoose for flexible schemas |
| **Auth Strategy** | Firebase Auth + JWT | Firebase handles OAuth complexity (Google, GitHub); JWT enables stateless API auth |
| **AI Engine** | Groq SDK (LLaMA) | Ultra-fast inference for resume parsing & ATS analysis; cost-effective vs. OpenAI |
| **Frontend Framework** | Next.js 16 (App Router) | Server components, Turbopack for fast dev, file-based routing |
| **Build Tool** | Turbopack | 10x faster than Webpack; native Next.js 16 integration |
| **Animation** | GSAP + Framer Motion | GSAP for scroll-driven cinematics; Framer Motion for component transitions |
| **Testing** | Jest (backend) + Playwright (frontend) | Unit/integration testing + full E2E browser testing |

---

## 👥 User Roles & Personas

### 1. 👤 Job Seeker (Candidate)

**Persona:** A developer or professional seeking their next role, wanting to showcase real skills beyond a resume.

**Capabilities:**
- Register / Login (Email, Google OAuth, GitHub OAuth)
- Build **proof-of-work profiles** with projects, tech stacks, and portfolio links
- Upload resumes (PDF/DOCX) for **AI-powered parsing** and auto-profile generation
- **GitHub Skill Verification** — connect GitHub to auto-verify claimed skills with confidence scores
- View **Smart Match Scores** against every job listing
- Browse, search, and filter jobs by skills, location, experience level, company
- Apply to jobs with one click
- Track application status (Applied → Shortlisted → Interview → Offer → Hired)
- Access **Skill Gap Analysis** showing missing skills vs. job requirements
- Generate **Career Roadmaps** with personalized learning paths for target roles
- View **Candidate Analytics Dashboard** (profile completeness, match trends, application success rate)
- **ATS Resume Check** — scan resume against job descriptions for ATS compatibility
- Access **ATS Fix Roadmaps** — AI-generated improvement plans for low-scoring resumes
- View **Resume Report Cards** with detailed scoring

### 2. 🏢 Recruiter

**Persona:** A hiring manager or talent acquisition professional seeking the best candidates efficiently.

**Capabilities:**
- Create and manage **Company Profiles** (name, logo, industry, website, description)
- Post, edit, and delete job listings with required skills, tech stack, experience level
- View applicants **ranked by match score** (intelligent candidate ranking)
- Filter candidates by match percentage, skills, experience, project count
- Accept, reject, or shortlist applications
- Access **Hiring Analytics Dashboard** (applicants per job, average match scores, top skills, time-to-fill)
- View candidate proof-of-work profiles with verified GitHub data
- Manage job posting lifecycle (draft → approved → closed)

### 3. 🛡️ Administrator

**Persona:** Platform operator responsible for system health, moderation, and analytics.

**Capabilities:**
- **User Management** — view, search, ban/unban all users (candidates and recruiters)
- **Job Management** — view all postings, approve/reject/delete listings, monitor activity
- **Platform Analytics Dashboard** — total users, jobs, applications, growth metrics
- **Application Management** — view all applications, monitor hiring pipeline
- **Platform Monitoring** — suspicious activity detection, data consistency checks
- **Real-time Stats** — live application feed, active users, daily job postings
- **Content Moderation** — remove inappropriate listings, manage platform health

---

## ✨ Core Feature Matrix

### Intelligence Features

| Feature | Description | AI/Algorithm | Status |
|---|---|---|---|
| **Smart Match Score** | Calculates percentage match between candidate profile and job requirements | Weighted skill/experience/project overlap algorithm | ✅ Built |
| **GitHub Skill Verification** | Analyzes GitHub repos to verify claimed skills with confidence levels | GitHub API + language analysis + commit activity scoring | ✅ Built |
| **GitHub Deep Scan** | Full repository analysis including code complexity, framework detection, commit patterns | Advanced GitHub API integration with multi-repo analysis | ✅ Built |
| **AI Resume Parser** | Extracts structured data from PDF/DOCX resumes to auto-fill profiles | Groq AI (LLaMA) + pdf-parse + mammoth | ✅ Built |
| **ATS Compatibility Checker** | Scores resume against job descriptions for ATS compatibility | Groq AI keyword extraction + matching algorithm | ✅ Built |
| **ATS Fix Roadmap** | Generates personalized improvement plan when ATS score is low | Groq AI career guidance + skill gap analysis | ✅ Built |
| **Career Roadmap Generator** | Creates learning path for target roles with skills, resources, projects | Groq AI + predefined roadmap templates | ✅ Built |
| **Skill Gap Analysis** | Identifies missing skills comparing candidate profile to job requirements | Set-difference algorithm on normalized skill lists | ✅ Built |
| **Intelligent Candidate Ranking** | Auto-ranks applicants by match score for recruiter review | Multi-factor scoring algorithm | ✅ Built |
| **Job Compatibility Explanation**| Explains WHY a candidate matches/doesn't match (Explainable AI) | Matched/missing skill breakdown | ✅ Built |

### Platform Features

| Feature | Description | Status |
|---|---|---|
| **Proof-of-Work Profiles** | Projects, tech stacks, live demos, GitHub links, screenshots | ✅ Built |
| **Resume Upload & Management** | PDF/DOCX upload with preview and report card generation | ✅ Built |
| **Advanced Job Search & Filtering**| Filter by skills, location, experience, company, salary | ✅ Built |
| **Application Tracking System** | Multi-stage pipeline (Applied → Shortlisted → Interview → Offer → Hired) | ✅ Built |
| **Recruiter Dashboard** | Job management, applicant review, hiring analytics | ✅ Built |
| **Admin Dashboard** | User/job/application management, platform analytics, moderation | ✅ Built |
| **Candidate Analytics Dashboard**| Profile strength, match trends, application success metrics | ✅ Built |
| **Hiring Analytics Dashboard** | Recruiter insights: applicant quality, trends, time-to-fill | ✅ Built |
| **Role-Based Access Control** | Candidate / Recruiter / Admin with permission enforcement | ✅ Built |
| **Multi-Auth System** | Email/Password + Google OAuth + GitHub OAuth (Firebase) | ✅ Built |
| **Email Notifications** | Nodemailer/Gmail for transactional emails | ✅ Built |
| **Dark Mode** | Full dark/light theme support via next-themes | ✅ Built |
| **Responsive UI** | Mobile-first responsive design across all pages | ✅ Built |
| **News Feed** | Industry news scrolling belt with article cards | ✅ Built |
| **Onboarding Flow** | Guided profile setup for new users | ✅ Built |
| **Database Failover** | Automatic MySQL → MongoDB fallback | ✅ Built |
| **Toast Notifications** | Global toast notification system for UX feedback | ✅ Built |

---

## 🛠️ Technology Stack (Full Inventory)

### Frontend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js | 16.x | App Router, Server Components, Turbopack |
| **Language** | TypeScript | 5.x | Type safety across entire frontend |
| **UI Library** | React | 19.x | Component architecture |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS with JIT compiler |
| **Animation** | GSAP | 3.x | Scroll-triggered cinematic animations |
| **Animation** | Framer Motion | 12.x | Component transitions and micro-interactions |
| **Charts** | Recharts | 3.x | Data visualization (analytics dashboards) |
| **Charts** | Chart.js + react-chartjs-2| 4.x / 5.x | Additional chart types (bar, pie, line) |
| **Icons** | Lucide React | 0.577+ | Modern icon system |
| **Icons** | React Icons | 5.x | Extended icon library |
| **Auth** | Firebase SDK | 12.x | Client-side OAuth (Google, GitHub) |
| **Theming** | next-themes | 0.4.x | Dark/light mode management |
| **3D/WebGL** | OGL | 1.x | GPU-accelerated visual effects |
| **PostCSS** | PostCSS | latest | CSS transformation pipeline |
| **Testing** | Playwright | 1.58+ | End-to-end browser testing |
| **Linting** | ESLint + eslint-config-next | 9.x | Code quality enforcement |

### Backend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Node.js | 20+ | Server runtime |
| **Framework** | Express.js | 5.x | REST API framework |
| **Language** | TypeScript | 5.x | Type safety |
| **ORM (SQL)** | Sequelize | 6.x | MySQL ORM with migrations |
| **ODM (NoSQL)**| Mongoose | 8.x | MongoDB object modeling |
| **AI Engine** | Groq SDK | 1.x | LLaMA-based LLM inference (resume parsing, ATS, roadmaps) |
| **Auth** | jsonwebtoken | 9.x | JWT token generation/verification |
| **Auth** | Firebase Admin SDK | 13.x | Server-side OAuth token verification |
| **Auth** | bcryptjs | 3.x | Password hashing |
| **File Upload** | Multer | 2.x | Multipart form data handling |
| **PDF Processing**| pdf-parse | 2.x | PDF text extraction |
| **DOCX Processing**| mammoth | 1.x | DOCX → text conversion |
| **PDF Generation**| PDFKit | 0.17+ | Server-side PDF generation |
| **DOCX Generation**| docx | 9.x | Server-side DOCX generation |
| **HTTP Client** | Axios | 1.x | GitHub API calls, external requests |
| **Email** | Nodemailer | 8.x | Transactional email delivery |
| **Real-time** | Socket.io | 4.x | WebSocket event streaming |
| **UUID** | uuid | 13.x | Unique identifier generation |
| **Testing** | Jest + ts-jest | 30.x | Unit/integration test runner |
| **Testing** | Supertest | 7.x | HTTP assertion testing |
| **Dev Server** | ts-node-dev | 2.x | Hot-reload TypeScript server |

### Databases

| Database | Engine | Purpose |
|---|---|---|
| **Primary** | MySQL | Relational data (Users, Jobs, Applications, Profiles, ATS) |
| **Secondary** | MongoDB Atlas (Cloud) | Fallback storage, unstructured data, analytics |

### External Services

| Service | Purpose |
|---|---|
| **Firebase Authentication** | Google OAuth, GitHub OAuth, email/password auth |
| **Groq Cloud** | AI inference engine (LLaMA models) for resume parsing, ATS analysis, career roadmaps |
| **GitHub REST API** | Repository analysis, language detection, skill verification |
| **Gmail SMTP** | Transactional email delivery via Nodemailer |

---

## 📊 Data Models (Schema Reference)

### User (Sequelize — MySQL)

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK, Auto-increment | Unique user identifier |
| `name` | STRING | NOT NULL | Full name |
| `email` | STRING | NOT NULL, UNIQUE | Login email |
| `password` | STRING | Nullable | Hashed password (null for OAuth users) |
| `role` | ENUM | `candidate`, `recruiter`, `admin` | Access control role |
| `firebaseUid` | STRING | UNIQUE, Nullable | Firebase OAuth identifier |
| `githubUid` | STRING | UNIQUE, Nullable | GitHub OAuth identifier |
| `banned` | BOOLEAN | Default: `false` | Admin ban flag |

### Profile (Sequelize — MySQL)

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK, Auto-increment | Profile identifier |
| `userId` | INTEGER | FK → User, UNIQUE | Owning user |
| `bio` | TEXT | Nullable | Personal bio |
| `headline` | STRING | Nullable | Professional headline |
| `location` | STRING | Nullable | Geographic location |
| `phone` | STRING | Nullable | Contact phone |
| `website` | STRING | Nullable | Personal website |
| `linkedin` | STRING | Nullable | LinkedIn profile URL |
| `birthday` | STRING | Nullable | Date of birth |
| `gender` | STRING | Nullable | Gender |
| `avatarUrl` | STRING | Nullable | Profile photo URL |
| `resumeUrl` | STRING | Nullable | Uploaded resume URL |
| `skills` | JSON | Default: `[]` | Array of skill strings |
| `experience` | JSON | Default: `[]` | Work experience entries |
| `education` | JSON | Default: `[]` | Education entries |
| `projects` | JSON | Default: `[]` | Project portfolio entries |
| `githubUsername` | STRING | Nullable | Connected GitHub username |
| `githubVerifiedSkills`| JSON | Default: `[]` | `[{skill, confidence}]` verified via GitHub |
| `githubDeepScan` | JSON | Nullable | Full GitHub deep scan results |
| `resumeReport` | JSON | Nullable | AI resume analysis report |
| `profileCompleteness`| INTEGER | Default: `0` | Profile completion percentage (0–100) |

### Job (Sequelize — MySQL)

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK, Auto-increment | Job identifier |
| `title` | STRING | NOT NULL | Job title |
| `company` | STRING | NOT NULL | Company name |
| `location` | STRING | Nullable | Job location |
| `salary` | STRING | Nullable | Salary range |
| `description` | TEXT | Nullable | Full job description |
| `requiredSkills` | JSON | Default: `[]` | Required skill array |
| `techStack` | JSON | Default: `[]` | Technology stack array |
| `experienceLevel`| ENUM | `junior`, `mid`, `senior` | Experience requirement |
| `recruiterId` | INTEGER | FK → User | Posting recruiter |
| `status` | ENUM | `pending`, `approved`, `rejected` | Moderation status |

### Application (Sequelize — MySQL)

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK, Auto-increment | Application identifier |
| `userId` | INTEGER | FK → User | Applying candidate |
| `jobId` | INTEGER | FK → Job | Target job |
| `status` | ENUM | 9-stage pipeline | Application lifecycle status |

**Application Pipeline Stages:**
```
applied → shortlisted → interview_scheduled → interview_done → offer_sent → offer_accepted / offer_rejected → hired / rejected
```

### AtsCheck (Sequelize — MySQL)

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK, Auto-increment | Check identifier |
| `userId` | INTEGER | FK → User | Candidate who ran the check |
| `jobId` | INTEGER | Nullable | Associated job (if any) |
| `jobDescription` | TEXT (LONG) | NOT NULL | Job description text |
| `resumeText` | TEXT (LONG) | Nullable | Resume text content |
| `source` | ENUM | `profile`, `resume` | Data source used for check |
| `matchScore` | INTEGER | NOT NULL | ATS compatibility score (0–100) |
| `matchedKeywords`| JSON | Default: `[]` | Keywords found in both |
| `missingKeywords`| JSON | Default: `[]` | Keywords missing from resume |
| `summary` | TEXT | NOT NULL | AI-generated summary |
| `stats` | JSON | Nullable | Detailed statistics object |

### AtsRoadmap (Sequelize — MySQL)

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK, Auto-increment | Roadmap identifier |
| `userId` | INTEGER | Nullable | Associated user |
| `jobRole` | STRING | NOT NULL | Target job role |
| `matchScore` | INTEGER | Nullable | Current match score |
| `missingSkills` | JSON | Nullable | Array of skills to acquire |
| `roadmapData` | JSON | NOT NULL | Full AI-generated roadmap |

### Model Associations

```
User ──(1:1)──→ Profile
User ──(1:N)──→ Application
User ──(1:N)──→ Job (as recruiter)
User ──(1:N)──→ AtsCheck
User ──(1:N)──→ AtsRoadmap
Job  ──(1:N)──→ Application
```

---

## 🔌 API Surface (Endpoint Reference)

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register new user (email/password or Firebase token) |
| POST | `/login` | Authenticate and receive JWT token |

### Jobs (`/api/jobs`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all approved jobs (with search/filter) |
| GET | `/:id` | Get job details by ID |
| POST | `/` | Create new job listing (Recruiter) |
| PUT | `/:id` | Update job listing (Recruiter) |
| DELETE| `/:id` | Delete job listing (Recruiter/Admin) |

### Applications (`/api/applications`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Apply to a job (Candidate) |
| GET | `/my` | Get current user's applications |
| GET | `/job/:jobId` | Get applicants for a job (Recruiter) |
| PUT | `/:id/status`| Update application status (Recruiter) |

### Profile (`/api/profile`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/me` | Get current user's profile |
| GET | `/:userId` | Get profile by user ID |
| PUT | `/me` | Update current user's profile |
| POST| `/me` | Create profile for current user |

### Match Engine (`/api/match`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/score/:jobId` | Calculate match score for current user vs. job |
| GET | `/candidates/:jobId` | Get ranked candidates for job (Recruiter) |

### GitHub Verification (`/api/github`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/verify` | Verify skills via GitHub repository analysis |
| POST | `/deep-scan`| Full GitHub deep scan (repos, languages, commits)|
| GET | `/status/:username`| Check verification status |

### Resume (`/api/resume`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/parse` | Parse uploaded resume (PDF/DOCX) via AI |
| POST | `/report` | Generate resume report card |
| POST | `/generate-pdf`| Generate optimized PDF resume from profile |
| POST | `/generate-docx`| Generate optimized DOCX resume from profile |

### ATS Checker (`/api/ats`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/check` | Run ATS compatibility check (resume vs. JD) |
| GET | `/history`| Get user's ATS check history |
| POST | `/roadmap`| Generate ATS fix roadmap |

### Admin (`/api/admin`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List all users |
| GET | `/jobs` | List all jobs (including pending) |
| GET | `/applications`| List all applications |
| GET | `/stats` | Platform-wide analytics/statistics |
| PUT | `/users/:id/ban`| Ban/unban a user |
| PUT | `/jobs/:id/status`| Approve/reject job listing |
| DELETE| `/users/:id` | Delete a user |
| DELETE| `/jobs/:id` | Delete a job listing |

### File Uploads (`/api/uploads`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/resume` | Upload resume file (PDF/DOCX) |
| POST | `/avatar` | Upload profile photo |

---

## 🔐 Security Architecture

| Layer | Implementation |
|---|---|
| **Authentication** | Firebase Auth (OAuth 2.0) + JWT tokens |
| **Password Storage** | bcryptjs with salted hashing |
| **API Authorization** | JWT middleware on all protected routes |
| **Role Enforcement** | Middleware-level role checks (candidate/recruiter/admin)|
| **CORS** | Configured for frontend origin |
| **Input Validation** | Request body validation in controllers |
| **File Upload Security**| Multer with file type/size restrictions |
| **Database Failover** | Automatic MySQL → MongoDB fallback service |
| **Environment Variables**| dotenv for secret management (.env not in git) |

---

## 📁 Project Structure
```
jobie/
├── PROJECT.md             # This document — full project specification
├── STATE.md               # Current development state & progress
├── ISSUES.md              # Known issues & technical debt tracker
├── ROADMAP.md             # Future development roadmap
├── README.md              # Quick-start guide
├── SOP.md                 # Design system reference (UI/UX SOP)
├── currentPlan.txt        # Detailed feature planning document
│
├── backend/
│   ├── .env                 # Environment variables (DB, API keys)
│   ├── package.json         # Node dependencies & scripts
│   ├── tsconfig.json        # TypeScript configuration
│   ├── serviceAccountKey.json # Firebase Admin SDK credentials
│   ├── testDB.js            # Database connection test utility
│   ├── config/
│   │   └── config.json      # Sequelize CLI config
│   ├── models/
│   │   └── index.js         # Legacy Sequelize model loader
│   ├── uploads/             # File upload storage directory
│   └── src/
│       ├── server.ts        # Express server entry point
│       ├── config/
│       │   ├── database.ts  # Sequelize MySQL connection
│       │   ├── mongo.ts     # Mongoose MongoDB connection
│       │   ├── db.ts        # Database utilities
│       │   └── email.ts     # Nodemailer transport config
│       ├── controllers/     # 11 route handlers
│       │   ├── authController.ts
│       │   ├── jobController.ts
│       │   ├── applicationController.ts
│       │   ├── profileController.ts
│       │   ├── matchController.ts
│       │   ├── adminController.ts
│       │   ├── githubController.ts
│       │   ├── resumeController.ts
│       │   ├── atsController.ts
│       │   ├── roadmapController.ts
│       │   └── uploadController.ts
│       ├── routes/          # 12 route definitions
│       │   ├── authRoutes.ts
│       │   ├── jobRoutes.ts
│       │   ├── applicationRoutes.ts
│       │   ├── profileRoutes.ts
│       │   ├── matchRoutes.ts
│       │   ├── adminRoutes.ts
│       │   ├── githubRoutes.ts
│       │   ├── resumeRoutes.ts
│       │   ├── atsRoutes.ts
│       │   ├── uploadRoutes.ts
│       │   ├── dashboard.route.ts
│       │   └── protected.ts
│       ├── services/        # 7 business logic services
│       │   ├── atsService.ts       # ATS compatibility engine
│       │   ├── githubService.ts    # GitHub API integration
│       │   ├── resumeService.ts    # Resume parsing & generation
│       │   ├── roadmapService.ts   # Career roadmap generation
│       │   ├── matchService.ts     # Match scoring algorithm
│       │   ├── parserService.ts    # PDF/DOCX text extraction
│       │   └── dbFallbackService.ts# MySQL→MongoDB failover
│       ├── models/
│       │   ├── User.ts      # User model (Sequelize)
│       │   ├── Job.ts       # Job model (Sequelize)
│       │   ├── Application.ts # Application model (Sequelize)
│       │   ├── Profile.ts   # Profile model (Sequelize)
│       │   ├── AtsCheck.ts  # ATS check model (Sequelize)
│       │   ├── AtsRoadmap.ts# ATS roadmap model (Sequelize)
│       │   ├── index.ts     # Model associations
│       │   └── mongo/
│       │       ├── User.ts  # MongoDB User fallback
│       │       └── Profile.ts # MongoDB Profile fallback
│       ├── middleware/
│       │   ├── auth.ts      # JWT verification middleware
│       │   └── authMiddleware.ts # Role-based access middleware
│       ├── seeders/
│       │   └── adminSeeder.ts # Admin account seeder
│       ├── lib/
│       │   └── firebaseAdmin.ts # Firebase Admin SDK init
│       ├── data/
│       │   └── roadmaps.ts    # Predefined career roadmap templates
│       └── __tests__/
│           ├── phase1_phase2.test.ts
│           ├── phase3.test.ts
│           ├── admin.test.ts
│           ├── dashboard_contracts.test.ts
│           └── resumes_for_tests/
│
├── frontend/
│   ├── .env.local           # Frontend environment variables
│   ├── package.json         # Dependencies & scripts
│   ├── tsconfig.json        # TypeScript config
│   ├── next.config.ts       # Next.js configuration
│   ├── postcss.config.mjs   # PostCSS pipeline
│   ├── eslint.config.mjs    # ESLint rules
│   ├── playwright.config.ts # E2E test config
│   ├── app/
│   │   ├── layout.tsx       # Root layout (Navbar, ThemeProvider, Toast)
│   │   ├── page.tsx         # Landing page
│   │   ├── template.tsx     # Page transition template
│   │   ├── globals.css      # Global styles & design tokens
│   │   ├── login/page.tsx   # Login page
│   │   ├── register/page.tsx# Registration page
│   │   ├── onboarding/page.tsx # New user onboarding wizard
│   │   ├── jobs/
│   │   │   ├── page.tsx     # Job listing & search
│   │   │   └── [jobId]/page.tsx # Job detail view
│   │   ├── profile/
│   │   │   ├── page.tsx     # Profile redirect
│   │   │   ├── [userId]/page.tsx # Public profile view
│   │   │   └── edit/page.tsx# Profile editor
│   │   ├── resume/page.tsx  # Resume upload & ATS checker
│   │   ├── roadmap/page.tsx # Career roadmap viewer
│   │   ├── news/
│   │   │   ├── layout.tsx   # News section layout
│   │   │   └── page.tsx     # News feed page
│   │   ├── candidate/
│   │   │   ├── layout.tsx   # Candidate dashboard layout
│   │   │   ├── dashboard/   # Candidate analytics
│   │   │   ├── jobs/        # Candidate job browser
│   │   │   ├── applications/# Application tracker
│   │   │   ├── resume-parser/# AI resume parser
│   │   │   ├── companies/   # Company browser
│   │   │   └── messages/    # Messaging (placeholder)
│   │   ├── recruiter/
│   │   │   ├── layout.tsx   # Recruiter dashboard layout
│   │   │   ├── dashboard/   # Recruiter analytics
│   │   │   ├── jobs/        # Posted job management
│   │   │   ├── post-job/    # Job creation form
│   │   │   ├── manage-jobs/ # Job management panel
│   │   │   └── applications/# Applicant review
│   │   ├── admin/page.tsx   # Admin control panel (~53KB)
│   │   ├── dashboard/user.html # Legacy dashboard page
│   │   ├── api/             # Next.js API routes
│   │   ├── lib/             # Page-level utilities
│   │   └── components/      # Page-specific components
│   ├── components/            # Shared reusable components
│   │   ├── CardNav.tsx      # Main navigation bar
│   │   ├── Navbar.tsx       # Alternative navbar
│   │   ├── HeroSection.tsx  # Landing page hero
│   │   ├── DarkVeil.tsx     # Cinematic dark overlay effects
│   │   ├── ClinicalNoise.tsx# SVG noise texture overlay
│   │   ├── GitHubDeepCard.tsx # GitHub verification card
│   │   ├── SkillGraph.tsx   # Interactive skill visualization
│   │   ├── ResumeReportCard.tsx # Resume analysis display
│   │   ├── AtsModal.tsx     # ATS check modal
│   │   ├── LowScorePopup.tsx# Low ATS score intervention
│   │   ├── ProfileHeader.tsx# Profile header component
│   │   ├── NewsScrollBelt.tsx # Scrolling news ticker
│   │   ├── HowItWorks.tsx   # Landing page feature section
│   │   ├── ThemeProvider.tsx# Dark/light theme context
│   │   ├── ToastProvider.tsx# Global toast notification system
│   │   ├── Header.tsx       # Dashboard header
│   │   ├── Sidebar.tsx      # Dashboard sidebar navigation
│   │   ├── StatsCard.tsx    # Analytics stats card
│   │   ├── JobCard.tsx      # Job listing card
│   │   ├── JobTable.tsx     # Admin job management table
│   │   ├── ApplicationsChart.tsx # Application analytics chart
│   │   ├── ApplicationsPerJobChart.tsx # Per-job application chart
│   │   ├── articles-section.tsx # Landing page articles
│   │   ├── featured-jobs.tsx# Landing page featured jobs
│   │   ├── footer.tsx       # Site footer
│   │   ├── newsletter-subscribe.tsx # Newsletter signup
│   │   ├── services-section.tsx # Landing page services
│   │   └── types.ts         # Component type definitions
│   ├── services/
│   │   └── jobService.ts    # Job API service layer
│   ├── lib/
│   │   ├── api.ts           # Base API client (fetch wrapper)
│   │   └── user.ts          # User context utilities
│   ├── src/lib/             # Additional library utilities
│   ├── types/
│   │   └── Job.ts           # Job type definitions
│   ├── tests/e2e/           # Playwright E2E test suites
│   ├── playwright-report/   # Test execution reports
│   ├── test-results/        # Test artifacts
│   └── public/              # Static assets
│
├── postcss.config.js      # Root PostCSS config
├── tailwind.config.js     # Root Tailwind config
└── revert.js              # Database migration revert utility
```
---

## 🧪 Testing Strategy

### Backend Testing (Jest + Supertest)
| Suite | File | Coverage |
|---|---|---|
| **Phase 1 & 2** | `phase1_phase2.test.ts` | Auth, profile CRUD, job CRUD, applications |
| **Phase 3** | `phase3.test.ts` | GitHub verification, resume parsing, ATS checker |
| **Admin** | `admin.test.ts` | Admin user management, job moderation, analytics |
| **Dashboard Contracts**| `dashboard_contracts.test.ts`| API response shape validation |

### Frontend Testing (Playwright)
- End-to-end browser tests covering critical user flows
- Configured in `playwright.config.ts`
- Reports generated in `playwright-report/`

### Test Commands
```bash
# Backend
cd backend && npm test # Run all Jest tests
cd backend && npm run test:watch # Watch mode

# Frontend
cd frontend && npx playwright test # Run E2E tests
```
---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- MySQL 8.0+
- MongoDB (or MongoDB Atlas account)
- Firebase project (with Auth enabled)
- Groq API key

### Environment Setup

**Backend (`.env`):**
```env
PORT=5000
DB_HOST=localhost
DB_NAME=jobie
DB_USER=root
DB_PASS=your_password
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret
GROQ_API_KEY=your_key
GITHUB_TOKEN=your_token
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

**Frontend (`.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

### Running Locally
```bash
# Backend
cd backend
npm install
npm run dev # Starts on port 5000

# Frontend
cd frontend
npm install
npm run dev # Starts on port 3000 (Turbopack)
```

---
## 👨‍💻 Team & Responsibilities
| Role | Responsibility |
|---|---|
| **Full-Stack Lead** | Architecture, AI integration, core platform features |
| **Frontend** | UI/UX, responsive design, animations, data visualization |
| **Backend** | API development, database design, service layer, testing |
| **QA / Admin Module** | End-to-end testing, admin panel, platform monitoring, integration testing |

---
*This document is the single source of truth for the Jobie platform. Last updated: March 2026.*
