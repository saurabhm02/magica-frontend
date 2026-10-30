"use client";

import Uppy from "@uppy/core";
import Transloadit, { type AssemblyResponse } from "@uppy/transloadit";
import { useEffect, useRef, useState } from "react";
import type { AssetItem, CreateLibraryAttachmentRequest } from "@/contracts/api";
import { ALLOWED_ATTACHMENT_MIME_TYPES, MAX_ATTACHMENTS_PER_MESSAGE, MAX_UPLOAD_BYTES } from "@/contracts/attachment";
import {
  UPLOAD_FAILED_MESSAGE,
  UPLOAD_TOO_LARGE_MESSAGE,
  UPLOAD_TYPE_NOT_ALLOWED_MESSAGE,
} from "@/lib/constants";
import type { AttachmentItem } from "@/lib/types";
import { useCreateLibraryAttachment } from "@/queries/uploads";
import { useAuthedApi } from "@/queries/use-authed-api";
import { completeUpload, getUploadParams } from "@/services/uploads.service";

function kindFromMime(mime: string): AttachmentItem["kind"] {
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "image";
}

function validateFile(file: File, currentCount: number, maxFiles: number): string | null {
  if (currentCount >= maxFiles) return `Cannot upload more than ${maxFiles} files at once.`;
  if (file.size > MAX_UPLOAD_BYTES) return UPLOAD_TOO_LARGE_MESSAGE;
  if (!(ALLOWED_ATTACHMENT_MIME_TYPES as readonly string[]).includes(file.type)) return UPLOAD_TYPE_NOT_ALLOWED_MESSAGE;
  return null;
}

function toLibraryRequest(asset: AssetItem): CreateLibraryAttachmentRequest {
  if (asset.source === "upload" && asset.attachmentId) return { attachmentId: asset.attachmentId };
  if (asset.toolInvocationId) return { toolInvocationId: asset.toolInvocationId, url: asset.url };
  throw new Error("Asset is missing the id needed to attach it.");
}

// Drafts survive a remount-free switch (e.g. ComposerProvider doesn't remount on chatId
// change), keyed by scopeId so switching chats never shows one chat's files in another's.
const draftsByScope = new Map<string, AttachmentItem[]>();

export function resetAttachmentDrafts() {
  draftsByScope.clear();
}

/**
 * Manages the files attached to a message draft: validate, upload through Transloadit, and track progress.
 *
 * Input:
 * - scopeId: which draft these files belong to (usually the chat)
 * - options.maxFiles: the most files allowed (defaults to the per-message limit)
 *
 * Output:
 * - items: the attachments with status, progress, preview and saved id/url
 * - addFiles, addFromLibrary, removeAttachment, retryAttachment, clear
 *
 * Notes:
 * - Drafts are kept per scopeId, so switching chats restores that chat's files instead of showing another's.
 * - Files that fail validation are still listed, marked failed with the reason.
 * - Local preview URLs are revoked on remove and clear.
 */
export function useAttachments(scopeId: string, options?: { maxFiles?: number }) {
  const maxFiles = options?.maxFiles ?? MAX_ATTACHMENTS_PER_MESSAGE;
  const withAuth = useAuthedApi();
  const withAuthRef = useRef(withAuth);
  const scopeIdRef = useRef(scopeId);

  const [items, setItems] = useState<AttachmentItem[]>(() => draftsByScope.get(scopeId) ?? []);
  const itemsRef = useRef(items);

  useEffect(() => {
    withAuthRef.current = withAuth;
    itemsRef.current = items;
    draftsByScope.set(scopeIdRef.current, items);
  });

  useEffect(() => {
    if (scopeIdRef.current === scopeId) return;
    scopeIdRef.current = scopeId;
    const restored = draftsByScope.get(scopeId) ?? [];
    itemsRef.current = restored;
    setItems(restored);
  }, [scopeId]);

  const previewUrls = useRef(new Map<string, string>());
  const assemblyFileIds = useRef(new Map<string, string[]>());
  const createLibraryAttachment = useCreateLibraryAttachment();

  const [uppy] = useState(() => new Uppy({ autoProceed: true }));

  useEffect(() => {
    uppy.use(Transloadit, {
      waitForEncoding: true,
      assemblyOptions: () => {
        const files = uppy.getFiles().map((f) => ({ name: f.name, size: f.size ?? 0, type: f.type }));
        return withAuthRef.current((token) => getUploadParams(token, files));
      },
    });
    return () => uppy.destroy();
  }, [uppy]);

  useEffect(() => {
    function updatePercent(fileId: string, percentage: number) {
      setItems((prev) => prev.map((item) => (item.id === fileId ? { ...item, progress: percentage } : item)));
    }

    function failFiles(fileIds: string[], message: string) {
      setItems((prev) =>
        prev.map((item) => (fileIds.includes(item.id) ? { ...item, status: "failed", error: message } : item)),
      );
    }

    function onProgress(file: { id: string } | undefined, progress: { percentage?: number }) {
      if (file) updatePercent(file.id, progress.percentage ?? 0);
    }

    function onUploadError(file: { id: string } | undefined) {
      if (file) failFiles([file.id], UPLOAD_FAILED_MESSAGE);
    }

    function onAssemblyCreated(assembly: AssemblyResponse, fileIds: string[]) {
      if (assembly.assembly_id) assemblyFileIds.current.set(assembly.assembly_id, fileIds);
    }

    function onAssemblyError(assembly: AssemblyResponse) {
      failFiles(assemblyFileIds.current.get(assembly.assembly_id ?? "") ?? [], UPLOAD_FAILED_MESSAGE);
    }

    async function onAssemblyComplete(assembly: AssemblyResponse) {
      const fileIds = assemblyFileIds.current.get(assembly.assembly_id ?? "") ?? [];
      try {
        const { attachments } = await withAuthRef.current((token) => completeUpload(token, assembly.assembly_id ?? ""));
        setItems((prev) =>
          prev.map((item) => {
            const index = fileIds.indexOf(item.id);
            const attachment = index === -1 ? undefined : attachments[index];
            if (!attachment) return item;
            return { ...item, status: "ready", progress: 100, attachmentId: attachment.id, url: attachment.url };
          }),
        );
      } catch {
        failFiles(fileIds, UPLOAD_FAILED_MESSAGE);
      }
    }

    uppy.on("upload-progress", onProgress);
    uppy.on("upload-error", onUploadError);
    uppy.on("transloadit:assembly-created", onAssemblyCreated);
    uppy.on("transloadit:assembly-error", onAssemblyError);
    uppy.on("transloadit:complete", onAssemblyComplete);

    return () => {
      uppy.off("upload-progress", onProgress);
      uppy.off("upload-error", onUploadError);
      uppy.off("transloadit:assembly-created", onAssemblyCreated);
      uppy.off("transloadit:assembly-error", onAssemblyError);
      uppy.off("transloadit:complete", onAssemblyComplete);
    };
  }, [uppy]);

  function addFiles(files: File[]) {
    for (const file of files) {
      const error = validateFile(file, itemsRef.current.length, maxFiles);
      const item: AttachmentItem = error
        ? { id: crypto.randomUUID(), name: file.name, kind: kindFromMime(file.type), status: "failed", error, progress: 0 }
        : addUploadingFile(file);

      itemsRef.current = [...itemsRef.current, item];
      setItems((prev) => [...prev, item]);
    }
  }

  function addUploadingFile(file: File): AttachmentItem {
    const id = uppy.addFile(file);
    const previewUrl = file.type.startsWith("image/") || file.type.startsWith("video/") ? URL.createObjectURL(file) : undefined;
    if (previewUrl) previewUrls.current.set(id, previewUrl);
    return { id, name: file.name, kind: kindFromMime(file.type), previewUrl, progress: 0, status: "uploading" };
  }

  async function addFromLibrary(asset: AssetItem) {
    const id = crypto.randomUUID();
    const item: AttachmentItem = { id, name: asset.name, kind: asset.type, previewUrl: asset.url, progress: 100, status: "uploading" };
    setItems((prev) => [...prev, item]);

    try {
      const attachment = await createLibraryAttachment.mutateAsync(toLibraryRequest(asset));
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, status: "ready", kind: attachment.kind, attachmentId: attachment.id, url: attachment.url } : i,
        ),
      );
    } catch {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "failed", error: UPLOAD_FAILED_MESSAGE } : i)));
    }
  }

  function removeAttachment(id: string) {
    const previewUrl = previewUrls.current.get(id);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrls.current.delete(id);
    }
    if (uppy.getFile(id)) uppy.removeFile(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function retryAttachment(id: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: "uploading", error: undefined, progress: 0 } : item)));
    uppy.retryUpload(id);
  }

  function clear() {
    for (const url of previewUrls.current.values()) URL.revokeObjectURL(url);
    previewUrls.current.clear();
    draftsByScope.delete(scopeIdRef.current);
    setItems([]);
  }

  return { items, addFiles, addFromLibrary, removeAttachment, retryAttachment, clear };
}
