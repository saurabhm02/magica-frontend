export const queryKeys = {
  me: ["me"] as const,
  chats: ["chats"] as const,
  // Not under "chats": invalidating the chat list must not refetch every message list.
  messages: (chatId: string) => ["messages", chatId] as const,
};
