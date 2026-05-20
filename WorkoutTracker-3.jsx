import { useState, useEffect, useCallback } from "react";

const WORKOUTS = [
  {name:"Running",icon:"🏃"},{name:"Cycling",icon:"🚴"},{name:"Swimming",icon:"🏊"},
  {name:"Weights",icon:"🏋️"},{name:"HIIT",icon:"⚡"},{name:"Yoga",icon:"🧘"},
  {name:"Pilates",icon:"🤸"},{name:"Jump Rope",icon:"🪢"},{name:"Boxing",icon:"🥊"},
  {name:"Rowing",icon:"🚣"},{name:"Stretching",icon:"🙆"},{name:"Calisthenics",icon:"💪"},
  {name:"CrossFit",icon:"🔥"},{name:"Zumba",icon:"💃"},{name:"Walking",icon:"🚶"}
];
const INTENSITY = [
  {label:"Light",emoji:"🌿",color:"#2EC4B6"},
  {label:"Moderate",emoji:"⚡",color:"#F7931E"},
  {label:"Intense",emoji:"🔥",color:"#FF6B35"},
  {label:"Max",emoji:"💥",color:"#E63946"}
];
const COLORS = ["#FF6B35","#F7931E","#00C9A7","#4361EE","#7B2D8B","#E63946","#2EC4B6","#8338EC","#06D6A0","#FF9F1C"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS = ["M","T","W","T","F","S","S"];

function fmtDate(y,m,d){ return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function parseDK(k){ const [y,mo,d]=k.split('-').map(Number); return {y,m:mo-1,d}; }
function daysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
function firstDay(y,m){ const d=new Date(y,m,1).getDay(); return d===0?6:d-1; }
function getIcon(type){ return WORKOUTS.find(w=>w.name===type)?.icon||'💪'; }
function getIColor(i){ return INTENSITY.find(x=>x.label===i)?.color||'#888'; }

const TODAY = new Date();
const SEED_KEY = 'wl_seeded_v1';

function makeSeedData() {
  const data = {};
  const seeds = [
    [0,'Running',32,'Moderate','Morning jog around the park'],
    [-1,'HIIT',25,'Intense','Tabata intervals'],
    [-2,'Yoga',45,'Light',''],
    [-3,'Cycling',60,'Moderate','Sunday ride'],
    [-5,'Weights',50,'Intense','Leg day 🦵'],
    [-7,'Swimming',40,'Moderate',''],
    [-10,'Calisthenics',35,'Max',''],
  ];
  seeds.forEach(([offset,type,dur,intensity,note])=>{
    const d = new Date(TODAY); d.setDate(d.getDate()+offset);
    const key = fmtDate(d.getFullYear(),d.getMonth(),d.getDate());
    if(!data[key]) data[key]=[];
    data[key].push({id:Date.now()+Math.random(),type,duration:dur,intensity,note});
  });
  return data;
}

// Storage helpers
async function storageGet(key) {
  try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; }
}
async function storageSet(key, val) {
  try { await window.storage.set(key, JSON.stringify(val)); } catch {}
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
  :root{--orange:#FF6B35;--amber:#F7931E;--bg:#0D0D1A;--card:#1a1a2e;--border:#2a2a3a;}
  body{font-family:'Nunito',sans-serif;background:#0A0A0F;}
  .wl-root{width:100%;max-width:430px;min-height:100vh;margin:0 auto;background:var(--bg);display:flex;flex-direction:column;position:relative;font-family:'Nunito',sans-serif;}
  .screen{flex:1;display:flex;flex-direction:column;min-height:100vh;animation:fadeUp .25s cubic-bezier(.22,.68,0,1.2) both;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  .scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 14px 110px;}
  .scroll::-webkit-scrollbar{display:none;}
  .hdr{padding:16px 18px 12px;background:linear-gradient(180deg,#13132a 0%,#0D0D1A 100%);flex-shrink:0;}
  .hdr-row{display:flex;align-items:center;gap:10px;margin-bottom:4px;}
  .tag{color:var(--orange);font-family:'Space Mono';font-size:10px;letter-spacing:2px;font-weight:700;}
  .title{color:#fff;font-weight:900;font-size:21px;line-height:1.1;}
  .back{background:var(--card);border:none;color:#aaa;border-radius:12px;width:38px;height:38px;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .stats{display:flex;gap:8px;margin:12px 0 16px;}
  .sbox{flex:1;background:var(--card);border-radius:14px;padding:10px 4px;text-align:center;}
  .sval{color:#fff;font-weight:900;font-size:17px;font-family:'Space Mono';line-height:1;}
  .sval.sm{font-size:11px;}
  .slbl{color:#555;font-size:8px;margin-top:4px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;}
  .mnav{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
  .mbtn{background:none;border:none;color:#888;font-size:24px;cursor:pointer;padding:4px 10px;line-height:1;}
  .mtitle{color:#fff;font-weight:900;font-size:19px;}
  .mtitle span{color:var(--orange);}
  .dlabels{display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:5px;}
  .dlabel{text-align:center;color:#555;font-size:10px;font-weight:700;font-family:'Space Mono';}
  .dlabel.sun{color:#FF6B3566;}
  .cgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;}
  .dcell{border-radius:11px;padding:7px 2px 6px;text-align:center;cursor:pointer;min-height:54px;transition:transform .1s;background:transparent;border:1.5px solid transparent;}
  .dcell:active{transform:scale(.91);}
  .dcell.hw{background:var(--card);}
  .dcell.td{background:#FF6B3314;border-color:var(--orange);}
  .dnum{font-size:12px;font-weight:700;color:#444;line-height:1;}
  .dcell.hw .dnum{color:#ccc;}
  .dcell.td .dnum{color:var(--orange);font-weight:900;}
  .dcell.su .dnum{color:#FF6B3544;}
  .demojis{display:flex;justify-content:center;gap:1px;margin-top:3px;flex-wrap:wrap;font-size:11px;line-height:1;}
  .dmins{font-size:8px;color:var(--orange);font-weight:800;margin-top:2px;font-family:'Space Mono';}
  .fab{position:fixed;bottom:24px;right:max(16px,calc(50vw - 199px));width:58px;height:58px;border-radius:29px;background:linear-gradient(135deg,#FF6B35,#F7931E);border:none;color:#fff;font-size:26px;cursor:pointer;box-shadow:0 6px 24px #FF6B3560;display:flex;align-items:center;justify-content:center;font-weight:900;transition:transform .1s;z-index:100;}
  .fab:active{transform:scale(.92);}
  .scard{background:var(--card);border-radius:18px;padding:15px;margin-bottom:10px;border:1px solid #ffffff06;position:relative;overflow:hidden;}
  .cacc{position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:18px 0 0 18px;}
  .ctop{display:flex;align-items:flex-start;justify-content:space-between;}
  .ciwrap{width:50px;height:50px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;}
  .cinfo{flex:1;padding-left:12px;}
  .cname{color:#fff;font-weight:900;font-size:15px;}
  .cmeta{display:flex;align-items:center;gap:8px;margin-top:5px;}
  .cdur{color:var(--orange);font-family:'Space Mono';font-weight:700;font-size:13px;}
  .cdur span{font-size:10px;color:#888;}
  .dot2{width:3px;height:3px;border-radius:50%;background:#444;display:inline-block;}
  .ibadge{font-size:9px;font-weight:800;border-radius:8px;padding:2px 8px;letter-spacing:.5px;}
  .cacts{display:flex;gap:6px;}
  .ibtn{background:#2a2a3a;border:none;border-radius:10px;width:32px;height:32px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;}
  .ibtn.del{background:#2a1a1a;}
  .cnote{margin-top:10px;padding:9px 11px;background:#ffffff06;border-radius:10px;color:#777;font-size:12px;font-style:italic;}
  .dbar{margin-top:12px;}
  .dbarbg{height:3px;background:#1e1e30;border-radius:2px;overflow:hidden;}
  .dbarfill{height:100%;border-radius:2px;}
  .empty{text-align:center;padding:60px 20px;}
  .eicon{font-size:52px;margin-bottom:14px;}
  .etitle{color:#444;font-weight:700;font-size:16px;}
  .esub{color:#2a2a3a;font-size:13px;margin-top:6px;}
  .pills{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}
  .pill{border-radius:20px;padding:4px 12px;font-size:11px;font-weight:800;border:1px solid;}
  .addbtn{width:100%;padding:16px;border-radius:18px;background:linear-gradient(135deg,#FF6B35,#F7931E);border:none;color:#fff;font-weight:900;font-size:15px;cursor:pointer;font-family:'Nunito';box-shadow:0 4px 20px #FF6B3440;transition:transform .1s;}
  .addbtn:active{transform:scale(.97);}
  .bbar{padding:10px 14px 28px;flex-shrink:0;}
  .slbl2{color:#888;font-size:10px;font-weight:800;letter-spacing:1.5px;margin-bottom:10px;font-family:'Space Mono';display:flex;justify-content:space-between;align-items:center;}
  .slbl2 .val{color:var(--orange);font-size:14px;}
  .slbl2 .val span{font-size:10px;color:#888;}
  .wgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:20px;}
  .wtbtn{background:var(--card);border:1.5px solid transparent;border-radius:14px;padding:10px 4px;cursor:pointer;color:#555;display:flex;flex-direction:column;align-items:center;gap:4px;font-weight:700;font-size:10px;font-family:'Nunito';transition:all .15s;line-height:1.2;text-align:center;}
  .wtbtn.act{background:#FF6B3522;border-color:var(--orange);color:#fff;}
  .wico{font-size:20px;}
  .dursec{margin-bottom:20px;}
  input[type=range]{-webkit-appearance:none;width:100%;height:6px;border-radius:3px;outline:none;cursor:pointer;}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:var(--orange);cursor:pointer;box-shadow:0 0 10px #FF6B3566;}
  .presets{display:flex;justify-content:space-between;margin-top:8px;gap:4px;}
  .preset{background:transparent;border:1px solid var(--border);border-radius:8px;padding:4px 0;color:#444;font-size:10px;cursor:pointer;font-weight:700;flex:1;text-align:center;transition:all .12s;}
  .preset.act{background:#FF6B3520;border-color:var(--orange);color:var(--orange);}
  .igrid{display:flex;gap:8px;margin-bottom:20px;}
  .iibtn{flex:1;padding:10px 4px;border-radius:14px;border:1.5px solid transparent;cursor:pointer;color:#444;font-weight:800;font-size:9px;font-family:'Nunito';text-align:center;line-height:1.4;background:var(--card);transition:all .15s;}
  textarea{width:100%;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:13px;color:#ddd;font-size:14px;font-family:'Nunito';outline:none;line-height:1.5;resize:none;}
  textarea::placeholder{color:#333;}
  .savebtn{width:100%;padding:17px;border-radius:18px;background:linear-gradient(135deg,#FF6B35,#F7931E);border:none;color:#fff;font-weight:900;font-size:16px;cursor:pointer;font-family:'Nunito';box-shadow:0 4px 20px #FF6B3440;margin-top:8px;transition:transform .1s;}
  .savebtn:active{transform:scale(.97);}
  .todaybtn{background:#FF6B3520;border:1px solid #FF6B3540;color:#FF6B35;border-radius:20px;padding:4px 12px;font-size:10px;font-weight:800;cursor:pointer;font-family:'Nunito';}
`;

export default function WorkoutTracker() {
  const [workouts, setWorkouts] = useState(null); // null = loading
  const [screen, setScreen] = useState('calendar');
  const [year, setYear] = useState(TODAY.getFullYear());
  const [month, setMonth] = useState(TODAY.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  // log form
  const [logDate, setLogDate] = useState('');
  const [logType, setLogType] = useState('Running');
  const [logDur, setLogDur] = useState(30);
  const [logInt, setLogInt] = useState('Moderate');
  const [logNote, setLogNote] = useState('');
  const [editId, setEditId] = useState(null);

  // Load data on mount
  useEffect(() => {
    (async () => {
      const saved = await storageGet('wl_workouts');
      const seeded = await storageGet(SEED_KEY);
      if (saved) {
        setWorkouts(saved);
      } else {
        const seed = makeSeedData();
        setWorkouts(seed);
        await storageSet('wl_workouts', seed);
        await storageSet(SEED_KEY, true);
      }
    })();
  }, []);

  const saveWorkouts = useCallback(async (data) => {
    setWorkouts(data);
    await storageSet('wl_workouts', data);
  }, []);

  if (workouts === null) {
    return (
      <div style={{minHeight:'100vh',background:'#0D0D1A',display:'flex',alignItems:'center',justifyContent:'center',color:'#FF6B35',fontFamily:'Nunito',fontSize:18,fontWeight:800}}>
        💪 Loading...
      </div>
    );
  }

  // Computed
  const todayKey = fmtDate(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());

  function getStreak() {
    let s = 0, cur = new Date(TODAY);
    while (true) {
      const k = fmtDate(cur.getFullYear(), cur.getMonth(), cur.getDate());
      if (workouts[k]?.length > 0) { s++; cur.setDate(cur.getDate()-1); } else break;
    }
    return s;
  }

  function getMonthStats() {
    const entries = Object.entries(workouts).filter(([k]) => {
      const {y,m} = parseDK(k); return y===year && m===month;
    });
    return {
      sessions: entries.reduce((a,[,v])=>a+v.length,0),
      activeDays: entries.length,
      mins: entries.reduce((a,[,v])=>a+v.reduce((s,w)=>s+w.duration,0),0)
    };
  }

  function openLog(dateKey, id=null) {
    setLogDate(dateKey);
    if (id) {
      const w = workouts[dateKey]?.find(x=>x.id==id);
      if (w) { setLogType(w.type); setLogDur(w.duration); setLogInt(w.intensity); setLogNote(w.note||''); setEditId(id); }
    } else {
      setLogType('Running'); setLogDur(30); setLogInt('Moderate'); setLogNote(''); setEditId(null);
    }
    setSelectedDay(dateKey);
    setScreen('log');
  }

  async function handleSave() {
    const entry = { id: editId || Date.now()+Math.random(), type:logType, duration:logDur, intensity:logInt, note:logNote };
    const next = { ...workouts };
    if (!next[logDate]) next[logDate] = [];
    if (editId) {
      const idx = next[logDate].findIndex(w=>w.id==editId);
      if (idx>=0) next[logDate][idx]=entry; else next[logDate].push(entry);
    } else {
      next[logDate] = [...next[logDate], entry];
    }
    await saveWorkouts(next);
    setScreen('detail');
  }

  async function handleDelete(dateKey, id) {
    if (!confirm('Delete this workout?')) return;
    const next = { ...workouts };
    next[dateKey] = (next[dateKey]||[]).filter(w=>w.id!=id);
    if (next[dateKey].length===0) delete next[dateKey];
    await saveWorkouts(next);
  }

  const stats = getMonthStats();
  const streak = getStreak();
  const days = daysInMonth(year, month);
  const offset = firstDay(year, month);
  const minsLabel = stats.mins>=60 ? `${Math.floor(stats.mins/60)}h${stats.mins%60>0?stats.mins%60+'m':''}` : `${stats.mins}m`;

  // ── CALENDAR ──
  if (screen === 'calendar') return (
    <div className="wl-root">
      <style>{css}</style>
      <div className="screen">
        <div className="hdr">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
            <span className="tag">WORKOUT LOG</span>
            <button className="todaybtn" onClick={()=>{setSelectedDay(todayKey);setScreen('detail');}}>TODAY</button>
          </div>
          <div className="stats">
            {[
              {v:stats.sessions,l:'Sessions'},
              {v:stats.activeDays,l:'Active Days'},
              {v:minsLabel,l:'Total Time',sm:minsLabel.length>4},
              {v:`${streak}🔥`,l:'Streak'},
            ].map(s=>(
              <div className="sbox" key={s.l}>
                <div className={`sval${s.sm?' sm':''}`}>{s.v}</div>
                <div className="slbl">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="mnav">
            <button className="mbtn" onClick={()=>month===0?(setYear(y=>y-1),setMonth(11)):setMonth(m=>m-1)}>‹</button>
            <span className="mtitle">{MONTHS[month]} <span>{year}</span></span>
            <button className="mbtn" onClick={()=>month===11?(setYear(y=>y+1),setMonth(0)):setMonth(m=>m+1)}>›</button>
          </div>
          <div className="dlabels">
            {DAY_LABELS.map((l,i)=><div key={i} className={`dlabel${i===6?' sun':''}`}>{l}</div>)}
          </div>
        </div>

        <div className="scroll" style={{padding:'8px 12px 110px'}}>
          <div className="cgrid">
            {Array.from({length:offset}).map((_,i)=><div key={`e${i}`}/>)}
            {Array.from({length:days}).map((_,i)=>{
              const d=i+1;
              const key=fmtDate(year,month,d);
              const dw=workouts[key]||[];
              const isToday=year===TODAY.getFullYear()&&month===TODAY.getMonth()&&d===TODAY.getDate();
              const isSun=(offset+i)%7===6;
              let cls='dcell';
              if(isToday) cls+=' td'; if(dw.length>0) cls+=' hw'; if(isSun) cls+=' su';
              const totalMins=dw.reduce((a,w)=>a+w.duration,0);
              return (
                <div key={d} className={cls} onClick={()=>{setSelectedDay(key);setScreen('detail');}}>
                  <div className="dnum">{d}</div>
                  {dw.length>0&&<>
                    <div className="demojis">{dw.slice(0,3).map((w,ix)=><span key={ix}>{getIcon(w.type)}</span>)}</div>
                    <div className="dmins">{totalMins}m</div>
                  </>}
                </div>
              );
            })}
          </div>
        </div>

        <button className="fab" onClick={()=>openLog(todayKey)}>＋</button>
      </div>
    </div>
  );

  // ── DETAIL ──
  if (screen === 'detail' && selectedDay) {
    const {y,m,d}=parseDK(selectedDay);
    const dw=workouts[selectedDay]||[];
    const totalMins=dw.reduce((a,w)=>a+w.duration,0);
    const isToday=selectedDay===todayKey;
    return (
      <div className="wl-root">
        <style>{css}</style>
        <div className="screen">
          <div className="hdr">
            <div className="hdr-row">
              <button className="back" onClick={()=>setScreen('calendar')}>←</button>
              <div>
                <div className="tag">WORKOUT LOG</div>
                <div className="title">{MONTHS[m].slice(0,3)} {d}, {y}{isToday?' · Today':''}</div>
              </div>
            </div>
            {dw.length>0&&<div className="pills">
              <span className="pill" style={{color:'#FF6B35',borderColor:'#FF6B3540',background:'#FF6B3515'}}>{dw.length} session{dw.length>1?'s':''}</span>
              <span className="pill" style={{color:'#7B8FFF',borderColor:'#4361EE40',background:'#4361EE15'}}>{totalMins} min total</span>
            </div>}
          </div>

          <div className="scroll">
            {dw.length===0
              ? <div className="empty"><div className="eicon">🏋️</div><div className="etitle">No workouts logged</div><div className="esub">Tap below to log a session</div></div>
              : dw.map((w,idx)=>{
                  const color=COLORS[idx%COLORS.length];
                  const ic=getIColor(w.intensity);
                  const pct=Math.min(100,(w.duration/120)*100);
                  return (
                    <div className="scard" key={w.id}>
                      <div className="cacc" style={{background:color}}/>
                      <div className="ctop">
                        <div className="ciwrap" style={{background:`${color}22`}}>{getIcon(w.type)}</div>
                        <div className="cinfo">
                          <div className="cname">{w.type}</div>
                          <div className="cmeta">
                            <span className="cdur">{w.duration}<span> min</span></span>
                            <span className="dot2"/>
                            <span className="ibadge" style={{background:`${ic}22`,color:ic}}>{w.intensity.toUpperCase()}</span>
                          </div>
                        </div>
                        <div className="cacts">
                          <button className="ibtn" onClick={()=>openLog(selectedDay,w.id)}>✏️</button>
                          <button className="ibtn del" onClick={()=>handleDelete(selectedDay,w.id)}>🗑️</button>
                        </div>
                      </div>
                      {w.note&&<div className="cnote">"{w.note}"</div>}
                      <div className="dbar"><div className="dbarbg"><div className="dbarfill" style={{width:`${pct}%`,background:`linear-gradient(90deg,${color},${COLORS[(idx+2)%COLORS.length]})`}}/></div></div>
                    </div>
                  );
                })
            }
          </div>

          <div className="bbar">
            <button className="addbtn" onClick={()=>openLog(selectedDay)}>+ Log Workout</button>
          </div>
        </div>
      </div>
    );
  }

  // ── LOG ──
  if (screen === 'log') {
    const {y,m,d}=parseDK(logDate);
    const sliderBg = `linear-gradient(to right,#FF6B35 0%,#FF6B35 ${((logDur-5)/175)*100}%,#2a2a3a ${((logDur-5)/175)*100}%,#2a2a3a 100%)`;
    return (
      <div className="wl-root">
        <style>{css}</style>
        <div className="screen">
          <div className="hdr">
            <div className="hdr-row">
              <button className="back" onClick={()=>setScreen('detail')}>←</button>
              <div>
                <div className="tag">{editId?'EDIT SESSION':'NEW SESSION'}</div>
                <div className="title">{MONTHS[m].slice(0,3)} {d}, {y}</div>
              </div>
            </div>
          </div>

          <div className="scroll">
            {/* Type */}
            <div className="slbl2">WORKOUT TYPE</div>
            <div className="wgrid">
              {WORKOUTS.map(w=>(
                <button key={w.name} className={`wtbtn${logType===w.name?' act':''}`} onClick={()=>setLogType(w.name)}>
                  <span className="wico">{w.icon}</span>{w.name}
                </button>
              ))}
            </div>

            {/* Duration */}
            <div className="dursec">
              <div className="slbl2">DURATION <span className="val">{logDur}<span> min</span></span></div>
              <input type="range" min={5} max={180} step={5} value={logDur} style={{background:sliderBg}}
                onChange={e=>setLogDur(Number(e.target.value))}/>
              <div className="presets">
                {[15,30,45,60,90,120].map(v=>(
                  <button key={v} className={`preset${logDur===v?' act':''}`} onClick={()=>setLogDur(v)}>{v}m</button>
                ))}
              </div>
            </div>

            {/* Intensity */}
            <div className="slbl2">INTENSITY</div>
            <div className="igrid">
              {INTENSITY.map(i=>(
                <button key={i.label} className={`iibtn${logInt===i.label?' act':''}`}
                  style={logInt===i.label?{background:`${i.color}22`,borderColor:i.color,color:i.color}:{}}
                  onClick={()=>setLogInt(i.label)}>
                  {i.emoji}<br/>{i.label}
                </button>
              ))}
            </div>

            {/* Notes */}
            <div className="slbl2" style={{marginBottom:10}}>NOTES (OPTIONAL)</div>
            <textarea rows={3} placeholder="How did it feel? Any PRs? Modifications…"
              value={logNote} onChange={e=>setLogNote(e.target.value)}/>

            <button className="savebtn" onClick={handleSave}>
              {editId?'Update Workout ✓':'Save Workout ✓'}
            </button>
            <div style={{height:30}}/>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
