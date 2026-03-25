import { getStatusColor } from '../../utils/helpers';

export default function Badge({ status, label, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(status)} ${className}`}>
      {label || status}
    </span>
  );
}
