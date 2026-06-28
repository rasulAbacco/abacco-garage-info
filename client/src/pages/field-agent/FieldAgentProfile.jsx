import { useEffect, useState } from "react";
import {
    User, Mail, Phone, MapPin, Building, Shield, Lock, Eye, EyeOff,
    Upload, X, Camera, Calendar, CheckCircle, ShieldAlert, Loader2,
    BarChart3, Layers, Clock, Activity, AlertCircle, FileText, Plus, Edit3
} from "lucide-react";
import API from "../../api/axios";

const FieldAgentProfile = () => {
    const localUser = JSON.parse(localStorage.getItem("user")) || { id: "", name: "Field Agent" };

    // Core loading and error states
    const [loading, setLoading] = useState(true);
    const [submittingProfile, setSubmittingProfile] = useState(false);
    const [submittingPassword, setSubmittingPassword] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Profile data states
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        phone: "",
        altPhone: "",
        address: "",
        city: "",
        state: "",
        role: "FIELD_AGENT",
        marketingType: "GENERAL",
        status: "ACTIVE",
        createdAt: "",
        lastLogin: "",
        avatarUrl: ""
    });

    // Statistics states
    const [stats, setStats] = useState({
        totalVisits: 0,
        thisMonthVisits: 0,
        todayVisits: 0,
        pendingFollowUps: 0,
        interestedLeads: 0,
        closedDeals: 0
    });

    // Password change states
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);

    // Profile image states
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Activity log placeholder timeline data
    const [activities, setActivities] = useState([
        { id: "act_1", type: "ADD_VISIT", description: "Added new field lead record for Car Max Garage", timestamp: "2026-06-28T09:30:00.000Z" },
        { id: "act_2", type: "UPDATE_VISIT", description: "Revised interaction log status for Apex Motors to INTERESTED", timestamp: "2026-06-27T16:15:00.000Z" },
        { id: "act_3", type: "COMPLETE_FOLLOWUP", description: "Marked today's scheduled check-in completed for Vertex Tyre Shop", timestamp: "2026-06-27T11:05:00.000Z" },
        { id: "act_4", type: "PROFILE_UPDATE", description: "Updated internal personal contact communication parameters", timestamp: "2026-06-25T14:22:00.000Z" }
    ]);

    // Fetch framework profile payload
    useEffect(() => {
        const fetchProfilePayload = async () => {
            if (!localUser.id) {
                setError("Security session validation identity profile missing.");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError(null);

                // Fetch primary profile metrics and statistics concurrently
                const [profileRes, dashboardRes] = await Promise.allSettled([
                    API.get(`/api/auth/profile/${localUser.id}`),
                    API.get(`/api/field-visit/dashboard/${localUser.id}`)
                ]);

                if (profileRes.status === "fulfilled" && profileRes.value?.data) {
                    const p = profileRes.value.data;
                    setProfileData({
                        name: p.name || localUser.name || "",
                        email: p.email || "",
                        phone: p.phone || p.phoneNumber || "",
                        altPhone: p.altPhone || "",
                        address: p.address || "",
                        city: p.city || "",
                        state: p.state || "",
                        role: p.role || "FIELD_AGENT",
                        marketingType: p.marketingType || "GENERAL",
                        status: p.status || "ACTIVE",
                        createdAt: p.createdAt || "",
                        lastLogin: p.lastLogin || new Date().toISOString(),
                        avatarUrl: p.avatarUrl || ""
                    });
                    if (p.avatarUrl) setImagePreview(p.avatarUrl);
                } else {
                    // Fallback context initialization if route endpoints are stubbed out
                    setProfileData(prev => ({
                        ...prev,
                        name: localUser.name || "Field Agent",
                        email: localUser.email || "agent@crm.enterprise",
                        phone: "9876543210",
                        role: localUser.marketingType ? "FIELD_AGENT" : "ADMIN",
                        marketingType: localUser.marketingType || "GENERAL",
                        createdAt: "2026-01-15T00:00:00.000Z",
                        lastLogin: new Date().toISOString()
                    }));
                }

                if (dashboardRes.status === "fulfilled" && dashboardRes.value?.data) {
                    const d = dashboardRes.value.data;
                    setStats({
                        totalVisits: d.totalVisitsCount || 0,
                        thisMonthVisits: d.thisMonthVisitsCount || 0,
                        todayVisits: d.todayVisitsCount || 0,
                        pendingFollowUps: d.pendingFollowUpsCount || 0,
                        interestedLeads: d.interestedLeadsCount || 0,
                        closedDeals: d.closedDealsCount || 0
                    });
                } else {
                    // Alternative fallback statistic check array count mock if needed
                    try {
                        const fallbackVisitsRes = await API.get(`/api/field-visit/employee/${localUser.id}`);
                        const list = Array.isArray(fallbackVisitsRes.value?.data) ? fallbackVisitsRes.value.data : fallbackVisitsRes.data?.visits || [];
                        if (list.length) {
                            setStats({
                                totalVisits: list.length,
                                thisMonthVisits: list.filter(v => new Date(v.createdAt).getMonth() === new Date().getMonth()).length,
                                todayVisits: list.filter(v => new Date(v.createdAt).toDateString() === new Date().toDateString()).length,
                                pendingFollowUps: list.filter(v => v.status === "PENDING").length,
                                interestedLeads: list.filter(v => v.status === "INTERESTED").length,
                                closedDeals: list.filter(v => v.status === "CUSTOMER").length
                            });
                        }
                    } catch (e) {
                        console.log("Secondary analytics context routing uninitialized.");
                    }
                }
            } catch (err) {
                console.error("Profile compilation data pipeline error: ", err);
                setError("Unable to synthesize administrative profile parameters from the datastore matrix.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfilePayload();
    }, [localUser.id]);

    // Image manipulation change pipeline handler
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Only valid visual asset imagery streams are accepted.");
            return;
        }

        setSelectedImage(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
    };

    const handleRemoveImage = () => {
        if (imagePreview && imagePreview.startsWith("blob:")) {
            URL.revokeObjectURL(imagePreview);
        }
        setSelectedImage(null);
        setImagePreview(profileData.avatarUrl || null);
    };

    // Profile data payload save submit handler
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        if (!profileData.name.trim()) {
            alert("Account nomenclature mapping parameter cannot remain empty.");
            return;
        }

        try {
            setSubmittingProfile(true);
            setSuccessMessage(null);
            setError(null);

            const formData = new FormData();
            formData.append("name", profileData.name.trim());
            formData.append("phone", profileData.phone.trim());
            formData.append("altPhone", profileData.altPhone.trim());
            formData.append("address", profileData.address.trim());
            formData.append("city", profileData.city.trim());
            formData.append("state", profileData.state.trim());
            if (selectedImage) {
                formData.append("avatar", selectedImage);
            }

            const response = await API.put(`/api/auth/profile/${localUser.id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            // Synchronize internal local state allocations 
            const updatedUser = response.data?.user || response.data;
            if (updatedUser) {
                setProfileData(prev => ({
                    ...prev,
                    name: updatedUser.name || prev.name,
                    phone: updatedUser.phone || prev.phone,
                    altPhone: updatedUser.altPhone || prev.altPhone,
                    address: updatedUser.address || prev.address,
                    city: updatedUser.city || prev.city,
                    state: updatedUser.state || prev.state,
                    avatarUrl: updatedUser.avatarUrl || prev.avatarUrl
                }));

                // Update security credentials stored on disk storage
                const currentLocal = JSON.parse(localStorage.getItem("user")) || {};
                localStorage.setItem("user", JSON.stringify({
                    ...currentLocal,
                    name: updatedUser.name || currentLocal.name
                }));
            }

            setSuccessMessage("Operational personal dataset credentials updated successfully.");

            // Inject transaction log history item update
            setActivities(prev => [
                { id: `act_${Date.now()}`, type: "PROFILE_UPDATE", description: "Modified personal metadata information configuration parameters", timestamp: new Date().toISOString() },
                ...prev
            ]);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Internal network connection mutation exception encountered.");
        } finally {
            setSubmittingProfile(false);
        }
    };

    // Password mutation patch submit handler
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        const { currentPassword, newPassword, confirmPassword } = passwordData;

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError("All cryptography validation index key assignments are mandatory.");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError("Security baseline criteria configuration match constraint failure: Cryptography keys must span 8 units minimum.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("Structural cryptography token discrepancy: Target signature validation parameters do not match.");
            return;
        }

        try {
            setSubmittingPassword(true);
            await API.put(`/api/auth/change-password/${localUser.id}`, {
                currentPassword,
                newPassword
            });

            setPasswordSuccess("Security access control token key updated and synchronized.");
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            console.error(err);
            setPasswordError(err.response?.data?.message || "Exception thrown validating cryptography signature update protocol parameters.");
        } finally {
            setSubmittingPassword(false);
        }
    };

    // Profile data generic structural context changes handler
    const handleInputChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    // Utility Date Representation Formatter Spec Wrapper
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

    // Extraction of display credentials asset token name initials 
    const getNameInitials = (fullname) => {
        if (!fullname) return "FA";
        return fullname.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    };

    const getActivityIcon = (type) => {
        if (type === "ADD_VISIT") return <Plus className="w-3.5 h-3.5 text-blue-600" />;
        if (type === "UPDATE_VISIT") return <Edit3 className="w-3.5 h-3.5 text-amber-600" />;
        if (type === "COMPLETE_FOLLOWUP") return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
        return <Activity className="w-3.5 h-3.5 text-slate-600" />;
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 selection:bg-slate-950 selection:text-white">

            {/* SKELETON PLACEHOLDER LOADER COMPILATION MODULE */}
            {loading ? (
                <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 md:px-8 space-y-6 animate-pulse">
                    <div className="h-32 bg-white rounded-2xl border border-slate-200" />
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(idx => <div key={idx} className="h-20 bg-white rounded-xl border border-slate-200" />)}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 h-96 bg-white rounded-xl border border-slate-200" />
                        <div className="h-96 bg-white rounded-xl border border-slate-200" />
                    </div>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 md:px-8 pb-32 space-y-6">

                    {/* SYSTEM MESSAGES BLOCK TOAST NOTIFICATIONS LAYERS */}
                    {error && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 shadow-2xs">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-xs font-semibold leading-relaxed">{error}</p>
                        </div>
                    )}
                    {successMessage && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3 shadow-2xs animate-fadeIn">
                            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold leading-relaxed">{successMessage}</p>
                        </div>
                    )}

                    {/* PROFILE STICKY OVERHEAD IDENTIFICATION METADATA BANNER CORE */}
                    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                        <div className="flex flex-col md:flex-row items-center gap-5 min-w-0 z-10">

                            {/* IMAGE SELECTION INTERFACE PIPELINE GRID */}
                            <div className="relative group shrink-0">
                                <div className="h-24 w-24 rounded-full border border-slate-200 bg-slate-900 text-white flex items-center justify-center overflow-hidden shadow-sm font-bold text-2xl tracking-wide">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt={`${profileData.name} profile layout asset identity file`} className="h-full w-full object-cover" />
                                    ) : (
                                        getNameInitials(profileData.name)
                                    )}
                                </div>

                                <label className="absolute bottom-0 right-0 p-1.5 bg-slate-950 text-white hover:bg-slate-800 rounded-full border border-white shadow-xs cursor-pointer transition-colors">
                                    <Camera className="w-3.5 h-3.5" />
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>

                                {selectedImage && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute -top-1 -right-1 p-1 bg-rose-600 text-white hover:bg-rose-700 rounded-full border border-white shadow-xs cursor-pointer"
                                        title="Revoke image change"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            {/* REPOSITORY IDENTIFICATION META FIELD MATRIX TEXTS */}
                            <div className="space-y-1.5 text-center md:text-left min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate">{profileData.name}</h1>
                                    <span className={`inline-flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-md mx-auto sm:mx-0 w-fit ${profileData.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                                        }`}>
                                        {profileData.status === "ACTIVE" ? <CheckCircle className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                        {profileData.status}
                                    </span>
                                </div>

                                <div className="text-xs text-slate-500 font-medium space-y-0.5">
                                    <p className="flex items-center justify-center md:justify-start gap-1.5 text-slate-700 font-semibold"><Mail className="w-3.5 h-3.5 text-slate-400" /> {profileData.email}</p>
                                    <p className="flex items-center justify-center md:justify-start gap-1.5"><Shield className="w-3.5 h-3.5 text-slate-400" /> Role Matrix Context Index: <span className="font-bold text-slate-800 uppercase tracking-wide">{profileData.role?.replace("_", " ")}</span></p>
                                    <p className="flex items-center justify-center md:justify-start gap-1.5"><Building className="w-3.5 h-3.5 text-slate-400" /> Dynamic Strategy Vector: <span className="bg-slate-100 text-slate-800 px-1.5 py-0.25 rounded text-[10px] font-black uppercase">{profileData.marketingType}</span></p>
                                </div>
                            </div>

                        </div>

                        <div className="text-center md:text-right border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 shrink-0 text-xs text-slate-400 font-medium space-y-1">
                            <p className="flex items-center justify-center md:justify-end gap-1.5"><Calendar className="w-4 h-4 text-slate-300" /> Registry Inception Date: <span className="font-bold text-slate-700 tabular-nums">{formatDateString(profileData.createdAt)}</span></p>
                            <p className="flex items-center justify-center md:justify-end gap-1.5"><Clock className="w-4 h-4 text-slate-300" /> Last Terminal Sync Session: <span className="font-bold text-slate-700 tabular-nums">{profileData.lastLogin ? new Date(profileData.lastLogin).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' }) + " " + formatDateString(profileData.lastLogin) : "N/A"}</span></p>
                        </div>
                    </section>

                    {/* HIGH PERFORMANCE DATA MATRIX TELEMETRY STATISTICS PANELS SUMMARY */}
                    <section className="grid grid-cols-2 lg:grid-cols-6 gap-3.5 sm:gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Actions</span>
                            <span className="text-xl font-black text-slate-900 block mt-1 tabular-nums">{stats.totalVisits}</span>
                            <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">Lifetime visits log</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Month</span>
                            <span className="text-xl font-black text-slate-900 block mt-1 tabular-nums">{stats.thisMonthVisits}</span>
                            <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">Current month tracker</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today Tracker</span>
                            <span className="text-xl font-black text-slate-900 block mt-1 tabular-nums">{stats.todayVisits}</span>
                            <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">Onsite current bounds</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Re-sync</span>
                            <span className="text-xl font-black text-amber-600 block mt-1 tabular-nums">{stats.pendingFollowUps}</span>
                            <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">Awaiting target sync</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leads Prospect</span>
                            <span className="text-xl font-black text-blue-600 block mt-1 tabular-nums">{stats.interestedLeads}</span>
                            <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">High velocity leads</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deals Closed</span>
                            <span className="text-xl font-black text-emerald-600 block mt-1 tabular-nums">{stats.closedDeals}</span>
                            <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">Conversions won size</span>
                        </div>
                    </section>

                    {/* LOWER TWO-COLUMN DESK CONFIGURATION CONTROL RENDER INTERFACE */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                        {/* PERSONAL DETAILS MODIFICATION ENTRY SHEET FORM (LEFT/CENTER) */}
                        <div className="lg:col-span-2 space-y-6">

                            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
                                <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-100">
                                    <User className="w-5 h-5 text-slate-900" />
                                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Personal Attributes Directory</h2>
                                </div>

                                <form onSubmit={handleProfileSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Legal Name <span className="text-rose-500">*</span></label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><User className="w-4 h-4" /></span>
                                                <input type="text" name="name" value={profileData.name} onChange={handleInputChange} required className="w-full border border-slate-300 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-slate-950 text-slate-900 bg-white" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Corporate Email Index</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Mail className="w-4 h-4" /></span>
                                                <input type="email" name="email" value={profileData.email} readOnly className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Primary Phone Axis Coordinates</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Phone className="w-4 h-4" /></span>
                                                <input type="tel" name="phone" value={profileData.phone} onChange={handleInputChange} placeholder="Enter mobile connection digits" className="w-full border border-slate-300 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-slate-950 text-slate-900 bg-white" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Alternative Contact Line</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Phone className="w-4 h-4" /></span>
                                                <input type="tel" name="altPhone" value={profileData.altPhone} onChange={handleInputChange} placeholder="Enter backup network path digits" className="w-full border border-slate-300 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-slate-950 text-slate-900 bg-white" />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Physical Logistics Street Address</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><MapPin className="w-4 h-4" /></span>
                                                <input type="text" name="address" value={profileData.address} onChange={handleInputChange} placeholder="Building, quadrant name, street location indices" className="w-full border border-slate-300 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-slate-950 text-slate-900 bg-white" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">City Zone</label>
                                            <input type="text" name="city" value={profileData.city} onChange={handleInputChange} placeholder="City parameters mapping" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-950 text-slate-900 bg-white" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">State Territory Domain</label>
                                            <input type="text" name="state" value={profileData.state} onChange={handleInputChange} placeholder="State territory parameter" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-950 text-slate-900 bg-white" />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={submittingProfile}
                                            className="w-full sm:w-auto bg-slate-950 text-white rounded-xl py-2.5 px-6 font-bold tracking-wide uppercase text-xs shadow-md hover:bg-slate-900 disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                                        >
                                            {submittingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                            {submittingProfile ? "Saving Attributes..." : "Commit Updates"}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* READ-ONLY WORK METRIC SPECIFICATIONS BLOCK CARD */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
                                <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                                    <Building className="w-5 h-5 text-slate-900" />
                                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Enterprise Employment Parameters</h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                                        <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-0.5">Device Identity Registry ID</span>
                                        <span className="font-mono text-slate-800 break-all select-all font-semibold">{localUser.id || "Unassigned context Index"}</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                                        <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-0.5">Corporate Access Authority Role</span>
                                        <span className="font-bold text-slate-800 uppercase tracking-wide">{profileData.role}</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                                        <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-0.5">Assigned Target Marketing Type</span>
                                        <span className="font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-wider text-[10px] block w-fit mt-0.5">{profileData.marketingType}</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* SEGMENT RIGHTS SECTION CONTROLS: PASSWORD MODIFICATIONS (RIGHT) */}
                        <div className="space-y-6">

                            {/* CHANGE PASSWORD MATRIX CONTROL CONSOLE CARD */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
                                <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                                    <Lock className="w-5 h-5 text-slate-900" />
                                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Security Access Control Configuration</h2>
                                </div>

                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    {passwordError && (
                                        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-lg text-xs font-semibold flex items-start gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            <span>{passwordError}</span>
                                        </div>
                                    )}
                                    {passwordSuccess && (
                                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-lg text-xs font-bold flex items-start gap-1.5">
                                            <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            <span>{passwordSuccess}</span>
                                        </div>
                                    )}

                                    {/* Current pass field */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Current Cryptography Key</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.current ? "text" : "password"}
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                placeholder="Enter active security signature key"
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-950 text-slate-900 pr-10 bg-white"
                                            />
                                            <button type="button" onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">
                                                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* New pass field */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">New Cryptography Key</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.new ? "text" : "password"}
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                placeholder="Min 8 characters unit size"
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-950 text-slate-900 pr-10 bg-white"
                                            />
                                            <button type="button" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">
                                                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm pass field */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Verify Signature Match</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.confirm ? "text" : "password"}
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                placeholder="Re-enter new security signature key"
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-950 text-slate-900 pr-10 bg-white"
                                            />
                                            <button type="button" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">
                                                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submittingPassword}
                                        className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-bold tracking-wide uppercase text-xs hover:bg-slate-800 disabled:opacity-70 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        {submittingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                        {submittingPassword ? "Mutating Matrix Credentials..." : "Commit Key Modification"}
                                    </button>
                                </form>
                            </div>

                            {/* SYSTEM RESOURCE HISTORICAL ACTION TIMELINE COMPONENT BLOCK */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
                                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                                    <Activity className="w-5 h-5 text-slate-900" />
                                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Device Activity Timeline</h2>
                                </div>

                                <div className="space-y-4 relative before:absolute before:inset-y-1 before:left-[11px] before:w-[1px] before:bg-slate-200">
                                    {activities.map((act) => (
                                        <div key={act.id} className="flex gap-3 relative min-w-0 items-start">
                                            <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 z-10">
                                                {getActivityIcon(act.type)}
                                            </div>

                                            <div className="min-w-0 flex-1 space-y-0.5 pt-0.5">
                                                <p className="text-xs font-semibold text-slate-800 leading-tight">{act.description}</p>
                                                <span className="text-[10px] font-mono tracking-tight text-slate-400 block tabular-nums">
                                                    {act.timestamp ? new Date(act.timestamp).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date(act.timestamp).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' }) : ""}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
};

export default FieldAgentProfile;