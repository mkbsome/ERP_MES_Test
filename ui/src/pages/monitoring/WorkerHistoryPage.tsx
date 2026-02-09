import { useState } from 'react';
import { Users, Search, Filter, Calendar, Clock, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface WorkerRecord {
  id: string;
  workerId: string;
  workerName: string;
  department: string;
  date: string;
  shift: 'day' | 'evening' | 'night';
  lineName: string;
  workOrderNo: string;
  productName: string;
  targetQty: number;
  actualQty: number;
  goodQty: number;
  defectQty: number;
  workHours: number;
  achievementRate: number;
}

interface Worker {
  id: string;
  name: string;
  department: string;
  skill: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

const mockWorkers: Worker[] = [
  { id: 'WK001', name: '김작업', department: 'SMT팀', skill: 'expert' },
  { id: 'WK002', name: '이작업', department: 'SMT팀', skill: 'advanced' },
  { id: 'WK003', name: '박작업', department: 'SMT팀', skill: 'intermediate' },
  { id: 'WK004', name: '최작업', department: 'DIP팀', skill: 'advanced' },
  { id: 'WK005', name: '정작업', department: '조립팀', skill: 'expert' },
];

const mockRecords: WorkerRecord[] = [
  { id: '1', workerId: 'WK001', workerName: '김작업', department: 'SMT팀', date: '2024-01-15', shift: 'day', lineName: 'SMT-L01', workOrderNo: 'WO-2024-0001', productName: '스마트폰 메인보드 A', targetQty: 500, actualQty: 520, goodQty: 515, defectQty: 5, workHours: 8, achievementRate: 104 },
  { id: '2', workerId: 'WK001', workerName: '김작업', department: 'SMT팀', date: '2024-01-14', shift: 'day', lineName: 'SMT-L01', workOrderNo: 'WO-2024-0002', productName: '스마트폰 메인보드 B', targetQty: 450, actualQty: 460, goodQty: 455, defectQty: 5, workHours: 8, achievementRate: 102 },
  { id: '3', workerId: 'WK001', workerName: '김작업', department: 'SMT팀', date: '2024-01-13', shift: 'day', lineName: 'SMT-L01', workOrderNo: 'WO-2024-0003', productName: '전원보드 A', targetQty: 600, actualQty: 580, goodQty: 575, defectQty: 5, workHours: 8, achievementRate: 97 },
  { id: '4', workerId: 'WK002', workerName: '이작업', department: 'SMT팀', date: '2024-01-15', shift: 'evening', lineName: 'SMT-L02', workOrderNo: 'WO-2024-0004', productName: '스마트폰 메인보드 A', targetQty: 500, actualQty: 490, goodQty: 482, defectQty: 8, workHours: 8, achievementRate: 98 },
  { id: '5', workerId: 'WK002', workerName: '이작업', department: 'SMT팀', date: '2024-01-14', shift: 'evening', lineName: 'SMT-L02', workOrderNo: 'WO-2024-0005', productName: 'LED 드라이버', targetQty: 800, actualQty: 820, goodQty: 810, defectQty: 10, workHours: 8, achievementRate: 103 },
  { id: '6', workerId: 'WK003', workerName: '박작업', department: 'SMT팀', date: '2024-01-15', shift: 'night', lineName: 'SMT-L01', workOrderNo: 'WO-2024-0006', productName: '자동차 ECU', targetQty: 300, actualQty: 280, goodQty: 275, defectQty: 5, workHours: 8, achievementRate: 93 },
  { id: '7', workerId: 'WK004', workerName: '최작업', department: 'DIP팀', date: '2024-01-15', shift: 'day', lineName: 'DIP-L01', workOrderNo: 'WO-2024-0007', productName: '전원보드 B', targetQty: 400, actualQty: 420, goodQty: 415, defectQty: 5, workHours: 8, achievementRate: 105 },
  { id: '8', workerId: 'WK005', workerName: '정작업', department: '조립팀', date: '2024-01-15', shift: 'day', lineName: 'ASM-L01', workOrderNo: 'WO-2024-0008', productName: 'IoT 모듈', targetQty: 200, actualQty: 210, goodQty: 208, defectQty: 2, workHours: 8, achievementRate: 105 },
];

const performanceData = [
  { date: '01/10', target: 500, actual: 480, achievement: 96 },
  { date: '01/11', target: 520, actual: 530, achievement: 102 },
  { date: '01/12', target: 480, actual: 475, achievement: 99 },
  { date: '01/13', target: 600, actual: 580, achievement: 97 },
  { date: '01/14', target: 450, actual: 460, achievement: 102 },
  { date: '01/15', target: 500, actual: 520, achievement: 104 },
];

export default function WorkerHistoryPage() {
  const [records] = useState<WorkerRecord[]>(mockRecords);
  const [workers] = useState<Worker[]>(mockWorkers);
  const [selectedWorker, setSelectedWorker] = useState<string>('all');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('2024-01-15');

  const filteredRecords = records.filter(record => {
    const matchesWorker = selectedWorker === 'all' || record.workerId === selectedWorker;
    const matchesShift = filterShift === 'all' || record.shift === filterShift;
    return matchesWorker && matchesShift;
  });

  const getShiftText = (shift: WorkerRecord['shift']) => {
    switch (shift) {
      case 'day': return '주간';
      case 'evening': return '야간';
      case 'night': return '심야';
    }
  };

  const getShiftColor = (shift: WorkerRecord['shift']) => {
    switch (shift) {
      case 'day': return 'bg-yellow-500/20 text-yellow-400';
      case 'evening': return 'bg-blue-500/20 text-blue-400';
      case 'night': return 'bg-purple-500/20 text-purple-400';
    }
  };

  const getSkillColor = (skill: Worker['skill']) => {
    switch (skill) {
      case 'expert': return 'text-purple-400';
      case 'advanced': return 'text-blue-400';
      case 'intermediate': return 'text-green-400';
      case 'beginner': return 'text-slate-400';
    }
  };

  const getSkillText = (skill: Worker['skill']) => {
    switch (skill) {
      case 'expert': return '전문가';
      case 'advanced': return '숙련';
      case 'intermediate': return '중급';
      case 'beginner': return '초급';
    }
  };

  const stats = {
    totalRecords: filteredRecords.length,
    totalProduction: filteredRecords.reduce((sum, r) => sum + r.actualQty, 0),
    totalDefects: filteredRecords.reduce((sum, r) => sum + r.defectQty, 0),
    avgAchievement: filteredRecords.length > 0
      ? (filteredRecords.reduce((sum, r) => sum + r.achievementRate, 0) / filteredRecords.length).toFixed(1)
      : '0',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">작업자별 이력</h1>
          <p className="text-slate-400 text-sm mt-1">작업자 생산실적 및 이력 조회</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-700 rounded-lg">
              <Clock className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">작업 기록</p>
              <p className="text-2xl font-bold text-white">{stats.totalRecords}건</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Package className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">총 생산량</p>
              <p className="text-2xl font-bold text-green-400">{stats.totalProduction.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">총 불량</p>
              <p className="text-2xl font-bold text-red-400">{stats.totalDefects.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">평균 달성률</p>
              <p className="text-2xl font-bold text-blue-400">{stats.avgAchievement}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1 bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-white font-bold mb-4">작업자 목록</h3>
          <div className="space-y-2">
            <div
              onClick={() => setSelectedWorker('all')}
              className={`p-3 rounded-lg cursor-pointer ${selectedWorker === 'all' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              <p className="text-white text-sm font-medium">전체 작업자</p>
              <p className="text-slate-400 text-xs">{workers.length}명</p>
            </div>
            {workers.map((worker) => (
              <div
                key={worker.id}
                onClick={() => setSelectedWorker(worker.id)}
                className={`p-3 rounded-lg cursor-pointer ${selectedWorker === worker.id ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-white text-sm font-medium">{worker.name}</p>
                  <span className={`text-xs ${getSkillColor(worker.skill)}`}>
                    {getSkillText(worker.skill)}
                  </span>
                </div>
                <p className="text-slate-400 text-xs">{worker.department}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-3 space-y-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h3 className="text-white font-bold mb-4">일별 생산실적 추이</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Legend />
                  <Bar dataKey="target" fill="#64748b" name="목표" />
                  <Bar dataKey="actual" fill="#22c55e" name="실적" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">전체 근무</option>
              <option value="day">주간</option>
              <option value="evening">야간</option>
              <option value="night">심야</option>
            </select>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">일자/근무</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">작업자</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">라인/작업지시</th>
                  <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">목표</th>
                  <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">실적</th>
                  <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">불량</th>
                  <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">달성률</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{record.date}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${getShiftColor(record.shift)}`}>
                        {getShiftText(record.shift)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{record.workerName}</p>
                      <p className="text-slate-500 text-xs">{record.department}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{record.lineName}</p>
                      <p className="text-slate-500 text-xs font-mono">{record.workOrderNo}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300 text-sm">{record.targetQty.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-green-400 text-sm font-medium">{record.actualQty.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-red-400 text-sm">{record.defectQty}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${record.achievementRate >= 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {record.achievementRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
