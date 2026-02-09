/**
 * 비가동등록 페이지
 * 설비 비가동 이력을 등록하고 관리
 */
import { useState, useMemo } from 'react';
import { PageHeader, SearchForm, DataGrid, FormModal } from '../../components/common';
import type { SearchField } from '../../components/common/SearchForm';
import type { Column } from '../../components/common/DataGrid';
import type { FormField } from '../../components/common/FormModal';

// 비가동 타입
interface DowntimeRecord {
  id: number;
  equipment_code: string;
  equipment_name: string;
  line_code: string;
  line_name: string;
  downtime_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  reason_code: string;
  reason_name: string;
  category: string;
  description: string;
  action_taken: string;
  worker_name: string;
  status: string;
}

// Mock 데이터
const mockDowntimes: DowntimeRecord[] = [
  { id: 1, equipment_code: 'SMT-L01-M02', equipment_name: 'Chip Mounter CM-01', line_code: 'SMT-L01', line_name: 'SMT Line 1', downtime_date: '2024-01-15', start_time: '09:30', end_time: '10:15', duration_minutes: 45, reason_code: 'FEEDER', reason_name: '피더 교체', category: 'SETUP', description: '피더 불량으로 인한 교체', action_taken: '피더 교체 완료', worker_name: '김철수', status: 'COMPLETED' },
  { id: 2, equipment_code: 'SMT-L01-M04', equipment_name: 'Reflow Oven RF-01', line_code: 'SMT-L01', line_name: 'SMT Line 1', downtime_date: '2024-01-15', start_time: '11:00', end_time: '11:30', duration_minutes: 30, reason_code: 'TEMP', reason_name: '온도 조정', category: 'ADJUSTMENT', description: '프로파일 온도 재설정', action_taken: '온도 프로파일 조정', worker_name: '김철수', status: 'COMPLETED' },
  { id: 3, equipment_code: 'SMT-L02-M02', equipment_name: 'Chip Mounter CM-03', line_code: 'SMT-L02', line_name: 'SMT Line 2', downtime_date: '2024-01-15', start_time: '14:00', end_time: '15:30', duration_minutes: 90, reason_code: 'BREAKDOWN', reason_name: '설비 고장', category: 'BREAKDOWN', description: '노즐 구동부 이상', action_taken: '노즐 유닛 교체', worker_name: '이영희', status: 'COMPLETED' },
  { id: 4, equipment_code: 'SMT-L01-M05', equipment_name: 'AOI Inspector AOI-01', line_code: 'SMT-L01', line_name: 'SMT Line 1', downtime_date: '2024-01-15', start_time: '16:00', end_time: '', duration_minutes: 0, reason_code: 'PM', reason_name: '정기 점검', category: 'PM', description: '주간 정기 점검', action_taken: '', worker_name: '박민수', status: 'IN_PROGRESS' },
  { id: 5, equipment_code: 'SMT-L03-M01', equipment_name: 'Screen Printer SP-03', line_code: 'SMT-L03', line_name: 'SMT Line 3', downtime_date: '2024-01-15', start_time: '08:30', end_time: '08:45', duration_minutes: 15, reason_code: 'MATERIAL', reason_name: '자재 대기', category: 'WAITING', description: '솔더 페이스트 교체 대기', action_taken: '자재 수급 완료', worker_name: '최동훈', status: 'COMPLETED' },
];

// 검색 필드 정의
const searchFields: SearchField[] = [
  {
    name: 'downtime_date',
    label: '발생일자',
    type: 'dateRange',
  },
  {
    name: 'line_code',
    label: '라인',
    type: 'select',
    options: [
      { value: 'SMT-L01', label: 'SMT Line 1' },
      { value: 'SMT-L02', label: 'SMT Line 2' },
      { value: 'SMT-L03', label: 'SMT Line 3' },
    ],
    placeholder: '전체',
  },
  {
    name: 'category',
    label: '비가동유형',
    type: 'select',
    options: [
      { value: 'BREAKDOWN', label: '고장' },
      { value: 'PM', label: '정기점검' },
      { value: 'SETUP', label: '셋업' },
      { value: 'ADJUSTMENT', label: '조정' },
      { value: 'WAITING', label: '대기' },
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
const columns: Column<DowntimeRecord>[] = [
  { key: 'downtime_date', header: '발생일자', width: '100px', align: 'center' },
  { key: 'line_name', header: '라인', width: '100px' },
  { key: 'equipment_code', header: '설비코드', width: '130px' },
  { key: 'equipment_name', header: '설비명', width: '180px' },
  {
    key: 'category',
    header: '유형',
    width: '80px',
    align: 'center',
    render: (value) => {
      const categoryMap: Record<string, { label: string; color: string }> = {
        BREAKDOWN: { label: '고장', color: 'bg-red-500/20 text-red-400' },
        PM: { label: '점검', color: 'bg-blue-500/20 text-blue-400' },
        SETUP: { label: '셋업', color: 'bg-yellow-500/20 text-yellow-400' },
        ADJUSTMENT: { label: '조정', color: 'bg-purple-500/20 text-purple-400' },
        WAITING: { label: '대기', color: 'bg-slate-500/20 text-slate-400' },
      };
      const info = categoryMap[value] || { label: value, color: 'bg-slate-500/20 text-slate-400' };
      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>{info.label}</span>;
    },
  },
  { key: 'reason_name', header: '사유', width: '120px' },
  { key: 'start_time', header: '시작', width: '70px', align: 'center' },
  { key: 'end_time', header: '종료', width: '70px', align: 'center', render: (v) => v || '-' },
  {
    key: 'duration_minutes',
    header: '시간(분)',
    width: '80px',
    align: 'right',
    render: (v, row) => {
      if (row.status === 'IN_PROGRESS') {
        return <span className="text-yellow-400">진행중</span>;
      }
      return v?.toLocaleString();
    },
  },
  { key: 'worker_name', header: '담당자', width: '80px', align: 'center' },
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
];

// 폼 필드 정의
const formFields: FormField[] = [
  {
    name: 'equipment_code',
    label: '설비',
    type: 'select',
    required: true,
    options: [
      { value: 'SMT-L01-M01', label: 'SMT-L01-M01 - Screen Printer SP-01' },
      { value: 'SMT-L01-M02', label: 'SMT-L01-M02 - Chip Mounter CM-01' },
      { value: 'SMT-L01-M03', label: 'SMT-L01-M03 - Chip Mounter CM-02' },
      { value: 'SMT-L01-M04', label: 'SMT-L01-M04 - Reflow Oven RF-01' },
      { value: 'SMT-L01-M05', label: 'SMT-L01-M05 - AOI Inspector AOI-01' },
    ],
  },
  {
    name: 'downtime_date',
    label: '발생일자',
    type: 'date',
    required: true,
  },
  {
    name: 'start_time',
    label: '시작시간',
    type: 'text',
    required: true,
    placeholder: 'HH:MM',
  },
  {
    name: 'end_time',
    label: '종료시간',
    type: 'text',
    placeholder: 'HH:MM (진행중이면 비워둠)',
  },
  {
    name: 'category',
    label: '비가동유형',
    type: 'select',
    required: true,
    options: [
      { value: 'BREAKDOWN', label: '고장' },
      { value: 'PM', label: '정기점검' },
      { value: 'SETUP', label: '셋업' },
      { value: 'ADJUSTMENT', label: '조정' },
      { value: 'WAITING', label: '대기' },
    ],
  },
  {
    name: 'reason_code',
    label: '사유코드',
    type: 'select',
    required: true,
    options: [
      { value: 'BREAKDOWN', label: '설비 고장' },
      { value: 'FEEDER', label: '피더 교체' },
      { value: 'NOZZLE', label: '노즐 교체' },
      { value: 'TEMP', label: '온도 조정' },
      { value: 'PM', label: '정기 점검' },
      { value: 'MATERIAL', label: '자재 대기' },
      { value: 'OTHER', label: '기타' },
    ],
  },
  {
    name: 'worker_name',
    label: '담당자',
    type: 'text',
    required: true,
    placeholder: '담당자명',
  },
  {
    name: 'status',
    label: '상태',
    type: 'select',
    required: true,
    options: [
      { value: 'IN_PROGRESS', label: '진행중' },
      { value: 'COMPLETED', label: '완료' },
    ],
  },
  {
    name: 'description',
    label: '상세내용',
    type: 'textarea',
    span: 2,
    placeholder: '비가동 상세 내용 입력',
  },
  {
    name: 'action_taken',
    label: '조치내용',
    type: 'textarea',
    span: 2,
    placeholder: '조치 내용 입력',
  },
];

export default function DowntimePage() {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<DowntimeRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingItem, setEditingItem] = useState<DowntimeRecord | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filteredData = useMemo(() => {
    return mockDowntimes.filter((item) => {
      if (searchParams.line_code && item.line_code !== searchParams.line_code) return false;
      if (searchParams.category && item.category !== searchParams.category) return false;
      if (searchParams.equipment_code && !item.equipment_code.includes(searchParams.equipment_code)) return false;
      if (searchParams.status && item.status !== searchParams.status) return false;
      if (searchParams.downtime_date_from && item.downtime_date < searchParams.downtime_date_from) return false;
      if (searchParams.downtime_date_to && item.downtime_date > searchParams.downtime_date_to) return false;
      return true;
    });
  }, [searchParams]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // 요약 통계
  const summary = useMemo(() => {
    const totalMinutes = filteredData.filter(r => r.status === 'COMPLETED').reduce((sum, r) => sum + r.duration_minutes, 0);
    const breakdownCount = filteredData.filter(r => r.category === 'BREAKDOWN').length;
    const inProgressCount = filteredData.filter(r => r.status === 'IN_PROGRESS').length;
    return {
      count: filteredData.length,
      totalMinutes,
      totalHours: Math.floor(totalMinutes / 60),
      remainingMinutes: totalMinutes % 60,
      breakdownCount,
      inProgressCount,
    };
  }, [filteredData]);

  const handleSearch = (values: Record<string, any>) => {
    setSearchParams(values);
    setPage(1);
  };

  const handleCreate = () => {
    setModalMode('create');
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEdit = (row: DowntimeRecord) => {
    setModalMode('edit');
    setEditingItem(row);
    setModalOpen(true);
  };

  const handleView = (row: DowntimeRecord) => {
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

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <PageHeader
        title="비가동등록"
        description="설비 비가동 이력을 등록하고 관리합니다."
        actions={[
          { label: '삭제', icon: 'delete', variant: 'danger', onClick: handleDelete, disabled: selectedRows.length === 0 },
          { label: '엑셀 다운로드', icon: 'download', onClick: () => console.log('Download') },
          { label: '신규 등록', icon: 'add', variant: 'primary', onClick: handleCreate },
        ]}
      />

      <SearchForm fields={searchFields} onSearch={handleSearch} />

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">총 비가동 건수</p>
          <p className="text-2xl font-bold text-white">{summary.count}건</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">총 비가동 시간</p>
          <p className="text-2xl font-bold text-yellow-400">
            {summary.totalHours}시간 {summary.remainingMinutes}분
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">고장 건수</p>
          <p className="text-2xl font-bold text-red-400">{summary.breakdownCount}건</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">진행중</p>
          <p className="text-2xl font-bold text-blue-400">{summary.inProgressCount}건</p>
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
        title={modalMode === 'create' ? '비가동 등록' : modalMode === 'edit' ? '비가동 수정' : '비가동 상세'}
        fields={formFields}
        initialValues={editingItem || { downtime_date: today, status: 'IN_PROGRESS' }}
        onSubmit={handleSubmit}
        mode={modalMode}
        width="lg"
      />
    </div>
  );
}
