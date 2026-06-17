'use client';
import { useRef, useState } from 'react';
import { Avatar, Box, Field, Spinner, Text } from '@chakra-ui/react';
import { LuCamera, LuTrash2 } from 'react-icons/lu';
import Image from 'next/image';
import { useDeleteMedia, useUploadPublicMedia } from '@/app/_hooks/upload';
import { useUpdateProfilePhoto } from '@/app/_hooks/vendor';
import { toaster } from '@/components/ui/toaster';

interface ProfilePhotoUploadProps {
  variant: 'avatar' | 'field';
  initials?: string;
  profilePhotoUrl?: string | null;
  profilePhotoPublicId?: string | null;
}

export function ProfilePhotoUpload({
  variant,
  initials = 'V',
  profilePhotoUrl = null,
  profilePhotoPublicId = null,
}: ProfilePhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadPublicMedia = useUploadPublicMedia();
  const updateProfilePhoto = useUpdateProfilePhoto();
  const deleteMedia = useDeleteMedia();
  const isUploading = uploadPublicMedia.isPending || updateProfilePhoto.isPending || deleteMedia.isPending;
  const [menuOpen, setMenuOpen] = useState(false);
  const [fieldPreview, setFieldPreview] = useState<string | null>(null);
  const [lastUploadedPublicId, setLastUploadedPublicId] = useState<string | null>(null);

  const displayUrl = fieldPreview ?? profilePhotoUrl;
  const effectivePublicId = lastUploadedPublicId ?? profilePhotoPublicId;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (variant === 'field') {
      const localUrl = URL.createObjectURL(file);
      setFieldPreview(localUrl);
    }

    try {
      const result = await uploadPublicMedia.mutateAsync({ file, setUploadProgress: () => {} });
      setLastUploadedPublicId(result.publicId);
      await updateProfilePhoto.mutateAsync({
        profile_photo_url: result.url,
        profile_photo_public_id: result.publicId,
      });
    } catch {
      if (variant === 'field') setFieldPreview(null);
      toaster.create({ title: 'Failed to upload photo', type: 'error' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMenuOpen(false);
  };

  const removeFromCloudinaryAndProfile = async () => {
    try {
      if (effectivePublicId) {
        await deleteMedia.mutateAsync(effectivePublicId);
      }
    } catch {
      // Cloudinary deletion failed — still clear the profile URL
    }
    await updateProfilePhoto.mutateAsync({
      profile_photo_url: '',
      profile_photo_public_id: '',
    });
    setLastUploadedPublicId(null);
  };

  const handleRemovePhoto = async () => {
    await removeFromCloudinaryAndProfile();
    setMenuOpen(false);
    if (variant === 'field') setFieldPreview(null);
  };

  const handleFieldRemove = () => {
    if (isUploading) return;
    removeFromCloudinaryAndProfile();
    setFieldPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={variant === 'field' ? 'image/jpeg,image/png,image/webp' : 'image/*'}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      {variant === 'avatar' && (
        <Box position="relative" flexShrink={0}>
          <Box
            w={14}
            h={14}
            borderRadius="full"
            cursor="pointer"
            position="relative"
            onClick={() => setMenuOpen((prev) => !prev)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setMenuOpen((prev) => !prev); }}
            _hover={{ opacity: 0.85 }}
          >
            <Avatar.Root size="full" w="100%" h="100%">
              <Avatar.Fallback bg="primary.subtle" color="primary.fg" fontWeight="bold" fontSize="xl">
                {initials}
              </Avatar.Fallback>
              {profilePhotoUrl && <Avatar.Image src={profilePhotoUrl} />}
            </Avatar.Root>
            {isUploading && (
              <Box
                position="absolute"
                inset={0}
                borderRadius="full"
                bg="black/40"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Spinner size="sm" color="white" />
              </Box>
            )}
          </Box>
          {menuOpen && (
            <>
              <Box position="fixed" inset={0} zIndex={999} onClick={() => setMenuOpen(false)} />
              <Box
                position="absolute"
                top="100%"
                left="50%"
                transform="translateX(-50%)"
                mt={1}
                zIndex={1000}
                bg="bg.panel"
                borderWidth="1px"
                borderColor="border"
                borderRadius="md"
                shadow="lg"
                minW="160px"
                py={1}
              >
                <Box
                  as="button"
                  display="flex"
                  alignItems="center"
                  gap={2}
                  w="full"
                  px={3}
                  py={2}
                  textStyle="sm"
                  _hover={{ bg: 'bg.subtle' }}
                  opacity={isUploading ? 0.5 : 1}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                  <LuCamera />
                  Upload Photo
                </Box>
                {(profilePhotoUrl || effectivePublicId) && (
                  <Box
                    as="button"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    w="full"
                    px={3}
                    py={2}
                    textStyle="sm"
                    color="fg.error"
                    _hover={{ bg: 'bg.subtle' }}
                    opacity={isUploading ? 0.5 : 1}
                    onClick={() => { if (!isUploading) handleRemovePhoto(); }}
                  >
                    <LuTrash2 />
                    Remove Photo
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>
      )}

      {variant === 'field' && (
        <Field.Root>
          <Field.Label color="fg">Profile Photo</Field.Label>
          <Text textStyle="xs" color="fg.muted" mb={2}>
            Optional. Upload a photo to help buyers recognize your business.
          </Text>
          {displayUrl ? (
            <Box position="relative" display="inline-block" w="120px">
              <Image
                src={displayUrl}
                alt="Profile photo preview"
                height={120}
                width={120}
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '9999px',
                  display: 'block',
                  border: '1px solid var(--chakra-colors-border)',
                }}
              />
              {isUploading && (
                <Box
                  position="absolute"
                  inset={0}
                  borderRadius="full"
                  bg="black/40"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Spinner size="sm" color="white" />
                </Box>
              )}
              <Box
                as="button"
                position="absolute"
                top="-2"
                right="-2"
                w={5}
                h={5}
                borderRadius="full"
                bg="red.500"
                color="white"
                fontSize="xs"
                lineHeight="1"
                display="flex"
                alignItems="center"
                justifyContent="center"
                opacity={isUploading ? 0.5 : 1}
                pointerEvents={isUploading ? 'none' : 'auto'}
                onClick={handleFieldRemove}
                aria-label="Remove photo"
              >
                ×
              </Box>
            </Box>
          ) : (
            <Box
              as="button"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={2}
              w="full"
              p={4}
              borderWidth="2px"
              borderStyle="dashed"
              borderColor="border"
              borderRadius="lg"
              cursor={isUploading ? 'not-allowed' : 'pointer'}
              opacity={isUploading ? 0.6 : 1}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              _hover={isUploading ? {} : { borderColor: 'primary.500', bg: 'primary.subtle' }}
            >
              <Text textStyle="sm" color="fg.muted">
                {isUploading ? 'Uploading…' : 'Click to upload profile photo'}
              </Text>
            </Box>
          )}
        </Field.Root>
      )}
    </>
  );
}
