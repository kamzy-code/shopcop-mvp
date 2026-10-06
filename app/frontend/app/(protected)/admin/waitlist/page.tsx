'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Spinner,
  Stack,
  Table,
  Text,
} from '@chakra-ui/react';
import { LuCheck, LuClock, LuRefreshCw, LuSearch, LuX } from 'react-icons/lu';
import { useAdminWaitlist, useUpdateWaitlistStatus } from '@/app/_hooks/admin-waitlist';
import { WaitlistEntry, WaitlistStatus } from '@/app/_types';

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
  { value: '', label: 'All' },
  { value: 'true', label: 'Open to chat' },
  { value: 'false', label: 'Not open to chat' },
];

const STATUS_LABELS: Record<WaitlistStatus, string> = {
  PENDING: 'Pending',
  CONTACTED: 'Contacted',
  CONVERTED: 'Converted',
  IGNORED: 'Ignored',
};

export default function AdminWaitlistPage() {
  const [status, setStatus] = useState('');
  const [userType, setUserType] = useState('');
  const [openToChat, setOpenToChat] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filters: any = { page, limit: 20 };
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (s: WaitlistStatus) => {
    if (s === 'CONTACTED') return <LuClock size={14} />;
    if (s === 'CONVERTED') return <LuCheck size={14} />;
    if (s === 'IGNORED') return <LuX size={14} />;
    return <LuClock size={14} />;
  };

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Stack gap={6}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
          <Heading size="lg">Waitlist Entries</Heading>
          <Button variant="outline" size="sm" onClick={() => refetch()} loading={isFetching}>
            <LuRefreshCw /> Refresh
          </Button>
        </Flex>
        <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
          <HStack gap={3} wrap="wrap">
            <Box flex={1} minW="200px">
              <HStack gap={2}>
                <LuSearch />
                <Input
                  placeholder="Search by email, phone, or trade details..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </HStack>
            </Box>
            <NativeSelect.Root w="200px">
              <NativeSelect.Field
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
            <NativeSelect.Root w="150px">
              <NativeSelect.Field
                value={userType}
                onChange={(e) => {
                  setUserType(e.target.value);
                  setPage(1);
                }}
              >
                {USER_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
            <NativeSelect.Root w="180px">
              <NativeSelect.Field
                value={openToChat}
                onChange={(e) => {
                  setOpenToChat(e.target.value);
                  setPage(1);
                }}
              >
                {CHAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </HStack>
        </Box>
        <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" overflow="hidden">
          {isLoading ? (
            <Flex justify="center" align="center" p={12}>
              <Spinner size="lg" />
            </Flex>
          ) : (
            <Table.Root variant="outline" size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Email</Table.ColumnHeader>
                  <Table.ColumnHeader>Phone</Table.ColumnHeader>
                  <Table.ColumnHeader>Type</Table.ColumnHeader>
                  <Table.ColumnHeader>Trade</Table.ColumnHeader>
                  <Table.ColumnHeader>Chat</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader>Contacted</Table.ColumnHeader>
                  <Table.ColumnHeader>Joined</Table.ColumnHeader>
                  <Table.ColumnHeader>Update</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data?.entries?.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={9} textAlign="center" py={10}>
                      <Text color="fg.muted">No waitlist entries found</Text>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  data?.entries?.map((entry: WaitlistEntry) => (
                    <Table.Row key={entry.id}>
                      <Table.Cell>{entry.email}</Table.Cell>
                      <Table.Cell>{entry.phone}</Table.Cell>
                      <Table.Cell>{entry.user_type}</Table.Cell>
                      <Table.Cell maxW="260px">
                        <Text truncate>{entry.trade_details}</Text>
                      </Table.Cell>
                      <Table.Cell>{entry.open_to_chat ? 'Yes' : 'No'}</Table.Cell>
                      <Table.Cell>
                        <HStack gap={1}>
                          {getStatusIcon(entry.status)}
                          <Text>{STATUS_LABELS[entry.status]}</Text>
                        </HStack>
                      </Table.Cell>
                      <Table.Cell>{entry.contacted_at ? formatDate(entry.contacted_at) : '-'}</Table.Cell>
                      <Table.Cell>{formatDate(entry.created_at)}</Table.Cell>
                      <Table.Cell>
                        <NativeSelect.Root size="xs" w="120px">
                          <NativeSelect.Field
                            value={entry.status}
                            onChange={(e) => handleStatusChange(entry.id, e.target.value as WaitlistStatus)}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="CONVERTED">Converted</option>
                            <option value="IGNORED">Ignored</option>
                          </NativeSelect.Field>
                        </NativeSelect.Root>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
