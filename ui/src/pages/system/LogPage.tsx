import { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  User,
  Activity,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle,
  Clock,
  Terminal,
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug' | 'success';
  category: 'system' | 'user' | 'api' | 'security' | 'production' | 'equipment';
  userId?: string;
  userName?: string;
  action: string;
  detail: string;
  ipAddress?: string;
  module?: string;
}

// Mock 로그 데이터 생성
const generateMockLogs = (): LogEntry[] => {
  const logs: LogEntry[] = [];
  const now = new Date();

  const actions = [
    { level: 'info' as const, category: 'user' as const, action: '로그인', detail: '시스템 로그인 성공' },
    { level: 'info' as const, category: 'user' as const, action: '로그아웃', detail: '시스템 로그아웃' },
    { level: 'warning' as const, category: 'security' as const, action: '로그인 실패', detail: '비밀번호 불일치 (시도: 3회)' },
    { level: 'error' as const, category: 'security' as const, action: '계정 잠금', detail: '비밀번호 5회 연속 실패로 계정 잠금' },
    { level: 'info' as const, category: 'production' as const, action: '작업지시 생성', detail: 'WO-2024-0001 작업지시 등록' },
    { level: 'success' as const, category: 'production' as const, action: '생산실적 등록', detail: 'SMT-L01 라인 생산실적 120EA 등록' },
    { level: 'warning' as const, category: 'equipment' as const, action: '설비 경고', detail: 'EQ-001 SMT마운터 온도 상승 경고' },
    { level: 'error' as const, category: 'equipment' as const, action: '설비 고장', detail: 'EQ-003 리플로우오븐 긴급 정지' },
    { level: 'info' as const, category: 'api' as const, action: 'API 호출', detail: 'GET /api/v1/production/results 200 OK' },
    { level: 'error' as const, category: 'api' as const, action: 'API 오류', detail: 'POST /api/v1/equipment/status 500 Internal Error' },
    { level: 'debug' as const, category: 'system' as const, action: '배치 작업', detail: '일일 데이터 집계 배치 시작' },
    { level: 'success' as const, category: 'system' as const, action: '배치 완료', detail: '일일 데이터 집계 완료 (소요시간: 45초)' },
    { level: 'info' as const, category: 'user' as const, action: '데이터 조회', detail: '불량현황 리포트 조회' },
    { level: 'info' as const, category: 'user' as const, action: '데이터 수정', detail: '품목마스터 P-001 수정' },
    { level: 'warning' as const, category: 'production' as const, action: '재고 경고', detail: 'M-002 자재 안전재고 미달 (현재: 50EA)' },
  ];

  const users = [
    { id: 'admin', name: '시스템관리자' },
    { id: 'prod_manager', name: '김생산' },
    { id: 'quality_mgr', name: '이품질' },
    { id: 'equip_tech', name: '박설비' },
    { id: 'operator1', name: '최작업' },
  ];

  const modules = ['MES-Production', 'MES-Equipment', 'MES-Quality', 'ERP-Inventory', 'System-Auth', 'System-Batch'];
  const ips = ['192.168.1.101', '192.168.1.102', '192.168.1.103', '10.0.0.50', '10.0.0.51'];

  for (let i = 0; i < 100; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);

    logs.push({
      id: `LOG-${String(i + 1).padStart(6, '0')}`,
      timestamp: timestamp.toISOString().replace('T', ' ').substring(0, 19),
      level: action.level,
      category: action.category,
      userId: action.category !== 'system' ? user.id : undefined,
      userName: action.category !== 'system' ? user.name : undefined,
      action: action.action,
      detail: action.detail,
      ipAddress: ips[Math.floor(Math.random() * ips.length)],
      module: modules[Math.floor(Math.random() * modules.length)],
    });
  }

  return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
};

const mockLogs = generateMockLogs();

export default function LogPage() {
  const [logs] = useState<LogEntry[]>(mockLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesCategory = filterCategory === 'all' || log.category === filterCategory;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return <Info className="w-4 h-4 text-blue-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'debug': return <Terminal className="w-4 h-4 text-slate-400" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'debug': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'success': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getLevelText = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return 'INFO';
      case 'warning': return 'WARN';
      case 'error': return 'ERROR';
      case 'debug': return 'DEBUG';
      case 'success': return 'SUCCESS';
      default: return level.toUpperCase();
    }
  };

  const getCategoryColor = (category: LogEntry['category']) => {
    switch (category) {
      case 'system': return 'bg-purple-500/20 text-purple-400';
      case 'user': return 'bg-blue-500/20 text-blue-400';
      case 'api': return 'bg-cyan-500/20 text-cyan-400';
      case 'security': return 'bg-red-500/20 text-red-400';
      case 'production': return 'bg-green-500/20 text-green-400';
      case 'equipment': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getCategoryText = (category: LogEntry['category']) => {
    switch (category) {
      case 'system': return '시스템';
      case 'user': return '사용자';
      case 'api': return 'API';
      case 'security': return '보안';
      case 'production': return '생산';
      case 'equipment': return '설비';
      default: return category;
    }
  };

  // 통계
  const stats = {
    total: logs.length,
    info: logs.filter(l => l.level === 'info').length,
    warning: logs.filter(l => l.level === 'warning').length,
    error: logs.filter(l => l.level === 'error').length,
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">로그조회</h1>
          <p className="text-slate-400 text-sm mt-1">시스템 활동 로그 및 감사 이력 조회</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            내보내기
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">전체 로그</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-slate-500" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">정보</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{stats.info}</p>
            </div>
            <Info className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">경고</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.warning}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">오류</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{stats.error}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="액션, 상세내용, 사용자명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
          />
        </div>
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">전체 레벨</option>
          <option value="info">INFO</option>
          <option value="warning">WARNING</option>
          <option value="error">ERROR</option>
          <option value="debug">DEBUG</option>
          <option value="success">SUCCESS</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">전체 카테고리</option>
          <option value="system">시스템</option>
          <option value="user">사용자</option>
          <option value="api">API</option>
          <option value="security">보안</option>
          <option value="production">생산</option>
          <option value="equipment">설비</option>
        </select>
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        />
        <span className="text-slate-400">~</span>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 로그 목록 */}
        <div className="col-span-2 bg-slate-800 rounded-xl border border-slate-700">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50 sticky top-0">
                <tr>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">시간</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">레벨</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">카테고리</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">액션</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">사용자</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`hover:bg-slate-700/30 cursor-pointer ${
                      selectedLog?.id === log.id ? 'bg-slate-700/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Clock className="w-3 h-3" />
                        <span className="font-mono">{log.timestamp}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getLevelColor(log.level)}`}>
                        {getLevelIcon(log.level)}
                        {getLevelText(log.level)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(log.category)}`}>
                        {getCategoryText(log.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{log.action}</p>
                      <p className="text-slate-500 text-xs truncate max-w-[200px]">{log.detail}</p>
                    </td>
                    <td className="px-4 py-3">
                      {log.userName ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-300 text-sm">{log.userName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 상세 패널 */}
        <div className="col-span-1">
          {selectedLog ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">로그 상세</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getLevelColor(selectedLog.level)}`}>
                  {getLevelIcon(selectedLog.level)}
                  {getLevelText(selectedLog.level)}
                </span>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-slate-400 text-xs mb-1">로그 ID</p>
                  <p className="text-white font-mono">{selectedLog.id}</p>
                </div>

                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-slate-400 text-xs mb-1">발생 시간</p>
                  <p className="text-white font-mono">{selectedLog.timestamp}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-slate-400 text-xs mb-1">카테고리</p>
                    <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(selectedLog.category)}`}>
                      {getCategoryText(selectedLog.category)}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-slate-400 text-xs mb-1">모듈</p>
                    <p className="text-white text-sm">{selectedLog.module}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-slate-400 text-xs mb-1">액션</p>
                  <p className="text-white font-medium">{selectedLog.action}</p>
                </div>

                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-slate-400 text-xs mb-1">상세 내용</p>
                  <p className="text-white text-sm">{selectedLog.detail}</p>
                </div>

                {selectedLog.userName && (
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-slate-400 text-xs mb-1">사용자</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{selectedLog.userName.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-white text-sm">{selectedLog.userName}</p>
                        <p className="text-slate-500 text-xs">{selectedLog.userId}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedLog.ipAddress && (
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-slate-400 text-xs mb-1">IP 주소</p>
                    <p className="text-white font-mono">{selectedLog.ipAddress}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">로그를 선택하세요</p>
              <p className="text-slate-500 text-sm mt-1">상세 정보를 확인할 수 있습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
