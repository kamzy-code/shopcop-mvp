'use client';
import { useRef, useState } from 'react';
import { Box, Button, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import { LuArrowLeft, LuChevronLeft, LuChevronRight, LuPackage, LuPencil } from 'react-icons/lu';
import { AppShell } from '@/components/shared/appShell';
import { useProduct } from '@/app/_hooks/vendor';
import { Product } from '@/app/_types';
import FullPageSpinner from '@/components/shared/fullPageSpinner';

function StockBadge({ status, quantity }: { status: Product['stock_status']; quantity?: number | null }) {
  const isInStock = status === 'IN_STOCK';
  return (
    <Box
      px={3}
      py={1}
      borderRadius="full"
      bg={isInStock ? 'success.subtle' : 'red.subtle'}
      display="inline-flex"
    >
      <Text textStyle="xs" fontWeight="medium" color={isInStock ? 'success.fg' : 'red.600'}>
        {isInStock ? 'In Stock' : 'Out of Stock'}
        {quantity != null && ` · ${quantity}`}
      </Text>
    </Box>
  );
}

function MediaCarousel({ product }: { product: Product }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const mainVideoRef = useRef<HTMLVideoElement | null>(null);
  const media = product.media;

  const goToSlide = (index: number) => {
    mainVideoRef.current?.pause();
    setActiveIndex(index);
  };

  if (media.length === 0) {
    return (
      <Flex
        w="full"
        aspectRatio={1}
        maxW="560px"
        mx="auto"
        bg="bg.subtle"
        borderRadius="xl"
        align="center"
        justify="center"
        color="fg.subtle"
      >
        <LuPackage size={64} />
      </Flex>
    );
  }

  const current = media[activeIndex];

  return (
    <Stack gap={3} maxW="560px" mx="auto" w="full">
      {/* Main display */}
      <Box
        position="relative"
        w="full"
        aspectRatio={1}
        borderRadius="xl"
        overflow="hidden"
        bg="bg.subtle"
      >
        {current.media_type === 'VIDEO' ? (
          <video
            key={`main-video-${activeIndex}`}
            ref={mainVideoRef}
            src={current.media_url}
            controls
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              background: '#000',
            }}
          />
        ) : (
          <img
            src={current.media_url}
            alt={`${product.name} — image ${activeIndex + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        )}

        {/* Arrow buttons */}
        {media.length > 1 && (
          <>
            <Button
              position="absolute"
              left={2}
              top="50%"
              transform="translateY(-50%)"
              size="sm"
              borderRadius="full"
              w={9}
              h={9}
              minW={9}
              p={0}
              bg="bg.panel"
              colorPalette="gray"
              variant="outline"
              disabled={activeIndex === 0}
              onClick={() => goToSlide(activeIndex - 1)}
              aria-label="Previous"
            >
              <LuChevronLeft size={16} />
            </Button>
            <Button
              position="absolute"
              right={2}
              top="50%"
              transform="translateY(-50%)"
              size="sm"
              borderRadius="full"
              w={9}
              h={9}
              minW={9}
              p={0}
              bg="bg.panel"
              colorPalette="gray"
              variant="outline"
              disabled={activeIndex === media.length - 1}
              onClick={() => goToSlide(activeIndex + 1)}
              aria-label="Next"
            >
              <LuChevronRight size={16} />
            </Button>
          </>
        )}
      </Box>

      {/* Dot indicators */}
      {media.length > 1 && (
        <Flex justify="center" gap={1.5}>
          {media.map((_, i) => (
            <Box
              key={i}
              as="button"
              w={i === activeIndex ? 5 : 2}
              h={2}
              borderRadius="full"
              bg={i === activeIndex ? 'primary.500' : 'bg.subtle'}
              borderWidth="1px"
              borderColor={i === activeIndex ? 'primary.500' : 'border'}
              transition="all 0.2s"
              cursor="pointer"
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </Flex>
      )}

      {/* Thumbnail strip for 3+ items */}
      {media.length >= 3 && (
        <Flex gap={2} overflowX="auto" pb={1}>
          {media.map((item, i) => (
            <Box
              key={i}
              flexShrink={0}
              w="60px"
              h="60px"
              borderRadius="md"
              overflow="hidden"
              cursor="pointer"
              borderWidth="2px"
              borderColor={i === activeIndex ? 'primary.500' : 'transparent'}
              opacity={i === activeIndex ? 1 : 0.6}
              transition="all 0.15s"
              onClick={() => goToSlide(i)}
            >
              {item.media_type === 'VIDEO' ? (
                <video
                  src={item.media_url}
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <img
                  src={item.media_url}
                  alt={`Thumbnail ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              )}
            </Box>
          ))}
        </Flex>
      )}
    </Stack>
  );
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { data: product, isLoading } = useProduct(productId);

  if (isLoading) {
    return (
      <AppShell>
        <FullPageSpinner />
      </AppShell>
    );
  }

  if (!product) {
    return (
      <AppShell>
        <Box textAlign="center" py={16}>
          <Text color="fg.muted" mb={4}>
            Product not found.
          </Text>
          <Button onClick={() => router.back()}>Back to Products</Button>
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Stack gap={6} maxW="720px" mx="auto">
        {/* Header */}
        <Flex align="center" justify="space-between">
          <Button
            variant="ghost"
            size="sm"
            color="fg.muted"
            onClick={() => router.back()}
          >
            <LuArrowLeft size={14} />
            Back to Products
          </Button>
          <Button
            size="sm"
            colorPalette="navy"
            variant="outline"
            onClick={() => router.push(`/products/${productId}/edit`)}
          >
            <LuPencil size={13} />
            Edit
          </Button>
        </Flex>

        {/* Carousel */}
        <MediaCarousel product={product} />

        {/* Product info */}
        <Stack gap={4} px={{ base: 0, md: 2 }}>
          <Stack gap={1}>
            <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
              {product.name}
            </Heading>
            {product.category && (
              <Text color="fg.muted" textStyle="sm">
                {product.category}
              </Text>
            )}
          </Stack>

          <Flex align="center" gap={3}>
            <Text textStyle="2xl" fontWeight="bold" color="primary.fg">
              ₦{product.price.toLocaleString()}
            </Text>
            <StockBadge status={product.stock_status} quantity={product.stock_quantity} />
          </Flex>

          {product.description && (
            <Box p={4} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
              <Text
                color="fg.muted"
                textStyle="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={2}
              >
                Description
              </Text>
              <Text color="fg" textStyle="sm" whiteSpace="pre-wrap">
                {product.description}
              </Text>
            </Box>
          )}
        </Stack>
      </Stack>
    </AppShell>
  );
}
