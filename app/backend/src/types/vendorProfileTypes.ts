import { Gender, PaymentModel, PrimaryContactMethod, RefundPolicyType } from "generated/prisma/enums.js";

/** Input for updating Step 1 vendor personal information. */
export interface PersonalInfoInput {
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: Gender;
  date_of_birth: Date;
  phone_number: string;
}

/** Input for updating Step 2 vendor business information. */
export interface BusinessInfoInput {
  business_name: string;
  business_description: string;
  state: string;
  city: string;
  street_address: string;
  landmark?: string;
  primary_category: string;
  subcategories: string[];
  bank_name: string;
  account_number: string;
  account_name: string;
  payment_models: PaymentModel[];
  instagram_handle?: string;
  tiktok_handle?: string;
  facebook_url?: string;
  whatsapp_number?: string;
  primary_contact?: PrimaryContactMethod;
  refund_policy_type: RefundPolicyType;
  refund_duration_days?: number;
  refund_conditions?: string[];
  refund_custom_notes?: string;
}
