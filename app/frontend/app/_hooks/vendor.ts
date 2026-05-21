import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch } from '../_lib/fetchWrapper';
import { Product, VendorProfile, VerificationRecord } from '../_types';
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

export const useSubmitPersonalInfo = () =>
  useMutation({
    mutationFn: (data: {
      first_name: string;
      last_name: string;
      gender: 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY';
      date_of_birth: string;
      phone_number: string;
      middle_name?: string;
    }) =>
      apiFetch('/vendors/personal-info', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
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

export const useSubmitNINVerification = () =>
  useMutation({
    mutationFn: (data: {
      nin_number: string;
      nin_full_name: string;
      govt_id_front_url: string;
      govt_id_front_public_id: string;
      govt_id_back_url?: string;
      govt_id_back_public_id?: string;
    }) =>
      apiFetch<VerificationRecord>('/verifications/nin', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });

/** @deprecated Use useSubmitNINVerification */
export const useVerifyNin = useSubmitNINVerification;

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
