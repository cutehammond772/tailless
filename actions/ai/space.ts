"use server";

import { generateTags } from "./tag";
import { calculateSimilarities } from "./similarity";
import { getSpaces } from "../space/primitives";
import { HttpStatus } from "../response";
import { RecommendSpaceResponse } from "@/features/ai/schema";
import { RecommendSpaceRequest } from "@/features/ai/schema";

export async function recommendSpace(request: RecommendSpaceRequest) {
  const { content } = RecommendSpaceRequest.parse(request);

  // 프롬프트에서 태그 추출
  const tagResponse = await generateTags({ content }, { max: 10 });

  if (tagResponse.status === "error") {
    return RecommendSpaceResponse.parse({ status: "error", error: tagResponse.error });
  }

  // Space 목록 가져오기
  const spacesResponse = await getSpaces({});

  if (spacesResponse.status !== HttpStatus.OK) {
    return RecommendSpaceResponse.parse({ 
      status: "error", 
      error: "Space 목록을 가져오는데 실패했습니다" 
    });
  }

  const spaces = spacesResponse.data;

  // 각 태그와 Space 콘텐츠 간의 유사도 계산
  const similarityResponse = await calculateSimilarities(
    {
      content: tagResponse.tags,
      target: spaces.map((space) => space.title),
    }
  );

  // Space별 태그 유사도 매핑 (0.5 이상인 유사도만 포함)
  const spaceScores = spaces.map((space) => ({
    id: space.id,
    tagScores: tagResponse.tags.map((tag) => {
      const similarity = similarityResponse.similarities.find(
        (s) => s.target === space.title && s.content === tag
      )?.similarity || 0;
      
      return similarity >= 0.5 ? {
        tag,
        similarity
      } : null;
    }).filter((score): score is { tag: string; similarity: number } => score !== null),
  })).filter(space => space.tagScores.length > 0);

  return { 
    status: "success", 
    recommendations: spaceScores 
  };
}
