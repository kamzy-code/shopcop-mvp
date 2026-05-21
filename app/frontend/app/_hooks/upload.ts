import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { apiFetch } from '../_lib/fetchWrapper';

interface UploadSignature {
  apiKey: string;
  timestamp: number;
  signature: string;
  upload_preset: string;
  folder: string;
  type: string;
}

const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
export interface UploadResult {
  url: string;
  publicId: string;
  resourceType: string;
  width?: number;
  height?: number;
}

export function useUploadPublicMedia() {
  return useMutation({
    mutationFn: async ({
      file,
      setUploadProgress,
    }: {
      file: File;
      setUploadProgress: (percent: number) => void;
    }): Promise<UploadResult> => {
      if (!cloudName || !uploadPreset) throw new Error('Cloudinary configuration is missing');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
            setUploadProgress(percent);
          },
        }
      );
      const data = res.data;
      return {
        url: data.secure_url,
        publicId: data.public_id,
        resourceType: data.resource_type,
        width: data.width,
        height: data.height,
      };
    },
  });
}

export function useUploadSensitiveDocument() {
  return useMutation({
    mutationFn: async ({
      file,
      setUploadProgress,
    }: {
      file: File;
      setUploadProgress: (percent: number) => void;
    }): Promise<UploadResult> => {
      if (!cloudName) throw new Error('Cloudinary configuration is missing');

      const sig = await apiFetch<UploadSignature>('/uploads/signature').then((r) => r.data);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sig.apiKey);
      formData.append('timestamp', String(sig.timestamp));
      formData.append('signature', sig.signature);
      formData.append('upload_preset', sig.upload_preset); // ← now included
      formData.append('folder', sig.folder);
      formData.append('type', sig.type);

      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
            setUploadProgress(percent);
          },
        }
      );
      const data = res.data;
      return {
        url: data.secure_url,
        publicId: data.public_id,
        resourceType: data.resource_type,
      };
    },
  });
}
