export type EducationEntry = {
  school?: string | null;
  degree?: string | null;
  field?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

export type WorkExperienceEntry = {
  company?: string | null;
  title?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  highlights?: string[] | null;
};

export type ExtractedResume = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  summary?: string | null;
  skills?: string[] | null;
  education?: EducationEntry[] | null;
  work_experience?: WorkExperienceEntry[] | null;
  links?: string[] | null;
};

export function emptyExtractedResume(): ExtractedResume {
  return {
    name: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    skills: [],
    education: [],
    work_experience: [],
    links: [],
  };
}

export function normalizeExtractedResume(raw: Partial<ExtractedResume> | null | undefined): ExtractedResume {
  return {
    name: raw?.name ?? '',
    email: raw?.email ?? '',
    phone: raw?.phone ?? '',
    location: raw?.location ?? '',
    summary: raw?.summary ?? '',
    skills: Array.isArray(raw?.skills) ? raw!.skills! : [],
    education: Array.isArray(raw?.education) ? raw!.education! : [],
    work_experience: Array.isArray(raw?.work_experience) ? raw!.work_experience! : [],
    links: Array.isArray(raw?.links) ? raw!.links! : [],
  };
}
