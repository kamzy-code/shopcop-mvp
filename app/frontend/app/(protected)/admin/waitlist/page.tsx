'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Input,
  NativeSelect,
  Spinner,
  Stack,
  Table,
  Text,
} from '@chakra-ui/react';
import { LuCheck, LuClock, LuRefreshCw, LuSearch, LuX } from 'react-icons/lu';
import { useAdminWaitlist, useUpdateWaitlistStatus } from '@/app/_hooks/admin-waitlist';
import type { WaitlistEntry, WaitlistStatus } from '@/app/_types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'IGNORED', label: 'Ignored' },
];

const USER_TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'BUY', label: 'Buy' },
  { value: 'SELL', label: 'Sell' },
  { value: 'BOTH', label: 'Both' },
];

const CHAT_OPTIONS = [
  { value: '', label: 'All chat' },
  { value: 'true', label: 'Open to chat' },
  { value: 'false', label: 'Not open' },
];

const STATUS_CONFIG: Record<WaitlistStatus, { label: string; bg: string; fg: string }> = {
  PENDING:   { label: 'Pending',   bg: 'warning.subtle', fg: 'warning.fg' },
  CONTACTED: { label: 'Contacted', bg: 'blue.subtle',    fg: 'blue.600' },
  CONVERTED: { label: 'Converted', bg: 'success.subtle', fg: 'success.fg' },
  IGNORED:   { label: 'Ignored',   bg: 'red.subtle',     fg: 'red.600' },
};

function StatusBadge({ status }: { status: WaitlistStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Box px={2} py={0.5} borderRadius="full" bg={cfg.bg} flexShrink={0}>
      <Text textStyle="2xs" fontWeight="semibold" color={cfg.fg}>{cfg.label}</Text>
    </Box>
  );
}

function StatusIcon({ status }: { status: WaitlistStatus }) {
  if (status === 'CONVERTED') return <LuCheck size={13} />;
  if (status === 'IGNORED') return <LuX size={13} />;
  return <LuClock size={13} />;
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatShortDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

interface EntryCardProps {
  entry: WaitlistEntry;
  updatingId: string | null;
  onStatusChange: (id: string, status: WaitlistStatus) => void;
}

function EntryCard({ entry, updatingId, onStatusChange }: EntryCardProps) {
  const isUpdating = updatingId === entry.id;
  return (
    <Box p={4} borderBottomWidth="1px" borderColor="border" opacity={isUpdating ? 0.6 : 1}>
      <Stack gap={2}>
        <Flex justify="space-between" align="flex-start" gap={2}>
          <Text textStyle="sm" fontWeight="semibold" wordBreak="break-all" minW={0}>
            {entry.email}
          </Text>
          <StatusBadge status={entry.status} />
        </Flex>

        <Flex gap={3} flexWrap="wrap">
          {entry.phone && (
            <Text textStyle="xs" color="fg.muted">{entry.phone}</Text>
          )}
          <Text textStyle="xs" color="fg.muted">{entry.user_type}</Text>
          <Text textStyle="xs" color="fg.muted">
            Chat: {entry.open_to_chat ? 'Yes' : 'No'}
          </Text>
        </Flex>

        {entry.trade_details && (
          <Text textStyle="xs" color="fg.muted" lineClamp={2}>{entry.trade_details}</Text>
        )}

        <Flex justify="space-between" align="center" gap={2}>
          <Text textStyle="xs" color="fg.subtle">
            Joined {formatShortDate(entry.created_at)}
          </Text>
          {entry.contacted_at && (
            <Text textStyle="xs" color="fg.subtle">
              Contacted {formatShortDate(entry.contacted_at)}
            </Text>
          )}
        </Flex>

        <NativeSelect.Root size="sm">
          <NativeSelect.Field
            value={entry.status}
            aria-disabled={isUpdating}
            onChange={(e) => { if (!isUpdating) onStatusChange(entry.id, e.target.value as WaitlistStatus); }}
          >
            <option value="PENDING">Pending</option>
            <option value="CONTACTED">Contacted</option>
            <option value="CONVERTED">Converted</option>
            <option value="IGNORED">Ignored</option>
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Stack>
    </Box>
  );
}

export default function AdminWaitlistPage() {
  const [status, setStatus] = useState('');
  const [userType, setUserType] = useState('');
  const [openToChat, setOpenToChat] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filters: import('@/app/_hooks/admin-waitlist').AdminWaitlistFilters = { page, limit: 20 };
  if (status) filters.status = status;
  if (userType) filters.user_type = userType;
  if (openToChat === 'true') filters.open_to_chat = true;
  if (openToChat === 'false') filters.open_to_chat = false;
  if (search.trim()) filters.search = search.trim();

  const { data, isLoading, isFetching, refetch } = useAdminWaitlist(filters);
  const updateStatus = useUpdateWaitlistStatus();

  const handleStatusChange = async (id: string, newStatus: WaitlistStatus) => {
    setUpdatingId(id);
    try {
      await updateStatus.mutateAsync({ id, data: { status: newStatus } });
      await refetch();
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPages = data?.pagination?.totalPages ?? 1;
  const entries: WaitlistEntry[] = data?.entries ?? [];

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Stack gap={6}>
        {/* Header */}
        <Flex justify="space-between" align="center" gap={3}>
          <Heading size="lg">Waitlist</Heading>
          <Button variant="outline" size="sm" onClick={() => refetch()} loading={isFetching}>
            <LuRefreshCw /> Refresh
          </Button>
        </Flex>

        {/* Filters */}
        <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
          <Stack direction={{ base: 'column', md: 'row' }} gap={3}>
            <HStack gap={2} flex={1}>
              <Box color="fg.muted" flexShrink={0}><LuSearch size={16} /></Box>
              <Input
                placeholder="Search by email or phone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                size="sm"
              />
            </HStack>
            <NativeSelect.Root size="sm" w={{ base: 'full', md: '160px' }}>
              <NativeSelect.Field value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </NativeSelect.Field>
            </NativeSelect.Root>
            <NativeSelect.Root size="sm" w={{ base: 'full', md: '130px' }}>
              <NativeSelect.Field value={userType} onChange={(e) => { setUserType(e.target.value); setPage(1); }}>
                {USER_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </NativeSelect.Field>
            </NativeSelect.Root>
            <NativeSelect.Root size="sm" w={{ base: 'full', md: '150px' }}>
              <NativeSelect.Field value={openToChat} onChange={(e) => { setOpenToChat(e.target.value); setPage(1); }}>
                {CHAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Stack>
        </Box>

        {/* Content */}
        <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" overflow="hidden">
          {isLoading ? (
            <Flex justify="center" align="center" p={12}>
              <Spinner size="lg" />
            </Flex>
          ) : entries.length === 0 ? (
            <Flex justify="center" align="center" p={12}>
              <Text color="fg.muted" textStyle="sm">No waitlist entries found</Text>
            </Flex>
          ) : (
            <>
              {/* Mobile: card list */}
              <Box hideFrom="md">
                {entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    updatingId={updatingId}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </Box>

              {/* Desktop: table */}
              <Box hideBelow="md">
                <Table.Root variant="outline" size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Email</Table.ColumnHeader>
                      <Table.ColumnHeader>Phone</Table.ColumnHeader>
                      <Table.ColumnHeader>Type</Table.ColumnHeader>
                      <Table.ColumnHeader>Trade Details</Table.ColumnHeader>
                      <Table.ColumnHeader>Chat</Table.ColumnHeader>
                      <Table.ColumnHeader>Status</Table.ColumnHeader>
                      <Table.ColumnHeader>Contacted</Table.ColumnHeader>
                      <Table.ColumnHeader>Joined</Table.ColumnHeader>
                      <Table.ColumnHeader>Update</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {entries.map((entry) => (
                      <Table.Row key={entry.id} opacity={updatingId === entry.id ? 0.6 : 1}>
                        <Table.Cell>{entry.email}</Table.Cell>
                        <Table.Cell>{entry.phone ?? '-'}</Table.Cell>
                        <Table.Cell>{entry.user_type}</Table.Cell>
                        <Table.Cell maxW="240px">
                          <Text truncate>{entry.trade_details}</Text>
                        </Table.Cell>
                        <Table.Cell>{entry.open_to_chat ? 'Yes' : 'No'}</Table.Cell>
                        <Table.Cell>
                          <HStack gap={1.5}>
                            <Box color={STATUS_CONFIG[entry.status].fg}>
                              <StatusIcon status={entry.status} />
                            </Box>
                            <Text>{STATUS_CONFIG[entry.status].label}</Text>
                          </HStack>
                        </Table.Cell>
                        <Table.Cell>{entry.contacted_at ? formatDate(entry.contacted_at) : '-'}</Table.Cell>
                        <Table.Cell>{formatDate(entry.created_at)}</Table.Cell>
                        <Table.Cell>
                          <NativeSelect.Root size="xs" w="120px">
                            <NativeSelect.Field
                              value={entry.status}
                              aria-disabled={updatingId === entry.id}
                              onChange={(e) => { if (updatingId !== entry.id) handleStatusChange(entry.id, e.target.value as WaitlistStatus); }}
                            >
                              <option value="PENDING">Pending</option>
                              <option value="CONTACTED">Contacted</option>
                              <option value="CONVERTED">Converted</option>
                              <option value="IGNORED">Ignored</option>
                            </NativeSelect.Field>
                          </NativeSelect.Root>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </>
          )}
        </Box>

        {/* Pagination */}
        {totalPages > 1 && (
          <Flex justify="space-between" align="center" gap={3}>
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Text textStyle="sm" color="fg.muted">
              Page {page} of {totalPages}
            </Text>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </Flex>
        )}
      </Stack>
    </Box>
  );
}
