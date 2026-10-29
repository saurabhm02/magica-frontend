import {
  CreateToolRunRequest,
  CreateToolRunResponse,
  ListToolRunsQuery,
  ListToolRunsResponse,
  ListToolsResponse,
  ToolDetailResponse,
  ToolRunResponse,
} from "@/contracts/api";
import { request } from "./api-client";

export function listTools(token: string) {
  return request("/tools", { schema: ListToolsResponse, token });
}

export function getToolDetail(token: string, name: string) {
  return request(`/tools/${name}`, { schema: ToolDetailResponse, token });
}

export function createToolRun(token: string, name: string, body: CreateToolRunRequest) {
  return request(`/tools/${name}/runs`, { method: "POST", body, schema: CreateToolRunResponse, token });
}

export function listToolRuns(token: string, name: string, query: Partial<ListToolRunsQuery>) {
  return request(`/tools/${name}/runs`, { query, schema: ListToolRunsResponse, token });
}

export function getToolRun(token: string, runId: string) {
  return request(`/tool-runs/${runId}`, { schema: ToolRunResponse, token });
}
