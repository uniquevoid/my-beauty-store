import { useEffect, useState, type FormEvent } from 'react';
import {
  buildProspectBranding,
  clearStoredProvisionKey,
  fetchBrandingFromUrl,
  getStoredProvisionKey,
  listTenants,
  provisionTenant,
  setStoredProvisionKey,
  updateTenantBranding,
  type ProspectBrandingPayload,
  type TenantSummary,
} from '../api/internal';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function DemoBuilderPage() {
  const [apiKey, setApiKey] = useState(getStoredProvisionKey() ?? '');
  const [authenticated, setAuthenticated] = useState(Boolean(getStoredProvisionKey()));
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editSlug, setEditSlug] = useState('');
  const [slug, setSlug] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#003366');
  const [heroHeadline, setHeroHeadline] = useState('');
  const [heroSubheadline, setHeroSubheadline] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importedBranding, setImportedBranding] = useState<ProspectBrandingPayload | null>(null);

  async function loadTenants(key: string) {
    setLoading(true);
    setError(null);
    try {
      const rows = await listTenants(key);
      setTenants(rows);
      setAuthenticated(true);
      setStoredProvisionKey(key);
    } catch {
      setError('Invalid API key or API unreachable.');
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const key = getStoredProvisionKey();
    if (key) {
      void loadTenants(key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleConnect(e: FormEvent) {
    e.preventDefault();
    void loadTenants(apiKey.trim());
  }

  function handleLogout() {
    clearStoredProvisionKey();
    setAuthenticated(false);
    setApiKey('');
    setTenants([]);
  }

  function brandingForSubmit(): ProspectBrandingPayload {
    const base =
      importedBranding ??
      buildProspectBranding({
        companyName,
        logoUrl,
        primaryColor,
        heroHeadline,
        heroSubheadline,
      });

    const baseColors = (base.colors ?? {}) as Record<string, string>;
    const baseHero = (base.hero ?? {}) as Record<string, string | undefined>;

    return {
      ...base,
      companyName: companyName.trim(),
      logoAlt: companyName.trim(),
      logoUrl: logoUrl.trim() || undefined,
      colors: {
        ...baseColors,
        primary: primaryColor,
        navLink: primaryColor,
      },
      hero: {
        ...baseHero,
        headline: heroHeadline.trim(),
        subheadline: heroSubheadline.trim() || undefined,
      },
    };
  }

  async function handleImportFromUrl(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const key = getStoredProvisionKey();
    if (!key) {
      setError('Connect with your provision API key first.');
      return;
    }

    const url = importUrl.trim();
    if (!url) {
      setError('Enter a company website URL to import.');
      return;
    }

    setImporting(true);
    try {
      const result = await fetchBrandingFromUrl(key, url);
      const b = result.branding;
      const colors = b.colors as { primary?: string } | undefined;
      const hero = b.hero as { headline?: string; subheadline?: string } | undefined;

      setImportedBranding(b);
      setMode('create');
      setSlug(result.suggestedSlug);
      setCompanyName(result.companyName);
      setLogoUrl(String(b.logoUrl ?? ''));
      setPrimaryColor(colors?.primary ?? '#003366');
      setHeroHeadline(hero?.headline ?? `Build your career at ${result.companyName}.`);
      setHeroSubheadline(hero?.subheadline ?? '');
      setSuccess(`Imported branding from ${result.sourceUrl}. Review the fields below, then create the demo.`);
    } catch (err: unknown) {
      setError(axiosMessage(err) ?? 'Could not import from that URL.');
    } finally {
      setImporting(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const key = getStoredProvisionKey();
    if (!key) {
      setError('Connect with your provision API key first.');
      return;
    }

    const normalizedSlug = (mode === 'edit' ? editSlug : slug).trim().toLowerCase();
    if (!slugPattern.test(normalizedSlug)) {
      setError('Slug must be lowercase letters, numbers, and hyphens only (e.g. acme-corp).');
      return;
    }

    if (!companyName.trim() || !heroHeadline.trim()) {
      setError('Company name and hero headline are required.');
      return;
    }

    const branding = brandingForSubmit();

    setLoading(true);
    try {
      let demoUrl: string | null = null;
      if (mode === 'create') {
        const result = await provisionTenant(key, {
          slug: normalizedSlug,
          name: companyName.trim(),
          branding,
        });
        demoUrl = result.demo_url;
        await loadTenants(key);
      } else {
        const result = await updateTenantBranding(
          key,
          normalizedSlug,
          branding,
          companyName.trim(),
        );
        demoUrl = result.demo_url;
      }

      const urlHint = demoUrl ? ` Demo URL: ${demoUrl}` : '';
      setSuccess(
        (mode === 'create' ? 'Prospect demo created.' : 'Prospect demo updated.') + urlHint,
      );
      if (mode === 'create') {
        setImportedBranding(null);
        setImportUrl('');
      }
    } catch (err: unknown) {
      const message =
        axiosMessage(err) ??
        (mode === 'create'
          ? 'Could not create tenant. Slug may already exist.'
          : 'Could not update tenant.');
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function axiosMessage(err: unknown): string | null {
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const data = (err as { response?: { data?: { message?: string | string[] } } }).response
        ?.data?.message;
      if (Array.isArray(data)) return data.join(', ');
      if (typeof data === 'string') return data;
    }
    return null;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-brand-background px-6 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-charcoal/10 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-charcoal">Demo Builder</h1>
          <p className="mt-2 text-sm text-charcoal/70">
            Internal tool to create prospect career sites. Enter your backend{' '}
            <code className="text-xs">PROVISION_API_KEY</code>.
          </p>
          <form onSubmit={handleConnect} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-charcoal">
              Provision API key
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1 w-full rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
                required
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? 'Connecting…' : 'Connect'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-background px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-charcoal">Demo Builder</h1>
            <p className="text-sm text-charcoal/70">Create or update prospect demos without SQL.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-charcoal/60 underline hover:text-charcoal"
          >
            Disconnect
          </button>
        </div>

        {tenants.length > 0 && (
          <div className="mt-6 rounded-xl border border-charcoal/10 bg-white p-4">
            <h2 className="text-sm font-semibold text-charcoal">Existing demos</h2>
            <ul className="mt-2 space-y-1 text-sm text-charcoal/80">
              {tenants.map((t) => (
                <li key={t.id}>
                  <strong>{t.name}</strong> ({t.slug})
                  {t.demo_url && (
                    <>
                      {' — '}
                      <a href={t.demo_url} className="text-brand-primary underline" target="_blank" rel="noreferrer">
                        {t.demo_url}
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <form
          onSubmit={handleImportFromUrl}
          className="mt-6 space-y-3 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-charcoal">Import from URL</h2>
          <p className="text-xs text-charcoal/60">
            Paste a prospect homepage to pre-fill logo, colors, and hero copy. You can edit before
            creating the demo.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://company.com"
              className="flex-1 rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={importing || loading}
              className="rounded-lg border border-charcoal/20 px-4 py-2 text-sm font-medium text-charcoal hover:bg-charcoal/5 disabled:opacity-60"
            >
              {importing ? 'Importing…' : 'Import'}
            </button>
          </div>
        </form>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm"
        >
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={mode === 'create'}
                onChange={() => setMode('create')}
              />
              New prospect
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode === 'edit'} onChange={() => setMode('edit')} />
              Update existing
            </label>
          </div>

          {mode === 'edit' ? (
            <label className="block text-sm font-medium text-charcoal">
              Prospect slug
              <select
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                className="mt-1 w-full rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
                required
              >
                <option value="">Select…</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.slug}>
                    {t.slug} — {t.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block text-sm font-medium text-charcoal">
              URL slug (subdomain)
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="acme"
                className="mt-1 w-full rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
                required
              />
              <span className="mt-1 block text-xs text-charcoal/50">
                Becomes acme.&lt;your PLATFORM_DOMAIN&gt;
              </span>
            </label>
          )}

          <label className="block text-sm font-medium text-charcoal">
            Company name
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
              required
            />
          </label>

          <label className="block text-sm font-medium text-charcoal">
            Logo URL
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm font-medium text-charcoal">
            Brand color
            <div className="mt-1 flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-charcoal/20"
              />
              <input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 rounded-lg border border-charcoal/20 px-3 py-2 text-sm font-mono"
              />
            </div>
          </label>

          <label className="block text-sm font-medium text-charcoal">
            Hero headline
            <input
              value={heroHeadline}
              onChange={(e) => setHeroHeadline(e.target.value)}
              className="mt-1 w-full rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
              required
            />
          </label>

          <label className="block text-sm font-medium text-charcoal">
            Hero subheadline
            <textarea
              value={heroSubheadline}
              onChange={(e) => setHeroSubheadline(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-primary px-6 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? 'Saving…' : mode === 'create' ? 'Create demo site' : 'Update demo site'}
          </button>
        </form>

        <p className="mt-6 text-xs text-charcoal/50">
          Demo jobs and a sample candidate are seeded automatically. Do not share this page or your
          API key publicly.
        </p>
      </div>
    </div>
  );
}
