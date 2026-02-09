import { useState } from 'react';
import { Clock, Search, Filter, Calendar, ChevronLeft, ChevronRight, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  workDate: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  overtimeHours: number;
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'half_day' | 'holiday' | 'leave';
  leaveType: string | null;
  remark: string | null;
}

const statusLabels: Record<string, string> = {
  present: '정상출근',
  absent: '결근',
  late: '지각',
  early_leave: '조퇴',
  half_day: '반차',
  holiday: '휴일',
  leave: '휴가',
};

const leaveTypeLabels: Record<string, string> = {
  annual: '연차',
  sick: '병가',
  special: '경조사',
  maternity: '출산휴가',
  paternity: '육아휴직',
};

// 이번 달 날짜 생성
const generateMonthDates = (year: number, month: number) => {
  const dates: string[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return dates;
};

// 오늘 날짜의 근태 기록 생성
const generateTodayAttendance = (): AttendanceRecord[] => {
  const today = new Date().toISOString().split('T')[0];
  const employees = [
    { id: 'EMP-010', name: '박인사', dept: '인사팀' },
    { id: 'EMP-020', name: '최재무', dept: '재무팀' },
    { id: 'EMP-110', name: '이에스엠티', dept: 'SMT팀' },
    { id: 'EMP-120', name: '박조립', dept: '조립팀' },
    { id: 'EMP-201', name: '정영업', dept: '국내영업팀' },
    { id: 'EMP-301', name: '한연구', dept: '연구소' },
    { id: 'EMP-401', name: '김신입', dept: 'SMT팀' },
    { id: 'EMP-501', name: '이인턴', dept: '연구소' },
    { id: 'EMP-111', name: '최휴직', dept: '품질팀' },
  ];

  return employees.map((emp, index) => {
    let status: AttendanceRecord['status'] = 'present';
    let checkIn = '08:55';
    let checkOut = '18:05';
    let workHours = 9;
    let overtimeHours = 0;
    let leaveType = null;
    let remark = null;

    // 다양한 케이스 생성
    if (index === 2) {
      status = 'late';
      checkIn = '09:15';
      remark = '교통체증';
    } else if (index === 4) {
      status = 'leave';
      checkIn = null;
      checkOut = null;
      workHours = null;
      leaveType = 'annual';
    } else if (index === 6) {
      status = 'early_leave';
      checkOut = '15:30';
      workHours = 6.5;
      remark = '병원 예약';
    } else if (index === 8) {
      status = 'leave';
      checkIn = null;
      checkOut = null;
      workHours = null;
      leaveType = 'sick';
    } else if (index === 3) {
      overtimeHours = 2;
      checkOut = '20:10';
      workHours = 11;
    }

    return {
      id: `ATT-${index + 1}`,
      employeeId: emp.id,
      employeeName: emp.name,
      departmentName: emp.dept,
      workDate: today,
      checkIn,
      checkOut,
      workHours,
      overtimeHours,
      status,
      leaveType,
      remark,
    };
  });
};

const mockAttendance = generateTodayAttendance();

export default function AttendancePage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const monthDates = generateMonthDates(currentYear, currentMonth);

  const filteredRecords = mockAttendance.filter(record => {
    const matchesSearch =
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const presentCount = mockAttendance.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'early_leave').length;
  const absentCount = mockAttendance.filter(r => r.status === 'absent').length;
  const leaveCount = mockAttendance.filter(r => r.status === 'leave' || r.status === 'half_day').length;
  const lateCount = mockAttendance.filter(r => r.status === 'late').length;

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500/20 text-green-400';
      case 'absent': return 'bg-red-500/20 text-red-400';
      case 'late': return 'bg-orange-500/20 text-orange-400';
      case 'early_leave': return 'bg-yellow-500/20 text-yellow-400';
      case 'half_day': return 'bg-purple-500/20 text-purple-400';
      case 'holiday': return 'bg-blue-500/20 text-blue-400';
      case 'leave': return 'bg-cyan-500/20 text-cyan-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getDayOfWeek = (dateStr: string) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[new Date(dateStr).getDay()];
  };

  const isWeekend = (dateStr: string) => {
    const day = new Date(dateStr).getDay();
    return day === 0 || day === 6;
  };

  const isToday = (dateStr: string) => {
    return dateStr === today.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">근태관리</h1>
          <p className="text-slate-400">출퇴근 기록 및 근태 현황 관리</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Clock className="w-4 h-4" />
          출근 처리
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">출근</p>
              <p className="text-xl font-bold text-white">{presentCount}명</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">결근</p>
              <p className="text-xl font-bold text-white">{absentCount}명</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">휴가/반차</p>
              <p className="text-xl font-bold text-white">{leaveCount}명</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">지각</p>
              <p className="text-xl font-bold text-white">{lateCount}명</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <h3 className="text-white font-medium text-lg">
            {currentYear}년 {currentMonth + 1}월
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
            <div
              key={day}
              className={`text-center py-2 text-sm font-medium ${
                index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-slate-400'
              }`}
            >
              {day}
            </div>
          ))}
          {/* 첫 주 빈 칸 */}
          {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2" />
          ))}
          {/* 날짜 */}
          {monthDates.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`p-2 rounded-lg text-sm transition-colors ${
                selectedDate === date
                  ? 'bg-blue-600 text-white'
                  : isToday(date)
                  ? 'bg-blue-500/20 text-blue-400'
                  : isWeekend(date)
                  ? 'text-slate-500 hover:bg-slate-700'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {parseInt(date.split('-')[2])}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="사번, 이름 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
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

      {/* Date Info */}
      <div className="flex items-center gap-2 text-slate-400">
        <Calendar className="w-4 h-4" />
        <span>{selectedDate} ({getDayOfWeek(selectedDate)})</span>
        {isWeekend(selectedDate) && (
          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">휴일</span>
        )}
      </div>

      {/* Attendance List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">사번</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">이름</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">부서</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">출근시간</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">퇴근시간</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">근무시간</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">연장근무</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-blue-400 font-mono text-sm">{record.employeeId}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">{record.employeeName}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{record.departmentName}</td>
                  <td className="px-4 py-3 text-center">
                    {record.checkIn ? (
                      <span className={record.status === 'late' ? 'text-orange-400' : 'text-white'}>
                        {record.checkIn}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {record.checkOut ? (
                      <span className={record.status === 'early_leave' ? 'text-yellow-400' : 'text-white'}>
                        {record.checkOut}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-white">
                    {record.workHours ? `${record.workHours}h` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {record.overtimeHours > 0 ? (
                      <span className="text-purple-400">+{record.overtimeHours}h</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStatusColor(record.status)}`}>
                      {statusLabels[record.status]}
                      {record.leaveType && ` (${leaveTypeLabels[record.leaveType]})`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {record.remark || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-slate-400">정상출근</span>
              <span className="text-white font-medium">{presentCount}명</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-slate-400">지각</span>
              <span className="text-white font-medium">{lateCount}명</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-slate-400">휴가</span>
              <span className="text-white font-medium">{leaveCount}명</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-400">결근</span>
              <span className="text-white font-medium">{absentCount}명</span>
            </div>
          </div>
          <div className="text-slate-400">
            총 <span className="text-white font-medium">{mockAttendance.length}명</span>
          </div>
        </div>
      </div>
    </div>
  );
}
