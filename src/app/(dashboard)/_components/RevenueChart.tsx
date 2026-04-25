"use client";

import { ChevronDown } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevenuePoint = {
  month: string;
  value: number;
};

type RevenueChartProps = {
  data: RevenuePoint[];
  totalRevenue: number;
  loading?: boolean;
};

export default function RevenueChart({
  data,
  totalRevenue,
  loading = false,
}: RevenueChartProps) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-semibold text-[#0A0A0B]">Revenue</h2>
          <p className="mt-1 text-[28px] font-semibold text-[#0B5280]">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-[#286CB2] px-3 py-1 text-[14px] font-medium text-white"
        >
          Month
          <ChevronDown className="size-4" />
        </button>
      </div>

      <div className="mt-6 h-[340px]">
        {loading ? (
          <div className="flex h-full animate-pulse items-center justify-center rounded-xl bg-[#F8FAFC] text-[#94A3B8]">
            Loading revenue data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#003771" stopOpacity={0.95} />
                  <stop offset="82%" stopColor="#A7D1FF" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 14, fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `${value / 1000}K`}
                tick={{ fill: "#6B7280", fontSize: 14, fontWeight: 500 }}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#003771"
                strokeWidth={2}
                fill="url(#revenueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
