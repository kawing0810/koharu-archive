"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconBell,
  IconBookmark,
  IconChat,
  IconFeed,
  IconPlus,
  IconStar,
  IconStore,
  IconUser,
} from "./Icons";

const items = [
  { href: "/feed", label: "動態", icon: IconFeed },
  { href: "/chat", label: "聊天", icon: IconChat },
  { href: "/", label: "首頁", icon: IconStar, exact: true },
  { href: "/collect", label: "數位收藏", icon: IconBookmark },
  { href: "/store", label: "商店", icon: IconStore },
  { href: "/notify", label: "通知", icon: IconBell },
  { href: "/member", label: "關於", icon: IconUser },
  { href: "/import", label: "匯入貼文", icon: IconPlus },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === "/" || pathname.startsWith("/post/") || pathname.startsWith("/gacha") || pathname.startsWith("/puzzle");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-[220px] shrink-0 self-stretch bg-white pt-4 lg:block">
      <nav className="flex flex-col gap-1 px-3">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-[15px] ${
                active ? "nav-active font-medium text-white" : "text-[#555] hover:bg-black/4"
              }`}
            >
              <Icon className="h-[22px] w-[22px]" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const tabs = [
    { href: "/feed", icon: IconFeed },
    { href: "/chat", icon: IconChat },
    { href: "/", icon: IconStar, exact: true },
    { href: "/collect", icon: IconBookmark },
    { href: "/store", icon: IconStore },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-around border-t border-black/5 bg-white lg:hidden">
      {tabs.map(({ href, icon: Icon, exact }) => (
        <Link
          key={href}
          href={href}
          className={isActive(pathname, href, exact) ? "text-[#2ad4d0]" : "text-[#b0b0b0]"}
        >
          <Icon className="h-6 w-6" />
        </Link>
      ))}
    </nav>
  );
}
