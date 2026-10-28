import { Sparkles } from "lucide-react";
import { ComposerActions, ComposerProvider, ComposerRoot, ComposerTextarea } from "@/components/composer/composer";
import { Clock } from "@/components/home/clock";

export default function NewChatPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="mx-auto flex w-full max-w-[1000px] flex-col items-center gap-12 px-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Sparkles className="size-7 text-brand-primary" />
          <Clock />
          <h1 className="text-[24px] leading-8 font-bold text-text-primary">Your AI worker</h1>
          <p className="text-sm leading-6 font-medium text-text-secondary">Work at the speed of thought.</p>
        </div>

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
