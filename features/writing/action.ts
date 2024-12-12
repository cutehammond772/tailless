import {
  PROOFREADER_ROLE,
  EDITOR_ROLE,
  WRITER_ROLE,
  TRANSLATOR_ROLE,
} from "@/features/ai/role";
import { TextGenerationAction } from "../ai/schema";

export function spellCheck(
  content: string,
  knowledge: string[]
): TextGenerationAction {
  return {
    role: PROOFREADER_ROLE,
    prompt: `다음 텍스트의 맞춤법을 교정해주세요:\n\n${content}`,
    knowledge,
  };
}

export function summarize(
  content: string,
  knowledge: string[]
): TextGenerationAction {
  return {
    role: EDITOR_ROLE,
    prompt: `다음 텍스트를 3-5문장으로 요약해주세요:\n\n${content}`,
    knowledge,
  };
}

export function rewrite(
  content: string,
  knowledge: string[]
): TextGenerationAction {
  return {
    role: WRITER_ROLE,
    prompt: `다음 텍스트를 다른 표현으로 다시 작성해주세요:\n\n${content}`,
    knowledge,
  };
}

export function translate(
  content: string,
  knowledge: string[]
): TextGenerationAction {
  return {
    role: TRANSLATOR_ROLE,
    prompt: `다음 한국어 텍스트를 영어로 번역해주세요:\n\n${content}`,
    knowledge,
  };
}

export function elaborate(
  content: string,
  knowledge: string[]
): TextGenerationAction {
  return {
    role: WRITER_ROLE,
    prompt: `다음 텍스트를 더 자세하고 구체적으로 확장해서 작성해주세요:\n\n${content}`,
    knowledge,
  };
}

export function titleRefinement(
  content: string,
  knowledge: string[]
): TextGenerationAction {
  return {
    role: WRITER_ROLE,
    prompt: `다음 제목을 좀 더 다듬어주세요, 그리고 결과물만 반환해주세요:\n\n${content}`,
    knowledge,
  };
}

export function contentRefinement(
  content: string,
  knowledge: string[]
): TextGenerationAction {
  return {
    role: WRITER_ROLE,
    prompt: `다음 내용을 좀 더 다듬어주세요, 결과물의 형태는 3줄 이내의 줄글이어야 합니다:\n\n${content}`,
    knowledge,
  };
}

export function tagRecommendation(
  content: string,
  knowledge: string[]
): TextGenerationAction {
  return {
    role: WRITER_ROLE,
    prompt: `다음 내용에 대한 태그를 추천해주세요, 이때, 결과물의 형태는 쉼표로 구분된 단순한 단어 형태의 문자열로 반환해주세요:\n\n${content}`,
    knowledge,
  };
}
