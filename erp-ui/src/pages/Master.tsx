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
  Package,
  Users,
  Building2,
  Warehouse,
} from 'lucide-react';
import clsx from 'clsx';

type TabType = 'items' | 'customers' | 'vendors' | 'warehouses';

// Mock data
const items = [
  {
    itemCode: 'SMT-MB-001',
    itemName: '스마트폰 메인보드 A형',
    category: '완제품',
    unit: 'EA',
    unitPrice: 45000,
    safetyStock: 500,
    leadTime: 5,
    status: 'active',
  },
  {
    itemCode: 'IC-STM32F4',
    itemName: 'STM32F407VGT6 MCU',
    category: '원자재',
    unit: 'EA',
    unitPrice: 15000,
    safetyStock: 1000,
    leadTime: 14,
    status: 'active',
  },
  {
    itemCode: 'CAP-0603-10UF',
    itemName: '적층세라믹콘덴서 10μF',
    category: '원자재',
    unit: 'EA',
    unitPrice: 25,
    safetyStock: 50000,
    leadTime: 7,
    status: 'active',
  },
  {
    itemCode: 'PCB-MAIN-V3',
    itemName: '메인보드 PCB V3.0',
    category: '반제품',
    unit: 'EA',
    unitPrice: 8500,
    safetyStock: 500,
    leadTime: 10,
    status: 'active',
  },
  {
    itemCode: 'CON-USB-C',
    itemName: 'USB Type-C 커넥터',
    category: '원자재',
    unit: 'EA',
    unitPrice: 350,
    safetyStock: 30000,
    leadTime: 7,
    status: 'inactive',
  },
];

const customers = [
  {
    code: 'CUS-001',
    name: '삼성전자',
    type: '대기업',
    contact: '김영수',
    phone: '02-1234-5678',
    email: 'ys.kim@samsung.com',
    address: '경기도 수원시 영통구',
    creditLimit: 5000000000,
    status: 'active',
  },
  {
    code: 'CUS-002',
    name: 'LG이노텍',
    type: '대기업',
    contact: '박철민',
    phone: '02-2345-6789',
    email: 'cm.park@lginnotek.com',
    address: '서울시 강서구',
    creditLimit: 3000000000,
    status: 'active',
  },
  {
    code: 'CUS-003',
    name: '현대모비스',
    type: '대기업',
    contact: '이정호',
    phone: '02-3456-7890',
    email: 'jh.lee@mobis.com',
    address: '경기도 용인시',
    creditLimit: 4000000000,
    status: 'active',
  },
];

const vendors = [
  {
    code: 'VEN-001',
    name: '삼성SDI',
    type: '대기업',
    contact: '최민수',
    phone: '031-123-4567',
    email: 'ms.choi@samsungsdi.com',
    address: '경기도 수원시',
    paymentTerms: '월말 60일',
    status: 'active',
  },
  {
    code: 'VEN-002',
    name: '대덕전자',
    type: '중견기업',
    contact: '김태현',
    phone: '042-234-5678',
    email: 'th.kim@daeduck.com',
    address: '대전광역시 유성구',
    paymentTerms: '월말 30일',
    status: 'active',
  },
  {
    code: 'VEN-003',
    name: 'TDK Korea',
    type: '외국계',
    contact: 'John Park',
    phone: '02-345-6789',
    email: 'john.park@tdk.com',
    address: '서울시 강남구',
    paymentTerms: '선급금',
    status: 'active',
  },
];

const warehouses = [
  {
    code: 'WH-A01',
    name: 'A동 원자재 창고',
    type: '원자재',
    location: '본사 A동 1층',
    manager: '박창고',
    capacity: 10000,
    currentUsage: 7500,
    status: 'active',
  },
  {
    code: 'WH-B01',
    name: 'B동 반제품 창고',
    type: '반제품',
    location: '본사 B동 2층',
    manager: '이창고',
    capacity: 5000,
    currentUsage: 3200,
    status: 'active',
  },
  {
    code: 'WH-C01',
    name: 'C동 완제품 창고',
    type: '완제품',
    location: '본사 C동 1층',
    manager: '김창고',
    capacity: 8000,
    currentUsage: 6100,
    status: 'active',
  },
];

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: '활성', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  inactive: { label: '비활성', color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
};

export default function Master() {
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'items', name: '품목 마스터', icon: Package, count: items.length },
    { id: 'customers', name: '고객 마스터', icon: Users, count: customers.length },
    { id: 'vendors', name: '공급업체 마스터', icon: Building2, count: vendors.length },
    { id: 'warehouses', name: '창고 마스터', icon: Warehouse, count: warehouses.length },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={clsx(
              'card cursor-pointer transition-all',
              activeTab === tab.id && 'ring-2 ring-primary-500'
            )}
            onClick={() => setActiveTab(tab.id as TabType)}
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                'p-3 rounded-lg',
                activeTab === tab.id ? 'bg-primary-500/20' : 'bg-slate-700'
              )}>
                <tab.icon size={20} className={activeTab === tab.id ? 'text-primary-400' : 'text-slate-400'} />
              </div>
              <div>
                <p className="text-sm text-slate-400">{tab.name}</p>
                <p className="text-xl font-bold text-white">{tab.count}건</p>
              </div>
            </div>
          </div>
        ))}
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

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="품목코드, 품목명 검색..."
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
                품목 등록
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">품목코드</th>
                  <th className="text-left px-4 py-3">품목명</th>
                  <th className="text-center px-4 py-3">분류</th>
                  <th className="text-center px-4 py-3">단위</th>
                  <th className="text-right px-4 py-3">단가</th>
                  <th className="text-right px-4 py-3">안전재고</th>
                  <th className="text-center px-4 py-3">L/T(일)</th>
                  <th className="text-center px-4 py-3">상태</th>
                  <th className="text-center px-4 py-3">액션</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.itemCode} className="table-row">
                    <td className="table-cell font-medium text-primary-400">{item.itemCode}</td>
                    <td className="table-cell text-slate-200">{item.itemName}</td>
                    <td className="table-cell text-center">
                      <span className={clsx(
                        'px-2 py-1 rounded text-xs',
                        item.category === '완제품' && 'bg-purple-500/20 text-purple-400',
                        item.category === '반제품' && 'bg-blue-500/20 text-blue-400',
                        item.category === '원자재' && 'bg-green-500/20 text-green-400'
                      )}>
                        {item.category}
                      </span>
                    </td>
                    <td className="table-cell text-center text-slate-300">{item.unit}</td>
                    <td className="table-cell text-right text-slate-200">₩{item.unitPrice.toLocaleString()}</td>
                    <td className="table-cell text-right text-slate-300">{item.safetyStock.toLocaleString()}</td>
                    <td className="table-cell text-center text-slate-300">{item.leadTime}</td>
                    <td className="table-cell text-center">
                      <span className={clsx(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        statusConfig[item.status].bgColor,
                        statusConfig[item.status].color
                      )}>
                        {statusConfig[item.status].label}
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
                        <button className="p-1.5 hover:bg-slate-600 rounded text-slate-400 hover:text-red-400">
                          <Trash2 size={16} />
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

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="고객코드, 고객명 검색..."
                className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg text-sm text-white hover:bg-primary-700">
              <Plus size={16} />
              고객 등록
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">고객코드</th>
                  <th className="text-left px-4 py-3">고객명</th>
                  <th className="text-center px-4 py-3">유형</th>
                  <th className="text-left px-4 py-3">담당자</th>
                  <th className="text-left px-4 py-3">연락처</th>
                  <th className="text-right px-4 py-3">여신한도</th>
                  <th className="text-center px-4 py-3">상태</th>
                  <th className="text-center px-4 py-3">액션</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.code} className="table-row">
                    <td className="table-cell font-medium text-primary-400">{customer.code}</td>
                    <td className="table-cell text-slate-200">{customer.name}</td>
                    <td className="table-cell text-center text-slate-300">{customer.type}</td>
                    <td className="table-cell text-slate-300">{customer.contact}</td>
                    <td className="table-cell text-slate-300">{customer.phone}</td>
                    <td className="table-cell text-right text-slate-200">₩{(customer.creditLimit / 100000000).toFixed(0)}억</td>
                    <td className="table-cell text-center">
                      <span className={clsx(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        statusConfig[customer.status].bgColor,
                        statusConfig[customer.status].color
                      )}>
                        {statusConfig[customer.status].label}
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

      {/* Vendors Tab */}
      {activeTab === 'vendors' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="업체코드, 업체명 검색..."
                className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg text-sm text-white hover:bg-primary-700">
              <Plus size={16} />
              업체 등록
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">업체코드</th>
                  <th className="text-left px-4 py-3">업체명</th>
                  <th className="text-center px-4 py-3">유형</th>
                  <th className="text-left px-4 py-3">담당자</th>
                  <th className="text-left px-4 py-3">연락처</th>
                  <th className="text-center px-4 py-3">결제조건</th>
                  <th className="text-center px-4 py-3">상태</th>
                  <th className="text-center px-4 py-3">액션</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.code} className="table-row">
                    <td className="table-cell font-medium text-primary-400">{vendor.code}</td>
                    <td className="table-cell text-slate-200">{vendor.name}</td>
                    <td className="table-cell text-center text-slate-300">{vendor.type}</td>
                    <td className="table-cell text-slate-300">{vendor.contact}</td>
                    <td className="table-cell text-slate-300">{vendor.phone}</td>
                    <td className="table-cell text-center text-slate-300">{vendor.paymentTerms}</td>
                    <td className="table-cell text-center">
                      <span className={clsx(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        statusConfig[vendor.status].bgColor,
                        statusConfig[vendor.status].color
                      )}>
                        {statusConfig[vendor.status].label}
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

      {/* Warehouses Tab */}
      {activeTab === 'warehouses' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="창고코드, 창고명 검색..."
                className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg text-sm text-white hover:bg-primary-700">
              <Plus size={16} />
              창고 등록
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {warehouses.map((wh) => (
              <div key={wh.code} className="p-4 bg-slate-700/30 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Warehouse size={20} className="text-primary-400" />
                    <span className="font-medium text-slate-200">{wh.name}</span>
                  </div>
                  <span className={clsx(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    statusConfig[wh.status].bgColor,
                    statusConfig[wh.status].color
                  )}>
                    {statusConfig[wh.status].label}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">코드</span>
                    <span className="text-slate-300">{wh.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">유형</span>
                    <span className="text-slate-300">{wh.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">위치</span>
                    <span className="text-slate-300">{wh.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">관리자</span>
                    <span className="text-slate-300">{wh.manager}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">사용량</span>
                    <span className="text-slate-300">{wh.currentUsage.toLocaleString()} / {wh.capacity.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full',
                        (wh.currentUsage / wh.capacity) > 0.9 ? 'bg-red-500' :
                        (wh.currentUsage / wh.capacity) > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                      )}
                      style={{ width: `${(wh.currentUsage / wh.capacity) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 text-right">
                    {((wh.currentUsage / wh.capacity) * 100).toFixed(0)}% 사용중
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
