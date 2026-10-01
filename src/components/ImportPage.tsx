"use client";

import { useRef, useState } from "react";
import { isStaticExport } from "@/lib/asset";
import { persistPostMedia, persistUserFile } from "@/lib/user-media";
import { usePosts } from "@/lib/posts-context";
import type { Media, Post } from "@/types";
import { ArchivedMedia } from "./ArchivedMedia";

function formatCreatedAt(value: string) {
  if (!value) {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  const [date, time] = value.split("T");
  return `${date.replaceAll("-", ".")} ${time.slice(0, 5)}`;
}

async function filesToMedia(files: FileList | File[]) {
  const media: Media[] = [];
  for (const file of Array.from(files)) {
    const id = crypto.randomUUID();
    const src = await persistUserFile(file, id);
    media.push({
      type: file.type.startsWith("video/") ? "video" : "image",
      src,
    });
  }
  return media;
}

function countReadyMedia(media: Media[]) {
  return media.filter((item) => item.src.startsWith("/media/")).length;
}

function remainingCount(post: Post) {
  if (!post.limited) return 0;
  const ready = countReadyMedia(post.media);
  if (typeof post.mediaCount === "number") return Math.max(0, post.mediaCount - ready);
  return ready === 0 ? 1 : 0;
}

function stillNeedsFiles(post: Post) {
  return remainingCount(post) > 0;
}

function needLabel(post: Post) {
  const left = remainingCount(post);
  const ready = countReadyMedia(post.media);
  if (typeof post.mediaCount === "number") {
    if (ready === 0) return `需補 ${post.mediaCount} 個檔案`;
    return `已有 ${ready}／${post.mediaCount} · 還差 ${left} 個`;
  }
  return "還差檔案";
}

export function ImportPage() {
  const { posts, setFromImport, replaceMedia, undoMedia, canUndo, reset, exportNote } = usePosts();
  const jsonRef = useRef<HTMLInputElement>(null);
  const newFilesRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [fileLabel, setFileLabel] = useState("尚未選擇檔案");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [filledQuery, setFilledQuery] = useState("");
  const locked = posts
    .filter(stillNeedsFiles)
    .sort((a, b) => Number(b.media.length > 0) - Number(a.media.length > 0));
  const filled = posts.filter((p) => p.limited && p.media.length > 0 && !stillNeedsFiles(p));
  const filteredLocked = query.trim()
    ? locked.filter((p) => `${p.createdAt} ${p.text}`.includes(query.trim()))
    : locked;
  const filteredFilled = filledQuery.trim()
    ? filled.filter((p) => `${p.createdAt} ${p.text}`.includes(filledQuery.trim()))
    : filled;

  async function addNewPost() {
    if (!text.trim()) {
      setMessage("請先填貼文內容。");
      return;
    }
    const files = newFilesRef.current?.files;
    const media = files?.length ? await filesToMedia(files) : [];
    const id = crypto.randomUUID();
    setFromImport([
      {
        id,
        createdAt: formatCreatedAt(createdAt),
        limited: true,
        text: text.trim(),
        media,
        likes: 0,
        comments: 0,
      },
    ]);
    if (media.length) void persistPostMedia([{ id, media }]);
    setText("");
    setCreatedAt("");
    setFileLabel("尚未選擇檔案");
    if (newFilesRef.current) newFilesRef.current.value = "";
    setMessage(media.length ? "已新增限定貼文，圖檔會顯示在動態牆。" : "已新增文字貼文。若要補圖，可在下方同一則再選檔案。");
  }

  async function attachToPost(post: Post, files: FileList | null, mode: "append" | "replace") {
    if (!files?.length) return;
    const added = await filesToMedia(files);
    const next = mode === "replace" ? added : [...post.media, ...added];
    replaceMedia(post.id, next);
    void persistPostMedia([{ id: post.id, media: next }]);
    setMessage(
      mode === "replace"
        ? `已重選「${post.text.slice(0, 18)}」的檔案。`
        : `已為「${post.text.slice(0, 18)}」補上 ${files.length} 個檔案。`,
    );
  }

  async function clearPost(post: Post) {
    replaceMedia(post.id, []);
    setMessage(`已清空「${post.text.slice(0, 18)}」，可以重新補圖。`);
  }

  async function removeOne(post: Post, index: number) {
    replaceMedia(
      post.id,
      post.media.filter((_, i) => i !== index),
    );
    setMessage("已移除 1 個檔案。");
  }

  async function onJson(file: File) {
    const parsed = JSON.parse(await file.text()) as Post | Post[];
    setFromImport(Array.isArray(parsed) ? parsed : [parsed]);
    setMessage("已匯入 JSON。");
  }

  const staticSite = isStaticExport();

  return (
    <div className="space-y-5 bg-white p-6 shadow-sm md:rounded-xl">
      {staticSite && (
        <div className="rounded-xl border border-[#ffd9a8] bg-[#fffaf3] px-4 py-3 text-[14px] leading-6 text-[#555]">
          這是 GitHub Pages 靜態站，無法寫入硬碟。要補圖請在本機執行 <code className="text-[#2bb8d6]">npm run dev</code>
          ，或以 Tunnel／Tailscale 連回本機完整版。
        </div>
      )}
      <div>
        <h1 className="text-xl font-semibold">加入限定貼文</h1>
        <p className="mt-2 text-[14px] leading-7 text-[#555]">
          還沒補齊的貼文會留在最上面。補齊之後才會進「已補圖」。放錯可單張移除、清空，或按「還原上一動」。
        </p>
        {canUndo && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-full bg-[#eee] px-4 py-2 text-sm"
              onClick={() => {
                undoMedia();
                setMessage("已還原上一動。");
              }}
            >
              還原上一動
            </button>
          </div>
        )}
        {exportNote && <p className="mt-3 text-[14px] text-[#2bb8d6]">{exportNote}</p>}
      </div>

      {locked.length > 0 && (
        <section className="space-y-3 rounded-xl border border-[#ffd9a8] bg-[#fffaf3] p-4">
          <h2 className="text-[15px] font-medium">還差檔案（{locked.length} 則）· 留在上面補完</h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋日期或文字"
            className="w-full rounded-lg border border-[#ddd] bg-white px-3 py-2 text-[14px]"
          />
          <ul className="max-h-[480px] space-y-3 overflow-y-auto">
            {filteredLocked.map((post) => (
              <li key={post.id} className="space-y-2 rounded-lg bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] text-[#888]">
                      {post.createdAt} · {needLabel(post)}
                    </div>
                    <div className="line-clamp-2 text-[14px]">{post.text || "（無文字）"}</div>
                  </div>
                  <label className="shrink-0 cursor-pointer rounded-full bg-[#2ad4d0] px-3 py-1.5 text-[13px] text-white">
                    {post.media.length ? "繼續補檔" : "補上檔案"}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        void attachToPost(post, e.target.files, "append");
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {post.media.length > 0 && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {post.media.map((item, index) => (
                        <div key={item.src + index} className="relative h-16 w-16 overflow-hidden rounded-md bg-black">
                          <ArchivedMedia item={item} className="h-full w-full object-cover" controls={false} />
                          <button
                            type="button"
                            className="absolute top-0.5 right-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-[11px] text-white"
                            onClick={() => void removeOne(post, index)}
                            aria-label="移除這個檔案"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-[#eee] px-3 py-1.5 text-[13px]"
                      onClick={() => void clearPost(post)}
                    >
                      清空重補
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3 rounded-xl border border-[#eee] p-4">
        <h2 className="text-[15px] font-medium">新增一則</h2>
        <label className="block text-[13px] text-[#666]">
          發文時間
          <input
            type="datetime-local"
            value={createdAt}
            onChange={(e) => setCreatedAt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#ddd] px-3 py-2 text-[14px] text-[#222]"
          />
        </label>
        <label className="block text-[13px] text-[#666]">
          貼文內容
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="貼上小晴的文字…"
            className="mt-1 w-full rounded-lg border border-[#ddd] px-3 py-2 text-[14px] text-[#222]"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-full bg-[#f3f3f3] px-4 py-2 text-sm"
            onClick={() => newFilesRef.current?.click()}
          >
            選擇圖片／影片
          </button>
          <span className="text-[13px] text-[#888]">{fileLabel}</span>
          <input
            ref={newFilesRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const n = e.target.files?.length ?? 0;
              setFileLabel(n ? `已選 ${n} 個檔案` : "尚未選擇檔案");
            }}
          />
        </div>
        <button
          type="button"
          className="rounded-full bg-[#2ad4d0] px-5 py-2 text-sm text-white"
          onClick={() => void addNewPost()}
        >
          加入動態牆
        </button>
      </section>

      {filled.length > 0 && (
        <section className="space-y-3 rounded-xl border border-[#eee] p-4">
          <h2 className="text-[15px] font-medium">已補圖（{filled.length} 則）· 放錯可改</h2>
          <input
            value={filledQuery}
            onChange={(e) => setFilledQuery(e.target.value)}
            placeholder="搜尋已補圖的貼文"
            className="w-full rounded-lg border border-[#ddd] px-3 py-2 text-[14px]"
          />
          <ul className="max-h-[520px] space-y-4 overflow-y-auto">
            {filteredFilled.map((post) => (
              <li key={post.id} className="space-y-2 rounded-lg bg-[#fafafa] p-3">
                <div className="text-[12px] text-[#888]">{post.createdAt}</div>
                <div className="line-clamp-2 text-[14px]">{post.text || "（無文字）"}</div>
                <div className="flex flex-wrap gap-2">
                  {post.media.map((item, index) => (
                    <div key={item.src + index} className="relative h-16 w-16 overflow-hidden rounded-md bg-black">
                      <ArchivedMedia item={item} className="h-full w-full object-cover" controls={false} />
                      <button
                        type="button"
                        className="absolute top-0.5 right-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-[11px] text-white"
                        onClick={() => void removeOne(post, index)}
                        aria-label="移除這個檔案"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer rounded-full bg-[#2ad4d0] px-3 py-1.5 text-[13px] text-white">
                    改選全部
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        void attachToPost(post, e.target.files, "replace");
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="rounded-full bg-[#eee] px-3 py-1.5 text-[13px]"
                    onClick={() => void clearPost(post)}
                  >
                    清空重補
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3 rounded-xl border border-[#eee] p-4">
        <h2 className="text-[15px] font-medium">進階：匯入 JSON</h2>
        <p className="text-[13px] leading-6 text-[#777]">
          「還原內建資料」會清掉你補過的圖，只留下抓下來的文字。
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full bg-[#eee] px-4 py-2 text-sm" onClick={() => jsonRef.current?.click()}>
            選擇 JSON
          </button>
          <button
            className="rounded-full bg-[#eee] px-4 py-2 text-sm"
            onClick={() => {
              reset();
              setMessage("已還原內建資料。");
            }}
          >
            還原內建資料
          </button>
          <input
            ref={jsonRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onJson(file);
            }}
          />
        </div>
      </section>

      {message && <p className="text-[14px] text-[#2bb8d6]">{message}</p>}
    </div>
  );
}

export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="bg-white p-10 text-center shadow-sm md:rounded-xl">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-3 text-[14px] text-[#777]">{note}</p>
    </div>
  );
}
