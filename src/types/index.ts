
export interface Staff {
  id: string;
  name: string;
  role: 'godown_staff' | 'shop_staff' | 'admin';
  location: 'godown' | 'big_shop' | 'small_shop';
  created_at: string;
  updated_at?: string;
}

export interface GoodsMovement {
  id: string;
  dispatch_date: string;
  bundles_count: number;
  item: 'shirt' | 'pant' | 'both';
  shirt_bundles?: number;
  pant_bundles?: number;
  destination: 'big_shop' | 'small_shop' | 'both';
  sent_by: string;
  sent_by_name?: string;
  fare_payment: 'paid_by_sender' | 'to_be_paid_by_small_shop' | 'to_be_paid_by_big_shop';
  fare_display_msg?: string;
  fare_payee_tag?: string;
  item_summary_display?: string;
  accompanying_person: string;
  auto_name: string;
  received_at?: string;
  received_by?: string;
  received_by_name?: string;
  condition_notes?: string;
  status: 'dispatched' | 'received';
  created_at: string;
  updated_at: string;
  last_edited_at?: string;
  last_edited_by?: string;
  is_editable?: boolean;
}

export interface MovementSummary {
  location: string;
  today: number;
  week: number;
  month: number;
}

export interface AppUser {
  id: string;
  email: string;
  role: 'admin' | 'godown_manager' | 'small_shop_manager' | 'big_shop_manager';
  created_at: string;
}

export interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}
