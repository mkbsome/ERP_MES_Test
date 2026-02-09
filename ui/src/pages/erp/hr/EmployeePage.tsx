import { useState } from 'react';
import { Users, Search, Plus, Edit2, Trash2, Filter, Mail, Phone, Calendar, Building2, Award } from 'lucide-react';

interface Employee {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentCode: string;
  departmentName: string;
  positionCode: string;
  positionName: string;
  hireDate: string;
  resignDate: string | null;
  email: string;
  phone: string;
  birthDate: string;
  gender: 'M' | 'F';
  address: string;
  baseSalary: number;
  employmentType: 'regular' | 'contract' | 'part_time' | 'intern';
  status: 'active' | 'leave' | 'resigned';
}

const employmentTypeLabels: Record<string, string> = {
  regular: '정규직',
  contract: '계약직',
  part_time: '파트타임',
  intern: '인턴',
};

const statusLabels: Record<string, string> = {
  active: '재직',
  leave: '휴직',
  resigned: '퇴사',
};

const mockEmployees: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP-001',
    employeeName: '김대표',
    departmentCode: 'DEPT-CEO',
    departmentName: '대표이사',
    positionCode: 'POS-CEO',
    positionName: '대표이사',
    hireDate: '2010-03-01',
    resignDate: null,
    email: 'ceo@company.com',
    phone: '010-1234-5678',
    birthDate: '1970-05-15',
    gender: 'M',
    address: '서울시 강남구 테헤란로 123',
    baseSalary: 300000000,
    employmentType: 'regular',
    status: 'active',
  },
  {
    id: '2',
    employeeId: 'EMP-010',
    employeeName: '박인사',
    departmentCode: 'DEPT-HR',
    departmentName: '인사팀',
    positionCode: 'POS-MGR',
    positionName: '부장',
    hireDate: '2015-04-01',
    resignDate: null,
    email: 'hr.park@company.com',
    phone: '010-2345-6789',
    birthDate: '1980-08-20',
    gender: 'M',
    address: '서울시 서초구 반포대로 456',
    baseSalary: 85000000,
    employmentType: 'regular',
    status: 'active',
  },
  {
    id: '3',
    employeeId: 'EMP-020',
    employeeName: '최재무',
    departmentCode: 'DEPT-FIN',
    departmentName: '재무팀',
    positionCode: 'POS-MGR',
    positionName: '부장',
    hireDate: '2014-09-15',
    resignDate: null,
    email: 'fin.choi@company.com',
    phone: '010-3456-7890',
    birthDate: '1978-12-10',
    gender: 'M',
    address: '경기도 성남시 분당구 판교로 789',
    baseSalary: 88000000,
    employmentType: 'regular',
    status: 'active',
  },
  {
    id: '4',
    employeeId: 'EMP-110',
    employeeName: '이에스엠티',
    departmentCode: 'DEPT-PROD-SMT',
    departmentName: 'SMT팀',
    positionCode: 'POS-SM',
    positionName: '차장',
    hireDate: '2017-02-20',
    resignDate: null,
    email: 'smt.lee@company.com',
    phone: '010-4567-8901',
    birthDate: '1985-03-25',
    gender: 'M',
    address: '경기도 화성시 동탄대로 321',
    baseSalary: 68000000,
    employmentType: 'regular',
    status: 'active',
  },
  {
    id: '5',
    employeeId: 'EMP-120',
    employeeName: '박조립',
    departmentCode: 'DEPT-PROD-ASSY',
    departmentName: '조립팀',
    positionCode: 'POS-SM',
    positionName: '차장',
    hireDate: '2016-07-10',
    resignDate: null,
    email: 'assy.park@company.com',
    phone: '010-5678-9012',
    birthDate: '1983-11-30',
    gender: 'F',
    address: '경기도 수원시 영통구 광교로 654',
    baseSalary: 65000000,
    employmentType: 'regular',
    status: 'active',
  },
  {
    id: '6',
    employeeId: 'EMP-201',
    employeeName: '정영업',
    departmentCode: 'DEPT-SALES-DOM',
    departmentName: '국내영업팀',
    positionCode: 'POS-ASM',
    positionName: '과장',
    hireDate: '2019-03-04',
    resignDate: null,
    email: 'sales.jung@company.com',
    phone: '010-6789-0123',
    birthDate: '1990-06-18',
    gender: 'M',
    address: '서울시 송파구 올림픽로 987',
    baseSalary: 52000000,
    employmentType: 'regular',
    status: 'active',
  },
  {
    id: '7',
    employeeId: 'EMP-301',
    employeeName: '한연구',
    departmentCode: 'DEPT-RND',
    departmentName: '연구소',
    positionCode: 'POS-SR',
    positionName: '대리',
    hireDate: '2021-01-11',
    resignDate: null,
    email: 'rnd.han@company.com',
    phone: '010-7890-1234',
    birthDate: '1992-09-05',
    gender: 'F',
    address: '서울시 강서구 공항대로 111',
    baseSalary: 42000000,
    employmentType: 'regular',
    status: 'active',
  },
  {
    id: '8',
    employeeId: 'EMP-401',
    employeeName: '김신입',
    departmentCode: 'DEPT-PROD-SMT',
    departmentName: 'SMT팀',
    positionCode: 'POS-JR',
    positionName: '사원',
    hireDate: '2024-01-02',
    resignDate: null,
    email: 'new.kim@company.com',
    phone: '010-8901-2345',
    birthDate: '1998-04-22',
    gender: 'M',
    address: '경기도 용인시 기흥구 동백로 222',
    baseSalary: 35000000,
    employmentType: 'regular',
    status: 'active',
  },
  {
    id: '9',
    employeeId: 'EMP-501',
    employeeName: '이인턴',
    departmentCode: 'DEPT-RND',
    departmentName: '연구소',
    positionCode: 'POS-INT',
    positionName: '인턴',
    hireDate: '2024-03-01',
    resignDate: null,
    email: 'intern.lee@company.com',
    phone: '010-9012-3456',
    birthDate: '2000-07-14',
    gender: 'F',
    address: '서울시 관악구 관악로 333',
    baseSalary: 27000000,
    employmentType: 'intern',
    status: 'active',
  },
  {
    id: '10',
    employeeId: 'EMP-111',
    employeeName: '최휴직',
    departmentCode: 'DEPT-QC',
    departmentName: '품질팀',
    positionCode: 'POS-SR',
    positionName: '대리',
    hireDate: '2020-05-18',
    resignDate: null,
    email: 'leave.choi@company.com',
    phone: '010-0123-4567',
    birthDate: '1991-02-28',
    gender: 'F',
    address: '경기도 안양시 동안구 평촌대로 444',
    baseSalary: 43000000,
    employmentType: 'regular',
    status: 'leave',
  },
];

export default function EmployeePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredEmployees = mockEmployees.filter(emp => {
    const matchesSearch =
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || emp.departmentCode === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || emp.status === selectedStatus;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = [...new Set(mockEmployees.map(e => e.departmentCode))];
  const activeCount = mockEmployees.filter(e => e.status === 'active').length;
  const leaveCount = mockEmployees.filter(e => e.status === 'leave').length;
  const avgSalary = mockEmployees.reduce((sum, e) => sum + e.baseSalary, 0) / mockEmployees.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'leave': return 'bg-yellow-500/20 text-yellow-400';
      case 'resigned': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getEmploymentTypeColor = (type: string) => {
    switch (type) {
      case 'regular': return 'bg-blue-500/20 text-blue-400';
      case 'contract': return 'bg-purple-500/20 text-purple-400';
      case 'part_time': return 'bg-orange-500/20 text-orange-400';
      case 'intern': return 'bg-cyan-500/20 text-cyan-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`;
    } else if (value >= 10000000) {
      return `${(value / 10000000).toFixed(0)}천만`;
    } else if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}만`;
    }
    return value.toLocaleString();
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculateTenure = (hireDate: string) => {
    const today = new Date();
    const hire = new Date(hireDate);
    const years = today.getFullYear() - hire.getFullYear();
    const months = today.getMonth() - hire.getMonth();
    if (months < 0) {
      return `${years - 1}년 ${12 + months}개월`;
    }
    return `${years}년 ${months}개월`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">사원관리</h1>
          <p className="text-slate-400">직원 정보 등록 및 관리</p>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-4 h-4" />
          사원 등록
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">총 직원</p>
              <p className="text-xl font-bold text-white">{mockEmployees.length}명</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">재직 중</p>
              <p className="text-xl font-bold text-white">{activeCount}명</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Users className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">휴직 중</p>
              <p className="text-xl font-bold text-white">{leaveCount}명</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">평균 연봉</p>
              <p className="text-xl font-bold text-white">{formatCurrency(avgSalary)}</p>
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
            placeholder="사번, 이름, 이메일 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">전체 부서</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
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

      {/* Employee List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">사번</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">이름</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">부서</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">직급</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">고용형태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">입사일</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">상태</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-slate-700/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedEmployee(emp)}
                >
                  <td className="px-4 py-3">
                    <span className="text-blue-400 font-mono text-sm">{emp.employeeId}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-sm font-medium">
                        {emp.employeeName.charAt(0)}
                      </div>
                      <span className="text-white font-medium">{emp.employeeName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{emp.departmentName}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{emp.positionName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${getEmploymentTypeColor(emp.employmentType)}`}>
                      {employmentTypeLabels[emp.employmentType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{emp.hireDate}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStatusColor(emp.status)}`}>
                      {statusLabels[emp.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Edit2 className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-600 flex items-center justify-center text-white text-2xl font-medium">
                    {selectedEmployee.employeeName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedEmployee.employeeName}</h2>
                    <p className="text-slate-400">{selectedEmployee.employeeId}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedEmployee(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* 소속 정보 */}
              <div>
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> 소속 정보
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">부서</p>
                    <p className="text-white">{selectedEmployee.departmentName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">직급</p>
                    <p className="text-white">{selectedEmployee.positionName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">고용형태</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${getEmploymentTypeColor(selectedEmployee.employmentType)}`}>
                      {employmentTypeLabels[selectedEmployee.employmentType]}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">상태</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStatusColor(selectedEmployee.status)}`}>
                      {statusLabels[selectedEmployee.status]}
                    </span>
                  </div>
                </div>
              </div>

              {/* 근무 정보 */}
              <div>
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> 근무 정보
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">입사일</p>
                    <p className="text-white">{selectedEmployee.hireDate}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">근속기간</p>
                    <p className="text-white">{calculateTenure(selectedEmployee.hireDate)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">연봉</p>
                    <p className="text-white">{selectedEmployee.baseSalary.toLocaleString()}원</p>
                  </div>
                </div>
              </div>

              {/* 개인 정보 */}
              <div>
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> 개인 정보
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">생년월일</p>
                    <p className="text-white">{selectedEmployee.birthDate} (만 {calculateAge(selectedEmployee.birthDate)}세)</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">성별</p>
                    <p className="text-white">{selectedEmployee.gender === 'M' ? '남성' : '여성'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 text-sm">주소</p>
                    <p className="text-white">{selectedEmployee.address}</p>
                  </div>
                </div>
              </div>

              {/* 연락처 */}
              <div>
                <h3 className="text-white font-medium mb-3">연락처</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-white">{selectedEmployee.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-white">{selectedEmployee.phone}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                닫기
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                수정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">사원 등록</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">사번 *</label>
                  <input
                    type="text"
                    placeholder="EMP-XXX"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">이름 *</label>
                  <input
                    type="text"
                    placeholder="홍길동"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">부서 *</label>
                  <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                    <option value="">선택</option>
                    <option value="DEPT-HR">인사팀</option>
                    <option value="DEPT-FIN">재무팀</option>
                    <option value="DEPT-PROD-SMT">SMT팀</option>
                    <option value="DEPT-QC">품질팀</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">직급 *</label>
                  <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                    <option value="">선택</option>
                    <option value="POS-JR">사원</option>
                    <option value="POS-SR">대리</option>
                    <option value="POS-ASM">과장</option>
                    <option value="POS-SM">차장</option>
                    <option value="POS-MGR">부장</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">입사일 *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">고용형태 *</label>
                  <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                    <option value="regular">정규직</option>
                    <option value="contract">계약직</option>
                    <option value="part_time">파트타임</option>
                    <option value="intern">인턴</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">이메일</label>
                <input
                  type="email"
                  placeholder="email@company.com"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">전화번호</label>
                <input
                  type="tel"
                  placeholder="010-1234-5678"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">연봉</label>
                <input
                  type="number"
                  placeholder="35000000"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                취소
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
