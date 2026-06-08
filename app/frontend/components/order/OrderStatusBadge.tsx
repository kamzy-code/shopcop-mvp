import { Box, Text } from '@chakra-ui/react';
import { OrderStatus } from '@/app/_types';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; color: string; darkColor: string }
> = {
  PENDING:            { label: 'Pending',           bg: 'gray.subtle',    color: 'gray.600',    darkColor: 'gray.300'    },
  CONFIRMED:          { label: 'Confirmed',          bg: 'blue.subtle',    color: 'blue.600',    darkColor: 'blue.300'    },
  IN_PROGRESS:        { label: 'In Progress',        bg: 'teal.subtle',    color: 'teal.600',    darkColor: 'teal.300'    },
  READY_FOR_DISPATCH: { label: 'Ready to Ship',      bg: 'purple.subtle',  color: 'purple.600',  darkColor: 'purple.300'  },
  SHIPPED:            { label: 'Shipped',            bg: 'purple.subtle',  color: 'purple.700',  darkColor: 'purple.300'  },
  DELIVERED:          { label: 'Delivered',          bg: 'orange.subtle',  color: 'orange.700',  darkColor: 'orange.300'  },
  COMPLETED:          { label: 'Completed',          bg: 'success.subtle', color: 'success.fg',  darkColor: 'success.fg'  },
  REFUND_REQUESTED:   { label: 'Refund Requested',   bg: 'red.subtle',     color: 'red.700',     darkColor: 'red.300'     },
  REFUND_IN_PROGRESS: { label: 'Refund In Progress', bg: 'red.subtle',     color: 'red.600',     darkColor: 'red.300'     },
  REFUNDED:           { label: 'Refunded',           bg: 'gray.subtle',    color: 'gray.600',    darkColor: 'gray.300'    },
  RESOLVED:           { label: 'Resolved',           bg: 'success.subtle', color: 'success.fg',  darkColor: 'success.fg'  },
  CANCELLED:          { label: 'Cancelled',          bg: 'red.subtle',     color: 'red.600',     darkColor: 'red.300'     },
};

export function OrderStatusBadge({
  status,
  size = 'sm',
}: {
  status: OrderStatus;
  size?: 'xs' | 'sm';
}) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    bg: 'gray.subtle',
    color: 'gray.600',
    darkColor: 'gray.300',
  };
  return (
    <Box
      px={size === 'xs' ? 1.5 : 2}
      py={0.5}
      borderRadius="full"
      bg={cfg.bg}
      display="inline-flex"
      alignItems="center"
    >
      <Text
        textStyle={size === 'xs' ? '2xs' : 'xs'}
        fontWeight="medium"
        color={cfg.color}
        _dark={{ color: cfg.darkColor }}
      >
        {cfg.label}
      </Text>
    </Box>
  );
}
