import { useState } from 'react';
import { ClipboardCheck, Search, Plus, CheckCircle2, XCircle, AlertTriangle, Camera, Save } from 'lucide-react';

interface SelfInspection {
  id: string;
  workOrderNo: string;
  productName: string;
  lineName: string;
  inspectionTime: string;
  inspectorName: string;
  inspectionType: 'first' | 'hourly' | 'lot_change';
  items: InspectionItem[];
  status: 'pass' | 'fail' | 'pending';
  remarks?: string;
}

interface InspectionItem {
  id: string;
  itemName: string;
  spec: string;
  result: 'pass' | 'fail' | 'pending';
  measuredValue?: string;
}

const mockInspections: SelfInspection[] = [
  {
    id: '1', workOrderNo: 'WO-2024-0001', productName: '스마트폰 메인보드 A', lineName: 'SMT-L01',
    inspectionTime: '2024-01-15 08:00', inspectorName: '김작업', inspectionType: 'first', status: 'pass',
    items: [
      { id: '1-1', itemName: '솔더 상태', spec: '양호', result: 'pass', measuredValue: '양호' },
      { id: '1-2', itemName: '부품 실장', spec: '정위치', result: 'pass', measuredValue: '정위치' },
      { id: '1-3', itemName: '인쇄 품질', spec: '선명', result: 'pass', measuredValue: '선명' },
    ]
  },
  {
    id: '2', workOrderNo: 'WO-2024-0001', productName: '스마트폰 메인보드 A', lineName: 'SMT-L01',
    inspectionTime: '2024-01-15 09:00', inspectorName: '김작업', inspectionType: 'hourly', status: 'pass',
    items: [
      { id: '2-1', itemName: '솔더 상태', spec: '양호', result: 'pass', measuredValue: '양호' },
      { id: '2-2', itemName: '부품 실장', spec: '정위치', result: 'pass', measuredValue: '정위치' },
      { id: '2-3', itemName: '인쇄 품질', spec: '선명', result: 'pass', measuredValue: '선명' },
    ]
  },
  {
    id: '3', workOrderNo: 'WO-2024-0002', productName: '스마트폰 메인보드 B', lineName: 'SMT-L01',
    inspectionTime: '2024-01-15 10:00', inspectorName: '이작업', inspectionType: 'lot_change', status: 'fail',
    items: [
      { id: '3-1', itemName: '솔더 상태', spec: '양호', result: 'pass', measuredValue: '양호' },
      { id: '3-2', itemName: '부품 실장', spec: '정위치', result: 'fail', measuredValue: '틀어짐' },
      { id: '3-3', itemName: '인쇄 품질', spec: '선명', result: 'pass', measuredValue: '선명' },
    ],
    remarks: '마운터 노즐 점검 필요'
  },
  {
    id: '4', workOrderNo: 'WO-2024-0002', productName: '스마트폰 메인보드 B', lineName: 'SMT-L01',
    inspectionTime: '2024-01-15 11:00', inspectorName: '이작업', inspectionType: 'hourly', status: 'pending',
    items: [
      { id: '4-1', itemName: '솔더 상태', spec: '양호', result: 'pending' },
      { id: '4-2', itemName: '부품 실장', spec: '정위치', result: 'pending' },
      { id: '4-3', itemName: '인쇄 품질', spec: '선명', result: 'pending' },
    ]
  },
];

export default function SelfInspectionPage() {
  const [inspections] = useState<SelfInspection[]>(mockInspections);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedInspection, setSelectedInspection] = useState<SelfInspection | null>(null);

  const filteredInspections = inspections.filter(insp => {
    const matchesSearch = insp.workOrderNo.includes(searchTerm) || insp.productName.includes(searchTerm);
    const matchesType = filterType === 'all' || insp.inspectionType === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: SelfInspection['inspectionType']) => {
    switch (type) {
      case 'first': return 'bg-blue-500/20 text-blue-400';
      case 'hourly': return 'bg-purple-500/20 text-purple-400';
      case 'lot_change': return 'bg-orange-500/20 text-orange-400';
    }
  };

  const getTypeText = (type: SelfInspection['inspectionType']) => {
    switch (type) {
      case 'first': return '초물검사';
      case 'hourly': return '시간검사';
      case 'lot_change': return 'LOT변경';
    }
  };

  const getStatusIcon = (status: SelfInspection['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'pending': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: SelfInspection['status']) => {
    switch (status) {
      case 'pass': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'fail': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getStatusText = (status: SelfInspection['status']) => {
    switch (status) {
      case 'pass': return '합격';
      case 'fail': return '불합격';
      case 'pending': return '대기';
    }
  };

  const stats = {
    total: inspections.length,
    pass: inspections.filter(i => i.status === 'pass').length,
    fail: inspections.filter(i => i.status === 'fail').length,
    pending: inspections.filter(i => i.status === 'pending').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">자주검사</h1>
          <p className="text-slate-400 text-sm mt-1">작업자 자주검사 등록 및 조회</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          검사 등록
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">전체</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">합격</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.pass}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">불합격</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.fail}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">대기</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.pending}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="작업지시번호, 제품명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">전체 유형</option>
          <option value="first">초물검사</option>
          <option value="hourly">시간검사</option>
          <option value="lot_change">LOT변경</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-slate-800 rounded-xl border border-slate-700">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">작업지시</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">검사시간</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">유형</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">검사자</th>
                <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">결과</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredInspections.map((insp) => (
                <tr
                  key={insp.id}
                  onClick={() => setSelectedInspection(insp)}
                  className={`hover:bg-slate-700/30 cursor-pointer ${selectedInspection?.id === insp.id ? 'bg-slate-700/50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <p className="text-white font-mono text-sm">{insp.workOrderNo}</p>
                    <p className="text-slate-500 text-xs">{insp.productName}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{insp.inspectionTime}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${getTypeColor(insp.inspectionType)}`}>
                      {getTypeText(insp.inspectionType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{insp.inspectorName}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getStatusColor(insp.status)}`}>
                      {getStatusIcon(insp.status)}
                      {getStatusText(insp.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-span-1">
          {selectedInspection ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">검사 상세</h3>
                {getStatusIcon(selectedInspection.status)}
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-xs">작업지시</p>
                  <p className="text-white font-mono">{selectedInspection.workOrderNo}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">제품</p>
                  <p className="text-white">{selectedInspection.productName}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-slate-400 text-xs">라인</p>
                    <p className="text-white">{selectedInspection.lineName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">검사자</p>
                    <p className="text-white">{selectedInspection.inspectorName}</p>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <p className="text-slate-400 text-xs mb-2">검사항목</p>
                  <div className="space-y-2">
                    {selectedInspection.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                        <div>
                          <p className="text-white text-sm">{item.itemName}</p>
                          <p className="text-slate-500 text-xs">기준: {item.spec}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.measuredValue && <span className="text-slate-400 text-xs">{item.measuredValue}</span>}
                          {item.result === 'pass' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                          {item.result === 'fail' && <XCircle className="w-4 h-4 text-red-400" />}
                          {item.result === 'pending' && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedInspection.remarks && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-xs mb-1">비고</p>
                    <p className="text-white text-sm">{selectedInspection.remarks}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-slate-700">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm">
                    <Camera className="w-4 h-4" />
                    사진첨부
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    <Save className="w-4 h-4" />
                    저장
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <ClipboardCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">검사를 선택하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
