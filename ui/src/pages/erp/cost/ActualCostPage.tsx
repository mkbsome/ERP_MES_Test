import { useState } from 'react';
import {
  Receipt,
  Search,
  RefreshCw,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ActualCost {
  workOrderNo: string;
  productCode: string;
  productName: string;
  productionDate: string;
  quantity: number;
  unit: string;
  standardCost: number;
  actualMaterial: number;
  actualLabor: number;
  actualOverhead: number;
  actualTotal: number;
  variance: number;
  varianceRate: number;
}

const mockActualCosts: ActualCost[] = [
  {
    workOrderNo: 'WO-2024-0201',
    productCode: 'FG-SMB-001',
    productName: '스마트폰 메인보드 A1',
    productionDate: '2024-02-01',
    quantity: 480,
    unit: 'EA',
    standardCost: 45000,
    actualMaterial: 33500,
    actualLabor: 8200,
    actualOverhead: 4800,
    actualTotal: 46500,
    variance: 1500,
    varianceRate: 3.3,
  },
  {
    workOrderNo: 'WO-2024-0202',
    productCode: 'FG-PWR-001',
    productName: '전원보드 P1',
    productionDate: '2024-02-02',
    quantity: 350,
    unit: 'EA',
    standardCost: 28000,
    actualMaterial: 17800,
    actualLabor: 6200,
    actualOverhead: 3200,
    actualTotal: 27200,
    variance: -800,
    varianceRate: -2.9,
  },
  {
    workOrderNo: 'WO-2024-0203',
    productCode: 'FG-LED-001',
    productName: 'LED 드라이버 L1',
    productionDate: '2024-02-02',
    quantity: 575,
    unit: 'EA',
    standardCost: 15000,
    actualMaterial: 9200,
    actualLabor: 3800,
    actualOverhead: 1950,
    actualTotal: 14950,
    variance: -50,
    varianceRate: -0.3,
  },
  {
    workOrderNo: 'WO-2024-0204',
    productCode: 'FG-ECU-001',
    productName: '차량 ECU A',
    productionDate: '2024-02-03',
    quantity: 120,
    unit: 'EA',
    standardCost: 85000,
    actualMaterial: 65000,
    actualLabor: 16500,
    actualOverhead: 8800,
    actualTotal: 90300,
    variance: 5300,
    varianceRate: 6.2,
  },
  {
    workOrderNo: 'WO-2024-0205',
    productCode: 'FG-IOT-001',
    productName: 'IoT 모듈 M1',
    productionDate: '2024-02-03',
    quantity: 500,
    unit: 'EA',
    standardCost: 22000,
    actualMaterial: 14200,
    actualLabor: 5200,
    actualOverhead: 2400,
    actualTotal: 21800,
    variance: -200,
    varianceRate: -0.9,
  },
];

const costTrendData = [
  { date: '01-28', standard: 45000, actual: 44500, variance: -500 },
  { date: '01-29', standard: 45000, actual: 46200, variance: 1200 },
  { date: '01-30', standard: 45000, actual: 45800, variance: 800 },
  { date: '01-31', standard: 45000, actual: 44200, variance: -800 },
  { date: '02-01', standard: 45000, actual: 46500, variance: 1500 },
  { date: '02-02', standard: 45000, actual: 45100, variance: 100 },
  { date: '02-03', standard: 45000, actual: 47200, variance: 2200 },
];

export default function ActualCostPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '2024-02-01', end: '2024-02-03' });

  const filteredCosts = mockActualCosts.filter(cost =>
    cost.workOrderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cost.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const summary = {
    totalStandard: mockActualCosts.reduce((sum, c) => sum + (c.standardCost * c.quantity), 0),
    totalActual: mockActualCosts.reduce((sum, c) => sum + (c.actualTotal * c.quantity), 0),
    totalVariance: mockActualCosts.reduce((sum, c) => sum + (c.variance * c.quantity), 0),
    favorableCount: mockActualCosts.filter(c => c.variance < 0).length,
    unfavorableCount: mockActualCosts.filter(c => c.variance > 0).length,
  };

  const overallVarianceRate = ((summary.totalVariance / summary.totalStandard) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Receipt className="h-8 w-8 text-cyan-400" />
            실제원가
          </h1>
          <p className="text-slate-400 mt-1">작업지시별 실제 발생원가를 집계하고 분석합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <RefreshCw className="h-4 w-4" />
            집계 갱신
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors">
            <Download className="h-4 w-4" />
            내보내기
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">표준원가 합계</p>
              <p className="text-xl font-bold text-blue-400">₩{(summary.totalStandard / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Receipt className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">실제원가 합계</p>
              <p className="text-xl font-bold text-emerald-400">₩{(summary.totalActual / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${summary.totalVariance > 0 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
              {summary.totalVariance > 0 ? (
                <TrendingUp className="h-5 w-5 text-red-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-green-400" />
              )}
            </div>
            <div>
              <p className="text-slate-400 text-sm">원가차이</p>
              <p className={`text-xl font-bold ${summary.totalVariance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {summary.totalVariance > 0 ? '+' : ''}₩{(summary.totalVariance / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingDown className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">유리한 차이</p>
              <p className="text-xl font-bold text-green-400">{summary.favorableCount}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">불리한 차이</p>
              <p className="text-xl font-bold text-red-400">{summary.unfavorableCount}건</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Trend Chart */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">원가 추이 (스마트폰 메인보드 A1)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={costTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#f1f5f9' }}
              formatter={(value: number, name: string) => [`₩${value.toLocaleString()}`, name === 'standard' ? '표준원가' : name === 'actual' ? '실제원가' : '차이']}
            />
            <Legend formatter={(value) => value === 'standard' ? '표준원가' : value === 'actual' ? '실제원가' : '차이'} />
            <Area type="monotone" dataKey="standard" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} name="standard" />
            <Area type="monotone" dataKey="actual" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} name="actual" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="작업지시번호 또는 제품명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
            <span className="text-slate-400">~</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <Filter className="h-4 w-4" />
            필터
          </button>
        </div>
      </div>

      {/* Actual Cost Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-700/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">작업지시</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">제품</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">생산일</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">수량</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">표준원가</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">재료비</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">노무비</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">경비</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">실제원가</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">차이</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredCosts.map((cost) => (
              <tr key={cost.workOrderNo} className="hover:bg-slate-700/50">
                <td className="px-4 py-3 text-cyan-400 font-medium">{cost.workOrderNo}</td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white">{cost.productName}</p>
                    <p className="text-xs text-slate-400">{cost.productCode}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-slate-300">{cost.productionDate}</td>
                <td className="px-4 py-3 text-right text-white">{cost.quantity.toLocaleString()} {cost.unit}</td>
                <td className="px-4 py-3 text-right text-slate-300">₩{cost.standardCost.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-blue-400">₩{cost.actualMaterial.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-emerald-400">₩{cost.actualLabor.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-amber-400">₩{cost.actualOverhead.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-white font-semibold">₩{cost.actualTotal.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {cost.variance > 0 ? (
                      <TrendingUp className="h-4 w-4 text-red-400" />
                    ) : cost.variance < 0 ? (
                      <TrendingDown className="h-4 w-4 text-green-400" />
                    ) : (
                      <Minus className="h-4 w-4 text-slate-400" />
                    )}
                    <span className={`font-medium ${
                      cost.variance > 0 ? 'text-red-400' : cost.variance < 0 ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {cost.variance > 0 ? '+' : ''}{cost.varianceRate}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
