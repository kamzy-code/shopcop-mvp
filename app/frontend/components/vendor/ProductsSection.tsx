'use client';
import { Box, Button, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { formatCurrency } from '@/app/_lib/orderHelpers';

interface ProductItem {
  id: string;
  name: string;
  price: number;
  category: string;
  stock_status: string;
  media: Array<{ media_url: string; media_type: string }>;
}

interface ProductsSectionProps {
  products: ProductItem[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  slug: string;
}

function ProductCard({ product, slug }: { product: ProductItem; slug: string }) {
  const firstMedia = product.media[0];

  return (
    <Link href={`/v/${slug}/product/${product.id}`} legacyBehavior>
      <Box
        as="a"
        borderWidth="1px"
        borderColor="border"
        borderRadius="xl"
        overflow="hidden"
        bg="bg.panel"
        transition="box-shadow 0.2s"
        cursor="pointer"
        _hover={{ boxShadow: 'md' }}
      >
        <Box h="160px" bg="gray.100" _dark={{ bg: 'gray.700' }}>
          {!firstMedia ? (
            <Flex align="center" justify="center" h="100%" color="fg.muted">
              <Text textStyle="sm">No image</Text>
            </Flex>
          ) : firstMedia.media_type === 'VIDEO' ? (
            <Box position="relative" w="full" h="full">
              <video
                src={firstMedia.media_url}
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <Flex
                position="absolute"
                bottom={1}
                left={1}
                px={1.5}
                py={0.5}
                borderRadius="md"
                bg="blackAlpha.600"
              >
                <Text textStyle="2xs" color="white">▶ Video</Text>
              </Flex>
            </Box>
          ) : (
            <img
              src={firstMedia.media_url}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </Box>
        <Box p={3}>
          <Text textStyle="sm" fontWeight="semibold" lineClamp={1}>
            {product.name}
          </Text>
          <Text textStyle="sm" color="primary.fg" fontWeight="bold" mt={1}>
            {formatCurrency(product.price)}
          </Text>
          <Text textStyle="2xs" color="fg.muted" mt={1}>
            {product.category}
          </Text>
        </Box>
      </Box>
    </Link>
  );
}

export function ProductsSection({
  products,
  total,
  page,
  totalPages,
  onPageChange,
  slug,
}: ProductsSectionProps) {
  if (total === 0) {
    return (
      <Box p={4} textAlign="center" color="fg.muted">
        <Text textStyle="sm">No products available</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text textStyle="sm" fontWeight="semibold" mb={3}>
        Products ({total})
      </Text>

      <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} gap={3}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} slug={slug} />
        ))}
      </SimpleGrid>

      {totalPages > 1 && (
        <Flex justify="center" gap={2} mt={4}>
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Text textStyle="sm" alignSelf="center" color="fg.muted">
            Page {page} of {totalPages}
          </Text>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </Flex>
      )}
    </Box>
  );
}
