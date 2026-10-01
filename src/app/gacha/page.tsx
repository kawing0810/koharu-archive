"use client";

import { ShopTab } from "@/components/IdolPage";
import { usePosts } from "@/lib/posts-context";

export default function GachaPage() {
  const { posts } = usePosts();
  return <ShopTab kind="轉蛋" posts={posts} />;
}
