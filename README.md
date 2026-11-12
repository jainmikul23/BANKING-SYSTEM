# Apex Global Bank — Next-Gen Banking Management System

A production-grade, 3NF-normalized web Banking Management System engineered with **Python 3.11+ / Django 5.x**, **MySQL 8 (InnoDB)**, **Three.js (r128)**, **GSAP**, and **ReportLab**. Designed for college DBMS project submissions and viva defense with rigorous ACID transaction atomicity, pessimistic row locks, database triggers, analytical views, and an Apple visionOS glassmorphism design system.

---

## 1. Features & Architectural Highlights

### Customer Portal
- **Authentication**: PBKDF2 password hashing, secure session rotation, 15-minute inactivity timeout.
- **Apple Wallet Style Accounts**: Stacked visual cards for Savings & Current accounts with real-time balance metrics, branch details, and IFSC codes.
- **Atomic Fund Transfers**: ACID-guaranteed two-phase transfers with `SELECT ... FOR UPDATE` pessimistic locks and configurable daily limits (₹1,00,000 default).
- **Deposits & Withdrawals**: Interactive quick chips (₹500, ₹1000, ₹5000), minimum balance guard (₹500 for Savings, ₹0 for Current).
- **Passbook & Ledger**: Multi-filter transaction history (date range, type, keyword, account) with pagination.
- **Official Statements**: On-demand download of bank statements in **PDF** (ReportLab layout) and **CSV**.
- **Loan Underwriting & Live EMI Calculator**: Dynamic slider calculations, loan application workflow, and monthly EMI repayment schedule.
- **Profile & KYC**: View verification status, update address/phone, change password.

### Admin Portal
- **Executive Dashboard**: System KPIs (Total Customers, Total Accounts, System Liquidity, Pending Queues), 7-day cashflow line charts.
- **Customer Management**: Search by username/email/phone, KYC verify/reject actions.
- **Account Controls**: Freeze, unfreeze, and close accounts with point-in-time audit logging.
- **Global Ledger**: Searchable, filterable audit of all banking transactions.
- **Loan Approvals**: Approve or reject pending loans; approval atomically disburses funds directly to the customer's account.
- **Analytical Reports**: Top high-net-worth customers, branch liquidity distribution, loan portfolio exposure.
- **Audit Trail**: View before-and-after JSON diffs for all account modifications.

---

## 2. Tech Stack

| Component | Technology |
|---|---|
| **Backend Framework** | Python 3.11+ / Django 5.x |
| **Database** | MySQL 8 (InnoDB Engine, utf8mb4) |
| **Database Connector** | `mysqlclient` / `pymysql` fallback |
| **Frontend Style** | Custom CSS3 Glassmorphism (visionOS aesthetic, tokens, no Bootstrap/Tailwind) |
| **3D Graphics** | Three.js (r128) with physical glass materials & mouse parallax |
| **Animations** | GSAP, CSS hardware-accelerated transitions |
| **Data Visualization** | Chart.js 4.x (dark/light theme responsive) |
| **PDF Generation** | ReportLab 5.x |

---

## 3. Demo Credentials

| Role | Username | Password | Notes |
|---|---|---|---|
| **Administrator** | `admin` | `Admin@123` | Full administrative control & loan underwriting |
| **Retail Customer** | `customer1` | `Customer@123` | Aarav Sharma (Savings & Current accounts) |
| **Retail Customer 2** | `customer2` | `Customer@123` | Priya Patel (Ahmedabad branch) |
| **Retail Customer 3** | `customer3` | `Customer@123` | Rohan Iyer (Bengaluru branch) |

*(Instant 1-Click demo autofill buttons are built directly into the login screen!)*

---

## 4. Installation & Setup Instructions

### Prerequisites
- Python 3.11, 3.12, 3.13 or 3.14
- MySQL Server 8.0+ running locally (default port `3306`)

### Step 1: Create and Activate Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 2: Install Python Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` and fill in your MySQL database credentials:
```bash
cp .env.example .env
```
Inside `.env`:
```ini
DB_NAME=banking_system
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=127.0.0.1
DB_PORT=3306
```

### Step 4: Create MySQL Database
Log into MySQL and create the database:
```sql
CREATE DATABASE banking_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 5: Run Migrations
Apply Django migrations to construct tables with all constraints and foreign keys:
```bash
python manage.py makemigrations accounts banking loans adminpanel
python manage.py migrate
```

### Step 6: Seed Database with Realistic Data
Run the built-in management command to seed 1 Admin, 10 Customers, 15 Accounts, 120+ Transactions, 5 Loans, and Audit Logs:
```bash
python manage.py seed_data
```

### Step 7: (Optional) Apply MySQL Triggers & Views
You can also execute the standalone SQL scripts directly via MySQL client:
```bash
mysql -u root -p banking_system < sql/triggers.sql
mysql -u root -p banking_system < sql/views.sql
```

### Step 8: Run Development Server
```bash
python manage.py runserver
```
Visit **http://127.0.0.1:8000** in your browser.

---

## 5. Directory Structure

```
DBMS _PROJECT/
├── manage.py
├── requirements.txt
├── .env.example
├── .env
├── config/                  # Django project root settings & URLs
├── accounts/                # Custom User, Customer profile, Auth & KYC
├── banking/                 # Accounts, Transactions, Beneficiaries, Statements
├── loans/                   # Loan products, EMI calculator, Amortization
├── adminpanel/              # Custom Admin Executive Dashboard & Analytics
├── templates/               # Custom Django HTML templates
│   ├── base.html
│   ├── landing.html
│   ├── partials/            # Topbar, Sidebar, Mobile tab bar, Toasts
│   ├── accounts/            # Login, Register
│   ├── customer/            # Dashboard, Accounts, Transfer, Statement, Loans...
│   └── admin/               # Admin Dashboard, Customers, Loans, Audit Log...
├── static/
│   ├── css/                 # tokens.css, glass.css, layout.css, pages/*.css
│   ├── js/                  # app.js, api.js, three/*.js
│   ├── img/
│   └── fonts/
├── sql/
│   ├── schema.sql           # Complete 3NF DDL schema submission
│   ├── triggers.sql         # Negative balance check & audit triggers
│   ├── views.sql            # v_account_summary, v_monthly_statement, v_loan_overview
│   └── seed.sql             # Pure SQL seed script
└── docs/
    ├── ER_DIAGRAM.md        # Mermaid ER diagram & cardinality breakdown
    ├── NORMALIZATION_3NF.md # Formal 1NF, 2NF, 3NF mathematical justification
    └── VIVA_QUESTIONS_DBMS.md # Comprehensive DBMS viva Q&A guide
```

---

## 6. DBMS Viva Defense Points

### 1. ER Model & Cardinalities
- **Users to Customers (1:1)**: Each user authentication entity maps to at most one customer profile (`user_id` is UNIQUE).
- **Customers to Accounts (1:N)**: A customer can hold multiple savings or current accounts.
- **Branches to Accounts (1:N)**: A branch services multiple accounts with a distinct IFSC code.
- **Accounts to Transactions (1:N)**: An account retains an immutable append-only ledger of transactions.
- **Customers to Loans (1:N)**: Customers apply for multiple loans (Home, Vehicle, Education, Personal).

### 2. 3NF Normalization
- **1NF**: Every column contains atomic values; no arrays or multi-valued columns.
- **2NF**: No partial functional dependencies; all non-key columns depend on the entire candidate key.
- **3NF**: Elimination of transitive dependencies. For example, branch details (`name`, `ifsc_code`, `city`) are separated into `branches` instead of repeating inside `accounts`.

### 3. ACID Properties in Fund Transfer
- **Atomicity**: Fund transfers execute sender debit and recipient credit inside `transaction.atomic()`. If any step fails, both are rolled back.
- **Consistency**: Invariants `balance >= min_balance` (₹500 for Savings) are enforced by database checks, triggers, and ORM validations.
- **Isolation**: High-concurrency race conditions are prevented using **pessimistic row locking** (`SELECT ... FOR UPDATE`).
- **Durability**: Upon `COMMIT`, transaction logs are flushed to disk via MySQL InnoDB's write-ahead redo log.

### 4. Triggers & Views
- **Triggers** (`sql/triggers.sql`): `trg_prevent_negative_balance` rejects invalid balance updates at the database layer; `trg_account_status_audit` automatically registers state mutations to `audit_log`.
- **Views** (`sql/views.sql`): `v_account_summary`, `v_monthly_statement`, and `v_loan_overview` encapsulate complex multi-table joins and aggregation for reporting queries.

### 5. Difference between COMMIT and ROLLBACK
- `COMMIT` makes all state modifications permanent and releases database row locks.
- `ROLLBACK` reverts the database back to its state at the beginning of the transaction, discarding uncommitted modifications.

