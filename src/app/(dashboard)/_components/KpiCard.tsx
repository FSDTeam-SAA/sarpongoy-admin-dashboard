"use client";

import { DollarSign, Users } from "lucide-react";

type KpiCardProps = {
  title: string;
  value: string | number;
  icon: "schools" | "revenue";
};

export default function KpiCard({ title, value, icon }: KpiCardProps) {
  const isSchools = icon === "schools";
  const Icon = isSchools ? Users : DollarSign;

  return (
    <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <p className="text-[16px] font-medium text-[#6B7280]">{title}</p>
        <p className="mt-3 text-[28px] font-semibold text-[#0B5280]">
          {value}
        </p>
      </div>

      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full text-white ${
          isSchools ? "bg-green-500" : "bg-orange-400"
        }`}
      >
        <Icon className="size-7" />
      </div>
    </div>
  );
}
