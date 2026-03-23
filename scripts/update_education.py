import os
import requests
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

print("Using Supabase URL:", SUPABASE_URL)
print("Key starts with:", SUPABASE_KEY[:10] + "...")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Supabase URL or KEY not set in environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

test_res = supabase.table("programs").upsert({"title": "DEBUG_TEST", "program_level": "X"},on_conflict="title,program_level").execute()
print("Minimal upsert result:", test_res)

url = "https://www.wisconsin.edu/wp-json/uws-program-finder/v1/programs"
response = requests.get(url)
if response.status_code != 200:
    raise Exception(f"Failed to fetch data: {response.status_code}")

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

# Debugging: Check how many records are in bulk_records
print(f"Prepared {len(bulk_records)} records to be upserted.")

try:
    result = supabase.table("programs").upsert(
        bulk_records,
        on_conflict="title,program_level",
        count="exact",
        returning="minimal"
    ).execute()
    print(f"Upsert complete — affected {result.count or 'unknown'} rows")
except Exception as e:
    print("Upsert error:", str(e))
    if hasattr(e, 'code'):
        print("Code:", getattr(e, 'code'))
    if hasattr(e, 'message'):
        print("Message:", getattr(e, 'message'))
    raise

# Debugging: Print the result to check for errors
print("Upsert result:", result)

# Check if Supabase returned an error
if hasattr(result, 'status_code'):
    if result.status_code >= 200 and result.status_code < 300:
        print(f"Successfully upserted {len(bulk_records)} programs")
    else:
        print(f"Failed to upsert programs. Status Code: {result.status_code}")
        print("Error message:", result.json())  # This will print the error response
else:
    print("Error: No status_code found in the result. Here is the result data:", result)

print("Update complete!")