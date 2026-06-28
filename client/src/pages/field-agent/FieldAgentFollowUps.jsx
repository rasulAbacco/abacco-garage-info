import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search, Filter, ChevronLeft, ChevronRight, Phone, MessageSquare,
    MapPin, Calendar, User, Mail, Trash2, Eye, Edit3, X, Image as ImageIcon,
    Building, BarChart3, AlertCircle, Plus, Layers, ArrowUpDown, CheckCircle2, Clock
} from "lucide-react";
import API from "../../api/axios";

const FieldAgentFollowUps = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user")) || { id: "" };

    // Core Data States
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Search & Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [marketingFilter, setMarketingFilter] = useState("ALL");
    const [sortBy, setSortBy] = useState("FOLLOW_UP");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

    // Interaction Modals & Actions States
    const [activeImageGallery, setActiveImageGallery] = useState(null); // { images: [], index: 0 }
    const [deleteConfirmationId, setDeleteConfirmationId] = useState(null);
    const [rescheduleData, setRescheduleData] = useState(null); // { id: '', date: '' }
    const [completeConfirmationId, setCompleteConfirmationId] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Debounce Search Input Stream Mapping Layer
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 300);

        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Read Pipeline Execution Core Stream Loader
    const fetchFollowUps = async () => {
        if (!user.id) {
            setError("User session configuration context token tracking mapping missing.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await API.get(`/api/field-visit/employee/${user.id}/today-followups`);
            setFollowUps(Array.isArray(response.data) ? response.data : response.data?.followUps || []);
            setError(null);
        } catch (err) {
            console.error("Scheduler log access telemetry exception: ", err);
            setError("Failed to initialize system connection pipelines for client follow-ups database maps.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFollowUps();
    }, [user.id]);

    // Operational State Mutators Framework (PUT / DELETE Integration Pipelines)
    const handleDeleteExecute = async () => {
        if (!deleteConfirmationId) return;
        try {
            setActionLoading(true);
            await API.delete(`/api/field-visit/${deleteConfirmationId}`);
            setFollowUps(prev => prev.filter(item => item.id !== deleteConfirmationId));
            setDeleteConfirmationId(null);
            alert("Follow up resource item deleted successfully.");
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Execution engine failed during resource termination protocol.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRescheduleExecute = async (e) => {
        e.preventDefault();
        if (!rescheduleData || !rescheduleData.date) return;
        try {
            setActionLoading(true);
            await API.put(`/api/field-visit/${rescheduleData.id}`, {
                followUpDate: rescheduleData.date
            });
            // Refresh current framework payload to re-filter date boundaries accurately
            await fetchFollowUps();
            setRescheduleData(null);
            alert("Follow-up appointment timeline adjusted successfully.");
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Internal network mutation failure tracking adjustment matrix entry.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkCompletedExecute = async () => {
        if (!completeConfirmationId) return;
        try {
            setActionLoading(true);
            await API.put(`/api/field-visit/${completeConfirmationId}`, {
                status: "CUSTOMER"
            });
            await fetchFollowUps();
            setCompleteConfirmationId(null);
            alert("Lead stage updated successfully to customer completion lifecycle profile.");
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Pipeline execution exception thrown updating CRM lifecycle profile status.");
        } finally {
            setActionLoading(false);
        }
    };

    // High Performance Aggregator Calculations Layer (useMemo guard layer)
    const statistics = useMemo(() => {
        const stats = { total: 0, pending: 0, interested: 0, closed: 0, overdue: 0, completedToday: 0 };
        const todayTimestamp = new Date().setHours(0, 0, 0, 0);

        followUps.forEach(v => {
            stats.total++;
            const statusKey = v.status?.toUpperCase();

            if (statusKey === "PENDING") stats.pending++;
            else if (statusKey === "INTERESTED") stats.interested++;
            else if (statusKey === "CUSTOMER") {
                stats.closed++;
                stats.completedToday++;
            }

            if (v.followUpDate) {
                const itemDateTimestamp = new Date(v.followUpDate).setHours(0, 0, 0, 0);
                if (itemDateTimestamp < todayTimestamp && statusKey !== "CUSTOMER" && statusKey !== "NOT_INTERESTED") {
                    stats.overdue++;
                }
            }
        });

        return stats;
    }, [followUps]);

    // Structural Filtering and Sort Processing Pipeline Engine
    const processedFollowUps = useMemo(() => {
        let result = [...followUps];

        // Search Filtering Matrix Logic
        if (debouncedSearch.trim()) {
            const target = debouncedSearch.toLowerCase().trim();
            result = result.filter(v =>
                v.title?.toLowerCase().includes(target) ||
                v.contactPerson?.toLowerCase().includes(target) ||
                v.phoneNumber?.toLowerCase().includes(target) ||
                v.city?.toLowerCase().includes(target)
            );
        }

        // Dropdown Structural Criteria Match Controls
        if (statusFilter !== "ALL") {
            result = result.filter(v => v.status?.toUpperCase() === statusFilter);
        }

        if (marketingFilter !== "ALL") {
            result = result.filter(v => v.marketingType?.toUpperCase() === marketingFilter);
        }

        // Explicit Alpha-Numerical Data Sorting Matrix Loop
        result.sort((a, b) => {
            if (sortBy === "FOLLOW_UP") {
                if (!a.followUpDate) return 1;
                if (!b.followUpDate) return -1;
                return new Date(a.followUpDate) - new Date(b.followUpDate);
            }
            if (sortBy === "NEWEST") {
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            }
            if (sortBy === "OLDEST") {
                return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            }
            if (sortBy === "TITLE") {
                return (a.title || "").localeCompare(b.title || "");
            }
            return 0;
        });

        return result;
    }, [followUps, debouncedSearch, statusFilter, marketingFilter, sortBy]);

    // Pagination Dynamic Segmentation Index Mappers
    const totalPages = Math.ceil(processedFollowUps.length / recordsPerPage) || 1;
    const paginatedFollowUps = useMemo(() => {
        const startIdx = (currentPage - 1) * recordsPerPage;
        return processedFollowUps.slice(startIdx, startIdx + recordsPerPage);
    }, [processedFollowUps, currentPage]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    // Utility Namespace Helper: String Formatting API Spec Wrapper
    const formatDateString = (rawDate) => {
        if (!rawDate) return "N/A";
        try {
            return new Intl.DateTimeFormat("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric"
            }).format(new Date(rawDate));
        } catch (e) {
            return "Invalid Date";
        }
    };

    // Badge Status Styling Array Matrix Compiler
    const getStatusBadgeStyle = (rawStatus) => {
        const s = rawStatus?.toUpperCase() || "";
        if (s === "PENDING") return "bg-amber-50 text-amber-700 border-amber-200";
        if (s === "INTERESTED") return "bg-blue-50 text-blue-700 border-blue-200";
        if (s === "CUSTOMER") return "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (s === "NOT_INTERESTED") return "bg-rose-50 text-rose-700 border-rose-200";
        return "bg-slate-50 text-slate-700 border-slate-200";
    };

    const getMarketingBadgeStyle = (rawType) => {
        const m = rawType?.toUpperCase() || "";
        if (m === "GARAGE") return "bg-blue-600 text-white";
        if (m === "SCHOOL") return "bg-purple-600 text-white";
        if (m === "HOSPITAL") return "bg-rose-600 text-white";
        if (m === "RESTAURANT") return "bg-orange-600 text-white";
        if (m === "HOTEL") return "bg-cyan-600 text-white";
        return "bg-slate-500 text-white";
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 selection:bg-slate-950 selection:text-white">

            {/* CONTROL ROOM NAVIGATION OVERLAY STICKY TOP PAGE PANEL */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-4 sm:px-6 md:px-8 shadow-xs">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <span className="text-[10px] tracking-[0.25em] uppercase text-indigo-600 font-bold block mb-0.5">
                            Operation Execution Framework
                        </span>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Today's Follow Ups
                        </h1>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                            Manage and execute all scheduled active custom outreach strategies.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate("/field-agent-dashboard/add-visit")}
                        className="inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer w-full md:w-auto"
                    >
                        <Plus className="w-4 h-4" /> Add Field Prospect
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 md:px-8 pb-32 space-y-6">

                {/* TELEMETRY PERFORMANCE COUNTER METRICS MATRIX GRID */}
                <section className="grid grid-cols-2 lg:grid-cols-6 gap-3.5 sm:gap-4">

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                            <Layers className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Follows</span>
                            <span className="text-xl font-black text-slate-900">{statistics.total}</span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 shrink-0">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending</span>
                            <span className="text-xl font-black text-slate-900">{statistics.pending}</span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700 shrink-0">
                            <BarChart3 className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Interested</span>
                            <span className="text-xl font-black text-slate-900">{statistics.interested}</span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Closed Won</span>
                            <span className="text-xl font-black text-emerald-600">{statistics.closed}</span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 shrink-0">
                            <AlertCircle className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Overdue</span>
                            <span className="text-xl font-black text-rose-600">{statistics.overdue}</span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 flex-row col-span-2 lg:col-span-1">
                        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Done Today</span>
                            <span className="text-xl font-black text-indigo-600">{statistics.completedToday}</span>
                        </div>
                    </div>

                </section>

                {/* STICKY TRIAGE BAR SEARCH QUERIES AND CRITERIA DROP OPTION HANDLERS */}
                <section className="bg-white border border-slate-200 rounded-xl p-4 sticky top-[97px] z-20 shadow-2xs space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">

                        <div className="md:col-span-5 relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search business targets, contact persona, phone, city..."
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50/40 text-slate-900 outline-none focus:border-slate-950 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div className="md:col-span-2 relative flex items-center">
                            <span className="absolute left-3 text-slate-400 pointer-events-none">
                                <Filter className="w-3.5 h-3.5" />
                            </span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-8 pr-2 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-700 outline-none focus:border-slate-950"
                            >
                                <option value="ALL">All Status</option>
                                <option value="PENDING">PENDING</option>
                                <option value="FOLLOW_UP">FOLLOW UP</option>
                                <option value="INTERESTED">INTERESTED</option>
                                <option value="CUSTOMER">CUSTOMER</option>
                                <option value="NOT_INTERESTED">NOT INTERESTED</option>
                            </select>
                        </div>

                        <div className="md:col-span-2 relative flex items-center">
                            <span className="absolute left-3 text-slate-400 pointer-events-none">
                                <Layers className="w-3.5 h-3.5" />
                            </span>
                            <select
                                value={marketingFilter}
                                onChange={(e) => setMarketingFilter(e.target.value)}
                                className="w-full pl-8 pr-2 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-700 outline-none focus:border-slate-950"
                            >
                                <option value="ALL">All Marketing Channels</option>
                                <option value="GARAGE">Garage Focus</option>
                                <option value="SCHOOL">School Focus</option>
                                <option value="HOSPITAL">Hospital Focus</option>
                                <option value="RESTAURANT">Restaurant Focus</option>
                                <option value="HOTEL">Hotel Focus</option>
                                <option value="GENERAL">General Marketing</option>
                            </select>
                        </div>

                        <div className="md:col-span-3 relative flex items-center">
                            <span className="absolute left-3 text-slate-400 pointer-events-none">
                                <ArrowUpDown className="w-3.5 h-3.5" />
                            </span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full pl-8 pr-2 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-700 outline-none focus:border-slate-950"
                            >
                                <option value="FOLLOW_UP">Order: Follow Up Date</option>
                                <option value="NEWEST">Order: Newest First</option>
                                <option value="OLDEST">Order: Oldest First</option>
                                <option value="TITLE">Order: Business Label</option>
                            </select>
                        </div>

                    </div>
                </section>

                {/* LOADING HANDLERS SWITCH INTERACTION CONTAINER DESK */}
                {loading ? (
                    /* SYSTEM BLOCK LOADERS PLACEMENT SKELETON CARDS */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map(itemIdx => (
                            <div key={itemIdx} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                                <div className="flex justify-between"><div className="w-1/2 h-4 bg-slate-200 rounded" /><div className="w-1/4 h-5 bg-slate-200 rounded-full" /></div>
                                <div className="w-full h-40 bg-slate-200 rounded-xl" />
                                <div className="space-y-2">
                                    <div className="w-3/4 h-3 bg-slate-200 rounded" />
                                    <div className="w-5/6 h-3 bg-slate-200 rounded" />
                                </div>
                                <div className="grid grid-cols-4 gap-2 pt-2"><div className="h-8 bg-slate-200 rounded-lg col-span-2" /><div className="h-8 bg-slate-200 rounded-lg" /><div className="h-8 bg-slate-200 rounded-lg" /></div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-5 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-sm">Outreach Sync Error</h3>
                            <p className="text-xs mt-0.5 text-rose-700/90 leading-relaxed">{error}</p>
                        </div>
                    </div>
                ) : paginatedFollowUps.length === 0 ? (
                    /* STANDARD BLANK GRID LAYOUT ILLUSTRATION COMPONENT */
                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-xl mx-auto shadow-2xs space-y-5 my-12 animate-fadeIn">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                            <Building className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-slate-900">No Follow Ups Today</h3>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                                You don't have any scheduled follow ups today matching the filtered parameters registry.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/field-agent-dashboard/add-visit")}
                            className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wide cursor-pointer transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add New Visit
                        </button>
                    </div>
                ) : (
                    /* CORE CRM REPOSITORY OUTPUT CONTROL DISPLAY GRID */
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedFollowUps.map((visit) => {
                                const mainImage = visit.images?.[0]?.imageUrl || null;

                                return (
                                    <div key={visit.id} className="bg-white border border-slate-200 rounded-xl shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group">

                                        {/* VISUAL IMAGE INTERACTION CELL (HOVER ZOOM LIGHTBOX CONNECTED) */}
                                        <div className="relative h-44 w-full bg-slate-100 border-b border-slate-100 overflow-hidden shrink-0">
                                            {mainImage ? (
                                                <img
                                                    src={mainImage}
                                                    alt={`${visit.title} outreach layout context template graphic index`}
                                                    loading="lazy"
                                                    onClick={() => setActiveImageGallery({ images: visit.images, index: 0 })}
                                                    className="w-full h-full object-cover transform duration-200 group-hover:scale-103 cursor-pointer"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1 select-none bg-slate-50">
                                                    <ImageIcon className="w-7 h-7 stroke-1 text-slate-300" />
                                                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">No Context Image</span>
                                                </div>
                                            )}

                                            <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-2xs ${getMarketingBadgeStyle(visit.marketingType)}`}>
                                                    {visit.marketingType || "GENERAL"}
                                                </span>
                                                <span className={`text-[9px] font-black uppercase tracking-widest border px-2 py-0.5 rounded shadow-2xs bg-white ${getStatusBadgeStyle(visit.status)}`}>
                                                    {visit.status || "PENDING"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* METADATA INTERACTIVE SPECIFICATION HOOKS WRAPPER */}
                                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">

                                            <div className="space-y-3">
                                                <div>
                                                    <h3 className="text-base font-bold text-slate-900 tracking-tight line-clamp-1">{visit.title || "Unnamed Enterprise"}</h3>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                                                        <span className="text-slate-600 block flex items-center gap-0.5 font-bold">
                                                            <Clock className="w-3 h-3 text-slate-400" /> Target Date: {formatDateString(visit.followUpDate)}
                                                        </span>
                                                        <span>•</span>
                                                        <span>Created: {formatDateString(visit.createdAt)}</span>
                                                    </div>
                                                </div>

                                                {/* Text Parameter Elements Details Core Structure */}
                                                <div className="space-y-1.5 text-xs text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate font-semibold text-slate-800">{visit.contactPerson || "No Contact Assigned"}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate tabular-nums font-medium">{visit.phoneNumber || "No Target Contacts Linked"}</span>
                                                    </div>

                                                    {visit.email && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                            <span className="truncate text-slate-500">{visit.email}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-start gap-2 pt-0.5">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                                        <span className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                                                            {[visit.address, visit.city, visit.state].filter(Boolean).join(", ")}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* DISCUSSION LOG SUMMARY COMPONENT NOTES */}
                                                {visit.notes && (
                                                    <div className="bg-slate-50 border-l-2 border-slate-300 p-2 text-[11px] text-slate-500 italic line-clamp-2 leading-relaxed">
                                                        "{visit.notes}"
                                                    </div>
                                                )}
                                            </div>

                                            {/* INTEGRATED OUTREACH LINKS AND PIPELINE EXECUTION TRIGGERS */}
                                            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">

                                                {/* Device Integration Action Matrix Link Layer */}
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    <a
                                                        href={`tel:${visit.phoneNumber}`}
                                                        className="inline-flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                                                    >
                                                        <Phone className="w-3 h-3" /> Call
                                                    </a>
                                                    <a
                                                        href={`https://wa.me/91${visit.phoneNumber?.replace(/[^0-9]/g, "")}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                                                    >
                                                        <MessageSquare className="w-3 h-3" /> WhatsApp
                                                    </a>
                                                    <a
                                                        href={visit.latitude && visit.longitude ? `https://maps.google.com/?q=${visit.latitude},${visit.longitude}` : "https://www.google.com/maps?q=latitude,longitude"}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                                                    >
                                                        <MapPin className="w-3 h-3" /> Map
                                                    </a>
                                                </div>

                                                {/* CRM Pipeline Lifecycle Updates Layer */}
                                                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                                                    <button
                                                        onClick={() => setCompleteConfirmationId(visit.id)}
                                                        className="inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                                                    >
                                                        <CheckCircle2 className="w-3 h-3" /> Complete Today
                                                    </button>
                                                    <button
                                                        onClick={() => setRescheduleData({ id: visit.id, date: visit.followUpDate ? visit.followUpDate.split("T")[0] : "" })}
                                                        className="inline-flex items-center justify-center gap-1 bg-slate-900 hover:bg-slate-800 text-white py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                                                    >
                                                        <Calendar className="w-3 h-3" /> Reschedule
                                                    </button>
                                                </div>

                                                {/* System Resource Configuration Parameters Subordinate Controls Grid */}
                                                <div className="grid grid-cols-3 gap-1.5 pt-1">
                                                    <button
                                                        onClick={() => navigate(`/field-agent-dashboard/visit/${visit.id}`)}
                                                        className="inline-flex items-center justify-center text-[10px] font-bold bg-white border border-slate-200 text-slate-500 hover:text-slate-900 py-1 rounded-md transition-colors cursor-pointer"
                                                    >
                                                        <Eye className="w-2.5 h-2.5" /> Details
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/field-agent-dashboard/edit-visit/${visit.id}`)}
                                                        className="inline-flex items-center justify-center text-[10px] font-bold bg-white border border-slate-200 text-slate-500 hover:text-slate-900 py-1 rounded-md transition-colors cursor-pointer"
                                                    >
                                                        <Edit3 className="w-2.5 h-2.5" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmationId(visit.id)}
                                                        className="inline-flex items-center justify-center text-[10px] font-bold bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 py-1 rounded-md transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5" /> Purge
                                                    </button>
                                                </div>

                                            </div>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* LOWER PAGINATION CONSOLE FRAMEWORK INTERACTION CONTROL */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 pt-6 gap-4">
                                <span className="text-xs text-slate-500 font-medium">
                                    Displaying records <span className="font-bold text-slate-900">{(currentPage - 1) * recordsPerPage + 1}</span> to{" "}
                                    <span className="font-bold text-slate-900">{Math.min(currentPage * recordsPerPage, processedFollowUps.length)}</span> of{" "}
                                    <span className="font-bold text-slate-900">{processedFollowUps.length}</span> pipeline elements found
                                </span>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 border border-slate-300 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, idx) => {
                                        const pageNo = idx + 1;
                                        return (
                                            <button
                                                key={pageNo}
                                                onClick={() => setCurrentPage(pageNo)}
                                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${currentPage === pageNo
                                                        ? "bg-slate-950 text-white border-slate-950 shadow-2xs"
                                                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {pageNo}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 border border-slate-300 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* MODAL 1: HIGH DEFINITION IMAGE LIGHTBOX VIEWER FRAMEWORK */}
            {activeImageGallery && (
                <div className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
                    <button
                        onClick={() => setActiveImageGallery(null)}
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full cursor-pointer transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="max-w-3xl w-full flex items-center justify-between gap-4">
                        <button
                            onClick={() => setActiveImageGallery(prev => ({ ...prev, index: Math.max(prev.index - 1, 0) }))}
                            disabled={activeImageGallery.index === 0}
                            className="p-2 bg-white/5 border border-white/10 rounded-full text-white disabled:opacity-20 cursor-pointer hover:bg-white/10"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div className="flex-1 text-center space-y-2">
                            <img
                                src={activeImageGallery.images[activeImageGallery.index]?.imageUrl}
                                alt="Enlarged survey documentation segment asset catalog tracker"
                                className="max-h-[75vh] mx-auto object-contain rounded-lg shadow-2xl border border-white/5"
                            />
                            <span className="text-[11px] font-mono tracking-widest text-white/50 bg-black/30 px-3 py-1 rounded-full inline-block">
                                Media Frame: {activeImageGallery.index + 1} / {activeImageGallery.images.length}
                            </span>
                        </div>
                        <button
                            onClick={() => setActiveImageGallery(prev => ({ ...prev, index: Math.min(prev.index + 1, prev.images.length - 1) }))}
                            disabled={activeImageGallery.index === activeImageGallery.images.length - 1}
                            className="p-2 bg-white/5 border border-white/10 rounded-full text-white disabled:opacity-20 cursor-pointer hover:bg-white/10"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL 2: APPOINTMENT SCHEDULER TIMELINE RESCHEDULE OVERLAY INTERFACE */}
            {rescheduleData && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-sm w-full shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-indigo-600" /> Reschedule Outreach
                            </h3>
                            <button onClick={() => setRescheduleData(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                        </div>

                        <form onSubmit={handleRescheduleExecute} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select New Target Follow Up Date</label>
                                <input
                                    type="date"
                                    value={rescheduleData.date}
                                    required
                                    onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-950 text-slate-900 bg-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRescheduleData(null)}
                                    className="border border-slate-200 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider py-2 rounded-lg text-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="bg-slate-950 hover:bg-slate-800 font-bold text-xs uppercase tracking-wider py-2 rounded-lg text-white transition-colors disabled:opacity-50"
                                >
                                    Update Timeline
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: LIFECYCLE TRANSITION UPDATE CONFIRMATION DIALOG BOX */}
            {completeConfirmationId && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-sm w-full shadow-xl text-center space-y-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900">Mark Outreach Completed?</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                This process modifies the strategic execution matrix tracking state parameters and marks this deployment pipeline successful.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 pt-2">
                            <button
                                onClick={() => setCompleteConfirmationId(null)}
                                className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMarkCompletedExecute}
                                disabled={actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                            >
                                Confirm Completion
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: CRITICAL TELEMETRY DATA PURGE TERMINATION OVERLAY CONFIRMATION BLOCK */}
            {deleteConfirmationId && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-sm w-full shadow-xl text-center space-y-4">
                        <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
                            <Trash2 className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900">Confirm Deletion Protocol?</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                This initialization terminates memory indices matching this element.Muted historical variables cannot be retrieved post asset validation completion.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 pt-2">
                            <button
                                onClick={() => setDeleteConfirmationId(null)}
                                className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition-colors"
                            >
                                Cancel Action
                            </button>
                            <button
                                onClick={handleDeleteExecute}
                                disabled={actionLoading}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                            >
                                Purge Record
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default FieldAgentFollowUps;