import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';
import type { DefectSummary } from '../../types';

interface DefectParetoChartProps {
  data: DefectSummary[];
}

export default function DefectParetoChart({ data }: DefectParetoChartProps) {
  // Calculate cumulative percentage
  const total = data.reduce((sum, d) => sum + d.qty, 0);
  let cumulative = 0;

  const chartData = data.map((d) => {
    cumulative += d.qty;
    return {
      name: d.defectName,
      code: d.defectCode,
      수량: d.qty,
      누적비율: Math.round((cumulative / total) * 100),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />

        <XAxis
          dataKey="name"
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#334155' }}
          angle={-45}
          textAnchor="end"
          height={60}
        />

        <YAxis
          yAxisId="left"
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#334155' }}
        />

        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
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
          formatter={(value: number, name: string) => [
            name === '수량' ? `${value} 건` : `${value}%`,
            name,
          ]}
        />

        <Bar
          yAxisId="left"
          dataKey="수량"
          fill="#ef4444"
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
        />

        <Line
          yAxisId="right"
          type="monotone"
          dataKey="누적비율"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ fill: '#f59e0b', r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
