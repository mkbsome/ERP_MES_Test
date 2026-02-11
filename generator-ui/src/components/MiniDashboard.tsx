import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Activity,
  Package,
  TrendingUp,
  Loader2,
  RefreshCw
} from 'lucide-react';
import clsx from 'clsx';
// import apiClient from '../api/client'; // TODO: Re-enable when API is ready

interface SystemStatus {
  defectRate: number;
  defectTrend: 'up' | 'down' | 'stable';
  equipmentUtilization: number;
  equipmentDown: number;
  inventoryStatus: 'normal' | 'warning' | 'critical';
  lowStockItems: number;
  productionProgress: number;
  delayedOrders: number;
}

export default function MiniDashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // 실제 API가 있다면 호출, 없으면 mock 데이터
      // const response = await apiClient.get('/dashboard/mes/summary');
      // setStatus(response.data);

      // Mock data for now
      setStatus({
        defectRate: 2.3,
        defectTrend: 'stable',
        equipmentUtilization: 87.5,
        equipmentDown: 1,
        inventoryStatus: 'normal',
        lowStockItems: 3,
        productionProgress: 78,
        delayedOrders: 2
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return (
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4">
        <div className="flex items-center justify-center h-20">
          <Loader2 className="w-6 h-6 animate-spin text-white/50" />
        </div>
      </div>
    );
  }

  if (!status) return null;

  const getInventoryColor = () => {
    switch (status.inventoryStatus) {
      case 'critical': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  const getInventoryLabel = () => {
    switch (status.inventoryStatus) {
      case 'critical': return '위험';
      case 'warning': return '주의';
      default: return '정상';
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-white/70 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          현재 시스템 상태
        </h2>
        <button
          onClick={fetchStatus}
          className="text-white/50 hover:text-white/80 transition-colors"
          title="새로고침"
        >
          <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* 불량률 */}
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/60">불량률</span>
            <AlertTriangle className={clsx(
              'w-4 h-4',
              status.defectRate > 5 ? 'text-red-400' :
              status.defectRate > 3 ? 'text-yellow-400' : 'text-green-400'
            )} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{status.defectRate}</span>
            <span className="text-sm text-white/60">%</span>
          </div>
          {status.defectTrend !== 'stable' && (
            <div className={clsx(
              'text-xs mt-1',
              status.defectTrend === 'up' ? 'text-red-400' : 'text-green-400'
            )}>
              {status.defectTrend === 'up' ? '↑ 상승 중' : '↓ 하락 중'}
            </div>
          )}
        </div>

        {/* 설비 가동률 */}
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/60">설비 가동률</span>
            <Activity className={clsx(
              'w-4 h-4',
              status.equipmentUtilization > 80 ? 'text-green-400' :
              status.equipmentUtilization > 60 ? 'text-yellow-400' : 'text-red-400'
            )} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{status.equipmentUtilization}</span>
            <span className="text-sm text-white/60">%</span>
          </div>
          {status.equipmentDown > 0 && (
            <div className="text-xs mt-1 text-red-400">
              {status.equipmentDown}대 정지 중
            </div>
          )}
        </div>

        {/* 재고 현황 */}
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/60">재고 현황</span>
            <Package className={clsx('w-4 h-4', getInventoryColor())} />
          </div>
          <div className={clsx('text-2xl font-bold', getInventoryColor())}>
            {getInventoryLabel()}
          </div>
          {status.lowStockItems > 0 && (
            <div className="text-xs mt-1 text-yellow-400">
              {status.lowStockItems}개 품목 부족
            </div>
          )}
        </div>

        {/* 생산 진행률 */}
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/60">생산 진행률</span>
            <TrendingUp className={clsx(
              'w-4 h-4',
              status.productionProgress > 70 ? 'text-green-400' :
              status.productionProgress > 50 ? 'text-yellow-400' : 'text-red-400'
            )} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{status.productionProgress}</span>
            <span className="text-sm text-white/60">%</span>
          </div>
          {status.delayedOrders > 0 && (
            <div className="text-xs mt-1 text-orange-400">
              {status.delayedOrders}건 지연
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 text-right">
        <span className="text-xs text-white/40">
          {lastUpdated.toLocaleTimeString()} 기준
        </span>
      </div>
    </div>
  );
}
