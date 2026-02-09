import { useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  Loader2,
  RefreshCw,
  Filter,
  Box,
  Truck,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import clsx from 'clsx';
import {
  useMaterialConsumption,
  useMaterialRequests,
  useMaterialInventory,
  useFeederSetups,
} from '../hooks';

export default function Material() {
  const [selectedLine, setSelectedLine] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'consumption' | 'inventory' | 'requests'>('consumption');

  // API 데이터 조회
  const { data: consumptionData, isLoading: consumptionLoading, refetch: refetchConsumption } = useMaterialConsumption({ page_size: 100 });
  const { data: requestsData, isLoading: requestsLoading } = useMaterialRequests({ page_size: 50 });
  const { data: inventoryData, isLoading: inventoryLoading } = useMaterialInventory();
  const { data: feederSetup } = useFeederSetups();

  // 재고 요약 데이터
  const inventorySummary = useMemo(() => {
    if (!inventoryData?.summary) {
      return {
        totalItems: 0,
        belowSafetyStock: 0,
        excessStock: 0,
        normalStock: 0,
        totalValue: 0,
      };
    }
    return {
      totalItems: inventoryData.summary.total_items ?? 0,
      belowSafetyStock: inventoryData.summary.below_safety_stock ?? 0,
      excessStock: inventoryData.summary.excess_stock ?? 0,
      normalStock: inventoryData.summary.normal_stock ?? 0,
      totalValue: inventoryData.summary.total_value ?? 0,
    };
  }, [inventoryData]);

  // 자재 소비 추이 데이터
  const consumptionTrendData = useMemo(() => {
    if (!consumptionData?.trend) {
      // Mock data for demonstration
      return [
        { date: '01-06', consumption: 15000, target: 14000 },
        { date: '01-07', consumption: 16500, target: 14000 },
        { date: '01-08', consumption: 14200, target: 14000 },
        { date: '01-09', consumption: 15800, target: 14000 },
        { date: '01-10', consumption: 13500, target: 14000 },
        { date: '01-11', consumption: 14800, target: 14000 },
        { date: '01-12', consumption: 15200, target: 14000 },
      ];
    }
    return consumptionData.trend;
  }, [consumptionData]);

  // 자재 유형별 소비량
  const consumptionByType = useMemo(() => {
    return [
      { name: 'SMD 부품', value: 45, color: '#3b82f6' },
      { name: 'PCB', value: 25, color: '#22c55e' },
      { name: '솔더 페이스트', value: 15, color: '#f59e0b' },
      { name: '기타 소모품', value: 15, color: '#8b5cf6' },
    ];
  }, []);

  // 재고 현황 리스트
  const inventoryList = useMemo(() => {
    if (!inventoryData?.items) {
      // Mock data
      return [
        { id: '1', materialCode: 'SMD-001', materialName: '저항 10K', category: 'SMD', stock: 50000, safetyStock: 20000, unit: 'EA', status: 'normal' },
        { id: '2', materialCode: 'SMD-002', materialName: '캐패시터 100uF', category: 'SMD', stock: 15000, safetyStock: 20000, unit: 'EA', status: 'low' },
        { id: '3', materialCode: 'PCB-001', materialName: '메인보드 PCB', category: 'PCB', stock: 800, safetyStock: 500, unit: 'EA', status: 'normal' },
        { id: '4', materialCode: 'SOLD-001', materialName: '솔더 페이스트 SAC305', category: '소모품', stock: 50, safetyStock: 30, unit: 'KG', status: 'normal' },
        { id: '5', materialCode: 'SMD-003', materialName: 'IC MCU STM32', category: 'SMD', stock: 3000, safetyStock: 5000, unit: 'EA', status: 'low' },
        { id: '6', materialCode: 'CON-001', materialName: 'USB-C 커넥터', category: '커넥터', stock: 25000, safetyStock: 10000, unit: 'EA', status: 'excess' },
      ];
    }
    return inventoryData.items.map((item: any) => ({
      id: item.material_id,
      materialCode: item.material_code,
      materialName: item.material_name,
      category: item.category,
      stock: item.current_stock ?? 0,
      safetyStock: item.safety_stock ?? 0,
      unit: item.unit ?? 'EA',
      status: item.stock_status ?? 'normal',
    }));
  }, [inventoryData]);

  // 필터링된 재고 리스트
  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventoryList;
    const search = searchTerm.toLowerCase();
    return inventoryList.filter((item: any) =>
      item.materialCode?.toLowerCase().includes(search) ||
      item.materialName?.toLowerCase().includes(search)
    );
  }, [inventoryList, searchTerm]);

  // 자재 요청 리스트
  const requestsList = useMemo(() => {
    if (!requestsData?.items) {
      // Mock data
      return [
        { id: 'REQ-001', lineCode: 'SMT-L01', materialCode: 'SMD-001', materialName: '저항 10K', requestQty: 5000, status: 'pending', requestedAt: '2024-01-12 10:30' },
        { id: 'REQ-002', lineCode: 'SMT-L02', materialCode: 'SMD-003', materialName: 'IC MCU STM32', requestQty: 500, status: 'in_progress', requestedAt: '2024-01-12 10:15' },
        { id: 'REQ-003', lineCode: 'THT-L01', materialCode: 'CON-001', materialName: 'USB-C 커넥터', requestQty: 2000, status: 'completed', requestedAt: '2024-01-12 09:45' },
      ];
    }
    return requestsData.items.map((req: any) => ({
      id: req.request_no,
      lineCode: req.line_code,
      materialCode: req.material_code,
      materialName: req.material_name,
      requestQty: req.request_qty,
      status: req.status,
      requestedAt: req.created_at,
    }));
  }, [requestsData]);

  // 피더 현황
  const feederList = useMemo(() => {
    if (!feederSetup?.feeders) {
      // Mock data
      return [
        { id: '1', feederNo: 'F001', lineCode: 'SMT-L01', slotNo: 1, materialCode: 'SMD-001', remainQty: 8500, status: 'ok' },
        { id: '2', feederNo: 'F002', lineCode: 'SMT-L01', slotNo: 2, materialCode: 'SMD-002', remainQty: 1200, status: 'low' },
        { id: '3', feederNo: 'F003', lineCode: 'SMT-L01', slotNo: 3, materialCode: 'SMD-003', remainQty: 0, status: 'empty' },
        { id: '4', feederNo: 'F004', lineCode: 'SMT-L02', slotNo: 1, materialCode: 'SMD-001', remainQty: 9000, status: 'ok' },
      ];
    }
    return feederSetup.feeders;
  }, [feederSetup]);

  const isLoading = consumptionLoading || requestsLoading || inventoryLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-400">데이터 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={selectedLine}
            onChange={(e) => setSelectedLine(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
          >
            <option value="all">전체 라인</option>
            <option value="SMT-L01">SMT-L01</option>
            <option value="SMT-L02">SMT-L02</option>
            <option value="THT-L01">THT-L01</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-400 hover:text-white hover:border-slate-600 transition-colors">
            <Filter size={16} />
            필터
          </button>
        </div>

        <button
          onClick={() => refetchConsumption()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
        >
          <RefreshCw size={16} />
          새로고침
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-900/30 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Package className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">총 자재 종류</p>
              <p className="text-2xl font-bold text-white">{inventorySummary.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-900/30 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-500/20">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">안전재고 미달</p>
              <p className="text-2xl font-bold text-red-400">{inventorySummary.belowSafetyStock}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-900/30 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-500/20">
              <Box className="text-yellow-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">과잉 재고</p>
              <p className="text-2xl font-bold text-yellow-400">{inventorySummary.excessStock}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-900/30 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/20">
              <Truck className="text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">출고 대기</p>
              <p className="text-2xl font-bold text-white">{requestsList.filter((r: any) => r.status === 'pending').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consumption Trend */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2">
              <BarChart3 className="text-blue-400" size={20} />
              자재 소비 추이 (최근 7일)
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={consumptionTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(value) => (value / 1000).toFixed(0) + 'K'}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={(value: number) => [value.toLocaleString(), '']}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{value === 'consumption' ? '소비량' : '목표'}</span>
                )}
              />
              <Line type="monotone" dataKey="consumption" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              <Line type="monotone" dataKey="target" stroke="#22c55e" strokeDasharray="5 5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Consumption by Type */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">자재 유형별 소비</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={consumptionByType}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {consumptionByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value}%`, '']}
              />
              <Legend
                verticalAlign="bottom"
                formatter={(value) => (
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-slate-700">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('consumption')}
              className={clsx(
                'px-4 py-3 text-sm font-medium transition-colors border-b-2',
                activeTab === 'consumption'
                  ? 'border-primary-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              )}
            >
              자재 소비 내역
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={clsx(
                'px-4 py-3 text-sm font-medium transition-colors border-b-2',
                activeTab === 'inventory'
                  ? 'border-primary-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              )}
            >
              재고 현황
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={clsx(
                'px-4 py-3 text-sm font-medium transition-colors border-b-2',
                activeTab === 'requests'
                  ? 'border-primary-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              )}
            >
              자재 요청
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Search */}
          {activeTab === 'inventory' && (
            <div className="mb-4">
              <div className="relative w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="자재 코드, 자재명 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          )}

          {/* Inventory Table */}
          {activeTab === 'inventory' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">자재코드</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">자재명</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">분류</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">현재고</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">안전재고</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase">재고상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item: any) => (
                    <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-sm font-mono text-white">{item.materialCode}</td>
                      <td className="py-3 px-4 text-sm text-slate-300">{item.materialName}</td>
                      <td className="py-3 px-4 text-sm text-slate-400">{item.category}</td>
                      <td className="py-3 px-4 text-sm text-right text-white font-medium">
                        {item.stock.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-slate-400">
                        {item.safetyStock.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={clsx(
                          'px-2 py-1 rounded text-xs font-medium',
                          item.status === 'low' && 'bg-red-500/20 text-red-400',
                          item.status === 'normal' && 'bg-green-500/20 text-green-400',
                          item.status === 'excess' && 'bg-yellow-500/20 text-yellow-400'
                        )}>
                          {item.status === 'low' ? '부족' : item.status === 'excess' ? '과잉' : '정상'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Material Requests Table */}
          {activeTab === 'requests' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">요청번호</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">라인</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">자재</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">요청수량</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">요청시간</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase">상태</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase">조치</th>
                  </tr>
                </thead>
                <tbody>
                  {requestsList.map((req: any) => (
                    <tr key={req.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-sm font-mono text-white">{req.id}</td>
                      <td className="py-3 px-4 text-sm text-slate-300">{req.lineCode}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-white">{req.materialName}</p>
                          <p className="text-xs text-slate-500">{req.materialCode}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-white font-medium">
                        {req.requestQty.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-400">{req.requestedAt}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={clsx(
                          'px-2 py-1 rounded text-xs font-medium',
                          req.status === 'pending' && 'bg-yellow-500/20 text-yellow-400',
                          req.status === 'in_progress' && 'bg-blue-500/20 text-blue-400',
                          req.status === 'completed' && 'bg-green-500/20 text-green-400'
                        )}>
                          {req.status === 'pending' ? '대기' : req.status === 'in_progress' ? '진행중' : '완료'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {req.status === 'pending' && (
                          <button className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded text-xs font-medium hover:bg-primary-500/30 transition-colors">
                            출고
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Feeder Status (shown in consumption tab) */}
          {activeTab === 'consumption' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">피더 현황</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {feederList.slice(0, 8).map((feeder: any) => (
                  <div
                    key={feeder.id}
                    className={clsx(
                      'p-4 rounded-lg border',
                      feeder.status === 'ok' && 'bg-green-500/10 border-green-500/30',
                      feeder.status === 'low' && 'bg-yellow-500/10 border-yellow-500/30',
                      feeder.status === 'empty' && 'bg-red-500/10 border-red-500/30'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{feeder.feederNo}</span>
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        feeder.status === 'ok' && 'bg-green-500/20 text-green-400',
                        feeder.status === 'low' && 'bg-yellow-500/20 text-yellow-400',
                        feeder.status === 'empty' && 'bg-red-500/20 text-red-400'
                      )}>
                        {feeder.status === 'ok' ? '정상' : feeder.status === 'low' ? '부족' : '비움'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-1">{feeder.lineCode} / Slot {feeder.slotNo}</p>
                    <p className="text-sm text-slate-300">{feeder.materialCode}</p>
                    <p className="text-lg font-bold text-white mt-1">{feeder.remainQty.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
