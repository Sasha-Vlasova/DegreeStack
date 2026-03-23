import os
import requests
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Supabase URL or KEY not set in environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

url = "https://www.wisconsin.edu/wp-json/uws-program-finder/v1/programs"
response = requests.get(url)
response.raise_for_status()

data = response.json()
programs = data.get("data", [])

print(f"Fetched {len(programs)} rows")

merged = {}
for p in programs:
    key = (p["title"], p["program_level"])
    if key not in merged:
        merged[key] = p.copy()
        merged[key]["campuses"] = set(p["campuses"])
    else:
        merged[key]["campuses"].update(p["campuses"])

for p in merged.values():
    p["campuses"] = list(p["campuses"])

bulk_records = []
for p in merged.values():
    record = {
        "title": p["title"],
        "program_level": p["program_level"],
        "course_delivery": p.get("course_delivery"),
        "program_type": p.get("program_type"),
        "career_clusters": p.get("career_clusters"),
        "submajors": p.get("submajors"),
        "keywords": p.get("keywords"),
        "campuses": p["campuses"],
    }
    bulk_records.append(record)


try:
    result = supabase.table("programs").upsert(bulk_records,on_conflict="title,program_level",count="exact",returning="minimal").execute()

    affected = result.count if result.count is not None else "unknown (common with returning='minimal')"
    print(f"Upsert complete — affected {affected} rows")
    print(f"Returned data length: {len(result.data) if result.data else 0}")

except Exception as e:
print("Upsert failed:", str(e))
    if hasattr(e, 'code'):
        print(f"  Code: {getattr(e, 'code')}")
    if hasattr(e, 'message'):
        print(f"  Message: {getattr(e, 'message')}")
    raise

print("Update complete!")