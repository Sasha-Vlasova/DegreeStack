import requests
import hashlib

URL = "https://www.wisconsin.edu/wp-json/uws-program-finder/v1/programs"

def normalize_title(title):
    return title.lower().replace("&", "and").strip()

def make_id(p):
    key = f"{normalize_title(p['title'])}-{p['program_level']}-{p['program_type']}"
    return hashlib.md5(key.encode()).hexdigest()

def fetch_data():
    response = requests.get(URL)
    response.raise_for_status()
    return response.json()["data"]

def transform(programs):
    merged = {}

    for p in programs:
        key = (
            normalize_title(p["title"]),
            p["program_level"],
            p["program_type"]
        )

        if key not in merged:
            merged[key] = {
                "id": make_id(p),
                "title": p["title"],
                "program_level": p["program_level"],
                "program_type": p["program_type"],
                "delivery": p["course_delivery"],
                "campuses": set(p["campuses"])
            }
        else:
            merged[key]["campuses"].update(p["campuses"])

    # convert sets → lists
    return [
        {
            **p,
            "campuses": list(p["campuses"])
        }
        for p in merged.values()
    ]

def main():
    raw = fetch_data()
    cleaned = transform(raw)

    print(f"Fetched {len(raw)} rows")
    print(f"Cleaned to {len(cleaned)} unique programs\n")

    for p in cleaned[:10]:
        print(p["title"], p["campuses"])

if __name__ == "__main__":
    main()