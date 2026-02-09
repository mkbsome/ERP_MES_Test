import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';
import type { KPIData } from '../types';

interface KPICardProps {
  data: KPIData;
  icon?: React.ReactNode;
  colorClass?: string;
}

export default function KPICard({ data, icon, colorClass = 'from-slate-700 to-slate-800' }: KPICardProps) {
  const { label, value, unit, target, trend, trendValue } = data;

  const isOnTarget = target ? value >= target : true;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-green-400'
      : trend === 'down'
      ? 'text-red-400'
      : 'text-slate-400';

  return (
    <div className={clsx('rounded-xl p-5 bg-gradient-to-br border border-slate-700', colorClass)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            <span className="text-lg text-slate-400">{unit}</span>
          </div>

          {target !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-500">목표: {target.toLocaleString()}{unit}</span>
              <span
                className={clsx(
                  'text-xs font-medium px-1.5 py-0.5 rounded',
                  isOnTarget ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                )}
              >
                {isOnTarget ? '달성' : '미달'}
              </span>
            </div>
          )}

          {trendValue !== undefined && (
            <div className={clsx('flex items-center gap-1 mt-2', trendColor)}>
              <TrendIcon size={14} />
              <span className="text-xs font-medium">
                {trend === 'down' ? '-' : '+'}{trendValue}% vs 전일
              </span>
            </div>
          )}
        </div>

        {icon && (
          <div className="p-3 rounded-lg bg-slate-700/50">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
