'use client';
import {
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
} from '@chakra-ui/react';
import { Box, Flex, Text } from '@chakra-ui/react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoModal({ isOpen, onClose }: VideoModalProps) {
  return (
    <DialogRoot open={isOpen} onOpenChange={({ open }) => { if (!open) onClose(); }} placement="center" motionPreset="slide-in-bottom" size="xl">
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent maxW="720px" mx={4}>
          <DialogHeader>
            <DialogTitle textStyle="md">Watch Demo</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody pb={6}>
            <Flex
              w="full"
              aspectRatio={16 / 9}
              borderRadius="lg"
              bg="bg.subtle"
              align="center"
              justify="center"
              borderWidth="1px"
              borderColor="border"
            >
              <Box textAlign="center" color="fg.subtle">
                <Text textStyle="md" mb={1}>Demo Video</Text>
                <Text textStyle="xs">Coming soon</Text>
              </Box>
            </Flex>
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
