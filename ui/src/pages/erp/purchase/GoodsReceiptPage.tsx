import { useState } from 'react';
import { Search, RefreshCw, Plus, CheckCircle, XCircle, Package, FileText, AlertTriangle } from 'lucide-react';

interface ReceiptItem {
  lineNo: number;
  itemCode: string;
  itemName: string;
  spec: string;
  orderQty: number;
  receivedQty: number;
  thisReceiptQty: number;
  unit: string;
  unitPrice: number;
  amount: number;
  warehouse: string;
  location: string;
  inspectionStatus: 'PENDING' | 'PASSED' | 'FAILED';
}

interface GoodsReceipt {
  receiptNo: string;
  receiptDate: string;
  poNo: string;
  vendorCode: string;
  vendorName: string;
  totalAmount: number;
  status: 'DRAFT' | 'INSPECTING' | 'COMPLETED' | 'REJECTED';
  inspector: string;
  remark: string;
  items: ReceiptItem[];
}

// 샘플 입고 데이터
const mockReceipts: GoodsReceipt[] = [
  {
    receiptNo: 'GR-2024-001',
    receiptDate: '2024-01-20',
    poNo: 'PO-2024-001',
    vendorCode: 'V-001',
    vendorName: '(주)삼화전자',
    totalAmount: 12000000,
    status: 'COMPLETED',
    inspector: '박검수',
    remark: '정상 입고',
    items: [
      { lineNo: 1, itemCode: 'RM-PCB-001', itemName: 'PCB 기판 (4층)', spec: '100×80mm, FR-4', orderQty: 10000, receivedQty: 0, thisReceiptQty: 8000, unit: 'EA', unitPrice: 1500, amount: 12000000, warehouse: '원자재창고', location: 'A-01-01', inspectionStatus: 'PASSED' },
    ]
  },
  {
    receiptNo: 'GR-2024-002',
    receiptDate: '2024-01-22',
    poNo: 'PO-2024-001',
    vendorCode: 'V-001',
    vendorName: '(주)삼화전자',
    totalAmount: 16000000,
    status: 'COMPLETED',
    inspector: '김검수',
    remark: '',
    items: [
      { lineNo: 1, itemCode: 'RM-PCB-002', itemName: 'PCB 기판 (2층)', spec: '60×40mm, FR-4', orderQty: 20000, receivedQty: 0, thisReceiptQty: 20000, unit: 'EA', unitPrice: 800, amount: 16000000, warehouse: '원자재창고', location: 'A-01-02', inspectionStatus: 'PASSED' },
    ]
  },
  {
    receiptNo: 'GR-2024-003',
    receiptDate: '2024-01-25',
    poNo: 'PO-2024-003',
    vendorCode: 'V-003',
    vendorName: '(주)코리아부품',
    totalAmount: 2250000,
    status: 'INSPECTING',
    inspector: '박검수',
    remark: '수입검사 진행중',
    items: [
      { lineNo: 1, itemCode: 'RM-CAP-001', itemName: '적층세라믹콘덴서', spec: '0603, 100nF', orderQty: 100000, receivedQty: 0, thisReceiptQty: 100000, unit: 'EA', unitPrice: 15, amount: 1500000, warehouse: '원자재창고', location: 'A-03-02', inspectionStatus: 'PENDING' },
      { lineNo: 2, itemCode: 'RM-RES-001', itemName: '칩저항', spec: '0402, 10KΩ', orderQty: 150000, receivedQty: 0, thisReceiptQty: 150000, unit: 'EA', unitPrice: 5, amount: 750000, warehouse: '원자재창고', location: 'A-03-05', inspectionStatus: 'PENDING' },
    ]
  },
  {
    receiptNo: 'GR-2024-004',
    receiptDate: '2024-01-26',
    poNo: 'PO-2024-003',
    vendorCode: 'V-003',
    vendorName: '(주)코리아부품',
    totalAmount: 10500000,
    status: 'COMPLETED',
    inspector: '이검수',
    remark: '',
    items: [
      { lineNo: 1, itemCode: 'RM-CAP-002', itemName: '전해콘덴서', spec: '470uF/25V', orderQty: 30000, receivedQty: 0, thisReceiptQty: 30000, unit: 'EA', unitPrice: 350, amount: 10500000, warehouse: '원자재창고', location: 'A-03-08', inspectionStatus: 'PASSED' },
    ]
  },
  {
    receiptNo: 'GR-2024-005',
    receiptDate: '2024-01-28',
    poNo: 'PO-2024-002',
    vendorCode: 'V-002',
    vendorName: '반도체월드(주)',
    totalAmount: 5500000,
    status: 'REJECTED',
    inspector: '박검수',
    remark: '불량 발견 - 반품 처리',
    items: [
      { lineNo: 1, itemCode: 'RM-IC-001', itemName: 'MCU IC (ARM Cortex)', spec: 'STM32F4, LQFP64', orderQty: 5000, receivedQty: 0, thisReceiptQty: 1000, unit: 'EA', unitPrice: 5500, amount: 5500000, warehouse: '원자재창고', location: 'A-02-03', inspectionStatus: 'FAILED' },
    ]
  },
];

export default function GoodsReceiptPage() {
  const [receipts] = useState<GoodsReceipt[]>(mockReceipts);
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    vendor: '',
    dateFrom: '',
    dateTo: '',
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-500/20 text-slate-400';
      case 'INSPECTING': return 'bg-yellow-500/20 text-yellow-400';
      case 'COMPLETED': return 'bg-green-500/20 text-green-400';
      case 'REJECTED': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return '작성중';
      case 'INSPECTING': return '검사중';
      case 'COMPLETED': return '입고완료';
      case 'REJECTED': return '반품';
      default: return status;
    }
  };

  const getInspectionStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-slate-500/20 text-slate-400';
      case 'PASSED': return 'bg-green-500/20 text-green-400';
      case 'FAILED': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
  };

  const filteredReceipts = receipts.filter(receipt => {
    if (filters.status && receipt.status !== filters.status) return false;
    if (filters.vendor && !receipt.vendorName.includes(filters.vendor)) return false;
    return true;
  });

  // 요약 통계
  const stats = {
    totalReceipts: receipts.length,
    totalAmount: receipts.filter(r => r.status === 'COMPLETED').reduce((sum, r) => sum + r.totalAmount, 0),
    inspectingCount: receipts.filter(r => r.status === 'INSPECTING').length,
    rejectedCount: receipts.filter(r => r.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">입고관리</h1>
          <p className="text-slate-400 text-sm mt-1">발주에 대한 입고를 등록하고 검사 결과를 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
            <FileText size={18} />
            입고현황
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
            <Plus size={18} />
            입고등록
          </button>
        </div>
      </div>

      {/* 검색 조건 */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">상태</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="">전체</option>
              <option value="DRAFT">작성중</option>
              <option value="INSPECTING">검사중</option>
              <option value="COMPLETED">입고완료</option>
              <option value="REJECTED">반품</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">공급업체</label>
            <input
              type="text"
              placeholder="업체명 검색..."
              value={filters.vendor}
              onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">입고일(From)</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">입고일(To)</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => setFilters({ status: '', vendor: '', dateFrom: '', dateTo: '' })}
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
              <p className="text-slate-400 text-sm">전체 입고</p>
              <p className="text-2xl font-bold text-white">{stats.totalReceipts}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">입고 금액</p>
              <p className="text-2xl font-bold text-green-400">{(stats.totalAmount / 10000000).toFixed(1)}천만</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-yellow-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">검사 진행</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.inspectingCount}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <XCircle className="text-red-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">반품</p>
              <p className="text-2xl font-bold text-red-400">{stats.rejectedCount}건</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* 입고 목록 */}
        <div className="col-span-2 bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">입고 목록</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 text-left text-sm text-slate-400">
                  <th className="p-3">입고번호</th>
                  <th className="p-3">입고일</th>
                  <th className="p-3">발주번호</th>
                  <th className="p-3">공급업체</th>
                  <th className="p-3 text-right">금액</th>
                  <th className="p-3">상태</th>
                  <th className="p-3">검수자</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.map((receipt) => (
                  <tr
                    key={receipt.receiptNo}
                    onClick={() => setSelectedReceipt(receipt)}
                    className={`border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer ${
                      selectedReceipt?.receiptNo === receipt.receiptNo ? 'bg-blue-900/20' : ''
                    }`}
                  >
                    <td className="p-3">
                      <span className="text-blue-400 font-mono">{receipt.receiptNo}</span>
                    </td>
                    <td className="p-3 text-white">{receipt.receiptDate}</td>
                    <td className="p-3 text-slate-300">{receipt.poNo}</td>
                    <td className="p-3 text-white">{receipt.vendorName}</td>
                    <td className="p-3 text-right text-cyan-400">{formatCurrency(receipt.totalAmount)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(receipt.status)}`}>
                        {getStatusText(receipt.status)}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{receipt.inspector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 입고 상세 */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">입고 상세</h3>
          </div>
          {selectedReceipt ? (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">입고번호</p>
                  <p className="text-blue-400 font-mono">{selectedReceipt.receiptNo}</p>
                </div>
                <div>
                  <p className="text-slate-400">입고일</p>
                  <p className="text-white">{selectedReceipt.receiptDate}</p>
                </div>
                <div>
                  <p className="text-slate-400">발주번호</p>
                  <p className="text-white">{selectedReceipt.poNo}</p>
                </div>
                <div>
                  <p className="text-slate-400">상태</p>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(selectedReceipt.status)}`}>
                    {getStatusText(selectedReceipt.status)}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400">공급업체</p>
                  <p className="text-white">{selectedReceipt.vendorName}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400">비고</p>
                  <p className="text-white">{selectedReceipt.remark || '-'}</p>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">입고 품목</h4>
                <div className="space-y-2">
                  {selectedReceipt.items.map((item) => (
                    <div key={item.lineNo} className="bg-slate-900 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-blue-400 font-mono text-sm">{item.itemCode}</p>
                          <p className="text-white">{item.itemName}</p>
                          <p className="text-slate-400 text-xs">{item.spec}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs ${getInspectionStyle(item.inspectionStatus)}`}>
                          {item.inspectionStatus === 'PENDING' ? '검사대기' : item.inspectionStatus === 'PASSED' ? '합격' : '불합격'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                        <div>
                          <p className="text-slate-400">입고수량</p>
                          <p className="text-white">{item.thisReceiptQty.toLocaleString()} {item.unit}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">창고</p>
                          <p className="text-white">{item.warehouse}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">위치</p>
                          <p className="text-white">{item.location}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {selectedReceipt.status === 'INSPECTING' && (
                  <>
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500">
                      <CheckCircle size={18} />
                      검사완료
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500">
                      <XCircle size={18} />
                      반품처리
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>좌측에서 입고 건을 선택하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
