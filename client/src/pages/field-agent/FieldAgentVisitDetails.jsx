import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    MapPin, Phone, MessageSquare, Calendar, User, Mail, Trash2, Edit3, X,
    ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Building, Layers,
    FileText, ArrowLeft, ExternalLink, Copy, CheckCircle2, UserCheck, Clock,
    AlertCircle, Briefcase, FileSpreadsheet, Eye, Loader2, Plus, History
} from "lucide-react";
import API from "../../api/axios";
import FollowUpModal from "./Followupmodal";
import FollowUpTimeline from "./Followuptimeline";
import Toast from "./Toast";

const FieldAgentVisitDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Core Lifecycle States
    const [visit, setVisit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [toast, setToast] = useState(null); // { message, type }

    // Lightbox Modal States
    const [lightbox, setLightbox] = useState({ show: false, images: [], index: 0, scale: 1 });

    useEffect(() => {
        const fetchVisitDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await API.get(`/api/field-visit/${id}`);
                setVisit(response.data);
            } catch (err) {
                console.error("Error retrieving field execution matrix payload: ", err);
                setError("Failed to construct synchronized pipeline data matching this lead token.");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchVisitDetails();
    }, [id]);

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await API.delete(`/api/field-visit/${id}`);
            setDeleteModal(false);
            alert("Business lead history parameters wiped successfully from cloud registry.");
            navigate("/field-agent-dashboard/my-visits");
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Internal transaction depletion tracking exception.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCopyText = (text) => {
        navigator.clipboard.writeText(text);
        alert(`Copied: ${text}`);
    };

    const formatDateString = (rawDate) => {
        if (!rawDate) return "N/A";
        try {
            return new Intl.DateTimeFormat("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric"
            }).format(new Date(rawDate));
        } catch (e) {
            return "N/A";
        }
    };

    const getStatusBadgeStyle = (rawStatus) => {
        const s = rawStatus?.toUpperCase() || "";
        if (s === "PENDING") return "bg-amber-50 text-amber-700 border-amber-200";
        if (s === "INTERESTED") return "bg-blue-50 text-blue-700 border-blue-200";
        if (s === "CUSTOMER") return "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (s === "NOT_INTERESTED") return "bg-rose-50 text-rose-700 border-rose-200";
        return "bg-slate-50 text-slate-700 border-slate-200";
    };

    const getPriorityStyle = (p) => {
        const pr = p?.toUpperCase() || "MEDIUM";
        if (pr === "HIGH") return "text-rose-600 font-bold bg-rose-50 border-rose-100";
        if (pr === "LOW") return "text-slate-500 font-bold bg-slate-100 border-slate-200";
        return "text-amber-600 font-bold bg-amber-50 border-amber-100";
    };

    // Safe Image Array Extraction Helper
    const parsedContacts = typeof visit?.contacts === "string" ? JSON.parse(visit.contacts) : visit?.contacts || [];
    const parsedEmails = typeof visit?.emails === "string" ? JSON.parse(visit.emails) : visit?.emails || [];
    const parsedProducts = typeof visit?.interestedProducts === "string" ? JSON.parse(visit.interestedProducts) : visit?.interestedProducts || [];

    const openLightbox = (urlArray, idx = 0) => {
        if (!urlArray || urlArray.length === 0) return;
        setLightbox({ show: true, images: urlArray, index: idx, scale: 1 });
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 md:px-8 space-y-6 animate-pulse">
                <div className="h-24 bg-white rounded-xl border border-slate-200" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="h-64 bg-white rounded-xl border border-slate-200" />
                        <div className="h-44 bg-white rounded-xl border border-slate-200" />
                    </div>
                    <div className="h-96 bg-white rounded-xl border border-slate-200" />
                </div>
            </div>
        );
    }

    if (error || !visit) {
        return (
            <div className="max-w-xl mx-auto my-16 text-center bg-white border border-slate-200 p-8 rounded-xl shadow-xs space-y-4">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">Resource Retrieval Blocked</h3>
                <p className="text-xs text-slate-400">{error || "The requested visit ledger reference does not map to any structured asset on this cloud partition."}</p>
                <button onClick={() => navigate("/field-agent-dashboard/my-visits")} className="px-4 py-2 text-xs font-bold uppercase bg-slate-950 text-white rounded-lg hover:bg-slate-800 transition-colors">
                    Return To Registry
                </button>
            </div>
        );
    }

    // Gallery Pipeline Preparation
    const standardImages = visit.images?.map(img => img.imageUrl) || [];
    const docFilesList = [
        { key: "businessCardFront", label: "Business Card Front", url: visit.businessCardFront },
        { key: "businessCardBack", label: "Business Card Back", url: visit.businessCardBack },
        { key: "gstCertificate", label: "GST Certificate", url: visit.gstCertificate },
        { key: "quotationDoc", label: "Provisional Quotation", url: visit.quotationDoc },
        { key: "brochureDoc", label: "Material Brochure Portfolio", url: visit.brochureDoc }
    ].filter(d => d.url);

    return (
        <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 selection:bg-slate-950 selection:text-white">

            {/* ENTERPRISE WORKSTATION STICKY ADMINISTRATIVE HEADER PANEL */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-4 sm:px-6 md:px-8 shadow-xs">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                        <button
                            onClick={() => navigate("/field-agent-dashboard/my-visits")}
                            className="mt-1 p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="bg-slate-900 text-white font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
                                    {visit.marketingType || "GENERAL"}
                                </span>
                                <span className={`text-[9px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-sm bg-white ${getStatusBadgeStyle(visit.status)}`}>
                                    {visit.status || "PENDING"}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                                {visit.title || "Unnamed Lead Enterprise"}
                            </h1>
                            <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <Clock className="w-3 h-3" /> Mapped parameters: {formatDateString(visit.createdAt)} • Synchronized check: {formatDateString(visit.updatedAt || visit.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* SYSTEM RESOURCE CONTROLS INTERFACE */}
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                        <button
                            onClick={() => setShowFollowUpModal(true)}
                            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Follow-up
                        </button>
                        <button
                            onClick={() => navigate(`/field-agent-dashboard/edit-visit/${visit.id}`)}
                            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            <Edit3 className="w-3.5 h-3.5" /> Revise
                        </button>
                        <button
                            onClick={() => setDeleteModal(true)}
                            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Wipe
                        </button>
                    </div>
                </div>
            </header>

            {/* CORE WORKSPACE DETAILS GRID LAYOUT */}
            <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 md:px-8 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* PRIMARY FLOW MODULES ARCHITECTURE (LEFT & CENTER COLUMNS) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* BUSINESS INFORMATION COMPONENT CARD */}
                        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                                <Building className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Business Core Parameters</h2>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                                <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                                    <span className="block font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-0.5">Category Node</span>
                                    <span className="font-bold text-slate-800">{visit.businessCategory || "Unspecified Category"}</span>
                                </div>
                                <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                                    <span className="block font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-0.5">Strategy Source Link</span>
                                    <span className="font-bold text-slate-800">{visit.source || "Cold Outreach"}</span>
                                </div>
                                <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                                    <span className="block font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-0.5">Triage Priority</span>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] inline-block ${getPriorityStyle(visit.priority)}`}>
                                        {visit.priority || "Medium"}
                                    </span>
                                </div>
                                <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                                    <span className="block font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-0.5">Dialogue Result Metric</span>
                                    <span className="font-bold text-slate-800">{visit.meetingResult || "Discussed"}</span>
                                </div>
                                <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100 col-span-2 sm:col-span-2">
                                    <span className="block font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-0.5">Estimated Deal Value Size</span>
                                    <span className="font-black text-slate-900 text-sm tracking-tight tabular-nums">
                                        {visit.leadValue ? `₹ ${Number(visit.leadValue).toLocaleString("en-IN")}` : "₹ 0.00"}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* DYNAMIC ASSOCIATED PERSONNEL DIRECTORY CELL */}
                        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                                <User className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Personnel Directory Matrix</h2>
                            </div>

                            {parsedContacts.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-2">No structured individual contact parameters indexed against this account.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {parsedContacts.map((c, index) => (
                                        <div key={index} className={`p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3 relative ${c.isPrimary ? 'border-slate-950 bg-white shadow-2xs' : ''}`}>
                                            {c.isPrimary && (
                                                <span className="absolute top-3 right-3 bg-slate-950 text-white font-bold uppercase tracking-widest text-[8px] px-1.5 py-0.5 rounded shadow-3xs">
                                                    Primary Contact
                                                </span>
                                            )}
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 truncate pr-16">{c.name || "Unnamed Representative"}</h4>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{c.designation || "Executive Stakeholder"}</span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2.5 gap-2 font-mono">
                                                <span className="font-bold tracking-tight text-slate-700">{c.phoneNumber}</span>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <a href={`tel:${c.phoneNumber}`} className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"><Phone className="w-3.5 h-3.5" /></a>
                                                    <a href={`https://wa.me/91${c.phoneNumber?.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors"><MessageSquare className="w-3.5 h-3.5" /></a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* DYNAMIC ASSOCIATED COMMUNICATIONS SECTIONS */}
                        {parsedEmails.length > 0 && (
                            <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
                                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                                    <Mail className="w-5 h-5 text-slate-900" />
                                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Corporate Email Indexes</h2>
                                </div>
                                <div className="space-y-2">
                                    {parsedEmails.map((email, eIdx) => (
                                        <div key={eIdx} className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 font-mono">
                                            <span className="text-slate-700 truncate">{email}</span>
                                            <button onClick={() => handleCopyText(email)} className="text-slate-400 hover:text-slate-900 p-1 transition-colors" title="Copy index address">
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* STRATEGIC DIALOGUE NOTES SUMMARY DISPATCH */}
                        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                                <FileText className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Interaction Discussion Summary</h2>
                            </div>
                            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl min-h-[100px]">
                                <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                                    {visit.discussionSummary || visit.notes || "No strategic summary dialogue notes captured on site parameter indexes matching current workflow shift logs."}
                                </p>
                            </div>
                        </section>

                        {/* CORE PHYSICAL MEDIA GEOGRAPHIC PHOTO IMAGERY PIPELINE STREAMS */}
                        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                                <Eye className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Onsite Context Media Previews</h2>
                            </div>

                            {standardImages.length === 0 ? (
                                <div className="text-center py-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                                    No workspace layout verification pictures logged in ambient directory vaults.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {standardImages.map((url, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => openLightbox(standardImages, idx)}
                                            className="relative aspect-square border border-slate-200 rounded-xl overflow-hidden cursor-pointer group bg-slate-100"
                                        >
                                            <img src={url} alt={`Ambient audit storefront track piece index ${idx + 1}`} className="w-full h-full object-cover transform duration-200 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Eye className="w-5 h-5" /></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* SECONDARY RUNTIME METADATA PIPELINE CHANNELS BOX (RIGHT COLUMN) */}
                    <div className="space-y-6">

                        {/* TIMELINE TRIAGE METRICS PIPELINE DATES */}
                        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                                <Calendar className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Follow Up Matrix Configuration</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-950 text-white rounded-xl p-4 flex items-center justify-between text-xs shadow-inner">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Next Matrix Check
                                    </span>
                                    <span className="font-black bg-white/10 border border-white/10 rounded px-2.5 py-1 text-xs tracking-wide text-slate-100 font-mono tabular-nums">
                                        {formatDateString(visit.followUpDate)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    {/* ADDED MISSING VISITED DATE BLOCK */}
                                    <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50/50">
                                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Initial Visit Date</span>
                                        <span className="font-bold text-slate-800">{formatDateString(visit.visitedDate)}</span>
                                    </div>
                                    <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50/50">
                                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Follow Up Mode</span>
                                        <span className="font-bold text-slate-800">{visit.nextFollowUpMode || "Phone Call"}</span>
                                    </div>
                                    <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50/50 col-span-2">
                                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Current Lifecycle</span>
                                        <span className="font-bold text-slate-800">{visit.status || "PENDING"}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* LOGISTICS SPATIAL GRID DOMAIN LINK MODULE */}
                        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                                <MapPin className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Geographic Boundaries</h2>
                            </div>
                            <div className="space-y-3.5 text-xs text-slate-600">
                                <p className="leading-relaxed font-semibold text-slate-800">
                                    {[visit.address, visit.city, visit.district, visit.state].filter(Boolean).join(", ") || "No physical street address components configured."}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono font-bold text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <span>Lat: {visit.latitude || "N/A"}</span>
                                    <span>Lng: {visit.longitude || "N/A"}</span>
                                </div>
                                <a
                                    href={visit.latitude && visit.longitude ? `https://maps.google.com/?q=${visit.latitude},${visit.longitude}` : "https://www.google.com/maps?q=latitude,longitude"}
                                    target="_blank" rel="noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" /> Navigate via Google Maps
                                </a>
                            </div>
                        </section>

                        {/* PRODUCT INTERESTS SEGMENT MATRIX MODULE CHIPS */}
                        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                                <Briefcase className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Catalogs Pipeline Focus</h2>
                            </div>
                            {parsedProducts.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No specific system core product indices cross-checked during verification shift parameters.</p>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {parsedProducts.map((p, pIdx) => (
                                        <span key={pIdx} className="bg-slate-100 border border-slate-200 font-bold text-slate-800 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* REFERRAL NETWORK MANAGEMENT COMPONENT METRICS MODULE */}
                        {/* FIXED: Changed referredByNumber to referredByPhone to match AddVisit payload */}
                        {(visit.referredByName || visit.referredByPhone) && (
                            <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
                                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                                    <UserCheck className="w-5 h-5 text-slate-900" />
                                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Referral Affiliate Node</h2>
                                </div>
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                        <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Affiliate Name</span>
                                        <span className="font-semibold text-slate-800">{visit.referredByName || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                        <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Contact Digits</span>
                                        <span className="font-mono text-slate-700 font-bold tracking-tight">{visit.referredByPhone || "N/A"}</span>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* STRUCTURED DATA VAULT FILE COLLATERAL PIPELINES ARCHITECTURE LIST */}
                        {docFilesList.length > 0 && (
                            <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
                                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                                    <FileSpreadsheet className="w-5 h-5 text-slate-900" />
                                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Document Indexes Repository</h2>
                                </div>
                                <div className="space-y-2">
                                    {docFilesList.map((doc) => (
                                        <div
                                            key={doc.key}
                                            onClick={() => openLightbox([doc.url], 0)}
                                            className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-slate-400 bg-slate-50/50 text-xs font-semibold cursor-pointer group transition-all"
                                        >
                                            <span className="text-slate-700 truncate max-w-[80%]">{doc.label}</span>
                                            <Eye className="w-4 h-4 text-slate-400 group-hover:text-slate-900 shrink-0 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* RECORD ACCOUNTABILITY OWNERSHIP METRIC SECTION BLOCK */}
                        {visit.employee && (
                            <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs text-xs space-y-3 bg-slate-50/20">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                    <User className="w-4 h-4" /> Outreach Accountable Agent
                                </div>
                                <div className="space-y-1.5 font-medium text-slate-600">
                                    <p className="font-bold text-slate-900 text-sm">{visit.employee.name || "Field Officer Registry Node"}</p>
                                    <p className="truncate text-slate-500 font-mono">{visit.employee.email}</p>
                                </div>
                            </section>
                        )}

                        {/* FOLLOW-UP CRM TIMELINE TRACK (newest first) */}
                        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                                    <History className="w-3.5 h-3.5" /> Follow-up Timeline
                                </div>
                                <button
                                    onClick={() => setShowFollowUpModal(true)}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 hover:text-slate-950 cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" /> Add
                                </button>
                            </div>
                            <FollowUpTimeline followUps={visit.followUps || []} />
                        </section>
                    </div>

                </div>
            </main>

            {/* LIGHTBOX GALLERIES OVERLAY CANVAS ENGINE CONTROLLER */}
            {lightbox.show && (
                <div className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">

                    {/* Top Panel Actions Utility Strip */}
                    <div className="absolute top-4 inset-x-4 flex items-center justify-between text-white z-50">
                        <span className="text-xs font-mono bg-black/40 px-3 py-1 rounded-full border border-white/10 tracking-widest">
                            Asset Frame Block: {lightbox.index + 1} / {lightbox.images.length}
                        </span>

                        <div className="flex items-center gap-3">
                            <button onClick={() => setLightbox(prev => ({ ...prev, scale: Math.min(prev.scale + 0.25, 3) }))} className="p-2 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
                            <button onClick={() => setLightbox(prev => ({ ...prev, scale: Math.max(prev.scale - 0.25, 0.5) }))} className="p-2 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer"><ZoomOut className="w-4 h-4" /></button>
                            <a href={lightbox.images[lightbox.index]} download target="_blank" rel="noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"><Download className="w-4 h-4" /></a>
                            <button onClick={() => setLightbox({ show: false, images: [], index: 0, scale: 1 })} className="p-2 bg-white/20 hover:bg-rose-600 rounded-full cursor-pointer transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="max-w-4xl w-full flex items-center justify-between gap-4">
                        {/* Prev handle */}
                        <button
                            onClick={() => setLightbox(prev => ({ ...prev, index: Math.max(prev.index - 1, 0), scale: 1 }))}
                            disabled={lightbox.index === 0}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full transition-all disabled:opacity-10 cursor-pointer shrink-0"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        {/* Central Stream Viewplane */}
                        <div className="flex-1 flex justify-center items-center overflow-hidden h-[75vh]">
                            <img
                                src={lightbox.images[lightbox.index]}
                                alt={`Extended high definition audit file preview visualization pane index tracking ${lightbox.index + 1}`}
                                style={{ transform: `scale(${lightbox.scale})` }}
                                className="max-h-full max-w-full object-contain rounded shadow-2xl transition-transform duration-200 border border-white/5"
                            />
                        </div>

                        {/* Next handle */}
                        <button
                            onClick={() => setLightbox(prev => ({ ...prev, index: Math.min(prev.index + 1, prev.images.length - 1), scale: 1 }))}
                            disabled={lightbox.index === lightbox.images.length - 1}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full transition-all disabled:opacity-10 cursor-pointer shrink-0"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* CONFIRMATION EXPLICIT RESOURCE PURGING ERASURE MODAL CONSOLE OVERLAY */}
            {deleteModal && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <Trash2 className="w-5 h-5" />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900">Are you absolutely sure?</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                This transaction performs immediate deletion of the account lead from cloud data tables. Stored personal matrix arrays, documentation references, and follow-up timeline nodes will be permanently wiped out.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeleteModal(false)}
                                disabled={isDeleting}
                                className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                Cancel Action
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                Wipe Record
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CRM FOLLOW-UP MODAL */}
            {showFollowUpModal && (
                <FollowUpModal
                    visitId={visit.id}
                    onClose={() => setShowFollowUpModal(false)}
                    onSaved={(followUps) => {
                        const latest = followUps[0] || null;
                        setVisit(prev => prev ? {
                            ...prev,
                            followUps,
                            nextFollowUpDate: latest?.followUpDate || prev.nextFollowUpDate,
                            followUpDate: latest?.followUpDate || prev.followUpDate,
                            latestFollowUpRemark: latest?.remark || prev.latestFollowUpRemark,
                            latestFollowUpStatus: latest?.status || prev.latestFollowUpStatus,
                            latestFollowUpPriority: latest?.priority || prev.latestFollowUpPriority,
                        } : prev);
                    }}
                    onToast={(message, type) => setToast({ message, type })}
                />
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        </div>
    );
};

export default FieldAgentVisitDetails;