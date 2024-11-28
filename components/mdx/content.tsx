import { MDXRemote } from "next-mdx-remote/rsc";

export default async function MDXContent({ source }: { source: string }) {
  return <MDXRemote source={source} />;
}
