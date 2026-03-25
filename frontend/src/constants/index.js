export const ROUTES = {
  HOME: '/',
  CHARITIES: '/charities',
  CHARITY_DETAIL: '/charities/:id',
  PRICING: '/pricing',
  HOW_IT_WORKS: '/how-it-works',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  DASHBOARD_SCORES: '/dashboard/scores',
  DASHBOARD_CHARITY: '/dashboard/charity',
  DASHBOARD_DRAWS: '/dashboard/draws',
  DASHBOARD_WINNINGS: '/dashboard/winnings',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_DRAWS: '/admin/draws',
  ADMIN_CHARITIES: '/admin/charities',
  ADMIN_WINNERS: '/admin/winners',
  ADMIN_REPORTS: '/admin/reports',
};

export const PLANS = {
  monthly: { name: 'Monthly', price: 9.99, interval: 'month' },
  yearly: { name: 'Yearly', price: 95.88, interval: 'year', monthlyEquiv: 7.99, savings: '20%' },
};

export const DRAW_TYPES = {
  random: 'Random Generation',
  algorithmic: 'Algorithmic (Frequency-Weighted)',
};

export const MATCH_LABELS = {
  5: '5-Number Match (Jackpot)',
  4: '4-Number Match',
  3: '3-Number Match',
};

export const VERIFICATION_STATUS = {
  pending: { label: 'Pending', color: 'text-yellow-500' },
  submitted: { label: 'Submitted', color: 'text-blue-500' },
  approved: { label: 'Approved', color: 'text-green-500' },
  rejected: { label: 'Rejected', color: 'text-red-500' },
};

export const PAYMENT_STATUS = {
  pending: { label: 'Pending', color: 'text-yellow-500' },
  paid: { label: 'Paid', color: 'text-green-500' },
};
