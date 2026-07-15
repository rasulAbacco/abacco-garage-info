// client\src\pages\admin\AdminFieldVisitDetailsPopup.jsx
import { useEffect, useState } from "react";
import {
  Loader2,
  X,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  History,
} from "lucide-react";
import API from "../../api/axios";
import FollowUpTimeline from "../field-agent/Followuptimeline";

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  FOLLOW_UP: "bg-indigo-50 text-indigo-700 border-indigo-200",
  INTERESTED: "bg-blue-50 text-blue-700 border-blue-200",
  CUSTOMER: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NOT_INTERESTED: "bg-rose-50 text-rose-700 border-rose-200",
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  } catch {
    return "N/A";
  }
};

/**
 * Admin-side read-only detail view for a single field visit.
 * Props:
 *  - visitId: the FieldVisit id to load (null/undefined => popup hidden)
 *  - onClose: called to dismiss the popup
 */
const AdminFieldVisitDetailsPopup = ({ visitId, onClose }) => {
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visitId) {
      setVisit(null);
      return;
    }

    const fetchVisit = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await API.get(`/api/field-visit/${visitId}`);
        setVisit(response.data);
      } catch (err) {
        console.error("AdminFieldVisitDetailsPopup fetch error:", err);
        setError("Failed to load this visit's details.");
      } finally {
        setLoading(false);
      }
    };

    fetchVisit();
  }, [visitId]);

  if (!visitId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 md:p-10">
      {/* Backdrop dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-white w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] rounded-xl border border-neutral-200 shadow-2xl relative z-10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-200 pr-14 flex flex-col relative shrink-0">
          <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-bold block mb-1">
            — FIELD VISIT DOSSIER —
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 break-words line-clamp-2">
            {visit?.title || (loading ? "Loading..." : "Visit")}
          </h1>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-all active:scale-95 text-sm"
            aria-label="Close popup"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-6 sm:space-y-8">
          {loading && (
            <div className="flex items-center justify-center gap-2 text-neutral-400 py-16">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading visit
              details...
            </div>
          )}

          {error && !loading && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 text-sm rounded-lg">
              {error}
            </div>
          )}

          {visit && !loading && (
            <>
              {/* Core metrics grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 pb-6 border-b border-neutral-100">
                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">
                    Field Agent
                  </span>
                  <p className="text-xs sm:text-sm text-neutral-900 font-bold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    {visit.employee?.name || "Unassigned"}
                  </p>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    {visit.employee?.email}
                  </p>
                </div>

                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">
                    Marketing Focus
                  </span>
                  <p className="text-xs sm:text-sm text-neutral-800 font-medium">
                    {visit.marketingType || "GENERAL"} ·{" "}
                    {visit.businessCategory || "—"}
                  </p>
                </div>

                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">
                    Status
                  </span>
                  <span
                    className={`inline-block text-xs px-3 py-1 rounded-full border ${
                      STATUS_STYLES[visit.status?.toUpperCase()] ||
                      "bg-neutral-100 text-neutral-700 border-neutral-200"
                    }`}
                  >
                    {(visit.status || "PENDING").replace("_", " ")}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">
                    Contact
                  </span>
                  <p className="text-xs sm:text-sm text-neutral-800 font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-neutral-400" />{" "}
                    {visit.contactPerson || "—"}
                  </p>
                  <p className="text-xs text-neutral-600 flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />{" "}
                    {visit.phoneNumber || "—"}
                  </p>
                  {visit.email && (
                    <p className="text-xs text-neutral-600 flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5 text-neutral-400" />{" "}
                      {visit.email}
                    </p>
                  )}
                </div>

                <div className="break-words">
                  <span className="block text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">
                    Location
                  </span>
                  <p className="text-xs sm:text-sm text-neutral-800 font-medium leading-relaxed flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                    {[visit.address, visit.city, visit.district, visit.state]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                </div>

                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">
                    Recorded
                  </span>
                  <p className="text-xs sm:text-sm text-neutral-800 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />{" "}
                    {formatDate(visit.createdAt)}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Next follow-up:{" "}
                    {formatDate(visit.nextFollowUpDate || visit.followUpDate)}
                  </p>
                </div>
              </div>

              {/* Discussion summary / visit notes */}
              <div>
                <span className="block text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-2">
                  Visit Notes
                </span>
                <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-3.5 sm:p-4 text-xs sm:text-sm text-neutral-700 leading-relaxed break-words">
                  {visit.notes ||
                    "No discussion notes recorded for this visit."}
                </div>
              </div>

              {/* Field photos */}
              <div>
                <span className="block text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-3">
                  Onsite Photos ({visit.images?.length || 0})
                </span>
                {visit.images && visit.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {visit.images.map((img) => (
                      <a
                        key={img.id}
                        href={img.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="relative group aspect-video rounded-md border border-neutral-200 bg-neutral-50 overflow-hidden shadow-xs block"
                      >
                        <img
                          src={img.imageUrl}
                          alt="Onsite snapshot"
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs font-mono text-neutral-400 border border-dashed border-neutral-200 p-6 rounded-lg text-center">
                    No onsite photos captured for this visit.
                  </div>
                )}
              </div>

              {/* Follow-up timeline */}
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3">
                  <History className="w-3.5 h-3.5" /> Follow-up Timeline
                </div>
                <FollowUpTimeline followUps={visit.followUps || []} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-100 hidden sm:flex items-center justify-between text-[10px] font-mono text-neutral-400 shrink-0">
          <span>Visit ID: {visit?.id || "—"}</span>
          <span>Read-only admin view</span>
        </div>
      </div>
    </div>
  );
};

export default AdminFieldVisitDetailsPopup;
