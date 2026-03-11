# Jobie v1 💼

A modern full-stack job platform that helps candidates discover opportunities, manage applications, and improve profile quality with resume and GitHub-powered insights.

## ✨ Highlights

- JWT-based authentication and role-aware access controls
- Job posting, browsing, and application tracking
- Resume upload + PDF parsing pipeline
- GitHub profile analysis and skill verification features
- Admin-focused management routes and dashboard capabilities
- Next.js frontend with responsive, animated UI

## 🧱 Tech Stack

### Frontend
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Framer Motion, GSAP, Recharts

### Backend
- Node.js + Express 5 + TypeScript
- Sequelize ORM + MySQL
- JWT + bcrypt authentication
- Multer for file upload
- Socket.io support

## 📁 Repository Structure

```text
Jobie-v1/
├── frontend/   # Next.js application
└── backend/    # Express API + Sequelize models + tests
```

## ⚙️ Local Setup

### 1) Clone

```bash
git clone https://github.com/ekanshhxxx/Jobie-v1.git
cd Jobie-v1
```

### 2) Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=jobie
PORT=5000
JWT_SECRET=your_secret
GITHUB_TOKEN=your_github_token
GROQ_API_KEY=your_groq_api_key
```

Run backend:

```bash
npm run dev
```

### 3) Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## 🧪 Quality Checks

### Backend tests
```bash
cd backend
npm test
```

### Frontend lint
```bash
cd frontend
npm run lint
```

### Frontend production build
```bash
cd frontend
npm run build
```

## 🔌 API Areas

- `/api/auth` - registration and login
- `/api/jobs` - job management and discovery
- `/api/applications` - application lifecycle
- `/api/profile` - user profile management
- `/api/resume` - resume parsing and analysis
- `/api/github` - GitHub profile/skill insights
- `/api/match` - matching logic
- `/api/admin` - admin-only operations

---

Built to serve as a practical, production-style full-stack learning and deployment project.
