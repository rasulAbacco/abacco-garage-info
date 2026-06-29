import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    MapPin, Upload, X, Loader2, User, Phone, Mail,
    Building, Calendar, Plus, Trash2,
    Layers, ArrowUpRight, ShieldCheck, FileSpreadsheet,
    Users
} from "lucide-react";
import API from "../../api/axios";

const FieldAgentAddVisit = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user")) || { id: "", marketingType: "GENERAL" };

    // Core Lead / Business Metadata
    const [businessName, setBusinessName] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [district, setDistrict] = useState("");
    const [state, setState] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");

    // Dynamic Contacts Matrix
    const [contacts, setContacts] = useState([
        { name: "", designation: "Owner", customDesignation: "", phoneNumber: "", isPrimary: true }
    ]);

    // Dynamic Multi-Email Array
    const [emails, setEmails] = useState([""]);

    // Contextual Categorization & Pipeline Triage
    const [businessCategory, setBusinessCategory] = useState("Car Garage");
    const [customCategory, setCustomCategory] = useState("");
    const [source, setSource] = useState("Cold Visit");
    const [priority, setPriority] = useState("Medium");
    const [status, setStatus] = useState("PENDING");
    const [nextFollowUpMode, setNextFollowUpMode] = useState("Call");
    const [meetingResult, setMeetingResult] = useState("Discussed");
    const [leadValue, setLeadValue] = useState("");
    const [visitedDate, setVisitedDate] = useState(new Date().toISOString().split("T")[0]);
    const [followUpDate, setFollowUpDate] = useState("");
    const [discussionSummary, setDiscussionSummary] = useState("");

    // Referral Network Metrics
    const [referredByName, setReferredByName] = useState("");
    const [referredByPhone, setReferredByPhone] = useState("");

    // Product Matrix Tracking Array
    const [interestedProducts, setInterestedProducts] = useState([]);

    // Document & Imagery Pipelines
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [documents, setDocuments] = useState({
        businessCardFront: null,
        businessCardBack: null,
        gstCertificate: null,
        quotationDoc: null,
        brochureDoc: null
    });
    const [docPreviews, setDocPreviews] = useState({
        businessCardFront: null,
        businessCardBack: null
    });

    // State Management Flags
    const [isLocating, setIsLocating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Available Product Constants Matrix
    const AVAILABLE_PRODUCTS = ["CRM", "Website", "Billing", "GPS", "WhatsApp API", "ERP", "Mobile App", "Digital Marketing"];

    // Geolocation Routine
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation telemetry runtime is unsupported on this device environment.");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude.toString());
                setLongitude(position.coords.longitude.toString());
                setIsLocating(false);
            },
            (error) => {
                console.error("GPS telemetry exception: ", error);
                alert("Unable to query location coordinate parameters. Ensure device permissions match.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // Contacts Array Modification Handlers
    const addContactRow = () => {
        setContacts([...contacts, { name: "", designation: "Manager", customDesignation: "", phoneNumber: "", isPrimary: false }]);
    };

    const removeContactRow = (index) => {
        if (contacts[index].isPrimary && contacts.length > 1) {
            alert("Reassign primary status flag before clearing this dynamic contact reference.");
            return;
        }
        setContacts(contacts.filter((_, i) => i !== index));
    };

    const updateContactRow = (index, field, value) => {
        const updated = contacts.map((c, i) => {
            if (i === index) {
                return { ...c, [field]: value };
            }
            if (field === "isPrimary" && value === true) {
                return { ...c, isPrimary: false };
            }
            return c;
        });
        setContacts(updated);
    };

    // Multiple Emails Arrays Handlers
    const addEmailRow = () => setEmails([...emails, ""]);
    const removeEmailRow = (index) => setEmails(emails.filter((_, i) => i !== index));
    const updateEmailRow = (index, value) => {
        const updated = [...emails];
        updated[index] = value;
        setEmails(updated);
    };

    // Checkbox Selection Handler
    const handleProductToggle = (product) => {
        if (interestedProducts.includes(product)) {
            setInterestedProducts(interestedProducts.filter(p => p !== product));
        } else {
            setInterestedProducts([...interestedProducts, product]);
        }
    };

    // Core Generic Image Upload Handlers
    const handleImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (images.length + selectedFiles.length > 10) {
            alert("Exceeded maximum multi-image upload payload constraint threshold (Max 10 Images).");
            return;
        }
        const validated = selectedFiles.filter(file => file.type.startsWith("image/"));
        setImages([...images, ...validated]);
        const urls = validated.map(file => URL.createObjectURL(file));
        setImagePreviews([...imagePreviews, ...urls]);
    };

    const handleRemoveImage = (index) => {
        URL.revokeObjectURL(imagePreviews[index]);
        setImages(images.filter((_, i) => i !== index));
        setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    };

    // Specialized Structured File Upload Handlers
    const handleDocFileChange = (e, key) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setDocuments(prev => ({ ...prev, [key]: file }));

        if (key === "businessCardFront" || key === "businessCardBack") {
            if (docPreviews[key]) URL.revokeObjectURL(docPreviews[key]);
            const url = URL.createObjectURL(file);
            setDocPreviews(prev => ({ ...prev, [key]: url }));
        }
    };

    const handleRemoveDocFile = (key) => {
        if (docPreviews[key]) URL.revokeObjectURL(docPreviews[key]);
        setDocuments(prev => ({ ...prev, [key]: null }));
        setDocPreviews(prev => ({ ...prev, [key]: null }));
    };

    // Submit Operations Pipeline
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!businessName.trim()) return alert("Business Name title mapping constraint violation.");
        const validContacts = contacts.filter(c => c.name.trim() && c.phoneNumber.trim());
        if (validContacts.length === 0) return alert("At least one contact profile record is required.");
        if (!contacts.some(c => c.isPrimary)) return alert("One explicitly assigned primary contact target configuration is mandatory.");
        if (businessCategory === "Others" && !customCategory.trim()) return alert("Please specify the custom Business Category.");
        if (!visitedDate) return alert("Visited Date is a required pipeline marker.");

        try {
            setIsSubmitting(true);
            const formData = new FormData();

            // Scalar Base Fields Data Append
            formData.append("employeeId", user.id);
            formData.append("title", businessName.trim());
            formData.append("address", address.trim());
            formData.append("city", city.trim());
            formData.append("district", district.trim());
            formData.append("state", state.trim());
            formData.append("latitude", latitude);
            formData.append("longitude", longitude);
            formData.append("marketingType", user.marketingType || "GENERAL");

            // Extended Core Meta-Fields
            formData.append("businessCategory", businessCategory === "Others" ? customCategory.trim() : businessCategory);
            formData.append("source", source);
            formData.append("priority", priority);
            formData.append("status", status);
            formData.append("nextFollowUpMode", nextFollowUpMode);
            formData.append("meetingResult", meetingResult);
            formData.append("leadValue", leadValue);
            formData.append("visitedDate", visitedDate);
            formData.append("followUpDate", followUpDate);
            formData.append("discussionSummary", discussionSummary.trim());

            // Referral Nodes
            formData.append("referredByName", referredByName.trim());
            formData.append("referredByPhone", referredByPhone.trim());

            // Process and serialize data structures to string values for multipart boundaries
            const processedContacts = validContacts.map(c => ({
                name: c.name,
                designation: c.designation === "Other" ? c.customDesignation.trim() : c.designation,
                phoneNumber: c.phoneNumber,
                isPrimary: c.isPrimary
            }));

            formData.append("contacts", JSON.stringify(processedContacts));
            formData.append("emails", JSON.stringify(emails.filter(email => email.trim())));
            formData.append("interestedProducts", JSON.stringify(interestedProducts));

            // Standard Field Images Upload Loop Array Injection
            images.forEach(image => formData.append("images", image));

            // Structured Explicit Document Streams Checking Injection 
            Object.keys(documents).forEach(key => {
                if (documents[key]) {
                    formData.append(key, documents[key]);
                }
            });

            await API.post("/api/field-visit/create", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            alert("Enterprise Lead logged successfully.");

            // Performance Cleanup Data Form Object Telemetry Streams 
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
            Object.values(docPreviews).forEach(url => { if (url) URL.revokeObjectURL(url); });

            navigate("/field-agent-dashboard/my-visits");
        } catch (error) {
            console.error("Submission Error Pipeline Encountered Exception:", error);
            alert(error.response?.data?.message || "Internal Exception Processing Platform Request Handler Execution Error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 selection:bg-slate-900 selection:text-white">
            {/* STICKY LEAD CAPTURE HEADER */}
            <header className="sticky top-0 z-40 border-b border-slate-200/80 px-4 py-4 sm:px-6 md:px-8 shadow-xs backdrop-blur-md bg-white/95">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <span className="text-[10px] tracking-[0.25em] uppercase text-slate-500 font-bold block mb-0.5">
                            Unified Lead Acquisition Matrix
                        </span>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                            Create Enterprise Business Lead
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 text-xs bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 w-fit">
                        <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Context Mode:</span>
                        <span className="bg-slate-900 text-white font-bold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
                            {user.marketingType || "GENERAL"}
                        </span>
                    </div>
                </div>
            </header>

            {/* FORM WRAPPER GRID RUNTIME CONTAINER */}
            <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 md:px-8 pb-32">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* CONTROL HOUSES CONTAINER (LEFT/CENTER) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* BUSINESS INFORMATION CARD */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
                            <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-100">
                                <Building className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Business Core Blueprint</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Business Name (Title) <span className="text-rose-500">*</span>
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
                                            placeholder="Enter legal trade name, franchise banner, or company label"
                                            className="w-full border border-slate-300 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all text-slate-900"
                                        />
                                    </div>
                                </div>

                                {/* MULTIPLE EMAILS COMPONENT ROW FIELDS */}
                                <div className="pt-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                        <span>Corporate Email Indexes</span>
                                        <button
                                            type="button"
                                            onClick={addEmailRow}
                                            className="inline-flex items-center gap-1 text-[11px] text-slate-900 hover:underline font-bold"
                                        >
                                            <Plus className="w-3 h-3" /> Add Email Array Reference
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
                                                        placeholder="e.g., info@organization.com or billing@firm.org"
                                                        className="w-full border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-slate-900 text-slate-900"
                                                    />
                                                </div>
                                                {emails.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeEmailRow(idx)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors border border-slate-200 rounded-lg hover:border-rose-100 bg-slate-50"
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

                        {/* ASSOCIATED DIRECTORY PERSONNEL MATRIX */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
                            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <User className="w-5 h-5 text-slate-900" />
                                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Personnel Directory</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={addContactRow}
                                    className="inline-flex items-center gap-1 text-xs bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
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
                                                    placeholder="John Doe"
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-900 text-slate-900"
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
                                                    placeholder="Mobile contact coordinates"
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-900 text-slate-900"
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
                                                        className="text-slate-400 hover:text-rose-600 p-1.5 border border-slate-200 rounded-md bg-slate-50 hover:border-rose-100"
                                                        title="Purge Contact Instance"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* CONDITIONAL SUB-DESIGNATION FIELD ROW */}
                                        {contact.designation === "Other" && (
                                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                                                <div className="sm:col-start-5 sm:col-span-5">
                                                    <label className="block text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                                                        Specify Custom Designation <span className="text-rose-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={contact.customDesignation || ""}
                                                        onChange={(e) => updateContactRow(idx, "customDesignation", e.target.value)}
                                                        placeholder="e.g., Lead Technician, Managing Partner"
                                                        className="w-full border border-indigo-200 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm outline-none text-slate-900 bg-indigo-50/20"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* GEOGRAPHIC DOMAIN PARAMETERS CARD */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
                            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                                <MapPin className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Geographic Domain Parameters</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-3">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Street Address Location
                                    </label>
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Physical logistics footprint data"
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">City</label>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="City"
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">District</label>
                                    <input
                                        type="text"
                                        value={district}
                                        onChange={(e) => setDistrict(e.target.value)}
                                        placeholder="District"
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">State</label>
                                    <input
                                        type="text"
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                        placeholder="State territory"
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* REFERRAL NODE CHANNELS */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
                            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                                <Users className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Referral Node Channels</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Referred By Name</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                            <User className="w-4 h-4" />
                                        </span>
                                        <input
                                            type="text"
                                            value={referredByName}
                                            onChange={(e) => setReferredByName(e.target.value)}
                                            placeholder="Affiliate partner name reference"
                                            className="w-full border border-slate-300 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Referred By Phone</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                            <Phone className="w-4 h-4" />
                                        </span>
                                        <input
                                            type="tel"
                                            value={referredByPhone}
                                            onChange={(e) => setReferredByPhone(e.target.value)}
                                            placeholder="Affiliate validation contact details"
                                            className="w-full border border-slate-300 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* GPS MATRIX COORDINATES ENGINE */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <MapPin className="w-5 h-5 text-indigo-600" />
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 tracking-tight">Onsite GPS Matrix Validation</h2>
                                        <p className="text-xs text-slate-400">Lock immutable tracking location verification parameters</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleGetCurrentLocation}
                                    disabled={isLocating}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-60 cursor-pointer"
                                >
                                    {isLocating ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Resolving Satellites...
                                        </>
                                    ) : (
                                        <>
                                            <MapPin className="w-3.5 h-3.5" />
                                            Get Current Location
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Latitude Vector</label>
                                    <input
                                        type="text"
                                        value={latitude}
                                        readOnly
                                        placeholder="Auto telemetry data index"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Longitude Vector</label>
                                    <input
                                        type="text"
                                        value={longitude}
                                        readOnly
                                        placeholder="Auto telemetry data index"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* STRUCTURED DOCUMENT FILE REPOSITORY PIPELINE */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
                            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                                <FileSpreadsheet className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Structured Document Repository</h2>
                            </div>
                            <p className="text-xs text-slate-400 mb-4">Attach verified corporate verification instruments, collateral catalogs, or physical business parameters.</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">GST Identification Certificate</label>
                                    <input
                                        type="file"
                                        accept=".pdf,image/*"
                                        onChange={(e) => handleDocFileChange(e, "gstCertificate")}
                                        className="text-xs w-full block text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                                    />
                                    {documents.gstCertificate && (
                                        <div className="mt-2 flex items-center justify-between text-xs bg-white border border-slate-200 rounded p-1.5 px-2">
                                            <span className="truncate text-slate-600 max-w-[80%]">{documents.gstCertificate.name}</span>
                                            <button type="button" onClick={() => handleRemoveDocFile("gstCertificate")} className="text-rose-500 hover:text-rose-700 font-bold">Clear</button>
                                        </div>
                                    )}
                                </div>

                                <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Provisional Quotation Draft</label>
                                    <input
                                        type="file"
                                        accept=".pdf,image/*"
                                        onChange={(e) => handleDocFileChange(e, "quotationDoc")}
                                        className="text-xs w-full block text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                                    />
                                    {documents.quotationDoc && (
                                        <div className="mt-2 flex items-center justify-between text-xs bg-white border border-slate-200 rounded p-1.5 px-2">
                                            <span className="truncate text-slate-600 max-w-[80%]">{documents.quotationDoc.name}</span>
                                            <button type="button" onClick={() => handleRemoveDocFile("quotationDoc")} className="text-rose-500 hover:text-rose-700 font-bold">Clear</button>
                                        </div>
                                    )}
                                </div>

                                <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50 sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Marketing Brochure / Material Asset</label>
                                    <input
                                        type="file"
                                        accept=".pdf,image/*"
                                        onChange={(e) => handleDocFileChange(e, "brochureDoc")}
                                        className="text-xs w-full block text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                                    />
                                    {documents.brochureDoc && (
                                        <div className="mt-2 flex items-center justify-between text-xs bg-white border border-slate-200 rounded p-1.5 px-2">
                                            <span className="truncate text-slate-600 max-w-[90%]">{documents.brochureDoc.name}</span>
                                            <button type="button" onClick={() => handleRemoveDocFile("brochureDoc")} className="text-rose-500 hover:text-rose-700 font-bold">Clear</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* ACTIONS SIDEBAR (RIGHT) */}
                    <div className="space-y-6">

                        {/* CRM METRIC PARAMETERS STAGE SELECTORS */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
                            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                                <Layers className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">CRM Execution Parameters</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Fixed Domain Mode</label>
                                    <input
                                        type="text"
                                        value={user.marketingType}
                                        readOnly
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-600 font-bold outline-none cursor-not-allowed"
                                    />
                                </div>

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

                                {businessCategory === "Others" && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Specify Business Category <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            value={customCategory}
                                            onChange={(e) => setCustomCategory(e.target.value)}
                                            placeholder="Enter custom business environment type"
                                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-900 bg-white text-slate-900"
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
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Estimated Deal Value (₹ Size)</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-xs font-bold">₹</span>
                                        <input
                                            type="number"
                                            value={leadValue}
                                            onChange={(e) => setLeadValue(e.target.value)}
                                            placeholder="Estimated value projection size"
                                            className="w-full border border-slate-300 rounded-lg pl-7 pr-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900"
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
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Follow Up Date
                                        </label>
                                        <input
                                            type="date"
                                            value={followUpDate}
                                            onChange={(e) => setFollowUpDate(e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-900 bg-white text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Interaction Discussion Summary</label>
                                    <textarea
                                        rows={4}
                                        value={discussionSummary}
                                        onChange={(e) => setDiscussionSummary(e.target.value)}
                                        placeholder="Log real strategic dialogue milestones, system expectations..."
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900 tracking-tight resize-none"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* PRODUCT MATRIX INTERFACE CONSOLE */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
                            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                                <ArrowUpRight className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Catalogs Pipeline Focus</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                {AVAILABLE_PRODUCTS.map((prod) => (
                                    <label key={prod} className="flex items-center gap-2 border border-slate-100 bg-slate-50/50 p-2.5 rounded-lg text-xs font-medium cursor-pointer select-none text-slate-800 hover:bg-slate-50 transition-colors">
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

                        {/* KY IDENTITY CARD PREVIEW STREAM */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
                            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                                <ShieldCheck className="w-5 h-5 text-slate-900" />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Corporate KYC Identity Stream</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Corporate Card Front Face</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleDocFileChange(e, "businessCardFront")}
                                        className="text-xs w-full block text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
                                    />
                                    {docPreviews.businessCardFront && (
                                        <div className="mt-2 relative aspect-[3.5/2] w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                            <img src={docPreviews.businessCardFront} alt="Identity Front Asset Preview" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => handleRemoveDocFile("businessCardFront")} className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-full text-white hover:bg-rose-600"><X className="w-3 h-3" /></button>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Corporate Card Reverse Face</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleDocFileChange(e, "businessCardBack")}
                                        className="text-xs w-full block text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
                                    />
                                    {docPreviews.businessCardBack && (
                                        <div className="mt-2 relative aspect-[3.5/2] w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                            <img src={docPreviews.businessCardBack} alt="Identity Reverse Asset Preview" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => handleRemoveDocFile("businessCardBack")} className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-full text-white hover:bg-rose-600"><X className="w-3 h-3" /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* ONSITE PHYSICAL MEDIA IMAGERY STREAMS */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
                            <div className="flex items-center justify-between mb-2 pb-1">
                                <div className="flex items-center gap-2.5">
                                    <Upload className="w-5 h-5 text-slate-900" />
                                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Onsite Field Photo Context</h2>
                                </div>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                    {images.length}/10
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mb-4">Attach ambient workspace validations, storefront layout references or onsite structural images.</p>

                            <label className={`group flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl transition-all duration-150 cursor-pointer bg-slate-50/50 hover:bg-slate-50 ${images.length >= 10 ? "opacity-40 pointer-events-none border-slate-200" : "border-slate-300 hover:border-slate-900"}`}>
                                <div className="flex flex-col items-center justify-center pt-4 pb-4 text-center px-4">
                                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors mb-1" />
                                    <p className="text-xs text-slate-600 font-medium">Click to execute stream insertion</p>
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    disabled={images.length >= 10}
                                    className="hidden"
                                />
                            </label>

                            {imagePreviews.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100">
                                    {imagePreviews.map((url, idx) => (
                                        <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                            <img src={url} alt={`Photo Matrix Context ${idx + 1}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(idx)}
                                                className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-rose-600 text-white p-1 rounded-full shadow-sm"
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* PIPELINE DISPATCH ENGINE SUBMIT BUTTON */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-slate-950 text-white rounded-xl py-3.5 px-4 font-bold tracking-wide uppercase text-xs sm:text-sm shadow-md hover:bg-slate-900 focus:outline-none transition-all disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Committing Framework Data Payload...
                                    </>
                                ) : (
                                    "Commit Structured Lead"
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default FieldAgentAddVisit;