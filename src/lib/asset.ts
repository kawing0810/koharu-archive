/** Prefix public paths with Next.js basePath (GitHub Pages project sites). */
export function withBasePath(src: string) {
  if (!src) return src;
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("idb:") ||
    src.startsWith("blob:") ||
    src.startsWith("data:")
  ) {
    return src;
  }
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (!base) return src;
  if (src === base || src.startsWith(`${base}/`)) return src;
  return src.startsWith("/") ? `${base}${src}` : src;
}

export function isStaticExport() {
  return process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
}
