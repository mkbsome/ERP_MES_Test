import { useState } from 'react';
import { Receipt, Search, Plus, Filter, CheckCircle2, Clock, AlertTriangle, FileText, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface InvoiceItem {
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxAmount: number;
}

interface PurchaseInvoice {
  id: string;
  invoiceNo: string;
  receiptNo: string;
  purchaseOrderNo: string;
  vendorCode: string;
  vendorName: string;
  invoiceDate: string;
  dueDate: string;
  status: 'received' | 'verified' | 'paid' | 'overdue' | 'partial';
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  items: InvoiceItem[];
}

const mockInvoices: PurchaseInvoice[] = [
  {
    id: '1',
    invoiceNo: 'PI-2024-0001',
    receiptNo: 'GR-2024-0001',
    purchaseOrderNo: 'PO-2024-0001',
    vendorCode: 'V001',
    vendorName: '삼성전기',
    invoiceDate: '2024-01-18',
    dueDate: '2024-02-18',
    status: 'paid',
    supplyAmount: 45454545,
    taxAmount: 4545455,
    totalAmount: 50000000,
    paidAmount: 50000000,
    items: [
      { itemCode: 'MLCC-001', itemName: 'MLCC 커패시터', quantity: 50000, unitPrice: 909, amount: 45454545, taxAmount: 4545455 },
    ],
  },
  {
    id: '2',
    invoiceNo: 'PI-2024-0002',
    receiptNo: 'GR-2024-0002',
    purchaseOrderNo: 'PO-2024-0002',
    vendorCode: 'V002',
    vendorName: '하이닉스',
    invoiceDate: '2024-01-20',
    dueDate: '2024-02-20',
    status: 'verified',
    supplyAmount: 181818182,
    taxAmount: 18181818,
    totalAmount: 200000000,
    paidAmount: 0,
    items: [
      { itemCode: 'DRAM-001', itemName: 'DDR4 메모리', quantity: 10000, unitPrice: 18182, amount: 181818182, taxAmount: 18181818 },
    ],
  },
  {
    id: '3',
    invoiceNo: 'PI-2024-0003',
    receiptNo: 'GR-2024-0003',
    purchaseOrderNo: 'PO-2024-0003',
    vendorCode: 'V003',
    vendorName: '대덕전자',
    invoiceDate: '2024-01-10',
    dueDate: '2024-02-10',
    status: 'overdue',
    supplyAmount: 72727273,
    taxAmount: 7272727,
    totalAmount: 80000000,
    paidAmount: 0,
    items: [
      { itemCode: 'PCB-001', itemName: 'PCB 기판', quantity: 5000, unitPrice: 14545, amount: 72727273, taxAmount: 7272727 },
    ],
  },
  {
    id: '4',
    invoiceNo: 'PI-2024-0004',
    receiptNo: 'GR-2024-0004',
    purchaseOrderNo: 'PO-2024-0004',
    vendorCode: 'V004',
    vendorName: '인탑스',
    invoiceDate: '2024-01-22',
    dueDate: '2024-02-22',
    status: 'received',
    supplyAmount: 27272727,
    taxAmount: 2727273,
    totalAmount: 30000000,
    paidAmount: 0,
    items: [
      { itemCode: 'CONN-001', itemName: '커넥터', quantity: 20000, unitPrice: 1364, amount: 27272727, taxAmount: 2727273 },
    ],
  },
  {
    id: '5',
    invoiceNo: 'PI-2024-0005',
    receiptNo: 'GR-2024-0005',
    purchaseOrderNo: 'PO-2024-0005',
    vendorCode: 'V005',
    vendorName: '심텍',
    invoiceDate: '2024-01-15',
    dueDate: '2024-02-15',
    status: 'partial',
    supplyAmount: 54545455,
    taxAmount: 5454545,
    totalAmount: 60000000,
    paidAmount: 40000000,
    items: [
      { itemCode: 'FPC-001', itemName: 'FPC 케이블', quantity: 30000, unitPrice: 1818, amount: 54545455, taxAmount: 5454545 },
    ],
  },
];

const monthlyData = [
  { month: '10월', purchase: 320000000, payment: 300000000 },
  { month: '11월', purchase: 380000000, payment: 350000000 },
  { month: '12월', purchase: 450000000, payment: 420000000 },
  { month: '1월', purchase: 420000000, payment: 90000000 },
];

export default function PurchaseInvoicePage() {
  const [invoices] = useState<PurchaseInvoice[]>(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.vendorName.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: PurchaseInvoice['status']) => {
    switch (status) {
      case 'received': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'verified': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'partial': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getStatusText = (status: PurchaseInvoice['status']) => {
    switch (status) {
      case 'received': return '접수';
      case 'verified': return '검증완료';
      case 'paid': return '지급완료';
      case 'overdue': return '연체';
      case 'partial': return '부분지급';
    }
  };

  const getStatusIcon = (status: PurchaseInvoice['status']) => {
    switch (status) {
      case 'received': return <FileText className="w-4 h-4" />;
      case 'verified': return <CheckCircle2 className="w-4 h-4" />;
      case 'paid': return <CheckCircle2 className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      case 'partial': return <Clock className="w-4 h-4" />;
    }
  };

  const stats = {
    totalPurchase: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    totalPaid: invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
    totalUnpaid: invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0),
    overdueCount: invoices.filter(inv => inv.status === 'overdue').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">매입 관리</h1>
          <p className="text-slate-400 text-sm mt-1">구매 세금계산서 및 매입채무 관리</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          매입 등록
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">총 매입</p>
          <p className="text-2xl font-bold text-white mt-1">₩{(stats.totalPurchase / 100000000).toFixed(1)}억</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">지급액</p>
          <p className="text-2xl font-bold text-green-400 mt-1">₩{(stats.totalPaid / 100000000).toFixed(1)}억</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">미지급</p>
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
                placeholder="계산서번호, 공급사로 검색..."
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
              <option value="received">접수</option>
              <option value="verified">검증완료</option>
              <option value="paid">지급완료</option>
              <option value="overdue">연체</option>
              <option value="partial">부분지급</option>
            </select>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">계산서번호</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">공급사</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">발행일</th>
                  <th className="text-right text-slate-400 font-medium px-4 py-3 text-sm">금액</th>
                  <th className="text-right text-slate-400 font-medium px-4 py-3 text-sm">지급액</th>
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
                      <p className="text-slate-500 text-xs">{invoice.purchaseOrderNo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{invoice.vendorName}</p>
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
            <h3 className="text-white font-bold mb-4">월별 매입/지급</h3>
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
                  <Bar dataKey="purchase" fill="#f59e0b" name="매입" />
                  <Bar dataKey="payment" fill="#22c55e" name="지급" />
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
                  <p className="text-slate-400 text-xs">공급사</p>
                  <p className="text-white">{selectedInvoice.vendorName}</p>
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
                    <span className="text-slate-400">지급액</span>
                    <span className="text-green-400">₩{selectedInvoice.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">미지급</span>
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
