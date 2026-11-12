# DBMS Viva Preparation & Key Concepts Guide

This guide compiles essential DBMS viva questions and answers based on the architecture of the Banking Management System.

---

### Q1: What is an Entity-Relationship (ER) model and what cardinalities exist in this system?
**Answer:**  
An ER model is a conceptual data model representing real-world entities and their mutual relationships.
In this system:
- **1 to 1 (One-to-One)**: `USERS` to `CUSTOMERS` (Each authenticated user has one customer profile).
- **1 to N (One-to-Many)**: `CUSTOMERS` to `ACCOUNTS` (A customer can hold multiple bank accounts).
- **1 to N**: `BRANCHES` to `ACCOUNTS` (A branch services many bank accounts).
- **1 to N**: `ACCOUNTS` to `TRANSACTIONS` (One bank account has multiple ledger entries).
- **1 to N**: `LOANS` to `LOAN_PAYMENTS` (One approved loan has multiple scheduled EMI repayments).

---

### Q2: Why is the schema in Third Normal Form (3NF)?
**Answer:**  
A schema is in 3NF if:
1. It is in **1NF** (all column values are atomic; no repeating groups).
2. It is in **2NF** (no partial functional dependency on any candidate key).
3. It is in **3NF** (no transitive functional dependencies among non-prime attributes).

In this system:
- Branch information (`name`, `ifsc_code`, `city`) is stored in a dedicated `branches` table rather than inside `accounts`. If it were in `accounts`, `account_number -> branch_id -> ifsc_code` would form a transitive dependency.
- Demographics (`phone`, `address`, `kyc_status`) are separated from login credentials (`username`, `password_hash`).
- Insertion, deletion, and update anomalies are completely eliminated.

---

### Q3: What are Primary Keys and Foreign Keys, and where are they used here?
**Answer:**  
- **Primary Key (PK)**: A column or set of columns that uniquely identifies each row in a table. Must be unique and NOT NULL. Examples: `users.id`, `accounts.id`, `transactions.id`, `loans.id`. Unique natural keys like `account_number` and `ifsc_code` have `UNIQUE` constraints.
- **Foreign Key (FK)**: A column that establishes a link between data in two tables by referencing the Primary Key of another table. Enforces referential integrity.
  - `accounts.customer_id` references `customers.id` (`ON DELETE CASCADE`).
  - `accounts.branch_id` references `branches.id` (`ON DELETE RESTRICT`).
  - `transactions.account_id` references `accounts.id`.

---

### Q4: Explain ACID properties in the context of Fund Transfer.
**Answer:**  
ACID ensures database reliability during concurrent transactions:
1. **Atomicity (All or Nothing)**:  
   A fund transfer consists of **two steps**: (1) debiting sender, (2) crediting receiver. If step 1 succeeds but step 2 fails (e.g. server crash), the entire transaction rolls back. The money is never deducted without being credited.
2. **Consistency (Preserving Invariants)**:  
   The system invariant `balance >= min_balance` (₹500 for savings) is never violated. Database constraints (`CHECK (balance >= 0)`) and triggers enforce valid states before and after execution.
3. **Isolation (Concurrent Transactions do not interfere)**:  
   Achieved through **Pessimistic Row-Level Locking** using `SELECT ... FOR UPDATE`. If two transfers touch the same account at the exact same millisecond, the second transaction waits for the first to release its row lock, eliminating race conditions.
4. **Durability (Committed changes survive)**:  
   Once the transaction issues `COMMIT`, MySQL InnoDB writes changes to the Redo Log (`ib_logfile`) on disk, ensuring data survives crashes or power failures.

---

### Q5: What is the difference between COMMIT and ROLLBACK?
**Answer:**  
- `COMMIT`: Permanently saves all modifications made by the current database transaction to disk, releases all table/row locks, and makes the updates visible to other transactions.
- `ROLLBACK`: Undoes all operations performed since the beginning of the transaction (`START TRANSACTION`), restoring the database state to what it was prior to transaction initiation, and releases all locks.

---

### Q6: Why did you implement Database Triggers?
**Answer:**  
A database trigger is stored procedure code executed automatically by the database engine in response to specific DML events (`INSERT`, `UPDATE`, `DELETE`).
In this project:
1. `trg_prevent_negative_balance` (BEFORE UPDATE on `accounts`): Rejects any update attempting to push an account balance below zero by raising a `SIGNAL SQLSTATE '45000'`.
2. `trg_account_status_audit` (AFTER UPDATE on `accounts`): Automatically writes a JSON audit trail to `audit_log` whenever an account status changes (e.g., active -> frozen).
3. `trg_customer_kyc_audit` (AFTER UPDATE on `customers`): Logs KYC status updates for regulatory auditing.

---

### Q7: Why are Database Views used in this project?
**Answer:**  
A View is a virtual table defined by a saved SQL query. It does not store physical duplicate data (unless materialized), but simplifies complex queries, provides security by hiding sensitive columns, and improves performance:
1. `v_account_summary`: Joins `accounts`, `customers`, `users`, `branches`, and aggregate transactions into a single unified analytical view.
2. `v_monthly_statement`: Aggregates transactions per month to report monthly credit sums, debit sums, and net cashflow without requiring application-side loop computation.
3. `v_loan_overview`: Computes total EMI payments repaid versus total loan obligation on the fly.

---

### Q8: What indexes did you create and why?
**Answer:**  
Indexes use B+ trees to accelerate search queries from $O(N)$ (table scan) to $O(\log N)$:
- `idx_accounts_customer` on `accounts(customer_id)`: Speeds up querying all accounts belonging to a logged-in customer.
- `idx_txn_account` on `transactions(account_id)`: Accelerates statement generation and passbook lookups.
- `idx_txn_created_at` on `transactions(created_at)`: Enables instant date-range filtering.
- `idx_txn_reference_no` on `transactions(reference_no)`: Rapid lookups for payment reconciliation.

