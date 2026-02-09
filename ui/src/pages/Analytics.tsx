import { useState, useMemo } from 'react';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  ComposedChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import clsx from 'clsx';
import {
  useDailyProductionAnalysis,
  useOEEData,
  useDefectAnalysis,
  useDefectPareto,
  useAllEquipmentStatus,
} from '../hooks';

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedReport, setSelectedReport] = useState<'production' | 'quality' | 'equipment' | 'comparison'>('production');

  // API 데이터 조회
  const { data: dailyAnalysis, isLoading: productionLoading } = useDailyProductionAnalysis({
    days: selectedPeriod === '1d' ? 1 : selectedPeriod === '7d' ? 7 : 30,
  });
  const { data: oeeData, isLoading: oeeLoading } = useOEEData();
  const { data: defectAnalysis, isLoading: defectLoading } = useDefectAnalysis();
  const { data: defectPareto, isLoading: paretoLoading } = useDefectPareto();
  const { data: equipmentStatus, isLoading: equipmentLoading } = useAllEquipmentStatus();

  // 생산 요약 데이터
  const productionSummary = useMemo(() => {
    if (!dailyAnalysis?.summary) {
      return {
        totalProduction: 0,
        avgDailyProduction: 0,
        achievementRate: 0,
        trend: 0,
      };
    }
    return {
      totalProduction: dailyAnalysis.summary.total_production ?? 0,
      avgDailyProduction: dailyAnalysis.summary.avg_daily_production ?? 0,
      achievementRate: dailyAnalysis.summary.avg_achievement_rate ?? 0,
      trend: dailyAnalysis.summary.production_trend ?? 0,
    };
  }, [dailyAnalysis]);

  // 일별 생산 데이터
  const dailyProductionData = useMemo(() => {
    if (!dailyAnalysis?.daily_data) {
      // Mock data
      return [
        { date: '01-06', production: 8500, target: 10000, achievement: 85 },
        { date: '01-07', production: 9200, target: 10000, achievement: 92 },
        { date: '01-08', production: 9800, target: 10000, achievement: 98 },
        { date: '01-09', production: 8900, target: 10000, achievement: 89 },
        { date: '01-10', production: 10200, target: 10000, achievement: 102 },
        { date: '01-11', production: 9500, target: 10000, achievement: 95 },
        { date: '01-12', production: 9100, target: 10000, achievement: 91 },
      ];
    }
    return dailyAnalysis.daily_data.map((d: any) => ({
      date: d.date?.slice(5) ?? '',
      production: d.total_production ?? 0,
      target: d.target_qty ?? 10000,
      achievement: Math.round((d.achievement_rate ?? 0) * 100),
    })).reverse();
  }, [dailyAnalysis]);

  // OEE 추이 데이터
  const oeeTrendData = useMemo(() => {
    if (!oeeData?.trend) {
      return [
        { date: '01-06', oee: 82, availability: 90, performance: 94, quality: 97 },
        { date: '01-07', oee: 85, availability: 92, performance: 95, quality: 97 },
        { date: '01-08', oee: 83, availability: 89, performance: 96, quality: 97 },
        { date: '01-09', oee: 86, availability: 93, performance: 95, quality: 97 },
        { date: '01-10', oee: 84, availability: 91, performance: 95, quality: 97 },
        { date: '01-11', oee: 87, availability: 94, performance: 95, quality: 98 },
        { date: '01-12', oee: 85, availability: 92, performance: 95, quality: 97 },
      ];
    }
    return oeeData.trend.map((item: any) => ({
      date: item.date?.slice(5) ?? '',
      oee: Math.round((item.oee ?? 0) * 100),
      availability: Math.round((item.availability ?? 0) * 100),
      performance: Math.round((item.performance ?? 0) * 100),
      quality: Math.round((item.quality ?? 0) * 100),
    }));
  }, [oeeData]);

  // 라인별 성능 비교 데이터
  const lineComparisonData = useMemo(() => {
    if (!equipmentStatus?.lines) {
      return [
        { line: 'SMT-L01', oee: 87, defectRate: 1.2, production: 2500 },
        { line: 'SMT-L02', oee: 82, defectRate: 1.8, production: 2200 },
        { line: 'SMT-L03', oee: 85, defectRate: 1.5, production: 2350 },
        { line: 'THT-L01', oee: 79, defectRate: 2.1, production: 1800 },
        { line: 'ASM-L01', oee: 83, defectRate: 1.6, production: 2100 },
      ];
    }
    return equipmentStatus.lines.slice(0, 5).map((line: any) => ({
      line: line.line_code,
      oee: Math.round((line.current_oee ?? 0) * 100),
      defectRate: Math.round((line.today_defect_rate ?? 0) * 10000) / 100,
      production: line.today_production ?? 0,
    }));
  }, [equipmentStatus]);

  // 불량 유형별 분석
  const defectTypeData = useMemo(() => {
    if (!defectPareto?.items) {
      return [
        { name: '솔더 브릿지', value: 35 },
        { name: '부품 누락', value: 25 },
        { name: '냉납', value: 18 },
        { name: '틀어짐', value: 12 },
        { name: '기타', value: 10 },
      ];
    }
    return defectPareto.items.slice(0, 5).map((item: any) => ({
      name: item.defect_name,
      value: Math.round(item.percentage ?? 0),
    }));
  }, [defectPareto]);

  // 레이더 차트 데이터 (종합 성과)
  const performanceRadarData = useMemo(() => {
    const summary = oeeData?.summary ?? {};
    const defectSummary = defectAnalysis?.summary ?? {};
    return [
      { metric: '가동률', value: Math.round((summary.avg_availability ?? 0.9) * 100), fullMark: 100 },
      { metric: '성능', value: Math.round((summary.avg_performance ?? 0.95) * 100), fullMark: 100 },
      { metric: '품질', value: Math.round((summary.avg_quality ?? 0.97) * 100), fullMark: 100 },
      { metric: '달성률', value: Math.round(productionSummary.achievementRate * 100), fullMark: 100 },
      { metric: '직행률', value: Math.round((100 - (defectSummary.avg_defect_rate ?? 1.5))), fullMark: 100 },
    ];
  }, [oeeData, defectAnalysis, productionSummary]);

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444'];

  const isLoading = productionLoading || oeeLoading || defectLoading || equipmentLoading;

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
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
            {(['production', 'quality', 'equipment', 'comparison'] as const).map((report) => (
              <button
                key={report}
                onClick={() => setSelectedReport(report)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedReport === report
                    ? 'bg-primary-500 text-white'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {report === 'production' ? '생산 분석' :
                 report === 'quality' ? '품질 분석' :
                 report === 'equipment' ? '설비 분석' : '비교 분석'}
              </button>
            ))}
          </div>

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

        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg text-sm text-white hover:bg-primary-700 transition-colors">
          <Download size={16} />
          리포트 내보내기
        </button>
      </div>

      {/* Production Analysis */}
      {selectedReport === 'production' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">총 생산량</p>
                  <p className="text-2xl font-bold text-white">
                    {productionSummary.totalProduction.toLocaleString()}
                  </p>
                </div>
                <div className={clsx(
                  'flex items-center gap-1 text-sm',
                  productionSummary.trend >= 0 ? 'text-green-400' : 'text-red-400'
                )}>
                  {productionSummary.trend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {Math.abs(productionSummary.trend).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="card">
              <p className="text-sm text-slate-400 mb-1">일평균 생산량</p>
              <p className="text-2xl font-bold text-white">
                {productionSummary.avgDailyProduction.toLocaleString()}
              </p>
            </div>

            <div className="card">
              <p className="text-sm text-slate-400 mb-1">평균 달성률</p>
              <p className={clsx(
                'text-2xl font-bold',
                productionSummary.achievementRate >= 1 ? 'text-green-400' : 'text-yellow-400'
              )}>
                {(productionSummary.achievementRate * 100).toFixed(1)}%
              </p>
            </div>

            <div className="card">
              <p className="text-sm text-slate-400 mb-1">평균 OEE</p>
              <p className={clsx(
                'text-2xl font-bold',
                (oeeData?.summary?.avg_oee ?? 0) >= 0.85 ? 'text-green-400' : 'text-yellow-400'
              )}>
                {((oeeData?.summary?.avg_oee ?? 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Production Chart */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title flex items-center gap-2">
                <BarChart2 className="text-blue-400" size={20} />
                일별 생산 실적
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={dailyProductionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(value) => (value / 1000).toFixed(0) + 'K'}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(value) => value + '%'}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>
                      {value === 'production' ? '생산량' : value === 'target' ? '목표' : '달성률'}
                    </span>
                  )}
                />
                <Bar yAxisId="left" dataKey="production" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" dataKey="target" stroke="#22c55e" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                <Line yAxisId="right" dataKey="achievement" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Quality Analysis */}
      {selectedReport === 'quality' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Defect Type Pie Chart */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title flex items-center gap-2">
                  <PieChartIcon className="text-red-400" size={20} />
                  불량 유형 분포
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={defectTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {defectTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value) => (
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Radar */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title flex items-center gap-2">
                  <Activity className="text-purple-400" size={20} />
                  종합 성과 지표
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={performanceRadarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Radar
                    name="현재 성과"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Equipment Analysis */}
      {selectedReport === 'equipment' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2">
              <TrendingUp className="text-green-400" size={20} />
              OEE 추이 분석
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={oeeTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                domain={[70, 100]}
                tickFormatter={(value) => value + '%'}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={(value: number) => [value + '%', '']}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>
                    {value === 'oee' ? 'OEE' : value === 'availability' ? '가동률' : value === 'performance' ? '성능' : '품질'}
                  </span>
                )}
              />
              <Line type="monotone" dataKey="oee" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6' }} />
              <Line type="monotone" dataKey="availability" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
              <Line type="monotone" dataKey="performance" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              <Line type="monotone" dataKey="quality" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Comparison Analysis */}
      {selectedReport === 'comparison' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2">
              <Target className="text-yellow-400" size={20} />
              라인별 성능 비교
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={lineComparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="line"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                yAxisId="left"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                domain={[0, 100]}
                tickFormatter={(value) => value + '%'}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(value) => (value / 1000).toFixed(1) + 'K'}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>
                    {value === 'oee' ? 'OEE' : value === 'defectRate' ? '불량률' : '생산량'}
                  </span>
                )}
              />
              <Bar yAxisId="left" dataKey="oee" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="defectRate" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="production" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Line Comparison Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">라인</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">OEE</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">불량률</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">생산량</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase">등급</th>
                </tr>
              </thead>
              <tbody>
                {lineComparisonData.map((line) => {
                  const grade = line.oee >= 85 ? 'A' : line.oee >= 75 ? 'B' : line.oee >= 65 ? 'C' : 'D';
                  return (
                    <tr key={line.line} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-sm font-medium text-white">{line.line}</td>
                      <td className={clsx(
                        'py-3 px-4 text-sm text-right font-bold',
                        line.oee >= 85 ? 'text-green-400' : line.oee >= 75 ? 'text-yellow-400' : 'text-red-400'
                      )}>
                        {line.oee}%
                      </td>
                      <td className={clsx(
                        'py-3 px-4 text-sm text-right',
                        line.defectRate <= 1.5 ? 'text-green-400' : line.defectRate <= 2 ? 'text-yellow-400' : 'text-red-400'
                      )}>
                        {line.defectRate.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-white">
                        {line.production.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={clsx(
                          'px-2 py-1 rounded text-xs font-bold',
                          grade === 'A' && 'bg-green-500/20 text-green-400',
                          grade === 'B' && 'bg-blue-500/20 text-blue-400',
                          grade === 'C' && 'bg-yellow-500/20 text-yellow-400',
                          grade === 'D' && 'bg-red-500/20 text-red-400'
                        )}>
                          {grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
