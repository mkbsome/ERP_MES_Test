import { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import clsx from 'clsx';

type TabType = 'orders' | 'shipments' | 'revenue';

// Mock data
const salesOrders = [
  {
    id: 'SO-2024-0892',
    customer: '삼성전자',
    orderDate: '2024-12-15',
    dueDate: '2024-12-25',
    items: 5,
    amount: 45000000,
    status: 'approved',
  },
  {
    id: 'SO-2024-0891',
    customer: 'LG이노텍',
    orderDate: '2024-12-15',
    dueDate: '2024-12-28',
    items: 3,
    amount: 32000000,
    status: 'pending',
  },
  {
    id: 'SO-2024-0890',
    customer: '현대모비스',
    orderDate: '2024-12-14',
    dueDate: '2024-12-24',
    items: 8,
    amount: 28000000,
    status: 'approved',
  },
  {
    id: 'SO-2024-0889',
    customer: 'SK하이닉스',
    orderDate: '2024-12-14',
    dueDate: '2024-12-30',
    items: 12,
    amount: 55000000,
    status: 'draft',
  },
  {
    id: 'SO-2024-0888',
    customer: '한화솔루션',
    orderDate: '2024-12-13',
    dueDate: '2024-12-23',
    items: 2,
    amount: 18000000,
    status: 'shipped',
  },
  {
    id: 'SO-2024-0887',
    customer: '포스코ICT',
    orderDate: '2024-12-13',
    dueDate: '2024-12-22',
    items: 6,
    amount: 42000000,
    status: 'approved',
  },
  {
    id: 'SO-2024-0886',
    customer: 'KT',
    orderDate: '2024-12-12',
    dueDate: '2024-12-20',
    items: 4,
    amount: 25000000,
    status: 'completed',
  },
];

const shipments = [
  {
    id: 'SH-2024-0456',
    orderId: 'SO-2024-0888',
    customer: '한화솔루션',
    shipDate: '2024-12-15',
    carrier: 'CJ대한통운',
    trackingNo: 'KR123456789',
    status: 'delivered',
  },
  {
    id: 'SH-2024-0455',
    orderId: 'SO-2024-0885',
    customer: '네이버',
    shipDate: '2024-12-14',
    carrier: '로젠택배',
    trackingNo: 'LG987654321',
    status: 'in_transit',
  },
  {
    id: 'SH-2024-0454',
    orderId: 'SO-2024-0884',
    customer: '카카오',
    shipDate: '2024-12-13',
    carrier: 'CJ대한통운',
    trackingNo: 'KR111222333',
    status: 'delivered',
  },
];

const monthlyRevenueData = [
  { month: '7월', revenue: 420, target: 400 },
  { month: '8월', revenue: 380, target: 420 },
  { month: '9월', revenue: 450, target: 430 },
  { month: '10월', revenue: 410, target: 440 },
  { month: '11월', revenue: 480, target: 450 },
  { month: '12월', revenue: 520, target: 500 },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '초안', color: 'bg-slate-500/20 text-slate-400' },
  pending: { label: '승인대기', color: 'bg-yellow-500/20 text-yellow-400' },
  approved: { label: '승인', color: 'bg-green-500/20 text-green-400' },
  shipped: { label: '출하완료', color: 'bg-blue-500/20 text-blue-400' },
  completed: { label: '완료', color: 'bg-purple-500/20 text-purple-400' },
  delivered: { label: '배송완료', color: 'bg-green-500/20 text-green-400' },
  in_transit: { label: '배송중', color: 'bg-blue-500/20 text-blue-400' },
};

export default function Sales() {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'orders', name: '수주관리', icon: FileText },
    { id: 'shipments', name: '출하관리', icon: Truck },
    { id: 'revenue', name: '매출현황', icon: CheckCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <FileText size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">총 수주</p>
              <p className="text-xl font-bold text-white">127건</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-500/20">
              <Clock size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">승인대기</p>
              <p className="text-xl font-bold text-white">15건</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/20">
              <Truck size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">출하예정</p>
              <p className="text-xl font-bold text-white">23건</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-500/20">
              <AlertCircle size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">납기임박</p>
              <p className="text-xl font-bold text-white">5건</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              )}
            >
              <tab.icon size={18} />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'orders' && (
        <div className="card">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="수주번호, 고객사 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 w-64"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:bg-slate-600">
                <Filter size={16} />
                필터
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:bg-slate-600">
                <Download size={16} />
                엑셀
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg text-sm text-white hover:bg-primary-700">
                <Plus size={16} />
                신규 수주
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">수주번호</th>
                  <th className="text-left px-4 py-3">고객사</th>
                  <th className="text-center px-4 py-3">주문일</th>
                  <th className="text-center px-4 py-3">납기일</th>
                  <th className="text-center px-4 py-3">품목수</th>
                  <th className="text-right px-4 py-3">금액</th>
                  <th className="text-center px-4 py-3">상태</th>
                  <th className="text-center px-4 py-3">액션</th>
                </tr>
              </thead>
              <tbody>
                {salesOrders.map((order) => (
                  <tr key={order.id} className="table-row">
                    <td className="table-cell font-medium text-primary-400">{order.id}</td>
                    <td className="table-cell text-slate-200">{order.customer}</td>
                    <td className="table-cell text-center text-slate-300">{order.orderDate}</td>
                    <td className="table-cell text-center text-slate-300">{order.dueDate}</td>
                    <td className="table-cell text-center text-slate-300">{order.items}개</td>
                    <td className="table-cell text-right text-slate-200">
                      ₩{order.amount.toLocaleString()}
                    </td>
                    <td className="table-cell text-center">
                      <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', statusConfig[order.status].color)}>
                        {statusConfig[order.status].label}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 hover:bg-slate-600 rounded text-slate-400 hover:text-white">
                          <Eye size={16} />
                        </button>
                        <button className="p-1.5 hover:bg-slate-600 rounded text-slate-400 hover:text-white">
                          <Edit size={16} />
                        </button>
                        <button className="p-1.5 hover:bg-slate-600 rounded text-slate-400 hover:text-red-400">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-400">총 127건 중 1-7 표시</p>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-50" disabled>
                <ChevronLeft size={18} />
              </button>
              <button className="px-3 py-1 bg-primary-600 rounded text-sm text-white">1</button>
              <button className="px-3 py-1 hover:bg-slate-700 rounded text-sm text-slate-400">2</button>
              <button className="px-3 py-1 hover:bg-slate-700 rounded text-sm text-slate-400">3</button>
              <span className="text-slate-500">...</span>
              <button className="px-3 py-1 hover:bg-slate-700 rounded text-sm text-slate-400">19</button>
              <button className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'shipments' && (
        <div className="card">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="출하번호, 송장번호 검색..."
                  className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 w-64"
                />
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg text-sm text-white hover:bg-primary-700">
              <Plus size={16} />
              출하등록
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">출하번호</th>
                  <th className="text-left px-4 py-3">수주번호</th>
                  <th className="text-left px-4 py-3">고객사</th>
                  <th className="text-center px-4 py-3">출하일</th>
                  <th className="text-left px-4 py-3">운송사</th>
                  <th className="text-left px-4 py-3">송장번호</th>
                  <th className="text-center px-4 py-3">상태</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((ship) => (
                  <tr key={ship.id} className="table-row">
                    <td className="table-cell font-medium text-primary-400">{ship.id}</td>
                    <td className="table-cell text-slate-300">{ship.orderId}</td>
                    <td className="table-cell text-slate-200">{ship.customer}</td>
                    <td className="table-cell text-center text-slate-300">{ship.shipDate}</td>
                    <td className="table-cell text-slate-300">{ship.carrier}</td>
                    <td className="table-cell text-slate-300">{ship.trackingNo}</td>
                    <td className="table-cell text-center">
                      <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', statusConfig[ship.status].color)}>
                        {statusConfig[ship.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">월별 매출 현황</h3>
              <span className="text-xs text-slate-400">단위: 백만원</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="revenue" name="실적" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" name="목표" fill="#6b7280" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">매출 추이</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="revenue" name="실적" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                  <Line type="monotone" dataKey="target" name="목표" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#6b7280' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="lg:col-span-2 card">
            <div className="card-header">
              <h3 className="card-title">매출 요약</h3>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-slate-400">이번 달 매출</p>
                <p className="text-2xl font-bold text-white mt-1">₩5.2억</p>
                <p className="text-xs text-green-400 mt-1">목표 대비 104%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400">분기 누적</p>
                <p className="text-2xl font-bold text-white mt-1">₩14.1억</p>
                <p className="text-xs text-green-400 mt-1">목표 대비 98%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400">연간 누적</p>
                <p className="text-2xl font-bold text-white mt-1">₩52.8억</p>
                <p className="text-xs text-green-400 mt-1">목표 대비 101%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400">전년 대비</p>
                <p className="text-2xl font-bold text-white mt-1">+12.5%</p>
                <p className="text-xs text-slate-400 mt-1">성장률</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
