# Apex Banking Management System - Entity Relationship (ER) Diagram

This document contains the Entity-Relationship specifications and Mermaid schema visualization for the Banking Management System.

## Mermaid ER Diagram

```mermaid
erDiagram
    USERS ||--o| CUSTOMERS : "has profile (1:1)"
    USERS ||--o{ AUDIT_LOG : "initiates (1:N)"
    USERS ||--o{ LOANS : "approves (1:N)"
    
    CUSTOMERS ||--|{ ACCOUNTS : "owns (1:N)"
    CUSTOMERS ||--o{ BENEFICIARIES : "manages (1:N)"
    CUSTOMERS ||--o{ LOANS : "applies for (1:N)"
    
    BRANCHES ||--|{ ACCOUNTS : "services (1:N)"
    
    ACCOUNTS ||--o{ TRANSACTIONS : "records ledger (1:N)"
    ACCOUNTS ||--o{ BENEFICIARIES : "designated as (1:N)"
    ACCOUNTS ||--o{ LOANS : "disburses to (1:N)"
    
    LOANS ||--o{ LOAN_PAYMENTS : "scheduled emi (1:N)"

    USERS {
        bigint id PK
        string username UK
        string email UK
        string password
        enum role
        boolean is_active
        datetime date_joined
    }

    CUSTOMERS {
        bigint id PK
        bigint user_id FK, UK
        string full_name
        date dob
        string phone
        text address
        string city
        enum kyc_status
        datetime created_at
    }

    BRANCHES {
        bigint id PK
        string name
        string ifsc_code UK
        string city
    }

    ACCOUNTS {
        bigint id PK
        string account_number UK
        bigint customer_id FK
        bigint branch_id FK
        enum type
        decimal balance "CHECK >= 0"
        enum status
        datetime opened_at
    }

    TRANSACTIONS {
        bigint id PK
        bigint account_id FK
        enum type
        decimal amount "CHECK > 0"
        decimal balance_after
        string reference_no UK
        string description
        bigint related_account_id FK, NULL
        datetime created_at
    }

    BENEFICIARIES {
        bigint id PK
        bigint customer_id FK
        bigint beneficiary_account_id FK
        string nickname
    }

    LOANS {
        bigint id PK
        bigint customer_id FK
        bigint account_id FK
        enum loan_type
        decimal principal "CHECK >= 1000"
        decimal interest_rate
        int tenure_months
        decimal emi
        enum status
        datetime applied_at
        bigint approved_by_id FK, NULL
        datetime approved_at
    }

    LOAN_PAYMENTS {
        bigint id PK
        bigint loan_id FK
        decimal amount "CHECK > 0"
        datetime paid_on
        enum status
    }

    AUDIT_LOG {
        bigint id PK
        bigint user_id FK, NULL
        string action
        string table_name
        string record_id
        json old_value
        json new_value
        datetime created_at
    }
```

## Cardinality & Relationship Breakdown

1. **USERS to CUSTOMERS (1:1)**: Every customer has exactly one system authentication account (`user_id` is UNIQUE). Admins do not require customer profiles.
2. **CUSTOMERS to ACCOUNTS (1:N)**: A customer can hold multiple bank accounts (e.g., both Savings and Current accounts). Every account must belong to exactly one customer (`customer_id` is NOT NULL).
3. **BRANCHES to ACCOUNTS (1:N)**: A branch services multiple accounts. Each account is mapped to one servicing branch with a unique IFSC code.
4. **ACCOUNTS to TRANSACTIONS (1:N)**: An account records an append-only ledger of transactions. Every transaction belongs to an account.
5. **CUSTOMERS to BENEFICIARIES (1:N)**: A customer can save multiple recipient accounts as beneficiaries with custom nicknames.
6. **CUSTOMERS to LOANS (1:N)**: A customer can apply for multiple loans (Home, Education, Personal, Vehicle).
7. **LOANS to LOAN_PAYMENTS (1:N)**: Each loan has a schedule of monthly EMI payments.
8. **USERS to AUDIT_LOG (1:N)**: Every administrative update, status alteration, or financial action is stamped with the acting user's ID.

