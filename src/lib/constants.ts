
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
  to_be_paid_by_small_shop: 'To Be Paid by Small Shop',
  to_be_paid_by_big_shop: 'To Be Paid by Big Shop'
} as const;

export const MOVEMENT_STATUS = {
  dispatched: 'Dispatched',
  received: 'Received'
} as const;

export const DATE_FILTER_OPTIONS = {
  all: 'All Time',
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  this_month: 'This Month',
  this_year: 'This Year',
  custom: 'Custom Date Range'
} as const;
