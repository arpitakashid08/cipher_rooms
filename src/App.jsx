import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════ */
const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --void:#020508;--deep:#08111a;--surface:#0d1a26;--elevated:#112233;--glass:rgba(8,17,26,.9);
      --cyan:#00ffe7;--green:#00ff88;--amber:#ffb800;--red:#ff2d55;--purple:#b060ff;
      --dim:rgba(0,255,231,.1);--glow:rgba(0,255,231,.4);
      --tx:#d0e8f0;--ts:#6a8fa8;--tm:#2a4a5a;
      --mono:'Share Tech Mono',monospace;--ui:'Rajdhani',sans-serif;--disp:'Orbitron',sans-serif;
    }
    html,body,#root{width:100%;height:100%;overflow:hidden;background:var(--void);color:var(--tx);font-family:var(--ui)}
    ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:var(--deep)}::-webkit-scrollbar-thumb{background:var(--cyan)}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes fadeOut{from{opacity:1}to{opacity:0}}
    @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
    @keyframes scanH{0%{top:0}100%{top:100%}}
    @keyframes circPulse{0%,100%{stroke-dashoffset:0;opacity:.35}50%{stroke-dashoffset:-30;opacity:.9}}
    @keyframes hexGlow{0%,100%{opacity:.04}50%{opacity:.1}}
    @keyframes hackerGlow{0%,100%{filter:drop-shadow(0 0 8px rgba(0,255,231,.3))}50%{filter:drop-shadow(0 0 24px rgba(0,255,231,.75))}}
    @keyframes screenFlicker{0%,100%{opacity:.85}85%{opacity:.6}86%{opacity:.9}}
    @keyframes dataRise{0%{transform:translateY(0);opacity:.7}100%{transform:translateY(-30px);opacity:0}}
    @keyframes lockShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
    @keyframes unlockPop{0%{transform:scale(1)}35%{transform:scale(1.35)}70%{transform:scale(.92)}100%{transform:scale(1)}}
    @keyframes logoReveal{0%{letter-spacing:18px;opacity:0}100%{letter-spacing:5px;opacity:1}}
    @keyframes termIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
    @keyframes msgIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
    .btn{font-family:var(--disp);font-size:10px;letter-spacing:2px;text-transform:uppercase;border:1px solid var(--glow);background:transparent;color:var(--cyan);padding:10px 22px;cursor:pointer;position:relative;overflow:hidden;transition:all .2s;clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)}
    .btn:hover{background:rgba(0,255,231,.07);box-shadow:0 0 22px rgba(0,255,231,.22)}
    .btn:disabled{opacity:.35;cursor:not-allowed}
    .btn-solid{background:rgba(0,255,231,.09)}
    .inp{width:100%;background:var(--surface);border:1px solid var(--dim);color:var(--tx);font-family:var(--mono);font-size:12px;padding:10px 14px;outline:none;transition:border-color .2s,box-shadow .2s}
    .inp:focus{border-color:var(--cyan);box-shadow:0 0 12px rgba(0,255,231,.15)}
    .inp::placeholder{color:var(--tm)}
    .panel{background:var(--glass);border:1px solid var(--dim);backdrop-filter:blur(10px)}
    .tag{font-family:var(--mono);font-size:9px;padding:2px 6px;border:1px solid currentColor;letter-spacing:1px}
  `}</style>
);

/* ═══════════════════════════════════════════════════════════
   CIRCUIT BOARD BACKGROUND  (PCB traces + node dots)
═══════════════════════════════════════════════════════════ */
const CircuitBg = () => {
  const traces = [
    "M0,80 H130 L150,60 H310","M310,60 H510 L530,80 H760",
    "M100,200 V310 L120,330 V510","M620,140 V255 L600,275 V410",
    "M0,360 H90 L110,340 H260 L280,360 H460",
    "M460,360 H610 L630,380 H800","M210,0 V88 L230,108 V210",
    "M510,410 V520","M670,0 V108 L650,128 V210",
    "M360,0 V68 L380,88 V170 L360,190 V275",
    "M130,70 H210 L230,50 H390 L410,70 H495",
    "M0,520 H60 L80,500 H195","M710,310 H800",
  ];
  const nodes = [
    [130,80],[310,60],[100,200],[120,330],[620,140],[600,275],
    [110,340],[280,360],[630,380],[230,108],[380,88],[410,70],
    [510,410],[495,70],[210,88],[360,190],[650,128],[390,50],
  ];
  return (
    <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",opacity:.15,pointerEvents:"none",zIndex:0}} preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00ffe7" stopOpacity=".8"/>
          <stop offset="100%" stopColor="#00ff88" stopOpacity=".3"/>
        </linearGradient>
      </defs>
      {traces.map((d,i)=>(
        <path key={i} d={d} stroke="url(#cg)" strokeWidth=".9" fill="none" strokeDasharray="8 4"
          style={{animation:`circPulse ${3+i*.35}s ${i*.28}s ease-in-out infinite`}}/>
      ))}
      {nodes.map(([cx,cy],i)=>(
        <g key={i}>
          <circle cx={cx} cy={cy} r="3.5" fill="none" stroke="var(--cyan)" strokeWidth=".8"
            style={{animation:`pulse ${2+i*.22}s ${i*.18}s ease-in-out infinite`}}/>
          <circle cx={cx} cy={cy} r="1.4" fill="var(--cyan)"
            style={{animation:`pulse ${2+i*.22}s ${i*.18}s ease-in-out infinite`}}/>
        </g>
      ))}
    </svg>
  );
};

/* HEX GRID */
const HexGrid = () => (
  <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}} preserveAspectRatio="xMidYMid slice">
    <defs>
      <pattern id="hex" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
        <polygon points="28,2 50,14 50,34 28,46 6,34 6,14" fill="none" stroke="rgba(0,255,231,.055)" strokeWidth=".6"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hex)" style={{animation:"hexGlow 5s ease-in-out infinite"}}/>
  </svg>
);

/* SCAN LINE */
const ScanLine = () => (
  <div style={{position:"fixed",left:0,right:0,height:"2px",background:"linear-gradient(90deg,transparent,rgba(0,255,231,.15),transparent)",pointerEvents:"none",zIndex:2,animation:"scanH 7s linear infinite"}}/>
);

/* ═══════════════════════════════════════════════════════════
   HACKER SILHOUETTE — pure SVG, hooded figure at desk
═══════════════════════════════════════════════════════════ */
const HackerFigure = ({ lit }) => (
  <svg viewBox="0 0 440 360" width="440" height="360" style={{animation:"hackerGlow 3s ease-in-out infinite",display:"block"}}>

    {/* ── DESK ── */}
    <rect x="10" y="250" width="420" height="9" rx="2" fill="#0a1c2a" stroke="rgba(0,255,231,.3)" strokeWidth="1.2"/>
    <rect x="10" y="258" width="420" height="70" rx="0" fill="#050d14"/>
    <rect x="32" y="258" width="7" height="70" fill="#07111a" stroke="rgba(0,255,231,.08)" strokeWidth=".5"/>
    <rect x="401" y="258" width="7" height="70" fill="#07111a" stroke="rgba(0,255,231,.08)" strokeWidth=".5"/>

    {/* ── SECOND MONITOR (right) ── */}
    <rect x="318" y="148" width="92" height="68" rx="3" fill="#040c14" stroke="rgba(0,255,231,.4)" strokeWidth="1.2"/>
    <rect x="322" y="152" width="84" height="60" rx="2" fill={lit?"rgba(0,255,231,.05)":"rgba(0,255,231,.01)"} style={{transition:"fill 1s"}}/>
    {lit && Array.from({length:7},(_,i)=>(
      <rect key={i} x={327} y={157+i*8} width={25+((i*37)%52)} height="3.5" rx="1"
        fill={i%2===0?"rgba(0,255,136,.55)":"rgba(0,200,255,.4)"}
        style={{animation:`screenFlicker ${1.4+i*.25}s ease-in-out infinite`}}/>
    ))}
    <rect x="356" y="216" width="14" height="16" rx="1" fill="#050d14" stroke="rgba(0,255,231,.15)" strokeWidth=".6"/>
    <rect x="346" y="230" width="34" height="5" rx="1" fill="#050d14" stroke="rgba(0,255,231,.12)" strokeWidth=".6"/>

    {/* ── LAPTOP BASE ── */}
    <rect x="108" y="226" width="212" height="26" rx="3" fill="#091825" stroke="rgba(0,255,231,.4)" strokeWidth="1.3"/>
    {/* keyboard */}
    {[0,1,2].map(row=>
      Array.from({length:11-row},(_,i)=>(
        <rect key={`${row}-${i}`} x={115+i*17+row*5} y={230+row*7} width="13" height="4.5" rx="1"
          fill="rgba(0,255,231,.07)" stroke="rgba(0,255,231,.18)" strokeWidth=".4"/>
      ))
    )}

    {/* ── LAPTOP SCREEN ── */}
    <rect x="108" y="208" width="212" height="6" rx="2" fill="#091825" stroke="rgba(0,255,231,.22)" strokeWidth=".8"/>
    <rect x="112" y="88" width="204" height="124" rx="4" fill="#030b12" stroke="rgba(0,255,231,.55)" strokeWidth="1.6"/>
    <rect x="117" y="93" width="194" height="115" rx="2" fill={lit?"rgba(0,255,231,.07)":"rgba(0,255,231,.02)"} style={{transition:"fill 1.2s"}}/>
    {/* screen code lines */}
    {lit && Array.from({length:11},(_,i)=>(
      <rect key={i} x={124} y={100+i*10} width={30+((i*43)%120)} height="4" rx="1"
        fill={i%3===0?"rgba(0,255,136,.55)":i%3===1?"rgba(0,225,255,.45)":"rgba(180,120,255,.4)"}
        style={{animation:`screenFlicker ${1.5+i*.28}s ease-in-out infinite`}}/>
    ))}
    {/* blinking cursor */}
    {lit && <rect x="124" y="210" width="6" height="9" rx="1" fill="var(--cyan)" style={{animation:"blink 1s step-end infinite"}}/>}
    {/* screen scanline */}
    {lit && <rect x="117" y="93" width="194" height="3" fill="rgba(0,255,231,.09)" style={{animation:"scanH 3.5s linear infinite"}}/>}
    {/* screen glow */}
    {lit && <ellipse cx="214" cy="210" rx="90" ry="10" fill="rgba(0,255,231,.07)"/>}

    {/* ── BODY / HOODIE ── */}
    <path d="M158,242 C146,220 136,196 142,172 L175,157 L214,154 L253,157 L286,172 C292,196 282,220 270,242 Z"
      fill="#050d17" stroke="rgba(0,255,231,.15)" strokeWidth="1"/>
    <path d="M184,206 Q214,200 244,206 L241,226 Q214,232 187,226 Z"
      fill="rgba(0,255,231,.04)" stroke="rgba(0,255,231,.1)" strokeWidth=".6"/>

    {/* ── LEFT ARM ── */}
    <path d="M148,188 C126,200 112,222 120,233 L153,233 C156,222 153,206 164,196 Z"
      fill="#050d17" stroke="rgba(0,255,231,.13)" strokeWidth=".8"/>
    <ellipse cx="124" cy="234" rx="15" ry="7.5" fill="#0a1820" stroke="rgba(0,255,231,.2)" strokeWidth=".8"/>
    {[-9,-4.5,0,4.5,9].map((dx,i)=>(
      <rect key={i} x={120+dx} y={226} width="3" height="9" rx="1.5" fill="#0d2030" stroke="rgba(0,255,231,.18)" strokeWidth=".5"/>
    ))}

    {/* ── RIGHT ARM ── */}
    <path d="M280,188 C302,200 316,222 308,233 L275,233 C272,222 275,206 264,196 Z"
      fill="#050d17" stroke="rgba(0,255,231,.13)" strokeWidth=".8"/>
    <ellipse cx="304" cy="234" rx="15" ry="7.5" fill="#0a1820" stroke="rgba(0,255,231,.2)" strokeWidth=".8"/>
    {[-9,-4.5,0,4.5,9].map((dx,i)=>(
      <rect key={i} x={300+dx} y={226} width="3" height="9" rx="1.5" fill="#0d2030" stroke="rgba(0,255,231,.18)" strokeWidth=".5"/>
    ))}

    {/* ── NECK ── */}
    <rect x="202" y="140" width="24" height="18" rx="4" fill="#070f18" stroke="rgba(0,255,231,.1)" strokeWidth=".8"/>

    {/* ── HEAD / HOOD ── */}
    <path d="M172,145 C168,118 176,92 214,87 C252,92 260,118 256,145 Z"
      fill="#060d16" stroke="rgba(0,255,231,.22)" strokeWidth="1.2"/>
    <path d="M175,145 C175,128 180,106 214,100 C248,106 253,128 253,145 Z" fill="#030a12"/>
    {/* hood outline shading */}
    <path d="M172,145 C162,134 165,108 183,96" fill="none" stroke="rgba(0,255,231,.12)" strokeWidth="1.3"/>
    <path d="M256,145 C266,134 263,108 245,96" fill="none" stroke="rgba(0,255,231,.12)" strokeWidth="1.3"/>
    {/* glowing eyes */}
    {lit && <>
      <ellipse cx="200" cy="124" rx="5.5" ry="3.2" fill="none" stroke="rgba(0,255,231,.65)" strokeWidth=".9"
        style={{animation:"pulse 2.2s ease-in-out infinite"}}/>
      <ellipse cx="228" cy="124" rx="5.5" ry="3.2" fill="none" stroke="rgba(0,255,231,.65)" strokeWidth=".9"
        style={{animation:"pulse 2.2s .6s ease-in-out infinite"}}/>
      <ellipse cx="200" cy="124" rx="2.2" ry="1.6" fill="rgba(0,255,231,.8)"/>
      <ellipse cx="228" cy="124" rx="2.2" ry="1.6" fill="rgba(0,255,231,.8)"/>
    </>}

    {/* ── COFFEE MUG ── */}
    <rect x="50" y="228" width="30" height="24" rx="3" fill="#050e17" stroke="rgba(0,255,231,.28)" strokeWidth=".9"/>
    <path d="M80,234 Q92,234 92,241 Q92,248 80,248" fill="none" stroke="rgba(0,255,231,.28)" strokeWidth=".9"/>
    {[0,1,2].map(i=>(
      <path key={i} d={`M${60+i*6},226 Q${58+i*6},219 ${61+i*6},212`} fill="none" stroke="rgba(0,255,231,.2)" strokeWidth=".9"
        style={{animation:`pulse ${1.6+i*.3}s ${i*.45}s ease-in-out infinite`}}/>
    ))}
    {/* mug line detail */}
    <rect x="54" y="238" width="22" height="1.5" rx="1" fill="rgba(0,255,231,.12)"/>

    {/* ── FLOATING DATA CHARS near screens ── */}
    {lit && [
      {x:90,y:115,t:"01"},{x:74,y:148,t:"FF"},{x:83,y:178,t:">_"},
      {x:350,y:144,t:"0x"},{x:368,y:132,t:"[]"},{x:92,y:95,t:"/*"},
    ].map((p,i)=>(
      <text key={i} x={p.x} y={p.y} fill="rgba(0,255,136,.5)" fontSize="9" fontFamily="Share Tech Mono"
        style={{animation:`dataRise ${2.2+i*.5}s ${i*.4}s ease-in infinite`}}>{p.t}</text>
    ))}
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   INTRO ANIMATION
═══════════════════════════════════════════════════════════ */
const Intro = ({ onDone }) => {
  const [phase, setPhase] = useState(0);
  // 0=dark, 1=hacker visible, 2=screen lights+eyes, 3=lock appears,
  // 4=lock shakes, 5=lock unlocks, 6=logo reveal, 7=exit
  const termLines = [
    "> INITIALIZING CIPHERROOMS v2.1...",
    "> LOADING AES-256 ENCRYPTION MODULE ✓",
    "> ESTABLISHING SECURE TUNNEL ✓",
    "> VERIFYING IDENTITY MATRIX ✓",
    "> ACCESS GRANTED — WELCOME TO THE GRID",
  ];
  const [termIdx, setTermIdx] = useState(0);

  useEffect(()=>{
    const times = [500,1300,2100,3000,3700,4500,5400,6600];
    const ts = times.map((t,i)=>setTimeout(()=>setPhase(i+1),t));
    return ()=>ts.forEach(clearTimeout);
  },[]);

  useEffect(()=>{
    if(phase>=2 && termIdx<termLines.length){
      const t = setTimeout(()=>setTermIdx(n=>n+1),650);
      return()=>clearTimeout(t);
    }
  },[phase,termIdx]);

  useEffect(()=>{ if(phase===7) setTimeout(onDone,400); },[phase]);

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,
      background:"radial-gradient(ellipse 85% 75% at 50% 55%, #051018 0%, #020508 100%)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      ...(phase===7?{animation:"fadeOut .4s forwards"}:{})}}>
      <CircuitBg/><HexGrid/><ScanLine/>

      {/* Ambient desk glow */}
      {phase>=2&&(
        <div style={{position:"absolute",bottom:68,left:"50%",transform:"translateX(-50%)",
          width:380,height:70,
          background:"radial-gradient(ellipse,rgba(0,255,231,.11) 0%,transparent 70%)",
          pointerEvents:"none"}}/>
      )}

      {/* HACKER */}
      <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",
        opacity:phase>=1?1:0,transition:"opacity 1.2s",zIndex:5}}>
        <HackerFigure lit={phase>=2}/>
      </div>

      {/* LOCK */}
      {phase>=3&&phase<6&&(
        <div style={{position:"relative",zIndex:10,fontSize:56,textAlign:"center",marginBottom:12,
          filter:"drop-shadow(0 0 22px rgba(0,255,231,.85))",
          animation:phase===4?"lockShake .55s ease-in-out":phase===5?"unlockPop .55s ease-out":"none"}}>
          {phase>=5?"🔓":"🔒"}
        </div>
      )}

      {/* spinning ring after unlock */}
      {phase>=5&&phase<7&&(
        <div style={{position:"absolute",width:130,height:130,borderRadius:"50%",
          border:"1px solid rgba(0,255,231,.18)",animation:"spin 4s linear infinite",zIndex:9}}>
          <div style={{position:"absolute",top:0,left:"50%",transform:"translate(-50%,-50%)",
            width:7,height:7,borderRadius:"50%",background:"var(--cyan)",boxShadow:"0 0 10px var(--cyan)"}}/>
        </div>
      )}

      {/* LOGO */}
      {phase>=6&&(
        <div style={{position:"relative",zIndex:10,textAlign:"center",animation:"slideUp .8s ease-out",marginBottom:8}}>
          <div style={{fontFamily:"var(--disp)",fontSize:40,fontWeight:900,color:"var(--cyan)",
            textShadow:"0 0 28px rgba(0,255,231,.9),0 0 60px rgba(0,255,231,.3)",
            animation:"logoReveal .8s ease-out"}}>
            CIPHER<span style={{color:"rgba(0,255,136,.85)"}}>ROOMS</span>
          </div>
          <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ts)",letterSpacing:4,marginTop:7}}>
            SECURE · ENCRYPTED · COLLABORATIVE
          </div>
        </div>
      )}

      {/* TERMINAL OUTPUT */}
      {phase>=2&&phase<7&&(
        <div style={{position:"absolute",bottom:20,left:22,fontFamily:"var(--mono)",fontSize:10,
          color:"rgba(0,255,136,.75)",lineHeight:2,zIndex:10}}>
          {termLines.slice(0,termIdx).map((l,i)=>(
            <div key={i} style={{animation:"termIn .3s ease-out"}}>
              <span style={{color:"rgba(0,255,231,.4)"}}></span>{l.slice(2)}
            </div>
          ))}
          {termIdx<termLines.length&&(
            <span style={{animation:"blink 1s step-end infinite",color:"var(--cyan)"}}>█</span>
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   DEMO USERS
═══════════════════════════════════════════════════════════ */
const USERS = [
  {id:"u0",email:"admin_cipher@cipher.com",  password:"cipher@2024",name:"Alex Morgan",    role:"admin", avatar:"👑"},
  {id:"u1",email:"sarah_frontend@cipher.com",password:"front123",   name:"Sarah Kim",      role:"leader",avatar:"⚛"},
  {id:"u2",email:"marcus_back@cipher.com",   password:"back456",    name:"Marcus Thompson",role:"leader",avatar:"⬡"},
  {id:"u3",email:"priya_ai@cipher.com",      password:"aiml789",    name:"Priya Rajan",    role:"leader",avatar:"◈"},
  {id:"u4",email:"dev_alex@cipher.com",      password:"dev001",     name:"Alex Chen",      role:"member",avatar:"⚡"},
  {id:"u5",email:"dev_jamie@cipher.com",     password:"dev002",     name:"Jamie Liu",      role:"member",avatar:"🌟"},
  {id:"u6",email:"design_leo@cipher.com",    password:"des789",     name:"Leo Martin",     role:"member",avatar:"◇"},
];

/* ═══════════════════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════════════════ */
const Login = ({ onLogin }) => {
  const [creds,setCreds]=useState({email:"",password:""});
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [showCreds,setShowCreds]=useState(false);

  const go=()=>{
    setLoading(true);setErr("");
    setTimeout(()=>{
      const u=USERS.find(u=>u.email===creds.email&&u.password===creds.password);
      if(u)onLogin(u);
      else{setErr("ACCESS DENIED — Invalid credentials");setLoading(false);}
    },500);
  };

  return(
    <div style={{position:"fixed",inset:0,zIndex:150,display:"flex",alignItems:"center",justifyContent:"center",
      background:"radial-gradient(ellipse 80% 80% at 50% 50%,#051018 0%,#020508 100%)",animation:"fadeIn .5s"}}>
      <CircuitBg/><HexGrid/><ScanLine/>
      <div style={{position:"relative",zIndex:10,width:430,animation:"slideUp .5s"}}>
        <div style={{textAlign:"center",marginBottom:30}}>
          <div style={{fontFamily:"var(--disp)",fontSize:28,fontWeight:900,letterSpacing:5,color:"var(--cyan)",
            textShadow:"0 0 22px rgba(0,255,231,.65)",marginBottom:6}}>
            CIPHER<span style={{color:"rgba(0,255,136,.85)"}}>ROOMS</span>
          </div>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ts)",letterSpacing:3}}>AUTHENTICATE TO CONTINUE</div>
        </div>
        <div className="panel" style={{padding:30,border:"1px solid rgba(0,255,231,.22)",boxShadow:"0 0 55px rgba(0,255,231,.06)"}}>
          <div style={{fontFamily:"var(--disp)",fontSize:10,letterSpacing:3,color:"var(--ts)",marginBottom:22}}>SECURE LOGIN</div>
          <div style={{display:"flex",flexDirection:"column",gap:15}}>
            <div>
              <label style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ts)",letterSpacing:2,display:"block",marginBottom:6}}>EMAIL</label>
              <input className="inp" placeholder="email@domain.com" value={creds.email}
                onChange={e=>setCreds({...creds,email:e.target.value})}
                onKeyDown={e=>e.key==="Enter"&&go()}/>
            </div>
            <div>
              <label style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ts)",letterSpacing:2,display:"block",marginBottom:6}}>AUTH KEY</label>
              <input className="inp" type="password" placeholder="password" value={creds.password}
                onChange={e=>setCreds({...creds,password:e.target.value})}
                onKeyDown={e=>e.key==="Enter"&&go()}/>
            </div>
            {err&&<div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--red)",padding:"8px 12px",
              border:"1px solid rgba(255,45,85,.25)",background:"rgba(255,45,85,.05)",animation:"slideUp .2s"}}>{err}</div>}
            <button className="btn btn-solid" style={{width:"100%",padding:13,marginTop:4}}
              onClick={go} disabled={loading||!creds.email||!creds.password}>
              {loading?<span style={{animation:"pulse 1s infinite"}}>VERIFYING...</span>:"AUTHENTICATE →"}
            </button>
          </div>
          <div style={{marginTop:18,borderTop:"1px solid var(--dim)",paddingTop:15}}>
            <button onClick={()=>setShowCreds(s=>!s)}
              style={{background:"none",border:"none",color:"var(--ts)",fontFamily:"var(--mono)",fontSize:9,
                cursor:"pointer",letterSpacing:1,display:"flex",alignItems:"center",gap:6}}>
              {showCreds?"▾":"▸"} VIEW TEST CREDENTIALS
            </button>
            {showCreds&&(
              <div style={{marginTop:11,display:"flex",flexDirection:"column",gap:3,animation:"slideUp .2s"}}>
                {USERS.map(u=>(
                  <div key={u.id} onClick={()=>setCreds({email:u.email,password:u.password})}
                    style={{display:"flex",gap:10,padding:"6px 10px",cursor:"pointer",borderRadius:2,
                      transition:"background .15s",fontFamily:"var(--mono)",fontSize:10}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(0,255,231,.05)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{width:20}}>{u.avatar}</span>
                    <span style={{color:"var(--cyan)",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</span>
                    <span style={{color:"var(--tm)"}}>{u.password}</span>
                    <span className="tag" style={{color:u.role==="admin"?"var(--amber)":u.role==="leader"?"var(--purple)":"var(--green)",fontSize:8}}>{u.role.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   TOP BAR
═══════════════════════════════════════════════════════════ */
const TopBar=({view,setView,user,onLogout})=>{
  const nav=user.role==="admin"
    ?[{id:"home",l:"HOME"},{id:"rooms",l:"ROOMS"},{id:"history",l:"HISTORY"},{id:"ai",l:"CIPHERMIND"},{id:"admin",l:"ADMIN"}]
    :user.role==="leader"
    ?[{id:"home",l:"HOME"},{id:"rooms",l:"ROOMS"},{id:"history",l:"HISTORY"},{id:"ai",l:"CIPHERMIND"}]
    :[{id:"home",l:"HOME"},{id:"rooms",l:"ROOMS"},{id:"ai",l:"CIPHERMIND"}];
  return(
    <header style={{height:52,display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"0 20px",background:"rgba(4,10,18,.96)",borderBottom:"1px solid var(--dim)",
      position:"relative",zIndex:50,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontFamily:"var(--disp)",fontSize:15,fontWeight:900,letterSpacing:4,color:"var(--cyan)",
          textShadow:"0 0 10px rgba(0,255,231,.5)"}}>
          CIPHER<span style={{color:"rgba(0,255,136,.85)"}}>ROOMS</span>
        </span>
        <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--tm)"}}>v2.1</span>
      </div>
      <nav style={{display:"flex"}}>
        {nav.map(n=>(
          <button key={n.id} onClick={()=>setView(n.id)} style={{
            background:view===n.id?"rgba(0,255,231,.07)":"transparent",border:"none",
            borderBottom:view===n.id?"2px solid var(--cyan)":"2px solid transparent",
            color:view===n.id?"var(--cyan)":"var(--ts)",
            fontFamily:"var(--disp)",fontSize:9,letterSpacing:2,padding:"0 14px",height:52,
            cursor:"pointer",transition:"all .15s"}}>
            {n.l}
          </button>
        ))}
      </nav>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:"var(--green)",
          boxShadow:"0 0 7px var(--green)",animation:"pulse 2s infinite"}}/>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--tx)"}}>{user.name}</div>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--tm)"}}>{user.role.toUpperCase()}</div>
        </div>
        <div style={{width:32,height:32,borderRadius:3,background:"var(--elevated)",
          border:"1px solid var(--dim)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>
          {user.avatar}
        </div>
        <button onClick={onLogout} style={{background:"none",border:"1px solid var(--dim)",
          color:"var(--ts)",fontFamily:"var(--mono)",fontSize:9,padding:"4px 10px",
          cursor:"pointer",borderRadius:2,letterSpacing:1,transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--red)";e.currentTarget.style.color="var(--red)"}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--dim)";e.currentTarget.style.color="var(--ts)"}}>
          EXIT
        </button>
      </div>
    </header>
  );
};

/* ═══════════════════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════════════════ */
const Modal=({title,onClose,children,width=460})=>(
  <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(2,5,8,.88)",
    backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s"}}
    onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="panel" style={{width,padding:28,border:"1px solid rgba(0,255,231,.25)",
      boxShadow:"0 0 55px rgba(0,255,231,.1)",animation:"slideUp .3s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span style={{fontFamily:"var(--disp)",fontSize:11,letterSpacing:3,color:"var(--cyan)"}}>{title}</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:"var(--ts)",cursor:"pointer",fontSize:16}}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   HOME SCREEN
   — Hero: CREATE ROOM + JOIN ROOM always prominent at top
   — Rooms list appears below only after rooms exist
═══════════════════════════════════════════════════════════ */
const HomeScreen=({user,rooms,setView,setModal})=>{
  const my=rooms.filter(r=>
    user.role==="admin"||r.leaders.some(l=>l.id===user.id)||r.members.some(m=>m.id===user.id)
  );

  /* secondary quick-links vary by role */
  const quickLinks = user.role==="admin"
    ? [{icon:"⬡",label:"Admin Panel",   sub:"Manage rooms & members", action:()=>setView("admin")},
       {icon:"◈",label:"CipherMind AI", sub:"AI collaboration tools",  action:()=>setView("ai")},
       {icon:"📋",label:"History",       sub:"Meeting transcripts",     action:()=>setView("history")}]
    : user.role==="leader"
    ? [{icon:"◈",label:"CipherMind AI", sub:"AI collaboration tools",  action:()=>setView("ai")},
       {icon:"📋",label:"History",       sub:"Meeting transcripts",     action:()=>setView("history")}]
    : [{icon:"◈",label:"CipherMind AI", sub:"AI collaboration tools",  action:()=>setView("ai")}];

  return(
    <div style={{height:"calc(100vh - 52px)",overflowY:"auto",animation:"fadeIn .35s"}}>

      {/* ── TOP HERO SECTION ── */}
      <div style={{
        padding:"48px 0 40px",
        display:"flex",flexDirection:"column",alignItems:"center",
        borderBottom:"1px solid var(--dim)",
        position:"relative",overflow:"hidden",
      }}>
        {/* faint radial glow behind hero */}
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 80% at 50% 50%,rgba(0,255,231,.04) 0%,transparent 70%)",pointerEvents:"none"}}/>

        {/* greeting */}
        <div style={{textAlign:"center",marginBottom:10,position:"relative",zIndex:1,animation:"slideUp .4s"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ts)",letterSpacing:4,marginBottom:10}}>
            {user.role==="admin"?"SYSTEM ADMINISTRATOR · FULL ACCESS":user.role==="leader"?"TEAM LEADER · ROOM MANAGEMENT":"TEAM MEMBER · STANDARD ACCESS"}
          </div>
          <div style={{fontFamily:"var(--disp)",fontSize:28,fontWeight:900,letterSpacing:5,color:"var(--tx)"}}>
            WELCOME BACK, <span style={{color:"var(--cyan)",textShadow:"0 0 18px rgba(0,255,231,.5)"}}>{user.name.split(" ")[0].toUpperCase()}</span>
          </div>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--tm)",marginTop:10,letterSpacing:2}}>
            SELECT AN ACTION TO BEGIN
          </div>
        </div>

        {/* ── THE TWO HERO BUTTONS ── */}
        <div style={{
          display:"grid",
          gridTemplateColumns: user.role==="admin" ? "1fr 1fr" : "1fr 1fr",
          gap:20,
          marginTop:32,
          width:"100%",
          maxWidth:680,
          padding:"0 32px",
          position:"relative",zIndex:1,
          animation:"slideUp .5s",
        }}>

          {/* CREATE ROOM */}
          <button
            onClick={()=> setModal("create")}
            style={{
              background:"transparent",
              border:"1px solid rgba(0,255,231,.35)",
              cursor: "pointer",
              padding:"36px 28px",
              position:"relative",
              overflow:"hidden",
              transition:"all .25s",
              clipPath:"polygon(14px 0,100% 0,calc(100% - 14px) 100%,0 100%)",
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.background="rgba(0,255,231,.07)";
              e.currentTarget.style.borderColor="rgba(0,255,231,.7)";
              e.currentTarget.style.boxShadow="0 0 40px rgba(0,255,231,.18),inset 0 0 40px rgba(0,255,231,.04)";
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.background="transparent";
              e.currentTarget.style.borderColor="rgba(0,255,231,.35)";
              e.currentTarget.style.boxShadow="none";
            }}>
            {/* corner accents */}
            <div style={{position:"absolute",top:8,left:14,width:20,height:20,borderTop:"2px solid var(--cyan)",borderLeft:"2px solid var(--cyan)"}}/>
            <div style={{position:"absolute",bottom:8,right:14,width:20,height:20,borderBottom:"2px solid var(--cyan)",borderRight:"2px solid var(--cyan)"}}/>
            {/* glow dot */}
            <div style={{position:"absolute",top:16,right:20,width:8,height:8,borderRadius:"50%",background:"var(--cyan)",boxShadow:"0 0 12px var(--cyan)",animation:"pulse 2s ease-in-out infinite"}}/>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:42,marginBottom:14,filter:"drop-shadow(0 0 10px rgba(0,255,231,.6))"}}>⊕</div>
              <div style={{fontFamily:"var(--disp)",fontSize:16,fontWeight:900,letterSpacing:4,color:"var(--cyan)",marginBottom:10}}>
                CREATE ROOM
              </div>
              <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ts)",lineHeight:1.7}}>
                {"Start a new secure workspace.\nSet access rules & assign leaders."}
              </div>
            </div>
          </button>

          {/* JOIN ROOM */}
          <button
            onClick={()=>setModal("join")}
            style={{
              background:"transparent",
              border:"1px solid rgba(0,255,136,.3)",
              cursor:"pointer",
              padding:"36px 28px",
              position:"relative",
              overflow:"hidden",
              transition:"all .25s",
              clipPath:"polygon(14px 0,100% 0,calc(100% - 14px) 100%,0 100%)",
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.background="rgba(0,255,136,.06)";
              e.currentTarget.style.borderColor="rgba(0,255,136,.65)";
              e.currentTarget.style.boxShadow="0 0 40px rgba(0,255,136,.14),inset 0 0 40px rgba(0,255,136,.03)";
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.background="transparent";
              e.currentTarget.style.borderColor="rgba(0,255,136,.3)";
              e.currentTarget.style.boxShadow="none";
            }}>
            <div style={{position:"absolute",top:8,left:14,width:20,height:20,borderTop:"2px solid var(--green)",borderLeft:"2px solid var(--green)"}}/>
            <div style={{position:"absolute",bottom:8,right:14,width:20,height:20,borderBottom:"2px solid var(--green)",borderRight:"2px solid var(--green)"}}/>
            <div style={{position:"absolute",top:16,right:20,width:8,height:8,borderRadius:"50%",background:"var(--green)",boxShadow:"0 0 12px var(--green)",animation:"pulse 2s .5s ease-in-out infinite"}}/>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:42,marginBottom:14,filter:"drop-shadow(0 0 10px rgba(0,255,136,.6))"}}>⊞</div>
              <div style={{fontFamily:"var(--disp)",fontSize:16,fontWeight:900,letterSpacing:4,color:"var(--green)",marginBottom:10}}>
                JOIN ROOM
              </div>
              <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ts)",lineHeight:1.7}}>
                Enter with an access code.<br/>
                Request approval to collaborate.
              </div>
            </div>
          </button>
        </div>

        {/* divider label */}
        <div style={{display:"flex",alignItems:"center",gap:16,marginTop:36,width:"100%",maxWidth:680,padding:"0 32px",position:"relative",zIndex:1}}>
          <div style={{flex:1,height:1,background:"var(--dim)"}}/>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--tm)",letterSpacing:3}}>QUICK ACCESS</div>
          <div style={{flex:1,height:1,background:"var(--dim)"}}/>
        </div>

        {/* quick links row */}
        <div style={{display:"flex",gap:12,marginTop:16,width:"100%",maxWidth:680,padding:"0 32px",position:"relative",zIndex:1,animation:"slideUp .6s"}}>
          {quickLinks.map((q,i)=>(
            <button key={i} onClick={q.action} style={{
              flex:1,background:"rgba(0,255,231,.03)",border:"1px solid var(--dim)",
              color:"var(--ts)",padding:"12px 14px",cursor:"pointer",borderRadius:2,
              transition:"all .2s",textAlign:"left",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--glow)";e.currentTarget.style.background="rgba(0,255,231,.06)";e.currentTarget.style.color="var(--tx)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--dim)";e.currentTarget.style.background="rgba(0,255,231,.03)";e.currentTarget.style.color="var(--ts)";}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <span style={{fontSize:16}}>{q.icon}</span>
                <span style={{fontFamily:"var(--disp)",fontSize:10,letterSpacing:2}}>{q.label.toUpperCase()}</span>
              </div>
              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--tm)"}}>{q.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── ROOMS LIST (only if rooms exist for this user) ── */}
      {my.length>0&&(
        <div style={{padding:"28px 32px",animation:"slideUp .4s"}}>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
            <div style={{fontFamily:"var(--disp)",fontSize:10,letterSpacing:3,color:"var(--ts)"}}>YOUR ROOMS</div>
            <div style={{flex:1,height:1,background:"var(--dim)"}}/>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--tm)"}}>{my.length} room{my.length!==1?"s":""}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {my.map((r,i)=>(
              <div key={r.id} className="panel" style={{
                padding:"15px 17px",cursor:"pointer",
                transition:"border-color .2s,box-shadow .2s",
                animation:`slideUp ${.3+i*.07}s`,
              }}
              onClick={()=>setView("rooms")}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--glow)";e.currentTarget.style.boxShadow="0 0 18px rgba(0,255,231,.07)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--dim)";e.currentTarget.style.boxShadow="none"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}>
                  <div style={{width:36,height:36,borderRadius:4,background:"var(--elevated)",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,
                    border:"1px solid var(--dim)",flexShrink:0}}>{r.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"var(--ui)",fontWeight:700,fontSize:13,color:"var(--tx)",
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</div>
                    <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--ts)"}}>{r.type.toUpperCase()}</div>
                  </div>
                  <div style={{width:7,height:7,borderRadius:"50%",background:"var(--green)",
                    boxShadow:"0 0 7px var(--green)",flexShrink:0}}/>
                </div>
                <div style={{display:"flex",gap:14,fontFamily:"var(--mono)",fontSize:9,color:"var(--ts)"}}>
                  <span>👥 {r.members.length+r.leaders.length}</span>
                  <span>💬 {r.messages.length}</span>
                  {r.pending.length>0&&<span style={{color:"var(--amber)"}}>⏳ {r.pending.length}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* empty state note when no rooms — but buttons are ALREADY shown above */}
      {my.length===0&&(
        <div style={{padding:"28px 32px"}}>
          <div style={{
            padding:"20px 24px",
            border:"1px dashed rgba(0,255,231,.1)",
            fontFamily:"var(--mono)",fontSize:10,color:"var(--tm)",
            display:"flex",alignItems:"center",gap:14,
          }}>
            <span style={{fontSize:20,opacity:.4}}>ℹ</span>
            <span>
              {user.role==="admin"
                ? "No rooms yet. Click CREATE ROOM above to start your first workspace."
                : user.role==="leader"
                ? "You haven't been assigned to any room yet. Check back after the admin assigns you."
                : "No rooms joined yet. Use JOIN ROOM above to request access with your code."}
            </span>
          </div>
        </div>
      )}

    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   CREATE ROOM MODAL
═══════════════════════════════════════════════════════════ */
const CreateRoomModal=({onClose,onCreate,allUsers,onAddMember})=>{
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({name:"",type:"tech",access:"private",description:""});
  const [created,setCreated]=useState(null);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [selectedLeaders,setSelectedLeaders]=useState([]);
  const [selectedMembers,setSelectedMembers]=useState([]);
  const [newMember,setNewMember]=useState("");
  const types=[
    {id:"tech",l:"Tech / Hackathon",icon:"⚛"},{id:"design",l:"Design",icon:"◇"},
    {id:"finance",l:"Finance",icon:"◈"},{id:"research",l:"Research",icon:"⬡"},
    {id:"aiml",l:"AI / ML",icon:"🧠"},{id:"devops",l:"DevOps",icon:"⬟"},
  ];
  const doCreate=async()=>{
    setLoading(true);setErr("");
    try{
      const room=await onCreate({
        name:form.name,type:form.type,access:form.access,description:form.description,
        leaders:selectedLeaders,
        members:selectedMembers,
      });
      setCreated(room);
      setStep(3);
    }catch(e){
      setErr(e.message);
    }finally{
      setLoading(false);
    }
  };
  return(
    <Modal title="CREATE NEW ROOM" onClose={onClose} width={500}>
      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {[1,2,3].map(s=>(
          <div key={s} style={{flex:1,height:3,borderRadius:2,
            background:step>=s?"var(--cyan)":"var(--dim)",transition:"background .3s",
            boxShadow:step>=s?"0 0 8px rgba(0,255,231,.4)":"none"}}/>
        ))}
      </div>
      {step===1&&(
        <div style={{display:"flex",flexDirection:"column",gap:14,animation:"slideUp .3s"}}>
          <div>
            <label style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ts)",letterSpacing:2,display:"block",marginBottom:6}}>ROOM NAME</label>
            <input className="inp" placeholder="e.g. Alpha Strike Team" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
          </div>
          <div>
            <label style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ts)",letterSpacing:2,display:"block",marginBottom:7}}>ROOM TYPE</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
              {types.map(t=>(
                <button key={t.id} onClick={()=>setForm({...form,type:t.id})} style={{
                  background:form.type===t.id?"rgba(0,255,231,.1)":"var(--surface)",
                  border:`1px solid ${form.type===t.id?"var(--cyan)":"var(--dim)"}`,
                  color:form.type===t.id?"var(--cyan)":"var(--ts)",
                  fontFamily:"var(--ui)",fontSize:11,fontWeight:600,padding:"8px 6px",
                  cursor:"pointer",borderRadius:2,display:"flex",alignItems:"center",gap:6,transition:"all .15s"}}>
                  <span>{t.icon}</span><span>{t.l}</span>
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-solid" style={{marginTop:4}} onClick={()=>setStep(2)} disabled={!form.name}>NEXT →</button>
        </div>
      )}
      {step===2&&(
        <div style={{display:"flex",flexDirection:"column",gap:13,animation:"slideUp .3s"}}>
          <div>
            <label style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ts)",letterSpacing:2,display:"block",marginBottom:7}}>ACCESS LEVEL</label>
            {["private","public"].map(a=>(
              <button key={a} onClick={()=>setForm({...form,access:a})} style={{
                display:"flex",alignItems:"center",gap:12,width:"100%",marginBottom:8,
                background:form.access===a?"rgba(0,255,231,.07)":"var(--surface)",
                border:`1px solid ${form.access===a?"var(--cyan)":"var(--dim)"}`,
                color:"var(--tx)",padding:"10px 13px",cursor:"pointer",borderRadius:2,transition:"all .15s"}}>
                <span style={{fontSize:17}}>{a==="private"?"🔒":"🌐"}</span>
                <div style={{textAlign:"left"}}>
                  <div style={{fontFamily:"var(--disp)",fontSize:10,letterSpacing:1,color:form.access===a?"var(--cyan)":"var(--tx)"}}>{a.toUpperCase()}</div>
                  <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ts)"}}>{a==="private"?"Invite only · Admin approval":"Discoverable · Still requires approval"}</div>
                </div>
              </button>
            ))}
          </div>
          <div>
            <label style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ts)",letterSpacing:2,display:"block",marginBottom:6}}>DESCRIPTION</label>
            <textarea className="inp" rows={3} placeholder="What is this room for?" value={form.description}
              onChange={e=>setForm({...form,description:e.target.value})} style={{resize:"none"}}/>
          </div>
          <div>
            <label style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ts)",letterSpacing:2,display:"block",marginBottom:6}}>ASSIGN LEADERS (OPTIONAL)</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {allUsers.filter(u=>u.role==="leader").map(u=>(
                <button key={u.id} onClick={()=>{
                  setSelectedLeaders(ls=>ls.find(l=>l.id===u.id)?ls.filter(l=>l.id!==u.id):[...ls,u]);
                }} style={{
                  background:selectedLeaders.find(l=>l.id===u.id)?"rgba(176,96,255,.12)":"var(--surface)",
                  border:`1px solid ${selectedLeaders.find(l=>l.id===u.id)?"rgba(176,96,255,.6)":"var(--dim)"}`,
                  color:selectedLeaders.find(l=>l.id===u.id)?"var(--purple)":"var(--ts)",
                  fontFamily:"var(--mono)",fontSize:9,padding:"6px 8px",cursor:"pointer",borderRadius:2
                }}>
                  {u.avatar} {u.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ts)",letterSpacing:2,display:"block",marginBottom:6}}>ASSIGN MEMBERS (OPTIONAL)</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {allUsers.filter(u=>u.role!=="admin").map(u=>(
                <button key={u.id} onClick={()=>{
                  setSelectedMembers(ms=>ms.find(m=>m.id===u.id)?ms.filter(m=>m.id!==u.id):[...ms,u]);
                }} style={{
                  background:selectedMembers.find(m=>m.id===u.id)?"rgba(0,255,136,.12)":"var(--surface)",
                  border:`1px solid ${selectedMembers.find(m=>m.id===u.id)?"rgba(0,255,136,.6)":"var(--dim)"}`,
                  color:selectedMembers.find(m=>m.id===u.id)?"var(--green)":"var(--ts)",
                  fontFamily:"var(--mono)",fontSize:9,padding:"6px 8px",cursor:"pointer",borderRadius:2
                }}>
                  {u.avatar} {u.name}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:6,marginTop:8}}>
              <input className="inp" placeholder="Add new member name"
                value={newMember} onChange={e=>setNewMember(e.target.value)}/>
              <button className="btn" onClick={()=>{
                if(!newMember.trim()||!onAddMember)return;
                const u=onAddMember(newMember.trim());
                setSelectedMembers(ms=>[...ms,u]);
                setNewMember("");
              }}>ADD</button>
            </div>
          </div>
          {err&&<div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--red)",
            padding:"8px 12px",border:"1px solid rgba(255,45,85,.25)"}}>⚠ {err}</div>}
          <div style={{display:"flex",gap:8}}>
            <button className="btn" style={{flex:1}} onClick={()=>setStep(1)}>← BACK</button>
            <button className="btn btn-solid" style={{flex:2}} onClick={doCreate} disabled={loading}>
              {loading?"CREATING...":"CREATE ROOM →"}
            </button>
          </div>
        </div>
      )}
      {step===3&&(
        <div style={{animation:"slideUp .4s",textAlign:"center"}}>
          <div style={{fontSize:44,marginBottom:11}}>✅</div>
          <div style={{fontFamily:"var(--disp)",fontSize:13,letterSpacing:3,color:"var(--green)",marginBottom:6}}>ROOM CREATED</div>
          <div style={{fontFamily:"var(--ui)",fontSize:15,fontWeight:700,color:"var(--tx)",marginBottom:15}}>{created?.name||form.name}</div>
          <div style={{background:"var(--surface)",border:"1px solid var(--dim)",padding:"12px 20px",
            marginBottom:18,fontFamily:"var(--mono)",fontSize:18,color:"var(--cyan)",letterSpacing:6,textAlign:"center"}}>{created?.code||"—"}</div>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ts)",marginBottom:18}}>SHARE THIS CODE WITH YOUR TEAM</div>
          <button className="btn btn-solid" style={{width:"100%"}} onClick={onClose}>DONE →</button>
        </div>
      )}
    </Modal>
  );
};

/* ═══════════════════════════════════════════════════════════
   JOIN ROOM MODAL
═══════════════════════════════════════════════════════════ */
const JoinRoomModal=({onClose,onRequest})=>{
  const [code,setCode]=useState("");
  const [status,setStatus]=useState(null);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const go=async()=>{
    setLoading(true);setErr("");
    try{
      await onRequest(code.toUpperCase());
      setStatus("sent");
    }catch(e){
      setErr(e.message);
      setStatus("notfound");
    }finally{
      setLoading(false);
    }
  };
  return(
    <Modal title="JOIN ROOM" onClose={onClose}>
      {status==="sent"?(
        <div style={{textAlign:"center",animation:"slideUp .3s"}}>
          <div style={{fontSize:44,marginBottom:12,animation:"pulse 1.5s infinite"}}>⏳</div>
          <div style={{fontFamily:"var(--disp)",fontSize:13,letterSpacing:3,color:"var(--amber)",marginBottom:8}}>REQUEST SENT</div>
          <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ts)"}}>Awaiting admin approval.</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:15,animation:"slideUp .3s"}}>
          <div>
            <label style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ts)",letterSpacing:2,display:"block",marginBottom:6}}>ROOM ACCESS CODE</label>
            <input className="inp" placeholder="6-CHAR CODE" value={code}
              onChange={e=>setCode(e.target.value.toUpperCase())}
              style={{textAlign:"center",letterSpacing:6,fontSize:18}} maxLength={6}/>
          </div>
          {status==="notfound"&&<div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--red)",
            padding:"8px 12px",border:"1px solid rgba(255,45,85,.25)"}}>⚠ {err||"No room found with that code."}</div>}
          <div style={{background:"var(--surface)",border:"1px solid var(--dim)",padding:13,
            fontFamily:"var(--mono)",fontSize:9,color:"var(--ts)",lineHeight:1.8}}>
            ⚠ Entry requires admin approval even for public rooms.<br/>
            Main user approves entry, then leaders assign your personalized room.
          </div>
          <button className="btn btn-solid" style={{width:"100%"}} onClick={go} disabled={loading||code.length<4}>
            {loading?"REQUESTING...":"REQUEST ACCESS →"}
          </button>
        </div>
      )}
    </Modal>
  );
};

/* ═══════════════════════════════════════════════════════════
   ROOMS VIEW
═══════════════════════════════════════════════════════════ */
const RoomsView=({user,rooms,setRooms})=>{
  const my=rooms.filter(r=>user.role==="admin"||r.leaders.some(l=>l.id===user.id)||r.members.some(m=>m.id===user.id));
  const [activeId,setActiveId]=useState(my[0]?.id||null);
  const [msg,setMsg]=useState("");
  const endRef=useRef(null);
  const fileInputRef=useRef(null);
  useEffect(()=>{
    if(!activeId||!my.find(r=>r.id===activeId))setActiveId(my[0]?.id||null);
  },[my,activeId]);
  useEffect(()=>endRef.current?.scrollIntoView({behavior:"smooth"}),[activeId,rooms]);
  const active=rooms.find(r=>r.id===activeId);
  const isMainRoom=active && !active.parentId;
  const isMainUser=active && active.createdBy===user.id;
  const isLeader=active && active.leaders.some(l=>l.id===user.id);
  const isMember=active && active.members.some(m=>m.id===user.id);
  const canPost=active && (isMainRoom ? (isMainUser||isLeader) : (isMainUser||isLeader||isMember));
  const send=()=>{
    if(!msg.trim()||!active||!canPost)return;
    const now=Date.now();
    const m={id:now,user:user.name,role:user.role,avatar:user.avatar,text:msg.trim(),
      time:new Date(now).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),ts:now,reactions:{}};
    setRooms(rs=>rs.map(r=>r.id===active.id?{...r,messages:[...r.messages,m]}:r));
    setMsg("");
  };
  const addSystemMessage=(text)=>{
    if(!active)return;
    const now=Date.now();
    const m={id:now,user:"CipherMind AI",role:"ai",avatar:"🤖",text,
      time:new Date(now).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),ts:now,reactions:{}};
    setRooms(rs=>rs.map(r=>r.id===active.id?{...r,messages:[...r.messages,m]}:r));
  };
  const summarize=()=>{
    if(!active)return;
    const last=active.messages.slice(-6).map(m=>m.text).join(" ");
    addSystemMessage(last?`Summary: ${last.slice(0,120)}${last.length>120?"…":""}`:"Summary: No messages yet.");
  };
  const ideas=()=>{
    addSystemMessage("Ideas: Break tasks into milestones, assign owners, and set a short daily standup cadence.");
  };
  const onAttach=()=>{
    if(!active||!canPost)return;
    fileInputRef.current?.click();
  };
  const onFileChange=(e)=>{
    const f=e.target.files?.[0];
    if(!f||!active)return;
    const now=Date.now();
    const m={id:now,user:user.name,role:user.role,avatar:user.avatar,text:`📎 Attached file: ${f.name}`,
      time:new Date(now).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),ts:now,reactions:{}};
    setRooms(rs=>rs.map(r=>r.id===active.id?{...r,messages:[...r.messages,m]}:r));
    e.target.value="";
  };
  const quickReact=(emoji)=>{
    if(!active||!canPost)return;
    const now=Date.now();
    const m={id:now,user:user.name,role:user.role,avatar:user.avatar,text:`${emoji}`,
      time:new Date(now).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),ts:now,reactions:{}};
    setRooms(rs=>rs.map(r=>r.id===active.id?{...r,messages:[...r.messages,m]}:r));
  };
  if(my.length===0)return(
    <div style={{height:"calc(100vh - 52px)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .3s"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:38,opacity:.3,marginBottom:14}}>⬡</div>
        <div style={{fontFamily:"var(--disp)",fontSize:11,letterSpacing:3,color:"var(--ts)"}}>NO ROOMS AVAILABLE</div>
        <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--tm)",marginTop:7}}>You haven't been assigned to any room yet.</div>
      </div>
    </div>
  );
  return(
    <div style={{display:"flex",height:"calc(100vh - 52px)",animation:"fadeIn .3s"}}>
      <div style={{width:230,background:"rgba(4,10,18,.96)",borderRight:"1px solid var(--dim)",flexShrink:0}}>
        <div style={{padding:"13px 13px 9px",borderBottom:"1px solid var(--dim)"}}>
          <div style={{fontFamily:"var(--disp)",fontSize:9,letterSpacing:3,color:"var(--ts)"}}>ROOMS</div>
        </div>
        {my.map(r=>(
          <div key={r.id} onClick={()=>setActiveId(r.id)} style={{padding:"10px 13px",display:"flex",
            alignItems:"center",gap:9,cursor:"pointer",
            background:activeId===r.id?"rgba(0,255,231,.07)":"transparent",
            borderLeft:activeId===r.id?"3px solid var(--cyan)":"3px solid transparent",transition:"all .15s"}}>
            <span style={{fontSize:17,flexShrink:0}}>{r.icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"var(--ui)",fontWeight:600,fontSize:12,color:activeId===r.id?"var(--tx)":"var(--ts)",
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</div>
              <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--tm)"}}>
                {r.parentId?"PERSONALIZED":"MAIN"} · {r.members.length+r.leaders.length} members
              </div>
            </div>
          </div>
        ))}
      </div>
      {active&&<>
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          <div style={{padding:"0 17px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",
            borderBottom:"1px solid var(--dim)",background:"rgba(4,10,18,.92)",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <span style={{fontSize:19}}>{active.icon}</span>
              <div>
                <div style={{fontFamily:"var(--disp)",fontSize:11,letterSpacing:2,color:"var(--tx)"}}>{active.name}</div>
                <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--ts)"}}>
                  {active.type.toUpperCase()} · {active.access.toUpperCase()}{active.parentId?" · PERSONALIZED":""}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:6}}>
              {(active.type==="tech"||active.type==="aiml")&&(
                <button style={{background:"var(--surface)",border:"1px solid var(--dim)",
                  color:"var(--ts)",fontFamily:"var(--mono)",fontSize:9,padding:"5px 9px",cursor:"pointer",
                  borderRadius:2,transition:"all .15s",letterSpacing:1}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--glow)";e.currentTarget.style.color="var(--cyan)"}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--dim)";e.currentTarget.style.color="var(--ts)"}}
                  onClick={()=>window.open("https://github.com","_blank")}>🔗 GITHUB</button>
              )}
              {active.type==="finance"&&(
                <>
                  <button style={{background:"var(--surface)",border:"1px solid var(--dim)",
                    color:"var(--ts)",fontFamily:"var(--mono)",fontSize:9,padding:"5px 9px",cursor:"pointer",
                    borderRadius:2,transition:"all .15s",letterSpacing:1}}>📊 CHARTS</button>
                  <button style={{background:"var(--surface)",border:"1px solid var(--dim)",
                    color:"var(--ts)",fontFamily:"var(--mono)",fontSize:9,padding:"5px 9px",cursor:"pointer",
                    borderRadius:2,transition:"all .15s",letterSpacing:1}}>📑 REPORTS</button>
                </>
              )}
              {active.type==="design"&&(
                <button style={{background:"var(--surface)",border:"1px solid var(--dim)",
                  color:"var(--ts)",fontFamily:"var(--mono)",fontSize:9,padding:"5px 9px",cursor:"pointer",
                  borderRadius:2,transition:"all .15s",letterSpacing:1}}>🖼 MEDIA BOARD</button>
              )}
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"17px 17px 0",display:"flex",flexDirection:"column",gap:13}}>
            {active.messages.length===0?(
              <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{textAlign:"center",opacity:.35}}>
                  <div style={{fontSize:30,marginBottom:7}}>💬</div>
                  <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ts)"}}>NO MESSAGES YET</div>
                </div>
              </div>
            ):active.messages.map(m=>(
              <div key={m.id} style={{display:"flex",gap:10,animation:"msgIn .25s ease-out"}}>
                <div style={{width:32,height:32,borderRadius:4,background:"var(--elevated)",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,
                  border:"1px solid var(--dim)"}}>{m.avatar}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <span style={{fontFamily:"var(--ui)",fontWeight:600,fontSize:12,
                      color:m.role==="admin"?"var(--amber)":m.role==="leader"?"var(--purple)":m.role==="ai"?"var(--cyan)":"var(--tx)"}}>{m.user}</span>
                    <span className="tag" style={{color:m.role==="admin"?"var(--amber)":m.role==="leader"?"var(--purple)":m.role==="ai"?"var(--cyan)":"var(--green)",fontSize:8}}>{m.role.toUpperCase()}</span>
                    <span style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--tm)"}}>{m.time}</span>
                  </div>
                  <div style={{fontFamily:"var(--ui)",fontSize:13,color:"var(--ts)",lineHeight:1.65}}>{m.text}</div>
                </div>
              </div>
            ))}
            <div ref={endRef}/>
          </div>
          <div style={{padding:"11px 17px 15px",borderTop:"1px solid var(--dim)",flexShrink:0}}>
            <div style={{display:"flex",gap:6,marginBottom:8}}>
              {["👍","👎","💡","⚡"].map(r=>(
                <button key={r} style={{background:"var(--surface)",border:"1px solid var(--dim)",padding:"3px 9px",
                  cursor:"pointer",borderRadius:20,fontSize:13,transition:"border-color .15s"}}
                  onClick={()=>quickReact(r)}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="var(--glow)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="var(--dim)"}>{r}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <button className="btn" style={{padding:"6px 10px",fontSize:10}} onClick={onAttach}>ATTACH FILE</button>
              <button className="btn" style={{padding:"6px 10px",fontSize:10}} onClick={()=>addSystemMessage("Voice chat started (demo).")}>VOICE</button>
              <button className="btn" style={{padding:"6px 10px",fontSize:10}} onClick={()=>addSystemMessage("Camera session started (demo).")}>CAMERA</button>
              <button className="btn" style={{padding:"6px 10px",fontSize:10}} onClick={summarize}>AI SUMMARY</button>
              <button className="btn" style={{padding:"6px 10px",fontSize:10}} onClick={ideas}>IDEA GEN</button>
            </div>
            <div style={{display:"flex",gap:8}}>
              <input className="inp" style={{flex:1}} placeholder={canPost?"Encrypted message...":"Read-only · Main room is leader-only"}
                value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} disabled={!canPost}/>
              <button className="btn btn-solid" style={{flexShrink:0,padding:"10px 17px"}} onClick={send} disabled={!canPost}>SEND ↑</button>
            </div>
            <input ref={fileInputRef} type="file" style={{display:"none"}} onChange={onFileChange}/>
          </div>
        </div>
        <div style={{width:185,background:"rgba(4,10,18,.96)",borderLeft:"1px solid var(--dim)",flexShrink:0}}>
          <div style={{padding:"13px 13px 9px",borderBottom:"1px solid var(--dim)"}}>
            <div style={{fontFamily:"var(--disp)",fontSize:9,letterSpacing:3,color:"var(--ts)"}}>MEMBERS</div>
          </div>
          {[...active.leaders.map(u=>({...u,role:"leader"})),...active.members.map(u=>({...u,role:"member"}))].map((m,i)=>(
            <div key={i} style={{padding:"7px 11px",display:"flex",alignItems:"center",gap:8}}>
              <div style={{position:"relative"}}>
                <div style={{width:28,height:28,borderRadius:3,background:"var(--elevated)",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{m.avatar}</div>
                <div style={{position:"absolute",bottom:-1,right:-1,width:7,height:7,borderRadius:"50%",
                  background:"var(--green)",border:"1.5px solid var(--deep)"}}/>
              </div>
              <div>
                <div style={{fontFamily:"var(--ui)",fontSize:11,fontWeight:600,color:"var(--tx)"}}>{m.name}</div>
                <span className="tag" style={{color:m.role==="leader"?"var(--purple)":"var(--green)",fontSize:8}}>{m.role.toUpperCase()}</span>
              </div>
            </div>
          ))}
          {active.leaders.length+active.members.length===0&&(
            <div style={{padding:"18px 11px",fontFamily:"var(--mono)",fontSize:9,color:"var(--tm)",textAlign:"center"}}>No members yet</div>
          )}
        </div>
      </>}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ADMIN VIEW
═══════════════════════════════════════════════════════════ */
const AdminView=({user,rooms,setRooms,allUsers,setAllUsers,onApprove,onReject,onAssignLeader,onRoleChange})=>{
  const [subForms,setSubForms]=useState({});
  const leaders=allUsers.filter(u=>u.role==="leader");
  const members=allUsers.filter(u=>u.role!=="admin");
  const approve=async(roomId,userId)=>{
    if(onApprove){await onApprove(roomId,userId);return;}
    const u=allUsers.find(u=>u.id===userId);if(!u)return;
    setRooms(rs=>rs.map(r=>r.id===roomId?{...r,pending:r.pending.filter(p=>p.id!==userId),members:[...r.members,u]}:r));
  };
  const reject=async(roomId,userId)=>{
    if(onReject){await onReject(roomId,userId);return;}
    setRooms(rs=>rs.map(r=>r.id===roomId?{...r,pending:r.pending.filter(p=>p.id!==userId)}:r));
  };
  const assignLeader=async(roomId,userId)=>{
    if(onAssignLeader){await onAssignLeader(roomId,userId);return;}
    const u=allUsers.find(u=>u.id===userId);if(!u)return;
    setRooms(rs=>{
      const parentId=rs.find(x=>x.id===roomId)?.parentId;
      return rs.map(r=>{
        if(r.id===roomId||r.id===parentId){
          return {...r,leaders:r.leaders.find(l=>l.id===userId)?r.leaders:[...r.leaders,u]};
        }
        return r;
      });
    });
  };
  const assignMember=(roomId,userId)=>{
    const u=allUsers.find(u=>u.id===userId);if(!u)return;
    setRooms(rs=>{
      const parentId=rs.find(x=>x.id===roomId)?.parentId;
      return rs.map(r=>{
        if(r.id===roomId||r.id===parentId){
          return {...r,members:r.members.find(m=>m.id===userId)?r.members:[...r.members,u]};
        }
        return r;
      });
    });
  };
  const addMemberByName=(name)=>{
    const id="u_"+Date.now()+"_"+Math.random().toString(36).slice(2,5);
    const email=name.toLowerCase().replace(/[^a-z0-9]+/g,".").replace(/(^\\.|\\.$)/g,"") + "@cipher.local";
    const u={id,email,password:"member123",name,role:"member",avatar:"👤"};
    if(setAllUsers)setAllUsers(us=>[...us,u]);
    return u;
  };
  const createSubroom=(mainRoomId,form)=>{
    setRooms(rs=>{
      const main=rs.find(r=>r.id===mainRoomId);
      if(!main)return rs;
      const room={
        id:"room_"+Date.now()+"_"+Math.random().toString(36).slice(2,5),
        parentId:mainRoomId,
        createdBy:main.createdBy,
        name:form.name,
        type:form.type,
        icon:{tech:"⚛",design:"◇",finance:"◈",research:"⬡",aiml:"🧠",devops:"⬟"}[form.type]||"⬡",
        access:form.access||"private",
        description:form.description||"",
        code:Math.random().toString(36).slice(2,8).toUpperCase(),
        active:true,
        leaders:[],
        members:[],
        pending:[],
        messages:[],
        createdAt:new Date().toLocaleString(),
      };
      return [...rs,room];
    });
  };
  const changeRole=async(userId,role)=>{
    if(onRoleChange){await onRoleChange(userId,role);return;}
  };
  const allPending=rooms
    .filter(r=>r.createdBy===user.id)
    .flatMap(r=>r.pending.map(p=>({...p,roomId:r.id,roomName:r.name})));
  return(
    <div style={{padding:24,overflowY:"auto",height:"calc(100vh - 52px)",animation:"fadeIn .3s"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
        <div style={{fontFamily:"var(--disp)",fontSize:18,fontWeight:900,letterSpacing:4}}>ADMIN DASHBOARD</div>
        <span className="tag" style={{color:"var(--amber)"}}>MAIN ADMIN</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <div className="panel" style={{padding:17}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13}}>
            <div style={{fontFamily:"var(--disp)",fontSize:9,letterSpacing:3,color:"var(--ts)"}}>PENDING REQUESTS</div>
            {allPending.length>0&&<span style={{background:"var(--red)",color:"#fff",fontSize:8,fontFamily:"var(--mono)",borderRadius:10,padding:"1px 8px"}}>{allPending.length}</span>}
          </div>
          {allPending.length===0?(
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--tm)",textAlign:"center",padding:"18px 0"}}>No pending requests</div>
          ):allPending.map((req,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 0",borderBottom:"1px solid var(--dim)"}}>
              <div style={{width:30,height:30,borderRadius:3,background:"var(--elevated)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{req.avatar}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"var(--ui)",fontWeight:600,fontSize:11}}>{req.name}</div>
                <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--ts)"}}>→ {req.roomName}</div>
              </div>
              <button onClick={()=>approve(req.roomId,req.id)} style={{background:"rgba(0,255,136,.1)",border:"1px solid rgba(0,255,136,.3)",color:"var(--green)",fontFamily:"var(--mono)",fontSize:9,padding:"4px 8px",cursor:"pointer",borderRadius:2}}>✓</button>
              <button onClick={()=>reject(req.roomId,req.id)} style={{background:"rgba(255,45,85,.1)",border:"1px solid rgba(255,45,85,.3)",color:"var(--red)",fontFamily:"var(--mono)",fontSize:9,padding:"4px 8px",cursor:"pointer",borderRadius:2}}>✕</button>
            </div>
          ))}
        </div>
        <div className="panel" style={{padding:17}}>
          <div style={{fontFamily:"var(--disp)",fontSize:9,letterSpacing:3,color:"var(--ts)",marginBottom:13}}>ROOM OVERVIEW</div>
          {rooms.length===0?(
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--tm)",textAlign:"center",padding:"18px 0"}}>No rooms yet</div>
          ):rooms.map((r,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 0",borderBottom:i<rooms.length-1?"1px solid var(--dim)":"none"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:"var(--green)",boxShadow:"0 0 7px var(--green)",flexShrink:0}}/>
              <span style={{fontSize:15}}>{r.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:"var(--ui)",fontWeight:600,fontSize:12,color:"var(--tx)"}}>{r.name}</div>
                <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--ts)"}}>Code: {r.code} · {r.type}</div>
              </div>
              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ts)"}}>{r.members.length+r.leaders.length} 👥</div>
            </div>
          ))}
        </div>
        <div className="panel" style={{padding:17,gridColumn:"1/-1"}}>
          <div style={{fontFamily:"var(--disp)",fontSize:9,letterSpacing:3,color:"var(--ts)",marginBottom:13}}>ASSIGN LEADERS</div>
          {rooms.length===0?(
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--tm)"}}>Create rooms first.</div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9}}>
              {rooms.map(r=>(
                <div key={r.id} style={{background:"var(--surface)",border:"1px solid var(--dim)",padding:"11px 13px",borderRadius:2}}>
                  <div style={{fontFamily:"var(--ui)",fontWeight:700,fontSize:12,marginBottom:9,display:"flex",alignItems:"center",gap:7}}>
                    <span>{r.icon}</span>{r.name}
                  </div>
                  {r.leaders.length===0?<div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--tm)",marginBottom:7}}>No leader assigned</div>:
                    r.leaders.map((l,i)=><div key={i} style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--purple)",marginBottom:3}}>◈ {l.name}</div>)}
                  <select onChange={e=>e.target.value&&assignLeader(r.id,e.target.value)} defaultValue="" disabled={r.createdBy!==user.id}
                    style={{width:"100%",background:"var(--elevated)",border:"1px solid var(--dim)",color:"var(--ts)",fontFamily:"var(--mono)",fontSize:9,padding:"5px 7px",marginTop:5,cursor:r.createdBy!==user.id?"not-allowed":"pointer",opacity:r.createdBy!==user.id?0.6:1}}>
                    <option value="">+ Assign leader...</option>
                    {leaders.filter(l=>!r.leaders.some(rl=>rl.id===l.id)).map(l=>(
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="panel" style={{padding:17,gridColumn:"1/-1"}}>
          <div style={{fontFamily:"var(--disp)",fontSize:9,letterSpacing:3,color:"var(--ts)",marginBottom:13}}>PERSONALIZED ROOMS</div>
          {rooms.filter(r=>!r.parentId).length===0?(
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--tm)"}}>Create a main room first.</div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {rooms.filter(r=>!r.parentId).map(mainRoom=>{
                const owned=mainRoom.createdBy===user.id;
                const subrooms=rooms.filter(r=>r.parentId===mainRoom.id);
                const form=subForms[mainRoom.id]||{name:"",type:"tech",access:"private"};
                return(
                  <div key={mainRoom.id} style={{background:"var(--surface)",border:"1px solid var(--dim)",padding:"12px 14px",borderRadius:2}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <span style={{fontSize:16}}>{mainRoom.icon}</span>
                      <div style={{fontFamily:"var(--ui)",fontWeight:700,fontSize:12}}>{mainRoom.name}</div>
                      {!owned&&<span className="tag" style={{color:"var(--tm)",fontSize:8}}>OWNER ONLY</span>}
                    </div>
                    {owned&&(
                      <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr auto",gap:8,marginBottom:10}}>
                        <input className="inp" placeholder="Personalized room name"
                          value={form.name} onChange={e=>setSubForms(s=>({...s,[mainRoom.id]:{...form,name:e.target.value}}))}/>
                        <select className="inp" value={form.type} onChange={e=>setSubForms(s=>({...s,[mainRoom.id]:{...form,type:e.target.value}}))}>
                          {["tech","design","finance","research","aiml","devops"].map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
                        </select>
                        <select className="inp" value={form.access} onChange={e=>setSubForms(s=>({...s,[mainRoom.id]:{...form,access:e.target.value}}))}>
                          {["private","public"].map(a=><option key={a} value={a}>{a.toUpperCase()}</option>)}
                        </select>
                        <button className="btn btn-solid" onClick={()=>{
                          if(!form.name)return;
                          createSubroom(mainRoom.id,form);
                          setSubForms(s=>({...s,[mainRoom.id]:{name:"",type:"tech",access:"private"}}));
                        }}>CREATE</button>
                      </div>
                    )}
                    {subrooms.length===0?(
                      <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--tm)"}}>No personalized rooms yet.</div>
                    ):(
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9}}>
                        {subrooms.map(sr=>(
                          <div key={sr.id} style={{border:"1px solid var(--dim)",padding:"10px 12px",borderRadius:2}}>
                            <div style={{fontFamily:"var(--ui)",fontWeight:700,fontSize:11,marginBottom:6}}>{sr.icon} {sr.name}</div>
                            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--tm)",marginBottom:6}}>
                              {sr.type.toUpperCase()} · {sr.access.toUpperCase()}
                            </div>
                            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--ts)",marginBottom:6}}>
                              Leaders: {sr.leaders.map(l=>l.name.split(" ")[0]).join(",")||"None"}
                            </div>
                            {owned&&(
                              <>
                                <select onChange={e=>e.target.value&&assignLeader(sr.id,e.target.value)} defaultValue=""
                                  style={{width:"100%",background:"var(--elevated)",border:"1px solid var(--dim)",color:"var(--ts)",fontFamily:"var(--mono)",fontSize:9,padding:"5px 7px",marginBottom:6,cursor:"pointer"}}>
                                  <option value="">+ Assign leader...</option>
                                  {leaders.filter(l=>!sr.leaders.some(rl=>rl.id===l.id)).map(l=>(
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                  ))}
                                </select>
                                <select onChange={e=>e.target.value&&assignMember(sr.id,e.target.value)} defaultValue=""
                                  style={{width:"100%",background:"var(--elevated)",border:"1px solid var(--dim)",color:"var(--ts)",fontFamily:"var(--mono)",fontSize:9,padding:"5px 7px",cursor:"pointer"}}>
                                  <option value="">+ Assign member...</option>
                                  {members.filter(m=>!sr.members.some(sm=>sm.id===m.id)).map(m=>(
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                  ))}
                                </select>
                                <div style={{display:"flex",gap:6,marginTop:6}}>
                                  <input className="inp" placeholder="Add member name"
                                    value={(subForms["add_"+sr.id]||"")}
                                    onChange={e=>setSubForms(s=>({...s,["add_"+sr.id]:e.target.value}))}/>
                                  <button className="btn" onClick={()=>{
                                    const val=subForms["add_"+sr.id];
                                    if(!val?.trim())return;
                                    const u=addMemberByName(val.trim());
                                    assignMember(sr.id,u.id);
                                    setSubForms(s=>({...s,["add_"+sr.id]:""}));
                                  }}>ADD</button>
                                </div>
                              </>
                            )}
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
        <div className="panel" style={{padding:17,gridColumn:"1/-1"}}>
          <div style={{fontFamily:"var(--disp)",fontSize:9,letterSpacing:3,color:"var(--ts)",marginBottom:13}}>USER DIRECTORY</div>
          {allUsers.length===0?(
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--tm)"}}>No users yet.</div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9}}>
              {allUsers.map(u=>(
                <div key={u.id} style={{background:"var(--surface)",border:"1px solid var(--dim)",padding:"11px 13px",borderRadius:2}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <div style={{width:22,height:22,borderRadius:3,background:"var(--elevated)",display:"flex",alignItems:"center",justifyContent:"center"}}>{u.avatar}</div>
                    <div style={{minWidth:0}}>
                      <div style={{fontFamily:"var(--ui)",fontWeight:700,fontSize:11,color:"var(--tx)"}}>{u.name}</div>
                      <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--ts)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.email}</div>
                    </div>
                  </div>
                  <select onChange={e=>e.target.value&&changeRole(u.id,e.target.value)} defaultValue={u.role}
                    style={{width:"100%",background:"var(--elevated)",border:"1px solid var(--dim)",color:"var(--ts)",fontFamily:"var(--mono)",fontSize:9,padding:"5px 7px",cursor:"pointer"}}>
                    <option value="admin">Admin</option>
                    <option value="leader">Leader</option>
                    <option value="member">Member</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="panel" style={{padding:17,gridColumn:"1/-1"}}>
          <div style={{fontFamily:"var(--disp)",fontSize:9,letterSpacing:3,color:"var(--ts)",marginBottom:16}}>ACCESS HIERARCHY</div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{background:"rgba(255,184,0,.08)",border:"1px solid rgba(255,184,0,.35)",
              padding:"8px 26px",fontFamily:"var(--disp)",fontSize:10,letterSpacing:2,color:"var(--amber)",borderRadius:2}}>
              👑 MAIN ADMIN
            </div>
            <div style={{width:1,height:18,background:"rgba(0,255,231,.2)"}}/>
            <div style={{display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center"}}>
              {rooms.map(r=>(
                <div key={r.id} style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{width:1,height:16,background:"rgba(0,255,231,.15)"}}/>
                  <div style={{background:"rgba(176,96,255,.08)",border:"1px solid rgba(176,96,255,.3)",
                    padding:"6px 11px",fontFamily:"var(--mono)",fontSize:9,color:"var(--purple)",borderRadius:2,whiteSpace:"nowrap",textAlign:"center"}}>
                    {r.icon} {r.name}<br/>
                    <span style={{opacity:.65}}>{r.leaders.map(l=>l.name.split(" ")[0]).join(",")||"No leader"}</span>
                  </div>
                  <div style={{width:1,height:13,background:"rgba(0,255,136,.15)"}}/>
                  <div style={{background:"rgba(0,255,136,.05)",border:"1px solid rgba(0,255,136,.2)",
                    padding:"4px 9px",fontFamily:"var(--mono)",fontSize:8,color:"var(--green)",borderRadius:2,whiteSpace:"nowrap"}}>
                    {r.members.length} member{r.members.length!==1?"s":""}
                  </div>
                </div>
              ))}
              {rooms.length===0&&<div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--tm)"}}>No rooms created</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   CIPHERMIND AI
═══════════════════════════════════════════════════════════ */
const AIView=()=>{
  const [mod,setMod]=useState("assistant");
  const [q,setQ]=useState("");
  const [resp,setResp]=useState(null);
  const [loading,setLoading]=useState(false);
  const modules=[
    {id:"assistant",l:"Smart Assistant",icon:"🤖"},
    {id:"summarizer",l:"Chat Summarizer",icon:"📋"},
    {id:"tasks",l:"Task Extractor",icon:"✅"},
    {id:"ideas",l:"Idea Generator",icon:"💡"},
    {id:"analyzer",l:"Team Analyzer",icon:"📊"},
    {id:"knowledge",l:"Knowledge Base",icon:"📚"},
  ];
  const scores=[
    {l:"Collaboration",v:87,c:"var(--green)"},
    {l:"Response Rate",v:94,c:"var(--cyan)"},
    {l:"Task Completion",v:72,c:"var(--amber)"},
    {l:"Engagement",v:81,c:"var(--purple)"},
  ];
  const ask=async()=>{
    if(!q.trim())return;
    setLoading(true);setResp(null);
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,
          system:`You are CipherMind AI — sharp, cyber-themed AI assistant in CipherRooms secure collaboration platform. Be concise and insightful. Active module: ${mod}.`,
          messages:[{role:"user",content:q}]})
      });
      const d=await r.json();
      setResp(d.content?.map(b=>b.text||"").join("\n")||"No response.");
    }catch{setResp("⚠ CipherMind unreachable.");}
    setLoading(false);
  };
  return(
    <div style={{display:"flex",height:"calc(100vh - 52px)",animation:"fadeIn .3s"}}>
      <div style={{width:205,background:"rgba(4,10,18,.96)",borderRight:"1px solid var(--dim)",flexShrink:0}}>
        <div style={{padding:"13px 13px 9px",borderBottom:"1px solid var(--dim)"}}>
          <div style={{fontFamily:"var(--disp)",fontSize:9,letterSpacing:3,color:"var(--cyan)"}}>CIPHERMIND AI</div>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--tm)",marginTop:3}}>powered by Claude</div>
        </div>
        {modules.map(m=>(
          <div key={m.id} onClick={()=>setMod(m.id)} style={{padding:"10px 13px",display:"flex",gap:9,alignItems:"center",
            cursor:"pointer",background:mod===m.id?"rgba(0,255,231,.07)":"transparent",
            borderLeft:mod===m.id?"3px solid var(--cyan)":"3px solid transparent",transition:"all .15s"}}>
            <span style={{fontSize:14}}>{m.icon}</span>
            <span style={{fontFamily:"var(--ui)",fontWeight:600,fontSize:12,color:mod===m.id?"var(--tx)":"var(--ts)"}}>{m.l}</span>
          </div>
        ))}
      </div>
      <div style={{flex:1,padding:22,overflowY:"auto",display:"flex",flexDirection:"column",gap:16}}>
        <div style={{fontFamily:"var(--disp)",fontSize:13,letterSpacing:4,color:"var(--cyan)"}}>
          {modules.find(m=>m.id===mod)?.icon} {modules.find(m=>m.id===mod)?.l.toUpperCase()}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {scores.map((s,i)=>(
            <div key={i} className="panel" style={{padding:"12px 13px"}}>
              <div style={{fontFamily:"var(--disp)",fontSize:22,fontWeight:700,color:s.c}}>{s.v}%</div>
              <div style={{height:3,background:"var(--dim)",borderRadius:2,marginTop:5,marginBottom:5,overflow:"hidden"}}>
                <div style={{height:"100%",width:s.v+"%",background:s.c,transition:"width 1.5s ease-out"}}/>
              </div>
              <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--tm)",letterSpacing:1}}>{s.l.toUpperCase()}</div>
            </div>
          ))}
        </div>
        <div className="panel" style={{padding:17,border:"1px solid rgba(0,255,231,.18)"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ts)",letterSpacing:2,marginBottom:9}}>ASK CIPHERMIND</div>
          <div style={{display:"flex",gap:8}}>
            <input className="inp" style={{flex:1}} placeholder="Ask anything..." value={q}
              onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&ask()}/>
            <button className="btn btn-solid" onClick={ask} disabled={loading||!q.trim()} style={{flexShrink:0}}>
              {loading?"...":"ASK →"}
            </button>
          </div>
          {loading&&(
            <div style={{marginTop:13,display:"flex",alignItems:"center",gap:9}}>
              <div style={{width:13,height:13,border:"2px solid var(--cyan)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
              <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ts)",animation:"pulse 1s infinite"}}>PROCESSING...</span>
            </div>
          )}
          {resp&&(
            <div style={{marginTop:13,padding:13,background:"rgba(0,255,231,.03)",border:"1px solid rgba(0,255,231,.12)",animation:"slideUp .4s"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:9}}>
                <span>🤖</span>
                <span style={{fontFamily:"var(--disp)",fontSize:9,letterSpacing:2,color:"var(--cyan)"}}>CIPHERMIND RESPONSE</span>
              </div>
              <div style={{fontFamily:"var(--ui)",fontSize:13,color:"var(--ts)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{resp}</div>
            </div>
          )}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{icon:"🧠",t:"Context Memory",d:"Recalls past discussions for smarter future answers."},{icon:"⚔",t:"Conflict Detection",d:"Identifies miscommunications between teams proactively."},{icon:"📈",t:"Smart Recommendations",d:"Suggests workflow improvements from team behavior."},{icon:"🗄",t:"Knowledge Base",d:"Indexes decisions and solutions from all conversations."}].map((c,i)=>(
            <div key={i} className="panel" style={{padding:13,cursor:"pointer",transition:"border-color .2s,box-shadow .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--glow)";e.currentTarget.style.boxShadow="0 0 16px rgba(0,255,231,.06)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--dim)";e.currentTarget.style.boxShadow="none"}}>
              <div style={{fontSize:20,marginBottom:6}}>{c.icon}</div>
              <div style={{fontFamily:"var(--disp)",fontSize:9,letterSpacing:2,color:"var(--tx)",marginBottom:5}}>{c.t.toUpperCase()}</div>
              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--tm)",lineHeight:1.6}}>{c.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   HISTORY VIEW
═══════════════════════════════════════════════════════════ */
const HistoryView=({rooms})=>{
  const tc={standup:"var(--cyan)",planning:"var(--purple)","all-hands":"var(--amber)",incident:"var(--red)"};
  const data=rooms
    .filter(r=>r.messages.length>0)
    .map(r=>{
      const last=r.messages[r.messages.length-1];
      const ts=last.ts||Date.now();
      const dur=Math.max(6,Math.min(60,Math.floor(r.messages.length*3)));
      return {
        date:new Date(ts).toLocaleDateString(),
        room:r.name,
        type:r.type==="tech"||r.type==="aiml"?"standup":r.type==="finance"?"planning":r.type==="design"?"all-hands":"incident",
        dur:`${dur} min`,
        people:r.members.length+r.leaders.length,
        summary:last.text,
      };
    })
    .sort((a,b)=>new Date(b.date)-new Date(a.date));
  return(
    <div style={{padding:24,overflowY:"auto",height:"calc(100vh - 52px)",animation:"fadeIn .3s"}}>
      <div style={{fontFamily:"var(--disp)",fontSize:18,fontWeight:900,letterSpacing:4,marginBottom:20}}>MEETING HISTORY</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {data.length===0?(
          <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--tm)"}}>No activity yet.</div>
        ):data.map((e,i)=>(
          <div key={i} className="panel" style={{padding:"15px 18px",display:"flex",gap:16,
            animation:`slideUp ${.2+i*.1}s`,cursor:"pointer",transition:"border-color .2s,box-shadow .2s"}}
            onMouseEnter={el=>{el.currentTarget.style.borderColor="var(--glow)";el.currentTarget.style.boxShadow="0 0 16px rgba(0,255,231,.05)"}}
            onMouseLeave={el=>{el.currentTarget.style.borderColor="var(--dim)";el.currentTarget.style.boxShadow="none"}}>
            <div style={{textAlign:"center",flexShrink:0,width:70}}>
              <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--tm)"}}>{e.date}</div>
              <div style={{fontFamily:"var(--disp)",fontSize:17,fontWeight:700,color:"var(--tx)",margin:"3px 0"}}>{e.dur}</div>
              <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--tm)"}}>{e.people} ppl</div>
            </div>
            <div style={{width:1,background:"var(--dim)",flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:9,alignItems:"center",marginBottom:5}}>
                <span style={{fontFamily:"var(--ui)",fontWeight:700,fontSize:13,color:"var(--tx)"}}>{e.room}</span>
                <span style={{fontSize:8,fontFamily:"var(--mono)",padding:"2px 7px",borderRadius:2,
                  background:`${tc[e.type]}14`,color:tc[e.type],border:`1px solid ${tc[e.type]}38`}}>
                  {e.type.toUpperCase()}
                </span>
              </div>
              <div style={{fontFamily:"var(--ui)",fontSize:12,color:"var(--ts)",lineHeight:1.6}}>{e.summary}</div>
            </div>
            <div style={{flexShrink:0,display:"flex",flexDirection:"column",gap:5,justifyContent:"center"}}>
              {["TRANSCRIPT","AI SUMMARY"].map((b,i)=>(
                <button key={i} style={{background:"transparent",border:"1px solid var(--dim)",
                  color:"var(--ts)",fontFamily:"var(--mono)",fontSize:8,padding:"5px 9px",
                  cursor:"pointer",borderRadius:2,transition:"all .15s",letterSpacing:1}}
                  onMouseEnter={e=>{e.currentTarget.style.color="var(--cyan)";e.currentTarget.style.borderColor="var(--glow)"}}
                  onMouseLeave={e=>{e.currentTarget.style.color="var(--ts)";e.currentTarget.style.borderColor="var(--dim)"}}>{b}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════ */
export default function App(){
  const [phase,setPhase]=useState("intro"); // intro | login | app
  const [user,setUser]=useState(null);
  const [view,setView]=useState("home");
  const [modal,setModal]=useState(null);
  const [rooms,setRooms]=useState([]);
  const [allUsers,setAllUsers]=useState(USERS);

  return(
    <>
      <G/>
      <div style={{pointerEvents:"none",position:"fixed",inset:0,zIndex:9999,
        background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.03) 2px,rgba(0,0,0,.03) 4px)"}}/>

      {phase==="intro"&&<Intro onDone={()=>setPhase("login")}/>}
      {phase==="login"&&<Login onLogin={u=>{setUser(u);setPhase("app");}}/>}

      {phase==="app"&&user&&(
        <div style={{width:"100vw",height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
          <CircuitBg/><HexGrid/><ScanLine/>
          <TopBar view={view} setView={setView} user={user} onLogout={()=>{
            setUser(null);setRooms([]);setView("home");setPhase("login");
          }}/>
          <div style={{flex:1,overflow:"hidden",position:"relative",zIndex:5}}>
            {view==="home"    &&<HomeScreen user={user} rooms={rooms} setView={setView} setModal={setModal}/>}
            {view==="rooms"   &&<RoomsView user={user} rooms={rooms} setRooms={setRooms}/>}
            {view==="history" &&<HistoryView rooms={rooms}/>}
            {view==="ai"      &&<AIView/>}
            {view==="admin"   &&user.role==="admin"&&(
              <AdminView
                user={user}
                rooms={rooms}
                setRooms={setRooms}
                allUsers={allUsers}
                setAllUsers={setAllUsers}
              />
            )}
          </div>
        </div>
      )}

      {modal==="create"&&user&&(
        <CreateRoomModal onClose={()=>setModal(null)} allUsers={allUsers} onAddMember={(name)=>{
          const id="u_"+Date.now()+"_"+Math.random().toString(36).slice(2,5);
          const email=name.toLowerCase().replace(/[^a-z0-9]+/g,".").replace(/(^\\.|\\.$)/g,"") + "@cipher.local";
          const u={id,email,password:"member123",name,role:"member",avatar:"👤"};
          setAllUsers(us=>[...us,u]);
          return u;
        }} onCreate={async(payload)=>{
          const iconMap={tech:"⚛",design:"◇",finance:"◈",research:"⬡",aiml:"🧠",devops:"⬟"};
          const room={
            id:"room_"+Date.now(),
            parentId:null,
            createdBy:user.id,
            name:payload.name,
            type:payload.type,
            icon:iconMap[payload.type]||"⬡",
            access:payload.access,
            description:payload.description||"",
            code:Math.random().toString(36).slice(2,8).toUpperCase(),
            active:true,
            leaders:[user,...(payload.leaders||[])],
            members:[...(payload.members||[])],
            pending:[],
            messages:[],
            createdAt:new Date().toLocaleString(),
          };
          setRooms(rs=>[...rs,room]);
          return room;
        }}/>
      )}
      {modal==="join"&&(
        <JoinRoomModal onClose={()=>setModal(null)}
          onRequest={async(code)=>{
            let found=false;
            setRooms(rs=>rs.map(r=>{
              if(r.code===code.toUpperCase()){
                found=true;
                if(r.parentId)return r;
                if(!r.pending.find(p=>p.id===user.id)&&!r.members.find(m=>m.id===user.id)&&!r.leaders.find(l=>l.id===user.id)){
                  return {...r,pending:[...r.pending,user]};
                }
              }
              return r;
            }));
            if(!found)throw new Error("No room found with that code.");
            const target=rooms.find(r=>r.code===code.toUpperCase());
            if(target?.parentId)throw new Error("Only main rooms accept join requests.");
          }}/>
      )}
    </>
  );
}
