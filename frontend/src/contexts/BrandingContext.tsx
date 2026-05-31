import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchCurrentTenant } from '../api/tenant';
import {
  applyBrandingTheme,
  branding as defaultBranding,
  type BrandingConfig,
} from '../config/branding';
import { deriveProspectNavLinks, mergeProspectFooter } from '../lib/derive-prospect-nav';

type BrandingContextValue = {
  branding: BrandingConfig;
  tenantName: string;
  loading: boolean;
};

const BrandingContext = createContext<BrandingContextValue>({
  branding: defaultBranding,
  tenantName: defaultBranding.companyName,
  loading: true,
});

function isProspectTenant(partial: Partial<BrandingConfig>): boolean {
  return partial.source?.method === 'playwright' || partial.source?.method === 'fetch-fallback';
}

function mergeLanding(
  partialLanding: Partial<BrandingConfig['landing']> | undefined,
  isProspect: boolean,
): BrandingConfig['landing'] {
  const d = defaultBranding.landing;

  if (!isProspect) {
    return {
      ...d,
      ...partialLanding,
      about: { ...d.about, ...partialLanding?.about },
      customers: { ...d.customers, ...partialLanding?.customers },
      technology: { ...d.technology, ...partialLanding?.technology },
      coreValues: { ...d.coreValues, ...partialLanding?.coreValues },
      lifeAt: { ...d.lifeAt, ...partialLanding?.lifeAt },
      testimonials: { ...d.testimonials, ...partialLanding?.testimonials },
      jobAlerts: {
        ...d.jobAlerts,
        ...partialLanding?.jobAlerts,
        body: partialLanding?.jobAlerts?.body?.length
          ? partialLanding.jobAlerts.body
          : d.jobAlerts.body,
      },
      sections: partialLanding?.sections ?? d.sections,
    };
  }

  const p = partialLanding;

  return {
    sections: p?.sections,
    about: p?.about
      ? {
          heading: p.about.heading ?? d.about.heading,
          body: p.about.body ?? '',
          stats: p.about.stats ?? [],
          ctaLabel: p.about.ctaLabel ?? d.about.ctaLabel,
          ctaHref: p.about.ctaHref,
        }
      : { ...d.about, body: '', stats: [] },
    customers: {
      heading: p?.customers?.heading ?? d.customers.heading,
      logos: p?.customers?.logos ?? [],
    },
    technology: p?.technology
      ? {
          heading: p.technology.heading ?? d.technology.heading,
          body: p.technology.body ?? '',
          imageUrl: p.technology.imageUrl,
          ctaLabel: p.technology.ctaLabel ?? d.technology.ctaLabel,
          ctaHref: p.technology.ctaHref,
        }
      : { ...d.technology, body: '', imageUrl: undefined },
    coreValues: {
      heading: p?.coreValues?.heading ?? d.coreValues.heading,
      values: p?.coreValues?.values ?? [],
    },
    lifeAt: p?.lifeAt
      ? {
          heading: p.lifeAt.heading ?? d.lifeAt.heading,
          subheading: p.lifeAt.subheading ?? '',
          leftImageUrl: p.lifeAt.leftImageUrl,
          rightImageUrl: p.lifeAt.rightImageUrl,
          ctaLabel: p.lifeAt.ctaLabel ?? d.lifeAt.ctaLabel,
          ctaHref: p.lifeAt.ctaHref,
        }
      : { ...d.lifeAt, subheading: '', leftImageUrl: undefined, rightImageUrl: undefined },
    testimonials: {
      items: p?.testimonials?.items ?? [],
    },
    cultureSpotlight: p?.cultureSpotlight,
    jobAlerts: {
      ...d.jobAlerts,
      ...p?.jobAlerts,
      body: p?.jobAlerts?.body?.length ? p.jobAlerts.body : d.jobAlerts.body,
    },
  };
}

function mergeBranding(partial: Partial<BrandingConfig>): BrandingConfig {
  const isProspect = isProspectTenant(partial);
  const companyName = partial.companyName?.trim() || defaultBranding.companyName;

  const landing = mergeLanding(partial.landing, isProspect);

  const merged: BrandingConfig = {
    ...defaultBranding,
    ...partial,
    colors: { ...defaultBranding.colors, ...partial.colors },
    hero: { ...defaultBranding.hero, ...partial.hero },
    ...(partial.typography ? { typography: partial.typography } : {}),
    theme: partial.theme
      ? { ...defaultBranding.theme, ...partial.theme }
      : defaultBranding.theme,
    components: partial.components
      ? {
          hero: partial.components.hero ?? defaultBranding.components?.hero,
          header: {
            ...defaultBranding.components?.header,
            ...partial.components.header,
          },
          primaryButton: {
            ...defaultBranding.components?.primaryButton,
            ...partial.components.primaryButton,
          },
        }
      : defaultBranding.components,
    assets: { ...defaultBranding.assets, ...partial.assets },
    source: partial.source ?? defaultBranding.source,
    landing,
    languages: partial.languages ?? (isProspect ? undefined : defaultBranding.languages),
    footer: isProspect
      ? mergeProspectFooter(partial, companyName)
      : {
          ...defaultBranding.footer,
          ...partial.footer,
          legalLinks: { ...defaultBranding.footer.legalLinks, ...partial.footer?.legalLinks },
          socialLinks: { ...defaultBranding.footer.socialLinks, ...partial.footer?.socialLinks },
        },
    navLinks:
      partial.navLinks && partial.navLinks.length > 0
        ? partial.navLinks
        : isProspect
          ? deriveProspectNavLinks({ ...defaultBranding, ...partial, landing } as BrandingConfig)
          : defaultBranding.navLinks,
  };

  return merged;
}

export function BrandingContextProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);
  const [tenantName, setTenantName] = useState(defaultBranding.companyName);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tenant = await fetchCurrentTenant();
        if (cancelled) return;
        const merged = mergeBranding(tenant.branding as Partial<BrandingConfig>);
        if (tenant.name && !merged.companyName) {
          merged.companyName = tenant.name;
        }
        setBranding(merged);
        setTenantName(tenant.name || merged.companyName);
        applyBrandingTheme(merged);
      } catch {
        applyBrandingTheme(defaultBranding);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ branding, tenantName, loading }), [branding, tenantName, loading]);

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}
