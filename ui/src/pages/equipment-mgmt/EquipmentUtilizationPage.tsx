/**
 * 설비가동률 페이지
 * 설비별 가동률 현황 모니터링
 */
import { useState, useMemo } from 'react';
import { RefreshCw, Download } from 'lucide-react';
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
  LineChart,
  Line,
} from 'recharts';

// 설비 가동률 타입
interface EquipmentUtilization {
  id: number;
  equipment_code: string;
  equipment_name: string;
  line_code: string;
  line_name: string;
  date: string;
  planned_time: number;  // 계획시간 (분)
  operation_time: number; // 가동시간 (분)
  downtime: number;       // 비가동시간 (분)
  utilization_rate: number; // 가동률 (%)
  availability: number;   // 가용률 (%)
  performance: number;    // 성능효율 (%)
  quality: number;        // 품질률 (%)
  oee: number;           // OEE (%)
}

// Mock 데이터
const mockData: EquipmentUtilization[] = [
  { id: 1, equipment_code: 'SMT-M01', equipment_name: 'SMT Mounter #1', line_code: 'SMT-L01', line_name: 'SMT Line 1', date: '2024-01-15', planned_time: 480, operation_time: 456, downtime: 24, utilization_rate: 95.0, availability: 95.0, performance: 92.5, quality: 99.2, oee: 87.1 },
  { id: 2, equipment_code: 'SMT-M02', equipment_name: 'SMT Mounter #2', line_code: 'SMT-L01', line_name: 'SMT Line 1', date: '2024-01-15', planned_time: 480, operation_time: 432, downtime: 48, utilization_rate: 90.0, availability: 90.0, performance: 88.0, quality: 98.5, oee: 78.0 },
  { id: 3, equipment_code: 'SMT-M03', equipment_name: 'SMT Mounter #3', line_code: 'SMT-L02', line_name: 'SMT Line 2', date: '2024-01-15', planned_time: 480, operation_time: 420, downtime: 60, utilization_rate: 87.5, availability: 87.5, performance: 91.0, quality: 99.0, oee: 78.8 },
  { id: 4, equipment_code: 'SMT-R01', equipment_name: 'Reflow Oven #1', line_code: 'SMT-L01', line_name: 'SMT Line 1', date: '2024-01-15', planned_time: 480, operation_time: 468, downtime: 12, utilization_rate: 97.5, availability: 97.5, performance: 95.0, quality: 99.5, oee: 92.1 },
  { id: 5, equipment_code: 'SMT-R02', equipment_name: 'Reflow Oven #2', line_code: 'SMT-L02', line_name: 'SMT Line 2', date: '2024-01-15', planned_time: 480, operation_time: 450, downtime: 30, utilization_rate: 93.8, availability: 93.8, performance: 90.0, quality: 98.8, oee: 83.4 },
  { id: 6, equipment_code: 'AOI-01', equipment_name: 'AOI Inspector #1', line_code: 'SMT-L01', line_name: 'SMT Line 1', date: '2024-01-15', planned_time: 480, operation_time: 475, downtime: 5, utilization_rate: 99.0, availability: 99.0, performance: 97.0, quality: 99.8, oee: 95.8 },
  { id: 7, equipment_code: 'AOI-02', equipment_name: 'AOI Inspector #2', line_code: 'SMT-L02', line_name: 'SMT Line 2', date: '2024-01-15', planned_time: 480, operation_time: 465, downtime: 15, utilization_rate: 96.9, availability: 96.9, performance: 94.5, quality: 99.3, oee: 90.9 },
  { id: 8, equipment_code: 'THT-W01', equipment_name: 'Wave Solder #1', line_code: 'THT-L01', line_name: 'THT Line 1', date: '2024-01-15', planned_time: 480, operation_time: 400, downtime: 80, utilization_rate: 83.3, availability: 83.3, performance: 85.0, quality: 97.5, oee: 69.1 },
];

// 시간대별 OEE 추이 데이터
const oeeHourlyData = [
  { hour: '08:00', oee: 82, availability: 90, performance: 88, quality: 98 },
  { hour: '09:00', oee: 85, availability: 92, performance: 90, quality: 99 },
  { hour: '10:00', oee: 88, availability: 94, performance: 92, quality: 99 },
  { hour: '11:00', oee: 86, availability: 91, performance: 91, quality: 98 },
  { hour: '12:00', oee: 75, availability: 80, performance: 88, quality: 97 },
  { hour: '13:00', oee: 82, availability: 88, performance: 90, quality: 98 },
  { hour: '14:00', oee: 87, availability: 93, performance: 91, quality: 99 },
  { hour: '15:00', oee: 89, availability: 95, performance: 92, quality: 99 },
  { hour: '16:00', oee: 85, availability: 90, performance: 91, quality: 98 },
  { hour: '17:00', oee: 83, availability: 88, performance: 90, quality: 97 },
];

// 검색 필드 정의
const searchFields: SearchField[] = [
  {
    name: 'date',
    label: '조회일자',
    type: 'date',
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
    name: 'equipment_code',
    label: '설비코드',
    type: 'text',
    placeholder: '설비코드',
  },
];

// 테이블 컬럼 정의
const columns: Column<EquipmentUtilization>[] = [
  { key: 'equipment_code', header: '설비코드', width: '100px' },
  { key: 'equipment_name', header: '설비명', width: '150px' },
  { key: 'line_name', header: '라인', width: '100px' },
  {
    key: 'planned_time',
    header: '계획시간',
    width: '90px',
    align: 'right',
    render: (v) => `${Math.floor(v / 60)}h ${v % 60}m`
  },
  {
    key: 'operation_time',
    header: '가동시간',
    width: '90px',
    align: 'right',
    render: (v) => `${Math.floor(v / 60)}h ${v % 60}m`
  },
  {
    key: 'downtime',
    header: '비가동',
    width: '80px',
    align: 'right',
    render: (v) => <span className="text-red-400">{v}m</span>
  },
  {
    key: 'utilization_rate',
    header: '가동률',
    width: '100px',
    align: 'center',
    render: (v) => (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${v >= 90 ? 'bg-emerald-500' : v >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${v}%` }}
          />
        </div>
        <span className="text-xs w-12 text-right">{v.toFixed(1)}%</span>
      </div>
    ),
  },
  { key: 'availability', header: '가용률', width: '70px', align: 'right', render: (v) => `${v.toFixed(1)}%` },
  { key: 'performance', header: '성능효율', width: '70px', align: 'right', render: (v) => `${v.toFixed(1)}%` },
  { key: 'quality', header: '품질률', width: '70px', align: 'right', render: (v) => `${v.toFixed(1)}%` },
  {
    key: 'oee',
    header: 'OEE',
    width: '100px',
    align: 'center',
    render: (v) => {
      const color = v >= 85 ? 'text-emerald-400' : v >= 70 ? 'text-yellow-400' : 'text-red-400';
      return <span className={`font-bold ${color}`}>{v.toFixed(1)}%</span>;
    },
  },
];

export default function EquipmentUtilizationPage() {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filteredData = useMemo(() => {
    return mockData.filter((item) => {
      if (searchParams.date && item.date !== searchParams.date) return false;
      if (searchParams.line_code && item.line_code !== searchParams.line_code) return false;
      if (searchParams.equipment_code && !item.equipment_code.includes(searchParams.equipment_code)) return false;
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
    const avgOEE = filteredData.reduce((sum, r) => sum + r.oee, 0) / filteredData.length || 0;
    const avgAvailability = filteredData.reduce((sum, r) => sum + r.availability, 0) / filteredData.length || 0;
    const avgPerformance = filteredData.reduce((sum, r) => sum + r.performance, 0) / filteredData.length || 0;
    const avgQuality = filteredData.reduce((sum, r) => sum + r.quality, 0) / filteredData.length || 0;
    return { avgOEE, avgAvailability, avgPerformance, avgQuality };
  }, [filteredData]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="설비가동률"
        description="설비별 가동률 및 OEE 현황을 모니터링합니다."
        actions={[
          { label: '새로고침', icon: 'refresh', onClick: () => console.log('Refresh') },
          { label: '다운로드', icon: 'download', onClick: () => console.log('Download') },
        ]}
      />

      <SearchForm fields={searchFields} onSearch={handleSearch} />

      {/* OEE 요약 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-300">평균 OEE</p>
          <p className="text-3xl font-bold text-blue-400">{summary.avgOEE.toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-1">전체 설비 평균</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-700/10 border border-emerald-500/30 rounded-lg p-4">
          <p className="text-sm text-emerald-300">가용률 (A)</p>
          <p className="text-3xl font-bold text-emerald-400">{summary.avgAvailability.toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-1">Availability</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-sm text-yellow-300">성능효율 (P)</p>
          <p className="text-3xl font-bold text-yellow-400">{summary.avgPerformance.toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-1">Performance</p>
        </div>
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/10 border border-purple-500/30 rounded-lg p-4">
          <p className="text-sm text-purple-300">품질률 (Q)</p>
          <p className="text-3xl font-bold text-purple-400">{summary.avgQuality.toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-1">Quality</p>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 설비별 OEE 비교 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-4">설비별 OEE 비교</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={filteredData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
              <YAxis dataKey="equipment_code" type="category" width={80} stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="oee" fill="#3b82f6" name="OEE" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 시간대별 OEE 추이 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-4">시간대별 OEE 추이</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={oeeHourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
              <YAxis domain={[60, 100]} stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              <Line type="monotone" dataKey="oee" stroke="#3b82f6" name="OEE" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              <Line type="monotone" dataKey="availability" stroke="#10b981" name="가용률" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="performance" stroke="#f59e0b" name="성능" strokeWidth={1} dot={false} />
            </LineChart>
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
