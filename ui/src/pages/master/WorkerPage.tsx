import { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Award,
  Calendar,
  Star,
} from 'lucide-react';

interface Worker {
  workerCode: string;
  workerName: string;
  department: string;
  position: string;
  lineCode: string;
  lineName: string;
  shift: '주간' | '야간' | '교대';
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  certifications: string[];
  hireDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LEAVE';
  contactNo: string;
}

const mockWorkers: Worker[] = [
  {
    workerCode: 'W001',
    workerName: '김철수',
    department: '생산1팀',
    position: '반장',
    lineCode: 'SMT-L01',
    lineName: 'SMT 1라인',
    shift: '주간',
    skillLevel: 'EXPERT',
    certifications: ['SMT 마스터', '품질관리기사'],
    hireDate: '2015-03-15',
    status: 'ACTIVE',
    contactNo: '010-1234-5678',
  },
  {
    workerCode: 'W002',
    workerName: '이영희',
    department: '생산1팀',
    position: '조장',
    lineCode: 'SMT-L01',
    lineName: 'SMT 1라인',
    shift: '주간',
    skillLevel: 'ADVANCED',
    certifications: ['SMT 기술사'],
    hireDate: '2018-07-20',
    status: 'ACTIVE',
    contactNo: '010-2345-6789',
  },
  {
    workerCode: 'W003',
    workerName: '박민수',
    department: '생산1팀',
    position: '사원',
    lineCode: 'SMT-L01',
    lineName: 'SMT 1라인',
    shift: '야간',
    skillLevel: 'INTERMEDIATE',
    certifications: [],
    hireDate: '2020-01-10',
    status: 'ACTIVE',
    contactNo: '010-3456-7890',
  },
  {
    workerCode: 'W004',
    workerName: '정수진',
    department: '생산2팀',
    position: '반장',
    lineCode: 'SMT-L02',
    lineName: 'SMT 2라인',
    shift: '교대',
    skillLevel: 'EXPERT',
    certifications: ['품질관리기사', '산업안전기사'],
    hireDate: '2014-05-22',
    status: 'ACTIVE',
    contactNo: '010-4567-8901',
  },
  {
    workerCode: 'W005',
    workerName: '최동현',
    department: '생산2팀',
    position: '사원',
    lineCode: 'SMT-L02',
    lineName: 'SMT 2라인',
    shift: '주간',
    skillLevel: 'BEGINNER',
    certifications: [],
    hireDate: '2023-09-01',
    status: 'ACTIVE',
    contactNo: '010-5678-9012',
  },
  {
    workerCode: 'W006',
    workerName: '한미래',
    department: '품질팀',
    position: '검사원',
    lineCode: 'TST-L01',
    lineName: '테스트 1라인',
    shift: '주간',
    skillLevel: 'ADVANCED',
    certifications: ['품질관리기사'],
    hireDate: '2019-04-15',
    status: 'ACTIVE',
    contactNo: '010-6789-0123',
  },
  {
    workerCode: 'W007',
    workerName: '오정훈',
    department: '생산3팀',
    position: '사원',
    lineCode: 'ASM-L01',
    lineName: '조립 1라인',
    shift: '교대',
    skillLevel: 'INTERMEDIATE',
    certifications: ['조립기능사'],
    hireDate: '2021-02-28',
    status: 'LEAVE',
    contactNo: '010-7890-1234',
  },
  {
    workerCode: 'W008',
    workerName: '강서연',
    department: '생산1팀',
    position: '사원',
    lineCode: 'SMT-L03',
    lineName: 'SMT 3라인',
    shift: '야간',
    skillLevel: 'INTERMEDIATE',
    certifications: [],
    hireDate: '2022-06-10',
    status: 'INACTIVE',
    contactNo: '010-8901-2345',
  },
];

const skillConfig = {
  BEGINNER: { label: '초급', color: 'bg-slate-500', stars: 1 },
  INTERMEDIATE: { label: '중급', color: 'bg-blue-500', stars: 2 },
  ADVANCED: { label: '고급', color: 'bg-emerald-500', stars: 3 },
  EXPERT: { label: '전문가', color: 'bg-amber-500', stars: 4 },
};

const statusConfig = {
  ACTIVE: { label: '재직', color: 'bg-green-500', icon: CheckCircle },
  INACTIVE: { label: '퇴직', color: 'bg-slate-500', icon: XCircle },
  LEAVE: { label: '휴직', color: 'bg-yellow-500', icon: Calendar },
};

export default function WorkerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(mockWorkers[0]);

  const filteredWorkers = mockWorkers.filter(worker => {
    const matchesSearch = worker.workerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          worker.workerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || worker.department === deptFilter;
    const matchesStatus = statusFilter === 'ALL' || worker.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const departments = [...new Set(mockWorkers.map(w => w.department))];

  const summary = {
    total: mockWorkers.length,
    active: mockWorkers.filter(w => w.status === 'ACTIVE').length,
    experts: mockWorkers.filter(w => w.skillLevel === 'EXPERT' || w.skillLevel === 'ADVANCED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-cyan-400" />
            작업자관리
          </h1>
          <p className="text-slate-400 mt-1">작업자 정보를 등록하고 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors">
            <Plus className="h-4 w-4" />
            작업자 등록
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-700 rounded-lg">
              <Users className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">전체 작업자</p>
              <p className="text-2xl font-bold text-white">{summary.total}명</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">재직중</p>
              <p className="text-2xl font-bold text-green-400">{summary.active}명</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Award className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">숙련자 (고급+)</p>
              <p className="text-2xl font-bold text-amber-400">{summary.experts}명</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Star className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">부서 수</p>
              <p className="text-2xl font-bold text-cyan-400">{departments.length}개</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Worker List */}
        <div className="col-span-2 bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="작업자코드 또는 이름 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 text-sm"
              >
                <option value="ALL">전체 부서</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 text-sm"
              >
                <option value="ALL">전체 상태</option>
                <option value="ACTIVE">재직</option>
                <option value="INACTIVE">퇴직</option>
                <option value="LEAVE">휴직</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">사번</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">이름</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">부서</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">배치라인</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">숙련도</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">상태</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredWorkers.map((worker) => {
                  const StatusIcon = statusConfig[worker.status].icon;
                  return (
                    <tr
                      key={worker.workerCode}
                      className={`hover:bg-slate-700/50 cursor-pointer ${
                        selectedWorker?.workerCode === worker.workerCode ? 'bg-slate-700/50' : ''
                      }`}
                      onClick={() => setSelectedWorker(worker)}
                    >
                      <td className="px-4 py-3 text-cyan-400 font-medium">{worker.workerCode}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white">{worker.workerName}</p>
                          <p className="text-xs text-slate-400">{worker.position}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{worker.department}</td>
                      <td className="px-4 py-3 text-slate-300">{worker.lineName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs text-white ${skillConfig[worker.skillLevel].color}`}>
                          {skillConfig[worker.skillLevel].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white ${statusConfig[worker.status].color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[worker.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Worker Detail */}
        {selectedWorker && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-cyan-400">
                  {selectedWorker.workerName.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedWorker.workerName}</h3>
                <p className="text-sm text-slate-400">{selectedWorker.department} / {selectedWorker.position}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400">사번</p>
                  <p className="text-white font-medium">{selectedWorker.workerCode}</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400">입사일</p>
                  <p className="text-white">{selectedWorker.hireDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400">배치라인</p>
                  <p className="text-white">{selectedWorker.lineName}</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400">근무형태</p>
                  <p className="text-white">{selectedWorker.shift}</p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-2">숙련도</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-sm text-white ${skillConfig[selectedWorker.skillLevel].color}`}>
                    {skillConfig[selectedWorker.skillLevel].label}
                  </span>
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < skillConfig[selectedWorker.skillLevel].stars
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-2">자격증</p>
                {selectedWorker.certifications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedWorker.certifications.map((cert, idx) => (
                      <span key={idx} className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-sm">
                        {cert}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">등록된 자격증 없음</p>
                )}
              </div>

              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400">연락처</p>
                <p className="text-white">{selectedWorker.contactNo}</p>
              </div>

              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-2">상태</p>
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-white ${statusConfig[selectedWorker.status].color}`}>
                  {(() => {
                    const StatusIcon = statusConfig[selectedWorker.status].icon;
                    return <StatusIcon className="h-4 w-4" />;
                  })()}
                  {statusConfig[selectedWorker.status].label}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
