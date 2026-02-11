import { useEffect, useState } from 'react';
import {
  Database,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  Factory,
  ShoppingCart,
  AlertTriangle
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { useGeneratorStore } from '../stores/generatorStore';
import type { GeneratorJob } from '../types/generator';

// Mock data for demonstration
const mockRecentJobs: GeneratorJob[] = [
  {
    id: 'job-001',
    status: 'completed',
    config: {
      start_date: '2024-07-01',
      end_date: '2024-12-31',
      tenant_id: 'T001',
      random_seed: 42,
      enabled_scenarios: [],
      output_format: 'json'
    },
    progress: {
      current_day: 184,
      total_days: 184,
      current_date: '2024-12-31',
      percentage: 100,
      records_generated: {
        mes: { production_orders: 15000, production_results: 450000, equipment_status: 25000, quality_inspections: 120000, defect_records: 18000, material_consumption: 80000 },
        erp: { sales_orders: 8500, purchase_orders: 5500, inventory_transactions: 35000, journal_entries: 45000, attendance_records: 65000 }
      }
    },
    created_at: '2025-01-15T10:30:00Z',
    started_at: '2025-01-15T10:30:05Z',
    completed_at: '2025-01-15T10:45:30Z'
  },
  {
    id: 'job-002',
    status: 'failed',
    config: {
      start_date: '2024-07-01',
      end_date: '2024-09-30',
      tenant_id: 'T001',
      random_seed: 123,
      enabled_scenarios: [],
      output_format: 'database'
    },
    progress: {
      current_day: 45,
      total_days: 92,
      current_date: '2024-08-15',
      percentage: 48.9,
      records_generated: {
        mes: { production_orders: 3600, production_results: 108000, equipment_status: 6000, quality_inspections: 28800, defect_records: 4320, material_consumption: 19200 },
        erp: { sales_orders: 2040, purchase_orders: 1320, inventory_transactions: 8400, journal_entries: 10800, attendance_records: 15600 }
      }
    },
    created_at: '2025-01-14T14:00:00Z',
    started_at: '2025-01-14T14:00:03Z',
    error_message: 'Database connection timeout'
  }
];

export default function Dashboard() {
  const { scenarios, selectedScenarios, setJobHistory } = useGeneratorStore();
  const [stats, setStats] = useState({
    totalScenarios: 55,
    enabledScenarios: 0,
    totalJobs: 0,
    completedJobs: 0
  });

  useEffect(() => {
    // Load mock data
    setJobHistory(mockRecentJobs);

    setStats({
      totalScenarios: scenarios.length || 55,
      enabledScenarios: selectedScenarios.size,
      totalJobs: mockRecentJobs.length,
      completedJobs: mockRecentJobs.filter(j => j.status === 'completed').length
    });
  }, [scenarios, selectedScenarios, setJobHistory]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-500">ERP/MES 데이터 생성기 현황</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="전체 시나리오"
          value={stats.totalScenarios}
          subtitle="MES 25개 + ERP 30개"
          icon={<Database className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="활성화된 시나리오"
          value={stats.enabledScenarios}
          subtitle={`${((stats.enabledScenarios / stats.totalScenarios) * 100).toFixed(0)}% 선택됨`}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="생성 작업"
          value={stats.totalJobs}
          subtitle={`완료: ${stats.completedJobs}건`}
          icon={<Play className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="시뮬레이션 기간"
          value="6개월"
          subtitle="2024-07-01 ~ 2024-12-31"
          icon={<Clock className="w-5 h-5" />}
          color="yellow"
        />
      </div>

      {/* Quick Actions & Recent Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 시작</h2>
          <div className="space-y-3">
            <a
              href="/scenarios"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">시나리오 설정</p>
                <p className="text-sm text-gray-500">55개 시나리오 중 활성화할 항목 선택</p>
              </div>
            </a>
            <a
              href="/generate"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">데이터 생성</p>
                <p className="text-sm text-gray-500">시뮬레이션 기간 설정 후 생성 시작</p>
              </div>
            </a>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 생성 작업</h2>
          <div className="space-y-3">
            {mockRecentJobs.map(job => (
              <div
                key={job.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {job.config.start_date} ~ {job.config.end_date}
                    </p>
                    <p className="text-sm text-gray-500">
                      {job.status === 'completed'
                        ? `완료 - ${formatNumber(Object.values(job.progress.records_generated.mes).reduce((a, b) => a + b, 0) + Object.values(job.progress.records_generated.erp).reduce((a, b) => a + b, 0))} 레코드`
                        : job.error_message || `진행 중 ${job.progress.percentage.toFixed(1)}%`
                      }
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
            {mockRecentJobs.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                아직 생성 작업이 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Data Overview */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">데이터 개요</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Factory className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">15</p>
            <p className="text-sm text-gray-500">생산 라인</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Database className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">150</p>
            <p className="text-sm text-gray-500">설비</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <ShoppingCart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">50</p>
            <p className="text-sm text-gray-500">제품군</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">55</p>
            <p className="text-sm text-gray-500">AI 시나리오</p>
          </div>
        </div>
      </div>
    </div>
  );
}
