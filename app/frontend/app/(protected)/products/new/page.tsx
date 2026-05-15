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
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft, LuImage, LuPackage, LuX } from 'react-icons/lu';
import { productSchema, ProductFormData, PRODUCT_CATEGORIES } from '@/app/validators/vendorSchema';
import { AppShell } from '@/components/shared/appShell';
import { toaster } from '@/components/ui/toaster';
import { useCreateProduct } from '@/app/_hooks/vendor';

function ImageSlot({
  index,
  file,
  onAdd,
  onRemove,
  isPrimary,
}: {
  index: number;
  file: File | null;
  onAdd: (index: number, file: File) => void;
  onRemove: (index: number) => void;
  isPrimary: boolean;
}) {
  const preview = file ? URL.createObjectURL(file) : null;

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png';
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      if (f.size > 2 * 1024 * 1024) {
        toaster.create({ title: 'Image must be under 2MB', type: 'error' });
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
      borderStyle={file ? 'solid' : 'dashed'}
      borderColor={file ? 'primary.300' : 'border'}
      bg={file ? 'transparent' : 'bg.subtle'}
      position="relative"
      overflow="hidden"
      cursor={file ? 'default' : 'pointer'}
      transition="all 0.15s"
      onClick={file ? undefined : handleClick}
      _hover={file ? {} : { borderColor: 'primary.400', bg: 'primary.subtle' }}
    >
      {preview ? (
        <>
          <img
            src={preview}
            alt={`Product image ${index + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {isPrimary && (
            <Box position="absolute" bottom={1} left={1} px={1.5} py={0.5} borderRadius="md" bg="primary.500">
              <Text textStyle="2xs" color="white" fontWeight="bold">Primary</Text>
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
            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
            aria-label="Remove image"
          >
            <LuX size={10} />
          </Button>
        </>
      ) : (
        <Flex direction="column" align="center" justify="center" h="full" gap={1} p={3}>
          <LuImage size={20} color="var(--chakra-colors-fg-subtle)" />
          {index === 0 && (
            <Text textStyle="2xs" color="fg.muted" textAlign="center">Primary</Text>
          )}
        </Flex>
      )}
    </Box>
  );
}

export default function NewProductPage() {
  const router = useRouter();
  const createMutation = useCreateProduct();
  const [images, setImages] = useState<(File | null)[]>([null, null, null, null, null]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    clearErrors,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { stockStatus: 'IN_STOCK', category: '' },
  });

  const selectedCategory = watch('category');
  const selectedStock = watch('stockStatus');

  const handleAddImage = (index: number, file: File) => {
    setImages((prev) => { const next = [...prev]; next[index] = file; return next; });
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => { const next = [...prev]; next[index] = null; return next; });
  };

  const onSubmit = async (data: ProductFormData) => {
    const hasImage = images.some(Boolean);
    if (!hasImage) {
      toaster.create({ title: 'Please upload at least one product image', type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('price', String(data.price));
    formData.append('category', data.category);
    formData.append('stockStatus', data.stockStatus);
    if (data.description) formData.append('description', data.description);
    images.filter(Boolean).forEach((img) => { if (img) formData.append('images', img); });

    try {
      await createMutation.mutateAsync(formData);
      toaster.create({ title: 'Product added successfully!', type: 'success' });
      router.push('/products');
    } catch (error) {
      toaster.create({
        title: 'Failed to add product',
        description: error instanceof Error ? error.message : 'Please try again',
        type: 'error',
      });
    }
  };

  return (
    <AppShell>
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
                Upload up to 5 images. The first image is the primary display image. JPG or PNG, max 2MB each.
              </Text>
              <Grid templateColumns="repeat(5, 1fr)" gap={3}>
                {images.map((file, index) => (
                  <ImageSlot
                    key={index}
                    index={index}
                    file={file}
                    onAdd={handleAddImage}
                    onRemove={handleRemoveImage}
                    isPrimary={index === 0 && !!file}
                  />
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
                    <Text as="span" color="fg.muted" fontWeight="normal">(optional)</Text>
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
                  <Flex align="center" borderWidth="1px" borderColor="border" borderRadius="lg" px={4} h="48px" gap={2}>
                    <Text color="fg.muted" fontWeight="medium" flexShrink={0}>₦</Text>
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
                  <Flex gap={2} flexWrap="wrap" pt={1}>
                    {PRODUCT_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat;
                      return (
                        <Flex
                          key={cat}
                          role="button"
                          tabIndex={0}
                          onClick={() => { setValue('category', cat, { shouldValidate: true }); clearErrors('category'); }}
                          onKeyDown={(e) => e.key === 'Enter' && setValue('category', cat, { shouldValidate: true })}
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
                          <Text textStyle="xs">{cat}</Text>
                        </Flex>
                      );
                    })}
                  </Flex>
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
                          onClick={() => setValue('stockStatus', option.value as 'IN_STOCK' | 'OUT_OF_STOCK', { shouldValidate: true })}
                          onKeyDown={(e) => e.key === 'Enter' && setValue('stockStatus', option.value as 'IN_STOCK' | 'OUT_OF_STOCK')}
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
                disabled={isSubmitting}
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
