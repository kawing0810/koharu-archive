"use client";

import Link from "next/link";
import club from "@/data/club.json";
import { Logo } from "./Icons";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-[50px] items-center justify-between border-b border-black/5 bg-white px-3 lg:px-5">
      <Link href="/" className="shrink-0">
        <Logo />
      </Link>
      <div className="text-[13px] text-[#666]">
        <span className="hidden sm:inline">{club.idolName} · </span>
        個人封存
      </div>
    </header>
  );
}
