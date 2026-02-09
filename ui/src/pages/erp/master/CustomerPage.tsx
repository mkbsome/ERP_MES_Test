/**
 * ERP 고객관리 페이지
 * 거래처(고객사) 마스터 관리
 */
import { useState, useMemo } from 'react';
import { Building2, Phone, Mail, MapPin } from 'lucide-react';
import { PageHeader, SearchForm, DataGrid, FormModal } from '../../../components/common';
import type { SearchField } from '../../../components/common/SearchForm';
import type { Column } from '../../../components/common/DataGrid';
import type { FormField } from '../../../components/common/FormModal';

// 고객 타입
interface Customer {
  id: number;
  customer_code: string;
  customer_name: string;
  customer_type: string;
  customer_type_name: string;
  business_no: string;
  ceo_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  credit_limit: number;
  payment_terms: string;
  is_active: boolean;
  created_at: string;
}

// Mock 데이터
const mockCustomers: Customer[] = [
  { id: 1, customer_code: 'C-001', customer_name: '삼성전자(주)', customer_type: 'MAJOR', customer_type_name: '대기업', business_no: '124-81-00998', ceo_name: '이재용', contact_name: '김구매', contact_phone: '02-2255-0114', contact_email: 'purchase@samsung.com', address: '경기도 수원시 영통구 삼성로 129', credit_limit: 100000000000, payment_terms: 'NET30', is_active: true, created_at: '2024-01-01' },
  { id: 2, customer_code: 'C-002', customer_name: '현대자동차(주)', customer_type: 'MAJOR', customer_type_name: '대기업', business_no: '101-81-02759', ceo_name: '정의선', contact_name: '박부품', contact_phone: '02-3464-1114', contact_email: 'parts@hyundai.com', address: '서울특별시 서초구 헌릉로 12', credit_limit: 80000000000, payment_terms: 'NET45', is_active: true, created_at: '2024-01-01' },
  { id: 3, customer_code: 'C-003', customer_name: 'LG전자(주)', customer_type: 'MAJOR', customer_type_name: '대기업', business_no: '107-86-14075', ceo_name: '조주완', contact_name: '이자재', contact_phone: '02-3777-1114', contact_email: 'material@lge.com', address: '서울특별시 영등포구 여의대로 128', credit_limit: 60000000000, payment_terms: 'NET30', is_active: true, created_at: '2024-01-01' },
  { id: 4, customer_code: 'C-004', customer_name: '(주)SK하이닉스', customer_type: 'MAJOR', customer_type_name: '대기업', business_no: '284-81-00032', ceo_name: '박정호', contact_name: '최자재', contact_phone: '031-5185-4114', contact_email: 'scm@skhynix.com', address: '경기도 이천시 부발읍 경충대로 2091', credit_limit: 50000000000, payment_terms: 'NET30', is_active: true, created_at: '2024-01-01' },
  { id: 5, customer_code: 'C-005', customer_name: '(주)대우전자', customer_type: 'MID', customer_type_name: '중견기업', business_no: '117-81-33254', ceo_name: '김대우', contact_name: '정구매', contact_phone: '02-527-5114', contact_email: 'purchase@daewoo.co.kr', address: '서울특별시 강남구 언주로 508', credit_limit: 10000000000, payment_terms: 'NET30', is_active: true, created_at: '2024-01-01' },
  { id: 6, customer_code: 'C-006', customer_name: '(주)코위버', customer_type: 'MID', customer_type_name: '중견기업', business_no: '134-81-65487', ceo_name: '박코위', contact_name: '김담당', contact_phone: '031-8014-5000', contact_email: 'order@cowever.com', address: '경기도 성남시 분당구 판교역로 166', credit_limit: 5000000000, payment_terms: 'NET15', is_active: true, created_at: '2024-01-01' },
  { id: 7, customer_code: 'C-007', customer_name: '스마트테크(주)', customer_type: 'SMALL', customer_type_name: '중소기업', business_no: '215-87-12345', ceo_name: '이스마', contact_name: '박영업', contact_phone: '02-1234-5678', contact_email: 'sales@smarttech.co.kr', address: '서울특별시 금천구 가산디지털1로 145', credit_limit: 1000000000, payment_terms: 'COD', is_active: true, created_at: '2024-01-01' },
  { id: 8, customer_code: 'C-008', customer_name: '테크솔루션(주)', customer_type: 'SMALL', customer_type_name: '중소기업', business_no: '128-87-54321', ceo_name: '김테크', contact_name: '이구매', contact_phone: '031-987-6543', contact_email: 'purchase@techsol.kr', address: '경기도 안양시 동안구 시민대로 327번길', credit_limit: 500000000, payment_terms: 'NET15', is_active: false, created_at: '2024-01-01' },
];

// 검색 필드 정의
const searchFields: SearchField[] = [
  {
    name: 'customer_type',
    label: '고객유형',
    type: 'select',
    options: [
      { value: 'MAJOR', label: '대기업' },
      { value: 'MID', label: '중견기업' },
      { value: 'SMALL', label: '중소기업' },
    ],
    placeholder: '전체',
  },
  {
    name: 'customer_code',
    label: '고객코드',
    type: 'text',
    placeholder: '고객코드',
  },
  {
    name: 'customer_name',
    label: '고객명',
    type: 'text',
    placeholder: '고객명',
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
const columns: Column<Customer>[] = [
  { key: 'customer_code', header: '고객코드', width: '90px' },
  { key: 'customer_name', header: '고객명', width: '160px' },
  {
    key: 'customer_type_name',
    header: '유형',
    width: '80px',
    align: 'center',
    render: (value, row) => {
      const colors: Record<string, string> = {
        MAJOR: 'bg-purple-500/20 text-purple-400',
        MID: 'bg-blue-500/20 text-blue-400',
        SMALL: 'bg-slate-500/20 text-slate-400',
      };
      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[row.customer_type]}`}>{value}</span>;
    }
  },
  { key: 'business_no', header: '사업자번호', width: '120px' },
  { key: 'ceo_name', header: '대표자', width: '80px' },
  { key: 'contact_name', header: '담당자', width: '80px' },
  { key: 'contact_phone', header: '연락처', width: '120px' },
  {
    key: 'credit_limit',
    header: '여신한도',
    width: '120px',
    align: 'right',
    render: (v) => `₩${(v / 100000000).toFixed(0)}억`
  },
  {
    key: 'payment_terms',
    header: '결제조건',
    width: '80px',
    align: 'center',
    render: (v) => {
      const labels: Record<string, string> = { COD: '현금', NET15: '15일', NET30: '30일', NET45: '45일' };
      return labels[v] || v;
    }
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
  { name: 'customer_code', label: '고객코드', type: 'text', required: true },
  { name: 'customer_name', label: '고객명', type: 'text', required: true },
  { name: 'customer_type', label: '고객유형', type: 'select', required: true, options: [
    { value: 'MAJOR', label: '대기업' },
    { value: 'MID', label: '중견기업' },
    { value: 'SMALL', label: '중소기업' },
  ] },
  { name: 'business_no', label: '사업자번호', type: 'text', required: true },
  { name: 'ceo_name', label: '대표자', type: 'text', required: true },
  { name: 'contact_name', label: '담당자', type: 'text', required: true },
  { name: 'contact_phone', label: '연락처', type: 'text', required: true },
  { name: 'contact_email', label: '이메일', type: 'text' },
  { name: 'address', label: '주소', type: 'text', fullWidth: true },
  { name: 'credit_limit', label: '여신한도', type: 'number', required: true },
  { name: 'payment_terms', label: '결제조건', type: 'select', required: true, options: [
    { value: 'COD', label: '현금' },
    { value: 'NET15', label: '15일' },
    { value: 'NET30', label: '30일' },
    { value: 'NET45', label: '45일' },
  ] },
  { name: 'is_active', label: '거래상태', type: 'checkbox' },
];

export default function CustomerPage() {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingItem, setEditingItem] = useState<Customer | null>(null);

  const filteredData = useMemo(() => {
    return mockCustomers.filter((item) => {
      if (searchParams.customer_type && item.customer_type !== searchParams.customer_type) return false;
      if (searchParams.customer_code && !item.customer_code.toLowerCase().includes(searchParams.customer_code.toLowerCase())) return false;
      if (searchParams.customer_name && !item.customer_name.toLowerCase().includes(searchParams.customer_name.toLowerCase())) return false;
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
    const major = filteredData.filter(i => i.customer_type === 'MAJOR').length;
    const mid = filteredData.filter(i => i.customer_type === 'MID').length;
    const small = filteredData.filter(i => i.customer_type === 'SMALL').length;
    const totalCredit = filteredData.reduce((sum, i) => sum + i.credit_limit, 0);
    return { total: filteredData.length, major, mid, small, totalCredit };
  }, [filteredData]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="고객관리"
        description="거래처(고객사) 마스터를 관리합니다."
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
              <Building2 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">전체 고객</p>
              <p className="text-2xl font-bold text-white">{summary.total}사</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <p className="text-sm text-purple-300">대기업</p>
          <p className="text-2xl font-bold text-purple-400">{summary.major}사</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-300">중견기업</p>
          <p className="text-2xl font-bold text-blue-400">{summary.mid}사</p>
        </div>
        <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-4">
          <p className="text-sm text-slate-300">중소기업</p>
          <p className="text-2xl font-bold text-slate-400">{summary.small}사</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <p className="text-sm text-emerald-300">총 여신한도</p>
          <p className="text-2xl font-bold text-emerald-400">{(summary.totalCredit / 1000000000000).toFixed(1)}조</p>
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
        title={modalMode === 'create' ? '고객 등록' : modalMode === 'edit' ? '고객 수정' : '고객 상세'}
        fields={formFields}
        initialData={editingItem || undefined}
        mode={modalMode}
      />
    </div>
  );
}
