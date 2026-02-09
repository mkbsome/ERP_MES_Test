/**
 * 보전이력 페이지
 * 설비 유지보수 이력 관리
 */
import { useState, useMemo } from 'react';
import { Plus, Calendar, Wrench, CheckCircle } from 'lucide-react';
import { PageHeader, SearchForm, DataGrid, FormModal } from '../../components/common';
import type { SearchField } from '../../components/common/SearchForm';
import type { Column } from '../../components/common/DataGrid';
import type { FormField } from '../../components/common/FormModal';

// 보전이력 타입
interface MaintenanceHistory {
  id: number;
  maintenance_no: string;
  equipment_code: string;
  equipment_name: string;
  line_code: string;
  line_name: string;
  maintenance_type: string;
  maintenance_type_name: string;
  work_date: string;
  start_time: string;
  end_time: string;
  work_minutes: number;
  worker: string;
  description: string;
  parts_used: string;
  cost: number;
  status: string;
  next_due_date: string | null;
}

// Mock 데이터
const mockHistory: MaintenanceHistory[] = [
  { id: 1, maintenance_no: 'MT-2024-0001', equipment_code: 'SMT-M01', equipment_name: 'SMT Mounter #1', line_code: 'SMT-L01', line_name: 'SMT Line 1', maintenance_type: 'PM', maintenance_type_name: '예방보전', work_date: '2024-01-15', start_time: '06:00', end_time: '07:30', work_minutes: 90, worker: '박정비', description: '정기 점검 및 윤활유 교체', parts_used: '윤활유 500ml', cost: 50000, status: 'COMPLETED', next_due_date: '2024-02-15' },
  { id: 2, maintenance_no: 'MT-2024-0002', equipment_code: 'SMT-M01', equipment_name: 'SMT Mounter #1', line_code: 'SMT-L01', line_name: 'SMT Line 1', maintenance_type: 'CM', maintenance_type_name: '사후보전', work_date: '2024-01-15', start_time: '10:30', end_time: '11:45', work_minutes: 75, worker: '박정비', description: '노즐 청소 및 교체', parts_used: '노즐 2개', cost: 150000, status: 'COMPLETED', next_due_date: null },
  { id: 3, maintenance_no: 'MT-2024-0003', equipment_code: 'SMT-R01', equipment_name: 'Reflow Oven #1', line_code: 'SMT-L01', line_name: 'SMT Line 1', maintenance_type: 'PM', maintenance_type_name: '예방보전', work_date: '2024-01-14', start_time: '18:00', end_time: '20:00', work_minutes: 120, worker: '김보전', description: '히터 점검 및 청소', parts_used: '-', cost: 0, status: 'COMPLETED', next_due_date: '2024-02-14' },
  { id: 4, maintenance_no: 'MT-2024-0004', equipment_code: 'SMT-R01', equipment_name: 'Reflow Oven #1', line_code: 'SMT-L01', line_name: 'SMT Line 1', maintenance_type: 'CM', maintenance_type_name: '사후보전', work_date: '2024-01-15', start_time: '14:20', end_time: '15:30', work_minutes: 70, worker: '박정비', description: '온도센서 교체', parts_used: '온도센서 1개', cost: 80000, status: 'COMPLETED', next_due_date: null },
  { id: 5, maintenance_no: 'MT-2024-0005', equipment_code: 'AOI-01', equipment_name: 'AOI Inspector #1', line_code: 'SMT-L01', line_name: 'SMT Line 1', maintenance_type: 'PM', maintenance_type_name: '예방보전', work_date: '2024-01-13', start_time: '06:00', end_time: '07:00', work_minutes: 60, worker: '김보전', description: '렌즈 청소 및 조명 점검', parts_used: '-', cost: 0, status: 'COMPLETED', next_due_date: '2024-02-13' },
  { id: 6, maintenance_no: 'MT-2024-0006', equipment_code: 'THT-W01', equipment_name: 'Wave Solder #1', line_code: 'THT-L01', line_name: 'THT Line 1', maintenance_type: 'PM', maintenance_type_name: '예방보전', work_date: '2024-01-12', start_time: '17:00', end_time: '19:00', work_minutes: 120, worker: '박정비', description: '솔더 교체 및 청소', parts_used: '무연솔더 10kg', cost: 250000, status: 'COMPLETED', next_due_date: '2024-01-26' },
  { id: 7, maintenance_no: 'MT-2024-0007', equipment_code: 'THT-W01', equipment_name: 'Wave Solder #1', line_code: 'THT-L01', line_name: 'THT Line 1', maintenance_type: 'CM', maintenance_type_name: '사후보전', work_date: '2024-01-16', start_time: '09:00', end_time: '10:30', work_minutes: 90, worker: '박정비', description: '컨베이어 벨트 재조정', parts_used: '-', cost: 0, status: 'COMPLETED', next_due_date: null },
  { id: 8, maintenance_no: 'MT-2024-0008', equipment_code: 'SMT-M02', equipment_name: 'SMT Mounter #2', line_code: 'SMT-L01', line_name: 'SMT Line 1', maintenance_type: 'CM', maintenance_type_name: '사후보전', work_date: '2024-01-16', start_time: '11:30', end_time: null, work_minutes: 0, worker: '박정비', description: '진공 시스템 점검 중', parts_used: '진공펌프 예정', cost: 0, status: 'IN_PROGRESS', next_due_date: null },
];

// 검색 필드 정의
const searchFields: SearchField[] = [
  {
    name: 'date_range',
    label: '작업기간',
    type: 'dateRange',
  },
  {
    name: 'line_code',
    label: '라인',
    type: 'select',
    options: [
      { value: 'SMT-L01', label: 'SMT Line 1' },
      { value: 'SMT-L02', label: 'SMT Line 2' },
      { value: 'THT-L01', label: 'THT Line 1' },
    ],
    placeholder: '전체',
  },
  {
    name: 'maintenance_type',
    label: '보전유형',
    type: 'select',
    options: [
      { value: 'PM', label: '예방보전' },
      { value: 'CM', label: '사후보전' },
      { value: 'CBM', label: '상태기반' },
    ],
    placeholder: '전체',
  },
  {
    name: 'equipment_code',
    label: '설비코드',
    type: 'text',
    placeholder: '설비코드',
  },
  {
    name: 'status',
    label: '상태',
    type: 'select',
    options: [
      { value: 'IN_PROGRESS', label: '진행중' },
      { value: 'COMPLETED', label: '완료' },
    ],
    placeholder: '전체',
  },
];

// 테이블 컬럼 정의
const columns: Column<MaintenanceHistory>[] = [
  { key: 'maintenance_no', header: '보전번호', width: '120px' },
  { key: 'work_date', header: '작업일자', width: '100px', align: 'center' },
  { key: 'equipment_code', header: '설비코드', width: '100px' },
  { key: 'equipment_name', header: '설비명', width: '140px' },
  {
    key: 'maintenance_type_name',
    header: '보전유형',
    width: '90px',
    align: 'center',
    render: (value, row) => {
      const color = row.maintenance_type === 'PM' ? 'bg-blue-500/20 text-blue-400' :
                    row.maintenance_type === 'CM' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-purple-500/20 text-purple-400';
      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{value}</span>;
    }
  },
  { key: 'description', header: '작업내용', width: '200px' },
  {
    key: 'work_minutes',
    header: '작업시간',
    width: '80px',
    align: 'right',
    render: (v) => v > 0 ? `${Math.floor(v / 60)}h ${v % 60}m` : '-'
  },
  { key: 'worker', header: '작업자', width: '80px', align: 'center' },
  { key: 'parts_used', header: '사용부품', width: '120px', render: (v) => v || '-' },
  {
    key: 'cost',
    header: '비용',
    width: '100px',
    align: 'right',
    render: (v) => v > 0 ? `₩${v.toLocaleString()}` : '-'
  },
  {
    key: 'status',
    header: '상태',
    width: '80px',
    align: 'center',
    render: (value) => {
      const statusMap: Record<string, { label: string; color: string }> = {
        IN_PROGRESS: { label: '진행중', color: 'bg-yellow-500/20 text-yellow-400' },
        COMPLETED: { label: '완료', color: 'bg-emerald-500/20 text-emerald-400' },
      };
      const info = statusMap[value] || { label: value, color: 'bg-slate-500/20 text-slate-400' };
      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>{info.label}</span>;
    },
  },
  { key: 'next_due_date', header: '다음예정일', width: '100px', align: 'center', render: (v) => v || '-' },
];

// 폼 필드 정의
const formFields: FormField[] = [
  { name: 'equipment_code', label: '설비', type: 'select', required: true, options: [
    { value: 'SMT-M01', label: 'SMT Mounter #1' },
    { value: 'SMT-M02', label: 'SMT Mounter #2' },
    { value: 'SMT-R01', label: 'Reflow Oven #1' },
    { value: 'AOI-01', label: 'AOI Inspector #1' },
    { value: 'THT-W01', label: 'Wave Solder #1' },
  ] },
  { name: 'maintenance_type', label: '보전유형', type: 'select', required: true, options: [
    { value: 'PM', label: '예방보전' },
    { value: 'CM', label: '사후보전' },
    { value: 'CBM', label: '상태기반' },
  ] },
  { name: 'work_date', label: '작업일자', type: 'date', required: true },
  { name: 'worker', label: '작업자', type: 'text', required: true },
  { name: 'description', label: '작업내용', type: 'textarea', required: true, fullWidth: true, rows: 3 },
  { name: 'parts_used', label: '사용부품', type: 'text' },
  { name: 'cost', label: '비용', type: 'number' },
];

export default function MaintenanceHistoryPage() {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<MaintenanceHistory[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredData = useMemo(() => {
    return mockHistory.filter((item) => {
      if (searchParams.line_code && item.line_code !== searchParams.line_code) return false;
      if (searchParams.maintenance_type && item.maintenance_type !== searchParams.maintenance_type) return false;
      if (searchParams.equipment_code && !item.equipment_code.includes(searchParams.equipment_code)) return false;
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

  const handleSave = (data: Record<string, any>) => {
    console.log('Save maintenance:', data);
    setIsModalOpen(false);
  };

  // 요약 통계
  const summary = useMemo(() => {
    const total = filteredData.length;
    const pmCount = filteredData.filter(r => r.maintenance_type === 'PM').length;
    const cmCount = filteredData.filter(r => r.maintenance_type === 'CM').length;
    const totalCost = filteredData.reduce((sum, r) => sum + r.cost, 0);
    const totalMinutes = filteredData.reduce((sum, r) => sum + r.work_minutes, 0);
    return { total, pmCount, cmCount, totalCost, totalMinutes };
  }, [filteredData]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="보전이력"
        description="설비 유지보수 이력을 관리합니다."
        actions={[
          { label: '새로고침', icon: 'refresh', onClick: () => console.log('Refresh') },
          { label: '다운로드', icon: 'download', onClick: () => console.log('Download') },
          { label: '보전등록', icon: 'add', variant: 'primary', onClick: () => setIsModalOpen(true) },
        ]}
      />

      <SearchForm fields={searchFields} onSearch={handleSearch} />

      {/* 요약 카드 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Wrench className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">총 보전 건수</p>
              <p className="text-2xl font-bold text-white">{summary.total}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Calendar className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">예방보전(PM)</p>
              <p className="text-2xl font-bold text-emerald-400">{summary.pmCount}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">사후보전(CM)</p>
              <p className="text-2xl font-bold text-orange-400">{summary.cmCount}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">총 작업시간</p>
          <p className="text-2xl font-bold text-white">
            {Math.floor(summary.totalMinutes / 60)}h {summary.totalMinutes % 60}m
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">총 비용</p>
          <p className="text-2xl font-bold text-yellow-400">₩{summary.totalCost.toLocaleString()}</p>
        </div>
      </div>

      {/* 데이터 테이블 */}
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

      {/* 보전 등록 모달 */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title="보전 등록"
        fields={formFields}
        mode="create"
      />
    </div>
  );
}
