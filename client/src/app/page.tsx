"use client";

import Link from "next/link";
import {
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiDollarSign,
  FiFileText,
  FiGlobe,
  FiMapPin,
  FiPlay,
  FiUploadCloud,
} from "react-icons/fi";
import { LuSparkles } from "react-icons/lu";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";

type MatchFactor = {
  matched?: boolean;
  score?: number;
  maxScore?: number;
  matchedSkills?: string[];
};

type MatchSummary = {
  total?: number;
  maxScore?: number;
  location?: MatchFactor;
  experience?: MatchFactor;
  candidateLevel?: MatchFactor;
  skills?: MatchFactor;
  salary?: MatchFactor;
  education?: MatchFactor;
};

type JobMatch = {
  job_id: string;
  title: string;
  company: string;
  companyWebsite?: string | null;
  description?: string | null;
  location?: {
    city?: string | null;
    country?: string | null;
    isRemote?: boolean;
  };
  salary?: {
    min?: number | null;
    max?: number | null;
    currency?: string | null;
    period?: string | null;
    isNegotiable?: boolean;
  };
  experience?: {
    allowFresher?: boolean;
    minYears?: number | null;
    maxYears?: number | null;
  };
  skills: string[];
  educations: string[];
  candidateLevels: string[];
  eligibleCandidateTypes: string[];
  applicationDeadline?: string | null;
  score: number;
  score_summary?: MatchSummary;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function criterionPercentage(factor?: MatchFactor) {
  if (
    factor?.score === undefined ||
    factor.maxScore === undefined ||
    factor.maxScore <= 0
  ) {
    return undefined;
  }
  return Math.round(
    Math.max(0, Math.min(1, factor.score / factor.maxScore)) * 100,
  );
}

function parseMatchFactor(value: unknown): MatchFactor | undefined {
  if (!isRecord(value)) return undefined;

  return {
    matched: typeof value.matched === "boolean" ? value.matched : undefined,
    score: finiteNumber(value.score),
    maxScore: finiteNumber(value.maxScore),
    matchedSkills: stringList(value.matchedSkills),
  };
}

function matchFactorDescription(label: string, factor?: MatchFactor) {
  if (!factor) return "The backend did not provide a score for this criterion.";

  if (label === "Skills") {
    const matchedSkills = factor.matchedSkills ?? [];
    if (matchedSkills.length > 0) {
      const visibleSkills = matchedSkills.slice(0, 3).join(", ");
      const extraCount = matchedSkills.length - 3;
      return `Matched: ${visibleSkills}${extraCount > 0 ? ` +${extraCount} more` : ""}`;
    }
    return factor.matched
      ? "Your skills align with this role."
      : "No matching skills were identified.";
  }

  const messages: Record<string, { matched: string; unmatched: string }> = {
    Experience: {
      matched: "Your experience meets the role requirements.",
      unmatched: "Your experience does not meet the stated range.",
    },
    "Career level": {
      matched: "The role level aligns with your background.",
      unmatched: "The role level may not match your background.",
    },
    Location: {
      matched: "The location fits your stated preferences.",
      unmatched: "The location differs from your preferences.",
    },
    Salary: {
      matched: "The salary criteria are compatible.",
      unmatched: "The salary range may not fit your expectations.",
    },
    Education: {
      matched: "Your education meets the role criteria.",
      unmatched: "The education criteria were not matched.",
    },
  };
  const message = messages[label];
  if (factor.matched === undefined || !message) {
    return "This criterion has a score but no match status.";
  }
  return factor.matched ? message.matched : message.unmatched;
}

function parseJobs(payload: unknown): JobMatch[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new Error("The server returned an unexpected response. Please try again.");
  }

  return payload.data.map((value) => {
    if (
      !isRecord(value) ||
      typeof value.title !== "string" ||
      typeof value.score !== "number" ||
      !Number.isFinite(value.score)
    ) {
      throw new Error("A job recommendation was incomplete. Please try again.");
    }

    const companyData = isRecord(value.company) ? value.company : null;
    const company =
      typeof value.company === "string"
        ? value.company
        : typeof companyData?.name === "string"
          ? companyData.name
          : null;
    const jobId =
      typeof value.job_id === "string"
        ? value.job_id
        : typeof value.id === "string"
          ? value.id
          : null;

    if (!company || !jobId) {
      throw new Error("A job recommendation was incomplete. Please try again.");
    }

    const location = isRecord(value.location)
      ? {
          city:
            typeof value.location.city === "string" ? value.location.city : null,
          country:
            typeof value.location.country === "string"
              ? value.location.country
              : null,
          isRemote:
            typeof value.location.isRemote === "boolean"
              ? value.location.isRemote
              : false,
        }
      : undefined;
    const rawSummary = isRecord(value.score_summary)
      ? value.score_summary
      : undefined;
    const scoreSummary: MatchSummary | undefined = rawSummary
      ? {
          total: finiteNumber(rawSummary.total),
          maxScore: finiteNumber(rawSummary.maxScore),
          location: parseMatchFactor(rawSummary.location),
          experience: parseMatchFactor(rawSummary.experience),
          candidateLevel: parseMatchFactor(rawSummary.candidateLevel),
          skills: parseMatchFactor(rawSummary.skills),
          salary: parseMatchFactor(rawSummary.salary),
          education: parseMatchFactor(rawSummary.education),
        }
      : undefined;
    const salary = isRecord(value.salary)
      ? {
          min: typeof value.salary.min === "number" ? value.salary.min : null,
          max: typeof value.salary.max === "number" ? value.salary.max : null,
          currency:
            typeof value.salary.currency === "string"
              ? value.salary.currency
              : null,
          period:
            typeof value.salary.period === "string" ? value.salary.period : null,
          isNegotiable:
            typeof value.salary.isNegotiable === "boolean"
              ? value.salary.isNegotiable
              : false,
        }
      : undefined;
    const experience = isRecord(value.experience)
      ? {
          allowFresher:
            typeof value.experience.allowFresher === "boolean"
              ? value.experience.allowFresher
              : false,
          minYears:
            typeof value.experience.minYears === "number"
              ? value.experience.minYears
              : null,
          maxYears:
            typeof value.experience.maxYears === "number"
              ? value.experience.maxYears
              : null,
        }
      : undefined;

    return {
      job_id: jobId,
      title: value.title,
      company,
      companyWebsite:
        typeof companyData?.website === "string" ? companyData.website : null,
      description:
        typeof value.description === "string" ? value.description : null,
      location,
      salary,
      experience,
      skills: stringList(value.skills),
      educations: stringList(value.educations),
      candidateLevels: stringList(value.candidateLevels),
      eligibleCandidateTypes: stringList(value.eligibleCandidateTypes),
      applicationDeadline:
        typeof value.applicationDeadline === "string"
          ? value.applicationDeadline
          : null,
      score: value.score,
      score_summary: scoreSummary,
    };
  });
}

function dateLabel(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function salaryLabel(salary?: JobMatch["salary"]) {
  if (!salary) return null;
  const amounts = [salary.min, salary.max]
    .filter((amount): amount is number => amount !== null && amount !== undefined)
    .map((amount) => amount.toLocaleString());
  if (!amounts.length) return salary.isNegotiable ? "Negotiable" : null;

  const range =
    amounts.length === 2 ? `${amounts[0]} – ${amounts[1]}` : amounts[0];
  return [salary.currency, range, salary.period && `/ ${salary.period}`]
    .filter(Boolean)
    .join(" ");
}

function experienceLabel(experience?: JobMatch["experience"]) {
  if (!experience) return null;
  if (experience.allowFresher) return "Fresh graduates welcome";

  const { minYears, maxYears } = experience;
  if (minYears == null && maxYears == null) return null;
  if (minYears != null && maxYears != null && minYears === maxYears) {
    return `${minYears} years`;
  }
  if (minYears != null && maxYears != null) {
    return `${minYears}–${maxYears} years`;
  }
  if (minYears != null) return `${minYears}+ years`;
  return `Up to ${maxYears} years`;
}

function safeWebsite(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function locationLabel(location?: JobMatch["location"]) {
  const places = [location?.city, location?.country].filter(Boolean);
  if (location?.isRemote) places.push("Remote");
  return places.length ? places.join(" · ") : "Location not specified";
}

function validateFile(file: File) {
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return "Please choose a PDF resume.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "This file is larger than 10 MB. Choose a smaller PDF.";
  }
  if (file.size === 0) {
    return "This file is empty. Choose a valid PDF resume.";
  }
  return "";
}

function errorMessage(payload: unknown, fallback: string) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "detail" in payload &&
    typeof payload.detail === "string"
  ) {
    return payload.detail;
  }
  return fallback;
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [requestMode, setRequestMode] = useState<"resume" | "demo" | null>(
    null,
  );
  const [resultMode, setResultMode] = useState<"resume" | "demo" | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const isLoading = requestMode !== null;

  function chooseFile(nextFile?: File) {
    if (!nextFile) return;
    const validationError = validateFile(nextFile);
    setError(validationError);
    setJobs([]);
    setResultMode(null);
    setFile(validationError ? null : nextFile);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    chooseFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  async function loadRecommendations(mode: "resume" | "demo") {
    if (isLoading || (mode === "resume" && !file)) return;

    setError("");
    setJobs([]);
    setResultMode(null);
    setSelectedJobId(null);
    setRequestMode(mode);

    try {
      const request: RequestInit = {
        method: mode === "demo" ? "GET" : "POST",
      };
      if (mode === "resume" && file) {
        const formData = new FormData();
        formData.append("file", file);
        request.body = formData;
      }

      const response = await fetch("/api/recommendations", request);

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(
          errorMessage(
            payload,
            `We couldn’t ${mode === "demo" ? "load demo matches" : "analyze your resume"} (error ${response.status}). Please try again.`,
          ),
        );
      }

      setJobs(parseJobs(payload));
      setResultMode(mode);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while analyzing your resume. Please try again.",
      );
    } finally {
      setRequestMode(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadRecommendations("resume");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Careerly home">
          <span className="brand-mark">
            <LuSparkles aria-hidden="true" />
          </span>
          <span>careerly</span>
        </Link>
        <div className="topbar-note">
          <span className="status-dot" />
          Your next move starts here
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <LuSparkles aria-hidden="true" />
            YOUR CAREER, WITH A LITTLE MORE CLARITY
          </div>
          <h1>
            Find work that
            <br />
            <span>fits you.</span>
          </h1>
          <p>
            Your experience is unique. Let AI find the opportunities that make
            sense for <em>you</em>—not just your keywords.
          </p>
          <div className="hero-proof">
            <div className="proof-avatars" aria-hidden="true">
              <span>J</span>
              <span>M</span>
              <span>A</span>
            </div>
            <span>Better matches, made personal.</span>
          </div>
        </div>

        <div className="upload-card">
          <div className="card-heading">
            <div>
              <span className="step-label">01 / GET STARTED</span>
              <h2>Bring your resume</h2>
            </div>
            <span className="private-badge">
              <FiFileText aria-hidden="true" />
              PDF matching
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="visually-hidden"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              aria-label="Choose a PDF resume"
            />
            <div
              className={`drop-zone${isDragging ? " is-dragging" : ""}${file ? " has-file" : ""}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                const nextTarget = event.relatedTarget;
                if (
                  !(nextTarget instanceof Node) ||
                  !event.currentTarget.contains(nextTarget)
                ) {
                  setIsDragging(false);
                }
              }}
              onDrop={handleDrop}
            >
              <span className="upload-icon">
                {file ? (
                  <FiFileText aria-hidden="true" />
                ) : (
                  <FiUploadCloud aria-hidden="true" />
                )}
              </span>
              {file ? (
                <>
                  <strong className="selected-name">{file.name}</strong>
                  <span className="drop-hint">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to analyze
                  </span>
                </>
              ) : (
                <>
                  <strong>Drop your resume here</strong>
                  <span className="drop-hint">
                    or{" "}
                    <button
                      className="browse-button"
                      type="button"
                      onClick={() => inputRef.current?.click()}
                    >
                      browse files
                    </button>
                  </span>
                </>
              )}
              {file && (
                <button
                  className="change-file"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                >
                  Choose a different file
                </button>
              )}
            </div>

            <div className="upload-meta">
              <span>PDF only</span>
              <span>Maximum file size: 10 MB</span>
            </div>

            {error && (
              <p className="error-message" role="alert">
                <span aria-hidden="true">!</span>
                {error}
              </p>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={!file || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  {requestMode === "demo"
                    ? "Loading demo matches…"
                    : "Finding your matches…"}
                </>
              ) : (
                <>
                  Find my matches
                  <FiArrowRight aria-hidden="true" />
                </>
              )}
            </button>
            <div className="demo-action">
              <span>JUST EXPLORING?</span>
              <button
                className="demo-button"
                type="button"
                disabled={isLoading}
                onClick={() => void loadRecommendations("demo")}
              >
                <FiPlay aria-hidden="true" />
                Try the demo profile
              </button>
            </div>
          </form>

          <p className="privacy-note">
            No resume needed for the demo. Your PDF is used to find matching jobs.
          </p>
        </div>

        <div className="hero-decoration" aria-hidden="true">
          <span className="decoration-orbit orbit-one" />
          <span className="decoration-orbit orbit-two" />
          <LuSparkles aria-hidden="true" />
        </div>
      </section>

      {isLoading && (
        <section className="results-section loading-section" aria-live="polite">
          <div className="loading-indicator">
            <span className="spinner dark-spinner" />
          </div>
          <p className="step-label">A MOMENT, PLEASE</p>
          <h2>Finding the right fit</h2>
          <p>
            {requestMode === "demo"
              ? "We’re loading sample matches for a demo candidate."
              : "We’re reading your experience and matching it with open roles."}
          </p>
        </section>
      )}

      {!isLoading && jobs.length > 0 && (
        <section className="results-section" aria-live="polite">
          <div className="results-header">
            <div>
              <span className="step-label">02 / YOUR SHORTLIST</span>
              <h2>
                {resultMode === "demo"
                  ? "A preview of your best-fit jobs."
                  : "Opportunities with your name on them."}
              </h2>
              <p>
                {resultMode === "demo"
                  ? "These sample matches use the built-in demo candidate profile."
                  : `We found ${jobs.length} ${jobs.length === 1 ? "role" : "roles"} that line up with your experience.`}
              </p>
            </div>
            <span className="results-count">
              <LuSparkles aria-hidden="true" />
              {jobs.length} {resultMode === "demo" ? "demo matches" : "matches"}
            </span>
          </div>

          <div className="job-list">
            {jobs.map((job, index) => {
              const skills = job.score_summary?.skills?.matchedSkills ?? [];
              const roleSkills = job.skills.length > 0 ? job.skills : skills;
              const isSelected = selectedJobId === job.job_id;
              const website = safeWebsite(job.companyWebsite);
              const salary = salaryLabel(job.salary);
              const experience = experienceLabel(job.experience);
              const deadline = dateLabel(job.applicationDeadline);
              
              const matchFactors: {
                label: string;
                factor?: MatchFactor;
              }[] = [
                { label: "Skills", factor: job.score_summary?.skills },
                { label: "Experience", factor: job.score_summary?.experience },
                {
                  label: "Career level",
                  factor: job.score_summary?.candidateLevel,
                },
                { label: "Location", factor: job.score_summary?.location },
                { label: "Salary", factor: job.score_summary?.salary },
                { label: "Education", factor: job.score_summary?.education },
              ];
              const summaryScore =
                job.score_summary?.total ?? job.score;
              return (
                <article
                  className={`job-card${isSelected ? " is-selected" : ""}`}
                  key={job.job_id}
                >
                  <div className="job-index">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="company-avatar" aria-hidden="true">
                    {job.company.trim().charAt(0).toUpperCase() || "J"}
                  </div>
                  <div className="job-main">
                    <div className="job-title-row">
                      <div>
                        <h3>{job.title}</h3>
                        <p className="company-name">{job.company}</p>
                      </div>
                      <div className="match-score">
                        <span className="score-value">{job.score}%</span>
                        <span>match</span>
                      </div>
                    </div>
                    <div className="job-details">
                      <span>
                        <FiMapPin aria-hidden="true" />
                        {locationLabel(job.location)}
                      </span>
                    </div>
                    {skills.length > 0 && (
                      <div className="skill-list" aria-label="Matching skills">
                        {skills.slice(0, 5).map((skill) => (
                          <span className="skill-chip" key={skill}>
                            {skill}
                          </span>
                        ))}
                        {skills.length > 5 && (
                          <span className="skill-more">+{skills.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="job-action">
                    <button
                      className="details-toggle"
                      type="button"
                      aria-expanded={isSelected}
                      aria-controls={`job-details-${job.job_id}`}
                      onClick={() =>
                        setSelectedJobId(isSelected ? null : job.job_id)
                      }
                    >
                      {isSelected ? "Hide details" : "Job details"}
                      {isSelected ? (
                        <FiChevronUp aria-hidden="true" />
                      ) : (
                        <FiChevronDown aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {isSelected && (
                    <div
                      className="job-expanded"
                      id={`job-details-${job.job_id}`}
                    >
                      <section className="matching-summary">
                        <div className="matching-summary-heading">
                          <div>
                            <span className="summary-eyebrow">
                              SCORE BREAKDOWN
                            </span>
                            <h4>How this match is scored</h4>
                          </div>
                          <div className="summary-total">
                            <strong>{summaryScore}%</strong>
                            <span>overall match</span>
                          </div>
                        </div>
                        <p className="summary-explanation">
                          Each percentage shows the share of points earned for
                          that criterion. All six contribute to the overall
                          score.
                        </p>
                        <div className="match-factor-list">
                          {matchFactors.map(({ label, factor }) => {
                            const percentage = criterionPercentage(factor);
                            return (
                              <div className="match-factor" key={label}>
                                <div className="match-factor-heading">
                                  <span>{label}</span>
                                  <span
                                    className={`factor-status${factor?.matched === true ? " is-matched" : factor?.matched === false ? " is-unmatched" : ""}`}
                                  >
                                    {factor?.matched === true
                                      ? "Meets criterion"
                                      : factor?.matched === false
                                        ? "Gap identified"
                                        : factor?.score === undefined
                                          ? "No score"
                                          : "Score only"}
                                  </span>
                                </div>
                                <div className="match-percentage">
                                  <strong>
                                    {percentage === undefined
                                      ? "Unavailable"
                                      : `${percentage}%`}
                                  </strong>
                                  <span>
                                    {percentage === undefined
                                      ? "match percentage unavailable"
                                      : "criterion match"}
                                  </span>
                                </div>
                                <div
                                  className="match-progress"
                                  role="progressbar"
                                  aria-label={`${label} match percentage`}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  aria-valuenow={percentage ?? 0}
                                  aria-valuetext={
                                    percentage === undefined
                                      ? "Match percentage unavailable"
                                      : `${percentage}% match`
                                  }
                                >
                                  <span
                                    style={{ width: `${percentage ?? 0}%` }}
                                  />
                                </div>
                                <p className="match-factor-description">
                                  {matchFactorDescription(label, factor)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </section>

                      {job.description?.trim() && (
                        <section className="job-description">
                          <h4>About this role</h4>
                          <p>{job.description}</p>
                        </section>
                      )}

                      <div className="job-facts">
                        <div className="job-fact">
                          <FiMapPin aria-hidden="true" />
                          <div>
                            <span>Location</span>
                            <strong>{locationLabel(job.location)}</strong>
                          </div>
                        </div>
                        {salary && (
                          <div className="job-fact">
                            <FiDollarSign aria-hidden="true" />
                            <div>
                              <span>Salary</span>
                              <strong>{salary}</strong>
                            </div>
                          </div>
                        )}
                        {experience && (
                          <div className="job-fact">
                            <FiBriefcase aria-hidden="true" />
                            <div>
                              <span>Experience</span>
                              <strong>{experience}</strong>
                            </div>
                          </div>
                        )}
                        {deadline && (
                          <div className="job-fact">
                            <FiCalendar aria-hidden="true" />
                            <div>
                              <span>Application deadline</span>
                              <strong>{deadline}</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      {roleSkills.length > 0 && (
                        <section className="job-requirements">
                          <h4>
                            {job.skills.length > 0
                              ? "Skills for this role"
                              : "Matching skills"}
                          </h4>
                          <div className="detail-chips">
                            {roleSkills.map((skill, skillIndex) => (
                              <span
                                className="skill-chip"
                                key={`${skill}-${skillIndex}`}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}

                      {job.educations.length > 0 && (
                        <section className="job-requirements">
                          <h4>Education</h4>
                          <div className="detail-chips">
                            {job.educations.map((education, educationIndex) => (
                              <span
                                className="skill-chip"
                                key={`${education}-${educationIndex}`}
                              >
                                {education}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}

                      {(job.candidateLevels.length > 0 ||
                        job.eligibleCandidateTypes.length > 0) && (
                        <section className="job-requirements">
                          <h4>Candidate profile</h4>
                          <div className="detail-chips">
                            {[...job.candidateLevels, ...job.eligibleCandidateTypes].map(
                              (item, itemIndex) => (
                                <span
                                  className="skill-chip"
                                  key={`${item}-${itemIndex}`}
                                >
                                  {item}
                                </span>
                              ),
                            )}
                          </div>
                        </section>
                      )}

                      {!job.description?.trim() &&
                        !salary &&
                        !experience &&
                        !deadline &&
                        roleSkills.length === 0 &&
                        job.educations.length === 0 &&
                        job.candidateLevels.length === 0 &&
                        job.eligibleCandidateTypes.length === 0 &&
                        !website && (
                          <p className="detail-note">
                            Additional details aren’t available for this role.
                          </p>
                        )}

                      {website && (
                        <a
                          className="company-website"
                          href={website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FiGlobe aria-hidden="true" />
                          Company website
                          <FiArrowRight aria-hidden="true" />
                        </a>
                      )}

                      <div className="job-detail-actions">
                        <button className="apply-button" type="button" disabled>
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          <p className="results-footnote">
            {resultMode === "demo"
              ? "Match scores are based on the sample demo profile."
              : "Match scores are based on the experience and skills listed in your resume."}
          </p>
        </section>
      )}

      {!isLoading && !file && !error && !resultMode && jobs.length === 0 && (
        <section className="how-it-works">
          <div className="section-intro">
            <span className="step-label">A BETTER WAY TO SEARCH</span>
            <h2>Less scrolling. More possibility.</h2>
          </div>
          <div className="benefit-grid">
            <article className="benefit">
              <span className="benefit-number">01</span>
              <h3>We get to know you</h3>
              <p>AI picks up your strengths, experience, and what you can bring to a team.</p>
            </article>
            <article className="benefit">
              <span className="benefit-number">02</span>
              <h3>We find your fit</h3>
              <p>Your profile is matched against real openings from our job database.</p>
            </article>
            <article className="benefit">
              <span className="benefit-number">03</span>
              <h3>You make the move</h3>
              <p>Explore your strongest matches and take the next step on your terms.</p>
            </article>
          </div>
        </section>
      )}

      {!isLoading &&
        !error &&
        (file || resultMode === "demo") &&
        jobs.length === 0 && (
          <div className="empty-results" aria-live="polite">
            <span className="empty-sparkle">
              <LuSparkles aria-hidden="true" />
            </span>
            <div>
              <strong>
                {resultMode === "demo"
                  ? "No demo matches are available right now"
                  : "No matching roles just yet"}
              </strong>
              <p>
                Try another resume or check back as new opportunities are added.
              </p>
            </div>
          </div>
        )}

      <footer className="footer">
        <Link className="brand footer-brand" href="/" aria-label="Careerly home">
          <span className="brand-mark">
            <LuSparkles aria-hidden="true" />
          </span>
          <span>careerly</span>
        </Link>
        <span>Made for the next chapter.</span>
      </footer>
    </main>
  );
}
