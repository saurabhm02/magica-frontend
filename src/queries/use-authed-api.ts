"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ApiError } from "@/services/api-client";

// Wraps a service call with a fresh Clerk token. Redirects to sign-in when
// there's no token, or when the server rejects the one we sent.
export function useAuthedApi() {
  const { getToken } = useAuth();
  const router = useRouter();

  return async function withAuth<T>(call: (token: string) => Promise<T>): Promise<T> {
    const token = await getToken();
    if (!token) {
      router.push("/sign-in");
      throw new ApiError("UNAUTHORIZED", "Not signed in", false, "", 401);
    }

    try {
      return await call(token);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) router.push("/sign-in");
      throw error;
    }
  };
}
