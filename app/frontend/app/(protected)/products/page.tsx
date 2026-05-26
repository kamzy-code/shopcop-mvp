'use client';
import { useState } from 'react';
import { Box, Button, Flex, Grid, Heading, Stack, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuPackage, LuPencil, LuPlus, LuSearch, LuTrash2 } from 'react-icons/lu';
import { AppShell } from '@/components/shared/appShell';
import { useDeleteProduct, useProducts } from '@/app/_hooks/vendor';
import { toaster } from '@/components/ui/toaster';
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

function ProductCard({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    onDelete(product.id);
    setConfirming(false);
  };

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
      {/* Product image */}
      <Box w="full" h="180px" bg="bg.subtle" overflow="hidden">
        {product.media?.[0] ? (
          <img
            src={product.media[0].media_url}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Flex h="full" align="center" justify="center" color="fg.subtle">
            <LuPackage size={40} />
          </Flex>
        )}
      </Box>

      {/* Content */}
      <Box p={4}>
        <Text fontWeight="semibold" color="fg" textStyle="sm" truncate mb={0.5}>
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
            colorPalette="red"
            onClick={handleDelete}
          >
            <LuTrash2 size={11} />
            {confirming ? 'Confirm?' : 'Delete'}
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
  const { data: products = [], isLoading } = useProducts();
  const deleteMutation = useDeleteProduct();

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toaster.create({ title: 'Product deleted', type: 'success' });
    } catch (error) {
      toaster.create({
        title: 'Failed to delete product',
        description: error instanceof Error ? error.message : 'Try again',
        type: 'error',
      });
    }
  };

  return (
    <AppShell>
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
          <Button
            colorPalette="primary"
            size="md"
            onClick={() => router.push('/products/new')}
          >
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
            templateColumns={{
              base: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
              xl: 'repeat(4, 1fr)',
            }}
            gap={4}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Box
                key={i}
                h="280px"
                bg="bg.subtle"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border"
              />
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
            templateColumns={{
              base: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
              xl: 'repeat(4, 1fr)',
            }}
            gap={4}
          >
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={(id) => router.push(`/products/${id}/edit`)}
                onDelete={handleDelete}
              />
            ))}
          </Grid>
        )}
      </Stack>
    </AppShell>
  );
}
