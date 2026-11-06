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

  const fetchProfileAndRole = async () => {
    try {
      const response = await apiClient.get('/api/v1/users/me');
      const data = response?.data;
      if (data) {
        setProfile(data.profile || data);
        setRoles(data.roles || (data.role ? [data.role] : []));
      }
    } catch (err) {
      console.warn('Profile fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const restoreSession = (sess) => {
      if (!active) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        window.setTimeout(() => {
          if (active) fetchProfileAndRole();
        }, 0);
      } else {
        setProfile(null);
        setRoles([]);
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session: sess } }) => restoreSession(sess)).catch(() => {
      if (active) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!active) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        window.setTimeout(() => {
          if (active) fetchProfileAndRole();
        }, 0);
      } else {
        setProfile(null);
        setRoles([]);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const logout = async () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  };

  const primaryRole = roles[0] || profile?.role || 'traveler';

  return (
    <AuthContext.Provider value={{ user, session, profile, roles, role: primaryRole, loading, logout, refreshProfile: fetchProfileAndRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
