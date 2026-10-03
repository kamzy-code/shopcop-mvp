import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../_lib/fetchWrapper';
import { JoinWaitlistInput, JoinWaitlistResponse } from '../_types';

export const useJoinWaitlist = () => {
  return useMutation({
    mutationFn: (params: JoinWaitlistInput) =>
      apiFetch<JoinWaitlistResponse>('/waitlist', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  });
};