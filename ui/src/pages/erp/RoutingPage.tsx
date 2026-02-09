import { useState } from 'react';
import { GitBranch, Search, Plus, Filter, Clock, Settings, ChevronRight, Edit2, Trash2 } from 'lucide-react';

interface RoutingStep {
  stepNo: number;
  operationCode: string;
  operationName: string;
  workCenter: string;
  setupTime: number;
  runTime: number;
  waitTime: number;
  moveTime: number;
  description: string;
}

interface Routing {
  id: string;
  routingCode: string;
  routingName: string;
  productCode: string;
  productName: string;
  version: string;
  status: 'active' | 'draft' | 'obsolete';
  totalTime: number;
  steps: RoutingStep[];
  createdAt: string;
  updatedAt: string;
}

const mockRoutings: Routing[] = [
  {
    id: '1',
    routingCode: 'RT-SMB-A01',
    routingName: '스마트폰 메인보드 A 공정',
    productCode: 'SMB-A01',
    productName: '스마트폰 메인보드 A',
    version: '1.0',
    status: 'active',
    totalTime: 125,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-10',
    steps: [
      { stepNo: 10, operationCode: 'OP-SMT', operationName: 'SMT 실장', workCenter: 'WC-SMT01', setupTime: 15, runTime: 30, waitTime: 5, moveTime: 5, description: 'SMT 부품 실장 공정' },
      { stepNo: 20, operationCode: 'OP-REF', operationName: '리플로우', workCenter: 'WC-REF01', setupTime: 10, runTime: 20, waitTime: 5, moveTime: 5, description: '리플로우 솔더링' },
      { stepNo: 30, operationCode: 'OP-AOI', operationName: 'AOI 검사', workCenter: 'WC-AOI01', setupTime: 5, runTime: 15, waitTime: 5, moveTime: 5, description: '자동 광학 검사' },
    ],
  },
  {
    id: '2',
    routingCode: 'RT-PWB-A01',
    routingName: '전원보드 A 공정',
    productCode: 'PWB-A01',
    productName: '전원보드 A',
    version: '2.0',
    status: 'active',
    totalTime: 95,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-12',
    steps: [
      { stepNo: 10, operationCode: 'OP-DIP', operationName: 'DIP 삽입', workCenter: 'WC-DIP01', setupTime: 10, runTime: 25, waitTime: 5, moveTime: 5, description: 'DIP 부품 삽입' },
      { stepNo: 20, operationCode: 'OP-WAVE', operationName: '웨이브 솔더링', workCenter: 'WC-WAV01', setupTime: 10, runTime: 20, waitTime: 5, moveTime: 5, description: '웨이브 솔더링' },
      { stepNo: 30, operationCode: 'OP-TEST', operationName: '기능 테스트', workCenter: 'WC-TST01', setupTime: 5, runTime: 10, waitTime: 0, moveTime: 0, description: '전기적 기능 테스트' },
    ],
  },
  {
    id: '3',
    routingCode: 'RT-ECU-A01',
    routingName: '자동차 ECU 공정',
    productCode: 'ECU-A01',
    productName: '자동차 ECU',
    version: '1.0',
    status: 'draft',
    totalTime: 180,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-15',
    steps: [
      { stepNo: 10, operationCode: 'OP-SMT', operationName: 'SMT 실장', workCenter: 'WC-SMT02', setupTime: 20, runTime: 40, waitTime: 10, moveTime: 5, description: 'SMT 부품 실장' },
      { stepNo: 20, operationCode: 'OP-REF', operationName: '리플로우', workCenter: 'WC-REF02', setupTime: 15, runTime: 25, waitTime: 5, moveTime: 5, description: '리플로우 솔더링' },
      { stepNo: 30, operationCode: 'OP-COAT', operationName: '코팅', workCenter: 'WC-COT01', setupTime: 10, runTime: 30, waitTime: 10, moveTime: 5, description: '방습 코팅 처리' },
    ],
  },
];

export default function RoutingPage() {
  const [routings] = useState<Routing[]>(mockRoutings);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRouting, setSelectedRouting] = useState<Routing | null>(mockRoutings[0]);

  const filteredRoutings = routings.filter(routing => {
    const matchesSearch = routing.routingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         routing.routingName.includes(searchTerm) ||
                         routing.productName.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || routing.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Routing['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'obsolete': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusText = (status: Routing['status']) => {
    switch (status) {
      case 'active': return '사용중';
      case 'draft': return '초안';
      case 'obsolete': return '폐기';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Routing 관리</h1>
          <p className="text-slate-400 text-sm mt-1">제품별 생산 공정 순서 및 표준시간 관리</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Routing 등록
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Routing 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="all">전체 상태</option>
                <option value="active">사용중</option>
                <option value="draft">초안</option>
                <option value="obsolete">폐기</option>
              </select>
            </div>

            <div className="space-y-2">
              {filteredRoutings.map((routing) => (
                <div
                  key={routing.id}
                  onClick={() => setSelectedRouting(routing)}
                  className={`p-3 rounded-lg cursor-pointer ${selectedRouting?.id === routing.id ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium text-sm">{routing.routingCode}</span>
                    <span className={`px-2 py-0.5 rounded text-xs border ${getStatusColor(routing.status)}`}>
                      {getStatusText(routing.status)}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">{routing.productName}</p>
                  <div className="flex items-center gap-2 mt-2 text-slate-400 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>총 {routing.totalTime}분</span>
                    <span>•</span>
                    <span>{routing.steps.length}공정</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-4">
          {selectedRouting && (
            <>
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">{selectedRouting.routingName}</h3>
                    <p className="text-slate-400 text-sm">{selectedRouting.routingCode} (v{selectedRouting.version})</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-slate-400 text-xs">제품코드</p>
                    <p className="text-white font-mono">{selectedRouting.productCode}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">총 소요시간</p>
                    <p className="text-white">{selectedRouting.totalTime}분</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">공정 수</p>
                    <p className="text-white">{selectedRouting.steps.length}개</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">수정일</p>
                    <p className="text-white">{selectedRouting.updatedAt}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <h3 className="text-white font-bold mb-4">공정 순서</h3>

                <div className="space-y-3">
                  {selectedRouting.steps.map((step, index) => (
                    <div key={step.stepNo} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {step.stepNo}
                        </div>
                        {index < selectedRouting.steps.length - 1 && (
                          <div className="w-0.5 h-16 bg-slate-600 my-2" />
                        )}
                      </div>
                      <div className="flex-1 bg-slate-700/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-white font-medium">{step.operationName}</span>
                            <span className="text-slate-500 text-sm ml-2">({step.operationCode})</span>
                          </div>
                          <span className="text-slate-400 text-sm">작업장: {step.workCenter}</span>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">{step.description}</p>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="bg-slate-800 rounded p-2 text-center">
                            <p className="text-slate-500 text-xs">준비시간</p>
                            <p className="text-yellow-400 font-medium">{step.setupTime}분</p>
                          </div>
                          <div className="bg-slate-800 rounded p-2 text-center">
                            <p className="text-slate-500 text-xs">작업시간</p>
                            <p className="text-green-400 font-medium">{step.runTime}분</p>
                          </div>
                          <div className="bg-slate-800 rounded p-2 text-center">
                            <p className="text-slate-500 text-xs">대기시간</p>
                            <p className="text-orange-400 font-medium">{step.waitTime}분</p>
                          </div>
                          <div className="bg-slate-800 rounded p-2 text-center">
                            <p className="text-slate-500 text-xs">이동시간</p>
                            <p className="text-blue-400 font-medium">{step.moveTime}분</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
