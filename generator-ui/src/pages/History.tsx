import { useEffect, useState } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Trash2,
  Eye,
  Calendar,
  Database
} from 'lucide-react';
import clsx from 'clsx';
import { useGeneratorStore } from '../stores/generatorStore';
import type { GeneratorJob, JobStatus } from '../types/generator';

// Mock history data
const mockHistory: GeneratorJob[] = [
  {
    id: 'job-001',
    status: 'completed',
    config: { start_date: '2024-07-01', end_date: '2024-12-31', tenant_id: 'T001', random_seed: 42, enabled_scenarios: ['defect_rate_spike', 'predictive_maintenance'], output_format: 'json' },
    progress: {
      current_day: 184, total_days: 184, current_date: '2024-12-31', percentage: 100,
      records_generated: {
        mes: { production_orders: 14720, production_results: 441600, equipment_status: 25760, quality_inspections: 119600, defect_records: 18400, material_consumption: 79120 },
        erp: { sales_orders: 8280, purchase_orders: 5520, inventory_transactions: 34960, journal_entries: 45080, attendance_records: 64400 }
      }
    },
    created_at: '2025-01-15T10:30:00Z',
    started_at: '2025-01-15T10:30:05Z',
    completed_at: '2025-01-15T10:45:30Z'
  },
  {
    id: 'job-002',
    status: 'failed',
    config: { start_date: '2024-07-01', end_date: '2024-09-30', tenant_id: 'T001', random_seed: 123, enabled_scenarios: [], output_format: 'database' },
    progress: {
      current_day: 45, total_days: 92, current_date: '2024-08-15', percentage: 48.9,
      records_generated: {
        mes: { production_orders: 3600, production_results: 108000, equipment_status: 6300, quality_inspections: 29250, defect_records: 4500, material_consumption: 19350 },
        erp: { sales_orders: 2025, purchase_orders: 1350, inventory_transactions: 8550, journal_entries: 11025, attendance_records: 15750 }
      }
    },
    created_at: '2025-01-14T14:00:00Z',
    started_at: '2025-01-14T14:00:03Z',
    error_message: 'Database connection timeout after 30 seconds'
  },
  {
    id: 'job-003',
    status: 'completed',
    config: { start_date: '2024-10-01', end_date: '2024-10-31', tenant_id: 'T001', random_seed: 99, enabled_scenarios: ['oee_degradation'], output_format: 'json' },
    progress: {
      current_day: 31, total_days: 31, current_date: '2024-10-31', percentage: 100,
      records_generated: {
        mes: { production_orders: 2480, production_results: 74400, equipment_status: 4340, quality_inspections: 20150, defect_records: 3100, material_consumption: 13330 },
        erp: { sales_orders: 1395, purchase_orders: 930, inventory_transactions: 5890, journal_entries: 7595, attendance_records: 10850 }
      }
    },
    created_at: '2025-01-13T09:00:00Z',
    started_at: '2025-01-13T09:00:02Z',
    completed_at: '2025-01-13T09:05:45Z'
  },
  {
    id: 'job-004',
    status: 'cancelled',
    config: { start_date: '2024-07-01', end_date: '2024-08-31', tenant_id: 'T001', random_seed: 42, enabled_scenarios: [], output_format: 'json' },
    progress: {
      current_day: 20, total_days: 62, current_date: '2024-07-20', percentage: 32.3,
      records_generated: {
        mes: { production_orders: 1600, production_results: 48000, equipment_status: 2800, quality_inspections: 13000, defect_records: 2000, material_consumption: 8600 },
        erp: { sales_orders: 900, purchase_orders: 600, inventory_transactions: 3800, journal_entries: 4900, attendance_records: 7000 }
      }
    },
    created_at: '2025-01-12T16:30:00Z',
    started_at: '2025-01-12T16:30:01Z'
  }
];

const statusConfig: Record<JobStatus, { icon: typeof CheckCircle; label: string; color: string }> = {
  pending: { icon: Clock, label: '대기 중', color: 'gray' },
  running: { icon: Clock, label: '실행 중', color: 'blue' },
  completed: { icon: CheckCircle, label: '완료', color: 'green' },
  failed: { icon: XCircle, label: '실패', color: 'red' },
  cancelled: { icon: AlertCircle, label: '취소됨', color: 'yellow' },
};

export default function History() {
  const { jobHistory, setJobHistory } = useGeneratorStore();
  const [selectedJob, setSelectedJob] = useState<GeneratorJob | null>(null);

  useEffect(() => {
    setJobHistory(mockHistory);
  }, [setJobHistory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return '-';
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diff = endTime - startTime;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}분 ${seconds}초`;
  };

  const getTotalRecords = (job: GeneratorJob) => {
    const mes = Object.values(job.progress.records_generated.mes).reduce((a, b) => a + b, 0);
    const erp = Object.values(job.progress.records_generated.erp).reduce((a, b) => a + b, 0);
    return mes + erp;
  };

  const handleDelete = (jobId: string) => {
    if (confirm('이 작업 기록을 삭제하시겠습니까?')) {
      setJobHistory(jobHistory.filter(j => j.id !== jobId));
      if (selectedJob?.id === jobId) {
        setSelectedJob(null);
      }
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">생성 이력</h1>
        <p className="text-gray-500">이전에 실행한 데이터 생성 작업 목록</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">작업 목록</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {jobHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>생성 이력이 없습니다.</p>
                </div>
              ) : (
                jobHistory.map(job => {
                  const status = statusConfig[job.status];
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={clsx(
                        'p-4 cursor-pointer hover:bg-gray-50 transition-colors',
                        selectedJob?.id === job.id && 'bg-primary-50'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={clsx(
                            'p-2 rounded-lg',
                            status.color === 'green' && 'bg-green-100',
                            status.color === 'red' && 'bg-red-100',
                            status.color === 'blue' && 'bg-blue-100',
                            status.color === 'yellow' && 'bg-yellow-100',
                            status.color === 'gray' && 'bg-gray-100'
                          )}>
                            <StatusIcon className={clsx(
                              'w-5 h-5',
                              status.color === 'green' && 'text-green-600',
                              status.color === 'red' && 'text-red-600',
                              status.color === 'blue' && 'text-blue-600 animate-spin',
                              status.color === 'yellow' && 'text-yellow-600',
                              status.color === 'gray' && 'text-gray-600'
                            )} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {job.config.start_date} ~ {job.config.end_date}
                              </span>
                              <span className={clsx(
                                'px-2 py-0.5 rounded text-xs font-medium',
                                status.color === 'green' && 'bg-green-100 text-green-700',
                                status.color === 'red' && 'bg-red-100 text-red-700',
                                status.color === 'blue' && 'bg-blue-100 text-blue-700',
                                status.color === 'yellow' && 'bg-yellow-100 text-yellow-700',
                                status.color === 'gray' && 'bg-gray-100 text-gray-700'
                              )}>
                                {status.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {job.status === 'completed'
                                ? `${getTotalRecords(job).toLocaleString()} 레코드 생성`
                                : job.status === 'failed'
                                ? job.error_message
                                : `${job.progress.percentage.toFixed(1)}% 완료`
                              }
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(job.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {job.status === 'completed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                alert('다운로드 기능 - 실제 구현 시 JSON 파일 다운로드');
                              }}
                              className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                              title="다운로드"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(job.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Job Detail */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow sticky top-6">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">상세 정보</h2>
            </div>
            {selectedJob ? (
              <div className="p-4 space-y-4">
                {/* Status */}
                <div>
                  <label className="text-sm text-gray-500">상태</label>
                  <p className="font-medium text-gray-900">
                    {statusConfig[selectedJob.status].label}
                  </p>
                </div>

                {/* Period */}
                <div>
                  <label className="text-sm text-gray-500">시뮬레이션 기간</label>
                  <p className="font-medium text-gray-900">
                    {selectedJob.config.start_date} ~ {selectedJob.config.end_date}
                  </p>
                  <p className="text-sm text-gray-500">
                    ({selectedJob.progress.total_days}일)
                  </p>
                </div>

                {/* Duration */}
                <div>
                  <label className="text-sm text-gray-500">소요 시간</label>
                  <p className="font-medium text-gray-900">
                    {formatDuration(selectedJob.started_at || selectedJob.created_at, selectedJob.completed_at)}
                  </p>
                </div>

                {/* Progress */}
                <div>
                  <label className="text-sm text-gray-500">진행률</label>
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={clsx(
                          'h-2 rounded-full',
                          selectedJob.status === 'completed' ? 'bg-green-500' :
                          selectedJob.status === 'failed' ? 'bg-red-500' : 'bg-primary-500'
                        )}
                        style={{ width: `${selectedJob.progress.percentage}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedJob.progress.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Records */}
                <div>
                  <label className="text-sm text-gray-500">생성된 레코드</label>
                  <p className="font-medium text-gray-900">
                    {getTotalRecords(selectedJob).toLocaleString()}개
                  </p>
                </div>

                {/* Output Format */}
                <div>
                  <label className="text-sm text-gray-500">출력 형식</label>
                  <p className="font-medium text-gray-900">
                    {selectedJob.config.output_format === 'json' ? 'JSON 파일' : '데이터베이스'}
                  </p>
                </div>

                {/* Scenarios */}
                <div>
                  <label className="text-sm text-gray-500">활성 시나리오</label>
                  <p className="font-medium text-gray-900">
                    {selectedJob.config.enabled_scenarios.length}개
                  </p>
                  {selectedJob.config.enabled_scenarios.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedJob.config.enabled_scenarios.slice(0, 5).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {s}
                        </span>
                      ))}
                      {selectedJob.config.enabled_scenarios.length > 5 && (
                        <span className="text-xs text-gray-400">
                          +{selectedJob.config.enabled_scenarios.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {selectedJob.error_message && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <label className="text-sm text-red-600">오류 메시지</label>
                    <p className="text-sm text-red-800 mt-1">
                      {selectedJob.error_message}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {selectedJob.status === 'completed' && (
                  <button
                    onClick={() => alert('다운로드 기능')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    <Download className="w-4 h-4" />
                    결과 다운로드
                  </button>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>작업을 선택하면 상세 정보가 표시됩니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
