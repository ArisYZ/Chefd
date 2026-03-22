import type { Review } from '@/types';

/** 1.0–5.0 in 0.5 steps (matches ReviewModal half-star scale). */
const TASTE_HALF_STEPS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * When a review has no taste score, assigns a stable 1–5 value in 0.5 increments
 * derived from the review id so aggregates and exports stay consistent.
 */
export function ensureReviewTasteRating(review: Review): Review {
  if (review.tasteRating != null && review.tasteRating > 0) {
    if (review.tasteRating < 1) {
      return { ...review, tasteRating: 1 };
    }
    return review;
  }
  const idx = hashId(review.id) % TASTE_HALF_STEPS.length;
  return { ...review, tasteRating: TASTE_HALF_STEPS[idx] };
}
