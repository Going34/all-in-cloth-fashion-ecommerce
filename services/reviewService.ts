import { createClient } from '@/utils/supabase/client';
import type { Review, ReviewInput } from '@/types';

const supabase = createClient();

export interface ReviewWithUser extends Review {
  user_name?: string;
}

export async function getReviewsByProductId(productId: string): Promise<ReviewWithUser[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      users (name)
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return ((data as any[]) || []).map((review) => ({
    ...review,
    user_name: review.users?.name || 'Anonymous',
  }));
}

export async function createReview(
  userId: string,
  input: ReviewInput
): Promise<{ data: Review | null; error: Error | null }> {
  // Check if user already reviewed this product
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', input.product_id)
    .single();

  if (existing) {
    return { data: null, error: new Error('You have already reviewed this product') };
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: userId,
      product_id: input.product_id,
      rating: input.rating,
      comment: input.comment,
    } as any)
    .select()
    .single();

  return { data: data as Review | null, error: error as Error | null };
}

export async function updateReview(
  reviewId: string,
  userId: string,
  updates: { rating?: number; comment?: string }
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('reviews')
    .update(updates as any)
    .eq('id', reviewId)
    .eq('user_id', userId);

  return { error: error as Error | null };
}

export async function deleteReview(reviewId: string, userId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', userId);

  return { error: error as Error | null };
}

export async function getProductRatingStats(productId: string): Promise<{
  avgRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
}> {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId);

  if (!reviews || reviews.length === 0) {
    return {
      avgRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const reviewList = reviews as any[];
  const totalRating = reviewList.reduce((sum, r) => sum + r.rating, 0);
  const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviewList.forEach((r) => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
  });

  return {
    avgRating: totalRating / reviewList.length,
    totalReviews: reviewList.length,
    ratingDistribution: distribution,
  };
}

export async function getUserReviews(userId: string): Promise<ReviewWithUser[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      products (name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }

  return ((data as any[]) || []).map((review) => ({
    ...review,
    product_name: review.products?.name,
  }));
}
