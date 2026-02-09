import { useState } from 'react';
import { ClipboardList, Search, Plus, Filter, CheckCircle2, XCircle, AlertTriangle, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProcessInspection {
  id: string;
  inspectionNo: string;
  workOrderNo: string;
  productName: string;
  processName: string;
  lineName: string;
  inspectionTime: string;
  inspector: string;
  sampleSize: number;
  passCount: number;
  failCount: number;
  status: 'pass' | 'fail' | 'conditional';
  defects: { type: string; count: number }[];
}

const mockInspections: ProcessInspection[] = [
  { id: '1', inspectionNo: 'PI-2024-0001', workOrderNo: 'WO-2024-0001', productName: '스마트폰 메인보드 A', processName: 'SMT 실장', lineName: 'SMT-L01', inspectionTime: '2024-01-15 10:00', inspector: '이품질', sampleSize: 50, passCount: 49, failCount: 1, status: 'pass', defects: [{ type: '솔더브릿지', count: 1 }] },
  { id: '2', inspectionNo: 'PI-2024-0002', workOrderNo: 'WO-2024-0001', productName: '스마트폰 메인보드 A', processName: '리플로우', lineName: 'SMT-L01', inspectionTime: '2024-01-15 11:00', inspector: '이품질', sampleSize: 50, passCount: 50, failCount: 0, status: 'pass', defects: [] },
  { id: '3', inspectionNo: 'PI-2024-0003', workOrderNo: 'WO-2024-0002', productName: '스마트폰 메인보드 B', processName: 'SMT 실장', lineName: 'SMT-L02', inspectionTime: '2024-01-15 12:00', inspector: '박검사', sampleSize: 50, passCount: 45, failCount: 5, status: 'fail', defects: [{ type: '부품누락', count: 3 }, { type: '틀어짐', count: 2 }] },
  { id: '4', inspectionNo: 'PI-2024-0004', workOrderNo: 'WO-2024-0002', productName: '스마트폰 메인보드 B', processName: 'AOI 검사', lineName: 'SMT-L02', inspectionTime: '2024-01-15 13:00', inspector: '박검사', sampleSize: 100, passCount: 97, failCount: 3, status: 'conditional', defects: [{ type: '솔더불량', count: 2 }, { type: '냉납', count: 1 }] },
  { id: '5', inspectionNo: 'PI-2024-0005', workOrderNo: 'WO-2024-0003', productName: '전원보드 A', processName: 'DIP 삽입', lineName: 'DIP-L01', inspectionTime: '2024-01-15 14:00', inspector: '최검사', sampleSize: 30, passCount: 30, failCount: 0, status: 'pass', defects: [] },
];

const chartData = [
  { process: 'SMT', pass: 95, fail: 5 },
  { process: '리플로우', pass: 98, fail: 2 },
  { process: 'AOI', pass: 97, fail: 3 },
  { process: 'DIP', pass: 99, fail: 1 },
  { process: '조립', pass: 96, fail: 4 },
];

export default function ProcessInspectionPage() {
  const [inspections] = useState<ProcessInspection[]>(mockInspections);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInspection, setSelectedInspection] = useState<ProcessInspection | null>(null);

  const filteredInspections = inspections.filter(insp => {
    const matchesSearch = insp.inspectionNo.includes(searchTerm) || insp.productName.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || insp.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: ProcessInspection['status']) => {
    switch (status) {
      case 'pass': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'fail': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'conditional': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getStatusText = (status: ProcessInspection['status']) => {
    switch (status) {
      case 'pass': return '합격';
      case 'fail': return '불합격';
      case 'conditional': return '조건부';
    }
  };

  const getStatusIcon = (status: ProcessInspection['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-4 h-4" />;
      case 'fail': return <XCircle className="w-4 h-4" />;
      case 'conditional': return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const stats = {
    total: inspections.length,
    pass: inspections.filter(i => i.status === 'pass').length,
    fail: inspections.filter(i => i.status === 'fail').length,
    conditional: inspections.filter(i => i.status === 'conditional').length,
    avgPassRate: (inspections.reduce((acc, i) => acc + (i.passCount / i.sampleSize) * 100, 0) / inspections.length).toFixed(1),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">공정검사</h1>
          <p className="text-slate-400 text-sm mt-1">생산 공정별 품질 검사 결과 관리</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          검사 등록
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">전체 검사</p>
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
          <p className="text-slate-400 text-sm">조건부</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.conditional}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">평균 합격률</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.avgPassRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="검사번호, 제품명으로 검색..."
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
              <option value="pass">합격</option>
              <option value="fail">불합격</option>
              <option value="conditional">조건부</option>
            </select>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">검사번호</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">제품/공정</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">검사시간</th>
                  <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">합격/불량</th>
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
                      <p className="text-white font-mono text-sm">{insp.inspectionNo}</p>
                      <p className="text-slate-500 text-xs">{insp.workOrderNo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{insp.productName}</p>
                      <p className="text-slate-500 text-xs">{insp.processName} | {insp.lineName}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{insp.inspectionTime}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-green-400">{insp.passCount}</span>
                      <span className="text-slate-500"> / </span>
                      <span className="text-red-400">{insp.failCount}</span>
                    </td>
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
        </div>

        <div className="col-span-1 space-y-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h3 className="text-white font-bold mb-4">공정별 합격률</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis dataKey="process" type="category" stroke="#94a3b8" fontSize={12} width={50} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Bar dataKey="pass" fill="#22c55e" name="합격" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {selectedInspection && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">검사 상세</h3>
                <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-xs">검사번호</p>
                  <p className="text-white font-mono">{selectedInspection.inspectionNo}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">공정</p>
                  <p className="text-white">{selectedInspection.processName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">검사자</p>
                  <p className="text-white">{selectedInspection.inspector}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-slate-400 text-xs">샘플</p>
                    <p className="text-white font-bold">{selectedInspection.sampleSize}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">합격</p>
                    <p className="text-green-400 font-bold">{selectedInspection.passCount}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">불량</p>
                    <p className="text-red-400 font-bold">{selectedInspection.failCount}</p>
                  </div>
                </div>
                {selectedInspection.defects.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-xs mb-2">불량 내역</p>
                    {selectedInspection.defects.map((defect, idx) => (
                      <div key={idx} className="flex justify-between p-2 bg-red-500/10 rounded mb-1">
                        <span className="text-white text-sm">{defect.type}</span>
                        <span className="text-red-400 text-sm">{defect.count}건</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
