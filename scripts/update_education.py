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

# Map to human-readable levels and choose only Masters/Doctorate/Education Specialist.
level_name_map = {
    "A": "Associate",
    "B": "Bachelors",
    "D": "Doctorate",
    "M": "Masters",
    "P": "Post Bachelors",
    "S": "Education Specialist",
    "Y": "Certificate",
}
allowed_levels = {"Masters", "Doctorate", "Education Specialist", "Certificate", "Post Bachelors"}

campus_map = {
    "MSN": "University of Wisconsin Madison",
    "MIL": "University of Wisconsin Milwaukee",
    "GBY": "University of Wisconsin Green Bay",
    "EAU": "University of Wisconsin Eau Claire",
    "LAC": "University of Wisconsin La Crosse",
    "OSH": "University of Wisconsin Oshkosh",
    "PLT": "University of Wisconsin Platteville",
    "RVF": "University of Wisconsin River Falls",
    "STO": "University of Wisconsin Stout",
    "WTW": "University of Wisconsin Whitewater",
    "PKS": "University of Wisconsin Parkside",
    "STP": "University of Wisconsin Stevens Point",
    "SUP": "University of Wisconsin Superior",
    
    # Add known codes as needed.
}

filtered_programs = []
for p in programs:
    raw_level = (p.get("program_level") or p.get("Program Level") or "").strip()
    if not raw_level:
        continue

    normalized = level_name_map.get(raw_level.upper(), raw_level)
    if normalized not in allowed_levels:
        continue

    p = p.copy()
    p["program_level"] = normalized

    campuses_raw = p.get("campuses", [])

    normalized_campuses = []
    for c in campuses_raw:
        code = c.strip().upper()
        name = campus_map.get(code)

        if name:
            normalized_campuses.append({
                "code": code,
                "name": name
            })

    new_p = p.copy()
    new_p["program_level"] = normalized
    new_p["campuses"] = normalized_campuses

    filtered_programs.append(new_p)

print(f"Filtered to {len(filtered_programs)} allowed rows")

merged = {}
for p in filtered_programs:
    key = (p["title"], p["program_level"])
    if key not in merged:
        merged[key] = p.copy()
        merged[key]["campuses"] = {c["code"]: c for c in p["campuses"]}
    else:
        for c in p["campuses"]:
            merged[key]["campuses"][c["code"]] = c

for p in merged.values():
    p["campuses"] = list(p["campuses"].values())

program_records = []

for p in merged.values():
    program_records.append({
        "title": p["title"],
        "program_level": p["program_level"],
        "course_delivery": p.get("course_delivery"),
        "program_type": p.get("program_type"),
        "career_clusters": p.get("career_clusters"),
        "submajors": p.get("submajors"),
        "keywords": p.get("keywords"),
    })

supabase.table("programs") \
    .upsert(program_records, on_conflict="title,program_level") \
    .execute()

print(f"Upserted {len(program_records)} programs")

programs_db = supabase.table("programs") \
    .select("id,title,program_level") \
    .execute().data

program_lookup = {
    (p["title"], p["program_level"]): p["id"]
    for p in programs_db
}
all_campuses = {}

for p in merged.values():
    for c in p["campuses"]:
        all_campuses[c["code"]] = c["name"]

campus_records = [
    {"code": code, "name": name}
    for code, name in all_campuses.items()
]

supabase.table("campuses") \
    .upsert(campus_records, on_conflict="code") \
    .execute()

print(f"Upserted {len(campus_records)} campuses")

program_campus_links = []

for p in merged.values():
    program_id = program_lookup[(p["title"], p["program_level"])]

    for c in p["campuses"]:
        program_campus_links.append({
            "program_id": program_id,
            "campus_code": c["code"]
        })

supabase.table("program_campuses") \
    .upsert(program_campus_links) \
    .execute()

print(f"Linked {len(program_campus_links)} program-campus relationships")

print("Update complete!")