import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { isGoogleConfigured } from "../lib/google-auth";
import { fetchAuthMe } from "../services/authApi";
import { useStore } from "../store";

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

export const useAuthMeSync = () => {
  const token = useStore((s) => s.token);
  const loading = useStore((s) => s.loading);
  const applyServerUser = useStore((s) => s.applyServerUser);
  const markAuthFallback = useStore((s) => s.markAuthFallback);
  const setAuthLoading = useStore((s) => s.setAuthLoading);

  const query = useQuery({
    queryKey: [...AUTH_ME_QUERY_KEY, token],
    queryFn: () => fetchAuthMe(token as string),
    enabled: Boolean(token) && isGoogleConfigured && loading,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!query.isSuccess) return;
    applyServerUser(query.data);
    setAuthLoading(false);
  }, [applyServerUser, query.data, query.isSuccess, setAuthLoading]);

  useEffect(() => {
    if (!query.isError) return;
    markAuthFallback();
    setAuthLoading(false);
  }, [markAuthFallback, query.isError, setAuthLoading]);

  return query;
};
