import { MeResponse } from "@/contracts/api";
import { request } from "./api-client";

export function getMe(token: string) {
  return request("/me", { schema: MeResponse, token });
}
