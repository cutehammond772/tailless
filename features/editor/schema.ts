import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const BlockContent = z.object({
  id: z.string().uuid().default(uuidv4()),
  content: z.string(),
});

export const BlockData = z.object({
  id: z.string().uuid().default(uuidv4()),
  currentVersion: z.string().uuid(),
  versions: z.record(z.string().uuid(), BlockContent),
});

export const BlockContentUI = z.object({
  contentId: z.string().uuid().default(uuidv4()),
  displayName: z.string().optional(),
  status: z.enum(["edit", "view", "generating", "pending"]).default("view"),
});

export const BlockUI = z.object({
  dataId: z.string().uuid().default(uuidv4()),
  type: z.enum(["text", "title"]).default("text"),
  displayName: z.string().optional(),
  versions: z.record(z.string().uuid(), BlockContentUI),
});

export type BlockData = z.infer<typeof BlockData>;
export type BlockContent = z.infer<typeof BlockContent>;
export type BlockContentUI = z.infer<typeof BlockContentUI>;
export type BlockUI = z.infer<typeof BlockUI>;

export type CreateBlockData = z.input<typeof BlockData>;
export type CreateBlockContent = z.input<typeof BlockContent>;
export type CreateBlockContentUI = z.input<typeof BlockContentUI>;
export type CreateBlockUI = z.input<typeof BlockUI>;
