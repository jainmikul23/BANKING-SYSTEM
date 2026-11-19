-- =====================================================================
-- SEED DATA FOR BANKING MANAGEMENT SYSTEM
-- =====================================================================

USE `banking_system`;

-- 1. SEED ADMIN USER
-- Password is Admin@123
INSERT INTO `users` (`id`, `password`, `is_superuser`, `username`, `first_name`, `last_name`, `email`, `is_staff`, `is_active`, `role`, `date_joined`, `created_at`)
VALUES (1, 'pbkdf2_sha256$1500000$8UDh7kLBGYeADGn8R7av6O$hcWObdWwGdKBIEH760Q2d93Hof6bmIh8HDCzjMZSkpg=', 1, 'admin', 'System', 'Administrator', 'admin@apexbank.in', 1, 1, 'admin', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE `id`=`id`;

-- 2. SEED BRANCHES
INSERT INTO `branches` (`id`, `name`, `ifsc_code`, `city`) VALUES
(1, 'Nariman Point Flagship', 'APEX0001001', 'Mumbai'),
(2, 'Connaught Place Central', 'APEX0002002', 'New Delhi'),
(3, 'Indiranagar Tech Park', 'APEX0003003', 'Bengaluru'),
(4, 'HITEC City Cyber Hub', 'APEX0004004', 'Hyderabad')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 3. SEED 10 CUSTOMER USERS (Password: Customer@123)
INSERT INTO `users` (`id`, `password`, `is_superuser`, `username`, `first_name`, `last_name`, `email`, `is_staff`, `is_active`, `role`, `date_joined`, `created_at`) VALUES
(2, 'pbkdf2_sha256$1500000$Y3tI8pFmSCeDdowgGOiL2e$rowcfaLBwRTxZ9JfkA0QngD05w4Oprww/w7E/klzEyo=', 0, 'customer1', 'Aarav', 'Sharma', 'aarav.sharma@example.in', 0, 1, 'customer', NOW(6), NOW(6)),
(3, 'pbkdf2_sha256$1500000$Y3tI8pFmSCeDdowgGOiL2e$rowcfaLBwRTxZ9JfkA0QngD05w4Oprww/w7E/klzEyo=', 0, 'customer2', 'Priya', 'Patel', 'priya.patel@example.in', 0, 1, 'customer', NOW(6), NOW(6)),
(4, 'pbkdf2_sha256$1500000$Y3tI8pFmSCeDdowgGOiL2e$rowcfaLBwRTxZ9JfkA0QngD05w4Oprww/w7E/klzEyo=', 0, 'customer3', 'Rohan', 'Iyer', 'rohan.iyer@example.in', 0, 1, 'customer', NOW(6), NOW(6)),
(5, 'pbkdf2_sha256$1500000$Y3tI8pFmSCeDdowgGOiL2e$rowcfaLBwRTxZ9JfkA0QngD05w4Oprww/w7E/klzEyo=', 0, 'customer4', 'Ananya', 'Nair', 'ananya.nair@example.in', 0, 1, 'customer', NOW(6), NOW(6)),
(6, 'pbkdf2_sha256$1500000$Y3tI8pFmSCeDdowgGOiL2e$rowcfaLBwRTxZ9JfkA0QngD05w4Oprww/w7E/klzEyo=', 0, 'customer5', 'Vikram', 'Singh', 'vikram.singh@example.in', 0, 1, 'customer', NOW(6), NOW(6)),
(7, 'pbkdf2_sha256$1500000$Y3tI8pFmSCeDdowgGOiL2e$rowcfaLBwRTxZ9JfkA0QngD05w4Oprww/w7E/klzEyo=', 0, 'customer6', 'Neha', 'Gupta', 'neha.gupta@example.in', 0, 1, 'customer', NOW(6), NOW(6)),
(8, 'pbkdf2_sha256$1500000$Y3tI8pFmSCeDdowgGOiL2e$rowcfaLBwRTxZ9JfkA0QngD05w4Oprww/w7E/klzEyo=', 0, 'customer7', 'Kabir', 'Mukherjee', 'kabir.m@example.in', 0, 1, 'customer', NOW(6), NOW(6)),
(9, 'pbkdf2_sha256$1500000$Y3tI8pFmSCeDdowgGOiL2e$rowcfaLBwRTxZ9JfkA0QngD05w4Oprww/w7E/klzEyo=', 0, 'customer8', 'Sneha', 'Reddy', 'sneha.reddy@example.in', 0, 1, 'customer', NOW(6), NOW(6)),
(10, 'pbkdf2_sha256$1500000$Y3tI8pFmSCeDdowgGOiL2e$rowcfaLBwRTxZ9JfkA0QngD05w4Oprww/w7E/klzEyo=', 0, 'customer9', 'Aditya', 'Verma', 'aditya.v@example.in', 0, 1, 'customer', NOW(6), NOW(6)),
(11, 'pbkdf2_sha256$1500000$Y3tI8pFmSCeDdowgGOiL2e$rowcfaLBwRTxZ9JfkA0QngD05w4Oprww/w7E/klzEyo=', 0, 'customer10', 'Meera', 'Joshi', 'meera.joshi@example.in', 0, 1, 'customer', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE `username`=VALUES(`username`);

-- 4. SEED CUSTOMER PROFILES
INSERT INTO `customers` (`id`, `user_id`, `full_name`, `dob`, `phone`, `address`, `city`, `kyc_status`, `created_at`) VALUES
(1, 2, 'Aarav Sharma', '1992-05-14', '+91 98201 12345', 'Flat 402, Sea Green Apts, Worli', 'Mumbai', 'verified', NOW(6)),
(2, 3, 'Priya Patel', '1995-11-20', '+91 98791 23456', '12 Heritage Enclave, Satellite', 'Ahmedabad', 'verified', NOW(6)),
(3, 4, 'Rohan Iyer', '1988-03-08', '+91 97402 34567', '45 Palm Grove, Indiranagar', 'Bengaluru', 'verified', NOW(6)),
(4, 5, 'Ananya Nair', '1996-08-15', '+91 98460 45678', 'Plot 88, Marine Drive', 'Kochi', 'verified', NOW(6)),
(5, 6, 'Vikram Singh', '1985-01-25', '+91 98110 56789', 'B-14 Hauz Khas Enclave', 'New Delhi', 'verified', NOW(6)),
(6, 7, 'Neha Gupta', '1998-07-30', '+91 99220 67890', '702 Sky High, Baner', 'Pune', 'verified', NOW(6)),
(7, 8, 'Kabir Mukherjee', '1990-12-12', '+91 98300 78901', '14 Ballygunge Circular Rd', 'Kolkata', 'verified', NOW(6)),
(8, 9, 'Sneha Reddy', '1994-04-05', '+91 98490 89012', 'Villa 23, Jubilee Hills', 'Hyderabad', 'verified', NOW(6)),
(9, 10, 'Aditya Verma', '1997-09-18', '+91 98880 90123', 'Sector 8-C, Madhya Marg', 'Chandigarh', 'pending', NOW(6)),
(10, 11, 'Meera Joshi', '1993-02-28', '+91 94140 01234', '56 Malviya Nagar', 'Jaipur', 'verified', NOW(6))
ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`);

-- 5. SEED 15 ACCOUNTS
INSERT INTO `accounts` (`id`, `account_number`, `customer_id`, `branch_id`, `type`, `balance`, `status`, `opened_at`) VALUES
(1, '501002345671', 1, 1, 'savings', 125400.50, 'active', NOW(6)),
(2, '501002345672', 1, 1, 'current', 450000.00, 'active', NOW(6)),
(3, '502003456781', 2, 1, 'savings', 84500.00, 'active', NOW(6)),
(4, '502003456782', 2, 1, 'current', 210000.75, 'active', NOW(6)),
(5, '503004567891', 3, 3, 'savings', 342000.00, 'active', NOW(6)),
(6, '503004567892', 3, 3, 'current', 75000.00, 'active', NOW(6)),
(7, '504005678901', 4, 3, 'savings', 92300.25, 'active', NOW(6)),
(8, '504005678902', 4, 3, 'current', 180000.00, 'active', NOW(6)),
(9, '505006789011', 5, 2, 'savings', 560000.00, 'active', NOW(6)),
(10, '505006789012', 5, 2, 'current', 115000.00, 'active', NOW(6)),
(11, '506007890121', 6, 1, 'savings', 67000.50, 'active', NOW(6)),
(12, '507008901231', 7, 2, 'savings', 145000.00, 'active', NOW(6)),
(13, '508009012341', 8, 4, 'savings', 289000.00, 'active', NOW(6)),
(14, '509000123451', 9, 2, 'savings', 42000.00, 'active', NOW(6)),
(15, '510001234561', 10, 2, 'savings', 118500.00, 'active', NOW(6))
ON DUPLICATE KEY UPDATE `balance`=VALUES(`balance`);

-- 6. SEED BENEFICIARIES
INSERT INTO `beneficiaries` (`customer_id`, `beneficiary_account_id`, `nickname`) VALUES
(1, 3, 'Priya Patel Savings'),
(1, 5, 'Rohan Iyer Tech'),
(1, 13, 'Sneha Hyderabad'),
(2, 1, 'Aarav Sharma Worli')
ON DUPLICATE KEY UPDATE `nickname`=VALUES(`nickname`);

-- 7. SEED 5 LOANS
INSERT INTO `loans` (`id`, `customer_id`, `account_id`, `loan_type`, `principal`, `interest_rate`, `tenure_months`, `emi`, `status`, `applied_at`, `approved_by_id`, `approved_at`) VALUES
(1, 1, 1, 'home', 2500000.00, 8.50, 120, 31018.52, 'active', DATE_SUB(NOW(6), INTERVAL 95 DAY), 1, DATE_SUB(NOW(6), INTERVAL 90 DAY)),
(2, 2, 3, 'education', 800000.00, 9.25, 48, 20008.15, 'active', DATE_SUB(NOW(6), INTERVAL 65 DAY), 1, DATE_SUB(NOW(6), INTERVAL 60 DAY)),
(3, 3, 5, 'vehicle', 650000.00, 9.75, 60, 13735.61, 'pending', DATE_SUB(NOW(6), INTERVAL 3 DAY), NULL, NULL),
(4, 5, 9, 'personal', 300000.00, 11.50, 36, 9892.83, 'pending', DATE_SUB(NOW(6), INTERVAL 1 DAY), NULL, NULL),
(5, 10, 15, 'personal', 150000.00, 12.00, 12, 13327.42, 'closed', DATE_SUB(NOW(6), INTERVAL 385 DAY), 1, DATE_SUB(NOW(6), INTERVAL 380 DAY))
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

-- 8. SEED INITIAL TRANSACTIONS
INSERT INTO `transactions` (`account_id`, `type`, `amount`, `balance_after`, `reference_no`, `description`, `created_at`) VALUES
(1, 'deposit', 125400.50, 125400.50, 'INIT501001', 'Initial Account Opening Deposit', DATE_SUB(NOW(6), INTERVAL 90 DAY)),
(2, 'deposit', 450000.00, 450000.00, 'INIT501002', 'Initial Current Account Deposit', DATE_SUB(NOW(6), INTERVAL 80 DAY)),
(3, 'deposit', 84500.00, 84500.00, 'INIT502001', 'Initial Account Opening Deposit', DATE_SUB(NOW(6), INTERVAL 70 DAY)),
(5, 'deposit', 342000.00, 342000.00, 'INIT503001', 'Initial Account Opening Deposit', DATE_SUB(NOW(6), INTERVAL 60 DAY)),
(9, 'deposit', 560000.00, 560000.00, 'INIT505001', 'Initial Account Opening Deposit', DATE_SUB(NOW(6), INTERVAL 50 DAY))
ON DUPLICATE KEY UPDATE `amount`=VALUES(`amount`);

