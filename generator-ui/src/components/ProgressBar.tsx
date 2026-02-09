import clsx from 'clsx';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
  animated?: boolean;
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
  color = 'primary',
  animated = false,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };

  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between mb-1 text-sm">
          {label && <span className="text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-gray-500">{percentage.toFixed(1)}%</span>
          )}
        </div>
      )}
      <div
        className={clsx(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-300',
            colorClasses[color],
            animated && percentage < 100 && 'progress-striped'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
