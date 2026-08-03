import axios from 'axios';

/** Maps a failed upload's error (Cloudinary response, network failure, etc.) to a plain-language message. */
export function getUploadErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Network issue — check your connection and try again.';
    }

    const status = error.response.status;
    const cloudinaryMessage: string | undefined = error.response.data?.error?.message;
    const normalized = (cloudinaryMessage || '').toLowerCase();

    if (normalized.includes('file size too large') || normalized.includes('exceeds maximum')) {
      return 'File is too large. Please choose a smaller file.';
    }
    if (
      normalized.includes('unsupported') ||
      normalized.includes('invalid image') ||
      normalized.includes('invalid file') ||
      normalized.includes('not a valid')
    ) {
      return 'Unsupported file format. Please upload a different file.';
    }
    if (status === 401 || status === 403) {
      return 'Upload not authorized. Please refresh the page and try again.';
    }
    if (status >= 500) {
      return 'Upload service is temporarily unavailable. Please try again shortly.';
    }
    if (cloudinaryMessage) return cloudinaryMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Upload failed. Please try again.';
}
