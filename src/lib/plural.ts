/**
 * Russian plural helper: 1 файл, 2 файла, 5 файлов.
 */
export function pluralRu(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

export function formatFileCount(count: number): string {
  return `${count} ${pluralRu(count, "файл", "файла", "файлов")}`;
}
