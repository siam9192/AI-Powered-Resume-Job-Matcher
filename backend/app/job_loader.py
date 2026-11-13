import json
from pathlib import Path

def initialize_jobs_db() -> dict[str, int | str]:
    from .database import SessionLocal, _job_to_orm

    with (Path(__file__).resolve().parent.parent / "data.json").open(
        "r", encoding="utf-8"
    ) as file:
        jobs = json.load(file)

    if not isinstance(jobs, list):
        raise ValueError("data.json must contain a list of jobs.")

    jobs_by_id = {}
    for job in jobs:
        job_id = job.get("id")
        if not job_id:
            raise ValueError("Each job in data.json must have an ID.")
        if job_id in jobs_by_id and jobs_by_id[job_id] != job:
            raise ValueError(f"Conflicting job records share ID {job_id!r}")
        jobs_by_id[job_id] = job

    with SessionLocal.begin() as session:
        for job in jobs_by_id.values():
            session.merge(_job_to_orm(job))

    return {"status": "seeded", "jobs_seeded": len(jobs_by_id)}