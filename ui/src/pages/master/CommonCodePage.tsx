/**
 * 공통코드관리 페이지
 * 코드그룹 및 공통코드 CRUD
 */
import { useState, useMemo } from 'react';
import { PageHeader, SearchForm, DataGrid, FormModal } from '../../components/common';
import type { SearchField } from '../../components/common/SearchForm';
import type { Column } from '../../components/common/DataGrid';
import type { FormField } from '../../components/common/FormModal';

// 코드그룹 타입
interface CodeGroup {
  group_code: string;
  group_name: string;
  description: string;
  use_yn: string;
  created_at: string;
  updated_at: string;
}

// 공통코드 타입
interface CommonCode {
  id: number;
  group_code: string;
  code: string;
  code_name: string;
  sort_order: number;
  use_yn: string;
  attribute1?: string;
  attribute2?: string;
  description?: string;
}

// Mock 데이터 - 코드그룹
const mockCodeGroups: CodeGroup[] = [
  { group_code: 'PLANT', group_name: '공장코드', description: '공장 구분 코드', use_yn: 'Y', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { group_code: 'LINE_TYPE', group_name: '라인유형', description: '생산라인 유형 코드', use_yn: 'Y', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { group_code: 'EQUIP_TYPE', group_name: '설비유형', description: '설비 유형 코드', use_yn: 'Y', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { group_code: 'DEFECT_TYPE', group_name: '불량유형', description: '불량 유형 코드', use_yn: 'Y', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { group_code: 'UNIT', group_name: '단위', description: '수량/중량 단위', use_yn: 'Y', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { group_code: 'WO_STATUS', group_name: '작업지시상태', description: '작업지시 상태 코드', use_yn: 'Y', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { group_code: 'INSP_TYPE', group_name: '검사유형', description: '품질 검사 유형', use_yn: 'Y', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { group_code: 'STOP_REASON', group_name: '비가동사유', description: '설비 비가동 사유', use_yn: 'Y', created_at: '2024-01-01', updated_at: '2024-01-01' },
];

// Mock 데이터 - 공통코드
const mockCommonCodes: CommonCode[] = [
  { id: 1, group_code: 'PLANT', code: 'P001', code_name: '1공장', sort_order: 1, use_yn: 'Y' },
  { id: 2, group_code: 'PLANT', code: 'P002', code_name: '2공장', sort_order: 2, use_yn: 'Y' },
  { id: 3, group_code: 'LINE_TYPE', code: 'SMT_HIGH', code_name: 'SMT High Speed', sort_order: 1, use_yn: 'Y' },
  { id: 4, group_code: 'LINE_TYPE', code: 'SMT_MID', code_name: 'SMT Mid Speed', sort_order: 2, use_yn: 'Y' },
  { id: 5, group_code: 'LINE_TYPE', code: 'SMT_FLEX', code_name: 'SMT Flex', sort_order: 3, use_yn: 'Y' },
  { id: 6, group_code: 'LINE_TYPE', code: 'THT', code_name: 'Through Hole', sort_order: 4, use_yn: 'Y' },
  { id: 7, group_code: 'LINE_TYPE', code: 'ASSY', code_name: 'Assembly', sort_order: 5, use_yn: 'Y' },
  { id: 8, group_code: 'DEFECT_TYPE', code: 'BRIDGE', code_name: '솔더 브릿지', sort_order: 1, use_yn: 'Y' },
  { id: 9, group_code: 'DEFECT_TYPE', code: 'MISSING', code_name: '부품 누락', sort_order: 2, use_yn: 'Y' },
  { id: 10, group_code: 'DEFECT_TYPE', code: 'COLD', code_name: '냉납', sort_order: 3, use_yn: 'Y' },
  { id: 11, group_code: 'DEFECT_TYPE', code: 'CRACK', code_name: '크랙', sort_order: 4, use_yn: 'Y' },
  { id: 12, group_code: 'UNIT', code: 'EA', code_name: '개', sort_order: 1, use_yn: 'Y' },
  { id: 13, group_code: 'UNIT', code: 'KG', code_name: '킬로그램', sort_order: 2, use_yn: 'Y' },
  { id: 14, group_code: 'UNIT', code: 'M', code_name: '미터', sort_order: 3, use_yn: 'Y' },
  { id: 15, group_code: 'WO_STATUS', code: 'PENDING', code_name: '대기', sort_order: 1, use_yn: 'Y' },
  { id: 16, group_code: 'WO_STATUS', code: 'IN_PROGRESS', code_name: '진행중', sort_order: 2, use_yn: 'Y' },
  { id: 17, group_code: 'WO_STATUS', code: 'COMPLETED', code_name: '완료', sort_order: 3, use_yn: 'Y' },
  { id: 18, group_code: 'WO_STATUS', code: 'CANCELLED', code_name: '취소', sort_order: 4, use_yn: 'Y' },
];

// 검색 필드 정의
const searchFields: SearchField[] = [
  {
    name: 'group_code',
    label: '코드그룹',
    type: 'select',
    options: mockCodeGroups.map((g) => ({ value: g.group_code, label: `${g.group_code} - ${g.group_name}` })),
    placeholder: '전체',
  },
  {
    name: 'code',
    label: '코드',
    type: 'text',
    placeholder: '코드 입력',
  },
  {
    name: 'code_name',
    label: '코드명',
    type: 'text',
    placeholder: '코드명 입력',
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
const columns: Column<CommonCode>[] = [
  { key: 'group_code', header: '코드그룹', width: '120px' },
  { key: 'code', header: '코드', width: '120px' },
  { key: 'code_name', header: '코드명', width: '200px' },
  { key: 'sort_order', header: '정렬순서', width: '80px', align: 'center' },
  {
    key: 'use_yn',
    header: '사용여부',
    width: '80px',
    align: 'center',
    render: (value) => (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${
          value === 'Y' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
        }`}
      >
        {value === 'Y' ? '사용' : '미사용'}
      </span>
    ),
  },
  { key: 'description', header: '설명' },
];

// 폼 필드 정의
const formFields: FormField[] = [
  {
    name: 'group_code',
    label: '코드그룹',
    type: 'select',
    required: true,
    options: mockCodeGroups.map((g) => ({ value: g.group_code, label: `${g.group_code} - ${g.group_name}` })),
  },
  {
    name: 'code',
    label: '코드',
    type: 'text',
    required: true,
    placeholder: '영문, 숫자, 언더스코어만 사용',
  },
  {
    name: 'code_name',
    label: '코드명',
    type: 'text',
    required: true,
    placeholder: '코드명 입력',
  },
  {
    name: 'sort_order',
    label: '정렬순서',
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
    name: 'attribute1',
    label: '속성1',
    type: 'text',
    placeholder: '추가 속성값',
  },
  {
    name: 'attribute2',
    label: '속성2',
    type: 'text',
    placeholder: '추가 속성값',
  },
  {
    name: 'description',
    label: '설명',
    type: 'textarea',
    span: 2,
    placeholder: '코드 설명 입력',
  },
];

export default function CommonCodePage() {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<CommonCode[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingItem, setEditingItem] = useState<CommonCode | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 검색 필터링
  const filteredData = useMemo(() => {
    return mockCommonCodes.filter((item) => {
      if (searchParams.group_code && item.group_code !== searchParams.group_code) return false;
      if (searchParams.code && !item.code.toLowerCase().includes(searchParams.code.toLowerCase())) return false;
      if (searchParams.code_name && !item.code_name.includes(searchParams.code_name)) return false;
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

  const handleEdit = (row: CommonCode) => {
    setModalMode('edit');
    setEditingItem(row);
    setModalOpen(true);
  };

  const handleView = (row: CommonCode) => {
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
      // TODO: API 호출
      console.log('Delete:', selectedRows);
      setSelectedRows([]);
    }
  };

  const handleSubmit = async (values: Record<string, any>) => {
    console.log('Submit:', values);
    // TODO: API 호출
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="공통코드관리"
        description="시스템에서 사용하는 공통코드를 관리합니다."
        actions={[
          { label: '삭제', icon: 'delete', variant: 'danger', onClick: handleDelete, disabled: selectedRows.length === 0 },
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
        title={modalMode === 'create' ? '공통코드 등록' : modalMode === 'edit' ? '공통코드 수정' : '공통코드 상세'}
        fields={formFields}
        initialValues={editingItem || { use_yn: 'Y', sort_order: 0 }}
        onSubmit={handleSubmit}
        mode={modalMode}
        width="lg"
      />
    </div>
  );
}
