import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Shell } from "@/components/Shell";
import { PostsProvider } from "@/lib/posts-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "小晴封存 · 劉曉晴",
  description: "TPE48 劉曉晴個人動態備份",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-page" suppressHydrationWarning>
        <PostsProvider>
          <Shell>{children}</Shell>
        </PostsProvider>
      </body>
    </html>
  );
}
