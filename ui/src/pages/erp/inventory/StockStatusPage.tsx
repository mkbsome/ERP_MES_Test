import { useState } from 'react';
import { Search, RefreshCw, Download, AlertTriangle, Package, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface StockItem {
  itemCode: string;
  itemName: string;
  itemType: 'RAW' | 'WIP' | 'FINISHED';
  category: string;
  spec: string;
  unit: string;
  warehouse: string;
  location: string;
  currentQty: number;
  availableQty: number;
  reservedQty: number;
  safetyStock: number;
  maxStock: number;
  unitCost: number;
  stockValue: number;
  lastInDate: string;
  lastOutDate: string;
  turnoverRate: number;
  status: 'NORMAL' | 'LOW' | 'OVER' | 'ZERO';
}

// 샘플 재고 데이터
const mockStockItems: StockItem[] = [
  { itemCode: 'RM-PCB-001', itemName: 'PCB 기판 (4층)', itemType: 'RAW', category: 'PCB', spec: '100×80mm, FR-4', unit: 'EA', warehouse: '원자재창고', location: 'A-01-01', currentQty: 12500, availableQty: 10000, reservedQty: 2500, safetyStock: 5000, maxStock: 20000, unitCost: 1500, stockValue: 18750000, lastInDate: '2024-01-20', lastOutDate: '2024-01-22', turnoverRate: 8.5, status: 'NORMAL' },
  { itemCode: 'RM-IC-001', itemName: 'MCU IC (ARM Cortex)', itemType: 'RAW', category: 'IC', spec: 'STM32F4, LQFP64', unit: 'EA', warehouse: '원자재창고', location: 'A-02-03', currentQty: 3200, availableQty: 2800, reservedQty: 400, safetyStock: 2000, maxStock: 10000, unitCost: 5500, stockValue: 17600000, lastInDate: '2024-01-18', lastOutDate: '2024-01-21', turnoverRate: 12.3, status: 'NORMAL' },
  { itemCode: 'RM-CAP-001', itemName: '적층세라믹콘덴서', itemType: 'RAW', category: '수동소자', spec: '0603, 100nF', unit: 'EA', warehouse: '원자재창고', location: 'A-03-02', currentQty: 45000, availableQty: 42000, reservedQty: 3000, safetyStock: 30000, maxStock: 100000, unitCost: 15, stockValue: 675000, lastInDate: '2024-01-15', lastOutDate: '2024-01-22', turnoverRate: 15.2, status: 'NORMAL' },
  { itemCode: 'RM-RES-001', itemName: '칩저항', itemType: 'RAW', category: '수동소자', spec: '0402, 10KΩ', unit: 'EA', warehouse: '원자재창고', location: 'A-03-05', currentQty: 28000, availableQty: 25000, reservedQty: 3000, safetyStock: 50000, maxStock: 150000, unitCost: 5, stockValue: 140000, lastInDate: '2024-01-10', lastOutDate: '2024-01-22', turnoverRate: 18.5, status: 'LOW' },
  { itemCode: 'RM-CON-001', itemName: 'USB-C 커넥터', itemType: 'RAW', category: '커넥터', spec: 'Type-C, 24Pin', unit: 'EA', warehouse: '원자재창고', location: 'A-04-01', currentQty: 8500, availableQty: 7500, reservedQty: 1000, safetyStock: 3000, maxStock: 15000, unitCost: 850, stockValue: 7225000, lastInDate: '2024-01-19', lastOutDate: '2024-01-21', turnoverRate: 10.8, status: 'NORMAL' },
  { itemCode: 'RM-SOL-001', itemName: '솔더페이스트', itemType: 'RAW', category: '부자재', spec: 'Sn63/Pb37', unit: 'KG', warehouse: '원자재창고', location: 'B-01-01', currentQty: 15, availableQty: 12, reservedQty: 3, safetyStock: 20, maxStock: 50, unitCost: 85000, stockValue: 1275000, lastInDate: '2024-01-12', lastOutDate: '2024-01-22', turnoverRate: 24.0, status: 'LOW' },
  { itemCode: 'WIP-SMT-001', itemName: 'SMT 실장 완료 PCB', itemType: 'WIP', category: '재공품', spec: '스마트폰 메인보드', unit: 'EA', warehouse: '공정창고', location: 'C-01-01', currentQty: 2500, availableQty: 2000, reservedQty: 500, safetyStock: 1000, maxStock: 5000, unitCost: 8500, stockValue: 21250000, lastInDate: '2024-01-22', lastOutDate: '2024-01-22', turnoverRate: 35.0, status: 'NORMAL' },
  { itemCode: 'FG-SMB-001', itemName: '스마트폰 메인보드 A1', itemType: 'FINISHED', category: '완제품', spec: '150×70mm, 8-Layer', unit: 'EA', warehouse: '완제품창고', location: 'D-01-01', currentQty: 5800, availableQty: 3000, reservedQty: 2800, safetyStock: 2000, maxStock: 10000, unitCost: 15000, stockValue: 87000000, lastInDate: '2024-01-22', lastOutDate: '2024-01-22', turnoverRate: 12.5, status: 'NORMAL' },
  { itemCode: 'FG-PWR-001', itemName: '전원보드 P1', itemType: 'FINISHED', category: '완제품', spec: '80×60mm, 4-Layer', unit: 'EA', warehouse: '완제품창고', location: 'D-02-01', currentQty: 12500, availableQty: 8500, reservedQty: 4000, safetyStock: 3000, maxStock: 15000, unitCost: 5000, stockValue: 62500000, lastInDate: '2024-01-21', lastOutDate: '2024-01-22', turnoverRate: 14.2, status: 'OVER' },
  { itemCode: 'FG-LED-001', itemName: 'LED 드라이버 L1', itemType: 'FINISHED', category: '완제품', spec: '50×30mm, 2-Layer', unit: 'EA', warehouse: '완제품창고', location: 'D-03-01', currentQty: 0, availableQty: 0, reservedQty: 0, safetyStock: 1500, maxStock: 8000, unitCost: 3000, stockValue: 0, lastInDate: '2024-01-15', lastOutDate: '2024-01-20', turnoverRate: 0, status: 'ZERO' },
];

const COLORS = ['#3b82f6', '#f59e0b', '#10b981'];

export default function StockStatusPage() {
  const [stockItems] = useState<StockItem[]>(mockStockItems);
  const [filters, setFilters] = useState({
    itemType: '',
    warehouse: '',
    status: '',
    searchTerm: '',
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'NORMAL': return 'bg-green-500/20 text-green-400';
      case 'LOW': return 'bg-yellow-500/20 text-yellow-400';
      case 'OVER': return 'bg-blue-500/20 text-blue-400';
      case 'ZERO': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NORMAL': return '정상';
      case 'LOW': return '부족';
      case 'OVER': return '과잉';
      case 'ZERO': return '재고없음';
      default: return status;
    }
  };

  const getItemTypeStyle = (type: string) => {
    switch (type) {
      case 'RAW': return 'bg-blue-500/20 text-blue-400';
      case 'WIP': return 'bg-yellow-500/20 text-yellow-400';
      case 'FINISHED': return 'bg-green-500/20 text-green-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const filteredItems = stockItems.filter(item => {
    if (filters.itemType && item.itemType !== filters.itemType) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.searchTerm && !item.itemName.includes(filters.searchTerm) && !item.itemCode.includes(filters.searchTerm)) return false;
    return true;
  });

  // 통계
  const stats = {
    totalValue: stockItems.reduce((sum, i) => sum + i.stockValue, 0),
    rawValue: stockItems.filter(i => i.itemType === 'RAW').reduce((sum, i) => sum + i.stockValue, 0),
    wipValue: stockItems.filter(i => i.itemType === 'WIP').reduce((sum, i) => sum + i.stockValue, 0),
    finishedValue: stockItems.filter(i => i.itemType === 'FINISHED').reduce((sum, i) => sum + i.stockValue, 0),
    lowStockCount: stockItems.filter(i => i.status === 'LOW' || i.status === 'ZERO').length,
  };

  // 차트 데이터
  const stockByTypeData = [
    { name: '원자재', value: stats.rawValue, qty: stockItems.filter(i => i.itemType === 'RAW').length },
    { name: '재공품', value: stats.wipValue, qty: stockItems.filter(i => i.itemType === 'WIP').length },
    { name: '완제품', value: stats.finishedValue, qty: stockItems.filter(i => i.itemType === 'FINISHED').length },
  ];

  const stockLevelData = stockItems.slice(0, 6).map(item => ({
    name: item.itemCode.replace(/^(RM|WIP|FG)-/, ''),
    현재고: item.currentQty,
    안전재고: item.safetyStock,
  }));

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">재고현황</h1>
          <p className="text-slate-400 text-sm mt-1">원자재, 재공품, 완제품의 재고 현황을 조회합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
            <Download size={18} />
            엑셀 다운로드
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
            <ArrowRightLeft size={18} />
            재고이동
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <Package className="text-cyan-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">총 재고금액</p>
              <p className="text-2xl font-bold text-cyan-400">{(stats.totalValue / 100000000).toFixed(1)}억</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400 font-bold">R</span>
            </div>
            <div>
              <p className="text-slate-400 text-sm">원자재</p>
              <p className="text-2xl font-bold text-blue-400">{(stats.rawValue / 100000000).toFixed(2)}억</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-yellow-500/20 flex items-center justify-center">
              <span className="text-yellow-400 font-bold">W</span>
            </div>
            <div>
              <p className="text-slate-400 text-sm">재공품</p>
              <p className="text-2xl font-bold text-yellow-400">{(stats.wipValue / 100000000).toFixed(2)}억</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center">
              <span className="text-green-400 font-bold">F</span>
            </div>
            <div>
              <p className="text-slate-400 text-sm">완제품</p>
              <p className="text-2xl font-bold text-green-400">{(stats.finishedValue / 100000000).toFixed(2)}억</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">부족/재고없음</p>
              <p className="text-2xl font-bold text-red-400">{stats.lowStockCount}건</p>
            </div>
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 재고 유형별 금액 */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <h3 className="text-lg font-semibold text-white mb-4">재고 유형별 금액</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockByTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stockByTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${(value / 100000000).toFixed(2)}억원`}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 주요 품목 재고 수준 */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <h3 className="text-lg font-semibold text-white mb-4">주요 품목 재고 수준</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockLevelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                />
                <Bar dataKey="현재고" fill="#3b82f6" />
                <Bar dataKey="안전재고" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 검색 조건 */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">품목유형</label>
            <select
              value={filters.itemType}
              onChange={(e) => setFilters({ ...filters, itemType: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="">전체</option>
              <option value="RAW">원자재</option>
              <option value="WIP">재공품</option>
              <option value="FINISHED">완제품</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">재고상태</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="">전체</option>
              <option value="NORMAL">정상</option>
              <option value="LOW">부족</option>
              <option value="OVER">과잉</option>
              <option value="ZERO">재고없음</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">품목검색</label>
            <input
              type="text"
              placeholder="품목코드 또는 품목명..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => setFilters({ itemType: '', warehouse: '', status: '', searchTerm: '' })}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
            >
              <RefreshCw size={18} />
              초기화
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
              <Search size={18} />
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 재고 목록 */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 text-left text-sm text-slate-400">
                <th className="p-4">품목코드</th>
                <th className="p-4">품목명</th>
                <th className="p-4">유형</th>
                <th className="p-4">창고/위치</th>
                <th className="p-4 text-right">현재고</th>
                <th className="p-4 text-right">가용재고</th>
                <th className="p-4 text-right">예약</th>
                <th className="p-4 text-right">안전재고</th>
                <th className="p-4 text-right">재고금액</th>
                <th className="p-4 text-right">회전율</th>
                <th className="p-4">상태</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.itemCode} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-4">
                    <span className="text-blue-400 font-mono">{item.itemCode}</span>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="text-white">{item.itemName}</p>
                      <p className="text-slate-400 text-sm">{item.spec}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${getItemTypeStyle(item.itemType)}`}>
                      {item.itemType === 'RAW' ? '원자재' : item.itemType === 'WIP' ? '재공품' : '완제품'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="text-white">{item.warehouse}</p>
                      <p className="text-slate-400 text-sm">{item.location}</p>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-medium ${item.currentQty < item.safetyStock ? 'text-red-400' : 'text-white'}`}>
                      {item.currentQty.toLocaleString()}
                    </span>
                    <span className="text-slate-400 text-sm ml-1">{item.unit}</span>
                  </td>
                  <td className="p-4 text-right text-green-400">{item.availableQty.toLocaleString()}</td>
                  <td className="p-4 text-right text-yellow-400">{item.reservedQty.toLocaleString()}</td>
                  <td className="p-4 text-right text-slate-400">{item.safetyStock.toLocaleString()}</td>
                  <td className="p-4 text-right text-cyan-400">
                    {(item.stockValue / 1000000).toFixed(1)}백만
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.turnoverRate > 15 ? (
                        <TrendingUp className="text-green-400" size={14} />
                      ) : item.turnoverRate < 5 ? (
                        <TrendingDown className="text-red-400" size={14} />
                      ) : null}
                      <span className="text-white">{item.turnoverRate.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이징 */}
        <div className="flex justify-between items-center p-4 border-t border-slate-700">
          <span className="text-slate-400 text-sm">
            전체 {filteredItems.length}건
          </span>
          <div className="flex gap-1">
            <button className="px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded">이전</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded">1</button>
            <button className="px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded">다음</button>
          </div>
        </div>
      </div>
    </div>
  );
}
