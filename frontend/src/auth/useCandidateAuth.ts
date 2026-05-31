import { useCallback, useEffect, useState } from 'react';
import { CANDIDATE_AUTH_CHANGED, clearCandidateToken, isCandidateLoggedIn } from './session';

export function useCandidateAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(isCandidateLoggedIn);

  useEffect(() => {
    const sync = () => setIsLoggedIn(isCandidateLoggedIn());
    window.addEventListener(CANDIDATE_AUTH_CHANGED, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CANDIDATE_AUTH_CHANGED, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const signOut = useCallback(() => {
    clearCandidateToken();
    setIsLoggedIn(false);
  }, []);

  return { isLoggedIn, signOut };
}
