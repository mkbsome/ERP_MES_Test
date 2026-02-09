/**
 * 실적등록 페이지
 * 생산 실적을 등록하고 관리
 */
import { useState, useMemo } from 'react';
import { Plus, Save, Trash2, RefreshCw } from 'lucide-react';
import { PageHeader, SearchForm, DataGrid } from '../../components/common';
import type { SearchField } from '../../components/common/SearchForm';
import type { Column } from '../../components/common/DataGrid';

// 실적 타입
interface ProductionResult {
  id: number;
  work_order_no: string;
  product_code: string;
  product_name: string;
  line_code: string;
  line_name: string;
  work_date: string;
  shift: string;
  worker_name: string;
  target_qty: number;
  good_qty: number;
  defect_qty: number;
  start_time: string;
  end_time: string;
  status: string;
}

// Mock 데이터
const mockResults: ProductionResult[] = [
  { id: 1, work_order_no: 'WO-2024-0001', product_code: 'MB-SM-001', product_name: '스마트폰 메인보드 A타입', line_code: 'SMT-L01', line_name: 'SMT Line 1', work_date: '2024-01-15', shift: 'DAY', worker_name: '김철수', target_qty: 500, good_qty: 485, defect_qty: 8, start_time: '08:00', end_time: '12:00', status: 'CONFIRMED' },
  { id: 2, work_order_no: 'WO-2024-0001', product_code: 'MB-SM-001', product_name: '스마트폰 메인보드 A타입', line_code: 'SMT-L01', line_name: 'SMT Line 1', work_date: '2024-01-15', shift: 'DAY', worker_name: '김철수', target_qty: 500, good_qty: 508, defect_qty: 7, start_time: '13:00', end_time: '16:30', status: 'CONFIRMED' },
  { id: 3, work_order_no: 'WO-2024-0002', product_code: 'MB-SM-002', product_name: '스마트폰 메인보드 B타입', line_code: 'SMT-L02', line_name: 'SMT Line 2', work_date: '2024-01-15', shift: 'DAY', worker_name: '이영희', target_qty: 400, good_qty: 320, defect_qty: 5, start_time: '08:00', end_time: '14:00', status: 'DRAFT' },
  { id: 4, work_order_no: 'WO-2024-0002', product_code: 'MB-SM-002', product_name: '스마트폰 메인보드 B타입', line_code: 'SMT-L02', line_name: 'SMT Line 2', work_date: '2024-01-15', shift: 'DAY', worker_name: '이영희', target_qty: 400, good_qty: 330, defect_qty: 3, start_time: '14:30', end_time: '18:00', status: 'DRAFT' },
  { id: 5, work_order_no: 'WO-2024-0003', product_code: 'PB-LED-001', product_name: 'LED 드라이버 보드', line_code: 'SMT-L03', line_name: 'SMT Line 3', work_date: '2024-01-15', shift: 'NIGHT', worker_name: '박민수', target_qty: 1000, good_qty: 980, defect_qty: 15, start_time: '20:00', end_time: '04:00', status: 'CONFIRMED' },
];

// 검색 필드 정의
const searchFields: SearchField[] = [
  {
    name: 'work_date',
    label: '작업일자',
    type: 'date',
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
    name: 'shift',
    label: '근무조',
    type: 'select',
    options: [
      { value: 'DAY', label: '주간' },
      { value: 'NIGHT', label: '야간' },
    ],
    placeholder: '전체',
  },
  {
    name: 'work_order_no',
    label: '작업지시번호',
    type: 'text',
    placeholder: '작업지시번호',
  },
  {
    name: 'status',
    label: '상태',
    type: 'select',
    options: [
      { value: 'DRAFT', label: '임시저장' },
      { value: 'CONFIRMED', label: '확정' },
    ],
    placeholder: '전체',
  },
];

// 테이블 컬럼 정의
const columns: Column<ProductionResult>[] = [
  { key: 'work_order_no', header: '작업지시번호', width: '130px' },
  { key: 'work_date', header: '작업일자', width: '100px', align: 'center' },
  { key: 'shift', header: '근무조', width: '70px', align: 'center', render: (v) => v === 'DAY' ? '주간' : '야간' },
  { key: 'product_code', header: '제품코드', width: '110px' },
  { key: 'product_name', header: '제품명', width: '180px' },
  { key: 'line_name', header: '라인', width: '100px' },
  { key: 'worker_name', header: '작업자', width: '80px', align: 'center' },
  { key: 'start_time', header: '시작시간', width: '80px', align: 'center' },
  { key: 'end_time', header: '종료시간', width: '80px', align: 'center' },
  { key: 'good_qty', header: '양품수량', width: '90px', align: 'right', render: (v) => v?.toLocaleString() },
  { key: 'defect_qty', header: '불량수량', width: '90px', align: 'right', render: (v) => <span className="text-red-400">{v?.toLocaleString()}</span> },
  {
    key: 'defect_rate',
    header: '불량률',
    width: '70px',
    align: 'right',
    render: (_, row) => {
      const total = row.good_qty + row.defect_qty;
      const rate = total > 0 ? (row.defect_qty / total) * 100 : 0;
      return <span className={rate > 2 ? 'text-red-400' : 'text-slate-400'}>{rate.toFixed(2)}%</span>;
    },
  },
  {
    key: 'status',
    header: '상태',
    width: '80px',
    align: 'center',
    render: (value) => {
      const statusMap: Record<string, { label: string; color: string }> = {
        DRAFT: { label: '임시', color: 'bg-yellow-500/20 text-yellow-400' },
        CONFIRMED: { label: '확정', color: 'bg-emerald-500/20 text-emerald-400' },
      };
      const info = statusMap[value] || { label: value, color: 'bg-slate-500/20 text-slate-400' };
      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>{info.label}</span>;
    },
  },
];

export default function ProductionResultPage() {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<ProductionResult[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filteredData = useMemo(() => {
    return mockResults.filter((item) => {
      if (searchParams.work_date && item.work_date !== searchParams.work_date) return false;
      if (searchParams.line_code && item.line_code !== searchParams.line_code) return false;
      if (searchParams.shift && item.shift !== searchParams.shift) return false;
      if (searchParams.work_order_no && !item.work_order_no.includes(searchParams.work_order_no)) return false;
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

  const handleConfirm = () => {
    if (selectedRows.length === 0) {
      alert('확정할 항목을 선택하세요.');
      return;
    }
    const draftRows = selectedRows.filter(r => r.status === 'DRAFT');
    if (draftRows.length === 0) {
      alert('임시저장 상태의 항목만 확정할 수 있습니다.');
      return;
    }
    if (confirm(`선택한 ${draftRows.length}개 항목을 확정하시겠습니까?`)) {
      console.log('Confirm:', draftRows);
      setSelectedRows([]);
    }
  };

  const handleDelete = () => {
    if (selectedRows.length === 0) {
      alert('삭제할 항목을 선택하세요.');
      return;
    }
    const draftRows = selectedRows.filter(r => r.status === 'DRAFT');
    if (draftRows.length === 0) {
      alert('임시저장 상태의 항목만 삭제할 수 있습니다.');
      return;
    }
    if (confirm(`선택한 ${draftRows.length}개 항목을 삭제하시겠습니까?`)) {
      console.log('Delete:', draftRows);
      setSelectedRows([]);
    }
  };

  // 요약 통계
  const summary = useMemo(() => {
    const totalGood = filteredData.reduce((sum, r) => sum + r.good_qty, 0);
    const totalDefect = filteredData.reduce((sum, r) => sum + r.defect_qty, 0);
    const total = totalGood + totalDefect;
    return {
      count: filteredData.length,
      totalGood,
      totalDefect,
      defectRate: total > 0 ? (totalDefect / total) * 100 : 0,
    };
  }, [filteredData]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="실적등록"
        description="생산 실적을 등록하고 확정합니다."
        actions={[
          { label: '삭제', icon: 'delete', variant: 'danger', onClick: handleDelete, disabled: selectedRows.length === 0 },
          { label: '새로고침', icon: 'refresh', onClick: () => console.log('Refresh') },
          { label: '실적확정', icon: 'add', variant: 'primary', onClick: handleConfirm },
        ]}
      />

      <SearchForm fields={searchFields} onSearch={handleSearch} />

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">총 실적 건수</p>
          <p className="text-2xl font-bold text-white">{summary.count}건</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">양품 합계</p>
          <p className="text-2xl font-bold text-emerald-400">{summary.totalGood.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">불량 합계</p>
          <p className="text-2xl font-bold text-red-400">{summary.totalDefect.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">불량률</p>
          <p className={`text-2xl font-bold ${summary.defectRate > 2 ? 'text-red-400' : 'text-emerald-400'}`}>
            {summary.defectRate.toFixed(2)}%
          </p>
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
    </div>
  );
}
