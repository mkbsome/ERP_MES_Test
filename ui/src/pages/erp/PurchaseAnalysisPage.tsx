import { useState } from 'react';
import { TrendingDown, Calendar, Filter, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const monthlyPurchaseData = [
  { month: '7월', purchase: 850000000, orders: 125, vendors: 45 },
  { month: '8월', purchase: 920000000, orders: 138, vendors: 48 },
  { month: '9월', purchase: 980000000, orders: 145, vendors: 50 },
  { month: '10월', purchase: 1050000000, orders: 152, vendors: 52 },
  { month: '11월', purchase: 1120000000, orders: 165, vendors: 55 },
  { month: '12월', purchase: 1280000000, orders: 180, vendors: 58 },
  { month: '1월', purchase: 1150000000, orders: 168, vendors: 56 },
];

const categoryPurchaseData = [
  { name: '전자부품', value: 3200000000, percent: 42 },
  { name: 'PCB/기판', value: 1900000000, percent: 25 },
  { name: '커넥터/케이블', value: 1140000000, percent: 15 },
  { name: '반도체', value: 912000000, percent: 12 },
  { name: '기타', value: 456000000, percent: 6 },
];

const vendorPurchaseData = [
  { name: '삼성전기', purchase: 1500000000, orders: 180, leadTime: 3, quality: 99.2 },
  { name: '하이닉스', purchase: 1200000000, orders: 150, leadTime: 5, quality: 98.8 },
  { name: '대덕전자', purchase: 900000000, orders: 120, leadTime: 4, quality: 99.5 },
  { name: '인탑스', purchase: 600000000, orders: 95, leadTime: 3, quality: 98.5 },
  { name: '심텍', purchase: 450000000, orders: 85, leadTime: 4, quality: 99.0 },
];

const priceChangeData = [
  { item: 'MLCC', current: 950, previous: 900, change: 5.6 },
  { item: 'DDR4', current: 18500, previous: 19200, change: -3.6 },
  { item: 'PCB', current: 15200, previous: 14800, change: 2.7 },
  { item: 'FPC', current: 1850, previous: 1900, change: -2.6 },
  { item: '커넥터', current: 1380, previous: 1350, change: 2.2 },
];

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function PurchaseAnalysisPage() {
  const [period, setPeriod] = useState('6months');

  const stats = {
    totalPurchase: monthlyPurchaseData.reduce((sum, m) => sum + m.purchase, 0),
    avgMonthlyPurchase: monthlyPurchaseData.reduce((sum, m) => sum + m.purchase, 0) / monthlyPurchaseData.length,
    totalOrders: monthlyPurchaseData.reduce((sum, m) => sum + m.orders, 0),
    activeVendors: 58,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">구매 분석</h1>
          <p className="text-slate-400 text-sm mt-1">구매 현황 및 공급사 성과 분석</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setPeriod('3months')}
              className={`px-3 py-1.5 rounded text-sm ${period === '3months' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              3개월
            </button>
            <button
              onClick={() => setPeriod('6months')}
              className={`px-3 py-1.5 rounded text-sm ${period === '6months' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              6개월
            </button>
            <button
              onClick={() => setPeriod('1year')}
              className={`px-3 py-1.5 rounded text-sm ${period === '1year' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              1년
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
            <Download className="w-4 h-4" />
            리포트
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">총 구매액</p>
          <p className="text-2xl font-bold text-white mt-1">₩{(stats.totalPurchase / 100000000).toFixed(0)}억</p>
          <div className="flex items-center gap-1 mt-2 text-yellow-400 text-sm">
            <ArrowUpRight className="w-4 h-4" />
            <span>전년 대비 +12.3%</span>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">월평균 구매</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">₩{(stats.avgMonthlyPurchase / 100000000).toFixed(1)}억</p>
          <div className="flex items-center gap-1 mt-2 text-green-400 text-sm">
            <ArrowDownRight className="w-4 h-4" />
            <span>-3.2% (효율화)</span>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">총 발주 건수</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.totalOrders.toLocaleString()}건</p>
          <div className="flex items-center gap-1 mt-2 text-green-400 text-sm">
            <ArrowUpRight className="w-4 h-4" />
            <span>+15.8%</span>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">활성 공급사</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats.activeVendors}개</p>
          <p className="text-slate-500 text-xs mt-2">전월 대비 +3개</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-white font-bold mb-4">월별 구매 추이</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyPurchaseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v / 100000000}억`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(value: number) => `₩${value.toLocaleString()}`}
                />
                <Legend />
                <Line type="monotone" dataKey="purchase" stroke="#f59e0b" strokeWidth={2} name="구매액" dot={{ fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-white font-bold mb-4">카테고리별 구매 비중</h3>
          <div className="h-72 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPurchaseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryPurchaseData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    formatter={(value: number) => `₩${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {categoryPurchaseData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-slate-300 text-sm flex-1">{item.name}</span>
                  <span className="text-white text-sm font-medium">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-white font-bold mb-4">공급사별 구매 현황</h3>
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left text-slate-400 font-medium px-3 py-2 text-sm">공급사</th>
                <th className="text-right text-slate-400 font-medium px-3 py-2 text-sm">구매액</th>
                <th className="text-right text-slate-400 font-medium px-3 py-2 text-sm">리드타임</th>
                <th className="text-right text-slate-400 font-medium px-3 py-2 text-sm">품질</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {vendorPurchaseData.map((vendor) => (
                <tr key={vendor.name} className="hover:bg-slate-700/30">
                  <td className="px-3 py-2 text-white text-sm">{vendor.name}</td>
                  <td className="px-3 py-2 text-right text-white text-sm">
                    ₩{(vendor.purchase / 100000000).toFixed(1)}억
                  </td>
                  <td className="px-3 py-2 text-right text-slate-300 text-sm">{vendor.leadTime}일</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`text-sm ${vendor.quality >= 99 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {vendor.quality}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-white font-bold mb-4">주요 품목 가격 변동</h3>
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left text-slate-400 font-medium px-3 py-2 text-sm">품목</th>
                <th className="text-right text-slate-400 font-medium px-3 py-2 text-sm">현재가</th>
                <th className="text-right text-slate-400 font-medium px-3 py-2 text-sm">이전가</th>
                <th className="text-right text-slate-400 font-medium px-3 py-2 text-sm">변동</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {priceChangeData.map((item) => (
                <tr key={item.item} className="hover:bg-slate-700/30">
                  <td className="px-3 py-2 text-white text-sm">{item.item}</td>
                  <td className="px-3 py-2 text-right text-white text-sm">₩{item.current.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-slate-400 text-sm">₩{item.previous.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`flex items-center justify-end gap-1 text-sm ${item.change >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {item.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {item.change >= 0 ? '+' : ''}{item.change}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">평균 가격 변동률</span>
              <span className="text-yellow-400">+0.86%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
