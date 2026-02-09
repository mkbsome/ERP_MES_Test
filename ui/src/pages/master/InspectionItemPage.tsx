import { useState } from 'react';
import { ClipboardCheck, Search, Plus, Edit2, Trash2, Filter, CheckCircle2, AlertTriangle } from 'lucide-react';

interface InspectionItem {
  id: string;
  itemCode: string;
  itemName: string;
  inspectionType: 'incoming' | 'process' | 'final';
  category: string;
  measureType: 'measurement' | 'visual' | 'functional';
  unit?: string;
  lsl?: number;
  usl?: number;
  target?: number;
  method: string;
  frequency: string;
  useYn: boolean;
}

const mockItems: InspectionItem[] = [
  { id: '1', itemCode: 'INS-001', itemName: '솔더 브릿지 검사', inspectionType: 'process', category: 'SMT', measureType: 'visual', method: 'AOI 자동검사', frequency: '전수', useYn: true },
  { id: '2', itemCode: 'INS-002', itemName: '부품 실장 위치', inspectionType: 'process', category: 'SMT', measureType: 'measurement', unit: 'mm', lsl: -0.1, usl: 0.1, target: 0, method: 'AOI 측정', frequency: '전수', useYn: true },
  { id: '3', itemCode: 'INS-003', itemName: '솔더 높이', inspectionType: 'process', category: 'SMT', measureType: 'measurement', unit: 'mm', lsl: 0.3, usl: 0.8, target: 0.5, method: '3D SPI', frequency: '전수', useYn: true },
  { id: '4', itemCode: 'INS-004', itemName: '기능 테스트', inspectionType: 'final', category: '완제품', measureType: 'functional', method: 'ICT/FCT', frequency: '전수', useYn: true },
  { id: '5', itemCode: 'INS-005', itemName: '외관 검사', inspectionType: 'final', category: '완제품', measureType: 'visual', method: '육안검사', frequency: '전수', useYn: true },
  { id: '6', itemCode: 'INS-006', itemName: '자재 입고 검사', inspectionType: 'incoming', category: '자재', measureType: 'visual', method: 'Sampling 검사', frequency: 'AQL 0.65', useYn: true },
  { id: '7', itemCode: 'INS-007', itemName: 'PCB 치수 측정', inspectionType: 'incoming', category: 'PCB', measureType: 'measurement', unit: 'mm', lsl: -0.2, usl: 0.2, target: 0, method: '3차원 측정기', frequency: '1EA/LOT', useYn: true },
  { id: '8', itemCode: 'INS-008', itemName: '리플로우 온도', inspectionType: 'process', category: 'SMT', measureType: 'measurement', unit: '°C', lsl: 235, usl: 250, target: 245, method: '프로파일러', frequency: '1회/교대', useYn: true },
];

export default function InspectionItemPage() {
  const [items] = useState<InspectionItem[]>(mockItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<InspectionItem | null>(null);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.itemName.includes(searchTerm) || item.itemCode.includes(searchTerm);
    const matchesType = filterType === 'all' || item.inspectionType === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: InspectionItem['inspectionType']) => {
    switch (type) {
      case 'incoming': return 'bg-blue-500/20 text-blue-400';
      case 'process': return 'bg-purple-500/20 text-purple-400';
      case 'final': return 'bg-green-500/20 text-green-400';
    }
  };

  const getTypeText = (type: InspectionItem['inspectionType']) => {
    switch (type) {
      case 'incoming': return '수입검사';
      case 'process': return '공정검사';
      case 'final': return '출하검사';
    }
  };

  const getMeasureColor = (type: InspectionItem['measureType']) => {
    switch (type) {
      case 'measurement': return 'bg-cyan-500/20 text-cyan-400';
      case 'visual': return 'bg-yellow-500/20 text-yellow-400';
      case 'functional': return 'bg-orange-500/20 text-orange-400';
    }
  };

  const getMeasureText = (type: InspectionItem['measureType']) => {
    switch (type) {
      case 'measurement': return '계측';
      case 'visual': return '외관';
      case 'functional': return '기능';
    }
  };

  const stats = {
    total: items.length,
    incoming: items.filter(i => i.inspectionType === 'incoming').length,
    process: items.filter(i => i.inspectionType === 'process').length,
    final: items.filter(i => i.inspectionType === 'final').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">검사항목관리</h1>
          <p className="text-slate-400 text-sm mt-1">품질검사 기준 및 검사항목 정의</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          검사항목 등록
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">전체</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">수입검사</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.incoming}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">공정검사</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats.process}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">출하검사</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.final}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="검사항목명, 코드로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
          />
        </div>
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">전체</option>
          <option value="incoming">수입검사</option>
          <option value="process">공정검사</option>
          <option value="final">출하검사</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-slate-800 rounded-xl border border-slate-700">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">코드</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">검사항목</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">검사유형</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">측정방식</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">검사주기</th>
                <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`hover:bg-slate-700/30 cursor-pointer ${selectedItem?.id === item.id ? 'bg-slate-700/50' : ''}`}
                >
                  <td className="px-4 py-3 text-white font-mono text-sm">{item.itemCode}</td>
                  <td className="px-4 py-3 text-white">{item.itemName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${getTypeColor(item.inspectionType)}`}>
                      {getTypeText(item.inspectionType)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${getMeasureColor(item.measureType)}`}>
                      {getMeasureText(item.measureType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{item.frequency}</td>
                  <td className="px-4 py-3 text-center">
                    {item.useYn ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" /> : <AlertTriangle className="w-4 h-4 text-red-400 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-span-1">
          {selectedItem ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">검사항목 상세</h3>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded"><Edit2 className="w-4 h-4" /></button>
                  <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-xs">항목코드</p>
                  <p className="text-white font-mono">{selectedItem.itemCode}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">항목명</p>
                  <p className="text-white">{selectedItem.itemName}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-slate-400 text-xs">검사유형</p>
                    <span className={`px-2 py-1 rounded text-xs ${getTypeColor(selectedItem.inspectionType)}`}>
                      {getTypeText(selectedItem.inspectionType)}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">측정방식</p>
                    <span className={`px-2 py-1 rounded text-xs ${getMeasureColor(selectedItem.measureType)}`}>
                      {getMeasureText(selectedItem.measureType)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">카테고리</p>
                  <p className="text-white">{selectedItem.category}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">검사방법</p>
                  <p className="text-white">{selectedItem.method}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">검사주기</p>
                  <p className="text-white">{selectedItem.frequency}</p>
                </div>
                {selectedItem.measureType === 'measurement' && (
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-slate-400 text-xs mb-2">규격 ({selectedItem.unit})</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-red-400 text-xs">LSL</p>
                        <p className="text-white">{selectedItem.lsl}</p>
                      </div>
                      <div>
                        <p className="text-green-400 text-xs">Target</p>
                        <p className="text-white">{selectedItem.target}</p>
                      </div>
                      <div>
                        <p className="text-red-400 text-xs">USL</p>
                        <p className="text-white">{selectedItem.usl}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <ClipboardCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">검사항목을 선택하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
