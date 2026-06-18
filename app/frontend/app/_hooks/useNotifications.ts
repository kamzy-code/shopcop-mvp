import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../_lib/fetchWrapper';

// ============================================
// TYPES
// ============================================

export interface Notification {
  id:           string;
  user_id:      string;
  type:         string;
  title:        string;
  message:      string;
  entity_type:  string | null;
  entity_id:    string | null;
  action_label: string | null;
  action_url:   string | null;
  read:         boolean;
  read_at:      string | null;
  created_at:   string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unread_count:  number;
}

interface NewNotificationsResponse {
  notifications: Notification[];
}

// ============================================
// HOOKS
// ============================================

/** Fetch the latest 20 notifications + unread count for the authenticated user. */
export const useNotifications = () =>
  useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiFetch<NotificationsResponse>('/notifications');
      return res.data;
    },
    staleTime: 30 * 1000,
  });

/**
 * Poll for new unread notifications every 30 seconds.
 * Automatically pauses when the browser tab is hidden and resumes on focus.
 * Returns only notifications created after the previous poll timestamp.
 */
export const useNotificationPolling = () => {
  const lastCheckedRef = useRef<string>(new Date().toISOString());

  const [isVisible, setIsVisible] = useState(() =>
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  useEffect(() => {
    const handleVisibility = () => setIsVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return useQuery<NewNotificationsResponse>({
    queryKey: ['notifications', 'poll'],
    queryFn: async () => {
      const since = lastCheckedRef.current;
      lastCheckedRef.current = new Date().toISOString();
      const res = await apiFetch<NewNotificationsResponse>(
        `/notifications/new?since=${encodeURIComponent(since)}`
      );
      return res.data;
    },
    refetchInterval: isVisible ? 30_000 : false,
    enabled: isVisible,
    refetchOnWindowFocus: true,
  });
};

/** Mark a single notification as read and invalidate the notifications cache. */
export const useMarkRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      apiFetch(`/notifications/${notificationId}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

/** Mark all notifications as read and invalidate the notifications cache. */
export const useMarkAllRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
