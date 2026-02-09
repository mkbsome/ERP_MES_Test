/**
 * ERP 품목관리 페이지
 * 원자재, 반제품, 완제품 마스터 관리
 */
import { useState, useMemo } from 'react';
import { PageHeader, SearchForm, DataGrid, FormModal } from '../../../components/common';
import type { SearchField } from '../../../components/common/SearchForm';
import type { Column } from '../../../components/common/DataGrid';
import type { FormField } from '../../../components/common/FormModal';

// 품목 타입
interface Item {
  id: number;
  item_code: string;
  item_name: string;
  item_type: string;
  item_type_name: string;
  category: string;
  unit: string;
  spec: string;
  standard_cost: number;
  selling_price: number;
  safety_stock: number;
  lead_time: number;
  is_active: boolean;
  created_at: string;
}

// Mock 데이터
const mockItems: Item[] = [
  { id: 1, item_code: 'RM-PCB-001', item_name: 'PCB 기판 (4층)', item_type: 'RAW', item_type_name: '원자재', category: 'PCB', unit: 'EA', spec: '100x80mm, FR-4', standard_cost: 1500, selling_price: 0, safety_stock: 10000, lead_time: 7, is_active: true, created_at: '2024-01-01' },
  { id: 2, item_code: 'RM-IC-001', item_name: 'MCU IC (ARM Cortex)', item_type: 'RAW', item_type_name: '원자재', category: 'IC', unit: 'EA', spec: 'STM32F4, LQFP64', standard_cost: 5500, selling_price: 0, safety_stock: 5000, lead_time: 14, is_active: true, created_at: '2024-01-01' },
  { id: 3, item_code: 'RM-CAP-001', item_name: '적층세라믹콘덴서', item_type: 'RAW', item_type_name: '원자재', category: 'PASSIVE', unit: 'EA', spec: '0603, 100nF', standard_cost: 15, selling_price: 0, safety_stock: 100000, lead_time: 5, is_active: true, created_at: '2024-01-01' },
  { id: 4, item_code: 'RM-RES-001', item_name: '칩저항', item_type: 'RAW', item_type_name: '원자재', category: 'PASSIVE', unit: 'EA', spec: '0402, 10K', standard_cost: 5, selling_price: 0, safety_stock: 200000, lead_time: 5, is_active: true, created_at: '2024-01-01' },
  { id: 5, item_code: 'WIP-MB-001', item_name: 'SMT 조립 메인보드 (미검사)', item_type: 'WIP', item_type_name: '재공품', category: 'BOARD', unit: 'EA', spec: 'MB-SM-001 중간', standard_cost: 35000, selling_price: 0, safety_stock: 500, lead_time: 1, is_active: true, created_at: '2024-01-01' },
  { id: 6, item_code: 'FG-MB-SM-001', item_name: '스마트폰 메인보드 A타입', item_type: 'FINISHED', item_type_name: '완제품', category: 'BOARD', unit: 'EA', spec: '120x65mm, 8Layer', standard_cost: 42000, selling_price: 55000, safety_stock: 1000, lead_time: 3, is_active: true, created_at: '2024-01-01' },
  { id: 7, item_code: 'FG-MB-SM-002', item_name: '스마트폰 메인보드 B타입', item_type: 'FINISHED', item_type_name: '완제품', category: 'BOARD', unit: 'EA', spec: '110x60mm, 6Layer', standard_cost: 38000, selling_price: 48000, safety_stock: 800, lead_time: 3, is_active: true, created_at: '2024-01-01' },
  { id: 8, item_code: 'FG-ECU-001', item_name: '자동차 ECU 모듈', item_type: 'FINISHED', item_type_name: '완제품', category: 'MODULE', unit: 'EA', spec: '차량용, IP67', standard_cost: 85000, selling_price: 120000, safety_stock: 500, lead_time: 5, is_active: true, created_at: '2024-01-01' },
  { id: 9, item_code: 'FG-LED-001', item_name: 'LED 드라이버 보드', item_type: 'FINISHED', item_type_name: '완제품', category: 'BOARD', unit: 'EA', spec: '정전류, 350mA', standard_cost: 12000, selling_price: 18000, safety_stock: 2000, lead_time: 2, is_active: true, created_at: '2024-01-01' },
  { id: 10, item_code: 'FG-IOT-001', item_name: 'IoT 통신모듈', item_type: 'FINISHED', item_type_name: '완제품', category: 'MODULE', unit: 'EA', spec: 'WiFi+BLE, FCC인증', standard_cost: 28000, selling_price: 42000, safety_stock: 1500, lead_time: 4, is_active: true, created_at: '2024-01-01' },
];

// 검색 필드 정의
const searchFields: SearchField[] = [
  {
    name: 'item_type',
    label: '품목유형',
    type: 'select',
    options: [
      { value: 'RAW', label: '원자재' },
      { value: 'WIP', label: '재공품' },
      { value: 'FINISHED', label: '완제품' },
    ],
    placeholder: '전체',
  },
  {
    name: 'category',
    label: '분류',
    type: 'select',
    options: [
      { value: 'PCB', label: 'PCB' },
      { value: 'IC', label: 'IC' },
      { value: 'PASSIVE', label: '수동소자' },
      { value: 'BOARD', label: '보드' },
      { value: 'MODULE', label: '모듈' },
    ],
    placeholder: '전체',
  },
  {
    name: 'item_code',
    label: '품목코드',
    type: 'text',
    placeholder: '품목코드',
  },
  {
    name: 'item_name',
    label: '품목명',
    type: 'text',
    placeholder: '품목명',
  },
  {
    name: 'is_active',
    label: '사용여부',
    type: 'select',
    options: [
      { value: 'true', label: '사용' },
      { value: 'false', label: '미사용' },
    ],
    placeholder: '전체',
  },
];

// 테이블 컬럼 정의
const columns: Column<Item>[] = [
  { key: 'item_code', header: '품목코드', width: '120px' },
  { key: 'item_name', header: '품목명', width: '200px' },
  {
    key: 'item_type_name',
    header: '유형',
    width: '80px',
    align: 'center',
    render: (value, row) => {
      const colors: Record<string, string> = {
        RAW: 'bg-blue-500/20 text-blue-400',
        WIP: 'bg-yellow-500/20 text-yellow-400',
        FINISHED: 'bg-emerald-500/20 text-emerald-400',
      };
      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[row.item_type]}`}>{value}</span>;
    }
  },
  { key: 'category', header: '분류', width: '80px', align: 'center' },
  { key: 'spec', header: '규격', width: '150px' },
  { key: 'unit', header: '단위', width: '60px', align: 'center' },
  { key: 'standard_cost', header: '표준원가', width: '100px', align: 'right', render: (v) => `₩${v?.toLocaleString()}` },
  {
    key: 'selling_price',
    header: '판매가',
    width: '100px',
    align: 'right',
    render: (v) => v > 0 ? `₩${v?.toLocaleString()}` : '-'
  },
  { key: 'safety_stock', header: '안전재고', width: '90px', align: 'right', render: (v) => v?.toLocaleString() },
  { key: 'lead_time', header: 'L/T(일)', width: '70px', align: 'center' },
  {
    key: 'is_active',
    header: '사용',
    width: '60px',
    align: 'center',
    render: (value) => (
      <span className={value ? 'text-emerald-400' : 'text-slate-500'}>
        {value ? '●' : '○'}
      </span>
    ),
  },
];

// 폼 필드 정의
const formFields: FormField[] = [
  { name: 'item_code', label: '품목코드', type: 'text', required: true },
  { name: 'item_name', label: '품목명', type: 'text', required: true },
  { name: 'item_type', label: '품목유형', type: 'select', required: true, options: [
    { value: 'RAW', label: '원자재' },
    { value: 'WIP', label: '재공품' },
    { value: 'FINISHED', label: '완제품' },
  ] },
  { name: 'category', label: '분류', type: 'select', required: true, options: [
    { value: 'PCB', label: 'PCB' },
    { value: 'IC', label: 'IC' },
    { value: 'PASSIVE', label: '수동소자' },
    { value: 'BOARD', label: '보드' },
    { value: 'MODULE', label: '모듈' },
  ] },
  { name: 'unit', label: '단위', type: 'select', required: true, options: [
    { value: 'EA', label: 'EA' },
    { value: 'KG', label: 'KG' },
    { value: 'M', label: 'M' },
    { value: 'L', label: 'L' },
  ] },
  { name: 'spec', label: '규격', type: 'text', fullWidth: true },
  { name: 'standard_cost', label: '표준원가', type: 'number', required: true },
  { name: 'selling_price', label: '판매가', type: 'number' },
  { name: 'safety_stock', label: '안전재고', type: 'number', required: true },
  { name: 'lead_time', label: '리드타임(일)', type: 'number', required: true },
  { name: 'is_active', label: '사용여부', type: 'checkbox' },
];

export default function ItemPage() {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const filteredData = useMemo(() => {
    return mockItems.filter((item) => {
      if (searchParams.item_type && item.item_type !== searchParams.item_type) return false;
      if (searchParams.category && item.category !== searchParams.category) return false;
      if (searchParams.item_code && !item.item_code.toLowerCase().includes(searchParams.item_code.toLowerCase())) return false;
      if (searchParams.item_name && !item.item_name.toLowerCase().includes(searchParams.item_name.toLowerCase())) return false;
      if (searchParams.is_active !== undefined && searchParams.is_active !== '') {
        if (searchParams.is_active === 'true' && !item.is_active) return false;
        if (searchParams.is_active === 'false' && item.is_active) return false;
      }
      return true;
    });
  }, [searchParams]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const handleSearch = (values: Record<string, any>) => {
    setSearchParams(values);
    setPage(1);
  };

  const handleAdd = () => {
    setModalMode('create');
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = () => {
    if (selectedRows.length === 1) {
      setModalMode('edit');
      setEditingItem(selectedRows[0]);
      setIsModalOpen(true);
    }
  };

  const handleDelete = () => {
    if (selectedRows.length > 0) {
      if (confirm(`선택한 ${selectedRows.length}개 항목을 삭제하시겠습니까?`)) {
        console.log('Delete:', selectedRows);
        setSelectedRows([]);
      }
    }
  };

  const handleSave = (data: Record<string, any>) => {
    console.log('Save:', data);
    setIsModalOpen(false);
    setSelectedRows([]);
  };

  // 요약
  const summary = useMemo(() => {
    const raw = filteredData.filter(i => i.item_type === 'RAW').length;
    const wip = filteredData.filter(i => i.item_type === 'WIP').length;
    const finished = filteredData.filter(i => i.item_type === 'FINISHED').length;
    return { total: filteredData.length, raw, wip, finished };
  }, [filteredData]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="품목관리"
        description="원자재, 재공품, 완제품 마스터를 관리합니다."
        actions={[
          { label: '삭제', icon: 'delete', variant: 'danger', onClick: handleDelete, disabled: selectedRows.length === 0 },
          { label: '수정', icon: 'edit', onClick: handleEdit, disabled: selectedRows.length !== 1 },
          { label: '신규등록', icon: 'add', variant: 'primary', onClick: handleAdd },
        ]}
      />

      <SearchForm fields={searchFields} onSearch={handleSearch} />

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">전체 품목</p>
          <p className="text-2xl font-bold text-white">{summary.total}개</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-300">원자재</p>
          <p className="text-2xl font-bold text-blue-400">{summary.raw}개</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-sm text-yellow-300">재공품</p>
          <p className="text-2xl font-bold text-yellow-400">{summary.wip}개</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <p className="text-sm text-emerald-300">완제품</p>
          <p className="text-2xl font-bold text-emerald-400">{summary.finished}개</p>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <DataGrid
          columns={columns}
          data={paginatedData}
          keyField="id"
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          pagination={{
            page,
            pageSize,
            total: filteredData.length,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title={modalMode === 'create' ? '품목 등록' : modalMode === 'edit' ? '품목 수정' : '품목 상세'}
        fields={formFields}
        initialData={editingItem || undefined}
        mode={modalMode}
      />
    </div>
  );
}
