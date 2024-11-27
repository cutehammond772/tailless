import { HttpStatus } from "@/actions/response";
import { getSpace } from "@/actions/space/primitives";
import { redirect } from "next/navigation";

export interface SpacePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SpacePage({ params }: SpacePageProps) {
  const { id } = await params;
  const space = await getSpace({ id });

  if (space.status !== HttpStatus.OK) {
    return <div>Space not found</div>;
  }

  redirect(`/space/${space.data.id}/${space.data.layout}`);
}
