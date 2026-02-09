import { useState } from 'react';
import { Search, RefreshCw, Plus, ChevronDown, ChevronRight, Package, Layers, Settings } from 'lucide-react';

interface BOMItem {
  itemCode: string;
  itemName: string;
  itemType: 'RAW' | 'WIP' | 'FINISHED';
  spec: string;
  unit: string;
  quantity: number;
  scrapRate: number;
  leadTime: number;
  children?: BOMItem[];
  isExpanded?: boolean;
}

interface Product {
  productCode: string;
  productName: string;
  productType: string;
  spec: string;
  bomVersion: string;
  effectiveDate: string;
  status: 'ACTIVE' | 'DRAFT' | 'OBSOLETE';
  bomItems: BOMItem[];
}

// 샘플 BOM 데이터
const mockProducts: Product[] = [
  {
    productCode: 'FG-SMB-001',
    productName: '스마트폰 메인보드 A1',
    productType: '완제품',
    spec: '150×70mm, 8-Layer',
    bomVersion: '1.0',
    effectiveDate: '2024-01-01',
    status: 'ACTIVE',
    bomItems: [
      {
        itemCode: 'WIP-PCB-001',
        itemName: 'PCB 기판 (8층)',
        itemType: 'WIP',
        spec: '150×70mm, FR-4',
        unit: 'EA',
        quantity: 1,
        scrapRate: 2,
        leadTime: 3,
        children: [
          { itemCode: 'RM-PCB-001', itemName: 'PCB 기판 (4층)', itemType: 'RAW', spec: '100×80mm, FR-4', unit: 'EA', quantity: 1, scrapRate: 1, leadTime: 7 },
          { itemCode: 'RM-COP-001', itemName: '동박', itemType: 'RAW', spec: '35um', unit: 'M2', quantity: 0.5, scrapRate: 5, leadTime: 5 },
          { itemCode: 'RM-SOL-001', itemName: '솔더페이스트', itemType: 'RAW', spec: 'Sn63/Pb37', unit: 'G', quantity: 15, scrapRate: 10, leadTime: 3 },
        ]
      },
      {
        itemCode: 'RM-IC-001',
        itemName: 'MCU IC (ARM Cortex)',
        itemType: 'RAW',
        spec: 'STM32F4, LQFP64',
        unit: 'EA',
        quantity: 1,
        scrapRate: 0.5,
        leadTime: 14,
      },
      {
        itemCode: 'RM-CAP-001',
        itemName: '적층세라믹콘덴서',
        itemType: 'RAW',
        spec: '0603, 100nF',
        unit: 'EA',
        quantity: 45,
        scrapRate: 1,
        leadTime: 5,
      },
      {
        itemCode: 'RM-RES-001',
        itemName: '칩저항',
        itemType: 'RAW',
        spec: '0402, 10KΩ',
        unit: 'EA',
        quantity: 32,
        scrapRate: 1,
        leadTime: 5,
      },
      {
        itemCode: 'RM-CON-001',
        itemName: 'USB-C 커넥터',
        itemType: 'RAW',
        spec: 'Type-C, 24Pin',
        unit: 'EA',
        quantity: 1,
        scrapRate: 0.5,
        leadTime: 7,
      },
    ]
  },
  {
    productCode: 'FG-PWR-001',
    productName: '전원보드 P1',
    productType: '완제품',
    spec: '80×60mm, 4-Layer',
    bomVersion: '2.1',
    effectiveDate: '2024-03-15',
    status: 'ACTIVE',
    bomItems: [
      { itemCode: 'RM-PCB-001', itemName: 'PCB 기판 (4층)', itemType: 'RAW', spec: '100×80mm, FR-4', unit: 'EA', quantity: 1, scrapRate: 1, leadTime: 7 },
      { itemCode: 'RM-TR-001', itemName: '변압기', itemType: 'RAW', spec: 'EI-33', unit: 'EA', quantity: 1, scrapRate: 0.5, leadTime: 10 },
      { itemCode: 'RM-CAP-002', itemName: '전해콘덴서', itemType: 'RAW', spec: '470uF/25V', unit: 'EA', quantity: 4, scrapRate: 1, leadTime: 5 },
      { itemCode: 'RM-DIO-001', itemName: '정류다이오드', itemType: 'RAW', spec: '1N4007', unit: 'EA', quantity: 8, scrapRate: 1, leadTime: 5 },
    ]
  },
  {
    productCode: 'FG-LED-001',
    productName: 'LED 드라이버 L1',
    productType: '완제품',
    spec: '50×30mm, 2-Layer',
    bomVersion: '1.2',
    effectiveDate: '2024-02-01',
    status: 'DRAFT',
    bomItems: [
      { itemCode: 'RM-PCB-002', itemName: 'PCB 기판 (2층)', itemType: 'RAW', spec: '60×40mm, FR-4', unit: 'EA', quantity: 1, scrapRate: 1, leadTime: 5 },
      { itemCode: 'RM-IC-002', itemName: 'LED 드라이버 IC', itemType: 'RAW', spec: 'MP3302', unit: 'EA', quantity: 1, scrapRate: 0.5, leadTime: 10 },
      { itemCode: 'RM-LED-001', itemName: 'SMD LED', itemType: 'RAW', spec: '5050, White', unit: 'EA', quantity: 12, scrapRate: 2, leadTime: 7 },
    ]
  },
];

export default function BOMPage() {
  const [products] = useState<Product[]>(mockProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(mockProducts[0]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['WIP-PCB-001']));
  const [searchTerm, setSearchTerm] = useState('');

  const toggleExpand = (itemCode: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemCode)) {
      newExpanded.delete(itemCode);
    } else {
      newExpanded.add(itemCode);
    }
    setExpandedItems(newExpanded);
  };

  const getItemTypeStyle = (type: string) => {
    switch (type) {
      case 'RAW': return 'bg-blue-500/20 text-blue-400';
      case 'WIP': return 'bg-yellow-500/20 text-yellow-400';
      case 'FINISHED': return 'bg-green-500/20 text-green-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400';
      case 'DRAFT': return 'bg-yellow-500/20 text-yellow-400';
      case 'OBSOLETE': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const renderBOMTree = (items: BOMItem[], level: number = 0) => {
    return items.map((item) => (
      <div key={item.itemCode}>
        <div
          className={`flex items-center gap-2 py-2 px-3 hover:bg-slate-700/50 border-b border-slate-700/50 ${level > 0 ? 'bg-slate-800/30' : ''}`}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          {/* 확장/축소 버튼 */}
          <div className="w-5">
            {item.children && item.children.length > 0 ? (
              <button
                onClick={() => toggleExpand(item.itemCode)}
                className="text-slate-400 hover:text-white"
              >
                {expandedItems.has(item.itemCode) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <span className="text-slate-600">•</span>
            )}
          </div>

          {/* 레벨 표시 */}
          <span className="text-xs text-slate-500 w-6">{level}</span>

          {/* 품목코드 */}
          <span className="text-blue-400 font-mono text-sm w-28">{item.itemCode}</span>

          {/* 품목명 */}
          <span className="text-white flex-1">{item.itemName}</span>

          {/* 유형 */}
          <span className={`px-2 py-0.5 rounded text-xs ${getItemTypeStyle(item.itemType)}`}>
            {item.itemType === 'RAW' ? '원자재' : item.itemType === 'WIP' ? '재공품' : '완제품'}
          </span>

          {/* 규격 */}
          <span className="text-slate-400 text-sm w-32 truncate">{item.spec}</span>

          {/* 수량 */}
          <span className="text-white text-right w-16">{item.quantity}</span>

          {/* 단위 */}
          <span className="text-slate-400 w-10">{item.unit}</span>

          {/* 스크랩률 */}
          <span className="text-orange-400 text-right w-14">{item.scrapRate}%</span>

          {/* L/T */}
          <span className="text-cyan-400 text-right w-12">{item.leadTime}일</span>
        </div>

        {/* 하위 품목 */}
        {item.children && expandedItems.has(item.itemCode) && renderBOMTree(item.children, level + 1)}
      </div>
    ));
  };

  const filteredProducts = products.filter(p =>
    p.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">BOM관리</h1>
          <p className="text-slate-400 text-sm mt-1">제품별 자재명세서(Bill of Materials)를 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
            <Settings size={18} />
            BOM 전개
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
            <Plus size={18} />
            신규등록
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* 제품 목록 */}
        <div className="col-span-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-3">제품 목록</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="제품코드/제품명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto">
            {filteredProducts.map((product) => (
              <div
                key={product.productCode}
                onClick={() => setSelectedProduct(product)}
                className={`p-4 cursor-pointer hover:bg-slate-700/50 ${
                  selectedProduct?.productCode === product.productCode ? 'bg-blue-900/30 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-400 font-mono text-sm">{product.productCode}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusStyle(product.status)}`}>
                    {product.status === 'ACTIVE' ? '사용중' : product.status === 'DRAFT' ? '작성중' : '폐기'}
                  </span>
                </div>
                <h3 className="text-white font-medium">{product.productName}</h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
                  <span>{product.spec}</span>
                  <span>•</span>
                  <span>v{product.bomVersion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOM 상세 */}
        <div className="col-span-8 space-y-4">
          {selectedProduct ? (
            <>
              {/* 제품 정보 */}
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Package className="text-blue-400" size={24} />
                      <h2 className="text-xl font-semibold text-white">{selectedProduct.productName}</h2>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusStyle(selectedProduct.status)}`}>
                        {selectedProduct.status === 'ACTIVE' ? '사용중' : selectedProduct.status === 'DRAFT' ? '작성중' : '폐기'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>코드: <span className="text-blue-400">{selectedProduct.productCode}</span></span>
                      <span>규격: {selectedProduct.spec}</span>
                      <span>BOM버전: v{selectedProduct.bomVersion}</span>
                      <span>적용일: {selectedProduct.effectiveDate}</span>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white border border-slate-600 rounded-lg">
                    <RefreshCw size={16} />
                    새로고침
                  </button>
                </div>
              </div>

              {/* BOM Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                  <div className="flex items-center gap-3">
                    <Layers className="text-blue-400" size={20} />
                    <div>
                      <p className="text-slate-400 text-sm">총 BOM 레벨</p>
                      <p className="text-2xl font-bold text-white">3</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                  <div className="flex items-center gap-3">
                    <Package className="text-cyan-400" size={20} />
                    <div>
                      <p className="text-slate-400 text-sm">총 품목 수</p>
                      <p className="text-2xl font-bold text-cyan-400">{selectedProduct.bomItems.length}개</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-400 text-xs">R</span>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">원자재</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {selectedProduct.bomItems.filter(i => i.itemType === 'RAW').length +
                         selectedProduct.bomItems.reduce((acc, i) => acc + (i.children?.length || 0), 0)}개
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-yellow-500/20 flex items-center justify-center">
                      <span className="text-yellow-400 text-xs">W</span>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">재공품</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {selectedProduct.bomItems.filter(i => i.itemType === 'WIP').length}개
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOM Tree */}
              <div className="bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                  <h3 className="text-lg font-semibold text-white">BOM 구조</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedItems(new Set(selectedProduct.bomItems.filter(i => i.children).map(i => i.itemCode)))}
                      className="px-3 py-1 text-sm text-slate-400 hover:text-white border border-slate-600 rounded"
                    >
                      전체 펼치기
                    </button>
                    <button
                      onClick={() => setExpandedItems(new Set())}
                      className="px-3 py-1 text-sm text-slate-400 hover:text-white border border-slate-600 rounded"
                    >
                      전체 접기
                    </button>
                  </div>
                </div>

                {/* 헤더 */}
                <div className="flex items-center gap-2 py-2 px-3 bg-slate-700/50 text-sm text-slate-400 border-b border-slate-700">
                  <div className="w-5"></div>
                  <span className="w-6">Lv</span>
                  <span className="w-28">품목코드</span>
                  <span className="flex-1">품목명</span>
                  <span className="w-16">유형</span>
                  <span className="w-32">규격</span>
                  <span className="w-16 text-right">수량</span>
                  <span className="w-10">단위</span>
                  <span className="w-14 text-right">손실률</span>
                  <span className="w-12 text-right">L/T</span>
                </div>

                {/* BOM 트리 */}
                <div className="max-h-[400px] overflow-y-auto">
                  {renderBOMTree(selectedProduct.bomItems)}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 flex flex-col items-center justify-center text-slate-400">
              <Package size={48} className="mb-4" />
              <p>좌측에서 제품을 선택하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
