import sqlite3
import json
import os

def sync():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # The database is in the backend (or local_backend) folder relative to this script
    db_path = os.path.join(script_dir, 'backend', 'db.sqlite3')
    if not os.path.exists(db_path):
        db_path = os.path.join(script_dir, 'local_backend', 'db.sqlite3')
    
    if not os.path.exists(db_path):
        print(f"Error: Database not found (checked backend/ and local_backend/)")
        return

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Fetch Categories
    cursor.execute("SELECT id, name FROM assets_category")
    categories = [dict(row) for row in cursor.fetchall()]

    # Fetch Subcategories
    cursor.execute("SELECT id, category_id, name FROM assets_subcategory")
    subcategories = [dict(row) for row in cursor.fetchall()]

    # Fetch Locations
    cursor.execute("SELECT id, name FROM assets_location")
    locations = {row['id']: dict(row) for row in cursor.fetchall()}

    # Group subcategories by category
    cat_to_sub = {}
    for sub in subcategories:
        cid = sub['category_id']
        if cid not in cat_to_sub:
            cat_to_sub[cid] = []
        cat_to_sub[cid].append({'id': sub['id'], 'name': sub['name']})

    formatted_categories = []
    for cat in categories:
        formatted_categories.append({
            'id': cat['id'],
            'name': cat['name'],
            'subcategories': cat_to_sub.get(cat['id'], [])
        })

    # Fetch Assets
    cursor.execute("SELECT * FROM assets_asset")
    assets = [dict(row) for row in cursor.fetchall()]

    # Categories lookup
    cat_lookup = {c['id']: c['name'] for c in categories}
    subcat_lookup = {s['id']: s['name'] for s in subcategories}

    formatted_assets = []
    for a in assets:
        loc = locations.get(a['location_id']) if a['location_id'] else None
        
        # Determine status
        status = 'Available' if a['available'] else 'Out of Stock'
        
        # In standalone mode, we use the copied media files in public/media/
        image_url = f"/media/{a['image']}" if a['image'] else None
        
        if not image_url:
            if 'camera' in a['name'].lower():
                image_url = 'https://images.unsplash.com/photo-1516724562728-afc824a36e84?w=500&q=80'
            elif 'tripod' in a['name'].lower():
                image_url = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80'
            else:
                image_url = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=500&q=80'

        formatted_assets.append({
            'id': a['id'],
            'name': a['name'],
            'serial_number': a['serial_number'] or '',
            'description': a['description'] or '',
            'location': {'id': loc['id'], 'name': loc['name']} if loc else None,
            'status': status,
            'total_quantity': a['total_quantity'],
            'image_url': image_url,
            'category': {'id': a['category_id'], 'name': cat_lookup.get(a['category_id'])} if a['category_id'] else None,
            'subcategory': {'id': a['subcategory_id'], 'name': subcat_lookup.get(a['subcategory_id'])} if a['subcategory_id'] else None
        })

    conn.close()

    # Write to mockData.js
    mock_data_path = os.path.join(script_dir, 'frontend', 'src', 'mockData.js')
    
    js_content = f"""export const MOCK_CATEGORIES = {json.dumps(formatted_categories, indent=4)};

export const MOCK_ASSETS = {json.dumps(formatted_assets, indent=4)};
"""
    
    with open(mock_data_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    # Sync media files
    print("Syncing media files...")
    media_src = os.path.join(script_dir, 'backend', 'media')
    if not os.path.exists(media_src):
        media_src = os.path.join(script_dir, 'local_backend', 'media')
    
    media_dest = os.path.join(script_dir, 'frontend', 'public', 'media')
    if os.path.exists(media_src):
        if not os.path.exists(media_dest):
            os.makedirs(media_dest)
        
        import shutil
        # We use a simple walk to copy files to avoid deleting the destination if it exists
        for root, dirs, files in os.walk(media_src):
            relative_path = os.path.relpath(root, media_src)
            dest_path = os.path.join(media_dest, relative_path)
            if not os.path.exists(dest_path):
                os.makedirs(dest_path)
            for file in files:
                shutil.copy2(os.path.join(root, file), os.path.join(dest_path, file))

    print(f"Successfully synced database and media to frontend.")

if __name__ == "__main__":
    sync()
