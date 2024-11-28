"use server";

import { groq } from "./model";
import { generateText } from "ai";

export type AiAction =
  | "spellcheck"
  | "summarize"
  | "rewrite"
  | "translate"
  | "elaborate"
  | "title_refinement"
  | "content_refinement"
  | "tag_recommendation";

// AI 글 작성 함수
export async function generateAiText(
  content: string,
  action: AiAction
): Promise<string> {
  // 액션별 프롬프트 설정
  const prompts: Record<AiAction, string> = {
    spellcheck: `다음 텍스트의 맞춤법을 교정해주세요:\n\n${content}`,
    summarize: `다음 텍스트를 3-5문장으로 요약해주세요:\n\n${content}`,
    rewrite: `다음 텍스트를 다른 표현으로 다시 작성해주세요:\n\n${content}`,
    translate: `다음 한국어 텍스트를 영어로 번역해주세요:\n\n${content}`,
    elaborate: `다음 텍스트를 더 자세하고 구체적으로 확장해서 작성해주세요:\n\n${content}`,
    title_refinement: `다음 제목을 좀 더 다듬어주세요:\n\n${content}`,
    content_refinement: `다음 내용을 좀 더 다듬어주세요:\n\n${content}`,
    tag_recommendation: `다음 내용에 대한 태그를 추천해주세요:\n\n${content}`,
  };

  // 시스템 프롬프트 설정
  const systemPrompts: Record<AiAction, string> = {
    spellcheck:
      "당신은 전문 교정 교열가입니다. 맞춤법, 띄어쓰기, 문법을 정확하게 교정해주세요. 순수한 결과물만 반환해주세요. 앞뒤 공백은 제거해주세요.",
    summarize:
      "당신은 전문 에디터입니다. 핵심 내용을 간단명료하게 요약해주세요. 순수한 결과물만 반환해주세요. 앞뒤 공백 및 개행은 제거해주세요.",
    rewrite:
      "당신은 창의적인 작가입니다. 원문의 의미는 유지하면서 새로운 표현으로 다시 작성해주세요. 순수한 결과물만 반환해주세요. 앞뒤 공백 및 개행은 제거해주세요.",
    translate:
      "당신은 전문 번역가입니다. 자연스러운 영어로 번역해주세요. 순수한 결과물만 반환해주세요. 앞뒤 공백 및 개행은 제거해주세요.",
    elaborate:
      "당신은 전문 작가입니다. 주어진 내용을 더 풍부하고 상세하게 발전시켜주세요. 순수한 결과물만 반환해주세요. 앞뒤 공백 및 개행은 제거해주세요.",
    title_refinement:
      "당신은 전문 작가입니다. 주어진 제목을 좀 더 매력적으로 다듬어주세요. 순수한 결과물만 반환해주세요. 앞뒤 공백 및 개행은 제거해주세요.",
    content_refinement:
      "당신은 전문 작가입니다. 주어진 내용을 좀 더 설득력이 있도록 2줄 이내로 다듬어주세요. 순수한 결과물만 반환해주세요. 앞뒤 공백 및 개행은 제거해주세요.",
    tag_recommendation:
      "당신은 전문 작가입니다. 주어진 내용에 대한 태그를 5개 이내로 추천해주세요. 순수한 결과물만 반환해주세요. 앞뒤 공백 및 개행은 제거해주세요.",
  };

  try {
    const { text } = await generateText({
      model: groq("gemma2-9b-it"),
      system: systemPrompts[action],
      prompt: prompts[action],
    });

    return text;
  } catch (error) {
    console.error("AI 텍스트 생성 중 오류 발생:", error);
    throw new Error("AI 텍스트 생성에 실패했습니다.");
  }
}
