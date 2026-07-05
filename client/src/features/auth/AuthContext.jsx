import { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meRequest, loginRequest, registerRequest, logoutRequest } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  // The cookie is the source of truth; /me hydrates auth state on load and after mutations.
  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: meRequest,
    retry: false, // a 401 is a normal "not signed in", not a failure to retry
    staleTime: 5 * 60 * 1000,
  });

  const setUser = (res) => queryClient.setQueryData(['auth', 'me'], res);

  const login = useMutation({ mutationFn: loginRequest, onSuccess: setUser });
  const register = useMutation({ mutationFn: registerRequest, onSuccess: setUser });
  const logout = useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => queryClient.setQueryData(['auth', 'me'], null),
  });

  const value = {
    user: data?.user ?? null,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
