/**
 * 라인가동현황 페이지
 * 생산 라인별 실시간 가동 상태 모니터링
 */
import { useState, useMemo } from 'react';
import { RefreshCw, Activity, Zap, AlertTriangle, Clock } from 'lucide-react';
import { PageHeader, SearchForm } from '../../components/common';
import type { SearchField } from '../../components/common/SearchForm';
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

// 라인 상태 타입
interface LineStatus {
  id: number;
  line_code: string;
  line_name: string;
  area: string;
  status: string;
  current_product: string | null;
  current_wo: string | null;
  target_qty: number;
  current_qty: number;
  achievement_rate: number;
  takt_time: number;
  cycle_time: number;
  oee: number;
  workers: number;
  downtime_minutes: number;
  last_updated: string;
}

// Mock 데이터
const mockLines: LineStatus[] = [
  { id: 1, line_code: 'SMT-L01', line_name: 'SMT Line 1', area: 'SMT', status: 'RUNNING', current_product: '스마트폰 메인보드 A타입', current_wo: 'WO-2024-0001', target_qty: 1000, current_qty: 856, achievement_rate: 95.2, takt_time: 3.6, cycle_time: 3.4, oee: 87.5, workers: 4, downtime_minutes: 15, last_updated: '2024-01-15 15:42:30' },
  { id: 2, line_code: 'SMT-L02', line_name: 'SMT Line 2', area: 'SMT', status: 'RUNNING', current_product: '스마트폰 메인보드 B타입', current_wo: 'WO-2024-0002', target_qty: 800, current_qty: 520, achievement_rate: 72.5, takt_time: 4.5, cycle_time: 5.2, oee: 75.3, workers: 4, downtime_minutes: 45, last_updated: '2024-01-15 15:42:28' },
  { id: 3, line_code: 'SMT-L03', line_name: 'SMT Line 3', area: 'SMT', status: 'SETUP', current_product: null, current_wo: null, target_qty: 0, current_qty: 0, achievement_rate: 0, takt_time: 0, cycle_time: 0, oee: 0, workers: 2, downtime_minutes: 30, last_updated: '2024-01-15 15:40:00' },
  { id: 4, line_code: 'SMT-L04', line_name: 'SMT Line 4', area: 'SMT', status: 'RUNNING', current_product: '자동차 ECU 모듈', current_wo: 'WO-2024-0004', target_qty: 500, current_qty: 320, achievement_rate: 71.1, takt_time: 7.2, cycle_time: 7.8, oee: 68.2, workers: 3, downtime_minutes: 60, last_updated: '2024-01-15 15:42:15' },
  { id: 5, line_code: 'SMT-L05', line_name: 'SMT Line 5', area: 'SMT', status: 'IDLE', current_product: null, current_wo: null, target_qty: 0, current_qty: 0, achievement_rate: 0, takt_time: 0, cycle_time: 0, oee: 0, workers: 0, downtime_minutes: 0, last_updated: '2024-01-15 15:30:00' },
  { id: 6, line_code: 'THT-L01', line_name: 'THT Line 1', area: 'THT', status: 'RUNNING', current_product: '전원보드', current_wo: 'WO-2024-0006', target_qty: 600, current_qty: 580, achievement_rate: 107.4, takt_time: 6.0, cycle_time: 5.6, oee: 92.1, workers: 5, downtime_minutes: 10, last_updated: '2024-01-15 15:42:20' },
  { id: 7, line_code: 'THT-L02', line_name: 'THT Line 2', area: 'THT', status: 'DOWN', current_product: 'LED 드라이버 보드', current_wo: 'WO-2024-0007', target_qty: 400, current_qty: 180, achievement_rate: 50.0, takt_time: 9.0, cycle_time: 0, oee: 45.0, workers: 3, downtime_minutes: 90, last_updated: '2024-01-15 15:20:00' },
  { id: 8, line_code: 'ASM-L01', line_name: 'Assembly Line 1', area: 'ASSEMBLY', status: 'RUNNING', current_product: 'IoT 통신모듈 조립', current_wo: 'WO-2024-0008', target_qty: 300, current_qty: 275, achievement_rate: 101.9, takt_time: 12.0, cycle_time: 11.5, oee: 88.5, workers: 8, downtime_minutes: 5, last_updated: '2024-01-15 15:42:25' },
];

// 상태별 라인 수
const statusSummary = [
  { name: '가동중', value: 5, color: '#10b981' },
  { name: '셋업중', value: 1, color: '#f59e0b' },
  { name: '대기중', value: 1, color: '#6b7280' },
  { name: '비가동', value: 1, color: '#ef4444' },
];

// 영역별 OEE
const areaOEE = [
  { area: 'SMT', oee: 76.8, lines: 5 },
  { area: 'THT', oee: 68.6, lines: 2 },
  { area: 'ASSEMBLY', oee: 88.5, lines: 1 },
];

// 검색 필드 정의
const searchFields: SearchField[] = [
  {
    name: 'area',
    label: '영역',
    type: 'select',
    options: [
      { value: 'SMT', label: 'SMT' },
      { value: 'THT', label: 'THT' },
      { value: 'ASSEMBLY', label: 'ASSEMBLY' },
    ],
    placeholder: '전체',
  },
  {
    name: 'status',
    label: '상태',
    type: 'select',
    options: [
      { value: 'RUNNING', label: '가동중' },
      { value: 'SETUP', label: '셋업중' },
      { value: 'IDLE', label: '대기중' },
      { value: 'DOWN', label: '비가동' },
    ],
    placeholder: '전체',
  },
];

// 상태 색상 매핑
const statusConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  RUNNING: { label: '가동중', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  SETUP: { label: '셋업중', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  IDLE: { label: '대기중', color: 'text-slate-400', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/30' },
  DOWN: { label: '비가동', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
};

export default function LineStatusPage() {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});

  const filteredData = useMemo(() => {
    return mockLines.filter((item) => {
      if (searchParams.area && item.area !== searchParams.area) return false;
      if (searchParams.status && item.status !== searchParams.status) return false;
      return true;
    });
  }, [searchParams]);

  const handleSearch = (values: Record<string, any>) => {
    setSearchParams(values);
  };

  // 요약 통계
  const summary = useMemo(() => {
    const running = filteredData.filter(r => r.status === 'RUNNING').length;
    const down = filteredData.filter(r => r.status === 'DOWN').length;
    const avgOEE = filteredData.filter(r => r.oee > 0).reduce((sum, r) => sum + r.oee, 0) /
                   (filteredData.filter(r => r.oee > 0).length || 1);
    const totalDowntime = filteredData.reduce((sum, r) => sum + r.downtime_minutes, 0);
    return { total: filteredData.length, running, down, avgOEE, totalDowntime };
  }, [filteredData]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="라인가동현황"
        description="생산 라인별 실시간 가동 상태를 모니터링합니다."
        actions={[
          { label: '새로고침', icon: 'refresh', onClick: () => console.log('Refresh') },
        ]}
      />

      <SearchForm fields={searchFields} onSearch={handleSearch} />

      {/* 상태 요약 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">전체 라인</p>
              <p className="text-2xl font-bold text-white">{summary.total}개</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Zap className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">가동중</p>
              <p className="text-2xl font-bold text-emerald-400">{summary.running}개</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">비가동</p>
              <p className="text-2xl font-bold text-red-400">{summary.down}개</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">평균 OEE</p>
          <p className={`text-2xl font-bold ${summary.avgOEE >= 85 ? 'text-emerald-400' : summary.avgOEE >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
            {summary.avgOEE.toFixed(1)}%
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Clock className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">총 비가동시간</p>
              <p className="text-2xl font-bold text-orange-400">{summary.totalDowntime}분</p>
            </div>
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 상태별 분포 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-4">라인 상태 분포</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusSummary}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="value"
                label={({ name, value }) => `${name} ${value}`}
              >
                {statusSummary.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 영역별 OEE */}
        <div className="col-span-2 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-4">영역별 평균 OEE</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={areaOEE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="area" stroke="#94a3b8" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="oee" fill="#3b82f6" name="OEE(%)" radius={[4, 4, 0, 0]}>
                {areaOEE.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.oee >= 85 ? '#10b981' : entry.oee >= 70 ? '#f59e0b' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 라인 카드 그리드 */}
      <div className="grid grid-cols-4 gap-4">
        {filteredData.map((line) => {
          const config = statusConfig[line.status];
          return (
            <div
              key={line.id}
              className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 space-y-3`}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">{line.line_name}</h4>
                  <p className="text-xs text-slate-400">{line.line_code}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.color} border ${config.borderColor}`}>
                  {config.label}
                </span>
              </div>

              {/* 현재 작업 */}
              {line.current_product ? (
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">현재 작업</p>
                  <p className="text-sm text-white truncate">{line.current_product}</p>
                  <p className="text-xs text-slate-500">{line.current_wo}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 italic">작업 없음</p>
                </div>
              )}

              {/* 진행률 */}
              {line.status === 'RUNNING' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">진행률</span>
                    <span className={line.achievement_rate >= 100 ? 'text-emerald-400' : 'text-yellow-400'}>
                      {line.current_qty.toLocaleString()} / {line.target_qty.toLocaleString()} ({line.achievement_rate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${line.achievement_rate >= 100 ? 'bg-emerald-500' : line.achievement_rate >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(line.achievement_rate, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 메트릭 */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/50">
                <div className="text-center">
                  <p className="text-xs text-slate-400">OEE</p>
                  <p className={`text-sm font-medium ${line.oee >= 85 ? 'text-emerald-400' : line.oee >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {line.oee > 0 ? `${line.oee.toFixed(0)}%` : '-'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400">CT</p>
                  <p className="text-sm font-medium text-white">
                    {line.cycle_time > 0 ? `${line.cycle_time.toFixed(1)}s` : '-'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400">작업자</p>
                  <p className="text-sm font-medium text-white">{line.workers}명</p>
                </div>
              </div>

              {/* 비가동 시간 */}
              {line.downtime_minutes > 0 && (
                <div className="flex items-center gap-2 text-xs text-orange-400">
                  <Clock className="h-3 w-3" />
                  <span>비가동: {line.downtime_minutes}분</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
