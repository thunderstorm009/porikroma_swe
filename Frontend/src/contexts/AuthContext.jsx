import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthContext } from './useAuth';
import { supabase } from '../services/supabase';
import { apiClient } from '../services/apiClient';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  // Which user the loaded profile/roles belong to. Token refreshes keep the same
  // user, so they must not reload the profile or flash the loading screen.
  const loadedUserId = useRef(null);
  const requestSeq = useRef(0);

  const fetchProfileAndRole = useCallback(async () => {
    const seq = ++requestSeq.current;
    try {
      const response = await apiClient.get('/api/v1/users/me');
      const data = response?.data;
      if (seq !== requestSeq.current || !data) return;
      setProfile(data.profile || data);
      setRoles(data.roles || (data.role ? [data.role] : []));
    } catch (err) {
      console.warn('Profile fetch notice:', err);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const applySession = (sess) => {
      if (!active) return;
      setSession(sess);
      const nextUser = sess?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        loadedUserId.current = null;
        requestSeq.current += 1; // discard any in-flight profile response
        setProfile(null);
        setRoles([]);
        setLoading(false);
        return;
      }
      if (loadedUserId.current === nextUser.id) return;
      loadedUserId.current = nextUser.id;
      // Hold protected routes until this user's roles are known, so role-gated
      // pages don't redirect away right after sign-in.
      setLoading(true);
      // Deferred: Supabase warns against awaiting other calls inside its auth callback.
      window.setTimeout(() => {
        if (active) fetchProfileAndRole();
      }, 0);
    };

    supabase.auth.getSession()
      .then(({ data: { session: sess } }) => applySession(sess))
      .catch(() => { if (active) setLoading(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => applySession(sess));

    return () => {
      active = false;
      subscription?.unsubscribe?.();
    };
  }, [fetchProfileAndRole]);

  const logout = useCallback(async () => {
    loadedUserId.current = null;
    requestSeq.current += 1;
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    try {
      await supabase.auth.signOut();
    } catch {
      // Local state is already cleared; a failed network sign-out only leaves a server session to expire.
    }
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    roles,
    role: roles[0] || profile?.role || 'traveler',
    loading,
    logout,
    refreshProfile: fetchProfileAndRole,
  }), [user, session, profile, roles, loading, logout, fetchProfileAndRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
