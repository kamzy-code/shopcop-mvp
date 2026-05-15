'use client';
import { useRef, useState } from 'react';
import { Box, Button, Flex, Stack, Text } from '@chakra-ui/react';
import { LuUpload, LuX } from 'react-icons/lu';
import Image from 'next/image';

interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File | null) => void;
  previewUrl?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

export function FileUpload({
  accept = 'image/jpeg,image/png',
  maxSizeMB = 2,
  onFileSelect,
  previewUrl,
  label = 'Upload file',
  hint = 'JPG or PNG, max 2MB',
  disabled = false,
}: FileUploadProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(previewUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File must be under ${maxSizeMB}MB`);
      return;
    }

    const acceptedTypes = accept.split(',').map((t) => t.trim());
    const isAccepted = acceptedTypes.some(
      (t) => file.type === t || (t.endsWith('/*') && file.type.startsWith(t.replace('/*', '')))
    );
    if (!isAccepted) {
      setError(`Invalid file type. Please upload ${hint}`);
      return;
    }

    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    onFileSelect(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalPreview(null);
    setError(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Stack gap={2}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleChange}
        disabled={disabled}
      />

      {localPreview ? (
        <Box position="relative" display="inline-block" w="120px">
          <Image
            src={localPreview}
            alt="Preview"
            height={120}
            width={120}
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'cover',
              borderRadius: '12px',
              display: 'block',
              border: '1px solid var(--chakra-colors-border)',
            }}
          />
          <Button
            position="absolute"
            top="-2"
            right="-2"
            size="xs"
            colorPalette="red"
            borderRadius="full"
            w={5}
            h={5}
            minW={5}
            p={0}
            onClick={handleRemove}
            aria-label="Remove file"
          >
            <LuX size={10} />
          </Button>
        </Box>
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap={3}
          p={6}
          borderWidth="2px"
          borderStyle="dashed"
          borderColor={isDragging ? 'primary.500' : error ? 'red.400' : 'border'}
          borderRadius="xl"
          bg={isDragging ? 'primary.subtle' : 'transparent'}
          cursor={disabled ? 'not-allowed' : 'pointer'}
          opacity={disabled ? 0.6 : 1}
          transition="all 0.15s"
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          _hover={disabled ? {} : { borderColor: 'primary.500', bg: 'primary.subtle' }}
        >
          <Flex
            w={10}
            h={10}
            borderRadius="lg"
            bg="primary.subtle"
            align="center"
            justify="center"
            color="primary.fg"
          >
            <LuUpload size={18} />
          </Flex>
          <Stack gap={0.5} textAlign="center">
            <Text textStyle="sm" fontWeight="medium" color="fg">
              {label}
            </Text>
            <Text textStyle="xs" color="fg.muted">
              {hint}
            </Text>
          </Stack>
        </Flex>
      )}

      {error && (
        <Text textStyle="xs" color="red.500">
          {error}
        </Text>
      )}
    </Stack>
  );
}
