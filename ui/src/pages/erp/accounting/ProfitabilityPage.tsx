import { useState } from 'react';
import { TrendingUp, Package, Users, DollarSign, BarChart3, Filter, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, LineChart, Line } from 'recharts';

interface ProductProfitability {
  productCode: string;
  productName: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  margin: number;
  quantity: number;
  contribution: number;
}

interface CustomerProfitability {
  customerCode: string;
  customerName: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  margin: number;
  orderCount: number;
  avgOrderValue: number;
}

const productData: ProductProfitability[] = [
  { productCode: 'SMB-A01', productName: '스마트폰 메인보드 A', revenue: 1250000000, cost: 875000000, grossProfit: 375000000, margin: 30.0, quantity: 10000, contribution: 29.4 },
  { productCode: 'SMB-B01', productName: '스마트폰 메인보드 B', revenue: 980000000, cost: 715000000, grossProfit: 265000000, margin: 27.0, quantity: 8500, contribution: 20.8 },
  { productCode: 'PWB-A01', productName: 'PCB 기판 A', revenue: 650000000, cost: 455000000, grossProfit: 195000000, margin: 30.0, quantity: 25000, contribution: 15.3 },
  { productCode: 'ECU-001', productName: '차량용 ECU', revenue: 520000000, cost: 390000000, grossProfit: 130000000, margin: 25.0, quantity: 4000, contribution: 10.2 },
  { productCode: 'BMS-001', productName: '배터리 관리시스템', revenue: 450000000, cost: 315000000, grossProfit: 135000000, margin: 30.0, quantity: 3000, contribution: 10.6 },
  { productCode: 'TB-001', productName: 'TV 제어보드', revenue: 380000000, cost: 285000000, grossProfit: 95000000, margin: 25.0, quantity: 5500, contribution: 7.5 },
  { productCode: 'MTB-001', productName: '메모리 테스트보드', revenue: 270000000, cost: 202500000, grossProfit: 67500000, margin: 25.0, quantity: 1500, contribution: 5.3 },
];

const customerData: CustomerProfitability[] = [
  { customerCode: 'C001', customerName: '삼성전자', revenue: 1450000000, cost: 1015000000, grossProfit: 435000000, margin: 30.0, orderCount: 45, avgOrderValue: 32222222 },
  { customerCode: 'C005', customerName: '삼성SDI', revenue: 850000000, cost: 595000000, grossProfit: 255000000, margin: 30.0, orderCount: 28, avgOrderValue: 30357143 },
  { customerCode: 'C002', customerName: 'LG전자', revenue: 680000000, cost: 510000000, grossProfit: 170000000, margin: 25.0, orderCount: 35, avgOrderValue: 19428571 },
  { customerCode: 'C003', customerName: 'SK하이닉스', revenue: 520000000, cost: 390000000, grossProfit: 130000000, margin: 25.0, orderCount: 22, avgOrderValue: 23636364 },
  { customerCode: 'C004', customerName: '현대모비스', revenue: 450000000, cost: 337500000, grossProfit: 112500000, margin: 25.0, orderCount: 18, avgOrderValue: 25000000 },
];

const marginTrend = [
  { month: '8월', avgMargin: 27.5, topMargin: 32.0, bottomMargin: 22.0 },
  { month: '9월', avgMargin: 27.8, topMargin: 31.5, bottomMargin: 23.0 },
  { month: '10월', avgMargin: 28.0, topMargin: 31.0, bottomMargin: 24.0 },
  { month: '11월', avgMargin: 28.2, topMargin: 31.5, bottomMargin: 24.5 },
  { month: '12월', avgMargin: 28.5, topMargin: 32.0, bottomMargin: 25.0 },
  { month: '1월', avgMargin: 29.0, topMargin: 32.5, bottomMargin: 25.5 },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function ProfitabilityPage() {
  const [viewType, setViewType] = useState<'product' | 'customer'>('product');

  const totalRevenue = productData.reduce((sum, p) => sum + p.revenue, 0);
  const totalProfit = productData.reduce((sum, p) => sum + p.grossProfit, 0);
  const avgMargin = (totalProfit / totalRevenue * 100).toFixed(1);

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
          <h1 className="text-2xl font-bold text-white">수익성 분석</h1>
          <p className="text-slate-400">제품별, 고객별 수익성 분석</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            리포트 다운로드
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">총 매출</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalRevenue)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-blue-300 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">총 이익</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalProfit)}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-300 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">평균 마진율</p>
              <p className="text-2xl font-bold text-white mt-1">{avgMargin}%</p>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-300 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm">분석 대상</p>
              <p className="text-2xl font-bold text-white mt-1">
                {viewType === 'product' ? `${productData.length}개 제품` : `${customerData.length}개 고객`}
              </p>
            </div>
            {viewType === 'product' ? (
              <Package className="w-10 h-10 text-cyan-300 opacity-80" />
            ) : (
              <Users className="w-10 h-10 text-cyan-300 opacity-80" />
            )}
          </div>
        </div>
      </div>

      {/* View Type Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewType('product')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            viewType === 'product'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <Package className="w-4 h-4" />
          제품별 분석
        </button>
        <button
          onClick={() => setViewType('customer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            viewType === 'customer'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          고객별 분석
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profitability Chart */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">
            {viewType === 'product' ? '제품별 매출/이익' : '고객별 매출/이익'}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={viewType === 'product' ? productData : customerData}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
              <YAxis
                type="category"
                dataKey={viewType === 'product' ? 'productName' : 'customerName'}
                stroke="#94a3b8"
                fontSize={11}
                width={120}
                tick={{ fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: number) => [formatCurrency(value), '']}
              />
              <Bar dataKey="revenue" fill="#3b82f6" name="매출" radius={[0, 4, 4, 0]} />
              <Bar dataKey="grossProfit" fill="#10b981" name="이익" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Margin Distribution */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">마진율 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                type="number"
                dataKey="revenue"
                name="매출"
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(v) => formatCurrency(v)}
              />
              <YAxis
                type="number"
                dataKey="margin"
                name="마진율"
                stroke="#94a3b8"
                fontSize={12}
                unit="%"
              />
              <ZAxis type="number" dataKey="grossProfit" range={[100, 500]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: number, name: string) => {
                  if (name === '매출') return [formatCurrency(value), name];
                  if (name === '마진율') return [`${value}%`, name];
                  return [value, name];
                }}
              />
              <Scatter
                data={viewType === 'product' ? productData : customerData}
                fill="#8b5cf6"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contribution Pie */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">이익 기여도</h3>
          <div className="flex items-center">
            <ResponsiveContainer width="50%" height={250}>
              <PieChart>
                <Pie
                  data={viewType === 'product' ? productData : customerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="grossProfit"
                  nameKey={viewType === 'product' ? 'productName' : 'customerName'}
                >
                  {(viewType === 'product' ? productData : customerData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/2 space-y-2 max-h-[250px] overflow-y-auto">
              {(viewType === 'product' ? productData : customerData).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-300 text-sm truncate max-w-[100px]">
                      {viewType === 'product' ? item.productName : (item as CustomerProfitability).customerName}
                    </span>
                  </div>
                  <span className="text-white text-sm">{formatCurrency(item.grossProfit)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Margin Trend */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">마진율 추이</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={marginTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[20, 35]} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: number) => [`${value}%`, '']}
              />
              <Line type="monotone" dataKey="topMargin" stroke="#10b981" strokeWidth={2} name="최고 마진" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="avgMargin" stroke="#3b82f6" strokeWidth={3} name="평균 마진" dot={{ fill: '#3b82f6' }} />
              <Line type="monotone" dataKey="bottomMargin" stroke="#ef4444" strokeWidth={2} name="최저 마진" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-white font-medium">
            {viewType === 'product' ? '제품별 수익성 상세' : '고객별 수익성 상세'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  {viewType === 'product' ? '제품' : '고객'}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">매출</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">원가</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">이익</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">마진율</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  {viewType === 'product' ? '판매량' : '주문건수'}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  {viewType === 'product' ? '기여도' : '평균주문금액'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {(viewType === 'product' ? productData : customerData).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium">
                        {viewType === 'product' ? (item as ProductProfitability).productName : (item as CustomerProfitability).customerName}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {viewType === 'product' ? (item as ProductProfitability).productCode : (item as CustomerProfitability).customerCode}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-white">{item.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{item.cost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-green-400 font-medium">{item.grossProfit.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`${item.margin >= 28 ? 'text-green-400' : item.margin >= 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {item.margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {viewType === 'product'
                      ? (item as ProductProfitability).quantity.toLocaleString()
                      : (item as CustomerProfitability).orderCount
                    }
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {viewType === 'product'
                      ? `${(item as ProductProfitability).contribution.toFixed(1)}%`
                      : formatCurrency((item as CustomerProfitability).avgOrderValue)
                    }
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
