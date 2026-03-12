import sqlite3
import os

for db in ['backend/db.sqlite3', 'local_backend/db.sqlite3']:
    if os.path.exists(db):
        print(f"--- Checking {db} ---")
        conn = sqlite3.connect(db)
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT name FROM assets_asset")
            rows = cursor.fetchall()
            for row in rows:
                print(f"Asset: {row[0]}")
        except Exception as e:
            print(f"Error: {e}")
        conn.close()
