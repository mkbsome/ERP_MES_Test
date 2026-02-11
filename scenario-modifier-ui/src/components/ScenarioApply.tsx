import { useState } from 'react';
import {
  AlertTriangle,
  Zap,
  TrendingDown,
  Clock,
  Truck,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Info,
  Wrench,
  Timer,
  Package,
  ShoppingCart,
  Users,
  Building2,
  Gauge,
  Box,
  AlertOctagon,
  Calendar,
  FileX,
  Beaker,
  TrendingUp,
  UserMinus,
  ClockIcon,
} from 'lucide-react';
import { scenarioModifierApi } from '../services/api';
import type { ModificationMode, ScenarioApplyResponse } from '../types/api';
import { format, subDays } from 'date-fns';

// Extended anomaly type to include all 23 scenarios
type ExtendedAnomalyType =
  | 'defect_spike' | 'yield_degradation' | 'quality_hold' | 'spc_violation'
  | 'oee_drop' | 'equipment_breakdown' | 'cycle_time_increase' | 'downtime_spike' | 'maintenance_overdue'
  | 'production_delay' | 'underproduction' | 'schedule_deviation' | 'bottleneck' | 'shift_variance'
  | 'material_shortage' | 'incoming_reject' | 'lot_contamination'
  | 'delivery_delay' | 'order_cancellation' | 'supplier_delay' | 'demand_spike'
  | 'mass_absence' | 'overtime_spike';

interface AnomalyCategory {
  name: string;
  color: string;
  icon: React.ReactNode;
  anomalies: {
    type: ExtendedAnomalyType;
    name: string;
    description: string;
    icon: React.ReactNode;
  }[];
}

const ANOMALY_CATEGORIES: AnomalyCategory[] = [
  {
    name: '품질 이상',
    color: '#ef4444',
    icon: <AlertTriangle className="w-5 h-5" />,
    anomalies: [
      { type: 'defect_spike', name: '불량률 급증', description: '생산 결과의 불량 수량을 급격히 증가시킵니다', icon: <AlertTriangle className="w-5 h-5" /> },
      { type: 'yield_degradation', name: '수율 점진적 저하', description: '시간에 따라 점진적으로 수율이 저하됩니다', icon: <TrendingDown className="w-5 h-5" /> },
      { type: 'quality_hold', name: '품질 홀드', description: 'LOT를 품질 홀드 상태로 변경합니다', icon: <AlertOctagon className="w-5 h-5" /> },
      { type: 'spc_violation', name: 'SPC 관리한계 이탈', description: '통계적 관리한계를 벗어나는 편차를 생성합니다', icon: <Gauge className="w-5 h-5" /> },
    ],
  },
  {
    name: '설비 이상',
    color: '#f97316',
    icon: <Wrench className="w-5 h-5" />,
    anomalies: [
      { type: 'oee_drop', name: 'OEE 저하', description: '설비 종합효율을 저하시킵니다', icon: <Zap className="w-5 h-5" /> },
      { type: 'equipment_breakdown', name: '설비 고장', description: '설비 고장 및 비가동 이벤트를 생성합니다', icon: <Wrench className="w-5 h-5" /> },
      { type: 'cycle_time_increase', name: '사이클 타임 증가', description: '생산 사이클 시간을 증가시킵니다', icon: <Timer className="w-5 h-5" /> },
      { type: 'downtime_spike', name: '다운타임 급증', description: '설비 가동중단 이벤트를 대량 생성합니다', icon: <Clock className="w-5 h-5" /> },
      { type: 'maintenance_overdue', name: '예방보전 지연', description: '설비 유지보수 일정을 지연시킵니다', icon: <Calendar className="w-5 h-5" /> },
    ],
  },
  {
    name: '생산 이상',
    color: '#3b82f6',
    icon: <Building2 className="w-5 h-5" />,
    anomalies: [
      { type: 'production_delay', name: '생산 지연', description: '생산 일정을 지연시킵니다', icon: <Clock className="w-5 h-5" /> },
      { type: 'underproduction', name: '과소 생산', description: '목표 대비 생산량을 감소시킵니다', icon: <TrendingDown className="w-5 h-5" /> },
      { type: 'schedule_deviation', name: '일정 이탈', description: '계획 대비 실적 편차를 증가시킵니다', icon: <Calendar className="w-5 h-5" /> },
      { type: 'bottleneck', name: '공정 병목', description: '특정 공정의 사이클 타임을 급증시킵니다', icon: <AlertTriangle className="w-5 h-5" /> },
      { type: 'shift_variance', name: '교대별 성능 편차', description: '교대조별 생산 성능 차이를 생성합니다', icon: <Users className="w-5 h-5" /> },
    ],
  },
  {
    name: '자재 이상',
    color: '#10b981',
    icon: <Package className="w-5 h-5" />,
    anomalies: [
      { type: 'material_shortage', name: '자재 부족', description: '자재 부족으로 인한 생산량 감소', icon: <Package className="w-5 h-5" /> },
      { type: 'incoming_reject', name: '수입검사 불합격', description: '구매자재의 품질 불합격을 생성합니다', icon: <FileX className="w-5 h-5" /> },
      { type: 'lot_contamination', name: 'LOT 오염', description: 'LOT를 오염 상태로 변경합니다', icon: <Beaker className="w-5 h-5" /> },
    ],
  },
  {
    name: '영업/구매 이상',
    color: '#8b5cf6',
    icon: <ShoppingCart className="w-5 h-5" />,
    anomalies: [
      { type: 'delivery_delay', name: '납품 지연', description: '고객 납품 일정을 지연시킵니다', icon: <Truck className="w-5 h-5" /> },
      { type: 'order_cancellation', name: '주문 취소', description: '기존 수주를 취소 상태로 변경합니다', icon: <XCircle className="w-5 h-5" /> },
      { type: 'supplier_delay', name: '공급업체 납기 지연', description: '구매발주의 입고 예정일을 지연시킵니다', icon: <Box className="w-5 h-5" /> },
      { type: 'demand_spike', name: '수요 급증', description: '주문 수량과 금액을 급격히 증가시킵니다', icon: <TrendingUp className="w-5 h-5" /> },
    ],
  },
  {
    name: '인사 이상',
    color: '#ec4899',
    icon: <Users className="w-5 h-5" />,
    anomalies: [
      { type: 'mass_absence', name: '대량 결근', description: '인력 부족으로 인한 생산 영향을 시뮬레이션합니다', icon: <UserMinus className="w-5 h-5" /> },
      { type: 'overtime_spike', name: '초과근무 급증', description: '초과근무로 인한 피로 효과를 생성합니다', icon: <ClockIcon className="w-5 h-5" /> },
    ],
  },
];

// Flatten all anomalies for lookup
const ALL_ANOMALIES = ANOMALY_CATEGORIES.flatMap(cat =>
  cat.anomalies.map(a => ({ ...a, categoryColor: cat.color, categoryName: cat.name }))
);

export default function ScenarioApply() {
  const [selectedType, setSelectedType] = useState<ExtendedAnomalyType>('defect_spike');
  const [mode, setMode] = useState<ModificationMode>('last_n_days');
  const [lastNDays, setLastNDays] = useState(7);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [intensity, setIntensity] = useState(0.5);
  const [targetLine, setTargetLine] = useState('');
  const [targetEquipment, setTargetEquipment] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('품질 이상');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScenarioApplyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedInfo = ALL_ANOMALIES.find(a => a.type === selectedType)!;

  const handleApply = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const request = {
        anomaly_type: selectedType,
        modification_mode: mode,
        days: mode === 'last_n_days' ? lastNDays : undefined,
        start_date: mode === 'date_range' ? startDate : undefined,
        end_date: mode === 'date_range' ? endDate : undefined,
        intensity,
        target_line: targetLine || undefined,
        target_equipment: targetEquipment || undefined,
      };

      const response = await scenarioModifierApi.apply(request);
      setResult(response);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(axiosError.response?.data?.detail || '시나리오 적용에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">시나리오 적용</h2>
        <p className="text-slate-400 mt-1">AI 이상 탐지 테스트를 위해 기존 데이터에 이상 징후를 주입합니다</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anomaly Type Selection - Accordion Style */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">이상 유형 선택 (총 {ALL_ANOMALIES.length}개)</h3>
          <div className="space-y-3">
            {ANOMALY_CATEGORIES.map((category) => (
              <div key={category.name} className="border border-slate-700 rounded-lg overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 transition"
                >
                  <div className="flex items-center">
                    <div
                      className="p-2 rounded-lg mr-3"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <div style={{ color: category.color }}>{category.icon}</div>
                    </div>
                    <span className="font-medium text-white">{category.name}</span>
                    <span className="ml-2 text-sm text-slate-400">({category.anomalies.length})</span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${expandedCategory === category.name ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Category Items */}
                {expandedCategory === category.name && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-slate-800/30">
                    {category.anomalies.map((anomaly) => (
                      <button
                        key={anomaly.type}
                        onClick={() => setSelectedType(anomaly.type)}
                        className={`p-3 rounded-lg border-2 transition text-left ${
                          selectedType === anomaly.type
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center mb-1">
                          <div
                            className="p-1.5 rounded mr-2"
                            style={{ backgroundColor: `${category.color}20`, color: category.color }}
                          >
                            {anomaly.icon}
                          </div>
                          <span className="font-medium text-white text-sm">{anomaly.name}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 ml-9">{anomaly.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Type Info */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2 text-emerald-400" />
            선택된 시나리오
          </h3>
          <div
            className="p-4 rounded-lg mb-4"
            style={{ backgroundColor: `${selectedInfo.categoryColor}15` }}
          >
            <div className="flex items-center mb-2">
              <div
                className="p-2 rounded-lg mr-2"
                style={{ backgroundColor: `${selectedInfo.categoryColor}25`, color: selectedInfo.categoryColor }}
              >
                {selectedInfo.icon}
              </div>
              <div>
                <span className="font-bold text-white">{selectedInfo.name}</span>
                <p className="text-xs" style={{ color: selectedInfo.categoryColor }}>{selectedInfo.categoryName}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mt-2">{selectedInfo.description}</p>
          </div>

          {/* Intensity Preview */}
          <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
            <p className="text-sm font-medium text-slate-300 mb-2">예상 영향도</p>
            <div className="flex items-center">
              <div className="flex-1 bg-slate-600 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${intensity * 100}%`,
                    backgroundColor: intensity < 0.3 ? '#10b981' : intensity < 0.7 ? '#f59e0b' : '#ef4444'
                  }}
                />
              </div>
              <span className="ml-3 text-sm font-medium" style={{
                color: intensity < 0.3 ? '#10b981' : intensity < 0.7 ? '#f59e0b' : '#ef4444'
              }}>
                {intensity < 0.3 ? '경미' : intensity < 0.7 ? '보통' : '심각'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">적용 설정</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">적용 방식</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as ModificationMode)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="last_n_days">최근 N일</option>
              <option value="date_range">날짜 범위 지정</option>
            </select>
          </div>

          {/* Mode-specific inputs */}
          {mode === 'last_n_days' ? (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">최근 일수</label>
              <input
                type="number"
                value={lastNDays}
                onChange={(e) => setLastNDays(Number(e.target.value))}
                min={1}
                max={365}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">시작일</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">종료일</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </>
          )}

          {/* Intensity */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              강도: {(intensity * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              min={0.1}
              max={1.0}
              step={0.1}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>약함</span>
              <span>강함</span>
            </div>
          </div>
        </div>

        {/* Optional fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              대상 라인 (선택사항)
            </label>
            <input
              type="text"
              value={targetLine}
              onChange={(e) => setTargetLine(e.target.value)}
              placeholder="예: LINE-001"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              대상 설비 (선택사항)
            </label>
            <input
              type="text"
              value={targetEquipment}
              onChange={(e) => setTargetEquipment(e.target.value)}
              placeholder="예: EQ-001"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Apply Button */}
        <div className="mt-6">
          <button
            onClick={handleApply}
            disabled={loading}
            className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                적용 중...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                시나리오 적용
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-6 h-6 text-emerald-400 mr-2" />
            <h3 className="text-lg font-semibold text-emerald-300">시나리오 적용 완료</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-emerald-400">수정 ID</p>
              <p className="font-mono text-sm text-white">{(result.details?.modification_id as string)?.slice(0, 8) || '-'}...</p>
            </div>
            <div>
              <p className="text-sm text-emerald-400">수정된 레코드</p>
              <p className="font-bold text-lg text-white">{result.records_modified.toLocaleString()}건</p>
            </div>
            <div>
              <p className="text-sm text-emerald-400">적용 기간</p>
              <p className="text-sm text-white">{result.date_range.start} ~ {result.date_range.end}</p>
            </div>
            <div>
              <p className="text-sm text-emerald-400">이상 유형</p>
              <p className="text-sm text-white">{result.anomaly_type}</p>
            </div>
          </div>
          {result.details && Object.keys(result.details).length > 0 && (
            <div className="mt-4 pt-4 border-t border-emerald-500/30">
              <p className="text-sm text-emerald-400 mb-2">상세 정보:</p>
              <pre className="text-xs bg-emerald-500/10 p-2 rounded overflow-x-auto text-emerald-200">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            </div>
          )}
          {result.revert_command && (
            <div className="mt-4 pt-4 border-t border-emerald-500/30">
              <p className="text-sm text-emerald-400 mb-2">되돌리기 명령:</p>
              <code className="text-xs bg-emerald-500/10 p-2 rounded block text-emerald-200">{result.revert_command}</code>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <div className="flex items-center">
            <XCircle className="w-6 h-6 text-red-400 mr-2" />
            <h3 className="text-lg font-semibold text-red-300">오류 발생</h3>
          </div>
          <p className="mt-2 text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
