import type { ExtractedResume } from '../types/resume';

type ProfileSummaryProps = {
  profile: ExtractedResume | Record<string, unknown> | null | undefined;
};

function asProfile(raw: ProfileSummaryProps['profile']): ExtractedResume {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  return raw as ExtractedResume;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-1 text-sm text-charcoal">{value}</div>
    </div>
  );
}

export default function ProfileSummary({ profile: rawProfile }: ProfileSummaryProps) {
  const profile = asProfile(rawProfile);
  const skills = profile.skills ?? [];
  const education = profile.education ?? [];
  const work = profile.work_experience ?? [];
  const links = profile.links ?? [];

  return (
    <div className="space-y-6">
      <Field label="Name" value={profile.name} />
      <Field label="Phone" value={profile.phone} />
      <Field label="Location" value={profile.location} />

      {profile.summary?.trim() ? (
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-400">Summary</div>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">{profile.summary}</p>
        </div>
      ) : null}

      {skills.length > 0 ? (
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-400">Skills</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-full bg-sand px-3 py-1 text-xs font-medium text-charcoal"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {education.length > 0 ? (
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-400">Education</div>
          <div className="mt-2 space-y-3">
            {education.map((entry, index) => (
              <div key={index} className="rounded-xl bg-sand/60 px-4 py-3 text-sm">
                <div className="font-medium">{[entry.degree, entry.field].filter(Boolean).join(' in ') || 'Education'}</div>
                <div className="text-gray-600">{entry.school}</div>
                {(entry.start_date || entry.end_date) && (
                  <div className="text-xs text-gray-500 mt-1">
                    {[entry.start_date, entry.end_date].filter(Boolean).join(' — ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {work.length > 0 ? (
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-400">Work experience</div>
          <div className="mt-2 space-y-3">
            {work.map((entry, index) => (
              <div key={index} className="rounded-xl bg-sand/60 px-4 py-3 text-sm">
                <div className="font-medium">{entry.title || 'Role'}</div>
                <div className="text-gray-600">{entry.company}</div>
                {(entry.location || entry.start_date || entry.end_date) && (
                  <div className="text-xs text-gray-500 mt-1">
                    {[entry.location, [entry.start_date, entry.end_date].filter(Boolean).join(' — ')]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                )}
                {(entry.highlights ?? []).length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    {(entry.highlights ?? []).slice(0, 3).map((h, i) => (
                      <li key={i}>• {h}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {links.length > 0 ? (
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-400">Links</div>
          <div className="mt-2 space-y-1">
            {links.map((link) => (
              <a
                key={link}
                href={link}
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-brand-primary hover:underline break-all"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {!profile.name &&
      !profile.phone &&
      !profile.location &&
      !profile.summary &&
      skills.length === 0 &&
      education.length === 0 &&
      work.length === 0 &&
      links.length === 0 ? (
        <p className="text-sm text-gray-500">No profile details available yet.</p>
      ) : null}
    </div>
  );
}
