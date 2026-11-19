# ATHERIA RESERVE BANK — ARCHITECTURAL SPECIFICATION & VIVA GUIDE
## Complete Dual-Tier Decoupling: Backend DBMS Engine & Frontend Liquid Glass Presentation

> **Project Name:** Atheria Reserve Bank (Core Banking Management System)  
> **Course:** Database Management Systems (DBMS) Laboratory / Master Implementation  
> **Architecture Pattern:** Decoupled Model-Template-View (MTV) with Decoupled Assets Tier  
> **Database:** MySQL 8 Enterprise / InnoDB Engine (3NF Normalized, ACID-Compliant)  
> **Backend Framework:** Django 5.x / Python 3.13  
> **Frontend Stack:** Vanilla ES6+, Three.js WebGL, Liquid Motion Spring Physics, CSS Design Tokens  

---

## 1. Directory & Tier Separation Map

The codebase is organized into two directories: `backend/` (data modeling, SQL triggers, ACID transaction orchestration, business APIs) and `frontend/` (liquid glass CSS tokens, UI templates, Three.js 3D shaders, and Puppeteer verification suites).

```
DBMS _PROJECT/
├── backend/                              # [TIER 1: BACKEND & DBMS ENGINE]
│   ├── manage.py                         # Backend CLI entrypoint
│   ├── requirements.txt                  # Python runtime dependencies
│   ├── config/                           # Central Django Project Configuration
│   │   ├── settings.py                   # Decoupled path bindings (DIRS, STATICFILES)
│   │   ├── urls.py                       # Master URL routing table
│   │   ├── wsgi.py / asgi.py             # WSGI/ASGI web server gateways
│   │   ├── constants.py                  # Single source of truth for bank constants
│   │   ├── context_processors.py         # Global brand context injector
│   │   └── runner.py                     # Automated test suite runner (20/20 unit tests)
│   ├── accounts/                         # Authentication, Security & KYC Domain
│   │   ├── models.py                     # User (AbstractUser), CustomerProfile models
│   │   ├── views.py / forms.py           # Login, registration, brute-force rate limiter
│   │   ├── middleware.py                 # Banking security headers, 15-min idle timeout
│   │   ├── security.py                   # IP logging, account lockout logic
│   │   └── seo_views.py                  # Robots.txt, sitemap.xml, RFC 9116 security.txt
│   ├── banking/                          # Core Ledger, Accounts & Transfers Domain
│   │   ├── models.py                     # Account, Transaction, Beneficiary, AuditLog
│   │   ├── services.py                   # Atomic fund clearing with pessimistic row locks
│   │   ├── statements.py                 # Mathematical passbook reconciliation engine
│   │   └── views.py                      # Deposits, withdrawals, inter-bank transfers
│   ├── loans/                            # Credit & EMI Servicing Domain
│   │   ├── models.py                     # Loan, LoanRepayment models with EMI formula
│   │   └── views.py                      # Application submission, schedule calculation
│   ├── adminpanel/                       # Executive Auditing & Regulatory Oversight
│   │   ├── views.py                      # System KPI aggregation, loan approval queues
│   │   └── test_adminpanel.py            # Administrative privilege test suite
│   └── sql/                              # Raw Relational Database Definitions
│       ├── schema.sql                    # Pure DDL 3NF table schemas, constraints, indexes
│       ├── triggers.sql                  # Automated SQL triggers for audit logging
│       ├── views.sql                     # High-performance analytical database views
│       └── seed.sql                      # Institutional test seed dataset
│
├── frontend/                             # [TIER 2: FRONTEND & PRESENTATION TIER]
│   ├── templates/                        # Server-Rendered Semantic HTML Templates
│   │   ├── base.html                     # Global HTML5 shell, WebGL canvas, FOUC script
│   │   ├── landing.html                  # Apple Spatial hero, 3D card canvas, card stack
│   │   ├── partials/                     # Reusable modular UI components
│   │   │   ├── topbar.html               # Institutional topbar with theme toggle
│   │   │   ├── sidebar.html              # Grounded obsidian navigation sidebar
│   │   │   ├── mobile_tab_bar.html       # Adaptive glass mobile bottom tab bar
│   │   │   └── toast.html                # Spring-animated flash notification system
│   │   ├── customer/                     # Retail customer banking dashboard & views
│   │   └── admin/                        # Core administration dashboard & audit tables
│   ├── static/                           # Client-Side Assets & Script Engines
│   │   ├── css/                          # Layered CSS Architecture & Design Tokens
│   │   │   ├── tokens.css                # Master color palette, spacing, typography
│   │   │   ├── liquid-glass-tokens.css   # Layered glass material, spring linear() curves
│   │   │   ├── theme-glass.css           # Global glass surface architecture & lens physics
│   │   │   ├── glass.css                 # Buttons, inputs, modals, responsive tables
│   │   │   ├── layout.css                # App grid, sidebar, topbar, mobile layout
│   │   │   └── pages/                    # Domain-specific page stylesheets
│   │   ├── js/                           # Client JavaScript & Physics Engines
│   │   │   ├── liquidMotion.js           # 120 FPS rAF loop, spring oscillator, lens physics
│   │   │   ├── app.js                    # AtheriaTheme controller, number counters, modals
│   │   │   ├── api.js                    # CSRF-signed fetch API client
│   │   │   ├── constants.js              # Frontend banking brand sync
│   │   │   └── three/                    # Three.js WebGL 3D Graphic Scenes
│   │   │       ├── heroScene.js          # Interactive 3D credit card with mouse tilt
│   │   │       ├── bgScene.js            # Ambient procedural particle backdrop
│   │   │       └── vaultScene.js         # Security vault 3D wireframe visualization
│   │   └── img/                          # Vector emblems, favicons, branding graphics
│   ├── scripts/                          # Automated Frontend QA & Verification Test Suites
│   │   ├── verify_theme_and_buttons.js   # 34-point headless Puppeteer regression suite
│   │   └── capture_all_pages.js          # High-resolution screenshot capture runner
│   └── package.json                      # Frontend test dependencies (puppeteer-core)
│
├── docs/                                 # [TIER 3: ACADEMIC & DBMS DOCUMENTATION]
│   ├── NORMALIZATION_3NF.md              # Mathematical 3NF functional dependency proofs
│   ├── ER_DIAGRAM.md                     # Entity-Relationship cardinality diagrams
│   └── VIVA_QUESTIONS_DBMS.md            # Comprehensive viva examination guide
│
├── manage.py                             # Root Convenience Proxy (delegates to backend/)
├── DESIGN.md                             # UI/UX design specifications & typography scale
├── README.md                             # Quickstart guide & installation instructions
└── ARCHITECTURE.md                       # This master architectural & viva reference
```

---

## 2. Backend Tier: Core DBMS & Banking Engine

### 2.1 3NF Relational Database Normalization

The underlying relational schema in `backend/sql/schema.sql` is normalized to **Third Normal Form (3NF)**:

1. **First Normal Form (1NF)**:
   - All attributes contain only atomic, indivisible values.
   - Every table features an explicit primary key (e.g. `user_id`, `account_id`, `txn_id`).
   - Repeating groups (e.g., multiple phone numbers, array transactions) are eliminated into discrete relational entities.

2. **Second Normal Form (2NF)**:
   - Meets 1NF requirements.
   - Eliminates partial dependencies: Every non-prime attribute is fully functionally dependent on the entire candidate key.
   - Composite keys (e.g., `(loan_id, installment_no)` in `loan_repayments`) determine only attributes dependent on both keys (`due_date`, `amount_due`, `status`).

3. **Third Normal Form (3NF)**:
   - Meets 2NF requirements.
   - Eliminates transitive dependencies: No non-prime attribute depends on another non-prime attribute ($X \to Y$ where $Y \to Z$).
   - Example: Customer address details (`city`, `state`, `pincode`) belong to `customers`, not duplicated in `accounts` or `transactions`. The `accounts` table references `customer_id` as a foreign key; account balance is never stored in `users`.

### 2.2 Relational Entity Schema & Key Mappings

```
  +------------------+         1 : 1         +----------------------+
  |      users       |---------------------->|      customers       |
  |------------------|                       |----------------------|
  | PK  id           |                       | PK  id               |
  |     username     |                       | FK  user_id          |
  |     password     |                       |     full_name        |
  |     role         |                       |     kyc_status       |
  +------------------+                       +----------------------+
                                                         | 1
                                                         | 
                                                         | 1 : N
                                                         v
  +------------------+         1 : N         +----------------------+
  |   transactions   |<----------------------|       accounts       |
  |------------------|                       |----------------------|
  | PK  id           |                       | PK  id               |
  | FK  account_id   |                       | FK  customer_id      |
  |     reference_no |                       |     account_number   |
  |     type         |                       |     account_type     |
  |     amount       |                       |     balance          |
  |     status       |                       |     status           |
  +------------------+                       +----------------------+
           |                                             | 1
           | Triggers Audit Log                          | 1 : N
           v                                             v
  +------------------+                       +----------------------+
  |    audit_logs    |                       |        loans         |
  |------------------|                       |----------------------|
  | PK  id           |                       | PK  id               |
  | FK  user_id      |                       | FK  customer_id      |
  |     action       |                       | FK  account_id       |
  |     table_name   |                       |     principal        |
  |     old_value    |                       |     interest_rate    |
  |     new_value    |                       |     status           |
  |     timestamp    |                       +----------------------+
  +------------------+
```

### 2.3 ACID Guarantees in Core Banking Operations

The banking service layer (`backend/banking/services.py`) implements mathematical ACID guarantees:

* **Atomicity (All-or-Nothing)**:
  Handled using Django’s `transaction.atomic()` context manager. If a sender account is debited but an exception occurs before the receiver account is credited, the entire transaction is rolled back. No orphan debits can ever exist.

* **Consistency (Invariant Preservation)**:
  Database constraints and triggers guarantee business invariants:
  - Account balance cannot fall below zero: `CHECK (balance >= 0)`.
  - Transaction status transitions are strictly validated (`pending -> completed | failed`).
  - Passbook accounting constraint: For every transfer, $\Delta \text{Sender Balance} + \Delta \text{Receiver Balance} = 0$.

* **Isolation (Concurrency Control via Pessimistic Row Locking)**:
  To prevent race conditions during high-concurrency transfers (e.g., simultaneous withdrawals draining an account below zero), the engine uses **Pessimistic Row-Level Locking**:
  ```python
  # Row is locked with exclusive 'FOR UPDATE' lock in MySQL InnoDB
  sender_account = Account.objects.select_for_update().get(id=sender_id)
  receiver_account = Account.objects.select_for_update().get(id=receiver_id)
  ```
  Any concurrent transaction attempting to access either row is placed in a queue until the active transaction commits or rolls back, completely eliminating **dirty reads**, **non-repeatable reads**, and **phantom writes**.

* **Durability (Committed Data Persists)**:
  MySQL 8 InnoDB engine enforces Write-Ahead Logging (WAL) via its redo log buffer and doublewrite buffer, ensuring committed transactions survive server crashes and power failures.

### 2.4 SQL Triggers (`backend/sql/triggers.sql`)

Automated database triggers guarantee tamper-evident auditing even if operations are executed directly via SQL CLI:

1. `trg_audit_transaction_insert`: Automatically captures every transaction creation and logs it into `audit_logs` with a timestamp and JSON delta.
2. `trg_prevent_negative_balance`: Database-level pre-update trigger that raises an SQL error (`SQLSTATE '45000'`) if an `UPDATE` statement would result in `balance < 0`.
3. `trg_customer_kyc_audit`: Records old vs new verification status when a customer's KYC profile is modified.

---

## 3. Frontend Tier: Liquid Glass & Spatial UI Architecture

### 3.1 Design Tokens & Layered Optical Architecture

The presentation layer in `frontend/static/css/` is structured into modular design layers:

| Layer | CSS File | Purpose |
|---|---|---|
| **Tokens Scale** | [tokens.css](file:///Users/mikuljain09/Desktop/DBMS%20_PROJECT/frontend/static/css/tokens.css) | Core 4px–128px spatial rhythm, institutional slate dark/light palettes (`--bg-0: #0B0E14`, `--bg-surface: #151926`). |
| **Material Optics** | [liquid-glass-tokens.css](file:///Users/mikuljain09/Desktop/DBMS%20_PROJECT/frontend/static/css/liquid-glass-tokens.css) | 5-layer physical glass definition: backdrop blur (`14px`), hairline border (`rgba(255,255,255,0.07)`), grounded shadows (`0 4px 20px -2px rgba(0,0,0,0.35)`). |
| **Spring Curves** | [liquid-glass-tokens.css](file:///Users/mikuljain09/Desktop/DBMS%20_PROJECT/frontend/static/css/liquid-glass-tokens.css) | CSS `linear()` mechanical spring curves for lens transit (`--spring-lens`), card entrance (`--spring-card`), and button press (`--spring-press`). |
| **Motion Physics** | [liquidMotion.js](file:///Users/mikuljain09/Desktop/DBMS%20_PROJECT/frontend/static/js/liquidMotion.js) | Delta-time `requestAnimationFrame` loop running a damped harmonic oscillator with FPS-adaptive performance throttling. |
| **3D Canvas** | [heroScene.js](file:///Users/mikuljain09/Desktop/DBMS%20_PROJECT/frontend/static/js/three/heroScene.js) | Three.js WebGL scene rendering an interactive banking card with perspective raycasting. |

### 3.2 Fluid Indicator Lens Physics (Zero Double-Hover)

The floating navigation capsule in `frontend/templates/landing.html` uses a single shared optical lens (`.glass-lens`) instead of each button toggling individual background highlights:
* **Single Element Constraint**: The container dynamically inserts strictly **one** `.glass-lens` element.
* **Transform-Only Movement**: Moves via GPU-accelerated `translate3d(rect.left, rect.top, 0)` and dimensions `width` and `height`.
* **Hard-Click Selection**: The active lens transitions **only on mouse click**, while hovering modifies text contrast without moving the indicator pill.
* **0px Sub-Pixel Centering**: Computed coordinates match target elements (`Δx = 0.0006px`, `Δy = 0.00px`), preventing typography misalignment.

### 3.3 Centralized Dual-Theme Management

* **Zero-FOUC Initializer**: An inline script in `frontend/templates/base.html` reads the `atheria_theme` cookie and `localStorage` before the DOM renders, preventing light/dark flash during page loads.
* **Global Synchronization**: `window.AtheriaTheme` (`frontend/static/js/app.js`) synchronizes theme toggles across tabs via the `storage` event and persists state across all routes.

---

## 4. End-to-End Fund Transfer Lifecycle

The following sequence details how an atomic transfer flows from the **Frontend Tier** through the **Backend Service Layer** into the **MySQL 8 Database**:

```
[ FRONTEND CLIENT ]                    [ DJANGO BACKEND ]                  [ MYSQL 8 DATABASE ]
         |                                      |                                    |
  1. User fills transfer form                   |                                    |
     (Recipient, Amount, PIN)                   |                                    |
  2. POST /banking/transfer/ -----------------> |                                    |
     [CSRF Token + Session Cookie]              |                                    |
                                         3. Verify Session & CSRF                    |
                                         4. Begin transaction.atomic() ------------> |
                                                |                             BEGIN TRANSACTION
                                         5. Acquire Row Locks                        |
                                            select_for_update() ---------------> [Lock Sender Row]
                                            select_for_update() ---------------> [Lock Receiver Row]
                                                |                                    |
                                         6. Invariant Checks:                        |
                                            - Sender active?                         |
                                            - Balance >= Amount?                     |
                                            - Daily limit exceeded?                  |
                                                |                                    |
                                         7. Execute Ledger Mutations                 |
                                            UPDATE accounts (debit) -----------> [Execute & Verify CHECK]
                                            UPDATE accounts (credit) ----------> [Execute & Verify CHECK]
                                            INSERT INTO transactions ----------> [Fire trg_audit_transaction]
                                                |                                    |
                                         8. Commit Transaction ----------------> COMMIT (WAL Flush)
                                                |                                    |
  9. HTTP 302 Redirect <------------------------|                                    |
     (Flash Message: "Transfer Success")        |                                    |
 10. Passbook Ledger Re-rendered <--------------+                                    |
```

---

## 5. College DBMS Viva Examination Cheat Sheet

Use these concise, technically rigorous answers when defending this project in your academic viva:

#### Q1: Why did you choose MySQL 8 and InnoDB over NoSQL (like MongoDB) for this banking project?
> **Answer:** Banking core systems require absolute mathematical consistency and ACID guarantees. Relational DBMS with InnoDB provides multi-version concurrency control (MVCC), atomic transactions, foreign-key referential integrity, and pessimistic row locking (`FOR UPDATE`). NoSQL databases sacrifice immediate consistency for eventual consistency, which is unacceptable when handling customer balances and ledger double-entries.

#### Q2: What is the purpose of Normalization, and what normal form does your database achieve?
> **Answer:** Normalization eliminates data redundancy and prevents insertion, update, and deletion anomalies. Our system achieves Third Normal Form (3NF). 1NF is satisfied because all attributes are atomic. 2NF is satisfied because there are no partial dependencies on composite candidate keys. 3NF is satisfied because all transitive dependencies have been removed—every non-prime attribute depends only on the primary key, the whole primary key, and nothing but the primary key.

#### Q3: How do you prevent race conditions when two people withdraw money from the same account at the same second?
> **Answer:** We employ **Pessimistic Concurrency Control** via row-level locking. In our service layer, we query the account using `Account.objects.select_for_update().get(id=...)`. In MySQL InnoDB, this issues a `SELECT ... FOR UPDATE` statement which places an exclusive write lock on that specific row. Any concurrent transaction attempting to read or update that row is suspended until the first transaction commits or rolls back. Furthermore, an SQL `CHECK (balance >= 0)` constraint prevents negative balances at the storage engine level.

#### Q4: What is the difference between a database trigger and application-level business logic?
> **Answer:** Application logic resides in our Django views/services and can be bypassed if an administrator executes a query directly via the database console or another external tool. Database triggers reside inside the database engine itself (`sql/triggers.sql`). Triggers like `trg_audit_transaction_insert` execute automatically on the database server on every `INSERT` or `UPDATE`, guaranteeing an immutable audit trail regardless of how the database is accessed.

#### Q5: What is Atomicity, and how does your project enforce it?
> **Answer:** Atomicity ensures that a sequence of operations is treated as a single indivisible unit: either all operations succeed, or none take effect. In our inter-account fund transfer, debited sender funds and credited receiver funds must happen together. We wrap the dual balance updates and transaction insertion inside Django’s `transaction.atomic()`. If an unexpected error or power interruption occurs halfway, the database issues a `ROLLBACK`, restoring all balances to their pre-transfer state.

#### Q6: How is the project divided between Backend and Frontend?
> **Answer:** The project maintains a clean separation of concerns:
> - **`backend/`**: Contains the core database schema (`sql/`), Django applications (`accounts`, `banking`, `loans`, `adminpanel`), ACID transaction services, and security middleware.
> - **`frontend/`**: Contains client-facing presentation logic, including semantic HTML templates (`templates/`), CSS design token architectures (`static/css/`), 120 FPS spring physics engines (`static/js/liquidMotion.js`), Three.js WebGL scenes, and automated headless Puppeteer verification test suites.

---

## 6. Verification & Test Commands

### Backend Test Suite (Django Unit Tests)
```bash
# Run all 20 database & business logic tests from root
python manage.py test

# Or run directly from backend directory
cd backend && python manage.py test
```

### Frontend Test Suite (Headless Puppeteer Theme & Interaction Tests)
```bash
# Run the 34-point UI regression & lens-centering test suite
node frontend/scripts/verify_theme_and_buttons.js
```

### Development Server Launch
```bash
# Start the local development server (serves both backend endpoints and frontend assets)
python manage.py runserver 127.0.0.1:8000
```
