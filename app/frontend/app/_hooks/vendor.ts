import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch } from '../_lib/fetchWrapper';
import { Product, VendorProfile } from '../_types';
import { ProductFormData } from '../validators/vendorSchema';

export const useVendorProfile = () =>
  useQuery<VendorProfile>({
    queryKey: ['vendor-profile'],
    queryFn: async () => {
      const res = await apiFetch<VendorProfile>('/vendors/');
      return res.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

export const useSubmitBusinessInfo = () =>
  useMutation({
    mutationFn: (data: {
      businessName: string;
      categories: string[];
      address: string;
      description?: string;
    }) =>
      apiFetch('/vendors/business-info', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });

export const useVerifyBvn = () =>
  useMutation({
    mutationFn: (data: { bvn: string }) =>
      apiFetch('/vendors/verify-bvn', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });

export const useVerifyNin = () =>
  useMutation({
    mutationFn: (data: { fullName: string; nin: string; governmentIdUrl?: string }) =>
      apiFetch('/vendors/verify-nin', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });

export const useCompleteOnboarding = () =>
  useMutation({
    mutationFn: () => apiFetch('/vendors/complete-onboarding', { method: 'POST' }),
  });

export const useProducts = () =>
  useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await apiFetch<Product[]>('/products');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useCreateProduct = () =>
  useMutation({
    mutationFn: (data: ProductFormData & { images: string[] }) =>
      apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {},
      }),
  });

export const useDeleteProduct = () =>
  useMutation({
    mutationFn: (productId: string) => apiFetch(`/products/${productId}`, { method: 'DELETE' }),
  });

export const useUpdateProduct = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      apiFetch(`/products/${id}`, {
        method: 'PUT',
        body: data,
        headers: {},
      }),
  });
