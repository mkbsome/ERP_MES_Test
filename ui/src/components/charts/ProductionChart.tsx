import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface ProductionChartProps {
  data: { hour: string; production: number; target: number }[];
}

export default function ProductionChart({ data }: ProductionChartProps) {
  const avgTarget = data.reduce((sum, d) => sum + d.target, 0) / data.length;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />

        <XAxis
          dataKey="hour"
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#334155' }}
        />

        <YAxis
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#334155' }}
          tickFormatter={(value) => value.toLocaleString()}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          }}
          labelStyle={{ color: '#f1f5f9' }}
          cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
          formatter={(value: number, name: string) => [
            value.toLocaleString() + ' EA',
            name === 'production' ? '생산량' : '목표',
          ]}
        />

        <ReferenceLine
          y={avgTarget}
          stroke="#f59e0b"
          strokeDasharray="5 5"
          label={{
            value: '목표',
            fill: '#f59e0b',
            fontSize: 11,
            position: 'right',
          }}
        />

        <Bar
          dataKey="production"
          fill="#22c55e"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
