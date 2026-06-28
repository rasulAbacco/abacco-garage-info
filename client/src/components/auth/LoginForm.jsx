import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../services/authService";

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    try {
      const data = await loginUser(formData);

      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "ADMIN") {
        navigate("/admin-dashboard");
      } else if (data.user.role === "EMPLOYEE") {
        navigate("/employee-dashboard");
      } else if (data.user.role === "FIELD_AGENT") {
        navigate("/field-agent-dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Invalid workstation credentials.");
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] flex items-center justify-center p-4 font-serif antialiased relative overflow-hidden">

      {/* 1. Structural Blueprint Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.25] pointer-events-none" />

      {/* 2. Soft Monochrome Depth Vials */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-slate-300/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-slate-200/30 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Authentication Terminal Card */}
      <div className="w-full max-w-sm bg-white p-10 rounded-none border border-[#D9D9D9] shadow-[0_24px_60px_rgba(15,23,42,0.02)] relative z-10">

        {/* Terminal Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-normal tracking-tight text-neutral-900">System Sign In</h2>
        </div>

        {/* Clean Inline Validation Banner */}
        {errorMsg && (
          <div className="mb-6 p-3 bg-neutral-50 border-l-2 border-neutral-900 text-neutral-800 text-xs font-sans">
            {errorMsg}
          </div>
        )}

        {/* Form Interactive Controls */}
        <form onSubmit={handleSubmit} className="space-y-6 font-sans">
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-neutral-900 mb-2 font-bold">
              Email Key
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              required
              placeholder="operator@velocity.com"
              onChange={handleChange}
              className="w-full bg-transparent border-b border-neutral-200 py-2.5 text-sm outline-none transition-colors focus:border-neutral-900 placeholder-neutral-300"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-neutral-900 mb-2 font-bold">
              Passcode
            </label>
            <div className="relative flex items-center border-b border-neutral-200 focus-within:border-neutral-900 transition-colors">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                required
                placeholder="••••••••••••"
                onChange={handleChange}
                className="w-full bg-transparent py-2.5 pr-10 text-sm outline-none placeholder-neutral-300"
              />

              {/* Minimalist View Toggle Action Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors rounded outline-none focus:text-neutral-900"
                aria-label={showPassword ? "Hide passcode" : "Show passcode"}
              >
                {showPassword ? (
                  /* Eye Off SVG Icon */
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.822 7.822 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  /* Eye On SVG Icon */
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Action Trigger Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1A1A1A] text-white py-3.5 tracking-widest text-xs uppercase font-medium hover:bg-black transition-colors duration-300 disabled:opacity-40 mt-8 shadow-sm"
          >
            {isLoading ? "Verifying..." : "Access Console"}
          </button>
        </form>

      </div>
    </div>
  );
};

export default LoginForm;