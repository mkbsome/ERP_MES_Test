import { useState } from 'react';
import {
  Wrench,
  Search,
  Plus,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Settings,
  Calendar,
  FileText,
} from 'lucide-react';

interface MaintenanceOrder {
  id: string;
  orderNo: string;
  equipmentId: string;
  equipmentName: string;
  lineName: string;
  type: 'breakdown' | 'preventive' | 'corrective' | 'improvement';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'requested' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  requestDate: string;
  requestedBy: string;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  description: string;
  findings?: string;
  parts?: { name: string; qty: number; cost: number }[];
  laborHours?: number;
  totalCost?: number;
}

// Mock 데이터
const mockOrders: MaintenanceOrder[] = [
  {
    id: '1',
    orderNo: 'MO-2024-0001',
    equipmentId: 'EQ-001',
    equipmentName: 'SMT 마운터 #1',
    lineName: 'SMT-L01',
    type: 'breakdown',
    priority: 'critical',
    status: 'in_progress',
    requestDate: '2024-01-15 08:30:00',
    requestedBy: '최작업',
    assignedTo: '박설비',
    startDate: '2024-01-15 09:00:00',
    description: '마운터 Z축 이상 진동 발생, 부품 실장 불량 증가',
    parts: [
      { name: 'Z축 모터', qty: 1, cost: 850000 },
      { name: '베어링 세트', qty: 2, cost: 120000 },
    ],
    laborHours: 4,
  },
  {
    id: '2',
    orderNo: 'MO-2024-0002',
    equipmentId: 'EQ-003',
    equipmentName: '리플로우 오븐 #1',
    lineName: 'SMT-L01',
    type: 'preventive',
    priority: 'medium',
    status: 'approved',
    requestDate: '2024-01-14 14:00:00',
    requestedBy: '김생산',
    assignedTo: '이보전',
    description: '월간 PM - 히터 엘리먼트 점검 및 온도 교정',
  },
  {
    id: '3',
    orderNo: 'MO-2024-0003',
    equipmentId: 'EQ-004',
    equipmentName: 'AOI 검사기 #1',
    lineName: 'SMT-L02',
    type: 'corrective',
    priority: 'high',
    status: 'completed',
    requestDate: '2024-01-13 10:00:00',
    requestedBy: '이품질',
    assignedTo: '박설비',
    startDate: '2024-01-13 11:00:00',
    endDate: '2024-01-13 15:30:00',
    description: '카메라 렌즈 초점 불량 - 검사 정확도 저하',
    findings: '렌즈 오염 및 조리개 동작 불량 확인, 렌즈 청소 및 조리개 모듈 교체 완료',
    parts: [
      { name: '조리개 모듈', qty: 1, cost: 280000 },
    ],
    laborHours: 4.5,
    totalCost: 430000,
  },
  {
    id: '4',
    orderNo: 'MO-2024-0004',
    equipmentId: 'EQ-005',
    equipmentName: '인쇄기 #1',
    lineName: 'SMT-L02',
    type: 'improvement',
    priority: 'low',
    status: 'requested',
    requestDate: '2024-01-15 11:00:00',
    requestedBy: '김생산',
    description: '스퀴지 압력 자동조절 기능 업그레이드 요청',
  },
  {
    id: '5',
    orderNo: 'MO-2024-0005',
    equipmentId: 'EQ-002',
    equipmentName: 'SMT 마운터 #2',
    lineName: 'SMT-L01',
    type: 'breakdown',
    priority: 'high',
    status: 'cancelled',
    requestDate: '2024-01-12 16:00:00',
    requestedBy: '최작업',
    description: '노즐 교체 필요 - 흡착 불량 (자체 해결됨)',
  },
];

export default function MaintenanceOrderPage() {
  const [orders] = useState<MaintenanceOrder[]>(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrder | null>(null);

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || order.type === filterType;
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || order.priority === filterPriority;
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  const getTypeColor = (type: MaintenanceOrder['type']) => {
    switch (type) {
      case 'breakdown': return 'bg-red-500/20 text-red-400';
      case 'preventive': return 'bg-blue-500/20 text-blue-400';
      case 'corrective': return 'bg-orange-500/20 text-orange-400';
      case 'improvement': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getTypeText = (type: MaintenanceOrder['type']) => {
    switch (type) {
      case 'breakdown': return '고장수리';
      case 'preventive': return '예방정비';
      case 'corrective': return '개선정비';
      case 'improvement': return '설비개선';
      default: return type;
    }
  };

  const getPriorityColor = (priority: MaintenanceOrder['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'low': return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getPriorityText = (priority: MaintenanceOrder['priority']) => {
    switch (priority) {
      case 'critical': return '긴급';
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return priority;
    }
  };

  const getStatusColor = (status: MaintenanceOrder['status']) => {
    switch (status) {
      case 'requested': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'approved': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusText = (status: MaintenanceOrder['status']) => {
    switch (status) {
      case 'requested': return '요청';
      case 'approved': return '승인';
      case 'in_progress': return '진행중';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      default: return status;
    }
  };

  const getStatusIcon = (status: MaintenanceOrder['status']) => {
    switch (status) {
      case 'requested': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle2 className="w-4 h-4" />;
      case 'in_progress': return <Settings className="w-4 h-4 animate-spin" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  // 통계
  const stats = {
    total: orders.length,
    requested: orders.filter(o => o.status === 'requested').length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
    critical: orders.filter(o => o.priority === 'critical' && o.status !== 'completed' && o.status !== 'cancelled').length,
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">보전지시</h1>
          <p className="text-slate-400 text-sm mt-1">설비 유지보수 작업 지시 및 관리</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          보전지시 등록
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">전체</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <Wrench className="w-8 h-8 text-slate-500" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">요청</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.requested}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">진행중</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{stats.inProgress}</p>
            </div>
            <Settings className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">완료</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{stats.completed}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">긴급</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{stats.critical}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="지시번호, 설비명, 내용으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
          />
        </div>
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">전체 유형</option>
          <option value="breakdown">고장수리</option>
          <option value="preventive">예방정비</option>
          <option value="corrective">개선정비</option>
          <option value="improvement">설비개선</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">전체 상태</option>
          <option value="requested">요청</option>
          <option value="approved">승인</option>
          <option value="in_progress">진행중</option>
          <option value="completed">완료</option>
          <option value="cancelled">취소</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">전체 우선순위</option>
          <option value="critical">긴급</option>
          <option value="high">높음</option>
          <option value="medium">보통</option>
          <option value="low">낮음</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 목록 */}
        <div className="col-span-2 bg-slate-800 rounded-xl border border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">지시번호</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">설비</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">유형</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">우선순위</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">상태</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">담당자</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`hover:bg-slate-700/30 cursor-pointer ${
                      selectedOrder?.id === order.id ? 'bg-slate-700/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-mono">{order.orderNo}</p>
                      <p className="text-slate-500 text-xs">{order.requestDate.split(' ')[0]}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{order.equipmentName}</p>
                      <p className="text-slate-500 text-xs">{order.lineName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${getTypeColor(order.type)}`}>
                        {getTypeText(order.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(order.priority)}`}>
                        {getPriorityText(order.priority)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {order.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-300 text-sm">{order.assignedTo}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">미배정</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 상세 패널 */}
        <div className="col-span-1">
          {selectedOrder ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">보전지시 상세</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusIcon(selectedOrder.status)}
                  {getStatusText(selectedOrder.status)}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-xs mb-1">지시번호</p>
                  <p className="text-white font-mono text-lg">{selectedOrder.orderNo}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-slate-700/30 rounded">
                    <p className="text-slate-400 text-xs">유형</p>
                    <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(selectedOrder.type)}`}>
                      {getTypeText(selectedOrder.type)}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-700/30 rounded">
                    <p className="text-slate-400 text-xs">우선순위</p>
                    <span className={`px-2 py-0.5 rounded text-xs ${getPriorityColor(selectedOrder.priority)}`}>
                      {getPriorityText(selectedOrder.priority)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-slate-400 text-xs mb-1">대상 설비</p>
                  <p className="text-white">{selectedOrder.equipmentName}</p>
                  <p className="text-slate-500 text-sm">{selectedOrder.lineName} | {selectedOrder.equipmentId}</p>
                </div>

                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-slate-400 text-xs mb-1">작업 내용</p>
                  <p className="text-white text-sm">{selectedOrder.description}</p>
                </div>

                {selectedOrder.findings && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-xs mb-1">처리 결과</p>
                    <p className="text-white text-sm">{selectedOrder.findings}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-slate-700/30 rounded">
                    <p className="text-slate-400 text-xs">요청자</p>
                    <p className="text-white text-sm">{selectedOrder.requestedBy}</p>
                  </div>
                  <div className="p-2 bg-slate-700/30 rounded">
                    <p className="text-slate-400 text-xs">담당자</p>
                    <p className="text-white text-sm">{selectedOrder.assignedTo || '미배정'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-slate-700/30 rounded">
                    <p className="text-slate-400 text-xs">요청일</p>
                    <p className="text-white text-sm">{selectedOrder.requestDate.split(' ')[0]}</p>
                  </div>
                  {selectedOrder.endDate && (
                    <div className="p-2 bg-slate-700/30 rounded">
                      <p className="text-slate-400 text-xs">완료일</p>
                      <p className="text-white text-sm">{selectedOrder.endDate.split(' ')[0]}</p>
                    </div>
                  )}
                </div>

                {selectedOrder.parts && selectedOrder.parts.length > 0 && (
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-slate-400 text-xs mb-2">사용 부품</p>
                    <div className="space-y-1">
                      {selectedOrder.parts.map((part, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-white">{part.name} x{part.qty}</span>
                          <span className="text-slate-400">{part.cost.toLocaleString()}원</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedOrder.laborHours && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-700/30 rounded">
                      <p className="text-slate-400 text-xs">작업시간</p>
                      <p className="text-white text-sm">{selectedOrder.laborHours}시간</p>
                    </div>
                    {selectedOrder.totalCost && (
                      <div className="p-2 bg-slate-700/30 rounded">
                        <p className="text-slate-400 text-xs">총 비용</p>
                        <p className="text-white text-sm">{selectedOrder.totalCost.toLocaleString()}원</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-slate-700">
                  {selectedOrder.status === 'requested' && (
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      승인
                    </button>
                  )}
                  {selectedOrder.status === 'approved' && (
                    <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                      작업 시작
                    </button>
                  )}
                  {selectedOrder.status === 'in_progress' && (
                    <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                      작업 완료
                    </button>
                  )}
                  <button className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm">
                    <FileText className="w-4 h-4 inline mr-1" />
                    상세
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">보전지시를 선택하세요</p>
              <p className="text-slate-500 text-sm mt-1">상세 정보를 확인할 수 있습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
