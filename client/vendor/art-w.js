(function(){
  // Personagens do tabuleiro (W): gato, caramelo, sanfoneiro, boi-bumba, guardia, macieira, colmeia, moinho, trator
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
  const K = {o:C.ol,s:C.sd,d:C.wd,w:C.wo,t:C.st,c:C.cr,W:C.wh,y:C.yl,O:C.or,r:C.rd,n:C.wn,p:C.pk,G:C.gd,g:C.gr,l:C.lm,T:C.td,q:C.tq,b:C.bl,k:C.sk,u:C.pu,i:C.li,Y:C.gy,L:C.lg,N:C.nt};

  // ---------------------------------------------------------------- helpers (64x64, transparent)
  const W = 64, H = 64, fl = Math.floor, PI = Math.PI, sin = Math.sin, cos = Math.cos, ri = Math.round;
  let OX = 0, OY = 0, CY0 = 0, CY1 = 64;   // whole-part offset + vertical clip (for sprouting)
  function R(g,c,x,y,w,h){
    x = fl(x)+OX; y = fl(y)+OY; w = fl(w); h = fl(h);
    if (x < 0) { w += x; x = 0; } if (y < CY0) { h -= CY0-y; y = CY0; }
    if (x + w > W) w = W - x; if (y + h > CY1) h = CY1 - y;
    if (w > 0 && h > 0 && c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  }
  const P = (g,c,x,y)=>R(g,c,x,y,1,1);
  const hs = (x,y)=>(((x*73856093)^(y*19349663))>>>0);
  function F(g,c,x0,y0,x1,y1,f){
    x0 = Math.max(-OX, fl(x0)); y0 = Math.max(CY0-OY, fl(y0));
    x1 = Math.min(W-1-OX, Math.ceil(x1)); y1 = Math.min(CY1-1-OY, Math.ceil(y1));
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
  // cache a predicate over a box (fast lookups for shapes tested many times)
  function MK(f,x0,y0,x1,y1){
    const w = x1-x0+1, h = y1-y0+1, m = new Uint8Array(w*h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (f(x+x0,y+y0)) m[y*w+x] = 1;
    return (x,y)=>{ x -= x0; y -= y0; return x>=0 && y>=0 && x<w && y<h && m[y*w+x]===1; };
  }
  function body(g,f,bx,base,shadow,light,o,sh){
    sh = sh||2;
    if (o) F(g,o,bx[0]-1,bx[1]-1,bx[2]+1,bx[3]+1,dil(f));
    F(g,base,bx[0],bx[1],bx[2],bx[3],f);
    if (shadow) F(g,shadow,bx[0],bx[1],bx[2],bx[3],(x,y)=>f(x,y)&&!f(x+sh,y+sh));
    if (light) F(g,light,bx[0],bx[1],bx[2],bx[3],(x,y)=>f(x,y)&&!f(x-1,y-1));
  }
  function LN(g,c,x0,y0,x1,y1,w){
    w = w||1; const dx=x1-x0, dy=y1-y0, n=Math.max(Math.abs(dx),Math.abs(dy))||1;
    for (let i = 0; i <= n; i++) R(g,c,ri(x0+dx*i/n),ri(y0+dy*i/n),w,w);
  }
  function S(g,x,y,rows,flip){
    x = ri(x); y = ri(y);
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
  const spark = (g,c,x,y,big)=>{ x = ri(x); y = ri(y); if (big) { R(g,c,x-2,y,5,1); R(g,c,x,y-2,1,5); P(g,C.wh,x,y); } else { R(g,c,x-1,y,3,1); R(g,c,x,y-1,1,3); } };
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
  function bezF(x0,y0,x1,y1,x2,y2,w0,w1,n){
    n = n||22; const Q = [];
    for (let i = 0; i <= n; i++) { const u=i/n, a=(1-u)*(1-u), b=2*u*(1-u), c=u*u; const w=w0+(w1-w0)*u; Q.push([a*x0+b*x1+c*x2, a*y0+b*y1+c*y2, w*w]); }
    return (x,y)=>{ const px=x+0.5, py=y+0.5; for (const s of Q) { const dx=px-s[0], dy=py-s[1]; if (dx*dx+dy*dy<=s[2]) return true; } return false; };
  }
  const note = (g,c,x,y)=>{ x = ri(x); y = ri(y); R(g,c,x+1,y,2,1); R(g,c,x+1,y+1,1,2); R(g,c,x,y+2,2,2); P(g,c,x+2,y+1); };
  function wave(g,c,x0,x1,yf){
    let s = x0, cy = ri(yf(x0));
    for (let x = x0+1; x <= x1+1; x++) { const y = x<=x1 ? ri(yf(x)) : -99; if (y !== cy) { R(g,c,s,cy,x-s,1); s = x; cy = y; } }
  }
  function at(dx,dy,fn){ const a = OX, b = OY; OX += ri(dx); OY += ri(dy); fn(); OX = a; OY = b; }
  // animation envelopes
  const cl = v=>v<0?0:v>1?1:v, sm = v=>{ v = cl(v); return v*v*(3-2*v); }, lerp = (a,b,u)=>a+(b-a)*u;
  // attack: [wind 0..1 peaking at .35, strike 0..1 held .42-.58 then easing out]
  function AT(p){
    const w = p<0.35 ? sm(p/0.35) : p<0.42 ? 1-(p-0.35)/0.07 : 0;
    const s = p<0.35 ? 0 : p<0.42 ? (p-0.35)/0.07 : p<0.58 ? 1 : 1-sm((p-0.58)/0.42);
    return [w,s];
  }
  const HK = p=>p<0.15 ? p/0.15 : 1-sm((p-0.15)/0.85);
  const blink = (t,per,off)=>((t+(off||0))%per) > per-0.16;
  // little bee (5x3), wings flicker
  function bee(g,x,y,f,flip){ S(g,x,y-1,[f?'..WW..':'.W..W.',f?'..WW..':'.LW.WL'.slice(0,6),'oyoyyo','oyoyyo','.oooo.'],flip); }
  // soft puff (smoke / dust)
  function puff(g,c,x,y,r){ if (r < 1.2) { R(g,c,ri(x),ri(y),1,1); return; } E(g,c,x,y,r,r*0.85); }

  function reg(id,fn){
    CS[id] = function(g,t,st,p){
      OX = 0; OY = 0; CY0 = 0; CY1 = 64;
      t = +t || 0; p = +p; if (!(p >= 0)) p = 0; if (p > 1) p = 1;
      if (st!=='atk' && st!=='hit' && st!=='sono' && st!=='entra') st = 'idle';
      try { fn(g,t,st,p); } finally { OX = 0; OY = 0; CY0 = 0; CY1 = 64; }
    };
  }

  // ================================================================ GATO DO CELEIRO
  // orange tabby, lime narrowed eyes, cream muzzle/chest/paws; attack: claw swipe
  reg('gato-do-celeiro', function(g,t,st,p){
    let dx = 0, dy = 0, hx = 0, hy = 0, br = 0, eyes = 'open', tsw = 0, tUp = 0, paw = 0, mouth = 0, ear = 0, fur = 0, wrap = 0, slash = 0;
    if (st === 'idle') {
      br = sin(t*2.4) > 0 ? 1 : 0; tsw = sin(t*1.7)*3;
      if (blink(t,3.6)) eyes = 'closed';
      if ((t%5.3) > 4.95) ear = 1;
      hx = sin(t*0.8) > 0.6 ? -1 : 0;
    } else if (st === 'atk') {
      const [w,s] = AT(p);
      tUp = 1; tsw = -1;
      if (p < 0.38) { paw = p > 0.06 ? 1 : 0; hy = ri(w); ear = w > 0.5 ? 2 : 0; eyes = 'wide'; }
      else if (p < 0.62) { paw = 2; slash = p < 0.56 ? 1 : 0; mouth = 1; dx = -1; hx = -1; eyes = 'wide'; ear = 2; }
      else if (p < 0.85) { paw = 3; eyes = 'open'; }
      void s;
    } else if (st === 'hit') {
      const k = HK(p);
      dx = ri(2*k); hy = -ri(k); eyes = k > 0.25 ? 'squint' : 'open'; fur = k > 0.3 ? 1 : 0; mouth = k > 0.45 ? 1 : 0; ear = 2; tUp = 1;
    } else if (st === 'sono') {
      eyes = 'closed'; hy = 2; br = sin(t*1.3) > 0 ? 1 : 0; wrap = 1;
    } else if (st === 'entra') {
      if (p < 0.6) { dy = -ri(sin(p/0.6*PI)*7); tUp = 1; eyes = 'wide'; ear = 0; }
      else if (p < 0.75) { hy = 1; eyes = 'open'; }
      tsw = 2;
    }
    OX = dx; OY = dy;
    // tail (behind)
    const bd = any(eF(34,52.5,10,6.5), eF(31,45.5-br,7.5,8.5+br));
    if (!wrap) {
      const tl = tUp ? bezF(40,55, 49,50, 46+tsw,30, fur?2.8:2.1, fur?2.4:1.5) : bezF(40,55, 52,52, 48+tsw,33, fur?2.8:2.1, fur?2.4:1.5);
      F(g,C.ol,36,26,58,58,dil(tl)); F(g,C.or,36,26,58,58,tl);
      F(g,C.wo,36,26,58,58,(x,y)=>tl(x,y)&&(y%4===0));
      F(g,C.wo,36,26,58,58,(x,y)=>tl(x,y)&&!tl(x,y-1)&&y<40);
    }
    if (fur) { const d1 = dil(bd), d2 = dil(d1); F(g,C.ol,18,32,48,59,(x,y)=>d2(x,y)&&!d1(x,y)&&((x+y)%3===0)&&y<57); }
    body(g,bd,[20,34,46,59],C.or,C.wo,C.st,C.ol,2);
    R(g,C.wo,36,47,1,2); R(g,C.wo,39,48,1,3); R(g,C.wo,42,50,1,3);
    F(g,C.cr,22,36,38,58,(x,y)=>bd(x,y)&&inE(x,y,29.5,47.5,4.6,7.5));
    // front legs
    const leg = x=>{ R(g,C.ol,x,50,1,10); R(g,C.ol,x+5,50,1,10); R(g,C.ol,x,59,6,1); R(g,C.or,x+1,49,4,7); R(g,C.cr,x+1,56,4,3); P(g,C.st,x+2,58); P(g,C.st,x+3,58); P(g,C.wo,x+1,49); };
    if (paw === 0) leg(24);
    leg(29);
    if (paw) {
      const L = paw===1 ? [27,48, 23,42, 21,37] : paw===2 ? [27,48, 20,49.5, 15,50.5] : [27,48, 23,47, 19,45.5];
      const pp = paw===1 ? [20.5,35.5] : paw===2 ? [13.5,50.5] : [18.5,45.5];
      const lf = tubeF(L,2), pf = eF(pp[0],pp[1],2.6,2.4);
      F(g,C.ol,8,30,32,56,dil(any(lf,pf))); F(g,C.or,8,30,32,56,lf); F(g,C.cr,8,30,32,56,pf);
      if (paw === 1) { P(g,C.wh,18,33); P(g,C.wh,20,32); P(g,C.wh,22,33); }
      if (paw === 2) { P(g,C.wh,10,49); P(g,C.wh,10,51); P(g,C.wh,11,53); }
      if (slash) for (let k = 0; k < 3; k++) { LN(g,C.wh,9+k*3,34+k,3+k*3,46+k); LN(g,C.cr,10+k*3,34+k,9+k*3,36+k); }
    }
    if (wrap) {
      const tl = tubeF([42,55.5, 37,57, 27,57, 21.5,55],1.6);
      F(g,C.ol,18,52,46,59,dil(tl)); F(g,C.or,18,52,46,59,tl);
      F(g,C.wo,18,52,46,59,(x,y)=>tl(x,y)&&(x%4===0));
      F(g,C.wo,18,52,46,59,(x,y)=>tl(x,y)&&x<24);
    }
    // head
    at(hx,hy,()=>{
      let L = [22.5,21.5], Rr = [37.5,21.5];
      if (ear === 1) Rr = [40,23.5];
      if (ear === 2) { L = [18.5,26.5]; Rr = [41.5,26.5]; }
      const hd = any(eF(30,32,9.2,7), pF([21,31, L[0],L[1], 28.5,26]), pF([31.5,26, Rr[0],Rr[1], 39,31]));
      body(g,hd,[16,17,44,40],C.or,C.wo,C.st,C.ol,2);
      if (ear !== 2) { P(g,C.pk,23,23); P(g,C.pk,23,24); P(g,C.pk,24,25); }
      if (ear === 0) { P(g,C.pk,37,23); P(g,C.pk,37,24); P(g,C.pk,36,25); }
      R(g,C.wo,28,26,1,2); R(g,C.wo,30,25,1,3); R(g,C.wo,32,26,1,2);
      F(g,C.cr,24,32,36,39,eF(29.8,35.8,4.4,2.6));
      // eyes
      const ey = (x,right)=>{
        if (eyes === 'closed') { R(g,C.ol,x,31,3,1); P(g,C.ol,right?x+3:x-1,30); }
        else if (eyes === 'wide') { S(g,x,29,['ooo','lol','lol']); P(g,C.wh,x,30); }
        else if (eyes === 'squint') S(g,x,29,right?['..o','oo.','..o']:['o..','.oo','o..']);
        else { S(g,x,30,['ooo','lol']); P(g,C.wh,x,31); }
      };
      ey(25,0); ey(32,1);
      R(g,C.pk,29,34,2,1);
      if (mouth) S(g,27,35,['o....o','.oWWo.','.onno.','..oo..']);
      else S(g,28,35,['o..o','.oo.']);
      LN(g,C.lg,24,36,19,35); LN(g,C.lg,24,37,19,39); LN(g,C.lg,35,36,40,35); LN(g,C.lg,35,37,40,39);
    });
  });

  // ================================================================ VIRA-LATA CARAMELO
  // caramel mutt with red polka-dot bandana, tongue out; attack: lunging bite
  reg('vira-lata-caramelo', function(g,t,st,p){
    let dx = 0, dy = 0, hx = 0, hy = 0, wg = fl(t/0.2)%2, tail = 'wag', pant = fl(t*3)%2, ears = 'norm', eyes = 'open', mouth = 'tongue', br = 0;
    if (st === 'idle') {
      if ((t%2.6) > 2.3) ears = 'twitch';
      if (blink(t,3.1,0.7)) eyes = 'closed';
      br = sin(t*3) > 0.2 ? 1 : 0;
    } else if (st === 'atk') {
      const [w,s] = AT(p);
      tail = 'up'; hy = ri(-2*w + 2*s); hx = ri(-s);
      if (p < 0.38) { ears = 'perk'; mouth = w > 0.6 ? 'snarl' : 'closed'; eyes = 'wide'; }
      else if (p < 0.6) { mouth = 'bite'; eyes = 'angry'; ears = 'back'; }
      else { mouth = 'closed'; }
    } else if (st === 'hit') {
      const k = HK(p);
      dx = ri(2*k); hy = -ri(k); tail = 'tuck'; ears = k > 0.3 ? 'perk' : 'norm'; eyes = k > 0.25 ? 'squint' : 'open'; mouth = k > 0.3 ? 'yelp' : 'closed';
    } else if (st === 'sono') {
      tail = 'rest'; hy = 2; ears = 'droop'; eyes = 'closed'; mouth = 'closed'; br = sin(t*1.4) > 0 ? 1 : 0;
    } else if (st === 'entra') {
      if (p < 0.65) { dy = -ri(sin(p/0.65*PI)*6); ears = 'perk'; wg = fl(t/0.1)%2; }
      eyes = p < 0.65 ? 'happy' : 'open';
    }
    OX = dx; OY = dy + 16;   // card coordinates shifted down so the paws sit on y=59
    // tail
    let tl;
    if (tail === 'wag') tl = wg ? tubeF([42,40, 47,37, 50,32],1.5) : tubeF([42,40, 48,39, 52,35],1.5);
    else if (tail === 'up') tl = tubeF([42,39, 46,34, 47,28],1.5);
    else if (tail === 'tuck') tl = tubeF([42,41, 46,42, 49,42],1.4);
    else tl = tubeF([42,41, 48,41.5, 53,41.5],1.4);
    F(g,C.ol,38,25,56,43,dil(tl)); F(g,C.or,39,26,55,42,tl); F(g,C.st,39,26,55,42,(x,y)=>tl(x,y)&&!tl(x-1,y-1));
    // haunches + body
    const bd = any(eF(32,34-br*0.5,9.5,8+br*0.5), eF(23,38.5,5.5,4.6), eF(41,38.5,5.5,4.6));
    body(g,bd,[15,24,49,42],C.or,C.wo,C.st,C.ol,2);
    S(g,17,40,['.occco','occccco','.ooooo.']); S(g,40,40,['occco.','ocwccco','.ooooo.']);
    F(g,C.cr,15,25,49,42,(x,y)=>bd(x,y)&&inE(x,y,32,31,4.6,7.5));
    for (const x of [26,35]) { R(g,C.wo,x-1,33,1,7); R(g,C.or,x,33,4,7); R(g,C.wo,x+3,33,1,7); R(g,C.st,x,33,1,5); }
    S(g,24,39,['.occco...occco.','occccco.occwcco','occccco.occccco','.ooooo...ooooo.']);
    R(g,C.ol,27,41,1,1); R(g,C.ol,29,41,1,1); R(g,C.ol,35,41,1,1); R(g,C.ol,37,41,1,1);
    // red bandana (white dots)
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
    // head
    at(hx,hy,()=>{
      const hd = any(eF(32,16.5,9,7.2), eF(32,21.5,6,4.2));
      body(g,hd,[21,8,43,27],C.or,C.wo,C.st,C.ol,2);
      R(g,C.cr,31,10,2,4);
      F(g,C.cr,21,8,43,27,(x,y)=>hd(x,y)&&inE(x,y,32,21.5,5.2,3.6));
      // eyes
      for (const ex of [27,35]) {
        const rt = ex > 30;
        if (eyes === 'closed') S(g,ex-1,15,['o..o','.oo.']);
        else if (eyes === 'happy') S(g,ex-1,14,['.oo.','o..o']);
        else if (eyes === 'squint') S(g,ex-(rt?1:0),13,rt?['..o','oo.','..o']:['o..','.oo','o..']);
        else if (eyes === 'wide') { R(g,C.ol,ex,13,2,4); P(g,C.wh,ex,13); }
        else if (eyes === 'angry') { eye(g,ex,14,2,3); S(g,ex-1,12,rt?['oo.','..o']:['.oo','o..']); }
        else eye(g,ex,14,2,3);
      }
      if (eyes !== 'angry') { R(g,C.cr,27,12,2,1); R(g,C.cr,35,12,2,1); }
      S(g,30,18,['.ooo.','oWooo','.ooo.']);
      if (mouth === 'tongue') S(g,28,21,pant?['o.....o','.ooooo.','..oppo.','...ppo.','...oo..']:['o.....o','.ooooo.','..oppo.','...oo..']);
      else if (mouth === 'bite') S(g,27,20,['o.......o','.ooooooo.','.oWnnnWo.','.onnnnno.','.oWnppWo.','..ooooo..']);
      else if (mouth === 'snarl') S(g,28,21,['o.....o','.oWoWo.','..ooo..']);
      else if (mouth === 'yelp') S(g,30,21,['.o.','ono','.o.']);
      else S(g,28,21,['o.....o','.ooooo.']);
      if (mouth === 'tongue') P(g,C.rd,32,23);
      R(g,C.pk,24,19,2,1); R(g,C.pk,38,19,2,1);
      // ears
      const EN = ['.oooo..','owwwwo.','owwwwwo','owdwwwo','owdwwo.','.odwwo.','.odwo..','..oo...'];
      const EP = ['..oooo.','.owwwwo','owwwwwo','owwwdwo','.owwdo.','..owo..','...o...'];
      const EB = ['oooo...','owwwoo.','.owwwwo','..owwdo','...oooo'];
      if (ears === 'perk') { S(g,19,8,EP,1); S(g,38,8,EP); }
      else if (ears === 'back') { S(g,17,11,EB); S(g,40,11,EB,1); }
      else if (ears === 'droop') { S(g,19,10,EN); S(g,38,10,EN,1); }
      else { S(g,19,9,EN); if (ears === 'twitch') S(g,38,8,EP); else S(g,38,9,EN,1); }
      if (ears !== 'back') { R(g,C.st,21,ears==='perk'?9:10,3,1); R(g,C.st,40,ears==='perk'||ears==='twitch'?9:10,3,1); }
    });
  });

  // ================================================================ SANFONEIRO DO FORRÓ
  // leather half-moon hat with star, big moustache, red checkered shirt, red accordion; attack: bellows blast of forró
  reg('sanfoneiro-do-forro', function(g,t,st,p){
    let Bw = 6 + ri(sin(t*3.1)*2), sx = 0, ux = 0, uy = 0, hatx = 0, haty = 0, hy = 0, eyes = 'open', mouth = 'grin', tap = 0, notes = 1, burst = 0, dx = 0, dy = 0;
    if (st === 'idle') {
      const beat = fl(t*2.5);
      sx = [0,1,0,-1][beat%4]; tap = beat%2;
      if (blink(t,3.3)) eyes = 'closed';
    } else if (st === 'atk') {
      const [w,s] = AT(p);
      notes = 0;
      if (p < 0.38) { Bw = ri(lerp(6,1,w)); uy = ri(w); eyes = 'happy'; mouth = 'grin'; }
      else { Bw = ri(lerp(6,11,s)); haty = -ri(2*s); mouth = s > 0.5 ? 'sing' : 'grin'; eyes = s > 0.5 ? 'happy' : 'open'; burst = s; }
    } else if (st === 'hit') {
      const k = HK(p);
      Bw = ri(lerp(6,2,k)); hatx = ri(2*k); haty = -ri(k); dx = ri(k*1.5); eyes = k > 0.25 ? 'squint' : 'open'; mouth = k > 0.3 ? 'oh' : 'grin'; notes = 0;
    } else if (st === 'sono') {
      Bw = 5 + (sin(t*1.2) > 0 ? 1 : 0); haty = 3; hy = 1; eyes = 'closed'; mouth = 'flat'; notes = 0;
    } else if (st === 'entra') {
      if (p < 0.6) { dy = -ri(sin(p/0.6*PI)*5); Bw = 10; eyes = 'happy'; mouth = 'sing'; burst = sin(p/0.6*PI); }
      notes = p >= 0.6 ? 1 : 0;
    }
    OX = dx; OY = dy;
    // legs + boots
    const legs = ()=>{
      R(g,C.ol,24,45,7,11); R(g,C.wd,25,45,5,10); R(g,C.sd,29,46,1,9);
      R(g,C.ol,33,45,7,11); R(g,C.wd,34,45,5,10); R(g,C.sd,38,46,1,9);
      R(g,C.ol,22,55,9,5); R(g,C.sd,23,56,7,3); P(g,C.wo,24,56);
      at(0,-tap,()=>{ R(g,C.ol,33,55,9,5); R(g,C.sd,34,56,7,3); P(g,C.wo,35,56); });
    };
    legs();
    at(sx+ux,uy,()=>{
      // shirt (cream with red checks)
      const ts = pF([22,47, 23,34, 27,31, 37,31, 41,34, 42,47]);
      F(g,C.ol,20,29,44,48,dil(ts)); F(g,C.cr,21,30,43,47,ts);
      for (let y = 32; y < 47; y += 3) for (let x = 22 + (((y-32)/3)%2)*3; x < 43; x += 6) if (ts(x,y) && ts(x+2,y+2)) R(g,C.rd,x,y,3,3);
      R(g,C.ol,23,45,19,1); R(g,C.wd,23,44,19,1); R(g,C.yl,31,44,2,1);
      // neck + collar
      R(g,C.ol,28,27,8,4); R(g,C.st,29,27,6,4); R(g,C.wo,33,27,2,4);
      S(g,26,29,['oo....oo','occo.oco','.ocooco.']);
      // accordion
      const Lx = 32-Bw-9, Rx = 32+Bw;
      // sleeves to the hands
      const al = tubeF([24,35, Lx+1,39],1.6), ar = tubeF([40,35, Rx+7,39],1.6);
      F(g,C.ol,8,30,56,44,dil(any(al,ar))); F(g,C.rd,8,30,56,44,any(al,ar));
      if (Bw > 0) {
        R(g,C.ol,Lx+9,33,2*Bw,13);
        for (let x = Lx+9; x < Rx; x += 2) { R(g,C.rd,x,34,1,11); P(g,C.or,x,34); R(g,C.wn,x,43,1,2); }
      }
      R(g,C.ol,Lx,31,9,16); R(g,C.rd,Lx+1,32,7,14); R(g,C.or,Lx+1,32,7,1); R(g,C.wn,Lx+1,45,7,1); R(g,C.wn,Lx+7,33,1,12);
      R(g,C.ol,Lx+2,33,4,12); R(g,C.wh,Lx+3,33,2,12);
      for (let y = 35; y < 45; y += 2) P(g,C.ol,Lx+3,y);
      P(g,C.yl,Lx+6,33); P(g,C.yl,Lx+6,43);
      R(g,C.ol,Rx,31,8,16); R(g,C.rd,Rx+1,32,6,14); R(g,C.or,Rx+1,32,6,1); R(g,C.wn,Rx+1,45,6,1); R(g,C.wn,Rx+6,33,1,12);
      for (let y = 34; y < 44; y += 3) { P(g,C.cr,Rx+2,y); P(g,C.cr,Rx+4,y+1); }
      S(g,Lx-2,36,['.oo.','otto','otwo','.oo.']);
      S(g,Rx+6,36,['.oo.','otwo','otwo','.oo.']);
      // head
      at(0,hy,()=>{
        S(g,24,21,['oo','oto','.oo']); S(g,38,21,['.oo','oto','oo.']);
        const hd = eF(32,23.5,6.4,6.6);
        F(g,C.ol,24,15,40,31,dil(hd)); F(g,C.st,25,16,39,30,hd);
        F(g,C.wo,25,16,39,30,(x,y)=>hd(x,y)&&!hd(x+2,y+1));
        if (eyes === 'closed') { R(g,C.ol,28,22,2,1); R(g,C.ol,34,22,2,1); }
        else if (eyes === 'happy') { S(g,27,21,['.oo.','o..o']); S(g,33,21,['.oo.','o..o']); }
        else if (eyes === 'squint') { S(g,28,20,['o..','.oo','o..']); S(g,33,20,['..o','oo.','..o']); }
        else { eye(g,28,20,2,3); eye(g,34,20,2,3); }
        if (eyes !== 'squint') { R(g,C.ol,27,19,3,1); R(g,C.ol,34,19,3,1); }
        R(g,C.pk,26,24,2,1); R(g,C.pk,37,24,2,1);
        P(g,C.wo,32,23); P(g,C.wo,31,24);
        const m3 = mouth==='sing' ? 'oo..onnno..oo' : mouth==='oh' ? 'oo...ono...oo' : mouth==='flat' ? 'oo...ooo...oo' : 'oo..oWWWo..oo';
        S(g,26,25,['...ooo.ooo...','.oosssosssoo.','osssoo.oossso',m3, mouth==='sing' ? '....onppo....' : '.....ooo.....']);
        if (mouth === 'sing') R(g,C.ol,30,30,5,1);
      });
      // hat
      at(hatx,haty+hy,()=>{
        S(g,19,9,[
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
      });
    });
    // floating notes
    if (notes) for (let i = 0; i < 3; i++) {
      const ph = (t*0.55 + i/3) % 1; if (ph > 0.92) continue;
      const left = i%2===0, x = (left ? 7 : 52) + ri(sin(ph*6+i)*1.5), y = 36 - ph*28;
      note(g, i===1 ? C.li : C.yl, x, y);
    }
    if (burst > 0.05) {
      const r = ri(burst*4);
      const arcL = ['.y','y.','y.','y.','.y'], arcR = ['y.','.y','.y','.y','y.'];
      const h = ri(r/2);
      S(g,8-h,35,arcL); S(g,4-h,33,['.y','y.','y.','y.','y.','y.','.y']);
      S(g,54+h,35,arcR); S(g,58+h,33,['y.','.y','.y','.y','.y','.y','y.']);
      note(g,C.yl,4-r,20-r); note(g,C.li,13-r,12-r*2); note(g,C.yl,48+r,12-r*2); note(g,C.li,56+r,21-r);
      if (burst > 0.7) { spark(g,C.wh,6-r,44,false); spark(g,C.wh,58+r,44,false); }
    }
  });

  // ================================================================ BOI-BUMBÁ (lendária)
  // velvet night-blue bull, gold embroidery + sequins, forehead star, horn ribbons, red skirt; attack: horn charge
  reg('boi-bumba', function(g,t,st,p){
    let fa = 0, fb = 0, bdy = 0, hx = 0, hy = 0, dx = 0, eyes = 'open', rib = 1, ribAmp = 0.9, tw = ri(sin(t*2.2)), sf = fl(t*3)%3, ph = fl(t*3)%3, spk = 1, impact = 0, fw = -1, sw = 0;
    if (st === 'idle') {
      const step = fl(t*2.5)%2; fa = step; fb = 1-step; bdy = -step*0; hy = sin(t*2.5*PI) > 0.5 ? -1 : 0; sw = step ? 1 : -1;
      if (blink(t,3.8,1)) eyes = 'closed';
    } else if (st === 'atk') {
      const [w,s] = AT(p);
      hx = ri(2*w - 4*s); hy = ri(-3*w + 4*s); bdy = ri(-w + s); fa = w > 0.3 ? 2 : 0; eyes = 'angry'; ribAmp = 1.6; spk = 0;
      impact = p > 0.38 && p < 0.6 ? 1 : 0;
    } else if (st === 'hit') {
      const k = HK(p);
      dx = ri(2*k); hy = -ri(k); eyes = k > 0.25 ? 'squint' : 'open'; spk = 0; ribAmp = 1.8; sw = 1;
    } else if (st === 'sono') {
      hy = 2; eyes = 'closed'; ribAmp = 0; rib = 0; spk = 0; ph = fl(t*0.7)%3; bdy = sin(t*1.2) > 0.3 ? 1 : 0; tw = 0;
    } else if (st === 'entra') {
      hy = p < 0.7 ? -3 : 0; hx = p < 0.7 ? 1 : 0; fw = p; spk = 0; eyes = 'open'; fa = p < 0.6 ? 2 : 0;
    }
    OX = dx;
    // dancer's feet under the skirt
    // skirt
    const sk = pF([14,43, 50,43, 53+sw,57, 11+sw,57]);
    body(g,sk,[9,41,56,57],C.rd,C.wn,null,C.ol,1);
    for (let x = 17; x < 50; x += 4) R(g,C.wn,x,46,1,9);
    R(g,C.yl,13,50,39,1); for (let x = 14; x < 52; x += 4) P(g,C.cr,x,50);
    R(g,C.wn,12+sw,56,41,1); for (let x = 12+sf+sw; x < 53+sw; x += 3) R(g,C.yl,x,54,1,2);
    S(g,23,56-fa,['.ooooo.','ossssdo','oddddooo','.ooooo..']);
    S(g,36,56-fb,['.ooooo.','ossssdo','oddddooo','.ooooo..']);
    at(0,bdy,()=>{
      // tail + bow
      F(g,C.ol,46,20,62,42,tubeF([51,37, 56,33, 57+tw,27],1.1));
      S(g,55+tw,23,['.oo.','oiuo','ouuo','.oo.']);
      S(g,50,34,['r.r','rrr','r.r']);
      // velvet body
      const bd = any(eF(35,36,17,9.5), eF(43,31,8,6));
      body(g,bd,[17,24,53,46],C.nt,C.ol,C.pu,C.ol,2);
      F(g,C.yl,17,24,53,46,(x,y)=>bd(x,y)&&!bd(x,y+1)&&x>21);
      const curl = ['.yyy.','y...y','y.y.y','y..y.','.y...'];
      S(g,45,28,curl,1); S(g,29,37,curl);
      S(g,38,33,['..i..','.iyi.','iyWyi','.iyi.','..i..']);
      const sq = [C.wh,C.li,C.rd,C.yl];
      let n = 0;
      for (let arm = 0; arm < 2; arm++) for (let th = 0; ; ) {
        const r = 4.2 + th*1.05; if (r > 12) break;
        const a = th + arm*PI, x = ri(40 + cos(a)*r*1.25), y = ri(35 + sin(a)*r*0.6);
        th += 2.7/r;
        if (!bd(x,y) || !bd(x+1,y+1) || !bd(x-1,y-1) || x < 30) continue;
        P(g, (n%3)===ph ? C.wh : sq[(n>>1)%4], x, y); n++;
      }
      if (ph === 0 || st === 'sono') P(g,C.wh,40,35); else spark(g,C.wh,40,35);
      // ribbons from the horns
      if (rib || ribAmp === 0) {
        const rc = [C.rd,C.yl,C.bl,C.gr];
        for (let i = 0; i < 4; i++) {
          const x0 = 30+i, x1 = 44+i*2;
          wave(g,rc[i],x0,x1,x=>{ const u = x-x0; return 24.5 + hy*0.5 + i*2.2 + u*(rib?0.3:0.55) + sin(u/2.8 + i*1.1 + t*4)*ribAmp; });
        }
      }
    });
    // head
    at(hx,hy+bdy,()=>{
      S(g,8,30,['oooo..','oppnoo','.ooooo']);
      S(g,30,28,['..oooo','ooppno','ooooo.']);
      const cra = eF(22,31,8.5,7.5), mz = eF(20,39.5,6.2,4.3), hd = any(cra,mz);
      body(g,hd,[11,22,32,45],C.nt,null,C.pu,C.ol);
      F(g,C.ol,11,22,32,45,(x,y)=>cra(x,y)&&!hd(x+1,y+1)&&y>30);
      const mz2 = eF(20,39.5,5.2,3.4);
      F(g,C.pk,13,35,28,44,mz2);
      F(g,C.wn,13,35,28,44,(x,y)=>mz2(x,y)&&!mz2(x+1,y+1));
      F(g,C.cr,13,35,28,44,(x,y)=>mz2(x,y)&&!mz2(x-1,y-1)&&y<39);
      F(g,C.yl,13,34,28,44,(x,y)=>dil(mz2)(x,y)&&!mz2(x,y)&&hd(x,y)&&y<39&&((x+y)&1));
      R(g,C.wn,17,39,1,2); R(g,C.wn,22,39,1,2);
      if (st === 'atk' && impact) S(g,17,41,['oooooo','onnnno']); else { R(g,C.ol,18,42,4,1); P(g,C.ol,17,41); P(g,C.ol,22,41); }
      S(g,27,34,['.r.','ryr','.r.']);
      // horns, gold tips
      const h1 = bezF(17,26, 12,24, 10,16, 2,0.7), h2 = bezF(27,25, 32,23, 34,15, 2,0.7);
      for (const h of [h1,h2]) { F(g,C.ol,6,12,37,29,dil(h)); F(g,C.cr,6,12,37,29,h); F(g,C.yl,6,12,37,29,(x,y)=>h(x,y)&&y<20); }
      R(g,C.st,14,24,2,1); R(g,C.st,29,23,1,2); P(g,C.wh,10,17); P(g,C.wh,33,16);
      S(g,20,24,['..W..','WWWWW','.WWW.','.W.W.']);
      // eyes
      if (eyes === 'closed') { S(g,15,30,['ooo','i.i']); S(g,25,30,['oooo','i..i']); }
      else if (eyes === 'squint') { S(g,15,28,['o..','.oo','o..']); S(g,26,28,['..o','oo.','..o']); }
      else {
        S(g,25,28,['.WW.','WWoW','WooW','.WW.']); P(g,C.li,25,27); P(g,C.li,27,27);
        S(g,15,28,['WW.','oWW','ooW','.W.']); P(g,C.li,15,27);
        if (eyes === 'angry') { S(g,14,26,['oo..','..oo']); S(g,25,26,['..oo','oo..']); }
      }
      if (impact) { spark(g,C.yl,9,15,true); spark(g,C.wh,35,13,true); spark(g,C.yl,4,22,false); spark(g,C.or,39,21,false); }
    });
    // festive sparkles around (idle)
    if (spk) {
      const pts = [[7,20],[57,18],[57,47],[5,47],[46,12]];
      const k = fl(t*3)%pts.length;
      for (let i = 0; i < pts.length; i++) { if (i === k) spark(g, i%2?C.yl:C.li, pts[i][0], pts[i][1], true); else P(g, i%2?C.li:C.yl, pts[i][0], pts[i][1]); }
    }
    // entrance fireworks
    if (fw >= 0) {
      const r = 3 + fw*14, cx = 44, cy = 12;
      for (let k = 0; k < 10; k++) { const a = k*PI/5 + 0.3; P(g, [C.yl,C.pk,C.li,C.wh,C.or][k%5], ri(cx+cos(a)*r), ri(cy+sin(a)*r*0.8)); }
      if (fw < 0.75) spark(g,C.wh,cx,cy,true);
      for (let i = 0; i < 6; i++) { const y = ri((fw*40 + i*9) % 50), x = (i*11+5)%60; P(g,[C.yl,C.pk,C.lm,C.sk][i%4],x,y); }
    }
  });

  // ================================================================ GUARDIÃ FLORADA (lendária)
  // tan girl with a cascade of pink petal hair, twig crown in bloom, leaf gown, glowing apple; attack: petal magic burst
  reg('guardia-florada', function(g,t,st,p){
    let ax = 20, ay = 12 + (sin(t*2) > 0 ? 0 : 1), glow = 1, hx = 0, hy = 0, dx = 0, lift = 0, eyes = 'open', mouth = 'smile', bud = 0, burst = 0, shed = 0, petals = 1, sw = ri(sin(t*1.3)), haloR = 6 + (fl(t*2)%2);
    if (st === 'idle') {
      if (blink(t,3.4,0.4)) eyes = 'closed';
    } else if (st === 'atk') {
      const [w,s] = AT(p);
      if (p < 0.42) { ax = ri(lerp(20,23,w)); ay = ri(lerp(12,6,w)); lift = w; haloR = 6 + ri(w*2); }
      else { ax = ri(lerp(20,15,s)); ay = ri(lerp(12,23,s)); lift = s*0.5; burst = s; mouth = s > 0.5 ? 'open' : 'smile'; }
      petals = 0;
    } else if (st === 'hit') {
      const k = HK(p);
      dx = ri(2*k); hx = ri(k); ax = 21; ay = 14; glow = k < 0.2 ? 1 : 0; eyes = k > 0.25 ? 'squint' : 'open'; mouth = k > 0.3 ? 'oh' : 'smile'; shed = 1; petals = 0;
    } else if (st === 'sono') {
      ax = 22; ay = 34; glow = 0; eyes = 'closed'; hy = 1; bud = 1; petals = 0; mouth = 'calm'; sw = 0;
    } else if (st === 'entra') {
      const e = sm(p/0.85);
      OY = ri((1-e)*52); CY1 = 60;
      ax = 21; ay = 9; haloR = 6 + ri(p*3); petals = 0;
    }
    OX = dx;
    const baseOY = OY;
    // hair of petals behind
    at(hx,hy,()=>{
      const L = [[0,-4,5.5],[6,-4.5,4.5],[9,-0.5,4.5],[11,4.5,4.2],[13,9.5,4],[14,14.5,3.6],[13,19.5,3.2],[10,23.5,2.6],[7,1.5,3.5],[9,8.5,3.2],[10,14.5,3],
                 [-6,-2,4.2],[-8,3,3.8],[-9,8,3.4],[-9,13,3],[-8,17,2.4]];
      const lobes = L.map(l=>{ const wv = l[1] > 2 ? sin(t*1.8 - l[1]*0.25)*0.8 : 0; return [32 + l[0]*(1+lift*0.15) + wv, 17 + l[1]*(1-lift*0.2), l[2]]; });
      const hf0 = (x,y)=>{ for (const l of lobes) if (inE(x,y,l[0],l[1],l[2],l[2])) return true; return false; };
      const hf = MK(hf0,18,8,52,44);
      F(g,C.ol,17,7,53,45,dil(hf)); F(g,C.pk,18,8,52,44,hf);
      F(g,C.li,18,8,52,44,(x,y)=>hf(x,y)&&!hf(x+1,y+2));
      R(g,C.wh,38,10,3,1); R(g,C.wh,41,14,2,1); R(g,C.wh,43,19,2,1); R(g,C.wh,45,24,2,1); R(g,C.wh,46,30,1,2); R(g,C.wh,23,18,2,1);
      for (const q of [[43,19],[45,25],[46,30],[22,24]]) R(g,C.li,q[0],q[1]+1,2,1);
    });
    // gown of leaves
    const gw = [29,31, 35,31, 38,37, 42,45, 46+sw,53, 48+sw,59, 44+sw,58, 40,59, 36,58, 32,59, 28,58, 24,59, 20-sw,58, 16-sw,59, 18-sw,53, 22,45, 26,37];
    const gf = pF(gw);
    F(g,C.ol,14,30,50,59,(x,y)=>dil(gf)(x,y)&&y<60);
    F(g,C.gr,15,31,49,59,gf);
    F(g,C.gd,15,31,49,59,(x,y)=>gf(x,y)&&!gf(x+3,y));
    F(g,C.lm,15,31,49,59,(x,y)=>gf(x,y)&&!gf(x-1,y)&&y>36);
    R(g,C.lm,31,33,1,5); R(g,C.lm,29,38,1,5); R(g,C.lm,27,44,1,5); R(g,C.lm,25,50,1,4); R(g,C.lm,35,40,1,5); R(g,C.lm,38,47,1,5);
    S(g,24,36,['....l.l......','.....l....G..','.........G.G.','..l.l........','...l...l.l...','........l....']);
    for (const q of [[22,44,0],[33,46,1],[27,51,0],[39,53,1],[19,54,0],[30,55,1],[42,48,1]]) S(g,q[0],q[1],q[2]?['l..','gl.','.gG','..G']:['..l','.lg','Gg.','G..']);
    for (let x = 18-sw; x < 47+sw; x += 4) P(g,C.lm,x,57);
    for (const q of [[26,47],[36,42],[31,36],[40,52],[22,55],[33,54]]) { P(g,C.pk,q[0],q[1]); P(g,C.wh,q[0]+1,q[1]); }
    S(g,28,31,['pWpypWp'.slice(0,7)]);
    // torso of bark + leaf collar
    const tf = pF([28.5,23, 35.5,23, 35,28, 34,31.5, 30,31.5, 29,28]);
    F(g,C.ol,26,21,38,33,dil(tf)); F(g,C.wo,27,22,37,32,tf);
    F(g,C.wd,27,22,37,32,(x,y)=>tf(x,y)&&!tf(x+2,y)); F(g,C.st,27,22,37,32,(x,y)=>tf(x,y)&&!tf(x-1,y));
    R(g,C.wd,30,29,4,1);
    // right arm down with a leaf
    S(g,35,24,['.oo...','.owo..','..owo.','..owo.','...owo','..ogwo','.ogllo','..ooo.']);
    // head
    at(hx,hy,()=>{
      R(g,C.ol,30,21,5,3); R(g,C.st,31,21,3,3);
      const hd = eF(32,17,5,5.5);
      F(g,C.ol,26,10,38,24,dil(hd)); F(g,C.st,27,11,37,23,hd);
      F(g,C.wo,27,11,37,23,(x,y)=>hd(x,y)&&!hd(x+2,y));
      S(g,23,4, bud ? [
        '.p...............p.',
        '.dd.............dd.',
        '...dd.........dd...',
        '.....d.......d.....',
        '.....d.......d.....',
        '.....d.......d.....'
      ] : [
        'pWp.............pWp',
        '.dd.............dd.',
        '...dd.........dd...',
        '.....d.......d.....',
        '.....d.......d.....',
        '.....d.......d.....'
      ]);
      if (!bud) { S(g,30,3,['.p.','pyp','.p.']); }
      S(g,26,10,['..oooooooo..','.oppWpppppo.','oppppppppppo','opp.....pipi','op........pi']);
      if (eyes === 'closed') { S(g,28,16,['o..o','.oo.']); S(g,33,16,['o..o','.oo.']); }
      else if (eyes === 'squint') { S(g,28,15,['o..','.oo','o..']); S(g,34,15,['..o','oo.','..o']); }
      else { eye(g,29,15,2,3); eye(g,34,15,2,3); }
      R(g,C.pk,27,19,2,1); R(g,C.pk,36,19,2,1);
      if (mouth === 'open') S(g,31,19,['.oo.','.on.']);
      else if (mouth === 'oh') S(g,31,19,['.o.','o.o','.o.']);
      else if (mouth === 'calm') R(g,C.ol,31,20,3,1);
      else S(g,30,19,['o..o','.rr.']);
      S(g,36,8,['.W.','WyW','.W.']); S(g,44,26,['.W.','WyW','.W.']);
    });
    // raised arm + glowing apple
    const hxp = ax+2, hyp = ay+5;
    const arm = tubeF([28.5,25, hxp,hyp],1.3);
    F(g,C.ol,Math.min(hxp,28)-3,Math.min(hyp,25)-3,Math.max(hxp,29)+3,Math.max(hyp,25)+3,dil(arm));
    F(g,C.st,Math.min(hxp,28)-3,Math.min(hyp,25)-3,Math.max(hxp,29)+3,Math.max(hyp,25)+3,arm);
    S(g,26,24,['gl','.g']);
    if (glow) {
      F(g,C.li,ax-haloR-1,ay-haloR,ax+haloR+1,ay+haloR+1,(x,y)=>inE(x,y,ax+0.5,ay+1,haloR,haloR)&&!inE(x,y,ax+0.5,ay+1,haloR-1,haloR-1));
      if (fl(t*2)%2) { P(g,C.wh,ax-haloR+1,ay+1); P(g,C.wh,ax+haloR,ay+1); } else { P(g,C.wh,ax-3,ay-haloR+2); P(g,C.wh,ax+4,ay+haloR); }
    }
    S(g,ax-3,ay-3,['...dl.','..odll','.orrro','orWrrro','orrrrno','orrrnno','.onnno.','..ooo..']);
    // magic burst of petals
    if (burst > 0.05) {
      const r = 4 + burst*9, cx = ax, cy = ay+1;
      for (let k = 0; k < 8; k++) {
        const a = k*PI/4 + 0.2, x = ri(cx + cos(a)*r), y = ri(cy + sin(a)*r*0.9);
        if (k%2) { R(g,C.pk,x,y,2,1); P(g,C.wh,x+1,y-1); } else { P(g,C.wh,x,y); P(g,C.pk,x+1,y); P(g,C.li,x,y+1); }
      }
      if (burst > 0.6) { spark(g,C.wh,cx,cy-1,true); spark(g,C.li,cx-7,cy+8,false); spark(g,C.li,cx+8,cy-6,false); LN(g,C.li,cx-2,cy+4,cx-9,cy+13); LN(g,C.lm,cx-1,cy+5,cx-5,cy+14); }
    }
    OY = baseOY;
    // drifting petals / shed petals
    if (petals) for (let i = 0; i < 4; i++) {
      const ph = (t*3 + i*5) % 20;
      const x = fl([8,44,52,14][i] + ph*0.6) % 64, y = 10 + fl([12,24,0,30][i] + ph*1.2) % 46;
      if (i%2) { R(g,C.pk,x,y,2,1); P(g,C.wh,x+1,y-1); } else { P(g,C.wh,x,y); P(g,C.pk,x+1,y); }
    }
    if (shed) for (let i = 0; i < 4; i++) { const x = 44 + i*3 + ri(p*6), y = 18 + i*5 + ri(p*14); R(g,C.pk,x,y,2,1); P(g,C.wh,x,y-1); }
    if (st === 'entra') {
      CY1 = 64; OY = 0;
      for (let k = 0; k < 10; k++) {
        const a = k*PI/5 + p*6, r = 14 + sin(p*PI)*6, y = Math.min(57, ri(58 - p*30 + sin(a)*5)), x = ri(32 + cos(a)*r);
        if (k%2) { R(g,C.pk,x,y,2,1); P(g,C.wh,x+1,y-1); } else { P(g,C.lm,x,y); P(g,C.gr,x+1,y+1); }
      }
      R(g,C.wd,16,59,32,1); R(g,C.gr,18,58,3,1); R(g,C.lm,42,58,2,1);
      if (p > 0.8) { spark(g,C.wh,22,8,true); spark(g,C.li,46,12,false); }
    }
  });

  // ================================================================ MACIEIRA ANCIÃ (épica)
  // old apple tree with a kind face, mossy brows and beard, red apples and pink blossoms; attack: branch whip
  reg('macieira-ancia', function(g,t,st,p){
    let cx = 0, armL = [24,41, 19,43.5, 15,41.5], armR = [40,41, 45,43.5, 49,41.5], eyes = 'open', brow = 'norm', mouth = 'smile', bb = ri(sin(t*1.6)*0.6+0.4), sway = 1, vine = 0, apDy = 0, fall = -1, leaves = 0, dx = 0;
    if (st === 'idle') {
      const a = ri(sin(t*1.6)); armL = [24,41, 19,43.5+a, 15,41.5+a]; armR = [40,41, 45,43.5-a, 49,41.5-a];
      if ((t%5) > 4.6) eyes = 'closed';
    } else if (st === 'atk') {
      const [w,s] = AT(p);
      if (p < 0.4) { armL = [24,41, lerp(19,18,w),lerp(43.5,36,w), lerp(15,13,w),lerp(41.5,29,w)]; cx = ri(w); }
      else if (p < 0.62) { armL = [24,42, 15,44, 7,44]; vine = 1; cx = -2; leaves = 1; apDy = -1; mouth = 'open'; }
      else { armL = [24,41, lerp(19,15,s),lerp(43.5,44,s), lerp(15,8,s),lerp(41.5,44,s)]; cx = -ri(s*2); }
      eyes = 'wide'; brow = 'angry';
    } else if (st === 'hit') {
      const k = HK(p);
      dx = k > 0.2 ? 1 : 0; cx = k > 0.2 ? (fl(p*14)%2 ? 1 : -1) : 0; eyes = k > 0.25 ? 'squint' : 'open'; mouth = 'oh'; fall = p; leaves = 2;
    } else if (st === 'sono') {
      eyes = 'closed'; brow = 'droop'; mouth = 'calm'; bb = sin(t*1.1) > 0 ? 1 : 0; sway = 0.25;
      armL = [24,41, 19,44.5, 15,44]; armR = [40,41, 45,44.5, 49,44];
    } else if (st === 'entra') {
      const e = sm(p/0.85);
      OY = ri((1-e)*58); CY1 = 60; leaves = p > 0.55 ? 3 : 0;
    }
    OX = dx;
    const baseOY = OY;
    // roots + trunk
    const tr = pF([24.5,30, 39.5,30, 40.5,46, 45,59, 19,59, 23.5,46]);
    const rl = tubeF([22,56, 15,57.5, 9,58],1.3), rr = tubeF([42,56, 49,57.5, 55,58],1.3);
    F(g,C.ol,6,28,58,59,dil(any(tr,rl,rr))); F(g,C.wo,7,29,57,58,any(tr,rl,rr));
    F(g,C.wd,7,29,57,58,(x,y)=>tr(x,y)&&!tr(x+3,y)); F(g,C.st,7,29,57,58,(x,y)=>tr(x,y)&&!tr(x-2,y)&&y<50);
    R(g,C.wd,26,46,1,8); R(g,C.wd,37,45,1,9); R(g,C.wd,23,52,1,5); R(g,C.wd,41,52,1,5); R(g,C.wd,31,55,1,4);
    // branch arms with leaf tufts
    const arms = [armL]; if (st !== 'atk') arms.push(armR); else arms.push([40,41, 45,43.5, 49,41.5]);
    for (const A of arms) {
      const af = tubeF(A,1.1), tx = A[A.length-2], ty = A[A.length-1], lf = eF(tx,ty,2.6,2.2);
      F(g,C.ol,2,24,60,50,dil(any(af,lf))); F(g,C.wd,2,24,60,50,af); F(g,C.gr,2,24,60,50,lf); P(g,C.lm,ri(tx)-1,ri(ty)-1);
    }
    if (vine) {
      const vf = tubeF([7,44, 3,41, 2,36, 4,32],1);
      F(g,C.ol,0,28,10,48,dil(vf)); F(g,C.gr,0,28,10,48,vf); F(g,C.lm,0,28,10,48,(x,y)=>vf(x,y)&&!vf(x-1,y));
      S(g,4,30,['.ll','lgG','.G.']); S(g,5,46,['ll.','gGl','.G.']);
      for (const q of [[12,31],[9,27],[14,37],[2,50],[12,50]]) { P(g,C.lm,q[0],q[1]); P(g,C.gr,q[0]+1,q[1]); }
      LN(g,C.wh,13,30,8,35); LN(g,C.lg,10,27,6,31); LN(g,C.lg,15,34,11,38); P(g,C.wh,0,40);
    }
    // face
    const ey = (x,right)=>{
      if (eyes === 'closed') S(g,x-1,37,['o...o','.ooo.']);
      else if (eyes === 'wide') { R(g,C.ol,x,36,3,3); P(g,C.wh,x,36); }
      else if (eyes === 'squint') S(g,x,36,right?['..o','oo.','..o']:['o..','.oo','o..']);
      else { R(g,C.ol,x,37,3,2); P(g,C.wh,x,37); }
    };
    ey(26,0); ey(35,1);
    if (brow === 'angry') { S(g,24,33,['GGl..','..GGG']); S(g,34,33,['..lGG','GGG..']); }
    else if (brow === 'droop') { S(g,24,35,['.GlG.','G...G']); S(g,34,35,['.GlG.','G...G']); }
    else { S(g,24,34,['GGlGG']); S(g,34,34,['GGlGG']); }
    R(g,C.pk,23,39,2,1); R(g,C.pk,39,39,2,1);
    S(g,30,38,['.tw.','twwd','.dd.']);
    if (mouth === 'open') S(g,28,41,['oooooo','onnnno']);
    else if (mouth === 'oh') S(g,30,41,['.oo.','o..o']);
    // mossy beard
    S(g,26,42+(mouth==='open'?1:0),[
      'GGGGGGGGGGGG',
      'GlGGGlGGGGlG',
      '.GGlGGGGlGG.',
      '.GGGGGlGGGG.',
      '..GlGGGGlG..',
      '..GGGlGGG...',
      '...GGGlG....',
      bb ? '....GlG.....' : '....GG......',
      bb ? '.....G......' : '............'
    ]);
    // canopy
    at(cx,0,()=>{
      const L = [[32,17,14,10],[19,22,9,7.5],[45,22,9,7.5],[24,10,8,6.5],[40,10,8,6.5],[32,6,8,5],[13,28,6,4.5],[51,28,6,4.5],[32,26,13,6]];
      const lobes = L.map((l,i)=>[l[0] + sin(t*1.5 + i*1.3)*0.7*sway, l[1] + cos(t*1.2 + i)*0.4*sway, l[2], l[3]]);
      const cf = MK((x,y)=>{ for (const l of lobes) if (inE(x,y,l[0],l[1],l[2],l[3])) return true; return false; },5,0,59,35);
      const hi = MK((x,y)=>{ for (const l of lobes) if (inE(x,y,l[0]-1.5,l[1]-1.8,l[2]-3,l[3]-3)) return true; return false; },5,0,59,35);
      F(g,C.ol,4,0,60,36,dil(cf)); F(g,C.gd,5,0,59,35,cf);
      F(g,C.gr,5,0,59,35,(x,y)=>cf(x,y)&&hi(x,y));
      F(g,C.lm,5,0,59,35,(x,y)=>hi(x,y)&&!hi(x-1,y-1)&&!hi(x,y-2)&&cf(x,y));
      for (let i = 0; i < 10; i++) { const x = 8+hs(i,3)%48, y = 4+hs(i,5)%26; if (cf(x,y)&&cf(x+3,y+2)&&hi(x,y)) R(g,C.gd,x,y,2,1); }
      for (const q of [[11,25],[19,14],[29,10],[44,6],[54,24],[16,20],[40,16],[48,12],[26,22],[38,25],[34,3]]) { P(g,C.pk,q[0],q[1]); P(g,C.wh,q[0]+1,q[1]); P(g,C.pk,q[0],q[1]+1); }
      const ap = [[14,24],[21,17],[30,8],[42,11],[50,19],[34,18],[45,27],[22,8],[27,28],[54,29],[9,29]];
      const sp = fl(t*2)%ap.length;
      for (let i = 0; i < ap.length; i++) {
        const q = ap[i], x = q[0], y = q[1] + apDy*(i%2);
        R(g,C.ol,x-1,y-1,4,4); R(g,C.rd,x-1,y,3,2); R(g,C.rd,x,y-1,2,1); P(g,C.wh,x,y); R(g,C.wn,x,y+2,2,1); P(g,C.wn,x+2,y+1);
        if (i === sp && st === 'idle') { P(g,C.wh,x-2,y-2); P(g,C.wh,x+3,y-2); }
      }
    });
    if (fall >= 0) { const y = 24 + ri(fall*30); R(g,C.ol,46,y-1,4,4); R(g,C.rd,46,y,3,2); R(g,C.rd,47,y-1,2,1); P(g,C.wh,47,y); }
    OY = baseOY;
    if (leaves) {
      const n = leaves === 3 ? 8 : 5;
      for (let i = 0; i < n; i++) {
        const ph = leaves === 3 ? (p*1.8 + i*0.13) % 1 : (p + i*0.2) % 1;
        const x = leaves === 3 ? ri(32 + cos(i*0.8)*(18+ph*10)) : ri([8,52,4,58,30][i%5] + (i%2?ph*5:-ph*5)), y = leaves === 3 ? ri(20 + sin(i*0.8)*12 - ph*6) : ri([20,16,30,32,2][i%5] + ph*12);
        P(g, i%2?C.lm:C.gr, x, y); P(g, C.gd, x+1, y+1);
      }
    }
    if (st === 'entra') { CY1 = 64; OY = 0; R(g,C.wd,8,59,48,1); for (let i = 0; i < 6; i++) { const x = 6 + i*10 + ri(sin(p*9+i)*2), y = 57 - ri(sin(p*PI)*4) - (i%2); P(g, i%2?C.wo:C.wd, x, y); } }
  });

  // ================================================================ COLMEIA DOURADA (construção)
  // straw skep with golden bands, dark entrance, honey drip and puddle, bees orbiting; attack: bee swarm
  reg('colmeia-dourada', function(g,t,st,p){
    let rx = 15, ry = 26, dx = 0, dy = 0, orbit = 1, swarm = 0, drip = 1, sleeper = 0, scatter = 0, dust = 0, glint = (t%2.6) < 0.25;
    if (st === 'atk') {
      const [w,s] = AT(p);
      orbit = 0; glint = false;
      if (p < 0.38) { rx = 15 + ri(w); ry = 26 - ri(w*2); dx = w > 0.3 ? (fl(p*40)%2 ? 1 : -1) : 0; }
      else { ry = 26 + ri(s); swarm = s; }
    } else if (st === 'hit') {
      const k = HK(p);
      dx = k > 0.2 ? (fl(p*16)%2 ? 1 : -1)*ri(1+k) : 0; orbit = 0; scatter = 1; glint = false;
    } else if (st === 'sono') {
      orbit = 0; drip = 0; sleeper = 1; glint = false;
    } else if (st === 'entra') {
      orbit = 0; glint = false;
      if (p < 0.45) dy = -ri(34*(1-(p/0.45)*(p/0.45)));
      else if (p < 0.62) { ry = 23; rx = 16; dust = 1; }
      if (p > 0.55) swarm = sin((p-0.55)/0.45*PI)*0.9;
    }
    OX = dx; OY = dy;
    const cy = 59 - ry + 26 - 18, top = 41 + (26-ry) - ry;   // keeps the base on y=58
    const hf = (x,y)=>inE(x,y,32,41+(26-ry),rx,ry) && y <= 58;
    // bees behind the hive
    const bees = [];
    if (orbit) for (let k = 0; k < 3; k++) {
      const a = t*1.7 + k*2.09, x = ri(30 + cos(a)*21), y = ri(33 + sin(a)*7 + sin(t*6+k)*1);
      bees.push([x,y,sin(a)<0,cos(a+PI/2)<0,k]);
    }
    for (const b of bees) if (b[2]) bee(g,b[0],b[1],fl(t*12+b[4])%2,b[3]);
    // top knob
    R(g,C.ol,29,top-3,6,4); R(g,C.wo,30,top-2,4,3); R(g,C.st,30,top-2,2,1);
    // hive body
    F(g,C.ol,15,top-2,49,59,(x,y)=>dil(hf)(x,y)&&y<=59);
    F(g,C.st,16,top-1,48,58,hf);
    F(g,C.wo,16,top-1,48,58,(x,y)=>hf(x,y)&&((y-top)%5===0));
    F(g,C.wo,16,top-1,48,58,(x,y)=>hf(x,y)&&!hf(x+3,y));
    F(g,C.yl,16,top-1,48,58,(x,y)=>hf(x,y)&&((y-top)%5===2)&&hf(x-3,y)&&hf(x+5,y));
    F(g,C.cr,16,top-1,48,58,(x,y)=>hf(x,y)&&!hf(x-1,y)&&((y-top)%5!==0));
    F(g,C.wd,16,top-1,48,58,(x,y)=>hf(x,y)&&!hf(x+1,y)&&((y-top)%5===0));
    // entrance
    const ey = 52;
    F(g,C.ol,27,ey-3,38,ey+3,eF(32.5,ey,3.6,2.4));
    R(g,C.sd,30,ey,5,1);
    R(g,C.wd,28,ey+3,9,1);
    // honey drip from the entrance lip
    F(g,C.ol,24,55,43,59,(x,y)=>inE(x,y,33.5,58.6,6.5,1.9)&&y<=59);
    F(g,C.or,24,55,43,59,eF(33.5,58.8,5.5,1.3));
    F(g,C.yl,24,55,43,59,eF(33,58.5,4,0.9)); P(g,C.wh,31,58);
    if (drip) {
      const c = (t*0.8) % 1, len = 1 + fl(c*4);
      R(g,C.ol,31,ey+1,4,len+2); R(g,C.yl,32,ey+1,2,len); P(g,C.or,33,ey+len); P(g,C.wh,32,ey+1);
    } else { R(g,C.ol,31,ey+1,4,2); R(g,C.yl,32,ey+1,2,1); }
    if (glint) spark(g,C.wh,24,top+6,true);
    // bees in front
    for (const b of bees) if (!b[2]) bee(g,b[0],b[1],fl(t*12+b[4])%2,b[3]);
    // swarm
    if (swarm > 0.05) {
      const D = [[-1,-0.35],[1,-0.35],[-0.85,0.25],[0.85,0.25],[-0.45,-0.9],[0.45,-0.9],[0,-1.1],[-1.15,0.35],[1.15,0.35]];
      const d = 4 + swarm*16;
      for (let k = 0; k < D.length; k++) { const x = ri(30 + D[k][0]*d*1.2 + sin(t*9+k)), y = ri(ey - 1 + D[k][1]*d*0.8 + cos(t*8+k)); bee(g,x,Math.min(y,56),fl(t*14+k)%2,D[k][0]>0); }
      if (swarm > 0.7) { for (let k = 0; k < 4; k++) { const a = -PI/2 + (k-1.5)*0.7; P(g,C.wh,ri(32 + cos(a)*(d+6)),ri(ey + sin(a)*(d+4))); } }
    }
    if (scatter) {
      const k = HK(p);
      bee(g,ri(10 - k*4),ri(26 - k*6),fl(t*14)%2,0); bee(g,ri(50 + k*4),ri(22 - k*5),fl(t*14+1)%2,1); bee(g,ri(46 + k*5),ri(46),fl(t*14+2)%2,1);
      for (let i = 0; i < 4; i++) R(g,C.st,ri(20 + i*8 + (i%2?1:-1)*p*8),ri(18 + i*3 - p*10),2,1);
    }
    if (sleeper) {
      S(g,35,top-5,['.LL..','oyoyo','.ooo.']);
    }
    if (dust) { OY = 0; for (const q of [[13,57,2.2],[51,57,2.2],[9,55,1.5],[55,55,1.5]]) puff(g,C.cr,q[0],q[1],q[2]); }
    void cy;
  });

  // ================================================================ MOINHO DE VENTO (construção)
  // tapered wooden tower, red cone roof with pennant, four lattice sails turning; attack: gust of wind
  reg('moinho-de-vento', function(g,t,st,p){
    let a = t*1.1, dx = 0, dy = 0, flag = fl(t*4)%2, gust = 0, blur = 0, win = 1, dust = 0, chips = 0, roofDy = 0;
    if (st === 'atk') {
      const [w,s] = AT(p);
      a += p < 0.35 ? -0.4*w : -0.4 + sm((p-0.35)/0.65)*7.5;
      dx = s > 0.5 ? (fl(p*24)%2 ? 1 : 0) : (w > 0.5 ? -1 : 0);
      gust = s; blur = s > 0.3 ? 1 : 0; flag = 2;
    } else if (st === 'hit') {
      const k = HK(p);
      a -= 0.35*k; dx = k > 0.2 ? (fl(p*16)%2 ? 1 : -1) : 0; chips = 1;
    } else if (st === 'sono') {
      a = PI/4; win = 0; flag = 3;
    } else if (st === 'entra') {
      a += p*10;
      if (p < 0.45) dy = -ri(40*(1-(p/0.45)*(p/0.45)));
      else if (p < 0.62) { roofDy = 1; dust = 1; }
    }
    OX = dx; OY = dy;
    // grain sack
    S(g,43,53,['..oo..','.oyyo.','occcco','occcwo','occcwo','occcwo','.oooo.']);
    // tower
    const tw = pF([25,24, 39,24, 42,59, 22,59]);
    F(g,C.ol,21,23,43,59,dil(tw));
    F(g,C.cr,22,24,42,58,(x,y)=>tw(x,y)&&y<40);
    F(g,C.st,22,24,42,58,(x,y)=>tw(x,y)&&y<40&&!tw(x+3,y));
    F(g,C.wo,22,24,42,58,(x,y)=>tw(x,y)&&y>=40);
    F(g,C.wd,22,24,42,58,(x,y)=>tw(x,y)&&y>=40&&(!tw(x+3,y)||x===27||x===31||x===35||x===39));
    F(g,C.st,22,24,42,58,(x,y)=>tw(x,y)&&y>=41&&!tw(x-1,y));
    R(g,C.ol,23,40,19,1);
    // window
    R(g,C.ol,30,29,5,6); if (win) { R(g,C.sd,31,30,3,4); P(g,C.yl,31,30); } else { R(g,C.wo,31,30,3,4); R(g,C.wd,32,30,1,4); }
    // door
    S(g,28,50,['..oooo..','.odddwo.','oddddwwo','oddddwwo','oddddwwo','odddydwo','oddddwwo','oddddwwo','oddddwwo']);
    // roof
    at(0,roofDy,()=>{
      const rf = pF([20.5,26, 32,12, 43.5,26]);
      body(g,rf,[19,11,45,27],C.rd,C.wn,C.or,C.ol,2);
      R(g,C.wn,21,25,22,1);
      R(g,C.ol,32,7,1,6);
      if (flag === 0) S(g,33,7,['rrrr','rr..']); else if (flag === 1) S(g,33,7,['rr..','rrrr']); else if (flag === 2) S(g,33,7,['rrrrr','rrr..']); else S(g,33,8,['r','r','r']);
    });
    // sails
    const hx = 32.5, hy = 21.5;
    const ux = [], uy = [];
    for (let k = 0; k < 4; k++) { ux.push(cos(a + k*PI/2)); uy.push(sin(a + k*PI/2)); }
    const code = new Uint8Array(46*46);
    for (let y = 0; y < 46; y++) for (let x = 0; x < 46; x++) {
      const px = x + 9 + 0.5 - hx, py = y - 1 + 0.5 - hy;
      let c = 0;
      for (let k = 0; k < 4 && !c; k++) {
        const u = px*ux[k] + py*uy[k], v = -px*uy[k] + py*ux[k];
        if (u >= -1 && u <= 20.5 && Math.abs(v) < 0.6) c = 3;
        else if (u >= 5 && u <= 20 && v >= 0.6 && v <= 5) c = (v > 4 || ((u-5)%4) < 1) ? 2 : 1;
      }
      code[y*46+x] = c;
    }
    const cd = (x,y)=>{ x -= 9; y += 1; return x>=0&&y>=0&&x<46&&y<46 ? code[y*46+x] : 0; };
    const anyc = (x,y)=>cd(x,y)>0;
    F(g,C.ol,8,0,56,45,dil(anyc));
    F(g,C.cr,9,0,55,44,(x,y)=>cd(x,y)===1);
    F(g,C.st,9,0,55,44,(x,y)=>cd(x,y)===2);
    F(g,C.wd,9,0,55,44,(x,y)=>cd(x,y)===3);
    if (blur) for (let k = 0; k < 4; k++) for (let j = 1; j <= 5; j++) { const b = a + k*PI/2 - j*0.09; P(g, j < 3 ? C.wh : C.lg, ri(hx + cos(b)*21 - 0.5), ri(hy + sin(b)*21 - 0.5)); }
    R(g,C.ol,30,19,5,5); R(g,C.gy,31,20,3,3); P(g,C.lg,31,20);
    // gust of wind
    if (gust > 0.05) {
      const d = ri(gust*6);
      for (const q of [[12,46,7],[8,51,9],[14,56,6]]) { R(g,C.wh,q[0]-d-q[2],q[1],q[2],1); P(g,C.wh,q[0]-d,q[1]-1); P(g,C.lg,q[0]-d+1,q[1]-2); }
      for (const q of [[52,46,7],[56,51,9],[50,56,6]]) { R(g,C.wh,q[0]+d,q[1],q[2],1); P(g,C.wh,q[0]+d-1,q[1]-1); P(g,C.lg,q[0]+d-2,q[1]-2); }
    }
    if (chips) { const k = HK(p); R(g,C.wo,ri(46 + p*8),ri(38 - k*10),2,1); P(g,C.st,ri(18 - p*8),ri(34 - k*8)); P(g,C.st,ri(44 + p*5),ri(30 - k*12)); }
    if (dust) { OY = 0; for (const q of [[17,57,2.4],[47,57,2.4],[12,55,1.6],[52,55,1.6]]) puff(g,C.cr,q[0],q[1],q[2]); }
  });

  // ================================================================ TRATOR VERMELHO (construção)
  // old red tractor (side 3/4, facing left), big rear wheel with orange rim, grey chimney puffing; attack: rev and lunge
  reg('trator-vermelho', function(g,t,st,p){
    let vib = fl(t*5)%2, lf = 0, dx = 0, smoke = 1, smokeC = [C.wh,C.lg], rate = 0.55, wa = 0, light = 1, dustF = 0, lines = 0, bolt = -1, flash = 0, big = 1;
    if (st === 'atk') {
      const [w,s] = AT(p);
      lf = ri(3*w); dx = ri(2*w - 3*s); vib = w > 0.2 ? fl(p*30)%2 : 0; rate = 1.4; smokeC = [C.gy,C.lg]; big = 1.4;
      wa = -p*14; dustF = s; lines = s > 0.4 ? 1 : 0; flash = p > 0.38 && p < 0.52 ? 1 : 0;
    } else if (st === 'hit') {
      const k = HK(p);
      dx = k > 0.2 ? (fl(p*14)%2 ? 2 : 1) : 0; vib = 0; bolt = p; smokeC = [C.sd,C.gy]; light = fl(p*8)%2;
    } else if (st === 'sono') {
      vib = 0; smoke = 0; light = 0;
    } else if (st === 'entra') {
      const e = sm(p/0.7);
      dx = ri((1-e)*30); wa = -e*9; dustF = p < 0.75 ? 0.6 : 0; rate = 1;
    }
    OX = dx;
    const wheel = (cx,cy,r,rim,rimS,ang,n)=>{
      F(g,C.ol,cx-r-1,cy-r-1,cx+r+1,cy+r+1,eF(cx,cy,r,r));
      for (let k = 0; k < n; k++) { const b = ang + k*2*PI/n; P(g,C.sd,ri(cx + cos(b)*(r-0.9) - 0.5),ri(cy + sin(b)*(r-0.9) - 0.5)); }
      F(g,rim,cx-r,cy-r,cx+r,cy+r,eF(cx,cy,r-2.4,r-2.4));
      F(g,rimS,cx-r,cy-r,cx+r,cy+r,(x,y)=>inE(x,y,cx,cy,r-2.4,r-2.4)&&!inE(x,y,cx-0.8,cy-0.8,r-3.6,r-3.6));
      for (let k = 0; k < 3; k++) { const b = ang + k*2*PI/3; P(g,C.cr,ri(cx + cos(b)*(r*0.45) - 0.5),ri(cy + sin(b)*(r*0.45) - 0.5)); }
      F(g,C.gy,cx-3,cy-3,cx+3,cy+3,eF(cx,cy,2.2,2.2)); P(g,C.lg,ri(cx-1.5),ri(cy-1.5)); P(g,C.ol,ri(cx-0.5),ri(cy-0.5));
    };
    // smoke (behind the chimney cap, rising)
    const chx = 24, chy = 22 - ri(lf*0.6) + vib;
    if (smoke) for (let k = 0; k < 4; k++) {
      const ph = (t*rate + k/4) % 1; if (ph > 0.9) continue;
      const x = chx + 1 + ph*8 + sin(ph*6 + k)*1.5, y = chy - 2 - ph*18, r = (1 + ph*2.4)*big;
      puff(g, ph < 0.45 ? smokeC[0] : smokeC[1], x, y, r);
    }
    // rear wheel (static) + front wheel
    wheel(44,48.5,11,C.or,C.rd,wa,14);
    at(0,-lf,()=>wheel(15,53.5,6.5,C.rd,C.wn,wa*1.7,8));
    // body (vibrates)
    at(0,vib,()=>{
      // engine block
      R(g,C.ol,18,47,16,6); R(g,C.gy,19,48,14,4); R(g,C.lg,19,48,14,1); P(g,C.sd,22,50); P(g,C.sd,27,50);
      // chimney
      const cl0 = ri(lf*0.6);
      R(g,C.ol,22,24-cl0,5,14); R(g,C.gy,23,25-cl0,3,13); R(g,C.lg,23,25-cl0,1,13);
      if (smoke) { R(g,C.ol,21,22-cl0,7,3); R(g,C.gy,22,23-cl0,5,1); R(g,C.sd,23,22-cl0,3,1); }
      else { R(g,C.ol,21,22-cl0,7,3); R(g,C.gy,22,23-cl0,5,1); }
      // hood
      const hood = pF([9,38-lf, 35,36-lf*0.25, 37,37, 37,48, 9,48-lf]);
      body(g,hood,[7,32,38,49],C.rd,C.wn,C.or,C.ol,2);
      R(g,C.or,13,40-ri(lf*0.8),16,1);
      for (const vx of [21,24,27]) R(g,C.wn,vx,42-ri(lf*(37-vx)/28),1,4);
      // grille + headlight
      R(g,C.ol,7,40-lf,3,8); R(g,C.gy,8,41-lf,1,6); P(g,C.lg,8,41-lf);
      R(g,C.ol,7,36-lf,5,4); R(g,light?C.cr:C.wd,8,37-lf,3,2); if (light) P(g,C.wh,8,37-lf);
      if (flash) { spark(g,C.wh,4,38-lf,true); P(g,C.yl,1,38-lf); }
      // rear fender + seat + steering wheel
      const fen = (x,y)=>inE(x,y,44,48.5,13.5,13.5)&&!inE(x,y,44,48.5,11.6,11.6)&&y<47;
      F(g,C.ol,29,33,59,48,dil(fen)); F(g,C.rd,30,34,58,47,fen); F(g,C.or,30,34,58,47,(x,y)=>fen(x,y)&&!fen(x,y-1)); F(g,C.wn,30,34,58,47,(x,y)=>fen(x,y)&&x>53);
      R(g,C.ol,47,27,4,9); R(g,C.sd,48,28,2,7);
      R(g,C.ol,40,33,10,3); R(g,C.sd,41,34,8,1);
      LN(g,C.ol,36,37,38,31); R(g,C.ol,34,29,7,2); R(g,C.gy,35,29,2,1);
    });
    // dust / motion
    if (dustF > 0.05) {
      const r = 1 + dustF*2.2;
      puff(g,C.st,6 + ri(dustF*2),57,r); puff(g,C.cr,28,58,r*0.8); puff(g,C.st,57 + ri(dustF*3),57,r); puff(g,C.cr,60,54,r*0.7);
    }
    if (lines) { R(g,C.lg,57,40,6,1); R(g,C.lg,59,44,5,1); R(g,C.lg,58,30,5,1); }
    if (bolt >= 0) {
      const k = HK(bolt);
      R(g,C.gy,ri(30 + bolt*12),ri(32 - k*12),2,2); P(g,C.lg,ri(30 + bolt*12),ri(32 - k*12));
      puff(g,C.sd,chx + 2 + bolt*4,chy - 3 - bolt*8,1.5 + bolt*1.5);
    }
  });
})();
