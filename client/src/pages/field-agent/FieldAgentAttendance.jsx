import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    MapPin, Clock, Calendar, CheckCircle, Loader2, Play, Square,
    RefreshCw, Map, ArrowUpRight, Plus, Layers, ChevronLeft, ChevronRight, Activity, AlertTriangle
} from "lucide-react";
import API from "../../api/axios";

const FieldAgentAttendance = () => {
    const navigate = useNavigate();
    const user = useMemo(() => {
        return JSON.parse(localStorage.getItem("user")) || { id: "", name: "Field Agent", marketingType: "GENERAL" };
    }, []);

    // Core Attendance State Management Parameters
    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);

    // Live Geolocation Telemetry States
    const [coords, setCoords] = useState({ latitude: "", longitude: "", accuracy: "" });
    const [currentAddress, setCurrentAddress] = useState("");
    const [isTrackingActive, setIsTrackingActive] = useState(false);
    const [lastGpsSync, setLastGpsSync] = useState(null);

    // Manual Geolocation Override Stream State
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualLocation, setManualLocation] = useState("");
    const [manualRemarks, setManualRemarks] = useState("");

    // Live Working Hours Runtime Timer States
    const [workingSeconds, setWorkingSeconds] = useState(0);

    // Dynamic Layout Validation Modals States
    const [modalConfig, setModalConfig] = useState({ show: false, type: null, title: "", message: "" });

    // Secondary History Subordinate Navigation Registry Filter Index
    const [historySearchQuery, setHistorySearchQuery] = useState("");
    const [historyDateFilter, setHistoryDateFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 5;

    // Watch Position Memory Ref Pointer Holder
    const watchIdRef = useRef(null);

    // Context Header Naming Vector Compiler
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
            year: "numeric"
        }).format(new Date());
    }, []);

    // Sync Log Core Pipeline Hook Updates On Mount Loop
    useEffect(() => {
        fetchActiveAttendanceState();
        fetchAttendanceHistoryLogs();
        return () => terminateActiveGpsWatcher();
    }, [user.id]);

    // Synchronous Core Workflow Data Fetch Pipeline Engine
    const fetchActiveAttendanceState = async () => {
        if (!user.id) return;
        try {
            setLoading(true);
            const response = await API.get(`/api/attendance/active/${user.id}`);
            // FIXED: Backend returns object directly, not wrapped inside response.data.activeAttendance
            if (response.data && response.data.status === "CHECKED_IN") {
                const activeItem = response.data;
                setAttendance(activeItem);
                initializeActiveGpsWatcher();
            } else {
                setAttendance(null);
            }
            setError(null);
        } catch (err) {
            console.error("Attendance telemetry query fault block check trace: ", err);
            setAttendance(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceHistoryLogs = async () => {
        if (!user.id) return;
        try {
            // FIXED: Using primary attendance fetch configuration fallback safely
            const response = await API.get(`/api/attendance/`);
            const allLogs = Array.isArray(response.data) ? response.data : [];
            // Filter logs to current user inside client safely as production backup
            const userFilteredLogs = allLogs.filter(log => log.userId === user.id);
            setHistory(userFilteredLogs);
        } catch (err) {
            console.error("Historical log parsing loop boundary issue: ", err);
        }
    };

    // Reverse Geocoding Lookup 
    const performReverseGeocodingLookup = async (lat, lng) => {
        try {
            const response = await API.get(`/api/geolocation/reverse?lat=${lat}&lng=${lng}`);
            if (response.data && response.data.address) {
                setCurrentAddress(response.data.address);
            } else {
                setCurrentAddress(`Lat: ${lat}, Lng: ${lng}`);
            }
        } catch (err) {
            setCurrentAddress(`Lat: ${lat}, Lng: ${lng}`);
        }
    };

    // Geolocation watchPosition Device Integration Engines Core Loop Controls
    const initializeActiveGpsWatcher = () => {
        if (watchIdRef.current) return;

        if (!navigator.geolocation) {
            console.error("Spatial runtime validation parameter rejected by hardware stack.");
            return;
        }

        setIsTrackingActive(true);
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setCoords({
                    latitude: latitude.toFixed(6),
                    longitude: longitude.toFixed(6),
                    accuracy: accuracy ? `${Math.round(accuracy)}m` : "N/A"
                });
                setLastGpsSync(new Date());
                performReverseGeocodingLookup(latitude, longitude);
            },
            (error) => {
                console.error("GPS telemetry collection constraint violation fault trace: ", error);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const terminateActiveGpsWatcher = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsTrackingActive(false);
    };

    // Automated Working Live Timer Execution Block Loop Handles
    useEffect(() => {
        let intervalId = null;
        if (attendance && attendance.checkInTime) {
            const startTime = new Date(attendance.checkInTime).getTime();

            const updateTimer = () => {
                const now = new Date().getTime();
                const differenceSeconds = Math.floor((now - startTime) / 1000);
                setWorkingSeconds(differenceSeconds > 0 ? differenceSeconds : 0);
            };

            updateTimer();
            intervalId = setInterval(updateTimer, 1000);
        } else {
            setWorkingSeconds(0);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [attendance]);

    // Formatted timer configuration output string
    const formattedWorkingTimerString = useMemo(() => {
        const hours = Math.floor(workingSeconds / 3600);
        const minutes = Math.floor((workingSeconds % 3600) / 60);
        const seconds = workingSeconds % 60;

        const pad = (num) => String(num).padStart(2, "0");
        return {
            hours: pad(hours),
            minutes: pad(minutes),
            seconds: pad(seconds)
        };
    }, [workingSeconds]);

    // Core Check In Pipeline Workflow Handle
    const handleCheckInPipelineExecute = async () => {
        try {
            setActionLoading(true);
            setModalConfig({ show: false, type: null, title: "", message: "" });

            // FIXED: Using payload naming vector mapping strictly to backend expectation (userId)
            const payload = { userId: user.id };
            const response = await API.post("/api/attendance/check-in", payload);

            if (response.data && response.data.attendance) {
                setAttendance(response.data.attendance);
                initializeActiveGpsWatcher();
                await fetchAttendanceHistoryLogs();
            }
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.message || "Internal transaction framework exception failure block.");
        } finally {
            setActionLoading(false);
        }
    };

    // Core Check Out Pipeline Workflow Handle
    const handleCheckOutPipelineExecute = async () => {
        try {
            setActionLoading(true);
            setModalConfig({ show: false, type: null, title: "", message: "" });

            // FIXED: Mapped configuration keys to clear active session using userId matching controller syntax
            const payload = { userId: user.id };
            const response = await API.post("/api/attendance/check-out", payload);

            setAttendance(null);
            terminateActiveGpsWatcher();
            setCoords({ latitude: "", longitude: "", accuracy: "" });
            setCurrentAddress("");
            await fetchAttendanceHistoryLogs();
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.message || "Operational lifecycle exception captured handling workflow dismissal.");
        } finally {
            setActionLoading(false);
        }
    };

    // Immediate Geolocation Matrix Update Trigger Handler
    const handleUpdateCurrentLocationExecute = () => {
        if (!isTrackingActive) return;
        setActionLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setCoords({
                    latitude: latitude.toFixed(6),
                    longitude: longitude.toFixed(6),
                    accuracy: accuracy ? `${Math.round(accuracy)}m` : "N/A"
                });
                setLastGpsSync(new Date());
                performReverseGeocodingLookup(latitude, longitude);
                setActionLoading(false);
            },
            (error) => {
                console.error(error);
                setActionLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Intermediary Activation Confirmation Modals Framework Dispatches
    const triggerCheckInConfirmationModal = () => {
        setModalConfig({
            show: true,
            type: "CHECK_IN",
            title: "Deploy Active Field Marketing Shift?",
            message: "This operational instruction logs current hardware metrics and deploys an ongoing real-time background tracking synchronization loop."
        });
    };

    const triggerCheckOutConfirmationModal = () => {
        setModalConfig({
            show: true,
            type: "CHECK_OUT",
            title: "Terminate Active Tracking Shifts?",
            message: "This workflow processes checkout calculations and cuts back active location verification array channels back to standby profile constraints."
        });
    };

    // Filtered History Derived Array Data Processing Engine Layer
    const processedHistory = useMemo(() => {
        let output = [...history];

        if (historySearchQuery.trim()) {
            const q = historySearchQuery.toLowerCase().trim();
            output = output.filter(item =>
                (item.status && item.status.toLowerCase().includes(q))
            );
        }

        if (historyDateFilter) {
            output = output.filter(item => {
                const logDate = item.checkInTime ? item.checkInTime.split('T')[0] : "";
                return logDate === historyDateFilter;
            });
        }

        return output;
    }, [history, historySearchQuery, historyDateFilter]);

    // Sliced Dynamic History Records Grid Pages Navigation Array Window
    const totalPages = Math.ceil(processedHistory.length / recordsPerPage) || 1;
    const paginatedHistory = useMemo(() => {
        const startIdx = (currentPage - 1) * recordsPerPage;
        return processedHistory.slice(startIdx, startIdx + recordsPerPage);
    }, [processedHistory, currentPage]);

    const formatDateString = (rawDate) => {
        if (!rawDate) return "N/A";
        try {
            return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(rawDate));
        } catch (e) { return "N/A"; }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 selection:bg-slate-950 selection:text-white">

            {/* STICKY HEADER BLOCK PANEL */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-4 sm:px-6 md:px-8 shadow-xs">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <span className="text-[10px] tracking-[0.25em] uppercase text-indigo-600 font-bold block mb-0.5">
                            Field Operations Control Module
                        </span>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Attendance & Geolocation Console
                        </h1>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 w-fit self-start sm:self-auto">
                        <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Operational Engine:</span>
                        <span className="bg-slate-950 text-white font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">
                            {user.marketingType || "GENERAL"}
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 md:px-8 pb-32 space-y-6">

                {/* TOP LEVEL AGENT WELCOME PANEL GRID SEGMENT */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                            {greetingText}, {user.name}
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">
                            Document your workplace presence parameters and manage onsite deployment telemetry strings efficiently.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 w-fit tabular-nums shadow-3xs">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formattedCurrentDate}
                    </div>
                </section>

                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
                        <div className="lg:col-span-1 h-80 bg-white rounded-2xl border border-slate-200" />
                        <div className="lg:col-span-2 h-80 bg-white rounded-2xl border border-slate-200" />
                    </div>
                ) : (
                    <>
                        {/* CENTRAL WORKSPACE CONSOLE */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                            {/* SHIFT STATE CARD (LEFT) */}
                            <div className="space-y-6 lg:col-span-1">
                                <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 text-center space-y-5 relative overflow-hidden">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Shift Monitor Engine</span>
                                        <h3 className="text-sm font-bold text-slate-700">Live Status Interface</h3>
                                    </div>

                                    {/* ANIMATED STATUS INDICATOR */}
                                    <div className="py-4 flex flex-col items-center justify-center space-y-2">
                                        {attendance ? (
                                            <div className="relative flex items-center justify-center">
                                                <div className="absolute h-16 w-16 bg-emerald-500/10 rounded-full animate-ping duration-1000" />
                                                <div className="h-12 w-12 rounded-full bg-emerald-500 border-4 border-white shadow-md flex items-center justify-center text-white">
                                                    <Activity className="w-5 h-5 animate-pulse" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-12 w-12 rounded-full bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center text-slate-400">
                                                <Square className="w-4 h-4 stroke-2" />
                                            </div>
                                        )}

                                        <div className="pt-2">
                                            <span className={`inline-block font-black text-xs uppercase tracking-widest px-3 py-1 rounded-full border ${attendance ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                                {attendance ? "Working — Tracking Active" : "Checked Out — Shift Offline"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* DYNAMIC TIMER */}
                                    <div className="bg-slate-950 text-white rounded-xl p-4 shadow-inner space-y-1 font-mono">
                                        <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Calculated Shift Duration</span>
                                        <div className="flex items-center justify-center gap-1.5 text-2xl font-black tracking-wider text-slate-100">
                                            <span>{formattedWorkingTimerString.hours}</span>
                                            <span className="text-slate-600 animate-pulse">:</span>
                                            <span>{formattedWorkingTimerString.minutes}</span>
                                            <span className="text-slate-600 animate-pulse">:</span>
                                            <span className="text-indigo-400">{formattedWorkingTimerString.seconds}</span>
                                        </div>
                                    </div>

                                    {/* CONTROLS */}
                                    <div className="space-y-2.5 pt-2">
                                        {!attendance ? (
                                            <button
                                                type="button"
                                                onClick={triggerCheckInConfirmationModal}
                                                disabled={actionLoading}
                                                className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                                            >
                                                <Play className="w-4 h-4 fill-white" /> Deploy Checked In Presence
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={triggerCheckOutConfirmationModal}
                                                disabled={actionLoading}
                                                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                                            >
                                                <Square className="w-4 h-4 fill-white" /> Process Checked Out Exit
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={handleUpdateCurrentLocationExecute}
                                            disabled={actionLoading || !attendance}
                                            className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-2 rounded-lg text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            <RefreshCw className={`w-3 h-3 ${actionLoading ? "animate-spin" : ""}`} /> Sync Fresh GPS Core Telemetry
                                        </button>
                                    </div>
                                </section>
                            </div>

                            {/* GEOGRAPHIC ACCURACY DETAILS CARD */}
                            <div className="lg:col-span-2 space-y-6">
                                <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
                                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-2.5">
                                            <MapPin className="w-5 h-5 text-indigo-600" />
                                            <h3 className="text-base font-bold text-slate-900 tracking-tight">Onsite Geolocation Real-Time Stream</h3>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
                                        <div className="sm:col-span-5 space-y-3.5">
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latitude Coordinate</span>
                                                <span className="font-mono font-bold text-slate-800 tracking-wide">{coords.latitude || "— Pending active alignment —"}</span>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Longitude Coordinate</span>
                                                <span className="font-mono font-bold text-slate-800 tracking-wide">{coords.longitude || "— Pending active alignment —"}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60 text-[11px]">
                                                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">GPS Precision</span>
                                                    <span className="font-bold text-slate-800 font-mono">{coords.accuracy || "N/A"}</span>
                                                </div>
                                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60 text-[11px]">
                                                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Telemetry Refresh</span>
                                                    <span className="font-bold text-slate-700 font-mono text-[10px] truncate block">
                                                        {lastGpsSync ? lastGpsSync.toLocaleTimeString("en-GB") : "N/A"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="sm:col-span-7 bg-slate-50 rounded-xl border border-slate-200/60 p-4 min-h-[168px] flex flex-col justify-between space-y-3">
                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-slate-400" /> Resolved Physical Infrastructure Location Address
                                                </span>
                                                <p className="text-xs font-semibold leading-relaxed text-slate-700">
                                                    {currentAddress || (isTrackingActive ? "Analyzing local spatial hardware coordinates..." : "Standalone device offline. Complete check-in protocol to anchor position variables.")}
                                                </p>
                                            </div>

                                            {attendance && (
                                                <div className="pt-2 border-t border-slate-200/60 text-[11px] font-medium text-slate-400 flex justify-between items-center">
                                                    <span>Shift Tracking Object Identification reference token:</span>
                                                    <span className="font-mono text-slate-600 font-bold break-all">{attendance.id}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* MATRIX STATS */}
                        <section className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 shrink-0"><Clock className="w-4 h-4" /></div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift Start Punch</span>
                                    <span className="text-sm font-extrabold text-slate-900 font-mono tracking-tight">
                                        {attendance?.checkInTime ? new Date(attendance.checkInTime).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' }) : "— Check In Inactive —"}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0"><CheckCircle className="w-4 h-4" /></div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Status Channels</span>
                                    <span className="text-sm font-extrabold text-slate-900 font-mono tracking-tight">{isTrackingActive ? "Background active" : "Offline / Idle"}</span>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 shrink-0"><Activity className="w-4 h-4" /></div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total User Presence Logs</span>
                                    <span className="text-sm font-extrabold text-slate-900 font-mono tracking-tight">{history.length} Shift Records</span>
                                </div>
                            </div>
                        </section>

                        {/* WORKFORCE NAVIGATION LINKS */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button onClick={() => navigate("/field-agent-dashboard/add-visit")} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-950 hover:text-white transition-all text-left group cursor-pointer">
                                <div><span className="block text-xs font-bold uppercase tracking-wider text-inherit">Add New Visit</span><span className="text-[10px] text-slate-400 group-hover:text-slate-300 font-medium">Record business lead</span></div>
                                <Plus className="w-4 h-4 opacity-60 group-hover:opacity-100" />
                            </button>
                            <button onClick={() => navigate("/field-agent-dashboard/my-visits")} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-950 hover:text-white transition-all text-left group cursor-pointer">
                                <div><span className="block text-xs font-bold uppercase tracking-wider text-inherit">My Visits</span><span className="text-[10px] text-slate-400 group-hover:text-slate-300 font-medium">View tracked registry</span></div>
                                <Layers className="w-4 h-4 opacity-60 group-hover:opacity-100" />
                            </button>
                            <button onClick={() => navigate("/field-agent-dashboard/my-visits?filter=today")} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-950 hover:text-white transition-all text-left group cursor-pointer">
                                <div><span className="block text-xs font-bold uppercase tracking-wider text-inherit">Today's Follow Ups</span><span className="text-[10px] text-slate-400 group-hover:text-slate-300 font-medium">Triage client pipelines</span></div>
                                <Clock className="w-4 h-4 opacity-60 group-hover:opacity-100" />
                            </button>
                            <button onClick={() => navigate("/field-agent-dashboard")} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-950 hover:text-white transition-all text-left group cursor-pointer">
                                <div><span className="block text-xs font-bold uppercase tracking-wider text-inherit">Main Dashboard</span><span className="text-[10px] text-slate-400 group-hover:text-slate-300 font-medium">Analytics overview desk</span></div>
                                <ArrowUpRight className="w-4 h-4 opacity-60 group-hover:opacity-100" />
                            </button>
                        </section>

                        {/* ARCHIVED ATTENDANCE DATAGRID */}
                        <section className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                                <div className="flex items-center gap-2.5">
                                    <Activity className="w-5 h-5 text-slate-900" />
                                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Your Shift Log History Workspace</h3>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <input
                                        type="date"
                                        value={historyDateFilter}
                                        onChange={(e) => { setHistoryDateFilter(e.target.value); setCurrentPage(1); }}
                                        className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-slate-50/40 text-slate-800 focus:border-slate-950"
                                    />
                                </div>
                            </div>

                            {paginatedHistory.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                                    <p className="text-xs text-slate-400 font-medium">No verified presence objects found matching current layout query parameters.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/60">
                                                    <th className="p-3.5">Log Date</th>
                                                    <th className="p-3.5">Punch In</th>
                                                    <th className="p-3.5">Punch Out exit</th>
                                                    <th className="p-3.5 text-right">Verification Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                                {paginatedHistory.map((item, idx) => (
                                                    <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">{formatDateString(item.checkInTime)}</td>
                                                        <td className="p-3.5 font-mono text-slate-600 tabular-nums">{item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "N/A"}</td>
                                                        <td className="p-3.5 font-mono text-slate-600 tabular-nums">{item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "— Active Shift —"}</td>
                                                        <td className="p-3.5 text-right whitespace-nowrap">
                                                            <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${item.status === "CHECKED_OUT" ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                                                                {item.status === "CHECKED_OUT" ? "Shift Block Closed" : "Active Session"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* PAGINATION */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                                            <span className="text-slate-400 font-medium">Page <span className="font-bold text-slate-700">{currentPage}</span> of <span className="font-bold text-slate-700">{totalPages}</span></span>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className="p-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                                                >
                                                    <ChevronLeft className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                    className="p-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                                                >
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>

            {/* CONFIRMATION OVERLAY MODAL */}
            {modalConfig.show && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-center space-y-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${modalConfig.type === "CHECK_OUT" ? "bg-rose-50 text-rose-600" : "bg-slate-900 text-white"}`}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900">{modalConfig.title}</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">{modalConfig.message}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setModalConfig({ show: false, type: null, title: "", message: "" })}
                                disabled={actionLoading}
                                className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                Cancel Action
                            </button>

                            <button
                                type="button"
                                onClick={modalConfig.type === "CHECK_OUT" ? handleCheckOutPipelineExecute : handleCheckInPipelineExecute}
                                disabled={actionLoading}
                                className={`text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer ${modalConfig.type === "CHECK_OUT" ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-950 hover:bg-slate-900"}`}
                            >
                                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Confirm Execution
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default FieldAgentAttendance;