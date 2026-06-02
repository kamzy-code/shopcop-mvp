import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../_lib/fetchWrapper';
import type { TrustMetrics } from '../_types';

export const useTrustMetrics = () =>
  useQuery<TrustMetrics>({
    queryKey: ['trust-metrics'],
    queryFn: async () => {
      const res = await apiFetch<TrustMetrics>('/vendors/trust-metrics');
      return res.data;
    },
    staleTime: 30 * 1000,
  });
