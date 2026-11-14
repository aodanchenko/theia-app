
// Person mid-squat, front view. Right knee (screen right) drifts inward.
const P={head:[180,118],neck:[180,150],ls:[142,170],rs:[218,170],le:[124,226],re:[236,226],lw:[156,250],rw:[204,250],lh:[158,296],rh:[202,296],lk:[126,372],rk:[192,378],la:[138,462],ra:[222,462]};
const BONES=[['neck','ls'],['neck','rs'],['ls','le'],['le','lw'],['rs','re'],['re','rw'],['ls','lh'],['rs','rh'],['lh','rh'],['lh','lk'],['lk','la'],['rh','rk'],['rk','ra']];
let uid=0;

// The camera: a soft, grainy video-like frame with a sharp skeleton on top.
function camera(app,h,o={}){
  const W=o.w||360;
  const id='c'+(uid++), earth=app==='earth', vis=o.vis||h;
  const s=Math.min(1.08,(vis-70-24)/390), tx=W/2-180*s, ty=70-91*s, floor=ty+470*s;
  const wall=earth?['#b9ab95','#8f8270']:['#4a5462','#2a313b'], ground=earth?'#7d715f':'#22282f', body=earth?'#4b4236':'#141a22';
  const bone='rgba(255,255,255,.8)', warn=o.warn||(earth?'#f0a24a':'#f2c230');
  const L=(a,b,w,c)=>`<line x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const person=BONES.map(([a,b])=>L(a,b,30,body)).join('')+`<path d="M142 170L218 170L202 296L158 296Z" fill="${body}"/><circle cx="180" cy="118" r="27" fill="${body}"/>`;
  const skel=BONES.map(([a,b])=>L(a,b,1.4,bone)).join('')+Object.entries(P).filter(([k])=>k!=='head').map(([,[x,y]])=>`<circle cx="${x}" cy="${y}" r="2.6" fill="${bone}"/>`).join('');
  const knee=L('rh','rk',2.4,warn)+L('rk','ra',2.4,warn)+`<circle class="pop" cx="${P.rk[0]}" cy="${P.rk[1]}" r="14" fill="none" stroke="${warn}" stroke-width="2"/>`;
  const guide=o.guide?`<line x1="${P.rh[0]+14}" y1="${P.rh[1]}" x2="${P.ra[0]}" y2="${P.ra[1]}" stroke="${warn}" stroke-width="1.4" stroke-dasharray="4 5"/>`:'';
  const arrow=o.arrow?`<g class="pop"><path d="M${P.rk[0]+20} ${P.rk[1]}h44" stroke="${warn}" stroke-width="5" stroke-linecap="round"/><path d="M${P.rk[0]+56} ${P.rk[1]-12}l14 12-14 12" fill="none" stroke="${warn}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>`:'';
  const tag=(x,y,t,c='#fff')=>`<g class="pop"><rect x="${x}" y="${y-13}" width="${t.length*7.4+12}" height="20" rx="3" fill="rgba(14,19,26,.78)"/><text x="${x+6}" y="${y+1}" font-family="IBM Plex Mono" font-size="12" fill="${c}">${t}</text></g>`;
  const tags=o.tags?tag(P.rk[0]+20,P.rk[1]+4,'KNEE 9°',warn)+tag(P.rh[0]+16,P.rh[1]-6,'HIP 94°')+tag(P.rs[0]+16,P.rs[1]+30,'TRUNK 4°'):'';
  const rule=o.ruler?`<g stroke="#fff" opacity=".7">${Array.from({length:17},(_,i)=>`<line x1="${i%4?8:0}" x2="16" y1="${ty+P.head[1]*s+i*22}" y2="${ty+P.head[1]*s+i*22}"/>`).join('')}</g><path d="M18 ${ty+P.rh[1]*s}l10-6v12z" fill="${warn}"/>`:'';
  const br=o.brackets?(()=>{const m=22,l=26,H=vis;return `<g stroke="#fff" stroke-width="2.5" fill="none" opacity=".9"><path d="M${m} ${m+40+l}v-${l}h${l}"/><path d="M${W-m-l} ${m+40}h${l}v${l}"/><path d="M${m} ${H-m-l}v${l}h${l}"/><path d="M${W-m-l} ${H-m}h${l}v-${l}"/></g>`})():'';
  return `<svg viewBox="0 0 ${W} ${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Camera: person squatting, right knee moving inward">
  <defs>
    <linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wall[0]}"/><stop offset="1" stop-color="${wall[1]}"/></linearGradient>
    <radialGradient id="${id}v" cx=".5" cy=".42" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
    <filter id="${id}b"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="${id}n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 .5 0"/></filter>
  </defs>
  <rect width="${W}" height="${h}" fill="url(#${id}w)"/><rect y="${floor}" width="${W}" height="${h}" fill="${ground}"/>
  <g transform="translate(${tx},${ty}) scale(${s})"><g filter="url(#${id}b)" opacity=".92">${person}</g>${guide}${skel}${knee}${arrow}${tags}</g>
  <rect width="${W}" height="${h}" fill="url(#${id}v)"/><rect width="${W}" height="${h}" filter="url(#${id}n)" opacity=".22"/>
  ${rule}${br}</svg>`;
}

function spark(seed,up){let y=8,pts=[];for(let i=0;i<12;i++){y+=((Math.sin(seed*7+i*1.9)+(up?.35:-.15))*2.2);y=Math.max(2,Math.min(14,y));pts.push(`${i*5},${16-y}`)}return `<svg viewBox="0 0 56 16"><polyline points="${pts.join(' ')}" fill="none" stroke="${up?'#fc3b30':'#0062b3'}" stroke-width="1.4"/></svg>`;}
function vitals(){
  const t=[['Heart rate','128','bpm',1,1],['HRV rMSSD','38','ms',2,1],['SpO2','97','%',3,0],['Resp rate','24','/min',4,0],['Core temp','37.1','°C',5,0],['BP (cuff, pre-set)','131/84','',6,0]];
  return `<div class="vitals in d2"><p>Vitals<span>SIMULATED · base: personal, 14 sessions</span></p><div class="vg">${t.map(([n,v,u,k,hi])=>`<div class="${hi?'hi':''}"><small>${n}</small><b>${v}<u>${u}</u></b>${spark(k,hi)}</div>`).join('')}</div></div>`;
}
function valgusChart(){
  const v=[2,3,3,4,5,7,9], X=i=>34+i*28, Y=d=>116-d*8.4;
  const bars=v.map((d,i)=>`<rect x="${X(i)-9}" y="${Y(d)}" width="18" height="${116-Y(d)}" fill="${d>=6?'#fc3b30':'#a8a8a9'}"/>`).join('');
  const empty=[7,8,9].map(i=>`<rect x="${X(i)-9}" y="${Y(.3)}" width="18" height="3" fill="#d4d4d6"/>`).join('');
  const lbl=Array.from({length:10},(_,i)=>`<text x="${X(i)}" y="130" text-anchor="middle">${i+1}</text>`).join('');
  return `<svg viewBox="0 0 400 140" font-family="IBM Plex Mono" font-size="9" fill="#6b6e75" role="img" aria-label="Right knee valgus per rep">
  <rect x="20" y="${Y(4)}" width="300" height="${Y(2)-Y(4)}" fill="rgba(45,160,90,.12)"/><text x="324" y="${Y(3)+3}" fill="#2a8a52">BASELINE 2–4°</text>
  <line x1="20" x2="320" y1="${Y(6)}" y2="${Y(6)}" stroke="#fc3b30" stroke-dasharray="4 3"/><text x="324" y="${Y(6)+3}" fill="#fc3b30">REHAB MODEL 6°</text>
  <line x1="20" x2="320" y1="${Y(10)}" y2="${Y(10)}" stroke="#6b6e75" stroke-dasharray="2 3"/><text x="324" y="${Y(10)+3}">BASE MODEL 10°</text>
  <line x1="20" x2="320" y1="116" y2="116" stroke="#d4d4d6"/>${bars}${empty}${lbl}
  <path d="M${X(5)} ${Y(7)-6}v-8" stroke="#fc3b30"/><text x="${X(5)}" y="${Y(7)-17}" text-anchor="middle" fill="#fc3b30">FLAG</text>
  <text x="20" y="138">REP</text></svg>`;
}
// One side per page: <main id="stage" data-side="earth|space">
const stage=document.getElementById('stage');
const pair=(e,s)=>stage.dataset.side==='earth'?e:s;
stage.innerHTML=(
()=>pair(
`<div class="phone earth v2"><div class="cam">${camera('earth',760,{arrow:true,vis:640})}</div>
  <div class="say in"><p>Push your right knee out</p><small>Like the arrow shows</small></div>
  <div class="count in d2"><b class="tab">7</b><span>of 10</span></div>
  <button class="stop press in d2" aria-label="Stop">Stop</button></div>`,
`<div class="tablet wb">
  <div class="menu"><b>THEIA Workbench</b><span>File</span><span>Edit</span><span>View</span><span>Data</span><span>Model</span><span>Help</span><span class="r mono">ARED_MD112_SET2.thx</span></div>
  <div class="tools"><span class="tb on"><span class="led"></span>Live</span><span class="tb">Pause</span><span class="sep"></span><span class="tb">Baseline: personal (14 sessions)</span><span class="tb on">Model: rehab priors v0.3</span><span class="tb">Compare: base model</span><span class="sep"></span><span class="tb">Known cause: EVA −1 d</span></div>
  <div class="main">
    <div class="view"><div class="cam">${camera('space',548,{tags:true,ruler:true,vis:548,w:520,warn:'#fc3b30'})}</div><span class="banner in">KNEES OUT</span><span class="cap">CAM 1 · FRONT · 30 FPS<br>SET 2 · REP 7/10 · 68 KG</span></div>
    <div class="right">
      <div class="fx"><span>B2</span><i>fx</i><code>=VALGUS(R_HIP, R_KNEE, R_ANKLE)</code></div>
      <table class="in">
        <tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th></tr>
        <tr class="hd"><td>1</td><td>Parameter</td><td>Now</td><td>Base</td><td>Δ</td><td>Flag</td></tr>
        <tr class="flag"><td>2</td><td>R knee valgus</td><td class="n sel">9°</td><td class="n">3°</td><td class="n">+6</td><td>▲ rehab</td></tr>
        <tr><td>3</td><td>L knee valgus</td><td class="n">2°</td><td class="n">2°</td><td class="n">0</td><td></td></tr>
        <tr><td>4</td><td>Hip flexion</td><td class="n">94°</td><td class="n">96°</td><td class="n">−2</td><td></td></tr>
        <tr><td>5</td><td>Trunk lean</td><td class="n">4°</td><td class="n">3°</td><td class="n">+1</td><td></td></tr>
        <tr><td>6</td><td>Depth hip/knee</td><td class="n">0.92</td><td class="n">1.00</td><td class="n">−0.08</td><td></td></tr>
        <tr><td>7</td><td>Tempo (s)</td><td class="n">2.1</td><td class="n">2.0</td><td class="n">+0.1</td><td></td></tr>
        <tr><td>8</td><td>L/R load</td><td class="n">46/54</td><td class="n">50/50</td><td class="n">+4</td><td></td></tr>
              </table>
      <div class="chart in d1"><p>R knee valgus by rep · set 2</p>${valgusChart()}</div>
      ${vitals()}
    </div>
  </div>
  <div class="sbar"><span>REP 7/10</span><span>LOAD 68 KG</span><span>MD 112</span><span>Flagged rep 6 (rehab) · base model: not yet</span><span class="r">Next: cue knees out · rep 8 again → 63 kg</span></div>
  <div class="sheets"><span class="on">Live</span><span>Set 1</span><span>Set 2</span><span>Baseline</span><span>Rehab priors</span><span>Log</span></div>
</div>`)
)();
