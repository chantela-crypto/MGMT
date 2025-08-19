import React from "react";
import { CheckCircle, X, Clock, Target } from "lucide-react";

export type MonthStatus = "achieved" | "partial" | "missed" | "no-goals" | "pending";

export interface MonthlyAchievement {
  month: string; // Full month name or short form
  status: MonthStatus;
  achievement: number; // 0..100
  totalGoals: number;
  achievedGoals: number;
}

export interface YearlyAchievementGridProps {
  employeeId: string;
  year: number;
  monthlyAchievements: MonthlyAchievement[];
  className?: string;
}

const statusIcon: Record<MonthStatus, React.ReactNode> = {
  achieved: <CheckCircle className="h-4 w-4 text-white" />,
  partial: <Clock className="h-4 w-4 text-white" />,
  missed: <X className="h-4 w-4 text-white" />,
  pending: <Target className="h-4 w-4 text-white" />,
  "no-goals": null
};

const statusBg: Record<MonthStatus, string> = {
  achieved: "bg-green-500",
  partial: "bg-yellow-500",
  missed: "bg-red-500",
  pending: "bg-blue-500",
  "no-goals": "bg-gray-300"
};

const statusText: Record<MonthStatus, string> = {
  achieved: "Goals Achieved ≥ 80%",
  partial: "Partially Achieved 50–79%",
  missed: "Goals Missed < 50%",
  pending: "Results Pending",
  "no-goals": "No Goals Set"
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const YearlyAchievementGrid: React.FC<YearlyAchievementGridProps> = ({
  year,
  monthlyAchievements,
  className = ""
}) => {
  const summary = {
    achieved: monthlyAchievements.filter(m => m.status === "achieved").length,
    partial: monthlyAchievements.filter(m => m.status === "partial").length,
    missed: monthlyAchievements.filter(m => m.status === "missed").length,
    pending: monthlyAchievements.filter(m => m.status === "pending").length,
    noGoals: monthlyAchievements.filter(m => m.status === "no-goals").length
  };
  const totalWithGoals = summary.achieved + summary.partial + summary.missed + summary.pending;
  const successRate = totalWithGoals > 0 ? Math.round((summary.achieved / totalWithGoals) * 100) : 0;

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
      {/* header strip */}
      <div className="mb-6 flex items-center justify-between rounded-lg bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-300">Annual Goal Achievement</div>
          <div className="text-lg font-semibold">{year}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{successRate}%</div>
          <div className="text-xs text-slate-300">Overall achievement</div>
        </div>
      </div>

      {/* grid */}
      <div className="mb-6 grid grid-cols-6 gap-3 md:grid-cols-12">
        {MONTHS.map((label, idx) => {
          const m = monthlyAchievements[idx];
          const status = m?.status ?? "no-goals";
          return (
            <div key={idx} className="group relative">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg transition-transform duration-200 hover:scale-105 ${statusBg[status]}`}
                title={`${label} ${year}: ${m ? statusText[status] : "No Data"}`}
              >
                {statusIcon[status]}
              </div>
              <div className="mt-1 text-center text-xs text-gray-600">{label}</div>

              {/* tooltip */}
              {m && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 -translate-x-1/2 transform whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                  <div className="font-medium">{label} {year}</div>
                  <div>{statusText[status]}</div>
                  <div>{m.achievedGoals}/{m.totalGoals} goals, {Math.round(m.achievement)}%</div>
                  <div className="absolute left-1/2 top-full -ml-1 h-0 w-0 -translate-x-1/2 border-x-8 border-b-8 border-x-transparent border-b-gray-900"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <SummaryCard color="green" label="Achieved" value={summary.achieved} Icon={CheckCircle} />
        <SummaryCard color="yellow" label="Partial" value={summary.partial} Icon={Clock} />
        <SummaryCard color="red" label="Missed" value={summary.missed} Icon={X} />
        <SummaryCard color="blue" label="Pending" value={summary.pending} Icon={Target} />
        <SummaryCard color="gray" label="No Goals" value={summary.noGoals} Icon={Target} />
      </div>

      {/* threshold bar */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Target className="mr-2 h-5 w-5 text-blue-700" />
            <span className="text-sm font-medium text-blue-900">Achievement Threshold 80%</span>
          </div>
          <div className="text-sm text-blue-800">
            {summary.achieved} of {totalWithGoals} months achieved, {successRate}% success rate
          </div>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-blue-200">
          <div className="h-2 rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${Math.min(successRate, 100)}%` }} />
        </div>
      </div>
    </div>
  );
};

function SummaryCard({
  color,
  label,
  value,
  Icon
}: {
  color: "green" | "yellow" | "red" | "blue" | "gray";
  label: string;
  value: number;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  const bg = {
    green: "bg-green-50",
    yellow: "bg-yellow-50",
    red: "bg-red-50",
    blue: "bg-blue-50",
    gray: "bg-gray-50"
  }[color];
  const dot = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    gray: "bg-gray-400"
  }[color];
  const text = {
    green: "text-green-700",
    yellow: "text-yellow-700",
    red: "text-red-700",
    blue: "text-blue-700",
    gray: "text-gray-700"
  }[color];
  const num = {
    green: "text-green-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
    blue: "text-blue-600",
    gray: "text-gray-600"
  }[color];

  return (
    <div className={`${bg} rounded-lg p-4 text-center`}>
      <div className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full ${dot}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className={`text-2xl font-bold ${num}`}>{value}</div>
      <div className={`text-xs ${text}`}>{label}</div>
    </div>
  );
}

export default YearlyAchievementGrid;