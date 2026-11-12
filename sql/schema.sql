-- =====================================================================
-- BANKING MANAGEMENT SYSTEM - DATABASE SCHEMA (3NF Normalized)
-- Database Engine: MySQL 8 (InnoDB, utf8mb4)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `banking_system` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `banking_system`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `loan_payments`;
DROP TABLE IF EXISTS `loans`;
DROP TABLE IF EXISTS `beneficiaries`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `accounts`;
DROP TABLE IF EXISTS `branches`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `audit_log`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS TABLE
CREATE TABLE `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `password` VARCHAR(128) NOT NULL,
    `last_login` DATETIME(6) NULL,
    `is_superuser` TINYINT(1) NOT NULL DEFAULT 0,
    `username` VARCHAR(150) NOT NULL UNIQUE,
    `first_name` VARCHAR(150) NOT NULL DEFAULT '',
    `last_name` VARCHAR(150) NOT NULL DEFAULT '',
    `email` VARCHAR(254) NOT NULL UNIQUE,
    `is_staff` TINYINT(1) NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `date_joined` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `role` ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CUSTOMERS TABLE
CREATE TABLE `customers` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL UNIQUE,
    `full_name` VARCHAR(150) NOT NULL,
    `dob` DATE NULL,
    `phone` VARCHAR(20) NOT NULL,
    `address` TEXT NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `kyc_status` ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT `fk_customers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BRANCHES TABLE
CREATE TABLE `branches` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `ifsc_code` VARCHAR(15) NOT NULL UNIQUE,
    `city` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. ACCOUNTS TABLE
CREATE TABLE `accounts` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `account_number` VARCHAR(20) NOT NULL UNIQUE,
    `customer_id` BIGINT NOT NULL,
    `branch_id` BIGINT NOT NULL,
    `type` ENUM('savings', 'current') NOT NULL DEFAULT 'savings',
    `balance` DECIMAL(15,2) NOT NULL DEFAULT 500.00,
    `status` ENUM('active', 'frozen', 'closed') NOT NULL DEFAULT 'active',
    `opened_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT `chk_account_balance` CHECK (`balance` >= 0.00),
    CONSTRAINT `fk_accounts_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_accounts_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_accounts_customer` ON `accounts` (`customer_id`);
CREATE INDEX `idx_accounts_acc_num` ON `accounts` (`account_number`);

-- 5. TRANSACTIONS TABLE
CREATE TABLE `transactions` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `account_id` BIGINT NOT NULL,
    `type` ENUM('deposit', 'withdraw', 'transfer_in', 'transfer_out', 'loan_credit', 'emi_debit') NOT NULL,
    `amount` DECIMAL(15,2) NOT NULL,
    `balance_after` DECIMAL(15,2) NOT NULL,
    `reference_no` VARCHAR(64) NOT NULL UNIQUE,
    `description` VARCHAR(255) NOT NULL DEFAULT '',
    `related_account_id` BIGINT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT `chk_transaction_amount` CHECK (`amount` > 0.00),
    CONSTRAINT `fk_transactions_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_transactions_related_account` FOREIGN KEY (`related_account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_txn_account` ON `transactions` (`account_id`);
CREATE INDEX `idx_txn_created_at` ON `transactions` (`created_at`);
CREATE INDEX `idx_txn_reference_no` ON `transactions` (`reference_no`);

-- 6. BENEFICIARIES TABLE
CREATE TABLE `beneficiaries` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT NOT NULL,
    `beneficiary_account_id` BIGINT NOT NULL,
    `nickname` VARCHAR(100) NOT NULL,
    CONSTRAINT `uq_customer_beneficiary` UNIQUE (`customer_id`, `beneficiary_account_id`),
    CONSTRAINT `fk_beneficiaries_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_beneficiaries_account` FOREIGN KEY (`beneficiary_account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. LOANS TABLE
CREATE TABLE `loans` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT NOT NULL,
    `account_id` BIGINT NOT NULL,
    `loan_type` ENUM('home', 'education', 'personal', 'vehicle') NOT NULL,
    `principal` DECIMAL(15,2) NOT NULL,
    `interest_rate` DECIMAL(5,2) NOT NULL,
    `tenure_months` INT NOT NULL,
    `emi` DECIMAL(15,2) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'active', 'closed') NOT NULL DEFAULT 'pending',
    `applied_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `approved_by_id` BIGINT NULL,
    `approved_at` DATETIME(6) NULL,
    CONSTRAINT `chk_loan_principal` CHECK (`principal` >= 1000.00),
    CONSTRAINT `chk_loan_tenure` CHECK (`tenure_months` > 0),
    CONSTRAINT `fk_loans_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_loans_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_loans_approved_by` FOREIGN KEY (`approved_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. LOAN PAYMENTS TABLE
CREATE TABLE `loan_payments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `loan_id` BIGINT NOT NULL,
    `amount` DECIMAL(15,2) NOT NULL,
    `paid_on` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `status` ENUM('paid', 'pending', 'overdue') NOT NULL DEFAULT 'paid',
    CONSTRAINT `chk_payment_amount` CHECK (`amount` > 0.00),
    CONSTRAINT `fk_loan_payments_loan` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. AUDIT LOG TABLE
CREATE TABLE `audit_log` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NULL,
    `action` VARCHAR(50) NOT NULL,
    `table_name` VARCHAR(50) NOT NULL,
    `record_id` VARCHAR(50) NOT NULL,
    `old_value` JSON NULL,
    `new_value` JSON NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT `fk_audit_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_audit_log_created_at` ON `audit_log` (`created_at`);

