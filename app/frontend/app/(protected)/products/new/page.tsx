'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Field,
  Flex,
  Grid,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
  Spinner,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft, LuImage, LuPackage, LuX } from 'react-icons/lu';
import { productSchema, ProductFormData } from '@/app/validators/vendorSchema';
import { AppShell } from '@/components/shared/appShell';
import { toaster } from '@/components/ui/toaster';
import { AlertModal } from '@/components/ui/alert-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useCreateProduct, useGetCategories } from '@/app/_hooks/vendor';
import { UploadResult, useUploadPublicMedia, useDeleteMedia } from '@/app/_hooks/upload';


function ImageSlot({
  index,
  file,
  localUrl,
  isUploading,
  onAdd,
  onRemove,
  isPrimary,
  canDelete,
}: {
  index: number;
  file: UploadResult | null;
  localUrl?: string;
  isUploading?: boolean;
  onAdd: (index: number, file: File) => void;
  onRemove: (index: number) => void;
  isPrimary: boolean;
  canDelete: boolean;
}) {
  const preview = localUrl || file?.url || null;
  const hasContent = !!preview;

  const handleClick = () => {
    if (isUploading) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png,video/mp4,video/quicktime,video/webm';
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      if (f.size > 10 * 1024 * 1024) {
        toaster.create({ title: 'Image must be under 10MB', type: 'error' });
        return;
      }
      onAdd(index, f);
    };
    input.click();
  };

  return (
    <Box
      w="full"
      aspectRatio={1}
      borderRadius="xl"
      borderWidth="2px"
      borderStyle={hasContent ? 'solid' : 'dashed'}
      borderColor={hasContent ? 'primary.300' : 'border'}
      bg={hasContent ? 'transparent' : 'bg.subtle'}
      position="relative"
      overflow="hidden"
      cursor={isUploading ? 'default' : hasContent ? 'default' : 'pointer'}
      transition="all 0.15s"
      onClick={isUploading ? undefined : hasContent ? undefined : handleClick}
      _hover={isUploading ? {} : hasContent ? {} : { borderColor: 'primary.400', bg: 'primary.subtle' }}
    >
      {preview ? (
        <>
          {file?.resourceType === 'video' ? (
            <video
              src={preview}
              controls
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          ) : (
            <img
              src={preview}
              alt={`Product image ${index + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
          {isPrimary && (
            <Box
              position="absolute"
              bottom={1}
              left={1}
              px={1.5}
              py={0.5}
              borderRadius="md"
              bg="primary.500"
            >
              <Text textStyle="2xs" color="white" fontWeight="bold">
                Primary
              </Text>
            </Box>
          )}
          <Button
            position="absolute"
            top={1}
            right={1}
            size="xs"
            colorPalette="red"
            borderRadius="full"
            w={5}
            h={5}
            minW={5}
            p={0}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            aria-label="Remove image"
          >
            <LuX size={10} />
          </Button>
        </>
      ) : (
        <Flex direction="column" align="center" justify="center" h="full" gap={1} p={3}>
          <LuImage size={20} color="var(--chakra-colors-fg-subtle)" />
          {index === 0 && (
            <Text textStyle="2xs" color="fg.muted" textAlign="center">
              Primary
            </Text>
          )}
        </Flex>
      )}
      {isUploading && (
        <Box
          position="absolute"
          inset={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="blackAlpha.400"
          borderRadius="xl"
          zIndex={1}
        >
          <Spinner size="lg" color="white" />
        </Box>
      )}
    </Box>
  );
}

export default function NewProductPage() {
  const router = useRouter();
  const createMutation = useCreateProduct();
  const { data: categories = [], isLoading: categoriesLoading, isError: categoriesError } = useGetCategories();
  const uploadMutation = useUploadPublicMedia();
  const deleteMutation = useDeleteMedia();
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [mediaFiles, setMediaFiles] = useState<(UploadResult | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [localPreviews, setLocalPreviews] = useState<Record<number, string>>({});
  const [uploadingSlots, setUploadingSlots] = useState<Record<number, boolean>>({});
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [errorModal, setErrorModal] = useState<{ open: boolean; title: string; description: string }>({
    open: false, title: '', description: '',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    clearErrors,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { stock_status: 'IN_STOCK', category: '' },
  });

  const selectedCategory = watch('category');
  const selectedStock = watch('stock_status');
  const anyUploading = Object.values(uploadingSlots).some(Boolean);

  const handleAddImage = async (index: number, file: File) => {
    const localUrl = URL.createObjectURL(file);
    setLocalPreviews((prev) => ({ ...prev, [index]: localUrl }));
    setUploadingSlots((prev) => ({ ...prev, [index]: true }));
    setUploadProgress((prev) => ({ ...prev, [index]: 0 }));

    try {
      const uploadResult = await uploadMutation.mutateAsync({
        file,
        setUploadProgress: (percent) => {
          setUploadProgress((prev) => ({ ...prev, [index]: percent }));
        },
      });

      URL.revokeObjectURL(localUrl);
      setLocalPreviews((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      setUploadProgress((prev) => ({ ...prev, [index]: 0 }));
      setUploadingSlots((prev) => ({ ...prev, [index]: false }));
      setMediaFiles((prev) => {
        const next = [...prev];
        next[index] = uploadResult;
        return next;
      });
    } catch (error) {
      URL.revokeObjectURL(localUrl);
      setLocalPreviews((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      setUploadProgress((prev) => ({ ...prev, [index]: 0 }));
      setUploadingSlots((prev) => ({ ...prev, [index]: false }));
      toaster.create({
        title: 'Failed to upload file',
        description: error instanceof Error ? error.message : 'An error occurred, please try again.',
        type: 'error',
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setRemovingIndex(index);
  };

  const handleConfirmRemove = async () => {
    if (removingIndex === null) return;
    const index = removingIndex;
    const file = mediaFiles[index];
    if (file?.publicId) {
      try {
        await deleteMutation.mutateAsync(file.publicId);
      } catch {
        // Log but proceed with local removal
      }
    }
    if (localPreviews[index]) {
      URL.revokeObjectURL(localPreviews[index]);
    }
    setLocalPreviews((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setUploadProgress((prev) => ({ ...prev, [index]: 0 }));
    setUploadingSlots((prev) => ({ ...prev, [index]: false }));
    setMediaFiles((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setRemovingIndex(null);
  };

  const onSubmit = async (data: ProductFormData) => {
    if (Object.values(uploadingSlots).some(Boolean)) {
      toaster.create({ title: 'Please wait for uploads to complete', type: 'warning' });
      return;
    }

    const hasMedia = mediaFiles.some(Boolean);
    if (!hasMedia) {
      toaster.create({ title: 'Please upload at least one product image', type: 'error' });
      return;
    }

    const uploadedFiles = mediaFiles.filter(Boolean) as NonNullable<typeof mediaFiles[number]>[];

    if (uploadedFiles.length === 0) {
      toaster.create({ title: 'Please upload at least one product image or video', type: 'error' });
      return;
    }

    const media = uploadedFiles.map((m) => ({
      url: m.url,
      public_id: m.publicId || undefined,
      media_type: (m.resourceType === 'video' ? 'VIDEO' : 'IMAGE') as 'IMAGE' | 'VIDEO',
    }));

    try {
      await createMutation.mutateAsync({ ...data, media });
      toaster.create({ title: 'Product added successfully!', type: 'success' });
      router.push('/products');
    } catch (error) {
      setErrorModal({
        open: true,
        title: 'Failed to add product',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  };

  return (
    <AppShell>
      <AlertModal
        open={errorModal.open}
        onClose={() => setErrorModal((s) => ({ ...s, open: false }))}
        title={errorModal.title}
        description={errorModal.description}
        type="error"
      />
      <ConfirmDialog
        open={removingIndex !== null}
        onClose={() => setRemovingIndex(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Image"
        description={
          removingIndex !== null && mediaFiles[removingIndex]
            ? 'This will permanently delete this file. Continue?'
            : 'Remove this image?'
        }
        confirmLabel="Remove"
        colorPalette="red"
        isLoading={deleteMutation.isPending}
      />
      <Stack gap={6} maxW="720px" mx="auto">
        {/* Header */}
        <Stack gap={0.5}>
          <Button
            variant="ghost"
            size="sm"
            color="fg.muted"
            alignSelf="flex-start"
            mb={2}
            onClick={() => router.push('/products')}
          >
            <LuArrowLeft size={14} />
            Back to Products
          </Button>
          <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
            Add New Product
          </Heading>
          <Text color="fg.muted" textStyle="sm">
            Fill in your product details. Required fields are marked with *.
          </Text>
        </Stack>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap={5}>
            {/* Images */}
            <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
              <Text fontWeight="semibold" color="fg" textStyle="sm" mb={1}>
                Product Images *
              </Text>
              <Text color="fg.muted" textStyle="xs" mb={4}>
                Upload up to 5 images. The first image is the primary display image. JPG or PNG, max
                2MB each.
              </Text>
              <Grid templateColumns="repeat(5, 1fr)" gap={3}>
                {mediaFiles.map((file, index) => (
                  <Box key={index}>
                    <ImageSlot
                      index={index}
                      file={file}
                      localUrl={localPreviews[index]}
                      isUploading={uploadingSlots[index]}
                      onAdd={handleAddImage}
                      onRemove={handleRemoveImage}
                      isPrimary={index === 0 && !!file}
                      canDelete={!uploadingSlots[index]}
                    />
                  </Box>
                ))}
              </Grid>
            </Box>

            {/* Details */}
            <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
              <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
                Product Details
              </Text>
              <Stack gap={5}>
                <Field.Root invalid={!!errors.name} required>
                  <Field.Label color="fg">Product Name</Field.Label>
                  <Input
                    {...register('name')}
                    placeholder="e.g. Samsung Galaxy A55 6GB RAM"
                    size="lg"
                    colorPalette="primary"
                  />
                  <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.description}>
                  <Field.Label color="fg">
                    Description{' '}
                    <Text as="span" color="fg.muted" fontWeight="normal">
                      (optional)
                    </Text>
                  </Field.Label>
                  <Textarea
                    {...register('description')}
                    placeholder="Describe your product — features, condition, specifications..."
                    size="lg"
                    colorPalette="primary"
                    rows={4}
                    resize="none"
                  />
                  <Field.ErrorText>{errors.description?.message}</Field.ErrorText>
                </Field.Root>

                {/* Price */}
                <Field.Root invalid={!!errors.price} required>
                  <Field.Label color="fg">Price (₦)</Field.Label>
                  <Flex
                    align="center"
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="lg"
                    px={4}
                    h="48px"
                    gap={2}
                  >
                    <Text color="fg.muted" fontWeight="medium" flexShrink={0}>
                      ₦
                    </Text>
                    <input
                      {...register('price', { valueAsNumber: true })}
                      type="number"
                      placeholder="0"
                      min={0}
                      step="0.01"
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '16px',
                        color: 'inherit',
                      }}
                    />
                  </Flex>
                  <Field.ErrorText>{errors.price?.message}</Field.ErrorText>
                </Field.Root>

                {/* Category */}
                <Field.Root invalid={!!errors.category} required>
                  <Field.Label color="fg">Category</Field.Label>
                  {categoriesLoading && <Spinner size="sm" colorPalette="primary" />}
                  {categoriesError && (
                    <Text color="red.fg" textStyle="xs">
                      Failed to load categories. Please refresh the page.
                    </Text>
                  )}
                  {!categoriesLoading && !categoriesError && (
                    <Flex gap={2} flexWrap="wrap" pt={1}>
                      {categories.map((cat) => {
                        const isSelected = selectedCategory === cat.name;
                        return (
                          <Flex
                            key={cat.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setValue('category', cat.name, { shouldValidate: true });
                              clearErrors('category');
                            }}
                            onKeyDown={(e) =>
                              e.key === 'Enter' && setValue('category', cat.name, { shouldValidate: true })
                            }
                            align="center"
                            px={3}
                            py={1.5}
                            borderRadius="full"
                            borderWidth="1.5px"
                            borderColor={isSelected ? 'primary.500' : 'border'}
                            bg={isSelected ? 'primary.subtle' : 'transparent'}
                            color={isSelected ? 'primary.fg' : 'fg.muted'}
                            cursor="pointer"
                            fontWeight={isSelected ? 'medium' : 'normal'}
                            transition="all 0.15s"
                            userSelect="none"
                            _hover={isSelected ? {} : { borderColor: 'primary.400', color: 'fg' }}
                          >
                            <Text textStyle="xs">{cat.name}</Text>
                          </Flex>
                        );
                      })}
                    </Flex>
                  )}
                  <Field.ErrorText>{errors.category?.message}</Field.ErrorText>
                </Field.Root>

                {/* Stock status */}
                <Field.Root required>
                  <Field.Label color="fg">Stock Status</Field.Label>
                  <Flex gap={3}>
                    {[
                      { value: 'IN_STOCK', label: 'In Stock', color: 'success' },
                      { value: 'OUT_OF_STOCK', label: 'Out of Stock', color: 'red' },
                    ].map((option) => {
                      const isSelected = selectedStock === option.value;
                      return (
                        <Flex
                          key={option.value}
                          role="button"
                          tabIndex={0}
                          flex={1}
                          px={4}
                          py={3}
                          borderRadius="lg"
                          borderWidth="1.5px"
                          borderColor={isSelected ? `${option.color}.400` : 'border'}
                          bg={isSelected ? `${option.color}.subtle` : 'transparent'}
                          cursor="pointer"
                          align="center"
                          justify="center"
                          transition="all 0.15s"
                          userSelect="none"
                          onClick={() =>
                            setValue('stock_status', option.value as 'IN_STOCK' | 'OUT_OF_STOCK', {
                              shouldValidate: true,
                            })
                          }
                          onKeyDown={(e) =>
                            e.key === 'Enter' &&
                            setValue('stock_status', option.value as 'IN_STOCK' | 'OUT_OF_STOCK')
                          }
                          _hover={{ borderColor: `${option.color}.300` }}
                        >
                          <Text
                            textStyle="sm"
                            fontWeight={isSelected ? 'semibold' : 'normal'}
                            color={isSelected ? `${option.color}.fg` : 'fg.muted'}
                          >
                            {option.label}
                          </Text>
                        </Flex>
                      );
                    })}
                  </Flex>
                </Field.Root>

                {/* Stock quantity */}
                <Field.Root invalid={!!errors.stock_quantity}>
                  <Field.Label color="fg">
                    Stock Quantity{' '}
                    <Text as="span" color="fg.muted" fontWeight="normal">
                      (optional)
                    </Text>
                  </Field.Label>
                  <Input
                    {...register('stock_quantity', {
                      setValueAs: (v) => (v === '' || v === null ? undefined : Number(v)),
                    })}
                    type="number"
                    min={0}
                    placeholder="e.g. 50"
                    size="lg"
                    colorPalette="primary"
                  />
                  <Field.HelperText color="fg.subtle" textStyle="xs">
                    Leave blank if you are not tracking exact stock count.
                  </Field.HelperText>
                  <Field.ErrorText>{errors.stock_quantity?.message}</Field.ErrorText>
                </Field.Root>
              </Stack>
            </Box>

            {/* Actions */}
            <Flex gap={3} justify="flex-end">
              <Button
                variant="outline"
                size="lg"
                colorPalette="navy"
                onClick={() => router.push('/products')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                colorPalette="primary"
                size="lg"
                loading={isSubmitting || createMutation.isPending}
                disabled={isSubmitting || anyUploading}
              >
                <LuPackage />
                Add Product
              </Button>
            </Flex>
          </Stack>
        </form>
      </Stack>
    </AppShell>
  );
}
