import { useState } from 'react';
import {
  Gauge,
  RefreshCw,
  Download,
  Calendar,
  TrendingUp,
  Clock,
  Zap,
  Target,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

interface LineOEE {
  lineCode: string;
  lineName: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  target: number;
  plannedTime: number;
  actualRunTime: number;
  idealCycleTime: number;
  actualCycleTime: number;
  goodCount: number;
  totalCount: number;
}

const mockOEEData: LineOEE[] = [
  {
    lineCode: 'SMT-L01',
    lineName: 'SMT 1라인',
    availability: 92.5,
    performance: 88.3,
    quality: 98.2,
    oee: 80.2,
    target: 85,
    plannedTime: 1200,
    actualRunTime: 1110,
    idealCycleTime: 3,
    actualCycleTime: 3.4,
    goodCount: 19250,
    totalCount: 19600,
  },
  {
    lineCode: 'SMT-L02',
    lineName: 'SMT 2라인',
    availability: 88.7,
    performance: 91.2,
    quality: 97.5,
    oee: 78.9,
    target: 82,
    plannedTime: 1200,
    actualRunTime: 1064,
    idealCycleTime: 4,
    actualCycleTime: 4.4,
    goodCount: 14520,
    totalCount: 14900,
  },
  {
    lineCode: 'SMT-L03',
    lineName: 'SMT 3라인',
    availability: 75.2,
    performance: 85.6,
    quality: 96.8,
    oee: 62.3,
    target: 80,
    plannedTime: 1200,
    actualRunTime: 902,
    idealCycleTime: 2.5,
    actualCycleTime: 2.9,
    goodCount: 18650,
    totalCount: 19270,
  },
  {
    lineCode: 'SMT-L04',
    lineName: 'SMT 4라인',
    availability: 94.1,
    performance: 92.8,
    quality: 99.1,
    oee: 86.5,
    target: 83,
    plannedTime: 960,
    actualRunTime: 903,
    idealCycleTime: 3.5,
    actualCycleTime: 3.8,
    goodCount: 14150,
    totalCount: 14280,
  },
  {
    lineCode: 'THT-L01',
    lineName: 'THT 1라인',
    availability: 89.3,
    performance: 82.5,
    quality: 95.2,
    oee: 70.1,
    target: 78,
    plannedTime: 960,
    actualRunTime: 857,
    idealCycleTime: 8,
    actualCycleTime: 9.7,
    goodCount: 5280,
    totalCount: 5550,
  },
];

const oeeTrendData = [
  { date: '01-28', oee: 78.5, availability: 91, performance: 88, quality: 98 },
  { date: '01-29', oee: 80.2, availability: 92, performance: 89, quality: 98 },
  { date: '01-30', oee: 76.8, availability: 88, performance: 90, quality: 97 },
  { date: '01-31', oee: 82.1, availability: 93, performance: 90, quality: 98 },
  { date: '02-01', oee: 79.5, availability: 90, performance: 91, quality: 97 },
  { date: '02-02', oee: 81.3, availability: 92, performance: 90, quality: 98 },
  { date: '02-03', oee: 80.8, availability: 91, performance: 91, quality: 98 },
];

const lossAnalysis = [
  { category: '설비고장', time: 45, percentage: 28.1, color: '#ef4444' },
  { category: '셋업/조정', time: 35, percentage: 21.9, color: '#f97316' },
  { category: '공회전/일시정지', time: 30, percentage: 18.8, color: '#eab308' },
  { category: '속도저하', time: 25, percentage: 15.6, color: '#22c55e' },
  { category: '불량/재작업', time: 15, percentage: 9.4, color: '#3b82f6' },
  { category: '수율손실', time: 10, percentage: 6.2, color: '#a855f7' },
];

export default function OEEAnalysisPage() {
  const [selectedLine, setSelectedLine] = useState<LineOEE>(mockOEEData[0]);
  const [period, setPeriod] = useState('daily');

  const overallOEE = mockOEEData.reduce((sum, l) => sum + l.oee, 0) / mockOEEData.length;
  const avgAvailability = mockOEEData.reduce((sum, l) => sum + l.availability, 0) / mockOEEData.length;
  const avgPerformance = mockOEEData.reduce((sum, l) => sum + l.performance, 0) / mockOEEData.length;
  const avgQuality = mockOEEData.reduce((sum, l) => sum + l.quality, 0) / mockOEEData.length;

  const oeeGaugeData = [
    { name: 'OEE', value: selectedLine.oee, color: '#22c55e' },
    { name: 'Remaining', value: 100 - selectedLine.oee, color: '#334155' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Gauge className="h-8 w-8 text-cyan-400" />
            OEE 분석
          </h1>
          <p className="text-slate-400 mt-1">설비종합효율(OEE)을 분석하고 손실을 파악합니다.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="daily">일간</option>
            <option value="weekly">주간</option>
            <option value="monthly">월간</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors">
            <Download className="h-4 w-4" />
            보고서
          </button>
        </div>
      </div>

      {/* Overall KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Gauge className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">평균 OEE</p>
              <p className="text-2xl font-bold text-emerald-400">{overallOEE.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">가동률</p>
              <p className="text-2xl font-bold text-blue-400">{avgAvailability.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Zap className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">성능</p>
              <p className="text-2xl font-bold text-amber-400">{avgPerformance.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Target className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">품질</p>
              <p className="text-2xl font-bold text-purple-400">{avgQuality.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Line Selection & OEE Gauge */}
        <div className="space-y-6">
          {/* Line List */}
          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-white font-medium">라인별 OEE</h3>
            </div>
            <div className="divide-y divide-slate-700">
              {mockOEEData.map((line) => (
                <div
                  key={line.lineCode}
                  className={`p-4 cursor-pointer hover:bg-slate-700/50 ${
                    selectedLine.lineCode === line.lineCode ? 'bg-slate-700/50 border-l-2 border-cyan-400' : ''
                  }`}
                  onClick={() => setSelectedLine(line)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{line.lineName}</p>
                      <p className="text-xs text-slate-400">{line.lineCode}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${
                        line.oee >= line.target ? 'text-green-400' : line.oee >= line.target * 0.9 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {line.oee.toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-500">목표: {line.target}%</p>
                    </div>
                  </div>
                  <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        line.oee >= line.target ? 'bg-green-500' : line.oee >= line.target * 0.9 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${line.oee}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* OEE Details */}
        <div className="col-span-2 space-y-6">
          {/* OEE Breakdown */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">{selectedLine.lineName} - OEE 구성</h3>
            <div className="grid grid-cols-4 gap-4">
              {/* OEE Gauge */}
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={oeeGaugeData}
                      cx="50%"
                      cy="100%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={50}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {oeeGaugeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-2xl font-bold text-emerald-400 -mt-8">{selectedLine.oee.toFixed(1)}%</p>
                <p className="text-sm text-slate-400 mt-1">OEE</p>
              </div>

              {/* Availability */}
              <div className="bg-slate-900 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{selectedLine.availability.toFixed(1)}%</p>
                <p className="text-sm text-slate-400 mt-1">가동률 (A)</p>
                <div className="mt-3 text-xs text-slate-500">
                  <p>계획: {selectedLine.plannedTime}분</p>
                  <p>실제: {selectedLine.actualRunTime}분</p>
                </div>
              </div>

              {/* Performance */}
              <div className="bg-slate-900 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-amber-400">{selectedLine.performance.toFixed(1)}%</p>
                <p className="text-sm text-slate-400 mt-1">성능 (P)</p>
                <div className="mt-3 text-xs text-slate-500">
                  <p>이론: {selectedLine.idealCycleTime}sec</p>
                  <p>실제: {selectedLine.actualCycleTime}sec</p>
                </div>
              </div>

              {/* Quality */}
              <div className="bg-slate-900 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-purple-400">{selectedLine.quality.toFixed(1)}%</p>
                <p className="text-sm text-slate-400 mt-1">품질 (Q)</p>
                <div className="mt-3 text-xs text-slate-500">
                  <p>양품: {selectedLine.goodCount.toLocaleString()}</p>
                  <p>총: {selectedLine.totalCount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* OEE Trend */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">OEE 추이</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={oeeTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={[60, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="oee" name="OEE" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
                <Line type="monotone" dataKey="availability" name="가동률" stroke="#3b82f6" strokeWidth={1} />
                <Line type="monotone" dataKey="performance" name="성능" stroke="#f59e0b" strokeWidth={1} />
                <Line type="monotone" dataKey="quality" name="품질" stroke="#a855f7" strokeWidth={1} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Loss Analysis */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">6대 로스 분석</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={lossAnalysis} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" tickFormatter={(v) => `${v}분`} />
                <YAxis type="category" dataKey="category" stroke="#9ca3af" width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value}분 (${lossAnalysis.find(l => l.time === value)?.percentage}%)`, '손실시간']}
                />
                <Bar dataKey="time" radius={[0, 4, 4, 0]}>
                  {lossAnalysis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
