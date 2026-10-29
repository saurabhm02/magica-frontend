"use client";

import { ComposerActions, ComposerError, ComposerProvider, ComposerRoot, ComposerTextarea } from "@/components/composer/composer";
import { useSubmitMessage } from "@/components/chat/use-submit-message";
import { Clock } from "@/components/home/clock";
import { MagicaMascot } from "@/components/icons/magica-mascot";

export default function NewChatPage() {
  const submit = useSubmitMessage();

  return (
    <div className="flex h-full items-center justify-center">
      <div className="mx-auto flex w-full max-w-[1000px] flex-col items-center gap-12 px-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <MagicaMascot />
          <Clock />
          <h1 className="text-[24px] leading-8 font-bold text-text-primary">Your AI worker</h1>
          <p className="text-sm leading-6 font-medium text-text-secondary">Work at the speed of thought.</p>
        </div>

        <ComposerProvider onSubmit={submit}>
          <ComposerRoot>
            <ComposerTextarea />
            <ComposerActions />
          </ComposerRoot>
          <ComposerError />
        </ComposerProvider>
      </div>
    </div>
  );
}
