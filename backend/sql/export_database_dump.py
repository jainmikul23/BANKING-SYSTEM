#!/usr/bin/env python3
"""
Exports a complete, portable SQL dump of the banking database from Railway MySQL.
Compatible with standard MySQL 8+, Railway, Render, phpMyAdmin, MySQL Workbench, DBeaver.
"""
import os
import sys
from datetime import datetime
from decimal import Decimal
import pymysql

# Connection params
HOST = os.getenv('DB_HOST', 'turntable.proxy.rlwy.net')
PORT = int(os.getenv('DB_PORT', '15329'))
USER = os.getenv('DB_USER', 'root')
PASSWORD = os.getenv('DB_PASSWORD', 'EQLTcUhDIOEZxEPWcKkMMfriIQrERdvW')
DATABASE = os.getenv('DB_NAME', 'railway')

OUTPUT_FILE = sys.argv[1] if len(sys.argv) > 1 else 'database_dump.sql'

print(f"Connecting to {USER}@{HOST}:{PORT}/{DATABASE}...")
conn = pymysql.connect(
    host=HOST,
    port=PORT,
    user=USER,
    password=PASSWORD,
    database=DATABASE,
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)

header = f"""-- =====================================================================
-- BANKING MANAGEMENT SYSTEM - FULL DATABASE DUMP (SCHEMA + SEED DATA)
-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- Source: MySQL 8.4 (Railway Cloud Database: {HOST}:{PORT}/{DATABASE})
-- 3NF Normalized Architecture: Users, Customers, Branches, Accounts,
--                              Transactions, Loans, Loan Payments, Beneficiaries, Audit Logs
-- =====================================================================

SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT;
SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS;
SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION;
SET NAMES utf8mb4;
SET @OLD_TIME_ZONE=@@TIME_ZONE;
SET TIME_ZONE='+00:00';
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';

"""

footer = """
-- =====================================================================
-- RESTORE SETTINGS
-- =====================================================================
SET TIME_ZONE=@OLD_TIME_ZONE;
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT;
SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS;
SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION;

-- Dump completed successfully.
"""

def format_val(val):
    if val is None:
        return 'NULL'
    if isinstance(val, (int, float, Decimal)):
        return str(val)
    if isinstance(val, bool):
        return '1' if val else '0'
    if isinstance(val, (datetime,)):
        return f"'{val.strftime('%Y-%m-%d %H:%M:%S.%f')}'"
    # String or bytes
    s = str(val)
    s = s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n').replace('\r', '\\r')
    return f"'{s}'"

with conn.cursor() as cursor:
    cursor.execute("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE';")
    tables = [list(row.values())[0] for row in cursor.fetchall()]

    print(f"Found {len(tables)} tables to dump: {tables}")

    with open(OUTPUT_FILE, 'w', encoding='utf8') as f:
        f.write(header)
        
        for table in tables:
            print(f"Dumping table {table}...")
            f.write(f"\n--\n-- Table structure for table `{table}`\n--\n\n")
            f.write(f"DROP TABLE IF EXISTS `{table}`;\n")
            
            cursor.execute(f"SHOW CREATE TABLE `{table}`;")
            create_row = cursor.fetchone()
            create_sql = create_row['Create Table'] + ";\n\n"
            f.write(create_sql)
            
            # Data
            cursor.execute(f"SELECT * FROM `{table}`;")
            rows = cursor.fetchall()
            if rows:
                f.write(f"--\n-- Dumping data for table `{table}` ({len(rows)} rows)\n--\n\n")
                f.write(f"LOCK TABLES `{table}` WRITE;\n")
                f.write(f"ALTER TABLE `{table}` DISABLE KEYS;\n")
                
                # Batch inserts in chunks of 50
                chunk_size = 50
                for i in range(0, len(rows), chunk_size):
                    chunk = rows[i:i+chunk_size]
                    cols = ", ".join([f"`{c}`" for c in chunk[0].keys()])
                    vals_list = []
                    for row in chunk:
                        row_vals = ", ".join([format_val(v) for v in row.values()])
                        vals_list.append(f"({row_vals})")
                    f.write(f"INSERT INTO `{table}` ({cols}) VALUES\n" + ",\n".join(vals_list) + ";\n")
                    
                f.write(f"ALTER TABLE `{table}` ENABLE KEYS;\n")
                f.write("UNLOCK TABLES;\n\n")
            else:
                f.write(f"-- Table `{table}` has 0 rows.\n\n")

        f.write(footer)

conn.close()
print(f"Dump written successfully to {OUTPUT_FILE} ({os.path.getsize(OUTPUT_FILE)} bytes)!")
