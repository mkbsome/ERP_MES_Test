import { useState } from 'react';
import { ClipboardList, Search, Filter, CheckCircle2, Clock, Play, Pause, AlertTriangle, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface WorkOrder {
  id: string;
  orderNo: string;
  productCode: string;
  productName: string;
  planQty: number;
  goodQty: number;
  defectQty: number;
  lineName: string;
  status: 'planned' | 'released' | 'started' | 'paused' | 'completed' | 'closed';
  planDate: string;
  startTime?: string;
  endTime?: string;
  worker?: string;
  progress: number;
}

const mockWorkOrders: WorkOrder[] = [
  { id: '1', orderNo: 'WO-2024-0001', productCode: 'FG-MB-001', productName: '스마트폰 메인보드 A', planQty: 500, goodQty: 500, defectQty: 8, lineName: 'SMT-L01', status: 'completed', planDate: '2024-01-15', startTime: '08:00', endTime: '16:30', worker: '김작업', progress: 100 },
  { id: '2', orderNo: 'WO-2024-0002', productCode: 'FG-MB-002', productName: '스마트폰 메인보드 B', planQty: 300, goodQty: 245, defectQty: 5, lineName: 'SMT-L01', status: 'started', planDate: '2024-01-15', startTime: '09:00', worker: '이작업', progress: 83 },
  { id: '3', orderNo: 'WO-2024-0003', productCode: 'FG-PB-001', productName: '전원보드 A', planQty: 400, goodQty: 0, defectQty: 0, lineName: 'SMT-L02', status: 'released', planDate: '2024-01-15', progress: 0 },
  { id: '4', orderNo: 'WO-2024-0004', productCode: 'FG-LED-001', productName: 'LED 드라이버', planQty: 600, goodQty: 150, defectQty: 3, lineName: 'SMT-L02', status: 'paused', planDate: '2024-01-15', startTime: '10:00', worker: '박작업', progress: 25 },
  { id: '5', orderNo: 'WO-2024-0005', productCode: 'FG-ECU-001', productName: '자동차 ECU', planQty: 200, goodQty: 0, defectQty: 0, lineName: 'SMT-L03', status: 'planned', planDate: '2024-01-16', progress: 0 },
  { id: '6', orderNo: 'WO-2024-0006', productCode: 'FG-MB-001', productName: '스마트폰 메인보드 A', planQty: 450, goodQty: 450, defectQty: 5, lineName: 'SMT-L01', status: 'closed', planDate: '2024-01-14', startTime: '08:00', endTime: '15:00', worker: '최작업', progress: 100 },
  { id: '7', orderNo: 'WO-2024-0007', productCode: 'FG-MB-002', productName: '스마트폰 메인보드 B', planQty: 350, goodQty: 0, defectQty: 0, lineName: 'SMT-L02', status: 'planned', planDate: '2024-01-16', progress: 0 },
];

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

export default function WorkOrderStatusPage() {
  const [workOrders] = useState<WorkOrder[]>(mockWorkOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLine, setFilterLine] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  const filteredOrders = workOrders.filter(order => {
    const matchesSearch = order.orderNo.includes(searchTerm) || order.productName.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesLine = filterLine === 'all' || order.lineName === filterLine;
    return matchesSearch && matchesStatus && matchesLine;
  });

  const getStatusColor = (status: WorkOrder['status']) => {
    switch (status) {
      case 'planned': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'released': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'started': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'closed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusText = (status: WorkOrder['status']) => {
    switch (status) {
      case 'planned': return '계획';
      case 'released': return '출고';
      case 'started': return '진행';
      case 'paused': return '중단';
      case 'completed': return '완료';
      case 'closed': return '마감';
    }
  };

  const getStatusIcon = (status: WorkOrder['status']) => {
    switch (status) {
      case 'planned': return <Clock className="w-4 h-4" />;
      case 'released': return <ClipboardList className="w-4 h-4" />;
      case 'started': return <Play className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'closed': return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const stats = {
    total: workOrders.length,
    planned: workOrders.filter(o => o.status === 'planned').length,
    inProgress: workOrders.filter(o => ['released', 'started', 'paused'].includes(o.status)).length,
    completed: workOrders.filter(o => ['completed', 'closed'].includes(o.status)).length,
  };

  const statusPieData = [
    { name: '계획', value: stats.planned, color: '#6b7280' },
    { name: '진행', value: stats.inProgress, color: '#22c55e' },
    { name: '완료', value: stats.completed, color: '#8b5cf6' },
  ];

  const lines = Array.from(new Set(workOrders.map(o => o.lineName)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">작업지시현황</h1>
          <p className="text-slate-400 text-sm mt-1">작업지시 진행 상태 및 현황 조회</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">전체</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">계획</p>
          <p className="text-2xl font-bold text-slate-400 mt-1">{stats.planned}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">진행중</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.inProgress}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">완료</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats.completed}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="작업지시번호, 제품명으로 검색..."
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
          <option value="planned">계획</option>
          <option value="released">출고</option>
          <option value="started">진행</option>
          <option value="paused">중단</option>
          <option value="completed">완료</option>
          <option value="closed">마감</option>
        </select>
        <select
          value={filterLine}
          onChange={(e) => setFilterLine(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">전체 라인</option>
          {lines.map(line => <option key={line} value={line}>{line}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-3 bg-slate-800 rounded-xl border border-slate-700">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">작업지시</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">제품</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">라인</th>
                <th className="text-right text-slate-400 font-medium px-4 py-3 text-sm">계획</th>
                <th className="text-right text-slate-400 font-medium px-4 py-3 text-sm">양품</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">진행률</th>
                <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`hover:bg-slate-700/30 cursor-pointer ${selectedOrder?.id === order.id ? 'bg-slate-700/50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <p className="text-white font-mono text-sm">{order.orderNo}</p>
                    <p className="text-slate-500 text-xs">{order.planDate}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">{order.productName}</p>
                    <p className="text-slate-500 text-xs">{order.productCode}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{order.lineName}</td>
                  <td className="px-4 py-3 text-right text-white text-sm">{order.planQty.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-green-400 text-sm">{order.goodQty.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${order.progress >= 100 ? 'bg-green-500' : order.progress > 0 ? 'bg-blue-500' : 'bg-slate-600'}`}
                          style={{ width: `${order.progress}%` }}
                        />
                      </div>
                      <span className="text-slate-400 text-xs w-10">{order.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-span-1 space-y-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h3 className="text-white font-bold mb-4">상태별 현황</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {selectedOrder && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-white font-bold mb-4">선택된 작업지시</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-xs">작업지시번호</p>
                  <p className="text-white font-mono">{selectedOrder.orderNo}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">제품</p>
                  <p className="text-white">{selectedOrder.productName}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-slate-400 text-xs">계획수량</p>
                    <p className="text-white">{selectedOrder.planQty}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">양품수량</p>
                    <p className="text-green-400">{selectedOrder.goodQty}</p>
                  </div>
                </div>
                {selectedOrder.worker && (
                  <div>
                    <p className="text-slate-400 text-xs">작업자</p>
                    <p className="text-white">{selectedOrder.worker}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
