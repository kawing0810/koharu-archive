"use client";

import club from "@/data/club.json";

export default function AboutPage() {
  return (
    <div className="bg-white p-8 shadow-sm md:rounded-xl">
      <h1 className="text-xl font-semibold">關於封存</h1>
      <p className="mt-4 text-[14px] leading-7 text-[#555]">
        {club.name}（{club.idolName}）於 2026/9/21 停止更新，2026/10/1 關閉。
        <br />
        這份備份把動態文字與媒體留在本機，方便之後自己回看。
      </p>
      <ul className="mt-5 space-y-2 text-[14px] leading-7 text-[#555]">
        <li>· 公開與限定貼文文字都在本地</li>
        <li>· 媒體檔在 public/media</li>
        <li>· 不連線、不依賴原平台</li>
      </ul>
      <p className="mt-6 text-[13px] text-[#888]">若還有缺的限定圖，可到「匯入貼文」補上。</p>
    </div>
  );
}
