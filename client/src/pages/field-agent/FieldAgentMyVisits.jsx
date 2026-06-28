import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Filter, ChevronLeft, ChevronRight, Phone, MessageSquare,
  MapPin, Calendar, User, Mail, Trash2, Eye, Edit3, X, Image as ImageIcon,
  Building, BarChart3, AlertCircle, Plus, Layers, ArrowUpDown, CheckCircle2
} from "lucide-react";
import API from "../../api/axios";

const FieldAgentMyVisits = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || { id: "" };

  // Core Data States
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [marketingFilter, setMarketingFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Modals & Interactive States
  const [activeImageGallery, setActiveImageGallery] = useState(null); // { images: [], index: 0 }
  const [deleteConfirmationId, setDeleteConfirmationId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce Search Term Logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset page on query refinement
    }, 300000 / 1000); // 300ms Debounce Execution Window

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch Workflow Data Stream
  useEffect(() => {
    const fetchVisits = async () => {
      if (!user.id) {
        setError("User reference context identity assignment missing.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await API.get(`/api/field-visit/employee/${user.id}`);
        // Ensure structure parses as an iterable array payload
        setVisits(Array.isArray(response.data) ? response.data : response.data?.visits || []);
        setError(null);
      } catch (err) {
        console.error("Pipeline compilation data access exception: ", err);
        setError("Unable to retrieve operational lead history matrices.");
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, [user.id]);

  // Delete Core Action Runtime Handler
  const handleDeleteExecute = async () => {
    if (!deleteConfirmationId) return;
    try {
      setIsDeleting(true);
      await API.delete(`/api/field-visit/${deleteConfirmationId}`);
      setVisits(prev => prev.filter(v => v.id !== deleteConfirmationId));
      alert("Lead verification visit record purged from dashboard telemetry map.");
      setDeleteConfirmationId(null);
    } catch (err) {
      console.error("Lead termination processing block trace failure: ", err);
      alert(err.response?.data?.message || "Execution exception triggered during structural resource depletion.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Derived Telemetry State Processing Loop (useMemo performance guard)
  const statistics = useMemo(() => {
    const stats = { total: 0, today: 0, pending: 0, interested: 0, customer: 0 };
    const todayStr = new Date().toISOString().split("T")[0];

    visits.forEach(v => {
      stats.total++;

      // Strict layout matching configuration parsing for validation timestamps
      if (v.createdAt) {
        const createdDateStr = new Date(v.createdAt).toISOString().split("T")[0];
        if (createdDateStr === todayStr) stats.today++;
      }

      const statusKey = v.status?.toUpperCase();
      if (statusKey === "PENDING") stats.pending++;
      else if (statusKey === "INTERESTED") stats.interested++;
      else if (statusKey === "CUSTOMER") stats.customer++;
    });

    return stats;
  }, [visits]);

  // Transformation Pipelines: Search, Custom Filter, and Sort Matrix
  const processedVisits = useMemo(() => {
    let output = [...visits];

    // Query Strategy Search Alignment Mapping Rules
    if (debouncedSearch.trim()) {
      const target = debouncedSearch.toLowerCase().trim();
      output = output.filter(v =>
        v.title?.toLowerCase().includes(target) ||
        v.contactPerson?.toLowerCase().includes(target) ||
        v.phoneNumber?.toLowerCase().includes(target) ||
        v.city?.toLowerCase().includes(target) ||
        v.state?.toLowerCase().includes(target) ||
        v.marketingType?.toLowerCase().includes(target)
      );
    }

    // Dropdown Filtering Logic Check Blocks
    if (statusFilter !== "ALL") {
      output = output.filter(v => v.status?.toUpperCase() === statusFilter);
    }

    if (marketingFilter !== "ALL") {
      output = output.filter(v => v.marketingType?.toUpperCase() === marketingFilter);
    }

    // Evaluation Metric Sorting Routines Execution Layer
    output.sort((a, b) => {
      if (sortBy === "NEWEST") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === "OLDEST") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === "FOLLOW_UP") {
        if (!a.followUpDate) return 1;
        if (!b.followUpDate) return -1;
        return new Date(a.followUpDate) - new Date(b.followUpDate);
      }
      if (sortBy === "TITLE") {
        return (a.title || "").localeCompare(b.title || "");
      }
      return 0;
    });

    return output;
  }, [visits, debouncedSearch, statusFilter, marketingFilter, sortBy]);

  // Structured Pagination Slicing Allocation Window
  const totalPages = Math.ceil(processedVisits.length / recordsPerPage) || 1;
  const paginatedVisits = useMemo(() => {
    const startIdx = (currentPage - 1) * recordsPerPage;
    return processedVisits.slice(startIdx, startIdx + recordsPerPage);
  }, [processedVisits, currentPage]);

  // Sync index boundaries safely during mutation processing arrays loops
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Utility Date Formatter (Intl Namespace API specifications layout mapping)
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

  // Badge Status CSS Variable Color Compiler mapping
  const getStatusBadgeStyle = (rawStatus) => {
    const s = rawStatus?.toUpperCase() || "";
    if (s === "PENDING") return "bg-amber-50 text-amber-700 border-amber-200";
    if (s === "INTERESTED") return "bg-blue-50 text-blue-700 border-blue-200";
    if (s === "CUSTOMER") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "NOT_INTERESTED") return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  // Badge Domain Segment Context Styling Arrays logic
  const getMarketingBadgeStyle = (rawType) => {
    const m = rawType?.toUpperCase() || "";
    if (m === "GARAGE") return "bg-blue-600 text-white";
    if (m === "SCHOOL") return "bg-purple-600 text-white";
    if (m === "HOSPITAL") return "bg-rose-600 text-white";
    if (m === "RESTAURANT") return "bg-orange-600 text-white";
    if (m === "HOTEL") return "bg-cyan-600 text-white";
    return "bg-slate-500 text-white"; // General tracking matrix allocation
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 selection:bg-slate-950 selection:text-white">

      {/* PAGE RUNTIME STICKY CONTROL HEADER PANEL */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-4 sm:px-6 md:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-slate-500 font-bold block mb-0.5">
              Enterprise Dashboard Registry
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              My Field Business Leases
            </h1>
          </div>

          <button
            onClick={() => navigate("/field-agent-dashboard/add-visit")}
            className="inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer w-full md:w-auto text-center"
          >
            <Plus className="w-4 h-4" /> Add Field Record
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 md:px-8 pb-32 space-y-6">

        {/* METADATA PIPELINE STATISTICAL OVERLAY BLOCK MATRIX (Sticky Top Optional Layer) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">

          {/* TOTAL CARD */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pipeline</span>
              <span className="text-xl font-bold text-slate-900">{statistics.total}</span>
            </div>
          </div>

          {/* TODAY ACTIVITY */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Captured Today</span>
              <span className="text-xl font-bold text-slate-900">{statistics.today}</span>
            </div>
          </div>

          {/* ACTIVE TRIAL PENDING CARD */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Leads</span>
              <span className="text-xl font-bold text-slate-900">{statistics.pending}</span>
            </div>
          </div>

          {/* CONVERTED CONTEXT INTERESTED SECTION */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Interested Matrix</span>
              <span className="text-xl font-bold text-slate-900">{statistics.interested}</span>
            </div>
          </div>

          {/* COMMITTED CONVERTED ACQUIRED CUSTOMERS CARD */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Closed Accounts</span>
              <span className="text-xl font-bold text-emerald-600">{statistics.customer}</span>
            </div>
          </div>
        </div>

        {/* STICKY LEAD CONVERSION TRIAGE ROUTING CONTROL MATRIX SEARCH FILTER BAR */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-4 sticky top-[81px] z-20 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">

            {/* ONSITE PATTERN SEARCH ENGINE INPUT */}
            <div className="md:col-span-5 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search business name, agent, phone number, city context..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 transition-all bg-slate-50/50"
              />
            </div>

            {/* LIFECYCLE TRIAGE SELECTION STAGE STATUS INPUT */}
            <div className="md:col-span-2 relative flex items-center">
              <span className="absolute left-3 text-slate-400 pointer-events-none">
                <Filter className="w-3.5 h-3.5" />
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-8 pr-2 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-700 outline-none focus:border-slate-900"
              >
                <option value="ALL">All Status Pipeline</option>
                <option value="PENDING">PENDING</option>
                <option value="FOLLOW_UP">FOLLOW UP</option>
                <option value="INTERESTED">INTERESTED</option>
                <option value="CUSTOMER">CUSTOMER</option>
                <option value="NOT_INTERESTED">NOT INTERESTED</option>
              </select>
            </div>

            {/* MARKETING FIELD CONTEXT INDEX SELECTION INPUT */}
            <div className="md:col-span-2 relative flex items-center">
              <span className="absolute left-3 text-slate-400 pointer-events-none">
                <Layers className="w-3.5 h-3.5" />
              </span>
              <select
                value={marketingFilter}
                onChange={(e) => setMarketingFilter(e.target.value)}
                className="w-full pl-8 pr-2 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-700 outline-none focus:border-slate-900"
              >
                <option value="ALL">All Marketing Focus</option>
                <option value="GARAGE">Garage Channel</option>
                <option value="SCHOOL">School Channel</option>
                <option value="HOSPITAL">Hospital Channel</option>
                <option value="RESTAURANT">Restaurant Channel</option>
                <option value="HOTEL">Hotel Channel</option>
                <option value="GENERAL">General Marketing</option>
              </select>
            </div>

            {/* SORT DISPATCH DIRECTION MATRIX SORTING LAYERS */}
            <div className="md:col-span-3 relative flex items-center">
              <span className="absolute left-3 text-slate-400 pointer-events-none">
                <ArrowUpDown className="w-3.5 h-3.5" />
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-8 pr-2 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-700 outline-none focus:border-slate-900"
              >
                <option value="NEWEST">Sorting: Newest Records</option>
                <option value="OLDEST">Sorting: Oldest Records</option>
                <option value="FOLLOW_UP">Sorting: Follow-up Timeline</option>
                <option value="TITLE">Sorting: Alpha Business Title</option>
              </select>
            </div>

          </div>

          {/* ACTIVE FILTER DISPATCH META BANNER SUMMARY */}
          {(statusFilter !== "ALL" || marketingFilter !== "ALL" || debouncedSearch.trim() !== "") && (
            <div className="flex items-center justify-between text-[11px] font-bold bg-slate-50 px-3 py-1.5 rounded-lg text-slate-500 uppercase tracking-wider border border-slate-100">
              <span>Matching Pipeline Array Vector Size Metrics: {processedVisits.length} leads tracked</span>
              <button
                onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); setMarketingFilter("ALL"); setSortBy("NEWEST"); }}
                className="text-slate-900 hover:underline cursor-pointer"
              >
                Clear Operational Filter Parameters
              </button>
            </div>
          )}
        </div>

        {/* INTERACTIVE WORKSPACE DESK RENDERING VIEWPORTS ARCHITECTURE */}
        {loading ? (
          /* PIPELINE RENDERING SKELETON PLACEHOLDER LOADING MATRICES */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(skeletonIdx => (
              <div key={skeletonIdx} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-1/2 h-4 bg-slate-200 rounded" />
                  <div className="w-1/4 h-5 bg-slate-200 rounded-full" />
                </div>
                <div className="w-full h-36 bg-slate-200 rounded-lg" />
                <div className="space-y-2 pt-2">
                  <div className="w-3/4 h-3 bg-slate-200 rounded" />
                  <div className="w-5/6 h-3 bg-slate-200 rounded" />
                  <div className="w-2/3 h-3 bg-slate-200 rounded" />
                </div>
                <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2">
                  <div className="h-8 bg-slate-200 rounded-lg" />
                  <div className="h-8 bg-slate-200 rounded-lg" />
                  <div className="h-8 bg-slate-200 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* CORE DISPATCH SYSTEM EXCEPTION HANDLING MATRIX BANNER */
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-xl flex items-start gap-3.5 shadow-xs">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-bold text-sm">System Telemetry Exception Occurred</h3>
              <p className="text-xs mt-1 text-rose-700/90 leading-relaxed">{error}</p>
            </div>
          </div>
        ) : paginatedVisits.length === 0 ? (
          /* EMPTY STATE DESIGN TEMPLATE CONTAINER MODULE */
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-xl mx-auto shadow-xs space-y-5 my-12 animate-fadeIn">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Building className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No Visits Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Start adding your first marketing visit. No mapped business data structures fit the requested filter allocation queries.
              </p>
            </div>
            <button
              onClick={() => navigate("/field-agent-dashboard/add-visit")}
              className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wide cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Register Lead Placement
            </button>
          </div>
        ) : (
          /* CORE CRM CARD REPRESENTATION RENDERING GRID ENGINE */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedVisits.map((visit) => {
                const mainImage = visit.images?.[0]?.imageUrl || null;

                return (
                  <div
                    key={visit.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden group"
                  >

                    {/* VISUAL ASSET COVER IMAGE WRAPPER LAYER (Hover Zoom Functionality Embedded) */}
                    <div className="relative h-44 w-full bg-slate-100 border-b border-slate-100 overflow-hidden shrink-0">
                      {mainImage ? (
                        <img
                          src={mainImage}
                          alt={`${visit.title} layout context location metadata file`}
                          loading="lazy"
                          onClick={() => setActiveImageGallery({ images: visit.images, index: 0 })}
                          className="w-full h-full object-cover transform duration-300 group-hover:scale-105 cursor-pointer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1.5 select-none">
                          <ImageIcon className="w-8 h-8 stroke-1" />
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Media Vault Empty</span>
                        </div>
                      )}

                      {/* STRUCT BADGES BOUND ON ABSOLUTE IMAGE PLANES */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-xs ${getMarketingBadgeStyle(visit.marketingType)}`}>
                          {visit.marketingType || "GENERAL"}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded shadow-xs bg-white ${getStatusBadgeStyle(visit.status)}`}>
                          {visit.status || "PENDING"}
                        </span>
                      </div>
                    </div>

                    {/* CORE BUSINESS METRIC DETAILS CELL */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">

                      <div className="space-y-3">
                        {/* Core Enterprise Header */}
                        <div>
                          <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-slate-900 line-clamp-1">
                            {visit.title || "Unnamed Lead Enterprise"}
                          </h3>
                          <span className="text-[10px] font-medium text-slate-400 block mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Recorded: {formatDateString(visit.createdAt)}
                          </span>
                        </div>

                        {/* Associated Structural Metadata Parameters Lists */}
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate font-medium">{visit.contactPerson || "No Name Index Specified"}</span>
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
                              {[visit.address, visit.city, visit.district, visit.state].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        </div>

                        {/* CRITICAL TIMELINE FOLLOW-UP TARGET BAR CONTAINER */}
                        <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-2 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" /> Matrix Follow Up:
                          </span>
                          <span className="font-semibold text-slate-800 bg-white border border-slate-200 rounded px-2 py-0.5 text-[11px]">
                            {formatDateString(visit.followUpDate)}
                          </span>
                        </div>

                        {/* DESCRIPTIVE DIALOGUE STRATEGIC DISCUSSION LOG */}
                        {visit.notes && (
                          <div className="bg-slate-50/50 border-l-2 border-slate-300 px-2.5 py-1.5 text-xs text-slate-500 italic line-clamp-2 leading-relaxed">
                            "{visit.notes}"
                          </div>
                        )}
                      </div>

                      {/* INTEGRATED COMMUNICATION & LOGISTICS TRIGGER CONSOLE GRID */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">

                        {/* Communication Matrix Routing Handles */}
                        <div className="grid grid-cols-3 gap-2">
                          <a
                            href={`tel:${visit.phoneNumber}`}
                            className="inline-flex items-center justify-center gap-1.5 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-lg text-xs font-bold transition-all"
                            title="Execute Direct Trunk Telephone Dialing Loop"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call
                          </a>
                          <a
                            href={`https://wa.me/${visit.phoneNumber?.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-1.5 rounded-lg text-xs font-bold transition-all"
                            title="Forward Message String Payload Direct via WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                          <a
                            href={visit.latitude && visit.longitude ? `https://maps.google.com/?q=${visit.latitude},${visit.longitude}` : "https://www.google.com/maps?q=latitude,longitude"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1.5 rounded-lg text-xs font-bold transition-all"
                            title="Cross-reference Satellites Pinpoint Target Geolocation Spatial Domain"
                          >
                            <MapPin className="w-3.5 h-3.5" /> Map
                          </a>
                        </div>

                        {/* Structural Dashboard Modification Administrative Triggers */}
                        <div className="grid grid-cols-3 gap-2 pt-0.5">
                          <button
                            onClick={() => navigate(`/field-agent-dashboard/visit/${visit.id}`)}
                            className="inline-flex items-center justify-center gap-1 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-400 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" /> Inspect
                          </button>
                          <button
                            onClick={() => navigate(`/field-agent-dashboard/edit-visit/${visit.id}`)}
                            className="inline-flex items-center justify-center gap-1 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-400 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" /> Revise
                          </button>
                          <button
                            onClick={() => setDeleteConfirmationId(visit.id)}
                            className="inline-flex items-center justify-center gap-1 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Wipe
                          </button>
                        </div>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* CONTROL BAR INTERACTION COMPONENT: PAGINATION NAVIGATION TRACK */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/80 pt-6 gap-4">
                <span className="text-xs text-slate-500 font-medium">
                  Showing Row Blocks <span className="font-bold text-slate-900">{(currentPage - 1) * recordsPerPage + 1}</span> to{" "}
                  <span className="font-bold text-slate-900">{Math.min(currentPage * recordsPerPage, processedVisits.length)}</span> of{" "}
                  <span className="font-bold text-slate-900">{processedVisits.length}</span> Tracked Matrix Entities
                </span>

                <div className="flex items-center gap-1">
                  {/* Prev Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Dynamic Page Index Blocks Loop */}
                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer border ${currentPage === pageNumber
                            ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                          }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* CORE MODAL FRAMEWORK 1: INTERACTIVE IMAGE LIGHTBOX GALLERY (Prev, Next, Next Lazy, Loop Closure) */}
      {activeImageGallery && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <button
            onClick={() => setActiveImageGallery(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full shadow-lg transition-all cursor-pointer"
            title="Terminate Viewport Screen Canvas Loop Overlay"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-4xl w-full flex items-center justify-between gap-4">
            {/* Prev Channel Control Button */}
            <button
              onClick={() => setActiveImageGallery(prev => ({ ...prev, index: Math.max(prev.index - 1, 0) }))}
              disabled={activeImageGallery.index === 0}
              className="p-3 border border-white/10 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Central Media Canvas Viewport */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-2">
              <img
                src={activeImageGallery.images[activeImageGallery.index]?.imageUrl}
                alt={`Expanded analytical asset structural photo matrix sequence index view ${activeImageGallery.index + 1}`}
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl border border-white/5"
              />
              <span className="text-white/60 text-xs font-mono tracking-widest bg-black/40 px-3 py-1 rounded-full">
                Sequence Matrix Index File Context Index Tracker Pool: {activeImageGallery.index + 1} / {activeImageGallery.images.length}
              </span>
            </div>

            {/* Next Channel Control Button */}
            <button
              onClick={() => setActiveImageGallery(prev => ({ ...prev, index: Math.min(prev.index + 1, prev.images.length - 1) }))}
              disabled={activeImageGallery.index === activeImageGallery.images.length - 1}
              className="p-3 border border-white/10 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* CORE MODAL FRAMEWORK 2: ADMINISTRATIVE leads ERASURE REPOSITORY INTERACTION CONFIRMATION CONSOLE */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Are you sure?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This process initiates absolute framework data erasure. Spatially linked metadata variables, customer contact records, and tracking telemetry files will be permanently purged.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                disabled={isDeleting}
                className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Cancel Action
              </button>
              <button
                onClick={handleDeleteExecute}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Purging...
                  </>
                ) : (
                  "Delete Resource"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FieldAgentMyVisits;