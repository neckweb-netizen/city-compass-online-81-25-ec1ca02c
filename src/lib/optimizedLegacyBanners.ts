/**
 * Build-generated image alternatives for the exact legacy public banner URLs.
 * A change to an existing banner URL always falls back to its live original.
 * Source of truth: scripts/optimize-existing-banners.py.
 */
export type OptimizedBannerVariant = {
  src: string;
  srcSet: string;
};

export const optimizedBannerByUrl: Record<string, OptimizedBannerVariant> = {};
