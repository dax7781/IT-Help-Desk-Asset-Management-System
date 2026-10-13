"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { label } from "@/lib/constants";
export default function CategoryChart({
  data,
}: {
  data: { category: string; count: number }[];
}) {
  return (
    <div className="category-chart" aria-hidden="true">
      <ResponsiveContainer width="100%" height={240} minWidth={0}>
        <BarChart
          data={data.map((d) => ({ name: label(d.category), count: d.count }))}
          margin={{ top: 12, right: 8, left: -20, bottom: 0 }}
          accessibilityLayer={false}
        >
          <CartesianGrid vertical={false} stroke="#e4e9e5" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#50615b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#50615b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: "#e9f3ee" }} />
          <Bar
            dataKey="count"
            name="Tickets"
            fill="#1769aa"
            radius={[5, 5, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
