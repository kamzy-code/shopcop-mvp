import { Box, Stack, Text } from '@chakra-ui/react';
import { InfoRow } from './InfoRow';

interface BuyerProfile {
  id: string;
  name: string | null;
  created_at: string;
}

interface BuyerProfileCardProps {
  buyerProfile: BuyerProfile;
}

export function BuyerProfileCard({ buyerProfile }: BuyerProfileCardProps) {
  return (
    <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
      <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
        Buyer Profile
      </Text>
      <Stack gap={3}>
        <InfoRow label="Profile ID" value={buyerProfile.id} />
        <InfoRow label="Display Name" value={buyerProfile.name} />
        <InfoRow label="Created" value={new Date(buyerProfile.created_at).toLocaleString('en-NG')} />
      </Stack>
    </Box>
  );
}
