"use client";

import { IdolPage } from "@/components/IdolPage";
import { usePosts } from "@/lib/posts-context";

export default function HomePage() {
  const { posts } = usePosts();
  return <IdolPage posts={posts} />;
}
