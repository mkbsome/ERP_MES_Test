import { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  BarChart3,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import clsx from 'clsx';

type TabType = 'stock' | 'transactions' | 'analysis';

// Mock data
const inventoryItems = [
  {
    itemCode: 'CAP-0603-10UF',
    itemName: '적층세라믹콘덴서 10μF',
    category: '커패시터',
    warehouse: 'WH-A01',
    currentQty: 125000,
    safetyQty: 50000,
    unit: 'EA',
    unitPrice: 25,
    status: 'normal',
  },
  {
    itemCode: 'RES-0402-10K',
    itemName: '칩저항 10KΩ',
    category: '저항',
    warehouse: 'WH-A01',
    currentQty: 32000,
    safetyQty: 50000,
    unit: 'EA',
    unitPrice: 5,
    status: 'below_safety',
  },
  {
    itemCode: 'IC-STM32F4',
    itemName: 'STM32F407VGT6 MCU',
    category: 'IC',
    warehouse: 'WH-B02',
    currentQty: 2500,
    safetyQty: 1000,
    unit: 'EA',
    unitPrice: 15000,
    status: 'normal',
  },
  {
    itemCode: 'PCB-MAIN-V3',
    itemName: '메인보드 PCB V3.0',
    category: 'PCB',
    warehouse: 'WH-C01',
    currentQty: 450,
    safetyQty: 500,
    unit: 'EA',
    unitPrice: 8500,
    status: 'below_safety',
  },
  {
    itemCode: 'CON-USB-C',
    itemName: 'USB Type-C 커넥터',
    category: '커넥터',
    warehouse: 'WH-A03',
    currentQty: 85000,
    safetyQty: 30000,
    unit: 'EA',
    unitPrice: 350,
    status: 'excess',
  },
  {
    itemCode: 'LED-0805-WHT',
    itemName: 'LED 0805 백색',
    category: 'LED',
    warehouse: 'WH-A02',
    currentQty: 0,
    safetyQty: 20000,
    unit: 'EA',
    unitPrice: 45,
    status: 'out_of_stock',
  },
];

const transactions = [
  {
    id: 'TRX-2024-5678',
    date: '2024-12-15 14:30',
    type: 'receipt',
    itemCode: 'CAP-0603-10UF',
    itemName: '적층세라믹콘덴서 10μF',
    qty: 50000,
    refDoc: 'GR-2024-0789',
  },
  {
    id: 'TRX-2024-5677',
    date: '2024-12-15 11:20',
    type: 'issue',
    itemCode: 'IC-STM32F4',
    itemName: 'STM32F407VGT6 MCU',
    qty: 500,
    refDoc: 'WO-2024-0456',
  },
  {
    id: 'TRX-2024-5676',
    date: '2024-12-15 09:45',
    type: 'issue',
    itemCode: 'RES-0402-10K',
    itemName: '칩저항 10KΩ',
    qty: 8000,
    refDoc: 'WO-2024-0455',
  },
  {
    id: 'TRX-2024-5675',
    date: '2024-12-14 16:00',
    type: 'adjustment',
    itemCode: 'LED-0805-WHT',
    itemName: 'LED 0805 백색',
    qty: -200,
    refDoc: 'ADJ-2024-0123',
  },
];

const inventoryStatusData = [
  { name: '정상', value: 2450, color: '#22c55e' },
  { name: '안전재고 미달', value: 180, color: '#f59e0b' },
  { name: '과잉재고', value: 120, color: '#3b82f6' },
  { name: '재고없음', value: 50, color: '#ef4444' },
];

const inventoryTrendData = [
  { month: '7월', value: 820 },
  { month: '8월', value: 780 },
  { month: '9월', value: 850 },
  { month: '10월', value: 810 },
  { month: '11월', value: 870 },
  { month: '12월', value: 920 },
];

const categoryData = [
  { category: '커패시터', value: 280 },
  { category: '저항', value: 150 },
  { category: 'IC', value: 420 },
  { category: 'PCB', value: 180 },
  { category: '커넥터', value: 90 },
];

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  normal: { label: '정상', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  below_safety: { label: '안전재고 미달', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  excess: { label: '과잉', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  out_of_stock: { label: '재고없음', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

const transactionTypeConfig: Record<string, { label: string; color: string }> = {
  receipt: { label: '입고', color: 'text-green-400' },
  issue: { label: '출고', color: 'text-red-400' },
  adjustment: { label: '조정', color: 'text-yellow-400' },
  transfer: { label: '이동', color: 'text-blue-400' },
};

export default function Inventory() {
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'stock', name: '재고현황', icon: Package },
    { id: 'transactions', name: '입출고이력', icon: ArrowUpRight },
    { id: 'analysis', name: '재고분석', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Package size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">총 품목</p>
              <p className="text-xl font-bold text-white">2,800종</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/20">
              <Warehouse size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">재고금액</p>
              <p className="text-xl font-bold text-white">₩8.7억</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-500/20">
              <AlertTriangle size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">안전재고 미달</p>
              <p className="text-xl font-bold text-white">180종</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <TrendingUp size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">회전율</p>
              <p className="text-xl font-bold text-white">12.5회/년</p>
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
      {activeTab === 'stock' && (
        <div className="card">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="품목코드, 품목명 검색..."
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
            <button className="flex items-center gap-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:bg-slate-600">
              <Download size={16} />
              엑셀
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">품목코드</th>
                  <th className="text-left px-4 py-3">품목명</th>
                  <th className="text-left px-4 py-3">분류</th>
                  <th className="text-center px-4 py-3">창고</th>
                  <th className="text-right px-4 py-3">현재고</th>
                  <th className="text-right px-4 py-3">안전재고</th>
                  <th className="text-right px-4 py-3">재고금액</th>
                  <th className="text-center px-4 py-3">상태</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((item) => (
                  <tr key={item.itemCode} className="table-row">
                    <td className="table-cell font-medium text-primary-400">{item.itemCode}</td>
                    <td className="table-cell text-slate-200">{item.itemName}</td>
                    <td className="table-cell text-slate-300">{item.category}</td>
                    <td className="table-cell text-center text-slate-300">{item.warehouse}</td>
                    <td className="table-cell text-right">
                      <span className={clsx(
                        item.currentQty < item.safetyQty ? 'text-yellow-400' : 'text-slate-200'
                      )}>
                        {item.currentQty.toLocaleString()} {item.unit}
                      </span>
                    </td>
                    <td className="table-cell text-right text-slate-400">
                      {item.safetyQty.toLocaleString()} {item.unit}
                    </td>
                    <td className="table-cell text-right text-slate-200">
                      ₩{(item.currentQty * item.unitPrice).toLocaleString()}
                    </td>
                    <td className="table-cell text-center">
                      <span className={clsx(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        statusConfig[item.status].bgColor,
                        statusConfig[item.status].color
                      )}>
                        {statusConfig[item.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-400">총 2,800건 중 1-6 표시</p>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-50" disabled>
                <ChevronLeft size={18} />
              </button>
              <button className="px-3 py-1 bg-primary-600 rounded text-sm text-white">1</button>
              <button className="px-3 py-1 hover:bg-slate-700 rounded text-sm text-slate-400">2</button>
              <button className="px-3 py-1 hover:bg-slate-700 rounded text-sm text-slate-400">3</button>
              <span className="text-slate-500">...</span>
              <button className="px-3 py-1 hover:bg-slate-700 rounded text-sm text-slate-400">467</button>
              <button className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="card">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="거래번호, 품목코드 검색..."
                  className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 w-64"
                />
              </div>
              <select className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-primary-500">
                <option value="">전체 유형</option>
                <option value="receipt">입고</option>
                <option value="issue">출고</option>
                <option value="adjustment">조정</option>
              </select>
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:bg-slate-600">
              <Download size={16} />
              엑셀
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">거래번호</th>
                  <th className="text-left px-4 py-3">일시</th>
                  <th className="text-center px-4 py-3">유형</th>
                  <th className="text-left px-4 py-3">품목코드</th>
                  <th className="text-left px-4 py-3">품목명</th>
                  <th className="text-right px-4 py-3">수량</th>
                  <th className="text-left px-4 py-3">참조문서</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((trx) => (
                  <tr key={trx.id} className="table-row">
                    <td className="table-cell font-medium text-primary-400">{trx.id}</td>
                    <td className="table-cell text-slate-300">{trx.date}</td>
                    <td className="table-cell text-center">
                      <span className={clsx('font-medium', transactionTypeConfig[trx.type].color)}>
                        {transactionTypeConfig[trx.type].label}
                      </span>
                    </td>
                    <td className="table-cell text-slate-300">{trx.itemCode}</td>
                    <td className="table-cell text-slate-200">{trx.itemName}</td>
                    <td className="table-cell text-right">
                      <span className={clsx(
                        trx.type === 'receipt' ? 'text-green-400' :
                        trx.type === 'issue' ? 'text-red-400' : 'text-yellow-400'
                      )}>
                        {trx.type === 'receipt' ? '+' : ''}{trx.qty.toLocaleString()}
                      </span>
                    </td>
                    <td className="table-cell text-slate-400">{trx.refDoc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">재고 상태 분포</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryStatusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {inventoryStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}종`, '품목수']}
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

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">재고금액 추이</h3>
              <span className="text-xs text-slate-400">단위: 백만원</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={inventoryTrendData}>
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
                  <Line type="monotone" dataKey="value" name="재고금액" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">분류별 재고금액</h3>
              <span className="text-xs text-slate-400">단위: 백만원</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis type="category" dataKey="category" stroke="#94a3b8" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" name="재고금액" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">재고 지표</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-400">평균 보유일수</p>
                <p className="text-2xl font-bold text-white mt-1">28일</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingDown size={14} className="text-green-400" />
                  <span className="text-xs text-green-400">-3일 vs 전월</span>
                </div>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-400">재고 회전율</p>
                <p className="text-2xl font-bold text-white mt-1">12.5회/년</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp size={14} className="text-green-400" />
                  <span className="text-xs text-green-400">+0.8 vs 전월</span>
                </div>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-400">재고 정확도</p>
                <p className="text-2xl font-bold text-white mt-1">98.5%</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp size={14} className="text-green-400" />
                  <span className="text-xs text-green-400">+0.3% vs 전월</span>
                </div>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-400">Dead Stock 비율</p>
                <p className="text-2xl font-bold text-white mt-1">2.1%</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingDown size={14} className="text-green-400" />
                  <span className="text-xs text-green-400">-0.5% vs 전월</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
