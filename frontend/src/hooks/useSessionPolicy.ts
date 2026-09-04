// src/hooks/useSessionPolicy.ts
// Applies the administrator-configured inactivity timeout (FR-010) by signing
// the user out after a period with no interaction.

import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export interface ClientPolicy {
  tenant: string | null;
  is_admin: boolean;
  session: {
    max_concurrent_sessions: number;
    session_lifetime_minutes: number;
    inactivity_timeout_minutes: number;
  };
  feature_flags: Record<string, boolean>;
}

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ['mousedown', 'keydown', 'touchstart', 'wheel', 'focus'];

export function useSessionPolicy(): { policy: ClientPolicy | null } {
  const { isAuthenticated, logout } = useAuth();
  const [policy, setPolicy] = useState<ClientPolicy | null>(null);
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    if (!isAuthenticated) {
      setPolicy(null);
      return;
    }
    let cancelled = false;
    api
      .get<ClientPolicy>('/client-policy/')
      .then(res => {
        if (!cancelled) setPolicy(res.data);
      })
      .catch(() => {
        /* policy is advisory; the backend still enforces token lifetimes */
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const timeoutMinutes = policy?.session.inactivity_timeout_minutes ?? 0;

  useEffect(() => {
    if (!isAuthenticated || timeoutMinutes <= 0) return;

    const markActive = () => {
      lastActivity.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, markActive, { passive: true }));

    const limitMs = timeoutMinutes * 60_000;
    const interval = window.setInterval(() => {
      if (Date.now() - lastActivity.current >= limitMs) {
        window.clearInterval(interval);
        void logout();
      }
    }, 30_000);

    return () => {
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, markActive));
      window.clearInterval(interval);
    };
  }, [isAuthenticated, timeoutMinutes, logout]);

  return { policy };
}
