import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../_lib/fetchWrapper';
import type { PublicVendorProfile } from '../_types';

export const usePublicVendorProfile = (slug: string) =>
  useQuery<PublicVendorProfile>({
    queryKey: ['public-vendor-profile', slug],
    queryFn: async () => {
      const res = await apiFetch<PublicVendorProfile>(`/public/vendors/${slug}`);
      return res.data;
    },
    enabled: !!slug,
    staleTime: 60 * 1000,
  });
