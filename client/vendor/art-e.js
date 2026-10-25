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
  // tapered quadratic-bezier blade (leaf / horn / tail): width w0 at start -> w1 at end
  function bezF(x0,y0,x1,y1,x2,y2,w0,w1,n){
    n = n||22; const Q = [];
    for (let i = 0; i <= n; i++) { const u=i/n, a=(1-u)*(1-u), b=2*u*(1-u), c=u*u; const w=w0+(w1-w0)*u; Q.push([a*x0+b*x1+c*x2, a*y0+b*y1+c*y2, w*w]); }
    return (x,y)=>{ const px=x+0.5, py=y+0.5; for (const s of Q) { const dx=px-s[0], dy=py-s[1]; if (dx*dx+dy*dy<=s[2]) return true; } return false; };
  }
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
  // horizontal line of a sagging string from x0 to x1 (runs merged); returns y(x)
  function cord(g,c,x0,x1,y0,sag){
    const yy = x=>Math.round(y0 + sag*4*((x-x0)/(x1-x0))*(1-(x-x0)/(x1-x0)));
    let s = x0, cy = yy(x0);
    for (let x = x0+1; x <= x1+1; x++) { const y = x<=x1 ? yy(x) : -99; if (y !== cy) { R(g,c,s,cy,x-s,1); s = x; cy = y; } }
    return yy;
  }
  // bandeirinhas: 3px pennants hanging from a sagging cord
  function bandeirinhas(g,x0,x1,y0,sag,step,cols,cordC){
    const yy = cord(g,cordC||C.st,x0,x1,y0,sag);
    let i = 0;
    for (let x = x0+1; x+2 <= x1; x += step, i++) {
      const c = cols[i%cols.length], y = yy(x+1)+1;
      R(g,c,x,y,3,2); P(g,c,x+1,y+2);
    }
  }

  // ---------------------------------------------------------------- terrains (same recipes as art-b)
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

  // Pasto: v 0 dia, 1 escuro (feitiço), 2 tempestade, 3 nascer do sol, 4 entardecer, 5 noite de festa
  const hillY = (x,s)=>20 + Math.round(3*Math.sin((x+(s||0))/10));
  function bgPasto(g,v,o){
    o = o||{};
    const dk = v===1, sm = v===2, su = v===3, ev = v===4, fe = v===5;
    if (su) { R(g,C.or,0,0,64,7); R(g,C.yl,0,7,64,6); R(g,C.cr,0,13,64,11); }
    else if (ev) {
      R(g,C.pu,0,0,64,6); R(g,C.or,0,6,64,8); R(g,C.cr,0,14,64,10);
      for (let x = 0; x < 64; x += 4) { R(g,C.pu,x+2,6,2,1); R(g,C.or,x,14,2,1); }
    }
    else if (fe) {
      R(g,C.nt,0,0,64,9); R(g,C.pu,0,9,64,15);
      for (let x = 0; x < 64; x += 2) { P(g,C.nt,x,9); P(g,C.li,x+1,17); P(g,C.li,x,18); }
      R(g,C.li,0,19,64,5);
    }
    else if (sm) { R(g,C.nt,0,0,64,8); R(g,C.gy,0,8,64,16); }
    else if (dk) { R(g,C.nt,0,0,64,8); R(g,C.bl,0,8,64,16); }
    else { R(g,C.bl,0,0,64,8); R(g,C.sk,0,8,64,16); }
    if (!o.noClouds && !su && !sm && !ev && !fe) {
      const c1 = o.c1||[5,5], c2 = o.c2||[47,11];
      cloud(g,c1[0],c1[1],dk?C.lg:C.wh,dk?C.gy:C.lg);
      cloud(g,c2[0],c2[1],dk?C.lg:C.wh,dk?C.gy:C.lg);
    }
    const s = o.hs||0, hill = sm?C.gd:C.gr, crest = sm?C.gr:C.lm;
    if (!o.noHill) {
      F(g,hill,0,16,63,24,(x,y)=>y>=hillY(x,s));
      R(g,hill,0,24,64,24);
      F(g,crest,0,16,63,24,(x,y)=>y===hillY(x,s));
      if (!o.noTufts) for (let i = 0; i < 14; i++) { const x = (i*13+hs(i,3)%7)%61+1, y = 33+(i*7+hs(i,5)%5)%13; R(g, sm?C.td:C.gd, x, y, 1, 2); P(g, sm?C.gr:C.lm, x+1, y+1); }
    }
    if (!o.noFence) {
      const pc = sm?C.wd:C.wo, ps = sm?C.sd:C.wd;
      R(g,ps,0,25,64,1); R(g,ps,0,28,64,1);
      for (let x = 4; x < 64; x += 10) { R(g,pc,x,24,1,8); R(g,ps,x+1,24,1,8); }
    }
  }

  // ======================================================== BREJO
  // 11. Perereca Grudenta
  const pad = (g,x,y)=>{ S(g,x-1,y-1,['.oo.','oyyo','oyyo','.oo.']); P(g,C.cr,x,y); };
  CARD_ART['perereca-grudenta'] = function(g,t){
    bgBrejo(g,0);
    const ext = fl(t/0.4)%2 === 0, wg = fl(t*8)%2;
    // ripples around the stem base
    F(g,C.tq,12,41,32,47,ringF(21.5,44.5,6,1.8,1));
    R(g,C.sk,17,45,2,1);
    // cattail stem + head
    const stem = tubeF([21,47, 22,30, 23.5,13],1.3);
    F(g,C.ol,17,10,28,47,dil(stem));
    F(g,C.gd,17,10,28,47,stem);
    F(g,C.gr,17,10,28,47,(x,y)=>stem(x,y)&&!stem(x-1,y));
    R(g,C.ol,23,0,3,4); R(g,C.gd,24,0,1,4);
    body(g,eF(24.5,8.5,2.6,5.4),[20,2,29,15],C.wo,C.wd,C.st,C.ol,1);
    P(g,C.wd,23,6); P(g,C.wd,25,10);
    // far back leg (tucked, right)
    const fb = eF(36.5,37.5,3.4,4);
    body(g,fb,[31,32,42,43],C.gr,C.gd,null,C.ol,1);
    // frog body + head + eye bumps
    const fr = any(eF(31,31.5,6.6,8), eF(33.5,22,8,5.6), eF(28.6,17,3.4,3.3), eF(38,16.8,3.8,3.6));
    body(g,fr,[23,11,43,41],C.lm,C.gr,null,C.ol,2);
    F(g,C.gd,23,11,43,41,(x,y)=>fr(x,y)&&!fr(x+1,y+3)&&y>27);
    F(g,C.cr,23,11,43,41,(x,y)=>fr(x,y)&&!fr(x-1,y-1)&&!fr(x,y-2)&&y<22);
    // back leg near: folded thigh + foot on the stem
    const th = eF(28,38,4.6,3.4);
    body(g,th,[22,33,34,43],C.lm,C.gr,null,C.ol,1);
    LN(g,C.ol,25,41,21,42); LN(g,C.gr,25,42,21,42);
    for (const p of [[18,40],[18,43],[21,44]]) pad(g,p[0],p[1]);
    // front arm reaching the stem
    const arm = tubeF([28,27, 23.5,26],1.2);
    F(g,C.ol,20,23,31,30,dil(arm)); F(g,C.lm,20,23,31,30,arm); F(g,C.gr,20,23,31,30,(x,y)=>arm(x,y)&&!arm(x,y+1));
    for (const p of [[19,23],[19,26],[22,28]]) pad(g,p[0],p[1]);
    // near-side little hand on the chest
    for (const p of [[34,29],[36,30]]) pad(g,p[0],p[1]);
    // eyes: red with black pupils
    for (const e of [[28.6,17,2.3,27,16],[38,16.8,2.6,37,16]]) {
      F(g,C.rd,e[0]-4,e[1]-4,e[0]+4,e[1]+4,eF(e[0],e[1],e[2],e[2]));
      R(g,C.ol,e[3]+1,e[4],2,2); P(g,C.wh,e[3],e[4]-1);
      P(g,C.wn,e[3]+2,e[4]+2);
    }
    // smile
    R(g,C.ol,28,25,11,1); P(g,C.ol,27,24); P(g,C.ol,39,24); P(g,C.ol,40,23);
    // tongue + gnat
    if (ext) {
      LN(g,C.pk,40,23,50,19); LN(g,C.wn,41,24,50,20);
      S(g,49,17,['.ppp.','ppppp','pnpp.']);
      R(g,C.ol,51,17,2,2); P(g,C.lg,50,16); P(g,C.lg,53,16);
    } else {
      R(g,C.pk,40,23,2,1); P(g,C.wn,41,24);
      R(g,C.ol,53,15,2,1);
      if (wg) { P(g,C.lg,52,14); P(g,C.lg,55,14); } else { P(g,C.lg,53,14); P(g,C.lg,54,14); }
    }
  };

  // 13. Sapo-Cururu
  CARD_ART['sapo-cururu'] = function(g,t){
    bgBrejo(g,3,{sparse:true});
    const pf = (t%1.5) >= 1.0, tw = fl(t*5)%2;
    // tadpole in the water (right)
    R(g,C.tq,49,44,9,1);
    S(g,51,39,['.GG.....','GggGq...','GgoGqq.q','.GG..qq.'].map(r=>r));
    if (tw) P(g,C.tq,58,40); else P(g,C.tq,58,42);
    // muddy bank
    const bank = any(eF(28,48,29,9.5), eF(6,44,8,5));
    body(g,bank,[0,36,60,47],C.wd,C.sd,C.wo,C.ol,2);
    for (const p of [[8,44],[47,45],[20,46]]) { R(g,C.sd,p[0],p[1],4,1); }
    for (const p of [[4,41],[52,42]]) { R(g,C.gr,p[0],p[1],1,2); P(g,C.lm,p[0]+1,p[1]); }
    // toad body
    const tb = any(eF(32,36,15.5,7.6), eF(32,28,12.8,7), eF(24.5,22,4.4,4.2), eF(39.5,22,4.4,4.2), eF(19,27,3.8,3.2), eF(45,27,3.8,3.2));
    body(g,tb,[13,15,51,45],C.wo,C.wd,C.st,C.ol,2);
    // belly
    F(g,C.st,22,32,42,45,(x,y)=>tb(x,y)&&inE(x,y,32,39,9,5));
    F(g,C.cr,22,32,42,45,(x,y)=>inE(x,y,30.5,38,4,2));
    // warts
    for (const w of [[19,31],[22,25],[29,23],[34,23],[42,25],[45,31],[17,36],[47,36],[25,29],[39,29]]) { R(g,C.sd,w[0],w[1],2,2); P(g,C.st,w[0],w[1]); }
    // legs + toes
    S(g,17,40,['.oooo..','owwwwo.','owotwto','.ooooo.']);
    S(g,40,40,['..oooo.','.owwwwo','otwtowo','.ooooo.']);
    // throat sac
    if (pf) {
      const sac = eF(32,35.5,7,4.6);
      F(g,C.ol,23,30,41,41,(x,y)=>dil(sac)(x,y)&&!sac(x,y)&&y>31);
      F(g,C.cr,23,30,41,41,(x,y)=>sac(x,y)&&y>31);
      F(g,C.st,23,30,41,41,(x,y)=>sac(x,y)&&y>31&&!sac(x+2,y+2));
      R(g,C.wh,28,33,2,1);
      // a little note floats up
      S(g,49,20,['..cc','..c.','..c.','cc..','cc..']);
    }
    // wide smile
    R(g,C.ol,24,31,17,1); R(g,C.ol,21,30,3,1); R(g,C.ol,41,30,3,1); P(g,C.ol,20,29); P(g,C.ol,44,29);
    R(g,C.wd,25,32,15,1);
    // heavy-lidded golden eyes
    for (const ex of [22,37]) S(g,ex,20,['.ddd.','ooooo','yyWoy','yyooy','.yyy.']);
    // fireflies
    flies(g,t,[[6,22],[58,18],[11,30],[60,28],[44,12]]);
  };

  // 14. Cágado Ranzinza (rara)
  CARD_ART['cagado-ranzinza'] = function(g,t){
    bgBrejo(g,0);
    const ph = t%3, bl = ph > 2.82, tw = (ph > 1.2 && ph < 1.5) ? -1 : 0;
    // mossy rock at the water's edge
    R(g,C.tq,4,44,7,1); R(g,C.tq,54,45,8,1); R(g,C.sk,58,43,2,1);
    const rk = any(eF(34,45,25,6.5), eF(21,41,10,5), eF(46,41,12,5.5));
    body(g,rk,[8,34,60,47],C.gy,C.sd,C.lg,C.ol,2);
    F(g,C.gd,8,34,60,47,(x,y)=>rk(x,y)&&!rk(x,y-2)&&(x<17||x>50||(x>29&&x<34)));
    for (const p of [[11,37],[52,37],[31,39]]) P(g,C.lm,p[0],p[1]);
    LN(g,C.sd,20,44,23,47); LN(g,C.sd,44,43,46,47);
    // stubby scaly legs with claws
    for (const L of [[25,35],[47,35]]) {
      const lf = any(eF(L[0],L[1],3.4,4.2), eF(L[0]-1.5,L[1]+3.2,3.6,1.8));
      body(g,lf,[L[0]-7,L[1]-6,L[0]+5,L[1]+6],C.gy,C.gd,C.lg,C.ol,1);
      P(g,C.gd,L[0]-1,L[1]-1); P(g,C.gd,L[0]+1,L[1]+1);
      S(g,L[0]-5,L[1]+4,['c.c.c']);
    }
    // tail
    S(g,52,32,['oo..','oYoo','.ooo']);
    // shell: high dome + rim
    const dome = (x,y)=>inE(x,y,37,31.5,15.5,15) && y<=31;
    const rim = eF(37,32,17,2.8);
    const sh = any(dome,rim);
    F(g,C.ol,19,15,55,36,dil(sh));
    F(g,C.wo,19,15,55,36,sh);
    // plates (voronoi of hex-ish centres)
    const pc = [[37,19.5],[29,23.5],[45,23.5],[37,27.5],[23.5,29],[50.5,29]];
    const pl = (x,y)=>{ let d1=1e9,d2=1e9,k=-1; for (let i = 0; i < pc.length; i++) { const dx=x+0.5-pc[i][0], dy=(y+0.5-pc[i][1])*1.25, d=Math.sqrt(dx*dx+dy*dy); if (d<d1) { d2=d1; d1=d; k=i; } else if (d<d2) d2=d; } return [d1,d2,k]; };
    F(g,C.sd,19,15,55,32,(x,y)=>dome(x,y)&&!inE(x,y,37,31.5,14,13.5)?false:dome(x,y)&&(pl(x,y)[1]-pl(x,y)[0])<1.1);
    F(g,C.st,19,15,55,32,(x,y)=>{ if(!dome(x,y)||!inE(x,y,37,31.5,14,13.5)) return false; const p=pl(x,y); return p[1]-p[0]>=2.2; });
    F(g,C.cr,19,15,55,32,(x,y)=>{ if(!dome(x,y)||!inE(x,y,37,31.5,14,13.5)) return false; const p=pl(x,y); if(p[1]-p[0]<2.2) return false; const c=pc[p[2]]; return (x+0.5-c[0])+(y+0.5-c[1])< -3.2; });
    F(g,C.wd,19,15,55,36,(x,y)=>sh(x,y)&&!sh(x+2,y+2));
    // rim scutes
    F(g,C.wd,19,29,55,35,(x,y)=>rim(x,y)&&y>=31);
    for (let x = 22; x < 54; x += 4) R(g,C.sd,x,31,1,3);
    R(g,C.st,21,31,32,1);
    // moss tufts on the dome
    S(g,30,15,['..l..l','.lggll','GGGGGG']);
    S(g,41,17,['.l.l','lggl','GGGG']);
    P(g,C.lm,48,22); P(g,C.gr,49,23);
    // neck + head (facing left)
    const nk = tubeF([26,31, 17,28],3.3);
    const hd = any(eF(12.5,24,7.6,6.4), eF(6.5,26.8,3.8,3), nk);
    body(g,hd,[1,16,31,36],C.gy,C.gd,null,C.ol,1);
    // lower jaw in shade + long grumpy mouth line
    F(g,C.gd,1,16,31,36,(x,y)=>hd(x,y)&&y>=29&&x<19);
    R(g,C.ol,4,28,11,1); P(g,C.ol,15,29); P(g,C.ol,16,30); P(g,C.ol,3,29);
    // wrinkles: neck, crow's feet, frown crease
    for (const w of [[20,27],[23,28],[21,31],[25,31]]) { R(g,C.gd,w[0],w[1],1,2); P(g,C.gd,w[0]+1,w[1]+2); }
    P(g,C.gd,18,23); P(g,C.gd,18,25); P(g,C.gd,10,19); P(g,C.gd,11,18);
    // nostril
    P(g,C.ol,3,26); P(g,C.ol,5,26);
    // round spectacles + beady eyes
    for (const ex of [5,11]) S(g,ex,20,['.LLL.','L...L','L...L','L...L','.LLL.']);
    P(g,C.lg,10,22); LN(g,C.lg,16,22,19,21);
    for (const ex of [6,12]) {
      if (bl) R(g,C.ol,ex,22,3,1);
      else { R(g,C.ol,ex,22,2,2); P(g,C.wh,ex,22); P(g,C.cr,ex+2,21); }
    }
    // bushy grumpy brows (twitch)
    S(g,3,17+tw,['LLL....','.WLLLL.','....LL.']);
    S(g,12,17+tw,['....LLL','.LLLLW.','.LL....']);
  };

  // T3. Girino (ficha)
  CARD_ART['girino'] = function(g,t){
    const wg = fl(t/0.2)%2;
    // underwater: deep teal, light bands, surface
    R(g,C.td,0,0,64,48);
    R(g,C.tq,0,0,64,2); for (let x = 0; x < 64; x += 2) P(g,C.tq,x+((x>>2)&1),2);
    for (const b of [[6,0],[22,0],[40,0],[55,0]]) F(g,C.tq,0,3,63,40,(x,y)=>{ const u=x-b[0]-(y>>1); return u>=0&&u<3&&((x+y)&1)===0&&y<36; });
    // weeds + mud floor
    R(g,C.sd,0,43,64,5); R(g,C.wd,0,43,64,1);
    for (const p of [[9,44],[30,45],[50,44]]) R(g,C.wd,p[0],p[1],3,1);
    const wd = (x0,h,ph)=>{ for (let y = 43-h; y < 43; y++) P(g, y%3?C.gd:C.gr, x0+((y+ph)>>2&1), y); };
    wd(4,16,0); wd(7,10,2); wd(57,14,1); wd(60,20,3); wd(54,8,0);
    // bubbles rising
    for (let k = 0; k < 4; k++) {
      const bx = [14,46,52,20][k] + (fl(t*1.5 + k*0.5)%2), by = [9,30,18,37][k] - (fl(t*2 + k*0.7)%3 ? 0 : 1);
      R(g,C.sk,bx,by,2,1); R(g,C.sk,bx,by+2,2,1); P(g,C.sk,bx-1,by+1); P(g,C.sk,bx+2,by+1); P(g,C.wh,bx,by+1);
    }
    // tail
    const tl = wg ? bezF(36,25, 44,19, 51,25, 2.2,0.7) : bezF(36,25, 44,31, 51,24, 2.2,0.7);
    F(g,C.ol,30,14,56,36,dil(tl));
    F(g,C.gr,30,14,56,36,tl);
    F(g,C.lm,30,14,56,36,(x,y)=>tl(x,y)&&!tl(x,y-1));
    // body
    const bd = eF(28,25.5,9,8);
    body(g,bd,[17,15,39,36],C.gr,C.gd,C.lm,C.ol,2);
    F(g,C.lm,18,24,38,35,(x,y)=>bd(x,y)&&inE(x,y,27,30,6,3.4));
    F(g,C.cr,18,24,38,35,(x,y)=>inE(x,y,25.5,30,2.5,1.4));
    // tiny spike bump
    S(g,28,14,['.o.','olo','olo']);
    // big eye
    S(g,21,20,['.ooo.','oWWoo','oWooo','ooooo','.ooo.']); P(g,C.lg,24,23);
    // mouth
    R(g,C.ol,19,27,3,1);
  };

  // ======================================================== PASTO
  // 16. Bezerro Manhoso
  CARD_ART['bezerro-manhoso'] = function(g,t){
    bgPasto(g,0);
    const ef = (t%1.5) > 1.2, tf = [0,1,2,1][fl(t*2.5)%4];
    E(g,C.gd,32,44,17,1.6);
    // tail swishing on the right
    const tl = bezF(44,38, 50,37, 51+tf-1,31, 0.9,0.7);
    F(g,C.ol,41,26,56,42,dil(tl)); F(g,C.wh,41,26,56,42,tl);
    S(g,49+tf,28,['.oo.','owwo','owwo','.oo.']);
    // body sitting + folded hind legs
    const bd = any(eF(32,37,12.5,7.2), eF(21.5,40.5,4.6,3.6), eF(42.5,40.5,4.6,3.6));
    body(g,bd,[15,28,50,45],C.wh,C.lg,null,C.ol,2);
    F(g,C.wo,15,28,50,45,(x,y)=>bd(x,y)&&(inE(x,y,41,35,5,3.6)||inE(x,y,20,38,3,2.4)));
    // front legs
    for (const lx of [27,35]) { R(g,C.ol,lx-1,36,5,10); R(g,C.wh,lx,36,3,7); R(g,C.lg,lx+2,37,1,6); R(g,C.sd,lx,43,3,2); }
    // ears
    const ey = ef ? -2 : 0;
    const er = any(eF(20.5,20,4.4,2), eF(43.5,20+ey,4.4,2));
    body(g,er,[14,16,50,24],C.wh,C.lg,null,C.ol,1);
    R(g,C.pk,18,20,3,1); R(g,C.pk,43,20+ey,3,1);
    // horn nubs + fluffy tuft
    S(g,26,11,['.oo.','otto','otwo']); S(g,35,11,['.oo.','otto','owto']);
    // head with puffed right cheek
    const hd = any(eF(31.5,22.5,9.4,8), eF(38.6,26.6,4.4,3.8));
    body(g,hd,[21,13,44,32],C.wh,C.lg,null,C.ol,2);
    F(g,C.wo,21,13,44,32,(x,y)=>hd(x,y)&&inE(x,y,26.5,19.5,4.2,3.6));
    S(g,29,13,['.oo.o','owwow','.oww.']);
    // big shiny pleading eyes + worried brows
    S(g,25,19,['ooo','oWo','ooo']); P(g,C.wh,27,21);
    S(g,34,19,['ooo','oWo','ooo']); P(g,C.wh,36,21);
    LN(g,C.ol,24,17,27,16); LN(g,C.ol,35,16,38,17);
    // blush on the puffed cheek
    R(g,C.pk,39,25,3,1); R(g,C.pk,22,25,2,1);
    // muzzle shifted left + pouty mouth
    const mz = eF(30,27.5,5.4,3.2);
    F(g,C.pk,23,23,38,32,mz);
    F(g,C.wn,23,23,38,32,(x,y)=>mz(x,y)&&!mz(x,y+1));
    R(g,C.wn,27,26,2,1); R(g,C.wn,31,26,2,1);
    S(g,28,29,['.oo.','o..o']);
    // rope collar + bell
    R(g,C.ol,24,31,16,2); R(g,C.rd,25,31,14,1);
    for (let x = 25; x < 39; x += 2) P(g,C.wn,x,31);
    S(g,29,32,['.oooo.','oyyyOo','oyyyOo','oooooo','..oo..']);
    P(g,C.wh,30,33);
    // daisies
    const dz = [[6,40],[11,45],[52,41],[57,45],[17,46],[47,46]];
    for (const d of dz) { P(g,C.gd,d[0],d[1]+2); S(g,d[0]-1,d[1]-1,['.W.','WyW','.W.']); }
  };

  // 17. Jegue Carregador
  CARD_ART['jegue-carregador'] = function(g,t){
    bgPasto(g,0,{noFence:true,noTufts:true,c1:[6,5],c2:[26,9]});
    for (const p of [[4,27],[50,30],[58,25],[44,34],[9,33]]) { R(g,C.gd,p[0],p[1],1,2); P(g,C.lm,p[0]+1,p[1]+1); }
    const er = fl(t*1.3)%2, tf = [0,1,2,1][fl(t*2.2)%4], br = fl(t*3)%2;
    // dirt road over the hill
    const road = (x,y)=>y >= 38 + Math.round(1.5*Math.sin(x/9));
    F(g,C.wo,0,35,63,47,road);
    F(g,C.wd,0,35,63,47,(x,y)=>road(x,y)&&!road(x,y-1));
    for (let i = 0; i < 8; i++) { const x = (i*13+hs(i,6)%7)%60, y = 42+(i*3)%5; R(g, i%2?C.st:C.wd, x, y, 2+(i%3), 1); }
    R(g,C.wd,14,43,30,1); R(g,C.wd,17,44,24,1);
    // tail (left), swishing
    const tl = bezF(15.5,24, 11.5,27, 11+tf-1,33, 1,0.8);
    F(g,C.ol,5,21,20,37,dil(tl)); F(g,C.gy,5,21,20,37,tl);
    S(g,9+tf,32,['.oo.','oooo','oooo','.oo.']);
    // legs
    const leg = (x,y,c,d)=>{ R(g,C.ol,x-1,32,5,y-31); R(g,c,x,32,3,y-34); R(g,d,x+2,33,1,y-35); R(g,C.lg,x,y-3,3,1); R(g,C.sd,x,y-2,3,1); };
    leg(17,42,C.nt,C.ol); leg(34,42,C.nt,C.ol);
    leg(22,43,C.gy,C.nt); leg(39,43,C.gy,C.nt);
    // body (barrel + rump + chest) and neck
    const nk = tubeF([36,26, 43,16],4.2);
    const bd = any(eF(28,28.5,12.5,6.6), eF(18.5,27,6,6.2), eF(38,28,5.4,6), nk);
    body(g,bd,[11,10,47,37],C.gy,C.nt,C.lg,C.ol,2);
    F(g,C.lg,11,10,47,37,(x,y)=>bd(x,y)&&inE(x,y,30,35,9,2.6)&&bd(x,y+2)===false);
    // spiky mane along the neck
    for (let i = 0; i < 6; i++) { const x = 38+i, y = 21-i*2; R(g,C.ol,x,y-1,2,2); P(g,C.ol,x-1,y-2+(i&1)); }
    // far basket (behind, peeking over the back) with oranges
    R(g,C.ol,24,16,12,6); R(g,C.wd,25,17,10,4);
    for (const o of [[27,15],[31,14.5]]) { const f = eF(o[0],o[1],2.3,2.1); F(g,C.ol,23,11,35,18,dil(f)); F(g,C.or,23,11,35,18,f); P(g,C.yl,fl(o[0])-1,fl(o[1])-1); }
    // near basket: corn + oranges sticking out
    for (const c of [[23,12],[26,10]]) S(g,c[0],c[1],['.o.','oyo','oyo','oyo','oyo','ogo','ogo']);
    for (const o of [[30,20],[33.5,19.5]]) { const f = eF(o[0],o[1],2.6,2.4); F(g,C.ol,26,15,38,24,dil(f)); F(g,C.or,26,15,38,24,f); P(g,C.yl,fl(o[0])-1,fl(o[1])-1); }
    S(g,31,16,['.o','og','o.']);
    const bk = pF([21,22, 35,22, 34,35, 22,35]);
    F(g,C.ol,20,21,36,36,dil(bk));
    F(g,C.st,20,21,36,36,bk);
    for (let y = 24; y < 35; y += 2) for (let x = 22+(y&2); x < 34; x += 4) R(g,C.wo,x,y,2,2);
    R(g,C.rd,21,29,13,2); for (let x = 22; x < 34; x += 3) P(g,C.yl,x,29+(x&1));
    R(g,C.wd,21,22,14,2); R(g,C.st,21,22,14,1);
    F(g,C.wd,20,21,36,36,(x,y)=>bk(x,y)&&!bk(x+2,y)&&y>23);
    F(g,C.cr,20,21,36,36,(x,y)=>bk(x,y)&&!bk(x-1,y)&&y>24);
    // ears (rotate 1px)
    for (const [a,ox] of [[er?-2.2:-2.1,44],[er?-1.85:-1.75,47]]) {
      const f = bladeF(ox,12,a,11,2.3);
      F(g,C.ol,32,0,54,14,dil(f)); F(g,C.gy,32,0,54,14,f);
      F(g,C.nt,32,0,54,14,(x,y)=>f(x,y)&&!f(x+1,y+1));
    }
    LN(g,C.pk,42,6,44,10); LN(g,C.pk,46,5,47,9);
    // head raised mid-bray
    const hd = any(eF(47,14.5,4.8,4.4), tubeF([47,13, 54.5,11.5],2.8), tubeF([47,17.5, 54,20],2));
    body(g,hd,[40,7,60,24],C.gy,C.nt,C.lg,C.ol,1);
    // open mouth: inside + teeth
    PG(g,C.ol,[49,15.5, 58,13.5, 58,19.5, 50,17.5]);
    PG(g,C.wn,[51,16, 57,14.6, 56.5,18.6, 51,17.2]);
    R(g,C.wh,52,15,5,1); R(g,C.wh,53,18,3,1); P(g,C.pk,54,17);
    // pale muzzle + nostril
    F(g,C.wh,48,8,60,14,(x,y)=>hd(x,y)&&x>=53&&y<14);
    F(g,C.lg,48,18,60,23,(x,y)=>hd(x,y)&&x>=51&&y>18);
    P(g,C.ol,57,10);
    // eye with pale ring
    R(g,C.lg,43,11,4,4); R(g,C.ol,44,12,2,2); P(g,C.wh,44,12); LN(g,C.ol,43,10,46,10);
    // bray marks "ió-ió"
    if (br) { R(g,C.cr,60,12,2,1); R(g,C.cr,61,16,2,1); R(g,C.cr,60,20,2,1); }
    else { R(g,C.cr,59,11,2,1); R(g,C.cr,61,15,2,1); R(g,C.cr,60,19,2,1); P(g,C.cr,62,13); }
  };

  // 18. Porco Comilão
  CARD_ART['porco-comilao'] = function(g,t){
    bgPasto(g,0);
    const ch = fl(t/0.3)%2, tw = fl(t*2.5)%2;
    E(g,C.gd,40,44,17,1.6);
    // legs (mud spots)
    for (const L of [[31,0],[37,1],[46,0],[51,1]]) { const lx = L[0]; R(g,C.ol,lx-1,35,5,10); R(g,C.pk,lx,35,3,8); R(g,C.wn,lx+2,36,1,7); R(g,C.sd,lx,42,3,2); P(g,C.wd,lx,38+L[1]); P(g,C.wd,lx+1,39+L[1]); P(g,C.wd,lx+1,40); }
    // curly tail (wiggles)
    S(g,53+tw,18,['.ooo.','op.po','o.opo','.opo.','..o..']);
    // round body
    const bd = eF(41,28,13.5,9);
    body(g,bd,[26,18,56,38],C.pk,C.wn,C.cr,C.ol,1);
    F(g,C.cr,26,18,56,38,(x,y)=>inE(x,y,39,22,8,2.4)&&bd(x,y)&&!bd(x,y-2));
    P(g,C.wh,36,21);
    // trough (back rim)
    R(g,C.ol,2,33,27,2); R(g,C.wd,3,34,25,1);
    // head lowered into the trough
    const dy = ch;
    const hd = eF(23,27+dy,8,7);
    body(g,hd,[14,19,32,36],C.pk,C.wn,C.cr,C.ol,1);
    // floppy ears
    S(g,24,17+dy,['....ooo','..ooppo','.opppno','oppnno.','.ooo...']);
    S(g,14,19+dy,['.ooo...','opppoo.','.onpppo','..ooooo']);
    // happily closed eyes + blush
    S(g,17,25+dy,['.oo.','o..o']); S(g,24,25+dy,['.oo.','o..o']);
    R(g,C.rd,16,28+dy,2,1); R(g,C.rd,27,28+dy,2,1);
    // snout dipping into the slop
    const sn = eF(19,32+dy,4.6,3.4);
    body(g,sn,[13,27,26,37],C.pk,C.wn,C.cr,C.ol,1);
    R(g,C.wn,17,31+dy,1,2); R(g,C.wn,20,31+dy,1,2);
    // trough front + slop
    const tf = pF([2,36, 29,36, 27.5,45, 3.5,45]);
    F(g,C.ol,1,35,30,46,dil(tf));
    F(g,C.wo,1,35,30,46,tf);
    R(g,C.wd,4,40,23,1); R(g,C.wd,4,43,22,1); R(g,C.st,3,37,25,1);
    R(g,C.wd,6,45,3,2); R(g,C.wd,22,45,3,2); R(g,C.ol,5,46,5,1); R(g,C.ol,21,46,5,1);
    F(g,C.st,1,32,30,37,(x,y)=>inE(x,y,15.5,36,13,2.2)&&y<36&&!sn(x,y-dy*0));
    for (const k of [[4,35],[7,34],[11,35],[24,34],[26,35],[9,35]]) P(g,C.yl,k[0],k[1]);
    R(g,C.gr,5,35,2,1); R(g,C.gr,22,35,2,1); P(g,C.lm,6,34);
    // crumbs flying
    if (ch) { P(g,C.yl,11,28); P(g,C.st,9,30); P(g,C.yl,27,30); P(g,C.gr,25,29); }
    else { P(g,C.yl,12,30); P(g,C.st,8,31); P(g,C.yl,28,32); }
  };

  // 19. Vaqueiro Aboiador
  CARD_ART['vaqueiro-aboiador'] = function(g,t){
    bgPasto(g,4,{noFence:true,noTufts:true});
    for (const p of [[4,30],[57,40],[52,30],[3,44]]) { R(g,C.gd,p[0],p[1],1,2); P(g,C.lm,p[0]+1,p[1]+1); }
    const wv = fl(t*2.5)%2, sw = fl(t*1.5)%2, bl = (t%3.2) > 3.05;
    // setting sun + cattle silhouettes on the crest
    F(g,C.or,0,12,14,22,(x,y)=>inE(x,y,7,20,5.5,5.5)&&y<hillY(x));
    F(g,C.yl,0,12,14,22,(x,y)=>inE(x,y,7,20,4.2,4.2)&&y<hillY(x));
    const cow = (x,y,f)=>S(g,x,y,['.......G','GGGGGGG.','GGGGGGG.','G.G..G..'],f);
    cow(48,hillY(51)-4,1); cow(55,hillY(58)-3); cow(16,hillY(19)-4);
    // lasso coil hung on the shoulder (back loop)
    const ls = ringF(13.5,38,5.4,7,1.7);
    F(g,C.ol,6,29,22,47,dil(ls)); F(g,C.st,6,29,22,47,ls); F(g,C.wo,6,29,22,47,(x,y)=>ls(x,y)&&!ls(x+1,y+1)&&x>13);
    // gibão (leather jacket)
    const gb = pF([9,48, 12,38, 20,32, 36,32, 43,37, 46,48]);
    body(g,gb,[7,30,48,48],C.wo,C.wd,C.st,C.ol,2);
    // shirt + red neckerchief
    PG(g,C.cr,[24,32, 33,32, 30,39, 27,39]);
    PG(g,C.ol,[21,30, 35,30, 32,35, 28,37, 24,35]); PG(g,C.rd,[22,31, 34,31, 31,34, 28,36, 25,34]);
    R(g,C.wn,27,33,3,1); P(g,C.rd,28,37); P(g,C.wn,29,38);
    // stitched leather: seams + chest star
    for (let y = 38; y < 48; y += 2) { P(g,C.st,22,y); P(g,C.st,35,y); }
    S(g,15,39,['..t..','.t.t.','t...t','.t.t.','..t..']); P(g,C.cr,17,41);
    S(g,37,39,['..t..','.t.t.','t...t','.t.t.','..t..']); P(g,C.cr,39,41);
    // lasso front strand over the shoulder
    F(g,C.st,6,29,22,47,(x,y)=>ls(x,y)&&x>14&&y>31&&y<45);
    F(g,C.wd,6,29,22,47,(x,y)=>ls(x,y)&&!ls(x+1,y)&&x>14&&y>31&&y<45);
    // neck
    R(g,C.ol,25,26,7,5); R(g,C.st,26,26,5,5); R(g,C.wo,29,27,2,4);
    // head (3/4 to the right)
    const hd = any(eF(29,20,6.2,6.8), eF(35.2,21.6,1.6,1.8));
    body(g,hd,[21,12,39,29],C.st,C.wo,null,C.ol,1);
    S(g,21,18,['.o','oto','owo','.oo']);
    // eyes looking up to the right + brows
    if (bl) { R(g,C.ol,28,19,2,1); R(g,C.ol,32,19,2,1); }
    else { R(g,C.ol,28,18,2,2); P(g,C.wh,28,18); R(g,C.ol,32,18,2,2); P(g,C.wh,32,18); }
    R(g,C.sd,27,16,3,1); R(g,C.sd,32,16,3,1);
    R(g,C.pk,26,21,2,1);
    // moustache + open singing mouth
    S(g,30,22,['.ssss.','ss..ss']);
    S(g,31,24,['ooo','onn','ono','.o.'].map(r=>r.slice(0,3)));
    P(g,C.wo,34,20);
    // chin strap (sways 1px)
    R(g,C.sd,23,15,1,5); R(g,C.sd,23+sw,20,1,4); R(g,C.sd,24+sw,24,1,2); R(g,C.sd,25+sw,26,2,1); R(g,C.sd,27,27,3,1);
    // hat: rounded crown + wide brim, stitched star
    const crn = (x,y)=>inE(x,y,28.5,10.5,7,6.2) && y<=13;
    const brm = (x,y)=>inE(x,y,29.5,14,15.2,2.8);
    F(g,C.ol,12,3,46,18,dil(any(crn,brm)));
    F(g,C.wd,12,3,46,18,crn); F(g,C.wo,12,3,46,18,(x,y)=>crn(x,y)&&!crn(x-1,y-1)); F(g,C.sd,12,3,46,18,(x,y)=>crn(x,y)&&!crn(x+2,y));
    F(g,C.wd,12,3,46,18,brm); F(g,C.wo,12,3,46,18,(x,y)=>brm(x,y)&&!brm(x,y-1)); F(g,C.sd,12,3,46,18,(x,y)=>brm(x,y)&&!brm(x,y+1));
    for (let x = 17; x < 43; x += 3) P(g,C.st,x,14);
    S(g,26,6,['..t..','ttttt','.ttt.','.t.t.']);
    // raised arm + cupped hand at the mouth
    const arm = tubeF([43,47, 44,36, 38,28],2.7);
    body(g,arm,[33,23,48,48],C.wo,C.wd,null,C.ol,1);
    F(g,C.st,33,23,48,48,(x,y)=>arm(x,y)&&!arm(x-1,y)&&y>33);
    for (let y = 38; y < 46; y += 2) P(g,C.st,44,y);
    S(g,35,21,['.ooo.','otttto','ottwo.','otttto','.oooo.'].map(r=>r.slice(0,6)));
    // aboio: sound waves rippling to the right
    const r0 = wv ? 1.5 : 0;
    for (const r of [6,11,16]) F(g,C.cr,42,6,63,42,(x,y)=>{ const dx=x+0.5-39, dy=(y+0.5-23)*1.05, d=Math.sqrt(dx*dx+dy*dy); return dx>2 && Math.abs(dy) < dx*(r>12?0.75:0.95) && Math.abs(d-(r+r0))<0.55; });
  };

  // 20. Boi-Bumbá (lendária)
  // wavy 1px streamer from x0 to x1, y = yf(x); same-row pixels merged
  function wave(g,c,x0,x1,yf){
    let s = x0, cy = Math.round(yf(x0));
    for (let x = x0+1; x <= x1+1; x++) { const y = x<=x1 ? Math.round(yf(x)) : -99; if (y !== cy) { R(g,c,s,cy,x-s,1); s = x; cy = y; } }
  }
  CARD_ART['boi-bumba'] = function(g,t){
    const ph = fl(t*3)%3, sw = fl(t*2)%2, fw = (fl(t*1.6)+2)%4, st = fl(t*2.5)%2;
    // festive night sky
    R(g,C.nt,0,0,64,9); R(g,C.pu,0,9,64,9); R(g,C.li,0,18,64,6);
    for (let x = 0; x < 64; x += 4) R(g,C.nt,x+2,9,2,1);
    for (let x = 0; x < 64; x += 4) R(g,C.pu,x,18,2,1);
    for (const s of [[22,2],[27,8],[45,1],[50,7],[2,13],[61,13],[41,8]]) P(g,C.lg,s[0],s[1]);
    // fireworks (between the badge corners)
    const fx = 34, fy = 4;
    if (fw===0) { P(g,C.yl,fx,fy+3); P(g,C.or,fx,fy+5); }
    else if (fw===1) { for (let k = 0; k < 8; k++) { const a = k*Math.PI/4; P(g,C.yl,Math.round(fx+Math.cos(a)*2),Math.round(fy+Math.sin(a)*2)); } P(g,C.wh,fx,fy); }
    else if (fw===2) { for (let k = 0; k < 8; k++) { const a = k*Math.PI/4, ca = Math.cos(a), sa = Math.sin(a); if (k%2) P(g,C.pk,Math.round(fx+ca*2),Math.round(fy+sa*2)); P(g,k%2?C.pk:C.yl,Math.round(fx+ca*4),Math.round(fy+sa*3.4)); } spark(g,C.wh,fx,fy); }
    else { for (let k = 0; k < 8; k++) { const a = k*Math.PI/4+0.4; P(g,k%2?C.li:C.pk,Math.round(fx+Math.cos(a)*4.5),Math.round(fy+1+Math.sin(a)*3.6)); } }
    // pasture hill at night + pool of lantern light
    F(g,C.gd,0,16,63,24,(x,y)=>y>=hillY(x));
    R(g,C.gd,0,24,64,24);
    F(g,C.gr,0,16,63,24,(x,y)=>y===hillY(x)&&(x<10||x>52));
    const pool = eF(37,44,29,6.5);
    F(g,C.gr,0,34,63,47,pool);
    F(g,C.lm,0,34,63,47,(x,y)=>pool(x,y)&&!pool(x,y-1)&&(x<22||x>54));
    for (const p of [[4,30],[58,31],[8,40]]) { R(g,C.gr,p[0],p[1],1,2); P(g,C.lm,p[0]+1,p[1]); }
    // bandeirinhas + lanterns
    bandeirinhas(g,0,63,10,3,5,[C.rd,C.yl,C.bl],C.st);
    for (const l of [[2,14],[60,14]]) { R(g,C.ol,l[0]-1,l[1]-1,4,4); R(g,C.yl,l[0],l[1],2,2); P(g,(fl(t*2.5)+l[0])%2?C.cr:C.or,l[0],l[1]+1); }
    // confetti
    for (const c of [[44,15,C.yl],[53,18,C.pk],[31,13,C.sk],[59,24,C.lm],[2,24,C.pk],[38,15,C.lm]]) if (fl(t*3+c[0])%4) P(g,c[2],c[0],c[1]);
    // shadow + dancer's feet (stepping)
    R(g,C.gd,24,44,34,1);
    S(g,29,43-st,['.oo.','osso','oddoo','.ooo.']);
    S(g,43,42+st,['.oo.','osso','oddoo','.ooo.']);
    // skirt
    const sk = pF([24,31, 54,31, 57.5,43, 21.5,43]);
    body(g,sk,[20,29,59,44],C.rd,C.wn,null,C.ol,1);
    for (let x = 27; x < 54; x += 4) R(g,C.wn,x,34,1,7);
    R(g,C.yl,23,38,33,1); for (let x = 24; x < 56; x += 4) P(g,C.cr,x,38);
    R(g,C.wn,22,43,36,1); for (let x = 23+st; x < 58; x += 3) R(g,C.yl,x,42,1,2);
    // tail with a ribbon bow
    F(g,C.ol,50,10,62,28,tubeF([52,24, 56,20, 57,15],1.1));
    S(g,55,11,['.oo.','oiuo','ouuo','.oo.']);
    S(g,51,21,['r.r','rrr','r.r']);
    // velvet body
    const bd = any(eF(39.5,26,14.5,8.3), eF(28,28,6.5,6.5));
    body(g,bd,[20,16,55,36],C.nt,C.ol,C.pu,C.ol,2);
    F(g,C.yl,20,16,55,36,(x,y)=>bd(x,y)&&!bd(x,y+1)&&x>23);
    // gold embroidery: curls + sun-flower emblem
    const curl = ['.yyy.','y...y','y.y.y','y..y.','.y...'];
    S(g,48,20,curl,1);
    S(g,43,24,['..i..','.iyi.','iyWyi','.iyi.','..i..']);
    // sequins (3-phase twinkle)
    const sq = [C.wh,C.li,C.rd,C.yl];
    let n = 0;
    for (let arm = 0; arm < 2; arm++) for (let th = 0; ; ) {
      const r = 4.2 + th*1.05; if (r > 12) break;
      const a = th + arm*Math.PI, x = Math.round(45 + Math.cos(a)*r*1.2), y = Math.round(26 + Math.sin(a)*r*0.62);
      th += 2.7/r;
      if (!bd(x,y) || !bd(x+1,y+1) || !bd(x-1,y-1) || inE(x,y,50,22,3.4,3.4)) continue;
      P(g, (n%3)===ph ? C.wh : sq[(n>>1)%4], x, y); n++;
    }
    if (ph===0) P(g,C.wh,45,26); else spark(g,C.wh,45,26);
    // ribbons streaming from the horns
    const rc = [C.rd,C.yl,C.bl,C.gr];
    for (let i = 0; i < 4; i++) {
      const x0 = 23+i, x1 = 36+i*2;
      wave(g,rc[i],x0,x1,x=>{ const u = x-x0; return 16.5 + i*2.2 + u*0.3 + Math.sin(u/2.8 + i*1.1 + sw*1.4)*0.9; });
    }
    // ears
    S(g,2,20,['oooo..','oppnoo','.ooooo']);
    S(g,24,18,['..oooo','ooppno','ooooo.']);
    // head (3/4, facing left)
    const cra = eF(17.5,23.5,8.4,7.4), mz = eF(12.5,31,6,4.2), hd = any(cra,mz);
    body(g,hd,[6,14,28,37],C.nt,null,C.pu,C.ol);
    F(g,C.ol,6,14,28,37,(x,y)=>cra(x,y)&&!hd(x+1,y+1)&&y>22);
    // lighter muzzle with a sequin rim
    const mz2 = eF(12.5,31,5,3.4);
    F(g,C.pk,6,26,20,36,mz2);
    F(g,C.wn,6,26,20,36,(x,y)=>mz2(x,y)&&!mz2(x+1,y+1));
    F(g,C.cr,6,26,20,36,(x,y)=>mz2(x,y)&&!mz2(x-1,y-1)&&y<30);
    F(g,C.yl,6,25,20,36,(x,y)=>dil(mz2)(x,y)&&!mz2(x,y)&&hd(x,y)&&y<31&&((x+y)&1));
    R(g,C.wn,9,30,1,2); R(g,C.wn,14,30,1,2);
    R(g,C.ol,10,33,4,1); P(g,C.ol,9,32); P(g,C.ol,14,32);
    // cheek rosette
    S(g,21,26,['.r.','ryr','.r.']);
    // horns with gold tips
    const h1 = bezF(12,17.5, 7.5,16, 6.5,10.5, 1.9,0.6), h2 = bezF(22,16.5, 26.5,15, 27,9.5, 1.9,0.6);
    for (const h of [h1,h2]) { F(g,C.ol,2,7,31,21,dil(h)); F(g,C.cr,2,7,31,21,h); F(g,C.yl,2,7,31,21,(x,y)=>h(x,y)&&y<14); }
    R(g,C.st,10,17,2,1); R(g,C.st,23,15,1,2); P(g,C.wh,6,11); P(g,C.wh,26,10);
    S(g,21,15,['.y.','yyy']);
    // forehead star
    S(g,15,17,['..W..','WWWWW','.WWW.','.W.W.']);
    // big festive eyes with lashes
    S(g,20,21,['.WW.','WWoW','WooW','.WW.']); P(g,C.li,20,20); P(g,C.li,22,20);
    S(g,10,21,['WW.','oWW','ooW','.W.']); P(g,C.li,10,20);
  };

  // ======================================================== RETRATO
  CARD_ART['rival-sanfona'] = function(g,t){
    const br = fl(t/0.6)%2, tw = fl(t*2)%3, bl = (t%3.6) > 3.45;
    // night sky + bandeirinhas + lanterns
    R(g,C.nt,0,0,64,48);
    for (const s of [[3,2],[14,1],[50,3],[61,8],[5,24],[58,26],[2,31],[61,33]]) P(g,C.lg,s[0],s[1]);
    bandeirinhas(g,0,63,3,4,5,[C.rd,C.yl,C.bl,C.gr],C.st);
    bandeirinhas(g,0,63,13,3,6,[C.yl,C.rd,C.gr,C.bl],C.wd);
    for (const l of [[7,19],[55,19]]) {
      const on = (tw + l[0]) % 3 !== 0;
      S(g,l[0]-1,l[1]-1,['.oo.','oyyo','oOOo','.oo.']);
      if (on) { P(g,C.cr,l[0],l[1]); P(g,C.or,l[0]-2,l[1]+1); P(g,C.or,l[0]+3,l[1]+1); }
    }
    // shoulders: leather vest over cream shirt, red scarf
    const bu = pF([7,48, 10,37, 21,31, 43,31, 54,37, 57,48]);
    body(g,bu,[5,29,59,48],C.wd,C.sd,C.wo,C.ol,2);
    PG(g,C.cr,[24,31, 40,31, 37,40, 27,40]);
    PG(g,C.ol,[20,29, 44,29, 41,35, 23,35]); PG(g,C.rd,[21,30, 43,30, 40,34, 24,34]); R(g,C.wn,24,33,16,1);
    // ears + head
    S(g,22,17,['oo','oto','owo','.oo']); S(g,41,17,['.oo','oto','owo','oo.']);
    const hd = eF(32,19,8.4,8);
    F(g,C.ol,22,10,43,29,dil(hd)); F(g,C.st,22,10,43,29,hd); F(g,C.wo,22,10,43,29,(x,y)=>hd(x,y)&&!hd(x+2,y+1));
    R(g,C.wo,24,13,17,1);
    // big white beard (behind the moustache)
    const bdF = any(eF(32,27.5,10,7.6), eF(24.5,23,2.6,4.4), eF(39.5,23,2.6,4.4));
    F(g,C.ol,19,17,45,37,(x,y)=>dil(bdF)(x,y)&&y>21);
    F(g,C.wh,20,18,44,36,(x,y)=>bdF(x,y)&&y>20);
    F(g,C.lg,20,18,44,36,(x,y)=>bdF(x,y)&&y>20&&!bdF(x+2,y+2));
    for (const l of [[27,28],[31,30],[35,29],[38,27],[25,25]]) R(g,C.lg,l[0],l[1],1,3);
    // rosy cheeks + round nose
    R(g,C.pk,24,19,3,1); R(g,C.pk,37,19,3,1);
    S(g,30,17,['.tt.','tttw','ttww','.ww.'].map(r=>r.replace(/w/g,'w')));
    P(g,C.cr,30,17);
    // eyes (smiling crinkles) + bushy white brows
    if (bl) { R(g,C.ol,26,17,3,1); R(g,C.ol,35,17,3,1); }
    else { R(g,C.ol,27,16,2,2); P(g,C.wh,27,16); R(g,C.ol,35,16,2,2); P(g,C.wh,35,16); }
    P(g,C.wo,25,17); P(g,C.wo,38,17);
    S(g,24,14,['.WWWW.','WLLLLW']); S(g,34,14,['.WWWW.','WLLLLW']);
    // moustache + confident toothy smile
    const ms = any(eF(28.3,21.6,4.4,1.8), eF(35.7,21.6,4.4,1.8));
    F(g,C.ol,21,18,43,25,(x,y)=>dil(ms)(x,y)&&!ms(x,y)&&y>=22);
    F(g,C.wh,21,18,43,25,ms);
    F(g,C.lg,21,18,43,25,(x,y)=>ms(x,y)&&!ms(x,y+1));
    S(g,22,19,['W.','WW']); S(g,41,19,['.W','WW']);
    S(g,28,24,['o......o','.oWWWWo.','..onno..','...oo...']);
    // leather hat with a yellow star
    const crn = (x,y)=>inE(x,y,32,7,7.8,6.2) && y<=9;
    const brm = (x,y)=>inE(x,y,32,10.4,15,2.5);
    F(g,C.ol,15,1,49,16,dil(any(crn,brm)));
    F(g,C.wo,15,1,49,16,crn); F(g,C.wd,15,1,49,16,(x,y)=>crn(x,y)&&!crn(x+2,y+1));
    F(g,C.wd,15,1,49,16,brm); F(g,C.wo,15,1,49,16,(x,y)=>brm(x,y)&&!brm(x,y-1)); F(g,C.sd,15,1,49,16,(x,y)=>brm(x,y)&&!brm(x,y+1));
    for (let x = 19; x < 46; x += 3) P(g,C.st,x,10);
    S(g,30,4,['..y..','yyyyy','.yyy.','.y.y.']);
    if (tw===1) P(g,C.wh,32,4);
    // accordion (bellows breathe 1px)
    const bw = br, ax0 = 12, ax1 = 52, ay = 35;
    R(g,C.ol,9,37,4,6); R(g,C.st,10,38,2,4);
    R(g,C.ol,51,37,4,6); R(g,C.st,52,38,2,4);
    R(g,C.ol,ax0,ay,10,13); R(g,C.bl,ax0+1,ay+1,8,11); R(g,C.nt,ax0+7,ay+1,2,11); R(g,C.sk,ax0+1,ay+1,7,1);
    for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) P(g,C.wh,ax0+2+j*2,ay+3+k*3);
    const bx0 = ax0+10-bw, bx1 = ax1-10+bw;
    R(g,C.ol,bx0,ay+1,bx1-bx0,11);
    for (let x = bx0; x < bx1; x += 2) R(g,C.bl,x,ay+2,1,9);
    R(g,C.rd,bx0,ay+1,bx1-bx0,1); R(g,C.rd,bx0,ay+11,bx1-bx0,1);
    R(g,C.ol,ax1-10,ay,10,13); R(g,C.bl,ax1-9,ay+1,8,11); R(g,C.nt,ax1-3,ay+1,2,11); R(g,C.sk,ax1-9,ay+1,7,1);
    R(g,C.wh,ax1-8,ay+2,4,10); for (let y = ay+3; y < ay+12; y += 2) R(g,C.ol,ax1-6,y,3,1);
    if (tw===0) spark(g,C.wh,ax0+2,ay+1); else P(g,C.wh,ax0+2,ay+1);
    P(g,C.wh,ax1-9,ay+1);
  };
})();
