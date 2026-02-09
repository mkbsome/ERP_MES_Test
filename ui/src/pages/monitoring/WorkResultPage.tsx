/**
 * 작업실적현황 페이지
 * 실시간 작업 실적 모니터링
 */
import { useState, useMemo } from 'react';
import { RefreshCw, TrendingUp, Package, AlertCircle } from 'lucide-react';
import { PageHeader, SearchForm, DataGrid } from '../../components/common';
import type { SearchField } from '../../components/common/SearchForm';
import type { Column } from '../../components/common/DataGrid';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

// 작업실적 타입
interface WorkResult {
  id: number;
  work_order_no: string;
  product_code: string;
  product_name: string;
  line_code: string;
  line_name: string;
  work_date: string;
  shift: string;
  plan_qty: number;
  good_qty: number;
  defect_qty: number;
  achievement_rate: number;
  defect_rate: number;
  status: string;
}

// Mock 데이터
const mockData: WorkResult[] = [
  { id: 1, work_order_no: 'WO-2024-0001', product_code: 'MB-SM-001', product_name: '스마트폰 메인보드 A타입', line_code: 'SMT-L01', line_name: 'SMT Line 1', work_date: '2024-01-15', shift: 'DAY', plan_qty: 1000, good_qty: 993, defect_qty: 15, achievement_rate: 100.8, defect_rate: 1.49, status: 'COMPLETED' },
  { id: 2, work_order_no: 'WO-2024-0002', product_code: 'MB-SM-002', product_name: '스마트폰 메인보드 B타입', line_code: 'SMT-L02', line_name: 'SMT Line 2', work_date: '2024-01-15', shift: 'DAY', plan_qty: 800, good_qty: 650, defect_qty: 8, achievement_rate: 82.3, defect_rate: 1.22, status: 'IN_PROGRESS' },
  { id: 3, work_order_no: 'WO-2024-0003', product_code: 'PB-LED-001', product_name: 'LED 드라이버 보드', line_code: 'SMT-L03', line_name: 'SMT Line 3', work_date: '2024-01-15', shift: 'NIGHT', plan_qty: 2000, good_qty: 1980, defect_qty: 25, achievement_rate: 100.3, defect_rate: 1.25, status: 'COMPLETED' },
  { id: 4, work_order_no: 'WO-2024-0004', product_code: 'ECU-AUTO-001', product_name: '자동차 ECU 모듈', line_code: 'SMT-L04', line_name: 'SMT Line 4', work_date: '2024-01-15', shift: 'DAY', plan_qty: 500, good_qty: 320, defect_qty: 5, achievement_rate: 65.0, defect_rate: 1.54, status: 'IN_PROGRESS' },
  { id: 5, work_order_no: 'WO-2024-0005', product_code: 'IOT-MOD-001', product_name: 'IoT 통신모듈', line_code: 'SMT-L05', line_name: 'SMT Line 5', work_date: '2024-01-15', shift: 'DAY', plan_qty: 1500, good_qty: 1485, defect_qty: 18, achievement_rate: 100.2, defect_rate: 1.20, status: 'COMPLETED' },
  { id: 6, work_order_no: 'WO-2024-0006', product_code: 'PB-PWR-001', product_name: '전원보드', line_code: 'THT-L01', line_name: 'THT Line 1', work_date: '2024-01-15', shift: 'DAY', plan_qty: 600, good_qty: 580, defect_qty: 12, achievement_rate: 98.7, defect_rate: 2.03, status: 'COMPLETED' },
];

// 시간대별 생산량 데이터
const hourlyProductionData = [
  { hour: '08:00', plan: 120, actual: 115, defect: 2 },
  { hour: '09:00', plan: 120, actual: 122, defect: 1 },
  { hour: '10:00', plan: 120, actual: 118, defect: 3 },
  { hour: '11:00', plan: 120, actual: 125, defect: 2 },
  { hour: '12:00', plan: 60, actual: 58, defect: 1 },
  { hour: '13:00', plan: 120, actual: 121, defect: 2 },
  { hour: '14:00', plan: 120, actual: 119, defect: 2 },
  { hour: '15:00', plan: 120, actual: 123, defect: 1 },
  { hour: '16:00', plan: 120, actual: 117, defect: 3 },
  { hour: '17:00', plan: 120, actual: 115, defect: 2 },
];

// 라인별 달성률 데이터
const lineAchievementData = [
  { line: 'SMT L1', achievement: 100.8, defectRate: 1.49 },
  { line: 'SMT L2', achievement: 82.3, defectRate: 1.22 },
  { line: 'SMT L3', achievement: 100.3, defectRate: 1.25 },
  { line: 'SMT L4', achievement: 65.0, defectRate: 1.54 },
  { line: 'SMT L5', achievement: 100.2, defectRate: 1.20 },
  { line: 'THT L1', achievement: 98.7, defectRate: 2.03 },
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
      { value: 'SMT-L05', label: 'SMT Line 5' },
      { value: 'THT-L01', label: 'THT Line 1' },
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
const columns: Column<WorkResult>[] = [
  { key: 'work_order_no', header: '작업지시번호', width: '130px' },
  { key: 'product_code', header: '제품코드', width: '120px' },
  { key: 'product_name', header: '제품명', width: '180px' },
  { key: 'line_name', header: '라인', width: '100px' },
  { key: 'shift', header: '근무조', width: '70px', align: 'center', render: (v) => v === 'DAY' ? '주간' : '야간' },
  { key: 'plan_qty', header: '계획수량', width: '90px', align: 'right', render: (v) => v?.toLocaleString() },
  { key: 'good_qty', header: '양품수량', width: '90px', align: 'right', render: (v) => v?.toLocaleString() },
  { key: 'defect_qty', header: '불량수량', width: '80px', align: 'right', render: (v) => <span className="text-red-400">{v?.toLocaleString()}</span> },
  {
    key: 'achievement_rate',
    header: '달성률',
    width: '120px',
    align: 'center',
    render: (v) => (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${v >= 100 ? 'bg-emerald-500' : v >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(v, 100)}%` }}
          />
        </div>
        <span className={`text-xs w-14 text-right ${v >= 100 ? 'text-emerald-400' : v >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
          {v.toFixed(1)}%
        </span>
      </div>
    ),
  },
  {
    key: 'defect_rate',
    header: '불량률',
    width: '80px',
    align: 'right',
    render: (v) => <span className={v > 2 ? 'text-red-400' : 'text-slate-400'}>{v.toFixed(2)}%</span>
  },
  {
    key: 'status',
    header: '상태',
    width: '80px',
    align: 'center',
    render: (value) => {
      const statusMap: Record<string, { label: string; color: string }> = {
        IN_PROGRESS: { label: '진행중', color: 'bg-blue-500/20 text-blue-400' },
        COMPLETED: { label: '완료', color: 'bg-emerald-500/20 text-emerald-400' },
      };
      const info = statusMap[value] || { label: value, color: 'bg-slate-500/20 text-slate-400' };
      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>{info.label}</span>;
    },
  },
];

export default function WorkResultPage() {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filteredData = useMemo(() => {
    return mockData.filter((item) => {
      if (searchParams.work_date && item.work_date !== searchParams.work_date) return false;
      if (searchParams.line_code && item.line_code !== searchParams.line_code) return false;
      if (searchParams.shift && item.shift !== searchParams.shift) return false;
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

  // 요약 통계
  const summary = useMemo(() => {
    const totalPlan = filteredData.reduce((sum, r) => sum + r.plan_qty, 0);
    const totalGood = filteredData.reduce((sum, r) => sum + r.good_qty, 0);
    const totalDefect = filteredData.reduce((sum, r) => sum + r.defect_qty, 0);
    const avgAchievement = filteredData.length > 0
      ? filteredData.reduce((sum, r) => sum + r.achievement_rate, 0) / filteredData.length
      : 0;
    const avgDefectRate = filteredData.length > 0
      ? filteredData.reduce((sum, r) => sum + r.defect_rate, 0) / filteredData.length
      : 0;
    return { totalPlan, totalGood, totalDefect, avgAchievement, avgDefectRate };
  }, [filteredData]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="작업실적현황"
        description="실시간 작업 실적을 모니터링합니다."
        actions={[
          { label: '새로고침', icon: 'refresh', onClick: () => console.log('Refresh') },
          { label: '다운로드', icon: 'download', onClick: () => console.log('Download') },
        ]}
      />

      <SearchForm fields={searchFields} onSearch={handleSearch} />

      {/* 요약 카드 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Package className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-blue-300">계획수량</p>
              <p className="text-2xl font-bold text-blue-400">{summary.totalPlan.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-700/10 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-emerald-300">양품수량</p>
              <p className="text-2xl font-bold text-emerald-400">{summary.totalGood.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-600/20 to-red-700/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-red-300">불량수량</p>
              <p className="text-2xl font-bold text-red-400">{summary.totalDefect.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">평균 달성률</p>
          <p className={`text-2xl font-bold ${summary.avgAchievement >= 100 ? 'text-emerald-400' : summary.avgAchievement >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
            {summary.avgAchievement.toFixed(1)}%
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">평균 불량률</p>
          <p className={`text-2xl font-bold ${summary.avgDefectRate > 2 ? 'text-red-400' : 'text-emerald-400'}`}>
            {summary.avgDefectRate.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 시간대별 생산량 추이 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-4">시간대별 생산량 추이</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={hourlyProductionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              <Area type="monotone" dataKey="plan" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="계획" />
              <Area type="monotone" dataKey="actual" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="실적" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 라인별 달성률 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-4">라인별 달성률 비교</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={lineAchievementData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" domain={[0, 120]} stroke="#94a3b8" fontSize={12} />
              <YAxis dataKey="line" type="category" width={60} stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              <Bar dataKey="achievement" fill="#10b981" name="달성률(%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <DataGrid
          columns={columns}
          data={paginatedData}
          keyField="id"
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
