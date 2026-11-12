-- =====================================================================
-- DATABASE VIEWS FOR REPORTING & ANALYTICS
-- =====================================================================

USE `banking_system`;

-- VIEW 1: Account Summary with Customer & Branch Details
CREATE OR REPLACE VIEW `v_account_summary` AS
SELECT 
    a.id AS account_id,
    a.account_number,
    a.type AS account_type,
    a.balance,
    a.status AS account_status,
    a.opened_at,
    c.id AS customer_id,
    c.full_name AS customer_name,
    c.phone AS customer_phone,
    u.email AS customer_email,
    c.kyc_status,
    b.id AS branch_id,
    b.name AS branch_name,
    b.ifsc_code,
    b.city AS branch_city,
    COUNT(t.id) AS total_transactions
FROM `accounts` a
JOIN `customers` c ON a.customer_id = c.id
JOIN `users` u ON c.user_id = u.id
JOIN `branches` b ON a.branch_id = b.id
LEFT JOIN `transactions` t ON a.id = t.account_id
GROUP BY a.id, a.account_number, a.type, a.balance, a.status, a.opened_at,
         c.id, c.full_name, c.phone, u.email, c.kyc_status,
         b.id, b.name, b.ifsc_code, b.city;

-- VIEW 2: Monthly Financial Statement per Account
CREATE OR REPLACE VIEW `v_monthly_statement` AS
SELECT 
    t.account_id,
    a.account_number,
    YEAR(t.created_at) AS txn_year,
    MONTH(t.created_at) AS txn_month,
    DATE_FORMAT(t.created_at, '%Y-%m') AS statement_month,
    COUNT(t.id) AS transaction_count,
    SUM(CASE WHEN t.type IN ('deposit', 'transfer_in', 'loan_credit') THEN t.amount ELSE 0 END) AS total_credits,
    SUM(CASE WHEN t.type IN ('withdraw', 'transfer_out', 'emi_debit') THEN t.amount ELSE 0 END) AS total_debits,
    (SUM(CASE WHEN t.type IN ('deposit', 'transfer_in', 'loan_credit') THEN t.amount ELSE 0 END) -
     SUM(CASE WHEN t.type IN ('withdraw', 'transfer_out', 'emi_debit') THEN t.amount ELSE 0 END)) AS net_cashflow
FROM `transactions` t
JOIN `accounts` a ON t.account_id = a.id
GROUP BY t.account_id, a.account_number, YEAR(t.created_at), MONTH(t.created_at), DATE_FORMAT(t.created_at, '%Y-%m');

-- VIEW 3: Loan Portfolio Overview with Repayment Metrics
CREATE OR REPLACE VIEW `v_loan_overview` AS
SELECT 
    l.id AS loan_id,
    c.full_name AS customer_name,
    c.phone AS customer_phone,
    a.account_number,
    l.loan_type,
    l.principal,
    l.interest_rate,
    l.tenure_months,
    l.emi,
    l.status AS loan_status,
    l.applied_at,
    l.approved_at,
    u.username AS approved_by,
    COALESCE(SUM(lp.amount), 0.00) AS total_repaid,
    ((l.emi * l.tenure_months) - COALESCE(SUM(lp.amount), 0.00)) AS estimated_outstanding
FROM `loans` l
JOIN `customers` c ON l.customer_id = c.id
JOIN `accounts` a ON l.account_id = a.id
LEFT JOIN `users` u ON l.approved_by_id = u.id
LEFT JOIN `loan_payments` lp ON l.id = lp.loan_id AND lp.status = 'paid'
GROUP BY l.id, c.full_name, c.phone, a.account_number, l.loan_type, 
         l.principal, l.interest_rate, l.tenure_months, l.emi, 
         l.status, l.applied_at, l.approved_at, u.username;

