'use client';
import { useState } from 'react';
import { Box, Button, Flex, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { LuPackage, LuX } from 'react-icons/lu';
import { Product } from '@/app/_types';
import { formatCurrency } from '@/app/_lib/orderHelpers';

export function CatalogPickerPanel({
  products,
  onSelect,
  onClose,
}: {
  products: Product[];
  onSelect: (p: Product) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box position="fixed" top={0} left={0} right={0} bottom={0} zIndex={50}>
      <Box position="absolute" inset={0} bg="rgba(0,0,0,0.5)" onClick={onClose} />
      <Box
        position="absolute"
        top={{ base: '10%', md: '5%' }}
        left="50%"
        transform="translateX(-50%)"
        w={{ base: '95vw', md: '480px' }}
        maxH="80vh"
        bg="bg.panel"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="border"
        overflow="hidden"
        display="flex"
        flexDirection="column"
        zIndex={1}
      >
        <Flex
          align="center"
          justify="space-between"
          p={4}
          borderBottomWidth="1px"
          borderColor="border"
        >
          <Heading textStyle="md" fontWeight="semibold">
            Select from Catalog
          </Heading>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <LuX />
          </Button>
        </Flex>

        <Box px={4} py={3} borderBottomWidth="1px" borderColor="border">
          <Input
            placeholder="Search products..."
            size="sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>

        <Box flex={1} overflow="auto" p={2}>
          {filtered.length === 0 ? (
            <Flex align="center" justify="center" h="120px">
              <Text textStyle="sm" color="fg.muted">
                No products found
              </Text>
            </Flex>
          ) : (
            <Stack gap={1}>
              {filtered.map((p) => (
                <Flex
                  key={p.id}
                  align="center"
                  gap={3}
                  p={3}
                  borderRadius="lg"
                  cursor="pointer"
                  _hover={{ bg: 'bg.subtle' }}
                  onClick={() => {
                    onSelect(p);
                    onClose();
                  }}
                >
                  <Box
                    w={10}
                    h={10}
                    borderRadius="lg"
                    bg="bg.subtle"
                    overflow="hidden"
                    flexShrink={0}
                  >
                    {!p.media?.[0] ? (
                      <Flex h="full" align="center" justify="center" color="fg.subtle">
                        <LuPackage size={16} />
                      </Flex>
                    ) : p.media[0].media_type === 'VIDEO' ? (
                      <video
                        src={p.media[0].media_url}
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <img
                        src={p.media[0].media_url}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </Box>
                  <Box flex={1} overflow="hidden">
                    <Text textStyle="sm" fontWeight="medium" truncate>
                      {p.name}
                    </Text>
                    <Text textStyle="xs" color="fg.muted">
                      {formatCurrency(p.price)}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
