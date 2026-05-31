import type { ReactNode } from 'react';
import { BrandingContextProvider } from '../contexts/BrandingContext';
import { CareersContextProvider } from '../contexts/CareersContext';

export default function BrandingProvider({ children }: { children: ReactNode }) {
  return (
    <BrandingContextProvider>
      <CareersContextProvider>{children}</CareersContextProvider>
    </BrandingContextProvider>
  );
}
