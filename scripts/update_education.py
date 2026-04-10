import os
import requests
from datetime import datetime, timedelta
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Supabase URL or KEY not set.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

url = "https://www.wisconsin.edu/wp-json/uws-program-finder/v1/programs"
response = requests.get(url)
response.raise_for_status()

programs = response.json().get("data", [])
print(f"Fetched {len(programs)} rows")

level_name_map = {
    "A": "Associate",
    "B": "Bachelors",
    "D": "Doctorate",
    "M": "Masters",
    "P": "Post Bachelors",
    "S": "Education Specialist",
    "Y": "Certificate",
}

allowed_levels = {
    "Masters",
    "Doctorate",
    "Education Specialist",
    "Certificate",
    "Post Bachelors",
}

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
}

filtered_programs = []

for p in programs:
    raw_level = (p.get("program_level") or "").strip()
    if not raw_level:
        continue

    normalized = level_name_map.get(raw_level.upper(), raw_level)
    if normalized not in allowed_levels:
        continue

    campuses_raw = p.get("campuses") or []

    campuses = []
    for c in campuses_raw:
        if not c:
            continue
        code = c.strip().upper()
        name = campus_map.get(code)
        if name:
            campuses.append({"code": code, "name": name})

    filtered_programs.append({
        "title": p.get("title"),
        "program_level": normalized,
        "course_delivery": p.get("course_delivery"),
        "program_type": p.get("program_type"),
        "career_clusters": p.get("career_clusters"),
        "submajors": p.get("submajors"),
        "keywords": p.get("keywords"),
        "program_url": p.get("program_url") or "",
        "campuses": campuses
    })

print(f"Filtered to {len(filtered_programs)} programs")

unique_programs = {}

for p in filtered_programs:
    key = (p["title"], p["program_level"], p["program_url"])
    if key not in unique_programs:
        unique_programs[key] = p

print(f"Unique programs: {len(unique_programs)}")

if len(unique_programs) < 50:
    print("API returned too few programs — aborting sync")
    exit()

now = datetime.utcnow().isoformat()

program_records = [
    {
        "title": p["title"],
        "program_level": p["program_level"],
        "course_delivery": p.get("course_delivery"),
        "program_type": p.get("program_type"),
        "career_clusters": p.get("career_clusters"),
        "submajors": p.get("submajors"),
        "keywords": p.get("keywords"),
        "program_url": p.get("program_url"),
        "last_seen": now
    }
    for p in unique_programs.values()
]

supabase.table("programs") \
    .upsert(program_records, on_conflict="title,program_level,program_url") \
    .execute()

print(f"Upserted {len(program_records)} programs")

programs_db = supabase.table("programs") \
    .select("id,title,program_level,program_url") \
    .execute() \
    .data

program_lookup = {
    (p["title"], p["program_level"], p["program_url"] or ""): p["id"]
    for p in programs_db
}

cutoff = (datetime.utcnow() - timedelta(days=2)).isoformat()

old_programs = supabase.table("programs") \
    .select("id") \
    .lt("last_seen", cutoff) \
    .execute() \
    .data

ids_to_delete = [p["id"] for p in old_programs]

if ids_to_delete:
    supabase.table("program_campuses") \
        .delete() \
        .in_("program_id", ids_to_delete) \
        .execute()

    supabase.table("programs") \
        .delete() \
        .in_("id", ids_to_delete) \
        .execute()

    print(f"Deleted {len(ids_to_delete)} stale programs")

all_campuses = {}

for p in filtered_programs:
    for c in p["campuses"]:
        all_campuses[c["code"]] = c["name"]

campus_records = [
    {
        "code": code,
        "name": name,
        "state": "Wisconsin"
    }
    for code, name in all_campuses.items()
]

supabase.table("campuses") \
    .upsert(campus_records, on_conflict="code") \
    .execute()

print(f"Upserted {len(campus_records)} campuses")

links = []

for p in filtered_programs:
    key = (p["title"], p["program_level"], p["program_url"])
    program_id = program_lookup.get(key)

    if not program_id:
        continue

    for c in p["campuses"]:
        links.append({
            "program_id": program_id,
            "campus_code": c["code"]
        })

seen = set()
final_links = []

for l in links:
    key = (l["program_id"], l["campus_code"])
    if key not in seen:
        seen.add(key)
        final_links.append(l)

if final_links:
    supabase.table("program_campuses") \
        .upsert(final_links, on_conflict="program_id,campus_code") \
        .execute()

print(f"Linked {len(final_links)} relationships")

print("Update complete!")