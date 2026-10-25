(function(){
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

  // ------------------------------------------------------------ helpers
  const fl = Math.floor, rn = Math.round, sin = Math.sin, cos = Math.cos, PI = Math.PI, ab = Math.abs;
  const cl = (v,a,b)=>v<a?a:v>b?b:v;
  const ez = x=>{ x = cl(x,0,1); return x*x*(3-2*x); };
  const eob = x=>{ x = cl(x,0,1)-1; return 1+2.70158*x*x*x+1.70158*x*x; };
  const ebo = x=>{ x = cl(x,0,1); const n=7.5625, d=2.75;
    if (x < 1/d) return n*x*x; if (x < 2/d) { x -= 1.5/d; return n*x*x+0.75; }
    if (x < 2.5/d) { x -= 2.25/d; return n*x*x+0.9375; } x -= 2.625/d; return n*x*x+0.984375; };
  const lp = (a,b,u)=>a+(b-a)*u;
  // current context, integer offset and clip window (absolute canvas pixels)
  let G = null, OX = 0, OY = 0, X0 = 0, Y0 = 0, X1 = 64, Y1 = 64;
  function begin(g){ G = g; OX = 0; OY = 0; X0 = 0; Y0 = 0; X1 = 64; Y1 = 64; }
  function R(c,x,y,w,h){
    x = fl(x)+OX; y = fl(y)+OY; w = fl(w); h = fl(h);
    if (x < X0) { w -= X0-x; x = X0; } if (y < Y0) { h -= Y0-y; y = Y0; }
    if (x+w > X1) w = X1-x; if (y+h > Y1) h = Y1-y;
    if (w > 0 && h > 0 && c) { G.fillStyle = c; G.fillRect(x,y,w,h); }
  }
  const P = (c,x,y)=>R(c,x,y,1,1);
  // fill of the pixels of a box (local coords) where f is true: runs are merged across lines into
  // rectangles, scanning rows or columns, whichever needs fewer fillRect calls
  const BUF = new Uint8Array(64*64);
  function runs(c,x0,y0,w,h,col,draw){
    const A = col ? w : h, B = col ? h : w;
    let prev = [], n = 0;
    const close = (q,i)=>{ n++; if (draw) { if (col) R(c,x0+q[1],y0+q[0],i-q[1],q[2]); else R(c,x0+q[0],y0+q[1],q[2],i-q[1]); } };
    for (let i = 0; i <= A; i++) {
      const cur = [];
      if (i < A) {
        let s = -1;
        for (let j = 0; j <= B; j++) {
          const v = j < B && (col ? BUF[j*w+i] : BUF[i*w+j]);
          if (v) { if (s < 0) s = j; } else if (s >= 0) { cur.push([s,i,j-s]); s = -1; }
        }
      }
      let pi = 0;
      for (let k = 0; k < cur.length; k++) {
        while (pi < prev.length && prev[pi][0] < cur[k][0]) close(prev[pi++],i);
        if (pi < prev.length && prev[pi][0] === cur[k][0]) {
          if (prev[pi][2] === cur[k][2]) cur[k][1] = prev[pi][1]; else close(prev[pi],i);
          pi++;
        }
      }
      while (pi < prev.length) close(prev[pi++],i);
      prev = cur;
    }
    return n;
  }
  function F(c,x0,y0,x1,y1,f){
    x0 = Math.max(fl(x0), X0-OX); y0 = Math.max(fl(y0), Y0-OY);
    x1 = Math.min(Math.ceil(x1), X1-1-OX); y1 = Math.min(Math.ceil(y1), Y1-1-OY);
    const w = x1-x0+1, h = y1-y0+1;
    if (w <= 0 || h <= 0) return;
    let any1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = f(x+x0,y+y0) ? 1 : 0; BUF[y*w+x] = v; any1 |= v; }
    if (!any1) return;
    const nr = runs(c,x0,y0,w,h,false,false), nc = runs(c,x0,y0,w,h,true,false);
    runs(c,x0,y0,w,h,nc < nr,true);
  }
  const inE = (x,y,cx,cy,rx,ry)=>{ const a=(x+0.5-cx)/rx, b=(y+0.5-cy)/ry; return a*a+b*b<=1; };
  const eF = (cx,cy,rx,ry)=>{ ry = ry||rx; return (x,y)=>inE(x,y,cx,cy,rx,ry); };
  function E(c,cx,cy,rx,ry){ ry = ry||rx; F(c,cx-rx-1,cy-ry-1,cx+rx+1,cy+ry+1,eF(cx,cy,rx,ry)); }
  const any = (...fs)=>(x,y)=>{ for (let i = 0; i < fs.length; i++) if (fs[i](x,y)) return true; return false; };
  function inPoly(px,py,p){
    let c = false;
    for (let i = 0, j = p.length-2; i < p.length; j = i, i += 2) {
      const xi=p[i], yi=p[i+1], xj=p[j], yj=p[j+1];
      if ((yi > py) !== (yj > py) && px < (xj-xi)*(py-yi)/(yj-yi)+xi) c = !c;
    }
    return c;
  }
  const pF = p=>(x,y)=>inPoly(x+0.5,y+0.5,p);
  function bx(p,m){ m = m||0; let a=1e9,b=1e9,c=-1e9,d=-1e9; for(let i=0;i<p.length;i+=2){ if(p[i]<a)a=p[i]; if(p[i]>c)c=p[i]; if(p[i+1]<b)b=p[i+1]; if(p[i+1]>d)d=p[i+1]; } return [fl(a-m-1),fl(b-m-1),Math.ceil(c+m+1),Math.ceil(d+m+1)]; }
  const lpP = (a,b,u)=>a.map((v,i)=>v+(b[i]-v)*u);
  // thick polyline, radius tapering r0 -> r1 along its length
  function tb(pts,r0,r1){
    if (r1 === undefined) r1 = r0;
    const sg = []; let L = 0;
    for (let i = 0; i+3 < pts.length; i += 2) {
      const ax=pts[i], ay=pts[i+1], dx=pts[i+2]-ax, dy=pts[i+3]-ay, l=Math.hypot(dx,dy)||1e-6;
      sg.push(ax,ay,dx,dy,l,L); L += l;
    }
    return (x,y)=>{
      const px = x+0.5, py = y+0.5;
      for (let i = 0; i < sg.length; i += 6) {
        const l = sg[i+4]; let u = ((px-sg[i])*sg[i+2]+(py-sg[i+1])*sg[i+3])/(l*l);
        u = u<0?0:u>1?1:u;
        const qx = sg[i]+sg[i+2]*u-px, qy = sg[i+1]+sg[i+3]*u-py;
        const r = r0+(r1-r0)*((sg[i+5]+u*l)/L);
        if (qx*qx+qy*qy <= r*r) return true;
      }
      return false;
    };
  }
  // rasterise a shape once (box in local coords); the mask is a fast lookup with .b = box
  function MK(f,b){
    const W = 112, O = 24, m = new Uint8Array(W*W);
    const x0 = Math.max(-O,fl(b[0])), y0 = Math.max(-O,fl(b[1])), x1 = Math.min(W-O-1,Math.ceil(b[2])), y1 = Math.min(W-O-1,Math.ceil(b[3]));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (f(x,y)) m[(y+O)*W+x+O] = 1;
    const k = (x,y)=>x>=-O&&y>=-O&&x<W-O&&y<W-O&&m[(y+O)*W+x+O]===1;
    k.b = [x0,y0,x1,y1];
    return k;
  }
  const dil = f=>(x,y)=>f(x,y)||f(x-1,y)||f(x+1,y)||f(x,y-1)||f(x,y+1);
  // outline + base + shadow (bottom-right) + light (top-left)
  function BD(k,base,shd,lit,o,s){
    const b = k.b; s = s||2;
    if (o) F(o,b[0]-1,b[1]-1,b[2]+1,b[3]+1,dil(k));
    F(base,b[0],b[1],b[2],b[3],k);
    if (shd) F(shd,b[0],b[1],b[2],b[3],(x,y)=>k(x,y)&&!k(x+s,y+s));
    if (lit) F(lit,b[0],b[1],b[2],b[3],(x,y)=>k(x,y)&&!k(x-1,y-1));
  }
  function LN(c,x0,y0,x1,y1,w){
    w = w||1; const dx=x1-x0, dy=y1-y0, n=Math.max(ab(dx),ab(dy))||1;
    for (let i = 0; i <= n; i++) R(c,rn(x0+dx*i/n),rn(y0+dy*i/n),w,w);
  }
  const K = {o:C.ol,s:C.sd,d:C.wd,w:C.wo,t:C.st,c:C.cr,W:C.wh,y:C.yl,O:C.or,r:C.rd,n:C.wn,p:C.pk,G:C.gd,g:C.gr,l:C.lm,T:C.td,q:C.tq,b:C.bl,k:C.sk,u:C.pu,i:C.li,Y:C.gy,L:C.lg,N:C.nt};
  // ASCII sprite: '.' = skip; runs merged per row; flip mirrors horizontally
  function S(x,y,rows,flip){
    x = rn(x); y = rn(y);
    for (let j = 0; j < rows.length; j++) {
      const r = rows[j], n = r.length;
      let i = 0;
      while (i < n) {
        const ch = flip ? r[n-1-i] : r[i];
        if (!K[ch]) { i++; continue; }
        let k = i+1;
        while (k < n && (flip ? r[n-1-k] : r[k]) === ch) k++;
        R(K[ch],x+i,y+j,k-i,1); i = k;
      }
    }
  }
  const spark = (c,x,y,big)=>{ x = rn(x); y = rn(y); if (big) { R(c,x-2,y,5,1); R(c,x,y-2,1,5); P(C.wh,x,y); } else { R(c,x-1,y,3,1); R(c,x,y-1,1,3); } };
  // state -> animation amounts. w: wind-up, s: strike, r: recoil, e: entrance progress
  function an(t,st,p){
    p = cl(+p||0,0,1);
    const o = {t:t, st:'idle', w:0, s:0, r:0, e:1, p:p};
    if (st === 'atk') {
      o.st = 'atk';
      o.w = p<0.35 ? ez(p/0.35) : p<0.42 ? 1-(p-0.35)/0.07 : 0;
      o.s = p<0.35 ? 0 : p<0.42 ? (p-0.35)/0.07 : p<0.55 ? 1 : Math.max(0,1-(p-0.55)/0.4);
    } else if (st === 'hit') { o.st = 'hit'; o.r = p<0.2 ? p/0.2 : Math.max(0,1-(p-0.2)/0.8); }
    else if (st === 'sono') o.st = 'sono';
    else if (st === 'entra') { o.st = 'entra'; o.e = p; }
    return o;
  }
  const blink = (t,per,off)=>((t+(off||0))%per+per)%per < 0.14;
  // fingered wing: arm from shoulder, n feathers fanning from outward (ang) to down/back
  function wingK(sx,sy,side,ang,len,n,fan,r){
    const wx = sx+side*cos(ang)*len*0.42, wy = sy-sin(ang)*len*0.42;
    const fs = [tb([sx,sy,wx,wy],r,r*0.85)];
    const pts = [sx,sy,wx,wy], mb = [sx,sy,wx,wy];
    for (let i = 0; i < n; i++) {
      const u = i/(n-1||1);
      const bx0 = lp(wx,sx,u*0.75), by0 = lp(wy,sy,u*0.75);
      const a = ang-0.2-i*fan, l = len*(0.62-u*0.22);
      const tx = bx0+side*cos(a)*l, ty = by0-sin(a)*l;
      fs.push(tb([bx0,by0,tx,ty],r*0.8,0.7));
      pts.push(tx,ty); mb.push(lp(bx0,tx,0.62),lp(by0,ty,0.62));
    }
    fs.push(pF(mb));
    return MK(any(...fs),bx(pts,r+1));
  }

  // ================================================================ Espiga Sapeca
  // cheeky corn cob: hops on its little legs, waves its husk arms, winks, tongue out; attack = husk slap
  CS['espiga-sapeca'] = function(g,t,st,p){
    begin(g); const a = an(t,st,p);
    let hop = 0, lean = 0, sq = 0, face = 'idle', front = false, tw = 0;
    const wl = sin(t*3.2);
    let tl = [15-rn(wl), 29+rn(wl*2)], tr = [49-rn(wl), 29-rn(wl*2)];
    if (a.st === 'idle') { hop = rn(ab(sin(t*3.2))*2.2); tw = fl(t*5)%2; }
    else if (a.st === 'atk') {
      lean = -2.5*a.w+4*a.s; sq = rn(a.w*2);
      tl = [lp(lp(15,11,a.w),49,a.s), lp(lp(29,40,a.w),42,a.s)];
      tr = [lp(lp(49,40,a.w),58,a.s), lp(lp(29,17,a.w),45,a.s)];
      front = a.s > 0.5; face = a.s > 0.3 ? 'yell' : a.w > 0.2 ? 'grit' : 'idle';
    } else if (a.st === 'hit') {
      OX = -rn(a.r*2); lean = -2*a.r; face = a.r > 0.15 ? 'ouch' : 'idle';
      tl = [lp(15,13,a.r), lp(29,21,a.r)]; tr = [lp(49,51,a.r), lp(29,21,a.r)];
    } else if (a.st === 'sono') {
      sq = sin(t*1.6) > 0 ? 1 : 0; face = 'sleep'; front = true;
      tl = [37,45]; tr = [27,45];
    } else if (a.st === 'entra') {
      const e = a.e; OY = rn((1-eob(e))*46); Y1 = 61; face = 'happy';
      tl = [14,20+rn(e*6)]; tr = [50,20+rn(e*6)];
    }
    OY -= hop;
    const cy = 38+sq, ry = 15-sq, top = fl(cy-ry);
    const cxA = y=>32+lean*(53-y)/30;
    const arm = (bx0,tip)=>{
      const mx = (bx0+tip[0])/2+(tip[0]<bx0?-2:2), my = (47+tip[1])/2;
      const pts = [bx0,47, mx,my, tip[0],tip[1]];
      const k = MK(tb(pts,2.8,0.6),bx(pts,3));
      BD(k,C.gr,C.gd,C.lm,C.ol,1);
    };
    // legs
    S(26,55,[
      '...ow..wo...',
      '...ow..wo...',
      '..oddooddo..',
      '.odddoodddo.',
      '.oooo..oooo.'
    ]);
    if (!front) { arm(25,tl); arm(39,tr); }
    // cob
    const cob = MK((x,y)=>{ const u=(y+0.5-cy)/ry; if(u<-1||u>1) return false; const rx=8.4*Math.sqrt(1-u*u)*(u<0?1+0.3*u:1)*(1+sq*0.06); return ab(x+0.5-cxA(y))<=rx; },[18,top-1,48,54]);
    const fx = cxA(33), fy = 33+sq;
    const fc = eF(fx,fy-0.5,6.6,5.4);
    F(C.ol,17,top-2,49,55,dil(cob));
    F(C.yl,17,top,49,54,cob);
    F(C.st,17,top,49,54,(x,y)=>cob(x,y)&&((y-top)%3===2)&&!fc(x,y));
    for (let b = 0; b < 11; b++) {
      const y = top+b*3, o = rn(cxA(y))-32;
      for (let x = 24+(b%2)+o; x < 42+o; x += 3) if (cob(x,y)&&cob(x,y+1)&&!fc(x,y)&&!fc(x,y+1)) R(C.st,x,y,1,2);
    }
    F(C.or,17,top,49,54,(x,y)=>cob(x,y)&&!cob(x+2,y));
    F(C.cr,17,top,49,54,(x,y)=>cob(x,y)&&!cob(x-1,y)&&((y-top)%3!==2)&&y<cy+4);
    // face
    const X = rn(fx), Y = rn(fy);
    const eyeO = (x,y)=>{ R(C.ol,x,y,3,3); P(C.wh,x,y); };
    if (face === 'idle') {
      if (blink(t,3.1,1.4)) R(C.ol,X-5,Y-3,3,1); else eyeO(X-5,Y-4);
      S(X+2,Y-4,['oo..','..oo','oo..']);
      S(X-5,Y,['o........o','.oooooooo.','..oWWoorro','...ooorro.',tw?'......oo..':'.....oo...']);
    } else if (face === 'happy') {
      eyeO(X-5,Y-4); eyeO(X+2,Y-4);
      S(X-5,Y,['o........o','.oooooooo.','..orrrrro.','...oprpo..','....ooo...']);
    } else if (face === 'grit') {
      LN(C.ol,X-6,Y-6,X-3,Y-5); LN(C.ol,X+5,Y-6,X+2,Y-5);
      eyeO(X-5,Y-4); eyeO(X+2,Y-4);
      S(X-4,Y+1,['oooooooo','oWWWWWWo','oooooooo']);
    } else if (face === 'yell') {
      S(X-6,Y-4,['oo..','..oo','oo..']); S(X+2,Y-4,['..oo','oo..','..oo']);
      S(X-4,Y,['.oooooo.','orrrrrro','orrnnrro','.orrrro.','..oooo..']);
    } else if (face === 'ouch') {
      S(X-6,Y-4,['oo..','..oo','oo..']); S(X+2,Y-4,['..oo','oo..','..oo']);
      S(X-4,Y+1,['.o..o..o','o.oo.oo.']);
    } else {
      S(X-5,Y-3,['o..o','.oo.']); S(X+1,Y-3,['o..o','.oo.']);
      S(X-1,Y+2,['oo','oo']);
    }
    R(C.pk,X-8,Y,2,1); R(C.pk,X+6,Y,2,1);
    // husk skirt
    const so = rn(lean*0.3);
    const sk = [21+so,43, 27,47, 32,50, 37,47, 43+so,43, 41,50, 36,55, 28,55, 23,50];
    const skk = MK(pF(sk),bx(sk));
    F(C.ol,skk.b[0]-1,skk.b[1]-1,skk.b[2]+1,skk.b[3]+1,dil(skk));
    F(C.gr,skk.b[0],skk.b[1],skk.b[2],skk.b[3],skk);
    F(C.gd,skk.b[0],skk.b[1],skk.b[2],skk.b[3],(x,y)=>skk(x,y)&&(!skk(x,y+2)||x===32||x===31));
    F(C.lm,skk.b[0],skk.b[1],skk.b[2],skk.b[3],(x,y)=>skk(x,y)&&!skk(x,y-1));
    if (front) { arm(25,tl); arm(39,tr); }
    if (a.st === 'atk' && a.s > 0.6) { spark(C.yl,59,44,true); P(C.wh,56,40); P(C.wh,61,48); }
    if (a.st === 'hit' && a.r > 0.3) { R(C.yl,17,24,2,2); R(C.yl,46,20,2,2); P(C.ol,16,24); P(C.ol,48,21); }
    if (a.st === 'entra' && a.e > 0.5 && a.e < 0.95) { spark(C.wh,14,16,false); spark(C.wh,51,14,false); }
  };

  // ================================================================ Corvo Ladino
  // sly black crow with a stolen golden kernel in its beak: shifty glances, tosses the kernel; attack = swooping peck
  CS['corvo-ladino'] = function(g,t,st,p){
    begin(g); const a = an(t,st,p);
    let hx = 0, hy = 0, u = 0, crouch = 0, open = 0, eyeM = 'sly', look = 0, kern = 1, kx = 0, ky = 0, tf = 0, puff = 0, back = 0;
    if (a.st === 'idle') {
      hx = rn(sin(t*1.3)*0.8); look = fl(t/1.4)%3===1 ? -1 : 0;
      const tp = t%3.4; if (tp < 0.9) { const k = sin(PI*tp/0.9); ky = -rn(k*9); kx = rn(k*2); open = tp < 0.15 || tp > 0.75 ? 1 : 0; }
      tf = (t%2.3) < 0.3 ? -2 : 0; if (blink(t,2.9,1.1)) eyeM = 'shut';
    } else if (a.st === 'atk') {
      u = Math.max(a.w, a.s*0.55); crouch = rn(a.w*2);
      hx = rn(-2*a.w+6*a.s); hy = rn(a.w+3*a.s); open = a.s > 0.3 ? 2 : 0; kern = a.s > 0.3 ? 0 : 1;
      eyeM = a.s > 0.3 ? 'fierce' : 'sly'; back = a.s;
    } else if (a.st === 'hit') {
      OX = -rn(a.r*2); puff = a.r > 0.2 ? 1 : 0; eyeM = a.r > 0.15 ? 'ouch' : 'sly'; hx = -rn(a.r); u = a.r*0.35;
      kern = 2; kx = rn(a.r*4); ky = -rn(a.r*12); open = 1;
    } else if (a.st === 'sono') {
      hx = -3; hy = 5+(sin(t*1.5) > 0 ? 1 : 0); eyeM = 'sleep'; kern = 3;
    } else if (a.st === 'entra') {
      const e = a.e; OY = -rn((1-ez(e))*22); u = 1-ez((e-0.35)/0.6); crouch = e > 0.85 ? 1 : 0; eyeM = 'sly';
    }
    OY += crouch;
    // far wing (only when opened)
    if (u > 0.12) {
      const fw = lpP([39,41, 40,40, 41,41, 41,42, 41,43, 40,43, 40,42, 39,42, 39,41],[40,38, 45,29, 55,21, 53,26, 58,28, 52,31, 54,35, 47,37, 43,44],u);
      const k = MK(pF(fw),bx(fw));
      F(C.ol,k.b[0]-1,k.b[1]-1,k.b[2]+1,k.b[3]+1,dil(k));
      F(C.nt,k.b[0],k.b[1],k.b[2],k.b[3],(x,y)=>k(x,y)&&!k(x,y-1));
    }
    // tail
    const tl = [25,44, 13,50+tf, 9,54+tf, 13,54+tf, 10,57+tf, 15,56+tf, 14,59+tf, 19,55, 26,51];
    { const k = MK(pF(tl),bx(tl)); F(C.ol,k.b[0]-1,k.b[1]-1,k.b[2]+1,k.b[3]+1,dil(k));
      F(C.pu,k.b[0],k.b[1],k.b[2],k.b[3],(x,y)=>k(x,y)&&!k(x,y-1)&&x<22); P(C.li,12,51+tf); }
    // legs
    S(25,53-crouch,[
      '...oYo.oYo...',
      '...oYo.oYo...',
      '...oYo.oYo...',
      '...oYo.oYo...',
      '..oYYYoYYYYo.',
      '..ooooooooooo'
    ].slice(0,6));
    if (crouch) R(C.ol,27,58,11,1);
    // body
    const pr = puff ? 1 : 0;
    const bd = MK(any(eF(31,45.5,10+pr,8.5+pr),eF(36,40,6.5+pr,6.5+pr)),[18,30,48,56]);
    F(C.ol,bd.b[0]-1,bd.b[1]-1,bd.b[2]+1,bd.b[3]+1,dil(bd));
    F(C.nt,18,30,48,56,(x,y)=>bd(x,y)&&inE(x,y,36,44,6,8)&&!bd(x+1,y+1));
    F(C.nt,18,30,48,56,(x,y)=>bd(x,y)&&bd(x+1,y+1)&&!bd(x+2,y+2)&&!bd(x+1,y+3));
    F(C.pu,18,30,48,56,(x,y)=>bd(x,y)&&!bd(x-1,y-1));
    F(C.nt,18,30,48,56,(x,y)=>bd(x-1,y-1)&&bd(x+1,y+1)&&bd(x-2,y)&&bd(x+2,y)&&y%3===0&&((x+(y%2?0:0)+fl(y/3)*2)%4===0));
    P(C.li,38,37); P(C.li,41,40); P(C.pu,39,38); P(C.pu,42,41);
    if (puff) { S(17,38,['o..','.o.']); S(44,35,['..o','.o.']); S(19,52,['o.','.o']); }
    // head
    const HX = 39+hx, HY = 31+hy;
    const hd = MK(eF(HX,HY,7,6.5),[HX-8,HY-8,HX+8,HY+8]);
    F(C.ol,HX-8,HY-8,HX+8,HY+8,dil(hd));
    F(C.pu,HX-8,HY-8,HX+8,HY+8,(x,y)=>hd(x,y)&&!hd(x-1,y-1));
    F(C.nt,HX-8,HY-8,HX+8,HY+8,(x,y)=>hd(x,y)&&!hd(x,y+1)&&x>HX-4);
    P(C.li,HX-3,HY-5); P(C.li,HX-4,HY-4);
    // beak (+ stolen kernel)
    const bxp = HX+5, byp = HY-1;
    if (a.st === 'sono') {
      S(bxp-1,byp+2,['ooo..','OOOo.','wwo..','oo...']);
    } else if (open === 2) {
      S(bxp,byp-2,['....ooo.','..ooOOOo','ooOOOOOo','oOOOOoo.','oooo....','oooo....','owwwoo..','owwwwwwo','.ooooooo']);
    } else if (open === 1) {
      S(bxp,byp,['oooo....','OOOOooo.','OOOOOOOo','ooooo...','wwwwwo..','oooooo..']);
    } else {
      S(bxp,byp,['ooooo....','OOOOOooo.','OOOOOOOOo','wwwwwwwo.','oooooo...']);
    }
    if (a.st !== 'sono') P(C.wh,bxp+1,byp+1);
    const kernel = (x,y)=>S(x,y,['.ooo.','oyyyo','oyWto','oyyto','.ooo.']);
    if (kern === 1) kernel(bxp+5+kx,byp+ky);
    else if (kern === 2) kernel(bxp+3+kx,byp-6+ky);
    else if (kern === 3) kernel(41,55);
    // sly eye under a lowered lid
    const ex = HX-3, ey = HY-4;
    if (eyeM === 'sly') {
      S(ex,ey,['.uuuuu','uuuuuu','.WWWyo','.WWyoo','..ooo.']);
      if (look < 0) S(ex,ey+2,['.Wyoo','.yooW']);
    } else if (eyeM === 'fierce') S(ex,ey,['uu...','.uuuu','.WWyo','..oo.']);
    else if (eyeM === 'ouch') S(ex,ey+1,['.LL...','...LL.','.LL...']);
    else if (eyeM === 'shut') S(ex,ey,['.....','uuuuu','.ooo.']);
    else S(ex,ey+1,['.u..u','..uu.']);
    // near wing (folded on the side, opens up when striking)
    const nw = lpP([36,40, 30,38, 16,49, 17,51, 15,53, 20,52, 21,54, 26,52, 33,49],[34,41, 26,28, 12,19, 14,24, 11,27, 16,29, 15,33, 21,36, 27,44],u);
    const nb = back ? nw.map((v,i)=>i%2?v+rn(back*3):v-rn(back*2)) : nw;
    const nk = MK(pF(nb),bx(nb));
    F(C.ol,nk.b[0]-1,nk.b[1]-1,nk.b[2]+1,nk.b[3]+1,dil(nk));
    F(C.pu,nk.b[0],nk.b[1],nk.b[2],nk.b[3],(x,y)=>nk(x,y)&&!nk(x,y-1));
    F(C.nt,nk.b[0],nk.b[1],nk.b[2],nk.b[3],(x,y)=>nk(x,y)&&nk(x,y-1)&&!nk(x,y-2)&&nk(x,y+2)&&!nk(x+3,y));
    if (u < 0.3) { LN(C.nt,31,43,21,49); LN(C.nt,33,46,24,51); LN(C.pu,30,40,24,42); P(C.li,30,40); P(C.li,19,49); }
    else { P(C.li,nb[4]+2,nb[5]+1); P(C.li,nb[2]-1,nb[3]+2); }
    if (a.st === 'atk' && a.s > 0.6) { spark(C.wh,bxp+11,byp+2,false); P(C.yl,bxp+13,byp-1); }
  };

  // ================================================================ Espantalho Guardião
  // friendly scarecrow on its post: arms see-saw in the wind, straw cuffs flutter, hat brim flaps; attack = arm swat
  CS['espantalho-guardiao'] = function(g,t,st,p){
    begin(g); const a = an(t,st,p);
    let aL = 0, aR = 0, hatY = 0, hdx = 0, hdy = 0, face = 'idle', burst = 0, hem = 0;
    const fr = fl(t*3)%2;
    if (a.st === 'idle') { const s = sin(t*1.4)*0.07; aL = s; aR = -s; hdx = rn(sin(t*0.7)*0.7); if (blink(t,3.3,0.9)) face = 'blink'; }
    else if (a.st === 'atk') {
      aL = lp(lp(0,0.35,a.w),-0.3,a.s); aR = lp(lp(0,-0.6,a.w),0.62,a.s);
      hdx = rn(-a.w+2*a.s); face = a.s > 0.25 ? 'shout' : a.w > 0.2 ? 'stern' : 'idle'; burst = a.s;
      OX = rn(-a.w+a.s*2);
    } else if (a.st === 'hit') {
      aL = -0.28*a.r; aR = -0.28*a.r; hatY = -rn(a.r*3); OX = -rn(a.r*2); face = a.r > 0.15 ? 'ouch' : 'idle'; hem = a.r;
    } else if (a.st === 'sono') {
      const b = sin(t*1.4) > 0 ? 1 : 0; aL = 0.45; aR = 0.45; hdy = 1+b; hdx = 1; hatY = 3+b; face = 'sleep';
    } else if (a.st === 'entra') {
      const e = a.e; OY = -rn((1-ebo(e))*40); aL = -0.25*(1-e); aR = -0.25*(1-e); face = e > 0.7 ? 'idle' : 'stern';
      if (e > 0.35 && e < 0.8) hem = 1;
    }
    // post
    R(C.ol,30,43,5,17); R(C.wo,31,43,3,16); R(C.wd,33,43,1,16); R(C.st,31,43,1,16); R(C.ol,29,59,7,1);
    // sleeves on the cross-bar
    const L = 17, px = 32, py = 34;
    const lx = px-L*cos(aL), ly = py+L*sin(aL), rx = px+L*cos(aR), ry = py+L*sin(aR);
    const sv = MK(tb([lx,ly,px,py,rx,ry],2.9),bx([lx,ly,px,py,rx,ry],4));
    F(C.ol,sv.b[0]-1,sv.b[1]-1,sv.b[2]+1,sv.b[3]+1,dil(sv));
    F(C.wo,sv.b[0],sv.b[1],sv.b[2],sv.b[3],sv);
    F(C.wd,sv.b[0],sv.b[1],sv.b[2],sv.b[3],(x,y)=>sv(x,y)&&!sv(x,y+2));
    F(C.st,sv.b[0],sv.b[1],sv.b[2],sv.b[3],(x,y)=>sv(x,y)&&!sv(x,y-1));
    for (const u of [0.62,0.38]) { const x = rn(lp(lx,px,1-u)), y = rn(lp(ly,py,1-u)); R(C.wd,x,y-2,1,4); }
    { const x = rn(lp(rx,px,0.38)), y = rn(lp(ry,py,0.38)); R(C.wd,x,y-2,1,4); }
    // straw cuffs (flutter)
    S(lx-6,ly-4,fr ? ['y.....','.yt...','ttyyoo','yyyyoo','tytyoo','.t.yoo','t..y..'] : ['......','yyt...','.tyyoo','yyyyoo','ttyyoo','y.tyoo','..t...']);
    S(rx,ry-4,fr ? ['.....y','...ty.','ooyytt','ooyyyy','ooytyt','ooy.t.','..y..t'] : ['......','...tyy','ooyyt.','ooyyyy','ooyytt','ooyt.y','...t..']);
    // shirt
    const sh = [24,31, 40,31, 43,46, 40,48, 37,46, 34,49, 31,46, 28,49, 25,46, 21,47];
    const sf = MK(pF(sh),bx(sh));
    F(C.ol,sf.b[0]-1,sf.b[1]-1,sf.b[2]+1,sf.b[3]+1,dil(sf));
    F(C.wo,sf.b[0],sf.b[1],sf.b[2],sf.b[3],sf);
    F(C.wd,sf.b[0],sf.b[1],sf.b[2],sf.b[3],(x,y)=>sf(x,y)&&(!sf(x+2,y)||!sf(x,y+2)));
    F(C.st,sf.b[0],sf.b[1],sf.b[2],sf.b[3],(x,y)=>sf(x,y)&&!sf(x-1,y));
    // straw at the hem (puffs out when hit / landing)
    S(24,47,fr ? ['y.t..y.ty..t.y.','.y..t..y...y...'] : ['.yt..y..ty.t.y.','y...t...y...y..']);
    if (hem) { S(19,46,['y..','.yt','y..']); S(42,46,['..y','ty.','..y']); S(27,50,['t..y..y.t','.y...t...']); }
    S(26,35,['orrro','rrrrr','rcrcr','rrrrn','onnno']);
    R(C.st,24,42,18,1); P(C.yl,33,43); P(C.st,34,44);
    R(C.wd,36,36,1,3); R(C.wd,38,34,1,2);
    // head (sack)
    const hx = 32+hdx, hy = 28+hdy;
    const hd = MK(eF(hx,hy,6,5.5),[hx-8,hy-8,hx+8,hy+8]);
    BD(hd,C.cr,C.st,null,C.ol,2);
    R(C.wo,hx-2,hy+5,5,1);
    const X = rn(hx), Y = rn(hy);
    const eye = (x,y)=>{ R(C.ol,x,y,2,2); P(C.wh,x,y); };
    if (face === 'idle' || face === 'stern' || face === 'shout') { eye(X-4,Y-1); eye(X+2,Y-1); }
    if (face === 'blink') { R(C.ol,X-4,Y,2,1); R(C.ol,X+2,Y,2,1); }
    if (face === 'stern' || face === 'shout') { S(X-5,Y-3,['oo...','..o..']); S(X+1,Y-3,['..oo.','.o...']); }
    if (face === 'ouch') { S(X-5,Y-2,['oo.','..o','oo.']); S(X+2,Y-2,['.oo','o..','.oo']); }
    if (face === 'shout') S(X-2,Y+2,['.ooo.','orrro','.ooo.']);
    else if (face === 'ouch') S(X-3,Y+2,['.o.o.o.','o.o.o.o']);
    else if (face === 'sleep') S(X-1,Y+2,['ooo']);
    else S(X-4,Y+2,['o.......o','.ooooooo.','..o.o.o..']);
    P(C.pk,X-5,Y+1); P(C.pk,X+5,Y+1);
    if (face !== 'shout') { P(C.or,X-1,Y+1); P(C.or,X,Y+1); }
    // hat
    const by = fr, HY = 17+hdy+hatY, HX = hdx;
    S(25+HX,HY,[
      '..ooooooooooo..',
      '.otyyyyytttttwo',
      '.otyyyttttttwwo',
      '.ottyttttttwwwo',
      'orrrrrrrrrrrrrro',
      'otttttttttttttwo'
    ]);
    R(C.ol,20+HX,HY+6,25,3);
    R(C.st,22+HX,HY+6,21,1); R(C.wo,21+HX,HY+7,23,1);
    R(C.ol,18+HX,HY+6+by,3,3); R(C.st,19+HX,HY+6+by,2,1); R(C.wo,19+HX,HY+7+by,2,1);
    R(C.ol,44+HX,HY+6-by,3,3); R(C.st,44+HX,HY+6-by,2,1); R(C.wo,44+HX,HY+7-by,2,1);
    P(C.yl,23+HX,HY+6); P(C.yl,26+HX,HY+6);
    // swat: straw flying off the striking hand
    if (burst > 0.5) {
      const bx0 = rn(rx+3), by0 = rn(ry+1);
      S(bx0,by0-4,['..y..t','.t..y.','y.....','...t..','.y...y']);
      spark(C.wh,bx0+6,by0+2,false);
    }
  };

  // ================================================================ Pipoqueiro Explosivo
  // grumpy popcorn puff with a lit fuse: throbs, sparks, popped bits hop around it; attack = popcorn cannon
  CS['pipoqueiro-explosivo'] = function(g,t,st,p){
    begin(g); const a = an(t,st,p);
    let kx = 1, ky = 1, face = 'idle', fuse = 1, shots = -1, kern = 0, pop = 0, flyoff = 0;
    const f4 = fl(t*6)%4;
    if (a.st === 'idle') { const b = sin(t*3); ky = 1+0.035*b; kx = 1-0.02*b; if (blink(t,2.7,0.5)) face = 'blink'; }
    else if (a.st === 'atk') {
      kx = 1+0.1*a.w-0.04*a.s; ky = 1-0.12*a.w+0.08*a.s;
      face = a.s > 0.25 ? 'blast' : a.w > 0.15 ? 'strain' : 'idle'; fuse = a.w > 0.3 ? 2 : 1;
      if (a.p > 0.36) shots = (a.p-0.36)/0.64;
    } else if (a.st === 'hit') { OX = -rn(a.r*2); kx = 1-0.06*a.r; face = a.r > 0.15 ? 'ouch' : 'idle'; flyoff = a.r; }
    else if (a.st === 'sono') { const b = sin(t*1.3); ky = 1+0.03*b; face = 'sleep'; fuse = 0; }
    else if (a.st === 'entra') {
      const e = a.e;
      if (e < 0.3) { kern = 1; } else { const u = (e-0.3)/0.6; const k = 0.35+0.65*eob(u); kx = k; ky = k; pop = 1-cl(u*1.4,0,1); face = u < 0.6 ? 'blast' : 'idle'; }
    }
    if (kern) {
      // just the golden kernel, rattling before it pops
      const j = fl(t*20+a.e*40)%2;
      S(26+j,50,['....oooo....','..ooyyyyoo..','.oyyyyyyOOo.','oyyWyyyyyOOo','oyyyyyyyyOOo','.oOyyyyyOOo.','..ooOOOOoo..','....oooo....']);
      S(23,54,['.oooo...oooo.','oOOOOo.oOOOOo','.oooo...oooo.'].map(r=>r));
      return;
    }
    const T = (x,y)=>[32+(x-32)*kx, 60+(y+17-60)*ky];
    const Tr = (x,y)=>{ const q = T(x,y); return [rn(q[0]),rn(q[1])]; };
    const ks = (kx+ky)/2;
    // popped bits hopping around (idle)
    const bit = (x,y,i)=>S(x-2,y-2, i%2 ? ['.ooo.','oWWco','oWcyo','.oyo.'] : ['oo.o.','oWoWo','oWWco','.ocyo','..oo.']);
    if (a.st === 'idle') {
      const bits = [[9,40],[55,37],[7,53],[57,51],[48,27]];
      for (let i = 0; i < bits.length; i++) { const ph = (f4+i)%4; bit(bits[i][0], bits[i][1]-(ph===1?3:ph===2?2:0), i); }
    }
    // feet
    S(24,56,['.oooo...oooo.','oOOOOo.oOOOOo','.oooo...oooo.']);
    // puffy body
    const pu = [[32,29,10],[22,27,5],[42,27,5],[24,19,5.5],[40,19,5.5],[32,14,5.5],[21,35,5],[43,35,5],[27,38,4.5],[37,38,4.5],[28,23,5],[36,23,5],[17,23,3.2],[47,23,3.2],[16,31,3.2],[48,31,3.2],[26,12,3.2],[38,12,3.2],[18,39,2.8],[46,39,2.8]]
      .map(q=>{ const c = T(q[0],q[1]); return [c[0],c[1],q[2]*ks]; });
    const bf = MK((x,y)=>{ for (let i = 0; i < pu.length; i++) { const q = pu[i]; if (inE(x,y,q[0],q[1],q[2],q[2])) return true; } return false; },[8,16,56,61]);
    F(C.ol,7,15,57,62,dil(bf));
    F(C.wh,8,16,56,61,bf);
    for (let i = 1; i < pu.length; i++) {
      const q = pu[i];
      F(i>11?C.st:C.cr,q[0]-q[2]-1,q[1]-q[2]-1,q[0]+q[2]+1,q[1]+q[2]+1,(x,y)=>inE(x,y,q[0],q[1],q[2],q[2])&&!inE(x,y,q[0]-1.4,q[1]-1.4,q[2],q[2])&&bf(x+1,y+1));
    }
    F(C.st,8,16,56,61,(x,y)=>bf(x,y)&&!bf(x+2,y+2));
    // golden hull at the base
    { const h = Tr(26,38); S(h[0],h[1],['..oooooooooo..','.oyyyyyyyyOOo.','oyyyyyyyyyOOOo','.oOOOOOOOOOoo.','..oooooooooo..']); }
    // face
    const [ex,ey] = Tr(32,25);
    const eye = (x,y)=>{ R(C.ol,x,y,3,3); P(C.wh,x,y); };
    if (face !== 'sleep' && face !== 'ouch') S(ex-9,ey-3,face==='strain'||face==='blast'?['oooo..........oooo','...ooo......ooo...','.....oo....oo.....']:['ooo............ooo','..ooo........ooo..','....oo......oo....']);
    if (face === 'idle') { eye(ex-7,ey); eye(ex+4,ey); }
    else if (face === 'blink') { R(C.ol,ex-7,ey+2,3,1); R(C.ol,ex+4,ey+2,3,1); }
    else if (face === 'strain') { R(C.ol,ex-7,ey+1,3,2); R(C.ol,ex+4,ey+1,3,2); }
    else if (face === 'blast') { S(ex-7,ey,['oo..','..oo','oo..']); S(ex+3,ey,['..oo','oo..','..oo']); }
    else if (face === 'ouch') { S(ex-7,ey,['oo..','..oo','oo..']); S(ex+3,ey,['..oo','oo..','..oo']); }
    else { S(ex-7,ey+1,['o..o','.oo.']); S(ex+3,ey+1,['o..o','.oo.']); }
    // cheeks: puffed red when building pressure
    if (face === 'strain') { R(C.rd,ex-11,ey+3,4,2); R(C.rd,ex+7,ey+3,4,2); R(C.pk,ex-10,ey+3,2,1); R(C.pk,ex+8,ey+3,2,1); }
    else { R(C.or,ex-10,ey+4,3,1); R(C.or,ex+7,ey+4,3,1); }
    const mx = ex-5, my = ey+5;
    if (face === 'blast') S(mx-1,my-1,['..oooooooooo..','.oWoWoWoWoWWo.','orrnnnnnnnnrro','ornnnnnnnnnnro','orrnnnnnnnnrro','.orrrrrrrrrro.','..oooooooooo..']);
    else if (face === 'strain') S(mx+2,my,['oooooo','oWWWWo','oooooo']);
    else if (face === 'ouch') S(mx+1,my,['.o..o..o..','o.oo.oo.oo']);
    else if (face === 'sleep') S(mx+4,my+1,['.oo.','oooo']);
    else S(mx,my,['.oooooooooo.','oWoWoWoWoWWo','orrrrrrrrrro','.oooooooooo.']);
    // fuse
    const [fx,fy] = Tr(30,4);
    S(fx,fy,['...d..','..d.d.','..d.d.','...dd.','....d.','...d..','...ow.','..owwo']);
    const sx = fx+3, sy = fy-1;
    if (fuse === 2) { spark(C.yl,sx,sy,true); spark(C.or,sx-3,sy-2,false); spark(C.or,sx+3,sy-3,false); P(C.wh,sx+1,sy-4); P(C.rd,sx-4,sy+1); }
    else if (fuse === 1) {
      if (f4%2===0) { spark(C.yl,sx,sy,true); P(C.or,sx-2,sy-2); P(C.or,sx+2,sy+2); P(C.or,sx+3,sy-1); }
      else { spark(C.or,sx,sy,false); P(C.yl,sx+2,sy-2); P(C.yl,sx-2,sy+1); P(C.wh,sx,sy); P(C.yl,sx+3,sy+2); }
    } else {
      // unlit: a lazy curl of smoke
      const s = fl(t*1.5)%3;
      P(C.ol,sx,sy+1); P(C.lg,sx+(s===1?1:0),sy-1); P(C.lg,sx+1,sy-3-s%2); P(C.gy,sx,sy-5+s%2);
    }
    // popcorn cannon: a fan of popped bits blasting out of the mouth
    if (shots >= 0) {
      const ox = rn(32+17*kx), oy = my+2;
      if (shots < 0.4) { const r = 4+shots*16; for (const q of [-0.7,-0.25,0.25,0.7]) LN(q*q>0.2?C.or:C.yl,rn(ox+3+cos(q)*r*0.4),rn(oy+sin(q)*r*0.4),rn(ox+3+cos(q)*r),rn(oy+sin(q)*r)); spark(C.yl,ox+2,oy,true); }
      const ang = [-0.5,-0.15,0.2,0.5];
      for (let i = 0; i < ang.length; i++) {
        const d = 2+shots*(11+i*3);
        const x = ox+cos(ang[i])*d, y = oy+sin(ang[i])*d-rn(shots*shots*4)+i;
        if (x < 64) bit(rn(x),rn(y),i);
      }
    }
    if (flyoff > 0.1) { const d = flyoff; bit(rn(14-d*6),rn(30-d*10),1); S(46,28,['.o.','o.o']); }
    if (pop > 0) {
      const r = 22+rn((1-pop)*6);
      for (let i = 0; i < 8; i++) { const an2 = i*PI/4+0.3; const x = 32+cos(an2)*r, y = 42+sin(an2)*r*0.75; spark(i%2?C.yl:C.wh,x,y,i%2===0); }
    }
  };

  // ================================================================ Revoada Noturna (épica)
  // a great moon-crow with two little crows at its feet; glowing lilac eyes, slow wingbeats; attack = the flock dives
  CS['revoada-noturna'] = function(g,t,st,p){
    begin(g); const a = an(t,st,p);
    let ang = 0.95+0.22*sin(t*2.1), wl = 31, by = 0, eyes = 'glow', beak = 0;
    let L = {x:12,y:44,ang:0.3,eyes:'glow',beak:0}, Rr = {x:52,y:44,ang:0.3,eyes:'glow',beak:0};
    const fl1 = sin(t*9) > 0, fl2 = sin(t*9+2) > 0;
    const glow = fl(t*2)%2;
    let shock = 0, feathers = 0, stars = 1;
    if (a.st === 'idle') {
      L.y += rn(sin(t*2.6)*1); Rr.y += rn(sin(t*2.6+2)*1);
      L.ang = (t%2.6) < 0.6 ? (fl1 ? 0.9 : 0.1) : -0.5; Rr.ang = ((t+1.3)%2.6) < 0.6 ? (fl2 ? 0.9 : 0.1) : -0.5;
      if (blink(t,3.7,2)) eyes = 'shut';
    } else if (a.st === 'atk') {
      ang = lp(lp(0.95,1.4,a.w),0.45,a.s); by = rn(a.w*-2);
      L.y -= rn(a.w*5); Rr.y -= rn(a.w*5); L.ang = Rr.ang = lp(0.9,-0.2,a.s);
      L.x += rn(a.s*20); L.y -= rn(a.s*6); Rr.x += rn(a.s*8); Rr.y -= rn(a.s*3);
      beak = a.s > 0.25 ? 1 : 0; L.beak = Rr.beak = beak; shock = a.s;
      if (a.s > 0.25) eyes = L.eyes = Rr.eyes = 'fierce';
    } else if (a.st === 'hit') {
      ang = lp(0.95,0.35,a.r); L.x -= rn(a.r*3); Rr.x += rn(a.r*3); L.y -= rn(a.r*2); Rr.y -= rn(a.r*2);
      L.ang = Rr.ang = 0.9*a.r; if (a.r > 0.15) eyes = L.eyes = Rr.eyes = 'ouch'; feathers = a.r; OX = -rn(a.r*2);
    } else if (a.st === 'sono') {
      const b = sin(t*1.3) > 0 ? 1 : 0;
      ang = 0.25; wl = 19; by = 1+b; eyes = L.eyes = Rr.eyes = 'sleep'; L.x = 16; Rr.x = 48; L.y += 1; Rr.y += 1-b; L.ang = Rr.ang = -0.6; stars = 0;
    } else if (a.st === 'entra') {
      const e = ez(a.e);
      by = -rn((1-e)*22); ang = lp(1.4,0.95,e);
      L.x -= rn((1-e)*28); L.y -= rn((1-e)*18); Rr.x += rn((1-e)*28); Rr.y -= rn((1-e)*18);
      L.ang = Rr.ang = fl1 ? 0.9 : 0.1;
    }
    const wing = (sx,sy,side,an1,len,r)=>{
      const k = wingK(sx,sy,side,an1,len,5,0.2,r);
      F(C.ol,k.b[0]-1,k.b[1]-1,k.b[2]+1,k.b[3]+1,dil(k));
      F(C.nt,k.b[0],k.b[1],k.b[2],k.b[3],(x,y)=>k(x,y)&&k(x,y-1)&&!k(x,y-2));
      F(C.li,k.b[0],k.b[1],k.b[2],k.b[3],(x,y)=>k(x,y)&&!k(x,y-1));
    };
    const crow = (cx,hc,sc,an1,eyM,bk,big)=>{
      cx = rn(cx); hc = rn(hc);
      const hr = 6*sc, bc = hc+12.5*sc, brx = 7.5*sc, bry = 10.5*sc;
      if (!big) { wing(cx-4*sc,hc+8*sc,-1,an1,22*sc,2.4*sc); wing(cx+4*sc,hc+8*sc,1,an1,22*sc,2.4*sc); }
      const bdy = MK(any(eF(cx,bc,brx,bry),eF(cx,hc,hr,hr)),[cx-brx-2,hc-hr-2,cx+brx+2,bc+bry+2]);
      F(C.ol,bdy.b[0]-1,bdy.b[1]-1,bdy.b[2]+1,bdy.b[3]+1,dil(bdy));
      const hdk = eF(cx,hc,hr,hr), hdk2 = eF(cx,hc+1,hr,hr);
      F(C.li,bdy.b[0],bdy.b[1],bdy.b[2],bdy.b[3],(x,y)=>hdk(x,y)&&!hdk2(x,y));
      const b1 = eF(cx,bc,brx,bry), b2 = eF(cx+1,bc,brx,bry);
      F(C.pu,bdy.b[0],bdy.b[1],bdy.b[2],bdy.b[3],(x,y)=>b1(x,y)&&!b2(x,y)&&y>bc-bry*0.6);
      F(C.nt,bdy.b[0],bdy.b[1],bdy.b[2],bdy.b[3],(x,y)=>b1(x,y)&&!eF(cx-1,bc,brx,bry)(x,y)&&y>bc-bry*0.6);
      const fy = rn(bc+bry);
      if (big) {
        S(cx-3,bc-1,['.u..u.','u.uu.u','.u..u.','......','.u..u.','u.uu.u']);
        S(cx-5,fy-1,['.oYo.oYo.','oYoYoYoYo']);
        const ey = hc-2;
        if (eyM === 'glow') { S(cx-4,ey,['.ii..ii.','iWii.iWi','iiii.iii','.ii...i.']); P(C.ol,cx,ey+1); if (glow) S(cx-5,ey-1,['.p......p.','p........p']); }
        else if (eyM === 'fierce') { S(cx-5,ey-1,['ii......ii','.iii..iii.','.iWi..iWi.','..ii..ii..']); }
        else if (eyM === 'ouch') { S(cx-4,ey,['ii....ii','..ii.ii.','ii....ii'].map((r,i)=>i===1?'..ii..ii':r)); }
        else if (eyM === 'shut') { S(cx-4,ey+1,['........','iiii.iii']); }
        else S(cx-4,ey+1,['i..i.i..i','.ii...ii.']);
        if (bk) S(cx-2,hc+1,['.OOO.','OOOOO','onnno','.www.','..w..']);
        else S(cx-1,hc+2,['OO','Ow','.w']);
      } else {
        S(cx-2,fy-1,['o...o','Y...Y']);
        const ey = hc-1;
        if (eyM === 'glow') { S(cx-2,ey,['ii.ii','iW.Wi']); if (glow) { P(C.pk,cx-3,ey); P(C.pk,cx+3,ey); } }
        else if (eyM === 'fierce') S(cx-2,ey,['i...i','iW.Wi']);
        else if (eyM === 'ouch') S(cx-2,ey,['i...i','.i.i.']);
        else S(cx-2,ey+1,['ii.ii']);
        if (bk) S(cx-1,hc+1,['OO','nn','ww']); else S(cx-1,hc+1,['OO','.O']);
      }
    };
    OY += by;
    // great crow's wings (behind everything)
    const cx = 32, hc = 33;
    if (a.st !== 'sono') {
      const mo = MK((x,y)=>inE(x,y,32,27,10.5,10.5)&&!inE(x,y,35.5,24.5,9.5,9.5),[20,15,44,39]);
      F(C.li,19,14,45,40,dil(mo)); F(C.cr,20,15,44,39,mo); F(C.lg,20,15,44,39,(x,y)=>mo(x,y)&&!mo(x+1,y+1));
    }
    wing(cx-4,hc+9,-1,ang,wl,3);
    wing(cx+4,hc+9,1,ang,wl,3);
    OY -= by;
    // the little ones
    crow(L.x,L.y,0.62,L.ang,L.eyes,L.beak,false);
    crow(Rr.x,Rr.y,0.62,Rr.ang,Rr.eyes,Rr.beak,false);
    OY += by;
    crow(cx,hc,1,ang,eyes,beak,true);
    // screech: lilac shock rings
    if (shock > 0.3) {
      const r = rn(4+shock*6);
      for (let i = 0; i < 2; i++) { const x0 = 40+r+i*4; LN(C.li,x0,hc-3-i*2,x0+2,hc,1); LN(C.li,x0+2,hc,x0,hc+3+i*2,1); }
      P(C.wh,40+r+2,hc);
    }
    OY -= by;
    // moon sparkles around the flock
    if (stars) {
      const tw = fl(t*2.5)%4, sp = [[6,24],[58,22],[20,14],[46,12]];
      for (let i = 0; i < 4; i++) { if (i === tw) continue; if (i%2) spark(C.li,sp[i][0],sp[i][1]+by,false); else P(C.cr,sp[i][0],sp[i][1]+by); }
      if (tw < 4) spark(C.cr,sp[tw][0],sp[tw][1]+by,true);
    }
    if (feathers > 0.1) {
      const d = feathers*8;
      S(rn(8-d),rn(30-d),['.oi','ooo','io.']); S(rn(52+d),rn(28-d),['io.','ooo','.oi']); S(30,rn(22-d),['.o','oi']);
    }
  };

  // ================================================================ Rei Milhão (lendária)
  // the corn king: husk cape, golden crown, silk beard and corn-stalk scepter; attack = scepter slam + golden shockwave
  CS['rei-milhao'] = function(g,t,st,p){
    begin(g); const a = an(t,st,p);
    const sw = fl(t*2)%2;
    let hx = 12, hy = 30, th = 0.03*sin(t*1.5), lean = 0, face = 'idle', cdx = 0, cdy = 0, breath = 0, wave = -1, glowO = 0, crownOY = 0, aura = 1;
    if (a.st === 'idle') { breath = sin(t*1.8) > 0.3 ? 1 : 0; if (blink(t,3.6,1.2)) face = 'blink'; }
    else if (a.st === 'atk') {
      hx = lp(lp(12,15,a.w),13,a.s); hy = lp(lp(30,15,a.w),31,a.s); th = lp(lp(0,-0.22,a.w),0.1,a.s);
      lean = -1.5*a.w+2*a.s; face = a.s > 0.25 ? 'shout' : a.w > 0.2 ? 'stern' : 'idle'; glowO = a.w > 0.5 || a.s > 0.4 ? 1 : 0;
      cdy = a.s > 0.6 ? -1 : 0; if (a.p > 0.4) wave = (a.p-0.4)/0.6;
    } else if (a.st === 'hit') {
      OX = -rn(a.r*2); cdx = rn(a.r*2); cdy = -rn(a.r*2); face = a.r > 0.15 ? 'ouch' : 'idle'; th = -0.08*a.r;
    } else if (a.st === 'sono') { breath = sin(t*1.3) > 0 ? 1 : 0; face = 'sleep'; cdx = 1; cdy = 1; th = 0.1; aura = 0; }
    else if (a.st === 'entra') {
      const e = a.e; Y1 = 61; OY = rn((1-ez(e/0.7))*50); crownOY = -rn((1-ez((e-0.45)/0.55))*26)-OY; face = e > 0.8 ? 'idle' : 'stern'; glowO = 1;
    }
    const lx = y=>lean*(57-y)/40;
    // royal sunburst behind the crown (like the card's golden-hour rays)
    if (aura) for (let i = 0; i < 5; i++) {
      const an2 = PI+0.62+i*0.475, r0 = 14, r1 = 17+(i+fl(t*2))%2*2;
      LN(i%2?C.or:C.yl,rn(32+cos(an2)*r0),rn(18+sin(an2)*r0),rn(32+cos(an2)*r1),rn(18+sin(an2)*r1));
    }
    // husk cape (behind)
    const cape = [26,16, 38,16, 42,19, 47,27, 51,38, 55+sw,58, 9-sw,58, 13,38, 17,27, 22,19].map((v,i)=>i%2?v:v+lx(1)*0);
    const cf = MK(pF(cape),bx(cape));
    F(C.ol,cf.b[0]-1,cf.b[1]-1,cf.b[2]+1,cf.b[3]+1,dil(cf));
    F(C.gr,cf.b[0],cf.b[1],cf.b[2],cf.b[3],cf);
    F(C.gd,cf.b[0],cf.b[1],cf.b[2],cf.b[3],(x,y)=>cf(x,y)&&(x<32?!cf(x-2,y):!cf(x+2,y)));
    R(C.lm,15,42,1,8); R(C.lm,16,33,1,6); R(C.lm,48,42,1,8); R(C.lm,47,33,1,6);
    // cob body
    const cy = 36.75, ry = 20.25;
    const cob = MK((x,y)=>{ const u=(y+0.5-cy)/ry; if(u<-1||u>1) return false; const rx=11*Math.sqrt(1-u*u)*(u<0?1+0.12*u:1)*(u>0?1-0.12*u*u:1); return ab(x+0.5-32-lx(y))<=rx; },[18,15,46,58]);
    const fcx = 32+lx(25), face0 = eF(fcx,25.5,8.5,6.5);
    F(C.ol,17,14,47,58,dil(cob));
    F(C.st,18,15,46,58,cob);
    F(C.yl,18,15,46,58,(x,y)=>cob(x,y)&&face0(x,y));
    for (let b = -1; b < 14; b++) {
      const y = 17+b*3, o = rn(lx(y));
      for (let x = 19+(b%2?1:0)+o; x < 46+o; x += 3) {
        if (face0(x+1,y)&&face0(x+2,y+1)) continue;
        if (cob(x+1,y)&&cob(x+2,y)&&cob(x+1,y+1)&&cob(x+2,y+1)) R(C.yl,x+1,y,2,2);
        else for (let k = 0; k < 4; k++) { const px = x+1+(k&1), py = y+(k>>1); if (cob(px,py)) P(C.yl,px,py); }
      }
    }
    F(C.or,18,15,46,58,(x,y)=>cob(x,y)&&!cob(x+2,y));
    F(C.cr,18,15,46,58,(x,y)=>cob(x,y)&&!cob(x-1,y)&&((y-17)%3!==2));
    // scepter (corn stalk + golden cob orb), rotating about the hand
    const tx = hx+sin(th)*15, ty = hy-cos(th)*15, bx2 = hx-sin(th)*29, by2 = hy+cos(th)*29;
    const stf = MK(tb([tx,ty,bx2,by2],1.6),bx([tx,ty,bx2,by2],3));
    F(C.ol,stf.b[0]-1,stf.b[1]-1,stf.b[2]+1,stf.b[3]+1,dil(stf));
    F(C.gr,stf.b[0],stf.b[1],stf.b[2],stf.b[3],stf);
    F(C.gd,stf.b[0],stf.b[1],stf.b[2],stf.b[3],(x,y)=>stf(x,y)&&!stf(x+1,y));
    { const lx2 = rn(lp(hx,bx2,0.45)), ly2 = rn(lp(hy,by2,0.45)); R(C.lm,lx2,ly2,1,2); P(C.gd,lx2-1,ly2+1); }
    S(tx-3,ty-6,[
      '..ooo..',
      '.oycyo.',
      'oyyyyyo',
      'oyyyyOo',
      '.oyyOo.',
      'ogllggo',
      '.og.go.'
    ]);
    if (glowO) { spark(C.wh,tx,ty-7,true); P(C.yl,rn(tx)-4,rn(ty)-6); P(C.yl,rn(tx)+4,rn(ty)-6); }
    else if (aura && fl(t*3)%3===0) P(C.wh,rn(tx)-1,rn(ty)-5);
    // arm holding the scepter
    const sx0 = 25+lx(32), arm = MK(tb([sx0,33,hx+2,hy+1],2.3),bx([sx0,33,hx+2,hy+1],3));
    F(C.ol,arm.b[0]-1,arm.b[1]-1,arm.b[2]+1,arm.b[3]+1,dil(arm));
    F(C.gr,arm.b[0],arm.b[1],arm.b[2],arm.b[3],arm);
    F(C.lm,arm.b[0],arm.b[1],arm.b[2],arm.b[3],(x,y)=>arm(x,y)&&!arm(x,y-1));
    S(hx-2,hy-2,['.ooo.','oyyyo','oyyto','.ooo.']);
    // face: stern-but-kind, golden-silk moustache and goatee
    const X = rn(fcx)-32, Y = breath;
    if (face === 'stern' || face === 'shout' || face === 'ouch') S(25+X,19,['ooo.......ooo','...oo...oo...']);
    else S(25+X,20,['oooo.....oooo','....o...o....']);
    const eyeK = (x)=>{ R(C.ol,x,22,3,3); P(C.wh,x,22); P(C.cr,x+2,24); };
    if (face === 'idle' || face === 'stern' || face === 'shout') { eyeK(26+X); eyeK(35+X); }
    else if (face === 'blink') { R(C.ol,26+X,24,3,1); R(C.ol,35+X,24,3,1); }
    else if (face === 'ouch') { S(26+X,22,['oo.','..o','oo.']); S(35+X,22,['.oo','o..','.oo']); }
    else { S(26+X,23,['ooo']); S(35+X,23,['ooo']); P(C.ol,25+X,22); P(C.ol,38+X,22); }
    R(C.pk,23+X,25,2,1); R(C.pk,39+X,25,2,1);
    S(30+X,24,['.tt.','tttO']);
    if (face === 'shout') S(29+X,27,['.oooo.','orrrro','onnnno','.oooo.']);
    S(23+X,26+Y,face === 'shout' ? [
      '.o..............o.',
      'oco.oo......oo.oco',
      'occocc......ccocco',
      '.occccc....ccccco.',
      '..ooocccccccccooo.',
      '.....oocccccoo.....',
      '......occtco......',
      '......occtco......',
      '.......octo.......',
      '........oo........'
    ] : [
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
    const sOY = OY; OY += crownOY;
    S(21+X+cdx,7+cdy,[
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
    P(C.cr,24+X+cdx,14+cdy); P(C.cr,28+X+cdx,14+cdy); P(C.cr,36+X+cdx,14+cdy); P(C.cr,40+X+cdx,14+cdy);
    if (aura) {
      const tw = fl(t*3)%3;
      if (tw===0) spark(C.wh,24+X+cdx,7+cdy,false);
      else if (tw===1) spark(C.wh,40+X+cdx,7+cdy,false);
      else { P(C.wh,32+X+cdx,4+cdy); P(C.cr,24+X+cdx,8+cdy); P(C.cr,40+X+cdx,8+cdy); }
    }
    OY = sOY;
    // royal glints drifting around the king
    if (aura) for (let i = 0; i < 3; i++) {
      const ph = t*0.9+i*2.1, x = 32+cos(ph)*25, y = 34+sin(ph*1.3)*14;
      if (fl(t*4+i)%3) P(i===1?C.wh:C.yl,rn(x),rn(y)); else spark(C.yl,x,y,false);
    }
    // golden shockwave rolling out from the slam
    if (wave >= 0) {
      const d = wave*36, x0 = rn(24+d), al = 1-wave;
      if (wave < 0.3) { const q = rn(4+wave*14); for (const an2 of [-2.6,-2.0,-1.1,-0.5]) LN(an2<-1.5?C.or:C.yl,rn(bx2+cos(an2)*3),rn(by2-1+sin(an2)*3),rn(bx2+cos(an2)*q),rn(by2-1+sin(an2)*q)); spark(C.wh,bx2,by2-2,true); }
      if (al > 0.15) {
        const h = 8-wave*3, wv = (x,y)=>y<60&&inE(x,y,x0,60,5,h)&&!inE(x,y,x0-3,60,4.5,h-1.5);
        F(C.or,x0-8,40,x0+7,60,dil(wv)); F(C.yl,x0-8,40,x0+7,60,wv); F(C.cr,x0-8,40,x0+7,60,(x,y)=>wv(x,y)&&!wv(x+1,y));
        P(C.wh,x0+3,rn(60-h*0.6)); P(C.yl,x0+6,rn(56-h)); R(C.yl,x0-5,rn(57-h),2,2); spark(C.wh,x0+2,rn(59-h),false);
      }
    }
  };

  // ================================================================ Codorna Ninheira
  // plump quail brooding on her straw nest (with an egg): head bobs, topknot bounces; attack = quick peck
  CS['codorna-ninheira'] = function(g,t,st,p){
    begin(g); const a = an(t,st,p);
    let hx = 0, hy = 0, br = 0, tb = 0, eyeM = 'open', beak = 0, puff = 0, wu = 0, by = 0, egx = 0, dust = 0;
    if (a.st === 'idle') {
      hx = fl(t*2.2)%2; tb = fl(t*2.2+0.5)%2 ? -1 : 0; br = sin(t*1.7) > 0.4 ? 1 : 0;
      if (blink(t,3,0.7)) eyeM = 'shut'; egx = (t%2.6) < 0.4 ? (fl(t*10)%2 ? 1 : -1) : 0;
    } else if (a.st === 'atk') {
      hx = rn(-3*a.w+6*a.s); hy = rn(-2*a.w+4*a.s); tb = a.w > 0.3 ? -2 : a.s > 0.3 ? 1 : 0;
      beak = a.s > 0.25 ? 1 : 0; eyeM = a.s > 0.25 ? 'fierce' : 'open'; dust = a.s;
    } else if (a.st === 'hit') {
      puff = a.r > 0.15 ? 1 : 0; eyeM = puff ? 'ouch' : 'open'; tb = -rn(a.r*3); hx = -rn(a.r*2); OX = -rn(a.r*2);
    } else if (a.st === 'sono') {
      const b = sin(t*1.3) > 0 ? 1 : 0; hx = -2; hy = 3; br = b; eyeM = 'sleep'; tb = 2;
    } else if (a.st === 'entra') {
      const e = a.e; by = -rn((1-ebo(e))*22); wu = e < 0.8 ? (fl(e*12)%2 ? 1 : 0.5) : 0; tb = e < 0.8 ? -2 : 0;
    }
    // nest: back rim
    const nest = eF(31,54.3,15.5,4.6);
    F(C.ol,14,48,48,60,(x,y)=>dil(nest)(x,y)&&y<=55);
    F(C.sd,15,49,47,55,(x,y)=>nest(x,y)&&y<=54);
    // the egg tucked in the nest (wobbles)
    const eg = eF(45.5+egx,50,3.6,4.4);
    F(C.ol,40,44,51,56,dil(eg)); F(C.cr,40,44,51,56,eg); F(C.lg,40,44,51,56,(x,y)=>eg(x,y)&&!eg(x+1,y+1));
    P(C.sd,44+egx,49); P(C.sd,47+egx,51); P(C.wh,44+egx,47);
    OY += by;
    // tail (short, upturned)
    S(13,38-br,['.ooo....','owwwoo..','odwwwwo.','.oddddwo','..oooooo']);
    // plump round body
    const pr = puff ? 1 : 0;
    const bd = MK(any(eF(30.5,45-br*0.5,12.5+pr,8.6+pr+br*0.5),eF(38,40,6+pr,5+pr)),[14,32,46,56]);
    BD(bd,C.wo,C.wd,C.st,C.ol,2);
    F(C.st,16,33,46,55,(x,y)=>bd(x,y)&&inE(x,y,38.5,47,6,5.5)&&bd(x+2,y+2));
    F(C.cr,16,33,46,55,(x,y)=>bd(x,y)&&inE(x,y,39.5,44.5,2.2,1.8)&&bd(x+3,y));
    for (const m of [[21,40],[25,38],[29,37],[33,37],[23,43],[27,41],[31,40],[35,40],[19,44]]) { R(C.wd,m[0],m[1],2,1); P(C.wd,m[0]+2,m[1]-1); P(C.cr,m[0],m[1]-1); }
    if (puff) { S(15,39,['o..','.o.']); S(25,32,['.o.','o.o']); S(44,52,['.o','o.']); }
    // folded wing with straw streaks (flaps open when landing)
    const wf = [19,44, 26,41, 34,43, 36,48, 30,50, 21,49], wr = [21,44, 17,33, 24,29, 33,36, 36,46, 28,49];
    const wp = lpP(wf,wr,wu);
    const wg = MK(pF(wp),bx(wp));
    F(C.wd,wg.b[0],wg.b[1],wg.b[2],wg.b[3],wg);
    F(C.wo,wg.b[0],wg.b[1],wg.b[2],wg.b[3],(x,y)=>wg(x,y)&&!wg(x,y-1));
    F(C.sd,wg.b[0],wg.b[1],wg.b[2],wg.b[3],(x,y)=>wg(x,y)&&!wg(x,y+1));
    if (wu < 0.2) { R(C.st,22,45,9,1); R(C.st,25,47,8,1); R(C.cr,28,43,4,1); }
    else { if (wu > 0.6) F(C.ol,wg.b[0]-1,wg.b[1]-1,wg.b[2]+1,wg.b[3]+1,(x,y)=>!wg(x,y)&&dil(wg)(x,y)&&y<44); R(C.st,22,37,6,1); R(C.st,24,40,7,1); }
    // head (bobs / pecks)
    OX += hx; OY += hy;
    const hd = MK(eF(42.5,34.5,6.3,5.8),[34,26,51,42]);
    BD(hd,C.wo,C.wd,C.st,C.ol,2);
    F(C.wd,34,26,51,42,(x,y)=>hd(x,y)&&y<=30&&hd(x-1,y-1));
    R(C.cr,39,31,8,1); R(C.cr,37,32,2,1); P(C.cr,47,32);
    F(C.cr,34,26,51,42,(x,y)=>hd(x,y)&&inE(x,y,45.5,38.5,3,2.2));
    R(C.wd,44,36,3,1);
    if (eyeM === 'open') { R(C.ol,43,32,2,3); P(C.wh,43,32); }
    else if (eyeM === 'fierce') { R(C.ol,42,32,3,1); R(C.ol,43,33,2,2); P(C.wh,43,33); }
    else if (eyeM === 'ouch') S(42,32,['o..','.oo','o..']);
    else if (eyeM === 'shut') R(C.ol,43,34,2,1);
    else S(42,33,['o.o','.o.']);
    R(C.pk,39,36,2,1);
    if (beak) S(48,32,['oo...','OOOo.','ooooo','OOo..','oo...']);
    else S(48,33,['oo..','OOOo','Ooo.']);
    // teardrop topknot plume leaning forward (bobs)
    S(40,22+tb,tb >= 2 ? ['......','......','..ooo.','.oddoo','o.oo..'] : ['..ooo.','.oddso','.osoo.','.o....','o.....']);
    OX -= hx; OY -= hy;
    OY -= by;
    // nest: front half with straw weave
    const nf = (x,y)=>nest(x,y)&&y>=54;
    F(C.ol,14,52,48,61,(x,y)=>dil(nf)(x,y)&&y>=54);
    F(C.st,15,53,47,60,nf);
    F(C.wo,15,53,47,60,(x,y)=>nf(x,y)&&(!nest(x+1,y+2)||((x+y*2)%5===0)));
    F(C.yl,15,53,47,60,(x,y)=>nf(x,y)&&nest(x+1,y+2)&&((x-y*2+50)%5===0));
    for (let x = 16; x < 47; x += 3) { R(C.yl,x,53,2,1); P(C.wo,x+2,53); P(C.st,x+1,52); }
    LN(C.yl,13,52,16,53); LN(C.st,46,51,50,50); P(C.yl,12,54); LN(C.yl,34,59,38,60);
    if (dust > 0.5) { S(54,40,['y..t','..y.','t...']); spark(C.wh,57,44,false); }
  };

  // ================================================================ Galo Despertador
  // proud wine-red rooster with a black-green sickle tail: chest puffs, head jerks, crows now and then; attack = crowing peck
  CS['galo-despertador'] = function(g,t,st,p){
    begin(g); const a = an(t,st,p);
    let hx = 0, hy = 0, open = 0, arcs = 0, eyeM = 'open', puff = 0, cflop = 0, tdx = 0, tdy = 0, wu = 0, ch = 0;
    if (a.st === 'idle') {
      hx = [0,1,1,0,-1,0][fl(t*3)%6]; tdx = rn(sin(t*1.5)); ch = sin(t*2) > 0.5 ? 1 : 0;
      const ct = t%4.2; if (ct > 3.4) { open = 1; arcs = (ct-3.4)/0.8; hy = -1; }
      if (blink(t,2.8,0.5)) eyeM = 'shut';
    } else if (a.st === 'atk') {
      hx = rn(-2*a.w+3*a.s); hy = rn(-3*a.w+2*a.s); ch = a.w > 0.3 ? 1 : 0; wu = a.w*0.6+a.s*0.4;
      open = a.s > 0.2 ? 2 : 0; if (a.s > 0.2) arcs = 0.3+a.s*0.7; eyeM = a.w > 0.2 || a.s > 0.2 ? 'fierce' : 'open';
    } else if (a.st === 'hit') {
      puff = a.r > 0.15 ? 1 : 0; eyeM = puff ? 'ouch' : 'open'; cflop = rn(a.r*2); hx = -rn(a.r*2); OX = -rn(a.r*2); wu = a.r*0.5;
    } else if (a.st === 'sono') {
      const b = sin(t*1.3) > 0 ? 1 : 0; hx = -2; hy = 4+b; eyeM = 'sleep'; tdy = 2; cflop = 1; ch = b;
    } else if (a.st === 'entra') {
      const e = a.e; OY = -rn((1-ebo(e))*24); wu = e < 0.75 ? (fl(e*14)%2 ? 1 : 0.3) : 0;
      if (e > 0.6) { open = 2; arcs = (e-0.6)/0.4; hy = -2; }
    }
    // tail: a fountain of black-green sickles
    const arc = (cx,cy,rx,ry,th)=>(x,y)=>{ if (!inE(x,y,cx,cy,rx,ry) || inE(x,y,cx,cy,rx-th,ry-th)) return false; const an2 = Math.atan2(cy-y-0.5,x+0.5-cx)*57.3; return an2 > -12 || an2 < -150; };
    const tcx = 20+tdx, tcy = 34+tdy;
    const tf = MK(any(arc(tcx,tcy,15,19,3.2),arc(tcx+0.5,tcy+1,10,13,3),arc(tcx+1,tcy+2,5,7.5,2.8)),[3,13,37,46]);
    F(C.ol,2,12,38,47,dil(tf));
    F(C.gd,3,13,37,46,tf);
    F(C.gr,3,13,37,46,(x,y)=>tf(x,y)&&!tf(x,y-1));
    P(C.lm,18+tdx,16+tdy); P(C.lm,8+tdx,28+tdy); P(C.lm,14+tdx,24+tdy); P(C.yl,5+tdx,36+tdy);
    // legs + feet
    S(26,49,['..oyo..oyo..','..oyo..oyo..','..oyo..oyo..','..oyo..oyo..','..oyo..oyo..','..oyo..oyo..','.oyyyooyyyyo','oyyyyooyyyyyo'.slice(0,12),'.oooo..ooooo']);
    // body: wine with a proud chest
    const pr = puff ? 1 : 0;
    const bd = MK(any(eF(30,43,11+pr,7.5+pr),eF(39,39,6.5+ch+pr,8+pr)),[17,30,48,52]);
    BD(bd,C.wn,C.sd,C.rd,C.ol,2);
    if (puff) { S(16,40,['o..','.o.']); S(26,33,['.o.','o.o']); S(46,48,['.o','o.']); }
    // wing: copper shoulder, dark primaries (lifts when crowing hard)
    const wy = 43-rn(wu*5);
    const wg = MK(any(eF(28.5,wy,8.5,4.3),tb([22,wy+1,15,wy-rn(wu*6)],2.6,1)),[12,wy-12,38,wy+6]);
    F(C.ol,11,wy-13,39,wy+7,(x,y)=>dil(wg)(x,y)&&!bd(x,y));
    F(C.sd,12,wy-12,38,wy+6,wg);
    F(C.or,12,wy-12,38,wy+6,(x,y)=>wg(x,y)&&!wg(x,y-2)&&x<35);
    F(C.gd,12,wy-12,38,wy+6,(x,y)=>wg(x,y)&&x<24&&y>=wy);
    R(C.wn,25,wy+1,8,1); R(C.wn,24,wy+3,6,1);
    // saddle hackles
    S(18,35,['.OO...','OyOO..','.OOrO.','..OrO.','...O..']);
    // neck hackles (follow the head)
    const nk = [37,30, 44+hx,22+hy, 50+hx,23+hy, 50+hx,29+hy, 47+hx,35+hy, 45,41, 42,38, 38,40, 36,34];
    const nkk = MK(pF(nk),bx(nk));
    F(C.ol,nkk.b[0]-1,nkk.b[1]-1,nkk.b[2]+1,nkk.b[3]+1,dil(nkk));
    F(C.or,nkk.b[0],nkk.b[1],nkk.b[2],nkk.b[3],nkk);
    F(C.rd,nkk.b[0],nkk.b[1],nkk.b[2],nkk.b[3],(x,y)=>nkk(x,y)&&!nkk(x+2,y+1));
    F(C.yl,nkk.b[0],nkk.b[1],nkk.b[2],nkk.b[3],(x,y)=>nkk(x,y)&&!nkk(x-1,y)&&y>26+hy);
    for (const x of [39,42,44]) LN(C.rd,x,31,x-1,38);
    // head
    OX += hx; OY += hy;
    const cf = cflop;
    S(39+cf,15+(cf?1:0),cf ? ['............','..o...o.....','.oro.oro.oo.','.orrorrrorro','.orrrrrrrrro','..onrrrrnno.','...onnnnno..'].slice(1) : [
      '..o...o...o..',
      '.oro.oro.oro.',
      '.orrorrrorro.',
      '.orrrrrrrrro.',
      '..onrrrrrno..',
      '...onnnnno...'
    ]);
    P(C.pk,41+cf,17); P(C.pk,45+cf,17);
    const hd = MK(eF(47,26,4.6,4.4),[41,20,53,32]);
    F(C.ol,40,19,54,33,dil(hd)); F(C.or,41,20,53,32,hd); F(C.rd,41,20,53,32,(x,y)=>hd(x,y)&&inE(x,y,48.3,26,3,2.6));
    F(C.yl,41,20,53,32,(x,y)=>hd(x,y)&&!hd(x-1,y)&&y<27);
    if (eyeM === 'open') { R(C.ol,47,24,2,2); P(C.wh,47,24); }
    else if (eyeM === 'fierce') { R(C.ol,46,23,3,1); R(C.ol,47,24,2,2); P(C.wh,47,24); }
    else if (eyeM === 'ouch') S(46,23,['o..','.oo','o..']);
    else if (eyeM === 'shut') R(C.ol,47,25,2,1);
    else S(46,25,['o.o','.o.']);
    if (open === 2) S(51,22,['.oo...','oyOOo.','oOOOOo','ooooo.','......','oOOo..','.oo...']);
    else if (open === 1) S(51,23,['.oo...','oyOOo.','oOOOOo','ooooo.','oOOo..','.oo...']);
    else S(51,24,['.oo..','oyOOo','oOOOOo','.oooo.']);
    S(47,30+(open?1:0),['orro','orno','.oo.']);
    OX -= hx; OY -= hy;
    // the wake-up call: sound arcs
    if (arcs > 0) {
      const cx = 53+hx, cy = 25+hy;
      for (let k = 0; k < 3; k++) {
        const r = rn(2+k*3+arcs*3);
        for (let an2 = -0.7; an2 <= 0.75; an2 += 0.14) P(k===2?C.or:C.yl,rn(cx+r*cos(an2)),rn(cy+r*sin(an2)));
      }
    }
  };

  // ================================================================ Gavião Real (lendária)
  // harpy eagle mantling its great golden-rimmed wings, double crest raised like a crown; attack = talon strike
  CS['gaviao-real'] = function(g,t,st,p){
    begin(g); const a = an(t,st,p);
    let ang = 0.72+0.07*sin(t*1.6), wl = 30, lean = 0, hy = 0, eyeM = 'open', look = 0, cr = fl(t*3)%2, crDown = 0, beak = 0, talon = 0, slash = 0, feath = 0, tw = fl(t*2.5)%4, glint = 1;
    if (a.st === 'idle') { look = fl(t/1.7)%3 === 2 ? 1 : 0; if (blink(t,3.4,0.8)) eyeM = 'shut'; }
    else if (a.st === 'atk') {
      ang = lp(lp(0.72,1.3,a.w),0.25,a.s); lean = -1.5*a.w+3*a.s; hy = rn(-a.w); cr = a.w > 0.3 ? 2 : 0;
      beak = a.s > 0.25 ? 1 : 0; talon = a.s; slash = a.p > 0.4 && a.p < 0.75 ? (a.p-0.4)/0.35 : 0; eyeM = 'fierce';
    } else if (a.st === 'hit') {
      ang = lp(0.72,0.4,a.r); wl = 30-rn(a.r*4); crDown = a.r > 0.2 ? 1 : 0; eyeM = a.r > 0.15 ? 'ouch' : 'open'; OX = -rn(a.r*2); feath = a.r;
    } else if (a.st === 'sono') {
      const b = sin(t*1.2) > 0 ? 1 : 0; ang = -1.15; wl = 24; hy = 2+b; eyeM = 'sleep'; crDown = 1; glint = 0;
    } else if (a.st === 'entra') {
      const e = a.e; OY = -rn((1-ez(e))*26); ang = lp(1.25,0.72,ez((e-0.5)/0.5)); talon = e < 0.8 ? 0.6 : 0; eyeM = 'fierce'; cr = 2;
    }
    const lx = y=>lean*(56-y)/30;
    // the setting sun behind the king of the sky (as on the card)
    if (glint) { const hx0 = 32+rn(lx(24)); const cy0 = 24+hy; F(C.or,hx0-15,cy0-15,hx0+15,cy0+12,(x,y)=>inE(x,y,hx0,cy0,14,14)&&!inE(x,y,hx0,cy0,12.2,12.2)); F(C.yl,hx0-13,cy0-13,hx0+13,cy0+12,(x,y)=>inE(x,y,hx0,cy0,12.2,12.2)&&!inE(x,y,hx0,cy0,11,11)&&(x+y)%2===0); }
    // great wings
    const wing = (side)=>{
      const sx = 32+side*7+lx(37), sy = 37;
      const k = wingK(sx,sy,side,ang,wl,6,0.21,3.1);
      const arm = tb([sx,sy,sx+side*cos(ang)*wl*0.42,sy-sin(ang)*wl*0.42],5);
      F(C.ol,k.b[0]-1,k.b[1]-1,k.b[2]+1,k.b[3]+1,dil(k));
      F(C.gy,k.b[0],k.b[1],k.b[2],k.b[3],k);
      F(C.lg,k.b[0],k.b[1],k.b[2],k.b[3],(x,y)=>k(x,y)&&arm(x,y)&&k(x,y-2));
      F(C.sd,k.b[0],k.b[1],k.b[2],k.b[3],(x,y)=>k(x,y)&&!k(x,y+1)&&k(x,y-1));
      F(C.lg,k.b[0],k.b[1],k.b[2],k.b[3],(x,y)=>k(x,y)&&!k(x,y-1)&&!arm(x,y));
      F(C.cr,k.b[0],k.b[1],k.b[2],k.b[3],(x,y)=>k(x,y)&&!k(x,y-1)&&arm(x,y));
      F(C.yl,k.b[0],k.b[1],k.b[2],k.b[3],(x,y)=>k(x,y)&&k(x,y-1)&&!k(x,y-2)&&arm(x,y));
      return [sx+side*cos(ang)*wl*0.42, sy-sin(ang)*wl*0.42];
    };
    const wL = wing(-1), wR = wing(1);
    // tail fan
    S(26+rn(lx(52)),50,['.oooooooooooo.','oYYoYYoYYoYYoo','oYYoYYoYYoYYo.','.oLLoLLoLLoLo.','..oooooooooo..']);
    // feathered legs + talons
    const leg = (x0,ext)=>{
      const fx = x0+ext*12, fy = 56-ext*9;
      const k = MK(tb([x0+lx(50),49,fx,fy-1],2.7,2.2),bx([x0,49,fx,fy],4));
      BD(k,C.wh,C.lg,null,C.ol,1);
      for (let i = 0; i < 3; i++) { const u = 0.25+i*0.25; R(C.ol,rn(lp(x0+lx(50),fx,u))-1,rn(lp(49,fy-1,u)),3,1); }
      if (ext > 0.3) {
        // open, reaching talons
        S(fx-2,fy-4,['.......oo','..oo..oOo','.oyyo.oy.','oyyyyoy..','oyyyyyo..','.oyyyyyoo','.oyo.oyyO','oOo...oOo','.o.....o.']);
      } else S(fx-4,fy,['.oyoyoyo.','oyyyyyyyo','OoOooOoOo','.o..o..o.'].slice(0,60-fy<4?60-fy:4));
    };
    leg(28,0); leg(36,talon);
    // body: white belly under a black chest band
    const bd = MK((x,y)=>inE(x-lx(y),y,32,44,7.2,9),[20,33,46,54]);
    BD(bd,C.wh,C.lg,null,C.ol,2);
    F(C.ol,20,33,46,54,(x,y)=>bd(x,y)&&y<39+(ab(x-32-lx(y))>4?1:0));
    F(C.sd,20,33,46,54,(x,y)=>bd(x,y)&&y===39&&ab(x-32-lx(y))<3);
    for (const q of [[28,42],[34,43],[30,46],[36,48],[27,49],[32,50]]) { const xx = rn(q[0]+lx(q[1])); R(C.lg,xx,q[1],3,1); P(C.gy,xx+1,q[1]); }
    // head
    const HX = 32+rn(lx(27)), HY = 27+hy;
    const cf = cr === 2 ? -1 : 0;
    const plume = crDown
      ? ['.............','.............','.............','oo.........oo','oYoo.....ooYo','.oYYo...oYYo.','..ooYoooYoo..','....ooooo....']
      : [cr ? '.o.........o.' : 'o...........o', cr ? '.oo.......oo.' : 'oo.........oo','oYo.......oYo','oYYo.....oYYo','.oYYo...oYYo.','..oYYoooYYo..','...oYYYYYo...','....ooooo....'];
    S(HX-6,HY-14+cf,plume);
    const hd = MK(eF(HX,HY,7.2,6.6),[HX-9,HY-9,HX+9,HY+9]);
    F(C.ol,HX-9,HY-9,HX+9,HY+9,dil(hd));
    F(C.gy,HX-9,HY-9,HX+9,HY+9,hd);
    F(C.lg,HX-9,HY-9,HX+9,HY+9,(x,y)=>hd(x,y)&&inE(x,y,HX,HY+1.5,5.4,4.6));
    F(C.lg,HX-9,HY-9,HX+9,HY+9,(x,y)=>hd(x,y)&&!hd(x-1,y-1));
    R(C.sd,HX-5,HY-5,2,1); R(C.sd,HX+3,HY-5,2,1);
    // fierce yellow eyes under angled brows
    const L0 = ['ooo...','.oooo.','.oyWo.','..oo..'], R0 = ['...ooo','.oooo.','.oWyo.','..oo..'];
    if (eyeM === 'open' || eyeM === 'fierce') {
      const lk = r=>look ? r.replace('yW','Wy').replace('Wy','yW') : r;
      S(HX-7,HY-3,eyeM === 'fierce' ? ['oo....','.oooo.','.oyWo.','..oo..'] : L0.map(lk));
      S(HX-1,HY-3,eyeM === 'fierce' ? ['....oo','.oooo.','.oWyo.','..oo..'] : R0.map(lk));
    } else if (eyeM === 'ouch') { S(HX-7,HY-3,['oo....','..ooo.','oo....']); S(HX-1,HY-3,['....oo','.ooo..','....oo']); }
    else if (eyeM === 'shut') { S(HX-7,HY-3,['ooo...','.oooo.']); S(HX-1,HY-3,['...ooo','.oooo.']); }
    else { S(HX-6,HY-1,['oooo']); S(HX,HY-1,['oooo']); }
    // hooked beak, turned toward the foe
    if (beak) S(HX+2,HY-1,['ooooo...','oLYYYo..','oooooYo.','......o.','onnno...','osssso..','.oooo...']);
    else S(HX+2,HY-1,['ooooo...','oLYYYo..','osYYYYo.','oosYYYo.','..ossYo.','...ooso.','.....o..']);
    // golden twinkles along the wing rims
    if (glint) {
      const pts = [[wL[0],wL[1]],[wR[0],wR[1]],[rn(lp(32,wL[0],0.5)),rn(lp(37,wL[1],0.5))-1],[rn(lp(32,wR[0],0.5)),rn(lp(37,wR[1],0.5))-1]];
      spark(C.wh,pts[tw][0],pts[tw][1]-1,tw < 2);
    }
    // talon slash
    if (slash > 0) {
      const sx = 50, sy = 34, d = rn(slash*6);
      for (let i = 0; i < 3; i++) LN(i===1?C.wh:C.cr,sx+i*3,sy+d-4,sx+i*3+5,sy+d+6);
    }
    if (feath > 0.1) {
      const d = feath*8;
      S(rn(10-d),rn(24-d),['..Lo','.LY.','LY..','o...']); S(rn(50+d),rn(20-d),['oL..','.YL.','..YL','...o']);
    }
  };

  // ================================================================ Filhote
  // fluffy striped quail chick: hops, flaps its wing nubs, peeps; attack = flying little peck; enters by hatching
  CS['filhote'] = function(g,t,st,p){
    begin(g); const a = an(t,st,p);
    let hop = 0, sq = 0, hx = 0, hy = 0, wing = 0, beak = 0, eyeM = 'open', fluff = 0, star = 0, shell = -1, shellTop = 0;
    if (a.st === 'idle') {
      const ph = t%0.9; hop = ph < 0.45 ? rn(sin(ph/0.45*PI)*3) : 0; sq = ph > 0.45 && ph < 0.55 ? 1 : 0;
      wing = hop > 1 ? 1 : 0; beak = (t%2.4) > 2.1 ? 1 : 0; if (blink(t,2.6,1.3)) eyeM = 'shut';
    } else if (a.st === 'atk') {
      sq = rn(a.w*2); hop = rn(a.s*4); OX = rn(-a.w+a.s*4); hx = rn(a.s); wing = a.s > 0.2 ? 1 : 0; beak = a.s > 0.25 ? 1 : 0;
      eyeM = a.w > 0.2 || a.s > 0.2 ? 'fierce' : 'open'; star = a.s > 0.55 ? 1 : 0;
    } else if (a.st === 'hit') { OX = -rn(a.r*3); hy = rn(a.r); eyeM = a.r > 0.15 ? 'ouch' : 'open'; fluff = a.r; wing = a.r > 0.3 ? 1 : 0; }
    else if (a.st === 'sono') { const b = sin(t*1.5) > 0 ? 1 : 0; hy = 3; hx = -1; sq = b; eyeM = 'sleep'; }
    else if (a.st === 'entra') {
      const e = a.e;
      if (e < 0.35) { shell = 2; } else { shell = e < 0.92 ? 1 : 0; shellTop = (e-0.35)/0.65; hop = e < 0.6 ? rn((e-0.35)*16) : rn(Math.max(0,(0.8-e))*20); wing = 1; beak = 1; }
    }
    if (shell === 2) {
      // a speckled egg wobbling, cracks spreading
      const wob = fl(t*14+a.e*30)%3-1, cr2 = a.e > 0.15;
      OX = wob;
      const eg = MK(eF(32,50,8,10),[22,38,42,61]);
      BD(eg,C.cr,C.lg,C.wh,C.ol,2);
      P(C.st,28,46); P(C.st,35,52); P(C.st,30,55); P(C.st,36,44);
      if (cr2) S(25,47,['o..o...o..o....','.oo.o.o.oo.o.o.','.....o......o..']);
      return;
    }
    OY -= hop;
    const by = sq;
    // tail tuft
    S(18,46+by,['.oo..','owwo.','owwwo','.ooo.']);
    // legs
    OY += hop;
    if (hop < 2) S(27,56,['..oO...oO..','..oO...oO..','.oOOo.oOOo.','.oooo.oooo.'].slice(hop));
    OY -= hop;
    // body + head as one fluffy blob
    const bd = MK(any(eF(31,49+by*0.5,11,9-by*0.5),eF(36+hx,39+hy,8,7.5)),[18,30,46,59]);
    BD(bd,C.st,C.wo,C.cr,C.ol,2);
    F(C.cr,18,30,46,59,(x,y)=>bd(x,y)&&inE(x,y,34,51,6,4.5)&&bd(x+2,y+2));
    // wing nub
    const wg = MK(wing ? eF(24,44+by,3.6,2.4) : eF(25,49+by,3.6,2.8),[18,38,32,55]);
    F(C.ol,17,37,33,56,dil(wg)); F(C.st,18,38,32,55,wg); F(C.wo,18,38,32,55,(x,y)=>wg(x,y)&&!wg(x,y+1)); F(C.cr,18,38,32,55,(x,y)=>wg(x,y)&&!wg(x,y-1));
    // fluffy fuzz on the crown
    const HX = 36+hx, HY = 39+hy;
    S(HX-3,HY-9,['.o.o','o.o.']);
    // head stripes
    LN(C.wd,HX-6,HY-3,HX-1,HY-6); LN(C.wo,HX-6,HY-1,HX,HY-4); R(C.wd,HX-1,HY-6,4,1);
    // eye, cheek, beak
    if (eyeM === 'open') { R(C.ol,HX+1,HY-2,2,3); P(C.wh,HX+1,HY-2); }
    else if (eyeM === 'fierce') { R(C.ol,HX,HY-3,3,1); R(C.ol,HX+1,HY-2,2,2); P(C.wh,HX+1,HY-2); }
    else if (eyeM === 'ouch') S(HX,HY-2,['o..','.oo','o..']);
    else if (eyeM === 'shut') R(C.ol,HX+1,HY,2,1);
    else S(HX,HY-1,['o.o','.o.']);
    R(C.pk,HX-1,HY+2,2,1);
    if (beak) S(HX+5,HY-1,['oo..','OOo.','oooo','OOo.','oo..']);
    else S(HX+5,HY,['oo..','OOOo','oo..']);
    // twinkle (as on the card)
    if (a.st === 'idle' && fl(t*2)%3 === 0) spark(C.yl,HX+9,HY-9,false);
    if (star) spark(C.yl,HX+12,HY,true);
    if (fluff > 0.15) { const d = rn(fluff*6); P(C.cr,14-d,40-d); P(C.cr,48+d,34-d); P(C.st,16-d,52); P(C.cr,30,30-d); }
    OY += hop;
    // hatching shells
    if (shell === 1) {
      const sh = (x,y)=>inE(x,y,32,52,10,8)&&y>=50+((x%3)===0?-1:0);
      F(C.ol,20,47,44,61,dil(sh)); F(C.cr,21,48,43,60,sh); F(C.lg,21,48,43,60,(x,y)=>sh(x,y)&&!sh(x+2,y+1));
      P(C.st,26,55); P(C.st,37,54);
      const k = shellTop, tx = rn(32+k*16), ty = rn(36-k*14);
      S(tx-5,ty,['..ooooo...','.occcccLo.','occWcccLLo','o.oo.o.oo.']);
    }
  };

  // ================================================================ Pintinho Valente
  // brave little chick in a bottle-cap helmet with a twig sword: taps the sword, bounces on its toes; attack = sword slash
  CS['pintinho-valente'] = function(g,t,st,p){
    begin(g); const a = an(t,st,p);
    let th = 0.12+0.08*sin(t*3), bob = 0, face = 'brave', capX = 0, capY = 0, swoosh = 0, lean = 0, foot = 0, glint = 0;
    if (a.st === 'idle') { bob = (t%1) > 0.82 ? -1 : 0; foot = fl(t*2)%2; if (blink(t,3.2,0.6)) face = 'blink'; glint = fl(t*2)%4 === 0; }
    else if (a.st === 'atk') {
      th = lp(lp(0.12,-1.25,a.w),1.95,a.s); lean = rn(-a.w+2*a.s); face = a.s > 0.25 ? 'yell' : a.w > 0.2 ? 'brave' : 'brave';
      if (a.p > 0.36 && a.p < 0.7) swoosh = (a.p-0.36)/0.34; bob = a.w > 0.5 ? 1 : 0;
    } else if (a.st === 'hit') { OX = -rn(a.r*2); capX = rn(a.r*2); capY = rn(a.r*2); face = a.r > 0.15 ? 'ouch' : 'brave'; th = 0.12-0.4*a.r; }
    else if (a.st === 'sono') { const b = sin(t*1.5) > 0 ? 1 : 0; bob = 1+b; face = 'sleep'; th = -0.05; capX = -1; capY = 2; }
    else if (a.st === 'entra') { const e = a.e; OY = -rn((1-ebo(e))*24); th = lp(-0.2,0.12,ez(e)); face = 'yell'; glint = 1; }
    OX += lean;
    // feet
    S(24,57,foot ? ['..O.O.....O.O.','.OOOO....OOOO.','..............'] : ['..O.O......O.O','.OOOO.....OOOO','..............']);
    OY += bob;
    // left wing (behind body edge)
    const bf = MK(any(eF(32,48,10.5,10),eF(32,40,8,7)),[19,31,45,59]);
    F(C.ol,18,30,46,60,dil(bf));
    F(C.yl,19,31,45,59,bf);
    F(C.or,19,31,45,59,(x,y)=>bf(x,y)&&!bf(x+2,y+2));
    F(C.cr,19,31,45,59,(x,y)=>bf(x,y)&&!bf(x-1,y-1)&&y<48);
    S(28,49,['.c.c.c.c.','ccccccccc','.ccccccc.','..ccccc..']);
    S(19,45,['.oo..','oyyo.','oyyyo','.oyyo','..oo.']);
    // sword in the right wing, rotating about the grip
    const gx = 44, gy = 46, L = 20;
    const tx = gx+sin(th)*L, ty = gy-cos(th)*L, ux = gx-sin(th)*3, uy = gy+cos(th)*3;
    if (swoosh > 0) {
      // slash arc
      const r = 19;
      for (let an2 = -1.1; an2 <= 1.9*swoosh+0.2 && an2 <= 1.95; an2 += 0.09) {
        const x = gx+sin(an2)*r, y = gy-cos(an2)*r;
        P(C.wh,rn(x),rn(y)); P(C.cr,rn(gx+sin(an2)*(r-2)),rn(gy-cos(an2)*(r-2)));
      }
    }
    const bl = MK(tb([ux,uy,tx,ty],1.4),bx([ux,uy,tx,ty],3));
    F(C.ol,bl.b[0]-1,bl.b[1]-1,bl.b[2]+1,bl.b[3]+1,dil(bl));
    F(C.wo,bl.b[0],bl.b[1],bl.b[2],bl.b[3],bl);
    F(C.st,bl.b[0],bl.b[1],bl.b[2],bl.b[3],(x,y)=>bl(x,y)&&!bl(x-1,y-1));
    // crossguard
    const cx1 = gx+cos(th)*4, cy1 = gy+sin(th)*4, cx2 = gx-cos(th)*4, cy2 = gy-sin(th)*4;
    const cg = MK(tb([cx1-sin(th)*-2,cy1-cos(th)*2,cx2-sin(th)*-2,cy2-cos(th)*2],1.2),bx([cx1,cy1,cx2,cy2],4));
    F(C.ol,cg.b[0]-1,cg.b[1]-1,cg.b[2]+1,cg.b[3]+1,dil(cg)); F(C.wd,cg.b[0],cg.b[1],cg.b[2],cg.b[3],cg);
    // leaf sprouting at the tip
    S(tx-1,ty-2,['..l.','.lgo','.oo.']);
    if (glint) spark(C.wh,tx,ty-3,false);
    // wing gripping the hilt
    S(gx-5,gy-2,['.ooo','oyyyo','oyyyyo','.oooo']);
    // bottle-cap helmet
    S(23+capX,31+capY,[
      '.....ooooooo.....',
      '...oorrrrrrroo...',
      '..orrWWrrrrrrro..',
      '.orrWrrrrrrrrrno.',
      'oLLLLLLLLLLLLLLLo',
      'oLYLYLYLYLYLYLYLo',
      '.ooooooooooooooo.'
    ]);
    // brave face
    const eye = (x)=>{ R(C.ol,x,40,2,3); P(C.wh,x,40); };
    if (face !== 'sleep' && face !== 'ouch') S(26,38,['oo........oo','..o......o..']);
    if (face === 'brave' || face === 'yell') { eye(27); eye(35); }
    else if (face === 'blink') { R(C.ol,27,42,2,1); R(C.ol,35,42,2,1); }
    else if (face === 'ouch') { S(26,40,['oo.','..o','oo.']); S(35,40,['.oo','o..','.oo']); }
    else { S(26,41,['o..o']); S(34,41,['o..o']); R(C.ol,27,42,2,1); R(C.ol,35,42,2,1); }
    if (face === 'yell') S(29,43,['.oooo.','oOrrOo','orrrro','.oOOo.','..oo..']);
    else S(29,43,['.oooo.','oOOOOo','.oOOo.','..oo..']);
    R(C.pk,24,44,2,1); R(C.pk,39,44,2,1);
    OY -= bob;
  };

  // ================================================================ Galinheiro (construção)
  // red-roofed coop on stilts: a hen peeks from the round door, a feather drifts, eggs in the hay nest; atk/hit = shake + squawk
  CS['galinheiro'] = function(g,t,st,p){
    begin(g); const a = an(t,st,p);
    let shk = 0, roofY = 0, peek = fl(t/1.6)%3-1, eyes = (t%2.5) > 2.3 ? 'shut' : 'open', hen = 0, feathers = 0, sq = 0, egw = 0;
    let fx = 52+rn(sin(t*1.3)*2), fy = 18+rn((t*3)%12);
    if (a.st === 'idle') { egw = (t%3.1) < 0.3 ? (fl(t*12)%2 ? 1 : 0) : 0; }
    else if (a.st === 'atk') {
      shk = a.p < 0.7 ? (fl(a.p*24)%2 ? 1 : -1) : 0; hen = a.s > 0.15 ? 1 : (a.w > 0.4 ? 0.5 : 0); feathers = a.s; roofY = a.s > 0.5 ? -1 : 0;
    } else if (a.st === 'hit') { shk = a.r > 0.1 ? (fl(a.p*20)%2 ? 1 : -1) : 0; roofY = -rn(a.r*2); eyes = a.r > 0.15 ? 'ouch' : 'open'; feathers = a.r*0.7; }
    else if (a.st === 'sono') { eyes = 'sleep'; peek = 0; fy = 30; }
    else if (a.st === 'entra') { const e = a.e; OY = -rn((1-ebo(e))*34); sq = e > 0.3 && e < 0.5 ? 1 : 0; feathers = e > 0.4 && e < 0.8 ? 1-e : 0; }
    OX += shk;
    const D = 15;
    // hay nest with two eggs (left)
    const hy = (x,y)=>inE(x,y,12,42+D,8.5,3.8)&&y<=44+D;
    F(C.ol,2,37+D,22,45+D,(x,y)=>dil(hy)(x,y)&&y<=44+D);
    F(C.st,3,38+D,21,44+D,hy);
    F(C.wo,3,38+D,21,44+D,(x,y)=>hy(x,y)&&!hy(x,y+1));
    const eggS = ['.ooo.','occWo','occco','occLo','oLLLo','.ooo.'];
    S(6,34+D-egw,eggS); S(12,35+D,eggS);
    S(4,39+D,['y.yt.y.ty.yty.yt.','.ty.y.yt.t.y.t.y.']);
    OY += sq;
    // stilts
    for (const x of [19,43]) { R(C.ol,x,34+D,4,9-sq); R(C.wd,x+1,34+D,2,8-sq); }
    // gable wall
    const gt = x=>Math.ceil(22+D-Math.max(0,14-ab(x+0.5-32))*11/14);
    const wl = pF([18,37+D, 18,22+D, 32,11+D, 46,22+D, 46,37+D]);
    F(C.ol,16,9+D,48,38+D,dil(wl));
    F(C.wo,17,10+D,47,37+D,wl);
    for (let x = 21; x < 46; x += 4) R(C.sd,x,gt(x)+1,1,37+D-gt(x)-1);
    for (let x = 22; x < 46; x += 8) for (let k = 0; k < 3; k++) R(C.wd,x+k,gt(x+k)+1,1,37+D-gt(x+k)-1);
    R(C.st,18,22+D,1,15);
    R(C.wd,18,35+D,28,2); R(C.sd,18,36+D,28,1);
    S(30,14+D,['..o..','.oso.','osyso','.oso.','..o..']);
    // roof boards (bounce when shaken)
    OY += roofY;
    const rf = MK(tb([13,25+D,32,9.5+D,51,25+D],2.1),[10,5+D,54,29+D]);
    F(C.ol,10,5+D,54,29+D,dil(rf));
    F(C.rd,11,6+D,53,28+D,rf);
    F(C.wn,11,6+D,53,28+D,(x,y)=>rf(x,y)&&!rf(x,y+2));
    F(C.or,11,6+D,53,28+D,(x,y)=>rf(x,y)&&!rf(x,y-1)&&x<32);
    for (const k of [0.25,0.5,0.75]) for (const sd of [-1,1]) { const x = rn(32+sd*19*k), y = rn(9.5+D+15.5*k); P(C.wn,x,y); P(C.wn,x-sd,y-1); }
    S(30,6+D,['.ooo.','oyyyo','.ooo.']);
    OY -= roofY;
    // round door with the hen peeking out
    const dr = eF(32,26.5+D,4.2,4.2);
    F(C.ol,26,21+D,38,32+D,dil(dr));
    F(C.sd,27,22+D,37,31+D,dr);
    F(C.ol,27,22+D,37,31+D,(x,y)=>dr(x,y)&&!dr(x-1,y-1));
    if (hen >= 1) {
      // squawking hen pops her head out
      S(27,21+D,['..o.o.o...','.orrrrro..','oooooooooo','oNNNNNNNoo','oNWoNNWoNo','oNNOOOONNo','oNNoOOoNNo','.oNNrrNNo.','..oooooo..']);
    } else if (eyes === 'open') { const px = 30+peek; P(C.yl,px,26+D); P(C.yl,px+4,26+D); P(C.wh,px,25+D); P(C.wh,px+4,25+D); P(C.or,px+2,27+D); if (hen) R(C.ol,px,24+D,5,1); }
    else if (eyes === 'ouch') { S(29,25+D,['y...y','.y.y.','y...y'].map((r,i)=>i===1?'.y.y.':r)); P(C.or,31,27+D); }
    else if (eyes === 'shut') { R(C.wd,30,26+D,2,1); R(C.wd,34,26+D,2,1); }
    else { R(C.wd,29,26+D,2,1); R(C.wd,34,26+D,2,1); }
    S(27,30+D,['.ytyt.y..','y..t.yty.']);
    // ramp
    const rp = MK(tb([33,32+D,50,42+D],1.6),[30,29+D,53,45+D]);
    F(C.ol,30,29+D,53,45+D,dil(rp));
    F(C.wd,31,30+D,52,44+D,rp);
    F(C.wo,31,30+D,52,44+D,(x,y)=>rp(x,y)&&!rp(x,y-1));
    for (const k of [0.2,0.45,0.7,0.92]) { const x = rn(33+17*k), y = rn(32+D+10*k); R(C.st,x-1,y-1,1,2); }
    OY -= sq;
    LN(C.yl,52,58,56,57); R(C.yl,36,59,2,1);
    OX -= shk;
    // drifting feather (idle) / burst of feathers (squawk)
    if (a.st === 'idle' || a.st === 'sono') S(fx,fy,['...WW','..WWL','.WWL.','oL...']);
    if (feathers > 0.1) {
      const d = rn(feathers*8);
      S(20-d,24-d,['.WW','WWL','L..']); S(42+d,22-d,['WW.','LWW','..L']); S(31,16-d,['.W.','WWL']);
    }
  };

})();
