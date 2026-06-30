import { Calendar, Clock } from "lucide-react";

const getPriorityStyle = (p) => {
  const pr = p?.toUpperCase() || "MEDIUM";
  if (pr === "HIGH") return "text-rose-600 font-bold bg-rose-50 border-rose-100";
  if (pr === "LOW") return "text-slate-500 font-bold bg-slate-100 border-slate-200";
  return "text-amber-600 font-bold bg-amber-50 border-amber-100";
};

const getStatusDotStyle = (s) => {
  if (s === "Interested") return "bg-blue-50 border-blue-200 text-blue-700";
  if (s === "Customer") return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (s === "Not Interested") return "bg-rose-50 border-rose-200 text-rose-700";
  if (s === "Follow Up") return "bg-indigo-50 border-indigo-200 text-indigo-700";
  return "bg-amber-50 border-amber-200 text-amber-700"; // Pending
};

const formatDateString = (rawDate) => {
  if (!rawDate) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(rawDate));
  } catch {
    return "N/A";
  }
};

/**
 * Follow-up Timeline — renders a visit's follow-up history newest first.
 * Props:
 *  - followUps: array of VisitFollowUp records (any order; sorted here)
 */
const FollowUpTimeline = ({ followUps = [] }) => {
  const sorted = [...followUps].sort(
    (a, b) => new Date(b.followUpDate || b.createdAt) - new Date(a.followUpDate || a.createdAt)
  );

  if (sorted.length === 0) {
    return (
      <p className="text-xs text-slate-400 italic">
        No follow-up history logged for this lead yet.
      </p>
    );
  }

  return (
    <div className="space-y-4 relative before:absolute before:inset-y-1 before:left-[9px] before:w-[1px] before:bg-slate-200 pl-1 text-xs">
      {sorted.map((entry) => (
        <div key={entry.id} className="flex gap-3 relative items-start">
          <div
            className={`h-5 w-5 rounded-full border shadow-xs flex items-center justify-center shrink-0 z-10 ${getStatusDotStyle(entry.status)}`}
          >
            <Clock className="w-3 h-3" />
          </div>
          <div className="flex-1 min-w-0 bg-slate-50/60 border border-slate-100 rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-slate-400">
                {formatDateString(entry.createdAt)}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] inline-block ${getPriorityStyle(entry.priority)}`}>
                {entry.priority || "Medium"}
              </span>
            </div>
            <p className="font-bold text-slate-800">Status: {entry.status}</p>
            <p className="text-slate-600 leading-relaxed">{entry.remark}</p>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 pt-1 border-t border-slate-200/70">
              <Calendar className="w-3 h-3" /> Next Follow-up: {formatDateString(entry.followUpDate)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FollowUpTimeline;