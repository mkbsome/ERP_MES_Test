import { useState } from 'react';
import { Search, RefreshCw, Plus, Calendar, ChevronLeft, ChevronRight, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MPSItem {
  productCode: string;
  productName: string;
  spec: string;
  unit: string;
  safetyStock: number;
  beginningStock: number;
  weeks: {
    week: string;
    forecast: number;
    salesOrder: number;
    demand: number;
    mpsQty: number;
    endingStock: number;
    availableToPromise: number;
  }[];
}

// 샘플 MPS 데이터
const mockMPSData: MPSItem[] = [
  {
    productCode: 'FG-SMB-001',
    productName: '스마트폰 메인보드 A1',
    spec: '150×70mm, 8-Layer',
    unit: 'EA',
    safetyStock: 2000,
    beginningStock: 5800,
    weeks: [
      { week: 'W05', forecast: 3000, salesOrder: 2800, demand: 3000, mpsQty: 3000, endingStock: 5800, availableToPromise: 3000 },
      { week: 'W06', forecast: 3500, salesOrder: 2500, demand: 3500, mpsQty: 4000, endingStock: 6300, availableToPromise: 1500 },
      { week: 'W07', forecast: 4000, salesOrder: 1800, demand: 4000, mpsQty: 4000, endingStock: 6300, availableToPromise: 2200 },
      { week: 'W08', forecast: 3500, salesOrder: 1200, demand: 3500, mpsQty: 3500, endingStock: 6300, availableToPromise: 2300 },
      { week: 'W09', forecast: 3000, salesOrder: 500, demand: 3000, mpsQty: 3000, endingStock: 6300, availableToPromise: 2500 },
      { week: 'W10', forecast: 3000, salesOrder: 0, demand: 3000, mpsQty: 3000, endingStock: 6300, availableToPromise: 3000 },
    ]
  },
  {
    productCode: 'FG-PWR-001',
    productName: '전원보드 P1',
    spec: '80×60mm, 4-Layer',
    unit: 'EA',
    safetyStock: 3000,
    beginningStock: 12500,
    weeks: [
      { week: 'W05', forecast: 5000, salesOrder: 4500, demand: 5000, mpsQty: 5000, endingStock: 12500, availableToPromise: 500 },
      { week: 'W06', forecast: 6000, salesOrder: 4000, demand: 6000, mpsQty: 6000, endingStock: 12500, availableToPromise: 2000 },
      { week: 'W07', forecast: 5500, salesOrder: 3000, demand: 5500, mpsQty: 5500, endingStock: 12500, availableToPromise: 2500 },
      { week: 'W08', forecast: 5000, salesOrder: 2000, demand: 5000, mpsQty: 5000, endingStock: 12500, availableToPromise: 3000 },
      { week: 'W09', forecast: 4500, salesOrder: 1000, demand: 4500, mpsQty: 4500, endingStock: 12500, availableToPromise: 3500 },
      { week: 'W10', forecast: 4500, salesOrder: 0, demand: 4500, mpsQty: 4500, endingStock: 12500, availableToPromise: 4500 },
    ]
  },
  {
    productCode: 'FG-LED-001',
    productName: 'LED 드라이버 L1',
    spec: '50×30mm, 2-Layer',
    unit: 'EA',
    safetyStock: 1500,
    beginningStock: 0,
    weeks: [
      { week: 'W05', forecast: 2000, salesOrder: 1500, demand: 2000, mpsQty: 3500, endingStock: 1500, availableToPromise: 2000 },
      { week: 'W06', forecast: 2500, salesOrder: 1000, demand: 2500, mpsQty: 2500, endingStock: 1500, availableToPromise: 1500 },
      { week: 'W07', forecast: 2000, salesOrder: 800, demand: 2000, mpsQty: 2000, endingStock: 1500, availableToPromise: 1200 },
      { week: 'W08', forecast: 2000, salesOrder: 500, demand: 2000, mpsQty: 2000, endingStock: 1500, availableToPromise: 1500 },
      { week: 'W09', forecast: 1500, salesOrder: 0, demand: 1500, mpsQty: 1500, endingStock: 1500, availableToPromise: 1500 },
      { week: 'W10', forecast: 1500, salesOrder: 0, demand: 1500, mpsQty: 1500, endingStock: 1500, availableToPromise: 1500 },
    ]
  },
  {
    productCode: 'FG-ECU-001',
    productName: '차량 ECU A',
    spec: '120×100mm, 6-Layer',
    unit: 'EA',
    safetyStock: 500,
    beginningStock: 800,
    weeks: [
      { week: 'W05', forecast: 500, salesOrder: 400, demand: 500, mpsQty: 500, endingStock: 800, availableToPromise: 100 },
      { week: 'W06', forecast: 600, salesOrder: 350, demand: 600, mpsQty: 600, endingStock: 800, availableToPromise: 250 },
      { week: 'W07', forecast: 700, salesOrder: 300, demand: 700, mpsQty: 700, endingStock: 800, availableToPromise: 400 },
      { week: 'W08', forecast: 600, salesOrder: 200, demand: 600, mpsQty: 600, endingStock: 800, availableToPromise: 400 },
      { week: 'W09', forecast: 500, salesOrder: 100, demand: 500, mpsQty: 500, endingStock: 800, availableToPromise: 400 },
      { week: 'W10', forecast: 500, salesOrder: 0, demand: 500, mpsQty: 500, endingStock: 800, availableToPromise: 500 },
    ]
  },
];

export default function MPSPage() {
  const [mpsData] = useState<MPSItem[]>(mockMPSData);
  const [selectedProduct, setSelectedProduct] = useState<MPSItem | null>(mockMPSData[0]);
  const [currentMonth, setCurrentMonth] = useState('2024년 2월');

  // 차트 데이터
  const chartData = selectedProduct?.weeks.map(w => ({
    name: w.week,
    수요예측: w.forecast,
    확정주문: w.salesOrder,
    MPS수량: w.mpsQty,
  })) || [];

  // 통계
  const stats = {
    totalMPS: mpsData.reduce((sum, item) => sum + item.weeks.reduce((s, w) => s + w.mpsQty, 0), 0),
    totalDemand: mpsData.reduce((sum, item) => sum + item.weeks.reduce((s, w) => s + w.demand, 0), 0),
    lowStockItems: mpsData.filter(item => item.beginningStock < item.safetyStock).length,
    totalProducts: mpsData.length,
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">MPS (주생산계획)</h1>
          <p className="text-slate-400 text-sm mt-1">제품별 주간 생산계획을 수립하고 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
            <RefreshCw size={18} />
            계획 갱신
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
            <Plus size={18} />
            계획 등록
          </button>
        </div>
      </div>

      {/* 기간 선택 */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Calendar className="text-blue-400" size={20} />
            <span className="text-white font-medium">계획 기간</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded">
              <ChevronLeft size={20} />
            </button>
            <span className="text-white font-medium px-4">{currentMonth} (W05 ~ W10)</span>
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm bg-slate-700 text-white rounded hover:bg-slate-600">주간</button>
            <button className="px-3 py-1 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded">월간</button>
          </div>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <Package className="text-blue-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">계획 제품</p>
              <p className="text-2xl font-bold text-white">{stats.totalProducts}개</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-cyan-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">총 MPS 수량</p>
              <p className="text-2xl font-bold text-cyan-400">{(stats.totalMPS / 1000).toFixed(1)}K</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-green-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">총 수요</p>
              <p className="text-2xl font-bold text-green-400">{(stats.totalDemand / 1000).toFixed(1)}K</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">재고 부족</p>
              <p className="text-2xl font-bold text-red-400">{stats.lowStockItems}건</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* 제품 목록 */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">제품 목록</h3>
          </div>
          <div className="divide-y divide-slate-700">
            {mpsData.map((item) => (
              <div
                key={item.productCode}
                onClick={() => setSelectedProduct(item)}
                className={`p-4 cursor-pointer hover:bg-slate-700/50 ${
                  selectedProduct?.productCode === item.productCode ? 'bg-blue-900/20 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-blue-400 font-mono text-sm">{item.productCode}</span>
                  {item.beginningStock < item.safetyStock && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">재고부족</span>
                  )}
                </div>
                <h4 className="text-white font-medium">{item.productName}</h4>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-slate-400">기초재고: <span className="text-white">{item.beginningStock.toLocaleString()}</span></span>
                  <span className="text-slate-400">안전재고: <span className="text-yellow-400">{item.safetyStock.toLocaleString()}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MPS 상세 */}
        <div className="col-span-2 space-y-4">
          {selectedProduct ? (
            <>
              {/* 차트 */}
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {selectedProduct.productName} - 주간 계획
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey="수요예측" fill="#94a3b8" />
                      <Bar dataKey="확정주문" fill="#3b82f6" />
                      <Bar dataKey="MPS수량" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* MPS 테이블 */}
              <div className="bg-slate-800 rounded-lg border border-slate-700">
                <div className="p-4 border-b border-slate-700">
                  <h3 className="text-lg font-semibold text-white">주간 상세 계획</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400">
                        <th className="p-3 text-left">항목</th>
                        {selectedProduct.weeks.map(w => (
                          <th key={w.week} className="p-3 text-right">{w.week}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-700/50">
                        <td className="p-3 text-slate-400">수요예측</td>
                        {selectedProduct.weeks.map(w => (
                          <td key={w.week} className="p-3 text-right text-slate-300">{w.forecast.toLocaleString()}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="p-3 text-slate-400">확정주문</td>
                        {selectedProduct.weeks.map(w => (
                          <td key={w.week} className="p-3 text-right text-blue-400">{w.salesOrder.toLocaleString()}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-700/50 bg-slate-900/50">
                        <td className="p-3 text-white font-medium">총 수요</td>
                        {selectedProduct.weeks.map(w => (
                          <td key={w.week} className="p-3 text-right text-white font-medium">{w.demand.toLocaleString()}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-700/50 bg-green-900/20">
                        <td className="p-3 text-green-400 font-medium">MPS 수량</td>
                        {selectedProduct.weeks.map(w => (
                          <td key={w.week} className="p-3 text-right text-green-400 font-medium">{w.mpsQty.toLocaleString()}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="p-3 text-slate-400">기말재고</td>
                        {selectedProduct.weeks.map(w => (
                          <td key={w.week} className={`p-3 text-right ${w.endingStock < selectedProduct.safetyStock ? 'text-red-400' : 'text-white'}`}>
                            {w.endingStock.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-400">ATP (가용량)</td>
                        {selectedProduct.weeks.map(w => (
                          <td key={w.week} className="p-3 text-right text-cyan-400">{w.availableToPromise.toLocaleString()}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 flex flex-col items-center justify-center text-slate-400">
              <Package size={48} className="mb-4 opacity-50" />
              <p>좌측에서 제품을 선택하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
