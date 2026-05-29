import { Box, Text } from '@chakra-ui/react';
import { TransactionStatus } from '@/app/_types';

const STATUS_CONFIG: Record<TransactionStatus, { label: string; bg: string; color: string }> = {
  PENDING:           { label: 'Pending',           bg: 'gray.subtle',    color: 'gray.600'    },
  CONFIRMED:         { label: 'Confirmed',          bg: 'blue.subtle',    color: 'blue.600'    },
  IN_PROGRESS:       { label: 'In Progress',        bg: 'teal.subtle',    color: 'teal.600'    },
  READY_FOR_DISPATCH:{ label: 'Ready to Ship',      bg: 'purple.subtle',  color: 'purple.600'  },
  SHIPPED:           { label: 'Shipped',            bg: 'purple.subtle',  color: 'purple.700'  },
  DELIVERED:         { label: 'Delivered',          bg: 'orange.subtle',  color: 'orange.700'  },
  COMPLETED:         { label: 'Completed',          bg: 'success.subtle', color: 'success.fg'  },
  REFUND_REQUESTED:  { label: 'Refund Requested',   bg: 'red.subtle',     color: 'red.700'     },
  REFUND_IN_PROGRESS:{ label: 'Refund In Progress', bg: 'red.subtle',     color: 'red.600'     },
  REFUNDED:          { label: 'Refunded',           bg: 'gray.subtle',    color: 'gray.600'    },
  RESOLVED:          { label: 'Resolved',           bg: 'success.subtle', color: 'success.fg'  },
  CANCELLED:         { label: 'Cancelled',          bg: 'red.subtle',     color: 'red.600'     },
};

export function TransactionStatusBadge({ status, size = 'sm' }: { status: TransactionStatus; size?: 'xs' | 'sm' }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: 'gray.subtle', color: 'gray.600' };
  return (
    <Box
      px={size === 'xs' ? 1.5 : 2}
      py={0.5}
      borderRadius="full"
      bg={cfg.bg}
      display="inline-flex"
      alignItems="center"
    >
      <Text textStyle={size === 'xs' ? '2xs' : 'xs'} fontWeight="medium" color={cfg.color}>
        {cfg.label}
      </Text>
    </Box>
  );
}
