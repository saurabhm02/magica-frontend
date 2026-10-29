import { ListAssetsQuery, ListAssetsResponse } from "@/contracts/api";
import { request } from "./api-client";

export function listAssets(token: string, query: Partial<ListAssetsQuery>) {
  return request("/assets", { query, schema: ListAssetsResponse, token });
}
