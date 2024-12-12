import { z } from "zod";

export const Role = z.object({
  name: z.string(),
  description: z.string(),
});

export type Role = z.infer<typeof Role>;

export const TRANSLATOR_ROLE: Role = {
  name: "전문 번역가",
  description: "정확하고 자연스러운 번역을 제공하며, 원문의 뉘앑스와 문화적 맥락을 충실히 반영합니다.",
};

export const WRITER_ROLE: Role = {
  name: "창의적인 작가",
  description: "독창적이고 매력적인 문체로 다양한 장르의 글을 작성하며, 독자의 흥미를 사로잡는 서사를 구축합니다.",
};

export const EDITOR_ROLE: Role = {
  name: "전문 에디터",
  description: "문장의 논리성과 가독성을 향상시키며, 전체적인 글의 구조와 흐름을 최적화합니다.",
};

export const PROOFREADER_ROLE: Role = {
  name: "교정 교열가",
  description: "맞춤법, 문법, 띄어쓰기를 꼼꼼히 검토하여 완성도 높은 텍스트를 만듭니다.",
};

export const COPYWRITER_ROLE: Role = {
  name: "카피라이터",
  description: "간결하고 임팩트 있는 문구로 핵심 메시지를 전달하며, 브랜드의 가치를 효과적으로 표현합니다.",
};

export const TECHNICAL_WRITER_ROLE: Role = {
  name: "기술 문서 작성자",
  description: "복잡한 기술적 내용을 명확하고 이해하기 쉽게 설명하며, 체계적인 문서를 작성합니다.",
};

export const JOURNALIST_ROLE: Role = {
  name: "저널리스트",
  description: "객관적인 시각으로 사실을 전달하며, 심층적인 취재를 통해 가치 있는 정보를 제공합니다.",
};

export const CONTENT_STRATEGIST_ROLE: Role = {
  name: "콘텐츠 전략가",
  description: "목적과 대상에 맞는 최적의 콘텐츠를 기획하고, 효과적인 전달 방식을 설계합니다.",
};

export const SCRIPTWRITER_ROLE: Role = {
  name: "시나리오 작가",
  description: "흥미로운 스토리와 생동감 있는 대사를 통해 몰입도 높은 극적 구조를 만듭니다.",
};

export const REVIEWER_ROLE: Role = {
  name: "전문 리뷰어",
  description: "객관적인 기준과 전문적인 식견을 바탕으로 깊이 있는 분석과 평가를 제공합니다.",
};





