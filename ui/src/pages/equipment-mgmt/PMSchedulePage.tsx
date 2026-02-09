import { useState } from 'react';
import {
  Calendar,
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Settings,
  FileText,
} from 'lucide-react';

interface PMPlan {
  id: string;
  equipmentId: string;
  equipmentName: string;
  lineName: string;
  maintenanceType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  taskName: string;
  scheduledDate: string;
  assignee: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'skipped';
  estimatedHours: number;
  actualHours?: number;
  checklist: { item: string; completed: boolean }[];
  notes?: string;
}

// Mock 데이터
const generateMockPMPlans = (): PMPlan[] => {
  const equipments = [
    { id: 'EQ-001', name: 'SMT 마운터 #1', line: 'SMT-L01' },
    { id: 'EQ-002', name: 'SMT 마운터 #2', line: 'SMT-L01' },
    { id: 'EQ-003', name: '리플로우 오븐 #1', line: 'SMT-L01' },
    { id: 'EQ-004', name: 'AOI 검사기 #1', line: 'SMT-L02' },
    { id: 'EQ-005', name: '인쇄기 #1', line: 'SMT-L02' },
    { id: 'EQ-006', name: '조립 로봇 #1', line: 'ASM-L01' },
  ];

  const maintenanceTasks: Record<string, { name: string; hours: number; checklist: string[] }[]> = {
    daily: [
      { name: '일일 청소 및 점검', hours: 0.5, checklist: ['외관 청소', '이물질 제거', '오작동 확인'] },
    ],
    weekly: [
      { name: '주간 윤활유 점검', hours: 1, checklist: ['윤활유 레벨 확인', '누유 점검', '보충 필요시 보충'] },
      { name: '주간 필터 점검', hours: 0.5, checklist: ['필터 상태 확인', '청소 또는 교체'] },
    ],
    monthly: [
      { name: '월간 교정 점검', hours: 2, checklist: ['위치 정확도 측정', '온도 센서 교정', '압력 센서 교정'] },
      { name: '월간 벨트 점검', hours: 1, checklist: ['벨트 장력 확인', '마모 상태 점검', '필요시 교체'] },
    ],
    quarterly: [
      { name: '분기 정밀 점검', hours: 4, checklist: ['전체 부품 점검', '성능 테스트', '부품 교체 필요 확인'] },
    ],
    yearly: [
      { name: '연간 오버홀', hours: 16, checklist: ['전체 분해 점검', '주요 부품 교체', '성능 최적화', '재조립 및 테스트'] },
    ],
  };

  const assignees = ['김정비', '이보전', '박기술', '최엔지', '정관리'];
  const statuses: PMPlan['status'][] = ['scheduled', 'in_progress', 'completed', 'overdue', 'skipped'];

  const plans: PMPlan[] = [];
  let id = 1;

  const today = new Date();

  // 이번 달의 PM 계획 생성
  equipments.forEach(eq => {
    // 일일 점검 (앞으로 7일)
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const task = maintenanceTasks.daily[0];
      const status = i < 0 ? (Math.random() > 0.2 ? 'completed' : 'overdue') :
                     i === 0 ? (Math.random() > 0.5 ? 'in_progress' : 'scheduled') : 'scheduled';

      plans.push({
        id: `PM-${String(id++).padStart(5, '0')}`,
        equipmentId: eq.id,
        equipmentName: eq.name,
        lineName: eq.line,
        maintenanceType: 'daily',
        taskName: task.name,
        scheduledDate: date.toISOString().split('T')[0],
        assignee: assignees[Math.floor(Math.random() * assignees.length)],
        status,
        estimatedHours: task.hours,
        actualHours: status === 'completed' ? task.hours * (0.8 + Math.random() * 0.4) : undefined,
        checklist: task.checklist.map(item => ({ item, completed: status === 'completed' })),
      });
    }

    // 주간 점검
    const weekTask = maintenanceTasks.weekly[Math.floor(Math.random() * maintenanceTasks.weekly.length)];
    const weekDate = new Date(today);
    weekDate.setDate(weekDate.getDate() + (7 - weekDate.getDay()));
    plans.push({
      id: `PM-${String(id++).padStart(5, '0')}`,
      equipmentId: eq.id,
      equipmentName: eq.name,
      lineName: eq.line,
      maintenanceType: 'weekly',
      taskName: weekTask.name,
      scheduledDate: weekDate.toISOString().split('T')[0],
      assignee: assignees[Math.floor(Math.random() * assignees.length)],
      status: 'scheduled',
      estimatedHours: weekTask.hours,
      checklist: weekTask.checklist.map(item => ({ item, completed: false })),
    });

    // 월간 점검
    const monthTask = maintenanceTasks.monthly[Math.floor(Math.random() * maintenanceTasks.monthly.length)];
    const monthDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);
    plans.push({
      id: `PM-${String(id++).padStart(5, '0')}`,
      equipmentId: eq.id,
      equipmentName: eq.name,
      lineName: eq.line,
      maintenanceType: 'monthly',
      taskName: monthTask.name,
      scheduledDate: monthDate.toISOString().split('T')[0],
      assignee: assignees[Math.floor(Math.random() * assignees.length)],
      status: 'scheduled',
      estimatedHours: monthTask.hours,
      checklist: monthTask.checklist.map(item => ({ item, completed: false })),
    });
  });

  return plans;
};

const mockPMPlans = generateMockPMPlans();

export default function PMSchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPlan, setSelectedPlan] = useState<PMPlan | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const getStatusColor = (status: PMPlan['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'scheduled': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'skipped': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusText = (status: PMPlan['status']) => {
    switch (status) {
      case 'completed': return '완료';
      case 'in_progress': return '진행중';
      case 'scheduled': return '예정';
      case 'overdue': return '지연';
      case 'skipped': return '건너뜀';
      default: return status;
    }
  };

  const getTypeColor = (type: PMPlan['maintenanceType']) => {
    switch (type) {
      case 'daily': return 'bg-emerald-500/20 text-emerald-400';
      case 'weekly': return 'bg-blue-500/20 text-blue-400';
      case 'monthly': return 'bg-purple-500/20 text-purple-400';
      case 'quarterly': return 'bg-orange-500/20 text-orange-400';
      case 'yearly': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getTypeText = (type: PMPlan['maintenanceType']) => {
    switch (type) {
      case 'daily': return '일일';
      case 'weekly': return '주간';
      case 'monthly': return '월간';
      case 'quarterly': return '분기';
      case 'yearly': return '연간';
      default: return type;
    }
  };

  // 캘린더 데이터 생성
  const getCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: { date: Date; isCurrentMonth: boolean; plans: PMPlan[] }[] = [];

    // 이전 달의 날짜들
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        plans: mockPMPlans.filter(p => p.scheduledDate === date.toISOString().split('T')[0]),
      });
    }

    // 현재 달의 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        plans: mockPMPlans.filter(p => p.scheduledDate === date.toISOString().split('T')[0]),
      });
    }

    // 다음 달의 날짜들
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        plans: mockPMPlans.filter(p => p.scheduledDate === date.toISOString().split('T')[0]),
      });
    }

    return days;
  };

  const calendarDays = getCalendarDays();

  // 필터된 목록
  const filteredPlans = mockPMPlans.filter(plan => {
    if (filterType !== 'all' && plan.maintenanceType !== filterType) return false;
    if (filterStatus !== 'all' && plan.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  // 통계
  const stats = {
    total: mockPMPlans.length,
    completed: mockPMPlans.filter(p => p.status === 'completed').length,
    inProgress: mockPMPlans.filter(p => p.status === 'in_progress').length,
    scheduled: mockPMPlans.filter(p => p.status === 'scheduled').length,
    overdue: mockPMPlans.filter(p => p.status === 'overdue').length,
  };

  const prevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">PM계획</h1>
          <p className="text-slate-400 text-sm mt-1">예방보전 일정 및 점검 계획 관리</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            PM 계획 등록
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">전체 계획</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <Calendar className="w-8 h-8 text-slate-500" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">완료</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{stats.completed}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">진행중</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{stats.inProgress}</p>
            </div>
            <Wrench className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">예정</p>
              <p className="text-2xl font-bold text-slate-300 mt-1">{stats.scheduled}</p>
            </div>
            <Clock className="w-8 h-8 text-slate-500" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">지연</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{stats.overdue}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* 뷰 모드 & 필터 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              캘린더
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              목록
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="all">전체 유형</option>
            <option value="daily">일일</option>
            <option value="weekly">주간</option>
            <option value="monthly">월간</option>
            <option value="quarterly">분기</option>
            <option value="yearly">연간</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="all">전체 상태</option>
            <option value="scheduled">예정</option>
            <option value="in_progress">진행중</option>
            <option value="completed">완료</option>
            <option value="overdue">지연</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 메인 콘텐츠 */}
        <div className="col-span-2">
          {viewMode === 'calendar' ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              {/* 캘린더 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-2 hover:bg-slate-700 rounded-lg">
                  <ChevronLeft className="w-5 h-5 text-slate-400" />
                </button>
                <h2 className="text-lg font-bold text-white">
                  {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
                </h2>
                <button onClick={nextMonth} className="p-2 hover:bg-slate-700 rounded-lg">
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                  <div key={day} className={`text-center py-2 text-sm font-medium ${
                    index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-slate-400'
                  }`}>
                    {day}
                  </div>
                ))}
              </div>

              {/* 캘린더 그리드 */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const isToday = day.date.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 rounded-lg border ${
                        day.isCurrentMonth
                          ? isToday
                            ? 'bg-blue-500/10 border-blue-500/30'
                            : 'bg-slate-700/30 border-slate-700'
                          : 'bg-slate-800/50 border-slate-800'
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        day.isCurrentMonth
                          ? isToday
                            ? 'text-blue-400'
                            : index % 7 === 0
                              ? 'text-red-400'
                              : index % 7 === 6
                                ? 'text-blue-400'
                                : 'text-white'
                          : 'text-slate-600'
                      }`}>
                        {day.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {day.plans.slice(0, 3).map((plan) => (
                          <div
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan)}
                            className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer ${getTypeColor(plan.maintenanceType)}`}
                          >
                            {plan.equipmentName.substring(0, 8)}...
                          </div>
                        ))}
                        {day.plans.length > 3 && (
                          <div className="text-xs text-slate-500">+{day.plans.length - 3}개</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">PM ID</th>
                      <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">설비</th>
                      <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">작업내용</th>
                      <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">유형</th>
                      <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">예정일</th>
                      <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">담당자</th>
                      <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredPlans.map((plan) => (
                      <tr
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className="hover:bg-slate-700/30 cursor-pointer"
                      >
                        <td className="px-4 py-3 text-white font-mono text-sm">{plan.id}</td>
                        <td className="px-4 py-3">
                          <div className="text-white text-sm">{plan.equipmentName}</div>
                          <div className="text-slate-500 text-xs">{plan.lineName}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-sm">{plan.taskName}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${getTypeColor(plan.maintenanceType)}`}>
                            {getTypeText(plan.maintenanceType)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-sm">{plan.scheduledDate}</td>
                        <td className="px-4 py-3 text-slate-300 text-sm">{plan.assignee}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(plan.status)}`}>
                            {getStatusText(plan.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 상세 패널 */}
        <div className="col-span-1">
          {selectedPlan ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">PM 상세</h3>
                <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(selectedPlan.status)}`}>
                  {getStatusText(selectedPlan.status)}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-xs mb-1">PM ID</p>
                  <p className="text-white font-mono">{selectedPlan.id}</p>
                </div>

                <div>
                  <p className="text-slate-400 text-xs mb-1">설비</p>
                  <p className="text-white">{selectedPlan.equipmentName}</p>
                  <p className="text-slate-500 text-sm">{selectedPlan.lineName}</p>
                </div>

                <div>
                  <p className="text-slate-400 text-xs mb-1">작업내용</p>
                  <p className="text-white">{selectedPlan.taskName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">유형</p>
                    <span className={`px-2 py-1 rounded text-xs ${getTypeColor(selectedPlan.maintenanceType)}`}>
                      {getTypeText(selectedPlan.maintenanceType)}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">예정일</p>
                    <p className="text-white">{selectedPlan.scheduledDate}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">담당자</p>
                    <p className="text-white">{selectedPlan.assignee}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">예상시간</p>
                    <p className="text-white">{selectedPlan.estimatedHours}시간</p>
                  </div>
                </div>

                {selectedPlan.actualHours && (
                  <div>
                    <p className="text-slate-400 text-xs mb-1">실제시간</p>
                    <p className="text-white">{selectedPlan.actualHours.toFixed(1)}시간</p>
                  </div>
                )}

                <div>
                  <p className="text-slate-400 text-xs mb-2">점검 체크리스트</p>
                  <div className="space-y-2">
                    {selectedPlan.checklist.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          item.completed ? 'bg-green-500 border-green-500' : 'border-slate-600'
                        }`}>
                          {item.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-sm ${item.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                          {item.item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-700">
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    <Settings className="w-4 h-4 inline mr-1" />
                    작업 시작
                  </button>
                  <button className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm">
                    수정
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">PM 계획을 선택하세요</p>
              <p className="text-slate-500 text-sm mt-1">상세 정보를 확인할 수 있습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
