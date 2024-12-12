import { z } from "zod";
import { Role } from "./role";

export const SystemPrompt = z.object({
  role: Role,
  knowledge: z.string().array(),
  refine: z.string().array(),
});

export type SystemPrompt = z.infer<typeof SystemPrompt>;

export function generateSystemPrompt({
  role,
  knowledge,
  refine,
}: SystemPrompt) {
  const rolePrompt = `당신은 ${role.name}입니다. ${role.description}`;
  const knowledgementPrompt = `당신은 이러한 배경 지식을 가지고 있습니다.\n\n${knowledge.join(
    "\n"
  )}`;
  const refinePrompt = `결과물을 반환하기 이전, 다음과 같은 후처리 작업이 필요합니다.\n\n${refine.join(
    "\n"
  )}`;

  const prompts = [rolePrompt];
  
  if (knowledge.length > 0) prompts.push(knowledgementPrompt);
  if (refine.length > 0) prompts.push(refinePrompt);

  return prompts.join("\n\n");
}
