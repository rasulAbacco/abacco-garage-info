import { useState } from "react";
import { X, Loader2, CalendarClock } from "lucide-react";
import API from "../../api/axios";

// Shared dropdown option lists — kept in one place so the modal, the visit
// cards, and the timeline all agree on the same vocabulary.
export const FOLLOW_UP_STATUSES = ["Pending", "Follow Up", "Interested", "Customer", "Not Interested"];
export const FOLLOW_UP_PRIORITIES = ["Low", "Medium", "High"];

/**
 * Add Follow-up Modal
 *
 * Props:
 *  - visitId:   the FieldVisit id this follow-up belongs to (required)
 *  - onClose:   called to dismiss the modal without saving
 *  - onSaved:   called with the updated `followUps` array (newest first)
 *               once the entry has been persisted — lets the parent
 *               refresh the visit card in place without a page reload.
 *  - onToast:   optional (message, type) callback so the parent can render
 *               a success/error toast in its own layout.
 */
const FollowUpModal = ({ visitId, onClose, onSaved, onToast }) => {
  const [remark, setRemark] = useState("");
  const [status, setStatus] = useState("Pending");
  const [priority, setPriority] = useState("Medium");
  const [followUpDate, setFollowUpDate] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const next = {};
    if (!remark.trim()) next.remark = "Remark is required.";
    if (!status) next.status = "Status is required.";
    if (!followUpDate) next.followUpDate = "Next follow-up date is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const user = JSON.parse(localStorage.getItem("user")) || {};
      const response = await API.post(`/api/field-visit/${visitId}/follow-up`, {
        remark: remark.trim(),
        status,
        priority,
        followUpDate,
        createdBy: user.id,
      });

      const followUps = response.data?.followUps || [];
      onSaved?.(followUps, response.data?.followUp);
      onToast?.("Follow-up added successfully.", "success");
      onClose?.();
    } catch (err) {
      console.error("FollowUpModal save error:", err);
      onToast?.(err.response?.data?.message || "Failed to save follow-up.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <CalendarClock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Add Follow-up</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Remark */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Remark <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
            placeholder="What happened during this follow-up?"
            className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 transition-all bg-slate-50/50 resize-none ${errors.remark ? "border-rose-300" : "border-slate-300"
              }`}
          />
          {errors.remark && <p className="text-[10px] text-rose-600 mt-1">{errors.remark}</p>}
        </div>

        {/* Status + Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-slate-900 text-slate-900 bg-slate-50/50 cursor-pointer ${errors.status ? "border-rose-300" : "border-slate-300"
                }`}
            >
              {FOLLOW_UP_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.status && <p className="text-[10px] text-rose-600 mt-1">{errors.status}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-slate-900 text-slate-900 bg-slate-50/50 cursor-pointer"
            >
              {FOLLOW_UP_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Next Follow-up Date */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Next Follow-up Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-slate-900 text-slate-900 bg-slate-50/50 ${errors.followUpDate ? "border-rose-300" : "border-slate-300"
              }`}
          />
          {errors.followUpDate && <p className="text-[10px] text-rose-600 mt-1">{errors.followUpDate}</p>}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-slate-950 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FollowUpModal;