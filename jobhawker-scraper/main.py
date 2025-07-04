from fastapi import FastAPI, Query
from typing import List, Optional
import requests
from bs4 import BeautifulSoup
import os
import json

app = FastAPI()

# --- Helper: Normalize job data ---
def normalize_job(title, company, location, salary, type_, url, source):
    return {
        "title": title,
        "company": company,
        "location": location,
        "salary": salary,
        "type": type_,
        "url": url,
        "source": source,
    }

# --- Sample Indeed Scraper (basic, for demo) ---
def scrape_indeed(keyword: str, type_: str, min_salary: int, max_salary: int) -> List[dict]:
    jobs = []
    base_url = "https://www.indeed.com/jobs"
    params = {"q": keyword, "l": "", "remotejob": "1" if type_ == "remote" else ""}
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    resp = requests.get(base_url, params=params, headers=headers, timeout=10)
    soup = BeautifulSoup(resp.text, "html.parser")
    for card in soup.select(".job_seen_beacon"):
        title = card.select_one("h2.jobTitle span")
        company = card.select_one("span.companyName")
        location = card.select_one("div.companyLocation")
        salary = card.select_one("div.metadata.salary-snippet-container")
        url_tag = card.select_one("a")
        url = "https://www.indeed.com" + url_tag["href"] if url_tag and url_tag.has_attr("href") else ""
        jobs.append(normalize_job(
            title.text.strip() if title else "",
            company.text.strip() if company else "",
            location.text.strip() if location else "",
            salary.text.strip() if salary else None,
            type_,
            url,
            "indeed"
        ))
    return jobs

def mock_jobs(source, keyword, type_, min_salary, max_salary):
    return [
        normalize_job(
            f"{keyword.title() if keyword else 'Software'} Engineer at {source.title()}",
            f"{source.title()} Inc.",
            "Remote" if type_ == "remote" else "San Francisco, CA",
            f"${min_salary or 100000} - ${max_salary or 150000}",
            type_ or "remote",
            f"https://{source}.com/jobs/12345",
            source
        ),
        normalize_job(
            f"Senior {keyword.title() if keyword else 'Backend'} Developer at {source.title()}",
            f"{source.title()} Solutions",
            "New York, NY",
            f"${min_salary or 120000} - ${max_salary or 180000}",
            type_ or "onsite",
            f"https://{source}.com/jobs/67890",
            source
        )
    ]

def scrape_careerjet(keyword, location, type_, min_salary, max_salary, api_key):
    url = "https://public.api.careerjet.net/search"
    params = {
        "keywords": keyword,
        "location": location or "",
        "contracttype": type_ if type_ else "",
        "pagesize": 10,
        "affid": api_key
    }
    resp = requests.get(url, params=params, timeout=10)
    data = resp.json()
    jobs = []
    for job in data.get("jobs", []):
        jobs.append(normalize_job(
            job.get("title", ""),
            job.get("company", ""),
            job.get("locations", ""),
            job.get("salary", ""),
            type_ or "",
            job.get("url", ""),
            "careerjet"
        ))
    return jobs

# --- Monster Scraper (basic demo) ---
def scrape_monster(keyword: str, type_: str) -> List[dict]:
    jobs = []
    base_url = "https://www.monster.com/jobs/search/"
    params = {"q": keyword, "where": "", "jobid": ""}
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    resp = requests.get(base_url, params=params, headers=headers, timeout=10)
    soup = BeautifulSoup(resp.text, "html.parser")
    for card in soup.select("div.job-search-results-style__JobCardWrap-sc-30547e5b-4"):
        article = card.select_one("article[data-testid='JobCard']")
        if not article:
            continue
        title_tag = article.select_one("h3 a[data-testid='jobTitle']")
        title = title_tag.text.strip() if title_tag else ""
        url = title_tag['href'] if title_tag and title_tag.has_attr('href') else ""
        if url and url.startswith("//"):  # Monster uses protocol-relative URLs
            url = "https:" + url
        company_tag = article.select_one("span[data-testid='company']")
        company = company_tag.text.strip() if company_tag else ""
        location_tag = article.select_one("span[data-testid='jobDetailLocation']")
        location = location_tag.text.strip() if location_tag else ""
        jobs.append(normalize_job(
            title,
            company,
            location,
            None,
            type_,
            url,
            "monster"
        ))
    return jobs

# --- FlexJobs Scraper (basic demo) ---
def scrape_flexjobs(keyword: str, type_: str) -> List[dict]:
    jobs = []
    base_url = "https://www.flexjobs.com/search"
    params = {"search": keyword}
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    resp = requests.get(base_url, params=params, headers=headers, timeout=10)
    soup = BeautifulSoup(resp.text, "html.parser")
    for card in soup.select("li.job-listing"):  # May need to update selector
        title = card.select_one("a.job-link")
        company = card.select_one("div.company")
        location = card.select_one("span.location")
        url = title["href"] if title and title.has_attr("href") else ""
        jobs.append(normalize_job(
            title.text.strip() if title else "",
            company.text.strip() if company else "",
            location.text.strip() if location else "",
            None,
            type_,
            url,
            "flexjobs"
        ))
    return jobs

# --- ZipRecruiter Scraper (basic demo) ---
def scrape_ziprecruiter(keyword: str, type_: str) -> List[dict]:
    jobs = []
    base_url = "https://www.ziprecruiter.com/candidate/search"
    params = {"search": keyword}
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    resp = requests.get(base_url, params=params, headers=headers, timeout=10)
    soup = BeautifulSoup(resp.text, "html.parser")
    for card in soup.select("article.job_result"):  # May need to update selector
        title = card.select_one("a.job_title")
        company = card.select_one("a.company_name")
        location = card.select_one("span.location")
        url = title["href"] if title and title.has_attr("href") else ""
        jobs.append(normalize_job(
            title.text.strip() if title else "",
            company.text.strip() if company else "",
            location.text.strip() if location else "",
            None,
            type_,
            url,
            "ziprecruiter"
        ))
    return jobs

# --- CareerBuilder Scraper (basic demo) ---
def scrape_careerbuilder(keyword: str, type_: str) -> List[dict]:
    jobs = []
    base_url = "https://www.careerbuilder.com/jobs"
    params = {"keywords": keyword}
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    resp = requests.get(base_url, params=params, headers=headers, timeout=10)
    soup = BeautifulSoup(resp.text, "html.parser")
    for card in soup.select("div.data-results-content-parent"):  # May need to update selector
        title = card.select_one("h2 a")
        company = card.select_one("div.data-details span[data-test='job-company']")
        location = card.select_one("div.data-details span[data-test='job-location']")
        url = title["href"] if title and title.has_attr("href") else ""
        jobs.append(normalize_job(
            title.text.strip() if title else "",
            company.text.strip() if company else "",
            location.text.strip() if location else "",
            None,
            type_,
            url,
            "careerbuilder"
        ))
    return jobs

# --- USAJOBS API Integration ---
def scrape_usajobs(keyword: str, type_: str) -> list:
    # You need to register for a USAJOBS API key and provide your email
    # See: https://developer.usajobs.gov/API-Reference
    api_key = os.environ.get('USAJOBS_API_KEY', 'DEMO_KEY')  # Replace DEMO_KEY with your key
    user_email = os.environ.get('USAJOBS_USER_EMAIL', 'demo@example.com')
    url = 'https://data.usajobs.gov/api/search'
    headers = {
        'Host': 'data.usajobs.gov',
        'User-Agent': user_email,
        'Authorization-Key': api_key
    }
    params = {
        'Keyword': keyword,
        'ResultsPerPage': 10
    }
    resp = requests.get(url, headers=headers, params=params, timeout=10)
    jobs = []
    if resp.status_code == 200:
        data = resp.json()
        for job in data.get('SearchResult', {}).get('SearchResultItems', []):
            pos = job.get('MatchedObjectDescriptor', {})
            jobs.append(normalize_job(
                pos.get('PositionTitle', ''),
                pos.get('OrganizationName', ''),
                ', '.join([l.get('LocationName', '') for l in pos.get('PositionLocation', [])]),
                pos.get('PositionRemuneration', [{}])[0].get('MinimumRange', ''),
                type_,
                pos.get('PositionURI', ''),
                'usajobs'
            ))
    return jobs

# --- Jooble API Integration ---
def scrape_jooble(keyword: str, type_: str) -> list:
    # You need to register for a Jooble API key
    # See: https://jooble.org/api/about
    api_key = os.environ.get('JOOBLE_API_KEY', 'YOUR_JOOBLE_API_KEY')
    url = f'https://jooble.org/api/{api_key}'
    headers = {'Content-Type': 'application/json'}
    payload = {
        'keywords': keyword,
        'page': 1,
        'searchMode': 'open'
    }
    resp = requests.post(url, headers=headers, data=json.dumps(payload), timeout=10)
    jobs = []
    if resp.status_code == 200:
        data = resp.json()
        for job in data.get('jobs', []):
            jobs.append(normalize_job(
                job.get('title', ''),
                job.get('company', ''),
                job.get('location', ''),
                job.get('salary', ''),
                type_,
                job.get('link', ''),
                'jooble'
            ))
    return jobs

@app.get("/scrape-jobs")
def scrape_jobs(
    keyword: str = Query("", description="Job keyword/search term"),
    type: str = Query("", description="Job type: remote, onsite, hybrid"),
    min_salary: Optional[int] = Query(None),
    max_salary: Optional[int] = Query(None),
    source: str = Query("indeed", description="Comma-separated sources: indeed, linkedin, etc."),
    location: str = Query("", description="Job location")
):
    sources = [s.strip() for s in source.split(",") if s.strip()]
    all_jobs = []
    CAREERJET_API_KEY = "YOUR_CAREERJET_API_KEY"  # <-- Replace with your real key
    if "indeed" in sources:
        all_jobs.extend(scrape_indeed(keyword, type, min_salary or 0, max_salary or 0))
    if "careerjet" in sources:
        all_jobs.extend(scrape_careerjet(keyword, location, type, min_salary, max_salary, CAREERJET_API_KEY))
    if "monster" in sources:
        all_jobs.extend(scrape_monster(keyword, type))
    if "flexjobs" in sources:
        all_jobs.extend(scrape_flexjobs(keyword, type))
    if "ziprecruiter" in sources:
        all_jobs.extend(scrape_ziprecruiter(keyword, type))
    if "careerbuilder" in sources:
        all_jobs.extend(scrape_careerbuilder(keyword, type))
    if "jooble" in sources:
        all_jobs.extend(scrape_jooble(keyword, type))
    for s in sources:
        if s not in ["indeed", "careerjet", "monster", "flexjobs", "ziprecruiter", "careerbuilder", "jooble"]:
            all_jobs.extend(mock_jobs(s, keyword, type, min_salary, max_salary))
    # Filter by salary if needed
    if min_salary or max_salary:
        def salary_in_range(salary_str):
            try:
                if not salary_str: return False
                import re
                nums = [int(s.replace(",", "")) for s in re.findall(r"\d[\d,]*", salary_str)]
                if not nums: return False
                min_sal = min(nums)
                max_sal = max(nums)
                if min_salary and min_sal < min_salary: return False
                if max_salary and max_sal > max_salary: return False
                return True
            except: return False
        all_jobs = [job for job in all_jobs if salary_in_range(job["salary"])]
    return {"jobs": all_jobs} 