import { useState, useMemo } from 'react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Cpu, Activity, AlertTriangle, Clock, Wrench, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import {
  useEquipmentList,
  useAllEquipmentStatus,
  useOEEData,
  useDowntimeEvents,
  useEquipmentWebSocket,
} from '../hooks';

export default function Equipment() {
  const [selectedLine, setSelectedLine] = useState<string>('all');

  // WebSocket 연결
  useEquipmentWebSocket();

  // API 데이터 조회
  const { data: equipmentList, isLoading: equipmentLoading } = useEquipmentList();
  const { data: equipmentStatus, isLoading: statusLoading } = useAllEquipmentStatus();
  const { data: oeeData, isLoading: oeeLoading } = useOEEData();
  const { data: downtimeEvents, isLoading: downtimeLoading } = useDowntimeEvents({ page_size: 100 });

  // 라인 목록 추출
  const lineOptions = useMemo(() => {
    if (!equipmentStatus?.lines) return [];
    return equipmentStatus.lines.map((line: any) => ({
      code: line.line_code,
      name: line.line_name,
    }));
  }, [equipmentStatus]);

  // 설비 OEE 데이터 필터링
  const filteredEquipment = useMemo(() => {
    if (!oeeData?.equipment) return [];

    const equipment = oeeData.equipment.map((e: any) => ({
      equipmentCode: e.equipment_code,
      equipmentName: e.equipment_name,
      lineCode: e.line_code,
      availability: e.availability ?? 0,
      performance: e.performance ?? 0,
      quality: e.quality ?? 0,
      oee: e.oee ?? 0,
      downtimeMin: e.downtime_min ?? 0,
    }));

    return selectedLine === 'all'
      ? equipment
      : equipment.filter((e: any) => e.lineCode === selectedLine);
  }, [oeeData, selectedLine]);

  // OEE 게이지 데이터
  const oeeGaugeData = useMemo(() => {
    const summary = oeeData?.summary ?? {};
    return [
      { name: '품질', value: (summary.avg_quality ?? 0) * 100, fill: '#22c55e' },
      { name: '성능', value: (summary.avg_performance ?? 0) * 100, fill: '#3b82f6' },
      { name: '가동률', value: (summary.avg_availability ?? 0) * 100, fill: '#f59e0b' },
      { name: 'OEE', value: (summary.avg_oee ?? 0) * 100, fill: '#8b5cf6' },
    ];
  }, [oeeData]);

  const avgOEE = useMemo(() => {
    return Math.round((oeeData?.summary?.avg_oee ?? 0) * 100);
  }, [oeeData]);

  // 설비 상태 카운트
  const statusCounts = useMemo(() => {
    if (!equipmentStatus?.equipment) {
      return { running: 0, idle: 0, down: 0, maintenance: 0 };
    }

    const equipment = equipmentStatus.equipment;
    return {
      running: equipment.filter((e: any) => e.status === 'running').length,
      idle: equipment.filter((e: any) => e.status === 'idle').length,
      down: equipment.filter((e: any) => e.status === 'down').length,
      maintenance: equipment.filter((e: any) => e.status === 'maintenance').length,
    };
  }, [equipmentStatus]);

  // 다운타임 분석 데이터
  const downtimeAnalysis = useMemo(() => {
    if (!downtimeEvents?.items) {
      return [
        { cause: '셋업/품종변경', time: 0, color: 'bg-yellow-500' },
        { cause: '자재 대기', time: 0, color: 'bg-orange-500' },
        { cause: '설비 고장', time: 0, color: 'bg-red-500' },
        { cause: '품질 이상', time: 0, color: 'bg-purple-500' },
        { cause: '예방 보전', time: 0, color: 'bg-blue-500' },
        { cause: '기타', time: 0, color: 'bg-slate-500' },
      ];
    }

    // 다운타임 원인별 집계
    const causeMap: Record<string, number> = {};
    downtimeEvents.items.forEach((event: any) => {
      const cause = event.downtime_reason || '기타';
      const duration = event.duration_min || 0;
      causeMap[cause] = (causeMap[cause] || 0) + duration;
    });

    const colorMap: Record<string, string> = {
      '셋업': 'bg-yellow-500',
      '품종변경': 'bg-yellow-500',
      '자재 대기': 'bg-orange-500',
      '자재대기': 'bg-orange-500',
      '설비 고장': 'bg-red-500',
      '고장': 'bg-red-500',
      '품질 이상': 'bg-purple-500',
      '품질이상': 'bg-purple-500',
      '예방 보전': 'bg-blue-500',
      '정기점검': 'bg-blue-500',
      '보전': 'bg-blue-500',
    };

    return Object.entries(causeMap)
      .map(([cause, time]) => ({
        cause,
        time,
        color: colorMap[cause] || 'bg-slate-500',
      }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 6);
  }, [downtimeEvents]);

  const isLoading = equipmentLoading || statusLoading || oeeLoading;

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
            value={selectedLine}
            onChange={(e) => setSelectedLine(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
          >
            <option value="all">전체 라인</option>
            {lineOptions.map((line) => (
              <option key={line.code} value={line.code}>
                {line.code} - {line.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-green-900/30 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/20">
              <Activity className="text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">가동 중</p>
              <p className="text-2xl font-bold text-white">{statusCounts.running}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-900/30 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-500/20">
              <Clock className="text-yellow-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">대기</p>
              <p className="text-2xl font-bold text-white">{statusCounts.idle}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-900/30 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-500/20">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">정지</p>
              <p className="text-2xl font-bold text-white">{statusCounts.down}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-900/30 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Wrench className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">보전</p>
              <p className="text-2xl font-bold text-white">{statusCounts.maintenance}</p>
            </div>
          </div>
        </div>
      </div>

      {/* OEE Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OEE Gauge */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">전체 OEE 현황</h2>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="30%"
              outerRadius="100%"
              data={oeeGaugeData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={10}
                background={{ fill: '#1e293b' }}
              />
              <Legend
                iconSize={10}
                layout="horizontal"
                verticalAlign="bottom"
                formatter={(value) => (
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
                )}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
              />
            </RadialBarChart>
          </ResponsiveContainer>

          <div className="text-center -mt-8">
            <p className="text-4xl font-bold text-white">{avgOEE}%</p>
            <p className="text-sm text-slate-400">종합 OEE</p>
          </div>
        </div>

        {/* Equipment List */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h2 className="card-title">설비별 OEE</h2>
            <span className="text-sm text-slate-400">{filteredEquipment.length}대</span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-800">
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">설비</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">라인</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">가동률</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">성능</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">품질</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">OEE</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">다운타임</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map((equip, index) => {
                  const oeeColor =
                    equip.oee >= 0.85
                      ? 'text-green-400'
                      : equip.oee >= 0.75
                      ? 'text-yellow-400'
                      : 'text-red-400';

                  return (
                    <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-700">
                            <Cpu size={16} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{equip.equipmentName}</p>
                            <p className="text-xs text-slate-500">{equip.equipmentCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-300">{equip.lineCode}</td>
                      <td className="py-3 px-4 text-sm text-right text-slate-300">
                        {(equip.availability * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-slate-300">
                        {(equip.performance * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-slate-300">
                        {(equip.quality * 100).toFixed(1)}%
                      </td>
                      <td className={clsx('py-3 px-4 text-sm text-right font-bold', oeeColor)}>
                        {(equip.oee * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-slate-400">
                        {equip.downtimeMin}분
                      </td>
                    </tr>
                  );
                })}
                {filteredEquipment.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      설비 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Downtime Analysis */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">다운타임 분석 (금일)</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {downtimeAnalysis.map((item, index) => (
            <div key={index} className="p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className={clsx('w-3 h-3 rounded-full', item.color)} />
                <span className="text-sm text-slate-400">{item.cause}</span>
              </div>
              <p className="text-2xl font-bold text-white">{item.time}분</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
