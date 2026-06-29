'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Flex,
  Heading,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuArrowRight, LuSearch, LuFlag, LuPackage } from 'react-icons/lu';
import {
  useAdminProducts,
  useAdminProductAnalytics,
} from '@/app/_hooks/admin';
import { AdminProductFilters } from '@/app/_types';

type StatusFilter = AdminProductFilters['status'] | undefined;

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
  { label: 'Archived', value: 'ARCHIVED' },
];

function formatNaira(value: number) {
  return `₦${Number(value).toLocaleString('en-NG')}`;
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
      <Text textStyle="2xl" fontWeight="bold" color="fg">
        {value}
      </Text>
      <Text textStyle="sm" color="fg.muted" mt={0.5}>
        {label}
      </Text>
    </Box>
  );
}

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorId = searchParams.get('vendor_id') ?? undefined;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(searchTimerRef.current), []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  const filters: AdminProductFilters = {
    ...(vendorId && { vendor_id: vendorId }),
    ...(statusFilter && { status: statusFilter }),
    ...(flaggedOnly && { flagged: true }),
    ...(debouncedSearch && { search: debouncedSearch }),
    page,
    limit: 20,
  };

  const { data, isLoading, isError } = useAdminProducts(filters);
  const { data: analytics } = useAdminProductAnalytics();

  const products = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <Stack gap={8}>
      {/* Header */}
      <Stack gap={1}>
        <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
          Products
        </Heading>
        <Text color="fg.muted" textStyle="sm">
          Monitor the product catalog across all vendors.
        </Text>
      </Stack>

      {/* Quick stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        <StatCard label="Active" value={analytics?.quick_stats.active ?? '—'} />
        <StatCard label="Out of Stock" value={analytics?.quick_stats.out_of_stock ?? '—'} />
        <StatCard label="Archived" value={analytics?.quick_stats.archived ?? '—'} />
        <StatCard label="Flagged" value={analytics?.quick_stats.flagged ?? '—'} />
      </SimpleGrid>

      {/* Top performers */}
      {analytics && analytics.top_performers.length > 0 && (
        <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
          <Flex align="center" gap={2} mb={4}>
            <LuPackage size={16} color="var(--chakra-colors-primary-600)" />
            <Text fontWeight="semibold" color="fg" textStyle="sm">
              Top Performers
            </Text>
          </Flex>
          <Stack gap={2}>
            {analytics.top_performers.map((p, i) => (
              <Flex key={p.product_id} align="center" justify="space-between">
                <Text textStyle="sm" color="fg">
                  {i + 1}. {p.name}{' '}
                  <Text as="span" color="fg.muted">
                    ({p.vendor_name ?? 'Unknown vendor'})
                  </Text>
                </Text>
                <Text textStyle="sm" fontWeight="semibold" color="fg">
                  {p.units_sold} sold · {formatNaira(p.revenue)}
                </Text>
              </Flex>
            ))}
          </Stack>
        </Box>
      )}

      {/* Filters */}
      <Flex gap={3} flexWrap="wrap" align="center">
        <Flex
          align="center"
          gap={2}
          px={3}
          py={2}
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          bg="bg.panel"
          flex={{ base: '1', md: '0 0 260px' }}
        >
          <LuSearch size={14} color="var(--chakra-colors-fg-muted)" />
          <Input
            placeholder="Search by product or vendor name…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            border="none"
            outline="none"
            p={0}
            textStyle="sm"
            color="fg"
            _focus={{ boxShadow: 'none' }}
          />
        </Flex>

        <Flex gap={2} flexWrap="wrap">
          <Button
            size="sm"
            variant={!statusFilter ? 'solid' : 'outline'}
            colorPalette="primary"
            onClick={() => { setStatusFilter(undefined); setPage(1); }}
            borderRadius="full"
          >
            All
          </Button>
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={statusFilter === opt.value ? 'solid' : 'outline'}
              colorPalette="primary"
              onClick={() => { setStatusFilter(opt.value); setPage(1); }}
              borderRadius="full"
            >
              {opt.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant={flaggedOnly ? 'solid' : 'outline'}
            colorPalette="red"
            onClick={() => { setFlaggedOnly((v) => !v); setPage(1); }}
            borderRadius="full"
          >
            <LuFlag size={12} /> Flagged
          </Button>
        </Flex>
      </Flex>

      {isError && (
        <Alert.Root status="error" borderRadius="lg">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Failed to load products</Alert.Title>
            <Alert.Description textStyle="xs">Please check your filters and try again.</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      {/* Table */}
      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" overflow="hidden">
        {isLoading ? (
          <Flex justify="center" py={12}>
            <Spinner size="lg" color="primary.500" />
          </Flex>
        ) : products.length === 0 ? (
          <Box py={12} textAlign="center">
            <Text color="fg.muted">No products found.</Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row bg="bg.subtle">
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4}>Product</Table.ColumnHeader>
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4}>Vendor</Table.ColumnHeader>
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4}>Price</Table.ColumnHeader>
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4}>Status</Table.ColumnHeader>
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4} />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {products.map((p) => (
                  <Table.Row key={p.id} _hover={{ bg: 'bg.subtle' }}>
                    <Table.Cell px={4} py={3}>
                      <Text textStyle="sm" fontWeight="medium" color="fg">
                        {p.name}
                      </Text>
                      <Text textStyle="xs" color="fg.muted">
                        {p.category}
                      </Text>
                    </Table.Cell>
                    <Table.Cell px={4} py={3}>
                      <Text textStyle="sm" color="fg.muted">
                        {p.vendor.business_name ?? '—'}
                      </Text>
                    </Table.Cell>
                    <Table.Cell px={4} py={3}>
                      <Text textStyle="sm" color="fg">
                        {formatNaira(p.price)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell px={4} py={3}>
                      <Flex gap={1.5} flexWrap="wrap">
                        <Box
                          display="inline-block"
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          bg={p.deleted_at ? 'red.subtle' : p.stock_status === 'OUT_OF_STOCK' ? 'warning.subtle' : 'success.subtle'}
                        >
                          <Text
                            textStyle="xs"
                            fontWeight="semibold"
                            color={p.deleted_at ? 'red.600' : p.stock_status === 'OUT_OF_STOCK' ? 'warning.fg' : 'success.fg'}
                          >
                            {p.deleted_at ? 'Archived' : p.stock_status === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Active'}
                          </Text>
                        </Box>
                        {p.is_flagged && (
                          <Box display="inline-block" px={2} py={0.5} borderRadius="full" bg="red.subtle">
                            <Text textStyle="xs" fontWeight="semibold" color="red.600">
                              Flagged
                            </Text>
                          </Box>
                        )}
                      </Flex>
                    </Table.Cell>
                    <Table.Cell px={4} py={3} textAlign="right">
                      <Button
                        size="xs"
                        variant="ghost"
                        color="primary.fg"
                        onClick={() => router.push(`/admin/products/${p.id}`)}
                      >
                        View <LuArrowRight size={12} />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Flex justify="space-between" align="center" px={4} py={3} borderTopWidth="1px" borderColor="border">
            <Text textStyle="xs" color="fg.muted">
              {data?.total} total · page {data?.page} of {totalPages}
            </Text>
            <Flex gap={2}>
              <Button size="xs" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button size="xs" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </Flex>
          </Flex>
        )}
      </Box>
    </Stack>
  );
}
