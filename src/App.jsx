import { useState, useEffect, useCallback, createContext, useContext } from "react";
// ExcelJS loaded lazily on export

const fmt  = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0);
const fmtS = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:0}).format(n||0);
const monthLabel = (key) => { try { const [y,m]=key.split("-"); return new Date(+y,+m-1,1).toLocaleDateString("en-US",{month:"long",year:"numeric"}); } catch{return key;} };
const todayKey = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };

// ── THEME ─────────────────────────────────────────────────────
const DARK = {
  mode:"dark", bg:"#08080F", surface:"#0F0F1C", card:"#161625",
  border:"rgba(255,255,255,0.07)", text:"#F0F0FF", sub:"rgba(255,255,255,0.52)",
  muted:"rgba(255,255,255,0.3)", div:"rgba(255,255,255,0.06)",
  inBg:"rgba(255,255,255,0.07)", inBorder:"rgba(255,255,255,0.13)",
  tab:"rgba(8,8,15,0.97)", tabBorder:"rgba(255,255,255,0.07)",
  accent:"#5B8FFF", green:"#32D74B", red:"#FF453A", yellow:"#FFD60A",
  orange:"#FF9F0A", purple:"#BF5AF2", teal:"#5AC8FA",
  shadow:"0 8px 40px rgba(0,0,0,0.6)", cardShadow:"0 2px 16px rgba(0,0,0,0.4)",
};
const LIGHT = {
  mode:"light", bg:"#F2F2F7", surface:"#FFFFFF", card:"#FFFFFF",
  border:"rgba(0,0,0,0.06)", text:"#1C1C1E", sub:"#636366", muted:"#8E8E93",
  div:"rgba(0,0,0,0.05)", inBg:"rgba(0,0,0,0.04)", inBorder:"rgba(0,0,0,0.13)",
  tab:"rgba(255,255,255,0.98)", tabBorder:"rgba(0,0,0,0.08)",
  accent:"#0071E3", green:"#34C759", red:"#FF3B30", yellow:"#FF9500",
  orange:"#FF9500", purple:"#AF52DE", teal:"#32ADE6",
  shadow:"0 2px 20px rgba(0,0,0,0.08)", cardShadow:"0 1px 8px rgba(0,0,0,0.06)",
};

const TC = createContext(DARK);
const useT = () => useContext(TC);

// ── SHARED UI ─────────────────────────────────────────────────
function Card({children, style={}}) {
  const T = useT();
  return (
    <div style={{background:T.card, borderRadius:20, border:`1px solid ${T.border}`, marginBottom:12, overflow:"hidden", boxShadow:T.cardShadow, ...style}}>
      {children}
    </div>
  );
}
function SLabel({children, style={}}) {
  const T = useT();
  return <div style={{color:T.muted, fontSize:11, fontWeight:700, letterSpacing:1.1, textTransform:"uppercase", marginBottom:8, paddingLeft:2, marginTop:8, ...style}}>{children}</div>;
}
function Div() {
  const T = useT();
  return <div style={{height:1, background:T.div, margin:"0 16px"}} />;
}
function MInput({value, onChange, placeholder="0.00", hi=false, sm=false}) {
  const T = useT();
  const col = hi ? T.green : T.sub;
  return (
    <div style={{position:"relative", display:"inline-flex", alignItems:"center"}}>
      <span style={{position:"absolute", left:9, color:col, fontSize:sm?11:13, fontWeight:700, pointerEvents:"none"}}>$</span>
      <input type="number" inputMode="decimal" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{background:hi?`${T.green}18`:T.inBg, border:`1.5px solid ${hi?`${T.green}45`:T.inBorder}`, borderRadius:11, color:hi?T.green:T.text, fontSize:sm?12:14, fontWeight:700, padding:sm?"5px 8px 5px 18px":"7px 10px 7px 20px", width:sm?85:105, textAlign:"right", outline:"none", fontFamily:"inherit"}} />
    </div>
  );
}

// ── DONUT CHART ───────────────────────────────────────────────
function DonutChart({income, spent, saved, size=200}) {
  const T = useT();
  const cx = size/2, cy = size/2, r = size*0.36, sw = size*0.105;
  const circ = 2*Math.PI*r;
  const total = income || 1;
  const spentPct  = Math.min(spent/total, 1);
  const savedPct  = Math.min(saved/total, Math.max(0, 1-spentPct));
  const remPct    = Math.max(0, 1-spentPct-savedPct);
  const balance   = income - spent - saved;
  const balColor  = balance > 400 ? T.green : balance > 100 ? T.yellow : T.red;

  const seg = (pct, offset, strokeVal) => {
    if (pct <= 0.001) return null;
    return (
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={strokeVal} strokeWidth={sw}
        strokeDasharray={`${pct*circ} ${circ}`} strokeDashoffset={-offset*circ} strokeLinecap="butt"
        style={{transform:`rotate(-90deg)`, transformOrigin:`${cx}px ${cy}px`, transition:"stroke-dasharray 0.6s ease"}} />
    );
  };

  return (
    <div style={{position:"relative", width:size, height:size, flexShrink:0}}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="dg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF453A"/><stop offset="100%" stopColor="#FF9F0A"/>
          </linearGradient>
          <linearGradient id="dg2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#BF5AF2"/><stop offset="100%" stopColor="#5AC8FA"/>
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.inBg} strokeWidth={sw}/>
        {seg(remPct, spentPct+savedPct, T.green)}
        {seg(savedPct, spentPct, "url(#dg2)")}
        {seg(spentPct, 0, "url(#dg1)")}
      </svg>
      <div style={{position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:1}}>
        <div style={{color:T.muted, fontSize:9, fontWeight:700, letterSpacing:1}}>BALANCE</div>
        <div style={{color:balColor, fontSize:income>0?26:20, fontWeight:800, letterSpacing:-1, lineHeight:1}}>{fmtS(balance)}</div>
        {income>0 && <div style={{color:T.muted, fontSize:10, marginTop:2}}>{Math.round(Math.max(0,(income-spent-saved)/income)*100)}% left</div>}
      </div>
    </div>
  );
}

// ── CASH FLOW CHART ───────────────────────────────────────────
function CashFlowChart({months, sortedKeys}) {
  const T = useT();
  if (sortedKeys.length < 2) return (
    <div style={{padding:"24px 16px", textAlign:"center", color:T.muted, fontSize:12}}>
      Complete at least 2 months to see your cash flow trend
    </div>
  );

  const chartMonths = [...sortedKeys].reverse().slice(-6);
  let runningSaved = 0;
  const data = chartMonths.map(k => {
    const m = months[k];
    const income  = m.paychecks.reduce((s,p)=>s+(parseFloat(p.amount)||0),0)+(parseFloat(m.commission?.amount)||0);
    const expenses = (m.amex?.paid?(parseFloat(m.amex?.statementBalance)||0):0)
                   + (m.boa?.paid?(parseFloat(m.boa?.statementBalance)||0):0)
                   + m.bills.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0)
                   + (m.directTransactions||[]).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
    const gc = Object.values(m.goalContributions||{}).reduce((s,v)=>s+v,0);
    runningSaved += gc;
    return {key:k, income, expenses, saved:runningSaved};
  });

  const W=310, H=140, pad={l:8, r:8, t:12, b:28};
  const n = data.length;
  const maxBar = Math.max(...data.map(d=>Math.max(d.income, d.expenses)), 1);
  const maxSav = Math.max(...data.map(d=>d.saved), 1);
  const pW = W-pad.l-pad.r, pH = H-pad.t-pad.b;
  const slotW = pW / n;
  const bw = Math.max(8, slotW * 0.3);

  const xOf = i => pad.l + slotW * i + slotW / 2;
  const yB  = v => pad.t + (1-v/maxBar)*pH;
  const yS  = v => pad.t + (1-v/maxSav)*pH;

  const savePts = data.map((d,i)=>[xOf(i), yS(d.saved)]);
  const linePath = savePts.reduce((acc,[x,y],i)=>{
    if (i===0) return `M${x},${y}`;
    const [px,py]=savePts[i-1]; const cpx=(px+x)/2;
    return `${acc} C${cpx},${py} ${cpx},${y} ${x},${y}`;
  },"");
  const areaPath = `${linePath} L${xOf(n-1)},${H-pad.b} L${xOf(0)},${H-pad.b} Z`;

  return (
    <div style={{padding:"0 4px 4px"}}>
      <div style={{display:"flex", gap:14, marginBottom:10, paddingLeft:4, flexWrap:"wrap"}}>
        {[
          {label:"Income",   color:T.green,  type:"bar"},
          {label:"Expenses", color:T.red,    type:"bar"},
          {label:"Savings",  color:T.accent, type:"line"},
        ].map(({label,color,type})=>(
          <div key={label} style={{display:"flex", alignItems:"center", gap:5}}>
            {type==="bar"
              ? <div style={{width:10, height:10, borderRadius:2, background:`${color}40`, border:`1.5px solid ${color}`}}/>
              : <div style={{width:16, height:3, borderRadius:2, background:color}}/>
            }
            <span style={{color:T.muted, fontSize:10}}>{label}</span>
          </div>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={T.accent} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={T.accent} stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={T.accent}/><stop offset="100%" stopColor={T.purple}/>
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0.25,0.5,0.75].map(f=>(
          <line key={f} x1={pad.l} y1={pad.t+f*pH} x2={W-pad.r} y2={pad.t+f*pH}
            stroke={T.div} strokeWidth="1" strokeDasharray="3,4"/>
        ))}

        {/* Grouped income + expense bars */}
        {data.map((d,i)=>{
          const cx = xOf(i);
          const ihBar = (d.income/maxBar)*pH;
          const exBar = (d.expenses/maxBar)*pH;
          const gap = 2;
          return (
            <g key={i}>
              <rect x={cx-bw-gap/2} y={pad.t+pH-ihBar} width={bw} height={ihBar} fill={`${T.green}35`} stroke={`${T.green}70`} strokeWidth="0.5" rx="3"/>
              <rect x={cx+gap/2}    y={pad.t+pH-exBar} width={bw} height={exBar} fill={`${T.red}35`}   stroke={`${T.red}70`}   strokeWidth="0.5" rx="3"/>
            </g>
          );
        })}

        {/* Savings area + line */}
        <path d={areaPath} fill="url(#ag)"/>
        <path d={linePath} fill="none" stroke="url(#lg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {savePts.map(([x,y],i)=>(
          <circle key={i} cx={x} cy={y} r="4" fill={T.accent} stroke={T.card} strokeWidth="2"/>
        ))}

        {/* Month labels */}
        {data.map((d,i)=>(
          <text key={i} x={xOf(i)} y={H-6} textAnchor="middle" fill={T.muted} fontSize="8" fontWeight="600">
            {monthLabel(d.key).slice(0,3)}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ── SPENDING CATEGORY BARS (Monarch style) ────────────────────
function CategoryBars({categories}) {
  const T = useT();
  const total = categories.reduce((s,c)=>s+c.amount,0)||1;
  return (
    <div>
      {categories.filter(c=>c.amount>0).map((c,i,arr)=>(
        <div key={i} style={{display:"flex", alignItems:"center", gap:12, padding:"11px 16px", borderBottom:i<arr.length-1?`1px solid ${T.div}`:"none"}}>
          <div style={{width:38, height:38, borderRadius:11, background:`${c.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0}}>
            {c.icon}
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:5}}>
              <span style={{color:T.text, fontSize:13, fontWeight:600}}>{c.label}</span>
              <span style={{color:c.color, fontSize:14, fontWeight:700}}>{fmt(c.amount)}</span>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:8}}>
              <div style={{flex:1, background:T.inBg, borderRadius:4, height:5, overflow:"hidden"}}>
                <div style={{height:"100%", borderRadius:4, background:c.color, width:`${(c.amount/total)*100}%`, transition:"width 0.5s ease"}}/>
              </div>
              <span style={{color:T.muted, fontSize:10, fontWeight:600, minWidth:28, textAlign:"right"}}>{Math.round((c.amount/total)*100)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── DEFAULTS (editable via Settings) ──────────────────────────
const DEF_AMEX = [
  {id:1,label:"Disney+",amount:19.99},{id:2,label:"Adobe Web",amount:39.99},
  {id:3,label:"iCloud",amount:9.99},{id:4,label:"Xeela Fitness",amount:28.98},
  {id:5,label:"Spotify",amount:18.99},{id:6,label:"Apple Protection",amount:9.99},
  {id:7,label:"Ring",amount:4.99},{id:8,label:"Microsoft",amount:9.99},
];
const DEF_BOA = [
  {id:9,label:"Six Flags",amount:25.98},{id:10,label:"The Gym",amount:30.00},{id:11,label:"Shopify",amount:39.00},
];
const DEF_GOALS = [
  {id:1,label:"Savings",target:600,color:"#FF6B6B",icon:"🛡️",monthly:100,type:"foundation"},
  {id:3,label:"401(k) Match",target:2340,color:"#3B82F6",icon:"📈",monthly:91,type:"foundation",preTax:true},
  {id:4,label:"Roth IRA",target:7000,color:"#8B5CF6",icon:"💜",monthly:50,type:"foundation"},
  {id:5,label:"🔥 Camaro 2SS",target:10000,color:"#F43F5E",icon:"🔥",monthly:50,type:"dream"},
  {id:6,label:"🏠 House Down Payment",target:35000,color:"#10B981",icon:"🏠",monthly:200,type:"dream"},
];
const DEF_BILLS    = [{label:"Rent",due:"1st",amount:500,icon:"🏠"},{label:"Car Insurance",due:"Monthly",amount:83,icon:"🚗"}];
const DEF_PCHECKS  = ["Paycheck 1","Paycheck 2"];
const GOAL_COLORS  = ["#FF6B6B","#3B82F6","#8B5CF6","#F43F5E","#10B981","#F59E0B","#06B6D4","#EC4899","#14B8A6","#F97316"];
const GOAL_ICONS   = ["🛡️","📈","💜","🔥","🏠","🚗","💰","🎯","✈️","🎓","💻","🏋️","🎸","🌴"];
const BILL_ICONS   = ["🏠","🚗","💡","📱","🌐","🏥","🎓","🐕","🛡️","🔌"];

const newMonth = (key, goals=DEF_GOALS, bills=DEF_BILLS, pchecks=DEF_PCHECKS) => ({
  key, locked:false, startingBalance:"",
  paychecks: pchecks.map((label,i)=>({id:i+1,label,amount:"",note:""})),
  commission:{amount:""},
  amex:{statementBalance:"",paid:false},
  boa:{statementBalance:"",paid:false},
  bills: bills.map((b,i)=>({...b,id:i+1,paid:false})),
  goalContributions: Object.fromEntries(goals.map(g=>[g.id,0])),
  directTransactions:[],
});

// ── CANVAS CHART RENDERERS ────────────────────────────────────
function makeCashFlowChart(cats, budgets, actuals, title) {
  const W=1200, H=520, pad={l:60,r:30,t:90,b:80};
  const c=document.createElement('canvas'); c.width=W*2; c.height=H*2;
  const ctx=c.getContext('2d'); ctx.scale(2,2);
  const bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0D0D1E'); bg.addColorStop(1,'#0A0A14');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#FFFFFF'; ctx.font='bold 17px "Helvetica Neue",Arial'; ctx.fillText(title,pad.l,36);
  ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='11px Arial'; ctx.fillText('Budget vs Actual',pad.l,54);
  const legX=W-200;
  ctx.fillStyle='rgba(91,143,255,0.25)'; ctx.strokeStyle='#5B8FFF'; ctx.lineWidth=1;
  ctx.fillRect(legX,22,14,14); ctx.strokeRect(legX,22,14,14);
  ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.font='11px Arial'; ctx.fillText('Budget',legX+18,33);
  ctx.fillStyle='#5B8FFF'; ctx.fillRect(legX+70,22,14,14);
  ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.fillText('Actual',legX+88,33);
  const cW=W-pad.l-pad.r, cH=H-pad.t-pad.b;
  const maxV=Math.max(...budgets,...actuals,1);
  const slotW=cW/cats.length, bw=Math.max(18,slotW*0.28), gap=5;
  const COLORS=['#5AC8FA','#32D74B','#BF5AF2','#FF453A','#5B8FFF','#FF9F0A'];
  for(let i=0;i<=4;i++){
    const y=pad.t+(i/4)*cH;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y);
    ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1; ctx.stroke();
    const val=maxV*(1-i/4);
    ctx.fillStyle='rgba(255,255,255,0.28)'; ctx.font='9px Arial'; ctx.textAlign='right';
    ctx.fillText(val>=1000?`$${(val/1000).toFixed(1)}k`:`$${Math.round(val)}`,pad.l-6,y+3);
  }
  ctx.textAlign='left';
  cats.forEach((cat,i)=>{
    const col=COLORS[i%COLORS.length];
    const cx=pad.l+slotW*i+slotW/2;
    const bh=(budgets[i]/maxV)*cH;
    ctx.fillStyle=col+'30'; ctx.strokeStyle=col+'70'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.rect(cx-bw-gap/2,pad.t+cH-bh,bw,bh); ctx.fill(); ctx.stroke();
    const ah=(actuals[i]/maxV)*cH;
    const g=ctx.createLinearGradient(0,pad.t+cH-ah,0,pad.t+cH);
    g.addColorStop(0,col); g.addColorStop(1,col+'66');
    ctx.fillStyle=g;
    const rx=cx+gap/2, ry=pad.t+cH-ah, rr=3;
    ctx.beginPath(); ctx.moveTo(rx+rr,ry); ctx.lineTo(rx+bw-rr,ry);
    ctx.quadraticCurveTo(rx+bw,ry,rx+bw,ry+rr); ctx.lineTo(rx+bw,ry+ah);
    ctx.lineTo(rx,ry+ah); ctx.lineTo(rx,ry+rr); ctx.quadraticCurveTo(rx,ry,rx+rr,ry);
    ctx.closePath(); ctx.fill();
    if(actuals[i]>0){
      ctx.fillStyle=col; ctx.font='bold 9px Arial'; ctx.textAlign='center';
      ctx.fillText(actuals[i]>=1000?`$${(actuals[i]/1000).toFixed(1)}k`:`$${Math.round(actuals[i])}`,cx+gap/2+bw/2,pad.t+cH-ah-5);
    }
    ctx.fillStyle='rgba(255,255,255,0.65)'; ctx.font='bold 10px Arial'; ctx.textAlign='center';
    ctx.fillText(cat,cx,H-pad.b+18);
    ctx.fillStyle=col; ctx.font='9px Arial';
    ctx.fillText(actuals[i]>=1000?`$${(actuals[i]/1000).toFixed(1)}k`:`$${Math.round(actuals[i])}`,cx,H-pad.b+31);
  });
  ctx.beginPath(); ctx.moveTo(pad.l,pad.t+cH); ctx.lineTo(W-pad.r,pad.t+cH);
  ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.stroke();
  ctx.textAlign='left';
  return c.toDataURL('image/png').split(',')[1];
}

function makeTrendChart(trendRows) {
  const W=1200, H=420, pad={l:70,r:30,t:80,b:70};
  const c=document.createElement('canvas'); c.width=W*2; c.height=H*2;
  const ctx=c.getContext('2d'); ctx.scale(2,2);
  const bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0D0D1E'); bg.addColorStop(1,'#0A0A14');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#FFFFFF'; ctx.font='bold 17px "Helvetica Neue",Arial'; ctx.fillText('Cash Flow Trend',pad.l,36);
  ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='11px Arial'; ctx.fillText('Income · Expenses · Savings',pad.l,54);
  [['#32D74B','Income'],['#FF453A','Expenses'],['#5B8FFF','Savings']].forEach(([col,lbl],i)=>{
    const x=W-270+i*90;
    ctx.fillStyle=col; ctx.fillRect(x,22,14,4);
    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='10px Arial'; ctx.fillText(lbl,x+18,28);
  });
  if(trendRows.length<2){
    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='13px Arial'; ctx.textAlign='center';
    ctx.fillText('Need at least 2 months',W/2,H/2); return c.toDataURL('image/png').split(',')[1];
  }
  const cW=W-pad.l-pad.r, cH=H-pad.t-pad.b, n=trendRows.length;
  const maxV=Math.max(...trendRows.map(r=>Math.max(r.income,r.expenses,r.savings)),1);
  const xOf=i=>pad.l+(n<2?0.5:i/(n-1))*cW;
  const yOf=v=>pad.t+(1-v/maxV)*cH;
  for(let i=0;i<=4;i++){
    const y=pad.t+(i/4)*cH;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y);
    ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1; ctx.stroke();
    const val=maxV*(1-i/4);
    ctx.fillStyle='rgba(255,255,255,0.28)'; ctx.font='9px Arial'; ctx.textAlign='right';
    ctx.fillText(val>=1000?`$${(val/1000).toFixed(1)}k`:`$${Math.round(val)}`,pad.l-6,y+3);
  }
  trendRows.forEach((r,i)=>{
    const bw=Math.max(8,(cW/n)*0.35), bh=(r.income/maxV)*cH;
    ctx.fillStyle='rgba(50,215,75,0.18)'; ctx.strokeStyle='rgba(50,215,75,0.5)'; ctx.lineWidth=0.5;
    ctx.fillRect(xOf(i)-bw/2,pad.t+cH-bh,bw,bh); ctx.strokeRect(xOf(i)-bw/2,pad.t+cH-bh,bw,bh);
  });
  [['#FF453A','expenses'],['#5B8FFF','savings']].forEach(([col,key])=>{
    ctx.beginPath();
    trendRows.forEach((r,i)=>i===0?ctx.moveTo(xOf(i),yOf(r[key])):ctx.lineTo(xOf(i),yOf(r[key])));
    ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.lineJoin='round'; ctx.stroke();
    trendRows.forEach((r,i)=>{
      ctx.beginPath(); ctx.arc(xOf(i),yOf(r[key]),4,0,Math.PI*2);
      ctx.fillStyle=col; ctx.fill();
      ctx.beginPath(); ctx.arc(xOf(i),yOf(r[key]),2,0,Math.PI*2);
      ctx.fillStyle='#0D0D1E'; ctx.fill();
    });
  });
  trendRows.forEach((r,i)=>{
    ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='9px Arial'; ctx.textAlign='center';
    ctx.fillText(r.label.slice(0,3),xOf(i),H-pad.b+15);
  });
  ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(pad.l,pad.t+cH); ctx.lineTo(W-pad.r,pad.t+cH); ctx.stroke();
  ctx.textAlign='left';
  return c.toDataURL('image/png').split(',')[1];
}

function makeSpendingChart(spendCats) {
  const W=1200, H=420, pad={l:160,r:120,t:80,b:40};
  const c=document.createElement('canvas'); c.width=W*2; c.height=H*2;
  const ctx=c.getContext('2d'); ctx.scale(2,2);
  const bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0D0D1E'); bg.addColorStop(1,'#0A0A14');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#FFFFFF'; ctx.font='bold 17px "Helvetica Neue",Arial'; ctx.fillText('Spending Overview',pad.l,36);
  ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='11px Arial'; ctx.fillText('By category — current month',pad.l,54);
  const items=spendCats.filter(s=>s.val>0).sort((a,b)=>b.val-a.val);
  if(!items.length){
    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='13px Arial'; ctx.textAlign='center';
    ctx.fillText('No spending data yet',W/2,H/2); return c.toDataURL('image/png').split(',')[1];
  }
  const cW=W-pad.l-pad.r, rowH=Math.min(44,(H-pad.t-pad.b)/items.length);
  const maxV=items[0].val;
  const totalV=items.reduce((a,b)=>a+b.val,0);
  items.forEach((s,i)=>{
    const y=pad.t+i*rowH+rowH/2;
    ctx.fillStyle='rgba(255,255,255,0.75)'; ctx.font='bold 11px Arial'; ctx.textAlign='right';
    ctx.fillText(s.label,pad.l-12,y+4);
    ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(pad.l,y-rowH*0.35,cW,rowH*0.7);
    const bw=(s.val/maxV)*cW;
    const g=ctx.createLinearGradient(pad.l,0,pad.l+bw,0);
    g.addColorStop(0,s.col); g.addColorStop(1,s.col+'99');
    ctx.fillStyle=g; ctx.fillRect(pad.l,y-rowH*0.35,bw,rowH*0.7);
    ctx.fillStyle=s.col; ctx.font='bold 11px Arial'; ctx.textAlign='left';
    ctx.fillText(s.val>=1000?`$${(s.val/1000).toFixed(1)}k`:`$${Math.round(s.val)}`,pad.l+bw+8,y+4);
    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='10px Arial';
    ctx.fillText(`${Math.round((s.val/totalV)*100)}%`,pad.l+bw+55,y+4);
  });
  ctx.textAlign='left';
  return c.toDataURL('image/png').split(',')[1];
}


// ── PIE CHART ─────────────────────────────────────────────────
function makePieChart(slices, title) {
  const W=1100, H=560;
  const c=document.createElement('canvas'); c.width=W*2; c.height=H*2;
  const ctx=c.getContext('2d'); ctx.scale(2,2);
  const bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0D0D1E'); bg.addColorStop(1,'#0A0A14');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#FFFFFF'; ctx.font='bold 17px "Helvetica Neue",Arial'; ctx.fillText(title,40,36);
  ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='11px Arial'; ctx.fillText('Spending distribution — current month',40,54);
  const total=slices.reduce((s,sl)=>s+sl.val,0)||1;
  const pcx=280, pcy=H/2+10, r=175, ir=85;
  let startAngle=-Math.PI/2;
  slices.forEach(sl=>{
    if(sl.val<=0) return;
    const angle=(sl.val/total)*Math.PI*2;
    const midAngle=startAngle+angle/2;
    ctx.beginPath(); ctx.moveTo(pcx,pcy); ctx.arc(pcx,pcy,r,startAngle,startAngle+angle); ctx.closePath();
    ctx.fillStyle=sl.col; ctx.fill();
    ctx.beginPath(); ctx.moveTo(pcx,pcy); ctx.lineTo(pcx+Math.cos(startAngle)*r,pcy+Math.sin(startAngle)*r);
    ctx.strokeStyle='#0D0D1E'; ctx.lineWidth=2.5; ctx.stroke();
    const pct=Math.round((sl.val/total)*100);
    if(pct>=5){
      ctx.fillStyle='rgba(0,0,0,0.75)'; ctx.font='bold 11px Arial'; ctx.textAlign='center';
      ctx.fillText(`${pct}%`,pcx+Math.cos(midAngle)*r*0.65,pcy+Math.sin(midAngle)*r*0.65+4);
    }
    startAngle+=angle;
  });
  ctx.beginPath(); ctx.arc(pcx,pcy,ir,0,Math.PI*2); ctx.fillStyle='#0D0D1E'; ctx.fill();
  ctx.fillStyle='#FFFFFF'; ctx.font='bold 20px Arial'; ctx.textAlign='center';
  ctx.fillText(total>=1000?`$${(total/1000).toFixed(1)}k`:`$${Math.round(total)}`,pcx,pcy+4);
  ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='10px Arial'; ctx.fillText('TOTAL',pcx,pcy+20);
  const legX=500, active=slices.filter(sl=>sl.val>0);
  const legStartY=Math.max(60,(H-active.length*56)/2);
  active.forEach((sl,i)=>{
    const y=legStartY+i*56, pct=Math.round((sl.val/total)*100);
    ctx.fillStyle=sl.col; ctx.fillRect(legX,y,5,42);
    ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.font='bold 12px "Helvetica Neue",Arial'; ctx.textAlign='left';
    ctx.fillText(sl.label,legX+14,y+14);
    ctx.fillStyle=sl.col; ctx.font='bold 15px Arial';
    ctx.fillText(sl.val>=1000?`$${(sl.val/1000).toFixed(2)}k`:`$${Math.round(sl.val)}`,legX+14,y+32);
    ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.font='11px Arial'; ctx.fillText(`${pct}%`,legX+120,y+32);
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(legX+155,y+26,190,7);
    ctx.fillStyle=sl.col; ctx.fillRect(legX+155,y+26,Math.round((sl.val/total)*190),7);
  });
  ctx.textAlign='left';
  return c.toDataURL('image/png').split(',')[1];
}

// ── GOOGLE SHEETS API HELPERS ────────────────────────────────
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const SHEETS_BASE  = 'https://sheets.googleapis.com/v4/spreadsheets';
const rgb = hex => { const n=parseInt(hex.slice(1),16); return {red:(n>>16&255)/255,green:(n>>8&255)/255,blue:(n&255)/255}; };

async function getGoogleToken(clientId, prompt='') {
  return new Promise((resolve,reject) => {
    if(!window.google?.accounts?.oauth2)
      return reject(new Error('Google Identity Services not loaded — refresh the page.'));
    window.google.accounts.oauth2.initTokenClient({
      client_id: clientId, scope: SHEETS_SCOPE,
      callback: r => r.error ? reject(new Error(r.error_description||r.error)) : resolve(r.access_token),
      error_callback: e => reject(new Error(e.message||'Auth error')),
    }).requestAccessToken({prompt});
  });
}

async function sheetsReq(token, method, url, body) {
  const r = await fetch(url, {
    method, headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
    body: body ? JSON.stringify(body) : undefined,
  });
  if(!r.ok){const e=await r.json();throw new Error(e.error?.message||`Sheets API error (${r.status})`);}
  return r.json();
}

async function createGoogleSheet(token, title, sheetNames) {
  const res = await sheetsReq(token,'POST',SHEETS_BASE,{
    properties:{title},
    sheets: sheetNames.map((t,i)=>({properties:{sheetId:i,title:t,index:i,gridProperties:{frozenRowCount:2}}}))
  });
  return {id:res.spreadsheetId, url:`https://docs.google.com/spreadsheets/d/${res.spreadsheetId}/edit`};
}

async function clearSheetData(token, sheetId, sheetNames) {
  await sheetsReq(token,'POST',`${SHEETS_BASE}/${sheetId}/values:batchClear`,
    {ranges: sheetNames.map(n=>`'${n}'!A:Z`)});
}

async function writeSheetValues(token, sheetId, sheetsData) {
  await sheetsReq(token,'POST',`${SHEETS_BASE}/${sheetId}/values:batchUpdate`,{
    valueInputOption:'USER_ENTERED',
    data: sheetsData.map(s=>({range:`'${s.name}'!A1`, values:s.rows}))
  });
}

async function applySheetFormatting(token, sheetId, sheetsData) {
  const C = {
    navy:rgb('#1B3A6B'), navy2:rgb('#2A5496'), blue:rgb('#D6E4F7'), blueTot:rgb('#E4EEFF'),
    white:rgb('#FFFFFF'), lgray:rgb('#F5F7FA'), dark:rgb('#1A1A2E'), dim:rgb('#5A6272'),
  };
  const requests = [];
  sheetsData.forEach((sheet, sid) => {
    const nc = Math.max(...sheet.rows.map(r=>r.length), 8);
    let dataIdx = 0;
    sheet.rows.forEach((row, ri) => {
      const t = sheet.types?.[ri]||'D';
      const rng = (c0=0,c1=nc) => ({sheetId:sid,startRowIndex:ri,endRowIndex:ri+1,startColumnIndex:c0,endColumnIndex:c1});
      if(t==='T'||t==='SEC') {
        requests.push(
          {repeatCell:{range:rng(),cell:{userEnteredFormat:{backgroundColor:C.navy,textFormat:{bold:true,fontSize:t==='T'?16:11,foregroundColor:C.white}}},fields:'userEnteredFormat(backgroundColor,textFormat)'}},
          {mergeCells:{range:rng(),mergeType:'MERGE_ALL'}}
        );
      } else if(t==='S') {
        requests.push(
          {repeatCell:{range:rng(),cell:{userEnteredFormat:{backgroundColor:C.navy2,textFormat:{fontSize:9,foregroundColor:C.white}}},fields:'userEnteredFormat(backgroundColor,textFormat)'}},
          {mergeCells:{range:rng(),mergeType:'MERGE_ALL'}}
        );
      } else if(t==='H') {
        requests.push({repeatCell:{range:rng(),cell:{userEnteredFormat:{backgroundColor:C.blue,textFormat:{bold:true,fontSize:9,foregroundColor:C.navy},horizontalAlignment:'CENTER'}},fields:'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'}});
      } else if(t==='TOT') {
        requests.push(
          {repeatCell:{range:rng(),cell:{userEnteredFormat:{backgroundColor:C.blueTot,textFormat:{bold:true,fontSize:10,foregroundColor:C.dark},horizontalAlignment:'CENTER'}},fields:'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'}},
          {updateBorders:{range:rng(),top:{style:'SOLID_MEDIUM',color:C.navy},bottom:{style:'SOLID_MEDIUM',color:C.navy}}}
        );
      } else if(t==='D') {
        const bg = dataIdx++%2===0?C.white:C.lgray;
        requests.push(
          {repeatCell:{range:rng(),cell:{userEnteredFormat:{backgroundColor:bg,textFormat:{fontSize:10,foregroundColor:C.dark}}},fields:'userEnteredFormat(backgroundColor,textFormat)'}},
          {repeatCell:{range:rng(1),cell:{userEnteredFormat:{horizontalAlignment:'CENTER'}},fields:'userEnteredFormat(horizontalAlignment)'}}
        );
      }
    });
    // column widths: first col wider, rest standard
    [220,...Array(nc-1).fill(120)].forEach((w,i)=>requests.push({updateDimensionProperties:{range:{sheetId:sid,dimension:'COLUMNS',startIndex:i,endIndex:i+1},properties:{pixelSize:w},fields:'pixelSize'}}));
    // freeze top 2 rows
    requests.push({updateSheetProperties:{properties:{sheetId:sid,gridProperties:{frozenRowCount:2}},fields:'gridProperties.frozenRowCount'}});
  });
  if(requests.length) await sheetsReq(token,'POST',`${SHEETS_BASE}/${sheetId}:batchUpdate`,{requests});
}

// Build sheet data (plain arrays + row type tags for formatting)
function buildSheetsContent({months,goalSaved,goalTargets,goalsConfig,amexSubs,boaSubs,sortedKeys,billTemplates}) {
  const now  = new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const year = new Date().getFullYear();
  const cur  = n => isNaN(n)||n==null?0:+n;
  const usd  = n => {const v=Math.abs(cur(n));return (cur(n)<0?'-':'')+`$${v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;};
  const pct  = (a,b) => b>0?`${Math.round((a/b)*100)}%`:'0%';
  const clean = s => String(s||'').replace(/[^-]/g,'').trim();

  const rows = [...sortedKeys].reverse().map(key=>{
    const m=months[key];
    const starting=cur(m.startingBalance),paychecks=m.paychecks.reduce((s,p)=>s+cur(p.amount),0),commission=cur(m.commission?.amount);
    const totalIn=starting+paychecks+commission;
    const amex=m.amex?.paid?cur(m.amex?.statementBalance):0,boa=m.boa?.paid?cur(m.boa?.statementBalance):0;
    const bills=m.bills.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0),direct=(m.directTransactions||[]).reduce((s,t)=>s+cur(t.amount),0);
    const savings=Object.entries(m.goalContributions||{}).filter(([id])=>!goalsConfig.find(g=>String(g.id)===id)?.preTax).reduce((s,[,v])=>s+cur(v),0);
    const expenses=amex+boa+bills+direct,balance=totalIn-expenses-savings,debt=amex+boa;
    return {key,label:monthLabel(key),starting,paychecks,commission,totalIn,amex,boa,bills,direct,savings,expenses,balance,debt,sRate:totalIn>0?Math.round((savings/totalIn)*100):0};
  });

  const allIn=rows.reduce((s,r)=>s+r.totalIn,0),allExp=rows.reduce((s,r)=>s+r.expenses,0),allSav=rows.reduce((s,r)=>s+r.savings,0);
  const allGT=Object.values(goalSaved).reduce((s,v)=>s+cur(v),0);
  const latest=rows[rows.length-1],prev=rows.length>1?rows[rows.length-2]:null;
  const lastBal=latest?.balance||0,nw=allGT+Math.max(0,lastBal);
  const avgIn=rows.length?allIn/rows.length:0,avgExp=rows.length?allExp/rows.length:0,avgSav=rows.length?allSav/rows.length:0;
  const budBills=(billTemplates||[]).reduce((s,b)=>s+b.amount,0);
  const budSubs=[...amexSubs,...boaSubs].reduce((s,x)=>s+x.amount,0);
  const budSavings=goalsConfig.reduce((s,g)=>s+g.monthly,0);

  const mk = (t,r=[]) => ({t, r:r.map(String)});
  const B  = () => mk('B',['']);

  // ── SHEET 1: Cash Flow Overview ─────────────────────────────
  const cf = [
    mk('T',[`${latest?.label||year} — Cash Flow Overview`]),
    mk('S',[`Last synced: ${now}  ·  ${rows.length} months tracked  ·  Figures in USD`]),
    B(),
    mk('H',['Metric','This Month (MTD)','YTD Total','Monthly Avg','Monthly Budget','Over/Under']),
    mk('D',['Total Income',         usd(latest?.totalIn||0), usd(allIn),  usd(avgIn),  '—',                          '—']),
    mk('D',['Paychecks (base pay)', usd(latest?.paychecks||0),usd(rows.reduce((s,r)=>s+r.paychecks,0)),usd(rows.reduce((s,r)=>s+r.paychecks,0)/Math.max(rows.length,1)),'Biweekly','—']),
    mk('D',['Commission',           usd(latest?.commission||0),usd(rows.reduce((s,r)=>s+r.commission,0)),usd(rows.reduce((s,r)=>s+r.commission,0)/Math.max(rows.length,1)),'Variable','—']),
    B(),
    mk('D',['Total Expenses',       usd(latest?.expenses||0), usd(allExp), usd(avgExp), usd(budBills+budSubs),       usd((latest?.expenses||0)-(budBills+budSubs))]),
    mk('D',['Credit Cards',         usd(latest?.debt||0),     usd(rows.reduce((s,r)=>s+r.debt,0)),  usd(rows.reduce((s,r)=>s+r.debt,0)/Math.max(rows.length,1)),  usd(budSubs), usd((latest?.debt||0)-budSubs)]),
    mk('D',['Fixed Bills',          usd(latest?.bills||0),    usd(rows.reduce((s,r)=>s+r.bills,0)), usd(rows.reduce((s,r)=>s+r.bills,0)/Math.max(rows.length,1)), usd(budBills),usd((latest?.bills||0)-budBills)]),
    mk('D',['Direct / One-Time',    usd(latest?.direct||0),   usd(rows.reduce((s,r)=>s+r.direct,0)),usd(rows.reduce((s,r)=>s+r.direct,0)/Math.max(rows.length,1)),'Variable','—']),
    B(),
    mk('D',['Goal Savings',         usd(latest?.savings||0),  usd(allSav), usd(avgSav), usd(budSavings),            '—']),
    mk('D',['Net Balance',          usd(lastBal),             '—',         '—',         '—',                        '—']),
    mk('D',['Net Worth (all goals + balance)', usd(nw),       '—',         '—',         '—',                        '—']),
    mk('D',['Savings Rate',         `${latest?.sRate||0}%`,   pct(allSav,allIn), '—',   '—',                        '—']),
    B(),
    mk('SEC',['Monthly Cash Flow — All Months']),
    mk('H',['Month','Start Bal','Paychecks','Commission','Total In','Cards','Bills','Direct','Saved','Balance','Rate']),
    ...rows.map(r=>mk('D',[r.label,usd(r.starting),usd(r.paychecks),usd(r.commission),usd(r.totalIn),usd(r.amex),usd(r.bills),usd(r.direct),usd(r.savings),usd(r.balance),`${r.sRate}%`])),
    B(),
    mk('TOT',['ALL TIME TOTALS','',usd(rows.reduce((s,r)=>s+r.paychecks,0)),usd(rows.reduce((s,r)=>s+r.commission,0)),usd(allIn),usd(rows.reduce((s,r)=>s+r.amex,0)),usd(rows.reduce((s,r)=>s+r.bills,0)),usd(rows.reduce((s,r)=>s+r.direct,0)),usd(allSav),usd(lastBal),''])
  ];

  // ── SHEET 2: Income Overview ────────────────────────────────
  const inc = [
    mk('T',[`${year} — Income Overview`]),
    mk('S',[`Base pay (biweekly) + Variable commission  ·  MTD & YTD totals`]),
    B(),
    mk('H',['Month','Paychecks','Per Paycheck','Commission','Starting Bal','Total In','vs Avg','Savings Rate']),
    ...rows.map(r=>{const diff=r.totalIn-avgIn;return mk('D',[r.label,usd(r.paychecks),usd(r.paychecks/2),usd(r.commission),usd(r.starting),usd(r.totalIn),diff>=0?`+${usd(diff)}`:`-${usd(Math.abs(diff))}`,`${r.sRate}%`]);}),
    B(),
    mk('TOT',['TOTAL / AVG','',usd(rows.reduce((s,r)=>s+r.paychecks,0)/Math.max(rows.length,1)/2),'',usd(rows.reduce((s,r)=>s+r.starting,0)),usd(allIn),`Avg: ${usd(avgIn)}`,pct(allSav,allIn)]),
    B(),
    mk('SEC',['Commission Detail']),
    mk('H',['Month','Commission','% of Income','Cumulative YTD','vs Prior Month','Running Avg']),
    ...(() => { let cum=0; return rows.map((r,i)=>{ cum+=r.commission; const diff=i>0?r.commission-rows[i-1].commission:0; return mk('D',[r.label,usd(r.commission),pct(r.commission,r.totalIn),usd(cum),i>0?(diff>=0?`+${usd(diff)}`:`-${usd(Math.abs(diff))}`):'—',usd(cum/Math.max(i+1,1))]); }); })(),
  ];

  // ── SHEET 3: Spending Overview ──────────────────────────────
  const allSubs=[...amexSubs.map(s=>({...s,card:'Amex'})),...boaSubs.map(s=>({...s,card:'BOA'}))];
  const spd = [
    mk('T',[`${year} — Spending Overview`]),
    mk('S',['Expenses by category  ·  MTD vs Budget  ·  Recurring vs One-Time']),
    B(),
    mk('H',['Category','MTD Actual','Budget/Mo','Difference','YTD Total','Monthly Avg','Type']),
    ...[ {l:'Amex Card',mtd:latest?.amex||0,bud:budSubs*.65,ytd:rows.reduce((s,r)=>s+r.amex,0),type:'Recurring'},
         {l:'BOA Card', mtd:latest?.boa||0, bud:budSubs*.35,ytd:rows.reduce((s,r)=>s+r.boa,0), type:'Recurring'},
         {l:'Fixed Bills',mtd:latest?.bills||0,bud:budBills, ytd:rows.reduce((s,r)=>s+r.bills,0),type:'Recurring'},
         {l:'Direct / One-Time',mtd:latest?.direct||0,bud:0,ytd:rows.reduce((s,r)=>s+r.direct,0),type:'One-Time'},
         {l:'Goal Savings',mtd:latest?.savings||0,bud:budSavings,ytd:rows.reduce((s,r)=>s+r.savings,0),type:'Recurring'},
    ].map(e=>{const diff=e.mtd-e.bud;return mk('D',[e.l,usd(e.mtd),e.bud>0?usd(e.bud):'Variable',e.bud>0?(diff>0?`+${usd(diff)} OVER`:`${usd(Math.abs(diff))} UNDER`):'—',usd(e.ytd),usd(e.ytd/Math.max(rows.length,1)),e.type]);}),
    B(),
    mk('TOT',['TOTAL',usd((latest?.expenses||0)+(latest?.savings||0)),usd(budBills+budSubs+budSavings),'',usd(allExp+allSav),usd((allExp+allSav)/Math.max(rows.length,1)),'']),
    B(),
    mk('SEC',['Month-by-Month Spending']),
    mk('H',['Month','Total Expenses','Cards','Bills','Direct','Savings','% of Income','vs Prior Month']),
    ...rows.map((r,i)=>{const diff=i>0?r.expenses-rows[i-1].expenses:0;return mk('D',[r.label,usd(r.expenses),usd(r.debt),usd(r.bills),usd(r.direct),usd(r.savings),pct(r.expenses,r.totalIn),i>0?(diff>=0?`+${usd(diff)}`:`-${usd(Math.abs(diff))}`):'—']);}),
    B(),
    mk('SEC',['Subscriptions']),
    mk('H',['Service','Card','Monthly','Annual','% of Sub Budget']),
    ...allSubs.map(s=>mk('D',[s.label,s.card,usd(s.amount),usd(s.amount*12),pct(s.amount,budSubs)])),
    B(),
    mk('TOT',['TOTAL SUBSCRIPTIONS','',usd(budSubs),usd(budSubs*12),pct(budSubs,budBills+budSubs)]),
  ];

  // ── SHEET 4: Debt & Goals ───────────────────────────────────
  const camaroG=goalsConfig.find(g=>g.label.toLowerCase().includes('camaro')||g.id===5);
  const camaroContribs=camaroG?rows.map(r=>cur((months[r.key].goalContributions||{})[camaroG.id])).filter(v=>v>0):[];
  const camaroPace=camaroContribs.length?camaroContribs.reduce((s,v)=>s+v,0)/camaroContribs.length:(camaroG?.monthly||0);

  const dbt = [
    mk('T',[`${year} — Debt & Goals`]),
    mk('S',['Credit card balances  ·  Savings goal progress  ·  Projected payoff dates']),
    B(),
    mk('SEC',['Credit Card Debt']),
    mk('H',['Card','This Month Paid','Prev Month','Change','Est. Minimum','Due Date','YTD Paid','Trend']),
    ...[{c:'American Express',mtd:latest?.amex||0,prev:prev?.amex||0,due:'4th',ytd:rows.reduce((s,r)=>s+r.amex,0)},
        {c:'Bank of America', mtd:latest?.boa||0, prev:prev?.boa||0, due:'17th',ytd:rows.reduce((s,r)=>s+r.boa,0)}]
      .map(d=>{const diff=d.mtd-d.prev;return mk('D',[d.c,usd(d.mtd),usd(d.prev),diff===0?'No change':diff>0?`+${usd(diff)}`:`-${usd(Math.abs(diff))}`,usd(Math.max(25,Math.round(d.mtd*0.02))),`${d.due} of month`,usd(d.ytd),diff<=0?'Paying Down ↓':'Growing ↑']);}),
    mk('TOT',['TOTAL DEBT',usd(latest?.debt||0),usd(prev?.debt||0),(latest?.debt||0)<=(prev?.debt||0)?`-${usd((prev?.debt||0)-(latest?.debt||0))} ↓`:`+${usd((latest?.debt||0)-(prev?.debt||0))} ↑`,usd(Math.max(50,Math.round((latest?.debt||0)*0.02))),'',usd(rows.reduce((s,r)=>s+r.debt,0)),(latest?.debt||0)<=(prev?.debt||0)?'Paying Down ↓':'Growing ↑']),
    B(),
    mk('SEC',['Savings Goals']),
    mk('H',['Goal','Type','Target','Total Saved','Remaining','Progress','Monthly Target / Pace','Projected Date']),
    ...goalsConfig.map(g=>{
      const saved=cur(goalSaved[g.id]),target=cur(goalTargets[g.id]||g.target),rem=Math.max(0,target-saved);
      const pace=g.id===camaroG?.id?camaroPace:(g.monthly||0);
      const mLeft=pace>0?Math.ceil(rem/pace):null;
      const proj=mLeft?(() => {const d=new Date();d.setMonth(d.getMonth()+mLeft);return d.toLocaleDateString('en-US',{month:'long',year:'numeric'});})():'—';
      return mk('D',[clean(g.label),g.type,usd(target),usd(saved),usd(rem),`${target>0?Math.round((saved/target)*100):0}%`,usd(pace)+'/mo',proj]);
    }),
    B(),
    mk('TOT',['ALL GOALS','',usd(Object.values(goalTargets).reduce((s,v)=>s+cur(v),0)),usd(allGT),usd(Math.max(0,Object.values(goalTargets).reduce((s,v)=>s+cur(v),0)-allGT)),pct(allGT,Object.values(goalTargets).reduce((s,v)=>s+cur(v),0)),usd(goalsConfig.reduce((s,g)=>s+g.monthly,0))+'/mo',''])
  ];

  // ── SHEET 5: Financial Summary ──────────────────────────────
  const dDiff=(latest?.debt||0)-(prev?.debt||0);
  const netCF=(latest?.totalIn||0)-(latest?.expenses||0)-(latest?.savings||0);
  const safe=Math.max(0,(latest?.balance||0)-(budBills+budSubs));
  const sum = [
    mk('T',[`${latest?.label||year} — Financial Summary`]),
    mk('S',[`Auto-synced: ${now}  ·  MTD = this month  ·  Complete snapshot`]),
    B(),
    mk('SEC',['INCOME']),
    mk('H',['Source','MTD Amount','Per Paycheck','YTD Total','YTD Avg/Mo','% of Income','Frequency']),
    mk('D',['Base Pay (×2 biweekly)',usd(latest?.paychecks||0),usd((latest?.paychecks||0)/2),usd(rows.reduce((s,r)=>s+r.paychecks,0)),usd(rows.reduce((s,r)=>s+r.paychecks,0)/Math.max(rows.length,1)),pct(latest?.paychecks||0,latest?.totalIn||1),'Biweekly']),
    mk('D',['Variable Commission',usd(latest?.commission||0),usd(latest?.commission||0),usd(rows.reduce((s,r)=>s+r.commission,0)),usd(rows.reduce((s,r)=>s+r.commission,0)/Math.max(rows.length,1)),pct(latest?.commission||0,latest?.totalIn||1),'Monthly variable']),
    mk('D',['Starting Balance (carry)',usd(latest?.starting||0),usd(latest?.starting||0),usd(rows.reduce((s,r)=>s+r.starting,0)),usd(rows.reduce((s,r)=>s+r.starting,0)/Math.max(rows.length,1)),pct(latest?.starting||0,latest?.totalIn||1),'Carried forward']),
    mk('TOT',['TOTAL INCOME',usd(latest?.totalIn||0),usd((latest?.totalIn||0)/2),usd(allIn),usd(avgIn),'100%','']),
    B(),
    mk('SEC',['EXPENSES']),
    mk('H',['Category','MTD Actual','Budget/Mo','Over/Under','YTD Total','% of Income','Type']),
    ...[{l:'Amex Card',mtd:latest?.amex||0,bud:budSubs*.65,ytd:rows.reduce((s,r)=>s+r.amex,0),type:'Recurring'},
        {l:'BOA Card', mtd:latest?.boa||0, bud:budSubs*.35,ytd:rows.reduce((s,r)=>s+r.boa,0), type:'Recurring'},
        {l:'Fixed Bills',mtd:latest?.bills||0,bud:budBills,ytd:rows.reduce((s,r)=>s+r.bills,0),type:'Recurring'},
        {l:'Direct / One-Time',mtd:latest?.direct||0,bud:0,ytd:rows.reduce((s,r)=>s+r.direct,0),type:'One-Time'},
    ].map(e=>{const diff=e.mtd-e.bud;return mk('D',[e.l,usd(e.mtd),e.bud>0?usd(e.bud):'Variable',e.bud>0?(diff>0?`+${usd(diff)} OVER`:`${usd(Math.abs(diff))} UNDER`):'—',usd(e.ytd),pct(e.mtd,latest?.totalIn||1),e.type]);}),
    mk('TOT',['TOTAL EXPENSES',usd(latest?.expenses||0),usd(budBills+budSubs),'',usd(allExp),pct(latest?.expenses||0,latest?.totalIn||1),'']),
    B(),
    mk('SEC',['DEBT']),
    mk('H',['Card','Paid This Month','Paid Last Month','Change','Est. Minimum','Due Date','Trend']),
    mk('D',['American Express',usd(latest?.amex||0),usd(prev?.amex||0),(latest?.amex||0)<=(prev?.amex||0)?'↓ Down':'↑ Up',usd(Math.max(25,Math.round((latest?.amex||0)*0.02))),'4th of month',(latest?.amex||0)<=(prev?.amex||0)?'Paying Down ↓':'Growing ↑']),
    mk('D',['Bank of America',usd(latest?.boa||0),usd(prev?.boa||0),(latest?.boa||0)<=(prev?.boa||0)?'↓ Down':'↑ Up',usd(Math.max(25,Math.round((latest?.boa||0)*0.02))),'17th of month',(latest?.boa||0)<=(prev?.boa||0)?'Paying Down ↓':'Growing ↑']),
    mk('TOT',['TOTAL DEBT',usd(latest?.debt||0),usd(prev?.debt||0),dDiff<=0?`-${usd(Math.abs(dDiff))} ↓`:`+${usd(dDiff)} ↑`,usd(Math.max(50,Math.round((latest?.debt||0)*0.02))),'',dDiff<=0?'Paying Down ↓':'Growing ↑']),
    B(),
    ...(() => {
      if(!camaroG) return [];
      const cId=camaroG.id,cSaved=cur(goalSaved[cId]),cTarget=cur(goalTargets[cId]||camaroG.target);
      const cRem=Math.max(0,cTarget-cSaved),cPct=cTarget>0?Math.round((cSaved/cTarget)*100):0;
      const mLeft=camaroPace>0?Math.ceil(cRem/camaroPace):null;
      const proj=mLeft?(() => {const d=new Date();d.setMonth(d.getMonth()+mLeft);return d.toLocaleDateString('en-US',{month:'long',year:'numeric'});})():'Set a monthly amount';
      return [
        mk('SEC',[`SAVINGS GOAL — ${clean(camaroG.label)}`]),
        mk('H',['Target','Saved','Remaining','Progress','Avg Monthly Pace','Months Left','Projected Date']),
        mk('D',[usd(cTarget),usd(cSaved),usd(cRem),`${cPct}%`,usd(camaroPace),mLeft?String(mLeft):'—',proj]),
        mk('D',[`Progress: [${'█'.repeat(Math.round(cPct/5))}${'░'.repeat(20-Math.round(cPct/5))}] ${cPct}% of ${usd(cTarget)} goal`,'','','','','','']),
        B(),
      ];
    })(),
    mk('SEC',['NET SUMMARY']),
    mk('H',['Net Cash Flow','Safe-to-Spend','Debt Trend','Savings Rate','Net Worth','YTD Saved','Months Tracked']),
    mk('TOT',[usd(netCF),usd(safe),dDiff<=0?`Paying Down (${usd(Math.abs(dDiff))} less)`:(`Growing (${usd(dDiff)} more)`),pct(latest?.savings||0,latest?.totalIn||1),usd(nw),usd(allSav),String(rows.length)]),
  ];

  const names = ['Cash Flow Overview','Income Overview','Spending Overview','Debt & Goals','Financial Summary'];
  const sheets = [cf,inc,spd,dbt,sum];
  return names.map((name,i)=>({name, rows:sheets[i].map(r=>r.r||['']), types:sheets[i].map(r=>r.t)}));
}

// ── EXPORT TO EXCEL / GOOGLE SHEETS ──────────────────────────
async function exportToSheets({months, goalSaved, goalTargets, goalsConfig, amexSubs, boaSubs, sortedKeys, billTemplates, mode='download', googleClientId=''}) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator='My Budget App'; wb.created=new Date();
  const now  = new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const year = new Date().getFullYear();
  const cur  = n => isNaN(n)||n==null?0:+n;
  const usd  = n => { const v=Math.abs(cur(n)); return (cur(n)<0?'-':'')+`$${v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`; };
  const pct  = (a,b) => b>0?`${Math.round((a/b)*100)}%`:'0%';
  const num  = n => cur(n).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});
  const clean = s => String(s||'').replace(/[^\x00-\x7F]/g,'').trim();
  const trend = (curr,prev) => curr<prev?'↓ Down':curr>prev?'↑ Up':'→ Flat';

  // ── LIGHT PROFESSIONAL COLOR PALETTE ──
  const NAV   = {argb:'FF1B3A6B'}; // deep navy  — section headers
  const NAV2  = {argb:'FF2A5496'}; // mid navy
  const WTEXT = {argb:'FFFFFFFF'}; // white text on dark bg
  const DARK  = {argb:'FF1A1A2E'}; // near-black text
  const DIM   = {argb:'FF5A6272'}; // muted gray text
  const GREEN = {argb:'FF186A3B'}; // forest green text
  const RED   = {argb:'FF8B2020'}; // burgundy text
  const BLUE  = {argb:'FF1B3A6B'}; // navy text
  const PURP  = {argb:'FF3D2775'}; // grape text
  const TEAL  = {argb:'FF1A4A56'}; // dark teal text
  const AMB   = {argb:'FF7A4A10'}; // amber text
  const ORNG  = {argb:'FF8B3D10'}; // copper text

  const fill  = argb=>({type:'pattern',pattern:'solid',fgColor:{argb}});
  const F_WHITE='FFFFFFFF', F_LGRAY='FFF5F7FA', F_MGRAY='FFE8ECF3';
  const F_NAV ='FF1B3A6B', F_NAV2='FF2A5496', F_CHDR='FFD6E4F7';
  const F_GRN ='FFDFF5E9', F_RED='FFF9E8E8', F_BLU='FFE4EEFF';
  const F_PRP ='FFEDE9FF', F_AMB='FFFFF0D6', F_TEL='FFD8EEF3';

  const fnt  = (color,size=10,bold=false)=>({color,size,bold,name:'Calibri'});
  const aln  = (h='left',v='middle')=>({horizontal:h,vertical:v,wrapText:false});
  const bot  = (col=NAV,thick=false)=>({bottom:{style:thick?'medium':'thin',color:col}});
  const top  = (col=NAV,thick=true) =>({top:{style:thick?'medium':'thin',color:col}});
  const box  = (col={argb:'FFD0D5DD'})=>({top:{style:'thin',color:col},bottom:{style:'thin',color:col},left:{style:'thin',color:col},right:{style:'thin',color:col}});

  const sty  = (cell,opts={})=>{
    if(opts.fill)      cell.fill=opts.fill;
    if(opts.font)      cell.font=opts.font;
    if(opts.alignment) cell.alignment=opts.alignment;
    if(opts.border)    cell.border=opts.border;
    if(opts.numFmt)    cell.numFmt=opts.numFmt;
  };

  // ── per-month calculations ──
  const rows = [...sortedKeys].reverse().map(key=>{
    const m=months[key];
    const starting  =cur(m.startingBalance);
    const paychecks =m.paychecks.reduce((s,p)=>s+cur(p.amount),0);
    const commission=cur(m.commission?.amount);
    const totalIn   =starting+paychecks+commission;
    const amex      =m.amex?.paid?cur(m.amex?.statementBalance):0;
    const boa       =m.boa?.paid?cur(m.boa?.statementBalance):0;
    const bills     =m.bills.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0);
    const direct    =(m.directTransactions||[]).reduce((s,t)=>s+cur(t.amount),0);
    const savings   =Object.entries(m.goalContributions||{}).filter(([id])=>!goalsConfig.find(g=>String(g.id)===id)?.preTax).reduce((s,[,v])=>s+cur(v),0);
    const expenses  =amex+boa+bills+direct;
    const balance   =totalIn-expenses-savings;
    const debt      =amex+boa;
    const sRate     =totalIn>0?Math.round((savings/totalIn)*100):0;
    return {key,label:monthLabel(key),starting,paychecks,commission,totalIn,amex,boa,bills,direct,savings,expenses,balance,debt,sRate};
  });

  const allIn   =rows.reduce((s,r)=>s+r.totalIn,0);
  const allExp  =rows.reduce((s,r)=>s+r.expenses,0);
  const allSav  =rows.reduce((s,r)=>s+r.savings,0);
  const allGT   =Object.values(goalSaved).reduce((s,v)=>s+cur(v),0);
  const latest  =rows[rows.length-1];
  const prev    =rows.length>1?rows[rows.length-2]:null;
  const lastBal =latest?.balance||0;
  const nw      =allGT+Math.max(0,lastBal);
  const avgIn   =rows.length?allIn/rows.length:0;
  const avgExp  =rows.length?allExp/rows.length:0;
  const avgSav  =rows.length?allSav/rows.length:0;
  const budBills=(billTemplates||[]).reduce((s,b)=>s+b.amount,0);
  const budSubs =[...amexSubs,...boaSubs].reduce((s,x)=>s+x.amount,0);
  const budSavings=goalsConfig.reduce((s,g)=>s+g.monthly,0);

  // ── sheet factory ──
  const addWS = (name,cols)=>{
    const ws=wb.addWorksheet(name,{views:[{showGridLines:false}],pageSetup:{paperSize:9,orientation:'landscape',fitToPage:true}});
    ws.columns=cols.map(w=>({width:w})); return ws;
  };

  const titleRow=(ws,text,cols=8)=>{
    const r=ws.addRow([text]); r.height=38;
    ws.mergeCells(`A${r.number}:${String.fromCharCode(64+cols)}${r.number}`);
    sty(r.getCell(1),{fill:fill(F_NAV),font:fnt(WTEXT,20,true),alignment:aln('left')});
  };
  const subRow=(ws,text,cols=8)=>{
    const r=ws.addRow([text]); r.height=20;
    ws.mergeCells(`A${r.number}:${String.fromCharCode(64+cols)}${r.number}`);
    sty(r.getCell(1),{fill:fill(F_NAV2),font:fnt(WTEXT,9),alignment:aln('left')});
  };
  const secRow=(ws,text,cols=8,color=F_NAV)=>{
    ws.addRow([]).height=6;
    const r=ws.addRow([`  ${text}`]); r.height=22;
    ws.mergeCells(`A${r.number}:${String.fromCharCode(64+cols)}${r.number}`);
    sty(r.getCell(1),{fill:fill(color),font:fnt(WTEXT,11,true),alignment:aln('left')});
  };
  const hdrRow=(ws,labels,colors)=>{
    const r=ws.addRow(labels); r.height=20;
    labels.forEach((_,i)=>sty(r.getCell(i+1),{fill:fill(F_CHDR),font:fnt(colors[i]||BLUE,9,true),alignment:aln('center'),border:{...box({argb:'FFB8CCEE'}),bottom:{style:'medium',color:NAV}}}));
    return r;
  };
  const dataRow=(ws,vals,textColors,idx=0,bgAlt=true)=>{
    const r=ws.addRow(vals); r.height=18;
    const bg=bgAlt&&idx%2===1?F_LGRAY:F_WHITE;
    vals.forEach((_,i)=>sty(r.getCell(i+1),{fill:fill(bg),font:fnt(textColors[i]||DARK,10,i===0),alignment:aln(i===0?'left':'center'),border:{bottom:{style:'thin',color:{argb:'FFE5E7EB'}}}}));
    return r;
  };
  const totRow=(ws,vals,textColors,topFill=F_BLU)=>{
    const r=ws.addRow(vals); r.height=22;
    vals.forEach((_,i)=>sty(r.getCell(i+1),{fill:fill(topFill),font:fnt(textColors[i]||BLUE,11,true),alignment:aln(i===0?'left':'center'),border:{top:{style:'medium',color:NAV},bottom:{style:'medium',color:NAV}}}));
    return r;
  };

  // ════════════════════════════════════════════════════════
  // SHEET 1 — CASH FLOW OVERVIEW
  // ════════════════════════════════════════════════════════
  const ws1=addWS('Cash Flow Overview',[22,14,13,13,13,13,13,13]);
  titleRow(ws1,`${latest?.label||year}  —  Cash Flow Overview`);
  subRow(ws1,`Generated ${now}  ·  ${rows.length} month${rows.length!==1?'s':''} of data  ·  All figures in USD`);
  ws1.addRow([]).height=8;

  // Key metrics — 6 tiles
  hdrRow(ws1,['NET WORTH','TOTAL INCOME','TOTAL EXPENSES','TOTAL SAVED','SAVINGS RATE','CURRENT BALANCE','MONTHS TRACKED','AVG MONTHLY IN'],
    [PURP,GREEN,RED,BLUE,TEAL,GREEN,DIM,GREEN]);
  const kv=ws1.addRow([usd(nw),usd(allIn),usd(allExp),usd(allSav),pct(allSav,allIn),usd(lastBal),String(rows.length),usd(avgIn)]);
  kv.height=28;
  [PURP,GREEN,RED,BLUE,TEAL,lastBal>=0?GREEN:RED,DIM,GREEN].forEach((col,i)=>sty(kv.getCell(i+1),{fill:fill(i===0?F_PRP:i===2?F_RED:i===3?F_BLU:F_WHITE),font:fnt(col,14,true),alignment:aln('center'),border:{bottom:{style:'medium',color:NAV}}}));

  ws1.addRow([]).height=10;

  // Monthly table
  secRow(ws1,'Monthly Cash Flow Detail');
  hdrRow(ws1,['Month','Start Bal','Paychecks','Commission','Total In','Cards Paid','Bills Paid','Direct Spend','Saved','Balance','Rate'],
    [DARK,TEAL,GREEN,AMB,GREEN,RED,RED,ORNG,PURP,BLUE,TEAL]);
  ws1.columns=[{width:20},{width:13},{width:13},{width:13},{width:13},{width:12},{width:12},{width:13},{width:12},{width:13},{width:10}];

  rows.forEach((r,idx)=>{
    const balC=r.balance>=0?GREEN:RED;
    dataRow(ws1,[r.label,usd(r.starting),usd(r.paychecks),usd(r.commission),usd(r.totalIn),usd(r.amex),usd(r.bills),usd(r.direct),usd(r.savings),usd(r.balance),`${r.sRate}%`],
      [DARK,TEAL,GREEN,AMB,GREEN,RED,RED,ORNG,PURP,balC,TEAL],idx);
  });

  // Budget comparison row
  const budTotals=[usd(avgIn),usd(budBills+budSubs),usd(budBills),usd(budSubs),usd(budSavings)];
  ws1.addRow([]).height=6;
  const budHdr=ws1.addRow(['MONTHLY BUDGET TARGETS','Expected Income','Expected Expenses','Fixed Bills','Subscriptions','Goal Savings','','','','','']);
  budHdr.height=18; ws1.mergeCells(`A${budHdr.number}:A${budHdr.number}`);
  sty(budHdr.getCell(1),{fill:fill(F_NAV2),font:fnt(WTEXT,9,true),alignment:aln()});
  [DARK,GREEN,RED,RED,ORNG,PURP].forEach((col,i)=>{
    if(i>0) sty(budHdr.getCell(i+1),{fill:fill(F_LGRAY),font:fnt(col,9,true),alignment:aln('center'),border:{bottom:{style:'thin',color:{argb:'FFD0D5DD'}}}});
  });
  const budVals=ws1.addRow(['',usd(avgIn),usd(budBills+budSubs),usd(budBills),usd(budSubs),usd(budSavings),'','','','','']);
  budVals.height=18;
  [DARK,GREEN,RED,RED,ORNG,PURP].forEach((col,i)=>sty(budVals.getCell(i+1),{fill:fill(F_WHITE),font:fnt(col,10),alignment:aln('center')}));

  // Totals
  ws1.addRow([]).height=4;
  totRow(ws1,['ALL TIME TOTALS','',usd(rows.reduce((s,r)=>s+r.paychecks,0)),usd(rows.reduce((s,r)=>s+r.commission,0)),usd(allIn),usd(rows.reduce((s,r)=>s+r.amex,0)),usd(rows.reduce((s,r)=>s+r.bills,0)),usd(rows.reduce((s,r)=>s+r.direct,0)),usd(allSav),usd(lastBal),''],
    [NAV,DIM,GREEN,AMB,GREEN,RED,RED,ORNG,PURP,lastBal>=0?GREEN:RED,TEAL]);

  // ════════════════════════════════════════════════════════
  // SHEET 2 — INCOME OVERVIEW
  // ════════════════════════════════════════════════════════
  const ws2=addWS('Income Overview',[22,14,14,14,14,12,13,14]);
  titleRow(ws2,`${year}  —  Income Overview`);
  subRow(ws2,`Base Pay (biweekly) + Variable Commission  ·  MTD = This Month  ·  YTD = ${rows.length} Months`);
  ws2.addRow([]).height=8;

  // MTD / YTD summary tiles
  hdrRow(ws2,['MTD INCOME','MTD PAYCHECKS','MTD COMMISSION','YTD INCOME','YTD PAYCHECKS','YTD COMMISSION','AVG MONTHLY','BEST MONTH'],
    [GREEN,GREEN,AMB,GREEN,GREEN,AMB,TEAL,PURP]);
  const ytdPay=rows.reduce((s,r)=>s+r.paychecks,0);
  const ytdCom=rows.reduce((s,r)=>s+r.commission,0);
  const best=rows.reduce((b,r)=>r.totalIn>b.totalIn?r:b,rows[0]||{totalIn:0,label:'—'});
  const itiles=ws2.addRow([usd(latest?.totalIn||0),usd(latest?.paychecks||0),usd(latest?.commission||0),usd(allIn),usd(ytdPay),usd(ytdCom),usd(avgIn),`${best.label}: ${usd(best.totalIn)}`]);
  itiles.height=28;
  [GREEN,GREEN,AMB,GREEN,GREEN,AMB,TEAL,PURP].forEach((col,i)=>sty(itiles.getCell(i+1),{fill:fill(F_GRN),font:fnt(col,13,true),alignment:aln('center'),border:{bottom:{style:'medium',color:NAV}}}));
  ws2.addRow([]).height=10;

  secRow(ws2,'Monthly Income Breakdown',8,'FF186A3B');
  hdrRow(ws2,['Month','Paychecks','Per Paycheck','Commission','Starting Bal','Total In','vs Average','Savings Rate'],
    [DARK,GREEN,GREEN,AMB,TEAL,GREEN,BLUE,PURP]);
  rows.forEach((r,idx)=>{
    const perPay=r.paychecks>0?r.paychecks/2:0;
    const diff=r.totalIn-avgIn;
    const diffStr=diff===0?'On avg':diff>0?`+${usd(diff)}`:`-${usd(Math.abs(diff))}`;
    dataRow(ws2,[r.label,usd(r.paychecks),usd(perPay),usd(r.commission),usd(r.starting),usd(r.totalIn),diffStr,`${r.sRate}%`],
      [DARK,GREEN,GREEN,AMB,TEAL,GREEN,diff>=0?GREEN:RED,PURP],idx);
  });
  totRow(ws2,['TOTAL / AVERAGE','',usd(ytdPay/Math.max(rows.length,1)/2),'',usd(rows.reduce((s,r)=>s+r.starting,0)),usd(allIn),`Avg: ${usd(avgIn)}`,pct(allSav,allIn)],
    [NAV,DIM,GREEN,DIM,TEAL,GREEN,TEAL,PURP]);

  ws2.addRow([]).height=10;
  secRow(ws2,'Commission Details',8,'FF186A3B');
  hdrRow(ws2,['Month','Commission','% of Total Income','Cumulative YTD','vs Prior Month','Running Avg','',''],
    [DARK,AMB,AMB,AMB,BLUE,TEAL,DIM,DIM]);
  let cumComm=0;
  rows.forEach((r,idx)=>{
    cumComm+=r.commission;
    const priorComm=idx>0?rows[idx-1].commission:0;
    const diff=r.commission-priorComm;
    dataRow(ws2,[r.label,usd(r.commission),pct(r.commission,r.totalIn),usd(cumComm),idx>0?(diff>=0?`+${usd(diff)}`:`-${usd(Math.abs(diff))}`):'—',usd(cumComm/Math.max(idx+1,1)),'',''],
      [DARK,AMB,AMB,AMB,diff>=0?GREEN:RED,TEAL,DIM,DIM],idx);
  });

  // ════════════════════════════════════════════════════════
  // SHEET 3 — SPENDING OVERVIEW
  // ════════════════════════════════════════════════════════
  const ws3=addWS('Spending Overview',[22,14,14,14,14,12,14,14]);
  titleRow(ws3,`${year}  —  Spending Overview`);
  subRow(ws3,`Expenses by Category  ·  MTD vs Budget  ·  Recurring vs One-Time`);
  ws3.addRow([]).height=8;

  // Spending tiles
  hdrRow(ws3,['MTD EXPENSES','MTD CARDS','MTD BILLS','MTD DIRECT','YTD EXPENSES','YTD CARDS','YTD BILLS','BUDGET/MO'],
    [RED,RED,RED,ORNG,RED,RED,RED,BLUE]);
  const stiles=ws3.addRow([usd(latest?.expenses||0),usd(latest?.debt||0),usd(latest?.bills||0),usd(latest?.direct||0),usd(allExp),usd(rows.reduce((s,r)=>s+r.debt,0)),usd(rows.reduce((s,r)=>s+r.bills,0)),usd(budBills+budSubs)]);
  stiles.height=28;
  [RED,RED,RED,ORNG,RED,RED,RED,BLUE].forEach((col,i)=>sty(stiles.getCell(i+1),{fill:fill(F_RED),font:fnt(col,13,true),alignment:aln('center'),border:{bottom:{style:'medium',color:NAV}}}));
  ws3.addRow([]).height=10;

  secRow(ws3,'Spending by Category — MTD vs Budget',8,'FF8B2020');
  hdrRow(ws3,['Category','MTD Actual','Monthly Budget','Over/Under','$ Diff','YTD Total','Monthly Avg','Type'],
    [DARK,RED,BLUE,GREEN,AMB,PURP,TEAL,DIM]);
  const cats=[
    {label:'Amex Card',    mtd:latest?.amex||0,   bud:budSubs*.65,   ytd:rows.reduce((s,r)=>s+r.amex,0),   type:'Recurring'},
    {label:'BOA Card',     mtd:latest?.boa||0,    bud:budSubs*.35,   ytd:rows.reduce((s,r)=>s+r.boa,0),    type:'Recurring'},
    {label:'Fixed Bills',  mtd:latest?.bills||0,  bud:budBills,      ytd:rows.reduce((s,r)=>s+r.bills,0),  type:'Recurring'},
    {label:'Direct Spend', mtd:latest?.direct||0, bud:0,             ytd:rows.reduce((s,r)=>s+r.direct,0), type:'One-Time'},
    {label:'Goal Savings', mtd:latest?.savings||0,bud:budSavings,    ytd:rows.reduce((s,r)=>s+r.savings,0),type:'Recurring'},
  ];
  cats.forEach((c,idx)=>{
    const diff=c.mtd-c.bud, avg=rows.length?c.ytd/rows.length:0;
    const diffStr=c.bud===0?'No budget':diff===0?'On budget':diff>0?'Over budget':'Under budget';
    dataRow(ws3,[c.label,usd(c.mtd),c.bud>0?usd(c.bud):'Variable',diffStr,c.bud>0?(diff>=0?`+${usd(diff)}`:`-${usd(Math.abs(diff))}`):'—',usd(c.ytd),usd(avg),c.type],
      [DARK,RED,BLUE,diff>0&&c.bud>0?RED:GREEN,diff>0&&c.bud>0?RED:GREEN,PURP,TEAL,DIM],idx);
  });
  totRow(ws3,['TOTAL',''+usd((latest?.expenses||0)+(latest?.savings||0)),usd(budBills+budSubs+budSavings),'','',''+usd(allExp+allSav),usd((allExp+allSav)/Math.max(rows.length,1)),''],
    [NAV,RED,BLUE,DIM,DIM,PURP,TEAL,DIM]);

  ws3.addRow([]).height=10;
  secRow(ws3,'Month-by-Month Spending',8,'FF8B2020');
  hdrRow(ws3,['Month','Total Expenses','Cards','Bills','Direct','Savings','% of Income','vs Prior Mo'],
    [DARK,RED,RED,RED,ORNG,PURP,TEAL,BLUE]);
  rows.forEach((r,idx)=>{
    const priorExp=idx>0?rows[idx-1].expenses:0;
    const diff=r.expenses-priorExp;
    const diffStr=idx>0?(diff>=0?`+${usd(diff)}`:`-${usd(Math.abs(diff))}`):'—';
    dataRow(ws3,[r.label,usd(r.expenses),usd(r.debt),usd(r.bills),usd(r.direct),usd(r.savings),pct(r.expenses,r.totalIn),diffStr],
      [DARK,RED,RED,RED,ORNG,PURP,TEAL,diff>=0?RED:GREEN],idx);
  });

  // Subscriptions breakdown
  ws3.addRow([]).height=10;
  secRow(ws3,'Recurring Subscriptions',8,'FF8B2020');
  hdrRow(ws3,['Service','Card','Monthly Cost','Annual Cost','% of Budget','','',''],
    [DARK,BLUE,RED,RED,AMB,DIM,DIM,DIM]);
  const allSubs=[...amexSubs.map(s=>({...s,card:'Amex'})),...boaSubs.map(s=>({...s,card:'BOA'}))];
  allSubs.forEach((s,idx)=>{
    dataRow(ws3,[s.label,s.card,usd(s.amount),usd(s.amount*12),pct(s.amount,budSubs),'','',''],
      [DARK,BLUE,RED,RED,AMB,DIM,DIM,DIM],idx);
  });
  totRow(ws3,['TOTAL SUBSCRIPTIONS','',usd(budSubs),usd(budSubs*12),pct(budSubs,budBills+budSubs),'','',''],
    [NAV,DIM,RED,RED,AMB,DIM,DIM,DIM]);

  // ════════════════════════════════════════════════════════
  // SHEET 4 — DEBT & GOALS
  // ════════════════════════════════════════════════════════
  const ws4=addWS('Debt & Goals',[26,14,14,14,13,13,14,14]);
  titleRow(ws4,`${year}  —  Debt & Goals`);
  subRow(ws4,`Credit Card Balances  ·  Savings Goal Progress  ·  Projected Payoff Dates`);
  ws4.addRow([]).height=8;

  secRow(ws4,'Credit Card Debt Overview',8,'FF7A4A10');
  hdrRow(ws4,['Card','This Month Paid','Prev Month Paid','Change','Est. Minimum','Due Date','YTD Paid','MoM Trend'],
    [DARK,RED,RED,BLUE,AMB,TEAL,PURP,GREEN]);
  [
    {label:'American Express',mtd:latest?.amex||0,prev:prev?.amex||0,due:'4th of month',ytd:rows.reduce((s,r)=>s+r.amex,0)},
    {label:'Bank of America', mtd:latest?.boa||0, prev:prev?.boa||0, due:'17th of month',ytd:rows.reduce((s,r)=>s+r.boa,0)},
  ].forEach((d,idx)=>{
    const diff=d.mtd-d.prev, min=Math.max(25,Math.round(d.mtd*0.02));
    dataRow(ws4,[d.label,usd(d.mtd),usd(d.prev),diff===0?'No change':diff>0?`+${usd(diff)}`:`-${usd(Math.abs(diff))}`,usd(min),d.due,usd(d.ytd),trend(d.mtd,d.prev)],
      [DARK,RED,RED,diff>0?RED:GREEN,AMB,TEAL,PURP,diff<=0?GREEN:RED],idx);
  });
  const totDebt=(latest?.debt||0),prevDebt=(prev?.debt||0),dDiff=totDebt-prevDebt;
  totRow(ws4,['TOTAL DEBT PAID',usd(totDebt),usd(prevDebt),dDiff===0?'No change':dDiff>0?`+${usd(dDiff)}`:`-${usd(Math.abs(dDiff))}`,usd(Math.max(50,Math.round(totDebt*0.02))),'',usd(rows.reduce((s,r)=>s+r.debt,0)),trend(totDebt,prevDebt)],
    [NAV,RED,RED,dDiff>0?RED:GREEN,AMB,DIM,PURP,dDiff<=0?GREEN:RED]);

  ws4.addRow([]).height=10;
  secRow(ws4,'Savings Goals Progress',8,'FF3D2775');
  hdrRow(ws4,['Goal','Type','Target','Total Saved','Remaining','Progress %','Monthly Target','Projected Date'],
    [DARK,DIM,GREEN,PURP,RED,TEAL,BLUE,AMB]);

  let camaroMonthlyAvg=0;
  const camaroG=goalsConfig.find(g=>g.label.toLowerCase().includes('camaro')||g.id===5);
  if(camaroG){
    const cId=camaroG.id;
    const contribs=rows.map(r=>cur((months[r.key].goalContributions||{})[cId])).filter(v=>v>0);
    camaroMonthlyAvg=contribs.length?contribs.reduce((s,v)=>s+v,0)/contribs.length:camaroG.monthly||0;
  }

  goalsConfig.forEach((g,idx)=>{
    const saved=cur(goalSaved[g.id]); const target=cur(goalTargets[g.id]||g.target);
    const rem=Math.max(0,target-saved); const prog=target>0?Math.round((saved/target)*100):0;
    const pace=g.id===camaroG?.id?camaroMonthlyAvg:(g.monthly||0);
    const mLeft=pace>0?Math.ceil(rem/pace):null;
    const projDate=mLeft?(() => {const d=new Date();d.setMonth(d.getMonth()+mLeft);return d.toLocaleDateString('en-US',{month:'long',year:'numeric'});})():'—';
    dataRow(ws4,[clean(g.label),g.type,usd(target),usd(saved),usd(rem),`${prog}%`,usd(pace),projDate],
      [DARK,DIM,GREEN,PURP,rem>0?RED:GREEN,prog>=100?GREEN:TEAL,BLUE,AMB],idx);
  });
  const totalTarget=Object.values(goalTargets).reduce((s,v)=>s+cur(v),0);
  totRow(ws4,['ALL GOALS','',usd(totalTarget),usd(allGT),usd(Math.max(0,totalTarget-allGT)),pct(allGT,totalTarget),usd(goalsConfig.reduce((s,g)=>s+g.monthly,0)),''],
    [NAV,DIM,GREEN,PURP,RED,TEAL,BLUE,DIM]);

  // ════════════════════════════════════════════════════════
  // SHEET 5 — FINANCIAL SUMMARY
  // ════════════════════════════════════════════════════════
  const ws5=addWS('Financial Summary',[26,15,15,15,15,15,16]);
  titleRow(ws5,`${latest?.label||year}  —  Financial Summary`,7);
  subRow(ws5,`Complete financial snapshot  ·  MTD = this month  ·  YTD = all ${rows.length} months`,7);
  ws5.addRow([]).height=8;

  // ── INCOME ──
  secRow(ws5,'INCOME',7,'FF186A3B');
  hdrRow(ws5,['Source','MTD Amount','Per Paycheck','YTD Total','YTD Avg/Mo','% of MTD Income','Frequency'],
    [DARK,GREEN,GREEN,GREEN,GREEN,TEAL,DIM]);
  [
    {label:'Base Pay (×2 biweekly)', mtd:latest?.paychecks||0, ytd:ytdPay,  freq:'Biweekly', each:(latest?.paychecks||0)/2},
    {label:'Variable Commission',    mtd:latest?.commission||0,ytd:ytdCom,  freq:'Monthly variable', each:latest?.commission||0},
    {label:'Starting Balance (carried)',mtd:latest?.starting||0,ytd:rows.reduce((s,r)=>s+r.starting,0),freq:'Carried over',each:latest?.starting||0},
  ].forEach((s,idx)=>{
    dataRow(ws5,[s.label,usd(s.mtd),usd(s.each),usd(s.ytd),usd(s.ytd/Math.max(rows.length,1)),pct(s.mtd,latest?.totalIn||1),s.freq],
      [DARK,GREEN,GREEN,GREEN,GREEN,TEAL,DIM],idx);
  });
  totRow(ws5,['TOTAL INCOME',usd(latest?.totalIn||0),usd((latest?.totalIn||0)/2),usd(allIn),usd(avgIn),'100%',''],
    [NAV,GREEN,GREEN,GREEN,GREEN,TEAL,DIM],F_GRN);

  ws5.addRow([]).height=8;

  // ── EXPENSES ──
  secRow(ws5,'EXPENSES',7,'FF8B2020');
  hdrRow(ws5,['Category','MTD Actual','Budget/Mo','Over/Under','YTD Total','% of Income','Type'],
    [DARK,RED,BLUE,GREEN,PURP,TEAL,DIM]);
  [
    {label:'Amex Card',    mtd:latest?.amex||0,   bud:budSubs*.65, ytd:rows.reduce((s,r)=>s+r.amex,0),   type:'Recurring'},
    {label:'BOA Card',     mtd:latest?.boa||0,    bud:budSubs*.35, ytd:rows.reduce((s,r)=>s+r.boa,0),    type:'Recurring'},
    {label:'Fixed Bills',  mtd:latest?.bills||0,  bud:budBills,    ytd:rows.reduce((s,r)=>s+r.bills,0),  type:'Recurring'},
    {label:'Direct / One-Time',mtd:latest?.direct||0,bud:0,       ytd:rows.reduce((s,r)=>s+r.direct,0), type:'One-Time'},
  ].forEach((e,idx)=>{
    const diff=e.mtd-e.bud;
    dataRow(ws5,[e.label,usd(e.mtd),e.bud>0?usd(e.bud):'Variable',e.bud>0?(diff>0?`+${usd(diff)} OVER`:`${usd(Math.abs(diff))} UNDER`):'—',usd(e.ytd),pct(e.mtd,latest?.totalIn||1),e.type],
      [DARK,RED,BLUE,diff>0&&e.bud>0?RED:GREEN,PURP,TEAL,DIM],idx);
  });
  totRow(ws5,['TOTAL EXPENSES',usd(latest?.expenses||0),usd(budBills+budSubs),'',usd(allExp),pct(latest?.expenses||0,latest?.totalIn||1),''],
    [NAV,RED,BLUE,DIM,PURP,TEAL,DIM],F_RED);

  ws5.addRow([]).height=8;

  // ── DEBT ──
  secRow(ws5,'DEBT',7,'FF7A4A10');
  hdrRow(ws5,['Card','Paid This Month','Paid Last Month','Change','Est. Min Payment','Due Date','Trend'],
    [DARK,RED,RED,BLUE,AMB,TEAL,GREEN]);
  [
    {card:'Amex',mtd:latest?.amex||0,prev:prev?.amex||0,due:'4th'},
    {card:'BOA', mtd:latest?.boa||0, prev:prev?.boa||0, due:'17th'},
  ].forEach((d,idx)=>{
    const diff=d.mtd-d.prev;
    dataRow(ws5,[`${d.card} Credit Card`,usd(d.mtd),usd(d.prev),diff===0?'No change':diff>0?`+${usd(diff)}`:`-${usd(Math.abs(diff))}`,usd(Math.max(25,Math.round(d.mtd*0.02))),`${d.due} of month`,trend(d.mtd,d.prev)],
      [DARK,RED,RED,diff>0?RED:GREEN,AMB,TEAL,diff<=0?GREEN:RED],idx);
  });
  totRow(ws5,['TOTAL DEBT',usd(totDebt),usd(prevDebt),dDiff===0?'Flat':dDiff>0?`+${usd(dDiff)} more`:`-${usd(Math.abs(dDiff))} less`,usd(Math.max(50,Math.round(totDebt*0.02))),'',dDiff<=0?'Paying Down ↓':'Growing ↑'],
    [NAV,RED,RED,dDiff>0?RED:GREEN,AMB,DIM,dDiff<=0?GREEN:RED],F_AMB);

  ws5.addRow([]).height=8;

  // ── CAMARO GOAL ──
  if(camaroG){
    secRow(ws5,`SAVINGS GOAL — ${clean(camaroG.label)}`,7,'FF3D2775');
    const cId=camaroG.id, cSaved=cur(goalSaved[cId]), cTarget=cur(goalTargets[cId]||camaroG.target);
    const cRem=Math.max(0,cTarget-cSaved), cPct=cTarget>0?Math.round((cSaved/cTarget)*100):0;
    const mLeft=camaroMonthlyAvg>0?Math.ceil(cRem/camaroMonthlyAvg):null;
    const projDate=mLeft?(() => {const d=new Date();d.setMonth(d.getMonth()+mLeft);return d.toLocaleDateString('en-US',{month:'long',year:'numeric'});})():'Set a monthly amount';
    hdrRow(ws5,['Goal Target','Total Saved','Remaining','Progress %','Avg Monthly Pace','Months Left','Projected Date'],
      [DARK,GREEN,RED,TEAL,BLUE,AMB,PURP]);
    dataRow(ws5,[usd(cTarget),usd(cSaved),usd(cRem),`${cPct}%`,usd(camaroMonthlyAvg),mLeft?String(mLeft):'—',projDate],
      [DARK,GREEN,RED,TEAL,BLUE,AMB,PURP],0,false);
    const bar='█'.repeat(Math.round(cPct/5))+'░'.repeat(20-Math.round(cPct/5));
    const barR=ws5.addRow([`Progress: [${bar}]  ${cPct}% complete  ·  ${usd(cSaved)} saved of ${usd(cTarget)} goal`]);
    barR.height=20; ws5.mergeCells(`A${barR.number}:G${barR.number}`);
    sty(barR.getCell(1),{fill:fill(F_PRP),font:{...fnt(PURP,10),name:'Courier New'},alignment:aln('left')});
  }

  ws5.addRow([]).height=8;

  // ── SUMMARY ROW ──
  secRow(ws5,'NET SUMMARY',7,'FF1B3A6B');
  hdrRow(ws5,['Net Cash Flow','Safe-to-Spend','Debt Trend','Savings Rate','Net Worth','YTD Saved','Months Tracked'],
    [GREEN,TEAL,AMB,PURP,BLUE,GREEN,DIM]);
  const netCF=(latest?.totalIn||0)-(latest?.expenses||0)-(latest?.savings||0);
  const safe=Math.max(0,(latest?.balance||0)-(budBills+budSubs));
  const sumR=ws5.addRow([usd(netCF),usd(safe),dDiff<=0?`Paying Down — ${usd(Math.abs(dDiff))} less`:`Growing — ${usd(Math.abs(dDiff))} more`,pct(latest?.savings||0,latest?.totalIn||1),usd(nw),usd(allSav),String(rows.length)]);
  sumR.height=30;
  [netCF>=0?GREEN:RED,TEAL,dDiff<=0?GREEN:RED,PURP,BLUE,GREEN,DIM].forEach((col,i)=>sty(sumR.getCell(i+1),{fill:fill(F_BLU),font:fnt(col,13,true),alignment:aln('center'),border:{top:{style:'medium',color:NAV},bottom:{style:'medium',color:NAV}}}));

  // ── GENERATE BUFFER ──
  const buf=await wb.xlsx.writeBuffer();
  const filename=`MyBudget_${year}_Report.xlsx`;

  if(mode==='sheets'){
    const token=await getGoogleToken(googleClientId,'consent');
    const content=buildSheetsContent({months,goalSaved,goalTargets,goalsConfig,amexSubs,boaSubs,sortedKeys,billTemplates});
    const sheetNames=content.map(s=>s.name);
    let sid=googleSheetId, sheetUrl;
    if(!sid){
      const created=await createGoogleSheet(token,`MyBudget ${year}`,sheetNames);
      sid=created.id; sheetUrl=created.url;
    } else {
      await clearSheetData(token,sid,sheetNames);
      sheetUrl=`https://docs.google.com/spreadsheets/d/${sid}/edit`;
    }
    await writeSheetValues(token,sid,content);
    await applySheetFormatting(token,sid,content);
    window.open(sheetUrl,'_blank');
    return {sheetId:sid, sheetUrl, token};
  } else {
    const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=filename;
    a.click(); URL.revokeObjectURL(url);
  }
}



// ── APP SHELL ─────────────────────────────────────────────────
export default function App() {
  const [themeMode, setThemeMode]       = useState("dark");
  const [tab, setTab]                   = useState("home");
  const [months, setMonths]             = useState({});
  const [goalSaved, setGoalSaved]       = useState(Object.fromEntries(DEF_GOALS.map(g=>[g.id,0])));
  const [goalTargets, setGoalTargets]   = useState(Object.fromEntries(DEF_GOALS.map(g=>[g.id,g.target])));
  const [currentKey, setCurrentKey]     = useState(todayKey());
  const [loaded, setLoaded]             = useState(false);
  const [amexSubs, setAmexSubs]         = useState(DEF_AMEX);
  const [boaSubs, setBoaSubs]           = useState(DEF_BOA);
  const [goalsConfig, setGoalsConfig]   = useState(DEF_GOALS);
  const [billTemplates, setBillTemplates] = useState(DEF_BILLS);
  const [paycheckLabels, setPaycheckLabels] = useState(DEF_PCHECKS);
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleSheetId, setGoogleSheetId]   = useState("");
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [syncStatus, setSyncStatus]         = useState("idle");
  const [lastSync, setLastSync]             = useState(null);

  const T = themeMode === "dark" ? DARK : LIGHT;

  useEffect(()=>{
    (async()=>{
      try {
        const [r1,r2,r3,r4,r5,r6,r7,r8,r9,r10] = await Promise.allSettled([
          window.storage.get("months_v2"), window.storage.get("goalSaved_v2"),
          window.storage.get("goalTargets_v2"), window.storage.get("currentKey_v2"),
          window.storage.get("themeMode"), window.storage.get("amexSubs_v1"),
          window.storage.get("boaSubs_v1"), window.storage.get("goalsConfig_v1"),
          window.storage.get("billTemplates_v1"), window.storage.get("paycheckLabels_v1"), window.storage.get("googleClientId"),
        ]);
        if (r1.status==="fulfilled"&&r1.value) setMonths(JSON.parse(r1.value.value));
        if (r2.status==="fulfilled"&&r2.value) setGoalSaved(JSON.parse(r2.value.value));
        if (r3.status==="fulfilled"&&r3.value) setGoalTargets(JSON.parse(r3.value.value));
        if (r4.status==="fulfilled"&&r4.value) setCurrentKey(r4.value.value);
        if (r5.status==="fulfilled"&&r5.value) setThemeMode(r5.value.value);
        if (r6.status==="fulfilled"&&r6.value) setAmexSubs(JSON.parse(r6.value.value));
        if (r7.status==="fulfilled"&&r7.value) setBoaSubs(JSON.parse(r7.value.value));
        if (r8.status==="fulfilled"&&r8.value) setGoalsConfig(JSON.parse(r8.value.value));
        if (r9.status==="fulfilled"&&r9.value) setBillTemplates(JSON.parse(r9.value.value));
        if (r10.status==="fulfilled"&&r10.value) setPaycheckLabels(JSON.parse(r10.value.value));
        const r11=await window.storage.get("googleClientId"); if(r11?.value) setGoogleClientId(r11.value);
        const r12=await window.storage.get("googleSheetId");  if(r12?.value) setGoogleSheetId(r12.value);
        const r13=await window.storage.get("googleSheetUrl"); if(r13?.value) setGoogleSheetUrl(r13.value);
      } catch(_){}
      setLoaded(true);
    })();
  },[]);

  useEffect(()=>{
    if (!loaded) return;
    (async()=>{
      try {
        await window.storage.set("months_v2", JSON.stringify(months));
        await window.storage.set("goalSaved_v2", JSON.stringify(goalSaved));
        await window.storage.set("goalTargets_v2", JSON.stringify(goalTargets));
        await window.storage.set("currentKey_v2", currentKey);
        await window.storage.set("themeMode", themeMode);
        await window.storage.set("amexSubs_v1", JSON.stringify(amexSubs));
        await window.storage.set("boaSubs_v1", JSON.stringify(boaSubs));
        await window.storage.set("goalsConfig_v1", JSON.stringify(goalsConfig));
        await window.storage.set("billTemplates_v1", JSON.stringify(billTemplates));
        await window.storage.set("paycheckLabels_v1", JSON.stringify(paycheckLabels));
        await window.storage.set("googleClientId", googleClientId);
        await window.storage.set("googleSheetId",  googleSheetId);
        await window.storage.set("googleSheetUrl", googleSheetUrl);
      } catch(_){}
    })();
  },[months,goalSaved,goalTargets,currentKey,themeMode,amexSubs,boaSubs,goalsConfig,billTemplates,paycheckLabels,googleClientId,googleSheetId,googleSheetUrl,loaded]);

  const curMonth = months[currentKey] || newMonth(currentKey);
  const setCurMonth = useCallback((fn)=>{
    setMonths(prev=>{
      const cur = prev[currentKey]||newMonth(currentKey);
      return {...prev, [currentKey]: typeof fn==="function"?fn(cur):fn};
    });
  },[currentKey]);

  const startNewMonth = () => {
    const cur = months[currentKey]||newMonth(currentKey);
    const totalIn   = cur.paychecks.reduce((s,p)=>s+(parseFloat(p.amount)||0),0)+(parseFloat(cur.commission?.amount)||0)+(parseFloat(cur.startingBalance)||0);
    const amexBal   = cur.amex?.paid?(parseFloat(cur.amex?.statementBalance)||0):0;
    const boaBal    = cur.boa?.paid?(parseFloat(cur.boa?.statementBalance)||0):0;
    const fixedOut  = cur.bills.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0);
    const directOut = (cur.directTransactions||[]).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
    const goalOut   = Object.entries(cur.goalContributions||{}).filter(([id])=>id!=="3").reduce((s,[,v])=>s+v,0);
    const leftover  = Math.max(0, totalIn-amexBal-boaBal-fixedOut-directOut-goalOut);
    setMonths(prev=>({...prev,[currentKey]:{...cur,locked:true}}));
    const [y,m] = currentKey.split("-").map(Number);
    const next = m===12?`${y+1}-01`:`${y}-${String(m+1).padStart(2,"0")}`;
    setMonths(prev=>({...prev,[next]:{...(prev[next]||newMonth(next,goalsConfig,billTemplates,paycheckLabels)), startingBalance:leftover>0?String(Math.round(leftover)):""}}));
    setCurrentKey(next); setTab("home");
  };

  const goToPrevMonth = () => {
    const [y,m]=currentKey.split("-").map(Number);
    setCurrentKey(m===1?`${y-1}-12`:`${y}-${String(m-1).padStart(2,"0")}`); setTab("home");
  };
  const goToNextMonth = () => {
    const [y,m]=currentKey.split("-").map(Number);
    setCurrentKey(m===12?`${y+1}-01`:`${y}-${String(m+1).padStart(2,"0")}`); setTab("home");
  };

  const isCurrentMonth = currentKey===todayKey();
  const addContrib = (goalId, amt) => {
    const n=parseFloat(amt)||0; if(!n) return;
    setGoalSaved(prev=>({...prev,[goalId]:(prev[goalId]||0)+n}));
    setCurMonth(m=>({...m,goalContributions:{...m.goalContributions,[goalId]:(m.goalContributions?.[goalId]||0)+n}}));
  };

  useEffect(()=>{
    if(!googleSheetId||!googleClientId||!loaded||Object.keys(months).length===0) return;
    setSyncStatus('idle');
    const timer=setTimeout(async()=>{
      try{
        setSyncStatus('syncing');
        const token=await getGoogleToken(googleClientId,'').catch(()=>null);
        if(!token) return setSyncStatus('idle');
        const sKeys=Object.keys(months).sort().reverse();
        const content=buildSheetsContent({months,goalSaved,goalTargets,goalsConfig,amexSubs,boaSubs,sortedKeys:sKeys,billTemplates});
        await clearSheetData(token,googleSheetId,content.map(s=>s.name));
        await writeSheetValues(token,googleSheetId,content);
        await applySheetFormatting(token,googleSheetId,content);
        setSyncStatus('synced'); setLastSync(new Date());
      }catch(e){ setSyncStatus('error'); }
    },20000);
    return ()=>clearTimeout(timer);
  },[months,goalSaved,goalTargets,googleSheetId,googleClientId,loaded]);

  if (!loaded) return (
    <div style={{minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center"}}>
      <div style={{color:T.muted, fontSize:14}}>Loading...</div>
    </div>
  );

  const TABS = [
    {key:"home",    label:"Home",     icon:a=><svg viewBox="0 0 24 24" fill={a?T.accent:T.muted} width="21" height="21"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>},
    {key:"paychecks",label:"Pay",    icon:a=><svg viewBox="0 0 24 24" fill={a?T.accent:T.muted} width="21" height="21"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>},
    {key:"cards",   label:"Cards",    icon:a=><svg viewBox="0 0 24 24" fill={a?T.accent:T.muted} width="21" height="21"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>},
    {key:"goals",   label:"Goals",    icon:a=><svg viewBox="0 0 24 24" fill={a?T.accent:T.muted} width="21" height="21"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>},
    {key:"settings",label:"Settings", icon:a=><svg viewBox="0 0 24 24" fill={a?T.accent:T.muted} width="21" height="21"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>},
  ];
  const titles = {home:"Overview", paychecks:"My Paychecks", cards:"Cards & Bills", goals:"Savings Goals", settings:"Settings"};
  const sortedKeys = Object.keys(months).sort().reverse();

  const screens = {
    home:      <HomeScreen month={curMonth} goalSaved={goalSaved} goalTargets={goalTargets} goalsConfig={goalsConfig} onNewMonth={startNewMonth} currentKey={currentKey} months={months} sortedKeys={sortedKeys} isCurrentMonth={isCurrentMonth} onExport={async(mode)=>{const r=await exportToSheets({months,goalSaved,goalTargets,goalsConfig,amexSubs,boaSubs,sortedKeys,billTemplates,mode,googleClientId,googleSheetId});if(r?.sheetId&&r.sheetId!==googleSheetId){setGoogleSheetId(r.sheetId);setGoogleSheetUrl(r.sheetUrl||"");}}} googleClientId={googleClientId} />,
    paychecks: <PaychecksScreen month={curMonth} setMonth={setCurMonth} />,
    cards:     <CardsScreen month={curMonth} setMonth={setCurMonth} amexSubs={amexSubs} boaSubs={boaSubs} />,
    goals:     <GoalsScreen goalSaved={goalSaved} setGoalSaved={setGoalSaved} goalTargets={goalTargets} setGoalTargets={setGoalTargets} onContribute={addContrib} currentMonth={curMonth} month={curMonth} setMonth={setCurMonth} goalsConfig={goalsConfig} />,
    settings:  <SettingsScreen themeMode={themeMode} setThemeMode={setThemeMode} amexSubs={amexSubs} setAmexSubs={setAmexSubs} boaSubs={boaSubs} setBoaSubs={setBoaSubs} goalsConfig={goalsConfig} setGoalsConfig={setGoalsConfig} goalSaved={goalSaved} setGoalSaved={setGoalSaved} goalTargets={goalTargets} setGoalTargets={setGoalTargets} billTemplates={billTemplates} setBillTemplates={setBillTemplates} paycheckLabels={paycheckLabels} setPaycheckLabels={setPaycheckLabels} setMonths={setMonths} googleClientId={googleClientId} setGoogleClientId={setGoogleClientId} googleSheetId={googleSheetId} googleSheetUrl={googleSheetUrl} onResetSheet={()=>{setGoogleSheetId("");setGoogleSheetUrl("");}} syncStatus={syncStatus} lastSync={lastSync}/>,
  };

  return (
    <TC.Provider value={T}>
      <div style={{minHeight:"100vh", background:T.bg, display:"flex", justifyContent:"center", fontFamily:"'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif", transition:"background 0.3s"}}>
        <div style={{width:"100%", maxWidth:390, minHeight:"100vh", background:T.surface, display:"flex", flexDirection:"column"}}>
          {/* Status bar */}
          <div style={{height:50, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 22px", flexShrink:0}}>
            <span style={{color:T.text, fontSize:13, fontWeight:800}}>9:41</span>
            <div style={{display:"flex", gap:4, alignItems:"center"}}>
              {[3,5,7,9].map((h,i)=><div key={i} style={{width:3, height:h, background:i<3?T.text:T.muted, borderRadius:1}}/>)}
              <span style={{color:T.sub, fontSize:12, fontWeight:600, marginLeft:6}}>100%</span>
            </div>
          </div>

          {/* Header */}
          <div style={{padding:"2px 20px 14px", flexShrink:0}}>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:2}}>
              <button onClick={goToPrevMonth} style={{background:T.inBg, border:`1px solid ${T.border}`, borderRadius:10, padding:"5px 12px", color:T.text, fontSize:16, cursor:"pointer", lineHeight:1}}>‹</button>
              <div style={{display:"flex", flexDirection:"column", alignItems:"center"}}>
                <div style={{color:T.muted, fontSize:12, fontWeight:600, letterSpacing:0.5}}>{monthLabel(currentKey)}</div>
                {!isCurrentMonth&&<div style={{color:T.yellow, fontSize:9, fontWeight:700, letterSpacing:0.5, marginTop:1}}>EDITING PAST MONTH</div>}
              </div>
              <button onClick={goToNextMonth} disabled={isCurrentMonth} style={{background:T.inBg, border:`1px solid ${T.border}`, borderRadius:10, padding:"5px 12px", color:isCurrentMonth?T.muted:T.text, fontSize:16, cursor:isCurrentMonth?"default":"pointer", lineHeight:1}}>›</button>
            </div>
            <div style={{color:T.text, fontSize:28, fontWeight:800, letterSpacing:-0.8, lineHeight:1.15}}>{titles[tab]}</div>
          </div>

          <div style={{flex:1, overflowY:"auto", padding:"0 14px 90px"}}>{screens[tab]}</div>

          {/* Tab bar */}
          <div style={{position:"sticky", bottom:0, background:T.tab, backdropFilter:"blur(24px)", borderTop:`1px solid ${T.tabBorder}`, display:"flex", padding:"10px 0 22px", flexShrink:0}}>
            {TABS.map(({key,label,icon})=>{
              const a=tab===key;
              return (
                <button key={key} onClick={()=>setTab(key)} style={{flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"2px 0"}}>
                  <div style={{transform:a?"scale(1.12)":"scale(1)", transition:"transform 0.18s"}}>{icon(a)}</div>
                  <span style={{fontSize:9, fontWeight:a?700:500, color:a?T.accent:T.muted, letterSpacing:0.3}}>{label}</span>
                  {a&&<div style={{width:4, height:4, borderRadius:2, background:T.accent, marginTop:1}}/>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </TC.Provider>
  );
}

// ── HOME SCREEN ───────────────────────────────────────────────
function HomeScreen({month, goalSaved, goalTargets, goalsConfig, onNewMonth, currentKey, months, sortedKeys, isCurrentMonth, onExport, googleClientId}) {
  const [exporting, setExporting] = useState(null); // null | 'xlsx' | 'sheets'
  const handleExport = async (mode) => {
    setExporting(mode);
    try { await onExport(mode); } catch(e){ alert(e.message); } finally { setExporting(null); }
  };
  const T = useT();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expanded, setExpanded]       = useState(null);

  const totalIn   = month.paychecks.reduce((s,p)=>s+(parseFloat(p.amount)||0),0)+(parseFloat(month.commission?.amount)||0)+(parseFloat(month.startingBalance)||0);
  const amexBal   = month.amex?.paid?(parseFloat(month.amex?.statementBalance)||0):0;
  const boaBal    = month.boa?.paid?(parseFloat(month.boa?.statementBalance)||0):0;
  const fixedOut  = month.bills.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0);
  const directOut = (month.directTransactions||[]).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
  const goalOut   = Object.entries(month.goalContributions||{}).filter(([id])=>id!=="3").reduce((s,[,v])=>s+v,0);
  const spent     = amexBal+boaBal+fixedOut+directOut;
  const leftover  = totalIn - spent - goalOut;
  const allPaid   = month.bills.every(b=>b.paid)&&month.amex?.paid&&month.boa?.paid;
  const totalGs   = Object.values(goalSaved).reduce((s,v)=>s+v,0);
  const pendingBills = month.bills.filter(b=>!b.paid).reduce((s,b)=>s+b.amount,0)
    + (!month.amex?.paid?(parseFloat(month.amex?.statementBalance)||0):0)
    + (!month.boa?.paid?(parseFloat(month.boa?.statementBalance)||0):0);

  const totalEarned  = Object.values(months).reduce((s,m)=>s+m.paychecks.reduce((ps,p)=>ps+(parseFloat(p.amount)||0),0)+(parseFloat(m.commission?.amount)||0),0);
  const totalSpent   = Object.values(months).reduce((s,m)=>s+(m.amex?.paid?(parseFloat(m.amex?.statementBalance)||0):0)+(m.boa?.paid?(parseFloat(m.boa?.statementBalance)||0):0)+m.bills.filter(b=>b.paid).reduce((bs,b)=>bs+b.amount,0)+(m.directTransactions||[]).reduce((ts,t)=>ts+(parseFloat(t.amount)||0),0),0);
  const totalSaved   = Object.values(goalSaved).reduce((s,v)=>s+v,0);
  const netWorth     = totalGs + Math.max(0, leftover);
  const savingsRate  = totalIn > 0 ? Math.round((goalOut / totalIn) * 100) : 0;

  const spendCategories = [
    {label:"Amex Card",     amount:amexBal,   icon:"💳", color:"#5B8FFF"},
    {label:"BOA Card",      amount:boaBal,    icon:"🏦", color:"#F59E0B"},
    {label:"Fixed Bills",   amount:fixedOut,  icon:"🏠", color:"#34C759"},
    {label:"Direct Spend",  amount:directOut, icon:"🏧", color:"#FF9F0A"},
    {label:"Goals",         amount:goalOut,   icon:"🎯", color:"#BF5AF2"},
  ];

  return (
    <div>
      {/* ── Balance Ring Card ── */}
      <Card style={{background: T.mode==="dark"
        ? "linear-gradient(145deg,#1a1f3c,#0f1d40,#0d1530)"
        : "linear-gradient(145deg,#EEF2FF,#E0EAFF,#EEF2FF)",
        border:`1px solid ${T.mode==="dark"?"rgba(91,143,255,0.15)":"rgba(0,113,227,0.12)"}`,
        marginBottom:12
      }}>
        <div style={{padding:"20px 20px 16px"}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:16}}>
            <DonutChart income={totalIn} spent={spent} saved={goalOut} size={170}/>
            <div style={{flex:1, display:"flex", flexDirection:"column", gap:10}}>
              {[
                {label:"Income",  val:totalIn,  color:T.green,  icon:"↑"},
                {label:"Spent",   val:spent,    color:T.red,    icon:"↓"},
                {label:"Saved",   val:goalOut,  color:T.purple, icon:"★"},
              ].map(({label,val,color,icon})=>(
                <div key={label} style={{background:T.mode==="dark"?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.7)", borderRadius:12, padding:"8px 12px"}}>
                  <div style={{color:T.muted, fontSize:10, fontWeight:600, letterSpacing:0.5}}>{icon} {label.toUpperCase()}</div>
                  <div style={{color, fontSize:16, fontWeight:800, marginTop:2}}>{fmtS(val)}</div>
                </div>
              ))}
            </div>
          </div>

          {pendingBills>0&&(
            <div style={{marginTop:14, background:T.mode==="dark"?"rgba(255,159,10,0.12)":"rgba(255,149,0,0.1)", border:`1px solid ${T.yellow}44`, borderRadius:12, padding:"9px 12px", display:"flex", alignItems:"center", gap:8}}>
              <span style={{fontSize:14}}>⏳</span>
              <div>
                <div style={{color:T.yellow, fontSize:12, fontWeight:700}}>{fmt(pendingBills)} in pending bills</div>
                <div style={{color:T.muted, fontSize:10, marginTop:1}}>Not yet deducted from balance</div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Spending Breakdown ── */}
      {(spent+goalOut) > 0 && (
        <>
          <SLabel>Spending Breakdown</SLabel>
          <Card>
            <CategoryBars categories={spendCategories}/>
          </Card>
        </>
      )}

      {/* ── Monthly Summary ── */}
      <SLabel>Monthly Summary</SLabel>
      <Card>
        {[
          {label:"🏦 Starting Balance", val:parseFloat(month.startingBalance)||0, color:T.teal},
          {label:"💰 Paychecks + Commission", val:totalIn-(parseFloat(month.startingBalance)||0), color:T.green},
          {label:"✅ Paid Cards & Bills", val:spent, color:T.red},
          {label:"🎯 Saved to Goals", val:goalOut, color:T.purple},
          {label:"⏳ Still Pending", val:pendingBills, color:T.yellow},
          {label:"💵 Actual Balance", val:leftover, color:leftover>400?T.green:leftover>100?T.yellow:T.red},
        ].map(({label,val,color},i,arr)=>(
          <div key={label}>
            <div style={{padding:"13px 16px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <span style={{color:T.sub, fontSize:13}}>{label}</span>
              <span style={{color, fontSize:15, fontWeight:800}}>{fmt(val)}</span>
            </div>
            {i<arr.length-1&&<Div/>}
          </div>
        ))}
      </Card>

      {/* ── Net Worth Snapshot ── */}
      <SLabel>Net Worth</SLabel>
      <Card>
        <div style={{padding:"16px 16px 8px"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16}}>
            <div>
              <div style={{color:T.muted, fontSize:10, fontWeight:700, letterSpacing:0.8}}>ALL GOALS TOTAL</div>
              <div style={{color:T.purple, fontSize:26, fontWeight:800}}>{fmt(totalGs)}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{color:T.muted, fontSize:10, fontWeight:700, letterSpacing:0.8}}>BILLS STATUS</div>
              <div style={{color:allPaid?T.green:T.yellow, fontSize:16, fontWeight:800, marginTop:4}}>
                {allPaid?"✅ All Clear":"⏳ Pending"}
              </div>
            </div>
          </div>
          <div style={{display:"flex", gap:4, marginBottom:14}}>
            {goalsConfig.map(g=>{
              const pct=Math.min((goalSaved[g.id]||0)/(goalTargets[g.id]||g.target),1);
              return (
                <div key={g.id} style={{flex:1}}>
                  <div style={{background:T.inBg, borderRadius:4, height:5, overflow:"hidden"}}>
                    <div style={{height:"100%", borderRadius:4, background:g.color, width:`${pct*100}%`, transition:"width 0.4s"}}/>
                  </div>
                  <div style={{color:T.muted, fontSize:8, marginTop:3, textAlign:"center"}}>{g.icon}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ── New Month / Locked button ── */}
      {!isCurrentMonth ? (
        <div style={{background:T.mode==="dark"?"rgba(255,159,10,0.1)":"rgba(255,149,0,0.08)", border:`1px solid ${T.yellow}44`, borderRadius:16, padding:"14px 16px", textAlign:"center", marginBottom:12}}>
          <div style={{color:T.yellow, fontSize:14, fontWeight:700}}>📝 Editing Past Month</div>
          <div style={{color:T.muted, fontSize:11, marginTop:4}}>Tap ➕ Start New Month on your current month to advance.</div>
        </div>
      ) : !month.locked ? (
        <div onClick={onNewMonth} style={{background:"linear-gradient(135deg,#1a4fd6,#7c3aed)", borderRadius:16, padding:"16px", textAlign:"center", cursor:"pointer", marginBottom:12, boxShadow:"0 4px 20px rgba(91,143,255,0.35)"}}>
          <div style={{color:"#fff", fontSize:15, fontWeight:700}}>➕ Start New Month</div>
          <div style={{color:"rgba(255,255,255,0.6)", fontSize:11, marginTop:3}}>Saves this month & carries over balance</div>
        </div>
      ) : (
        <div style={{background:T.mode==="dark"?"rgba(52,199,89,0.1)":"rgba(52,199,89,0.08)", border:`1px solid ${T.green}33`, borderRadius:16, padding:"14px", textAlign:"center", marginBottom:12}}>
          <div style={{color:T.green, fontSize:14, fontWeight:700}}>✅ Month Saved</div>
        </div>
      )}

      {/* ── Net Worth + Savings Rate ── */}
      <Card style={{background: T.mode==="dark"
        ? "linear-gradient(135deg,#0f1a3a,#1a0f3a,#0f2a1a)"
        : "linear-gradient(135deg,#EEF2FF,#F5F0FF,#EDFCF2)",
        border:`1px solid ${T.accent}22`}}>
        <div style={{padding:"18px 18px 14px"}}>
          <div style={{color:T.muted, fontSize:10, fontWeight:700, letterSpacing:1, marginBottom:4}}>TOTAL NET WORTH</div>
          <div style={{color:T.text, fontSize:36, fontWeight:800, letterSpacing:-1.5, lineHeight:1, marginBottom:14}}>
            {fmt(netWorth)}
          </div>
          <div style={{display:"flex", gap:8}}>
            <div style={{flex:1, background: T.mode==="dark"?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.7)", borderRadius:12, padding:"10px 12px"}}>
              <div style={{color:T.muted, fontSize:9, fontWeight:700, letterSpacing:0.8}}>IN GOALS</div>
              <div style={{color:T.purple, fontSize:16, fontWeight:800, marginTop:2}}>{fmtS(totalGs)}</div>
            </div>
            <div style={{flex:1, background: T.mode==="dark"?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.7)", borderRadius:12, padding:"10px 12px"}}>
              <div style={{color:T.muted, fontSize:9, fontWeight:700, letterSpacing:0.8}}>CHECKING</div>
              <div style={{color:leftover>=0?T.green:T.red, fontSize:16, fontWeight:800, marginTop:2}}>{fmtS(Math.max(0,leftover))}</div>
            </div>
            <div style={{flex:1, background: T.mode==="dark"?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.7)", borderRadius:12, padding:"10px 12px"}}>
              <div style={{color:T.muted, fontSize:9, fontWeight:700, letterSpacing:0.8}}>SAVINGS RATE</div>
              <div style={{color:savingsRate>=20?T.green:savingsRate>=10?T.yellow:T.red, fontSize:16, fontWeight:800, marginTop:2}}>{savingsRate}%</div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Cash Flow Chart ── */}
      {sortedKeys.length > 0 && (
        <>
          <SLabel>Cash Flow</SLabel>
          <Card>
            <div style={{padding:"16px 12px 12px"}}>
              <div style={{display:"flex", gap:8, marginBottom:12}}>
                {[
                  ["Total Earned", totalEarned, T.green],
                  ["Total Spent",  totalSpent,  T.red],
                  ["Total Saved",  totalSaved,  T.accent],
                ].map(([l,v,c])=>(
                  <div key={l} style={{flex:1, background:T.inBg, borderRadius:10, padding:"8px 10px"}}>
                    <div style={{color:T.muted, fontSize:9, fontWeight:700, letterSpacing:0.5}}>{l.toUpperCase()}</div>
                    <div style={{color:c, fontSize:13, fontWeight:800, marginTop:2}}>{fmtS(v)}</div>
                  </div>
                ))}
              </div>
              <CashFlowChart months={months} sortedKeys={sortedKeys}/>
            </div>
          </Card>
        </>
      )}

      {/* ── Export Buttons ── */}
      {sortedKeys.length > 0 && (
        <div style={{display:"flex", gap:8, marginBottom:12}}>
          {/* Google Sheets — direct upload */}
          <div onClick={()=>!exporting&&googleClientId&&handleExport('sheets')}
            style={{flex:2, display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              background: T.mode==="dark"?"linear-gradient(135deg,#0f1e0f,#0f180f)":"linear-gradient(135deg,#F0FDF4,#E8F5E9)",
              border:`1px solid ${T.green}55`, borderRadius:16, padding:"13px 14px",
              cursor:exporting||!googleClientId?"default":"pointer", opacity:!googleClientId?0.5:1,
              boxShadow:T.cardShadow}}>
            {exporting==='sheets'
              ? <div style={{color:T.green, fontSize:13, fontWeight:700}}>⏳ Uploading…</div>
              : <>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={T.green} strokeWidth="2" strokeLinecap="round"><path d="M12 2L12 15M12 2L8 6M12 2L16 6M3 19h18M3 15v4M21 15v4"/></svg>
                  <div>
                    <div style={{color:T.green, fontSize:13, fontWeight:700}}>Open in Google Sheets</div>
                    <div style={{color:T.muted, fontSize:10, marginTop:1}}>{googleClientId?"Uploads directly & opens":"Add Client ID in Settings first"}</div>
                  </div>
                </>
            }
          </div>
          {/* xlsx download */}
          <div onClick={()=>!exporting&&handleExport('download')}
            style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7,
              background:T.inBg, border:`1px solid ${T.border}`, borderRadius:16, padding:"13px 10px",
              cursor:exporting?"default":"pointer", boxShadow:T.cardShadow}}>
            {exporting==='download'
              ? <div style={{color:T.muted, fontSize:12, fontWeight:700}}>⏳ Building…</div>
              : <>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={T.sub} strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <div style={{color:T.sub, fontSize:12, fontWeight:600}}>.xlsx</div>
                </>
            }
          </div>
        </div>
      )}

      {/* ── History Accordion ── */}
      <div style={{marginBottom:12}}>
        <div onClick={()=>setHistoryOpen(o=>!o)} style={{display:"flex", justifyContent:"space-between", alignItems:"center", background:T.card, border:`1px solid ${T.border}`, borderRadius:historyOpen?"16px 16px 0 0":"16px", padding:"14px 16px", cursor:"pointer", boxShadow:T.cardShadow}}>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <div style={{width:34, height:34, borderRadius:10, background:T.inBg, display:"flex", alignItems:"center", justifyContent:"center"}}>
              <svg viewBox="0 0 24 24" fill={T.sub} width="16" height="16"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
            </div>
            <div>
              <div style={{color:T.text, fontSize:14, fontWeight:700}}>Monthly History</div>
              <div style={{color:T.muted, fontSize:11, marginTop:1}}>{sortedKeys.length} months · Earned {fmtS(totalEarned)}</div>
            </div>
          </div>
          <div style={{color:T.muted, fontSize:13, fontWeight:700}}>{historyOpen?"▲":"▼"}</div>
        </div>

        {historyOpen&&(
          <div style={{background:T.card, border:`1px solid ${T.border}`, borderTop:"none", borderRadius:"0 0 16px 16px", overflow:"hidden", boxShadow:T.cardShadow}}>
            {sortedKeys.length===0 ? (
              <div style={{padding:"24px", textAlign:"center", color:T.muted, fontSize:13}}>No history yet</div>
            ) : sortedKeys.map((key,idx)=>{
              const m=months[key];
              const inc=m.paychecks.reduce((s,p)=>s+(parseFloat(p.amount)||0),0)+(parseFloat(m.commission?.amount)||0);
              const cards=(m.amex?.paid?(parseFloat(m.amex?.statementBalance)||0):0)+(m.boa?.paid?(parseFloat(m.boa?.statementBalance)||0):0);
              const bills=m.bills.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0);
              const direct=(m.directTransactions||[]).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
              const gc=Object.values(m.goalContributions||{}).reduce((s,v)=>s+v,0);
              const net=inc-cards-bills-direct-gc;
              const isCur=key===currentKey;
              const open=expanded===key;
              return (
                <div key={key} style={{borderBottom:idx<sortedKeys.length-1?`1px solid ${T.div}`:"none"}}>
                  <div onClick={()=>setExpanded(open?null:key)} style={{padding:"13px 16px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                    <div>
                      <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:2}}>
                        <span style={{color:T.text, fontSize:14, fontWeight:600}}>{monthLabel(key)}</span>
                        {isCur&&<span style={{background:T.accent, borderRadius:5, padding:"1px 6px", fontSize:9, fontWeight:700, color:"#fff"}}>NOW</span>}
                        {m.locked&&<span style={{background:`${T.green}22`, borderRadius:5, padding:"1px 6px", fontSize:9, fontWeight:700, color:T.green}}>SAVED</span>}
                      </div>
                      <div style={{color:T.muted, fontSize:11}}>{inc>0?`Earned ${fmtS(inc)}`:isCur?"In progress…":"No data"}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{color:net>=0?T.green:T.red, fontSize:15, fontWeight:800}}>{inc>0?fmt(net):"—"}</div>
                      <div style={{color:T.muted, fontSize:10}}>{open?"▲":"▼"}</div>
                    </div>
                  </div>
                  {open&&inc>0&&(
                    <div style={{padding:"0 16px 14px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                      {[["💰 Income",inc,T.green],["💳 Cards",cards,"#5B8FFF"],["🏠 Bills",bills,T.teal],["🏧 Direct",direct,T.orange],["🎯 Goals",gc,T.purple],["💵 Net",net,net>=0?T.green:T.red]].map(([l,v,c])=>(
                        <div key={l} style={{background:T.inBg, borderRadius:10, padding:"8px 10px"}}>
                          <div style={{color:T.muted, fontSize:9, fontWeight:600}}>{l}</div>
                          <div style={{color:c, fontSize:14, fontWeight:800}}>{fmt(v)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PAYCHECKS SCREEN ──────────────────────────────────────────
function PaychecksScreen({month, setMonth}) {
  const T = useT();
  const upd   = (id,f,v) => setMonth(m=>({...m, paychecks:m.paychecks.map(p=>p.id===id?{...p,[f]:v}:p)}));
  const total = month.paychecks.reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
  const comm  = parseFloat(month.commission?.amount)||0;
  const totalIn   = total+comm+(parseFloat(month.startingBalance)||0);
  const amexBal   = month.amex?.paid?(parseFloat(month.amex?.statementBalance)||0):0;
  const boaBal    = month.boa?.paid?(parseFloat(month.boa?.statementBalance)||0):0;
  const fixedOut  = month.bills.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0);
  const directOut = (month.directTransactions||[]).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
  const goalOut   = Object.entries(month.goalContributions||{}).filter(([id])=>id!=="3").reduce((s,[,v])=>s+v,0);
  const balance   = totalIn-amexBal-boaBal-fixedOut-directOut-goalOut;
  const balColor  = balance>400?T.green:balance>100?T.yellow:T.red;

  return (
    <div>
      <SLabel>Starting Balance</SLabel>
      <Card style={{border:`1px solid ${T.green}33`}}>
        <div style={{padding:"16px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div>
            <div style={{color:T.text, fontSize:15, fontWeight:700}}>Checking Account</div>
            <div style={{color:T.muted, fontSize:11, marginTop:2}}>{month.startingBalance?"✅ Auto-carried from last month":"Enter starting balance"}</div>
          </div>
          <MInput value={month.startingBalance||""} onChange={v=>setMonth(m=>({...m,startingBalance:v}))} hi={!!month.startingBalance}/>
        </div>
      </Card>

      <SLabel>Regular Paychecks</SLabel>
      <Card>
        {month.paychecks.map((p,i,arr)=>(
          <div key={p.id}>
            <div style={{padding:"15px 16px"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8}}>
                <span style={{color:T.text, fontSize:15, fontWeight:600}}>{p.label}</span>
                <MInput value={p.amount} onChange={v=>upd(p.id,"amount",v)} hi={!!p.amount}/>
              </div>
              <input type="text" placeholder="Add a note…" value={p.note} onChange={e=>upd(p.id,"note",e.target.value)}
                style={{background:T.inBg, border:`1px solid ${T.inBorder}`, borderRadius:9, color:T.sub, fontSize:12, padding:"6px 10px", width:"100%", outline:"none", fontFamily:"inherit", boxSizing:"border-box"}}/>
            </div>
            {i<arr.length-1&&<Div/>}
          </div>
        ))}
      </Card>
      <div style={{background:`${T.green}18`, border:`1px solid ${T.green}33`, borderRadius:14, padding:"12px 16px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <span style={{color:T.sub, fontSize:13, fontWeight:600}}>Total Regular Pay</span>
        <span style={{color:T.green, fontSize:20, fontWeight:800}}>{fmt(total)}</span>
      </div>

      <SLabel>Verizon Commission</SLabel>
      <Card style={{border:`1px solid ${T.yellow}33`}}>
        <div style={{padding:"16px"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:comm>0?14:0}}>
            <div>
              <div style={{color:T.yellow, fontSize:15, fontWeight:700}}>💼 Commission Check</div>
              <div style={{color:T.muted, fontSize:12, marginTop:2}}>Enter when received</div>
            </div>
            <MInput value={month.commission?.amount||""} onChange={v=>setMonth(m=>({...m,commission:{amount:v}}))}/>
          </div>
          {comm>0&&(
            <>
              <div style={{color:T.muted, fontSize:10, fontWeight:700, letterSpacing:0.8, marginBottom:8}}>RECOMMENDED FROM COMMISSION</div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                {[["💾 Save 20%",comm*0.2,T.green,"HYSA"],["📈 Invest 20%",comm*0.2,T.teal,"Roth IRA"],["💳 Cards 30%",comm*0.3,T.red,"Pay balances"],["🎉 Keep 30%",comm*0.3,T.yellow,"Spending"]].map(([l,v,c,s])=>(
                  <div key={l} style={{background:T.inBg, borderRadius:12, padding:"10px 12px"}}>
                    <div style={{color:T.muted, fontSize:10, fontWeight:600}}>{l}</div>
                    <div style={{color:c, fontSize:15, fontWeight:800}}>{fmt(v)}</div>
                    <div style={{color:T.muted, fontSize:10}}>{s}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Card>

      {balance>0&&(
        <>
          <SLabel>Recommended From Balance</SLabel>
          <Card style={{border:`1px solid ${T.accent}33`}}>
            <div style={{padding:"16px"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
                <div>
                  <div style={{color:T.accent, fontSize:14, fontWeight:700}}>Based on your actual balance</div>
                  <div style={{color:T.muted, fontSize:11, marginTop:2}}>What to do with {fmt(balance)} remaining</div>
                </div>
                <div style={{color:balColor, fontSize:17, fontWeight:800}}>{fmt(balance)}</div>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                {[["💾 Save 20%",balance*0.2,T.green,"Into savings"],["📈 Invest 10%",balance*0.1,T.teal,"Roth IRA"],["🔥 Camaro 10%",balance*0.1,T.red,"Down payment"],["💵 Keep 60%",balance*0.6,T.yellow,"Living expenses"]].map(([l,v,c,s])=>(
                  <div key={l} style={{background:T.inBg, borderRadius:12, padding:"10px 12px"}}>
                    <div style={{color:T.muted, fontSize:10, fontWeight:600}}>{l}</div>
                    <div style={{color:c, fontSize:15, fontWeight:800}}>{fmt(v)}</div>
                    <div style={{color:T.muted, fontSize:10}}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ── CARD ENTRY ────────────────────────────────────────────────
function CardEntry({ck, emoji, name, color, subs, month, togglePaid, updBal}) {
  const T = useT();
  const LIMIT=1000, ALERT=750;
  const card=month[ck]||{};
  const bal=parseFloat(card.statementBalance)||0;
  const st=subs.reduce((s,x)=>s+x.amount,0);
  const pct=bal/LIMIT;
  const isWarn=bal>=ALERT&&bal<LIMIT, isOver=bal>=LIMIT;
  const alertC=isOver?T.red:T.yellow;
  return (
    <>
      <SLabel>{emoji} {name} — Due {ck==="amex"?"4th":"17th"}</SLabel>
      <Card style={{border:`1px solid ${(isWarn||isOver)?`${alertC}44`:T.border}`}}>
        {(isWarn||isOver)&&(
          <div style={{background:`${alertC}18`, borderBottom:`1px solid ${alertC}33`, padding:"10px 16px", display:"flex", alignItems:"center", gap:8}}>
            <span style={{fontSize:16}}>{isOver?"🚨":"⚠️"}</span>
            <div>
              <div style={{color:alertC, fontSize:13, fontWeight:700}}>{isOver?"Over limit!":`${Math.round(pct*100)}% of $${LIMIT} used`}</div>
              <div style={{color:T.muted, fontSize:11, marginTop:1}}>{isOver?`$${Math.round(bal-LIMIT)} over limit`:`$${Math.round(LIMIT-bal)} remaining`}</div>
            </div>
          </div>
        )}
        <div style={{padding:"18px 16px"}}>
          {bal>0&&(
            <div style={{marginBottom:14}}>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom:5}}>
                <span style={{color:T.muted, fontSize:10, fontWeight:700, letterSpacing:0.6}}>LIMIT USAGE</span>
                <span style={{color:isOver?T.red:isWarn?T.yellow:T.green, fontSize:10, fontWeight:700}}>{fmt(bal)} / ${LIMIT}</span>
              </div>
              <div style={{background:T.inBg, borderRadius:6, height:7, overflow:"hidden"}}>
                <div style={{height:"100%", borderRadius:6, width:`${Math.min(pct*100,100)}%`, background:isOver?T.red:isWarn?T.yellow:T.green, transition:"width 0.4s"}}/>
              </div>
            </div>
          )}
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
            <div>
              <div style={{color:T.text, fontSize:15, fontWeight:700}}>Statement Balance Due</div>
              <div style={{color:T.muted, fontSize:12, marginTop:2}}>Due on the {ck==="amex"?"4th":"17th"}</div>
            </div>
            <div style={{position:"relative", display:"inline-flex", alignItems:"center"}}>
              <span style={{position:"absolute", left:9, color:T.green, fontSize:13, fontWeight:700, pointerEvents:"none"}}>$</span>
              <input type="number" inputMode="decimal" value={card.statementBalance||""} onChange={e=>updBal(ck,e.target.value)} placeholder="0.00"
                style={{background:`${T.green}12`, border:`1.5px solid ${T.green}44`, borderRadius:11, color:T.green, fontSize:14, fontWeight:700, padding:"7px 10px 7px 20px", width:115, textAlign:"right", outline:"none", fontFamily:"inherit"}}/>
            </div>
          </div>
          <div onClick={()=>togglePaid(ck)} style={{display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"10px 12px", background:card.paid?`${T.green}14`:T.inBg, border:`1.5px solid ${card.paid?`${T.green}44`:T.inBorder}`, borderRadius:12, transition:"all 0.2s"}}>
            <div style={{width:22, height:22, borderRadius:11, background:card.paid?T.green:"transparent", border:card.paid?"none":`2px solid ${T.muted}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s"}}>
              {card.paid&&<svg viewBox="0 0 24 24" fill="white" width="13" height="13"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
            </div>
            <span style={{color:card.paid?T.green:T.sub, fontSize:14, fontWeight:600}}>{card.paid?`✓ Paid — ${fmt(bal)} cleared!`:"Tap to mark as paid"}</span>
          </div>
        </div>
        <Div/>
        <div style={{padding:"12px 16px 14px"}}>
          <div style={{color:T.muted, fontSize:10, fontWeight:700, letterSpacing:0.8, marginBottom:8}}>AUTO-SUBS · {fmt(st)}/mo</div>
          <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
            {subs.map(s=>(
              <div key={s.id} style={{background:T.inBg, borderRadius:8, padding:"4px 9px", display:"flex", gap:5}}>
                <span style={{color:T.sub, fontSize:11}}>{s.label}</span>
                <span style={{color, fontSize:11, fontWeight:700}}>{fmt(s.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}

// ── CARDS SCREEN ──────────────────────────────────────────────
function CardsScreen({month, setMonth, amexSubs, boaSubs}) {
  const T = useT();
  const togglePaid = k => setMonth(m=>({...m,[k]:{...m[k],paid:!m[k].paid}}));
  const updBal     = (k,v) => setMonth(m=>({...m,[k]:{...m[k],statementBalance:v}}));
  const togBill    = id => setMonth(m=>({...m,bills:m.bills.map(b=>b.id===id?{...b,paid:!b.paid}:b)}));
  const [newTxLabel, setNewTxLabel] = useState("");
  const [newTxAmt,   setNewTxAmt]   = useState("");

  const addDirectTx = () => {
    if (!newTxAmt||!newTxLabel) return;
    setMonth(m=>({...m, directTransactions:[...(m.directTransactions||[]),{id:Date.now(),label:newTxLabel,amount:parseFloat(newTxAmt)||0}]}));
    setNewTxLabel(""); setNewTxAmt("");
  };
  const removeTx = id => setMonth(m=>({...m, directTransactions:(m.directTransactions||[]).filter(t=>t.id!==id)}));

  const aB=month.amex?.paid?(parseFloat(month.amex?.statementBalance)||0):0;
  const bB=month.boa?.paid?(parseFloat(month.boa?.statementBalance)||0):0;
  const fT=month.bills.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0);
  const dT=(month.directTransactions||[]).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);

  return (
    <div>
      <CardEntry ck="amex" emoji="💳" name="American Express" color="#5B8FFF" subs={amexSubs} month={month} togglePaid={togglePaid} updBal={updBal}/>
      <CardEntry ck="boa"  emoji="🏦" name="Bank of America"  color="#F59E0B" subs={boaSubs}  month={month} togglePaid={togglePaid} updBal={updBal}/>

      <SLabel>Fixed Bills</SLabel>
      <Card>
        {month.bills.map((b,i,arr)=>(
          <div key={b.id}>
            <div style={{padding:"13px 16px", display:"flex", alignItems:"center", gap:12, opacity:b.paid?0.55:1, transition:"opacity 0.2s"}}>
              <div onClick={()=>togBill(b.id)} style={{width:26, height:26, borderRadius:13, flexShrink:0, cursor:"pointer", border:b.paid?"none":`2px solid ${T.muted}`, background:b.paid?T.green:"transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s"}}>
                {b.paid&&<svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
              </div>
              <span style={{fontSize:18}}>{b.icon}</span>
              <div style={{flex:1}}>
                <div style={{color:T.text, fontSize:14, fontWeight:500, textDecoration:b.paid?"line-through":"none"}}>{b.label}</div>
                <div style={{color:T.muted, fontSize:11}}>Due {b.due}</div>
              </div>
              <div style={{color:b.paid?T.green:T.text, fontSize:15, fontWeight:700}}>{fmt(b.amount)}</div>
            </div>
            {i<arr.length-1&&<Div/>}
          </div>
        ))}
      </Card>

      <SLabel>🏧 Direct Bank Transactions</SLabel>
      <Card>
        <div style={{padding:"14px 16px"}}>
          <div style={{color:T.muted, fontSize:11, marginBottom:12, lineHeight:1.5}}>Purchases made directly from your bank account</div>
          <div style={{display:"flex", gap:8, marginBottom:12, alignItems:"center"}}>
            <input type="text" placeholder="What was it?" value={newTxLabel} onChange={e=>setNewTxLabel(e.target.value)}
              style={{flex:1, background:T.inBg, border:`1.5px solid ${T.inBorder}`, borderRadius:11, color:T.text, fontSize:13, padding:"8px 12px", outline:"none", fontFamily:"inherit"}}/>
            <MInput value={newTxAmt} onChange={setNewTxAmt} placeholder="0.00"/>
            <div onClick={addDirectTx} style={{background:T.orange, borderRadius:11, padding:"8px 13px", cursor:"pointer", color:"#fff", fontSize:14, fontWeight:700, flexShrink:0}}>+</div>
          </div>
          {(month.directTransactions||[]).length===0 ? (
            <div style={{color:T.muted, fontSize:12, textAlign:"center", padding:"8px 0"}}>No direct transactions yet</div>
          ) : (
            <div>
              {(month.directTransactions||[]).map((tx,i,arr)=>(
                <div key={tx.id} style={{display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:i<arr.length-1?10:0, marginBottom:i<arr.length-1?10:0, borderBottom:i<arr.length-1?`1px solid ${T.div}`:"none"}}>
                  <span style={{color:T.sub, fontSize:13}}>{tx.label}</span>
                  <div style={{display:"flex", alignItems:"center", gap:10}}>
                    <span style={{color:T.orange, fontSize:14, fontWeight:700}}>{fmt(tx.amount)}</span>
                    <div onClick={()=>removeTx(tx.id)} style={{color:T.muted, fontSize:16, cursor:"pointer", padding:"0 4px"}}>✕</div>
                  </div>
                </div>
              ))}
              <div style={{display:"flex", justifyContent:"space-between", marginTop:12, paddingTop:10, borderTop:`1px solid ${T.div}`}}>
                <span style={{color:T.sub, fontSize:13, fontWeight:600}}>Total Direct</span>
                <span style={{color:T.orange, fontSize:15, fontWeight:800}}>{fmt(dT)}</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card style={{background:T.mode==="dark"?"rgba(239,68,68,0.08)":"rgba(239,68,68,0.05)", border:`1px solid ${T.red}22`}}>
        <div style={{padding:"14px 16px"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
            <div>
              <div style={{color:T.sub, fontSize:12, fontWeight:600}}>TOTAL PAID OUT</div>
              <div style={{color:T.muted, fontSize:11, marginTop:2}}>Cards + bills + direct</div>
            </div>
            <div style={{color:T.red, fontSize:22, fontWeight:800}}>{fmt(aB+bB+fT+dT)}</div>
          </div>
          <div style={{display:"flex", gap:8}}>
            {[["💳 Amex",aB,"#5B8FFF",month.amex?.paid],["🏦 BOA",bB,T.yellow,month.boa?.paid],["🏠 Bills",fT,T.teal,month.bills.every(b=>b.paid)],["🏧 Direct",dT,T.orange,true]].map(([l,v,c,paid])=>(
              <div key={l} style={{flex:1, background:T.inBg, borderRadius:10, padding:"8px 6px"}}>
                <div style={{color:T.muted, fontSize:9, fontWeight:600}}>{l}</div>
                <div style={{color:paid?c:T.muted, fontSize:12, fontWeight:800}}>{v>0?fmt(v):"—"}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── GOAL CARD ─────────────────────────────────────────────────
function GCard({g, goalSaved, setGoalSaved, goalTargets, setGoalTargets, onContribute, currentMonth, setMonth, camaroOpen, setCamaroOpen, camaroProps}) {
  const T = useT();
  const [mode, setMode] = useState("idle");
  const [val,  setVal]  = useState("");
  const saved   = goalSaved[g.id]||0;
  const target  = goalTargets[g.id]||g.target;
  const pct     = target>0?Math.min(saved/target,1):0;
  const rem     = Math.max(target-saved,0);
  const mos     = g.monthly>0?Math.ceil(rem/g.monthly):"—";
  const done    = pct>=1;
  const contrib = currentMonth.goalContributions?.[g.id]||0;
  const isCamaro = g.id===5;
  const is401k   = g.id===3;
  const close = () => {setMode("idle"); setVal("");};

  const handleAdd = () => {
    const n=parseFloat(val); if(!n||n<=0) return;
    onContribute(g.id,n); close();
  };
  const handleCorrect = () => {
    const n=parseFloat(val); if(isNaN(n)||n<0) return;
    const diff=n-(goalSaved[g.id]||0);
    const newC=Math.max(0,(currentMonth.goalContributions?.[g.id]||0)+diff);
    setGoalSaved(s=>({...s,[g.id]:n}));
    setMonth(m=>({...m,goalContributions:{...m.goalContributions,[g.id]:newC}}));
    close();
  };
  const handleEditTarget = () => {
    const n=parseFloat(val); if(!n||n<=0) return;
    setGoalTargets(t=>({...t,[g.id]:n})); close();
  };

  const inputCol = mode==="correct"?T.yellow:mode==="editTarget"?T.purple:T.green;

  return (
    <Card style={g.type==="dream"?{border:`1px solid ${g.color}28`, background:T.mode==="dark"?`${g.color}08`:`${g.color}05`}:{}}>
      <div style={{padding:"16px"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10}}>
          <div style={{flex:1}}>
            <div style={{color:T.text, fontSize:15, fontWeight:700, marginBottom:2}}>{g.label}</div>
            <div style={{color:T.muted, fontSize:11}}>{done?"✅ Goal reached!":`~${mos} mo · ${fmt(rem)} left`}</div>
            {is401k&&<div style={{color:T.teal, fontSize:10, fontWeight:600, marginTop:2}}>📌 Pre-tax — doesn't affect balance</div>}
            {contrib>0&&!is401k&&<div style={{color:T.green, fontSize:10, fontWeight:700, marginTop:2}}>+{fmt(contrib)} this month</div>}
          </div>
          <div style={{textAlign:"right", marginLeft:8}}>
            <div style={{color:done?T.green:g.color, fontSize:22, fontWeight:800}}>{Math.round(pct*100)}%</div>
            <div style={{color:T.sub, fontSize:12, fontWeight:700}}>{fmt(saved)}</div>
          </div>
        </div>

        <div style={{background:T.inBg, borderRadius:8, height:9, marginBottom:14, overflow:"hidden"}}>
          <div style={{height:"100%", borderRadius:8, width:`${pct*100}%`, transition:"width 0.5s",
            background:done?T.green:g.type==="dream"?`linear-gradient(90deg,${g.color},${g.color}BB)`:g.color,
            boxShadow:`0 0 10px ${g.color}55`}}/>
        </div>

        <div style={{display:"flex", justifyContent:"space-between", marginBottom:10}}>
          <span style={{color:T.muted, fontSize:11}}>{fmt(saved)} of {fmt(target)}</span>
          <span style={{color:T.muted, fontSize:11}}>{fmt(rem)} remaining</span>
        </div>

        {mode!=="idle"&&(
          <div style={{marginBottom:10}}>
            <div style={{color:T.muted, fontSize:11, marginBottom:6}}>
              {mode==="add"?"Amount to add:":mode==="correct"?`Correct total (now ${fmt(saved)}):`:`New target (now ${fmt(target)}):`}
            </div>
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              <div style={{position:"relative", flex:1}}>
                <span style={{position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", color:inputCol, fontSize:13, fontWeight:700, pointerEvents:"none"}}>$</span>
                <input type="number" inputMode="decimal" value={val} onChange={e=>setVal(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&(mode==="add"?handleAdd:mode==="correct"?handleCorrect:handleEditTarget)()}
                  placeholder="0.00" autoFocus
                  style={{width:"100%", textAlign:"right", outline:"none", fontFamily:"inherit", fontSize:15, fontWeight:700, padding:"9px 10px 9px 24px", borderRadius:11, border:`1.5px solid ${inputCol}55`, background:`${inputCol}14`, color:inputCol}}/>
              </div>
              <div onClick={mode==="add"?handleAdd:mode==="correct"?handleCorrect:handleEditTarget}
                style={{padding:"9px 14px", borderRadius:10, cursor:"pointer", color:"#fff", fontSize:13, fontWeight:700, whiteSpace:"nowrap", background:inputCol}}>
                {mode==="add"?"+ Add":mode==="correct"?"Set ✓":"Save"}
              </div>
              <div onClick={close} style={{padding:"9px 10px", background:T.inBg, borderRadius:10, cursor:"pointer", color:T.muted, fontSize:13}}>✕</div>
            </div>
          </div>
        )}

        <div style={{display:"flex", gap:6, flexWrap:"wrap", marginTop:mode!=="idle"?8:0}}>
          <div onClick={()=>{setMode("add");setVal("");}}
            style={{flex:1, background:mode==="add"?`${g.color}35`:`${g.color}18`, border:`1px solid ${g.color}40`, borderRadius:10, padding:"8px", textAlign:"center", cursor:"pointer", color:g.color, fontSize:13, fontWeight:700, minWidth:70}}>
            + Add
          </div>
          <div onClick={()=>{setMode("correct");setVal(String(Math.round(saved)));}}
            style={{padding:"8px 10px", background:mode==="correct"?`${T.yellow}25`:`${T.yellow}12`, border:`1px solid ${T.yellow}33`, borderRadius:10, cursor:"pointer", color:T.yellow, fontSize:12, fontWeight:600}}>
            ✏️ Correct
          </div>
          <div onClick={()=>{setMode("editTarget");setVal(String(Math.round(target)));}}
            style={{padding:"8px 10px", background:mode==="editTarget"?`${T.purple}22`:T.inBg, borderRadius:10, cursor:"pointer", color:mode==="editTarget"?T.purple:T.muted, fontSize:12}}>
            🎯 Target
          </div>
          {isCamaro&&(
            <div onClick={()=>setCamaroOpen(o=>!o)}
              style={{padding:"8px 10px", background:camaroOpen?`${T.red}20`:T.inBg, border:camaroOpen?`1px solid ${T.red}40`:"none", borderRadius:10, cursor:"pointer", color:camaroOpen?T.red:T.muted, fontSize:12, fontWeight:700}}>
              {camaroOpen?"▲":"🏎️"}
            </div>
          )}
        </div>

        {isCamaro&&camaroOpen&&camaroProps&&(
          <div style={{marginTop:14, background:T.mode==="dark"?"#f5f5f5":"#f5f5f7", borderRadius:14, padding:"16px"}}>
            {camaroProps}
          </div>
        )}
      </div>
    </Card>
  );
}

// ── GOALS SCREEN ──────────────────────────────────────────────
function GoalsScreen({goalSaved, setGoalSaved, goalTargets, setGoalTargets, onContribute, currentMonth, month, setMonth, goalsConfig}) {
  const T = useT();
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
  const camaroSaved = goalSaved[5]||0;
  const leftover    = Math.max(0,(appPaycheck*2+appCommission)-appExpenses);
  const recSave     = leftover*(camaroMode==="aggressive"?0.3:0.1);
  const otherSave   = leftover*(camaroMode==="aggressive"?0.1:0.3);
  const remaining   = Math.max(camaroGoal-camaroSaved,0);
  const monthsToGo  = recSave>0?Math.ceil(remaining/recSave):null;
  const otherMonths = otherSave>0?Math.ceil(remaining/otherSave):null;
  const fmtC        = n=>'$'+Math.abs(Math.round(n)).toLocaleString();

  const handleCamaroSave = () => {
    const a=parseFloat(saveAmt)||Math.round(recSave/2);
    if(a>0){onContribute(5,a);setSavedFlash(true);setSaveAmt("");setTimeout(()=>setSavedFlash(false),2500);}
  };

  const camaroTracker = (
    <div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:10, fontWeight:700, color:"#aaa", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8}}>Down Payment Goal</div>
        <div style={{display:"flex", gap:8}}>
          {[10000,15000].map(gv=>(
            <button key={gv} onClick={()=>setCamaroGoal(gv)} style={{flex:1, padding:"9px", border:`2px solid ${camaroGoal===gv?"#ff2200":"#e0e0e0"}`, borderRadius:8, background:camaroGoal===gv?"#fff5f5":"#fff", fontSize:13, fontWeight:800, color:camaroGoal===gv?"#ff2200":"#999", cursor:"pointer"}}>
              ${gv===10000?"10,000":"15,000"}
            </button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:10, fontWeight:700, color:"#aaa", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8}}>Saving Approach</div>
        <div style={{display:"flex", gap:8}}>
          {[["aggressive","🔥 Aggressive","30%","#ff2200"],["slow","🐢 Steady","10%","#2563eb"]].map(([md,label,pctLbl,col])=>(
            <button key={md} onClick={()=>setCamaroMode(md)} style={{flex:1, padding:"9px 6px", border:`2px solid ${camaroMode===md?col:"#e0e0e0"}`, borderRadius:8, background:camaroMode===md?col+"18":"#fff", fontSize:12, fontWeight:800, color:camaroMode===md?col:"#999", cursor:"pointer", textAlign:"center"}}>
              {label}<br/><span style={{fontSize:10, fontWeight:400}}>{pctLbl} of leftover</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{background:"#fff", borderRadius:10, padding:"14px", marginBottom:14, boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{fontSize:32, fontWeight:900, color:"#111"}}>{monthsToGo?monthsToGo+" months":"—"}</div>
        <div style={{fontSize:11, color:"#aaa", marginTop:2, marginBottom:10}}>TO {fmtC(camaroGoal)} · {camaroMode==="aggressive"?"AGGRESSIVE 30%":"STEADY 10%"}</div>
        <div style={{height:8, background:"#f0f0f0", borderRadius:4, overflow:"hidden", marginBottom:6}}>
          <div style={{height:"100%", background:"linear-gradient(90deg,#ff2200,#ff6600)", borderRadius:4, width:`${Math.min(100,(camaroSaved/camaroGoal)*100)}%`, transition:"width 0.4s"}}/>
        </div>
        <div style={{display:"flex", justifyContent:"space-between", fontSize:11, color:"#bbb"}}>
          <span>{fmtC(camaroSaved)} saved</span><span>{fmtC(camaroGoal)} goal</span>
        </div>
        {otherMonths&&<div style={{marginTop:8, fontSize:11, color:"#888", background:"#f9f9f9", borderRadius:6, padding:"6px 10px"}}>{camaroMode==="aggressive"?`🐢 Steady = ${otherMonths} months`:`🔥 Aggressive = ${otherMonths} months`}</div>}
      </div>
      <div style={{background:"#fff", borderRadius:10, padding:"14px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{fontSize:10, fontWeight:700, color:"#aaa", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8}}>Log This Month's Save</div>
        <div style={{fontSize:12, color:"#888", marginBottom:10}}>Recommended: <strong style={{color:"#ff2200"}}>{fmtC(recSave/2)}</strong> per paycheck</div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <div style={{position:"relative", flex:1}}>
            <span style={{position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"#aaa", fontWeight:700, pointerEvents:"none"}}>$</span>
            <input type="number" value={saveAmt} onChange={e=>setSaveAmt(e.target.value)} placeholder={String(Math.round(recSave/2))}
              style={{width:"100%", padding:"9px 9px 9px 22px", border:"2px solid #e0e0e0", borderRadius:8, fontSize:14, fontWeight:700, outline:"none", color:"#111"}}/>
          </div>
          <button onClick={handleCamaroSave} style={{padding:"9px 14px", borderRadius:8, background:savedFlash?"#00aa55":"#ff2200", color:"#fff", fontSize:13, fontWeight:800, border:"none", cursor:"pointer", whiteSpace:"nowrap"}}>
            {savedFlash?"✅ Done!":"Add to Goal"}
          </button>
        </div>
        {savedFlash&&<div style={{marginTop:6, fontSize:11, color:"#00aa55", textAlign:"center", fontWeight:600}}>🎉 Camaro goal updated!</div>}
      </div>
    </div>
  );

  return (
    <div>
      <Card style={{background:T.mode==="dark"?"rgba(139,92,246,0.1)":"rgba(139,92,246,0.05)", border:`1px solid ${T.purple}33`}}>
        <div style={{padding:"16px"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
            <div>
              <div style={{color:T.muted, fontSize:10, fontWeight:700, letterSpacing:0.8}}>ALL GOALS — TOTAL SAVED</div>
              <div style={{color:T.purple, fontSize:28, fontWeight:800, marginTop:2}}>{fmt(totalSaved)}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{color:T.muted, fontSize:10, fontWeight:700, letterSpacing:0.8}}>ALL GOALS TARGET</div>
              <div style={{color:T.sub, fontSize:24, fontWeight:800, marginTop:2}}>{fmt(totalTarget)}</div>
            </div>
          </div>
          <div style={{background:T.inBg, borderRadius:8, height:7, overflow:"hidden", marginTop:12}}>
            <div style={{height:"100%", borderRadius:8, background:`linear-gradient(90deg,${T.purple},${T.accent})`, width:`${Math.min((totalSaved/totalTarget)*100,100)}%`, transition:"width 0.5s"}}/>
          </div>
          <div style={{display:"flex", justifyContent:"space-between", marginTop:6}}>
            <span style={{color:T.muted, fontSize:10}}>{fmt(totalSaved)} saved</span>
            <span style={{color:T.muted, fontSize:10}}>{Math.round((totalSaved/totalTarget)*100)}% of goal</span>
          </div>
        </div>
      </Card>

      <SLabel>🛡️ Foundation Goals</SLabel>
      {goalsConfig.filter(g=>g.type==="foundation").map(g=>(
        <GCard key={g.id} g={g} goalSaved={goalSaved} setGoalSaved={setGoalSaved}
          goalTargets={goalTargets} setGoalTargets={setGoalTargets}
          onContribute={onContribute} currentMonth={currentMonth} setMonth={setMonth}
          camaroOpen={camaroOpen} setCamaroOpen={setCamaroOpen}/>
      ))}
      <SLabel>🌟 Big Life Goals</SLabel>
      {goalsConfig.filter(g=>g.type==="dream").map(g=>(
        <GCard key={g.id} g={g} goalSaved={goalSaved} setGoalSaved={setGoalSaved}
          goalTargets={goalTargets} setGoalTargets={setGoalTargets}
          onContribute={onContribute} currentMonth={currentMonth} setMonth={setMonth}
          camaroOpen={camaroOpen} setCamaroOpen={setCamaroOpen}
          camaroProps={g.id===5?camaroTracker:null}/>
      ))}
    </div>
  );
}

// ── SHARED SETTINGS HELPERS ───────────────────────────────────
function SRow({icon, label, right, onClick, accent}) {
  const T = useT();
  return (
    <div onClick={onClick} style={{display:"flex", alignItems:"center", gap:12, padding:"13px 16px", cursor:onClick?"pointer":"default"}}>
      <div style={{width:34, height:34, borderRadius:9, background:`${accent||T.accent}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0}}>{icon}</div>
      <span style={{color:T.text, fontSize:15, fontWeight:500, flex:1}}>{label}</span>
      {right}
    </div>
  );
}
function Toggle({value, onChange}) {
  const T = useT();
  return (
    <div onClick={()=>onChange(!value)} style={{width:50, height:30, borderRadius:15, background:value?T.green:T.inBg, border:`1px solid ${value?T.green:T.inBorder}`, position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0}}>
      <div style={{position:"absolute", top:3, left:value?22:3, width:22, height:22, borderRadius:11, background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}}/>
    </div>
  );
}
function Chevron() {
  const T = useT();
  return <svg viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.5" strokeLinecap="round" width="16" height="16"><path d="M9 18l6-6-6-6"/></svg>;
}
function BackBtn({onBack, label}) {
  const T = useT();
  return (
    <div onClick={onBack} style={{display:"flex", alignItems:"center", gap:6, cursor:"pointer", marginBottom:16, marginTop:4}}>
      <svg viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" width="18" height="18"><path d="M15 18l-6-6 6-6"/></svg>
      <span style={{color:T.accent, fontSize:15, fontWeight:600}}>{label}</span>
    </div>
  );
}
function TxtInput({value, onChange, placeholder=""}) {
  const T = useT();
  return (
    <input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{flex:1, background:T.inBg, border:`1.5px solid ${T.inBorder}`, borderRadius:10, color:T.text, fontSize:13, fontWeight:500, padding:"8px 11px", outline:"none", fontFamily:"inherit", minWidth:0}}/>
  );
}

// ── EDIT PAY SCREEN ───────────────────────────────────────────
function EditPayScreen({onBack, paycheckLabels, setPaycheckLabels}) {
  const T = useT();
  const [labels, setLabels] = useState([...paycheckLabels]);
  const [newLabel, setNewLabel] = useState("");

  const save = () => { setPaycheckLabels(labels); onBack(); };
  const update = (i,v) => setLabels(l=>l.map((x,j)=>j===i?v:x));
  const remove = (i) => setLabels(l=>l.filter((_,j)=>j!==i));
  const add = () => { if(!newLabel.trim()) return; setLabels(l=>[...l, newLabel.trim()]); setNewLabel(""); };

  return (
    <div>
      <BackBtn onBack={onBack} label="Back to Settings"/>
      <SLabel>Paycheck Labels</SLabel>
      <div style={{color:T.muted, fontSize:11, marginBottom:10}}>These names apply to new months you create.</div>
      <Card>
        {labels.map((l,i,arr)=>(
          <div key={i}>
            <div style={{display:"flex", alignItems:"center", gap:8, padding:"10px 16px"}}>
              <span style={{color:T.muted, fontSize:20}}>💰</span>
              <TxtInput value={l} onChange={v=>update(i,v)} placeholder="Paycheck name"/>
              {labels.length > 1 &&
                <div onClick={()=>remove(i)} style={{color:T.red, fontSize:18, cursor:"pointer", padding:"0 4px", flexShrink:0}}>✕</div>
              }
            </div>
            {i<arr.length-1&&<Div/>}
          </div>
        ))}
      </Card>
      <div style={{display:"flex", gap:8, marginBottom:16}}>
        <TxtInput value={newLabel} onChange={setNewLabel} placeholder="Add paycheck label…"/>
        <div onClick={add} style={{background:T.accent, borderRadius:10, padding:"8px 14px", cursor:"pointer", color:"#fff", fontWeight:700, fontSize:14, flexShrink:0}}>+ Add</div>
      </div>
      <div onClick={save} style={{background:`linear-gradient(135deg,${T.accent},${T.purple})`, borderRadius:14, padding:"14px", textAlign:"center", cursor:"pointer"}}>
        <span style={{color:"#fff", fontWeight:700, fontSize:15}}>Save Changes</span>
      </div>
    </div>
  );
}

// ── EDIT CARDS SCREEN ─────────────────────────────────────────
function EditCardsScreen({onBack, amexSubs, setAmexSubs, boaSubs, setBoaSubs, billTemplates, setBillTemplates}) {
  const T = useT();
  const [aList, setAList] = useState(amexSubs.map(s=>({...s})));
  const [bList, setBList] = useState(boaSubs.map(s=>({...s})));
  const [bills, setBills] = useState(billTemplates.map(b=>({...b})));
  const [newA, setNewA]   = useState({label:"",amount:""});
  const [newB, setNewB]   = useState({label:"",amount:""});
  const [newBill, setNewBill] = useState({label:"",due:"Monthly",amount:"",icon:"🏠"});

  const save = () => {
    setAmexSubs(aList); setBoaSubs(bList); setBillTemplates(bills); onBack();
  };

  const SubRow = ({item, onUpdate, onRemove, color}) => (
    <div style={{display:"flex", alignItems:"center", gap:8, padding:"9px 16px"}}>
      <TxtInput value={item.label} onChange={v=>onUpdate({...item,label:v})} placeholder="Name"/>
      <div style={{position:"relative", display:"inline-flex", alignItems:"center", flexShrink:0}}>
        <span style={{position:"absolute", left:7, color:color, fontSize:12, fontWeight:700, pointerEvents:"none"}}>$</span>
        <input type="number" value={item.amount} onChange={e=>onUpdate({...item,amount:parseFloat(e.target.value)||0})} placeholder="0"
          style={{background:T.inBg, border:`1.5px solid ${T.inBorder}`, borderRadius:9, color:T.text, fontSize:13, fontWeight:700, padding:"7px 8px 7px 18px", width:80, textAlign:"right", outline:"none", fontFamily:"inherit"}}/>
      </div>
      <div onClick={onRemove} style={{color:T.red, fontSize:18, cursor:"pointer", flexShrink:0}}>✕</div>
    </div>
  );

  const AddRow = ({state, setState, onAdd, color}) => (
    <div style={{display:"flex", gap:8, padding:"10px 16px", borderTop:`1px solid ${T.div}`}}>
      <TxtInput value={state.label} onChange={v=>setState(s=>({...s,label:v}))} placeholder="Name"/>
      <div style={{position:"relative", display:"inline-flex", alignItems:"center", flexShrink:0}}>
        <span style={{position:"absolute", left:7, color:color, fontSize:12, fontWeight:700, pointerEvents:"none"}}>$</span>
        <input type="number" value={state.amount} onChange={e=>setState(s=>({...s,amount:e.target.value}))} placeholder="0"
          style={{background:T.inBg, border:`1.5px solid ${T.inBorder}`, borderRadius:9, color:T.text, fontSize:13, fontWeight:700, padding:"7px 8px 7px 18px", width:80, textAlign:"right", outline:"none", fontFamily:"inherit"}}/>
      </div>
      <div onClick={onAdd} style={{background:color, borderRadius:9, padding:"7px 11px", cursor:"pointer", color:"#fff", fontWeight:700, fontSize:14, flexShrink:0}}>+</div>
    </div>
  );

  return (
    <div>
      <BackBtn onBack={onBack} label="Back to Settings"/>

      <SLabel>💳 Amex Subscriptions</SLabel>
      <Card>
        {aList.map((s,i,arr)=>(
          <div key={s.id}>
            <SubRow item={s} color="#5B8FFF"
              onUpdate={v=>setAList(l=>l.map((x,j)=>j===i?v:x))}
              onRemove={()=>setAList(l=>l.filter((_,j)=>j!==i))}/>
            {i<arr.length-1&&<Div/>}
          </div>
        ))}
        <AddRow state={newA} setState={setNewA} color="#5B8FFF" onAdd={()=>{
          if(!newA.label.trim()||!newA.amount) return;
          setAList(l=>[...l,{id:Date.now(),label:newA.label.trim(),amount:parseFloat(newA.amount)||0}]);
          setNewA({label:"",amount:""});
        }}/>
      </Card>

      <SLabel>🏦 BOA Subscriptions</SLabel>
      <Card>
        {bList.map((s,i,arr)=>(
          <div key={s.id}>
            <SubRow item={s} color="#F59E0B"
              onUpdate={v=>setBList(l=>l.map((x,j)=>j===i?v:x))}
              onRemove={()=>setBList(l=>l.filter((_,j)=>j!==i))}/>
            {i<arr.length-1&&<Div/>}
          </div>
        ))}
        <AddRow state={newB} setState={setNewB} color="#F59E0B" onAdd={()=>{
          if(!newB.label.trim()||!newB.amount) return;
          setBList(l=>[...l,{id:Date.now(),label:newB.label.trim(),amount:parseFloat(newB.amount)||0}]);
          setNewB({label:"",amount:""});
        }}/>
      </Card>

      <SLabel>🏠 Fixed Bills (for new months)</SLabel>
      <Card>
        {bills.map((b,i,arr)=>(
          <div key={i}>
            <div style={{display:"flex", alignItems:"center", gap:8, padding:"9px 16px"}}>
              <select value={b.icon} onChange={e=>setBills(l=>l.map((x,j)=>j===i?{...x,icon:e.target.value}:x))}
                style={{background:T.inBg, border:`1px solid ${T.inBorder}`, borderRadius:8, color:T.text, fontSize:16, padding:"4px", cursor:"pointer"}}>
                {BILL_ICONS.map(ic=><option key={ic} value={ic}>{ic}</option>)}
              </select>
              <TxtInput value={b.label} onChange={v=>setBills(l=>l.map((x,j)=>j===i?{...x,label:v}:x))} placeholder="Bill name"/>
              <TxtInput value={b.due} onChange={v=>setBills(l=>l.map((x,j)=>j===i?{...x,due:v}:x))} placeholder="Due"/>
              <div style={{position:"relative", display:"inline-flex", alignItems:"center", flexShrink:0}}>
                <span style={{position:"absolute", left:7, color:T.green, fontSize:12, fontWeight:700, pointerEvents:"none"}}>$</span>
                <input type="number" value={b.amount} onChange={e=>setBills(l=>l.map((x,j)=>j===i?{...x,amount:parseFloat(e.target.value)||0}:x))} placeholder="0"
                  style={{background:T.inBg, border:`1.5px solid ${T.inBorder}`, borderRadius:9, color:T.text, fontSize:13, fontWeight:700, padding:"7px 8px 7px 18px", width:80, textAlign:"right", outline:"none", fontFamily:"inherit"}}/>
              </div>
              <div onClick={()=>setBills(l=>l.filter((_,j)=>j!==i))} style={{color:T.red, fontSize:18, cursor:"pointer", flexShrink:0}}>✕</div>
            </div>
            {i<arr.length-1&&<Div/>}
          </div>
        ))}
        <div style={{display:"flex", gap:8, padding:"10px 16px", borderTop:`1px solid ${T.div}`}}>
          <select value={newBill.icon} onChange={e=>setNewBill(s=>({...s,icon:e.target.value}))}
            style={{background:T.inBg, border:`1px solid ${T.inBorder}`, borderRadius:8, color:T.text, fontSize:16, padding:"4px", cursor:"pointer"}}>
            {BILL_ICONS.map(ic=><option key={ic} value={ic}>{ic}</option>)}
          </select>
          <TxtInput value={newBill.label} onChange={v=>setNewBill(s=>({...s,label:v}))} placeholder="Bill name"/>
          <div style={{position:"relative", display:"inline-flex", alignItems:"center", flexShrink:0}}>
            <span style={{position:"absolute", left:7, color:T.green, fontSize:12, fontWeight:700, pointerEvents:"none"}}>$</span>
            <input type="number" value={newBill.amount} onChange={e=>setNewBill(s=>({...s,amount:e.target.value}))} placeholder="0"
              style={{background:T.inBg, border:`1.5px solid ${T.inBorder}`, borderRadius:9, color:T.text, fontSize:13, fontWeight:700, padding:"7px 8px 7px 18px", width:80, textAlign:"right", outline:"none", fontFamily:"inherit"}}/>
          </div>
          <div onClick={()=>{
            if(!newBill.label.trim()||!newBill.amount) return;
            setBills(l=>[...l,{label:newBill.label.trim(),due:newBill.due||"Monthly",amount:parseFloat(newBill.amount)||0,icon:newBill.icon}]);
            setNewBill({label:"",due:"Monthly",amount:"",icon:"🏠"});
          }} style={{background:T.green, borderRadius:9, padding:"7px 11px", cursor:"pointer", color:"#fff", fontWeight:700, fontSize:14, flexShrink:0}}>+</div>
        </div>
      </Card>

      <div onClick={save} style={{background:`linear-gradient(135deg,${T.accent},${T.purple})`, borderRadius:14, padding:"14px", textAlign:"center", cursor:"pointer", marginTop:4}}>
        <span style={{color:"#fff", fontWeight:700, fontSize:15}}>Save Changes</span>
      </div>
    </div>
  );
}

// ── EDIT GOALS SCREEN ─────────────────────────────────────────
function EditGoalsScreen({onBack, goalsConfig, setGoalsConfig, goalSaved, setGoalSaved, goalTargets, setGoalTargets, setMonths}) {
  const T = useT();
  const [list, setList] = useState(goalsConfig.map(g=>({...g})));
  const [adding, setAdding] = useState(false);
  const [newG, setNewG]     = useState({label:"",target:"",monthly:"",type:"foundation",color:GOAL_COLORS[0],icon:GOAL_ICONS[0]});

  const upd = (id,field,val) => setList(l=>l.map(g=>g.id===id?{...g,[field]:val}:g));

  const save = () => {
    const newIds = list.map(g=>g.id);
    const addedGoals = list.filter(g=>!goalsConfig.find(og=>og.id===g.id));
    setGoalsConfig(list);
    if(addedGoals.length>0){
      setGoalSaved(prev=>({...prev,...Object.fromEntries(addedGoals.map(g=>[g.id,prev[g.id]??0]))}));
      setGoalTargets(prev=>({...prev,...Object.fromEntries(addedGoals.map(g=>[g.id,g.target]))}));
      setMonths(prev=>{
        const updated={};
        for(const [k,m] of Object.entries(prev)){
          const gc={...m.goalContributions};
          for(const g of addedGoals) gc[g.id]=gc[g.id]??0;
          updated[k]={...m,goalContributions:gc};
        }
        return {...prev,...updated};
      });
    }
    onBack();
  };

  const addGoal = () => {
    if(!newG.label.trim()||!newG.target) return;
    const g={...newG, id:Date.now(), target:parseFloat(newG.target)||0, monthly:parseFloat(newG.monthly)||0};
    setList(l=>[...l,g]);
    setNewG({label:"",target:"",monthly:"",type:"foundation",color:GOAL_COLORS[0],icon:GOAL_ICONS[0]});
    setAdding(false);
  };

  return (
    <div>
      <BackBtn onBack={onBack} label="Back to Settings"/>
      <SLabel>Goals</SLabel>
      <div style={{color:T.muted, fontSize:11, marginBottom:10}}>Edit names and monthly targets. Delete removes from display only.</div>

      {list.map((g,i,arr)=>(
        <Card key={g.id} style={{border:`1px solid ${g.color}33`}}>
          <div style={{padding:"14px 16px"}}>
            <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
              <div style={{width:10, height:10, borderRadius:5, background:g.color, flexShrink:0}}/>
              <TxtInput value={g.label} onChange={v=>upd(g.id,"label",v)} placeholder="Goal name"/>
              <div onClick={()=>setList(l=>l.filter(x=>x.id!==g.id))} style={{color:T.red, fontSize:18, cursor:"pointer", flexShrink:0}}>✕</div>
            </div>
            <div style={{display:"flex", gap:8}}>
              <div style={{flex:1}}>
                <div style={{color:T.muted, fontSize:10, fontWeight:700, marginBottom:4}}>TARGET</div>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", color:T.green, fontSize:12, fontWeight:700, pointerEvents:"none"}}>$</span>
                  <input type="number" value={g.target} onChange={e=>upd(g.id,"target",parseFloat(e.target.value)||0)} placeholder="0"
                    style={{width:"100%", background:T.inBg, border:`1.5px solid ${T.inBorder}`, borderRadius:9, color:T.text, fontSize:13, fontWeight:700, padding:"7px 8px 7px 20px", outline:"none", fontFamily:"inherit"}}/>
                </div>
              </div>
              <div style={{flex:1}}>
                <div style={{color:T.muted, fontSize:10, fontWeight:700, marginBottom:4}}>MONTHLY</div>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", color:T.accent, fontSize:12, fontWeight:700, pointerEvents:"none"}}>$</span>
                  <input type="number" value={g.monthly} onChange={e=>upd(g.id,"monthly",parseFloat(e.target.value)||0)} placeholder="0"
                    style={{width:"100%", background:T.inBg, border:`1.5px solid ${T.inBorder}`, borderRadius:9, color:T.text, fontSize:13, fontWeight:700, padding:"7px 8px 7px 20px", outline:"none", fontFamily:"inherit"}}/>
                </div>
              </div>
              <div style={{flex:1}}>
                <div style={{color:T.muted, fontSize:10, fontWeight:700, marginBottom:4}}>TYPE</div>
                <select value={g.type} onChange={e=>upd(g.id,"type",e.target.value)}
                  style={{width:"100%", background:T.inBg, border:`1.5px solid ${T.inBorder}`, borderRadius:9, color:T.text, fontSize:12, fontWeight:600, padding:"8px", outline:"none", cursor:"pointer"}}>
                  <option value="foundation">Foundation</option>
                  <option value="dream">Dream</option>
                </select>
              </div>
            </div>
            <div style={{marginTop:10}}>
              <div style={{color:T.muted, fontSize:10, fontWeight:700, marginBottom:6}}>COLOR</div>
              <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                {GOAL_COLORS.map(c=>(
                  <div key={c} onClick={()=>upd(g.id,"color",c)}
                    style={{width:22, height:22, borderRadius:11, background:c, cursor:"pointer", border:g.color===c?`3px solid ${T.text}`:"3px solid transparent", transition:"border 0.15s"}}/>
                ))}
              </div>
            </div>
            <div style={{marginTop:10}}>
              <div style={{color:T.muted, fontSize:10, fontWeight:700, marginBottom:6}}>ICON</div>
              <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                {GOAL_ICONS.map(ic=>(
                  <div key={ic} onClick={()=>upd(g.id,"icon",ic)}
                    style={{width:30, height:30, borderRadius:8, background:g.icon===ic?`${g.color}30`:T.inBg, border:g.icon===ic?`1.5px solid ${g.color}`:T.inBorder, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, cursor:"pointer"}}>
                    {ic}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}

      {!adding ? (
        <div onClick={()=>setAdding(true)} style={{border:`2px dashed ${T.inBorder}`, borderRadius:14, padding:"14px", textAlign:"center", cursor:"pointer", marginBottom:12}}>
          <span style={{color:T.accent, fontWeight:700, fontSize:14}}>+ Add New Goal</span>
        </div>
      ) : (
        <Card style={{border:`1px solid ${newG.color}44`}}>
          <div style={{padding:"14px 16px"}}>
            <div style={{color:T.text, fontSize:14, fontWeight:700, marginBottom:12}}>New Goal</div>
            <TxtInput value={newG.label} onChange={v=>setNewG(s=>({...s,label:v}))} placeholder="Goal name"/>
            <div style={{display:"flex", gap:8, marginTop:8}}>
              <div style={{flex:1}}>
                <div style={{color:T.muted, fontSize:10, fontWeight:700, marginBottom:4}}>TARGET</div>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", color:T.green, fontSize:12, fontWeight:700, pointerEvents:"none"}}>$</span>
                  <input type="number" value={newG.target} onChange={e=>setNewG(s=>({...s,target:e.target.value}))} placeholder="0"
                    style={{width:"100%", background:T.inBg, border:`1.5px solid ${T.inBorder}`, borderRadius:9, color:T.text, fontSize:13, fontWeight:700, padding:"7px 8px 7px 20px", outline:"none", fontFamily:"inherit"}}/>
                </div>
              </div>
              <div style={{flex:1}}>
                <div style={{color:T.muted, fontSize:10, fontWeight:700, marginBottom:4}}>MONTHLY</div>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", color:T.accent, fontSize:12, fontWeight:700, pointerEvents:"none"}}>$</span>
                  <input type="number" value={newG.monthly} onChange={e=>setNewG(s=>({...s,monthly:e.target.value}))} placeholder="0"
                    style={{width:"100%", background:T.inBg, border:`1.5px solid ${T.inBorder}`, borderRadius:9, color:T.text, fontSize:13, fontWeight:700, padding:"7px 8px 7px 20px", outline:"none", fontFamily:"inherit"}}/>
                </div>
              </div>
            </div>
            <div style={{marginTop:10}}>
              <div style={{color:T.muted, fontSize:10, fontWeight:700, marginBottom:6}}>TYPE</div>
              <div style={{display:"flex", gap:8}}>
                {["foundation","dream"].map(t=>(
                  <div key={t} onClick={()=>setNewG(s=>({...s,type:t}))}
                    style={{flex:1, padding:"7px", borderRadius:9, border:`1.5px solid ${newG.type===t?newG.color:T.inBorder}`, background:newG.type===t?`${newG.color}18`:T.inBg, color:newG.type===t?newG.color:T.muted, fontSize:12, fontWeight:600, textAlign:"center", cursor:"pointer"}}>
                    {t==="foundation"?"🛡️ Foundation":"🌟 Dream"}
                  </div>
                ))}
              </div>
            </div>
            <div style={{marginTop:10}}>
              <div style={{color:T.muted, fontSize:10, fontWeight:700, marginBottom:6}}>COLOR</div>
              <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                {GOAL_COLORS.map(c=>(
                  <div key={c} onClick={()=>setNewG(s=>({...s,color:c}))}
                    style={{width:22, height:22, borderRadius:11, background:c, cursor:"pointer", border:newG.color===c?`3px solid ${T.text}`:"3px solid transparent"}}/>
                ))}
              </div>
            </div>
            <div style={{marginTop:10}}>
              <div style={{color:T.muted, fontSize:10, fontWeight:700, marginBottom:6}}>ICON</div>
              <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                {GOAL_ICONS.map(ic=>(
                  <div key={ic} onClick={()=>setNewG(s=>({...s,icon:ic}))}
                    style={{width:30, height:30, borderRadius:8, background:newG.icon===ic?`${newG.color}30`:T.inBg, border:newG.icon===ic?`1.5px solid ${newG.color}`:T.inBorder, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, cursor:"pointer"}}>
                    {ic}
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"flex", gap:8, marginTop:12}}>
              <div onClick={addGoal} style={{flex:1, background:`linear-gradient(135deg,${newG.color},${newG.color}BB)`, borderRadius:10, padding:"10px", textAlign:"center", cursor:"pointer"}}>
                <span style={{color:"#fff", fontWeight:700, fontSize:14}}>Add Goal</span>
              </div>
              <div onClick={()=>{setAdding(false);setNewG({label:"",target:"",monthly:"",type:"foundation",color:GOAL_COLORS[0],icon:GOAL_ICONS[0]});}}
                style={{padding:"10px 14px", background:T.inBg, borderRadius:10, cursor:"pointer", color:T.muted, fontSize:14}}>Cancel</div>
            </div>
          </div>
        </Card>
      )}

      <div onClick={save} style={{background:`linear-gradient(135deg,${T.accent},${T.purple})`, borderRadius:14, padding:"14px", textAlign:"center", cursor:"pointer", marginTop:4}}>
        <span style={{color:"#fff", fontWeight:700, fontSize:15}}>Save Changes</span>
      </div>
    </div>
  );
}

// ── SETTINGS SCREEN ───────────────────────────────────────────
function SettingsScreen({themeMode, setThemeMode, amexSubs, setAmexSubs, boaSubs, setBoaSubs, goalsConfig, setGoalsConfig, goalSaved, setGoalSaved, goalTargets, setGoalTargets, billTemplates, setBillTemplates, paycheckLabels, setPaycheckLabels, setMonths, googleClientId, setGoogleClientId, googleSheetId, googleSheetUrl, onResetSheet, syncStatus, lastSync}) {
  const T = useT();
  const [view, setView] = useState("main");
  const isDark = themeMode==="dark";

  if (view==="pay")   return <EditPayScreen   onBack={()=>setView("main")} paycheckLabels={paycheckLabels} setPaycheckLabels={setPaycheckLabels}/>;
  if (view==="cards") return <EditCardsScreen onBack={()=>setView("main")} amexSubs={amexSubs} setAmexSubs={setAmexSubs} boaSubs={boaSubs} setBoaSubs={setBoaSubs} billTemplates={billTemplates} setBillTemplates={setBillTemplates}/>;
  if (view==="goals") return <EditGoalsScreen onBack={()=>setView("main")} goalsConfig={goalsConfig} setGoalsConfig={setGoalsConfig} goalSaved={goalSaved} setGoalSaved={setGoalSaved} goalTargets={goalTargets} setGoalTargets={setGoalTargets} setMonths={setMonths}/>;

  return (
    <div>
      <SLabel>Configure</SLabel>
      <Card>
        <SRow icon="💰" label="Paychecks & Income" right={<Chevron/>} onClick={()=>setView("pay")}/>
        <Div/>
        <SRow icon="💳" label="Cards & Subscriptions" right={<Chevron/>} onClick={()=>setView("cards")}/>
        <Div/>
        <SRow icon="🎯" label="Goals" right={<Chevron/>} onClick={()=>setView("goals")}/>
      </Card>

      <SLabel>Google Sheets</SLabel>
      <Card>
        <div style={{padding:"14px 16px"}}>
          <div style={{color:T.text, fontSize:14, fontWeight:600, marginBottom:4}}>Google OAuth Client ID</div>
          <div style={{color:T.muted, fontSize:11, lineHeight:1.5, marginBottom:10}}>
            Cloud Console → APIs &amp; Services → Credentials → OAuth 2.0 Client ID (Web app). Add <span style={{color:T.accent}}>{window.location.origin}</span> as authorized origin. Enable Google Sheets API.
          </div>
          <TxtInput value={googleClientId} onChange={setGoogleClientId} placeholder="xxxxxxxxxxxx.apps.googleusercontent.com"/>
          {googleClientId && <div style={{color:T.green, fontSize:11, marginTop:6, fontWeight:600}}>✓ Client ID set</div>}
        </div>
      </Card>
      {googleSheetId && (
        <Card style={{border:`1px solid ${T.green}33`}}>
          <div style={{padding:"14px 16px"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12}}>
              <div style={{flex:1}}>
                <div style={{color:T.green, fontSize:13, fontWeight:700, marginBottom:4}}>✓ Linked Sheet</div>
                <div style={{color:T.muted, fontSize:10, marginBottom:8}}>
                  Auto-syncs 20 sec after changes · {" "}
                  <span style={{color:syncStatus==="synced"?T.green:syncStatus==="syncing"?T.yellow:syncStatus==="error"?T.red:T.muted, fontWeight:600}}>
                    {syncStatus==="synced"?("Synced "+(lastSync?lastSync.toLocaleTimeString():"")):syncStatus==="syncing"?"Syncing…":syncStatus==="error"?"Error":"Idle"}
                  </span>
                </div>
                <a href={googleSheetUrl} target="_blank" rel="noreferrer" style={{color:T.accent, fontSize:12, fontWeight:600, textDecoration:"none"}}>Open Sheet ↗</a>
              </div>
              <div onClick={onResetSheet} style={{color:T.red, fontSize:11, cursor:"pointer", padding:"5px 10px", background:`${T.red}14`, borderRadius:8, fontWeight:600, flexShrink:0}}>Unlink</div>
            </div>
          </div>
        </Card>
      )}

      <SLabel>Appearance</SLabel>
      <Card>
        <SRow icon={isDark?"🌙":"☀️"} label="Dark Mode" right={
          <Toggle value={isDark} onChange={v=>setThemeMode(v?"dark":"light")}/>
        }/>
      </Card>

      <SLabel>About</SLabel>
      <Card>
        <SRow icon="📊" label="My Budget" right={<span style={{color:T.muted, fontSize:13}}>v1.0</span>}/>
        <Div/>
        <SRow icon="🎯" label="Goals Tracked" right={<span style={{color:T.accent, fontSize:13, fontWeight:700}}>{goalsConfig.length}</span>}/>
        <Div/>
        <SRow icon="💳" label="Subscriptions" right={<span style={{color:T.accent, fontSize:13, fontWeight:700}}>{amexSubs.length+boaSubs.length}</span>}/>
        <Div/>
        <SRow icon="🏦" label="Data Storage" right={<span style={{color:T.muted, fontSize:13}}>Local</span>}/>
      </Card>

      <SLabel>Legend</SLabel>
      <Card>
        <div style={{padding:"16px"}}>
          {[["Donut Ring","Spent → Saved → Remaining",T.red],["Green Bar","Monthly income",T.green],["Blue Line","Running savings total",T.accent],["Category %","% of total spending",T.purple]].map(([l,d,c],i,arr)=>(
            <div key={l} style={{display:"flex", alignItems:"flex-start", gap:12, paddingBottom:i<arr.length-1?12:0, marginBottom:i<arr.length-1?12:0, borderBottom:i<arr.length-1?`1px solid ${T.div}`:"none"}}>
              <div style={{width:10, height:10, borderRadius:5, background:c, flexShrink:0, marginTop:4}}/>
              <div>
                <div style={{color:T.text, fontSize:13, fontWeight:600}}>{l}</div>
                <div style={{color:T.muted, fontSize:11, marginTop:2}}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
