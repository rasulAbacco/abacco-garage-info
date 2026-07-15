import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  User,
  Calendar,
  Plus,
  Layers,
  Search,
  Phone,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  BarChart3,
  ChevronRight,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  Bookmark,
  Mail,
  MapPin,
  ExternalLink,
  CalendarClock,
  CalendarCheck,
  AlarmClockOff,
} from "lucide-react";
import API from "../../api/axios";

const FieldAgentDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {
    id: "",
    name: "Field Agent",
    marketingType: "GENERAL",
  };

  // Component States
  const [summaryData, setSummaryData] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [latestVisits, setLatestVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalSearch, setGlobalSearch] = useState("");

  // Analytical Matrix Computations
  useEffect(() => {
    const fetchDashboardPayload = async () => {
      if (!user.id) {
        setError(
          "Security session validation identity profile matrix map context missing.",
        );
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const [summaryRes, followUpsRes, visitsRes] = await Promise.allSettled([
          API.get(`/api/field-visit/dashboard/${user.id}`),
          API.get(`/api/field-visit/employee/${user.id}/today-followups`),
          API.get(`/api/field-visit/employee/${user.id}`),
        ]);

        if (summaryRes.status === "fulfilled") {
          setSummaryData(summaryRes.value.data);
        }
        if (followUpsRes.status === "fulfilled") {
          setFollowUps(
            Array.isArray(followUpsRes.value.data)
              ? followUpsRes.value.data
              : followUpsRes.value.data?.followUps || [],
          );
        }
        if (visitsRes.status === "fulfilled") {
          const rawVisits = Array.isArray(visitsRes.value.data)
            ? visitsRes.value.data
            : visitsRes.value.data?.visits || [];
          setLatestVisits(rawVisits);
        }
      } catch (err) {
        console.error(
          "Dashboard orchestrator extraction barrier failure: ",
          err,
        );
        setError(
          "Failed to compile synchronized runtime telemetry matrices from data lake pipelines.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardPayload();
  }, [user.id]);

  // Context Greeting Engine
  const greetingText = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const formattedCurrentDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date());
  }, []);

  // Filtered Visits based on Real-Time Global Search Input Matrix
  const filteredRecentVisits = useMemo(() => {
    const searchTarget = globalSearch.toLowerCase().trim();
    if (!searchTarget) return latestVisits.slice(0, 5);
    return latestVisits
      .filter(
        (v) =>
          v.title?.toLowerCase().includes(searchTarget) ||
          v.contactPerson?.toLowerCase().includes(searchTarget) ||
          v.city?.toLowerCase().includes(searchTarget) ||
          v.phoneNumber?.toLowerCase().includes(searchTarget),
      )
      .slice(0, 5);
  }, [latestVisits, globalSearch]);

  // Derived Performance Calculations
  const calculatedMetrics = useMemo(() => {
    const counts = {
      total: latestVisits.length,
      pending: 0,
      interested: 0,
      customer: 0,
      overDue: 0,
    };
    const todayTimestamp = new Date().setHours(0, 0, 0, 0);

    latestVisits.forEach((v) => {
      const statusKey = v.status?.toUpperCase();
      if (statusKey === "PENDING") counts.pending++;
      else if (statusKey === "INTERESTED") counts.interested++;
      // FieldVisitStatus has both CUSTOMER and CLOSED as terminal/won
      // states (see schema.prisma) — both should count as "closed".
      else if (statusKey === "CUSTOMER" || statusKey === "CLOSED")
        counts.customer++;

      if (
        v.followUpDate &&
        new Date(v.followUpDate).setHours(0, 0, 0, 0) < todayTimestamp &&
        statusKey !== "CUSTOMER" &&
        statusKey !== "CLOSED" &&
        statusKey !== "NOT_INTERESTED"
      ) {
        counts.overDue++;
      }
    });

    const successRate = counts.total
      ? Math.round((counts.customer / counts.total) * 100)
      : 0;
    const pendingPct = counts.total
      ? Math.round((counts.pending / counts.total) * 100)
      : 0;
    const interestedPct = counts.total
      ? Math.round((counts.interested / counts.total) * 100)
      : 0;
    const closedPct = counts.total
      ? Math.round((counts.customer / counts.total) * 100)
      : 0;

    // Calculate Average Visits Per Day Based on Unique Days Inhabited
    const uniqueDays = new Set(
      latestVisits
        .map((v) =>
          v.createdAt
            ? new Date(v.createdAt).toISOString().split("T")[0]
            : null,
        )
        .filter(Boolean),
    );
    const avgVisitsPerDay = uniqueDays.size
      ? (counts.total / uniqueDays.size).toFixed(1)
      : counts.total;

    return {
      ...counts,
      successRate,
      pendingPct,
      interestedPct,
      closedPct,
      avgVisitsPerDay,
    };
  }, [latestVisits]);

  // Charts Structured Aggregations Framework
  const chartMatrices = useMemo(() => {
    // 1. Weekly visits index mapper
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyData = daysOfWeek.map((day) => ({ name: day, Visits: 0 }));

    // 2. Monthly dynamic area matrix layout
    const monthlyMap = {};

    // 3. Status allocation
    const statusMap = {
      PENDING: 0,
      FOLLOW_UP: 0,
      INTERESTED: 0,
      CUSTOMER: 0,
      CLOSED: 0,
      NOT_INTERESTED: 0,
    };

    // 4. Marketing segment mapping allocation
    const typeMap = {};

    const currentTimestamp = new Date();
    const clearWeekTimestamp = new Date(
      currentTimestamp.setDate(
        currentTimestamp.getDate() - currentTimestamp.getDay(),
      ),
    );

    latestVisits.forEach((v) => {
      if (!v.createdAt) return;
      const dateObj = new Date(v.createdAt);

      // Weekly logic compilation check
      if (dateObj >= clearWeekTimestamp) {
        weeklyData[dateObj.getDay()].Visits++;
      }

      // Monthly aggregation pipeline logic map
      const monthYearStr = dateObj.toLocaleString("en-GB", { month: "short" });
      monthlyMap[monthYearStr] = (monthlyMap[monthYearStr] || 0) + 1;

      // Status extraction pipeline loop counters
      const st = v.status?.toUpperCase() || "PENDING";
      if (statusMap[st] !== undefined) statusMap[st]++;
      else statusMap[st] = (statusMap[st] || 0) + 1;

      // Type extraction metric maps
      const mt = v.marketingType || "GENERAL";
      typeMap[mt] = (typeMap[mt] || 0) + 1;
    });

    const statusChartData = Object.keys(statusMap)
      .map((k) => ({ name: k, value: statusMap[k] }))
      .filter((d) => d.value > 0);
    const typeChartData = Object.keys(typeMap)
      .map((k) => ({ name: k, value: typeMap[k] }))
      .filter((d) => d.value > 0);
    const monthlyChartData = Object.keys(monthlyMap).map((k) => ({
      name: k,
      Visits: monthlyMap[k],
    }));

    return {
      weekly: weeklyData,
      status: statusChartData,
      marketing: typeChartData,
      monthly: monthlyChartData.length
        ? monthlyChartData
        : [{ name: "Current Month", Visits: latestVisits.length }],
    };
  }, [latestVisits]);

  // Colors Arrays Mapping Lists Specifications
  const COLORS = [
    "#0f172a",
    "#2563eb",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#64748b",
  ];

  const getStatusBadgeStyle = (rawStatus) => {
    const s = rawStatus?.toUpperCase() || "";
    if (s === "PENDING") return "bg-amber-50 text-amber-700 border-amber-200";
    if (s === "INTERESTED") return "bg-blue-50 text-blue-700 border-blue-200";
    if (s === "CUSTOMER")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "CLOSED")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "NOT_INTERESTED")
      return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      {/* GLOBAL ENTERPRISE STICKY DASHBOARD CONTAINER HEADER CONTROL BRIDGE */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6 md:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
          {/* MAPPED SEARCH CONTROLS OVERLAY INTERFACE */}
          <div className="relative w-full md:w-96 order-2 md:order-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Global Search recent visits parameters instantly..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-slate-950 transition-all text-slate-900 bg-slate-50/50 placeholder:text-slate-400"
            />
          </div>

          {/* DYNAMIC WELCOME META LABELS STRIP */}
          <div className="flex items-center gap-3 order-1 md:order-2 self-end md:self-auto text-xs bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">
              Identity Scope ID:
            </span>
            <span className="font-bold text-slate-800 tracking-wide uppercase bg-white border px-1.5 py-0.5 rounded shadow-2xs">
              {user.marketingType || "GENERAL"}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 md:px-8 pb-32 space-y-6">
        {/* WELCOME BANNER DISPLAY INTERFACE CORE */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 h-40 w-40 bg-slate-50 rounded-full pointer-events-none -z-10" />
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {greetingText}, {user.name}
            </h2>
            <p className="text-xs text-slate-400 font-medium max-w-xl">
              Welcome to your workstation panel grid terminal. Tracking and
              processing leads within the{" "}
              <span className="font-bold text-slate-700">
                {user.marketingType || "GENERAL MARKETING"}
              </span>{" "}
              vertical network layout structure map.
            </p>
          </div>
          <div className="flex items-center gap-2 text-slate-500 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold tabular-nums w-fit self-start sm:self-auto shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            {formattedCurrentDate}
          </div>
        </section>

        {/* LOADING HANDLER EXPLICIT VIEW RENDER INTERACTION LAYER */}
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-white border border-slate-200 rounded-xl"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-pulse">
              <div className="lg:col-span-3 h-96 bg-white border border-slate-200 rounded-xl" />
              <div className="h-96 bg-white border border-slate-200 rounded-xl" />
            </div>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-5 rounded-xl flex items-start gap-3 shadow-xs">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-sm uppercase tracking-wider">
                System Integration Blocked Exception
              </h4>
              <p className="text-xs mt-1 text-rose-700 font-medium leading-relaxed">
                {error}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* REAL-TIME OVERVIEW REPOSITORY STATISTICS MATRICES CARDS OVERLAY */}
            <section className="grid grid-cols-2 lg:grid-cols-6 gap-3.5 sm:gap-4">
              {/* TODAY VISITS */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all group relative">
                <div className="absolute top-3 right-3 text-indigo-500 bg-indigo-50 p-1.5 rounded-lg">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Today's Visits
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-1 tabular-nums">
                  {summaryData?.todayVisitsCount ?? calculatedMetrics.today}
                </span>
                <span className="text-[9px] text-slate-400 font-medium mt-1 block">
                  Logs captured today
                </span>
              </div>

              {/* TOTAL VISITS CARD */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all group relative">
                <div className="absolute top-3 right-3 text-slate-800 bg-slate-100 p-1.5 rounded-lg">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Pipeline
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-1 tabular-nums">
                  {summaryData?.totalVisitsCount ?? calculatedMetrics.total}
                </span>
                <span className="text-[9px] text-slate-400 font-medium mt-1 block">
                  Lifetime lead records
                </span>
              </div>

              {/* MONTHLY CONTEXT CARD */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all group relative">
                <div className="absolute top-3 right-3 text-cyan-600 bg-cyan-50 p-1.5 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  This Month
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-1 tabular-nums">
                  {summaryData?.thisMonthVisitsCount ??
                    latestVisits.filter(
                      (v) =>
                        v.createdAt &&
                        new Date(v.createdAt).getMonth() ===
                          new Date().getMonth(),
                    ).length}
                </span>
                <span className="text-[9px] text-slate-400 font-medium mt-1 block">
                  Current monthly target
                </span>
              </div>

              {/* PENDING FOLLOW-UPS LOG */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all group relative">
                <div className="absolute top-3 right-3 text-amber-600 bg-amber-50 p-1.5 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pending Follows
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-1 tabular-nums">
                  {summaryData?.pendingFollowUpsCount ??
                    calculatedMetrics.pending}
                </span>
                <span className="text-[9px] text-slate-400 font-medium mt-1 block">
                  Awaiting re-engagement
                </span>
              </div>

              {/* INTERESTED LEAD MAPS COUNTER */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all group relative">
                <div className="absolute top-3 right-3 text-blue-600 bg-blue-50 p-1.5 rounded-lg">
                  <Bookmark className="w-4 h-4" />
                </div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Interested Leads
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-1 tabular-nums">
                  {summaryData?.interestedLeadsCount ??
                    calculatedMetrics.interested}
                </span>
                <span className="text-[9px] text-slate-400 font-medium mt-1 block">
                  High potential prospects
                </span>
              </div>

              {/* CLOSED DISPATCH ACQUIRED DEAL DEPLOYMENTS */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all group relative">
                <div className="absolute top-3 right-3 text-emerald-600 bg-emerald-50 p-1.5 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Closed Deals
                </span>
                <span className="text-2xl font-black text-emerald-600 block mt-1 tabular-nums">
                  {summaryData?.closedDealsCount ?? calculatedMetrics.customer}
                </span>
                <span className="text-[9px] text-slate-400 font-medium mt-1 block">
                  Successfully converted accounts
                </span>
              </div>
            </section>

            {/* CRM FOLLOW-UP STATISTICS OVERLAY */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {/* TODAY'S FOLLOW-UPS */}
              <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-xs hover:shadow-md transition-all group relative">
                <div className="absolute top-3 right-3 text-orange-600 bg-orange-50 p-1.5 rounded-lg">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Today's Follow-ups
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-1 tabular-nums">
                  {summaryData?.todayFollowUpsCount ?? 0}
                </span>
                <span className="text-[9px] text-slate-400 font-medium mt-1 block">
                  Scheduled for today
                </span>
              </div>

              {/* UPCOMING FOLLOW-UPS */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all group relative">
                <div className="absolute top-3 right-3 text-indigo-600 bg-indigo-50 p-1.5 rounded-lg">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Upcoming Follow-ups
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-1 tabular-nums">
                  {summaryData?.upcomingFollowUpsCount ?? 0}
                </span>
                <span className="text-[9px] text-slate-400 font-medium mt-1 block">
                  Scheduled ahead
                </span>
              </div>

              {/* OVERDUE FOLLOW-UPS */}
              <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs hover:shadow-md transition-all group relative">
                <div className="absolute top-3 right-3 text-rose-600 bg-rose-50 p-1.5 rounded-lg">
                  <AlarmClockOff className="w-4 h-4" />
                </div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Overdue Follow-ups
                </span>
                <span className="text-2xl font-black text-rose-600 block mt-1 tabular-nums">
                  {summaryData?.overdueFollowUpsCount ?? 0}
                </span>
                <span className="text-[9px] text-slate-400 font-medium mt-1 block">
                  Past due, needs action
                </span>
              </div>

              {/* COMPLETED TODAY */}
              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs hover:shadow-md transition-all group relative">
                <div className="absolute top-3 right-3 text-emerald-600 bg-emerald-50 p-1.5 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Completed Today
                </span>
                <span className="text-2xl font-black text-emerald-600 block mt-1 tabular-nums">
                  {summaryData?.completedTodayCount ?? 0}
                </span>
                <span className="text-[9px] text-slate-400 font-medium mt-1 block">
                  Closed out today
                </span>
              </div>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => navigate("/field-agent-dashboard/add-visit")}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-950 hover:text-white transition-all text-left group cursor-pointer"
              >
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-inherit">
                    Add New Visit
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-300 font-medium">
                    Record business lead
                  </span>
                </div>
                <Plus className="w-4 h-4 opacity-60 group-hover:opacity-100 shrink-0" />
              </button>

              <button
                onClick={() => navigate("/field-agent-dashboard/my-visits")}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-950 hover:text-white transition-all text-left group cursor-pointer"
              >
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-inherit">
                    My Visits
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-300 font-medium">
                    View tracked registry
                  </span>
                </div>
                <Layers className="w-4 h-4 opacity-60 group-hover:opacity-100 shrink-0" />
              </button>

              <button
                onClick={() =>
                  navigate("/field-agent-dashboard/my-visits?filter=today")
                }
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-950 hover:text-white transition-all text-left group cursor-pointer"
              >
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-inherit">
                    Today's Follow Ups
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-300 font-medium">
                    Triage client pipelines
                  </span>
                </div>
                <Clock className="w-4 h-4 opacity-60 group-hover:opacity-100 shrink-0" />
              </button>

              <button
                onClick={() => navigate("/field-agent-dashboard/profile")}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-950 hover:text-white transition-all text-left group cursor-pointer"
              >
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-inherit">
                    My Profile
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-300 font-medium">
                    Manage credentials
                  </span>
                </div>
                <User className="w-4 h-4 opacity-60 group-hover:opacity-100 shrink-0" />
              </button>
            </section>

            {/* REAL-TIME DYNAMIC SYSTEM CRITICAL EMERGENCY NOTIFICATIONS TOAST TILES */}
            {(calculatedMetrics.overDue > 0 || followUps.length > 0) && (
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {calculatedMetrics.overDue > 0 && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs animate-fadeIn md:col-span-1">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <span className="block text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                        Overdue Alert Warning
                      </span>
                      <p className="text-xs font-medium text-rose-700 mt-0.5">
                        You have{" "}
                        <span className="font-extrabold">
                          {calculatedMetrics.overDue}
                        </span>{" "}
                        pipeline follow-up interactions that require urgent
                        execution.
                      </p>
                    </div>
                  </div>
                )}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs animate-fadeIn md:col-span-2">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                      Scheduler Event Matrix
                    </span>
                    <p className="text-xs font-medium text-amber-700 mt-0.5">
                      {followUps.length > 0
                        ? `You have ${followUps.length} scheduled follow-ups mapped out across today's activation workflow.`
                        : "No priority field activations or pipeline follow-ups pending on current schedule blocks."}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* ANALYTICAL RECHARTS MATRIX VISUALIZATION BLOCKS ENGINE */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* BAR CHART: WEEKLY RECORDED OPERATIONS ACTIVITY */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 lg:col-span-7 flex flex-col justify-between min-h-[360px]">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" /> Visits
                    Recorded This Week
                  </h3>
                </div>
                <div className="w-full h-64 text-xs font-semibold">
                  {latestVisits.length > 0 ? (
                    <ResponsiveContainer width="100%" h="100%">
                      <BarChart
                        data={chartMatrices.weekly}
                        margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f1f5f9"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          stroke="#94a3b8"
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          stroke="#94a3b8"
                          allowDecimals={false}
                        />
                        <Tooltip
                          cursor={{ fill: "#f8fafc" }}
                          contentStyle={{
                            background: "#0f172a",
                            color: "#fff",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar
                          dataKey="Visits"
                          fill="#0f172a"
                          radius={[4, 4, 0, 0]}
                          barSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                      No current week timeline data stream active
                    </div>
                  )}
                </div>
              </div>

              {/* PIE CHART: STATUS DISPATCH ALLOCATION MATRIX AREA */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 lg:col-span-5 flex flex-col justify-between min-h-[360px]">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" /> Lead Pipeline
                    Allocation
                  </h3>
                </div>
                <div className="w-full h-56 text-xs flex items-center justify-center relative">
                  {chartMatrices.status.length > 0 ? (
                    <ResponsiveContainer width="100%" h="100%">
                      <PieChart>
                        <Pie
                          data={chartMatrices.status}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartMatrices.status.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#0f172a",
                            color: "#fff",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                      No pipeline allocations recorded
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] uppercase font-bold tracking-wider text-slate-500 pt-2 border-t border-slate-50">
                  {chartMatrices.status.map((entry, idx) => (
                    <span key={entry.name} className="flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full block"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      {entry.name} ({entry.value})
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* PERFORMANCE KPI SCORING ENGINE BLOCK DASHBOARD GRID */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Conversion Success Rate
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {calculatedMetrics.successRate}%
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">
                    Total conversion mapping
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${calculatedMetrics.successRate}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Interested Vector Velocity
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {calculatedMetrics.interestedPct}%
                  </span>
                  <span className="text-xs font-semibold text-blue-600">
                    Hot interaction state
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${calculatedMetrics.interestedPct}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Awaiting Nurture Velocity
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {calculatedMetrics.pendingPct}%
                  </span>
                  <span className="text-xs font-semibold text-amber-600">
                    Pending initial audit
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${calculatedMetrics.pendingPct}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Daily Operations Velocity
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {calculatedMetrics.avgVisitsPerDay}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Avg visits per active day
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-900 h-full rounded-full"
                    style={{
                      width: `${Math.min(Number(calculatedMetrics.avgVisitsPerDay) * 10, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </section>

            {/* LOWER COGNITIVE DASHBOARD SECTION: SCHEDULES (LEFT) & HISTORICAL TIMELINES (RIGHT) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* TODAY'S WORKFLOW FOLLOW-UPS TIMELINE INTERFACE */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-900" /> Today's
                    Scheduled Targets
                  </h3>
                  <span className="bg-slate-100 px-2 py-0.5 text-[10px] font-black rounded-sm text-slate-500 tabular-nums">
                    Max: 5
                  </span>
                </div>

                {followUps.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                    <p className="text-xs text-slate-400 font-medium">
                      No target follow-ups assigned on today's matrix.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {followUps.slice(0, 5).map((follow) => (
                      <div
                        key={follow.id}
                        className="border border-slate-200 hover:border-slate-300 p-3.5 rounded-xl transition-all space-y-2.5 bg-slate-50/40"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                              {follow.title || "Unnamed Prospect Enterprise"}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5 flex items-center gap-1">
                              <User className="w-3 h-3" /> Contact:{" "}
                              {follow.contactPerson || "N/A"}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-black tracking-wider uppercase border px-1.5 py-0.5 rounded-sm shrink-0 bg-white ${getStatusBadgeStyle(follow.status)}`}
                          >
                            {follow.status || "PENDING"}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold tracking-tight tabular-nums text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />{" "}
                            {follow.phoneNumber || "No digits"}
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={`tel:${follow.phoneNumber}`}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                              title="Trigger Voice Loop"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`https://wa.me/${follow.phoneNumber?.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                              title="Trigger WhatsApp String"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() =>
                                navigate(
                                  `/field-agent-dashboard/visit/${follow.id}`,
                                )
                              }
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
                              title="Inspect Mapped Meta Logs"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RECENT VISITS HISTORICAL LOG DATA ROW MATRICES CONTAINER */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-900" /> Recent Visits
                    Feed Channel
                  </h3>
                  <button
                    onClick={() => navigate("/field-agent-dashboard/my-visits")}
                    className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    See Full Array <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {filteredRecentVisits.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-4 animate-fadeIn">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <Layers className="w-6 h-6 stroke-1" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">
                        No visits matching queries yet.
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Your field matrix mapping parameters register holds no
                        historical verification instances yet.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        navigate("/field-agent-dashboard/add-visit")
                      }
                      className="inline-flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-lg text-[10px] uppercase tracking-wider cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add First Visit
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredRecentVisits.map((visit) => {
                      const sampleImage = visit.images?.[0]?.imageUrl || null;

                      return (
                        <div
                          key={visit.id}
                          className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Thumbnail */}
                            <div className="h-11 w-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                              {sampleImage ? (
                                <img
                                  src={sampleImage}
                                  alt="Storefront asset snapshot"
                                  className="h-full w-full object-cover transform duration-200 group-hover:scale-105"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-slate-300 bg-slate-50">
                                  <Layers className="w-4 h-4 stroke-1" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <h4 className="text-xs font-bold text-slate-900 truncate tracking-tight">
                                {visit.title || "Unnamed Lead Instance"}
                              </h4>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                <span className="text-slate-700 bg-slate-100 px-1 rounded-sm text-[9px] font-black">
                                  {visit.marketingType || "GENERAL"}
                                </span>
                                <span>•</span>
                                <span className="tabular-nums">
                                  {visit.createdAt
                                    ? new Date(
                                        visit.createdAt,
                                      ).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                      })
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={`text-[9px] font-black tracking-widest border px-1.5 py-0.5 rounded-sm uppercase bg-white ${getStatusBadgeStyle(visit.status)}`}
                            >
                              {visit.status || "PENDING"}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/field-agent-dashboard/visit/${visit.id}`,
                                  )
                                }
                                className="p-1 border border-slate-200 hover:border-slate-400 rounded bg-white text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                                title="Inspect Core Parameters View"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() =>
                                  navigate(
                                    `/field-agent-dashboard/edit-visit/${visit.id}`,
                                  )
                                }
                                className="p-1 border border-slate-200 hover:border-slate-400 rounded bg-white text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                                title="Revise Parameter Settings Matrix"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

// Simple localized helper miniature icon component placeholder for editing routines
const Edit3 = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
    />
  </svg>
);

export default FieldAgentDashboard;
