import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Layout } from "../components/Layout";
import { RiskGauge } from "../components/RiskGauge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { AlertTriangle, CheckCircle2, ShieldAlert, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";

export default function Dashboard() {
  const [form, setForm] = useState({ url: "", platform: "instagram" });
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);

  const loadStats = async () => {
    try {
      const r = await api.get("/scans/stats");
      setStats(r.data);
    } catch {}
  };

  useEffect(() => {
    loadStats();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^https?:\/\//i.test(form.url)) {
      toast.error("Enter a full URL starting with https://");
      return;
    }
    setScanning(true);
    setResult(null);
    try {
      const r = await api.post("/detect", form);
      setResult(r.data);
      toast.success(`Analysis complete — ${r.data.classification}`);
      loadStats();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Analysis failed");
    } finally {
      setScanning(false);
    }
  };

  const cls = result?.classification;
  const clsColor =
    cls === "High Risk"
      ? "text-rose-400 border-rose-500/40 bg-rose-500/10"
      : cls === "Medium Risk"
      ? "text-amber-400 border-amber-400/40 bg-amber-400/10"
      : "text-emerald-400 border-emerald-400/40 bg-emerald-400/10";

  const statsCards = [
    { label: "Total scans", value: stats?.total ?? 0, color: "text-cyan-400", testid: "stat-total" },
    { label: "Safe", value: stats?.safe ?? 0, color: "text-emerald-400", testid: "stat-safe" },
    { label: "Medium", value: stats?.medium ?? 0, color: "text-amber-400", testid: "stat-medium" },
    { label: "High risk", value: stats?.high ?? 0, color: "text-rose-400", testid: "stat-high" },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8" data-testid="dashboard-page">
        {/* Header */}
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-400 mb-2 flex items-center gap-2">
            <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 pulse-dot" />
            THREAT SCANNER · LIVE
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Profile risk analysis
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Paste a profile link — our backend fetches the public page and returns an AI-driven 0–100 risk score.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {statsCards.map((s) => (
            <div
              key={s.label}
              className="bg-slate-900 border border-slate-800 p-4 rounded-sm"
              data-testid={s.testid}
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{s.label}</div>
              <div className={`font-display text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          {/* Form */}
          <form
            onSubmit={submit}
            className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-sm space-y-5 h-fit"
            data-testid="scan-form"
          >
            <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 border-b border-slate-800 pb-3">
              Profile target
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-400 uppercase tracking-widest">Platform</Label>
              <Select
                value={form.platform}
                onValueChange={(v) => setForm({ ...form, platform: v })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-800 font-mono-custom rounded-sm" data-testid="scan-platform-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="instagram" className="font-mono-custom">Instagram</SelectItem>
                  <SelectItem value="twitter" className="font-mono-custom">Twitter / X</SelectItem>
                  <SelectItem value="facebook" className="font-mono-custom">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-400 uppercase tracking-widest">Profile URL</Label>
              <div className="relative">
                <LinkIcon className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  required
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="pl-9 bg-slate-950 border-slate-800 focus:border-cyan-500 font-mono-custom rounded-sm"
                  placeholder="https://instagram.com/username"
                  data-testid="scan-url-input"
                />
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                Public profile link · content fetched server-side
              </p>
            </div>

            <Button
              type="submit"
              disabled={scanning}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-sm"
              data-testid="scan-submit-btn"
            >
              {scanning ? "Analyzing…" : "Run threat scan"}
            </Button>
          </form>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {!result ? (
              <div className="bg-slate-900 border border-dashed border-slate-800 p-10 rounded-sm text-center" data-testid="no-result-placeholder">
                <ShieldAlert className="h-8 w-8 text-slate-600 mx-auto mb-4" />
                <div className="text-sm text-slate-400">
                  Paste a profile URL and run the scan to see a full risk report here.
                </div>
              </div>
            ) : (
              <>
                {result.alert && (
                  <Alert
                    className={`border ${clsColor} rounded-sm`}
                    data-testid="result-alert"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="font-mono-custom text-sm">
                      {result.alert}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-sm p-6">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
                      Risk score
                    </div>
                    <RiskGauge score={result.risk_score} classification={result.classification} />
                    <div className="mt-4 text-xs text-slate-500 font-mono-custom">
                      Target: <span className="text-white">@{result.username}</span> · {result.platform}
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-sm p-6">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-4">
                      Red flags
                    </div>
                    {result.factors.length === 0 ? (
                      <div className="flex items-center gap-2 text-emerald-400 text-sm mt-8">
                        <CheckCircle2 className="h-4 w-4" />
                        No significant red flags detected.
                      </div>
                    ) : (
                      <div className="h-56" data-testid="factors-chart">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={result.factors.map((f) => ({ name: f.label, score: f.score }))}
                            layout="vertical"
                            margin={{ left: 10, right: 20 }}
                          >
                            <XAxis type="number" stroke="#475569" fontSize={10} />
                            <YAxis
                              dataKey="name"
                              type="category"
                              stroke="#94a3b8"
                              fontSize={10}
                              width={130}
                            />
                            <Tooltip
                              contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 12 }}
                              cursor={{ fill: "rgba(6,182,212,0.08)" }}
                            />
                            <Bar dataKey="score" radius={0}>
                              {result.factors.map((f, i) => (
                                <Cell
                                  key={i}
                                  fill={f.score >= 20 ? "#f43f5e" : f.score >= 10 ? "#fbbf24" : "#06b6d4"}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-sm p-6">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 mb-3">
                    AI analysis
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed" data-testid="ai-insight-text">
                    {result.ai_insight}
                  </p>
                </div>

                {(result.toxic_flags.length > 0 || (result.contact_numbers?.length ?? 0) > 0) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-sm p-6">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-rose-400 mb-3">
                        Toxic / threatening terms
                      </div>
                      {result.toxic_flags.length ? (
                        <div className="flex flex-wrap gap-2" data-testid="toxic-flags">
                          {result.toxic_flags.map((t) => (
                            <Badge
                              key={t}
                              className="bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-sm font-mono-custom"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">None detected.</div>
                      )}
                    </div>

                    {(result.contact_numbers?.length ?? 0) > 0 && (
                      <div className="bg-slate-900 border border-slate-800 rounded-sm p-6 md:col-span-2">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 mb-3 flex items-center gap-2">
                          Contact numbers detected
                          <span className="text-slate-500 text-[10px] normal-case">· phones / WhatsApp found in bio & posts</span>
                        </div>
                        <div className="flex flex-wrap gap-2" data-testid="contact-numbers">
                          {result.contact_numbers.map((n, i) => (
                            <Badge
                              key={`${n}-${i}`}
                              className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-sm font-mono-custom text-xs"
                            >
                              {n}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-3 uppercase tracking-wider">
                          Profiles exposing personal contact numbers are a common stalker / scam signal. Verify before engaging.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
