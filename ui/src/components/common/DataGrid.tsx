/**
 * 공통 데이터 그리드 컴포넌트
 * CRUD 화면에서 사용하는 테이블 컴포넌트
 */
import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react';
import clsx from 'clsx';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

interface DataGridProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  loading?: boolean;
  emptyMessage?: string;
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (rows: T[]) => void;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  sortable?: boolean;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
}

export default function DataGrid<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  loading = false,
  emptyMessage = '데이터가 없습니다.',
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  onRowClick,
  onRowDoubleClick,
  pagination,
  sortable = true,
  defaultSort,
}: DataGridProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    defaultSort || null
  );

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    if (!sortable) return;

    setSortConfig((prev) => {
      if (prev?.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  const isRowSelected = (row: T) => {
    return selectedRows.some((r) => r[keyField] === row[keyField]);
  };

  const handleRowSelect = (row: T) => {
    if (!onSelectionChange) return;

    const isSelected = isRowSelected(row);
    if (isSelected) {
      onSelectionChange(selectedRows.filter((r) => r[keyField] !== row[keyField]));
    } else {
      onSelectionChange([...selectedRows, row]);
    }
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    if (selectedRows.length === sortedData.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...sortedData]);
    }
  };

  const getValue = (row: T, key: string): any => {
    const keys = key.split('.');
    let value: any = row;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Table */}
      <div className="flex-1 overflow-auto border border-slate-700 rounded-lg">
        <table className="w-full">
          <thead className="bg-slate-800 sticky top-0">
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-3 border-b border-slate-700">
                  <input
                    type="checkbox"
                    checked={sortedData.length > 0 && selectedRows.length === sortedData.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={clsx(
                    'px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider border-b border-slate-700',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.sortable !== false && sortable && 'cursor-pointer hover:text-white select-none'
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(String(col.key))}
                >
                  <div
                    className={clsx(
                      'flex items-center gap-1',
                      col.align === 'center' && 'justify-center',
                      col.align === 'right' && 'justify-end'
                    )}
                  >
                    {col.header}
                    {col.sortable !== false && sortable && (
                      <span className="text-slate-500">
                        {sortConfig?.key === col.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )
                        ) : (
                          <ArrowUpDown size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-12 text-center"
                >
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
                  <p className="mt-2 text-sm text-slate-400">데이터 로딩 중...</p>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-12 text-center text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={String(row[keyField])}
                  className={clsx(
                    'border-b border-slate-700/50 transition-colors',
                    isRowSelected(row)
                      ? 'bg-emerald-500/10'
                      : 'hover:bg-slate-800/50',
                    (onRowClick || onRowDoubleClick) && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row)}
                  onDoubleClick={() => onRowDoubleClick?.(row)}
                >
                  {selectable && (
                    <td className="w-10 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={isRowSelected(row)}
                        onChange={() => handleRowSelect(row)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={clsx(
                        'px-4 py-2 text-sm',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right'
                      )}
                    >
                      {col.render
                        ? col.render(getValue(row, String(col.key)), row, rowIndex)
                        : getValue(row, String(col.key)) ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>
              총 <span className="font-medium text-white">{pagination.total}</span>건
            </span>
            {pagination.onPageSizeChange && (
              <select
                value={pagination.pageSize}
                onChange={(e) => pagination.onPageSizeChange?.(Number(e.target.value))}
                className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}개씩
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(1)}
              disabled={pagination.page === 1}
              className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-colors"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="px-3 text-sm text-slate-400">
              <span className="font-medium text-white">{pagination.page}</span>
              {' / '}
              {Math.ceil(pagination.total / pagination.pageSize) || 1}
            </span>

            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => pagination.onPageChange(Math.ceil(pagination.total / pagination.pageSize))}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-colors"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
