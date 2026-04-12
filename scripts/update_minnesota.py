import os
import requests
from datetime import datetime, timedelta, UTC
from concurrent.futures import ThreadPoolExecutor, as_completed
from supabase import create_client, Client
from rapidfuzz import fuzz
import re

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("SUPABASE_URL or SUPABASE_KEY not set.")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# =========================
# NORMALIZE (for fuzzy match)
# =========================
def normalize(text):
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def validate_single_url(url):
    if not url:
        return url, False
    try:
        r = requests.head(url, allow_redirects=True, timeout=5)
        if r.status_code >= 400:
            r = requests.get(url, allow_redirects=True, timeout=5)
        return url, r.status_code == 200
    except requests.RequestException:
        return url, False


def validate_urls_parallel(urls, max_workers=20):
    urls = list(set([u for u in urls if u]))
    results = {}
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = {ex.submit(validate_single_url, u): u for u in urls}
        for f in as_completed(futures):
            url, valid = f.result()
            results[url] = valid
    return results


# =========================
# WISCONSIN DATA (FOR FUZZY CLUSTERS)
# =========================
wisconsin = supabase.table("programs") \
    .select("title,program_level,career_clusters") \
    .eq("state_source", "Wisconsin") \
    .execute().data


wisconsin_index = [
    {
        "title": p.get("title") or "",
        "level": p.get("program_level") or "",
        "title_norm": normalize(p.get("title")),
        "career_clusters": p.get("career_clusters") or []
    }
    for p in wisconsin
]


def get_best_cluster(title, level):
    title_n = normalize(title)
    best_score = 0
    best_clusters = []

    for w in wisconsin_index:
        if w["level"] != level:
            continue

        score = fuzz.token_set_ratio(title_n, w["title_norm"])

        # boost if partial match
        if title_n in w["title_norm"] or w["title_norm"] in title_n:
            score += 10

        if score > best_score:
            best_score = score
            best_clusters = w["career_clusters"]

    # threshold (you can tune this)
    if best_score >= 78:
        return best_clusters

    return []


# =========================
# MINNESOTA API
# =========================
url = "https://eservices.minnstate.edu/program-web-srvc/programs/search"

payload = {
    "keywords": "",
    "subCategories": [
        "483","471","472","473","474","476","477","478","480","482",
        "211","212","213","214","216","224","217","218","219","220",
        "222","443","225","226","232","227","373","229","2402","230",
        "231","233","234","235","236","237","245","1200","238","239",
        "241","242","243","246","247","249","250","251","282","252",
        "253","254","255","2202","257","258","259","260","261","262",
        "248","264","265","263","266","267","268","270","271","273",
        "274","275","276","277","278","279","256","281","200","201",
        "202","203","601","205","207","209","206","283","284","2610",
        "285","286","288","289","290","291","292","293","294","2609",
        "295","296","303","1402","304","297","298","602","301","302",
        "305","307","308","309","310","311","313","600","314","330",
        "316","317","318","306","319","320","321","3002","322","323",
        "324","325","326","327","350","328","329","331","332","335",
        "336","351","333","337","800","334","338","340","341","342",
        "343","344","346","347","348","349","352","353","228","355",
        "356","357","358","359","360","354","361","362","363","364",
        "365","1001","366","367","368","369","370","371","372","374",
        "375","377","378","379","380","381","382","383","384","385",
        "386","387","388","2622","391","392","393","394","395","397",
        "398","399","449","400","401","403","404","405","406","407",
        "408","409","410","419","411","413","414","415","416","417",
        "418","420","421","422","423","424","425","427","428","429",
        "430","431","1000","433","434","435","436","438","439","441",
        "442","445","446","447","448","451","450","452","2635","453",
        "454","455","456","457","1400","460"
    ]
}

headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "x-mnstate-client": "education-search-components/1.0.29"
}

response = requests.post(url, json=payload, headers=headers)
response.raise_for_status()

programs = response.json()

raw_urls = [p.get("programUrl") for p in programs if p.get("programUrl")]
validated = validate_urls_parallel(raw_urls)

clean = []

for p in programs:
    level = p.get("award")
    if not level:
        continue

    level = level.lower()
    if "master" in level:
        level = "Masters"
    elif "doctor" in level:
        level = "Doctorate"
    elif "specialist" in level:
        level = "Education Specialist"
    elif "post" in level:
        level = "Post Bachelors"
    elif "certificate" in level:
        level = "Certificate"
    else:
        continue

    locations = p.get("locations") or []
    if not locations:
        continue

    campuses = []
    for loc in locations:
        if loc and loc.strip():
            campuses.append({
                "code": p.get("rcId"),
                "name": loc.strip()
            })

    if not campuses:
        continue

    raw_url = p.get("programUrl")
    program_url = raw_url if validated.get(raw_url, False) else ""

    # ✅ THIS IS THE ONLY NEW FEATURE YOU WANTED
    clusters = get_best_cluster(p.get("programName"), level)

    clean.append({
        "title": p.get("programName"),
        "program_level": level,
        "course_delivery": p.get("deliveryMode"),
        "program_type": p.get("degreeCode"),
        "keywords": p.get("catalogDesc"),
        "program_url": program_url,
        "campuses": campuses,
        "career_clusters": clusters,
        "state_source": "Minnesota"
    })


unique = {
    (p["title"], p["program_level"], p["program_url"], p["state_source"]): p
    for p in clean
}

now = datetime.now(UTC).isoformat()

records = [
    {
        "title": p["title"],
        "program_level": p["program_level"],
        "course_delivery": p["course_delivery"],
        "program_type": p["program_type"],
        "career_clusters": p["career_clusters"],
        "submajors": [],
        "keywords": p["keywords"],
        "program_url": p["program_url"],
        "last_seen": now,
        "state_source": "Minnesota"
    }
    for p in unique.values()
]

supabase.table("programs").upsert(
    records,
    on_conflict="title,program_level,program_url,state_source"
).execute()

print("Minnesota update complete")