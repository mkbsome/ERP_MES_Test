import { useState } from 'react';
import {
  FileBarChart,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Printer,
  Filter,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';

interface CostReport {
  category: string;
  standardAmount: number;
  actualAmount: number;
  variance: number;
  varianceRate: number;
}

interface MonthlyTrend {
  month: string;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
}

const costStructure = [
  { name: '재료비', value: 71.5, color: '#3b82f6' },
  { name: '직접노무비', value: 13.5, color: '#22c55e' },
  { name: '간접노무비', value: 5.0, color: '#14b8a6' },
  { name: '제조경비', value: 10.0, color: '#f59e0b' },
];

const productCostComparison = [
  { product: 'SMB-001', standard: 45000, actual: 46500 },
  { product: 'PWR-001', standard: 28000, actual: 27200 },
  { product: 'LED-001', standard: 15000, actual: 14950 },
  { product: 'ECU-001', standard: 85000, actual: 90300 },
  { product: 'IOT-001', standard: 22000, actual: 21800 },
];

const monthlyTrend: MonthlyTrend[] = [
  { month: '2023-09', materialCost: 125, laborCost: 32, overheadCost: 18, totalCost: 175 },
  { month: '2023-10', materialCost: 132, laborCost: 33, overheadCost: 19, totalCost: 184 },
  { month: '2023-11', materialCost: 128, laborCost: 34, overheadCost: 18, totalCost: 180 },
  { month: '2023-12', materialCost: 138, laborCost: 35, overheadCost: 20, totalCost: 193 },
  { month: '2024-01', materialCost: 142, laborCost: 36, overheadCost: 21, totalCost: 199 },
  { month: '2024-02', materialCost: 148, laborCost: 38, overheadCost: 22, totalCost: 208 },
];

const costSummary: CostReport[] = [
  { category: '재료비', standardAmount: 125000000, actualAmount: 129500000, variance: 4500000, varianceRate: 3.6 },
  { category: '직접노무비', standardAmount: 23500000, actualAmount: 24800000, variance: 1300000, varianceRate: 5.5 },
  { category: '간접노무비', standardAmount: 8700000, actualAmount: 8400000, variance: -300000, varianceRate: -3.4 },
  { category: '제조경비', standardAmount: 17300000, actualAmount: 16800000, variance: -500000, varianceRate: -2.9 },
];

export default function CostReportPage() {
  const [reportPeriod, setReportPeriod] = useState('2024-02');
  const [reportType, setReportType] = useState<'summary' | 'detail' | 'trend'>('summary');

  const totalStandard = costSummary.reduce((sum, c) => sum + c.standardAmount, 0);
  const totalActual = costSummary.reduce((sum, c) => sum + c.actualAmount, 0);
  const totalVariance = totalActual - totalStandard;
  const totalVarianceRate = ((totalVariance / totalStandard) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileBarChart className="h-8 w-8 text-cyan-400" />
            원가보고서
          </h1>
          <p className="text-slate-400 mt-1">기간별 원가현황 및 분석 보고서를 생성합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <Printer className="h-4 w-4" />
            인쇄
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors">
            <Download className="h-4 w-4" />
            PDF 다운로드
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="month"
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'summary' | 'detail' | 'trend')}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="summary">요약 보고서</option>
              <option value="detail">상세 보고서</option>
              <option value="trend">추이 분석</option>
            </select>
          </div>
          <div className="flex gap-2">
            {['summary', 'detail', 'trend'].map((type) => (
              <button
                key={type}
                onClick={() => setReportType(type as 'summary' | 'detail' | 'trend')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  reportType === type
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {type === 'summary' ? '요약' : type === 'detail' ? '상세' : '추이'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Title */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white">월간 원가 {reportType === 'summary' ? '요약' : reportType === 'detail' ? '상세' : '추이'} 보고서</h2>
          <p className="text-slate-400 mt-1">보고 기간: {reportPeriod}</p>
          <p className="text-slate-500 text-sm">작성일: 2024-02-04 | 작성자: 시스템</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-slate-400 text-sm">표준원가 합계</p>
            <p className="text-2xl font-bold text-blue-400">₩{(totalStandard / 1000000).toFixed(0)}M</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-slate-400 text-sm">실제원가 합계</p>
            <p className="text-2xl font-bold text-emerald-400">₩{(totalActual / 1000000).toFixed(0)}M</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-slate-400 text-sm">원가차이</p>
            <p className={`text-2xl font-bold flex items-center gap-1 ${totalVariance > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {totalVariance > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              ₩{Math.abs(totalVariance / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-slate-400 text-sm">차이율</p>
            <p className={`text-2xl font-bold ${Number(totalVarianceRate) > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {Number(totalVarianceRate) > 0 ? '+' : ''}{totalVarianceRate}%
            </p>
          </div>
        </div>

        {reportType === 'summary' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Cost Structure Pie Chart */}
            <div className="bg-slate-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-cyan-400" />
                원가 구성비
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={costStructure}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}%`}
                  >
                    {costStructure.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Cost Element Summary */}
            <div className="bg-slate-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">원가요소별 현황</h3>
              <div className="space-y-3">
                {costSummary.map((item) => (
                  <div key={item.category} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <span className="text-white font-medium">{item.category}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">₩{(item.actualAmount / 1000000).toFixed(1)}M</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        item.varianceRate > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {item.varianceRate > 0 ? '+' : ''}{item.varianceRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {reportType === 'detail' && (
          <div className="space-y-6">
            {/* Product Cost Comparison */}
            <div className="bg-slate-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">제품별 원가 비교</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productCostComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="product" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(v) => `₩${(v/1000)}K`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(value: number) => `₩${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="standard" name="표준원가" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="실제원가" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Cost Table */}
            <div className="bg-slate-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">원가요소 상세</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">원가요소</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">표준원가</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">실제원가</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">차이</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">차이율</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {costSummary.map((item) => (
                    <tr key={item.category}>
                      <td className="px-4 py-3 text-white">{item.category}</td>
                      <td className="px-4 py-3 text-right text-blue-400">₩{(item.standardAmount / 1000000).toFixed(1)}M</td>
                      <td className="px-4 py-3 text-right text-emerald-400">₩{(item.actualAmount / 1000000).toFixed(1)}M</td>
                      <td className={`px-4 py-3 text-right ${item.variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {item.variance > 0 ? '+' : ''}₩{(item.variance / 1000000).toFixed(2)}M
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-sm ${
                          item.varianceRate > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {item.varianceRate > 0 ? '+' : ''}{item.varianceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-800 font-semibold">
                    <td className="px-4 py-3 text-white">합계</td>
                    <td className="px-4 py-3 text-right text-blue-400">₩{(totalStandard / 1000000).toFixed(1)}M</td>
                    <td className="px-4 py-3 text-right text-emerald-400">₩{(totalActual / 1000000).toFixed(1)}M</td>
                    <td className={`px-4 py-3 text-right ${totalVariance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {totalVariance > 0 ? '+' : ''}₩{(totalVariance / 1000000).toFixed(2)}M
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-sm ${
                        Number(totalVarianceRate) > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {Number(totalVarianceRate) > 0 ? '+' : ''}{totalVarianceRate}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'trend' && (
          <div className="space-y-6">
            {/* Monthly Trend Chart */}
            <div className="bg-slate-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">월별 원가 추이</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(v) => `₩${v}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(value: number) => `₩${value}M`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="totalCost" name="총원가" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                  <Line type="monotone" dataKey="materialCost" name="재료비" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                  <Line type="monotone" dataKey="laborCost" name="노무비" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
                  <Line type="monotone" dataKey="overheadCost" name="경비" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Trend Analysis */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">재료비 추이</h4>
                <p className="text-2xl font-bold text-blue-400">+18.4%</p>
                <p className="text-sm text-slate-500">최근 6개월 증가율</p>
                <div className="mt-2 flex items-center gap-1 text-red-400 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  상승 추세
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">노무비 추이</h4>
                <p className="text-2xl font-bold text-emerald-400">+18.8%</p>
                <p className="text-sm text-slate-500">최근 6개월 증가율</p>
                <div className="mt-2 flex items-center gap-1 text-red-400 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  상승 추세
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">경비 추이</h4>
                <p className="text-2xl font-bold text-amber-400">+22.2%</p>
                <p className="text-sm text-slate-500">최근 6개월 증가율</p>
                <div className="mt-2 flex items-center gap-1 text-red-400 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  상승 추세
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
