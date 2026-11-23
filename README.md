# Food Left at Closing Time

A closing-time surplus food rescue platform connecting restaurants with cooked surplus food to nearby verified shelters and community kitchens before food spoils overnight. Built around the Dhanmondi, Dhaka rescue workflow, the platform replaces late-night phone calls with sub-60-second smart food posting, strict logistical constraint matching, atomic claiming to eliminate double-bookings, reliability tracking with auto-release timers, and 4-digit pickup gate verification codes.

---

## Key Features

- **Sub-60-Second Quick Post (Single-Line Parser):** Restaurants paste or type a casual closing-time note (e.g. `"about 30 plates rice and dal, 2 trays chicken curry, can hold until 11:30pm, pickup from back gate"`) and `parseFoodInput()` automatically extracts `total_portions`, `has_trays`, `hold_until` (capped at `02:00 AM` next morning for food safety), and `pickup_location`.
- **Constraint-Based Shelter Matching:** Automatically filters or blocks claims by:
  - **Cutoff Time:** Prevents shelters past their collection `cutoff_time` (e.g., `22:00` / 10:00 PM) from claiming late batches.
  - **Portion Capacity:** Blocks claims exceeding a shelter's `max_portions` limit (e.g., 50 portions).
  - **Transport & Open-Tray Check:** Blocks shelters without a van (`has_van = 0`, e.g., rickshaw transport) when `has_trays = 1`.
- **Atomic Claiming (`BEGIN IMMEDIATE`):** Wraps claim mutations in an immediate SQLite ACID transaction so concurrent clicks result in exactly one `200 OK` claim and `409 Conflict` for competing shelters.
- **No-Show Protection & 4-Digit Gate Code:** Shelters must confirm departure (`ON_THE_WAY`) within 10 minutes or the batch auto-releases back to `AVAILABLE` with a `-0.5` reliability penalty. Handover requires the 4-digit `gate_code` (`+0.1` reliability, capped at `5.0`).

---

## Tech Stack

- **Frontend (`/frontend`):** React (Vite) + Tailwind CSS (mobile-first, bilingual English/Bangla friendly workflows)
- **Backend (`/backend`):** Node.js (v22.5+ / v24 LTS), Express, `bcryptjs`, `jsonwebtoken`
- **Database:** SQLite via built-in `node:sqlite` (`DatabaseSync` with WAL mode & `BEGIN IMMEDIATE` transactions)

---

## Repository Structure

```text
CapstonProject/
├── .gitignore
├── README.md
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── server.js                  # Express entrypoint & route mounting
│   ├── seed.js                    # Idempotent demo accounts seed script
│   ├── db/
│   │   └── database.js            # SQLite schema initialization & transaction helper
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT authentication & role/profile hydration
│   │   └── cleanup.js             # Lazy expiry & 10-min no-show auto-release middleware
│   ├── routes/
│   │   ├── auth.js                # POST /api/auth/register & POST /api/auth/login
│   │   └── batches.js             # POST /api/batches + claim lifecycle endpoints
│   ├── services/
│   │   └── matching.js            # Shelter eligibility & constraint evaluation engine
│   └── utils/
│       └── parser.js              # Natural language closing-time food input parser
└── frontend/
    └── src/
        ├── api/                   # Typed API client & token/polling helpers
        └── pages/                 # Login/Register, Restaurant & Shelter dashboards
```

---

## Setup Instructions

### Prerequisites

- **Node.js** `v22.5.0` or higher (`v24` LTS recommended — required for built-in `node:sqlite`)
- **npm** `v10+`
- **Git**

### 1. Backend Setup (`/backend`)

```bash
cd backend
npm install
```

Create `/backend/.env` (you can copy `/backend/.env.example`):

```env
PORT=5000
JWT_SECRET=replace-with-a-strong-secret-key
DB_PATH=./food_rescue.sqlite
CLIENT_URL=http://localhost:5173
```

Seed the pre-configured Dhanmondi demo accounts (idempotent — safe to re-run):

```bash
npm run seed
# or from repo root:
node backend/seed.js
```

Start the backend API server (`http://localhost:5000`):

```bash
npm run dev
```

Verify server health:

```bash
curl http://localhost:5000/api/health
```

### 2. Frontend Setup (`/frontend`)

```bash
cd frontend
npm install
```

Create `/frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the Vite development server (`http://localhost:5173`):

```bash
npm run dev
```

---

## Pre-Seeded Demo Accounts (Dhanmondi Scenario)

Running `node backend/seed.js` creates/updates the following 4 demo accounts (all use password `password123`):

| Account Name | Email | Password | Role | Key Constraints / Profile |
| :--- | :--- | :--- | :--- | :--- |
| **Tanvir's Restaurant** | `tanvir@dhaka.com` | `password123` | `RESTAURANT` | Address: `Dhanmondi, Dhaka`, Default pickup: `Back gate`, Cutoff: `23:30` |
| **Dhanmondi Van Shelter** | `van@shelter.com` | `password123` | `SHELTER` | `has_van: 1`, `max_portions: 200`, `cutoff_time: 23:59`, Reliability: `4.9` |
| **Early Cutoff Kitchen** | `early@shelter.com` | `password123` | `SHELTER` | `has_van: 0`, `max_portions: 100`, `cutoff_time: 22:00`, Reliability: `4.7` |
| **Small Rickshaw Shelter** | `small@shelter.com` | `password123` | `SHELTER` | `has_van: 0`, `max_portions: 50`, `cutoff_time: 23:59`, Reliability: `4.5` |

---

## 3-Member GitHub Branch & File Ownership Rules

To prevent merge conflicts and keep frontend/backend integration decoupled, each team member owns specific branches and file paths:

| Branch | Owner | Owned Files / Directories | Scope |
| :--- | :--- | :--- | :--- |
| `feat/backend-core` | **Member 1** | `/backend/routes/auth.js`<br>`/backend/utils/parser.js`<br>`/backend/seed.js` | Auth registration/login, natural-language food parser, idempotent demo seed script, and `POST /api/batches` creation handler |
| `feat/claim-engine` | **Member 2** | `/backend/routes/batches.js`<br>`/backend/middleware/cleanup.js`<br>`/backend/services/matching.js` | Constraint matching engine, lazy no-show auto-release middleware, `GET /api/batches`, and atomic claim/on-way/cancel/complete handlers |
| `feat/frontend-ui` | **Member 3** | `/frontend/src/pages/*`<br>`/frontend/src/api/*` | API client wrappers, top demo account switcher, Restaurant Quick-Post dashboard, and Shelter live eligibility feed |

### Collaboration Rules

1. **Strict File Ownership:** Never modify files owned by another member inside your feature branch.
   - Example: Member 1 creates `POST /api/batches` cleanly inside `/backend/routes/batches.js` while leaving Member 2's `GET /`, `/:id/claim`, `/:id/on-way`, `/:id/cancel`, and `/:id/complete` stubs untouched.
2. **Shared Infrastructure Changes:** Edits to root `README.md`, `.gitignore`, `/backend/server.js`, `/backend/db/database.js`, or `package.json` must be coordinated via small, agreed PRs before merging feature branches.
3. **Contract-First Integration:** All frontend requests and backend handlers must strictly conform to the REST API contract documented below.
4. **Branch Workflow:**
   ```bash
   git checkout -b feat/<your-branch>
   # Implement only your owned files, then push and open a PR
   ```

---

## Shared SQLite Schema Reference

| Table | Key Columns |
| :--- | :--- |
| `users` | `id`, `name`, `email` (unique), `password_hash`, `role` (`RESTAURANT` \| `SHELTER`), `phone`, `address`, `default_pickup_point`, `closing_cutoff_time`, `created_at` |
| `shelter_profiles` | `id`, `user_id` (unique FK -> `users.id`), `has_van` (`0` \| `1`), `max_portions`, `cutoff_time` (`HH:MM`), `reliability_score` (`0.0–5.0`), `no_show_count`, `updated_at` |
| `food_batches` | `id`, `restaurant_id` (FK -> `users.id`), `raw_description`, `total_portions`, `has_trays` (`0` \| `1`), `pickup_location`, `hold_until` (ISO-8601), `gate_code` (4-digit string), `status` (`AVAILABLE` \| `CLAIMED` \| `ON_THE_WAY` \| `COMPLETED` \| `EXPIRED`), `claimed_by_shelter_id`, `claimed_at`, `claim_expires_at`, `on_way_at`, `arrived_at`, `eta_minutes`, `priority_release_at`, `completed_at`, `created_at` |
| `no_show_logs` | `id`, `batch_id` (FK -> `food_batches.id`), `shelter_id` (FK -> `users.id`), `reason`, `penalty_applied`, `created_at` |

---

## Exact REST API Contract

- **Base URL:** `http://localhost:5000/api`
- **Headers:** `Content-Type: application/json` (plus `Authorization: Bearer <jwt_token>` on all protected routes)
- **Standard Error Envelope:**
  ```json
  {
    "error": "Human-readable error description",
    "code": "MACHINE_READABLE_ERROR_CODE"
  }
  ```
- **Batch Status Lifecycle:** `AVAILABLE` → `CLAIMED` → `ON_THE_WAY` → `COMPLETED` (or auto-released/cancelled back to `AVAILABLE` / `EXPIRED`)

---

### 1. Authentication

#### `POST /api/auth/register`

Register a new `RESTAURANT` or `SHELTER` user. Shelter accounts must include `has_van`, `max_portions`, and `cutoff_time`, which are written to `shelter_profiles` inside the same database transaction.

- **Auth:** Public
- **Request JSON (Restaurant):**
  ```json
  {
    "name": "Tanvir's Restaurant",
    "email": "tanvir@dhaka.com",
    "password": "password123",
    "role": "RESTAURANT",
    "phone": "+8801711000101",
    "address": "House 14, Road 6, Dhanmondi, Dhaka",
    "default_pickup_point": "Back gate",
    "closing_cutoff_time": "23:30"
  }
  ```
- **Request JSON (Shelter):**
  ```json
  {
    "name": "Dhanmondi Van Shelter",
    "email": "van@shelter.com",
    "password": "password123",
    "role": "SHELTER",
    "phone": "+8801711000201",
    "address": "Road 9/A, Dhanmondi, Dhaka",
    "has_van": true,
    "max_portions": 200,
    "cutoff_time": "23:59"
  }
  ```
- **Response JSON (`201 Created`):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 2,
      "name": "Dhanmondi Van Shelter",
      "email": "van@shelter.com",
      "role": "SHELTER",
      "phone": "+8801711000201",
      "address": "Road 9/A, Dhanmondi, Dhaka",
      "default_pickup_point": "Back gate",
      "closing_cutoff_time": "23:30",
      "shelter_profile": {
        "id": 1,
        "user_id": 2,
        "has_van": 1,
        "max_portions": 200,
        "cutoff_time": "23:59",
        "reliability_score": 5.0,
        "no_show_count": 0,
        "updated_at": "2026-11-23 06:00:00"
      }
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request` (`VALIDATION_ERROR`): Missing, invalid, or fake placeholder input fields.
  - `409 Conflict` (`EMAIL_EXISTS`): Email is already registered.

---

#### `POST /api/auth/login`

Authenticate an existing user and return a signed JWT along with their profile (`shelter_profile` is `null` for restaurants).

- **Auth:** Public
- **Request JSON:**
  ```json
  {
    "email": "van@shelter.com",
    "password": "password123"
  }
  ```
- **Response JSON (`200 OK`):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 2,
      "name": "Dhanmondi Van Shelter",
      "email": "van@shelter.com",
      "role": "SHELTER",
      "phone": "+8801711000201",
      "address": "Road 9/A, Dhanmondi, Dhaka",
      "default_pickup_point": "Main gate",
      "closing_cutoff_time": "23:59",
      "shelter_profile": {
        "id": 1,
        "user_id": 2,
        "has_van": 1,
        "max_portions": 200,
        "cutoff_time": "23:59",
        "reliability_score": 4.9,
        "no_show_count": 0,
        "updated_at": "2026-11-23 06:00:00"
      }
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request` (`VALIDATION_ERROR`): Missing `email` or `password`.
  - `401 Unauthorized` (`INVALID_CREDENTIALS`): Invalid email or password.

---

### 2. Surplus Batch Creation & Feed

#### `POST /api/batches`

Create a surplus food batch as a `RESTAURANT`. Any omitted structured fields (`total_portions`, `has_trays`, `pickup_location`, `hold_until`) are automatically extracted from `raw_description` via `parseFoodInput()`, with food-safety capping at `02:00 AM` next morning and a generated 4-digit `gate_code`.

- **Auth:** Required (`RESTAURANT` only)
- **Request JSON:**
  ```json
  {
    "raw_description": "about 30 plates rice and dal, 2 trays chicken curry, can hold until 11:30pm, pickup from back gate",
    "total_portions": 30,
    "has_trays": 1,
    "pickup_location": "Back gate",
    "hold_until": "2026-11-23T17:30:00.000Z"
  }
  ```
  *(All fields except `raw_description` are optional; if omitted, the parser populates them.)*
- **Response JSON (`201 Created`):**
  ```json
  {
    "batch": {
      "id": 1,
      "restaurant_id": 1,
      "restaurant_name": "Tanvir's Restaurant",
      "restaurant_address": "Dhanmondi, Dhaka",
      "restaurant_phone": "+8801711000101",
      "raw_description": "about 30 plates rice and dal, 2 trays chicken curry, can hold until 11:30pm, pickup from back gate",
      "total_portions": 30,
      "has_trays": 1,
      "pickup_location": "Back gate",
      "hold_until": "2026-11-23T17:30:00.000Z",
      "gate_code": "4829",
      "status": "AVAILABLE",
      "claimed_by_shelter_id": null,
      "claimed_at": null,
      "claim_expires_at": null,
      "on_way_at": null,
      "arrived_at": null,
      "eta_minutes": null,
      "priority_release_at": "2026-11-23T06:03:00.000Z",
      "completed_at": null,
      "created_at": "2026-11-23T06:00:00.000Z"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request` (`VALIDATION_ERROR`): Missing/short `raw_description` or malformed override field.
  - `401 Unauthorized` (`UNAUTHORIZED` / `INVALID_TOKEN`): Missing or invalid JWT.
  - `403 Forbidden` (`FORBIDDEN`): Authenticated user has role `SHELTER`.

---

#### `GET /api/batches`

Runs `cleanupExpiredClaims` first to auto-release expired 10-minute claims and expire overdue batches, then returns batches scoped to the caller's role. Shelters receive constraint eligibility metadata (`eligibility`) per batch and only see `gate_code` on batches they claimed.

- **Auth:** Required (`RESTAURANT` or `SHELTER`)
- **Optional Query Params:** `?status=AVAILABLE` | `?simulated_time=2026-11-23T22:30:00+06:00` (for demo cutoff/timeout testing)
- **Request JSON:** None
- **Response JSON (`200 OK` — Shelter View):**
  ```json
  {
    "server_time": "2026-11-23T16:15:00.000Z",
    "batches": [
      {
        "id": 1,
        "restaurant_id": 1,
        "restaurant_name": "Tanvir's Restaurant",
        "restaurant_address": "Dhanmondi, Dhaka",
        "raw_description": "about 30 plates rice and dal, 2 trays chicken curry, can hold until 11:30pm, pickup from back gate",
        "total_portions": 30,
        "has_trays": 1,
        "pickup_location": "Back gate",
        "hold_until": "2026-11-23T17:30:00.000Z",
        "status": "AVAILABLE",
        "gate_code": null,
        "claimed_by_shelter_id": null,
        "priority_release_at": "2026-11-23T06:03:00.000Z",
        "created_at": "2026-11-23T06:00:00.000Z",
        "eligibility": {
          "can_claim": false,
          "status": "BLOCKED",
          "reasons": [
            {
              "code": "REQUIRES_VAN_TRAYS",
              "label": "Requires Van / Cannot transport open trays",
              "detail": "Batch contains open trays (has_trays = 1) and requires has_van = 1."
            }
          ],
          "priority_hold_seconds": 0,
          "available_at": "2026-11-23T06:00:00.000Z"
        }
      }
    ]
  }
  ```
- **Response JSON (`200 OK` — Restaurant View):**
  ```json
  {
    "server_time": "2026-11-23T16:15:00.000Z",
    "batches": [
      {
        "id": 1,
        "restaurant_id": 1,
        "raw_description": "about 30 plates rice and dal, 2 trays chicken curry, can hold until 11:30pm, pickup from back gate",
        "total_portions": 30,
        "has_trays": 1,
        "pickup_location": "Back gate",
        "hold_until": "2026-11-23T17:30:00.000Z",
        "gate_code": "4829",
        "status": "CLAIMED",
        "claimed_by_shelter_id": 2,
        "claimed_by_shelter_name": "Dhanmondi Van Shelter",
        "claimed_by_reliability_score": 4.9,
        "claimed_at": "2026-11-23T16:10:00.000Z",
        "claim_expires_at": "2026-11-23T16:20:00.000Z",
        "on_way_at": null,
        "arrived_at": null,
        "eta_minutes": 15,
        "completed_at": null,
        "created_at": "2026-11-23T16:00:00.000Z"
      }
    ]
  }
  ```
- **Error Responses:**
  - `401 Unauthorized` (`UNAUTHORIZED` / `INVALID_TOKEN`)

---

### 3. Atomic Claim & Rescue Lifecycle

#### `POST /api/batches/:id/claim`

Atomically claims an `AVAILABLE` batch for the authenticated `SHELTER` inside a `BEGIN IMMEDIATE` transaction after re-verifying cutoff, capacity, van/tray compatibility, and 3-minute priority hold rules. Sets a 10-minute departure deadline (`claim_expires_at`) and reveals `gate_code` to the claiming shelter.

- **Auth:** Required (`SHELTER` only)
- **Request JSON:**
  ```json
  {
    "eta_minutes": 15,
    "demo_fast_forward": false
  }
  ```
- **Response JSON (`200 OK`):**
  ```json
  {
    "batch": {
      "id": 1,
      "status": "CLAIMED",
      "claimed_by_shelter_id": 2,
      "claimed_at": "2026-11-23T16:10:00.000Z",
      "claim_expires_at": "2026-11-23T16:20:00.000Z",
      "eta_minutes": 15,
      "gate_code": "4829",
      "pickup_location": "Back gate",
      "hold_until": "2026-11-23T17:30:00.000Z"
    }
  }
  ```
- **Error Responses:**
  - `403 Forbidden` (`CONSTRAINT_BLOCKED` / `PRIORITY_HOLD` / `FORBIDDEN`): Shelter fails cutoff/capacity/van check or is in low-reliability priority hold.
  - `404 Not Found` (`BATCH_NOT_FOUND`): Batch does not exist.
  - `409 Conflict` (`ALREADY_CLAIMED` / `BATCH_UNAVAILABLE`): Concurrent shelter already claimed the batch or batch expired.

---

#### `POST /api/batches/:id/on-way`

Confirms the claiming shelter is en route (must be triggered within 10 minutes of `claimed_at`, cancelling the departure no-show timer) or updates arrival status at the pickup gate.

- **Auth:** Required (claiming `SHELTER` only)
- **Request JSON:**
  ```json
  {
    "eta_minutes": 10,
    "arrived": false
  }
  ```
- **Response JSON (`200 OK`):**
  ```json
  {
    "batch": {
      "id": 1,
      "status": "ON_THE_WAY",
      "claimed_by_shelter_id": 2,
      "on_way_at": "2026-11-23T16:13:00.000Z",
      "arrived_at": null,
      "eta_minutes": 10
    }
  }
  ```
- **Error Responses:**
  - `403 Forbidden` (`FORBIDDEN`): Caller is not the claiming shelter.
  - `404 Not Found` (`BATCH_NOT_FOUND`): Batch does not exist.
  - `409 Conflict` (`CLAIM_EXPIRED` / `INVALID_STATE`): Claim expired (`> 10` minutes) or batch is not in `CLAIMED` / `ON_THE_WAY` state.

---

#### `POST /api/batches/:id/cancel`

Releases an active `CLAIMED` or `ON_THE_WAY` batch back to `AVAILABLE` (or `EXPIRED` if past `hold_until`). Supports voluntary cancellation (`is_no_show: false`, no reliability penalty) as well as flagging a no-show / simulating timeout (`is_no_show: true`, deducting `0.5` from `reliability_score` floored at `0.0` and incrementing `no_show_count`).

- **Auth:** Required (owning `RESTAURANT` or claiming `SHELTER`)
- **Request JSON:**
  ```json
  {
    "reason": "NO_SHOW_TIMEOUT",
    "is_no_show": true
  }
  ```
- **Response JSON (`200 OK`):**
  ```json
  {
    "batch": {
      "id": 1,
      "status": "AVAILABLE",
      "claimed_by_shelter_id": null,
      "claimed_at": null,
      "claim_expires_at": null,
      "on_way_at": null,
      "arrived_at": null,
      "eta_minutes": null
    },
    "penalty_applied": 0.5,
    "shelter_reliability_score": 4.4
  }
  ```
- **Error Responses:**
  - `403 Forbidden` (`FORBIDDEN`): Caller neither owns the batch nor holds the claim.
  - `404 Not Found` (`BATCH_NOT_FOUND`): Batch does not exist.
  - `409 Conflict` (`INVALID_STATE`): Batch is already `COMPLETED`, `EXPIRED`, or `AVAILABLE`.

---

#### `POST /api/batches/:id/complete`

Verifies handover at the pickup point using the 4-digit `gate_code`, transitions the batch to `COMPLETED`, and rewards the collecting shelter with `+0.1` `reliability_score` (capped at `5.0`).

- **Auth:** Required (owning `RESTAURANT` only)
- **Request JSON:**
  ```json
  {
    "gate_code": "4829"
  }
  ```
- **Response JSON (`200 OK`):**
  ```json
  {
    "batch": {
      "id": 1,
      "status": "COMPLETED",
      "claimed_by_shelter_id": 2,
      "completed_at": "2026-11-23T16:28:00.000Z"
    },
    "shelter_reliability_score": 5.0
  }
  ```
- **Error Responses:**
  - `400 Bad Request` (`INVALID_GATE_CODE`): Provided `gate_code` does not match the batch's 4-digit code.
  - `403 Forbidden` (`FORBIDDEN`): Authenticated user is not the owning restaurant.
  - `404 Not Found` (`BATCH_NOT_FOUND`): Batch does not exist.
  - `409 Conflict` (`INVALID_STATE`): Batch is not currently `CLAIMED` or `ON_THE_WAY`.

---

## Testing Guide (End-to-End Scenarios)

1. **Sub-60s Quick Post:** Log in as `tanvir@dhaka.com` (`password123`) and `POST /api/batches` with `{ "raw_description": "about 30 plates rice and dal, 2 trays chicken curry, can hold until 11:30pm, pickup from back gate" }` — verify `total_portions = 30`, `has_trays = 1`, `pickup_location = "Back gate"`, and a 4-digit `gate_code`.
2. **Constraint Filtering:** Fetch `GET /api/batches` using `van@shelter.com` (eligible), `early@shelter.com` (blocked past `22:00` cutoff and/or `has_trays = 1`), and `small@shelter.com` (blocked on `has_trays = 1` or `total_portions > 50`).
3. **Concurrent Double-Claim Prevention:** Send two parallel `POST /api/batches/:id/claim` requests for the same batch — verify one returns `200 OK` and the second returns `409 Conflict`.
4. **No-Show Auto-Release & Handover:** Trigger `POST /api/batches/:id/cancel` with `is_no_show: true` (or let the 10-minute `claim_expires_at` elapse) to verify `-0.5` reliability deduction and batch return to `AVAILABLE`; then claim and verify handover via `POST /api/batches/:id/complete` with `gate_code` for `+0.1` reliability reward.
