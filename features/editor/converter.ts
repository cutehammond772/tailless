import { BlockContent, BlockData } from "./schema";

// 줄글을 블록으로 변환합니다. 개행을 기준으로 나눕니다.
export function convertContentToBlocks(content: string): BlockData[] {
  const contents = content.split("\n");

  return contents.map((content) => {
    const contentBlock = BlockContent.parse({ content });

    return BlockData.parse({
      currentVersion: contentBlock.id,
      versions: { [contentBlock.id]: contentBlock },
    });
  });
}

// 블록을 줄글로 변환합니다.
export function convertBlocksToContent(blocks: BlockData[]): string {
  return blocks.map((block) => block.versions[block.currentVersion].content).join("\n");
}
