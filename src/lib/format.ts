/** 价格与日期的展示格式，全部集中在这里，改文案不用翻组件 */

/**
 * 48 + '6枚' → '¥48 / 6枚'
 *
 * 价格也可以是文字，比如定制产品写「详讯」—— 取不到数字就原样显示，
 * 不硬拼成「¥详讯」。
 */
export function formatPrice(price: string | number, unit?: string): string {
  const text = String(price).trim();
  const matched = text.replace(/[,，\s]/g, '').match(/\d+(\.\d+)?/);
  if (!matched) return text;

  const n = Number(matched[0]);
  const value = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return unit ? `¥${value} / ${unit}` : `¥${value}`;
}

/** 2026-10-01 → 2026.10.01（品牌更喜欢用点分隔） */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

/** 日期机读格式，用于 <time datetime> */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
