import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';

interface CashFlow {
  id: string;
  date: string;
  type: 'inflow' | 'outflow';
  category: string;
  description: string;
  amount: number;
  balance: number;
  reference?: string;
}

const mockCashFlows: CashFlow[] = [
  { id: '1', date: '2024-01-20', type: 'inflow', category: '매출입금', description: '삼성전자 매출대금 입금', amount: 450000000, balance: 2850000000, reference: 'SO-2024-0125' },
  { id: '2', date: '2024-01-19', type: 'outflow', category: '매입지급', description: '삼성전기 매입대금 지급', amount: 285000000, balance: 2400000000, reference: 'PO-2024-0089' },
  { id: '3', date: '2024-01-18', type: 'inflow', category: '매출입금', description: 'LG전자 매출대금 입금', amount: 320000000, balance: 2685000000, reference: 'SO-2024-0118' },
  { id: '4', date: '2024-01-17', type: 'outflow', category: '급여', description: '1월 급여 지급', amount: 180000000, balance: 2365000000 },
  { id: '5', date: '2024-01-16', type: 'outflow', category: '운영비', description: '공장 전기료', amount: 45000000, balance: 2545000000 },
  { id: '6', date: '2024-01-15', type: 'inflow', category: '매출입금', description: 'SK하이닉스 매출대금 입금', amount: 280000000, balance: 2590000000, reference: 'SO-2024-0112' },
  { id: '7', date: '2024-01-12', type: 'outflow', category: '매입지급', description: '하이닉스 매입대금 지급', amount: 450000000, balance: 2310000000, reference: 'PO-2024-0075' },
  { id: '8', date: '2024-01-10', type: 'outflow', category: '설비투자', description: 'SMT 설비 잔금 지급', amount: 200000000, balance: 2760000000 },
];

const monthlyTrend = [
  { month: '8월', inflow: 1850, outflow: 1620, balance: 2100 },
  { month: '9월', inflow: 2100, outflow: 1850, balance: 2350 },
  { month: '10월', inflow: 1950, outflow: 1780, balance: 2520 },
  { month: '11월', inflow: 2250, outflow: 1920, balance: 2850 },
  { month: '12월', inflow: 2400, outflow: 2150, balance: 3100 },
  { month: '1월', inflow: 1850, outflow: 1960, balance: 2850 },
];

const categoryBreakdown = {
  inflow: [
    { name: '매출입금', amount: 1650000000, percent: 85 },
    { name: '이자수입', amount: 120000000, percent: 6 },
    { name: '기타수입', amount: 180000000, percent: 9 },
  ],
  outflow: [
    { name: '매입지급', amount: 950000000, percent: 48 },
    { name: '급여/복리후생', amount: 420000000, percent: 21 },
    { name: '운영비', amount: 280000000, percent: 14 },
    { name: '설비투자', amount: 230000000, percent: 12 },
    { name: '세금/공과금', amount: 100000000, percent: 5 },
  ],
};

export default function CashFlowPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01');
  const [viewType, setViewType] = useState<'all' | 'inflow' | 'outflow'>('all');

  const filteredFlows = mockCashFlows.filter(flow =>
    viewType === 'all' || flow.type === viewType
  );

  const currentBalance = 2850000000;
  const monthlyInflow = 1850000000;
  const monthlyOutflow = 1960000000;
  const netCashFlow = monthlyInflow - monthlyOutflow;

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`;
    } else if (Math.abs(value) >= 10000000) {
      return `${(value / 10000000).toFixed(1)}천만`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">자금수지 관리</h1>
          <p className="text-slate-400">현금 흐름 현황 및 예측</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="2024-01">2024년 1월</option>
            <option value="2023-12">2023년 12월</option>
            <option value="2023-11">2023년 11월</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">현재 잔액</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(currentBalance)}</p>
            </div>
            <Wallet className="w-10 h-10 text-blue-300 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">월 수입</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(monthlyInflow)}</p>
            </div>
            <ArrowUpRight className="w-10 h-10 text-green-300 opacity-80" />
          </div>
          <div className="mt-2 flex items-center gap-1 text-green-200 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>전월 대비 +5.2%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">월 지출</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(monthlyOutflow)}</p>
            </div>
            <ArrowDownRight className="w-10 h-10 text-red-300 opacity-80" />
          </div>
          <div className="mt-2 flex items-center gap-1 text-red-200 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>전월 대비 +8.5%</span>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${netCashFlow >= 0 ? 'from-cyan-600 to-cyan-700' : 'from-orange-600 to-orange-700'} rounded-xl p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm">순 현금흐름</p>
              <p className="text-2xl font-bold text-white mt-1">
                {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-cyan-300 opacity-80" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">월별 현금흐름 추이</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v}백만`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: number) => [`${value}백만원`, '']}
              />
              <Area type="monotone" dataKey="inflow" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="수입" />
              <Area type="monotone" dataKey="outflow" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="지출" />
              <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} name="잔액" dot={{ fill: '#3b82f6' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">수입/지출 내역</h3>
          <div className="grid grid-cols-2 gap-6">
            {/* Inflow */}
            <div>
              <p className="text-green-400 font-medium mb-3 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" /> 수입
              </p>
              <div className="space-y-2">
                {categoryBreakdown.inflow.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="text-white">{item.percent}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Outflow */}
            <div>
              <p className="text-red-400 font-medium mb-3 flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4" /> 지출
              </p>
              <div className="space-y-2">
                {categoryBreakdown.outflow.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="text-white">{item.percent}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          { value: 'all', label: '전체' },
          { value: 'inflow', label: '수입' },
          { value: 'outflow', label: '지출' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setViewType(tab.value as any)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewType === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">일자</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">구분</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">분류</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">내용</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">금액</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">잔액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredFlows.map((flow) => (
                <tr key={flow.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 text-slate-300">{flow.date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                      flow.type === 'inflow'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {flow.type === 'inflow' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {flow.type === 'inflow' ? '수입' : '지출'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{flow.category}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white">{flow.description}</p>
                      {flow.reference && (
                        <p className="text-slate-400 text-xs">{flow.reference}</p>
                      )}
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    flow.type === 'inflow' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {flow.type === 'inflow' ? '+' : '-'}{flow.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium">
                    {flow.balance.toLocaleString()}
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
