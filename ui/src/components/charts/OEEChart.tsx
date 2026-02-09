import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { OEESummary } from '../../types';

interface OEEChartProps {
  data: OEESummary[];
}

export default function OEEChart({ data }: OEEChartProps) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5), // MM-DD format
    가동률: Math.round(d.avgAvailability * 100),
    성능: Math.round(d.avgPerformance * 100),
    품질: Math.round(d.avgQuality * 100),
    OEE: Math.round(d.avgOEE * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorOEE" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorAvailability" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

        <XAxis
          dataKey="date"
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#334155' }}
        />

        <YAxis
          domain={[60, 100]}
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#334155' }}
          tickFormatter={(value) => `${value}%`}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          }}
          labelStyle={{ color: '#f1f5f9' }}
          itemStyle={{ color: '#94a3b8' }}
          formatter={(value: number) => [`${value}%`, '']}
        />

        <Legend
          verticalAlign="top"
          height={36}
          iconType="circle"
          formatter={(value) => (
            <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
          )}
        />

        <Area
          type="monotone"
          dataKey="가동률"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#colorAvailability)"
          dot={false}
          activeDot={{ r: 4, fill: '#3b82f6' }}
        />

        <Area
          type="monotone"
          dataKey="OEE"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#colorOEE)"
          dot={false}
          activeDot={{ r: 4, fill: '#22c55e' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
