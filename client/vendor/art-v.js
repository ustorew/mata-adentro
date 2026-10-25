(function(){
  // Cartas Grão - personagens do tabuleiro (rebanho + cerca): art-v.js
  // Cada sprite pinta num buffer 64x64 de índices da paleta e no fim emite retângulos
  // (runs por linha, fundidos na vertical) com fillStyle + fillRect em inteiros.
  window.CHAR_SPRITE = window.CHAR_SPRITE || {};
  const CS = window.CHAR_SPRITE;
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

  // ------------------------------------------------------------ buffer + palette
  const NM = Object.keys(C);
  const PAL = [''].concat(NM.map(k=>C[k]));
  const c = {}; NM.forEach((k,i)=>{ c[k] = i+1; });
  const K = {o:c.ol,s:c.sd,d:c.wd,w:c.wo,t:c.st,c:c.cr,W:c.wh,y:c.yl,O:c.or,r:c.rd,n:c.wn,p:c.pk,G:c.gd,g:c.gr,l:c.lm,T:c.td,q:c.tq,b:c.bl,k:c.sk,u:c.pu,i:c.li,Y:c.gy,L:c.lg,N:c.nt};
  const B = new Uint8Array(4096), B2 = new Uint8Array(4096), M = new Uint8Array(96*96);
  let OX = 0, OY = 0;
  const fl = Math.floor, rn = Math.round, sin = Math.sin, cos = Math.cos, PI = Math.PI;
  const cl01 = v=>v<0?0:v>1?1:v;
  const sm = v=>{ v = cl01(v); return v*v*(3-2*v); };
  function P(k,x,y){ x = fl(x)+OX; y = fl(y)+OY; if (k && x>=0 && y>=0 && x<64 && y<64) B[y*64+x] = k; }
  function PE(k,x,y){ x = fl(x)+OX; y = fl(y)+OY; if (k && x>=0 && y>=0 && x<64 && y<64 && !B[y*64+x]) B[y*64+x] = k; }
  function R(k,x,y,w,h){ x = fl(x); y = fl(y); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(k,x+i,y+j); }
  function F(k,x0,y0,x1,y1,f){ x0=fl(x0); y0=fl(y0); x1=Math.ceil(x1); y1=Math.ceil(y1); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (f(x,y)) P(k,x,y); }
  const inE = (x,y,cx,cy,rx,ry)=>{ const a=(x+0.5-cx)/rx, b=(y+0.5-cy)/ry; return a*a+b*b<=1; };
  const eF = (cx,cy,rx,ry)=>(x,y)=>inE(x,y,cx,cy,rx,ry||rx);
  function E(k,cx,cy,rx,ry){ ry = ry||rx; F(k,cx-rx-1,cy-ry-1,cx+rx+1,cy+ry+1,eF(cx,cy,rx,ry)); }
  const any = (...fs)=>(x,y)=>{ for (const f of fs) if (f(x,y)) return true; return false; };
  function inPoly(px,py,p){
    let r = false;
    for (let i = 0, j = p.length-2; i < p.length; j = i, i += 2) {
      const xi=p[i], yi=p[i+1], xj=p[j], yj=p[j+1];
      if ((yi > py) !== (yj > py) && px < (xj-xi)*(py-yi)/(yj-yi)+xi) r = !r;
    }
    return r;
  }
  const pF = p=>(x,y)=>inPoly(x+0.5,y+0.5,p);
  function tubeF(pts,r){
    const r2 = r*r;
    return (x,y)=>{
      const px = x+0.5, py = y+0.5;
      for (let i = 0; i+3 < pts.length; i += 2) {
        const ax=pts[i], ay=pts[i+1], vx=pts[i+2]-ax, vy=pts[i+3]-ay, L=vx*vx+vy*vy||1;
        let u=((px-ax)*vx+(py-ay)*vy)/L; u=u<0?0:u>1?1:u;
        const dx=px-(ax+vx*u), dy=py-(ay+vy*u);
        if (dx*dx+dy*dy<=r2) return true;
      }
      return false;
    };
  }
  function bezF(x0,y0,x1,y1,x2,y2,w0,w1,n){
    n = n||18; const Sx = [];
    for (let i = 0; i <= n; i++) { const u=i/n, a=(1-u)*(1-u), b=2*u*(1-u), d=u*u, w=w0+(w1-w0)*u; Sx.push([a*x0+b*x1+d*x2, a*y0+b*y1+d*y2, w*w]); }
    return (x,y)=>{ const px=x+0.5, py=y+0.5; for (const s of Sx) { const dx=px-s[0], dy=py-s[1]; if (dx*dx+dy*dy<=s[2]) return true; } return false; };
  }
  const ringF = (cx,cy,rx,ry,th)=>(x,y)=>inE(x,y,cx,cy,rx,ry)&&!inE(x,y,cx,cy,rx-th,ry-th*ry/rx);
  // shape: outline + base + shadow band (bottom-right, offset d) + light edge (top-left)
  function body(f,x0,y0,x1,y1,base,shd,li,o,d){
    x0=fl(x0); y0=fl(y0); x1=Math.ceil(x1); y1=Math.ceil(y1); d = d||2;
    const w = x1-x0+1, h = y1-y0+1; if (w*h > M.length) return;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) M[y*w+x] = f(x+x0,y+y0) ? 1 : 0;
    const m = (x,y)=>x>=x0&&x<=x1&&y>=y0&&y<=y1&&M[(y-y0)*w+(x-x0)]===1;
    for (let y = y0-1; y <= y1+1; y++) for (let x = x0-1; x <= x1+1; x++) {
      if (m(x,y)) { let k = base; if (li && !m(x-1,y-1)) k = li; if (shd && !m(x+d,y+d)) k = shd; P(k,x,y); }
      else if (o !== 0 && (m(x-1,y)||m(x+1,y)||m(x,y-1)||m(x,y+1))) P(o||c.ol,x,y);
    }
  }
  function LN(k,x0,y0,x1,y1){ const dx=x1-x0, dy=y1-y0, n=Math.max(Math.abs(dx),Math.abs(dy))||1; for (let i = 0; i <= n; i++) P(k,rn(x0+dx*i/n),rn(y0+dy*i/n)); }
  // ASCII sprite: '.' = skip
  function S(x,y,rows,flip){
    for (let j = 0; j < rows.length; j++) { const r = rows[j], n = r.length; for (let i = 0; i < n; i++) { const ch = flip ? r[n-1-i] : r[i]; if (K[ch]) P(K[ch],x+i,y+j); } }
  }
  // outline every empty pixel touching the drawn silhouette
  function outl(k){
    k = k||c.ol; B2.set(B);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const i = y*64+x; if (B2[i]) continue;
      if ((x>0&&B2[i-1]&&B2[i-1]!==k)||(x<63&&B2[i+1]&&B2[i+1]!==k)||(y>0&&B2[i-64]&&B2[i-64]!==k)||(y<63&&B2[i+64]&&B2[i+64]!==k)) B[i] = k; }
  }
  // nearest-neighbour squash/stretch of the whole buffer around (cx,cy)
  function warp(sx,sy,cx,cy){
    if (Math.abs(sx-1)<0.01 && Math.abs(sy-1)<0.01) return;
    B2.set(B); cx = cx===undefined?32:cx; cy = cy===undefined?61:cy;
    for (let y = 0; y < 64; y++) { const yy = fl(cy+(y+0.5-cy)/sy); for (let x = 0; x < 64; x++) { const xx = fl(cx+(x+0.5-cx)/sx); B[y*64+x] = (xx>=0&&yy>=0&&xx<64&&yy<64) ? B2[yy*64+xx] : 0; } }
  }
  function emit(g){
    let open = new Map(), last = -1;
    const out = r=>{ if (r[4] !== last) { g.fillStyle = PAL[r[4]]; last = r[4]; } g.fillRect(r[0],r[1],r[2],r[3]); };
    for (let y = 0; y < 64; y++) {
      const cur = new Map(); let x = 0;
      while (x < 64) { const v = B[y*64+x]; if (!v) { x++; continue; } let k = x+1; while (k < 64 && B[y*64+k] === v) k++;
        const key = x | ((k-x)<<6) | (v<<13); const o = open.get(key);
        if (o) { o[3]++; open.delete(key); cur.set(key,o); } else cur.set(key,[x,y,k-x,1,v]);
        x = k; }
      for (const r of open.values()) out(r);
      open = cur;
    }
    for (const r of open.values()) out(r);
  }
  // ------------------------------------------------------------ shared bits
  // attack curve: wind-up to -1 (0..0.35), snap to +1 (strike 0.35..0.55), recover to 0
  function ak(p){ if (p < 0.35) return -sm(p/0.35); if (p < 0.42) return -1+2*sm((p-0.35)/0.07); if (p < 0.55) return 1; return 1-sm((p-0.55)/0.45); }
  // hit flinch: 0 -> 1 quickly, then back
  const hk = p=>p < 0.15 ? sm(p/0.15) : 1-sm((p-0.15)/0.85);
  // entrance pop scale with overshoot
  const pop = p=>p < 0.55 ? 0.2+0.95*sm(p/0.55) : 1.15-0.15*sm((p-0.55)/0.45);
  function leg(x,yt,yb,w,base,shd,hoof){ R(c.ol,x-1,yt,w+2,yb-yt+1); R(base,x,yt,w,yb-yt); if (shd) R(shd,x+w-1,yt,1,yb-yt); if (hoof) R(hoof,x,yb-2,w,2); }
  function spark(k,x,y,big){ if (big) { R(k,x-2,y,5,1); R(k,x,y-2,1,5); P(c.wh,x,y); } else { R(k,x-1,y,3,1); R(k,x,y-1,1,3); } }
  function star(x,y,r){ // impact burst
    R(c.yl,x-r,y,2*r+1,1); R(c.yl,x,y-r,1,2*r+1);
    for (let i = 1; i < r; i++) { P(c.yl,x-i,y-i); P(c.yl,x+i,y-i); P(c.yl,x-i,y+i); P(c.yl,x+i,y+i); }
    R(c.wh,x-1,y,3,1); R(c.wh,x,y-1,1,3);
  }
  function puff(x,y,r,a,b){ // dust / steam puff
    const f = any(eF(x,y,r,r*0.75), eF(x-r*0.8,y+r*0.3,r*0.6,r*0.5), eF(x+r*0.8,y+r*0.3,r*0.6,r*0.5));
    body(f,x-r*2,y-r,x+r*2,y+r,a||c.cr,b||c.st,null,0,1);
  }
  function heart(x,y,k){ S(x,y,['.o.o.','opopo','oppWo','.opo.','..o..'].map(r=>r.replace(/p/g,k||'p'))); }
  function def(id,draw){
    CS[id] = function(g,t,st,p){
      B.fill(0); OX = 0; OY = 0;
      t = +t || 0; p = cl01(+p || 0);
      if (st!=='idle'&&st!=='atk'&&st!=='hit'&&st!=='sono'&&st!=='entra') st = 'idle';
      try { draw(t,st,p); } catch(e) {}
      OX = 0; OY = 0;
      emit(g);
    };
  }

  // ============================================================ OVELHA FELPUDA
  def('ovelha-felpuda',(t,st,p)=>{
    const sono = st==='sono', A = st==='atk' ? ak(p) : 0, H = st==='hit' ? hk(p) : 0, ent = st==='entra';
    let pf = sono ? 0.5*sin(t*1.3) : 0.45*sin(t*2.2);
    if (H) pf += 1.4*H;
    if (A > 0) pf += 0.4*A;
    const blink = sono || (t%3.4) > 3.22 || A < -0.2;
    const ear = !sono && (t%4.1) > 3.6 ? -1 : 0;
    const hb = sono ? 2 : rn(0.6*sin(t*2.2+0.8));
    // body offset (lying when asleep, jump in wind-up)
    const by = sono ? 6 : (A < 0 ? rn(-5*(-A)) : 0) + (H ? -1 : 0);
    const bx = H ? rn(2*H) : 0;
    OX = bx;
    // legs
    if (!sono) {
      const up = A < 0 ? rn(-A*3) : 0;
      for (const x of [40,46]) leg(x,49+by,58+by,3,c.gy,c.nt,c.sd);
      for (const x of [24,31]) leg(x,50+by,60+by-up,3,c.gy,c.nt,c.sd);
    }
    OY = by;
    // wool cloud
    const L = [[34,40,15,10],[21,38,6],[47,37,6],[26,30,6],[34,28,6.5],[42,30,6],[22,46,5.5],[46,46,5.5],[29,49,5.5],[39,49,5.5],[18,44,4],[50,43,4]];
    const wool = any(...L.map(l=>eF(l[0],l[1],l[2]+pf,(l[3]||l[2])+pf)));
    body(wool,10,19,58,57,c.wh,c.lg,null,c.ol,2);
    for (const q of [[17,40],[49,39],[22,31],[44,31],[16,47],[50,47],[27,52],[41,52],[34,24],[38,44],[45,51]]) S(q[0],q[1],['LL','L.']);
    // head
    OY = by + hb;
    const ey = ear;
    const er = any(eF(22.5,37+ey,3.6,1.6), eF(36.5,37,3.6,1.6));
    body(er,17,34,41,40,c.gy,c.nt,null,c.ol,1);
    R(c.pk,21,37+ey,2,1); R(c.pk,36,37,2,1);
    const fc = eF(29.5,39.5,5.4,6.6);
    body(fc,23,32,37,47,c.gy,c.nt,c.lg,c.ol,1);
    F(c.lg,25,40,35,46,eF(29.5,43.5,3.2,2));
    P(c.ol,28,43); P(c.ol,31,43);
    if (A > 0.3) S(28,45,['oooo','onno','.oo.']); // baa!
    else if (H) S(28,45,['.oo.','o..o']);
    else S(27,45,['o..o','.oo.']);
    R(c.pk,24,41,2,1); R(c.pk,33,41,2,1);
    if (H) { S(25,38,['o..','.o.','o..']); S(31,38,['..o','.o.','..o']); }
    else if (blink) { R(c.ol,25,39,3,1); R(c.ol,31,39,3,1); }
    else if (A > 0) { S(25,38,['ooo.','.ooo']); S(31,38,['.ooo','ooo.']); }
    else { S(25,38,['ooo','oWo']); S(31,38,['ooo','oWo']); }
    // forelock + curled horns
    const fk = any(eF(26.5,33.5,3.2,2.6), eF(30,32.5,3.4,2.8), eF(33.5,34,2.8,2.4));
    body(fk,22,29,38,37,c.wh,c.lg,null,c.ol,1);
    S(20,31,['.ooo.','otttwo','owo.to','.o.wwo','...oo.']);
    S(33,31,['.ooo.','owttto','ot.owo','owwo.o','.oo...']);
    OX = 0; OY = 0;
    if (ent) { const s = pop(p); warp(s,s); }
    if (A > 0) warp(1+0.1*A,1-0.1*A);
    else if (A < 0) warp(1-0.04*A,1+0.06*-A);
    // fx
    if (A > 0.5) { puff(17,58,3); puff(48,58,3); for (const q of [[10,46],[56,44],[12,36]]) S(q[0],q[1],['.oo.','oWWo','.oo.']); }
    if (A > 0.9) { R(c.cr,6,54,4,1); R(c.cr,54,54,4,1); R(c.cr,8,50,3,1); R(c.cr,53,50,3,1); }
    if (H > 0.3) for (const q of [[8,30],[54,28],[6,42],[57,40]]) S(q[0]+rn(H*2)*(q[0]<32?-1:1),q[1]-rn(H*2),['.oo.','oWLo','.oo.']);
    if (ent) { const k = 1-p; for (let i = 0; i < 6; i++) { const a = i*1.05+0.4, r = 14+18*p; S(rn(32+cos(a)*r),rn(42+sin(a)*r*0.7),k>0.3?['.oo.','oWWo','.oo.']:['oo','oo']); } }
  });

  // ============================================================ CABRITO TEIMOSO
  def('cabrito-teimoso',(t,st,p)=>{
    const sono = st==='sono', A = st==='atk' ? ak(p) : 0, H = st==='hit' ? hk(p) : 0, ent = st==='entra';
    const paw = !sono && !A && !H && !ent ? (fl(t*4)%4===1 ? 2 : 0) : (A < -0.3 ? (fl(p*20)%2)*2 : 0);
    const sh = (t%3.6);
    const shake = (!sono && !A && !H && sh > 2.6 && sh < 3.3) ? [0,-1,0,1][fl(sh*12)%4] : 0;
    const tf = sono ? 0 : [0,-1,1,-1][fl(t*5)%4];
    const air = ent ? sin(p*PI) : 0;
    const by = sono ? 6 : rn(-air*9) + (A < 0 ? rn(2*-A) : 0) - (H ? 1 : 0);
    const hx = shake + (H ? rn(2*H) : 0);
    const U = sono ? 0 : -3;
    // back legs + tail + body
    OY = by;
    if (!sono) {
      const tuck = air > 0.4 ? 3 : 0;
      leg(42,45,58-tuck,2,c.wo,c.wd,c.ol); leg(47,44,57-tuck,2,c.wo,c.wd,c.ol);
    }
    OY = by + U;
    S(48,35+tf,['.oo.','oWWo','oWWo','.oW.','..o.']);
    const bd = eF(38,44,11,6.6);
    body(bd,26,37,50,51,c.wo,c.wd,c.st,c.ol,2);
    F(c.wh,26,37,50,51,(x,y)=>bd(x,y)&&inE(x,y,45,41,4.4,4));
    F(c.wh,26,37,50,51,(x,y)=>bd(x,y)&&y>=48&&x>31&&x<45);
    // front legs
    if (!sono) {
      const tuck = air > 0.4 ? 3 : 0;
      OY = by;
      leg(25,46,60-paw-tuck,3,c.wo,c.wd,c.ol); leg(31,46,60-tuck,3,c.wo,c.wd,c.ol);
      R(c.wh,25,56-paw-tuck,3,1); R(c.wh,31,56-tuck,3,1);
    }
    // head
    const down = A > 0 ? rn(4*A) : (A < 0 ? rn(3*A) : 0);
    OX = hx; OY = by + down + U;
    // horns: up normally; at strike they point at the viewer (short, wide tips)
    if (A > 0.5) { S(21,29,['.oo.','otto','otwo','.oo.']); S(32,29,['.oo.','otto','owto','.oo.']); }
    else { S(22,26,['.oo','otto','.otwo','..owo','..oo.'].map(r=>r)); S(32,26,['oo.','ottoo','owto.','owo..','.oo..']); }
    // floppy ears
    const ef = H ? -2 : (sono ? 2 : 0);
    const EAR = ['...ooo.','.oowwwo','owpppwo','oppooo.','.oo....'];
    S(16,34+ef,EAR); S(35,34+ef,EAR,true);
    const hd = any(eF(28.5,37,6.2,6), eF(28.5,42.5,4,3));
    body(hd,21,30,36,47,c.wo,c.wd,c.st,c.ol,2);
    R(c.wh,28,32,2,1); P(c.wh,28,31); P(c.wh,29,33);
    F(c.pk,23,40,34,47,eF(28.5,43.5,3,2));
    P(c.ol,27,43); P(c.ol,30,43);
    if (A > 0.3 || H) R(c.ol,27,45,4,1); else S(27,45,['o..o','.oo.'].map(r=>r.slice(0,4)).slice(0,1));
    // eyes + stubborn brows
    if (sono) { R(c.ol,24,37,3,1); R(c.ol,31,37,3,1); }
    else if (H) { S(24,36,['o.o','.o.']); S(31,36,['o.o','.o.']); }
    else { R(c.ol,25,36,2,2); P(c.wh,25,36); R(c.ol,31,36,2,2); P(c.wh,31,36); }
    if (!H) { LN(c.ol,23,34,26,35); LN(c.ol,34,34,31,35); }
    OX = 0; OY = 0;
    if (ent) { warp(1-0.08*air,1+0.1*air); }
    if (A > 0) warp(1+0.06*A,1+0.04*A,30,60);
    // fx
    if (paw && !A) { P(c.st,23,59); P(c.st,22,57); P(c.cr,29,58); }
    if (A < -0.3) puff(22,58,2.5);
    if (A > 0.6) { star(28,27+rn(3*A),4); LN(c.cr,14,24,18,28); LN(c.cr,42,24,38,28); LN(c.cr,12,32,16,33); LN(c.cr,44,32,40,33); }
    if (shake && fl(sh*12)%2) { R(c.cr,16,30,2,1); R(c.cr,40,30,2,1); }
    if (ent && p > 0.7) { puff(22,59,2.5); puff(44,59,2.5); }
  });

  // ============================================================ VACA MIMOSA
  def('vaca-mimosa',(t,st,p)=>{
    const sono = st==='sono', A = st==='atk' ? ak(p) : 0, H = st==='hit' ? hk(p) : 0, ent = st==='entra';
    const ch = sono ? 0 : fl(t*3)%2;
    const blink = sono || (t%3.8) > 3.62 || A > 0.3;
    const tl = sono ? 0 : rn(2*sin(t*2.4));
    const ef = !sono && (t%5) > 4.5 ? -1 : 0;
    const rear = A < 0 ? -A : 0;
    const by = sono ? 7 : rn(-rear*3) - (H ? 1 : 0);
    OX = H ? rn(2*H) : 0;
    OY = by;
    // tail
    LN(c.ol,51,40,53+tl,49); LN(c.ol,52,40,54+tl,49); R(c.sd,52+tl,49,3,3); P(c.ol,51+tl,50);
    // back legs
    if (!sono) { leg(42,50,58,3,c.wh,c.lg,c.sd); leg(48,49,57,3,c.wh,c.lg,c.sd); }
    // body with spots
    const bd = eF(35,43,17,9.5);
    body(bd,17,33,53,53,c.wh,c.lg,null,c.ol,2);
    for (const s of [[22,40,4.6,3.6],[48,38,4,3.2],[45,48,4.2,2.8],[24,49,3,2.2],[38,35,3,2]]) F(c.ol,17,33,53,53,(x,y)=>bd(x,y)&&inE(x,y,s[0],s[1],s[2],s[3]));
    // udder
    if (!sono) { S(43,51,['.oooo.','oppppo','.opop.']); }
    // front legs
    if (!sono) { const up = rn(rear*4); leg(24,50,60-up,3,c.wh,c.lg,c.sd); leg(32,50,60-up,3,c.wh,c.lg,c.sd); }
    // head
    const hy = A > 0 ? rn(2*A) : rn(-rear*2);
    OY = by + hy + (sono ? 1 : 0);
    const er = any(eF(19.5,30+ef,4,2), eF(40.5,30,4,2));
    body(er,14,26,46,34,c.wh,c.lg,null,c.ol,1);
    R(c.pk,17,30+ef,3,1); R(c.pk,40,30,3,1);
    S(23,21,['.oo','ocLo','oco.']); S(35,21,['.oo.','oLco','.oco']);
    const hd = eF(30,32,9,8);
    body(hd,20,23,40,41,c.wh,c.lg,null,c.ol,2);
    F(c.ol,20,23,40,41,(x,y)=>hd(x,y)&&inE(x,y,36.5,27,4,3.4));
    P(c.wh,35,26);
    // eyes
    if (H) { S(24,30,['o..','.oo','o..']); S(33,30,['..o','oo.','..o']); }
    else if (blink) { S(24,31,['.oo.','o..o'].map(r=>r).slice(0,1)); R(c.ol,24,31,3,1); R(c.ol,33,31,3,1); }
    else { R(c.ol,25,30,2,3); P(c.wh,25,30); R(c.ol,33,30,2,3); P(c.wh,33,30); P(c.ol,24,29); P(c.ol,35,29); }
    // muzzle (chews sideways)
    const mz = eF(30+ch*0.6,38.5,7.4,4.3);
    F(c.ol,20,32,42,45,(x,y)=>!mz(x,y)&&!hd(x,y)&&(mz(x-1,y)||mz(x+1,y)||mz(x,y-1)||mz(x,y+1)));
    F(c.pk,20,32,42,45,mz);
    F(c.wn,20,32,42,45,(x,y)=>mz(x,y)&&!mz(x,y+1)&&y>40);
    R(c.wn,26+ch,37,2,1); R(c.wn,33+ch,37,2,1);
    if (A > 0.3 || H) S(27,39,['.oooo.','onnnno','.onno.']);
    else S(27+ch,40,['o....o','.oooo.']);
    // grass in the mouth
    if (!H && A <= 0.3 && !sono) { LN(c.gr,33+ch,41,39+ch,44); LN(c.lm,37+ch,42,40+ch,40); P(c.lm,40+ch,44); }
    // collar + bell
    const bs = A > 0 ? rn(2*sin(p*30)) : (H ? 1 : 0);
    R(c.ol,22,44,17,3); R(c.rd,23,44,15,2); R(c.wn,23,45,15,1);
    S(27+bs,46,['.ooooo.','oyyyyOo','oyyyyOo','oyyyOOo','ooooooo','...o...']);
    P(c.wh,29+bs,47);
    OX = 0; OY = 0;
    if (ent) { const s = pop(p); warp(s,s); }
    if (A > 0) warp(1+0.1*A,1-0.08*A);
    else if (rear) warp(1-0.03*rear,1+0.05*rear);
    // fx
    if (!A && !H && !sono && !ent && (t%2) < 0.3) spark(c.wh,29,46);
    if (!sono && !A && !H) { const hp = (t%4.5)/4.5; if (hp < 0.55) { const q = hp/0.55; heart(45+rn(sin(q*7)*1.5),rn(20-q*12),'p'); } }
    if (A > 0.5) { puff(18,59,3); puff(40,59,3); LN(c.yl,22+bs,47,19+bs,47); LN(c.yl,38+bs,47,41+bs,47); LN(c.yl,23+bs,50,20+bs,52); LN(c.yl,37+bs,50,40+bs,52); }
    if (ent) { for (let i = 0; i < 4; i++) { const a = -PI/2 + (i-1.5)*0.7, r = 10+20*p; heart(rn(30+cos(a)*r)-2,rn(30+sin(a)*r)-2,'p'); } }
    if (H > 0.3) { LN(c.gr,44,34-rn(H*3),48,30-rn(H*3)); P(c.lm,48,29-rn(H*3)); }
  });

  // ============================================================ BODE MARRENTO
  function goatHorn(cx,cy,dir){
    const f = (x,y)=>{ const dx=x+0.5-cx, dy=y+0.5-cy, r=Math.hypot(dx,dy); const a=Math.atan2(dy,dx*dir); return r>=3.2 && r<=6.6 && (a<1.5 || r<5.2) && !(a>1.2 && a<2.4 && r<4.8) && y<cy+5 && dy>-7; };
    body(f,cx-8,cy-8,cx+8,cy+6,c.st,dir>0?c.wo:null,dir<0?null:null,c.ol,1);
    F(c.wo,cx-8,cy-8,cx+8,cy+6,(x,y)=>f(x,y)&&!f(x+dir,y+1));
    for (let k = 0; k < 4; k++) { const a = -2.6+k*0.9; P(c.wo,rn(cx+cos(a)*5*dir-0.5),rn(cy+sin(a)*5-0.5)); }
  }
  def('bode-marrento',(t,st,p)=>{
    const sono = st==='sono', A = st==='atk' ? ak(p) : 0, H = st==='hit' ? hk(p) : 0, ent = st==='entra';
    const bs = sono ? [0,1,0,-1][fl(t*0.8)%4] : [0,1,0,-1][fl(t*1.5)%4];
    const look = sono ? 0 : [0,0,1,1,0,0,-1,-1][fl(t*0.9)%8];
    const smug = !sono && (t%4.4) > 3.5;
    const chew = !sono && fl(t*2.5)%2;
    const tf = sono ? 0 : (fl(t*1.7)%3===0 ? -1 : 0);
    const rear = A < 0 ? -A : 0;
    const drop = ent ? (p < 0.45 ? 1-sm(p/0.45) : 0) : 0;
    const by = sono ? 6 : rn(-rear*7) - (H ? 1 : 0) - rn(drop*14);
    OX = H ? rn(2*H) : 0; OY = by;
    // tail + back legs + body
    S(48,37+tf,['.oo','oWo','oWo','.o.']);
    if (!sono) { leg(43,50,58+(rear?0:0),3,c.lg,c.gy,c.ol); leg(48,49,57,3,c.lg,c.gy,c.ol); }
    const bd = eF(37,46,13,7);
    body(bd,23,38,51,54,c.lg,c.gy,c.wh,c.ol,2);
    if (!sono) { const up = rn(rear*5); leg(26,51,60-up,3,c.lg,c.gy,c.ol); leg(33,51,60-up,3,c.lg,c.gy,c.ol); }
    // head
    const hy = A > 0 ? rn(4*A) : rn(-rear*2);
    OY = by + hy;
    const ears = any(eF(20,34,4,1.6), eF(44,34,4,1.6));
    body(ears,15,31,49,37,c.lg,c.gy,null,c.ol,1);
    R(c.pk,18,34,3,1); R(c.pk,44,34,3,1);
    goatHorn(22,29,-1); goatHorn(42,29,1);
    const hd = pF([25,26, 39,26, 41,31, 39,37, 36,43, 28,43, 25,37, 23,31]);
    body(hd,21,24,43,45,c.lg,c.gy,c.wh,c.ol,2);
    F(c.gy,26,38,38,44,(x,y)=>hd(x,y)&&y>=39);
    P(c.ol,30,40); P(c.ol,34,40);
    R(c.ol,31+(A>0.3?0:chew),42,3,1);
    if (A > 0.3) R(c.wn,31,43,3,1);
    // glaring eyes (horizontal pupils) under heavy brows
    if (sono) {
      S(25,30,['oo....','.oooo.','......','.oooo.']); S(33,30,['....oo','.oooo.','......','.oooo.']);
    } else if (H) {
      S(25,30,['......','.oooo.','.yyyy.','.yoyy.']); S(33,30,['......','.oooo.','.yyyy.','.yyoy.']);
    } else {
      const lb = smug ? -1 : 0;
      S(25,30+lb,['oo....','.oooo.']); S(33,30,['....oo','.oooo.']);
      R(c.yl,26,32,4,2); R(c.yl,34,32,4,2);
      R(c.ol,27+look,32,2,1); R(c.ol,35+look,32,2,1);
      P(c.wh,26,32); P(c.wh,34,32);
      if (A > 0.3) { R(c.ol,26,32,4,1); R(c.ol,34,32,4,1); }
    }
    // long beard (sways)
    const bw = H ? 1.5 : 0;
    const bdF = pF([28,43, 36,43, 35+bw,48, 33+bs+bw,55, 31+bs-bw,55, 29-bw,48]);
    body(bdF,25,42,40,57,c.wh,c.lg,null,c.ol,1);
    LN(c.lg,31,45,32+bs,52);
    OX = 0; OY = 0;
    if (A > 0) warp(1+0.08*A,1-0.07*A);
    if (ent && p >= 0.45) { const q = (p-0.45)/0.55; warp(1+0.1*(1-q),1-0.1*(1-q)); }
    // fx
    if (A > 0.6) { star(32,28+rn(4*A),4); puff(18,59,3); puff(46,59,3); LN(c.cr,14,30,18,33); LN(c.cr,50,30,46,33); LN(c.cr,12,40,16,40); LN(c.cr,52,40,48,40); }
    if (rear > 0.5) { P(c.cr,22,58); P(c.cr,38,58); }
    if (ent && p >= 0.4) { const q = (p-0.4)/0.6; puff(16-rn(q*5),59,3-q); puff(48+rn(q*5),59,3-q); }
    if (smug && !A && !H && !sono && !ent) { P(c.wh,23,26); }
    if (H > 0.3) { S(21,22,['..o..','.oyo.','oyyyo','.oyo.','..o..']); }
  });

  // ============================================================ TOURO TROVÃO
  function bolt(x0,y0,x1,y1,seed){
    const n = 5; let px = x0, py = y0;
    for (let i = 1; i <= n; i++) {
      const u = i/n, nx = i===n ? x1 : rn(x0+(x1-x0)*u + ((i+seed)%2 ? 3 : -3)), ny = rn(y0+(y1-y0)*u);
      LN(c.yl,px+1,py,nx+1,ny); LN(c.wh,px,py,nx,ny); px = nx; py = ny;
    }
  }
  def('touro-trovao',(t,st,p)=>{
    const sono = st==='sono', A = st==='atk' ? ak(p) : 0, H = st==='hit' ? hk(p) : 0, ent = st==='entra';
    if (ent && p < 0.3) { // lightning strikes the plot before the bull appears
      const q = p/0.3;
      bolt(30,0,32,rn(10+50*q),1);
      if (q > 0.8) { star(32,58,6); }
      return;
    }
    const stm = fl(t*1.6)%2, crk = fl(t*7)%3, paw = !sono && !A && !H && fl(t*2)%3===1;
    const tl = sono ? 0 : rn(2*sin(t*2.1));
    const fl2 = sono ? false : ((t%2.6) < 0.18 || ((t%2.6) > 0.3 && (t%2.6) < 0.4));
    const rear = A < 0 ? -A : 0;
    const by = sono ? 6 : rn(-rear*2) - (H ? 1 : 0);
    OX = H ? rn(2*H) : 0; OY = by;
    // tail
    const tb = bezF(53,40, 59+tl,36, 57+tl,29, 0.9,0.7);
    F(c.ol,48,24,63,44,tb);
    S(55+tl,25,['.oo.','osso','osso','.oo.']);
    // back legs
    if (!sono) { leg(44,50,58,4,c.sd,c.ol,c.ol); leg(50,49,57,4,c.sd,c.ol,c.ol); R(c.wd,44,55,4,1); R(c.wd,50,54,4,1); }
    // body / hump
    const bd = any(eF(36,41,18,10), eF(28,35,10,7.5), eF(46,39,8.5,9));
    body(bd,15,26,57,53,c.sd,c.ol,c.wd,c.ol,2);
    F(c.wo,15,26,57,53,(x,y)=>bd(x,y)&&!bd(x,y-1)&&x>24&&x<50&&((x>>1)&1));
    F(c.wo,15,26,57,53,(x,y)=>bd(x,y)&&!bd(x,y-3)&&bd(x,y-2)&&x>30&&x<46&&((x>>1)&1)===0);
    // front legs (thick)
    if (!sono) { const up = paw ? 2 : rn(rear*3); leg(19,50,60,5,c.sd,c.ol,c.ol); leg(32,50,60-up,5,c.sd,c.ol,c.ol); R(c.wd,19,57,5,1); R(c.wd,32,57-up,5,1); }
    // head (lowered, in front)
    const hy = A > 0 ? rn(3*A) : rn(-rear*4);
    OY = by + hy;
    const er = any(eF(16.5,40,3.4,1.8), eF(38.5,40,3.4,1.8));
    body(er,12,37,43,43,c.sd,c.ol,null,c.ol,1);
    R(c.wo,15,40,3,1); R(c.wo,38,40,3,1);
    // horns (wide, curving up)
    const hl = bezF(21,38, 10,37, 9,27, 2.3,0.7), hr = bezF(33,38, 44,37, 45,27, 2.3,0.7);
    for (const h of [hl,hr]) { body(h,5,24,49,41,c.lg,c.gy,c.wh,c.ol,1); }
    const hd = any(eF(27,43,8.2,7.6), eF(27,48.5,5.8,4));
    body(hd,17,34,37,54,c.sd,c.ol,c.wd,c.ol,2);
    S(23,35,['.w.w.','wowow'].map(r=>r)); // forehead curls
    F(c.wd,20,44,34,54,(x,y)=>hd(x,y)&&inE(x,y,27,48.5,5,3.4));
    if (A > 0.3 || H) { R(c.ol,24,48,2,2); R(c.ol,29,48,2,2); } else { R(c.ol,24,48,2,1); R(c.ol,29,48,2,1); }
    S(25,51,['.yy.','y..y','.yy.']);
    // eyes
    if (sono) { R(c.ol,21,42,4,1); R(c.ol,29,42,4,1); }
    else if (H) { S(21,41,['o..o','.oo.']); S(29,41,['o..o','.oo.']); }
    else {
      R(c.ol,21,41,4,3); R(c.rd,22,42,2,1); P(c.yl,23,42); P(c.wh,22,41);
      R(c.ol,29,41,4,3); R(c.rd,30,42,2,1); P(c.yl,31,42); P(c.wh,30,41);
      LN(c.ol,20,39,24,40); LN(c.ol,34,39,30,40);
      if (A > 0.3) { R(c.yl,22,42,2,1); R(c.yl,30,42,2,1); }
    }
    OX = 0; OY = 0;
    if (ent) { const s = pop((p-0.3)/0.7); warp(s,s); }
    if (A > 0) warp(1+0.07*A,1+0.03*A,28,60);
    // ---- fx: storm cloud above
    const cy0 = 7 + (sono ? 3 : rn(sin(t*1.2))) - (rear ? 1 : 0);
    const cl = any(eF(24,cy0+2,6,3.2), eF(31,cy0,6.5,4.2), eF(38,cy0+2,6,3.2));
    body(cl,16,cy0-5,46,cy0+6,sono?c.sd:c.gy,sono?c.ol:c.sd,sono?c.gy:c.lg,c.ol,1);
    if (!sono) for (let i = 0; i < 4; i++) { const x = 22+i*5, y = cy0+7+((fl(t*8)+i*2)%4); P(c.sk,x,y); P(c.sk,x,y+1); }
    // crackle around the horn tips (and between them when charging)
    const ty = 27+by+hy;
    if (!sono || crk===0) {
      for (const [hx,dir] of [[9,1],[45,-1]]) {
        const z = crk===0 ? [0,0, 2,-3, -1,-5, 1,-8] : crk===1 ? [0,0, -2,-2, 1,-5, -1,-7] : [0,0, 1,-2];
        for (let i = 0; i+3 < z.length; i += 2) LN(c.yl,hx+z[i]*dir,ty+z[i+1],hx+z[i+2]*dir,ty+z[i+3]);
        P(c.wh,hx+z[z.length-2]*dir,ty+z[z.length-1]);
        if (sono) break;
      }
    }
    if (A !== 0 && !sono) { const yy = ty-4; const pts = [10,yy, 15,yy-4, 20,yy, 25,yy-4, 30,yy, 35,yy-4, 40,yy, 44,yy-3]; for (let i = 0; i+3 < pts.length; i += 2) { LN(c.yl,pts[i],pts[i+1],pts[i+2],pts[i+3]); } for (let i = 2; i < pts.length-2; i += 4) P(c.wh,pts[i],pts[i+1]); }
    if (fl2 && !A) bolt(32,cy0+5,rn(40),24+by,2);
    // steam from the nostrils
    if (!A || A < 0) { const k = sono ? fl(t*0.8)%2 : stm; const sy = 49+by+hy; if (k) { puff(17-(fl(t*3)%2),sy,2,c.lg,c.gy); } else { puff(37+(fl(t*3)%2),sy,2,c.lg,c.gy); } }
    if (rear > 0.4) { spark(c.yl,8,24,true); spark(c.yl,46,24,true); spark(c.wh,27,22); }
    if (A > 0.5) {
      bolt(31,cy0+5,27,34,3);
      star(27,58,5); spark(c.yl,8,30,true); spark(c.yl,47,30,true); spark(c.yl,14,52); spark(c.yl,42,54);
      puff(15,59,3,c.lg,c.gy); puff(41,59,3,c.lg,c.gy);
    }
    if (H > 0.2) { const r = 8+rn(H*8); for (let i = 0; i < 6; i++) { const a = i*1.05; spark(c.yl,rn(28+cos(a)*r*1.4),rn(42+sin(a)*r)); } }
    if (ent) { const q = (p-0.3)/0.7; if (q < 0.5) bolt(31,0,31,30,4); for (let i = 0; i < 8; i++) { const a = i*0.785, r = 14+q*16; spark(i%2?c.yl:c.wh,rn(32+cos(a)*r*1.3),rn(44+sin(a)*r*0.8)); } }
  });

  // ============================================================ MATRIARCA MUGIDORA
  def('matriarca-mugidora',(t,st,p)=>{
    const sono = st==='sono', A = st==='atk' ? ak(p) : 0, H = st==='hit' ? hk(p) : 0, ent = st==='entra';
    const sw = sono ? 0 : fl(t*2)%2;
    const bell = sono ? 0 : [0,1,0,-1][fl(t*1.6)%4];
    const blink = sono || (t%4.2) > 3.95 || A < -0.3;
    const ef = !sono && (t%5.3) > 4.9 ? -1 : 0;
    const tl = sono ? 0 : rn(2*sin(t*1.9));
    const rear = A < 0 ? -A : 0;
    const by = sono ? 6 : rn(-rear*2) - (H ? 1 : 0);
    // halo rays (behind, only into empty pixels later)
    OX = H ? rn(2*H) : 0; OY = by;
    // tail
    LN(c.ol,54,42,57+tl,51); LN(c.ol,55,42,58+tl,51); S(56+tl,51,['.oo.','owwo','owwo','.oo.']);
    if (!sono) { leg(44,51,58,4,c.cr,c.st,c.wo); leg(50,50,57,4,c.cr,c.st,c.wo); }
    const bd = eF(35,45,20,9.6);
    body(bd,14,34,56,56,c.cr,c.st,c.wh,c.ol,2);
    for (const q of [[20,42,5,3.5],[50,41,4.5,3.4],[46,50,4,2.6],[18,50,2.6,2]]) F(c.wo,14,34,56,56,(x,y)=>bd(x,y)&&inE(x,y,q[0],q[1],q[2],q[3]));
    if (!sono) { const up = rn(rear*3); leg(21,51,60-up,5,c.cr,c.st,c.wo); leg(33,51,60-up,5,c.cr,c.st,c.wo); }
    // head
    const hy = A > 0 ? rn(2*A) : rn(-rear*3);
    OY = by + hy;
    const er = any(eF(18.5,28+ef,4.6,2), eF(43.5,28,4.6,2));
    body(er,12,24,50,32,c.cr,c.st,null,c.ol,1);
    R(c.pk,16,28+ef,3,1); R(c.pk,44,28,3,1);
    const h1 = bezF(24,23, 17,22, 17,14, 1.8,0.6), h2 = bezF(38,23, 45,22, 45,14, 1.8,0.6);
    for (const h of [h1,h2]) body(h,13,11,49,26,c.cr,c.lg,c.wh,c.ol,1);
    const hd = eF(31,30,9.8,8.8);
    body(hd,20,20,42,40,c.cr,c.st,c.wh,c.ol,2);
    F(c.wo,20,20,42,40,(x,y)=>hd(x,y)&&inE(x,y,25.5,25,4.2,3.4)&&y>22);
    // daisy crown on a leafy wreath
    F(c.gd,20,20,42,26,(x,y)=>hd(x,y)&&!hd(x,y-2)&&y<25);
    F(c.gr,20,20,42,26,(x,y)=>hd(x,y)&&!hd(x,y-1)&&y<24&&(x&1));
    const dz = [[23,23],[27,21],[35,21],[39,23]];
    for (let i = 0; i < dz.length; i++) { const d = dz[i], dy = (i%2===sw) ? 0 : -1; S(d[0]-1,d[1]-1+dy,['.W.','WyW','.W.']); }
    { const dy = sw ? -1 : 0; S(29,17+dy,['..o..','.oWo.','oWyWo','.oWo.','..o..']); P(c.or,31,19+dy); }
    // wise eyes (half-lidded, lashes)
    if (H) { S(24,29,['o...o','.ooo.']); S(34,29,['o...o','.ooo.']); }
    else if (blink) { S(24,30,['.ooo.','o...o']); S(34,30,['.ooo.','o...o']); }
    else { S(24,29,['o.ooo','.oooo','.oWoo']); S(34,29,['ooo.o','oooo.','oWoo.']); R(c.st,25,28,3,1); R(c.st,34,28,3,1); }
    // muzzle
    const mz = eF(31,37,7,4);
    F(c.ol,22,31,40,43,(x,y)=>!mz(x,y)&&!hd(x,y)&&(mz(x-1,y)||mz(x+1,y)||mz(x,y-1)||mz(x,y+1)));
    F(c.pk,22,31,40,43,mz);
    F(c.wn,22,31,40,43,(x,y)=>mz(x,y)&&!mz(x,y+1)&&y>38);
    R(c.wn,27,36,2,1); R(c.wn,33,36,2,1);
    if (A > 0.3) { S(27,37,['.ooooo.','onnnnno','onnpnno','.ooooo.']); }
    else if (H) S(29,38,['.ooo.','o...o']);
    else S(28,39,['o....o','.oooo.']);
    // golden bell on a wine ribbon
    const bx = A > 0 ? rn(3*sin(p*28)) : (H ? 2 : bell);
    R(c.ol,22,41,19,3); R(c.wn,23,41,17,2); R(c.rd,23,41,17,1);
    S(27+bx,42,['...ooo...','..oyyyo..','.oyyyyOo.','.oyyyyOo.','oyyyyyyOo','ooooooooo','....o....']);
    P(c.wh,29+bx,44); P(c.cr,30+bx,44); P(c.cr,29+bx,45);
    OX = 0; OY = 0;
    if (ent) { const s = pop(p); warp(s,s); }
    if (A > 0) warp(1+0.06*A,1-0.05*A); else if (rear) warp(1+0.04*rear,1+0.03*rear);
    // ---- fx
    const hcx = 31, hcy = 27+by+hy;
    if (!sono) {
      const big = ent ? 1 : (A > 0 ? 0.7 : 0), nR = 9;
      for (let i = 0; i < nR; i++) {
        const a = PI + (i+0.5)*PI/nR;
        const len = 2 + ((i + fl(t*2.2)) % 3 === 0 ? 1 : 0) + rn(big*9);
        const r0 = 16 + ((i&1) ? 1 : 0);
        for (let r = r0; r < r0+len; r++) PE(r < r0+2 ? c.yl : c.cr, rn(hcx+cos(a)*r*1.15), rn(hcy+sin(a)*r));
      }
    }
    const tw = fl(t*2.5)%4;
    if (!sono) { const sp = [[8,16],[55,12],[52,28],[10,34],[57,40]]; for (let i = 0; i < sp.length; i++) if ((i+tw)%4 !== 0) spark((i%2)?c.yl:c.wh,sp[i][0],sp[i][1]); }
    if (!A && !H && !sono && (t%2.2) < 0.35) spark(c.wh,30+bell,45+by,true);
    if (A > 0.4) {
      for (const r of [9,14,19]) F(c.cr,0,0,63,63,(x,y)=>{ const dx=x+0.5-31, dy=(y+0.5-(40+by))*1.25, d=Math.hypot(dx,dy); return dy>-2 && Math.abs(d-r)<0.6 && !B[y*64+x]; });
      puff(17,59,3); puff(45,59,3);
      spark(c.yl,6,50,true); spark(c.yl,58,50,true);
    }
    if (H > 0.3) { S(46,14-rn(H*4),['.W.','WyW','.W.']); }
  });

  // ============================================================ BEZERRO MANHOSO
  function tear(x,y){ S(x,y,['.k.','kkW','.k.']); }
  def('bezerro-manhoso',(t,st,p)=>{
    const sono = st==='sono', A = st==='atk' ? ak(p) : 0, H = st==='hit' ? hk(p) : 0, ent = st==='entra';
    const pout = !sono && (t%3.2) > 2.2;
    const tf = sono ? 0 : [0,1,2,1][fl(t*2.5)%4];
    const ey = !sono && (t%1.9) > 1.6 ? -2 : (sono ? 1 : 0);
    const sway = sono ? 0 : (pout ? 0 : [0,0,1,0,0,-1][fl(t*1.4)%6]);
    const gl = fl(t*2)%2;
    const stomp = A < 0 ? fl(p*16)%2 : -1;
    const air = ent ? sin(p*PI) : 0;
    const by = sono ? 6 : -rn(air*7) - (H ? 1 : 0);
    OX = sway + (H ? rn(2*H) : 0); OY = by;
    // tail
    const tl = bezF(47,46, 52,45, 51+tf,39, 0.9,0.7);
    body(tl,44,36,56,48,c.wh,null,null,c.ol);
    S(49+tf,35,['.oo.','owwo','owwo','.oo.']);
    if (!sono) { leg(41,50,58,3,c.wh,c.lg,c.sd); leg(46,49,57,3,c.wh,c.lg,c.sd); }
    const bd = eF(37,48,11,6);
    body(bd,25,41,49,55,c.wh,c.lg,null,c.ol,2);
    F(c.wo,25,41,49,55,(x,y)=>bd(x,y)&&inE(x,y,44,46,4.5,3.4));
    if (!sono) { const tuck = air > 0.4 ? 2 : 0; leg(27,51,60-(stomp===0?2:0)-tuck,3,c.wh,c.lg,c.sd); leg(33,51,60-(stomp===1?2:0)-tuck,3,c.wh,c.lg,c.sd); }
    // head
    const hy = A > 0 ? rn(3*A) : 0;
    OY = by + hy + (sono ? 1 : 0);
    const er = any(eF(19.5,35-(H?2:0),4.4,2), eF(42.5,35+ey-(H?2:0),4.4,2));
    body(er,13,31,49,39,c.wh,c.lg,null,c.ol,1);
    R(c.pk,17,35-(H?2:0),3,1); R(c.pk,42,35+ey-(H?2:0),3,1);
    S(24,26,['.oo.','otto','otwo']); S(33,26,['.oo.','otto','owto']);
    const puffR = pout || A < 0 ? 4.8 : 4.2;
    const hd = any(eF(30.5,37,9,7.8), eF(37.5,41,puffR,3.8));
    body(hd,20,28,44,47,c.wh,c.lg,null,c.ol,2);
    F(c.wo,20,28,44,47,(x,y)=>hd(x,y)&&inE(x,y,25.5,33.5,4.2,3.6));
    S(28,27,['.oo.o','owwow','.oww.']);
    // eyes
    if (sono) { S(24,36,['o.o','.o.'].map(r=>r)); R(c.ol,24,36,3,1); R(c.ol,33,36,3,1); S(23,35,['.o.']); }
    else if (H || A > 0.2 || A < -0.15) { S(24,34,['o..','.oo','o..']); S(34,34,['..o','oo.','..o']); }
    else {
      const lk = pout ? 1 : 0;
      S(24+lk,34,['ooo','oWo','ooo']); P(c.wh,26+lk,36);
      S(33+lk,34,['ooo','oWo','ooo']); P(c.wh,35+lk,36);
      if (gl) { P(c.sk,24+lk,36); P(c.sk,33+lk,36); }
    }
    if (!sono) { LN(c.ol,23,32,26,31); LN(c.ol,34,31,37,32); }
    R(c.pk,38,40,3,1); R(c.pk,21,40,2,1);
    if (A < 0 || pout) { R(c.rd,38,40,3,1); }
    // muzzle + pouty mouth
    const mz = eF(29.5,42,5.4,3.2);
    F(c.pk,22,38,36,46,mz);
    F(c.wn,22,38,36,46,(x,y)=>mz(x,y)&&!mz(x,y+1));
    R(c.wn,26,41,2,1); R(c.wn,31,41,2,1);
    if (H) S(27,43,['.oo.','onno','.oo.']);
    else if (sono) S(28,43,['o..o','.oo.']);
    else S(28,43,['.oo.','o..o']);
    // rope collar + bell
    R(c.ol,23,46,16,2); R(c.rd,24,46,14,1);
    for (let x = 24; x < 38; x += 2) P(c.wn,x,46);
    S(28,47,['.oooo.','oyyyOo','oyyyOo','oooooo','..oo..']);
    P(c.wh,29,48);
    OX = 0; OY = 0;
    if (ent) warp(1-0.06*air,1+0.08*air);
    if (A > 0) warp(1+0.06*A,1+0.03*A,30,60);
    // fx
    const tx = sway, ty = by+hy;
    if (A > 0.4 || H > 0.2) {
      const k = A > 0.4 ? A : H;
      tear(19-rn(k*5)+tx,33+ty-rn(k*2)); tear(40+rn(k*5)+tx,33+ty-rn(k*2)); tear(15-rn(k*6)+tx,38+ty); tear(44+rn(k*6)+tx,38+ty);
    }
    if (A > 0.6) star(30,27+ty,3);
    if (A < 0 && stomp >= 0) { P(c.st,stomp?37:25,59); P(c.cr,stomp?38:24,58); }
    if (pout && !A && !H) { P(c.wh,45+tx,38+by); R(c.wh,46+tx,37+by,2,1); }
    if (ent) heart(28,rn(18-air*4),'p');
  });

  // ============================================================ JEGUE CARREGADOR
  function bladeF(cx,cy,a,L,w){
    const ux=cos(a), uy=sin(a);
    return (x,y)=>{ const dx=x+0.5-cx, dy=y+0.5-cy, s=(dx*ux+dy*uy)/L; if (s<0||s>1) return false; const q=-dx*uy+dy*ux; return Math.abs(q) <= w*Math.sqrt(4*s*(1-s))+0.15; };
  }
  function orange(x,y){ S(x,y,['.oo.','oOyo','oOOo','.oo.']); }
  function basket(x0,y0,flip){
    const bk = pF([x0,y0, x0+12,y0, x0+11,y0+12, x0+1,y0+12]);
    body(bk,x0-1,y0-1,x0+13,y0+13,c.st,c.wo,c.cr,c.ol,1);
    for (let y = y0+3; y < y0+11; y += 2) for (let x = x0+2+((y-y0)&2); x < x0+11; x += 4) R(c.wo,x,y,2,1);
    R(c.rd,x0+1,y0+6,11,2); for (let x = x0+2; x < x0+11; x += 3) P(c.yl,x,y0+6+(x&1));
    R(c.ol,x0-1,y0-1,15,1); R(c.wd,x0,y0,13,2); R(c.st,x0,y0,13,1);
  }
  def('jegue-carregador',(t,st,p)=>{
    const sono = st==='sono', A = st==='atk' ? ak(p) : 0, H = st==='hit' ? hk(p) : 0, ent = st==='entra';
    const e1 = sono ? 0.9 : (H ? 0.9 : (A < 0 ? 0.5*-A : 0) + (fl(t*1.3)%2 ? 0.12 : 0));
    const e2 = sono ? 0.9 : (H ? 0.9 : (A < 0 ? 0.5*-A : 0) + (fl(t*1.3+0.5)%3===0 ? 0.15 : 0));
    const tf = sono ? 0 : [0,1,2,1][fl(t*2.2)%4];
    const bob = sono ? 0 : rn(0.6+0.6*sin(t*2));
    const blink = sono || (t%3.6) > 3.42;
    const chew = !sono && fl(t*2.6)%2;
    const kick = A > 0 ? A : 0;
    const trot = ent ? rn(Math.abs(sin(p*PI*3))*-3) : 0;
    const by = (sono ? 4 : 0) - (H ? 1 : 0) + trot;
    OX = H ? rn(2*H) : 0; OY = by;
    // tail (behind, right)
    // hind legs kicked up behind the back
    if (kick > 0.2) {
      const k = rn(kick*6);
      const l1 = tubeF([24,44, 18-k,34-k],1.6), l2 = tubeF([42,44, 48+k,34-k],1.6);
      body(any(l1,l2),8,22,58,48,c.gy,c.nt,null,c.ol,1);
      R(c.sd,17-k,32-k,3,2); R(c.sd,47+k,32-k,3,2);
    }
    // body + back legs
    if (!sono && kick <= 0.2) { leg(22,50,58,3,c.nt,c.ol,c.sd); leg(40,50,58,3,c.nt,c.ol,c.sd); }
    const bd = eF(33,45,12.5,6.5);
    body(bd,20,38,46,52,c.gy,c.nt,c.lg,c.ol,2);
    R(c.wd,21,39,24,1);
    // baskets + goods (bob with the steps)
    OY = by + bob;
    const pop2 = (kick > 0.3 ? rn(kick*8) : 0) + (H > 0.3 ? rn(H*4) : 0);
    S(47+tf%2,31,['.o.','oyo','oyo','oyo','oyo','ogo','ogo']); S(51,30,['.o.','oyo','oyo','oyo','oyo','ogo','ogo']);
    basket(9,39); basket(43,39);
    orange(11,35-pop2); orange(15,36); orange(18,35-(H>0.3?rn(H*6):0));
    orange(53,35-(kick>0.3?rn(kick*5):0));
    OY = by;
    // front legs
    if (!sono) { leg(27,50,60,3,c.gy,c.nt,c.sd); leg(33,50,60,3,c.gy,c.nt,c.sd); R(c.lg,27,56,3,1); R(c.lg,33,56,3,1); }
    // head
    const hy = (A < 0 ? rn(-A*2) : 0) + (kick ? 2 : 0) + (sono ? 2 : 0);
    OY = by + hy;
    for (const [a0,ox,e] of [[-1.88,29,e1],[-1.26,34,-e2]]) {
      const f = bladeF(ox,29,a0-e,14,2.5);
      body(f,12,8,54,32,c.gy,c.nt,null,c.ol,1);
      const g2 = bladeF(ox,29,a0-e,12,1.0);
      F(c.pk,12,8,54,32,(x,y)=>g2(x,y)&&!bladeF(ox,29,a0-e,5,3)(x,y));
    }
    const hd = any(eF(31.5,34,5.8,6.2), eF(31.5,42,4.8,4.4));
    body(hd,24,26,40,48,c.gy,c.nt,c.lg,c.ol,2);
    F(c.lg,24,38,40,48,(x,y)=>hd(x,y)&&y>=39);
    F(c.wh,24,38,40,48,(x,y)=>hd(x,y)&&y===39&&x>27&&x<36);
    S(29,26,['.o.o.','ooooo','.ooo.']);
    P(c.ol,29,43); P(c.ol,34,43);
    if (kick > 0.3) S(29,45,['oooooo','onnnno','.oooo.']);
    else if (H) S(30,45,['.oo.','o..o']);
    else R(c.ol,30+chew,46,4,1);
    // eyes with pale ring
    if (blink) { R(c.ol,26,34,3,1); R(c.ol,34,34,3,1); }
    else if (H || kick > 0.3) { S(26,33,['o..','.oo','o..']); S(34,33,['..o','oo.','..o']); }
    else { R(c.lg,26,32,3,3); R(c.ol,27,33,2,2); P(c.wh,27,33); R(c.lg,34,32,3,3); R(c.ol,34,33,2,2); P(c.wh,34,33); LN(c.ol,26,31,28,31); LN(c.ol,34,31,36,31); }
    OX = 0; OY = 0;
    if (A < 0) warp(1,1-0.03*-A);
    // fx
    if (kick > 0.6) { star(16-rn(kick*6),31-rn(kick*6),4); star(49+rn(kick*6),31-rn(kick*6),4); }
    if (kick > 0.3) { R(c.cr,40,44+hy,2,1); R(c.cr,41,47+hy,3,1); R(c.cr,40,50+hy,2,1); R(c.cr,22,44+hy,2,1); R(c.cr,20,47+hy,3,1); }
    if (ent && p > 0.3) { const q = (p-0.3)/0.7; orange(30,rn(14-sin(q*PI)*8)); }
    if (ent) { P(c.st,20,60); P(c.st,44,60); P(c.cr,18,59); P(c.cr,46,59); }
  });

  // ============================================================ PORCO COMILÃO
  def('porco-comilao',(t,st,p)=>{
    const sono = st==='sono', A = st==='atk' ? ak(p) : 0, H = st==='hit' ? hk(p) : 0, ent = st==='entra';
    const ch = sono ? 0 : fl(t/0.3)%2;
    const tw = sono ? 0 : fl(t*2.5)%2;
    const sn = sono ? 0 : [0,0,1,0,-1,0][fl(t*3)%6];
    const br = sono ? 0.6*sin(t*1.2) : 0.4*sin(t*2.4);
    const open = A < 0 ? -A : 0, chomp = A > 0 ? A : 0;
    const fall = ent ? (p < 0.4 ? 1-sm(p/0.4) : 0) : 0;
    const by = (sono ? 3 : 0) - (H ? 1 : 0) - rn(fall*16);
    OX = H ? rn(2*H) : 0; OY = by;
    // curly tail
    S(47+tw,33,['.ooo.','op.po','o.opo','.opo.','..o..']);
    // legs (mud spots)
    if (!sono) for (const L of [[39,58,0],[46,57,1]]) { leg(L[0],51,L[1],3,c.pk,c.wn,c.sd); P(c.wd,L[0],53+L[2]); P(c.wd,L[0]+1,54); }
    // round belly
    const bd = eF(35,45,16+br,11+br*0.6);
    body(bd,17,33,53,57,c.pk,c.wn,null,c.ol,2);
    F(c.cr,17,33,53,57,(x,y)=>bd(x,y)&&!bd(x,y-1)&&x>32&&x<48);
    F(c.cr,17,33,53,57,(x,y)=>bd(x,y)&&!bd(x,y-2)&&bd(x,y-1)&&x>36&&x<44);
    for (const q of [[46,42],[48,47],[44,51]]) { R(c.wd,q[0],q[1],2,1); P(c.wd,q[0]+1,q[1]+1); }
    if (!sono) for (const L of [[23,60,1],[31,60,0]]) { leg(L[0],52,L[1],4,c.pk,c.wn,c.sd); P(c.wd,L[0]+1,55+L[2]); P(c.wd,L[0],56); P(c.wd,L[0]+2,57); }
    // head
    const hy = (ch && !A && !H ? 1 : 0) + (open ? -rn(open*3) : 0) + rn(chomp*3);
    OY = by + hy;
    // floppy ears (behind the head top)
    const eu = H ? -2 : 0;
    S(18,26+eu,['oo.....','oppoo..','opppppo','.onnppo','..ooooo']);
    S(35,26+eu,['.....oo','..oappo'.replace('a','p'),'opppppo','oppnno.','ooooo..']);
    const hd = eF(30,37,10,8.2);
    body(hd,19,28,41,46,c.pk,c.wn,c.cr,c.ol,1);
    // eyes
    if (sono) { S(23,35,['o..o','.oo.']); S(33,35,['o..o','.oo.']); }
    else if (H) { S(23,33,['.oo.','o..o','.oo.']); S(33,33,['.oo.','o..o','.oo.']); P(c.ol,24,34); P(c.ol,34,34); }
    else if (open > 0.2) { R(c.ol,24,33,2,3); P(c.wh,24,33); R(c.ol,34,33,2,3); P(c.wh,34,33); }
    else { S(23,34,['.oo.','o..o']); S(33,34,['.oo.','o..o']); }
    R(c.rd,21,38,3,1); R(c.rd,36,38,3,1);
    // snout
    const sx = 30 + (sono ? 0 : sn*0.5);
    const snF = eF(sx,42,5.2,3.6);
    if (open > 0.2) {
      const mo = eF(30,46.5+open*1.5,6.6,2.2+open*3.4);
      body(mo,21,41,39,57,c.wn,null,null,c.ol);
      F(c.pk,21,41,39,57,(x,y)=>mo(x,y)&&inE(x,y,30,49+open*3,3.8,1.8));
      R(c.wh,25,45,3,1); R(c.wh,32,45,3,1); R(c.wh,26,51+rn(open*2),2,1); R(c.wh,32,51+rn(open*2),2,1);
    }
    body(snF,23,37,37,47,c.pk,c.wn,c.cr,c.ol,1);
    R(c.wn,rn(sx)-2,41,1,2); R(c.wn,rn(sx)+1,41,1,2);
    if (open <= 0.2) {
      if (H) S(29,46,['.o.','o.o','.o.']);
      else if (chomp > 0.3) S(25,46,['oo....oo','.oooooo.']);
      else S(27+ch,46,['o...o','.ooo.']);
    }
    OX = 0; OY = 0;
    if (ent && p >= 0.4) { const q = (p-0.4)/0.6; const k = sin(q*PI)*(1-q); warp(1+0.18*k,1-0.16*k); }
    if (chomp) warp(1+0.06*chomp,1-0.04*chomp);
    // fx
    if (!A && !H && !sono) { const k = (t*1.3)%1; if (k < 0.6) { P(c.yl,26+(fl(t)%2)*7,rn(51+by+k*9)); P(c.st,33-(fl(t)%2)*6,rn(52+by+k*7)); } }
    if (chomp > 0.5) {
      star(30,50+by+3,4);
      for (const q of [[18,44],[42,44],[16,52],[44,53],[22,38],[38,37]]) { P(c.yl,q[0],q[1]); P(c.st,q[0]+1,q[1]+1); }
      R(c.cr,14,48,3,1); R(c.cr,44,48,3,1);
    }
    if (open > 0.5) { P(c.wh,22,33+by); P(c.wh,38,33+by); }
    if (ent && p >= 0.4) { for (const q of [[14,58],[48,58],[12,55],[50,55]]) P(c.st,q[0],q[1]); puff(20,59,2.5); puff(46,59,2.5); }
  });

  // ============================================================ VAQUEIRO ABOIADOR
  def('vaqueiro-aboiador',(t,st,p)=>{
    const sono = st==='sono', A = st==='atk' ? ak(p) : 0, H = st==='hit' ? hk(p) : 0, ent = st==='entra';
    const ph = t%6.5, sing = !sono && st==='idle' && ph > 4.6;
    const blink = !sono && (t%3.2) > 3.05;
    const sw = sono ? 0 : fl(t*1.5)%2;
    const br = sono ? (fl(t*0.9)%2) : (fl(t*1.1)%2);
    const swing = sono ? 0 : rn(sin(t*1.8));
    const by = (H ? -1 : 0);
    OX = H ? rn(2*H) : 0; OY = by;
    const hatUp = (H ? rn(H*4) : 0) + (ent && p > 0.2 && p < 0.85 ? rn(sin((p-0.2)/0.65*PI)*8) : 0);
    // boots + legs
    for (const x of [25,34]) {
      R(c.ol,x-1,45,7,16); R(c.wd,x,46,5,10); R(c.wo,x,46,1,9); R(c.sd,x+4,46,1,10);
      R(c.sd,x,56,5,4); R(c.wd,x,56,5,1);
    }
    R(c.ol,24,59,6,2); R(c.ol,34,59,7,2);
    // lasso coil hanging from the left hand
    {
      const ls = ringF(17+swing,49,4.6,5.6,1.6);
      body(ls,10,42,24,56,c.st,c.wo,null,c.ol,1);
    }
    // gibão
    const gb = pF([21,47, 22,35, 27,31, 37,31, 42,35, 43,47]);
    body(gb,19,29,45,49,c.wo,c.wd,c.st,c.ol,2);
    F(c.cr,26,30,38,38,pF([29,31, 35,31, 33,37, 31,37]));
    for (let y = 37; y < 46; y += 2) { P(c.st,28,y); P(c.st,36,y); }
    S(23,37,['..t..','.t.t.','t.c.t','.t.t.','..t..']); S(37,37,['..t..','.t.t.','t.c.t','.t.t.','..t..']);
    R(c.ol,22,45,21,3); R(c.sd,22,46,21,1); R(c.yl,31,45,3,2); P(c.ol,32,46);
    // neckerchief
    const nk = pF([26,30, 38,30, 35,34, 32,37, 29,34]);
    body(nk,25,29,39,38,c.rd,c.wn,null,c.ol,1);
    // left arm (viewer's left) holding the coil
    const la = tubeF([23,34, 20,40, 19,46],2.2);
    body(la,15,31,27,49,c.wo,c.wd,c.st,c.ol,1);
    S(17+swing,45,['.oo.','otto','otto','.oo.']);
    // right arm: idle at the side, singing = cupped at mouth, atk = up / lash
    let hand;
    if (A < 0) { const k = -A; const hx = rn(43+k*6), hy = rn(42-k*34); body(tubeF([41,34, (41+hx)/2+2,(34+hy)/2, hx,hy],2.2),36,4,56,48,c.wo,c.wd,c.st,c.ol,1); hand = [hx,hy]; }
    else if (A > 0.05) { const k = A; const hx = rn(46+k*6), hy = rn(40+k*4); body(tubeF([41,34, hx,hy],2.2),36,30,58,50,c.wo,c.wd,c.st,c.ol,1); hand = [hx,hy]; }
    else if (sing) { body(tubeF([41,35, 44,32, 38,26],2.2),34,22,48,40,c.wo,c.wd,c.st,c.ol,1); hand = [37,25]; }
    else if (ent && p > 0.2 && p < 0.85) { body(tubeF([41,34, 45,24, 40,14-hatUp+8],2.2),34,0,50,40,c.wo,c.wd,c.st,c.ol,1); hand = [40,14-hatUp+8]; }
    else { body(tubeF([41,34, 44,40, 45,45],2.2),37,31,49,49,c.wo,c.wd,c.st,c.ol,1); hand = [45,46]; }
    S(hand[0]-2,hand[1]-1,['.oo.','otto','otto','.oo.']);
    // neck + head
    OY = by + (sono ? 1 : 0);
    R(c.ol,29,26,7,5); R(c.st,30,26,5,5); R(c.wo,33,27,2,4);
    const hd = any(eF(32,21,6.2,6.8), eF(25.5,22,1.6,1.8));
    body(hd,24,13,40,29,c.st,c.wo,null,c.ol,1);
    F(c.wd,24,13,40,18,(x,y)=>hd(x,y)&&y<17&&x>25); F(c.sd,24,13,40,18,(x,y)=>hd(x,y)&&y<15);
    // eyes + brows
    if (sono || (ent && p > 0.3 && p < 0.8)) { S(28,21,['o..o'].map(r=>r)); R(c.ol,28,21,3,1); R(c.ol,33,21,3,1); if (!sono) { P(c.ol,28,20); P(c.ol,30,20); } }
    else if (H || A > 0.3) { S(28,20,['o..','.oo']); S(33,20,['.oo','o..']); }
    else if (blink) { R(c.ol,28,21,2,1); R(c.ol,34,21,2,1); }
    else { R(c.ol,28,20,2,2); P(c.wh,28,20); R(c.ol,34,20,2,2); P(c.wh,34,20); }
    if (!sono) { R(c.sd,27,18,3,1); R(c.sd,33,18,3,1); }
    R(c.pk,27,23,2,1); R(c.pk,36,23,2,1);
    // moustache + mouth
    S(29,24,['.ssss.','ss..ss']);
    if (sing || A > 0.3) S(30,26,['.oo.','onno','.oo.']); else if (sono) R(c.sd,31,26,2,1); else R(c.ol,31,26,2,1);
    // chin strap
    R(c.sd,25,18,1,4); R(c.sd,25+sw,22,1,3); R(c.sd,26+sw,25,1,2); R(c.sd,27,27,4,1);
    // hat
    OY = by - hatUp + (sono ? 3 : 0);
    const crn = (x,y)=>inE(x,y,32,12.5,7,6.2) && y<=15;
    const brm = (x,y)=>inE(x,y,32,16,15.4,2.8);
    body(any(crn,brm),15,5,49,20,c.wd,c.sd,c.wo,c.ol,1);
    F(c.sd,15,5,49,20,(x,y)=>brm(x,y)&&!brm(x,y+1));
    for (let x = 19; x < 46; x += 3) P(c.st,x,16);
    S(30,8,['..t..','ttttt','.ttt.','.t.t.']);
    OX = 0; OY = 0;
    // ---- fx: lasso
    if (A < 0) { // spinning loop above the head
      const k = -A, cx = hand[0]-1, cy = hand[1]-4, rot = p*40, rx = 3+7*k, ry = 1.2+2.2*k;
      const lp = (x,y)=>inE(x,y,cx,cy,rx,ry)&&!inE(x,y,cx,cy,rx-1.5,ry-1.1);
      body(lp,cx-12,cy-5,cx+12,cy+5,c.st,c.wo,null,c.ol,1);
      const mx = rn(cx+cos(rot)*(rx-0.6)), my = rn(cy+sin(rot)*(ry-0.4)); P(c.wd,mx,my); P(c.wd,mx+1,my);
      if (k > 0.5) { R(c.cr,cx-rx-3,cy,2,1); R(c.cr,cx+rx+2,cy-1,2,1); P(c.cr,cx,cy-ry-2); }
    }
    if (A > 0.05) { // the lash: rope snaps out toward the target
      const k = A; const x0 = hand[0], y0 = hand[1];
      const x1 = rn(x0 + 2 + 6*k), y1 = rn(y0 + 4 + 10*k);
      const f = bezF(x0,y0, x0+10*k, y0-12*k, x1,y1, 1.0,0.6);
      body(f,x0-4,y0-14,63,63,c.st,c.wo,null,c.ol,1);
      if (k > 0.8) { star(x1,y1,4); R(c.cr,x1-7,y1-3,2,1); R(c.cr,x1+3,y1-6,1,2); R(c.cr,x1-6,y1+3,2,1); }
    }
    // aboio: sound waves
    if (sing) {
      const r0 = br ? 1.5 : 0;
      for (const r of [5,9,13]) F(c.cr,40,8,63,42,(x,y)=>{ const dx=x+0.5-38, dy=(y+0.5-25)*1.05, d=Math.sqrt(dx*dx+dy*dy); return dx>2 && Math.abs(dy) < dx*0.85 && Math.abs(d-(r+r0))<0.55 && !B[y*64+x]; });
    }
    if (H > 0.4) { spark(c.wh,22,8); spark(c.wh,44,8); }
    if (ent && p > 0.3 && p < 0.8) { spark(c.yl,22,4,true); spark(c.yl,46,6); }
  });

  // ============================================================ CERCA DE PEDRA (construção)
  def('cerca-de-pedra',(t,st,p)=>{
    const sono = st==='sono', A = st==='atk' ? sin(p*PI) : 0, H = st==='hit' ? hk(p) : 0, ent = st==='entra';
    const shk = (A || H) ? ((fl((A ? p : p)*30)%2) ? 1 : -1) * ((A||H) > 0.3 ? 1 : 0) : 0;
    const build = ent ? sm(p/0.85) : 1;
    // ground strip
    R(c.ol,3,60,58,1);
    // dry-stone wall: four courses each side, irregular stones
    const CY = [35,43,51], CH = [8,8,9];
    const L = [[4,11,17,22],[4,8,15,22],[4,10,16,22]];
    const Rr = [[42,48,54,60],[42,46,53,60],[42,49,55,60]];
    for (const side of [L,Rr]) for (let ri = 0; ri < 3; ri++) {
      const xs = side[ri], dx = A ? shk*((ri&1)?1:-1) : (H && ri===0 ? shk : 0);
      for (let i = 0; i+1 < xs.length; i++) {
        const x0 = xs[i]+dx, x1 = xs[i+1]+dx, y0 = CY[ri], h = CH[ri], w = x1-x0;
        const lite = ((xs[i]*7+ri*3)%4)===0;
        R(c.ol,x0,y0,w+1,h+1);
        R(lite?c.lg:c.gy,x0+1,y0+1,w-1,h-1);
        R(lite?c.wh:c.lg,x0+2,y0+1,w-3,1); R(lite?c.wh:c.lg,x0+1,y0+2,1,h-4);
        R(c.sd,x0+2,y0+h-1,w-3,1); R(lite?c.gy:c.sd,x1-1,y0+2,1,h-3);
        P(c.ol,x0+1,y0+1); P(c.ol,x1-1,y0+1); P(c.ol,x0+1,y0+h-1); P(c.ol,x1-1,y0+h-1);
      }
    }
    // top face + moss
    for (const [x0,x1] of [[4,22],[42,60]]) { R(c.ol,x0,31,x1-x0+1,5); R(c.lg,x0+1,32,x1-x0-1,2); R(c.gy,x0+1,34,x1-x0-1,1); }
    for (const m of [[6,31,4],[14,32,3],[45,31,5],[55,32,3]]) { R(c.gd,m[0],m[1],m[2],2); P(c.lm,m[0]+1,m[1]); P(c.gr,m[0]+m[2]-1,m[1]+1); }
    for (const m of [[10,51],[49,43],[57,51],[16,43]]) { R(c.gd,m[0],m[1],2,1); P(c.gr,m[0]+1,m[1]-1); }
        // crack when hit
    if (H > 0.2) { LN(c.ol,12,45,14,49); LN(c.ol,14,49,13,51); LN(c.ol,50,38,52,42); }
    // gate posts
    const gdx = A ? shk : 0;
    for (const px of [23,37]) {
      R(c.ol,px-1,23,6,38); R(c.wo,px,24,4,36); R(c.wd,px+3,24,1,36); R(c.st,px,24,1,35);
      R(c.ol,px-1,21,6,3); R(c.wd,px,22,4,1); R(c.st,px+1,22,2,1);
    }
    // gate boards
    R(c.ol,27+gdx,28,10,31);
    for (let x = 28; x < 36; x += 3) { R(c.wo,x+gdx,29,2,29); P(c.st,x+gdx,29); }
    R(c.wd,27+gdx,32,10,2); R(c.wd,27+gdx,52,10,2);
    LN(c.wd,28+gdx,51,35+gdx,34); LN(c.st,28+gdx,50,34+gdx,34);
    P(c.lg,26,33); P(c.lg,26,53); P(c.ol,26,34); P(c.ol,26,52);
    // flowers at the base (sway)
    const fs2 = sono ? 0 : fl(t*1.4)%2;
    for (const f of [[7,57,c.pk],[13,58,c.yl],[19,57,c.pk],[46,57,c.yl],[52,58,c.pk],[58,57,c.yl]]) {
      const sx = (f[0]&2) ? fs2 : -fs2+1;
      R(c.gd,f[0],f[1],1,3); R(f[2],f[0]-1+sx,f[1]-1,3,1); P(f[2],f[0]+sx,f[1]-2); P(f[2]===c.pk?c.yl:c.or,f[0]+sx,f[1]-1); P(f[2],f[0]+sx,f[1]);
    }
    for (const x of [10,16,49,55]) { R(c.lm,x,58,1,2); P(c.gr,x+1,59); }
    // building up from the ground on entrance
    if (ent) {
      const yT = 61 - rn(build*42);
      for (let y = 0; y < yT && y < 64; y++) for (let x = 0; x < 64; x++) B[y*64+x] = 0;
      if (p < 0.85) { const fy = rn(yT - 10 + p*4); S(28,fy,['oooooo','oLLLYo','oLYYso','.osss.','..oo..'].map(r=>r.replace(/s/g,'s'))); }
      if (p > 0.1) { puff(10,59,2.5); puff(54,59,2.5); }
    }
    // butterfly
    let bx, byy, closed = false;
    if (sono) { bx = 24; byy = 18; closed = true; }
    else { bx = rn(32 + 20*sin(t*0.8)); byy = rn(14 + 5*sin(t*1.7)) - (H ? rn(H*8) : 0); }
    if (!ent || p > 0.7) {
      const fl3 = fl(t*(H?14:7))%2;
      if (closed) S(bx,byy,['.o.o.','.oio.','.oiuo','..oo.','..o..']);
      else if (fl3) S(bx-1,byy,['oo.oo','iioii','iuoui','.ioi.','..o..']); else S(bx-1,byy,['.....','.ioi.','iioii','iuoui','.o.o.']);
      P(c.ol,bx,byy-1); P(c.ol,bx+2,byy-1);
    }
    // reaction fx
    if (A > 0.3) { puff(30,59,3,c.lg,c.gy); R(c.cr,1,40,2,1); R(c.cr,61,40,2,1); R(c.cr,0,48,3,1); R(c.cr,61,48,3,1); }
    if (H > 0.2) { const y = rn(46 + (1-H)*12); S(14,y,['.oo.','oYYo','.oo.']); S(48,y+2,['oo','oo']); }
  });
})();
