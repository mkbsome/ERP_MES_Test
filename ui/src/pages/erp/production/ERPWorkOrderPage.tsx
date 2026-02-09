import { useState } from 'react';
import {
  Factory,
  Search,
  RefreshCw,
  Plus,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Calendar,
  Package,
  Users,
} from 'lucide-react';

interface WorkOrderItem {
  itemCode: string;
  itemName: string;
  requiredQty: number;
  issuedQty: number;
  unit: string;
}

interface WorkOrder {
  workOrderNo: string;
  orderDate: string;
  productCode: string;
  productName: string;
  orderQty: number;
  completedQty: number;
  unit: string;
  startDate: string;
  endDate: string;
  lineCode: string;
  lineName: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PLANNED' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  salesOrderNo?: string;
  items: WorkOrderItem[];
}

const mockWorkOrders: WorkOrder[] = [
  {
    workOrderNo: 'WO-2024-0201',
    orderDate: '2024-02-01',
    productCode: 'FG-SMB-001',
    productName: '스마트폰 메인보드 A1',
    orderQty: 1000,
    completedQty: 650,
    unit: 'EA',
    startDate: '2024-02-01',
    endDate: '2024-02-05',
    lineCode: 'SMT-L01',
    lineName: 'SMT 1라인',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    salesOrderNo: 'SO-2024-0150',
    items: [
      { itemCode: 'RM-PCB-001', itemName: 'PCB 기판 (4층)', requiredQty: 1000, issuedQty: 1000, unit: 'EA' },
      { itemCode: 'RM-IC-001', itemName: 'MCU IC (ARM Cortex)', requiredQty: 1000, issuedQty: 800, unit: 'EA' },
      { itemCode: 'RM-CAP-001', itemName: '적층세라믹콘덴서', requiredQty: 45000, issuedQty: 45000, unit: 'EA' },
    ],
  },
  {
    workOrderNo: 'WO-2024-0202',
    orderDate: '2024-02-01',
    productCode: 'FG-PWR-001',
    productName: '전원보드 P1',
    orderQty: 500,
    completedQty: 0,
    unit: 'EA',
    startDate: '2024-02-03',
    endDate: '2024-02-06',
    lineCode: 'SMT-L02',
    lineName: 'SMT 2라인',
    priority: 'MEDIUM',
    status: 'RELEASED',
    salesOrderNo: 'SO-2024-0148',
    items: [
      { itemCode: 'RM-PCB-002', itemName: 'PCB 기판 (2층)', requiredQty: 500, issuedQty: 0, unit: 'EA' },
      { itemCode: 'RM-TR-001', itemName: '전원 트랜스포머', requiredQty: 500, issuedQty: 0, unit: 'EA' },
    ],
  },
  {
    workOrderNo: 'WO-2024-0203',
    orderDate: '2024-02-02',
    productCode: 'FG-LED-001',
    productName: 'LED 드라이버 L1',
    orderQty: 2000,
    completedQty: 2000,
    unit: 'EA',
    startDate: '2024-01-28',
    endDate: '2024-02-01',
    lineCode: 'SMT-L03',
    lineName: 'SMT 3라인',
    priority: 'LOW',
    status: 'COMPLETED',
    items: [
      { itemCode: 'RM-PCB-003', itemName: 'PCB 기판 (단면)', requiredQty: 2000, issuedQty: 2000, unit: 'EA' },
      { itemCode: 'RM-LED-001', itemName: 'LED 칩', requiredQty: 8000, issuedQty: 8000, unit: 'EA' },
    ],
  },
  {
    workOrderNo: 'WO-2024-0204',
    orderDate: '2024-02-02',
    productCode: 'FG-ECU-001',
    productName: '차량 ECU A',
    orderQty: 300,
    completedQty: 0,
    unit: 'EA',
    startDate: '2024-02-05',
    endDate: '2024-02-10',
    lineCode: 'SMT-L01',
    lineName: 'SMT 1라인',
    priority: 'HIGH',
    status: 'PLANNED',
    salesOrderNo: 'SO-2024-0155',
    items: [
      { itemCode: 'RM-PCB-004', itemName: 'PCB 기판 (6층)', requiredQty: 300, issuedQty: 0, unit: 'EA' },
      { itemCode: 'RM-IC-002', itemName: '차량용 MCU', requiredQty: 300, issuedQty: 0, unit: 'EA' },
      { itemCode: 'RM-CON-002', itemName: '차량용 커넥터', requiredQty: 600, issuedQty: 0, unit: 'EA' },
    ],
  },
  {
    workOrderNo: 'WO-2024-0205',
    orderDate: '2024-02-03',
    productCode: 'FG-IOT-001',
    productName: 'IoT 모듈 M1',
    orderQty: 1500,
    completedQty: 500,
    unit: 'EA',
    startDate: '2024-02-02',
    endDate: '2024-02-07',
    lineCode: 'SMT-L04',
    lineName: 'SMT 4라인',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    items: [
      { itemCode: 'RM-PCB-005', itemName: 'PCB 기판 (양면)', requiredQty: 1500, issuedQty: 1500, unit: 'EA' },
      { itemCode: 'RM-WIFI-001', itemName: 'WiFi 모듈', requiredQty: 1500, issuedQty: 1000, unit: 'EA' },
    ],
  },
];

const statusConfig = {
  PLANNED: { label: '계획', color: 'bg-slate-500', icon: Clock },
  RELEASED: { label: '확정', color: 'bg-blue-500', icon: CheckCircle },
  IN_PROGRESS: { label: '진행중', color: 'bg-emerald-500', icon: Play },
  COMPLETED: { label: '완료', color: 'bg-green-500', icon: CheckCircle },
  CANCELLED: { label: '취소', color: 'bg-red-500', icon: AlertTriangle },
};

const priorityConfig = {
  HIGH: { label: '긴급', color: 'text-red-400 bg-red-400/10' },
  MEDIUM: { label: '보통', color: 'text-yellow-400 bg-yellow-400/10' },
  LOW: { label: '낮음', color: 'text-slate-400 bg-slate-400/10' },
};

export default function ERPWorkOrderPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (workOrderNo: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(workOrderNo)) {
      newExpanded.delete(workOrderNo);
    } else {
      newExpanded.add(workOrderNo);
    }
    setExpandedRows(newExpanded);
  };

  const filteredOrders = mockWorkOrders.filter(order => {
    const matchesSearch = order.workOrderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const summary = {
    total: mockWorkOrders.length,
    inProgress: mockWorkOrders.filter(o => o.status === 'IN_PROGRESS').length,
    planned: mockWorkOrders.filter(o => o.status === 'PLANNED' || o.status === 'RELEASED').length,
    completed: mockWorkOrders.filter(o => o.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Factory className="h-8 w-8 text-cyan-400" />
            ERP 작업지시
          </h1>
          <p className="text-slate-400 mt-1">MPS/MRP 기반 작업지시를 생성하고 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors">
            <Plus className="h-4 w-4" />
            작업지시 생성
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-700 rounded-lg">
              <Factory className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">전체 지시</p>
              <p className="text-2xl font-bold text-white">{summary.total}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Play className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">진행중</p>
              <p className="text-2xl font-bold text-emerald-400">{summary.inProgress}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">계획/확정</p>
              <p className="text-2xl font-bold text-blue-400">{summary.planned}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">완료</p>
              <p className="text-2xl font-bold text-green-400">{summary.completed}건</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="작업지시번호 또는 제품명 검색..."
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
            <option value="PLANNED">계획</option>
            <option value="RELEASED">확정</option>
            <option value="IN_PROGRESS">진행중</option>
            <option value="COMPLETED">완료</option>
            <option value="CANCELLED">취소</option>
          </select>
        </div>
      </div>

      {/* Work Order Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-700/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300 w-8"></th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">작업지시번호</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">제품</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">지시수량</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">진척률</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">생산라인</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">일정</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">우선순위</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">상태</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredOrders.map((order) => {
              const StatusIcon = statusConfig[order.status].icon;
              const progress = (order.completedQty / order.orderQty) * 100;
              const isExpanded = expandedRows.has(order.workOrderNo);

              return (
                <>
                  <tr key={order.workOrderNo} className="hover:bg-slate-700/50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleRow(order.workOrderNo)}
                        className="p-1 hover:bg-slate-600 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-cyan-400 font-medium">{order.workOrderNo}</p>
                        {order.salesOrderNo && (
                          <p className="text-xs text-slate-500">수주: {order.salesOrderNo}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white">{order.productName}</p>
                        <p className="text-xs text-slate-400">{order.productCode}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-white font-medium">
                        {order.orderQty.toLocaleString()} {order.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              progress >= 100 ? 'bg-green-500' : progress > 0 ? 'bg-cyan-500' : 'bg-slate-600'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-300 w-12 text-right">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className="text-white">{order.lineName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-slate-300">
                        <Calendar className="h-3 w-3" />
                        {order.startDate} ~ {order.endDate}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${priorityConfig[order.priority].color}`}>
                        {priorityConfig[order.priority].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${statusConfig[order.status].color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[order.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {order.status === 'PLANNED' && (
                          <button className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30" title="확정">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {order.status === 'RELEASED' && (
                          <button className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30" title="시작">
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        {order.status === 'IN_PROGRESS' && (
                          <>
                            <button className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30" title="일시정지">
                              <Pause className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30" title="완료">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-900/50">
                      <td colSpan={10} className="px-8 py-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            소요자재 목록
                          </h4>
                          <table className="w-full">
                            <thead>
                              <tr className="text-xs text-slate-400">
                                <th className="px-3 py-2 text-left">품목코드</th>
                                <th className="px-3 py-2 text-left">품목명</th>
                                <th className="px-3 py-2 text-right">소요수량</th>
                                <th className="px-3 py-2 text-right">불출수량</th>
                                <th className="px-3 py-2 text-center">불출률</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                              {order.items.map((item, idx) => {
                                const issueRate = (item.issuedQty / item.requiredQty) * 100;
                                return (
                                  <tr key={idx} className="text-sm">
                                    <td className="px-3 py-2 text-cyan-400">{item.itemCode}</td>
                                    <td className="px-3 py-2 text-white">{item.itemName}</td>
                                    <td className="px-3 py-2 text-right text-slate-300">
                                      {item.requiredQty.toLocaleString()} {item.unit}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-300">
                                      {item.issuedQty.toLocaleString()} {item.unit}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <span className={`px-2 py-0.5 rounded text-xs ${
                                        issueRate >= 100 ? 'bg-green-500/20 text-green-400' :
                                        issueRate > 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-slate-500/20 text-slate-400'
                                      }`}>
                                        {issueRate.toFixed(0)}%
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
