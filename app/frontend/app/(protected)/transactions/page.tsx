'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuChevronLeft, LuChevronRight, LuClipboardList, LuPlus, LuSearch } from 'react-icons/lu';
import { AppShell } from '@/components/shared/appShell';
import { TransactionStatusBadge } from '@/components/transaction/TransactionStatusBadge';
import { useTransactions } from '@/app/_hooks/transaction';
import { PaymentStatus, TransactionFilters, TransactionListItem, TransactionStatus } from '@/app/_types';
import { formatCurrency, formatDate } from '@/app/_lib/transactionHelpers';


// ─── Filter chips ──────────────────────────────────────────────────────────────

const FILTER_CHIPS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Refund Req.', value: 'REFUND_REQUESTED' },
  { label: 'Refund In Progress', value: 'REFUND_IN_PROGRESS' },
  { label: 'Refunded', value: 'REFUNDED' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

// ─── TransactionCard ──────────────────────────────────────────────────────────

function TransactionCard({ tx }: { tx: TransactionListItem }) {
  const router = useRouter();
  const itemCount = tx.items.length;
  const preview = tx.items
    .slice(0, 2)
    .map((i) => i.item_name)
    .join(', ');

  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      p={4}
      cursor="pointer"
      onClick={() => router.push(`/transactions/${tx.id}`)}
      transition="box-shadow 0.15s"
      _hover={{ shadow: 'md' }}
    >
      <Flex align="flex-start" justify="space-between" gap={3} mb={3}>
        <Stack gap={0.5} flex={1} overflow="hidden">
          <Text textStyle="xs" color="fg.muted" fontFamily="mono">
            {tx.reference}
          </Text>
          <Text textStyle="sm" fontWeight="semibold" color="fg" truncate>
            {tx.delivery_method === 'PICKUP'
              ? 'Pickup'
              : tx.delivery_method === 'DISPATCH'
                ? 'Dispatch'
                : 'Waybill'}
          </Text>
        </Stack>
        <TransactionStatusBadge status={tx.status as TransactionStatus} />
      </Flex>

      <Text textStyle="xs" color="fg.subtle" truncate>
        {preview}
        {itemCount > 2 ? ` +${itemCount - 2} more` : ''}
      </Text>

      {(tx.payment_status as PaymentStatus) === 'PROOF_SUBMITTED' && (
        <Flex align="center" gap={1.5} mt={2}>
          <Box
            w={2}
            h={2}
            borderRadius="full"
            bg="orange.400"
            _dark={{ bg: 'orange.300' }}
            flexShrink={0}
          />
          <Text
            textStyle="xs"
            color="orange.700"
            _dark={{ color: 'orange.300' }}
            fontWeight="medium"
          >
            Payment proof submitted
          </Text>
        </Flex>
      )}

      <Flex align="center" justify="space-between" mt={3}>
        <Text textStyle="sm" fontWeight="bold" color="primary.fg">
          {formatCurrency(tx.total_amount)}
        </Text>
        <Text textStyle="xs" color="fg.muted">
          {formatDate(tx.created_at)}
        </Text>
      </Flex>
    </Box>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TransactionCardSkeleton() {
  return (
    <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4} h="140px">
      <Stack gap={2}>
        <Box h={3} w="40%" bg="bg.subtle" borderRadius="md" />
        <Box h={4} w="60%" bg="bg.subtle" borderRadius="md" />
        <Box h={3} w="30%" bg="bg.subtle" borderRadius="md" />
        <Box mt={2} h={3} w="80%" bg="bg.subtle" borderRadius="md" />
        <Flex justify="space-between" mt={1}>
          <Box h={4} w="25%" bg="bg.subtle" borderRadius="md" />
          <Box h={3} w="20%" bg="bg.subtle" borderRadius="md" />
        </Flex>
      </Stack>
    </Box>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

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
        <LuClipboardList size={28} />
      </Flex>
      <Heading as="h3" textStyle="lg" fontWeight="semibold" color="fg" mb={2}>
        No transactions yet
      </Heading>
      <Text color="fg.muted" textStyle="sm" mb={6} maxW="300px" mx="auto">
        Record your first order and share the tracking link with your buyer.
      </Text>
      <Button colorPalette="primary" onClick={onAdd}>
        <LuPlus />
        New Transaction
      </Button>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState<TransactionFilters['sort']>('newest');
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 500);
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((value: TransactionFilters['sort']) => {
    setSort(value);
    setPage(1);
  }, []);

  const filters: TransactionFilters = {
    page,
    limit: 20,
    sort,
    ...(statusFilter && { status: statusFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
  };

  const { data, isLoading } = useTransactions(filters);
  const transactions = data?.data ?? [];
  const meta = data?.meta;

  return (
    <AppShell>
      <Stack gap={6}>
        {/* Header */}
        <Flex align="center" justify="space-between" flexWrap="wrap" gap={4}>
          <Stack gap={0.5}>
            <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
              Transactions
            </Heading>
            {meta && (
              <Text color="fg.muted" textStyle="sm">
                {meta.total} {meta.total === 1 ? 'transaction' : 'transactions'}
              </Text>
            )}
          </Stack>
          <Button colorPalette="primary" size="md" onClick={() => router.push('/transactions/new')}>
            <LuPlus />
            New Transaction
          </Button>
        </Flex>

        {/* Search + Sort row */}
        <Flex gap={3} flexWrap="wrap" align="center">
          <Flex
            align="center"
            flex={1}
            minW="200px"
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
              placeholder="Search by name, phone, reference..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
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

          <Flex
            borderWidth="1px"
            borderColor="border"
            borderRadius="lg"
            bg="bg.panel"
            px={3}
            h="40px"
            align="center"
          >
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value as TransactionFilters['sort'])}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '14px',
                color: 'inherit',
                cursor: 'pointer',
              }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount_desc">Amount ↓</option>
              <option value="amount_asc">Amount ↑</option>
            </select>
          </Flex>
        </Flex>

        {/* Status filter chips */}
        <Flex gap={2} flexWrap="wrap">
          {FILTER_CHIPS.map((chip) => (
            <Box
              key={chip.value}
              as="button"
              px={3}
              py={1.5}
              borderRadius="full"
              textStyle="xs"
              fontWeight="medium"
              cursor="pointer"
              onClick={() => handleStatusFilterChange(chip.value)}
              bg={statusFilter === chip.value ? 'primary.500' : 'bg.panel'}
              color={statusFilter === chip.value ? 'white' : 'fg.muted'}
              borderWidth="1px"
              borderColor={statusFilter === chip.value ? 'primary.500' : 'border'}
              transition="all 0.15s"
              _hover={{
                bg: statusFilter === chip.value ? 'primary.600' : 'bg.subtle',
                color: statusFilter === chip.value ? 'white' : 'fg',
              }}
            >
              {chip.label}
            </Box>
          ))}
        </Flex>

        {/* Content */}
        {isLoading ? (
          <Stack gap={3}>
            {Array.from({ length: 5 }).map((_, i) => (
              <TransactionCardSkeleton key={i} />
            ))}
          </Stack>
        ) : transactions.length === 0 && !statusFilter && !debouncedSearch ? (
          <EmptyState onAdd={() => router.push('/transactions/new')} />
        ) : transactions.length === 0 ? (
          <Box textAlign="center" py={12}>
            <Text color="fg.muted" textStyle="sm">
              No transactions match your filters.
            </Text>
          </Box>
        ) : (
          <Stack gap={3}>
            {transactions.map((tx) => (
              <TransactionCard key={tx.id} tx={tx} />
            ))}
          </Stack>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <Flex align="center" justify="center" gap={3}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <LuChevronLeft />
              Prev
            </Button>
            <Text textStyle="sm" color="fg.muted">
              {page} / {meta.totalPages}
            </Text>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
            >
              Next
              <LuChevronRight />
            </Button>
          </Flex>
        )}
      </Stack>
    </AppShell>
  );
}
