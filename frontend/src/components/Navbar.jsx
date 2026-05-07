import { NavLink, useLocation } from "react-router-dom";
import { Home, Upload, Search, Sparkles } from "lucide-react";
import { useState } from "react";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/search", label: "Search", icon: Search },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="glass-panel flex h-16 items-center justify-between px-5 mt-4 rounded-2xl">
          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-neon/20 to-glow/20 border border-neon/30">
              <Sparkles className="h-4 w-4 text-neon" />
              <div className="absolute inset-0 rounded-xl bg-neon/10 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-white/90 hidden sm:block">
              Image RAG
            </span>
          </NavLink>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200
                    ${active
                      ? "bg-white/[0.08] text-neon shadow-glow-sm border border-neon/20"
                      : "text-haze/70 hover:text-white hover:bg-white/[0.04]"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              );
            })}
          </div>

          {/* Status dot */}
          <div className="hidden md:flex items-center gap-2">
            <div className="badge">
              <span className="h-1.5 w-1.5 rounded-full bg-glow animate-glowPulse" />
              CLIP Active
            </div>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-5 bg-white/70 transition-transform ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-0.5 w-5 bg-white/70 transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-white/70 transition-transform ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden mt-2 glass-panel p-3 rounded-2xl animate-fadeIn">
            {links.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all
                    ${active ? "bg-white/[0.08] text-neon" : "text-haze/70 hover:text-white"}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
