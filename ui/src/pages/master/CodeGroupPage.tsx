import { useState } from 'react';
import { FolderTree, Search, Plus, Edit2, Trash2, ChevronRight, ChevronDown, Settings } from 'lucide-react';

interface CodeGroup {
  id: string;
  groupCode: string;
  groupName: string;
  description: string;
  useYn: boolean;
  sortOrder: number;
  codes: CommonCode[];
}

interface CommonCode {
  id: string;
  code: string;
  codeName: string;
  description: string;
  useYn: boolean;
  sortOrder: number;
}

const mockCodeGroups: CodeGroup[] = [
  {
    id: '1', groupCode: 'EQUIP_TYPE', groupName: '설비유형', description: '설비 분류 유형', useYn: true, sortOrder: 1,
    codes: [
      { id: '1-1', code: 'SMT', codeName: 'SMT 설비', description: 'Surface Mount Technology', useYn: true, sortOrder: 1 },
      { id: '1-2', code: 'THT', codeName: 'THT 설비', description: 'Through Hole Technology', useYn: true, sortOrder: 2 },
      { id: '1-3', code: 'AOI', codeName: 'AOI 검사기', description: 'Automated Optical Inspection', useYn: true, sortOrder: 3 },
      { id: '1-4', code: 'REFLOW', codeName: '리플로우', description: 'Reflow Oven', useYn: true, sortOrder: 4 },
    ]
  },
  {
    id: '2', groupCode: 'DEFECT_TYPE', groupName: '불량유형', description: '제품 불량 분류', useYn: true, sortOrder: 2,
    codes: [
      { id: '2-1', code: 'BRIDGE', codeName: '솔더브릿지', description: '솔더 쇼트', useYn: true, sortOrder: 1 },
      { id: '2-2', code: 'MISSING', codeName: '부품누락', description: '미실장', useYn: true, sortOrder: 2 },
      { id: '2-3', code: 'COLD', codeName: '냉납', description: 'Cold Solder', useYn: true, sortOrder: 3 },
      { id: '2-4', code: 'MISALIGN', codeName: '틀어짐', description: '부품 위치 이탈', useYn: true, sortOrder: 4 },
      { id: '2-5', code: 'TOMBSTONE', codeName: '툼스톤', description: '부품 들림', useYn: true, sortOrder: 5 },
    ]
  },
  {
    id: '3', groupCode: 'LINE_TYPE', groupName: '라인유형', description: '생산라인 분류', useYn: true, sortOrder: 3,
    codes: [
      { id: '3-1', code: 'SMT', codeName: 'SMT라인', description: 'SMT 생산라인', useYn: true, sortOrder: 1 },
      { id: '3-2', code: 'DIP', codeName: 'DIP라인', description: 'DIP 생산라인', useYn: true, sortOrder: 2 },
      { id: '3-3', code: 'ASM', codeName: '조립라인', description: '조립 생산라인', useYn: true, sortOrder: 3 },
      { id: '3-4', code: 'TEST', codeName: '검사라인', description: '검사 라인', useYn: true, sortOrder: 4 },
    ]
  },
  {
    id: '4', groupCode: 'WORK_STATUS', groupName: '작업상태', description: '작업지시 상태', useYn: true, sortOrder: 4,
    codes: [
      { id: '4-1', code: 'PLANNED', codeName: '계획', description: '계획됨', useYn: true, sortOrder: 1 },
      { id: '4-2', code: 'RELEASED', codeName: '출고', description: '자재출고', useYn: true, sortOrder: 2 },
      { id: '4-3', code: 'STARTED', codeName: '시작', description: '작업시작', useYn: true, sortOrder: 3 },
      { id: '4-4', code: 'COMPLETED', codeName: '완료', description: '작업완료', useYn: true, sortOrder: 4 },
      { id: '4-5', code: 'CLOSED', codeName: '마감', description: '마감처리', useYn: true, sortOrder: 5 },
    ]
  },
  {
    id: '5', groupCode: 'UNIT', groupName: '단위', description: '수량 단위', useYn: true, sortOrder: 5,
    codes: [
      { id: '5-1', code: 'EA', codeName: '개', description: '개수', useYn: true, sortOrder: 1 },
      { id: '5-2', code: 'SET', codeName: '세트', description: '세트', useYn: true, sortOrder: 2 },
      { id: '5-3', code: 'BOX', codeName: '박스', description: '박스', useYn: true, sortOrder: 3 },
      { id: '5-4', code: 'ROLL', codeName: '롤', description: '롤', useYn: true, sortOrder: 4 },
      { id: '5-5', code: 'KG', codeName: 'kg', description: '킬로그램', useYn: true, sortOrder: 5 },
    ]
  },
];

export default function CodeGroupPage() {
  const [codeGroups] = useState<CodeGroup[]>(mockCodeGroups);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['1', '2']));
  const [selectedGroup, setSelectedGroup] = useState<CodeGroup | null>(null);
  const [selectedCode, setSelectedCode] = useState<CommonCode | null>(null);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const filteredGroups = codeGroups.filter(group =>
    group.groupName.includes(searchTerm) ||
    group.groupCode.includes(searchTerm) ||
    group.codes.some(code => code.codeName.includes(searchTerm) || code.code.includes(searchTerm))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">코드그룹관리</h1>
          <p className="text-slate-400 text-sm mt-1">시스템 공통코드 그룹 및 상세코드 관리</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          그룹 추가
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 코드그룹 트리 */}
        <div className="col-span-1 bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="코드 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {filteredGroups.map((group) => (
              <div key={group.id}>
                <div
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-slate-700 ${
                    selectedGroup?.id === group.id ? 'bg-slate-700' : ''
                  }`}
                  onClick={() => {
                    setSelectedGroup(group);
                    setSelectedCode(null);
                    toggleGroup(group.id);
                  }}
                >
                  {expandedGroups.has(group.id) ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <FolderTree className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-sm flex-1">{group.groupName}</span>
                  <span className="text-slate-500 text-xs">{group.codes.length}</span>
                </div>
                {expandedGroups.has(group.id) && (
                  <div className="ml-6 space-y-1">
                    {group.codes.map((code) => (
                      <div
                        key={code.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-slate-700/50 ${
                          selectedCode?.id === code.id ? 'bg-slate-700/50' : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGroup(group);
                          setSelectedCode(code);
                        }}
                      >
                        <Settings className="w-3 h-3 text-slate-500" />
                        <span className="text-slate-300 text-sm">{code.codeName}</span>
                        <span className="text-slate-500 text-xs">({code.code})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="col-span-2 space-y-4">
          {selectedGroup && !selectedCode && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">그룹 정보</h3>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm">그룹코드</label>
                  <p className="text-white font-mono mt-1">{selectedGroup.groupCode}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">그룹명</label>
                  <p className="text-white mt-1">{selectedGroup.groupName}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-slate-400 text-sm">설명</label>
                  <p className="text-white mt-1">{selectedGroup.description}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">사용여부</label>
                  <p className={`mt-1 ${selectedGroup.useYn ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedGroup.useYn ? '사용' : '미사용'}
                  </p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">정렬순서</label>
                  <p className="text-white mt-1">{selectedGroup.sortOrder}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-medium">상세코드 목록</h4>
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    <Plus className="w-3 h-3" />
                    코드 추가
                  </button>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="text-left text-slate-400 font-medium px-3 py-2 text-sm">코드</th>
                      <th className="text-left text-slate-400 font-medium px-3 py-2 text-sm">코드명</th>
                      <th className="text-left text-slate-400 font-medium px-3 py-2 text-sm">설명</th>
                      <th className="text-center text-slate-400 font-medium px-3 py-2 text-sm">사용</th>
                      <th className="text-center text-slate-400 font-medium px-3 py-2 text-sm">순서</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {selectedGroup.codes.map((code) => (
                      <tr key={code.id} className="hover:bg-slate-700/30">
                        <td className="px-3 py-2 text-white font-mono text-sm">{code.code}</td>
                        <td className="px-3 py-2 text-white text-sm">{code.codeName}</td>
                        <td className="px-3 py-2 text-slate-400 text-sm">{code.description}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs ${code.useYn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {code.useYn ? 'Y' : 'N'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-slate-400 text-sm">{code.sortOrder}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedCode && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">코드 상세</h3>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm">그룹</label>
                  <p className="text-white mt-1">{selectedGroup?.groupName}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">코드</label>
                  <p className="text-white font-mono mt-1">{selectedCode.code}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">코드명</label>
                  <p className="text-white mt-1">{selectedCode.codeName}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">사용여부</label>
                  <p className={`mt-1 ${selectedCode.useYn ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedCode.useYn ? '사용' : '미사용'}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-slate-400 text-sm">설명</label>
                  <p className="text-white mt-1">{selectedCode.description}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">정렬순서</label>
                  <p className="text-white mt-1">{selectedCode.sortOrder}</p>
                </div>
              </div>
            </div>
          )}

          {!selectedGroup && !selectedCode && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <FolderTree className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">코드그룹 또는 코드를 선택하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
