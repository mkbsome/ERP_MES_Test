import { useEffect, useState } from 'react';
import {
  History as HistoryIcon,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  Zap,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wrench,
  Timer,
  Package,
  Calendar,
  Users,
  FileX,
  Beaker,
  TrendingUp,
  UserMinus,
  AlertOctagon,
  Gauge,
  Box,
  Loader2,
} from 'lucide-react';
import { scenarioModifierApi } from '../services/api';
import type { ModificationHistory, RevertResponse } from '../types/api';
import { format } from 'date-fns';

// Icon mapping for all anomaly types
const ANOMALY_ICONS: Record<string, React.ReactNode> = {
  // Quality
  defect_spike: <AlertTriangle className="w-5 h-5" />,
  yield_degradation: <TrendingDown className="w-5 h-5" />,
  quality_hold: <AlertOctagon className="w-5 h-5" />,
  spc_violation: <Gauge className="w-5 h-5" />,
  // Equipment
  oee_drop: <Zap className="w-5 h-5" />,
  equipment_breakdown: <Wrench className="w-5 h-5" />,
  cycle_time_increase: <Timer className="w-5 h-5" />,
  downtime_spike: <Clock className="w-5 h-5" />,
  maintenance_overdue: <Calendar className="w-5 h-5" />,
  // Production
  production_delay: <Clock className="w-5 h-5" />,
  underproduction: <TrendingDown className="w-5 h-5" />,
  schedule_deviation: <Calendar className="w-5 h-5" />,
  bottleneck: <AlertTriangle className="w-5 h-5" />,
  shift_variance: <Users className="w-5 h-5" />,
  // Material
  material_shortage: <Package className="w-5 h-5" />,
  incoming_reject: <FileX className="w-5 h-5" />,
  lot_contamination: <Beaker className="w-5 h-5" />,
  // Business
  delivery_delay: <Truck className="w-5 h-5" />,
  order_cancellation: <XCircle className="w-5 h-5" />,
  supplier_delay: <Box className="w-5 h-5" />,
  demand_spike: <TrendingUp className="w-5 h-5" />,
  // HR
  mass_absence: <UserMinus className="w-5 h-5" />,
  overtime_spike: <Clock className="w-5 h-5" />,
};

// Name mapping for all anomaly types
const ANOMALY_NAMES: Record<string, string> = {
  // Quality
  defect_spike: '불량률 급증',
  yield_degradation: '수율 점진적 저하',
  quality_hold: '품질 홀드',
  spc_violation: 'SPC 관리한계 이탈',
  // Equipment
  oee_drop: 'OEE 저하',
  equipment_breakdown: '설비 고장',
  cycle_time_increase: '사이클 타임 증가',
  downtime_spike: '다운타임 급증',
  maintenance_overdue: '예방보전 지연',
  // Production
  production_delay: '생산 지연',
  underproduction: '과소 생산',
  schedule_deviation: '일정 이탈',
  bottleneck: '공정 병목',
  shift_variance: '교대별 성능 편차',
  // Material
  material_shortage: '자재 부족',
  incoming_reject: '수입검사 불합격',
  lot_contamination: 'LOT 오염',
  // Business
  delivery_delay: '납품 지연',
  order_cancellation: '주문 취소',
  supplier_delay: '공급업체 납기 지연',
  demand_spike: '수요 급증',
  // HR
  mass_absence: '대량 결근',
  overtime_spike: '초과근무 급증',
};

// Color mapping for anomaly categories
const ANOMALY_COLORS: Record<string, string> = {
  // Quality - Red
  defect_spike: '#ef4444',
  yield_degradation: '#ef4444',
  quality_hold: '#ef4444',
  spc_violation: '#ef4444',
  // Equipment - Orange
  oee_drop: '#f97316',
  equipment_breakdown: '#f97316',
  cycle_time_increase: '#f97316',
  downtime_spike: '#f97316',
  maintenance_overdue: '#f97316',
  // Production - Blue
  production_delay: '#3b82f6',
  underproduction: '#3b82f6',
  schedule_deviation: '#3b82f6',
  bottleneck: '#3b82f6',
  shift_variance: '#3b82f6',
  // Material - Green
  material_shortage: '#10b981',
  incoming_reject: '#10b981',
  lot_contamination: '#10b981',
  // Business - Purple
  delivery_delay: '#8b5cf6',
  order_cancellation: '#8b5cf6',
  supplier_delay: '#8b5cf6',
  demand_spike: '#8b5cf6',
  // HR - Pink
  mass_absence: '#ec4899',
  overtime_spike: '#ec4899',
};

export default function History() {
  const [history, setHistory] = useState<ModificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [revertResult, setRevertResult] = useState<RevertResponse | null>(null);
  const [revertError, setRevertError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scenarioModifierApi.getHistory(100);
      setHistory(data);
    } catch (err) {
      setError('이력을 불러오는 데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRevert = async (id: string) => {
    if (!confirm('정말로 이 수정을 복원하시겠습니까?\n원본 데이터로 되돌아갑니다.')) {
      return;
    }

    setRevertingId(id);
    setRevertResult(null);
    setRevertError(null);

    try {
      const result = await scenarioModifierApi.revert(id);
      setRevertResult(result);
      fetchHistory(); // Refresh the list
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setRevertError(axiosError.response?.data?.detail || '복원에 실패했습니다.');
    } finally {
      setRevertingId(null);
    }
  };

  const getAnomalyColor = (type: string): string => {
    return ANOMALY_COLORS[type] || '#6b7280';
  };

  const getAnomalyIcon = (type: string): React.ReactNode => {
    return ANOMALY_ICONS[type] || <AlertCircle className="w-5 h-5" />;
  };

  const getAnomalyName = (type: string): string => {
    return ANOMALY_NAMES[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="ml-3 text-slate-400">이력 로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center">
        <AlertCircle className="w-6 h-6 text-red-400 mr-3" />
        <span className="text-red-400 flex-1">{error}</span>
        <button
          onClick={fetchHistory}
          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // Count revertable vs non-revertable
  const revertableCount = history.filter(h => h.can_revert).length;
  const revertedCount = history.length - revertableCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">수정 이력</h2>
          <p className="text-slate-400 mt-1">시나리오 적용 이력 및 복원 관리</p>
        </div>
        <button
          onClick={fetchHistory}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </button>
      </div>

      {/* Revert Result */}
      {revertResult && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-6 h-6 text-emerald-400 mr-3" />
          <span className="text-emerald-300 flex-1">
            {revertResult.message}
          </span>
          <button
            onClick={() => setRevertResult(null)}
            className="text-emerald-400 hover:text-emerald-300"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Revert Error */}
      {revertError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center">
          <XCircle className="w-6 h-6 text-red-400 mr-3" />
          <span className="text-red-400 flex-1">{revertError}</span>
          <button
            onClick={() => setRevertError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">전체 수정</p>
          <p className="text-2xl font-bold text-white">{history.length}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">복원 가능</p>
          <p className="text-2xl font-bold text-blue-400">
            {revertableCount}
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">복원됨</p>
          <p className="text-2xl font-bold text-emerald-400">
            {revertedCount}
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">총 수정 레코드</p>
          <p className="text-2xl font-bold text-purple-400">
            {history.reduce((sum, h) => sum + h.records_modified, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center">
          <HistoryIcon className="w-5 h-5 mr-2 text-slate-400" />
          <h3 className="text-lg font-semibold text-white">수정 이력 목록</h3>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <HistoryIcon className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p>아직 수정 이력이 없습니다.</p>
            <p className="text-sm mt-2 text-slate-500">시나리오를 적용하면 여기에 이력이 표시됩니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">유형</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">모드</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">수정 레코드</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">적용 시간</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {history.map((item) => {
                  const color = getAnomalyColor(item.anomaly_type);
                  return (
                    <tr key={item.id} className={!item.can_revert ? 'bg-slate-800/30' : 'hover:bg-slate-700/30'}>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div
                            className="p-2 rounded-lg mr-3"
                            style={{ backgroundColor: `${color}20` }}
                          >
                            <div style={{ color }}>
                              {getAnomalyIcon(item.anomaly_type)}
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {getAnomalyName(item.anomaly_type)}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">{item.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-400">
                        {item.modification_mode === 'update' ? '업데이트' : item.modification_mode}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-white">
                        {item.records_modified.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-400">
                        {format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm')}
                      </td>
                      <td className="px-4 py-4">
                        {item.can_revert ? (
                          <span className="inline-flex items-center px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            활성
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            복원됨
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {item.can_revert && (
                          <button
                            onClick={() => handleRevert(item.id)}
                            disabled={revertingId === item.id}
                            className="flex items-center px-3 py-1 bg-slate-600 text-slate-200 rounded hover:bg-slate-500 transition disabled:opacity-50"
                          >
                            {revertingId === item.id ? (
                              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4 mr-1" />
                            )}
                            복원
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note about data structure */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="font-semibold text-blue-300 mb-2">참고사항</h4>
        <ul className="text-sm text-blue-400 space-y-1">
          <li>• 복원 시 원본 데이터 값으로 되돌아갑니다.</li>
          <li>• 이미 복원된 수정은 다시 복원할 수 없습니다.</li>
          <li>• 수정 이력은 서버 재시작 시 초기화됩니다.</li>
        </ul>
      </div>
    </div>
  );
}
