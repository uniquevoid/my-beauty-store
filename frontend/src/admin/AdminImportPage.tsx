import { useState } from 'react';
import {
  adminApplyImport,
  adminPreviewImport,
  adminSaveImportMapping,
  adminUploadCsv,
} from '../api/admin';

const CANONICAL = [
  'external_id',
  'title',
  'slug',
  'department',
  'location',
  'employment_type',
  'description',
  'status',
  'ignore',
] as const;

type Step = 'upload' | 'map' | 'preview' | 'done';

export default function AdminImportPage() {
  const [step, setStep] = useState<Step>('upload');
  const [batchId, setBatchId] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [syncMode, setSyncMode] = useState<'delta' | 'full'>('delta');
  const [preview, setPreview] = useState<{
    results: Array<{ row: number; action: string; message?: string; title?: string }>;
    summary: Record<string, number>;
  } | null>(null);
  const [applyStats, setApplyStats] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onFile(file: File | null) {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const data = await adminUploadCsv(file);
      setBatchId(data.batch.id);
      setHeaders(data.headers);
      setColumnMap(data.suggested_map ?? {});
      setStep('map');
    } catch {
      setError('Upload failed.');
    } finally {
      setLoading(false);
    }
  }

  async function saveMapping() {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      await adminSaveImportMapping(batchId, {
        column_map: columnMap,
        sync_mode: syncMode,
        save_profile: true,
        value_map: {
          status: {
            published: 'published',
            open: 'published',
            active: 'published',
            draft: 'draft',
            closed: 'closed',
            filled: 'closed',
          },
        },
      });
      const result = await adminPreviewImport(batchId);
      setPreview(result);
      setStep('preview');
    } catch {
      setError('Mapping or preview failed. Ensure title is mapped.');
    } finally {
      setLoading(false);
    }
  }

  async function apply() {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await adminApplyImport(batchId);
      setApplyStats(result.stats);
      setStep('done');
    } catch {
      setError('Apply failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">CSV import</h2>
        <p className="text-slate-600">
          Upload a file, map columns to your schema, preview changes, then apply.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {step === 'upload' && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8">
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={loading}
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          {loading && <p className="mt-2 text-sm text-slate-500">Uploading…</p>}
        </div>
      )}

      {step === 'map' && (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Sync mode</label>
            <select
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              value={syncMode}
              onChange={(e) => setSyncMode(e.target.value as 'delta' | 'full')}
            >
              <option value="delta">Delta (upsert only)</option>
              <option value="full">Full sync (close jobs not in file)</option>
            </select>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-2">CSV column</th>
                <th className="pb-2">Maps to</th>
              </tr>
            </thead>
            <tbody>
              {headers.map((h) => (
                <tr key={h} className="border-t">
                  <td className="py-2 font-mono text-xs">{h}</td>
                  <td className="py-2">
                    <select
                      className="w-full rounded border border-slate-300 px-2 py-1"
                      value={columnMap[h] ?? 'ignore'}
                      onChange={(e) =>
                        setColumnMap((m) => ({ ...m, [h]: e.target.value }))
                      }
                    >
                      {CANONICAL.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            disabled={loading}
            onClick={saveMapping}
            className="rounded bg-brand-primary px-4 py-2 text-white"
          >
            Preview import
          </button>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 text-sm">
            {Object.entries(preview.summary).map(([k, v]) => (
              <span key={k} className="rounded bg-slate-100 px-3 py-1 capitalize">
                {k}: {v}
              </span>
            ))}
          </div>
          <div className="max-h-64 overflow-y-auto rounded border bg-white text-xs">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-2 py-1">Row</th>
                  <th className="px-2 py-1">Action</th>
                  <th className="px-2 py-1">Title</th>
                  <th className="px-2 py-1">Note</th>
                </tr>
              </thead>
              <tbody>
                {preview.results.slice(0, 100).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1">{r.row}</td>
                    <td className="px-2 py-1">{r.action}</td>
                    <td className="px-2 py-1">{r.title ?? ''}</td>
                    <td className="px-2 py-1 text-slate-500">{r.message ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="rounded border px-4 py-2 text-sm"
              onClick={() => setStep('map')}
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={apply}
              className="rounded bg-brand-primary px-4 py-2 text-white"
            >
              Apply import
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-sm">
          <p className="font-medium text-green-800">Import applied successfully.</p>
          {applyStats && (
            <pre className="mt-2 text-xs text-green-900">{JSON.stringify(applyStats, null, 2)}</pre>
          )}
          <button
            type="button"
            className="mt-4 text-brand-primary hover:underline"
            onClick={() => {
              setStep('upload');
              setBatchId(null);
              setPreview(null);
            }}
          >
            Import another file
          </button>
        </div>
      )}
    </div>
  );
}
