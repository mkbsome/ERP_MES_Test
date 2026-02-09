import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  Square,
  Calendar,
  Database,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Factory,
  ShoppingCart,
  Wifi,
  WifiOff
} from 'lucide-react';
import clsx from 'clsx';
import ProgressBar from '../components/ProgressBar';
import LogViewer from '../components/LogViewer';
import StatCard from '../components/StatCard';
import { useGeneratorStore } from '../stores/generatorStore';
import { GeneratorWebSocket } from '../api/websocket';
import { generatorApi } from '../api/generator';
import type { GeneratorProgress, JobStatus, WSMessage } from '../types/generator';

export default function Generate() {
  const {
    config,
    setConfig,
    selectedScenarios,
    currentJob,
    setCurrentJob,
    progress,
    setProgress,
    addLog,
    clearLogs,
    addJobToHistory
  } = useGeneratorStore();

  const [isRunning, setIsRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [useWebSocket, setUseWebSocket] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const wsRef = useRef<GeneratorWebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket message handler
  const handleWSMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'connected':
        setIsConnected(true);
        addLog('🔗 WebSocket 연결됨');
        break;

      case 'progress':
        if (message.data) {
          setProgress(message.data as GeneratorProgress);
        }
        break;

      case 'log':
        if (message.data) {
          const logData = message.data as { level: string; message: string };
          const levelEmoji = {
            info: 'ℹ️',
            warning: '⚠️',
            error: '❌',
            success: '✅'
          }[logData.level] || '';
          addLog(`${levelEmoji} ${logData.message}`);
        }
        break;

      case 'started':
        setIsRunning(true);
        addLog('🚀 데이터 생성 작업이 시작되었습니다.');
        break;

      case 'completed':
        setIsRunning(false);
        if (message.data) {
          const summary = message.data as { total_records: number; duration_seconds: number };
          addLog(`✅ 완료! 총 ${summary.total_records.toLocaleString()}건 (${summary.duration_seconds.toFixed(1)}초)`);
        }
        if (currentJob) {
          const completedJob = {
            ...currentJob,
            status: 'completed' as JobStatus,
            completed_at: new Date().toISOString()
          };
          setCurrentJob(completedJob);
          addJobToHistory(completedJob);
        }
        break;

      case 'error':
        setIsRunning(false);
        if (message.data) {
          addLog(`❌ 오류: ${(message.data as { error: string }).error}`);
        }
        if (currentJob) {
          setCurrentJob({
            ...currentJob,
            status: 'failed' as JobStatus,
            error_message: (message.data as { error: string })?.error
          });
        }
        break;
    }
  }, [setProgress, addLog, currentJob, setCurrentJob, addJobToHistory]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (useWebSocket) {
      wsRef.current = new GeneratorWebSocket(
        'ws://localhost:8000/api/v1/generator/ws/generator',
        handleWSMessage
      );
      wsRef.current.connect();

      return () => {
        wsRef.current?.disconnect();
      };
    }
  }, [useWebSocket, handleWSMessage]);

  // Fallback: Local simulation (when WebSocket is not available)
  const simulateProgressLocally = useCallback(() => {
    const startDate = new Date(config.start_date);
    const endDate = new Date(config.end_date);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    let currentDay = 0;
    clearLogs();
    addLog('📡 로컬 시뮬레이션 모드로 실행 중...');
    addLog(`시뮬레이션 기간: ${config.start_date} ~ ${config.end_date} (${totalDays}일)`);
    addLog(`활성화된 시나리오: ${selectedScenarios.size}개`);

    intervalRef.current = setInterval(() => {
      currentDay++;
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + currentDay - 1);
      const percentage = (currentDay / totalDays) * 100;

      const newProgress: GeneratorProgress = {
        current_day: currentDay,
        total_days: totalDays,
        current_date: currentDate.toISOString().split('T')[0],
        percentage,
        current_module: currentDay % 2 === 0 ? 'MES' : 'ERP',
        records_generated: {
          mes: {
            production_orders: Math.floor(currentDay * 80),
            production_results: Math.floor(currentDay * 2400),
            equipment_status: Math.floor(currentDay * 140),
            quality_inspections: Math.floor(currentDay * 650),
            defect_records: Math.floor(currentDay * 100),
            material_consumption: Math.floor(currentDay * 430),
          },
          erp: {
            sales_orders: Math.floor(currentDay * 45),
            purchase_orders: Math.floor(currentDay * 30),
            inventory_transactions: Math.floor(currentDay * 190),
            journal_entries: Math.floor(currentDay * 245),
            attendance_records: Math.floor(currentDay * 350),
          }
        }
      };

      setProgress(newProgress);

      // Add log entries
      if (currentDay % 10 === 0) {
        addLog(`${newProgress.current_date} 처리 중... (${percentage.toFixed(1)}%)`);
      }

      // Randomly inject scenario events
      if (Math.random() < 0.1) {
        const events = [
          '🔴 불량률 급증 시나리오 발생 (SMT-L01)',
          '🟡 설비 OEE 저하 감지 (SMT-L02)',
          '🟢 생산성 향상 패턴 감지',
          '🔵 자재 부족 경고 발생',
          '⚠️ 돌발 고장 시나리오 트리거',
        ];
        addLog(events[Math.floor(Math.random() * events.length)]);
      }

      if (currentDay >= totalDays) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
        addLog('✅ 데이터 생성이 완료되었습니다!');
        const totalRecords = Object.values(newProgress.records_generated.mes).reduce((a, b) => a + b, 0) +
          Object.values(newProgress.records_generated.erp).reduce((a, b) => a + b, 0);
        addLog(`총 생성 레코드: ${totalRecords.toLocaleString()}개`);

        if (currentJob) {
          const completedJob = {
            ...currentJob,
            status: 'completed' as JobStatus,
            progress: newProgress,
            completed_at: new Date().toISOString()
          };
          setCurrentJob(completedJob);
          addJobToHistory(completedJob);
        }
      }
    }, 100 / simulationSpeed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [config, selectedScenarios, clearLogs, addLog, setProgress, currentJob, setCurrentJob, addJobToHistory, simulationSpeed]);

  const handleStart = async () => {
    if (selectedScenarios.size === 0) {
      alert('최소 1개 이상의 시나리오를 선택해주세요.');
      return;
    }

    setIsRunning(true);
    clearLogs();

    const newJob = {
      id: `job-${Date.now()}`,
      status: 'running' as JobStatus,
      config: {
        ...config,
        enabled_scenarios: Array.from(selectedScenarios)
      },
      progress: {
        current_day: 0,
        total_days: 0,
        current_date: config.start_date,
        percentage: 0,
        records_generated: {
          mes: { production_orders: 0, production_results: 0, equipment_status: 0, quality_inspections: 0, defect_records: 0, material_consumption: 0 },
          erp: { sales_orders: 0, purchase_orders: 0, inventory_transactions: 0, journal_entries: 0, attendance_records: 0 }
        }
      },
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString()
    };
    setCurrentJob(newJob);

    if (useWebSocket && isConnected) {
      // Use API to start job (WebSocket will receive updates)
      try {
        addLog('🔄 서버에 작업 요청 중...');
        const response = await generatorApi.startGeneration({
          tenant_id: config.tenant_id,
          start_date: config.start_date,
          end_date: config.end_date,
          output_format: config.output_format,
          random_seed: config.random_seed,
          enabled_scenarios: Array.from(selectedScenarios)
        });

        if (response.success && response.data) {
          const job = response.data;
          setCurrentJob({
            ...newJob,
            id: job.id
          });
          // Subscribe to job updates via WebSocket
          wsRef.current?.send({
            type: 'subscribe',
            job_id: job.id
          });
          addLog(`📋 Job ID: ${job.id}`);
        }
      } catch (error) {
        addLog('⚠️ API 연결 실패, 로컬 시뮬레이션으로 전환합니다.');
        simulateProgressLocally();
      }
    } else {
      // Fallback to local simulation
      simulateProgressLocally();
    }
  };

  const handleStop = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsRunning(false);
    addLog('⏹️ 데이터 생성이 중단되었습니다.');

    if (currentJob) {
      if (useWebSocket && isConnected) {
        try {
          await generatorApi.cancelJob(currentJob.id);
        } catch (error) {
          console.error('Failed to cancel job:', error);
        }
      }
      setCurrentJob({
        ...currentJob,
        status: 'cancelled'
      });
    }
  };

  const formatNumber = (num: number) => num.toLocaleString();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">데이터 생성</h1>
          <p className="text-gray-500">시뮬레이션 기간과 옵션을 설정하고 데이터를 생성하세요</p>
        </div>
        <div className="flex items-center gap-2">
          {useWebSocket ? (
            isConnected ? (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <Wifi className="w-4 h-4" />
                실시간 연결됨
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-yellow-600">
                <WifiOff className="w-4 h-4" />
                연결 중...
              </span>
            )
          ) : (
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <WifiOff className="w-4 h-4" />
              로컬 모드
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* Date Range */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              시뮬레이션 기간
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">시작일</label>
                <input
                  type="date"
                  value={config.start_date}
                  onChange={(e) => setConfig({ start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isRunning}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">종료일</label>
                <input
                  type="date"
                  value={config.end_date}
                  onChange={(e) => setConfig({ end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isRunning}
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-gray-500" />
              생성 옵션
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">출력 형식</label>
                <select
                  value={config.output_format}
                  onChange={(e) => setConfig({ output_format: e.target.value as 'json' | 'database' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isRunning}
                >
                  <option value="json">JSON 파일</option>
                  <option value="database">데이터베이스</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Random Seed</label>
                <input
                  type="number"
                  value={config.random_seed}
                  onChange={(e) => setConfig({ random_seed: parseInt(e.target.value) || 42 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isRunning}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">시뮬레이션 속도</label>
                <select
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isRunning}
                >
                  <option value="1">1x (느림)</option>
                  <option value="5">5x (보통)</option>
                  <option value="10">10x (빠름)</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="text-sm text-gray-600">WebSocket 사용</label>
                <button
                  onClick={() => setUseWebSocket(!useWebSocket)}
                  className={clsx(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    useWebSocket ? 'bg-primary-500' : 'bg-gray-300'
                  )}
                  disabled={isRunning}
                >
                  <span
                    className={clsx(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      useWebSocket ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Scenario Summary */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-gray-900 mb-4">시나리오 요약</h2>
            <div className="text-sm text-gray-600">
              <p>선택된 시나리오: <span className="font-bold text-gray-900">{selectedScenarios.size}개</span></p>
              <a href="/scenarios" className="text-primary-600 hover:underline mt-2 inline-block">
                시나리오 설정으로 이동 →
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Play className="w-5 h-5" />
                생성 시작
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Square className="w-5 h-5" />
                중지
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Progress & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              {isRunning ? (
                <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
              ) : progress?.percentage === 100 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <RefreshCw className="w-5 h-5 text-gray-400" />
              )}
              진행 상황
            </h2>

            {progress ? (
              <div className="space-y-4">
                <ProgressBar
                  value={progress.percentage}
                  label={`${progress.current_date} (Day ${progress.current_day}/${progress.total_days})`}
                  animated={isRunning}
                  color={progress.percentage === 100 ? 'success' : 'primary'}
                  size="lg"
                />

                {progress.current_module && (
                  <p className="text-sm text-gray-500">
                    현재 처리 중: <span className="font-medium">{progress.current_module}</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">생성을 시작하면 진행 상황이 표시됩니다.</p>
            )}
          </div>

          {/* Generated Records */}
          {progress && (
            <div className="grid grid-cols-2 gap-4">
              {/* MES Records */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Factory className="w-5 h-5 text-blue-500" />
                  MES 데이터
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">생산지시</span>
                    <span className="font-medium">{formatNumber(progress.records_generated.mes.production_orders)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">생산실적</span>
                    <span className="font-medium">{formatNumber(progress.records_generated.mes.production_results)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">설비상태</span>
                    <span className="font-medium">{formatNumber(progress.records_generated.mes.equipment_status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">품질검사</span>
                    <span className="font-medium">{formatNumber(progress.records_generated.mes.quality_inspections)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">불량기록</span>
                    <span className="font-medium">{formatNumber(progress.records_generated.mes.defect_records)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">자재소비</span>
                    <span className="font-medium">{formatNumber(progress.records_generated.mes.material_consumption)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                    <span>합계</span>
                    <span>{formatNumber(Object.values(progress.records_generated.mes).reduce((a, b) => a + b, 0))}</span>
                  </div>
                </div>
              </div>

              {/* ERP Records */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-purple-500" />
                  ERP 데이터
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">판매주문</span>
                    <span className="font-medium">{formatNumber(progress.records_generated.erp.sales_orders)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">구매발주</span>
                    <span className="font-medium">{formatNumber(progress.records_generated.erp.purchase_orders)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">재고이동</span>
                    <span className="font-medium">{formatNumber(progress.records_generated.erp.inventory_transactions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">전표</span>
                    <span className="font-medium">{formatNumber(progress.records_generated.erp.journal_entries)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">근태기록</span>
                    <span className="font-medium">{formatNumber(progress.records_generated.erp.attendance_records)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                    <span>합계</span>
                    <span>{formatNumber(Object.values(progress.records_generated.erp).reduce((a, b) => a + b, 0))}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logs */}
          <LogViewer />
        </div>
      </div>
    </div>
  );
}
