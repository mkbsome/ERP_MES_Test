import { useState } from 'react';
import { AlertOctagon, Search, Plus, Filter, Clock, CheckCircle2, XCircle, AlertTriangle, FileText, MessageSquare } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Claim {
  id: string;
  claimNo: string;
  customerName: string;
  productName: string;
  lotNo: string;
  claimDate: string;
  claimType: 'quality' | 'delivery' | 'packaging' | 'specification';
  severity: 'critical' | 'major' | 'minor';
  status: 'registered' | 'investigating' | 'resolved' | 'closed';
  description: string;
  quantity: number;
  handler: string;
  dueDate: string;
  resolution?: string;
}

const mockClaims: Claim[] = [
  {
    id: '1',
    claimNo: 'CLM-2024-0001',
    customerName: '삼성전자',
    productName: '스마트폰 메인보드 A',
    lotNo: 'LOT-2024-0115-001',
    claimDate: '2024-01-15',
    claimType: 'quality',
    severity: 'critical',
    status: 'investigating',
    description: '납품 제품 중 3% 이상 동작 불량 발생',
    quantity: 150,
    handler: '김품질',
    dueDate: '2024-01-22',
  },
  {
    id: '2',
    claimNo: 'CLM-2024-0002',
    customerName: 'LG전자',
    productName: '전원보드 A',
    lotNo: 'LOT-2024-0112-003',
    claimDate: '2024-01-14',
    claimType: 'packaging',
    severity: 'minor',
    status: 'resolved',
    description: '포장 박스 파손으로 인한 제품 스크래치',
    quantity: 20,
    handler: '이품질',
    dueDate: '2024-01-18',
    resolution: '포장재 강화 및 교체품 발송 완료',
  },
  {
    id: '3',
    claimNo: 'CLM-2024-0003',
    customerName: '현대모비스',
    productName: '자동차 ECU',
    lotNo: 'LOT-2024-0110-002',
    claimDate: '2024-01-12',
    claimType: 'specification',
    severity: 'major',
    status: 'closed',
    description: '규격 대비 커넥터 핀 위치 오차 발생',
    quantity: 50,
    handler: '박품질',
    dueDate: '2024-01-19',
    resolution: '설계 검토 후 금형 수정, 재납품 완료',
  },
  {
    id: '4',
    claimNo: 'CLM-2024-0004',
    customerName: 'SK하이닉스',
    productName: 'LED 드라이버',
    lotNo: 'LOT-2024-0113-001',
    claimDate: '2024-01-13',
    claimType: 'delivery',
    severity: 'major',
    status: 'registered',
    description: '납기 지연으로 인한 생산 차질 발생',
    quantity: 500,
    handler: '최품질',
    dueDate: '2024-01-20',
  },
  {
    id: '5',
    claimNo: 'CLM-2024-0005',
    customerName: '삼성SDI',
    productName: 'IoT 모듈',
    lotNo: 'LOT-2024-0114-002',
    claimDate: '2024-01-14',
    claimType: 'quality',
    severity: 'minor',
    status: 'investigating',
    description: '일부 제품 통신 불안정 현상',
    quantity: 30,
    handler: '김품질',
    dueDate: '2024-01-21',
  },
];

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#6366f1'];

export default function ClaimPage() {
  const [claims] = useState<Claim[]>(mockClaims);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.claimNo.includes(searchTerm) ||
                         claim.customerName.includes(searchTerm) ||
                         claim.productName.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || claim.status === filterStatus;
    const matchesType = filterType === 'all' || claim.claimType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: Claim['status']) => {
    switch (status) {
      case 'registered': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'investigating': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusText = (status: Claim['status']) => {
    switch (status) {
      case 'registered': return '접수';
      case 'investigating': return '조사중';
      case 'resolved': return '해결';
      case 'closed': return '종결';
    }
  };

  const getStatusIcon = (status: Claim['status']) => {
    switch (status) {
      case 'registered': return <Clock className="w-4 h-4" />;
      case 'investigating': return <AlertTriangle className="w-4 h-4" />;
      case 'resolved': return <CheckCircle2 className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: Claim['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'major': return 'bg-orange-500/20 text-orange-400';
      case 'minor': return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  const getSeverityText = (severity: Claim['severity']) => {
    switch (severity) {
      case 'critical': return '심각';
      case 'major': return '중대';
      case 'minor': return '경미';
    }
  };

  const getTypeText = (type: Claim['claimType']) => {
    switch (type) {
      case 'quality': return '품질';
      case 'delivery': return '납기';
      case 'packaging': return '포장';
      case 'specification': return '규격';
    }
  };

  const stats = {
    total: claims.length,
    registered: claims.filter(c => c.status === 'registered').length,
    investigating: claims.filter(c => c.status === 'investigating').length,
    resolved: claims.filter(c => c.status === 'resolved').length,
    closed: claims.filter(c => c.status === 'closed').length,
  };

  const chartData = [
    { name: '접수', value: stats.registered },
    { name: '조사중', value: stats.investigating },
    { name: '해결', value: stats.resolved },
    { name: '종결', value: stats.closed },
  ].filter(item => item.value > 0);

  const typeChartData = [
    { name: '품질', value: claims.filter(c => c.claimType === 'quality').length },
    { name: '납기', value: claims.filter(c => c.claimType === 'delivery').length },
    { name: '포장', value: claims.filter(c => c.claimType === 'packaging').length },
    { name: '규격', value: claims.filter(c => c.claimType === 'specification').length },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">클레임관리</h1>
          <p className="text-slate-400 text-sm mt-1">고객 클레임 접수 및 처리 현황 관리</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          클레임 등록
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-700 rounded-lg">
              <AlertOctagon className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">전체 클레임</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">접수</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.registered}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">조사중</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.investigating}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">해결</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.resolved}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">종결</p>
          <p className="text-2xl font-bold text-slate-400 mt-1">{stats.closed}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="클레임번호, 고객사, 제품명으로 검색..."
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
              <option value="registered">접수</option>
              <option value="investigating">조사중</option>
              <option value="resolved">해결</option>
              <option value="closed">종결</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">전체 유형</option>
              <option value="quality">품질</option>
              <option value="delivery">납기</option>
              <option value="packaging">포장</option>
              <option value="specification">규격</option>
            </select>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">클레임번호</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">고객사/제품</th>
                  <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">유형</th>
                  <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">심각도</th>
                  <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">상태</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">처리기한</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredClaims.map((claim) => (
                  <tr
                    key={claim.id}
                    onClick={() => setSelectedClaim(claim)}
                    className={`hover:bg-slate-700/30 cursor-pointer ${selectedClaim?.id === claim.id ? 'bg-slate-700/50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-mono text-sm">{claim.claimNo}</p>
                      <p className="text-slate-500 text-xs">{claim.claimDate}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{claim.customerName}</p>
                      <p className="text-slate-500 text-xs">{claim.productName}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-slate-700 rounded text-slate-300 text-xs">
                        {getTypeText(claim.claimType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(claim.severity)}`}>
                        {getSeverityText(claim.severity)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getStatusColor(claim.status)}`}>
                        {getStatusIcon(claim.status)}
                        {getStatusText(claim.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{claim.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-1 space-y-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h3 className="text-white font-bold mb-4">상태별 현황</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h3 className="text-white font-bold mb-4">유형별 현황</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {typeChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {selectedClaim && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">클레임 상세</h3>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded" title="첨부파일">
                    <FileText className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded" title="코멘트">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-xs">클레임번호</p>
                  <p className="text-white font-mono">{selectedClaim.claimNo}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">고객사</p>
                  <p className="text-white">{selectedClaim.customerName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">제품/LOT</p>
                  <p className="text-white">{selectedClaim.productName}</p>
                  <p className="text-slate-500 text-xs font-mono">{selectedClaim.lotNo}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">불량수량</p>
                  <p className="text-red-400 font-bold">{selectedClaim.quantity.toLocaleString()}개</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">담당자</p>
                  <p className="text-white">{selectedClaim.handler}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">클레임 내용</p>
                  <p className="text-white text-sm p-2 bg-slate-700/30 rounded">{selectedClaim.description}</p>
                </div>
                {selectedClaim.resolution && (
                  <div>
                    <p className="text-slate-400 text-xs">조치 내용</p>
                    <p className="text-green-400 text-sm p-2 bg-green-500/10 rounded">{selectedClaim.resolution}</p>
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
