"use client";

import type { ReactNode } from "react";
import { usePosts } from "@/lib/posts-context";
import { Header } from "./Header";
import { RightRail } from "./RightRail";
import { BottomNav, Sidebar } from "./Sidebar";

export function Shell({ children }: { children: ReactNode }) {
  const { exportNote } = usePosts();
  return (
    <div className="min-h-screen bg-page">
      <Header />
      {exportNote && (
        <div className="border-b border-[#cde] bg-[#e8fbf9] px-4 py-2 text-center text-[13px] text-[#1a8a8a]">
          {exportNote}
        </div>
      )}
      <div className="flex min-h-[calc(100vh-50px)]">
        <Sidebar />
        <div className="mx-auto flex min-w-0 max-w-[1040px] flex-1 items-start gap-4 px-0 lg:px-4 lg:pt-4">
          <main className="min-w-0 flex-1 pb-20 lg:pb-8">{children}</main>
          <RightRail />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
