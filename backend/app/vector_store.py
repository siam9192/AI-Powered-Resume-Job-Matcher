import json
from pathlib import Path
from typing import Any
from app.chromadb import job_collection as collection

BASE_DIR = Path(__file__).resolve().parent.parent


def format_location(job: dict[str, Any]) -> str:
    location = job["location"]
    place = ", ".join(
        value for value in (location.get("city"), location.get("country")) if value
    ) or "Not specified"
    work_mode = "Remote" if location.get("isRemote", False) else "On-site"
    return f"{place} ({work_mode})"


def format_salary(job: dict[str, Any]) -> str:
    salary = job.get("salary")
    if not salary:
        return "Not specified"

    minimum = salary.get("min", "Not specified")
    maximum = salary.get("max", "Not specified")
    return (
        f"{minimum}-{maximum} {salary['currency']} "
        f"{salary['period']}"
        f"{' (negotiable)' if salary.get('isNegotiable', False) else ''}"
    )


def initialize_jobs_collection():
    with (BASE_DIR / "data.json").open("r", encoding="utf-8") as file:
        jobs = json.load(file)

    jobs_by_id = {}
    for job in jobs:
        job_id = job["id"]
        if job_id in jobs_by_id and jobs_by_id[job_id] != job:
            raise ValueError(f"Conflicting job records share ID {job_id!r}")
        jobs_by_id[job_id] = job
    jobs = list(jobs_by_id.values())

    existing_ids = collection.get(include=[])["ids"]
    if existing_ids:
        collection.delete(ids=existing_ids)

    collection.add(
        ids=[job["id"] for job in jobs],
        documents=[
            (
                f"Title: {job['title']}\n"
                f"Company: {job['company']['name']}\n"
                f"Description: {job['description']}\n"
                f"Eligible candidate types: {', '.join(job['eligibleCandidateTypes'])}\n"
                f"Experience: {job['experience']['minYears']}-"
                f"{job['experience']['maxYears']} years\n"
                f"Candidate levels: {', '.join(job['candidateLevels'])}\n"
                f"Location: {format_location(job)}\n"
                f"Salary: {format_salary(job)}"
            )
            for job in jobs
        ],
        metadatas=[
            {
                "title": job["title"],
                "company": job["company"]["name"],
                "location": format_location(job),
                "salary": format_salary(job),
                "candidateLevels": ", ".join(job["candidateLevels"]),
                "eligibleCandidateTypes": job["eligibleCandidateTypes"],
                "isRemote": job["location"]["isRemote"],
                "minYears": job["experience"]["minYears"],
                "maxYears": job["experience"]["maxYears"],
            }
            for job in jobs
        ],
    )
    return collection
