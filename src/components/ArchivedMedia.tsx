"use client";

import { useState } from "react";
import { useMediaSrc } from "@/lib/media-db";
import type { Media } from "@/types";

export function ArchivedMedia({
  item,
  className,
  controls = true,
}: {
  item: Media;
  className?: string;
  controls?: boolean;
}) {
  const src = useMediaSrc(item.src);
  const poster = useMediaSrc(item.thumbnail ?? "");
  const [videoFailed, setVideoFailed] = useState(false);

  if (!src) return <div className={`bg-[#111] ${className ?? ""}`} />;

  if (item.type === "video") {
    if (videoFailed) {
      return (
        <div
          className={`flex flex-col items-center justify-center gap-1 bg-[#1a1a1a] px-4 text-center text-sm text-white/80 ${className ?? ""}`}
        >
          <p>影片僅在本機封存可播放</p>
          <p className="text-xs text-white/50">請用 npm run dev，或透過 Tunnel／Tailscale 連回本機</p>
        </div>
      );
    }
    return (
      <video
        className={className}
        controls={controls}
        poster={poster || undefined}
        src={src}
        onError={() => setVideoFailed(true)}
      />
    );
  }

  return <img className={className} src={src} alt="" />;
}
