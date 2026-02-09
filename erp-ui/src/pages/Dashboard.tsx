import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Wifi,
  WifiOff,
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
import { useDashboardSummary, useERPDashboardWebSocket } from '../hooks';

const iconMap: Record<string, any> = {
  '이번 달 매출': DollarSign,
  '미결 수주': ShoppingCart,
  '재고 금액': Package,
  '미입고 발주': Truck,
};

const colorMap: Record<string, string> = {
  '이번 달 매출': 'from-blue-500 to-blue-600',
  '미결 수주': 'from-green-500 to-green-600',
  '재고 금액': 'from-purple-500 to-purple-600',
  '미입고 발주': 'from-orange-500 to-orange-600',
};

export default function Dashboard() {
  const { data, isLoading, error, refetch, isFetching } = useDashboardSummary();
  const { isConnected } = useERPDashboardWebSocket();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
        <span className="ml-2 text-slate-400">데이터 로딩중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-slate-400">데이터를 불러오는데 실패했습니다.</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg text-white"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const { kpis, monthly_sales, inventory_status, recent_orders, alerts } = data || {
    kpis: [],
    monthly_sales: [],
    inventory_status: [],
    recent_orders: [],
    alerts: [],
  };

  return (
    <div className="space-y-6">
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">ERP 대시보드</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi size={16} className="text-green-400" />
            ) : (
              <WifiOff size={16} className="text-slate-500" />
            )}
            <span className={clsx('text-xs', isConnected ? 'text-green-400' : 'text-slate-500')}>
              {isConnected ? '실시간 연결' : '오프라인'}
            </span>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300"
          >
            <RefreshCw size={14} className={clsx(isFetching && 'animate-spin')} />
            새로고침
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = iconMap[kpi.title] || DollarSign;
          const gradient = colorMap[kpi.title] || 'from-blue-500 to-blue-600';

          return (
            <div key={kpi.title} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">{kpi.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{kpi.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {kpi.trend === 'up' ? (
                      <ArrowUpRight size={16} className="text-green-400" />
                    ) : (
                      <ArrowDownRight size={16} className="text-red-400" />
                    )}
                    <span
                      className={clsx(
                        'text-sm',
                        kpi.trend === 'up' ? 'text-green-400' : 'text-red-400'
                      )}
                    >
                      {Math.abs(kpi.change)}%
                    </span>
                    <span className="text-xs text-slate-500">{kpi.change_period}</span>
                  </div>
                </div>
                <div className={clsx('p-3 rounded-lg bg-gradient-to-br', gradient)}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="card-title">월별 매출/수주 현황</h3>
            <span className="text-xs text-slate-400">단위: 백만원</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly_sales}>
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
                <Bar dataKey="sales" name="매출" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="orders" name="수주" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">재고 상태</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventory_status}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {inventory_status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
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
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">최근 수주</h3>
            <button className="text-sm text-primary-400 hover:text-primary-300">전체보기</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">주문번호</th>
                  <th className="text-left px-4 py-3">고객사</th>
                  <th className="text-right px-4 py-3">금액</th>
                  <th className="text-center px-4 py-3">상태</th>
                </tr>
              </thead>
              <tbody>
                {recent_orders.map((order) => (
                  <tr key={order.id} className="table-row">
                    <td className="table-cell font-medium text-slate-200">{order.id}</td>
                    <td className="table-cell text-slate-300">{order.customer}</td>
                    <td className="table-cell text-right text-slate-300">
                      ₩{(order.amount / 10000).toLocaleString()}만
                    </td>
                    <td className="table-cell text-center">
                      <span
                        className={clsx(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          order.status === 'approved' && 'bg-green-500/20 text-green-400',
                          order.status === 'pending' && 'bg-yellow-500/20 text-yellow-400',
                          order.status === 'draft' && 'bg-slate-500/20 text-slate-400'
                        )}
                      >
                        {order.status === 'approved' && '승인'}
                        {order.status === 'pending' && '대기'}
                        {order.status === 'draft' && '초안'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">알림</h3>
            <span className="text-xs text-slate-400">최근 24시간</span>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={clsx(
                  'flex items-start gap-3 p-3 rounded-lg',
                  alert.type === 'warning' && 'bg-yellow-500/10',
                  alert.type === 'error' && 'bg-red-500/10',
                  alert.type === 'info' && 'bg-blue-500/10',
                  alert.type === 'success' && 'bg-green-500/10'
                )}
              >
                {alert.type === 'warning' && <AlertTriangle size={18} className="text-yellow-400 mt-0.5" />}
                {alert.type === 'error' && <AlertTriangle size={18} className="text-red-400 mt-0.5" />}
                {alert.type === 'info' && <Clock size={18} className="text-blue-400 mt-0.5" />}
                {alert.type === 'success' && <CheckCircle size={18} className="text-green-400 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200">{alert.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
