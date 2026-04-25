import { Link } from "react-router-dom";
import { Shield, Radar, Brain, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 backdrop-blur-xl bg-slate-950/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-400" />
            <span className="font-display font-bold tracking-tight">CyberShield</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-sm font-bold" data-testid="go-dashboard-btn">
                Open dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/60 to-slate-950" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32 stagger">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-sm mb-6">
            <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 pulse-dot" />
            LIVE THREAT DETECTION
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 max-w-3xl">
            Detect fake profiles and cyberstalkers before they reach you.
          </h1>
          <p className="text-slate-400 max-w-xl text-base mb-10">
            Hybrid rule-based + AI analysis scores any social profile in seconds — flagging
            bot patterns, toxic messages, and stalker behavior with a 0–100 risk rating.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/dashboard">
              <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-sm font-bold" data-testid="hero-cta-btn">
                Scan a profile
              </Button>
            </Link>
            <Link to="/extension">
              <Button size="lg" variant="outline" className="border-slate-700 bg-transparent hover:bg-slate-900 rounded-sm" data-testid="hero-extension-btn">
                Browser extension preview
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-4">
        {[
          {
            icon: Radar,
            title: "Signal analysis",
            body: "Account age, follower ratios, posting frequency — 12+ behavioral heuristics instantly weighted.",
          },
          {
            icon: Brain,
            title: "Deep content analysis",
            body: "Automated content extraction and NLP inspect profile text for toxic language, coercion, and stalker phrasing.",
          },
          {
            icon: AlertTriangle,
            title: "Real-time alerts",
            body: "Safe / Medium / High classification with actionable recommendations and scan history.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="bg-slate-900 border border-slate-800 p-6 rounded-sm hover:border-cyan-500/50 transition-colors"
          >
            <f.icon className="h-5 w-5 text-cyan-400 mb-4" />
            <h3 className="font-display font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-slate-400">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        CyberShield — prototype. Not a substitute for official platform safety tools.
      </footer>
    </div>
  );
}
