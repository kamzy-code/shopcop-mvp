export const NotificationType = {
  VERIFICATION_APPROVED:   'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED:   'VERIFICATION_REJECTED',
  TIER_UPGRADED:           'TIER_UPGRADED',
  PAYMENT_PROOF_SUBMITTED: 'PAYMENT_PROOF_SUBMITTED',
  PAYMENT_CONFIRMED:       'PAYMENT_CONFIRMED',
  ORDER_STATUS_UPDATED:    'ORDER_STATUS_UPDATED',
  ORDER_CANCELLED:         'ORDER_CANCELLED',
  LOW_STOCK_ALERT:         'LOW_STOCK_ALERT',
  OUT_OF_STOCK:            'OUT_OF_STOCK',
  NEW_USER_SIGNUP:             'NEW_USER_SIGNUP',
  NEW_VERIFICATION_SUBMISSION: 'NEW_VERIFICATION_SUBMISSION',
  REFUND_REQUESTED:            'REFUND_REQUESTED',
  DELIVERY_DATE_EXPIRED:       'DELIVERY_DATE_EXPIRED',
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export interface CreateNotificationInput {
  user_id:      string;
  type:         NotificationType;
  title:        string;
  message:      string;
  entity_type?: string;
  entity_id?:   string;
  action_label?: string;
  action_url?:   string;
}
