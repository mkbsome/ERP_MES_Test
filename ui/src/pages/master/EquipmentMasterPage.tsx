/**
 * 설비정보관리 페이지
 * 설비 마스터 CRUD
 */
import { useState, useMemo } from 'react';
import { PageHeader, SearchForm, DataGrid, FormModal } from '../../components/common';
import type { SearchField } from '../../components/common/SearchForm';
import type { Column } from '../../components/common/DataGrid';
import type { FormField } from '../../components/common/FormModal';

// 설비 타입
interface Equipment {
  id: number;
  equipment_code: string;
  equipment_name: string;
  equipment_type: string;
  line_code: string;
  line_name: string;
  manufacturer: string;
  model: string;
  serial_no: string;
  install_date: string;
  status: string;
  use_yn: string;
}

// Mock 데이터
const mockEquipments: Equipment[] = [
  { id: 1, equipment_code: 'SMT-L01-M01', equipment_name: 'Screen Printer SP-01', equipment_type: 'SCREEN_PRINTER', line_code: 'SMT-L01', line_name: 'SMT Line 1', manufacturer: 'DEK', model: 'Horizon 03iX', serial_no: 'DK2023001', install_date: '2023-01-15', status: 'RUNNING', use_yn: 'Y' },
  { id: 2, equipment_code: 'SMT-L01-M02', equipment_name: 'Chip Mounter CM-01', equipment_type: 'MOUNTER', line_code: 'SMT-L01', line_name: 'SMT Line 1', manufacturer: 'Samsung', model: 'SM482', serial_no: 'SM2023001', install_date: '2023-01-15', status: 'RUNNING', use_yn: 'Y' },
  { id: 3, equipment_code: 'SMT-L01-M03', equipment_name: 'Chip Mounter CM-02', equipment_type: 'MOUNTER', line_code: 'SMT-L01', line_name: 'SMT Line 1', manufacturer: 'Samsung', model: 'SM482', serial_no: 'SM2023002', install_date: '2023-01-15', status: 'RUNNING', use_yn: 'Y' },
  { id: 4, equipment_code: 'SMT-L01-M04', equipment_name: 'Reflow Oven RF-01', equipment_type: 'REFLOW', line_code: 'SMT-L01', line_name: 'SMT Line 1', manufacturer: 'Heller', model: '1809 MKIII', serial_no: 'HL2023001', install_date: '2023-01-15', status: 'RUNNING', use_yn: 'Y' },
  { id: 5, equipment_code: 'SMT-L01-M05', equipment_name: 'AOI Inspector AOI-01', equipment_type: 'AOI', line_code: 'SMT-L01', line_name: 'SMT Line 1', manufacturer: 'Koh Young', model: 'Zenith', serial_no: 'KY2023001', install_date: '2023-01-15', status: 'RUNNING', use_yn: 'Y' },
  { id: 6, equipment_code: 'SMT-L02-M01', equipment_name: 'Screen Printer SP-02', equipment_type: 'SCREEN_PRINTER', line_code: 'SMT-L02', line_name: 'SMT Line 2', manufacturer: 'DEK', model: 'Horizon 03iX', serial_no: 'DK2023002', install_date: '2023-03-01', status: 'IDLE', use_yn: 'Y' },
  { id: 7, equipment_code: 'SMT-L02-M02', equipment_name: 'Chip Mounter CM-03', equipment_type: 'MOUNTER', line_code: 'SMT-L02', line_name: 'SMT Line 2', manufacturer: 'Fuji', model: 'NXT III', serial_no: 'FJ2023001', install_date: '2023-03-01', status: 'MAINTENANCE', use_yn: 'Y' },
  { id: 8, equipment_code: 'THT-L01-M01', equipment_name: 'Wave Solder WS-01', equipment_type: 'WAVE_SOLDER', line_code: 'THT-L01', line_name: 'THT Line 1', manufacturer: 'ERSA', model: 'Powerflow N2', serial_no: 'ER2023001', install_date: '2023-02-01', status: 'RUNNING', use_yn: 'Y' },
  { id: 9, equipment_code: 'ASS-L01-M01', equipment_name: 'Screw Driver SD-01', equipment_type: 'ASSEMBLY', line_code: 'ASS-L01', line_name: 'Assembly Line 1', manufacturer: 'Atlas Copco', model: 'ST-2000', serial_no: 'AC2023001', install_date: '2023-04-01', status: 'RUNNING', use_yn: 'Y' },
  { id: 10, equipment_code: 'ASS-L01-M02', equipment_name: 'Function Tester FT-01', equipment_type: 'TESTER', line_code: 'ASS-L01', line_name: 'Assembly Line 1', manufacturer: 'Chroma', model: 'ATE-200', serial_no: 'CH2023001', install_date: '2023-04-01', status: 'RUNNING', use_yn: 'Y' },
];

// 검색 필드 정의
const searchFields: SearchField[] = [
  {
    name: 'line_code',
    label: '라인',
    type: 'select',
    options: [
      { value: 'SMT-L01', label: 'SMT Line 1' },
      { value: 'SMT-L02', label: 'SMT Line 2' },
      { value: 'THT-L01', label: 'THT Line 1' },
      { value: 'ASS-L01', label: 'Assembly Line 1' },
    ],
    placeholder: '전체',
  },
  {
    name: 'equipment_type',
    label: '설비유형',
    type: 'select',
    options: [
      { value: 'SCREEN_PRINTER', label: 'Screen Printer' },
      { value: 'MOUNTER', label: 'Chip Mounter' },
      { value: 'REFLOW', label: 'Reflow Oven' },
      { value: 'AOI', label: 'AOI' },
      { value: 'WAVE_SOLDER', label: 'Wave Solder' },
      { value: 'ASSEMBLY', label: 'Assembly' },
      { value: 'TESTER', label: 'Tester' },
    ],
    placeholder: '전체',
  },
  {
    name: 'equipment_code',
    label: '설비코드',
    type: 'text',
    placeholder: '설비코드 입력',
  },
  {
    name: 'equipment_name',
    label: '설비명',
    type: 'text',
    placeholder: '설비명 입력',
  },
  {
    name: 'status',
    label: '상태',
    type: 'select',
    options: [
      { value: 'RUNNING', label: '가동중' },
      { value: 'IDLE', label: '대기' },
      { value: 'MAINTENANCE', label: '점검중' },
      { value: 'DOWN', label: '고장' },
    ],
    placeholder: '전체',
  },
];

// 테이블 컬럼 정의
const columns: Column<Equipment>[] = [
  { key: 'equipment_code', header: '설비코드', width: '130px' },
  { key: 'equipment_name', header: '설비명', width: '200px' },
  {
    key: 'equipment_type',
    header: '유형',
    width: '120px',
    render: (value) => {
      const typeMap: Record<string, string> = {
        SCREEN_PRINTER: 'Screen Printer',
        MOUNTER: 'Chip Mounter',
        REFLOW: 'Reflow Oven',
        AOI: 'AOI',
        WAVE_SOLDER: 'Wave Solder',
        ASSEMBLY: 'Assembly',
        TESTER: 'Tester',
      };
      return typeMap[value] || value;
    },
  },
  { key: 'line_name', header: '라인', width: '120px' },
  { key: 'manufacturer', header: '제조사', width: '100px' },
  { key: 'model', header: '모델', width: '120px' },
  { key: 'install_date', header: '설치일', width: '100px', align: 'center' },
  {
    key: 'status',
    header: '상태',
    width: '80px',
    align: 'center',
    render: (value) => {
      const statusMap: Record<string, { label: string; color: string }> = {
        RUNNING: { label: '가동', color: 'bg-emerald-500/20 text-emerald-400' },
        IDLE: { label: '대기', color: 'bg-blue-500/20 text-blue-400' },
        MAINTENANCE: { label: '점검', color: 'bg-yellow-500/20 text-yellow-400' },
        DOWN: { label: '고장', color: 'bg-red-500/20 text-red-400' },
      };
      const info = statusMap[value] || { label: value, color: 'bg-slate-500/20 text-slate-400' };
      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>{info.label}</span>;
    },
  },
  {
    key: 'use_yn',
    header: '사용',
    width: '60px',
    align: 'center',
    render: (value) => (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${value === 'Y' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
        {value === 'Y' ? 'Y' : 'N'}
      </span>
    ),
  },
];

// 폼 필드 정의
const formFields: FormField[] = [
  {
    name: 'equipment_code',
    label: '설비코드',
    type: 'text',
    required: true,
    placeholder: '예: SMT-L01-M01',
  },
  {
    name: 'equipment_name',
    label: '설비명',
    type: 'text',
    required: true,
    placeholder: '설비명 입력',
  },
  {
    name: 'equipment_type',
    label: '설비유형',
    type: 'select',
    required: true,
    options: [
      { value: 'SCREEN_PRINTER', label: 'Screen Printer' },
      { value: 'MOUNTER', label: 'Chip Mounter' },
      { value: 'REFLOW', label: 'Reflow Oven' },
      { value: 'AOI', label: 'AOI' },
      { value: 'WAVE_SOLDER', label: 'Wave Solder' },
      { value: 'ASSEMBLY', label: 'Assembly' },
      { value: 'TESTER', label: 'Tester' },
    ],
  },
  {
    name: 'line_code',
    label: '라인',
    type: 'select',
    required: true,
    options: [
      { value: 'SMT-L01', label: 'SMT Line 1' },
      { value: 'SMT-L02', label: 'SMT Line 2' },
      { value: 'THT-L01', label: 'THT Line 1' },
      { value: 'ASS-L01', label: 'Assembly Line 1' },
    ],
  },
  {
    name: 'manufacturer',
    label: '제조사',
    type: 'text',
    placeholder: '제조사 입력',
  },
  {
    name: 'model',
    label: '모델명',
    type: 'text',
    placeholder: '모델명 입력',
  },
  {
    name: 'serial_no',
    label: '시리얼번호',
    type: 'text',
    placeholder: '시리얼번호 입력',
  },
  {
    name: 'install_date',
    label: '설치일',
    type: 'date',
  },
  {
    name: 'status',
    label: '상태',
    type: 'select',
    required: true,
    options: [
      { value: 'RUNNING', label: '가동중' },
      { value: 'IDLE', label: '대기' },
      { value: 'MAINTENANCE', label: '점검중' },
      { value: 'DOWN', label: '고장' },
    ],
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
];

export default function EquipmentMasterPage() {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<Equipment[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filteredData = useMemo(() => {
    return mockEquipments.filter((item) => {
      if (searchParams.line_code && item.line_code !== searchParams.line_code) return false;
      if (searchParams.equipment_type && item.equipment_type !== searchParams.equipment_type) return false;
      if (searchParams.equipment_code && !item.equipment_code.toLowerCase().includes(searchParams.equipment_code.toLowerCase())) return false;
      if (searchParams.equipment_name && !item.equipment_name.toLowerCase().includes(searchParams.equipment_name.toLowerCase())) return false;
      if (searchParams.status && item.status !== searchParams.status) return false;
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

  const handleCreate = () => {
    setModalMode('create');
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEdit = (row: Equipment) => {
    setModalMode('edit');
    setEditingItem(row);
    setModalOpen(true);
  };

  const handleView = (row: Equipment) => {
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
        title="설비정보관리"
        description="생산 설비의 기본 정보를 등록하고 관리합니다."
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
        title={modalMode === 'create' ? '설비 등록' : modalMode === 'edit' ? '설비 수정' : '설비 상세'}
        fields={formFields}
        initialValues={editingItem || { use_yn: 'Y', status: 'IDLE' }}
        onSubmit={handleSubmit}
        mode={modalMode}
        width="lg"
      />
    </div>
  );
}
