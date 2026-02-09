import { useState } from 'react';
import { Search, RefreshCw, Plus, Trash2, Edit, FileText, ChevronDown, ChevronUp, Package, CheckCircle } from 'lucide-react';

interface OrderItem {
  lineNo: number;
  itemCode: string;
  itemName: string;
  spec: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  deliveryDate: string;
  receivedQty: number;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED';
}

interface PurchaseOrder {
  orderNo: string;
  orderDate: string;
  vendorCode: string;
  vendorName: string;
  deliveryDate: string;
  totalAmount: number;
  currency: string;
  status: 'DRAFT' | 'APPROVED' | 'ORDERED' | 'PARTIAL_RECEIVED' | 'COMPLETED' | 'CANCELLED';
  paymentTerms: string;
  manager: string;
  remark: string;
  items: OrderItem[];
}

// 샘플 발주 데이터
const mockOrders: PurchaseOrder[] = [
  {
    orderNo: 'PO-2024-001',
    orderDate: '2024-01-10',
    vendorCode: 'V-001',
    vendorName: '(주)삼화전자',
    deliveryDate: '2024-01-25',
    totalAmount: 45000000,
    currency: 'KRW',
    status: 'PARTIAL_RECEIVED',
    paymentTerms: '월말 마감 익월 10일',
    manager: '이구매',
    remark: '긴급 발주',
    items: [
      { lineNo: 1, itemCode: 'RM-PCB-001', itemName: 'PCB 기판 (4층)', spec: '100×80mm, FR-4', quantity: 10000, unit: 'EA', unitPrice: 1500, amount: 15000000, deliveryDate: '2024-01-20', receivedQty: 8000, status: 'PARTIAL' },
      { lineNo: 2, itemCode: 'RM-PCB-002', itemName: 'PCB 기판 (2층)', spec: '60×40mm, FR-4', quantity: 20000, unit: 'EA', unitPrice: 800, amount: 16000000, deliveryDate: '2024-01-25', receivedQty: 20000, status: 'COMPLETED' },
      { lineNo: 3, itemCode: 'RM-COP-001', itemName: '동박', spec: '35um', quantity: 500, unit: 'M2', unitPrice: 28000, amount: 14000000, deliveryDate: '2024-01-25', receivedQty: 0, status: 'PENDING' },
    ]
  },
  {
    orderNo: 'PO-2024-002',
    orderDate: '2024-01-12',
    vendorCode: 'V-002',
    vendorName: '반도체월드(주)',
    deliveryDate: '2024-02-05',
    totalAmount: 82500000,
    currency: 'KRW',
    status: 'ORDERED',
    paymentTerms: '선급금 30%, 잔금 입고 후',
    manager: '김구매',
    remark: '',
    items: [
      { lineNo: 1, itemCode: 'RM-IC-001', itemName: 'MCU IC (ARM Cortex)', spec: 'STM32F4, LQFP64', quantity: 5000, unit: 'EA', unitPrice: 5500, amount: 27500000, deliveryDate: '2024-02-01', receivedQty: 0, status: 'PENDING' },
      { lineNo: 2, itemCode: 'RM-IC-002', itemName: 'LED 드라이버 IC', spec: 'MP3302', quantity: 10000, unit: 'EA', unitPrice: 3500, amount: 35000000, deliveryDate: '2024-02-05', receivedQty: 0, status: 'PENDING' },
      { lineNo: 3, itemCode: 'RM-TR-001', itemName: '트랜지스터', spec: '2N2222A', quantity: 20000, unit: 'EA', unitPrice: 1000, amount: 20000000, deliveryDate: '2024-02-05', receivedQty: 0, status: 'PENDING' },
    ]
  },
  {
    orderNo: 'PO-2024-003',
    orderDate: '2024-01-15',
    vendorCode: 'V-003',
    vendorName: '(주)코리아부품',
    deliveryDate: '2024-01-30',
    totalAmount: 12750000,
    currency: 'KRW',
    status: 'COMPLETED',
    paymentTerms: '월말 마감 익월 말',
    manager: '박구매',
    remark: '정기 발주',
    items: [
      { lineNo: 1, itemCode: 'RM-CAP-001', itemName: '적층세라믹콘덴서', spec: '0603, 100nF', quantity: 100000, unit: 'EA', unitPrice: 15, amount: 1500000, deliveryDate: '2024-01-28', receivedQty: 100000, status: 'COMPLETED' },
      { lineNo: 2, itemCode: 'RM-RES-001', itemName: '칩저항', spec: '0402, 10KΩ', quantity: 150000, unit: 'EA', unitPrice: 5, amount: 750000, deliveryDate: '2024-01-28', receivedQty: 150000, status: 'COMPLETED' },
      { lineNo: 3, itemCode: 'RM-CAP-002', itemName: '전해콘덴서', spec: '470uF/25V', quantity: 30000, unit: 'EA', unitPrice: 350, amount: 10500000, deliveryDate: '2024-01-30', receivedQty: 30000, status: 'COMPLETED' },
    ]
  },
  {
    orderNo: 'PO-2024-004',
    orderDate: '2024-01-18',
    vendorCode: 'V-004',
    vendorName: '글로벌커넥터(주)',
    deliveryDate: '2024-02-10',
    totalAmount: 28900000,
    currency: 'KRW',
    status: 'APPROVED',
    paymentTerms: '입고 후 30일',
    manager: '이구매',
    remark: '신규 프로젝트용',
    items: [
      { lineNo: 1, itemCode: 'RM-CON-001', itemName: 'USB-C 커넥터', spec: 'Type-C, 24Pin', quantity: 15000, unit: 'EA', unitPrice: 850, amount: 12750000, deliveryDate: '2024-02-05', receivedQty: 0, status: 'PENDING' },
      { lineNo: 2, itemCode: 'RM-CON-002', itemName: 'FPC 커넥터', spec: '30Pin, 0.5mm', quantity: 20000, unit: 'EA', unitPrice: 450, amount: 9000000, deliveryDate: '2024-02-08', receivedQty: 0, status: 'PENDING' },
      { lineNo: 3, itemCode: 'RM-CON-003', itemName: 'Board to Board', spec: '60Pin', quantity: 10000, unit: 'EA', unitPrice: 715, amount: 7150000, deliveryDate: '2024-02-10', receivedQty: 0, status: 'PENDING' },
    ]
  },
  {
    orderNo: 'PO-2024-005',
    orderDate: '2024-01-20',
    vendorCode: 'V-005',
    vendorName: '케미칼코리아',
    deliveryDate: '2024-02-01',
    totalAmount: 8500000,
    currency: 'KRW',
    status: 'DRAFT',
    paymentTerms: '선급금 100%',
    manager: '김구매',
    remark: '견적 검토 중',
    items: [
      { lineNo: 1, itemCode: 'RM-SOL-001', itemName: '솔더페이스트', spec: 'Sn63/Pb37', quantity: 50, unit: 'KG', unitPrice: 85000, amount: 4250000, deliveryDate: '2024-02-01', receivedQty: 0, status: 'PENDING' },
      { lineNo: 2, itemCode: 'RM-FLX-001', itemName: '플럭스', spec: 'No-Clean', quantity: 100, unit: 'L', unitPrice: 42500, amount: 4250000, deliveryDate: '2024-02-01', receivedQty: 0, status: 'PENDING' },
    ]
  },
];

export default function PurchaseOrderPage() {
  const [orders] = useState<PurchaseOrder[]>(mockOrders);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    vendor: '',
    dateFrom: '',
    dateTo: '',
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-500/20 text-slate-400';
      case 'APPROVED': return 'bg-blue-500/20 text-blue-400';
      case 'ORDERED': return 'bg-cyan-500/20 text-cyan-400';
      case 'PARTIAL_RECEIVED': return 'bg-yellow-500/20 text-yellow-400';
      case 'COMPLETED': return 'bg-green-500/20 text-green-400';
      case 'CANCELLED': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return '작성중';
      case 'APPROVED': return '승인완료';
      case 'ORDERED': return '발주완료';
      case 'PARTIAL_RECEIVED': return '일부입고';
      case 'COMPLETED': return '입고완료';
      case 'CANCELLED': return '취소';
      default: return status;
    }
  };

  const getItemStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-slate-500/20 text-slate-400';
      case 'PARTIAL': return 'bg-yellow-500/20 text-yellow-400';
      case 'COMPLETED': return 'bg-green-500/20 text-green-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
  };

  const filteredOrders = orders.filter(order => {
    if (filters.status && order.status !== filters.status) return false;
    if (filters.vendor && !order.vendorName.includes(filters.vendor)) return false;
    return true;
  });

  // 요약 통계
  const stats = {
    totalOrders: orders.length,
    totalAmount: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    pendingOrders: orders.filter(o => o.status === 'APPROVED' || o.status === 'ORDERED').length,
    receivingOrders: orders.filter(o => o.status === 'PARTIAL_RECEIVED').length,
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">발주관리</h1>
          <p className="text-slate-400 text-sm mt-1">공급업체에 대한 발주를 등록하고 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
            <Trash2 size={18} />
            삭제
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
            <Edit size={18} />
            수정
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
            <Plus size={18} />
            신규등록
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
              <option value="APPROVED">승인완료</option>
              <option value="ORDERED">발주완료</option>
              <option value="PARTIAL_RECEIVED">일부입고</option>
              <option value="COMPLETED">입고완료</option>
              <option value="CANCELLED">취소</option>
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
            <label className="block text-sm text-slate-400 mb-1">발주일(From)</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">발주일(To)</label>
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
          <p className="text-slate-400 text-sm">전체 발주</p>
          <p className="text-2xl font-bold text-white">{stats.totalOrders}건</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <p className="text-slate-400 text-sm">총 발주금액</p>
          <p className="text-2xl font-bold text-cyan-400">{(stats.totalAmount / 100000000).toFixed(2)}억</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <p className="text-slate-400 text-sm">발주진행</p>
          <p className="text-2xl font-bold text-blue-400">{stats.pendingOrders}건</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <p className="text-slate-400 text-sm">입고진행</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.receivingOrders}건</p>
        </div>
      </div>

      {/* 발주 목록 */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 text-left text-sm text-slate-400">
                <th className="p-4 w-8"></th>
                <th className="p-4">발주번호</th>
                <th className="p-4">발주일</th>
                <th className="p-4">공급업체</th>
                <th className="p-4">납기일</th>
                <th className="p-4 text-right">발주금액</th>
                <th className="p-4">상태</th>
                <th className="p-4">결제조건</th>
                <th className="p-4">담당자</th>
                <th className="p-4 w-24">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <>
                  <tr
                    key={order.orderNo}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer"
                  >
                    <td className="p-4">
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.orderNo ? null : order.orderNo)}
                        className="text-slate-400 hover:text-white"
                      >
                        {expandedOrder === order.orderNo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </td>
                    <td className="p-4">
                      <span className="text-blue-400 font-mono">{order.orderNo}</span>
                    </td>
                    <td className="p-4 text-white">{order.orderDate}</td>
                    <td className="p-4 text-white">{order.vendorName}</td>
                    <td className="p-4 text-white">{order.deliveryDate}</td>
                    <td className="p-4 text-right text-cyan-400 font-medium">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{order.paymentTerms}</td>
                    <td className="p-4 text-slate-300">{order.manager}</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded" title="상세보기">
                          <FileText size={16} />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded" title="입고처리">
                          <Package size={16} />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-slate-600 rounded" title="승인">
                          <CheckCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* 품목 상세 */}
                  {expandedOrder === order.orderNo && (
                    <tr>
                      <td colSpan={10} className="bg-slate-900/50 p-0">
                        <div className="p-4">
                          <h4 className="text-sm font-medium text-slate-300 mb-3">발주 품목 내역</h4>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-slate-400 border-b border-slate-700">
                                <th className="py-2 text-left">No</th>
                                <th className="py-2 text-left">품목코드</th>
                                <th className="py-2 text-left">품목명</th>
                                <th className="py-2 text-left">규격</th>
                                <th className="py-2 text-right">수량</th>
                                <th className="py-2 text-right">단가</th>
                                <th className="py-2 text-right">금액</th>
                                <th className="py-2 text-left">납기일</th>
                                <th className="py-2 text-right">입고량</th>
                                <th className="py-2 text-center">상태</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item) => (
                                <tr key={item.lineNo} className="border-b border-slate-700/50">
                                  <td className="py-2 text-slate-400">{item.lineNo}</td>
                                  <td className="py-2 text-blue-400 font-mono">{item.itemCode}</td>
                                  <td className="py-2 text-white">{item.itemName}</td>
                                  <td className="py-2 text-slate-400">{item.spec}</td>
                                  <td className="py-2 text-right text-white">{item.quantity.toLocaleString()} {item.unit}</td>
                                  <td className="py-2 text-right text-slate-300">{formatCurrency(item.unitPrice)}</td>
                                  <td className="py-2 text-right text-cyan-400">{formatCurrency(item.amount)}</td>
                                  <td className="py-2 text-white">{item.deliveryDate}</td>
                                  <td className="py-2 text-right text-green-400">{item.receivedQty.toLocaleString()}</td>
                                  <td className="py-2 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs ${getItemStatusStyle(item.status)}`}>
                                      {item.status === 'PENDING' ? '대기' : item.status === 'PARTIAL' ? '일부입고' : '완료'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
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

        {/* 페이징 */}
        <div className="flex justify-between items-center p-4 border-t border-slate-700">
          <span className="text-slate-400 text-sm">
            전체 {filteredOrders.length}건
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
