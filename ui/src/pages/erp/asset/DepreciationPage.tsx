import { useState } from 'react';
import { TrendingDown, Calendar, Calculator, Play, CheckCircle2, AlertTriangle, FileText, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DepreciationSchedule {
  id: string;
  assetCode: string;
  assetName: string;
  category: string;
  period: string; // YYYY-MM
  beginningBookValue: number;
  depreciationAmount: number;
  accumulatedDepreciation: number;
  endingBookValue: number;
  method: string;
  status: 'scheduled' | 'processed' | 'adjusted';
}

interface MonthlyDepreciation {
  month: string;
  building: number;
  machinery: number;
  vehicle: number;
  equipment: number;
  intangible: number;
  total: number;
}

const mockSchedules: DepreciationSchedule[] = [
  {
    id: '1',
    assetCode: 'FA-BLD-001',
    assetName: '본사 사옥',
    category: '건물',
    period: '2024-01',
    beginningBookValue: 4559375000,
    depreciationAmount: 9375000,
    accumulatedDepreciation: 450000000,
    endingBookValue: 4550000000,
    method: '정액법',
    status: 'processed',
  },
  {
    id: '2',
    assetCode: 'FA-MCH-001',
    assetName: 'SMT 라인 설비 #1',
    category: '기계장치',
    period: '2024-01',
    beginningBookValue: 703375000,
    depreciationAmount: 6375000,
    accumulatedDepreciation: 153000000,
    endingBookValue: 697000000,
    method: '정액법',
    status: 'processed',
  },
  {
    id: '3',
    assetCode: 'FA-MCH-002',
    assetName: 'SMT 라인 설비 #2',
    category: '기계장치',
    period: '2024-01',
    beginningBookValue: 802700000,
    depreciationAmount: 6900000,
    accumulatedDepreciation: 124200000,
    endingBookValue: 795800000,
    method: '정액법',
    status: 'processed',
  },
  {
    id: '4',
    assetCode: 'FA-MCH-003',
    assetName: 'AOI 검사기',
    category: '기계장치',
    period: '2024-01',
    beginningBookValue: 403593750,
    depreciationAmount: 4218750,
    accumulatedDepreciation: 50625000,
    endingBookValue: 399375000,
    method: '정액법',
    status: 'processed',
  },
  {
    id: '5',
    assetCode: 'FA-VHC-001',
    assetName: '배송 트럭 1호',
    category: '차량운반구',
    period: '2024-01',
    beginningBookValue: 35840000,
    depreciationAmount: 3540000,
    accumulatedDepreciation: 52700000,
    endingBookValue: 32300000,
    method: '정률법',
    status: 'processed',
  },
  {
    id: '6',
    assetCode: 'FA-EQP-001',
    assetName: '서버 랙 시스템',
    category: '설비',
    period: '2024-01',
    beginningBookValue: 107400000,
    depreciationAmount: 1800000,
    accumulatedDepreciation: 14400000,
    endingBookValue: 105600000,
    method: '정액법',
    status: 'processed',
  },
  {
    id: '7',
    assetCode: 'FA-INT-001',
    assetName: 'ERP 시스템 라이선스',
    category: '무형자산',
    period: '2024-01',
    beginningBookValue: 123333333,
    depreciationAmount: 3333333,
    accumulatedDepreciation: 80000000,
    endingBookValue: 120000000,
    method: '정액법',
    status: 'processed',
  },
];

const monthlyData: MonthlyDepreciation[] = [
  { month: '8월', building: 9375, machinery: 17494, vehicle: 3540, equipment: 1800, intangible: 3333, total: 35542 },
  { month: '9월', building: 9375, machinery: 17494, vehicle: 3540, equipment: 1800, intangible: 3333, total: 35542 },
  { month: '10월', building: 9375, machinery: 17494, vehicle: 3540, equipment: 1800, intangible: 3333, total: 35542 },
  { month: '11월', building: 9375, machinery: 17494, vehicle: 3540, equipment: 1800, intangible: 3333, total: 35542 },
  { month: '12월', building: 9375, machinery: 17494, vehicle: 3540, equipment: 1800, intangible: 3333, total: 35542 },
  { month: '1월', building: 9375, machinery: 17494, vehicle: 3540, equipment: 1800, intangible: 3333, total: 35542 },
];

const categoryTotals = [
  { name: '건물', amount: 112500000, percent: 26.4 },
  { name: '기계장치', amount: 209925000, percent: 49.2 },
  { name: '차량운반구', amount: 42480000, percent: 10.0 },
  { name: '설비', amount: 21600000, percent: 5.1 },
  { name: '무형자산', amount: 40000000, percent: 9.4 },
];

export default function DepreciationPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredSchedules = mockSchedules.filter(
    schedule => selectedCategory === 'all' || schedule.category === selectedCategory
  );

  const totalMonthlyDepreciation = filteredSchedules.reduce((sum, s) => sum + s.depreciationAmount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'bg-green-500/20 text-green-400';
      case 'scheduled': return 'bg-blue-500/20 text-blue-400';
      case 'adjusted': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'processed': return '처리완료';
      case 'scheduled': return '예정';
      case 'adjusted': return '조정';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`;
    } else if (value >= 10000000) {
      return `${(value / 10000000).toFixed(1)}천만`;
    } else if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}만`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">감가상각 관리</h1>
          <p className="text-slate-400">월별 감가상각비 계산 및 처리</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            내보내기
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Play className="w-4 h-4" />
            상각비 계산
          </button>
        </div>
      </div>

      {/* Period Selector & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium">상각 기간</span>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="2024-01">2024년 1월</option>
            <option value="2023-12">2023년 12월</option>
            <option value="2023-11">2023년 11월</option>
            <option value="2023-10">2023년 10월</option>
          </select>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingDown className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">당월 상각비</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalMonthlyDepreciation)}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">처리 현황</p>
              <p className="text-xl font-bold text-white">{filteredSchedules.filter(s => s.status === 'processed').length}/{filteredSchedules.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Calculator className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">연간 상각비 (예상)</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalMonthlyDepreciation * 12)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">월별 감가상각비 추이</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v/1000}천`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => [`${value.toLocaleString()}천원`, '']}
              />
              <Bar dataKey="building" stackId="a" fill="#3b82f6" name="건물" />
              <Bar dataKey="machinery" stackId="a" fill="#8b5cf6" name="기계장치" />
              <Bar dataKey="vehicle" stackId="a" fill="#06b6d4" name="차량" />
              <Bar dataKey="equipment" stackId="a" fill="#f59e0b" name="설비" />
              <Bar dataKey="intangible" stackId="a" fill="#ec4899" name="무형자산" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-medium mb-4">자산유형별 연간 상각비</h3>
          <div className="space-y-3">
            {categoryTotals.map((cat, idx) => {
              const colors = ['bg-blue-500', 'bg-purple-500', 'bg-cyan-500', 'bg-amber-500', 'bg-pink-500'];
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{cat.name}</span>
                    <span className="text-white">{formatCurrency(cat.amount)} ({cat.percent}%)</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[idx]} rounded-full`}
                      style={{ width: `${cat.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">연간 합계</span>
              <span className="text-xl font-bold text-white">
                {formatCurrency(categoryTotals.reduce((sum, c) => sum + c.amount, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">전체 유형</option>
          <option value="건물">건물</option>
          <option value="기계장치">기계장치</option>
          <option value="차량운반구">차량운반구</option>
          <option value="설비">설비</option>
          <option value="무형자산">무형자산</option>
        </select>
        <span className="text-slate-400">
          {filteredSchedules.length}건의 상각 내역
        </span>
      </div>

      {/* Depreciation Schedule Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">자산코드</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">자산명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">유형</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">상각방법</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">기초장부가</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">당월상각비</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">상각누계액</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">기말장부가</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredSchedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-blue-400 font-mono text-sm">{schedule.assetCode}</span>
                  </td>
                  <td className="px-4 py-3 text-white">{schedule.assetName}</td>
                  <td className="px-4 py-3 text-slate-300">{schedule.category}</td>
                  <td className="px-4 py-3 text-slate-300">{schedule.method}</td>
                  <td className="px-4 py-3 text-right text-white">
                    {schedule.beginningBookValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-red-400 font-medium">
                    -{schedule.depreciationAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-orange-400">
                    {schedule.accumulatedDepreciation.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-green-400 font-medium">
                    {schedule.endingBookValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStatusColor(schedule.status)}`}>
                      {getStatusLabel(schedule.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-700/30">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-right text-white font-medium">합계</td>
                <td className="px-4 py-3 text-right text-red-400 font-bold">
                  -{totalMonthlyDepreciation.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-orange-400 font-bold">
                  {filteredSchedules.reduce((sum, s) => sum + s.accumulatedDepreciation, 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-green-400 font-bold">
                  {filteredSchedules.reduce((sum, s) => sum + s.endingBookValue, 0).toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-blue-400 font-medium">감가상각 처리 안내</h4>
            <p className="text-slate-300 text-sm mt-1">
              월말 마감 시 '상각비 계산' 버튼을 클릭하여 당월 감가상각비를 일괄 계산할 수 있습니다.
              계산된 상각비는 원가관리 모듈의 제조원가 및 일반관리비에 자동 배부됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
