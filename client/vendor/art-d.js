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
  // rotated ellipse (a in radians, y down)
  const rE = (cx,cy,rx,ry,a)=>{ const c=Math.cos(a), s=Math.sin(a); return (x,y)=>{ const dx=x+0.5-cx, dy=y+0.5-cy, u=(dx*c+dy*s)/rx, v=(-dx*s+dy*c)/ry; return u*u+v*v<=1; }; };
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
  // line of w x w dots; consecutive dots on the same row (shallow lines) or column (steep lines) merge into one rect
  function LN(g,c,x0,y0,x1,y1,w){
    w = w||1; const dx=x1-x0, dy=y1-y0, n=Math.max(Math.abs(dx),Math.abs(dy))||1, hz = Math.abs(dx)>=Math.abs(dy);
    let ax = 0, ay = 0, bx = 0, by = 0, on = false;
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0+dx*i/n), y = Math.round(y0+dy*i/n);
      if (on && (hz ? (y===ay && (x===bx+1||x===ax-1)) : (x===ax && (y===by+1||y===ay-1)))) { if (x<ax) ax=x; if (x>bx) bx=x; if (y<ay) ay=y; if (y>by) by=y; continue; }
      if (on) R(g,c,ax,ay,bx-ax+w,by-ay+w);
      ax = bx = x; ay = by = y; on = true;
    }
    if (on) R(g,c,ax,ay,bx-ax+w,by-ay+w);
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
  // blade along angle a from (cx,cy), length L, half-width w (elliptic profile)
  function bladeF(cx,cy,a,L,w){
    const ux=Math.cos(a), uy=Math.sin(a);
    return (x,y)=>{ const dx=x+0.5-cx, dy=y+0.5-cy, s=(dx*ux+dy*uy)/L; if (s<0||s>1) return false; const q=-dx*uy+dy*ux; return Math.abs(q) <= w*Math.sqrt(4*s*(1-s))+0.15; };
  }
  // blinking fireflies / sparkles (deterministic, phase per index)
  function flies(g,t,pts,c){
    for (let i = 0; i < pts.length; i++) if (((t*1.1 + i*0.41) % 1.7) < 1.25) P(g, c||C.lm, pts[i][0], pts[i][1]);
  }
  // little vine curl (lime tendril); k = 0/1 animation frame, d = +1 opens right, -1 opens left (x = stalk side)
  const CURL = [['.ll.','l..l','l..l','l.l.','.l..'],['.ll.','l..l','l.ll','l...','.l..']];
  function curl(g,x,y,d,k){ S(g,d>0?x:x-3,y,CURL[k?1:0],d<0); }
  // 2px sinuous vertical stem drawn as column runs (cheap): sx(y) gives the left x of the stem
  function vstem(g,sx,y0,y1,base,lite){
    const runs = []; let ys = y0;
    for (let y = y0+1; y <= y1+1; y++) if (y > y1 || sx(y) !== sx(ys)) { runs.push([sx(ys),ys,y-ys]); ys = y; }
    for (const r of runs) R(g,C.ol,r[0]-1,r[1]-(r[1]===y0?1:0),4,r[2]+(r[1]===y0?1:0));
    for (const r of runs) { R(g,base,r[0],r[1],2,r[2]); R(g,lite,r[0],r[1],1,r[2]); }
  }

  // ---------------------------------------------------------------- terrains
  // Pomar: v 0 dia, 1 manhã rosa, 2 escuro (feitiço), 3 tarde quente, 4 crepúsculo (feitiço), 5 hora dourada
  function bgPomar(g,v,opt){
    opt = opt||{};
    const dk = v===2||v===4;
    if (v===1) { R(g,C.pk,0,0,64,11); R(g,C.cr,0,11,64,9); }
    else if (v===2) { R(g,C.bl,0,0,64,20); }
    else if (v===3) { R(g,C.cr,0,0,64,20); R(g,C.st,6,15,12,1); R(g,C.st,44,16,14,1); R(g,C.st,50,13,8,1); }
    else if (v===4) {
      R(g,C.pu,0,0,64,8); R(g,C.li,0,8,64,5); R(g,C.pk,0,13,64,7);
      for (let x = 0; x < 64; x += 8) { R(g,C.pu,x+((x>>3)&1)*3,8,2,1); R(g,C.li,x+4+((x>>3)&1)*2,13,2,1); }
    }
    else if (v===5) {
      R(g,C.or,0,0,64,9); R(g,C.st,0,9,64,5); R(g,C.cr,0,14,64,6);
      for (let x = 0; x < 64; x += 8) { R(g,C.or,x+((x>>3)&1)*3,9,2,1); R(g,C.st,x+4+((x>>3)&1)*2,14,2,1); }
    }
    else R(g,C.sk,0,0,64,20);
    const leaf = C.gd, hi = dk?C.gd:C.gr;
    const cs = opt.can || [[3,3,8],[17,0,7],[31,3,7],[46,0,7],[61,3,8]];
    // far orchard + trunks
    R(g,C.gd,0,19,64,15);
    if (dk||v===5) for (let x = 0; x < 64; x += 4) { R(g,dk?C.td:C.gr,x+2,19,2,1); R(g,dk?C.td:C.gr,x,20,2,1); }
    else for (let x = 0; x < 64; x += 2) { P(g,C.gr,x+1,19); P(g,C.gr,x,20); }
    R(g,C.wd,2,8,2,26); R(g,C.wd,60,8,2,26);
    if (!opt.noCanopy) {
      const fu = (x,y)=>{ for (const c of cs) if (inE(x,y,c[0],c[1],c[2],c[2]-1)) return true; return false; };
      F(g,leaf,0,0,63,18,fu);
      F(g,hi,0,0,63,18,(x,y)=>{ for (const c of cs) if (inE(x,y,c[0]-1.5,c[1]-1.5,c[2]-3,c[2]-4)) return true; return false; });
      for (const c of cs) {
        const ax = c[0]+(hs(c[0],1)%5)-2, ay = c[1]+2+(hs(c[0],2)%3);
        if (ay < 17) R(g, dk?C.wn:C.rd, ax, ay, 2, 2);
        P(g, dk?C.li:C.pk, c[0]-3, c[1]+1); P(g, dk?C.li:C.pk, c[0]+3, c[1]-2);
      }
    }
    R(g, dk?C.gd:C.gr, 0,34,64,14);
    R(g, dk?C.td:C.gd, 0,34,64,1);
    for (let x = 1; x < 64; x += 5) R(g, dk?C.gr:C.lm, x, 36+(hs(x,7)%3)*4, 1, 2);
  }
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

  // ======================================================== POMAR
  // 6. Pé de Maracujá
  CARD_ART['pe-de-maracuja'] = function(g,t){
    bgPomar(g,1,{can:[[1,2,8],[63,2,8]]});
    const cu = fl(t*2)%2, fk = (t%2.6) > 2.2;
    // trellis: square lattice panel between two posts
    for (const x of [19,25,31,37,43]) { R(g,C.wd,x+1,12,1,31); R(g,C.wo,x,12,1,31); }
    for (const y of [17,23,29,35]) { R(g,C.st,16,y,31,1); R(g,C.wo,16,y+1,31,1); }
    for (const px of [12,47]) { R(g,C.ol,px,9,4,35); R(g,C.wo,px+1,10,2,34); R(g,C.wd,px+2,10,1,34); R(g,C.st,px+1,10,1,10); }
    R(g,C.ol,10,8,44,4); R(g,C.st,11,9,42,1); R(g,C.wo,11,10,42,1);
    // soil mound at the root
    E(g,C.ol,32,45,8,2.6); E(g,C.wd,32,45,7,2); R(g,C.wo,28,43,6,1);
    // twisting stem
    const sx = y=>31 + Math.round(2.4*Math.sin((y-2)/4.4));
    vstem(g,sx,6,44,C.gd,C.gr);
    // leaves
    const LV = [[sx(37)+2,37,0.3,11],[sx(42)-1,42,2.85,8],[sx(19),19,3.55,7],[sx(9)+2,9,-0.4,8]];
    const lf = any(...LV.map(l=>bladeF(l[0],l[1],l[2],l[3],3)));
    body(g,lf,[6,0,54,47],C.gr,C.gd,C.lm,C.ol,2);
    for (const l of LV) LN(g,C.gd,l[0],l[1],Math.round(l[0]+Math.cos(l[2])*l[3]*0.75),Math.round(l[1]+Math.sin(l[2])*l[3]*0.75));
    // tendrils
    curl(g,49,29,1,cu); LN(g,C.lm,sx(31)+2,31,48,33);
    curl(g,11,24,-1,1-cu); LN(g,C.lm,sx(26)-1,26,12,28);
    curl(g,27,1,-1,cu); LN(g,C.lm,sx(6),6,27,5);
    // passion flower
    const fx0 = 41.5, fy0 = 19.5;
    const pets = [];
    for (let k = 0; k < 10; k++) pets.push(bladeF(fx0,fy0,k*0.6283+0.31+(fk&&k===8?0.3:0),(fk&&k===8)?9.4:7.8,1.9));
    const pf = any(...pets);
    body(g,pf,[32,10,51,29],C.wh,C.lg,null,C.ol,1);
    const dd = (x,y)=>{ const dx=x+0.5-fx0, dy=y+0.5-fy0; return dx*dx+dy*dy; };
    F(g,C.pu,36,14,47,25,(x,y)=>dd(x,y)<=4.8*4.8);
    F(g,C.li,36,14,47,25,(x,y)=>{ const d=dd(x,y); if (d>4.8*4.8||d<2.2*2.2) return false; return fl((Math.atan2(y+0.5-fy0,x+0.5-fx0)+Math.PI)/(Math.PI/6))%2===0; });
    R(g,C.yl,40,18,3,3); P(g,C.gr,41,19); P(g,C.cr,40,18);
    // fruits: a small one up high, a big one below with a face
    const fruit = (cx,cy,r)=>{
      const f = eF(cx,cy,r,r);
      F(g,C.ol,cx-r-2,cy-r-2,cx+r+2,cy+r+2,dil(f));
      F(g,C.pu,cx-r-1,cy-r-1,cx+r+1,cy+r+1,f);
      F(g,C.wn,cx-r-1,cy-r-1,cx+r+1,cy+r+1,(x,y)=>f(x,y)&&!f(x+2,y+2));
      F(g,C.li,cx-r-1,cy-r-1,cx+r+1,cy+r+1,(x,y)=>f(x,y)&&!f(x-1,y-1)&&y<cy&&x<cx);
    };
    LN(g,C.gd,sx(12)-1,12,21,12);
    fruit(20.5,16.5,4);
    S(g,18,12,['g.l.g','.ggg.']); P(g,C.wh,18,15);
    LN(g,C.gd,sx(23)-1,23,27,23);
    fruit(25.5,31.5,7.6);
    S(g,23,23,['g.l.g','.ggg.']);
    S(g,20,26,['.iii','ii..','i...']); P(g,C.wh,21,26); P(g,C.wh,20,27);
    eye(g,21,30,2,3); eye(g,28,30,2,3);
    R(g,C.pk,18,33,3,1); R(g,C.pk,30,33,3,1);
    S(g,23,34,['o...o','.ooo.','..r..'].map(r=>r));
  };

  // 7. Formiga Carregadeira
  CARD_ART['formiga-carregadeira'] = function(g,t){
    bgPomar(g,0);
    const lf = fl(t*4)%2, bob = fl(t*2)%2;
    // dirt path
    const pT = x=>37 + Math.round(Math.sin(x/6)), pB = x=>45 + Math.round(Math.sin(x/8+2));
    F(g,C.wo,0,35,63,47,(x,y)=>y>=pT(x)&&y<=pB(x)+1);
    F(g,C.st,0,35,63,47,(x,y)=>y>=pT(x)+1&&y<=pB(x));
    for (let i = 0; i < 8; i++) { const x = (i*13+hs(i,5)%9)%60+2, y = pT(x)+2+hs(i,3)%4; R(g,i%3?C.wo:C.cr,x,y,2-(i%2),1); }
    // two tiny ants far behind, in a row
    for (const ax of [1,9]) {
      const k = (lf + (ax>>3))%2;
      S(g,ax,33,['...gl','..ggg','....d','dd.dd', k ? 'd.d.d' : '.d.d.']);
    }
    // ground shadow
    E(g,C.wo,30,42.5,14,1.3);
    // legs on the far side (shadowed)
    const LA = [[[32,35],[36,38],[38,42]],[[29,36],[29,39],[27,42]],[[26,35],[23,38],[19,42]]];
    const LB = [[[32,35],[34,39],[34,42]],[[29,36],[31,39],[31,42]],[[26,35],[24,38],[23,42]]];
    for (const l of (lf?LB:LA)) { LN(g,C.sd,l[0][0]+2,l[0][1],l[1][0]+2,l[1][1]-1); LN(g,C.sd,l[1][0]+2,l[1][1]-1,l[2][0]+2,l[2][1]-1); }
    // body: gaster, petiole, thorax, big head
    const ant = any(eF(19,33.5,5.6,4.6), eF(25,34,1.7,1.5), eF(29.5,33,4.2,3), eF(38.5,29.5,5.6,5.2));
    body(g,ant,[12,23,45,39],C.rd,C.wn,null,C.ol,2);
    F(g,C.or,12,23,45,39,(x,y)=>ant(x,y)&&!ant(x-1,y-1)&&!ant(x,y-2));
    R(g,C.wn,17,30,1,6); R(g,C.wn,21,30,1,7);
    S(g,15,30,['.WW','W..']); S(g,35,26,['WW','W.']);
    S(g,27,29,['o.o.o','.o.o.']);
    // near legs
    for (const l of (lf?LA:LB)) { LN(g,C.ol,l[0][0],l[0][1],l[1][0],l[1][1]); LN(g,C.ol,l[1][0],l[1][1],l[2][0],l[2][1]); R(g,C.ol,l[2][0],l[2][1],2,1); }
    // face: big eye, rosy cheek, determined little grin, jaws on the leaf stalk
    eye(g,39,26,3,3);
    R(g,C.ol,38,25,4,1);
    P(g,C.pk,38,30); P(g,C.pk,39,30);
    S(g,41,31,['o.','.o']);
    // antennae
    LN(g,C.ol,40,24,42,20); LN(g,C.ol,42,20,47,19); R(g,C.ol,47,18,2,2);
    LN(g,C.ol,42,25,45,22); LN(g,C.ol,45,22,50,23); R(g,C.ol,50,22,2,2);
    // the leaf: bigger than the ant, held high over its head
    const lfF = (x,y)=>rE(33,13.5+bob,13.5,8.2,0.3)(x,y) && !inE(x,y,21.5,5.5+bob,3.6,3.4) && !inE(x,y,27.5,3.5+bob,2.6,2.6);
    LN(g,C.ol,45,21+bob,45,28); LN(g,C.gd,44,21+bob,44,28);
    body(g,lfF,[16,2,50,26],C.gr,C.gd,C.lm,C.ol,2);
    LN(g,C.gd,21,10+bob,45,18+bob);
    for (const v of [[26,12,28,7],[26,12,24,16],[32,14,34,8],[32,14,30,19],[38,16,40,11],[38,16,36,21]]) LN(g,C.gd,v[0],v[1]+bob,v[2],v[3]+bob);
    S(g,43,28,['ood','oo.']);
  };

  // 8. Cipó Enrolado (feitiço)
  CARD_ART['cipo-enrolado'] = function(g,t){
    bgPomar(g,4,{can:[[3,1,7],[61,1,7]]});
    const cu = fl(t*2)%2, ph = fl(t*2)%2;
    const vine = (pts,r,dark,flat)=>{
      const f = tubeF(pts,r), b = box(pts); b[0]-=r; b[1]-=r; b[2]+=r; b[3]+=r;
      F(g,C.ol,b[0]-1,b[1]-1,b[2]+1,b[3]+1,dil(f));
      F(g,dark?C.td:C.gr,b[0],b[1],b[2],b[3],f);
      if (!dark && !flat) F(g,C.gd,b[0],b[1],b[2],b[3],(x,y)=>f(x,y)&&!f(x,y+2));
      if (!dark) F(g,C.lm,b[0],b[1],b[2],b[3],(x,y)=>f(x,y)&&!f(x,y-1));
    };
    // helix coiling up around the legs, split into back (upper) and front (lower) strands
    const CX = 43, RX = 12.5, RY = 3.6, YB = 41, KP = 9/(2*Math.PI);
    const strands = []; let cur = null, side = -1;
    for (let th = Math.PI*0.5; th <= Math.PI*3.55; th += Math.PI/8) {
      const x = CX + RX*Math.cos(th), y = YB - KP*th + RY*Math.sin(th), fr = Math.sin(th) > -0.05 ? 1 : 0;
      if (fr !== side) { if (cur) cur.p.push(x,y); cur = {p: cur ? [cur.p[cur.p.length-4],cur.p[cur.p.length-3]] : [], fr}; strands.push(cur); side = fr; }
      cur.p.push(x,y);
    }
    for (const st of strands) if (!st.fr && st.p.length >= 4) vine(st.p,2,1);
    // the caught creature: a dark bull silhouette, legs bound
    for (const lx of [35,40,48,52]) { R(g,C.ol,lx-1,21,5,23); R(g,C.sd,lx,21,3,22); R(g,C.ol,lx-1,42,5,2); }
    const beast = any(eF(45,18.5,11,6.2), eF(37,15.5,5,5));
    F(g,C.ol,25,8,57,26,dil(beast));
    F(g,C.sd,26,9,56,25,beast);
    F(g,C.wn,26,9,56,25,(x,y)=>beast(x,y)&&!beast(x,y-1)&&x<52);
    S(g,55,15,['o...','.o..','..o.','..o.','..o.','.ooo','.oso','..o.']);
    // startled head, turned to us: horns, wide eyes, nose ring
    S(g,19,6,[
      'oo...........oo',
      'oLo.........oLo',
      'oLYo.......oLYo',
      '.oLYo.....oLYo.',
      '..oLYoooooLYo..',
      '.oonnnnnnnnnoo.',
      'oonsssssssssnoo',
      'osWWsssssssWWso',
      'osWWosssssoWWso',
      '.osssssssssssso',
      '..osssssssssso.',
      '..osnnnnnnnso..',
      '..onoonnnoono..',
      '...onnyyyyno...',
      '....ooyooyo....',
      '......yyyy.....'
    ]);
    P(g,C.wh,20,13); P(g,C.wh,32,13);
    S(g,14,12,['W','W','W','.','W']); S(g,11,14,['.W','.W','..','.W']); S(g,36,4,['.k.','kkk','kWk','.k.']);
    // the stalk bursting from the ground, the front strands, two whipping arms
    vine([41,48, 42,45],2.6);
    for (const st of strands) if (st.fr && st.p.length >= 4) vine(st.p,2.2,0);
    vine([30.5,25, 20,29, 11,26, 8,20],1.7,0,1);
    vine([55.5,23, 59,18, 59,13],1.6,0,1);
    curl(g,8,15,1,cu); curl(g,60,10,-1,1-cu);
    // leaves sprouting on the vines + thorns
    const LV = [['.ll','lgg','gG.'],['ll.','ggl','.Gg'],['gl.','Ggl','.GG']];
    S(g,14,30,LV[1]); S(g,5,22,LV[0]); S(g,31,40,LV[2]); S(g,59,24,LV[1]);
    for (const p of [[33,38],[53,37],[35,30],[51,29],[19,31],[9,24],[60,19],[45,45],[24,27]]) P(g,C.lm,p[0],p[1]);
    // leaves torn off, flying
    for (const p of [[3,36,0],[46,3,1],[27,2,0]]) S(g,p[0]+(p[2]?ph:-ph),p[1]+ph,LV[p[2]]);
    // ground burst
    for (const c of [[29,42],[55,44],[24,37],[60,40]]) { R(g,C.ol,c[0],c[1],3,2); R(g,C.wo,c[0],c[1],2,1); }
    S(g,35,46,['d..d....d','.d......d']);
    // magic glints
    if (cu) { spark(g,C.pk,5,8+2); P(g,C.li,50,6); } else { spark(g,C.li,15,44); P(g,C.pk,4,44); }
  };

  // 9. Louva-a-Deus
  CARD_ART['louva-a-deus'] = function(g,t){
    bgPomar(g,0);
    const tl = (t%2.4) > 1.2 ? 1 : 0, sw = [0,1,0,-1][fl(t*2.5)%4];
    // blossoms all over the canopy
    for (const p of [[4,6],[17,3],[28,5],[46,3],[58,7],[35,4]]) S(g,p[0]-1,p[1]-1,['.p.','pWp','.p.']);
    // blossoming branch
    const br = tubeF([-2,43, 16,41, 34,40, 50,38, 66,36],1.7);
    body(g,br,[0,33,63,47],C.wo,C.wd,C.st,C.ol,1);
    S(g,52,30,['....o','...od','..od.','.od..','od...']);
    for (const p of [[58,29],[7,40],[20,44],[47,36]]) { S(g,p[0]-1,p[1]-1,['.p.','pyp','.p.']); P(g,C.wh,p[0]-1,p[1]-1); }
    S(g,55,25,['.gl','ggl','gg.']); S(g,11,36,['ll.','glg','.gg']);
    // far legs (shadowed)
    LN(g,C.gd,32,34,29,38); LN(g,C.gd,29,38,29,40);
    LN(g,C.gd,38,35,44,37); LN(g,C.gd,44,37,46,39);
    // abdomen + folded wings
    const ab = bladeF(30,33,0.24,23,3.8);
    body(g,ab,[28,26,55,43],C.lm,C.gr,null,C.ol,2);
    const wg = bladeF(31,31.5,0.2,20,2.6);
    F(g,C.gr,28,26,55,43,wg);
    F(g,C.gd,28,26,55,43,(x,y)=>wg(x,y)&&!wg(x,y+1));
    LN(g,C.lm,33,31,45,33);
    // near legs
    LN(g,C.ol,31,35,27,38); LN(g,C.ol,27,38,26,40); LN(g,C.gr,31,34,28,37);
    LN(g,C.ol,36,36,40,38); LN(g,C.ol,40,38,40,40); LN(g,C.gr,36,35,39,37);
    // long neck (prothorax)
    const hx = tl;
    const nk = tubeF([31,33, 30,25, 29+hx,18],1.1);
    body(g,nk,[25,15,35,37],C.lm,C.gr,null,C.ol,1);
    // raptorial forelegs folded up in "prayer" (far one first)
    const leg = (dx,dy,c1,c2)=>{
      const fm = any(tubeF([29+dx,23+dy, 25+dx,27+dy],1.1), tubeF([25+dx,27+dy, 22+dx,16+dy],1.4));
      const tb = tubeF([22+dx,16+dy, 18.5+dx,23+dy],0.75);
      const f = any(fm,tb);
      F(g,C.ol,14,11,36,32,dil(f));
      F(g,c1,14,11,36,32,f);
      F(g,c2,14,11,36,32,(x,y)=>fm(x,y)&&!fm(x+1,y));
      // spines + claw hook
      for (const p of [[20,20],[19,22],[21,18]]) P(g,C.gd,p[0]+dx+1,p[1]+dy);
      R(g,C.ol,17+dx,23+dy,2,1); P(g,C.ol,17+dx,22+dy);
    };
    leg(4,-1,C.gr,C.gd);
    leg(0,0,C.lm,C.gr);
    // triangular head, eyes set wide at the corners, tilting
    const hd = any(pF([24+hx,10, 35+hx,10, 30+hx,19]), eF(24.5+hx,11,2.6,3), eF(34.5+hx,11,2.6,3));
    body(g,hd,[20,6,39,21],C.lm,C.gr,null,C.ol,1);
    for (const ex of [23+hx,33+hx]) { R(g,C.yl,ex,9,3,4); R(g,C.ol,ex,10,2,2); P(g,C.wh,ex,10); P(g,C.cr,ex+2,9); }
    R(g,C.gr,28+hx,11,4,1); P(g,C.pk,27+hx,14); P(g,C.pk,33+hx,14);
    S(g,29+hx,16,['oo','pp']);
    // antennae (sway)
    LN(g,C.ol,28+hx,9,25+sw,3); LN(g,C.ol,25+sw,3,23+sw,2);
    LN(g,C.ol,31+hx,9,36+sw,3); LN(g,C.ol,36+sw,3,39+sw,2);
  };

  // 10. Abelha Rainha (épica)
  CARD_ART['abelha-rainha'] = function(g,t){
    bgPomar(g,5,{noCanopy:true});
    const sh = fl(t*6)%2, b1 = fl(t*2)%2, b2 = 1-b1, sp = fl(t*3)%4;
    // cream halo behind her (yellow rim, dithered edge) + golden rays
    for (const r of [[19,5,16,2],[45,5,48,2]]) LN(g,C.yl,r[0],r[1],r[2],r[3]);
    R(g,C.yl,8,12,5,1); R(g,C.yl,51,12,5,1); R(g,C.yl,31,0,2,2);
    const hc = eF(32,15,14,12.5);
    F(g,C.cr,16,0,48,30,(x,y)=>hc(x,y)&&y<26);
    for (let x = 19; x < 46; x += 3) { const dy = 12.5*Math.sqrt(Math.max(0,1-((x+0.5-32)/14)**2)); P(g,C.yl,x,fl(15.5-dy)); }
    // honeycomb throne: hex cells (5x3) with 1px walls
    const th = (x,y)=>y>=34&&y<=46&&x>=12&&x<=51&&!(y===34&&(x<14||x>49));
    F(g,C.ol,11,33,52,47,dil(th));
    F(g,C.or,12,34,51,46,th);
    for (let j = 0; j < 3; j++) for (let i = -1; i < 8; i++) {
      const cx = 14 + i*6 + (j%2)*3, cy = 37 + j*3;
      if (cx < 13 || cx > 50) continue;
      const v = hs(i+3,j)%6, c = v===0?C.st:(v===1?C.wo:C.yl);
      R(g,c,cx-1,cy-1,3,1); R(g,c,cx-2,cy,5,1); R(g,c,cx-1,cy+1,3,1);
      if (v===5) P(g,C.cr,cx-1,cy-1);
    }
    R(g,C.cr,12,34,40,1); R(g,C.wo,12,45,40,2); R(g,C.wd,12,46,40,1);
    // wings: sky with a white checker shimmer at the tips, lilac rim
    const wL = any(rE(19,16,9.5,5,-0.4), rE(21,24,6,3,0.35)), wR = any(rE(45,16,9.5,5,0.4), rE(43,24,6,3,-0.35));
    for (const w of [wL,wR]) {
      F(g,C.li,8,9,56,29,dil(w));
      F(g,C.sk,8,9,56,29,w);
    }
    for (let y = 12; y < 20; y++) for (let x = 11+((y+sh)&1); x < 54; x += 2) if ((x<19||x>45) && wL(x,y)!==wR(x,y) && (wL(x-1,y-1)||wR(x+1,y-1))) P(g,C.wh,x,y);
    R(g,C.wh,21+sh,15,5,1); R(g,C.wh,38-sh,15,5,1);
    // plump striped body
    const abd = eF(32,30,9,8);
    const strp = y=>y===28||y===29||y===33||y===34||y===37;
    F(g,C.ol,21,21,43,39,dil(abd));
    F(g,C.yl,22,22,42,38,abd);
    F(g,C.or,22,22,42,38,(x,y)=>abd(x,y)&&!abd(x+2,y+2)&&!strp(y));
    F(g,C.ol,22,22,42,38,(x,y)=>abd(x,y)&&strp(y));
    F(g,C.cr,22,22,42,38,(x,y)=>abd(x,y)&&!abd(x-1,y-1)&&y<28);
    S(g,31,38,['oo','.o']);
    // royal fur collar
    const col = eF(32,22.5,8.5,3.2);
    F(g,C.ol,22,18,42,27,dil(col));
    F(g,C.cr,22,18,42,27,col);
    F(g,C.st,22,18,42,27,(x,y)=>col(x,y)&&!col(x+1,y+1));
    for (const p of [[26,22],[30,23],[34,22],[38,23]]) P(g,C.ol,p[0],p[1]);
    // arms: one on her hip, one holding the honey-dipper scepter
    S(g,19,24,['..oo','.oyo','oyo.','.oo.']);
    R(g,C.ol,45,14,2,25); R(g,C.wo,46,14,1,24); P(g,C.st,46,15);
    const dp = eF(46,11.5,2.6,3.6);
    F(g,C.ol,42,6,50,16,dil(dp)); F(g,C.or,42,7,50,16,dp);
    R(g,C.wo,44,10,4,1); R(g,C.wo,44,13,4,1); P(g,C.yl,44,9); P(g,C.cr,44,11);
    const dr = fl(t*1.5)%3;
    R(g,C.or,46,16,1,1+dr); P(g,C.yl,46,16);
    S(g,40,24,['oo...','oyoo.','.ooyo','...oo']);
    // head
    const hd = eF(32,14.5,6.6,5.6);
    F(g,C.ol,24,7,40,22,dil(hd));
    F(g,C.yl,24,8,40,21,hd);
    F(g,C.or,24,8,40,21,(x,y)=>hd(x,y)&&!hd(x+2,y+1));
    F(g,C.cr,24,8,40,21,(x,y)=>hd(x,y)&&!hd(x-1,y-1));
    // face: lashes, kind eyes, rosy cheeks, smile
    eye(g,28,13,2,3); eye(g,34,13,2,3);
    P(g,C.ol,27,12); P(g,C.ol,36,12);
    R(g,C.pk,26,17,2,1); R(g,C.pk,36,17,2,1);
    S(g,30,17,['o..o','.oo.']);
    // antennae + crown with a ruby
    S(g,22,4,['oo.','oo.','..o','...o']); S(g,39,4,['.oo','.oo','o..','...'].map(r=>r)); P(g,C.ol,38,7);
    S(g,26,3,[
      '..o..o..o..',
      '.oyooyooyo.',
      '.oyyyyyyyo.',
      '.oyyyrryyo.',
      '.oOOOrrOOo.',
      '..ooooooo..'
    ].map(r=>r+'..'));
    P(g,C.cr,28,5); P(g,C.wh,31,6);
    if (sp===0) spark(g,C.wh,31,1);
    // drones flanking her, bobbing out of phase
    const DR = ['..kk.kk.','..kWkWk.','.oyyoyyo','oWoyyoyo','oooyyoyo','..ooooo.'];
    S(g,3,22+b1,DR); S(g,53,22+b2,DR,true);
    // sparkles
    const SP = [[10,31],[54,32],[20,3],[44,3],[7,13],[57,13]];
    for (let i = 0; i < SP.length; i++) { const k = (sp+i)%4; if (k===0) spark(g,C.wh,SP[i][0],SP[i][1]); else if (k===1) P(g,C.cr,SP[i][0],SP[i][1]); }
  };

  // ======================================================== BREJO
  // 12. Vaga-lume Piscante
  CARD_ART['vaga-lume-piscante'] = function(g,t){
    bgBrejo(g,2,{sparse:true});
    const fr = fl(t/0.3)%3, br = fr!==1, wf = fl(t*8)%2;
    flies(g,t,[[8,12],[57,11],[11,27],[54,26]]);
    // lantern glow halo (dithered lime over the night)
    const lx = 45.5, ly = 30.5, rr = br ? 10 : 6.5;
    for (let y = fl(ly-rr); y <= ly+rr; y++) for (let x = fl(lx-rr)+((y+1)&1); x <= lx+rr; x += 2) if (inE(x,y,lx,ly,rr,rr*0.85)) P(g, inE(x,y,lx,ly,rr*0.78,rr*0.66)?C.lm:C.tq, x, y);
    // reflection on the water
    if (br) { R(g,C.lm,42,41,7,1); R(g,C.yl,44,43,3,1); R(g,C.lm,43,45,5,1); } else { R(g,C.gr,43,42,4,1); }
    // flight wings (blur)
    const fw = wf ? [bladeF(31,20,-1.25,11,2.8), bladeF(34,20,-0.8,12,2.8)] : [bladeF(31,20,-1.8,10,2.8), bladeF(34,20,-1.4,11,2.8)];
    for (const w of fw) { for (let y = 7; y < 22; y++) for (let x = 26+((y+wf)&1); x < 48; x += 2) if (w(x,y)) P(g,C.sk,x,y); }
    // legs
    LN(g,C.ol,29,30,27,34); LN(g,C.ol,32,31,31,35); LN(g,C.ol,35,32,36,35);
    // body: thorax + abdomen, ending in the lantern
    const ab = any(eF(30.5,25.5,5,4.4), eF(37,28.5,6,4.6));
    body(g,ab,[24,20,44,34],C.sd,C.ol,C.wd,C.ol,2);
    R(g,C.ol,35,32,1,2); R(g,C.ol,38,32,1,2);
    const ln = eF(lx,ly,4.8,4.3);
    F(g,C.ol,39,25,52,36,dil(ln));
    F(g,br?C.yl:C.lm,40,26,51,35,ln);
    F(g,br?C.lm:C.gr,40,26,51,35,(x,y)=>ln(x,y)&&!ln(x+2,y+2));
    if (br) { R(g,C.cr,43,28,3,2); R(g,C.wh,43,28,2,1); } else P(g,C.yl,43,28);
    R(g,C.ol,41,27,1,7);
    // white folded wings on the back
    const wg = bladeF(27,20.5,0.4,16,3.2);
    body(g,wg,[23,15,44,31],C.wh,C.lg,null,C.ol,1);
    LN(g,C.lg,29,21,39,25);
    // head: red cap, big shiny eyes
    const hd = eF(22.5,24.5,6,5.2);
    F(g,C.ol,15,18,30,31,dil(hd));
    F(g,C.sd,16,19,29,30,hd);
    const cap = (x,y)=>inE(x,y,23.5,21,6.8,4.6)&&y<=22;
    F(g,C.ol,15,15,32,23,(x,y)=>dil(cap)(x,y)&&!hd(x,y));
    F(g,C.rd,16,16,31,22,cap);
    F(g,C.wn,16,16,31,22,(x,y)=>cap(x,y)&&(y===22||!cap(x+2,y+1)));
    F(g,C.pk,16,16,31,22,(x,y)=>cap(x,y)&&!cap(x-1,y-1));
    R(g,C.ol,26,18,2,2); P(g,C.yl,19,22);
    const EY = ['.cc.','cWoc','cooc','.cc.'];
    S(g,17,23,EY); S(g,23,23,EY);
    R(g,C.pk,16,27,2,1); R(g,C.pk,27,27,1,1);
    S(g,20,28,['p..p','.pp.']);
    // antennae with glowing tips
    LN(g,C.ol,20,16,17,11); LN(g,C.ol,25,16,27,11); P(g,C.lm,16,10); P(g,C.lm,28,10);
  };

  // 15. Sucuri do Charco (épica)
  CARD_ART['sucuri-do-charco'] = function(g,t){
    bgBrejo(g,2,{sparse:true});
    const tg = (t%1.5) > 1.15, bl = (t%4.6) > 4.3;
    // moon glow on the mist + fireflies
    E(g,C.lg,23,6,3.2,3.2); P(g,C.cr,22,5); P(g,C.gy,24,7); P(g,C.gy,22,8);
    flies(g,t,[[6,12],[60,12],[60,26],[3,25],[13,22],[30,23]]);
    // lily pads
    const pad = (cx,cy,rx,flw)=>{
      const f = (x,y)=>inE(x,y,cx,cy,rx,rx*0.4) && !(y>=cy && x>=cx && x<=cx+1);
      F(g,C.ol,cx-rx-2,cy-4,cx+rx+2,cy+4,dil(f));
      F(g,C.gd,cx-rx-1,cy-3,cx+rx+1,cy+3,f);
      F(g,C.gr,cx-rx-1,cy-3,cx+rx+1,cy+3,(x,y)=>f(x,y)&&!f(x,y-1));
      if (flw) S(g,cx-3,cy-3,['.p.p.','ppWpp','.pyp.']);
    };
    // the body rising out of the water in three thick loops, then the neck
    const WL = 41;
    const arch = (cx,Rr,r)=>(x,y)=>{ const dx=x+0.5-cx, dy=y+0.5-WL; const d=Math.sqrt(dx*dx+dy*dy); return y < WL && Math.abs(d-Rr) <= r; };
    const AR = [[9.5,6,2.3],[24.5,8.6,3.2],[40.5,7,2.9]];
    const neck = tubeF([52,42, 54,35, 52,28, 48,23, 44,20],3);
    const snake = (A,lite)=>{
      const f = A, bx = [0,18,63,WL];
      F(g,C.ol,bx[0],bx[1],bx[2],bx[3],(x,y)=>dil(f)(x,y)&&y<WL);
      F(g,C.gr,bx[0],bx[1],bx[2],bx[3],f);
      F(g,C.gd,bx[0],bx[1],bx[2],bx[3],(x,y)=>f(x,y)&&!f(x+1,y+2));
      F(g,C.lm,bx[0],bx[1],bx[2],bx[3],(x,y)=>f(x,y)&&!f(x,y-1)&&(lite||!f(x-1,y-1)));
    };
    for (const A of AR) {
      const f = arch(A[0],A[1],A[2]);
      snake(f,1);
      // belly (inner edge) and oval spots
      F(g,C.lm,A[0]-A[1],WL-A[1],A[0]+A[1],WL,(x,y)=>f(x,y)&&!f(x,y+1)&&y<WL-1&&Math.abs(x+0.5-A[0])<A[1]-1);
      for (let k = 1; k < 4; k++) { const a = Math.PI*k/4, x = Math.round(A[0]-Math.cos(a)*A[1]), y = Math.round(WL-Math.sin(a)*A[1]); R(g,C.ol,x-1,y,3,1); P(g,C.ol,x,y-1); P(g,C.gd,x,y); }
    }
    snake(neck,0);
    F(g,C.lm,44,20,58,42,(x,y)=>neck(x,y)&&!neck(x-1,y)&&!neck(x-1,y+1)&&y>24);
    for (const p of [[54,37],[51,28],[47,23]]) { R(g,C.ol,p[0]-1,p[1],3,1); P(g,C.ol,p[0],p[1]-1); }
    // moonlight sheen
    for (const p of [[8,35],[21,30],[37,33],[53,30],[49,24]]) R(g,C.wh,p[0],p[1],2,1);
    // water lapping where the loops dip in
    R(g,C.td,0,WL,64,48-WL);
    for (const x of [3,15,18,33,35,48,50,57]) R(g,C.tq,x-1,WL,4,1);
    R(g,C.tq,9,43,6,1); R(g,C.tq,20,43,8,1); R(g,C.tq,38,43,7,1); R(g,C.sk,22,45,2,1); R(g,C.sk,44,46,2,1);
    pad(58,45,4.5,1); pad(31,46,4); pad(4,45,3.5);
    // tiny unafraid frog sitting on the big loop
    S(g,21,25,['.oo.oo.','olWolWo','olllllo','ogllllo','.oo.oo.']);
    // big head, raised, three-quarter view facing left
    const hd = any(eF(42.5,14.5,7.4,4.8), eF(37,16.5,5.5,3.4));
    F(g,C.ol,29,8,51,22,dil(hd));
    F(g,C.gr,30,9,50,21,hd);
    F(g,C.gd,30,9,50,21,(x,y)=>hd(x,y)&&!hd(x+1,y+2));
    F(g,C.lm,30,9,50,21,(x,y)=>hd(x,y)&&!hd(x-1,y-1));
    R(g,C.lm,33,18,10,1); R(g,C.lm,35,19,6,1);
    R(g,C.ol,32,17,12,1); P(g,C.ol,44,16); P(g,C.ol,31,16);
    P(g,C.ol,33,15); P(g,C.ol,35,14);
    R(g,C.ol,43,11,2,1); P(g,C.ol,47,13); P(g,C.ol,40,10);
    // sleepy half-lidded golden eyes
    for (const ex of [36,44]) {
      if (bl) R(g,C.ol,ex,13,4,1);
      else { R(g,C.ol,ex,11,4,1); R(g,C.gd,ex,12,4,1); R(g,C.yl,ex,13,4,1); P(g,C.ol,ex+1,13); P(g,C.wh,ex+3,13); R(g,C.ol,ex,14,4,1); }
    }
    // forked tongue flick
    if (tg) { R(g,C.rd,32,18,1,2); P(g,C.rd,31,20); P(g,C.rd,33,20); P(g,C.rd,30,21); P(g,C.rd,34,21); }
    else P(g,C.rd,32,18);
  };

  // ======================================================== NEUTRO
  // 22. Dança da Chuva (feitiço)
  CARD_ART['danca-da-chuva'] = function(g,t){
    const s = fl(t*10), sw = fl(t*2)%2;
    // rainy yard seen through the barn doors
    R(g,C.nt,0,0,64,10); R(g,C.bl,0,10,64,24);
    for (let x = 0; x < 64; x += 4) P(g,C.nt,x+((x>>2)&1)*2,10);
    R(g,C.gd,0,30,64,4);
    for (let x = 0; x < 64; x += 3) P(g,C.gr,x,30+(hs(x,2)%2));
    R(g,C.wo,0,34,64,14); R(g,C.wd,0,34,64,1);
    for (const p of [[14,40,6],[36,44,8],[47,38,5]]) { R(g,C.bl,p[0],p[1],p[2],1); R(g,C.wd,p[0]+1,p[1]+1,p[2]-2,1); P(g,C.sk,p[0]+1,p[1]); }
    // rainbow arc behind the cloud
    const RB = [C.rd,C.or,C.yl,C.gr,C.sk,C.li];
    for (let i = 0; i < 6; i++) { const r = 24-i; F(g,RB[i],9,6,55,33,(x,y)=>{ const dx=x+0.5-32, dy=y+0.5-34; const d=dx*dx+dy*dy; return d<=r*r && d>(r-1)*(r-1) && y<33; }); }
    // rain: drops scroll down 1px every 0.1 s
    for (let k = 0; k < 24; k++) {
      const x = 12 + (k*5 + hs(k,3)%4) % 41, y0 = 19 + (hs(k,9)%22);
      const y = 19 + ((y0 - 19 + s) % 22);
      R(g, k%3 ? C.sk : C.wh, x, y, 1, 2); P(g,C.bl,x,y+2);
      if (y >= 38) { P(g,C.sk,x-1,40); P(g,C.sk,x+1,40); }
    }
    // sprouts popping from the ground
    for (const p of [[16,38],[25,42],[41,40],[49,43],[33,37]]) S(g,p[0]-1,p[1]-2,['l.l','.l.','.g.']);
    // happy rain cloud (sways)
    const cx = 32 + sw;
    const cl = any(eF(cx-8,13,7,5), eF(cx,9,8.5,6.5), eF(cx+8.5,12,7,5.5), eF(cx,15,13,4));
    F(g,C.ol,15,1,50,20,(x,y)=>dil(cl)(x,y)&&!cl(x,y));
    F(g,C.lg,16,2,49,19,cl);
    F(g,C.gy,16,2,49,19,(x,y)=>cl(x,y)&&!cl(x,y+2));
    F(g,C.wh,16,2,49,19,(x,y)=>cl(x,y)&&!cl(x-1,y-1)&&y<12);
    eye(g,cx-5,10,2,3); eye(g,cx+3,10,2,3);
    R(g,C.pk,cx-8,14,2,1); R(g,C.pk,cx+6,14,2,1);
    S(g,cx-3,13,['o....o','.oooo.','..rr..']);
    // barn doors swung open (dark planks frame the scene)
    for (const x0 of [0,54]) {
      R(g,C.ol,x0,0,10,48);
      for (let i = 0; i < 3; i++) R(g, i%2?C.sd:C.wd, x0+(x0?1:0)+i*3, 0, 2, 48);
      LN(g,C.wo,x0+1,6,x0+8,16); LN(g,C.wo,x0+1,30,x0+8,40);
      R(g,C.wo,x0+(x0?1:0),5,9,1); R(g,C.wo,x0+(x0?1:0),41,9,1);
      P(g,C.yl,x0?55:8,23); P(g,C.ol,x0?55:8,24);
    }
    R(g,C.ol,0,0,64,2); R(g,C.sd,10,2,44,1);
    R(g,C.wo,10,45,44,3); R(g,C.st,10,45,44,1);
  };

  // ======================================================== FICHAS
  // T2. Zangão
  CARD_ART['zangao'] = function(g,t){
    bgPomar(g,1);
    const wf = fl(t*10)%2;
    for (const p of [[9,25],[55,24],[48,40],[12,42],[30,44]]) { S(g,p[0]-1,p[1]-1,['.p.','pyp','.p.']); P(g,C.wh,p[0]-1,p[1]-1); }
    E(g,C.gd,33,44,7,1.2);
    // motion streaks
    R(g,C.cr,49,22,5,1); R(g,C.cr,51,26,6,1); R(g,C.cr,48,31,4,1);
    // far wing
    const w2 = wf ? bladeF(31,21,-1.05,11,3) : bladeF(31,21,-0.55,10,2.6);
    F(g,C.ol,20,6,48,26,(x,y)=>dil(w2)(x,y)&&!w2(x,y)); F(g,C.sk,20,6,48,26,w2);
    // abdomen with stripes
    const ab = eF(38,27.5,7.6,6.4);
    const strp = x=>x===36||x===37||x===41||x===42;
    F(g,C.ol,29,20,47,35,dil(ab));
    F(g,C.yl,30,21,46,34,ab);
    F(g,C.ol,30,21,46,34,(x,y)=>ab(x,y)&&strp(x));
    F(g,C.or,30,21,46,34,(x,y)=>ab(x,y)&&!ab(x+1,y+2)&&!strp(x));
    F(g,C.cr,30,21,46,34,(x,y)=>ab(x,y)&&!ab(x,y-1)&&!strp(x));
    // fuzzy thorax
    const tx = eF(28.5,25,5.4,5.2);
    F(g,C.ol,22,18,35,32,dil(tx));
    F(g,C.wd,22,19,34,31,tx);
    F(g,C.sd,22,19,34,31,(x,y)=>tx(x,y)&&!tx(x+2,y+2));
    for (const p of [[25,20],[28,19],[31,20],[33,23],[24,23],[27,22],[30,24]]) P(g,(p[0]+p[1])%2?C.wo:C.sd,p[0],p[1]);
    for (const p of [[23,18],[27,17],[32,18],[35,21]]) P(g,C.sd,p[0],p[1]);
    // legs dangling, with a pollen ball
    LN(g,C.ol,27,30,26,34); LN(g,C.ol,30,30,31,34); LN(g,C.ol,33,29,35,32);
    R(g,C.ol,24,34,4,3); R(g,C.yl,25,34,2,2); P(g,C.cr,25,34);
    // head, big drone eye
    const hd = eF(20.5,24.5,5.4,5.2);
    F(g,C.ol,14,18,27,31,dil(hd));
    F(g,C.yl,15,19,26,30,hd);
    F(g,C.or,15,19,26,30,(x,y)=>hd(x,y)&&!hd(x+1,y+2));
    R(g,C.ol,18,21,4,5); R(g,C.ol,19,20,3,1); P(g,C.wh,18,21); P(g,C.wh,19,22); P(g,C.sk,21,21);
    R(g,C.pk,16,26,2,1);
    S(g,16,28,['o..','.oo']);
    // antennae
    LN(g,C.ol,21,19,20,15); LN(g,C.ol,20,15,16,13); R(g,C.ol,15,12,2,2);
    LN(g,C.ol,23,19,25,14); LN(g,C.ol,25,14,24,11); R(g,C.ol,23,10,2,2);
    // near wing
    const w1 = wf ? bladeF(29,20,-1.4,12,3.4) : bladeF(29,20,-0.85,12,3);
    F(g,C.ol,16,4,46,26,(x,y)=>dil(w1)(x,y)&&!w1(x,y));
    F(g,C.sk,16,4,46,26,w1);
    F(g,C.wh,16,4,46,26,(x,y)=>w1(x,y)&&!w1(x-1,y-1));
    if (wf) R(g,C.wh,30,13,1,4); else R(g,C.wh,33,15,4,1);
  };

  // ======================================================== RETRATO
  // Tia Cocada (rival, Pomar). Face inside the 40x40 hero crop (x 12-51, y 4-43).
  CARD_ART['rival-cocada'] = function(g,t){
    bgPomar(g,1,{can:[[2,15,6],[62,15,6]]});
    const bl = (t%3.3) > 3.14, gl = fl(t*2.5)%4;
    // fair stall: bunting, striped awning, posts, counter
    R(g,C.wd,0,1,16,1); R(g,C.wd,16,2,32,1); R(g,C.wd,48,1,16,1);
    const FL = [C.rd,C.yl,C.bl,C.gr,C.pk];
    for (let i = 0; i < 11; i++) { const x = 1+i*6, y = (x>=16&&x<48)?3:2, c = FL[i%5]; R(g,c,x,y,4,1); R(g,c,x+1,y+1,2,1); }
    R(g,C.ol,4,8,2,26); R(g,C.wo,4,8,1,26); R(g,C.ol,58,8,2,26); R(g,C.wo,58,8,1,26);
    R(g,C.ol,0,7,64,1);
    for (let i = 0; i < 16; i++) { const c = i%2?C.cr:C.rd; R(g,c,i*4,8,4,4); R(g,c,i*4+1,12,2,1); }
    R(g,C.wn,0,11,64,1);
    R(g,C.ol,0,31,64,3); R(g,C.wo,0,31,64,1);
    // jars of doce on the counter
    for (const j of [[7,25,C.or],[13,26,C.rd],[47,26,C.yl],[53,25,C.or]]) { R(g,C.ol,j[0]-1,j[1]-1,6,7); R(g,j[2],j[0],j[1]+1,4,5); R(g,C.cr,j[0],j[1],4,1); P(g,C.wh,j[0],j[1]+2); }
    // round body: red dress with a lilac apron
    const bd = pF([5,48, 8,39, 19,33, 45,33, 56,39, 59,48]);
    body(g,bd,[5,32,59,48],C.rd,C.wn,null,C.ol,2);
    PG(g,C.ol,[20,48, 22,37, 42,37, 44,48]); PG(g,C.li,[21,48, 23,38, 41,38, 43,48]);
    R(g,C.wh,23,38,18,1); R(g,C.pu,40,39,2,9);
    // neck
    R(g,C.ol,27,29,10,5); R(g,C.wo,28,29,8,5); R(g,C.wd,34,29,2,5);
    // head
    const hd = eF(32,22.5,9.4,8.6);
    F(g,C.ol,21,13,43,32,dil(hd));
    F(g,C.wo,22,14,42,31,hd);
    F(g,C.wd,22,14,42,31,(x,y)=>hd(x,y)&&!hd(x+2,y+1));
    // headscarf (pink, white dots) wrapped round with a big knot on top
    const sc = (x,y)=>(inE(x,y,32,18,11,7.4) && y<=17+((x>23&&x<41)?0:3)) || inE(x,y,32,9.5,3.2,2.6) || inE(x,y,27,7.5,3.8,2.8) || inE(x,y,37,7.5,3.8,2.8);
    F(g,C.ol,19,3,45,22,(x,y)=>dil(sc)(x,y)&&!(hd(x,y)&&!sc(x,y)&&y>17));
    F(g,C.pk,20,4,44,21,sc);
    F(g,C.wn,20,4,44,21,(x,y)=>sc(x,y)&&!sc(x+2,y+1));
    for (const d of [[25,14],[30,12],[36,13],[40,16],[23,18],[34,16],[28,16],[38,9],[25,8],[33,10]]) if (sc(d[0],d[1])) P(g,C.wh,d[0],d[1]);
    R(g,C.ol,31,8,2,4); P(g,C.wn,32,9);
    // hoop earrings (a glint travels around)
    const HP = ['.yy.','y..y','y..y','.yy.'];
    S(g,19,24,HP); S(g,41,24,HP);
    const GP = [[20,24],[22,25],[21,27],[19,26]];
    P(g,C.wh,GP[gl][0],GP[gl][1]); P(g,C.wh,GP[(gl+2)%4][0]+22,GP[(gl+2)%4][1]);
    // jolly face
    if (bl) { R(g,C.ol,26,22,3,1); R(g,C.ol,35,22,3,1); }
    else { eye(g,26,20,3,3); eye(g,35,20,3,3); }
    R(g,C.sd,25,18,4,1); R(g,C.sd,35,18,4,1);
    R(g,C.pk,23,24,3,2); R(g,C.pk,38,24,3,2);
    P(g,C.wd,31,23); P(g,C.wd,32,24);
    S(g,27,26,['o.......o','.oWWWWWo.','..onnno..','...ooo...']);
    // tray of cocadas held out in front
    const CO = [[16,36],[22,36],[28,36],[34,36],[40,36],[19,32],[37,32]];
    for (const c of CO) { R(g,C.ol,c[0]-1,c[1]-1,7,6); R(g,C.cr,c[0],c[1],5,4); R(g,C.st,c[0],c[1],5,1); P(g,C.wo,c[0]+2,c[1]); P(g,C.wh,c[0],c[1]+1); }
    R(g,C.ol,12,40,40,5); R(g,C.lg,13,41,38,2); R(g,C.gy,13,43,38,1); R(g,C.wh,14,41,7,1);
    S(g,9,39,['.ooo','owwo','owwo','.oo.']); S(g,51,39,['ooo.','owwo','owwo','.oo.']);
  };
})();
