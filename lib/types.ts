export interface User {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  venmo_handle: string | null;
  created_at?: string | null;
}

export interface ShoppingItem {
  id: string;
  household_id: string;
  name: string;
  category: string | null;
  requested_by: string | null;
  bounty_amount: number | null;
  status: 'pending' | 'purchased';
  purchased_by: string | null;
  purchased_at: string | null;
  created_at?: string | null;
}

export interface Transaction {
  id: string;
  household_id: string;
  payer_id: string;
  store_name: string | null;
  receipt_image_path: string | null;
  subtotal: number | null;
  tax_amount: number | null;
  tip_amount: number | null;
  final_total: number;
  created_at?: string | null;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  name: string;
  price: number;
  assigned_to_user_id: string | null;
  created_at?: string | null;
}

export interface DebtLedger {
  id: string;
  borrower_id: string;
  lender_id: string;
  amount: number;
  is_settled: boolean;
  transaction_id: string | null;
  created_at?: string | null;
}

export interface Household {
  id: string;
  name: string;
  join_code: string | null;
  created_at?: string | null;
}

export interface HouseholdMember {
  household_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at?: string | null;
}
