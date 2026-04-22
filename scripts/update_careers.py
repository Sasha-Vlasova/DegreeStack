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
        response = requests.get(url, params=params, timeout=20)
        response.raise_for_status()
        return [c["tag"] for c in response.json().get("results", [])]
    except:
        return ["it-jobs", "engineering-jobs", "teaching-jobs"]

def determine_job_type(j):
    title = j.get("title", "").lower()
    desc = j.get("description", "").lower()
    intern_keywords = [r"\bintern\b", r"\binternship\b", r"\binternships\b"]
    is_internship = any(
        re.search(pattern, title) or re.search(pattern, desc[:500])
        for pattern in intern_keywords
    )

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

def clean_skill_name(skill):
    skill = skill.strip()
    skill = re.sub(r"\s+", " ", skill)

    replacements = {
        "Node.Js": "Node.js",
        "Next.Js": "Next.js",
        "Vue.Js": "Vue.js",
        "Express.Js": "Express.js",
        "Javascript": "JavaScript",
        "Typescript": "TypeScript",
        "Aws": "AWS",
        "Sql": "SQL",
        "Css": "CSS",
        "Html": "HTML",
        "Api": "API",
        "Apis": "APIs",
        "Ui Ux": "UI/UX",
        "Nosql": "NoSQL",
        "Ci Cd": "CI/CD",
        "Crm": "CRM",
        "Erp": "ERP",
        "Seo": "SEO",
        "Sem": "SEM",
        "Ppc": "PPC",
        "Cdl Driving": "CDL Driving",
        "Rn": "RN",
        "Lpn": "LPN",
        "Cna": "CNA",
        "Ehr": "EHR",
        "Emr": "EMR",
        "Saas": "SaaS",
        "Kpis": "KPIs",
        "Kubernetes": "Kubernetes"
    }

    titled = skill.title()
    return replacements.get(titled, titled)

def extract_skills(text):
    if not text:
        return []

    text = text.lower()

    skill_patterns = {
        "Python": [r"\bpython\b"],
        "SQL": [r"\bsql\b"],
        "Java": [r"\bjava\b"],
        "JavaScript": [r"\bjavascript\b", r"\bjs\b"],
        "TypeScript": [r"\btypescript\b", r"\bts\b"],
        "C++": [r"\bc\+\+\b"],
        "C#": [r"\bc#\b", r"\bc sharp\b"],
        "PHP": [r"\bphp\b"],
        "Ruby": [r"\bruby\b"],
        "Go": [r"\bgolang\b", r"\bgo\b"],
        "Rust": [r"\brust\b"],
        "Swift": [r"\bswift\b"],
        "Kotlin": [r"\bkotlin\b"],
        "R": [r"\br\b programming", r"\br language\b"],
        "MATLAB": [r"\bmatlab\b"],
        "SAS": [r"\bsas\b"],
        "SPSS": [r"\bspss\b"],

        "React": [r"\breact\b"],
        "Node.js": [r"\bnode\.?js\b"],
        "Next.js": [r"\bnext\.?js\b"],
        "Vue.js": [r"\bvue\.?js\b"],
        "Angular": [r"\bangular\b"],
        "Express.js": [r"\bexpress\.?js\b"],
        "HTML": [r"\bhtml\b", r"\bhtml5\b"],
        "CSS": [r"\bcss\b", r"\bcss3\b"],
        "Tailwind CSS": [r"\btailwind\b"],
        "Bootstrap": [r"\bbootstrap\b"],

        "REST APIs": [r"\brest api\b", r"\brestful api\b"],
        "GraphQL": [r"\bgraphql\b"],
        "Microservices": [r"\bmicroservices\b"],
        "Git": [r"\bgit\b"],
        "GitHub": [r"\bgithub\b"],
        "GitLab": [r"\bgitlab\b"],
        "CI/CD": [r"\bci/cd\b", r"\bcontinuous integration\b", r"\bcontinuous delivery\b"],
        "Docker": [r"\bdocker\b"],
        "Kubernetes": [r"\bkubernetes\b", r"\bk8s\b"],
        "Terraform": [r"\bterraform\b"],
        "Linux": [r"\blinux\b"],
        "Bash": [r"\bbash\b", r"\bshell scripting\b"],
        "PowerShell": [r"\bpowershell\b"],
        "Agile": [r"\bagile\b"],
        "Scrum": [r"\bscrum\b"],
        "DevOps": [r"\bdevops\b"],

        "AWS": [r"\baws\b", r"\bamazon web services\b"],
        "Azure": [r"\bazure\b"],
        "Google Cloud": [r"\bgcp\b", r"\bgoogle cloud\b"],
        "Snowflake": [r"\bsnowflake\b"],
        "Databricks": [r"\bdatabricks\b"],
        "Hadoop": [r"\bhadoop\b"],
        "Spark": [r"\bspark\b"],
        "ETL": [r"\betl\b"],
        "Data Warehousing": [r"\bdata warehouse\b", r"\bdata warehousing\b"],
        "NoSQL": [r"\bnosql\b", r"\bmongodb\b", r"\bcassandra\b"],
        "PostgreSQL": [r"\bpostgresql\b", r"\bpostgres\b"],
        "MySQL": [r"\bmysql\b"],
        "Tableau": [r"\btableau\b"],
        "Power BI": [r"\bpower bi\b"],
        "Excel": [r"\bexcel\b"],
        "Data Analysis": [r"\bdata analysis\b", r"\banalytical skills\b"],
        "Data Visualization": [r"\bdata visualization\b"],
        "Machine Learning": [r"\bmachine learning\b", r"\bml\b"],
        "Deep Learning": [r"\bdeep learning\b"],
        "Artificial Intelligence": [r"\bartificial intelligence\b", r"\bai\b"],
        "Statistics": [r"\bstatistics\b", r"\bstatistical\b"],

        "Microsoft Office": [r"\bmicrosoft office\b", r"\bms office\b"],
        "Word": [r"\bmicrosoft word\b", r"\bword\b"],
        "PowerPoint": [r"\bpowerpoint\b"],
        "Outlook": [r"\boutlook\b"],
        "Data Entry": [r"\bdata entry\b"],
        "Typing": [r"\btyping\b"],
        "Scheduling": [r"\bscheduling\b"],
        "Calendar Management": [r"\bcalendar management\b"],
        "Administrative Support": [r"\badministrative support\b"],
        "Office Management": [r"\boffice management\b"],
        "Documentation": [r"\bdocumentation\b"],
        "Record Keeping": [r"\brecord keeping\b"],

        "Customer Service": [r"\bcustomer service\b"],
        "Sales": [r"\bsales\b"],
        "Marketing": [r"\bmarketing\b"],
        "Digital Marketing": [r"\bdigital marketing\b"],
        "SEO": [r"\bseo\b"],
        "SEM": [r"\bsem\b"],
        "PPC": [r"\bppc\b"],
        "Social Media Marketing": [r"\bsocial media marketing\b"],
        "Content Creation": [r"\bcontent creation\b"],
        "Email Marketing": [r"\bemail marketing\b"],
        "CRM": [r"\bcrm\b", r"\bsalesforce\b", r"\bhubspot\b"],
        "Account Management": [r"\baccount management\b"],
        "Business Development": [r"\bbusiness development\b"],
        "Lead Generation": [r"\blead generation\b"],
        "Negotiation": [r"\bnegotiation\b"],
        "Retail": [r"\bretail\b"],
        "Merchandising": [r"\bmerchandising\b"],

        "Project Management": [r"\bproject management\b", r"\bpmp\b"],
        "Program Management": [r"\bprogram management\b"],
        "Operations Management": [r"\boperations management\b"],
        "Supply Chain": [r"\bsupply chain\b"],
        "Logistics": [r"\blogistics\b"],
        "Procurement": [r"\bprocurement\b"],
        "Inventory Management": [r"\binventory management\b"],
        "Quality Assurance": [r"\bquality assurance\b", r"\bqa\b"],
        "Risk Management": [r"\brisk management\b"],
        "Process Improvement": [r"\bprocess improvement\b"],
        "Lean": [r"\blean\b"],
        "Six Sigma": [r"\bsix sigma\b"],
        "ERP": [r"\berp\b"],
        "SAP": [r"\bsap\b"],

        "Accounting": [r"\baccounting\b"],
        "Finance": [r"\bfinance\b"],
        "Bookkeeping": [r"\bbookkeeping\b"],
        "Financial Analysis": [r"\bfinancial analysis\b"],
        "Forecasting": [r"\bforecasting\b"],
        "Budgeting": [r"\bbudgeting\b", r"\bbudgets\b"],
        "Auditing": [r"\bauditing\b"],
        "Tax Preparation": [r"\btax preparation\b"],
        "Accounts Payable": [r"\baccounts payable\b"],
        "Accounts Receivable": [r"\baccounts receivable\b"],
        "Payroll": [r"\bpayroll\b"],

        "Patient Care": [r"\bpatient care\b"],
        "Nursing": [r"\bnursing\b", r"\bnurse\b"],
        "RN": [r"\brn\b", r"\bregistered nurse\b"],
        "LPN": [r"\blpn\b", r"\blicensed practical nurse\b"],
        "CNA": [r"\bcna\b", r"\bcertified nursing assistant\b"],
        "Medical Assistant": [r"\bmedical assistant\b"],
        "Healthcare": [r"\bhealthcare\b"],
        "Phlebotomy": [r"\bphlebotomy\b"],
        "Vital Signs": [r"\bvital signs\b"],
        "Medication Administration": [r"\bmedication administration\b"],
        "CPR": [r"\bcpr\b"],
        "BLS": [r"\bbls\b"],
        "EHR": [r"\behr\b"],
        "EMR": [r"\bemr\b"],
        "Clinical Documentation": [r"\bclinical documentation\b"],
        "HIPAA": [r"\bhipaa\b"],
        "Care Coordination": [r"\bcare coordination\b"],

        "Teaching": [r"\bteaching\b", r"\bteacher\b"],
        "Classroom Management": [r"\bclassroom management\b", r"\bclassroom\b"],
        "Curriculum Development": [r"\bcurriculum development\b", r"\bcurriculum\b"],
        "Lesson Planning": [r"\blesson planning\b"],
        "Student Engagement": [r"\bstudent engagement\b"],
        "Special Education": [r"\bspecial education\b"],
        "Childcare": [r"\bchildcare\b", r"\bchild care\b"],
        "Tutoring": [r"\btutoring\b"],
        "Academic Advising": [r"\bacademic advising\b"],
        "Instructional Design": [r"\binstructional design\b"],

        "Construction": [r"\bconstruction\b"],
        "Electrical": [r"\belectrician\b", r"\belectrical\b"],
        "Plumbing": [r"\bplumbing\b", r"\bplumber\b"],
        "HVAC": [r"\bhvac\b"],
        "Maintenance": [r"\bmaintenance\b"],
        "Welding": [r"\bwelding\b"],
        "Carpentry": [r"\bcarpentry\b", r"\bcarpenter\b"],
        "Forklift Operation": [r"\bforklift\b"],
        "Machinery Operation": [r"\bmachinery\b", r"\bequipment operation\b"],
        "Preventive Maintenance": [r"\bpreventive maintenance\b"],
        "Manufacturing": [r"\bmanufacturing\b"],
        "Blueprint Reading": [r"\bblueprint reading\b", r"\bblueprints\b"],
        "CDL Driving": [r"\bcdl\b", r"\btruck driver\b", r"\bcommercial driver\b"],
        "Warehouse Operations": [r"\bwarehouse\b"],
        "Safety Compliance": [r"\bsafety compliance\b", r"\bosha\b"],

        "Communication": [r"\bcommunication\b"],
        "Leadership": [r"\bleadership\b"],
        "Teamwork": [r"\bteamwork\b", r"\bteam player\b", r"\bcollaboration\b"],
        "Problem Solving": [r"\bproblem solving\b"],
        "Time Management": [r"\btime management\b"],
        "Organization": [r"\borganizational skills\b", r"\borganization\b"],
        "Attention to Detail": [r"\battention to detail\b", r"\bdetail-oriented\b", r"\bdetail oriented\b"],
        "Multitasking": [r"\bmultitasking\b"],
        "Adaptability": [r"\badaptability\b", r"\badaptable\b"],
        "Critical Thinking": [r"\bcritical thinking\b"],
        "Interpersonal Skills": [r"\binterpersonal skills\b"],
        "Presentation Skills": [r"\bpresentation skills\b", r"\bpresenting\b"],
        "Writing": [r"\bwriting\b", r"\bwritten communication\b"],
        "Research": [r"\bresearch\b"],
        "Stakeholder Management": [r"\bstakeholder management\b"],
        "Cross-Functional Collaboration": [r"\bcross-functional\b", r"\bcross functional\b"]
    }

    found_skills = set()

    for skill, patterns in skill_patterns.items():
        for pattern in patterns:
            if re.search(pattern, text):
                found_skills.add(clean_skill_name(skill))
                break

    preferred_order = [
        "Python", "SQL", "Java", "JavaScript", "TypeScript", "React", "Node.js",
        "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Machine Learning",
        "Data Analysis", "Excel", "Project Management", "Customer Service",
        "Accounting", "Finance", "Nursing", "Teaching", "Communication",
        "Leadership", "Problem Solving", "Time Management"
    ]

    ordered = []
    used = set()

    for skill in preferred_order:
        if skill in found_skills:
            ordered.append(skill)
            used.add(skill)

    remaining = sorted([skill for skill in found_skills if skill not in used])
    final_skills = ordered + remaining

    return final_skills[:20]

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

            combined_text = f"{title}\n{description}"

            unique_batch[key] = {
                "title": title,
                "company_name": company,
                "location_city": city,
                "state_source": state,
                "description": description,
                "job_url": url,
                "category": j.get("category", {}).get("label", ""),
                "job_type": determine_job_type(j),
                "skills": extract_skills(combined_text),
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
        batch = career_records[i:i + 500]
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
            sub_ids = ids_to_delete[i:i + 500]
            supabase.table("careers").delete().in_("id", sub_ids).execute()
        print("Cleanup complete.")
else:
    print("Skipping upload and cleanup: Insufficient data found (Possible API issue).")