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
import { LuArrowRight, LuSearch, LuTriangleAlert } from 'react-icons/lu';
import { useAdminOrders, useAdminOrderAnalytics } from '@/app/_hooks/admin';
import { AdminOrderFilters, AdminOrderListItem } from '@/app/_types';

const STATUS_OPTIONS = [
  'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED', 'COMPLETED',
  'REFUND_REQUESTED', 'CANCELLED',
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

function AttentionRow({ order, onClick }: { order: AdminOrderListItem; onClick: () => void }) {
  return (
    <Flex align="center" justify="space-between" py={2.5} borderBottomWidth="1px" borderColor="border" _last={{ borderBottomWidth: 0 }}>
      <Box>
        <Text textStyle="sm" fontWeight="medium" color="fg">
          {order.reference} · {formatNaira(order.total_amount)}
        </Text>
        <Text textStyle="xs" color="fg.muted">
          {order.vendor.business_name ?? 'Unknown vendor'} · {order.status}
        </Text>
      </Box>
      <Button size="xs" variant="ghost" color="primary.fg" onClick={onClick}>
        View <LuArrowRight size={12} />
      </Button>
    </Flex>
  );
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorId = searchParams.get('vendor_id') ?? undefined;
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
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

  const filters: AdminOrderFilters = {
    ...(vendorId && { vendor_id: vendorId }),
    ...(statusFilter && { status: statusFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
    page,
    limit: 20,
  };

  const { data, isLoading, isError } = useAdminOrders(filters);
  const { data: analytics } = useAdminOrderAnalytics();

  const orders = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const attention = analytics?.needing_attention;
  const attentionCount =
    (attention?.proof_submitted.length ?? 0) +
    (attention?.refund_requested.length ?? 0) +
    (attention?.late_delivered.length ?? 0);

  return (
    <Stack gap={8}>
      <Stack gap={1}>
        <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
          Orders
        </Heading>
        <Text color="fg.muted" textStyle="sm">
          Monitor order flow, payments, and refunds across all vendors.
        </Text>
      </Stack>

      {/* Quick stats */}
      <Box>
        <Text textStyle="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wider" mb={3}>
          This Month
        </Text>
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
          <StatCard label="Orders This Month" value={analytics?.this_month.total_orders ?? '—'} />
          <StatCard label="Completion Rate" value={analytics ? `${analytics.this_month.completion_rate}%` : '—'} />
          <StatCard label="Avg Order Value" value={analytics ? formatNaira(analytics.this_month.avg_order_value) : '—'} />
          <StatCard label="Refund Rate" value={analytics ? `${analytics.this_month.refund_rate}%` : '—'} />
        </SimpleGrid>
      </Box>

      <Box>
        <Text textStyle="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wider" mb={3}>
          All Time
        </Text>
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
          <StatCard label="Total Orders" value={analytics?.all_time.total_orders ?? '—'} />
          <StatCard label="Completion Rate" value={analytics ? `${analytics.all_time.completion_rate}%` : '—'} />
          <StatCard label="Avg Order Value" value={analytics ? formatNaira(analytics.all_time.avg_order_value) : '—'} />
          <StatCard label="Refund Rate" value={analytics ? `${analytics.all_time.refund_rate}%` : '—'} />
        </SimpleGrid>
      </Box>

      {/* Needing attention */}
      {attentionCount > 0 && (
        <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="warning.subtle" borderRadius="xl">
          <Flex align="center" gap={2} mb={4}>
            <LuTriangleAlert size={16} color="var(--chakra-colors-warning-fg)" />
            <Text fontWeight="semibold" color="fg" textStyle="sm">
              Needing Attention ({attentionCount})
            </Text>
          </Flex>
          <Stack gap={1}>
            {attention?.proof_submitted.map((o) => (
              <AttentionRow key={o.id} order={o} onClick={() => router.push(`/admin/orders/${o.id}`)} />
            ))}
            {attention?.refund_requested.map((o) => (
              <AttentionRow key={o.id} order={o} onClick={() => router.push(`/admin/orders/${o.id}`)} />
            ))}
            {attention?.late_delivered.map((o) => (
              <AttentionRow key={o.id} order={o} onClick={() => router.push(`/admin/orders/${o.id}`)} />
            ))}
          </Stack>
        </Box>
      )}

      {/* Filters */}
      <Flex gap={3} flexWrap="wrap" align="center">
        <Flex align="center" gap={2} px={3} py={2} borderWidth="1px" borderColor="border" borderRadius="lg" bg="bg.panel" flex={{ base: '1', md: '0 0 260px' }}>
          <LuSearch size={14} color="var(--chakra-colors-fg-muted)" />
          <Input
            placeholder="Search by reference, email, vendor, or item…"
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
          <Button size="sm" variant={!statusFilter ? 'solid' : 'outline'} colorPalette="primary" onClick={() => { setStatusFilter(undefined); setPage(1); }} borderRadius="full">
            All
          </Button>
          {STATUS_OPTIONS.map((status) => (
            <Button key={status} size="sm" variant={statusFilter === status ? 'solid' : 'outline'} colorPalette="primary" onClick={() => { setStatusFilter(status); setPage(1); }} borderRadius="full">
              {status.replace(/_/g, ' ')}
            </Button>
          ))}
        </Flex>
      </Flex>

      {isError && (
        <Alert.Root status="error" borderRadius="lg">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Failed to load orders</Alert.Title>
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
        ) : orders.length === 0 ? (
          <Box py={12} textAlign="center">
            <Text color="fg.muted">No orders found.</Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row bg="bg.subtle">
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4}>Reference</Table.ColumnHeader>
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4}>Vendor</Table.ColumnHeader>
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4}>Amount</Table.ColumnHeader>
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4}>Status</Table.ColumnHeader>
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4} />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {orders.map((o) => (
                  <Table.Row key={o.id} _hover={{ bg: 'bg.subtle' }}>
                    <Table.Cell px={4} py={3}>
                      <Text textStyle="sm" fontWeight="medium" color="fg">
                        {o.reference}
                      </Text>
                      <Text textStyle="xs" color="fg.muted">
                        {new Date(o.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </Table.Cell>
                    <Table.Cell px={4} py={3}>
                      <Text textStyle="sm" color="fg.muted">
                        {o.vendor.business_name ?? '—'}
                      </Text>
                    </Table.Cell>
                    <Table.Cell px={4} py={3}>
                      <Text textStyle="sm" color="fg">
                        {formatNaira(o.total_amount)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell px={4} py={3}>
                      <Box display="inline-block" px={2} py={0.5} borderRadius="full" bg="bg.subtle" borderWidth="1px" borderColor="border">
                        <Text textStyle="xs" fontWeight="medium" color="fg">
                          {o.status.replace(/_/g, ' ')}
                        </Text>
                      </Box>
                    </Table.Cell>
                    <Table.Cell px={4} py={3} textAlign="right">
                      <Button size="xs" variant="ghost" color="primary.fg" onClick={() => router.push(`/admin/orders/${o.id}`)}>
                        View <LuArrowRight size={12} />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}

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
