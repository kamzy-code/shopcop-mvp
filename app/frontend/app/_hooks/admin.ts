import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../_lib/fetchWrapper';
import {
  AdminDashboardStats,
  AdminProfile,
  AdminUserDetail,
  AdminUsersResponse,
  AdminVerificationsResponse,
  VerificationRecord,
  AdminProductListResponse,
  AdminProductAnalytics,
  AdminProductDetail,
  AdminProductFilters,
  AdminOrderListResponse,
  AdminOrderAnalytics,
  AdminOrderAnalyticsPeriod,
  AdminOrderListItem,
  AdminOrderDetail,
  AdminOrderFilters,
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
      // Approval triggers a tier recalculation — invalidate user list and any
      // open vendor detail so tier badges don't stay stale
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user'] });
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
      // Rejection updates verification points — same stale risk on user views
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user'] });
    },
  });
};

// ============================================================
// ADMIN PROFILE
// ============================================================

export const useAdminProfile = () =>
  useQuery<AdminProfile | null>({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      const res = await apiFetch<AdminProfile | null>('/admin/profile');
      return res.data ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateAdminProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AdminProfile>) =>
      apiFetch<AdminProfile>('/admin/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
    },
  });
};

// ============================================================
// ADMIN PRODUCTS
// ============================================================

function buildAdminProductQuery(filters: AdminProductFilters) {
  const params = new URLSearchParams();
  if (filters.vendor_id) params.set('vendor_id', filters.vendor_id);
  if (filters.status) params.set('status', filters.status);
  if (filters.flagged !== undefined) params.set('flagged', String(filters.flagged));
  if (filters.low_stock !== undefined) params.set('low_stock', String(filters.low_stock));
  if (filters.search) params.set('search', filters.search);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  return params.toString();
}

export const useAdminProducts = (filters: AdminProductFilters = {}) => {
  const qs = buildAdminProductQuery(filters);

  return useQuery<AdminProductListResponse>({
    queryKey: ['admin-products', filters],
    queryFn: async () => {
      const res = await apiFetch<AdminProductListResponse>(`/admin/products${qs ? `?${qs}` : ''}`);
      return res.data;
    },
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useAdminProductAnalytics = () =>
  useQuery<AdminProductAnalytics>({
    queryKey: ['admin-product-analytics'],
    queryFn: async () => {
      const res = await apiFetch<AdminProductAnalytics>('/admin/products/analytics');
      return res.data;
    },
    staleTime: 60 * 1000,
  });

export const useAdminProduct = (id: string) =>
  useQuery<AdminProductDetail>({
    queryKey: ['admin-product', id],
    queryFn: async () => {
      const res = await apiFetch<AdminProductDetail>(`/admin/products/${id}`);
      return res.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });

function invalidateAdminProductQueries(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  queryClient.invalidateQueries({ queryKey: ['admin-product-analytics'] });
  if (id) queryClient.invalidateQueries({ queryKey: ['admin-product', id] });
}

export const useAdminUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<AdminProductDetail>) =>
      apiFetch<AdminProductDetail>(`/admin/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => invalidateAdminProductQueries(queryClient, id),
  });
};

export const useAdminFlagProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch<AdminProductDetail>(`/admin/products/${id}/flag`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: (_, { id }) => invalidateAdminProductQueries(queryClient, id),
  });
};

export const useAdminApproveProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiFetch<AdminProductDetail>(`/admin/products/${id}/approve`, { method: 'PATCH' }),
    onSuccess: (_, { id }) => invalidateAdminProductQueries(queryClient, id),
  });
};

export const useAdminArchiveProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiFetch<AdminProductDetail>(`/admin/products/${id}`, { method: 'DELETE' }),
    onSuccess: (_, { id }) => invalidateAdminProductQueries(queryClient, id),
  });
};

// ============================================================
// ADMIN TRANSACTIONS (ORDERS)
// ============================================================

function buildAdminOrderQuery(filters: AdminOrderFilters) {
  const params = new URLSearchParams();
  if (filters.vendor_id) params.set('vendor_id', filters.vendor_id);
  if (filters.status) params.set('status', filters.status);
  if (filters.payment_status) params.set('payment_status', filters.payment_status);
  if (filters.refund_status) params.set('refund_status', filters.refund_status);
  if (filters.search) params.set('search', filters.search);
  if (filters.from_date) params.set('from_date', filters.from_date);
  if (filters.to_date) params.set('to_date', filters.to_date);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  return params.toString();
}

export const useAdminOrders = (filters: AdminOrderFilters = {}) => {
  const qs = buildAdminOrderQuery(filters);

  return useQuery<AdminOrderListResponse>({
    queryKey: ['admin-orders', filters],
    queryFn: async () => {
      const res = await apiFetch<AdminOrderListResponse>(`/admin/orders${qs ? `?${qs}` : ''}`);
      return res.data;
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useAdminOrderAnalytics = (period: AdminOrderAnalyticsPeriod = 'monthly', date?: string) =>
  useQuery<AdminOrderAnalytics>({
    queryKey: ['admin-order-analytics', period, date],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (date) params.set('date', date);
      const res = await apiFetch<AdminOrderAnalytics>(`/admin/orders/analytics?${params.toString()}`);
      return res.data;
    },
    staleTime: 30 * 1000,
  });

export const useAdminOrder = (id: string) =>
  useQuery<AdminOrderDetail>({
    queryKey: ['admin-order', id],
    queryFn: async () => {
      const res = await apiFetch<AdminOrderDetail>(`/admin/orders/${id}`);
      return res.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });

