import { ChatMessages } from "@/components/chat/chat-messages";
import { ComposerActions, ComposerProvider, ComposerRoot, ComposerTextarea } from "@/components/composer/composer";

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ChatMessages chatId={chatId} />
      </div>
      <div className="px-6 pb-6">
        <ComposerProvider>
          <ComposerRoot>
            <ComposerTextarea />
            <ComposerActions />
          </ComposerRoot>
        </ComposerProvider>
      </div>
    </div>
  );
}
