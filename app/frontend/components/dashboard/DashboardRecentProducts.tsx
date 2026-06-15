'use client';
import { Box, Button, Flex, Grid, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowRight, LuPackage, LuPlus } from 'react-icons/lu';

interface Product {
  id: string;
  name: string;
  price: number;
  stock_status: string;
  media?: { media_type: string; media_url: string }[];
}

interface DashboardRecentProductsProps {
  products: Product[];
  productCount: number;
}

export function DashboardRecentProducts({ products, productCount }: DashboardRecentProductsProps) {
  const router = useRouter();
  return (
    <Box>
      <Flex align="center" justify="space-between" mb={4}>
        <Text
          textStyle="xs"
          fontWeight="semibold"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          Recent Products
        </Text>
        {productCount > 0 && (
          <Button variant="ghost" size="xs" color="primary.fg" onClick={() => router.push('/products')}>
            View all <LuArrowRight size={12} />
          </Button>
        )}
      </Flex>

      {productCount === 0 ? (
        <Box p={10} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" textAlign="center">
          <Flex w={14} h={14} borderRadius="full" bg="primary.subtle" align="center" justify="center" mx="auto" mb={4} color="primary.fg">
            <LuPackage size={24} />
          </Flex>
          <Text fontWeight="semibold" color="fg" mb={1}>No products yet</Text>
          <Text color="fg.muted" textStyle="sm" mb={4}>Add your first product to start selling on ShopCop.</Text>
          <Button colorPalette="primary" size="md" onClick={() => router.push('/products/new')}>
            <LuPlus />
            Add Your First Product
          </Button>
        </Box>
      ) : (
        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
          {products.slice(0, 6).map((product) => (
            <Box
              key={product.id}
              p={4}
              bg="bg.panel"
              borderWidth="1px"
              borderColor="border"
              borderRadius="xl"
              cursor="pointer"
              transition="box-shadow 0.15s"
              _hover={{ shadow: 'md' }}
              onClick={() => router.push(`/products/${product.id}`)}
            >
              <Box w="full" h="140px" bg="bg.subtle" borderRadius="lg" mb={3} overflow="hidden">
                {product.media?.[0] ? (
                  product.media[0].media_type === 'VIDEO' ? (
                    <Box position="relative" w="full" h="full">
                      <video
                        src={product.media[0].media_url}
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      <Box position="absolute" bottom={1} left={1} px={1} py={0.5} borderRadius="md" bg="blackAlpha.600">
                        <Text textStyle="2xs" color="white">▶ Video</Text>
                      </Box>
                    </Box>
                  ) : (
                    <img
                      src={product.media[0].media_url}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )
                ) : (
                  <Flex h="full" align="center" justify="center" color="fg.subtle">
                    <LuPackage size={32} />
                  </Flex>
                )}
              </Box>
              <Text fontWeight="medium" color="fg" textStyle="sm" truncate>
                {product.name}
              </Text>
              <Flex align="center" justify="space-between" mt={1}>
                <Text color="primary.fg" fontWeight="bold" textStyle="sm">
                  ₦{product.price.toLocaleString()}
                </Text>
                <Box
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  bg={product.stock_status === 'IN_STOCK' ? 'success.subtle' : 'red.subtle'}
                >
                  <Text
                    textStyle="2xs"
                    fontWeight="medium"
                    color={product.stock_status === 'IN_STOCK' ? 'success.fg' : 'red.600'}
                  >
                    {product.stock_status === 'IN_STOCK' ? 'In Stock' : 'Out of Stock'}
                  </Text>
                </Box>
              </Flex>
            </Box>
          ))}
        </Grid>
      )}
    </Box>
  );
}
