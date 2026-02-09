import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit2, Filter, BarChart3, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ProductionPlan {
  id: string;
  planType: 'yearly' | 'monthly' | 'weekly' | 'daily';
  year: number;
  month?: number;
  week?: number;
  day?: number;
  productCode: string;
  productName: string;
  planQty: number;
  actualQty: number;
  lineName: string;
  status: 'draft' | 'confirmed' | 'in_progress' | 'completed';
}

const generateMockPlans = (): ProductionPlan[] => {
  const products = [
    { code: 'FG-MB-001', name: '스마트폰 메인보드 A' },
    { code: 'FG-MB-002', name: '스마트폰 메인보드 B' },
    { code: 'FG-PB-001', name: '전원보드 A' },
    { code: 'FG-LED-001', name: 'LED 드라이버' },
    { code: 'FG-ECU-001', name: '자동차 ECU' },
  ];
  const lines = ['SMT-L01', 'SMT-L02', 'SMT-L03', 'ASM-L01'];

  const plans: ProductionPlan[] = [];
  let id = 1;

  // Monthly plans for current year
  for (let month = 1; month <= 12; month++) {
    products.forEach((product, idx) => {
      const planQty = Math.floor(Math.random() * 5000) + 3000;
      const actualQty = month <= new Date().getMonth() + 1 ? Math.floor(planQty * (0.85 + Math.random() * 0.2)) : 0;
      plans.push({
        id: String(id++),
        planType: 'monthly',
        year: 2024,
        month,
        productCode: product.code,
        productName: product.name,
        planQty,
        actualQty,
        lineName: lines[idx % lines.length],
        status: month < new Date().getMonth() + 1 ? 'completed' : month === new Date().getMonth() + 1 ? 'in_progress' : 'confirmed',
      });
    });
  }

  return plans;
};

const mockPlans = generateMockPlans();

export default function ProductionPlanPage() {
  const [viewType, setViewType] = useState<'yearly' | 'monthly' | 'weekly' | 'daily'>('monthly');
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [filterProduct, setFilterProduct] = useState<string>('all');

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthPlans = mockPlans.filter(p => p.month === month);
    return {
      month: `${month}월`,
      계획: monthPlans.reduce((acc, p) => acc + p.planQty, 0),
      실적: monthPlans.reduce((acc, p) => acc + p.actualQty, 0),
    };
  });

  const filteredPlans = mockPlans.filter(plan => {
    if (filterProduct !== 'all' && plan.productCode !== filterProduct) return false;
    if (viewType === 'monthly' && plan.month !== selectedMonth) return false;
    return true;
  });

  const getStatusColor = (status: ProductionPlan['status']) => {
    switch (status) {
      case 'draft': return 'bg-slate-500/20 text-slate-400';
      case 'confirmed': return 'bg-blue-500/20 text-blue-400';
      case 'in_progress': return 'bg-purple-500/20 text-purple-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
    }
  };

  const getStatusText = (status: ProductionPlan['status']) => {
    switch (status) {
      case 'draft': return '초안';
      case 'confirmed': return '확정';
      case 'in_progress': return '진행중';
      case 'completed': return '완료';
    }
  };

  const products = Array.from(new Set(mockPlans.map(p => p.productCode))).map(code => ({
    code,
    name: mockPlans.find(p => p.productCode === code)?.productName || '',
  }));

  const totalPlan = filteredPlans.reduce((acc, p) => acc + p.planQty, 0);
  const totalActual = filteredPlans.reduce((acc, p) => acc + p.actualQty, 0);
  const achievement = totalPlan > 0 ? ((totalActual / totalPlan) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">생산계획</h1>
          <p className="text-slate-400 text-sm mt-1">연간/월간/주간/일일 생산계획 관리</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          계획 등록
        </button>
      </div>

      {/* 뷰 타입 선택 및 필터 */}
      <div className="flex items-center justify-between bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-700 rounded-lg p-1">
            {['yearly', 'monthly', 'weekly', 'daily'].map((type) => (
              <button
                key={type}
                onClick={() => setViewType(type as typeof viewType)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewType === type ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {type === 'yearly' ? '연간' : type === 'monthly' ? '월간' : type === 'weekly' ? '주간' : '일일'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedYear(selectedYear - 1)} className="p-1 hover:bg-slate-700 rounded">
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <span className="text-white font-medium w-16 text-center">{selectedYear}년</span>
            <button onClick={() => setSelectedYear(selectedYear + 1)} className="p-1 hover:bg-slate-700 rounded">
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {viewType !== 'yearly' && (
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedMonth(Math.max(1, selectedMonth - 1))} className="p-1 hover:bg-slate-700 rounded">
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </button>
              <span className="text-white font-medium w-12 text-center">{selectedMonth}월</span>
              <button onClick={() => setSelectedMonth(Math.min(12, selectedMonth + 1))} className="p-1 hover:bg-slate-700 rounded">
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          )}

          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="all">전체 제품</option>
            {products.map(p => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">계획 수량</p>
              <p className="text-2xl font-bold text-white mt-1">{totalPlan.toLocaleString()}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">실적 수량</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{totalActual.toLocaleString()}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">달성률</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{achievement}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">제품 수</p>
              <p className="text-2xl font-bold text-orange-400 mt-1">{products.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 차트 */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-white font-bold mb-4">월별 생산계획 vs 실적</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Legend />
                <Bar dataKey="계획" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="실적" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 상세 목록 */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-white font-bold">{selectedMonth}월 생산계획 상세</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50 sticky top-0">
                <tr>
                  <th className="text-left text-slate-400 font-medium px-4 py-2 text-sm">제품</th>
                  <th className="text-right text-slate-400 font-medium px-4 py-2 text-sm">계획</th>
                  <th className="text-right text-slate-400 font-medium px-4 py-2 text-sm">실적</th>
                  <th className="text-right text-slate-400 font-medium px-4 py-2 text-sm">달성률</th>
                  <th className="text-center text-slate-400 font-medium px-4 py-2 text-sm">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredPlans.slice(0, 10).map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-2">
                      <p className="text-white text-sm">{plan.productName}</p>
                      <p className="text-slate-500 text-xs">{plan.lineName}</p>
                    </td>
                    <td className="px-4 py-2 text-right text-white text-sm">{plan.planQty.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-green-400 text-sm">{plan.actualQty.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-slate-300 text-sm">
                      {plan.planQty > 0 ? ((plan.actualQty / plan.planQty) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(plan.status)}`}>
                        {getStatusText(plan.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
