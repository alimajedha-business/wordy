/**
 * Converts English digits to Persian digits.
 */
export function toPersianDigits(value: number | string): string {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(value).replace(/\d/g, (x) => farsiDigits[Number(x)]);
}
