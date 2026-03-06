import sqlite3
import os

src_db_path = 'faith-portal.db'
dest_db_path = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/7e2321919fe01c947cea444d63c860b23992516902a30272f37d29496abbfa35.sqlite'

if not os.path.exists(src_db_path):
    print(f"Error: Source DB {src_db_path} not found")
    exit(1)
if not os.path.exists(dest_db_path):
    print(f"Error: Destination DB {dest_db_path} not found")
    exit(1)

src_conn = sqlite3.connect(src_db_path)
dest_conn = sqlite3.connect(dest_db_path)

def sync_table(table_name):
    print(f"Syncing table: {table_name}...")
    
    # Get schema from source
    cursor = src_conn.cursor()
    cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table_name}'")
    create_sql = cursor.fetchone()[0]
    
    # Get index schemas
    cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='{table_name}' AND sql IS NOT NULL")
    index_sqls = [row[0] for row in cursor.fetchall()]
    
    # Prepare destination
    dest_cursor = dest_conn.cursor()
    dest_cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
    dest_cursor.execute(create_sql)
    for index_sql in index_sqls:
        dest_cursor.execute(index_sql)
    
    # Copy data
    cursor.execute(f"SELECT * FROM {table_name}")
    rows = cursor.fetchall()
    if rows:
        placeholders = ','.join(['?'] * len(rows[0]))
        dest_cursor.executemany(f"INSERT INTO {table_name} VALUES ({placeholders})", rows)
    
    dest_conn.commit()
    print(f"Successfully synced {len(rows)} rows to {table_name}")

try:
    sync_table('users')
    sync_table('news')
    print("All tables synced successfully!")
finally:
    src_conn.close()
    dest_conn.close()
