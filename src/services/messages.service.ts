import { ListMessagesQuery, ListMessagesResponse, SendMessageRequest, SendMessageResponse } from "@/contracts/api";
import { request } from "./api-client";

export function listMessages(token: string, chatId: string, query: Partial<ListMessagesQuery>) {
  return request(`/chats/${chatId}/messages`, { query, schema: ListMessagesResponse, token });
}

// Server route isn't built yet — this will start working once it ships.
export function sendMessage(token: string, chatId: string, body: SendMessageRequest) {
  return request(`/chats/${chatId}/messages`, { method: "POST", body, schema: SendMessageResponse, token });
}
