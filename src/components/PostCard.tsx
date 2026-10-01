"use client";

import Link from "next/link";
import { useState } from "react";
import club from "@/data/club.json";
import type { Post } from "@/types";
import { withBasePath } from "@/lib/asset";
import { ArchivedMedia } from "./ArchivedMedia";
import { IconChat, IconHeart, IconLock, IconMore, IconSearch } from "./Icons";
import { truncateText, isLongText } from "@/lib/text";

function MediaGrid({ post }: { post: Post }) {
  const locked = post.limited && post.media.length === 0;
  if (locked) {
    return (
      <div className="relative mt-3 h-[280px] overflow-hidden bg-[#222]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#333,#111)] blur-sm" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center text-white">
          <IconLock className="mb-3 h-14 w-14 opacity-90" />
          <p className="text-[14px] leading-6">
            這則是限定貼文。
            <br />
            到左側「匯入貼文」補上圖檔後就會顯示。
          </p>
        </div>
      </div>
    );
  }

  const media = post.media;
  if (!media.length) return null;

  const shown = media.slice(0, 4);
  if (shown.length === 1) {
    return <MediaItem item={shown[0]} className="mt-3 max-h-[520px] w-full object-cover" />;
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-0.5">
      {shown.map((item, i) => (
        <div key={item.src + i} className="relative aspect-square overflow-hidden bg-black">
          <MediaItem item={item} className="h-full w-full object-cover" />
          {i === 3 && media.length > 4 && (
            <div className="absolute inset-0 grid place-items-center bg-black/45 text-2xl font-semibold text-white">
              +{media.length - 4}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MediaItem({
  item,
  className,
}: {
  item: Post["media"][number];
  className?: string;
}) {
  return <ArchivedMedia item={item} className={className} />;
}

export function PostCard({ post }: { post: Post }) {
  const [open, setOpen] = useState(false);
  const long = isLongText(post.text, 80);
  const text = !open && long ? `${truncateText(post.text, 80)}...` : post.text;

  return (
    <article className="border-b border-[#eee] bg-white">
      <div className="flex items-start gap-3 px-4 pt-4">
        <Link href="/">
          <img src={withBasePath(club.avatar)} alt="" className="h-11 w-11 rounded-full object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link href="/" className="text-[15px] font-medium">
                {club.idolName}
              </Link>
              <div className="text-[12px] text-[#888]">{post.createdAt}</div>
            </div>
            <div className="flex items-center gap-2 text-[#888]">
              {post.limited && (
                <span className="rounded-full bg-[#e9e9e9] px-2.5 py-0.5 text-[12px] text-[#777]">
                  Limited
                </span>
              )}
              <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-black/4" aria-label="收藏">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M7 5h10v14l-5-3-5 3z" />
                </svg>
              </button>
              <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-black/4" aria-label="更多">
                <IconMore />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 pt-2 text-[15px] leading-7 whitespace-pre-wrap">
        {text}
        {long && (
          <button className="ml-1 text-[#2bb8d6]" onClick={() => setOpen((v) => !v)}>
            {open ? "收合" : "See more"}
          </button>
        )}
      </div>
      <Link href={`/post/${post.id}`}>
        <MediaGrid post={post} />
      </Link>
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center">
          {(post.topFans ?? []).slice(0, 3).map((fan) => (
            <div key={fan.name} className="mr-2 flex flex-col items-center">
              {fan.avatar ? (
                <img src={withBasePath(fan.avatar)} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-[#ddd]" />
              )}
              <span className="text-[10px] text-[#888]">{fan.count}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 pr-3 text-[#888]">
          <span className="flex items-center gap-1 text-[13px]">
            <IconHeart className="h-[22px] w-[22px] text-[#ff6b81]" />
            {post.likes ?? 0}
          </span>
          <Link href={`/post/${post.id}`} className="flex items-center gap-1 text-[13px]">
            <IconChat className="h-[22px] w-[22px]" />
            {post.comments ?? 0}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function PageSearchBar() {
  return (
    <div className="flex items-center justify-between bg-white px-4 py-2">
      <Link href="/" className="text-[15px] text-[#2bb8d6]">
        {club.name}
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/import"
          className="grid h-9 w-9 place-items-center rounded-full bg-[#f3f3f3] text-[#666]"
          title="搜尋／匯入"
        >
          <IconSearch className="h-5 w-5" />
        </Link>
        <button className="grid h-9 w-9 place-items-center rounded-full bg-[#f3f3f3] text-[#666]">
          <IconChat className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
