/* ===================== v7: o PALCO da batalha (um cenário só, atrás de tudo) =====================
   alciana: "tem q ser um cenario e agente tem q ve os personagens das cartas se degladiando".
   Um único canvas (#bCena) cobre a tela da batalha inteira, atrás dos painéis e dos personagens.
   Quem pinta é cenarioPintar(g,w,h,o) (src/32-cenario.js, do artista de cenário, ver SPRITES.md v7);
   enquanto ele não existir (ou se der erro), palcoReserva pinta um campo simples.
   A geometria (lanesX, yR, yP, yMid) sai da posição REAL dos lugares dos personagens (o anel .chao de cada terreno).
   O redesenho anda no laço dos personagens (sprLoop em 30-gfx.js) a ~15 qps; com movimento reduzido, um quadro parado. */
const PALCO={cv:null,g:null,w:0,h:0,dpr:1,o:null,t0:0,last:0,chk:0,err:0,geo:'',rk:'',rc:null};
function palcoIniciar(cv){
  PALCO.cv=cv||null;PALCO.g=cv?cv.getContext('2d'):null;PALCO.t0=performance.now();PALCO.w=PALCO.h=0;PALCO.o=null;PALCO.err=0;PALCO.geo='';PALCO.rk='';PALCO.rc=null;
  if(typeof sprKick==='function')sprKick();
}
function palcoParar(){PALCO.cv=null;PALCO.g=null;PALCO.o=null;PALCO.rc=null;}
function palcoAtivo(){return !!(PALCO.cv&&PALCO.cv.isConnected&&PALCO.g&&typeof B!=='undefined'&&B);}
/* chave da geometria: quando muda (tela girou, painel cresceu), mede de novo */
function palcoChave(){
  const bt=document.getElementById('battle'),a=document.getElementById('ln-p-0'),b=document.getElementById('ln-r-3');
  if(!bt||!a||!b)return '';
  const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();
  return [bt.clientWidth,bt.clientHeight,bt.scrollHeight,Math.round(ra.bottom+bt.scrollTop),Math.round(ra.left),Math.round(rb.bottom+bt.scrollTop),Math.round(rb.right)].join(',');
}
function palcoTerr(){return {terrP:B.sides.p.lanes.map(L=>L.terr),terrR:B.sides.r.lanes.map(L=>L.terr)};}
function palcoMedir(){
  if(!palcoAtivo())return;
  const bt=document.getElementById('battle'),cv=PALCO.cv;
  const w=Math.max(1,bt.clientWidth);
  cv.style.height='0px'; // o próprio canvas não pode esticar a rolagem que ele mede
  const h=Math.max(1,bt.clientHeight,bt.scrollHeight);
  cv.style.height=h+'px';
  const d=Math.min(2,window.devicePixelRatio||1);
  const W=Math.round(w*d),H=Math.round(h*d);
  if(cv.width!==W)cv.width=W;if(cv.height!==H)cv.height=H;
  PALCO.w=w;PALCO.h=h;PALCO.dpr=d;
  const cr=cv.getBoundingClientRect();
  const pe=(P,i)=>{const c=document.querySelector('#ln-'+P+'-'+i+' .chao');if(!c)return null;const r=c.getBoundingClientRect();return {x:(r.left+r.width/2-cr.left)/w,y:(r.top+r.height/2-cr.top)/h,lw:r.width/w};};
  const xs=[],xr=[];let yP=0,yR=0,nP=0,nR=0,lw=0;
  for(let i=0;i<4;i++){const a=pe('p',i),b=pe('r',i);if(a){xs.push(a.x);yP+=a.y;nP++;lw+=a.lw;}else xs.push(0.125+i*0.25);if(b){xr.push(b.x);yR+=b.y;nR++;}else xr.push(0.125+i*0.25);}
  yP=nP?yP/nP:0.7;yR=nR?yR/nR:0.35;
  const cs=getComputedStyle(bt);const px=v=>parseFloat(cs.getPropertyValue(v))||0;
  PALCO.o=Object.assign({arena:B.arena||1,lanesX:xs,lanesXR:xr,yR,yP,yMid:(yR+yP)/2,noite:(B.arena||1)===5,
    // extras (o contrato não pede; podem ajudar): tamanho do personagem perto/longe e largura do lugar, em fração da tela
    sprP:px('--spr')/w,sprR:px('--sprR')/w,lugarW:nP?lw/nP:0.2},palcoTerr());
  PALCO.geo=palcoChave();
  if(typeof cenarioPreparar==='function'){try{cenarioPreparar(Object.assign({},PALCO.o,{w:W,h:H}),W,H);}catch(e){}}
  palcoPintar(performance.now());
}
/* chamado no fim de cada bRender: terreno trocado ou painel mudou de tamanho → mede/pinta de novo */
function palcoSincronizar(){
  if(!palcoAtivo())return;
  if(!PALCO.o||palcoChave()!==PALCO.geo){palcoMedir();return;}
  const t=palcoTerr();
  if(t.terrP.join()!==PALCO.o.terrP.join()||t.terrR.join()!==PALCO.o.terrR.join()){Object.assign(PALCO.o,t);palcoPintar(performance.now());}
}
function palcoPintar(now){
  if(!palcoAtivo()||!PALCO.o)return;
  const g=PALCO.g,w=PALCO.w,h=PALCO.h,d=PALCO.dpr;
  g.globalAlpha=1;g.globalCompositeOperation='source-over';g.imageSmoothingEnabled=false;
  const o=PALCO.o;o.t=RM?0:(now-PALCO.t0)/1000;
  // o cenário do artista pinta em pixels do canvas (w x h = tamanho real do canvas, com a densidade da tela já dentro)
  if(typeof cenarioPintar==='function'&&PALCO.err<3){
    try{g.save();g.setTransform(1,0,0,1,0,0);cenarioPintar(g,PALCO.cv.width,PALCO.cv.height,o);g.restore();return;}
    catch(e){PALCO.err++;try{g.restore();}catch(_){}}
  }
  try{g.setTransform(d,0,0,d,0,0);}catch(e){}
  palcoReserva(g,w,h,o);
}
/* no laço dos personagens: ~15 qps para o cenário; a cada ~0,5 s confere se a geometria mudou */
function palcoTique(now){
  if(!palcoAtivo())return;
  if(now-PALCO.chk>500){PALCO.chk=now;if(palcoChave()!==PALCO.geo){palcoMedir();PALCO.last=now;return;}}
  if(now-PALCO.last>=66){PALCO.last=now;palcoPintar(now);}
}
window.addEventListener('resize',()=>{if(palcoAtivo())palcoMedir();});

/* ---------- cenário reserva (só enquanto o do artista não chega): campo, clareira no meio e manchas de terreno ---------- */
const PALCO_TERR={ // v10: os 5 reinos (Sertão, Mata, Águas, Noite, Arraial)
  milharal:{b:'#9A5832',c:['#B06A3A','#7A4426'],d:['#5A3020','#3E6A2E','#D8945A'],m:'#E8862E'},
  pomar:{b:'#1E4A26',c:['#2E6A30','#163E1E'],d:['#4E8E3A','#8A5A2A','#E8693A'],m:'#3FA34D'},
  brejo:{b:'#164A58',c:['#1A5462','#103A48'],d:['#4E9AA0','#2E6A3A','#BFF0F8'],m:'#2E9FB5'},
  pasto:{b:'#22223E',c:['#2E2E4E','#1A1A30'],d:['#7B5BD6','#C8B8FF','#3A3A5E'],m:'#7B5BD6'},
  neutro:{b:'#9C6C40',c:['#B88452','#7A5232'],d:['#E8693A','#F2C230','#4FB3E8'],m:'#B08A5A'}
};
function palcoHash(a,b){let x=(a*374761393+b*668265263)|0;x=(x^(x>>>13))*1274126177|0;return ((x^(x>>>16))>>>0);}
function palcoReservaFixa(W,H,o,k){
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');
  const R=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x|0,y|0,w==null?1:Math.max(0,w|0),h==null?1:Math.max(0,h|0));};
  const C=(typeof cenaCor==='function')?cenaCor(o.arena):{ceu:['#4E97DD','#B4DDF2'],m1:'#8CBF5A',m2:'#6AA544',m3:'#4E8E36',lav:['#5FA83E','#7A5A34']};
  const yR=Math.round(o.yR*H),yP=Math.round(o.yP*H),yM=Math.round(o.yMid*H);
  const sR=Math.max(8,Math.round((o.sprR||0.2)*W)),sP=Math.max(10,Math.round((o.sprP||0.26)*W));
  const hz=Math.max(10,Math.round(yR-sR*1.25));
  // céu em faixas
  const n=C.ceu.length;
  for(let y=0;y<hz+4;y++){const f=y/(hz+4)*(n-1),i=Math.min(n-2,Math.floor(f)),kk=f-i;R(C.ceu[i],0,y,W,1);if(kk>0.5)for(let x=(y%2);x<W;x+=2)R(C.ceu[i+1],x,y,1,1);}
  // morros e marcos
  const morro=(base,amp,fr,ph,c)=>{for(let x=0;x<W;x++){const y=Math.round(base-amp*(0.6*Math.sin(x*fr+ph)+0.4*Math.sin(x*fr*2.3+ph*1.7)));R(c,x,y,1,H-y);}};
  morro(hz-1,4,0.05,1.3,C.m1);
  if(typeof celeiro==='function'){if(o.arena===1){celeiro(R,Math.round(W*0.72),hz-4);moinho(R,Math.round(W*0.3),hz-3);}else if(o.arena===4)silo(R,Math.round(W*0.7),hz-2);else if(o.arena===5)celeiro(R,Math.round(W*0.2),hz-4,true);
    else if(o.arena===2)for(let i=0;i<Math.ceil(W/14);i++)arvore(R,i*14+(palcoHash(i,3)%5),hz-1-(palcoHash(i,4)%3),'#14361E','#1E4A28',null);}
  morro(hz+2,2,0.08,0.4,C.m2);
  // chão: grama com pontilhado, mais escura perto da câmera
  const g0=C.lav[0],g1=typeof shade==='function'?shade(g0,0.85):g0,g2=typeof shade==='function'?shade(g0,1.15):g0;
  R(g0,0,hz+4,W,H-hz-4);
  for(let y=hz+4;y<H;y++)for(let x=(y*7)%5;x<W;x+=4+(palcoHash(x,y)%5))R((palcoHash(x,y)&1)?g1:g2,x,y);
  // a clareira do meio (terra batida), onde a briga acontece
  const cx=W/2,rx=W*0.62,ry=Math.max(6,(yP-yR)*0.62);
  for(let y=Math.round(yM-ry);y<=yM+ry;y++){const f=1-Math.pow((y-yM)/ry,2);if(f<=0)continue;const hw=Math.sqrt(f)*rx;
    for(let x=Math.max(0,Math.round(cx-hw));x<Math.min(W,cx+hw);x++){const borda=(hw-Math.abs(x-cx))<3+(palcoHash(x,y)%3);if(borda&&(palcoHash(x,y)&1))continue;
      R((palcoHash(x,y)%7===0)?'#7E5C3A':(palcoHash(y,x)%5===0)?'#B08A5C':'#9A744A',x,y);}}
  for(let i=0;i<Math.round(W*0.35);i++){const x=palcoHash(i,11)%W,y=Math.round(yM-ry*0.7+(palcoHash(i,12)%Math.max(1,Math.round(ry*1.4))));R('#6E4E30',x,y,2,1);}
  // manchas de terreno debaixo de cada lugar (orgânicas, não retângulos)
  const mancha=(t,xf,yy,s,seed)=>{
    const T=PALCO_TERR[t]||PALCO_TERR.neutro;const mx=Math.round(xf*W),rx2=s*0.62,ry2=s*0.24;
    for(let y=Math.round(yy-ry2*1.3);y<=yy+ry2*1.3;y++)for(let x=Math.round(mx-rx2*1.3);x<=mx+rx2*1.3;x++){
      const dx=(x-mx)/rx2,dy=(y-yy)/ry2,dd=dx*dx+dy*dy+((palcoHash(x+seed,y)%100)/100-0.5)*0.35;if(dd>1)continue;
      R(dd>0.78?T.c[1]:((palcoHash(x,y+seed)%3)?T.b:T.c[0]),x,y);}
    // detalhes do terreno
    const nd=Math.round(s*0.5);
    for(let i=0;i<nd;i++){const a=(palcoHash(i,seed)%628)/100,r=(palcoHash(seed,i)%100)/100*0.85,x=Math.round(mx+Math.cos(a)*rx2*r),y=Math.round(yy+Math.sin(a)*ry2*r);
      if(t==='milharal'){R('#4E9A36',x,y-2,1,3);R(T.d[0],x+1,y-2,1,1);}
      else if(t==='brejo'){if(i%3===0){R('#5DBB63',x,y,3,1);R('#3E8E3A',x+1,y,1,1);}else R(T.d[2],x,y,2,1);}
      else if(t==='pomar'){R(T.d[i%3],x,y);}
      else if(t==='pasto'){R(i%4?'#3E8E36':T.d[i%2],x,y,1,i%4?2:1);}
      else R(T.d[i%3],x,y,2,1);}
    // plaquinha de pedra com a cor do terreno
    const px=Math.round(mx+rx2*0.92),py=Math.round(yy+ry2*0.15);R('#2A1E14',px-1,py-3,4,4);R('#B9B0A0',px-1,py-4,3,3);R(T.m,px,py-3,1,1);
  };
  for(let i=0;i<4;i++){mancha((o.terrR||[])[i],(o.lanesXR||o.lanesX)[i],yR,sR,31+i*7);mancha((o.terrP||[])[i],o.lanesX[i],yP,sP,71+i*7);}
  // escurece a parte de baixo (painéis e mão) e os lados
  const gr=g.createLinearGradient(0,yP,0,H);gr.addColorStop(0,'rgba(10,8,6,0)');gr.addColorStop(0.35,'rgba(10,8,6,.35)');gr.addColorStop(1,'rgba(10,8,6,.8)');g.fillStyle=gr;g.fillRect(0,yP,W,H-yP);
  const gl=g.createLinearGradient(0,0,W,0);gl.addColorStop(0,'rgba(10,8,6,.3)');gl.addColorStop(0.15,'rgba(10,8,6,0)');gl.addColorStop(0.85,'rgba(10,8,6,0)');gl.addColorStop(1,'rgba(10,8,6,.3)');g.fillStyle=gl;g.fillRect(0,0,W,H);
  return cv;
}
function palcoReserva(g,w,h,o){
  const k=Math.max(2,Math.round(w/160)),W=Math.ceil(w/k),H=Math.ceil(h/k);
  const key=[o.arena,W,H,k,(o.terrP||[]).join(),(o.terrR||[]).join(),o.yR.toFixed(3),o.yP.toFixed(3),o.lanesX.map(x=>x.toFixed(3)).join(),(o.sprP||0).toFixed(3)].join('|');
  if(PALCO.rk!==key||!PALCO.rc){PALCO.rk=key;PALCO.rc=palcoReservaFixa(W,H,o,k);}
  g.imageSmoothingEnabled=false;g.drawImage(PALCO.rc,0,0,W*k,H*k);
  // animado por cima: nuvens e capim balançando
  const t=o.t||0,R=(c,x,y,ww,hh)=>{g.fillStyle=c;g.fillRect(Math.round(x)*k,Math.round(y)*k,(ww||1)*k,(hh||1)*k);};
  const C=(typeof cenaCor==='function')?cenaCor(o.arena):{nuv:'#FFFFFF',nuvs:'#CFE2EC'};
  const sR=Math.max(8,Math.round((o.sprR||0.2)*W)),hz=Math.max(10,Math.round(o.yR*H-sR*1.25));
  for(let i=0;i<4;i++){const nw=10+(palcoHash(i,5)%10),x=((palcoHash(i,6)%W)+t*(0.8+i*0.3))%(W+nw*2)-nw,y=3+(palcoHash(i,7)%Math.max(4,hz-10));
    R(C.nuvs,x+1,y+3,nw-2,1);R(C.nuv,x,y+1,nw,2);R(C.nuv,x+2,y,nw-5,1);}
  const yP=Math.round(o.yP*H),yR=Math.round(o.yR*H);
  for(let i=0;i<Math.round(W/5);i++){const x=(palcoHash(i,8)%W),y=(i%2?yP:yR)+((palcoHash(i,9)%14)-7)+(i%2?6:3),hh=2+(palcoHash(i,10)%3),sw=RM?0:Math.round(Math.sin(t*1.7+i)*0.8);
    R(o.arena>=3?'#2A4A2A':'#3E7A2E',x+sw,y-hh,1,hh);}
}

