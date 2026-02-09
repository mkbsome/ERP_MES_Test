/**
 * ERP 공급업체관리 페이지
 * 협력사/공급업체 마스터 관리
 */
import { useState, useMemo } from 'react';
import { Factory, Star, TrendingUp, AlertCircle } from 'lucide-react';
import { PageHeader, SearchForm, DataGrid, FormModal } from '../../../components/common';
import type { SearchField } from '../../../components/common/SearchForm';
import type { Column } from '../../../components/common/DataGrid';
import type { FormField } from '../../../components/common/FormModal';

// 공급업체 타입
interface Vendor {
  id: number;
  vendor_code: string;
  vendor_name: string;
  vendor_type: string;
  vendor_type_name: string;
  business_no: string;
  ceo_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  main_items: string;
  grade: string;
  payment_terms: string;
  lead_time: number;
  quality_score: number;
  delivery_score: number;
  is_active: boolean;
  created_at: string;
}

// Mock 데이터
const mockVendors: Vendor[] = [
  { id: 1, vendor_code: 'V-001', vendor_name: '(주)삼화전자', vendor_type: 'MAKER', vendor_type_name: '제조사', business_no: '123-81-12345', ceo_name: '김삼화', contact_name: '박영업', contact_phone: '031-123-4567', contact_email: 'sales@samhwa.co.kr', address: '경기도 안산시 단원구', main_items: 'PCB, FPCB', grade: 'A', payment_terms: 'NET30', lead_time: 7, quality_score: 95, delivery_score: 92, is_active: true, created_at: '2024-01-01' },
  { id: 2, vendor_code: 'V-002', vendor_name: '반도체월드(주)', vendor_type: 'DIST', vendor_type_name: '유통사', business_no: '456-81-67890', ceo_name: '이반도', contact_name: '김유통', contact_phone: '02-987-6543', contact_email: 'order@semiworld.kr', address: '서울특별시 용산구', main_items: 'IC, TR, 다이오드', grade: 'A', payment_terms: 'NET15', lead_time: 3, quality_score: 98, delivery_score: 96, is_active: true, created_at: '2024-01-01' },
  { id: 3, vendor_code: 'V-003', vendor_name: '(주)코리아부품', vendor_type: 'MAKER', vendor_type_name: '제조사', business_no: '789-81-11111', ceo_name: '박코리', contact_name: '정담당', contact_phone: '031-555-7777', contact_email: 'sales@koreaparts.com', address: '경기도 화성시', main_items: '콘덴서, 저항', grade: 'B', payment_terms: 'NET30', lead_time: 5, quality_score: 88, delivery_score: 85, is_active: true, created_at: '2024-01-01' },
  { id: 4, vendor_code: 'V-004', vendor_name: '글로벌IC(주)', vendor_type: 'IMPORT', vendor_type_name: '수입사', business_no: '321-81-22222', ceo_name: '최글로', contact_name: '김수입', contact_phone: '02-333-4444', contact_email: 'import@globalic.co.kr', address: '서울특별시 강남구', main_items: 'MCU, Memory', grade: 'A', payment_terms: 'COD', lead_time: 14, quality_score: 97, delivery_score: 90, is_active: true, created_at: '2024-01-01' },
  { id: 5, vendor_code: 'V-005', vendor_name: '(주)테크솔더', vendor_type: 'MAKER', vendor_type_name: '제조사', business_no: '654-81-33333', ceo_name: '정테크', contact_name: '이영업', contact_phone: '031-777-8888', contact_email: 'biz@techsolder.kr', address: '경기도 평택시', main_items: '솔더페이스트, 플럭스', grade: 'B', payment_terms: 'NET15', lead_time: 5, quality_score: 90, delivery_score: 88, is_active: true, created_at: '2024-01-01' },
  { id: 6, vendor_code: 'V-006', vendor_name: '커넥터코리아', vendor_type: 'DIST', vendor_type_name: '유통사', business_no: '987-81-44444', ceo_name: '한커넥', contact_name: '박영업', contact_phone: '02-222-3333', contact_email: 'sales@connkorea.com', address: '서울특별시 구로구', main_items: '커넥터, 케이블', grade: 'C', payment_terms: 'COD', lead_time: 7, quality_score: 78, delivery_score: 75, is_active: true, created_at: '2024-01-01' },
  { id: 7, vendor_code: 'V-007', vendor_name: '(주)한일부품', vendor_type: 'MAKER', vendor_type_name: '제조사', business_no: '111-81-55555', ceo_name: '김한일', contact_name: '최담당', contact_phone: '031-444-5555', contact_email: 'order@hanilparts.kr', address: '경기도 시흥시', main_items: 'LED, 센서', grade: 'B', payment_terms: 'NET30', lead_time: 10, quality_score: 85, delivery_score: 82, is_active: false, created_at: '2024-01-01' },
];

// 검색 필드 정의
const searchFields: SearchField[] = [
  {
    name: 'vendor_type',
    label: '업체유형',
    type: 'select',
    options: [
      { value: 'MAKER', label: '제조사' },
      { value: 'DIST', label: '유통사' },
      { value: 'IMPORT', label: '수입사' },
    ],
    placeholder: '전체',
  },
  {
    name: 'grade',
    label: '등급',
    type: 'select',
    options: [
      { value: 'A', label: 'A등급' },
      { value: 'B', label: 'B등급' },
      { value: 'C', label: 'C등급' },
    ],
    placeholder: '전체',
  },
  {
    name: 'vendor_code',
    label: '업체코드',
    type: 'text',
    placeholder: '업체코드',
  },
  {
    name: 'vendor_name',
    label: '업체명',
    type: 'text',
    placeholder: '업체명',
  },
  {
    name: 'is_active',
    label: '거래상태',
    type: 'select',
    options: [
      { value: 'true', label: '거래중' },
      { value: 'false', label: '거래중지' },
    ],
    placeholder: '전체',
  },
];

// 테이블 컬럼 정의
const columns: Column<Vendor>[] = [
  { key: 'vendor_code', header: '업체코드', width: '90px' },
  { key: 'vendor_name', header: '업체명', width: '140px' },
  {
    key: 'vendor_type_name',
    header: '유형',
    width: '80px',
    align: 'center',
    render: (value, row) => {
      const colors: Record<string, string> = {
        MAKER: 'bg-blue-500/20 text-blue-400',
        DIST: 'bg-purple-500/20 text-purple-400',
        IMPORT: 'bg-orange-500/20 text-orange-400',
      };
      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[row.vendor_type]}`}>{value}</span>;
    }
  },
  { key: 'main_items', header: '주요품목', width: '150px' },
  {
    key: 'grade',
    header: '등급',
    width: '70px',
    align: 'center',
    render: (value) => {
      const colors: Record<string, string> = {
        A: 'text-emerald-400 bg-emerald-500/20',
        B: 'text-blue-400 bg-blue-500/20',
        C: 'text-yellow-400 bg-yellow-500/20',
      };
      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[value]}`}>{value}등급</span>;
    }
  },
  { key: 'contact_name', header: '담당자', width: '80px' },
  { key: 'contact_phone', header: '연락처', width: '120px' },
  { key: 'lead_time', header: 'L/T(일)', width: '70px', align: 'center' },
  {
    key: 'quality_score',
    header: '품질점수',
    width: '100px',
    align: 'center',
    render: (v) => (
      <div className="flex items-center gap-1 justify-center">
        <div className="w-16 bg-slate-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${v >= 90 ? 'bg-emerald-500' : v >= 80 ? 'bg-blue-500' : 'bg-yellow-500'}`}
            style={{ width: `${v}%` }}
          />
        </div>
        <span className="text-xs">{v}</span>
      </div>
    )
  },
  {
    key: 'delivery_score',
    header: '납기점수',
    width: '100px',
    align: 'center',
    render: (v) => (
      <div className="flex items-center gap-1 justify-center">
        <div className="w-16 bg-slate-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${v >= 90 ? 'bg-emerald-500' : v >= 80 ? 'bg-blue-500' : 'bg-yellow-500'}`}
            style={{ width: `${v}%` }}
          />
        </div>
        <span className="text-xs">{v}</span>
      </div>
    )
  },
  {
    key: 'is_active',
    header: '상태',
    width: '70px',
    align: 'center',
    render: (value) => (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${value ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
        {value ? '거래중' : '중지'}
      </span>
    ),
  },
];

// 폼 필드 정의
const formFields: FormField[] = [
  { name: 'vendor_code', label: '업체코드', type: 'text', required: true },
  { name: 'vendor_name', label: '업체명', type: 'text', required: true },
  { name: 'vendor_type', label: '업체유형', type: 'select', required: true, options: [
    { value: 'MAKER', label: '제조사' },
    { value: 'DIST', label: '유통사' },
    { value: 'IMPORT', label: '수입사' },
  ] },
  { name: 'business_no', label: '사업자번호', type: 'text', required: true },
  { name: 'ceo_name', label: '대표자', type: 'text', required: true },
  { name: 'contact_name', label: '담당자', type: 'text', required: true },
  { name: 'contact_phone', label: '연락처', type: 'text', required: true },
  { name: 'contact_email', label: '이메일', type: 'text' },
  { name: 'address', label: '주소', type: 'text', fullWidth: true },
  { name: 'main_items', label: '주요품목', type: 'text', fullWidth: true },
  { name: 'grade', label: '등급', type: 'select', required: true, options: [
    { value: 'A', label: 'A등급' },
    { value: 'B', label: 'B등급' },
    { value: 'C', label: 'C등급' },
  ] },
  { name: 'payment_terms', label: '결제조건', type: 'select', required: true, options: [
    { value: 'COD', label: '현금' },
    { value: 'NET15', label: '15일' },
    { value: 'NET30', label: '30일' },
  ] },
  { name: 'lead_time', label: '리드타임(일)', type: 'number', required: true },
  { name: 'is_active', label: '거래상태', type: 'checkbox' },
];

export default function VendorPage() {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<Vendor[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingItem, setEditingItem] = useState<Vendor | null>(null);

  const filteredData = useMemo(() => {
    return mockVendors.filter((item) => {
      if (searchParams.vendor_type && item.vendor_type !== searchParams.vendor_type) return false;
      if (searchParams.grade && item.grade !== searchParams.grade) return false;
      if (searchParams.vendor_code && !item.vendor_code.toLowerCase().includes(searchParams.vendor_code.toLowerCase())) return false;
      if (searchParams.vendor_name && !item.vendor_name.toLowerCase().includes(searchParams.vendor_name.toLowerCase())) return false;
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
    const gradeA = filteredData.filter(i => i.grade === 'A').length;
    const gradeB = filteredData.filter(i => i.grade === 'B').length;
    const gradeC = filteredData.filter(i => i.grade === 'C').length;
    const avgQuality = filteredData.length > 0
      ? filteredData.reduce((sum, i) => sum + i.quality_score, 0) / filteredData.length
      : 0;
    return { total: filteredData.length, gradeA, gradeB, gradeC, avgQuality };
  }, [filteredData]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="공급업체관리"
        description="협력사/공급업체 마스터를 관리합니다."
        actions={[
          { label: '삭제', icon: 'delete', variant: 'danger', onClick: handleDelete, disabled: selectedRows.length === 0 },
          { label: '수정', icon: 'edit', onClick: handleEdit, disabled: selectedRows.length !== 1 },
          { label: '신규등록', icon: 'add', variant: 'primary', onClick: handleAdd },
        ]}
      />

      <SearchForm fields={searchFields} onSearch={handleSearch} />

      {/* 요약 카드 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Factory className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">전체 업체</p>
              <p className="text-2xl font-bold text-white">{summary.total}사</p>
            </div>
          </div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-emerald-300">A등급</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.gradeA}사</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-300">B등급</p>
          <p className="text-2xl font-bold text-blue-400">{summary.gradeB}사</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-sm text-yellow-300">C등급</p>
          <p className="text-2xl font-bold text-yellow-400">{summary.gradeC}사</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-purple-300">평균 품질점수</span>
          </div>
          <p className="text-2xl font-bold text-purple-400 mt-1">{summary.avgQuality.toFixed(1)}점</p>
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
        title={modalMode === 'create' ? '공급업체 등록' : modalMode === 'edit' ? '공급업체 수정' : '공급업체 상세'}
        fields={formFields}
        initialData={editingItem || undefined}
        mode={modalMode}
      />
    </div>
  );
}
