import bcrypt from 'bcryptjs';
import type { SupabaseClient } from '@supabase/supabase-js';

export const DEMO_CANDIDATE_EMAIL =
  process.env.DEMO_CANDIDATE_EMAIL?.trim().toLowerCase() || 'candidate@demo.local';

export const DEMO_CANDIDATE_PASSWORD =
  process.env.DEMO_CANDIDATE_PASSWORD?.trim() || 'demo123!';

export const DEMO_CANDIDATE_CREDENTIALS = {
  email: DEMO_CANDIDATE_EMAIL,
  password: DEMO_CANDIDATE_PASSWORD,
};

const DEMO_APPLICATIONS = [
  {
    code: 'demo-app-senior-se',
    jobSlug: 'senior-software-engineer',
    status: 'submitted',
  },
  {
    code: 'demo-app-qa',
    jobSlug: 'qa-engineer',
    status: 'submitted',
  },
] as const;

const DEMO_JOB_ALERTS = [
  { keyword: 'Engineer', location: null, department: null },
  { keyword: null, location: 'Barcelona, Spain', department: null },
] as const;

export const DEMO_CANDIDATE_PROFILE = {
  name: 'Alex Demo',
  firstName: 'Alex',
  lastName: 'Demo',
  positionTitle: 'Senior Software Engineer',
  email: DEMO_CANDIDATE_EMAIL,
  phone: '+34 600 123 456',
  location: 'Barcelona, Spain',
  summary:
    'Full-stack engineer with 8+ years building scalable web applications. Passionate about clean code, developer experience, and shipping reliable products.',
  skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'CI/CD', 'Test automation'],
  education: [
    {
      school: 'Universitat Politècnica de Catalunya',
      degree: 'BSc',
      field: 'Computer Science',
      start_date: '2012',
      end_date: '2016',
    },
  ],
  work_experience: [
    {
      company: 'TechCorp Europe',
      title: 'Senior Software Engineer',
      location: 'Barcelona, Spain',
      start_date: '2020',
      end_date: null,
      highlights: [
        'Led migration of monolith to microservices serving 2M+ users',
        'Reduced deployment time by 60% through CI/CD improvements',
      ],
    },
    {
      company: 'StartupHub',
      title: 'Software Engineer',
      location: 'Madrid, Spain',
      start_date: '2016',
      end_date: '2020',
      highlights: ['Built customer-facing React apps and REST APIs'],
    },
  ],
  links: ['https://github.com/alexdemo'],
};

export type DemoCandidateSeedResult = {
  candidateId: string;
  applicationsCreated: number;
  jobAlertsCreated: number;
};

async function ensureDemoCandidate(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<string> {
  const email = DEMO_CANDIDATE_EMAIL;
  const password_hash = await bcrypt.hash(DEMO_CANDIDATE_PASSWORD, 10);

  const { data: existing } = await supabase
    .from('candidates')
    .select('id, password_hash')
    .eq('tenant_id', tenantId)
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    const valid = await bcrypt.compare(
      DEMO_CANDIDATE_PASSWORD,
      (existing as { password_hash: string }).password_hash,
    );
    if (!valid) {
      const { error } = await supabase
        .from('candidates')
        .update({ password_hash, profile_json: DEMO_CANDIDATE_PROFILE })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('candidates')
        .update({ profile_json: DEMO_CANDIDATE_PROFILE })
        .eq('id', existing.id);
      if (error) throw error;
    }
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from('candidates')
    .insert({
      tenant_id: tenantId,
      email,
      password_hash,
      profile_json: DEMO_CANDIDATE_PROFILE,
    })
    .select('id')
    .single();

  if (error) throw error;
  return created.id;
}

async function seedDemoApplications(
  supabase: SupabaseClient,
  tenantId: string,
  candidateId: string,
): Promise<number> {
  const { count: existingCount, error: countErr } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('candidate_id', candidateId);

  if (countErr) throw countErr;
  if ((existingCount ?? 0) > 0) return 0;

  let created = 0;

  for (const app of DEMO_APPLICATIONS) {
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('slug', app.jobSlug)
      .maybeSingle();

    if (jobErr) throw jobErr;
    if (!job) continue;

    const row = {
      tenant_id: tenantId,
      application_code: app.code,
      job_id: job.id,
      candidate_id: candidateId,
      applicant_email: DEMO_CANDIDATE_EMAIL,
      resume_extracted: DEMO_CANDIDATE_PROFILE,
      status: app.status,
    };

    const { data: existingApp } = await supabase
      .from('applications')
      .select('id')
      .eq('application_code', app.code)
      .maybeSingle();

    if (existingApp) {
      const { error } = await supabase
        .from('applications')
        .update(row)
        .eq('id', existingApp.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('applications').insert(row);
      if (error) throw error;
    }
    created++;
  }

  return created;
}

async function seedDemoJobAlerts(
  supabase: SupabaseClient,
  tenantId: string,
  candidateId: string,
): Promise<number> {
  const { count: existingCount, error: countErr } = await supabase
    .from('job_alerts')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('candidate_id', candidateId);

  if (countErr) throw countErr;
  if ((existingCount ?? 0) > 0) return 0;

  let created = 0;

  for (const alert of DEMO_JOB_ALERTS) {
    const { error } = await supabase.from('job_alerts').insert({
      tenant_id: tenantId,
      candidate_id: candidateId,
      keyword: alert.keyword,
      location: alert.location,
      department: alert.department,
    });
    if (error) throw error;
    created++;
  }

  return created;
}

export async function seedDemoCandidateForTenant(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<DemoCandidateSeedResult> {
  const candidateId = await ensureDemoCandidate(supabase, tenantId);
  const applicationsCreated = await seedDemoApplications(supabase, tenantId, candidateId);
  const jobAlertsCreated = await seedDemoJobAlerts(supabase, tenantId, candidateId);

  return { candidateId, applicationsCreated, jobAlertsCreated };
}
