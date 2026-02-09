import { useState } from 'react';
import { Building2, Search, Plus, Filter, Edit2, Trash2, Calculator, TrendingDown, Calendar, MapPin } from 'lucide-react';

interface FixedAsset {
  id: string;
  assetCode: string;
  assetName: string;
  category: 'building' | 'machinery' | 'vehicle' | 'equipment' | 'furniture' | 'intangible';
  location: string;
  department: string;
  acquisitionDate: string;
  acquisitionCost: number;
  usefulLife: number; // 내용연수 (년)
  depreciationMethod: 'straight-line' | 'declining-balance' | 'units-of-production';
  salvageValue: number; // 잔존가치
  accumulatedDepreciation: number;
  bookValue: number; // 장부가액
  status: 'active' | 'disposed' | 'idle' | 'under-repair';
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  warrantyExpiry?: string;
  lastMaintenanceDate?: string;
  notes?: string;
}

const categoryLabels: Record<string, string> = {
  'building': '건물',
  'machinery': '기계장치',
  'vehicle': '차량운반구',
  'equipment': '설비',
  'furniture': '비품',
  'intangible': '무형자산',
};

const statusLabels: Record<string, string> = {
  'active': '사용중',
  'disposed': '처분',
  'idle': '유휴',
  'under-repair': '수리중',
};

const depreciationLabels: Record<string, string> = {
  'straight-line': '정액법',
  'declining-balance': '정률법',
  'units-of-production': '생산량비례법',
};

const mockAssets: FixedAsset[] = [
  {
    id: '1',
    assetCode: 'FA-BLD-001',
    assetName: '본사 사옥',
    category: 'building',
    location: '서울시 강남구',
    department: '총무팀',
    acquisitionDate: '2020-01-15',
    acquisitionCost: 5000000000,
    usefulLife: 40,
    depreciationMethod: 'straight-line',
    salvageValue: 500000000,
    accumulatedDepreciation: 450000000,
    bookValue: 4550000000,
    status: 'active',
  },
  {
    id: '2',
    assetCode: 'FA-MCH-001',
    assetName: 'SMT 라인 설비 #1',
    category: 'machinery',
    location: '1공장 A동',
    department: '생산1팀',
    acquisitionDate: '2022-03-20',
    acquisitionCost: 850000000,
    usefulLife: 10,
    depreciationMethod: 'straight-line',
    salvageValue: 85000000,
    accumulatedDepreciation: 153000000,
    bookValue: 697000000,
    status: 'active',
    serialNumber: 'SMT-2022-A001',
    manufacturer: '한화정밀기계',
    model: 'SM481 Plus',
    warrantyExpiry: '2025-03-19',
    lastMaintenanceDate: '2024-01-10',
  },
  {
    id: '3',
    assetCode: 'FA-MCH-002',
    assetName: 'SMT 라인 설비 #2',
    category: 'machinery',
    location: '1공장 A동',
    department: '생산1팀',
    acquisitionDate: '2022-06-15',
    acquisitionCost: 920000000,
    usefulLife: 10,
    depreciationMethod: 'straight-line',
    salvageValue: 92000000,
    accumulatedDepreciation: 124200000,
    bookValue: 795800000,
    status: 'active',
    serialNumber: 'SMT-2022-A002',
    manufacturer: '한화정밀기계',
    model: 'SM482',
  },
  {
    id: '4',
    assetCode: 'FA-MCH-003',
    assetName: 'AOI 검사기',
    category: 'machinery',
    location: '1공장 B동',
    department: '품질팀',
    acquisitionDate: '2023-01-10',
    acquisitionCost: 450000000,
    usefulLife: 8,
    depreciationMethod: 'straight-line',
    salvageValue: 45000000,
    accumulatedDepreciation: 50625000,
    bookValue: 399375000,
    status: 'active',
    serialNumber: 'AOI-2023-001',
    manufacturer: 'Koh Young',
    model: 'Zenith',
  },
  {
    id: '5',
    assetCode: 'FA-VHC-001',
    assetName: '배송 트럭 1호',
    category: 'vehicle',
    location: '물류센터',
    department: '물류팀',
    acquisitionDate: '2021-07-01',
    acquisitionCost: 85000000,
    usefulLife: 5,
    depreciationMethod: 'declining-balance',
    salvageValue: 8500000,
    accumulatedDepreciation: 52700000,
    bookValue: 32300000,
    status: 'active',
    serialNumber: '12가3456',
    manufacturer: '현대자동차',
    model: '포터2',
  },
  {
    id: '6',
    assetCode: 'FA-EQP-001',
    assetName: '서버 랙 시스템',
    category: 'equipment',
    location: '본사 전산실',
    department: 'IT팀',
    acquisitionDate: '2023-06-01',
    acquisitionCost: 120000000,
    usefulLife: 5,
    depreciationMethod: 'straight-line',
    salvageValue: 12000000,
    accumulatedDepreciation: 14400000,
    bookValue: 105600000,
    status: 'active',
    manufacturer: 'Dell',
    model: 'PowerEdge R750',
  },
  {
    id: '7',
    assetCode: 'FA-MCH-004',
    assetName: '리플로우 오븐 (구형)',
    category: 'machinery',
    location: '2공장',
    department: '생산2팀',
    acquisitionDate: '2018-03-01',
    acquisitionCost: 380000000,
    usefulLife: 10,
    depreciationMethod: 'straight-line',
    salvageValue: 38000000,
    accumulatedDepreciation: 205200000,
    bookValue: 174800000,
    status: 'idle',
    notes: '신규 설비 도입으로 유휴 상태',
  },
  {
    id: '8',
    assetCode: 'FA-INT-001',
    assetName: 'ERP 시스템 라이선스',
    category: 'intangible',
    location: '-',
    department: 'IT팀',
    acquisitionDate: '2022-01-01',
    acquisitionCost: 200000000,
    usefulLife: 5,
    depreciationMethod: 'straight-line',
    salvageValue: 0,
    accumulatedDepreciation: 80000000,
    bookValue: 120000000,
    status: 'active',
  },
];

// 카테고리별 통계
const getCategoryStats = () => {
  const stats: Record<string, { count: number; totalCost: number; bookValue: number }> = {};
  mockAssets.forEach(asset => {
    if (!stats[asset.category]) {
      stats[asset.category] = { count: 0, totalCost: 0, bookValue: 0 };
    }
    stats[asset.category].count++;
    stats[asset.category].totalCost += asset.acquisitionCost;
    stats[asset.category].bookValue += asset.bookValue;
  });
  return stats;
};

export default function FixedAssetPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);

  const categoryStats = getCategoryStats();

  const filteredAssets = mockAssets.filter(asset => {
    const matchesSearch =
      asset.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || asset.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalAcquisitionCost = mockAssets.reduce((sum, a) => sum + a.acquisitionCost, 0);
  const totalBookValue = mockAssets.reduce((sum, a) => sum + a.bookValue, 0);
  const totalDepreciation = mockAssets.reduce((sum, a) => sum + a.accumulatedDepreciation, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'disposed': return 'bg-red-500/20 text-red-400';
      case 'idle': return 'bg-yellow-500/20 text-yellow-400';
      case 'under-repair': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'building': return 'bg-blue-500/20 text-blue-400';
      case 'machinery': return 'bg-purple-500/20 text-purple-400';
      case 'vehicle': return 'bg-cyan-500/20 text-cyan-400';
      case 'equipment': return 'bg-indigo-500/20 text-indigo-400';
      case 'furniture': return 'bg-amber-500/20 text-amber-400';
      case 'intangible': return 'bg-pink-500/20 text-pink-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`;
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
          <h1 className="text-2xl font-bold text-white">고정자산관리</h1>
          <p className="text-slate-400">회사 보유 고정자산 등록 및 감가상각 관리</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          자산 등록
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">총 자산</p>
              <p className="text-xl font-bold text-white">{mockAssets.length}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Calculator className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">취득원가 합계</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalAcquisitionCost)}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingDown className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">감가상각누계액</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalDepreciation)}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Building2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">장부가액 합계</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalBookValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Stats */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <h3 className="text-white font-medium mb-4">자산 유형별 현황</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {Object.entries(categoryStats).map(([category, stats]) => (
            <div
              key={category}
              className="bg-slate-700/50 rounded-lg p-3 cursor-pointer hover:bg-slate-700 transition-colors"
              onClick={() => setSelectedCategory(category)}
            >
              <span className={`inline-block px-2 py-0.5 rounded text-xs ${getCategoryColor(category)}`}>
                {categoryLabels[category]}
              </span>
              <div className="mt-2">
                <p className="text-white font-medium">{stats.count}건</p>
                <p className="text-slate-400 text-xs">장부가 {formatCurrency(stats.bookValue)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="자산코드, 자산명, 위치 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">전체 유형</option>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">전체 상태</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors">
          <Filter className="w-4 h-4" />
          필터
        </button>
      </div>

      {/* Asset List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">자산코드</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">자산명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">유형</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">위치</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">취득원가</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">감가상각누계</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">장부가액</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">상태</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredAssets.map((asset) => (
                <tr
                  key={asset.id}
                  className="hover:bg-slate-700/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <td className="px-4 py-3">
                    <span className="text-blue-400 font-mono text-sm">{asset.assetCode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium">{asset.assetName}</p>
                      {asset.manufacturer && (
                        <p className="text-slate-400 text-xs">{asset.manufacturer} {asset.model}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${getCategoryColor(asset.category)}`}>
                      {categoryLabels[asset.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-slate-300 text-sm">
                      <MapPin className="w-3 h-3" />
                      {asset.location}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-white">
                    {asset.acquisitionCost.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-red-400">
                    {asset.accumulatedDepreciation.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-green-400 font-medium">
                    {asset.bookValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStatusColor(asset.status)}`}>
                      {statusLabels[asset.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        <Edit2 className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                        onClick={(e) => { e.stopPropagation(); }}
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

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedAsset.assetName}</h2>
                  <p className="text-slate-400">{selectedAsset.assetCode}</p>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-white font-medium mb-3">기본 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">자산 유형</p>
                    <p className="text-white">{categoryLabels[selectedAsset.category]}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">상태</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStatusColor(selectedAsset.status)}`}>
                      {statusLabels[selectedAsset.status]}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">위치</p>
                    <p className="text-white">{selectedAsset.location}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">관리부서</p>
                    <p className="text-white">{selectedAsset.department}</p>
                  </div>
                  {selectedAsset.serialNumber && (
                    <div>
                      <p className="text-slate-400 text-sm">시리얼번호</p>
                      <p className="text-white font-mono">{selectedAsset.serialNumber}</p>
                    </div>
                  )}
                  {selectedAsset.manufacturer && (
                    <div>
                      <p className="text-slate-400 text-sm">제조사/모델</p>
                      <p className="text-white">{selectedAsset.manufacturer} {selectedAsset.model}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 감가상각 정보 */}
              <div>
                <h3 className="text-white font-medium mb-3">감가상각 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">취득일</p>
                    <p className="text-white">{selectedAsset.acquisitionDate}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">내용연수</p>
                    <p className="text-white">{selectedAsset.usefulLife}년</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">상각방법</p>
                    <p className="text-white">{depreciationLabels[selectedAsset.depreciationMethod]}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">잔존가치</p>
                    <p className="text-white">{selectedAsset.salvageValue.toLocaleString()}원</p>
                  </div>
                </div>
              </div>

              {/* 금액 정보 */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-slate-400 text-sm">취득원가</p>
                    <p className="text-xl font-bold text-white">{selectedAsset.acquisitionCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">감가상각누계액</p>
                    <p className="text-xl font-bold text-red-400">-{selectedAsset.accumulatedDepreciation.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">장부가액</p>
                    <p className="text-xl font-bold text-green-400">{selectedAsset.bookValue.toLocaleString()}</p>
                  </div>
                </div>
                {/* 상각률 바 */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>상각 진행률</span>
                    <span>{((selectedAsset.accumulatedDepreciation / (selectedAsset.acquisitionCost - selectedAsset.salvageValue)) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(selectedAsset.accumulatedDepreciation / (selectedAsset.acquisitionCost - selectedAsset.salvageValue)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 유지보수 정보 */}
              {(selectedAsset.warrantyExpiry || selectedAsset.lastMaintenanceDate) && (
                <div>
                  <h3 className="text-white font-medium mb-3">유지보수 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedAsset.warrantyExpiry && (
                      <div>
                        <p className="text-slate-400 text-sm">보증기한</p>
                        <p className="text-white">{selectedAsset.warrantyExpiry}</p>
                      </div>
                    )}
                    {selectedAsset.lastMaintenanceDate && (
                      <div>
                        <p className="text-slate-400 text-sm">최근 유지보수일</p>
                        <p className="text-white">{selectedAsset.lastMaintenanceDate}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 비고 */}
              {selectedAsset.notes && (
                <div>
                  <h3 className="text-white font-medium mb-3">비고</h3>
                  <p className="text-slate-300 bg-slate-700/50 rounded-lg p-3">{selectedAsset.notes}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                닫기
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                수정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
