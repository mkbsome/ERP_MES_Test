import { AlertTriangle, AlertCircle, Info, Check } from 'lucide-react';
import clsx from 'clsx';
import type { Alert } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AlertListProps {
  alerts: Alert[];
  onAcknowledge?: (id: string) => void;
}

const alertConfig = {
  critical: {
    icon: AlertTriangle,
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    iconColor: 'text-red-400',
    label: '긴급',
    labelBg: 'bg-red-500',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    iconColor: 'text-yellow-400',
    label: '주의',
    labelBg: 'bg-yellow-500',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    label: '정보',
    labelBg: 'bg-blue-500',
  },
};

export default function AlertList({ alerts, onAcknowledge }: AlertListProps) {
  const unacknowledged = alerts.filter((a) => !a.acknowledged);
  const acknowledged = alerts.filter((a) => a.acknowledged);

  return (
    <div className="space-y-3">
      {/* Unacknowledged Alerts */}
      {unacknowledged.map((alert) => {
        const config = alertConfig[alert.type];
        const Icon = config.icon;

        return (
          <div
            key={alert.id}
            className={clsx(
              'rounded-lg border p-4',
              config.bgColor,
              config.borderColor,
              alert.type === 'critical' && 'animate-pulse-slow'
            )}
          >
            <div className="flex items-start gap-3">
              <div className={clsx('p-2 rounded-lg', config.bgColor)}>
                <Icon size={20} className={config.iconColor} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={clsx(
                      'text-xs font-medium px-2 py-0.5 rounded text-white',
                      config.labelBg
                    )}
                  >
                    {config.label}
                  </span>
                  <span className="text-xs text-slate-400">{alert.source}</span>
                </div>

                <h4 className="font-medium text-white mb-1">{alert.title}</h4>
                <p className="text-sm text-slate-400">{alert.message}</p>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(alert.timestamp), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>

                  {onAcknowledge && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      <Check size={14} />
                      확인
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Acknowledged Alerts (Collapsed) */}
      {acknowledged.length > 0 && (
        <div className="border-t border-slate-700 pt-3 mt-3">
          <p className="text-xs text-slate-500 mb-2">확인된 알림 ({acknowledged.length})</p>
          <div className="space-y-2">
            {acknowledged.slice(0, 3).map((alert) => {
              const config = alertConfig[alert.type];
              const Icon = config.icon;

              return (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50"
                >
                  <Icon size={16} className={config.iconColor} />
                  <span className="text-sm text-slate-400 flex-1 truncate">
                    {alert.title}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(alert.timestamp), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
