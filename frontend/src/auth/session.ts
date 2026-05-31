export const CANDIDATE_AUTH_CHANGED = 'candidate-auth-changed';

function notifyAuthChanged() {
  window.dispatchEvent(new Event(CANDIDATE_AUTH_CHANGED));
}

export function getCandidateToken() {
  return localStorage.getItem('candidate_token');
}

export function isCandidateLoggedIn() {
  return Boolean(getCandidateToken());
}

export function setCandidateToken(token: string) {
  localStorage.setItem('candidate_token', token);
  notifyAuthChanged();
}

export function clearCandidateToken() {
  localStorage.removeItem('candidate_token');
  notifyAuthChanged();
}

