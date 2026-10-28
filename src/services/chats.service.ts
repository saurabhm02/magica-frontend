import { Chat } from "@/contracts/chat";
import {
  CreateChatRequest,
  DeleteChatResponse,
  ListChatsQuery,
  ListChatsResponse,
  UpdateChatRequest,
} from "@/contracts/api";
import { request } from "./api-client";

export function listChats(token: string, query: Partial<ListChatsQuery>) {
  return request("/chats", { query, schema: ListChatsResponse, token });
}

export function createChat(token: string, body: CreateChatRequest) {
  return request("/chats", { method: "POST", body, schema: Chat, token });
}

export function updateChat(token: string, chatId: string, body: UpdateChatRequest) {
  return request(`/chats/${chatId}`, { method: "PATCH", body, schema: Chat, token });
}

export function deleteChat(token: string, chatId: string) {
  return request(`/chats/${chatId}`, { method: "DELETE", schema: DeleteChatResponse, token });
}
