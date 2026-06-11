import type { CandidatePresentation } from '../api/admin';

export type EngagementStepId =
  | 'link_opened'
  | 'pdf_exported'
  | 'terms_accepted'
  | 'interview_requested'
  | 'full_unlocked';

export type EngagementStepStatus = 'completed' | 'current' | 'pending';

export type EngagementStep = {
  id: EngagementStepId;
  label: string;
  status: EngagementStepStatus;
};

type StepDefinition = {
  id: EngagementStepId;
  label: string;
  isComplete: (presentation: CandidatePresentation) => boolean;
};

const BASE_STEPS: StepDefinition[] = [
  {
    id: 'link_opened',
    label: 'Link opened',
    isComplete: (p) => Boolean(p.client_viewed_at),
  },
  {
    id: 'pdf_exported',
    label: 'PDF exported',
    isComplete: (p) => Boolean(p.client_exported_at),
  },
];

const PROTECTION_STEPS: StepDefinition[] = [
  {
    id: 'terms_accepted',
    label: 'Terms accepted',
    isComplete: (p) => Boolean(p.terms_accepted_at),
  },
  {
    id: 'interview_requested',
    label: 'Interview requested',
    isComplete: (p) => Boolean(p.interview_requested_at),
  },
  {
    id: 'full_unlocked',
    label: 'Full profile unlocked',
    isComplete: (p) => p.disclosure_stage === 'full_unlocked',
  },
];

function resolveStepStatuses(
  definitions: StepDefinition[],
  presentation: CandidatePresentation,
): EngagementStep[] {
  const completedFlags = definitions.map((def) => def.isComplete(presentation));
  const firstIncompleteIndex = completedFlags.findIndex((done) => !done);

  return definitions.map((def, index) => {
    if (completedFlags[index]) {
      return { id: def.id, label: def.label, status: 'completed' };
    }
    if (firstIncompleteIndex === index) {
      return { id: def.id, label: def.label, status: 'current' };
    }
    return { id: def.id, label: def.label, status: 'pending' };
  });
}

export function buildEngagementSteps(presentation: CandidatePresentation): EngagementStep[] {
  const definitions = presentation.protection_enabled
    ? [...BASE_STEPS, ...PROTECTION_STEPS]
    : BASE_STEPS;

  return resolveStepStatuses(definitions, presentation);
}

export function showUnlockFullCta(presentation: CandidatePresentation): boolean {
  return (
    Boolean(presentation.protection_enabled) &&
    Boolean(presentation.interview_requested_at) &&
    presentation.disclosure_stage !== 'full_unlocked'
  );
}
