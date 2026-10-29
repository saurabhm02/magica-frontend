import {
  ActiveRunResponse,
  CancelRunResponse,
  ListMessagesQuery,
  ListMessagesResponse,
  SendMessageRequest,
  SendMessageResponse,
} from "@/contracts/api";
import { request } from "./api-client";

export function listMessages(token: string, chatId: string, query: Partial<ListMessagesQuery>) {
  return request(`/chats/${chatId}/messages`, { query, schema: ListMessagesResponse, token });
}

export function sendMessage(token: string, chatId: string, body: SendMessageRequest) {
  return request(`/chats/${chatId}/messages`, { method: "POST", body, schema: SendMessageResponse, token });
}

export function cancelRun(token: string, chatId: string, runId: string) {
  return request(`/chats/${chatId}/runs/${runId}/cancel`, { method: "POST", schema: CancelRunResponse, token });
}

export function getActiveRun(token: string, chatId: string) {
  return request(`/chats/${chatId}/active-run`, { method: "GET", schema: ActiveRunResponse, token });
}
