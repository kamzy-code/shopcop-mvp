import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../_lib/fetchWrapper';
import {
  CreateOrderInput,
  Order,
  OrderAnalytics,
  OrderFilters,
  OrderListItem,
  OrderListResponse,
  OrderStatus,
  UpdateOrderInput,
} from '../_types';

type OrderListApiResponse = {
  success: boolean;
  data: OrderListItem[];
  meta: OrderListResponse['meta'];
};

export const useOrders = (filters?: OrderFilters) =>
  useQuery<OrderListResponse>({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
          }
        });
      }
      const query = params.toString();
      const res = (await apiFetch<OrderListItem[]>(`/orders${query ? `?${query}` : ''}`)) as unknown as OrderListApiResponse;
      return { data: res.data, meta: res.meta };
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

export const useOrder = (id: string) =>
  useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await apiFetch<Order>(`/orders/${id}`);
      return res.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });

export const useOrderByToken = (token: string) =>
  useQuery<Order>({
    queryKey: ['order-public', token],
    queryFn: async () => {
      const res = await apiFetch<Order>(`/track/${token}`);
      return res.data;
    },
    enabled: !!token,
    staleTime: 30 * 1000,
    retry: 1,
  });

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderInput) =>
      apiFetch<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderInput }) =>
      apiFetch<Order>(`/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: OrderStatus; note?: string }) =>
      apiFetch<Order>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
    },
  });
};

export const useConfirmPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payment_notes }: { id: string; payment_notes?: string }) =>
      apiFetch<Order>(`/orders/${id}/confirm-payment`, {
        method: 'PATCH',
        body: JSON.stringify({ payment_notes }),
      }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch<Order>(`/orders/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
    },
  });
};

export const useSubmitPaymentProof = (token: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { buyer_email?: string; payment_proof_url?: string }) =>
      apiFetch(`/track/${token}/submit-payment`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-public', token] });
    },
  });
};

export const useOrderAnalytics = () =>
  useQuery<OrderAnalytics>({
    queryKey: ['order-analytics'],
    queryFn: async () => {
      const res = await apiFetch<OrderAnalytics>('/orders/analytics/summary');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useBuyerCancelOrder = (token: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { reason: string }) =>
      apiFetch(`/track/${token}/cancel`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-public', token] });
    },
  });
};

export const useBuyerConfirmDelivery = (token: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/track/${token}/confirm-delivery`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-public', token] });
    },
  });
};

export const useBuyerRequestRefund = (token: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { reason: string }) =>
      apiFetch(`/track/${token}/request-refund`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-public', token] });
    },
  });
};

export const useBuyerCloseResolution = (token: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/track/${token}/close`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-public', token] });
    },
  });
};

export const useUpdateOrderStatusWithRefund = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      note,
      refund_amount,
      refund_vendor_notes,
    }: {
      id: string;
      status: OrderStatus;
      note?: string;
      refund_amount?: number;
      refund_vendor_notes?: string;
    }) =>
      apiFetch<Order>(`/orders/${id}/refund-status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note, refund_amount, refund_vendor_notes }),
      }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
    },
  });
};
