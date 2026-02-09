import { useState } from 'react';
import { Receipt, Search, Filter, Calendar, CheckCircle2, Clock, AlertTriangle, DollarSign, Building2, Phone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Receivable {
  id: string;
  customerCode: string;
  customerName: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  invoiceAmount: number;
  receivedAmount: number;
  balance: number;
  status: 'pending' | 'partial' | 'received' | 'overdue';
  salesOrderNo?: string;
  description: string;
  daysOverdue?: number;
}

const mockReceivables: Receivable[] = [
  {
    id: '1',
    customerCode: 'C001',
    customerName: '삼성전자',
    invoiceNo: 'INV-S-2024-0125',
    invoiceDate: '2024-01-10',
    dueDate: '2024-02-10',
    invoiceAmount: 450000000,
    receivedAmount: 0,
    balance: 450000000,
    status: 'pending',
    salesOrderNo: 'SO-2024-0125',
    description: '스마트폰 메인보드 납품대금',
  },
  {
    id: '2',
    customerCode: 'C002',
    customerName: 'LG전자',
    invoiceNo: 'INV-S-2024-0118',
    invoiceDate: '2024-01-03',
    dueDate: '2024-01-18',
    invoiceAmount: 320000000,
    receivedAmount: 320000000,
    balance: 0,
    status: 'received',
    salesOrderNo: 'SO-2024-0118',
    description: 'TV 제어보드 납품대금',
  },
  {
    id: '3',
    customerCode: 'C003',
    customerName: 'SK하이닉스',
    invoiceNo: 'INV-S-2024-0112',
    invoiceDate: '2023-12-25',
    dueDate: '2024-01-10',
    invoiceAmount: 280000000,
    receivedAmount: 150000000,
    balance: 130000000,
    status: 'partial',
    salesOrderNo: 'SO-2024-0112',
    description: '메모리 테스트보드 납품대금',
  },
  {
    id: '4',
    customerCode: 'C004',
    customerName: '현대모비스',
    invoiceNo: 'INV-S-2024-0098',
    invoiceDate: '2023-12-15',
    dueDate: '2023-12-30',
    invoiceAmount: 185000000,
    receivedAmount: 0,
    balance: 185000000,
    status: 'overdue',
    daysOverdue: 21,
    salesOrderNo: 'SO-2024-0098',
    description: '차량용 ECU 납품대금',
  },
  {
    id: '5',
    customerCode: 'C005',
    customerName: '삼성SDI',
    invoiceNo: 'INV-S-2024-0130',
    invoiceDate: '2024-01-15',
    dueDate: '2024-02-15',
    invoiceAmount: 520000000,
    receivedAmount: 0,
    balance: 520000000,
    status: 'pending',
    salesOrderNo: 'SO-2024-0130',
    description: '배터리 관리시스템 납품대금',
  },
];

const agingData = [
  { range: '미도래', amount: 970000000, count: 3 },
  { range: '1-30일', amount: 130000000, count: 1 },
  { range: '31-60일', amount: 185000000, count: 1 },
  { range: '61-90일', amount: 0, count: 0 },
  { range: '90일 초과', amount: 0, count: 0 },
];

const customerData = [
  { name: '삼성전자', amount: 450000000, percent: 35 },
  { name: '삼성SDI', amount: 520000000, percent: 40 },
  { name: 'SK하이닉스', amount: 130000000, percent: 10 },
  { name: '현대모비스', amount: 185000000, percent: 14 },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b'];

export default function AccountsReceivablePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredReceivables = mockReceivables.filter(receivable => {
    const matchesSearch =
      receivable.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receivable.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || receivable.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalBalance = mockReceivables.reduce((sum, r) => sum + r.balance, 0);
  const overdueAmount = mockReceivables.filter(r => r.status === 'overdue').reduce((sum, r) => sum + r.balance, 0);
  const pendingCount = mockReceivables.filter(r => r.status === 'pending' || r.status === 'partial').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-blue-500/20 text-blue-400';
      case 'partial': return 'bg-yellow-500/20 text-yellow-400';
      case 'overdue': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'received': return '수금완료';
      case 'pending': return '미수금';
      case 'partial': return '부분수금';
      case 'overdue': return '연체';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`;
    } else if (value >= 10000000) {
      return `${(value / 10000000).toFixed(1)}천만`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">미수금 관리</h1>
          <p className="text-slate-400">매출채권 현황 및 수금 관리</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          <DollarSign className="w-4 h-4" />
          수금 처리
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Receipt className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">총 미수금</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">연체금액</p>
              <p className="text-xl font-bold text-red-400">{formatCurrency(overdueAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">수금예정 건수</p>
              <p className="text-xl font-bold text-white">{pendingCount}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Building2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">거래처 수</p>
              <p className="text-xl font-bold text-white">{new Set(mockReceivables.map(r => r.customerCode)).size}개사</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aging Analysis */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">채권 연령 분석 (Aging)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={agingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v/100000000}억`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: number) => [formatCurrency(value), '금액']}
              />
              <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Distribution */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">고객별 미수금 현황</h3>
          <div className="flex items-center">
            <ResponsiveContainer width="45%" height={220}>
              <PieChart>
                <Pie
                  data={customerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="amount"
                >
                  {customerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/2 space-y-2">
              {customerData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                    <span className="text-slate-300 text-sm">{item.name}</span>
                  </div>
                  <span className="text-white text-sm">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="고객명, 청구서번호 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">전체 상태</option>
          <option value="pending">미수금</option>
          <option value="partial">부분수금</option>
          <option value="received">수금완료</option>
          <option value="overdue">연체</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors">
          <Filter className="w-4 h-4" />
          필터
        </button>
      </div>

      {/* Receivables List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">고객사</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">청구서번호</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">청구일</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">만기일</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">청구금액</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">수금액</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">잔액</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">상태</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredReceivables.map((receivable) => (
                <tr key={receivable.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium">{receivable.customerName}</p>
                      <p className="text-slate-400 text-xs">{receivable.customerCode}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-blue-400 font-mono text-sm">{receivable.invoiceNo}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{receivable.invoiceDate}</td>
                  <td className="px-4 py-3">
                    <div>
                      <span className={receivable.status === 'overdue' ? 'text-red-400' : 'text-slate-300'}>
                        {receivable.dueDate}
                      </span>
                      {receivable.daysOverdue && (
                        <p className="text-red-400 text-xs">{receivable.daysOverdue}일 연체</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-white">
                    {receivable.invoiceAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-green-400">
                    {receivable.receivedAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-yellow-400 font-medium">
                    {receivable.balance.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStatusColor(receivable.status)}`}>
                      {getStatusLabel(receivable.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {receivable.status !== 'received' && (
                        <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors">
                          수금
                        </button>
                      )}
                      {receivable.status === 'overdue' && (
                        <button className="p-1.5 hover:bg-slate-600 rounded transition-colors" title="독촉 연락">
                          <Phone className="w-4 h-4 text-yellow-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
