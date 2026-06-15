'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import { LuArrowLeft, LuPackage } from 'react-icons/lu';
import { productSchema, ProductFormData } from '@/app/validators/vendorSchema';
import { AppShell } from '@/components/shared/appShell';
import { toaster } from '@/components/ui/toaster';
import { AlertModal } from '@/components/ui/alert-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useGetCategories, useProduct, useUpdateProduct } from '@/app/_hooks/vendor';
import { UploadResult, useUploadPublicMedia, useDeleteMedia } from '@/app/_hooks/upload';
import { ProductMediaUpload } from '@/components/product/ProductMediaUpload';
import { ProductBasicInfo } from '@/components/product/ProductBasicInfo';
import { ProductPricingForm } from '@/components/product/ProductPricingForm';
import { ProductCategorySelect } from '@/components/product/ProductCategorySelect';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const { data: product, isLoading: productLoading } = useProduct(productId);
  const updateMutation = useUpdateProduct();
  const { data: categories = [], isLoading: categoriesLoading, isError: categoriesError } = useGetCategories();
  const uploadMutation = useUploadPublicMedia();
  const deleteMutation = useDeleteMedia();

  const [mediaFiles, setMediaFiles] = useState<(UploadResult | null)[]>([null, null, null, null, null]);
  const [localPreviews, setLocalPreviews] = useState<Record<number, string>>({});
  const [uploadingSlots, setUploadingSlots] = useState<Record<number, boolean>>({});
  const [initialised, setInitialised] = useState(false);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [errorModal, setErrorModal] = useState<{ open: boolean; title: string; description: string }>({ open: false, title: '', description: '' });

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, clearErrors, reset } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { stock_status: 'IN_STOCK', category: '' },
  });

  const selectedCategory = watch('category');
  const selectedStock = watch('stock_status');
  const anyUploading = Object.values(uploadingSlots).some(Boolean);

  useEffect(() => {
    if (product && !initialised) {
      reset({
        name: product.name,
        description: product.description ?? '',
        price: product.price,
        category: product.category,
        stock_status: product.stock_status,
        stock_quantity: product.stock_quantity ?? undefined,
      });

      const existingMedia = product.media.slice(0, 5).map((img) => ({
        url: img.media_url,
        publicId: img.public_id ?? '',
        resourceType: img.media_type === 'VIDEO' ? 'video' : 'image',
      }));

      const slots: (UploadResult | null)[] = [null, null, null, null, null];
      existingMedia.forEach((m, i) => { slots[i] = m; });
      setMediaFiles(slots);
      setInitialised(true);
    }
  }, [product, initialised, reset]);

  const handleAddImage = async (index: number, file: File) => {
    const localUrl = URL.createObjectURL(file);
    setLocalPreviews((prev) => ({ ...prev, [index]: localUrl }));
    setUploadingSlots((prev) => ({ ...prev, [index]: true }));

    try {
      const uploadResult = await uploadMutation.mutateAsync({ file, setUploadProgress: () => {} });
      URL.revokeObjectURL(localUrl);
      setLocalPreviews((prev) => { const next = { ...prev }; delete next[index]; return next; });
      setUploadingSlots((prev) => ({ ...prev, [index]: false }));
      setMediaFiles((prev) => { const next = [...prev]; next[index] = uploadResult; return next; });
    } catch (error) {
      URL.revokeObjectURL(localUrl);
      setLocalPreviews((prev) => { const next = { ...prev }; delete next[index]; return next; });
      setUploadingSlots((prev) => ({ ...prev, [index]: false }));
      toaster.create({ title: 'Failed to upload image', description: error instanceof Error ? error.message : 'Try again', type: 'error' });
    }
  };

  const handleConfirmRemove = async () => {
    if (removingIndex === null) return;
    const index = removingIndex;
    const file = mediaFiles[index];
    if (file?.publicId) {
      try { await deleteMutation.mutateAsync(file.publicId); } catch { /* proceed */ }
    }
    if (localPreviews[index]) URL.revokeObjectURL(localPreviews[index]);
    setLocalPreviews((prev) => { const next = { ...prev }; delete next[index]; return next; });
    setUploadingSlots((prev) => ({ ...prev, [index]: false }));
    setMediaFiles((prev) => { const next = [...prev]; next[index] = null; return next; });
    setRemovingIndex(null);
  };

  const onSubmit = async (data: ProductFormData) => {
    if (anyUploading) { toaster.create({ title: 'Please wait for uploads to complete', type: 'warning' }); return; }

    const uploadedFiles = mediaFiles.filter(Boolean) as UploadResult[];
    const media = uploadedFiles.map((m) => ({
      url: m.url,
      public_id: m.publicId || undefined,
      media_type: (m.resourceType === 'video' ? 'VIDEO' : 'IMAGE') as 'IMAGE' | 'VIDEO',
    }));

    try {
      await updateMutation.mutateAsync({ id: productId, data: { ...data, media } });
      toaster.create({ title: 'Product updated successfully!', type: 'success' });
      router.push('/products');
    } catch (error) {
      setErrorModal({ open: true, title: 'Failed to update product', description: error instanceof Error ? error.message : 'Please try again.' });
    }
  };

  if (productLoading) {
    return (
      <AppShell>
        <Flex justify="center" py={16}><Spinner size="xl" colorPalette="primary" /></Flex>
      </AppShell>
    );
  }

  if (!product) {
    return (
      <AppShell>
        <Box textAlign="center" py={16}>
          <Text color="fg.muted">Product not found.</Text>
          <Button mt={4} onClick={() => router.push('/products')}>Back to Products</Button>
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AlertModal open={errorModal.open} onClose={() => setErrorModal((s) => ({ ...s, open: false }))} title={errorModal.title} description={errorModal.description} type="error" />
      <ConfirmDialog
        open={removingIndex !== null}
        onClose={() => setRemovingIndex(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Image"
        description={removingIndex !== null && mediaFiles[removingIndex] ? 'This will permanently delete this file. Continue?' : 'Remove this image?'}
        confirmLabel="Remove"
        colorPalette="red"
        isLoading={deleteMutation.isPending}
      />
      <Stack gap={6} maxW="720px" mx="auto">
        <Stack gap={0.5}>
          <Button variant="ghost" size="sm" color="fg.muted" alignSelf="flex-start" mb={2} onClick={() => router.push('/products')}>
            <LuArrowLeft size={14} />
            Back to Products
          </Button>
          <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">Edit Product</Heading>
          <Text color="fg.muted" textStyle="sm">Update your product details below.</Text>
        </Stack>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap={5}>
            <ProductMediaUpload
              mediaFiles={mediaFiles}
              localPreviews={localPreviews}
              uploadingSlots={uploadingSlots}
              onAdd={handleAddImage}
              onRemove={(index) => setRemovingIndex(index)}
              label="Product Images"
              description="Up to 5 images. The first image is the primary display image."
            />

            <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
              <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>Product Details</Text>
              <Stack gap={5}>
                <ProductBasicInfo register={register} errors={errors} />
                <ProductPricingForm register={register} errors={errors} setValue={setValue} selectedStock={selectedStock} />
                <ProductCategorySelect
                  categories={categories}
                  categoriesLoading={categoriesLoading}
                  categoriesError={categoriesError}
                  selectedCategory={selectedCategory}
                  errors={errors}
                  setValue={setValue}
                  clearErrors={clearErrors}
                />
              </Stack>
            </Box>

            <Flex gap={3} justify="flex-end">
              <Button variant="outline" size="lg" colorPalette="navy" onClick={() => router.push('/products')}>Cancel</Button>
              <Button type="submit" colorPalette="primary" size="lg" loading={isSubmitting || updateMutation.isPending} disabled={isSubmitting || anyUploading}>
                <LuPackage />
                Save Changes
              </Button>
            </Flex>
          </Stack>
        </form>
      </Stack>
    </AppShell>
  );
}
