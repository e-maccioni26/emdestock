'use client';

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis } from 'recharts';
import { tokens } from '@emd/shared';

/** Commandes par jour, semaine ou mois : la dernière barre non nulle en encre, les autres en gris (maquette). */
export function OrdersChart({ data }: { data: { label: string; orders: number }[] }) {
  const last = data.reduce((acc, d, i) => (d.orders > 0 ? i : acc), -1);
  const summary = data.map((d) => `${d.label} : ${d.orders}`).join(', ');
  return (
    <div role="img" aria-label={`Commandes reçues : ${summary}`} className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="label"
            axisLine={{ stroke: tokens.color.border }}
            tickLine={false}
            tick={{ fontSize: 12, fill: tokens.color.textSecondary }}
          />
          <Bar
            dataKey="orders"
            radius={[6, 6, 2, 2]}
            maxBarSize={44}
            isAnimationActive={false}
            minPointSize={0}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={i === last ? tokens.color.ink : tokens.color.borderStrong} />
            ))}
            <LabelList
              dataKey="orders"
              position="top"
              formatter={(v: unknown) => (Number(v) > 0 ? String(v) : '')}
              style={{ fontSize: 11, fontWeight: 600, fill: tokens.color.textBody }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
