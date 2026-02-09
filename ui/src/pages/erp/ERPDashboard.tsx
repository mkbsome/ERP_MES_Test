/**
 * ERP 대시보드 페이지
 * 전사적 자원관리 종합 현황
 */
import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  Truck,
  AlertTriangle,
  DollarSign,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// 월별 매출/매입 추이 데이터
const salesPurchaseData = [
  { month: '7월', sales: 145, purchase: 98 },
  { month: '8월', sales: 158, purchase: 105 },
  { month: '9월', sales: 162, purchase: 110 },
  { month: '10월', sales: 175, purchase: 118 },
  { month: '11월', sales: 168, purchase: 112 },
  { month: '12월', sales: 182, purchase: 125 },
];

// 제품군별 매출 비중
const productSalesData = [
  { name: '스마트폰 보드', value: 45, color: '#3b82f6' },
  { name: '자동차 ECU', value: 25, color: '#10b981' },
  { name: 'LED 드라이버', value: 18, color: '#f59e0b' },
  { name: 'IoT 모듈', value: 12, color: '#8b5cf6' },
];

// 최근 수주 현황
const recentOrders = [
  { id: 'SO-2024-0156', customer: '삼성전자(주)', product: '스마트폰 메인보드 A', qty: 50000, amount: 2500, dueDate: '2024-01-20', status: 'CONFIRMED' },
  { id: 'SO-2024-0157', customer: '현대자동차(주)', product: '자동차 ECU 모듈', qty: 10000, amount: 1800, dueDate: '2024-01-25', status: 'CONFIRMED' },
  { id: 'SO-2024-0158', customer: 'LG전자(주)', product: 'LED 드라이버 보드', qty: 30000, amount: 900, dueDate: '2024-01-22', status: 'PENDING' },
  { id: 'SO-2024-0159', customer: '(주)SK하이닉스', product: 'IoT 통신모듈', qty: 20000, amount: 1200, dueDate: '2024-01-28', status: 'PENDING' },
];

// 재고 현황
const inventoryStatus = [
  { category: '원자재', current: 850, min: 500, max: 1200, status: 'NORMAL' },
  { category: '재공품', current: 320, min: 200, max: 600, status: 'NORMAL' },
  { category: '완제품', current: 180, min: 300, max: 800, status: 'LOW' },
  { category: '부자재', current: 95, min: 100, max: 300, status: 'CRITICAL' },
];

// 상태 색상
const statusColors: Record<string, string> = {
  CONFIRMED: 'text-emerald-400 bg-emerald-500/10',
  PENDING: 'text-yellow-400 bg-yellow-500/10',
  NORMAL: 'text-emerald-400',
  LOW: 'text-yellow-400',
  CRITICAL: 'text-red-400',
};

export default function ERPDashboard() {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ERP 대시보드</h1>
          <p className="text-slate-400 text-sm mt-1">전사적 자원관리 종합 현황</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Calendar size={16} />
          <span>2024년 1월 15일 기준</span>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-4 gap-4">
        {/* 월 매출액 */}
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/10 border border-blue-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-sm">
              <ArrowUpRight size={16} />
              <span>8.3%</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-blue-300">월 매출액</p>
            <p className="text-3xl font-bold text-blue-400 mt-1">182억</p>
            <p className="text-xs text-slate-400 mt-1">전월 대비 +14억</p>
          </div>
        </div>

        {/* 수주 잔량 */}
        <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-700/10 border border-emerald-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-sm">
              <ArrowUpRight size={16} />
              <span>12.5%</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-emerald-300">수주 잔량</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">156건</p>
            <p className="text-xs text-slate-400 mt-1">금액 845억</p>
          </div>
        </div>

        {/* 발주 진행 */}
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/10 border border-purple-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Truck className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <ArrowDownRight size={16} />
              <span>3.2%</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-purple-300">발주 진행</p>
            <p className="text-3xl font-bold text-purple-400 mt-1">42건</p>
            <p className="text-xs text-slate-400 mt-1">입고 예정 28건</p>
          </div>
        </div>

        {/* 재고 경보 */}
        <div className="bg-gradient-to-br from-orange-600/20 to-orange-700/10 border border-orange-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-orange-300">재고 경보</p>
            <p className="text-3xl font-bold text-orange-400 mt-1">8건</p>
            <p className="text-xs text-slate-400 mt-1">안전재고 미달 품목</p>
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 매출/매입 추이 */}
        <div className="col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">월별 매출/매입 추이 (단위: 억원)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={salesPurchaseData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              <Area type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" name="매출" />
              <Area type="monotone" dataKey="purchase" stroke="#f59e0b" fillOpacity={1} fill="url(#colorPurchase)" name="매입" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 제품군별 매출 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">제품군별 매출 비중</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={productSalesData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                dataKey="value"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {productSalesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {productSalesData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <span className="text-slate-300">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 영역 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 최근 수주 현황 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-300">최근 수주 현황</h3>
            <a href="/erp/sales/order" className="text-xs text-blue-400 hover:text-blue-300">전체보기 →</a>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{order.id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${statusColors[order.status]}`}>
                      {order.status === 'CONFIRMED' ? '확정' : '대기'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{order.customer} | {order.product}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-400">{order.amount.toLocaleString()}백만</p>
                  <p className="text-xs text-slate-500">납기 {order.dueDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 재고 현황 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-300">재고 현황 (단위: 억원)</h3>
            <a href="/erp/inventory/stock" className="text-xs text-blue-400 hover:text-blue-300">전체보기 →</a>
          </div>
          <div className="space-y-4">
            {inventoryStatus.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{item.category}</span>
                  <span className={statusColors[item.status]}>{item.current}억</span>
                </div>
                <div className="relative h-2 bg-slate-700 rounded-full">
                  {/* 안전재고 범위 표시 */}
                  <div
                    className="absolute h-full bg-slate-600 rounded-full"
                    style={{
                      left: `${(item.min / item.max) * 100}%`,
                      width: `${((item.max - item.min) / item.max) * 100}%`,
                    }}
                  />
                  {/* 현재 재고 표시 */}
                  <div
                    className={`absolute h-full rounded-full ${
                      item.status === 'CRITICAL' ? 'bg-red-500' :
                      item.status === 'LOW' ? 'bg-yellow-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${(item.current / item.max) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0</span>
                  <span>안전재고: {item.min}~{item.max}</span>
                  <span>{item.max}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
