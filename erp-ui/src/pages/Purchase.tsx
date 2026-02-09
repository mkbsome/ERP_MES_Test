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
  Package,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import clsx from 'clsx';

type TabType = 'orders' | 'receipts' | 'invoices';

// Mock data
const purchaseOrders = [
  {
    id: 'PO-2024-0456',
    vendor: '삼성SDI',
    orderDate: '2024-12-10',
    dueDate: '2024-12-20',
    items: 8,
    amount: 125000000,
    status: 'approved',
  },
  {
    id: 'PO-2024-0455',
    vendor: '대덕전자',
    orderDate: '2024-12-09',
    dueDate: '2024-12-19',
    items: 5,
    amount: 78000000,
    status: 'pending',
  },
  {
    id: 'PO-2024-0454',
    vendor: 'TDK Korea',
    orderDate: '2024-12-08',
    dueDate: '2024-12-18',
    items: 12,
    amount: 45000000,
    status: 'received',
  },
  {
    id: 'PO-2024-0453',
    vendor: '무라타',
    orderDate: '2024-12-07',
    dueDate: '2024-12-17',
    items: 6,
    amount: 92000000,
    status: 'approved',
  },
  {
    id: 'PO-2024-0452',
    vendor: 'LG화학',
    orderDate: '2024-12-06',
    dueDate: '2024-12-16',
    items: 3,
    amount: 156000000,
    status: 'partial',
  },
];

const receipts = [
  {
    id: 'GR-2024-0789',
    poId: 'PO-2024-0454',
    vendor: 'TDK Korea',
    receiptDate: '2024-12-15',
    items: 12,
    qty: 5000,
    status: 'inspected',
  },
  {
    id: 'GR-2024-0788',
    poId: 'PO-2024-0452',
    vendor: 'LG화학',
    receiptDate: '2024-12-14',
    items: 2,
    qty: 3000,
    status: 'pending_inspection',
  },
  {
    id: 'GR-2024-0787',
    poId: 'PO-2024-0450',
    vendor: '삼성전기',
    receiptDate: '2024-12-13',
    items: 8,
    qty: 12000,
    status: 'inspected',
  },
];

const vendorPurchaseData = [
  { name: '삼성SDI', value: 320, color: '#3b82f6' },
  { name: '대덕전자', value: 180, color: '#22c55e' },
  { name: 'TDK Korea', value: 150, color: '#f59e0b' },
  { name: '무라타', value: 120, color: '#8b5cf6' },
  { name: '기타', value: 230, color: '#6b7280' },
];

const monthlyPurchaseData = [
  { month: '7월', amount: 280 },
  { month: '8월', amount: 320 },
  { month: '9월', amount: 290 },
  { month: '10월', amount: 350 },
  { month: '11월', amount: 310 },
  { month: '12월', amount: 380 },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '초안', color: 'bg-slate-500/20 text-slate-400' },
  pending: { label: '승인대기', color: 'bg-yellow-500/20 text-yellow-400' },
  approved: { label: '승인', color: 'bg-green-500/20 text-green-400' },
  received: { label: '입고완료', color: 'bg-blue-500/20 text-blue-400' },
  partial: { label: '부분입고', color: 'bg-orange-500/20 text-orange-400' },
  inspected: { label: '검사완료', color: 'bg-green-500/20 text-green-400' },
  pending_inspection: { label: '검사대기', color: 'bg-yellow-500/20 text-yellow-400' },
};

export default function Purchase() {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'orders', name: '발주관리', icon: FileText },
    { id: 'receipts', name: '입고관리', icon: Package },
    { id: 'invoices', name: '매입현황', icon: CreditCard },
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
              <p className="text-sm text-slate-400">미결 발주</p>
              <p className="text-xl font-bold text-white">45건</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-500/20">
              <Clock size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">입고대기</p>
              <p className="text-xl font-bold text-white">12건</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/20">
              <CheckCircle size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">검사대기</p>
              <p className="text-xl font-bold text-white">8건</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-500/20">
              <AlertCircle size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">납기지연</p>
              <p className="text-xl font-bold text-white">3건</p>
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
                  placeholder="발주번호, 공급업체 검색..."
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
                신규 발주
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">발주번호</th>
                  <th className="text-left px-4 py-3">공급업체</th>
                  <th className="text-center px-4 py-3">발주일</th>
                  <th className="text-center px-4 py-3">납기일</th>
                  <th className="text-center px-4 py-3">품목수</th>
                  <th className="text-right px-4 py-3">금액</th>
                  <th className="text-center px-4 py-3">상태</th>
                  <th className="text-center px-4 py-3">액션</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((order) => (
                  <tr key={order.id} className="table-row">
                    <td className="table-cell font-medium text-primary-400">{order.id}</td>
                    <td className="table-cell text-slate-200">{order.vendor}</td>
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
            <p className="text-sm text-slate-400">총 45건 중 1-5 표시</p>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-50" disabled>
                <ChevronLeft size={18} />
              </button>
              <button className="px-3 py-1 bg-primary-600 rounded text-sm text-white">1</button>
              <button className="px-3 py-1 hover:bg-slate-700 rounded text-sm text-slate-400">2</button>
              <button className="px-3 py-1 hover:bg-slate-700 rounded text-sm text-slate-400">3</button>
              <button className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'receipts' && (
        <div className="card">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="입고번호, 발주번호 검색..."
                  className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 w-64"
                />
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg text-sm text-white hover:bg-primary-700">
              <Plus size={16} />
              입고등록
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">입고번호</th>
                  <th className="text-left px-4 py-3">발주번호</th>
                  <th className="text-left px-4 py-3">공급업체</th>
                  <th className="text-center px-4 py-3">입고일</th>
                  <th className="text-center px-4 py-3">품목수</th>
                  <th className="text-right px-4 py-3">수량</th>
                  <th className="text-center px-4 py-3">상태</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="table-row">
                    <td className="table-cell font-medium text-primary-400">{receipt.id}</td>
                    <td className="table-cell text-slate-300">{receipt.poId}</td>
                    <td className="table-cell text-slate-200">{receipt.vendor}</td>
                    <td className="table-cell text-center text-slate-300">{receipt.receiptDate}</td>
                    <td className="table-cell text-center text-slate-300">{receipt.items}개</td>
                    <td className="table-cell text-right text-slate-300">{receipt.qty.toLocaleString()}</td>
                    <td className="table-cell text-center">
                      <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', statusConfig[receipt.status].color)}>
                        {statusConfig[receipt.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">월별 매입 현황</h3>
              <span className="text-xs text-slate-400">단위: 백만원</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyPurchaseData}>
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
                  <Bar dataKey="amount" name="매입액" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">업체별 매입 비중</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vendorPurchaseData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {vendorPurchaseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`₩${value}백만`, '매입액']}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Purchase Summary */}
          <div className="lg:col-span-2 card">
            <div className="card-header">
              <h3 className="card-title">매입 요약</h3>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-slate-400">이번 달 매입</p>
                <p className="text-2xl font-bold text-white mt-1">₩3.8억</p>
                <p className="text-xs text-yellow-400 mt-1">전월 대비 +8%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400">미지급금</p>
                <p className="text-2xl font-bold text-white mt-1">₩2.1억</p>
                <p className="text-xs text-slate-400 mt-1">결제예정</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400">연간 누적</p>
                <p className="text-2xl font-bold text-white mt-1">₩38.2억</p>
                <p className="text-xs text-slate-400 mt-1">전년 대비 +5%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400">주요 업체</p>
                <p className="text-2xl font-bold text-white mt-1">삼성SDI</p>
                <p className="text-xs text-slate-400 mt-1">32% 비중</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
