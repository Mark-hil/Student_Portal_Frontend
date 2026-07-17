import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { authApi, usersApi } from '../api/services';
import type { ApiError } from '../types';
import { AxiosError } from 'axios';

export function useAuth() {
  const { user, isAuthenticated, setUser, setTokens, logout: storeLogout } = useAuthStore();
  const qc = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: ({ data }) => {
      setTokens(data.tokens.access, data.tokens.refresh);
      setUser(data.user);
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: { email: string; password: string; first_name: string; last_name: string; role: string }) =>
      authApi.register(data),
    onSuccess: ({ data }) => {
      setTokens(data.tokens.access, data.tokens.refresh);
      setUser(data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => { storeLogout(); qc.clear(); },
  });

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.me().then(r => r.data),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const getFieldErrors = (error: unknown): Record<string, string> => {
    const e = error as AxiosError<ApiError>;
    const errors = e?.response?.data?.errors ?? {};
    return Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]));
  };

  return {
    user: meQuery.data ?? user,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    getFieldErrors,
  };
}
