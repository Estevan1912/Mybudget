import { useState, useEffect, useCallback } from "react";

const fmt  = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtS = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
const monthLabel = (key) => { try { const [y, m] = key.split("-"); return new Date(+y, +m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }); } catch { return key; } };
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };

function Card({ children, style={} }) { return <div style={{ background:"rgba(255,255,255,0.055)", borderRadius:20, border:"1px solid rgba(255,255,255,0.09)", marginBottom:14, overflow:"hidden", ...style }}>{children}</div>; }
function SLabel({ children }) { return <div style={{ color:"rgba(255,255,255,0.38)", fontSize:11, fontWeight:700, letterSpacing:1.1, textTransform:"uppercase", marginBottom:8, paddingLeft:4 }}>{children}</div>; }
function Div() { return <div style={{ height:1, background:"rgba(255,255,255,0.07)", margin:"0 16px" }} />; }
function MInput({ value, onChange, placeholder="0.00", hi=false, sm=false }) {
  return (
    <div style={{ position:"relative", display:"inline-flex", alignItems:"center" }}>
      <span style={{ position:"absolute", left:9, color:hi?"#34C759":"rgba(255,255,255,0.4)", fontSize:sm?11:13, fontWeight:700, pointerEvents:"none" }}>$</span>
      <input type="number" inputMode="decimal" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ background:hi?"rgba(52,199,89,0.1)":"rgba(255,255,255,0.07)", border:`1.5px solid ${hi?"rgba(52,199,89,0.35)":"rgba(255,255,255,0.12)"}`, borderRadius:11, color:hi?"#34C759":"#fff", fontSize:sm?12:14, fontWeight:700, padding:sm?"5px 8px 5px 18px":"7px 10px 7px 20px", width:sm?85:105, textAlign:"right", outline:"none", fontFamily:"inherit" }} />
    </div>
  );
}

const AMEX_SUBS = [
  { id:1, label:"Disney+",          amount:19.99 },
  { id:2, label:"Adobe Web",        amount:39.99 },
  { id:3, label:"iCloud",           amount:9.99  },
  { id:4, label:"Xeela Fitness",    amount:28.98 },
  { id:5, label:"Spotify",          amount:18.99 },
  { id:6, label:"Apple Protection", amount:9.99  },
  { id:7, label:"Ring",             amount:4.99  },
  { id:8, label:"Microsoft",        amount:9.99  },
];
const BOA_SUBS = [
  { id:9,  label:"Six Flags", amount:25.98 },
  { id:10, label:"The Gym",   amount:30.00 },
  { id:11, label:"Shopify",   amount:39.00 },
];

const GOALS = [
  { id:1, label:"Savings",               target:600,   color:"#FF6B6B", icon:"🛡️", monthly:100, type:"foundation" },
  { id:3, label:"401(k) Match",          target:2340,  color:"#3B82F6", icon:"📈", monthly:91,  type:"foundation", preTax:true },
  { id:4, label:"Roth IRA",              target:7000,  color:"#8B5CF6", icon:"💜", monthly:50,  type:"foundation" },
  { id:5, label:"🔥 Camaro 2SS",         target:10000, color:"#F43F5E", icon:"🔥", monthly:50,  type:"dream" },
  { id:6, label:"🏠 House Down Payment", target:35000, color:"#10B981", icon:"🏠", monthly:200, type:"dream" },
];

const newMonth = (key) => ({
  key, locked:false,
  startingBalance:"",
  paychecks:[{id:1,label:"Paycheck 1",amount:"",note:""},{id:2,label:"Paycheck 2",amount:"",note:""}],
  commission:{amount:""},
  amex:{statementBalance:"",paid:false},
  boa:{statementBalance:"",paid:false},
  bills:[{id:1,label:"Rent",due:"1st",amount:500,paid:false,icon:"🏠"},{id:2,label:"Car Insurance",due:"Monthly",amount:83,paid:false,icon:"🚗"}],
  goalContributions:{1:0,3:0,4:0,5:0,6:0},
  directTransactions:[],
});

export default function App() {
  const [tab, setTab]               = useState("home");
  const [months, setMonths]         = useState({});
  const [goalSaved, setGoalSaved]   = useState(Object.fromEntries(GOALS.map(g=>[g.id,0])));
  const [goalTargets, setGoalTargets] = useState(Object.fromEntries(GOALS.map(g=>[g.id,g.target])));
  const [currentKey, setCurrentKey] = useState(todayKey());
  const [loaded, setLoaded]         = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [r1,r2,r3,r4] = await Promise.allSettled([
          window.storage.get("months_v2"),
          window.storage.get("goalSaved_v2"),
          window.storage.get("goalTargets_v2"),
          window.storage.get("currentKey_v2"),
        ]);
        if (r1.status==="fulfilled" && r1.value) setMonths(JSON.parse(r1.value.value));
        if (r2.status==="fulfilled" && r2.value) setGoalSaved(JSON.parse(r2.value.value));
        if (r3.status==="fulfilled" && r3.value) setGoalTargets(JSON.parse(r3.value.value));
        if (r4.status==="fulfilled" && r4.value) setCurrentKey(r4.value.value);
      } catch(_) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set("months_v2", JSON.stringify(months));
        await window.storage.set("goalSaved_v2", JSON.stringify(goalSaved));
        await window.storage.set("goalTargets_v2", JSON.stringify(goalTargets));
        await window.storage.set("currentKey_v2", currentKey);
      } catch(_) {}
    })();
  }, [months, goalSaved, goalTargets, currentKey, loaded]);

  const curMonth = months[currentKey] || newMonth(currentKey);
  const setCurMonth = useCallback((fn) => {
    setMonths(prev => {
      const cur = prev[currentKey] || newMonth(currentKey);
      return { ...prev, [currentKey]: typeof fn === "function" ? fn(cur) : fn };
    });
  }, [currentKey]);

  const startNewMonth = () => {
    const cur = months[currentKey] || newMonth(currentKey);

    // Calculate leftover to carry forward
    const totalIn   = cur.paychecks.reduce((s,p)=>s+(parseFloat(p.amount)||0),0)
                    + (parseFloat(cur.commission?.amount)||0)
                    + (parseFloat(cur.startingBalance)||0);
    const amexBal   = cur.amex?.paid  ? (parseFloat(cur.amex?.statementBalance)||0)  : 0;
    const boaBal    = cur.boa?.paid   ? (parseFloat(cur.boa?.statementBalance)||0)    : 0;
    const fixedOut  = cur.bills.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0);
    const directOut = (cur.directTransactions||[]).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
    const goalOut   = Object.entries(cur.goalContributions||{}).filter(([id])=>id!=="3").reduce((s,[,v])=>s+v,0);
    const leftover  = Math.max(0, totalIn - amexBal - boaBal - fixedOut - directOut - goalOut);

    // Lock current month
    setMonths(prev => ({ ...prev, [currentKey]: { ...cur, locked:true } }));

    // Open next month with leftover as starting balance
    const [y,m] = currentKey.split("-").map(Number);
    const next = m===12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,"0")}`;
    setMonths(prev => ({
      ...prev,
      [next]: { ...(prev[next] || newMonth(next)), startingBalance: leftover > 0 ? String(Math.round(leftover)) : "" }
    }));
    setCurrentKey(next);
    setTab("home");
  };

  const goToPrevMonth = () => {
    const [y,m] = currentKey.split("-").map(Number);
    const prev = m===1 ? `${y-1}-12` : `${y}-${String(m-1).padStart(2,"0")}`;
    setCurrentKey(prev);
    setTab("home");
  };

  const goToNextMonth = () => {
    const [y,m] = currentKey.split("-").map(Number);
    const next = m===12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,"0")}`;
    setCurrentKey(next);
    setTab("home");
  };

  const isCurrentMonth = currentKey === todayKey();

  const addContrib = (goalId, amt) => {
    const n = parseFloat(amt)||0;
    if (!n) return;
    setGoalSaved(prev => ({ ...prev, [goalId]: (prev[goalId]||0)+n }));
    setCurMonth(m => ({ ...m, goalContributions: { ...m.goalContributions, [goalId]: (m.goalContributions?.[goalId]||0)+n } }));
  };

  if (!loaded) return <div style={{ minHeight:"100vh", background:"#0D0D16", display:"flex", alignItems:"center", justifyContent:"center" }}><div style={{ color:"rgba(255,255,255,0.4)", fontSize:14 }}>Loading...</div></div>;

  const TABS = [
    { key:"home",     label:"Home",    icon:a=><svg viewBox="0 0 24 24" fill={a?"#5B8FFF":"rgba(255,255,255,0.32)"} width="20" height="20"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg> },
    { key:"paychecks",label:"Pay",     icon:a=><svg viewBox="0 0 24 24" fill={a?"#5B8FFF":"rgba(255,255,255,0.32)"} width="20" height="20"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg> },
    { key:"cards",    label:"Cards",   icon:a=><svg viewBox="0 0 24 24" fill={a?"#5B8FFF":"rgba(255,255,255,0.32)"} width="20" height="20"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg> },
    { key:"goals",    label:"Goals",   icon:a=><svg viewBox="0 0 24 24" fill={a?"#5B8FFF":"rgba(255,255,255,0.32)"} width="20" height="20"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg> },
  ];
  const titles = { home:"Overview", paychecks:"My Paychecks", cards:"Cards & Bills", goals:"Savings Goals" };
  const sortedKeys = Object.keys(months).sort().reverse();

  const screens = {
    home:      <HomeScreen month={curMonth} goalSaved={goalSaved} onNewMonth={startNewMonth} currentKey={currentKey} months={months} sortedKeys={sortedKeys} isCurrentMonth={isCurrentMonth} />,
    paychecks: <PaychecksScreen month={curMonth} setMonth={setCurMonth} />,
    cards:     <CardsScreen month={curMonth} setMonth={setCurMonth} />,
    goals:     <GoalsScreen goalSaved={goalSaved} setGoalSaved={setGoalSaved} goalTargets={goalTargets} setGoalTargets={setGoalTargets} onContribute={addContrib} currentMonth={curMonth} month={curMonth} setMonth={setCurMonth} />,
  };

  return (
    <div style={{ minHeight:"100vh", background:"#080810", display:"flex", justifyContent:"center", fontFamily:"'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <div style={{ width:"100%", maxWidth:390, minHeight:"100vh", background:"#0D0D16", display:"flex", flexDirection:"column" }}>
        <div style={{ height:50, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 22px", flexShrink:0 }}>
          <span style={{ color:"#fff", fontSize:13, fontWeight:800 }}>9:41</span>
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            {[3,5,7,9].map((h,i)=><div key={i} style={{ width:3, height:h, background:i<3?"#fff":"rgba(255,255,255,0.3)", borderRadius:1 }} />)}
            <span style={{ color:"rgba(255,255,255,0.8)", fontSize:12, fontWeight:600, marginLeft:6 }}>100%</span>
          </div>
        </div>
        <div style={{ padding:"2px 20px 14px", flexShrink:0 }}>
          {/* Month navigator */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:2 }}>
            <button onClick={goToPrevMonth} style={{ background:"rgba(255,255,255,0.08)", border:"none", borderRadius:8, padding:"4px 10px", color:"#fff", fontSize:16, cursor:"pointer", lineHeight:1 }}>‹</button>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
              <div style={{ color:"rgba(255,255,255,0.35)", fontSize:12, fontWeight:600, letterSpacing:0.5 }}>{monthLabel(currentKey)}</div>
              {!isCurrentMonth && (
                <div style={{ color:"#F59E0B", fontSize:9, fontWeight:700, letterSpacing:0.5, marginTop:1 }}>EDITING PAST MONTH</div>
              )}
            </div>
            <button onClick={goToNextMonth} style={{ background:"rgba(255,255,255,0.08)", border:"none", borderRadius:8, padding:"4px 10px", color: isCurrentMonth?"rgba(255,255,255,0.2)":"#fff", fontSize:16, cursor: isCurrentMonth?"default":"pointer", lineHeight:1 }} disabled={isCurrentMonth}>›</button>
          </div>
          <div style={{ color:"#fff", fontSize:28, fontWeight:800, letterSpacing:-0.8, lineHeight:1.15 }}>{titles[tab]}</div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"0 14px 90px" }}>{screens[tab]}</div>
        <div style={{ position:"sticky", bottom:0, background:"rgba(13,13,22,0.96)", backdropFilter:"blur(24px)", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", padding:"10px 0 22px", flexShrink:0 }}>
          {TABS.map(({key,label,icon})=>{
            const a=tab===key;
            return (
              <button key={key} onClick={()=>setTab(key)} style={{ flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"2px 0" }}>
                <div style={{ transform:a?"scale(1.12)":"scale(1)", transition:"transform 0.18s" }}>{icon(a)}</div>
                <span style={{ fontSize:9, fontWeight:a?700:500, color:a?"#5B8FFF":"rgba(255,255,255,0.3)", letterSpacing:0.3 }}>{label}</span>
                {a&&<div style={{ width:4, height:4, borderRadius:2, background:"#5B8FFF", marginTop:1 }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── HOME ─────────────────────────────────────────────────────
function HomeScreen({ month, goalSaved, onNewMonth, currentKey, months, sortedKeys, isCurrentMonth }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expanded,    setExpanded]    = useState(null);

  const totalIn   = month.paychecks.reduce((s,p)=>s+(parseFloat(p.amount)||0),0) + (parseFloat(month.commission?.amount)||0) + (parseFloat(month.startingBalance)||0);
  const amexBal   = month.amex?.paid ? (parseFloat(month.amex?.statementBalance)||0) : 0;
  const boaBal    = month.boa?.paid  ? (parseFloat(month.boa?.statementBalance)||0)  : 0;
  const fixedOut  = month.bills.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0);
  const directOut = (month.directTransactions||[]).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
  const goalOut   = Object.entries(month.goalContributions||{}).filter(([id])=>id!=="3").reduce((s,[,v])=>s+v,0);
  const leftover  = totalIn - amexBal - boaBal - fixedOut - directOut - goalOut;
  const hc        = leftover>400?"#34C759":leftover>100?"#F59E0B":"#FF6B6B";
  const totalGs   = Object.values(goalSaved).reduce((s,v)=>s+v,0);
  const allPaid   = month.bills.every(b=>b.paid)&&month.amex?.paid&&month.boa?.paid;

  const pendingBills = month.bills.filter(b=>!b.paid).reduce((s,b)=>s+b.amount,0)
    + (!month.amex?.paid ? (parseFloat(month.amex?.statementBalance)||0) : 0)
    + (!month.boa?.paid  ? (parseFloat(month.boa?.statementBalance)||0)  : 0);

  const totalEarned = Object.values(months).reduce((s,m)=>s+m.paychecks.reduce((ps,p)=>ps+(parseFloat(p.amount)||0),0)+(parseFloat(m.commission?.amount)||0),0);
  const totalSaved  = Object.values(goalSaved).reduce((s,v)=>s+v,0);

  return (
    <div>
      <div style={{ background:"linear-gradient(145deg,#1a1f3c,#0f3460,#16213e)", borderRadius:26, padding:"26px 22px 22px", marginBottom:16, position:"relative", overflow:"hidden", border:"1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:"50%", background:"rgba(91,143,255,0.08)" }} />
        <div style={{ color:"rgba(255,255,255,0.5)", fontSize:12, fontWeight:600, letterSpacing:0.8, marginBottom:6 }}>ACTUAL BALANCE NOW</div>
        <div style={{ color:hc, fontSize:46, fontWeight:800, letterSpacing:-2, lineHeight:1, marginBottom:6, transition:"color 0.3s" }}>{fmt(leftover)}</div>
        <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, marginBottom:pendingBills>0?8:20 }}>based on paid bills only</div>
        {pendingBills>0&&(
          <div style={{ background:"rgba(245,158,11,0.15)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:10, padding:"6px 10px", marginBottom:16 }}>
            <div style={{ color:"#FDE68A", fontSize:11, fontWeight:600 }}>⏳ {fmt(pendingBills)} in unpaid bills still pending</div>
          </div>
        )}
        <div style={{ display:"flex" }}>
          {[["IN",totalIn,"#6EE7B7"],["PAID",amexBal+boaBal+fixedOut,"#FCA5A5"],["DIRECT",directOut,"#FB923C"],["GOALS",goalOut,"#C4B5FD"]].map(([l,v,c],i,arr)=>(
            <div key={l} style={{ flex:1, borderRight:i<arr.length-1?"1px solid rgba(255,255,255,0.1)":"none", paddingRight:6, paddingLeft:i>0?6:0 }}>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:9, fontWeight:700, letterSpacing:0.6 }}>{l}</div>
              <div style={{ color:c, fontSize:13, fontWeight:800, marginTop:2 }}>{fmtS(v)}</div>
            </div>
          ))}
        </div>
      </div>

      <SLabel>Net Worth Snapshot</SLabel>
      <Card style={{ background:"rgba(139,92,246,0.07)", border:"1px solid rgba(139,92,246,0.2)" }}>
        <div style={{ padding:"16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
            <div>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:700, letterSpacing:0.8 }}>TOTAL ACROSS ALL GOALS</div>
              <div style={{ color:"#C4B5FD", fontSize:26, fontWeight:800 }}>{fmt(totalGs)}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:700, letterSpacing:0.8 }}>BILLS STATUS</div>
              <div style={{ color:allPaid?"#34C759":"#F59E0B", fontSize:16, fontWeight:800, marginTop:4 }}>{allPaid?"✅ All Paid":"⏳ Pending"}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {GOALS.map(g=>{
              const pct=Math.min((goalSaved[g.id]||0)/g.target,1);
              return (
                <div key={g.id} style={{ flex:1 }}>
                  <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:4, height:6, overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:4, background:g.color, width:`${pct*100}%`, transition:"width 0.4s" }} />
                  </div>
                  <div style={{ color:"rgba(255,255,255,0.3)", fontSize:8, marginTop:3, textAlign:"center" }}>{g.icon}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <SLabel>This Month Summary</SLabel>
      <Card>
        {[
          ["🏦 Starting Balance",  parseFloat(month.startingBalance)||0, "#93C5FD"],
          ["💰 Paychecks + Comm",  totalIn-(parseFloat(month.startingBalance)||0), "#6EE7B7"],
          ["✅ Paid Bills & Cards", amexBal+boaBal+fixedOut, "#FCA5A5"],
          ["🏧 Direct from Bank",  directOut, "#FB923C"],
          ["🎯 Saved to Goals (this month)", goalOut, "#C4B5FD"],
          ["⏳ Still Pending",     pendingBills, "#F59E0B"],
          ["💵 Actual Balance",    leftover, hc],
        ].map(([l,v,c],i,arr)=>(
          <div key={l}>
            <div style={{ padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ color:"rgba(255,255,255,0.7)", fontSize:14 }}>{l}</span>
              <span style={{ color:c, fontSize:16, fontWeight:800 }}>{fmt(v)}</span>
            </div>
            {i<arr.length-1&&<Div/>}
          </div>
        ))}
      </Card>

      {!isCurrentMonth ? (
        <div style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:16, padding:"14px 16px", textAlign:"center", marginTop:4 }}>
          <div style={{ color:"#FDE68A", fontSize:14, fontWeight:700 }}>📝 Editing Past Month</div>
          <div style={{ color:"rgba(255,255,255,0.45)", fontSize:11, marginTop:4 }}>Use ‹ › arrows at the top to navigate months. When done tap ➕ Start New Month on your current month.</div>
        </div>
      ) : !month.locked ? (
        <div onClick={onNewMonth} style={{ background:"linear-gradient(135deg,#1a4fd6,#7c3aed)", borderRadius:16, padding:"16px", textAlign:"center", cursor:"pointer", marginTop:4 }}>
          <div style={{ color:"#fff", fontSize:15, fontWeight:700 }}>➕ Start New Month</div>
          <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11, marginTop:3 }}>Saves this month & opens next month</div>
        </div>
      ) : (
        <div style={{ background:"rgba(52,199,89,0.1)", border:"1px solid rgba(52,199,89,0.2)", borderRadius:16, padding:"14px", textAlign:"center" }}>
          <div style={{ color:"#34C759", fontSize:14, fontWeight:700 }}>✅ Month Saved</div>
        </div>
      )}

      {/* ── NET WORTH CHART ── */}
      {sortedKeys.length > 0 && (
        <>
          <SLabel>📈 Net Worth Over Time</SLabel>
          <Card>
            <div style={{ padding:"16px" }}>
              {(() => {
                // Build chart data from all months
                const chartMonths = [...sortedKeys].reverse().slice(-6); // last 6 months
                const maxIncome   = Math.max(...chartMonths.map(k=>{
                  const m=months[k]; return m.paychecks.reduce((s,p)=>s+(parseFloat(p.amount)||0),0)+(parseFloat(m.commission?.amount)||0);
                }), 1);
                const maxSaved    = Math.max(...chartMonths.map((_,i)=>{
                  // running total up to that month
                  return Object.values(goalSaved).reduce((s,v)=>s+v,0);
                }), 1);

                // Running savings totals per month
                let runningSaved = 0;
                const monthData = chartMonths.map(k=>{
                  const m      = months[k];
                  const income = m.paychecks.reduce((s,p)=>s+(parseFloat(p.amount)||0),0)+(parseFloat(m.commission?.amount)||0);
                  const spent  = (m.amex?.paid?(parseFloat(m.amex?.statementBalance)||0):0)
                               + (m.boa?.paid?(parseFloat(m.boa?.statementBalance)||0):0)
                               + m.bills.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0)
                               + (m.directTransactions||[]).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
                  const gc     = Object.values(m.goalContributions||{}).reduce((s,v)=>s+v,0);
                  runningSaved += gc;
                  return { key:k, income, spent, saved:runningSaved, gc };
                });

                const maxBar  = Math.max(...monthData.map(d=>d.income), 1);
                const maxLine = Math.max(...monthData.map(d=>d.saved), 1);
                const chartH  = 100;
                const W       = monthData.length;

                return (
                  <div>
                    {/* Legend */}
                    <div style={{ display:"flex", gap:16, marginBottom:14 }}>
                      {[["#FCA5A5","Spending (bars)"],["#34C759","Savings (line)"],["#6EE7B7","Income (bars)"]].map(([c,l])=>(
                        <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <div style={{ width:10, height:10, borderRadius:2, background:c }} />
                          <span style={{ color:"rgba(255,255,255,0.45)", fontSize:10 }}>{l}</span>
                        </div>
                      ))}
                    </div>

                    {/* SVG Chart */}
                    <svg width="100%" viewBox={`0 0 ${W*50} ${chartH+30}`} style={{ overflow:"visible" }}>
                      {monthData.map((d,i)=>{
                        const x       = i * 50 + 10;
                        const incH    = (d.income / maxBar) * chartH;
                        const spentH  = (d.spent  / maxBar) * chartH;
                        const label   = monthLabel(d.key).slice(0,3);
                        return (
                          <g key={d.key}>
                            {/* Income bar (lighter, behind) */}
                            <rect x={x} y={chartH-incH} width={14} height={incH} fill="rgba(110,231,183,0.3)" rx="3"/>
                            {/* Spending bar (in front) */}
                            <rect x={x+16} y={chartH-spentH} width={14} height={spentH} fill="rgba(252,165,165,0.8)" rx="3"/>
                            {/* Month label */}
                            <text x={x+15} y={chartH+16} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8">{label}</text>
                          </g>
                        );
                      })}

                      {/* Savings line */}
                      {monthData.length > 1 && (
                        <>
                          <polyline
                            points={monthData.map((d,i)=>`${i*50+17},${chartH - (d.saved/maxLine)*chartH}`).join(" ")}
                            fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
                          />
                          {monthData.map((d,i)=>(
                            <circle key={i} cx={i*50+17} cy={chartH-(d.saved/maxLine)*chartH} r="4" fill="#34C759" stroke="#0D0D16" strokeWidth="1.5"/>
                          ))}
                        </>
                      )}
                    </svg>

                    {/* Summary row */}
                    <div style={{ display:"flex", gap:8, marginTop:12 }}>
                      {[
                        ["Total Earned", Object.values(months).reduce((s,m)=>s+m.paychecks.reduce((ps,p)=>ps+(parseFloat(p.amount)||0),0)+(parseFloat(m.commission?.amount)||0),0), "#6EE7B7"],
                        ["Total Saved",  Object.values(goalSaved).reduce((s,v)=>s+v,0), "#34C759"],
                        ["Months",       sortedKeys.length, "#C4B5FD"],
                      ].map(([l,v,c])=>(
                        <div key={l} style={{ flex:1, background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"8px 10px" }}>
                          <div style={{ color:"rgba(255,255,255,0.35)", fontSize:9, fontWeight:700, letterSpacing:0.5 }}>{l.toUpperCase()}</div>
                          <div style={{ color:c, fontSize:14, fontWeight:800, marginTop:2 }}>
                            {typeof v==="number"&&l!=="Months" ? fmtS(v) : v}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </Card>
        </>
      )}

      {/* ── HISTORY ACCORDION ── */}
      <div style={{ marginTop:16 }}>
        <div
          onClick={()=>setHistoryOpen(o=>!o)}
          style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:historyOpen?"16px 16px 0 0":"16px", padding:"14px 16px", cursor:"pointer" }}
        >
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)" width="16" height="16"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
            <div>
              <div style={{ color:"#fff", fontSize:14, fontWeight:700 }}>Monthly History</div>
              <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:1 }}>
                {sortedKeys.length} month{sortedKeys.length!==1?"s":""} · Earned {fmtS(totalEarned)} total · Saved {fmtS(totalSaved)}
              </div>
            </div>
          </div>
          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:13, fontWeight:700 }}>{historyOpen?"▲":"▼"}</div>
        </div>

        {historyOpen && (
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.09)", borderTop:"none", borderRadius:"0 0 16px 16px", overflow:"hidden" }}>
            {sortedKeys.length===0 ? (
              <div style={{ padding:"24px", textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:13 }}>
                No history yet — finish a month and tap "Start New Month"
              </div>
            ) : (
              sortedKeys.map((key,idx)=>{
                const m     = months[key];
                const inc   = m.paychecks.reduce((s,p)=>s+(parseFloat(p.amount)||0),0)+(parseFloat(m.commission?.amount)||0);
                const comm  = parseFloat(m.commission?.amount)||0;
                const cards = (m.amex?.paid?(parseFloat(m.amex?.statementBalance)||0):0)+(m.boa?.paid?(parseFloat(m.boa?.statementBalance)||0):0);
                const bills = m.bills.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0);
                const direct= (m.directTransactions||[]).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
                const gc    = Object.values(m.goalContributions||{}).reduce((s,v)=>s+v,0);
                const net   = inc-cards-bills-direct-gc;
                const isCur = key===currentKey;
                const open  = expanded===key;

                return (
                  <div key={key} style={{ borderBottom:idx<sortedKeys.length-1?"1px solid rgba(255,255,255,0.06)":"none" }}>
                    <div onClick={()=>setExpanded(open?null:key)} style={{ padding:"13px 16px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                          <div style={{ color:"#fff", fontSize:14, fontWeight:600 }}>{monthLabel(key)}</div>
                          {isCur&&<div style={{ background:"#5B8FFF", borderRadius:5, padding:"1px 6px", fontSize:9, fontWeight:700, color:"#fff" }}>NOW</div>}
                          {m.locked&&<div style={{ background:"rgba(52,199,89,0.2)", borderRadius:5, padding:"1px 6px", fontSize:9, fontWeight:700, color:"#34C759" }}>SAVED</div>}
                        </div>
                        <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11 }}>
                          {inc>0?`Earned ${fmtS(inc)}${comm>0?` · Comm ${fmtS(comm)}`:""}`:isCur?"In progress...":"No data"}
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ color:net>=0?"#34C759":"#FF6B6B", fontSize:15, fontWeight:800 }}>{inc>0?fmt(net):"—"}</div>
                        <div style={{ color:"rgba(255,255,255,0.25)", fontSize:10 }}>{open?"▲":"▼"}</div>
                      </div>
                    </div>

                    {open && inc>0 && (
                      <div style={{ padding:"0 16px 14px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        {[["💰 Income",inc,"#6EE7B7"],["💳 Cards",cards,"#FCA5A5"],["🏠 Bills",bills,"#93C5FD"],["🏧 Direct",direct,"#FB923C"],["🎯 Goals",gc,"#C4B5FD"],["💵 Net",net,net>=0?"#34C759":"#FF6B6B"]].map(([l,v,c])=>(
                          <div key={l} style={{ background:"rgba(0,0,0,0.2)", borderRadius:8, padding:"8px 10px" }}>
                            <div style={{ color:"rgba(255,255,255,0.4)", fontSize:9, fontWeight:600 }}>{l}</div>
                            <div style={{ color:c, fontSize:14, fontWeight:800 }}>{fmt(v)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PAYCHECKS ────────────────────────────────────────────────
function PaychecksScreen({ month, setMonth }) {
  const upd   = (id,f,v) => setMonth(m=>({...m, paychecks:m.paychecks.map(p=>p.id===id?{...p,[f]:v}:p)}));
  const total = month.paychecks.reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
  const comm  = parseFloat(month.commission?.amount)||0;

  // Calculate actual balance (same logic as HomeScreen)
  const totalIn   = total + comm + (parseFloat(month.startingBalance)||0);
  const amexBal   = month.amex?.paid  ? (parseFloat(month.amex?.statementBalance)||0)  : 0;
  const boaBal    = month.boa?.paid   ? (parseFloat(month.boa?.statementBalance)||0)   : 0;
  const fixedOut  = month.bills.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0);
  const directOut = (month.directTransactions||[]).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
  const goalOut   = Object.entries(month.goalContributions||{}).filter(([id])=>id!=="3").reduce((s,[,v])=>s+v,0);
  const balance   = totalIn - amexBal - boaBal - fixedOut - directOut - goalOut;
  const balColor  = balance>400?"#34C759":balance>100?"#F59E0B":"#FF6B6B";

  // Balance-based recommendations (from what's actually left)
  const balSave    = Math.max(0, balance * 0.20);
  const balInvest  = Math.max(0, balance * 0.10);
  const balCaramro = Math.max(0, balance * 0.10);
  const balKeep    = Math.max(0, balance * 0.60);

  return (
    <div>
      {/* Starting Balance — carried over from last month */}
      <SLabel>Starting Balance</SLabel>
      <Card style={{ border:"1px solid rgba(52,199,89,0.25)", background:"rgba(52,199,89,0.05)" }}>
        <div style={{ padding:"16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ color:"#fff", fontSize:15, fontWeight:700 }}>Checking Account Balance</div>
            <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:2 }}>
              {month.startingBalance
                ? "✅ Auto-carried from last month — edit if needed"
                : "Enter what's in your account at the start of this month"}
            </div>
          </div>
          <MInput value={month.startingBalance||""} onChange={v=>setMonth(m=>({...m,startingBalance:v}))} hi={!!month.startingBalance} />
        </div>
      </Card>

      <SLabel>Regular Paychecks</SLabel>
      <Card>
        {month.paychecks.map((p,i,arr)=>(
          <div key={p.id}>
            <div style={{ padding:"15px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div style={{ color:"#fff", fontSize:15, fontWeight:600 }}>{p.label}</div>
                <MInput value={p.amount} onChange={v=>upd(p.id,"amount",v)} hi={!!p.amount} />
              </div>
              <input type="text" placeholder="Add a note..." value={p.note} onChange={e=>upd(p.id,"note",e.target.value)}
                style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, color:"rgba(255,255,255,0.5)", fontSize:12, padding:"5px 10px", width:"100%", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }} />
            </div>
            {i<arr.length-1&&<Div/>}
          </div>
        ))}
      </Card>
      <div style={{ background:"rgba(52,199,89,0.1)", border:"1px solid rgba(52,199,89,0.2)", borderRadius:14, padding:"12px 16px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ color:"rgba(255,255,255,0.6)", fontSize:13, fontWeight:600 }}>Total Regular Pay</span>
        <span style={{ color:"#34C759", fontSize:20, fontWeight:800 }}>{fmt(total)}</span>
      </div>

      <SLabel>Verizon Commission — Last Friday</SLabel>
      <Card style={{ background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.18)" }}>
        <div style={{ padding:"16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:comm>0?14:0 }}>
            <div>
              <div style={{ color:"#FDE68A", fontSize:15, fontWeight:700 }}>💼 Commission Check</div>
              <div style={{ color:"rgba(255,255,255,0.35)", fontSize:12, marginTop:2 }}>Enter when received</div>
            </div>
            <MInput value={month.commission?.amount||""} onChange={v=>setMonth(m=>({...m,commission:{amount:v}}))} />
          </div>
          {comm>0&&(
            <>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:700, letterSpacing:0.8, marginBottom:8 }}>RECOMMENDED FROM COMMISSION</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                {[["💾 Save 20%",comm*0.2,"#6EE7B7","HYSA"],["📈 Invest 20%",comm*0.2,"#93C5FD","Roth IRA"],["💳 Cards 30%",comm*0.3,"#FCA5A5","Pay balances"],["🎉 Keep 30%",comm*0.3,"#FDE68A","Spending"]].map(([l,v,c,s])=>(
                  <div key={l} style={{ background:"rgba(0,0,0,0.2)", borderRadius:10, padding:"9px 10px" }}>
                    <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:600 }}>{l}</div>
                    <div style={{ color:c, fontSize:15, fontWeight:800 }}>{fmt(v)}</div>
                    <div style={{ color:"rgba(255,255,255,0.3)", fontSize:10 }}>{s}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Balance-based recommendation — always shows when there's income */}
      {balance > 0 && (
        <>
          <SLabel>Recommended From Balance</SLabel>
          <Card style={{ background:"rgba(91,143,255,0.07)", border:"1px solid rgba(91,143,255,0.2)" }}>
            <div style={{ padding:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div>
                  <div style={{ color:"#93C5FD", fontSize:14, fontWeight:700 }}>Based on your actual balance</div>
                  <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:2 }}>What to do with the {fmt(balance)} you have left</div>
                </div>
                <div style={{ color:balColor, fontSize:17, fontWeight:800 }}>{fmt(balance)}</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  ["💾 Save 20%",   balSave,    "#6EE7B7", "Into savings"],
                  ["📈 Invest 10%", balInvest,  "#93C5FD", "Roth IRA"],
                  ["🔥 Camaro 10%", balCaramro, "#F43F5E", "Down payment"],
                  ["💵 Keep 60%",   balKeep,    "#FDE68A", "Living expenses"],
                ].map(([l,v,c,s])=>(
                  <div key={l} style={{ background:"rgba(0,0,0,0.2)", borderRadius:10, padding:"9px 10px" }}>
                    <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:600 }}>{l}</div>
                    <div style={{ color:c, fontSize:15, fontWeight:800 }}>{fmt(v)}</div>
                    <div style={{ color:"rgba(255,255,255,0.3)", fontSize:10 }}>{s}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:10, background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"8px 10px" }}>
                <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, lineHeight:1.5 }}>
                  💡 These update automatically as you log paychecks and mark bills paid
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ── CARD ENTRY — standalone to prevent input focus loss ──────
function CardEntry({ ck, emoji, name, color, bc, subs, month, togglePaid, updBal }) {
  const CARD_LIMIT  = 1000;
  const ALERT_THRESH = 750;
  const card    = month[ck]||{};
  const bal     = parseFloat(card.statementBalance)||0;
  const st      = subs.reduce((s,x)=>s+x.amount,0);
  const usePct  = bal / CARD_LIMIT;
  const isWarn  = bal >= ALERT_THRESH && bal < CARD_LIMIT;
  const isOver  = bal >= CARD_LIMIT;
  const alertColor  = isOver ? "#FF6B6B" : "#F59E0B";
  const alertBg     = isOver ? "rgba(255,107,107,0.12)" : "rgba(245,158,11,0.12)";
  const alertBorder = isOver ? "rgba(255,107,107,0.35)" : "rgba(245,158,11,0.35)";

  return (
    <>
      <SLabel>{emoji} {name} — Due {ck==="amex"?"4th":"17th"}</SLabel>
      <Card style={{ border:`1px solid ${(isWarn||isOver) ? alertBorder : bc}` }}>
        {(isWarn || isOver) && (
          <div style={{ background:alertBg, borderBottom:`1px solid ${alertBorder}`, padding:"10px 16px", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>{isOver ? "🚨" : "⚠️"}</span>
            <div>
              <div style={{ color:alertColor, fontSize:13, fontWeight:700 }}>
                {isOver ? "Over limit!" : `${Math.round(usePct*100)}% of $${CARD_LIMIT} limit used`}
              </div>
              <div style={{ color:"rgba(255,255,255,0.45)", fontSize:11, marginTop:1 }}>
                {isOver
                  ? `$${Math.round(bal-CARD_LIMIT)} over your $${CARD_LIMIT} limit`
                  : `$${Math.round(CARD_LIMIT - bal)} remaining before limit`}
              </div>
            </div>
          </div>
        )}
        <div style={{ padding:"18px 16px" }}>
          {bal > 0 && (
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:700, letterSpacing:0.6 }}>LIMIT USAGE</div>
                <div style={{ color: isOver?"#FF6B6B": isWarn?"#F59E0B": "#34C759", fontSize:10, fontWeight:700 }}>
                  {fmt(bal)} / ${CARD_LIMIT}
                </div>
              </div>
              <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:6, height:7, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:6, transition:"width 0.4s", width:`${Math.min(usePct*100,100)}%`,
                  background: isOver ? "#FF6B6B" : isWarn ? "#F59E0B" : "#34C759" }} />
              </div>
              <div style={{ position:"relative", height:6, marginTop:2 }}>
                <div style={{ position:"absolute", left:"75%", top:0, width:1, height:6, background:"rgba(255,255,255,0.2)" }} />
                <div style={{ position:"absolute", left:"75%", top:8, fontSize:8, color:"rgba(255,255,255,0.25)", transform:"translateX(-50%)" }}>75%</div>
              </div>
            </div>
          )}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div>
              <div style={{ color:"#fff", fontSize:15, fontWeight:700 }}>Statement Balance Due</div>
              <div style={{ color:"rgba(255,255,255,0.35)", fontSize:12, marginTop:2 }}>Type what you owe on the {ck==="amex"?"4th":"17th"}</div>
            </div>
            <div style={{ position:"relative", display:"inline-flex", alignItems:"center" }}>
              <span style={{ position:"absolute", left:9, color:"#34C759", fontSize:13, fontWeight:700, pointerEvents:"none" }}>$</span>
              <input
                type="number" inputMode="decimal"
                value={card.statementBalance||""}
                onChange={e => updBal(ck, e.target.value)}
                placeholder="0.00"
                style={{ background:"rgba(52,199,89,0.1)", border:"1.5px solid rgba(52,199,89,0.35)", borderRadius:11, color:"#34C759", fontSize:14, fontWeight:700, padding:"7px 10px 7px 20px", width:115, textAlign:"right", outline:"none", fontFamily:"inherit" }}
              />
            </div>
          </div>
          <div onClick={()=>togglePaid(ck)} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"10px 12px", background:card.paid?"rgba(52,199,89,0.12)":"rgba(255,255,255,0.04)", border:`1.5px solid ${card.paid?"rgba(52,199,89,0.35)":"rgba(255,255,255,0.1)"}`, borderRadius:12, transition:"all 0.2s" }}>
            <div style={{ width:22, height:22, borderRadius:11, background:card.paid?"#34C759":"transparent", border:card.paid?"none":"2px solid rgba(255,255,255,0.25)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s" }}>
              {card.paid&&<svg viewBox="0 0 24 24" fill="white" width="13" height="13"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
            </div>
            <span style={{ color:card.paid?"#34C759":"rgba(255,255,255,0.5)", fontSize:14, fontWeight:600 }}>{card.paid?`✓ Paid — ${fmt(bal)} cleared!`:"Tap to mark as paid"}</span>
          </div>
        </div>
        <Div/>
        <div style={{ padding:"12px 16px 14px" }}>
          <div style={{ color:"rgba(255,255,255,0.35)", fontSize:10, fontWeight:700, letterSpacing:0.8, marginBottom:8 }}>AUTO-SUBS · {fmt(st)}/mo included</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {subs.map(s=>(
              <div key={s.id} style={{ background:"rgba(255,255,255,0.06)", borderRadius:8, padding:"4px 9px", display:"flex", gap:5 }}>
                <span style={{ color:"rgba(255,255,255,0.55)", fontSize:11 }}>{s.label}</span>
                <span style={{ color, fontSize:11, fontWeight:700 }}>{fmt(s.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}

// ── CARDS ────────────────────────────────────────────────────
function CardsScreen({ month, setMonth }) {
  const togglePaid = (k) => setMonth(m=>({...m,[k]:{...m[k],paid:!m[k].paid}}));
  const updBal     = (k,v) => setMonth(m=>({...m,[k]:{...m[k],statementBalance:v}}));
  const togBill    = (id) => setMonth(m=>({...m,bills:m.bills.map(b=>b.id===id?{...b,paid:!b.paid}:b)}));
  const [newTxLabel, setNewTxLabel] = useState("");
  const [newTxAmt,   setNewTxAmt]   = useState("");

  const addDirectTx = () => {
    if (!newTxAmt || !newTxLabel) return;
    const tx = { id: Date.now(), label: newTxLabel, amount: parseFloat(newTxAmt)||0 };
    setMonth(m=>({...m, directTransactions:[...(m.directTransactions||[]), tx]}));
    setNewTxLabel(""); setNewTxAmt("");
  };
  const removeTx = (id) => setMonth(m=>({...m, directTransactions:(m.directTransactions||[]).filter(t=>t.id!==id)}));

  const aB = month.amex?.paid ? (parseFloat(month.amex?.statementBalance)||0) : 0;
  const bB = month.boa?.paid  ? (parseFloat(month.boa?.statementBalance)||0)  : 0;
  const fT = month.bills.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0);
  const dT = (month.directTransactions||[]).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);

  return (
    <div>
      <CardEntry ck="amex" emoji="💳" name="American Express" color="#60A5FA" bc="rgba(96,165,250,0.2)"  subs={AMEX_SUBS} month={month} togglePaid={togglePaid} updBal={updBal} />
      <CardEntry ck="boa"  emoji="🏦" name="Bank of America"  color="#F59E0B" bc="rgba(245,158,11,0.2)" subs={BOA_SUBS}  month={month} togglePaid={togglePaid} updBal={updBal} />
      <SLabel>Fixed Bills</SLabel>
      <Card>
        {month.bills.map((b,i,arr)=>(
          <div key={b.id}>
            <div style={{ padding:"13px 16px", display:"flex", alignItems:"center", gap:12, opacity:b.paid?0.55:1, transition:"opacity 0.2s" }}>
              <div onClick={()=>togBill(b.id)} style={{ width:26, height:26, borderRadius:13, flexShrink:0, cursor:"pointer", border:b.paid?"none":"2px solid rgba(255,255,255,0.2)", background:b.paid?"#34C759":"transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
                {b.paid&&<svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
              </div>
              <span style={{ fontSize:18 }}>{b.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ color:"#fff", fontSize:14, fontWeight:500, textDecoration:b.paid?"line-through":"none" }}>{b.label}</div>
                <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11 }}>Due {b.due}</div>
              </div>
              <div style={{ color:b.paid?"#34C759":"#fff", fontSize:15, fontWeight:700 }}>{fmt(b.amount)}</div>
            </div>
            {i<arr.length-1&&<Div/>}
          </div>
        ))}
      </Card>
      <SLabel>🏧 Direct Bank Transactions</SLabel>
      <Card>
        <div style={{ padding:"14px 16px" }}>
          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, marginBottom:12, lineHeight:1.5 }}>
            Purchases made directly from your bank account — not on a credit card
          </div>
          {/* Add new transaction */}
          <div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center" }}>
            <input type="text" placeholder="What was it?" value={newTxLabel} onChange={e=>setNewTxLabel(e.target.value)}
              style={{ flex:1, background:"rgba(255,255,255,0.07)", border:"1.5px solid rgba(255,255,255,0.12)", borderRadius:11, color:"#fff", fontSize:13, padding:"8px 12px", outline:"none", fontFamily:"inherit" }} />
            <MInput value={newTxAmt} onChange={setNewTxAmt} placeholder="0.00" />
            <div onClick={addDirectTx} style={{ background:"#FB923C", borderRadius:11, padding:"8px 12px", cursor:"pointer", color:"#fff", fontSize:13, fontWeight:700, flexShrink:0 }}>+</div>
          </div>
          {/* Transaction list */}
          {(month.directTransactions||[]).length === 0 ? (
            <div style={{ color:"rgba(255,255,255,0.25)", fontSize:12, textAlign:"center", padding:"8px 0" }}>No direct transactions yet</div>
          ) : (
            <div>
              {(month.directTransactions||[]).map((tx,i,arr)=>(
                <div key={tx.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:i<arr.length-1?10:0, marginBottom:i<arr.length-1?10:0, borderBottom:i<arr.length-1?"1px solid rgba(255,255,255,0.07)":"none" }}>
                  <div style={{ color:"rgba(255,255,255,0.8)", fontSize:13 }}>{tx.label}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ color:"#FB923C", fontSize:14, fontWeight:700 }}>{fmt(tx.amount)}</div>
                    <div onClick={()=>removeTx(tx.id)} style={{ color:"rgba(255,255,255,0.3)", fontSize:16, cursor:"pointer", padding:"0 4px" }}>✕</div>
                  </div>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:12, paddingTop:10, borderTop:"1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ color:"rgba(255,255,255,0.6)", fontSize:13, fontWeight:600 }}>Total Direct</div>
                <div style={{ color:"#FB923C", fontSize:15, fontWeight:800 }}>{fmt(dT)}</div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div style={{ background:"linear-gradient(135deg,rgba(239,68,68,0.14),rgba(239,68,68,0.05))", border:"1px solid rgba(239,68,68,0.2)", borderRadius:16, padding:"14px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div>
            <div style={{ color:"rgba(255,255,255,0.6)", fontSize:12, fontWeight:600 }}>TOTAL PAID OUT</div>
            <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:2 }}>Paid cards + bills + direct</div>
          </div>
          <div style={{ color:"#FCA5A5", fontSize:22, fontWeight:800 }}>{fmt(aB+bB+fT+dT)}</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {[["💳 Amex",month.amex?.paid?(parseFloat(month.amex?.statementBalance)||0):0,"#60A5FA",month.amex?.paid],["🏦 BOA",month.boa?.paid?(parseFloat(month.boa?.statementBalance)||0):0,"#F59E0B",month.boa?.paid],["🏠 Bills",fT,"#93C5FD",month.bills.every(b=>b.paid)],["🏧 Direct",dT,"#FB923C",true]].map(([l,v,c,paid])=>(
            <div key={l} style={{ flex:1, background:"rgba(0,0,0,0.2)", borderRadius:10, padding:"8px 6px" }}>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:9, fontWeight:600 }}>{l}</div>
              <div style={{ color:paid?c:"rgba(255,255,255,0.3)", fontSize:12, fontWeight:800 }}>{v>0?fmt(v):"—"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── GOAL CARD — standalone so state is fully isolated per card ─
function GCard({ g, goalSaved, setGoalSaved, goalTargets, setGoalTargets, onContribute, currentMonth, setMonth, camaroOpen, setCamaroOpen, camaroProps }) {
  const [mode,      setMode]      = useState("idle");  // "idle" | "add" | "correct" | "editTarget"
  const [val,       setVal]       = useState("");

  const saved   = goalSaved[g.id]  || 0;
  const target  = goalTargets[g.id]|| g.target;
  const pct     = target > 0 ? Math.min(saved / target, 1) : 0;
  const rem     = Math.max(target - saved, 0);
  const mos     = g.monthly > 0 ? Math.ceil(rem / g.monthly) : "—";
  const done    = pct >= 1;
  const contrib = currentMonth.goalContributions?.[g.id] || 0;
  const isCamaro = g.id === 5;
  const is401k   = g.id === 3;

  const close = () => { setMode("idle"); setVal(""); };

  const handleAdd = () => {
    const n = parseFloat(val);
    if (!n || n <= 0) return;
    onContribute(g.id, n);
    close();
  };
  const handleCorrect = () => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) return;
    // Update lifetime saved total
    setGoalSaved(s => ({ ...s, [g.id]: n }));
    // Also update this month's contribution to match the difference
    // so the balance calculation stays accurate
    const currentContrib = currentMonth.goalContributions?.[g.id] || 0;
    const currentSaved = goalSaved[g.id] || 0;
    const diff = n - currentSaved; // how much we're adjusting by
    const newContrib = Math.max(0, currentContrib + diff);
    setMonth(m => ({ ...m, goalContributions: { ...m.goalContributions, [g.id]: newContrib } }));
    close();
  };
  const handleEditTarget = () => {
    const n = parseFloat(val);
    if (!n || n <= 0) return;
    setGoalTargets(t => ({ ...t, [g.id]: n }));
    close();
  };

  const inputColor = mode === "correct" ? "#F59E0B" : mode === "editTarget" ? "#8B5CF6" : "#34C759";
  const iStyle = {
    width: "100%", textAlign: "right", outline: "none", fontFamily: "inherit",
    fontSize: 15, fontWeight: 700, padding: "9px 10px 9px 24px",
    borderRadius: 11, border: `1.5px solid ${inputColor}66`,
    background: `${inputColor}18`, color: inputColor,
  };

  return (
    <Card style={g.type === "dream" ? { border: `1px solid ${g.color}30`, background: `${g.color}08` } : {}}>
      <div style={{ padding: "16px" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
          <div style={{ flex:1 }}>
            <div style={{ color:"#fff", fontSize:15, fontWeight:700, marginBottom:2 }}>{g.label}</div>
            <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11 }}>
              {done ? "✅ Goal reached!" : `~${mos} mo to go · ${fmt(rem)} left`}
            </div>
            {is401k && <div style={{ color:"#3B82F6", fontSize:10, fontWeight:600, marginTop:2 }}>📌 Pre-tax — doesn't affect your balance</div>}
            {contrib > 0 && !is401k && <div style={{ color:"#34C759", fontSize:10, fontWeight:700, marginTop:2 }}>+{fmt(contrib)} added this month</div>}
          </div>
          <div style={{ textAlign:"right", marginLeft:8 }}>
            <div style={{ color: done ? "#34C759" : g.color, fontSize:22, fontWeight:800 }}>{Math.round(pct * 100)}%</div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:12, fontWeight:700 }}>{fmt(saved)}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:6, height:9, marginBottom:14, overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:6, width:`${pct*100}%`, transition:"width 0.4s",
            background: done ? "#34C759" : g.type === "dream" ? `linear-gradient(90deg,${g.color},${g.color}BB)` : g.color,
            boxShadow: `0 0 10px ${g.color}50` }} />
        </div>

        {/* Input area */}
        {mode !== "idle" && (
          <div style={{ marginBottom:10 }}>
            <div style={{ color:"rgba(255,255,255,0.45)", fontSize:11, marginBottom:6 }}>
              {mode === "add"        ? "Amount to add to this goal:" :
               mode === "correct"   ? `Correct total saved (currently ${fmt(saved)}):` :
                                      `New target amount (currently ${fmt(target)}):`}
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <div style={{ position:"relative", flex:1 }}>
                <span style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", color:inputColor, fontSize:13, fontWeight:700, pointerEvents:"none" }}>$</span>
                <input type="number" inputMode="decimal" value={val}
                  onChange={e => setVal(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (mode==="add"?handleAdd:mode==="correct"?handleCorrect:handleEditTarget)()}
                  placeholder="0.00" autoFocus style={iStyle} />
              </div>
              <div onClick={mode==="add" ? handleAdd : mode==="correct" ? handleCorrect : handleEditTarget}
                style={{ padding:"9px 14px", borderRadius:10, cursor:"pointer", color:"#fff", fontSize:13, fontWeight:700, whiteSpace:"nowrap",
                  background: inputColor }}>
                {mode === "add" ? "+ Add" : mode === "correct" ? "Set ✓" : "Save"}
              </div>
              <div onClick={close}
                style={{ padding:"9px 10px", background:"rgba(255,255,255,0.07)", borderRadius:10, cursor:"pointer", color:"rgba(255,255,255,0.4)", fontSize:13 }}>✕</div>
            </div>
          </div>
        )}

        {/* Action buttons — always visible */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop: mode !== "idle" ? 8 : 0 }}>
          <div onClick={() => { setMode("add"); setVal(""); }}
            style={{ flex:1, background: mode==="add" ? `${g.color}35` : `${g.color}20`, border:`1px solid ${g.color}40`, borderRadius:10, padding:"8px", textAlign:"center", cursor:"pointer", color:g.color, fontSize:13, fontWeight:700, minWidth:70 }}>
            + Add
          </div>
          <div onClick={() => { setMode("correct"); setVal(String(Math.round(saved))); }}
            style={{ padding:"8px 10px", background: mode==="correct" ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:10, cursor:"pointer", color:"#F59E0B", fontSize:12, fontWeight:600 }}>
            ✏️ Correct
          </div>
          <div onClick={() => { setMode("editTarget"); setVal(String(Math.round(target))); }}
            style={{ padding:"8px 10px", background: mode==="editTarget" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.06)", borderRadius:10, cursor:"pointer", color: mode==="editTarget" ? "#8B5CF6" : "rgba(255,255,255,0.4)", fontSize:12 }}>
            🎯 Target
          </div>
          {isCamaro && (
            <div onClick={() => setCamaroOpen(o => !o)}
              style={{ padding:"8px 10px", background: camaroOpen ? "rgba(244,63,94,0.2)" : "rgba(255,255,255,0.06)", border: camaroOpen ? "1px solid rgba(244,63,94,0.4)" : "none", borderRadius:10, cursor:"pointer", color: camaroOpen ? "#F43F5E" : "rgba(255,255,255,0.4)", fontSize:12, fontWeight:700 }}>
              {camaroOpen ? "▲" : "🏎️"}
            </div>
          )}
        </div>

        {/* Camaro tracker dropdown */}
        {isCamaro && camaroOpen && camaroProps && (
          <div style={{ marginTop:14, background:"#f5f5f5", borderRadius:14, padding:"16px" }}>
            {camaroProps}
          </div>
        )}
      </div>
    </Card>
  );
}

// ── GOALS SCREEN ─────────────────────────────────────────────
function GoalsScreen({ goalSaved, setGoalSaved, goalTargets, setGoalTargets, onContribute, currentMonth, month, setMonth }) {
  const [camaroOpen, setCamaroOpen] = useState(false);
  const [camaroGoal, setCamaroGoal] = useState(10000);
  const [camaroMode, setCamaroMode] = useState("slow");
  const [saveAmt,    setSaveAmt]    = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const totalSaved  = Object.values(goalSaved).reduce((s,v)=>s+v,0);
  const totalTarget = Object.values(goalTargets).reduce((s,v)=>s+v,0);

  const appPaycheck   = month.paychecks.reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
  const appCommission = parseFloat(month.commission?.amount)||0;
  const appExpenses   = (month.amex?.paid?(parseFloat(month.amex?.statementBalance)||0):0)
                      + (month.boa?.paid?(parseFloat(month.boa?.statementBalance)||0):0)
                      + month.bills.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0)
                      + (month.directTransactions||[]).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
  const camaroSaved   = goalSaved[5] || 0;
  const leftover      = Math.max(0, (appPaycheck*2 + appCommission) - appExpenses);
  const aggrSave      = leftover * 0.30;
  const slowSave      = leftover * 0.10;
  const recSave       = camaroMode === "aggressive" ? aggrSave : slowSave;
  const otherSave     = camaroMode === "aggressive" ? slowSave : aggrSave;
  const remaining     = Math.max(camaroGoal - camaroSaved, 0);
  const monthsToGo    = recSave > 0 ? Math.ceil(remaining / recSave) : null;
  const otherMonths   = otherSave > 0 ? Math.ceil(remaining / otherSave) : null;
  const fmtC          = (n) => '$' + Math.abs(Math.round(n)).toLocaleString();

  const handleCamaroSave = () => {
    const a = parseFloat(saveAmt) || Math.round(recSave / 2);
    if (a > 0) { onContribute(5, a); setSavedFlash(true); setSaveAmt(""); setTimeout(()=>setSavedFlash(false), 2500); }
  };

  // Build camaro tracker JSX to pass as prop
  const camaroTracker = (
    <div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#aaa", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>Down Payment Goal</div>
        <div style={{ display:"flex", gap:8 }}>
          {[10000,15000].map(gv=>(
            <button key={gv} onClick={()=>setCamaroGoal(gv)} style={{ flex:1, padding:"9px", border:`2px solid ${camaroGoal===gv?"#ff2200":"#e0e0e0"}`, borderRadius:8, background:camaroGoal===gv?"#fff5f5":"#fff", fontSize:13, fontWeight:800, color:camaroGoal===gv?"#ff2200":"#999", cursor:"pointer" }}>
              ${gv===10000?"10,000":"15,000"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#aaa", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>Saving Approach</div>
        <div style={{ display:"flex", gap:8 }}>
          {[["aggressive","🔥 Aggressive","30%","#ff2200"],["slow","🐢 Steady","10%","#2563eb"]].map(([m,label,pctLbl,col])=>(
            <button key={m} onClick={()=>setCamaroMode(m)} style={{ flex:1, padding:"9px 6px", border:`2px solid ${camaroMode===m?col:"#e0e0e0"}`, borderRadius:8, background:camaroMode===m?col+"18":"#fff", fontSize:12, fontWeight:800, color:camaroMode===m?col:"#999", cursor:"pointer", textAlign:"center" }}>
              {label}<br/><span style={{ fontSize:10, fontWeight:400 }}>{pctLbl} of leftover</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ background:"#fff", borderRadius:10, padding:"14px", marginBottom:14, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize:32, fontWeight:900, color:"#111" }}>{monthsToGo ? monthsToGo+" months" : "—"}</div>
        <div style={{ fontSize:11, color:"#aaa", marginTop:2, marginBottom:10 }}>TO {fmtC(camaroGoal)} · {camaroMode==="aggressive"?"AGGRESSIVE (30%)":"STEADY (10%)"}</div>
        <div style={{ height:8, background:"#f0f0f0", borderRadius:4, overflow:"hidden", marginBottom:6 }}>
          <div style={{ height:"100%", background:"linear-gradient(90deg,#ff2200,#ff6600)", borderRadius:4, width:`${Math.min(100,(camaroSaved/camaroGoal)*100)}%`, transition:"width 0.4s" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#bbb" }}>
          <span>{fmtC(camaroSaved)} saved</span><span>{fmtC(camaroGoal)} goal</span>
        </div>
        {otherMonths&&(
          <div style={{ marginTop:8, fontSize:11, color:"#888", background:"#f9f9f9", borderRadius:6, padding:"6px 10px" }}>
            {camaroMode==="aggressive" ? `🐢 Steady = ${otherMonths} months (${fmtC(otherSave)}/mo)` : `🔥 Aggressive = ${otherMonths} months (${fmtC(otherSave)}/mo)`}
          </div>
        )}
      </div>
      <div style={{ background:"#fff", borderRadius:10, padding:"14px", marginBottom:14, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#aaa", letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>Monthly Breakdown</div>
        {[["Base pay (2 checks)",fmtC(appPaycheck),"#111"],["+ Commission",fmtC(appCommission),"#00aa55"],["− Paid expenses",fmtC(appExpenses),"#ff2200"],["= Left over",fmtC(leftover),"#111"],[camaroMode==="aggressive"?"🔥 Save (30%)":"🐢 Save (10%)",fmtC(recSave)+"/mo",camaroMode==="aggressive"?"#ff2200":"#2563eb"]].map(([l,v,c],i,arr)=>(
          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:i<arr.length-1?"1px solid #f5f5f5":"none" }}>
            <span style={{ fontSize:12, color:"#666" }}>{l}</span>
            <span style={{ fontSize:12, fontWeight:800, color:c }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ background:"#fff", borderRadius:10, padding:"14px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#aaa", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>Log This Paycheck's Save</div>
        <div style={{ fontSize:12, color:"#888", marginBottom:10 }}>Recommended: <strong style={{ color:"#ff2200" }}>{fmtC(recSave/2)}</strong> per paycheck</div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div style={{ position:"relative", flex:1 }}>
            <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"#aaa", fontWeight:700, pointerEvents:"none" }}>$</span>
            <input type="number" value={saveAmt} onChange={e=>setSaveAmt(e.target.value)} placeholder={String(Math.round(recSave/2))}
              style={{ width:"100%", padding:"9px 9px 9px 22px", border:"2px solid #e0e0e0", borderRadius:8, fontSize:14, fontWeight:700, outline:"none", color:"#111", background:"#fff" }} />
          </div>
          <button onClick={handleCamaroSave} style={{ padding:"9px 14px", borderRadius:8, background:savedFlash?"#00aa55":"#ff2200", color:"#fff", fontSize:13, fontWeight:800, border:"none", cursor:"pointer", whiteSpace:"nowrap" }}>
            {savedFlash?"✅ Done!":"Add to Goal"}
          </button>
        </div>
        {savedFlash&&<div style={{ marginTop:6, fontSize:11, color:"#00aa55", textAlign:"center", fontWeight:600 }}>🎉 Camaro goal updated!</div>}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.2)", borderRadius:16, padding:"14px 16px", marginBottom:16, display:"flex", justifyContent:"space-between" }}>
        <div>
          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:700, letterSpacing:0.8 }}>TOTAL SAVED — ALL TIME</div>
          <div style={{ color:"#C4B5FD", fontSize:24, fontWeight:800 }}>{fmt(totalSaved)}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:700, letterSpacing:0.8 }}>ALL GOALS</div>
          <div style={{ color:"rgba(255,255,255,0.5)", fontSize:24, fontWeight:800 }}>{fmt(totalTarget)}</div>
        </div>
      </div>
      <SLabel>🛡️ Foundation Goals</SLabel>
      {GOALS.filter(g=>g.type==="foundation").map(g=>(
        <GCard key={g.id} g={g} goalSaved={goalSaved} setGoalSaved={setGoalSaved}
          goalTargets={goalTargets} setGoalTargets={setGoalTargets}
          onContribute={onContribute} currentMonth={currentMonth}
          setMonth={setMonth}
          camaroOpen={camaroOpen} setCamaroOpen={setCamaroOpen} />
      ))}
      <SLabel>🌟 Big Life Goals</SLabel>
      {GOALS.filter(g=>g.type==="dream").map(g=>(
        <GCard key={g.id} g={g} goalSaved={goalSaved} setGoalSaved={setGoalSaved}
          goalTargets={goalTargets} setGoalTargets={setGoalTargets}
          onContribute={onContribute} currentMonth={currentMonth}
          setMonth={setMonth}
          camaroOpen={camaroOpen} setCamaroOpen={setCamaroOpen}
          camaroProps={g.id===5 ? camaroTracker : null} />
      ))}
    </div>
  );
}


