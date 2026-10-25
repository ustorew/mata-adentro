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
  // tapered quadratic-bezier blade (feather / plume / tail): width w0 at start -> w1 at end
  function bezF(x0,y0,x1,y1,x2,y2,w0,w1,n){
    n = n||22; const Q = [];
    for (let i = 0; i <= n; i++) { const u=i/n, a=(1-u)*(1-u), b=2*u*(1-u), c=u*u; const w=w0+(w1-w0)*u; Q.push([a*x0+b*x1+c*x2, a*y0+b*y1+c*y2, w*w]); }
    return (x,y)=>{ const px=x+0.5, py=y+0.5; for (const s of Q) { const dx=px-s[0], dy=py-s[1]; if (dx*dx+dy*dy<=s[2]) return true; } return false; };
  }
  // feather blade from pivot (cx,cy) along angle a: starts at s0, length L, half-width w, rounded tip
  function featherF(cx,cy,a,s0,L,w){
    const ux=Math.cos(a), uy=Math.sin(a);
    return (x,y)=>{ const dx=x+0.5-cx, dy=y+0.5-cy, s=dx*ux+dy*uy; if (s<s0||s>L) return false; const q=Math.abs(-dx*uy+dy*ux);
      let hw = w; if (s > L-w) hw = Math.sqrt(Math.max(0,w*w-(s-(L-w))*(s-(L-w)))); if (s < s0+5) hw *= 0.45+0.55*(s-s0)/5; return q <= hw; };
  }
  // cache a predicate into a 64x48 mask (fast lookups for shapes tested many times)
  function MK(f){ const m = new Uint8Array(W*H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (f(x,y)) m[y*W+x] = 1; return (x,y)=>x>=0&&x<W&&y>=0&&y<H&&m[y*W+x]===1; }
  const ringF = (cx,cy,rx,ry,th)=>(x,y)=>inE(x,y,cx,cy,rx,ry)&&!inE(x,y,cx,cy,rx-th,ry-th*ry/rx);
  // little musical note (3x4 head+stem+flag), colour c
  const note = (g,c,x,y)=>{ R(g,c,x+1,y,2,1); R(g,c,x+1,y+1,1,2); R(g,c,x,y+2,2,2); P(g,c,x+2,y+1); };

  // ---------------------------------------------------------------- terrains (C)
  // Milharal: v 0 dia, 1 escuro (feitiço), 2 crepúsculo, 3 noite, 5 amanhecer
  function bgMilho(g,v,o){
    o = o||{};
    const dark = v===2||v===3;
    if (v===0) { R(g,C.sk,0,0,64,12); R(g,C.cr,0,12,64,8); }
    else if (v===1) { R(g,C.bl,0,0,64,12); R(g,C.st,0,12,64,8); for (let x = 0; x < 64; x += 4) P(g,C.st,x+((x>>2)&1)*2,11); }
    else if (v===2) { R(g,C.nt,0,0,64,5); R(g,C.pu,0,5,64,7); R(g,C.li,0,12,64,3); R(g,C.pk,0,15,64,5);
      if (!o.cheap) for (let x = 0; x < 64; x += 4) { R(g,C.nt,x+((x>>2)&1)*2,5,2,1); R(g,C.pu,x+((x>>2)&1)*2,12,2,1); } }
    else if (v===3) { R(g,C.nt,0,0,64,20); }
    else if (v===5) { R(g,C.sk,0,0,64,7); R(g,C.pk,0,7,64,6); R(g,C.cr,0,13,64,7);
      for (let x = 0; x < 64; x += 4) { R(g,C.sk,x+((x>>2)&1)*2,7,2,1); R(g,C.pk,x+((x>>2)&1)*2,13,2,1); } }
    if (o.sky) o.sky(g);
    R(g, dark?C.sd:C.wo, 0,34,64,14);
    const fu = dark?C.ol:C.wd;
    R(g,fu,0,34,64,1); R(g,fu,0,36,64,1); R(g,fu,0,40,64,1); R(g,fu,0,44,64,1);
    for (let x = 3; x < 64; x += 7) if (hs(x,3)%3===0) R(g, dark?C.wd:C.st, x+(hs(x,9)%3), 38+(hs(x,4)%2)*4, 2, 1);
    const a = dark?C.ol:C.gd, b = dark?C.gd:C.gr;
    for (let k = 0; k < 22; k++) {
      const x = k*3, top = 14+hs(k,5)%3;
      if (o.gap && x+2 >= o.gap[0] && x <= o.gap[1]) continue;
      R(g,a,x,top,3,34-top); if (v!==1 || k%2===0) R(g,b,x+1,top+1,1,33-top);
      if (k%2===0) R(g, dark?C.gd:C.yl, x+1, top-2, 1, 2);
      if (v!==1 && !o.cheap && hs(k,9)%3===0) { const ly = top+5+hs(k,2)%9; R(g,b,(k%2?x+2:x-1),ly,2,1); }
    }
  }
  // Celeiro: v 0 normal, 1 escuro (feitiço)
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
  // bandeirinhas (festa junina flags) on a string between x0 and x1 at height y
  function flags(g,x0,x1,y,sag){
    const cols = [C.rd,C.yl,C.bl,C.gr];
    for (let x = x0; x <= x1; x++) { const u = (x-x0)/(x1-x0); P(g,C.ol,x,y+Math.round(sag*4*u*(1-u))); }
    let i = 0;
    for (let x = x0+1; x+3 <= x1; x += 5, i++) {
      const u = (x+1-x0)/(x1-x0), yy = y+1+Math.round(sag*4*u*(1-u));
      const c = cols[i%4];
      R(g,c,x,yy,4,1); R(g,c,x,yy+1,3,1); R(g,c,x+1,yy+2,2,1); P(g,c,x+1,yy+3);
      P(g,C.ol,x+3,yy+1); P(g,C.ol,x+2,yy+2);
    }
  }

  // ======================================================== MILHARAL (C)
  // 1. Codorna Ninheira
  CARD_ART['codorna-ninheira'] = function(g,t){
    bgMilho(g,0);
    const tb = fl(t/0.6)%2 ? -1 : 0;           // topknot bob
    const cb = (t%2) > 1.82;                    // chick blink
    // ground shadow
    E(g,C.wd,28,44,17,1.6);
    // nest: back rim (inside of the bowl)
    const nest = eF(27,39.5,15.5,4.2);
    F(g,C.ol,10,34,45,45,(x,y)=>dil(nest)(x,y)&&y<=40);
    F(g,C.sd,11,35,44,40,(x,y)=>nest(x,y)&&y<=39);
    // tail (short, upturned)
    S(g,9,24,[
      '.ooo....',
      'owwwoo..',
      'odwwwwo.',
      '.oddddwo',
      '..oooooo'
    ]);
    // plump round body
    const bd = any(eF(26.5,31,12.5,8.6), eF(34,26,6,5));
    body(g,bd,[12,19,42,41],C.wo,C.wd,C.st,C.ol,2);
    // straw belly
    F(g,C.st,12,19,42,41,(x,y)=>bd(x,y)&&inE(x,y,34.5,33,6,5.5)&&bd(x+2,y+2));
    F(g,C.cr,12,19,42,41,(x,y)=>bd(x,y)&&inE(x,y,35.5,30.5,2.2,1.8)&&bd(x+3,y));
    // scallop marks on the back
    for (const m of [[17,26],[21,24],[25,23],[29,23],[19,29],[23,27],[27,26],[31,26],[15,30]]) { R(g,C.wd,m[0],m[1],2,1); P(g,C.wd,m[0]+2,m[1]-1); P(g,C.cr,m[0],m[1]-1); }
    // folded wing with straw streaks
    const wg = pF([15,30, 22,27, 30,29, 32,34, 26,36, 17,35]);
    F(g,C.wd,13,25,34,38,wg);
    F(g,C.wo,13,25,34,38,(x,y)=>wg(x,y)&&!wg(x,y-1));
    F(g,C.sd,13,25,34,38,(x,y)=>wg(x,y)&&!wg(x,y+1));
    R(g,C.st,18,31,9,1); R(g,C.st,21,33,8,1); R(g,C.cr,24,29,4,1);
    // head
    const hd = eF(38.5,20.5,6.3,5.8);
    body(g,hd,[30,12,47,28],C.wo,C.wd,C.st,C.ol,2);
    F(g,C.wd,30,12,47,28,(x,y)=>hd(x,y)&&y<=16&&hd(x-1,y-1));
    // cream eyebrow stripe sweeping back + cream throat
    R(g,C.cr,35,17,8,1); R(g,C.cr,33,18,2,1); P(g,C.cr,43,18);
    F(g,C.cr,30,12,47,28,(x,y)=>hd(x,y)&&inE(x,y,41.5,24.5,3,2.2));
    R(g,C.wd,40,22,3,1);
    eye(g,39,18,2,3);
    R(g,C.pk,35,22,2,1);
    // beak
    S(g,44,19,['oo..','OOOo','Ooo.']);
    // teardrop topknot plume leaning forward (bobs)
    S(g,36,9+tb,[
      '..ooo',
      '.oooo',
      '.o.o.',
      'o....'
    ]);
    // nest: front half with straw weave
    const nf = (x,y)=>nest(x,y)&&y>=39;
    F(g,C.ol,10,36,45,46,(x,y)=>dil(nf)(x,y)&&y>=39);
    F(g,C.st,11,37,44,45,nf);
    F(g,C.wo,11,37,44,45,(x,y)=>nf(x,y)&&(!nest(x+1,y+2)||((x+y*2)%5===0)));
    F(g,C.yl,11,37,44,45,(x,y)=>nf(x,y)&&nest(x+1,y+2)&&((x-y*2+50)%5===0));
    // twisted rim
    for (let x = 12; x < 43; x += 3) { R(g,C.yl,x,38,2,1); P(g,C.wo,x+2,38); P(g,C.st,x+1,37); }
    R(g,C.ol,11,39,1,1); R(g,C.ol,43,39,1,1);
    // loose straws
    LN(g,C.yl,9,37,12,38); LN(g,C.st,42,36,46,35); P(g,C.yl,8,39); LN(g,C.yl,30,44,34,45);
    // the egg with a chick peeking out
    const ch = eF(51,33.5,4.2,4);
    body(g,ch,[46,28,56,38],C.st,C.wo,C.cr,C.ol,1);
    // shell cap on its head
    S(g,47,27,[
      '..ooooo..',
      '.occccco.',
      'occcccLco',
      '.o.oo.o..'
    ]);
    P(g,C.wh,49,28);
    if (cb) { R(g,C.ol,48,34,2,1); R(g,C.ol,52,34,2,1); }
    else { R(g,C.ol,48,33,2,2); P(g,C.wh,48,33); R(g,C.ol,52,33,2,2); P(g,C.wh,52,33); }
    R(g,C.or,50,35,2,1); P(g,C.pk,47,35); P(g,C.pk,54,35);
    const eg = (x,y)=>inE(x,y,51,39.5,5.4,5.4)&&y>=37+((x%2)?0:1);
    F(g,C.ol,44,35,58,46,(x,y)=>dil(eg)(x,y)&&y>=36);
    F(g,C.cr,44,35,58,46,eg);
    F(g,C.lg,44,35,58,46,(x,y)=>eg(x,y)&&!eg(x+2,y+1));
    P(g,C.sd,48,40); P(g,C.sd,53,39); P(g,C.sd,50,43); P(g,C.sd,54,42); P(g,C.wh,47,39);
  };
  // 2. Pamonha Quentinha (feitiço)
  CARD_ART['pamonha-quentinha'] = function(g,t){
    bgMilho(g,1);
    const s = fl(t/0.15)%16;
    // wooden plate
    const pl = eF(27,42,20,4.4);
    F(g,C.ol,5,36,50,47,dil(pl));
    F(g,C.wd,6,37,49,47,pl);
    F(g,C.wo,6,37,49,47,(x,y)=>pl(x,y)&&inE(x,y,27,41.2,18.5,3.4));
    F(g,C.st,6,37,49,47,(x,y)=>pl(x,y)&&inE(x,y,27,41.2,18.5,3.4)&&!inE(x,y,27.6,41.6,18.5,3.4));
    // steam ribbons: wavy tubes that scroll up, ending in a curl
    const smp = [];
    const ribbon = (bx,yb,yt,lean,A,ph,dir,R0,w0,w1)=>{
      const n = yb-yt;
      for (let i = 0; i <= n; i++) {
        const u = i/n, y = yb-i;
        smp.push([bx + lean*u + A*Math.sin(Math.PI*u)*Math.sin(2*Math.PI*(y+s+ph)/16), y, w0+(w1-w0)*u]);
      }
      const ex = bx+lean, ey = yt, cx = ex + dir*R0;
      for (let a = 0.15; a < 4.6; a += 0.22) {
        const r = R0*(1-a/7.5), th = dir>0 ? Math.PI + a : -a;
        smp.push([cx + r*Math.cos(th), ey + r*Math.sin(th), w1*(1-a/9)]);
      }
    };
    ribbon(14,30,10,-4,3,0,-1,4.2,3,2);
    ribbon(27,28,7,3,3.4,6,1,4.8,3.2,2.1);
    ribbon(36,27,12,11,2.8,11,1,3.8,2.8,1.8);
    // rasterise every sample disc into a mask (fast: only each disc's own box)
    const M = new Uint8Array(64*32);
    for (const q of smp) {
      const r2 = q[2]*q[2];
      for (let y = Math.max(0,fl(q[1]-q[2])); y <= Math.min(31,Math.ceil(q[1]+q[2])); y++)
        for (let x = Math.max(0,fl(q[0]-q[2])); x <= Math.min(63,Math.ceil(q[0]+q[2])); x++) {
          const dx = x+0.5-q[0], dy = y+0.5-q[1];
          if (dx*dx+dy*dy <= r2) M[y*64+x] = 1;
        }
    }
    const inS = (x,y)=>x>=0&&x<64&&y>=0&&y<32&&M[y*64+x]===1;
    F(g,C.cr,0,0,63,31,inS);
    F(g,C.lg,0,0,63,31,(x,y)=>inS(x,y)&&(!inS(x+1,y)||!inS(x,y+1))&&(x+y)%2===0);
    F(g,C.wh,0,0,63,31,(x,y)=>inS(x,y)&&!inS(x-1,y)&&inS(x+1,y));
    // the husk parcel (rounded pillow)
    const pc = (x,y)=>{ const a=(x+0.5-25)/14.5, b=(y+0.5-34.5)/6.4; return a*a*a*a + b*b*b*b <= 1; };
    const tipL = pF([12,31, 5,33, 12,37]);
    const pf = any(pc,tipL);
    F(g,C.ol,3,26,42,42,dil(pf));
    F(g,C.gr,4,27,41,41,pf);
    F(g,C.lm,4,27,41,41,(x,y)=>pf(x,y)&&y<=33&&pf(x,y-1));
    F(g,C.gd,4,27,41,41,(x,y)=>pf(x,y)&&!pf(x,y+2));
    F(g,C.cr,4,27,41,41,(x,y)=>pf(x,y)&&!pf(x,y-1)&&x<28&&x>12);
    // husk ribs along the length
    for (const y of [30,32]) R(g,C.gr,13,y,24,1);
    for (const y of [36,38]) R(g,C.gd,13,y,25,1);
    LN(g,C.gd,6,33,12,34); LN(g,C.lm,7,32,11,32);
    // the husk folded open along the top: corn paste showing
    const op = (x,y)=>inE(x,y,34,30.2,6,2.3);
    F(g,C.ol,26,26,42,34,(x,y)=>dil(op)(x,y));
    F(g,C.yl,27,27,41,33,op);
    F(g,C.or,27,27,41,33,(x,y)=>op(x,y)&&!op(x,y+1));
    R(g,C.cr,31,29,4,1); P(g,C.wh,32,29); P(g,C.cr,37,30); P(g,C.st,29,31); P(g,C.st,35,31);
    // peeled husk flap
    PG(g,C.ol,[36,29, 43,21, 47,23, 42,30]); PG(g,C.lm,[37,29, 43,22, 46,23, 41,29]); LN(g,C.gr,39,28,44,23); P(g,C.gd,41,29);
    // a drip of paste on the side
    S(g,39,33,['oyo','oyo','.o.']);
    // straw string tied across + bow
    R(g,C.ol,20,27,5,15); R(g,C.st,21,27,3,14); R(g,C.wo,23,28,1,13);
    S(g,16,23,[
      '.oo...oo.',
      'otto.otto',
      'ottwowtto',
      '.oowtwoo.',
      '...otwo..',
      '..ot..to.',
      '..o....o.'
    ]);
    // kernels on the plate
    S(g,10,40,['yt','.y']); S(g,44,41,['ty','y.']); P(g,C.yl,47,39);
    // sparkles
    const tw = fl(t*3)%3;
    const sp = [[8,24],[53,22],[44,4],[34,17],[57,33]];
    for (let i = 0; i < sp.length; i++) { const k = (i+tw)%3; if (k===0) spark(g,C.yl,sp[i][0],sp[i][1],true); else if (k===1) spark(g,C.yl,sp[i][0],sp[i][1]); else P(g,C.yl,sp[i][0],sp[i][1]); }
  };

  // 3. Galo Despertador
  CARD_ART['galo-despertador'] = function(g,t){
    bgMilho(g,5,{sky:(g)=>{
      F(g,C.or,0,5,24,16,eF(12,17,11,11)); F(g,C.yl,0,7,22,16,eF(12,17,9.5,9.5)); F(g,C.cr,5,10,16,16,eF(11,16,4.5,3.5));
    }});
    const pf = fl(t/0.3)%2, cw = (t%1.2) > 0.9 ? 1 : 0;
    // fence rails + side posts
    for (const y of [30,37]) { R(g,C.ol,0,y,64,4); R(g,C.wo,0,y+1,64,2); R(g,C.st,0,y+1,64,1); }
    for (const x of [3,57]) { R(g,C.ol,x,27,5,20); R(g,C.wo,x+1,28,3,19); R(g,C.wd,x+3,28,1,19); R(g,C.st,x+1,27,3,1); }
    // the post he stands on
    R(g,C.ol,25,30,11,18); R(g,C.wo,26,31,9,17); R(g,C.wd,33,31,2,17); R(g,C.st,26,32,1,15);
    R(g,C.st,26,30,9,2); R(g,C.wd,28,31,5,1); P(g,C.wd,30,35); R(g,C.wd,29,39,1,3); P(g,C.wd,31,44);
    // tail: a fountain of black-green sickles against the rising sun
    const arc = (cx,cy,rx,ry,th)=>(x,y)=>{ if (!inE(x,y,cx,cy,rx,ry) || inE(x,y,cx,cy,rx-th,ry-th)) return false; const a = Math.atan2(cy-y-0.5, x+0.5-cx)*57.3; return a > -12 || a < -158; };
    const tl = [arc(16,17,13,15,2.6), arc(16.5,18,8.4,10,2.5), arc(17,19,4.2,5.6,2.3)];
    const tf = any(...tl);
    F(g,C.ol,1,1,27,25,dil(tf));
    F(g,C.gd,2,2,26,24,tf);
    F(g,C.gr,2,2,26,24,(x,y)=>tf(x,y)&&!tf(x,y-1));
    P(g,C.lm,14,3); P(g,C.lm,15,9); P(g,C.lm,4,12); P(g,C.lm,9,14);
    // legs + feet on the post
    R(g,C.ol,27,25,3,6); R(g,C.ol,32,25,3,6); R(g,C.yl,28,25,1,5); R(g,C.yl,33,25,1,5);
    S(g,25,29,['oyyyo.oyyyyo','.ooo...oooo.']);
    // body: wine with a proud chest
    const bd = any(eF(29,19.5,8.5,6.2), eF(35,17.5,5,5.6));
    body(g,bd,[18,10,42,27],C.wn,C.sd,C.rd,C.ol,2);
    // wing with a copper shoulder and dark primaries
    const wg = eF(27.5,20,6.5,3.4);
    F(g,C.sd,20,15,35,25,wg);
    F(g,C.or,20,15,35,25,(x,y)=>wg(x,y)&&!wg(x,y-2)&&x<32);
    F(g,C.gd,20,15,35,25,(x,y)=>wg(x,y)&&x<25&&y>=20);
    R(g,C.wn,25,21,6,1); R(g,C.wn,24,23,5,1);
    // saddle hackles
    S(g,19,13,['.OO..','OyOO.','.OOrO','..O..']);
    // neck hackles
    const nk = pF([33,7, 41,6, 43,12, 40,18, 38,22, 36,20, 33,22, 31,16, 32,10]);
    F(g,C.ol,29,4,45,24,dil(nk));
    F(g,C.or,30,5,44,23,nk);
    F(g,C.rd,30,5,44,23,(x,y)=>nk(x,y)&&!nk(x+2,y+1));
    F(g,C.yl,30,5,44,23,(x,y)=>nk(x,y)&&!nk(x-1,y)&&y>9);
    for (const x of [34,37,39]) LN(g,C.rd,x,12,x-1,18);
    // comb (wiggles 1px)
    S(g,34+cw,1,[
      '..o.o.o..',
      '.ororoco.',
      '.orrrrrro',
      '.onrrrrno',
      '..onnnno.'
    ]);
    // head: rd face patch, eye, open beak
    F(g,C.rd,36,5,44,12,eF(40.5,8.5,2.8,2.4));
    eye(g,40,7,2,2);
    S(g,43,5,[
      '.oo...',
      'oyOOo.',
      'oOOOOo',
      'ooooo.',
      'oOOo..',
      '.oo...'
    ]);
    S(g,40,11,['orro','orno','.oo.']);
    // sound arcs (pulse)
    const cx = 46, cy = 8;
    const rs = pf ? [4,7,10] : [3,6,9];
    for (let k = 0; k < 3; k++) {
      const r = rs[k], pts = new Set();
      for (let a = -0.6; a <= 0.95; a += 0.05) pts.add(Math.round(cy+r*Math.sin(a))*64 + Math.round(cx+r*Math.cos(a)));
      for (const v of pts) { const x = v%64, y = (v-x)/64; P(g, (k===2&&pf)?C.or:C.yl, x, y); }
    }
  };

  // 4. Galinheiro (construção)
  CARD_ART['galinheiro'] = function(g,t){
    bgMilho(g,0);
    const bl = (t%2.5) > 2.3, fd = fl(t*1.5)%2;
    E(g,C.wd,32,43.5,19,1.6);
    // stilts
    for (const x of [19,43]) { R(g,C.ol,x,34,4,9); R(g,C.wd,x+1,34,2,8); }
    // gable wall (vertical planks, one rect per plank)
    const gt = x=>Math.ceil(22 - Math.max(0, 14-Math.abs(x+0.5-32))*11/14);
    const wl = pF([18,37, 18,22, 32,11, 46,22, 46,37]);
    F(g,C.ol,16,9,48,38,dil(wl));
    F(g,C.wo,17,10,47,37,wl);
    for (let x = 21; x < 46; x += 4) R(g,C.sd,x,gt(x)+1,1,37-gt(x)-1);
    for (let x = 22; x < 46; x += 8) for (let k = 0; k < 3; k++) R(g,C.wd,x+k,gt(x+k)+1,1,37-gt(x+k)-1);
    R(g,C.st,18,22,1,15);
    R(g,C.wd,18,35,28,2); R(g,C.sd,18,36,28,1);
    // diamond vent
    S(g,30,14,['..o..','.oso.','osyso','.oso.','..o..']);
    // roof boards
    const rf = tubeF([13,25, 32,9.5, 51,25],2.1);
    F(g,C.ol,10,5,54,29,dil(rf));
    F(g,C.rd,11,6,53,28,rf);
    F(g,C.wn,11,6,53,28,(x,y)=>rf(x,y)&&!rf(x,y+2));
    F(g,C.or,11,6,53,28,(x,y)=>rf(x,y)&&!rf(x,y-1)&&x<32);
    for (const k of [0.25,0.5,0.75]) { for (const sd of [-1,1]) { const x = Math.round(32+sd*19*k), y = Math.round(9.5+15.5*k); P(g,C.wn,x,y); P(g,C.wn,x-sd,y-1); } }
    S(g,30,6,['.ooo.','oyyyo','.ooo.']);
    // round door with peeking eyes
    const dr = eF(32,26.5,4.2,4.2);
    F(g,C.ol,26,21,38,32,dil(dr));
    F(g,C.sd,27,22,37,31,dr);
    F(g,C.ol,27,22,37,31,(x,y)=>dr(x,y)&&!dr(x-1,y-1));
    if (!bl) { P(g,C.yl,30,26); P(g,C.yl,34,26); P(g,C.wh,30,25); P(g,C.wh,34,25); P(g,C.or,32,27); }
    else { P(g,C.wd,30,26); P(g,C.wd,34,26); }
    // straw spilling from the door + ramp
    S(g,27,30,['.ytyt.y..','y..t.yty.']);
    const rp = tubeF([33,32, 50,42],1.6);
    F(g,C.ol,30,29,53,45,dil(rp));
    F(g,C.wd,31,30,52,44,rp);
    F(g,C.wo,31,30,52,44,(x,y)=>rp(x,y)&&!rp(x,y-1));
    for (const k of [0.2,0.45,0.7,0.92]) { const x = Math.round(33+17*k), y = Math.round(32+10*k); R(g,C.st,x-1,y-1,1,2); }
    // hay nest with two eggs
    const hy = (x,y)=>inE(x,y,12,42,8.5,3.8)&&y<=44;
    F(g,C.ol,2,37,22,45,(x,y)=>dil(hy)(x,y)&&y<=44);
    F(g,C.st,3,38,21,44,hy);
    F(g,C.wo,3,38,21,44,(x,y)=>hy(x,y)&&!hy(x,y+1));
    for (const e of [[6,34],[12,35]]) S(g,e[0],e[1],[
      '.ooo.',
      'occWo',
      'occco',
      'occLo',
      'oLLLo',
      '.ooo.'
    ]);
    S(g,4,39,['y.yt.y.ty.yty.yt.','.ty.y.yt.t.y.t.y.']);
    // loose straws
    LN(g,C.yl,52,43,56,42); P(g,C.yl,24,44); R(g,C.yl,36,44,2,1);
    // drifting feather
    const fx = 52+fd, fy = 14+fd;
    S(g,fx,fy,['...WW','..WWL','.WWL.','oL...']);
  };

  // 5. Gavião Real (lendária)
  CARD_ART['gaviao-real'] = function(g,t){
    // dusk: the last of the sun sinking behind the corn, right behind the bird
    bgMilho(g,2,{cheap:1,sky:(g)=>{
      F(g,C.or,22,6,52,19,eF(37,20,13,13));
      F(g,C.yl,27,10,47,19,eF(37,20,9,9));
    }});
    const cf = fl(t*3)%2, tw = fl(t*2.5)%3;
    for (let i = 0; i < 4; i++) P(g, i%2?C.li:C.cr, [5,58,11,52][i], [2,3,1,1][i]);
    // shadow passing over the field
    E(g,C.ol,34,44.5,15,1.4);
    // wings spread wide, raised a little, fingered tips
    const lw = pF([29,19, 22,15, 15,11, 9,10, 3,8, 7,11, 1,12, 6,14, 1,17, 6,18, 2,22, 8,21, 7,25, 12,23, 12,27, 17,25, 18,29, 22,27, 25,30, 29,26]);
    const rw = pF([39,19, 45,15, 51,12, 56,11, 61,9, 58,12, 63,13, 59,15, 63,18, 58,19, 61,23, 55,22, 55,26, 51,24, 50,28, 46,26, 44,29, 40,26]);
    const wing = MK(any(lw,rw));
    F(g,C.ol,0,6,63,31,dil(wing));
    F(g,C.gy,0,7,63,30,wing);
    // pale coverts along the arm, darker flight-feather tips
    const cvL = tubeF([28,21, 15,14, 8,12],2.6), cvR = tubeF([40,21, 51,15, 56,13],2.2);
    F(g,C.lg,0,7,63,30,(x,y)=>wing(x,y)&&(cvL(x,y)||cvR(x,y)));
    // feather separations
    for (const l of [[9,15,5,14],[10,18,6,18],[13,22,11,23],[18,24,18,26],[54,16,58,15],[53,19,57,19],[50,22,51,24]]) LN(g,C.sd,l[0],l[1],l[2],l[3]);
    // golden rim along the leading edges
    F(g,C.cr,0,6,63,30,(x,y)=>wing(x,y)&&!wing(x,y-1));
    F(g,C.yl,0,6,63,30,(x,y)=>wing(x,y)&&wing(x,y-1)&&!wing(x,y-2)&&x>7&&x<57);
    // short tail fan peeking under the body
    S(g,27,33,['.oooooooo.','oYYoYYoYYo','oYYoYYoYYo','.oLLoLLoLo','..ooooooo.']);
    // body: white belly under the black chest band
    const bd = eF(34,27.5,6.6,6.6);
    body(g,bd,[26,20,42,35],C.wh,C.lg,null,C.ol,2);
    PG(g,C.ol,[28,21, 41,20, 41,24, 29,25]);
    // barred thigh reaching forward
    const th = tubeF([35,31, 43,35],2.6);
    body(g,th,[30,27,47,40],C.wh,C.lg,null,C.ol,1);
    R(g,C.ol,37,31,1,3); R(g,C.ol,40,32,1,3); R(g,C.ol,43,33,1,3);
    // huge open talons: three toes forward, one back, hooked claws
    const toe = [tubeF([45,34, 50,28],1.3), tubeF([45,34, 54,33],1.3), tubeF([45,35, 51,39],1.3), tubeF([44,35, 41,40],1.2)];
    const ta = any(...toe, eF(45,34.5,2.6,2.3));
    F(g,C.ol,37,25,57,43,dil(ta));
    F(g,C.yl,38,26,56,42,ta);
    F(g,C.or,38,26,56,42,(x,y)=>ta(x,y)&&!ta(x+1,y+1));
    P(g,C.wh,44,33); P(g,C.cr,48,30); P(g,C.cr,51,33);
    S(g,50,25,['.oo','oOO','o..']); S(g,54,31,['oo.','.Oo','.Oo','.o.']); S(g,51,39,['oO.','.Oo','.o.']); S(g,39,40,['.oO','oO.','o..']);
    // head: grey with a pale face, facing right; double crest raised like a crown (flutters)
    S(g,29,1,[
      'o........o',
      'oo......oo',
      'oYo....oYo',
      'oYYo..oYYo',
      '.oYYooYYo.',
      '..oYYYYo..',
      '...oooo...'
    ].map((r,i)=>i===0&&cf?'.o.......o':(i===1&&cf?'.oo.....oo':r)));
    const hd = eF(37.5,14.5,5.7,5.1);
    F(g,C.ol,30,8,45,21,dil(hd));
    F(g,C.gy,31,9,44,20,hd);
    F(g,C.lg,31,9,44,20,(x,y)=>hd(x,y)&&inE(x,y,39.5,15.5,3.8,3.6));
    R(g,C.sd,32,10,4,1); R(g,C.lg,35,10,4,1);
    // fierce eye under an angled brow
    LN(g,C.ol,35,11,41,13); P(g,C.ol,36,11);
    S(g,38,13,['Wy','yo']);
    // hooked beak
    S(g,42,13,[
      'ooo...',
      'sYYo..',
      'ssYYo.',
      'oosYo.',
      '..oso.',
      '...o..'
    ]);
    // loose golden feathers
    const fe = (x,y)=>S(g,x,y,['..yy','.yyt','yyt.','t...']);
    fe(5,36); fe(58,38+(tw===1?1:0)); fe(15,41+(tw===2?1:0));
    // twinkles on the wing rim
    const sp = [[19,12],[50,13],[7,9]];
    for (let i = 0; i < sp.length; i++) if (i!==tw) spark(g,C.wh,sp[i][0],sp[i][1]);
  };

  // ======================================================== NEUTRO (C)
  // 21. Vira-lata Caramelo
  CARD_ART['vira-lata-caramelo'] = function(g,t){
    bgCeleiro(g,0);
    const wg = fl(t/0.2)%2, et = (t%2) > 1.75 ? 1 : 0;
    E(g,C.wo,32,43.5,15,1.6);
    // tail wagging on the right
    const tl = wg ? tubeF([42,40, 47,37, 50,32],1.5) : tubeF([42,40, 48,39, 52,35],1.5);
    F(g,C.ol,39,29,55,43,dil(tl)); F(g,C.or,40,30,54,42,tl); F(g,C.st,40,30,54,42,(x,y)=>tl(x,y)&&!tl(x-1,y-1));
    // haunches + body
    const bd = any(eF(32,34,9.5,8), eF(23,38.5,5.5,4.6), eF(41,38.5,5.5,4.6));
    body(g,bd,[15,25,49,44],C.or,C.wo,C.st,C.ol,2);
    // hind paws at the sides
    S(g,17,40,['.occco','occccco','.ooooo.']); S(g,40,40,['occco.','ocwccco','.ooooo.']);
    // cream chest bib
    F(g,C.cr,15,25,49,44,(x,y)=>bd(x,y)&&inE(x,y,32,31,4.6,7.5));
    // front legs + paws
    for (const x of [26,35]) { R(g,C.wo,x-1,33,1,7); R(g,C.or,x,33,4,7); R(g,C.wo,x+3,33,1,7); R(g,C.st,x,33,1,5); }
    S(g,24,39,['.occco...occco.','occccco.occwcco','occccco.occccco','.ooooo...ooooo.']);
    R(g,C.ol,27,41,1,1); R(g,C.ol,29,41,1,1); R(g,C.ol,35,41,1,1); R(g,C.ol,37,41,1,1);
    // head (big and round)
    const hd = any(eF(32,16.5,9,7.2), eF(32,21.5,6,4.2));
    body(g,hd,[21,8,43,27],C.or,C.wo,C.st,C.ol,2);
    // cream blaze + muzzle
    R(g,C.cr,31,10,2,4);
    F(g,C.cr,21,8,43,27,(x,y)=>hd(x,y)&&inE(x,y,32,21.5,5.2,3.6));
    // eyes + cream eyebrow dots
    eye(g,27,14,2,3); eye(g,35,14,2,3);
    R(g,C.cr,27,12,2,1); R(g,C.cr,35,12,2,1);
    // nose + happy open mouth, tongue out
    S(g,30,18,['.ooo.','oWooo','.ooo.']);
    S(g,28,21,[
      'o.....o',
      '.ooooo.',
      '..oppo.',
      '...ppo.',
      '...oo..'
    ]);
    P(g,C.rd,32,23);
    R(g,C.pk,24,19,2,1); R(g,C.pk,38,19,2,1);
    // floppy ears hanging at the sides of the face (the right one twitches up now and then)
    S(g,19,9,[
      '.oooo..',
      'owwwwo.',
      'owwwwwo',
      'owdwwwo',
      'owdwwo.',
      '.odwwo.',
      '.odwo..',
      '..oo...'
    ]);
    S(g,38,9-et,(et?[
      '..oooo.',
      '.owwwwo',
      'owwwwwo',
      'owwwdwo',
      '.owwdo.',
      '..owo..',
      '...o...'
    ]:[
      '..oooo.',
      '.owwwwo',
      'owwwwwo',
      'owwwdwo',
      '.owwdwo',
      '.owwdo.',
      '..owdo.',
      '...oo..'
    ]));
    R(g,C.st,21,10,3,1); R(g,C.st,40,10-et,3,1);
    // red bandana collar
    S(g,23,25,[
      'ooooooooooooooooooo',
      'orrrrrrrrrrrrrrrrno',
      '.onrrrWrrrrrWrrrno.',
      '..onrrrrrWrrrrrno..',
      '....onrrrrrrrrno...',
      '......onrrWrno.....',
      '........onno.......',
      '.........oo........'
    ]);
  };

  // 23. Trator Vermelho (construção)
  CARD_ART['trator-vermelho'] = function(g,t){
    bgCeleiro(g,0);
    const ph = fl(t*4)%3, hl = (t%2.2) > 1.95;
    E(g,C.wo,31,43.5,22,1.5);
    // exhaust pipe + puffs (rise and fade over 3 frames)
    R(g,C.ol,21,9,4,15); R(g,C.gy,22,10,2,14); R(g,C.lg,22,10,1,14); R(g,C.ol,20,8,6,2); R(g,C.sd,21,8,4,1);
    for (let k = 0; k < 2; k++) {
      const f = (ph+k)%3, x = 21+k*2+f, y = 5-f*2-k*3;
      if (f===0) S(g,x,y,['.WW.','WWWL','.WLL']);
      else if (f===1) S(g,x,y,['.LL','LWL','.L.']);
      else { P(g,C.lg,x,y); P(g,C.lg,x+2,y+1); }
    }
    // seat + steering wheel
    S(g,35,13,[
      'oooo...',
      'owdo...',
      'owdo...',
      'owdooooo',
      'odddddddo',
      '.oooooooo',
      '.....oo..'
    ]);
    LN(g,C.ol,31,20,33,15);
    S(g,29,13,['..ooooo','ooooo..']);
    // rear fender (round) over the big wheel
    const fd = (x,y)=>inE(x,y,44,32,13,13)&&!inE(x,y,44,32,10.5,10.5)&&y<=31;
    F(g,C.ol,29,17,59,32,dil(fd));
    F(g,C.rd,30,18,58,31,fd);
    F(g,C.or,30,18,58,31,(x,y)=>fd(x,y)&&!fd(x-1,y-1)&&x<46);
    F(g,C.wn,30,18,58,31,(x,y)=>fd(x,y)&&!fd(x,y+1));
    // big rear tyre
    const tr = eF(44,32,10.2,10.2);
    F(g,C.ol,33,21,55,43,tr);
    F(g,C.sd,33,21,55,43,(x,y)=>inE(x,y,44,32,9,9)&&!inE(x,y,44,32,6.5,6.5));
    for (let k = 0; k < 12; k++) { const a = k*Math.PI/6, x = Math.round(44+8.2*Math.cos(a)-0.5), y = Math.round(32+8.2*Math.sin(a)-0.5); P(g,C.wd,x,y); }
    const rm = eF(44,32,5.5,5.5);
    F(g,C.rd,37,25,51,39,rm); F(g,C.wn,37,25,51,39,(x,y)=>rm(x,y)&&!rm(x+2,y+2)); F(g,C.or,37,25,51,39,(x,y)=>rm(x,y)&&!rm(x-1,y-1));
    S(g,42,30,['.oo.','oLYo','oYYo','.oo.']);
    // hood + engine
    const hb = pF([9,25, 12,21, 33,20, 36,23, 36,33, 10,33, 9,31]);
    F(g,C.ol,7,19,38,35,dil(hb));
    F(g,C.rd,8,20,37,34,hb);
    F(g,C.or,8,20,37,34,(x,y)=>hb(x,y)&&!hb(x,y-1));
    F(g,C.or,8,20,37,34,(x,y)=>hb(x,y)&&!hb(x,y-2)&&hb(x,y-1)&&x<30);
    F(g,C.wn,8,20,37,34,(x,y)=>hb(x,y)&&!hb(x,y+2));
    for (const x of [24,27,30]) R(g,C.wn,x,25,1,4);
    R(g,C.yl,13,24,10,1);
    // grille + headlight
    S(g,7,22,['.oo','oYo','oLo','oYo','oLo','oYo','oLo','oYo','.oo']);
    S(g,11,20,['.ooo.','occWo','occco','.ooo.']);
    if (hl) spark(g,C.wh,13,21,true);
    // engine block under the hood
    R(g,C.ol,18,33,14,6); R(g,C.gy,19,33,12,5); R(g,C.lg,19,33,12,1); R(g,C.sd,22,35,1,3); R(g,C.sd,26,35,1,3);
    // small front tyre
    const ft = eF(15,37,5.6,5.6);
    F(g,C.ol,8,30,22,44,ft);
    F(g,C.sd,8,30,22,44,(x,y)=>inE(x,y,15,37,4.6,4.6)&&!inE(x,y,15,37,3,3));
    F(g,C.rd,8,30,22,44,eF(15,37,2.6,2.6)); P(g,C.or,14,36); P(g,C.ol,15,37);
    P(g,C.wd,11,34); P(g,C.wd,19,34); P(g,C.wd,11,40); P(g,C.wd,19,40);
    // straw on the floor in front
    R(g,C.yl,4,44,4,1); R(g,C.yl,24,44,3,1); R(g,C.yl,56,43,3,1);
  };

  // 24. Sanfoneiro do Forró
  CARD_ART['sanfoneiro-do-forro'] = function(g,t){
    bgCeleiro(g,0);
    flags(g,20,47,1,1);
    const bw = fl(t/0.3)%2, ns = fl(t*5)%12, bl = (t%3.3) > 3.12;
    // shoulders in a checkered shirt (3px checks, one rect each)
    const ts = pF([12,48, 14,35, 23,29, 41,29, 50,35, 52,48]);
    F(g,C.ol,10,27,54,48,dil(ts));
    F(g,C.cr,11,28,53,48,ts);
    for (let y = 30; y < 48; y += 3) for (let x = 12 + (((y-30)/3)%2)*3; x < 53; x += 6) {
      if (ts(x,y) && ts(x+2,y+2)) R(g,C.rd,x,y,3,3);
      else if (ts(x+1,y+1)) R(g,C.rd,x+1,y+1,1,1);
    }
    // neck + collar
    R(g,C.ol,28,26,8,4); R(g,C.st,29,26,6,4); R(g,C.wo,33,26,2,4);
    S(g,26,28,['oo....oo','occo.oco','.ocooco.','..oo.o..']);
    // accordion held wide (bellows breathe 1px)
    const L0 = 10-bw, R0 = 44+bw, top = 31, bot = 45;
    R(g,C.ol,L0+10,top,R0-L0-10,bot-top+1);
    for (let x = L0+11; x < R0-1; x += 3) { R(g,C.rd,x,top+1,2,bot-top-1); P(g,C.or,x,top+1); R(g,C.wn,x+1,bot-3,1,2); P(g,C.ol,x,top+1+((x>>1)&1)*0); }
    for (let x = L0+11; x < R0-1; x += 6) { P(g,C.ol,x,top+1); P(g,C.ol,x+1,bot-1); }
    // left box: keyboard
    R(g,C.ol,L0,29,11,18); R(g,C.rd,L0+1,30,9,16); R(g,C.or,L0+1,30,9,1); R(g,C.wn,L0+1,45,9,1); R(g,C.wn,L0+9,31,1,14);
    R(g,C.ol,L0+2,31,5,14); R(g,C.wh,L0+3,31,3,14);
    for (let y = 33; y < 45; y += 2) R(g,C.ol,L0+3,y,2,1);
    P(g,C.yl,L0+8,32); P(g,C.yl,L0+8,43);
    // right box: bass buttons
    R(g,C.ol,R0,29,10,18); R(g,C.rd,R0+1,30,8,16); R(g,C.or,R0+1,30,8,1); R(g,C.wn,R0+1,45,8,1); R(g,C.wn,R0+8,31,1,14);
    for (let y = 32; y < 44; y += 3) { P(g,C.cr,R0+3,y); P(g,C.cr,R0+5,y+1); }
    // hands
    S(g,L0+6,34,['.oo.','ottw','ottw','.oo.']);
    S(g,R0+5,36,['.oo.','owto','owto','.oo.']);
    // head
    S(g,23,19,['oo','oto','.oo']); S(g,40,19,['.oo','oto','oo.']);
    const hd = eF(32,21.5,7.4,7.4);
    F(g,C.ol,23,13,42,30,dil(hd));
    F(g,C.st,24,14,41,29,hd);
    F(g,C.wo,24,14,41,29,(x,y)=>hd(x,y)&&!hd(x+2,y+1));
    // happy eyes, rosy cheeks, big moustache and grin
    if (bl) { R(g,C.ol,27,20,3,1); R(g,C.ol,35,20,3,1); }
    else { eye(g,27,18,2,3); eye(g,35,18,2,3); }
    R(g,C.ol,26,17,3,1); R(g,C.ol,35,17,3,1);
    R(g,C.pk,25,22,2,1); R(g,C.pk,38,22,2,1);
    P(g,C.wo,32,21); P(g,C.wo,31,22);
    S(g,25,23,[
      '...oooo.oooo...',
      '.oossssosssso..',
      'osssoo...oossso',
      'oo...oWWWo...oo',
      '......ooo......'
    ]);
    // leather hat: the front brim turned up like a half moon, stitched, with a star
    S(g,19,6,[
      '..........oooooo..........',
      '.......ooowwwwwwooo.......',
      '.....oowwwwwwwwwwwwoo.....',
      '....owwtwwwwwyywwwwwtwo...',
      '...owwtwwwwwyyyywwwwwtwo..',
      '..owwtwwwyyyyyyyyyywwwtwo.',
      '.owwtwwwwwwyyyyyywwwwwwtwo',
      '.owtwwwwwwwyyooyywwwwwwwto',
      'owwtwwwddooooooooooddwwwto',
      'owtwwdoo..........oodwwtwo',
      'oowwdo..............odwwoo',
      '.oooo................oooo.'
    ]);
    // musical notes floating up (loop)
    const nt = [[6,0,C.yl],[53,4,C.li],[14,8,C.li],[56,10,C.yl]];
    for (const n of nt) {
      const k = (ns + n[1]) % 12, y = 27 - k, x = n[0] + ((k>>2)&1);
      if (y < 11 && (n[0] < 20 || n[0] > 47)) continue;
      note(g,n[2],x,y);
    }
  };

  // T1. Filhote (ficha)
  CARD_ART['filhote'] = function(g,t){
    bgMilho(g,0);
    const dy = (t%0.8) > 0.62 ? -1 : 0;
    // corn stubble (cut dry stalks)
    for (const s0 of [[7,36,5],[14,40,4],[52,37,5],[57,41,3],[47,43,3],[4,43,3],[20,44,2]]) {
      const x = s0[0], y = s0[1], h = s0[2];
      R(g,C.wd,x-1,y,1,h); R(g,C.st,x,y,2,h); R(g,C.wo,x+1,y+1,1,h-1); R(g,C.cr,x,y,2,1); P(g,C.wd,x+1,y);
      P(g,C.gr,x+2,y+h-2); P(g,C.gd,x+2,y+h-1);
    }
    E(g,C.wd,31,43.6,10,1.3);
    // little feet
    S(g,25,40,['..OO....OO.','.OOOO..OOOO','.O.O...O.O.']);
    const by = dy;
    // body + big head (quail chick: straw fluff, cream belly)
    const bd = (x,y)=>inE(x,y-by,29.5,35.5,8.6,6.4);
    const hd = (x,y)=>inE(x,y-by,35,27,6.8,6.2);
    const ch = any(bd,hd);
    F(g,C.ol,19,19,44,43,dil(ch));
    F(g,C.st,20,20,43,42,ch);
    F(g,C.wo,20,20,43,42,(x,y)=>ch(x,y)&&!ch(x+1,y+1));
    F(g,C.cr,20,20,43,42,(x,y)=>ch(x,y)&&!ch(x-1,y-1));
    F(g,C.cr,20,20,43,42,(x,y)=>(bd(x,y)&&inE(x,y-by,32.5,37.5,5,3.2))||(hd(x,y)&&inE(x,y-by,38,29,3.4,2.6)));
    P(g,C.wh,30,21+by);
    // fluffy tail tuft + wing nub
    S(g,18,32+by,['oo.','oto','.oo']);
    S(g,23,33+by,['.ooo.','ottto','.otto','..oo.']);
    // dark back stripes running from the crown
    LN(g,C.wd,33,21+by,29,27+by); LN(g,C.wd,28,28+by,22,32+by);
    LN(g,C.wd,36,21+by,33,25+by);
    // eye stripe, big eye, determined little brow (fúria), beak, cheek
    R(g,C.wd,32,27+by,3,1);
    eye(g,36,25+by,2,3);
    R(g,C.ol,35,23+by,2,1); P(g,C.ol,37,24+by);
    R(g,C.pk,36,29+by,2,1);
    S(g,41,26+by,['oo.','OOo','Oo.']);
    // fluff on the crown
    S(g,34,19+by,['o.o','.o.']);
    // fúria spark
    const sp = fl(t*4)%2;
    if (sp) spark(g,C.yl,45,21,true); else spark(g,C.yl,45,21);
    P(g,C.or,43,23); P(g,C.yl,48,25);
  };

  // ======================================================== RETRATO (C)
  // Zeca Pamonheiro: face kept inside the 40x40 hero-row crop (x 12-51, y 4-43).
  CARD_ART['rival-zeca'] = function(g,t){
    bgMilho(g,0,{gap:[42,63]});
    const bl = (t%3.5) > 3.33, st = fl(t/0.2)%6;
    // the road and the far field behind the cart
    R(g,C.gd,42,17,22,17); R(g,C.gr,42,17,22,1); for (let x = 43; x < 64; x += 4) R(g,C.gr,x,19+(x%3),1,4);
    R(g,C.st,0,36,64,12); R(g,C.wo,0,36,64,1); R(g,C.wo,0,46,64,2);
    for (let i = 0; i < 7; i++) R(g,C.wo,(i*11+hs(i,3)%6)%60,38+(i*5)%7,3,1);
    // pamonha cart with a striped umbrella
    R(g,C.ol,53,6,2,18); R(g,C.wd,53,6,1,18);
    const um = (x,y)=>inE(x,y,54,11.5,11,7)&&y<=11;
    F(g,C.ol,42,3,63,12,dil(um));
    F(g,C.cr,43,4,63,11,(x,y)=>um(x,y));
    F(g,C.rd,43,4,63,11,(x,y)=>um(x,y)&&fl((x-54)/3+20)%2===0);
    F(g,C.wn,43,4,63,11,(x,y)=>um(x,y)&&!um(x,y+1)&&fl((x-54)/3+20)%2===0);
    R(g,C.ol,45,22,18,13); R(g,C.wo,46,23,17,11); R(g,C.st,46,23,17,1); R(g,C.wd,46,32,17,1);
    R(g,C.yl,48,25,13,5); R(g,C.or,48,29,13,1); for (let x = 50; x < 61; x += 4) R(g,C.gr,x,26,2,3);
    const wh = eF(55,36,4.6,4.6);
    F(g,C.ol,49,30,61,42,wh); F(g,C.wo,49,30,61,42,(x,y)=>inE(x,y,55,36,3.4,3.4)); R(g,C.wd,55,33,1,7); R(g,C.wd,52,36,7,1); P(g,C.ol,55,36);
    // shirt + corn-yellow apron
    const sh = pF([10,48, 13,39, 22,34, 40,34, 48,39, 51,48]);
    F(g,C.ol,8,32,53,48,dil(sh));
    F(g,C.sd,9,33,52,48,sh);
    F(g,C.wd,9,33,52,48,(x,y)=>sh(x,y)&&!sh(x-1,y-1));
    PG(g,C.ol,[23,37, 39,37, 40,48, 22,48]);
    PG(g,C.yl,[24,38, 38,38, 39,48, 23,48]);
    R(g,C.or,37,39,1,9); R(g,C.cr,24,38,1,10);
    R(g,C.ol,24,35,2,3); R(g,C.ol,36,35,2,3); R(g,C.yl,24,34,1,3); R(g,C.yl,37,34,1,3);
    S(g,27,41,['oooooooo','owwwwwwo','owgggywo','owwwwwwo','oooooooo']);
    // skinny neck
    R(g,C.ol,27,29,8,7); R(g,C.st,28,29,6,7); R(g,C.wo,32,29,2,7);
    // raised arm (rolled-up sleeve) holding a steaming pamonha
    const fa = tubeF([13,36, 14,28],1.7), sl = tubeF([21,39, 13,36],2.6);
    F(g,C.ol,9,25,24,43,dil(fa)); F(g,C.st,10,26,23,42,fa); F(g,C.wo,10,26,23,42,(x,y)=>fa(x,y)&&!fa(x+1,y));
    F(g,C.ol,9,32,25,43,dil(sl)); F(g,C.sd,10,33,24,42,sl); F(g,C.wd,10,33,24,42,(x,y)=>sl(x,y)&&!sl(x,y-1));
    R(g,C.cr,11,34,3,1);
    S(g,11,25,['.oooo.','ottttwo','ottttwo','.oooo.']);
    S(g,8,19,[
      '..ooooooooo..',
      '.olllggggggo.',
      'ogllyyyyylggo',
      'oggtyyyyytggo',
      'ogggggtggggo.',
      '.ooooooooooo.'
    ]);
    // steam curls rising into the sky (loop)
    for (let k = 0; k < 3; k++) {
      const y = 11 - ((st + k*2) % 6) - (k===1?2:0), x = 9 + k*4;
      S(g,x,y, ((st+k)&1) ? ['..W','.Wc','.c.','Wc.','c..'] : ['.W.','Wc.','.c.','.Wc','..c']);
    }
    // head (narrow), ears, hair tufts
    S(g,23,20,['oo','oto','.oo']); S(g,38,20,['.oo','oto','oo.']);
    const hd = eF(31,22.5,6.8,8);
    F(g,C.ol,23,13,40,32,dil(hd));
    F(g,C.st,24,14,39,31,hd);
    F(g,C.wo,24,14,39,31,(x,y)=>hd(x,y)&&!hd(x+2,y+1));
    S(g,24,15,['wdw.........dwd','dw...........wd','w.............w']);
    // face: blinking eyes, freckles, big gap-tooth grin
    if (bl) { R(g,C.ol,27,21,3,1); R(g,C.ol,33,21,3,1); }
    else { eye(g,27,19,2,3); eye(g,34,19,2,3); }
    R(g,C.ol,26,17,3,1); R(g,C.ol,34,17,3,1);
    P(g,C.wo,26,23); P(g,C.wo,28,24); P(g,C.wo,25,24); P(g,C.wo,35,23); P(g,C.wo,37,24); P(g,C.wo,34,24);
    R(g,C.pk,25,25,2,1); R(g,C.pk,36,25,2,1);
    P(g,C.wo,31,22); P(g,C.wo,31,23);
    S(g,27,25,[
      'o.......o',
      '.ooooooo.',
      '.oWWoWWo.',
      '..orrro..',
      '...ooo...'
    ]);
    // straw hat with a wood-brown band
    S(g,17,4,[
      '.........oooooooooo.........',
      '........oyyyyyyyyyto........',
      '.......oyytyyyyyyytto.......',
      '.......oyyyyyytyyytto.......',
      '.......oyyyyyyyyyyttwo......',
      '.......owwwwwwwwwwwwwo......',
      '...oooooooooooooooooooooo...',
      '.ootyyyyyyytyyyyyyyyyytttoo.',
      'ottttttttttttttttttttttttwwo',
      '.ooowwwwwwwwwwwwwwwwwwwwooo.',
      '....oooooooooooooooooooo....'
    ]);
    R(g,C.wd,24,9,14,1);
  };
})();
