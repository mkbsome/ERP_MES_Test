import { useState } from 'react';
import { Cpu, Search, Filter, Calendar, Clock, AlertTriangle, Wrench, Play, Pause } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface EquipmentEvent {
  id: string;
  equipmentId: string;
  equipmentName: string;
  lineName: string;
  eventTime: string;
  eventType: 'run' | 'stop' | 'idle' | 'breakdown' | 'maintenance';
  duration: number; // minutes
  description: string;
  operator?: string;
}

interface Equipment {
  id: string;
  name: string;
  lineName: string;
  status: 'running' | 'stopped' | 'maintenance';
}

const mockEquipments: Equipment[] = [
  { id: 'EQ001', name: 'SMT 마운터 #1', lineName: 'SMT-L01', status: 'running' },
  { id: 'EQ002', name: 'SMT 마운터 #2', lineName: 'SMT-L01', status: 'running' },
  { id: 'EQ003', name: '리플로우 오븐 #1', lineName: 'SMT-L01', status: 'maintenance' },
  { id: 'EQ004', name: 'AOI 검사기 #1', lineName: 'SMT-L01', status: 'running' },
  { id: 'EQ005', name: 'SMT 마운터 #3', lineName: 'SMT-L02', status: 'stopped' },
];

const mockEvents: EquipmentEvent[] = [
  { id: '1', equipmentId: 'EQ001', equipmentName: 'SMT 마운터 #1', lineName: 'SMT-L01', eventTime: '2024-01-15 08:00', eventType: 'run', duration: 120, description: '정상 가동 시작', operator: '김작업' },
  { id: '2', equipmentId: 'EQ001', equipmentName: 'SMT 마운터 #1', lineName: 'SMT-L01', eventTime: '2024-01-15 10:00', eventType: 'idle', duration: 15, description: '자재 교체 대기', operator: '김작업' },
  { id: '3', equipmentId: 'EQ001', equipmentName: 'SMT 마운터 #1', lineName: 'SMT-L01', eventTime: '2024-01-15 10:15', eventType: 'run', duration: 105, description: '가동 재개', operator: '김작업' },
  { id: '4', equipmentId: 'EQ001', equipmentName: 'SMT 마운터 #1', lineName: 'SMT-L01', eventTime: '2024-01-15 12:00', eventType: 'stop', duration: 60, description: '점심 휴식', operator: '김작업' },
  { id: '5', equipmentId: 'EQ001', equipmentName: 'SMT 마운터 #1', lineName: 'SMT-L01', eventTime: '2024-01-15 13:00', eventType: 'run', duration: 180, description: '오후 가동 시작', operator: '이작업' },
  { id: '6', equipmentId: 'EQ001', equipmentName: 'SMT 마운터 #1', lineName: 'SMT-L01', eventTime: '2024-01-15 16:00', eventType: 'breakdown', duration: 45, description: '피더 오류 발생 - 수리 완료', operator: '이작업' },
  { id: '7', equipmentId: 'EQ002', equipmentName: 'SMT 마운터 #2', lineName: 'SMT-L01', eventTime: '2024-01-15 08:00', eventType: 'run', duration: 240, description: '정상 가동', operator: '박작업' },
  { id: '8', equipmentId: 'EQ002', equipmentName: 'SMT 마운터 #2', lineName: 'SMT-L01', eventTime: '2024-01-15 12:00', eventType: 'maintenance', duration: 90, description: '정기 점검 (PM)', operator: '정비반' },
  { id: '9', equipmentId: 'EQ003', equipmentName: '리플로우 오븐 #1', lineName: 'SMT-L01', eventTime: '2024-01-15 08:00', eventType: 'run', duration: 300, description: '정상 가동', operator: '최작업' },
  { id: '10', equipmentId: 'EQ003', equipmentName: '리플로우 오븐 #1', lineName: 'SMT-L01', eventTime: '2024-01-15 13:00', eventType: 'breakdown', duration: 120, description: '온도 센서 이상 - 부품 교체', operator: '정비반' },
];

const trendData = [
  { hour: '08:00', running: 4, stopped: 0, breakdown: 0, maintenance: 1 },
  { hour: '09:00', running: 4, stopped: 0, breakdown: 0, maintenance: 1 },
  { hour: '10:00', running: 3, stopped: 1, breakdown: 0, maintenance: 1 },
  { hour: '11:00', running: 4, stopped: 0, breakdown: 0, maintenance: 1 },
  { hour: '12:00', running: 2, stopped: 2, breakdown: 0, maintenance: 1 },
  { hour: '13:00', running: 3, stopped: 0, breakdown: 1, maintenance: 1 },
  { hour: '14:00', running: 3, stopped: 0, breakdown: 1, maintenance: 1 },
  { hour: '15:00', running: 4, stopped: 0, breakdown: 0, maintenance: 1 },
  { hour: '16:00', running: 3, stopped: 0, breakdown: 1, maintenance: 1 },
  { hour: '17:00', running: 4, stopped: 0, breakdown: 0, maintenance: 1 },
];

export default function EquipmentHistoryPage() {
  const [events] = useState<EquipmentEvent[]>(mockEvents);
  const [equipments] = useState<Equipment[]>(mockEquipments);
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('2024-01-15');

  const filteredEvents = events.filter(event => {
    const matchesEquipment = selectedEquipment === 'all' || event.equipmentId === selectedEquipment;
    const matchesType = filterType === 'all' || event.eventType === filterType;
    return matchesEquipment && matchesType;
  });

  const getEventColor = (type: EquipmentEvent['eventType']) => {
    switch (type) {
      case 'run': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'stop': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'idle': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'breakdown': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'maintenance': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getEventText = (type: EquipmentEvent['eventType']) => {
    switch (type) {
      case 'run': return '가동';
      case 'stop': return '정지';
      case 'idle': return '대기';
      case 'breakdown': return '고장';
      case 'maintenance': return '정비';
    }
  };

  const getEventIcon = (type: EquipmentEvent['eventType']) => {
    switch (type) {
      case 'run': return <Play className="w-4 h-4" />;
      case 'stop': return <Pause className="w-4 h-4" />;
      case 'idle': return <Clock className="w-4 h-4" />;
      case 'breakdown': return <AlertTriangle className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
    }
  };

  const stats = {
    totalRuntime: events.filter(e => e.eventType === 'run').reduce((sum, e) => sum + e.duration, 0),
    totalDowntime: events.filter(e => e.eventType === 'breakdown').reduce((sum, e) => sum + e.duration, 0),
    totalMaintenance: events.filter(e => e.eventType === 'maintenance').reduce((sum, e) => sum + e.duration, 0),
    breakdownCount: events.filter(e => e.eventType === 'breakdown').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">설비별 이력</h1>
          <p className="text-slate-400 text-sm mt-1">설비 가동/정지/고장 이력 조회</p>
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
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Play className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">총 가동시간</p>
              <p className="text-2xl font-bold text-green-400">{Math.floor(stats.totalRuntime / 60)}h {stats.totalRuntime % 60}m</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">총 고장시간</p>
              <p className="text-2xl font-bold text-red-400">{Math.floor(stats.totalDowntime / 60)}h {stats.totalDowntime % 60}m</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Wrench className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">총 정비시간</p>
              <p className="text-2xl font-bold text-blue-400">{Math.floor(stats.totalMaintenance / 60)}h {stats.totalMaintenance % 60}m</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">고장 건수</p>
              <p className="text-2xl font-bold text-orange-400">{stats.breakdownCount}건</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1 bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-white font-bold mb-4">설비 목록</h3>
          <div className="space-y-2">
            <div
              onClick={() => setSelectedEquipment('all')}
              className={`p-3 rounded-lg cursor-pointer ${selectedEquipment === 'all' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              <p className="text-white text-sm font-medium">전체 설비</p>
              <p className="text-slate-400 text-xs">{equipments.length}대</p>
            </div>
            {equipments.map((eq) => (
              <div
                key={eq.id}
                onClick={() => setSelectedEquipment(eq.id)}
                className={`p-3 rounded-lg cursor-pointer ${selectedEquipment === eq.id ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-white text-sm font-medium">{eq.name}</p>
                  <span className={`w-2 h-2 rounded-full ${
                    eq.status === 'running' ? 'bg-green-400' :
                    eq.status === 'maintenance' ? 'bg-blue-400' : 'bg-red-400'
                  }`} />
                </div>
                <p className="text-slate-400 text-xs">{eq.lineName}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-3 space-y-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h3 className="text-white font-bold mb-4">시간대별 설비 상태 추이</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Legend />
                  <Line type="monotone" dataKey="running" stroke="#22c55e" name="가동" strokeWidth={2} />
                  <Line type="monotone" dataKey="stopped" stroke="#64748b" name="정지" strokeWidth={2} />
                  <Line type="monotone" dataKey="breakdown" stroke="#ef4444" name="고장" strokeWidth={2} />
                  <Line type="monotone" dataKey="maintenance" stroke="#3b82f6" name="정비" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">전체 이벤트</option>
              <option value="run">가동</option>
              <option value="stop">정지</option>
              <option value="idle">대기</option>
              <option value="breakdown">고장</option>
              <option value="maintenance">정비</option>
            </select>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">시간</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">설비명</th>
                  <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">이벤트</th>
                  <th className="text-center text-slate-400 font-medium px-4 py-3 text-sm">지속시간</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">내용</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-sm">작업자</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-slate-300 text-sm font-mono">{event.eventTime}</td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{event.equipmentName}</p>
                      <p className="text-slate-500 text-xs">{event.lineName}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getEventColor(event.eventType)}`}>
                        {getEventIcon(event.eventType)}
                        {getEventText(event.eventType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-white text-sm">
                      {event.duration >= 60 ? `${Math.floor(event.duration / 60)}h ${event.duration % 60}m` : `${event.duration}m`}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{event.description}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{event.operator || '-'}</td>
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
