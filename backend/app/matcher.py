import re


LEVEL_ORDER = {
    "fresher": 1,
    "junior": 2,
    "mid-level": 3,
    "senior": 4,
    "expert": 5,
}

DEGREE_ORDER = {
    "below ssc": 1,
    "ssc": 2,
    "hsc": 3,
    "diploma": 4,
    "associate degree": 5,
    "bachelor's degree": 6,
    "bachelor degree": 6,
    "master's degree": 7,
    "master degree": 7,
    "phd": 8,
}


def _get(obj, key, default=None):
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def _normalize_text(value):
    if value is None:
        return ""
    return str(value).strip().lower()


def _as_string_list(values):
    if values is None:
        return []
    if isinstance(values, (str, bytes)):
        return [str(values)]
    return [str(item) for item in values]


def _normalize_skill(skill):
    text = _normalize_text(skill)
    text = re.sub(r"[^a-z0-9+]+", " ", text)
    return " ".join(text.split())


def _get_highest_level(candidate):
    experiences = _get(candidate, "experiences", [])
    highest = None
    for entry in experiences:
        if not isinstance(entry, dict):
            continue
        level = _normalize_text(_get(entry, "level", ""))
        if not level:
            continue
        rank = LEVEL_ORDER.get(level)
        if rank is None:
            continue
        if highest is None or rank > LEVEL_ORDER.get(highest, -1):
            highest = level
    return highest


def _get_total_experience_years(candidate):
    experience_entries = _get(candidate, "experiences", [])
    years = 0.0
    for entry in experience_entries:
        if not isinstance(entry, dict):
            continue
        value = _get(entry, "years", 0) or 0
        try:
            years += float(value)
        except (TypeError, ValueError):
            pass
    return years


def _extract_degree_rank(value):
    if value is None:
        return -1
    text = _normalize_text(value)
    for degree_name, rank in DEGREE_ORDER.items():
        if degree_name in text:
            return rank
    return -1


def matchLocation(jobLocation, candidateLocations: list[str], isOpenToRemote: bool):
    if jobLocation is None:
        return True

    candidate = {_normalize_text(value) for value in _as_string_list(candidateLocations)}
    job_city = _normalize_text(_get(jobLocation, "city", ""))
    job_country = _normalize_text(_get(jobLocation, "country", ""))
    is_remote = bool(_get(jobLocation, "isRemote", False))

    if isOpenToRemote and is_remote:
        return True

    if not candidate and is_remote:
        return True

    return bool(job_city in candidate or job_country in candidate or "remote" in candidate)


def matchExperience(job, candidate):
    candidate_years = _get_total_experience_years(candidate)
    job_experience = _get(job, "experience", {})
    if not job_experience:
        return True

    min_years = float(_get(job_experience, "minYears", 0) or 0)
    max_years = float(_get(job_experience, "maxYears", 9999) or 9999)
    allow_fresher = bool(_get(job_experience, "allowFresher", False))

    if allow_fresher and candidate_years <= 1:
        return True

    return min_years <= candidate_years <= max_years


def matchCandidateLevel(jobCandidateLevels, candidateLevel):
    if not jobCandidateLevels:
        return True
    candidate_level = _normalize_text(candidateLevel)
    if not candidate_level:
        return True

    allowed_levels = {_normalize_text(level) for level in _as_string_list(jobCandidateLevels)}
    if candidate_level in allowed_levels:
        return True

    candidate_rank = LEVEL_ORDER.get(candidate_level, -1)
    if candidate_rank < 0:
        return False

    for level in allowed_levels:
        level_rank = LEVEL_ORDER.get(level)
        if level_rank is not None and level_rank >= candidate_rank:
            return True

    return False


def matchSalary(jobSalary, expectedSalary):
    if expectedSalary is None:
        return True
    if jobSalary is None:
        return True

    job_min = _get(jobSalary, "min")
    job_max = _get(jobSalary, "max")
    expected_min = _get(expectedSalary, "min")
    expected_max = _get(expectedSalary, "max")

    if job_min is None and job_max is None:
        return True

    if expected_min is not None and job_max is not None and expected_min > job_max:
        return False

    if expected_max is not None and job_min is not None and expected_max < job_min:
        return False

    return True


def matchSkills(jobSkills, candidateSkills, minMatches=1):
    job_set = {_normalize_skill(skill) for skill in _as_string_list(jobSkills)}
    candidate_set = {_normalize_skill(skill) for skill in _as_string_list(candidateSkills)}
    common_skills = sorted(job_set.intersection(candidate_set))
    return len(common_skills) >= minMatches, common_skills


def isUpperDegree(candidateDegree, jobDegree):
    if not candidateDegree or not jobDegree:
        return False

    candidate_rank = _extract_degree_rank(candidateDegree)
    job_rank = _extract_degree_rank(jobDegree)
    if candidate_rank < 0 or job_rank < 0:
        return False

    return candidate_rank >= job_rank


def calculateMatchingScoreWithSummary(job, candidate):
    weights = {
        "location": 15,
        "experience": 15,
        "level": 15,
        "skills": 35,
        "salary": 10,
        "education": 10,
    }
    summary = {}

    location_match = matchLocation(
        _get(job, "location", {}),
        _get(candidate, "preferredLocations", []),
        bool(_get(candidate, "isOpenToRemote", False)),
    )
    summary["location"] = {
        "matched": location_match,
        "score": weights["location"] if location_match else 0,
        "maxScore": weights["location"],
    }

    experience_match = matchExperience(job, candidate)
    summary["experience"] = {
        "matched": experience_match,
        "score": weights["experience"] if experience_match else 0,
        "maxScore": weights["experience"],
    }

    level_match = matchCandidateLevel(
        _get(job, "candidateLevels", []),
        _get_highest_level(candidate),
    )
    summary["candidateLevel"] = {
        "matched": level_match,
        "score": weights["level"] if level_match else 0,
        "maxScore": weights["level"],
    }

    has_skill_match, common_skills = matchSkills(
        _get(job, "skills", []),
        _get(candidate, "skills", []),
        minMatches=1,
    )
    skill_ratio = min(
        1.0,
        len(common_skills) / max(1, len(_as_string_list(_get(job, "skills", [])))),
    )
    skill_score = weights["skills"] * skill_ratio if has_skill_match else 0
    summary["skills"] = {
        "matched": has_skill_match,
        "matchedSkills": common_skills,
        "score": skill_score,
        "maxScore": weights["skills"],
    }

    salary_match = matchSalary(
        _get(job, "salary", None),
        _get(candidate, "expectedSalary", None),
    )
    summary["salary"] = {
        "matched": salary_match,
        "score": weights["salary"] if salary_match else 0,
        "maxScore": weights["salary"],
    }

    candidate_education = _get(candidate, "educations", [])
    job_education = _get(job, "education", "") or _get(job, "educations", [])
    if isinstance(job_education, list):
        job_degree = " or ".join(str(item) for item in job_education if item)
    else:
        job_degree = str(job_education)

    if isinstance(candidate_education, list) and candidate_education:
        candidate_degree = _get(candidate_education[0], "degree", "")
        education_match = isUpperDegree(candidate_degree, job_degree)
    else:
        education_match = False

    summary["education"] = {
        "matched": education_match,
        "score": weights["education"] if education_match else 0,
        "maxScore": weights["education"],
    }

    total = min(100, round(sum(item["score"] for item in summary.values())))
    return {
        "score": total,
        "summary": {
            **summary,
            "total": total,
            "maxScore": sum(weights.values()),
        },
    }


def calculateMatchingScore(job, candidate):
    return calculateMatchingScoreWithSummary(job, candidate)["score"]
