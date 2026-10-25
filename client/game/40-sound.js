/* ===================== SOM (WebAudio sintetizado na hora; liga no primeiro toque) =====================
   Efeitos (SB, e SW com eco de tapera) e música (MB → MD, que abaixa nas aberturas) vão para o mestre (MG) → compressor.
   Nenhum arquivo de áudio: tudo é oscilador, ruído e filtro. O botão do alto-falante desliga tudo; o da nota, só a música. */
try{const o=window.__cgSnd;if(o){clearInterval(o.timer);if(o.ac&&o.ac.close)o.ac.close().catch(()=>{});}}catch(e){}
let AC=null,MG=null,SB=null,SW=null,MB=null,MD=null,RVB=null;
const SND={next:{},tag:null,nb:null,nbAc:null};
const MUS={want:null,cur:null,step:0,next:0,timer:0,int:0,duck:1,arena:0};
const MUS_VOL=0.14;

function audioInit(){
  if(!AC){
    try{
      const K=window.AudioContext||window.webkitAudioContext;if(!K)return;
      try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch(e){} // iPhone no silencioso: o jogo ainda toca
      AC=new K();sndMontar(AC);
      window.__cgSnd={ac:AC,timer:0};
      AC.onstatechange=()=>{if(AC&&AC.state==='running')musTentar();};
    }catch(e){AC=null;return;}
  }
  if(AC.state!=='running'&&AC.state!=='closed'&&!document.hidden){
    try{const p=AC.resume();if(p&&p.catch)p.catch(()=>{});}catch(e){}
    // um silêncio curtinho dentro do toque destrava o áudio no Safari
    try{const b=AC.createBuffer(1,1,22050),src=AC.createBufferSource();src.buffer=b;src.connect(AC.destination);src.start(0);}catch(e){}
  }
  iosSilencio();
  musTentar();
}
['pointerdown','pointerup','touchend','mousedown','keydown','click'].forEach(ev=>window.addEventListener(ev,audioInit,{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{
  if(!AC)return;
  try{
    if(document.hidden){AC.suspend().catch(()=>{});if(SND.tag)SND.tag.pause();}
    else{AC.resume().catch(()=>{});if(SND.tag){const p=SND.tag.play();if(p&&p.catch)p.catch(()=>{});}}
  }catch(e){}
});
/* iPhone antigo (sem navigator.audioSession): um <audio> de silêncio em laço faz o som sair mesmo com a chave do silencioso */
function iosSilencio(){
  if(SND.tag||navigator.audioSession)return;
  const ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  if(!ios)return;
  try{const a=document.createElement('audio');a.setAttribute('playsinline','');a.loop=true;a.src=wavSilencio();SND.tag=a;const p=a.play();if(p&&p.catch)p.catch(()=>{SND.tag=null;});}catch(e){SND.tag=null;}
}
function wavSilencio(){
  const n=4000,b=new Uint8Array(44+n),v=new DataView(b.buffer);const w=(o,x)=>{for(let i=0;i<x.length;i++)b[o+i]=x.charCodeAt(i);};
  w(0,'RIFF');v.setUint32(4,36+n,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,8000,true);v.setUint32(28,8000,true);v.setUint16(32,1,true);v.setUint16(34,8,true);w(36,'data');v.setUint32(40,n,true);b.fill(128,44);
  let x='';for(let i=0;i<b.length;i++)x+=String.fromCharCode(b[i]);return 'data:audio/wav;base64,'+btoa(x);
}
function sndMontar(ac){
  MG=ac.createGain();MG.gain.value=(s&&s.mudo)?0:1;
  const cp=ac.createDynamicsCompressor();cp.threshold.value=-14;cp.knee.value=8;cp.ratio.value=5;cp.attack.value=0.002;cp.release.value=0.2;
  MG.connect(cp);cp.connect(ac.destination);
  RVB=ac.createConvolver();RVB.buffer=impulso(ac,1.5,2.8);const rg=ac.createGain();rg.gain.value=0.32;RVB.connect(rg);rg.connect(MG);
  SB=ac.createGain();SB.gain.value=1;SB.connect(MG);
  SW=ac.createGain();SW.connect(SB);const sw=ac.createGain();sw.gain.value=0.55;SW.connect(sw);sw.connect(RVB);
  MB=ac.createGain();MB.gain.value=0;MD=ac.createGain();MD.gain.value=MUS.duck;MB.connect(MD);MD.connect(MG);
  const ms=ac.createGain();ms.gain.value=0.3;MD.connect(ms);ms.connect(RVB);
}
function impulso(ac,dur,dec){
  const n=Math.floor(ac.sampleRate*dur),b=ac.createBuffer(2,n,ac.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,dec);}
  return b;
}
function sndAplicar(){
  if(!AC)return;
  try{MG.gain.setTargetAtTime((s&&s.mudo)?0:1,AC.currentTime,0.02);}catch(e){}
  musTentar();
}

/* ---------- peças básicas ---------- */
const mf=m=>440*Math.pow(2,(m-69)/12);
function nm(n){const r=/^([A-G])(#|b)?(\d)$/.exec(n);return {C:0,D:2,E:4,F:5,G:7,A:9,B:11}[r[1]]+(r[2]==='#'?1:r[2]==='b'?-1:0)+(+r[3]+1)*12;}
const vr=(x,p)=>x*(1+(Math.random()*2-1)*(p==null?0.04:p));
function env(p,t,a,d,v,h){
  p.setValueAtTime(0.0001,t);p.linearRampToValueAtTime(v,t+a);
  if(h)p.setValueAtTime(v,t+a+h);
  p.exponentialRampToValueAtTime(0.0001,t+Math.max(d,a+(h||0)+0.01));
}
function filtro(tipo,f,q,t){const fl=AC.createBiquadFilter();fl.type=tipo;fl.frequency.setValueAtTime(f,t);fl.Q.value=q==null?0.7:q;return fl;}
function nbuf(){
  if(SND.nb&&SND.nbAc===AC)return SND.nb;
  const n=AC.sampleRate;const b=AC.createBuffer(1,n,n);const d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
  SND.nb=b;SND.nbAc=AC;return b;
}
/* oscilador com envelope. o: {t,d,w,f,f1,fd,lin,fs:[[dt,f]],det,lp|bp|hp,q,ff1,ffs,a,h,v,vib:[hz,cents,atraso],dest} */
function osc(o){
  const t=o.t,d=o.d,os=AC.createOscillator();os.type=o.w||'sine';
  os.frequency.setValueAtTime(o.f,t);
  if(o.fs)for(const [dt,fr] of o.fs)os.frequency.linearRampToValueAtTime(fr,t+dt);
  else if(o.f1&&o.f1!==o.f){const te=t+(o.fd||d);if(o.lin)os.frequency.linearRampToValueAtTime(o.f1,te);else os.frequency.exponentialRampToValueAtTime(o.f1,te);}
  if(o.det)os.detune.value=o.det;
  let n=os;
  const ft=o.lp?'lowpass':o.bp?'bandpass':o.hp?'highpass':null;
  if(ft){const fl=filtro(ft,o.lp||o.bp||o.hp,o.q,t);
    if(o.ffs)for(const [dt,fr] of o.ffs)fl.frequency.linearRampToValueAtTime(fr,t+dt);
    else if(o.ff1)fl.frequency.exponentialRampToValueAtTime(o.ff1,t+(o.ffd||d));
    n.connect(fl);n=fl;}
  const g=AC.createGain();env(g.gain,t,o.a||0.004,d,o.v==null?0.4:o.v,o.h);n.connect(g);g.connect(o.dest||SB);
  if(o.vib){const l=AC.createOscillator(),lg=AC.createGain();l.frequency.value=o.vib[0];lg.gain.value=o.vib[1];l.connect(lg);lg.connect(os.detune);l.start(t+(o.vib[2]||0));l.stop(t+d+0.06);}
  os.start(t);os.stop(t+d+0.05);
}
/* ruído filtrado. o: {t,d,ty,f,f1,q,a,h,v,dest} */
function nz(o){
  const t=o.t,d=o.d,src=AC.createBufferSource();src.buffer=nbuf();src.loop=true;
  const fl=filtro(o.ty||'bandpass',o.f||1000,o.q==null?1:o.q,t);if(o.f1)fl.frequency.exponentialRampToValueAtTime(o.f1,t+d);
  const g=AC.createGain();env(g.gain,t,o.a||0.002,d,o.v==null?0.4:o.v,o.h);
  src.connect(fl);fl.connect(g);g.connect(o.dest||SB);src.start(t,Math.random()*0.8);src.stop(t+d+0.05);
}
/* sino: parciais inarmônicos (moedas, brilhos, campainhas) */
function sino(t,f,d,v,dest){
  for(const [k,a] of [[1,1],[2.76,0.45],[5.4,0.22],[8.93,0.1]]){if(f*k>15000)break;osc({t,f:f*k,d:d/(1+k*0.3),v:v*a,a:0.002,dest:dest||SW});}
}
/* pífano: seno + triângulo uma oitava acima, com sopro */
function pifano(t,m,d,v,dest){
  const f=mf(m);
  osc({t,f,d:d+0.06,v,a:0.03,h:Math.max(0,d-0.08),vib:[5.8,14,0.12],dest:dest||MB});
  osc({t,w:'triangle',f:f*2,d:d+0.06,v:v*0.18,a:0.03,h:Math.max(0,d-0.08),dest:dest||MB});
  nz({t,ty:'bandpass',f:f*2,q:3,d:0.08,v:v*0.25,dest:dest||MB});
}
function viola(t,ms,d,v,dest){for(const m of ms)osc({t:t+Math.random()*0.012,w:'triangle',f:mf(m),d,v,lp:2200,a:0.003,dest:dest||MB});}
function baixo(t,m,d,v,dest){const f=mf(m);osc({t,w:'triangle',f,d:d+0.05,v,lp:800,a:0.006,h:d*0.5,dest:dest||MB});osc({t,f:f/2,d:d+0.05,v:v*0.5,a:0.006,h:d*0.5,dest:dest||MB});}
function zab(t,v,dest){osc({t,f:125,f1:48,fd:0.11,d:0.3,v,a:0.002,dest:dest||MB});nz({t,ty:'lowpass',f:500,d:0.06,v:v*0.45,dest:dest||MB});}
function bac(t,v,dest){nz({t,ty:'bandpass',f:2400,q:1.6,d:0.04,v,dest:dest||MB});osc({t,f:340,d:0.035,v:v*0.4,dest:dest||MB});}
function tri(t,aberto,v,dest){const d=aberto?0.42:0.07;for(const [f,a] of [[4300,1],[6250,0.6],[7800,0.35]])osc({t,f,d,v:v*a,a:0.001,dest:dest||MB});}
function shk(t,v,dest){nz({t,ty:'highpass',f:6500,d:0.05,v,a:0.006,dest:dest||MB});}
/* metais (fanfarra): serras com filtro que abre no ataque */
function metais(t,m,d,v,dest){
  const f=mf(m),fl=AC.createBiquadFilter(),g=AC.createGain();fl.type='lowpass';fl.Q.value=1.4;
  fl.frequency.setValueAtTime(f*1.5,t);fl.frequency.linearRampToValueAtTime(Math.min(9000,f*7),t+0.05);fl.frequency.linearRampToValueAtTime(Math.min(6000,f*3.5),t+0.25);
  d=Math.max(0.12,d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+0.035);g.gain.setValueAtTime(v*0.8,t+d-0.06);g.gain.linearRampToValueAtTime(0,t+d+0.08);
  for(const dt of [-6,6]){const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=dt;o.connect(fl);
    if(d>0.4){const l=AC.createOscillator(),lg=AC.createGain();l.frequency.value=5;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(9,t+0.3);l.connect(lg);lg.connect(o.detune);l.start(t);l.stop(t+d+0.1);}
    o.start(t);o.stop(t+d+0.1);}
  fl.connect(g);g.connect(dest||SW);
}
/* coro "aaah" (lendária): serras em dois formantes, entrada lenta */
function coro(t,ms,d,v,dest){
  const g=AC.createGain(),f1=filtro('bandpass',780,5,t),f2=filtro('bandpass',1150,6,t),lp=filtro('lowpass',3200,0.7,t);
  f1.connect(lp);f2.connect(lp);lp.connect(g);g.connect(dest||SW);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+0.3);g.gain.setValueAtTime(v,t+Math.max(0.31,d-0.4));g.gain.linearRampToValueAtTime(0,t+d);
  for(const m of ms)for(const dt of [-10,0,10]){const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=mf(m);o.detune.value=dt+Math.random()*4;o.connect(f1);o.connect(f2);o.start(t);o.stop(t+d+0.05);}
}
function brilhos(t,ms,passo,v,d){ms.forEach((m,i)=>sino(t+i*passo,mf(m),d||0.5,v));}
function pratos(t,d,v){nz({t,ty:'highpass',f:5200,d,v,a:0.003,dest:SW});nz({t,ty:'bandpass',f:9000,q:0.8,d:d*0.6,v:v*0.5,dest:SW});}
function rufar(t,dur,v0,v1){const n=Math.floor(dur/0.05);for(let i=0;i<n;i++){const k=i/n;osc({t:t+i*0.05,f:vr(95,0.03),f1:70,d:0.12,v:v0+(v1-v0)*k,a:0.002});nz({t:t+i*0.05,ty:'lowpass',f:900,d:0.05,v:(v0+(v1-v0)*k)*0.4});}}

/* ---------- peças de voz (os arquétipos do v10 juntam estas) ---------- */
function vozPiu(t,k,n,dest){for(let i=0;i<(n||2);i++)osc({t:t+i*0.11,f:vr(2400*k,0.05),f1:3300*k,d:0.07,v:0.2,dest:dest||SW});}
function vozCra(t,k){osc({t,w:'sawtooth',f:640*k,f1:470*k,d:0.3,v:0.36,bp:1400,q:2,a:0.01,dest:SW});nz({t,ty:'bandpass',f:1700,q:3,d:0.28,v:0.28,a:0.02});}
function vozCoaxa(t,k,n){for(let r=0;r<2;r++)for(let j=0;j<(n||5);j++)osc({t:t+r*0.22+j*0.028,w:'square',f:(r?250:215)*k,d:0.024,v:0.14,lp:1100,a:0.002});}
function vozZum(t,k,d,v){osc({t,w:'sawtooth',f:225*k,d:d||0.5,v:v||0.22,bp:900,q:2,a:0.06,vib:[26,40],dest:SW});osc({t,w:'sawtooth',f:229*k,d:d||0.5,v:(v||0.22)*0.6,bp:1900,q:3,a:0.06});}
function vozGalo(t,k){
  const sil=[[0,0.09,520,590],[0.12,0.09,560,630],[0.25,0.11,630,740]];
  for(const [dt,d,f0,f1] of sil)osc({t:t+dt,w:'sawtooth',f:f0*k,f1:f1*k,d,v:0.12,bp:1300,q:1.5,a:0.01,dest:SW});
  osc({t:t+0.4,w:'sawtooth',f:780*k,fs:[[0.12,880*k],[0.62,540*k]],d:0.66,v:0.13,bp:1400,q:1.5,a:0.02,h:0.3,vib:[9,28,0.1],dest:SW});
  nz({t:t+0.4,ty:'bandpass',f:2400,q:2,d:0.6,v:0.04,a:0.05});
}
function vozPipoca(t,n,dur){for(let i=0;i<n;i++){const tt=t+Math.random()*dur;nz({t:tt,ty:'bandpass',f:vr(1900,0.3),q:3,d:0.03,v:0.32});osc({t:tt,f:vr(650,0.2),f1:300,d:0.035,v:0.1});}}
function vozPlanta(t,k){osc({t,f:380*k,f1:950*k,d:0.09,v:0.2});nz({t:t+0.02,ty:'highpass',f:3200,d:0.14,v:0.08,a:0.02});}
function vozFolhas(t,d,v){nz({t,ty:'highpass',f:2800,d,v:v||0.1,a:d*0.3});nz({t:t+d*0.3,ty:'bandpass',f:5200,q:1,d:d*0.6,v:(v||0.1)*0.6,a:0.02});}
function vozMadeira(t,k,d){osc({t,w:'sawtooth',f:75*k,f1:105*k,d:d||0.5,v:0.12,bp:420,q:4,a:0.05,vib:[15,30],dest:SW});}
function vozBolhas(t,n,low){for(let i=0;i<n;i++)osc({t:t+0.05+i*0.07+Math.random()*0.03,f:vr(low?160:320,0.15),f1:low?380:760,d:0.06,v:0.16});}
/* v4: vozes novas */
function vozLatido(t,k){for(let i=0;i<2;i++){osc({t:t+i*0.16,w:'sawtooth',f:420*k,f1:260*k,d:0.11,v:0.26,bp:900,q:2,a:0.004,dest:SW});nz({t:t+i*0.16,ty:'bandpass',f:1300,q:1.5,d:0.05,v:0.12});}
  for(let i=0;i<3;i++)nz({t:t+0.36+i*0.08,ty:'bandpass',f:1800,q:1,d:0.05,v:0.05,a:0.01});}
/* ---------- v10: vozes por arquétipo (spec §11.2). VOZ[id](t,k) = ARQ[arquétipo](t,k*fator da carta) ---------- */
/* voz com formantes: serra por dois passa-bandas em paralelo (vogal "ê", "é", "i"...) */
function formante(t,f,d,v,fa,fb,o){
  o=o||{};const g=AC.createGain(),b1=filtro('bandpass',fa,o.q||6,t),b2=filtro('bandpass',fb,(o.q||6)*1.2,t);
  b1.connect(g);b2.connect(g);g.connect(o.dest||SW);
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+(o.a||0.015));
  if(o.h)g.gain.setValueAtTime(v,t+(o.a||0.015)+o.h);
  g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  const os=AC.createOscillator();os.type='sawtooth';os.frequency.setValueAtTime(f,t);
  if(o.fs)for(const [dt,fr] of o.fs)os.frequency.linearRampToValueAtTime(fr,t+dt);
  if(o.vib){const l=AC.createOscillator(),lg=AC.createGain();l.frequency.value=o.vib[0];lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(o.vib[1],t+(o.vib[2]||0.1));l.connect(lg);lg.connect(os.detune);l.start(t);l.stop(t+d+0.05);}
  os.connect(b1);os.connect(b2);os.start(t);os.stop(t+d+0.05);
}
function vozFogo(t,k,dest){
  const n=3+Math.floor(Math.random()*4),q=Math.min(1.5,Math.max(0.6,k));
  for(let i=0;i<n;i++)nz({t:t+0.02+Math.random()*0.34,ty:'bandpass',f:(2000+Math.random()*2000)*q,q:3,d:0.025,v:0.34,dest});
  nz({t,ty:'lowpass',f:200*q,f1:900*q,q:1.4,d:0.48,v:0.36,a:0.14,dest:dest||SW});
}
function vozCoruja(t,k,dest){for(let i=0;i<2;i++){const tt=t+i*0.36;osc({t:tt,f:420*k,f1:380*k,d:0.25,v:0.34,a:0.05,bp:800,q:0.7,dest:dest||SW});osc({t:tt,f:840*k,f1:760*k,d:0.2,v:0.03,a:0.05,dest:dest||SW});}}
function vozAgua(t,k){for(let i=0;i<4;i++)osc({t:t+0.05+i*0.07+Math.random()*0.03,f:vr(320*k,0.15),f1:760*k,d:0.06,v:0.16});osc({t:t+0.12,f:600*k,f1:300*k,d:0.35,v:0.14,a:0.02,dest:SW});}
function vozBoto(t,k){
  for(let i=0;i<8;i++)nz({t:t+i*0.03,ty:'bandpass',f:3000*k,q:5,d:0.012,v:0.4});
  formante(t+0.28,500*k,0.42,0.16,700,2300,{fs:[[0.34,900*k]],a:0.05,q:5});
  osc({t:t+0.28,f:500*k,f1:900*k,d:0.36,v:0.06,a:0.05,dest:SW});
}
function vozFera(t,k){
  const d=0.55,g=AC.createGain(),lp=filtro('lowpass',600,1.2,t),tr=AC.createGain();
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.36,t+0.06);g.gain.setValueAtTime(0.32,t+d-0.15);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  const l=AC.createOscillator(),lg=AC.createGain();l.frequency.value=18;lg.gain.value=0.45;tr.gain.value=0.55;l.connect(lg);lg.connect(tr.gain);
  const o=AC.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(90*k,t);o.frequency.linearRampToValueAtTime(72*k,t+d);
  const src=AC.createBufferSource();src.buffer=nbuf();src.loop=true;const ng=AC.createGain();ng.gain.value=0.6;
  o.connect(lp);src.connect(ng);ng.connect(lp);lp.connect(tr);tr.connect(g);g.connect(SW);
  o.start(t);o.stop(t+d+0.05);l.start(t);l.stop(t+d+0.05);src.start(t,Math.random()*0.5);src.stop(t+d+0.05);
}
function vozUivo(t,k){
  osc({t,f:300*k,fs:[[0.35,600*k],[1.0,350*k]],d:1.0,v:0.2,a:0.12,h:0.55,vib:[6,28,0.25],dest:SW});
  osc({t,w:'sawtooth',f:300*k,fs:[[0.35,600*k],[1.0,350*k]],d:1.0,v:0.05,lp:1400,a:0.12,h:0.55,vib:[6,28,0.25],dest:SW});
}
function vozAssombro(t,k,grave){
  const f=(grave?260:520)*k;
  for(const df of [0,2.4,-3.6])osc({t,f:f+df,f1:(f+df)*0.72,fd:1.1,d:1.15,v:0.1,a:0.25,h:0.4,dest:SW});
  nz({t,ty:'bandpass',f:f*2,q:8,d:1.0,v:0.04,a:0.3,dest:SW});
  if(grave)vozMadeira(t+0.25,k*0.9,0.55);
}
function vozGritoAss(t,k){nz({t,ty:'bandpass',f:1200*k,f1:850*k,q:2.5,d:0.5,v:0.9,a:0.008,dest:SW});formante(t,330*k,0.48,0.35,1100,2600,{fs:[[0.45,250*k]],a:0.01,q:3});}
function vozAssobio(t,k){osc({t,f:1800*k,f1:2400*k,lin:1,d:0.9,v:0.13,a:0.08,h:0.45,vib:[5,14,0.35],dest:SW});nz({t,ty:'bandpass',f:2100*k,q:6,d:0.9,v:0.03,a:0.1,h:0.4,dest:SW});}
function vozAndarilho(t,k){formante(t,170*k,0.3,0.55,700,1200,{fs:[[0.2,185*k]],a:0.03,q:4});}
function vozAboioA(t,k){
  osc({t,w:'triangle',f:220*k,fs:[[0.4,330*k],[1.3,196*k]],d:1.35,v:0.16,a:0.15,h:0.6,vib:[5,22,0.35],dest:SW});
  formante(t,220*k,1.35,0.08,700,1150,{fs:[[0.4,330*k],[1.3,196*k]],a:0.15,h:0.5,vib:[5,22,0.35]});
}
function vozMoleque(t,k){for(let i=0;i<2;i++)formante(t+i*0.13,330*k,0.1,0.5,520,1900,{fs:[[0.08,300*k]],a:0.008,q:4});}
function vozSaci(t,k){
  osc({t,f:1500*k,f1:2300*k,d:0.22,v:0.12,a:0.02,dest:SW});
  nz({t:t+0.12,ty:'bandpass',f:400,f1:2000,q:3,d:0.5,v:0.4,a:0.15,dest:SW});
  for(let i=0;i<3;i++)formante(t+0.55+i*0.09,(360-i*20)*k,0.07,0.17,600,1800,{a:0.006});
}
function vozCao(t,k){osc({t,w:'sawtooth',f:400*k,f1:270*k,d:0.12,v:0.6,bp:900,q:1.4,a:0.004,dest:SW});nz({t,ty:'bandpass',f:1300,q:1.5,d:0.06,v:0.3});osc({t,f:200*k,f1:120*k,d:0.08,v:0.2});}
function vozChiado(t,k){osc({t,f:900*k,fs:[[0.15,1300*k],[0.3,1000*k],[0.45,1250*k],[0.62,950*k]],d:0.65,v:0.07,a:0.04,h:0.4,vib:[9,40],dest:SW});vozMadeira(t,k,0.6);}
function vozVento(t,k){nz({t,ty:'bandpass',f:400*k,f1:2000*k,q:2.5,d:0.62,v:0.45,a:0.2,dest:SW});nz({t:t+0.3,ty:'bandpass',f:1600*k,f1:600*k,q:3,d:0.45,v:0.25,a:0.05});}
/* lenda: arquétipo base + metal grave + assinatura de 1,2 s com cauda de reverb */
function vozLenda(base,t,k,sig){
  ARQ[base](t,k);
  metais(t+0.05,40,0.55,0.05);metais(t+0.05,47,0.55,0.035);osc({t,f:70,f1:38,d:0.6,v:0.3});
  if(sig==='fogo'){[52,59,64].forEach((m,i)=>metais(t+0.3+i*0.12,m,i===2?0.8:0.2,0.04));}
  else if(sig==='mata'){coro(t+0.25,[62,66,69],1.2,0.045);vozFolhas(t+0.3,0.8,0.08);}
  else if(sig==='agua'){coro(t+0.25,[57,64,69],1.2,0.045);sino(t+0.4,mf(81),1.2,0.06);sino(t+0.62,mf(88),1.0,0.05);}
  else{coro(t+0.25,[45,52,57],1.2,0.05);vozFera(t+0.6,k*0.8);}
  for(let i=0;i<3;i++)sino(t+0.5+i*0.18,mf(76+i*5)*Math.min(1.3,k),0.9,0.025);
}
const ARQ={
  fogo:(t,k)=>vozFogo(t,k),
  ave:(t,k)=>vozPiu(t,k,2),
  'ave-rouca':(t,k)=>vozCra(t,k),
  coruja:(t,k)=>vozCoruja(t,k),
  galo:(t,k)=>{vozGalo(t,k);vozFogo(t+0.9,k*1.2);},
  planta:(t,k)=>{vozPlanta(t,k);vozFolhas(t+0.05,0.25,0.11);},
  inseto:(t,k)=>vozZum(t,k,0.42),
  agua:(t,k)=>vozAgua(t,k),
  sapo:(t,k)=>vozCoaxa(t,k),
  boto:(t,k)=>vozBoto(t,k),
  fera:(t,k)=>vozFera(t,k),
  'fera-uivo':(t,k)=>vozUivo(t,k),
  assombro:(t,k)=>vozAssombro(t,k,false),
  'assombro-grave':(t,k)=>vozAssombro(t,k*0.5,true),
  'assombro-grito':(t,k)=>vozGritoAss(t,k),
  'assombro-assobio':(t,k)=>vozAssobio(t,k),
  andarilho:(t,k)=>vozAndarilho(t,k),
  'andarilho-aboio':(t,k)=>vozAboioA(t,k),
  'andarilho-moleque':(t,k)=>vozMoleque(t,k),
  'andarilho-saci':(t,k)=>vozSaci(t,k),
  cao:(t,k)=>vozCao(t,k),
  madeira:(t,k)=>{osc({t,f:180*k,f1:90*k,d:0.12,v:0.4});nz({t,ty:'bandpass',f:900*k,q:3,d:0.05,v:0.3});vozMadeira(t+0.05,k,0.5);vozMadeira(t+0.07,k*1.5,0.35);},
  'madeira-chiado':(t,k)=>vozChiado(t,k),
  vento:(t,k)=>vozVento(t,k),
  coro:(t,k)=>{coro(t,[60,64,67].map(m=>m+Math.round(12*Math.log2(k))),0.9,0.05);sino(t+0.1,mf(84)*k,0.6,0.05);},
  'lenda-fogo':(t,k)=>vozLenda('fogo',t,k,'fogo'),
  'lenda-mata':(t,k)=>vozLenda('planta',t,k,'mata'),
  'lenda-agua':(t,k)=>vozLenda('agua',t,k,'agua'),
  'lenda-fera':(t,k)=>vozLenda('fera',t,k,'fera')
};
/* carta → [arquétipo, fator de altura] (coluna "Voz" das tabelas do §5) */
const VOZ_ARQ={
  'espiga-sapeca':['fogo',1.4],'corvo-ladino':['ave-rouca',1.0],'chuva-de-graos':['fogo',0.9],'espantalho-guardiao':['andarilho',0.8],
  'vento-dourado':['vento',1.0],'pipoqueiro-explosivo':['fogo',0.8],'revoada-noturna':['coruja',1.0],'rei-milhao':['lenda-fogo',0.7],
  'codorna-ninheira':['coruja',1.3],'pamonha-quentinha':['fogo',1.5],'galo-despertador':['galo',1.0],'galinheiro':['madeira',1.0],
  'gaviao-real':['lenda-fogo',1.2],'filhote':['ave',1.6],
  'maca-rolica':['planta',1.4],'abelha-operaria':['inseto',1.3],'orvalho-da-manha':['agua',1.3],'cerejas-gemeas':['planta',1.2],
  'joaninha-curandeira':['inseto',1.0],'colmeia-dourada':['inseto',0.8],'macieira-ancia':['lenda-mata',1.0],'guardia-florada':['lenda-mata',0.8],
  'pe-de-maracuja':['planta',1.1],'formiga-carregadeira':['inseto',1.5],'cipo-enrolado':['planta',0.7],'louva-a-deus':['inseto',0.9],
  'abelha-rainha':['inseto',0.7],'cereja':['planta',1.6],'zangao':['inseto',1.6],
  'sapinho-verruguento':['sapo',1.3],'libelula-faisca':['inseto',1.6],'lodo-pegajoso':['agua',0.6],'taboa-espinhosa':['planta',0.8],
  'garca-pescadora':['ave',0.8],'atoleiro':['agua',0.5],'rainha-das-ras':['lenda-agua',1.1],'velho-lodao':['lenda-agua',0.6],
  'perereca-grudenta':['sapo',1.6],'vaga-lume-piscante':['assombro',1.5],'sapo-cururu':['sapo',0.8],'cagado-ranzinza':['agua',0.7],
  'sucuri-do-charco':['boto',1.0],'girino':['sapo',1.8],
  'ovelha-felpuda':['assombro',1.0],'cabrito-teimoso':['fera',1.2],'feno-fresquinho':['agua',1.1],'vaca-mimosa':['assombro-assobio',1.0],
  'bode-marrento':['assombro-grave',0.7],'cerca-de-pedra':['madeira',0.7],'touro-trovao':['fera-uivo',0.9],'matriarca-mugidora':['lenda-fera',0.6],
  'bezerro-manhoso':['fera-uivo',1.6],'jegue-carregador':['assombro-grito',1.0],'porco-comilao':['fera',1.1],'vaqueiro-aboiador':['andarilho-aboio',0.9],
  'boi-bumba':['lenda-fogo',0.9],
  'pintinho-valente':['ave',1.5],'adubo-magico':['planta',1.0],'gato-do-celeiro':['andarilho-moleque',1.4],'moinho-de-vento':['fogo',0.9],
  'vira-lata-caramelo':['cao',1.0],'danca-da-chuva':['coro',1.0],'trator-vermelho':['madeira-chiado',1.0],'sanfoneiro-do-forro':['andarilho-saci',1.2]
};
const VOZ={};
for(const id in VOZ_ARQ){const [a,f]=VOZ_ARQ[id];VOZ[id]=(t,k)=>ARQ[a](t,(k||1)*f);}

/* ---------- efeitos ---------- */
const RAR_N={comum:0,incomum:1,rara:2,epica:3,lendaria:4};
const SFX={
  /* interface */
  tap(t){osc({t,f:vr(1100),f1:720,d:0.07,v:0.38});osc({t,w:'triangle',f:2300,d:0.025,v:0.08});},
  aba(t){osc({t,f:vr(1250),f1:950,d:0.06,v:0.26});nz({t,ty:'bandpass',f:3500,q:1,d:0.05,v:0.07});},
  abrir(t){nz({t,ty:'bandpass',f:500,f1:2600,q:1.5,d:0.15,v:0.32,a:0.04});osc({t,f:480,f1:820,d:0.11,v:0.14});},
  fechar(t){nz({t,ty:'bandpass',f:2600,f1:600,q:1.5,d:0.13,v:0.27,a:0.02});osc({t,f:720,f1:440,d:0.09,v:0.13});},
  erro(t){osc({t,w:'square',f:185,d:0.08,v:0.12,lp:900});osc({t:t+0.1,w:'square',f:150,d:0.12,v:0.12,lp:800});},
  bolha(t){osc({t,f:vr(520),f1:1150,d:0.09,v:0.2});osc({t:t+0.05,f:900,f1:1500,d:0.06,v:0.08});},
  /* cartas */
  pega(t){nz({t,ty:'bandpass',f:2800,f1:5200,q:0.8,d:0.08,v:0.27,a:0.01});osc({t,f:vr(620),f1:980,d:0.08,v:0.25});},
  solta(t){nz({t,ty:'bandpass',f:4200,f1:2000,q:0.8,d:0.07,v:0.22});osc({t,f:820,f1:520,d:0.07,v:0.2});},
  compra(t){nz({t,ty:'bandpass',f:1800,f1:4800,q:0.9,d:0.1,v:0.26,a:0.025});},
  deal(t,i){nz({t,ty:'bandpass',f:vr(3400,0.1),q:1,d:0.06,v:0.28,a:0.004});osc({t,f:1100+(i||0)*55,d:0.03,v:0.08});},
  play(t,o){
    o=o||{};const rv=o.P==='r'?0.9:1;
    osc({t,f:vr(175)*rv,f1:52,d:0.17,v:0.55});nz({t,ty:'lowpass',f:2200,f1:400,d:0.08,v:0.32});nz({t,ty:'bandpass',f:1300,d:0.03,v:0.25});
    const r=RAR_N[o.rar]||0;if(r>=2)brilhos(t+0.06,[84,88,91,96].slice(0,r),0.05,0.06,0.5);
    if(o.id&&VOZ[o.id]){VOZ[o.id](t+0.07,rv);if(o.grito)VOZ[o.id](t+0.075,rv*1.003);} // Grito: a voz sai mais forte (duas camadas)
  },
  build(t,o){
    o=o||{};
    for(const dt of [0,0.13]){osc({t:t+dt,f:330,f1:170,d:0.07,v:0.4});nz({t:t+dt,ty:'bandpass',f:900,q:3,d:0.05,v:0.3});}
    if(o.id&&VOZ[o.id])VOZ[o.id](t+0.25,o.P==='r'?0.9:1);
  },
  spell(t){nz({t,ty:'bandpass',f:600,f1:3600,q:2,d:0.36,v:0.4,a:0.05,dest:SW});osc({t,f:520,f1:1560,d:0.26,v:0.16,dest:SW});brilhos(t+0.18,[86,91],0.06,0.09,0.4);},
  magia(t,k){
    if(k==='graos'){for(let i=0;i<16;i++)nz({t:t+i*0.024+Math.random()*0.02,ty:'bandpass',f:vr(4800,0.25),q:4,d:0.02,v:0.32});osc({t,f:880,f1:1320,d:0.15,v:0.1});}
    else if(k==='lama'){nz({t,ty:'lowpass',f:700,f1:150,d:0.38,v:0.45});vozBolhas(t,4);}
    else if(k==='vento'){nz({t,ty:'bandpass',f:500,f1:1800,q:3,d:0.5,v:0.45,a:0.15});nz({t:t+0.28,ty:'bandpass',f:1800,f1:700,q:3,d:0.45,v:0.3,a:0.05});}
    else brilhos(t,[84,88,91,96],0.06,0.09,0.45);
  },
  energia(t){osc({t,f:500,f1:1000,d:0.09,v:0.2,dest:SW});osc({t:t+0.08,f:750,f1:1500,d:0.1,v:0.18,dest:SW});},
  /* combate */
  ataque(t){nz({t,ty:'bandpass',f:650,f1:2300,q:1.4,d:0.16,v:0.55,a:0.04});osc({t,w:'triangle',f:210,f1:120,d:0.12,v:0.14});},
  hit(t,o){
    o=o||{};const forte=(o.n||1)>=3;
    osc({t,f:vr(155,0.08),f1:50,d:forte?0.24:0.15,v:forte?0.75:0.6});nz({t,ty:'lowpass',f:3200,f1:600,d:0.07,v:0.42});osc({t,w:'square',f:92,d:0.04,v:0.08,lp:600});
    if(forte)nz({t:t+0.01,ty:'bandpass',f:1500,q:0.7,d:0.13,v:0.3});
    if(o.thorn)sino(t,2600,0.15,0.06);
  },
  block(t){sino(t,1250,0.3,0.28);nz({t,ty:'highpass',f:3000,d:0.03,v:0.26});osc({t,w:'square',f:620,d:0.03,v:0.05});},
  heal(t){osc({t,f:660,f1:990,d:0.2,v:0.14,dest:SW});brilhos(t+0.04,[88,91,96],0.05,0.06,0.35);},
  buff(t){osc({t,w:'square',f:330,f1:660,d:0.14,v:0.1,lp:2400});osc({t:t+0.07,f:660,f1:1320,d:0.12,v:0.18,dest:SW});},
  debuff(t){osc({t,w:'triangle',f:600,f1:240,d:0.22,v:0.2});osc({t,f:300,f1:150,d:0.2,v:0.15});},
  heroHit(t,o){
    o=o||{};
    if(o.P==='p'){osc({t,f:92,f1:30,d:0.45,v:0.85});nz({t,ty:'lowpass',f:1300,f1:150,d:0.35,v:0.5});osc({t,w:'sawtooth',f:70,f1:55,d:0.25,v:0.09,lp:400});osc({t:t+0.05,w:'triangle',f:233,d:0.4,v:0.07});osc({t:t+0.05,w:'triangle',f:247,d:0.4,v:0.07});}
    else{osc({t,f:125,f1:40,d:0.3,v:0.8});nz({t,ty:'lowpass',f:2600,f1:300,d:0.2,v:0.45});sino(t+0.02,1760,0.3,0.1);}
  },
  death(t){nz({t,ty:'bandpass',f:1500,f1:300,q:0.8,d:0.36,v:0.36,a:0.01});osc({t,w:'triangle',f:700,f1:160,d:0.3,v:0.2});osc({t:t+0.2,f:220,f1:90,d:0.12,v:0.25});},
  destroi(t){nz({t,ty:'lowpass',f:3000,f1:200,d:0.6,v:0.55});osc({t,f:100,f1:40,d:0.4,v:0.45});for(const dt of [0.05,0.12,0.21])nz({t:t+dt,ty:'bandpass',f:vr(900,0.2),q:4,d:0.04,v:0.3});},
  seuTurno(t){sino(t,mf(79),0.6,0.14);sino(t+0.12,mf(84),0.9,0.16);},
  turnoRival(t){sino(t,mf(76),0.5,0.1);sino(t+0.12,mf(71),0.6,0.1);},
  banner(t,k){
    if(k==='colheita'){rufar(t,0.5,0.08,0.3);[0,0.7].forEach(dt=>{sino(t+0.55+dt,mf(45),2.2,0.2);osc({t:t+0.55+dt,f:mf(33),d:1.6,v:0.18,a:0.004})});vozCoruja(t+1.6,1);} // Meia-Noite: badaladas + coruja
    else if(k==='ultima'){rufar(t,0.6,0.08,0.35);[nm('A4'),nm('C5'),nm('E5'),nm('A5')].forEach(m=>metais(t+0.62,m,0.6,0.06));pratos(t+0.62,0.9,0.15);}
    else{SFX.compra(t);SFX.compra(t+0.12);sino(t+0.26,mf(84),0.5,0.14);}
  },
  victory(t){
    const mel=[['G4',0,0.11],['C5',0.11,0.11],['E5',0.22,0.11],['G5',0.33,0.22],['E5',0.55,0.11],['G5',0.66,0.9]];
    for(const [n,dt,d] of mel){rabeca(t+dt,nm(n),d,0.13,SW);pifano(t+dt,nm(n)+12,d,0.04,SW);}
    for(const [n,dt] of [['C4',0.66],['E4',0.66],['G4',0.66]])metais(t+dt,nm(n),0.9,0.045);
    for(const dt of [0,0.33,0.44,0.66])zab(t+dt,0.45,SB);
    for(let i=0;i<8;i++)tri(t+i*0.11,i%2===1,0.05,SB);
    pratos(t+0.66,1.2,0.12);brilhos(t+0.8,[91,96,100,103],0.06,0.06,0.6);
  },
  defeat(t){
    const mel=[['G4',0,0.32],['F#4',0.36,0.32],['F4',0.72,0.32]];
    for(const [n,dt,d] of mel)metais(t+dt,nm(n),d,0.09);
    osc({t:t+1.08,w:'sawtooth',f:mf(nm('E4')),f1:mf(nm('E4'))*0.9,fd:1.0,d:1.1,v:0.1,lp:1100,a:0.03,h:0.6,vib:[5,40,0.3],dest:SW});
    zab(t+1.08,0.4,SB);
  },
  empate(t){['C5','E5','G5'].forEach(n=>rabeca(t,nm(n),0.3,0.07,SW));['A4','D5','F5'].forEach(n=>rabeca(t+0.35,nm(n),0.5,0.07,SW));},
  /* moedas, prêmios */
  coin(t){const k=vr(1,0.03);osc({t,w:'square',f:988*k,d:0.07,v:0.13,lp:5000});osc({t:t+0.07,w:'square',f:1319*k,d:0.28,v:0.13,lp:5000});},
  moedas(t,n){n=n||6;const esc=[88,91,93,95,98,100];for(let i=0;i<n;i++){const tt=t+i*0.065+Math.random()*0.02,f=mf(esc[Math.floor(Math.random()*esc.length)]);osc({t:tt,w:'square',f,d:0.12,v:0.07,lp:5000});sino(tt,f*2,0.2,0.04);}},
  caixa(t){nz({t,ty:'highpass',f:2200,d:0.05,v:0.22});osc({t,w:'square',f:420,d:0.04,v:0.06,lp:1500});sino(t+0.06,2637,0.7,0.16);sino(t+0.06,3520,0.6,0.09);},
  /* v10: vintém caindo na fogueira: tilintar de metal + estalos de brasa + sopro do fogo */
  burn(t){sino(t,2350,0.35,0.14);osc({t,w:'square',f:1760,d:0.03,v:0.05,lp:5000});sino(t+0.09,2900,0.25,0.07);
    nz({t:t+0.1,ty:'lowpass',f:250,f1:900,q:1.2,d:0.7,v:0.32,a:0.15});for(let i=0;i<10;i++)nz({t:t+0.12+Math.random()*0.6,ty:'bandpass',f:vr(3000,0.3),q:3,d:0.02,v:0.3});osc({t:t+0.1,f:160,f1:70,d:0.4,v:0.14});},
  /* v10: virar página do Livro de Causos (papel) */
  pagina(t){nz({t,ty:'bandpass',f:1200,f1:4200,q:0.7,d:0.22,v:0.3,a:0.06});nz({t:t+0.16,ty:'highpass',f:2500,d:0.06,v:0.16});osc({t:t+0.2,f:220,f1:150,d:0.05,v:0.06});},
  /* v10: carimbo de xilogravura (tum seco de madeira) */
  carimbo(t){osc({t,f:150,f1:55,d:0.16,v:0.6});nz({t,ty:'lowpass',f:1500,f1:300,d:0.08,v:0.4});nz({t,ty:'bandpass',f:700,q:3,d:0.05,v:0.28});osc({t,w:'triangle',f:320,f1:240,d:0.06,v:0.08});},
  /* v10: construção da Vila subindo (tábuas que estalam + brilho) */
  construir(t){for(let i=0;i<4;i++){osc({t:t+i*0.09,f:vr(260+i*40,0.05),f1:140,d:0.07,v:0.32});nz({t:t+i*0.09,ty:'bandpass',f:vr(1100,0.2),q:3,d:0.04,v:0.24});}
    osc({t:t+0.4,f:520,f1:1040,d:0.12,v:0.12,dest:SW});brilhos(t+0.45,[84,88,91],0.05,0.06,0.45);},
  /* v10: moeda de fogo (brasa-moeda): tilintar quente + sopro de chama subindo */
  moedaFogo(t){const k=vr(1,0.03);sino(t,1568*k,0.3,0.22);osc({t,w:'square',f:1175*k,d:0.05,v:0.14,lp:4000});
    nz({t:t+0.03,ty:'bandpass',f:400,f1:1600,q:1,d:0.3,v:0.45,a:0.08});for(let i=0;i<4;i++)nz({t:t+0.08+Math.random()*0.25,ty:'bandpass',f:vr(3200,0.3),q:3,d:0.02,v:0.4});},
  /* v10: ascensão de carta: rabeca sobe em arpejo, sinos e um brilho longo */
  ascensao(t){[62,66,69,74].forEach((m,i)=>rabeca(t+i*0.11,m,0.2+(i===3?0.5:0),0.13,SW));
    sino(t+0.44,mf(98),1.2,0.08);sino(t+0.5,mf(102),1,0.05);nz({t:t+0.4,ty:'highpass',f:5000,f1:9000,d:0.8,v:0.08,a:0.3,dest:SW});brilhos(t+0.5,[98,102,105,110],0.06,0.05,0.5);},
  /* v10: emote (balãozinho de fala): pop curto + piado */
  emote(t){osc({t,f:420,f1:880,d:0.06,v:0.45});nz({t,ty:'bandpass',f:2400,q:2,d:0.03,v:0.25});osc({t:t+0.07,w:'triangle',f:vr(1320,0.05),f1:1760,d:0.08,v:0.2,dest:SW});},
  forja(t){sino(t,1480,0.5,0.16);sino(t,2210,0.4,0.08);nz({t,ty:'highpass',f:2500,d:0.04,v:0.25});brilhos(t+0.12,[96,100,103],0.05,0.05,0.4);},
  levelup(t){
    [72,76,79,84,88,91].forEach((m,i)=>osc({t:t+i*0.07,w:'square',f:mf(m),d:0.12,v:0.08,lp:3200,dest:SW}));
    [79,84,88].forEach(m=>metais(t+0.44,m,0.5,0.04));brilhos(t+0.46,[96,100,103,108],0.05,0.05,0.5);
  },
  missao(t){osc({t,f:140,f1:60,d:0.12,v:0.45});nz({t,ty:'lowpass',f:1500,d:0.05,v:0.3});[84,88,91].forEach(m=>sino(t+0.12,mf(m),0.8,0.09));SFX.moedas(t+0.2,4);},
  trofeu(t,up){if(up)brilhos(t,[79,84,88,91],0.07,0.09,0.6);else[76,72,67].forEach((m,i)=>osc({t:t+i*0.12,w:'triangle',f:mf(m),d:0.25,v:0.12}));},
  bauGanho(t){osc({t,f:120,f1:60,d:0.22,v:0.5});nz({t,ty:'lowpass',f:800,d:0.1,v:0.3});brilhos(t+0.08,[88,91,96],0.05,0.06,0.45);},
  destrancar(t){nz({t,ty:'bandpass',f:3200,q:6,d:0.03,v:0.3});nz({t:t+0.12,ty:'bandpass',f:2100,q:4,d:0.03,v:0.3});osc({t:t+0.12,w:'square',f:1800,d:0.02,v:0.06});sino(t+0.22,mf(84),0.4,0.1);},
  bauPronto(t){sino(t,mf(88),0.5,0.15);sino(t+0.15,mf(93),0.8,0.15);},
  bauAbre(t){
    osc({t,w:'sawtooth',f:85,f1:150,d:0.45,v:0.1,bp:700,q:4,vib:[18,40],dest:SW});
    osc({t:t+0.32,f:110,f1:50,d:0.22,v:0.45});nz({t:t+0.32,ty:'lowpass',f:900,d:0.08,v:0.25});
    SFX.chord(t+0.3);
  },
  /* pacote */
  entra(t){nz({t,ty:'bandpass',f:400,f1:1800,q:1,d:0.35,v:0.22,a:0.12});osc({t:t+0.3,f:150,f1:70,d:0.15,v:0.3});},
  crack(t,i){
    i=clamp(i||0,0,2);
    for(let k=0;k<6+i*4;k++)nz({t:t+Math.random()*0.13,ty:'bandpass',f:vr(4200,0.25),q:2,d:0.02,v:0.26+i*0.05});
    osc({t,f:[420,560,760][i],f1:[500,690,980][i],d:0.2,v:0.22+i*0.05,dest:SW});
    osc({t,f:160,f1:60,d:0.13,v:0.3+i*0.1});
  },
  tear(t){for(let k=0;k<16;k++)nz({t:t+k*0.022,ty:'bandpass',f:2400+k*160,q:1.5,d:0.025,v:0.3});nz({t,ty:'highpass',f:1500,f1:5500,d:0.4,v:0.2,a:0.03});},
  whoosh(t){nz({t,ty:'bandpass',f:300,f1:3200,q:0.9,d:0.45,v:0.4,a:0.07,dest:SW});osc({t,f:80,f1:38,d:0.5,v:0.5});},
  chord(t){for(const m of [72,76,79,84])osc({t,w:'triangle',f:mf(m),d:1.3,v:0.06,a:0.05,h:0.3,dest:SW});brilhos(t+0.05,[96,100,103,108],0.05,0.05,0.6);},
  luz(t,k){sino(t,mf(76+(k||0)*4),0.4,0.22);},
  flip(t){nz({t,ty:'highpass',f:3000,d:0.04,v:0.4});osc({t,w:'triangle',f:900,f1:1450,d:0.05,v:0.18});},
  nova(t){osc({t,f:700,f1:1400,d:0.08,v:0.15});sino(t+0.07,mf(96),0.35,0.08);},
  stinger(t,r){
    if(r==='incomum'){sino(t,mf(84),0.5,0.16);sino(t+0.08,mf(91),0.6,0.16);}
    else if(r==='rara'){brilhos(t,[84,88,91,96],0.07,0.17,0.8);nz({t,ty:'highpass',f:6500,d:0.5,v:0.05,a:0.05,dest:SW});}
    else if(r==='epica'){
      for(const m of [68,72,75,79])osc({t,w:'triangle',f:mf(m),d:1.5,v:0.07,a:0.15,h:0.4,dest:SW});
      for(const m of [68,75])osc({t,w:'sawtooth',f:mf(m),d:1.4,v:0.025,lp:1600,a:0.2,h:0.4,dest:SW});
      SFX.whoosh(t);brilhos(t+0.2,[103,100,96,91,87,84],0.06,0.09,0.7);
    }
    else if(r==='lendaria'){
      [48,55,60,64,67].forEach(m=>metais(t,m,1.5,0.05));coro(t+0.1,[72,76,79],2.0,0.06);
      pratos(t,1.6,0.2);zab(t,0.6,SB);brilhos(t+0.3,[96,100,103,108],0.07,0.08,0.8);
    }
    else{osc({t,w:'triangle',f:mf(84),d:0.25,v:0.26});sino(t,mf(84),0.3,0.08);}
  },
  rise(t){
    nz({t,ty:'bandpass',f:300,f1:4200,q:2,d:1.3,v:0.32,a:1.1,dest:SW});
    osc({t,w:'sawtooth',f:110,f1:440,d:1.3,v:0.07,lp:1500,a:1.1});
    for(let k=0;k<15;k++)osc({t:t+k*0.08,f:76,d:0.15,v:0.08+k*0.025});
  },
  fanfare(t){
    const mel=[['G4',0,0.12],['C5',0.12,0.12],['E5',0.24,0.12],['G5',0.36,0.2],['E5',0.58,0.12],['G5',0.7,1.2]];
    for(const [n,dt,d] of mel)metais(t+dt,nm(n),d,0.075);
    [60,64,67].forEach(m=>metais(t+0.7,m,1.2,0.04));coro(t+0.7,[72,76,79],1.6,0.05);
    pratos(t+0.7,1.6,0.18);for(const dt of [0,0.36,0.58,0.7])zab(t+dt,0.5,SB);
    brilhos(t+0.8,[96,100,103,108,103,108],0.08,0.06,0.7);
  }
};
/* tabuleiro: invocação por raridade, golpes e impactos por estilo de ataque, quebra, combo */
Object.assign(SFX,{
  conjurar(t,o){
    o=o||{};const r=RAR_N[o.rar]||0,rv=o.P==='r'?0.9:1;
    if(r>=4){nz({t,ty:'bandpass',f:300,f1:3800,q:1.6,d:0.6,v:0.2,a:0.45,dest:SW});coro(t+0.05,[67,71,74],0.75,0.035);osc({t,w:'sawtooth',f:110*rv,f1:330*rv,d:0.6,v:0.05,lp:1400,a:0.4});}
    else if(r===3){nz({t,ty:'bandpass',f:500,f1:2200,q:2.5,d:0.45,v:0.22,a:0.2,dest:SW});osc({t,w:'triangle',f:180*rv,f1:420*rv,d:0.45,v:0.1,a:0.2,vib:[11,60]});}
    else{osc({t,f:420*rv,f1:1260*rv,d:0.4,v:0.08,a:0.15,dest:SW});nz({t,ty:'highpass',f:5200,d:0.4,v:0.05,a:0.2,dest:SW});}
  },
  invocar(t,o){
    o=typeof o==='string'?{rar:o}:(o||{});const r=RAR_N[o.rar]||0,rv=o.P==='r'?0.88:1;
    osc({t,f:vr(130)*rv,f1:44,d:0.2,v:0.42});nz({t,ty:'lowpass',f:1100,f1:200,d:0.16,v:0.26});
    if(r>=1)sino(t+0.02,mf(88)*rv,0.4,0.06);
    if(r>=2)brilhos(t+0.03,[84,88,91,96].slice(0,r),0.045,0.055,0.5);
    if(r>=3){osc({t,f:72,f1:34,d:0.5,v:0.38});nz({t,ty:'bandpass',f:2400,f1:400,q:0.8,d:0.4,v:0.16});}
    if(r>=4){[48,55,60,64].forEach(m=>metais(t,m,0.75,0.032));pratos(t,0.9,0.1);zab(t,0.45,SB);brilhos(t+0.12,[96,100,103,108],0.05,0.05,0.7);}
  },
  golpe(t,e){
    if(e==='garra'||e==='bicada'){nz({t,ty:'bandpass',f:1200,f1:4200,q:1.4,d:0.12,v:0.32,a:0.03});}
    else if(e==='chifrada'||e==='investida'){nz({t,ty:'bandpass',f:380,f1:1500,q:1.2,d:0.2,v:0.42,a:0.06});osc({t,w:'triangle',f:160,f1:90,d:0.16,v:0.12});}
    else if(e==='ferrao'){osc({t,w:'sawtooth',f:520,f1:900,d:0.16,v:0.05,bp:1400,q:2,vib:[30,60]});nz({t,ty:'highpass',f:3000,d:0.12,v:0.12,a:0.04});}
    else if(e==='pipoca'){for(let i=0;i<3;i++){nz({t:t+i*0.05,ty:'bandpass',f:vr(2000,0.2),q:3,d:0.03,v:0.28});osc({t:t+i*0.05,f:vr(700,0.2),f1:300,d:0.04,v:0.08});}}
    else if(e==='raio'){osc({t,w:'sawtooth',f:1800,f1:240,d:0.16,v:0.07,lp:5000});nz({t,ty:'highpass',f:4000,d:0.14,v:0.16});}
    else{osc({t,f:300,f1:620,d:0.12,v:0.12});nz({t,ty:'lowpass',f:1200,d:0.1,v:0.12});}
  },
  impacto(t,e){
    if(e==='garra'){for(let i=0;i<3;i++)nz({t:t+i*0.035,ty:'bandpass',f:vr(3200,0.15),f1:1400,q:2,d:0.05,v:0.26});}
    else if(e==='bicada'){osc({t,w:'square',f:1250,f1:800,d:0.03,v:0.06,lp:4000});nz({t,ty:'highpass',f:2600,d:0.03,v:0.22});}
    else if(e==='chifrada'){osc({t,f:95,f1:38,d:0.22,v:0.5});nz({t,ty:'lowpass',f:700,f1:140,d:0.18,v:0.32});}
    else if(e==='investida'){osc({t,f:130,f1:55,d:0.15,v:0.38});nz({t,ty:'lowpass',f:1400,d:0.08,v:0.22});}
    else if(e==='ferrao'){nz({t,ty:'bandpass',f:5200,q:4,d:0.02,v:0.3});osc({t,f:900,f1:400,d:0.05,v:0.08});}
    else if(e==='pipoca'){vozPipoca(t,5,0.18);}
    else if(e==='raio'){for(let i=0;i<5;i++)nz({t:t+i*0.025,ty:'highpass',f:3500,d:0.02,v:0.2});osc({t,w:'square',f:160,f1:60,d:0.1,v:0.06,lp:900});}
    else{nz({t,ty:'lowpass',f:900,f1:180,d:0.22,v:0.34});vozBolhas(t+0.04,2);}
  },
  quebra(t){
    for(let i=0;i<9;i++)nz({t:t+i*0.022+Math.random()*0.012,ty:'bandpass',f:vr(4600,0.3),q:4,d:0.02,v:0.22});
    [88,84,79,76].forEach((m,i)=>osc({t:t+0.03+i*0.05,w:'square',f:mf(m),d:0.05,v:0.035,lp:4200}));
  },
  combo(t){ // dupla: arpejo maior subindo (C5 E5 G5 C6) + palma + brilhos
    osc({t,w:'sawtooth',f:180,f1:540,d:0.3,v:0.05,lp:2200,a:0.05});
    [72,76,79,84].forEach((m,i)=>{osc({t:t+i*0.08,w:'square',f:mf(m),d:0.12,v:0.07,lp:4200});sino(t+i*0.08,mf(m+12),0.3,0.05);});
    nz({t:t+0.34,ty:'bandpass',f:1800,q:1.2,d:0.06,v:0.4});nz({t:t+0.36,ty:'bandpass',f:1800,q:1.2,d:0.05,v:0.25});
    brilhos(t+0.38,[91,96,100,103],0.045,0.07,0.5);
    [67,74,79].forEach(m=>metais(t+0.34,m,0.4,0.03));
  },
  /* v4 */
  familia(t,o){o=o||{};const base={aves:84,bichinhos:86,brejeiros:79,rebanho:77,roca:81,sitio:83}[o.fam]||84;const n=(o.nivel||1)>=2?3:2;
    for(let i=0;i<n;i++)sino(t+i*0.11,mf(base+[0,4,7][i]),0.6,0.1);},
  sequencia(t,o){o=o||{};const x=o.x||3,k=Math.pow(2,(x-3)*2/12);zab(t,0.5,SB);[60,64,67].forEach(m=>metais(t+0.04,m+(x-3)*2,0.3,0.05));brilhos(t+0.1,[84,88,91].map(m=>m+(x-3)*2),0.05,0.07*k,0.4);},
  regra(t){rufar(t,0.4,0.06,0.26);sino(t+0.44,mf(84),0.9,0.16);sino(t+0.56,mf(91),0.9,0.1);},
  grito(t,o){nz({t,ty:'bandpass',f:700,f1:2000,q:1.5,d:0.25,v:0.18,a:0.03,dest:SW});osc({t,w:'triangle',f:330,f1:660,d:0.2,v:0.08,dest:SW});},
  ninhada(t,o){o=o||{};nz({t,ty:'bandpass',f:2500,q:3,d:0.03,v:0.25});nz({t:t+0.05,ty:'bandpass',f:3200,q:3,d:0.025,v:0.2});
    const f=o.ficha;if(f==='zangao')vozZum(t+0.1,1.4,0.2,0.12);else if(f==='girino')vozBolhas(t+0.08,2);else vozPiu(t+0.1,1.5,1);},
  acorda(t){vozGalo(t,1.1);brilhos(t+0.1,[84,88,91],0.05,0.06,0.4);},
  raiz(t,on){if(on){vozMadeira(t,1.1,0.4);vozFolhas(t+0.1,0.3,0.1);}else{vozFolhas(t,0.25,0.08);osc({t,w:'triangle',f:500,f1:250,d:0.2,v:0.08});}},
  guarda(t){vozLatido(t,1.15);nz({t:t+0.05,ty:'bandpass',f:400,f1:1400,q:1,d:0.15,v:0.25,a:0.03});},
  reduz(t){sino(t,1250,0.2,0.12);nz({t,ty:'highpass',f:3000,d:0.03,v:0.12});},
  festa(t){zab(t,0.4,SB);tri(t+0.08,false,0.08);tri(t+0.18,true,0.06);brilhos(t+0.1,[88,91,96],0.05,0.06,0.4);},
  lua(t){brilhos(t,[91,95,98],0.08,0.06,0.6);osc({t,w:'triangle',f:mf(67),d:0.6,v:0.05,a:0.1,dest:SW});},
  torneio(t){[nm('G4'),nm('C5'),nm('E5'),nm('G5')].forEach((m,i)=>metais(t+i*0.1,m,i===3?0.5:0.1,0.06));zab(t,0.4,SB);zab(t+0.3,0.4,SB);pratos(t+0.3,0.6,0.1);},
  campeao(t){rufar(t,0.5,0.06,0.3);const mel=[['C5',0.5,0.12],['E5',0.62,0.12],['G5',0.74,0.12],['C6',0.86,0.6]];for(const [n,dt,d] of mel)metais(t+dt,nm(n),d,0.075);
    [60,64,67].forEach(m=>metais(t+0.86,m,1.0,0.04));pratos(t+0.86,1.2,0.16);brilhos(t+1,[96,100,103,108],0.07,0.06,0.6);}
});
const GAP={pagina:0.12,carimbo:0.1,construir:0.3,moedaFogo:0.06,ascensao:0.5,emote:0.15,familia:0.25,sequencia:0.2,regra:0.5,reduz:0.08,invocar:0.08,conjurar:0.15,golpe:0.04,impacto:0.04,quebra:0.06,combo:0.2,tap:0.03,hit:0.06,coin:0.05,deal:0.03,flip:0.05,luz:0.1,heroHit:0.12,death:0.08,play:0.1,stinger:0.12,buff:0.05,heal:0.05,moedas:0.15,bolha:0.1,erro:0.15,compra:0.08};
function sfx(nome,a){
  if(!AC||(s&&s.mudo)||document.hidden)return;
  if(AC.state!=='running'){try{const p=AC.resume();if(p&&p.catch)p.catch(()=>{});}catch(e){}}
  const f=SFX[nome];if(!f)return;
  const agora=AC.currentTime+0.01;const t=Math.max(agora,SND.next[nome]||0);
  if(t-agora>0.35)return; // fila cheia: este pula
  SND.next[nome]=t+(GAP[nome]||0.025);
  try{f(t,a);}catch(e){}
}

/* ---------- música v10 (spec §11.1): "Toada do Candeeiro" (fazenda) e "Peleja" (arena) ----------
   modal nordestino: rabeca e pífano na melodia, bordão no grave, zabumba, triângulo, ganzá e caixa; viola no acompanhamento. */
/* rabeca: duas serras ±6 cents, passa-banda 1300 Hz Q 1.2, ataque 40 ms, vibrato 5,5 Hz ±18 cents depois de 120 ms, arco de ruído em 2,5 kHz */
function rabeca(t,m,d,v,dest){
  const f=mf(m),bp=filtro('bandpass',1300,1.2,t),lp=filtro('lowpass',Math.min(6000,f*7),0.7,t),g=AC.createGain(),fim=t+d;
  bp.connect(lp);lp.connect(g);g.connect(dest||MB);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+0.04);g.gain.setValueAtTime(v*0.86,Math.max(t+0.05,fim-0.05));g.gain.linearRampToValueAtTime(0,fim+0.06);
  let lg=null;
  if(d>0.15){const l=AC.createOscillator();lg=AC.createGain();l.frequency.value=5.5;lg.gain.setValueAtTime(0,t+0.12);lg.gain.linearRampToValueAtTime(18,t+0.3);l.connect(lg);l.start(t);l.stop(fim+0.12);}
  for(const dt of [-6,6]){const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=dt;if(lg)lg.connect(o.detune);o.connect(bp);o.start(t);o.stop(fim+0.12);}
  nz({t,ty:'bandpass',f:2500,q:1.6,d:d+0.04,a:0.03,h:Math.max(0,d-0.1),v:v*0.1,dest:dest||MB});
}
/* bordão: dois triângulos uma oitava acima do outro, passa-baixa 500 Hz */
function bordao(t,m,d,v,dest){
  const f=mf(m),lp=filtro('lowpass',500,0.7,t),g=AC.createGain();lp.connect(g);g.connect(dest||MB);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+0.12);g.gain.setValueAtTime(v,t+Math.max(0.13,d-0.15));g.gain.linearRampToValueAtTime(0,t+d+0.12);
  for(const [k,a] of [[1,1],[2,0.55]]){const o=AC.createOscillator(),ga=AC.createGain();o.type='triangle';o.frequency.value=f*k;ga.gain.value=a;o.connect(ga);ga.connect(lp);o.start(t);o.stop(t+d+0.15);}
}
/* caixa (rufo de tarol): ruído em passa-banda 1,8 kHz */
function caixaR(t,v,dest){nz({t,ty:'bandpass',f:1800,q:1.1,d:0.06,v,dest:dest||MB});}
function gotaR(t,v){osc({t,f:vr(1500,0.1),f1:700,d:0.07,v,a:0.002,dest:MB});sino(t+0.01,vr(2600,0.08),0.25,v*0.35,MB);}
function fogosR(t,v){for(let i=0;i<7;i++)nz({t:t+Math.random()*0.3,ty:'highpass',f:vr(4200,0.3),d:0.02,v,dest:MB});osc({t,f:110,f1:45,d:0.3,v:v*0.8,dest:MB});}
const ACORDE={C:[0,4,7],F:[5,9,12],G:[7,11,14],G7:[7,11,14,17],Am:[9,12,16],Dm:[2,5,9],E:[4,8,11],Bb:[10,14,17],
  D:[2,6,9],A7:[9,13,16,19],Bm:[11,14,18],E7:[4,8,11,14],'F#m':[6,9,13],A:[9,13,16],'C#m':[1,4,8],B7:[11,15,18,21]};
function musFaixa(o){
  // melodia: "NOTA:passos" (16 passos por compasso, "-" é pausa)
  o.melP=o.mel.map(bar=>{const m={};let p=0;for(const tk of bar.split(' ')){const [n,l]=tk.split(':');if(n!=='-'&&p<16)m[p]=[nm(n),+l];p+=+l;}return m;});
  return o;
}
const MUSICAS={
  /* menu, Vila, Livro de Causos: 84 bpm, Ré mixolídio, calma e um pouco melancólica. Chamada (rabeca) e resposta (pífano 8ª acima) */
  fazenda:musFaixa({bpm:84,nome:'Toada do Candeeiro',
    prog:['D','D','C','D','G','G','A7','A7','D','D','C','D','Bm','G','A7','D'],
    mel:['F#5:3 E5:3 D5:2 E5:3 F#5:3 A5:2','G5:6 F#5:2 E5:8','E5:3 D5:3 C5:2 D5:3 E5:3 G5:2','F#5:8 -:4 A4:2 D5:2',
      'G5:3 F#5:3 E5:2 D5:3 B4:3 D5:2','B4:3 D5:3 G5:2 D5:8','C#5:3 E5:3 G5:2 E5:3 C#5:3 A4:2','E5:6 C#5:2 A4:4 -:2 A4:2',
      'A5:3 F#5:3 D5:2 F#5:3 A5:3 B5:2','C6:4 A5:4 D5:8','E5:3 G5:3 C5:2 E5:3 G5:3 E5:2','F#5:6 E5:2 D5:4 -:2 A4:2',
      'D5:3 F#5:3 B4:2 D5:3 F#5:3 A5:2','G5:6 F#5:2 D5:8','E5:3 C#5:3 A4:2 C#5:3 E5:3 G5:2','F#5:4 E5:4 D5:4 -:4'],
    zab:'X.......x.......',zabFim:'X.......x...x.x.',zabV:0.36,tri:null,viola:'arpejo',
    bord:()=>[[38,0.085]],
    lead:(loop,bar,I)=>{const resp=Math.floor(bar/2)%2===1;
      if(resp)return loop%2?[['p',12,0.06],['r',0,0.05]]:[['p',12,0.065]];
      return [['r',0,0.16]];},
    extra:(loop,bar,pos,t)=>{if(loop%4===3&&bar===15&&pos===8)vozCoruja(t,1,MB);}}),
  /* batalha: 128 bpm, Mi lídio-dominante (modo nordestino), baião */
  arena:musFaixa({bpm:128,nome:'Peleja',breu:true,
    prog:['E7','E7','D','E7','E7','E7','F#m','E7','A','A','D','E7','C#m','D','B7','E7'],
    mel:['E5:2 G#5:2 A#5:2 B5:2 A#5:2 G#5:2 E5:4','B5:3 A#5:3 G#5:2 F#5:2 E5:2 D5:4','D5:2 F#5:2 A5:4 F#5:2 E5:2 D5:4','E5:2 G#5:2 A#5:2 B5:2 D6:4 B5:4',
      'E5:2 G#5:2 A#5:2 B5:2 C#6:2 B5:2 A#5:2 G#5:2','B5:4 G#5:4 E5:8','F#5:2 A5:2 C#6:2 A5:2 F#5:2 E5:2 C#5:4','D5:2 E5:2 G#5:2 A#5:2 B5:8',
      'A5:3 C#6:3 E6:2 C#6:3 A5:3 E5:2','C#6:6 B5:2 A5:8','F#5:3 A5:3 D6:2 A5:3 F#5:3 D5:2','E5:2 G#5:2 B5:2 D6:2 B5:8',
      'C#6:3 B5:3 G#5:2 E5:3 G#5:3 C#6:2','D6:6 C#6:2 A5:8','B5:2 A5:2 F#5:2 D#5:2 F#5:2 A5:2 B5:4','G#5:4 A#5:2 B5:2 E5:8'],
    zab:'X..xX..xX..xX...',zabFim:'X..xX...XxxxXxXx',zabV:0.42,tri:'..o...o...o...o.',viola:'stab',stab:'..s...s...s...s.',baixo:true,
    bord:()=>[[40,0.045],[47,0.03]],
    lead:(loop,bar,I,A)=>{
      const tr=I>=2?-12:0,L=[];
      if(bar<8){L.push(['r',tr,0.09],['p',tr,0.04]);}
      else if(Math.floor(bar/2)%2===0){L.push(['r',tr,0.1]);if(A===1||A===5)L.push(['p',tr+12,0.025]);}
      else L.push(['p',tr,0.055]);
      if(A===4||A===5)L.push(['r',tr-12,0.045]);
      return L;},
    extra:(loop,bar,pos,t,I,A,spb)=>{
      if(I>=2&&bar%2===0&&pos===0)coro(t,[52,59,64],spb*32,0.03,MB);
      if((A===4||A===5)&&I<2&&bar%4===0&&pos===0)coro(t,[52,59],spb*64,0.018,MB);
      if((A===2||A===5)&&bar%2===1&&pos===12)for(let i=0;i<2;i++)osc({t:t+i*0.11,f:vr(2400,0.05),f1:3300,d:0.07,v:0.05,dest:MB});
      if((A===3||A===5)&&(pos===6||pos===14)&&Math.random()<0.6)gotaR(t,0.05);
      if(A===5&&I>=2&&pos%4===1&&Math.random()<0.25)fogosR(t,0.05);
    }})
};
function vozesAcorde(acc){return acc.slice(0,3).map(x=>{let n=60+x;while(n>67)n-=12;while(n<55)n+=12;return n;});}
/* cor de cada arena (a1..a5): musArena(n) escolhe; sem chamada, usa a arena da partida em curso */
function musArenaN(){if(MUS.arena)return MUS.arena;try{if(typeof B!=='undefined'&&B&&B.arena)return B.arena;}catch(e){}return 1;}
function musPasso(M,st,t,spb){
  const nb=M.prog.length,bar=Math.floor(st/16)%nb,pos=st%16,loop=Math.floor(st/(16*nb)),I=MUS.int,A=musArenaN();
  const acc=ACORDE[M.prog[bar]],raiz=36+(acc[0]%12),breu=M.breu&&I>=2;
  // percussão
  if(breu){
    if(pos===0)zab(t,0.4);
    if(pos===0||pos===2)osc({t,f:60,f1:42,d:0.2,v:pos?0.22:0.34,a:0.004,dest:MB}); // coração em 60 Hz no 1 e no "e" do 1
  }else{const z=(bar===nb-1?M.zabFim:M.zab)[pos];if(z==='X')zab(t,M.zabV);else if(z==='x')zab(t,M.zabV*0.62);}
  if(M.tri){if(breu){if(pos===8)tri(t,true,0.025);}else tri(t,M.tri[pos]==='o',M.tri[pos]==='o'?0.035:0.02);}
  if(I>=1&&M.breu){shk(t,pos%4===0?0.05:0.028);if(bar%4===3&&pos>=10)caixaR(t,0.05+(pos-10)*0.018);}
  // grave
  if(pos===0)for(const [m,v] of M.bord(bar))bordao(t,m,spb*16+0.05,v);
  if(M.baixo&&!breu){const bx={0:[0,3],3:[7,1],4:[0,3],8:[0,3],11:[7,1],12:[12,3]}[pos];if(bx)baixo(t,raiz+bx[0],bx[1]*spb*0.9,0.13);}
  if(M.baixo&&breu&&pos===0)baixo(t,raiz,spb*6,0.14);
  // viola
  const vs=vozesAcorde(acc);
  if(M.viola==='arpejo'){if(pos===0||pos===8)vs.concat([vs[0]+12]).forEach((m,i)=>viola(t+i*spb*0.5,[m],spb*6,0.045));}
  else if(M.stab[pos]==='s'&&!breu)viola(t,vs,spb*1.3,0.032);
  // melodia
  const ev=M.melP[bar][pos];
  if(ev)for(const [ins,tr,v] of M.lead(loop,bar,I,A)){const d=ev[1]*spb*0.94;if(ins==='p')pifano(t,ev[0]+tr,d,v);else rabeca(t,ev[0]+tr,d,v);}
  if(M.extra)M.extra(loop,bar,pos,t,I,A,spb);
}
function musTick(){
  if(!AC||!MUS.cur||AC.state!=='running')return;
  const M=MUSICAS[MUS.cur];if(!M)return;
  const spb=60/(M.bpm*(MUS.int>=1?1.05:1))/4;
  if(MUS.next<AC.currentTime-0.05)MUS.next=AC.currentTime+0.05; // a aba dormiu: retoma do agora
  while(MUS.next<AC.currentTime+0.2){try{musPasso(M,MUS.step,MUS.next,spb);}catch(e){}MUS.next+=spb;MUS.step++;}
}
function musTentar(){
  if(!AC||AC.state!=='running')return;
  const alvo=(s&&(s.mudo||s.semMusica))?null:MUS.want;
  if(alvo===MUS.cur)return;
  const t=AC.currentTime;
  try{MB.gain.cancelScheduledValues(t);MB.gain.setValueAtTime(MB.gain.value,t);MB.gain.linearRampToValueAtTime(0,t+0.35);}catch(e){}
  MUS.cur=alvo;MUS.step=0;MUS.next=t+0.4;
  if(alvo){try{MB.gain.linearRampToValueAtTime(MUS_VOL,t+0.9);}catch(e){}}
  if(!MUS.timer){MUS.timer=setInterval(musTick,40);if(window.__cgSnd)window.__cgSnd.timer=MUS.timer;}
}
function musica(nome){MUS.want=nome;if(nome!=='arena')MUS.int=0;musTentar();}
function musIntensa(n){MUS.int=n;}
function musArena(n){MUS.arena=n>=1&&n<=5?n|0:0;}
function musDuck(x){MUS.duck=x;if(AC&&MD)try{MD.gain.setTargetAtTime(x,AC.currentTime,0.15);}catch(e){}}


