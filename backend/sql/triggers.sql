-- =====================================================================
-- TRIGGERS & STORED PROCEDURES FOR BANKING MANAGEMENT SYSTEM
-- =====================================================================

USE `banking_system`;

DELIMITER $$

-- TRIGGER 1: Prevent negative balance on account update
DROP TRIGGER IF EXISTS `trg_prevent_negative_balance`$$
CREATE TRIGGER `trg_prevent_negative_balance`
BEFORE UPDATE ON `accounts`
FOR EACH ROW
BEGIN
    IF NEW.balance < 0.00 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Transaction Rejected: Account balance cannot fall below zero.';
    END IF;
END$$

-- TRIGGER 2: Audit log on account status changes (active/frozen/closed)
DROP TRIGGER IF EXISTS `trg_account_status_audit`$$
CREATE TRIGGER `trg_account_status_audit`
AFTER UPDATE ON `accounts`
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status OR OLD.balance <> NEW.balance THEN
        INSERT INTO `audit_log` (`user_id`, `action`, `table_name`, `record_id`, `old_value`, `new_value`, `created_at`)
        VALUES (
            NULL,
            IF(OLD.status <> NEW.status, 'STATUS_CHANGE', 'BALANCE_UPDATE'),
            'accounts',
            NEW.id,
            JSON_OBJECT('status', OLD.status, 'balance', CAST(OLD.balance AS CHAR)),
            JSON_OBJECT('status', NEW.status, 'balance', CAST(NEW.balance AS CHAR)),
            NOW(6)
        );
    END IF;
END$$

-- TRIGGER 3: Audit log on customer KYC status update
DROP TRIGGER IF EXISTS `trg_customer_kyc_audit`$$
CREATE TRIGGER `trg_customer_kyc_audit`
AFTER UPDATE ON `customers`
FOR EACH ROW
BEGIN
    IF OLD.kyc_status <> NEW.kyc_status THEN
        INSERT INTO `audit_log` (`user_id`, `action`, `table_name`, `record_id`, `old_value`, `new_value`, `created_at`)
        VALUES (
            OLD.user_id,
            'KYC_STATUS_UPDATE',
            'customers',
            NEW.id,
            JSON_OBJECT('kyc_status', OLD.kyc_status),
            JSON_OBJECT('kyc_status', NEW.kyc_status),
            NOW(6)
        );
    END IF;
END$$

-- =====================================================================
-- STORED PROCEDURE: ATOMIC FUND TRANSFER WITH ACID PROPERTIES
-- =====================================================================
DROP PROCEDURE IF EXISTS `sp_transfer_funds`$$
CREATE PROCEDURE `sp_transfer_funds`(
    IN p_sender_acc VARCHAR(20),
    IN p_receiver_acc VARCHAR(20),
    IN p_amount DECIMAL(15,2),
    OUT p_status_code INT,
    OUT p_status_msg VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_sender_id BIGINT;
    DECLARE v_receiver_id BIGINT;
    DECLARE v_sender_bal DECIMAL(15,2);
    DECLARE v_receiver_bal DECIMAL(15,2);
    DECLARE v_sender_type ENUM('savings','current');
    DECLARE v_sender_status ENUM('active','frozen','closed');
    DECLARE v_receiver_status ENUM('active','frozen','closed');
    DECLARE v_min_bal DECIMAL(15,2);
    DECLARE v_ref_prefix VARCHAR(32);
    DECLARE v_ref_out VARCHAR(64);
    DECLARE v_ref_in VARCHAR(64);

    -- Declare rollback handler on SQL exception
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_code = 500;
        SET p_status_msg = 'Transaction Failed: Internal database error occurred during transfer.';
    END;

    -- Validate input amount
    IF p_amount <= 0.00 THEN
        SET p_status_code = 400;
        SET p_status_msg = 'Invalid transfer amount. Must be greater than 0.';
        LEAVE proc_label;
    END IF;

    -- Cannot transfer to same account
    IF p_sender_acc = p_receiver_acc THEN
        SET p_status_code = 400;
        SET p_status_msg = 'Cannot transfer funds to the same account.';
        LEAVE proc_label;
    END IF;

    -- Start Atomic Transaction
    START TRANSACTION;

    -- Lock and fetch sender account row
    SELECT id, balance, type, status 
    INTO v_sender_id, v_sender_bal, v_sender_type, v_sender_status
    FROM `accounts` 
    WHERE account_number = p_sender_acc 
    FOR UPDATE;

    IF v_sender_id IS NULL THEN
        ROLLBACK;
        SET p_status_code = 404;
        SET p_status_msg = 'Sender account not found.';
        LEAVE proc_label;
    END IF;

    IF v_sender_status <> 'active' THEN
        ROLLBACK;
        SET p_status_code = 403;
        SET p_status_msg = CONCAT('Sender account is ', v_sender_status, '. Transfers prohibited.');
        LEAVE proc_label;
    END IF;

    -- Lock and fetch receiver account row
    SELECT id, balance, status 
    INTO v_receiver_id, v_receiver_bal, v_receiver_status
    FROM `accounts` 
    WHERE account_number = p_receiver_acc 
    FOR UPDATE;

    IF v_receiver_id IS NULL THEN
        ROLLBACK;
        SET p_status_code = 404;
        SET p_status_msg = 'Receiver account not found.';
        LEAVE proc_label;
    END IF;

    IF v_receiver_status <> 'active' THEN
        ROLLBACK;
        SET p_status_code = 403;
        SET p_status_msg = CONCAT('Receiver account is ', v_receiver_status, '. Cannot receive funds.');
        LEAVE proc_label;
    END IF;

    -- Determine minimum required balance
    IF v_sender_type = 'savings' THEN
        SET v_min_bal = 500.00;
    ELSE
        SET v_min_bal = 0.00;
    END IF;

    -- Check if sender has sufficient balance
    IF (v_sender_bal - p_amount) < v_min_bal THEN
        ROLLBACK;
        SET p_status_code = 400;
        SET p_status_msg = CONCAT('Insufficient funds. Minimum required balance is ₹', v_min_bal);
        LEAVE proc_label;
    END IF;

    -- Deduct from sender and add to receiver
    UPDATE `accounts` SET balance = balance - p_amount WHERE id = v_sender_id;
    UPDATE `accounts` SET balance = balance + p_amount WHERE id = v_receiver_id;

    -- Generate reference numbers
    SET v_ref_prefix = CONCAT('TRF', UNIX_TIMESTAMP(), LPAD(FLOOR(RAND()*9999), 4, '0'));
    SET v_ref_out = CONCAT(v_ref_prefix, 'D');
    SET v_ref_in = CONCAT(v_ref_prefix, 'C');

    -- Record sender transaction row (Debit)
    INSERT INTO `transactions` (
        `account_id`, `type`, `amount`, `balance_after`, `reference_no`, `description`, `related_account_id`, `created_at`
    ) VALUES (
        v_sender_id, 'transfer_out', p_amount, (v_sender_bal - p_amount), v_ref_out, 
        CONCAT('Fund Transfer to A/C ', p_receiver_acc), v_receiver_id, NOW(6)
    );

    -- Record receiver transaction row (Credit)
    INSERT INTO `transactions` (
        `account_id`, `type`, `amount`, `balance_after`, `reference_no`, `description`, `related_account_id`, `created_at`
    ) VALUES (
        v_receiver_id, 'transfer_in', p_amount, (v_receiver_bal + p_amount), v_ref_in, 
        CONCAT('Fund Transfer from A/C ', p_sender_acc), v_sender_id, NOW(6)
    );

    -- Commit transaction
    COMMIT;
    SET p_status_code = 200;
    SET p_status_msg = 'Transfer successful.';

END$$

DELIMITER ;

