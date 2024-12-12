import { z } from "zod";

// Models
const LOW = "gemma2-9b-it";
const MEDIUM = "llama-3.2-11b-text-preview";
const HIGH = "llama-3.2-90b-text-preview";

export const GenAIModel = z.enum([LOW, MEDIUM, HIGH]).default(LOW);

export type GenAIModel = z.input<typeof GenAIModel>;

// Temperature
export const Temperature = z
  .union([
    z.number().min(0).max(1),
    z.enum(["accurate", "creative"]).transform((value) => {
      if (value === "accurate") return 0;
      if (value === "creative") return 1;
      return 0;
    }),
  ])
  .default(0);

export type Temperature = z.input<typeof Temperature>;

// Presence (Penalty)
export const Presence = z
  .union([
    z.number().min(-1).max(1),
    z.enum(["default", "restrict", "allow"]).transform((value) => {
      if (value === "allow") return -1;
      if (value === "default") return 0;
      if (value === "restrict") return 1;
      return 0;
    }),
  ])
  .default(0);

export type Presence = z.input<typeof Presence>;

// Frequency (Penalty)
export const Frequency = z
  .union([
    z.number().min(-1).max(1),
    z.enum(["default", "restrict", "allow"]).transform((value) => {
      if (value === "allow") return -1;
      if (value === "default") return 0;
      if (value === "restrict") return 1;
      return 0;
    }),
  ])
  .default(0);


export type Frequency = z.input<typeof Frequency>;
