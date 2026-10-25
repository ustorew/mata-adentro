(function(){
  // Personagens de tabuleiro (CHAR_SPRITE), lote T: frutas e bichinhos do Pomar.
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

  // ---------------------------------------------------------------- helpers
  const fl = Math.floor, rn = Math.round, sin = Math.sin, cos = Math.cos, PI = Math.PI;
  let OX = 0, OY = 0; // whole-sprite pixel offset (recoil / bob), always integer
  function R(g,c,x,y,w,h){
    x = fl(x)+OX; y = fl(y)+OY; w = fl(w); h = fl(h);
    if (x < 0) { w += x; x = 0; } if (y < 0) { h += y; y = 0; }
    if (x + w > 64) w = 64 - x; if (y + h > 61) h = 61 - y;
    if (w > 0 && h > 0 && c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  }
  const P = (g,c,x,y)=>R(g,c,x,y,1,1);
  // run-merged fill of every pixel in the box where f(x,y) is true
  function F(g,c,x0,y0,x1,y1,f){
    x0 = fl(x0); y0 = fl(y0); x1 = Math.ceil(x1); y1 = Math.ceil(y1);
    if (x0 < -OX) x0 = -OX; if (y0 < -OY) y0 = -OY; if (x1 > 63-OX) x1 = 63-OX; if (y1 > 60-OY) y1 = 60-OY;
    for (let y = y0; y <= y1; y++) {
      let s = -1;
      for (let x = x0; x <= x1; x++) {
        if (f(x,y)) { if (s < 0) s = x; }
        else if (s >= 0) { R(g,c,s,y,x-s,1); s = -1; }
      }
      if (s >= 0) R(g,c,s,y,x1+1-s,1);
    }
  }
  const inE = (x,y,cx,cy,rx,ry)=>{ const a=(x+0.5-cx)/rx, b=(y+0.5-cy)/ry; return a*a+b*b<=1; };
  const eF = (cx,cy,rx,ry)=>(x,y)=>inE(x,y,cx,cy,rx,ry||rx);
  const rE = (cx,cy,rx,ry,a)=>{ const c=cos(a), s=sin(a); return (x,y)=>{ const dx=x+0.5-cx, dy=y+0.5-cy, u=(dx*c+dy*s)/rx, v=(-dx*s+dy*c)/ry; return u*u+v*v<=1; }; };
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
  function bladeF(cx,cy,a,L,w){
    const ux=cos(a), uy=sin(a);
    return (x,y)=>{ const dx=x+0.5-cx, dy=y+0.5-cy, s=(dx*ux+dy*uy)/L; if (s<0||s>1) return false; const q=-dx*uy+dy*ux; return Math.abs(q) <= w*Math.sqrt(4*s*(1-s))+0.15; };
  }
  // outline + base + bottom-right shadow band + top-left light edge
  function body(g,f,bx,base,shadow,light,o,sh){
    sh = sh||2;
    if (o) F(g,o,bx[0]-1,bx[1]-1,bx[2]+1,bx[3]+1,dil(f));
    F(g,base,bx[0],bx[1],bx[2],bx[3],f);
    if (shadow) F(g,shadow,bx[0],bx[1],bx[2],bx[3],(x,y)=>f(x,y)&&!f(x+sh,y+sh));
    if (light) F(g,light,bx[0],bx[1],bx[2],bx[3],(x,y)=>f(x,y)&&!f(x-1,y-1));
  }
  function LN(g,c,x0,y0,x1,y1,w){
    w = w||1; const dx=x1-x0, dy=y1-y0, n=Math.max(Math.abs(dx),Math.abs(dy))||1;
    for (let i = 0; i <= n; i++) R(g,c,rn(x0+dx*i/n),rn(y0+dy*i/n),w,w);
  }
  const K = {o:C.ol,s:C.sd,d:C.wd,w:C.wo,t:C.st,c:C.cr,W:C.wh,y:C.yl,O:C.or,r:C.rd,n:C.wn,p:C.pk,G:C.gd,g:C.gr,l:C.lm,T:C.td,q:C.tq,b:C.bl,k:C.sk,u:C.pu,i:C.li,Y:C.gy,L:C.lg,N:C.nt};
  function S(g,x,y,rows,flip){
    x = rn(x); y = rn(y);
    for (let j = 0; j < rows.length; j++) {
      const r = rows[j], n = r.length;
      let i = 0;
      while (i < n) {
        const ch = flip ? r[n-1-i] : r[i];
        if (!K[ch]) { i++; continue; }
        let k = i+1;
        while (k < n && (flip ? r[n-1-k] : r[k]) === ch) k++;
        R(g,K[ch],x+i,y+j,k-i,1); i = k;
      }
    }
  }
  const spark = (g,c,x,y,big)=>{ x=rn(x); y=rn(y); if (big) { R(g,c,x-2,y,5,1); R(g,c,x,y-2,1,5); P(g,C.wh,x,y); } else { R(g,c,x-1,y,3,1); R(g,c,x,y-1,1,3); } };
  const sm = k=>k<=0?0:k>=1?1:k*k*(3-2*k);
  // attack phases: w = wind-up 0..1 (0-0.35), s = strike 1 (0.35-0.55) easing to 0 (recover)
  function AT(p){
    if (p < 0.35) return {w:sm(p/0.35), s:0};
    if (p < 0.55) return {w:0, s:1};
    return {w:0, s:1-sm((p-0.55)/0.45)};
  }
  const HT = p=>p<0.2?1:1-sm((p-0.2)/0.8);       // hit flinch amount
  const back = k=>{ k=Math.max(0,Math.min(1,k)); const c=1.9; return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2); }; // ease-out-back
  // eyes: x = left column, y = top row, w x h, mode: open | blink | sleep | squint | angry | wide | look (dx)
  function eyes(g,xs,y,w,h,mode,dx){
    dx = dx||0;
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i], L = i===0;
      if (mode==='blink') { R(g,C.ol,x,y+h-2,w,1); }
      else if (mode==='sleep') { P(g,C.ol,x,y+h-3); P(g,C.ol,x+w-1,y+h-3); R(g,C.ol,x+1,y+h-2,w-2,1); if (w<3) R(g,C.ol,x,y+h-2,w,1); }
      else if (mode==='squint') { if (L) S(g,x,y+h-4,['oo.','..o','oo.']); else S(g,x+w-3,y+h-4,['.oo','o..','.oo']); }
      else if (mode==='happy') { R(g,C.ol,x+1,y+h-4,w-2,1); P(g,C.ol,x,y+h-3); P(g,C.ol,x+w-1,y+h-3); }
      else {
        R(g,C.ol,x+dx,y,w,h);
        P(g,C.wh,x+dx,y); if (w>=3 && h>=4) P(g,C.wh,x+dx+1,y+1);
        if (mode==='angry') {
          if (L) { LN(g,C.ol,x-1,y-2,x+w,y-1); P(g,C.ol,x+w,y); } else { LN(g,C.ol,x-1,y-1,x+w,y-2); P(g,C.ol,x-1,y); }
        }
        if (mode==='wide') { P(g,C.wh,x+dx+w-1,y+h-1); }
      }
    }
  }
  function puff(g,x,y,r){ const f = eF(x,y,r,r*0.8); F(g,C.ol,x-r-2,y-r-2,x+r+2,y+r+2,dil(f)); F(g,C.cr,x-r-1,y-r-1,x+r+1,y+r+1,f); F(g,C.lg,x-r-1,y-r-1,x+r+1,y+r+1,(a,b)=>f(a,b)&&!f(a+1,b+1)); }
  // rotate offset list around origin by a, round, translate
  function rot(pts,a,ox,oy){ const c=cos(a), s=sin(a), o=[]; for (let i=0;i<pts.length;i+=2) o.push(rn(ox+pts[i]*c-pts[i+1]*s), rn(oy+pts[i]*s+pts[i+1]*c)); return o; }
  function stemT(g,pts,r,c1,c2){ const f = tubeF(pts,r||0.9), b = box(pts); body(g,f,b,c1||C.gr,c2||C.gd,null,C.ol,1); }
  function leaf(g,pts){ const f = pF(pts), b = box(pts); F(g,C.ol,b[0]-1,b[1]-1,b[2]+1,b[3]+1,dil(f)); F(g,C.gr,b[0],b[1],b[2],b[3],f); F(g,C.gd,b[0],b[1],b[2],b[3],(x,y)=>f(x,y)&&!f(x,y+2)); F(g,C.lm,b[0],b[1],b[2],b[3],(x,y)=>f(x,y)&&!f(x,y-1)); }

  // ================================================================ FRUTAS
  // red fruit ball: cx, cy, rx, ry; returns its shape test
  function cherryBall(g,cx,cy,rx,ry){
    const f = eF(cx,cy,rx,ry||rx);
    const bx = [cx-rx-1,cy-(ry||rx)-1,cx+rx+1,cy+(ry||rx)+1];
    body(g,f,bx,C.rd,C.wn,null,C.ol,2);
    F(g,C.pk,bx[0],bx[1],bx[2],bx[3],(x,y)=>f(x,y)&&!f(x-1,y-1)&&y<cy-1&&x<cx);
    S(g,cx-rx*0.62,cy-(ry||rx)*0.6,['.WW','WW.','W..']);
    return f;
  }

  // ---------------------------------------------------------------- Maçã Roliça
  CS['maca-rolica'] = function(g,t,st,p){
    OX = 0; OY = 0;
    let sq = 0, dy = 0, mode = (t%3.1) > 2.95 ? 'blink' : 'open', mouth = 'smile', la = 0.12*sin(t*2.2), dust = 0, rock = 0, spk = 0;
    const cx0 = 32;
    if (st==='atk') {
      const a = AT(p);
      if (p < 0.35) { const k = a.w; sq = p<0.12 ? 2 : -2*k; dy = p<0.12 ? 0 : -rn(11*Math.sin(k*PI*0.5)); mode = 'angry'; mouth = 'grit'; la = -0.5*k; }
      else { sq = rn(5*a.s); dust = a.s; mode = a.s>0.5?'angry':'open'; mouth = a.s>0.5?'shout':'smile'; la = 0.5*a.s; rock = 0; }
    } else if (st==='hit') { const h = HT(p); OY = -rn(2*h); sq = -rn(2*h); mode = h>0.3?'squint':'open'; mouth = h>0.3?'ow':'smile'; la = 0.6*h; OX = rn(sin(p*PI*6)*h); }
    else if (st==='sono') { sq = rn(1+sin(t*1.3)); mode = 'sleep'; mouth = 'zz'; la = 0.55; }
    else if (st==='entra') { spk = p; }
    else { sq = sin(t*2.4) > 0.3 ? 1 : 0; rock = rn(sin(t*1.6)*1.2); }
    // body size (entra: sprouts and swells with a springy overshoot)
    let k = 1; if (st==='entra') k = Math.max(0.15, back(p/0.75));
    const rx = (16+sq)*k, ry = (13-sq*0.7)*k, by = 56+dy, cx = cx0+rock;
    const cyM = by-ry;
    const ap = any(eF(cx,cyM,rx,ry), eF(cx-0.32*rx,cyM-0.17*ry,0.86*rx,1.05*ry), eF(cx+0.32*rx,cyM-0.17*ry,0.86*rx,1.05*ry));
    const top = rn(cyM-1.22*ry);
    // shoes (behind the body bottom)
    if (k > 0.6) {
      const fy = dy<0 ? by+1 : 55, sp = sq>2 ? 2 : 0;
      const SH = ['.oooo..','owwwwo.','otwwwwo','ottwwwo','.ooooo.'];
      S(g,cx-12-sp,fy,SH); S(g,cx+5+sp,fy,SH,true);
    }
    const bx = [cx-rx-1,top,cx+rx+1,by+1];
    F(g,C.ol,bx[0]-1,bx[1]-1,bx[2]+1,bx[3]+1,dil(ap));
    F(g,C.rd,bx[0],bx[1],bx[2],bx[3],ap);
    F(g,C.wn,bx[0],bx[1],bx[2],bx[3],(x,y)=>ap(x,y)&&!ap(x+3,y+3));
    F(g,C.pk,bx[0],bx[1],bx[2],bx[3],(x,y)=>ap(x,y)&&!ap(x-1,y-1)&&y<cyM-2&&x<cx-1);
    R(g,C.ol,cx-1,top+1,3,1);
    S(g,cx-rx*0.62,cyM-ry*0.55,['.WWW','WWW.','WW..','W...']);
    // stem + leaf
    if (k > 0.35) {
      R(g,C.ol,cx-2,top-6,4,8); R(g,C.wd,cx-1,top-5,2,7); P(g,C.wo,cx-1,top-5);
      leaf(g,rot([0,0, 5,-5, 12,-7, 16,-6, 12,-1, 5,2],la,cx+1,top-3));
      const ve = rot([3,-1, 11,-4],la,cx+1,top-3); LN(g,C.gd,ve[0],ve[1],ve[2],ve[3]);
    }
    // face
    if (k > 0.55) {
      const ey = rn(cyM-5);
      const md = st==='entra' ? (p<0.8?'wide':'open') : mode;
      eyes(g,[rn(cx-9),rn(cx+5)],ey,4,5,md);
      R(g,C.pk,rn(cx-14),ey+6,4,2); R(g,C.pk,rn(cx+10),ey+6,4,2);
      const mx = rn(cx-3), my = ey+6;
      if (mouth==='smile') S(g,mx,my,['o.....o','.ooooo.','..rrr..']);
      else if (mouth==='grit') S(g,mx,my,['.ooooo.','oWWWWWo','.ooooo.']);
      else if (mouth==='shout') S(g,mx,my,['.ooooo.','onnnnno','onpppno','.ooooo.']);
      else if (mouth==='ow') S(g,mx+1,my,['.ooo.','o.o.o']);
      else S(g,mx+2,my+1,['.oo.','o..o','.oo.']);
    }
    // stomp dust
    if (dust > 0.05) { const d = rn(4*(1-dust)); puff(g,cx-rx-3-d,57,3); puff(g,cx+rx+3+d,57,3); if (dust>0.6) { R(g,C.cr,cx-rx-9-d,50,3,1); R(g,C.cr,cx+rx+7+d,50,3,1); R(g,C.cr,cx-rx-6-d,47,1,2); R(g,C.cr,cx+rx+6+d,47,1,2); } }
    if (spk) { const r = 10+22*spk; for (let i = 0; i < 6; i++) { const a = i*PI/3+0.4; if (spk<0.9) spark(g,i%2?C.lm:C.cr,32+cos(a)*r,48-sin(a)*r*0.7); } }
    OX = 0; OY = 0;
  };

  // ---------------------------------------------------------------- Cereja (ficha)
  CS['cereja'] = function(g,t,st,p){
    OX = 0; OY = 0;
    let dy = 0, sq = 0, ang = 0, mode = (t%3.4) > 3.22 ? 'blink' : 'open', mouth = 'smile', streak = 0, k = 1, la = 0.15*sin(t*3);
    if (st==='atk') {
      const a = AT(p);
      if (p < 0.35) { ang = -0.45*a.w; OX = -rn(3*a.w); sq = rn(a.w); mode = 'angry'; mouth = 'grit'; }
      else { ang = 1.15*a.s; OX = rn(3*a.s); streak = a.s; mode = 'angry'; mouth = a.s>0.5?'shout':'smile'; }
    } else if (st==='hit') { const h = HT(p); OY = -rn(2*h); ang = -0.3*h; mode = h>0.3?'squint':'open'; mouth = h>0.3?'ow':'smile'; }
    else if (st==='sono') { sq = rn(0.6+0.6*sin(t*1.3)); mode = 'sleep'; mouth = 'zz'; la = 0.5; }
    else if (st==='entra') { k = Math.max(0.1, back(p/0.7)); mode = p<0.85?'wide':'open'; }
    else { // bouncy little hops
      const ph = (t*1.4)%1; const hop = ph<0.5 ? sin(ph*2*PI) : 0;
      dy = -rn(4*Math.max(0,hop)); sq = ph>0.5&&ph<0.62 ? 1 : 0;
    }
    const r = 10*k, rx = r+sq, ry = r-sq, cx = 32, cy = 60-ry+dy;
    // stem rotates with the body (rolling)
    const sx = cx+r*sin(ang), sy = cy-ry*cos(ang);
    if (k > 0.4) {
      const st1 = rot([0,0, 2,-6, 4,-13],ang+(st==='atk'&&p>0.35?-0.4:0)+la*0.4,sx,sy);
      stemT(g,st1.map(v=>v+0.5),0.9);
      leaf(g,rot([0,0, 4,-4, 10,-5, 12,-3, 8,1, 3,1],ang+la,st1[4]+1,st1[5]+1));
    }
    if (streak > 0.3) { R(g,C.cr,cx-r-10,cy-4,6,1); R(g,C.cr,cx-r-8,cy+1,5,1); R(g,C.cr,cx-r-11,cy+5,7,1); }
    const f = eF(cx,cy,rx,ry);
    body(g,f,[cx-rx-1,cy-ry-1,cx+rx+1,cy+ry+1],C.rd,C.wn,null,C.ol,2);
    F(g,C.pk,cx-rx,cy-ry,cx,cy,(x,y)=>f(x,y)&&!f(x-1,y-1)&&y<cy-1&&x<cx-1);
    // shine + face slide around as it rolls
    const fs = rn(r*0.32*sin(ang));
    S(g,cx-rx*0.6+fs,cy-ry*0.62,['.WW','WW.','W..']);
    if (k > 0.5) {
      const ey = rn(cy-3);
      eyes(g,[cx-5+fs,cx+2+fs],ey,3,4,mode);
      R(g,C.pk,cx-8+fs,ey+4,2,2); R(g,C.pk,cx+6+fs,ey+4,2,2);
      const mx = cx-2+fs, my = ey+5;
      if (mouth==='smile') S(g,mx,my,['o...o','.ooo.']);
      else if (mouth==='grit') S(g,mx,my,['ooooo','oWWWo','ooooo']);
      else if (mouth==='shout') S(g,mx,my,['.ooo.','onpno','.ooo.']);
      else if (mouth==='ow') S(g,mx,my,['.o.o.','o.o.o']);
      else S(g,mx+1,my,['.o.','o.o','.o.']);
    }
    if (st==='entra' && p < 0.9) { const rr = 8+20*p; for (let i = 0; i < 5; i++) { const a = i*1.256+0.3; spark(g,i%2?C.pk:C.wh,cx+cos(a)*rr,50-sin(a)*rr*0.8); } }
    OX = 0; OY = 0;
  };

  // ---------------------------------------------------------------- Cerejas Gêmeas
  CS['cerejas-gemeas'] = function(g,t,st,p){
    OX = 0; OY = 0;
    const bl = (t%3.6) > 3.45, look = (t%5) < 2.5 ? -1 : 0;
    // per cherry: x offset, y offset, squash; faces
    let dL = 0, dR = 0, yL = 0, yR = 0, mL = bl?'blink':'open', mR = 'look', moL = 'smile', moR = 'shy', star = 0, blush = 1, hands = 1, kL = 1, kR = 1, front = 'L';
    if (st==='atk') {
      const a = AT(p);
      if (p < 0.35) { dL = -rn(5*a.w); dR = rn(5*a.w); yL = yR = -rn(4*a.w); mL = mR = 'angry'; moL = moR = 'grit'; hands = 0; }
      else { dL = rn(6*a.s); dR = -rn(6*a.s); yL = yR = 0; mL = mR = a.s>0.5?'angry':'open'; moL = moR = a.s>0.5?'shout':'smile'; star = a.s; hands = a.s<0.4?1:0; }
    } else if (st==='hit') { const h = HT(p); dL = -rn(2*h); dR = rn(2*h); OY = -rn(h); mL = mR = h>0.3?'squint':'open'; moL = moR = h>0.3?'ow':'smile'; hands = h<0.5?1:0; }
    else if (st==='sono') { const b = rn(0.6+0.6*sin(t*1.2)); dL = 1; dR = -1; yL = 0; yR = 0; mL = mR = 'sleep'; moL = moR = 'zz'; blush = b; }
    else if (st==='entra') { // drop from the branch one after the other and bounce
      const fall = q=>{ q = Math.max(0,Math.min(1,q)); if (q<0.55) { const u=q/0.55; return -rn(40*(1-u*u)); } const u=(q-0.55)/0.45; return -rn(6*sin(u*PI)*(1-u)); };
      yL = fall(p/0.8); yR = fall((p-0.06)/0.8); mL = mR = 'wide'; moL = moR = 'ow'; hands = p>0.9?1:0;
    } else { // swinging in counter-phase; the shy one glances at her twin
      const s = sin(t*2.2); dL = rn(s); dR = rn(-s); yL = s>0.6?-1:0; yR = s<-0.6?-1:0; mR = 'look'; blush = sin(t*1.7)>0?1:0;
    }
    const r = 10, cxL = 21.5+dL, cxR = 42.5+dR, cyL = 50.5+yL, cyR = 50.5+yR;
    // stems to the shared knot and its leaves
    const jx = 32, jy = Math.min(cyL,cyR)-27;
    stemT(g,[jx+0.5,jy+2, cxL+2,cyL-r+1],0.9); stemT(g,[jx+1.5,jy+2, cxR-2,cyR-r+1],0.9);
    const lw = st==='idle' ? 0.12*sin(t*2.2+1) : 0;
    leaf(g,rot([0,0, -4,-4, -11,-5, -14,-3, -9,1, -3,1],lw,jx,jy+1));
    leaf(g,rot([0,0, 4,-5, 10,-8, 14,-7, 10,-2, 4,1],-lw,jx+2,jy+1));
    S(g,jx-2,jy-1,['.ooo.','oglgo','ogggo','.ooo.']);
    // cherries (the one that lunges in front last)
    const drawL = ()=>{
      cherryBall(g,cxL,cyL,r,r);
      const ey = rn(cyL-3), ex = rn(cxL);
      eyes(g,[ex-5,ex+2],ey,3,4,mL);
      R(g,C.pk,ex-8,ey+4,2,2); R(g,C.pk,ex+6,ey+4,2,2);
      const my = ey+5;
      if (moL==='smile') S(g,ex-2,my,['o...o','.ooo.']);
      else if (moL==='grit') S(g,ex-2,my,['ooooo','oWWWo','ooooo']);
      else if (moL==='shout') S(g,ex-2,my,['.ooo.','onpno','.ooo.']);
      else if (moL==='ow') S(g,ex-1,my,['.o.','o.o']);
      else S(g,ex-1,my,['.o.','o.o','.o.']);
    };
    const drawR = ()=>{
      cherryBall(g,cxR,cyR,r,r);
      const ey = rn(cyR-3), ex = rn(cxR);
      if (mR==='look') { S(g,ex-5,ey-2,['oo.....oo']); eyes(g,[ex-5,ex+2],ey,3,4,'open',look); }
      else eyes(g,[ex-5,ex+2],ey,3,4,mR);
      if (blush || moR!=='shy') { R(g,C.pk,ex-8,ey+4,3,2); R(g,C.pk,ex+5,ey+4,3,2); }
      const my = ey+5;
      if (moR==='shy') S(g,ex-1,my+1,['.o.o','o.o.']);
      else if (moR==='smile') S(g,ex-2,my,['o...o','.ooo.']);
      else if (moR==='grit') S(g,ex-2,my,['ooooo','oWWWo','ooooo']);
      else if (moR==='shout') S(g,ex-2,my,['.ooo.','onpno','.ooo.']);
      else if (moR==='ow') S(g,ex-1,my,['.o.','o.o']);
      else S(g,ex-1,my,['.o.','o.o','.o.']);
    };
    drawR(); drawL();
    // holding hands between them
    if (hands) { const hx = rn((cxL+cxR)/2), hy = rn(Math.max(cyL,cyR)+3); S(g,hx-4,hy,['oo.....oo','.ooo.ooo.','...oro...','....o....']); }
    if (star > 0.2) { const sx = 32, sy = 42, s = rn(2+3*star); R(g,C.ol,sx-s-1,sy-1,2*s+3,3); R(g,C.ol,sx-1,sy-s-1,3,2*s+3); R(g,C.yl,sx-s,sy,2*s+1,1); R(g,C.yl,sx,sy-s,1,2*s+1); R(g,C.wh,sx-1,sy-1,3,3); P(g,C.cr,sx-4,sy-4); P(g,C.cr,sx+4,sy-4); P(g,C.cr,sx-4,sy+4); P(g,C.cr,sx+4,sy+4); }
    OX = 0; OY = 0;
  };
  // ================================================================ ABELHAS
  // little music note (she sings while she works)
  function note(g,x,y){
    x = rn(x); y = rn(y);
    const f = (a,b)=>{ const u=a-x, v=b-y; return (u===3&&v>=0&&v<=4)||(u===4&&v===0)||(u===5&&v===1)||(u>=1&&u<=3&&v>=4&&v<=5); };
    F(g,C.ol,x-1,y-2,x+7,y+7,(a,b)=>dil(f)(a,b)&&!f(a,b)); F(g,C.cr,x,y-1,x+6,y+6,f);
  }
  function wingPair(g,cx,cy,dx,rx,ry,ang,rim,shine){
    for (const s of [-1,1]) {
      const wx = cx+s*dx, f = rE(wx,cy,rx,ry,-s*ang);
      const b = [wx-rx-2,cy-rx-2,wx+rx+2,cy+rx+2];
      F(g,rim,b[0],b[1],b[2],b[3],(x,y)=>dil(f)(x,y)&&!f(x,y));
      F(g,C.sk,b[0],b[1],b[2],b[3],f);
      F(g,C.wh,b[0],b[1],b[2],b[3],(x,y)=>f(x,y)&&!f(x-s,y-1));
      if (shine) { R(g,C.wh,rn(wx-3),rn(cy-1),4,1); R(g,C.wh,rn(wx-1),rn(cy+1),3,1); }
    }
  }

  // ---------------------------------------------------------------- Abelha Operária
  CS['abelha-operaria'] = function(g,t,st,p){
    OX = 0; OY = 0;
    let dy = rn(1.5*sin(t*2.6))-1, wf = fl(t*14)%2, sq = 0, mode = (t%2.9) > 2.76 ? 'blink' : 'open', mouth = 'sing', sting = 0, lines = 0, wsp = 0, antA = rn(sin(t*3.3)), hug = 1;
    const singing = ((t*0.5)%1) < 0.55;
    if (!singing) mouth = 'smile';
    if (st==='atk') {
      const a = AT(p);
      mouth = 'grit'; mode = 'angry';
      if (p < 0.35) { dy = -rn(5*a.w); sq = -rn(2*a.w); wsp = rn(3*a.w); }
      else { dy = rn(2*a.s); sq = rn(2*a.s); sting = a.s; lines = a.s; mouth = a.s>0.5?'shout':'smile'; if (a.s<0.5) mode='open'; }
    } else if (st==='hit') { const h = HT(p); dy = -rn(3*h); OX = rn(sin(p*PI*5)*1.5*h); mode = h>0.3?'squint':'open'; mouth = h>0.3?'ow':'smile'; wf = 1; }
    else if (st==='sono') { dy = 3+rn(sin(t*1.2)); wf = 1; mode = 'sleep'; mouth = 'zz'; antA = 2; }
    else if (st==='entra') { dy = -rn(26*(1-sm(p/0.7)))+rn(2*sin(Math.min(1,p)*PI*2)); mode = p<0.8?'wide':'open'; mouth = 'sing'; wsp = 2; }
    const cx = 32, cy = 40+dy, rx = 13+sq, ry = 12-sq;
    // wings (behind), fast flicker; asleep they fold down
    if (st==='sono') wingPair(g,cx,cy-9,13,7,4,-0.5,C.ol,true);
    else wingPair(g,cx,cy-12+(wf?1:0),15+wsp,8.5,wf?4.5:5.8,0.35,C.ol,true);
    // antennae
    const ay = cy-12;
    for (const s of [-1,1]) {
      const bx = cx+s*4;
      const ex = rn(cx+s*8), ey = rn(ay-7+(s>0?antA:-antA)*0.5);
      LN(g,C.ol,bx,ay+1,rn((bx+ex)/2+s),rn((ay+ey)/2)); LN(g,C.ol,rn((bx+ex)/2+s),rn((ay+ey)/2),ex,ey);
      if (st==='sono') { R(g,C.ol,ex-1,ey,3,3); P(g,C.yl,ex,ey+1); }
      else { R(g,C.ol,ex-1,ey-2,3,3); P(g,C.yl,ex,ey-1); }
    }
    // stinger (behind the bottom)
    const sl = rn(2+5*sting);
    R(g,C.ol,cx-1,cy+ry-1,3,sl+1); R(g,C.lg,cx,cy+ry-1,1,sl);
    if (sting > 0.5) { spark(g,C.wh,cx,cy+ry+sl+1,true); }
    // round striped body
    const bf = eF(cx,cy,rx,ry);
    const stripe = y=>{ const k = y-cy; return (k>=1.5&&k<3.5)||(k>=7&&k<9); };
    const bx = [cx-rx-1,cy-ry-1,cx+rx+1,cy+ry+1];
    F(g,C.ol,bx[0]-1,bx[1]-1,bx[2]+1,bx[3]+1,dil(bf));
    F(g,C.yl,bx[0],bx[1],bx[2],bx[3],bf);
    F(g,C.or,bx[0],bx[1],bx[2],bx[3],(x,y)=>bf(x,y)&&!bf(x+2,y+2)&&!stripe(y));
    F(g,C.ol,bx[0],bx[1],bx[2],bx[3],(x,y)=>bf(x,y)&&stripe(y));
    F(g,C.cr,bx[0],bx[1],bx[2],bx[3],(x,y)=>bf(x,y)&&!bf(x-1,y-1)&&y<cy);
    R(g,C.cr,cx-7,cy-9,3,1); P(g,C.cr,cx-8,cy-8);
    // face
    const ey = rn(cy-8);
    eyes(g,[cx-7,cx+4],ey,3,4,mode);
    R(g,C.pk,cx-11,ey+4,3,2); R(g,C.pk,cx+8,ey+4,3,2);
    const my = ey+4;
    if (mouth==='sing') S(g,cx-1,my,['.oo.','onno','.oo.']);
    else if (mouth==='smile') S(g,cx-2,my,['o...o','.ooo.']);
    else if (mouth==='grit') S(g,cx-2,my,['ooooo','oWWWo','ooooo']);
    else if (mouth==='shout') S(g,cx-2,my,['.ooo.','onnno','onpno','.ooo.']);
    else if (mouth==='ow') S(g,cx-1,my,['.o.o','o.o.']);
    else S(g,cx-1,my,['.oo.','o..o','.oo.']);
    // honey pot hugged in front + little arms
    if (hug) {
      const px = cx-6, py = rn(cy+1);
      S(g,px,py,[
        '.oooooooooooo.',
        'oddddddddddddo',
        '.oyyyyyyyyyyo.',
        'oOyyOOOOOOOOOo',
        'oOcOOOOOOOOwOo',
        'oOcOOOOOOOOwOo',
        'oOOOOOOOOOwwOo',
        '.ooooooooooo.'
      ]);
      P(g,C.yl,px+3,py+3); R(g,C.yl,px+7,py+3,1,2);
      S(g,px-3,py+2,['oo..','.ooo','..oo']); S(g,px+13,py+2,['..oo','ooo.','oo..']);
    }
    // song notes / dive lines
    if (st==='idle' && singing) { const k = (t*0.5)%1/0.55; note(g,cx+20+rn(2*sin(k*6)),cy-14-rn(10*k)); }
    if (lines > 0.4) { for (const lx of [cx-10,cx-3,cx+4,cx+10]) R(g,C.cr,lx,cy-ry-10+((lx>>1)&3),1,5); }
    if (st==='entra' && p < 0.9) { for (let i = 0; i < 4; i++) { const a = i*PI/2+p*3; spark(g,C.cr,cx+cos(a)*18,cy-4+sin(a)*12); } }
    OX = 0; OY = 0;
  };

  // ---------------------------------------------------------------- Zangão (ficha)
  CS['zangao'] = function(g,t,st,p){
    OX = 0; OY = 0;
    // jittery buzzing hover
    let dy = rn(sin(t*7.3)*0.8+sin(t*2.1)), dx = rn(sin(t*3.1)*0.7), wf = fl(t*16)%2, abA = 0.3+0.06*sin(t*5), mode = (t%2.6) > 2.47 ? 'blink' : 'open', sting = 0, mouth = 'smile', anA = rn(sin(t*4));
    if (st==='atk') {
      const a = AT(p); mode = 'angry'; mouth = 'grit';
      if (p < 0.35) { abA = 0.3-0.75*a.w; dy = -rn(4*a.w); dx = rn(3*a.w); }
      else { abA = 0.3+1.55*a.s; dx = -rn(2*a.s); dy = rn(a.s); sting = a.s; if (a.s<0.5) { mode='open'; mouth='smile'; } }
    } else if (st==='hit') { const h = HT(p); dx = rn(3*h); dy = -rn(2*h); mode = h>0.3?'squint':'open'; mouth = h>0.3?'ow':'smile'; wf = 0; }
    else if (st==='sono') { dy = 4+rn(sin(t*1.2)); dx = 0; abA = 0.55; wf = 1; mode = 'sleep'; mouth = 'zz'; anA = 2; }
    else if (st==='entra') { dx = rn(30*(1-sm(p/0.7))); dy = -rn(14*(1-sm(p/0.7))); mode = p<0.8?'wide':'open'; }
    OX = dx; OY = dy;
    const T = [30,38], H = [18,39], J = [35,39.5];
    // far wing
    const wing = (x,y,a,L,w,near)=>{ const f = bladeF(x,y,a,L,w), b = [x-L-2,y-L-2,x+L+2,y+L+2]; F(g,C.ol,b[0],b[1],b[2],b[3],(u,v)=>dil(f)(u,v)&&!f(u,v)); F(g,C.sk,b[0],b[1],b[2],b[3],f); if (near) F(g,C.wh,b[0],b[1],b[2],b[3],(u,v)=>f(u,v)&&!f(u-1,v-1)); };
    if (st==='sono') wing(32,33,-0.15,16,3,0);
    else wing(32,33,wf?-1.05:-0.55,15,4,0);
    // abdomen on a hinge at the waist (curls under to sting)
    const ca = cos(abA), sa = sin(abA), L = 10, ax = J[0]+L*ca, ay = J[1]+L*sa, arx = 10.5, ary = 8.3;
    const ab = rE(ax,ay,arx,ary,abA);
    const uu = (x,y)=>(x+0.5-ax)*ca+(y+0.5-ay)*sa;
    const strp = (x,y)=>{ const u = uu(x,y); return (u>-3&&u<-0.6)||(u>2.6&&u<5); };
    const bb = [ax-12,ay-12,ax+12,ay+12];
    // stinger at the tip
    const tx = ax+(arx+1)*ca, ty = ay+(arx+1)*sa, sL = 2+5*sting;
    stemT(g,[tx,ty, tx+ca*sL,ty+sa*sL],0.6,C.lg,C.gy);
    if (sting > 0.5) spark(g,C.wh,tx+ca*(sL+2),ty+sa*(sL+2),true);
    F(g,C.ol,bb[0]-1,bb[1]-1,bb[2]+1,bb[3]+1,dil(ab));
    F(g,C.yl,bb[0],bb[1],bb[2],bb[3],ab);
    F(g,C.or,bb[0],bb[1],bb[2],bb[3],(x,y)=>ab(x,y)&&!ab(x+1,y+2)&&!strp(x,y));
    F(g,C.ol,bb[0],bb[1],bb[2],bb[3],(x,y)=>ab(x,y)&&strp(x,y));
    F(g,C.cr,bb[0],bb[1],bb[2],bb[3],(x,y)=>ab(x,y)&&!ab(x,y-1)&&!strp(x,y));
    // legs dangling + pollen ball
    if (st!=='sono') { LN(g,C.ol,26,44,24,49); LN(g,C.ol,30,45,30,50); LN(g,C.ol,34,44,36,48); }
    else { LN(g,C.ol,26,44,23,46); LN(g,C.ol,30,45,28,47); }
    const pb = st==='sono' ? [20,45] : [21,48];
    R(g,C.ol,pb[0],pb[1],5,4); R(g,C.ol,pb[0]-1,pb[1]+1,7,2); R(g,C.yl,pb[0],pb[1]+1,5,2); R(g,C.yl,pb[0]+1,pb[1],3,3); P(g,C.cr,pb[0]+1,pb[1]+1); P(g,C.or,pb[0]+3,pb[1]+2);
    // fuzzy thorax
    const tx0 = eF(T[0],T[1],7.2,7);
    F(g,C.ol,T[0]-9,T[1]-9,T[0]+9,T[1]+9,dil(tx0));
    F(g,C.wd,T[0]-8,T[1]-8,T[0]+8,T[1]+8,tx0);
    F(g,C.sd,T[0]-8,T[1]-8,T[0]+8,T[1]+8,(x,y)=>tx0(x,y)&&!tx0(x+2,y+2));
    for (const q of [[27,33],[31,32],[34,34],[26,36],[29,35],[32,37],[35,38],[25,40],[28,39]]) P(g,(q[0]+q[1])%2?C.wo:C.sd,q[0],q[1]);
    for (const q of [[25,31],[29,30],[33,31],[36,34],[23,34]]) P(g,C.ol,q[0],q[1]);
    // head with the big drone eye
    const hd = eF(H[0],H[1],7.2,7);
    F(g,C.ol,H[0]-9,H[1]-9,H[0]+9,H[1]+9,dil(hd));
    F(g,C.yl,H[0]-8,H[1]-8,H[0]+8,H[1]+8,hd);
    F(g,C.or,H[0]-8,H[1]-8,H[0]+8,H[1]+8,(x,y)=>hd(x,y)&&!hd(x+1,y+2));
    F(g,C.cr,H[0]-8,H[1]-8,H[0]+8,H[1]+8,(x,y)=>hd(x,y)&&!hd(x-1,y-1)&&y<H[1]-2);
    const ex = H[0]-4, ey = H[1]-5;
    if (mode==='blink') R(g,C.ol,ex,ey+4,5,2);
    else if (mode==='sleep') { R(g,C.ol,ex,ey+4,5,1); P(g,C.ol,ex-1,ey+3); P(g,C.ol,ex+5,ey+3); }
    else if (mode==='squint') S(g,ex,ey+2,['oo...','..ooo','oo...']);
    else {
      R(g,C.ol,ex,ey,5,7); R(g,C.ol,ex+1,ey-1,3,1);
      R(g,C.wh,ex,ey,2,2); P(g,C.wh,ex+1,ey+2); P(g,C.sk,ex+3,ey); P(g,C.sk,ex+3,ey+5);
      if (mode==='angry') { LN(g,C.ol,ex-1,ey-3,ex+5,ey-1); R(g,C.yl,ex+3,ey-1,2,1); }
      if (mode==='wide') { R(g,C.wh,ex,ey,2,2); P(g,C.wh,ex+3,ey+4); }
    }
    R(g,C.pk,H[0]-7,H[1]+2,3,2);
    if (mouth==='smile') S(g,H[0]-6,H[1]+4,['o..','.oo']);
    else if (mouth==='grit') S(g,H[0]-7,H[1]+4,['oooo','oWWo','oooo']);
    else if (mouth==='ow') S(g,H[0]-6,H[1]+4,['o.o','.o.']);
    else S(g,H[0]-6,H[1]+4,['oo']);
    // antennae
    const a1 = st==='sono' ? 3 : anA;
    LN(g,C.ol,H[0]+1,H[1]-6,H[0]-1,H[1]-11); LN(g,C.ol,H[0]-1,H[1]-11,H[0]-6,H[1]-13+a1); R(g,C.ol,H[0]-8,H[1]-15+a1,3,3); P(g,C.yl,H[0]-7,H[1]-14+a1);
    LN(g,C.ol,H[0]+4,H[1]-6,H[0]+6,H[1]-12); LN(g,C.ol,H[0]+6,H[1]-12,H[0]+5,H[1]-16-a1*0.5); R(g,C.ol,H[0]+4,H[1]-18-rn(a1*0.5),3,3); P(g,C.yl,H[0]+5,H[1]-17-rn(a1*0.5));
    // near wing + buzz streaks
    if (st==='sono') wing(31,34,0.05,17,3.4,1);
    else wing(30,33,wf?-1.4:-0.85,16,4.6,1);
    if (st==='idle'||st==='entra') { const k = fl(t*6)%2; R(g,C.cr,52,29+k,4,1); R(g,C.cr,54,33-k,5,1); R(g,C.cr,51,37+k,3,1); }
    OX = 0; OY = 0;
  };

  // ---------------------------------------------------------------- Abelha Rainha (épica)
  const CROWN = [
    '..o.....o.....o..',
    '.oco...oco...oco.',
    '.oyo..oyyyo..oyo.',
    '.oyyooyyyyyooyyo.',
    '.oyyyyyynyyyyyyo.',
    '.oyyyyynrnyyyyyo.',
    '.ocOOOOOnOOOOOco.',
    '.ooooooooooooooo.'
  ];
  CS['abelha-rainha'] = function(g,t,st,p){
    OX = 0; OY = 0;
    const blink = (t%3.7) > 3.55;
    let dy = rn(1.6*sin(t*1.7)), wf = fl(t*9)%2, mode = blink?'blink':'open', mouth = 'smile', scA = -1.45, reach = 1, zz = 1, hxo = 0, lean = 0, sting = 0, burst = 0, crownDx = 0, crownDy = 0, wsp = 0, drip = (t*0.8)%1, glow = 0, wingsFold = 0;
    if (st==='atk') {
      const a = AT(p); mode = 'angry';
      if (p < 0.35) { scA = -1.45+0.6*a.w; dy = -rn(3*a.w); wsp = rn(2*a.w); mouth = 'grit'; glow = a.w; }
      else { scA = -1.45+2.05*a.s; reach = 1-0.45*a.s; zz = 1+0.4*a.s; hxo = -rn(4*a.s); dy = rn(a.s); sting = a.s; burst = a.s; mouth = a.s>0.5?'shout':'smile'; if (a.s<0.4) mode='open'; }
      drip = 0;
    } else if (st==='hit') { const h = HT(p); dy = -rn(2*h); OX = rn(sin(p*PI*5)*1.5*h); mode = h>0.3?'squint':'open'; mouth = h>0.3?'ow':'smile'; crownDx = rn(2*h); crownDy = -rn(h); wf = 0; }
    else if (st==='sono') { dy = 3+rn(sin(t*1.1)); mode = 'sleep'; mouth = 'zz'; crownDx = 2; crownDy = 1; scA = -1.05; wingsFold = 1; drip = 0; }
    else if (st==='entra') { dy = -rn(30*(1-sm(p/0.75))); mode = p<0.85?'wide':'open'; wsp = rn(3*(1-p)); }
    OY = dy;
    const cx = 32;
    // aura sparkles (royal shimmer)
    const sp = fl(t*3)%4;
    const SP = [[6,30],[58,30],[10,12],[54,12],[4,46],[60,46]];
    if (st!=='sono') for (let i = 0; i < SP.length; i++) { const k = (sp+i)%4; if (k===0) spark(g,C.wh,SP[i][0],SP[i][1]); else if (k===1) P(g,C.cr,SP[i][0],SP[i][1]); }
    // wings: sky with a white checker shimmer, lilac rim
    const wL = wingsFold ? any(rE(20,30,11,4.5,-0.15), rE(23,38,6,3,0.35)) : any(rE(17-wsp,24+(wf?1:0),13,wf?6:7,-0.4), rE(20-wsp,35,8,4,0.35));
    const wR = wingsFold ? any(rE(44,30,11,4.5,0.15), rE(41,38,6,3,-0.35)) : any(rE(47+wsp,24+(wf?1:0),13,wf?6:7,0.4), rE(44+wsp,35,8,4,-0.35));
    for (const w of [wL,wR]) { F(g,C.li,0,10,63,46,dil(w)); F(g,C.sk,0,10,63,46,w); }
    for (let y = 14; y < 34; y++) for (let x = 3+((y+wf)&1); x < 62; x += 2) if ((x<17||x>47) && (wL(x,y)||wR(x,y)) && (wL(x-2,y-2)!==wL(x,y) || wR(x+2,y-2)!==wR(x,y))) P(g,C.wh,x,y);
    if (!wingsFold) { R(g,C.wh,10-wsp,22,6,1); R(g,C.wh,48+wsp,22,6,1); R(g,C.wh,13-wsp,24,4,1); R(g,C.wh,47+wsp,24,4,1); }
    // stinger
    const sl = rn(2+6*sting);
    stemT(g,[cx+0.5,55, cx+0.5,55+sl],0.7,C.lg,C.gy);
    if (sting > 0.5) spark(g,C.wh,cx,56+sl,true);
    // plump striped abdomen
    const abd = eF(cx,44,13,11.5);
    const strp = y=>(y>=41&&y<=42)||(y>=47&&y<=48)||y===52;
    F(g,C.ol,18,31,46,57,dil(abd));
    F(g,C.yl,19,32,45,56,abd);
    F(g,C.or,19,32,45,56,(x,y)=>abd(x,y)&&!abd(x+2,y+2)&&!strp(y));
    F(g,C.ol,19,32,45,56,(x,y)=>abd(x,y)&&strp(y));
    F(g,C.cr,19,32,45,56,(x,y)=>abd(x,y)&&!abd(x-1,y-1)&&y<41);
    // royal fur collar
    const col = eF(cx,32,12.5,4.6);
    F(g,C.ol,18,26,46,38,dil(col));
    F(g,C.cr,19,27,45,37,col);
    F(g,C.st,19,27,45,37,(x,y)=>col(x,y)&&!col(x+1,y+1));
    for (const q of [[23,31],[28,33],[33,32],[38,33],[42,31],[26,30],[36,30]]) P(g,C.ol,q[0],q[1]);
    // left arm on her hip
    S(g,14,35,['...ooo','..oyyo','.oyyo.','oyyo..','oyyo..','.oyyo.','..ooo.']);
    // scepter: honey dipper held in the right hand, angle scA (-PI/2 = straight up)
    const hx = 47+hxo, hy = 40, ca = cos(scA), sa = sin(scA);
    const tip = [hx+ca*20*reach, hy+sa*20*reach], butt = [hx-ca*5, hy-sa*5];
    stemT(g,[butt[0],butt[1], tip[0],tip[1]],1,C.wo,C.wd);
    const dc = [hx+ca*(20*reach+4*zz), hy+sa*(20*reach+4*zz)], dp = rE(dc[0],dc[1],4.6*zz,3.2*zz,scA);
    const db = [dc[0]-8,dc[1]-8,dc[0]+8,dc[1]+8];
    if (glow > 0.3 || burst > 0.3) { const gr = 6+3*Math.max(glow,burst); F(g,C.cr,db[0]-4,db[1]-4,db[2]+4,db[3]+4,(x,y)=>((x+y)&1)===0&&inE(x,y,dc[0],dc[1],gr,gr)&&!inE(x,y,dc[0],dc[1],gr-3,gr-3)); }
    body(g,dp,db,C.or,C.wo,C.yl,C.ol,1);
    const uu = (x,y)=>(x+0.5-dc[0])*ca+(y+0.5-dc[1])*sa;
    F(g,C.wo,db[0],db[1],db[2],db[3],(x,y)=>dp(x,y)&&Math.abs(Math.abs(uu(x,y))-1.8*zz)<0.6);
    // honey drip from the dipper
    if (drip > 0) { const dx0 = rn(dc[0]), dy0 = rn(dc[1]+3); const L = rn(drip*7); if (drip < 0.7) { R(g,C.or,dx0,dy0,1,1+rn(drip*4)); P(g,C.yl,dx0,dy0); } else { R(g,C.or,dx0,dy0,1,2); R(g,C.ol,dx0-1,dy0+L-1,3,3); P(g,C.or,dx0,dy0+L); } }
    S(g,43+hxo,37,['.ooo.','oyyyo','oyyyo','.ooo.']);
    // head
    const hd = eF(cx,22,9.6,8.2);
    F(g,C.ol,20,12,44,32,dil(hd));
    F(g,C.yl,21,13,43,31,hd);
    F(g,C.or,21,13,43,31,(x,y)=>hd(x,y)&&!hd(x+2,y+1));
    F(g,C.cr,21,13,43,31,(x,y)=>hd(x,y)&&!hd(x-1,y-1));
    // face: lashes, kind eyes, rosy cheeks, smile
    const ey = 19;
    eyes(g,[26,35],ey,3,4,mode);
    if (mode==='open'||mode==='wide'||mode==='angry') { P(g,C.ol,25,ey); P(g,C.ol,24,ey-1); P(g,C.ol,38,ey); P(g,C.ol,39,ey-1); }
    if (mode==='sleep'||mode==='blink') { P(g,C.ol,25,ey+2); P(g,C.ol,38,ey+2); }
    R(g,C.pk,23,25,3,2); R(g,C.pk,38,25,3,2);
    if (mouth==='smile') S(g,29,25,['o....o','.oooo.']);
    else if (mouth==='grit') S(g,29,25,['oooooo','oWWWWo','oooooo']);
    else if (mouth==='shout') S(g,29,25,['.oooo.','onnnno','onpppo','.oooo.']);
    else if (mouth==='ow') S(g,30,25,['.o.o','o.o.']);
    else S(g,30,25,['.oo.','o..o','.oo.']);
    // antennae curling out of the crown
    const ANT = ['oo....','oyo...','.oo...','...o..','....o.','.....o'];
    S(g,20,6,ANT); S(g,38,6,ANT,true);
    // crown with the ruby
    const cxk = 24+crownDx, cyk = 6+crownDy;
    S(g,cxk,cyk,CROWN);
    if (st!=='sono') { const tw = fl(t*3)%3; if (tw===0) spark(g,C.wh,cxk+2,cyk-1); else if (tw===1) spark(g,C.wh,cxk+14,cyk-1); else { P(g,C.wh,cxk+8,cyk-2); P(g,C.wh,cxk+8,cyk+5); } }
    P(g,C.wh,cxk+7,cyk+4);
    // royal burst from the scepter on the strike
    if (burst > 0.2) { const r0 = 3+9*(1-burst)+4; for (let i = 0; i < 8; i++) { const a = i*PI/4; const x = dc[0]+cos(a)*r0, y = dc[1]+sin(a)*r0; if (i%2) spark(g,C.yl,x,y,true); else spark(g,C.cr,x,y); } spark(g,C.wh,dc[0],dc[1],true); }
    if (st==='entra' && p < 0.95) { const r = 26*(1-p)+8; for (let i = 0; i < 8; i++) { const a = i*PI/4+p*4; spark(g,i%2?C.yl:C.wh,32+cos(a)*r,34+sin(a)*r*0.8,i%2===0); } }
    OX = 0; OY = 0;
  };
  // ================================================================ BICHINHOS
  // ---------------------------------------------------------------- Joaninha Curandeira
  CS['joaninha-curandeira'] = function(g,t,st,p){
    OX = 0; OY = 0;
    const ab = fl(t*3)%2;
    let mode = (t%3.3) > 3.15 ? 'blink' : 'open', mouth = 'smile', open = 0, hy = 0, hz = 0, drop = 1, dropDy = rn(sin(t*2.4)), heal = st==='idle', wingsOut = 0, lines = 0, antUp = ab;
    if (st==='atk') {
      const a = AT(p);
      if (p < 0.35) { open = rn(3*a.w); OY = -rn(2*a.w); mode = 'angry'; mouth = 'grit'; wingsOut = a.w; hy = -rn(a.w); }
      else { open = rn(5*a.s); hy = rn(4*a.s); hz = a.s>0.5?1:0; mode = a.s>0.5?'angry':'open'; mouth = a.s>0.5?'chomp':'smile'; wingsOut = a.s; lines = a.s; }
      drop = 1; dropDy = 0;
    } else if (st==='hit') { const h = HT(p); OY = -rn(2*h); OX = rn(sin(p*PI*5)*1.5*h); mode = h>0.3?'squint':'open'; mouth = h>0.3?'ow':'smile'; antUp = h>0.3?1:0; }
    else if (st==='sono') { hy = 2+rn(0.5+0.5*sin(t*1.2)); mode = 'sleep'; mouth = 'zz'; drop = 2; }
    else if (st==='entra') { const k = sm(p/0.7); OY = -rn(24*(1-k)); wingsOut = 1-sm((p-0.6)/0.4); open = rn(4*wingsOut); mode = p<0.85?'wide':'open'; }
    const cx = 32, cy = 46;
    // flight wings (sky) peek out when the shell opens
    if (wingsOut > 0.1) {
      const wf = fl(t*12+p*20)%2;
      for (const s of [-1,1]) { const f = bladeF(cx+s*3,cy-6,s<0?PI+0.5+(wf?0.25:0):-0.5-(wf?0.25:0),16+4*wingsOut,4.5); const b=[cx-30,cy-26,cx+30,cy+6]; F(g,C.ol,b[0],b[1],b[2],b[3],(x,y)=>dil(f)(x,y)&&!f(x,y)); F(g,C.sk,b[0],b[1],b[2],b[3],f); F(g,C.wh,b[0],b[1],b[2],b[3],(x,y)=>f(x,y)&&!f(x,y-1)); }
    }
    // little black legs
    S(g,cx-12,57,['o.......o..........o.......o','.o......o..........o......o.','.oo....oo..........oo....oo.']);
    // shell (splits into two elytra when open)
    const sh = eF(cx,cy,15,12.5);
    const L = (x,y)=>x<cx&&sh(x+open,y), Rr = (x,y)=>x>=cx&&sh(x-open,y);
    if (open > 0) { const mid = eF(cx,cy+1,6+open,10.5); F(g,C.ol,cx-12,cy-12,cx+12,cy+12,mid); F(g,C.sd,cx-12,cy-12,cx+12,cy+12,(x,y)=>mid(x,y)&&y>cy-6&&((x+y)&1)); }
    for (const [hf,sd] of [[L,1],[Rr,-1]]) {
      const b = [cx-17-open,cy-14,cx+17+open,cy+14];
      F(g,C.ol,b[0]-1,b[1]-1,b[2]+1,b[3]+1,dil(hf));
      F(g,C.rd,b[0],b[1],b[2],b[3],hf);
      F(g,C.wn,b[0],b[1],b[2],b[3],(x,y)=>hf(x,y)&&!hf(x+2,y+2));
      F(g,C.ol,b[0],b[1],b[2],b[3],(x,y)=>hf(x,y)&&!hf(x+sd,y)&&(sd>0?x>=cx-1:x<=cx));
    }
    // seven spots
    for (const q of [[22,42,-1],[39,42,1],[24,50,-1],[37,50,1],[28,55,-1],[33,48,1],[43,49,1]]) { const x = q[0]+q[2]*open; R(g,C.ol,x,q[1]+1,4,2); R(g,C.ol,x+1,q[1],2,4); }
    S(g,cx-11-open,cy-8,['..WW','.WW.','WW..','W...']);
    // head (black, with a night-blue rim so it reads on dark ground)
    const hcy = 33+hy, hrx = 9.5+hz, hry = 7+hz;
    const hd = eF(cx,hcy,hrx,hry);
    F(g,C.ol,cx-12,hcy-10,cx+12,hcy+10,dil(hd));
    F(g,C.nt,cx-12,hcy-10,cx+12,hcy+10,(x,y)=>hd(x,y)&&!hd(x-1,y-2)&&y<hcy);
    // eyes: big white with black pupils
    const ey = rn(hcy-3), ex1 = cx-7, ex2 = cx+3;
    if (mode==='sleep'||mode==='blink') { for (const x of [ex1,ex2]) { R(g,C.lg,x,ey+2,4,1); P(g,C.lg,x-1,ey+1); P(g,C.lg,x+4,ey+1); } }
    else if (mode==='squint') { S(g,ex1,ey,['WW..','..WW','WW..']); S(g,ex2,ey,['..WW','WW..','..WW']); }
    else {
      for (const x of [ex1,ex2]) { R(g,C.wh,x,ey,4,4); R(g,C.wh,x+1,ey-1,2,1); }
      const pd = mode==='wide'?0:1;
      R(g,C.ol,ex1+2,ey+1,2,2+pd); R(g,C.ol,ex2,ey+1,2,2+pd); P(g,C.wh,ex1+2,ey+1); P(g,C.wh,ex2,ey+1);
      if (mode==='angry') { R(g,C.ol,ex1,ey-1,2,1); P(g,C.ol,ex1,ey); R(g,C.ol,ex2+2,ey-1,2,1); P(g,C.ol,ex2+3,ey); }
    }
    R(g,C.pk,cx-10,ey+5,3,1); R(g,C.pk,cx+7,ey+5,3,1);
    const my = ey+5;
    if (mouth==='smile') S(g,cx-2,my,['p...p','.ppp.']);
    else if (mouth==='grit') S(g,cx-2,my,['WWWWW','.....']);
    else if (mouth==='chomp') S(g,cx-3,my-1,['.nnnnn.','nWnnnWn','nnpppnn','.nnnnn.']);
    else if (mouth==='ow') S(g,cx-1,my,['p.p.','.p.p']);
    else S(g,cx-1,my,['.p.','p.p','.p.']);
    // nurse cap with the leaf-cross
    const cy0 = rn(hcy-12+(mode==='sleep'?1:0)), cx0 = cx-7+(st==='sono'?1:0);
    S(g,cx0,cy0,[
      '..oooooooooo..',
      '.oWWWWgWWWWWo.',
      'oWWWWgggWWWWLo',
      'oWWWWWgWWWWLLo',
      'oLLLLLLLLLLLLo',
      '.oooooooooooo.'
    ]);
    // antennae
    const au = antUp ? -1 : 0, ay = cy0;
    LN(g,C.ol,cx-5,ay+1,cx-9,ay-4+au); R(g,C.ol,cx-11,ay-6+au,3,3); P(g,C.rd,cx-10,ay-5+au);
    LN(g,C.ol,cx+5,ay+1,cx+9,ay-4-au); R(g,C.ol,cx+9,ay-6-au,3,3); P(g,C.rd,cx+10,ay-5-au);
    // arm + dew drop (the medicine)
    const DROP = ['..o..','.oko.','okWko','oWkbo','okkbo','.ooo.'];
    if (drop===1) { const dx = st==='atk'?46:47, dyy = 36+dropDy+(st==='atk'?rn(2*AT(p).s):0); LN(g,C.ol,44,46,dx+1,dyy+6); LN(g,C.ol,45,46,dx+2,dyy+6); S(g,dx,dyy,DROP); if (st==='idle' && fl(t*2)%3===0) P(g,C.wh,dx+1,dyy+2); }
    else { S(g,49,54,DROP); LN(g,C.ol,44,47,48,52); }
    LN(g,C.ol,20,46,17,51); LN(g,C.ol,19,46,16,51);
    // healing sparkles rising
    if (heal) { for (let i = 0; i < 3; i++) { const k = ((t*0.45)+i/3)%1, x = [14,52,46][i]+rn(sin(k*6+i)), y = rn(44-28*k); if (k<0.85) { const c = i===1?C.pk:C.lm; R(g,C.ol,x-2,y-1,5,3); R(g,C.ol,x-1,y-2,3,5); R(g,c,x-1,y,3,1); R(g,c,x,y-1,1,3); } } }
    if (lines > 0.4) { R(g,C.cr,cx-16,hcy+6,4,1); R(g,C.cr,cx+13,hcy+6,4,1); R(g,C.cr,cx-14,hcy+10,3,1); R(g,C.cr,cx+12,hcy+10,3,1); }
    OX = 0; OY = 0;
  };

  // ---------------------------------------------------------------- Formiga Carregadeira
  CS['formiga-carregadeira'] = function(g,t,st,p){
    OX = 0; OY = 0;
    let lf = fl(t*4)%2, bob = fl(t*2)%2, mode = (t%3) > 2.85 ? 'blink' : 'open', jaw = 0, hx = 0, hy = 0, tilt = 0.3, lx = 0, ly = 0, sweat = st==='idle' && (t%4) > 2.6, mouth = 'grin', snap = 0;
    if (st==='atk') {
      const a = AT(p); lf = 0; bob = 0; mode = 'angry';
      if (p < 0.35) { hx = -rn(3*a.w); hy = -rn(4*a.w); jaw = a.w>0.5?2:1; ly = -rn(3*a.w); tilt = 0.3-0.25*a.w; mouth = 'grr'; }
      else { hx = rn(4*a.s); hy = rn(2*a.s); jaw = a.s>0.5?0:1; snap = a.s; lx = rn(2*a.s); ly = rn(a.s); tilt = 0.3+0.2*a.s; mouth = 'grr'; if (a.s<0.4) mode = 'open'; }
    } else if (st==='hit') { const h = HT(p); OX = -rn(2*h); hy = -rn(h); mode = h>0.3?'squint':'open'; lx = -rn(2*h); ly = -rn(2*h); tilt = 0.3-0.3*h; mouth = 'ow'; }
    else if (st==='sono') { lf = 0; bob = 0; hy = 3+rn(0.5+0.5*sin(t*1.2)); mode = 'sleep'; mouth = 'zz'; ly = 6; lx = -2; tilt = 0.05; }
    else if (st==='entra') { const k = sm(p/0.6); OX = -rn(30*(1-k)); lf = fl(p*16)%2; mode = 'open'; ly = -rn(4*sin(Math.min(1,p)*PI)); }
    // far legs (shadowed)
    const LA = [[[36,48],[41,53],[43,60]],[[32,49],[32,55],[30,60]],[[27,48],[23,54],[19,60]]];
    const LB = [[[36,48],[39,54],[39,60]],[[32,49],[34,55],[34,60]],[[27,48],[25,54],[23,60]]];
    const legs = (set,c,dx)=>{ for (const l of set) { LN(g,c,l[0][0]+dx,l[0][1],l[1][0]+dx,l[1][1]); LN(g,c,l[1][0]+dx,l[1][1],l[2][0]+dx,l[2][1]); } };
    legs(lf?LB:LA,C.sd,3);
    // body: gaster, petiole, thorax, big head
    const H = [45+hx,40+hy];
    const ant = any(rE(17,44,8.4,6.6,-0.15), eF(26.5,46,2.5,2.1), eF(32.5,45.5,6,4.3), eF(H[0],H[1],8,7.4));
    body(g,ant,[6,30,56,54],C.rd,C.wn,null,C.ol,2);
    F(g,C.or,6,30,56,54,(x,y)=>ant(x,y)&&!ant(x-1,y-1)&&!ant(x,y-2));
    R(g,C.wn,14,40,1,9); R(g,C.wn,19,39,1,10);
    S(g,11,39,['.WW','WW.','W..']); S(g,H[0]-5,H[1]-6,['WW','W.']);
    S(g,30,42,['o.o.o','.o.o.']);
    // near legs
    legs(lf?LA:LB,C.ol,0); for (const l of (lf?LA:LB)) R(g,C.ol,l[2][0]-1,l[2][1],3,1);
    // mandibles
    const jx = H[0]+7, jy = H[1]+3;
    if (jaw===0) S(g,jx,jy,['oo..','.ooo','..oo']);
    else if (jaw===1) S(g,jx,jy-2,['.oo.','o.oo','....','o.oo','.oo.']);
    else S(g,jx,jy-4,['..oo.','.o.oo','o....','.....','o....','.o.oo','..oo.']);
    if (snap > 0.5) { R(g,C.wh,jx+5,jy-3,1,2); R(g,C.wh,jx+6,jy,3,1); R(g,C.wh,jx+5,jy+3,1,2); }
    // face
    const ex = H[0]+1, ey = H[1]-4;
    eyes(g,[ex],ey,4,5,mode);
    if (mode==='open'||mode==='angry'||mode==='wide') R(g,C.ol,ex-1,ey-1,6,1);
    R(g,C.pk,ex-1,ey+6,3,1);
    if (mouth==='grin') S(g,ex+3,ey+6,['o.','.o','o.']);
    else if (mouth==='grr') S(g,ex+2,ey+6,['ooo','WWo']);
    else if (mouth==='ow') S(g,ex+3,ey+6,['.o','o.']);
    else S(g,ex+3,ey+6,['oo']);
    // antennae
    const at = st==='idle' ? fl(t*3)%2 : 0;
    LN(g,C.ol,H[0]+1,H[1]-7,H[0]+3,H[1]-12); LN(g,C.ol,H[0]+3,H[1]-12,H[0]+9,H[1]-13-at); R(g,C.ol,H[0]+9,H[1]-14-at,2,2);
    LN(g,C.ol,H[0]+4,H[1]-6,H[0]+7,H[1]-9); LN(g,C.ol,H[0]+7,H[1]-9,H[0]+13,H[1]-8+at); R(g,C.ol,H[0]+13,H[1]-9+at,2,2);
    // the leaf: bigger than the ant, held high (front leg raised to the stalk)
    const LX = 31+lx, LY = 20+bob+ly;
    const lfF = (x,y)=>rE(LX,LY,18,10.5,tilt)(x,y) && !inE(x,y,LX-14,LY-9,4.5,4.2) && !inE(x,y,LX-7,LY-12,3.2,3.2);
    const sx0 = rn(LX+cos(tilt)*15), sy0 = rn(LY+sin(tilt)*15);
    LN(g,C.ol,sx0-1,sy0,H[0]-3,H[1]-6); LN(g,C.gd,sx0,sy0,H[0]-2,H[1]-6);
    body(g,lfF,[LX-20,LY-16,LX+20,LY+16],C.gr,C.gd,C.lm,C.ol,2);
    const ve = rot([-15,0, 15,0],tilt,LX,LY); LN(g,C.gd,ve[0],ve[1],ve[2],ve[3]);
    for (const v of [[-9,0,-6,-6],[-9,0,-12,5],[-1,0,2,-8],[-1,0,-4,7],[7,0,10,-6],[7,0,4,7]]) { const q = rot(v,tilt,LX,LY); LN(g,C.gd,q[0],q[1],q[2],q[3]); }
    // front leg holding it up
    LN(g,C.ol,38,44,37,36+ly); LN(g,C.ol,37,36+ly,sx0-2,sy0+1); LN(g,C.ol,38,44,38,36+ly);
    if (sweat) { const k = fl((t%4-2.6)*4); S(g,H[0]-9,H[1]-9+Math.min(k,3),['.o.','oko','oWo','.o.']); }
    if (st==='entra' && p < 0.8) { R(g,C.cr,2,56,4,1); R(g,C.cr,4,52,3,1); }
    OX = 0; OY = 0;
  };

  // ---------------------------------------------------------------- Louva-a-Deus
  CS['louva-a-deus'] = function(g,t,st,p){
    OX = 0; OY = 0;
    let sw = rn(sin(t*1.5)), tl = (t%2.4) > 1.2 ? 1 : 0, look = [0,0,1,1,0,-1][fl(t*1.3)%6], an = rn(sin(t*2.5)*1.5), eyeM = 'open', arm = 'pray', ak = 0, slash = 0, neckL = 1, bow = 0;
    if (st==='atk') {
      const a = AT(p); look = 0;
      if (p < 0.35) { arm = 'raise'; ak = a.w; sw = -rn(2*a.w); tl = 0; eyeM = 'focus'; }
      else { arm = a.s>0.35?'strike':'pray'; ak = a.s; sw = rn(2*a.s); tl = 1; slash = a.s; eyeM = a.s>0.4?'focus':'open'; }
    } else if (st==='hit') { const h = HT(p); sw = -rn(3*h); tl = 0; eyeM = h>0.3?'squint':'open'; an = 3; OY = -rn(h); }
    else if (st==='sono') { sw = 0; bow = 3+rn(0.5+0.5*sin(t*1.1)); eyeM = 'sleep'; arm = 'tuck'; an = 3; look = 0; }
    else if (st==='entra') { const k = sm(p/0.8); neckL = 0.4+0.6*back(p/0.8); arm = p<0.85?'raise':'pray'; ak = 1-k*0.6; eyeM = 'open'; }
    const hx = sw+tl, hy = rn(bow + (1-neckL)*12);
    // far legs
    LN(g,C.gd,34,50,30,55); LN(g,C.gd,30,55,30,60);
    LN(g,C.gd,40,52,47,55); LN(g,C.gd,47,55,50,60);
    // abdomen + folded wings
    const abF = bladeF(30,47,0.42,26,5);
    body(g,abF,[26,40,58,62],C.lm,C.gr,null,C.ol,2);
    const wg = bladeF(31,45.5,0.36,23,3.4);
    F(g,C.gr,26,40,58,60,wg);
    F(g,C.gd,26,40,58,60,(x,y)=>wg(x,y)&&!wg(x,y+1));
    LN(g,C.lm,34,46,49,52);
    // near legs
    LN(g,C.ol,32,50,26,55); LN(g,C.ol,26,55,25,60); LN(g,C.gr,32,49,27,54);
    LN(g,C.ol,38,52,43,56); LN(g,C.ol,43,56,43,60); LN(g,C.gr,38,51,42,55);
    R(g,C.ol,24,60,3,1); R(g,C.ol,42,60,3,1);
    // long neck
    const nx = 29+hx, ny = 27+hy;
    const nk = tubeF([31,48, 30.5,39, nx+0.5,ny+0.5],1.7);
    body(g,nk,[24,ny-3,37,52],C.lm,C.gr,null,C.ol,1);
    // raptorial forelegs
    const sx = rn((31+nx)/2-1), sy = rn((48+ny)/2+1);
    const leg = (dx,dy,c1,c2,near)=>{
      let el, kn, cl;
      if (arm==='raise') { el = [sx-7-3*ak,sy-2-6*ak]; kn = [sx-11-2*ak,sy-12-6*ak]; cl = [sx-15-3*ak,sy-6-9*ak]; }
      else if (arm==='strike') { el = [sx-7,sy+1]; kn = [sx-15-2*ak,sy+3]; cl = [sx-21-2*ak,sy+9]; }
      else if (arm==='tuck') { el = [sx-4,sy+4]; kn = [sx-6,sy-4]; cl = [sx-6,sy+3]; }
      else { const b = st==='idle' ? rn(0.6+0.6*sin(t*2.1)) : 0; el = [sx-5,sy+5]; kn = [sx-8,sy-7-b]; cl = [sx-10,sy+1-b]; }
      const P2 = a=>[a[0]+dx,a[1]+dy];
      const s0 = P2([sx,sy]), e = P2(el), k = P2(kn), c = P2(cl);
      const fm = any(tubeF([s0[0],s0[1], e[0],e[1]],1.2), tubeF([e[0],e[1], k[0],k[1]],1.6));
      const tb = tubeF([k[0],k[1], c[0],c[1]],0.9);
      const f = any(fm,tb);
      const b = [Math.min(s0[0],e[0],k[0],c[0])-3,Math.min(s0[1],e[1],k[1],c[1])-3,Math.max(s0[0],e[0],k[0],c[0])+3,Math.max(s0[1],e[1],k[1],c[1])+3];
      F(g,C.ol,b[0],b[1],b[2],b[3],dil(f));
      F(g,c1,b[0],b[1],b[2],b[3],f);
      F(g,c2,b[0],b[1],b[2],b[3],(x,y)=>fm(x,y)&&!fm(x+1,y));
      // spines along the femur + claw hook
      for (let i = 1; i <= 3; i++) { const q = [rn(e[0]+(k[0]-e[0])*i/4)+1, rn(e[1]+(k[1]-e[1])*i/4)]; P(g,near?C.cr:C.gd,q[0]+1,q[1]); }
      R(g,C.ol,rn(c[0])-1,rn(c[1]),3,1); P(g,C.ol,rn(c[0])-1,rn(c[1])-1);
    };
    leg(5,-2,C.gr,C.gd,0);
    leg(0,0,C.lm,C.gr,1);
    // triangular head, eyes at the corners, tilting
    const hX = hx, hY = hy;
    const hd = any(pF([21+hX,15+hY, 39+hX,15+hY, 30+hX,29+hY]), eF(22.5+hX,16+hY,3.8,4.3), eF(37.5+hX,16+hY,3.8,4.3));
    body(g,hd,[16,9+hY,44,31+hY],C.lm,C.gr,null,C.ol,1);
    for (const ex of [20+hX,35+hX]) {
      const ey = 13+hY;
      R(g,C.yl,ex,ey,5,6); R(g,C.ol,ex,ey+5,5,1); P(g,C.cr,ex+3,ey);
      if (eyeM==='sleep') { R(g,C.gr,ex,ey,5,3); R(g,C.ol,ex,ey+3,5,1); }
      else if (eyeM==='squint') { R(g,C.gr,ex,ey,5,2); R(g,C.ol,ex,ey+2,5,1); R(g,C.ol,ex+1,ey+3,3,1); }
      else { const px = ex+1+look+(eyeM==='focus'?(ex<30+hX?1:0):0), py = ey+2; R(g,C.ol,px,py,eyeM==='focus'?2:3,eyeM==='focus'?3:3); P(g,C.wh,px,py); if (eyeM==='focus') R(g,C.gr,ex,ey,5,1); }
    }
    R(g,C.gr,28+hX,17+hY,4,1); R(g,C.pk,26+hX,21+hY,2,1); R(g,C.pk,33+hX,21+hY,2,1);
    if (st==='atk' && p>=0.35 && slash>0.4) S(g,29+hX,23+hY,['oooo','onpo','.oo.']);
    else S(g,29+hX,23+hY,['o..o','.oo.']);
    // antennae (sway)
    LN(g,C.ol,28+hX,13+hY,24+an,4+hY); LN(g,C.ol,24+an,4+hY,21+an,2+hY);
    LN(g,C.ol,32+hX,13+hY,37+an,4+hY); LN(g,C.ol,37+an,4+hY,41+an,3+hY);
    // slash marks of the snapping claws
    if (slash > 0.3) { for (let j = 0; j < 2; j++) for (let i = 0; i < 7; i++) { const a = -0.5+i*0.32; R(g,i%2?C.cr:C.wh,rn(7+j*5+cos(a)*6),rn(36+j*4+sin(a)*8),2,1); } }
    OX = 0; OY = 0;
  };

  // ---------------------------------------------------------------- Pé de Maracujá
  CS['pe-de-maracuja'] = function(g,t,st,p){
    OX = 0; OY = 0;
    let sway = sin(t*1.4), cu = fl(t*2)%2, fk = (t%2.6) > 2.2, mode = (t%3.5) > 3.35 ? 'blink' : 'open', mouth = 'smile', whip = null, droop = 0, closed = 0, fdy = rn(sin(t*2.8+1)), shake = 0;
    if (st==='atk') {
      const a = AT(p);
      if (p < 0.35) whip = {a0:-2.1-0.6*a.w, c:-0.32, k:a.w}; else whip = {a0:-0.35+0.25*(1-a.s), c:0.05+0.3*(1-a.s), k:a.s};
      mode = (p<0.35||a.s>0.5)?'angry':'open'; mouth = (p>=0.35&&a.s>0.5)?'shout':'grit'; sway = p<0.35?-0.6*a.w:0.8*a.s;
    } else if (st==='hit') { const h = HT(p); shake = rn(sin(p*PI*7)*2*h); mode = h>0.3?'squint':'open'; mouth = h>0.3?'ow':'smile'; sway = -0.8*h; }
    else if (st==='sono') { droop = 1; closed = 1; mode = 'sleep'; mouth = 'zz'; sway = 0.2*sin(t*0.8); fdy = rn(0.5+0.5*sin(t*1.2)); }
    else if (st==='entra') { OY = rn(46*(1-sm(p/0.8))); sway = sin(p*PI*3)*(1-p); mode = p<0.85?'wide':'open'; }
    // soil mound (stays put while the plant rises out of it)
    const oy0 = OY; OY = 0;
    E2(g,32,59,10,2.6);
    OY = oy0; OX = shake;
    const sx = y=>31 + rn(2.4*sin((y-2)/4.6) + sway*(58-y)/26);
    // stem as column runs
    for (let y = 8; y <= 58;) { const x = sx(y); let y2 = y+1; while (y2 <= 58 && sx(y2) === x) y2++; R(g,C.ol,x-1,y,4,y2-y); R(g,C.gd,x,y,2,y2-y); R(g,C.gr,x,y,1,y2-y); if (y > 8) { const xp = sx(y-1); if (xp !== x) R(g,C.ol,Math.min(x,xp)-1,y,1,1); } y = y2; }
    R(g,C.ol,sx(8)-1,7,4,1);
    // leaves
    const dr = droop*0.6;
    const LV = [[sx(47)+3,47,0.25+dr*0.6+0.08*sway,13],[sx(52)-1,52,2.9-dr*0.6,11],[sx(29)+3,29,-0.2+dr,10],[sx(26)-1,26,3.35-dr,9],[sx(11)+2,11,-0.5+dr,9]];
    const lf = any(...LV.map(l=>bladeF(l[0],l[1],l[2],l[3],3.4)));
    body(g,lf,[4,0,60,60],C.gr,C.gd,C.lm,C.ol,2);
    for (const l of LV) LN(g,C.gd,l[0],l[1],rn(l[0]+cos(l[2])*l[3]*0.75),rn(l[1]+sin(l[2])*l[3]*0.75));
    // tendrils
    const CURL = [['.ll.','l..l','l..l','l.l.','.l..'],['.ll.','l..l','l.ll','l...','.l..']];
    const curl = (x,y,d,k)=>S(g,d>0?x:x-3,y,CURL[k?1:0],d<0);
    if (!whip) { curl(52,36,1,cu); LN(g,C.lm,sx(37)+2,37,52,39); }
    curl(11,36,-1,1-cu); LN(g,C.lm,sx(38)-1,38,12,40);
    curl(25,3,-1,cu); LN(g,C.lm,sx(8),8,25,7);
    // the whip: a tendril lashing out
    if (whip) {
      const pts = []; let x = sx(37)+2, y = 37, a = whip.a0;
      pts.push(x,y);
      for (let i = 0; i < 6; i++) { x += cos(a)*5.2; y += sin(a)*5.2; a += whip.c; pts.push(x,y); }
      const f = tubeF(pts,1.1), b = box(pts);
      body(g,f,b,C.lm,C.gr,null,C.ol,1);
      const ex = pts[pts.length-2], ey = pts[pts.length-1];
      curl(rn(ex),rn(ey)-2,cos(a)>0?1:-1,0);
      if (p >= 0.35 && whip.k > 0.4) { for (let i = 0; i < 6; i++) { R(g,i%2?C.cr:C.wh,rn(ex-4-i*4),rn(ey-6+i*0.6),3,1); } spark(g,C.wh,ex+1,ey,true); }
    }
    // passion flower (closes asleep)
    const fx0 = 44.5+rn(sway*1.2), fy0 = 16.5;
    LN(g,C.gd,sx(18)+2,18,rn(fx0)-3,rn(fy0)+3);
    const pets = [], rot0 = st==='idle' ? t*0.15 : 0;
    const pl = closed ? 4.5 : 9;
    for (let k = 0; k < 10; k++) { const fl8 = fk&&k===8&&!closed; pets.push(bladeF(fx0,fy0,k*0.6283+0.31+rot0+(fl8?0.3:0)-(closed?PI/2+0.3:0)*0,fl8?pl+1.6:pl,closed?1.6:2.1)); }
    const pf = any(...pets);
    body(g,pf,[fx0-12,fy0-12,fx0+12,fy0+12],C.wh,C.lg,null,C.ol,1);
    if (!closed) {
      const dd = (x,y)=>{ const dx=x+0.5-fx0, dy=y+0.5-fy0; return dx*dx+dy*dy; };
      F(g,C.pu,fx0-7,fy0-7,fx0+7,fy0+7,(x,y)=>dd(x,y)<=5.4*5.4);
      F(g,C.li,fx0-7,fy0-7,fx0+7,fy0+7,(x,y)=>{ const d=dd(x,y); if (d>5.4*5.4||d<2.4*2.4) return false; return fl((Math.atan2(y+0.5-fy0,x+0.5-fx0)+PI+rot0)/(PI/6))%2===0; });
      R(g,C.yl,rn(fx0)-2,rn(fy0)-2,4,4); R(g,C.gr,rn(fx0)-1,rn(fy0)-1,2,2); P(g,C.cr,rn(fx0)-2,rn(fy0)-2);
    } else { R(g,C.pu,rn(fx0)-1,rn(fy0)-1,3,3); }
    // fruits
    const fruit = (cx,cy,r)=>{
      const f = eF(cx,cy,r,r);
      F(g,C.ol,cx-r-2,cy-r-2,cx+r+2,cy+r+2,dil(f));
      F(g,C.pu,cx-r-1,cy-r-1,cx+r+1,cy+r+1,f);
      F(g,C.wn,cx-r-1,cy-r-1,cx+r+1,cy+r+1,(x,y)=>f(x,y)&&!f(x+2,y+2));
      F(g,C.li,cx-r-1,cy-r-1,cx+r+1,cy+r+1,(x,y)=>f(x,y)&&!f(x-1,y-1)&&y<cy&&x<cx);
    };
    const sf = [19+rn(sway*1.5),19+rn(sin(t*2.2+2)*0.6)];
    LN(g,C.gd,sx(16)-1,16,sf[0]+1,sf[1]-4);
    fruit(sf[0],sf[1],4.6);
    S(g,sf[0]-3,sf[1]-6,['g.l.g','.ggg.']); P(g,C.wh,sf[0]-2,sf[1]-2);
    const bx0 = 22+rn(sway*0.8), by0 = 40+fdy;
    LN(g,C.gd,sx(30)-1,30,bx0+1,by0-9);
    fruit(bx0,by0,9.4);
    S(g,bx0-3,by0-11,['g..l..g','.ggggg.','..ggg..']);
    S(g,bx0-7,by0-7,['.iii','ii..','i...']); P(g,C.wh,bx0-6,by0-7); P(g,C.wh,bx0-7,by0-6);
    const ey = by0-3;
    eyes(g,[bx0-6,bx0+2],ey,3,4,mode);
    R(g,C.pk,bx0-9,ey+5,3,1); R(g,C.pk,bx0+6,ey+5,3,1);
    const my = ey+5;
    if (mouth==='smile') S(g,bx0-3,my,['o...o','.ooo.','..r..']);
    else if (mouth==='grit') S(g,bx0-3,my,['ooooo','oWWWo','ooooo']);
    else if (mouth==='shout') S(g,bx0-3,my,['.ooo.','onnno','onpno','.ooo.']);
    else if (mouth==='ow') S(g,bx0-2,my,['.o.o','o.o.']);
    else S(g,bx0-1,my,['.o.','o.o','.o.']);
    if (st==='entra' && p > 0.6 && p < 0.95) { spark(g,C.lm,14,48); spark(g,C.cr,50,44); spark(g,C.lm,40,30); }
    OX = 0; OY = 0;
  };
  function E2(g,cx,cy,rx,ry){ const f = eF(cx,cy,rx,ry); F(g,C.ol,cx-rx-2,cy-ry-2,cx+rx+2,cy+ry+2,dil(f)); F(g,C.wd,cx-rx-1,cy-ry-1,cx+rx+1,cy+ry+1,f); F(g,C.wo,cx-rx-1,cy-ry-1,cx+rx+1,cy+ry+1,(x,y)=>f(x,y)&&!f(x,y-1)); }
})();
