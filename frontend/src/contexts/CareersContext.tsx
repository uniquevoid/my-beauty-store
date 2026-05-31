import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchCurrentTenant } from '../api/tenant';
import { defaultCareersConfig, mergeCareersConfig, type CareersConfig } from '../config/careers';

type CareersContextValue = {
  careers: CareersConfig;
  loading: boolean;
};

const CareersContext = createContext<CareersContextValue>({
  careers: defaultCareersConfig,
  loading: true,
});

export function CareersContextProvider({ children }: { children: ReactNode }) {
  const [careers, setCareers] = useState<CareersConfig>(defaultCareersConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tenant = await fetchCurrentTenant();
        if (cancelled) return;
        setCareers(mergeCareersConfig(tenant.careers));
      } catch {
        setCareers(defaultCareersConfig);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ careers, loading }), [careers, loading]);

  return <CareersContext.Provider value={value}>{children}</CareersContext.Provider>;
}

export function useCareers() {
  return useContext(CareersContext);
}
