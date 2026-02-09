/**
 * 공통 페이지 헤더 컴포넌트
 * 페이지 제목과 액션 버튼 영역
 */
import { Plus, Download, Upload, Trash2, RefreshCw, Printer } from 'lucide-react';
import clsx from 'clsx';

export interface ActionButton {
  label: string;
  icon?: 'add' | 'download' | 'upload' | 'delete' | 'refresh' | 'print';
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ActionButton[];
  children?: React.ReactNode;
}

const iconMap = {
  add: Plus,
  download: Download,
  upload: Upload,
  delete: Trash2,
  refresh: RefreshCw,
  print: Printer,
};

export default function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>

      <div className="flex items-center gap-2">
        {children}
        {actions?.map((action, index) => {
          const Icon = action.icon ? iconMap[action.icon] : null;
          const variantClass = {
            primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
            secondary: 'bg-slate-700 border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500',
            danger: 'bg-red-600 text-white hover:bg-red-700',
          }[action.variant || 'secondary'];

          return (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variantClass
              )}
            >
              {Icon && <Icon size={16} />}
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
