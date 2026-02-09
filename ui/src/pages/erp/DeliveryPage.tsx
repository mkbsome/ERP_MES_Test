import { useState } from 'react';
import { Truck, Search, Plus, Filter, Package, CheckCircle2, Clock, AlertTriangle, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DeliveryItem {
  itemCode: string;
  itemName: string;
  orderQty: number;
  deliveryQty: number;
  unit: string;
}

interface Delivery {
  id: string;
  deliveryNo: string;
  salesOrderNo: string;
  customerCode: string;
  customerName: string;
  deliveryDate: string;
  requestDate: string;
  status: 'scheduled' | 'preparing' | 'shipped' | 'delivered' | 'partial';
  warehouseCode: string;
  warehouseName: string;
  totalAmount: number;
  items: DeliveryItem[];
  trackingNo?: string;
  carrier?: string;
}

const mockDeliveries: Delivery[] = [
  {
    id: '1',
    deliveryNo: 'DL-2024-0001',
    salesOrderNo: 'SO-2024-0001',
    customerCode: 'C001',
    customerName: '삼성전자',
    deliveryDate: '2024-01-20',
    requestDate: '2024-01-20',
    status: 'delivered',
    warehouseCode: 'WH-FIN01',
    warehouseName: '완제품 창고',
    totalAmount: 125000000,
    trackingNo: 'KR1234567890',
    carrier: 'CJ대한통운',
    items: [
      { itemCode: 'SMB-A01', itemName: '스마트폰 메인보드 A', orderQty: 1000, deliveryQty: 1000, unit: 'EA' },
    ],
  },
  {
    id: '2',
    deliveryNo: 'DL-2024-0002',
    salesOrderNo: 'SO-2024-0002',
    customerCode: 'C002',
    customerName: 'LG전자',
    deliveryDate: '2024-01-22',
    requestDate: '2024-01-22',
    status: 'shipped',
    warehouseCode: 'WH-FIN01',
    warehouseName: '완제품 창고',
    totalAmount: 45000000,
    trackingNo: 'KR9876543210',
    carrier: '한진택배',
    items: [
      { itemCode: 'PWB-A01', itemName: '전원보드 A', orderQty: 500, deliveryQty: 500, unit: 'EA' },
    ],
  },
  {
    id: '3',
    deliveryNo: 'DL-2024-0003',
    salesOrderNo: 'SO-2024-0003',
    customerCode: 'C003',
    customerName: '현대모비스',
    deliveryDate: '2024-01-25',
    requestDate: '2024-01-25',
    status: 'preparing',
    warehouseCode: 'WH-FIN01',
    warehouseName: '완제품 창고',
    totalAmount: 280000000,
    items: [
      { itemCode: 'ECU-A01', itemName: '자동차 ECU', orderQty: 2000, deliveryQty: 0, unit: 'EA' },
    ],
  },
  {
    id: '4',
    deliveryNo: 'DL-2024-0004',
    salesOrderNo: 'SO-2024-0004',
    customerCode: 'C004',
    customerName: 'SK하이닉스',
    deliveryDate: '2024-01-28',
    requestDate: '2024-01-28',
    status: 'scheduled',
    warehouseCode: 'WH-FIN01',
    warehouseName: '완제품 창고',
    totalAmount: 68000000,
    items: [
      { itemCode: 'LED-D01', itemName: 'LED 드라이버', orderQty: 3000, deliveryQty: 0, unit: 'EA' },
    ],
  },
  {
    id: '5',
    deliveryNo: 'DL-2024-0005',
    salesOrderNo: 'SO-2024-0005',
    customerCode: 'C005',
    customerName: '삼성SDI',
    deliveryDate: '2024-01-23',
    requestDate: '2024-01-23',
    status: 'partial',
    warehouseCode: 'WH-FIN01',
    warehouseName: '완제품 창고',
    totalAmount: 35000000,
    trackingNo: 'KR5555555555',
    carrier: '롯데택배',
    items: [
      { itemCode: 'IOT-M01', itemName: 'IoT 모듈', orderQty: 1000, deliveryQty: 700, unit: 'EA' },
    ],
  },
];

const chartData = [
  { date: '01/15', scheduled: 3, shipped: 5, delivered: 8 },
  { date: '01/16', scheduled: 4, shipped: 3, delivered: 6 },
  { date: '01/17', scheduled: 2, shipped: 6, delivered: 7 },
  { date: '01/18', scheduled: 5, shipped: 4, delivered: 5 },
  { date: '01/19', scheduled: 3, shipped: 5, delivered: 9 },
  { date: '01/20', scheduled: 4, shipped: 3, delivered: 6 },
];

export default function DeliveryPage() {
  const [deliveries] = useState<Delivery[]>(mockDeliveries);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.deliveryNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.customerName.includes(searchTerm) ||
                         delivery.salesOrderNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || delivery.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Delivery['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'preparing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'shipped': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'partial': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    }
  };

  const getStatusText = (status: Delivery['status']) => {
    switch (status) {
      case 'scheduled': return '예정';
      case 'preparing': return '준비중';
      case 'shipped': return '출하완료';
      case 'delivered': return '배송완료';
      case 'partial': return '부분출하';
    }
  };

  const getStatusIcon = (status: Delivery['status']) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'preparing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle2 className="w-4 h-4" />;
      case 'partial': return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const stats = {
    total: deliveries.length,
    scheduled: deliveries.filter(d => d.status === 'scheduled').length,
    preparing: deliveries.filter(d => d.status === 'preparing').length,
    shipped: deliveries.filter(d => d.status === 'shipped').length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">출하 관리</h1>
          <p className="text-slate-400 text-sm mt-1">제품 출하 및 배송 현황 관리</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          출하 등록
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">전체 출하</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">예정</p>
          <p className="text-2xl font-bold text-slate-400 mt-1">{stats.scheduled}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">준비중</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.preparing}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">출하완료</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.shipped}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">배송완료</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.delivered}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="출하번호, 고객사, 수주번호로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
              />
            </div>
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">전체 상태</option>
              <option value="scheduled">예정</option>
              <option value="preparing">준비중</option>
              <option value="shipped">출하완료</option>
              <option value="delivered">배송완료</option>
              <option value="partial">부분출하</option>
            </select>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">출하번호</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">고객사</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">출하일</th>
                  <th className="text-right text-slate-400 font-medium px-4 py-3 text-sm">금액</th>
                  <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredDeliveries.map((delivery) => (
                  <tr
                    key={delivery.id}
                    onClick={() => setSelectedDelivery(delivery)}
                    className={`hover:bg-slate-700/30 cursor-pointer ${selectedDelivery?.id === delivery.id ? 'bg-slate-700/50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-mono text-sm">{delivery.deliveryNo}</p>
                      <p className="text-slate-500 text-xs">{delivery.salesOrderNo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{delivery.customerName}</p>
                      <p className="text-slate-500 text-xs">{delivery.customerCode}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{delivery.deliveryDate}</td>
                    <td className="px-4 py-3 text-right text-white text-sm">
                      ₩{delivery.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getStatusColor(delivery.status)}`}>
                        {getStatusIcon(delivery.status)}
                        {getStatusText(delivery.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-1 space-y-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h3 className="text-white font-bold mb-4">일별 출하 현황</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Bar dataKey="delivered" fill="#22c55e" name="배송완료" stackId="a" />
                  <Bar dataKey="shipped" fill="#3b82f6" name="출하" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {selectedDelivery && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">출하 상세</h3>
                <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded">
                  <FileText className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-xs">출하번호</p>
                  <p className="text-white font-mono">{selectedDelivery.deliveryNo}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">고객사</p>
                  <p className="text-white">{selectedDelivery.customerName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">출고창고</p>
                  <p className="text-white">{selectedDelivery.warehouseName}</p>
                </div>
                {selectedDelivery.trackingNo && (
                  <div>
                    <p className="text-slate-400 text-xs">운송장번호</p>
                    <p className="text-white font-mono">{selectedDelivery.trackingNo}</p>
                    <p className="text-slate-500 text-xs">{selectedDelivery.carrier}</p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-700">
                  <p className="text-slate-400 text-xs mb-2">출하품목</p>
                  {selectedDelivery.items.map((item, idx) => (
                    <div key={idx} className="p-2 bg-slate-700/30 rounded mb-1">
                      <p className="text-white text-sm">{item.itemName}</p>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-slate-400">{item.itemCode}</span>
                        <span className="text-slate-300">
                          {item.deliveryQty.toLocaleString()} / {item.orderQty.toLocaleString()} {item.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">총 금액</span>
                    <span className="text-white font-bold">₩{selectedDelivery.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
