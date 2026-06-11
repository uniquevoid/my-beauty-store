import { useEffect, useState } from 'react';
import {
  CalendarClock,
  Check,
  Copy,
  ExternalLink,
  Eye,
  FileDown,
  Link2,
  Lock,
  RotateCcw,
  ShieldCheck,
  Unlock,
  type LucideIcon,
} from 'lucide-react';
import type { CandidatePresentation, IntroductionAuditEvent } from '../../api/admin';
import {
  buildEngagementSteps,
  showUnlockFullCta,
  type EngagementStep,
  type EngagementStepStatus,
} from '../engagementSteps';

export type ClientShareLinkWidgetProps = {
  shareUrl: string;
  presentation: CandidatePresentation;
  auditEvents: IntroductionAuditEvent[];
  busy: boolean;
  onCopy: () => void | Promise<void>;
  onPreview: () => void;
  onResetEngagement: () => void | Promise<void>;
  onUnlockFull?: () => void | Promise<void>;
};

const AUDIT_EVENT_META: Record<string, { label: string; icon: LucideIcon }> = {
  viewed: { label: 'Link opened', icon: Eye },
  export_pdf: { label: 'PDF exported', icon: FileDown },
  terms_accepted: { label: 'Terms accepted', icon: ShieldCheck },
  interview_requested: { label: 'Interview requested', icon: CalendarClock },
  full_unlocked: { label: 'Full profile unlocked', icon: Unlock },
};

const actionButtonBase =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 px-4 text-sm font-medium transition-colors duration-200 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

export default function ClientShareLinkWidget({
  shareUrl,
  presentation,
  auditEvents,
  busy,
  onCopy,
  onPreview,
  onResetEngagement,
  onUnlockFull,
}: ClientShareLinkWidgetProps) {
  const [copied, setCopied] = useState(false);
  const steps = buildEngagementSteps(presentation);
  const unlockVisible = showUnlockFullCta(presentation);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    await onCopy();
    setCopied(true);
  }

  return (
    <section
      aria-labelledby="client-share-link-heading"
      className="rounded-xl border border-slate-100/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]"
    >
      <header className="mb-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-600">
            <Link2 className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h4 id="client-share-link-heading" className="text-base font-semibold text-slate-900">
              Client share link
            </h4>
            <p className="mt-1 text-sm text-slate-600">
              Send this link to your client. Use Preview for internal review — preview visits are
              not tracked.
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        <div
          aria-label="Client presentation share URL"
          className="flex items-start gap-3 rounded-lg border border-slate-200/80 bg-slate-50/90 px-4 py-3"
        >
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          <p className="select-all break-all font-mono text-sm text-slate-800">{shareUrl}</p>
        </div>

        <div className="flex flex-col gap-2 sm:inline-flex sm:flex-row sm:overflow-hidden sm:rounded-lg sm:border sm:border-slate-200">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className={`${actionButtonBase} rounded-lg bg-slate-800 text-white hover:bg-slate-700 sm:rounded-none`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" aria-hidden />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden />
                Copy client link
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onPreview}
            className={`${actionButtonBase} rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 sm:rounded-none sm:border-0 sm:border-l sm:border-slate-200`}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Preview
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onResetEngagement()}
            className={`${actionButtonBase} rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-700 sm:rounded-none sm:border-0 sm:border-l sm:border-slate-200`}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reset engagement
          </button>
        </div>

        <EngagementStepper steps={steps} />

        {unlockVisible && onUnlockFull && (
          <div className="border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onUnlockFull()}
              className={`${actionButtonBase} rounded-lg bg-brand-primary px-5 text-white hover:opacity-90`}
            >
              <Unlock className="h-4 w-4" aria-hidden />
              Unlock full presentation
            </button>
          </div>
        )}

        {auditEvents.length > 0 && <AuditTrailTimeline events={auditEvents} />}
      </div>
    </section>
  );
}

function EngagementStepper({ steps }: { steps: EngagementStep[] }) {
  return (
    <div className="border-t border-slate-100 pt-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
        Client engagement
      </p>

      <ol
        aria-label="Client engagement milestones"
        className="hidden gap-0 sm:flex sm:items-start sm:justify-between"
      >
        {steps.map((step, index) => (
          <li
            key={step.id}
            className="flex min-w-0 flex-1 flex-col items-center"
            aria-current={step.status === 'current' ? 'step' : undefined}
          >
            <div className="flex w-full items-center">
              {index > 0 && (
                <span
                  className={`h-0.5 flex-1 motion-reduce:transition-none ${connectorClass(step.status, steps[index - 1]?.status)}`}
                  aria-hidden
                />
              )}
              <StepNode status={step.status} />
              {index < steps.length - 1 && (
                <span
                  className={`h-0.5 flex-1 motion-reduce:transition-none ${connectorClass(steps[index + 1]?.status, step.status)}`}
                  aria-hidden
                />
              )}
            </div>
            <p className={`mt-2 px-1 text-center text-xs leading-snug ${labelClass(step.status)}`}>
              {step.label}
            </p>
          </li>
        ))}
      </ol>

      <ol aria-label="Client engagement milestones" className="space-y-0 sm:hidden">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className="flex gap-3"
            aria-current={step.status === 'current' ? 'step' : undefined}
          >
            <div className="flex flex-col items-center">
              <StepNode status={step.status} />
              {index < steps.length - 1 && (
                <span
                  className={`my-1 w-px flex-1 min-h-6 ${step.status === 'completed' ? 'bg-slate-300' : 'bg-slate-200'}`}
                  aria-hidden
                />
              )}
            </div>
            <p className={`pb-4 pt-1 text-sm ${labelClass(step.status)}`}>{step.label}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepNode({ status }: { status: EngagementStepStatus }) {
  if (status === 'completed') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white">
        <Check className="h-4 w-4" aria-hidden />
      </span>
    );
  }

  if (status === 'current') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 ring-2 ring-sky-600 ring-offset-2" />
    );
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100" />
  );
}

function connectorClass(nextStatus: EngagementStepStatus | undefined, prevStatus: EngagementStepStatus) {
  if (prevStatus === 'completed') return 'bg-slate-300';
  if (nextStatus === 'completed') return 'bg-slate-300';
  return 'bg-slate-100';
}

function labelClass(status: EngagementStepStatus) {
  if (status === 'completed') return 'font-medium text-slate-800';
  if (status === 'current') return 'font-semibold text-slate-900';
  return 'text-slate-500';
}

function AuditTrailTimeline({ events }: { events: IntroductionAuditEvent[] }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
      <p className="mb-3 text-sm font-medium text-slate-900">Audit trail</p>
      <ol className="max-h-48 space-y-0 overflow-y-auto">
        {events.map((event, index) => {
          const meta = AUDIT_EVENT_META[event.event_type] ?? {
            label: event.event_type.replace(/_/g, ' '),
            icon: Eye,
          };
          const Icon = meta.icon;
          const isLast = index === events.length - 1;

          return (
            <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                {!isLast && <span className="mt-1 w-px flex-1 bg-slate-200" aria-hidden />}
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-medium text-slate-900">{meta.label}</p>
                <time
                  dateTime={event.created_at}
                  className="text-xs tabular-nums text-slate-500"
                >
                  {new Date(event.created_at).toLocaleString()}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
