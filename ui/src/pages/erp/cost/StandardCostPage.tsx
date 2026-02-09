import { useState } from 'react';
import {
  Calculator,
  Search,
  RefreshCw,
  Upload,
  Download,
  ChevronDown,
  ChevronRight,
  Package,
  Layers,
  Settings,
  DollarSign,
} from 'lucide-react';

interface CostElement {
  elementCode: string;
  elementName: string;
  amount: number;
  percentage: number;
}

interface StandardCost {
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  version: string;
  effectiveDate: string;
  totalCost: number;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  costElements: CostElement[];
}

const mockStandardCosts: StandardCost[] = [
  {
    productCode: 'FG-SMB-001',
    productName: '스마트폰 메인보드 A1',
    category: '완제품',
    unit: 'EA',
    version: '2024-01',
    effectiveDate: '2024-01-01',
    totalCost: 45000,
    materialCost: 32000,
    laborCost: 8000,
    overheadCost: 5000,
    costElements: [
      { elementCode: 'MAT-PCB', elementName: 'PCB 기판', amount: 12000, percentage: 26.7 },
      { elementCode: 'MAT-IC', elementName: 'IC/반도체', amount: 15000, percentage: 33.3 },
      { elementCode: 'MAT-OTHER', elementName: '기타 부품', amount: 5000, percentage: 11.1 },
      { elementCode: 'LAB-DIRECT', elementName: '직접노무비', amount: 6000, percentage: 13.3 },
      { elementCode: 'LAB-INDIRECT', elementName: '간접노무비', amount: 2000, percentage: 4.4 },
      { elementCode: 'OH-MFG', elementName: '제조간접비', amount: 5000, percentage: 11.1 },
    ],
  },
  {
    productCode: 'FG-PWR-001',
    productName: '전원보드 P1',
    category: '완제품',
    unit: 'EA',
    version: '2024-01',
    effectiveDate: '2024-01-01',
    totalCost: 28000,
    materialCost: 18500,
    laborCost: 6000,
    overheadCost: 3500,
    costElements: [
      { elementCode: 'MAT-PCB', elementName: 'PCB 기판', amount: 5000, percentage: 17.9 },
      { elementCode: 'MAT-TRANS', elementName: '트랜스포머', amount: 8000, percentage: 28.6 },
      { elementCode: 'MAT-OTHER', elementName: '기타 부품', amount: 5500, percentage: 19.6 },
      { elementCode: 'LAB-DIRECT', elementName: '직접노무비', amount: 4500, percentage: 16.1 },
      { elementCode: 'LAB-INDIRECT', elementName: '간접노무비', amount: 1500, percentage: 5.4 },
      { elementCode: 'OH-MFG', elementName: '제조간접비', amount: 3500, percentage: 12.5 },
    ],
  },
  {
    productCode: 'FG-LED-001',
    productName: 'LED 드라이버 L1',
    category: '완제품',
    unit: 'EA',
    version: '2024-01',
    effectiveDate: '2024-01-01',
    totalCost: 15000,
    materialCost: 9500,
    laborCost: 3500,
    overheadCost: 2000,
    costElements: [
      { elementCode: 'MAT-PCB', elementName: 'PCB 기판', amount: 2500, percentage: 16.7 },
      { elementCode: 'MAT-LED', elementName: 'LED 칩', amount: 4500, percentage: 30.0 },
      { elementCode: 'MAT-OTHER', elementName: '기타 부품', amount: 2500, percentage: 16.7 },
      { elementCode: 'LAB-DIRECT', elementName: '직접노무비', amount: 2500, percentage: 16.7 },
      { elementCode: 'LAB-INDIRECT', elementName: '간접노무비', amount: 1000, percentage: 6.7 },
      { elementCode: 'OH-MFG', elementName: '제조간접비', amount: 2000, percentage: 13.3 },
    ],
  },
  {
    productCode: 'FG-ECU-001',
    productName: '차량 ECU A',
    category: '완제품',
    unit: 'EA',
    version: '2024-01',
    effectiveDate: '2024-01-01',
    totalCost: 85000,
    materialCost: 62000,
    laborCost: 15000,
    overheadCost: 8000,
    costElements: [
      { elementCode: 'MAT-PCB', elementName: 'PCB 기판 (6층)', amount: 18000, percentage: 21.2 },
      { elementCode: 'MAT-IC', elementName: '차량용 MCU', amount: 32000, percentage: 37.6 },
      { elementCode: 'MAT-OTHER', elementName: '기타 부품', amount: 12000, percentage: 14.1 },
      { elementCode: 'LAB-DIRECT', elementName: '직접노무비', amount: 11000, percentage: 12.9 },
      { elementCode: 'LAB-INDIRECT', elementName: '간접노무비', amount: 4000, percentage: 4.7 },
      { elementCode: 'OH-MFG', elementName: '제조간접비', amount: 8000, percentage: 9.4 },
    ],
  },
  {
    productCode: 'FG-IOT-001',
    productName: 'IoT 모듈 M1',
    category: '완제품',
    unit: 'EA',
    version: '2024-01',
    effectiveDate: '2024-01-01',
    totalCost: 22000,
    materialCost: 14500,
    laborCost: 5000,
    overheadCost: 2500,
    costElements: [
      { elementCode: 'MAT-PCB', elementName: 'PCB 기판', amount: 4000, percentage: 18.2 },
      { elementCode: 'MAT-WIFI', elementName: 'WiFi 모듈', amount: 7500, percentage: 34.1 },
      { elementCode: 'MAT-OTHER', elementName: '기타 부품', amount: 3000, percentage: 13.6 },
      { elementCode: 'LAB-DIRECT', elementName: '직접노무비', amount: 3500, percentage: 15.9 },
      { elementCode: 'LAB-INDIRECT', elementName: '간접노무비', amount: 1500, percentage: 6.8 },
      { elementCode: 'OH-MFG', elementName: '제조간접비', amount: 2500, percentage: 11.4 },
    ],
  },
];

export default function StandardCostPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedVersion, setSelectedVersion] = useState('2024-01');

  const toggleRow = (productCode: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(productCode)) {
      newExpanded.delete(productCode);
    } else {
      newExpanded.add(productCode);
    }
    setExpandedRows(newExpanded);
  };

  const filteredCosts = mockStandardCosts.filter(cost =>
    cost.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cost.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const summary = {
    totalProducts: mockStandardCosts.length,
    avgMaterialRate: (mockStandardCosts.reduce((sum, c) => sum + (c.materialCost / c.totalCost * 100), 0) / mockStandardCosts.length).toFixed(1),
    avgLaborRate: (mockStandardCosts.reduce((sum, c) => sum + (c.laborCost / c.totalCost * 100), 0) / mockStandardCosts.length).toFixed(1),
    avgOverheadRate: (mockStandardCosts.reduce((sum, c) => sum + (c.overheadCost / c.totalCost * 100), 0) / mockStandardCosts.length).toFixed(1),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Calculator className="h-8 w-8 text-cyan-400" />
            표준원가
          </h1>
          <p className="text-slate-400 mt-1">제품별 표준원가를 관리하고 원가요소를 분석합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <Download className="h-4 w-4" />
            내보내기
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors">
            <Upload className="h-4 w-4" />
            원가 갱신
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-700 rounded-lg">
              <Package className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">등록 제품</p>
              <p className="text-2xl font-bold text-white">{summary.totalProducts}개</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Layers className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">평균 재료비율</p>
              <p className="text-2xl font-bold text-blue-400">{summary.avgMaterialRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Settings className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">평균 노무비율</p>
              <p className="text-2xl font-bold text-emerald-400">{summary.avgLaborRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">평균 경비비율</p>
              <p className="text-2xl font-bold text-amber-400">{summary.avgOverheadRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="제품코드 또는 제품명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="2024-01">2024-01 버전</option>
            <option value="2023-12">2023-12 버전</option>
            <option value="2023-06">2023-06 버전</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <RefreshCw className="h-4 w-4" />
            초기화
          </button>
        </div>
      </div>

      {/* Standard Cost Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-700/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300 w-8"></th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">제품코드</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">제품명</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">단위</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">재료비</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">노무비</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">경비</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">총원가</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">적용일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredCosts.map((cost) => {
              const isExpanded = expandedRows.has(cost.productCode);
              return (
                <>
                  <tr key={cost.productCode} className="hover:bg-slate-700/50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleRow(cost.productCode)}
                        className="p-1 hover:bg-slate-600 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-cyan-400 font-medium">{cost.productCode}</td>
                    <td className="px-4 py-3 text-white">{cost.productName}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{cost.unit}</td>
                    <td className="px-4 py-3 text-right">
                      <div>
                        <p className="text-blue-400">₩{cost.materialCost.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">{((cost.materialCost / cost.totalCost) * 100).toFixed(1)}%</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div>
                        <p className="text-emerald-400">₩{cost.laborCost.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">{((cost.laborCost / cost.totalCost) * 100).toFixed(1)}%</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div>
                        <p className="text-amber-400">₩{cost.overheadCost.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">{((cost.overheadCost / cost.totalCost) * 100).toFixed(1)}%</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-white font-bold">₩{cost.totalCost.toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300">{cost.effectiveDate}</td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-900/50">
                      <td colSpan={9} className="px-8 py-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-slate-300">원가요소 상세</h4>
                          <div className="grid grid-cols-3 gap-4">
                            {cost.costElements.map((element) => (
                              <div
                                key={element.elementCode}
                                className="bg-slate-800 rounded-lg p-3 border border-slate-700"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-slate-400">{element.elementName}</span>
                                  <span className="text-xs text-cyan-400">{element.percentage}%</span>
                                </div>
                                <p className="text-lg font-semibold text-white mt-1">
                                  ₩{element.amount.toLocaleString()}
                                </p>
                                <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-cyan-500 rounded-full"
                                    style={{ width: `${element.percentage}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
