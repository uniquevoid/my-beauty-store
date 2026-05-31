import { useCareers } from '../contexts/CareersContext';
import { workplaceTypeLabel, type WorkplaceTypeKey } from '../config/careers';

type WorkplaceTypeBadgeProps = {
  type: string | null | undefined;
  className?: string;
};

export default function WorkplaceTypeBadge({ type, className = '' }: WorkplaceTypeBadgeProps) {
  const { careers } = useCareers();
  const label = workplaceTypeLabel(type, careers.workplaceTypes);
  if (!label) return null;

  return (
    <span
      className={`inline-flex items-center rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium text-charcoal ${className}`}
    >
      {label}
    </span>
  );
}

export function isWorkplaceTypeKey(value: string): value is WorkplaceTypeKey {
  return value === 'remote' || value === 'hybrid' || value === 'in_office';
}
