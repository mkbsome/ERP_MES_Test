import { useState } from 'react';
import {
  Route,
  Search,
  RefreshCw,
  ChevronRight,
  Package,
  Factory,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface LotHistory {
  timestamp: string;
  event: string;
  location: string;
  operator: string;
  quantity: number;
  status: 'PASS' | 'FAIL' | 'IN_PROGRESS';
}

interface LotInfo {
  lotNo: string;
  productCode: string;
  productName: string;
  workOrderNo: string;
  quantity: number;
  currentLocation: string;
  status: 'IN_PROCESS' | 'COMPLETED' | 'HOLD' | 'SCRAPPED';
  createdAt: string;
  materials: {
    materialCode: string;
    materialName: string;
    lotNo: string;
    quantity: number;
  }[];
  history: LotHistory[];
}

const mockLots: LotInfo[] = [
  {
    lotNo: 'LOT-2024-020101',
    productCode: 'FG-SMB-001',
    productName: '스마트폰 메인보드 A1',
    workOrderNo: 'WO-2024-0201',
    quantity: 250,
    currentLocation: '완제품 창고',
    status: 'COMPLETED',
    createdAt: '2024-02-01 06:00',
    materials: [
      { materialCode: 'RM-PCB-001', materialName: 'PCB 기판 (4층)', lotNo: 'MAT-PCB-240128-01', quantity: 250 },
      { materialCode: 'RM-IC-001', materialName: 'MCU IC (ARM)', lotNo: 'MAT-IC-240125-03', quantity: 250 },
      { materialCode: 'RM-CAP-001', materialName: '적층세라믹콘덴서', lotNo: 'MAT-CAP-240130-02', quantity: 11250 },
    ],
    history: [
      { timestamp: '2024-02-01 06:00', event: 'LOT 생성', location: '원자재 창고', operator: '김철수', quantity: 250, status: 'PASS' },
      { timestamp: '2024-02-01 06:30', event: '자재 투입', location: 'SMT 1라인', operator: '이영희', quantity: 250, status: 'PASS' },
      { timestamp: '2024-02-01 06:35', event: '초물검사 합격', location: 'SMT 1라인', operator: '한미래', quantity: 250, status: 'PASS' },
      { timestamp: '2024-02-01 12:00', event: 'SMT 공정 완료', location: 'SMT 1라인', operator: '박민수', quantity: 248, status: 'PASS' },
      { timestamp: '2024-02-01 12:15', event: '중간검사 합격', location: 'SMT 1라인', operator: '한미래', quantity: 248, status: 'PASS' },
      { timestamp: '2024-02-01 14:30', event: 'AOI 검사', location: 'AOI 설비', operator: '자동', quantity: 245, status: 'PASS' },
      { timestamp: '2024-02-01 16:00', event: 'ICT 테스트', location: '테스트 1라인', operator: '최동현', quantity: 243, status: 'PASS' },
      { timestamp: '2024-02-01 17:30', event: '최종검사 합격', location: '품질검사실', operator: '한미래', quantity: 242, status: 'PASS' },
      { timestamp: '2024-02-01 18:00', event: '완제품 입고', location: '완제품 창고', operator: '박창고', quantity: 242, status: 'PASS' },
    ],
  },
  {
    lotNo: 'LOT-2024-020102',
    productCode: 'FG-SMB-001',
    productName: '스마트폰 메인보드 A1',
    workOrderNo: 'WO-2024-0201',
    quantity: 250,
    currentLocation: 'SMT 1라인',
    status: 'IN_PROCESS',
    createdAt: '2024-02-01 14:00',
    materials: [
      { materialCode: 'RM-PCB-001', materialName: 'PCB 기판 (4층)', lotNo: 'MAT-PCB-240128-02', quantity: 250 },
      { materialCode: 'RM-IC-001', materialName: 'MCU IC (ARM)', lotNo: 'MAT-IC-240125-04', quantity: 250 },
    ],
    history: [
      { timestamp: '2024-02-01 14:00', event: 'LOT 생성', location: '원자재 창고', operator: '김철수', quantity: 250, status: 'PASS' },
      { timestamp: '2024-02-01 14:30', event: '자재 투입', location: 'SMT 1라인', operator: '이영희', quantity: 250, status: 'PASS' },
      { timestamp: '2024-02-01 14:35', event: '초물검사 합격', location: 'SMT 1라인', operator: '한미래', quantity: 250, status: 'PASS' },
      { timestamp: '2024-02-01 18:30', event: 'SMT 공정 진행중', location: 'SMT 1라인', operator: '박민수', quantity: 180, status: 'IN_PROGRESS' },
    ],
  },
  {
    lotNo: 'LOT-2024-020201',
    productCode: 'FG-IOT-001',
    productName: 'IoT 모듈 M1',
    workOrderNo: 'WO-2024-0205',
    quantity: 300,
    currentLocation: '품질검사실',
    status: 'HOLD',
    createdAt: '2024-02-02 06:00',
    materials: [
      { materialCode: 'RM-PCB-005', materialName: 'PCB 기판 (양면)', lotNo: 'MAT-PCB-240201-01', quantity: 300 },
      { materialCode: 'RM-WIFI-001', materialName: 'WiFi 모듈', lotNo: 'MAT-WIFI-240129-01', quantity: 300 },
    ],
    history: [
      { timestamp: '2024-02-02 06:00', event: 'LOT 생성', location: '원자재 창고', operator: '김철수', quantity: 300, status: 'PASS' },
      { timestamp: '2024-02-02 06:30', event: '자재 투입', location: 'SMT 4라인', operator: '정수진', quantity: 300, status: 'PASS' },
      { timestamp: '2024-02-02 10:00', event: 'SMT 공정 완료', location: 'SMT 4라인', operator: '정수진', quantity: 295, status: 'PASS' },
      { timestamp: '2024-02-02 12:00', event: '품질검사 보류', location: '품질검사실', operator: '한미래', quantity: 295, status: 'FAIL' },
    ],
  },
];

const statusConfig = {
  IN_PROCESS: { label: '진행중', color: 'bg-blue-500' },
  COMPLETED: { label: '완료', color: 'bg-green-500' },
  HOLD: { label: '보류', color: 'bg-yellow-500' },
  SCRAPPED: { label: '폐기', color: 'bg-red-500' },
};

const historyStatusConfig = {
  PASS: { color: 'text-green-400', bgColor: 'bg-green-500' },
  FAIL: { color: 'text-red-400', bgColor: 'bg-red-500' },
  IN_PROGRESS: { color: 'text-blue-400', bgColor: 'bg-blue-500' },
};

export default function LotTrackingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedLot, setSelectedLot] = useState<LotInfo | null>(mockLots[0]);

  const filteredLots = mockLots.filter(lot => {
    const matchesSearch = lot.lotNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lot.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lot.workOrderNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || lot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Route className="h-8 w-8 text-cyan-400" />
            LOT 추적
          </h1>
          <p className="text-slate-400 mt-1">생산 LOT의 이력과 자재 추적성을 관리합니다.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
          <RefreshCw className="h-4 w-4" />
          새로고침
        </button>
      </div>

      {/* Search */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="LOT번호, 제품명, 작업지시번호로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">전체 상태</option>
            <option value="IN_PROCESS">진행중</option>
            <option value="COMPLETED">완료</option>
            <option value="HOLD">보류</option>
            <option value="SCRAPPED">폐기</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* LOT List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-white font-medium">LOT 목록</h3>
          </div>
          <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto">
            {filteredLots.map((lot) => (
              <div
                key={lot.lotNo}
                className={`p-4 cursor-pointer hover:bg-slate-700/50 ${
                  selectedLot?.lotNo === lot.lotNo ? 'bg-slate-700/50 border-l-2 border-cyan-400' : ''
                }`}
                onClick={() => setSelectedLot(lot)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-cyan-400 font-medium">{lot.lotNo}</p>
                    <p className="text-white text-sm mt-1">{lot.productName}</p>
                    <p className="text-xs text-slate-400 mt-1">{lot.workOrderNo}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs text-white ${statusConfig[lot.status].color}`}>
                    {statusConfig[lot.status].label}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <Package className="h-3 w-3" />
                  {lot.quantity}EA
                  <span className="mx-1">•</span>
                  <Factory className="h-3 w-3" />
                  {lot.currentLocation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LOT Detail */}
        {selectedLot && (
          <div className="col-span-2 space-y-6">
            {/* LOT Info */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{selectedLot.lotNo}</h3>
                <span className={`px-3 py-1 rounded text-sm text-white ${statusConfig[selectedLot.status].color}`}>
                  {statusConfig[selectedLot.status].label}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400">제품</p>
                  <p className="text-white">{selectedLot.productName}</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400">작업지시</p>
                  <p className="text-cyan-400">{selectedLot.workOrderNo}</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400">수량</p>
                  <p className="text-white font-bold">{selectedLot.quantity} EA</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400">현재위치</p>
                  <p className="text-emerald-400">{selectedLot.currentLocation}</p>
                </div>
              </div>
            </div>

            {/* Materials */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-cyan-400" />
                투입 자재 (Forward Traceability)
              </h4>
              <div className="space-y-2">
                {selectedLot.materials.map((mat, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-900 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                        <Package className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white">{mat.materialName}</p>
                        <p className="text-xs text-slate-400">{mat.materialCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-cyan-400 font-medium">{mat.lotNo}</p>
                      <p className="text-xs text-slate-400">{mat.quantity.toLocaleString()} EA</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* History Timeline */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-400" />
                LOT 이력 (Backward Traceability)
              </h4>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />
                <div className="space-y-4">
                  {selectedLot.history.map((item, idx) => (
                    <div key={idx} className="relative pl-10">
                      <div className={`absolute left-2.5 w-3 h-3 rounded-full ${historyStatusConfig[item.status].bgColor}`} />
                      <div className="bg-slate-900 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${historyStatusConfig[item.status].color}`}>
                              {item.event}
                            </span>
                            {item.status === 'PASS' && <CheckCircle className="h-4 w-4 text-green-400" />}
                            {item.status === 'FAIL' && <AlertTriangle className="h-4 w-4 text-red-400" />}
                          </div>
                          <span className="text-xs text-slate-400">{item.timestamp}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Factory className="h-3 w-3" />
                            {item.location}
                          </span>
                          <span>작업자: {item.operator}</span>
                          <span>수량: {item.quantity} EA</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
