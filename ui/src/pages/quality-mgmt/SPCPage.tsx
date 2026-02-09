import { useState } from 'react';
import {
  Activity,
  Search,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Settings,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

interface SPCParameter {
  paramCode: string;
  paramName: string;
  productCode: string;
  productName: string;
  lineCode: string;
  lineName: string;
  target: number;
  usl: number;
  lsl: number;
  ucl: number;
  lcl: number;
  unit: string;
  cpk: number;
  status: 'IN_CONTROL' | 'WARNING' | 'OUT_OF_CONTROL';
}

interface SPCData {
  sampleNo: number;
  timestamp: string;
  value: number;
  xBar: number;
  range: number;
}

const mockParameters: SPCParameter[] = [
  {
    paramCode: 'SPC-001',
    paramName: '솔더 온도',
    productCode: 'FG-SMB-001',
    productName: '스마트폰 메인보드 A1',
    lineCode: 'SMT-L01',
    lineName: 'SMT 1라인',
    target: 250,
    usl: 260,
    lsl: 240,
    ucl: 258,
    lcl: 242,
    unit: '°C',
    cpk: 1.45,
    status: 'IN_CONTROL',
  },
  {
    paramCode: 'SPC-002',
    paramName: '부품 위치 정확도',
    productCode: 'FG-SMB-001',
    productName: '스마트폰 메인보드 A1',
    lineCode: 'SMT-L01',
    lineName: 'SMT 1라인',
    target: 0,
    usl: 0.05,
    lsl: -0.05,
    ucl: 0.04,
    lcl: -0.04,
    unit: 'mm',
    cpk: 1.12,
    status: 'WARNING',
  },
  {
    paramCode: 'SPC-003',
    paramName: '솔더 페이스트 높이',
    productCode: 'FG-PWR-001',
    productName: '전원보드 P1',
    lineCode: 'SMT-L02',
    lineName: 'SMT 2라인',
    target: 150,
    usl: 180,
    lsl: 120,
    ucl: 175,
    lcl: 125,
    unit: 'μm',
    cpk: 1.67,
    status: 'IN_CONTROL',
  },
  {
    paramCode: 'SPC-004',
    paramName: '리플로우 시간',
    productCode: 'FG-LED-001',
    productName: 'LED 드라이버 L1',
    lineCode: 'SMT-L03',
    lineName: 'SMT 3라인',
    target: 180,
    usl: 200,
    lsl: 160,
    ucl: 195,
    lcl: 165,
    unit: 'sec',
    cpk: 0.85,
    status: 'OUT_OF_CONTROL',
  },
];

const generateSPCData = (param: SPCParameter): SPCData[] => {
  const data: SPCData[] = [];
  const baseValue = param.target;
  const range = (param.usl - param.lsl) / 4;

  for (let i = 1; i <= 25; i++) {
    let variation = (Math.random() - 0.5) * range;

    // Add some trend or out-of-control points based on status
    if (param.status === 'OUT_OF_CONTROL' && i > 18) {
      variation = range * 0.8 * (i > 22 ? 1.2 : 1);
    } else if (param.status === 'WARNING' && i > 20) {
      variation = range * 0.6;
    }

    const value = baseValue + variation;
    data.push({
      sampleNo: i,
      timestamp: `14:${String(i * 2).padStart(2, '0')}`,
      value: Number(value.toFixed(2)),
      xBar: Number((baseValue + (Math.random() - 0.5) * range * 0.5).toFixed(2)),
      range: Number((Math.abs(variation) * 2).toFixed(2)),
    });
  }
  return data;
};

const statusConfig = {
  IN_CONTROL: { label: '관리상태', color: 'bg-green-500', icon: CheckCircle },
  WARNING: { label: '경고', color: 'bg-yellow-500', icon: AlertTriangle },
  OUT_OF_CONTROL: { label: '이상', color: 'bg-red-500', icon: AlertTriangle },
};

export default function SPCPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedParam, setSelectedParam] = useState<SPCParameter>(mockParameters[0]);
  const [chartType, setChartType] = useState<'xbar' | 'range'>('xbar');

  const filteredParams = mockParameters.filter(param => {
    const matchesSearch = param.paramCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          param.paramName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || param.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const spcData = generateSPCData(selectedParam);

  const summary = {
    total: mockParameters.length,
    inControl: mockParameters.filter(p => p.status === 'IN_CONTROL').length,
    warning: mockParameters.filter(p => p.status === 'WARNING').length,
    outOfControl: mockParameters.filter(p => p.status === 'OUT_OF_CONTROL').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="h-8 w-8 text-cyan-400" />
            SPC (통계적 공정관리)
          </h1>
          <p className="text-slate-400 mt-1">공정 품질 파라미터의 관리도를 분석합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors">
            <Download className="h-4 w-4" />
            보고서
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">전체 파라미터</p>
          <p className="text-2xl font-bold text-white">{summary.total}개</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">관리상태</p>
          <p className="text-2xl font-bold text-green-400">{summary.inControl}개</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">경고</p>
          <p className="text-2xl font-bold text-yellow-400">{summary.warning}개</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">이상</p>
          <p className="text-2xl font-bold text-red-400">{summary.outOfControl}개</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Parameter List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="파라미터 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 text-sm"
              >
                <option value="ALL">전체</option>
                <option value="IN_CONTROL">관리상태</option>
                <option value="WARNING">경고</option>
                <option value="OUT_OF_CONTROL">이상</option>
              </select>
            </div>
          </div>
          <div className="divide-y divide-slate-700 max-h-[500px] overflow-y-auto">
            {filteredParams.map((param) => {
              const StatusIcon = statusConfig[param.status].icon;
              return (
                <div
                  key={param.paramCode}
                  className={`p-4 cursor-pointer hover:bg-slate-700/50 ${
                    selectedParam.paramCode === param.paramCode ? 'bg-slate-700/50 border-l-2 border-cyan-400' : ''
                  }`}
                  onClick={() => setSelectedParam(param)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-medium">{param.paramName}</p>
                      <p className="text-xs text-slate-400">{param.paramCode}</p>
                      <p className="text-xs text-slate-500 mt-1">{param.lineName}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white ${statusConfig[param.status].color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[param.status].label}
                      </span>
                      <p className="text-sm mt-1">
                        <span className="text-slate-400">Cpk: </span>
                        <span className={param.cpk >= 1.33 ? 'text-green-400' : param.cpk >= 1.0 ? 'text-yellow-400' : 'text-red-400'}>
                          {param.cpk}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SPC Chart */}
        <div className="col-span-2 space-y-6">
          {/* Chart Controls */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedParam.paramName}</h3>
                <p className="text-sm text-slate-400">{selectedParam.productName} - {selectedParam.lineName}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType('xbar')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    chartType === 'xbar' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  X-bar 관리도
                </button>
                <button
                  onClick={() => setChartType('range')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    chartType === 'range' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  R 관리도
                </button>
              </div>
            </div>
          </div>

          {/* Control Chart */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h4 className="text-white font-medium mb-4">
              {chartType === 'xbar' ? 'X-bar 관리도' : 'R (범위) 관리도'}
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={spcData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="sampleNo" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={chartType === 'xbar' ? [selectedParam.lsl - 5, selectedParam.usl + 5] : undefined} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />

                {chartType === 'xbar' ? (
                  <>
                    <ReferenceLine y={selectedParam.usl} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'USL', fill: '#ef4444', position: 'right' }} />
                    <ReferenceLine y={selectedParam.ucl} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'UCL', fill: '#f97316', position: 'right' }} />
                    <ReferenceLine y={selectedParam.target} stroke="#22c55e" strokeWidth={2} label={{ value: 'CL', fill: '#22c55e', position: 'right' }} />
                    <ReferenceLine y={selectedParam.lcl} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'LCL', fill: '#f97316', position: 'right' }} />
                    <ReferenceLine y={selectedParam.lsl} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'LSL', fill: '#ef4444', position: 'right' }} />
                    <Line type="monotone" dataKey="value" name="측정값" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 4 }} />
                  </>
                ) : (
                  <>
                    <ReferenceLine y={(selectedParam.usl - selectedParam.lsl) * 0.3} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'UCL', fill: '#f97316', position: 'right' }} />
                    <ReferenceLine y={(selectedParam.usl - selectedParam.lsl) * 0.15} stroke="#22c55e" strokeWidth={2} label={{ value: 'CL', fill: '#22c55e', position: 'right' }} />
                    <Line type="monotone" dataKey="range" name="범위" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 4 }} />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Parameter Details */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-cyan-400" />
              파라미터 상세
            </h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400">목표값 (CL)</p>
                <p className="text-lg font-bold text-green-400">{selectedParam.target} {selectedParam.unit}</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400">USL / LSL</p>
                <p className="text-lg font-bold text-white">{selectedParam.usl} / {selectedParam.lsl}</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400">UCL / LCL</p>
                <p className="text-lg font-bold text-orange-400">{selectedParam.ucl} / {selectedParam.lcl}</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400">Cpk</p>
                <p className={`text-lg font-bold ${
                  selectedParam.cpk >= 1.33 ? 'text-green-400' : selectedParam.cpk >= 1.0 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {selectedParam.cpk}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-slate-900 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">공정능력 평가</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  selectedParam.cpk >= 1.33 ? 'bg-green-500/20 text-green-400' :
                  selectedParam.cpk >= 1.0 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {selectedParam.cpk >= 1.33 ? '우수 (Cpk ≥ 1.33)' :
                   selectedParam.cpk >= 1.0 ? '보통 (1.0 ≤ Cpk < 1.33)' :
                   '불량 (Cpk < 1.0)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
