import {
  AlertTriangle,
  AlertOctagon,
  TrendingDown,
  Wrench,
  Zap,
  Clock,
  RefreshCw,
  PackageMinus,
  XCircle,
  FileX,
  Truck,
  UserMinus,
  Clock4,
  Ban,
  LucideIcon
} from 'lucide-react';
import clsx from 'clsx';

interface Props {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  icon: string;
  onClick: () => void;
}

const iconMap: Record<string, LucideIcon> = {
  AlertTriangle,
  AlertOctagon,
  TrendingDown,
  Wrench,
  Zap,
  Clock,
  RefreshCw,
  PackageMinus,
  XCircle,
  FileX,
  Truck,
  UserMinus,
  Clock4,
  Ban
};

const severityStyles = {
  low: {
    bg: 'bg-blue-50 hover:bg-blue-100',
    border: 'border-blue-200 hover:border-blue-300',
    icon: 'bg-blue-100 text-blue-600',
    badge: 'bg-blue-100 text-blue-700'
  },
  medium: {
    bg: 'bg-yellow-50 hover:bg-yellow-100',
    border: 'border-yellow-200 hover:border-yellow-300',
    icon: 'bg-yellow-100 text-yellow-600',
    badge: 'bg-yellow-100 text-yellow-700'
  },
  high: {
    bg: 'bg-orange-50 hover:bg-orange-100',
    border: 'border-orange-200 hover:border-orange-300',
    icon: 'bg-orange-100 text-orange-600',
    badge: 'bg-orange-100 text-orange-700'
  },
  critical: {
    bg: 'bg-red-50 hover:bg-red-100',
    border: 'border-red-200 hover:border-red-300',
    icon: 'bg-red-100 text-red-600',
    badge: 'bg-red-100 text-red-700'
  }
};

export default function QuickActionCard({ id: _id, name, description, severity, icon, onClick }: Props) {
  const Icon = iconMap[icon] || AlertTriangle;
  const styles = severityStyles[severity];

  return (
    <button
      onClick={onClick}
      className={clsx(
        'p-4 rounded-xl border-2 text-left transition-all duration-200',
        'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
        styles.bg,
        styles.border
      )}
    >
      <div className="flex items-start gap-3">
        <div className={clsx('p-2.5 rounded-lg', styles.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{description}</p>
        </div>
      </div>
    </button>
  );
}
