import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    MapPin, Upload, X, Loader2, User, Phone, Mail, Building, FileText,
    Calendar, Plus, Trash2, Layers, ArrowUpRight, ShieldCheck, Wallet,
    FileSpreadsheet, UserCheck, Clock, Download, Eye, AlertCircle, ArrowLeft
} from "lucide-react";
import API from "../../api/axios";

const FieldAgentEditVisit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Core Lifecycle States
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Core Lead / Business Metadata
    const [businessName, setBusinessName] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [district, setDistrict] = useState("");
    const [state, setState] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [marketingType, setMarketingType] = useState("GENERAL");

    // Dynamic Contact & Email Structures
    const [contacts, setContacts] = useState([
        { name: "", designation: "Owner", customDesignation: "", phoneNumber: "", isPrimary: true }
    ]);
    const [emails, setEmails] = useState([""]);

    // Contextual Categorization & Pipeline Triage
    const [businessCategory, setBusinessCategory] = useState("Car Garage");
    const [customBusinessCategory, setCustomBusinessCategory] = useState("");
    const [source, setSource] = useState("Cold Visit");
    const [priority, setPriority] = useState("Medium");
    const [status, setStatus] = useState("PENDING");
    const [nextFollowUpMode, setNextFollowUpMode] = useState("Call");
    const [meetingResult, setMeetingResult] = useState("Discussed");
    const [leadValue, setLeadValue] = useState("");
    const [visitedDate, setVisitedDate] = useState("");
    const [followUpDate, setFollowUpDate] = useState("");
    const [discussionSummary, setDiscussionSummary] = useState("");

    // Referral Network Section
    const [referredByName, setReferredByName] = useState("");
    const [referredByNumber, setReferredByNumber] = useState("");

    // Product Selection Array State
    const [interestedProducts, setInterestedProducts] = useState([]);

    // Existing Backend Saved Media References
    const [existingImages, setExistingImages] = useState([]);
    const [deletedImageIds, setDeletedImageIds] = useState([]);
    const [existingDocs, setExistingDocs] = useState({
        businessCardFront: null,
        businessCardBack: null,
        gstCertificate: null,
        quotationDoc: null,
        brochureDoc: null
    });

    // Newly Staged Operational Media State Flows
    const [newImages, setNewImages] = useState([]);
    const [newImagePreviews, setNewImagePreviews] = useState([]);
    const [newDocs, setNewDocs] = useState({
        businessCardFront: null,
        businessCardBack: null,
        gstCertificate: null,
        quotationDoc: null,
        brochureDoc: null
    });
    const [newDocPreviews, setNewDocPreviews] = useState({
        businessCardFront: null,
        businessCardBack: null
    });

    // Available System Product Parameters Options Matrix
    const AVAILABLE_PRODUCTS = [
        "CRM", "ERP", "Website", "Mobile App", "Digital Marketing", "SEO",
        "GPS Tracking", "WhatsApp API", "SMS Gateway", "Bulk Email", "Custom Software",
        "Inventory", "Accounting", "Other"
    ];

    // Fetch Workflow Data Synchronization Payload
    useEffect(() => {
        const fetchExistingVisitPayload = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await API.get(`/api/field-visit/${id}`);
                const data = response.data;

                if (data) {
                    setBusinessName(data.title || "");
                    setAddress(data.address || "");
                    setCity(data.city || "");
                    setDistrict(data.district || "");
                    setState(data.state || "");
                    setLatitude(data.latitude || "");
                    setLongitude(data.longitude || "");
                    setMarketingType(data.marketingType || "GENERAL");
                    setSource(data.source || "Cold Visit");
                    setPriority(data.priority || "Medium");
                    setStatus(data.status || "PENDING");
                    setNextFollowUpMode(data.nextFollowUpMode || "Call");
                    setMeetingResult(data.meetingResult || "Discussed");
                    setLeadValue(data.leadValue || "");
                    setDiscussionSummary(data.discussionSummary || data.notes || "");
                    setReferredByName(data.referredByName || "");
                    setReferredByNumber(data.referredByPhone || data.referredByNumber || "");

                    if (data.visitedDate) {
                        setVisitedDate(data.visitedDate.split("T")[0]);
                    } else {
                        setVisitedDate(new Date().toISOString().split("T")[0]);
                    }

                    if (data.followUpDate) {
                        setFollowUpDate(data.followUpDate.split("T")[0]);
                    }

                    // Handle Conditional Selection Options Setup
                    const baseCategories = ["Bike Garage", "Car Garage", "Tyre Shop", "Battery Shop", "Spare Parts", "Accessories", "Car Wash", "Petrol Pump", "School", "Hospital", "Restaurant", "General Commercial"];
                    if (data.businessCategory && !baseCategories.includes(data.businessCategory)) {
                        setBusinessCategory("Others");
                        setCustomBusinessCategory(data.businessCategory);
                    } else {
                        setBusinessCategory(data.businessCategory || "Car Garage");
                    }

                    // Handle Contacts Parsing Strategy Alignment
                    let parsedContacts = [];
                    if (typeof data.contacts === "string") {
                        parsedContacts = JSON.parse(data.contacts);
                    } else {
                        parsedContacts = data.contacts || [];
                    }
                    if (parsedContacts.length > 0) {
                        const baseDesignations = ["Owner", "Manager", "Reception", "Cashier", "Supervisor", "Sales", "Partner"];
                        setContacts(parsedContacts.map(c => {
                            const matchesBase = baseDesignations.includes(c.designation);
                            return {
                                name: c.name || "",
                                designation: matchesBase ? c.designation : "Other",
                                customDesignation: matchesBase ? "" : c.designation,
                                phoneNumber: c.phoneNumber || "",
                                isPrimary: !!c.isPrimary
                            };
                        }));
                    }

                    // Handle Email Mapping Layout
                    let parsedEmails = [];
                    if (typeof data.emails === "string") {
                        parsedEmails = JSON.parse(data.emails);
                    } else {
                        parsedEmails = data.emails || [];
                    }
                    setEmails(parsedEmails.length > 0 ? parsedEmails : [""]);

                    // Handle Products Array Restructuring
                    let parsedProducts = [];
                    if (typeof data.interestedProducts === "string") {
                        parsedProducts = JSON.parse(data.interestedProducts);
                    } else {
                        parsedProducts = data.interestedProducts || [];
                    }
                    setInterestedProducts(parsedProducts);

                    // Track Existing Uploaded Media
                    setExistingImages(data.images || []);
                    setExistingDocs({
                        businessCardFront: data.businessCardFront || null,
                        businessCardBack: data.businessCardBack || null,
                        gstCertificate: data.gstCertificate || null,
                        quotationDoc: data.quotationDoc || null,
                        brochureDoc: data.brochureDoc || null
                    });
                }
            } catch (err) {
                console.error("Payload indexing exception trace failure: ", err);
                setError("Unable to process the structural lead components from the endpoint reference repository.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchExistingVisitPayload();
    }, [id]);

    // Memoized Array Manipulation Target Modifiers
    const addContactRow = useCallback(() => {
        setContacts(prev => [...prev, { name: "", designation: "Manager", customDesignation: "", phoneNumber: "", isPrimary: false }]);
    }, []);

    const removeContactRow = useCallback((index) => {
        setContacts(prev => {
            if (prev[index].isPrimary && prev.length > 1) {
                alert("Reassign structural explicit primary contact flag before processing row index erasure.");
                return prev;
            }
            return prev.filter((_, i) => i !== index);
        });
    }, []);

    const updateContactRow = useCallback((index, field, value) => {
        setContacts(prev => prev.map((c, i) => {
            if (i === index) {
                return { ...c, [field]: value };
            }
            if (field === "isPrimary" && value === true) {
                return { ...c, isPrimary: false };
            }
            return c;
        }));
    }, []);

    const addEmailRow = useCallback(() => setEmails(prev => [...prev, ""]), []);
    const removeEmailRow = useCallback((index) => setEmails(prev => prev.filter((_, i) => i !== index)), []);
    const updateEmailRow = useCallback((index, value) => {
        setEmails(prev => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    }, []);

    const handleProductToggle = useCallback((product) => {
        setInterestedProducts(prev =>
            prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product]
        );
    }, []);

    // Multi-Image Real-Time Upload Logic Triggers
    const handleNewImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        const netCount = existingImages.length - deletedImageIds.length + newImages.length + selectedFiles.length;

        if (netCount > 10) {
            alert("Exceeded maximum multi-image upload capacity structural boundary limitation (Max 10 Images total).");
            return;
        }

        const validated = selectedFiles.filter(file => file.type.startsWith("image/"));
        setNewImages([...newImages, ...validated]);
        const urls = validated.map(file => URL.createObjectURL(file));
        setNewImagePreviews([...newImagePreviews, ...urls]);
    };

    const handleRemoveNewImage = (index) => {
        URL.revokeObjectURL(newImagePreviews[index]);
        setNewImages(newImages.filter((_, i) => i !== index));
        setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
    };

    const handleMarkExistingImageDeleted = (imgId) => {
        setDeletedImageIds([...deletedImageIds, imgId]);
    };

    // Document File System Streams State Modifications
    const handleNewDocFileChange = (e, key) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setNewDocs(prev => ({ ...prev, [key]: file }));

        if (key === "businessCardFront" || key === "businessCardBack") {
            if (newDocPreviews[key]) URL.revokeObjectURL(newDocPreviews[key]);
            const url = URL.createObjectURL(file);
            setNewDocPreviews(prev => ({ ...prev, [key]: url }));
        }
    };

    const handleRemoveNewDocFile = (key) => {
        if (newDocPreviews[key]) URL.revokeObjectURL(newDocPreviews[key]);
        setNewDocs(prev => ({ ...prev, [key]: null }));
        setNewDocPreviews(prev => ({ ...prev, [key]: null }));
    };

    // Submit Orchestration Form Data Payload
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!businessName.trim()) return alert("Business Name title compilation tracking parameter error.");
        const validContacts = contacts.filter(c => c.name.trim() && c.phoneNumber.trim());
        if (validContacts.length === 0) return alert("At least one named contact operational data registry trace mandatory.");
        if (!contacts.some(c => c.isPrimary)) return alert("One explicitly configured structural primary contact allocation required.");
        if (!visitedDate) return alert("Visited Date is a required pipeline marker.");

        try {
            setIsSubmitting(true);
            const formData = new FormData();

            // Core Structural Properties Mapping Data Injection
            formData.append("title", businessName.trim());
            formData.append("address", address.trim());
            formData.append("city", city.trim());
            formData.append("district", district.trim());
            formData.append("state", state.trim());
            formData.append("latitude", latitude);
            formData.append("longitude", longitude);
            formData.append("marketingType", marketingType);

            // Category Logic Re-assembly Checks
            const finalCategory = businessCategory === "Others" ? customBusinessCategory.trim() : businessCategory;
            formData.append("businessCategory", finalCategory);
            formData.append("source", source);
            formData.append("priority", priority);
            formData.append("status", status);
            formData.append("nextFollowUpMode", nextFollowUpMode);
            formData.append("meetingResult", meetingResult);
            formData.append("leadValue", leadValue);
            formData.append("visitedDate", visitedDate);
            formData.append("followUpDate", followUpDate);
            formData.append("discussionSummary", discussionSummary.trim());

            // Referral parameters append
            formData.append("referredByName", referredByName.trim());
            formData.append("referredByPhone", referredByNumber.trim());

            // Format Structural Personnel Array Metrics
            const processedContacts = validContacts.map(c => ({
                name: c.name.trim(),
                phoneNumber: c.phoneNumber.trim(),
                isPrimary: c.isPrimary,
                designation: c.designation === "Other" ? c.customDesignation.trim() : c.designation
            }));

            formData.append("contacts", JSON.stringify(processedContacts));
            formData.append("emails", JSON.stringify(emails.filter(em => em.trim())));
            formData.append("interestedProducts", JSON.stringify(interestedProducts));

            // Append Imagery Modifications Telemetry Files Checksums
            formData.append("deletedImageIds", JSON.stringify(deletedImageIds));
            newImages.forEach(img => formData.append("images", img));

            // Keyed Explicit Document Streams Check Injection Mapping
            Object.keys(newDocs).forEach(key => {
                if (newDocs[key]) {
                    formData.append(key, newDocs[key]);
                }
            });

            await API.put(`/api/field-visit/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            alert("Lead records modified and committed successfully.");

            // Revoke allocations mapping urls to preserve cache integrity bounds
            newImagePreviews.forEach(url => URL.revokeObjectURL(url));
            Object.values(newDocPreviews).forEach(url => { if (url) URL.revokeObjectURL(url); });

            navigate(`/field-agent-dashboard/visit/${id}`);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Internal Exception Processing Platform Framework Pipeline Request Handler Execution Error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 md:px-8 space-y-6 animate-pulse">
                <div className="h-20 bg-white rounded-xl border border-slate-200" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-96 bg-white rounded-xl border border-slate-200" />
                    <div className="h-96 bg-white rounded-xl border border-slate-200" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-xl mx-auto my-16 text-center bg-white border border-slate-200 p-8 rounded-xl shadow-xs space-y-4">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">Workspace Synchronization Halted</h3>
                <p className="text-xs text-slate-400">{error}</p>
                <button onClick={() => navigate("/field-agent-dashboard/my-visits")} className="px-4 py-2 text-xs font-bold uppercase bg-slate-950 text-white rounded-lg hover:bg-slate-800 transition-colors">
                    Return To Registry
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 pb-32">

            {/* STICKY HEADER REVISION CONSOLE STRIP */}
            <header className="sticky top-0 z-40 border-b border-slate-200/80 px-4 py-4 sm:px-6 md:px-8 shadow-xs backdrop-blur-md bg-white/95">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <button
                            type="button"
                            onClick={() => navigate(`/field-agent-dashboard/visit/${id}`)}
                            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="min-w-0">
                            <span className="text-[10px] tracking-[0.25em] uppercase text-slate-500 font-bold block mb-0.5">
                                Resource Revision Environment
                            </span>
                            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate">
                                Modify Lead Parameters: {businessName || "Draft Record"}
                            </h1>
                        </div>
                    </div>
                    <div className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold tracking-wide uppercase max-w-fit shrink-0">
                        {marketingType}
                    </div>
                </div>
            </header>

            {/* CORE WORKSPACE GRID PANEL FRAMEWORK */}
            <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 md:px-8">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* PRIMARY PARAMETER FIELDS DESK LAYER (LEFT/CENTER COLUMNS) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* CARD 1: BUSINESS LOGISTICS ARCHITECTURE BLUEPRINT */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6">
                            <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-100">
                                <Building className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Business Blueprint Modification</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Business Trade Name <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                            <Building className="w-4 h-4" />
                                        </span>
                                        <input
                                            type="text"
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            required
                                            placeholder="Enter company trading banner name"
                                            className="w-full border border-slate-300 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-slate-900 transition-all text-slate-900 bg-white"
                                        />
                                    </div>
                                </div>

                                {/* DYNAMIC MULTI-EMAIL MATRIX SUBORDINATE STRIP */}
                                <div className="pt-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                        <span>Corporate Email Records Indexes</span>
                                        <button
                                            type="button"
                                            onClick={addEmailRow}
                                            className="inline-flex items-center gap-1 text-[11px] text-slate-900 hover:underline font-bold cursor-pointer"
                                        >
                                            <Plus className="w-3 h-3" /> Append Email Row Reference
                                        </button>
                                    </label>
                                    <div className="space-y-2">
                                        {emails.map((email, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                        <Mail className="w-4 h-4" />
                                                    </span>
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => updateEmailRow(idx, e.target.value)}
                                                        placeholder="e.g., procurement@outlet.org or trading@firm.in"
                                                        className="w-full border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-slate-900 text-slate-900 bg-white"
                                                    />
                                                </div>
                                                {emails.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeEmailRow(idx)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors border border-slate-200 rounded-lg bg-slate-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* CARD 2: RECONFIGURABLE DYNAMIC PERSONNEL MANAGEMENT CELL */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6">
                            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <User className="w-5 h-5 text-slate-900" />
                                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Personnel Directory Realignment</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={addContactRow}
                                    className="inline-flex items-center gap-1 text-xs bg-slate-950 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Append Contact
                                </button>
                            </div>

                            <div className="space-y-6 divide-y divide-slate-100">
                                {contacts.map((contact, idx) => (
                                    <div key={idx} className="pt-4 first:pt-0 space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end relative">

                                            <div className="sm:col-span-4">
                                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                                    Personnel Name <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={contact.name}
                                                    onChange={(e) => updateContactRow(idx, "name", e.target.value)}
                                                    placeholder="Contact full name"
                                                    required
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-900 text-slate-900 bg-white"
                                                />
                                            </div>

                                            <div className="sm:col-span-3">
                                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                                    Designation Structural Role
                                                </label>
                                                <select
                                                    value={contact.designation}
                                                    onChange={(e) => updateContactRow(idx, "designation", e.target.value)}
                                                    className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-slate-900 bg-white text-slate-900"
                                                >
                                                    <option value="Owner">Owner</option>
                                                    <option value="Manager">Manager</option>
                                                    <option value="Reception">Reception</option>
                                                    <option value="Cashier">Cashier</option>
                                                    <option value="Supervisor">Supervisor</option>
                                                    <option value="Sales">Sales Execution</option>
                                                    <option value="Partner">Stakeholder Partner</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>

                                            <div className="sm:col-span-3">
                                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                                    Phone Number <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={contact.phoneNumber}
                                                    onChange={(e) => updateContactRow(idx, "phoneNumber", e.target.value)}
                                                    placeholder="Contact digit sequence"
                                                    required
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-900 text-slate-900 bg-white"
                                                />
                                            </div>

                                            <div className="sm:col-span-2 flex items-center justify-between gap-2 h-9 pb-0.5">
                                                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold select-none text-slate-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={contact.isPrimary}
                                                        onChange={(e) => updateContactRow(idx, "isPrimary", e.target.checked)}
                                                        className="w-4 h-4 text-slate-950 border-slate-300 rounded focus:ring-0 cursor-pointer"
                                                    />
                                                    Primary
                                                </label>

                                                {contacts.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeContactRow(idx)}
                                                        className="text-slate-400 hover:text-rose-600 p-1.5 border border-slate-200 rounded-md bg-slate-50 hover:border-rose-100 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* CONDITIONAL SUBFIELD FIELD ARRAY FOR CUSTOM SPECIFIC DESIGNATION */}
                                        {contact.designation === "Other" && (
                                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 animate-fadeIn">
                                                <div className="sm:col-start-5 sm:col-span-4 bg-slate-50 border border-slate-200 p-3 rounded-lg">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                                        Specify Custom Designation <span className="text-rose-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={contact.customDesignation || ""}
                                                        onChange={(e) => updateContactRow(idx, "customDesignation", e.target.value)}
                                                        required
                                                        placeholder="e.g., Technical Supervisor"
                                                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-slate-900 text-slate-900 bg-white"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* CARD 3: REFERRAL AFFILIATION PARTNERS INFORMATION CAPTURE */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6">
                            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                                <UserCheck className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Referral Network Information</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Referred By (Name)</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                            <User className="w-4 h-4" />
                                        </span>
                                        <input
                                            type="text"
                                            value={referredByName}
                                            onChange={(e) => setReferredByName(e.target.value)}
                                            placeholder="Enter name of associate partner reference link"
                                            className="w-full border border-slate-300 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900 bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Referrer Contact Number</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                            <Phone className="w-4 h-4" />
                                        </span>
                                        <input
                                            type="tel"
                                            value={referredByNumber}
                                            onChange={(e) => setReferredByNumber(e.target.value)}
                                            placeholder="Enter referrer phone digit string sequence"
                                            className="w-full border border-slate-300 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* CARD 4: GEOGRAPHIC LOGISTICS FOOTPRINT COORDINATES CONFIGURATION */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6">
                            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                                <MapPin className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Geographic Footprint Matrix</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-3">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Street Address Location</label>
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Physical storefront or office location footprint parameters"
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900 bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">City</label>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="City"
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900 bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">District</label>
                                    <input
                                        type="text"
                                        value={district}
                                        onChange={(e) => setDistrict(e.target.value)}
                                        placeholder="District"
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900 bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">State</label>
                                    <input
                                        type="text"
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                        placeholder="State territory"
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900 bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Latitude Coordinate</label>
                                    <input
                                        type="text"
                                        value={latitude}
                                        onChange={(e) => setLatitude(e.target.value)}
                                        placeholder="Spatial vector parameter"
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900 bg-white font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Longitude Coordinate</label>
                                    <input
                                        type="text"
                                        value={longitude}
                                        onChange={(e) => setLongitude(e.target.value)}
                                        placeholder="Spatial vector parameter"
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900 bg-white font-mono"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* CARD 5: RESTRUCTURED ASSOCIATED STRUCT FILE VAULTS UPLOADS MANAGEMENT */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6">
                            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                                <FileSpreadsheet className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Structured Files Matrix Re-indexing</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                                {/* GST DOCUMENT SUITE */}
                                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50 space-y-3">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">GST Identification Certificate</label>
                                    {existingDocs.gstCertificate && (
                                        <div className="flex items-center justify-between text-xs bg-white border border-slate-200 rounded-lg p-2">
                                            <span className="truncate text-slate-600 font-semibold max-w-[70%]">Active Asset Saved Profile</span>
                                            <a href={existingDocs.gstCertificate} target="_blank" rel="noreferrer" className="inline-flex text-indigo-600 items-center gap-0.5 hover:underline text-[11px]"><Eye className="w-3 h-3" /> View</a>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept=".pdf,image/*"
                                        onChange={(e) => handleNewDocFileChange(e, "gstCertificate")}
                                        className="text-xs w-full block text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                                    />
                                </div>

                                {/* PROVISIONAL QUOTATION SUITE */}
                                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50 space-y-3">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Provisional Quotation Draft</label>
                                    {existingDocs.quotationDoc && (
                                        <div className="flex items-center justify-between text-xs bg-white border border-slate-200 rounded-lg p-2">
                                            <span className="truncate text-slate-600 font-semibold max-w-[70%]">Active Asset Saved Profile</span>
                                            <a href={existingDocs.quotationDoc} target="_blank" rel="noreferrer" className="inline-flex text-indigo-600 items-center gap-0.5 hover:underline text-[11px]"><Eye className="w-3 h-3" /> View</a>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept=".pdf,image/*"
                                        onChange={(e) => handleNewDocFileChange(e, "quotationDoc")}
                                        className="text-xs w-full block text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                                    />
                                </div>

                                {/* BROCHURE MATERIAL DATA LOG */}
                                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50 space-y-3 sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Marketing Brochure Portfolio Collateral</label>
                                    {existingDocs.brochureDoc && (
                                        <div className="flex items-center justify-between text-xs bg-white border border-slate-200 rounded-lg p-2">
                                            <span className="truncate text-slate-600 font-semibold max-w-[80%]">Active Asset Saved Profile</span>
                                            <a href={existingDocs.brochureDoc} target="_blank" rel="noreferrer" className="inline-flex text-indigo-600 items-center gap-0.5 hover:underline text-[11px]"><Eye className="w-3 h-3" /> View</a>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept=".pdf,image/*"
                                        onChange={(e) => handleNewDocFileChange(e, "brochureDoc")}
                                        className="text-xs w-full block text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* SECONDARY PIPELINE DATA CRITERIA SELECTION PANELS DESK (RIGHT COLUMN) */}
                    <div className="space-y-6">

                        {/* CARD 6: EXTENDED ENTROPY CRM META SELECTION DISPATCH CONSOLE */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6">
                            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                                <Layers className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">CRM Status Configuration</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Business Category Classification</label>
                                    <select
                                        value={businessCategory}
                                        onChange={(e) => setBusinessCategory(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-slate-900 bg-white text-slate-900"
                                    >
                                        <option value="Bike Garage">Bike Garage</option>
                                        <option value="Car Garage">Car Garage</option>
                                        <option value="Tyre Shop">Tyre Shop</option>
                                        <option value="Battery Shop">Battery Shop</option>
                                        <option value="Spare Parts">Spare Parts</option>
                                        <option value="Accessories">Accessories Outfitting</option>
                                        <option value="Car Wash">Car Wash Automation</option>
                                        <option value="Petrol Pump">Petrol Pump Station</option>
                                        <option value="School">School / Institution</option>
                                        <option value="Hospital">Hospital / Healthcare</option>
                                        <option value="Restaurant">Restaurant / Cafe</option>
                                        <option value="General Commercial">General Commercial Enterprise</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </div>

                                {/* CONDITIONAL SUBFIELD INPUT FOR CUSTOM UNLISTED BUSINESS CATEGORIES */}
                                {businessCategory === "Others" && (
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 animate-fadeIn">
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                            Specify Business Category <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={customBusinessCategory}
                                            onChange={(e) => setCustomBusinessCategory(e.target.value)}
                                            required
                                            placeholder="Specify trade category"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-900 bg-white text-slate-900"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Lead Strategy Acquisition Source</label>
                                    <select
                                        value={source}
                                        onChange={(e) => setSource(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-slate-900 bg-white text-slate-900"
                                    >
                                        <option value="Walk In">Walk In Presence</option>
                                        <option value="Reference">Referral Node</option>
                                        <option value="Cold Visit">Cold Onsite Engagement</option>
                                        <option value="Google">Google SERP/Maps</option>
                                        <option value="Existing Customer">Retained Customer Profile</option>
                                        <option value="Campaign">Marketing Activation Run</option>
                                        <option value="Social Media">Social Engagement Link</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Lead Priority</label>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg px-2.5 py-2.5 text-sm outline-none focus:border-slate-900 bg-white text-slate-900"
                                        >
                                            <option value="High">High</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Low">Low</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Lifecycle Stage</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg px-2.5 py-2.5 text-sm outline-none focus:border-slate-900 bg-white text-slate-900"
                                        >
                                            <option value="PENDING">PENDING</option>
                                            <option value="FOLLOW_UP">FOLLOW UP</option>
                                            <option value="INTERESTED">INTERESTED</option>
                                            <option value="CUSTOMER">CUSTOMER</option>
                                            <option value="CLOSED">CLOSED</option>
                                            <option value="NOT_INTERESTED">NOT INTERESTED</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Estimated Deal Value Size (₹)</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-xs font-bold">₹</span>
                                        <input
                                            type="number"
                                            value={leadValue}
                                            onChange={(e) => setLeadValue(e.target.value)}
                                            placeholder="Value projection metrics"
                                            className="w-full border border-slate-300 rounded-lg pl-7 pr-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900 bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Visited Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={visitedDate}
                                        onChange={(e) => setVisitedDate(e.target.value)}
                                        required
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-900 bg-white text-slate-900"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Follow-up Vector</label>
                                        <select
                                            value={nextFollowUpMode}
                                            onChange={(e) => setNextFollowUpMode(e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg px-2 py-2.5 text-sm outline-none focus:border-slate-900 bg-white text-slate-900"
                                        >
                                            <option value="Call">Phone Call</option>
                                            <option value="WhatsApp">WhatsApp Link</option>
                                            <option value="Visit">Physical Return</option>
                                            <option value="Meeting">Executive Sync</option>
                                            <option value="Demo">Deployment Demo</option>
                                            <option value="Quotation">Quotation Offer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-slate-400" /> Target Date
                                        </label>
                                        <input
                                            type="date"
                                            value={followUpDate}
                                            onChange={(e) => setFollowUpDate(e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg px-2 py-2.5 text-sm outline-none focus:border-slate-900 bg-white text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Interaction Log Notes</label>
                                    <textarea
                                        rows={4}
                                        value={discussionSummary}
                                        onChange={(e) => setDiscussionSummary(e.target.value)}
                                        placeholder="Document workspace notes or strategic meeting dialogue milestones..."
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900 resize-none bg-white"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* CARD 7: SYSTEM FOCUS PRODUCTS CATALOG INTERFACE */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6">
                            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                                <ArrowUpRight className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Catalogs Pipeline Focus</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                {AVAILABLE_PRODUCTS.map((prod) => (
                                    <label key={prod} className="flex items-center gap-2 border border-slate-100 bg-slate-50/50 p-2 rounded-xl text-xs font-medium cursor-pointer select-none text-slate-800 hover:bg-slate-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={interestedProducts.includes(prod)}
                                            onChange={() => handleProductToggle(prod)}
                                            className="w-4 h-4 text-slate-950 border-slate-300 rounded focus:ring-0 cursor-pointer"
                                        />
                                        {prod}
                                    </label>
                                ))}
                            </div>
                        </section>

                        {/* CARD 8: STRUCTURAL EXPLICIT VISITING CARDS IDENTITY UPLOADS MODULES */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6">
                            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                                <ShieldCheck className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Corporate KYC Identity Stream</h2>
                            </div>

                            <div className="space-y-4">
                                {/* FRONT FACING CARD MODULE */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Corporate Card Front Face</label>
                                    {existingDocs.businessCardFront && (
                                        <p className="text-[10px] text-emerald-600 font-bold mb-1 flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" /> Front card profile asset saved on backend store partition.</p>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleNewDocFileChange(e, "businessCardFront")}
                                        className="text-xs w-full block text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
                                    />
                                    {newDocPreviews.businessCardFront && (
                                        <div className="mt-2 relative aspect-[3.5/2] w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                            <img src={newDocPreviews.businessCardFront} alt="Identity Front Staged Asset Preview" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => handleRemoveNewDocFile("businessCardFront")} className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-full text-white hover:bg-rose-600"><X className="w-3 h-3" /></button>
                                        </div>
                                    )}
                                </div>

                                {/* BACK FACING CARD MODULE */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Corporate Card Reverse Face</label>
                                    {existingDocs.businessCardBack && (
                                        <p className="text-[10px] text-emerald-600 font-bold mb-1 flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" /> Back card profile asset saved on backend store partition.</p>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleNewDocFileChange(e, "businessCardBack")}
                                        className="text-xs w-full block text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
                                    />
                                    {newDocPreviews.businessCardBack && (
                                        <div className="mt-2 relative aspect-[3.5/2] w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                            <img src={newDocPreviews.businessCardBack} alt="Identity Reverse Staged Asset Preview" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => handleRemoveNewDocFile("businessCardBack")} className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-full text-white hover:bg-rose-600"><X className="w-3 h-3" /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* CARD 9: RAW FIELD PHOTOS CONTEXT AND MULTI IMAGES REGISTRY */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6">
                            <div className="flex items-center justify-between mb-2 pb-1">
                                <div className="flex items-center gap-2.5">
                                    <Upload className="w-5 h-5 text-slate-900" />
                                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Onsite Field Photo Context</h2>
                                </div>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                    {existingImages.length - deletedImageIds.length + newImages.length}/10
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mb-4">Re-index, clear or allocate up to 10 visual operational verification storefront images total.</p>

                            {/* Existing Backend Saved Images Tracker Layer */}
                            {existingImages.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Live Server Images</span>
                                    <div className="grid grid-cols-4 gap-2 border p-2 rounded-xl bg-slate-50/50">
                                        {existingImages.map((img) => {
                                            const isDeleted = deletedImageIds.includes(img.id);
                                            return (
                                                <div key={img.id} className={`relative aspect-square border bg-white rounded-lg overflow-hidden transition-opacity ${isDeleted ? "opacity-30 border-rose-300" : "border-slate-200"}`}>
                                                    <img src={img.imageUrl} alt="Server verification asset frame block" className="w-full h-full object-cover" />
                                                    {!isDeleted ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMarkExistingImageDeleted(img.id)}
                                                            className="absolute top-0.5 right-0.5 bg-black/60 text-white hover:bg-rose-600 transition-colors p-1 rounded-full cursor-pointer shadow-xs"
                                                            title="Mark image for cloud database erasure"
                                                        >
                                                            <X className="w-2.5 h-2.5" />
                                                        </button>
                                                    ) : (
                                                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-rose-600 uppercase bg-rose-50/70 select-none tracking-tighter">Will Purge</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Newly Staged Multi-Upload Trigger Input Area Box Dropzone */}
                            <label className="group flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 hover:border-slate-900 rounded-xl transition-all duration-150 cursor-pointer bg-slate-50/40 hover:bg-slate-50">
                                <div className="flex flex-col items-center justify-center pt-3 pb-3 text-center px-4">
                                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors mb-1" />
                                    <p className="text-xs text-slate-600 font-semibold">Stage new images onto upload stream pipeline</p>
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleNewImageChange}
                                    className="hidden"
                                />
                            </label>

                            {newImagePreviews.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100">
                                    {newImagePreviews.map((url, idx) => (
                                        <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                            <img src={url} alt={`Staged Photo Matrix Track ${idx + 1}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveNewImage(idx)}
                                                className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-rose-600 text-white p-1 rounded-full shadow-sm cursor-pointer"
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </form>
            </main>

            {/* STICKY BOTTOM RUNTIME SAVEBAR DISPATCH BOARD */}
            <footer className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 py-3.5 px-4 sm:px-6 md:px-8 shadow-md z-40 backdrop-blur-md bg-white/95">
                <div className="max-w-7xl mx-auto flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(`/field-agent-dashboard/visit/${id}`)}
                        disabled={isSubmitting}
                        className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        Cancel Revision
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-slate-950 hover:bg-slate-900 text-white font-bold py-2 px-6 rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-70 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        {isSubmitting ? "Committing Structure Revisions..." : "Commit Lead Changes"}
                    </button>
                </div>
            </footer>

        </div>
    );
};

export default FieldAgentEditVisit;