"use client";

import { ComposerActions, ComposerError, ComposerProvider, ComposerRoot, ComposerTextarea } from "@/components/composer/composer";
import { useSubmitMessage } from "@/components/chat/use-submit-message";
import { Clock } from "@/components/home/clock";
import { MagicaMascot } from "@/components/icons/magica-mascot";

export default function NewChatPage() {
  const submit = useSubmitMessage();

  // Sizes and spacing measured on magica.com: the hero sits near the top (not centered),
  // then a 48px gap to the composer.
  return (
    <div className="flex h-full flex-col items-center overflow-y-auto">
      <div className="flex w-full max-w-[1000px] flex-col items-center gap-12">
        <div className="w-[min(448px,calc(100vw-48px))] pt-12 text-center md:pt-[113.375px]">
          <MagicaMascot className="mx-auto block size-10" />
          <Clock />
          <h1 className="mt-4 text-[20px] leading-7 font-bold text-text-primary md:mt-1 md:text-[24px] md:leading-8">
            Your AI worker
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">Work at the speed of thought.</p>
        </div>

        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-0">
          <ComposerProvider onSubmit={submit}>
            <ComposerRoot>
              <ComposerTextarea />
              <ComposerActions />
            </ComposerRoot>
            <ComposerError />
          </ComposerProvider>
        </div>
      </div>
    </div>
  );
}
