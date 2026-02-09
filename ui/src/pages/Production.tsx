import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Filter, Download, RefreshCw, Loader2, Play, CheckCircle } from 'lucide-react';
import LineStatusCard from '../components/LineStatusCard';
import {
  useWorkOrders,
  useProductionResults,
  useDailyProductionAnalysis,
  useAllEquipmentStatus,
  useProductionWebSocket,
  useStartWorkOrder,
  useCompleteWorkOrder,
} from '../hooks';
import type { ProductionLine } from '../types';

type WorkOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export default function Production() {
  const [selectedLineType, setSelectedLineType] = useState<string>('all');

  // WebSocket 연결
  useProductionWebSocket();

  // API 데이터 조회
  const { data: workOrders, isLoading: workOrdersLoading, refetch: refetchWorkOrders } = useWorkOrders({ page_size: 50 });
  const { data: productionResults, isLoading: resultsLoading } = useProductionResults({ page_size: 100 });
  const { data: dailyAnalysis, isLoading: analysisLoading } = useDailyProductionAnalysis({ days: 7 });
  const { data: equipmentStatus, isLoading: equipmentLoading } = useAllEquipmentStatus();

  // Mutations
  const startWorkOrderMutation = useStartWorkOrder();
  const completeWorkOrderMutation = useCompleteWorkOrder();

  // 라인 데이터 변환
  const productionLines: ProductionLine[] = useMemo(() => {
    if (!equipmentStatus?.lines) return [];

    return equipmentStatus.lines.map((line: any) => ({
      id: line.line_id,
      lineCode: line.line_code,
      lineName: line.line_name,
      lineType: line.line_type,
      status: line.status as ProductionLine['status'],
      currentProduct: line.current_product,
      currentOEE: line.current_oee ?? 0,
      todayProduction: line.today_production ?? 0,
      todayDefectRate: line.today_defect_rate ?? 0,
    }));
  }, [equipmentStatus]);

  const filteredLines = useMemo(() =>
    selectedLineType === 'all'
      ? productionLines
      : productionLines.filter((l) => l.lineType === selectedLineType),
    [productionLines, selectedLineType]
  );

  // 차트 데이터 변환
  const chartData = useMemo(() => {
    if (!dailyAnalysis?.daily_data) return [];

    return dailyAnalysis.daily_data.map((d: any) => ({
      date: d.date?.slice(5) ?? '',
      양품: d.good_production ?? 0,
      불량: d.defect_count ?? 0,
      달성률: Math.round((d.achievement_rate ?? 0) * 100),
    })).reverse();
  }, [dailyAnalysis]);

  // 작업지시 테이블 데이터
  const workOrderList = useMemo(() => {
    if (!workOrders?.items) return [];

    return workOrders.items.map((wo: any) => ({
      id: wo.order_id,
      wo: wo.order_no,
      product: `${wo.product_code} ${wo.product_name || ''}`,
      line: wo.line_code,
      target: wo.target_qty ?? 0,
      actual: wo.actual_qty ?? 0,
      status: wo.status as WorkOrderStatus,
    }));
  }, [workOrders]);

  const handleStartWorkOrder = async (orderId: string) => {
    try {
      await startWorkOrderMutation.mutateAsync(orderId);
    } catch (error) {
      console.error('Failed to start work order:', error);
    }
  };

  const handleCompleteWorkOrder = async (orderId: string) => {
    try {
      await completeWorkOrderMutation.mutateAsync(orderId);
    } catch (error) {
      console.error('Failed to complete work order:', error);
    }
  };

  const handleRefresh = () => {
    refetchWorkOrders();
  };

  const isLoading = workOrdersLoading || resultsLoading || analysisLoading || equipmentLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-400">데이터 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={selectedLineType}
            onChange={(e) => setSelectedLineType(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
          >
            <option value="all">전체 라인</option>
            <option value="smt_high_speed">SMT High Speed</option>
            <option value="smt_mid_speed">SMT Mid Speed</option>
            <option value="smt_flex">SMT Flex</option>
            <option value="tht">THT</option>
            <option value="assembly">Assembly</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-400 hover:text-white hover:border-slate-600 transition-colors">
            <Filter size={16} />
            필터
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
          >
            <RefreshCw size={16} />
            새로고침
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg text-sm text-white hover:bg-primary-700 transition-colors">
            <Download size={16} />
            내보내기
          </button>
        </div>
      </div>

      {/* Production Summary Chart */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">일별 생산 현황 (최근 7일)</h2>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(value) => (value / 1000).toFixed(0) + 'K'}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f1f5f9' }}
              formatter={(value: number) => [value.toLocaleString(), '']}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => (
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
              )}
            />
            <Bar dataKey="양품" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
            <Bar dataKey="불량" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line Status Grid */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">라인별 상세 현황</h2>
          <span className="text-sm text-slate-400">{filteredLines.length}개 라인</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredLines.map((line) => (
            <LineStatusCard key={line.id} line={line} />
          ))}
        </div>
      </div>

      {/* Production Orders Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">금일 작업지시 현황</h2>
          <span className="text-sm text-slate-400">{workOrderList.length}건</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">작업지시</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">제품</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">라인</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">목표수량</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">생산수량</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">진척률</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase">상태</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase">작업</th>
              </tr>
            </thead>
            <tbody>
              {workOrderList.map((order) => {
                const progress = order.target > 0 ? (order.actual / order.target) * 100 : 0;
                return (
                  <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-sm font-mono text-white">{order.wo}</td>
                    <td className="py-3 px-4 text-sm text-slate-300">{order.product}</td>
                    <td className="py-3 px-4 text-sm text-slate-300">{order.line}</td>
                    <td className="py-3 px-4 text-sm text-right text-slate-300">{order.target.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right text-white font-medium">{order.actual.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : progress >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-400 w-12 text-right">{progress.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : order.status === 'in_progress'
                          ? 'bg-blue-500/20 text-blue-400'
                          : order.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {order.status === 'completed' ? '완료' :
                         order.status === 'in_progress' ? '진행중' :
                         order.status === 'pending' ? '대기' : '취소'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleStartWorkOrder(order.id)}
                            disabled={startWorkOrderMutation.isPending}
                            className="p-1 text-green-400 hover:bg-green-500/20 rounded transition-colors disabled:opacity-50"
                            title="작업 시작"
                          >
                            <Play size={16} />
                          </button>
                        )}
                        {order.status === 'in_progress' && (
                          <button
                            onClick={() => handleCompleteWorkOrder(order.id)}
                            disabled={completeWorkOrderMutation.isPending}
                            className="p-1 text-blue-400 hover:bg-blue-500/20 rounded transition-colors disabled:opacity-50"
                            title="작업 완료"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {workOrderList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    작업지시 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
