import { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Factory,
  FileText,
  Layers,
  Settings,
  Clock,
  CheckCircle,
  PlayCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import clsx from 'clsx';

type TabType = 'workorders' | 'bom' | 'routing';

// Mock data
const workOrders = [
  {
    id: 'WO-2024-0456',
    product: 'SMT-MB-001',
    productName: '스마트폰 메인보드 A형',
    qty: 1000,
    startDate: '2024-12-15',
    endDate: '2024-12-18',
    line: 'SMT-L01',
    status: 'in_progress',
    progress: 65,
  },
  {
    id: 'WO-2024-0455',
    product: 'PWR-BD-002',
    productName: '전원보드 B형',
    qty: 2000,
    startDate: '2024-12-16',
    endDate: '2024-12-19',
    line: 'SMT-L02',
    status: 'waiting',
    progress: 0,
  },
  {
    id: 'WO-2024-0454',
    product: 'LED-DRV-003',
    productName: 'LED 드라이버',
    qty: 3000,
    startDate: '2024-12-14',
    endDate: '2024-12-16',
    line: 'SMT-L03',
    status: 'completed',
    progress: 100,
  },
  {
    id: 'WO-2024-0453',
    product: 'ECU-AUT-001',
    productName: '자동차 ECU 모듈',
    qty: 500,
    startDate: '2024-12-17',
    endDate: '2024-12-20',
    line: 'SMT-L04',
    status: 'planned',
    progress: 0,
  },
];

const bomData = [
  {
    product: 'SMT-MB-001',
    productName: '스마트폰 메인보드 A형',
    version: '3.0',
    components: 156,
    lastUpdate: '2024-12-01',
    status: 'active',
    items: [
      { itemCode: 'IC-STM32F4', itemName: 'STM32F407VGT6 MCU', qty: 1, unit: 'EA' },
      { itemCode: 'CAP-0603-10UF', itemName: '적층세라믹콘덴서 10μF', qty: 48, unit: 'EA' },
      { itemCode: 'RES-0402-10K', itemName: '칩저항 10KΩ', qty: 32, unit: 'EA' },
      { itemCode: 'CON-USB-C', itemName: 'USB Type-C 커넥터', qty: 1, unit: 'EA' },
    ],
  },
  {
    product: 'PWR-BD-002',
    productName: '전원보드 B형',
    version: '2.1',
    components: 89,
    lastUpdate: '2024-11-15',
    status: 'active',
    items: [],
  },
  {
    product: 'LED-DRV-003',
    productName: 'LED 드라이버',
    version: '1.5',
    components: 45,
    lastUpdate: '2024-10-20',
    status: 'active',
    items: [],
  },
];

const routingData = [
  {
    product: 'SMT-MB-001',
    productName: '스마트폰 메인보드 A형',
    version: '2.0',
    operations: 8,
    totalTime: 45,
    status: 'active',
    steps: [
      { seq: 10, name: '인쇄(Printing)', workCenter: 'SMT-PR-01', stdTime: 5 },
      { seq: 20, name: 'SPI 검사', workCenter: 'SMT-SPI-01', stdTime: 3 },
      { seq: 30, name: '칩마운트', workCenter: 'SMT-CM-01', stdTime: 15 },
      { seq: 40, name: '리플로우', workCenter: 'SMT-RF-01', stdTime: 8 },
      { seq: 50, name: 'AOI 검사', workCenter: 'SMT-AOI-01', stdTime: 5 },
    ],
  },
];

const weeklyProductionData = [
  { day: '월', planned: 5000, actual: 4800 },
  { day: '화', planned: 5000, actual: 5100 },
  { day: '수', planned: 5000, actual: 4950 },
  { day: '목', planned: 5000, actual: 5200 },
  { day: '금', planned: 5000, actual: 0 },
];

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  planned: { label: '계획', color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
  waiting: { label: '대기', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  in_progress: { label: '진행중', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  completed: { label: '완료', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  active: { label: '활성', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  inactive: { label: '비활성', color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
};

export default function Production() {
  const [activeTab, setActiveTab] = useState<TabType>('workorders');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBom, setExpandedBom] = useState<string | null>(null);
  const [expandedRouting, setExpandedRouting] = useState<string | null>(null);

  const tabs = [
    { id: 'workorders', name: '작업지시', icon: FileText },
    { id: 'bom', name: 'BOM 관리', icon: Layers },
    { id: 'routing', name: 'Routing', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <FileText size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">금일 작업지시</p>
              <p className="text-xl font-bold text-white">12건</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/20">
              <PlayCircle size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">진행중</p>
              <p className="text-xl font-bold text-white">8건</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <CheckCircle size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">완료</p>
              <p className="text-xl font-bold text-white">4건</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-500/20">
              <Clock size={20} className="text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">지연</p>
              <p className="text-xl font-bold text-white">1건</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">주간 생산 현황</h3>
          <span className="text-xs text-slate-400">단위: EA</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyProductionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="planned" name="계획" fill="#6b7280" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="실적" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              )}
            >
              <tab.icon size={18} />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'workorders' && (
        <div className="card">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="작업지시번호, 제품 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 w-64"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:bg-slate-600">
                <Filter size={16} />
                필터
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:bg-slate-600">
                <Download size={16} />
                엑셀
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg text-sm text-white hover:bg-primary-700">
                <Plus size={16} />
                작업지시 등록
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">작업지시번호</th>
                  <th className="text-left px-4 py-3">제품</th>
                  <th className="text-right px-4 py-3">지시수량</th>
                  <th className="text-center px-4 py-3">시작일</th>
                  <th className="text-center px-4 py-3">종료일</th>
                  <th className="text-center px-4 py-3">라인</th>
                  <th className="text-center px-4 py-3">진행률</th>
                  <th className="text-center px-4 py-3">상태</th>
                  <th className="text-center px-4 py-3">액션</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="table-row">
                    <td className="table-cell font-medium text-primary-400">{wo.id}</td>
                    <td className="table-cell">
                      <div>
                        <p className="text-slate-200">{wo.productName}</p>
                        <p className="text-xs text-slate-400">{wo.product}</p>
                      </div>
                    </td>
                    <td className="table-cell text-right text-slate-200">{wo.qty.toLocaleString()}</td>
                    <td className="table-cell text-center text-slate-300">{wo.startDate}</td>
                    <td className="table-cell text-center text-slate-300">{wo.endDate}</td>
                    <td className="table-cell text-center text-slate-300">{wo.line}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              'h-full rounded-full',
                              wo.progress === 100 ? 'bg-green-500' : 'bg-primary-500'
                            )}
                            style={{ width: `${wo.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-10">{wo.progress}%</span>
                      </div>
                    </td>
                    <td className="table-cell text-center">
                      <span className={clsx(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        statusConfig[wo.status].bgColor,
                        statusConfig[wo.status].color
                      )}>
                        {statusConfig[wo.status].label}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 hover:bg-slate-600 rounded text-slate-400 hover:text-white">
                          <Eye size={16} />
                        </button>
                        <button className="p-1.5 hover:bg-slate-600 rounded text-slate-400 hover:text-white">
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'bom' && (
        <div className="card">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="제품코드, 제품명 검색..."
                className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg text-sm text-white hover:bg-primary-700">
              <Plus size={16} />
              BOM 등록
            </button>
          </div>

          {/* BOM List */}
          <div className="space-y-3">
            {bomData.map((bom) => (
              <div key={bom.product} className="border border-slate-700 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 bg-slate-700/30 cursor-pointer hover:bg-slate-700/50"
                  onClick={() => setExpandedBom(expandedBom === bom.product ? null : bom.product)}
                >
                  <div className="flex items-center gap-4">
                    <Layers size={20} className="text-primary-400" />
                    <div>
                      <p className="font-medium text-slate-200">{bom.productName}</p>
                      <p className="text-xs text-slate-400">{bom.product} | 버전 {bom.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-slate-200">{bom.components}개 부품</p>
                      <p className="text-xs text-slate-400">최종수정: {bom.lastUpdate}</p>
                    </div>
                    <span className={clsx(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      statusConfig[bom.status].bgColor,
                      statusConfig[bom.status].color
                    )}>
                      {statusConfig[bom.status].label}
                    </span>
                    {expandedBom === bom.product ? (
                      <ChevronUp size={18} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={18} className="text-slate-400" />
                    )}
                  </div>
                </div>

                {expandedBom === bom.product && bom.items.length > 0 && (
                  <div className="p-4 bg-slate-800/50">
                    <table className="w-full">
                      <thead>
                        <tr className="table-header">
                          <th className="text-left px-4 py-2">품목코드</th>
                          <th className="text-left px-4 py-2">품목명</th>
                          <th className="text-right px-4 py-2">소요량</th>
                          <th className="text-center px-4 py-2">단위</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bom.items.map((item) => (
                          <tr key={item.itemCode} className="border-b border-slate-700/50">
                            <td className="px-4 py-2 text-sm text-primary-400">{item.itemCode}</td>
                            <td className="px-4 py-2 text-sm text-slate-300">{item.itemName}</td>
                            <td className="px-4 py-2 text-sm text-right text-slate-200">{item.qty}</td>
                            <td className="px-4 py-2 text-sm text-center text-slate-400">{item.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-slate-500 mt-3">... 외 {bom.components - bom.items.length}개 부품</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'routing' && (
        <div className="card">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="제품코드, 제품명 검색..."
                className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg text-sm text-white hover:bg-primary-700">
              <Plus size={16} />
              Routing 등록
            </button>
          </div>

          {/* Routing List */}
          <div className="space-y-3">
            {routingData.map((routing) => (
              <div key={routing.product} className="border border-slate-700 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 bg-slate-700/30 cursor-pointer hover:bg-slate-700/50"
                  onClick={() => setExpandedRouting(expandedRouting === routing.product ? null : routing.product)}
                >
                  <div className="flex items-center gap-4">
                    <Settings size={20} className="text-primary-400" />
                    <div>
                      <p className="font-medium text-slate-200">{routing.productName}</p>
                      <p className="text-xs text-slate-400">{routing.product} | 버전 {routing.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-slate-200">{routing.operations}개 공정</p>
                      <p className="text-xs text-slate-400">총 {routing.totalTime}분</p>
                    </div>
                    <span className={clsx(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      statusConfig[routing.status].bgColor,
                      statusConfig[routing.status].color
                    )}>
                      {statusConfig[routing.status].label}
                    </span>
                    {expandedRouting === routing.product ? (
                      <ChevronUp size={18} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={18} className="text-slate-400" />
                    )}
                  </div>
                </div>

                {expandedRouting === routing.product && (
                  <div className="p-4 bg-slate-800/50">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {routing.steps.map((step, index) => (
                        <div key={step.seq} className="flex items-center">
                          <div className="flex flex-col items-center min-w-[120px]">
                            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                              {step.seq}
                            </div>
                            <p className="text-sm text-slate-200 mt-2 text-center">{step.name}</p>
                            <p className="text-xs text-slate-400">{step.workCenter}</p>
                            <p className="text-xs text-slate-500">{step.stdTime}분</p>
                          </div>
                          {index < routing.steps.length - 1 && (
                            <div className="w-8 h-0.5 bg-slate-600 mx-2" />
                          )}
                        </div>
                      ))}
                      <div className="flex items-center">
                        <div className="w-8 h-0.5 bg-slate-600 mx-2" />
                        <div className="text-xs text-slate-500">... 외 {routing.operations - routing.steps.length}개 공정</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
