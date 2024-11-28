"use server";

import { groq } from "./model";
import { generateText } from "ai";

export async function extractKeywords(content: string): Promise<string[]> {
  try {
    const { text } = await generateText({
      model: groq("gemma2-9b-it"),
      system:
        "당신은 전문 에디터입니다. 주어진 내용에서 핵심 키워드를 5개 이내로 추출해주세요. 키워드는 쉼표(,)로 구분하여 반환해주세요. 앞뒤 공백은 제거해주세요.",
      prompt: `다음 내용에서 핵심 키워드를 추출해주세요:\n\n${content}`,
    });

    // 쉼표로 구분된 키워드를 배열로 변환
    return text.split(",").map((keyword) => keyword.trim());
  } catch (error) {
    console.error("AI 키워드 추출 중 오류 발생:", error);
    throw new Error("AI 키워드 추출에 실패했습니다.");
  }
}
