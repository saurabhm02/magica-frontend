export const queryKeys = {
  me: ["me"] as const,
  credits: ["credits"] as const,
  creditLedger: ["creditLedger"] as const,
  chats: ["chats"] as const,
  messages: (chatId: string) => ["messages", chatId] as const,
  activeRun: (chatId: string) => ["activeRun", chatId] as const,
};
