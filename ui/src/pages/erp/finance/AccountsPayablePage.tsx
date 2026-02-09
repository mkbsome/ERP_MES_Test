import { useState } from 'react';
import { Receipt, Search, Filter, Calendar, CheckCircle2, Clock, AlertTriangle, DollarSign, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Payable {
  id: string;
  vendorCode: string;
  vendorName: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  invoiceAmount: number;
  paidAmount: number;
  balance: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  purchaseOrderNo?: string;
  description: string;
}

const mockPayables: Payable[] = [
  {
    id: '1',
    vendorCode: 'V001',
    vendorName: '삼성전기',
    invoiceNo: 'INV-2024-0125',
    invoiceDate: '2024-01-05',
    dueDate: '2024-02-05',
    invoiceAmount: 285000000,
    paidAmount: 0,
    balance: 285000000,
    status: 'pending',
    purchaseOrderNo: 'PO-2024-0089',
    description: '전자부품 구매대금',
  },
  {
    id: '2',
    vendorCode: 'V002',
    vendorName: '하이닉스',
    invoiceNo: 'INV-2024-0118',
    invoiceDate: '2024-01-03',
    dueDate: '2024-01-20',
    invoiceAmount: 450000000,
    paidAmount: 450000000,
    balance: 0,
    status: 'paid',
    purchaseOrderNo: 'PO-2024-0075',
    description: '반도체 구매대금',
  },
  {
    id: '3',
    vendorCode: 'V003',
    vendorName: '대덕전자',
    invoiceNo: 'INV-2024-0112',
    invoiceDate: '2023-12-28',
    dueDate: '2024-01-15',
    invoiceAmount: 180000000,
    paidAmount: 100000000,
    balance: 80000000,
    status: 'partial',
    purchaseOrderNo: 'PO-2024-0068',
    description: 'PCB 기판 구매대금',
  },
  {
    id: '4',
    vendorCode: 'V004',
    vendorName: '인탑스',
    invoiceNo: 'INV-2024-0098',
    invoiceDate: '2023-12-20',
    dueDate: '2024-01-05',
    invoiceAmount: 95000000,
    paidAmount: 0,
    balance: 95000000,
    status: 'overdue',
    purchaseOrderNo: 'PO-2024-0055',
    description: '커넥터 구매대금',
  },
  {
    id: '5',
    vendorCode: 'V005',
    vendorName: '심텍',
    invoiceNo: 'INV-2024-0130',
    invoiceDate: '2024-01-10',
    dueDate: '2024-02-10',
    invoiceAmount: 220000000,
    paidAmount: 0,
    balance: 220000000,
    status: 'pending',
    purchaseOrderNo: 'PO-2024-0095',
    description: 'PCB 원자재 구매대금',
  },
];

const agingData = [
  { range: '미도래', amount: 505000000, count: 3 },
  { range: '1-30일', amount: 80000000, count: 1 },
  { range: '31-60일', amount: 95000000, count: 1 },
  { range: '61-90일', amount: 0, count: 0 },
  { range: '90일 초과', amount: 0, count: 0 },
];

const monthlyPaymentData = [
  { month: '8월', payment: 520, balance: 680 },
  { month: '9월', payment: 480, balance: 720 },
  { month: '10월', payment: 550, balance: 650 },
  { month: '11월', payment: 620, balance: 580 },
  { month: '12월', payment: 450, balance: 730 },
  { month: '1월', payment: 450, balance: 680 },
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AccountsPayablePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');

  const filteredPayables = mockPayables.filter(payable => {
    const matchesSearch =
      payable.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payable.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || payable.status === selectedStatus;
    const matchesVendor = selectedVendor === 'all' || payable.vendorCode === selectedVendor;
    return matchesSearch && matchesStatus && matchesVendor;
  });

  const totalBalance = mockPayables.reduce((sum, p) => sum + p.balance, 0);
  const overdueAmount = mockPayables.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.balance, 0);
  const pendingCount = mockPayables.filter(p => p.status === 'pending' || p.status === 'partial').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-blue-500/20 text-blue-400';
      case 'partial': return 'bg-yellow-500/20 text-yellow-400';
      case 'overdue': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return '지급완료';
      case 'pending': return '미지급';
      case 'partial': return '부분지급';
      case 'overdue': return '연체';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`;
    } else if (value >= 10000000) {
      return `${(value / 10000000).toFixed(1)}천만`;
    } else if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}만`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">미지급금 관리</h1>
          <p className="text-slate-400">매입채무 현황 및 지급 관리</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          <DollarSign className="w-4 h-4" />
          지급 처리
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
              <p className="text-slate-400 text-sm">총 미지급금</p>
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
              <p className="text-slate-400 text-sm">지급예정 건수</p>
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
              <p className="text-xl font-bold text-white">{new Set(mockPayables.map(p => p.vendorCode)).size}개사</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aging Analysis */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">채무 연령 분석 (Aging)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={agingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v/100000000}억`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: number) => [formatCurrency(value), '금액']}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">월별 지급/잔액 추이</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyPaymentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v}백만`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: number) => [`${value}백만원`, '']}
              />
              <Bar dataKey="payment" fill="#10b981" name="지급액" radius={[4, 4, 0, 0]} />
              <Bar dataKey="balance" fill="#f59e0b" name="잔액" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="거래처명, 청구서번호 검색..."
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
          <option value="pending">미지급</option>
          <option value="partial">부분지급</option>
          <option value="paid">지급완료</option>
          <option value="overdue">연체</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors">
          <Filter className="w-4 h-4" />
          필터
        </button>
      </div>

      {/* Payables List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">거래처</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">청구서번호</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">청구일</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">만기일</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">청구금액</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">지급액</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">잔액</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">상태</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredPayables.map((payable) => (
                <tr key={payable.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium">{payable.vendorName}</p>
                      <p className="text-slate-400 text-xs">{payable.vendorCode}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-blue-400 font-mono text-sm">{payable.invoiceNo}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{payable.invoiceDate}</td>
                  <td className="px-4 py-3">
                    <span className={payable.status === 'overdue' ? 'text-red-400' : 'text-slate-300'}>
                      {payable.dueDate}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-white">
                    {payable.invoiceAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-green-400">
                    {payable.paidAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-yellow-400 font-medium">
                    {payable.balance.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStatusColor(payable.status)}`}>
                      {getStatusLabel(payable.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {payable.status !== 'paid' && (
                      <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors">
                        지급
                      </button>
                    )}
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
