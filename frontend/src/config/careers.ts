export type AreaOfInterestConfig = {
  label: string;
  options: string[];
};

export type WorkplaceTypeKey = 'remote' | 'hybrid' | 'in_office';

export type WorkplaceTypesConfig = Record<WorkplaceTypeKey, string>;

export type CareersConfig = {
  areaOfInterest: AreaOfInterestConfig;
  workplaceTypes: WorkplaceTypesConfig;
};

export const DEFAULT_AREA_OF_INTEREST_OPTIONS = [
  'Quality Assurance',
  'Development',
  'Consulting',
  'Account Management',
] as const;

export const defaultWorkplaceTypes: WorkplaceTypesConfig = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  in_office: 'In-office',
};

export const defaultCareersConfig: CareersConfig = {
  areaOfInterest: {
    label: 'Area of Interest',
    options: [...DEFAULT_AREA_OF_INTEREST_OPTIONS],
  },
  workplaceTypes: { ...defaultWorkplaceTypes },
};

export function mergeCareersConfig(partial?: Partial<CareersConfig> | null): CareersConfig {
  if (!partial) return defaultCareersConfig;

  return {
    areaOfInterest: {
      label: partial.areaOfInterest?.label ?? defaultCareersConfig.areaOfInterest.label,
      options:
        partial.areaOfInterest?.options?.length
          ? partial.areaOfInterest.options
          : defaultCareersConfig.areaOfInterest.options,
    },
    workplaceTypes: {
      ...defaultCareersConfig.workplaceTypes,
      ...partial.workplaceTypes,
    },
  };
}

export function workplaceTypeLabel(
  type: string | null | undefined,
  config: WorkplaceTypesConfig = defaultWorkplaceTypes,
): string | null {
  if (!type) return null;
  if (type in config) return config[type as WorkplaceTypeKey];
  return type;
}
