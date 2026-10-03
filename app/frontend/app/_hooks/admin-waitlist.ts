import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiFetch } from '../_lib/fetchWrapper';
import { WaitlistListResponse, UpdateWaitlistStatusInput } from '../_types';

export interface AdminWaitlistFilters {
  status?: string;
  user_type?: string;
  open_to_chat?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

function buildQuery(filters: AdminWaitlistFilters) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.user_type) params.set('user_type', filters.user_type);
  if (typeof filters.open_to_chat === 'boolean') params.set('open_to_chat', String(filters.open_to_chat));
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const useAdminWaitlist = (filters: AdminWaitlistFilters = {}) => {
  const qs = buildQuery(filters);
  return useQuery<WaitlistListResponse>({
    queryKey: ['admin-waitlist', filters],
    queryFn: async () => {
      const res = await apiFetch<WaitlistListResponse>(`/admin/waitlist${qs}`);
      return res.data;
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useUpdateWaitlistStatus = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWaitlistStatusInput }) =>
      apiFetch<any>(`/admin/waitlist/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  });
};