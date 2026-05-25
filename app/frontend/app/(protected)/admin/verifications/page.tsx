'use client';
import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
  Stack,
  Table,
  Text,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowRight, LuFilter } from 'react-icons/lu';
import { useAdminVerifications, AdminVerificationsFilters } from '@/app/_hooks/admin';

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED' | undefined;
type TypeFilter = 'NIN' | 'CAC' | 'SMEDAN' | 'ADDRESS' | undefined;

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const TYPE_OPTIONS: { label: string; value: TypeFilter }[] = [
  { label: 'All Types', value: undefined },
  { label: 'NIN', value: 'NIN' },
  { label: 'CAC', value: 'CAC' },
  { label: 'SMEDAN', value: 'SMEDAN' },
  { label: 'Address', value: 'ADDRESS' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'red',
};

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(undefined);
  const [page, setPage] = useState(1);

  const filters: AdminVerificationsFilters = {
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { type: typeFilter }),
    page,
    limit: 20,
  };

  const { data, isLoading } = useAdminVerifications(filters);

  const verifications = data?.verifications ?? [];
  const pagination = data?.pagination;

  return (
    <Stack gap={8}>
      {/* Header */}
      <Flex align="center" justify="space-between" flexWrap="wrap" gap={4}>
        <Stack gap={1}>
          <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
            Verifications
          </Heading>
          <Text color="fg.muted" textStyle="sm">
            Review and manage vendor verification submissions.
          </Text>
        </Stack>
      </Flex>

      {/* Filters */}
      <Box>
        <Flex align="center" gap={2} mb={3}>
          <LuFilter size={14} color="var(--chakra-colors-fg-muted)" />
          <Text textStyle="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wider">
            Filter
          </Text>
        </Flex>
        <Flex gap={3} flexWrap="wrap">
          {/* Status filter */}
          <Flex gap={2} flexWrap="wrap">
            {STATUS_OPTIONS.map((opt) => (
              <Button
                key={String(opt.value)}
                size="sm"
                variant={statusFilter === opt.value ? 'solid' : 'outline'}
                colorPalette="primary"
                onClick={() => { setStatusFilter(opt.value); setPage(1); }}
                borderRadius="full"
              >
                {opt.label}
              </Button>
            ))}
          </Flex>

          <Box h="auto" w="1px" bg="border" display={{ base: 'none', sm: 'block' }} />

          {/* Type filter */}
          <Flex gap={2} flexWrap="wrap">
            {TYPE_OPTIONS.map((opt) => (
              <Button
                key={String(opt.value)}
                size="sm"
                variant={typeFilter === opt.value ? 'solid' : 'outline'}
                colorPalette="primary"
                onClick={() => { setTypeFilter(opt.value); setPage(1); }}
                borderRadius="full"
              >
                {opt.label}
              </Button>
            ))}
          </Flex>
        </Flex>
      </Box>

      {/* Table */}
      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" overflow="hidden">
        {isLoading ? (
          <Flex justify="center" py={12}>
            <Spinner size="lg" color="primary.500" />
          </Flex>
        ) : verifications.length === 0 ? (
          <Box py={12} textAlign="center">
            <Text color="fg.muted">No verifications found for the selected filters.</Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row bg="bg.subtle">
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4}>Vendor</Table.ColumnHeader>
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4}>Type</Table.ColumnHeader>
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4}>Status</Table.ColumnHeader>
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4}>Submitted</Table.ColumnHeader>
                  <Table.ColumnHeader color="fg.muted" fontWeight="semibold" textStyle="xs" textTransform="uppercase" letterSpacing="wider" py={3} px={4} />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {verifications.map((v) => {
                  const color = STATUS_COLORS[v.status] ?? 'gray';
                  const submitted = new Date(v.submitted_at).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <Table.Row key={v.id} _hover={{ bg: 'bg.subtle' }}>
                      <Table.Cell px={4} py={3}>
                        <Text textStyle="sm" fontWeight="medium" color="fg">
                          {(v as any).vendor?.user?.email ?? v.vendor_id}
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
                            {v.type}
                          </Text>
                        </Box>
                      </Table.Cell>
                      <Table.Cell px={4} py={3}>
                        <Box
                          display="inline-block"
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          bg={`${color}.subtle`}
                        >
                          <Text textStyle="xs" fontWeight="semibold" color={`${color}.fg`}>
                            {v.status}
                          </Text>
                        </Box>
                      </Table.Cell>
                      <Table.Cell px={4} py={3}>
                        <Text textStyle="sm" color="fg.muted">
                          {submitted}
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={4} py={3} textAlign="right">
                        <Button
                          size="xs"
                          variant="ghost"
                          color="primary.fg"
                          onClick={() => router.push(`/admin/verifications/${v.id}`)}
                        >
                          Review <LuArrowRight size={12} />
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
