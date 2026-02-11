import { Check } from 'lucide-react';
import clsx from 'clsx';
import type { Scenario } from '../types/generator';

interface ScenarioCardProps {
  scenario: Scenario;
  selected: boolean;
  onToggle: () => void;
}

const aiUseCaseColors: Record<string, string> = {
  CHECK: 'bg-blue-100 text-blue-800',
  TREND: 'bg-green-100 text-green-800',
  COMPARE: 'bg-purple-100 text-purple-800',
  RANK: 'bg-yellow-100 text-yellow-800',
  FIND_CAUSE: 'bg-red-100 text-red-800',
  DETECT_ANOMALY: 'bg-orange-100 text-orange-800',
  PREDICT: 'bg-indigo-100 text-indigo-800',
  WHAT_IF: 'bg-pink-100 text-pink-800',
  REPORT: 'bg-gray-100 text-gray-800',
  NOTIFY: 'bg-teal-100 text-teal-800',
};

const triggerLabels: Record<string, string> = {
  scheduled: '예약',
  condition: '조건',
  random: '랜덤',
  always: '상시',
};

export default function ScenarioCard({ scenario, selected, onToggle }: ScenarioCardProps) {
  return (
    <div
      onClick={onToggle}
      className={clsx(
        'p-4 rounded-lg border-2 cursor-pointer transition-all',
        selected
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{scenario.name}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {scenario.description}
          </p>
        </div>
        <div
          className={clsx(
            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
            selected
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 text-gray-400'
          )}
        >
          {selected && <Check className="w-4 h-4" />}
        </div>
      </div>

      {/* Trigger Info */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">
          {triggerLabels[scenario.trigger_type] || scenario.trigger_type}
        </span>
        {scenario.start_date && (
          <span className="text-gray-500">
            {scenario.start_date}
            {scenario.duration_days && ` ~ ${scenario.duration_days}일`}
          </span>
        )}
      </div>

      {/* AI Use Cases */}
      <div className="mt-3 flex flex-wrap gap-1">
        {scenario.ai_use_cases.map(useCase => (
          <span
            key={useCase}
            className={clsx(
              'px-2 py-0.5 rounded text-xs font-medium',
              aiUseCaseColors[useCase] || 'bg-gray-100 text-gray-800'
            )}
          >
            {useCase}
          </span>
        ))}
      </div>
    </div>
  );
}
