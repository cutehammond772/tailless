"use server";

import { generateObject } from "ai";
import { z } from "zod";

import {
  SimilarityRequest,
  SimilarityOption,
  SimilarityResponse,
  MultipleSimilarityRequest,
  MultipleSimilarityResponse,
} from "@/features/ai/schema";
import { groq } from "./model";

export async function calculateSimilarity(
  request: SimilarityRequest,
  option?: SimilarityOption
): Promise<SimilarityResponse> {
  const { content, target } = SimilarityRequest.parse(request);
  const { model } = SimilarityOption.parse(option);

  const similarity = await generateObject({
    model: groq(model),
    schema: z.object({
      similarity: z.number().min(0).max(1),
    }),
    prompt: `다음 두 텍스트의 유사도를 계산해주세요:\n\n텍스트 1: ${content}\n\n텍스트 2: ${target}`,
  });

  return { status: "success", similarity: similarity.object.similarity };
}

export async function calculateSimilarities(
  request: MultipleSimilarityRequest,
  option?: SimilarityOption
): Promise<MultipleSimilarityResponse> {
  const { content, target } = MultipleSimilarityRequest.parse(request);
  const { model } = SimilarityOption.parse(option);

  const similarities = (
    await generateObject({
      model: groq(model),
      schema: z.object({
        similarities: z.array(
          z.object({
            content: z.string(),
            target: z.string(),
            similarity: z.number().min(0).max(1),
          })
        ),
      }),
      prompt: `다음 두 그룹 간의 각각의 매칭에 대해 유사도를 계산해주세요:

      # 그룹 content:
      ${content.join("\n")}

      # 그룹 tagret:
      ${target.join("\n")}`,
    })
  ).object.similarities;

  return { status: "success", similarities };
}
