import { useState } from 'react';
import { Warehouse, Search, Plus, Filter, MapPin, Package, ArrowUpDown, Edit2, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Location {
  id: string;
  locationCode: string;
  locationName: string;
  type: 'rack' | 'floor' | 'staging';
  capacity: number;
  used: number;
  itemCount: number;
}

interface WarehouseData {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  type: 'raw' | 'wip' | 'finished' | 'spare';
  address: string;
  manager: string;
  phone: string;
  isActive: boolean;
  totalCapacity: number;
  usedCapacity: number;
  locationCount: number;
  locations: Location[];
}

const mockWarehouses: WarehouseData[] = [
  {
    id: '1',
    warehouseCode: 'WH-RAW01',
    warehouseName: '원자재 창고 A',
    type: 'raw',
    address: '경기도 수원시 영통구 월드컵로 123',
    manager: '김창고',
    phone: '031-123-4567',
    isActive: true,
    totalCapacity: 10000,
    usedCapacity: 7500,
    locationCount: 50,
    locations: [
      { id: 'L001', locationCode: 'A-01-01', locationName: 'A구역 1열 1단', type: 'rack', capacity: 200, used: 180, itemCount: 15 },
      { id: 'L002', locationCode: 'A-01-02', locationName: 'A구역 1열 2단', type: 'rack', capacity: 200, used: 150, itemCount: 12 },
      { id: 'L003', locationCode: 'A-02-01', locationName: 'A구역 2열 1단', type: 'rack', capacity: 200, used: 200, itemCount: 18 },
      { id: 'L004', locationCode: 'B-FLOOR', locationName: 'B구역 바닥', type: 'floor', capacity: 500, used: 350, itemCount: 5 },
    ],
  },
  {
    id: '2',
    warehouseCode: 'WH-WIP01',
    warehouseName: '재공품 창고',
    type: 'wip',
    address: '경기도 수원시 영통구 월드컵로 125',
    manager: '이재공',
    phone: '031-123-4568',
    isActive: true,
    totalCapacity: 5000,
    usedCapacity: 3200,
    locationCount: 30,
    locations: [
      { id: 'L005', locationCode: 'WIP-01', locationName: 'WIP 1구역', type: 'staging', capacity: 300, used: 250, itemCount: 20 },
      { id: 'L006', locationCode: 'WIP-02', locationName: 'WIP 2구역', type: 'staging', capacity: 300, used: 200, itemCount: 15 },
    ],
  },
  {
    id: '3',
    warehouseCode: 'WH-FIN01',
    warehouseName: '완제품 창고',
    type: 'finished',
    address: '경기도 수원시 영통구 월드컵로 127',
    manager: '박완제',
    phone: '031-123-4569',
    isActive: true,
    totalCapacity: 8000,
    usedCapacity: 4500,
    locationCount: 40,
    locations: [
      { id: 'L007', locationCode: 'F-01-01', locationName: '완제품 A-1', type: 'rack', capacity: 400, used: 300, itemCount: 8 },
      { id: 'L008', locationCode: 'F-01-02', locationName: '완제품 A-2', type: 'rack', capacity: 400, used: 280, itemCount: 6 },
    ],
  },
  {
    id: '4',
    warehouseCode: 'WH-SPR01',
    warehouseName: '예비부품 창고',
    type: 'spare',
    address: '경기도 수원시 영통구 월드컵로 129',
    manager: '최예비',
    phone: '031-123-4570',
    isActive: true,
    totalCapacity: 2000,
    usedCapacity: 1200,
    locationCount: 20,
    locations: [
      { id: 'L009', locationCode: 'S-01', locationName: '예비부품 1', type: 'rack', capacity: 100, used: 80, itemCount: 25 },
    ],
  },
];

const utilizationData = [
  { name: '원자재', capacity: 10000, used: 7500 },
  { name: '재공품', capacity: 5000, used: 3200 },
  { name: '완제품', capacity: 8000, used: 4500 },
  { name: '예비부품', capacity: 2000, used: 1200 },
];

export default function WarehousePage() {
  const [warehouses] = useState<WarehouseData[]>(mockWarehouses);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseData | null>(mockWarehouses[0]);

  const filteredWarehouses = warehouses.filter(wh => {
    const matchesSearch = wh.warehouseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wh.warehouseName.includes(searchTerm);
    const matchesType = filterType === 'all' || wh.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: WarehouseData['type']) => {
    switch (type) {
      case 'raw': return 'bg-blue-500/20 text-blue-400';
      case 'wip': return 'bg-yellow-500/20 text-yellow-400';
      case 'finished': return 'bg-green-500/20 text-green-400';
      case 'spare': return 'bg-purple-500/20 text-purple-400';
    }
  };

  const getTypeText = (type: WarehouseData['type']) => {
    switch (type) {
      case 'raw': return '원자재';
      case 'wip': return '재공품';
      case 'finished': return '완제품';
      case 'spare': return '예비부품';
    }
  };

  const getUtilizationColor = (used: number, capacity: number) => {
    const rate = (used / capacity) * 100;
    if (rate >= 90) return 'text-red-400';
    if (rate >= 70) return 'text-yellow-400';
    return 'text-green-400';
  };

  const stats = {
    totalWarehouses: warehouses.length,
    activeWarehouses: warehouses.filter(w => w.isActive).length,
    totalCapacity: warehouses.reduce((sum, w) => sum + w.totalCapacity, 0),
    totalUsed: warehouses.reduce((sum, w) => sum + w.usedCapacity, 0),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">창고 관리</h1>
          <p className="text-slate-400 text-sm mt-1">창고 및 로케이션 마스터 관리</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          창고 등록
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Warehouse className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">전체 창고</p>
              <p className="text-2xl font-bold text-white">{stats.totalWarehouses}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Package className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">운영중</p>
              <p className="text-2xl font-bold text-green-400">{stats.activeWarehouses}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-700 rounded-lg">
              <ArrowUpDown className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">총 용량</p>
              <p className="text-2xl font-bold text-white">{stats.totalCapacity.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Package className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">사용률</p>
              <p className="text-2xl font-bold text-yellow-400">
                {((stats.totalUsed / stats.totalCapacity) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="창고 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="all">전체 유형</option>
                <option value="raw">원자재</option>
                <option value="wip">재공품</option>
                <option value="finished">완제품</option>
                <option value="spare">예비부품</option>
              </select>
            </div>

            <div className="space-y-2">
              {filteredWarehouses.map((wh) => (
                <div
                  key={wh.id}
                  onClick={() => setSelectedWarehouse(wh)}
                  className={`p-3 rounded-lg cursor-pointer ${selectedWarehouse?.id === wh.id ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium text-sm">{wh.warehouseCode}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(wh.type)}`}>
                      {getTypeText(wh.type)}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">{wh.warehouseName}</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">사용률</span>
                      <span className={getUtilizationColor(wh.usedCapacity, wh.totalCapacity)}>
                        {((wh.usedCapacity / wh.totalCapacity) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          (wh.usedCapacity / wh.totalCapacity) >= 0.9 ? 'bg-red-400' :
                          (wh.usedCapacity / wh.totalCapacity) >= 0.7 ? 'bg-yellow-400' : 'bg-green-400'
                        }`}
                        style={{ width: `${(wh.usedCapacity / wh.totalCapacity) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h3 className="text-white font-bold mb-4">창고별 현황</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilizationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={60} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Bar dataKey="used" fill="#3b82f6" name="사용량" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-4">
          {selectedWarehouse && (
            <>
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">{selectedWarehouse.warehouseName}</h3>
                    <p className="text-slate-400 text-sm">{selectedWarehouse.warehouseCode}</p>
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

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400 text-sm">주소</span>
                    </div>
                    <p className="text-white text-sm">{selectedWarehouse.address}</p>
                  </div>
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-slate-400 text-sm mb-2">담당자 / 연락처</p>
                    <p className="text-white text-sm">{selectedWarehouse.manager} / {selectedWarehouse.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-center">
                    <p className="text-slate-400 text-xs">총 용량</p>
                    <p className="text-white font-bold text-lg">{selectedWarehouse.totalCapacity.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-xs">사용량</p>
                    <p className="text-blue-400 font-bold text-lg">{selectedWarehouse.usedCapacity.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-xs">로케이션 수</p>
                    <p className="text-green-400 font-bold text-lg">{selectedWarehouse.locationCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold">로케이션 목록</h3>
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-sm">
                    <Plus className="w-4 h-4" />
                    로케이션 추가
                  </button>
                </div>

                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">로케이션</th>
                      <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">유형</th>
                      <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">용량</th>
                      <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">사용량</th>
                      <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">품목수</th>
                      <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">사용률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {selectedWarehouse.locations.map((loc) => (
                      <tr key={loc.id} className="hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                          <p className="text-white font-mono text-sm">{loc.locationCode}</p>
                          <p className="text-slate-500 text-xs">{loc.locationName}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-slate-700 rounded text-slate-300 text-xs">
                            {loc.type === 'rack' ? '랙' : loc.type === 'floor' ? '바닥' : '스테이징'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-300 text-sm">{loc.capacity}</td>
                        <td className="px-4 py-3 text-center text-blue-400 text-sm">{loc.used}</td>
                        <td className="px-4 py-3 text-center text-slate-300 text-sm">{loc.itemCount}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-medium ${getUtilizationColor(loc.used, loc.capacity)}`}>
                            {((loc.used / loc.capacity) * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
