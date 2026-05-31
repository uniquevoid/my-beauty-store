import type { ReactNode } from 'react';

type OptionalExternalLinkProps = {
  href?: string;
  className?: string;
  children: ReactNode;
};

export default function OptionalExternalLink({ href, className, children }: OptionalExternalLinkProps) {
  if (!href) return null;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
