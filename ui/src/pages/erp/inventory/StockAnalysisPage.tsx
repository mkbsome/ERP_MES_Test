import { useState } from 'react';
import {
  BarChart3,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface InventoryKPI {
  turnoverRate: number;
  avgDaysOnHand: number;
  stockoutRate: number;
  excessRate: number;
  inventoryValue: number;
}

const inventoryByCategory = [
  { category: '원자재', value: 125000000, items: 850, color: '#3b82f6' },
  { category: '반제품', value: 45000000, items: 320, color: '#22c55e' },
  { category: '완제품', value: 78000000, items: 180, color: '#f59e0b' },
  { category: '부자재', value: 12000000, items: 420, color: '#a855f7' },
];

const turnoverTrend = [
  { month: '2023-09', raw: 8.2, wip: 15.5, finished: 12.3 },
  { month: '2023-10', raw: 8.5, wip: 14.8, finished: 11.8 },
  { month: '2023-11', raw: 9.1, wip: 16.2, finished: 13.1 },
  { month: '2023-12', raw: 7.8, wip: 14.2, finished: 10.5 },
  { month: '2024-01', raw: 8.8, wip: 15.8, finished: 12.8 },
  { month: '2024-02', raw: 9.2, wip: 16.5, finished: 13.5 },
];

const stockLevelAnalysis = [
  { item: 'PCB 기판 (4층)', current: 12500, safety: 5000, max: 20000, status: 'NORMAL' },
  { item: 'MCU IC (ARM)', current: 3200, safety: 3000, max: 8000, status: 'LOW' },
  { item: '적층세라믹콘덴서', current: 45000, safety: 20000, max: 60000, status: 'NORMAL' },
  { item: 'USB-C 커넥터', current: 8500, safety: 5000, max: 15000, status: 'NORMAL' },
  { item: '솔더페이스트', current: 15, safety: 50, max: 200, status: 'CRITICAL' },
  { item: 'LED 칩', current: 25000, safety: 10000, max: 30000, status: 'HIGH' },
  { item: '차량용 MCU', current: 300, safety: 200, max: 500, status: 'NORMAL' },
  { item: 'WiFi 모듈', current: 5500, safety: 3000, max: 8000, status: 'NORMAL' },
];

const abcAnalysis = [
  { class: 'A', items: 45, percentage: 15, valuePercentage: 70, color: '#ef4444' },
  { class: 'B', items: 90, percentage: 30, valuePercentage: 20, color: '#f59e0b' },
  { class: 'C', items: 165, percentage: 55, valuePercentage: 10, color: '#22c55e' },
];

const agingAnalysis = [
  { range: '0-30일', count: 450, value: 85000000, percentage: 45 },
  { range: '31-60일', count: 280, value: 52000000, percentage: 28 },
  { range: '61-90일', count: 120, value: 28000000, percentage: 15 },
  { range: '91-180일', count: 65, value: 15000000, percentage: 8 },
  { range: '180일 초과', count: 25, value: 8000000, percentage: 4 },
];

export default function StockAnalysisPage() {
  const [analysisType, setAnalysisType] = useState<'overview' | 'turnover' | 'abc' | 'aging'>('overview');
  const [period, setPeriod] = useState('2024-02');

  const kpi: InventoryKPI = {
    turnoverRate: 9.2,
    avgDaysOnHand: 39.7,
    stockoutRate: 2.3,
    excessRate: 8.5,
    inventoryValue: 260000000,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-cyan-400" />
            재고분석
          </h1>
          <p className="text-slate-400 mt-1">재고 효율성, ABC 분석, 재고회전율을 분석합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors">
            <Download className="h-4 w-4" />
            보고서 다운로드
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">재고회전율</p>
              <p className="text-2xl font-bold text-cyan-400">{kpi.turnoverRate}회</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">평균 재고일수</p>
              <p className="text-2xl font-bold text-blue-400">{kpi.avgDaysOnHand}일</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">품절률</p>
              <p className="text-2xl font-bold text-red-400">{kpi.stockoutRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Package className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">과잉재고율</p>
              <p className="text-2xl font-bold text-amber-400">{kpi.excessRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">재고자산</p>
              <p className="text-2xl font-bold text-emerald-400">₩{(kpi.inventoryValue / 100000000).toFixed(1)}억</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Type Tabs */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {[
              { value: 'overview', label: '종합현황' },
              { value: 'turnover', label: '회전율분석' },
              { value: 'abc', label: 'ABC분석' },
              { value: 'aging', label: '재고연령' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setAnalysisType(tab.value as typeof analysisType)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  analysisType === tab.value
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Analysis Content */}
      {analysisType === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Inventory by Category */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">재고유형별 현황</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={inventoryByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ category, percentage }) => `${category}`}
                >
                  {inventoryByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value: number) => `₩${(value / 1000000).toFixed(0)}M`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {inventoryByCategory.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">{item.items}종</span>
                    <span className="text-white font-medium">₩{(item.value / 1000000).toFixed(0)}M</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Level Analysis */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">재고수준 분석</h3>
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {stockLevelAnalysis.map((item, idx) => {
                const fillPercentage = (item.current / item.max) * 100;
                const safetyPercentage = (item.safety / item.max) * 100;
                return (
                  <div key={idx} className="bg-slate-900 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm">{item.item}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        item.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                        item.status === 'LOW' ? 'bg-yellow-500/20 text-yellow-400' :
                        item.status === 'HIGH' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {item.status === 'CRITICAL' ? '긴급' :
                         item.status === 'LOW' ? '부족' :
                         item.status === 'HIGH' ? '과잉' : '정상'}
                      </span>
                    </div>
                    <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`absolute h-full rounded-full ${
                          item.status === 'CRITICAL' ? 'bg-red-500' :
                          item.status === 'LOW' ? 'bg-yellow-500' :
                          item.status === 'HIGH' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${fillPercentage}%` }}
                      />
                      <div
                        className="absolute h-full w-0.5 bg-amber-400"
                        style={{ left: `${safetyPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-slate-500">
                      <span>현재: {item.current.toLocaleString()}</span>
                      <span>안전재고: {item.safety.toLocaleString()}</span>
                      <span>최대: {item.max.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {analysisType === 'turnover' && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">재고유형별 회전율 추이</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={turnoverTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: number) => `${value}회`}
              />
              <Legend />
              <Line type="monotone" dataKey="raw" name="원자재" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              <Line type="monotone" dataKey="wip" name="반제품" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
              <Line type="monotone" dataKey="finished" name="완제품" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {analysisType === 'abc' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">ABC 분석 결과</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={abcAnalysis} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="class" stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value: number) => `${value}%`}
                />
                <Legend />
                <Bar dataKey="percentage" name="품목 비율" fill="#6366f1" radius={[0, 4, 4, 0]} />
                <Bar dataKey="valuePercentage" name="금액 비율" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">ABC 등급별 상세</h3>
            <div className="space-y-4">
              {abcAnalysis.map((item) => (
                <div key={item.class} className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold`} style={{ backgroundColor: item.color }}>
                        {item.class}
                      </span>
                      <div>
                        <p className="text-white font-medium">{item.class}등급</p>
                        <p className="text-sm text-slate-400">{item.items}개 품목</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{item.valuePercentage}%</p>
                      <p className="text-xs text-slate-400">금액비중</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400">
                    {item.class === 'A' ? '고가치 핵심 품목 - 철저한 관리 필요' :
                     item.class === 'B' ? '중요 품목 - 정기적 관리 권장' :
                     '일반 품목 - 간소화된 관리 적용'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {analysisType === 'aging' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">재고연령 분포</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={agingAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="range" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" tickFormatter={(v) => `₩${(v / 1000000).toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value: number) => `₩${(value / 1000000).toFixed(0)}M`}
                />
                <Area type="monotone" dataKey="value" name="재고금액" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">연령대별 상세</h3>
            <div className="space-y-3">
              {agingAnalysis.map((item, idx) => (
                <div key={idx} className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{item.range}</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      idx === 0 ? 'bg-green-500/20 text-green-400' :
                      idx === 1 ? 'bg-blue-500/20 text-blue-400' :
                      idx === 2 ? 'bg-yellow-500/20 text-yellow-400' :
                      idx === 3 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{item.count}개 품목</span>
                    <span className="text-slate-300">₩{(item.value / 1000000).toFixed(0)}M</span>
                  </div>
                  <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        idx === 0 ? 'bg-green-500' :
                        idx === 1 ? 'bg-blue-500' :
                        idx === 2 ? 'bg-yellow-500' :
                        idx === 3 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
