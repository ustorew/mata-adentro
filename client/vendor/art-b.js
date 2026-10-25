(function(){
  window.CARD_ART = window.CARD_ART || {};
  const CARD_ART = window.CARD_ART;
  const C = {
    ol:'#1A1420', // outline / near-black
    sd:'#3B2A2F', // deep shadow brown
    wd:'#6B4630', // dark wood / soil
    wo:'#A0673A', // wood / soil
    st:'#D9A066', // straw / sand
    cr:'#F4E3B5', // cream / warm light
    wh:'#FFFFFF', // white highlight
    yl:'#F2C230', // corn yellow
    or:'#E8862E', // orange (beaks, pumpkin, sunrise)
    rd:'#C4362F', // apple red
    wn:'#7A1F3D', // wine / cherry shadow
    pk:'#F49AC1', // pink (blossoms, cheeks, noses)
    gd:'#2F5E2A', // dark green
    gr:'#4E9A3A', // green
    lm:'#9BD34B', // lime / sprout light
    td:'#1F4E5A', // deep teal (swamp shadow)
    tq:'#3B8F86', // teal (swamp)
    bl:'#4A7FC1', // blue (sky top, water)
    sk:'#9FD4F0', // light sky
    pu:'#5A3E8C', // purple (magic, night)
    li:'#A77BE0', // lilac (magic light)
    gy:'#7D8A8C', // stone grey
    lg:'#C9CFC9', // light grey (wool, stone light)
    nt:'#2B3A55'  // night blue
  };

  // ---------------------------------------------------------------- helpers
  const W = 64, H = 48;
  const fl = Math.floor;
  // filled rect, integer + clipped
  const R = (g,c,x,y,w,h)=>{
    x = fl(x); y = fl(y); w = fl(w); h = fl(h);
    if (x < 0) { w += x; x = 0; } if (y < 0) { h += y; y = 0; }
    if (x + w > W) w = W - x; if (y + h > H) h = H - y;
    if (w > 0 && h > 0 && c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  };
  const P = (g,c,x,y)=>R(g,c,x,y,1,1);
  const hs = (x,y)=>(((x*73856093)^(y*19349663))>>>0);
  // run-merged fill of every pixel (x,y) in the box where f(x,y) is true
  function F(g,c,x0,y0,x1,y1,f){
    x0 = Math.max(0, fl(x0)); y0 = Math.max(0, fl(y0));
    x1 = Math.min(W-1, Math.ceil(x1)); y1 = Math.min(H-1, Math.ceil(y1));
    for (let y = y0; y <= y1; y++) {
      let s = -1;
      for (let x = x0; x <= x1; x++) {
        if (f(x,y)) { if (s < 0) s = x; }
        else if (s >= 0) { R(g,c,s,y,x-s,1); s = -1; }
      }
      if (s >= 0) R(g,c,s,y,x1+1-s,1);
    }
  }
  // ellipse test, continuous centre, pixel-centre sampling
  const inE = (x,y,cx,cy,rx,ry)=>{ const a=(x+0.5-cx)/rx, b=(y+0.5-cy)/ry; return a*a+b*b<=1; };
  const eF = (cx,cy,rx,ry)=>(x,y)=>inE(x,y,cx,cy,rx,ry||rx);
  function E(g,c,cx,cy,rx,ry){ ry = ry||rx; F(g,c,cx-rx-1,cy-ry-1,cx+rx+1,cy+ry+1,eF(cx,cy,rx,ry)); }
  const dil = f=>(x,y)=>f(x,y)||f(x-1,y)||f(x+1,y)||f(x,y-1)||f(x,y+1);
  const any = (...fs)=>(x,y)=>{ for (const f of fs) if (f(x,y)) return true; return false; };
  function inPoly(px,py,p){
    let c = false;
    for (let i = 0, j = p.length-2; i < p.length; j = i, i += 2) {
      const xi=p[i], yi=p[i+1], xj=p[j], yj=p[j+1];
      if ((yi > py) !== (yj > py) && px < (xj-xi)*(py-yi)/(yj-yi)+xi) c = !c;
    }
    return c;
  }
  const pF = p=>(x,y)=>inPoly(x+0.5,y+0.5,p);
  function box(p){ let a=1e9,b=1e9,c=-1e9,d=-1e9; for(let i=0;i<p.length;i+=2){ if(p[i]<a)a=p[i]; if(p[i]>c)c=p[i]; if(p[i+1]<b)b=p[i+1]; if(p[i+1]>d)d=p[i+1]; } return [a-2,b-2,c+2,d+2]; }
  function PG(g,c,p){ const b=box(p); F(g,c,b[0],b[1],b[2],b[3],pF(p)); }
  const mv = (p,dx,dy)=>p.map((v,i)=>i%2?v+dy:v+dx);
  const mirror = p=>p.map((v,i)=>i%2?v:64-v);
  // shape with outline + base + shadow (bottom-right band) + optional light edge (top-left band)
  function body(g,f,bx,base,shadow,light,o,sh){
    sh = sh||2;
    if (o) F(g,o,bx[0]-1,bx[1]-1,bx[2]+1,bx[3]+1,dil(f));
    F(g,base,bx[0],bx[1],bx[2],bx[3],f);
    if (shadow) F(g,shadow,bx[0],bx[1],bx[2],bx[3],(x,y)=>f(x,y)&&!f(x+sh,y+sh));
    if (light) F(g,light,bx[0],bx[1],bx[2],bx[3],(x,y)=>f(x,y)&&!f(x-1,y-1));
  }
  function LN(g,c,x0,y0,x1,y1,w){
    w = w||1; const dx=x1-x0, dy=y1-y0, n=Math.max(Math.abs(dx),Math.abs(dy))||1;
    for (let i = 0; i <= n; i++) R(g,c,Math.round(x0+dx*i/n),Math.round(y0+dy*i/n),w,w);
  }
  const K = {o:C.ol,s:C.sd,d:C.wd,w:C.wo,t:C.st,c:C.cr,W:C.wh,y:C.yl,O:C.or,r:C.rd,n:C.wn,p:C.pk,G:C.gd,g:C.gr,l:C.lm,T:C.td,q:C.tq,b:C.bl,k:C.sk,u:C.pu,i:C.li,Y:C.gy,L:C.lg,N:C.nt};
  // ASCII sprite: '.' = skip; runs merged per row
  function S(g,x,y,rows,flip){
    for (let j = 0; j < rows.length; j++) {
      const r = rows[j], n = r.length;
      let i = 0;
      while (i < n) {
        const ch = flip ? r[n-1-i] : r[i];
        if (ch === '.' || ch === ' ' || !K[ch]) { i++; continue; }
        let k = i+1;
        while (k < n && (flip ? r[n-1-k] : r[k]) === ch) k++;
        R(g,K[ch],x+i,y+j,k-i,1); i = k;
      }
    }
  }
  const eye = (g,x,y,w,h)=>{ R(g,C.ol,x,y,w||2,h||3); P(g,C.wh,x,y); };
  const spark = (g,c,x,y,big)=>{ if (big) { R(g,c,x-2,y,5,1); R(g,c,x,y-2,1,5); P(g,C.wh,x,y); } else { R(g,c,x-1,y,3,1); R(g,c,x,y-1,1,3); } };
  // sparse 2x2-checker dither of colour c inside f (fake transparency / glow)
  function dith(g,c,x0,y0,x1,y1,f,ph){ ph=ph||0; for(let y=y0;y<=y1;y++) for(let x=x0+((y+ph)&1);x<=x1;x+=2) if(f(x,y)) P(g,c,x,y); }
  function bgCeleiro(g,v){
    const A = v?C.wd:C.wo, B = v?C.sd:C.wd;
    R(g, v?C.ol:C.sd, 0,0,64,34);
    for (let i = 0; i < 13; i++) R(g, i%2?B:A, i*5, 0, 4, 34);
    for (let i = 0; i < 13; i++) if (hs(i,3)%2) P(g, v?C.ol:C.sd, i*5+1+(hs(i,8)%2), 6+(hs(i,5)%20));
    R(g, v?C.sd:C.wd, 0,12,64,2);
    R(g, v?C.ol:C.sd, 3,3,10,8);
    R(g, v?C.nt:C.cr, 4,4,8,6);
    if (v) { P(g,C.li,9,5); P(g,C.cr,6,7); } else { R(g,C.wh,5,5,2,1); }
    R(g, v?C.ol:C.sd, 7,4,1,6); R(g, v?C.ol:C.sd, 4,6,8,1);
    R(g, v?C.wo:C.st, 0,34,64,14);
    R(g, v?C.sd:C.wo, 0,34,64,1);
    for (let i = 0; i < 18; i++) { const x = (i*11+hs(i,1)%7)%62, y = 36+(hs(i,4)%11); R(g, v?C.st:C.yl, x, y, 2+(i%2), 1); }
  }


  // ---------------------------------------------------------------- extra helpers (B)
  // thick polyline: (x,y) inside if within r of any segment
  function tubeF(pts,r){
    const r2 = r*r;
    return (x,y)=>{
      const px = x+0.5, py = y+0.5;
      for (let i = 0; i+3 < pts.length; i += 2) {
        const ax=pts[i], ay=pts[i+1], bx=pts[i+2], by=pts[i+3];
        const vx=bx-ax, vy=by-ay, L=vx*vx+vy*vy||1;
        let u=((px-ax)*vx+(py-ay)*vy)/L; u=u<0?0:u>1?1:u;
        const dx=px-(ax+vx*u), dy=py-(ay+vy*u);
        if (dx*dx+dy*dy<=r2) return true;
      }
      return false;
    };
  }
  // tapered quadratic-bezier blade (leaf / horn / tail): width w0 at start -> w1 at end
  function bezF(x0,y0,x1,y1,x2,y2,w0,w1,n){
    n = n||22; const S = [];
    for (let i = 0; i <= n; i++) { const u=i/n, a=(1-u)*(1-u), b=2*u*(1-u), c=u*u; const w=w0+(w1-w0)*u; S.push([a*x0+b*x1+c*x2, a*y0+b*y1+c*y2, w*w]); }
    return (x,y)=>{ const px=x+0.5, py=y+0.5; for (const s of S) { const dx=px-s[0], dy=py-s[1]; if (dx*dx+dy*dy<=s[2]) return true; } return false; };
  }
  const bez = (x0,y0,x1,y1,x2,y2,u)=>{ const a=(1-u)*(1-u), b=2*u*(1-u), c=u*u; return [a*x0+b*x1+c*x2, a*y0+b*y1+c*y2]; };
  // blade along angle a from (cx,cy), length L, half-width w (elliptic profile)
  function bladeF(cx,cy,a,L,w){
    const ux=Math.cos(a), uy=Math.sin(a);
    return (x,y)=>{ const dx=x+0.5-cx, dy=y+0.5-cy, s=(dx*ux+dy*uy)/L; if (s<0||s>1) return false; const q=-dx*uy+dy*ux; return Math.abs(q) <= w*Math.sqrt(4*s*(1-s))+0.15; };
  }
  const ringF = (cx,cy,rx,ry,th)=>(x,y)=>inE(x,y,cx,cy,rx,ry)&&!inE(x,y,cx,cy,rx-th,ry-th*ry/rx);
  function cloud(g,x,y,a,b){
    const f = any(eF(x,y+1,4,2),eF(x+4,y-0.5,3.6,2.8),eF(x+8,y+1,3.6,2));
    F(g,a,x-5,y-4,x+13,y+4,f);
    F(g,b,x-5,y-4,x+13,y+4,(px,py)=>f(px,py)&&!f(px,py+2));
  }
  // blinking fireflies / sparkles (deterministic, phase per index)
  function flies(g,t,pts,c){
    for (let i = 0; i < pts.length; i++) if (((t*1.1 + i*0.41) % 1.7) < 1.25) P(g, c||C.lm, pts[i][0], pts[i][1]);
  }

  // ---------------------------------------------------------------- terrains (B)
  // Brejo: v 0 normal, 1 escuro (feitiço), 2 noite, 3 crepúsculo
  function bgBrejo(g,v,o){
    o = o||{};
    const dk = v===1, nt = v===2, du = v===3;
    if (du) { R(g,C.nt,0,0,64,4); R(g,C.pu,0,4,64,7); R(g,C.li,0,11,64,3); }
    else R(g,(dk||nt)?C.nt:C.td,0,0,64,14);
    if (dk||nt||du) for (let i = 0; i < 9; i++) P(g, i%3?C.lg:C.cr, (i*17+hs(i,2)%7)%64, 1+hs(i,7)%(du?4:12));
    // mist band y14-19: td/tq checker with wisps
    const ma = du?C.pu:(dk?C.nt:C.td), mb = dk?C.td:C.tq;
    R(g,ma,0,14,64,6);
    for (let x = hs(v,1)%5; x < 64; x += 9) R(g,mb,x,14+((x>>1)&1),3+(x%3),1);
    for (let x = 0; x < 64; x += 4) { R(g,mb,x,17,2,1); P(g,mb,x+3,16); }
    R(g,mb,0,18,64,2);
    for (let x = hs(v,3)%6; x < 64; x += 8) R(g,ma,x,18+((x>>2)&1),2+(x%2),1);
    // reed bank y20-29
    R(g,C.gd,0,20,64,10);
    for (let x = 0; x < 64; x += 4) R(g,C.td,x+1,29,2,1);
    if (!o.noReeds) for (let x = 1; x < 64; x += (o.sparse?5:3)) {
      const xx = x + (hs(x,5)%2), top = 18 + hs(x,11)%7;
      R(g, dk?C.td:C.gr, xx, top, 1, 29-top);
      if (hs(x,13)%4===0) R(g, dk?C.sd:C.wo, xx, top-1, 1, 2);
    }
    // water y30-47
    R(g,C.td,0,30,64,18);
    R(g,dk?C.nt:C.gd,0,30,64,1);
    for (let i = 0; i < 12; i++) { const y = 32 + (i*5)%15, x = (i*23 + hs(i,9)%11)%60; R(g, dk?C.nt:C.tq, x, y, 3+hs(i,4)%4, 1); }
    if (!dk) for (let i = 0; i < 4; i++) P(g, C.sk, (i*19+7)%62, 33+(i*7)%13);
  }

  // Pasto: v 0 dia, 1 escuro (feitiço), 2 tempestade, 3 nascer do sol
  const hillY = (x,s)=>20 + Math.round(3*Math.sin((x+(s||0))/10));
  function bgPasto(g,v,o){
    o = o||{};
    const dk = v===1, sm = v===2, su = v===3;
    if (su) { R(g,C.or,0,0,64,7); R(g,C.yl,0,7,64,6); R(g,C.cr,0,13,64,11); }
    else if (sm) { R(g,C.nt,0,0,64,8); R(g,C.gy,0,8,64,16); }
    else if (dk) { R(g,C.nt,0,0,64,8); R(g,C.bl,0,8,64,16); }
    else { R(g,C.bl,0,0,64,8); R(g,C.sk,0,8,64,16); }
    if (!o.noClouds && !su && !sm) {
      const c1 = o.c1||[5,5], c2 = o.c2||[47,11];
      cloud(g,c1[0],c1[1],dk?C.lg:C.wh,dk?C.gy:C.lg);
      cloud(g,c2[0],c2[1],dk?C.lg:C.wh,dk?C.gy:C.lg);
    }
    const s = o.hs||0, hill = sm?C.gd:C.gr, crest = sm?C.gr:C.lm;
    if (!o.noHill) {
      F(g,hill,0,16,63,24,(x,y)=>y>=hillY(x,s));
      R(g,hill,0,24,64,24);
      F(g,crest,0,16,63,24,(x,y)=>y===hillY(x,s));
      for (let i = 0; i < 14; i++) { const x = (i*13+hs(i,3)%7)%61+1, y = 33+(i*7+hs(i,5)%5)%13; R(g, sm?C.td:C.gd, x, y, 1, 2); P(g, sm?C.gr:C.lm, x+1, y+1); }
    }
    if (!o.noFence) {
      const pc = sm?C.wd:C.wo, ps = sm?C.sd:C.wd;
      R(g,ps,0,25,64,1); R(g,ps,0,28,64,1);
      for (let x = 4; x < 64; x += 10) { R(g,pc,x,24,1,8); R(g,ps,x+1,24,1,8); }
    }
  }

  // ======================================================== BREJO
  // 20. Sapinho Verruguento
  CARD_ART['sapinho-verruguento'] = function(g,t){
    bgBrejo(g,0);
    const pf = (t%1.5) >= 1.0;
    // ripples around the pad
    R(g,C.tq,6,44,5,1); R(g,C.tq,52,43,6,1); R(g,C.tq,9,46,3,1); R(g,C.tq,55,46,4,1);
    // lily pad with a notch
    const pad = (x,y)=>inE(x,y,32,41,19,4.6) && !(y>=41 && (x-33)>=(y-41)*0.9 && (x-33)<=(y-41)*2.6+1);
    body(g,pad,[11,35,53,47],C.gd,null,C.gr,C.ol,2);
    F(g,C.gr,11,35,53,47,(x,y)=>pad(x,y)&&!pad(x,y-2));
    LN(g,C.gr,32,41,16,42); LN(g,C.gr,34,41,48,40);
    // frog
    const fb = any(eF(32,34,11,7), eF(32,28,12.5,5.5), eF(26,23,4.2,4), eF(38,23,4.2,4), eF(21,37,5,3.4), eF(43,37,5,3.4));
    body(g,fb,[14,17,50,43],C.gr,C.gd,C.lm,C.ol,2);
    // belly
    F(g,C.lm,24,33,40,42,(x,y)=>inE(x,y,32,38,6,3.5)&&fb(x,y));
    // feet with toes
    S(g,23,40,['.lll.','lgogl']); S(g,36,40,['.lll.','lgogl']);
    R(g,C.gd,22,41,1,1); R(g,C.gd,41,41,1,1);
    // warts
    for (const w of [[19,31],[22,27],[42,27],[45,31],[20,36],[44,36],[27,36],[36,36]]) { R(g,C.tq,w[0],w[1],2,1); P(g,C.td,w[0]+1,w[1]+1); }
    // eyes: cream balls, glaring pupils, grumpy brows
    R(g,C.cr,24,21,4,3); R(g,C.cr,36,21,4,3);
    R(g,C.ol,26,22,2,2); P(g,C.wh,26,22);
    R(g,C.ol,37,22,2,2); P(g,C.wh,37,22);
    LN(g,C.ol,23,19,28,21); LN(g,C.ol,41,19,36,21);
    P(g,C.gd,28,20); P(g,C.gd,35,20);
    // grumpy mouth + throat sac
    R(g,C.ol,25,30,15,1); P(g,C.ol,24,31); P(g,C.ol,40,31); P(g,C.ol,32,29);
    if (pf) {
      const sac = eF(32,34,6.5,3.6);
      F(g,C.gd,24,30,40,39,(x,y)=>dil(sac)(x,y)&&!sac(x,y)&&y>30);
      F(g,C.lm,24,30,40,39,(x,y)=>sac(x,y)&&y>30);
      R(g,C.cr,28,32,2,1); P(g,C.wh,28,32);
    } else {
      R(g,C.lm,29,31,7,1); R(g,C.gd,30,32,5,1);
    }
  };

  // 21. Libélula Faísca
  CARD_ART['libelula-faisca'] = function(g,t){
    bgBrejo(g,3);
    const sh = fl(t*8)%2, fk = fl(t*6)%3;
    // electric trail behind (lower-left)
    const tr = [14,37, 10,35, 9,39, 5,37, 3,41, 0,40];
    for (let i = 0; i+3 < tr.length; i += 2) LN(g, i<4?C.wh:C.yl, tr[i],tr[i+1],tr[i+2],tr[i+3]);
    P(g,C.yl,11,37); P(g,C.yl,8,37); P(g,C.yl,6,40);
    if (fk!==1) { spark(g,C.yl,7,33); spark(g,C.yl,13,42); }
    if (fk!==0) { P(g,C.wh,2,37); P(g,C.yl,16,41); spark(g,C.wh,20,40); }
    // wings (translucent)
    const da = sh ? 0.07 : 0;
    const wings = [bladeF(37,20,-1.95-da,16,3.2), bladeF(35,22,-2.5+da,15,3), bladeF(37,21,0.62+da,15,3.2), bladeF(35,23,1.18-da,14,3)];
    for (const w of wings) {
      F(g,C.sk,14,2,58,42,(x,y)=>dil(w)(x,y)&&!w(x,y));
      F(g,C.sk,14,2,58,42,(x,y)=>w(x,y)&&((y+sh)%3!==2));
      F(g,C.wh,14,2,58,42,(x,y)=>w(x,y)&&!w(x-1,y-1));
    }
    for (const w of [[37,20,-1.95-da,16],[35,22,-2.5+da,15],[37,21,0.62+da,15],[35,23,1.18-da,14]]) {
      const ex = w[0]+Math.cos(w[2])*w[3]*0.82, ey = w[1]+Math.sin(w[2])*w[3]*0.82;
      P(g,C.nt,Math.round(ex),Math.round(ey));
      LN(g,C.sk,w[0],w[1],Math.round(w[0]+Math.cos(w[2])*w[3]*0.6),Math.round(w[1]+Math.sin(w[2])*w[3]*0.6));
    }
    // abdomen
    const ab = tubeF([34,23, 24,30, 15,37],1.8);
    body(g,ab,[12,20,37,40],C.bl,C.nt,C.sk,C.ol,1);
    for (const p of [[30,26],[26,29],[22,32],[18,35]]) P(g,C.tq,p[0],p[1]);
    P(g,C.ol,13,38); P(g,C.ol,12,39);
    // thorax + head
    const th = any(eF(36.5,21.5,4,3.5), eF(42,17,4.2,3.9));
    body(g,th,[30,11,48,27],C.bl,C.nt,C.sk,C.ol,1);
    R(g,C.tq,35,22,2,1);
    // big cute eyes
    R(g,C.ol,41,15,3,3); P(g,C.wh,41,15); P(g,C.sk,42,15);
    R(g,C.ol,44,16,2,2); P(g,C.wh,44,16);
    P(g,C.ol,45,20); P(g,C.ol,44,20);
    // legs
    LN(g,C.ol,36,25,34,28); LN(g,C.ol,38,25,39,28);
  };

  // 22. Lodo Pegajoso (feitiço)
  CARD_ART['lodo-pegajoso'] = function(g,t){
    bgBrejo(g,1);
    const blob = any(eF(32,40,28,9.5), eF(20,31,9.5,7), eF(35,27,11,8.5), eF(49,33,8.5,6.5), eF(9,37,7,5.5));
    body(g,blob,[2,17,62,47],C.tq,C.td,C.gr,C.ol,3);
    // swirls + specks
    LN(g,C.td,14,38,20,36); LN(g,C.td,20,36,26,37); LN(g,C.td,38,35,46,33); LN(g,C.td,28,42,36,43);
    for (let y = 22; y < 47; y += 3) for (let x = 4+(y%2)*3; x < 61; x += 7) if (blob(x,y) && hs(x,y)%3===0) P(g,C.gd,x,y);
    for (const p of [[14,33],[27,25],[41,22],[52,30],[6,36]]) { R(g,C.lm,p[0],p[1],2,1); }
    // lost boot, sole up
    S(g,35,10,[
      '..oooooooooo.',
      '.ossssssssssso',
      '.oooooooooooso',
      '.otwwwwwwwwwwo',
      '.otwwwwwwwwddo',
      '.otwwwdooooooo',
      '.otwwwdo......',
      '.otwwwdo......',
      '.otwwwdo......'
    ]);
    P(g,C.cr,38,13);
    // mud collar + drips on the boot
    F(g,C.ol,33,17,46,22,(x,y)=>dil(eF(39,19.5,5.5,2.2))(x,y)&&y<20);
    F(g,C.tq,33,17,46,22,eF(39,19.5,5.5,2.2));
    R(g,C.gr,36,18,3,1);
    R(g,C.tq,38,14,1,3); R(g,C.tq,43,15,1,2);
    // surface bubbles
    const bub = (x,y,r)=>{ const f=eF(x,y,r,r); F(g,C.td,x-r-1,y-r-1,x+r+1,y+r+1,(a,b)=>dil(f)(a,b)&&!f(a,b)); F(g,C.gr,x-r,y-r,x+r,y+r,f); P(g,C.wh,fl(x-r/2),fl(y-r/2)); };
    bub(26,36,3); bub(17,29,2); bub(49,31,2); bub(9,36,1.6);
    // rising + popping bubbles
    for (let k = 0; k < 3; k++) {
      const p = (t*0.8 + k/3) % 1, bx = [22,31,46][k], by = [24,20,26][k] - fl(p*9);
      if (p < 0.8) { R(g,C.lm,bx,by,2,1); R(g,C.lm,bx,by+2,2,1); P(g,C.lm,bx-1,by+1); P(g,C.lm,bx+2,by+1); }
      else { P(g,C.lm,bx-1,by-1); P(g,C.lm,bx+2,by-1); P(g,C.lm,bx-1,by+2); P(g,C.lm,bx+2,by+2); P(g,C.wh,bx,by); }
    }
  };

  // 23. Taboa Espinhosa
  CARD_ART['taboa-espinhosa'] = function(g,t){
    bgBrejo(g,0,{noReeds:true});
    const sw = [0,1,0,-1][fl(t*1.2)%4], sw2 = [0,-1,0,1][fl(t*1.2+1)%4];
    // ripples at the base
    R(g,C.tq,14,44,8,1); R(g,C.tq,42,44,9,1); R(g,C.sk,24,46,3,1); R(g,C.tq,36,46,6,1);
    const leaf = (x0,y0,x1,y1,x2,y2,w,side)=>{
      const f = bezF(x0,y0,x1,y1,x2,y2,w,0.4);
      body(g,f,[Math.min(x0,x2)-4,Math.min(y0,y2)-4,Math.max(x0,x2)+4,Math.max(y0,y2)+4],C.gr,null,C.lm,C.ol,1);
      for (const u of [0.3,0.52,0.74]) {
        const p = bez(x0,y0,x1,y1,x2,y2,u), q = bez(x0,y0,x1,y1,x2,y2,u+0.02);
        let nx = -(q[1]-p[1]), ny = q[0]-p[0]; const L = Math.hypot(nx,ny)||1; nx/=L; ny/=L;
        const ww = w + (0.4-w)*u;
        for (const sg of (side ? [side] : [1,-1])) {
          const ex = Math.round(p[0]+nx*sg*(ww+0.6)), ey = Math.round(p[1]+ny*sg*(ww+0.6));
          P(g,C.lm,ex,ey); P(g,C.ol,Math.round(p[0]+nx*sg*(ww+1.8)), Math.round(p[1]+ny*sg*(ww+1.8)));
        }
      }
    };
    // back leaves
    leaf(26,45, 14,36, 6+sw,16, 2.5, 1);
    leaf(38,45, 50,35, 58+sw,14, 2.5, -1);
    // small cattails
    const cat = (x,cy,rx,ry,top,d)=>{
      R(g,C.ol,x-1,cy+ry-1,3,46-cy-ry); R(g,C.gd,x,cy+ry-1,1,46-cy-ry);
      R(g,C.ol,x+d-1,cy-ry-5,3,6); R(g,C.gd,x+d,cy-ry-4,1,5);
      const f = eF(x+d+0.5,cy,rx,ry);
      body(g,f,[x-rx-2,cy-ry-2,x+rx+3,cy+ry+2],C.wo,C.wd,C.st,C.ol,1);
    };
    cat(19,22,2.6,6.5,0,sw2);
    cat(45,19,2.6,6.5,0,sw2);
    // big cattail with a sleepy face
    R(g,C.ol,30,26,4,20); R(g,C.gd,31,26,2,20); R(g,C.gr,31,27,1,18);
    R(g,C.ol,31+sw,3,3,7); R(g,C.gd,32+sw,4,1,6);
    const big = eF(32.5+sw,17.5,5.4,9.5);
    body(g,big,[25,6,41,29],C.wo,C.wd,C.st,C.ol,2);
    for (const p of [[29,12],[33,10],[35,15],[30,24],[36,22],[28,18]]) P(g,C.wd,p[0]+sw,p[1]);
    // sleepy face
    S(g,28+sw,16,['ooo.ooo','oWo.oWo']);
    R(g,C.pk,27+sw,19,2,1); R(g,C.pk,35+sw,19,2,1);
    S(g,31+sw,20,['oo','on']);
    // front leaves with thorns
    leaf(29,45, 22,40, 14,29, 2.0, 1);
    leaf(35,45, 44,40, 51,30, 2.0, -1);
  };

  // 24. Garça Pescadora
  CARD_ART['garca-pescadora'] = function(g,t){
    bgBrejo(g,0);
    const wg = fl(t*5)%2, rp = fl(t*2.5)%4;
    // foreground reeds framing
    for (const r of [[3,22],[6,26],[58,24],[61,19]]) { R(g,C.gd,r[0],r[1],1,48-r[1]); R(g,C.wo,r[0],r[1]-3,1,3); }
    // ripple ring around the leg
    F(g,C.tq,10,36,50,47,ringF(29.5,43.5,3+rp*2,1+rp*0.6,1));
    F(g,C.sk,10,36,50,47,(x,y)=>ringF(29.5,43.5,3+rp*2,1+rp*0.6,1)(x,y)&&y<43);
    // standing leg + tucked leg
    R(g,C.ol,28,30,3,14); R(g,C.or,29,30,1,13); R(g,C.wd,29,36,1,1);
    R(g,C.ol,26,43,7,1); R(g,C.or,27,42,5,1);
    S(g,22,30,['.oo..','oOo..','oOo..','.oOoo','..ooOo','...oo.']);
    // tail feathers
    PG(g,C.ol,[20,25, 9,32, 11,34, 22,31]);
    PG(g,C.gy,[20,26, 11,32, 12,33, 21,30]);
    // body
    const bd = pF([16,29, 20,22, 27,18, 34,18, 38,21, 37,26, 31,30, 21,31]);
    body(g,bd,[14,16,40,33],C.wh,C.lg,null,C.ol,2);
    // wing
    const wi = pF([19,24, 27,21, 33,22, 32,27, 25,30, 17,30]);
    F(g,C.lg,15,19,35,32,wi);
    F(g,C.gy,15,19,35,32,(x,y)=>wi(x,y)&&!wi(x,y+2));
    LN(g,C.gy,22,25,28,23); LN(g,C.gy,21,28,29,25);
    R(g,C.ol,15,30,4,1);
    // neck (S curve)
    const nk = tubeF([35,21, 38,17, 37,14, 39,11],1.6);
    F(g,C.ol,32,7,42,24,dil(nk));
    F(g,C.wh,32,7,42,24,nk);
    F(g,C.lg,32,7,42,24,(x,y)=>nk(x,y)&&!nk(x+1,y));
    // head
    const hd = eF(41,10.5,3.2,2.4);
    F(g,C.ol,36,6,46,15,dil(hd)); F(g,C.wh,36,6,46,15,hd);
    LN(g,C.ol,39,9,33,7); LN(g,C.ol,39,10,34,9); P(g,C.ol,40,9);
    S(g,41,9,['Wy','yo']);
    // beak
    PG(g,C.ol,[43,8, 54,11, 54,13, 43,13]);
    PG(g,C.or,[44,9, 53,11, 53,12, 44,12]);
    R(g,C.wd,45,11,7,1);
    // fish in the beak, tail wiggling
    S(g,50,12,[
      '.oo.',
      'oLWo',
      'oLko',
      'oLko',
      'oLko',
      '.oo.'
    ]);
    P(g,C.ol,51,13);
    S(g,49+wg,18,['oLLo','.oo.']);
  };

  // 25. Atoleiro (feitiço)
  CARD_ART['atoleiro'] = function(g,t){
    bgBrejo(g,1,{noReeds:true});
    // dead trees silhouettes
    R(g,C.ol,4,8,2,22); LN(g,C.ol,5,12,1,8); LN(g,C.ol,5,15,10,10);
    R(g,C.ol,57,10,2,20); LN(g,C.ol,58,14,62,10); LN(g,C.ol,58,18,53,13);
    const cx = 32, cy = 32, RX = 29, RY = 13, rot = t*0.9;
    const wp = (x,y)=>inE(x,y,cx,cy,RX,RY);
    const bd = (x,y)=>{ const dx=(x+0.5-cx)/RX, dy=(y+0.5-cy)/RY, r=Math.sqrt(dx*dx+dy*dy); let s=Math.atan2(dy,dx)/(2*Math.PI)*3 + r*2.4 + rot; s-=fl(s); return [r,s]; };
    F(g,C.ol,0,17,63,46,(x,y)=>dil(wp)(x,y)&&!wp(x,y));
    F(g,C.td,0,18,63,45,wp);
    F(g,C.sd,0,18,63,45,(x,y)=>{ if(!wp(x,y)) return false; const b=bd(x,y); return b[0]>0.25 && b[1]<0.3; });
    F(g,C.gd,0,18,63,45,(x,y)=>{ if(!wp(x,y)) return false; const b=bd(x,y); return b[0]>0.3 && b[1]>0.48 && b[1]<0.6; });
    F(g,C.tq,0,18,63,45,(x,y)=>{ if(!wp(x,y)) return false; const b=bd(x,y); return b[0]>0.35 && b[0]<0.95 && b[1]>=0.3 && b[1]<0.36; });
    // foam rim
    F(g,C.tq,0,18,63,45,(x,y)=>wp(x,y)&&!inE(x,y,cx,cy,RX-1.2,RY-1)&&((x+y)&1));
    // eerie glow core
    F(g,C.tq,20,25,44,39,(x,y)=>inE(x,y,cx,cy,8,3.8)&&((x+y+fl(t*4))&1));
    F(g,C.tq,20,25,44,39,eF(cx,cy,5.5,2.6));
    F(g,C.lm,20,25,44,39,eF(cx,cy,3.2,1.5));
    R(g,C.wh,31,31,2,1);
    // glow motes rising
    for (let k = 0; k < 4; k++) { const p = (t*0.5 + k/4) % 1, y = 28 - fl(p*14), x = 32 + Math.round(Math.sin(k*2.3)*5); if (p < 0.85) P(g, k%2?C.lm:C.tq, x, y); }
    // cart wheel being swallowed (upright, half sunk)
    const wx = 15, wy = 30;
    const rim = ringF(wx,wy,5.6,7,1.7);
    F(g,C.ol,7,21,24,31,(x,y)=>dil(rim)(x,y)&&y<=wy);
    F(g,C.wo,7,21,24,31,(x,y)=>rim(x,y)&&y<=wy);
    F(g,C.wd,7,21,24,31,(x,y)=>rim(x,y)&&y<=wy&&!inE(x,y,wx-0.7,wy-0.8,5.6,7));
    P(g,C.st,11,25); P(g,C.st,12,24);
    LN(g,C.wo,wx,wy,wx,wy-5); LN(g,C.wo,wx,wy,wx-4,wy-3); LN(g,C.wo,wx,wy,wx+4,wy-3);
    R(g,C.ol,wx-1,wy-1,3,2); P(g,C.wd,wx,wy-1);
    F(g,C.sd,4,29,27,33,(x,y)=>inE(x,y,wx,wy+1.5,9,1.6));
    R(g,C.tq,7,30,3,1); R(g,C.tq,20,31,3,1);
    // leaves on the spiral
    S(g,44,25,['.lg','lgg','g..']); S(g,38,37,['gl.','ggl','..g']); S(g,23,37,['.l','lg']);
  };

  // 26. Rainha das Rãs (épica)
  CARD_ART['rainha-das-ras'] = function(g,t){
    bgBrejo(g,2);
    const pu = fl(t*1.4)%2;
    // lily-pad throne backrest
    const back = (x,y)=>inE(x,y,32,22,19.5,15) && !(y<16 && Math.abs(x+0.5-32) < (16-y)*0.8);
    body(g,back,[11,6,53,38],C.gd,C.td,C.gr,C.ol,2);
    for (const a of [-2.75,-2.25,-0.9,-0.4]) { const c=Math.cos(a), d=Math.sin(a); LN(g,C.gr,32+Math.round(c*11),24+Math.round(d*8.5),32+Math.round(c*18),24+Math.round(d*13.5)); }
    // seat pad
    const seat = eF(32,42,23,4.4);
    body(g,seat,[8,37,56,47],C.gd,C.td,C.gr,C.ol,1);
    F(g,C.gr,8,37,56,47,(x,y)=>seat(x,y)&&!seat(x,y-2));
    // frog
    const fb = any(eF(32,34,13,8.5), eF(32,26.5,12.5,6.5), eF(24,20,4.6,4.4), eF(40,20,4.6,4.4), eF(19.5,38,5,3.6), eF(44.5,38,5,3.6));
    body(g,fb,[13,14,51,44],C.gr,C.gd,C.lm,C.ol,2);
    F(g,C.lm,22,34,42,44,(x,y)=>inE(x,y,32,39,7,3.5)&&fb(x,y));
    S(g,22,41,['.lll.','lgogl']); S(g,37,41,['.lll.','lgogl']);
    // glowing throat sac (pulses)
    const sr = pu ? 1 : 0;
    if (pu) F(g,C.li,22,28,42,40,(x,y)=>ringF(32,34,8.8,5.4,1)(x,y)&&y>30&&((x>>1)&1));
    const sac = eF(32,34,6.4+sr,3.6+sr*0.5);
    F(g,C.pu,22,29,42,39,(x,y)=>dil(sac)(x,y)&&!sac(x,y)&&y>30);
    F(g,C.li,22,29,42,39,(x,y)=>sac(x,y)&&y>30);
    F(g,C.pk,22,29,42,39,(x,y)=>sac(x,y)&&y>30&&!sac(x-1,y-2));
    R(g,C.wh,28,32,2,1);
    // regal smile
    R(g,C.ol,24,30,17,1); P(g,C.ol,23,29); P(g,C.ol,41,29);
    R(g,C.pk,21,27,2,1); R(g,C.pk,42,27,2,1);
    // half-lidded golden eyes
    for (const ex of [22,38]) { S(g,ex,18,['ooooo','yWooy','yyooy','.yyy.']); }
    // lily-flower crown
    S(g,26,9,[
      '......o......',
      '.....oWo.....',
      '.o...oio...o.',
      'oWo.oiiio.oWo',
      'oiioopiipoiio',
      '.oiipiiipiio.',
      '..oiiiyiiio..',
      '...ooooooo...'
    ]);
    // fireflies
    flies(g,t,[[8,10],[13,28],[56,14],[52,30],[5,36],[59,40],[46,6],[20,8]]);
  };

  // 27. Velho Lodão (lendária)
  CARD_ART['velho-lodao'] = function(g,t){
    bgBrejo(g,2,{noReeds:true});
    const bl = (t%4.2) > 3.95;
    // moon
    E(g,C.cr,12,12,4.2,4.2); R(g,C.lg,10,11,2,2); P(g,C.lg,14,14); P(g,C.lg,13,10);
    // mossy island back
    const isl = (x,y)=>inE(x,y,32,33,31,14.5) && y<=31;
    const top = x=>{ for (let y = 14; y < 32; y++) if (isl(x,y)) return y; return 32; };
    for (let x = 9; x < 56; x += 5) { const y = top(x+1); S(g,x,y-3,['.o.','ogo','ogg']); }
    F(g,C.ol,0,15,63,32,(x,y)=>dil(isl)(x,y)&&y<31);
    F(g,C.gd,0,16,63,31,isl);
    F(g,C.gr,0,16,63,31,(x,y)=>isl(x,y)&&!isl(x,y-2));
    for (let x = 9; x < 56; x += 5) { const y = top(x+1); P(g,C.gr,x+1,y-2); }
    F(g,C.td,0,16,63,31,(x,y)=>isl(x,y)&&y>=29);
    for (let i = 0; i < 9; i++) { const x = 5+(i*11+hs(i,4)%5)%54, y = 22+(i*5)%8; if (isl(x,y)) { P(g, i%3?C.lm:C.gr, x, y); } }
    // reeds on the island
    for (const r of [[49,11],[51,13],[54,12],[47,15],[56,16]]) { R(g,C.gr,r[0],r[1],1,24-r[1]); R(g,C.wo,r[0],r[1]-2,1,3); }
    LN(g,C.gr,50,20,53,16); LN(g,C.gr,47,22,44,17);
    // mushrooms
    S(g,15,15,['.ooooo.','orrcrro','ooooooo','..ocoo.','..oco..']);
    S(g,23,18,['.ooo.','orcro','ooooo','.oco.']);
    S(g,38,16,['.oooo.','orrrco','oooooo','..oco.']);
    // fog band behind the head
    for (let x = 0; x < 64; x += 2) P(g,C.tq,x+(fl(x/8)&1),31);
    for (let x = 2; x < 64; x += 11) R(g,C.tq,x,30,5,1);
    // eye bumps
    const eb = any(eF(22.5,31,6.6,4.6), eF(41.5,31,6.6,4.6));
    body(g,eb,[14,25,50,37],C.gd,C.td,C.gr,C.ol,1);
    // snout (comes toward the viewer)
    const sn = (x,y)=>inE(x,y,32,40.5,15.5,7) && y>=34;
    body(g,sn,[15,32,49,47],C.gd,C.td,C.gr,C.ol,2);
    for (const p of [[22,37],[42,37],[26,35],[38,35],[19,40],[45,40],[32,36]]) P(g,C.gr,p[0],p[1]);
    S(g,27,37,['.oo...oo.'.slice(0,9),'ogLo.oLgo'.slice(0,9)]);
    // toothy grin
    R(g,C.ol,18,42,29,1); P(g,C.ol,17,41); P(g,C.ol,47,41);
    for (let x = 19; x < 46; x += 3) { R(g,C.cr,x,43,1,2); P(g,C.wh,x,43); R(g,C.cr,x+1,41,1,1); }
    // glowing eyes
    for (const ex of [19,39]) {
      const ef = (x,y)=>inE(x,y,ex+3.5,30.5,3.6,2.3);
      F(g,(fl(t*2)%2)?C.or:C.yl,ex-2,26,ex+9,35,(x,y)=>dil(ef)(x,y)&&!ef(x,y)&&y<=31);
      if (bl) { F(g,C.gd,ex-1,27,ex+8,34,ef); R(g,C.ol,ex,31,7,1); }
      else { F(g,C.yl,ex-1,27,ex+8,34,ef); R(g,C.ol,ex+3,29,1,4); P(g,C.ol,ex+4,30); P(g,C.ol,ex+4,31); P(g,C.wh,ex+2,29); P(g,C.cr,ex+1,30); P(g,C.or,ex+6,31); P(g,C.or,ex+1,32); }
    }
    // water in front + ripples
    R(g,C.td,0,45,64,3);
    R(g,C.tq,13,45,9,1); R(g,C.tq,43,45,9,1); R(g,C.tq,3,46,6,1); R(g,C.tq,55,46,7,1); R(g,C.sk,29,46,4,1);
    for (let x = 0; x < 64; x += 2) if ((x>>3)&1) P(g,C.tq,x,47);
    // bubbles rising
    for (let k = 0; k < 3; k++) {
      const p = (t*0.6 + k*0.37) % 1, bx = [9,55,51][k], by = 44 - fl(p*10);
      if (p < 0.82) { P(g,C.sk,bx,by); P(g,C.sk,bx+1,by+1); P(g,C.sk,bx-1,by+1); P(g,C.sk,bx,by+2); }
      else { P(g,C.sk,bx-1,by); P(g,C.sk,bx+1,by); }
    }
    flies(g,t,[[7,24],[58,22],[3,31],[61,34]]);
  };

  // ======================================================== PASTO
  // 28. Ovelha Felpuda
  CARD_ART['ovelha-felpuda'] = function(g,t){
    bgPasto(g,0);
    const bl = (t%3) > 2.82;
    const pf = (fl(t*1.25)%2) ? 0.7 : 0;
    E(g,C.gd,32,43,14,1.6);
    // legs
    for (const x of [23,28,35,40]) { R(g,C.ol,x-1,36,4,8); R(g,C.gy,x,36,2,6); R(g,C.nt,x+1,37,1,5); }
    // wool cloud
    const L = [[32,30,13,9],[20.5,28,5.6],[43.5,28,5.6],[25,21.5,5.6],[32,19.5,5.6],[39,21.5,5.6],[20,35,5],[44,35,5],[27,37.5,5],[37,37.5,5]];
    const wool = any(...L.map(l=>eF(l[0],l[1],l[2]+pf,(l[3]||l[2])+pf)));
    body(g,wool,[12,12,52,44],C.wh,C.lg,null,C.ol,2);
    for (const c of [[17,26],[45,25],[22,19],[40,19],[17,33],[46,33],[24,37],[38,37],[30,15]]) S(g,c[0],c[1],['LL','L.']);
    // ears
    const er = any(eF(24,27,3.4,1.5), eF(40,27,3.4,1.5));
    body(g,er,[19,24,45,30],C.gy,C.nt,null,C.ol,1);
    R(g,C.pk,22,27,2,1); R(g,C.pk,40,27,2,1);
    // face
    const fc = eF(32,29.5,5.4,6.6);
    body(g,fc,[25,22,39,37],C.gy,C.nt,C.lg,C.ol,1);
    // muzzle
    F(g,C.lg,27,30,37,36,eF(32,33.5,3.2,2));
    P(g,C.ol,30,33); P(g,C.ol,33,33); S(g,30,35,['o..o','.oo.']);
    R(g,C.pk,27,31,2,1); R(g,C.pk,35,31,2,1);
    // sleepy eyes
    if (bl) { R(g,C.ol,28,29,3,1); R(g,C.ol,33,29,3,1); }
    else { S(g,28,28,['ooo','oWo']); S(g,33,28,['ooo','oWo']); }
    // forelock + curled horns
    const fl1 = any(eF(29,23.5,3.2,2.6), eF(32.5,22.5,3.4,2.8), eF(36,24,2.8,2.4));
    body(g,fl1,[25,19,40,27],C.wh,C.lg,null,C.ol,1);
    S(g,23,21,['.ooo.','otttwo','owo.to','.o.wwo','...oo.']);
    S(g,36,21,['.ooo.','owttto','ot.owo','owwo.o','.oo...']);
  };

  // 29. Cabrito Teimoso
  CARD_ART['cabrito-teimoso'] = function(g,t){
    bgPasto(g,0,{hs:8});
    const tf = fl(t*3)%3;
    // wind lines in front of the charge
    R(g,C.cr,4,24,5,1); R(g,C.cr,2,28,6,1); R(g,C.cr,5,32,4,1);
    // dust behind the back hooves
    const du = any(eF(55,40,4,2.6), eF(59,37,3,2.4), eF(51,42,3,1.8));
    F(g,C.st,46,33,63,45,du); F(g,C.cr,46,33,63,45,(x,y)=>du(x,y)&&!du(x-1,y-1));
    P(g,C.st,49,37); P(g,C.st,61,41); P(g,C.cr,53,35);
    E(g,C.gd,33,44,15,1.4);
    // legs
    const leg = (pts)=>{ const f = tubeF(pts,1.1); F(g,C.ol,10,28,60,46,dil(f)); F(g,C.wo,10,28,60,46,f); };
    leg([30,33, 25,38, 22,42]); leg([33,34, 31,39, 29,42]); leg([44,32, 49,37, 53,41]); leg([41,33, 44,38, 46,42]);
    R(g,C.ol,20,42,4,2); R(g,C.ol,28,42,3,2); R(g,C.ol,52,41,4,2); R(g,C.ol,45,42,3,2);
    R(g,C.wh,22,40,2,1); R(g,C.wh,30,40,2,1);
    // tail
    const ty = [0,-1,1][tf];
    S(g,47,19+ty,['.oo','oWo','oWo','.o.']);
    // body
    const bd = pF([26,24, 35,22, 45,21, 50,24, 49,30, 43,34, 30,35, 25,31]);
    body(g,bd,[22,18,52,37],C.wo,C.wd,C.st,C.ol,2);
    F(g,C.wh,22,18,52,37,(x,y)=>bd(x,y)&&(inE(x,y,46,26,4.5,4)||(y>=32&&x>29&&x<44)));
    F(g,C.lg,22,18,52,37,(x,y)=>bd(x,y)&&y>=33&&x>30&&x<43);
    // neck + head, lowered
    // stubby horns pointing forward (behind the head outline)
    const h1 = bezF(16,27.5, 13,26.5, 11,23.5, 1.5,0.6), h2 = bezF(20,27, 18.5,24.5, 18,21.5, 1.5,0.6);
    for (const h of [h2,h1]) { F(g,C.ol,7,18,24,30,dil(h)); F(g,C.st,7,18,24,30,h); F(g,C.wo,7,18,24,30,(x,y)=>h(x,y)&&!h(x+1,y+1)); }
    const hd = any(tubeF([29,26, 23,30],3.2), eF(18.5,31.5,5.6,5.2), eF(13.5,35,3.2,2.5));
    body(g,hd,[8,22,34,40],C.wo,C.wd,C.st,C.ol,2);
    // white star on the forehead + muzzle
    R(g,C.wh,15,29,2,1); P(g,C.wh,16,28);
    F(g,C.pk,9,32,20,39,(x,y)=>inE(x,y,12.8,35.8,2.4,1.7));
    P(g,C.ol,11,35); R(g,C.ol,11,38,3,1);
    // floppy ear (back)
    S(g,21,27,['.oooo.','ooppwwo','.ooooo.']);
    // determined eye + brow
    R(g,C.ol,18,30,2,3); P(g,C.wh,18,30);
    LN(g,C.ol,22,28,17,29);
    R(g,C.wo,20,32,1,1);
  };

  // 30. Feno Fresquinho (feitiço)
  CARD_ART['feno-fresquinho'] = function(g,t){
    bgPasto(g,1,{c1:[4,4],c2:[44,9]});
    const tw = fl(t*3)%3;
    const front = pF([13,22, 45,22, 45,43, 13,43]);
    const top = pF([13,22, 20,15, 52,15, 45,22]);
    const side = pF([45,22, 52,15, 52,36, 45,43]);
    const all = any(front,top,side);
    E(g,C.gd,33,44,22,1.6);
    F(g,C.ol,11,13,54,45,dil(all));
    F(g,C.st,12,21,46,44,front);
    F(g,C.yl,12,14,53,23,top);
    F(g,C.wo,44,14,53,44,side);
    // straw texture
    for (let y = 24; y < 42; y += 2) for (let k = 0; k < 3; k++) { const x = 14 + (hs(k,y)%9) + k*10; R(g, (k+y)%3?C.yl:C.wo, x, y, 2+hs(y,k)%3, 1); }
    for (let i = 0; i < 6; i++) { const y = 16 + (i*3)%6, x = 20 + i*5 + (hs(i,3)%3); R(g,C.cr,x,y,3,1); }
    for (let i = 0; i < 6; i++) { const y = 21 + i*3; R(g,C.wd,47+(i%3),y-(i%3),2,1); }
    R(g,C.wo,13,41,32,2);
    // strings over front, top and side
    for (const sx of [21,36]) {
      R(g,C.rd,sx,22,2,21); R(g,C.wn,sx+1,22,1,21);
      LN(g,C.rd,sx,21,sx+6,15); LN(g,C.wn,sx+1,21,sx+7,15);
    }
    R(g,C.wn,45,24,1,1);
    // loose straws
    LN(g,C.yl,12,30,8,28); LN(g,C.yl,12,37,8,38); LN(g,C.yl,30,15,31,11); LN(g,C.yl,53,22,57,20); P(g,C.st,8,27); P(g,C.st,58,20);
    // pitchfork leaning on the right
    LN(g,C.ol,57,46,52,17,1); LN(g,C.wd,58,46,53,17); LN(g,C.wo,59,45,54,18);
    R(g,C.ol,49,15,9,2); R(g,C.lg,50,15,7,1);
    for (const x of [50,53,56]) { R(g,C.ol,x-1,10,3,5); R(g,C.lg,x,10,1,5); P(g,C.wh,x,11); }
    // freshness sparkles
    const sp = [[9,18],[30,8],[40,10],[8,40],[58,30],[24,30]];
    for (let i = 0; i < sp.length; i++) { const on = (i+tw)%3; if (on===0) spark(g,C.wh,sp[i][0],sp[i][1],i%2===0); else if (on===1) spark(g,C.yl,sp[i][0],sp[i][1]); else P(g,C.cr,sp[i][0],sp[i][1]); }
  };

  // 31. Vaca Mimosa
  CARD_ART['vaca-mimosa'] = function(g,t){
    bgPasto(g,0);
    const ch = fl(t*3)%2, gl = (t%2) < 0.3;
    E(g,C.gd,32,43,21,1.6);
    // legs
    for (const x of [15,22,40,47]) { R(g,C.ol,x-1,35,4,9); R(g,C.wh,x,35,2,6); R(g,C.lg,x+1,36,1,5); R(g,C.sd,x,41,2,2); }
    // tail
    LN(g,C.ol,53,28,56,35); R(g,C.sd,55,35,2,3);
    // body with spots
    const bd = eF(32,30,22,10.5);
    body(g,bd,[9,18,55,42],C.wh,C.lg,null,C.ol,2);
    for (const s of [[14,26,5,4],[49,24,4,3.5],[45,36,4.2,3],[19,37,3,2.4],[11,33,2.4,2]]) F(g,C.ol,9,18,55,42,(x,y)=>bd(x,y)&&inE(x,y,s[0],s[1],s[2],s[3]));
    // ears + horns
    const er = any(eF(20.5,20,4,2), eF(43.5,20,4,2));
    body(g,er,[15,16,49,24],C.wh,C.lg,null,C.ol,1);
    R(g,C.pk,18,20,3,1); R(g,C.pk,43,20,3,1);
    S(g,24,11,['.oo','ocLo','oco.']); S(g,37,11,['.oo.','oLco','.oco']);
    // head
    const hd = eF(32,22,9,8);
    body(g,hd,[22,13,42,31],C.wh,C.lg,null,C.ol,2);
    F(g,C.ol,22,13,42,31,(x,y)=>hd(x,y)&&inE(x,y,38.5,17,4,3.4));
    P(g,C.wh,37,16);
    // eyes
    eye(g,27,20,2,3); eye(g,35,20,2,3);
    P(g,C.ol,26,19); P(g,C.ol,37,19);
    // muzzle (chews sideways)
    const mz = eF(32+ch*0.6,28.5,7.4,4.3);
    F(g,C.ol,22,23,43,34,(x,y)=>dil(mz)(x,y)&&!hd(x,y));
    F(g,C.pk,22,23,43,34,mz);
    F(g,C.wn,22,23,43,34,(x,y)=>mz(x,y)&&!mz(x,y+1)&&y>30);
    R(g,C.wn,28+ch,27,2,1); R(g,C.wn,35+ch,27,2,1);
    S(g,29+ch,30,['o....o','.oooo.']);
    // grass in the mouth
    LN(g,C.gr,35+ch,31,42+ch,34); LN(g,C.lm,40+ch,32,43+ch,30); P(g,C.lm,43+ch,34); P(g,C.gd,38+ch,33);
    // collar + bell
    R(g,C.ol,25,33,15,3); R(g,C.rd,26,33,13,2); R(g,C.wn,26,34,13,1);
    S(g,29,35,['.ooooo.','oyyyyOo','oyyyyOo','oyyyOOo','ooooooo','...o...']);
    P(g,C.wh,31,36);
    if (gl) spark(g,C.wh,31,36);
  };

  // 32. Bode Marrento
  CARD_ART['bode-marrento'] = function(g,t){
    bgPasto(g,0);
    const bs = [0,1,0,-1][fl(t*1.5)%4];
    // rock
    const rk = any(eF(32,45,23,7), eF(23,41,10,5.5), eF(42,41,11,6));
    body(g,rk,[8,34,56,47],C.gy,C.sd,C.lg,C.ol,2);
    F(g,C.lg,8,34,56,47,(x,y)=>rk(x,y)&&!rk(x,y-2)&&x<44);
    LN(g,C.sd,18,43,22,46); LN(g,C.sd,44,42,47,46); LN(g,C.sd,31,44,33,47);
    R(g,C.gd,12,42,3,1); R(g,C.gd,50,41,3,1); P(g,C.lm,13,41); P(g,C.lm,51,40);
    // body behind
    const bd = eF(32,31,13.5,6.5);
    body(g,bd,[17,24,47,38],C.lg,C.gy,C.wh,C.ol,2);
    for (const x of [22,27,36,41]) { R(g,C.ol,x-1,34,4,6); R(g,C.lg,x,34,2,4); R(g,C.ol,x,38,2,1); }
    // ears
    const er = any(eF(20,22,4,1.6), eF(44,22,4,1.6));
    body(g,er,[14,19,50,25],C.lg,C.gy,null,C.ol,1);
    R(g,C.pk,18,22,3,1); R(g,C.pk,44,22,3,1);
    // curled horns
    const horn = (cx,cy,dir)=>{
      const f = (x,y)=>{ const dx=x+0.5-cx, dy=y+0.5-cy, r=Math.hypot(dx,dy); const a=Math.atan2(dy,dx*dir); return r>=3.2 && r<=6.6 && (a<1.5 || r<5.2) && !(a>1.2 && a<2.4 && r<4.8) && y<cy+5 && dy*1>-7; };
      F(g,C.ol,cx-9,cy-9,cx+9,cy+7,dil(f));
      F(g,C.st,cx-9,cy-9,cx+9,cy+7,f);
      F(g,C.wo,cx-9,cy-9,cx+9,cy+7,(x,y)=>f(x,y)&&!f(x+dir,y+1));
      for (let k = 0; k < 4; k++) { const a = -2.6+k*0.9; P(g,C.wo,Math.round(cx+Math.cos(a)*5*dir-0.5),Math.round(cy+Math.sin(a)*5-0.5)); }
    };
    horn(22,17,-1); horn(42,17,1);
    // head
    const hd = pF([25,14, 39,14, 41,19, 39,25, 36,31, 28,31, 25,25, 23,19]);
    body(g,hd,[21,12,43,33],C.lg,C.gy,C.wh,C.ol,2);
    F(g,C.gy,26,26,38,32,(x,y)=>hd(x,y)&&y>=27);
    P(g,C.ol,30,28); P(g,C.ol,34,28); S(g,30,30,['o...o'.slice(0,5)]); R(g,C.ol,31,30,3,1);
    // glaring eyes (horizontal pupils) under heavy brows
    S(g,25,18,['oo....','.oooo.','.yooyo','.yyyy.']);
    S(g,33,18,['....oo','.oooo.','oyooy.','.yyyy.']);
    P(g,C.wh,26,20); P(g,C.wh,34,20);
    // long beard (sways)
    const bdF = pF([28,31, 36,31, 35,36, 33+bs,43, 31+bs,43, 29,36]);
    body(g,bdF,[26,30,39,45],C.wh,C.lg,null,C.ol,1);
    LN(g,C.lg,31,33,32+bs,40);
  };

  // 33. Cerca de Pedra (construção)
  CARD_ART['cerca-de-pedra'] = function(g,t){
    bgPasto(g,0,{noFence:true});
    const bf = fl(t*6)%2, by = [0,-1,-1,0][fl(t*1.5)%4];
    // ground strip in front
    R(g,C.gd,0,43,64,1);
    // stone wall (three courses), gate gap 26..38
    const rows = [[27,5,[0,6,14,21,26],[38,44,51,58,64]],[32,5,[0,4,11,19,26],[38,41,48,56,64]],[37,6,[0,7,15,22,26],[38,45,52,60,64]]];
    for (const r of rows) {
      for (const xs of [r[2],r[3]]) for (let i = 0; i+1 < xs.length; i++) {
        const x0 = xs[i], x1 = xs[i+1], y0 = r[0] + ((i+r[0])%2 ? 0 : 0), h = r[1];
        R(g,C.ol,x0,y0,x1-x0,h);
        if (x1-x0 < 3) continue;
        R(g,C.gy,x0+1,y0+1,x1-x0-2,h-2);
        R(g,C.lg,x0+1,y0+1,x1-x0-3,1); R(g,C.lg,x0+1,y0+2,1,h-4);
        R(g,C.sd,x0+2,y0+h-2,x1-x0-3,1);
      }
    }
    // uneven top + moss
    for (const m of [[2,26,3],[16,26,4],[41,26,3],[53,26,5]]) { R(g,C.ol,m[0],m[1],m[2],1); R(g,C.gd,m[0],m[1]+1,m[2],1); P(g,C.lm,m[0]+1,m[1]+1); }
    R(g,C.gd,9,33,2,1); R(g,C.gd,46,38,2,1); R(g,C.gd,59,33,2,1);
    // gate posts
    for (const px of [24,38]) { R(g,C.ol,px-1,22,4,22); R(g,C.wo,px,23,2,20); R(g,C.wd,px+1,23,1,20); R(g,C.st,px,23,1,2); }
    // gate boards
    R(g,C.ol,26,25,12,17);
    for (let x = 27; x < 37; x += 3) { R(g,C.wo,x,26,2,15); P(g,C.st,x,26); }
    R(g,C.wd,26,28,12,2); R(g,C.wd,26,37,12,2);
    LN(g,C.wd,27,36,36,29); LN(g,C.st,27,35,35,29);
    P(g,C.ol,25,29); P(g,C.ol,25,38);
    // flowers at the base
    const fls = [[4,45,C.pk],[11,44,C.yl],[19,46,C.pk],[45,45,C.yl],[52,44,C.pk],[59,46,C.yl]];
    for (const f of fls) { P(g,C.gd,f[0],f[1]+1); R(g,f[2],f[0]-1,f[1],3,1); P(g,f[2],f[0],f[1]-1); P(g,f[2]===C.pk?C.yl:C.or,f[0],f[1]); }
    for (const x of [8,15,23,41,49,56,62]) { R(g,C.lm,x,44,1,2); }
    // butterfly
    const bx = 46, byy = 14 + by;
    if (bf) S(g,bx,byy,['i.i','iui','.u.']); else S(g,bx,byy,['.u.','ili','iui']);
    P(g,C.ol,bx+1,byy-1);
  };

  // 34. Touro Trovão (épica)
  CARD_ART['touro-trovao'] = function(g,t){
    bgPasto(g,2,{noFence:true});
    const sp = fl(t*6)%3 !== 2, bolt = (t%2.4) < 0.35 || ((t%2.4) > 0.5 && (t%2.4) < 0.62);
    const st = fl(t*3)%3;
    // storm clouds
    const cl = any(eF(6,3,10,5), eF(22,1,10,5), eF(38,3,11,5.5), eF(55,2,11,5));
    F(g,C.gy,0,0,63,9,cl); F(g,C.sd,0,0,63,9,(x,y)=>cl(x,y)&&!cl(x,y+2)); F(g,C.lg,0,0,63,9,(x,y)=>cl(x,y)&&!cl(x,y-1)&&y>0);
    // rain
    for (let i = 0; i < 12; i++) { const x = (i*11+hs(i,2)%5)%64, y = 10+((i*7+fl(t*8)*3)%10); R(g,C.lg,x,y,1,2); }
    // sky bolt
    if (bolt) { const b = [50,7, 47,13, 51,14, 48,21]; for (let i = 0; i+3 < b.length; i += 2) { LN(g,C.yl,b[i]+1,b[i+1],b[i+2]+1,b[i+3]); LN(g,C.wh,b[i],b[i+1],b[i+2],b[i+3]); } }
    // motion lines + dust behind
    R(g,C.lg,57,24,6,1); R(g,C.lg,59,28,5,1); R(g,C.lg,58,32,5,1);
    const du = any(eF(57,42,4,2.4), eF(61,39,3,2));
    F(g,C.gy,50,35,63,46,du); F(g,C.lg,50,35,63,46,(x,y)=>du(x,y)&&!du(x-1,y-1));
    E(g,C.td,32,44,22,1.5);
    // legs
    const leg = (pts,w)=>{ const f = tubeF(pts,w||1.5); F(g,C.ol,6,26,62,47,dil(f)); F(g,C.sd,6,26,62,47,f); };
    leg([32,33, 34,38, 30,42]); leg([48,31, 52,37, 57,42]);
    leg([27,33, 23,38, 18,42]); leg([45,32, 46,37, 47,43]);
    R(g,C.ol,16,42,4,2); R(g,C.ol,28,42,4,2); R(g,C.ol,56,42,4,2); R(g,C.ol,46,43,4,2);
    // tail
    const tl = bezF(53,22, 59,19, 57,13, 0.8,0.6); F(g,C.ol,50,9,62,24,tl);
    S(g,56,10,['.o.','oso','oso','.o.']);
    // body (head kept inside the portrait crop zone)
    const bd = any(eF(39,27,13.5,8.5), eF(31,22,8.5,6.5), eF(48,26.5,7,7.5), eF(27,28,6.5,6.5), eF(22,30.5,6.5,5.5), eF(16.5,34,4.5,3.6));
    body(g,bd,[9,14,57,38],C.sd,C.ol,C.wd,C.ol,2);
    F(g,C.wo,9,14,57,38,(x,y)=>bd(x,y)&&!bd(x,y-1)&&x>26&&x<46&&((x>>1)&1));
    // muzzle + nose ring
    F(g,C.wd,10,30,21,38,(x,y)=>bd(x,y)&&inE(x,y,15.5,34.5,3.6,2.8));
    P(g,C.ol,13,33); P(g,C.ol,14,35);
    S(g,11,36,['.yy.','y..y','.yy.']);
    // steam puffs from the nostril
    const sx = -st;
    F(g,C.lg,2,26,15,37,(x,y)=>inE(x,y,9+sx,33,2.4,1.6)||inE(x,y,7+sx,30,1.8,1.4));
    P(g,C.wh,9+sx,32); P(g,C.lg,11+sx,29); P(g,C.lg,4+sx,34);
    // eye + angry brow + ear
    R(g,C.ol,20,27,4,4); R(g,C.rd,21,28,2,2); P(g,C.wh,21,28); P(g,C.yl,22,29);
    LN(g,C.ol,25,26,19,27);
    S(g,26,24,['.oo','owwo','.ooo']);
    // horns (near + far)
    const hn = bezF(20,26, 14,24, 14,17, 1.6,0.5), hf = bezF(25,25, 26,20, 28,16, 1.4,0.5);
    for (const h of [hf,hn]) { F(g,C.ol,10,12,32,28,dil(h)); F(g,C.lg,10,12,32,28,h); F(g,C.wh,10,12,32,28,(x,y)=>h(x,y)&&!h(x-1,y)); }
    // lightning crackling between the horns
    if (sp) {
      LN(g,C.yl,15,16,18,19); LN(g,C.yl,18,19,21,15); LN(g,C.yl,21,15,24,18); LN(g,C.yl,24,18,27,15);
      P(g,C.wh,18,19); P(g,C.wh,21,15); P(g,C.wh,24,18);
      P(g,C.yl,17,14); P(g,C.yl,26,20);
    } else { P(g,C.yl,19,17); P(g,C.yl,23,17); }
  };

  // 35. Matriarca Mugidora (lendária)
  CARD_ART['matriarca-mugidora'] = function(g,t){
    bgPasto(g,3,{noFence:true,noHill:true});
    const gl = (t%2.2) < 0.4, sw = fl(t*2)%2, tw = fl(t*2.5)%4;
    // sun + rays
    const ray = (x,y)=>{ const a = Math.atan2(y+0.5-19,x+0.5-32); return ((a/(2*Math.PI)*14 + 7) % 1) < 0.45; };
    F(g,C.yl,0,0,63,6,(x,y)=>ray(x,y));
    F(g,C.cr,0,7,63,12,(x,y)=>ray(x,y));
    E(g,C.yl,32,19,13,13);
    // far hills with herd silhouettes on the crest
    R(g,C.gd,0,24,64,24);
    F(g,C.gd,0,18,63,30,(x,y)=>inE(x,y,6,35,20,12)||inE(x,y,58,35,18,12));
    const cow = (x,y,f)=>S(g,x,y,['......G','GGGGGGG','GGGGGG.','G.G..G.'],f);
    cow(1,19); cow(9,20,1); cow(49,20); cow(56,19,1);
    // main hilltop
    const hill = (x,y)=>inE(x,y,32,58,46,33);
    F(g,C.gr,0,24,63,47,hill); F(g,C.lm,0,24,63,47,(x,y)=>hill(x,y)&&!hill(x,y-1));
    for (let i = 0; i < 10; i++) { const x = 3+(i*7)%58, y = 34+(i*5)%12; R(g,C.gd,x,y,1,2); }
    // body
    for (const x of [21,40]) { R(g,C.ol,x-1,40,6,8); R(g,C.cr,x,40,4,8); R(g,C.st,x+3,40,1,8); }
    const bd = eF(32,36,21,8.6);
    body(g,bd,[10,27,54,46],C.cr,C.st,C.wh,C.ol,2);
    for (const s of [[16,33,5,3.5],[47,32,4.5,3.4],[44,41,4,2.6],[13,40,2.6,2]]) F(g,C.wo,10,27,54,46,(x,y)=>bd(x,y)&&inE(x,y,s[0],s[1],s[2],s[3]));
    // ears + horns
    const er = any(eF(19.5,19,4.4,2), eF(44.5,19,4.4,2));
    body(g,er,[13,15,51,23],C.cr,C.st,null,C.ol,1);
    R(g,C.pk,17,19,3,1); R(g,C.pk,45,19,3,1);
    const h1 = bezF(25,14, 19,13, 19,9, 1.5,0.6), h2 = bezF(39,14, 45,13, 45,9, 1.5,0.6);
    for (const h of [h1,h2]) { F(g,C.ol,15,6,49,17,dil(h)); F(g,C.cr,15,6,49,17,h); F(g,C.lg,15,6,49,17,(x,y)=>h(x,y)&&!h(x+1,y)); }
    // head
    const hd = eF(32,21.5,9.6,8.6);
    body(g,hd,[21,12,43,31],C.cr,C.st,C.wh,C.ol,2);
    F(g,C.wo,21,12,43,31,(x,y)=>hd(x,y)&&(inE(x,y,26,16,4.2,3.4)));
    // daisy crown (on a leafy wreath)
    F(g,C.gd,22,11,42,16,(x,y)=>hd(x,y)&&!hd(x,y-2)&&y<17);
    const dz = [[25,14],[29,12],[33,11],[37,12],[41,14]];
    for (let i = 0; i < dz.length; i++) { const d = dz[i], dy = (i%2===sw) ? 0 : -1; S(g,d[0]-1,d[1]-1+dy,['.W.','WyW','.W.']); P(g,C.ol,d[0],d[1]+dy+2); }
    // wise eyes (half-lidded, lashes)
    S(g,25,20,['o.ooo','.oooo','.oWoo']); S(g,35,20,['ooo.o','oooo.','oWoo.']);
    R(g,C.st,26,19,3,1); R(g,C.st,35,19,3,1);
    // muzzle
    const mz = eF(32,28.5,7,4);
    F(g,C.ol,23,23,41,34,(x,y)=>dil(mz)(x,y)&&!hd(x,y));
    F(g,C.pk,23,23,41,34,mz);
    F(g,C.wn,23,23,41,34,(x,y)=>mz(x,y)&&!mz(x,y+1)&&y>30);
    R(g,C.wn,28,27,2,1); R(g,C.wn,34,27,2,1);
    S(g,29,30,['o....o','.oooo.']);
    // golden bell on a wine ribbon
    R(g,C.ol,23,33,18,3); R(g,C.wn,24,33,16,2); R(g,C.rd,24,33,16,1);
    S(g,28,34,[
      '...ooo...',
      '..oyyyo..',
      '.oyyyyOo.',
      '.oyyyyOo.',
      'oyyyyyyOo',
      'ooooooooo',
      '....o....'
    ]);
    P(g,C.wh,30,36); P(g,C.cr,31,36); P(g,C.cr,30,37);
    if (gl) spark(g,C.wh,31,37,true);
    // sparkles of the dawn
    const sp = [[8,10],[56,6],[50,16],[13,28],[53,29]];
    for (let i = 0; i < sp.length; i++) if ((i+tw)%4 !== 0) spark(g, (i%2)?C.cr:C.wh, sp[i][0], sp[i][1]);
  };

  // ======================================================== NEUTRO (B)
  // 36. Gato do Celeiro
  CARD_ART['gato-do-celeiro'] = function(g,t){
    bgCeleiro(g,0);
    const tf = [0,1,2,1][fl(t*2.5)%4];
    // hay bale
    const hb = pF([7,34, 9,32, 55,32, 57,34, 57,46, 7,46]);
    F(g,C.ol,5,30,59,47,dil(hb));
    F(g,C.st,6,31,58,47,hb);
    R(g,C.yl,9,33,46,2); R(g,C.wo,8,44,49,2);
    for (let y = 37; y < 44; y += 2) for (let k = 0; k < 4; k++) { const x = 10 + (hs(k,y)%8) + k*12; R(g, (k+y)%3?C.yl:C.wo, x, y, 2+hs(y,k)%3, 1); }
    for (const sx of [19,45]) { R(g,C.wd,sx,32,2,14); }
    LN(g,C.yl,6,38,3,37); LN(g,C.yl,58,40,61,39);
    // tail up (swishes)
    const tl = bezF(47,27, 54,22, 52+tf-1,12, 1.6,1.3);
    F(g,C.ol,42,8,60,30,dil(tl)); F(g,C.or,42,8,60,30,tl);
    F(g,C.wo,42,8,60,30,(x,y)=>tl(x,y)&&(y%4===0));
    // body crouched
    const bd = any(eF(35,28,12.5,4.6), eF(45,27,6,5), eF(26,29,5,3.6));
    body(g,bd,[18,20,53,34],C.or,C.wo,C.st,C.ol,2);
    for (const x of [30,34,38,42]) { R(g,C.wo,x,24,1,3); }
    F(g,C.cr,20,26,40,34,(x,y)=>bd(x,y)&&y>=31&&x<38);
    // front paws stretched
    const pw = any(eF(12,32,4.4,1.7), eF(19,32.2,4,1.7));
    F(g,C.ol,6,29,25,35,dil(pw)); F(g,C.cr,6,29,25,35,pw); P(g,C.st,9,32); P(g,C.st,16,32);
    // head
    const hd = any(eF(19,24.5,6.6,5.4), pF([12.5,22, 12,15, 17.5,19.5]), pF([21,19, 25.5,15, 25.5,22]));
    body(g,hd,[10,13,28,31],C.or,C.wo,C.st,C.ol,2);
    P(g,C.pk,13,18); P(g,C.pk,13,19); P(g,C.pk,24,18); P(g,C.pk,24,19);
    R(g,C.wo,17,19,1,2); R(g,C.wo,19,19,1,2); R(g,C.wo,21,19,1,2);
    F(g,C.cr,13,23,26,31,eF(19,27.6,3.6,2.2));
    // narrowed lime eyes
    S(g,14,22,['ooo','lol','.W.']); S(g,21,22,['ooo','lol','.W.']);
    P(g,C.wh,14,23); P(g,C.wh,21,23);
    R(g,C.pk,18,26,2,1); S(g,17,27,['o..o','.oo.']);
    // whiskers
    LN(g,C.lg,13,27,9,26); LN(g,C.lg,13,28,9,29); LN(g,C.lg,24,27,28,26); LN(g,C.lg,24,28,28,29);
  };

  // 37. Moinho de Vento (construção)
  CARD_ART['moinho-de-vento'] = function(g,t){
    bgPasto(g,0,{noFence:true,c1:[4,8],c2:[48,12]});
    const k = fl(t*5)%4;
    // local mound
    const md = eF(32,52,30,11);
    F(g,C.gr,0,38,63,47,md); F(g,C.lm,0,38,63,47,(x,y)=>md(x,y)&&!md(x,y-1));
    // tower
    const tw = pF([25,43, 39,43, 36,19, 28,19]);
    body(g,tw,[23,17,41,44],C.wo,C.wd,C.st,C.ol,2);
    for (const x of [30,33]) R(g,C.wd,x,21,1,21);
    R(g,C.wd,26,30,13,1);
    // window + door
    S(g,30,23,['ooooo','oyoco','ooooo','ocoyo','ooooo']);
    S(g,29,36,['.ooo.','osssso'.slice(0,5),'osdso','osdso','osdso','osdso','osdso']);
    P(g,C.yl,31,39);
    // grain sack
    S(g,39,37,['..oo..','.oyyo.','.oooo.','ottttwo'.slice(0,6),'otttwo','otttwo','.oooo.']);
    // roof cap
    const rf = pF([26,20, 38,20, 36,15, 32,12, 28,15]);
    body(g,rf,[24,10,40,22],C.rd,C.wn,C.or,C.ol,1);
    // sails (4 frames of 22.5 deg)
    const hx = 32.5, hy = 15.5;
    for (let j = 0; j < 4; j++) {
      const a = (k*22.5 + j*90) * Math.PI/180, ux = Math.cos(a), uy = Math.sin(a);
      const pan = (x,y)=>{ const dx=x+0.5-hx, dy=y+0.5-hy, s=dx*ux+dy*uy, q=-dx*uy+dy*ux; return s>=4 && s<=15 && q>=0.6 && q<=4.2; };
      const lat = (x,y)=>{ const dx=x+0.5-hx, dy=y+0.5-hy, s=dx*ux+dy*uy, q=-dx*uy+dy*ux; return s>=4 && s<=15.5 && q>=0.6 && q<=4.6 && (q>3.7 || Math.abs(s-9.5)<0.55 || s>14.6); };
      F(g,C.cr,14,0,51,33,pan);
      F(g,C.wd,14,0,51,33,lat);
      LN(g,C.ol,Math.round(hx),Math.round(hy),Math.round(hx+ux*15.5),Math.round(hy+uy*15.5));
    }
    R(g,C.ol,31,14,3,3); P(g,C.wd,32,15);
  };

  // ======================================================== RETRATOS (opcionais, P3)
  // Faces kept inside the 40x40 hero-row crop (x 12-51, y 4-43).
  function bust(g,poly,base,shadow,light){
    const f = pF(poly), b = box(poly);
    body(g,f,b,base,shadow,light,C.ol,2);
    return f;
  }
  function head(g,cx,cy,rx,ry,skin,sh){
    const f = eF(cx,cy,rx,ry);
    F(g,C.ol,cx-rx-2,cy-ry-2,cx+rx+2,cy+ry+2,dil(f));
    F(g,skin,cx-rx-1,cy-ry-1,cx+rx+1,cy+ry+1,f);
    F(g,sh,cx-rx-1,cy-ry-1,cx+rx+1,cy+ry+1,(x,y)=>f(x,y)&&!f(x+2,y+1));
    return f;
  }

  CARD_ART['rival-lodoso'] = function(g,t){
    bgBrejo(g,0);
    const bl = (t%3.8) > 3.65, fb = (t%2.4) > 2.1;
    // dark teal coat, white collar, wine cravat
    bust(g,[16,48, 19,38, 26,34, 38,34, 45,38, 48,48],C.td,C.nt,C.tq);
    PG(g,C.tq,[27,34, 31,44, 29,48, 23,48, 25,37]); PG(g,C.tq,[37,34, 33,44, 35,48, 41,48, 39,37]);
    PG(g,C.wh,[28,33, 36,33, 34,38, 32,40, 30,38]);
    S(g,30,36,['oooo.','ornno'.slice(0,5),'.onno'.slice(0,5),'..o..']);
    // ears + long thin head
    S(g,24,22,['oo','oto','.oo']); S(g,39,22,['.oo','oto','oo.']);
    head(g,32,23,6.6,8.6,C.cr,C.st);
    // sideburns + moustache
    R(g,C.sd,26,19,1,6); R(g,C.sd,38,19,1,6);
    S(g,27,27,['.ooo..ooo.'.slice(0,10),'o...oo...o'.slice(0,10)]);
    P(g,C.st,32,25); P(g,C.st,32,24);
    // eyes: left plain, right behind a monocle
    if (bl) { R(g,C.ol,28,22,3,1); R(g,C.ol,34,22,3,1); }
    else { eye(g,28,21,2,2); eye(g,35,21,2,2); }
    LN(g,C.ol,27,19,30,20); LN(g,C.ol,34,20,37,19);
    S(g,33,19,['.LLL.','L...L','L...L','L...L','.LLL.']);
    P(g,C.wh,34,20);
    LN(g,C.yl,37,23,40,33); LN(g,C.yl,40,33,38,36);
    S(g,30,29,['oooo']);
    // mossy top hat
    R(g,C.ol,21,12,22,3); R(g,C.sd,22,13,20,1);
    R(g,C.ol,24,1,16,12); R(g,C.sd,25,2,14,10); R(g,C.wd,25,2,2,10);
    R(g,C.wn,25,9,14,2);
    R(g,C.gd,24,1,16,2); R(g,C.gr,25,1,4,1); R(g,C.gr,31,1,5,1); R(g,C.lm,26,1,1,1); R(g,C.lm,33,1,1,1);
    R(g,C.gd,27,3,1,3); R(g,C.gd,35,3,1,2); R(g,C.gd,30,3,1,2); P(g,C.lm,36,5);
    R(g,C.gd,22,13,3,1); R(g,C.gd,38,13,4,1);
    // frog on the shoulder
    S(g,41,29,[
      '.oo.oo.',
      'ogWogWo',
      'oggggggo',
      'ogllllgo',
      'oggggggo',
      '.oooooo.'
    ].map(r=>r.slice(0,8)));
    if (fb) R(g,C.lm,43,32,3,1);
    R(g,C.ol,43,32,3,1);
  };

  CARD_ART['rival-lanuda'] = function(g,t){
    bgPasto(g,0,{c1:[2,4],c2:[50,13]});
    const bl = (t%3.4) > 3.25;
    // shepherd's crook
    R(g,C.ol,50,9,3,39); R(g,C.wo,51,10,1,38);
    S(g,47,3,['.oooo.','owwwwo','ow..wo','ow..wo','.o..wo','....wo','.....o'.slice(0,6)]);
    // thick wool poncho
    const pon = any(pF([10,48, 13,38, 22,33, 42,33, 51,38, 54,48]), eF(16,38,4,3), eF(23,34,4,3), eF(32,33,4.5,3), eF(41,34,4,3), eF(48,38,4,3));
    body(g,pon,[8,28,56,48],C.cr,C.st,C.wh,C.ol,2);
    R(g,C.rd,12,42,40,2); for (let x = 12; x < 52; x += 4) { P(g,C.yl,x+1,41); P(g,C.yl,x+3,44); }
    R(g,C.wn,12,44,40,1);
    // neck
    R(g,C.ol,28,29,8,4); R(g,C.wo,29,29,6,4); R(g,C.wd,33,29,2,4);
    // braid over the left shoulder
    for (let i = 0; i < 6; i++) { const y = 24+i*3; R(g,C.ol,20,y,5,4); R(g,i%2?C.wd:C.sd,21,y+1,3,2); }
    R(g,C.rd,20,42,5,2);
    // head
    S(g,23,20,['oo','owo','.oo']); S(g,40,20,['.oo','owo','oo.']);
    head(g,32,21.5,7.4,8.4,C.wo,C.wd);
    // hair with centre part
    S(g,23,11,[
      '....oooooooo....',
      '..oosssssssssoo.',
      '.osssssswsssssso',
      'ossssssw.wssssso',
      'osss.......sssso',
      'oss.........ssso',
      'oss..........sso',
      '.so..........so.'
    ].map(r=>r.replace(/\./g,'.')));
    // strong brows, eyes, smile
    R(g,C.ol,26,18,4,1); R(g,C.ol,34,18,4,1); P(g,C.ol,26,19); P(g,C.ol,37,19);
    if (bl) { R(g,C.ol,27,21,3,1); R(g,C.ol,34,21,3,1); }
    else { eye(g,27,20,2,3); eye(g,35,20,2,3); }
    R(g,C.pk,25,24,2,1); R(g,C.pk,38,24,2,1);
    P(g,C.wd,32,23); P(g,C.wd,31,24);
    S(g,29,26,['o....o','.oooo.','..rr..']);
  };

  CARD_ART['rival-trovoada'] = function(g,t){
    bgPasto(g,2,{noFence:true});
    const fx = fl(t*6)%3 !== 2, bolt = (t%2.6) < 0.3;
    const cl = any(eF(8,2,12,5), eF(30,0,12,5), eF(54,2,12,5));
    F(g,C.gy,0,0,63,8,cl); F(g,C.sd,0,0,63,8,(x,y)=>cl(x,y)&&!cl(x,y+2));
    for (let i = 0; i < 10; i++) { const x = (i*13+hs(i,2)%5)%64, y = 8+((i*7+fl(t*8)*3)%12); R(g,C.lg,x,y,1,2); }
    if (bolt) { LN(g,C.wh,8,6,5,12); LN(g,C.wh,5,12,9,13); LN(g,C.wh,9,13,6,20); LN(g,C.yl,9,6,6,12); }
    // yellow raincoat with high collar
    bust(g,[12,48, 15,37, 24,32, 40,32, 49,37, 52,48],C.yl,C.or,C.cr);
    PG(g,C.ol,[24,32, 29,40, 32,36, 35,40, 40,32]);
    PG(g,C.yl,[25,32, 29,38, 32,35, 31,32]); PG(g,C.yl,[39,32, 35,38, 32,35, 33,32]);
    R(g,C.ol,32,41,1,7); P(g,C.ol,30,43); P(g,C.ol,30,46);
    // storm-grey hair blowing to the right (behind)
    const hr = any(eF(33,15,10,6.5), tubeF([36,12, 46,10, 54,12],3.2), tubeF([38,17, 48,17, 56,19],2.6), tubeF([37,21, 47,23, 53,26],2.2), eF(24,20,3.2,6));
    body(g,hr,[13,4,60,30],C.lg,C.gy,C.wh,C.ol,2);
    LN(g,C.gy,40,11,52,11); LN(g,C.gy,42,17,53,18); LN(g,C.gy,41,22,50,24);
    // head
    S(g,23,21,['oo','oto','.oo']);
    head(g,31.5,22.5,7.2,8.2,C.st,C.wo);
    // fringe
    F(g,C.lg,23,13,41,19,(x,y)=>inE(x,y,32,13.5,8,4.6)&&y<=16+((x*3)%2));
    F(g,C.gy,23,13,41,19,(x,y)=>inE(x,y,32,13.5,8,4.6)&&y===16+((x*3)%2));
    // lightning hairpin
    S(g,38,7,['..yo','.yy.','yyyy','..yy'.slice(0,4),'.yy.','.y..']);
    if (fx) { P(g,C.wh,40,9); P(g,C.wh,42,7); spark(g,C.wh,43,12); }
    // fierce face
    LN(g,C.lg,25,18,29,20); LN(g,C.lg,38,18,34,20); LN(g,C.ol,25,19,29,21); LN(g,C.ol,38,19,34,21);
    eye(g,27,21,2,2); eye(g,34,21,2,2);
    P(g,C.wo,26,25); P(g,C.wo,37,25); R(g,C.wo,28,17,1,1);
    P(g,C.wo,31,24); P(g,C.wo,31,25);
    S(g,28,27,['oooooo','oWWWWo','.oooo.']);
  };

  CARD_ART['mentora-zinha'] = function(g,t){
    bgCeleiro(g,0);
    const st = fl(t*2)%2, bl = (t%3.2) > 3.05;
    // lilac dress + flowered apron
    bust(g,[13,48, 16,37, 25,33, 39,33, 48,37, 51,48],C.li,C.pu,null);
    PG(g,C.ol,[22,48, 23,38, 41,38, 42,48]);
    PG(g,C.wh,[23,48, 24,39, 40,39, 41,48]);
    R(g,C.lg,24,47,17,1);
    for (const p of [[26,41],[33,40],[38,43],[29,45],[36,46]]) { S(g,p[0]-1,p[1]-1,['.p.','pyp','.p.']); }
    PG(g,C.wh,[27,33, 37,33, 34,37, 30,37]); P(g,C.pk,32,35);
    // hands + teacup
    S(g,38,34,[
      '.....L.L.',
      '....L.L..',
      'ooooooooo',
      'oWWWWWWWoo',
      'oWWpWWWWo.o',
      'oLWWWWWWoWo',
      '.oWWWWWo.oo',
      '..ooooo....'
    ].map((r,i)=>r));
    if (st) { P(g,C.lg,43,32); P(g,C.lg,45,31); } else { P(g,C.lg,44,32); P(g,C.lg,42,31); }
    S(g,36,39,['ooo','ott','ott','.oo']);
    // grey hair + bun
    const hr = any(eF(32,15,8.8,6.5), eF(32,8,4.2,3.6), eF(24.5,21,2.6,5), eF(39.5,21,2.6,5));
    body(g,hr,[20,3,44,27],C.lg,C.gy,C.wh,C.ol,1);
    R(g,C.pk,30,11,4,1); LN(g,C.gy,29,7,32,5);
    // head
    S(g,23,21,['oo','oto','.oo']); S(g,40,21,['.oo','oto','oo.']);
    head(g,32,22,7.2,8,C.st,C.wo);
    F(g,C.lg,24,13,41,19,(x,y)=>inE(x,y,32,13.5,8.4,4.4)&&y<=16-((x>>1)&1)*0);
    F(g,C.gy,24,13,41,19,(x,y)=>inE(x,y,32,13.5,8.4,4.4)&&y===17);
    // round glasses + kind eyes
    S(g,25,19,['.ooo.....ooo.'.slice(0,5)+'....'+'.ooo.','o...o'+'oooo'+'o...o','o...o'+'....'+'o...o','.ooo.'+'....'+'.ooo.']);
    if (bl) { R(g,C.ol,26,21,3,1); R(g,C.ol,35,21,3,1); }
    else { R(g,C.ol,27,20,2,2); P(g,C.wh,27,20); R(g,C.ol,35,20,2,2); P(g,C.wh,35,20); }
    P(g,C.wh,29,20); P(g,C.wh,37,20);
    R(g,C.pk,24,24,2,1); R(g,C.pk,38,24,2,1);
    P(g,C.wo,32,24);
    S(g,29,26,['o....o','.oooo.']);
  };
})();
