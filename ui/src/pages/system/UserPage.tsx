import { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Key,
  Shield,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react';

interface User {
  id: string;
  userId: string;
  userName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  roles: string[];
  status: 'active' | 'inactive' | 'locked';
  lastLogin?: string;
  createdAt: string;
  createdBy: string;
}

// Mock 데이터
const mockUsers: User[] = [
  {
    id: '1',
    userId: 'admin',
    userName: '시스템관리자',
    email: 'admin@greenboard.co.kr',
    phone: '010-1234-5678',
    department: '정보시스템팀',
    position: '팀장',
    roles: ['ADMIN', 'USER'],
    status: 'active',
    lastLogin: '2024-01-15 09:30:00',
    createdAt: '2023-01-01',
    createdBy: 'system',
  },
  {
    id: '2',
    userId: 'prod_manager',
    userName: '김생산',
    email: 'kimprod@greenboard.co.kr',
    phone: '010-2345-6789',
    department: '생산관리팀',
    position: '과장',
    roles: ['PRODUCTION_MANAGER', 'USER'],
    status: 'active',
    lastLogin: '2024-01-15 08:15:00',
    createdAt: '2023-03-15',
    createdBy: 'admin',
  },
  {
    id: '3',
    userId: 'quality_mgr',
    userName: '이품질',
    email: 'leequal@greenboard.co.kr',
    phone: '010-3456-7890',
    department: '품질관리팀',
    position: '과장',
    roles: ['QUALITY_MANAGER', 'USER'],
    status: 'active',
    lastLogin: '2024-01-14 17:45:00',
    createdAt: '2023-04-20',
    createdBy: 'admin',
  },
  {
    id: '4',
    userId: 'equip_tech',
    userName: '박설비',
    email: 'parkequip@greenboard.co.kr',
    phone: '010-4567-8901',
    department: '설비팀',
    position: '대리',
    roles: ['EQUIPMENT_TECH', 'USER'],
    status: 'active',
    lastLogin: '2024-01-15 07:00:00',
    createdAt: '2023-05-10',
    createdBy: 'admin',
  },
  {
    id: '5',
    userId: 'operator1',
    userName: '최작업',
    email: 'choiop@greenboard.co.kr',
    phone: '010-5678-9012',
    department: '생산1팀',
    position: '사원',
    roles: ['OPERATOR', 'USER'],
    status: 'active',
    lastLogin: '2024-01-15 06:30:00',
    createdAt: '2023-06-01',
    createdBy: 'prod_manager',
  },
  {
    id: '6',
    userId: 'erp_user',
    userName: '정경영',
    email: 'jungerp@greenboard.co.kr',
    phone: '010-6789-0123',
    department: '경영지원팀',
    position: '차장',
    roles: ['ERP_USER', 'USER'],
    status: 'inactive',
    lastLogin: '2024-01-10 14:20:00',
    createdAt: '2023-02-28',
    createdBy: 'admin',
  },
  {
    id: '7',
    userId: 'warehouse',
    userName: '한창고',
    email: 'hanwh@greenboard.co.kr',
    phone: '010-7890-1234',
    department: '물류팀',
    position: '대리',
    roles: ['WAREHOUSE', 'USER'],
    status: 'locked',
    lastLogin: '2024-01-05 10:00:00',
    createdAt: '2023-07-15',
    createdBy: 'admin',
  },
];

const roleLabels: Record<string, string> = {
  ADMIN: '시스템관리자',
  USER: '일반사용자',
  PRODUCTION_MANAGER: '생산관리자',
  QUALITY_MANAGER: '품질관리자',
  EQUIPMENT_TECH: '설비기술자',
  OPERATOR: '작업자',
  ERP_USER: 'ERP사용자',
  WAREHOUSE: '창고관리자',
};

const departments = ['정보시스템팀', '생산관리팀', '생산1팀', '생산2팀', '품질관리팀', '설비팀', '물류팀', '경영지원팀'];

export default function UserPage() {
  const [users] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'all' || user.department === filterDept;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'locked': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusText = (status: User['status']) => {
    switch (status) {
      case 'active': return '활성';
      case 'inactive': return '비활성';
      case 'locked': return '잠금';
      default: return status;
    }
  };

  const getStatusIcon = (status: User['status']) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-slate-400" />;
      case 'locked': return <Key className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  // 통계
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    locked: users.filter(u => u.status === 'locked').length,
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">사용자관리</h1>
          <p className="text-slate-400 text-sm mt-1">시스템 사용자 계정 및 권한 관리</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          사용자 등록
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">전체 사용자</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-slate-500" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">활성</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{stats.active}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">비활성</p>
              <p className="text-2xl font-bold text-slate-400 mt-1">{stats.inactive}</p>
            </div>
            <XCircle className="w-8 h-8 text-slate-500" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">잠금</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{stats.locked}</p>
            </div>
            <Key className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="사용자명, ID, 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
          />
        </div>
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">전체 부서</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">전체 상태</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
          <option value="locked">잠금</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 사용자 목록 */}
        <div className="col-span-2 bg-slate-800 rounded-xl border border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">사용자</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">부서/직급</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">역할</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">상태</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">최근 로그인</th>
                  <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`hover:bg-slate-700/30 cursor-pointer ${
                      selectedUser?.id === user.id ? 'bg-slate-700/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">{user.userName.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.userName}</p>
                          <p className="text-slate-400 text-sm">{user.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{user.department}</p>
                      <p className="text-slate-400 text-xs">{user.position}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.slice(0, 2).map((role) => (
                          <span
                            key={role}
                            className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded"
                          >
                            {roleLabels[role] || role}
                          </span>
                        ))}
                        {user.roles.length > 2 && (
                          <span className="text-slate-500 text-xs">+{user.roles.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getStatusColor(user.status)}`}>
                        {getStatusIcon(user.status)}
                        {getStatusText(user.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.lastLogin ? (
                        <div className="flex items-center gap-1 text-slate-400 text-sm">
                          <Clock className="w-3 h-3" />
                          {user.lastLogin.split(' ')[0]}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 상세 패널 */}
        <div className="col-span-1">
          {selectedUser ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 sticky top-4">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-2xl font-bold">{selectedUser.userName.charAt(0)}</span>
                </div>
                <h3 className="text-xl font-bold text-white">{selectedUser.userName}</h3>
                <p className="text-slate-400">{selectedUser.userId}</p>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border mt-2 ${getStatusColor(selectedUser.status)}`}>
                  {getStatusIcon(selectedUser.status)}
                  {getStatusText(selectedUser.status)}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-slate-400 text-xs">이메일</p>
                    <p className="text-white text-sm">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-slate-400 text-xs">전화번호</p>
                    <p className="text-white text-sm">{selectedUser.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <Building className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-slate-400 text-xs">부서 / 직급</p>
                    <p className="text-white text-sm">{selectedUser.department} / {selectedUser.position}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-slate-400" />
                    <p className="text-slate-400 text-xs">역할</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedUser.roles.map((role) => (
                      <span
                        key={role}
                        className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded"
                      >
                        {roleLabels[role] || role}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <p className="text-slate-400 text-xs">최근 로그인</p>
                  </div>
                  <p className="text-white text-sm">{selectedUser.lastLogin || '-'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-slate-700/30 rounded">
                    <p className="text-slate-400 text-xs">등록일</p>
                    <p className="text-white">{selectedUser.createdAt}</p>
                  </div>
                  <div className="p-2 bg-slate-700/30 rounded">
                    <p className="text-slate-400 text-xs">등록자</p>
                    <p className="text-white">{selectedUser.createdBy}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-700">
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    <Edit2 className="w-4 h-4 inline mr-1" />
                    수정
                  </button>
                  <button className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm">
                    <Key className="w-4 h-4 inline mr-1" />
                    비밀번호 초기화
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">사용자를 선택하세요</p>
              <p className="text-slate-500 text-sm mt-1">상세 정보를 확인할 수 있습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
