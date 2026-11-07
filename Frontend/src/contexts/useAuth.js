import { createContext, useContext } from 'react';

// Kept apart from AuthProvider so AuthContext.jsx only exports a component
// (React Fast Refresh requirement).
export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
