import posts from "@/data/posts.json";
import { PostPageClient } from "./PostPageClient";

export function generateStaticParams() {
  return (posts as { id: string }[]).map((post) => ({ id: post.id }));
}

export default function PostPage() {
  return <PostPageClient />;
}
