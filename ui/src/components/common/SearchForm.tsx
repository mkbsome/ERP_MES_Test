/**
 * 공통 검색 폼 컴포넌트
 * CRUD 화면 상단의 검색 조건 영역
 */
import { useState, useCallback } from 'react';
import { Search, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

export interface SearchField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'checkbox' | 'number';
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: any;
  width?: string;
}

interface SearchFormProps {
  fields: SearchField[];
  onSearch: (values: Record<string, any>) => void;
  onReset?: () => void;
  loading?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export default function SearchForm({
  fields,
  onSearch,
  onReset,
  loading = false,
  collapsible = false,
  defaultExpanded = true,
}: SearchFormProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [values, setValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    fields.forEach((f) => {
      initial[f.name] = f.defaultValue ?? '';
    });
    return initial;
  });

  const handleChange = useCallback((name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(values);
  };

  const handleReset = () => {
    const resetValues: Record<string, any> = {};
    fields.forEach((f) => {
      resetValues[f.name] = f.defaultValue ?? '';
    });
    setValues(resetValues);
    onReset?.();
  };

  const renderField = (field: SearchField) => {
    const baseClass =
      'px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors';

    switch (field.type) {
      case 'select':
        return (
          <select
            value={values[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={clsx(baseClass, field.width || 'w-40')}
          >
            <option value="">{field.placeholder || '전체'}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={values[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={clsx(baseClass, field.width || 'w-40')}
          />
        );

      case 'dateRange':
        return (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={values[`${field.name}_from`] || ''}
              onChange={(e) => handleChange(`${field.name}_from`, e.target.value)}
              className={clsx(baseClass, 'w-36')}
            />
            <span className="text-slate-400">~</span>
            <input
              type="date"
              value={values[`${field.name}_to`] || ''}
              onChange={(e) => handleChange(`${field.name}_to`, e.target.value)}
              className={clsx(baseClass, 'w-36')}
            />
          </div>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values[field.name] || false}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
            />
            <span className="text-sm text-slate-300">{field.placeholder}</span>
          </label>
        );

      case 'number':
        return (
          <input
            type="number"
            value={values[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={clsx(baseClass, field.width || 'w-32')}
          />
        );

      default:
        return (
          <input
            type="text"
            value={values[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={clsx(baseClass, field.width || 'w-48')}
          />
        );
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg">
      {/* Header */}
      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          <span>검색 조건</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}

      {/* Form */}
      {(!collapsible || expanded) && (
        <form onSubmit={handleSubmit} className={clsx(collapsible && 'border-t border-slate-700')}>
          <div className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              {fields.map((field) => (
                <div key={field.name} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-400">{field.label}</label>
                  {renderField(field)}
                </div>
              ))}

              {/* Buttons */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
                >
                  <RotateCcw size={16} />
                  초기화
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 rounded-lg text-sm text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Search size={16} />
                  검색
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
