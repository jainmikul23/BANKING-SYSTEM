# Database Normalization Report: Third Normal Form (3NF)

This document formalizes the relational normalization process applied to the Banking Management System database schema.

---

## 1. First Normal Form (1NF)

### Rules for 1NF
1. Each table cell contains a single **atomic** value (no multivalued attributes or repeating groups).
2. Each column has a unique name and consistent data type.
3. Every record has a unique identification (Primary Key).

### Implementation in Atheria Reserve Schema
- **Address & Name**: Stored as single atomic strings, not arrays or nested tables.
- **Multiple Accounts / Beneficiaries**: Rather than storing multiple account numbers or beneficiaries in a comma-separated column inside `customers`, separate relational entities (`accounts` and `beneficiaries`) are created.
- **Transactions Ledger**: Each financial event occupies a separate, discrete tuple in `transactions`.

---

## 2. Second Normal Form (2NF)

### Rules for 2NF
1. Table must be in **1NF**.
2. **No Partial Functional Dependencies**: All non-prime attributes must be fully functionally dependent on the entire Primary Key. (Applies to composite primary keys).

### Implementation in Atheria Reserve Schema
- Most tables use synthetic primary keys (`id`).
- For tables with composite unique constraints such as `beneficiaries (customer_id, beneficiary_account_id)`:
  - The attribute `nickname` is dependent on both `customer_id` and `beneficiary_account_id` (a nickname represents the customer's specific label for that exact beneficiary account). It cannot depend solely on `customer_id` or `beneficiary_account_id`.
  - Therefore, there is **zero partial dependency**.

---

## 3. Third Normal Form (3NF)

### Rules for 3NF
1. Table must be in **2NF**.
2. **No Transitive Functional Dependencies**: Non-prime attributes must not depend on other non-prime attributes ($X \to Y$ and $Y \to Z$ where $X$ is the primary key is forbidden). Every non-key attribute must depend directly on *the key, the whole key, and nothing but the key*.

### Normalization Steps Undertaken

#### Case A: Branch Details Separation
- **Un-normalized Anti-pattern**: Storing `branch_name`, `ifsc_code`, and `branch_city` inside the `accounts` table.
  - Dependency: `account_number -> branch_id -> (branch_name, ifsc_code, city)`.
  - Transitive dependency existed because IFSC and city depended on the branch, which depended on the account.
- **3NF Resolution**: Extracted into a dedicated `branches` relation:
  $$\text{BRANCHES}(\underline{\text{id}}, \text{name}, \text{ifsc\_code}, \text{city})$$
  $$\text{ACCOUNTS}(\underline{\text{id}}, \text{account\_number}, \text{customer\_id}, \text{branch\_id}, \dots)$$

#### Case B: User Authentication vs Customer Profile
- **Un-normalized Anti-pattern**: Storing login hashes, roles, and session flags inside `customers`.
- **3NF Resolution**: Authentication and authorization belongs to the security domain (`users`), while demographics (DOB, phone, KYC status) belong to `customers`.
  $$\text{USERS}(\underline{\text{id}}, \text{username}, \text{email}, \text{password}, \text{role}, \dots)$$
  $$\text{CUSTOMERS}(\underline{\text{id}}, \text{user\_id}, \text{full\_name}, \text{dob}, \text{phone}, \dots)$$

#### Case C: Transactions & Account Balances
- Transactions are append-only. They reference `account_id` directly. Sender and receiver relationships in transfers use foreign key `related_account_id` rather than duplicate storage.

---

## 4. Elimination of Relational Anomalies

| Anomaly Type | Problem in Denormalized Schema | Resolution in 3NF Schema |
|---|---|---|
| **Insertion Anomaly** | Cannot add a new branch if no accounts have been opened at that branch yet. | `branches` table exists independently; branches can be created anytime without accounts. |
| **Deletion Anomaly** | Deleting the last account at a branch accidentally erases the branch IFSC code and city. | Deleting an account only removes the account tuple; the branch remains intact. |
| **Update Anomaly** | If a branch's IFSC code changes, updating 10,000 accounts risks inconsistencies. | Update IFSC once in the `branches` table; all accounts reference the branch via foreign key. |

