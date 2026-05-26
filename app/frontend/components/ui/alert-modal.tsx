'use client';
import {
  Box,
  Button,
  DialogActionTrigger,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Flex,
  Text,
} from '@chakra-ui/react';
import { LuCircleX, LuInfo, LuTriangleAlert } from 'react-icons/lu';

type AlertType = 'error' | 'warning' | 'info';

const CONFIG: Record<AlertType, { icon: React.ElementType; color: string }> = {
  error:   { icon: LuCircleX,       color: 'red' },
  warning: { icon: LuTriangleAlert, color: 'warning' },
  info:    { icon: LuInfo,          color: 'primary' },
};

interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  type?: AlertType;
  actionLabel?: string;
}

export function AlertModal({
  open,
  onClose,
  title,
  description,
  type = 'error',
  actionLabel = 'Close',
}: AlertModalProps) {
  const { icon: Icon, color } = CONFIG[type];

  return (
    <DialogRoot
      open={open}
      onOpenChange={({ open: isOpen }) => { if (!isOpen) onClose(); }}
      size="sm"
    >
      <DialogBackdrop />
      <DialogPositioner alignItems="center" px={4}>
        <DialogContent w="full">
          <DialogHeader pb={0}>
            <Flex direction="column" align="center" w="full" gap={3} pt={2} textAlign="center">
              <Box
                w={16}
                h={16}
                borderRadius="full"
                bg={`${color}.subtle`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                color={`${color}.fg`}
              >
                <Icon size={32} />
              </Box>
              <DialogTitle textAlign="center">{title}</DialogTitle>
            </Flex>
            <DialogCloseTrigger />
          </DialogHeader>

          {description && (
            <DialogBody>
              <Text textStyle="sm" color="fg.muted" textAlign="center">
                {description}
              </Text>
            </DialogBody>
          )}

          <DialogFooter justifyContent="center">
            <DialogActionTrigger asChild>
              <Button colorPalette={color} size="md" variant="outline" onClick={onClose}>
                {actionLabel}
              </Button>
            </DialogActionTrigger>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
