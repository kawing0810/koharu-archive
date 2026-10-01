"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import club from "@/data/club.json";
import products from "@/data/products.json";
import type { Post, Product } from "@/types";
import { withBasePath } from "@/lib/asset";
import { truncateText, isLongText } from "@/lib/text";
import { IconChart } from "./Icons";
import { PageSearchBar, PostCard } from "./PostCard";

const tabs = [
  { href: "/", label: "動態", exact: true },
  { href: "/gacha", label: "轉蛋" },
  { href: "/puzzle", label: "拼圖" },
];

export function IdolHeader() {
  const pathname = usePathname();
  const [openBio, setOpenBio] = useState(false);
  return (
    <div className="bg-white">
      <PageSearchBar />
      <div className="relative">
        <img src={withBasePath(club.banner)} alt="" className="h-[220px] w-full object-cover md:h-[280px]" />
        <div className="absolute bottom-3 left-4 flex items-center gap-3 text-white drop-shadow">
          <img src={withBasePath(club.avatar)} alt="" className="h-14 w-14 rounded-full border-2 border-white object-cover" />
          <div>
            <div className="text-[15px] font-medium">{club.name}</div>
            <div className="text-[12px] opacity-90">{club.idolName}</div>
          </div>
        </div>
        <div className="absolute right-4 bottom-3 flex items-center gap-1 text-white">
          <span className="rounded-full bg-black/35 px-2.5 py-1 text-[12px]">封存</span>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-[#2bb8d6]">
          <IconChart />
          <span className="text-[14px]">勳章排行</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[#f3d27a]" />
          <div className="h-8 w-8 rounded-full bg-[#cfd3d8]" />
          <div className="h-8 w-8 rounded-full bg-[#e8a0a0]" />
          <div className="h-8 w-8 rounded-full bg-[#d7b38a]" />
          <span className="text-[#bbb]">›</span>
        </div>
      </div>
      <div className="grid grid-cols-3 border-b border-[#eee] text-center text-[15px] text-[#888]">
        {tabs.map((tab) => {
          const active = tab.exact
            ? pathname === "/" || pathname === ""
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link key={tab.href} href={tab.href} className={`py-3 ${active ? "tab-active font-medium" : ""}`}>
              {tab.label}
            </Link>
          );
        })}
      </div>
      <p className="hidden px-4 pt-3 text-[13px] leading-6 text-[#666] md:block">
        {openBio || !isLongText(club.description, 42) ? club.description : `${truncateText(club.description, 42)}...`}
        <button className="ml-1 text-[#2bb8d6]" onClick={() => setOpenBio((v) => !v)}>
          {openBio ? "收合" : "更多"}
        </button>
      </p>
    </div>
  );
}

export function ProductRail({ filter }: { filter?: Product["tag"] }) {
  const list = (products as Product[]).filter((p) => !filter || p.tag === filter);
  return (
    <div className="hide-scrollbar flex gap-3 overflow-x-auto bg-white px-4 py-3">
      {list.map((p) => (
        <div key={p.id} className="relative w-[92px] shrink-0">
          <img src={withBasePath(p.image)} alt={p.name} className="h-[92px] w-[92px] rounded-lg object-cover" />
          <span
            className={`absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] text-white ${
              p.tag === "轉蛋" ? "bg-[#2bb8d6]" : "bg-[#2ee6c3]"
            }`}
          >
            {p.tag === "轉蛋" ? "Gacha" : "Puzzle"}
          </span>
        </div>
      ))}
    </div>
  );
}

export function IdolPage({ posts }: { posts: Post[] }) {
  return (
    <div className="overflow-hidden rounded-none bg-white shadow-sm md:rounded-xl">
      <IdolHeader />
      <ProductRail />
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export function ShopTab({ kind, posts }: { kind: "轉蛋" | "拼圖"; posts: Post[] }) {
  return (
    <div className="overflow-hidden bg-white shadow-sm md:rounded-xl">
      <IdolHeader />
      <ProductRail filter={kind} />
      <div className="p-8 text-center text-[#888]">
        <p className="text-[15px]">{kind}頁面結構已保留。</p>
        <p className="mt-2 text-[13px]">關閉後僅保留動態備份，商品購買流程不在此站。</p>
      </div>
      {posts.slice(0, 2).map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
