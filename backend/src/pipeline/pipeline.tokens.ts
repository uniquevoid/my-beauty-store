import crypto from 'crypto';

export function makeInviteToken() {
  return crypto.randomBytes(18).toString('base64url');
}

export function makeShareToken() {
  return crypto.randomBytes(24).toString('base64url');
}

export function formatCandidateDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Candidate';
  if (parts.length === 1) return parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() ?? '';
  return lastInitial ? `${parts[0]} ${lastInitial}.` : parts[0];
}
