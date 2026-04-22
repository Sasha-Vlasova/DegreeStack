import os
import re
import time
from datetime import datetime, timedelta, UTC
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

import requests
from supabase import Client, create_client


SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
ADZUNA_APP_ID = os.environ.get("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.environ.get("ADZUNA_APP_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, ADZUNA_APP_ID, ADZUNA_APP_KEY]):
    raise Exception("Missing Environment Variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_all_categories():
    url = "https://api.adzuna.com/v1/api/jobs/us/categories"
    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY
    }

    try:
        response = requests.get(url, params=params, timeout=20)
        response.raise_for_status()
        data = response.json().get("results", [])
        return [item["tag"] for item in data]
    except:
        return ["it-jobs", "engineering-jobs", "teaching-jobs"]


def normalize_text(text):
    text = text or ""
    text = text.replace("\r", "\n")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def normalize_job_url(url):
    if not url:
        return ""

    try:
        parsed = urlparse(url)
        query = parse_qs(parsed.query)

        kept = {}
        if "v" in query and query["v"]:
            kept["v"] = query["v"][0]

        new_query = urlencode(kept)

        return urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            ""
        ))
    except:
        return url


def determine_job_type(job):
    title = (job.get("title") or "").lower()
    description = (job.get("description") or "").lower()
    contract_type = job.get("contract_type", "")

    if "intern" in title or "internship" in title or "intern" in description[:500]:
        return "Internship"

    if contract_type == "part_time" or "part-time" in title or "part time" in title:
        return "Part-Time"

    return "Full-Time"


def extract_city(location_area, state_name):
    if not location_area:
        return ""

    cleaned = [part.strip() for part in location_area if part and part.strip()]
    if not cleaned:
        return ""

    excluded = {"usa", "united states", "us", state_name.lower()}
    filtered = [part for part in cleaned if part.lower() not in excluded]

    return filtered[-1] if filtered else ""


def extract_role_text(title, description):
    title_text = normalize_text(title)
    description_text = normalize_text(description)

    if not description_text:
        return title_text

    lower_desc = description_text.lower()

    markers = [
        "responsibilities",
        "requirements",
        "qualifications",
        "what you'll do",
        "what you will do",
        "what you need",
        "preferred qualifications"
    ]

    for marker in markers:
        idx = lower_desc.find(marker)
        if idx != -1:
            return f"{title_text} {description_text[idx:]}".strip()

    return f"{title_text} {description_text[:1500]}".strip()


def extract_skills(title, description, category=""):
    title_text = normalize_text(title).lower()
    category_text = normalize_text(category).lower()
    role_text = extract_role_text(title, description).lower()
    text = f"{title_text} {category_text} {role_text}"

    skills = []

    keyword_map = {
        "Python": ["python"],
        "SQL": ["sql"],
        "Java": ["java"],
        "JavaScript": ["javascript"],
        "TypeScript": ["typescript"],
        "React": ["react"],
        "Node.js": ["node.js", "nodejs"],
        "HTML": ["html"],
        "CSS": ["css"],
        "AWS": ["aws", "amazon web services"],
        "Azure": ["azure"],
        "Google Cloud": ["gcp", "google cloud"],
        "Docker": ["docker"],
        "Kubernetes": ["kubernetes", "k8s"],
        "Machine Learning": ["machine learning"],
        "Artificial Intelligence": ["artificial intelligence"],
        "Data Analysis": ["data analysis", "data analyst"],
        "Data Engineering": ["data engineer", "data engineering"],
        "Business Intelligence": ["business intelligence", "power bi", "tableau"],
        "Database Administration": ["database administrator", "postgres", "mysql", "dba"],
        "Cybersecurity": ["cybersecurity", "security analyst", "security engineer"],
        "Technical Support": ["technical support", "help desk", "service desk"],
        "Project Management": ["project management", "project manager"],
        "Accounting": ["accounting", "accountant"],
        "Finance": ["finance", "financial analyst"],
        "Customer Service": ["customer service"],
        "Sales": ["sales", "account executive"],
        "Marketing": ["marketing"],
        "Teaching": ["teaching", "teacher", "instructor"],
        "Nursing": ["nursing", "nurse", "rn", "lpn", "cna"],
        "Healthcare": ["healthcare", "medical assistant", "patient care"],
        "Office Administration": ["administrative support", "office management", "data entry"],
        "CDL Driving": ["cdl", "truck driver", "commercial driver"]
    }

    for skill, keywords in keyword_map.items():
        if any(keyword in text for keyword in keywords):
            skills.append(skill)

    customer_service_guard = (
        "customer services jobs" in category_text
        or any(word in title_text for word in [
            "valet",
            "driver",
            "parking",
            "shuttle",
            "porter",
            "lot attendant"
        ])
    )

    if customer_service_guard:
        blocked = {
            "Machine Learning",
            "Artificial Intelligence",
            "Data Analysis",
            "Data Engineering",
            "Business Intelligence",
            "Database Administration",
            "SQL"
        }
        skills = [skill for skill in skills if skill not in blocked]

    return skills[:12]


def determine_career_cluster(title, description, category, skills):
    title_text = normalize_text(title).lower()
    category_text = normalize_text(category).lower()
    role_text = extract_role_text(title, description).lower()
    skill_text = " ".join(skill.lower() for skill in (skills or []))
    text = f"{title_text} {category_text} {role_text} {skill_text}"

    if (
        "customer services jobs" in category_text
        or any(word in title_text for word in [
            "valet",
            "driver",
            "parking",
            "shuttle",
            "porter",
            "lot attendant"
        ])
    ):
        return "Customer Support & Administration"

    if "intern" in title_text or "internship" in title_text:
        if any(word in title_text for word in [
            "software",
            "programming",
            "systems",
            "developer",
            "engineer",
            "cybersecurity",
            "security",
            "database",
            "cloud",
            "network",
            "it ",
            "technical",
            "web"
        ]):
            return "Technology"

        if any(word in title_text for word in [
            "data",
            "analytics",
            "machine learning",
            "artificial intelligence",
            "sql",
            "business intelligence"
        ]):
            return "Data & Analytics"

    if any(word in text for word in [
        "python", "java", "javascript", "typescript", "react", "node.js",
        "aws", "azure", "google cloud", "docker", "kubernetes",
        "cybersecurity", "technical support", "help desk", "software engineering"
    ]):
        return "Technology"

    if any(word in text for word in [
        "sql", "machine learning", "artificial intelligence",
        "data analysis", "data engineering", "business intelligence",
        "tableau", "power bi", "database administration"
    ]):
        return "Data & Analytics"

    if any(word in text for word in [
        "accounting", "finance", "financial analyst", "payroll", "bookkeeping"
    ]):
        return "Business & Finance"

    if any(word in text for word in [
        "sales", "marketing", "account executive", "business development"
    ]):
        return "Sales & Marketing"

    if any(word in text for word in [
        "nursing", "nurse", "healthcare", "patient care", "medical assistant"
    ]):
        return "Healthcare"

    if any(word in text for word in [
        "teaching", "teacher", "instructor", "curriculum", "lesson planning"
    ]):
        return "Education"

    if any(word in text for word in [
        "project management", "operations", "logistics", "supply chain", "procurement"
    ]):
        return "Operations & Logistics"

    if any(word in text for word in [
        "construction", "electrical", "plumbing", "hvac", "maintenance",
        "welding", "manufacturing", "warehouse", "cdl"
    ]):
        return "Skilled Trades & Manufacturing"

    if any(word in text for word in [
        "customer service", "administrative support", "office management",
        "data entry", "calendar management", "scheduling"
    ]):
        return "Customer Support & Administration"

    if any(word in text for word in [
        "scientist", "laboratory", "lab", "matlab", "sas", "spss"
    ]):
        return "Science & Research"

    return "Other"


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
all_categories = get_all_categories()
now = datetime.now(UTC).isoformat()
unique_jobs = {}

for state in states_to_track:
    raw_jobs = fetch_jobs_by_category(state, all_categories)

    for job in raw_jobs:
        title = (job.get("title") or "").strip()
        company = (job.get("company", {}).get("display_name") or "Unknown").strip()
        raw_url = job.get("redirect_url", "")
        url = normalize_job_url(raw_url)

        if not title or not url:
            continue

        key = (title.lower(), company.lower(), url)

        if key in unique_jobs:
            continue

        description = job.get("description", "")
        if len(description) < 50:
            continue

        city = extract_city(job.get("location", {}).get("area", []), state)
        category = job.get("category", {}).get("label", "")
        skills = extract_skills(title, description, category)
        cluster = determine_career_cluster(title, description, category, skills)

        unique_jobs[key] = {
            "title": title,
            "company_name": company,
            "location_city": city,
            "state_source": state,
            "description": description,
            "job_url": url,
            "category": category,
            "job_type": determine_job_type(job),
            "skills": skills,
            "career_cluster": cluster,
            "salary_min": job.get("salary_min"),
            "salary_max": job.get("salary_max"),
            "created": job.get("created"),
            "last_seen": now
        }

career_records = list(unique_jobs.values())
total_records = len(career_records)
print(f"Total unique records to process: {total_records}")

if total_records >= 10:
    print("Starting batch upload to Supabase...")

    for i in range(0, total_records, 500):
        batch = career_records[i:i + 500]
        supabase.table("careers").upsert(
            batch,
            on_conflict="title,company_name,job_url"
        ).execute()
        print(f"  Uploaded batch {i // 500 + 1} ({i + len(batch)}/{total_records})")

    cutoff = (datetime.now(UTC) - timedelta(days=2)).isoformat()
    old_rows = supabase.table("careers").select("id").lt("last_seen", cutoff).execute().data
    ids_to_delete = [row["id"] for row in old_rows]

    if ids_to_delete:
        print(f"Found {len(ids_to_delete)} stale jobs. Cleaning up...")
        for i in range(0, len(ids_to_delete), 500):
            sub_ids = ids_to_delete[i:i + 500]
            supabase.table("careers").delete().in_("id", sub_ids).execute()
        print("Cleanup complete.")
else:
    print("Skipping upload and cleanup: Insufficient data found (Possible API issue).")