import { useState } from 'react';
import { Building2, Search, Plus, Edit2, Trash2, Users, ChevronRight, ChevronDown } from 'lucide-react';

interface Department {
  id: string;
  departmentCode: string;
  departmentName: string;
  parentCode: string | null;
  managerId: string | null;
  managerName: string | null;
  costCenterCode: string | null;
  employeeCount: number;
  isActive: boolean;
  children?: Department[];
}

const mockDepartments: Department[] = [
  {
    id: '1',
    departmentCode: 'DEPT-CEO',
    departmentName: '대표이사',
    parentCode: null,
    managerId: 'EMP-001',
    managerName: '김대표',
    costCenterCode: 'CC-ADMIN',
    employeeCount: 1,
    isActive: true,
    children: [
      {
        id: '2',
        departmentCode: 'DEPT-MGMT',
        departmentName: '경영지원본부',
        parentCode: 'DEPT-CEO',
        managerId: 'EMP-002',
        managerName: '이본부장',
        costCenterCode: 'CC-ADMIN',
        employeeCount: 3,
        isActive: true,
        children: [
          {
            id: '3',
            departmentCode: 'DEPT-HR',
            departmentName: '인사팀',
            parentCode: 'DEPT-MGMT',
            managerId: 'EMP-010',
            managerName: '박인사',
            costCenterCode: 'CC-ADMIN',
            employeeCount: 5,
            isActive: true,
          },
          {
            id: '4',
            departmentCode: 'DEPT-FIN',
            departmentName: '재무팀',
            parentCode: 'DEPT-MGMT',
            managerId: 'EMP-020',
            managerName: '최재무',
            costCenterCode: 'CC-ADMIN',
            employeeCount: 4,
            isActive: true,
          },
          {
            id: '5',
            departmentCode: 'DEPT-GA',
            departmentName: '총무팀',
            parentCode: 'DEPT-MGMT',
            managerId: 'EMP-030',
            managerName: '정총무',
            costCenterCode: 'CC-ADMIN',
            employeeCount: 3,
            isActive: true,
          },
        ],
      },
      {
        id: '6',
        departmentCode: 'DEPT-PROD',
        departmentName: '생산본부',
        parentCode: 'DEPT-CEO',
        managerId: 'EMP-100',
        managerName: '김생산',
        costCenterCode: 'CC-PROD',
        employeeCount: 5,
        isActive: true,
        children: [
          {
            id: '7',
            departmentCode: 'DEPT-PROD-SMT',
            departmentName: 'SMT팀',
            parentCode: 'DEPT-PROD',
            managerId: 'EMP-110',
            managerName: '이에스엠티',
            costCenterCode: 'CC-PROD',
            employeeCount: 25,
            isActive: true,
          },
          {
            id: '8',
            departmentCode: 'DEPT-PROD-ASSY',
            departmentName: '조립팀',
            parentCode: 'DEPT-PROD',
            managerId: 'EMP-120',
            managerName: '박조립',
            costCenterCode: 'CC-PROD',
            employeeCount: 30,
            isActive: true,
          },
          {
            id: '9',
            departmentCode: 'DEPT-QC',
            departmentName: '품질팀',
            parentCode: 'DEPT-PROD',
            managerId: 'EMP-130',
            managerName: '최품질',
            costCenterCode: 'CC-PROD',
            employeeCount: 10,
            isActive: true,
          },
        ],
      },
      {
        id: '10',
        departmentCode: 'DEPT-SALES',
        departmentName: '영업본부',
        parentCode: 'DEPT-CEO',
        managerId: 'EMP-200',
        managerName: '정영업',
        costCenterCode: 'CC-SALES',
        employeeCount: 3,
        isActive: true,
        children: [
          {
            id: '11',
            departmentCode: 'DEPT-SALES-DOM',
            departmentName: '국내영업팀',
            parentCode: 'DEPT-SALES',
            managerId: 'EMP-210',
            managerName: '강국내',
            costCenterCode: 'CC-SALES',
            employeeCount: 8,
            isActive: true,
          },
          {
            id: '12',
            departmentCode: 'DEPT-SALES-EXP',
            departmentName: '해외영업팀',
            parentCode: 'DEPT-SALES',
            managerId: 'EMP-220',
            managerName: '윤해외',
            costCenterCode: 'CC-SALES',
            employeeCount: 6,
            isActive: true,
          },
        ],
      },
      {
        id: '13',
        departmentCode: 'DEPT-RND',
        departmentName: '연구소',
        parentCode: 'DEPT-CEO',
        managerId: 'EMP-300',
        managerName: '한연구',
        costCenterCode: 'CC-RND',
        employeeCount: 15,
        isActive: true,
      },
    ],
  },
];

// 전체 부서 수 계산
const countAllDepartments = (depts: Department[]): number => {
  return depts.reduce((sum, dept) => {
    return sum + 1 + (dept.children ? countAllDepartments(dept.children) : 0);
  }, 0);
};

// 전체 직원 수 계산
const countAllEmployees = (depts: Department[]): number => {
  return depts.reduce((sum, dept) => {
    return sum + dept.employeeCount + (dept.children ? countAllEmployees(dept.children) : 0);
  }, 0);
};

// 트리 노드 컴포넌트
function DepartmentTreeNode({
  dept,
  level = 0,
  onSelect,
  selectedId
}: {
  dept: Department;
  level?: number;
  onSelect: (dept: Department) => void;
  selectedId: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = dept.children && dept.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
          selectedId === dept.id ? 'bg-blue-600/30 border border-blue-500' : 'hover:bg-slate-700/50'
        }`}
        style={{ marginLeft: `${level * 24}px` }}
        onClick={() => onSelect(dept)}
      >
        {hasChildren ? (
          <button
            className="p-0.5 hover:bg-slate-600 rounded"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}
        <Building2 className="w-4 h-4 text-blue-400" />
        <span className="text-white font-medium">{dept.departmentName}</span>
        <span className="text-slate-400 text-sm">({dept.departmentCode})</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1 text-slate-400 text-sm">
          <Users className="w-3 h-3" />
          <span>{dept.employeeCount}</span>
        </div>
        {!dept.isActive && (
          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">비활성</span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div>
          {dept.children!.map((child) => (
            <DepartmentTreeNode
              key={child.id}
              dept={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DepartmentPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showModal, setShowModal] = useState(false);

  const totalDepartments = countAllDepartments(mockDepartments);
  const totalEmployees = countAllEmployees(mockDepartments);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">부서관리</h1>
          <p className="text-slate-400">조직도 및 부서 정보 관리</p>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-4 h-4" />
          부서 등록
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">총 부서</p>
              <p className="text-xl font-bold text-white">{totalDepartments}개</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">총 직원</p>
              <p className="text-xl font-bold text-white">{totalEmployees}명</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">활성 부서</p>
              <p className="text-xl font-bold text-white">{totalDepartments}개</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="부서코드, 부서명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Tree */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-white font-medium mb-4">조직도</h3>
          <div className="space-y-1">
            {mockDepartments.map((dept) => (
              <DepartmentTreeNode
                key={dept.id}
                dept={dept}
                onSelect={setSelectedDepartment}
                selectedId={selectedDepartment?.id || null}
              />
            ))}
          </div>
        </div>

        {/* Department Detail */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-white font-medium mb-4">부서 상세정보</h3>
          {selectedDepartment ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">부서코드</p>
                  <p className="text-white font-mono">{selectedDepartment.departmentCode}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">부서명</p>
                  <p className="text-white">{selectedDepartment.departmentName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">상위부서</p>
                  <p className="text-white">{selectedDepartment.parentCode || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">원가센터</p>
                  <p className="text-white">{selectedDepartment.costCenterCode || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">부서장</p>
                  <p className="text-white">
                    {selectedDepartment.managerName || '-'}
                    {selectedDepartment.managerId && (
                      <span className="text-slate-400 text-sm ml-1">({selectedDepartment.managerId})</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">소속 직원수</p>
                  <p className="text-white">{selectedDepartment.employeeCount}명</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">상태</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                    selectedDepartment.isActive
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedDepartment.isActive ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-slate-700">
                <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                  <Edit2 className="w-3 h-3" />
                  수정
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors">
                  <Trash2 className="w-3 h-3" />
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              좌측 조직도에서 부서를 선택하세요
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">부서 등록</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-1">부서코드 *</label>
                <input
                  type="text"
                  placeholder="DEPT-XXX"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">부서명 *</label>
                <input
                  type="text"
                  placeholder="부서명 입력"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">상위부서</label>
                <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                  <option value="">없음 (최상위)</option>
                  <option value="DEPT-CEO">대표이사</option>
                  <option value="DEPT-MGMT">경영지원본부</option>
                  <option value="DEPT-PROD">생산본부</option>
                  <option value="DEPT-SALES">영업본부</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">원가센터</label>
                <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                  <option value="">선택</option>
                  <option value="CC-ADMIN">관리비용</option>
                  <option value="CC-PROD">생산비용</option>
                  <option value="CC-SALES">판매비용</option>
                  <option value="CC-RND">연구개발비</option>
                </select>
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
