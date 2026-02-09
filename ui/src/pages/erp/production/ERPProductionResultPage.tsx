import { useState } from 'react';
import {
  ClipboardCheck,
  Search,
  RefreshCw,
  Plus,
  Calendar,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ProductionResult {
  resultNo: string;
  workOrderNo: string;
  productCode: string;
  productName: string;
  productionDate: string;
  shift: '주간' | '야간';
  lineCode: string;
  lineName: string;
  planQty: number;
  goodQty: number;
  defectQty: number;
  scrapQty: number;
  achievementRate: number;
  defectRate: number;
  status: 'CONFIRMED' | 'PENDING' | 'REJECTED';
}

const mockResults: ProductionResult[] = [
  {
    resultNo: 'PR-2024-0201-001',
    workOrderNo: 'WO-2024-0201',
    productCode: 'FG-SMB-001',
    productName: '스마트폰 메인보드 A1',
    productionDate: '2024-02-01',
    shift: '주간',
    lineCode: 'SMT-L01',
    lineName: 'SMT 1라인',
    planQty: 250,
    goodQty: 242,
    defectQty: 5,
    scrapQty: 3,
    achievementRate: 96.8,
    defectRate: 2.0,
    status: 'CONFIRMED',
  },
  {
    resultNo: 'PR-2024-0201-002',
    workOrderNo: 'WO-2024-0201',
    productCode: 'FG-SMB-001',
    productName: '스마트폰 메인보드 A1',
    productionDate: '2024-02-01',
    shift: '야간',
    lineCode: 'SMT-L01',
    lineName: 'SMT 1라인',
    planQty: 250,
    goodQty: 238,
    defectQty: 8,
    scrapQty: 4,
    achievementRate: 95.2,
    defectRate: 3.2,
    status: 'CONFIRMED',
  },
  {
    resultNo: 'PR-2024-0202-001',
    workOrderNo: 'WO-2024-0205',
    productCode: 'FG-IOT-001',
    productName: 'IoT 모듈 M1',
    productionDate: '2024-02-02',
    shift: '주간',
    lineCode: 'SMT-L04',
    lineName: 'SMT 4라인',
    planQty: 300,
    goodQty: 295,
    defectQty: 3,
    scrapQty: 2,
    achievementRate: 98.3,
    defectRate: 1.0,
    status: 'CONFIRMED',
  },
  {
    resultNo: 'PR-2024-0202-002',
    workOrderNo: 'WO-2024-0205',
    productCode: 'FG-IOT-001',
    productName: 'IoT 모듈 M1',
    productionDate: '2024-02-02',
    shift: '야간',
    lineCode: 'SMT-L04',
    lineName: 'SMT 4라인',
    planQty: 300,
    goodQty: 280,
    defectQty: 15,
    scrapQty: 5,
    achievementRate: 93.3,
    defectRate: 5.0,
    status: 'PENDING',
  },
  {
    resultNo: 'PR-2024-0203-001',
    workOrderNo: 'WO-2024-0201',
    productCode: 'FG-SMB-001',
    productName: '스마트폰 메인보드 A1',
    productionDate: '2024-02-03',
    shift: '주간',
    lineCode: 'SMT-L01',
    lineName: 'SMT 1라인',
    planQty: 250,
    goodQty: 170,
    defectQty: 25,
    scrapQty: 55,
    achievementRate: 68.0,
    defectRate: 10.0,
    status: 'REJECTED',
  },
];

const statusConfig = {
  CONFIRMED: { label: '확정', color: 'bg-green-500', icon: CheckCircle },
  PENDING: { label: '대기', color: 'bg-yellow-500', icon: AlertTriangle },
  REJECTED: { label: '반려', color: 'bg-red-500', icon: XCircle },
};

const dailyChartData = [
  { date: '02-01', plan: 500, good: 480, defect: 13 },
  { date: '02-02', plan: 600, good: 575, defect: 18 },
  { date: '02-03', plan: 250, good: 170, defect: 25 },
  { date: '02-04', plan: 400, good: 0, defect: 0 },
  { date: '02-05', plan: 350, good: 0, defect: 0 },
];

const defectByType = [
  { name: '솔더브릿지', value: 35, color: '#ef4444' },
  { name: '부품누락', value: 25, color: '#f97316' },
  { name: '냉납', value: 20, color: '#eab308' },
  { name: '위치불량', value: 12, color: '#22c55e' },
  { name: '기타', value: 8, color: '#6b7280' },
];

export default function ERPProductionResultPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const filteredResults = mockResults.filter(result => {
    const matchesSearch = result.resultNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          result.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || result.status === statusFilter;
    const matchesDate = !dateFilter || result.productionDate === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const summary = {
    totalPlan: mockResults.reduce((sum, r) => sum + r.planQty, 0),
    totalGood: mockResults.reduce((sum, r) => sum + r.goodQty, 0),
    totalDefect: mockResults.reduce((sum, r) => sum + r.defectQty, 0),
    avgAchievement: (mockResults.reduce((sum, r) => sum + r.achievementRate, 0) / mockResults.length).toFixed(1),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-cyan-400" />
            ERP 생산실적
          </h1>
          <p className="text-slate-400 mt-1">작업지시 대비 생산실적을 관리하고 분석합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors">
            <Plus className="h-4 w-4" />
            실적 등록
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">계획 수량</p>
              <p className="text-2xl font-bold text-white">{summary.totalPlan.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Package className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">양품 수량</p>
              <p className="text-2xl font-bold text-green-400">{summary.totalGood.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">불량 수량</p>
              <p className="text-2xl font-bold text-red-400">{summary.totalDefect.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">평균 달성률</p>
              <p className="text-2xl font-bold text-cyan-400">{summary.avgAchievement}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-6">
        {/* Daily Production Chart */}
        <div className="col-span-2 bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            일별 생산현황
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              <Bar dataKey="plan" name="계획" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="good" name="양품" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="defect" name="불량" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Defect by Type */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">불량유형 분석</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={defectByType}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {defectByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {defectByType.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="text-slate-400">{item.value}건</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="실적번호 또는 제품명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">전체 상태</option>
            <option value="CONFIRMED">확정</option>
            <option value="PENDING">대기</option>
            <option value="REJECTED">반려</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-700/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">실적번호</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">생산일</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">제품</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">교대</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">라인</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">계획</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">양품</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">불량</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">달성률</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">불량률</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredResults.map((result) => {
              const StatusIcon = statusConfig[result.status].icon;
              return (
                <tr key={result.resultNo} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-cyan-400 font-medium">{result.resultNo}</p>
                      <p className="text-xs text-slate-500">{result.workOrderNo}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white">{result.productionDate}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white">{result.productName}</p>
                      <p className="text-xs text-slate-400">{result.productCode}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.shift === '주간' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-indigo-500/20 text-indigo-400'
                    }`}>
                      {result.shift}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{result.lineName}</td>
                  <td className="px-4 py-3 text-right text-white">{result.planQty.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-green-400">{result.goodQty.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-red-400">{result.defectQty.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.achievementRate >= 95 ? 'bg-green-500/20 text-green-400' :
                      result.achievementRate >= 80 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {result.achievementRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.defectRate <= 2 ? 'bg-green-500/20 text-green-400' :
                      result.defectRate <= 5 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {result.defectRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${statusConfig[result.status].color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig[result.status].label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
