import { useState } from 'react';
import { TrendingUp, Calendar, Filter, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const monthlySalesData = [
  { month: '7월', sales: 1250000000, orders: 45, customers: 12 },
  { month: '8월', sales: 1380000000, orders: 52, customers: 14 },
  { month: '9월', sales: 1520000000, orders: 58, customers: 15 },
  { month: '10월', sales: 1680000000, orders: 62, customers: 16 },
  { month: '11월', sales: 1820000000, orders: 68, customers: 18 },
  { month: '12월', sales: 2100000000, orders: 75, customers: 20 },
  { month: '1월', sales: 1950000000, orders: 70, customers: 19 },
];

const productSalesData = [
  { name: '스마트폰 메인보드', value: 4500000000, percent: 35 },
  { name: '자동차 ECU', value: 3200000000, percent: 25 },
  { name: '전원보드', value: 2560000000, percent: 20 },
  { name: 'LED 드라이버', value: 1600000000, percent: 12.5 },
  { name: 'IoT 모듈', value: 960000000, percent: 7.5 },
];

const customerSalesData = [
  { name: '삼성전자', sales: 4200000000, orders: 120, growth: 15.2 },
  { name: '현대모비스', sales: 2800000000, orders: 85, growth: 22.5 },
  { name: 'LG전자', sales: 2100000000, orders: 72, growth: 8.3 },
  { name: 'SK하이닉스', sales: 1500000000, orders: 55, growth: -5.2 },
  { name: '삼성SDI', sales: 1200000000, orders: 48, growth: 12.8 },
];

const regionSalesData = [
  { region: '수도권', sales: 7500000000, percent: 58.6 },
  { region: '영남권', sales: 2800000000, percent: 21.9 },
  { region: '충청권', sales: 1500000000, percent: 11.7 },
  { region: '호남권', sales: 600000000, percent: 4.7 },
  { region: '기타', sales: 400000000, percent: 3.1 },
];

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function SalesAnalysisPage() {
  const [period, setPeriod] = useState('6months');

  const stats = {
    totalSales: monthlySalesData.reduce((sum, m) => sum + m.sales, 0),
    avgMonthlySales: monthlySalesData.reduce((sum, m) => sum + m.sales, 0) / monthlySalesData.length,
    totalOrders: monthlySalesData.reduce((sum, m) => sum + m.orders, 0),
    growthRate: ((monthlySalesData[monthlySalesData.length - 1].sales - monthlySalesData[0].sales) / monthlySalesData[0].sales * 100),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">영업 분석</h1>
          <p className="text-slate-400 text-sm mt-1">매출 현황 및 영업 성과 분석</p>
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
          <p className="text-slate-400 text-sm">총 매출</p>
          <p className="text-2xl font-bold text-white mt-1">₩{(stats.totalSales / 100000000).toFixed(0)}억</p>
          <div className="flex items-center gap-1 mt-2 text-green-400 text-sm">
            <ArrowUpRight className="w-4 h-4" />
            <span>전년 대비 +18.5%</span>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">월평균 매출</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">₩{(stats.avgMonthlySales / 100000000).toFixed(1)}억</p>
          <div className="flex items-center gap-1 mt-2 text-green-400 text-sm">
            <ArrowUpRight className="w-4 h-4" />
            <span>+12.3%</span>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">총 수주 건수</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.totalOrders}건</p>
          <div className="flex items-center gap-1 mt-2 text-green-400 text-sm">
            <ArrowUpRight className="w-4 h-4" />
            <span>+22.1%</span>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">성장률</p>
          <p className={`text-2xl font-bold mt-1 ${stats.growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
          </p>
          <p className="text-slate-500 text-xs mt-2">기간 내 성장률</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-white font-bold mb-4">월별 매출 추이</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v / 100000000}억`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(value: number) => `₩${value.toLocaleString()}`}
                />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} name="매출" dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-white font-bold mb-4">제품별 매출 비중</h3>
          <div className="h-72 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productSalesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {productSalesData.map((_, index) => (
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
              {productSalesData.map((item, index) => (
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
          <h3 className="text-white font-bold mb-4">고객사별 매출</h3>
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left text-slate-400 font-medium px-3 py-2 text-sm">고객사</th>
                <th className="text-right text-slate-400 font-medium px-3 py-2 text-sm">매출</th>
                <th className="text-right text-slate-400 font-medium px-3 py-2 text-sm">수주</th>
                <th className="text-right text-slate-400 font-medium px-3 py-2 text-sm">성장률</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {customerSalesData.map((customer) => (
                <tr key={customer.name} className="hover:bg-slate-700/30">
                  <td className="px-3 py-2 text-white text-sm">{customer.name}</td>
                  <td className="px-3 py-2 text-right text-white text-sm">
                    ₩{(customer.sales / 100000000).toFixed(1)}억
                  </td>
                  <td className="px-3 py-2 text-right text-slate-300 text-sm">{customer.orders}건</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`flex items-center justify-end gap-1 text-sm ${customer.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {customer.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {customer.growth >= 0 ? '+' : ''}{customer.growth}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-white font-bold mb-4">지역별 매출</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionSalesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v / 100000000}억`} />
                <YAxis dataKey="region" type="category" stroke="#94a3b8" fontSize={12} width={60} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(value: number) => `₩${value.toLocaleString()}`}
                />
                <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {regionSalesData.map((region) => (
              <div key={region.region} className="text-center p-2 bg-slate-700/30 rounded">
                <p className="text-slate-400 text-xs">{region.region}</p>
                <p className="text-white text-sm font-medium">{region.percent}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
