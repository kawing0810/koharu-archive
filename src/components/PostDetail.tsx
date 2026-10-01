"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { usePosts } from "@/lib/posts-context";
import club from "@/data/club.json";
import type { Post } from "@/types";
import { withBasePath } from "@/lib/asset";
import { ArchivedMedia } from "./ArchivedMedia";
import { IconChat, IconHeart, IconLock } from "./Icons";
import { PageSearchBar } from "./PostCard";

export function PostDetail({ posts }: { posts: Post[] }) {
  const params = useParams<{ id: string }>();
  const { replaceMedia } = usePosts();
  const post = posts.find((p) => p.id === params.id);

  if (!post) {
    return (
      <div className="bg-white p-10 text-center text-[#888] md:rounded-xl">
        找不到這則貼文。
        <div className="mt-4">
          <Link href="/" className="text-[#2bb8d6]">
            回到動態
          </Link>
        </div>
      </div>
    );
  }

  const locked = post.limited && post.media.length === 0;

  return (
    <div className="overflow-hidden bg-white shadow-sm md:rounded-xl">
      <PageSearchBar />
      <div className="flex items-center gap-3 px-4 py-4">
        <img src={withBasePath(club.avatar)} alt="" className="h-11 w-11 rounded-full object-cover" />
        <div>
          <div className="font-medium">{club.idolName}</div>
          <div className="text-[12px] text-[#888]">{post.createdAt}</div>
        </div>
        {post.limited && (
          <span className="ml-auto rounded-full bg-[#e9e9e9] px-2.5 py-0.5 text-[12px] text-[#777]">
            Limited
          </span>
        )}
      </div>
      <div className="px-4 pb-4 text-[15px] leading-7 whitespace-pre-wrap">{post.text}</div>
      {locked ? (
        <div className="relative h-[360px] bg-[#111]">
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center text-white">
            <IconLock />
            <p className="mt-3 text-[14px] leading-6">
              限定內容尚未匯入。
              <br />
              到「匯入貼文」補上圖檔或影片即可解鎖顯示。
            </p>
            <Link href="/import" className="mt-4 rounded-full bg-[#e36b6b] px-5 py-2 text-sm">
              前往匯入
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {post.media.map((item) => (
            <ArchivedMedia key={item.src} item={item} className="w-full" />
          ))}
        </div>
      )}
      {post.limited && post.media.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-3">
          <button
            type="button"
            className="rounded-full bg-[#eee] px-4 py-2 text-sm"
            onClick={() => replaceMedia(post.id, [])}
          >
            這則圖放錯了，清空重補
          </button>
          <Link href="/import" className="rounded-full bg-[#2ad4d0] px-4 py-2 text-sm text-white">
            前往補圖
          </Link>
        </div>
      )}
      <div className="flex items-center justify-end gap-4 px-4 py-3 text-[#888]">
        <span className="flex items-center gap-1">
          <IconHeart className="text-[#ff6b81]" /> {post.likes ?? 0}
        </span>
        <span className="flex items-center gap-1">
          <IconChat /> {post.comments ?? 0}
        </span>
      </div>
    </div>
  );
}
