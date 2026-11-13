import json
from pathlib import Path
from contextlib import contextmanager
from sqlalchemy import JSON, Boolean, Column, Float, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_URL = f"sqlite:///{(BASE_DIR / 'jobs.db').as_posix()}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class JobORM(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    company_name = Column(String, nullable=False)
    company_logo = Column(String, nullable=True)
    company_website = Column(String, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    is_remote = Column(Boolean, default=False)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    salary_currency = Column(String, nullable=True)
    salary_period = Column(String, nullable=True)
    is_negotiable = Column(Boolean, default=False)
    allow_fresher = Column(Boolean, default=False)
    experience_min_years = Column(Integer, default=0)
    experience_max_years = Column(Integer, default=0)
    eligible_candidate_types = Column(JSON, default=list)
    candidate_levels = Column(JSON, default=list)
    skills = Column(JSON, default=list)
    educations = Column(JSON, default=list)
    application_url = Column(String, nullable=True)
    application_deadline = Column(String, nullable=True)
    posted_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=True)


Base.metadata.create_all(bind=engine)


def _job_to_orm(job: dict):
    return JobORM(
        id=job["id"],
        title=job["title"],
        description=job.get("description", ""),
        company_name=job["company"]["name"],
        company_logo=job["company"].get("logo"),
        company_website=job["company"].get("website"),
        city=job["location"].get("city"),
        country=job["location"].get("country"),
        is_remote=bool(job["location"].get("isRemote", False)),
        salary_min=(job.get("salary") or {}).get("min"),
        salary_max=(job.get("salary") or {}).get("max"),
        salary_currency=(job.get("salary") or {}).get("currency"),
        salary_period=(job.get("salary") or {}).get("period"),
        is_negotiable=bool(
            (job.get("salary") or {}).get("isNegotiable", False)),
        allow_fresher=bool(
            job.get("experience", {}).get("allowFresher", False)),
        experience_min_years=job.get("experience", {}).get("minYears", 0),
        experience_max_years=job.get("experience", {}).get("maxYears", 0),
        eligible_candidate_types=job.get("eligibleCandidateTypes", []),
        candidate_levels=job.get("candidateLevels", []),
        skills=job.get("skills", []),
        educations=job.get("educations", []),
        application_url=job.get("applicationUrl"),
        application_deadline=job.get("applicationDeadline"),
        posted_at=job.get("postedAt"),
        updated_at=job.get("updatedAt"),
    )


def seed_jobs_from_json():
    from sqlalchemy import select

    with SessionLocal() as session:
        existing = session.execute(select(JobORM.id)).first()
        if existing:
            return

        with (BASE_DIR / "data.json").open("r", encoding="utf-8") as file:
            jobs = json.load(file)

        for job in jobs:
            session.add(_job_to_orm(job))
        session.commit()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
