import { useMemo } from 'react';
import {
  Factory,
  Activity,
  AlertTriangle,
  TrendingUp,
  Package,
  Clock,
  Loader2,
} from 'lucide-react';
import KPICard from '../components/KPICard';
import LineStatusCard from '../components/LineStatusCard';
import AlertList from '../components/AlertList';
import {
  OEEChart,
  ProductionChart,
  DefectParetoChart,
  DefectTrendChart,
  ProductDistributionChart,
} from '../components/charts';
import {
  useRealtimeProduction,
  useDailyProductionAnalysis,
  useAllEquipmentStatus,
  useOEEData,
  useDefectAnalysis,
  useDefectPareto,
  useDashboardWebSocket,
  useAlertsWebSocket,
} from '../hooks';
import { useAlertStore, useUnacknowledgedAlerts } from '../stores';
import type { KPIData, ProductionLine } from '../types';

export default function Dashboard() {
  // WebSocket 연결 (실시간 데이터 업데이트)
  useDashboardWebSocket();
  const { acknowledge } = useAlertsWebSocket();

  // API 데이터 조회
  const { data: realtimeData, isLoading: realtimeLoading } = useRealtimeProduction();
  const { data: dailyAnalysis, isLoading: analysisLoading } = useDailyProductionAnalysis();
  const { data: equipmentStatus, isLoading: equipmentLoading } = useAllEquipmentStatus();
  const { data: oeeData, isLoading: oeeLoading } = useOEEData();
  const { data: defectAnalysis, isLoading: defectLoading } = useDefectAnalysis();
  const { data: defectPareto, isLoading: paretoLoading } = useDefectPareto();

  // Alert Store
  const alerts = useUnacknowledgedAlerts();
  const { acknowledgeAlert } = useAlertStore();

  const handleAcknowledge = (id: string) => {
    acknowledge(id);
    acknowledgeAlert(id);
  };

  // KPI 데이터 계산
  const kpiData: KPIData[] = useMemo(() => {
    if (!dailyAnalysis) {
      return [
        { label: '금일 생산량', value: 0, unit: 'EA', target: 10000 },
        { label: 'OEE', value: 0, unit: '%', target: 85 },
        { label: '불량률', value: 0, unit: '%', target: 1.5 },
        { label: '가동률', value: 0, unit: '%', target: 92 },
        { label: '달성률', value: 0, unit: '%', target: 100 },
        { label: '완료 LOT', value: 0, unit: '건' },
      ];
    }

    const todayData = dailyAnalysis.daily_data?.[0];
    const avgOEE = oeeData?.summary?.avg_oee ?? 0;

    return [
      {
        label: '금일 생산량',
        value: todayData?.total_production ?? 0,
        unit: 'EA',
        target: 10000,
        trend: todayData?.production_trend > 0 ? 'up' : todayData?.production_trend < 0 ? 'down' : 'stable',
        trendValue: Math.abs(todayData?.production_trend ?? 0),
      },
      {
        label: 'OEE',
        value: Math.round(avgOEE * 100) / 100,
        unit: '%',
        target: 85,
        trend: avgOEE >= 85 ? 'up' : 'down',
      },
      {
        label: '불량률',
        value: Math.round((todayData?.defect_rate ?? 0) * 100) / 100,
        unit: '%',
        target: 1.5,
        trend: (todayData?.defect_rate ?? 0) <= 1.5 ? 'up' : 'down',
      },
      {
        label: '가동률',
        value: Math.round((oeeData?.summary?.avg_availability ?? 0) * 100) / 100,
        unit: '%',
        target: 92,
      },
      {
        label: '달성률',
        value: Math.round((todayData?.achievement_rate ?? 0) * 100) / 100,
        unit: '%',
        target: 100,
      },
      {
        label: '완료 LOT',
        value: todayData?.completed_lots ?? 0,
        unit: '건',
      },
    ];
  }, [dailyAnalysis, oeeData]);

  // 라인 상태 변환
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

  // 라인 상태 카운트
  const lineStatusCounts = useMemo(() => ({
    running: productionLines.filter((l) => l.status === 'running').length,
    idle: productionLines.filter((l) => l.status === 'idle').length,
    down: productionLines.filter((l) => l.status === 'down').length,
    maintenance: productionLines.filter((l) => l.status === 'maintenance').length,
  }), [productionLines]);

  // OEE 추이 데이터
  const oeeTrendData = useMemo(() => {
    if (!oeeData?.trend) return [];
    return oeeData.trend.map((item: any) => ({
      date: item.date,
      avgAvailability: item.availability,
      avgPerformance: item.performance,
      avgQuality: item.quality,
      avgOEE: item.oee,
    }));
  }, [oeeData]);

  // 시간대별 생산량 데이터
  const hourlyProductionData = useMemo(() => {
    if (!realtimeData?.hourly) return [];
    return realtimeData.hourly.map((item: any) => ({
      time: item.hour,
      production: item.production,
      target: item.target,
    }));
  }, [realtimeData]);

  // 불량 파레토 데이터
  const defectParetoData = useMemo(() => {
    if (!defectPareto?.items) return [];
    return defectPareto.items.map((item: any) => ({
      defectCode: item.defect_code,
      defectName: item.defect_name,
      count: item.count,
      qty: item.qty,
      percentage: item.percentage,
    }));
  }, [defectPareto]);

  // 불량 추이 데이터
  const defectTrendData = useMemo(() => {
    if (!defectAnalysis?.trend) return [];
    return defectAnalysis.trend.map((item: any) => ({
      date: item.date,
      defectRate: item.defect_rate,
      defectCount: item.defect_count,
    }));
  }, [defectAnalysis]);

  // 제품군별 생산 비율
  const productDistributionData = useMemo(() => {
    if (!dailyAnalysis?.product_distribution) return [];
    return dailyAnalysis.product_distribution.map((item: any) => ({
      name: item.product_group,
      value: item.production,
    }));
  }, [dailyAnalysis]);

  // 로딩 상태
  const isLoading = realtimeLoading || analysisLoading || equipmentLoading || oeeLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-400">데이터 로딩 중...</span>
      </div>
    );
  }

  // Alert 데이터 변환
  const alertList = alerts.map((a) => ({
    id: a.id,
    type: a.severity === 'critical' ? 'critical' : a.severity === 'warning' ? 'warning' : 'info',
    title: a.type === 'alarm' ? '설비 알람' : a.type === 'quality' ? '품질 경고' : a.type === 'downtime' ? '다운타임' : '시스템',
    message: a.message,
    timestamp: a.timestamp,
    source: a.equipment_code || a.line_code || 'System',
    acknowledged: a.acknowledged ?? false,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          data={kpiData[0]}
          icon={<Factory className="text-green-400" size={24} />}
          colorClass="from-green-900/50 to-slate-800"
        />
        <KPICard
          data={kpiData[1]}
          icon={<Activity className="text-blue-400" size={24} />}
          colorClass="from-blue-900/50 to-slate-800"
        />
        <KPICard
          data={kpiData[2]}
          icon={<AlertTriangle className="text-red-400" size={24} />}
          colorClass="from-red-900/50 to-slate-800"
        />
        <KPICard
          data={kpiData[3]}
          icon={<Clock className="text-yellow-400" size={24} />}
          colorClass="from-yellow-900/50 to-slate-800"
        />
        <KPICard
          data={kpiData[4]}
          icon={<TrendingUp className="text-purple-400" size={24} />}
          colorClass="from-purple-900/50 to-slate-800"
        />
        <KPICard
          data={kpiData[5]}
          icon={<Package className="text-cyan-400" size={24} />}
          colorClass="from-cyan-900/50 to-slate-800"
        />
      </div>

      {/* Line Status Summary */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">라인 현황 요약</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-slate-400">가동 {lineStatusCounts.running}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-slate-400">대기 {lineStatusCounts.idle}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-slate-400">정지 {lineStatusCounts.down}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-400">보전 {lineStatusCounts.maintenance}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {productionLines.slice(0, 10).map((line) => (
            <LineStatusCard key={line.id} line={line} />
          ))}
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OEE Trend */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">OEE 추이 (최근 7일)</h2>
            <span className="text-sm text-slate-400">목표: 85%</span>
          </div>
          <OEEChart data={oeeTrendData} />
        </div>

        {/* Hourly Production */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">시간대별 생산량 (금일)</h2>
            <span className="text-sm text-slate-400">
              누적: {hourlyProductionData.reduce((sum, h) => sum + (h.production || 0), 0).toLocaleString()} EA
            </span>
          </div>
          <ProductionChart data={hourlyProductionData} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Defect Pareto */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h2 className="card-title">불량 유형별 분석 (파레토)</h2>
            <span className="text-sm text-slate-400">금주 기준</span>
          </div>
          <DefectParetoChart data={defectParetoData} />
        </div>

        {/* Product Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">제품군별 생산 비율</h2>
          </div>
          <ProductDistributionChart data={productDistributionData} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Defect Trend */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h2 className="card-title">불량률 추이</h2>
            <span className="text-sm text-slate-400">목표: 1.5%</span>
          </div>
          <DefectTrendChart data={defectTrendData} />
        </div>

        {/* Alerts */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">알림</h2>
            <span className="text-xs text-red-400 font-medium">
              {alertList.filter((a) => !a.acknowledged && a.type === 'critical').length} 긴급
            </span>
          </div>
          <AlertList alerts={alertList} onAcknowledge={handleAcknowledge} />
        </div>
      </div>
    </div>
  );
}
