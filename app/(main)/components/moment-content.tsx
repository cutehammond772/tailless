import MDXContent from "@/components/mdx/content";

import type { Moment } from "@/db/moment";

export default function MomentContent({ moment }: { moment: Moment }) {
  return (
    <>
      <h2 className="text-xl font-bold">{moment.title}</h2>
      <MDXContent source={moment.content} />
    </>
  );
}
