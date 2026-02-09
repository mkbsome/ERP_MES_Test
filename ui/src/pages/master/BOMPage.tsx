import { useState } from 'react';
import { Layers, Search, Plus, Edit2, ChevronRight, ChevronDown, Package, Box } from 'lucide-react';

interface BOMItem {
  id: string;
  level: number;
  itemCode: string;
  itemName: string;
  spec: string;
  unit: string;
  qty: number;
  children?: BOMItem[];
}

interface BOM {
  id: string;
  productCode: string;
  productName: string;
  version: string;
  effectiveDate: string;
  status: 'active' | 'draft' | 'obsolete';
  items: BOMItem[];
}

const mockBOMs: BOM[] = [
  {
    id: '1', productCode: 'FG-MB-001', productName: '스마트폰 메인보드 A', version: '1.0', effectiveDate: '2024-01-01', status: 'active',
    items: [
      {
        id: '1-1', level: 1, itemCode: 'PCB-001', itemName: 'PCB 기판', spec: 'FR-4, 6Layer', unit: 'EA', qty: 1,
        children: [
          { id: '1-1-1', level: 2, itemCode: 'MAT-001', itemName: '동박적층판', spec: 'FR-4 1.6mm', unit: 'EA', qty: 1 },
          { id: '1-1-2', level: 2, itemCode: 'MAT-002', itemName: '솔더마스크', spec: 'Green', unit: 'L', qty: 0.05 },
        ]
      },
      {
        id: '1-2', level: 1, itemCode: 'IC-CPU-001', itemName: 'AP 칩셋', spec: 'Snapdragon 8 Gen3', unit: 'EA', qty: 1,
      },
      {
        id: '1-3', level: 1, itemCode: 'IC-MEM-001', itemName: 'DRAM', spec: 'LPDDR5 8GB', unit: 'EA', qty: 2,
      },
      {
        id: '1-4', level: 1, itemCode: 'IC-PWR-001', itemName: 'PMIC', spec: 'Power Management IC', unit: 'EA', qty: 1,
      },
      {
        id: '1-5', level: 1, itemCode: 'MLCC-001', itemName: 'MLCC', spec: '0402 0.1uF', unit: 'EA', qty: 150,
      },
      {
        id: '1-6', level: 1, itemCode: 'RES-001', itemName: '칩저항', spec: '0402 10K', unit: 'EA', qty: 80,
      },
    ]
  },
  {
    id: '2', productCode: 'FG-PB-001', productName: '전원보드 A', version: '2.1', effectiveDate: '2024-01-15', status: 'active',
    items: [
      { id: '2-1', level: 1, itemCode: 'PCB-002', itemName: 'PCB 기판', spec: 'FR-4, 4Layer', unit: 'EA', qty: 1 },
      { id: '2-2', level: 1, itemCode: 'TR-001', itemName: '트랜스포머', spec: '5V 2A', unit: 'EA', qty: 1 },
      { id: '2-3', level: 1, itemCode: 'CAP-001', itemName: '전해 콘덴서', spec: '100uF 25V', unit: 'EA', qty: 4 },
      { id: '2-4', level: 1, itemCode: 'DIODE-001', itemName: '정류 다이오드', spec: '1N4007', unit: 'EA', qty: 4 },
    ]
  },
];

export default function BOMPage() {
  const [boms] = useState<BOM[]>(mockBOMs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(mockBOMs[0]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['1-1']));

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) newExpanded.delete(itemId);
    else newExpanded.add(itemId);
    setExpandedItems(newExpanded);
  };

  const getStatusColor = (status: BOM['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400';
      case 'obsolete': return 'bg-red-500/20 text-red-400';
    }
  };

  const getStatusText = (status: BOM['status']) => {
    switch (status) {
      case 'active': return '활성';
      case 'draft': return '초안';
      case 'obsolete': return '폐기';
    }
  };

  const renderBOMItem = (item: BOMItem, depth: number = 0) => (
    <div key={item.id}>
      <div
        className={`flex items-center gap-2 py-2 px-3 hover:bg-slate-700/30 ${depth > 0 ? 'border-l border-slate-700' : ''}`}
        style={{ marginLeft: depth * 24 }}
      >
        {item.children && item.children.length > 0 ? (
          <button onClick={() => toggleItem(item.id)} className="p-0.5">
            {expandedItems.has(item.id) ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}
        <Box className={`w-4 h-4 ${depth === 0 ? 'text-blue-400' : 'text-slate-500'}`} />
        <span className="text-slate-400 font-mono text-sm w-24">{item.itemCode}</span>
        <span className="text-white text-sm flex-1">{item.itemName}</span>
        <span className="text-slate-500 text-sm w-32">{item.spec}</span>
        <span className="text-white text-sm w-16 text-right">{item.qty}</span>
        <span className="text-slate-500 text-sm w-12">{item.unit}</span>
      </div>
      {item.children && expandedItems.has(item.id) && item.children.map(child => renderBOMItem(child, depth + 1))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">BOM관리</h1>
          <p className="text-slate-400 text-sm mt-1">제품 구성 자재명세서(Bill of Materials) 관리</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          BOM 등록
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* BOM 목록 */}
        <div className="col-span-1 bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="제품 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            {boms.map((bom) => (
              <div
                key={bom.id}
                onClick={() => setSelectedBOM(bom)}
                className={`p-3 rounded-lg cursor-pointer border ${
                  selectedBOM?.id === bom.id ? 'bg-slate-700 border-blue-500' : 'bg-slate-700/30 border-transparent hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium text-sm">{bom.productName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">{bom.productCode}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(bom.status)}`}>
                    {getStatusText(bom.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOM 상세 */}
        <div className="col-span-3">
          {selectedBOM ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700">
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Layers className="w-6 h-6 text-blue-400" />
                    <div>
                      <h3 className="text-lg font-bold text-white">{selectedBOM.productName}</h3>
                      <p className="text-slate-400 text-sm">{selectedBOM.productCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-slate-400 text-xs">버전</p>
                      <p className="text-white">v{selectedBOM.version}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs">적용일</p>
                      <p className="text-white">{selectedBOM.effectiveDate}</p>
                    </div>
                    <span className={`px-3 py-1 rounded ${getStatusColor(selectedBOM.status)}`}>
                      {getStatusText(selectedBOM.status)}
                    </span>
                    <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 헤더 */}
                <div className="flex items-center gap-2 py-2 px-3 bg-slate-700/50 rounded text-sm">
                  <div className="w-5" />
                  <div className="w-4" />
                  <span className="text-slate-400 w-24">품목코드</span>
                  <span className="text-slate-400 flex-1">품목명</span>
                  <span className="text-slate-400 w-32">규격</span>
                  <span className="text-slate-400 w-16 text-right">수량</span>
                  <span className="text-slate-400 w-12">단위</span>
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto">
                {selectedBOM.items.map(item => renderBOMItem(item))}
              </div>

              <div className="p-4 border-t border-slate-700 bg-slate-700/30">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">총 구성품목</span>
                  <span className="text-white font-medium">{selectedBOM.items.length}개 (하위포함: {selectedBOM.items.reduce((acc, item) => acc + 1 + (item.children?.length || 0), 0)}개)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <Layers className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">BOM을 선택하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
