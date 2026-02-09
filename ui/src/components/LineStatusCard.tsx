import { Activity, Pause, AlertTriangle, Wrench } from 'lucide-react';
import clsx from 'clsx';
import type { ProductionLine } from '../types';

interface LineStatusCardProps {
  line: ProductionLine;
  onClick?: () => void;
}

const statusConfig = {
  running: {
    label: '가동중',
    icon: Activity,
    bgColor: 'bg-green-500',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
  },
  idle: {
    label: '대기',
    icon: Pause,
    bgColor: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
  },
  down: {
    label: '정지',
    icon: AlertTriangle,
    bgColor: 'bg-red-500',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
  },
  maintenance: {
    label: '보전',
    icon: Wrench,
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
  },
};

export default function LineStatusCard({ line, onClick }: LineStatusCardProps) {
  const status = statusConfig[line.status];
  const StatusIcon = status.icon;

  const oeeColor =
    line.currentOEE >= 0.85
      ? 'text-green-400'
      : line.currentOEE >= 0.75
      ? 'text-yellow-400'
      : 'text-red-400';

  const defectColor =
    line.todayDefectRate <= 0.015
      ? 'text-green-400'
      : line.todayDefectRate <= 0.025
      ? 'text-yellow-400'
      : 'text-red-400';

  return (
    <div
      className={clsx(
        'card cursor-pointer hover:border-slate-600 transition-all',
        status.borderColor,
        line.status === 'down' && 'animate-pulse-slow'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">{line.lineCode}</h3>
          <p className="text-xs text-slate-400">{line.lineName}</p>
        </div>
        <div className={clsx('flex items-center gap-2 px-2.5 py-1 rounded-full', `${status.bgColor}/20`)}>
          <div className={clsx('w-2 h-2 rounded-full', status.bgColor, line.status === 'running' && 'animate-pulse')} />
          <span className={clsx('text-xs font-medium', status.textColor)}>{status.label}</span>
        </div>
      </div>

      {/* Current Product */}
      <div className="mb-4">
        <p className="text-xs text-slate-500 mb-1">현재 생산</p>
        <p className="text-sm font-medium text-white">{line.currentProduct || '-'}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-slate-500 mb-1">OEE</p>
          <p className={clsx('text-lg font-bold', oeeColor)}>
            {line.status === 'running' || line.status === 'idle'
              ? `${(line.currentOEE * 100).toFixed(0)}%`
              : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">생산량</p>
          <p className="text-lg font-bold text-white">
            {line.todayProduction.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">불량률</p>
          <p className={clsx('text-lg font-bold', defectColor)}>
            {(line.todayDefectRate * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Progress Bar (OEE) */}
      {(line.status === 'running' || line.status === 'idle') && (
        <div className="mt-4">
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-500',
                line.currentOEE >= 0.85
                  ? 'bg-green-500'
                  : line.currentOEE >= 0.75
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              )}
              style={{ width: `${line.currentOEE * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
