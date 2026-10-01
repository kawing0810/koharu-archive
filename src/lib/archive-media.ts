import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import type { Media, Post } from "@/types";

const REMOTE = /^https?:\/\//i;

export function isRemoteMedia(src?: string) {
  return Boolean(src && REMOTE.test(src) && !src.includes("-blur."));
}

export function publicRelFromUrl(url: string) {
  try {
    const { pathname } = new URL(url);
    if (pathname.startsWith("/media/")) return pathname;
    return `/media/misc${pathname}`;
  } catch {
    return `/media/misc/${url.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80)}`;
  }
}

function publicAbs(rel: string) {
  return path.join(process.cwd(), "public", ...rel.split("/").filter(Boolean));
}

export function downloadRemoteFile(url: string): string | undefined {
  const rel = publicRelFromUrl(url);
  const abs = publicAbs(rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  if (existsSync(abs) && statSync(abs).size > 0) return rel;
  try {
    execFileSync("curl.exe", ["-sS", "-L", "--fail", "--retry", "2", "--connect-timeout", "20", "-o", abs, url], {
      stdio: "pipe",
      timeout: 300_000,
    });
    if (!existsSync(abs) || statSync(abs).size === 0) {
      if (existsSync(abs)) unlinkSync(abs);
      return undefined;
    }
    return rel;
  } catch {
    if (existsSync(abs)) unlinkSync(abs);
    return undefined;
  }
}

export function localizeUrl(url?: string) {
  if (!url) return url;
  if (!isRemoteMedia(url)) return url;
  return downloadRemoteFile(url) ?? url;
}

export function localizeMedia(media: Media[]): Media[] {
  return media.map((item) => ({
    ...item,
    src: localizeUrl(item.src) ?? item.src,
    thumbnail: localizeUrl(item.thumbnail),
  }));
}

export function localizePosts(posts: Post[]): Post[] {
  return posts.map((post) => (post.limited ? post : { ...post, media: localizeMedia(post.media) }));
}
