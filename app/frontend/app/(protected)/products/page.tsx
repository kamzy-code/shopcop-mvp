'use client';
import { useState } from 'react';
import { Box, Button, Flex, Grid, Heading, Stack, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuCopy, LuPackage, LuPencil, LuPlus, LuSearch, LuTrash2 } from 'react-icons/lu';
import { AppShell } from '@/components/shared/appShell';
import { useDeleteProduct, useDuplicateProduct, useProducts } from '@/app/_hooks/vendor';
import { toaster } from '@/components/ui/toaster';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AlertModal } from '@/components/ui/alert-modal';
import { Product } from '@/app/_types';

function StockBadge({ status }: { status: Product['stock_status'] }) {
  const isInStock = status === 'IN_STOCK';
  return (
    <Box
      px={2}
      py={0.5}
      borderRadius="full"
      bg={isInStock ? 'success.subtle' : 'red.subtle'}
      display="inline-flex"
    >
      <Text textStyle="2xs" fontWeight="medium" color={isInStock ? 'success.fg' : 'red.600'}>
        {isInStock ? 'In Stock' : 'Out of Stock'}
      </Text>
    </Box>
  );
}

function MediaThumbnail({ product }: { product: Product }) {
  const first = product.media?.[0];
  if (!first) {
    return (
      <Flex h="full" align="center" justify="center" color="fg.subtle">
        <LuPackage size={40} />
      </Flex>
    );
  }
  if (first.media_type === 'VIDEO') {
    return (
      <Box position="relative" w="full" h="full">
        <video
          src={first.media_url}
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <Box
          position="absolute"
          bottom={1}
          left={1}
          px={1.5}
          py={0.5}
          borderRadius="md"
          bg="blackAlpha.600"
        >
          <Text textStyle="2xs" color="white">▶ Video</Text>
        </Box>
      </Box>
    );
  }
  return (
    <img
      src={first.media_url}
      alt={product.name}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  );
}

function ProductCard({
  product,
  onEdit,
  onRequestDelete,
  onDuplicate,
  isDuplicating,
}: {
  product: Product;
  onEdit: (id: string) => void;
  onRequestDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  isDuplicating: boolean;
}) {
  const router = useRouter();

  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      overflow="hidden"
      transition="box-shadow 0.15s"
      _hover={{ shadow: 'md' }}
    >
      {/* Thumbnail — clickable to detail page */}
      <Box
        w="full"
        h="180px"
        bg="bg.subtle"
        overflow="hidden"
        cursor="pointer"
        onClick={() => router.push(`/products/${product.id}`)}
      >
        <MediaThumbnail product={product} />
      </Box>

      {/* Content */}
      <Box p={4}>
        <Text
          fontWeight="semibold"
          color="fg"
          textStyle="sm"
          truncate
          mb={0.5}
          cursor="pointer"
          onClick={() => router.push(`/products/${product.id}`)}
        >
          {product.name}
        </Text>
        <Text color="fg.muted" textStyle="xs" truncate mb={3}>
          {product.category}
        </Text>

        <Flex align="center" justify="space-between" mb={3}>
          <Text color="primary.fg" fontWeight="bold" textStyle="md">
            ₦{product.price.toLocaleString()}
          </Text>
          <StockBadge status={product.stock_status} />
        </Flex>

        <Flex gap={2}>
          <Button
            variant="outline"
            size="xs"
            flex={1}
            colorPalette="navy"
            onClick={() => onEdit(product.id)}
          >
            <LuPencil size={11} />
            Edit
          </Button>
          <Button
            variant="outline"
            size="xs"
            flex={1}
            colorPalette="gray"
            onClick={() => onDuplicate(product.id)}
            loading={isDuplicating}
          >
            <LuCopy size={11} />
            Copy
          </Button>
          <Button
            variant="outline"
            size="xs"
            flex={1}
            colorPalette="red"
            onClick={() => onRequestDelete(product.id)}
          >
            <LuTrash2 size={11} />
            Delete
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Box py={16} textAlign="center">
      <Flex
        w={16}
        h={16}
        borderRadius="full"
        bg="primary.subtle"
        align="center"
        justify="center"
        mx="auto"
        mb={5}
        color="primary.fg"
      >
        <LuPackage size={28} />
      </Flex>
      <Heading as="h3" textStyle="lg" fontWeight="semibold" color="fg" mb={2}>
        No products yet
      </Heading>
      <Text color="fg.muted" textStyle="sm" mb={6} maxW="300px" mx="auto">
        Add your first product and start selling to buyers on ShopCop.
      </Text>
      <Button colorPalette="primary" onClick={onAdd}>
        <LuPlus />
        Add First Product
      </Button>
    </Box>
  );
}

export default function ProductsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<{ open: boolean; title: string; description: string }>({
    open: false, title: '', description: '',
  });
  const { data: products = [], isLoading } = useProducts();
  const deleteMutation = useDeleteProduct();
  const duplicateMutation = useDuplicateProduct();

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      setDeleteTarget(null);
      toaster.create({ title: 'Product deleted', type: 'success' });
    } catch (error) {
      setDeleteTarget(null);
      setErrorModal({
        open: true,
        title: 'Failed to delete product',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      await duplicateMutation.mutateAsync(id);
      toaster.create({ title: 'Product duplicated as draft', type: 'success' });
    } catch (error) {
      setErrorModal({
        open: true,
        title: 'Failed to duplicate product',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setDuplicatingId(null);
    }
  };

  const deleteTargetProduct = products.find((p) => p.id === deleteTarget);

  return (
    <AppShell>
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTargetProduct?.name ?? 'this product'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
      <AlertModal
        open={errorModal.open}
        onClose={() => setErrorModal((s) => ({ ...s, open: false }))}
        title={errorModal.title}
        description={errorModal.description}
        type="error"
      />
      <Stack gap={6}>
        {/* Page header */}
        <Flex align="center" justify="space-between" flexWrap="wrap" gap={4}>
          <Stack gap={0.5}>
            <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
              My Products
            </Heading>
            <Text color="fg.muted" textStyle="sm">
              {products.length} {products.length === 1 ? 'product' : 'products'} in your store
            </Text>
          </Stack>
          <Button colorPalette="primary" size="md" onClick={() => router.push('/products/new')}>
            <LuPlus />
            Add Product
          </Button>
        </Flex>

        {/* Search */}
        {products.length > 0 && (
          <Flex
            align="center"
            maxW="360px"
            borderWidth="1px"
            borderColor="border"
            borderRadius="lg"
            bg="bg.panel"
            px={3}
            gap={2}
            h="40px"
          >
            <LuSearch size={16} color="var(--chakra-colors-fg-muted)" />
            <input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '14px',
                color: 'inherit',
              }}
            />
          </Flex>
        )}

        {/* Content */}
        {isLoading ? (
          <Grid
            templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }}
            gap={4}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Box key={i} h="300px" bg="bg.subtle" borderRadius="xl" borderWidth="1px" borderColor="border" />
            ))}
          </Grid>
        ) : filtered.length === 0 && products.length > 0 ? (
          <Box textAlign="center" py={12}>
            <Text color="fg.muted" textStyle="sm">
              No products match &ldquo;{search}&rdquo;
            </Text>
          </Box>
        ) : filtered.length === 0 ? (
          <EmptyState onAdd={() => router.push('/products/new')} />
        ) : (
          <Grid
            templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }}
            gap={4}
          >
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={(id) => router.push(`/products/${id}/edit`)}
                onRequestDelete={setDeleteTarget}
                onDuplicate={handleDuplicate}
                isDuplicating={duplicatingId === product.id}
              />
            ))}
          </Grid>
        )}
      </Stack>
    </AppShell>
  );
}
