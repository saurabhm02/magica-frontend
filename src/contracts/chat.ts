// GENERATED from server/src/contracts — do not edit. Run `pnpm sync:contracts`.
import { z } from "zod";

export const Chat = z.object({
  id: z.string(),
  title: z.string(),
  pinned: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Chat = z.infer<typeof Chat>;
