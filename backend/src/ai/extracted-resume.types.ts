export type ExtractedResume = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills?: string[];
  education?: Array<{
    school?: string;
    degree?: string;
    field?: string;
    start_date?: string;
    end_date?: string;
  }>;
  work_experience?: Array<{
    company?: string;
    title?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    highlights?: string[];
  }>;
  links?: string[];
};
