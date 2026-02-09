import { useState } from 'react';
import { Award, Search, Plus, Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface Position {
  id: string;
  positionCode: string;
  positionName: string;
  positionLevel: number;
  employeeCount: number;
  baseSalaryMin: number;
  baseSalaryMax: number;
  isActive: boolean;
}

const mockPositions: Position[] = [
  {
    id: '1',
    positionCode: 'POS-CEO',
    positionName: '대표이사',
    positionLevel: 1,
    employeeCount: 1,
    baseSalaryMin: 200000000,
    baseSalaryMax: 500000000,
    isActive: true,
  },
  {
    id: '2',
    positionCode: 'POS-EXEC',
    positionName: '임원',
    positionLevel: 2,
    employeeCount: 3,
    baseSalaryMin: 120000000,
    baseSalaryMax: 200000000,
    isActive: true,
  },
  {
    id: '3',
    positionCode: 'POS-DIR',
    positionName: '이사',
    positionLevel: 3,
    employeeCount: 5,
    baseSalaryMin: 90000000,
    baseSalaryMax: 120000000,
    isActive: true,
  },
  {
    id: '4',
    positionCode: 'POS-MGR',
    positionName: '부장',
    positionLevel: 4,
    employeeCount: 12,
    baseSalaryMin: 70000000,
    baseSalaryMax: 90000000,
    isActive: true,
  },
  {
    id: '5',
    positionCode: 'POS-SM',
    positionName: '차장',
    positionLevel: 5,
    employeeCount: 18,
    baseSalaryMin: 55000000,
    baseSalaryMax: 70000000,
    isActive: true,
  },
  {
    id: '6',
    positionCode: 'POS-ASM',
    positionName: '과장',
    positionLevel: 6,
    employeeCount: 25,
    baseSalaryMin: 45000000,
    baseSalaryMax: 55000000,
    isActive: true,
  },
  {
    id: '7',
    positionCode: 'POS-SR',
    positionName: '대리',
    positionLevel: 7,
    employeeCount: 35,
    baseSalaryMin: 38000000,
    baseSalaryMax: 45000000,
    isActive: true,
  },
  {
    id: '8',
    positionCode: 'POS-JR',
    positionName: '사원',
    positionLevel: 8,
    employeeCount: 45,
    baseSalaryMin: 30000000,
    baseSalaryMax: 38000000,
    isActive: true,
  },
  {
    id: '9',
    positionCode: 'POS-INT',
    positionName: '인턴',
    positionLevel: 9,
    employeeCount: 8,
    baseSalaryMin: 24000000,
    baseSalaryMax: 30000000,
    isActive: true,
  },
];

export default function PositionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredPositions = mockPositions.filter(pos =>
    pos.positionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.positionName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEmployees = mockPositions.reduce((sum, p) => sum + p.employeeCount, 0);

  const formatCurrency = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`;
    } else if (value >= 10000000) {
      return `${(value / 10000000).toFixed(0)}천만`;
    } else if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}만`;
    }
    return value.toLocaleString();
  };

  const getLevelColor = (level: number) => {
    if (level <= 2) return 'bg-purple-500/20 text-purple-400';
    if (level <= 4) return 'bg-blue-500/20 text-blue-400';
    if (level <= 6) return 'bg-green-500/20 text-green-400';
    if (level <= 8) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-slate-500/20 text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">직급관리</h1>
          <p className="text-slate-400">직급 체계 및 급여 등급 관리</p>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-4 h-4" />
          직급 등록
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Award className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">총 직급</p>
              <p className="text-xl font-bold text-white">{mockPositions.length}개</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Award className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">총 직원</p>
              <p className="text-xl font-bold text-white">{totalEmployees}명</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <ArrowUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">최고 레벨</p>
              <p className="text-xl font-bold text-white">1 (대표이사)</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <ArrowDown className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">최저 레벨</p>
              <p className="text-xl font-bold text-white">9 (인턴)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="직급코드, 직급명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Position Hierarchy Visual */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <h3 className="text-white font-medium mb-4">직급 체계</h3>
        <div className="flex items-end justify-center gap-3 py-4">
          {mockPositions.slice().sort((a, b) => a.positionLevel - b.positionLevel).map((pos, index) => (
            <div
              key={pos.id}
              className={`flex flex-col items-center cursor-pointer transition-transform hover:scale-105 ${
                selectedPosition?.id === pos.id ? 'scale-105' : ''
              }`}
              onClick={() => setSelectedPosition(pos)}
            >
              <div
                className={`w-16 rounded-t-lg ${getLevelColor(pos.positionLevel)} border-2 ${
                  selectedPosition?.id === pos.id ? 'border-blue-500' : 'border-transparent'
                }`}
                style={{ height: `${(10 - pos.positionLevel) * 20 + 40}px` }}
              />
              <div className="text-center mt-2">
                <p className="text-white text-sm font-medium">{pos.positionName}</p>
                <p className="text-slate-400 text-xs">{pos.employeeCount}명</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Position List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">레벨</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">직급코드</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">직급명</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">인원수</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">급여 범위</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">상태</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredPositions.map((pos) => (
                <tr
                  key={pos.id}
                  className={`hover:bg-slate-700/30 cursor-pointer transition-colors ${
                    selectedPosition?.id === pos.id ? 'bg-blue-600/20' : ''
                  }`}
                  onClick={() => setSelectedPosition(pos)}
                >
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getLevelColor(pos.positionLevel)}`}>
                      {pos.positionLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-blue-400 font-mono text-sm">{pos.positionCode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">{pos.positionName}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-white">
                    {pos.employeeCount}명
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300 text-sm">
                    {formatCurrency(pos.baseSalaryMin)} ~ {formatCurrency(pos.baseSalaryMax)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                      pos.isActive
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {pos.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Edit2 className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">직급 등록</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-1">직급코드 *</label>
                <input
                  type="text"
                  placeholder="POS-XXX"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">직급명 *</label>
                <input
                  type="text"
                  placeholder="직급명 입력"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">직급 레벨 *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  placeholder="1 (높음) ~ 20 (낮음)"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">최소 급여</label>
                  <input
                    type="number"
                    placeholder="30000000"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">최대 급여</label>
                  <input
                    type="number"
                    placeholder="50000000"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                취소
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
