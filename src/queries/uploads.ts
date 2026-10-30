"use client";

import { useMutation } from "@tanstack/react-query";
import type { CreateLibraryAttachmentRequest } from "@/contracts/api";
import { createLibraryAttachment } from "@/services/uploads.service";
import { useAuthedApi } from "./use-authed-api";

export function useCreateLibraryAttachment() {
  const withAuth = useAuthedApi();

  return useMutation({
    mutationFn: (vars: CreateLibraryAttachmentRequest) => withAuth((token) => createLibraryAttachment(token, vars)),
  });
}
