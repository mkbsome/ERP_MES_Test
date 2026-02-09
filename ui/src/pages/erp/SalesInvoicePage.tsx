import { useState } from 'react';
import { Receipt, Search, Plus, Filter, CheckCircle2, Clock, AlertTriangle, FileText, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface InvoiceItem {
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxAmount: number;
}

interface SalesInvoice {
  id: string;
  invoiceNo: string;
  deliveryNo: string;
  salesOrderNo: string;
  customerCode: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  status: 'issued' | 'sent' | 'paid' | 'overdue' | 'partial';
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  items: InvoiceItem[];
}

const mockInvoices: SalesInvoice[] = [
  {
    id: '1',
    invoiceNo: 'INV-2024-0001',
    deliveryNo: 'DL-2024-0001',
    salesOrderNo: 'SO-2024-0001',
    customerCode: 'C001',
    customerName: '삼성전자',
    invoiceDate: '2024-01-20',
    dueDate: '2024-02-20',
    status: 'paid',
    supplyAmount: 113636364,
    taxAmount: 11363636,
    totalAmount: 125000000,
    paidAmount: 125000000,
    items: [
      { itemCode: 'SMB-A01', itemName: '스마트폰 메인보드 A', quantity: 1000, unitPrice: 113636, amount: 113636364, taxAmount: 11363636 },
    ],
  },
  {
    id: '2',
    invoiceNo: 'INV-2024-0002',
    deliveryNo: 'DL-2024-0002',
    salesOrderNo: 'SO-2024-0002',
    customerCode: 'C002',
    customerName: 'LG전자',
    invoiceDate: '2024-01-22',
    dueDate: '2024-02-22',
    status: 'sent',
    supplyAmount: 40909091,
    taxAmount: 4090909,
    totalAmount: 45000000,
    paidAmount: 0,
    items: [
      { itemCode: 'PWB-A01', itemName: '전원보드 A', quantity: 500, unitPrice: 81818, amount: 40909091, taxAmount: 4090909 },
    ],
  },
  {
    id: '3',
    invoiceNo: 'INV-2024-0003',
    deliveryNo: 'DL-2024-0003',
    salesOrderNo: 'SO-2024-0003',
    customerCode: 'C003',
    customerName: '현대모비스',
    invoiceDate: '2024-01-15',
    dueDate: '2024-02-15',
    status: 'overdue',
    supplyAmount: 254545455,
    taxAmount: 25454545,
    totalAmount: 280000000,
    paidAmount: 0,
    items: [
      { itemCode: 'ECU-A01', itemName: '자동차 ECU', quantity: 2000, unitPrice: 127273, amount: 254545455, taxAmount: 25454545 },
    ],
  },
  {
    id: '4',
    invoiceNo: 'INV-2024-0004',
    deliveryNo: 'DL-2024-0004',
    salesOrderNo: 'SO-2024-0004',
    customerCode: 'C004',
    customerName: 'SK하이닉스',
    invoiceDate: '2024-01-25',
    dueDate: '2024-02-25',
    status: 'issued',
    supplyAmount: 61818182,
    taxAmount: 6181818,
    totalAmount: 68000000,
    paidAmount: 0,
    items: [
      { itemCode: 'LED-D01', itemName: 'LED 드라이버', quantity: 3000, unitPrice: 20606, amount: 61818182, taxAmount: 6181818 },
    ],
  },
  {
    id: '5',
    invoiceNo: 'INV-2024-0005',
    deliveryNo: 'DL-2024-0005',
    salesOrderNo: 'SO-2024-0005',
    customerCode: 'C005',
    customerName: '삼성SDI',
    invoiceDate: '2024-01-23',
    dueDate: '2024-02-23',
    status: 'partial',
    supplyAmount: 31818182,
    taxAmount: 3181818,
    totalAmount: 35000000,
    paidAmount: 20000000,
    items: [
      { itemCode: 'IOT-M01', itemName: 'IoT 모듈', quantity: 700, unitPrice: 45455, amount: 31818182, taxAmount: 3181818 },
    ],
  },
];

const monthlyData = [
  { month: '10월', sales: 450000000, collection: 420000000 },
  { month: '11월', sales: 520000000, collection: 480000000 },
  { month: '12월', sales: 680000000, collection: 650000000 },
  { month: '1월', sales: 553000000, collection: 145000000 },
];

export default function SalesInvoicePage() {
  const [invoices] = useState<SalesInvoice[]>(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: SalesInvoice['status']) => {
    switch (status) {
      case 'issued': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'partial': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getStatusText = (status: SalesInvoice['status']) => {
    switch (status) {
      case 'issued': return '발행';
      case 'sent': return '전송';
      case 'paid': return '수금완료';
      case 'overdue': return '연체';
      case 'partial': return '부분수금';
    }
  };

  const getStatusIcon = (status: SalesInvoice['status']) => {
    switch (status) {
      case 'issued': return <FileText className="w-4 h-4" />;
      case 'sent': return <Clock className="w-4 h-4" />;
      case 'paid': return <CheckCircle2 className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      case 'partial': return <Receipt className="w-4 h-4" />;
    }
  };

  const stats = {
    totalSales: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    totalPaid: invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
    totalUnpaid: invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0),
    overdueCount: invoices.filter(inv => inv.status === 'overdue').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">매출 관리</h1>
          <p className="text-slate-400 text-sm mt-1">세금계산서 발행 및 매출채권 관리</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          계산서 발행
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">총 매출</p>
          <p className="text-2xl font-bold text-white mt-1">₩{(stats.totalSales / 100000000).toFixed(1)}억</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">수금액</p>
          <p className="text-2xl font-bold text-green-400 mt-1">₩{(stats.totalPaid / 100000000).toFixed(1)}억</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">미수금</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">₩{(stats.totalUnpaid / 100000000).toFixed(1)}억</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">연체 건수</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.overdueCount}건</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="계산서번호, 고객사로 검색..."
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
              <option value="issued">발행</option>
              <option value="sent">전송</option>
              <option value="paid">수금완료</option>
              <option value="overdue">연체</option>
              <option value="partial">부분수금</option>
            </select>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">계산서번호</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">고객사</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">발행일</th>
                  <th className="text-right text-slate-400 font-medium px-4 py-3 text-sm">금액</th>
                  <th className="text-right text-slate-400 font-medium px-4 py-3 text-sm">수금액</th>
                  <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => setSelectedInvoice(invoice)}
                    className={`hover:bg-slate-700/30 cursor-pointer ${selectedInvoice?.id === invoice.id ? 'bg-slate-700/50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-mono text-sm">{invoice.invoiceNo}</p>
                      <p className="text-slate-500 text-xs">{invoice.deliveryNo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{invoice.customerName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-300 text-sm">{invoice.invoiceDate}</p>
                      <p className="text-slate-500 text-xs">만기: {invoice.dueDate}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-white text-sm">
                      ₩{invoice.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400 text-sm">
                      ₩{invoice.paidAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        {getStatusText(invoice.status)}
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
            <h3 className="text-white font-bold mb-4">월별 매출/수금</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v / 100000000}억`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    formatter={(value: number) => `₩${value.toLocaleString()}`}
                  />
                  <Bar dataKey="sales" fill="#3b82f6" name="매출" />
                  <Bar dataKey="collection" fill="#22c55e" name="수금" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {selectedInvoice && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">계산서 상세</h3>
                <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded">
                  <Download className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-xs">계산서번호</p>
                  <p className="text-white font-mono">{selectedInvoice.invoiceNo}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">고객사</p>
                  <p className="text-white">{selectedInvoice.customerName}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-slate-400 text-xs">발행일</p>
                    <p className="text-white">{selectedInvoice.invoiceDate}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">만기일</p>
                    <p className="text-white">{selectedInvoice.dueDate}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">공급가액</span>
                    <span className="text-white">₩{selectedInvoice.supplyAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">세액</span>
                    <span className="text-white">₩{selectedInvoice.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-700">
                    <span className="text-slate-400">합계</span>
                    <span className="text-white">₩{selectedInvoice.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">수금액</span>
                    <span className="text-green-400">₩{selectedInvoice.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">미수금</span>
                    <span className="text-yellow-400">₩{(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString()}</span>
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
