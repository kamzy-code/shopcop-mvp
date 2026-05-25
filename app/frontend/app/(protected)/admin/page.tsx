'use client';
import { Box, Flex, Grid, Heading, SimpleGrid, Spinner, Stack, Text } from '@chakra-ui/react';
import {
  LuActivity,
  LuCircleCheck,
  LuClock,
  LuShieldCheck,
  LuUsers,
  LuCircleX,
} from 'react-icons/lu';
import { useAdminDashboardStats } from '@/app/_hooks/admin';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'primary',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
      <Flex justify="space-between" align="flex-start" mb={4}>
        <Flex
          w={10}
          h={10}
          borderRadius="lg"
          bg={`${color}.subtle`}
          align="center"
          justify="center"
          color={`${color}.fg`}
        >
          <Icon size={18} />
        </Flex>
      </Flex>
      <Text textStyle="2xl" fontWeight="bold" color="fg">
        {value}
      </Text>
      <Text textStyle="sm" color="fg.muted" mt={0.5}>
        {label}
      </Text>
      {sub && (
        <Text textStyle="xs" color="fg.subtle" mt={1}>
          {sub}
        </Text>
      )}
    </Box>
  );
}

function ActivityItem({
  actionType,
  targetType,
  adminEmail,
  createdAt,
}: {
  actionType: string;
  targetType: string;
  adminEmail?: string;
  createdAt: string;
}) {
  const label = actionType.replace(/_/g, ' ');
  const date = new Date(createdAt).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Flex align="center" gap={3} py={2.5} borderBottomWidth="1px" borderColor="border" _last={{ borderBottomWidth: 0 }}>
      <Flex
        w={8}
        h={8}
        borderRadius="full"
        bg="primary.subtle"
        align="center"
        justify="center"
        flexShrink={0}
        color="primary.fg"
      >
        <LuActivity size={14} />
      </Flex>
      <Box flex={1}>
        <Text textStyle="sm" color="fg" fontWeight="medium" textTransform="capitalize">
          {label}
        </Text>
        <Text textStyle="xs" color="fg.muted">
          on {targetType.replace(/_/g, ' ')}
          {adminEmail ? ` by ${adminEmail}` : ''}
        </Text>
      </Box>
      <Text textStyle="xs" color="fg.subtle" flexShrink={0}>
        {date}
      </Text>
    </Flex>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminDashboardStats();

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="40vh">
        <Spinner size="lg" color="primary.500" />
      </Flex>
    );
  }

  const pendingCount = stats?.verifications.total_pending ?? 0;
  const approvedCount = stats?.verifications.total_approved ?? 0;
  const rejectedCount = stats?.verifications.total_rejected ?? 0;
  const totalUsers = stats?.users.total ?? 0;
  const newUsers7Days = stats?.users.new_last_7_days ?? 0;

  return (
    <Stack gap={8}>
      {/* Header */}
      <Stack gap={1}>
        <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
          Admin Dashboard
        </Heading>
        <Text color="fg.muted" textStyle="sm">
          Platform-wide overview and activity.
        </Text>
      </Stack>

      {/* Key stats */}
      <Box>
        <Text
          textStyle="xs"
          fontWeight="semibold"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="wider"
          mb={4}
        >
          Overview
        </Text>
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
          <StatCard
            icon={LuUsers}
            label="Total Users"
            value={totalUsers}
            sub={`+${newUsers7Days} this week`}
            color="primary"
          />
          <StatCard
            icon={LuClock}
            label="Pending Verifications"
            value={pendingCount}
            sub="Awaiting review"
            color="warning"
          />
          <StatCard
            icon={LuCircleCheck}
            label="Approved"
            value={approvedCount}
            color="success"
          />
          <StatCard
            icon={LuCircleX}
            label="Rejected"
            value={rejectedCount}
            color="red"
          />
        </SimpleGrid>
      </Box>

      {/* Bottom row */}
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
        {/* User breakdown */}
        <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
          <Flex align="center" gap={2} mb={4}>
            <LuUsers size={16} color="var(--chakra-colors-primary-600)" />
            <Text fontWeight="semibold" color="fg" textStyle="sm">
              Users by Role
            </Text>
          </Flex>
          <Stack gap={2}>
            {stats &&
              Object.entries(stats.users.by_role).map(([role, count]) => (
                <Flex key={role} align="center" justify="space-between">
                  <Text textStyle="sm" color="fg.muted" textTransform="capitalize">
                    {role.toLowerCase()}s
                  </Text>
                  <Text textStyle="sm" fontWeight="semibold" color="fg">
                    {count}
                  </Text>
                </Flex>
              ))}
            <Box borderTopWidth="1px" borderColor="border" pt={2} mt={1}>
              <Flex align="center" justify="space-between">
                <Text textStyle="xs" color="fg.subtle">
                  Active
                </Text>
                <Text textStyle="xs" fontWeight="semibold" color="success.fg">
                  {stats?.users.active ?? '—'}
                </Text>
              </Flex>
              <Flex align="center" justify="space-between" mt={1}>
                <Text textStyle="xs" color="fg.subtle">
                  Inactive / Banned
                </Text>
                <Text textStyle="xs" fontWeight="semibold" color="red.500">
                  {stats?.users.inactive ?? '—'}
                </Text>
              </Flex>
            </Box>
          </Stack>
        </Box>

        {/* Pending by type */}
        <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
          <Flex align="center" gap={2} mb={4}>
            <LuShieldCheck size={16} color="var(--chakra-colors-primary-600)" />
            <Text fontWeight="semibold" color="fg" textStyle="sm">
              Pending by Type
            </Text>
          </Flex>
          {stats?.verifications.pending_by_type.length === 0 ? (
            <Text textStyle="sm" color="fg.muted">
              No pending verifications.
            </Text>
          ) : (
            <Stack gap={2}>
              {stats?.verifications.pending_by_type.map((item) => (
                <Flex key={item.type} align="center" justify="space-between">
                  <Text textStyle="sm" color="fg.muted">
                    {item.type}
                  </Text>
                  <Box
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    bg="warning.subtle"
                  >
                    <Text textStyle="xs" fontWeight="semibold" color="warning.fg">
                      {item.count}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </Stack>
          )}
        </Box>
      </Grid>

      {/* Recent activity */}
      <Box>
        <Text
          textStyle="xs"
          fontWeight="semibold"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="wider"
          mb={4}
        >
          Recent Activity
        </Text>
        <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" px={5}>
          {!stats?.recent_activity?.length ? (
            <Text textStyle="sm" color="fg.muted" py={6} textAlign="center">
              No recent activity.
            </Text>
          ) : (
            stats.recent_activity.map((entry) => (
              <ActivityItem
                key={entry.id}
                actionType={entry.action_type}
                targetType={entry.target_type}
                adminEmail={entry.admin?.email}
                createdAt={entry.created_at}
              />
            ))
          )}
        </Box>
      </Box>
    </Stack>
  );
}
