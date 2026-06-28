import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    MapPin, Clock, Calendar, CheckCircle, ShieldAlert, Loader2, Play, Square,
    RefreshCw, Map, FileText, User, Navigation, Layers, History, AlertTriangle,
    ArrowUpRight, Plus, Eye, Search, ChevronLeft, ChevronRight, Activity
} from "lucide-react";
import API from "../../api/axios";

const FieldAgentAttendance = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user")) || { id: "", name: "Field Agent", marketingType: "GENERAL" };

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
            if (response.data && response.data.activeAttendance) {
                const activeItem = response.data.activeAttendance;
                setAttendance(activeItem);

                // If active checked in status is mapped, trigger automated GPS stream trace loop
                if (activeItem.status === "CHECKED_IN" || activeItem.checkInTime && !activeItem.checkOutTime) {
                    initializeActiveGpsWatcher();
                    calculateElapsedTimeMetrics(activeItem.checkInTime);
                }
            } else {
                setAttendance(null);
            }
            setError(null);
        } catch (err) {
            console.error("Attendance telemetry query fault block check trace: ", err);
            setError("Failed to resolve sync status constraints from core datastore pipelines.");
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceHistoryLogs = async () => {
        if (!user.id) return;
        try {
            const response = await API.get(`/api/attendance/history/${user.id}`);
            setHistory(Array.isArray(response.data) ? response.data : response.data?.history || []);
        } catch (err) {
            console.error("Historical log parsing loop boundary issue: ", err);
        }
    };

    // Reverse Geocoding API Matrix Query Stream Call Hook Loop
    const performReverseGeocodingLookup = async (lat, lng) => {
        try {
            const response = await API.get(`/api/geolocation/reverse?lat=${lat}&lng=${lng}`);
            if (response.data && response.data.address) {
                setCurrentAddress(response.data.address);
            } else {
                setCurrentAddress(`Coordinates Vector Lat: ${lat}, Lng: ${lng}`);
            }
        } catch (err) {
            console.log("Spatial mapping label extraction uninitialized route fallback.");
            setCurrentAddress(`Coordinates Vector Lat: ${lat}, Lng: ${lng}`);
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
                    latitude: latitude.toString(),
                    longitude: longitude.toString(),
                    accuracy: accuracy ? `${Math.round(accuracy)}m` : "N/A"
                });
                setLastGpsSync(new Date());
                performReverseGeocodingLookup(latitude, longitude);

                // Silent update current location coordinate telemetry back to server pipeline loop
                syncLocationTelemetryPacket(latitude, longitude);
            },
            (error) => {
                console.error("GPS telemetry collection constraint violation fault trace: ", error);
                setLastGpsSync(new Date());
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

    // Automated Synchronization Core Telemetry Stream Post Handles Loop
    const syncLocationTelemetryPacket = async (lat, lng) => {
        if (!user.id || !attendance?.id) return;
        try {
            await API.post("/api/attendance/telemetry/sync", {
                attendanceId: attendance.id,
                employeeId: user.id,
                latitude: lat.toString(),
                longitude: lng.toString()
            });
        } catch (e) {
            console.log("Background synchronization telemetry pipeline dropped sequence packet drop.");
        }
    };

    // Automated Working Live Timer Execution Block Loop Handles
    const calculateElapsedTimeMetrics = (checkInTimeStr) => {
        if (!checkInTimeStr) return;
        const startTime = new Date(checkInTimeStr).getTime();

        const updateTimerInterval = () => {
            const now = new Date().getTime();
            const differenceSeconds = Math.floor((now - startTime) / 1000);
            setWorkingSeconds(differenceSeconds > 0 ? differenceSeconds : 0);
        };

        updateTimerInterval();
        const intervalId = setInterval(updateTimerInterval, 1000);

        return () => clearInterval(intervalId);
    };

    // Run dynamic calculation handler stream based on current attendance profile properties
    useEffect(() => {
        let clearTimerFn = null;
        if (attendance && !attendance.checkOutTime && attendance.checkInTime) {
            clearTimerFn = calculateElapsedTimeMetrics(attendance.checkInTime);
        } else {
            setWorkingSeconds(0);
        }
        return () => { if (clearTimerFn) clearTimerFn(); };
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
            seconds: pad(seconds),
            fullString: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        };
    }, [workingSeconds]);

    // Core Check In Pipeline Workflow Handle
    const handleCheckInPipelineExecute = async () => {
        try {
            setActionLoading(true);
            setModalConfig({ show: false, type: null, title: "", message: "" });

            // Force extraction query parameters lookup right before committing
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    const payload = {
                        employeeId: user.id,
                        latitude: latitude.toString(),
                        longitude: longitude.toString(),
                        timestamp: new Date().toISOString()
                    };

                    const response = await API.post("/api/attendance/checkin", payload);
                    setAttendance(response.data.attendance);
                    initializeActiveGpsWatcher();
                    await fetchAttendanceHistoryLogs();
                    alert("Check-in sequence processed successfully. Tracking matrix deployed.");
                },
                async (err) => {
                    console.error("GPS acquisition barrier prior to registration: ", err);
                    // Fallback forced alignment check-in with zeroed metrics if hardware faults trigger bounds
                    const fallbackPayload = {
                        employeeId: user.id,
                        latitude: "0.0",
                        longitude: "0.0",
                        timestamp: new Date().toISOString(),
                        remarks: "Forced baseline parameter checklist. Hardware GPS tracking timed out."
                    };
                    const response = await API.post("/api/attendance/checkin", fallbackPayload);
                    setAttendance(response.data.attendance);
                    alert("Check-in parsed under zeroed geolocation fallback indices.");
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.message || "Internal transaction framework deployment exception failure block.");
        } finally {
            setActionLoading(false);
        }
    };

    // Core Check Out Pipeline Workflow Handle
    const handleCheckOutPipelineExecute = async () => {
        if (!attendance?.id) return;
        try {
            setActionLoading(true);
            setModalConfig({ show: false, type: null, title: "", message: "" });

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    const payload = {
                        attendanceId: attendance.id,
                        employeeId: user.id,
                        latitude: latitude.toString(),
                        longitude: longitude.toString(),
                        timestamp: new Date().toISOString()
                    };

                    await API.post("/api/attendance/checkout", payload);
                    setAttendance(null);
                    terminateActiveGpsWatcher();
                    await fetchAttendanceHistoryLogs();
                    alert("Check-out processed successfully. Active telemetry channels terminated.");
                },
                async (err) => {
                    const fallbackPayload = {
                        attendanceId: attendance.id,
                        employeeId: user.id,
                        latitude: "0.0",
                        longitude: "0.0",
                        timestamp: new Date().toISOString()
                    };
                    await API.post("/api/attendance/checkout", fallbackPayload);
                    setAttendance(null);
                    terminateActiveGpsWatcher();
                    await fetchAttendanceHistoryLogs();
                    alert("Check-out processed under manual terminal fallback rules.");
                }
            );
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.message || "Operational lifecycle exception captured handling workflow dismissal.");
        } finally {
            setActionLoading(false);
        }
    };

    // Immediate Geolocation Matrix Update Trigger Handler
    const handleUpdateCurrentLocationExecute = () => {
        if (!isTrackingActive) {
            alert("Initialize active check-in logging block sequence before pulsing location updates.");
            return;
        }
        setActionLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCoords({
                    latitude: latitude.toString(),
                    longitude: longitude.toString(),
                    accuracy: position.coords.accuracy ? `${Math.round(position.coords.accuracy)}m` : "N/A"
                });
                setLastGpsSync(new Date());
                await performReverseGeocodingLookup(latitude, longitude);
                await syncLocationTelemetryPacket(latitude, longitude);
                setActionLoading(false);
                alert("Field force operational tracking location matrix metrics pulsed successfully.");
            },
            (error) => {
                console.error(error);
                setActionLoading(false);
                alert("Unable to query fresh device geolocation array data parameters.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Manual Override Registration Event Save Handle
    const handleManualLocationSubmit = async (e) => {
        e.preventDefault();
        if (!manualLocation.trim()) return alert("Manual geographic mapping entry value required.");
        if (!attendance?.id) return alert("Verify core active workspace validation block before indexing manual adjustments.");

        try {
            setActionLoading(true);
            const payload = {
                attendanceId: attendance.id,
                employeeId: user.id,
                locationName: manualLocation.trim(),
                remarks: manualRemarks.trim(),
                timestamp: new Date().toISOString()
            };

            await API.post("/api/attendance/manual-entry", payload);
            alert("Manual override entry logged under active telemetry history maps.");
            setManualLocation("");
            setManualRemarks("");
            setShowManualForm(false);
            await fetchActiveAttendanceState();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Exception processing pipeline override entry registry tracking mapping rules.");
        } finally {
            setActionLoading(false);
        }
    };

    // Intermediary Activation Confirmation Modals Framework Dispatches
    const triggerCheckInConfirmationModal = () => {
        setModalConfig({
            show: true,
            type: "CHECK_IN",
            title: "Deploy Active Field Marketing Shift?",
            message: "This operational instruction logs current hardware metrics and deploys an ongoing real-time background GPS tracking telemetry synchronization loop."
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
                item.date?.toLowerCase().includes(q) ||
                item.status?.toLowerCase().includes(q) ||
                item.remarks?.toLowerCase().includes(q)
            );
        }

        if (historyDateFilter) {
            output = output.filter(item => item.date && item.date.startsWith(historyDateFilter));
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

            {/* ENTERPRISE WORKFORCE LEVEL STICKY HEADER BLOCK PANEL */}
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

                {/* LOADING SHIMMER INTERACTION VIEW CONTROLLER ROUTINES */}
                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
                        <div className="lg:col-span-1 h-80 bg-white rounded-2xl border border-slate-200" />
                        <div className="lg:col-span-2 h-80 bg-white rounded-2xl border border-slate-200" />
                    </div>
                ) : (
                    <>
                        {/* CENTRAL WORKSPACE DEPLOYMENT CONTROLS LAYOUT CONSOLE */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                            {/* LARGE LIVE WORKING SHIFT STATE CONTROLS PROFILE CARD (LEFT) */}
                            <div className="space-y-6 lg:col-span-1">

                                <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 text-center space-y-5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 h-24 w-24 bg-slate-50/60 rounded-full -z-10" />

                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Shift Monitor Engine</span>
                                        <h3 className="text-sm font-bold text-slate-700">Live Status Interface</h3>
                                    </div>

                                    {/* HIGH VISIBILITY ANIMATED STATUS INDICATOR */}
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
                                            <span className={`inline-block font-black text-xs uppercase tracking-widest px-3 py-1 rounded-full border ${attendance ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                                                }`}>
                                                {attendance ? "Working — Tracking Active" : "Checked Out — Shift Offline"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* DYNAMIC TIMER INTERACTIVE DISPLAY COUNTER DIGITS */}
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

                                    {/* STICKY MAIN WORKFLOW INTERACTION TRIGGER EXECUTION BUTTON TRACKS */}
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

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={handleUpdateCurrentLocationExecute}
                                                disabled={actionLoading || !attendance}
                                                className="inline-flex items-center justify-center gap-1.5 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-2 rounded-lg text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                                title="Pulse Instant Onsite GPS Metrics Update"
                                            >
                                                <RefreshCw className={`w-3 h-3 ${actionLoading ? "animate-spin" : ""}`} /> Pulse GPS
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setShowManualForm(!showManualForm)}
                                                disabled={!attendance}
                                                className={`inline-flex items-center justify-center gap-1.5 border font-bold py-2 px-2 rounded-lg text-[10px] uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${showManualForm
                                                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-black"
                                                        : "bg-white border-slate-300 hover:border-slate-400 text-slate-700"
                                                    }`}
                                            >
                                                <Map className="w-3 h-3" /> Override Form
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* LIVE GEOGRAPHIC ACCURACY DETAILS AND MANUAL OVERRIDES (RIGHT/CENTER) */}
                            <div className="lg:col-span-2 space-y-6">

                                {/* LIVE MAP TRACKING ACCURACY STATUS COMPONENT DETAILS CARD */}
                                <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
                                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-2.5">
                                            <Navigation className="w-5 h-5 text-indigo-600" />
                                            <h3 className="text-base font-bold text-slate-900 tracking-tight">Onsite Geolocation Real-Time Stream</h3>
                                        </div>
                                        {isTrackingActive && (
                                            <span className="bg-emerald-50 text-emerald-700 font-black text-[9px] px-2 py-0.5 rounded-md border border-emerald-200 uppercase tracking-widest animate-pulse">
                                                Satellite Link Connected
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
                                        {/* Live Mapping Vector Metrics Items Data Columns */}
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
                                                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">GPS Precision Margin</span>
                                                    <span className="font-bold text-slate-800 font-mono">{coords.accuracy || "N/A"}</span>
                                                </div>
                                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60 text-[11px]">
                                                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Telemetry Refresh</span>
                                                    <span className="font-bold text-slate-700 font-mono text-[10px] truncate block">{lastGpsSync ? lastGpsSync.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "N/A"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Resolved Physical Address Output Area Textbox Box */}
                                        <div className="sm:col-span-7 bg-slate-50 rounded-xl border border-slate-200/60 p-4 min-h-[168px] flex flex-col justify-between space-y-3">
                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-slate-400" /> Resolved Physical Infrastructure Location Address
                                                </span>
                                                <p className="text-xs font-semibold leading-relaxed text-slate-700">
                                                    {currentAddress || (isTrackingActive ? "Analyzing spatial streams over reverse geocoding map keys..." : "Standalone device offline. Complete check-in protocol to anchor position variables.")}
                                                </p>
                                            </div>

                                            {attendance && (
                                                <div className="pt-2 border-t border-slate-200/60 text-[11px] font-medium text-slate-400 flex justify-between items-center">
                                                    <span>Shift Identification Code:</span>
                                                    <span className="font-mono text-slate-600 break-all select-all font-bold">{attendance.id}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                {/* CONDITIONAL COMPONENT FORM AREA LAYER FOR MANUAL POSITION OVERRIDES */}
                                {showManualForm && attendance && (
                                    <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 sm:p-6 border-l-4 border-l-indigo-600 animate-fadeIn">
                                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                                            <Map className="w-4 h-4 text-indigo-600" />
                                            <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Log Manual Location Adjustment Override</h4>
                                        </div>

                                        <form onSubmit={handleManualLocationSubmit} className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                                                <div className="sm:col-span-5">
                                                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Geographic Milestone Label <span className="text-rose-500">*</span></label>
                                                    <input
                                                        type="text"
                                                        value={manualLocation}
                                                        onChange={(e) => setManualLocation(e.target.value)}
                                                        required
                                                        placeholder="e.g., Sector 4 Office Hub, Okhla Garage Block"
                                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-slate-950 text-slate-900 bg-white"
                                                    />
                                                </div>

                                                <div className="sm:col-span-7">
                                                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Verification Remarks / Justification</label>
                                                    <input
                                                        type="text"
                                                        value={manualRemarks}
                                                        onChange={(e) => setManualRemarks(e.target.value)}
                                                        placeholder="State reason (e.g., Client onsite audit, meeting alignment)"
                                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-slate-950 text-slate-900 bg-white"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-2 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowManualForm(false)}
                                                    className="border border-slate-200 hover:bg-slate-50 font-bold px-4 py-2 rounded-lg text-[10px] uppercase tracking-wider text-slate-600 cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={actionLoading}
                                                    className="bg-slate-950 hover:bg-slate-800 font-bold px-4 py-2 rounded-lg text-[10px] uppercase tracking-wider text-white shadow-xs disabled:opacity-50 cursor-pointer"
                                                >
                                                    Commit Override
                                                </button>
                                            </div>
                                        </form>
                                    </section>
                                )}

                            </div>
                        </div>

                        {/* LOWER COGNITIVE DASHBOARD SECTOR SUMMARY MATRIX MODULE STATS */}
                        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 shrink-0"><Clock className="w-4 h-4" /></div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift Start Punch</span>
                                    <span className="text-sm font-extrabold text-slate-900 font-mono tracking-tight">{attendance?.checkInTime ? new Date(attendance.checkInTime).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' }) : "— Check In Inactive —"}</span>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 shrink-0"><Navigation className="w-4 h-4" /></div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Override Logs</span>
                                    <span className="text-sm font-extrabold text-slate-900 font-mono tracking-tight">{attendance?.manualEntries?.length || 0} Adjustments</span>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0"><CheckCircle className="w-4 h-4" /></div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Telemetry Channels</span>
                                    <span className="text-sm font-extrabold text-slate-900 font-mono tracking-tight">{isTrackingActive ? "Background active" : "Offline / Idle"}</span>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 shrink-0"><History className="w-4 h-4" /></div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Indexed History</span>
                                    <span className="text-sm font-extrabold text-slate-900 font-mono tracking-tight">{history.length} Shift Blocks</span>
                                </div>
                            </div>
                        </section>

                        {/* INTEGRATED SHORTCUT QUICK ACTIONS CONTROLS GRID PANEL */}
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

                        {/* ACTIVE SHIFT LIVE REALTIME MILESTONE ACTIVITY TIMELINE (Rendered dynamically if check-in indices are initialized) */}
                        {attendance && (
                            <section className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6">
                                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
                                    <Activity className="w-5 h-5 text-slate-900" />
                                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Today's Operational Shift Timeline</h3>
                                </div>

                                <div className="space-y-5 relative before:absolute before:inset-y-1 before:left-[11px] before:w-[1px] before:bg-slate-200 pl-2">
                                    {/* Anchor Point 1: Check In Block */}
                                    <div className="flex gap-4 relative items-start animate-fadeIn">
                                        <div className="h-6 w-6 rounded-full bg-slate-950 text-white shadow-xs flex items-center justify-center shrink-0 z-10"><Play className="w-2.5 h-2.5 fill-white" /></div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-slate-800">Shift Checklist Punch In Activated</p>
                                            <span className="text-[10px] font-mono font-bold text-indigo-600 tabular-nums">{attendance.checkInTime ? new Date(attendance.checkInTime).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "N/A"}</span>
                                        </div>
                                    </div>

                                    {/* Anchor Point 2: Manual Location Entry Override Matrix Records array loop */}
                                    {attendance.manualEntries && attendance.manualEntries.map((mItem, mIdx) => (
                                        <div key={mItem.id || mIdx} className="flex gap-4 relative items-start animate-fadeIn">
                                            <div className="h-6 w-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-3xs flex items-center justify-center shrink-0 z-10"><Map className="w-3 h-3" /></div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-bold text-slate-800">Manual Geolocation Adjusted: <span className="font-extrabold text-indigo-700">{mItem.locationName}</span></p>
                                                {mItem.remarks && <p className="text-[11px] text-slate-500 italic">Remarks: "{mItem.remarks}"</p>}
                                                <span className="text-[10px] font-mono font-bold text-slate-400 block tabular-nums">{mItem.timestamp ? new Date(mItem.timestamp).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Anchor Point 3: Standard active trace monitoring live indicator */}
                                    <div className="flex gap-4 relative items-start">
                                        <div className="h-6 w-6 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-3xs flex items-center justify-center shrink-0 z-10"><RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} /></div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-slate-600">Continuous Satellite Background Tracking Active</p>
                                            <span className="text-[10px] font-mono text-slate-400 block tracking-tight">Streaming live geolocation telemetry buffers...</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* HISTORICAL PRESENCE ATTENDANCE LOG RECORDS HISTORIES DATAGRID MODULE */}
                        <section className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                                <div className="flex items-center gap-2.5">
                                    <History className="w-5 h-5 text-slate-900" />
                                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Historical Presence Logs</h3>
                                </div>

                                {/* Subordinate Filter Search Grid Alignment Input elements */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative">
                                        <Search className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 left-2.5 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={historySearchQuery}
                                            onChange={(e) => { setHistorySearchQuery(e.target.value); setCurrentPage(1); }}
                                            placeholder="Filter by status parameters..."
                                            className="pl-7 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-slate-50/40 text-slate-800 placeholder:text-slate-400 focus:border-slate-950 w-44"
                                        />
                                    </div>
                                    <input
                                        type="date"
                                        value={historyDateFilter}
                                        onChange={(e) => { setHistoryDateFilter(e.target.value); setCurrentPage(1); }}
                                        className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-slate-50/40 text-slate-800 focus:border-slate-950"
                                    />
                                </div>
                            </div>

                            {/* MAPPED OUT HISTORY DATA SHEET VIEWPORTS LAYER */}
                            {paginatedHistory.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                                    <p className="text-xs text-slate-400 font-medium">No archived attendance logs matches current filter queries.</p>
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
                                                    <th className="p-3.5">Duration</th>
                                                    <th className="p-3.5 text-right">Verification Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                                {paginatedHistory.map((item, idx) => (
                                                    <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">{item.date ? formatDateString(item.date) : formatDateString(item.checkInTime)}</td>
                                                        <td className="p-3.5 font-mono text-slate-600 tabular-nums">{item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "N/A"}</td>
                                                        <td className="p-3.5 font-mono text-slate-600 tabular-nums">{item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "— Active Shift —"}</td>
                                                        <td className="p-3.5 font-mono text-slate-800 font-bold tabular-nums">{item.workingHours || item.duration || "Calculating"}</td>
                                                        <td className="p-3.5 text-right whitespace-nowrap">
                                                            <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${item.checkOutTime ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                }`}>
                                                                {item.checkOutTime ? "Shift Block Closed" : "Active Session"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* HISTORY GRID DATAGRID PAGINATION CONTROLLER ENGINE */}
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

            {/* CORE FRAMEWORK WORKFLOW INTERACTION CONFIRMATION OVERLAY MODAL */}
            {modalConfig.show && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-center space-y-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${modalConfig.type === "CHECK_OUT" ? "bg-rose-50 text-rose-600" : "bg-slate-900 text-white"
                            }`}>
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
                                className={`text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer ${modalConfig.type === "CHECK_OUT" ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-950 hover:bg-slate-900"
                                    }`}
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