import { MDXRemote } from "next-mdx-remote/rsc";

export default function MDXContent({ source }: { source: string }) {
  return <MDXRemote source={source} />;
}
