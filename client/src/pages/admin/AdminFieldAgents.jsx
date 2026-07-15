// client\src\pages\admin\AdminFieldAgents.jsx
import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import AdminFieldVisitDetailsPopup from "./AdminFieldVisitDetailsPopup";

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  FOLLOW_UP: "bg-indigo-50 text-indigo-700 border-indigo-200",
  INTERESTED: "bg-blue-50 text-blue-700 border-blue-200",
  CUSTOMER: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NOT_INTERESTED: "bg-rose-50 text-rose-700 border-rose-200",
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const AdminFieldAgents = () => {
  // Core data
  const [visits, setVisits] = useState([]);
  const [agents, setAgents] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [marketingFilter, setMarketingFilter] = useState("ALL");
  const [agentFilter, setAgentFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  // Detail popup
  const [selectedVisitId, setSelectedVisitId] = useState(null);

  // Debounce the search box
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch((prev) => {
        if (prev !== searchTerm) setCurrentPage(1);
        return searchTerm;
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [visitsRes, agentsRes, summaryRes] = await Promise.allSettled([
        API.get("/api/field-visit/admin/all"),
        API.get("/api/field-visit/admin/agents"),
        API.get("/api/field-visit/admin/summary"),
      ]);

      if (visitsRes.status === "fulfilled") {
        setVisits(visitsRes.value.data?.visits || []);
      } else {
        setError("Failed to load field visits.");
      }

      if (agentsRes.status === "fulfilled") {
        setAgents(agentsRes.value.data?.agents || []);
      }

      if (summaryRes.status === "fulfilled") {
        setSummary(summaryRes.value.data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load field agent data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Filtering (client-side, over the already-fetched full list)
  const filteredVisits = useMemo(() => {
    let output = [...visits];

    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase().trim();
      output = output.filter(
        (v) =>
          v.title?.toLowerCase().includes(term) ||
          v.contactPerson?.toLowerCase().includes(term) ||
          v.phoneNumber?.toLowerCase().includes(term) ||
          v.city?.toLowerCase().includes(term) ||
          v.employee?.name?.toLowerCase().includes(term),
      );
    }

    if (statusFilter !== "ALL") {
      output = output.filter((v) => v.status?.toUpperCase() === statusFilter);
    }

    if (marketingFilter !== "ALL") {
      output = output.filter(
        (v) => v.marketingType?.toUpperCase() === marketingFilter,
      );
    }

    if (agentFilter !== "ALL") {
      output = output.filter((v) => v.employeeId === agentFilter);
    }

    return output;
  }, [visits, debouncedSearch, statusFilter, marketingFilter, agentFilter]);

  const totalPages = Math.ceil(filteredVisits.length / recordsPerPage) || 1;

  const paginatedVisits = useMemo(() => {
    const startIdx = (currentPage - 1) * recordsPerPage;
    return filteredVisits.slice(startIdx, startIdx + recordsPerPage);
  }, [filteredVisits, currentPage, recordsPerPage]);

  // Keep the current page valid once the real data has loaded / filters change
  useEffect(() => {
    if (loading) return;
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage, loading]);

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleRecordsPerPageChange = (value) => {
    setRecordsPerPage(parseInt(value, 10));
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-6 md:p-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 font-bold mb-2">
          — CROSS-AGENT VISIBILITY —
        </p>
        <h1 className="text-3xl md:text-4xl font-light text-neutral-900">
          Field Agents
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Every field agent's leads, follow-ups and pipeline in one place.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 p-4 text-sm">
          {error}
        </div>
      )}

      {/* Headline stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <div className="bg-white border border-neutral-200 p-6">
          <p className="text-xs uppercase text-neutral-400 mb-2">
            Field Agents
          </p>
          <h2 className="text-3xl font-light">
            {summary ? summary.activeAgents : "—"}
            <span className="text-base text-neutral-400">
              {" "}
              / {summary?.totalAgents ?? "—"}
            </span>
          </h2>
          <p className="text-[11px] text-neutral-400 mt-1">Active / Total</p>
        </div>

        <div className="bg-white border border-neutral-200 p-6">
          <p className="text-xs uppercase text-neutral-400 mb-2">
            Total Pipeline
          </p>
          <h2 className="text-3xl font-light">
            {summary?.totalVisitsCount ?? "—"}
          </h2>
          <p className="text-[11px] text-neutral-400 mt-1">
            Lifetime lead records
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-6">
          <p className="text-xs uppercase text-neutral-400 mb-2">
            Today's Visits
          </p>
          <h2 className="text-3xl font-light">
            {summary?.todayVisitsCount ?? "—"}
          </h2>
          <p className="text-[11px] text-neutral-400 mt-1">
            Logged in the last 24h
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-6">
          <p className="text-xs uppercase text-neutral-400 mb-2">This Month</p>
          <h2 className="text-3xl font-light">
            {summary?.thisMonthVisitsCount ?? "—"}
          </h2>
          <p className="text-[11px] text-neutral-400 mt-1">
            Current monthly volume
          </p>
        </div>
      </div>

      {/* Pipeline breakdown */}
      <p className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-3">
        Pipeline Breakdown
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-5 mb-8">
        <div className="bg-white border border-neutral-200 p-6">
          <p className="text-xs uppercase text-neutral-400 mb-2">Pending</p>
          <h2 className="text-3xl font-light text-amber-600">
            {summary?.pendingCount ?? "—"}
          </h2>
        </div>
        <div className="bg-white border border-neutral-200 p-6">
          <p className="text-xs uppercase text-neutral-400 mb-2">Follow Up</p>
          <h2 className="text-3xl font-light text-indigo-600">
            {summary?.followUpCount ?? "—"}
          </h2>
        </div>
        <div className="bg-white border border-neutral-200 p-6">
          <p className="text-xs uppercase text-neutral-400 mb-2">Interested</p>
          <h2 className="text-3xl font-light text-blue-600">
            {summary?.interestedCount ?? "—"}
          </h2>
        </div>
        <div className="bg-white border border-neutral-200 p-6">
          {/* Closed = CUSTOMER + CLOSED combined — the schema treats both as
              terminal/won states, so both are counted toward this figure. */}
          <p className="text-xs uppercase text-neutral-400 mb-2">
            Closed Deals
          </p>
          <h2 className="text-3xl font-light text-emerald-600">
            {summary?.totalClosedDeals ?? "—"}
          </h2>
        </div>
        <div className="bg-white border border-neutral-200 p-6">
          <p className="text-xs uppercase text-neutral-400 mb-2">
            Not Interested
          </p>
          <h2 className="text-3xl font-light text-rose-600">
            {summary?.notInterestedCount ?? "—"}
          </h2>
        </div>
      </div>

      {/* Follow-up health + agent leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
        <div className="bg-white border border-neutral-200 p-6">
          <p className="text-xs uppercase text-neutral-400 mb-2">
            Today's Follow-ups
          </p>
          <h2 className="text-3xl font-light">
            {summary?.todayFollowUpsCount ?? "—"}
          </h2>
        </div>
        <div className="bg-white border border-neutral-200 p-6">
          <p className="text-xs uppercase text-neutral-400 mb-2">
            Overdue Follow-ups
          </p>
          <h2 className="text-3xl font-light text-rose-600">
            {summary?.overdueFollowUpsCount ?? "—"}
          </h2>
        </div>
        <div className="bg-white border border-neutral-200 p-6">
          <p className="text-xs uppercase text-neutral-400 mb-2">
            Marketing Focus Split
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {(summary?.marketingTypeBreakdown || []).map((row) => (
              <span
                key={row.marketingType}
                className="text-[11px] font-semibold px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-full"
              >
                {row.marketingType}: {row.count}
              </span>
            ))}
            {!summary?.marketingTypeBreakdown?.length && (
              <span className="text-xs text-neutral-400">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Agent leaderboard */}
      <div className="bg-white border border-neutral-200 overflow-hidden mb-10">
        <div className="p-5 border-b border-neutral-200">
          <h2 className="text-xl font-light">Agent Leaderboard</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Top field agents by total visits logged
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs uppercase text-neutral-500">
                  Agent
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase text-neutral-500">
                  Focus
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase text-neutral-500">
                  Total Visits
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase text-neutral-500">
                  Closed Deals
                </th>
              </tr>
            </thead>
            <tbody>
              {(summary?.agentLeaderboard || []).map((row) => (
                <tr
                  key={row.employeeId}
                  className="border-b border-neutral-100"
                >
                  <td className="px-5 py-3 text-sm font-medium text-neutral-900">
                    {row.name}
                  </td>
                  <td className="px-5 py-3 text-xs text-neutral-500">
                    {row.marketingType}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-700">
                    {row.totalVisits}
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-emerald-600">
                    {row.closedDeals}
                  </td>
                </tr>
              ))}
              {!summary?.agentLeaderboard?.length && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-sm text-neutral-400"
                  >
                    No field agent activity logged yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters + table */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-neutral-200 flex flex-col md:flex-row md:items-center gap-3 flex-wrap">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search business, agent, phone, city..."
            className="flex-1 min-w-[220px] border border-neutral-200 bg-white text-sm text-neutral-700 px-4 py-2 outline-none focus:border-neutral-900"
          />

          <select
            value={agentFilter}
            onChange={(e) => handleFilterChange(setAgentFilter)(e.target.value)}
            className="border border-neutral-200 bg-white text-sm text-neutral-700 px-4 py-2 outline-none focus:border-neutral-900 cursor-pointer"
          >
            <option value="ALL">All Agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.totalVisits})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              handleFilterChange(setStatusFilter)(e.target.value)
            }
            className="border border-neutral-200 bg-white text-sm text-neutral-700 px-4 py-2 outline-none focus:border-neutral-900 cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="FOLLOW_UP">Follow Up</option>
            <option value="INTERESTED">Interested</option>
            <option value="CUSTOMER">Customer</option>
            <option value="CLOSED">Closed</option>
            <option value="NOT_INTERESTED">Not Interested</option>
          </select>

          <select
            value={marketingFilter}
            onChange={(e) =>
              handleFilterChange(setMarketingFilter)(e.target.value)
            }
            className="border border-neutral-200 bg-white text-sm text-neutral-700 px-4 py-2 outline-none focus:border-neutral-900 cursor-pointer"
          >
            <option value="ALL">All Marketing Focus</option>
            <option value="GARAGE">Garage</option>
            <option value="SCHOOL">School</option>
            <option value="HOSPITAL">Hospital</option>
            <option value="RESTAURANT">Restaurant</option>
            <option value="HOTEL">Hotel</option>
            <option value="GENERAL">General</option>
          </select>

          <select
            value={recordsPerPage}
            onChange={(e) => handleRecordsPerPageChange(e.target.value)}
            className="border border-neutral-200 bg-white text-sm text-neutral-700 px-4 py-2 outline-none focus:border-neutral-900 cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="p-10 text-center text-neutral-400">
            Loading field visits...
          </div>
        )}

        {!loading && paginatedVisits.length === 0 && (
          <div className="p-10 text-center text-neutral-400">
            No field visits found
          </div>
        )}

        {!loading && paginatedVisits.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-5 py-4 text-left text-xs uppercase tracking-wider text-neutral-500">
                    Business
                  </th>
                  <th className="px-5 py-4 text-left text-xs uppercase tracking-wider text-neutral-500">
                    Agent
                  </th>
                  <th className="px-5 py-4 text-left text-xs uppercase tracking-wider text-neutral-500">
                    Focus
                  </th>
                  <th className="px-5 py-4 text-left text-xs uppercase tracking-wider text-neutral-500">
                    Phone
                  </th>
                  <th className="px-5 py-4 text-left text-xs uppercase tracking-wider text-neutral-500">
                    Location
                  </th>
                  <th className="px-5 py-4 text-left text-xs uppercase tracking-wider text-neutral-500">
                    Status
                  </th>
                  <th className="px-5 py-4 text-left text-xs uppercase tracking-wider text-neutral-500">
                    Next Follow-up
                  </th>
                  <th className="px-5 py-4 text-left text-xs uppercase tracking-wider text-neutral-500">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedVisits.map((visit) => (
                  <tr
                    key={visit.id}
                    onClick={() => setSelectedVisitId(visit.id)}
                    className="border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-all"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-neutral-900">
                        {visit.title}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {visit.contactPerson || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-700">
                      {visit.employee?.name || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded">
                        {visit.marketingType || "GENERAL"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-700">
                      {visit.phoneNumber || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-700">
                      {[visit.city, visit.state].filter(Boolean).join(", ") ||
                        "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-3 py-1 rounded-full border ${
                          STATUS_STYLES[visit.status?.toUpperCase()] ||
                          "bg-neutral-100 text-neutral-700 border-neutral-200"
                        }`}
                      >
                        {(visit.status || "PENDING").replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-700">
                      {formatDate(visit.nextFollowUpDate || visit.followUpDate)}
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-700">
                      {formatDate(visit.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {!loading && filteredVisits.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-neutral-200">
            <span className="text-xs text-neutral-500">
              Showing{" "}
              <span className="font-semibold text-neutral-900">
                {(currentPage - 1) * recordsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-neutral-900">
                {Math.min(currentPage * recordsPerPage, filteredVisits.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-neutral-900">
                {filteredVisits.length}
              </span>{" "}
              visits
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-semibold border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Prev
              </button>
              <span className="px-3 py-1.5 text-xs font-semibold text-neutral-700">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-semibold border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AdminFieldVisitDetailsPopup
        visitId={selectedVisitId}
        onClose={() => setSelectedVisitId(null)}
      />
    </div>
  );
};

export default AdminFieldAgents;
