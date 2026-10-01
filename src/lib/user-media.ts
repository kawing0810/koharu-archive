"use client";

import type { Media, Post } from "@/types";
import { isStaticExport, withBasePath } from "@/lib/asset";
import { loadMediaFile, loadMediaIds } from "@/lib/media-db";

function extFromBlob(blob: Blob) {
  if (blob.type === "image/jpeg") return ".jpg";
  if (blob.type === "image/png") return ".png";
  if (blob.type === "image/webp") return ".webp";
  if (blob.type === "image/gif") return ".gif";
  if (blob.type.startsWith("video/")) return ".mp4";
  return ".bin";
}

function staticWriteError() {
  return new Error("靜態站無法寫入硬碟，請在本機 npm run dev 操作");
}

export async function persistUserFile(file: Blob, id: string) {
  if (isStaticExport()) throw staticWriteError();
  const name = `${id}${extFromBlob(file)}`;
  const payload = file instanceof File ? file : new File([file], name, { type: file.type || "application/octet-stream" });
  const form = new FormData();
  form.set("id", id);
  form.set("file", payload, payload.name);
  const res = await fetch(withBasePath("/api/save-media"), { method: "POST", body: form });
  const data = (await res.json()) as { src?: string; error?: string };
  if (!res.ok || !data.src) throw new Error(data.error || "存檔失敗");
  return data.src;
}

export async function persistPostMedia(updates: { id: string; media: Media[] }[]) {
  if (!updates.length) return;
  if (isStaticExport()) throw staticWriteError();
  const res = await fetch(withBasePath("/api/save-post-media"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "寫入貼文媒體失敗");
  }
}

export async function exportIdbMediaToDisk(posts: Post[]) {
  const updates: { id: string; media: Media[] }[] = [];
  let exported = 0;
  let missing = 0;
  let idbKeys = 0;
  try {
    idbKeys = (await loadMediaIds()).length;
  } catch {
    idbKeys = 0;
  }

  for (const post of posts) {
    if (!post.media.some((item) => item.src.startsWith("idb:"))) continue;
    const media: Media[] = [];
    let changed = false;
    for (const item of post.media) {
      if (!item.src.startsWith("idb:")) {
        media.push(item);
        continue;
      }
      const id = item.src.slice(4);
      const blob = await loadMediaFile(id);
      if (!blob) {
        // Dead browser blob: drop placeholder so the post shows up as needing files again.
        missing += 1;
        changed = true;
        continue;
      }
      const src = await persistUserFile(blob, id);
      media.push({ ...item, src });
      exported += 1;
      changed = true;
    }
    if (changed) updates.push({ id: post.id, media });
  }

  const diskOnly = updates.filter((item) => item.media.every((m) => m.src.startsWith("/media/")));
  if (diskOnly.length) await persistPostMedia(diskOnly);
  return { updates, exported, missing, idbKeys };
}
