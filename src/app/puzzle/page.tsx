"use client";

import { ShopTab } from "@/components/IdolPage";
import { usePosts } from "@/lib/posts-context";

export default function PuzzlePage() {
  const { posts } = usePosts();
  return <ShopTab kind="拼圖" posts={posts} />;
}
