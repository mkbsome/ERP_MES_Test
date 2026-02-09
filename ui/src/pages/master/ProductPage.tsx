/**
 * 품목정보관리 페이지
 * 제품/자재/반제품 등록 및 관리
 */
import { useState, useMemo } from 'react';
import { PageHeader, SearchForm, DataGrid, FormModal } from '../../components/common';
import type { SearchField } from '../../components/common/SearchForm';
import type { Column } from '../../components/common/DataGrid';
import type { FormField } from '../../components/common/FormModal';

// 품목 타입
interface Product {
  id: number;
  product_code: string;
  product_name: string;
  product_type: string;
  product_group: string;
  unit: string;
  spec: string;
  standard_price: number;
  safety_stock: number;
  lead_time: number;
  use_yn: string;
  description?: string;
  created_at: string;
}

// Mock 데이터
const mockProducts: Product[] = [
  { id: 1, product_code: 'MB-SM-001', product_name: '스마트폰 메인보드 A타입', product_type: 'PRODUCT', product_group: 'SMARTPHONE', unit: 'EA', spec: '120x60mm, 8Layer', standard_price: 45000, safety_stock: 500, lead_time: 3, use_yn: 'Y', created_at: '2024-01-01' },
  { id: 2, product_code: 'MB-SM-002', product_name: '스마트폰 메인보드 B타입', product_type: 'PRODUCT', product_group: 'SMARTPHONE', unit: 'EA', spec: '130x65mm, 10Layer', standard_price: 52000, safety_stock: 300, lead_time: 3, use_yn: 'Y', created_at: '2024-01-01' },
  { id: 3, product_code: 'PB-LED-001', product_name: 'LED 드라이버 보드', product_type: 'PRODUCT', product_group: 'LED', unit: 'EA', spec: '80x40mm, 4Layer', standard_price: 12000, safety_stock: 1000, lead_time: 2, use_yn: 'Y', created_at: '2024-01-01' },
  { id: 4, product_code: 'ECU-AUTO-001', product_name: '자동차 ECU 보드', product_type: 'PRODUCT', product_group: 'AUTOMOTIVE', unit: 'EA', spec: '150x100mm, 6Layer', standard_price: 85000, safety_stock: 200, lead_time: 5, use_yn: 'Y', created_at: '2024-01-01' },
  { id: 5, product_code: 'IOT-MOD-001', product_name: 'IoT 통신 모듈', product_type: 'PRODUCT', product_group: 'IOT', unit: 'EA', spec: '30x20mm, 2Layer', standard_price: 8500, safety_stock: 2000, lead_time: 2, use_yn: 'Y', created_at: '2024-01-01' },
  { id: 6, product_code: 'IC-MCU-001', product_name: 'MCU ARM Cortex-M4', product_type: 'MATERIAL', product_group: 'IC', unit: 'EA', spec: 'STM32F4, QFP-64', standard_price: 5500, safety_stock: 5000, lead_time: 14, use_yn: 'Y', created_at: '2024-01-01' },
  { id: 7, product_code: 'IC-MEM-001', product_name: 'Flash Memory 256MB', product_type: 'MATERIAL', product_group: 'IC', unit: 'EA', spec: 'SPI NOR Flash', standard_price: 2200, safety_stock: 10000, lead_time: 14, use_yn: 'Y', created_at: '2024-01-01' },
  { id: 8, product_code: 'CAP-CER-001', product_name: '적층 세라믹 콘덴서 0402', product_type: 'MATERIAL', product_group: 'PASSIVE', unit: 'EA', spec: '0402, 100nF, 16V', standard_price: 5, safety_stock: 100000, lead_time: 7, use_yn: 'Y', created_at: '2024-01-01' },
  { id: 9, product_code: 'RES-SMD-001', product_name: 'SMD 저항 0402', product_type: 'MATERIAL', product_group: 'PASSIVE', unit: 'EA', spec: '0402, 10K, 1%', standard_price: 2, safety_stock: 200000, lead_time: 7, use_yn: 'Y', created_at: '2024-01-01' },
  { id: 10, product_code: 'PCB-RAW-001', product_name: 'FR-4 원판', product_type: 'MATERIAL', product_group: 'PCB', unit: 'EA', spec: '1200x1000mm, 1.6t', standard_price: 45000, safety_stock: 100, lead_time: 10, use_yn: 'Y', created_at: '2024-01-01' },
];

// 검색 필드 정의
const searchFields: SearchField[] = [
  {
    name: 'product_type',
    label: '품목유형',
    type: 'select',
    options: [
      { value: 'PRODUCT', label: '완제품' },
      { value: 'SEMI', label: '반제품' },
      { value: 'MATERIAL', label: '원자재' },
    ],
    placeholder: '전체',
  },
  {
    name: 'product_group',
    label: '품목군',
    type: 'select',
    options: [
      { value: 'SMARTPHONE', label: '스마트폰' },
      { value: 'LED', label: 'LED' },
      { value: 'AUTOMOTIVE', label: '자동차' },
      { value: 'IOT', label: 'IoT' },
      { value: 'IC', label: 'IC' },
      { value: 'PASSIVE', label: '수동소자' },
      { value: 'PCB', label: 'PCB' },
    ],
    placeholder: '전체',
  },
  {
    name: 'product_code',
    label: '품목코드',
    type: 'text',
    placeholder: '품목코드 입력',
  },
  {
    name: 'product_name',
    label: '품목명',
    type: 'text',
    placeholder: '품목명 입력',
    width: 'w-64',
  },
  {
    name: 'use_yn',
    label: '사용여부',
    type: 'select',
    options: [
      { value: 'Y', label: '사용' },
      { value: 'N', label: '미사용' },
    ],
    placeholder: '전체',
  },
];

// 테이블 컬럼 정의
const columns: Column<Product>[] = [
  { key: 'product_code', header: '품목코드', width: '130px' },
  { key: 'product_name', header: '품목명', width: '250px' },
  {
    key: 'product_type',
    header: '유형',
    width: '80px',
    align: 'center',
    render: (value) => {
      const typeMap: Record<string, { label: string; color: string }> = {
        PRODUCT: { label: '완제품', color: 'bg-blue-500/20 text-blue-400' },
        SEMI: { label: '반제품', color: 'bg-yellow-500/20 text-yellow-400' },
        MATERIAL: { label: '원자재', color: 'bg-purple-500/20 text-purple-400' },
      };
      const info = typeMap[value] || { label: value, color: 'bg-slate-500/20 text-slate-400' };
      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>{info.label}</span>;
    },
  },
  { key: 'spec', header: '규격' },
  { key: 'unit', header: '단위', width: '60px', align: 'center' },
  {
    key: 'standard_price',
    header: '표준단가',
    width: '100px',
    align: 'right',
    render: (value) => value?.toLocaleString() + '원',
  },
  {
    key: 'safety_stock',
    header: '안전재고',
    width: '80px',
    align: 'right',
    render: (value) => value?.toLocaleString(),
  },
  {
    key: 'use_yn',
    header: '사용',
    width: '60px',
    align: 'center',
    render: (value) => (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${value === 'Y' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
        {value === 'Y' ? '사용' : '미사용'}
      </span>
    ),
  },
];

// 폼 필드 정의
const formFields: FormField[] = [
  {
    name: 'product_code',
    label: '품목코드',
    type: 'text',
    required: true,
    placeholder: '예: MB-SM-001',
  },
  {
    name: 'product_name',
    label: '품목명',
    type: 'text',
    required: true,
    placeholder: '품목명 입력',
  },
  {
    name: 'product_type',
    label: '품목유형',
    type: 'select',
    required: true,
    options: [
      { value: 'PRODUCT', label: '완제품' },
      { value: 'SEMI', label: '반제품' },
      { value: 'MATERIAL', label: '원자재' },
    ],
  },
  {
    name: 'product_group',
    label: '품목군',
    type: 'select',
    required: true,
    options: [
      { value: 'SMARTPHONE', label: '스마트폰' },
      { value: 'LED', label: 'LED' },
      { value: 'AUTOMOTIVE', label: '자동차' },
      { value: 'IOT', label: 'IoT' },
      { value: 'IC', label: 'IC' },
      { value: 'PASSIVE', label: '수동소자' },
      { value: 'PCB', label: 'PCB' },
    ],
  },
  {
    name: 'unit',
    label: '단위',
    type: 'select',
    required: true,
    options: [
      { value: 'EA', label: 'EA (개)' },
      { value: 'KG', label: 'KG (킬로그램)' },
      { value: 'M', label: 'M (미터)' },
      { value: 'L', label: 'L (리터)' },
    ],
  },
  {
    name: 'spec',
    label: '규격',
    type: 'text',
    placeholder: '규격/사양 입력',
  },
  {
    name: 'standard_price',
    label: '표준단가',
    type: 'number',
    placeholder: '0',
  },
  {
    name: 'safety_stock',
    label: '안전재고',
    type: 'number',
    placeholder: '0',
  },
  {
    name: 'lead_time',
    label: '리드타임(일)',
    type: 'number',
    placeholder: '0',
  },
  {
    name: 'use_yn',
    label: '사용여부',
    type: 'radio',
    required: true,
    options: [
      { value: 'Y', label: '사용' },
      { value: 'N', label: '미사용' },
    ],
  },
  {
    name: 'description',
    label: '비고',
    type: 'textarea',
    span: 2,
    placeholder: '품목 설명 입력',
  },
];

export default function ProductPage() {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<Product[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 검색 필터링
  const filteredData = useMemo(() => {
    return mockProducts.filter((item) => {
      if (searchParams.product_type && item.product_type !== searchParams.product_type) return false;
      if (searchParams.product_group && item.product_group !== searchParams.product_group) return false;
      if (searchParams.product_code && !item.product_code.toLowerCase().includes(searchParams.product_code.toLowerCase())) return false;
      if (searchParams.product_name && !item.product_name.includes(searchParams.product_name)) return false;
      if (searchParams.use_yn && item.use_yn !== searchParams.use_yn) return false;
      return true;
    });
  }, [searchParams]);

  // 페이지네이션
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const handleSearch = (values: Record<string, any>) => {
    setSearchParams(values);
    setPage(1);
  };

  const handleCreate = () => {
    setModalMode('create');
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEdit = (row: Product) => {
    setModalMode('edit');
    setEditingItem(row);
    setModalOpen(true);
  };

  const handleView = (row: Product) => {
    setModalMode('view');
    setEditingItem(row);
    setModalOpen(true);
  };

  const handleDelete = () => {
    if (selectedRows.length === 0) {
      alert('삭제할 항목을 선택하세요.');
      return;
    }
    if (confirm(`선택한 ${selectedRows.length}개 항목을 삭제하시겠습니까?`)) {
      console.log('Delete:', selectedRows);
      setSelectedRows([]);
    }
  };

  const handleSubmit = async (values: Record<string, any>) => {
    console.log('Submit:', values);
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="품목정보관리"
        description="제품, 반제품, 원자재 등의 품목 정보를 관리합니다."
        actions={[
          { label: '삭제', icon: 'delete', variant: 'danger', onClick: handleDelete, disabled: selectedRows.length === 0 },
          { label: '엑셀 업로드', icon: 'upload', onClick: () => console.log('Upload') },
          { label: '엑셀 다운로드', icon: 'download', onClick: () => console.log('Download') },
          { label: '신규 등록', icon: 'add', variant: 'primary', onClick: handleCreate },
        ]}
      />

      <SearchForm fields={searchFields} onSearch={handleSearch} />

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <DataGrid
          columns={columns}
          data={paginatedData}
          keyField="id"
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          onRowClick={handleView}
          onRowDoubleClick={handleEdit}
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === 'create' ? '품목 등록' : modalMode === 'edit' ? '품목 수정' : '품목 상세'}
        fields={formFields}
        initialValues={editingItem || { use_yn: 'Y', unit: 'EA' }}
        onSubmit={handleSubmit}
        mode={modalMode}
        width="lg"
      />
    </div>
  );
}
