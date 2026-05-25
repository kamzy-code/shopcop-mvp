'use client';
import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Spinner,
  Stack,
  Table,
  Text,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowRight, LuSearch } from 'react-icons/lu';
import { useAdminUsers, AdminUsersFilters } from '@/app/_hooks/admin';

type RoleFilter = 'VENDOR' | 'BUYER' | 'ADMIN' | undefined;
type ActiveFilter = boolean | undefined;

const ROLE_OPTIONS: { label: string; value: RoleFilter }[] = [
  { label: 'All Roles', value: undefined },
  { label: 'Vendor', value: 'VENDOR' },
  { label: 'Buyer', value: 'BUYER' },
  { label: 'Admin', value: 'ADMIN' },
];

const ACTIVE_OPTIONS: { label: string; value: ActiveFilter }[] = [
  { label: 'All', value: undefined },
  { label: 'Active', value: true },
  { label: 'Banned', value: false },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(undefined);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(undefined);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Simple debounce on search input
  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout((handleSearchChange as any)._timer);
    (handleSearchChange as any)._timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  const filters: AdminUsersFilters = {
    ...(roleFilter && { role: roleFilter }),
    ...(activeFilter !== undefined && { is_active: activeFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
    page,
    limit: 20,
  };

  const { data, isLoading } = useAdminUsers(filters);

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  return (
    <Stack gap={8}>
      {/* Header */}
      <Stack gap={1}>
        <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
          Users
        </Heading>
        <Text color="fg.muted" textStyle="sm">
          View and manage all platform users.
        </Text>
      </Stack>

      {/* Filters */}
      <Flex gap={3} flexWrap="wrap" align="center">
        {/* Search */}
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
            placeholder="Search by email or name…"
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

        {/* Role filter */}
        <Flex gap={2} flexWrap="wrap">
          {ROLE_OPTIONS.map((opt) => (
            <Button
              key={String(opt.value)}
              size="sm"
              variant={roleFilter === opt.value ? 'solid' : 'outline'}
              colorPalette="primary"
              onClick={() => { setRoleFilter(opt.value); setPage(1); }}
              borderRadius="full"
            >
              {opt.label}
            </Button>
          ))}
        </Flex>

        {/* Active filter */}
        <Flex gap={2} flexWrap="wrap">
          {ACTIVE_OPTIONS.map((opt) => (
            <Button
              key={String(opt.value)}
              size="sm"
              variant={activeFilter === opt.value ? 'solid' : 'outline'}
              colorPalette="primary"
              onClick={() => { setActiveFilter(opt.value); setPage(1); }}
              borderRadius="full"
            >
              {opt.label}
            </Button>
          ))}
        </Flex>
      </Flex>

      {/* Table */}
      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" overflow="hidden">
        {isLoading ? (
          <Flex justify="center" py={12}>
            <Spinner size="lg" color="primary.500" />
          </Flex>
        ) : users.length === 0 ? (
          <Box py={12} textAlign="center">
            <Text color="fg.muted">No users found.</Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row bg="bg.subtle">
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4}>User</Table.ColumnHeader>
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4}>Role</Table.ColumnHeader>
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4}>Status</Table.ColumnHeader>
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4}>Joined</Table.ColumnHeader>
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4} />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {users.map((u) => {
                  const joined = new Date(u.created_at).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <Table.Row key={u.id} _hover={{ bg: 'bg.subtle' }}>
                      <Table.Cell px={4} py={3}>
                        <Text textStyle="sm" fontWeight="medium" color="fg">
                          {u.name || '—'}
                        </Text>
                        <Text textStyle="xs" color="fg.muted">
                          {u.email}
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={4} py={3}>
                        <Box
                          display="inline-block"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                          bg="bg.subtle"
                          borderWidth="1px"
                          borderColor="border"
                        >
                          <Text textStyle="xs" fontWeight="medium" color="fg">
                            {u.role}
                          </Text>
                        </Box>
                      </Table.Cell>
                      <Table.Cell px={4} py={3}>
                        <Box
                          display="inline-block"
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          bg={u.is_active ? 'success.subtle' : 'red.subtle'}
                        >
                          <Text
                            textStyle="xs"
                            fontWeight="semibold"
                            color={u.is_active ? 'success.fg' : 'red.600'}
                          >
                            {u.is_active ? 'Active' : 'Banned'}
                          </Text>
                        </Box>
                      </Table.Cell>
                      <Table.Cell px={4} py={3}>
                        <Text textStyle="sm" color="fg.muted">
                          {joined}
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={4} py={3} textAlign="right">
                        <Button
                          size="xs"
                          variant="ghost"
                          color="primary.fg"
                          onClick={() => router.push(`/admin/users/${u.id}`)}
                        >
                          View <LuArrowRight size={12} />
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Box>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Flex justify="space-between" align="center" px={4} py={3} borderTopWidth="1px" borderColor="border">
            <Text textStyle="xs" color="fg.muted">
              {pagination.total} total · page {pagination.page} of {pagination.totalPages}
            </Text>
            <Flex gap={2}>
              <Button
                size="xs"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </Flex>
          </Flex>
        )}
      </Box>
    </Stack>
  );
}
