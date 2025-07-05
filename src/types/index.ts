
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
  item: 'shirt' | 'pant';
  destination: 'big_shop' | 'small_shop';
  sent_by: string;
  sent_by_name?: string;
  fare_payment: 'paid_by_sender' | 'to_be_paid_by_receiver';
  accompanying_person: string;
  auto_name: string;
  received_at?: string;
  received_by?: string;
  received_by_name?: string;
  condition_notes?: string;
  status: 'dispatched' | 'received';
  created_at: string;
  updated_at: string;
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
