from typing import Any

from pydantic import BaseModel, Field


class CandidateExperience(BaseModel):
    positionName: str | None = None
    level: str | None = None
    skills: list[str] = Field(default_factory=list)
    years: float = 0.0


class CandidateEducation(BaseModel):
    degree: str | None = None
    institution: str | None = None
    fieldOfStudy: str | None = None
    graduationYear: int | None = None


class CandidateProfile(BaseModel):
    fullName: str | None = None
    email: str | None = None
    title: str | None = None
    summary: str | None = None
    applicableTypes: list[str] = Field(default_factory=list)
    preferredLocations: list[str] = Field(default_factory=list)
    isOpenToRemote: bool = False
    experiences: list[CandidateExperience] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    educations: list[CandidateEducation] = Field(default_factory=list)
    expectedSalary: dict[str, Any] | None = None
