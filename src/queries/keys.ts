export const queryKeys = {
  me: ["me"] as const,
  credits: ["credits"] as const,
  creditLedger: ["creditLedger"] as const,
  chats: ["chats"] as const,
  chatsSearch: (q: string) => ["chats", "search", q] as const,
  messages: (chatId: string) => ["messages", chatId] as const,
  activeRun: (chatId: string) => ["activeRun", chatId] as const,
  tools: ["tools"] as const,
  toolDetail: (name: string) => ["tools", name] as const,
  toolRuns: (name: string) => ["tools", name, "runs"] as const,
  toolRun: (runId: string) => ["toolRuns", runId] as const,
  assets: (params?: { type?: string; source?: string }) => ["assets", params?.type ?? null, params?.source ?? null] as const,
};
