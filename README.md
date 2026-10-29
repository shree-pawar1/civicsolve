# CivicSolve — Digital Platform for Collaborative Problem Solving
*Final Design Thinking and Innovation (DTI) Capstone Engineering Prototype (Assignment 9)*

CivicSolve is a full-stack digital platform that unites four distinct societal stakeholders — **Citizens**, **Universities (Academia)**, **Industries**, and **Government Organizations** — to identify, research, engineer, and resolve community challenges with full accountability and verifiable public audit trails.

---

## 1. Architectural Highlights & Engineering Priorities

- **Strict Relational Data Model**: PostgreSQL 16 schema managed via Prisma ORM with native database-level constraints (partial unique indexes, check constraints, foreign keys).
- **Concurrency-Safe Single-Session Enforcement**: Guaranteed by database partial unique index `idx_sessions_user_active ON "Session"("userId") WHERE "revokedAt" IS NULL` combined with row-level transaction locks (`SELECT ... FOR UPDATE`). Multiple concurrent logins from different browsers or parallel requests result in exactly one active session and an explicit `409 Conflict`.
- **Argon2id Password Security**: Modern cryptographic hashing with memory and parallelism parameters (`$argon2id$v=19$m=65536,t=3,p=4`). Timing side-channel mitigation using dummy verifications for unknown emails.
- **Normalized Email Uniqueness**: Enforced via a unique index on `emailNormalized` (trimmed and lowercased) directly in PostgreSQL.
- **Strict Role-Based Access Control (RBAC)**: Enforced server-side. Citizens create problems and vote on solutions; Universities submit academic `PROPOSAL`s; Industries submit technical `RECOMMENDATION`s; Government moderates, reviews solutions, and drives the authorized status lifecycle (`SUBMITTED -> UNDER_REVIEW -> IN_PROGRESS -> RESOLVED / CLOSED`).
- **Zero Fabricated Records**: No fake users, mock metrics, seeded problems, or synthetic timeline entries. All counts, cards, and timelines reflect real database transactions.

---

## 2. Technology Stack

| Layer | Technology | Version / Configuration |
|---|---|---|
| **Frontend** | React + Vite + TypeScript | React 19, Vite 8, React Router 7, Lucide React |
| **Styling** | Vanilla CSS Design System | Assignment 8 Palette (`#1976D2`, `#0D47A1`, `#26A69A`, `#F5F7FA`) |
| **Backend** | Node.js + Express + TypeScript | Express 4.x, TypeScript 5.7, TSX runtime |
| **Database** | PostgreSQL 16 | Real PostgreSQL cluster (Portable / Docker Compose) |
| **ORM** | Prisma 6.x | Strict schema, migrations, raw SQL partial unique index |
| **Security** | Argon2id, Helmet, CORS, Rate-Limiting | `argon2`, `helmet`, `express-rate-limit`, `cookie-parser` |
| **Sessions** | Server-side Opaque Token Table | 256-bit entropy, SHA-256 hash in DB, HttpOnly SameSite=Lax cookie |
| **Testing** | Vitest + Supertest | 19 automated integration and concurrency tests |

---

## 3. Prerequisites

- **Node.js**: v20 or v24 LTS (`node -v`)
- **npm**: v10+ (`npm -v`)
- **PostgreSQL 16**:
  - Running locally on port `5432`, or
  - Using Docker: `docker-compose up -d`, or
  - Using the extracted portable PostgreSQL 16 binaries in `C:\Users\ANUJA\pgsql\pgsql\bin`.

---

## 4. Setup & Running Instructions

### 4.1 Database Setup

If starting via Docker Compose:
```bash
docker-compose up -d
```

If starting via local PostgreSQL service:
```bash
# Ensure PostgreSQL is running on localhost:5432 with database 'civicsolve' and 'civicsolve_test'
# Default credentials: user 'postgres', password 'postgres' (or passwordless trust)
```

### 4.2 Backend Setup & Migrations

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Deploy database migrations (includes partial unique index)
npx prisma migrate deploy

# 3. Start development server (Port 5000)
npm run dev
```

### 4.3 Frontend Setup & Start

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start Vite development server (Port 5173 with proxy to /api)
npm run dev
```

Visit the application at: **`http://localhost:5173`**

---

## 5. Live Examiner Verification Protocols

### Protocol A: Creating the First Accounts for All Four Roles

1. Open `http://localhost:5173/register`
2. **Citizen Account**:
   - Full Name: `Anuja Citizen`
   - Email: `anuja.citizen@example.com`
   - Password: `Password123!`
   - Role: `Citizen` (Organization optional)
   - Click **Complete Registration** -> Success!
3. **University Account**:
   - Full Name: `Prof. Arvind Rao`
   - Email: `arvind.rao@iit.ac.in`
   - Password: `Password123!`
   - Role: `University`
   - Organization: `IIT Madras` (Required)
   - Click **Complete Registration** -> Success!
4. **Industry Account**:
   - Full Name: `Kavita Sharma`
   - Email: `kavita@tataprojects.com`
   - Password: `Password123!`
   - Role: `Industry`
   - Organization: `Tata Projects Infra` (Required)
   - Click **Complete Registration** -> Success!
5. **Government Account**:
   - Full Name: `Commissioner Rajesh Kumar`
   - Email: `rajesh.kumar@bbmp.gov.in`
   - Password: `Password123!`
   - Role: `Government`
   - Organization: `Municipal Corporation` (Required)
   - Click **Complete Registration** -> Success!

---

### Protocol B: Testing Wrong Password and Unknown Email

1. Open `http://localhost:5173/login`
2. Enter registered email `anuja.citizen@example.com` with wrong password `BadPassword999!`
3. Click **Sign In**:
   - Returns **HTTP 401** with message: *"Invalid email or password."*
4. Enter an unknown email `ghost@nonexistent.org` with password `Password123!`:
   - Returns identical **HTTP 401** message with constant-time response (preventing timing enumeration).

---

### Protocol C: Testing the Single-Session Rule Across Two Browsers

1. Open Browser 1 (or regular Chrome window):
   - Navigate to `http://localhost:5173/login`
   - Log in with `anuja.citizen@example.com` / `Password123!`
   - Login succeeds -> Redirected to `/dashboard` with session issued.
2. Open Browser 2 (or an Incognito window):
   - Navigate to `http://localhost:5173/login`
   - Enter the same credentials: `anuja.citizen@example.com` / `Password123!`
   - Click **Sign In**:
   - Server returns **HTTP 409 Conflict**!
   - Alert banner displays:
     > *"This account already has an active session. Please log out from the other device before logging in again."*
3. Return to Browser 1 and click **Logout**:
   - The session is revoked server-side and the cookie cleared.
4. Return to Browser 2 and click **Sign In**:
   - Login now succeeds immediately!

---

### Protocol D: Testing the Problem & Solution Lifecycle

1. **Citizen Submits a Problem**:
   - Citizen logs in, clicks **Report New Problem**
   - Title: `Collapsing Stormwater Culvert on 4th Main Road`
   - Category: `Infrastructure`, Priority: `High`, Location: `4th Main Road, Ward 12`
   - Description: `The stone culvert has partially collapsed following pre-monsoon rains...`
   - Submits -> Problem detail page loads in `SUBMITTED` status with initial timeline entry.
2. **University Submits a Proposal**:
   - University logs in (`arvind.rao@iit.ac.in`)
   - Opens problem -> Clicks **Submit Research Proposal**
   - Submits academic methodology -> Type recorded as `PROPOSAL`.
3. **Industry Submits a Recommendation**:
   - Industry logs in (`kavita@tataprojects.com`)
   - Opens problem -> Clicks **Submit Tech Recommendation**
   - Submits commercial specs -> Type recorded as `RECOMMENDATION`.
4. **Citizen Upvoting**:
   - Citizen logs in -> Clicks **Support Solution** on University proposal -> vote count increments from 0 to 1.
5. **Government Resolution**:
   - Government logs in (`rajesh.kumar@bbmp.gov.in`)
   - Opens problem -> Status control box is enabled.
   - Transitions status: `SUBMITTED -> UNDER_REVIEW` with note *"Field survey team dispatched."*
   - Transitions status: `UNDER_REVIEW -> IN_PROGRESS` with note *"Contractor deployed with precast units."*
   - Transitions status: `IN_PROGRESS -> RESOLVED` with note *"Culvert reconstructed and load certified."*
   - Timeline displays 4 verified chronological events.
   - Real dashboard analytics shows `100% Problem Resolution Rate`.

---

## 6. Session Expiry & Security Policy

1. **Opaque Token Hash Storage**: Raw tokens (32 random bytes / 256 bits) are never saved in the database; only their SHA-256 hash is stored.
2. **Sliding Idle Timeout**: Evaluated on every authenticated request. If `lastSeenAt + 30 minutes < NOW()`, the session is revoked server-side and an HTTP 401 is returned. Otherwise, `lastSeenAt` is updated to current time.
3. **Absolute Lifetime**: Sessions expire after a maximum duration of 8 hours from creation.
4. **CSRF Defense**: Cookies are configured with `SameSite=Lax`. All state-changing requests verify origin and custom header (`X-CivicSolve-Request`).

---

## 7. Automated Testing Results

The automated test suite runs against the dedicated PostgreSQL test database `civicsolve_test`:

```bash
cd backend
npm test
```

### Actual Test Suite Execution Log:
```
 ✓ tests/problems_and_solutions.test.ts (9 tests) 10338ms
   ✓ allows a citizen to report a problem and ignores forged creatorId
   ✓ prevents non-citizens from reporting problems
   ✓ allows creator to edit own problem while in SUBMITTED status
   ✓ forbids other users from editing or deleting problems
   ✓ allows University to submit a PROPOSAL and Industry to submit a RECOMMENDATION
   ✓ allows Citizen to support a solution and toggles/enforces uniqueness
   ✓ enforces valid status transition sequence and rejects invalid jumps
   ✓ rejects status transition attempts by non-government roles
   ✓ returns accurate live statistics based strictly on database records

 ✓ tests/auth_and_sessions.test.ts (10 tests) 5405ms
   ✓ registers all four stakeholder roles successfully
   ✓ rejects duplicate email regardless of case or surrounding whitespace
   ✓ handles parallel registrations with identical email, producing exactly one account
   ✓ authenticates with correct credentials and delivers HttpOnly cookie
   ✓ rejects wrong password with 401
   ✓ rejects non-existent email with identical 401 message
   ✓ rejects second login attempt with 409 when an active session exists
   ✓ enforces single session under high parallel concurrency (parallel login race)
   ✓ allows login again after user logs out and revokes server-side session

 Test Files  2 passed (2)
      Tests  19 passed (19)
   Duration  18.33s
```

---

## 8. Honest Limitations

1. **Government Self-Registration**: In this prototype, self-registration is enabled for all four roles so the evaluator can test every permission matrix without pre-seeded accounts. In production, government accounts would require offline identity verification and administrative approval.
2. **AI Provider API Key**: The AI-assisted problem synthesis endpoint is fully wired to Google Gemini 1.5. If `GEMINI_API_KEY` is not present in the backend `.env`, it returns an honest status message (*"AI analysis is unavailable until a provider is configured."*) rather than fabricating fake analysis output.
3. **Email Verification**: Email verification links are omitted in accordance with the project rule: no claiming email verification occurred without a configured SMTP/SES provider.
#   c i v i c s o l v e  
 #   c i v i c s o l v e  
 