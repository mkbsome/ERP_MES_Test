import { useState } from 'react';
import { Package, Search, Filter, AlertTriangle, CheckCircle2, Clock, Barcode, MapPin } from 'lucide-react';

interface MaterialInfo {
  id: string;
  materialCode: string;
  materialName: string;
  lotNo: string;
  manufacturer: string;
  quantity: number;
  unit: string;
  location: string;
  status: 'available' | 'in_use' | 'expired' | 'hold';
  expiryDate: string;
  receivedDate: string;
  feederNo?: string;
  lineName?: string;
}

const mockMaterials: MaterialInfo[] = [
  { id: '1', materialCode: 'IC-CPU-001', materialName: 'AP 칩셋', lotNo: 'LOT-2024-A001', manufacturer: 'Qualcomm', quantity: 500, unit: 'EA', location: 'WH-A-01-01', status: 'in_use', expiryDate: '2025-06-30', receivedDate: '2024-01-10', feederNo: 'F01', lineName: 'SMT-L01' },
  { id: '2', materialCode: 'IC-MEM-001', materialName: 'DRAM', lotNo: 'LOT-2024-B002', manufacturer: 'Samsung', quantity: 1200, unit: 'EA', location: 'WH-A-01-02', status: 'available', expiryDate: '2025-08-15', receivedDate: '2024-01-12' },
  { id: '3', materialCode: 'MLCC-001', materialName: 'MLCC 0402', lotNo: 'LOT-2024-C003', manufacturer: 'Murata', quantity: 50000, unit: 'EA', location: 'WH-B-02-05', status: 'in_use', expiryDate: '2025-12-31', receivedDate: '2024-01-08', feederNo: 'F15', lineName: 'SMT-L01' },
  { id: '4', materialCode: 'RES-001', materialName: '칩저항 0402', lotNo: 'LOT-2024-D004', manufacturer: 'Yageo', quantity: 80000, unit: 'EA', location: 'WH-B-02-06', status: 'available', expiryDate: '2026-01-15', receivedDate: '2024-01-05' },
  { id: '5', materialCode: 'IC-PWR-001', materialName: 'PMIC', lotNo: 'LOT-2023-E005', manufacturer: 'TI', quantity: 100, unit: 'EA', location: 'WH-A-03-01', status: 'expired', expiryDate: '2024-01-01', receivedDate: '2023-06-10' },
  { id: '6', materialCode: 'PCB-001', materialName: 'PCB 기판', lotNo: 'LOT-2024-F006', manufacturer: 'Shinko', quantity: 200, unit: 'EA', location: 'WH-C-01-01', status: 'hold', expiryDate: '2025-03-20', receivedDate: '2024-01-14' },
  { id: '7', materialCode: 'SOLDER-001', materialName: '솔더페이스트', lotNo: 'LOT-2024-G007', manufacturer: 'Senju', quantity: 5, unit: 'KG', location: 'WH-D-01-01', status: 'in_use', expiryDate: '2024-04-30', receivedDate: '2024-01-13', feederNo: 'SPR-01', lineName: 'SMT-L01' },
];

export default function MaterialInfoPage() {
  const [materials] = useState<MaterialInfo[]>(mockMaterials);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialInfo | null>(null);

  const filteredMaterials = materials.filter(mat => {
    const matchesSearch = mat.materialName.includes(searchTerm) || mat.materialCode.includes(searchTerm) || mat.lotNo.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || mat.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: MaterialInfo['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_use': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'hold': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getStatusText = (status: MaterialInfo['status']) => {
    switch (status) {
      case 'available': return '가용';
      case 'in_use': return '사용중';
      case 'expired': return '만료';
      case 'hold': return '보류';
    }
  };

  const getStatusIcon = (status: MaterialInfo['status']) => {
    switch (status) {
      case 'available': return <CheckCircle2 className="w-4 h-4" />;
      case 'in_use': return <Clock className="w-4 h-4" />;
      case 'expired': return <AlertTriangle className="w-4 h-4" />;
      case 'hold': return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const stats = {
    total: materials.length,
    available: materials.filter(m => m.status === 'available').length,
    inUse: materials.filter(m => m.status === 'in_use').length,
    expired: materials.filter(m => m.status === 'expired').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">원자재정보</h1>
          <p className="text-slate-400 text-sm mt-1">생산 투입 원자재 현황 및 LOT 정보 조회</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">전체 자재</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">가용</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.available}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">사용중</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.inUse}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">만료</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.expired}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="자재명, 코드, LOT번호로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
          />
        </div>
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">전체 상태</option>
          <option value="available">가용</option>
          <option value="in_use">사용중</option>
          <option value="expired">만료</option>
          <option value="hold">보류</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-slate-800 rounded-xl border border-slate-700">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">자재코드</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">자재명</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">LOT번호</th>
                <th className="text-right text-slate-400 font-medium px-4 py-3 text-sm">수량</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">위치</th>
                <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredMaterials.map((mat) => (
                <tr
                  key={mat.id}
                  onClick={() => setSelectedMaterial(mat)}
                  className={`hover:bg-slate-700/30 cursor-pointer ${selectedMaterial?.id === mat.id ? 'bg-slate-700/50' : ''}`}
                >
                  <td className="px-4 py-3 text-white font-mono text-sm">{mat.materialCode}</td>
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">{mat.materialName}</p>
                    <p className="text-slate-500 text-xs">{mat.manufacturer}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-sm">{mat.lotNo}</td>
                  <td className="px-4 py-3 text-right text-white text-sm">{mat.quantity.toLocaleString()} {mat.unit}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{mat.location}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getStatusColor(mat.status)}`}>
                      {getStatusIcon(mat.status)}
                      {getStatusText(mat.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-span-1">
          {selectedMaterial ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">자재 상세</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getStatusColor(selectedMaterial.status)}`}>
                  {getStatusIcon(selectedMaterial.status)}
                  {getStatusText(selectedMaterial.status)}
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <Barcode className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-slate-400 text-xs">자재코드</p>
                    <p className="text-white font-mono">{selectedMaterial.materialCode}</p>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">자재명</p>
                  <p className="text-white">{selectedMaterial.materialName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">LOT번호</p>
                  <p className="text-white font-mono">{selectedMaterial.lotNo}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">제조사</p>
                  <p className="text-white">{selectedMaterial.manufacturer}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-slate-400 text-xs">수량</p>
                    <p className="text-white">{selectedMaterial.quantity.toLocaleString()} {selectedMaterial.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-400 text-xs">위치</p>
                      <p className="text-white">{selectedMaterial.location}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-slate-400 text-xs">입고일</p>
                    <p className="text-white">{selectedMaterial.receivedDate}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">유효기간</p>
                    <p className={selectedMaterial.status === 'expired' ? 'text-red-400' : 'text-white'}>{selectedMaterial.expiryDate}</p>
                  </div>
                </div>
                {selectedMaterial.status === 'in_use' && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-400 text-xs mb-2">투입 정보</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-slate-400 text-xs">라인</p>
                        <p className="text-white">{selectedMaterial.lineName}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">피더</p>
                        <p className="text-white">{selectedMaterial.feederNo}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">자재를 선택하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
