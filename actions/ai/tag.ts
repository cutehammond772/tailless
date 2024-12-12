"use server";

import { generateObject } from "ai";
import { z } from "zod";

import { TagGenerationRequest, TagGenerationOption, TagGenerationResponse } from "@/features/ai/schema";
import { groq } from "./model";

export async function generateTags(request: TagGenerationRequest, option?: TagGenerationOption): Promise<TagGenerationResponse> {
  const { content } = TagGenerationRequest.parse(request);
  const { model, min, max } = TagGenerationOption.parse(option);

  const tags = await generateObject({
    model: groq(model),
    schema: z.object({
      tags: z.string().array().min(min).max(max),
    }),
    prompt: `다음 텍스트에서 적절한 태그를 ${min}개 이상 ${max}개 이하로 추출해주세요:\n\n${content}`,
  });

  return { status: "success", tags: tags.object.tags };
}