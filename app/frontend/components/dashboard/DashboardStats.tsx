'use client';
import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuPackage, LuShoppingCart, LuStar, LuTrendingUp } from 'react-icons/lu';
import { formatCurrency } from '@/app/_lib/orderHelpers';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'primary',
  comingSoon = false,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  comingSoon?: boolean;
  onClick?: () => void;
}) {
  return (
    <Box
      p={5}
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      onClick={onClick}
      cursor={onClick ? 'pointer' : undefined}
      _hover={onClick ? { borderColor: 'border.emphasized' } : undefined}
      transition="border-color 0.15s"
    >
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
        {comingSoon && (
          <Box
            px={2}
            py={0.5}
            borderRadius="full"
            bg="bg.subtle"
            borderWidth="1px"
            borderColor="border"
          >
            <Text textStyle="2xs" color="fg.muted" fontWeight="medium">
              Soon
            </Text>
          </Box>
        )}
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

interface DashboardStatsProps {
  productCount: number;
  inStockCount: number;
  analytics: { this_month: { total_orders: number; revenue: number } } | undefined;
}

export function DashboardStats({ productCount, inStockCount, analytics }: DashboardStatsProps) {
  const router = useRouter();
  return (
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
      <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={4}>
        <StatCard
          icon={LuPackage}
          label="Total Products"
          value={productCount}
          sub={`${inStockCount} in stock`}
          color="primary"
          onClick={() => router.push('/products')}
        />
        <StatCard
          icon={LuShoppingCart}
          label="Orders This Month"
          value={analytics?.this_month.total_orders ?? '—'}
          sub={
            analytics
              ? `${formatCurrency(analytics.this_month.revenue)} revenue`
              : 'Loading...'
          }
          color="warning"
          onClick={() => router.push('/orders')}
        />
        <StatCard
          icon={LuTrendingUp}
          label="Profile Views"
          value="—"
          sub="Analytics soon"
          color="success"
          comingSoon
        />
        <StatCard
          icon={LuStar}
          label="Reviews"
          value="—"
          sub="Reviews soon"
          color="rating"
          comingSoon
        />
      </Grid>
    </Box>
  );
}
