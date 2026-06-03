import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../_lib/fetchWrapper';
import type { PublicVendorProfile } from '../_types';

export const usePublicVendorProfile = (
  slug: string,
  reviewPage: number = 1,
  productPage: number = 1
) =>
  useQuery<PublicVendorProfile>({
    queryKey: ['public-vendor-profile', slug, reviewPage, productPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        review_page: String(reviewPage),
        product_page: String(productPage),
      });
      const res = await apiFetch<PublicVendorProfile>(`/public/vendors/${slug}?${params}`);
      return res.data;
    },
    enabled: !!slug,
    staleTime: 60 * 1000,
  });
