import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../_lib/fetchWrapper';
import {
  AdminDashboardStats,
  AdminUserDetail,
  AdminUsersResponse,
  AdminVerificationsResponse,
  VerificationRecord,
} from '../_types';

// ============================================================
// FILTERS
// ============================================================

export interface AdminUsersFilters {
  role?: 'VENDOR' | 'BUYER' | 'ADMIN';
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminVerificationsFilters {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  type?: 'NIN' | 'CAC' | 'SMEDAN' | 'ADDRESS';
  vendorId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'submitted_at' | 'reviewed_at';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================
// DASHBOARD
// ============================================================

export const useAdminDashboardStats = () =>
  useQuery<AdminDashboardStats>({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const res = await apiFetch<AdminDashboardStats>('/admin/dashboard/stats');
      return res.data;
    },
    staleTime: 60 * 1000,     // 1 minute
    gcTime: 5 * 60 * 1000,
  });

// ============================================================
// USERS
// ============================================================

export const useAdminUsers = (filters: AdminUsersFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.role) params.set('role', filters.role);
  if (filters.is_active !== undefined) params.set('is_active', String(filters.is_active));
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();

  return useQuery<AdminUsersResponse>({
    queryKey: ['admin-users', filters],
    queryFn: async () => {
      const res = await apiFetch<AdminUsersResponse>(`/admin/users${qs ? `?${qs}` : ''}`);
      return res.data;
    },
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useAdminUser = (id: string) =>
  useQuery<AdminUserDetail>({
    queryKey: ['admin-user', id],
    queryFn: async () => {
      const res = await apiFetch<AdminUserDetail>(`/admin/users/${id}`);
      return res.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });

export const useAdminUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiFetch<AdminUserDetail>(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
    },
  });
};

export const useAdminUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'VENDOR' | 'BUYER' | 'ADMIN' }) =>
      apiFetch<AdminUserDetail>(`/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
    },
  });
};

// ============================================================
// VERIFICATIONS
// ============================================================

export const useAdminVerifications = (filters: AdminVerificationsFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  if (filters.vendorId) params.set('vendorId', filters.vendorId);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
  const qs = params.toString();

  return useQuery<AdminVerificationsResponse>({
    queryKey: ['admin-verifications', filters],
    queryFn: async () => {
      const res = await apiFetch<AdminVerificationsResponse>(
        `/admin/verifications${qs ? `?${qs}` : ''}`
      );
      return res.data;
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useAdminVerificationDetail = (id: string) =>
  useQuery<VerificationRecord>({
    queryKey: ['admin-verification', id],
    queryFn: async () => {
      const res = await apiFetch<VerificationRecord>(`/admin/verifications/${id}`);
      return res.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });

export const useAdminSignedUrl = (id: string) =>
  useQuery<{ front_url?: string; back_url?: string | null; url?: string }>({
    queryKey: ['admin-signed-url', id],
    queryFn: async () => {
      const res = await apiFetch<{ front_url?: string; back_url?: string | null; url?: string }>(
        `/admin/verifications/${id}/signed-url`
      );
      return res.data;
    },
    enabled: false, // Only fetch on demand
    staleTime: 4 * 60 * 1000, // Signed URLs expire, keep fresh — 4 minutes
  });

export const useAdminApproveVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, admin_notes }: { id: string; admin_notes?: string }) =>
      apiFetch(`/admin/verifications/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ admin_notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-verification', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
  });
};

export const useAdminRejectVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      rejection_reason,
      admin_notes,
    }: {
      id: string;
      rejection_reason: string;
      admin_notes?: string;
    }) =>
      apiFetch(`/admin/verifications/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ rejection_reason, admin_notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-verification', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
  });
};
