import { useState } from 'react';
import { Search, RefreshCw, Plus, ArrowRight, Package, CheckCircle, Clock, XCircle } from 'lucide-react';

interface MovementItem {
  lineNo: number;
  itemCode: string;
  itemName: string;
  spec: string;
  quantity: number;
  unit: string;
  fromWarehouse: string;
  fromLocation: string;
  toWarehouse: string;
  toLocation: string;
  status: 'PENDING' | 'COMPLETED';
}

interface StockMovement {
  movementNo: string;
  movementDate: string;
  movementType: 'TRANSFER' | 'PRODUCTION_ISSUE' | 'PRODUCTION_RECEIPT' | 'ADJUSTMENT';
  fromWarehouse: string;
  toWarehouse: string;
  status: 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  requestedBy: string;
  approvedBy: string;
  remark: string;
  items: MovementItem[];
}

// 샘플 재고이동 데이터
const mockMovements: StockMovement[] = [
  {
    movementNo: 'SM-2024-001',
    movementDate: '2024-01-22',
    movementType: 'TRANSFER',
    fromWarehouse: '원자재창고',
    toWarehouse: '생산라인창고',
    status: 'COMPLETED',
    requestedBy: '김생산',
    approvedBy: '박관리',
    remark: 'SMT 라인 투입용',
    items: [
      { lineNo: 1, itemCode: 'RM-PCB-001', itemName: 'PCB 기판 (4층)', spec: '100×80mm, FR-4', quantity: 500, unit: 'EA', fromWarehouse: '원자재창고', fromLocation: 'A-01-01', toWarehouse: '생산라인창고', toLocation: 'L1-01', status: 'COMPLETED' },
      { lineNo: 2, itemCode: 'RM-IC-001', itemName: 'MCU IC (ARM Cortex)', spec: 'STM32F4, LQFP64', quantity: 500, unit: 'EA', fromWarehouse: '원자재창고', fromLocation: 'A-02-03', toWarehouse: '생산라인창고', toLocation: 'L1-02', status: 'COMPLETED' },
      { lineNo: 3, itemCode: 'RM-CAP-001', itemName: '적층세라믹콘덴서', spec: '0603, 100nF', quantity: 25000, unit: 'EA', fromWarehouse: '원자재창고', fromLocation: 'A-03-02', toWarehouse: '생산라인창고', toLocation: 'L1-03', status: 'COMPLETED' },
    ]
  },
  {
    movementNo: 'SM-2024-002',
    movementDate: '2024-01-23',
    movementType: 'PRODUCTION_RECEIPT',
    fromWarehouse: '생산라인',
    toWarehouse: '완제품창고',
    status: 'COMPLETED',
    requestedBy: '이생산',
    approvedBy: '박관리',
    remark: '생산완료 입고',
    items: [
      { lineNo: 1, itemCode: 'FG-SMB-001', itemName: '스마트폰 메인보드 A1', spec: '150×70mm, 8-Layer', quantity: 480, unit: 'EA', fromWarehouse: '생산라인', fromLocation: 'L1-완료', toWarehouse: '완제품창고', toLocation: 'D-01-01', status: 'COMPLETED' },
    ]
  },
  {
    movementNo: 'SM-2024-003',
    movementDate: '2024-01-24',
    movementType: 'TRANSFER',
    fromWarehouse: '원자재창고',
    toWarehouse: '생산라인창고',
    status: 'IN_PROGRESS',
    requestedBy: '최생산',
    approvedBy: '박관리',
    remark: 'THT 라인 투입',
    items: [
      { lineNo: 1, itemCode: 'RM-CAP-002', itemName: '전해콘덴서', spec: '470uF/25V', quantity: 2000, unit: 'EA', fromWarehouse: '원자재창고', fromLocation: 'A-03-08', toWarehouse: '생산라인창고', toLocation: 'L2-01', status: 'COMPLETED' },
      { lineNo: 2, itemCode: 'RM-TR-001', itemName: '변압기', spec: 'EI-33', quantity: 500, unit: 'EA', fromWarehouse: '원자재창고', fromLocation: 'A-04-05', toWarehouse: '생산라인창고', toLocation: 'L2-02', status: 'PENDING' },
    ]
  },
  {
    movementNo: 'SM-2024-004',
    movementDate: '2024-01-25',
    movementType: 'ADJUSTMENT',
    fromWarehouse: '원자재창고',
    toWarehouse: '원자재창고',
    status: 'APPROVED',
    requestedBy: '김재고',
    approvedBy: '박관리',
    remark: '재고실사 조정',
    items: [
      { lineNo: 1, itemCode: 'RM-RES-001', itemName: '칩저항', spec: '0402, 10KΩ', quantity: -500, unit: 'EA', fromWarehouse: '원자재창고', fromLocation: 'A-03-05', toWarehouse: '원자재창고', toLocation: 'A-03-05', status: 'PENDING' },
    ]
  },
  {
    movementNo: 'SM-2024-005',
    movementDate: '2024-01-26',
    movementType: 'PRODUCTION_ISSUE',
    fromWarehouse: '원자재창고',
    toWarehouse: '생산라인',
    status: 'DRAFT',
    requestedBy: '김생산',
    approvedBy: '',
    remark: '작업지시 WO-2024-015',
    items: [
      { lineNo: 1, itemCode: 'RM-PCB-001', itemName: 'PCB 기판 (4층)', spec: '100×80mm, FR-4', quantity: 1000, unit: 'EA', fromWarehouse: '원자재창고', fromLocation: 'A-01-01', toWarehouse: '생산라인', toLocation: 'L1-투입', status: 'PENDING' },
    ]
  },
];

export default function StockMovementPage() {
  const [movements] = useState<StockMovement[]>(mockMovements);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    movementType: '',
    dateFrom: '',
    dateTo: '',
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-500/20 text-slate-400';
      case 'APPROVED': return 'bg-blue-500/20 text-blue-400';
      case 'IN_PROGRESS': return 'bg-yellow-500/20 text-yellow-400';
      case 'COMPLETED': return 'bg-green-500/20 text-green-400';
      case 'CANCELLED': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return '작성중';
      case 'APPROVED': return '승인완료';
      case 'IN_PROGRESS': return '진행중';
      case 'COMPLETED': return '완료';
      case 'CANCELLED': return '취소';
      default: return status;
    }
  };

  const getMovementTypeStyle = (type: string) => {
    switch (type) {
      case 'TRANSFER': return 'bg-blue-500/20 text-blue-400';
      case 'PRODUCTION_ISSUE': return 'bg-orange-500/20 text-orange-400';
      case 'PRODUCTION_RECEIPT': return 'bg-green-500/20 text-green-400';
      case 'ADJUSTMENT': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getMovementTypeText = (type: string) => {
    switch (type) {
      case 'TRANSFER': return '창고이동';
      case 'PRODUCTION_ISSUE': return '생산출고';
      case 'PRODUCTION_RECEIPT': return '생산입고';
      case 'ADJUSTMENT': return '재고조정';
      default: return type;
    }
  };

  const filteredMovements = movements.filter(movement => {
    if (filters.status && movement.status !== filters.status) return false;
    if (filters.movementType && movement.movementType !== filters.movementType) return false;
    return true;
  });

  // 요약 통계
  const stats = {
    totalMovements: movements.length,
    pendingCount: movements.filter(m => m.status === 'DRAFT' || m.status === 'APPROVED').length,
    inProgressCount: movements.filter(m => m.status === 'IN_PROGRESS').length,
    completedToday: movements.filter(m => m.status === 'COMPLETED' && m.movementDate === '2024-01-26').length,
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">재고이동</h1>
          <p className="text-slate-400 text-sm mt-1">창고 간 재고 이동 및 생산 입출고를 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
            <Plus size={18} />
            이동등록
          </button>
        </div>
      </div>

      {/* 검색 조건 */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">이동유형</label>
            <select
              value={filters.movementType}
              onChange={(e) => setFilters({ ...filters, movementType: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="">전체</option>
              <option value="TRANSFER">창고이동</option>
              <option value="PRODUCTION_ISSUE">생산출고</option>
              <option value="PRODUCTION_RECEIPT">생산입고</option>
              <option value="ADJUSTMENT">재고조정</option>
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
              <option value="DRAFT">작성중</option>
              <option value="APPROVED">승인완료</option>
              <option value="IN_PROGRESS">진행중</option>
              <option value="COMPLETED">완료</option>
              <option value="CANCELLED">취소</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">이동일(From)</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">이동일(To)</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => setFilters({ status: '', movementType: '', dateFrom: '', dateTo: '' })}
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
              <p className="text-slate-400 text-sm">전체 이동</p>
              <p className="text-2xl font-bold text-white">{stats.totalMovements}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <Clock className="text-yellow-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">대기중</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pendingCount}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <ArrowRight className="text-cyan-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">진행중</p>
              <p className="text-2xl font-bold text-cyan-400">{stats.inProgressCount}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">오늘 완료</p>
              <p className="text-2xl font-bold text-green-400">{stats.completedToday}건</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* 이동 목록 */}
        <div className="col-span-2 bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">이동 목록</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 text-left text-sm text-slate-400">
                  <th className="p-3">이동번호</th>
                  <th className="p-3">이동일</th>
                  <th className="p-3">유형</th>
                  <th className="p-3">출고창고</th>
                  <th className="p-3">입고창고</th>
                  <th className="p-3">상태</th>
                  <th className="p-3">요청자</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((movement) => (
                  <tr
                    key={movement.movementNo}
                    onClick={() => setSelectedMovement(movement)}
                    className={`border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer ${
                      selectedMovement?.movementNo === movement.movementNo ? 'bg-blue-900/20' : ''
                    }`}
                  >
                    <td className="p-3">
                      <span className="text-blue-400 font-mono">{movement.movementNo}</span>
                    </td>
                    <td className="p-3 text-white">{movement.movementDate}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${getMovementTypeStyle(movement.movementType)}`}>
                        {getMovementTypeText(movement.movementType)}
                      </span>
                    </td>
                    <td className="p-3 text-white">{movement.fromWarehouse}</td>
                    <td className="p-3 text-white">{movement.toWarehouse}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(movement.status)}`}>
                        {getStatusText(movement.status)}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{movement.requestedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 이동 상세 */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">이동 상세</h3>
          </div>
          {selectedMovement ? (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">이동번호</p>
                  <p className="text-blue-400 font-mono">{selectedMovement.movementNo}</p>
                </div>
                <div>
                  <p className="text-slate-400">이동일</p>
                  <p className="text-white">{selectedMovement.movementDate}</p>
                </div>
                <div>
                  <p className="text-slate-400">이동유형</p>
                  <span className={`px-2 py-1 rounded text-xs ${getMovementTypeStyle(selectedMovement.movementType)}`}>
                    {getMovementTypeText(selectedMovement.movementType)}
                  </span>
                </div>
                <div>
                  <p className="text-slate-400">상태</p>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(selectedMovement.status)}`}>
                    {getStatusText(selectedMovement.status)}
                  </span>
                </div>
                <div>
                  <p className="text-slate-400">요청자</p>
                  <p className="text-white">{selectedMovement.requestedBy}</p>
                </div>
                <div>
                  <p className="text-slate-400">승인자</p>
                  <p className="text-white">{selectedMovement.approvedBy || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400">비고</p>
                  <p className="text-white">{selectedMovement.remark || '-'}</p>
                </div>
              </div>

              {/* 이동 경로 */}
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-slate-400 text-xs mb-1">출고</p>
                    <p className="text-white font-medium">{selectedMovement.fromWarehouse}</p>
                  </div>
                  <ArrowRight className="text-cyan-400" size={24} />
                  <div className="text-center">
                    <p className="text-slate-400 text-xs mb-1">입고</p>
                    <p className="text-white font-medium">{selectedMovement.toWarehouse}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">이동 품목</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedMovement.items.map((item) => (
                    <div key={item.lineNo} className="bg-slate-900 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-blue-400 font-mono text-sm">{item.itemCode}</p>
                          <p className="text-white">{item.itemName}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs ${item.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                          {item.status === 'COMPLETED' ? '완료' : '대기'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-slate-400">{item.fromLocation}</span>
                        <ArrowRight className="text-slate-500" size={14} />
                        <span className="text-slate-400">{item.toLocation}</span>
                        <span className="text-cyan-400 font-medium">
                          {item.quantity > 0 ? '+' : ''}{item.quantity.toLocaleString()} {item.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {selectedMovement.status === 'DRAFT' && (
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
                    <CheckCircle size={18} />
                    승인요청
                  </button>
                )}
                {selectedMovement.status === 'APPROVED' && (
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500">
                    <ArrowRight size={18} />
                    이동실행
                  </button>
                )}
                {selectedMovement.status === 'IN_PROGRESS' && (
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500">
                    <CheckCircle size={18} />
                    이동완료
                  </button>
                )}
                {(selectedMovement.status === 'DRAFT' || selectedMovement.status === 'APPROVED') && (
                  <button className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500">
                    <XCircle size={18} />
                    취소
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>좌측에서 이동 건을 선택하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
