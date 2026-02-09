import { useState } from 'react';
import { Shield, Search, Plus, Filter, Users, CheckSquare, Square, ChevronDown, ChevronRight, Settings, Eye, Edit2, Trash2 } from 'lucide-react';

interface Role {
  id: string;
  roleCode: string;
  roleName: string;
  description: string;
  userCount: number;
  isActive: boolean;
  createdAt: string;
  permissions: Permission[];
}

interface Permission {
  menuId: string;
  menuName: string;
  parentId: string | null;
  read: boolean;
  write: boolean;
  delete: boolean;
  children?: Permission[];
}

interface Menu {
  id: string;
  name: string;
  parentId: string | null;
  children?: Menu[];
}

const mockMenus: Menu[] = [
  {
    id: 'M001',
    name: '기준정보관리',
    parentId: null,
    children: [
      { id: 'M001-01', name: '코드그룹관리', parentId: 'M001' },
      { id: 'M001-02', name: '공통코드관리', parentId: 'M001' },
      { id: 'M001-03', name: '부서관리', parentId: 'M001' },
      { id: 'M001-04', name: '제품관리', parentId: 'M001' },
      { id: 'M001-05', name: '설비관리', parentId: 'M001' },
    ],
  },
  {
    id: 'M002',
    name: '생산계획',
    parentId: null,
    children: [
      { id: 'M002-01', name: '작업지시관리', parentId: 'M002' },
      { id: 'M002-02', name: '작업지시현황', parentId: 'M002' },
    ],
  },
  {
    id: 'M003',
    name: '생산실행',
    parentId: null,
    children: [
      { id: 'M003-01', name: '생산실적입력', parentId: 'M003' },
      { id: 'M003-02', name: '비가동관리', parentId: 'M003' },
      { id: 'M003-03', name: 'LOT추적', parentId: 'M003' },
    ],
  },
  {
    id: 'M004',
    name: '품질관리',
    parentId: null,
    children: [
      { id: 'M004-01', name: '초중종검사', parentId: 'M004' },
      { id: 'M004-02', name: '공정검사', parentId: 'M004' },
      { id: 'M004-03', name: '불량현황', parentId: 'M004' },
      { id: 'M004-04', name: 'SPC관리', parentId: 'M004' },
    ],
  },
  {
    id: 'M005',
    name: '시스템관리',
    parentId: null,
    children: [
      { id: 'M005-01', name: '사용자관리', parentId: 'M005' },
      { id: 'M005-02', name: '권한관리', parentId: 'M005' },
      { id: 'M005-03', name: '메뉴관리', parentId: 'M005' },
      { id: 'M005-04', name: '로그조회', parentId: 'M005' },
    ],
  },
];

const mockRoles: Role[] = [
  {
    id: '1',
    roleCode: 'ADMIN',
    roleName: '시스템 관리자',
    description: '시스템 전체 관리 권한',
    userCount: 2,
    isActive: true,
    createdAt: '2024-01-01',
    permissions: [],
  },
  {
    id: '2',
    roleCode: 'PROD_MGR',
    roleName: '생산관리자',
    description: '생산 관련 메뉴 관리 권한',
    userCount: 5,
    isActive: true,
    createdAt: '2024-01-01',
    permissions: [],
  },
  {
    id: '3',
    roleCode: 'QC_MGR',
    roleName: '품질관리자',
    description: '품질 관련 메뉴 관리 권한',
    userCount: 3,
    isActive: true,
    createdAt: '2024-01-01',
    permissions: [],
  },
  {
    id: '4',
    roleCode: 'OPERATOR',
    roleName: '작업자',
    description: '생산실적 입력 권한',
    userCount: 45,
    isActive: true,
    createdAt: '2024-01-01',
    permissions: [],
  },
  {
    id: '5',
    roleCode: 'VIEWER',
    roleName: '조회자',
    description: '데이터 조회 전용 권한',
    userCount: 20,
    isActive: true,
    createdAt: '2024-01-01',
    permissions: [],
  },
];

export default function RolePage() {
  const [roles] = useState<Role[]>(mockRoles);
  const [menus] = useState<Menu[]>(mockMenus);
  const [selectedRole, setSelectedRole] = useState<Role | null>(mockRoles[0]);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['M001', 'M002', 'M003', 'M004', 'M005']));
  const [searchTerm, setSearchTerm] = useState('');

  // Mock permission state for the selected role
  const [permissions, setPermissions] = useState<Record<string, { read: boolean; write: boolean; delete: boolean }>>({
    'M001': { read: true, write: true, delete: true },
    'M001-01': { read: true, write: true, delete: true },
    'M001-02': { read: true, write: true, delete: true },
    'M001-03': { read: true, write: true, delete: false },
    'M001-04': { read: true, write: true, delete: false },
    'M001-05': { read: true, write: true, delete: false },
    'M002': { read: true, write: true, delete: false },
    'M002-01': { read: true, write: true, delete: false },
    'M002-02': { read: true, write: false, delete: false },
    'M003': { read: true, write: true, delete: false },
    'M003-01': { read: true, write: true, delete: false },
    'M003-02': { read: true, write: true, delete: false },
    'M003-03': { read: true, write: false, delete: false },
    'M004': { read: true, write: true, delete: false },
    'M004-01': { read: true, write: true, delete: false },
    'M004-02': { read: true, write: true, delete: false },
    'M004-03': { read: true, write: false, delete: false },
    'M004-04': { read: true, write: false, delete: false },
    'M005': { read: true, write: true, delete: true },
    'M005-01': { read: true, write: true, delete: true },
    'M005-02': { read: true, write: true, delete: true },
    'M005-03': { read: true, write: true, delete: true },
    'M005-04': { read: true, write: false, delete: false },
  });

  const filteredRoles = roles.filter(role =>
    role.roleName.includes(searchTerm) || role.roleCode.includes(searchTerm)
  );

  const toggleMenu = (menuId: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  const togglePermission = (menuId: string, type: 'read' | 'write' | 'delete') => {
    setPermissions(prev => ({
      ...prev,
      [menuId]: {
        ...prev[menuId],
        [type]: !prev[menuId]?.[type],
      },
    }));
  };

  const renderMenuTree = (menu: Menu, level: number = 0) => {
    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedMenus.has(menu.id);
    const perm = permissions[menu.id] || { read: false, write: false, delete: false };

    return (
      <div key={menu.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 hover:bg-slate-700/30 rounded ${level > 0 ? 'ml-6' : ''}`}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleMenu(menu.id)}
              className="text-slate-400 hover:text-white"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <span className="flex-1 text-white text-sm">{menu.name}</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => togglePermission(menu.id, 'read')}
              className="flex items-center gap-1 text-sm"
            >
              {perm.read ? (
                <CheckSquare className="w-4 h-4 text-green-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span className={perm.read ? 'text-green-400' : 'text-slate-500'}>조회</span>
            </button>
            <button
              onClick={() => togglePermission(menu.id, 'write')}
              className="flex items-center gap-1 text-sm"
            >
              {perm.write ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span className={perm.write ? 'text-blue-400' : 'text-slate-500'}>등록/수정</span>
            </button>
            <button
              onClick={() => togglePermission(menu.id, 'delete')}
              className="flex items-center gap-1 text-sm"
            >
              {perm.delete ? (
                <CheckSquare className="w-4 h-4 text-red-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span className={perm.delete ? 'text-red-400' : 'text-slate-500'}>삭제</span>
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {menu.children!.map(child => renderMenuTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">권한관리</h1>
          <p className="text-slate-400 text-sm mt-1">역할별 메뉴 접근 권한 설정</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          역할 추가
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Role List */}
        <div className="col-span-1 space-y-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="역할 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400"
              />
            </div>

            <div className="space-y-2">
              {filteredRoles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`p-3 rounded-lg cursor-pointer ${selectedRole?.id === role.id ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-slate-400" />
                      <span className="text-white font-medium">{role.roleName}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${role.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                      {role.isActive ? '활성' : '비활성'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">{role.roleCode}</p>
                  <div className="flex items-center gap-2 mt-2 text-slate-400 text-xs">
                    <Users className="w-3 h-3" />
                    <span>{role.userCount}명</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Permission Settings */}
        <div className="col-span-2 space-y-4">
          {selectedRole && (
            <>
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">{selectedRole.roleName}</h3>
                    <p className="text-slate-400 text-sm">{selectedRole.description}</p>
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

                <div className="grid grid-cols-3 gap-4 p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-slate-400 text-xs">역할코드</p>
                    <p className="text-white font-mono">{selectedRole.roleCode}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">사용자 수</p>
                    <p className="text-white">{selectedRole.userCount}명</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">생성일</p>
                    <p className="text-white">{selectedRole.createdAt}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold">메뉴 권한 설정</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-green-400" /> 조회
                    </span>
                    <span className="flex items-center gap-1">
                      <Edit2 className="w-4 h-4 text-blue-400" /> 등록/수정
                    </span>
                    <span className="flex items-center gap-1">
                      <Trash2 className="w-4 h-4 text-red-400" /> 삭제
                    </span>
                  </div>
                </div>

                <div className="border border-slate-700 rounded-lg divide-y divide-slate-700">
                  {menus.map(menu => renderMenuTree(menu))}
                </div>

                <div className="flex justify-end mt-4 gap-2">
                  <button className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
                    취소
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    저장
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
