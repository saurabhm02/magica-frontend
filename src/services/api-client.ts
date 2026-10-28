import type { z } from "zod";
import { ErrorResponse, type ErrorCode } from "@/contracts/errors";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/v1`;

export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode | "NETWORK",
    message: string,
    public readonly retryable: boolean,
    public readonly traceId: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions<T> = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  schema: z.ZodType<T>;
  token: string;
};

export async function request<T>(
  path: string,
  { method = "GET", body, query, schema, token }: RequestOptions<T>,
): Promise<T> {
  const url = new URL(API_BASE + path);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined && { "Content-Type": "application/json" }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("NETWORK", "Could not reach the server. Check your connection.", true, "", 0);
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = ErrorResponse.safeParse(json);
    if (parsed.success) {
      const { code, message, retryable, traceId } = parsed.data.error;
      throw new ApiError(code, message, retryable, traceId, response.status);
    }
    throw new ApiError("INTERNAL", "Something went wrong", false, "", response.status);
  }

  return schema.parse(json);
}
