interface Job {
  id: string;
  title: string;
  description: string;

  company: {
    name: string;
    logo?: string;
    website?: string;
  };

  location: {
    city?: string;
    country?: string;
    isRemote: boolean;
  };

  salary?: {
    min?: number;
    max?: number;
    currency: string;
    period: "hourly" | "monthly" | "yearly";
    isNegotiable: boolean;
  };

  experience: {
    allowFresher: boolean;
    minYears: number;
    maxYears: number;
  };

  eligibleCandidateTypes: string[]; //for example software engineer, web developer, network engineer, civil engineer

  candidateLevels: CandidateLevel[];
   skills:string[]
   educations:[] //degreeNames
  applicationUrl?: string;
  applicationDeadline?: Date;
  postedAt: Date;
  updatedAt?: Date;
}

export enum CandidateLevel {
  FRESHER = "fresher",
  JUNIOR = "junior",
  MID_LEVEL = "mid-level",
  SENIOR = "senior",
  EXPERT = "expert",
}


export interface CandidateResume {
  id: string;

  // Candidate information
  fullName: string;
  email: string;
  phone?: string;
  profilePicture?: string;

  // Professional information
  title: string;
  summary?: string;
  
  applicableTypes: string[];

  // Skills and experience
  experiences: {
    positionName: string;
    level: CandidateLevel;
    skills: [];
    years: number;
  }[];

  // Education
  educations: {
    degree: string;
    institution: string;
    fieldOfStudy?: string;
    graduationYear?: number;
  }[];

  // Resume and portfolio
  resumeUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;

  // Preferences
  preferredLocations?: string[];
  isOpenToRemote: boolean;
  expectedSalary?: {
    min?: number;
    max?: number;
    currency: string;
    period: "hourly" | "monthly" | "yearly";
  };

  // Metadata
  createdAt: Date;
  updatedAt?: Date;
}
