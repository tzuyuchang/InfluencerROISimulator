import { useState, useMemo } from "react";

// ─── Formatters ────────────────────────────────────────────────────────────────
const fmtNum  = (n) => Math.round(n ?? 0).toLocaleString("en-US");
const fmtEUR  = (n) => `€${Math.round(n ?? 0).toLocaleString("en-US")}`;
const fmtTWD  = (n) => `NT$${Math.round(n ?? 0).toLocaleString("en-US")}`;

// ─── Funnel Visualization (custom SVG trapezoids) ──────────────────────────────
function FunnelViz({ data }) {
  const maxVal = data[0]?.value || 1;
  const W = 320, itemH = 54, gap = 6;
  const minW = 48, totalH = data.length * itemH + (data.length - 1) * gap;

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <svg
        viewBox={`0 0 ${W} ${totalH}`}
        style={{ width: "100%", maxWidth: "340px", overflow: "visible" }}
      >
        {data.map((item, i) => {
          const ratio  = maxVal > 0 ? item.value / maxVal : 0;
          const prevR  = i === 0 ? 1 : (data[i - 1].value / maxVal);
          const topW   = prevR  * (W - minW) + minW;
          const botW   = ratio  * (W - minW) + minW;
          const y      = i * (itemH + gap);
          const topX   = (W - topW) / 2;
          const botX   = (W - botW) / 2;
          const pts    = `${topX},${y} ${topX + topW},${y} ${botX + botW},${y + itemH} ${botX},${y + itemH}`;
          const convR  = i > 0 ? ((item.value / (data[i - 1].value || 1)) * 100).toFixed(1) : null;

          return (
            <g key={item.name}>
              <polygon points={pts} fill={item.fill} opacity="0.9" />
              {/* label */}
              <text x={W / 2} y={y + itemH / 2 - 8} textAnchor="middle"
                fill="rgba(255,255,255,0.75)" fontSize="10" fontWeight="600">
                {item.label}
              </text>
              {/* value */}
              <text x={W / 2} y={y + itemH / 2 + 10} textAnchor="middle"
                fill="white" fontSize="15" fontWeight="800">
                {fmtNum(item.value)}
              </text>
              {/* conversion badge */}
              {convR && (
                <text x={W - 2} y={y - gap / 2 + 1} textAnchor="end"
                  fill="rgba(255,255,255,0.45)" fontSize="9">
                  ↓ {convR}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Slider + Number Input Control ────────────────────────────────────────────
function SliderInput({ label, hint, value, onChange, min, max, step = 1, unit = "" }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", lineHeight: 1.3 }}>
          {label}
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <input
            type="number"
            value={value}
            min={min} max={max} step={step}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
            }}
            style={{
              width: "72px", textAlign: "right", background: "#0f172a",
              border: "1px solid #334155", borderRadius: "6px",
              padding: "3px 6px", fontSize: "12px", fontFamily: "monospace",
              color: "white", outline: "none",
            }}
          />
          {unit && (
            <span style={{ fontSize: "11px", color: "#475569", minWidth: "28px" }}>{unit}</span>
          )}
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: "100%", height: "4px", cursor: "pointer",
          accentColor: "#3b82f6", borderRadius: "4px",
        }}
      />
      {hint && (
        <p style={{ fontSize: "10px", color: "#475569", margin: "3px 0 0" }}>{hint}</p>
      )}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ icon, title, big, sub, bg, border, accent, warn }) {
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`,
      borderRadius: "12px", padding: "16px 18px",
    }}>
      <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.1em", color: accent, marginBottom: "8px",
        display: "flex", alignItems: "center", gap: "6px" }}>
        {icon} {title}
        {warn && <span style={{ marginLeft: "auto", color: "#ef4444", fontSize: "13px" }}>⚠️ 虧損警告</span>}
      </div>
      <div style={{ fontSize: "32px", fontWeight: 900, lineHeight: 1,
        color: warn ? "#f87171" : "white", letterSpacing: "-0.02em" }}>
        {big}
      </div>
      <div style={{ fontSize: "11px", color: accent, marginTop: "6px", opacity: 0.85 }}>{sub}</div>
    </div>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.12em", color: "#475569",
      margin: "20px 0 10px", borderTop: "1px solid #1e293b", paddingTop: "16px",
    }}>
      {children}
    </p>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function InfluencerROISimulator() {
  const [reach,      setReach]      = useState(150000);
  const [ctr,        setCtr]        = useState(1.5);
  const [leadRate,   setLeadRate]   = useState(5);
  const [closeRate,  setCloseRate]  = useState(15);
  const [avgFee,     setAvgFee]     = useState(1500);
  const [commission, setCommission] = useState(10);
  const margin = 35;
  const [exRate,     setExRate]     = useState(34.5);

  // ── Calculations ──────────────────────────────────────────────────────────
  const m = useMemo(() => {
    const clicks         = Math.round(reach       * ctr        / 100);
    const leads          = Math.round(clicks      * leadRate   / 100);
    const sales          = Math.round(leads       * closeRate  / 100);
    const revenueEUR     = sales * avgFee;
    const influencerEUR  = revenueEUR * commission / 100;
    const influencerTWD  = influencerEUR * exRate;
    const agencyGrossEUR = revenueEUR * margin     / 100;
    const agencyNetEUR   = agencyGrossEUR - influencerEUR;
    const agencyNetTWD   = agencyNetEUR * exRate;
    return { clicks, leads, sales, revenueEUR, influencerEUR, influencerTWD,
             agencyGrossEUR, agencyNetEUR, agencyNetTWD };
  }, [reach, ctr, leadRate, closeRate, avgFee, commission, margin, exRate]);

  const isLoss    = m.agencyNetEUR < 0;
  const schoolPct = 100 - margin;
  const netPct    = margin - commission;   // agency net per deal %

  const funnelData = [
    { label: "觸及 Reach",   value: reach,    fill: "#1d4ed8" },
    { label: "點擊 Clicks",  value: m.clicks, fill: "#4f46e5" },
    { label: "名單 Leads",   value: m.leads,  fill: "#7c3aed" },
    { label: "成交 Sales",   value: m.sales,  fill: "#059669" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#0f172a",
      color: "white", fontFamily: "'Inter', 'system-ui', sans-serif",
      display: "flex", flexDirection: "column",
    }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(90deg, #1e293b 0%, #0f172a 100%)",
        borderBottom: "1px solid #1e3a5f",
        padding: "14px 28px",
        display: "flex", alignItems: "center", gap: "14px",
        flexShrink: 0,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
        }}>📊</div>
        <div>
          <h1 style={{ margin: 0, fontSize: "17px", fontWeight: 800, letterSpacing: "-0.02em" }}>
            網紅合作 ROI 預估模型
          </h1>
          <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
            Influencer ROI &amp; Funnel Simulator · Real-time Reactive Calculator
          </p>
        </div>
        {/* Live badge */}
        <div style={{
          marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px",
          background: "#052e16", border: "1px solid #15803d",
          borderRadius: "20px", padding: "4px 12px",
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", background: "#4ade80",
            boxShadow: "0 0 6px #4ade80",
          }} />
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#4ade80" }}>LIVE</span>
        </div>
      </div>

      {/* ── BODY ───────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT PANEL — Controls */}
        <div style={{
          width: "380px", minWidth: "340px",
          background: "#1e293b",
          borderRight: "1px solid #1e3a5f",
          overflowY: "auto",
          padding: "20px 20px 32px",
          flexShrink: 0,
        }}>
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.12em", color: "#3b82f6", marginBottom: "16px", margin: "0 0 16px" }}>
            ⚙️ 輸入參數 Input Controls
          </p>

          <SliderInput
            label="總觸及人數 Estimated Reach"
            hint="網紅貼文預估觸及的總人數"
            value={reach} onChange={setReach}
            min={10000} max={500000} step={5000}
          />
          <SliderInput
            label="點擊率 CTR %"
            hint="從觸及到點擊連結的比例"
            value={ctr} onChange={setCtr}
            min={0.1} max={10} step={0.1} unit="%"
          />
          <SliderInput
            label="名單轉換率 Lead Conversion %"
            hint="進入頁面後留下資料或報名的比例"
            value={leadRate} onChange={setLeadRate}
            min={1} max={20} step={0.5} unit="%"
          />
          <SliderInput
            label="最終成交率 Close Rate %"
            hint="代辦顧問最終收單的機率"
            value={closeRate} onChange={setCloseRate}
            min={5} max={50} step={1} unit="%"
          />
          <SliderInput
            label="平均客單價 Avg Course Fee"
            hint="8週短期語校課程費用"
            value={avgFee} onChange={setAvgFee}
            min={500} max={5000} step={50} unit="EUR"
          />

          <SectionLabel>分潤與毛利設定</SectionLabel>
          <SliderInput
            label="網紅分潤比例 Influencer Commission %"
            hint="以「總學費」為計算基礎"
            value={commission} onChange={setCommission}
            min={1} max={30} step={0.5} unit="%"
          />
          <SliderInput
            label="代辦原始毛利率 Agency Base Margin %"
            hint="學校給代辦的退佣比例"
            value={margin} onChange={setMargin}
            min={10} max={50} step={1} unit="%"
          />

          <SectionLabel>匯率設定</SectionLabel>
          <SliderInput
            label="EUR → TWD 匯率"
            value={exRate} onChange={setExRate}
            min={30} max={42} step={0.1} unit="TWD"
          />

          {/* Quick summary strip */}
          <div style={{
            marginTop: "20px",
            background: "#0f172a", border: "1px solid #1e3a5f",
            borderRadius: "8px", padding: "12px",
          }}>
            <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", color: "#475569", margin: "0 0 8px" }}>漏斗摘要</p>
            {[
              { label: "觸及", val: fmtNum(reach),    color: "#3b82f6" },
              { label: "點擊", val: fmtNum(m.clicks), color: "#6366f1" },
              { label: "名單", val: fmtNum(m.leads),  color: "#8b5cf6" },
              { label: "成交", val: fmtNum(m.sales),  color: "#10b981" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between",
                padding: "3px 0", borderBottom: "1px solid #1e293b",
              }}>
                <span style={{ fontSize: "11px", color: "#64748b" }}>{label}</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color, fontFamily: "monospace" }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL — Dashboard */}
        <div style={{
          flex: 1, overflowY: "auto",
          background: "#0f172a",
          padding: "20px",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 1fr) minmax(280px, 1.1fr)",
            gap: "16px",
          }}>

            {/* ── 1. FUNNEL CHART ────────────────────────────────────────── */}
            <div style={{
              background: "#1e293b", border: "1px solid #1e3a5f",
              borderRadius: "14px", padding: "20px",
            }}>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.12em", color: "#475569", margin: "0 0 16px" }}>
                📈 行銷漏斗 Marketing Funnel
              </p>
              <FunnelViz data={funnelData} />
              {/* Conversion rate pills */}
              <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                {[
                  { label: "CTR",  val: `${ctr}%`,       color: "#3b82f6", bg: "#1e3a5f" },
                  { label: "轉換率", val: `${leadRate}%`,  color: "#8b5cf6", bg: "#2e1065" },
                  { label: "成交率", val: `${closeRate}%`, color: "#10b981", bg: "#052e16" },
                ].map(p => (
                  <div key={p.label} style={{
                    flex: 1, textAlign: "center",
                    background: p.bg, borderRadius: "8px", padding: "7px 4px",
                  }}>
                    <div style={{ fontSize: "9px", color: "#64748b", marginBottom: "2px" }}>{p.label}</div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: p.color }}>{p.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 2. KPI CARDS ───────────────────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Sales */}
              <KPICard
                icon="🎯"
                title="預估成交人數 Estimated Sales"
                big={fmtNum(m.sales) + " 人"}
                sub={`總營收 ${fmtEUR(m.revenueEUR)} | 每人 ${fmtEUR(avgFee)}`}
                bg="linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)"
                border="#1d4ed8"
                accent="#93c5fd"
              />
              {/* Influencer payout — hero card */}
              <div style={{
                background: "linear-gradient(135deg, #431407 0%, #1c1917 100%)",
                border: "1px solid #9a3412",
                borderRadius: "12px", padding: "16px 18px",
              }}>
                <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.1em", color: "#fb923c", marginBottom: "6px",
                  display: "flex", alignItems: "center", gap: "6px" }}>
                  🌟 網紅預估分潤收益 (for Influencer)
                </div>
                <div style={{ fontSize: "36px", fontWeight: 900, lineHeight: 1,
                  letterSpacing: "-0.03em", color: "#fb923c" }}>
                  {fmtTWD(m.influencerTWD)}
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <div style={{ background: "rgba(251,146,60,0.12)", borderRadius: "6px", padding: "4px 10px" }}>
                    <span style={{ fontSize: "11px", color: "#fdba74" }}>≈ {fmtEUR(m.influencerEUR)}</span>
                  </div>
                  <div style={{ background: "rgba(251,146,60,0.12)", borderRadius: "6px", padding: "4px 10px" }}>
                    <span style={{ fontSize: "11px", color: "#fdba74" }}>分潤 {commission}% × {fmtNum(m.sales)}單</span>
                  </div>
                </div>
              </div>
              {/* Agency net */}
              <KPICard
                icon="🏢"
                title="代辦預估淨收益 Agency Net Profit"
                big={fmtTWD(m.agencyNetTWD)}
                sub={`${fmtEUR(m.agencyNetEUR)} | 毛利 ${margin}% − 分潤 ${commission}%`}
                bg={isLoss
                  ? "linear-gradient(135deg, #450a0a 0%, #1c1917 100%)"
                  : "linear-gradient(135deg, #052e16 0%, #1c1917 100%)"}
                border={isLoss ? "#b91c1c" : "#15803d"}
                accent={isLoss ? "#fca5a5" : "#86efac"}
                warn={isLoss}
              />
            </div>

            {/* ── 3. REVENUE DISTRIBUTION ─────────────────────────────── (full width) */}
            <div style={{
              gridColumn: "1 / -1",
              background: "#1e293b", border: "1px solid #1e3a5f",
              borderRadius: "14px", padding: "20px",
            }}>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.12em", color: "#475569", margin: "0 0 16px" }}>
                💰 單筆收益分配 Per-Deal Breakdown · {fmtEUR(avgFee)} / 每單
              </p>

              {/* Stacked bar */}
              <div style={{
                display: "flex", height: "48px",
                borderRadius: "10px", overflow: "hidden",
                marginBottom: "10px", gap: "2px",
              }}>
                {/* School */}
                <div style={{
                  width: `${schoolPct}%`,
                  background: "linear-gradient(90deg, #334155, #475569)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 700, color: "white",
                  transition: "width 0.35s ease",
                  flexShrink: 0,
                }}>
                  🏫 學校 {schoolPct}%
                </div>
                {/* Agency net */}
                {netPct > 0 && (
                  <div style={{
                    width: `${netPct}%`,
                    background: isLoss
                      ? "linear-gradient(90deg, #b91c1c, #dc2626)"
                      : "linear-gradient(90deg, #15803d, #16a34a)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: 700, color: "white",
                    transition: "width 0.35s ease",
                    flexShrink: 0,
                  }}>
                    {netPct > 3 ? `🏢 代辦淨 ${netPct.toFixed(1)}%` : netPct > 1.5 ? `${netPct.toFixed(1)}%` : ""}
                  </div>
                )}
                {/* Influencer */}
                {commission > 0 && commission <= margin && (
                  <div style={{
                    width: `${Math.min(commission, margin)}%`,
                    background: "linear-gradient(90deg, #c2410c, #ea580c)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: 700, color: "white",
                    transition: "width 0.35s ease",
                    flexShrink: 0,
                  }}>
                    {commission > 2.5 ? `🌟 網紅 ${commission}%` : commission > 1 ? `${commission}%` : ""}
                  </div>
                )}
                {/* Overflow guard: if commission > margin, show warning stripe */}
                {commission > margin && (
                  <div style={{
                    width: `${commission - margin}%`,
                    background: "repeating-linear-gradient(45deg, #7f1d1d, #7f1d1d 4px, #450a0a 4px, #450a0a 8px)",
                    flexShrink: 0,
                  }} />
                )}
              </div>

              {/* Legend */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                {[
                  { dot: "#475569", label: `學校 (${schoolPct}%)` },
                  { dot: isLoss ? "#dc2626" : "#16a34a", label: `代辦淨 (${netPct.toFixed(1)}%)` },
                  { dot: "#ea580c", label: `網紅分潤 (${commission}%)` },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: l.dot }} />
                    <span style={{ fontSize: "10px", color: "#64748b" }}>{l.label}</span>
                  </div>
                ))}
              </div>

              {/* Per-deal cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                {[
                  {
                    icon: "🏫", title: "學校收入／單",
                    eur: avgFee * schoolPct / 100,
                    pct: schoolPct,
                    color: "#94a3b8", bg: "#0f172a", border: "#334155",
                  },
                  {
                    icon: "📊", title: "代辦毛利／單",
                    eur: avgFee * margin / 100,
                    pct: margin,
                    color: "#34d399", bg: "#052e16", border: "#065f46",
                  },
                  {
                    icon: "🌟", title: "網紅分潤／單",
                    eur: avgFee * commission / 100,
                    pct: commission,
                    color: "#fb923c", bg: "#431407", border: "#9a3412",
                  },
                  {
                    icon: "💎", title: "代辦實拿／單",
                    eur: avgFee * netPct / 100,
                    pct: netPct,
                    color: isLoss ? "#f87171" : "#4ade80",
                    bg:   isLoss ? "#450a0a"  : "#052e16",
                    border: isLoss ? "#b91c1c" : "#15803d",
                  },
                ].map(card => (
                  <div key={card.title} style={{
                    background: card.bg, border: `1px solid ${card.border}`,
                    borderRadius: "10px", padding: "12px",
                  }}>
                    <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "5px" }}>
                      {card.icon} {card.title}
                    </div>
                    <div style={{ fontSize: "17px", fontWeight: 800, color: card.color, fontFamily: "monospace" }}>
                      {fmtEUR(card.eur)}
                    </div>
                    <div style={{ fontSize: "9px", color: "#475569", marginTop: "3px" }}>
                      {card.pct.toFixed(1)}% of {fmtEUR(avgFee)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom summary strip */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px",
                marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #1e293b",
              }}>
                {[
                  { label: "總觸及",  val: fmtNum(reach),         color: "#3b82f6" },
                  { label: "點擊人數", val: fmtNum(m.clicks),      color: "#6366f1" },
                  { label: "獲取名單", val: fmtNum(m.leads),       color: "#8b5cf6" },
                  { label: "成交單量", val: fmtNum(m.sales),       color: "#10b981" },
                  { label: "創造總營收", val: fmtEUR(m.revenueEUR), color: "#fbbf24" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "9px", color: "#475569", marginBottom: "3px" }}>{s.label}</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>{/* /grid */}
        </div>{/* /right panel */}
      </div>{/* /body */}
    </div>
  );
}
