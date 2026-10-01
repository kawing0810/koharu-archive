import type { Post } from "./types";
import bundled from "./data/posts.json";

const KEY = "koharu-archive-posts";

function sortPosts(posts: Post[]) {
  return [...posts].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

function readStored(): Post[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Post[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isUserMedia(media?: Post["media"]) {
  return Boolean(media?.some((item) => item.src.startsWith("idb:")));
}

function archivedCount(media?: Post["media"]) {
  return (media ?? []).filter((item) => item.src.startsWith("/media/")).length;
}

/** Prefer richer disk archive; never let a thinner localStorage snapshot hide rematch results. */
function pickMedia(incoming: Post["media"] | undefined, fallback: Post["media"] | undefined) {
  const a = incoming ?? [];
  const b = fallback ?? [];
  const aDisk = archivedCount(a);
  const bDisk = archivedCount(b);
  if (aDisk || bDisk) {
    if (aDisk > bDisk) return a;
    if (bDisk > aDisk) return b;
    if (aDisk) return a;
  }
  // Drop dead idb-only snapshots when the other side is empty — empty is clearer than fake placeholders.
  const aIdb = a.some((item) => item.src.startsWith("idb:"));
  const bIdb = b.some((item) => item.src.startsWith("idb:"));
  if (aIdb && !bIdb && b.length === 0) return b;
  if (bIdb && !aIdb && a.length === 0) return a;
  if (isUserMedia(a)) return a;
  if (isUserMedia(b)) return b;
  if (a.length) return a;
  return b;
}

export function loadPosts(): Post[] {
  const base = bundled as Post[];
  const stored = readStored();
  if (!stored) return sortPosts(base);

  const map = new Map(base.map((p) => [p.id, { ...p }]));
  for (const post of stored) {
    const prev = map.get(post.id);
    if (!prev) {
      map.set(post.id, post);
      continue;
    }
    map.set(post.id, {
      ...prev,
      // Keep newer mediaCount from bundled when present
      mediaCount: prev.mediaCount ?? post.mediaCount,
      media: pickMedia(post.media, prev.media),
    });
  }
  const next = sortPosts([...map.values()]);
  savePosts(next);
  return next;
}

export function savePosts(posts: Post[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(posts));
}

export function mergePosts(incoming: Post[]) {
  const current = loadPosts();
  const map = new Map(current.map((p) => [p.id, p]));
  for (const post of incoming) {
    const prev = map.get(post.id);
    map.set(
      post.id,
      prev ? { ...prev, ...post, media: pickMedia(post.media, prev.media) } : post,
    );
  }
  const next = sortPosts([...map.values()]);
  savePosts(next);
  return next;
}

export function applyMediaUpdates(updates: { id: string; media: Post["media"] }[]) {
  if (!updates.length) return loadPosts();
  const map = new Map(updates.map((item) => [item.id, item.media]));
  const current = loadPosts();
  const next = sortPosts(current.map((p) => (map.has(p.id) ? { ...p, media: map.get(p.id)! } : p)));
  savePosts(next);
  return next;
}

export function replacePostMedia(id: string, media: Post["media"]) {
  const current = loadPosts();
  const next = sortPosts(current.map((p) => (p.id === id ? { ...p, media } : p)));
  savePosts(next);
  return next;
}

export function resetPosts() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
  return sortPosts(bundled as Post[]);
}
