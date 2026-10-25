/* ===================== CENÁRIO DA BATALHA (v7) =====================
 Uma paisagem contínua por arena, pintada em código (pixel art), com os 8 lugares
 dos personagens (4 do rival ao fundo, 4 seus na frente) e o chão de briga no meio.
 API:
   cenarioPintar(g,w,h,o)   pinta o cenário inteiro em g (w x h pixels do canvas)
   cenarioPreparar(o,w,h)   opcional: aquece o cache (w,h também podem vir em o.w/o.h)
 o = {arena, t, terrP[4], terrR[4], lanesX[4], yR, yP, yMid, noite}
 As camadas paradas ficam em canvases fora da tela (cache por arena/tamanho/terrenos);
 por quadro só se desenham 2 imagens + a animação ambiente (nuvens, capim, bichinhos...). */
const CENARIO=(function(){
'use strict';
/* ---------- utilidades ---------- */
const B4=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const th=(x,y)=>(B4[((y&3)<<2)|(x&3)]+.5)/16;
const hs=(a,b,s)=>{let h=(Math.imul(a|0,374761393)+Math.imul(b|0,668265263)+Math.imul((s|0)+1,1442695041))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;};
const cl=(v,a,b)=>v<a?a:v>b?b:v;
const sm=f=>f*f*(3-2*f);
const nz=(x,s)=>{const i=Math.floor(x),f=sm(x-i);return hs(i,7,s)*(1-f)+hs(i+1,7,s)*f;};
const nz2=(x,y,s)=>{const i=Math.floor(x),j=Math.floor(y),fx=sm(x-i),fy=sm(y-j);
  const a=hs(i,j,s),b=hs(i+1,j,s),c=hs(i,j+1,s),d=hs(i+1,j+1,s);return (a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy;};
const PK={};
const pk=hex=>{let v=PK[hex];if(v===undefined){const n=parseInt(hex.slice(1),16);v=PK[hex]=(((255<<24)|((n&255)<<16)|(n&0xff00)|((n>>16)&255))>>>0);}return v;};
const TCOR=(typeof TERR_COR!=='undefined'&&TERR_COR)||{milharal:'#E8B23A',pomar:'#E0565B',brejo:'#3BA39A',pasto:'#6CB843',neutro:'#A87A4E'};
const TERRS_OK={milharal:1,pomar:1,brejo:1,pasto:1,neutro:1};

function mkBuf(W,H){
  const d=new Uint32Array(W*H);
  const B={W,H,d,
    p(x,y,c){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=W||y>=H)return;d[y*W+x]=pk(c);},
    r(x,y,w,h,c){x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);const v=pk(c);
      const x0=Math.max(0,x),x1=Math.min(W,x+w),y0=Math.max(0,y),y1=Math.min(H,y+h);
      for(let j=y0;j<y1;j++)for(let i=x0;i<x1;i++)d[j*W+i]=v;},
    dk(x,y,f){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=W||y>=H)return;const v=d[y*W+x];if(!v)return;
      const r=(v&255)*f,g=((v>>8)&255)*f,b=((v>>16)&255)*f;d[y*W+x]=((255<<24)|(cl(b,0,255)<<16)|(cl(g,0,255)<<8)|cl(r,0,255))>>>0;},
    tint(x,y,hex,a){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=W||y>=H)return;const v=d[y*W+x];if(!v)return;const t=pk(hex);
      const m=(s)=>Math.round(((v>>s)&255)*(1-a)+((t>>s)&255)*a);d[y*W+x]=((255<<24)|(m(16)<<16)|(m(8)<<8)|m(0))>>>0;},
    el(cx,cy,rx,ry,c,dith){for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++){const dy=(y+.5-cy)/ry;if(Math.abs(dy)>1)continue;
      const hw=rx*Math.sqrt(1-dy*dy);for(let x=Math.round(cx-hw);x<Math.round(cx+hw);x++){if(dith&&th(x,y)>dith)continue;B.p(x,y,c);}}},
    line(x0,y0,x1,y1,c){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);for(let i=0;i<=n;i++)B.p(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n,c);}
  };
  return B;
}
function toCanvas(B){
  let cv;
  if(typeof document!=='undefined'){cv=document.createElement('canvas');cv.width=B.W;cv.height=B.H;}
  else cv=new OffscreenCanvas(B.W,B.H);
  const c=cv.getContext('2d');const im=c.createImageData(B.W,B.H);
  new Uint32Array(im.data.buffer).set(B.d);c.putImageData(im,0,0);return cv;
}

/* ---------- paletas por arena ---------- */
// sky: céu de cima para o horizonte; h1/h2: morros; gr: chão do fundo para a frente; dirt: [claro, médio, escuro, fundo]
const ARC={
  1:{nome:'Sertão ao Entardecer',sky:['#2A1E3E','#5A2E48','#A04A3A','#D8743A','#F2A85A'],h1:'#6A3A3A',h1l:'#8A4A40',h2:'#8A5232',h2l:'#A86A3E',
     gr:['#B07A44','#9C6A3A','#865A32','#724C2A','#5E3E24'],gl:'#C89A5A',gd:'#4A3020',dirt:['#D8A468','#BC8852','#9C6C40','#7A5232'],
     tr:['#3E5A2E','#4E6E34','#6A8A3E'],cloud:['#E8A070','#B86A58','#7A4250'],fl:['#F2C230','#E8693A','#FFFFFF']},
  2:{nome:'Mata Fechada',sky:['#10241E','#1A3A2E','#2A5640','#4A7A54','#8AAE7A'],h1:'#1E3A2A',h1l:'#2A4A34',h2:'#1A3426',h2l:'#24442E',
     gr:['#3E6A34','#34602E','#2C5428','#244822','#1C3C1C'],gl:'#5E8E44',gd:'#142E16',dirt:['#7A6040','#634E34','#4E3C28','#3A2C1E'],
     tr:['#12301C','#1C4226','#2A5A32'],cloud:['#9AB8A0','#7A9A84','#5A7A66'],fl:['#E8693A','#F2C230','#FFFFFF']},
  3:{nome:'Igapó',sky:['#0E1E2E','#1A3446','#2A5262','#4A7A82','#8AB0A8'],h1:'#2A4A50',h1l:'#3A5A5E',h2:'#1E3C3A',h2l:'#2A4A46',
     gr:['#3E6A54','#345E4A','#2A5242','#22463A','#1A3A30'],gl:'#5A8A6A',gd:'#122A22',dirt:['#7A6A50','#63563E','#4E4430','#3A3224'],
     tr:['#12302A','#1E4038','#2E5448'],cloud:['#A8C0BC','#88A4A2','#6A8888'],fl:['#F49AC1','#FFFFFF','#C8E86A']},
  4:{nome:'Tapera',sky:['#0A0818','#161230','#261E4A','#3A2E62','#5A4A7E'],h1:'#241E3A',h1l:'#2E2648',h2:'#1E1A2E',h2l:'#28223A',
     gr:['#3A3A4A','#32324A','#2A2A40','#222236','#1A1A2C'],gl:'#4E4E66',gd:'#121220',dirt:['#5A5060','#4A4250','#3A3442','#2A2634'],
     tr:['#16142A','#201C36','#2C2646'],cloud:['#3A3458','#2E2A4A','#22203A'],fl:['#9C7FF0','#C8D0FF','#7B5BD6']},
  5:{nome:'Arraial',sky:['#0E0A24','#1E1640','#3A2458','#6A3060','#A8463E','#E07A3A'],h1:'#2E2040',h1l:'#3A2A4E',h2:'#2A2A26',h2l:'#38362E',
     gr:['#6A5A3A','#5E5034','#52462E','#463C28','#3A3222'],gl:'#8A7448',gd:'#2A2218',dirt:['#D8A468','#BC8852','#9C6C40','#7A5232'],
     tr:['#1E1A2A','#282438','#343046'],cloud:['#7A4A6A','#5A3A58','#3E2A44'],fl:['#F2C230','#E8693A','#4FB3E8']}
};

/* ---------- peças de desenho ---------- */
function treeRound(L,x,yb,r,cols,seed,fruit,bloss){
  const tw=Math.max(1,Math.round(r*.35));
  L.r(x-tw/2,yb-r*1.1,tw,r*1.1,'#4B2C17');L.r(x-tw/2,yb-r*1.1,1,r*1.1,'#6B4630');
  const cy=yb-r*1.1-r*.75,ry=r*.9;
  for(let y=Math.floor(cy-ry-1);y<=Math.ceil(cy+ry+1);y++)for(let xx=Math.floor(x-r-1);xx<=Math.ceil(x+r+1);xx++){
    const dx=(xx+.5-x)/r,dy=(y+.5-cy)/ry,dd=Math.hypot(dx,dy)*(1+.18*(nz2(xx*.6,y*.6,seed)-.5));
    if(dd>1)continue;const s=dx*.6+dy*.8;
    L.p(xx,y,s<-.45?cols[2]:s>.35?cols[0]:(s>.05&&th(xx,y)<.5?cols[0]:cols[1]));
  }
  const n=Math.round(r*r*.18);
  for(let i=0;i<n;i++){const a=hs(i,1,seed)*6.28,d=Math.sqrt(hs(i,2,seed))*r*.8;const px=x+Math.cos(a)*d,py=cy+Math.sin(a)*d*.85;
    if(fruit&&i%2===0){L.p(px,py,fruit);if(r>4)L.p(px+1,py,fruit);}else if(bloss)L.p(px,py,bloss);}
}
function cornStalk(L,x,yb,hg,seed){
  x=Math.round(x);yb=Math.round(yb);hg=Math.max(5,Math.round(hg));
  for(let j=0;j<hg;j++)L.p(x,yb-j,j<2?'#2F5E2A':'#3E7F34');
  for(let m=2;m<hg-2;m+=3){const dir=((m/3|0)+(seed&1))%2?1:-1;L.p(x+dir,yb-m,'#4E9A3A');L.p(x+2*dir,yb-m-1,'#9BD34B');if(hg>11)L.p(x+3*dir,yb-m-1,'#4E9A3A');}
  const cy=yb-Math.round(hg*.5);L.r(x+1,cy-1,1,3,'#F2C230');L.p(x+1,cy-2,'#FFE58A');L.p(x+2,cy+1,'#6CB843');L.p(x+1,cy+2,'#4E9A3A');
  L.p(x,yb-hg,'#D9A066');L.p(x-1,yb-hg-1,'#F2C230');L.p(x+1,yb-hg-1,'#D9A066');L.p(x,yb-hg-2,'#F2C230');
}
function cattail(L,x,yb,hg){
  x=Math.round(x);yb=Math.round(yb);hg=Math.max(5,Math.round(hg));
  for(let j=0;j<hg;j++)L.p(x,yb-j,j<hg*.4?'#2F5E2A':'#4E8A3A');
  L.r(x-(hg>9?1:0),yb-hg-3,hg>9?2:1,4,'#6B4630');L.p(x,yb-hg-3,'#A0673A');L.p(x,yb-hg-4,'#4E8A3A');
  L.p(x+1,yb-Math.round(hg*.5),'#6CB843');L.p(x+2,yb-Math.round(hg*.5)-1,'#9BD34B');
}
function tuftS(L,x,yb,hg,c1,c2){for(let b=-1;b<=1;b++){const hh=Math.max(1,Math.round(hg*(b?0.7:1)));for(let j=0;j<hh;j++)L.p(x+b*(j>hh/2?2:1)*(j>0?1:0),yb-j,j===hh-1?c2:c1);}}
function stone(L,x,yb,w,c,cl2,cd){const h=Math.max(2,Math.round(w*.6));L.el(x,yb-h/2,w/2,h/2,c);L.r(x-w/2+1,yb-h+1,Math.max(1,w/3),1,cl2);L.r(x-w/2+1,yb-1,w-1,1,cd);}
function pumpkin(L,x,yb,r){L.el(x,yb-r*.8,r,r*.8,'#C2611E');L.el(x,yb-r*.8,r*.55,r*.8,'#E8862E');L.r(x-r*.15,yb-r*.8-r*.4,1,r*.6,'#F2A04E');L.r(x,yb-r*1.6-1,1,2,'#4E6A2A');L.p(x+1,yb-r*1.6-1,'#6E8A3A');}
function hayBale(L,x,yb,w,h){x=Math.round(x);yb=Math.round(yb);w=Math.round(w);h=Math.round(h);
  // v10: no lugar do fardo de feno, um pote de barro
  L.el(x+w/2,yb-h*.5,w*.5,h*.55,'#8A4A2A');L.el(x+w/2-w*.12,yb-h*.6,w*.2,h*.3,'#B06A3E');L.r(x+w*.3,yb-h-1,w*.4,2,'#6A3820');}
function mandacaru(L,x,yb,h,c,cl2){x=Math.round(x);yb=Math.round(yb);h=Math.max(4,Math.round(h));const w=Math.max(2,Math.round(h*.16));c=c||'#3E6A2E';cl2=cl2||'#6A9A44';
  L.r(x,yb-h,w,h,c);L.r(x,yb-h,1,h,cl2);const a=Math.round(h*.45),b=Math.round(h*.6);
  L.r(x-w-1,yb-a,w+1,Math.max(1,w-1),c);L.r(x-w-1,yb-a-Math.round(h*.3),Math.max(1,w-1),Math.round(h*.3),c);
  L.r(x+w,yb-b,w,Math.max(1,w-1),c);L.r(x+w*2-1,yb-b-Math.round(h*.25),Math.max(1,w-1),Math.round(h*.25),c);L.p(x+Math.floor(w/2),yb-h-1,'#F49AC1');}
function feto(L,x,yb,r,c,cl2){for(let i=-3;i<=3;i++){const a=i*.42-1.57;for(let j=0;j<r;j++){const px=x+Math.cos(a)*j*(1+Math.abs(i)*.12),py=yb+Math.sin(a)*j*.9+j*j*.04*Math.abs(i);L.p(px,py,j%2?c:cl2);}}}
function fencePost(L,x,yb,hg,c,cd,wd){wd=Math.max(2,Math.round(wd||2));L.r(x,yb-hg,wd,hg,c);L.r(x+wd-1,yb-hg,1,hg,cd);L.r(x,yb-hg,wd,1,'#D9A066');L.r(x,yb-hg-1,wd-1,1,c);}
function bush(L,x,yb,r,c,seed){for(let i=0;i<4;i++){const a=hs(i,1,seed)*2-1,rr=r*(.55+.3*hs(i,2,seed));L.el(x+a*r*.6,yb-rr*.8-(i===3?r*.3:0),rr,rr*.8,c[0]);}
  for(let i=0;i<4;i++){const a=hs(i,1,seed)*2-1,rr=r*(.55+.3*hs(i,2,seed));L.el(x+a*r*.6-rr*.15,yb-rr*.95-(i===3?r*.3:0),rr*.7,rr*.55,c[1]);L.el(x+a*r*.6-rr*.35,yb-rr*1.15-(i===3?r*.3:0),rr*.3,rr*.22,c[2]);}}

/* ---------- desenho do terreno sob cada lugar ---------- */
const TPX={
  // Sertão: chão rachado de barro vermelho
  milharal(x,y,q,dx,dy,s){const n=nz2(x*.3,y*.5,s);let c=n>.6?'#C47A44':n<.35?'#9A5832':'#B06A3A';const k=((x*3+y*7+Math.floor(nz(y*.4,s)*9))%11);if(k===0||(hs(x>>1,y,s)<.05))c='#5A3020';else if(hs(x,y,s+3)<.06)c='#D8945A';return c;},
  // Mata: musgo escuro e folhas caídas
  pomar(x,y,q,dx,dy,s){const n=nz2(x*.3,y*.45,s);let c=n>.6?'#2E6A30':n<.32?'#163E1E':'#225428';const h=hs(x,y,s);if(h<.06)c='#4E8E3A';else if(h<.09)c='#8A5A2A';else if(h<.11)c='#0E2A14';return c;},
  brejo(x,y,q,dx,dy,s){
    if(q<.42){const h=hs(x,y,s);if(dy<-.2&&q>.26)return '#5A7A4A';return h<.12?'#3E6A3A':h<.2?'#2E5A34':'#244E2E';}
    if(q<.8){const rip=((y*3+Math.floor(x/5+nz(y,s)*3))%7);if(rip===0&&hs(x>>1,y,s)<.6)return '#4E9AA0';if(q<.48)return '#103A48';return dy<0?'#164A58':'#1A5462';}
    return hs(x,y,s)<.3?'#2A2418':'#3A3020';},
  // Noite: capim escuro com brilho violeta
  pasto(x,y,q,dx,dy,s){const n=nz2(x*.35,y*.5,s);let c=n>.62?'#3A3A5E':n<.35?'#22223E':'#2E2E4E';const h=hs(x,y,s);if(h<.05)c='#7B5BD6';else if(h<.15)c='#1A1A30';return c;},
  // Arraial: terreiro de barro batido com confete
  neutro(x,y,q,dx,dy,s){const h=hs(x>>1,y,s);let c='#B88452';if(h<.2)c='#CC9862';else if(h<.34)c='#9C6C40';if(hs(x,y,s+5)<.03)c=['#E8693A','#F2C230','#4FB3E8','#3FA34D'][(x+y)&3];return c;}
};
const TRIM={milharal:'#4A2418',pomar:'#0E2A14',brejo:'#2A2418',pasto:'#14142A',neutro:'#6A4428'};
const ICON={
  milharal:['..g..','g.g..','ggg.g','..ggg','..g..'],
  pomar:['...gg','..ggg','.gGg.','gGg..','g....'],
  brejo:['.....','.b...','bWb.b','b.bWb','...b.'],
  pasto:['.yy..','yy...','yy..Y','yy...','.yy..'],
  neutro:['ooooo','rYb..','.r.b.','..Y..','.....']
};
const ICOL={y:'#F4E3B5',Y:'#F2C230',g:'#3E8A3A',G:'#9BE08A',r:'#E8693A',W:'#FFFFFF',w:'#FFFFFF',b:'#2E9FB5',o:'#6B4630'};
function marker(L,x,yb,terr){
  x=Math.round(x);yb=Math.round(yb);
  L.r(x+3,yb-3,2,4,'#4B2C17');L.p(x+4,yb-3,'#6B4630');L.r(x+2,yb,4,1,'#1A1420');
  const y0=yb-12,c=TCOR[terr]||'#A87A4E';
  // placa redonda 9x9
  L.r(x+1,y0,7,9,'#1A1420');L.r(x,y0+1,9,7,'#1A1420');
  L.r(x+1,y0+1,7,7,c);L.r(x+2,y0+1,5,7,c);
  L.r(x+2,y0+2,5,5,'#F4E3B5');
  const ic=ICON[terr]||ICON.neutro;
  for(let j=0;j<5;j++)for(let i=0;i<5;i++){const ch=ic[j][i];if(ch!=='.')L.p(x+2+i,y0+2+j,ICOL[ch]);}
  L.p(x+1,y0+1,'#FFFFFF');
}
function patch(L,E,cx,cy,rx,ry,terr,seed,near){
  const ph=[hs(seed,1,9)*6.28,hs(seed,2,9)*6.28,hs(seed,3,9)*6.28];
  const rr=a=>1+.08*Math.sin(3*a+ph[0])+.06*Math.sin(5*a+ph[1])+.05*Math.sin(2*a+ph[2]);
  const f=TPX[terr];
  for(let y=Math.floor(cy-ry*1.4);y<=Math.ceil(cy+ry*1.5);y++)for(let x=Math.floor(cx-rx*1.3);x<=Math.ceil(cx+rx*1.3);x++){
    const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry,q=Math.hypot(dx,dy)/rr(Math.atan2(dy,dx));
    if(q>=1){if(q<1.16&&dy>.3&&th(x,y)<.55)L.dk(x,y,.78);continue;}
    if(q>.82&&th(x,y)>(1-q)/.18)continue;
    let c=f(x,y,q,dx,dy,seed,cy);
    if(dy>.35&&q>.86&&terr!=='brejo')c=TRIM[terr];
    L.p(x,y,c);
  }
  const R=(i,j)=>hs(i,j,seed);
  const inP=(px,py,lim)=>{const dx=(px-cx)/rx,dy=(py-cy)/ry;const d=Math.hypot(dx,dy);return d<lim&&d>.38;};
  const sc=near?1:.8;
  if(terr==='milharal'){
    // seixos e rachaduras; mandacarus e xique-xique dos lados
    for(let i=0;i<20;i++){const px=Math.round(cx+(R(i,1)*2-1)*rx*.85),py=Math.round(cy+(R(i,2)*2-1)*ry*.8);if(!inP(px,py,.8))continue;L.p(px,py,i%3?'#7A4A2A':'#D8A468');}
    for(const sd of [-1,1]){const bx=cx+sd*rx*.74,by=cy-ry*.15;mandacaru(L,bx,by,ry*(2.1)*sc+3);if(near)mandacaru(L,bx+sd*4,by+2,ry*1.2*sc+2,'#4E7A34','#7AAA4E');}
  }else if(terr==='pomar'){
    for(let i=0;i<20;i++){const px=Math.round(cx+(R(i,3)*2-1)*rx*.9),py=Math.round(cy+(R(i,4)*2-1)*ry*.85);if(!inP(px,py,.85))continue;
      L.p(px,py,i%3===0?'#8A5A2A':i%2?'#4E8E3A':'#0E2A14');}
    feto(L,cx+rx*.8,cy+ry*.1,Math.max(3,ry*.9*sc+1),'#2E6A30','#5E9E44');feto(L,cx-rx*.8,cy,Math.max(3,ry*.8*sc+1),'#225428','#4E8E3A');
    // bromélia com flor vermelha
    const bx=cx-rx*.62,by=cy-ry*.45;for(let i=-2;i<=2;i++)L.line(bx,by,bx+i*1.6,by-3*sc-Math.abs(i===0?2:0),'#3E8A3A');L.p(bx,by-4*sc,'#E8693A');L.p(bx,by-5*sc,'#F2C230');
  }else if(terr==='brejo'){
    for(let i=0;i<3;i++){const a=(i/3)*6.28+R(i,5)*1.2,px=cx+Math.cos(a)*rx*.66,py=cy+Math.sin(a)*ry*.66;
      L.el(px,py,2.2*sc+.5,1.3*sc+.3,'#2E6A3A');L.p(px+1,py-1,'#5E9E54');L.p(Math.round(px)+1,Math.round(py),'#1A5462');if(i===1){L.p(px-1,py-1,'#F49AC1');L.p(px,py-1,'#FFFFFF');}}
    for(const sd of [-1,1]){const bx=cx+sd*rx*.86,by=cy-ry*.15;for(let i=0;i<(near?3:2);i++)cattail(L,bx+sd*i*2-sd,by+i,ry*(1.5+.3*i)*sc+1);}
    for(let i=0;i<8;i++){const a=R(i,6)*6.28,d=.55+.22*R(i,7);E.water.push([cx+Math.cos(a)*rx*d,cy+Math.sin(a)*ry*d,R(i,8)*6.28]);}
  }else if(terr==='pasto'){
    // capim escuro com pontinhos de luz violeta (vaga-lumes da Noite)
    for(let i=0;i<18;i++){const px=Math.round(cx+(R(i,3)*2-1)*rx*.92),py=Math.round(cy+(R(i,4)*2-1)*ry*.85);if(!inP(px,py,.86))continue;
      L.p(px,py,i%3?'#7B5BD6':'#C8B8FF');L.p(px,py+1,'#1A1A30');}
    for(const sd of [-1,1]){const bx=cx+sd*rx*.8,by=cy-ry*.2;for(let i=0;i<3;i++)E.tufts.push([bx+sd*i*2.5-sd*2,by+i*1.5,Math.round(ry*(1.1+.25*i)*sc)+2,'#2E2E4E','#7B5BD6',R(i,9)*6]);}
  }else{
    for(let i=0;i<24;i++){const px=Math.round(cx+(R(i,3)*2-1)*rx*.9),py=Math.round(cy+(R(i,4)*2-1)*ry*.8);if(!inP(px,py,.85))continue;
      L.r(px,py,1+(i%2),1,['#E8693A','#F2C230','#4FB3E8','#3FA34D'][i%4]);}
    const bw=Math.round(rx*.36),bh=Math.round(ry*.95)+2;hayBale(L,cx-rx*.92,cy-ry*.05,bw,bh);
    hayBale(L,cx+rx*.92-bw*.8,cy-ry*.3,Math.round(bw*.8),Math.round(bh*.8));
  }
}

/* ---------- fundos e enfeites por arena ---------- */
function sky(S,A,P,E){
  const W=S.W,H=S.H,n=P.sky.length;
  for(let y=0;y<H;y++){const pos=cl(y/(E.hz+1),0,1)*(n-1),i=Math.min(n-2,Math.floor(pos)),f=pos-i,f2=cl((f-.55)/.45,0,1);
    for(let x=0;x<W;x++)S.d[y*W+x]=pk(th(x,y)<f2?P.sky[i+1]:P.sky[i]);}
  const hz=E.hz;
  if(A===1&&!E.noite){const sx=W*.2,sy=hz*.86,r=Math.max(4,hz*.16);S.el(sx,sy,r*2.6,r*1.6,'#E88A4A',.45);S.el(sx,sy,r*1.6,r*1.2,'#F2A85A',.6);S.el(sx,sy,r,r,'#FFD08A');for(let y=Math.round(sy-r*.2);y<sy+r;y+=3)S.r(sx-r,y,r*2,1,'#E8864A');}
  if(A===2){const sx=W*.66,sy=hz*.7,r=Math.max(4,hz*.2);S.el(sx,sy,r*2.6,r*1.6,'#6A9A70',.35);S.el(sx,sy,r*1.4,r*1.0,'#A8C89A',.4);}
  if(A===3){const sx=W*.3,sy=hz*.32,r=Math.max(3,hz*.09);S.el(sx,sy,r*1.8,r*1.8,'#7E9C92',.5);S.el(sx,sy,r,r,'#C8D8C8');S.el(sx+r*.3,sy-r*.2,r*.4,r*.4,'#B0C4B4');}
  if(A===4){{const mx=W*.74,my=hz*.34,r=Math.max(4,hz*.15);S.el(mx,my,r*2.2,r*2.2,'#3A2E62',.5);S.el(mx,my,r*1.4,r*1.4,'#5A4A8A',.5);S.el(mx,my,r,r,'#E8E4F8');S.el(mx+r*.25,my-r*.1,r*.3,r*.25,'#C8C4E0');}for(let y=0;y<hz*.6;y++)for(let x=0;x<W;x++){const v=nz2(x*.04,y*.16,44)-y/(hz*2.2);if(v>.5)S.p(x,y,v>.6?'#3E4A5E':'#4A586C');else if(v>.45&&th(x,y)<.5)S.p(x,y,'#4A586C');}}
  if(A===5||A===4||E.noite){
    for(let i=0;i<W*hz/40;i++){const x=hs(i,1,55)*W,y=hs(i,2,55)*hz*.7;S.p(x,y,hs(i,3,55)<.3?'#FFE58A':'#E4E8F8');if(i%7===0)E.stars.push([x,y,hs(i,4,55)*6]);}
    if(A!==4){const mx=W*.82,my=hz*.25,r=Math.max(3,hz*.08);S.el(mx,my,r*1.6,r*1.6,A===5?'#4A3E70':'#38466A',.5);S.el(mx,my,r,r,'#F4EAC8');S.el(mx+r*.35,my-r*.2,r*.7,r*.75,A===5?'#3A2F62':'#2B3A55');}
  }
  if(A===5){for(let y=Math.floor(hz*.55);y<H;y++)for(let x=0;x<W;x++){const g=1-Math.abs(x/W-.5)*1.6;if(g>0&&th(x,y)<g*.35*((y-hz*.55)/(hz*.45)))S.p(x,y,'#E8864A');}}
}
function ridge(L,hz,base,amp,seed,freq,c,cl2,yEnd){
  const W=L.W;for(let x=0;x<W;x++){const top=Math.round(base-amp*(nz(x*freq,seed)*.75+nz(x*freq*3,seed+1)*.25));
    for(let y=Math.max(0,top);y<=yEnd;y++)L.p(x,y,y===top||(y===top+1&&th(x,y)<.5)?cl2:c);}
}
function farDecor(L,A,P,E){
  const W=L.W,H=L.H,hz=E.hz,yR=E.yR,ryR=E.ryR,gaps=E.gaps;
  const sz=Math.max(.7,Math.min(1.6,hz/26));// tamanho dos objetos do fundo
  const farEnd=yR-ryR-2;
  if(A===1){
    // Sertão: casa de taipa com telhado de palha, porteira, juazeiro e mandacarus contra o poente
    const bx=gaps[1],bw=Math.round(15*sz),bh=Math.round(8*sz),by=hz+3;
    L.r(bx-bw/2,by-bh,bw,bh,'#B07A4A');L.r(bx-bw/2,by-bh,2,bh,'#C8905A');L.r(bx+bw/2-2,by-bh,2,bh,'#7A4A2A');
    for(let y=by-bh;y<by;y+=3)for(let x=Math.round(bx-bw/2);x<bx+bw/2;x+=4)L.p(x+((y>>1)&1)*2,y,'#8A5A34');
    for(let j=0;j<Math.round(bw*.4);j++)L.r(bx-bw/2-2+j,by-bh-1-j*.7,bw+4-j*2,1,j%2?'#8A6A3A':'#A8844A');
    L.r(bx-2,by-bh*.6,4,bh*.6,'#3A2414');L.r(bx+bw*.22,by-bh*.7,3,3,'#F2A85A');E.smoke=[bx+bw*.3,by-bh-bw*.28];
    const px=gaps[2]+4*sz;for(let i=0;i<3;i++)L.r(px+i*5*sz,by-5*sz,1,5*sz,'#4A2C18');for(let i=0;i<3;i++)L.r(px,by-4*sz+i*1.6*sz,10*sz,1,'#6A4428');L.line(px,by-1,px+10*sz,by-5*sz,'#6A4428');
    const jua=(x,y,r)=>{L.r(x-1,y-r*1.1,2,r*1.1,'#3A2414');L.el(x,y-r*1.4,r*1.5,r*.8,'#2E4A26');L.el(x-r*.3,y-r*1.6,r,r*.5,'#3E5E2E');};
    jua(W*.2,hz+2,4*sz);jua(W*.93,hz+3,5*sz);
    for(const [x,h] of [[W*.06,13],[W*.33,9],[W*.7,11],[W*.84,7]])mandacaru(L,x,hz+3,h*sz,'#2A3A22','#3E5230');
    for(let r=0;r<3;r++){const y=Math.round(hz+5+r*(farEnd-hz-5)/3);if(y+2>farEnd)break;for(let x=0;x<W;x+=1){if(nz(x*.1+r*3,77)>.62){L.p(x,y,'#5E3E24');if(x%5===0){L.p(x,y-1,'#6A6A34');L.p(x+1,y-2,'#7A7A3A');}}}}
  }else if(A===2){
    // Mata: paredão de copas escuras, troncos de samaúma, cipós e raios de luz
    for(let x=-4;x<W+6;x+=Math.round(7*sz)){treeRound(L,x+hs(x,1,21)*3,hz-1,4.2*sz,['#12301C','#1A3E24','#24502E'],x);}
    for(const tx of [W*.12,gaps[1]+6*sz,W*.86]){const tw=Math.round(3*sz)+1,th2=Math.round(hz*.9);L.r(tx,hz+4-th2,tw,th2,'#3A2E22');L.r(tx,hz+4-th2,1,th2,'#5A4A36');
      for(let k=0;k<3;k++)L.line(tx+tw,hz+4-k,tx+tw+3*sz+k,hz+6,'#3A2E22');L.el(tx+1,hz+4-th2,9*sz,3.5*sz,'#163A22');L.el(tx-2,hz+3-th2,6*sz,2.4*sz,'#24502E');}
    for(let x=0;x<W+8;x+=Math.round(11*sz)){const xx=x+hs(x,2,22)*4;treeRound(L,xx,hz+4,5*sz,['#14361E','#1E4A28','#2E6034'],x+5);}
    for(let i=0;i<5;i++){const x=W*(.1+i*.2)+hs(i,1,23)*6;for(let y=0;y<hz*.8;y++)if(hs(i,y,24)<.8)L.p(x+Math.sin(y*.3+i)*1.5,y+2,'#2A5A32');}
    for(const gx of [W*.32,W*.62])for(let y=0;y<hz+6;y++)for(let x=Math.round(gx-2+y*.3);x<gx+4+y*.45;x++)if(th(x,y)<.18)L.tint(x,y,'#C8E8A8',.35);
    for(let x=0;x<W;x+=3)if(nz(x*.1,25)>.5)feto(L,x,hz+8+hs(x,1,26)*3,3*sz,'#1E4A28','#3E7A3A');
  }else if(A===3){
    // margem d'água ao fundo, árvores secas e salgueiros, névoa
    for(let y=hz-1;y<hz+4;y++)for(let x=0;x<W;x++)L.p(x,y,(y+(x>>3))%3===0?'#7EA8A0':'#5E8E8A');
    for(let x=0;x<W;x+=3)if(hs(x,1,31)<.5)L.p(x,hz+1,'#A8C8C0');
    const dead=(x,yb,h)=>{L.r(x,yb-h,1+(h>14?1:0),h,'#1E3A34');const br=[[.4,-1],[.6,1],[.8,-1]];for(const [f,d] of br){const y=yb-h*f;for(let i=1;i<h*.3;i++)L.p(x+d*i,y-i*.7,'#1E3A34');}};
    dead(W*.08,hz,16*sz);dead(W*.27,hz+1,11*sz);dead(W*.66,hz,13*sz);dead(W*.92,hz+1,18*sz);
    const wil=(x,yb,r)=>{L.r(x-1,yb-r*1.2,2,r*1.2,'#2A3A2A');for(let i=0;i<r*5;i++){const a=hs(i,1,x)*3.14+3.14,d=hs(i,2,x)*r;const px=x+Math.cos(a)*d*1.2,py=yb-r*1.4+Math.sin(a)*d*.7;const len=2+hs(i,3,x)*r*.9;for(let j=0;j<len;j++)L.p(px,py+j,j%3===0?'#4E7A58':'#3A6448');}};
    wil(gaps[1],hz+3,6*sz);
    for(let x=0;x<W;x+=2)if(nz(x*.12,33)>.55){cattail(L,x,hz+5+hs(x,2,33)*2,4*sz+hs(x,3,33)*3);}
    for(let y=hz-6;y<hz+3;y++)for(let x=0;x<W;x++)if(th(x,y)<.28*(1-Math.abs(y-hz+2)/6))L.tint(x,y,'#B2C6B4',.6);
  }else if(A===4){
    // Tapera: casa de taipa abandonada, ipê seco com olhos de coruja, cerca torta e lampião violeta
    const sx=gaps[1],sw=Math.round(Math.max(12,14*sz)),by=hz+5,sh=Math.round(9*sz);
    L.r(sx-sw/2,by-sh,sw,sh,'#3A3040');L.r(sx-sw/2,by-sh,2,sh,'#4A4052');for(let y=by-sh+1;y<by;y+=3)L.r(sx-sw/2+2,y,sw-4,1,'#2E2636');
    for(let j=0;j<Math.round(sw*.42);j++){if(j>sw*.2&&j<sw*.3)continue;L.r(sx-sw/2-1+j,by-sh-1-j*.6,sw+2-j*2,1,'#2A2232');}
    L.r(sx-2,by-sh*.6,4,sh*.6,'#120E1A');L.r(sx+sw*.2,by-sh*.75,3,3,'#120E1A');L.p(sx+sw*.2+1,by-sh*.75+1,'#9C7FF0');
    const ipe=(x,yb,h)=>{L.r(x,yb-h,2,h,'#1A1626');const br=[[.45,-1],[.62,1],[.8,-1],[.9,1]];for(const [f,d] of br){const y=yb-h*f;for(let i=1;i<h*.35;i++)L.p(x+d*i,y-i*.6,'#1A1626');}};
    ipe(gaps[2],hz+4,18*sz);L.p(gaps[2]-3*sz,hz+4-18*sz*.75,'#F2C230');L.p(gaps[2]-3*sz+2,hz+4-18*sz*.75,'#F2C230');
    ipe(W*.07,hz+2,12*sz);ipe(W*.94,hz+3,14*sz);
    for(let x=0;x<W;x+=Math.round(5*sz)){if(Math.abs(x-sx)<sw)continue;const lean=hs(x,1,42)*2-1;L.line(x,hz+7,x+lean*2,hz+7-5*sz,'#2A2436');}
    for(let x=0;x<W;x++){if(Math.abs(x-sx)<sw)continue;L.p(x,hz+5+Math.round(Math.sin(x*.2)),'#2A2436');}
    const lx=gaps[0]+2;L.r(lx,hz-10*sz,1,10*sz+6,'#1A1626');E.lamps.push([lx,hz-10*sz+2]);E.lampCor=['#9C7FF0','#7B5BD6','#E8E4F8','#3A2E62'];
    for(let y=hz-4;y<hz+8;y++)for(let x=0;x<W;x++)if(th(x,y)<.22*(1-Math.abs(y-hz-2)/6))L.tint(x,y,'#6A5A9A',.45);
  }else{
    // Arraial: coreto, fogueira no vão do meio, mastros com bandeirinhas, barracas
    const cx=W*.09,cw=Math.round(10*sz),ch=Math.round(7*sz),by=hz+2;
    for(const d of [-1,1])L.r(cx+d*cw*.4,by-ch,1,ch,'#E8DCC8');L.r(cx-cw/2,by-2,cw,2,'#8A5A30');
    for(let j=0;j<cw*.5;j++)L.r(cx-cw/2-1+j,by-ch-1-j*.8,cw+2-j*2,1,j%2?'#C4362F':'#F2C230');L.p(cx,by-ch-cw*.42,'#F2C230');
    for(const bx2 of [W*.9]){const bw2=Math.round(9*sz),bh2=Math.round(6*sz);L.r(bx2-bw2/2,by-bh2,bw2,bh2,'#6A4428');for(let i=0;i<bw2;i+=2)L.r(bx2-bw2/2+i,by-bh2-2,2,3,i%4?'#E8693A':'#F4E3B5');L.p(bx2,by-bh2*.5,'#FFD040');}
    const fx=gaps[1],fy=hz+7,zs=sz*1.3;
    for(let y=Math.round(fy-16*sz);y<H;y++)for(let x=0;x<W;x++){const d=Math.hypot((x-fx)/(W*.45),(y-fy+3)/(H*.42));if(d<1)L.tint(x,y,'#F0A050',.45*(1-d)*(1-d)+(th(x,y)<(1-d)*.5?.06:0));}
    for(const gx of [gaps[0],gaps[2]])for(let y=hz-2;y<hz+12;y++)for(let x=Math.round(gx-12);x<gx+12;x++){const d=Math.hypot((x-gx)/12,(y-hz-3)/7);if(d<1&&th(x,y)<(1-d)*.7)L.tint(x,y,'#F2C27A',.25);}
    for(let j=0;j<5*zs;j++){L.line(fx-4*zs+j*.3,fy,fx+j*.4,fy-6*zs+j*.5,'#6B4630');L.line(fx+4*zs-j*.3,fy,fx-j*.4,fy-6*zs+j*.5,'#4B2C17');}
    L.r(fx-5*zs,fy-1,10*zs,2,'#4B2C17');E.fire=[fx,fy-2,zs];
    for(const gx of [gaps[0],gaps[2]]){L.r(gx,hz-16*sz,1,16*sz+6,'#4B2C17');E.lamps.push([gx,hz-16*sz+2]);}
    const flags=['#C4362F','#F2C230','#4A7FC1','#9BD34B','#F49AC1','#E8862E','#FFFFFF'];
    const pts=[[-2,hz*.25],[gaps[0],hz-16*sz],[gaps[2],hz-16*sz],[W+2,hz*.25]];
    let fi=0;for(let s=0;s<pts.length-1;s++){const [x0,y0]=pts[s],[x1,y1]=pts[s+1];const sag=Math.max(3,(x1-x0)*.12);
      for(let x=Math.ceil(x0);x<x1;x++){const u=(x-x0)/(x1-x0);const y=y0+(y1-y0)*u+sag*4*u*(1-u);L.p(x,y,'#2A2030');
        if((x-Math.ceil(x0))%4===1){const c=flags[(fi++)%flags.length];L.r(x,y+1,3,1,c);L.r(x,y+2,2,1,c);L.p(x,y+3,c);}}}
    hayBale(L,W*.2,hz+6,4*sz,4*sz);hayBale(L,W*.8,hz+7,5*sz,5*sz);
  }
}

function foreDecor(L,A,P,E){
  const W=L.W,H=L.H,yb=H+1,gaps=[0,...E.gaps,W],big=Math.max(1,Math.min(2.2,E.rxP/14));
  const bottomTop=E.yP+E.ryP+2;
  // faixa de capim alto na borda de baixo (primeiro plano)
  for(let x=0;x<W;x++){const hh=Math.round((2+4*nz(x*.18,71)+2*hs(x,1,71))*big);const lean=(x%3)-1;
    for(let j=0;j<hh;j++)L.p(x+(j>hh*.6?lean:0),H-1-j,j>=hh-1?P.gr[2]:(j<hh*.5?P.gd:P.gr[4]));}
  // moitas nas laterais do campo
  {const cb=[P.gd,P.gr[3],P.gl];const r=Math.max(4,E.rxP*.42);
   for(const [x,y,s] of [[-r*.25,E.yM-E.cRy*.2,1],[W+r*.25,E.yM+E.cRy*.4,1.1],[-r*.2,E.yP-E.ryP*2.4,.8],[W+r*.2,E.yR+E.ryR*3.5,.75]])bush(L,x,y,r*s,cb,Math.round(x+y));}
  gaps.forEach((gx,i)=>{const s=big*(i===0||i===gaps.length-1?1.15:.9);const x=gx+(i===0?3*s:i===gaps.length-1?-3*s:0);
    if(A===1){if(i%2===0)mandacaru(L,x,H,12*s,'#2A4A22','#4E7A34');else{stone(L,x+2*s,H,6*s,'#8A5A3A','#B07A4A','#4A2C1A');L.el(x-3*s,H-2*s,3*s,2*s,'#6A6A34');}}
    else if(A===2){feto(L,x,H,7*s,'#1E4A28','#3E7A3A');L.el(x+4*s,H-2*s,3*s,2*s,'#14361E');if(i===2){L.r(x+5*s,H-6*s,2*s,6*s,'#3A2E22');}}
    else if(A===3){for(let j=0;j<4;j++)cattail(L,x+(j-1.5)*2.2*s,H+1,(8+hs(j,i,63)*6)*s);L.el(x+5*s,H-1,3*s,1.4*s,'#1A5462');L.el(x+5*s,H-1.2,2*s,1*s,'#2E6A3A');}
    else if(A===4){stone(L,x,H,7*s,'#3A3646','#4E4A5E','#1E1A2A');if(i%2){const lean=(i%4?1:-1);L.line(x+5*s,H,x+5*s+lean*2*s,H-11*s,'#2A2436');}for(let j=0;j<5;j++)L.line(x-4*s+j*2*s,H,x-5*s+j*2*s+3*s,H-6*s-j%2*2*s,'#2E2E4E');}
    else{if(i%2===0)hayBale(L,x-2*s,H,5*s,5*s);else{const h=Math.round(12*s);L.r(x,H-h,1,h,'#4B2C17');for(let j=0;j<3;j++)L.r(x+1,H-h+1+j*2,3-j,1,['#E8693A','#F2C230','#4FB3E8'][j]);}}
  });
  // tufos animados: nas bordas de baixo e em volta do chão de briga
  for(let i=0;i<gaps.length;i++){const x=gaps[i]+(i===0?6:i===gaps.length-1?-6:0)*big;E.tufts.push([x+4*big,H-2*big,Math.round(5*big),P.gr[3],P.gl,i*1.7]);E.tufts.push([x-5*big,H-1,Math.round(4*big),P.gr[2],P.gl,i*2.3]);}
  for(let i=0;i<6;i++){const a=i/6*6.28+.3,x=W/2+Math.cos(a)*E.cRx*1.02,y=E.yM+Math.sin(a)*E.cRy*1.05;if(y>bottomTop-2||y<E.yR+E.ryR+2)continue;
    if(E.lanes.some(lx=>Math.abs(lx-x)<E.rxP))continue;E.tufts.push([x,y,Math.round(3*big)+1,P.gr[2],P.gl,i]);}
}

function midDecor(L,A,P,E){
  const W=L.W,H=L.H,cx=E.Wl/2;
  const free=(x,y)=>{
    if(y<E.yR+E.ryR*1.8||y>H-8)return false;
    const qx=(x-cx)/E.cRx,qy=(y-E.yM)/E.cRy;if(qx*qx+qy*qy<1.35)return false;
    for(const lx of E.lanes){
      const a=(x-lx)/(E.rxR*1.35),b=(y-E.yR)/(E.ryR*2.2);if(a*a+b*b<1)return false;
      const c=(x-lx)/(E.rxP*1.35),d=(y-E.yP)/(E.ryP*2.4);if(c*c+d*d<1)return false;
      if(y>E.yP-E.rxP*1.6&&y<E.yP&&Math.abs(x-lx)<E.rxP*.8)return false;
      const u=cl((y-E.yR)/(E.yM-E.yR),0,1),v=cl((E.yP-y)/(E.yP-E.yM),0,1);
      if(y<E.yM&&Math.abs(x-(lx+(cx-lx)*.12*u))<E.rxR*.6)return false;
      if(y>E.yM&&Math.abs(x-(lx+(cx-lx)*.12*v))<E.rxP*.6)return false;
    }
    return x>3&&x<W-3;};
  let placed=0;
  for(let i=0;i<400&&placed<14;i++){
    const x=hs(i,1,A*31)*W,y=E.yR+hs(i,2,A*31)*(H-E.yR);if(!free(x,y))continue;placed++;
    const d=cl((y-E.hz)/(H-E.hz),0,1),s=.6+d*.9,kind=i%4;
    if(kind===0){stone(L,x,y,Math.round(3+3*s),'#6A5E50','#8A7E6C','#3A3228');stone(L,x+3*s,y+1,Math.round(2+2*s),'#5A5044','#7A6E5E','#2E2820');}
    else if(kind===1){for(let j=0;j<5;j++){const fx=x+(hs(j,i,3)*2-1)*3*s,fy=y+(hs(j,i,4)*2-1)*1.5*s;const c=P.fl[j%3];L.p(fx,fy+1,P.gd);L.p(fx,fy,c);if(s>1.1){L.p(fx-1,fy,c);L.p(fx+1,fy,c);L.p(fx,fy-1,c);L.p(fx,fy,'#F2C230');}}}
    else if(A===1){mandacaru(L,x,y,5*s,'#3E6A2E','#6A9A44');}
    else if(A===2){feto(L,x,y,3*s,'#1E4A28','#3E7A3A');}
    else if(A===3){L.el(x,y,4*s,1.6*s,'#2A6E74');L.el(x+s,y-.4*s,2.4*s,.7*s,'#5EB4B0');E.water.push([x-s,y,i]);if(kind===3){cattail(L,x+4*s,y,5*s);}}
    else if(A===4){for(let j=0;j<5;j++)L.line(x+j*1.2*s-3*s,y,x+(j-2)*2*s,y-4*s-(j%2)*s,j%2?'#3A3A5E':'#2E2E4E');}
    else{hayBale(L,x-s,y,3*s,3*s);}
  }
}
/* ---------- montagem das camadas paradas ---------- */
function build(w,h,o){
  let A=(o.arena|0)||1;A=((A-1)%5+5)%5+1;
  const P=ARC[A];
  const k=Math.max(2,Math.round(Math.min(w/160,h/140)));
  const Wl=w/k,Hl=h/k,W=Math.ceil(Wl),H=Math.ceil(Hl);
  const num=(v,d)=>typeof v==='number'&&isFinite(v)?v:d;
  const lanesX=(o.lanesX&&o.lanesX.length?o.lanesX:[.14,.38,.62,.86]);
  const lanes=lanesX.map(v=>v*Wl);
  const yR=num(o.yR,.28)*Hl,yP=num(o.yP,.8)*Hl,yM=num(o.yMid,(num(o.yR,.28)+num(o.yP,.8))/2)*Hl;
  let sp=Wl/4;for(let i=1;i<lanes.length;i++)sp=Math.min(sp,lanes[i]-lanes[i-1]);
  const rxP=Math.max(8,Math.min(sp*.46,Hl*.15)),ryP=rxP*.45,rxR=rxP*.78,ryR=ryP*.78;
  const hz=Math.round(cl(yR*.56,8,yR-ryR-6));
  const gaps=[];for(let i=1;i<lanes.length;i++)gaps.push((lanes[i-1]+lanes[i])/2);
  while(gaps.length<3)gaps.push(Wl*(gaps.length+1)/4);
  const E={A,k,W,H,Wl,Hl,hz,yR,yP,yM,rxP,ryP,rxR,ryR,gaps,lanes,noite:!!o.noite,
    tufts:[],water:[],stars:[],hives:[],lamps:[],smoke:null,mill:null,fire:null,cRx:Wl*.47,cRy:Math.max(6,(yP-yR)*.2)};
  // céu
  const S=mkBuf(W,hz+3);sky(S,A,P,E);
  // terra
  const L=mkBuf(W,H);
  ridge(L,hz,hz-hz*.18,hz*.42,A*7+1,.03,P.h1,P.h1l,hz+1);
  ridge(L,hz,hz+1,hz*.22,A*7+2,.06,P.h2,P.h2l,hz+1);
  if(A!==3&&A!==5)for(let x=0;x<W;x+=1){if(nz(x*.09,A*9)>.62){const r=1.5+nz(x*.3,A)*2.5*Math.max(.7,hz/26);L.el(x,hz+1-r*.6,r,r*.8,hs(x,1,A)<.5?P.tr[0]:P.tr[1]);}}
  if(A===5)for(let x=0;x<W;x+=1){if(nz(x*.09,A*9)>.6){const r=1.5+nz(x*.3,A)*3;L.el(x,hz+1-r*.6,r,r*.9,P.tr[0]);}}
  // chão: faixas de profundidade com manchas grandes (calmo, sem chiado)
  const n=P.gr.length;
  for(let y=hz;y<H;y++){const d=cl((y-hz)/(H-hz),0,1);for(let x=0;x<W;x++){
    const m=nz2(x*.045,y*.085,A*13)-.5+(nz2(x*.13,y*.22,A*13+1)-.5)*.35;
    const pos=cl(d*(n-1)+m*1.7,0,n-1),i=Math.min(n-2,Math.floor(pos)),f=cl(((pos-i)-.42)/.16,0,1);
    L.d[y*W+x]=pk(th(x,y)<f?P.gr[i+1]:P.gr[i]);}}
  // tufinhos de capim (maiores perto) e pintas escuras
  const cnt=Math.round(W*H/48);
  for(let i=0;i<cnt;i++){const x=Math.floor(hs(i,1,A*17)*W),y=Math.floor(hz+2+hs(i,2,A*17)*(H-hz-2));const d=(y-hz)/(H-hz);
    const len=1+Math.round(d*2.4);L.p(x,y,P.gd);for(let j=1;j<=len;j++)L.p(x,y-j,j===len?P.gl:P.gr[Math.min(n-1,1+Math.round(d*2))]);
    if(d>.35){L.p(x-1,y-len+1,P.gl);L.p(x+1,y-len+1,P.gl);L.p(x-1,y,P.gd);L.p(x+1,y,P.gd);}
    if(hs(i,4,A*17)<.05*(A===4?.5:1)){const fc=P.fl[i%3];L.p(x+2,y-len,fc);if(d>.5){L.p(x+1,y-len,fc);L.p(x+3,y-len,fc);L.p(x+2,y-len-1,fc);L.p(x+2,y-len,'#F2C230');}}}
  for(let i=0;i<cnt*.25;i++){const x=Math.floor(hs(i,5,A*17)*W),y=Math.floor(hz+2+hs(i,6,A*17)*(H-hz-2));L.p(x,y,P.gd);}
  farDecor(L,A,P,E);
  // trilhas de terra pisada dos lugares até o meio
  const D=P.dirt;
  const trail=(x0,y0,x1,y1,w0,w1,s)=>{const nn=Math.ceil(Math.abs(y1-y0));for(let i=0;i<=nn;i++){const u=i/nn,x=x0+(x1-x0)*u+(nz(i*.2,s)-.5)*3,y=y0+(y1-y0)*u,ww=w0+(w1-w0)*u;
    for(let xx=Math.floor(x-ww);xx<=Math.ceil(x+ww);xx++){const e=Math.abs(xx-x)/ww;if(e>1)continue;const yy=Math.round(y);if(th(xx,yy)<(1-e)*1.4-.15)L.p(xx,yy,hs(xx,yy,s)<.15?D[2]:D[1]);}}};
  lanes.forEach((lx,i)=>{trail(lx,yR+ryR*.5,lx+(Wl/2-lx)*.12,yM-E.cRy*.5,rxR*.28,rxR*.42,i+5);trail(lx,yP-ryP*.5,lx+(Wl/2-lx)*.12,yM+E.cRy*.5,rxP*.3,rxP*.48,i+9);});
  // chão de briga (clareira de terra batida)
  {const cx=Wl/2,cy=yM,rx=E.cRx,ry=E.cRy;
    for(let y=Math.floor(cy-ry*1.3);y<=Math.ceil(cy+ry*1.3);y++)for(let x=0;x<W;x++){
      const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry;const a=Math.atan2(dy,dx);const q=Math.hypot(dx,dy)/(1+.1*Math.sin(4*a+1)+.07*Math.sin(7*a+2)+.12*(nz(x*.08,91)-.5));
      if(q>=1)continue;if(q>.8&&th(x,y)>(1-q)/.2)continue;
      const lt=nz2(x*.06,y*.15,92);let c=lt>.66?D[0]:lt<.26?D[2]:D[1];if(q>.85&&dy>0)c=D[2];
      const hh=hs(x,y,93);if(hh<.01)c=D[3];else if(hh<.025)c=D[0];
      L.p(x,y,c);}
    // pedrinhas, pegadas e arranhões da briga
    for(let i=0;i<Math.round(rx*ry*.06);i++){const a=hs(i,1,94)*6.28,d=Math.sqrt(hs(i,2,94))*.85;const x=cx+Math.cos(a)*rx*d,y=cy+Math.sin(a)*ry*d;
      const t=i%5;if(t===0){L.p(x,y,D[3]);L.p(x+1,y,D[0]);}else if(t===1){L.p(x,y,D[3]);L.p(x+2,y+1,D[3]);}else if(t===2){L.r(x,y,3,1,D[2]);}else if(t===3){stone(L,x,y,3,'#9A9488','#C9CFC9','#5E5850');}}
    const s=Math.max(2,Math.round(ry*.4));// (v10: sem marcas cruzadas no centro: nada de cruz/encruzilhada, ver spec §2.3)
    for(let i=0;i<14;i++){const a=i/14*6.28,x=cx+Math.cos(a)*rx*.18,y=cy+Math.sin(a)*ry*.55;if(i%2)L.p(x,y,D[0]);else{L.p(x,y,'#C9CFC9');L.p(x,y+1,D[3]);}}
  }
  // lugares (rival ao fundo, você na frente)
  const tr=a=>a&&TERRS_OK[a]?a:'neutro';
  const terrR=o.terrR||[],terrP=o.terrP||[];
  midDecor(L,A,P,E);
  lanes.forEach((lx,i)=>{patch(L,E,lx,yR,rxR,ryR,tr(terrR[i]),100+i*13+A,false);});
  lanes.forEach((lx,i)=>{marker(L,lx-rxR*.98-4,yR+ryR*.55,tr(terrR[i]));});
  lanes.forEach((lx,i)=>{patch(L,E,lx,yP,rxP,ryP,tr(terrP[i]),200+i*13+A,true);});
  lanes.forEach((lx,i)=>{marker(L,lx-rxP*.98-4,yP+ryP*.6,tr(terrP[i]));});
  foreDecor(L,A,P,E);
  // vinheta suave e névoa de distância
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const vx=x/W-.5,vy=y/H-.5;const v=vx*vx*1.3+vy*vy*1.1;
    if(v>.22){const f=cl((v-.22)/.16,0,1)*2,lo=Math.floor(f),fr=f-lo;const lev=lo+(th(x,y)<fr?1:0);if(lev)L.dk(x,y,lev>=2?.8:.9);}}
  if(E.noite){for(const B of [S,L])for(let i=0;i<B.d.length;i++){const v=B.d[i];if(!v)continue;const r=(v&255)*.45,g=((v>>8)&255)*.5,b=Math.min(255,((v>>16)&255)*.7+18);B.d[i]=((255<<24)|(Math.round(b)<<16)|(Math.round(g)<<8)|Math.round(r))>>>0;}}
  // nuvens (desenho por quadro)
  E.clouds=[];const nc=A===3?0:A===5?2:A===4?4:A===2?0:3;
  for(let i=0;i<nc;i++)E.clouds.push([hs(i,1,A*5)*W,(.12+hs(i,2,A*5)*.5)*hz,(.6+hs(i,3,A*5)*.7)*Math.max(.8,hz/30),(A===4?1.2:.6)+hs(i,4,A)*.6]);
  E.sky=toCanvas(S);E.land=toCanvas(L);
  return E;
}

const cache=new Map();
function getE(w,h,o){
  w=Math.max(16,Math.round(w));h=Math.max(16,Math.round(h));
  const key=[o.arena|0,w,h,(o.terrP||[]).join(','),(o.terrR||[]).join(','),(o.lanesX||[]).join(','),o.yR,o.yP,o.yMid,o.noite?1:0].join('|');
  let E=cache.get(key);
  if(E){cache.delete(key);cache.set(key,E);return E;}
  E=build(w,h,o);cache.set(key,E);
  while(cache.size>6)cache.delete(cache.keys().next().value);
  return E;
}

/* ---------- quadro: camadas + animação ambiente ---------- */
function pintar(g,w,h,o){
  o=o||{};
  const E=getE(w,h,o),k=E.k,t=+o.t||0,P=ARC[E.A],A=E.A,W=E.W,hz=E.hz;
  g.save();g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;
  const F=(c,x,y,ww,hh)=>{g.fillStyle=c;g.fillRect(Math.round(x)*k,Math.round(y)*k,Math.max(1,Math.round(ww))*k,Math.max(1,Math.round(hh))*k);};
  g.drawImage(E.sky,0,0,E.sky.width*k,E.sky.height*k);
  // estrelas piscando
  for(const [x,y,ph] of E.stars)if(Math.sin(t*2.2+ph)>.55)F('#FFFFFF',x,y,1,1);
  // nuvens
  for(const [x0,y,s,v] of E.clouds){const cw=Math.round(12*s),x=((x0+t*v)%(W+cw*2)+W+cw*2)%(W+cw*2)-cw;const c=E.noite?['#56628A','#46527A','#38446A']:P.cloud;
    F(c[0],x+2*s,y-2*s,5*s,2*s);F(c[0],x+6*s,y-3*s,4*s,3*s);F(c[0],x,y,cw,2*s);F(c[1],x+1*s,y+2*s,cw-2*s,1*s);F(c[2],x+3*s,y+3*s,cw-6*s,1);}
  // pássaros longe
  if(A===1){for(let i=0;i<3;i++){const sp=A===4?9:5;const x=((i*61+t*sp*(1+i*.15))%(W+20))-10,y=hz*(.25+i*.12)+Math.sin(t*1.3+i)*2;const up=Math.sin(t*9+i*2)>0;
    const c='#2A1A24';F(c,x,y,1,1);F(c,x-1,y-(up?1:0),1,1);F(c,x+1,y-(up?1:0),1,1);if(A===4){F(c,x-2,y-(up?1:-1)*0,1,1);F(c,x+2,y,1,1);}}}
  g.drawImage(E.land,0,0,E.land.width*k,E.land.height*k);
  // fumaça da chaminé
  if(E.smoke){const [sx,sy]=E.smoke;for(let i=0;i<4;i++){const u=((t*.35+i/4)%1);const r=1+u*2.5;F(u<.5?'#E8EEF0':'#C8D4DA',sx+u*6+Math.sin(t+i)*1,sy-2-u*14,r,r);}}
  // moinho girando
  if(E.mill){const [mx,my,r]=E.mill,a0=t*1.6;for(let b=0;b<4;b++){const a=a0+b*Math.PI/2,ca=Math.cos(a),sa=Math.sin(a);
    for(let j=1;j<=r;j++){F(j>2?'#E4D8C0':'#6B4630',mx+ca*j,my+sa*j,1,1);if(j>2)F('#B8A88A',mx+ca*j-sa,my+sa*j+ca,1,1);}}F('#4B2C17',mx-1,my-1,2,2);}
  // fogueira e lanternas da festa
  if(E.fire){const [fx,fy,s]=E.fire;for(let i=0;i<5;i++){const hh=(3+2*Math.sin(t*8+i*1.7)+ (i===2?3:0))*s;const x=fx+(i-2)*1.2*s;F('#E8862E',x,fy-hh,Math.max(1,s),hh);F('#F2C230',x,fy-hh*.6,Math.max(1,s*.7),hh*.6);}
    F('#FFF2B0',fx,fy-2*s,1,2);for(let i=0;i<4;i++){const u=(t*.6+i/4)%1;F(u<.5?'#F2C230':'#E8862E',fx+Math.sin(t*3+i*2)*3*s,fy-6*s-u*hz*.5,1,1);}}
  for(const [lx,ly] of E.lamps){const fl=Math.sin(t*6+lx)>-.6;const lc=E.lampCor||['#F2C230','#E8862E','#FFF2B0','#C4362F'];F('#1A1420',lx-1,ly-1,3,1);F(fl?lc[0]:lc[1],lx-1,ly,3,3);F(lc[2],lx,ly+1,1,1);F(lc[3],lx-1,ly+3,3,1);}
  // abelhas
  for(const [hx,hy] of E.hives){for(let i=0;i<3;i++){const a=t*(2+i*.4)+i*2.1,x=hx+Math.cos(a)*(4+i*2),y=hy-3+Math.sin(a*1.7)*2.5;F('#F2C230',x,y,2,1);F('#1A1420',x+1,y,1,1);if(Math.sin(t*30+i)>0)F('#FFFFFF',x,y-1,1,1);}}
  // brilho na água
  for(let i=0;i<E.water.length;i++){const [x,y,ph]=E.water[i];const v=Math.sin(t*2.5+ph);if(v>.5)F('#BFEAE6',x,y,v>.85?2:1,1);}
  // capim balançando
  const vent=1;
  for(const [x,y,hh,c1,c2,ph] of E.tufts){const sw=Math.sin(t*1.8*vent+ph+x*.05)*vent;
    for(let b=-1;b<=1;b++){const hb=Math.max(2,Math.round(hh*(b?0.75:1)));for(let j=0;j<hb;j++){const off=Math.round(b*(j/hb)*2+sw*(j/hb)*(j/hb)*2);F(j>=hb-1?c2:c1,x+off,y-j,1,1);}}}
  // partículas: pólen, pétalas, vaga-lumes, folhas ao vento
  const H=E.H;
  if(A===1||A===2){for(let i=0;i<(A===2?10:8);i++){const x=((hs(i,1,7)*W+t*(3+hs(i,2,7)*4))%(W+4))-2,y=hz+(hs(i,3,7)*(H-hz))+Math.sin(t*1.5+i)*3;
    F(A===2?(i%2?'#C8E86A':'#FFF6B0'):(i%2?'#FF9A30':'#FFD040'),x,A===1?y-((t*6+i*13)%(H*.4)):y,1,1);}
    for(let i=0;i<0;i++){const x=E.gaps[i*2]+Math.sin(t*.7+i*3)*12,y=E.yM-E.cRy*1.3+Math.sin(t*1.1+i)*6;const up=Math.sin(t*14+i)>0;const c=i?'#FFFFFF':'#F2C230';F(c,x-1,y-(up?1:0),1,1);F(c,x+1,y-(up?1:0),1,1);F('#1A1420',x,y,1,1);}}
  if(A===3||A===5||E.noite){for(let i=0;i<10;i++){const x=hs(i,1,8)*W+Math.sin(t*.5+i)*8,y=hz+hs(i,2,8)*(H-hz)*.9+Math.sin(t*.8+i*2)*5;const v=Math.sin(t*2+i*1.3);if(v>-.2){F(v>.6?'#FFF6B0':'#C8E86A',x,y,1,1);}}}
  if(A===4){for(let i=0;i<8;i++){const x=hs(i,1,9)*W+Math.sin(t*.4+i)*10,y=hz+hs(i,2,9)*(H-hz)*.9+Math.sin(t*.7+i*2)*5;if(Math.sin(t*1.6+i*1.3)>0)F(i%2?'#9C7FF0':'#C8B8FF',x,y,1,1);}}
  if(A===5){const per=7,u=(t%per)/per;if(u<.28){const fx=E.Wl*(.2+.6*hs(Math.floor(t/per),1,5)),fy=hz*.35,r=u*40;const cs=['#F49AC1','#F2C230','#9FD4F0'];const c=cs[Math.floor(t/per)%3];
    for(let i=0;i<10;i++){const a=i/10*6.28;F(c,fx+Math.cos(a)*r*.5,fy+Math.sin(a)*r*.4,1,1);}}}
  // névoa do brejo e da tapera, passando devagar
  if(A===3||A===4){g.globalAlpha=.07;for(let i=0;i<3;i++){const y=hz-2+i*((E.yP-hz)/3)+Math.sin(t*.3+i)*2,x=((t*(2+i)+i*70)%(W*1.6))-W*.6,bw=W*.7;
    for(let j=0;j<4;j++){const ins=bw*j*.12;F(A===4?'#8A7AC0':'#D0E0D8',x+ins,y-j*.5,bw-ins*2,2+i+j*.5);}}g.globalAlpha=1;}
  g.restore();
}
return {pintar,preparar:(o,w,h)=>{o=o||{};w=w||o.w;h=h||o.h;if(w&&h)getE(w,h,o);},arenas:ARC};
})();
function cenarioPintar(g,w,h,o){CENARIO.pintar(g,w,h,o);}
function cenarioPreparar(o,w,h){CENARIO.preparar(o,w,h);}

