import { Box, Stack, Text } from '@chakra-ui/react';
import type { AdminUserDetail } from '@/app/_types';
import { InfoRow } from './InfoRow';

interface UserInfoCardProps {
  user: AdminUserDetail;
}

export function UserInfoCard({ user }: UserInfoCardProps) {
  return (
    <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
      <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
        User Information
      </Text>
      <Stack gap={3}>
        <InfoRow label="User ID" value={user.id} />
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Name" value={user.name} />
        <InfoRow label="Role" value={user.role} />
        <InfoRow label="Email Verified" value={user.email_verified} />
        <InfoRow label="Active" value={user.is_active} />
        <InfoRow label="Joined" value={new Date(user.created_at).toLocaleString('en-NG')} />
        <InfoRow
          label="Last Login"
          value={user.last_login_at ? new Date(user.last_login_at).toLocaleString('en-NG') : 'Never'}
        />
      </Stack>
    </Box>
  );
}
