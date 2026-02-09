import { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, TrendingDown, Building2, Calendar, Download, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPie, Pie, Cell, Legend, AreaChart, Area } from 'recharts';

// 자산 가치 추이 데이터
const assetValueTrend = [
  { year: '2020', acquisitionCost: 5085, bookValue: 5085 },
  { year: '2021', acquisitionCost: 5170, bookValue: 4950 },
  { year: '2022', acquisitionCost: 7140, bookValue: 6580 },
  { year: '2023', acquisitionCost: 7910, bookValue: 6820 },
  { year: '2024', acquisitionCost: 8005, bookValue: 6900 },
];

// 유형별 자산 분포
const categoryDistribution = [
  { name: '건물', value: 4550000000, percent: 58.2 },
  { name: '기계장치', amount: 2067175000, percent: 26.5 },
  { name: '차량운반구', value: 32300000, percent: 0.4 },
  { name: '설비', value: 105600000, percent: 1.4 },
  { name: '무형자산', value: 120000000, percent: 1.5 },
  { name: '비품', value: 925000000, percent: 11.9 },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#10b981'];

// 부서별 자산 현황
const departmentAssets = [
  { department: '생산1팀', assetCount: 15, bookValue: 1892800000, depreciationRate: 18.5 },
  { department: '생산2팀', assetCount: 12, bookValue: 974800000, depreciationRate: 35.2 },
  { department: '품질팀', assetCount: 8, bookValue: 599375000, depreciationRate: 15.8 },
  { department: '물류팀', assetCount: 6, bookValue: 232300000, depreciationRate: 42.1 },
  { department: 'IT팀', assetCount: 10, bookValue: 225600000, depreciationRate: 28.5 },
  { department: '총무팀', assetCount: 5, bookValue: 4650000000, depreciationRate: 8.9 },
];

// 감가상각 추이
const depreciationTrend = [
  { month: '8월', monthly: 35542, accumulated: 1100000 },
  { month: '9월', monthly: 35542, accumulated: 1135542 },
  { month: '10월', monthly: 35542, accumulated: 1171084 },
  { month: '11월', monthly: 35542, accumulated: 1206626 },
  { month: '12월', monthly: 35542, accumulated: 1242168 },
  { month: '1월', monthly: 35542, accumulated: 1277710 },
];

// 내용연수별 자산
const usefulLifeDistribution = [
  { range: '1-5년', count: 12, value: 520000000 },
  { range: '6-10년', count: 18, value: 2567175000 },
  { range: '11-20년', count: 5, value: 380000000 },
  { range: '21년 이상', count: 3, value: 4550000000 },
];

// 자산 상태별 현황
const statusDistribution = [
  { status: '사용중', count: 35, value: 7775275000, color: '#10b981' },
  { status: '유휴', count: 3, value: 274800000, color: '#f59e0b' },
  { status: '수리중', count: 2, value: 85000000, color: '#ef4444' },
];

export default function AssetAnalysisPage() {
  const [selectedYear, setSelectedYear] = useState('2024');

  const totalBookValue = 7800175000;
  const totalAcquisitionCost = 8005000000;
  const totalDepreciation = totalAcquisitionCost - totalBookValue;
  const depreciationRate = ((totalDepreciation / totalAcquisitionCost) * 100).toFixed(1);

  const formatCurrency = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`;
    } else if (value >= 10000000) {
      return `${(value / 10000000).toFixed(1)}천만`;
    } else if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}만`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">자산 현황 분석</h1>
          <p className="text-slate-400">고정자산 종합 현황 및 분석 대시보드</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="2024">2024년</option>
            <option value="2023">2023년</option>
            <option value="2022">2022년</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            리포트 다운로드
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">총 취득원가</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalAcquisitionCost)}</p>
            </div>
            <Building2 className="w-10 h-10 text-blue-300 opacity-80" />
          </div>
          <div className="mt-3 text-blue-100 text-sm">
            총 40건 자산 보유
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">장부가액 합계</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalBookValue)}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-300 opacity-80" />
          </div>
          <div className="mt-3 text-green-100 text-sm">
            취득원가 대비 97.4%
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">감가상각누계액</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalDepreciation)}</p>
            </div>
            <TrendingDown className="w-10 h-10 text-purple-300 opacity-80" />
          </div>
          <div className="mt-3 text-purple-100 text-sm">
            상각률 {depreciationRate}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm">연간 상각비</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(426500000)}</p>
            </div>
            <Calendar className="w-10 h-10 text-cyan-300 opacity-80" />
          </div>
          <div className="mt-3 text-cyan-100 text-sm">
            월 평균 3,554만원
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Value Trend */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">자산 가치 추이 (연도별)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={assetValueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v}억`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => [`${value.toLocaleString()}백만원`, '']}
              />
              <Area type="monotone" dataKey="acquisitionCost" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="취득원가" />
              <Area type="monotone" dataKey="bookValue" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.5} name="장부가액" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution Pie */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">자산 유형별 분포</h3>
          <div className="flex items-center">
            <ResponsiveContainer width="50%" height={250}>
              <RechartsPie>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="w-1/2 space-y-2">
              {categoryDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                    <span className="text-slate-300 text-sm">{item.name}</span>
                  </div>
                  <span className="text-white text-sm">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Assets */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">부서별 자산 현황</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={departmentAssets} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
              <YAxis type="category" dataKey="department" stroke="#94a3b8" fontSize={12} width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: number) => [formatCurrency(value), '장부가액']}
              />
              <Bar dataKey="bookValue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Depreciation Trend */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">감가상각 추이</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={depreciationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v/1000}천`} />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v/10000}만`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString()}${name === '월별상각' ? '천원' : '천원'}`,
                  name === 'monthly' ? '월별 상각비' : '누적 상각'
                ]}
              />
              <Bar yAxisId="left" dataKey="monthly" fill="#8b5cf6" name="월별상각" />
              <Line yAxisId="right" type="monotone" dataKey="accumulated" stroke="#10b981" strokeWidth={2} name="누적상각" dot={{ fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Status */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">자산 상태별 현황</h3>
          <div className="space-y-4">
            {statusDistribution.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-white">{item.status}</span>
                  </div>
                  <span className="text-slate-400">{item.count}건</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: item.color,
                        width: `${(item.value / totalBookValue) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-slate-300 text-sm w-16 text-right">{formatCurrency(item.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Useful Life Distribution */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">내용연수별 분포</h3>
          <div className="space-y-4">
            {usefulLifeDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div>
                  <p className="text-white">{item.range}</p>
                  <p className="text-slate-400 text-sm">{item.count}건</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{formatCurrency(item.value)}</p>
                  <p className="text-slate-400 text-sm">
                    {((item.value / totalBookValue) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">주요 지표</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">평균 자산 연령</span>
              <span className="text-white font-medium">3.2년</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">평균 상각률</span>
              <span className="text-white font-medium">25.6%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">자산 가동률</span>
              <span className="text-green-400 font-medium">87.5%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">자산회전율</span>
              <span className="text-white font-medium">2.8회</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">유휴자산 비율</span>
              <span className="text-yellow-400 font-medium">7.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
