import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  TrendingDown,
  Wrench,
  Zap,
  Clock,
  RefreshCw,
  PackageMinus,
  XCircle,
  FileX,
  Truck,
  UserMinus,
  Clock4,
  Ban,
  CheckCircle,
  Settings,
  Factory,
  Package,
  Briefcase,
  Users,
  Loader2,
  ChevronDown,
  ChevronRight,
  History,
  Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import apiClient from '../api/client';
import MiniDashboard from '../components/MiniDashboard';
import ScenarioExecuteModal from '../components/ScenarioExecuteModal';
import QuickActionCard from '../components/QuickActionCard';

// Types
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

interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
  scenario_count: number;
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

// Icon mappings
const iconMap: Record<string, React.FC<{ className?: string }>> = {
  AlertTriangle,
  AlertOctagon,
  TrendingDown,
  Wrench,
  Zap,
  Clock,
  RefreshCw,
  PackageMinus,
  XCircle,
  FileX,
  Truck,
  UserMinus,
  Clock4,
  Ban,
  CheckCircle,
  Settings,
  Factory,
  Package,
  Briefcase,
  Users
};

const categoryIconMap: Record<string, React.FC<{ className?: string }>> = {
  quality: CheckCircle,
  equipment: Settings,
  production: Factory,
  material: Package,
  business: Briefcase,
  hr: Users
};

const categoryColors: Record<string, string> = {
  quality: 'text-green-600 bg-green-100',
  equipment: 'text-orange-600 bg-orange-100',
  production: 'text-blue-600 bg-blue-100',
  material: 'text-purple-600 bg-purple-100',
  business: 'text-indigo-600 bg-indigo-100',
  hr: 'text-pink-600 bg-pink-100'
};

// Quick action scenarios (most commonly used)
const QUICK_ACTION_IDS = [
  'defect_spike',
  'equipment_breakdown',
  'urgent_order',
  'material_shortage',
  'oee_degradation',
  'supplier_delay'
];

export default function RealtimeScenarios() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['quality', 'equipment']));
  const [selectedScenario, setSelectedScenario] = useState<ScenarioInfo | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catResponse, scenResponse] = await Promise.all([
        apiClient.get('/generator/realtime-scenarios/categories'),
        apiClient.get('/generator/realtime-scenarios/list')
      ]);
      setCategories(catResponse.data);
      setScenarios(scenResponse.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleExecute = async (params: Record<string, unknown>): Promise<ExecutionResult> => {
    if (!selectedScenario) throw new Error('No scenario selected');

    const response = await apiClient.post(
      `/generator/realtime-scenarios/${selectedScenario.id}/execute`,
      { parameters: params }
    );

    const result: ExecutionResult = response.data;
    setExecutionHistory(prev => [result, ...prev].slice(0, 20));
    return result;
  };

  const getScenariosByCategory = (categoryId: string) => {
    return scenarios.filter(s => s.category === categoryId);
  };

  const quickActionScenarios = scenarios.filter(s => QUICK_ACTION_IDS.includes(s.id));

  const getIcon = (iconName: string) => iconMap[iconName] || AlertTriangle;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-7 h-7 text-primary-500" />
            실시간 시나리오
          </h1>
          <p className="text-gray-500 mt-1">
            시나리오를 실행하여 즉시 테스트 데이터를 생성합니다
          </p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            showHistory
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <History className="w-4 h-4" />
          실행 이력
          {executionHistory.length > 0 && (
            <span className="bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {executionHistory.length}
            </span>
          )}
        </button>
      </div>

      {/* Mini Dashboard */}
      <MiniDashboard />

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold text-gray-900">빠른 실행</h2>
          <span className="text-xs text-gray-400">자주 사용하는 시나리오</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActionScenarios.map(scenario => (
            <QuickActionCard
              key={scenario.id}
              id={scenario.id}
              name={scenario.name}
              description={scenario.description}
              severity={scenario.severity}
              icon={scenario.icon}
              onClick={() => setSelectedScenario(scenario)}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Scenarios by Category */}
        <div className={clsx(
          'flex-1 space-y-3 transition-all',
          showHistory ? 'w-2/3' : 'w-full'
        )}>
          {categories.map(category => {
            const isExpanded = expandedCategories.has(category.id);
            const categoryScenarios = getScenariosByCategory(category.id);
            const Icon = categoryIconMap[category.id] || Settings;
            const colorClass = categoryColors[category.id] || 'text-gray-600 bg-gray-100';

            return (
              <div key={category.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx('p-2 rounded-lg', colorClass)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-xs text-gray-500">{category.scenario_count}개 시나리오</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Scenarios */}
                {isExpanded && (
                  <div className="px-5 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryScenarios.map(scenario => {
                        const ScenarioIcon = getIcon(scenario.icon);
                        return (
                          <button
                            key={scenario.id}
                            onClick={() => setSelectedScenario(scenario)}
                            className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-all hover:shadow-sm group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow">
                                <ScenarioIcon className="w-4 h-4 text-gray-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 text-sm truncate">
                                    {scenario.name}
                                  </span>
                                  <span className={clsx(
                                    'px-1.5 py-0.5 text-[10px] rounded font-medium',
                                    scenario.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                    scenario.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                    scenario.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-blue-100 text-blue-700'
                                  )}>
                                    {scenario.severity === 'critical' ? '치명' :
                                     scenario.severity === 'high' ? '높음' :
                                     scenario.severity === 'medium' ? '중간' : '낮음'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {scenario.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Execution History Sidebar */}
        {showHistory && (
          <div className="w-80 bg-white rounded-xl shadow-sm border p-4 h-fit sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <History className="w-4 h-4" />
              최근 실행 이력
            </h3>
            {executionHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                아직 실행 이력이 없습니다
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {executionHistory.map((result, idx) => (
                  <div
                    key={idx}
                    className={clsx(
                      'p-3 rounded-lg border text-sm',
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {result.success ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                        )}
                        <span className="font-medium text-gray-900">
                          {result.scenario_name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(result.executed_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className={clsx(
                      'text-xs',
                      result.success ? 'text-green-700' : 'text-red-700'
                    )}>
                      {result.message}
                    </p>
                    {result.affected_records > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {result.affected_records}개 레코드
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Execute Modal */}
      {selectedScenario && (
        <ScenarioExecuteModal
          scenario={selectedScenario}
          onClose={() => setSelectedScenario(null)}
          onExecute={handleExecute}
        />
      )}
    </div>
  );
}
