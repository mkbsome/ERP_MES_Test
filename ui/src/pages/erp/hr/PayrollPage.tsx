import { useState } from 'react';
import { Wallet, Search, Filter, Calendar, Download, ChevronLeft, ChevronRight, Calculator, TrendingUp, Users } from 'lucide-react';

interface PayrollRecord {
  id: string;
  payrollNo: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  positionName: string;
  payYear: number;
  payMonth: number;
  baseSalary: number;
  overtimePay: number;
  bonus: number;
  allowances: number;
  grossPay: number;
  incomeTax: number;
  socialInsurance: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  paymentDate: string | null;
  status: 'draft' | 'approved' | 'paid';
}

const statusLabels: Record<string, string> = {
  draft: '작성중',
  approved: '승인완료',
  paid: '지급완료',
};

const mockPayroll: PayrollRecord[] = [
  {
    id: '1',
    payrollNo: 'PAY-2024-01-001',
    employeeId: 'EMP-010',
    employeeName: '박인사',
    departmentName: '인사팀',
    positionName: '부장',
    payYear: 2024,
    payMonth: 1,
    baseSalary: 7083333,
    overtimePay: 520000,
    bonus: 0,
    allowances: 300000,
    grossPay: 7903333,
    incomeTax: 632267,
    socialInsurance: 710400,
    otherDeductions: 50000,
    totalDeductions: 1392667,
    netPay: 6510666,
    paymentDate: '2024-01-25',
    status: 'paid',
  },
  {
    id: '2',
    payrollNo: 'PAY-2024-01-002',
    employeeId: 'EMP-020',
    employeeName: '최재무',
    departmentName: '재무팀',
    positionName: '부장',
    payYear: 2024,
    payMonth: 1,
    baseSalary: 7333333,
    overtimePay: 380000,
    bonus: 0,
    allowances: 300000,
    grossPay: 8013333,
    incomeTax: 641067,
    socialInsurance: 721200,
    otherDeductions: 50000,
    totalDeductions: 1412267,
    netPay: 6601066,
    paymentDate: '2024-01-25',
    status: 'paid',
  },
  {
    id: '3',
    payrollNo: 'PAY-2024-01-003',
    employeeId: 'EMP-110',
    employeeName: '이에스엠티',
    departmentName: 'SMT팀',
    positionName: '차장',
    payYear: 2024,
    payMonth: 1,
    baseSalary: 5666667,
    overtimePay: 850000,
    bonus: 0,
    allowances: 250000,
    grossPay: 6766667,
    incomeTax: 474667,
    socialInsurance: 609000,
    otherDeductions: 30000,
    totalDeductions: 1113667,
    netPay: 5653000,
    paymentDate: '2024-01-25',
    status: 'paid',
  },
  {
    id: '4',
    payrollNo: 'PAY-2024-01-004',
    employeeId: 'EMP-120',
    employeeName: '박조립',
    departmentName: '조립팀',
    positionName: '차장',
    payYear: 2024,
    payMonth: 1,
    baseSalary: 5416667,
    overtimePay: 1200000,
    bonus: 0,
    allowances: 250000,
    grossPay: 6866667,
    incomeTax: 481667,
    socialInsurance: 618000,
    otherDeductions: 30000,
    totalDeductions: 1129667,
    netPay: 5737000,
    paymentDate: '2024-01-25',
    status: 'paid',
  },
  {
    id: '5',
    payrollNo: 'PAY-2024-01-005',
    employeeId: 'EMP-201',
    employeeName: '정영업',
    departmentName: '국내영업팀',
    positionName: '과장',
    payYear: 2024,
    payMonth: 1,
    baseSalary: 4333333,
    overtimePay: 450000,
    bonus: 500000,
    allowances: 200000,
    grossPay: 5483333,
    incomeTax: 384833,
    socialInsurance: 493500,
    otherDeductions: 20000,
    totalDeductions: 898333,
    netPay: 4585000,
    paymentDate: '2024-01-25',
    status: 'paid',
  },
  {
    id: '6',
    payrollNo: 'PAY-2024-01-006',
    employeeId: 'EMP-301',
    employeeName: '한연구',
    departmentName: '연구소',
    positionName: '대리',
    payYear: 2024,
    payMonth: 1,
    baseSalary: 3500000,
    overtimePay: 620000,
    bonus: 0,
    allowances: 150000,
    grossPay: 4270000,
    incomeTax: 298900,
    socialInsurance: 384300,
    otherDeductions: 10000,
    totalDeductions: 693200,
    netPay: 3576800,
    paymentDate: '2024-01-25',
    status: 'paid',
  },
  {
    id: '7',
    payrollNo: 'PAY-2024-01-007',
    employeeId: 'EMP-401',
    employeeName: '김신입',
    departmentName: 'SMT팀',
    positionName: '사원',
    payYear: 2024,
    payMonth: 1,
    baseSalary: 2916667,
    overtimePay: 350000,
    bonus: 0,
    allowances: 100000,
    grossPay: 3366667,
    incomeTax: 235667,
    socialInsurance: 303000,
    otherDeductions: 0,
    totalDeductions: 538667,
    netPay: 2828000,
    paymentDate: '2024-01-25',
    status: 'paid',
  },
  {
    id: '8',
    payrollNo: 'PAY-2024-01-008',
    employeeId: 'EMP-501',
    employeeName: '이인턴',
    departmentName: '연구소',
    positionName: '인턴',
    payYear: 2024,
    payMonth: 1,
    baseSalary: 2250000,
    overtimePay: 150000,
    bonus: 0,
    allowances: 50000,
    grossPay: 2450000,
    incomeTax: 171500,
    socialInsurance: 220500,
    otherDeductions: 0,
    totalDeductions: 392000,
    netPay: 2058000,
    paymentDate: '2024-01-25',
    status: 'paid',
  },
];

export default function PayrollPage() {
  const [currentYear, setCurrentYear] = useState(2024);
  const [currentMonth, setCurrentMonth] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);

  const filteredRecords = mockPayroll.filter(record => {
    const matchesSearch =
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalGrossPay = filteredRecords.reduce((sum, r) => sum + r.grossPay, 0);
  const totalNetPay = filteredRecords.reduce((sum, r) => sum + r.netPay, 0);
  const totalDeductions = filteredRecords.reduce((sum, r) => sum + r.totalDeductions, 0);
  const avgNetPay = totalNetPay / filteredRecords.length;

  const goToPrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-500/20 text-yellow-400';
      case 'approved': return 'bg-blue-500/20 text-blue-400';
      case 'paid': return 'bg-green-500/20 text-green-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString() + '원';
  };

  const formatShortCurrency = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`;
    } else if (value >= 10000000) {
      return `${(value / 10000000).toFixed(1)}천만`;
    } else if (value >= 10000) {
      return `${Math.round(value / 10000)}만`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">급여관리</h1>
          <p className="text-slate-400">월급 계산 및 지급 관리</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            급여대장 출력
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Calculator className="w-4 h-4" />
            급여 계산
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <h3 className="text-white font-medium text-lg min-w-[120px] text-center">
            {currentYear}년 {currentMonth}월
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">지급 대상</p>
              <p className="text-xl font-bold text-white">{filteredRecords.length}명</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Wallet className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">총 지급액</p>
              <p className="text-xl font-bold text-white">{formatShortCurrency(totalGrossPay)}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">총 공제액</p>
              <p className="text-xl font-bold text-white">{formatShortCurrency(totalDeductions)}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Calculator className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">평균 실수령액</p>
              <p className="text-xl font-bold text-white">{formatShortCurrency(avgNetPay)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="사번, 이름 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">전체 상태</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors">
          <Filter className="w-4 h-4" />
          필터
        </button>
      </div>

      {/* Payroll List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">사번</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">이름</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">부서</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">기본급</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">수당</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">총 지급액</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">공제액</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">실수령액</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-slate-700/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedRecord(record)}
                >
                  <td className="px-4 py-3">
                    <span className="text-blue-400 font-mono text-sm">{record.employeeId}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">{record.employeeName}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{record.departmentName}</td>
                  <td className="px-4 py-3 text-right text-white">
                    {record.baseSalary.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-cyan-400">
                    +{(record.overtimePay + record.bonus + record.allowances).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium">
                    {record.grossPay.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-red-400">
                    -{record.totalDeductions.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-green-400 font-bold">
                    {record.netPay.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStatusColor(record.status)}`}>
                      {statusLabels[record.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-700/30">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right text-white font-medium">합계</td>
                <td className="px-4 py-3 text-right text-white font-medium">
                  {filteredRecords.reduce((sum, r) => sum + r.baseSalary, 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-cyan-400 font-medium">
                  +{filteredRecords.reduce((sum, r) => sum + r.overtimePay + r.bonus + r.allowances, 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-white font-bold">
                  {totalGrossPay.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-red-400 font-medium">
                  -{totalDeductions.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-green-400 font-bold">
                  {totalNetPay.toLocaleString()}
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payroll Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">급여 상세</h2>
                  <p className="text-slate-400">{selectedRecord.payrollNo}</p>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* 직원 정보 */}
              <div className="flex items-center gap-4 pb-4 border-b border-slate-700">
                <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center text-white text-lg font-medium">
                  {selectedRecord.employeeName.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-medium">{selectedRecord.employeeName}</p>
                  <p className="text-slate-400 text-sm">{selectedRecord.departmentName} · {selectedRecord.positionName}</p>
                </div>
                <div className="ml-auto">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStatusColor(selectedRecord.status)}`}>
                    {statusLabels[selectedRecord.status]}
                  </span>
                </div>
              </div>

              {/* 지급 항목 */}
              <div>
                <h3 className="text-white font-medium mb-3">지급 항목</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">기본급</span>
                    <span className="text-white">{formatCurrency(selectedRecord.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">시간외수당</span>
                    <span className="text-cyan-400">+{formatCurrency(selectedRecord.overtimePay)}</span>
                  </div>
                  {selectedRecord.bonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">상여금</span>
                      <span className="text-cyan-400">+{formatCurrency(selectedRecord.bonus)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">기타수당</span>
                    <span className="text-cyan-400">+{formatCurrency(selectedRecord.allowances)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-700">
                    <span className="text-white font-medium">총 지급액</span>
                    <span className="text-white font-bold">{formatCurrency(selectedRecord.grossPay)}</span>
                  </div>
                </div>
              </div>

              {/* 공제 항목 */}
              <div>
                <h3 className="text-white font-medium mb-3">공제 항목</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">소득세</span>
                    <span className="text-red-400">-{formatCurrency(selectedRecord.incomeTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">4대보험</span>
                    <span className="text-red-400">-{formatCurrency(selectedRecord.socialInsurance)}</span>
                  </div>
                  {selectedRecord.otherDeductions > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">기타공제</span>
                      <span className="text-red-400">-{formatCurrency(selectedRecord.otherDeductions)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-700">
                    <span className="text-white font-medium">총 공제액</span>
                    <span className="text-red-400 font-bold">-{formatCurrency(selectedRecord.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* 실수령액 */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg text-white font-medium">실수령액</span>
                  <span className="text-2xl text-green-400 font-bold">{formatCurrency(selectedRecord.netPay)}</span>
                </div>
                {selectedRecord.paymentDate && (
                  <p className="text-slate-400 text-sm mt-2">
                    지급일: {selectedRecord.paymentDate}
                  </p>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                닫기
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                명세서 출력
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
