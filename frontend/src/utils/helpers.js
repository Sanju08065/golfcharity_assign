import { format, formatDistanceToNow, differenceInSeconds } from 'date-fns';

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount || 0);
}

export function formatDate(date) {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy');
}

export function formatDateTime(date) {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy, HH:mm');
}

export function timeAgo(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getNextDrawDate() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  lastDay.setHours(20, 0, 0, 0);
  return lastDay;
}

export function getCountdown(targetDate) {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = differenceInSeconds(target, now);

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  return { days, hours, minutes, seconds };
}

export function getMatchLabel(matchType) {
  const labels = { 5: '5-Number Match', 4: '4-Number Match', 3: '3-Number Match' };
  return labels[matchType] || `${matchType}-Number Match`;
}

export function getStatusColor(status) {
  const colors = {
    active: 'bg-green-500/20 text-green-400',
    inactive: 'bg-gray-500/20 text-gray-400',
    lapsed: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-red-500/20 text-red-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    submitted: 'bg-blue-500/20 text-blue-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
    paid: 'bg-green-500/20 text-green-400',
    published: 'bg-green-500/20 text-green-400',
    draft: 'bg-yellow-500/20 text-yellow-400',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400';
}
