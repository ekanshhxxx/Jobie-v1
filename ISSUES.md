<![CDATA[# 🐛 JOBIE — Issues, Bugs & Technical Debt Registry

> **Last Updated:** March 22, 2026  
> **Severity Scale:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low | ⚪ Info

---

## 🔴 Critical Issues

### ISSUE-001: API Port Mismatch Between Frontend and Backend
- **Location:** `frontend/lib/api.ts` → `backend/src/server.ts`
- **Description:** The frontend API client hardcodes `http://localhost:4000/api` as the base URL, but the backend server defaults to port `5000`. This mismatch causes all API calls to fail unless one of the ports is manually changed.
- **Impact:** Complete application failure in default configuration
- **Fix:** Align both to the same port or use `NEXT_PUBLIC_API_URL` environment variable consistently
- **Priority:** 🔴 Critical
- **Status:** 🟡 Open

### ISSUE-002: Type Safety Bypassed in Core API Client
- **Location:** `frontend/lib/api.ts` (lines 1-2)
- **Description:** The main API utility file uses both `/* eslint-disable */` and `// @ts-nocheck`, completely disabling TypeScript and ESLint protections on the most critical client-side module. This masks potential runtime errors and type mismatches across all 35+ API calls.
- **Impact:** Silent runtime failures, no compile-time API contract enforcement
- **Fix:** Remove suppressions, add proper TypeScript generics to the `request()` function, and type all API responses
- **Priority:** 🔴 Critical
- **Status:** 🟡 Open

### ISSUE-003: Firebase Service Account Key Committed to Repository
- **Location:** `backend/serviceAccountKey.json`
- **Description:** Firebase Admin SDK service account credentials file exists in the repository root. If this repo is/becomes public, these credentials would be exposed, allowing unauthorized Firebase Admin access.
- **Impact:** Potential security breach — full Firebase Admin access compromise
- **Fix:** Move to environment variables or secure secret manager; add to `.gitignore`; rotate keys if repo has been public
- **Priority:** 🔴 Critical
- **Status:** 🟡 Open

---

## 🟠 High Priority Issues

### ISSUE-004: Socket.io Installed But Not Integrated
- **Location:** `backend/package.json` (dependency), `backend/src/server.ts` (missing)
- **Description:** `socket.io` v4.8.3 is listed as a dependency but never imported or used anywhere in the server. No WebSocket server is created, no event handlers are registered. This is dead weight in production and a missing feature for real-time notifications.
- **Impact:** Dead dependency; no real-time functionality despite being planned
- **Fix:** Either integrate Socket.io for real-time events or remove the dependency
- **Priority:** 🟠 High
- **Status:** 🟡 Open

### ISSUE-005: No Input Validation/Sanitization Layer
- **Location:** All controllers (`backend/src/controllers/`)
- **Description:** No request validation library (like `joi`, `zod`, or `express-validator`) is used. Controllers directly access `req.body` properties without schema validation. This opens the door to malformed data, injection attacks, and database corruption.
- **Impact:** Security vulnerability; data integrity risk; poor error messages for invalid input
- **Fix:** Add `zod` or `joi` schema validation middleware to all routes
- **Priority:** 🟠 High
- **Status:** 🟡 Open

### ISSUE-006: No Rate Limiting on API Endpoints
- **Location:** `backend/src/server.ts`
- **Description:** No rate limiting middleware is configured. AI-powered endpoints (resume parsing, ATS checks, roadmap generation) call Groq API, which has usage limits. Without rate limiting, a single user could exhaust the API quota or launch a denial-of-service attack.
- **Impact:** API abuse vulnerability; potential Groq API quota exhaustion; DoS risk
- **Fix:** Add `express-rate-limit` with per-route limits, especially on `/api/resume`, `/api/ats`, `/api/github`
- **Priority:** 🟠 High
- **Status:** 🟡 Open

### ISSUE-007: CORS Configured With No Origin Restriction
- **Location:** `backend/src/server.ts` → `app.use(cors())`
- **Description:** CORS is enabled with default settings (allow all origins). In production, this should be restricted to the frontend domain to prevent cross-origin abuse.
- **Impact:** Any domain can make API requests; potential CSRF and data exfiltration
- **Fix:** Configure `cors({ origin: process.env.FRONTEND_URL })` with environment-specific origins
- **Priority:** 🟠 High
- **Status:** 🟡 Open

### ISSUE-008: Email Notification Triggers Not Implemented
- **Location:** `backend/src/config/email.ts`
- **Description:** Nodemailer transport is configured and ready, but no controller or service actually sends emails. Application status changes, new applicant notifications, and welcome emails are all missing.
- **Impact:** Feature advertised but not functional; poor user experience
- **Fix:** Wire email sending into `applicationController.ts` (status change), `authController.ts` (welcome email), and `jobController.ts` (new applicant notification)
- **Priority:** 🟠 High
- **Status:** 🟡 Open

### ISSUE-009: No Error Handling Middleware
- **Location:** `backend/src/server.ts`
- **Description:** No global error handling middleware (`app.use((err, req, res, next) => ...)`) is registered. Unhandled errors in controllers crash the server or return raw stack traces to clients.
- **Impact:** Server crashes on unhandled exceptions; stack traces leak internal details
- **Fix:** Add centralized error handling middleware with proper error response formatting and logging
- **Priority:** 🟠 High
- **Status:** 🟡 Open

---

## 🟡 Medium Priority Issues

### ISSUE-010: Messaging Feature Scaffolded But Empty
- **Location:** `frontend/app/candidate/messages/`
- **Description:** A messages directory exists in the candidate routes, but there is no backend API, no WebSocket channel, and no UI implementation for recruiter-candidate messaging.
- **Impact:** Empty/broken page accessible via navigation
- **Fix:** Either implement the feature or remove the route and hide the navigation link
- **Priority:** 🟡 Medium
- **Status:** 🟡 Open

### ISSUE-011: Database Migrations Not Used
- **Location:** `backend/config/config.json` (Sequelize CLI config exists but no migrations directory)
- **Description:** Schema changes are handled via `sequelize.sync()` instead of proper migrations. In multi-developer teams or production environments, this causes data loss risks and makes schema rollbacks impossible.
- **Impact:** Schema changes can silently alter/drop data; no version-controlled schema history
- **Fix:** Convert to Sequelize migrations for all schema changes; stop using `.sync()` in production
- **Priority:** 🟡 Medium
- **Status:** 🟡 Open

### ISSUE-012: Legacy Dashboard Page (`user.html`)
- **Location:** `frontend/app/dashboard/user.html`
- **Description:** A raw HTML file exists inside the Next.js App Router directory. This suggests a legacy or prototype dashboard that was never converted to React. It will not work correctly in the Next.js routing system.
- **Impact:** Dead/broken file in the project; potential confusion
- **Fix:** Remove or convert to a proper `.tsx` page component
- **Priority:** 🟡 Medium
- **Status:** 🟡 Open

### ISSUE-013: Legacy Sequelize Model Loader (`backend/models/index.js`)
- **Location:** `backend/models/index.js`
- **Description:** A JavaScript file exists at `backend/models/index.js` separate from the TypeScript models in `backend/src/models/`. This is a leftover from the initial Sequelize CLI setup and may cause confusion or duplicate model loading.
- **Impact:** Potential model conflicts; developer confusion
- **Fix:** Consolidate to single TypeScript model system at `src/models/`; remove legacy file
- **Priority:** 🟡 Medium
- **Status:** 🟡 Open

### ISSUE-014: No Logging Infrastructure
- **Location:** Entire backend
- **Description:** All logging uses `console.log` / `console.error`. No structured logging library (like `winston`, `pino`) is used. No log levels, no log persistence, no request/response logging.
- **Impact:** Impossible to debug production issues; no audit trail; no performance monitoring
- **Fix:** Integrate `pino` or `winston` with log levels, request ID correlation, and optional persistence
- **Priority:** 🟡 Medium
- **Status:** 🟡 Open

### ISSUE-015: No API Response Standardization
- **Location:** All controllers
- **Description:** API responses use inconsistent formats — some return `{ data: ... }`, others return raw objects, error responses vary between `{ error: ... }` and `{ message: ... }`.
- **Impact:** Frontend must handle multiple response shapes; brittle integration
- **Fix:** Create `ApiResponse` wrapper utility: `{ success: boolean, data?: T, error?: string, meta?: {} }`
- **Priority:** 🟡 Medium
- **Status:** 🟡 Open

### ISSUE-016: Admin Page Is a Single 53KB File
- **Location:** `frontend/app/admin/page.tsx` (53,295 bytes)
- **Description:** The entire admin dashboard is implemented in a single massive file. This makes it extremely difficult to maintain, test, and debug. Component extraction is overdue.
- **Impact:** Maintenance nightmare; long compile times; impossible to unit test individual sections
- **Fix:** Extract into sub-components: `UserManagement.tsx`, `JobModeration.tsx`, `PlatformStats.tsx`, `ApplicationMonitor.tsx`
- **Priority:** 🟡 Medium
- **Status:** 🟡 Open

---

## 🟢 Low Priority Issues

### ISSUE-017: No Favicon Customization
- **Location:** `frontend/app/favicon.ico`
- **Description:** Using default Next.js favicon. Should be branded Jobie favicon for professionalism.
- **Impact:** Missing branding; looks like a boilerplate project
- **Fix:** Design and replace with Jobie brand favicon (multiple sizes for different platforms)
- **Priority:** 🟢 Low
- **Status:** 🟡 Open

### ISSUE-018: Tailwind Config at Root Level
- **Location:** `postcss.config.js`, `tailwind.config.js` (project root)
- **Description:** PostCSS and Tailwind config files exist at the project root level in addition to the frontend directory. This may cause build confusion or conflicting configurations.
- **Impact:** Potential build issues; configuration ambiguity
- **Fix:** Remove root-level configs or ensure they correctly delegate to frontend configs
- **Priority:** 🟢 Low
- **Status:** 🟡 Open

### ISSUE-019: No SEO Optimization Beyond Basic Meta Tags
- **Location:** `frontend/app/layout.tsx`
- **Description:** Only basic `title` and `description` meta tags are set. Missing: Open Graph tags, Twitter cards, structured data (JSON-LD), sitemap, robots.txt.
- **Impact:** Poor search engine visibility; weak social media link previews
- **Fix:** Add comprehensive SEO metadata, generate sitemap, add robots.txt
- **Priority:** 🟢 Low
- **Status:** 🟡 Open

### ISSUE-020: `revert.js` Database Migration Utility Lacks Safety
- **Location:** `revert.js` (project root)
- **Description:** A standalone database revert script exists without confirmation prompts, logging, or dry-run capability.
- **Impact:** Accidental data loss if run in production
- **Fix:** Add confirmation prompts, dry-run flag, and environment checks
- **Priority:** 🟢 Low
- **Status:** 🟡 Open

---

## ⚪ Technical Debt

### DEBT-001: Component Duplication — Two Navbar Components
- **Location:** `frontend/components/Navbar.tsx` + `frontend/app/components/CardNav.tsx`
- **Description:** Two separate navbar implementations exist. `CardNav.tsx` is the active one (imported in `layout.tsx`), but `Navbar.tsx` still exists as dead code.
- **Fix:** Remove unused `Navbar.tsx` or consolidate

### DEBT-002: `any` Types Used in API Client
- **Location:** `frontend/lib/api.ts`
- **Description:** Request `body` and `headers` parameters are typed as `any`, losing TypeScript benefits.
- **Fix:** Add proper generic typing: `request<T>(path, method, body?: unknown, token?): Promise<T>`

### DEBT-003: No Environment-Based Configuration
- **Description:** No distinction between development, staging, and production configurations. All environments use the same `.env` approach with no validation.
- **Fix:** Add environment-specific config with schema validation (e.g., `envalid`)

### DEBT-004: Frontend API Client Uses `fetch` Directly
- **Location:** `frontend/lib/api.ts`
- **Description:** Custom fetch wrapper instead of a battle-tested HTTP client. Missing: request interceptors, retry logic, timeout handling, request cancellation.
- **Fix:** Consider migrating to `axios` (already in backend) or adding retry/timeout to current wrapper

### DEBT-005: No CI/CD Pipeline
- **Description:** No GitHub Actions, Jenkins, or any CI/CD configuration exists. Tests are run manually, deployments are manual.
- **Fix:** Set up GitHub Actions for: linting, type-checking, testing, build verification, and deployment

### DEBT-006: No Docker Configuration
- **Description:** No `Dockerfile` or `docker-compose.yml` exists. Makes local development environment setup inconsistent across team members.
- **Fix:** Add multi-stage Dockerfiles for both frontend and backend; create `docker-compose.yml` for full stack

### DEBT-007: No API Documentation (Swagger/OpenAPI)
- **Description:** No auto-generated API documentation. Developers rely on reading controller code to understand available endpoints.
- **Fix:** Add `swagger-jsdoc` + `swagger-ui-express` for interactive API docs at `/api/docs`

---

## 📋 Issue Resolution History

| Issue | Resolution Date | Resolution |
|---|---|---|
| *No resolved issues yet* | — | — |

---

## 📊 Issue Summary

| Severity | Count |
|---|---|
| 🔴 Critical | 3 |
| 🟠 High | 6 |
| 🟡 Medium | 7 |
| 🟢 Low | 4 |
| ⚪ Tech Debt | 7 |
| **Total** | **27** |

---

*Issues are tracked from most severe to least. Fix critical issues before any new feature development. Last updated: March 22, 2026.*
]]>
