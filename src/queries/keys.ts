export const queryKeys = {
  me: ["me"] as const,
  chats: ["chats"] as const,
  messages: (chatId: string) => ["messages", chatId] as const,
};
