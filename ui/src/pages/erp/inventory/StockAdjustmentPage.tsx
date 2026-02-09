import { useState } from 'react';
import {
  ClipboardEdit,
  Search,
  RefreshCw,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

interface AdjustmentItem {
  itemCode: string;
  itemName: string;
  systemQty: number;
  physicalQty: number;
  adjustQty: number;
  unit: string;
  unitCost: number;
  adjustAmount: number;
}

interface StockAdjustment {
  adjustmentNo: string;
  adjustmentDate: string;
  warehouseCode: string;
  warehouseName: string;
  adjustmentType: 'INVENTORY_COUNT' | 'DAMAGE' | 'LOSS' | 'FOUND' | 'QUALITY_ISSUE';
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  totalItems: number;
  totalAdjustAmount: number;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  items: AdjustmentItem[];
}

const mockAdjustments: StockAdjustment[] = [
  {
    adjustmentNo: 'ADJ-2024-0201',
    adjustmentDate: '2024-02-01',
    warehouseCode: 'WH-001',
    warehouseName: '원자재 창고',
    adjustmentType: 'INVENTORY_COUNT',
    status: 'APPROVED',
    totalItems: 3,
    totalAdjustAmount: -1250000,
    reason: '월말 재고실사 결과',
    requestedBy: '김재고',
    approvedBy: '이승인',
    items: [
      { itemCode: 'RM-PCB-001', itemName: 'PCB 기판 (4층)', systemQty: 12500, physicalQty: 12450, adjustQty: -50, unit: 'EA', unitCost: 12000, adjustAmount: -600000 },
      { itemCode: 'RM-IC-001', itemName: 'MCU IC (ARM Cortex)', systemQty: 3200, physicalQty: 3180, adjustQty: -20, unit: 'EA', unitCost: 15000, adjustAmount: -300000 },
      { itemCode: 'RM-CAP-001', itemName: '적층세라믹콘덴서', systemQty: 45000, physicalQty: 44300, adjustQty: -700, unit: 'EA', unitCost: 500, adjustAmount: -350000 },
    ],
  },
  {
    adjustmentNo: 'ADJ-2024-0202',
    adjustmentDate: '2024-02-02',
    warehouseCode: 'WH-002',
    warehouseName: '반제품 창고',
    adjustmentType: 'DAMAGE',
    status: 'PENDING',
    totalItems: 2,
    totalAdjustAmount: -850000,
    reason: '운반 중 파손 발생',
    requestedBy: '박창고',
    items: [
      { itemCode: 'SF-SMB-001', itemName: '스마트폰 보드 (조립전)', systemQty: 500, physicalQty: 485, adjustQty: -15, unit: 'EA', unitCost: 35000, adjustAmount: -525000 },
      { itemCode: 'SF-PWR-001', itemName: '전원보드 (조립전)', systemQty: 300, physicalQty: 287, adjustQty: -13, unit: 'EA', unitCost: 25000, adjustAmount: -325000 },
    ],
  },
  {
    adjustmentNo: 'ADJ-2024-0203',
    adjustmentDate: '2024-02-03',
    warehouseCode: 'WH-001',
    warehouseName: '원자재 창고',
    adjustmentType: 'FOUND',
    status: 'APPROVED',
    totalItems: 1,
    totalAdjustAmount: 480000,
    reason: '미등록 입고분 발견',
    requestedBy: '김재고',
    approvedBy: '이승인',
    items: [
      { itemCode: 'RM-CON-001', itemName: 'USB-C 커넥터', systemQty: 8500, physicalQty: 8560, adjustQty: 60, unit: 'EA', unitCost: 8000, adjustAmount: 480000 },
    ],
  },
  {
    adjustmentNo: 'ADJ-2024-0204',
    adjustmentDate: '2024-02-03',
    warehouseCode: 'WH-003',
    warehouseName: '완제품 창고',
    adjustmentType: 'QUALITY_ISSUE',
    status: 'DRAFT',
    totalItems: 2,
    totalAdjustAmount: -2700000,
    reason: '품질검사 불합격 폐기',
    requestedBy: '최품질',
    items: [
      { itemCode: 'FG-SMB-001', itemName: '스마트폰 메인보드 A1', systemQty: 5800, physicalQty: 5750, adjustQty: -50, unit: 'EA', unitCost: 45000, adjustAmount: -2250000 },
      { itemCode: 'FG-IOT-001', itemName: 'IoT 모듈 M1', systemQty: 2400, physicalQty: 2380, adjustQty: -20, unit: 'EA', unitCost: 22000, adjustAmount: -440000 },
    ],
  },
  {
    adjustmentNo: 'ADJ-2024-0205',
    adjustmentDate: '2024-02-03',
    warehouseCode: 'WH-001',
    warehouseName: '원자재 창고',
    adjustmentType: 'LOSS',
    status: 'REJECTED',
    totalItems: 1,
    totalAdjustAmount: -1500000,
    reason: '분실 (원인 미상)',
    requestedBy: '박창고',
    items: [
      { itemCode: 'RM-IC-002', itemName: '차량용 MCU', systemQty: 350, physicalQty: 303, adjustQty: -47, unit: 'EA', unitCost: 32000, adjustAmount: -1504000 },
    ],
  },
];

const typeConfig = {
  INVENTORY_COUNT: { label: '재고실사', color: 'bg-blue-500' },
  DAMAGE: { label: '파손', color: 'bg-orange-500' },
  LOSS: { label: '분실', color: 'bg-red-500' },
  FOUND: { label: '발견', color: 'bg-green-500' },
  QUALITY_ISSUE: { label: '품질불량', color: 'bg-purple-500' },
};

const statusConfig = {
  DRAFT: { label: '임시저장', color: 'bg-slate-500', icon: Clock },
  PENDING: { label: '승인대기', color: 'bg-yellow-500', icon: AlertTriangle },
  APPROVED: { label: '승인완료', color: 'bg-green-500', icon: CheckCircle },
  REJECTED: { label: '반려', color: 'bg-red-500', icon: XCircle },
};

export default function StockAdjustmentPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustment | null>(mockAdjustments[0]);

  const filteredAdjustments = mockAdjustments.filter(adj => {
    const matchesSearch = adj.adjustmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          adj.warehouseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || adj.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || adj.adjustmentType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const summary = {
    total: mockAdjustments.length,
    pending: mockAdjustments.filter(a => a.status === 'PENDING').length,
    approved: mockAdjustments.filter(a => a.status === 'APPROVED').length,
    totalAmount: mockAdjustments.reduce((sum, a) => sum + a.totalAdjustAmount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ClipboardEdit className="h-8 w-8 text-cyan-400" />
            재고조정
          </h1>
          <p className="text-slate-400 mt-1">재고실사, 파손, 분실 등의 재고조정을 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors">
            <Plus className="h-4 w-4" />
            조정 등록
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">전체 조정</p>
          <p className="text-2xl font-bold text-white">{summary.total}건</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">승인대기</p>
          <p className="text-2xl font-bold text-yellow-400">{summary.pending}건</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">승인완료</p>
          <p className="text-2xl font-bold text-green-400">{summary.approved}건</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">조정금액 합계</p>
          <p className={`text-2xl font-bold ${summary.totalAmount > 0 ? 'text-green-400' : 'text-red-400'}`}>
            ₩{(summary.totalAmount / 1000000).toFixed(2)}M
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-6">
        {/* Adjustment List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="조정번호 또는 창고명..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 text-sm"
              >
                <option value="ALL">전체 유형</option>
                <option value="INVENTORY_COUNT">재고실사</option>
                <option value="DAMAGE">파손</option>
                <option value="LOSS">분실</option>
                <option value="FOUND">발견</option>
                <option value="QUALITY_ISSUE">품질불량</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 text-sm"
              >
                <option value="ALL">전체 상태</option>
                <option value="DRAFT">임시저장</option>
                <option value="PENDING">승인대기</option>
                <option value="APPROVED">승인완료</option>
                <option value="REJECTED">반려</option>
              </select>
            </div>
          </div>
          <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto">
            {filteredAdjustments.map((adjustment) => {
              const StatusIcon = statusConfig[adjustment.status].icon;
              return (
                <div
                  key={adjustment.adjustmentNo}
                  className={`p-4 cursor-pointer hover:bg-slate-700/50 ${
                    selectedAdjustment?.adjustmentNo === adjustment.adjustmentNo ? 'bg-slate-700/50 border-l-2 border-cyan-400' : ''
                  }`}
                  onClick={() => setSelectedAdjustment(adjustment)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-cyan-400 font-medium">{adjustment.adjustmentNo}</p>
                      <p className="text-sm text-slate-400">{adjustment.warehouseName}</p>
                      <p className="text-xs text-slate-500 mt-1">{adjustment.adjustmentDate}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig[adjustment.status].color} text-white`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[adjustment.status].label}
                      </span>
                      <p className={`text-sm font-medium mt-2 ${
                        adjustment.totalAdjustAmount > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {adjustment.totalAdjustAmount > 0 ? '+' : ''}₩{(adjustment.totalAdjustAmount / 1000).toLocaleString()}K
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${typeConfig[adjustment.adjustmentType].color} text-white`}>
                      {typeConfig[adjustment.adjustmentType].label}
                    </span>
                    <span className="text-xs text-slate-500">{adjustment.totalItems}개 품목</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Adjustment Detail */}
        {selectedAdjustment && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedAdjustment.adjustmentNo}</h3>
                <p className="text-sm text-slate-400">{selectedAdjustment.adjustmentDate}</p>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${statusConfig[selectedAdjustment.status].color} text-white`}>
                {statusConfig[selectedAdjustment.status].label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400">창고</p>
                <p className="text-white font-medium">{selectedAdjustment.warehouseName}</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400">조정유형</p>
                <span className={`inline-flex px-2 py-0.5 rounded text-sm ${typeConfig[selectedAdjustment.adjustmentType].color} text-white`}>
                  {typeConfig[selectedAdjustment.adjustmentType].label}
                </span>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400">요청자</p>
                <p className="text-white">{selectedAdjustment.requestedBy}</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400">승인자</p>
                <p className="text-white">{selectedAdjustment.approvedBy || '-'}</p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-3 mb-6">
              <p className="text-xs text-slate-400 mb-1">조정사유</p>
              <p className="text-white">{selectedAdjustment.reason}</p>
            </div>

            <h4 className="text-sm font-medium text-slate-300 mb-3">조정 품목</h4>
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {selectedAdjustment.items.map((item, idx) => (
                <div key={idx} className="bg-slate-900 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white font-medium">{item.itemName}</p>
                      <p className="text-xs text-slate-400">{item.itemCode}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.adjustQty > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : item.adjustQty < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      ) : (
                        <Minus className="h-4 w-4 text-slate-400" />
                      )}
                      <span className={`font-semibold ${
                        item.adjustQty > 0 ? 'text-green-400' : item.adjustQty < 0 ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {item.adjustQty > 0 ? '+' : ''}{item.adjustQty} {item.unit}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs">장부수량</p>
                      <p className="text-slate-300">{item.systemQty.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">실사수량</p>
                      <p className="text-slate-300">{item.physicalQty.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">단가</p>
                      <p className="text-slate-300">₩{item.unitCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">조정금액</p>
                      <p className={item.adjustAmount > 0 ? 'text-green-400' : 'text-red-400'}>
                        {item.adjustAmount > 0 ? '+' : ''}₩{(item.adjustAmount / 1000).toLocaleString()}K
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
              <span className="text-slate-400">총 조정금액</span>
              <span className={`text-xl font-bold ${
                selectedAdjustment.totalAdjustAmount > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {selectedAdjustment.totalAdjustAmount > 0 ? '+' : ''}₩{(selectedAdjustment.totalAdjustAmount / 1000000).toFixed(2)}M
              </span>
            </div>

            {selectedAdjustment.status === 'PENDING' && (
              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors">
                  승인
                </button>
                <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">
                  반려
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
