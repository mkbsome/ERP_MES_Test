/**
 * 고장내역 페이지
 * 설비 고장 이력 관리
 */
import { useState, useMemo } from 'react';
import { Plus, Wrench, AlertTriangle } from 'lucide-react';
import { PageHeader, SearchForm, DataGrid, FormModal } from '../../components/common';
import type { SearchField } from '../../components/common/SearchForm';
import type { Column } from '../../components/common/DataGrid';
import type { FormField } from '../../components/common/FormModal';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// 고장 타입
interface Breakdown {
  id: number;
  breakdown_no: string;
  equipment_code: string;
  equipment_name: string;
  line_code: string;
  line_name: string;
  breakdown_type: string;
  breakdown_type_name: string;
  symptom: string;
  cause: string;
  action: string;
  start_time: string;
  end_time: string | null;
  downtime_minutes: number | null;
  reporter: string;
  repairer: string | null;
  status: string;
  severity: string;
}

// Mock 데이터
const mockBreakdowns: Breakdown[] = [
  { id: 1, breakdown_no: 'BD-2024-0001', equipment_code: 'SMT-M01', equipment_name: 'SMT Mounter #1', line_code: 'SMT-L01', line_name: 'SMT Line 1', breakdown_type: 'MECHANICAL', breakdown_type_name: '기계적고장', symptom: '노즐 막힘 현상', cause: '부품 이물질 유입', action: '노즐 청소 및 교체', start_time: '2024-01-15 10:30', end_time: '2024-01-15 11:45', downtime_minutes: 75, reporter: '김철수', repairer: '박정비', status: 'COMPLETED', severity: 'MEDIUM' },
  { id: 2, breakdown_no: 'BD-2024-0002', equipment_code: 'SMT-R01', equipment_name: 'Reflow Oven #1', line_code: 'SMT-L01', line_name: 'SMT Line 1', breakdown_type: 'ELECTRICAL', breakdown_type_name: '전기적고장', symptom: '온도센서 이상', cause: '센서 노후화', action: '센서 교체', start_time: '2024-01-15 14:20', end_time: '2024-01-15 15:30', downtime_minutes: 70, reporter: '이영희', repairer: '박정비', status: 'COMPLETED', severity: 'HIGH' },
  { id: 3, breakdown_no: 'BD-2024-0003', equipment_code: 'AOI-01', equipment_name: 'AOI Inspector #1', line_code: 'SMT-L01', line_name: 'SMT Line 1', breakdown_type: 'SOFTWARE', breakdown_type_name: '소프트웨어오류', symptom: '비전 프로그램 오류', cause: '소프트웨어 버그', action: '프로그램 재시작', start_time: '2024-01-15 16:00', end_time: '2024-01-15 16:15', downtime_minutes: 15, reporter: '박민수', repairer: '김IT', status: 'COMPLETED', severity: 'LOW' },
  { id: 4, breakdown_no: 'BD-2024-0004', equipment_code: 'THT-W01', equipment_name: 'Wave Solder #1', line_code: 'THT-L01', line_name: 'THT Line 1', breakdown_type: 'MECHANICAL', breakdown_type_name: '기계적고장', symptom: '컨베이어 정지', cause: '벨트 이탈', action: '벨트 재조정', start_time: '2024-01-16 09:00', end_time: '2024-01-16 10:30', downtime_minutes: 90, reporter: '정수현', repairer: '박정비', status: 'COMPLETED', severity: 'HIGH' },
  { id: 5, breakdown_no: 'BD-2024-0005', equipment_code: 'SMT-M02', equipment_name: 'SMT Mounter #2', line_code: 'SMT-L01', line_name: 'SMT Line 1', breakdown_type: 'PNEUMATIC', breakdown_type_name: '공압계통', symptom: '진공 불량', cause: '조사 중', action: '수리 진행 중', start_time: '2024-01-16 11:30', end_time: null, downtime_minutes: null, reporter: '김철수', repairer: '박정비', status: 'IN_PROGRESS', severity: 'CRITICAL' },
];

// 고장 유형별 통계
const breakdownByType = [
  { name: '기계적', value: 2, color: '#3b82f6' },
  { name: '전기적', value: 1, color: '#f59e0b' },
  { name: '공압계통', value: 1, color: '#10b981' },
  { name: '소프트웨어', value: 1, color: '#8b5cf6' },
];

// 설비별 고장 횟수
const breakdownByEquipment = [
  { equipment: 'SMT-M01', count: 3, downtime: 120 },
  { equipment: 'SMT-M02', count: 2, downtime: 90 },
  { equipment: 'SMT-R01', count: 2, downtime: 85 },
  { equipment: 'AOI-01', count: 1, downtime: 15 },
  { equipment: 'THT-W01', count: 2, downtime: 150 },
];

// 검색 필드 정의
const searchFields: SearchField[] = [
  {
    name: 'date_range',
    label: '발생기간',
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
    name: 'breakdown_type',
    label: '고장유형',
    type: 'select',
    options: [
      { value: 'MECHANICAL', label: '기계적고장' },
      { value: 'ELECTRICAL', label: '전기적고장' },
      { value: 'PNEUMATIC', label: '공압계통' },
      { value: 'SOFTWARE', label: '소프트웨어오류' },
    ],
    placeholder: '전체',
  },
  {
    name: 'status',
    label: '상태',
    type: 'select',
    options: [
      { value: 'REPORTED', label: '접수' },
      { value: 'IN_PROGRESS', label: '수리중' },
      { value: 'COMPLETED', label: '완료' },
    ],
    placeholder: '전체',
  },
  {
    name: 'severity',
    label: '심각도',
    type: 'select',
    options: [
      { value: 'LOW', label: '낮음' },
      { value: 'MEDIUM', label: '보통' },
      { value: 'HIGH', label: '높음' },
      { value: 'CRITICAL', label: '긴급' },
    ],
    placeholder: '전체',
  },
];

// 테이블 컬럼 정의
const columns: Column<Breakdown>[] = [
  { key: 'breakdown_no', header: '고장번호', width: '120px' },
  { key: 'equipment_code', header: '설비코드', width: '100px' },
  { key: 'equipment_name', header: '설비명', width: '140px' },
  { key: 'line_name', header: '라인', width: '100px' },
  { key: 'breakdown_type_name', header: '고장유형', width: '100px' },
  { key: 'symptom', header: '증상', width: '180px' },
  { key: 'start_time', header: '발생시간', width: '140px' },
  {
    key: 'downtime_minutes',
    header: '중지시간',
    width: '90px',
    align: 'right',
    render: (v) => v ? <span className="text-red-400">{v}분</span> : <span className="text-yellow-400">진행중</span>
  },
  {
    key: 'severity',
    header: '심각도',
    width: '80px',
    align: 'center',
    render: (value) => {
      const severityMap: Record<string, { label: string; color: string }> = {
        LOW: { label: '낮음', color: 'bg-slate-500/20 text-slate-400' },
        MEDIUM: { label: '보통', color: 'bg-yellow-500/20 text-yellow-400' },
        HIGH: { label: '높음', color: 'bg-orange-500/20 text-orange-400' },
        CRITICAL: { label: '긴급', color: 'bg-red-500/20 text-red-400' },
      };
      const info = severityMap[value] || { label: value, color: 'bg-slate-500/20 text-slate-400' };
      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>{info.label}</span>;
    },
  },
  {
    key: 'status',
    header: '상태',
    width: '80px',
    align: 'center',
    render: (value) => {
      const statusMap: Record<string, { label: string; color: string }> = {
        REPORTED: { label: '접수', color: 'bg-blue-500/20 text-blue-400' },
        IN_PROGRESS: { label: '수리중', color: 'bg-yellow-500/20 text-yellow-400' },
        COMPLETED: { label: '완료', color: 'bg-emerald-500/20 text-emerald-400' },
      };
      const info = statusMap[value] || { label: value, color: 'bg-slate-500/20 text-slate-400' };
      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>{info.label}</span>;
    },
  },
  { key: 'repairer', header: '수리자', width: '80px', align: 'center', render: (v) => v || '-' },
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
  { name: 'breakdown_type', label: '고장유형', type: 'select', required: true, options: [
    { value: 'MECHANICAL', label: '기계적고장' },
    { value: 'ELECTRICAL', label: '전기적고장' },
    { value: 'PNEUMATIC', label: '공압계통' },
    { value: 'SOFTWARE', label: '소프트웨어오류' },
  ] },
  { name: 'severity', label: '심각도', type: 'select', required: true, options: [
    { value: 'LOW', label: '낮음' },
    { value: 'MEDIUM', label: '보통' },
    { value: 'HIGH', label: '높음' },
    { value: 'CRITICAL', label: '긴급' },
  ] },
  { name: 'start_time', label: '발생시간', type: 'text', required: true, placeholder: 'YYYY-MM-DD HH:mm' },
  { name: 'symptom', label: '증상', type: 'textarea', required: true, fullWidth: true, rows: 3 },
  { name: 'reporter', label: '보고자', type: 'text', required: true },
];

export default function BreakdownPage() {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<Breakdown[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredData = useMemo(() => {
    return mockBreakdowns.filter((item) => {
      if (searchParams.line_code && item.line_code !== searchParams.line_code) return false;
      if (searchParams.breakdown_type && item.breakdown_type !== searchParams.breakdown_type) return false;
      if (searchParams.status && item.status !== searchParams.status) return false;
      if (searchParams.severity && item.severity !== searchParams.severity) return false;
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
    console.log('Save breakdown:', data);
    setIsModalOpen(false);
  };

  // 요약 통계
  const summary = useMemo(() => {
    const total = filteredData.length;
    const inProgress = filteredData.filter(r => r.status === 'IN_PROGRESS').length;
    const critical = filteredData.filter(r => r.severity === 'CRITICAL' || r.severity === 'HIGH').length;
    const totalDowntime = filteredData.reduce((sum, r) => sum + (r.downtime_minutes || 0), 0);
    return { total, inProgress, critical, totalDowntime };
  }, [filteredData]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="고장내역"
        description="설비 고장 이력을 관리하고 분석합니다."
        actions={[
          { label: '새로고침', icon: 'refresh', onClick: () => console.log('Refresh') },
          { label: '고장등록', icon: 'add', variant: 'primary', onClick: () => setIsModalOpen(true) },
        ]}
      />

      <SearchForm fields={searchFields} onSearch={handleSearch} />

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Wrench className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">총 고장 건수</p>
              <p className="text-2xl font-bold text-white">{summary.total}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">수리 진행중</p>
              <p className="text-2xl font-bold text-yellow-400">{summary.inProgress}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">긴급/높음</p>
          <p className="text-2xl font-bold text-red-400">{summary.critical}건</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">총 중지시간</p>
          <p className="text-2xl font-bold text-orange-400">{Math.floor(summary.totalDowntime / 60)}시간 {summary.totalDowntime % 60}분</p>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 고장 유형별 분포 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-4">고장 유형별 분포</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={breakdownByType}
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {breakdownByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 설비별 고장 현황 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-4">설비별 고장 현황</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={breakdownByEquipment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="equipment" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="고장횟수" />
              <Bar dataKey="downtime" fill="#ef4444" name="중지시간(분)" />
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

      {/* 고장 등록 모달 */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title="고장 등록"
        fields={formFields}
        mode="create"
      />
    </div>
  );
}
