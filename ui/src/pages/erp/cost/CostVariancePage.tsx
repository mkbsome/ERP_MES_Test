import { useState } from 'react';
import {
  GitCompare,
  Search,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Filter,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface VarianceDetail {
  category: string;
  standardAmount: number;
  actualAmount: number;
  variance: number;
  varianceRate: number;
  cause: string;
}

interface CostVariance {
  productCode: string;
  productName: string;
  period: string;
  quantity: number;
  standardTotal: number;
  actualTotal: number;
  totalVariance: number;
  varianceRate: number;
  status: 'FAVORABLE' | 'UNFAVORABLE' | 'CRITICAL' | 'NORMAL';
  details: VarianceDetail[];
}

const mockVariances: CostVariance[] = [
  {
    productCode: 'FG-SMB-001',
    productName: '스마트폰 메인보드 A1',
    period: '2024년 2월',
    quantity: 1500,
    standardTotal: 67500000,
    actualTotal: 69750000,
    totalVariance: 2250000,
    varianceRate: 3.3,
    status: 'UNFAVORABLE',
    details: [
      { category: '재료비', standardAmount: 48000000, actualAmount: 50250000, variance: 2250000, varianceRate: 4.7, cause: 'IC 부품 가격 상승' },
      { category: '노무비', standardAmount: 12000000, actualAmount: 12300000, variance: 300000, varianceRate: 2.5, cause: '잔업 증가' },
      { category: '경비', standardAmount: 7500000, actualAmount: 7200000, variance: -300000, varianceRate: -4.0, cause: '전력비 절감' },
    ],
  },
  {
    productCode: 'FG-PWR-001',
    productName: '전원보드 P1',
    period: '2024년 2월',
    quantity: 800,
    standardTotal: 22400000,
    actualTotal: 21760000,
    totalVariance: -640000,
    varianceRate: -2.9,
    status: 'FAVORABLE',
    details: [
      { category: '재료비', standardAmount: 14800000, actualAmount: 14240000, variance: -560000, varianceRate: -3.8, cause: '대량구매 할인' },
      { category: '노무비', standardAmount: 4800000, actualAmount: 4960000, variance: 160000, varianceRate: 3.3, cause: '신규인력 교육' },
      { category: '경비', standardAmount: 2800000, actualAmount: 2560000, variance: -240000, varianceRate: -8.6, cause: '설비효율 향상' },
    ],
  },
  {
    productCode: 'FG-ECU-001',
    productName: '차량 ECU A',
    period: '2024년 2월',
    quantity: 300,
    standardTotal: 25500000,
    actualTotal: 27090000,
    totalVariance: 1590000,
    varianceRate: 6.2,
    status: 'CRITICAL',
    details: [
      { category: '재료비', standardAmount: 18600000, actualAmount: 19500000, variance: 900000, varianceRate: 4.8, cause: '차량용 MCU 단가 상승' },
      { category: '노무비', standardAmount: 4500000, actualAmount: 4950000, variance: 450000, varianceRate: 10.0, cause: '품질검사 강화' },
      { category: '경비', standardAmount: 2400000, actualAmount: 2640000, variance: 240000, varianceRate: 10.0, cause: '테스트 장비 추가' },
    ],
  },
  {
    productCode: 'FG-LED-001',
    productName: 'LED 드라이버 L1',
    period: '2024년 2월',
    quantity: 2000,
    standardTotal: 30000000,
    actualTotal: 29900000,
    totalVariance: -100000,
    varianceRate: -0.3,
    status: 'NORMAL',
    details: [
      { category: '재료비', standardAmount: 19000000, actualAmount: 18400000, variance: -600000, varianceRate: -3.2, cause: 'LED칩 가격 하락' },
      { category: '노무비', standardAmount: 7000000, actualAmount: 7600000, variance: 600000, varianceRate: 8.6, cause: '검사시간 증가' },
      { category: '경비', standardAmount: 4000000, actualAmount: 3900000, variance: -100000, varianceRate: -2.5, cause: '- ' },
    ],
  },
  {
    productCode: 'FG-IOT-001',
    productName: 'IoT 모듈 M1',
    period: '2024년 2월',
    quantity: 1200,
    standardTotal: 26400000,
    actualTotal: 26160000,
    totalVariance: -240000,
    varianceRate: -0.9,
    status: 'FAVORABLE',
    details: [
      { category: '재료비', standardAmount: 17400000, actualAmount: 17040000, variance: -360000, varianceRate: -2.1, cause: '대량구매' },
      { category: '노무비', standardAmount: 6000000, actualAmount: 6240000, variance: 240000, varianceRate: 4.0, cause: '품질검사' },
      { category: '경비', standardAmount: 3000000, actualAmount: 2880000, variance: -120000, varianceRate: -4.0, cause: '공정개선' },
    ],
  },
];

const chartData = mockVariances.map(v => ({
  name: v.productCode.replace('FG-', ''),
  variance: v.varianceRate,
  color: v.varianceRate > 5 ? '#ef4444' : v.varianceRate > 0 ? '#f97316' : v.varianceRate > -3 ? '#22c55e' : '#10b981',
}));

const statusConfig = {
  FAVORABLE: { label: '유리', color: 'bg-green-500', icon: TrendingDown },
  UNFAVORABLE: { label: '불리', color: 'bg-orange-500', icon: TrendingUp },
  CRITICAL: { label: '경고', color: 'bg-red-500', icon: AlertTriangle },
  NORMAL: { label: '정상', color: 'bg-slate-500', icon: CheckCircle },
};

export default function CostVariancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<CostVariance | null>(mockVariances[0]);

  const filteredVariances = mockVariances.filter(v => {
    const matchesSearch = v.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const summary = {
    totalStandard: mockVariances.reduce((sum, v) => sum + v.standardTotal, 0),
    totalActual: mockVariances.reduce((sum, v) => sum + v.actualTotal, 0),
    favorable: mockVariances.filter(v => v.status === 'FAVORABLE').length,
    unfavorable: mockVariances.filter(v => v.status === 'UNFAVORABLE').length,
    critical: mockVariances.filter(v => v.status === 'CRITICAL').length,
  };

  const totalVariance = summary.totalActual - summary.totalStandard;
  const totalVarianceRate = ((totalVariance / summary.totalStandard) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <GitCompare className="h-8 w-8 text-cyan-400" />
            원가차이분석
          </h1>
          <p className="text-slate-400 mt-1">표준원가 대비 실제원가 차이를 분석하고 원인을 파악합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <RefreshCw className="h-4 w-4" />
            분석 갱신
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors">
            <Download className="h-4 w-4" />
            보고서 출력
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">전체 차이율</p>
          <p className={`text-2xl font-bold ${Number(totalVarianceRate) > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {Number(totalVarianceRate) > 0 ? '+' : ''}{totalVarianceRate}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            ₩{(totalVariance / 1000000).toFixed(1)}M
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">분석 제품</p>
          <p className="text-2xl font-bold text-white">{mockVariances.length}개</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">유리한 차이</p>
          <p className="text-2xl font-bold text-green-400">{summary.favorable}건</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">불리한 차이</p>
          <p className="text-2xl font-bold text-orange-400">{summary.unfavorable}건</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">경고 (5% 초과)</p>
          <p className="text-2xl font-bold text-red-400">{summary.critical}건</p>
        </div>
      </div>

      {/* Variance Chart */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">제품별 원가차이율</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" stroke="#9ca3af" tickFormatter={(v) => `${v}%`} domain={[-5, 10]} />
            <YAxis type="category" dataKey="name" stroke="#9ca3af" width={80} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, '차이율']}
            />
            <ReferenceLine x={0} stroke="#6b7280" />
            <ReferenceLine x={5} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '경고선', fill: '#ef4444', position: 'top' }} />
            <Bar dataKey="variance" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Variance List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 text-sm"
              >
                <option value="ALL">전체</option>
                <option value="FAVORABLE">유리</option>
                <option value="UNFAVORABLE">불리</option>
                <option value="CRITICAL">경고</option>
              </select>
            </div>
          </div>
          <div className="divide-y divide-slate-700 max-h-[400px] overflow-y-auto">
            {filteredVariances.map((variance) => {
              const StatusIcon = statusConfig[variance.status].icon;
              return (
                <div
                  key={variance.productCode}
                  className={`p-4 cursor-pointer hover:bg-slate-700/50 ${
                    selectedProduct?.productCode === variance.productCode ? 'bg-slate-700/50 border-l-2 border-cyan-400' : ''
                  }`}
                  onClick={() => setSelectedProduct(variance)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{variance.productName}</p>
                      <p className="text-xs text-slate-400">{variance.productCode}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        variance.varianceRate > 5 ? 'text-red-400' :
                        variance.varianceRate > 0 ? 'text-orange-400' :
                        'text-green-400'
                      }`}>
                        {variance.varianceRate > 0 ? '+' : ''}{variance.varianceRate}%
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${statusConfig[variance.status].color} text-white`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[variance.status].label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Variance Detail */}
        {selectedProduct && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedProduct.productName}</h3>
                <p className="text-sm text-slate-400">{selectedProduct.period} 기준</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">생산수량</p>
                <p className="text-white font-medium">{selectedProduct.quantity.toLocaleString()} EA</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400">표준원가</p>
                <p className="text-lg font-semibold text-blue-400">₩{(selectedProduct.standardTotal / 1000000).toFixed(1)}M</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400">실제원가</p>
                <p className="text-lg font-semibold text-emerald-400">₩{(selectedProduct.actualTotal / 1000000).toFixed(1)}M</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400">총 차이</p>
                <p className={`text-lg font-semibold ${selectedProduct.totalVariance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {selectedProduct.totalVariance > 0 ? '+' : ''}₩{(selectedProduct.totalVariance / 1000000).toFixed(2)}M
                </p>
              </div>
            </div>

            <h4 className="text-sm font-medium text-slate-300 mb-3">원가요소별 차이분석</h4>
            <div className="space-y-3">
              {selectedProduct.details.map((detail, idx) => (
                <div key={idx} className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{detail.category}</span>
                    <span className={`font-semibold ${
                      detail.varianceRate > 0 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {detail.varianceRate > 0 ? '+' : ''}{detail.varianceRate}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                    <div>
                      <p className="text-slate-500">표준</p>
                      <p className="text-slate-300">₩{(detail.standardAmount / 1000000).toFixed(1)}M</p>
                    </div>
                    <div>
                      <p className="text-slate-500">실제</p>
                      <p className="text-slate-300">₩{(detail.actualAmount / 1000000).toFixed(1)}M</p>
                    </div>
                    <div>
                      <p className="text-slate-500">차이</p>
                      <p className={detail.variance > 0 ? 'text-red-400' : 'text-green-400'}>
                        {detail.variance > 0 ? '+' : ''}₩{(detail.variance / 1000000).toFixed(2)}M
                      </p>
                    </div>
                  </div>
                  {detail.cause !== '- ' && (
                    <p className="text-xs text-amber-400 bg-amber-500/10 rounded px-2 py-1">
                      원인: {detail.cause}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
