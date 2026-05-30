'use client';
import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Flex,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight, LuPackage } from 'react-icons/lu';
import { TransactionItem, Product, ProductMedia } from '@/app/_types';
import { apiFetch } from '@/app/_lib/fetchWrapper';
import { formatCurrency, isVideoUrl } from '@/app/_lib/transactionHelpers';

interface ItemDetailModalProps {
  open: boolean;
  onClose: () => void;
  item: TransactionItem;
}

export function ItemDetailModal({ open, onClose, item }: ItemDetailModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const mainVideoRef = useRef<HTMLVideoElement | null>(null);

  const { data: liveProduct } = useQuery<Product>({
    queryKey: ['product', item?.product_id],
    queryFn: async () => {
      const res = await apiFetch<Product>(`/products/${item?.product_id}`);
      return res.data;
    },
    enabled: !!item?.product_id && open,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const media: ProductMedia[] | null =
    liveProduct?.media?.length ? liveProduct.media : null;

  const hasCarousel = media && media.length > 1;
  const hasSingleImage = media?.length === 1 || (!media && item?.item_image_url);
  const noMedia = !hasCarousel && !hasSingleImage;

  const displayMedia = media || [];

  const goToSlide = (index: number) => {
    mainVideoRef.current?.pause();
    setActiveIndex(index);
  };

  return (
    <DialogRoot
      open={open}
      onOpenChange={({ open: isOpen }) => { if (!isOpen) { onClose(); setActiveIndex(0); } }}
      size="xl"
      placement="center"
      motionPreset="slide-in-bottom"
    >
      <DialogBackdrop />
      <DialogPositioner alignItems="center" px={4}>
        <DialogContent w="full" maxH="90vh" overflow="auto">
          {item && (
            <>
              <DialogCloseTrigger />
              <DialogHeader pb={0}>
                <DialogTitle textStyle="md" color="fg.muted">
                  Order Item
                </DialogTitle>
              </DialogHeader>
              <DialogBody>
                <Stack gap={6}>
                  {/* Media display */}
                  <Box
                    position="relative"
                    w="full"
                    aspectRatio={1}
                    maxW="480px"
                    mx="auto"
                    borderRadius="xl"
                    overflow="hidden"
                    bg="bg.subtle"
                  >
                    {noMedia ? (
                      <Flex h="full" align="center" justify="center" color="fg.subtle">
                        <LuPackage size={64} />
                      </Flex>
                    ) : displayMedia.length > 0 ? (
                      <>
                        {displayMedia[activeIndex]?.media_type === 'VIDEO' ? (
                          <video
                            key={`video-${activeIndex}`}
                            ref={mainVideoRef}
                            src={displayMedia[activeIndex].media_url}
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
                            src={displayMedia[activeIndex]?.media_url || item.item_image_url || ''}
                            alt={`${item.item_name} — image ${activeIndex + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              display: 'block',
                            }}
                          />
                        )}
                        {displayMedia.length > 1 && (
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
                              disabled={activeIndex === displayMedia.length - 1}
                              onClick={() => goToSlide(activeIndex + 1)}
                              aria-label="Next"
                            >
                              <LuChevronRight size={16} />
                            </Button>
                          </>
                        )}
                        {displayMedia.length > 1 && (
                          <Flex
                            position="absolute"
                            bottom={3}
                            left="50%"
                            transform="translateX(-50%)"
                            gap={1.5}
                          >
                            {displayMedia.map((_, i) => (
                              <Box
                                key={i}
                                as="button"
                                w={i === activeIndex ? 5 : 2}
                                h={2}
                                borderRadius="full"
                                bg={i === activeIndex ? 'primary.500' : 'bg.panel'}
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
                      </>
                    ) : item.item_image_url ? (
                      isVideoUrl(item.item_image_url) ? (
                        <video
                          src={item.item_image_url}
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
                          src={item.item_image_url}
                          alt={item.item_name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                      )
                    ) : (
                      <Flex h="full" align="center" justify="center" color="fg.subtle">
                        <LuPackage size={64} />
                      </Flex>
                    )}
                  </Box>

                  {/* Details */}
                  <Stack gap={4} maxW="480px" mx="auto" w="full">
                    <Stack gap={1}>
                      <Heading as="h2" textStyle="xl" fontWeight="bold">
                        {item.item_name}
                      </Heading>
                      {item.description && (
                        <Text color="fg.muted" textStyle="sm">
                          {item.description}
                        </Text>
                      )}
                    </Stack>

                    <Flex justify="space-between" align="center">
                      <Text textStyle="lg" fontWeight="bold">
                        {formatCurrency(item.item_price)}
                      </Text>
                      <Text textStyle="sm" color="fg.muted">
                        Qty: {item.quantity}
                      </Text>
                    </Flex>

                    <Flex justify="space-between">
                      <Text textStyle="sm" color="fg.muted">
                        Subtotal
                      </Text>
                      <Text textStyle="sm" fontWeight="semibold">
                        {formatCurrency(item.subtotal)}
                      </Text>
                    </Flex>

                    {item.stock_deducted > 0 && (
                      <Flex justify="space-between">
                        <Text textStyle="sm" color="fg.muted">
                          Stock deducted
                        </Text>
                        <Text textStyle="sm">{item.stock_deducted}</Text>
                      </Flex>
                    )}
                  </Stack>
                </Stack>
              </DialogBody>
            </>
          )}
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
