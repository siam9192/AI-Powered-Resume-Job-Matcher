from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Literal, Optional


class CandidateLevel(str, Enum):
    FRESHER = "fresher"
    JUNIOR = "junior"
    MID_LEVEL = "mid-level"
    SENIOR = "senior"
    EXPERT = "expert"


@dataclass
class Company:
    name: str
    logo: Optional[str] = None
    website: Optional[str] = None


@dataclass
class JobLocation:
    isRemote: bool
    city: Optional[str] = None
    country: Optional[str] = None


@dataclass
class Salary:
    currency: str
    period: Literal["hourly", "monthly", "yearly"]
    isNegotiable: bool
    min: Optional[float] = None
    max: Optional[float] = None


@dataclass
class JobExperience:
    allowFresher: bool
    minYears: int
    maxYears: int


@dataclass
class CandidateExperience:
    positionName: str
    level: CandidateLevel
    skills: list[str]
    years: int


@dataclass
class CandidateEducation:
    degree: str
    institution: str
    fieldOfStudy: Optional[str] = None
    graduationYear: Optional[int] = None


@dataclass
class ExpectedSalary:
    currency: str
    period: Literal["hourly", "monthly", "yearly"]
    min: Optional[float] = None
    max: Optional[float] = None


@dataclass
class Job:
    id: str
    title: str
    description: str
    company: Company
    location: JobLocation
    experience: JobExperience
    eligibleCandidateTypes: list[str]
    candidateLevels: list[CandidateLevel]
    skills: list[str]
    educations: list[str]
    postedAt: datetime
    salary: Optional[Salary] = None
    applicationUrl: Optional[str] = None
    applicationDeadline: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


@dataclass
class CandidateResume:
    id: str
    fullName: str
    email: str
    title: str
    applicableTypes: list[str]
    experiences: list[CandidateExperience]
    educations: list[CandidateEducation]
    isOpenToRemote: bool
    createdAt: datetime
    phone: Optional[str] = None
    profilePicture: Optional[str] = None
    summary: Optional[str] = None
    resumeUrl: Optional[str] = None
    portfolioUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    linkedinUrl: Optional[str] = None
    preferredLocations: Optional[list[str]] = None
    expectedSalary: Optional[ExpectedSalary] = None
    updatedAt: Optional[datetime] = None


__all__ = [
    "CandidateLevel",
    "Company",
    "JobLocation",
    "Salary",
    "JobExperience",
    "CandidateExperience",
    "CandidateEducation",
    "ExpectedSalary",
    "Job",
    "CandidateResume",
]
