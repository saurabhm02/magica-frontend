import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiError, request } from "@/services/api-client";
import { server } from "../mocks/server";

const schema = z.object({ ok: z.boolean() });
const url = "http://localhost:4000/api/v1/ping";

describe("request", () => {
  it("parses a successful response with the given schema", async () => {
    server.use(http.get(url, () => HttpResponse.json({ ok: true })));

    await expect(request("/ping", { schema, token: "t" })).resolves.toEqual({ ok: true });
  });

  it("maps an ErrorResponse body to ApiError", async () => {
    server.use(
      http.get(url, () =>
        HttpResponse.json(
          { error: { code: "NOT_FOUND", message: "Chat not found", retryable: false, traceId: "trace-1" } },
          { status: 404 },
        ),
      ),
    );

    const error: ApiError = await request("/ping", { schema, token: "t" }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: "NOT_FOUND",
      message: "Chat not found",
      retryable: false,
      traceId: "trace-1",
      status: 404,
    });
  });

  it("throws a NETWORK ApiError when the request itself fails", async () => {
    server.use(http.get(url, () => HttpResponse.error()));

    const error: ApiError = await request("/ping", { schema, token: "t" }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("NETWORK");
    expect(error.retryable).toBe(true);
  });
});
