'use client';
import { Box, Button, Flex, Grid, Heading, Stack, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import {
  LuArrowRight,
  LuBuilding2,
  LuMapPin,
  LuPackage,
  LuPlus,
  LuShieldAlert,
  LuShieldCheck,
  LuShoppingCart,
  LuStar,
  LuStore,
  LuTrendingUp,
} from 'react-icons/lu';
import { AppShell } from '@/components/shared/appShell';
import { TierBadge } from '@/components/shared/tierBadge';
import { useAuthStore } from '@/app/_store/authStore';
import {
  useProducts,
  useProfileCompleteness,
  useGetVerifications,
  useVendorProfile,
} from '@/app/_hooks/vendor';
import FullPageSpinner from '@/components/shared/fullPageSpinner';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'primary',
  comingSoon = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  comingSoon?: boolean;
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

function ProfileCompletenessBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'primary';
  return (
    <Box>
      <Flex justify="space-between" mb={1}>
        <Text textStyle="xs" color="fg.muted">
          Profile completeness
        </Text>
        <Text textStyle="xs" fontWeight="semibold" color={`${color}.fg`}>
          {pct}%
        </Text>
      </Flex>
      <Box h="6px" borderRadius="full" bg="bg.subtle" overflow="hidden">
        <Box
          h="full"
          borderRadius="full"
          bg={`${color}.500`}
          w={`${pct}%`}
          transition="width 0.4s ease"
        />
      </Box>
    </Box>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: products } = useProducts();
  const { data: completeness } = useProfileCompleteness();
  const { data: verifications } = useGetVerifications();
  const { data: profile } = useVendorProfile();

  const productCount = products?.length ?? 0;
  const inStockCount = products?.filter((p) => p.stock_status === 'IN_STOCK').length ?? 0;
  const firstName = user?.name?.split(' ')[0] || profile?.first_name || 'Vendor';
  const profileSetupPct =
    [
      completeness?.sections.personal_info.completed,
      completeness?.sections.business_info.completed,
    ].filter(Boolean).length * 50;
  const isProfileSetupComplete =
    (completeness?.sections.personal_info.completed ?? false) &&
    (completeness?.sections.business_info.completed ?? false);

  const verifMap = Object.fromEntries((verifications ?? []).map((v) => [v.type, v]));

  const verificationItems = [
    {
      label: 'Email Verified',
      done: user?.email_verified ?? false,
      status: undefined as string | undefined,
      href: undefined as string | undefined,
    },
    {
      label: 'Personal Info',
      done: completeness?.sections.personal_info.completed ?? false,
      status: undefined,
      href: '/onboarding/personal-info',
    },
    {
      label: 'Business Info',
      done: completeness?.sections.business_info.completed ?? false,
      status: undefined,
      href: '/onboarding/business-info',
    },
    {
      label: 'NIN Verified',
      done: completeness?.sections.nin_verification.completed ?? false,
      status: verifMap['NIN']?.status,
      href:
        verifMap['NIN']?.status === 'REJECTED'
          ? `/verifications/nin/resubmit?id=${verifMap['NIN'].id}`
          : '/onboarding/nin',
    },
    {
      label: 'Address Verified',
      done: completeness?.sections.address_verification.completed ?? false,
      status: verifMap['ADDRESS']?.status,
      href:
        verifMap['ADDRESS']?.status === 'REJECTED'
          ? `/verifications/address/resubmit?id=${verifMap['ADDRESS'].id}`
          : '/verifications/address',
    },
    {
      label: 'Business Verified',
      done: completeness?.sections.business_verification.completed ?? false,
      status: verifMap['CAC']?.status ?? verifMap['SMEDAN']?.status,
      href: '/verifications',
    },
  ];

  if (!profile) return <FullPageSpinner />;

  return (
    <AppShell>
      <Stack gap={8}>
        {/* Welcome header */}
        <Flex align="center" justify="space-between" flexWrap="wrap" gap={4}>
          <Stack gap={1}>
            <Flex align="center" gap={3}>
              <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
                Welcome back, {firstName} 👋
              </Heading>
              {profile?.current_tier && <TierBadge tier={profile.current_tier} />}
            </Flex>
            <Text color="fg.muted" textStyle="sm">
              Here is what is happening with your store today.
            </Text>
          </Stack>
          <Button colorPalette="primary" size="md" onClick={() => router.push('/products/new')}>
            <LuPlus />
            Add Product
          </Button>
        </Flex>

        {/* Onboarding banner — only shown when profile setup is incomplete */}
        {!isProfileSetupComplete && (
          <Box
            p={5}
            bg="primary.subtle"
            borderWidth="1.5px"
            borderColor="primary.200"
            borderRadius="xl"
          >
            <Flex align="center" gap={4} flexWrap="wrap">
              <Flex
                w={10}
                h={10}
                borderRadius="lg"
                bg="primary.500"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <LuShieldAlert size={18} color="white" />
              </Flex>
              <Box flex={1} minW="200px">
                <Text fontWeight="semibold" color="primary.fg" textStyle="sm">
                  Complete your vendor profile
                </Text>
                <Text color="primary.fg" textStyle="xs" opacity={0.85} mt={0.5}>
                  Verify your identity and business details to get a verified badge and build buyer
                  trust.
                </Text>
                <Box mt={2}>
                  <ProfileCompletenessBar pct={profileSetupPct} />
                </Box>
              </Box>
              <Button
                colorPalette="primary"
                size="sm"
                flexShrink={0}
                onClick={() => router.push('/onboarding')}
              >
                Complete Setup <LuArrowRight size={14} />
              </Button>
            </Flex>
          </Box>
        )}

        {/* Stats */}
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
            />
            <StatCard
              icon={LuShoppingCart}
              label="Orders"
              value="—"
              sub="Tracking soon"
              color="warning"
              comingSoon
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

        {/* Bottom grid */}
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
          {/* Verification status */}
          <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
            <Flex align="center" justify="space-between" mb={4}>
              <Flex align="center" gap={3}>
                <LuShieldCheck size={18} color="var(--chakra-colors-primary-600)" />
                <Text fontWeight="semibold" color="fg" textStyle="sm">
                  Verification Status
                </Text>
              </Flex>
              <Button
                variant="ghost"
                size="xs"
                color="primary.fg"
                px={2}
                h="auto"
                py={0.5}
                onClick={() => router.push('/verifications')}
              >
                View all
              </Button>
            </Flex>
            <Stack gap={3}>
              {verificationItems.map((item) => (
                <Flex key={item.label} align="center" gap={3}>
                  <Flex
                    w={5}
                    h={5}
                    borderRadius="full"
                    bg={
                      item.done
                        ? 'success.500'
                        : item.status === 'REJECTED'
                          ? 'red.500'
                          : item.status === 'PENDING'
                            ? 'warning.400'
                            : 'bg.subtle'
                    }
                    borderWidth={item.done || item.status ? 0 : '2px'}
                    borderColor="border"
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    {item.done && <LuShieldCheck size={10} color="white" />}
                    {!item.done && item.status === 'PENDING' && (
                      <LuShieldAlert size={10} color="white" />
                    )}
                    {!item.done && item.status === 'REJECTED' && (
                      <LuShieldAlert size={10} color="white" />
                    )}
                  </Flex>
                  <Text textStyle="sm" color={item.done ? 'fg' : 'fg.muted'} flex={1}>
                    {item.label}
                  </Text>
                  <Box>
                    {item.done ? (
                      <Text textStyle="xs" fontWeight="medium" color="success.fg">
                        Done
                      </Text>
                    ) : item.status === 'PENDING' ? (
                      <Text textStyle="xs" fontWeight="medium" color="warning.fg">
                        Pending
                      </Text>
                    ) : item.status === 'REJECTED' ? (
                      <Button
                        variant="ghost"
                        size="xs"
                        color="red.600"
                        px={2}
                        h="auto"
                        py={0.5}
                        onClick={() => item.href && router.push(item.href)}
                      >
                        Resubmit
                      </Button>
                    ) : item.href ? (
                      <Button
                        variant="ghost"
                        size="xs"
                        color="primary.fg"
                        px={2}
                        h="auto"
                        py={0.5}
                        onClick={() => router.push(item.href!)}
                      >
                        Start
                      </Button>
                    ) : (
                      <Text textStyle="xs" fontWeight="medium" color="fg.subtle">
                        —
                      </Text>
                    )}
                  </Box>
                </Flex>
              ))}
            </Stack>
          </Box>

          {/* Quick actions */}
          <Box>
            <Text
              textStyle="xs"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={4}
            >
              Quick Actions
            </Text>
            <Grid templateColumns="1fr 1fr" gap={3}>
              <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
                <Flex
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg="primary.subtle"
                  align="center"
                  justify="center"
                  mb={4}
                  color="primary.fg"
                >
                  <LuPackage size={18} />
                </Flex>
                <Text fontWeight="semibold" color="fg" textStyle="sm" mb={1}>
                  Add Product
                </Text>
                <Text color="fg.muted" textStyle="xs" mb={4}>
                  List a new product in your store.
                </Text>
                <Button
                  size="sm"
                  colorPalette="primary"
                  variant="outline"
                  w="full"
                  onClick={() => router.push('/products/new')}
                >
                  Add now
                </Button>
              </Box>

              <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
                <Flex
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg="primary.subtle"
                  align="center"
                  justify="center"
                  mb={4}
                  color="primary.fg"
                >
                  <LuBuilding2 size={18} />
                </Flex>
                <Text fontWeight="semibold" color="fg" textStyle="sm" mb={1}>
                  CAC Verification
                </Text>
                <Text color="fg.muted" textStyle="xs" mb={4}>
                  Verify your business registration.
                </Text>
                <Button
                  size="sm"
                  colorPalette="primary"
                  variant="outline"
                  w="full"
                  onClick={() => router.push('/verifications/cac')}
                >
                  Submit
                </Button>
              </Box>

              <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
                <Flex
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg="primary.subtle"
                  align="center"
                  justify="center"
                  mb={4}
                  color="primary.fg"
                >
                  <LuStore size={18} />
                </Flex>
                <Text fontWeight="semibold" color="fg" textStyle="sm" mb={1}>
                  SMEDAN
                </Text>
                <Text color="fg.muted" textStyle="xs" mb={4}>
                  Register as an SME for higher tiers.
                </Text>
                <Button
                  size="sm"
                  colorPalette="primary"
                  variant="outline"
                  w="full"
                  onClick={() => router.push('/verifications/smedan')}
                >
                  Submit
                </Button>
              </Box>

              <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
                <Flex
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg="primary.subtle"
                  align="center"
                  justify="center"
                  mb={4}
                  color="primary.fg"
                >
                  <LuMapPin size={18} />
                </Flex>
                <Text fontWeight="semibold" color="fg" textStyle="sm" mb={1}>
                  Address Proof
                </Text>
                <Text color="fg.muted" textStyle="xs" mb={4}>
                  Confirm your business location.
                </Text>
                <Button
                  size="sm"
                  colorPalette="primary"
                  variant="outline"
                  w="full"
                  onClick={() => router.push('/verifications/address')}
                >
                  Submit
                </Button>
              </Box>
            </Grid>
          </Box>
        </Grid>

        {/* Recent products */}
        <Box>
          <Flex align="center" justify="space-between" mb={4}>
            <Text
              textStyle="xs"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Recent Products
            </Text>
            {productCount > 0 && (
              <Button
                variant="ghost"
                size="xs"
                color="primary.fg"
                onClick={() => router.push('/products')}
              >
                View all <LuArrowRight size={12} />
              </Button>
            )}
          </Flex>

          {productCount === 0 ? (
            <Box
              p={10}
              bg="bg.panel"
              borderWidth="1px"
              borderColor="border"
              borderRadius="xl"
              textAlign="center"
            >
              <Flex
                w={14}
                h={14}
                borderRadius="full"
                bg="primary.subtle"
                align="center"
                justify="center"
                mx="auto"
                mb={4}
                color="primary.fg"
              >
                <LuPackage size={24} />
              </Flex>
              <Text fontWeight="semibold" color="fg" mb={1}>
                No products yet
              </Text>
              <Text color="fg.muted" textStyle="sm" mb={4}>
                Add your first product to start selling on ShopCop.
              </Text>
              <Button colorPalette="primary" size="md" onClick={() => router.push('/products/new')}>
                <LuPlus />
                Add Your First Product
              </Button>
            </Box>
          ) : (
            <Grid
              templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
              gap={4}
            >
              {products?.slice(0, 6).map((product) => (
                <Box
                  key={product.id}
                  p={4}
                  bg="bg.panel"
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="xl"
                >
                  <Box w="full" h="140px" bg="bg.subtle" borderRadius="lg" mb={3} overflow="hidden">
                    {product.media?.[0] ? (
                      <img
                        src={product.media[0].media_url}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Flex h="full" align="center" justify="center" color="fg.subtle">
                        <LuPackage size={32} />
                      </Flex>
                    )}
                  </Box>
                  <Text fontWeight="medium" color="fg" textStyle="sm" truncate>
                    {product.name}
                  </Text>
                  <Flex align="center" justify="space-between" mt={1}>
                    <Text color="primary.fg" fontWeight="bold" textStyle="sm">
                      ₦{product.price.toLocaleString()}
                    </Text>
                    <Box
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      bg={product.stock_status === 'IN_STOCK' ? 'success.subtle' : 'red.subtle'}
                    >
                      <Text
                        textStyle="2xs"
                        fontWeight="medium"
                        color={product.stock_status === 'IN_STOCK' ? 'success.fg' : 'red.600'}
                      >
                        {product.stock_status === 'IN_STOCK' ? 'In Stock' : 'Out of Stock'}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </Grid>
          )}
        </Box>
      </Stack>
    </AppShell>
  );
}
