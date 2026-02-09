/**
 * 작업지시관리 페이지
 * 작업지시 CRUD 및 상태 관리
 */
import { useState, useMemo } from 'react';
import { Play, Square, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader, SearchForm, DataGrid, FormModal } from '../../components/common';
import type { SearchField } from '../../components/common/SearchForm';
import type { Column } from '../../components/common/DataGrid';
import type { FormField } from '../../components/common/FormModal';

// 작업지시 타입
interface WorkOrder {
  id: number;
  order_no: string;
  order_date: string;
  plan_date: string;
  product_code: string;
  product_name: string;
  line_code: string;
  line_name: string;
  target_qty: number;
  actual_qty: number;
  defect_qty: number;
  status: string;
  priority: number;
  start_time?: string;
  end_time?: string;
  remarks?: string;
}

// Mock 데이터
const mockWorkOrders: WorkOrder[] = [
  { id: 1, order_no: 'WO-2024-0001', order_date: '2024-01-15', plan_date: '2024-01-15', product_code: 'MB-SM-001', product_name: '스마트폰 메인보드 A타입', line_code: 'SMT-L01', line_name: 'SMT Line 1', target_qty: 1000, actual_qty: 1000, defect_qty: 15, status: 'COMPLETED', priority: 1, start_time: '08:00', end_time: '16:30' },
  { id: 2, order_no: 'WO-2024-0002', order_date: '2024-01-15', plan_date: '2024-01-15', product_code: 'MB-SM-002', product_name: '스마트폰 메인보드 B타입', line_code: 'SMT-L02', line_name: 'SMT Line 2', target_qty: 800, actual_qty: 650, defect_qty: 8, status: 'IN_PROGRESS', priority: 1, start_time: '08:00' },
  { id: 3, order_no: 'WO-2024-0003', order_date: '2024-01-15', plan_date: '2024-01-15', product_code: 'PB-LED-001', product_name: 'LED 드라이버 보드', line_code: 'SMT-L03', line_name: 'SMT Line 3', target_qty: 2000, actual_qty: 0, defect_qty: 0, status: 'PENDING', priority: 2 },
  { id: 4, order_no: 'WO-2024-0004', order_date: '2024-01-15', plan_date: '2024-01-16', product_code: 'ECU-AUTO-001', product_name: '자동차 ECU 보드', line_code: 'SMT-L01', line_name: 'SMT Line 1', target_qty: 500, actual_qty: 0, defect_qty: 0, status: 'PENDING', priority: 1 },
  { id: 5, order_no: 'WO-2024-0005', order_date: '2024-01-15', plan_date: '2024-01-16', product_code: 'IOT-MOD-001', product_name: 'IoT 통신 모듈', line_code: 'SMT-L04', line_name: 'SMT Line 4', target_qty: 3000, actual_qty: 0, defect_qty: 0, status: 'PENDING', priority: 3 },
  { id: 6, order_no: 'WO-2024-0006', order_date: '2024-01-14', plan_date: '2024-01-14', product_code: 'MB-SM-001', product_name: '스마트폰 메인보드 A타입', line_code: 'SMT-L01', line_name: 'SMT Line 1', target_qty: 1200, actual_qty: 1200, defect_qty: 12, status: 'COMPLETED', priority: 1, start_time: '08:00', end_time: '18:00' },
  { id: 7, order_no: 'WO-2024-0007', order_date: '2024-01-14', plan_date: '2024-01-14', product_code: 'PB-LED-001', product_name: 'LED 드라이버 보드', line_code: 'SMT-L03', line_name: 'SMT Line 3', target_qty: 1500, actual_qty: 1500, defect_qty: 25, status: 'COMPLETED', priority: 2, start_time: '08:00', end_time: '15:30' },
  { id: 8, order_no: 'WO-2024-0008', order_date: '2024-01-16', plan_date: '2024-01-17', product_code: 'MB-SM-002', product_name: '스마트폰 메인보드 B타입', line_code: 'SMT-L02', line_name: 'SMT Line 2', target_qty: 600, actual_qty: 0, defect_qty: 0, status: 'PLANNED', priority: 1 },
];

// 검색 필드 정의
const searchFields: SearchField[] = [
  {
    name: 'plan_date',
    label: '계획일자',
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
      { value: 'SMT-L04', label: 'SMT Line 4' },
    ],
    placeholder: '전체',
  },
  {
    name: 'status',
    label: '상태',
    type: 'select',
    options: [
      { value: 'PLANNED', label: '계획' },
      { value: 'PENDING', label: '대기' },
      { value: 'IN_PROGRESS', label: '진행중' },
      { value: 'COMPLETED', label: '완료' },
      { value: 'CANCELLED', label: '취소' },
    ],
    placeholder: '전체',
  },
  {
    name: 'order_no',
    label: '작업지시번호',
    type: 'text',
    placeholder: '작업지시번호',
  },
  {
    name: 'product_name',
    label: '제품명',
    type: 'text',
    placeholder: '제품명 입력',
  },
];

// 테이블 컬럼 정의
const columns: Column<WorkOrder>[] = [
  { key: 'order_no', header: '작업지시번호', width: '130px' },
  { key: 'plan_date', header: '계획일', width: '100px', align: 'center' },
  { key: 'product_code', header: '제품코드', width: '110px' },
  { key: 'product_name', header: '제품명', width: '200px' },
  { key: 'line_name', header: '라인', width: '100px' },
  {
    key: 'priority',
    header: '우선순위',
    width: '70px',
    align: 'center',
    render: (value) => {
      const colors = ['', 'text-red-400', 'text-yellow-400', 'text-blue-400'];
      return <span className={`font-bold ${colors[value] || ''}`}>{value}</span>;
    },
  },
  {
    key: 'target_qty',
    header: '목표수량',
    width: '90px',
    align: 'right',
    render: (value) => value?.toLocaleString(),
  },
  {
    key: 'actual_qty',
    header: '생산수량',
    width: '90px',
    align: 'right',
    render: (value) => value?.toLocaleString(),
  },
  {
    key: 'progress',
    header: '진척률',
    width: '100px',
    render: (_, row) => {
      const progress = row.target_qty > 0 ? (row.actual_qty / row.target_qty) * 100 : 0;
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : progress >= 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 w-10 text-right">{progress.toFixed(0)}%</span>
        </div>
      );
    },
  },
  {
    key: 'status',
    header: '상태',
    width: '80px',
    align: 'center',
    render: (value) => {
      const statusMap: Record<string, { label: string; color: string }> = {
        PLANNED: { label: '계획', color: 'bg-slate-500/20 text-slate-400' },
        PENDING: { label: '대기', color: 'bg-yellow-500/20 text-yellow-400' },
        IN_PROGRESS: { label: '진행중', color: 'bg-blue-500/20 text-blue-400' },
        COMPLETED: { label: '완료', color: 'bg-emerald-500/20 text-emerald-400' },
        CANCELLED: { label: '취소', color: 'bg-red-500/20 text-red-400' },
      };
      const info = statusMap[value] || { label: value, color: 'bg-slate-500/20 text-slate-400' };
      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>{info.label}</span>;
    },
  },
  {
    key: 'actions',
    header: '작업',
    width: '120px',
    align: 'center',
    sortable: false,
    render: (_, row) => (
      <div className="flex items-center justify-center gap-1">
        {row.status === 'PENDING' && (
          <button
            onClick={(e) => { e.stopPropagation(); console.log('Start:', row.id); }}
            className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded transition-colors"
            title="작업 시작"
          >
            <Play size={16} />
          </button>
        )}
        {row.status === 'IN_PROGRESS' && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); console.log('Complete:', row.id); }}
              className="p-1 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
              title="완료 처리"
            >
              <CheckCircle size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); console.log('Stop:', row.id); }}
              className="p-1 text-yellow-400 hover:bg-yellow-500/20 rounded transition-colors"
              title="일시 정지"
            >
              <Square size={16} />
            </button>
          </>
        )}
        {(row.status === 'PLANNED' || row.status === 'PENDING') && (
          <button
            onClick={(e) => { e.stopPropagation(); console.log('Cancel:', row.id); }}
            className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
            title="취소"
          >
            <XCircle size={16} />
          </button>
        )}
      </div>
    ),
  },
];

// 폼 필드 정의
const formFields: FormField[] = [
  {
    name: 'order_no',
    label: '작업지시번호',
    type: 'text',
    required: true,
    placeholder: '자동 생성',
    readOnly: true,
  },
  {
    name: 'order_date',
    label: '지시일자',
    type: 'date',
    required: true,
  },
  {
    name: 'plan_date',
    label: '계획일자',
    type: 'date',
    required: true,
  },
  {
    name: 'priority',
    label: '우선순위',
    type: 'select',
    required: true,
    options: [
      { value: '1', label: '1 (긴급)' },
      { value: '2', label: '2 (일반)' },
      { value: '3', label: '3 (낮음)' },
    ],
  },
  {
    name: 'product_code',
    label: '제품',
    type: 'select',
    required: true,
    options: [
      { value: 'MB-SM-001', label: 'MB-SM-001 - 스마트폰 메인보드 A타입' },
      { value: 'MB-SM-002', label: 'MB-SM-002 - 스마트폰 메인보드 B타입' },
      { value: 'PB-LED-001', label: 'PB-LED-001 - LED 드라이버 보드' },
      { value: 'ECU-AUTO-001', label: 'ECU-AUTO-001 - 자동차 ECU 보드' },
      { value: 'IOT-MOD-001', label: 'IOT-MOD-001 - IoT 통신 모듈' },
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
      { value: 'SMT-L03', label: 'SMT Line 3' },
      { value: 'SMT-L04', label: 'SMT Line 4' },
    ],
  },
  {
    name: 'target_qty',
    label: '목표수량',
    type: 'number',
    required: true,
    placeholder: '0',
  },
  {
    name: 'status',
    label: '상태',
    type: 'select',
    required: true,
    options: [
      { value: 'PLANNED', label: '계획' },
      { value: 'PENDING', label: '대기' },
    ],
  },
  {
    name: 'remarks',
    label: '비고',
    type: 'textarea',
    span: 2,
    placeholder: '특이사항 입력',
  },
];

export default function WorkOrderPage() {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<WorkOrder[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingItem, setEditingItem] = useState<WorkOrder | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filteredData = useMemo(() => {
    return mockWorkOrders.filter((item) => {
      if (searchParams.line_code && item.line_code !== searchParams.line_code) return false;
      if (searchParams.status && item.status !== searchParams.status) return false;
      if (searchParams.order_no && !item.order_no.toLowerCase().includes(searchParams.order_no.toLowerCase())) return false;
      if (searchParams.product_name && !item.product_name.includes(searchParams.product_name)) return false;
      // Date range filter
      if (searchParams.plan_date_from && item.plan_date < searchParams.plan_date_from) return false;
      if (searchParams.plan_date_to && item.plan_date > searchParams.plan_date_to) return false;
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

  const handleEdit = (row: WorkOrder) => {
    setModalMode('edit');
    setEditingItem(row);
    setModalOpen(true);
  };

  const handleView = (row: WorkOrder) => {
    setModalMode('view');
    setEditingItem(row);
    setModalOpen(true);
  };

  const handleDelete = () => {
    if (selectedRows.length === 0) {
      alert('삭제할 항목을 선택하세요.');
      return;
    }
    // 완료된 작업지시는 삭제 불가
    const hasCompleted = selectedRows.some((r) => r.status === 'COMPLETED' || r.status === 'IN_PROGRESS');
    if (hasCompleted) {
      alert('진행중이거나 완료된 작업지시는 삭제할 수 없습니다.');
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

  // 오늘 날짜 기본값
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <PageHeader
        title="작업지시관리"
        description="생산 작업지시를 등록하고 관리합니다."
        actions={[
          { label: '삭제', icon: 'delete', variant: 'danger', onClick: handleDelete, disabled: selectedRows.length === 0 },
          { label: '엑셀 다운로드', icon: 'download', onClick: () => console.log('Download') },
          { label: '인쇄', icon: 'print', onClick: () => console.log('Print') },
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
        title={modalMode === 'create' ? '작업지시 등록' : modalMode === 'edit' ? '작업지시 수정' : '작업지시 상세'}
        fields={formFields}
        initialValues={editingItem || {
          order_no: `WO-${new Date().getFullYear()}-${String(mockWorkOrders.length + 1).padStart(4, '0')}`,
          order_date: today,
          plan_date: today,
          status: 'PLANNED',
          priority: '2',
        }}
        onSubmit={handleSubmit}
        mode={modalMode}
        width="lg"
      />
    </div>
  );
}
