import { useState } from 'react';
import { Search, RefreshCw, Plus, Trash2, Edit, FileText, ChevronDown, ChevronUp, Truck } from 'lucide-react';

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
  deliveredQty: number;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED';
}

interface SalesOrder {
  orderNo: string;
  orderDate: string;
  customerCode: string;
  customerName: string;
  deliveryDate: string;
  totalAmount: number;
  currency: string;
  status: 'DRAFT' | 'CONFIRMED' | 'IN_PROGRESS' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  paymentTerms: string;
  manager: string;
  remark: string;
  items: OrderItem[];
}

// 샘플 수주 데이터
const mockOrders: SalesOrder[] = [
  {
    orderNo: 'SO-2024-001',
    orderDate: '2024-01-15',
    customerCode: 'C-001',
    customerName: '삼성전자(주)',
    deliveryDate: '2024-02-15',
    totalAmount: 125000000,
    currency: 'KRW',
    status: 'IN_PROGRESS',
    paymentTerms: '납품 후 30일',
    manager: '김영업',
    remark: '2차 납품분',
    items: [
      { lineNo: 1, itemCode: 'FG-SMB-001', itemName: '스마트폰 메인보드 A1', spec: '150×70mm', quantity: 5000, unit: 'EA', unitPrice: 15000, amount: 75000000, deliveryDate: '2024-02-10', deliveredQty: 2000, status: 'PARTIAL' },
      { lineNo: 2, itemCode: 'FG-PWR-001', itemName: '전원보드 P1', spec: '80×60mm', quantity: 10000, unit: 'EA', unitPrice: 5000, amount: 50000000, deliveryDate: '2024-02-15', deliveredQty: 0, status: 'PENDING' },
    ]
  },
  {
    orderNo: 'SO-2024-002',
    orderDate: '2024-01-18',
    customerCode: 'C-002',
    customerName: '현대자동차(주)',
    deliveryDate: '2024-03-01',
    totalAmount: 280000000,
    currency: 'KRW',
    status: 'CONFIRMED',
    paymentTerms: '납품 후 45일',
    manager: '박영업',
    remark: 'ECU 신규 프로젝트',
    items: [
      { lineNo: 1, itemCode: 'FG-ECU-001', itemName: '차량 ECU A', spec: '120×100mm', quantity: 2000, unit: 'EA', unitPrice: 85000, amount: 170000000, deliveryDate: '2024-02-25', deliveredQty: 0, status: 'PENDING' },
      { lineNo: 2, itemCode: 'FG-ECU-002', itemName: '차량 ECU B', spec: '100×80mm', quantity: 2000, unit: 'EA', unitPrice: 55000, amount: 110000000, deliveryDate: '2024-03-01', deliveredQty: 0, status: 'PENDING' },
    ]
  },
  {
    orderNo: 'SO-2024-003',
    orderDate: '2024-01-20',
    customerCode: 'C-003',
    customerName: 'LG전자(주)',
    deliveryDate: '2024-02-20',
    totalAmount: 45000000,
    currency: 'KRW',
    status: 'COMPLETED',
    paymentTerms: '납품 후 30일',
    manager: '최영업',
    remark: '',
    items: [
      { lineNo: 1, itemCode: 'FG-LED-001', itemName: 'LED 드라이버 L1', spec: '50×30mm', quantity: 15000, unit: 'EA', unitPrice: 3000, amount: 45000000, deliveryDate: '2024-02-20', deliveredQty: 15000, status: 'COMPLETED' },
    ]
  },
  {
    orderNo: 'SO-2024-004',
    orderDate: '2024-01-22',
    customerCode: 'C-004',
    customerName: '(주)SK하이닉스',
    deliveryDate: '2024-02-28',
    totalAmount: 92000000,
    currency: 'KRW',
    status: 'SHIPPED',
    paymentTerms: '납품 후 30일',
    manager: '김영업',
    remark: '긴급 오더',
    items: [
      { lineNo: 1, itemCode: 'FG-MEM-001', itemName: '메모리 테스트보드', spec: '200×150mm', quantity: 400, unit: 'EA', unitPrice: 230000, amount: 92000000, deliveryDate: '2024-02-28', deliveredQty: 400, status: 'COMPLETED' },
    ]
  },
  {
    orderNo: 'SO-2024-005',
    orderDate: '2024-01-25',
    customerCode: 'C-005',
    customerName: '네이버(주)',
    deliveryDate: '2024-03-15',
    totalAmount: 38500000,
    currency: 'KRW',
    status: 'DRAFT',
    paymentTerms: '선급금 30%',
    manager: '박영업',
    remark: '견적 확정 대기',
    items: [
      { lineNo: 1, itemCode: 'FG-IOT-001', itemName: 'IoT 모듈 M1', spec: '40×25mm', quantity: 5000, unit: 'EA', unitPrice: 7700, amount: 38500000, deliveryDate: '2024-03-15', deliveredQty: 0, status: 'PENDING' },
    ]
  },
];

export default function SalesOrderPage() {
  const [orders] = useState<SalesOrder[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    customer: '',
    dateFrom: '',
    dateTo: '',
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-500/20 text-slate-400';
      case 'CONFIRMED': return 'bg-blue-500/20 text-blue-400';
      case 'IN_PROGRESS': return 'bg-yellow-500/20 text-yellow-400';
      case 'SHIPPED': return 'bg-purple-500/20 text-purple-400';
      case 'COMPLETED': return 'bg-green-500/20 text-green-400';
      case 'CANCELLED': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return '작성중';
      case 'CONFIRMED': return '확정';
      case 'IN_PROGRESS': return '진행중';
      case 'SHIPPED': return '출하완료';
      case 'COMPLETED': return '완료';
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
    if (filters.customer && !order.customerName.includes(filters.customer)) return false;
    return true;
  });

  // 요약 통계
  const stats = {
    totalOrders: orders.length,
    totalAmount: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    pendingOrders: orders.filter(o => o.status === 'CONFIRMED' || o.status === 'IN_PROGRESS').length,
    completedOrders: orders.filter(o => o.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">수주관리</h1>
          <p className="text-slate-400 text-sm mt-1">고객 주문을 등록하고 관리합니다.</p>
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
              <option value="CONFIRMED">확정</option>
              <option value="IN_PROGRESS">진행중</option>
              <option value="SHIPPED">출하완료</option>
              <option value="COMPLETED">완료</option>
              <option value="CANCELLED">취소</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">고객명</label>
            <input
              type="text"
              placeholder="고객명 검색..."
              value={filters.customer}
              onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">수주일(From)</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">수주일(To)</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => setFilters({ status: '', customer: '', dateFrom: '', dateTo: '' })}
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
          <p className="text-slate-400 text-sm">전체 수주</p>
          <p className="text-2xl font-bold text-white">{stats.totalOrders}건</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <p className="text-slate-400 text-sm">총 수주금액</p>
          <p className="text-2xl font-bold text-cyan-400">{(stats.totalAmount / 100000000).toFixed(1)}억</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <p className="text-slate-400 text-sm">진행중</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.pendingOrders}건</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <p className="text-slate-400 text-sm">완료</p>
          <p className="text-2xl font-bold text-green-400">{stats.completedOrders}건</p>
        </div>
      </div>

      {/* 수주 목록 */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 text-left text-sm text-slate-400">
                <th className="p-4 w-8"></th>
                <th className="p-4">수주번호</th>
                <th className="p-4">수주일</th>
                <th className="p-4">고객명</th>
                <th className="p-4">납기일</th>
                <th className="p-4 text-right">수주금액</th>
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
                    className={`border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer ${
                      selectedOrder?.orderNo === order.orderNo ? 'bg-blue-900/20' : ''
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="p-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedOrder(expandedOrder === order.orderNo ? null : order.orderNo);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        {expandedOrder === order.orderNo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </td>
                    <td className="p-4">
                      <span className="text-blue-400 font-mono">{order.orderNo}</span>
                    </td>
                    <td className="p-4 text-white">{order.orderDate}</td>
                    <td className="p-4 text-white">{order.customerName}</td>
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
                        <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded">
                          <FileText size={16} />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded">
                          <Truck size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* 품목 상세 */}
                  {expandedOrder === order.orderNo && (
                    <tr>
                      <td colSpan={10} className="bg-slate-900/50 p-0">
                        <div className="p-4">
                          <h4 className="text-sm font-medium text-slate-300 mb-3">수주 품목 내역</h4>
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
                                <th className="py-2 text-right">출하량</th>
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
                                  <td className="py-2 text-right text-green-400">{item.deliveredQty.toLocaleString()}</td>
                                  <td className="py-2 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs ${getItemStatusStyle(item.status)}`}>
                                      {item.status === 'PENDING' ? '대기' : item.status === 'PARTIAL' ? '일부출하' : '완료'}
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
            <button className="px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded">2</button>
            <button className="px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded">다음</button>
          </div>
        </div>
      </div>
    </div>
  );
}
