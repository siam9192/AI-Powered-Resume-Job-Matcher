from database import get_db,JobORM

def run():
    with get_db() as db:
        jobs = db.query(JobORM).all()

        for job in jobs:
            print(job.id, job.title, job.description)

        return jobs
run()