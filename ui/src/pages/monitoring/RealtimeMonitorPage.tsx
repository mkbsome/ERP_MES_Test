/**
 * 실시간모니터링 페이지
 * 공장 전체 실시간 현황 대시보드
 */
import { useState, useEffect } from 'react';
import { RefreshCw, Activity, Zap, AlertTriangle, TrendingUp, Package, Clock, ThermometerSun } from 'lucide-react';
import { PageHeader } from '../../components/common';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

// 실시간 생산량 데이터 (5분 단위)
const realtimeProductionData = [
  { time: '15:00', production: 120, defect: 2 },
  { time: '15:05', production: 118, defect: 1 },
  { time: '15:10', production: 122, defect: 3 },
  { time: '15:15', production: 119, defect: 2 },
  { time: '15:20', production: 125, defect: 1 },
  { time: '15:25', production: 121, defect: 2 },
  { time: '15:30', production: 118, defect: 2 },
  { time: '15:35', production: 123, defect: 1 },
  { time: '15:40', production: 120, defect: 2 },
  { time: '15:45', production: 122, defect: 1 },
];

// 설비 상태 요약
const equipmentStatus = {
  total: 150,
  running: 128,
  idle: 12,
  setup: 5,
  down: 5,
};

// 라인별 현황
const lineStatus = [
  { line: 'SMT-L01', status: 'RUNNING', product: '스마트폰 메인보드 A', progress: 85.6, oee: 87.5, takt: 3.4 },
  { line: 'SMT-L02', status: 'RUNNING', product: '스마트폰 메인보드 B', progress: 65.0, oee: 75.3, takt: 5.2 },
  { line: 'SMT-L03', status: 'SETUP', product: '-', progress: 0, oee: 0, takt: 0 },
  { line: 'SMT-L04', status: 'RUNNING', product: '자동차 ECU 모듈', progress: 64.0, oee: 68.2, takt: 7.8 },
  { line: 'THT-L01', status: 'RUNNING', product: '전원보드', progress: 96.7, oee: 92.1, takt: 5.6 },
  { line: 'THT-L02', status: 'DOWN', product: 'LED 드라이버', progress: 45.0, oee: 45.0, takt: 0 },
];

// 최근 알림
const recentAlerts = [
  { id: 1, type: 'ERROR', time: '15:42', message: 'THT-L02 컨베이어 정지 (긴급)', equipment: 'Wave Solder #2' },
  { id: 2, type: 'WARNING', time: '15:38', message: 'SMT-L04 OEE 70% 미만', equipment: 'SMT Line 4' },
  { id: 3, type: 'WARNING', time: '15:35', message: 'SMT-M02 진공 압력 저하', equipment: 'SMT Mounter #2' },
  { id: 4, type: 'INFO', time: '15:30', message: 'SMT-L03 셋업 시작', equipment: 'SMT Line 3' },
  { id: 5, type: 'INFO', time: '15:25', message: 'WO-2024-0001 작업 완료', equipment: 'SMT Line 1' },
];

// 상태 색상
const statusColors: Record<string, string> = {
  RUNNING: 'bg-emerald-500',
  IDLE: 'bg-slate-500',
  SETUP: 'bg-yellow-500',
  DOWN: 'bg-red-500',
};

const alertColors: Record<string, { bg: string; text: string; border: string }> = {
  ERROR: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  WARNING: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  INFO: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
};

export default function RealtimeMonitorPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="실시간 모니터링"
        description={`${currentTime.toLocaleString('ko-KR')} 기준`}
        actions={[
          {
            label: autoRefresh ? '자동갱신 ON' : '자동갱신 OFF',
            icon: 'refresh',
            variant: autoRefresh ? 'primary' : 'secondary',
            onClick: () => setAutoRefresh(!autoRefresh)
          },
        ]}
      />

      {/* 상단 KPI 카드 */}
      <div className="grid grid-cols-6 gap-4">
        {/* 금일 생산량 */}
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-blue-300">금일 생산량</span>
          </div>
          <p className="text-3xl font-bold text-blue-400">12,845</p>
          <p className="text-xs text-slate-400 mt-1">목표 14,000 (91.8%)</p>
        </div>

        {/* 평균 OEE */}
        <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-700/10 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-emerald-300">평균 OEE</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">82.5%</p>
          <p className="text-xs text-slate-400 mt-1">목표 85.0%</p>
        </div>

        {/* 불량률 */}
        <div className="bg-gradient-to-br from-red-600/20 to-red-700/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-sm text-red-300">불량률</span>
          </div>
          <p className="text-3xl font-bold text-red-400">1.42%</p>
          <p className="text-xs text-slate-400 mt-1">목표 1.50% 이하</p>
        </div>

        {/* 설비 가동률 */}
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/10 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-purple-400" />
            <span className="text-sm text-purple-300">설비 가동률</span>
          </div>
          <p className="text-3xl font-bold text-purple-400">85.3%</p>
          <p className="text-xs text-slate-400 mt-1">{equipmentStatus.running}/{equipmentStatus.total} 가동</p>
        </div>

        {/* 비가동 시간 */}
        <div className="bg-gradient-to-br from-orange-600/20 to-orange-700/10 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-orange-400" />
            <span className="text-sm text-orange-300">비가동 시간</span>
          </div>
          <p className="text-3xl font-bold text-orange-400">2h 35m</p>
          <p className="text-xs text-slate-400 mt-1">금일 누적</p>
        </div>

        {/* 긴급 알림 */}
        <div className="bg-gradient-to-br from-pink-600/20 to-pink-700/10 border border-pink-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-pink-400" />
            <span className="text-sm text-pink-300">긴급 알림</span>
          </div>
          <p className="text-3xl font-bold text-pink-400">2</p>
          <p className="text-xs text-slate-400 mt-1">미처리 건</p>
        </div>
      </div>

      {/* 중간 영역 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 실시간 생산량 추이 */}
        <div className="col-span-2 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-4">실시간 생산량 추이 (5분 단위)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={realtimeProductionData}>
              <defs>
                <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Area
                type="monotone"
                dataKey="production"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorProduction)"
                name="생산량"
              />
              <Line type="monotone" dataKey="defect" stroke="#ef4444" name="불량" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 설비 상태 요약 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-4">설비 상태 요약</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-slate-300">가동중</span>
              </div>
              <span className="text-lg font-bold text-emerald-400">{equipmentStatus.running}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-500" />
                <span className="text-sm text-slate-300">대기중</span>
              </div>
              <span className="text-lg font-bold text-slate-400">{equipmentStatus.idle}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-slate-300">셋업중</span>
              </div>
              <span className="text-lg font-bold text-yellow-400">{equipmentStatus.setup}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-slate-300">비가동</span>
              </div>
              <span className="text-lg font-bold text-red-400">{equipmentStatus.down}</span>
            </div>
          </div>

          {/* 진행 바 */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex h-4 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500"
                style={{ width: `${(equipmentStatus.running / equipmentStatus.total) * 100}%` }}
              />
              <div
                className="bg-slate-500"
                style={{ width: `${(equipmentStatus.idle / equipmentStatus.total) * 100}%` }}
              />
              <div
                className="bg-yellow-500"
                style={{ width: `${(equipmentStatus.setup / equipmentStatus.total) * 100}%` }}
              />
              <div
                className="bg-red-500"
                style={{ width: `${(equipmentStatus.down / equipmentStatus.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              전체 {equipmentStatus.total}대 중 {equipmentStatus.running}대 가동
            </p>
          </div>
        </div>
      </div>

      {/* 하단 영역 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 라인별 현황 */}
        <div className="col-span-2 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-4">라인별 현황</h3>
          <div className="space-y-3">
            {lineStatus.map((line) => (
              <div key={line.line} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg">
                {/* 상태 표시 */}
                <div className={`w-2 h-12 rounded-full ${statusColors[line.status]}`} />

                {/* 라인 정보 */}
                <div className="w-20">
                  <p className="text-sm font-medium text-white">{line.line}</p>
                  <p className="text-xs text-slate-400">{line.status === 'RUNNING' ? '가동중' : line.status === 'SETUP' ? '셋업중' : line.status === 'DOWN' ? '비가동' : '대기'}</p>
                </div>

                {/* 제품 */}
                <div className="flex-1">
                  <p className="text-sm text-slate-300 truncate">{line.product}</p>
                </div>

                {/* 진행률 */}
                <div className="w-32">
                  {line.status === 'RUNNING' ? (
                    <>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">진행률</span>
                        <span className={line.progress >= 80 ? 'text-emerald-400' : 'text-yellow-400'}>{line.progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${line.progress >= 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                          style={{ width: `${Math.min(line.progress, 100)}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500">-</span>
                  )}
                </div>

                {/* OEE */}
                <div className="w-16 text-center">
                  <p className="text-xs text-slate-400">OEE</p>
                  <p className={`text-sm font-medium ${line.oee >= 85 ? 'text-emerald-400' : line.oee >= 70 ? 'text-yellow-400' : line.oee > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                    {line.oee > 0 ? `${line.oee.toFixed(0)}%` : '-'}
                  </p>
                </div>

                {/* Takt */}
                <div className="w-16 text-center">
                  <p className="text-xs text-slate-400">CT</p>
                  <p className="text-sm font-medium text-white">
                    {line.takt > 0 ? `${line.takt.toFixed(1)}s` : '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 알림 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-4">최근 알림</h3>
          <div className="space-y-2">
            {recentAlerts.map((alert) => {
              const colors = alertColors[alert.type];
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${colors.text}`}>{alert.type}</span>
                    <span className="text-xs text-slate-500">{alert.time}</span>
                  </div>
                  <p className="text-sm text-slate-300">{alert.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{alert.equipment}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
