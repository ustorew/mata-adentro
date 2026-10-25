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

  // ---------------------------------------------------------------- terrains
  // Milharal: v 0 dia, 1 escuro (feitiço), 2 crepúsculo, 3 noite, 4 dourado
  function bgMilho(g,v){
    const dark = v===2||v===3;
    if (v===0) { R(g,C.sk,0,0,64,12); R(g,C.cr,0,12,64,8); }
    else if (v===1) { R(g,C.bl,0,0,64,12); R(g,C.st,0,12,64,8); }
    else if (v===2) { R(g,C.nt,0,0,64,5); R(g,C.pu,0,5,64,7); R(g,C.li,0,12,64,3); R(g,C.pk,0,15,64,5); }
    else if (v===3) { R(g,C.nt,0,0,64,20); }
    else { R(g,C.or,0,0,64,9); R(g,C.yl,0,9,64,6); R(g,C.cr,0,15,64,5); }
    R(g, dark?C.sd:C.wo, 0,34,64,14);
    const fu = dark?C.ol:C.wd;
    R(g,fu,0,34,64,1); R(g,fu,0,36,64,1); R(g,fu,0,40,64,1); R(g,fu,0,44,64,1);
    for (let x = 3; x < 64; x += 7) if (hs(x,3)%3===0) R(g, dark?C.wd:C.st, x+(hs(x,9)%3), 38+(hs(x,4)%2)*4, 2, 1);
    const a = dark?C.ol:C.gd, b = dark?C.gd:C.gr;
    for (let k = 0; k < 22; k++) {
      const x = k*3, top = 14+hs(k,5)%3;
      R(g,a,x,top,3,34-top); if (v!==1 || k%2===0) R(g,b,x+1,top+1,1,33-top);
      if (k%2===0) R(g, dark?C.gd:(v===4?C.cr:C.yl), x+1, top-2, 1, 2);
      if (v!==1 && hs(k,9)%3===0) { const ly = top+5+hs(k,2)%9; R(g,b,(k%2?x+2:x-1),ly,2,1); }
    }
  }
  // Pomar: v 0 dia, 1 manhã rosa, 2 escuro (feitiço), 3 tarde quente
  function bgPomar(g,v,opt){
    opt = opt||{};
    if (v===1) { R(g,C.pk,0,0,64,11); R(g,C.cr,0,11,64,9); }
    else if (v===2) { R(g,C.bl,0,0,64,20); }
    else if (v===3) { R(g,C.cr,0,0,64,20); R(g,C.st,6,15,12,1); R(g,C.st,44,16,14,1); R(g,C.st,50,13,8,1); }
    else R(g,C.sk,0,0,64,20);
    const leaf = C.gd, hi = v===2?C.gd:C.gr;
    const cs = opt.can || [[3,3,8],[17,0,7],[31,3,7],[46,0,7],[61,3,8]];
    // far orchard + trunks
    R(g,C.gd,0,19,64,15);
    for (let x = 0; x < 64; x += 2) { P(g, v===2?C.td:C.gr, x+1, 19); P(g, v===2?C.td:C.gr, x, 20); }
    R(g,C.wd,2,8,2,26); R(g,C.wd,60,8,2,26);
    if (!opt.noCanopy) {
      const fu = (x,y)=>{ for (const c of cs) if (inE(x,y,c[0],c[1],c[2],c[2]-1)) return true; return false; };
      F(g,leaf,0,0,63,18,fu);
      F(g,hi,0,0,63,18,(x,y)=>{ for (const c of cs) if (inE(x,y,c[0]-1.5,c[1]-1.5,c[2]-3,c[2]-4)) return true; return false; });
      for (const c of cs) {
        const ax = c[0]+(hs(c[0],1)%5)-2, ay = c[1]+2+(hs(c[0],2)%3);
        if (ay < 17) R(g, v===2?C.wn:C.rd, ax, ay, 2, 2);
        P(g, C.pk, c[0]-3, c[1]+1); P(g, C.pk, c[0]+3, c[1]-2);
      }
    }
    R(g, v===2?C.gd:C.gr, 0,34,64,14);
    R(g, v===2?C.td:C.gd, 0,34,64,1);
    for (let x = 1; x < 64; x += 5) R(g, v===2?C.gr:C.lm, x, 36+(hs(x,7)%3)*4, 1, 2);
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

  // ======================================================== MILHARAL
  // 1. Espiga Sapeca
  CARD_ART['espiga-sapeca'] = function(g,t){
    bgMilho(g,0);
    const dy = (fl(t*2)%2) ? -1 : 0;
    // shadow on the ground + dust
    E(g,C.wd,32,43,9,1.5);
    R(g,C.cr,23,41,2,1); R(g,C.cr,40,41,2,1); P(g,C.cr,25,39); P(g,C.cr,39,39);
    // legs, tucked mid-jump
    S(g,27,36+dy,[
      '..o....o..',
      '.ow....wo.',
      '.ow....wo.',
      'oddo..oddo',
      'oddd..dddo',
      '.ooo..ooo.'
    ]);
    // husk arms flaring up
    const lf = mv([31,33, 25,31, 20,28, 16,24, 13,16, 18,20, 22,23, 27,26, 31,28],0,dy);
    for (const p of [lf,mirror(lf)]) {
      const f = pF(p), b = box(p);
      F(g,C.ol,b[0]-1,b[1]-1,b[2]+1,b[3]+1,dil(f));
      F(g,C.gr,b[0],b[1],b[2],b[3],f);
      F(g,C.gd,b[0],b[1],b[2],b[3],(x,y)=>f(x,y)&&!f(x,y+2));
      F(g,C.lm,b[0],b[1],b[2],b[3],(x,y)=>f(x,y)&&!f(x,y-1));
    }
    // cob
    const cx = 32, cy = 23.5+dy, ry = 12.5, top = fl(cy-ry);
    const cob = (x,y)=>{ const u=(y+0.5-cy)/ry; if(u<-1||u>1) return false; const rx=7.8*Math.sqrt(1-u*u)*(u<0?1+0.3*u:1); return Math.abs(x+0.5-cx)<=rx; };
    const face = (x,y)=>inE(x,y,32,20.5+dy,6.5,5.5);
    F(g,C.ol,22,top-1,42,38+dy,dil(cob));
    F(g,C.yl,22,top,42,38+dy,cob);
    F(g,C.st,22,top,42,38+dy,(x,y)=>cob(x,y)&&((y-top)%3===2)&&!face(x,y));
    for (let b = 0; b < 9; b++) {
      const y = top+b*3;
      for (let x = 24 + (b%2); x < 41; x += 3) if (cob(x,y) && cob(x,y+1) && !face(x,y) && !face(x,y+1)) R(g,C.st,x,y,1,2);
    }
    F(g,C.or,22,top,42,38+dy,(x,y)=>cob(x,y)&&!cob(x+2,y));
    F(g,C.cr,22,top,42,38+dy,(x,y)=>cob(x,y)&&!cob(x-1,y)&&((y-top)%3!==2)&&y<cy+4);
    // cheeky face: one eye open, one winking, big grin
    eye(g,27,17+dy,3,3);
    S(g,34,17+dy,[
      'oo..',
      '..oo',
      'oo..'
    ]);
    R(g,C.pk,25,21+dy,2,1); R(g,C.pk,38,21+dy,2,1);
    S(g,27,21+dy,[
      'o........o',
      '.oooooooo.',
      '..oWWoorro',
      '...ooorro.',
      '......oo..'
    ]);
    // husk skirt
    const sk = mv([22,28, 28,31, 32,34, 36,31, 42,28, 40,34, 35,38, 29,38, 24,34],0,dy);
    { const f = pF(sk), b = box(sk);
      F(g,C.ol,b[0]-1,b[1]-1,b[2]+1,b[3]+1,dil(f));
      F(g,C.gr,b[0],b[1],b[2],b[3],f);
      F(g,C.gd,b[0],b[1],b[2],b[3],(x,y)=>f(x,y)&&(!f(x,y+2)||x===32||x===31));
      F(g,C.lm,b[0],b[1],b[2],b[3],(x,y)=>f(x,y)&&!f(x,y-1));
    }
  };

  // 2. Corvo Ladino
  CARD_ART['corvo-ladino'] = function(g,t){
    R(g,C.bl,0,0,64,4); R(g,C.sk,0,4,64,44);
    for (let x = 0; x < 64; x += 4) P(g,C.bl,x+((x>>2)&1)*2,4);
    // clouds
    const cl = any(eF(8,15,4,2.5),eF(12,13,4,3),eF(16,15,3.5,2.5));
    F(g,C.wh,2,9,22,18,cl); F(g,C.lg,2,9,22,18,(x,y)=>cl(x,y)&&!cl(x,y+2));
    const c2 = any(eF(52,33,4,2.5),eF(57,31,4,3),eF(61,33,3,2.5));
    F(g,C.wh,46,27,63,36,c2); F(g,C.lg,46,27,63,36,(x,y)=>c2(x,y)&&!c2(x,y+2));
    // corn tassels at the bottom edge
    R(g,C.gd,0,44,64,4);
    for (let k = 0; k < 22; k++) {
      const x = k*3, top = 41+hs(k,5)%3;
      R(g,C.gd,x,top,3,48-top); R(g,C.gr,x+1,top+1,1,48-top);
      if (k%2===0) { R(g,C.yl,x+1,top-3,1,3); P(g,C.st,x,top-2); P(g,C.st,x+2,top-1); }
    }
    const f = fl(t*4)%2;
    const dy = f ? 1 : 0;
    // far wing
    const fwU = [30,22, 34,16, 38,11, 42,7, 44,8, 42,11, 44,12, 41,15, 42,16, 38,19, 36,22];
    const fwD = [30,23, 35,19, 39,18, 39,21, 36,24];
    PG(g,C.ol, f?fwD:fwU);
    if (!f) { LN(g,C.pu,33,18,41,8); P(g,C.nt,40,13); P(g,C.nt,39,15); }
    // tail
    PG(g,C.ol,[23,25+dy, 15,21+dy, 11,21+dy, 13,24+dy, 9,26+dy, 13,28+dy, 10,31+dy, 15,31+dy, 23,29+dy]);
    P(g,C.pu,14,22+dy); P(g,C.pu,12,26+dy); P(g,C.pu,13,30+dy);
    // body + head
    const bd = any(eF(30,27+dy,10,5),eF(41,23+dy,5,5));
    F(g,C.ol,18,16,48,34,bd);
    F(g,C.pu,18,16,48,34,(x,y)=>bd(x,y)&&!bd(x,y-1)&&x>21);
    F(g,C.nt,18,16,48,34,(x,y)=>bd(x,y)&&!bd(x,y+2)&&x>24&&x<38);
    P(g,C.pu,37,19+dy); P(g,C.pu,36,20+dy);
    // beak + stolen kernel
    S(g,45,21+dy,[
      'OO.....',
      'OOOO...',
      'OOOOOyy',
      'wwwwyyt',
      'ww...tt'
    ]);
    P(g,C.wh,50,23+dy);
    // sly eye
    S(g,39,19+dy,[
      'uuuuu',
      '.WWyo',
      '.Wyoo',
      '..uu.'
    ]);
    // near wing
    const nwU = [34,24, 28,17, 21,12, 12,9, 11,11, 15,13, 12,14, 16,17, 13,18, 18,20, 16,22, 21,23, 24,27];
    const nwD = [34,25, 27,26, 21,29, 15,35, 13,39, 16,38, 16,41, 19,37, 21,40, 23,35, 26,37, 28,31];
    const nw = f?nwD:nwU;
    PG(g,C.ol,nw);
    const nf = pF(nw), nb = box(nw);
    F(g,C.pu,nb[0],nb[1],nb[2],nb[3],(x,y)=>nf(x,y)&&!nf(x,y-1));
    if (!f) { LN(g,C.nt,26,22,16,15); LN(g,C.nt,29,24,20,19); P(g,C.li,13,10); P(g,C.li,20,12); }
    else { LN(g,C.nt,28,28,18,36); P(g,C.li,25,27); }
  };

  // 3. Chuva de Grãos (feitiço)
  CARD_ART['chuva-de-graos'] = function(g,t){
    bgMilho(g,1);
    // kernel mounds on the ground
    for (const p of [[9,42,5],[28,44,6],[47,42,5],[60,45,4]]) {
      const m = (x,y)=>inE(x,y,p[0],p[1]+1,p[2],3)&&y<=p[1]+1;
      F(g,C.wd,p[0]-p[2]-1,p[1]-3,p[0]+p[2]+1,p[1]+2,(x,y)=>dil(m)(x,y)&&y<=p[1]+1);
      F(g,C.yl,p[0]-p[2],p[1]-3,p[0]+p[2],p[1]+1,m);
      F(g,C.st,p[0]-p[2],p[1]-3,p[0]+p[2],p[1]+1,(x,y)=>m(x,y)&&((x+y)%3===0||!m(x+1,y)));
      P(g,C.cr,p[0]-2,p[1]-1);
    }
    // rain of kernels: diagonal streaks, looping 1px / 0.1 s
    const s = fl(t*10)%8;
    for (let j = -1; j < 4; j++) {
      const y = 13+j*8+s;
      if (y > 36) continue;
      for (let i = 0; i < 8; i++) {
        let x = (i*9 + 2 + j*5 - fl((y-13)/2)) % 72; if (x < 0) x += 72; x -= 4;
        if (x < -3 || x > 64) continue;
        LN(g,C.yl,x+3,y-1,x+4,y-3); LN(g,C.st,x+5,y-4,x+6,y-6);
        S(g,x,y,['cyy','yyt','.t.']);
      }
    }
    // impact puffs
    const pp = fl(t*10)%2;
    for (const p of [[18,38],[37,39],[54,38]]) { R(g,C.cr,p[0]-3+pp,p[1],2,1); P(g,C.cr,p[0],p[1]-1-pp); R(g,C.cr,p[0]+2-pp,p[1],2,1); P(g,C.cr,p[0]-1,p[1]-2+pp); P(g,C.cr,p[0]+1,p[1]-2); }
    // cloud
    const cl = any(eF(12,9,7,5),eF(23,5,8,6),eF(36,6,9,6),eF(49,8,8,5),eF(30,11,9,4),eF(58,10,5,4),eF(4,11,5,3.5));
    const cloud = (x,y)=>cl(x,y)&&y<=14;
    F(g,C.ol,0,0,63,15,(x,y)=>dil(cloud)(x,y)&&y<=15);
    F(g,C.gy,0,0,63,15,cloud);
    F(g,C.sd,0,0,63,15,(x,y)=>cloud(x,y)&&(y>=13||!cloud(x+1,y+2)));
    F(g,C.lg,0,0,63,15,(x,y)=>cloud(x,y)&&!cloud(x-1,y-1)&&y<10);
    // kernels pouring out of the cloud
    for (const x of [8,20,33,45,56]) { const yy = 15+((s+x)%3); S(g,x,yy,['yy','yt']); }
  };

  // 4. Espantalho Guardião
  CARD_ART['espantalho-guardiao'] = function(g,t){
    bgMilho(g,2);
    // crows flying away
    S(g,5,6,['oo...oo','..ooo..','...o...']);
    S(g,14,9,['o.o','.o.']);
    S(g,52,5,['oo...oo','..ooo..','...o...']);
    S(g,47,8,['o.o','.o.']);
    const fl2 = fl(t*2)%2;
    // post
    R(g,C.ol,30,30,5,17); R(g,C.wo,31,30,3,17); R(g,C.wd,33,30,1,17); R(g,C.st,31,30,1,17);
    // arms (sleeves)
    const sl = (x,y)=>y>=19&&y<=24&&x>=14&&x<=50&&!((x<17||x>47)&&y===24);
    F(g,C.ol,12,18,52,25,dil(sl));
    F(g,C.wo,12,18,52,25,sl);
    F(g,C.wd,12,18,52,25,(x,y)=>sl(x,y)&&y>=23);
    F(g,C.st,12,18,52,25,(x,y)=>sl(x,y)&&y===19);
    R(g,C.wd,20,19,1,5); R(g,C.wd,44,19,1,5);
    // straw cuffs
    S(g,8,17,[
      'y.....',
      '.yt...',
      'ttyyoo',
      'yyyyoo',
      'tytyoo',
      '.t.yoo',
      't..y..'
    ]);
    S(g,50,17,[
      '.....y',
      '...ty.',
      'ooyytt',
      'ooyyyy',
      'ooytyt',
      'ooy.t.',
      '..y..t'
    ]);
    // shirt
    const sh = [24,18, 40,18, 43,33, 40,35, 37,33, 34,36, 31,33, 28,36, 25,33, 21,34];
    const sf = pF(sh), sb = box(sh);
    F(g,C.ol,sb[0]-1,sb[1]-1,sb[2]+1,sb[3]+1,dil(sf));
    F(g,C.wo,sb[0],sb[1],sb[2],sb[3],sf);
    F(g,C.wd,sb[0],sb[1],sb[2],sb[3],(x,y)=>sf(x,y)&&(!sf(x+2,y)||!sf(x,y+2)));
    F(g,C.st,sb[0],sb[1],sb[2],sb[3],(x,y)=>sf(x,y)&&!sf(x-1,y));
    // straw at the hem
    S(g,24,34,['y.t..y.ty..t.y.','.y..t..y...y...']);
    // red patch + rope belt
    S(g,26,22,[
      'orrro',
      'rrrrr',
      'rcrcr',
      'rrrrn',
      'onnno'
    ]);
    R(g,C.st,24,29,18,1); P(g,C.yl,33,30); P(g,C.st,34,31);
    R(g,C.wd,36,23,1,3); R(g,C.wd,38,21,1,2);
    // head (sack)
    const hd = eF(32,15,6,5.5);
    F(g,C.ol,24,8,40,22,dil(hd));
    F(g,C.cr,24,8,40,22,hd);
    F(g,C.st,24,8,40,22,(x,y)=>hd(x,y)&&!hd(x+2,y+1));
    R(g,C.wo,30,20,5,1);
    eye(g,28,14,2,2); eye(g,34,14,2,2);
    // stitched smile + rosy patches (friendly, not spooky)
    S(g,28,17,['o.......o','.ooooooo.','..o.o.o..']);
    P(g,C.pk,27,16); P(g,C.pk,37,16);
    P(g,C.or,31,16); P(g,C.or,32,16);
    // hat
    const by = fl2;
    S(g,25,4,[
      '..ooooooooooo..',
      '.otyyyyytttttwo',
      '.otyyyttttttwwo',
      '.ottyttttttwwwo',
      'orrrrrrrrrrrrrro',
      'otttttttttttttwo'
    ]);
    R(g,C.ol,20,10,25,3);
    R(g,C.st,22,10,21,1); R(g,C.wo,21,11,23,1);
    R(g,C.ol,18,10+by,3,3); R(g,C.st,19,10+by,2,1); R(g,C.wo,19,11+by,2,1);
    R(g,C.ol,44,10+by,3,3); R(g,C.st,44,10+by,2,1); R(g,C.wo,44,11+by,2,1);
    P(g,C.yl,23,10); P(g,C.yl,26,10);
  };

  // 5. Vento Dourado (feitiço)
  CARD_ART['vento-dourado'] = function(g,t){
    // darker Milharal: bl sky, st haze line, corn bending to the right
    R(g,C.bl,0,0,64,17); R(g,C.st,0,17,64,11);
    for (let x = 0; x < 64; x += 4) P(g,C.st,x+((x>>2)&1)*2,16);
    R(g,C.wo,0,34,64,14); R(g,C.wd,0,34,64,1); R(g,C.wd,0,37,64,1); R(g,C.wd,0,41,64,1); R(g,C.wd,0,45,64,1);
    R(g,C.gd,0,27,64,7);
    for (let k = 0; k < 16; k++) {
      const x0 = k*4+1-(k%2), top = 18+hs(k,3)%4, bend = 5+hs(k,6)%2;
      let px = -99, py = 0;
      for (let y = top; y <= 34; y++) {
        const u = (34-y)/(34-top), x = x0 + Math.round(bend*u*u);
        if (x !== px) { if (px > -99) R(g,C.gd,px,py,2,y-py); px = x; py = y; }
      }
      R(g,C.gd,px,py,2,35-py);
      R(g,C.gr,x0,29,1,5); P(g,C.gr,x0+1,25); P(g,C.gr,x0+3,22);
      if (k%2===0) R(g,C.yl,x0+bend+1,top,2,1); else R(g,C.lm,x0+bend+1,top+1,2,1);
    }
    const ph = fl(t*8);
    // gusts: sine strokes that end in a curl. Rasterised to a pixel set, then filled in merged runs.
    const strokes = [];
    const gust = (x0,x1,y0,A,per,R0,dir,thin)=>{
      const pts = [];
      for (let x = x0; x <= x1; x++) pts.push([x, y0 + A*Math.sin((x-x0)/per), x<x0+5 ? 1 : (x<x0+12||x>x1-3||thin ? 2 : 3)]);
      const ex = x1, ey = y0 + A*Math.sin((x1-x0)/per);
      const cx = ex, cy = ey - dir*R0;
      for (let a = 0; a < 4.4; a += 0.16) {
        const r = R0*(1-a/7.5), th = dir*Math.PI/2 - dir*a;
        pts.push([cx + r*Math.cos(th), cy + r*Math.sin(th), a < 3.2 ? 2 : 1]);
      }
      strokes.push(pts);
    };
    gust(-2,37,13,3,5,6,1);
    gust(4,50,31,4,6,5,1);
    gust(-2,22,42,2,4,3,1,1);
    const body = new Set(), thick = new Set();
    for (const pts of strokes) for (const p of pts) {
      const x = Math.round(p[0]), y = Math.round(p[1]);
      for (let i = 0; i < p[2]; i++) for (let j = 0; j < p[2]; j++) { if (x+i<0||x+i>63) continue; body.add((y+j)*64+x+i); if (p[2] > 2) thick.add((y+j)*64+x+i); }
    }
    const inb = (x,y)=>x>=0&&x<64&&y>=0&&body.has(y*64+x);
    F(g,C.ol,0,0,63,47,(x,y)=>!inb(x,y)&&(inb(x,y-1)||inb(x-1,y-1))&&!inb(x,y+1));
    F(g,C.yl,0,0,63,47,inb);
    F(g,C.cr,0,0,63,47,(x,y)=>inb(x,y)&&!inb(x,y-1)&&inb(x,y+1));
    F(g,C.or,0,0,63,47,(x,y)=>x>=0&&x<64&&thick.has(y*64+x)&&!inb(x,y+1));
    // moving glints along the ribbons (1px to the right per frame)
    for (const pts of strokes) for (let i = 0; i < pts.length; i++) {
      const d = ((i - ph) % 12 + 12) % 12;
      if (d === 0) { const x = Math.round(pts[i][0]), y = Math.round(pts[i][1]); R(g,C.wh,x,y,2,1); }
    }
    // thin streaks
    for (const w of [[20,5,16],[2,23,10],[28,24,7],[42,41,14],[2,7,8],[50,22,10]]) { R(g,C.cr,w[0],w[1],w[2],1); P(g,C.cr,w[0]+w[2],w[1]-1); }
    // leaves + sparkles carried by the gust
    const lp = [[6,24],[22,7],[36,38],[52,44],[28,19],[56,26]];
    for (let i = 0; i < lp.length; i++) {
      const x = (lp[i][0]+ph)%64, y = lp[i][1]+((fl(t*4)+i)%2);
      S(g,x,y, i%2 ? ['.ll','gl.'] : ['gg.','.lg']);
    }
    const sp = [[14,4],[33,9],[58,36],[18,36],[48,6]];
    for (let i = 0; i < sp.length; i++) { const on = (fl(t*4)+i)%3; const x = (sp[i][0]+ph)%64; if (on===0) spark(g,C.wh,x,sp[i][1]); else P(g,C.cr,x,sp[i][1]); }
  };

  // 6. Pipoqueiro Explosivo
  CARD_ART['pipoqueiro-explosivo'] = function(g,t){
    bgMilho(g,0);
    const f = fl(t*4)%4;
    // popped bits hopping around
    const bits = [[10,20],[53,17],[8,33],[56,31],[45,11]];
    for (let i = 0; i < bits.length; i++) {
      const b = bits[i], ph = (f+i)%4, y = b[1] - (ph===1?2:ph===2?1:0);
      S(g,b[0]-2,y-2, i%2 ? [
        '.ooo.',
        'oWWco',
        'oWcyo',
        '.oyo.'
      ] : [
        'oo.o.',
        'oWoWo',
        'oWWco',
        '.ocyo',
        '..oo.'
      ]);
    }
    // shadow + feet
    E(g,C.wd,32,43.5,12,1.6);
    S(g,24,40,['.oooo...oooo.','oOOOOo.oOOOOo','.oooo...oooo.']);
    // puffy body: lumpy cauliflower outline
    const pu = [[32,29,10],[22,27,5],[42,27,5],[24,19,5.5],[40,19,5.5],[32,14,5.5],[21,35,5],[43,35,5],[27,38,4.5],[37,38,4.5],[28,23,5],[36,23,5],[17,23,3.2],[47,23,3.2],[16,31,3.2],[48,31,3.2],[26,12,3.2],[38,12,3.2],[18,39,2.8],[46,39,2.8]];
    const bf = (x,y)=>{ for (const p of pu) if (inE(x,y,p[0],p[1],p[2],p[2])) return true; return false; };
    F(g,C.ol,14,8,50,43,dil(bf));
    F(g,C.wh,14,8,50,43,bf);
    // seams between puffs (lower-right rim of each outer puff)
    for (let i = 1; i < pu.length; i++) {
      const p = pu[i];
      F(g,i>11?C.st:C.cr,p[0]-p[2]-1,p[1]-p[2]-1,p[0]+p[2]+1,p[1]+p[2]+1,(x,y)=>inE(x,y,p[0],p[1],p[2],p[2])&&!inE(x,y,p[0]-1.4,p[1]-1.4,p[2],p[2])&&bf(x+1,y+1));
    }
    F(g,C.st,14,8,50,43,(x,y)=>bf(x,y)&&!bf(x+2,y+2));
    // the golden hull at the base
    S(g,26,38,[
      '..oooooooooo..',
      '.oyyyyyyyyOOo.',
      'oyyyyyyyyyOOOo',
      '.oOOOOOOOOOoo.',
      '..oooooooooo..'
    ]);
    // angry face
    S(g,23,22,[
      'ooo............ooo',
      '..ooo........ooo..',
      '....oo......oo....'
    ]);
    eye(g,25,25,3,3); eye(g,36,25,3,3);
    R(g,C.or,22,29,3,1); R(g,C.or,39,29,3,1);
    S(g,27,30,[
      '.oooooooooo.',
      'oWoWoWoWoWWo',
      'orrrrrrrrrro',
      '.oooooooooo.'
    ]);
    // fuse + sparks
    S(g,30,4,[
      '...d..',
      '..d.d.',
      '..d.d.',
      '...dd.',
      '....d.',
      '...d..',
      '...ow.',
      '..owwo'
    ]);
    const sx = 33, sy = 3;
    if (f%2===0) { spark(g,C.yl,sx,sy,true); P(g,C.or,sx-2,sy-2); P(g,C.or,sx+2,sy+2); P(g,C.or,sx+3,sy-1); }
    else { spark(g,C.or,sx,sy,false); P(g,C.yl,sx+2,sy-2); P(g,C.yl,sx-2,sy+1); P(g,C.wh,sx,sy); P(g,C.yl,sx+3,sy+2); }
  };

  // 7. Revoada Noturna
  CARD_ART['revoada-noturna'] = function(g,t){
    // night sky: nt above, moonlit pu haze below
    R(g,C.nt,0,0,64,10); R(g,C.pu,0,10,64,30);
    for (let x = 0; x < 64; x += 2) P(g,C.pu,x+((x>>1)&1),9);
    for (let x = 0; x < 64; x += 4) P(g,C.nt,x+((x>>2)&1)*2,10);
    for (let i = 0; i < 12; i++) { const x = 2+hs(i,11)%60, y = 1+hs(i,23)%8; P(g, i%3?C.li:C.cr, x, y); }
    // moon + halo
    E(g,C.li,32,17,14.5,14.5);
    E(g,C.cr,32,17,13,13);
    E(g,C.lg,25,11,3.5,3); E(g,C.lg,38,21,4.5,3.5); E(g,C.lg,28,25,2.5,2); E(g,C.lg,40,10,2,2); E(g,C.lg,21,19,1.5,1.5);
    F(g,C.lg,16,0,48,32,(x,y)=>inE(x,y,32,17,13,13)&&!inE(x,y,30.5,15.5,13,13));
    // corn silhouettes
    for (let k = 0; k < 16; k++) {
      const x = k*4+(hs(k,2)%2), top = 34+hs(k,7)%5;
      R(g,C.ol,x,top,2,48-top);
      R(g,C.ol,x-1+(k%2)*3,top+3,1,2);
      P(g,C.gd,x,top); if (k%3===0) R(g,C.gd,x,top+1,1,3);
    }
    R(g,C.ol,0,40,64,8);
    for (let x = 1; x < 64; x += 6) P(g,C.gd,x,40);
    const fr = fl(t*4)%2, glow = fl(t*2)%2;
    // frontal crow, wings raised (up) or lowered
    const crow = (cx,cy,big,down)=>{
      const k = big ? 1 : 0.62;
      const up = [-2,1, -6,-2, -11,-7, -17,-11, -20,-11, -18,-8, -21,-7, -18,-5, -20,-3, -16,-2, -17,0, -12,0, -12,3, -7,3, -3,6];
      const dn = [-2,1, -7,0, -12,2, -16,5, -18,9, -15,8, -16,11, -12,9, -11,12, -8,9, -3,7];
      const src = down ? dn : up;
      const wl = src.map((v,i)=>i%2 ? cy+Math.round(v*k) : cx+Math.round(v*k));
      const wr = src.map((v,i)=>i%2 ? cy+Math.round(v*k) : cx-Math.round(v*k));
      const body = C.ol;
      for (const w of [wl,wr]) {
        PG(g,body,w);
        const ff = pF(w), b = box(w);
        F(g,C.li,b[0],b[1],b[2],b[3],(x,y)=>ff(x,y)&&!ff(x,y-1));
        F(g,C.nt,b[0],b[1],b[2],b[3],(x,y)=>ff(x,y)&&ff(x,y-1)&&!ff(x,y-2)&&ff(x,y+2));
      }
      if (big) {
        E(g,C.ol,cx,cy+3,5.5,7);
        E(g,C.ol,cx,cy-3,4.5,4.5);
        F(g,C.li,cx-6,cy-9,cx+6,cy+11,(x,y)=>inE(x,y,cx,cy-3,4.5,4.5)&&!inE(x,y,cx,cy-2,4.5,4.5));
        F(g,C.pu,cx-6,cy-9,cx+6,cy+11,(x,y)=>inE(x,y,cx,cy+3,5.5,7)&&!inE(x,y,cx+1,cy+3,5.5,7)&&y>cy);
        S(g,cx-4,cy-5,[
          '.ii..ii.',
          'iWii.iWi',
          'iiii.iii',
          '.ii...i.'
        ]);
        P(g,C.ol,cx,cy-4);
        if (glow) { S(g,cx-5,cy-6,['.p......p.','p........p']); }
        S(g,cx-1,cy-1,['OO','Ow','.w']);
        S(g,cx-3,cy+3,['.u..u.','u.uu.u','.u..u.']);
        S(g,cx-3,cy+9,['o.o..o.o','oo....oo']);
      } else {
        // small crows: ol silhouettes with lilac rim so they read on the purple haze
        E(g,C.ol,cx,cy+2,3.5,4.5);
        E(g,C.ol,cx,cy-2,3,3);
        F(g,C.li,cx-4,cy-6,cx+4,cy+7,(x,y)=>inE(x,y,cx,cy-2,3,3)&&!inE(x,y,cx,cy-1,3,3));
        F(g,C.nt,cx-4,cy-6,cx+4,cy+7,(x,y)=>inE(x,y,cx,cy+2,3.5,4.5)&&!inE(x,y,cx+1,cy+2,3.5,4.5)&&y>cy);
        S(g,cx-2,cy-3,['ii.ii','iW.Wi']);
        if (glow) { P(g,C.pk,cx-3,cy-3); P(g,C.pk,cx+3,cy-3); }
        S(g,cx-1,cy-1,['OO','.O']);
        S(g,cx-2,cy+6,['o...o']);
      }
    };
    crow(11,28,0,1-fr);
    crow(53,28,0,fr);
    crow(32,23,1,fr);
  };

  // 8. Rei Milhão (lendária)
  CARD_ART['rei-milhao'] = function(g,t){
    // golden-hour sky with sun rays fanning out behind the king
    R(g,C.or,0,0,64,20);
    const glow = eF(32,21,17,14);
    F(g,C.yl,0,0,63,19,(x,y)=>{ if (glow(x,y)) return true; const a = Math.atan2(y+0.5-21,x+0.5-32); return fl((a+Math.PI)/(Math.PI/6)+0.5)%2===0; });
    F(g,C.cr,14,6,50,19,eF(32,21,12,10));
    // field at golden hour
    R(g,C.wo,0,34,64,14); R(g,C.wd,0,34,64,1); R(g,C.wd,0,38,64,1); R(g,C.wd,0,43,64,1);
    for (let k = 0; k < 22; k++) {
      const x = k*3, top = 17+hs(k,5)%3;
      if (x > 13 && x < 48) continue;
      R(g,C.gd,x,top,3,34-top); R(g,C.gr,x+1,top+1,1,33-top);
      if (k%2===0) R(g,C.yl,x+1,top-2,1,2);
    }
    R(g,C.gd,14,19,34,15); R(g,C.gr,14,19,34,1);
    const sw = fl(t*2)%2;
    // husk cape (one shape behind the king)
    const cape = [26,12, 38,12, 42,15, 47,23, 51,33, 55+sw,45, 9-sw,45, 13,33, 17,23, 22,15];
    const cf = pF(cape);
    F(g,C.ol,7,10,57,46,dil(cf));
    F(g,C.gr,7,10,57,46,cf);
    F(g,C.gd,7,10,57,46,(x,y)=>cf(x,y)&&(x<32?!cf(x-2,y):!cf(x+2,y)));
    R(g,C.lm,17,33,1,6); R(g,C.lm,18,28,1,4); R(g,C.lm,46,33,1,6); R(g,C.lm,45,28,1,4);
    // scepter (corn stalk) on the left
    R(g,C.ol,11,14,4,32); R(g,C.gr,12,15,2,31); R(g,C.gd,13,15,1,31);
    R(g,C.lm,12,33,1,2); P(g,C.gd,11,34);
    S(g,9,9,[
      '..ooo..',
      '.oycyo.',
      'oyyyyyo',
      'oyyyyOo',
      '.oyyOo.',
      'ogllggo',
      '.og.go.'
    ]);
    // cob body
    const cy = 29, ry = 16.5;
    const cob = (x,y)=>{ const u=(y+0.5-cy)/ry; if(u<-1||u>1) return false; const rx=11*Math.sqrt(1-u*u)*(u<0?1+0.12*u:1); return Math.abs(x+0.5-32)<=rx; };
    const face = (x,y)=>inE(x,y,32,21.5,8.5,6.5);
    F(g,C.ol,19,11,45,46,dil(cob));
    F(g,C.yl,19,11,45,46,cob);
    F(g,C.st,19,11,45,46,(x,y)=>cob(x,y)&&((y-13)%3===2)&&!face(x,y));
    for (let b = 0; b < 11; b++) {
      const y = 13+b*3;
      for (let x = 22+(b%2); x < 43; x += 3) if (cob(x,y)&&cob(x,y+1)&&!face(x,y)&&!face(x,y+1)) R(g,C.st,x,y,1,2);
    }
    F(g,C.or,19,11,45,46,(x,y)=>cob(x,y)&&!cob(x+2,y));
    F(g,C.cr,19,11,45,46,(x,y)=>cob(x,y)&&!cob(x-1,y)&&((y-13)%3!==2));
    // arm holding the scepter
    PG(g,C.ol,[25,26, 14,23, 13,29, 25,32]);
    PG(g,C.gr,[25,27, 15,24, 15,28, 25,31]);
    R(g,C.lm,16,25,6,1);
    S(g,10,23,['.ooo.','oyyyo','oyyto','.ooo.']);
    // stern-but-kind face, golden-silk moustache and goatee
    S(g,25,16,[
      'oooo.....oooo',
      '....o...o....'
    ]);
    S(g,26,18,[
      'Wo.....Wo',
      'oo.....oo',
      'oc.....oc'
    ]);
    P(g,C.ol,27,18); P(g,C.ol,34,18);
    R(g,C.ol,26,18,3,3); R(g,C.ol,35,18,3,3); P(g,C.wh,26,18); P(g,C.wh,35,18); P(g,C.cr,28,20); P(g,C.cr,37,20);
    R(g,C.pk,23,21,2,1); R(g,C.pk,39,21,2,1);
    S(g,30,20,['.tt.','tttO']);
    S(g,23,22,[
      '.o..............o.',
      'oco.oooooooooo.oco',
      'occocccccccccccocco',
      '.occcccttccccccco.',
      '..ooocccccccccooo.',
      '.....oocccccoo.....',
      '......occtco......',
      '......occtco......',
      '.......octo.......',
      '........oo........'
    ]);
    // crown
    S(g,21,3,[
      '..........oyo..........',
      '...o......oco......o...',
      '..oyo....oyyyo....oyo..',
      '..oco....oyyyo....oco..',
      '..oyyo..oyyyyyo..oyyo..',
      '..oyyyooyyyyyyyooyyyo..',
      '.ooyyyyyyyooOyyyyyyyoo.',
      '.oyyyyyyyyorWryyyyyyyo.',
      '.oOOOOOOOOorrnOOOOOOOo.',
      '.ooooooooooonoooooooooo.'
    ]);
    P(g,C.cr,24,10); P(g,C.cr,28,10); P(g,C.cr,36,10); P(g,C.cr,40,10);
    // crown sparkles
    const tw = fl(t*3)%3;
    if (tw===0) spark(g,C.wh,24,3,false);
    else if (tw===1) spark(g,C.wh,40,3,false);
    else { P(g,C.wh,32,0); P(g,C.cr,24,4); P(g,C.cr,40,4); }
  };

  // ======================================================== POMAR
  // 9. Maçã Roliça
  CARD_ART['maca-rolica'] = function(g,t){
    bgPomar(g,0);
    const bl = (t%3) > 2.82;
    const lw = fl(t*2)%2;
    // shadow + feet
    E(g,C.gd,32,43,11,1.6);
    S(g,25,39,['.ooo....ooo.','owwwo..owwwo','ottwo..ottwo','.ooo....ooo.']);
    const ap = any(eF(28.5,31.5,9.5,9.5),eF(35.5,31.5,9.5,9.5),eF(32,33,11,9));
    F(g,C.ol,16,20,48,44,dil(ap));
    F(g,C.rd,16,20,48,44,ap);
    F(g,C.wn,16,20,48,44,(x,y)=>ap(x,y)&&!ap(x+3,y+3));
    R(g,C.ol,31,22,2,1);
    F(g,C.pk,16,20,48,44,(x,y)=>ap(x,y)&&!ap(x-1,y-1)&&y<30&&x<31);
    S(g,22,24,['.WW.','WWWW','WW..','W...']);
    // stem + leaf
    R(g,C.ol,30,16,4,7); R(g,C.wd,31,17,2,6); P(g,C.wo,31,17);
    const lf = lw ? [33,19, 37,14, 43,13, 41,18, 36,20] : [33,19, 37,15, 43,15, 40,19, 36,20];
    const f = pF(lf), b = box(lf);
    F(g,C.ol,b[0]-1,b[1]-1,b[2]+1,b[3]+1,dil(f)); F(g,C.gr,b[0],b[1],b[2],b[3],f);
    F(g,C.lm,b[0],b[1],b[2],b[3],(x,y)=>f(x,y)&&!f(x,y-1)); LN(g,C.gd,34,19,41,16+lw*0);
    // face
    if (bl) { R(g,C.ol,26,31,3,1); R(g,C.ol,35,31,3,1); }
    else { eye(g,26,29,3,3); eye(g,35,29,3,3); P(g,C.wh,28,31); P(g,C.wh,37,31); }
    R(g,C.pk,23,33,3,2); R(g,C.pk,38,33,3,2);
    S(g,29,34,['o....o','.oooo.','..rr..']);
    // grass tufts in front
    S(g,18,41,['l.l','glg']); S(g,43,42,['.l.l','glgg']);
  };

  // 10. Abelha Operária
  CARD_ART['abelha-operaria'] = function(g,t){
    bgPomar(g,0,{can:[[2,2,7],[62,2,7]]});
    // blossoming apple branch
    LN(g,C.wd,0,13,22,9,2); LN(g,C.wd,22,9,63,6,2); LN(g,C.wd,40,8,48,13); LN(g,C.wd,10,12,6,17);
    for (const p of [[6,10],[16,12],[26,7],[38,6],[50,5],[58,8],[46,13],[6,17]]) { S(g,p[0]-2,p[1]-2,['.p.','pyp','.p.']); P(g,C.wh,p[0]-1,p[1]-2); }
    for (const p of [[11,9],[31,10],[55,4],[20,14]]) { P(g,C.pk,p[0],p[1]); P(g,C.wh,p[0]+1,p[1]); }
    const f = fl(t*8)%2, dy = fl(t*2)%2;
    E(g,C.gd,32,44,7,1.2);
    // wings (behind), flicker
    for (const s of [-1,1]) {
      const cx = 32+s*12, cy = 16+dy+(f?1:0), ry = f?4:5;
      const wf = eF(cx,cy,7,ry);
      F(g,C.ol,cx-9,cy-7,cx+9,cy+7,dil(wf));
      F(g,C.sk,cx-9,cy-7,cx+9,cy+7,wf);
      F(g,C.wh,cx-9,cy-7,cx+9,cy+7,(x,y)=>wf(x,y)&&!wf(x-1,y-1));
      R(g,C.wh,cx-3,cy-1,4,1); R(g,C.wh,cx-1,cy+1,4,1);
    }
    // round striped body
    const bf = eF(32,27+dy,11,10);
    const stripe = y=>{ const k = y-dy; return k===29||k===30||k===34||k===35; };
    F(g,C.ol,19,16,45,39,dil(bf));
    F(g,C.yl,19,16,45,39,bf);
    F(g,C.or,19,16,45,39,(x,y)=>bf(x,y)&&!bf(x+2,y+2)&&!stripe(y));
    F(g,C.ol,19,16,45,39,(x,y)=>bf(x,y)&&stripe(y));
    F(g,C.cr,19,16,45,39,(x,y)=>bf(x,y)&&!bf(x-1,y-1)&&y-dy<28);
    R(g,C.cr,25,19+dy,3,1); P(g,C.cr,24,20+dy);
    // antennae
    S(g,22,9+dy,[
      'ooo...............ooo',
      'oyo...............oyo',
      'ooo...............ooo',
      '...o.............o...',
      '....o...........o....',
      '.....oo.......oo.....',
      '.......o.....o.......'
    ]);
    // face
    eye(g,26,21+dy,3,3); eye(g,35,21+dy,3,3);
    R(g,C.pk,23,25+dy,3,1); R(g,C.pk,38,25+dy,3,1);
    S(g,30,25+dy,['o..o','.oo.']);
    // stinger
    S(g,31,37+dy,['oo','.o']);
    // honey pot hugged in front
    S(g,27,29+dy,[
      '.oooooooooo.',
      'oddddddddddo',
      '.oyyyyyyyyo.',
      'oOyyOOOOOOOo',
      'oOcOOOOOOwOo',
      'oOcOOOOOOwOo',
      'oOOOOOOOwwOo',
      '.ooooooooo.'
    ]);
    P(g,C.yl,30,32+dy); R(g,C.yl,34,32+dy,1,2);
    // little arms
    S(g,24,30+dy,['oo..','.ooo','..oo']); S(g,37,30+dy,['..oo','ooo.','oo..']);
  };

  // 11. Orvalho da Manhã (feitiço)
  CARD_ART['orvalho-da-manha'] = function(g,t){
    bgPomar(g,2);
    // soft blossoms behind
    for (const p of [[8,24],[54,22],[48,38],[12,40],[58,12],[42,28]]) { S(g,p[0]-1,p[1]-1,['.p.','pip','.p.']); }
    // big leaf from top-left
    const lf = [0,2, 10,2, 20,5, 28,9, 33,14, 26,14, 16,13, 6,10, 0,9];
    const f = pF(lf), b = box(lf);
    F(g,C.ol,b[0]-1,b[1]-1,b[2]+1,b[3]+1,dil(f));
    F(g,C.gr,b[0],b[1],b[2],b[3],f);
    F(g,C.gd,b[0],b[1],b[2],b[3],(x,y)=>f(x,y)&&!f(x,y+2));
    F(g,C.lm,b[0],b[1],b[2],b[3],(x,y)=>f(x,y)&&!f(x,y-1));
    LN(g,C.lm,0,6,31,13);
    // drop
    const cx = 32, cy = 32, r = 10.5;
    const dr = (x,y)=>inE(x,y,cx,cy,r,r) || (y>=14 && y<cy && Math.abs(x+0.5-cx) <= (y+0.5-14)*0.62);
    F(g,C.ol,18,12,46,45,dil(dr));
    F(g,C.sk,18,12,46,45,dr);
    // refracted world inside: grass band + tiny sun
    F(g,C.gr,18,12,46,45,(x,y)=>dr(x,y)&&y>=36);
    F(g,C.lm,18,12,46,45,(x,y)=>dr(x,y)&&y===36);
    F(g,C.bl,18,12,46,45,(x,y)=>dr(x,y)&&!dr(x+2,y+2));
    F(g,C.td,18,12,46,45,(x,y)=>dr(x,y)&&!dr(x+1,y+1)&&y>30);
    S(g,34,30,['.yy.','yyyO','yyOO','.OO.']);
    // highlights
    F(g,C.wh,18,12,46,45,(x,y)=>dr(x,y)&&!dr(x-1,y-1)&&y>=20&&y<=31);
    R(g,C.wh,25,26,2,3); P(g,C.wh,27,25);
    const hp = [[24,32],[24,29],[25,27],[26,25],[28,23],[30,22],[31,20]];
    const i = fl(t*6)%(hp.length+5);
    if (i < hp.length) { const p = hp[i]; R(g,C.wh,p[0]-1,p[1],3,1); R(g,C.wh,p[0],p[1]-1,1,3); }
    R(g,C.wh,38,38,2,1);
  };

  // 12. Cerejas Gêmeas
  CARD_ART['cerejas-gemeas'] = function(g,t){
    bgPomar(g,1,{can:[[0,2,7],[64,2,7]]});
    const sw = fl(t*1.5)%2 ? 1 : 0;
    // leafy branch
    LN(g,C.ol,0,7,64,5,2); LN(g,C.wd,0,6,64,4,2); LN(g,C.wo,0,6,64,4,1);
    for (const p of [[8,4,1],[20,8,0],[44,7,0],[54,3,1],[26,3,1]]) {
      const lp = p[2] ? [p[0],p[1]+2, p[0]+3,p[1]-2, p[0]+8,p[1]-2, p[0]+5,p[1]+2] : [p[0],p[1]-1, p[0]+3,p[1]+3, p[0]+8,p[1]+3, p[0]+5,p[1]-1];
      PG(g,C.gd,lp); const lf = pF(lp), b = box(lp); F(g,C.gr,b[0],b[1],b[2],b[3],(x,y)=>lf(x,y)&&lf(x,y+1)&&lf(x+1,y));
    }
    // stems
    const jx = 32, jy = 8;
    LN(g,C.gd,jx,jy+1,24+sw,26,1); LN(g,C.gd,jx+1,jy+1,40+sw,26,1);
    LN(g,C.gr,jx-1,jy+1,23+sw,25,1); LN(g,C.gr,jx+2,jy+1,41+sw,25,1);
    S(g,28,5,['..ll...','.lgggo.','.gggGo.','..ooo..']);
    // shadows on grass
    E(g,C.gd,23.5+sw,43,6,1.2); E(g,C.gd,40.5+sw,43,6,1.2);
    const c1 = eF(23.5+sw,33,7.6,7.6), c2 = eF(40.5+sw,33,7.6,7.6);
    for (const cf of [c1,c2]) {
      F(g,C.ol,12,22,52,44,dil(cf));
      F(g,C.rd,12,22,52,44,cf);
      F(g,C.wn,12,22,52,44,(x,y)=>cf(x,y)&&!cf(x+2,y+2));
    }
    // shines
    S(g,18+sw,27,['.WW','WW.','W..']); S(g,35+sw,27,['.WW','WW.','W..']);
    // left: smiling
    eye(g,20+sw,31,2,3); eye(g,26+sw,31,2,3);
    R(g,C.pk,18+sw,35,2,1); R(g,C.pk,28+sw,35,2,1);
    S(g,21+sw,35,['o...o','.ooo.']);
    // right: shy (looks aside, blushing)
    S(g,36+sw,30,['o....o.','.......']);
    R(g,C.ol,37+sw,32,2,2); R(g,C.ol,42+sw,32,2,2); P(g,C.wh,37+sw,32); P(g,C.wh,42+sw,32);
    R(g,C.pk,35+sw,35,3,2); R(g,C.pk,44+sw,35,3,2);
    S(g,39+sw,36,['.o.o','o.o.']);
    // holding hands
    S(g,29+sw,36,['oo...oo','.ooooo.','..ooo..']);
    P(g,C.rd,31+sw,37); P(g,C.rd,33+sw,37);
  };

  // 13. Joaninha Curandeira
  CARD_ART['joaninha-curandeira'] = function(g,t){
    bgPomar(g,0);
    const ab = fl(t*3)%2;
    // broad leaf
    const lf = eF(32,43,19,3.6);
    F(g,C.ol,11,38,53,47,dil(lf));
    F(g,C.gr,11,38,53,47,lf);
    F(g,C.gd,11,38,53,47,(x,y)=>lf(x,y)&&!lf(x,y+2));
    F(g,C.lm,11,38,53,47,(x,y)=>lf(x,y)&&!lf(x,y-1));
    R(g,C.gd,15,43,34,1);
    // legs
    S(g,23,39,['o.......o......o','.o......o.....o.']);
    // shell
    const sh = eF(32,32,11.5,9.5);
    F(g,C.ol,19,21,45,43,dil(sh));
    F(g,C.rd,19,21,45,43,sh);
    F(g,C.wn,19,21,45,43,(x,y)=>sh(x,y)&&!sh(x+2,y+2));
    R(g,C.ol,32,26,1,16);
    // spots
    for (const p of [[23,29],[38,29],[25,35],[36,35],[29,39],[32,33],[41,34]]) { R(g,C.ol,p[0],p[1]+1,3,1); R(g,C.ol,p[0]+1,p[1],1,3); }
    S(g,22,25,['..WW','.WW.','W...']);
    // head
    const hd = eF(32,22,7.5,5.5);
    F(g,C.ol,23,15,41,29,dil(hd));
    F(g,C.ol,23,15,41,29,hd);
    S(g,26,20,[
      'WWW...WWW',
      'Woo...ooW',
      'WWo...oWW'
    ]);
    P(g,C.wh,27,21); P(g,C.wh,33,21);
    R(g,C.pk,25,24,2,1); R(g,C.pk,37,24,2,1);
    S(g,30,24,['p..p','.pp.']);
    // nurse cap with leaf-cross
    S(g,26,13,[
      '...WWWWWW..',
      '..WWWgWWWL.',
      '.WWWgggWWWL',
      '.WWWWgWWWLL',
      '.LLLLLLLLL.'
    ]);
    // antennae
    S(g,23,8+ab,[
      'oo..............oo',
      'oo..............oo',
      '..o............o..',
      '...o..........o...',
      '....o........o....',
      '.....o......o.....'
    ].map((r,i)=>i>=4&&ab?r:r));
    if (ab) { P(g,C.ol,28,13); P(g,C.ol,35,13); }
    // arm + dew drop
    S(g,42,30,['..o','.o.','o..']);
    S(g,43,23,[
      '..o..',
      '.oko.',
      'okWko',
      'oWkbo',
      'okkbo',
      '.ooo.'
    ]);
    S(g,17,31,['o..','.o.','..o']);
  };

  // 14. Colmeia Dourada (construção)
  CARD_ART['colmeia-dourada'] = function(g,t){
    // warm late light (cream sky), apple-tree canopy across the top
    bgPomar(g,3,{noCanopy:true});
    const cs = [[4,3,8],[17,2,7],[29,4,7],[40,3,7],[52,2,7],[61,4,7],[23,8,4],[45,8,4]];
    const cf = (x,y)=>{ for (const c of cs) if (inE(x,y,c[0],c[1],c[2],c[2]-1.5)) return true; return false; };
    F(g,C.ol,0,0,63,13,dil(cf));
    F(g,C.gd,0,0,63,13,cf);
    F(g,C.gr,0,0,63,13,(x,y)=>{ for (const c of cs) if (inE(x,y,c[0]-1.5,c[1]-1.5,c[2]-3,c[2]-4)) return true; return false; });
    F(g,C.lm,0,0,63,13,(x,y)=>cf(x,y)&&!cf(x-1,y-1)&&!cf(x,y-2)&&y>1);
    for (const p of [[8,5],[21,3],[36,6],[49,4],[58,7],[14,8]]) { R(g,C.rd,p[0],p[1],2,2); P(g,C.wh,p[0],p[1]); }
    for (const p of [[3,7],[27,2],[44,6],[55,3],[31,8]]) P(g,C.pk,p[0],p[1]);
    // the branch stub the hive hangs from
    R(g,C.ol,26,8,13,4); R(g,C.wd,27,9,11,2); R(g,C.wo,27,9,11,1);
    // hive
    const hv = (x,y)=>{ const u=(y+0.5-25)/15.5; if(u<-1||u>1) return false; const rx=11.5*Math.sqrt(1-u*u)*(u<0?1+0.35*u:1-0.15*u); return Math.abs(x+0.5-32)<=rx; };
    F(g,C.ol,18,8,46,42,dil(hv));
    F(g,C.st,18,8,46,42,hv);
    // bands
    for (let y = 13; y < 41; y += 5) F(g,C.wo,18,y,46,y,(x,yy)=>hv(x,yy));
    F(g,C.yl,18,8,46,42,(x,y)=>hv(x,y)&&((y-13)%5===1||(y-13)%5===2)&&x<34&&hv(x-2,y));
    F(g,C.wo,18,8,46,42,(x,y)=>hv(x,y)&&!hv(x+2,y));
    F(g,C.cr,18,8,46,42,(x,y)=>hv(x,y)&&!hv(x-1,y)&&(y-13)%5!==0);
    // entrance
    S(g,29,30,['.oooo.','oossoo','.oooo.']);
    // honey drips
    // honey drips + a small puddle in the grass
    S(g,27,37,['yO','yO','.O','.O']);
    S(g,35,38,['yO','.O']);
    const dp = fl(t*2)%3;
    S(g,27,41+dp,['.O','yO','OO']);
    E(g,C.wd,30,45.5,5,1.2); E(g,C.or,30,45,4,1); R(g,C.yl,28,44,2,1);
    // bees orbiting
    const bp = [[13,22],[51,20],[50,34]];
    for (let i = 0; i < 3; i++) {
      const a = (t*4 + i*2.1);
      const k = fl(a)%8;
      const ox = [2,1,0,-1,-2,-1,0,1][k], oy = [0,1,2,1,0,-1,-2,-1][k];
      const x = bp[i][0]+ox, y = bp[i][1]+oy;
      S(g,x-2,y-3,['.kk.','.kWk','oyoy','yoyo','.oo.']);
      P(g,C.wh,x+1,y-1);
    }
  };

  // 15. Macieira Anciã (épica)
  CARD_ART['macieira-ancia'] = function(g,t){
    R(g,C.pk,0,0,64,8); R(g,C.cr,0,8,64,12);
    for (let x = 0; x < 64; x += 4) P(g,C.cr,x+((x>>2)&1)*2,7);
    R(g,C.gd,0,19,64,15);
    R(g,C.gr,0,34,64,14); R(g,C.gd,0,34,64,1);
    for (let x = 1; x < 64; x += 5) R(g,C.lm,x,37+(hs(x,7)%3)*3,1,2);
    // roots
    for (const s of [-1,1]) {
      const p = [32+s*7,36, 32+s*15,40, 32+s*24,42, 32+s*27,45, 32+s*22,44, 32+s*14,44, 32+s*8,43];
      const pp = s<0?p:p;
      PG(g,C.ol,pp.map((v,i)=>i%2?v+(i===3||i===5?0:0):v));
      PG(g,C.wo,[32+s*8,37, 32+s*15,41, 32+s*23,43, 32+s*25,44, 32+s*14,43, 32+s*9,42]);
      LN(g,C.wd,32+s*10,42,32+s*22,43);
    }
    // trunk
    const tr = (x,y)=>{ if (y<18||y>44) return false; const w = 7.5 + (y>36 ? (y-36)*0.9 : 0); return Math.abs(x+0.5-32)<=w; };
    F(g,C.ol,20,17,44,45,dil(tr));
    F(g,C.wo,20,17,44,45,tr);
    F(g,C.wd,20,17,44,45,(x,y)=>tr(x,y)&&!tr(x+3,y));
    F(g,C.st,20,17,44,45,(x,y)=>tr(x,y)&&!tr(x-2,y)&&y<36);
    for (const lx of [27,36]) R(g,C.wd,lx,34,1,8);
    // gentle face in the bark: mossy brows, closed eyes, knot nose, mossy beard
    const op = (t%4) > 3.5;
    S(g,25,26,['GGlG.....GlGG','.GG.......GG.']);
    if (op) { eye(g,27,28,2,2); eye(g,35,28,2,2); P(g,C.ol,26,29); P(g,C.ol,37,29); }
    else S(g,26,28,['o...o.o...o','.ooo...ooo.']);
    R(g,C.pk,24,30,2,1); R(g,C.pk,38,30,2,1);
    S(g,30,29,['.tw.','twwd','.dd.']);
    S(g,26,32,[
      'GGGGGGGGGGGG',
      'GlGGGlGGGGlG',
      '.GGlGGGGlGG.',
      '.GGGGGlGGGG.',
      '..GlGGGGlG..',
      '..GGGlGGG...',
      '...GGGlG....',
      '....GlG.....',
      '.....G......'
    ]);
    // pollen motes
    for (let i = 0; i < 4; i++) { const ph = fl(t*2+i*3)%8; P(g, i%2?C.cr:C.pk, [14,49,19,45][i]+(ph>>2), [32,30,38,37][i]-(ph>>1)); }
    // canopy
    const cs = [[12,11,9],[24,7,10],[38,6,10],[51,11,9],[31,13,8],[18,18,6],[46,18,6],[6,17,5],[58,18,5]];
    const cf = (x,y)=>{ for (const c of cs) if (inE(x,y,c[0],c[1],c[2],c[2]-1.5)) return true; return false; };
    F(g,C.ol,0,0,63,27,dil(cf));
    F(g,C.gd,0,0,63,27,cf);
    F(g,C.gr,0,0,63,27,(x,y)=>{ for (const c of cs) if (inE(x,y,c[0]-1.5,c[1]-2,c[2]-3,c[2]-4)) return true; return false; });
    F(g,C.lm,0,0,63,27,(x,y)=>cf(x,y)&&!cf(x-1,y-1)&&!cf(x,y-2));
    for (let i = 0; i < 12; i++) { const x = 6+hs(i,3)%52, y = 4+hs(i,5)%20; if (cf(x,y)&&cf(x+3,y+2)) R(g,C.lm,x,y,2,1); }
    // blossoms
    for (const p of [[9,9],[19,4],[29,12],[44,4],[54,13],[16,15],[40,14],[48,8],[25,18],[38,19],[7,18]]) { P(g,C.pk,p[0],p[1]); P(g,C.wh,p[0]+1,p[1]); P(g,C.pk,p[0],p[1]+1); }
    // apples
    const ap = [[14,12],[21,17],[30,6],[41,10],[50,15],[34,15],[45,20],[19,7]];
    const sp = fl(t*2)%ap.length;
    for (let i = 0; i < ap.length; i++) {
      const p = ap[i];
      R(g,C.ol,p[0]-1,p[1]-1,4,4); R(g,C.rd,p[0]-1,p[1],3,2); R(g,C.rd,p[0],p[1]-1,2,1); P(g,C.wh,p[0],p[1]); R(g,C.wn,p[0],p[1]+2,2,1); P(g,C.wn,p[0]+2,p[1]+1);
      if (i===sp) { P(g,C.wh,p[0]-2,p[1]-2); P(g,C.wh,p[0]+3,p[1]-2); P(g,C.wh,p[0]+1,p[1]-3); }
    }
  };

  // 16. Guardiã Florada (lendária)
  CARD_ART['guardia-florada'] = function(g,t){
    // sunrise sky, the sun rising right behind her head like a halo
    R(g,C.pu,0,0,64,4); R(g,C.pk,0,4,64,6); R(g,C.or,0,10,64,5); R(g,C.cr,0,15,64,5);
    F(g,C.or,12,0,58,19,eF(35,16,19,15));
    F(g,C.yl,12,0,58,19,eF(35,16,14,11.5));
    F(g,C.cr,12,0,58,19,eF(35,16,9,8));
    // orchard
    R(g,C.gd,0,19,64,15);
    R(g,C.wd,3,14,2,20); R(g,C.wd,59,14,2,20);
    const cs = [[4,12,8],[61,11,7]];
    const cf = (x,y)=>{ for (const c of cs) if (inE(x,y,c[0],c[1],c[2],c[2]-1)) return true; return false; };
    F(g,C.gd,0,0,63,24,cf);
    R(g,C.gr,0,7,5,3); R(g,C.gr,1,6,3,1); R(g,C.gr,57,6,5,3); R(g,C.gr,58,5,3,1);
    for (const p of [[5,8],[9,14],[59,8],[1,13]]) R(g,C.rd,p[0],p[1],2,2);
    for (const p of [[2,9],[8,11],[62,14],[57,12]]) P(g,C.pk,p[0],p[1]);
    // grass + path
    R(g,C.gr,0,34,64,14); R(g,C.gd,0,34,64,1);
    PG(g,C.st,[30,34, 37,34, 50,48, 16,48]);
    PG(g,C.cr,[32,34, 35,34, 37,39, 30,39]);
    for (let x = 1; x < 64; x += 5) if (x<17||x>49) R(g,C.lm,x,37+(hs(x,7)%3)*3,1,2);
    // flowing hair of petals (behind her), streaming down to the right
    const lobes = [[35,9.5,5.5],[41,9,4.5],[44,13,4.5],[46,18,4.2],[48,23,4],[49,28,3.6],[48,33,3.2],[45,37,2.6],[42,15,3.5],[44,22,3.2],[45,28,3]];
    const hf = (x,y)=>{ for (const l of lobes) if (inE(x,y,l[0],l[1],l[2],l[2])) return true; return false; };
    F(g,C.ol,26,0,55,42,dil(hf));
    F(g,C.pk,26,0,55,42,hf);
    F(g,C.li,26,0,55,42,(x,y)=>hf(x,y)&&!hf(x+1,y+2));
    R(g,C.wh,41,6,3,1); R(g,C.wh,44,10,2,1); R(g,C.wh,46,15,2,1); R(g,C.wh,40,12,2,1); R(g,C.wh,48,20,2,1); R(g,C.wh,49,26,1,2);
    for (const p of [[46,15],[48,21],[49,26],[47,31]]) R(g,C.li,p[0],p[1],2,1);
    // gown of leaves
    const gw = [32,26, 38,26, 41,32, 44,37, 47,44, 43,43, 40,45, 36,43, 33,45, 30,43, 26,45, 23,43, 20,44, 24,37, 28,32];
    const gf = pF(gw), gb = box(gw);
    F(g,C.ol,gb[0]-1,gb[1]-1,gb[2]+1,gb[3]+1,dil(gf));
    F(g,C.gr,gb[0],gb[1],gb[2],gb[3],gf);
    F(g,C.gd,gb[0],gb[1],gb[2],gb[3],(x,y)=>gf(x,y)&&!gf(x+3,y));
    R(g,C.lm,31,28,1,4); R(g,C.lm,29,32,1,4); R(g,C.lm,27,36,1,4); R(g,C.lm,25,40,1,3);
    S(g,27,32,[
      '....l.l......',
      '.....l....G..',
      '.........G.G.',
      '..l.l........',
      '...l...l.l...',
      '........l....',
    ]);
    for (const p of [[27,40],[37,36],[33,32],[41,42]]) { P(g,C.pk,p[0],p[1]); P(g,C.wh,p[0]+1,p[1]); }
    // torso of bark with a leaf collar
    const to = [31,19, 39,19, 38,23, 38,27, 32,27, 32,23];
    const tf = pF(to);
    F(g,C.ol,29,17,41,28,dil(tf)); F(g,C.wo,29,17,41,28,tf);
    F(g,C.wd,29,17,41,28,(x,y)=>tf(x,y)&&!tf(x+2,y)); F(g,C.st,29,17,41,28,(x,y)=>tf(x,y)&&!tf(x-1,y));
    S(g,31,19,['gglggggl','.gGlgGg.']);
    R(g,C.wd,32,25,6,1);
    // right arm down, with a leaf
    S(g,38,20,[
      '.oo...',
      '.owo..',
      '..owo.',
      '..owo.',
      '...owo',
      '..ogwo',
      '.ogllo',
      '..ooo.'
    ]);
    // raised arm holding the glowing apple
    S(g,24,12,[
      '.oo....',
      'oto....',
      'owwo...',
      '.owwo..',
      '..owwo.',
      '...owwo',
      '....owo',
      '.....oo'
    ]);
    S(g,27,14,['gl','.g']);
    const gl = fl(t*2)%2;
    F(g,C.li,15,0,31,16,(x,y)=>inE(x,y,23,8.5,6,6)&&!inE(x,y,23,8.5,5,5));
    if (gl) { R(g,C.li,15,8,2,1); R(g,C.li,29,8,2,1); P(g,C.wh,17,3); P(g,C.wh,28,13); }
    else { P(g,C.wh,16,8); P(g,C.wh,30,8); P(g,C.li,18,3); P(g,C.li,28,3); }
    S(g,20,5,[
      '...dl.',
      '..odll',
      '.orrro',
      'orWrrro',
      'orrrrno',
      'orrrnno',
      '.onnno.',
      '..ooo..'
    ]);
    // head (big, readable)
    const hd = eF(35,13.5,5,5.5);
    F(g,C.ol,28,6,42,20,dil(hd));
    F(g,C.st,28,6,42,20,hd);
    F(g,C.wo,28,6,42,20,(x,y)=>hd(x,y)&&!hd(x+2,y));
    R(g,C.st,34,18,3,2);
    // crown of blossoming twigs
    S(g,27,0,[
      'pWp.............pWp',
      '.dd.............dd.',
      '...dd.........dd...',
      '.....d.......d.....',
      '.....d.......d.....'
    ]);
    // fringe of petals
    S(g,29,6,[
      '..oooooooo..',
      '.oppWpppppo.',
      'oppppppppppo',
      'opp.....pipi',
      'op........pi'
    ]);
    eye(g,32,13,2,3); eye(g,37,13,2,3);
    R(g,C.pk,30,16,2,1); R(g,C.pk,39,16,2,1);
    S(g,34,16,['o..o','.rr.']);
    S(g,38,5,['.W.','WyW','.W.']); S(g,47,24,['.W.','WyW','.W.']);
    // drifting petals (loop)
    for (let i = 0; i < 4; i++) {
      const ph = (t*3 + i*5) % 20;
      const x = fl([10,48,56,18][i] + ph*0.6) % 64, y = fl([22,34,6,30][i] + ph) % 46;
      if (i%2) { R(g,C.pk,x,y,2,1); P(g,C.wh,x+1,y-1); } else { P(g,C.wh,x,y); P(g,C.pk,x+1,y); }
    }
  };

  // ======================================================== NEUTRO
  // 17. Pintinho Valente
  CARD_ART['pintinho-valente'] = function(g,t){
    bgCeleiro(g,0);
    const dy = (t%1) > 0.85 ? -1 : 0;
    E(g,C.wo,32,43,10,1.6);
    // feet
    S(g,25,40+dy,['.O.O....O.O.','OOOO....OOOO']);
    // body
    const bf = any(eF(32,32+dy,9.5,9),eF(32,25+dy,7,6));
    F(g,C.ol,20,17,44,43,dil(bf));
    F(g,C.yl,20,17,44,43,bf);
    F(g,C.st,20,17,44,43,(x,y)=>bf(x,y)&&!bf(x+2,y+2));
    F(g,C.cr,20,17,44,43,(x,y)=>bf(x,y)&&!bf(x-1,y-1)&&y<32+dy);
    // chest fluff
    S(g,28,32+dy,['.c.c.c.c','cccccccc','.cccccc.','..cccc..']);
    // left wing
    S(g,20,29+dy,['.oo..','otto.','ottto','.otto','..oo.']);
    // sword in the right wing
    R(g,C.ol,44,10+dy,3,22); R(g,C.wo,45,11+dy,1,20); P(g,C.st,45,11+dy);
    S(g,43,7+dy,['..l.','.lgo','.oo.']);
    R(g,C.ol,41,26+dy,7,3); R(g,C.wd,42,27+dy,5,1);
    S(g,39,27+dy,['.ooo','ottto','otttto','.oooo']);
    // bottle-cap helmet
    S(g,24,15+dy,[
      '....ooooooo....',
      '..oorrrrrrroo..',
      '.orrWWrrrrrrro.',
      '.orWrrrrrrrrno.',
      'oLLLLLLLLLLLLLo',
      'oLYLYLYLYLYLYLo',
      '.ooooooooooooo.'
    ]);
    // brave face
    S(g,26,22+dy,['oo.......oo','..o.....o..']);
    eye(g,27,24+dy,2,3); eye(g,34,24+dy,2,3);
    S(g,29,27+dy,['.oooo.','oOOOOo','.oOOo.','..oo..']);
    R(g,C.pk,24,27+dy,2,1); R(g,C.pk,38,27+dy,2,1);
  };

  // 18. Adubo Mágico (feitiço)
  CARD_ART['adubo-magico'] = function(g,t){
    bgCeleiro(g,1);
    const ph = fl(t*6);
    // magic glow: soft halo + light beams rising from the compost (moving up)
    F(g,C.pu,4,0,60,33,(x,y)=>inE(x,y,32,14,20,13)&&!inE(x,y,32,14,19,12)&&(x+y)%2===0);
    for (const bx of [14,20,26,38,44,50]) {
      const top = bx<20||bx>44 ? 6 : 1, len = 3;
      for (let y = 17 - ((ph + bx) % 5); y > top; y -= 5) R(g, bx%3?C.li:C.lm, bx, y-len+1, 1, len);
    }
    // shadow on the floor
    E(g,C.sd,32,45,17,1.8);
    // sack
    const sk = [21,22, 43,22, 41,26, 45,31, 47,37, 47,43, 44,45, 20,45, 17,43, 17,37, 19,31, 23,26];
    const sf = pF(sk), sb = box(sk);
    F(g,C.ol,sb[0]-1,sb[1]-1,sb[2]+1,sb[3]+1,dil(sf));
    F(g,C.st,sb[0],sb[1],sb[2],sb[3],sf);
    F(g,C.wo,sb[0],sb[1],sb[2],sb[3],(x,y)=>sf(x,y)&&(!sf(x+3,y)||!sf(x,y+2)));
    F(g,C.cr,sb[0],sb[1],sb[2],sb[3],(x,y)=>sf(x,y)&&!sf(x-1,y)&&y>27);
    // burlap weave
    for (let i = 0; i < 12; i++) { const x = 21+hs(i,2)%22, y = 28+hs(i,6)%14; if (sf(x,y)&&sf(x+2,y)&&!(x>27&&x<38&&y>30&&y<41)) R(g,C.wo,x,y,2,1); }
    // label with a sprout mark
    S(g,27,31,[
      'oooooooooo',
      'occccccclo',
      'occclgcco',
      'occgllgcco',
      'occcggccco',
      'occccgccco',
      'otttttttto',
      'oooooooooo'
    ].map(r=>r.padEnd(10,'.').slice(0,10)));
    // glowing compost mound overflowing
    const cm = any(eF(25,16,5,5),eF(32,13.5,6,5.5),eF(39,15.5,5,5),eF(44,19,3.5,3.5),eF(20,19,3.5,3.5),eF(30,18,4,3),eF(36,18,4,3));
    const cmv = (x,y)=>cm(x,y)&&y<=21;
    F(g,C.ol,15,9,49,22,(x,y)=>dil(cmv)(x,y)&&y<=21);
    F(g,C.li,15,9,49,21,cmv);
    F(g,C.pu,15,9,49,21,(x,y)=>cmv(x,y)&&(!cm(x,y+2)||y>=20));
    F(g,C.wh,15,9,49,21,(x,y)=>cmv(x,y)&&!cm(x-1,y-1)&&!cm(x,y-1));
    for (const p of [[24,15],[29,13],[36,14],[33,17],[27,18],[40,16],[44,19],[20,19],[31,11]]) P(g,(hs(p[0],p[1])+ph)%3?C.lm:C.gr,p[0],p[1]);
    // rolled rim of the sack, in front of the compost
    R(g,C.ol,17,20,30,5); R(g,C.wo,18,21,28,3); R(g,C.st,18,21,28,1); R(g,C.wd,18,23,28,1);
    R(g,C.wd,23,21,1,2); R(g,C.wd,30,21,1,2); R(g,C.wd,37,21,1,2); R(g,C.wd,43,21,1,2);
    // spilling down the sack
    S(g,18,19,['oiio','ouuo','.ouo','.ouo','.oio','..o.']);
    S(g,28,20,['oiio.','ouuuo','.ouo.','.oio.','..o..']);
    S(g,40,19,['oiiio','ouuuo','.ouuo','.ouo.','.ouo.','.oio.','..o..']);
    // sprout bursting out of the top
    S(g,23,1,[
      '..ooo.............ooo..',
      '.ollloo.........oolllo.',
      'ollllllo...o...ollllggo',
      'ogllllggo.olo.oggllggo.',
      '.ogggggggoolooggggggo..',
      '..ooogggggolgggggooo...',
      '.....oooooglgooooo.....',
      '..........ogo..........',
      '..........ogo..........',
      '..........ogo..........'
    ]);
    // rising sparkles (loop)
    const sp = [[12,0,C.lm],[19,9,C.li],[46,4,C.wh],[52,13,C.lm],[8,17,C.li]];
    for (const s of sp) {
      const k = (ph + s[1]) % 22, y = 33 - k, x = s[0] + ((k>>2)&1);
      if (k%4===0) spark(g,s[2],x,y,false); else P(g,s[2],x,y);
    }
  };

  // ======================================================== FICHA
  // 19. Cereja (token)
  CARD_ART['cereja'] = function(g,t){
    bgPomar(g,0);
    const bl = (t%3.4) > 3.22;
    E(g,C.gd,32,43,8,1.4);
    // stem + leaf
    LN(g,C.ol,33,25,36,13,1); LN(g,C.ol,32,25,35,13,1); LN(g,C.gr,33,24,35,14,1);
    PG(g,C.ol,[35,15, 39,10, 46,10, 43,15, 38,16]);
    PG(g,C.gr,[36,14, 39,11, 44,11, 42,14, 38,15]);
    LN(g,C.lm,38,13,43,11);
    const cf = eF(32,33.5,8.6,8.6);
    F(g,C.ol,21,23,43,44,dil(cf));
    F(g,C.rd,21,23,43,44,cf);
    F(g,C.wn,21,23,43,44,(x,y)=>cf(x,y)&&!cf(x+2,y+2));
    S(g,26,27,['.WW','WW.','W..']);
    if (bl) { R(g,C.ol,27,33,3,1); R(g,C.ol,34,33,3,1); }
    else { eye(g,28,31,2,3); eye(g,34,31,2,3); }
    R(g,C.pk,25,35,2,1); R(g,C.pk,37,35,2,1);
    S(g,30,35,['o..o','.oo.']);
    S(g,22,41,['l.l','glg']); S(g,39,41,['.l.l','glgg']);
  };

  // ======================================================== RETRATOS (opcionais, P3)
  // Faces kept inside the 40x40 hero-row crop (x 12-51, y 4-43).
  CARD_ART['heroi-voce'] = function(g,t){
    bgCeleiro(g,0);
    const bl = (t%3.6) > 3.45;
    // body: cream shirt, blue overalls
    PG(g,C.ol,[14,48, 17,37, 24,33, 40,33, 47,37, 50,48]);
    PG(g,C.cr,[15,48, 18,38, 25,34, 39,34, 46,38, 49,48]);
    PG(g,C.bl,[22,48, 23,39, 41,39, 42,48]);
    R(g,C.nt,22,39,20,1); R(g,C.bl,24,34,3,5); R(g,C.bl,37,34,3,5); R(g,C.nt,26,34,1,5); R(g,C.nt,39,34,1,5);
    R(g,C.yl,25,38,2,2); R(g,C.yl,37,38,2,2);
    R(g,C.st,18,40,2,6); R(g,C.st,45,40,2,6);
    // red bandana
    S(g,23,29,[
      'oooooooooooooooooo',
      'orrrrrrrrrrrrrrrno',
      '.onrrrrrrrrrrrrno.',
      '...onrrrrWrrrno...',
      '.....onrrrrrno....',
      '.......onrrno.....',
      '.........oo.......'
    ]);
    // head
    const hd = eF(32,21.5,7.5,8.5);
    S(g,22,19,['oo','otw','oto','.oo']); S(g,40,19,['.oo','owto','.owo','.oo']);
    F(g,C.ol,22,11,42,31,dil(hd));
    F(g,C.st,22,11,42,31,hd);
    F(g,C.wo,22,11,42,31,(x,y)=>hd(x,y)&&!hd(x+2,y+1));
    // brown hair cap with a jagged fringe and side locks
    const hc = (x,y)=>(inE(x,y,32,18.5,9,6.8) && y <= 16 + (x%3===1?1:0)) || ((x===24||x===25||x===38||x===39) && y>=15 && y<=20 && inE(x,y,32,19,9,7));
    F(g,C.ol,21,10,43,22,(x,y)=>dil(hc)(x,y)&&!hc(x,y)&&!hd(x,y));
    F(g,C.sd,21,10,43,22,hc);
    F(g,C.wd,21,10,43,22,(x,y)=>hc(x,y)&&y===15&&x%4===1);
    // face
    if (bl) { R(g,C.ol,27,21,3,1); R(g,C.ol,35,21,3,1); }
    else { eye(g,27,19,3,3); eye(g,35,19,3,3); }
    R(g,C.pk,24,23,3,1); R(g,C.pk,38,23,3,1); P(g,C.wo,25,24); P(g,C.wo,27,23); P(g,C.wo,37,23); P(g,C.wo,39,24);
    S(g,30,25,['o....o','.oooo.','..rr..']);
    // straw hat
    S(g,14,4,[
      '...........oooooooooo...........',
      '..........oyyyyyyyttto..........',
      '..........oyytyyyyytttwo........',
      '..........oyyyyyyytytttwo.......',
      '..........orrrrrrrrrrrnno.......',
      '...oooooooooooooooooooooooooo...',
      '.ootyyyyytyyyyyyyyyytyyyyytttoo.',
      'otttttttttttttttttttttttttttwwwo',
      '.oowwwwwwwwwwwwwwwwwwwwwwwwwwoo.',
      '...oooooooooooooooooooooooooo...'
    ].map(r=>r.replace(/^\.{10}/,'........').padEnd(32,'.')));
    // fan of cards in hand
    const cards = [[44,30,0],[47,29,1],[50,30,2]];
    for (const c of cards) {
      S(g,c[0],c[1],[
        'oooooo',
        'oyyyyo',
        'oyGGyo',
        'oGyyGo',
        'oyGGyo',
        'oGGGGo',
        'oyyyyo',
        'oooooo'
      ]);
    }
    S(g,43,36,['.oooo.','osttto','ostttso','.ooooo']);
  };

  CARD_ART['rival-pipoca'] = function(g,t){
    bgMilho(g,0);
    const wb = fl(t*2)%2;
    // shirt with popcorn buttons
    PG(g,C.ol,[13,48, 16,37, 24,33, 40,33, 48,37, 51,48]);
    PG(g,C.wo,[14,48, 17,38, 25,34, 39,34, 47,38, 50,48]);
    F(g,C.wd,14,34,50,48,(x,y)=>inPoly(x+0.5,y+0.5,[14,48, 17,38, 25,34, 39,34, 47,38, 50,48])&&!inPoly(x+2.5,y+0.5,[14,48, 17,38, 25,34, 39,34, 47,38, 50,48]));
    R(g,C.st,16,40,1,8);
    for (const b of [[31,37],[31,42]]) S(g,b[0],b[1],['.WW.','WWcW','Wycc','.cc.']);
    S(g,19,40,['orrro','rcrcr','rrrrn','onnno']);
    // straw collar
    S(g,22,31,['y.t.y.ty.t.y.ty.t.y.','.yty.yt.yty.yt.yty..']);
    // sack head, slightly tilted
    const hd = eF(32,23,8.5,8);
    F(g,C.ol,22,13,43,33,dil(hd));
    F(g,C.cr,22,13,43,33,hd);
    F(g,C.st,22,13,43,33,(x,y)=>hd(x,y)&&!hd(x+2,y+1));
    R(g,C.wo,25,30,14,1);
    // nervous face: raised brows, button eyes, wobbly smile, sweat drop
    S(g,26,17,['oo.......oo','..o.....o..']);
    eye(g,27,20,2,2); eye(g,36,20,2,2);
    R(g,C.ol,26,19,4,1); R(g,C.ol,35,19,4,1); P(g,C.wh,27,20); P(g,C.wh,36,20);
    S(g,28,25,['.o.o.o.o.','o.o.o.o.o']);
    R(g,C.pk,24,24,2,1); R(g,C.pk,39,24,2,1);
    S(g,42,17+wb,['.k.','kkk','kWk','.k.']);
    // too-big hat, tilted
    S(g,9,4,[
      '...............oooooooooo.................',
      '.............ootttttyyyyto................',
      '............ottttttyyyyytto...............',
      '...........otttwtttyyyytttwo..............',
      '...........otttwwtttyytttwwo..............',
      '..........ottttwwwttttttwwwwo.............',
      '..........orrrrrrrrrrrrrrrrrnoo...........',
      '....ooooooooooooooooooooooooooooooooooo...',
      '.ooottyyyyyytyyyyyyyyyyyyyytyyyyyyyyttoo..',
      'otttttttttttttttttttttttttttttttttttwwwwoo',
      '.ooowwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwo..',
      '.....oooooooooooooooooooooooooooooooooo...'
    ]);
    S(g,25,6,['oooo','orcr','orrr','oooo']);
  };

  CARD_ART['rival-tonico'] = function(g,t){
    bgMilho(g,0);
    const sw = fl(t*2)%2;
    // plaid shirt
    const sh = [16,48, 19,38, 26,34, 38,34, 45,38, 48,48];
    PG(g,C.ol,mv(sh,-1,-1)); PG(g,C.ol,mv(sh,1,-1));
    PG(g,C.rd,sh);
    for (const x of [21,27,33,39,44]) R(g,C.wn,x,35,2,13);
    for (const y of [38,43]) R(g,C.wn,17,y,31,1);
    R(g,C.cr,29,34,6,2); R(g,C.cr,30,36,4,1);
    // long neck
    R(g,C.ol,28,29,8,6); R(g,C.st,29,29,6,6); R(g,C.wo,33,29,2,6);
    // head (narrow, lanky)
    const hd = eF(32,21,7,8.5);
    F(g,C.ol,23,11,41,31,dil(hd));
    F(g,C.st,23,11,41,31,hd);
    F(g,C.wo,23,11,41,31,(x,y)=>hd(x,y)&&!hd(x+2,y+1));
    E(g,C.ol,24.5,22,2,2.5); E(g,C.st,24.5,22,1.2,1.6); E(g,C.ol,39.5,22,2,2.5); E(g,C.wo,39.5,22,1.2,1.6);
    // hair poking out
    S(g,23,13,['wdw.........wdw','dw...........wd','w.............w']);
    // cocky face: one raised brow, half-lidded eyes, lopsided grin, grass straw
    S(g,26,15,['.........ooo','oooo.....o..']);
    S(g,27,18,['ooo....ooo','oWo....oWo','ooo....ooo']);
    R(g,C.wo,27,18,3,1); R(g,C.wo,34,18,3,1);
    P(g,C.wo,26,22); P(g,C.wo,28,23); P(g,C.wo,37,23); P(g,C.wo,39,22);
    S(g,29,25,['o.....oo','.oooooo.','..WWWo..']);
    // grass straw
    LN(g,C.gr,36,25,46,20+sw); LN(g,C.lm,37,24,45,20+sw); P(g,C.lm,47,19+sw); P(g,C.lm,46,18+sw);
    // corn-yellow cap, brim to the left
    S(g,12,4,[
      '.............oooooooooo....',
      '...........ooyyyyyyyyOOoo..',
      '..........oyyyyyyyyyyyOOOo.',
      '.........oyycyyyyyyyyyyOOOo',
      '.........oyyyyyyyyyyyyyyOOo',
      '.........oyyyyyyyooyyyyyOOo',
      '..ooooooooyyyyyyoGGoyyyyOOo',
      '.oOOyyyyyyyyyyyyyooyyyyyyOo',
      'oOOOOOOOOOooooooooooooooooo',
      '.oooooooooo................'
    ]);
  };

  CARD_ART['rival-ameixa'] = function(g,t){
    bgPomar(g,0);
    const bl = (t%3.2) > 3.05;
    // plump body: plum dress with a cream apron
    PG(g,C.ol,[8,48, 11,38, 20,33, 44,33, 53,38, 56,48]);
    PG(g,C.pu,[9,48, 12,39, 21,34, 43,34, 52,39, 55,48]);
    F(g,C.li,9,34,55,48,(x,y)=>inPoly(x+0.5,y+0.5,[9,48, 12,39, 21,34, 43,34, 52,39, 55,48])&&!inPoly(x-0.5,y-0.5,[9,48, 12,39, 21,34, 43,34, 52,39, 55,48]));
    PG(g,C.ol,[21,48, 23,38, 41,38, 43,48]); PG(g,C.cr,[22,48, 24,39, 40,39, 42,48]);
    R(g,C.st,24,43,16,1); S(g,29,40,['.r.r','rrrr','.rr.']);
    // pruning shears in her hand
    S(g,44,27,[
      '.oo..oo.',
      'oLLooLLo',
      '.oLLLLo.',
      '..oLLo..',
      '...oo...',
      '..oYYo..',
      '.orooro.',
      'orro.orro',
      'orro.orro',
      '.oo...oo.'
    ]);
    S(g,42,36,['.oooo.','ocsscco','ocsccco','.ooooo']);
    // round face
    const hd = eF(32,24,9.5,8.5);
    F(g,C.ol,20,14,44,34,dil(hd));
    F(g,C.cr,20,14,44,34,hd);
    F(g,C.st,20,14,44,34,(x,y)=>hd(x,y)&&!hd(x+2,y+1));
    // grey curls at the sides
    S(g,20,17,['oLLo','LLLL','LYLo','oLL.']);
    S(g,41,17,['oLLo','LLLL','oLYL','.LLo']);
    if (bl) { R(g,C.ol,26,24,3,1); R(g,C.ol,35,24,3,1); }
    else { eye(g,26,22,3,3); eye(g,35,22,3,3); }
    R(g,C.pk,23,26,3,2); R(g,C.pk,38,26,3,2);
    S(g,29,27,['o....o','.oooo.','.orro.','..oo..']);
    // plum-purple hat full of fruit
    S(g,14,7,[
      '..........ooooooooooooo....................',
      '........oouuuuuuuuuuuuuoo..................',
      '.......ouuiiuuuuuuuuuuuuuo.................',
      '.......ouiiuuuuuuuuuuuuuuo.................',
      '...ooooouuuuuuuuuuuuuuuuuuooooo............',
      '.oouuuuuuuuuuuuuuuuuuuuuuuuuuuuoo..........',
      'ouiiiuuuuuuuuuuuuuuuuuuuuuuuuuuuuo.........',
      'ouuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuo........',
      '.ooNNNNNNNNNNNNNNNNNNNNNNNNNNNNNoo.........',
      '...ooooooooooooooooooooooooooooo...........'
    ].map(r=>r.slice(0,40)));
    // fruit on the hat
    S(g,17,4,['..g.','.ogo','orWro','orrrn','.onn.']);
    S(g,26,2,['...l.','..ogo','.oyyo.','oyylyo','oyyyyo','.oyyo.']);
    S(g,34,4,['.g.g.','.o.o.','oro.oro','rWnorWn','onn.onn']);
    S(g,43,6,['.g..','ogo.','olgo','.oo.']);
    S(g,21,9,['.oo.','orWo','orno','.oo.']);
  };
})();
