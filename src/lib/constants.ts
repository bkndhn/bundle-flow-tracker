
export const LOCATIONS = {
  godown: 'Godown',
  big_shop: 'Big Shop',
  small_shop: 'Small Shop'
} as const;

export const ROLES = {
  godown_staff: 'Godown Staff',
  shop_staff: 'Shop Staff',
  admin: 'Admin'
} as const;

export const FARE_PAYMENT_OPTIONS = {
  paid_by_sender: 'Paid by Sender',
  to_be_paid_by_receiver: 'To Be Paid by Receiver'
} as const;

export const MOVEMENT_STATUS = {
  dispatched: 'Dispatched',
  received: 'Received'
} as const;
