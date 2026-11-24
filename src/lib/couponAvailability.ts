export interface CouponAvailability {
  data_inicio: string;
  data_fim: string;
  quantidade_total: number | null;
  quantidade_usada: number | null;
}

/** A cópia de um código não é um resgate. Apenas disponibilize ofertas ainda utilizáveis. */
export function isCouponAvailable(coupon: CouponAvailability, now = Date.now()): boolean {
  const start = Date.parse(coupon.data_inicio);
  const end = Date.parse(coupon.data_fim);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > now || end < now) return false;
  if (coupon.quantidade_total === null) return true;
  const total = Number(coupon.quantidade_total);
  const used = Number(coupon.quantidade_usada ?? 0);
  return Number.isFinite(total) && total > 0 &&
    Number.isFinite(used) && used >= 0 && used < total;
}
