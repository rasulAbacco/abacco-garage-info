import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

/**
 * Minimal self-contained toast. Render conditionally from parent state:
 *   const [toast, setToast] = useState(null); // { message, type }
 *   {toast && <Toast {...toast} onClose={() => setToast(null)} />}
 */
const Toast = ({ message, type = "success", onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => onClose?.(), 3200);
        return () => clearTimeout(timer);
    }, [onClose]);

    const isSuccess = type === "success";

    return (
        <div className="fixed bottom-6 right-6 z-[60] animate-fadeIn">
            <div
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold ${isSuccess
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                    }`}
            >
                {isSuccess ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{message}</span>
                <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

export default Toast;