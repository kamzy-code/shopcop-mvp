'use client';
import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Flex,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import {
  LuArrowRight,
  LuBuilding2,
  LuCheck,
  LuClock,
  LuMapPin,
  LuIdCard,
  LuLock,
  LuShieldAlert,
  LuShieldCheck,
  LuStore,
  LuX,
} from 'react-icons/lu';
import { AppShell } from '@/components/shared/appShell';
import { TierBadge } from '@/components/shared/tierBadge';
import { SingleChipSelect } from '@/components/shared/chipSelect';
import { useGetVerifications, useProfileCompleteness } from '@/app/_hooks/vendor';
import { useVendorProfile } from '@/app/_hooks/vendor';
import { VerificationRecord, VerificationType } from '@/app/_types';

const TIER_THRESHOLDS = [
  { tier: 'TIER_0', min: 0, max: 9 },
  { tier: 'TIER_1', min: 10, max: 14 },
  { tier: 'TIER_2', min: 15, max: 22 },
  { tier: 'TIER_3', min: 23, max: 29 },
  { tier: 'TIER_4', min: 30, max: Infinity },
];

const BUSINESS_TYPE_OPTIONS = [
  { value: 'cac', label: 'CAC Certificate (+15 pts) — Registered company' },
  { value: 'smedan', label: 'SMEDAN Certificate (+8 pts) — Small/medium enterprise' },
];

function statusIcon(record: VerificationRecord | undefined, locked: boolean) {
  if (locked) return <LuLock size={16} />;
  if (!record) return <LuShieldAlert size={16} />;
  if (record.status === 'APPROVED') return <LuShieldCheck size={16} />;
  if (record.status === 'PENDING') return <LuClock size={16} />;
  return <LuX size={16} />;
}

function statusColor(record: VerificationRecord | undefined, locked: boolean) {
  if (locked || !record) return 'fg.muted';
  if (record.status === 'APPROVED') return 'success.fg';
  if (record.status === 'PENDING') return 'warning.fg';
  return 'red.600';
}

function statusLabel(record: VerificationRecord | undefined, locked: boolean) {
  if (locked) return 'Locked';
  if (!record) return 'Not Started';
  if (record.status === 'APPROVED') return 'Approved';
  if (record.status === 'PENDING') return 'Under Review';
  return 'Rejected';
}

function statusBg(record: VerificationRecord | undefined, locked: boolean) {
  if (locked || !record) return 'bg.subtle';
  if (record.status === 'APPROVED') return 'success.subtle';
  if (record.status === 'PENDING') return 'warning.subtle';
  return 'red.subtle';
}

function VerificationCard({
  icon: Icon,
  title,
  points,
  record,
  locked,
  children,
}: {
  icon: React.ElementType;
  title: string;
  points: string;
  record: VerificationRecord | undefined;
  locked: boolean;
  children?: React.ReactNode;
}) {
  const color = statusColor(record, locked);
  const bg = statusBg(record, locked);
  const label = statusLabel(record, locked);

  return (
    <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
      <Flex align="flex-start" justify="space-between" mb={3} gap={3}>
        <Flex align="center" gap={3}>
          <Flex
            w={10} h={10} borderRadius="lg" bg="primary.subtle"
            align="center" justify="center" color="primary.fg" flexShrink={0}
          >
            <Icon size={18} />
          </Flex>
          <Box>
            <Text fontWeight="semibold" color="fg" textStyle="sm">{title}</Text>
            <Text textStyle="xs" color="fg.muted">{points}</Text>
          </Box>
        </Flex>
        <Flex
          align="center"
          gap={1.5}
          px={2.5}
          py={1}
          borderRadius="full"
          bg={bg}
          color={color}
          flexShrink={0}
        >
          {statusIcon(record, locked)}
          <Text textStyle="xs" fontWeight="medium">{label}</Text>
        </Flex>
      </Flex>

      {record?.status === 'REJECTED' && record.rejection_reason && (
        <Box p={3} mb={3} borderRadius="md" bg="red.subtle" borderWidth="1px" borderColor="red.200">
          <Text textStyle="xs" color="red.600" fontWeight="medium">Rejection reason</Text>
          <Text textStyle="xs" color="red.500" mt={0.5}>{record.rejection_reason}</Text>
        </Box>
      )}

      {record?.status === 'PENDING' && (
        <Text textStyle="xs" color="fg.subtle" mb={3}>
          Submitted {new Date(record.submitted_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })} — awaiting review
        </Text>
      )}

      {record?.status === 'APPROVED' && (
        <Flex align="center" gap={1.5} mb={3}>
          <LuCheck size={12} color="var(--chakra-colors-success-600)" />
          <Text textStyle="xs" color="success.fg">
            Approved {record.reviewed_at
              ? new Date(record.reviewed_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })
              : ''}
          </Text>
        </Flex>
      )}

      {children}
    </Box>
  );
}

export default function VerificationsPage() {
  const router = useRouter();
  const { data: profile } = useVendorProfile();
  const { data: completeness } = useProfileCompleteness();
  const { data: verifications } = useGetVerifications();

  const [selectedBusinessType, setSelectedBusinessType] = useState('cac');

  const businessInfoComplete = completeness?.sections.business_info.completed ?? false;
  const points = profile?.verification_points ?? 0;
  const tier = profile?.current_tier ?? 'TIER_0';

  const nextThreshold = TIER_THRESHOLDS.find((t) => points < t.max && points >= t.min);
  const nextPoints = nextThreshold ? nextThreshold.max - points : 0;

  const verifMap: Record<string, VerificationRecord> = Object.fromEntries(
    (verifications ?? []).map((v) => [v.type, v])
  );

  const ninRecord = verifMap['NIN'];
  const addressRecord = verifMap['ADDRESS'];
  const businessRecord = verifMap['CAC'] ?? verifMap['SMEDAN'];

  const getCTA = (type: VerificationType, record: VerificationRecord | undefined) => {
    if (!businessInfoComplete) return null;
    if (!record) return null;
    if (record.status === 'REJECTED') {
      return (
        <Button
          colorPalette="red"
          variant="outline"
          size="sm"
          w="full"
          onClick={() => router.push(`/verifications/${type.toLowerCase()}/resubmit?id=${record.id}`)}
        >
          Resubmit <LuArrowRight size={14} />
        </Button>
      );
    }
    return null;
  };

  return (
    <AppShell>
      <Stack gap={6}>
        {/* Header */}
        <Flex align="flex-start" justify="space-between" flexWrap="wrap" gap={3}>
          <Stack gap={1}>
            <Flex align="center" gap={3}>
              <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
                Verifications
              </Heading>
              <TierBadge tier={tier} size="md" />
            </Flex>
            <Text color="fg.muted" textStyle="sm">
              Complete verifications to increase your tier and build buyer trust.
            </Text>
          </Stack>
          <Box p={4} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" textAlign="right">
            <Text textStyle="2xl" fontWeight="bold" color="fg">{points}</Text>
            <Text textStyle="xs" color="fg.muted">verification points</Text>
            {tier !== 'TIER_4' && (
              <Text textStyle="xs" color="primary.fg" mt={0.5}>
                {nextPoints} more to next tier
              </Text>
            )}
          </Box>
        </Flex>

        {/* Business info guard */}
        {!businessInfoComplete && (
          <Alert.Root status="warning" borderRadius="xl">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Business profile required</Alert.Title>
              <Alert.Description>
                Complete your business profile to unlock verification submissions.{' '}
                <Button
                  variant="plain"
                  size="xs"
                  color="warning.fg"
                  fontWeight="semibold"
                  p={0}
                  h="auto"
                  onClick={() => router.push('/onboarding/business-info')}
                >
                  Complete now →
                </Button>
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {/* NIN */}
        <VerificationCard
          icon={LuIdCard}
          title="NIN Verification"
          points="+10 points"
          record={ninRecord}
          locked={!businessInfoComplete}
        >
          {!ninRecord && businessInfoComplete && (
            <Button colorPalette="primary" variant="outline" size="sm" w="full"
              onClick={() => router.push('/onboarding/nin')}>
              Start Verification <LuArrowRight size={14} />
            </Button>
          )}
          {getCTA('NIN', ninRecord)}
        </VerificationCard>

        {/* Address */}
        <VerificationCard
          icon={LuMapPin}
          title="Address Verification"
          points="+5 points"
          record={addressRecord}
          locked={!businessInfoComplete}
        >
          {!addressRecord && businessInfoComplete && (
            <Button colorPalette="primary" variant="outline" size="sm" w="full"
              onClick={() => router.push('/verifications/address')}>
              Start Verification <LuArrowRight size={14} />
            </Button>
          )}
          {getCTA('ADDRESS', addressRecord)}
        </VerificationCard>

        {/* Business (CAC/SMEDAN) */}
        <VerificationCard
          icon={LuBuilding2}
          title="Business Verification"
          points="+15 pts (CAC) or +8 pts (SMEDAN)"
          record={businessRecord}
          locked={!businessInfoComplete}
        >
          {!businessRecord && businessInfoComplete && (
            <Stack gap={3}>
              <SingleChipSelect
                options={BUSINESS_TYPE_OPTIONS}
                value={selectedBusinessType}
                onChange={setSelectedBusinessType}
                direction="column"
              />
              <Button
                colorPalette="primary"
                variant="outline"
                size="sm"
                w="full"
                onClick={() => router.push(`/verifications/${selectedBusinessType}`)}
              >
                Start Verification <LuArrowRight size={14} />
              </Button>
            </Stack>
          )}
          {businessRecord?.status === 'REJECTED' && (
            <Button
              colorPalette="red"
              variant="outline"
              size="sm"
              w="full"
              onClick={() =>
                router.push(
                  `/verifications/${businessRecord.type.toLowerCase()}/resubmit?id=${businessRecord.id}`
                )
              }
            >
              <LuStore size={14} />
              Resubmit <LuArrowRight size={14} />
            </Button>
          )}
        </VerificationCard>
      </Stack>
    </AppShell>
  );
}
