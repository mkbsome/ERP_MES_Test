import { useState } from 'react';
import { Building, Search, Plus, Edit2, Trash2, Phone, Mail, MapPin, Filter } from 'lucide-react';

interface Customer {
  id: string;
  customerCode: string;
  customerName: string;
  customerType: 'domestic' | 'overseas';
  businessNo: string;
  ceoName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  useYn: boolean;
  createdAt: string;
}

const mockCustomers: Customer[] = [
  { id: '1', customerCode: 'C-001', customerName: '삼성전자(주)', customerType: 'domestic', businessNo: '124-81-00998', ceoName: '이재용', contactName: '김담당', phone: '02-2255-0114', email: 'contact@samsung.com', address: '경기도 수원시 영통구 삼성로 129', useYn: true, createdAt: '2023-01-15' },
  { id: '2', customerCode: 'C-002', customerName: 'LG전자(주)', customerType: 'domestic', businessNo: '107-86-14075', ceoName: '조주완', contactName: '박담당', phone: '02-3777-1114', email: 'contact@lge.com', address: '서울시 영등포구 여의대로 128', useYn: true, createdAt: '2023-02-20' },
  { id: '3', customerCode: 'C-003', customerName: 'SK하이닉스(주)', customerType: 'domestic', businessNo: '234-81-03200', ceoName: '곽노정', contactName: '이담당', phone: '031-5185-4114', email: 'contact@skhynix.com', address: '경기도 이천시 부발읍 경충대로 2091', useYn: true, createdAt: '2023-03-10' },
  { id: '4', customerCode: 'C-004', customerName: 'Apple Inc.', customerType: 'overseas', businessNo: 'US-12345678', ceoName: 'Tim Cook', contactName: 'John Manager', phone: '+1-408-996-1010', email: 'supplier@apple.com', address: 'One Apple Park Way, Cupertino, CA 95014, USA', useYn: true, createdAt: '2023-04-05' },
  { id: '5', customerCode: 'C-005', customerName: 'Sony Corporation', customerType: 'overseas', businessNo: 'JP-87654321', ceoName: 'Kenichiro Yoshida', contactName: 'Tanaka San', phone: '+81-3-6748-2111', email: 'procurement@sony.co.jp', address: '1-7-1 Konan, Minato-ku, Tokyo 108-0075, Japan', useYn: true, createdAt: '2023-05-15' },
  { id: '6', customerCode: 'C-006', customerName: '현대모비스(주)', customerType: 'domestic', businessNo: '106-81-23486', ceoName: '정의선', contactName: '최담당', phone: '02-2018-5114', email: 'contact@mobis.co.kr', address: '서울시 강남구 테헤란로 203', useYn: false, createdAt: '2023-06-01' },
];

export default function CustomerMasterPage() {
  const [customers] = useState<Customer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.customerName.includes(searchTerm) || c.customerCode.includes(searchTerm);
    const matchesType = filterType === 'all' || c.customerType === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: customers.length,
    domestic: customers.filter(c => c.customerType === 'domestic').length,
    overseas: customers.filter(c => c.customerType === 'overseas').length,
    active: customers.filter(c => c.useYn).length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">고객사관리</h1>
          <p className="text-slate-400 text-sm mt-1">거래처 및 고객사 정보 관리</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          고객사 등록
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">전체</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">국내</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.domestic}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">해외</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats.overseas}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">활성</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.active}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="고객사명, 코드로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
          />
        </div>
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">전체</option>
          <option value="domestic">국내</option>
          <option value="overseas">해외</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-slate-800 rounded-xl border border-slate-700">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">코드</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">고객사명</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">구분</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">담당자</th>
                <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`hover:bg-slate-700/30 cursor-pointer ${selectedCustomer?.id === customer.id ? 'bg-slate-700/50' : ''}`}
                >
                  <td className="px-4 py-3 text-white font-mono text-sm">{customer.customerCode}</td>
                  <td className="px-4 py-3 text-white">{customer.customerName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${customer.customerType === 'domestic' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                      {customer.customerType === 'domestic' ? '국내' : '해외'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{customer.contactName}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${customer.useYn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {customer.useYn ? '활성' : '비활성'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-span-1">
          {selectedCustomer ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">고객사 상세</h3>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded"><Edit2 className="w-4 h-4" /></button>
                  <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-xs">고객코드</p>
                  <p className="text-white font-mono">{selectedCustomer.customerCode}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">고객사명</p>
                  <p className="text-white">{selectedCustomer.customerName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">사업자번호</p>
                  <p className="text-white">{selectedCustomer.businessNo}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">대표자</p>
                  <p className="text-white">{selectedCustomer.ceoName}</p>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-700/30 rounded-lg">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-slate-400 text-xs">연락처</p>
                    <p className="text-white text-sm">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-700/30 rounded-lg">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-slate-400 text-xs">이메일</p>
                    <p className="text-white text-sm">{selectedCustomer.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-slate-700/30 rounded-lg">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-xs">주소</p>
                    <p className="text-white text-sm">{selectedCustomer.address}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <Building className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">고객사를 선택하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
