#!/usr/bin/env python3
"""
Imports an SQL dump file into the target MySQL database.
Supports direct connection string or environment variables.

Usage:
    python import_database.py [dump_file.sql] [mysql://user:pass@host:port/database]
Example:
    python import_database.py database_dump.sql "mysql://root:EQLTcUhDIOEZxEPWcKkMMfriIQrERdvW@turntable.proxy.rlwy.net:15329/railway"
"""
import os
import sys
from urllib.parse import urlparse, unquote
import pymysql

sql_file = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('mysql://') else 'database_dump.sql'
conn_url = sys.argv[2] if len(sys.argv) > 2 else (sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].startswith('mysql://') else os.getenv('DATABASE_URL') or os.getenv('MYSQL_URL'))

if conn_url and (conn_url.startswith('mysql://') or conn_url.startswith('mysqlclient://')):
    p = urlparse(conn_url)
    db = p.path.lstrip('/') or 'railway'
    user = unquote(p.username) if p.username else 'root'
    password = unquote(p.password) if p.password else ''
    host = p.hostname or '127.0.0.1'
    port = int(p.port or 3306)
else:
    db = os.getenv('DB_NAME', 'railway')
    user = os.getenv('DB_USER', 'root')
    password = os.getenv('DB_PASSWORD', 'EQLTcUhDIOEZxEPWcKkMMfriIQrERdvW')
    host = os.getenv('DB_HOST', 'turntable.proxy.rlwy.net')
    port = int(os.getenv('DB_PORT', '15329'))

if not os.path.exists(sql_file):
    print(f"Error: SQL file '{sql_file}' not found.")
    sys.exit(1)

print(f"Connecting to {user}@{host}:{port}/{db}...")
conn = pymysql.connect(
    host=host,
    port=port,
    user=user,
    password=password,
    database=db,
    charset='utf8mb4',
    autocommit=True
)

print(f"Reading '{sql_file}'...")
with open(sql_file, 'r', encoding='utf8') as f:
    sql_content = f.read()

# Split statements by semicolon at end of line
statements = []
current_stmt = []
for line in sql_content.splitlines():
    stripped = line.strip()
    if not stripped or stripped.startswith('--') or stripped.startswith('/*'):
        continue
    current_stmt.append(line)
    if stripped.endswith(';'):
        stmt = "\n".join(current_stmt).strip()
        if stmt:
            statements.append(stmt)
        current_stmt = []

print(f"Executing {len(statements)} SQL statements...")
success_count = 0
with conn.cursor() as cursor:
    for i, stmt in enumerate(statements, start=1):
        try:
            cursor.execute(stmt)
            success_count += 1
            if i % 20 == 0 or i == len(statements):
                print(f"  [{i}/{len(statements)}] statements executed...")
        except Exception as e:
            print(f"  Warning on statement {i}: {e}")

conn.close()
print(f"Successfully executed {success_count}/{len(statements)} statements into {db}!")
