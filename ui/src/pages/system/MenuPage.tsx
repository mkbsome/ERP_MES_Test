import { useState } from 'react';
import { Menu, Search, Plus, ChevronDown, ChevronRight, Edit2, Trash2, Eye, EyeOff, GripVertical, Settings } from 'lucide-react';

interface MenuItem {
  id: string;
  menuCode: string;
  menuName: string;
  parentId: string | null;
  path: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  isVisible: boolean;
  level: number;
  children?: MenuItem[];
}

const mockMenus: MenuItem[] = [
  {
    id: 'M001',
    menuCode: 'MASTER',
    menuName: '기준정보관리',
    parentId: null,
    path: '/master',
    icon: 'Database',
    sortOrder: 1,
    isActive: true,
    isVisible: true,
    level: 1,
    children: [
      { id: 'M001-01', menuCode: 'MASTER_CODE_GROUP', menuName: '코드그룹관리', parentId: 'M001', path: '/master/code-group', icon: '', sortOrder: 1, isActive: true, isVisible: true, level: 2 },
      { id: 'M001-02', menuCode: 'MASTER_COMMON_CODE', menuName: '공통코드관리', parentId: 'M001', path: '/master/common-code', icon: '', sortOrder: 2, isActive: true, isVisible: true, level: 2 },
      { id: 'M001-03', menuCode: 'MASTER_DEPARTMENT', menuName: '부서관리', parentId: 'M001', path: '/master/department', icon: '', sortOrder: 3, isActive: true, isVisible: true, level: 2 },
      { id: 'M001-04', menuCode: 'MASTER_PRODUCT', menuName: '제품관리', parentId: 'M001', path: '/master/product', icon: '', sortOrder: 4, isActive: true, isVisible: true, level: 2 },
      { id: 'M001-05', menuCode: 'MASTER_BOM', menuName: 'BOM관리', parentId: 'M001', path: '/master/bom', icon: '', sortOrder: 5, isActive: true, isVisible: true, level: 2 },
      { id: 'M001-06', menuCode: 'MASTER_EQUIPMENT', menuName: '설비관리', parentId: 'M001', path: '/master/equipment', icon: '', sortOrder: 6, isActive: true, isVisible: true, level: 2 },
      { id: 'M001-07', menuCode: 'MASTER_WORKER', menuName: '작업자관리', parentId: 'M001', path: '/master/worker', icon: '', sortOrder: 7, isActive: true, isVisible: true, level: 2 },
      { id: 'M001-08', menuCode: 'MASTER_LINE', menuName: '라인관리', parentId: 'M001', path: '/master/line', icon: '', sortOrder: 8, isActive: true, isVisible: true, level: 2 },
    ],
  },
  {
    id: 'M002',
    menuCode: 'PLANNING',
    menuName: '생산계획',
    parentId: null,
    path: '/planning',
    icon: 'Calendar',
    sortOrder: 2,
    isActive: true,
    isVisible: true,
    level: 1,
    children: [
      { id: 'M002-01', menuCode: 'PLANNING_WORK_ORDER', menuName: '작업지시관리', parentId: 'M002', path: '/planning/work-order', icon: '', sortOrder: 1, isActive: true, isVisible: true, level: 2 },
      { id: 'M002-02', menuCode: 'PLANNING_STATUS', menuName: '작업지시현황', parentId: 'M002', path: '/planning/work-order-status', icon: '', sortOrder: 2, isActive: true, isVisible: true, level: 2 },
    ],
  },
  {
    id: 'M003',
    menuCode: 'EXECUTION',
    menuName: '생산실행',
    parentId: null,
    path: '/execution',
    icon: 'Play',
    sortOrder: 3,
    isActive: true,
    isVisible: true,
    level: 1,
    children: [
      { id: 'M003-01', menuCode: 'EXECUTION_RESULT', menuName: '생산실적입력', parentId: 'M003', path: '/execution/result-input', icon: '', sortOrder: 1, isActive: true, isVisible: true, level: 2 },
      { id: 'M003-02', menuCode: 'EXECUTION_DOWNTIME', menuName: '비가동관리', parentId: 'M003', path: '/execution/downtime', icon: '', sortOrder: 2, isActive: true, isVisible: true, level: 2 },
      { id: 'M003-03', menuCode: 'EXECUTION_LOT', menuName: 'LOT추적', parentId: 'M003', path: '/execution/lot-tracking', icon: '', sortOrder: 3, isActive: true, isVisible: true, level: 2 },
    ],
  },
  {
    id: 'M004',
    menuCode: 'QUALITY',
    menuName: '품질관리',
    parentId: null,
    path: '/quality',
    icon: 'CheckCircle',
    sortOrder: 4,
    isActive: true,
    isVisible: true,
    level: 1,
    children: [
      { id: 'M004-01', menuCode: 'QUALITY_INITIAL', menuName: '초중종검사', parentId: 'M004', path: '/quality/initial-inspection', icon: '', sortOrder: 1, isActive: true, isVisible: true, level: 2 },
      { id: 'M004-02', menuCode: 'QUALITY_PROCESS', menuName: '공정검사', parentId: 'M004', path: '/quality/process-inspection', icon: '', sortOrder: 2, isActive: true, isVisible: true, level: 2 },
      { id: 'M004-03', menuCode: 'QUALITY_DEFECT', menuName: '불량현황', parentId: 'M004', path: '/quality/defect-status', icon: '', sortOrder: 3, isActive: true, isVisible: true, level: 2 },
      { id: 'M004-04', menuCode: 'QUALITY_SPC', menuName: 'SPC관리', parentId: 'M004', path: '/quality/spc', icon: '', sortOrder: 4, isActive: true, isVisible: true, level: 2 },
      { id: 'M004-05', menuCode: 'QUALITY_CLAIM', menuName: '클레임관리', parentId: 'M004', path: '/quality/claim', icon: '', sortOrder: 5, isActive: true, isVisible: true, level: 2 },
    ],
  },
  {
    id: 'M005',
    menuCode: 'EQUIPMENT_MGMT',
    menuName: '설비관리',
    parentId: null,
    path: '/equipment-mgmt',
    icon: 'Cpu',
    sortOrder: 5,
    isActive: true,
    isVisible: true,
    level: 1,
    children: [
      { id: 'M005-01', menuCode: 'EQUIP_UTILIZATION', menuName: '설비가동률', parentId: 'M005', path: '/equipment-mgmt/utilization', icon: '', sortOrder: 1, isActive: true, isVisible: true, level: 2 },
      { id: 'M005-02', menuCode: 'EQUIP_BREAKDOWN', menuName: '고장관리', parentId: 'M005', path: '/equipment-mgmt/breakdown', icon: '', sortOrder: 2, isActive: true, isVisible: true, level: 2 },
      { id: 'M005-03', menuCode: 'EQUIP_PM', menuName: '예방보전', parentId: 'M005', path: '/equipment-mgmt/pm-schedule', icon: '', sortOrder: 3, isActive: true, isVisible: true, level: 2 },
    ],
  },
  {
    id: 'M006',
    menuCode: 'MONITORING',
    menuName: '현황/모니터링',
    parentId: null,
    path: '/monitoring',
    icon: 'Monitor',
    sortOrder: 6,
    isActive: true,
    isVisible: true,
    level: 1,
    children: [
      { id: 'M006-01', menuCode: 'MON_WORK_RESULT', menuName: '작업실적현황', parentId: 'M006', path: '/monitoring/work-result', icon: '', sortOrder: 1, isActive: true, isVisible: true, level: 2 },
      { id: 'M006-02', menuCode: 'MON_LINE_STATUS', menuName: '라인현황', parentId: 'M006', path: '/monitoring/line-status', icon: '', sortOrder: 2, isActive: true, isVisible: true, level: 2 },
      { id: 'M006-03', menuCode: 'MON_REALTIME', menuName: '실시간모니터링', parentId: 'M006', path: '/monitoring/realtime', icon: '', sortOrder: 3, isActive: true, isVisible: true, level: 2 },
      { id: 'M006-04', menuCode: 'MON_OEE', menuName: 'OEE분석', parentId: 'M006', path: '/monitoring/oee', icon: '', sortOrder: 4, isActive: true, isVisible: true, level: 2 },
    ],
  },
  {
    id: 'M007',
    menuCode: 'SYSTEM',
    menuName: '시스템관리',
    parentId: null,
    path: '/system',
    icon: 'Settings',
    sortOrder: 7,
    isActive: true,
    isVisible: true,
    level: 1,
    children: [
      { id: 'M007-01', menuCode: 'SYS_USER', menuName: '사용자관리', parentId: 'M007', path: '/system/user', icon: '', sortOrder: 1, isActive: true, isVisible: true, level: 2 },
      { id: 'M007-02', menuCode: 'SYS_ROLE', menuName: '권한관리', parentId: 'M007', path: '/system/role', icon: '', sortOrder: 2, isActive: true, isVisible: true, level: 2 },
      { id: 'M007-03', menuCode: 'SYS_MENU', menuName: '메뉴관리', parentId: 'M007', path: '/system/menu', icon: '', sortOrder: 3, isActive: true, isVisible: true, level: 2 },
      { id: 'M007-04', menuCode: 'SYS_LOG', menuName: '로그조회', parentId: 'M007', path: '/system/log', icon: '', sortOrder: 4, isActive: true, isVisible: true, level: 2 },
    ],
  },
];

export default function MenuPage() {
  const [menus] = useState<MenuItem[]>(mockMenus);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(mockMenus.map(m => m.id)));
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleMenu = (menuId: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  const renderMenuItem = (menu: MenuItem, level: number = 0) => {
    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedMenus.has(menu.id);
    const isSelected = selectedMenu?.id === menu.id;

    return (
      <div key={menu.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 hover:bg-slate-700/30 cursor-pointer rounded ${isSelected ? 'bg-blue-600/20 border border-blue-500/30' : ''}`}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
          onClick={() => setSelectedMenu(menu)}
        >
          <GripVertical className="w-4 h-4 text-slate-600 cursor-grab" />
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleMenu(menu.id); }}
              className="text-slate-400 hover:text-white"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <span className={`flex-1 text-sm ${menu.isActive ? 'text-white' : 'text-slate-500'}`}>
            {menu.menuName}
          </span>
          <span className="text-slate-500 text-xs font-mono">{menu.menuCode}</span>
          {menu.isVisible ? (
            <Eye className="w-4 h-4 text-green-400" />
          ) : (
            <EyeOff className="w-4 h-4 text-slate-500" />
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {menu.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredMenus = menus.filter(menu =>
    menu.menuName.includes(searchTerm) ||
    menu.menuCode.includes(searchTerm) ||
    menu.children?.some(c => c.menuName.includes(searchTerm) || c.menuCode.includes(searchTerm))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">메뉴관리</h1>
          <p className="text-slate-400 text-sm mt-1">시스템 메뉴 구조 및 설정 관리</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          메뉴 추가
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Menu Tree */}
        <div className="col-span-2 space-y-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="메뉴명, 코드로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
                />
              </div>
              <button
                onClick={() => setExpandedMenus(new Set(menus.map(m => m.id)))}
                className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-sm"
              >
                전체 펼침
              </button>
              <button
                onClick={() => setExpandedMenus(new Set())}
                className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-sm"
              >
                전체 접기
              </button>
            </div>

            <div className="border border-slate-700 rounded-lg divide-y divide-slate-700">
              <div className="flex items-center gap-2 py-2 px-3 bg-slate-700/50 text-sm">
                <span className="w-4" />
                <span className="w-4" />
                <span className="flex-1 text-slate-400">메뉴명</span>
                <span className="text-slate-400 w-32">메뉴코드</span>
                <span className="text-slate-400 w-8">표시</span>
              </div>
              {filteredMenus.map(menu => renderMenuItem(menu))}
            </div>
          </div>
        </div>

        {/* Menu Detail */}
        <div className="col-span-1">
          {selectedMenu ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold">메뉴 상세</h3>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">메뉴명</label>
                  <input
                    type="text"
                    value={selectedMenu.menuName}
                    readOnly
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-1">메뉴코드</label>
                  <input
                    type="text"
                    value={selectedMenu.menuCode}
                    readOnly
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-1">경로 (URL)</label>
                  <input
                    type="text"
                    value={selectedMenu.path}
                    readOnly
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-1">상위 메뉴</label>
                  <input
                    type="text"
                    value={selectedMenu.parentId ? menus.find(m => m.id === selectedMenu.parentId)?.menuName || '-' : '최상위 메뉴'}
                    readOnly
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-sm mb-1">아이콘</label>
                    <input
                      type="text"
                      value={selectedMenu.icon || '-'}
                      readOnly
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-1">정렬순서</label>
                    <input
                      type="number"
                      value={selectedMenu.sortOrder}
                      readOnly
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedMenu.isActive}
                      readOnly
                      className="w-4 h-4 bg-slate-700 border-slate-600 rounded"
                    />
                    <span className="text-white text-sm">사용여부</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedMenu.isVisible}
                      readOnly
                      className="w-4 h-4 bg-slate-700 border-slate-600 rounded"
                    />
                    <span className="text-white text-sm">표시여부</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-700">
                  <button className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
                    취소
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    저장
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <Settings className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">메뉴를 선택하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
