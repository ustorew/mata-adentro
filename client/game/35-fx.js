/* ===================== FX: uma camada de canvas (partículas, anéis, feixes) + WAAPI nas cartas =====================
   API usada pela batalha (e por cartas/combos futuros). Tudo é seguro de chamar a qualquer hora:
   sem elemento, sem canvas ou com movimento reduzido, vira um fade curto ou nada.
     fxInvocar(P,lane,rar,opts) → Promise (fim do golpe principal: comum ≤450 ms, lendária ≤1300 ms)
     fxAtaque(P,lane,alvo,estilo[,opts]) → Promise (resolve no instante do impacto); alvo = {side,lane} | 'heroi'
     fxImpacto(el,n,opts) · fxMorte(el,terr) · fxCura(el,n) · fxBuff(el,txt) · fxBloqueio(el)
     fxCombo(P,lanes,nome,cor) → Promise · fxAura(P,lane,cor,on) · fxBanner(txt,tipo) → Promise · fxTremor(forca 0..3)
   Nunca usa o rnd() do jogo (que pode ter semente): só Math.random. */
const FX={cv:null,g:null,dpr:1,w:0,h:0,ps:[],obs:[],raf:0,last:0,auras:{},tre:null};
const FX_MAX=250;
const fxR=Math.random;
const fxOpp=P=>P==='p'?'r':'p';
const fxAgora=()=>performance.now();
const fxEsp=ms=>new Promise(r=>setTimeout(r,Math.max(0,ms)));
const fxEase={out:k=>1-(1-k)*(1-k),in:k=>k*k,io:k=>k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2,back:k=>{const c=1.7;return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2);}};
function fxLaneEl(P,i){return document.getElementById('ln-'+P+'-'+i);}
function fxPecaEl(P,i){const l=fxLaneEl(P,i);return l?l.querySelector('.card'):null;}
function fxHeroiEl(P){return P==='r'?(document.querySelector('#hR .pt')||document.getElementById('hR')):(document.querySelector('#hP .pt')||document.getElementById('bInfo'));}
/* v6: no campo a peça é um personagem (.unit) ou um prédio (.bs.has): o retângulo dos efeitos é só o CORPO
   (do alto da cabeça até os pés, y 60 de 64 no desenho), não os números nem o nome */
function fxEhCorpo(el){return !!(el&&el.classList&&(el.classList.contains('unit')||(el.classList.contains('bs')&&el.classList.contains('has'))));}
function fxCorpo(el){if(!fxEhCorpo(el))return el;return el.querySelector('.fig,.bfig')||el;}
function fxVis(el){if(!fxEhCorpo(el))return el;return el.querySelector('canvas.spr')||el;}
function fxRect(el){
  if(!el||!el.isConnected)return null;
  const corpo=fxEhCorpo(el),r=(corpo?fxCorpo(el):el).getBoundingClientRect();if(!r.width&&!r.height)return null;
  if(corpo){const l=r.left+r.width*0.15,rr=r.right-r.width*0.15,t=r.top+r.height*0.24,b=r.top+r.height*0.94;
    return {x:(l+rr)/2,y:(t+b)/2,w:rr-l,h:b-t,l,t,r:rr,b};}
  return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,l:r.left,t:r.top,r:r.right,b:r.bottom};
}
function fxTerr(el){const l=el&&el.closest?el.closest('.lane'):null;const m=l&&/terr-(\w+)/.exec(l.className);return m?m[1]:'pasto';}
function fxHex(c,a){if(!c||c[0]!=='#')return c;const n=parseInt(c.slice(1),16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${a==null?1:a})`;}
function fxRgb(c){const n=parseInt((c||'#ffffff').slice(1),16);return `${n>>16},${(n>>8)&255},${n&255}`;}

/* ---------- a camada de canvas ---------- */
function fxCanvas(){
  if(FX.cv&&FX.cv.isConnected&&FX.g)return true;
  try{
    const cv=document.createElement('canvas');cv.className='fxcv';cv.setAttribute('aria-hidden','true');
    document.body.appendChild(cv);FX.cv=cv;FX.g=cv.getContext('2d');fxTam();return !!FX.g;
  }catch(e){FX.cv=null;FX.g=null;return false;}
}
function fxTam(){
  if(!FX.cv)return;const d=Math.min(2,window.devicePixelRatio||1),w=window.innerWidth,h=window.innerHeight;
  FX.dpr=d;FX.w=w;FX.h=h;const W=Math.round(w*d),H=Math.round(h*d);
  if(FX.cv.width!==W)FX.cv.width=W;if(FX.cv.height!==H)FX.cv.height=H;
}
window.addEventListener('resize',()=>{if(FX.cv)fxTam();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){FX.ps.length=0;FX.obs.length=0;if(FX.raf)cancelAnimationFrame(FX.raf);FX.raf=0;fxApagar();}});
function fxApagar(){if(FX.g&&FX.cv){FX.g.setTransform(1,0,0,1,0,0);FX.g.clearRect(0,0,FX.cv.width,FX.cv.height);}}
function fxKick(){if(FX.raf||document.hidden||!fxCanvas())return;FX.last=fxAgora();FX.raf=requestAnimationFrame(fxLoop);}
/* partícula: {x,y,vx,vy,g(gravidade),drag,max(s),sz,sz1,c,k(tipo),rot,vr,a,add(aditivo),chao(y do chão p/ quicar),bal(balanço)} */
function fxP(o){
  if(RM||document.hidden)return null;
  if(FX.ps.length>=FX_MAX)FX.ps.splice(0,FX.ps.length-FX_MAX+1);
  o.t=-(o.atraso||0);o.max=o.max||0.6;o.vx=o.vx||0;o.vy=o.vy||0;o.g=o.g||0;o.drag=o.drag||0;o.sz=o.sz||3;o.a=o.a==null?1:o.a;o.rot=o.rot||0;o.vr=o.vr||0;
  FX.ps.push(o);fxKick();return o;
}
/* objeto (anel, feixe, runa, clarão...): {tipo, dur(ms), atraso(ms), ...} */
function fxO(o){if(RM||document.hidden)return null;o.t0=fxAgora()+(o.atraso||0);FX.obs.push(o);fxKick();return o;}
function fxLoop(now){
  FX.raf=0;const g=FX.g;if(!g||!FX.cv)return;
  const dt=Math.min(0.05,Math.max(0.001,(now-FX.last)/1000));FX.last=now;
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,FX.cv.width,FX.cv.height);
  g.setTransform(FX.dpr,0,0,FX.dpr,0,0);
  let vivos=0;
  for(let i=0;i<FX.obs.length;i++){
    const o=FX.obs[i];const k=(now-o.t0)/o.dur;
    if(k>=1){o.morto=true;if(o.fim){try{o.fim();}catch(e){}o.fim=null;}continue;}
    vivos++;if(k<0)continue;
    try{fxDesenhaO(g,o,k,now,dt);}catch(e){o.morto=true;}
    g.globalAlpha=1;g.globalCompositeOperation='source-over';
  }
  if(FX.obs.some(o=>o.morto))FX.obs=FX.obs.filter(o=>!o.morto);
  const ps=FX.ps;let w=0;
  for(let i=0;i<ps.length;i++){
    const p=ps[i];p.t+=dt;if(p.t>=p.max)continue;ps[w++]=p;if(p.t<0)continue;
    if(p.drag){const f=Math.max(0,1-p.drag*dt);p.vx*=f;p.vy*=f;}
    p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;
    if(p.chao!=null&&p.y>p.chao&&p.vy>0){p.y=p.chao;p.vy*=-0.38;p.vx*=0.6;if(Math.abs(p.vy)<30)p.vy=0;}
    fxDesenhaP(g,p);
  }
  ps.length=w;
  g.globalAlpha=1;g.globalCompositeOperation='source-over';
  fxFurarPilulas(g,now);
  if(ps.length||vivos)FX.raf=requestAnimationFrame(fxLoop);
  else fxApagar();
}
/* os números de ATK e vida das cartas no campo ficam sempre à vista: a poeira, a fumaça e o brilho passam por trás deles */
function fxFurarPilulas(g,now){
  if(!FX.stT||now-FX.stT>90||now<FX.stT){FX.stT=now;FX.stR=[];
    const bd=document.getElementById('board');
    if(bd&&bd.isConnected)for(const e of bd.querySelectorAll('.lane .card .st')){if(e.closest('.fx-pre'))continue;const r=e.getBoundingClientRect();if(r.width>0&&r.height>0)FX.stR.push(r);}}
  if(!FX.stR||!FX.stR.length)return;
  g.save();g.globalCompositeOperation='destination-out';g.globalAlpha=1;g.fillStyle='#000';g.beginPath();
  for(const r of FX.stR){const rr=Math.min(r.height,r.width)/2;if(g.roundRect)g.roundRect(r.left,r.top,r.width,r.height,rr);else g.rect(r.left+1,r.top+1,r.width-2,r.height-2);}
  g.fill();g.restore();
}
function fxDesenhaP(g,p){
  const k=p.t/p.max;let a=p.a*(k<0.7?1:1-(k-0.7)/0.3);if(p.fadeIn&&k<0.15)a*=k/0.15;
  if(a<=0.01)return;
  const sz=p.sz1!=null?p.sz+(p.sz1-p.sz)*k:p.sz;
  g.globalAlpha=a;g.globalCompositeOperation=p.add?'lighter':'source-over';
  let x=p.x,y=p.y;if(p.bal)x+=Math.sin(p.t*p.bal[0]+(p.bal[2]||0))*p.bal[1];
  switch(p.k){
    case 'glow':{const gr=g.createRadialGradient(x,y,0,x,y,sz);gr.addColorStop(0,p.c);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-sz,y-sz,sz*2,sz*2);break;}
    case 'puff':{g.fillStyle=p.c;g.beginPath();g.ellipse(x,y,sz,sz*0.62,0,0,6.283);g.fill();break;}
    case 'dot':{g.fillStyle=p.c;g.beginPath();g.arc(x,y,sz/2,0,6.283);g.fill();break;}
    case 'streak':{const len=p.len||Math.min(26,Math.hypot(p.vx,p.vy)*0.05);const n=Math.hypot(p.vx,p.vy)||1;g.strokeStyle=p.c;g.lineWidth=sz;g.lineCap='round';g.beginPath();g.moveTo(x,y);g.lineTo(x-p.vx/n*len,y-p.vy/n*len);g.stroke();break;}
    case 'star':{g.fillStyle=p.c;const s=sz*(p.pulsa?(0.6+0.4*Math.sin(p.t*18)):1);g.fillRect(x-s/2,y-0.75,s,1.5);g.fillRect(x-0.75,y-s/2,1.5,s);g.fillRect(x-1.25,y-1.25,2.5,2.5);break;}
    case 'plus':{g.fillStyle=p.c;g.fillRect(x-sz/2,y-sz/6,sz,sz/3);g.fillRect(x-sz/6,y-sz/2,sz/3,sz);break;}
    case 'chev':{g.strokeStyle=p.c;g.lineWidth=Math.max(2,sz/3);g.lineCap='square';g.beginPath();const d=p.baixo?-1:1;g.moveTo(x-sz/2,y+sz/4*d);g.lineTo(x,y-sz/4*d);g.lineTo(x+sz/2,y+sz/4*d);g.stroke();break;}
    case 'petal':{g.save();g.translate(x,y);g.rotate(p.rot);g.fillStyle=p.c;g.beginPath();g.ellipse(0,0,sz,sz*0.55,0,0,6.283);g.fill();if(p.c2){g.fillStyle=p.c2;g.fillRect(-sz*0.3,-0.5,sz*0.6,1);}g.restore();break;}
    case 'feather':{g.save();g.translate(x,y);g.rotate(p.rot);g.fillStyle=p.c;g.beginPath();g.ellipse(0,0,sz,sz*0.32,0,0,6.283);g.fill();g.fillStyle=p.c2||'rgba(0,0,0,.35)';g.fillRect(-sz,-0.4,sz*2,0.8);g.restore();break;}
    case 'blade':{g.save();g.translate(x,y);g.rotate(p.rot);g.fillStyle=p.c;g.fillRect(-1,-sz/2,2,sz);g.restore();break;}
    case 'drop':{g.fillStyle=p.c;g.beginPath();g.arc(x,y,sz/2,0,6.283);g.fill();g.fillStyle='rgba(255,255,255,.7)';g.fillRect(x-sz/4,y-sz/4,Math.max(1,sz/4),Math.max(1,sz/4));break;}
    case 'kernel':{g.save();g.translate(x,y);g.rotate(p.rot);g.fillStyle=p.c2||'#B9801C';g.fillRect(-sz/2,-sz/2,sz,sz);g.fillStyle=p.c;g.fillRect(-sz/2,-sz/2,sz-1,sz-1);g.fillStyle='rgba(255,255,255,.75)';g.fillRect(-sz/2,-sz/2,Math.max(1,sz/3),Math.max(1,sz/3));g.restore();break;}
    case 'pop':{g.fillStyle=p.c;const s=sz;g.beginPath();g.arc(x,y,s*0.5,0,6.283);g.arc(x+s*0.35,y-s*0.2,s*0.38,0,6.283);g.arc(x-s*0.3,y-s*0.25,s*0.34,0,6.283);g.fill();g.fillStyle=p.c2||'#F2C230';g.fillRect(x-1,y+s*0.15,2,2);break;}
    case 'txt':{ // letrinha (zZz, notas): contorno escuro + cor
      g.save();g.translate(x,y);if(p.rot)g.rotate(p.rot);g.font=`800 ${Math.round(sz)}px ${p.fonte||'"Fredoka","Nunito",sans-serif'}`;g.textAlign='center';g.textBaseline='middle';
      g.lineWidth=3;g.strokeStyle=p.c2||'rgba(20,14,30,.85)';g.strokeText(p.txt,0,0);g.fillStyle=p.c;g.fillText(p.txt,0,0);g.restore();break;}
    case 'nota':{ // nota musical em pixel
      g.save();g.translate(x,y);if(p.rot)g.rotate(p.rot);const s=sz/8;g.fillStyle=p.c2||'#1A1420';
      g.fillRect(-3*s,1*s,5*s,4*s);g.fillRect(1*s,-6*s,2*s,9*s);g.fillRect(2*s,-6*s,4*s,2*s);
      g.fillStyle=p.c;g.fillRect(-2*s,2*s,3*s,2*s);g.fillRect(1.5*s,-5.5*s,1*s,7*s);g.fillRect(2.5*s,-5.5*s,3*s,1*s);g.restore();break;}
    case 'ovo':{ // casquinha de ovo
      g.save();g.translate(x,y);g.rotate(p.rot);g.fillStyle=p.c;g.beginPath();g.moveTo(-sz/2,0);g.lineTo(0,-sz/2);g.lineTo(sz/2,0);g.lineTo(sz/4,sz/3);g.lineTo(-sz/4,sz/3);g.closePath();g.fill();g.restore();break;}
    default:{g.save();g.translate(x,y);if(p.rot)g.rotate(p.rot);g.fillStyle=p.c;g.fillRect(-sz/2,-sz/2,sz,sz);g.restore();}
  }
}
function fxDesenhaO(g,o,k,now,dt){
  const e=(o.ease&&fxEase[o.ease])||(x=>x);
  switch(o.tipo){
    case 'anel':{ // anel no chão (elipse achatada) ou de pé
      const kk=e(k),r=o.r0+(o.r1-o.r0)*kk,a=(o.a==null?1:o.a)*(1-k)*(k<0.1?k/0.1:1);
      g.globalAlpha=a;g.globalCompositeOperation=o.add===false?'source-over':'lighter';g.strokeStyle=o.c;g.lineWidth=Math.max(1,o.w*(1-k*0.6));
      g.beginPath();g.ellipse(o.x,o.y,Math.max(0.5,r),Math.max(0.5,r*(o.ry||1)),0,0,6.283);g.stroke();break;}
    case 'feixe':{ // coluna de luz que desce do alto
      const kin=Math.min(1,k/(o.kin||0.25)),kout=k>(o.kout||0.7)?(1-(k-(o.kout||0.7))/(1-(o.kout||0.7))):1;
      const w=(o.w0+(o.w-o.w0)*fxEase.out(kin))*(0.85+0.15*Math.sin(now/60));const y0=o.y0,y1=o.y0+(o.y1-o.y0)*fxEase.out(kin);
      g.globalCompositeOperation='lighter';g.globalAlpha=kout*(o.a||0.9);
      const gr=g.createLinearGradient(o.x-w/2,0,o.x+w/2,0);gr.addColorStop(0,`rgba(${o.rgb},0)`);gr.addColorStop(0.35,`rgba(${o.rgb},.55)`);gr.addColorStop(0.5,'rgba(255,255,255,.95)');gr.addColorStop(0.65,`rgba(${o.rgb},.55)`);gr.addColorStop(1,`rgba(${o.rgb},0)`);
      g.fillStyle=gr;g.fillRect(o.x-w/2,y0,w,y1-y0);
      const gb=g.createRadialGradient(o.x,y1,0,o.x,y1,w*0.9);gb.addColorStop(0,`rgba(${o.rgb},.8)`);gb.addColorStop(1,`rgba(${o.rgb},0)`);g.fillStyle=gb;g.beginPath();g.ellipse(o.x,y1,w*0.9,w*0.32,0,0,6.283);g.fill();break;}
    case 'runa':{ // círculo de invocação girando no chão
      const a=(k<0.2?k/0.2:k>0.75?(1-k)/0.25:1);const r=o.r*(0.7+0.3*fxEase.out(Math.min(1,k*2.5)));const rot=(now-o.t0)/1000*(o.vel||1.6);
      g.save();g.translate(o.x,o.y);g.scale(1,o.ry||0.42);g.globalCompositeOperation='lighter';g.globalAlpha=a;g.strokeStyle=o.c;g.lineWidth=2;
      g.beginPath();g.arc(0,0,r,0,6.283);g.stroke();g.lineWidth=1.2;g.beginPath();g.arc(0,0,r*0.72,0,6.283);g.stroke();
      g.rotate(rot);g.beginPath();for(let i=0;i<6;i++){const an=i/6*6.283,an2=(i+2)/6*6.283;g.moveTo(Math.cos(an)*r*0.72,Math.sin(an)*r*0.72);g.lineTo(Math.cos(an2)*r*0.72,Math.sin(an2)*r*0.72);}g.stroke();
      g.fillStyle=o.c;for(let i=0;i<12;i++){const an=i/12*6.283-rot*1.6;g.fillRect(Math.cos(an)*r*0.86-1.5,Math.sin(an)*r*0.86-1.5,3,3);}
      const gr=g.createRadialGradient(0,0,0,0,0,r);gr.addColorStop(0,`rgba(${o.rgb},.35)`);gr.addColorStop(1,`rgba(${o.rgb},0)`);g.fillStyle=gr;g.beginPath();g.arc(0,0,r,0,6.283);g.fill();
      g.restore();break;}
    case 'redemoinho':{ // vórtice: arcos girando e encolhendo
      const a=(k<0.15?k/0.15:k>0.8?(1-k)/0.2:1),r=o.r*(1-0.75*fxEase.in(k)),rot=(now-o.t0)/1000*7;
      g.save();g.translate(o.x,o.y);g.scale(1,o.ry||0.55);g.globalCompositeOperation='lighter';
      for(let i=0;i<5;i++){g.globalAlpha=a*(0.9-i*0.14);g.strokeStyle=i%2?o.c2:o.c;g.lineWidth=3-i*0.4;g.beginPath();const rr=r*(1-i*0.16);g.arc(0,0,Math.max(1,rr),rot+i*1.3,rot+i*1.3+2.2);g.stroke();}
      const gr=g.createRadialGradient(0,0,0,0,0,r);gr.addColorStop(0,`rgba(${o.rgb},${0.5*a})`);gr.addColorStop(1,`rgba(${o.rgb},0)`);g.globalAlpha=1;g.fillStyle=gr;g.beginPath();g.arc(0,0,r,0,6.283);g.fill();
      g.restore();break;}
    case 'clarao':{const a=(o.a||0.8)*(k<0.12?k/0.12:1-(k-0.12)/0.88);g.globalAlpha=Math.max(0,a);g.fillStyle=`rgb(${o.rgb})`;g.fillRect(0,0,FX.w,FX.h);break;}
    case 'escuro':{const a=(o.a||0.4)*(k<o.kin?k/o.kin:k>o.kout?(1-k)/(1-o.kout):1);g.globalAlpha=Math.max(0,a);g.fillStyle='#0B0705';g.fillRect(0,0,FX.w,FX.h);
      if(o.x!=null){g.globalCompositeOperation='destination-out';const gr=g.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r||90);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');g.globalAlpha=Math.max(0,a/(o.a||0.4));g.fillStyle=gr;g.fillRect(o.x-(o.r||90),o.y-(o.r||90),(o.r||90)*2,(o.r||90)*2);}
      break;}
    case 'rastro':{ // rastro do bote: do ponto de partida até a carta (que está na frente)
      const kk=e(Math.min(1,k/(o.kmov||0.6)));const fade=k>(o.kmov||0.6)?1-(k-(o.kmov||0.6))/(1-(o.kmov||0.6)):1;
      const x1=o.x0+(o.x1-o.x0)*kk,y1=o.y0+(o.y1-o.y0)*kk,x0=o.x0+(o.x1-o.x0)*Math.max(0,kk-0.55),y0=o.y0+(o.y1-o.y0)*Math.max(0,kk-0.55);
      const gr=g.createLinearGradient(x0,y0,x1,y1);gr.addColorStop(0,`rgba(${o.rgb},0)`);gr.addColorStop(1,`rgba(${o.rgb},${0.55*fade})`);
      g.globalCompositeOperation='lighter';g.strokeStyle=gr;g.lineCap='round';g.lineWidth=o.w;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();
      g.strokeStyle=`rgba(255,255,255,${0.5*fade})`;g.lineWidth=o.w*0.25;g.beginPath();g.moveTo(x0+(x1-x0)*0.4,y0+(y1-y0)*0.4);g.lineTo(x1,y1);g.stroke();break;}
    case 'fantasma':{ // rastro de imagens: a arte da carta repetida atrás dela enquanto corre (segue a posição real do WAAPI)
      const r=o.el&&o.el.isConnected?o.el.getBoundingClientRect():null;
      if(r&&r.width){o.h.push([r.left,r.top,r.width,r.height]);if(o.h.length>14)o.h.shift();}
      const n=o.h.length;if(n<3)break;const ult=o.h[n-1],fade=k>0.75?(1-k)/0.25:1;
      // nunca pinta por cima da própria carta: recorta o retângulo atual dela
      const rc=o.card&&o.card.isConnected?o.card.getBoundingClientRect():null;
      g.save();g.beginPath();g.rect(0,0,FX.w,FX.h);if(rc)g.rect(rc.left-1,rc.top-1,rc.width+2,rc.height+2);g.clip('evenodd');
      g.imageSmoothingEnabled=false;
      for(let j=3;j>=1;j--){const q=o.h[n-1-j*2];if(!q)continue;if(Math.hypot(q[0]-ult[0],q[1]-ult[1])<5)continue;
        g.globalCompositeOperation='source-over';g.globalAlpha=fade*(0.55-j*0.12);
        try{g.drawImage(o.cv,q[0],q[1],q[2],q[3]);}catch(e){}
        g.globalCompositeOperation='lighter';g.globalAlpha=fade*(0.3-j*0.07);g.fillStyle=`rgba(${o.rgb},.6)`;g.fillRect(q[0],q[1],q[2],q[3]);}
      g.restore();
      break;}
    case 'garra':{ // três riscos de garra
      const a=k<0.5?1:1-(k-0.5)/0.5;g.globalCompositeOperation='lighter';g.lineCap='round';
      for(let i=-1;i<=1;i++){const kk=Math.min(1,k*4-(i+1)*0.25);if(kk<=0)continue;const ox=Math.cos(o.ang+1.57)*i*o.len*0.22,oy=Math.sin(o.ang+1.57)*i*o.len*0.22;
        const x0=o.x+ox-Math.cos(o.ang)*o.len/2,y0=o.y+oy-Math.sin(o.ang)*o.len/2;const x1=x0+Math.cos(o.ang)*o.len*kk,y1=y0+Math.sin(o.ang)*o.len*kk;
        g.globalAlpha=a;g.strokeStyle=o.c;g.lineWidth=5;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();g.strokeStyle='#FFFFFF';g.lineWidth=2;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();}
      break;}
    case 'estrela':{ // estrela de impacto
      const s=o.r*(0.4+fxEase.out(Math.min(1,k*3))*0.8),a=1-k;g.save();g.translate(o.x,o.y);g.rotate(o.rot||0);g.globalCompositeOperation='lighter';g.globalAlpha=a;g.fillStyle=o.c;
      g.beginPath();const n=o.n||8;for(let i=0;i<n*2;i++){const an=i/(n*2)*6.283,rr=i%2?s*0.28:s;g.lineTo(Math.cos(an)*rr,Math.sin(an)*rr);}g.closePath();g.fill();
      g.fillStyle='#FFFFFF';g.globalAlpha=a*0.9;g.beginPath();g.arc(0,0,s*0.22,0,6.283);g.fill();g.restore();break;}
    case 'escudo':{ // escudo hexagonal que brilha e some
      const a=k<0.15?k/0.15:1-(k-0.15)/0.85,s=o.r*(0.85+0.15*fxEase.back(Math.min(1,k*3)));
      g.save();g.translate(o.x,o.y);g.globalCompositeOperation='lighter';g.globalAlpha=a;g.beginPath();
      for(let i=0;i<6;i++){const an=i/6*6.283+0.52;g.lineTo(Math.cos(an)*s,Math.sin(an)*s*1.12);}g.closePath();
      g.fillStyle=`rgba(${o.rgb},.22)`;g.fill();g.strokeStyle=`rgba(${o.rgb},.95)`;g.lineWidth=3;g.stroke();g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=1;g.stroke();g.restore();break;}
    case 'raio':{ // raio mágico em zigue-zague do atacante ao alvo
      const a=k<0.2?k/0.2:1-(k-0.2)/0.8,kk=Math.min(1,k/0.25);const dx=o.x1-o.x0,dy=o.y1-o.y0,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
      if(!o.pts||(now-(o.tz||0))>50){o.tz=now;o.pts=[];const n=Math.max(4,Math.round(L/22));for(let i=0;i<=n;i++){const f=i/n,j=(i===0||i===n)?0:(fxR()*2-1)*(o.amp||9);o.pts.push([o.x0+dx*f+nx*j,o.y0+dy*f+ny*j]);}}
      const m=Math.max(1,Math.round(o.pts.length*kk));g.globalCompositeOperation='lighter';g.lineJoin='round';g.lineCap='round';
      for(const [lw,col,al] of [[10,`rgba(${o.rgb},.25)`,1],[5,`rgba(${o.rgb},.8)`,1],[2,'#FFFFFF',1]]){g.globalAlpha=a*al;g.strokeStyle=col;g.lineWidth=lw;g.beginPath();for(let i=0;i<m;i++){const p=o.pts[i];if(i)g.lineTo(p[0],p[1]);else g.moveTo(p[0],p[1]);}g.stroke();}
      break;}
    case 'corrente':{ // combo: corrente de luz que liga as criaturas
      const kin=Math.min(1,k/(o.kin||0.3)),a=k>0.75?(1-k)/0.25:1;const P=o.pts;if(P.length<2)break;
      let tot=0;const seg=[];for(let i=1;i<P.length;i++){const l=Math.hypot(P[i].x-P[i-1].x,P[i].y-P[i-1].y);seg.push(l);tot+=l;}
      const ate=tot*fxEase.out(kin);g.globalCompositeOperation='lighter';g.lineCap='round';
      const caminho=()=>{g.beginPath();g.moveTo(P[0].x,P[0].y);let acc=0;for(let i=1;i<P.length;i++){const l=seg[i-1];if(acc+l<=ate){g.lineTo(P[i].x,P[i].y);acc+=l;}else{const f=(ate-acc)/l;g.lineTo(P[i-1].x+(P[i].x-P[i-1].x)*f,P[i-1].y+(P[i].y-P[i-1].y)*f);break;}}};
      for(const [lw,col] of [[14,`rgba(${o.rgb},.22)`],[6,`rgba(${o.rgb},.85)`],[2,'rgba(255,255,255,.95)']]){g.globalAlpha=a;g.strokeStyle=col;g.lineWidth=lw;caminho();g.stroke();}
      // elos e pulsos correndo pela corrente
      g.fillStyle='#FFFFFF';const tt=(now-o.t0)/1000;
      for(let d=((tt*140)%28);d<ate;d+=28){let acc=0;for(let i=1;i<P.length;i++){const l=seg[i-1];if(d<=acc+l){const f=(d-acc)/l,x=P[i-1].x+(P[i].x-P[i-1].x)*f,y=P[i-1].y+(P[i].y-P[i-1].y)*f;g.globalAlpha=a*0.9;g.save();g.translate(x,y);g.rotate(Math.atan2(P[i].y-P[i-1].y,P[i].x-P[i-1].x));g.strokeStyle=`rgba(${o.rgb},1)`;g.lineWidth=2;g.strokeRect(-5,-3,10,6);g.restore();break;}acc+=l;}}
      break;}
    case 'nuvem':{ // nuvenzinha de chuva (Chuva de Grãos)
      const a=k<0.15?k/0.15:k>0.75?(1-k)/0.25:1,y=o.y+(1-Math.min(1,k*4))*-10;g.globalAlpha=a*0.95;
      g.fillStyle='#3A3A4A';for(const [dx,dy,r] of [[-0.3,0.1,0.28],[0,-0.05,0.36],[0.3,0.1,0.28],[0.12,0.15,0.3],[-0.12,0.15,0.3]]){g.beginPath();g.arc(o.x+dx*o.w,y+dy*o.w,r*o.w,0,6.283);g.fill();}
      g.fillStyle='#5A5A6E';g.beginPath();g.arc(o.x-0.05*o.w,y-0.12*o.w,0.22*o.w,0,6.283);g.fill();break;}
    case 'mordida':{ // duas mandíbulas com dentinhos que fecham no alvo
      const fe=fxEase.in(Math.min(1,k/0.42)),a=k<0.6?1:1-(k-0.6)/0.4,r=o.r,ab=r*0.9*(1-fe)+r*0.06;
      g.save();g.translate(o.x,o.y);if(o.ang)g.rotate(o.ang);g.globalAlpha=a;
      for(const lado of [-1,1]){
        const y0=lado*ab;g.fillStyle='rgba(26,20,32,.9)';g.beginPath();g.ellipse(0,y0+lado*r*0.22,r*0.95,r*0.36,0,lado<0?Math.PI:0,lado<0?Math.PI*2:Math.PI);g.fill();
        g.fillStyle=o.c||'#FFFFFF';for(let i=-3;i<=3;i++){const tx=i*r*0.26;g.beginPath();g.moveTo(tx-r*0.12,y0);g.lineTo(tx+r*0.12,y0);g.lineTo(tx,y0-lado*r*0.3);g.closePath();g.fill();}
      }
      if(k>0.4&&k<0.62){g.globalCompositeOperation='lighter';g.fillStyle='rgba(255,255,255,.8)';g.fillRect(-r,-1.5,r*2,3);}
      g.restore();break;}
    case 'chicote':{ // açoite: uma curva que estica do atacante ao alvo e estala na ponta
      const kk=fxEase.out(Math.min(1,k/0.45)),a=k<0.7?1:1-(k-0.7)/0.3,N=26;
      const dx=o.x1-o.x0,dy=o.y1-o.y0,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,cv=(o.curva||0.35)*L*(1-kk*0.6);
      const pt=t=>{const bx=o.x0+dx*t+nx*cv*Math.sin(Math.PI*t),by=o.y0+dy*t+ny*cv*Math.sin(Math.PI*t);const w=Math.sin(t*Math.PI*3-(now-o.t0)/45)*(o.onda||7)*(1-k)*t;return [bx+nx*w,by+ny*w];};
      g.globalAlpha=a;g.lineCap='round';g.lineJoin='round';
      for(const [lw,col] of [[7,'rgba(26,20,32,.85)'],[4,o.c||'#A0673A'],[1.5,o.c2||'rgba(255,240,200,.85)']]){g.strokeStyle=col;g.lineWidth=lw;g.beginPath();for(let i=0;i<=N;i++){const t=i/N*kk;const [x,y]=pt(t);if(i)g.lineTo(x,y);else g.moveTo(x,y);}g.stroke();}
      if(o.folhas){g.fillStyle=o.folhas;for(let i=3;i<N;i+=5){const t=i/N*kk;const [x,y]=pt(t);g.beginPath();g.ellipse(x+nx*4,y+ny*4,3.5,2,Math.atan2(dy,dx),0,6.283);g.fill();}}
      break;}
    case 'vinha':{ // cipós que sobem pela carta (on) ou murcham (off)
      const sobe=o.off?1-fxEase.in(k):fxEase.out(Math.min(1,k/0.55)),a=o.off?1-k:(k>0.8?1-(k-0.8)/0.2*0.6:1);
      g.save();g.globalAlpha=Math.max(0,a);g.lineCap='round';
      const cor=o.off?'#8E6A3A':'#3E8E3A',cor2=o.off?'#C9A060':'#9BD34B';
      for(let v=0;v<3;v++){
        const x0=o.l+o.w*(0.18+v*0.32),fase=v*1.7;
        g.strokeStyle='rgba(26,20,32,.8)';g.lineWidth=5;g.beginPath();
        const alt=o.h*0.85*sobe;for(let j=0;j<=12;j++){const t=j/12;const yy=o.b-t*alt,xx=x0+Math.sin(t*5+fase)*o.w*0.09;if(j)g.lineTo(xx,yy);else g.moveTo(xx,yy);}g.stroke();
        g.strokeStyle=cor;g.lineWidth=3;g.stroke();
        g.fillStyle=cor2;for(let j=2;j<=12;j+=3){const t=j/12;if(t*o.h*0.85>alt)break;const yy=o.b-t*o.h*0.85,xx=x0+Math.sin(t*5+fase)*o.w*0.09;g.beginPath();g.ellipse(xx+(j%2?5:-5),yy,4,2.4,j%2?0.5:-0.5,0,6.283);g.fill();}
      }
      g.restore();break;}
    case 'lua':{ // lua cheia que aparece por cima da carta
      const a=k<0.2?k/0.2:k>0.75?(1-k)/0.25:1,r=o.r*(0.7+0.3*fxEase.back(Math.min(1,k*2.5)));
      g.globalAlpha=a;g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(o.x,o.y,r*0.6,o.x,o.y,r*2.2);gr.addColorStop(0,'rgba(230,240,255,.55)');gr.addColorStop(1,'rgba(160,180,255,0)');g.fillStyle=gr;g.beginPath();g.arc(o.x,o.y,r*2.2,0,6.283);g.fill();
      g.globalCompositeOperation='source-over';g.fillStyle='#1A1420';g.beginPath();g.arc(o.x,o.y,r+2,0,6.283);g.fill();g.fillStyle='#F4F0D8';g.beginPath();g.arc(o.x,o.y,r,0,6.283);g.fill();
      g.fillStyle='#C9C4A8';g.beginPath();g.arc(o.x-r*0.3,o.y-r*0.2,r*0.22,0,6.283);g.fill();g.beginPath();g.arc(o.x+r*0.3,o.y+r*0.25,r*0.16,0,6.283);g.fill();g.beginPath();g.arc(o.x+r*0.2,o.y-r*0.4,r*0.1,0,6.283);g.fill();
      break;}
    case 'fita':{ // fita colorida de festa (Boi-Bumbá): arco do Boi até quem entrou
      const kk=fxEase.out(Math.min(1,k/0.4)),a=k>0.7?(1-k)/0.3:1,N=22,cx=(o.x0+o.x1)/2,cy=Math.min(o.y0,o.y1)-(o.arco||40);
      const pt=t=>[(1-t)*(1-t)*o.x0+2*(1-t)*t*cx+t*t*o.x1,(1-t)*(1-t)*o.y0+2*(1-t)*t*cy+t*t*o.y1+Math.sin(t*12-(now-o.t0)/70)*3];
      const cores=['#C4362F','#F2C230','#4A7FC1','#5DBB63','#F49AC1'];g.globalAlpha=a;g.lineCap='butt';
      for(let i=0;i<N;i++){const t0=i/N*kk,t1=(i+1)/N*kk;const [x0,y0]=pt(t0),[x1,y1]=pt(t1);g.strokeStyle='rgba(26,20,32,.8)';g.lineWidth=7;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();g.strokeStyle=cores[i%cores.length];g.lineWidth=4;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();}
      break;}
    case 'proj':{ // projétil (ferrão, pipoca, bola de lama...) com arco
      const kk=e(k),x=o.x0+(o.x1-o.x0)*kk,y=o.y0+(o.y1-o.y0)*kk-(o.arco||0)*4*kk*(1-kk);
      const px=o.px==null?x:o.px,py=o.py==null?y:o.py;o.px=x;o.py=y;
      g.globalCompositeOperation='source-over';g.globalAlpha=1;
      if(o.forma==='ferrao'){const an=Math.atan2(y-py,x-px);g.save();g.translate(x,y);g.rotate(an);g.fillStyle='#1A1420';g.beginPath();g.moveTo(8,0);g.lineTo(-5,-3);g.lineTo(-5,3);g.closePath();g.fill();g.fillStyle='#F2C230';g.fillRect(-5,-2,4,4);g.restore();}
      else if(o.forma==='pipoca'){g.save();g.translate(x,y);g.rotate(kk*6);fxDesenhaP(g,{k:'pop',x:0,y:0,sz:o.sz||9,c:o.c||'#FFF8E0',c2:o.c2,a:1,t:0,max:1});g.restore();}
      else if(o.forma==='gota'){g.fillStyle=o.c;g.beginPath();g.arc(x,y,(o.sz||8)/2,0,6.283);g.fill();g.fillStyle='rgba(255,255,255,.55)';g.fillRect(x-2,y-3,2,2);}
      else if(o.forma==='ovo'){const s=o.sz||12;g.save();g.translate(x,y);g.rotate(Math.sin(kk*9)*0.5);g.fillStyle='#1A1420';g.beginPath();g.ellipse(0,0,s*0.42+1.5,s*0.55+1.5,0,0,6.283);g.fill();
        g.fillStyle=o.c||'#F4E3B5';g.beginPath();g.ellipse(0,0,s*0.42,s*0.55,0,0,6.283);g.fill();g.fillStyle='#FFFFFF';g.fillRect(-s*0.2,-s*0.36,s*0.16,s*0.2);
        g.fillStyle=o.c2||'#A0673A';g.fillRect(s*0.08,-s*0.1,s*0.14,s*0.14);g.fillRect(-s*0.22,s*0.14,s*0.12,s*0.12);g.restore();}
      else if(o.forma==='bolha'){const s=o.sz||12;g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(x,y,0,x,y,s);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(0.45,o.c);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-s,y-s,s*2,s*2);
        g.globalCompositeOperation='source-over';g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=2;g.beginPath();g.arc(x,y,s*0.55,0,6.283);g.stroke();}
      else{g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(x,y,0,x,y,o.sz||10);gr.addColorStop(0,'#FFFFFF');gr.addColorStop(0.4,o.c);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-(o.sz||10),y-(o.sz||10),(o.sz||10)*2,(o.sz||10)*2);}
      if(o.trilha&&fxR()<0.8)fxP({k:o.trilha==='gota'?'drop':'glow',x,y,vx:(fxR()-0.5)*30,vy:(fxR()-0.5)*30+(o.trilha==='gota'?40:0),g:o.trilha==='gota'?500:0,max:0.3,sz:o.trilha==='gota'?3:6,c:o.trilha==='gota'?o.c:fxHex(o.c,0.8),add:o.trilha!=='gota'});
      break;}
  }
}

/* ---------- peças pequenas de efeito ---------- */
function fxPoeira(x,y,w,n,cor){
  for(let i=0;i<n;i++){const d=i%2?1:-1,sp=40+fxR()*90;fxP({k:'puff',x:x+(fxR()-0.5)*w*0.6,y:y-fxR()*4,vx:d*sp,vy:-10-fxR()*25,drag:3.5,max:0.5+fxR()*0.3,sz:5+fxR()*4,sz1:13+fxR()*10,c:cor||(fxR()<0.5?'rgba(240,220,178,.72)':'rgba(196,160,116,.66)')});}
}
function fxFaiscas(x,y,n,cores,o){
  o=o||{};for(let i=0;i<n;i++){const an=o.ang!=null?o.ang+(fxR()-0.5)*(o.abre||1.6):fxR()*6.283,sp=(o.vel||260)*(0.4+fxR()*0.8);
    fxP({k:'streak',x,y,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-(o.sobe||0),g:o.g==null?380:o.g,drag:2.2,max:0.28+fxR()*0.3,sz:o.sz||2,c:cores[i%cores.length],add:true,len:o.len});}
}
function fxSobe(x,y,w,n,cor,o){
  o=o||{};for(let i=0;i<n;i++)fxP({k:o.k||'star',x:x+(fxR()-0.5)*w,y:y-fxR()*(o.alt||10),vx:(fxR()-0.5)*20,vy:-(o.vel||60)-fxR()*(o.vel||60),drag:0.6,max:(o.dur||0.9)+fxR()*0.5,sz:o.sz||(4+fxR()*4),c:cor,add:o.add!==false,pulsa:true,atraso:(o.espalha||0)*fxR(),fadeIn:true});
}
function fxAnel(x,y,r0,r1,c,dur,o){o=o||{};return fxO({tipo:'anel',x,y,r0,r1,c,dur,w:o.w||4,ry:o.ry==null?0.38:o.ry,ease:'out',atraso:o.atraso,a:o.a,add:o.add});}
/* sabor do terreno: milho, pétalas, água, capim */
function fxSabor(terr,x,y,w,n,o){
  o=o||{};const forca=o.forca||1;
  for(let i=0;i<n;i++){
    const an=-Math.PI/2+(fxR()-0.5)*2.2,sp=(120+fxR()*150)*forca,vx=Math.cos(an)*sp,vy=Math.sin(an)*sp,px=x+(fxR()-0.5)*w*0.5;
    if(terr==='milharal')fxP(i%4===3?{k:'blade',x:px,y,vx,vy,g:700,max:0.9,sz:8,c:'#6CB843',rot:fxR()*3,vr:(fxR()-0.5)*14,chao:y+4}:{k:'kernel',x:px,y,vx,vy,g:900,max:0.9+fxR()*0.3,sz:5.5,c:'#F2C230',c2:'#B9801C',rot:fxR()*3,vr:(fxR()-0.5)*16,chao:y+2+fxR()*6});
    else if(terr==='pomar')fxP(i%5===4?{k:'dot',x:px,y,vx,vy:vy*0.8,g:900,max:0.9,sz:5,c:'#C4362F',chao:y+3}:{k:'petal',x:px,y,vx:vx*0.6,vy:vy*0.7,g:140,drag:2.2,max:1.1+fxR()*0.5,sz:4.6,c:fxR()<0.6?'#F49AC1':'#FFE4F0',c2:'#E0789E',rot:fxR()*3,vr:(fxR()-0.5)*8,bal:[6,8,fxR()*6]});
    else if(terr==='brejo')fxP({k:'drop',x:px,y,vx:vx*0.7,vy:vy*1.15,g:950,max:0.7,sz:4+fxR()*3,c:fxR()<0.5?'#5FC0B4':'#9FE4DA'});
    else fxP(i%4===3?{k:'dot',x:px,y,vx,vy,g:700,max:0.9,sz:4,c:fxR()<0.5?'#FFFFFF':'#F2C230',chao:y+3}:{k:'blade',x:px,y,vx,vy,g:700,max:0.9,sz:6+fxR()*4,c:fxR()<0.5?'#6CB843':'#9BD34B',rot:fxR()*3,vr:(fxR()-0.5)*14,chao:y+3});
  }
  if(terr==='brejo')fxAnel(x,y,4,w*0.55,'rgba(159,228,218,.9)',520,{w:2,add:false});
}
/* cometa: luz que sai da carta da mão até o terreno */
function fxCometa(src,dst,cor,dur){
  if(!src||!dst)return;const x0=src.left+src.width/2,y0=src.top+src.height/2;const n=10;
  for(let i=0;i<n;i++){const f=i/n;fxP({k:'glow',x:x0,y:y0,vx:(dst.x-x0)/(dur/1000),vy:(dst.y-y0)/(dur/1000),max:dur/1000,sz:10-f*6,c:fxHex(cor,0.9-f*0.6),add:true,atraso:f*0.06});}
}
function fxEstrela(x,y,r,c,o){o=o||{};return fxO({tipo:'estrela',x,y,r,c,dur:o.dur||220,rot:fxR()*0.8,n:o.n||8,atraso:o.atraso});}
function fxClarao(rgb,a,dur){return fxO({tipo:'clarao',rgb,a,dur});}
function fxPisca(el,brilho,dur){el=fxVis(el);if(!el||!el.animate)return;try{el.animate([{filter:`brightness(${brilho||2.4}) saturate(.6)`},{filter:'none'}],{duration:dur||200,easing:'ease-out'});}catch(e){}}

/* ---------- invocação: TRANSFORMAÇÃO ----------
   A carta sai da mão (ou da mostra do rival), voa até o canteiro, brilha, estoura em luz e o PERSONAGEM sai dela
   (estado 'entra' do sprite). Cada raridade tem o seu jeito (comum: poeirinha; incomum: anel verde; rara: runa e feixe;
   épica: vórtice; lendária: pilar de luz dourada e o nome na faixa) e o terreno joga o seu sabor no pouso. */
/* a carta voando: resolve quando chega (e some num clarão); null se não houver de onde sair */
function fxVooCarta(src,dst,id,rar,o){
  o=o||{};const camada=document.getElementById('fx');
  if(!src||!dst||!camada||typeof cardHTML!=='function'||!(typeof CARD!=='undefined'&&CARD[id]))return null;
  const d=document.createElement('div');d.className='voo vira';d.style.visibility='hidden';
  d.innerHTML=cardHTML(id,{sz:'hand',lvl:o.lvl||1});camada.appendChild(d);try{hydrate(d);}catch(e){}
  const cor=(typeof RAR_LUZ!=='undefined'&&RAR_LUZ[rar])||'#FFFFFF';d.style.setProperty('--vl',fxHex(cor,0.85));
  const w0=d.offsetWidth||76,h0=d.offsetHeight||106;
  const sx=src.left+src.width/2,sy=src.top+src.height/2,s0=Math.max(0.5,Math.min(1.6,src.width/w0));
  d.style.left=Math.round(sx-w0/2)+'px';d.style.top=Math.round(sy-h0/2)+'px';d.style.visibility='';
  const dx=dst.x-sx,dy=dst.y-sy,s1=Math.max(0.3,Math.min(0.9,dst.h*0.9/h0));
  const dur=o.dur||300,lado=dx>=0?1:-1;
  let kf;
  if(o.modo==='vortice') // épica: entra girando no redemoinho
    kf=[{transform:`translate(0,0) scale(${s0})`,filter:'none'},{transform:`translate(${dx*0.5}px,${dy*0.5-40}px) rotate(${lado*-14}deg) scale(${s1*1.15})`,filter:'brightness(1.3)',offset:0.45},
      {transform:`translate(${dx}px,${dy-12}px) rotate(${lado*200}deg) scale(${s1*0.8})`,filter:'brightness(2) saturate(.6)',offset:0.75},{transform:`translate(${dx}px,${dy}px) rotate(${lado*560}deg) scale(.12)`,filter:'brightness(3.4) saturate(0)'}];
  else if(o.modo==='pilar') // lendária: sobe, gira dentro do pilar de luz e mergulha no chão
    kf=[{transform:`translate(0,0) scale(${s0})`,filter:'none'},{transform:`translate(${dx}px,${dy-dst.h*0.95}px) rotate(${lado*-6}deg) scale(${s1*1.2})`,filter:'brightness(1.4)',offset:0.4,easing:'ease-out'},
      {transform:`translate(${dx}px,${dy-dst.h*1.05}px) scale(${-s1*1.2},${s1*1.2})`,filter:'brightness(1.9)',offset:0.55},{transform:`translate(${dx}px,${dy-dst.h*1.1}px) scale(${s1*1.25})`,filter:'brightness(2.4) saturate(.5)',offset:0.72,easing:'cubic-bezier(.6,0,.9,.5)'},
      {transform:`translate(${dx}px,${dy}px) scale(${s1*0.7},${s1*0.45})`,filter:'brightness(4) saturate(0)'}];
  else kf=[{transform:`translate(0,0) scale(${s0}) rotate(0deg)`,filter:'none'},{transform:`translate(${dx*0.45}px,${dy*0.45-34}px) rotate(${lado*-10}deg) scale(${(s0+s1)/2*1.05})`,filter:'brightness(1.25)',offset:0.45},
      {transform:`translate(${dx}px,${dy-6}px) rotate(${lado*6}deg) scale(${s1*1.08})`,filter:'brightness(2.2) saturate(.55)',offset:0.82},{transform:`translate(${dx}px,${dy}px) rotate(0deg) scale(${s1*0.92},${s1*0.82})`,filter:'brightness(3.2) saturate(.2)'}];
  const an=d.animate(kf,{duration:dur,easing:o.modo?'linear':'cubic-bezier(.45,0,.6,1)',fill:'forwards'});
  // rastro de luz atrás da carta
  for(let i=0;i<8;i++)fxP({k:'glow',x:sx,y:sy,vx:dx/(dur/1000),vy:dy/(dur/1000),max:dur/1000*0.9,sz:9-i*0.7,c:fxHex(cor,0.7-i*0.07),add:true,atraso:0.05+i*0.025});
  // termina junto com a animação (e, por segurança, um pouco depois se ela não terminar)
  return new Promise(res=>{let ok=false;const fim=()=>{if(ok)return;ok=true;d.remove();res(true);};an.onfinish=fim;an.oncancel=fim;setTimeout(fim,dur+900);});
}
/* a carta estoura: clarão, cacos da moldura e da arte voando, anel de luz */
function fxEstouroCarta(x,y,w,h,cor,rar,o){
  o=o||{};const k=o.forca||1;
  fxO({tipo:'clarao',rgb:fxRgb(cor),a:0.10*k,dur:200});
  fxP({k:'glow',x,y,max:0.22,sz:Math.max(w,h)*0.5*Math.min(1.15,k),c:fxHex('#FFFFFF',0.9),add:true});
  fxP({k:'glow',x,y,max:0.34,sz:Math.max(w,h)*0.75*Math.min(1.2,k),c:fxHex(cor,0.6),add:true});
  fxEstrela(x,y,Math.min(46,w*0.5)*Math.min(1.2,k),'#FFFFFF',{n:8,dur:160});
  const cores=['#FFFFFF',cor,(typeof RAR_COR!=='undefined'&&RAR_COR[rar])||'#C9A060','#F4E3B5','#8E5F38'];
  for(let i=0;i<Math.round(16*k);i++){const an=fxR()*6.283,sp=(150+fxR()*230)*k;fxP({k:'px',x:x+(fxR()-0.5)*w*0.5,y:y+(fxR()-0.5)*h*0.4,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-80,g:700,drag:0.8,max:0.5+fxR()*0.35,sz:2.5+fxR()*3,c:cores[i%cores.length],rot:fxR()*3,vr:(fxR()-0.5)*14});}
  fxFaiscas(x,y,Math.round(10*k),['#FFFFFF',cor],{vel:300*k,g:260,sz:2.2});
  fxAnel(x,y+h*0.4,6,Math.max(30,w*0.95)*Math.min(1.3,k),cor,440,{w:4});
}
/* o personagem sai da luz: pulo com estica-e-puxa + estado 'entra' do sprite; os números aparecem logo depois */
function fxSaiPersonagem(el,ms,o){
  o=o||{};el.classList.remove('fx-pre');
  const fig=fxCorpo(el);sprAcao(el,'entra',Math.round(ms*1.35));
  const kf=o.gira?[{transform:'scale(.15) rotate(-220deg)',opacity:0,filter:'brightness(3) saturate(.3)'},{transform:'translateY(-12%) scale(1.2) rotate(8deg)',opacity:1,offset:0.55,filter:'brightness(1.8)'},{transform:'scale(.95,1.04) rotate(-2deg)',offset:0.8,filter:'none'},{transform:'none',opacity:1}]
    :o.cai?[{transform:'translateY(-90%) scale(1.25)',opacity:0,filter:'brightness(4) saturate(0)'},{transform:'translateY(-30%) scale(1.1)',opacity:1,offset:0.4,filter:'brightness(2.4) saturate(.4)'},{transform:'translateY(0) scale(1.15,.82)',offset:0.62,filter:'brightness(1.5)'},{transform:'translateY(-6%) scale(.96,1.06)',offset:0.8},{transform:'none',opacity:1,filter:'none'}]
    :[{transform:'translateY(6%) scale(.25,.15)',opacity:0,filter:'brightness(3) saturate(.3)'},{transform:'translateY(-16%) scale(.88,1.22)',opacity:1,offset:0.42,filter:'brightness(1.8)'},{transform:'translateY(2%) scale(1.14,.86)',offset:0.66,filter:'brightness(1.15)'},{transform:'translateY(-3%) scale(.97,1.04)',offset:0.84,filter:'none'},{transform:'none',opacity:1}];
  try{fig.animate(kf,{duration:ms,easing:'cubic-bezier(.3,0,.4,1)',fill:'backwards'});}catch(e){}
  const resto=[...el.querySelectorAll(':scope > .ft,:scope > .cn,:scope > .selos,:scope > .bt')];
  resto.forEach((e,i)=>{try{e.animate([{transform:'scale(.3)',opacity:0},{transform:'scale(1.15)',opacity:1,offset:0.6},{transform:'none',opacity:1}],{duration:260,delay:Math.round(ms*0.45)+i*40,easing:'ease-out',fill:'backwards'});}catch(e2){}});
}
/* v10: Ascensão III (Lenda Viva): o nome da lenda em Rye sobre um estouro na cor do reino, 0,6 s */
function fxAscNome(el,id){
  try{if(RM)return;const r=el.getBoundingClientRect();if(!r.width)return;const c=CARD[id];const terr=c?c.terreno:'neutro',cor=(typeof TERR_COR!=='undefined'&&TERR_COR[terr])||'#FFD35A';
    const d=document.createElement('div');d.className='fx-ascnome';d.setAttribute('aria-hidden','true');d.textContent=(c&&(c.curto||c.nome))||'';
    d.style.cssText=`position:fixed;left:${Math.round(r.left+r.width/2)}px;top:${Math.round(r.top+r.height*0.25)}px;transform:translate(-50%,-50%);z-index:60;pointer-events:none;white-space:nowrap;font:400 ${Math.max(16,Math.min(28,r.width*0.22))}px Rye,Fredoka,Georgia,serif;color:#FFF4D8;letter-spacing:.02em;text-shadow:0 0 2px #1E120C,0 2px 0 #1E120C,0 0 14px ${cor},0 0 26px ${cor}`;
    document.body.appendChild(d);
    const b=document.createElement('div');b.setAttribute('aria-hidden','true');b.style.cssText=`position:fixed;left:${Math.round(r.left+r.width/2)}px;top:${Math.round(r.top+r.height*0.45)}px;width:${Math.round(r.width*1.6)}px;height:${Math.round(r.width*1.6)}px;transform:translate(-50%,-50%);z-index:59;pointer-events:none;border-radius:50%;background:radial-gradient(circle,${cor}cc 0,${cor}55 35%,transparent 68%)`;
    document.body.appendChild(b);
    b.animate([{transform:'translate(-50%,-50%) scale(.2)',opacity:0},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:0.35},{transform:'translate(-50%,-50%) scale(1.35)',opacity:0}],{duration:650,easing:'ease-out'}).onfinish=()=>b.remove();
    d.animate([{transform:'translate(-50%,-50%) scale(.4)',opacity:0},{transform:'translate(-50%,-62%) scale(1.12)',opacity:1,offset:0.3},{transform:'translate(-50%,-70%) scale(1)',opacity:1,offset:0.75},{transform:'translate(-50%,-80%) scale(.96)',opacity:0}],{duration:900,easing:'ease-out'}).onfinish=()=>d.remove();
  }catch(e){}
}
async function fxInvocar(P,lane,rar,o){
  o=o||{};
  const ln=fxLaneEl(P,lane);
  let el=null;
  if(ln){if(o.tipo==='construcao')el=ln.querySelector('[data-bs]');else el=(o.uid!=null&&ln.querySelector(`.card[data-uid="${o.uid}"]`))||ln.querySelector('.card');}
  if(!ln||!el){if(el)el.classList.remove('fx-pre');return;}
  const ficha=!!o.ficha||rar==='ficha';
  if(RM||!el.animate||!fxCanvas()){el.classList.remove('fx-pre');try{el.animate([{opacity:0},{opacity:1}],{duration:150});}catch(e){}await fxEsp(ficha?120:160);return;}
  const r=fxRect(el);if(!r){el.classList.remove('fx-pre');await fxEsp(0);return;}
  el.classList.add('fx-pre');
  if(typeof p3dInvoca==='function')try{p3dInvoca(P,lane,ficha?'ficha':rar,{tipo:o.tipo,id:el.dataset&&el.dataset.id});}catch(e){}
  if(P==='p'&&!ficha&&el.dataset&&el.dataset.id&&typeof p3dAscDe==='function'&&p3dAscDe(el.dataset.id)>=3)fxAscNome(el,el.dataset.id);
  try{
  const terr=o.terr||fxTerr(el),rv=P==='r',K=rv?0.8:1;
  const cor=(typeof RAR_LUZ!=='undefined'&&RAR_LUZ[rar])||'#FFFFFF',rgb=fxRgb(cor);
  const pe={x:r.x,y:r.b-2};
  const T=ms=>Math.round(ms*K);
  const som=(nome,a,ms)=>setTimeout(()=>{try{sfx(nome,a);}catch(e){}},ms);
  const pouso=(qtd,forca)=>{fxPoeira(pe.x,pe.y,r.w,qtd);fxSabor(terr,pe.x,pe.y-4,r.w,Math.round(qtd*1.2),{forca});};
  const alvoVoo={x:r.x,y:r.y,h:r.h};
  // construção: a carta vira tábuas e o prédio cai e assenta
  if(o.tipo==='construcao'){
    const voo=fxVooCarta(o.src,alvoVoo,o.id,rar,{dur:T(280)});if(voo)await voo;
    fxEstouroCarta(r.x,r.y,r.w,r.h,cor,rar,{forca:0.8});
    for(let i=0;i<10;i++)fxP({k:'px',x:r.x+(fxR()-0.5)*r.w,y:r.y,vx:(fxR()-0.5)*200,vy:-90-fxR()*140,g:900,max:0.75,sz:3+fxR()*2,c:i%2?'#8E5F38':'#C99560',rot:fxR()*3,vr:(fxR()-0.5)*12});
    fxSaiPersonagem(el,T(380),{cai:true});
    setTimeout(()=>{fxPoeira(r.x,r.b,r.w,7);fxAnel(r.x,r.b-3,6,r.w*0.8,cor,420,{w:3});fxTremor(1);},T(200));
    await fxEsp(T(380));return;
  }
  // ficha (Filhote, Cereja, Zangão, Girino): brota pequenininha do ovo/semente
  if(ficha){
    fxSaiPersonagem(el,260);
    setTimeout(()=>{for(let i=0;i<8;i++){const an=fxR()*6.283;fxP({k:'petal',x:r.x,y:r.y,vx:Math.cos(an)*120,vy:Math.sin(an)*120-40,g:200,drag:2,max:0.7,sz:3,c:i%2?'#F49AC1':'#FFE58A',rot:an,vr:6});}fxPoeira(pe.x,pe.y,r.w,4);},110);
    await fxEsp(280);return;
  }
  if(rar==='comum'||rar==='incomum'){
    const inc=rar==='incomum';
    const voo=fxVooCarta(o.src,alvoVoo,o.id,rar,{dur:T(inc?290:270)});if(voo)await voo;
    fxEstouroCarta(r.x,r.y,r.w,r.h,cor,rar,{forca:inc?1:0.8});
    fxSaiPersonagem(el,T(inc?340:320));
    som('invocar',{rar,P},0);
    setTimeout(()=>{pouso(inc?9:8,inc?1.1:1);if(inc){fxAnel(pe.x,pe.y,6,r.w*0.95,cor,520,{w:4});fxAnel(pe.x,pe.y,4,r.w*0.6,'#FFFFFF',380,{w:2,atraso:60});fxSobe(pe.x,pe.y,r.w*0.8,9,cor,{vel:50});}},T(150));
    await fxEsp(T(inc?330:300));return;
  }
  if(rar==='rara'){
    // runa no chão enquanto a carta vem; um feixe azul desce e a carta estoura dentro dele
    fxO({tipo:'runa',x:pe.x,y:pe.y,r:r.w*0.72,c:cor,rgb,dur:T(900),vel:2.2});
    som('conjurar',{rar,P},0);
    const voo=fxVooCarta(o.src,alvoVoo,o.id,rar,{dur:T(300)});
    fxO({tipo:'feixe',x:r.x,y0:r.t-Math.min(150,r.t),y1:pe.y,w0:4,w:r.w*0.72,rgb,dur:T(600),atraso:T(voo?180:0),kin:0.35,kout:0.55});
    if(voo)await voo;else await fxEsp(T(200));
    fxEstouroCarta(r.x,r.y,r.w,r.h,cor,rar,{forca:1.1});
    fxSaiPersonagem(el,T(360));
    som('invocar',{rar,P},0);
    setTimeout(()=>{pouso(8,1.1);fxAnel(pe.x,pe.y,8,r.w*1.05,cor,560,{w:4});fxSobe(pe.x,r.y,r.w*0.9,12,cor,{vel:70,alt:r.h*0.6});fxFaiscas(pe.x,pe.y-6,8,['#FFFFFF',cor],{sobe:120,g:300});},T(160));
    await fxEsp(T(460));return;
  }
  if(rar==='epica'){
    // vórtice roxo no chão, faíscas sugadas, a carta entra girando e estoura numa onda de choque; o personagem sai girando
    const c2='#F49AC1',vy=pe.y-r.h*0.12;
    fxO({tipo:'escuro',a:0.32,kin:0.25,kout:0.6,x:r.x,y:r.y,r:Math.max(100,r.w*1.4),dur:T(1100)});
    fxO({tipo:'redemoinho',x:r.x,y:vy,r:r.w*1.3,ry:0.42,c:cor,c2,rgb,dur:T(900)});
    fxO({tipo:'redemoinho',x:r.x,y:r.y,r:r.w*0.9,ry:0.95,c:'#FFFFFF',c2:cor,rgb,dur:T(700),atraso:T(120)});
    fxO({tipo:'runa',x:pe.x,y:pe.y,r:r.w*0.75,c:cor,rgb,dur:T(900),vel:-3});
    for(let i=0;i<36;i++){const an=fxR()*6.283,rr=r.w*(0.8+fxR()*0.7),sp=rr/0.42;fxP({k:'glow',x:r.x+Math.cos(an)*rr,y:r.y+Math.sin(an)*rr*0.65,vx:-Math.cos(an)*sp+Math.sin(an)*sp*0.8,vy:(-Math.sin(an)*sp-Math.cos(an)*sp*0.8)*0.65,drag:1.2,max:0.46,sz:5+fxR()*5,c:fxHex(i%3?cor:c2,0.95),add:true,atraso:fxR()*0.2});}
    som('conjurar',{rar,P},0);
    const voo=fxVooCarta(o.src,alvoVoo,o.id,rar,{dur:T(420),modo:'vortice'});if(voo)await voo;else await fxEsp(T(300));
    fxClarao('200,139,255',0.22,T(260));
    fxEstouroCarta(r.x,r.y,r.w,r.h,cor,rar,{forca:1.2});
    fxAnel(pe.x,pe.y,12,r.w*2,cor,700,{w:8});fxAnel(r.x,r.y,10,r.w*1.3,c2,560,{w:4,ry:1,atraso:40});
    for(let i=0;i<10;i++){const an=fxR()*6.283,sp=140+fxR()*160;fxP({k:'petal',x:r.x,y:r.y,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-60,g:160,drag:1.8,max:1,sz:4.5,c:i%2?c2:'#E2C2FF',rot:an,vr:(fxR()-0.5)*10});}
    fxSaiPersonagem(el,T(440),{gira:true});
    som('invocar',{rar,P},0);
    setTimeout(()=>{pouso(8,1.2);fxTremor(1);fxPisca(el,2.2,240);},T(250));
    await fxEsp(T(560));return;
  }
  // lendária: pilar dourado, a carta sobe, gira dentro da luz e mergulha; clarão, onda de choque e o nome na faixa
  const ouro='#FFD35A',orgb='255,211,90';
  const nome=(typeof CARD!=='undefined'&&o.id&&CARD[o.id])?CARD[o.id].nome:'';
  fxO({tipo:'escuro',a:0.5,kin:0.18,kout:0.7,x:r.x,y:r.y,r:Math.max(110,r.w*1.5),dur:T(1500)});
  fxO({tipo:'feixe',x:r.x,y0:-20,y1:pe.y,w0:6,w:r.w*1.1,rgb:orgb,dur:T(1350),kin:0.25,kout:0.55,a:1});
  fxO({tipo:'runa',x:pe.x,y:pe.y,r:r.w*0.9,c:ouro,rgb:orgb,dur:T(1350),vel:3});
  for(let i=0;i<26;i++)fxP({k:'star',x:r.x+(fxR()-0.5)*r.w*0.8,y:pe.y-fxR()*20,vx:(fxR()-0.5)*14,vy:-120-fxR()*200,max:0.9+fxR()*0.4,sz:4+fxR()*5,c:fxR()<0.5?'#FFF4C0':ouro,add:true,pulsa:true,atraso:fxR()*0.6,fadeIn:true});
  som('conjurar',{rar,P},0);
  if(nome)setTimeout(()=>fxBanner(nome,'lendaria',{alvo:r}),T(140));
  const voo=fxVooCarta(o.src,alvoVoo,o.id,rar,{dur:T(720),modo:'pilar'});if(voo)await voo;else await fxEsp(T(450));
  fxClarao('255,240,200',0.75,T(320));
  fxEstouroCarta(r.x,r.y,r.w,r.h,ouro,rar,{forca:1.4});
  fxAnel(pe.x,pe.y,10,r.w*1.8,ouro,720,{w:7});fxAnel(pe.x,pe.y,8,r.w*1.3,'#FFFFFF',520,{w:3,atraso:70});fxAnel(r.x,r.y,10,r.w*1.25,ouro,600,{w:4,ry:1,atraso:120});
  for(let i=0;i<14;i++){const an=-Math.PI/2+(fxR()-0.5)*2.6,sp=200+fxR()*220;fxP({k:'kernel',x:pe.x,y:pe.y-6,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,g:900,max:1,sz:4,c:'#FFE58A',c2:'#B9801C',rot:fxR()*3,vr:(fxR()-0.5)*16,chao:pe.y+fxR()*8});}
  fxSaiPersonagem(el,T(520),{cai:true});
  som('invocar',{rar,P},0);
  setTimeout(()=>{pouso(10,1.4);fxTremor(2);},T(260));
  setTimeout(()=>fxSobe(r.x,pe.y,r.w,14,ouro,{vel:40,dur:0.9,espalha:0.4}),T(420));
  await fxEsp(T(620));
  }finally{el.classList.remove('fx-pre');}
}

/* ---------- ataque ---------- */
const FX_ESTILO={
  'espiga-sapeca':'investida','corvo-ladino':'bicada','espantalho-guardiao':'garra','pipoqueiro-explosivo':'pipoca','revoada-noturna':'bicada','rei-milhao':'raio',
  'maca-rolica':'investida','abelha-operaria':'ferrao','cerejas-gemeas':'pipoca','cereja':'investida','joaninha-curandeira':'raio','macieira-ancia':'pipoca','guardia-florada':'raio',
  'pintinho-valente':'bicada','sapinho-verruguento':'respingo','libelula-faisca':'raio','taboa-espinhosa':'ferrao','garca-pescadora':'bicada','rainha-das-ras':'respingo','velho-lodao':'respingo',
  'ovelha-felpuda':'chifrada','cabrito-teimoso':'chifrada','vaca-mimosa':'chifrada','bode-marrento':'chifrada','touro-trovao':'chifrada','matriarca-mugidora':'chifrada','gato-do-celeiro':'garra',
  // v4: as criaturas novas usam o "golpe" da spec (pisao, mordida, chicote e estouro são estilos novos)
  'codorna-ninheira':'bicada','galo-despertador':'bicada','gaviao-real':'garra','vira-lata-caramelo':'mordida','sanfoneiro-do-forro':'estouro',
  'pe-de-maracuja':'chicote','formiga-carregadeira':'mordida','louva-a-deus':'garra','abelha-rainha':'ferrao','vaga-lume-piscante':'raio',
  'perereca-grudenta':'chicote','sapo-cururu':'respingo','cagado-ranzinza':'mordida','sucuri-do-charco':'chicote',
  'bezerro-manhoso':'chifrada','jegue-carregador':'pisao','porco-comilao':'mordida','vaqueiro-aboiador':'chicote','boi-bumba':'chifrada',
  'filhote':'bicada','zangao':'ferrao','girino':'respingo'
};
const FX_COR_ATQ={'vaga-lume-piscante':'#FFF27A','sanfoneiro-do-forro':'#F2C230','pe-de-maracuja':'#9BD34B','perereca-grudenta':'#9BD34B','sucuri-do-charco':'#3E8E3A','vaqueiro-aboiador':'#A0673A','sapo-cururu':'#7FCF5A','girino':'#5FC0B4','gaviao-real':'#FFD35A','rei-milhao':'#FFD35A','joaninha-curandeira':'#FF7A8A','guardia-florada':'#F49AC1','libelula-faisca':'#7FE8FF','macieira-ancia':'#E0565B','cerejas-gemeas':'#C4362F','sapinho-verruguento':'#7FCF5A','rainha-das-ras':'#3BA39A','velho-lodao':'#6B5530','touro-trovao':'#BFE6FA','pipoqueiro-explosivo':'#FFF4D0'};
function fxEstiloDe(id){return FX_ESTILO[id]||(typeof CARD!=='undefined'&&CARD[id]&&CARD[id].golpe)||'investida';}
const FX_CORPO=new Set(['garra','bicada','chifrada','investida','pisao','mordida']);
const FX_LAG=22;
/* v7: onde ficam os pés de um personagem (ou do lugar vazio de um terreno), em coordenadas da tela */
function fxPes(el){
  if(!el||!el.isConnected)return null;
  if(fxEhCorpo(el)){const f=fxCorpo(el).getBoundingClientRect();if(!f.width)return null;return {x:f.left+f.width/2,y:f.top+f.height*0.9375,w:f.width,h:f.height};}
  const c=el.querySelector?el.querySelector('.chao'):null;const r=(c||el).getBoundingClientRect();if(!r.width)return null;
  const sp=parseFloat(getComputedStyle(el).getPropertyValue('--spr'))||r.width;
  return {x:r.left+r.width/2,y:c?r.top+r.height/2:r.bottom,w:sp,h:sp};
}
/* o golpe chegando (efeito de cada estilo no ponto do impacto) */
function fxGolpeCorpo(estilo,id,ix,iy,b,cor,ang){
  if(estilo==='garra')fxO({tipo:'garra',x:ix,y:iy,ang:ang+0.9,len:Math.min(b.w,90)*0.8,c:fxHex(cor==='#FFFFFF'?'#FF7A6A':cor,0.9),dur:300});
  else if(estilo==='bicada'){fxEstrela(ix,iy,22,'#FFFFFF',{n:5,dur:200});for(let i=0;i<6;i++)fxP({k:'feather',x:ix,y:iy,vx:(fxR()-0.5)*160,vy:-40-fxR()*90,g:120,drag:2.5,max:1.1,sz:5,c:fxR()<0.5?'#FFFFFF':'#2A2A3A',c2:'rgba(0,0,0,.3)',rot:fxR()*3,vr:(fxR()-0.5)*6,bal:[5,6,fxR()*6]});}
  else if(estilo==='mordida'){fxO({tipo:'mordida',x:b.x,y:b.y,r:Math.min(b.w,84)*0.42,dur:360});setTimeout(()=>{fxEstrela(b.x,b.y,18,'#FFFFFF',{n:4,dur:180});fxFaiscas(b.x,b.y,8,['#FFFFFF','#FFE1D2'],{vel:200,g:300});},150);}
  else if(estilo==='pisao'){const py=Math.min(b.b-4,iy+b.h*0.35);fxAnel(b.x,py,8,Math.min(b.w,100)*0.9,'#F4E3B5',420,{w:5});fxAnel(b.x,py,6,Math.min(b.w,100)*0.6,'#FFFFFF',300,{w:3,atraso:50});fxPoeira(b.x,py,b.w,10);
    for(let i=0;i<9;i++)fxP({k:'px',x:b.x+(fxR()-0.5)*b.w*0.6,y:py,vx:(fxR()-0.5)*220,vy:-90-fxR()*170,g:950,max:0.75,sz:3+fxR()*2,c:fxR()<0.5?'#8E5C33':'#6A4224',rot:fxR()*3,vr:(fxR()-0.5)*12});fxTremor(1);}
  else{fxAnel(ix,iy,6,Math.min(b.w,90)*0.6,'#FFFFFF',300,{w:4,ry:1});fxPoeira(ix,iy+b.h*0.2,b.w,estilo==='chifrada'?8:5);for(let i=0;i<7;i++)fxP({k:'px',x:ix,y:iy,vx:(fxR()-0.5)*260,vy:-60-fxR()*160,g:900,max:0.7,sz:3+fxR()*2,c:fxR()<0.5?'#8E5C33':'#6A4224',rot:fxR()*3,vr:(fxR()-0.5)*12});}
  // faíscas do choque (os dois se pegando)
  fxFaiscas(ix,iy,8,['#FFFFFF','#FFE58A',cor],{vel:240,g:420,sz:2.2});
}
function fxDisparo(estilo,id,x0,y0,ix,iy,voo,dist,cor,rgb,P){
  if(estilo==='raio'){fxO({tipo:'raio',x0,y0,x1:ix,y1:iy,rgb,dur:300,amp:10});fxP({k:'glow',x:x0,y:y0,max:0.25,sz:22,c:fxHex(cor,0.9),add:true});}
  else if(estilo==='ferrao')fxO({tipo:'proj',forma:'ferrao',x0,y0,x1:ix,y1:iy,dur:voo,ease:'in',trilha:'glow',c:'#F2C230'});
  else if(estilo==='chicote'){const verde=CARD[id]&&CARD[id].terreno!=='pasto'&&CARD[id].terreno!=='neutro';fxO({tipo:'chicote',x0,y0,x1:ix,y1:iy,dur:voo+260,curva:P==='p'?0.3:-0.3,c:verde?'#4E9A3A':'#A0673A',c2:verde?'#BDF29A':'#F4E3B5',folhas:verde?'#9BD34B':null});}
  else if(estilo==='estouro')fxO({tipo:'proj',forma:'bolha',x0,y0,x1:ix,y1:iy,arco:Math.min(70,dist*0.35),dur:voo,c:fxHex(cor,0.9),sz:13,trilha:'glow'});
  else if(estilo==='pipoca'){const cp=id==='pipoqueiro-explosivo'?'#FFF8E0':cor;for(let i=0;i<3;i++)fxO({tipo:'proj',forma:id==='pipoqueiro-explosivo'?'pipoca':'gota',x0:x0+(i-1)*8,y0,x1:ix+(i-1)*10,y1:iy+(fxR()-0.5)*10,arco:40+i*14,dur:voo-i*25,atraso:i*35,c:cp,sz:id==='pipoqueiro-explosivo'?10:8});}
  else fxO({tipo:'proj',forma:'gota',x0,y0,x1:ix,y1:iy,arco:Math.min(80,dist*0.3),dur:voo,c:cor,sz:11,trilha:'gota'});
}
function fxDisparoImpacto(estilo,id,ix,iy,b,cor){
  if(estilo==='pipoca'){for(let i=0;i<10;i++){const an=fxR()*6.283;fxP({k:id==='pipoqueiro-explosivo'?'pop':'dot',x:ix,y:iy,vx:Math.cos(an)*180,vy:Math.sin(an)*180-60,g:700,max:0.6,sz:id==='pipoqueiro-explosivo'?7:4,c:id==='pipoqueiro-explosivo'?'#FFF8E0':cor,c2:'#F2C230'});}fxEstrela(ix,iy,20,'#FFF4C0');}
  else if(estilo==='respingo'){for(let i=0;i<14;i++){const an=fxR()*6.283,sp=80+fxR()*200;fxP({k:'drop',x:ix,y:iy,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-60,g:900,max:0.6,sz:3+fxR()*4,c:cor});}fxAnel(ix,iy,4,Math.min(b.w,80)*0.55,fxHex(cor,0.9),360,{w:4,ry:1,add:false});}
  else if(estilo==='ferrao'){fxEstrela(ix,iy,16,'#FFE58A',{n:4});}
  else if(estilo==='chicote'){fxEstrela(ix,iy,22,'#FFFFFF',{n:4,dur:160});fxFaiscas(ix,iy,10,['#FFFFFF','#FFE58A'],{vel:260,g:200});}
  else if(estilo==='estouro'){fxAnel(ix,iy,6,Math.min(b.w,90)*0.65,fxHex(cor,1),380,{w:5,ry:1});fxEstrela(ix,iy,24,'#FFF4C0',{n:6});
    const notas=id==='sanfoneiro-do-forro';for(let i=0;i<10;i++){const an=fxR()*6.283,sp=120+fxR()*160;fxP(notas&&i%2?{k:'nota',x:ix,y:iy,vx:Math.cos(an)*sp*0.6,vy:Math.sin(an)*sp*0.6-60,g:120,drag:1.5,max:0.9,sz:12,c:i%4?'#F2C230':'#FFFFFF',rot:(fxR()-0.5)*0.6}:{k:'px',x:ix,y:iy,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-60,g:500,max:0.7,sz:3.5,c:['#C4362F','#F2C230','#4A7FC1','#5DBB63'][i%4],rot:fxR()*3,vr:8});}}
  else{fxEstrela(ix,iy,26,fxHex(cor,1),{n:6});fxAnel(ix,iy,6,40,fxHex(cor,1),320,{w:3,ry:1});}
}
/* "Duelo!": plaquinha no ponto da briga quando os dois do mesmo terreno se atacam turno após turno */
function fxDueloTag(x,y,n){
  const camada=document.getElementById('fx');if(!camada)return;
  const d=document.createElement('div');d.className='fduelo';d.innerHTML=(typeof ic==='function'?ic('espada',14):'')+'<b>Duelo!</b>'+(n>=2?`<small>${n}º round</small>`:'');
  d.style.left=Math.round(x)+'px';d.style.top=Math.round(y)+'px';camada.appendChild(d);
  const fim=()=>d.remove();
  if(!d.animate){setTimeout(fim,1200);return;}
  d.animate(RM?[{opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.85},{opacity:0}]:[{transform:'translate(-50%,-50%) scale(.3) rotate(-8deg)',opacity:0},{transform:'translate(-50%,-50%) scale(1.15) rotate(3deg)',opacity:1,offset:.14},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:.24},{transform:'translate(-50%,-60%) scale(1)',opacity:1,offset:.8},{transform:'translate(-50%,-90%) scale(.9)',opacity:0}],{duration:1300,easing:'ease-out'}).onfinish=fim;
}
/* v7: A BRIGA. O personagem sai do lugar dele, corre (aos pulinhos) pelo chão do meio até o alvo — encolhendo quando vai
   para longe (fila do rival) e crescendo quando vem para perto —, para de frente para ele, prepara o golpe e bate
   (pose 'atk' no impacto); quem apanha faz 'hit' e é empurrado para trás (fxImpacto); depois o atacante volta correndo.
   Golpes à distância: dá uns pulos até o meio do campo e dispara de lá. Ataque no herói: corre até a beira do cenário,
   embaixo do retrato do rival (ou, no ataque do rival, até a beira de baixo, perto do seu retrato).
   Resolve no instante do impacto (o motor aplica o dano aí); a volta continua sozinha até FX.atkAte. */
async function fxAtaque(P,lane,alvo,estilo,o){
  o=o||{};
  const el=fxPecaEl(P,lane);if(!el)return;
  const id=el.dataset.id;estilo=estilo||fxEstiloDe(id);
  const heroi=alvo==='heroi';
  const tgt=heroi?fxHeroiEl(fxOpp(P)):(alvo&&(fxPecaEl(alvo.side,alvo.lane)||fxLaneEl(alvo.side,alvo.lane)));
  if(RM||!el.animate||!fxCanvas()||!fxEhCorpo(el)){try{fxVis(el).animate([{filter:'brightness(1.7)'},{filter:'none'}],{duration:160});}catch(e){}await fxEsp(120);return;}
  const a=fxPes(el),fig=fxCorpo(el),cv=fxVis(el);
  if(!a||!tgt){await fxEsp(120);return;}
  const ln=fxLaneEl(P,lane);
  const cor=FX_COR_ATQ[id]||(typeof TERR_COR!=='undefined'&&TERR_COR[(typeof CARD!=='undefined'&&CARD[id]&&CARD[id].terreno)])||'#FFFFFF',rgb=fxRgb(cor);
  const melee=FX_CORPO.has(estilo),longe=P==='p'?-1:1; // para onde fica o lado do rival na tela (cima/baixo)
  // de que lado do alvo o atacante para: do lado de dentro do campo (as duas pontas não saem da tela)
  const lado=lane<=1?1:-1;
  let D,s1,b,ix,iy,tp=null;
  if(heroi){
    const sp=fxPes(fxLaneEl(fxOpp(P),lane)),hr=fxRect(tgt);if(!sp||!hr){await fxEsp(120);return;}
    b=hr;
    if(P==='p')D={x:sp.x+(hr.x-sp.x)*0.3,y:Math.max(hr.b+sp.w*0.62,sp.y-sp.w*0.34)};
    else D={x:sp.x+(hr.x-sp.x)*0.12,y:Math.min(sp.y+sp.w*0.22,hr.t+sp.w*0.2)};
    s1=sp.w/a.w*(P==='p'?0.96:1.06);
    ix=hr.x;iy=hr.y;
  }else{
    tp=fxPes(tgt);b=fxRect(tgt);if(!tp||!b){await fxEsp(120);return;}
    D={x:tp.x+lado*tp.w*0.4,y:tp.y-longe*tp.w*0.05};
    s1=tp.w/a.w;
    ix=b.x+lado*b.w*0.2;iy=b.y;
  }
  if(!melee){D={x:a.x+(D.x-a.x)*0.42,y:a.y+(D.y-a.y)*0.42};s1=1+(s1-1)*0.42;}
  const dx=D.x-a.x,dy=D.y-a.y,dist=Math.hypot(dx,dy)||1;
  // direção do golpe (de onde o atacante para até o alvo)
  const cx=D.x,cy=D.y-a.h*s1*0.36,gx=ix-cx,gy=iy-cy,gl=Math.hypot(gx,gy)||1,ux=gx/gl,uy=gy/gl;
  const forte=!!o.forte,duelo=o.duelo|0;
  const run=melee?Math.round(Math.max(260,Math.min(440,dist*0.95))):Math.round(Math.max(170,Math.min(300,dist*1.1)));
  const wind=melee?(estilo==='chifrada'?140:estilo==='pisao'?150:110):120;
  const voo=melee?0:(estilo==='raio'?90:Math.max(150,Math.min(300,gl/1.6)));
  const strike=melee?(estilo==='bicada'?60:80):voo;
  const tImp=run+wind+strike,hold=melee?(forte?150:110):70;
  const back=Math.round(Math.max(220,Math.min(380,dist*0.8)));
  const tot=tImp+hold+back,t0=fxAgora();
  FX.atkAte=t0+tot+40;
  FX.duelo=!heroi&&tgt&&fxEhCorpo(tgt)?{def:tgt,lado,ate:t0+tot+400}:null;
  if(ln)ln.classList.add('fx-atk');
  const som=(n,v,ms)=>setTimeout(()=>{try{sfx(n,v);}catch(e){}},ms);
  // ---- o caminho no chão (o corpo e a sombra): corre, prepara, bate, segura e volta ----
  const T=(x,y,s)=>`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
  const fk=[];const kf=(ms,tr,ease)=>fk.push({transform:tr,offset:Math.min(1,Math.max(0,ms/tot)),easing:ease||'linear'});
  kf(0,T(0,0,1),'cubic-bezier(.45,0,.55,1)');
  kf(run,T(dx,dy,s1),'cubic-bezier(.3,0,.7,1)');
  if(melee){kf(run+wind,T(dx-ux*9*s1,dy-uy*9*s1,s1*1.02),'cubic-bezier(.6,0,.9,.5)');kf(tImp,T(dx+ux*12*s1,dy+uy*12*s1,s1*1.05),'linear');kf(tImp+hold,T(dx+ux*5*s1,dy+uy*5*s1,s1),'cubic-bezier(.45,0,.55,1)');}
  else{kf(run+wind,T(dx-ux*6*s1,dy-uy*6*s1,s1),'ease-out');kf(run+wind+60,T(dx+ux*5*s1,dy+uy*5*s1,s1*1.03),'linear');kf(tImp+hold,T(dx,dy,s1),'cubic-bezier(.45,0,.55,1)');}
  kf(tot,T(0,0,1));
  try{fig.animate(fk,{duration:tot});}catch(e){}
  // ---- os pulinhos e o estica-e-puxa do corpo (o canvas), a sombra fica no chão ----
  const hop=Math.max(6,a.h*0.13),ck=[];const ckf=(ms,tr,ease)=>ck.push({transform:tr,offset:Math.min(1,Math.max(0,ms/tot)),easing:ease||'linear'});
  const pulos=(t0,dur,n)=>{const d=dur/n;for(let i=0;i<n;i++){ckf(t0+d*i,'translateY(0) scale(1.08,.92)','cubic-bezier(.2,.6,.4,1)');ckf(t0+d*i+d*0.5,`translateY(${(-hop).toFixed(1)}px) scale(.95,1.06)`,'cubic-bezier(.6,0,.8,.4)');}};
  ckf(0,'none','ease-out');
  pulos(40,run-40,Math.max(2,Math.round(run/140)));
  ckf(run,'translateY(0) scale(1.1,.9)','ease-out');
  if(melee){ckf(run+wind,`translateY(2px) scale(1.12,.88) rotate(${(-ux*6).toFixed(1)}deg)`,'cubic-bezier(.5,0,1,.6)');ckf(tImp,`translateY(-4px) scale(.94,1.08) rotate(${(ux*10).toFixed(1)}deg)`,'ease-out');}
  else{ckf(run+wind,'translateY(2px) scale(1.1,.9)','ease-out');ckf(run+wind+60,'translateY(-5px) scale(.95,1.06)','ease-out');}
  ckf(tImp+hold,'none','linear');
  pulos(tImp+hold+20,back-60,Math.max(2,Math.round(back/140)));
  ckf(tot-30,'translateY(0) scale(1.06,.94)','ease-out');ckf(tot,'none');
  try{cv.animate(ck,{duration:tot});}catch(e){}
  const sh=fig.querySelector('.sh');if(sh)try{sh.animate([{opacity:1},{opacity:.7,offset:0.5},{opacity:1}],{duration:tot});}catch(e){}
  // ---- de frente um para o outro: vira o atacante para o alvo; o alvo vira para o atacante e se prepara ----
  const viraA=gx<-2,dEl=FX.duelo?FX.duelo.def:null,dCv=dEl?fxVis(dEl):null,viraD=dEl&&lado<0;
  setTimeout(()=>{if(cv.isConnected)cv.style.scale=viraA?'-1 1':'';},Math.round(run*0.55));
  if(dCv&&dCv!==cv)setTimeout(()=>{if(!dCv.isConnected)return;dCv.style.scale=viraD?'-1 1':'';
    try{dCv.animate([{transform:'none'},{transform:'translateY(2px) scale(1.06,.93)',offset:0.5},{transform:'none'}],{duration:Math.max(160,wind+strike),composite:'add'});}catch(e){}},Math.round(run*0.8));
  setTimeout(()=>{if(cv.isConnected)cv.style.scale='';if(dCv&&dCv.isConnected&&!(dEl&&dEl.dataset.morto))dCv.style.scale='';if(ln)ln.classList.remove('fx-atk');},tot+20);
  // a pose de ataque do desenho começa quando ele chega
  setTimeout(()=>sprAcao(el,'atk',0,[[0,0],[wind,0.35],[wind+strike,0.47],[wind+strike+hold,0.56],[wind+strike+hold+220,1]]),run);
  // ---- poeira de cada passada, linhas de velocidade, rastro de imagens ----
  fxPoeira(a.x,a.y,a.w*0.6,4);
  {const n=Math.max(2,Math.round(run/140)),d=(run-40)/n;for(let i=1;i<=n;i++){const f=Math.min(1,(40+d*i)/run),e=f<0.5?2*f*f:1-Math.pow(-2*f+2,2)/2;setTimeout(()=>fxPoeira(a.x+dx*e,a.y+dy*e,a.w*(1+(s1-1)*e)*0.5,2),Math.round(40+d*i));}}
  {const n=Math.max(2,Math.round(back/140)),d=(back-60)/n;for(let i=1;i<=n;i++){const f=Math.min(1,(20+d*i)/back),e=f<0.5?2*f*f:1-Math.pow(-2*f+2,2)/2;setTimeout(()=>fxPoeira(D.x-dx*e,D.y-dy*e,a.w*(s1+(1-s1)*e)*0.5,2),Math.round(tImp+hold+20+d*i));}}
  {const mx=dx/dist,my=dy/dist,v=dist/(run/1000);for(let i=0;i<6;i++){const s=i%2?1:-1,off=(a.w*0.32+fxR()*8)*s;fxP({k:'streak',x:a.x-my*off,y:a.y-a.h*0.3+mx*off,vx:mx*v*0.9,vy:my*v*0.9,max:run/1000*0.7,sz:2,len:18+fxR()*14,c:i%3?'rgba(255,255,255,.75)':fxHex(cor,0.85),add:true,atraso:0.03+fxR()*0.08});}}
  fxO({tipo:'fantasma',el:cv,cv,card:fig,h:[],rgb,dur:run+40,atraso:40});
  if(estilo==='bicada')for(let i=0;i<3;i++)fxP({k:'feather',x:a.x+(fxR()-0.5)*a.w*0.4,y:a.y-a.h*0.4,vx:(fxR()-0.5)*60,vy:-20-fxR()*40,g:60,drag:2,max:1,sz:5,c:'#FFFFFF',rot:fxR()*3,vr:(fxR()-0.5)*5,bal:[5,6,fxR()*6]});
  // ---- duelo: o resto do campo escurece em volta dos dois e a plaquinha aparece ----
  if(duelo>=2&&tp){const mx=(tp.x+D.x)/2,my=Math.min(tp.y,D.y)-Math.max(tp.w,a.w*s1)*0.75;
    fxO({tipo:'escuro',a:0.34,kin:0.18,kout:0.8,x:(tp.x+D.x)/2,y:(tp.y+D.y)/2-tp.w*0.35,r:Math.max(110,tp.w*1.5),dur:tot+200,atraso:Math.round(run*0.5)});
    setTimeout(()=>fxDueloTag(mx,Math.max(18,my),duelo),Math.round(run*0.7));}
  // ---- o golpe ----
  som('golpe',estilo,run+wind-30);
  if(!melee){
    setTimeout(()=>{const x0=D.x+ux*a.w*s1*0.18,y0=D.y-a.h*s1*0.42;fxDisparo(estilo,id,x0,y0,ix,iy,voo,gl,cor,rgb,P);},run+wind);
    setTimeout(()=>{fxDisparoImpacto(estilo,id,ix,iy,b,cor);som('impacto',estilo,0);},tImp);
  }else{
    setTimeout(()=>{
      fxGolpeCorpo(estilo,id,ix,iy,b,cor,Math.atan2(uy,ux));
      if(id==='touro-trovao')fxO({tipo:'raio',x0:cx,y0:cy,x1:ix,y1:iy,rgb:'191,230,250',dur:240,amp:12});
      if(forte)fxTremor(1);
      som('impacto',estilo,0);
    },tImp+FX_LAG);
  }
  await fxEsp(tImp+(melee?FX_LAG:0));
}

/* ---------- impacto, número de dano, morte, cura, buff, bloqueio ---------- */
function fxNumero(el,txt,tipo,o){
  o=o||{};const r=fxRect(el);const camada=document.getElementById('fx');if(!r||!camada)return;
  const d=document.createElement('div');d.className='fnum f-'+(tipo||'dano')+(o.grande?' grande':'');d.textContent=txt;
  d.style.left=Math.round(r.x+(o.dx||0))+'px';d.style.top=Math.round(r.y+(o.dy||0))+'px';camada.appendChild(d);
  const fim=()=>d.remove();
  if(RM||!d.animate){if(d.animate){const an=d.animate([{opacity:0},{opacity:1,offset:0.2},{opacity:1,offset:0.8},{opacity:0}],{duration:700});an.onfinish=fim;}else setTimeout(fim,700);return;}
  const lado=(fxR()-0.5)*22,sobe=tipo==='dano'?-34:-30;
  const an=d.animate([
    {transform:'translate(-50%,-50%) scale(.3)',opacity:0},
    {transform:`translate(calc(-50% + ${lado*0.4}px),calc(-50% - 14px)) scale(${o.grande?1.6:1.35})`,opacity:1,offset:0.16},
    {transform:`translate(calc(-50% + ${lado*0.7}px),calc(-50% + ${sobe*0.55}px)) scale(1)`,opacity:1,offset:0.42},
    {transform:`translate(calc(-50% + ${lado}px),calc(-50% + ${sobe}px)) scale(.95)`,opacity:0}],{duration:o.dur||900,easing:'cubic-bezier(.2,.8,.3,1)'});
  an.onfinish=fim;
}
function fxImpacto(el,n,o){
  o=o||{};n=n|0;
  if(!el)return;
  fxNumero(el,n>0?'-'+n:'0',n>0?'dano':'blk',{grande:n>=3});
  fxPisca(el,o.heroi?2.2:2.6,RM?160:200);
  if(fxEhCorpo(el)&&n>0)sprAcao(el,'hit',n>=3?420:320);
  if(RM||!fxCanvas())return;
  const r=fxRect(el);if(!r)return;
  if(fxEhCorpo(el)&&!o.semTremer){
    // v7: quem apanha é EMPURRADO para trás (para longe de quem bateu), com poeira nos pés
    const D=FX.duelo&&FX.duelo.def===el&&fxAgora()<FX.duelo.ate?FX.duelo:null;
    const ln=el.closest?el.closest('.lane'):null,tras=ln&&ln.dataset.side==='r'?-1:1,lado=D?D.lado:0;
    const s=Math.min(18,7+n*2.2),kx=-lado*s,ky=tras*s*(lado?0.45:0.8),rot=(lado?-lado:(fxR()<0.5?-1:1))*Math.min(14,6+n*2);
    try{fxCorpo(el).animate([{transform:'none'},{transform:`translate(${kx.toFixed(1)}px,${ky.toFixed(1)}px) rotate(${rot}deg)`,offset:0.22,easing:'cubic-bezier(.2,.7,.4,1)'},{transform:`translate(${(kx*0.75).toFixed(1)}px,${(ky*0.75).toFixed(1)}px) rotate(${(rot*0.3).toFixed(1)}deg)`,offset:0.62,easing:'ease-in-out'},{transform:'none'}],{duration:n>=3?520:440,composite:'add'});}catch(e){}
    const pe=fxPes(el);if(pe){setTimeout(()=>fxPoeira(pe.x+kx*0.6,pe.y+ky*0.6,pe.w*0.55,n>=3?7:5),60);}
  }
  else if(el.animate&&!o.semTremer){const s=Math.min(8,3+n);el.animate([{transform:'none'},{transform:`translate(${-s}px,${s*0.3}px)`},{transform:`translate(${s}px,${-s*0.3}px)`},{transform:`translate(${-s*0.5}px,0)`},{transform:'none'}],{duration:220,composite:'add'});}
  const cores=o.thorn?['#BDF29A','#6CB843','#FFFFFF']:['#FFFFFF','#FFE58A','#FF9A5A'];
  fxFaiscas(r.x,r.y,Math.min(22,6+n*3),cores,{vel:220+n*30});
  fxEstrela(r.x,r.y,Math.min(46,16+n*5),o.thorn?'#BDF29A':'#FFF4C0',{n:o.thorn?6:8});
  if(o.thorn)for(let i=0;i<6;i++){const an=fxR()*6.283;fxP({k:'blade',x:r.x,y:r.y,vx:Math.cos(an)*200,vy:Math.sin(an)*200,max:0.35,sz:7,c:'#6CB843',rot:an+1.57});}
  if(n>=3){fxAnel(r.x,r.y,8,Math.min(r.w,110)*0.9,'#FFF4C0',360,{w:4,ry:1});fxTremor(n>=6?3:n>=4?2:1);}
  if(o.heroi){
    fxTremor(Math.max(1,Math.min(3,Math.ceil(n/3))));
    fxAnel(r.x,r.y,6,r.w*1.1,'#FF7A6A',420,{w:4,ry:1});
    for(let i=0;i<8;i++){const an=fxR()*6.283;fxP({k:'px',x:r.x,y:r.y,vx:Math.cos(an)*200,vy:Math.sin(an)*200-60,g:600,max:0.6,sz:3,c:i%2?'#FF5A4A':'#FFE1D2'});}
  }
}
function fxMorte(el,terr){
  if(!el||!el.isConnected||el.dataset.morto)return;
  el.dataset.morto='1';
  terr=terr||fxTerr(el);
  try{sfx('quebra');}catch(e){}
  if(RM||!el.animate||!fxCanvas()){try{el.animate([{opacity:1},{opacity:0}],{duration:200,fill:'forwards'});}catch(e){el.style.opacity='0';}return;}
  const afundou=el.dataset.afundou==='1';
  const corpo=fxEhCorpo(el);if(corpo){sprAcao(el,'hit',400);const E=sprDe(el);if(E){sprDesenhar(E,performance.now()+40);E.congelado=true;}}
  const cv=el.querySelector('canvas.spr')||el.querySelector('canvas.art');const r=fxRect(cv||el),rc=fxRect(el);if(!r||!rc)return;
  if(corpo&&!afundou&&cv){
    // v7: o personagem CAI no chão (tomba para longe de quem bateu) e depois se desfaz em pixels que sobem
    const D=FX.duelo&&FX.duelo.def===el&&fxAgora()<FX.duelo.ate?FX.duelo:null;
    const dir=D?-D.lado:(fxR()<0.5?-1:1),ang=dir*82,th=ang*Math.PI/180;
    const r0=cv.getBoundingClientRect(),px0=r0.left+r0.width/2,py0=r0.top+r0.height*0.94;
    let px=null;try{px=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;}catch(e){px=null;}
    try{cv.animate([{transform:'none',filter:'none'},{transform:`translateY(-12%) rotate(${-dir*12}deg)`,filter:'brightness(2.2) saturate(.4)',offset:0.28,easing:'cubic-bezier(.5,0,.9,.6)'},{transform:`translateY(-2%) rotate(${ang}deg) scale(1,.94)`,filter:'brightness(1.1) saturate(.5)',offset:0.86},{transform:`translateY(0) rotate(${ang}deg) scale(1.02,.9)`,filter:'brightness(1.1) saturate(.4)'}],{duration:320,fill:'forwards'});}catch(e){}
    el.animate([{opacity:1},{opacity:1,offset:0.55},{opacity:0}],{duration:700,fill:'forwards'});
    setTimeout(()=>{
      if(cv.isConnected)cv.style.visibility='hidden';
      const pf=fxPes(el)||{x:px0,y:py0,w:r0.width};
      fxPoeira(px0+dir*r0.width*0.25,py0,r0.width*0.7,8,terr==='brejo'?'rgba(120,180,170,.5)':null);
      if(px){
        const livre=Math.max(60,FX_MAX-FX.ps.length+40),passo=Math.max(3,Math.ceil(Math.sqrt(cv.width*cv.height/Math.min(170,livre))));
        const sx=r0.width/cv.width,sy=r0.height/cv.height,tam=Math.max(2.5,passo*sx*0.95),co=Math.cos(th),si=Math.sin(th);
        for(let y=0;y<cv.height;y+=passo)for(let x=0;x<cv.width;x+=passo){
          const i=((y+(passo>>1))*cv.width+(x+(passo>>1)))*4;if(i>=px.length||px[i+3]<40)continue;
          const X=r0.left+(x+passo/2)*sx-px0,Y=r0.top+(y+passo/2)*sy-py0;
          const RX=px0+X*co-Y*si,RY=py0+X*si+Y*co;
          const k=Math.hypot(X,Y)/Math.max(1,r0.height);
          fxP({k:'px',x:RX,y:RY,vx:(fxR()-0.5)*50,vy:-25-fxR()*70,g:-30,drag:0.6,max:0.75+fxR()*0.55,sz:tam,c:`rgb(${px[i]},${px[i+1]},${px[i+2]})`,rot:0,vr:(fxR()-0.5)*5,atraso:k*0.35+fxR()*0.05});
        }
      }
      const cor=(typeof RAR_LUZ!=='undefined'&&CARD[el.dataset.id]&&RAR_LUZ[CARD[el.dataset.id].rar])||'#FFFFFF';
      for(let i=0;i<6;i++)fxP({k:'glow',x:px0+dir*r0.width*0.2+(fxR()-0.5)*r0.width*0.4,y:py0-6,vx:(fxR()-0.5)*20,vy:-70-fxR()*50,drag:0.5,max:0.8+fxR()*0.3,sz:5+fxR()*4,c:fxHex(cor,0.8),add:true,atraso:0.1+fxR()*0.2,fadeIn:true});
      fxSabor(terr,pf.x,pf.y,r0.width*0.7,8,{forca:0.7});
    },300);
    return;
  }
  if(!afundou&&cv){
    // a arte se desfaz nos próprios pixels
    let px=null;try{px=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;}catch(e){px=null;}
    if(px){
      const livre=Math.max(60,FX_MAX-FX.ps.length+40),passo=Math.max(3,Math.ceil(Math.sqrt(cv.width*cv.height/Math.min(170,livre))));
      const sx=r.w/cv.width,sy=r.h/cv.height,tam=Math.max(2.5,passo*sx*0.95);
      for(let y=0;y<cv.height;y+=passo)for(let x=0;x<cv.width;x+=passo){
        const i=((y+(passo>>1))*cv.width+(x+(passo>>1)))*4;if(i>=px.length||px[i+3]<40)continue;
        const X=r.l+(x+passo/2)*sx,Y=r.t+(y+passo/2)*sy,an=Math.atan2(Y-r.y,X-r.x),sp=60+fxR()*170;
        fxP({k:'px',x:X,y:Y,vx:Math.cos(an)*sp+(fxR()-0.5)*40,vy:Math.sin(an)*sp-90-fxR()*80,g:620,drag:0.4,max:0.65+fxR()*0.45,sz:tam,c:`rgb(${px[i]},${px[i+1]},${px[i+2]})`,rot:0,vr:(fxR()-0.5)*8,atraso:fxR()*0.06});
      }
    }
    fxEstrela(r.x,r.y,26,'#FFFFFF',{n:6,dur:180});
  }
  // o terreno engole o resto
  const pe={x:rc.x,y:rc.b-4};
  fxPoeira(pe.x,pe.y,rc.w,6,terr==='brejo'?'rgba(120,180,170,.5)':null);
  fxSabor(terr,pe.x,pe.y,rc.w,8,{forca:0.8});
}
function fxCura(el,n){
  if(!el)return;fxNumero(el,'+'+n,'cura');
  if(RM||!fxCanvas()){fxPisca(el,1.5,240);return;}
  const r=fxRect(el);if(!r)return;
  {const v=fxVis(el);if(v.animate)v.animate([{filter:'none'},{filter:'brightness(1.5) drop-shadow(0 0 6px #7FE07F)'},{filter:'none'}],{duration:520});}
  fxAnel(r.x,r.b-4,6,r.w*0.75,'#7FE07F',520,{w:3});
  for(let i=0;i<10;i++)fxP({k:'plus',x:r.x+(fxR()-0.5)*r.w*0.8,y:r.y+r.h*0.2-fxR()*r.h*0.3,vx:(fxR()-0.5)*10,vy:-50-fxR()*50,max:0.8+fxR()*0.3,sz:6+fxR()*3,c:fxR()<0.5?'#9BFF8A':'#E2FFE0',atraso:fxR()*0.2,fadeIn:true});
}
function fxBuff(el,txt,o){
  o=o||{};if(!el)return;
  if(txt)fxNumero(el,txt,o.neg?'debuff':'buff',{dy:-8});
  if(RM||!fxCanvas()){fxPisca(el,1.4,240);return;}
  const r=fxRect(el);if(!r)return;
  const cor=o.cor||(o.neg?'#B07ACF':'#FFD35A');
  {const v=fxVis(el);if(v.animate)v.animate([{filter:'none',transform:'none'},{filter:`brightness(1.45) drop-shadow(0 0 7px ${cor})`,transform:fxEhCorpo(el)?'translateY(-4%) scale(1.08)':'scale(1.06)'},{filter:'none',transform:'none'}],{duration:480,composite:'add'});}
  for(let i=0;i<7;i++)fxP({k:'chev',x:r.x+(fxR()-0.5)*r.w*0.7,y:o.neg?r.t+r.h*0.2:r.b-r.h*0.15,vx:0,vy:o.neg?40+fxR()*30:-60-fxR()*40,max:0.7,sz:9,c:cor,baixo:!!o.neg,atraso:i*0.05,fadeIn:true,add:!o.neg});
  if(!o.neg)fxAnel(r.x,r.b-4,4,r.w*0.6,cor,420,{w:3});
}
function fxBloqueio(el){
  if(!el)return;fxNumero(el,'0','blk');
  try{sfx('block');}catch(e){}
  if(fxEhCorpo(el))sprAcao(el,'hit',220);
  if(RM||!fxCanvas()){fxPisca(el,1.6,200);return;}
  const r=fxRect(el);if(!r)return;
  fxO({tipo:'escudo',x:r.x,y:r.y,r:Math.min(r.w,r.h)*0.5,rgb:'191,230,250',dur:420});
  fxFaiscas(r.x,r.y-r.h*0.2,10,['#FFFFFF','#BFE6FA'],{vel:240,g:500});
}
/* debuff (Lodo Pegajoso) */
function fxDebuff(el,txt){fxBuff(el,txt,{neg:true});}

/* ---------- combos e auras ---------- */
async function fxCombo(P,lanes,nome,cor,o){
  o=o||{};cor=cor||'#7FE0FF';lanes=(lanes||[]).filter(i=>i>=0&&i<4);
  let els=lanes.map(i=>fxPecaEl(P,i)||fxLaneEl(P,i)).filter(Boolean);
  // dupla "no mesmo terreno": a ponte vai da criatura até a placa da construção
  if(els.length===1&&lanes.length===1){const bs=fxLaneEl(P,lanes[0]);const b=bs&&bs.querySelector('.bs.has');if(b)els=[b,els[0]];}
  if(nome)fxBanner(nome,'dupla',{cor,sub:o.sub,icHTML:o.icHTML,extraHTML:o.extraHTML,ancora:fxPainel(P)});
  try{sfx('combo');}catch(e){}
  if(RM||!els.length||!fxCanvas()){els.forEach(e=>fxPisca(e,1.6,400));await fxEsp(RM?400:300);return;}
  const pts=els.map(e=>fxRect(e)).filter(Boolean).map(r=>({x:r.x,y:r.y}));
  if(pts.length>=2)fxO({tipo:'corrente',pts,rgb:fxRgb(cor),dur:1400,kin:0.3});
  fxClarao(fxRgb(cor),0.12,380);
  pts.forEach((p,i)=>{setTimeout(()=>{fxAnel(p.x,p.y,8,52,cor,560,{w:5,ry:1});fxAnel(p.x,p.y,6,34,'#FFFFFF',380,{w:2,ry:1,atraso:60});fxFaiscas(p.x,p.y,10,['#FFFFFF',cor],{vel:230,g:200});fxSobe(p.x,p.y+20,40,6,cor,{vel:60});const e=els[i];if(e&&e.animate)e.animate([{transform:'none'},{transform:'scale(1.12)'},{transform:'none'}],{duration:340,composite:'add'});},i*120);});
  // um "+" de luz no meio da ponte
  if(pts.length>=2){const mx=(pts[0].x+pts[1].x)/2,my=(pts[0].y+pts[1].y)/2;setTimeout(()=>{fxEstrela(mx,my,30,'#FFFFFF',{n:4,dur:320});fxP({k:'plus',x:mx,y:my,max:0.7,sz:18,c:fxHex(cor,1),vy:-30});},300);}
  await fxEsp(o.pressa?380:640);
}
/* painel do herói de cada lado (onde ficam as faixas de dupla e Combo) */
function fxPainel(P){return document.getElementById(P==='p'?'bInfo':'hR');}
function fxAura(P,lane,cor,on){
  const k=P+lane;if(on)FX.auras[k]=cor||'#7FE0FF';else delete FX.auras[k];
  fxAplicarAura(P,lane);
}
function fxAplicarAura(P,lane){
  const ln=fxLaneEl(P,lane);if(!ln)return;
  const cor=FX.auras[P+lane];let a=ln.querySelector('.aura');
  if(!a){if(!cor)return;a=document.createElement('span');a.className='aura';a.setAttribute('aria-hidden','true');const sl=ln.querySelector('[data-sl]');ln.insertBefore(a,sl||null);}
  if(cor){a.style.setProperty('--ac',cor);ln.style.setProperty('--ac',cor);}
  a.classList.toggle('on',!!cor);ln.classList.toggle('com-aura',!!cor);
}
/* chamado no fim de cada bRender: as auras sobrevivem a qualquer redesenho */
function fxSincronizar(){for(const P of ['p','r'])for(let i=0;i<4;i++)if(FX.auras[P+i]||(fxLaneEl(P,i)&&fxLaneEl(P,i).querySelector('.aura.on')))fxAplicarAura(P,i);}

/* ---------- v4: efeitos das regras novas (Grito, Ninhada, Acorda, Enraizada, Guarda, Couraça, Festa, Lua, Combo, Família) ---------- */
/* Grito: ondas que saem da carta e passam pelas outras criaturas do lado */
function fxGrito(P,lane,cor){
  const el=fxPecaEl(P,lane);if(!el)return;cor=cor||'#FFE58A';
  if(RM||!fxCanvas()){fxPisca(el,1.6,260);return;}
  const r=fxRect(el);if(!r)return;
  if(el.animate)el.animate([{transform:'none'},{transform:'scale(1.14) rotate(-3deg)'},{transform:'scale(1.06) rotate(3deg)'},{transform:'none'}],{duration:420,composite:'add'});
  for(let i=0;i<3;i++)fxAnel(r.x,r.y,10,Math.max(130,r.w*2.4),fxHex(cor,0.95),680,{w:5-i,ry:0.6,atraso:i*120});
  for(let i=0;i<12;i++){const lado=i%2?1:-1;fxP({k:'streak',x:r.x+lado*r.w*0.4,y:r.y-r.h*0.2+(fxR()-0.5)*r.h*0.5,vx:lado*(260+fxR()*160),vy:(fxR()-0.5)*70,drag:2,max:0.45,sz:2.5,len:16,c:i%3?fxHex(cor,0.95):'#FFFFFF',add:true,atraso:fxR()*0.15});}
  for(let j=0;j<4;j++){if(j===lane)continue;const o=fxPecaEl(P,j);if(!o||!o.animate)continue;o.animate([{transform:'none'},{transform:'translateY(-7px) scale(1.06)'},{transform:'none'}],{duration:320,delay:Math.abs(j-lane)*90,composite:'add'});}
}
/* Ninhada: um ovo voa de quem chocou até cada terreno e quebra; a ficha aparece logo depois (evento play) */
async function fxNinhada(P,de,para,ficha){
  const src=fxPecaEl(P,de)||fxLaneEl(P,de);
  const alvos=(para||[]).map(i=>fxLaneEl(P,i));
  try{sfx('ninhada',{ficha});}catch(e){}
  if(RM||!src||!alvos.some(Boolean)||!fxCanvas()){await fxEsp(RM?80:0);return;}
  const a=fxRect(src);if(!a)return;
  const cor=ficha==='zangao'?'#FFE066':ficha==='girino'?'#9FE4DA':'#F4E3B5',c2=ficha==='zangao'?'#B9801C':ficha==='girino'?'#3B8F86':'#A0673A';
  const dur=380;let n=0;
  alvos.forEach((ln,k)=>{if(!ln)return;const slot=ln.querySelector('[data-sl]')||ln;const b=fxRect(slot);if(!b)return;
    const mesmo=para[k]===de,x1=b.x,y1=b.b-b.h*0.32,at=n*100;n++;
    fxO({tipo:'proj',forma:'ovo',x0:mesmo?b.x:a.x,y0:mesmo?b.t:a.y,x1,y1,arco:mesmo?30:64,dur,atraso:at,c:cor,c2,sz:15,ease:'io'});
    setTimeout(()=>{for(let i=0;i<9;i++){const an=-Math.PI/2+(fxR()-0.5)*2.6,sp=120+fxR()*130;fxP({k:'ovo',x:x1,y:y1,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,g:800,max:0.6,sz:6,c:i%2?cor:'#FFFFFF',rot:fxR()*3,vr:(fxR()-0.5)*14});}
      fxEstrela(x1,y1,18,'#FFFFFF',{n:6,dur:180});fxAnel(x1,y1+6,4,b.w*0.5,fxHex(cor,0.9),360,{w:3});},dur+at);
  });
  await fxEsp(dur+Math.max(0,n-1)*100+40);
}
/* Acorda: "zZz" estourando + um clarão de sol */
function fxAcorda(P,lanes){
  const els=(lanes||[]).map(i=>fxPecaEl(P,i)).filter(Boolean);if(!els.length)return;
  if(RM||!fxCanvas()){els.forEach(e=>fxPisca(e,1.5,240));return;}
  fxClarao('255,229,138',0.16,420);
  els.forEach((el,k)=>{const r=fxRect(el);if(!r)return;
    ['z','Z','z'].forEach((t,i)=>fxP({k:'txt',txt:t,x:r.r-r.w*0.22+i*5,y:r.t+r.h*0.22,vx:(fxR()-0.5)*90+i*25,vy:-90-fxR()*60,g:-30,max:0.75,sz:12+i*3,c:'#BFE6FA',atraso:k*0.08+i*0.06}));
    fxEstrela(r.x,r.t+r.h*0.3,22,'#FFE58A',{n:8,atraso:k*80});fxSobe(r.x,r.b-6,r.w*0.7,6,'#FFE58A',{vel:60});
    if(el.animate)el.animate([{transform:'none',filter:'none'},{transform:'translateY(-9px) scale(1.06)',filter:'brightness(1.5)'},{transform:'none',filter:'none'}],{duration:380,delay:k*80,composite:'add'});
  });
}
/* Enraizada: cipós sobem pela carta (on) ou murcham (off); o selo fica na carta enquanto durar */
function fxRaiz(P,lane,on){
  const el=fxPecaEl(P,lane);if(!el)return;
  try{sfx('raiz',on);}catch(e){}
  if(RM||!fxCanvas()){fxPisca(el,1.4,220);return;}
  const r=fxRect(el);if(!r)return;
  fxO({tipo:'vinha',l:r.l,b:r.b-4,w:r.w,h:r.h,off:!on,dur:on?900:620});
  if(on){for(let i=0;i<8;i++)fxP({k:'petal',x:r.x+(fxR()-0.5)*r.w*0.8,y:r.b-6,vx:(fxR()-0.5)*60,vy:-60-fxR()*60,g:120,drag:2,max:0.8,sz:3.5,c:fxR()<0.5?'#9BD34B':'#4E9A3A',rot:fxR()*3,vr:6,atraso:0.2+fxR()*0.3});
    if(el.animate)el.animate([{transform:'none'},{transform:'translateY(3px) scale(1,.95)'},{transform:'none'}],{duration:420,delay:200,composite:'add'});}
  else for(let i=0;i<8;i++)fxP({k:'petal',x:r.x+(fxR()-0.5)*r.w*0.8,y:r.y,vx:(fxR()-0.5)*40,vy:20,g:90,drag:1.5,max:1,sz:3.5,c:fxR()<0.5?'#C9A060':'#8E6A3A',rot:fxR()*3,vr:4,bal:[4,8,fxR()*6]});
}
/* Guarda: a criatura pula do terreno dela para a frente do terreno vazio e segura o golpe.
   Devolve uma função (async) que a traz de volta: chamar depois do ataque. */
async function fxGuardaPula(P,de,para){
  const el=fxPecaEl(P,para),ln=fxLaneEl(P,para),dst=fxLaneEl(P,de);
  const nada=async()=>{};
  try{sfx('guarda');}catch(e){}
  if(!el||!dst)return nada;
  const a=el.getBoundingClientRect(),slot=dst.querySelector('[data-sl]')||dst,bb=slot.getBoundingClientRect();
  const dx=Math.round((bb.left+bb.width/2)-(a.left+a.width/2)),dy=Math.round((bb.bottom-a.height*0.5-8)-(a.top+a.height/2));
  if(RM||!el.animate){
    try{el.animate([{opacity:1},{opacity:.25},{opacity:1}],{duration:260});dst.animate([{filter:'none'},{filter:'brightness(1.7)'},{filter:'none'}],{duration:300});}catch(e){}
    await fxEsp(160);return nada;
  }
  if(ln)ln.classList.add('fx-atk');
  const an=el.animate([{transform:'none'},{transform:`translate(${dx*0.5}px,${dy*0.5-26}px) rotate(${dx>0?10:-10}deg) scale(1.1)`,offset:0.5},{transform:`translate(${dx}px,${dy}px) scale(1.06,.94)`,offset:0.85},{transform:`translate(${dx}px,${dy}px)`}],{duration:300,easing:'cubic-bezier(.3,.6,.4,1)',fill:'forwards'});
  await fxEsp(270);
  if(fxCanvas()){const r=fxRect(el);if(r){fxPoeira(r.x,r.b-4,r.w,7);fxO({tipo:'escudo',x:r.x,y:r.y,r:Math.min(r.w,r.h)*0.55,rgb:'255,211,90',dur:460});fxFaiscas(r.x,r.y,8,['#FFFFFF','#FFE58A'],{vel:220,g:400});}}
  await fxEsp(70);
  return async()=>{
    if(!el.isConnected||el.dataset.morto){an.cancel();if(ln)ln.classList.remove('fx-atk');return;}
    el.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:`translate(${dx*0.5}px,${dy*0.5-16}px)`,offset:0.5},{transform:'none'}],{duration:260,easing:'ease-in-out'});
    an.cancel();await fxEsp(260);if(ln)ln.classList.remove('fx-atk');
  };
}
/* Couraça / Cerca de Pedra: escudinho "−n" ao lado do número de dano */
function fxReduz(el,n,fonte){
  const r=fxRect(el);const camada=document.getElementById('fx');if(!r||!camada)return;
  const d=document.createElement('div');d.className='fnum f-reduz fr-'+(fonte||'couraca');
  d.innerHTML=(typeof ic==='function'?ic(fonte==='cerca'?'muro':'couraca',14):'')+'<span>−'+n+'</span>';
  d.style.left=Math.round(r.x+Math.min(30,r.w*0.36))+'px';d.style.top=Math.round(r.y-8)+'px';camada.appendChild(d);
  try{sfx('reduz');}catch(e){}
  const fim=()=>d.remove();
  if(!d.animate){setTimeout(fim,900);return;}
  d.animate(RM?[{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.8},{opacity:0}]:[{transform:'translate(-50%,-50%) scale(.4)',opacity:0},{transform:'translate(-50%,-50%) scale(1.25)',opacity:1,offset:0.18},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:0.7},{transform:'translate(-50%,-110%) scale(.95)',opacity:0}],{duration:1000,easing:'ease-out'}).onfinish=fim;
}
/* Boi-Bumbá: fita de festa do Boi até quem entrou + confete */
function fxFesta(P,de,para){
  const a=fxPecaEl(P,de),b=fxPecaEl(P,para);
  try{sfx('festa');}catch(e){}
  if(RM||!fxCanvas()){if(b)fxPisca(b,1.5,240);return;}
  const ra=fxRect(a),rb=fxRect(b);
  if(ra&&rb)fxO({tipo:'fita',x0:ra.x,y0:ra.t+ra.h*0.3,x1:rb.x,y1:rb.t+rb.h*0.3,arco:48,dur:950});
  if(rb)setTimeout(()=>{for(let i=0;i<20;i++){const an=-Math.PI/2+(fxR()-0.5)*2.6,sp=140+fxR()*190;fxP({k:'px',x:rb.x,y:rb.t+rb.h*0.3,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,g:420,drag:1.2,max:1.05,sz:3.5,c:['#C4362F','#F2C230','#4A7FC1','#5DBB63','#F49AC1'][i%5],rot:fxR()*3,vr:(fxR()-0.5)*12});}},280);
}
/* Lua Cheia: quem chegou não ataca o herói neste turno */
function fxLua(P,lane){
  const el=fxPecaEl(P,lane);if(!el)return;
  fxNumero(el,'Só criaturas','blk',{dy:-18,dur:1400});
  try{sfx('lua');}catch(e){}
  if(RM||!fxCanvas()){fxPisca(el,1.3,260);return;}
  const r=fxRect(el);if(!r)return;
  fxO({tipo:'lua',x:r.x,y:Math.max(14,r.t-4),r:Math.min(15,r.w*0.18),dur:1200});
  for(let i=0;i<6;i++)fxP({k:'star',x:r.x+(fxR()-0.5)*r.w,y:r.t+fxR()*r.h*0.4,vy:-20,max:0.9,sz:4+fxR()*3,c:'#E6F0FF',add:true,pulsa:true,atraso:fxR()*0.3,fadeIn:true});
  if(el.animate)el.animate([{filter:'none'},{filter:'brightness(.75) saturate(.6)'},{filter:'none'}],{duration:760});
}
/* Combo x3 / x4 / x5 (a sequência de cartas no turno) */
async function fxSequencia(P,n,efeito){
  const k=n>=5?1.3:n>=4?1.15:1;
  fxBanner('Combo x'+n+'!','combo',{cor:n>=5?'#FF7A3D':n>=4?'#FFB23D':'#FFD35A',escala:k,sub:efeito==='atk'?'+1 ATK neste turno':'1 de dano no herói',ancora:fxPainel(P)});
  try{sfx('sequencia',{x:n});}catch(e){}
  if(efeito!=='dano'||RM||!fxCanvas()){await fxEsp(RM?150:320);return;}
  const de=document.getElementById(P==='p'?'lP':'lR'),a=fxRect(de),b=fxRect(fxHeroiEl(fxOpp(P)));
  if(a&&b)fxO({tipo:'proj',forma:'luz',x0:a.x,y0:a.y,x1:b.x,y1:b.y,arco:60,dur:340,c:'#FFB23D',sz:14,trilha:'glow'});
  await fxEsp(340);
}
/* Família: pílula pequena perto dos terrenos do lado (não tira a faixa grande da tela) */
function fxFamiliaAviso(P,txt,cor,icHTML){
  // com a faixa de uma dupla ou Combo na tela, o aviso da família espera ela sair (um de cada vez)
  const falta=(FX.banAte||0)-performance.now();
  if(falta>40&&document.querySelector('.fxban.fb-dupla,.fxban.fb-combo')){setTimeout(()=>{if(document.getElementById('board'))fxFamiliaAviso(P,txt,cor,icHTML);},Math.min(2200,falta));return;}
  const lanes=document.getElementById(P==='p'?'lP':'lR');const camada=document.getElementById('fx');if(!lanes||!camada)return;
  camada.querySelectorAll('.fxfam').forEach(e=>e.remove());
  const r=lanes.getBoundingClientRect();
  const d=document.createElement('div');d.className='fxfam';d.setAttribute('role','status');d.style.setProperty('--fc',cor||'#FFE58A');
  d.innerHTML=(icHTML||'')+'<span>'+escH(txt)+'</span>';
  d.style.left=Math.round(r.left+r.width/2)+'px';d.style.top=Math.round(P==='p'?r.top+14:r.bottom-14)+'px';
  camada.appendChild(d);
  const fim=()=>d.remove();
  if(!d.animate){setTimeout(fim,1900);return;}
  d.animate(RM?[{opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.85},{opacity:0}]:[{transform:'translate(-50%,-50%) scale(.5)',opacity:0},{transform:'translate(-50%,-50%) scale(1.08)',opacity:1,offset:.1},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:.18},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:.86},{transform:'translate(-50%,-80%) scale(.95)',opacity:0}],{duration:2000,easing:'ease-out'}).onfinish=fim;
}
/* Família ligou/desligou: brilho nas cartas da família (a aura em si vem do estado, em updLane) */
function fxFamilia(P,lanes,cor,nivel,antes){
  const sobe=nivel>antes;
  for(const i of lanes||[]){const el=fxPecaEl(P,i);if(!el)continue;
    if(!sobe||RM||!fxCanvas()){fxPisca(el,sobe?1.5:0.7,300);continue;}
    const r=fxRect(el);if(!r)continue;
    fxAnel(r.x,r.b-4,6,r.w*0.85,cor,600,{w:nivel>=2?5:3});if(nivel>=2)fxAnel(r.x,r.b-4,4,r.w*0.55,'#FFFFFF',420,{w:2,atraso:80});
    fxSobe(r.x,r.b-6,r.w*0.8,nivel>=2?12:7,cor,{vel:70});
    if(el.animate)el.animate([{filter:'none'},{filter:`brightness(1.5) drop-shadow(0 0 8px ${cor})`},{filter:'none'}],{duration:560});
  }
}

/* ---------- faixas (banners) ---------- */
const FX_BAN_DUR={turno:1150,rival:1150,colheita:2500,ultima:2100,combo:1400,vitoria:2200,lendaria:1200,regra:2900,familia:1700,dupla:2100,torneio:1800};
function fxBanner(txt,tipo,o){
  o=o||{};tipo=FX_BAN_DUR[tipo]?tipo:'turno';
  // família: pílula pequena perto dos terrenos (não apaga a faixa grande que estiver na tela)
  if(tipo==='familia'){fxFamiliaAviso(o.P||'p',txt,o.cor,o.icHTML);return fxEsp(RM?300:600);}
  document.querySelectorAll('.fxban').forEach(e=>{if(e.dataset.tipo!=='lendaria'||tipo==='lendaria')e.remove();});
  const el=document.createElement('div');el.className='fxban fb-'+tipo;el.dataset.tipo=tipo;el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  if(tipo==='colheita'&&!o.icHTML&&typeof ic==='function')o=Object.assign({},o,{icHTML:ic('relogio',26)});
  el.innerHTML=`<div class="fb-in">${o.icHTML?`<span class="fb-ic">${o.icHTML}</span>`:''}<span class="fb-t">${escH(txt)}</span>${o.sub?`<span class="fb-s">${escH(o.sub)}</span>`:''}${o.extraHTML||''}</div>`;
  if(o.cor)el.style.setProperty('--bc',o.cor);
  if(o.escala)el.style.setProperty('--fbk',o.escala);
  if(tipo==='lendaria'&&o.alvo){el.style.top=Math.max(8,Math.round(o.alvo.t-58))+'px';}
  // dupla e Combo: a faixa fica sobre o painel do herói de quem fez, e os terrenos afetados continuam à vista
  if(o.ancora&&o.ancora.isConnected){const ar=o.ancora.getBoundingClientRect();if(ar.height>0){el.classList.add('fb-anc');el.style.top=Math.round(ar.top+ar.height/2)+'px';}}
  // no computador a faixa fica centrada no tabuleiro (e não na tela toda, que tem o painel ao lado)
  const bd=document.getElementById('board'),br=bd&&bd.isConnected?bd.getBoundingClientRect():null;
  if(br&&br.width>0&&window.innerWidth>=900){el.style.left=Math.round(br.left)+'px';el.style.right='auto';el.style.width=Math.round(br.width)+'px';}
  document.body.appendChild(el);
  if(typeof hydrateGfx==='function'&&el.querySelector('canvas'))try{hydrateGfx(el);}catch(e){}
  const dur=o.ms||FX_BAN_DUR[tipo];
  if(tipo==='dupla'||tipo==='combo')FX.banAte=performance.now()+dur*0.86;
  return new Promise(res=>{
    const fim=()=>{el.remove();res();};
    if(!el.animate){setTimeout(fim,dur);return;}
    const inn=el.firstElementChild;
    if(RM){const an=el.animate([{opacity:0},{opacity:1,offset:0.12},{opacity:1,offset:0.85},{opacity:0}],{duration:Math.min(dur,1400)});an.onfinish=fim;return;}
    el.animate([{opacity:0},{opacity:1,offset:0.08},{opacity:1,offset:0.84},{opacity:0}],{duration:dur});
    inn.animate([{transform:'scaleX(0)'},{transform:'scaleX(1.06)',offset:0.1},{transform:'scaleX(1)',offset:0.16},{transform:'scaleX(1)',offset:0.86},{transform:'scaleX(.6)'}],{duration:dur,easing:'ease-out'});
    const t=inn.firstElementChild;if(t)t.animate([{transform:'scale(.4)',opacity:0},{transform:'scale(1.2)',opacity:1,offset:0.14},{transform:'scale(1)',opacity:1,offset:0.22},{transform:'scale(1)',opacity:1,offset:0.86},{transform:'scale(.9)',opacity:0}],{duration:dur,easing:'ease-out'});
    if(tipo==='ultima')inn.animate([{transform:'translateX(0)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}],{duration:240,delay:260,iterations:2,composite:'add'});
    if(fxCanvas()&&(tipo==='colheita'||tipo==='vitoria'||tipo==='combo'||tipo==='lendaria'||tipo==='dupla'||tipo==='familia'||tipo==='regra'||tipo==='torneio')){
      setTimeout(()=>{const r=fxRect(inn);if(!r)return;const c=(tipo==='combo'||tipo==='dupla'||tipo==='familia')?(o.cor||'#7FE0FF'):'#FFD35A';
        for(let i=0;i<(tipo==='colheita'?26:16);i++)fxP(tipo==='colheita'?(i%3?{k:'dot',x:r.l+fxR()*r.w,y:r.y+r.h*0.3,vx:(fxR()-0.5)*90,vy:-90-fxR()*140,g:-30,max:1.3,sz:2+fxR()*3,c:fxR()<0.5?'#FF9A30':'#FFD040',add:true,bal:[6,8,fxR()*6]}:{k:'star',x:r.l+fxR()*r.w,y:r.y+(fxR()-0.5)*r.h,vx:(fxR()-0.5)*50,vy:-30-fxR()*50,max:1.0,sz:6+fxR()*4,c:fxR()<0.5?'#E8E4F8':'#B9A6F0',add:true,pulsa:true}):{k:'star',x:r.l+fxR()*r.w,y:r.y+(fxR()-0.5)*r.h,vx:(fxR()-0.5)*80,vy:-40-fxR()*80,max:0.8,sz:5+fxR()*4,c:fxR()<0.5?'#FFFFFF':c,add:true,pulsa:true});
      },dur*0.12);
    }
    setTimeout(fim,dur+20);
  });
}

/* ---------- tremor da tela ---------- */
function fxTremor(forca){
  forca=Math.max(0,Math.min(3,forca|0));if(!forca||RM)return;
  const el=document.getElementById('board');if(!el||!el.animate)return;
  const amp=[0,3,6,10][forca],dur=[0,180,300,460][forca],n=forca*3+3;
  if(FX.tre){try{FX.tre.cancel();}catch(e){}}
  const kf=[];for(let i=0;i<=n;i++){const d=amp*(1-i/n);kf.push({transform:i===n?'none':`translate(${((fxR()*2-1)*d).toFixed(1)}px,${((fxR()*2-1)*d).toFixed(1)}px)${forca===3?` rotate(${((fxR()*2-1)*0.5*(1-i/n)).toFixed(2)}deg)`:''}`});}
  FX.tre=el.animate(kf,{duration:dur,easing:'linear'});
}

/* ---------- feitiços ---------- */
function fxFeitico(P,i,kind){
  const el=i>=0?(fxPecaEl(P,i)||fxLaneEl(P,i)):null;if(!el)return;
  if(RM||!fxCanvas()){fxPisca(el,1.6,240);return;}
  const r=fxRect(el);if(!r)return;
  if(kind==='graos'){
    const cy=Math.max(14,r.t-26);fxO({tipo:'nuvem',x:r.x,y:cy,w:Math.min(70,r.w*0.9),dur:820});
    for(let k=0;k<26;k++)fxP({k:'kernel',x:r.x+(fxR()-0.5)*r.w*0.8,y:cy+6,vx:(fxR()-0.5)*30,vy:120+fxR()*120,g:1100,max:0.75,sz:4,c:fxR()<0.7?'#F2C230':'#FFE58A',c2:'#B9801C',rot:fxR()*3,vr:(fxR()-0.5)*10,chao:r.b-6-fxR()*10,atraso:0.08+fxR()*0.35});
    setTimeout(()=>{fxEstrela(r.x,r.y,24,'#FFE58A');fxFaiscas(r.x,r.y,10,['#FFE58A','#FFFFFF'],{vel:200});},360);
  }else if(kind==='lama'){
    for(let k=0;k<4;k++){const lado=k%2?1:-1;fxO({tipo:'proj',forma:'gota',x0:r.x+lado*(60+k*10),y0:r.t-40-k*8,x1:r.x+(fxR()-0.5)*r.w*0.4,y1:r.y+(fxR()-0.5)*r.h*0.3,arco:30,dur:220,atraso:k*50,c:k%2?'#4A3A22':'#3B5E3A',sz:12});}
    setTimeout(()=>{for(let k=0;k<16;k++){const an=fxR()*6.283,sp=60+fxR()*160;fxP({k:'drop',x:r.x,y:r.y,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-40,g:800,max:0.7,sz:3+fxR()*4,c:fxR()<0.5?'#4A3A22':'#3B5E3A'});}
      for(let k=0;k<6;k++)fxP({k:'drop',x:r.x+(fxR()-0.5)*r.w*0.7,y:r.y+r.h*0.1,vy:10,g:90,max:1.1,sz:4,c:'#3B4A2A',atraso:fxR()*0.3});
      if(el.animate)el.animate([{filter:'none'},{filter:'sepia(.8) brightness(.7) hue-rotate(40deg)'},{filter:'none'}],{duration:700});},260);
  }else if(kind==='vento'){
    for(let k=0;k<12;k++)fxP({k:'streak',x:r.l-30-fxR()*40,y:r.t+fxR()*r.h,vx:520+fxR()*260,vy:(fxR()-0.5)*40,max:0.45,sz:2,len:26,c:fxR()<0.6?'rgba(255,229,138,.95)':'rgba(255,255,255,.9)',add:true,atraso:fxR()*0.2});
    for(let k=0;k<4;k++)fxP({k:'petal',x:r.l-10,y:r.t+fxR()*r.h,vx:300+fxR()*120,vy:-30,g:60,max:0.7,sz:3.5,c:'#9BD34B',rot:fxR()*3,vr:10,atraso:fxR()*0.2});
    setTimeout(()=>{if(el.classList&&el.classList.contains('card'))fxBuff(el,'',{cor:'#FFE58A'});},220);
  }else if(kind==='pamonha'){
    // pamonha quentinha: cai embrulhada, solta vapor e a criatura acorda brilhando
    fxO({tipo:'proj',forma:'ovo',x0:r.x,y0:Math.max(0,r.t-60),x1:r.x,y1:r.y,arco:10,dur:260,c:'#9BD34B',c2:'#F2C230',sz:16,ease:'in'});
    setTimeout(()=>{
      for(let k=0;k<12;k++)fxP({k:'puff',x:r.x+(fxR()-0.5)*r.w*0.6,y:r.y,vx:(fxR()-0.5)*30,vy:-50-fxR()*50,drag:1.2,max:0.9+fxR()*0.4,sz:5,sz1:16,c:'rgba(255,248,232,.55)',atraso:fxR()*0.3});
      for(let k=0;k<10;k++)fxP({k:'kernel',x:r.x,y:r.y,vx:(fxR()-0.5)*220,vy:-120-fxR()*140,g:900,max:0.7,sz:4,c:'#FFE58A',c2:'#B9801C',rot:fxR()*3,vr:10});
      fxEstrela(r.x,r.y,26,'#FFE58A');fxAnel(r.x,r.b-4,6,r.w*0.7,'#FFD35A',460,{w:4});
      if(el.classList&&el.classList.contains('card'))fxBuff(el,'',{cor:'#FFB23D'});},260);
  }else if(kind==='cipo'){
    // cipó: chicoteia de fora do campo e enrola a criatura
    const lado=P==='r'?-1:1;
    fxO({tipo:'chicote',x0:r.x-lado*Math.min(160,r.w*2),y0:r.b+20,x1:r.x,y1:r.y,dur:520,curva:0.4,c:'#3E8E3A',c2:'#BDF29A',folhas:'#9BD34B'});
    setTimeout(()=>{fxEstrela(r.x,r.y,22,'#BDF29A',{n:5});for(let k=0;k<10;k++){const an=fxR()*6.283;fxP({k:'petal',x:r.x,y:r.y,vx:Math.cos(an)*140,vy:Math.sin(an)*140-40,g:160,drag:2,max:0.8,sz:4,c:fxR()<0.5?'#9BD34B':'#4E9A3A',rot:an,vr:8});}},260);
  }else if(kind==='chuva'){
    // dança da chuva: nuvem por cima de cada criatura, gotas e um anel azul
    const cy=Math.max(14,r.t-22);fxO({tipo:'nuvem',x:r.x,y:cy,w:Math.min(64,r.w*0.85),dur:900});
    for(let k=0;k<18;k++)fxP({k:'drop',x:r.x+(fxR()-0.5)*r.w*0.7,y:cy+8,vx:0,vy:220+fxR()*120,g:600,max:0.55,sz:3+fxR()*2,c:fxR()<0.6?'#9FD4F0':'#BFE6FA',chao:r.b-6,atraso:0.1+fxR()*0.4});
    setTimeout(()=>{fxAnel(r.x,r.b-4,6,r.w*0.8,'#9FD4F0',520,{w:4});fxSobe(r.x,r.b-6,r.w*0.7,8,'#BFE6FA',{vel:50});},420);
  }else{
    fxO({tipo:'feixe',x:r.x,y0:r.t-50,y1:r.b-4,w0:4,w:r.w*0.6,rgb:'190,255,170',dur:620,kin:0.3,kout:0.5,a:0.8});
    fxSobe(r.x,r.b-6,r.w*0.8,14,'#E2FFE0',{vel:70});
    for(let k=0;k<6;k++)fxP({k:'drop',x:r.x+(fxR()-0.5)*r.w*0.6,y:r.t-20-fxR()*20,vy:60,g:500,max:0.6,sz:3,c:'#BFE6FA',atraso:fxR()*0.2});
    setTimeout(()=>fxEstrela(r.x,r.y,26,'#E2FFE0',{n:4}),200);
  }
}
/* engolido pelo brejo (Velho Lodão, Atoleiro): a peça afunda num redemoinho de lama */
function fxAfundar(el){
  if(!el)return;el.dataset.afundou='1';
  if(RM||!el.animate||!fxCanvas()){try{el.animate([{opacity:1},{opacity:0.3}],{duration:200,fill:'forwards'});}catch(e){}return;}
  const r=fxRect(el);if(!r)return;
  fxO({tipo:'redemoinho',x:r.x,y:r.b-6,r:r.w*0.7,c:'#4A3A22',c2:'#3B8F86',rgb:'40,60,40',dur:620,ry:0.4});
  el.animate([{transform:'none',opacity:1},{transform:'translateY(6px) rotate(-4deg)',offset:0.3},{transform:`translateY(${Math.round(r.h*0.7)}px) scaleY(.5) rotate(5deg)`,opacity:0}],{duration:520,easing:'ease-in',fill:'forwards'});
  for(let k=0;k<10;k++)fxP({k:'dot',x:r.x+(fxR()-0.5)*r.w*0.7,y:r.b-6,vy:-30-fxR()*40,max:0.6,sz:3+fxR()*4,c:'rgba(120,160,120,.8)',atraso:fxR()*0.4});
}

/* ---------- vitória: o retrato do rival se desfaz e sobem fogos ---------- */
function fxVitoria(){
  if(RM||!fxCanvas())return;
  const pt=document.querySelector('#hR .pt');if(pt){const r=fxRect(pt);if(r){fxFaiscas(r.x,r.y,18,['#FFFFFF','#FFD35A'],{vel:320});fxAnel(r.x,r.y,8,90,'#FFD35A',600,{w:5,ry:1});}}
  for(let f=0;f<4;f++)setTimeout(()=>{const x=FX.w*(0.2+fxR()*0.6),y=FX.h*(0.15+fxR()*0.3),c=['#E8693A','#F2C230','#5DBB63','#4C9BE8','#F49AC1'][f%5];
    for(let i=0;i<24;i++){const an=i/24*6.283;fxP({k:'streak',x,y,vx:Math.cos(an)*220,vy:Math.sin(an)*220,g:160,drag:1.2,max:0.9,sz:2.5,c:i%2?c:'#FFF4C0',add:true});}},f*240);
}

/* ---------- limpeza ao sair da batalha ---------- */
function fxLimpar(){
  FX.ps.length=0;FX.obs.length=0;if(FX.raf)cancelAnimationFrame(FX.raf);FX.raf=0;
  if(FX.tre){try{FX.tre.cancel();}catch(e){}FX.tre=null;}
  FX.auras={};
  document.querySelectorAll('.fxban').forEach(e=>e.remove());
  if(FX.cv){FX.cv.remove();}FX.cv=null;FX.g=null;
}

/* ---------- v10 (Agente 6): faixa da Meia-Noite e carimbo (Ascensão, Vila, Causos) ---------- */
(function v10FxCSS(){
  if(typeof document==='undefined'||document.getElementById('v10fx'))return;
  const st=document.createElement('style');st.id='v10fx';
  st.textContent=`
body .fxban.fb-colheita .fb-in{background:radial-gradient(ellipse at 50% 120%,rgba(232,134,46,.55),transparent 60%),linear-gradient(180deg,#2E2258,#120C2A);--bc:#E8E4F8;
  border-color:#B9A6F0!important;box-shadow:0 0 0 2px #1A1420,0 0 26px rgba(155,127,240,.65)}
body .fxban.fb-colheita .fb-t{font-family:var(--rye,'Rye',Georgia,serif);letter-spacing:1px;color:#F4E3B5;text-shadow:0 2px 0 #120C2A,0 0 12px rgba(185,166,240,.8)}
body .fxban.fb-colheita .fb-s{color:#C8B8FF}
.fxcarimbo{position:fixed;z-index:9600;left:50%;top:42%;pointer-events:none;transform:translate(-50%,-50%) rotate(-8deg);padding:10px 18px;border:4px double var(--cc,#C4362F);
  border-radius:10px;color:var(--cc,#C4362F);font:400 26px/1.05 var(--rye,'Rye',Georgia,serif);text-align:center;background:rgba(243,231,205,.92);box-shadow:0 6px 18px rgba(0,0,0,.4);text-transform:uppercase;max-width:86vw}
.fxcarimbo small{display:block;font:700 12px/1.3 var(--ui,'Nunito',sans-serif);letter-spacing:.5px;text-transform:none;color:#3A2A1A}
`;
  (document.head||document.documentElement).appendChild(st);
})();
/* fxCarimbo(txt,{cor,sub}) → Promise: carimbo de xilogravura que bate na tela (Ascensão, prédio da Vila, causo lido) */
function fxCarimbo(txt,o){
  o=o||{};const el=document.createElement('div');el.className='fxcarimbo';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  if(o.cor)el.style.setProperty('--cc',o.cor);
  el.innerHTML=escH(txt)+(o.sub?`<small>${escH(o.sub)}</small>`:'');document.body.appendChild(el);
  const dur=o.ms||1300;
  return new Promise(res=>{const fim=()=>{el.remove();res();};
    if(!el.animate){setTimeout(fim,dur);return;}
    const fr=RM?[{opacity:0},{opacity:1,offset:0.15},{opacity:1,offset:0.8},{opacity:0}]
      :[{opacity:0,transform:'translate(-50%,-50%) rotate(-8deg) scale(2.2)'},{opacity:1,transform:'translate(-50%,-50%) rotate(-8deg) scale(.94)',offset:0.14},{opacity:1,transform:'translate(-50%,-50%) rotate(-8deg) scale(1)',offset:0.2},{opacity:1,transform:'translate(-50%,-50%) rotate(-8deg) scale(1)',offset:0.8},{opacity:0,transform:'translate(-50%,-50%) rotate(-8deg) scale(1.04)'}];
    el.animate(fr,{duration:dur,easing:'ease-out'}).onfinish=fim;
    if(!RM&&typeof fxTremor==='function')setTimeout(()=>{try{fxTremor(1);}catch(e){}},dur*0.14);
  });
}

