import { useState } from 'react';
import {
  Factory,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Activity,
  Settings,
  Users,
  Zap,
} from 'lucide-react';

interface ProductionLine {
  lineCode: string;
  lineName: string;
  lineType: 'SMT' | 'THT' | 'ASSEMBLY' | 'TEST';
  factoryCode: string;
  factoryName: string;
  capacity: number;
  capacityUnit: string;
  operatingHours: number;
  shiftCount: number;
  workerCount: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  oeeTarget: number;
  description: string;
}

const mockLines: ProductionLine[] = [
  {
    lineCode: 'SMT-L01',
    lineName: 'SMT 1라인',
    lineType: 'SMT',
    factoryCode: 'F01',
    factoryName: '본사 1공장',
    capacity: 3000,
    capacityUnit: 'EA/일',
    operatingHours: 20,
    shiftCount: 3,
    workerCount: 6,
    status: 'ACTIVE',
    oeeTarget: 85,
    description: '고속 SMT 라인 (스마트폰 메인보드)',
  },
  {
    lineCode: 'SMT-L02',
    lineName: 'SMT 2라인',
    lineType: 'SMT',
    factoryCode: 'F01',
    factoryName: '본사 1공장',
    capacity: 2500,
    capacityUnit: 'EA/일',
    operatingHours: 20,
    shiftCount: 3,
    workerCount: 5,
    status: 'ACTIVE',
    oeeTarget: 82,
    description: '중형 SMT 라인 (전원보드)',
  },
  {
    lineCode: 'SMT-L03',
    lineName: 'SMT 3라인',
    lineType: 'SMT',
    factoryCode: 'F01',
    factoryName: '본사 1공장',
    capacity: 4000,
    capacityUnit: 'EA/일',
    operatingHours: 20,
    shiftCount: 3,
    workerCount: 4,
    status: 'MAINTENANCE',
    oeeTarget: 80,
    description: '소형 SMT 라인 (LED 드라이버)',
  },
  {
    lineCode: 'SMT-L04',
    lineName: 'SMT 4라인',
    lineType: 'SMT',
    factoryCode: 'F01',
    factoryName: '본사 1공장',
    capacity: 2000,
    capacityUnit: 'EA/일',
    operatingHours: 16,
    shiftCount: 2,
    workerCount: 4,
    status: 'ACTIVE',
    oeeTarget: 83,
    description: 'IoT 모듈 전용 라인',
  },
  {
    lineCode: 'THT-L01',
    lineName: 'THT 1라인',
    lineType: 'THT',
    factoryCode: 'F01',
    factoryName: '본사 1공장',
    capacity: 1500,
    capacityUnit: 'EA/일',
    operatingHours: 16,
    shiftCount: 2,
    workerCount: 8,
    status: 'ACTIVE',
    oeeTarget: 78,
    description: 'Through-Hole 삽입 라인',
  },
  {
    lineCode: 'ASM-L01',
    lineName: '조립 1라인',
    lineType: 'ASSEMBLY',
    factoryCode: 'F02',
    factoryName: '본사 2공장',
    capacity: 800,
    capacityUnit: 'EA/일',
    operatingHours: 16,
    shiftCount: 2,
    workerCount: 12,
    status: 'ACTIVE',
    oeeTarget: 75,
    description: '최종 조립 라인 (ECU)',
  },
  {
    lineCode: 'TST-L01',
    lineName: '테스트 1라인',
    lineType: 'TEST',
    factoryCode: 'F02',
    factoryName: '본사 2공장',
    capacity: 2000,
    capacityUnit: 'EA/일',
    operatingHours: 20,
    shiftCount: 3,
    workerCount: 4,
    status: 'ACTIVE',
    oeeTarget: 90,
    description: 'ICT/FCT 테스트 라인',
  },
  {
    lineCode: 'SMT-L05',
    lineName: 'SMT 5라인',
    lineType: 'SMT',
    factoryCode: 'F02',
    factoryName: '본사 2공장',
    capacity: 1800,
    capacityUnit: 'EA/일',
    operatingHours: 16,
    shiftCount: 2,
    workerCount: 5,
    status: 'INACTIVE',
    oeeTarget: 80,
    description: '예비 SMT 라인',
  },
];

const lineTypeConfig = {
  SMT: { label: 'SMT', color: 'bg-blue-500' },
  THT: { label: 'THT', color: 'bg-purple-500' },
  ASSEMBLY: { label: '조립', color: 'bg-amber-500' },
  TEST: { label: '테스트', color: 'bg-cyan-500' },
};

const statusConfig = {
  ACTIVE: { label: '가동중', color: 'bg-green-500', icon: CheckCircle },
  INACTIVE: { label: '비가동', color: 'bg-slate-500', icon: XCircle },
  MAINTENANCE: { label: '보전중', color: 'bg-yellow-500', icon: Settings },
};

export default function LinePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedLine, setSelectedLine] = useState<ProductionLine | null>(mockLines[0]);

  const filteredLines = mockLines.filter(line => {
    const matchesSearch = line.lineCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          line.lineName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || line.lineType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || line.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const summary = {
    total: mockLines.length,
    active: mockLines.filter(l => l.status === 'ACTIVE').length,
    totalCapacity: mockLines.filter(l => l.status === 'ACTIVE').reduce((sum, l) => sum + l.capacity, 0),
    totalWorkers: mockLines.reduce((sum, l) => sum + l.workerCount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Factory className="h-8 w-8 text-cyan-400" />
            라인관리
          </h1>
          <p className="text-slate-400 mt-1">생산라인 정보를 등록하고 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors">
            <Plus className="h-4 w-4" />
            라인 등록
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-700 rounded-lg">
              <Factory className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">전체 라인</p>
              <p className="text-2xl font-bold text-white">{summary.total}개</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Activity className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">가동중</p>
              <p className="text-2xl font-bold text-green-400">{summary.active}개</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Zap className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">총 생산능력</p>
              <p className="text-2xl font-bold text-cyan-400">{summary.totalCapacity.toLocaleString()}/일</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Users className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">총 작업자</p>
              <p className="text-2xl font-bold text-amber-400">{summary.totalWorkers}명</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Line List */}
        <div className="col-span-2 bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="라인코드 또는 라인명 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 text-sm"
              >
                <option value="ALL">전체 유형</option>
                <option value="SMT">SMT</option>
                <option value="THT">THT</option>
                <option value="ASSEMBLY">조립</option>
                <option value="TEST">테스트</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 text-sm"
              >
                <option value="ALL">전체 상태</option>
                <option value="ACTIVE">가동중</option>
                <option value="INACTIVE">비가동</option>
                <option value="MAINTENANCE">보전중</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">라인코드</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">라인명</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">유형</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">공장</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">생산능력</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">상태</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredLines.map((line) => {
                  const StatusIcon = statusConfig[line.status].icon;
                  return (
                    <tr
                      key={line.lineCode}
                      className={`hover:bg-slate-700/50 cursor-pointer ${
                        selectedLine?.lineCode === line.lineCode ? 'bg-slate-700/50' : ''
                      }`}
                      onClick={() => setSelectedLine(line)}
                    >
                      <td className="px-4 py-3 text-cyan-400 font-medium">{line.lineCode}</td>
                      <td className="px-4 py-3 text-white">{line.lineName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs text-white ${lineTypeConfig[line.lineType].color}`}>
                          {lineTypeConfig[line.lineType].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-300">{line.factoryName}</td>
                      <td className="px-4 py-3 text-right text-white">{line.capacity.toLocaleString()} {line.capacityUnit}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white ${statusConfig[line.status].color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[line.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Line Detail */}
        {selectedLine && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">{selectedLine.lineName}</h3>
              <span className={`px-2 py-1 rounded text-xs text-white ${lineTypeConfig[selectedLine.lineType].color}`}>
                {lineTypeConfig[selectedLine.lineType].label}
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400">라인코드</p>
                  <p className="text-white font-medium">{selectedLine.lineCode}</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400">공장</p>
                  <p className="text-white">{selectedLine.factoryName}</p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">설명</p>
                <p className="text-white text-sm">{selectedLine.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400">생산능력</p>
                  <p className="text-cyan-400 font-bold text-lg">{selectedLine.capacity.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{selectedLine.capacityUnit}</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400">OEE 목표</p>
                  <p className="text-emerald-400 font-bold text-lg">{selectedLine.oeeTarget}%</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400">가동시간</p>
                  <p className="text-white font-medium">{selectedLine.operatingHours}시간</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400">교대</p>
                  <p className="text-white font-medium">{selectedLine.shiftCount}교대</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400">작업자</p>
                  <p className="text-white font-medium">{selectedLine.workerCount}명</p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-2">현재 상태</p>
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-white ${statusConfig[selectedLine.status].color}`}>
                  {(() => {
                    const StatusIcon = statusConfig[selectedLine.status].icon;
                    return <StatusIcon className="h-4 w-4" />;
                  })()}
                  {statusConfig[selectedLine.status].label}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
