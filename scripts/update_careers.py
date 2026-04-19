import os
import requests
import re
import time
from datetime import datetime, timedelta, UTC
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
ADZUNA_APP_ID = os.environ.get("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.environ.get("ADZUNA_APP_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, ADZUNA_APP_ID, ADZUNA_APP_KEY]):
    raise Exception("Missing Environment Variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_all_categories():
    url = "https://api.adzuna.com/v1/api/jobs/us/categories"
    params = {"app_id": ADZUNA_APP_ID, "app_key": ADZUNA_APP_KEY}
    try:
        response = requests.get(url, params=params)
        return [c['tag'] for c in response.json().get('results', [])]
    except:
        return ["it-jobs", "engineering-jobs", "teaching-jobs"]

def determine_job_type(j):
    title = j.get("title", "").lower()
    desc = j.get("description", "").lower()
    intern_keywords = [r'\bintern\b', r'\binternship\b', r'\binternships\b']
    is_internship = any(re.search(pattern, title) or re.search(pattern, desc[:500]) for pattern in intern_keywords)
    if is_internship:
        return "Internship"
    contract_type = j.get("contract_type", "")
    if contract_type == "full_time":
        return "Full-Time"
    if contract_type == "part_time":
        return "Part-Time"
    if "part-time" in title or "part time" in title:
        return "Part-Time"
    return "Full-Time"

def extract_skills(text):
    if not text:
        return []

    text = text.lower()

    skill_patterns = {
        "Python": [r"\bpython\b"],
        "SQL": [r"\bsql\b"],
        "JavaScript": [r"\bjavascript\b", r"\bjs\b"],
        "React": [r"\breact\b"],
        "Node.js": [r"\bnode\.?js\b"],
        "AWS": [r"\baws\b"],
        "Docker": [r"\bdocker\b"],
        "Machine Learning": [r"\bmachine learning\b", r"\bml\b"],

        "Microsoft Office": [r"\bmicrosoft office\b", r"\bms office\b"],
        "Excel": [r"\bexcel\b"],
        "Data Entry": [r"\bdata entry\b"],
        "Customer Service": [r"\bcustomer service\b"],
        "Project Management": [r"\bproject management\b", r"\bpmp\b"],
        "Sales": [r"\bsales\b"],
        "Marketing": [r"\bmarketing\b", r"\bseo\b"],

        "Accounting": [r"\baccounting\b"],
        "Finance": [r"\bfinance\b"],
        "Bookkeeping": [r"\bbookkeeping\b"],

        "Patient Care": [r"\bpatient care\b"],
        "Nursing": [r"\bnursing\b", r"\bnurse\b", r"\brn\b", r"\blpn\b"],
        "Medical Assistant": [r"\bmedical assistant\b"],
        "Healthcare": [r"\bhealthcare\b"],

        "Teaching": [r"\bteaching\b", r"\bteacher\b"],
        "Curriculum Development": [r"\bcurriculum\b"],
        "Classroom Management": [r"\bclassroom\b"],

        "Construction": [r"\bconstruction\b"],
        "Electrical": [r"\belectrician\b", r"\belectrical\b"],
        "Plumbing": [r"\bplumbing\b", r"\bplumber\b"],
        "Maintenance": [r"\bmaintenance\b"],
        "Welding": [r"\bwelding\b"],
        "CDL Driving": [r"\bcdl\b", r"\btruck driver\b"],

        "Communication": [r"\bcommunication\b"],
        "Leadership": [r"\bleadership\b"],
        "Teamwork": [r"\bteamwork\b", r"\bteam player\b"],
        "Problem Solving": [r"\bproblem solving\b"],
        "Time Management": [r"\btime management\b"]
    }

    found_skills = set()

    for skill, patterns in skill_patterns.items():
        for pattern in patterns:
            if re.search(pattern, text):
                found_skills.add(skill)
                break

    return list(found_skills)

def fetch_jobs_by_category(state_name, categories):
    all_jobs = []
    for category in categories:
        print(f"Processing category: {category} in {state_name}")
        for page in range(1, 6):
            url = f"https://api.adzuna.com/v1/api/jobs/us/search/{page}"
            params = {
                "app_id": ADZUNA_APP_ID,
                "app_key": ADZUNA_APP_KEY,
                "where": state_name,
                "category": category,
                "results_per_page": 25,
                "content-type": "application/json"
            }
            try:
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    results = response.json().get("results", [])
                    all_jobs.extend(results)
                    print(f"  Page {page}: {len(results)} jobs found")
                elif response.status_code == 429:
                    print("  Rate limit hit. Sleeping 15s...")
                    time.sleep(15)
                time.sleep(0.5)
            except:
                continue
    return all_jobs

states_to_track = ["Wisconsin", "Minnesota"]
now = datetime.now(UTC).isoformat()
all_tags = get_all_categories()
unique_batch = {}

for state in states_to_track:
    raw_results = fetch_jobs_by_category(state, all_tags)
    for j in raw_results:
        title = j.get("title", "").strip()
        company = j.get("company", {}).get("display_name", "Unknown").strip()
        url = j.get("redirect_url", "")

        if not title or not url:
            continue

        key = (title.lower(), company.lower(), url)

        if key not in unique_batch:
            location_data = j.get("location", {}).get("area", [])
            city = location_data[-1] if location_data else "Unknown"

            description = j.get("description", "")
            if len(description) < 50:
                continue

            unique_batch[key] = {
                "title": title,
                "company_name": company,
                "location_city": city,
                "state_source": state,
                "description": description,
                "job_url": url,
                "category": j.get("category", {}).get("label", ""),
                "job_type": determine_job_type(j),
                "skills": extract_skills(description),
                "salary_min": j.get("salary_min"),
                "salary_max": j.get("salary_max"),
                "created": j.get("created"),
                "last_seen": now
            }

career_records = list(unique_batch.values())
total_records = len(career_records)
print(f"Total unique records to process: {total_records}")

if total_records >= 10:
    print("Starting batch upload to Supabase...")
    for i in range(0, total_records, 500):
        batch = career_records[i:i+500]
        supabase.table("careers").upsert(
            batch,
            on_conflict="title,company_name,job_url"
        ).execute()
        print(f"  Uploaded batch {i // 500 + 1} ({(i + len(batch))}/{total_records})")

    cutoff = (datetime.now(UTC) - timedelta(days=2)).isoformat()
    old_data_req = supabase.table("careers").select("id").lt("last_seen", cutoff).execute()
    old_data = old_data_req.data

    ids_to_delete = [row["id"] for row in old_data]

    if ids_to_delete:
        print(f"Found {len(ids_to_delete)} stale jobs. Cleaning up...")
        for i in range(0, len(ids_to_delete), 500):
            sub_ids = ids_to_delete[i:i+500]
            supabase.table("careers").delete().in_("id", sub_ids).execute()
        print("Cleanup complete.")
else:
    print("Skipping upload and cleanup: Insufficient data found (Possible API issue).")