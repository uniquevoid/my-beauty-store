import type { EducationEntry, ExtractedResume, WorkExperienceEntry } from '../types/resume';

import type { ApplicationValidationResult } from '../lib/application-validation';



type ApplicationFormProps = {

  value: ExtractedResume;

  onChange: (next: ExtractedResume) => void;

  disabled?: boolean;

  emailReadOnly?: boolean;

  fieldErrors?: ApplicationValidationResult['fieldErrors'];

};



const inputClass =

  'mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 bg-white disabled:opacity-50';



function RequiredLabel({ children }: { children: React.ReactNode }) {

  return (

    <>

      {children} <span className="text-red-600">*</span>

    </>

  );

}



export default function ApplicationForm({

  value,

  onChange,

  disabled = false,

  emailReadOnly = false,

  fieldErrors = {},

}: ApplicationFormProps) {

  function updateField<K extends keyof ExtractedResume>(key: K, fieldValue: ExtractedResume[K]) {

    onChange({ ...value, [key]: fieldValue });

  }



  function updateEducation(index: number, patch: Partial<EducationEntry>) {

    const next = [...(value.education ?? [])];

    next[index] = { ...next[index], ...patch };

    updateField('education', next);

  }



  function addEducation() {

    updateField('education', [...(value.education ?? []), {}]);

  }



  function removeEducation(index: number) {

    updateField(

      'education',

      (value.education ?? []).filter((_, i) => i !== index),

    );

  }



  function updateWork(index: number, patch: Partial<WorkExperienceEntry>) {

    const next = [...(value.work_experience ?? [])];

    next[index] = { ...next[index], ...patch };

    updateField('work_experience', next);

  }



  function addWork() {

    updateField('work_experience', [...(value.work_experience ?? []), { highlights: [] }]);

  }



  function removeWork(index: number) {

    updateField(

      'work_experience',

      (value.work_experience ?? []).filter((_, i) => i !== index),

    );

  }



  const portfolioUrl = (value.links ?? [])[0] ?? '';



  return (

    <div className="space-y-10">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div>

          <label className="block text-sm font-medium">

            <RequiredLabel>Full name</RequiredLabel>

          </label>

          <input

            value={value.name ?? ''}

            onChange={(e) => updateField('name', e.target.value)}

            className={inputClass}

            disabled={disabled}

          />

          {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}

        </div>

        <div>

          <label className="block text-sm font-medium">

            <RequiredLabel>Email</RequiredLabel>

          </label>

          <input

            type="email"

            value={value.email ?? ''}

            onChange={(e) => updateField('email', e.target.value)}

            className={inputClass}

            disabled={disabled || emailReadOnly}

          />

          {emailReadOnly ? (
            <p className="mt-1 text-xs text-gray-500">This is your sign-in email.</p>
          ) : null}

          {fieldErrors.email ? <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p> : null}

        </div>

        <div>

          <label className="block text-sm font-medium">

            <RequiredLabel>Phone</RequiredLabel>

          </label>

          <input

            value={value.phone ?? ''}

            onChange={(e) => updateField('phone', e.target.value)}

            className={inputClass}

            disabled={disabled}

          />

          {fieldErrors.phone ? <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p> : null}

        </div>

        <div>

          <label className="block text-sm font-medium">

            <RequiredLabel>Location</RequiredLabel>

          </label>

          <input

            value={value.location ?? ''}

            onChange={(e) => updateField('location', e.target.value)}

            className={inputClass}

            disabled={disabled}

          />

          {fieldErrors.location ? <p className="mt-1 text-xs text-red-600">{fieldErrors.location}</p> : null}

        </div>

        <div className="md:col-span-2">

          <label className="block text-sm font-medium">Summary</label>

          <textarea

            value={value.summary ?? ''}

            onChange={(e) => updateField('summary', e.target.value)}

            className={`${inputClass} min-h-[120px]`}

            disabled={disabled}

            placeholder="Optional — tell us about yourself in your own words"

          />

        </div>

        <div>

          <label className="block text-sm font-medium">Skills</label>

          {(value.skills ?? []).length > 0 ? (

            <div className="mt-2 flex flex-wrap gap-2">

              {(value.skills ?? []).map((skill) => (

                <span

                  key={skill}

                  className="inline-flex items-center rounded-full bg-sand px-3 py-1 text-xs font-medium text-charcoal"

                >

                  {skill}

                </span>

              ))}

            </div>

          ) : (

            <p className="mt-2 text-sm text-gray-500">Skills will appear here after your resume is processed.</p>

          )}

          <p className="mt-1 text-xs text-gray-500">Populated from your resume — not editable.</p>

        </div>

        <div>

          <label className="block text-sm font-medium">Portfolio or website</label>

          <input

            type="url"

            value={portfolioUrl}

            onChange={(e) => {

              const url = e.target.value.trim();

              updateField('links', url ? [url] : []);

            }}

            className={inputClass}

            disabled={disabled}

            placeholder="https://"

          />

          {fieldErrors.links ? <p className="mt-1 text-xs text-red-600">{fieldErrors.links}</p> : null}

        </div>

      </div>



      <div>

        <div className="flex items-center justify-between gap-4">

          <h2 className="text-lg font-medium">

            <RequiredLabel>Education</RequiredLabel>

          </h2>

          <button

            type="button"

            onClick={addEducation}

            disabled={disabled}

            className="text-sm text-brand-primary hover:underline disabled:opacity-50"

          >

            + Add education

          </button>

        </div>

        {fieldErrors.education ? (

          <p className="mt-1 text-xs text-red-600">{fieldErrors.education}</p>

        ) : null}

        {(value.education ?? []).length === 0 ? (

          <p className="mt-2 text-sm text-gray-500">No education entries yet.</p>

        ) : (

          <div className="mt-4 space-y-4">

            {(value.education ?? []).map((entry, index) => (

              <div key={index} className="rounded-2xl border border-gray-100 p-4 space-y-3">

                <div className="flex justify-end">

                  <button

                    type="button"

                    onClick={() => removeEducation(index)}

                    disabled={disabled}

                    className="text-xs text-red-600 hover:underline disabled:opacity-50"

                  >

                    Remove

                  </button>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                  <div>

                    <label className="block text-xs font-medium text-gray-600">School</label>

                    <input

                      value={entry.school ?? ''}

                      onChange={(e) => updateEducation(index, { school: e.target.value })}

                      className={inputClass}

                      disabled={disabled}

                    />

                  </div>

                  <div>

                    <label className="block text-xs font-medium text-gray-600">Degree</label>

                    <input

                      value={entry.degree ?? ''}

                      onChange={(e) => updateEducation(index, { degree: e.target.value })}

                      className={inputClass}

                      disabled={disabled}

                    />

                  </div>

                  <div>

                    <label className="block text-xs font-medium text-gray-600">Field</label>

                    <input

                      value={entry.field ?? ''}

                      onChange={(e) => updateEducation(index, { field: e.target.value })}

                      className={inputClass}

                      disabled={disabled}

                    />

                  </div>

                  <div className="grid grid-cols-2 gap-3">

                    <div>

                      <label className="block text-xs font-medium text-gray-600">Start</label>

                      <input

                        value={entry.start_date ?? ''}

                        onChange={(e) => updateEducation(index, { start_date: e.target.value })}

                        className={inputClass}

                        disabled={disabled}

                      />

                    </div>

                    <div>

                      <label className="block text-xs font-medium text-gray-600">End</label>

                      <input

                        value={entry.end_date ?? ''}

                        onChange={(e) => updateEducation(index, { end_date: e.target.value })}

                        className={inputClass}

                        disabled={disabled}

                      />

                    </div>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>



      <div>

        <div className="flex items-center justify-between gap-4">

          <h2 className="text-lg font-medium">

            <RequiredLabel>Work experience</RequiredLabel>

          </h2>

          <button

            type="button"

            onClick={addWork}

            disabled={disabled}

            className="text-sm text-brand-primary hover:underline disabled:opacity-50"

          >

            + Add experience

          </button>

        </div>

        {fieldErrors.work_experience ? (

          <p className="mt-1 text-xs text-red-600">{fieldErrors.work_experience}</p>

        ) : null}

        {(value.work_experience ?? []).length === 0 ? (

          <p className="mt-2 text-sm text-gray-500">No work experience entries yet.</p>

        ) : (

          <div className="mt-4 space-y-4">

            {(value.work_experience ?? []).map((entry, index) => (

              <div key={index} className="rounded-2xl border border-gray-100 p-4 space-y-3">

                <div className="flex justify-end">

                  <button

                    type="button"

                    onClick={() => removeWork(index)}

                    disabled={disabled}

                    className="text-xs text-red-600 hover:underline disabled:opacity-50"

                  >

                    Remove

                  </button>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                  <div>

                    <label className="block text-xs font-medium text-gray-600">Company</label>

                    <input

                      value={entry.company ?? ''}

                      onChange={(e) => updateWork(index, { company: e.target.value })}

                      className={inputClass}

                      disabled={disabled}

                    />

                  </div>

                  <div>

                    <label className="block text-xs font-medium text-gray-600">Title</label>

                    <input

                      value={entry.title ?? ''}

                      onChange={(e) => updateWork(index, { title: e.target.value })}

                      className={inputClass}

                      disabled={disabled}

                    />

                  </div>

                  <div>

                    <label className="block text-xs font-medium text-gray-600">Location</label>

                    <input

                      value={entry.location ?? ''}

                      onChange={(e) => updateWork(index, { location: e.target.value })}

                      className={inputClass}

                      disabled={disabled}

                    />

                  </div>

                  <div className="grid grid-cols-2 gap-3">

                    <div>

                      <label className="block text-xs font-medium text-gray-600">Start</label>

                      <input

                        value={entry.start_date ?? ''}

                        onChange={(e) => updateWork(index, { start_date: e.target.value })}

                        className={inputClass}

                        disabled={disabled}

                      />

                    </div>

                    <div>

                      <label className="block text-xs font-medium text-gray-600">End</label>

                      <input

                        value={entry.end_date ?? ''}

                        onChange={(e) => updateWork(index, { end_date: e.target.value })}

                        className={inputClass}

                        disabled={disabled}

                      />

                    </div>

                  </div>

                  <div className="md:col-span-2">

                    <label className="block text-xs font-medium text-gray-600">

                      Highlights (comma separated)

                    </label>

                    <input

                      value={(entry.highlights ?? []).join(', ')}

                      onChange={(e) =>

                        updateWork(index, {

                          highlights: e.target.value

                            .split(',')

                            .map((s) => s.trim())

                            .filter(Boolean),

                        })

                      }

                      className={inputClass}

                      disabled={disabled}

                    />

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>

  );

}

