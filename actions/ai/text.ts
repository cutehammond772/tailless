"use server";

import { groq } from "./model";
import { generateText } from "ai";
import { generateSystemPrompt } from "@/features/ai/prompt";
import { TextGenerationRequest, TextGenerationOption, TextGenerationResponse } from "@/features/ai/schema";

export async function generate(
  request: TextGenerationRequest,
  option?: TextGenerationOption
): Promise<TextGenerationResponse> {
  try {
    const { role, prompt, knowledge, refine } =
      TextGenerationRequest.parse(request);
    const { model, temperature, presence, frequency } =
      TextGenerationOption.parse(option);

    const system = generateSystemPrompt({
      role,
      knowledge,
      refine,
    });

    const { text } = await generateText({
      model: groq(model),
      system,
      prompt,
      temperature,
      presencePenalty: presence,
      frequencyPenalty: frequency,
    });

    return { status: "success", text };
  } catch (error) {
    console.error("AI 텍스트 생성 중 오류 발생:", error);
    return { status: "error", error: "AI 텍스트 생성에 실패했습니다." };
  }
}
