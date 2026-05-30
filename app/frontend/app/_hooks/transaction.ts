import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../_lib/fetchWrapper';
import {
  CreateTransactionInput,
  Transaction,
  TransactionAnalytics,
  TransactionFilters,
  TransactionListItem,
  TransactionListResponse,
  TransactionStatus,
  UpdateTransactionInput,
} from '../_types';

type TransactionListApiResponse = {
  success: boolean;
  data: TransactionListItem[];
  meta: TransactionListResponse['meta'];
};

export const useTransactions = (filters?: TransactionFilters) =>
  useQuery<TransactionListResponse>({
    queryKey: ['transactions', filters],
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
      const res = (await apiFetch<TransactionListItem[]>(`/transactions${query ? `?${query}` : ''}`)) as unknown as TransactionListApiResponse;
      return { data: res.data, meta: res.meta };
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

export const useTransaction = (id: string) =>
  useQuery<Transaction>({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const res = await apiFetch<Transaction>(`/transactions/${id}`);
      return res.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });

export const useTransactionByToken = (token: string) =>
  useQuery<Transaction>({
    queryKey: ['transaction-public', token],
    queryFn: async () => {
      const res = await apiFetch<Transaction>(`/track/${token}`);
      return res.data;
    },
    enabled: !!token,
    staleTime: 30 * 1000,
    retry: 1,
  });

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionInput) =>
      apiFetch<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionInput }) =>
      apiFetch<Transaction>(`/transactions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', variables.id] });
    },
  });
};

export const useUpdateTransactionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: TransactionStatus; note?: string }) =>
      apiFetch<Transaction>(`/transactions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', variables.id] });
    },
  });
};

export const useConfirmPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payment_notes }: { id: string; payment_notes?: string }) =>
      apiFetch<Transaction>(`/transactions/${id}/confirm-payment`, {
        method: 'PATCH',
        body: JSON.stringify({ payment_notes }),
      }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transaction', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useCancelTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch<Transaction>(`/transactions/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', variables.id] });
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
      queryClient.invalidateQueries({ queryKey: ['transaction-public', token] });
    },
  });
};

export const useTransactionAnalytics = () =>
  useQuery<TransactionAnalytics>({
    queryKey: ['transaction-analytics'],
    queryFn: async () => {
      const res = await apiFetch<TransactionAnalytics>('/transactions/analytics/summary');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useBuyerCancelTransaction = (token: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { reason: string }) =>
      apiFetch(`/track/${token}/cancel`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-public', token] });
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
      queryClient.invalidateQueries({ queryKey: ['transaction-public', token] });
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
      queryClient.invalidateQueries({ queryKey: ['transaction-public', token] });
    },
  });
};

export const useUpdateTransactionStatusWithRefund = () => {
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
      status: TransactionStatus;
      note?: string;
      refund_amount?: number;
      refund_vendor_notes?: string;
    }) =>
      apiFetch<Transaction>(`/transactions/${id}/refund-status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note, refund_amount, refund_vendor_notes }),
      }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', variables.id] });
    },
  });
};
