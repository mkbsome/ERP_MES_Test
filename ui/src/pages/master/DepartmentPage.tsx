import { useState } from 'react';
import { Building2, Search, Plus, Edit2, Trash2, Users, ChevronRight, ChevronDown } from 'lucide-react';

interface Department {
  id: string;
  deptCode: string;
  deptName: string;
  parentId?: string;
  parentName?: string;
  manager?: string;
  phone?: string;
  useYn: boolean;
  sortOrder: number;
  level: number;
  children?: Department[];
}

const mockDepartments: Department[] = [
  {
    id: '1', deptCode: 'PROD', deptName: '생산본부', manager: '김본부장', phone: '1000', useYn: true, sortOrder: 1, level: 1,
    children: [
      { id: '1-1', deptCode: 'PROD1', deptName: '생산1팀', parentId: '1', parentName: '생산본부', manager: '이팀장', phone: '1100', useYn: true, sortOrder: 1, level: 2 },
      { id: '1-2', deptCode: 'PROD2', deptName: '생산2팀', parentId: '1', parentName: '생산본부', manager: '박팀장', phone: '1200', useYn: true, sortOrder: 2, level: 2 },
      { id: '1-3', deptCode: 'PROD3', deptName: '생산3팀', parentId: '1', parentName: '생산본부', manager: '최팀장', phone: '1300', useYn: true, sortOrder: 3, level: 2 },
    ]
  },
  {
    id: '2', deptCode: 'QC', deptName: '품질본부', manager: '박본부장', phone: '2000', useYn: true, sortOrder: 2, level: 1,
    children: [
      { id: '2-1', deptCode: 'QC1', deptName: '품질관리팀', parentId: '2', parentName: '품질본부', manager: '김팀장', phone: '2100', useYn: true, sortOrder: 1, level: 2 },
      { id: '2-2', deptCode: 'QC2', deptName: '품질보증팀', parentId: '2', parentName: '품질본부', manager: '이팀장', phone: '2200', useYn: true, sortOrder: 2, level: 2 },
    ]
  },
  {
    id: '3', deptCode: 'ENG', deptName: '기술본부', manager: '최본부장', phone: '3000', useYn: true, sortOrder: 3, level: 1,
    children: [
      { id: '3-1', deptCode: 'ENG1', deptName: '설비팀', parentId: '3', parentName: '기술본부', manager: '정팀장', phone: '3100', useYn: true, sortOrder: 1, level: 2 },
      { id: '3-2', deptCode: 'ENG2', deptName: '공정기술팀', parentId: '3', parentName: '기술본부', manager: '한팀장', phone: '3200', useYn: true, sortOrder: 2, level: 2 },
    ]
  },
  {
    id: '4', deptCode: 'BIZ', deptName: '경영지원본부', manager: '한본부장', phone: '4000', useYn: true, sortOrder: 4, level: 1,
    children: [
      { id: '4-1', deptCode: 'HR', deptName: '인사팀', parentId: '4', parentName: '경영지원본부', manager: '오팀장', phone: '4100', useYn: true, sortOrder: 1, level: 2 },
      { id: '4-2', deptCode: 'FIN', deptName: '재무팀', parentId: '4', parentName: '경영지원본부', manager: '강팀장', phone: '4200', useYn: true, sortOrder: 2, level: 2 },
      { id: '4-3', deptCode: 'IT', deptName: '정보시스템팀', parentId: '4', parentName: '경영지원본부', manager: '윤팀장', phone: '4300', useYn: true, sortOrder: 3, level: 2 },
    ]
  },
];

export default function DepartmentPage() {
  const [departments] = useState<Department[]>(mockDepartments);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set(['1', '2', '3', '4']));
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const toggleDept = (deptId: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepts(newExpanded);
  };

  const getAllDepts = (): Department[] => {
    const allDepts: Department[] = [];
    departments.forEach(dept => {
      allDepts.push(dept);
      if (dept.children) {
        allDepts.push(...dept.children);
      }
    });
    return allDepts;
  };

  const stats = {
    total: getAllDepts().length,
    active: getAllDepts().filter(d => d.useYn).length,
    parent: departments.length,
    child: getAllDepts().length - departments.length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">부서관리</h1>
          <p className="text-slate-400 text-sm mt-1">조직 구조 및 부서 정보 관리</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          부서 등록
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">전체 부서</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">활성 부서</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.active}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">본부</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.parent}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">팀</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats.child}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="부서 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {departments.map((dept) => (
              <div key={dept.id}>
                <div
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-slate-700 ${
                    selectedDept?.id === dept.id ? 'bg-slate-700' : ''
                  }`}
                  onClick={() => {
                    setSelectedDept(dept);
                    toggleDept(dept.id);
                  }}
                >
                  {dept.children && dept.children.length > 0 ? (
                    expandedDepts.has(dept.id) ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )
                  ) : (
                    <div className="w-4" />
                  )}
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-sm flex-1">{dept.deptName}</span>
                </div>
                {expandedDepts.has(dept.id) && dept.children && (
                  <div className="ml-6 space-y-1">
                    {dept.children.map((child) => (
                      <div
                        key={child.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-slate-700/50 ${
                          selectedDept?.id === child.id ? 'bg-slate-700/50' : ''
                        }`}
                        onClick={() => setSelectedDept(child)}
                      >
                        <Users className="w-3 h-3 text-slate-500" />
                        <span className="text-slate-300 text-sm">{child.deptName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          {selectedDept ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">부서 정보</h3>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-400 text-sm">부서코드</label>
                    <p className="text-white font-mono mt-1">{selectedDept.deptCode}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">부서명</label>
                    <p className="text-white mt-1">{selectedDept.deptName}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">상위부서</label>
                    <p className="text-white mt-1">{selectedDept.parentName || '-'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-400 text-sm">부서장</label>
                    <p className="text-white mt-1">{selectedDept.manager || '-'}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">내선번호</label>
                    <p className="text-white mt-1">{selectedDept.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">사용여부</label>
                    <p className={`mt-1 ${selectedDept.useYn ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedDept.useYn ? '사용' : '미사용'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">부서를 선택하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
