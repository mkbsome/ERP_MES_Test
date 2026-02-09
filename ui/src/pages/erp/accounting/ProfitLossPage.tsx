import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Download, ChevronRight, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

interface PLItem {
  code: string;
  name: string;
  level: number;
  currentMonth: number;
  previousMonth: number;
  ytd: number;
  budget: number;
  variance: number;
  variancePercent: number;
}

const plData: PLItem[] = [
  // 매출액
  { code: '1000', name: '매출액', level: 0, currentMonth: 2850000000, previousMonth: 2720000000, ytd: 8500000000, budget: 8200000000, variance: 300000000, variancePercent: 3.7 },
  { code: '1100', name: '제품매출', level: 1, currentMonth: 2650000000, previousMonth: 2520000000, ytd: 7900000000, budget: 7600000000, variance: 300000000, variancePercent: 3.9 },
  { code: '1200', name: '용역매출', level: 1, currentMonth: 200000000, previousMonth: 200000000, ytd: 600000000, budget: 600000000, variance: 0, variancePercent: 0 },

  // 매출원가
  { code: '2000', name: '매출원가', level: 0, currentMonth: 1995000000, previousMonth: 1904000000, ytd: 5950000000, budget: 5740000000, variance: -210000000, variancePercent: -3.7 },
  { code: '2100', name: '재료비', level: 1, currentMonth: 1140000000, previousMonth: 1088000000, ytd: 3400000000, budget: 3280000000, variance: -120000000, variancePercent: -3.7 },
  { code: '2200', name: '노무비', level: 1, currentMonth: 427500000, previousMonth: 408000000, ytd: 1275000000, budget: 1230000000, variance: -45000000, variancePercent: -3.7 },
  { code: '2300', name: '제조경비', level: 1, currentMonth: 427500000, previousMonth: 408000000, ytd: 1275000000, budget: 1230000000, variance: -45000000, variancePercent: -3.7 },

  // 매출총이익
  { code: '3000', name: '매출총이익', level: 0, currentMonth: 855000000, previousMonth: 816000000, ytd: 2550000000, budget: 2460000000, variance: 90000000, variancePercent: 3.7 },

  // 판매비와관리비
  { code: '4000', name: '판매비와관리비', level: 0, currentMonth: 427500000, previousMonth: 408000000, ytd: 1275000000, budget: 1230000000, variance: -45000000, variancePercent: -3.7 },
  { code: '4100', name: '급여', level: 1, currentMonth: 180000000, previousMonth: 180000000, ytd: 540000000, budget: 540000000, variance: 0, variancePercent: 0 },
  { code: '4200', name: '복리후생비', level: 1, currentMonth: 45000000, previousMonth: 45000000, ytd: 135000000, budget: 135000000, variance: 0, variancePercent: 0 },
  { code: '4300', name: '감가상각비', level: 1, currentMonth: 35542000, previousMonth: 35542000, ytd: 106626000, budget: 106626000, variance: 0, variancePercent: 0 },
  { code: '4400', name: '운반비', level: 1, currentMonth: 50000000, previousMonth: 48000000, ytd: 145000000, budget: 140000000, variance: -5000000, variancePercent: -3.6 },
  { code: '4500', name: '기타판관비', level: 1, currentMonth: 116958000, previousMonth: 99458000, ytd: 348374000, budget: 308374000, variance: -40000000, variancePercent: -13.0 },

  // 영업이익
  { code: '5000', name: '영업이익', level: 0, currentMonth: 427500000, previousMonth: 408000000, ytd: 1275000000, budget: 1230000000, variance: 45000000, variancePercent: 3.7 },

  // 영업외손익
  { code: '6000', name: '영업외수익', level: 0, currentMonth: 15000000, previousMonth: 12000000, ytd: 42000000, budget: 36000000, variance: 6000000, variancePercent: 16.7 },
  { code: '7000', name: '영업외비용', level: 0, currentMonth: 25000000, previousMonth: 22000000, ytd: 72000000, budget: 66000000, variance: -6000000, variancePercent: -9.1 },

  // 법인세비용차감전순이익
  { code: '8000', name: '법인세비용차감전순이익', level: 0, currentMonth: 417500000, previousMonth: 398000000, ytd: 1245000000, budget: 1200000000, variance: 45000000, variancePercent: 3.8 },

  // 법인세비용
  { code: '9000', name: '법인세비용', level: 0, currentMonth: 91850000, previousMonth: 87560000, ytd: 273900000, budget: 264000000, variance: -9900000, variancePercent: -3.8 },

  // 당기순이익
  { code: '9999', name: '당기순이익', level: 0, currentMonth: 325650000, previousMonth: 310440000, ytd: 971100000, budget: 936000000, variance: 35100000, variancePercent: 3.8 },
];

const monthlyTrend = [
  { month: '8월', revenue: 2650, cost: 1855, grossProfit: 795, operatingProfit: 400, netProfit: 310 },
  { month: '9월', revenue: 2720, cost: 1904, grossProfit: 816, operatingProfit: 410, netProfit: 320 },
  { month: '10월', revenue: 2680, cost: 1876, grossProfit: 804, operatingProfit: 405, netProfit: 315 },
  { month: '11월', revenue: 2750, cost: 1925, grossProfit: 825, operatingProfit: 415, netProfit: 322 },
  { month: '12월', revenue: 2800, cost: 1960, grossProfit: 840, operatingProfit: 420, netProfit: 326 },
  { month: '1월', revenue: 2850, cost: 1995, grossProfit: 855, operatingProfit: 428, netProfit: 332 },
];

export default function ProfitLossPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01');
  const [showDetail, setShowDetail] = useState(true);

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`;
    } else if (absValue >= 10000000) {
      return `${(value / 10000000).toFixed(1)}천만`;
    }
    return value.toLocaleString();
  };

  const getVarianceColor = (variance: number, isExpense: boolean) => {
    if (variance === 0) return 'text-slate-400';
    if (isExpense) {
      return variance > 0 ? 'text-red-400' : 'text-green-400';
    }
    return variance > 0 ? 'text-green-400' : 'text-red-400';
  };

  const netProfit = plData.find(p => p.code === '9999')!;
  const revenue = plData.find(p => p.code === '1000')!;
  const grossProfit = plData.find(p => p.code === '3000')!;
  const operatingProfit = plData.find(p => p.code === '5000')!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">손익관리</h1>
          <p className="text-slate-400">손익계산서 및 수익성 분석</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="2024-01">2024년 1월</option>
            <option value="2023-12">2023년 12월</option>
            <option value="2023-Q4">2023년 4분기</option>
            <option value="2023">2023년</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            내보내기
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5">
          <p className="text-blue-100 text-sm">매출액</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(revenue.currentMonth)}</p>
          <div className="mt-2 flex items-center gap-1 text-blue-200 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>전월 대비 +{((revenue.currentMonth - revenue.previousMonth) / revenue.previousMonth * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5">
          <p className="text-green-100 text-sm">매출총이익</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(grossProfit.currentMonth)}</p>
          <div className="mt-2 text-green-200 text-sm">
            매출총이익률 {(grossProfit.currentMonth / revenue.currentMonth * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-5">
          <p className="text-purple-100 text-sm">영업이익</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(operatingProfit.currentMonth)}</p>
          <div className="mt-2 text-purple-200 text-sm">
            영업이익률 {(operatingProfit.currentMonth / revenue.currentMonth * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl p-5">
          <p className="text-cyan-100 text-sm">당기순이익</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(netProfit.currentMonth)}</p>
          <div className="mt-2 text-cyan-200 text-sm">
            순이익률 {(netProfit.currentMonth / revenue.currentMonth * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">월별 수익 추이</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v}백만`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: number) => [`${value}백만원`, '']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="매출" />
              <Area type="monotone" dataKey="grossProfit" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="매출총이익" />
              <Area type="monotone" dataKey="netProfit" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} name="순이익" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Margins */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">이익률 추이</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyTrend.map(m => ({
              month: m.month,
              grossMargin: (m.grossProfit / m.revenue * 100).toFixed(1),
              operatingMargin: (m.operatingProfit / m.revenue * 100).toFixed(1),
              netMargin: (m.netProfit / m.revenue * 100).toFixed(1),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: number) => [`${value}%`, '']}
              />
              <Line type="monotone" dataKey="grossMargin" stroke="#10b981" strokeWidth={2} name="매출총이익률" dot={{ fill: '#10b981' }} />
              <Line type="monotone" dataKey="operatingMargin" stroke="#f59e0b" strokeWidth={2} name="영업이익률" dot={{ fill: '#f59e0b' }} />
              <Line type="monotone" dataKey="netMargin" stroke="#8b5cf6" strokeWidth={2} name="순이익률" dot={{ fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Toggle Detail */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowDetail(!showDetail)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            showDetail ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
          }`}
        >
          세부 항목 {showDetail ? '숨기기' : '표시'}
        </button>
      </div>

      {/* P&L Statement */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-white font-medium">손익계산서</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">계정과목</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">당월</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">전월</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">누계</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">예산</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">차이</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {plData
                .filter(item => showDetail || item.level === 0)
                .map((item) => (
                  <tr
                    key={item.code}
                    className={`hover:bg-slate-700/30 transition-colors ${
                      item.level === 0 ? 'bg-slate-700/20 font-medium' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`text-white ${item.level === 1 ? 'pl-6 text-sm' : ''}`}
                        style={{ paddingLeft: item.level * 24 }}
                      >
                        {item.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {item.currentMonth.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {item.previousMonth.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {item.ytd.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {item.budget.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-right ${getVarianceColor(
                      item.variance,
                      item.code.startsWith('2') || item.code.startsWith('4') || item.code.startsWith('7') || item.code.startsWith('9')
                    )}`}>
                      {item.variance >= 0 ? '+' : ''}{item.variance.toLocaleString()}
                      <span className="text-xs ml-1">
                        ({item.variancePercent >= 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%)
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
