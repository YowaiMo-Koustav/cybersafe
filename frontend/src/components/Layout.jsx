import { NavLink } from "react-router-dom";
import { Shield, Radar, Puzzle } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Scanner", icon: Radar, testid: "nav-scanner" },
  { to: "/extension", label: "Extension", icon: Puzzle, testid: "nav-extension" },
];

export const Layout = ({ children }) => {

  return (
    <div className="min-h-screen flex bg-slate-950 text-white">
      <aside className="hidden md:flex flex-col w-60 border-r border-slate-800 bg-slate-950 sticky top-0 h-screen">
        <div className="px-6 py-6 border-b border-slate-800 flex items-center gap-2">
          <Shield className="h-5 w-5 text-cyan-400" />
          <span className="font-display font-bold tracking-tight text-base">
            CyberShield
          </span>
        </div>
        <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={n.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm rounded-sm font-mono-custom transition-colors ${
                  isActive
                    ? "bg-slate-900 text-cyan-400 border-l-2 border-cyan-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`
              }
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">Operator</div>
          <div className="text-sm font-mono-custom text-white truncate">Guest</div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-cyan-400" />
          <span className="font-display font-bold text-sm">CyberShield</span>
        </div>
        <div className="flex items-center gap-2">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `p-2 rounded-sm ${isActive ? "text-cyan-400" : "text-slate-400"}`
              }
            >
              <n.icon className="h-4 w-4" />
            </NavLink>
          ))}
        </div>
      </div>

      <main className="flex-1 pt-16 md:pt-0">{children}</main>
    </div>
  );
};
