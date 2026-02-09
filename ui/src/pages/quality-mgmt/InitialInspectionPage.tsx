import { useState } from 'react';
import {
  ClipboardCheck,
  Search,
  RefreshCw,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
} from 'lucide-react';

interface InspectionItem {
  itemCode: string;
  itemName: string;
  standard: string;
  result: string;
  judgment: 'PASS' | 'FAIL' | 'PENDING';
}

interface InitialInspection {
  inspectionNo: string;
  workOrderNo: string;
  productCode: string;
  productName: string;
  lineCode: string;
  lineName: string;
  inspectionType: 'INITIAL' | 'MIDDLE' | 'FINAL';
  inspectionTime: string;
  inspector: string;
  status: 'PASS' | 'FAIL' | 'PENDING' | 'IN_PROGRESS';
  items: InspectionItem[];
  remark?: string;
}

const mockInspections: InitialInspection[] = [
  {
    inspectionNo: 'INS-2024-0201-001',
    workOrderNo: 'WO-2024-0201',
    productCode: 'FG-SMB-001',
    productName: '스마트폰 메인보드 A1',
    lineCode: 'SMT-L01',
    lineName: 'SMT 1라인',
    inspectionType: 'INITIAL',
    inspectionTime: '2024-02-01 06:30',
    inspector: '한미래',
    status: 'PASS',
    items: [
      { itemCode: 'CHK-001', itemName: '솔더 상태', standard: '브릿지 없음', result: '양호', judgment: 'PASS' },
      { itemCode: 'CHK-002', itemName: '부품 위치', standard: '±0.1mm 이내', result: '0.05mm', judgment: 'PASS' },
      { itemCode: 'CHK-003', itemName: '납땜 높이', standard: '150±30μm', result: '155μm', judgment: 'PASS' },
    ],
  },
  {
    inspectionNo: 'INS-2024-0201-002',
    workOrderNo: 'WO-2024-0201',
    productCode: 'FG-SMB-001',
    productName: '스마트폰 메인보드 A1',
    lineCode: 'SMT-L01',
    lineName: 'SMT 1라인',
    inspectionType: 'MIDDLE',
    inspectionTime: '2024-02-01 12:15',
    inspector: '한미래',
    status: 'PASS',
    items: [
      { itemCode: 'CHK-001', itemName: '솔더 상태', standard: '브릿지 없음', result: '양호', judgment: 'PASS' },
      { itemCode: 'CHK-002', itemName: '부품 위치', standard: '±0.1mm 이내', result: '0.08mm', judgment: 'PASS' },
      { itemCode: 'CHK-003', itemName: '납땜 높이', standard: '150±30μm', result: '162μm', judgment: 'PASS' },
    ],
  },
  {
    inspectionNo: 'INS-2024-0201-003',
    workOrderNo: 'WO-2024-0201',
    productCode: 'FG-SMB-001',
    productName: '스마트폰 메인보드 A1',
    lineCode: 'SMT-L01',
    lineName: 'SMT 1라인',
    inspectionType: 'FINAL',
    inspectionTime: '2024-02-01 17:45',
    inspector: '한미래',
    status: 'FAIL',
    items: [
      { itemCode: 'CHK-001', itemName: '솔더 상태', standard: '브릿지 없음', result: '브릿지 3건', judgment: 'FAIL' },
      { itemCode: 'CHK-002', itemName: '부품 위치', standard: '±0.1mm 이내', result: '0.12mm', judgment: 'FAIL' },
      { itemCode: 'CHK-003', itemName: '납땜 높이', standard: '150±30μm', result: '148μm', judgment: 'PASS' },
    ],
    remark: '라인 점검 필요 - 솔더 브릿지 발생',
  },
  {
    inspectionNo: 'INS-2024-0202-001',
    workOrderNo: 'WO-2024-0205',
    productCode: 'FG-IOT-001',
    productName: 'IoT 모듈 M1',
    lineCode: 'SMT-L04',
    lineName: 'SMT 4라인',
    inspectionType: 'INITIAL',
    inspectionTime: '2024-02-02 06:45',
    inspector: '최동현',
    status: 'PASS',
    items: [
      { itemCode: 'CHK-001', itemName: '솔더 상태', standard: '브릿지 없음', result: '양호', judgment: 'PASS' },
      { itemCode: 'CHK-004', itemName: 'WiFi 모듈 장착', standard: '정위치', result: '정상', judgment: 'PASS' },
    ],
  },
  {
    inspectionNo: 'INS-2024-0202-002',
    workOrderNo: 'WO-2024-0205',
    productCode: 'FG-IOT-001',
    productName: 'IoT 모듈 M1',
    lineCode: 'SMT-L04',
    lineName: 'SMT 4라인',
    inspectionType: 'MIDDLE',
    inspectionTime: '2024-02-02 12:30',
    inspector: '최동현',
    status: 'IN_PROGRESS',
    items: [
      { itemCode: 'CHK-001', itemName: '솔더 상태', standard: '브릿지 없음', result: '-', judgment: 'PENDING' },
      { itemCode: 'CHK-004', itemName: 'WiFi 모듈 장착', standard: '정위치', result: '-', judgment: 'PENDING' },
    ],
  },
];

const typeConfig = {
  INITIAL: { label: '초물검사', color: 'bg-blue-500' },
  MIDDLE: { label: '중간검사', color: 'bg-amber-500' },
  FINAL: { label: '종물검사', color: 'bg-purple-500' },
};

const statusConfig = {
  PASS: { label: '합격', color: 'bg-green-500', icon: CheckCircle },
  FAIL: { label: '불합격', color: 'bg-red-500', icon: XCircle },
  PENDING: { label: '대기', color: 'bg-slate-500', icon: Clock },
  IN_PROGRESS: { label: '검사중', color: 'bg-cyan-500', icon: Clock },
};

const judgmentConfig = {
  PASS: { label: '합격', color: 'text-green-400' },
  FAIL: { label: '불합격', color: 'text-red-400' },
  PENDING: { label: '대기', color: 'text-slate-400' },
};

export default function InitialInspectionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedInspection, setSelectedInspection] = useState<InitialInspection | null>(mockInspections[0]);

  const filteredInspections = mockInspections.filter(insp => {
    const matchesSearch = insp.inspectionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          insp.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || insp.inspectionType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || insp.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const summary = {
    total: mockInspections.length,
    pass: mockInspections.filter(i => i.status === 'PASS').length,
    fail: mockInspections.filter(i => i.status === 'FAIL').length,
    inProgress: mockInspections.filter(i => i.status === 'IN_PROGRESS').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-cyan-400" />
            초중종검사
          </h1>
          <p className="text-slate-400 mt-1">작업 시작/중간/종료 시점의 품질검사를 수행합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors">
            <Plus className="h-4 w-4" />
            검사 등록
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">전체 검사</p>
          <p className="text-2xl font-bold text-white">{summary.total}건</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">합격</p>
          <p className="text-2xl font-bold text-green-400">{summary.pass}건</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">불합격</p>
          <p className="text-2xl font-bold text-red-400">{summary.fail}건</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">검사중</p>
          <p className="text-2xl font-bold text-cyan-400">{summary.inProgress}건</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Inspection List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="검사번호 또는 제품명..."
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
                <option value="INITIAL">초물검사</option>
                <option value="MIDDLE">중간검사</option>
                <option value="FINAL">종물검사</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 text-sm"
              >
                <option value="ALL">전체 상태</option>
                <option value="PASS">합격</option>
                <option value="FAIL">불합격</option>
                <option value="IN_PROGRESS">검사중</option>
              </select>
            </div>
          </div>
          <div className="divide-y divide-slate-700 max-h-[550px] overflow-y-auto">
            {filteredInspections.map((insp) => {
              const StatusIcon = statusConfig[insp.status].icon;
              return (
                <div
                  key={insp.inspectionNo}
                  className={`p-4 cursor-pointer hover:bg-slate-700/50 ${
                    selectedInspection?.inspectionNo === insp.inspectionNo ? 'bg-slate-700/50 border-l-2 border-cyan-400' : ''
                  }`}
                  onClick={() => setSelectedInspection(insp)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-cyan-400 font-medium">{insp.inspectionNo}</p>
                        <span className={`px-2 py-0.5 rounded text-xs text-white ${typeConfig[insp.inspectionType].color}`}>
                          {typeConfig[insp.inspectionType].label}
                        </span>
                      </div>
                      <p className="text-white text-sm mt-1">{insp.productName}</p>
                      <p className="text-xs text-slate-400 mt-1">{insp.lineName} • {insp.inspectionTime}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white ${statusConfig[insp.status].color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig[insp.status].label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inspection Detail */}
        {selectedInspection && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">{selectedInspection.inspectionNo}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs text-white ${typeConfig[selectedInspection.inspectionType].color}`}>
                    {typeConfig[selectedInspection.inspectionType].label}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">{selectedInspection.inspectionTime}</p>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-white ${statusConfig[selectedInspection.status].color}`}>
                {(() => {
                  const StatusIcon = statusConfig[selectedInspection.status].icon;
                  return <StatusIcon className="h-4 w-4" />;
                })()}
                {statusConfig[selectedInspection.status].label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400">작업지시</p>
                <p className="text-white font-medium">{selectedInspection.workOrderNo}</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400">검사자</p>
                <p className="text-white">{selectedInspection.inspector}</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400">제품</p>
                <p className="text-white">{selectedInspection.productName}</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400">라인</p>
                <p className="text-white">{selectedInspection.lineName}</p>
              </div>
            </div>

            <h4 className="text-sm font-medium text-slate-300 mb-3">검사항목</h4>
            <div className="space-y-2 mb-6">
              {selectedInspection.items.map((item) => (
                <div key={item.itemCode} className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{item.itemName}</span>
                    <span className={`font-medium ${judgmentConfig[item.judgment].color}`}>
                      {judgmentConfig[item.judgment].label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">기준</p>
                      <p className="text-slate-300">{item.standard}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">결과</p>
                      <p className={item.judgment === 'FAIL' ? 'text-red-400' : 'text-slate-300'}>{item.result}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedInspection.remark && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-400">비고</p>
                    <p className="text-sm text-red-300">{selectedInspection.remark}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedInspection.status === 'IN_PROGRESS' && (
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors">
                  <CheckCircle className="h-4 w-4" />
                  합격 처리
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">
                  <XCircle className="h-4 w-4" />
                  불합격 처리
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
