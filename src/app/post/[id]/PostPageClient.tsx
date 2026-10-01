"use client";

import { PostDetail } from "@/components/PostDetail";
import { usePosts } from "@/lib/posts-context";

export function PostPageClient() {
  const { posts } = usePosts();
  return <PostDetail posts={posts} />;
}
