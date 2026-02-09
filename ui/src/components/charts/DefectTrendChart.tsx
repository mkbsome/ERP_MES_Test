import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { DefectTrend } from '../../types';

interface DefectTrendChartProps {
  data: DefectTrend[];
  targetRate?: number;
}

export default function DefectTrendChart({ data, targetRate = 0.015 }: DefectTrendChartProps) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5), // MM-DD format
    불량률: (d.defectRate * 100).toFixed(2),
    불량건수: d.defectCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

        <XAxis
          dataKey="date"
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#334155' }}
        />

        <YAxis
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
          formatter={(value: string, name: string) => [
            name === '불량률' ? `${value}%` : `${value} 건`,
            name,
          ]}
        />

        <ReferenceLine
          y={targetRate * 100}
          stroke="#22c55e"
          strokeDasharray="5 5"
          label={{
            value: '목표',
            fill: '#22c55e',
            fontSize: 11,
            position: 'right',
          }}
        />

        <Line
          type="monotone"
          dataKey="불량률"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ fill: '#ef4444', r: 4 }}
          activeDot={{ r: 6, fill: '#ef4444' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
