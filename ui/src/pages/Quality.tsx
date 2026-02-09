import { useState, useMemo } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Target, Search, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { DefectParetoChart, DefectTrendChart } from '../components/charts';
import {
  useDefectAnalysis,
  useDefectPareto,
  useDefects,
  useInspections,
  useAllEquipmentStatus,
} from '../hooks';

export default function Quality() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');

  // API 데이터 조회
  const { data: defectAnalysis, isLoading: analysisLoading } = useDefectAnalysis({
    limit: selectedPeriod === '1d' ? 1 : selectedPeriod === '7d' ? 7 : 30,
  });
  const { data: defectPareto, isLoading: paretoLoading } = useDefectPareto();
  const { data: defects, isLoading: defectsLoading } = useDefects({ page_size: 50 });
  const { data: inspections, isLoading: inspectionsLoading } = useInspections({ page_size: 100 });
  const { data: equipmentStatus, isLoading: equipmentLoading } = useAllEquipmentStatus();

  // 품질 지표 계산
  const qualityMetrics = useMemo(() => {
    const summary = defectAnalysis?.summary ?? {};
    return {
      defectRate: summary.avg_defect_rate ?? 0,
      targetRate: 1.5,
      fpy: 100 - (summary.avg_defect_rate ?? 0),
      reworkRate: summary.rework_rate ?? 0,
      scrapRate: summary.scrap_rate ?? 0,
      totalInspected: summary.total_inspected ?? 0,
      passRate: summary.pass_rate ?? 98.5,
      defectTrend: summary.defect_trend ?? 0,
      reworkCount: summary.rework_count ?? 0,
      scrapCount: summary.scrap_count ?? 0,
    };
  }, [defectAnalysis]);

  // 불량 추이 데이터
  const defectTrendData = useMemo(() => {
    if (!defectAnalysis?.trend) return [];
    return defectAnalysis.trend.map((item: any) => ({
      date: item.date,
      defectRate: item.defect_rate,
      defectCount: item.defect_count,
    }));
  }, [defectAnalysis]);

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

  // 품질 이상 라인 (불량률 2% 초과)
  const qualityIssueLines = useMemo(() => {
    if (!equipmentStatus?.lines) return [];
    return equipmentStatus.lines
      .filter((line: any) => (line.today_defect_rate ?? 0) > 0.02)
      .sort((a: any, b: any) => (b.today_defect_rate ?? 0) - (a.today_defect_rate ?? 0))
      .map((line: any) => ({
        id: line.line_id,
        lineCode: line.line_code,
        lineName: line.line_name,
        currentProduct: line.current_product,
        todayProduction: line.today_production ?? 0,
        todayDefectRate: line.today_defect_rate ?? 0,
        topDefect: line.top_defect ?? '솔더 브릿지',
      }));
  }, [equipmentStatus]);

  // 불량 상세 내역 (검색 필터링)
  const defectList = useMemo(() => {
    if (!defects?.items) return [];

    const items = defects.items.map((d: any) => ({
      no: d.defect_no || `DEF-${d.defect_id?.slice(0, 8)}`,
      lot: d.lot_no,
      product: d.product_code,
      line: d.line_code,
      defect: d.defect_name || d.defect_code,
      qty: d.defect_qty,
      equipment: d.detection_equipment || 'AOI',
      severity: d.severity || 'major',
    }));

    if (!searchTerm) return items;

    const search = searchTerm.toLowerCase();
    return items.filter((d: any) =>
      d.lot?.toLowerCase().includes(search) ||
      d.product?.toLowerCase().includes(search) ||
      d.line?.toLowerCase().includes(search)
    );
  }, [defects, searchTerm]);

  const isLoading = analysisLoading || paretoLoading || defectsLoading || equipmentLoading;

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
          >
            <option value="1d">금일</option>
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
          </select>
        </div>
      </div>

      {/* Quality KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card">
          <p className="text-sm text-slate-400 mb-1">불량률</p>
          <div className="flex items-baseline gap-2">
            <span className={clsx(
              'text-3xl font-bold',
              qualityMetrics.defectRate <= qualityMetrics.targetRate ? 'text-green-400' : 'text-red-400'
            )}>
              {qualityMetrics.defectRate.toFixed(2)}%
            </span>
            <span className="text-sm text-slate-500">/ {qualityMetrics.targetRate}%</span>
          </div>
          <div className={clsx(
            'flex items-center gap-1 mt-2',
            qualityMetrics.defectTrend <= 0 ? 'text-green-400' : 'text-red-400'
          )}>
            {qualityMetrics.defectTrend <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            <span className="text-xs">{qualityMetrics.defectTrend.toFixed(2)}% vs 전일</span>
          </div>
        </div>

        <div className="card">
          <p className="text-sm text-slate-400 mb-1">직행률 (FPY)</p>
          <span className="text-3xl font-bold text-white">{qualityMetrics.fpy.toFixed(2)}%</span>
          <div className="mt-2">
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${qualityMetrics.fpy}%` }} />
            </div>
          </div>
        </div>

        <div className="card">
          <p className="text-sm text-slate-400 mb-1">재작업률</p>
          <span className="text-3xl font-bold text-yellow-400">{qualityMetrics.reworkRate.toFixed(2)}%</span>
          <p className="text-xs text-slate-500 mt-2">금일 {qualityMetrics.reworkCount}건</p>
        </div>

        <div className="card">
          <p className="text-sm text-slate-400 mb-1">폐기율</p>
          <span className="text-3xl font-bold text-red-400">{qualityMetrics.scrapRate.toFixed(2)}%</span>
          <p className="text-xs text-slate-500 mt-2">금일 {qualityMetrics.scrapCount}건</p>
        </div>

        <div className="card">
          <p className="text-sm text-slate-400 mb-1">검사 완료</p>
          <span className="text-3xl font-bold text-white">{qualityMetrics.totalInspected.toLocaleString()}</span>
          <p className="text-xs text-slate-500 mt-2">{qualityMetrics.passRate.toFixed(1)}% 합격</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Defect Trend */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">불량률 추이</h2>
            <div className="flex items-center gap-2">
              <Target size={16} className="text-green-400" />
              <span className="text-sm text-slate-400">목표: 1.5%</span>
            </div>
          </div>
          <DefectTrendChart data={defectTrendData} />
        </div>

        {/* Defect Pareto */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">불량 유형별 분석 (파레토)</h2>
          </div>
          <DefectParetoChart data={defectParetoData} />
        </div>
      </div>

      {/* Quality Issues Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title flex items-center gap-2">
            <AlertTriangle className="text-yellow-400" size={20} />
            품질 이상 라인
          </h2>
          <span className="text-sm text-slate-400">불량률 2% 초과 ({qualityIssueLines.length}개)</span>
        </div>

        {qualityIssueLines.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">라인</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">제품</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">생산량</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">불량률</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">주요 불량</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase">조치</th>
                </tr>
              </thead>
              <tbody>
                {qualityIssueLines.map((line) => (
                  <tr key={line.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-white">{line.lineCode}</p>
                        <p className="text-xs text-slate-500">{line.lineName}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">{line.currentProduct || '-'}</td>
                    <td className="py-3 px-4 text-sm text-right text-slate-300">
                      {line.todayProduction.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className="text-red-400 font-bold">
                        {(line.todayDefectRate * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">{line.topDefect}</td>
                    <td className="py-3 px-4 text-center">
                      <button className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium hover:bg-yellow-500/30 transition-colors">
                        분석
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            품질 이상 라인이 없습니다.
          </div>
        )}
      </div>

      {/* Defect Detail Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">불량 상세 내역</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="LOT, 제품 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">불량번호</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">LOT</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">제품</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">라인</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">불량유형</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">수량</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">검출설비</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase">심각도</th>
              </tr>
            </thead>
            <tbody>
              {defectList.map((defect, index) => (
                <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm font-mono text-white">{defect.no}</td>
                  <td className="py-3 px-4 text-sm font-mono text-slate-300">{defect.lot}</td>
                  <td className="py-3 px-4 text-sm text-slate-300">{defect.product}</td>
                  <td className="py-3 px-4 text-sm text-slate-300">{defect.line}</td>
                  <td className="py-3 px-4 text-sm text-white font-medium">{defect.defect}</td>
                  <td className="py-3 px-4 text-sm text-right text-white">{defect.qty}</td>
                  <td className="py-3 px-4 text-sm text-slate-300">{defect.equipment}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={clsx(
                      'px-2 py-1 rounded text-xs font-medium',
                      defect.severity === 'critical' && 'bg-red-500/20 text-red-400',
                      defect.severity === 'major' && 'bg-yellow-500/20 text-yellow-400',
                      defect.severity === 'minor' && 'bg-blue-500/20 text-blue-400'
                    )}>
                      {defect.severity === 'critical' ? '심각' : defect.severity === 'major' ? '중대' : '경미'}
                    </span>
                  </td>
                </tr>
              ))}
              {defectList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    불량 데이터가 없습니다.
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
