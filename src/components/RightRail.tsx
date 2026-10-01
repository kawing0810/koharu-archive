"use client";

import club from "../data/club.json";
import { usePosts } from "@/lib/posts-context";

export function RightRail() {
  const { posts } = usePosts();
  const limited = posts.filter((p) => p.limited).length;
  const publicCount = posts.length - limited;
  const media = posts.reduce((n, p) => n + (p.media?.length ?? 0), 0);

  return (
    <aside className="hidden w-[280px] shrink-0 xl:block">
      <div className="sticky top-[66px] space-y-4 pt-4">
        <section className="overflow-hidden rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-[15px] font-semibold">封存摘要</h3>
          <ul className="space-y-2 text-[13px] leading-6 text-[#555]">
            <li>貼文 {posts.length} 則</li>
            <li>公開 {publicCount} · 限定 {limited}</li>
            <li>媒體 {media} 個</li>
            <li>更新至 2026.09.21</li>
          </ul>
        </section>
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-[15px] font-semibold">關於</h3>
          <p className="text-[13px] leading-6 text-[#666]">
            這是 {club.name} 關閉前的本機備份。
            <br />
            圖文都在硬碟，不連線也能看。
          </p>
        </section>
        <p className="px-1 text-[11px] text-[#bbb]">
          {club.idolName}
          <br />
          僅供個人備份瀏覽
        </p>
      </div>
    </aside>
  );
}
