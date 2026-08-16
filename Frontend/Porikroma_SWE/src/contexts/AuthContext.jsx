import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { apiClient } from '../services/apiClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const restoreSession = (session) => {
      if (!active) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Defer the API call so it does not run inside Supabase's auth event
        // lock. This prevents a stale session/token race after login/refresh.
        window.setTimeout(() => { if (active) fetchProfileAndRole(); }, 0);
      } else {
        setProfile(null);
        setRoles([]);
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => restoreSession(session));

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          window.setTimeout(() => { if (active) fetchProfileAndRole(); }, 0);
        }
      } else {
        setProfile(null);
        setRoles([]);
        setLoading(false);
      }
    });

    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const fetchProfileAndRole = async () => {
    try {
      const response = await apiClient.get('/api/v1/users/me');
      const data = response.data;
      setProfile(data.profile || data);
      setRoles(data.roles || (data.role ? [data.role] : []));
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, roles, role: roles[0] || profile?.role || null, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
