/**
 * 공통 폼 모달 컴포넌트
 * 등록/수정 폼을 모달로 표시
 */
import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox' | 'radio' | 'password';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  validation?: (value: any) => string | undefined;
  span?: 1 | 2;  // grid column span
}

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FormField[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  loading?: boolean;
  mode?: 'create' | 'edit' | 'view';
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function FormModal({
  open,
  onClose,
  title,
  fields,
  initialValues = {},
  onSubmit,
  loading = false,
  mode = 'create',
  width = 'md',
}: FormModalProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setValues(initialValues);
      setErrors({});
    }
  }, [open, initialValues]);

  if (!open) return null;

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear error when value changes
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = values[field.name];

      if (field.required && (value === undefined || value === null || value === '')) {
        newErrors[field.name] = `${field.label}은(는) 필수 항목입니다.`;
      } else if (field.validation) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.name] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submit error:', error);
    }
  };

  const widthClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[width];

  const isReadOnly = mode === 'view';

  const renderField = (field: FormField) => {
    const baseClass =
      'w-full px-3 py-2 bg-slate-700/50 border rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    const errorClass = errors[field.name] ? 'border-red-500' : 'border-slate-600';

    const fieldDisabled = field.disabled || isReadOnly;
    const value = values[field.name] ?? '';

    switch (field.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={fieldDisabled}
            className={clsx(baseClass, errorClass)}
          >
            <option value="">{field.placeholder || '선택하세요'}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={fieldDisabled}
            readOnly={field.readOnly}
            rows={4}
            className={clsx(baseClass, errorClass, 'resize-none')}
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              disabled={fieldDisabled}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
            />
            <span className="text-sm text-slate-300">{field.placeholder}</span>
          </label>
        );

      case 'radio':
        return (
          <div className="flex items-center gap-4">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.name}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  disabled={fieldDisabled}
                  className="w-4 h-4 border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                />
                <span className="text-sm text-slate-300">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={fieldDisabled}
            className={clsx(baseClass, errorClass)}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={fieldDisabled}
            readOnly={field.readOnly}
            className={clsx(baseClass, errorClass)}
          />
        );

      case 'password':
        return (
          <input
            type="password"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={fieldDisabled}
            className={clsx(baseClass, errorClass)}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={fieldDisabled}
            readOnly={field.readOnly}
            className={clsx(baseClass, errorClass)}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className={clsx('relative w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl', widthClass)}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {fields.map((field) => (
                <div
                  key={field.name}
                  className={clsx('flex flex-col gap-1', field.span === 2 && 'col-span-2')}
                >
                  <label className="text-sm font-medium text-slate-300">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                  {errors[field.name] && (
                    <p className="text-xs text-red-400">{errors[field.name]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            >
              {isReadOnly ? '닫기' : '취소'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 rounded-lg text-sm text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {mode === 'create' ? '등록' : '저장'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
