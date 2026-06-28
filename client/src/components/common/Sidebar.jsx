import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Sidebar = ({ role, links = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const roleTitle =
    role === "FIELD_AGENT"
      ? "Field Agent Console"
      : role === "ADMIN"
        ? "Admin Console"
        : "Employee Console";

  return (
    <>
      {/* MOBILE TOP NAVBAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 w-full bg-white text-[#1A1A1A] px-4 h-16 flex items-center justify-between border-b border-[#D9D9D9] z-[60]">
        {/* Hamburger LEFT */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors focus:outline-none shrink-0"
          aria-label="Toggle Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Logo RIGHT */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-neutral-900 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-white tracking-tighter">V</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 whitespace-nowrap">
            {roleTitle}
          </span>
        </div>
      </div>

      {/* OVERLAY */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity duration-300 ease-in-out ${isOpen ? "opacity-100 z-[55] pointer-events-auto" : "opacity-0 -z-10 pointer-events-none"
          }`}
      />

      {/* SIDEBAR DRAWER */}
      <div className={`
        fixed inset-y-0 left-0 w-72 bg-white text-[#1A1A1A] p-6 flex flex-col justify-between
        border-r border-[#D9D9D9] font-sans antialiased overflow-y-auto
        transform transition-transform duration-300 ease-in-out z-[60]
        lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0 lg:w-64 lg:z-20 shrink-0
        ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}>

        <div>
          {/* Header */}
          <div className="mb-8 pb-5 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-bold block mb-1">
                — WORKSTATION —
              </span>
              <h2 className="text-lg font-normal tracking-tight text-neutral-900">
                {roleTitle}
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-lg active:bg-neutral-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav — purely driven by props */}
          <nav>
            <ul className="space-y-1">
              {links.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`block w-full px-5 py-3 text-xs uppercase tracking-widest transition-all duration-150 relative ${isActive(item.path)
                      ? "bg-neutral-900 text-white font-medium"
                      : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                      }`}
                  >
                    {isActive(item.path) && (
                      <span className="absolute left-0 top-0 bottom-0 w-[4px] bg-neutral-900" />
                    )}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Logout */}
        <div className="pt-5 border-t border-neutral-100">
          <button
            onClick={handleLogout}
            className="w-full bg-transparent border border-neutral-200 text-neutral-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50/30 py-3 text-xs uppercase tracking-widest font-medium transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            Exit Console
          </button>
        </div>
      </div>

      {/* MOBILE SPACER */}
      <div className="h-16 lg:hidden w-full shrink-0" />
    </>
  );
};

export default Sidebar;