"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import bundled from "@/data/posts.json";
import { loadPosts, mergePosts, replacePostMedia, resetPosts, applyMediaUpdates } from "@/store";
import type { Media, Post } from "@/types";
import { exportIdbMediaToDisk } from "@/lib/user-media";

type UndoSnapshot = { id: string; media: Media[] };

type PostsContextValue = {
  posts: Post[];
  setFromImport: (incoming: Post[]) => void;
  replaceMedia: (id: string, media: Media[]) => void;
  undoMedia: () => void;
  canUndo: boolean;
  reset: () => void;
  exportNote: string;
};

const PostsContext = createContext<PostsContextValue | null>(null);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(bundled as Post[]);
  const [undo, setUndo] = useState<UndoSnapshot | null>(null);
  const [exportNote, setExportNote] = useState("");
  useEffect(() => {
    const loaded = loadPosts();
    setPosts(loaded);
    let cancelled = false;
    const needsExport = loaded.some((p) => (p.media || []).some((m) => m.src.startsWith("idb:")));
    if (!needsExport) {
      setExportNote("");
      return;
    }
    void exportIdbMediaToDisk(loaded)
      .then((result) => {
        if (cancelled) return;
        if (result.updates.length) setPosts(applyMediaUpdates(result.updates));
        if (result.exported) {
          setExportNote(
            `已把 ${result.exported} 個限定檔存到硬碟${result.missing ? `（另有 ${result.missing} 個讀不到，已清掉佔位）` : ""}。`,
          );
        } else if (result.missing) {
          setExportNote(
            `有 ${result.missing} 個舊的瀏覽器圖檔讀不到，已清掉佔位；請到「匯入貼文」把缺的限定圖再補一次。`,
          );
        }
      })
      .catch((error) => {
        if (!cancelled) setExportNote(error instanceof Error ? error.message : "匯出限定圖失敗");
      });
    return () => {
      cancelled = true;
    };
  }, [(bundled as Post[]).length]);
  const value = useMemo(
    () => ({
      posts: [...posts].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)),
      setFromImport: (incoming: Post[]) => setPosts(mergePosts(incoming)),
      replaceMedia: (id: string, media: Media[]) => {
        const prev = posts.find((p) => p.id === id);
        if (prev) setUndo({ id, media: prev.media });
        setPosts(replacePostMedia(id, media));
      },
      undoMedia: () => {
        if (!undo) return;
        setPosts(replacePostMedia(undo.id, undo.media));
        setUndo(null);
      },
      canUndo: Boolean(undo),
      reset: () => {
        setUndo(null);
        setPosts(resetPosts());
      },
      exportNote,
    }),
    [posts, undo, exportNote],
  );
  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error("usePosts must be used within PostsProvider");
  return ctx;
}
