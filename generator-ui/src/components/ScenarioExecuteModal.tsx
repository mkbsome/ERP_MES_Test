import { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Database,
  Star,
  Info
} from 'lucide-react';
import clsx from 'clsx';

interface ParameterOption {
  value: string;
  label: string;
}

interface ScenarioParameter {
  name: string;
  type: 'select' | 'number' | 'date' | 'multi_select';
  label: string;
  description?: string;
  required: boolean;
  options?: ParameterOption[];
  source?: string;
  min?: number;
  max?: number;
  default?: unknown;
}

interface ScenarioInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  icon: string;
  parameters: ScenarioParameter[];
}

interface ExecutionResult {
  success: boolean;
  scenario_id: string;
  scenario_name: string;
  message: string;
  affected_records: number;
  details?: Record<string, unknown>;
  executed_at: string;
}

interface Props {
  scenario: ScenarioInfo;
  onClose: () => void;
  onExecute: (params: Record<string, unknown>) => Promise<ExecutionResult>;
}

const severityConfig = {
  low: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: '낮음', icon: 'text-blue-500' },
  medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: '중간', icon: 'text-yellow-500' },
  high: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: '높음', icon: 'text-orange-500' },
  critical: { color: 'bg-red-100 text-red-800 border-red-200', label: '치명적', icon: 'text-red-500' }
};

const impactDescriptions: Record<string, string[]> = {
  defect_spike: [
    'mes_defect 테이블에 불량 레코드 생성',
    '품질 대시보드 불량률 수치 상승',
    '예상 영향: 10~100개 레코드'
  ],
  quality_hold: [
    '해당 LOT의 상태를 HOLD로 변경',
    '출하 및 이동 제한 적용',
    '예상 영향: 1~50개 LOT'
  ],
  equipment_breakdown: [
    '설비 상태를 DOWN으로 변경',
    'mes_equipment_downtime에 기록 추가',
    '해당 라인 생산 중단'
  ],
  oee_degradation: [
    '설비 성능 지표 점진적 하락',
    'OEE 대시보드 수치 변화',
    '예상 기간: 설정된 일수 동안'
  ],
  urgent_order: [
    'erp_sales_order에 긴급 주문 생성',
    'erp_work_order에 작업지시 생성',
    'mes_production_order에 생산지시 연동'
  ],
  material_shortage: [
    'erp_inventory 재고 수량 감소',
    '안전재고 미달 알림 발생 가능',
    '생산 계획에 영향'
  ],
  // Default
  default: [
    '데이터베이스에 변경사항 적용',
    '관련 대시보드 수치 변화',
    '실행 취소 불가'
  ]
};

export default function ScenarioExecuteModal({ scenario, onClose, onExecute }: Props) {
  const [parameterValues, setParameterValues] = useState<Record<string, unknown>>({});
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'configure' | 'confirm' | 'result'>('configure');

  // Initialize with defaults
  useEffect(() => {
    const defaults: Record<string, unknown> = {};
    scenario.parameters.forEach(p => {
      if (p.default !== undefined) {
        defaults[p.name] = p.default;
      }
    });
    setParameterValues(defaults);
  }, [scenario]);

  const handleParameterChange = (name: string, value: unknown) => {
    setParameterValues(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateParameters = (): boolean => {
    const missingParams = scenario.parameters
      .filter(p => p.required && !parameterValues[p.name])
      .map(p => p.label);

    if (missingParams.length > 0) {
      setError(`필수 파라미터를 입력해주세요: ${missingParams.join(', ')}`);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateParameters()) {
      setStep('confirm');
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    setError(null);

    try {
      const result = await onExecute(parameterValues);
      setResult(result);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : '실행 중 오류가 발생했습니다.');
    } finally {
      setExecuting(false);
    }
  };

  const severity = severityConfig[scenario.severity];
  const impacts = impactDescriptions[scenario.id] || impactDescriptions.default;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className={clsx(
          'px-6 py-4 border-b flex items-center justify-between',
          scenario.severity === 'critical' ? 'bg-red-50' :
          scenario.severity === 'high' ? 'bg-orange-50' :
          'bg-gray-50'
        )}>
          <div className="flex items-center gap-3">
            <div className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              scenario.severity === 'critical' ? 'bg-red-100' :
              scenario.severity === 'high' ? 'bg-orange-100' :
              'bg-primary-100'
            )}>
              <AlertTriangle className={clsx('w-5 h-5', severity.icon)} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{scenario.name}</h2>
              <span className={clsx('text-xs px-2 py-0.5 rounded-full', severity.color)}>
                {severity.label} 영향도
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'configure' && (
            <>
              <p className="text-gray-600 text-sm mb-6">{scenario.description}</p>

              {/* Impact Preview */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 mb-2">이 시나리오를 실행하면:</p>
                    <ul className="text-sm text-amber-700 space-y-1">
                      {impacts.map((impact, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-400">•</span>
                          {impact}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Parameters */}
              <div className="space-y-4">
                {scenario.parameters.map(param => (
                  <div key={param.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {param.label}
                      {param.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {param.description && (
                      <p className="text-xs text-gray-500 mb-1">{param.description}</p>
                    )}

                    {param.type === 'select' && (
                      <select
                        value={String(parameterValues[param.name] || '')}
                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                      >
                        <option value="">선택하세요</option>
                        {param.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {param.type === 'multi_select' && (
                      <select
                        multiple
                        value={Array.isArray(parameterValues[param.name])
                          ? parameterValues[param.name] as string[]
                          : []}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                          handleParameterChange(param.name, selected);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        size={Math.min(param.options?.length || 4, 4)}
                      >
                        {param.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {param.type === 'number' && (
                      <div className="relative">
                        <input
                          type="number"
                          min={param.min}
                          max={param.max}
                          value={Number(parameterValues[param.name]) || param.default || ''}
                          onChange={(e) => handleParameterChange(param.name, Number(e.target.value))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        {param.min !== undefined && param.max !== undefined && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            {param.min} ~ {param.max}
                          </span>
                        )}
                      </div>
                    )}

                    {param.type === 'date' && (
                      <input
                        type="date"
                        value={String(parameterValues[param.name] || '')}
                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}

          {step === 'confirm' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">실행을 확인해주세요</h3>
              <p className="text-gray-600 mb-6">
                이 작업은 실제 데이터베이스를 수정합니다.<br />
                실행 후에는 되돌릴 수 없습니다.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 text-left mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">설정된 파라미터:</h4>
                <div className="space-y-1">
                  {scenario.parameters.map(param => (
                    <div key={param.name} className="flex justify-between text-sm">
                      <span className="text-gray-500">{param.label}:</span>
                      <span className="text-gray-900 font-medium">
                        {param.type === 'select'
                          ? param.options?.find(o => o.value === parameterValues[param.name])?.label || '-'
                          : String(parameterValues[param.name] || '-')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <div className="text-center py-4">
              <div className={clsx(
                'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
                result.success ? 'bg-green-100' : 'bg-red-100'
              )}>
                {result.success ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
              <h3 className={clsx(
                'text-lg font-bold mb-2',
                result.success ? 'text-green-700' : 'text-red-700'
              )}>
                {result.success ? '실행 완료!' : '실행 실패'}
              </h3>
              <p className="text-gray-600 mb-4">{result.message}</p>

              {result.affected_records > 0 && (
                <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                  <Database className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {result.affected_records}개 레코드 영향
                  </span>
                </div>
              )}

              {result.details && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    상세 정보 보기
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
          {step === 'configure' && (
            <>
              <button
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <Star className="w-4 h-4" />
                프리셋 저장
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
                >
                  다음
                  <span className="text-primary-200">→</span>
                </button>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <div className="flex gap-3 w-full justify-end">
              <button
                onClick={() => setStep('configure')}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                이전
              </button>
              <button
                onClick={handleExecute}
                disabled={executing}
                className={clsx(
                  'px-6 py-2 rounded-lg flex items-center gap-2 transition-colors',
                  executing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                )}
              >
                {executing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    실행 중...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    실행하기
                  </>
                )}
              </button>
            </div>
          )}

          {step === 'result' && (
            <div className="flex gap-3 w-full justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                닫기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
