export function truncateText(value: string, max: number) {
  const chars = Array.from(value);
  if (chars.length <= max) return value;
  return chars.slice(0, max).join("");
}

export function isLongText(value: string, max: number) {
  return Array.from(value).length > max;
}
