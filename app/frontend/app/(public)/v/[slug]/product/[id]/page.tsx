'use client';
import { useRef, useState } from 'react';
import { Box, Button, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import {
  LuArrowLeft,
  LuChevronLeft,
  LuChevronRight,
  LuMessageCircle,
  LuPackage,
  LuPhone,
} from 'react-icons/lu';
import { FaInstagram, FaTiktok, FaFacebook, FaWhatsapp } from 'react-icons/fa';
import { usePublicProductDetails } from '@/app/_hooks/usePublicVendorProfile';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import type { PublicProductDetail } from '@/app/_types';
import Link from 'next/link';

function MediaCarousel({ product }: { product: PublicProductDetail }) {
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

function ContactVendorButton({ product }: { product: PublicProductDetail }) {
  const {
    primary_contact,
    whatsapp_number,
    phone_number,
    instagram_handle,
    tiktok_handle,
    facebook_url,
  } = product.vendor;

  const waMessage = encodeURIComponent(
    `Hi! I'm interested in your product "${product.name}" (${product.category}).`
  );

  switch (primary_contact) {
    case 'WHATSAPP':
      if (!whatsapp_number) return null;
      return (
        <Link
          href={`https://wa.me/${whatsapp_number.replace(/\D/g, '')}?text=${waMessage}`}
          target="_blank"
        >
          <Button colorPalette="green" w="full" size="lg">
            <FaWhatsapp size={18} />
            Chat on WhatsApp
          </Button>
        </Link>
      );

    case 'INSTAGRAM':
      if (!instagram_handle) return null;
      return (
        <Link href={instagram_handle} target="_blank">
          <Button
            w="full"
            size="lg"
            style={{
              background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
              color: '#fff',
              border: 'none',
            }}
          >
            <FaInstagram size={18} />
            Message vendor on Instagram
          </Button>
        </Link>
      );

    case 'TIKTOK':
      if (!tiktok_handle) return null;
      return (
        <Link href={tiktok_handle} target="_blank">
          <Button w="full" size="lg" bg="black" color="white" _hover={{ bg: 'gray.800' }}>
            <FaTiktok size={18} />
            Message vendor on TikTok
          </Button>
        </Link>
      );

    case 'FACEBOOK':
      if (!facebook_url) return null;
      return (
        <Link href={facebook_url} target="_blank">
          <Button colorPalette="blue" w="full" size="lg">
            <FaFacebook size={18} />
            Message vendor on Facebook
          </Button>
        </Link>
      );

    case 'PHONE_CALL':
      if (!phone_number) return null;
      return (
        <Link href={`tel:${phone_number}`} style={{ textDecoration: 'none', width: '100%' }}>
          <Button colorPalette="primary" w="full" size="lg">
            <LuPhone size={18} />
            Call Vendor
          </Button>
        </Link>
      );

    default:
      // Fallback: try whatsapp, then phone
      if (whatsapp_number) {
        return (
          <Link
            href={`https://wa.me/${whatsapp_number.replace(/\D/g, '')}?text=${waMessage}`}
            target="_blank"
          >
            <Button colorPalette="green" w="full" size="lg">
              <FaWhatsapp size={18} />
              Chat on WhatsApp
            </Button>
          </Link>
        );
      }
      if (phone_number) {
        return (
          <Link href={`tel:${phone_number}`} style={{ textDecoration: 'none', width: '100%' }}>
            <Button colorPalette="primary" w="full" size="lg">
              <LuPhone size={18} />
              Call Vendor
            </Button>
          </Link>
        );
      }
      return null;
  }
}

export default function PublicProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const slug = params.slug as string;

  const { data: product, isLoading } = usePublicProductDetails(productId);

  const contentMaxW = { base: 'full', md: '2xl', lg: '4xl' };

  if (isLoading) {
    return (
      <Box bg="bg" minH="100dvh">
        <PublicNavbar businessName={null} maxW={contentMaxW} />
        <Flex minH="50dvh" align="center" justify="center">
          <Spinner size="xl" colorPalette="primary" />
        </Flex>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box bg="bg" minH="100dvh">
        <PublicNavbar businessName={null} maxW={contentMaxW} />
        <Flex minH="50dvh" align="center" justify="center">
          <Text color="fg.muted">Product not found</Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Box bg="bg" minH="100dvh">
      <PublicNavbar businessName={null} maxW={contentMaxW} />
      <Box maxW={contentMaxW} mx="auto" px={{ base: 4, md: 6 }} py={6}>
        <Stack gap={6} maxW="720px" mx="auto">
          <Button
            variant="ghost"
            size="sm"
            color="fg.muted"
            onClick={() => router.push(`/v/${slug}`)}
            alignSelf="flex-start"
          >
            <LuArrowLeft size={15} />
            Back to vendor
          </Button>

          <MediaCarousel product={product} />

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

            <Text textStyle="2xl" fontWeight="bold" color="primary.fg">
              ₦{product.price.toLocaleString()}
            </Text>

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

            <ContactVendorButton product={product} />
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
