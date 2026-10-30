import {
  CompleteUploadResponse,
  CreateLibraryAttachmentRequest,
  CreateLibraryAttachmentResponse,
  UploadFileItem,
  UploadParamsResponse,
} from "@/contracts/api";
import { request } from "./api-client";

export function getUploadParams(token: string, files: UploadFileItem[]) {
  return request("/uploads/params", { method: "POST", body: { files }, schema: UploadParamsResponse, token });
}

export function completeUpload(token: string, assemblyId: string) {
  return request("/uploads/complete", { method: "POST", body: { assemblyId }, schema: CompleteUploadResponse, token });
}

export function createLibraryAttachment(token: string, body: CreateLibraryAttachmentRequest) {
  return request("/attachments/from-library", {
    method: "POST",
    body,
    schema: CreateLibraryAttachmentResponse,
    token,
  });
}
