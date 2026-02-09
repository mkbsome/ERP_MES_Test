import { useState } from 'react';
import { Search, RefreshCw, Play, ChevronDown, ChevronRight, Package, AlertTriangle, ShoppingCart, Calendar } from 'lucide-react';

interface MRPItem {
  itemCode: string;
  itemName: string;
  itemType: 'RAW' | 'WIP' | 'FINISHED';
  spec: string;
  unit: string;
  leadTime: number;
  lotSize: number;
  safetyStock: number;
  onHand: number;
  onOrder: number;
  allocated: number;
  weeks: {
    week: string;
    grossRequirement: number;
    scheduledReceipt: number;
    projectedOnHand: number;
    netRequirement: number;
    plannedOrderReceipt: number;
    plannedOrderRelease: number;
  }[];
  status: 'OK' | 'WARNING' | 'CRITICAL';
}

// 샘플 MRP 데이터
const mockMRPData: MRPItem[] = [
  {
    itemCode: 'RM-PCB-001',
    itemName: 'PCB 기판 (4층)',
    itemType: 'RAW',
    spec: '100×80mm, FR-4',
    unit: 'EA',
    leadTime: 7,
    lotSize: 5000,
    safetyStock: 5000,
    onHand: 12500,
    onOrder: 10000,
    allocated: 2500,
    weeks: [
      { week: 'W05', grossRequirement: 3000, scheduledReceipt: 0, projectedOnHand: 9500, netRequirement: 0, plannedOrderReceipt: 0, plannedOrderRelease: 0 },
      { week: 'W06', grossRequirement: 4000, scheduledReceipt: 10000, projectedOnHand: 15500, netRequirement: 0, plannedOrderReceipt: 0, plannedOrderRelease: 0 },
      { week: 'W07', grossRequirement: 4000, scheduledReceipt: 0, projectedOnHand: 11500, netRequirement: 0, plannedOrderReceipt: 0, plannedOrderRelease: 0 },
      { week: 'W08', grossRequirement: 3500, scheduledReceipt: 0, projectedOnHand: 8000, netRequirement: 0, plannedOrderReceipt: 0, plannedOrderRelease: 5000 },
      { week: 'W09', grossRequirement: 3000, scheduledReceipt: 0, projectedOnHand: 5000, netRequirement: 0, plannedOrderReceipt: 5000, plannedOrderRelease: 5000 },
      { week: 'W10', grossRequirement: 3000, scheduledReceipt: 0, projectedOnHand: 7000, netRequirement: 0, plannedOrderReceipt: 5000, plannedOrderRelease: 0 },
    ],
    status: 'OK'
  },
  {
    itemCode: 'RM-IC-001',
    itemName: 'MCU IC (ARM Cortex)',
    itemType: 'RAW',
    spec: 'STM32F4, LQFP64',
    unit: 'EA',
    leadTime: 14,
    lotSize: 2000,
    safetyStock: 2000,
    onHand: 3200,
    onOrder: 5000,
    allocated: 400,
    weeks: [
      { week: 'W05', grossRequirement: 3000, scheduledReceipt: 0, projectedOnHand: 200, netRequirement: 1800, plannedOrderReceipt: 2000, plannedOrderRelease: 0 },
      { week: 'W06', grossRequirement: 4000, scheduledReceipt: 5000, projectedOnHand: 3200, netRequirement: 0, plannedOrderReceipt: 0, plannedOrderRelease: 4000 },
      { week: 'W07', grossRequirement: 4000, scheduledReceipt: 0, projectedOnHand: -800, netRequirement: 2800, plannedOrderReceipt: 4000, plannedOrderRelease: 4000 },
      { week: 'W08', grossRequirement: 3500, scheduledReceipt: 0, projectedOnHand: -300, netRequirement: 2300, plannedOrderReceipt: 4000, plannedOrderRelease: 2000 },
      { week: 'W09', grossRequirement: 3000, scheduledReceipt: 0, projectedOnHand: 700, netRequirement: 0, plannedOrderReceipt: 4000, plannedOrderRelease: 0 },
      { week: 'W10', grossRequirement: 3000, scheduledReceipt: 0, projectedOnHand: -300, netRequirement: 2300, plannedOrderReceipt: 2000, plannedOrderRelease: 0 },
    ],
    status: 'CRITICAL'
  },
  {
    itemCode: 'RM-CAP-001',
    itemName: '적층세라믹콘덴서',
    itemType: 'RAW',
    spec: '0603, 100nF',
    unit: 'EA',
    leadTime: 5,
    lotSize: 50000,
    safetyStock: 30000,
    onHand: 45000,
    onOrder: 100000,
    allocated: 3000,
    weeks: [
      { week: 'W05', grossRequirement: 135000, scheduledReceipt: 0, projectedOnHand: -90000, netRequirement: 120000, plannedOrderReceipt: 150000, plannedOrderRelease: 0 },
      { week: 'W06', grossRequirement: 180000, scheduledReceipt: 100000, projectedOnHand: -20000, netRequirement: 50000, plannedOrderReceipt: 50000, plannedOrderRelease: 100000 },
      { week: 'W07', grossRequirement: 180000, scheduledReceipt: 0, projectedOnHand: -150000, netRequirement: 180000, plannedOrderReceipt: 200000, plannedOrderRelease: 100000 },
      { week: 'W08', grossRequirement: 157500, scheduledReceipt: 0, projectedOnHand: -107500, netRequirement: 157500, plannedOrderReceipt: 150000, plannedOrderRelease: 50000 },
      { week: 'W09', grossRequirement: 135000, scheduledReceipt: 0, projectedOnHand: -92500, netRequirement: 135000, plannedOrderReceipt: 100000, plannedOrderRelease: 0 },
      { week: 'W10', grossRequirement: 135000, scheduledReceipt: 0, projectedOnHand: -127500, netRequirement: 165000, plannedOrderReceipt: 50000, plannedOrderRelease: 0 },
    ],
    status: 'CRITICAL'
  },
  {
    itemCode: 'RM-CON-001',
    itemName: 'USB-C 커넥터',
    itemType: 'RAW',
    spec: 'Type-C, 24Pin',
    unit: 'EA',
    leadTime: 7,
    lotSize: 5000,
    safetyStock: 3000,
    onHand: 8500,
    onOrder: 15000,
    allocated: 1000,
    weeks: [
      { week: 'W05', grossRequirement: 3000, scheduledReceipt: 0, projectedOnHand: 5500, netRequirement: 0, plannedOrderReceipt: 0, plannedOrderRelease: 0 },
      { week: 'W06', grossRequirement: 4000, scheduledReceipt: 15000, projectedOnHand: 16500, netRequirement: 0, plannedOrderReceipt: 0, plannedOrderRelease: 0 },
      { week: 'W07', grossRequirement: 4000, scheduledReceipt: 0, projectedOnHand: 12500, netRequirement: 0, plannedOrderReceipt: 0, plannedOrderRelease: 0 },
      { week: 'W08', grossRequirement: 3500, scheduledReceipt: 0, projectedOnHand: 9000, netRequirement: 0, plannedOrderReceipt: 0, plannedOrderRelease: 0 },
      { week: 'W09', grossRequirement: 3000, scheduledReceipt: 0, projectedOnHand: 6000, netRequirement: 0, plannedOrderReceipt: 0, plannedOrderRelease: 0 },
      { week: 'W10', grossRequirement: 3000, scheduledReceipt: 0, projectedOnHand: 3000, netRequirement: 0, plannedOrderReceipt: 0, plannedOrderRelease: 5000 },
    ],
    status: 'OK'
  },
  {
    itemCode: 'RM-SOL-001',
    itemName: '솔더페이스트',
    itemType: 'RAW',
    spec: 'Sn63/Pb37',
    unit: 'KG',
    leadTime: 3,
    lotSize: 20,
    safetyStock: 20,
    onHand: 15,
    onOrder: 50,
    allocated: 3,
    weeks: [
      { week: 'W05', grossRequirement: 15, scheduledReceipt: 0, projectedOnHand: 0, netRequirement: 5, plannedOrderReceipt: 20, plannedOrderRelease: 0 },
      { week: 'W06', grossRequirement: 20, scheduledReceipt: 50, projectedOnHand: 50, netRequirement: 0, plannedOrderReceipt: 0, plannedOrderRelease: 20 },
      { week: 'W07', grossRequirement: 20, scheduledReceipt: 0, projectedOnHand: 30, netRequirement: 0, plannedOrderReceipt: 0, plannedOrderRelease: 0 },
      { week: 'W08', grossRequirement: 17, scheduledReceipt: 0, projectedOnHand: 13, netRequirement: 7, plannedOrderReceipt: 20, plannedOrderRelease: 20 },
      { week: 'W09', grossRequirement: 15, scheduledReceipt: 0, projectedOnHand: 18, netRequirement: 0, plannedOrderReceipt: 0, plannedOrderRelease: 0 },
      { week: 'W10', grossRequirement: 15, scheduledReceipt: 0, projectedOnHand: 3, netRequirement: 17, plannedOrderReceipt: 20, plannedOrderRelease: 0 },
    ],
    status: 'WARNING'
  },
];

export default function MRPPage() {
  const [mrpData] = useState<MRPItem[]>(mockMRPData);
  const [selectedItem, setSelectedItem] = useState<MRPItem | null>(mockMRPData[0]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    itemType: '',
    status: '',
  });

  const toggleExpand = (itemCode: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemCode)) {
      newExpanded.delete(itemCode);
    } else {
      newExpanded.add(itemCode);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'OK': return 'bg-green-500/20 text-green-400';
      case 'WARNING': return 'bg-yellow-500/20 text-yellow-400';
      case 'CRITICAL': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
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

  const filteredData = mrpData.filter(item => {
    if (filters.itemType && item.itemType !== filters.itemType) return false;
    if (filters.status && item.status !== filters.status) return false;
    return true;
  });

  // 통계
  const stats = {
    totalItems: mrpData.length,
    criticalItems: mrpData.filter(i => i.status === 'CRITICAL').length,
    warningItems: mrpData.filter(i => i.status === 'WARNING').length,
    plannedOrders: mrpData.reduce((sum, i) => sum + i.weeks.filter(w => w.plannedOrderRelease > 0).length, 0),
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">MRP (자재소요계획)</h1>
          <p className="text-slate-400 text-sm mt-1">MPS 기반 자재 소요량을 계산하고 발주 계획을 수립합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
            <RefreshCw size={18} />
            MRP 갱신
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
            <Play size={18} />
            MRP 실행
          </button>
        </div>
      </div>

      {/* 검색 조건 */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <div className="grid grid-cols-4 gap-4">
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
            <label className="block text-sm text-slate-400 mb-1">상태</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="">전체</option>
              <option value="OK">정상</option>
              <option value="WARNING">주의</option>
              <option value="CRITICAL">위험</option>
            </select>
          </div>
          <div className="col-span-2 flex items-end gap-2">
            <button
              onClick={() => setFilters({ itemType: '', status: '' })}
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

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <Package className="text-blue-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">대상 품목</p>
              <p className="text-2xl font-bold text-white">{stats.totalItems}개</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">위험 품목</p>
              <p className="text-2xl font-bold text-red-400">{stats.criticalItems}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-yellow-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">주의 품목</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.warningItems}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="text-cyan-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">계획 발주</p>
              <p className="text-2xl font-bold text-cyan-400">{stats.plannedOrders}건</p>
            </div>
          </div>
        </div>
      </div>

      {/* MRP 목록 */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">자재소요 계획</h3>
          <div className="flex gap-2 text-sm">
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">정상</span>
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">주의</span>
            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">위험</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="p-3 text-left w-8"></th>
                <th className="p-3 text-left">품목코드</th>
                <th className="p-3 text-left">품목명</th>
                <th className="p-3 text-left">유형</th>
                <th className="p-3 text-right">현재고</th>
                <th className="p-3 text-right">발주중</th>
                <th className="p-3 text-right">L/T</th>
                <th className="p-3 text-right">LOT</th>
                <th className="p-3 text-center">상태</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <>
                  <tr
                    key={item.itemCode}
                    className={`border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer ${
                      selectedItem?.itemCode === item.itemCode ? 'bg-blue-900/20' : ''
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="p-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(item.itemCode);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        {expandedItems.has(item.itemCode) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>
                    <td className="p-3 text-blue-400 font-mono">{item.itemCode}</td>
                    <td className="p-3">
                      <div>
                        <p className="text-white">{item.itemName}</p>
                        <p className="text-slate-400 text-xs">{item.spec}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${getItemTypeStyle(item.itemType)}`}>
                        {item.itemType === 'RAW' ? '원자재' : item.itemType === 'WIP' ? '재공품' : '완제품'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-white">{item.onHand.toLocaleString()}</td>
                    <td className="p-3 text-right text-cyan-400">{item.onOrder.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-300">{item.leadTime}일</td>
                    <td className="p-3 text-right text-slate-300">{item.lotSize.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(item.status)}`}>
                        {item.status === 'OK' ? '정상' : item.status === 'WARNING' ? '주의' : '위험'}
                      </span>
                    </td>
                  </tr>
                  {/* 주간 상세 */}
                  {expandedItems.has(item.itemCode) && (
                    <tr>
                      <td colSpan={9} className="bg-slate-900/50 p-0">
                        <div className="p-4">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-slate-400 border-b border-slate-700">
                                <th className="py-2 text-left">구분</th>
                                {item.weeks.map(w => (
                                  <th key={w.week} className="py-2 text-right">{w.week}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-slate-700/50">
                                <td className="py-2 text-slate-400">총소요량</td>
                                {item.weeks.map(w => (
                                  <td key={w.week} className="py-2 text-right text-white">{w.grossRequirement.toLocaleString()}</td>
                                ))}
                              </tr>
                              <tr className="border-b border-slate-700/50">
                                <td className="py-2 text-slate-400">예정입고</td>
                                {item.weeks.map(w => (
                                  <td key={w.week} className="py-2 text-right text-cyan-400">{w.scheduledReceipt > 0 ? w.scheduledReceipt.toLocaleString() : '-'}</td>
                                ))}
                              </tr>
                              <tr className="border-b border-slate-700/50">
                                <td className="py-2 text-slate-400">예상재고</td>
                                {item.weeks.map(w => (
                                  <td key={w.week} className={`py-2 text-right ${w.projectedOnHand < 0 ? 'text-red-400' : w.projectedOnHand < item.safetyStock ? 'text-yellow-400' : 'text-white'}`}>
                                    {w.projectedOnHand.toLocaleString()}
                                  </td>
                                ))}
                              </tr>
                              <tr className="border-b border-slate-700/50">
                                <td className="py-2 text-slate-400">순소요량</td>
                                {item.weeks.map(w => (
                                  <td key={w.week} className="py-2 text-right text-orange-400">{w.netRequirement > 0 ? w.netRequirement.toLocaleString() : '-'}</td>
                                ))}
                              </tr>
                              <tr className="border-b border-slate-700/50 bg-green-900/10">
                                <td className="py-2 text-green-400">계획입고</td>
                                {item.weeks.map(w => (
                                  <td key={w.week} className="py-2 text-right text-green-400">{w.plannedOrderReceipt > 0 ? w.plannedOrderReceipt.toLocaleString() : '-'}</td>
                                ))}
                              </tr>
                              <tr className="bg-blue-900/10">
                                <td className="py-2 text-blue-400 font-medium">계획발주</td>
                                {item.weeks.map(w => (
                                  <td key={w.week} className="py-2 text-right text-blue-400 font-medium">{w.plannedOrderRelease > 0 ? w.plannedOrderRelease.toLocaleString() : '-'}</td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
