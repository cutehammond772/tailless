import { z } from "zod";

import { Frequency , Presence, Temperature} from "./option";
import { GenAIModel } from "./option";
import { defaultRefinements } from "./refine";
import { Role } from "./role";

// Text Generation
export const TextGenerationRequest = z.object({
  role: Role,
  prompt: z.string(),
  knowledge: z.string().array().optional().default([]),
  refine: z.string().array().optional().default(defaultRefinements),
});

export const TextGenerationAction = TextGenerationRequest.omit({
  refine: true,
});

export const TextGenerationOption = z.object({
  model: GenAIModel,
  temperature: Temperature,
  presence: Presence,
  frequency: Frequency,
}).default({});

export const TextGenerationResponse = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    text: z.string(),
  }),
  z.object({
    status: z.literal("error"),
    error: z.string(),
  }),
]);

export type TextGenerationAction = z.input<typeof TextGenerationAction>;
export type TextGenerationRequest = z.input<typeof TextGenerationRequest>;
export type TextGenerationOption = z.input<typeof TextGenerationOption>;
export type TextGenerationResponse = z.infer<typeof TextGenerationResponse>;

// Tag Generation
export const TagGenerationRequest = z.object({
  content: z.string(),
});

export const TagGenerationOption = z.object({
  model: GenAIModel,
  min: z.number().min(1).default(1),
  max: z.number().min(1).default(5),
}).default({});

export const TagGenerationResponse = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    tags: z.string().array(),
  }),
  z.object({
    status: z.literal("error"),
    error: z.string(),
  }),
]);

export type TagGenerationRequest = z.input<typeof TagGenerationRequest>;
export type TagGenerationOption = z.input<typeof TagGenerationOption>;
export type TagGenerationResponse = z.infer<typeof TagGenerationResponse>;

// Similarity
export const SimilarityRequest = z.object({
  content: z.string(),
  target: z.string(),
});

export const MultipleSimilarityRequest = z.object({
  content: z.string().array(),
  target: z.string().array(),
});

export const SimilarityOption = z.object({
  model: GenAIModel,
}).default({});

export const SimilarityResponse = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    similarity: z.number(),
  }),
]);

export const MultipleSimilarityResponse = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    similarities: z.object({
      content: z.string(),
      target: z.string(),
      similarity: z.number(),
    }).array(),
  }),
]);

export type SimilarityRequest = z.input<typeof SimilarityRequest>;
export type MultipleSimilarityRequest = z.input<typeof MultipleSimilarityRequest>;
export type SimilarityOption = z.input<typeof SimilarityOption>;
export type SimilarityResponse = z.infer<typeof SimilarityResponse>;
export type MultipleSimilarityResponse = z.infer<typeof MultipleSimilarityResponse>;

// Request Schema
export const RecommendSpaceRequest = z.object({
  content: z.string(),
});

// Response Schema
export const RecommendSpaceResponse = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    recommendations: z.array(
      z.object({
        id: z.string(),
        tagScores: z.array(
          z.object({
            tag: z.string(),
            similarity: z.number().min(0).max(1),
          })
        ),
      })
    ),
  }),
  z.object({
    status: z.literal("error"),
    error: z.string(),
  }),
]);

export type RecommendSpaceRequest = z.input<typeof RecommendSpaceRequest>;
export type RecommendSpaceResponse = z.infer<typeof RecommendSpaceResponse>;