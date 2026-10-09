export type WaitlistUserType = 'BUY' | 'SELL';
export type WaitlistStatus = 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'IGNORED';

export interface WaitlistEntry {
  id: string;
  email: string;
  phone: string;
  user_type: WaitlistUserType;
  trade_details: string;
  challenges: string[];
  open_to_chat: boolean;
  status: WaitlistStatus;
  contacted_at: string | null;
  contacted_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaitlistListResponse {
  entries: WaitlistEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UpdateWaitlistStatusInput {
  status: WaitlistStatus;
  notes?: string;
}