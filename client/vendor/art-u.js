(function(){
  // Cartas Grão - personagens do tabuleiro (brejo): art-u.js
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

  // ------------------------------------------------------------ pixel buffer
  // everything is drawn into a 64x64 palette-index buffer, then flushed as
  // merged horizontal runs (one fillRect per run, integer coords only)
  const NM = Object.keys(C), HEX = [null], IX = {};
  for (let i = 0; i < NM.length; i++) { IX[NM[i]] = i + 1; HEX.push(C[NM[i]]); }
  const K = {o:'ol',s:'sd',d:'wd',w:'wo',t:'st',c:'cr',W:'wh',y:'yl',O:'or',r:'rd',n:'wn',p:'pk',G:'gd',g:'gr',l:'lm',T:'td',q:'tq',b:'bl',k:'sk',u:'pu',i:'li',Y:'gy',L:'lg',N:'nt'};
  const fl = Math.floor, rn = Math.round, sn = Math.sin, cs = Math.cos, PI = Math.PI;
  const cl = (v,a,b)=>v<a?a:v>b?b:v;
  const lerp = (a,b,u)=>a+(b-a)*u;
  const BF = new Uint8Array(4096), MK = new Uint8Array(4096);
  let ox = 0, oy = 0;
  function begin(){ BF.fill(0); ox = 0; oy = 0; }
  function P(c,x,y){ x = rn(x) + ox; y = rn(y) + oy; if (c && x >= 0 && x < 64 && y >= 0 && y < 64) BF[y*64+x] = IX[c]; }
  // only paints where nothing was drawn yet (glows / effects behind the body)
  function PB(c,x,y){ x = rn(x) + ox; y = rn(y) + oy; if (c && x >= 0 && x < 64 && y >= 0 && y < 64 && !BF[y*64+x]) BF[y*64+x] = IX[c]; }
  function R(c,x,y,w,h){ x = rn(x); y = rn(y); w = rn(w); h = rn(h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(c,x+i,y+j); }
  function F(c,f,x0,y0,x1,y1){ x0 = fl(x0); y0 = fl(y0); x1 = Math.ceil(x1); y1 = Math.ceil(y1); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (f(x,y)) P(c,x,y); }
  function FB(c,f,x0,y0,x1,y1){ x0 = fl(x0); y0 = fl(y0); x1 = Math.ceil(x1); y1 = Math.ceil(y1); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (f(x,y)) PB(c,x,y); }
  const mk = (x,y)=>x >= 0 && x < 64 && y >= 0 && y < 64 && MK[y*64+x] === 1;
  // shape: outline (4-neighbour ring) + base + shade band (bottom-right) + light edge (top-left)
  function SH(f,bb,base,shade,light,ol,sh){
    sh = sh || 2; MK.fill(0);
    const x0 = Math.max(0, fl(bb[0]) + ox), y0 = Math.max(0, fl(bb[1]) + oy), x1 = Math.min(63, Math.ceil(bb[2]) + ox), y1 = Math.min(63, Math.ceil(bb[3]) + oy);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (f(x-ox, y-oy)) MK[y*64+x] = 1;
    if (ol) { const o = IX[ol]; for (let y = Math.max(0,y0-1); y <= Math.min(63,y1+1); y++) for (let x = Math.max(0,x0-1); x <= Math.min(63,x1+1); x++) if (!mk(x,y) && (mk(x-1,y) || mk(x+1,y) || mk(x,y-1) || mk(x,y+1))) BF[y*64+x] = o; }
    const b = IX[base], s = shade ? IX[shade] : 0, l = light ? IX[light] : 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (MK[y*64+x]) {
      let c = b;
      if (s && !mk(x+sh, y+sh)) c = s;
      if (l && !mk(x-1, y-1)) c = l;
      BF[y*64+x] = c;
    }
  }
  const inE = (x,y,cx,cy,rx,ry)=>{ const a = (x+0.5-cx)/rx, b = (y+0.5-cy)/ry; return a*a + b*b <= 1; };
  const eF = (cx,cy,rx,ry)=>(x,y)=>inE(x,y,cx,cy,rx,ry === undefined ? rx : ry);
  const any = (...fs)=>(x,y)=>{ for (const f of fs) if (f(x,y)) return true; return false; };
  function E(c,cx,cy,rx,ry){ ry = ry === undefined ? rx : ry; F(c,eF(cx,cy,rx,ry),cx-rx-1,cy-ry-1,cx+rx+1,cy+ry+1); }
  function tubeF(pts,r){
    const r2 = r*r;
    return (x,y)=>{
      const px = x+0.5, py = y+0.5;
      for (let i = 0; i+3 < pts.length; i += 2) {
        const ax = pts[i], ay = pts[i+1], bx = pts[i+2], by = pts[i+3];
        const vx = bx-ax, vy = by-ay, L = vx*vx + vy*vy || 1;
        let u = ((px-ax)*vx + (py-ay)*vy)/L; u = u < 0 ? 0 : u > 1 ? 1 : u;
        const dx = px-(ax+vx*u), dy = py-(ay+vy*u);
        if (dx*dx + dy*dy <= r2) return true;
      }
      return false;
    };
  }
  function bezF(x0,y0,x1,y1,x2,y2,w0,w1,n){
    n = n || 20; const Q = [];
    for (let i = 0; i <= n; i++) { const u = i/n, a = (1-u)*(1-u), b = 2*u*(1-u), c = u*u, w = w0+(w1-w0)*u; Q.push([a*x0+b*x1+c*x2, a*y0+b*y1+c*y2, w*w]); }
    return (x,y)=>{ const px = x+0.5, py = y+0.5; for (const s of Q) { const dx = px-s[0], dy = py-s[1]; if (dx*dx + dy*dy <= s[2]) return true; } return false; };
  }
  const bez = (x0,y0,x1,y1,x2,y2,u)=>{ const a = (1-u)*(1-u), b = 2*u*(1-u), c = u*u; return [a*x0+b*x1+c*x2, a*y0+b*y1+c*y2]; };
  function bladeF(cx,cy,a,L,w){
    const ux = cs(a), uy = sn(a);
    return (x,y)=>{ const dx = x+0.5-cx, dy = y+0.5-cy, s = (dx*ux + dy*uy)/L; if (s < 0 || s > 1) return false; const q = -dx*uy + dy*ux; return Math.abs(q) <= w*Math.sqrt(4*s*(1-s)) + 0.15; };
  }
  function inPoly(px,py,p){
    let c = false;
    for (let i = 0, j = p.length-2; i < p.length; j = i, i += 2) {
      const xi = p[i], yi = p[i+1], xj = p[j], yj = p[j+1];
      if ((yi > py) !== (yj > py) && px < (xj-xi)*(py-yi)/(yj-yi) + xi) c = !c;
    }
    return c;
  }
  const pF = p=>(x,y)=>inPoly(x+0.5,y+0.5,p);
  function pbox(p){ let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (let i = 0; i < p.length; i += 2) { a = Math.min(a,p[i]); c = Math.max(c,p[i]); b = Math.min(b,p[i+1]); d = Math.max(d,p[i+1]); } return [a-1,b-1,c+1,d+1]; }
  function LN(c,x0,y0,x1,y1){ const dx = x1-x0, dy = y1-y0, n = Math.max(Math.abs(dx),Math.abs(dy)) || 1; for (let i = 0; i <= n; i++) P(c, x0+dx*i/n, y0+dy*i/n); }
  function S(x,y,rows,flip){
    x = rn(x); y = rn(y);
    for (let j = 0; j < rows.length; j++) {
      const r = rows[j], n = r.length;
      for (let i = 0; i < n; i++) { const ch = flip ? r[n-1-i] : r[i]; if (K[ch]) P(K[ch], x+i, y+j); }
    }
  }
  const spark = (c,x,y,big)=>{ if (big) { R(c,x-2,y,5,1); R(c,x,y-2,1,5); P('wh',x,y); } else { R(c,x-1,y,3,1); R(c,x,y-1,1,3); } };
  function clipRows(a,b){ for (let y = Math.max(0,a); y <= Math.min(63,b); y++) BF.fill(0, y*64, y*64+64); }
  // greedy rectangles: horizontal run, then grown downward while the rows below match
  const DN = new Uint8Array(4096);
  function out(g){
    DN.fill(0); let cur = -1;
    for (let y = 0; y < 64; y++) {
      let x = 0; const o = y*64;
      while (x < 64) {
        const c = BF[o+x];
        if (!c || DN[o+x]) { x++; continue; }
        let k = x+1; while (k < 64 && BF[o+k] === c && !DN[o+k]) k++;
        let h = 1;
        for (;;) {
          const yy = y+h; if (yy > 63) break;
          const oo = yy*64; let ok = true;
          for (let i = x; i < k; i++) if (BF[oo+i] !== c || DN[oo+i]) { ok = false; break; }
          if (!ok) break; h++;
        }
        for (let j = 0; j < h; j++) DN.fill(1, (y+j)*64+x, (y+j)*64+k);
        if (c !== cur) { g.fillStyle = HEX[c]; cur = c; }
        g.fillRect(x, y, k-x, h); x = k;
      }
    }
  }
  // attack phases: wind-up 0-0.35, strike 0.35-0.55, recover 0.55-1
  const ak = p=>p < 0.35 ? {w:p/0.35, s:0, r:0, k:p/0.35} : p < 0.55 ? {w:1, s:1, r:0, k:(p-0.35)/0.2} : {w:0, s:0, r:1, k:(p-0.55)/0.45};
  const blink = (t,per,off)=>((t + (off||0)) % per) > per - 0.15;
  window.CHAR_SPRITE = window.CHAR_SPRITE || {};
  // each drawing fills the buffer; the wrapper below flushes it to the canvas
  const W8 = {};

  // =========================================================== SAPINHO VERRUGUENTO
  W8['sapinho-verruguento'] = function(g,t,st,p){
    begin();
    let sq = 0, hy = sn(t*2.6) > 0.3 ? -1 : 0, puff = (t%2.4) > 1.7, bl = blink(t,3.3), tw = (t%2.9) < 0.22 ? 1 : 0;
    let ang = 0, open = 0, drops = -1, squint = 0, shut = 0, air = 0, spikes = 0;
    if (st === 'atk') {
      const a = ak(p); puff = false; bl = false; ang = 1;
      if (p < 0.35) { sq = a.w; puff = a.w > 0.45; hy = 0; }
      else if (p < 0.55) { air = -3; open = 1; drops = a.k; spikes = 1; hy = -1; }
      else { drops = a.k < 0.45 ? 1 + a.k*2.2 : -1; air = a.k < 0.25 ? -1 : 0; sq = (a.k > 0.25 && a.k < 0.5) ? 0.5 : 0; open = a.k < 0.2 ? 1 : 0; hy = 0; }
    } else if (st === 'hit') { ox = p < 0.5 ? -2 : -1; squint = 1; puff = false; hy = 0; bl = false; spikes = p < 0.5 ? 1 : 0; }
    else if (st === 'sono') { shut = 1; hy = sn(t*1.3) > 0 ? 0 : 1; puff = sn(t*1.3) > 0.25; bl = false; tw = 0; }
    else if (st === 'entra') {
      if (p < 0.55) { air = -rn(sn(p/0.55*PI)*10); hy = -1; }
      else { sq = p < 0.8 ? (0.8-p)/0.25 : 0; }
      puff = p > 0.8; bl = false;
    }
    oy = air;
    const S2 = rn(sq*2), ey = S2 + hy;
    const bd = eF(32, 48 + sq, 15.5 + sq*2, 10.5 - sq);
    const fb = any(bd, eF(32, 39.5 + ey, 18 + sq, 8), eF(24, 32 + ey, 6, 6), eF(40, 32 + ey, 6, 6), eF(16 - sq, 53, 7.5, 5), eF(48 + sq, 53, 7.5, 5));
    SH(fb, [7,25,57,59], 'gr', 'gd', 'lm', 'ol', 2);
    F('lm', (x,y)=>bd(x,y) && inE(x,y,32,52.5,9,4.6), 22, 47, 42, 58);
    // front hands
    S(21, 56, ['.lll.','lgogl']); S(38, 56, ['.lll.','lgogl']);
    // warts
    for (const w of [[16,46,0],[20,41,1],[43,41,1],[47,46,0],[18,52,0],[45,52,0],[25,50,0],[38,50,0],[28,37,1],[35,37,1]]) {
      const y = w[1] + (w[2] ? ey : S2);
      P('lm', w[0], y); P('tq', w[0]+1, y); R('td', w[0], y+1, 2, 1);
      if (spikes) { P('ol', w[0], y-1); P('ol', w[0]+1, y-2); }
    }
    // eyes
    if (shut || bl) {
      R('gd', 21, 30+ey, 6, 3); R('ol', 21, 32+ey, 6, 1); R('gd', 38, 30+ey, 6, 3); R('ol', 38, 32+ey, 6, 1);
    } else if (squint) {
      S(21, 30+ey, ['oo....','..oooo','oo....']); S(38, 30+ey, ['....oo','oooo..','....oo']);
    } else {
      R('cr', 21, 29+ey, 6, 4); R('cr', 38, 29+ey, 6, 4);
      R('ol', 24, 30+ey, 2, 3); P('wh', 24, 30+ey);
      R('ol', 39, 30+ey, 2, 3); P('wh', 39, 30+ey);
      R('lg', 21, 32+ey, 6, 1); R('lg', 38, 32+ey, 6, 1); P('ol', 24, 32+ey); P('ol', 25, 32+ey); P('ol', 39, 32+ey); P('ol', 40, 32+ey);
    }
    // grumpy brows (angrier on attack)
    const b0 = 26 + ey - tw - ang;
    LN('ol', 19, b0, 26, b0+2+ang); LN('ol', 45, b0, 38, b0+2+ang);
    LN('ol', 19, b0+1, 21, b0+1); LN('ol', 45, b0+1, 43, b0+1);
    // mouth
    if (open) {
      const mo = eF(32, 44.5+ey, 8, 3.6);
      SH(mo, [23,40+ey,41,49+ey], 'wn', null, null, 'ol');
      R('rd', 28, 46+ey, 8, 2); R('pk', 29, 46+ey, 5, 1);
    } else {
      R('ol', 22, 42+ey, 21, 1); P('ol', 21, 43+ey); P('ol', 43, 43+ey); P('ol', 32, 41+ey);
      if (puff) {
        const sac = (x,y)=>inE(x,y,32,47+ey,7.5,4.4) && y >= 43+ey;
        SH(sac, [24,43+ey,40,52+ey], 'lm', null, null, 'gd');
        R('cr', 28, 45+ey, 2, 1); P('wh', 28, 45+ey);
        R('ol', 22, 42+ey, 21, 1);
      } else { R('lm', 28, 43+ey, 9, 1); R('gd', 29, 44+ey, 7, 1); }
    }
    // spit spray
    if (drops >= 0) {
      for (let i = 0; i < 4; i++) for (const sd of [1,-1]) {
        const d = 9 + i*4 + drops*6, x = 32 + sd*d, y = 42 + ey - i*2 - drops*3 + (i%2)*2;
        if (i === 3 && drops < 0.4) continue;
        R('sk', x, y, 2, 2); P('wh', x, y); P('tq', x+1, y+1);
      }
    }
  };

  // =========================================================== LIBELULA FAISCA
  W8['libelula-faisca'] = function(g,t,st,p){
    begin();
    let bob = rn(sn(t*3.2)*1.5), wf = fl(t*14)%2, curl = 0, bolt = 0, flash = 0, squint = 0, shut = 0, still = 0, chg = 0, trail = 0;
    const fk = fl(t*7)%3;
    if (st === 'atk') {
      const a = ak(p); wf = fl(p*30)%2;
      if (p < 0.35) { curl = a.w; chg = a.w; }
      else if (p < 0.55) { curl = 1; bolt = 1; flash = 1; }
      else { curl = 1 - a.k; chg = a.k < 0.3 ? 0.6 : 0; }
      bob = 0;
    } else if (st === 'hit') { ox = p < 0.5 ? -2 : -1; squint = 1; still = 1; bob = 0; }
    else if (st === 'sono') { shut = 1; still = 2; bob = sn(t*1.2) > 0 ? 2 : 3; }
    else if (st === 'entra') { trail = 1 - p; bob = rn((1-p)*-4); flash = p > 0.35 && p < 0.6 ? 1 : 0; }
    oy = bob - 2;
    // wings (translucent, striped)
    const da = still === 2 ? 0.25 : still ? 0.05 : (wf ? 0.16 : -0.06);
    const wings = [bladeF(30,27,PI+0.34+da,20,3.6), bladeF(30,30,PI-0.22-da,18,3.2), bladeF(34,27,-0.34-da,20,3.6), bladeF(34,30,0.22+da,18,3.2)];
    for (const w of wings) {
      F('sk', (x,y)=>!w(x,y) && (w(x-1,y) || w(x+1,y) || w(x,y-1) || w(x,y+1)), 6, 14, 58, 42);
      F('sk', (x,y)=>w(x,y) && ((y + wf) % 3 !== 2), 6, 14, 58, 42);
      F('wh', (x,y)=>w(x,y) && !w(x,y-1) && !w(x-1,y), 6, 14, 58, 42);
    }
    for (const w of [[30,27,PI+0.34+da,20],[30,30,PI-0.22-da,18],[34,27,-0.34-da,20],[34,30,0.22+da,18]]) P('nt', w[0]+cs(w[2])*w[3]*0.84, w[1]+sn(w[2])*w[3]*0.84);
    // abdomen: hangs down, curls forward to aim the spark
    const A0 = [32,31, 32,38, 31,45, 29,52], A1 = [32,31, 35,37, 41,40, 47,38];
    const ap = A0.map((v,i)=>lerp(v, A1[i], curl));
    const ab = tubeF(ap, 2.2);
    SH(ab, [24,28,52,56], 'bl', 'nt', 'sk', 'ol', 1);
    for (let i = 0; i < 3; i++) for (const u of [0.35,0.7]) P('tq', lerp(ap[i*2],ap[i*2+2],u), lerp(ap[i*2+1],ap[i*2+3],u));
    const tx = ap[6], ty = ap[7];
    P('ol', tx + (curl > 0.5 ? 2 : 0), ty + (curl > 0.5 ? 0 : 2));
    // legs
    LN('ol', 30, 31, 27, 35); LN('ol', 34, 31, 37, 35); P('ol', 26, 36); P('ol', 38, 36);
    // thorax + head
    const th = any(eF(32,28.5,4.6,4), eF(32,20.5,6.6,5.4));
    SH(th, [24,14,40,33], 'bl', 'nt', 'sk', 'ol', 1);
    R('tq', 31, 28, 2, 1); R('tq', 31, 30, 2, 1);
    // big cute eyes
    if (shut) {
      R('bl', 26, 17, 4, 4); R('bl', 35, 17, 4, 4);
      R('ol', 26, 19, 4, 1); R('ol', 35, 19, 4, 1); P('ol', 25, 18); P('ol', 39, 18);
    } else if (squint) {
      F('ol', any(eF(27.5,19.5,3.2,1.6), eF(36.5,19.5,3.2,1.6)), 23, 16, 41, 22);
      P('wh', 25, 22); P('wh', 39, 22); P('sk', 24, 16); P('sk', 40, 16);
    } else {
      const eye = eF(27.5,19,3.2,3.4), eye2 = eF(36.5,19,3.2,3.4);
      F('ol', any(eye,eye2), 23, 15, 41, 23);
      R('wh', 26, 17, 2, 1); P('wh', 26, 18); P('sk', 28, 20);
      R('wh', 35, 17, 2, 1); P('wh', 35, 18); P('sk', 37, 20);
    }
    // smile
    if (flash) { R('ol', 30, 23, 4, 2); P('pk', 31, 24); P('pk', 32, 24); }
    else { P('ol', 30, 23); R('ol', 31, 24, 3, 1); P('ol', 34, 23); }
    P('pk', 25, 23); P('pk', 39, 23);
    // electricity
    if (!shut) {
      if (fk !== 1) spark('yl', tx-4, ty+2);
      if (fk !== 0) { P('wh', tx+3, ty+3); P('yl', tx-2, ty+5); }
      if (!curl && !trail) { LN('yl', tx, ty+2, tx-3, ty+4); LN('wh', tx-3, ty+4, tx-1, ty+6); }
    } else if (fl(t*2)%3 === 0) P('yl', tx-2, ty+2);
    if (chg > 0) {
      const r = 2 + rn(chg*3);
      for (let i = 0; i < 6; i++) { const a = i*PI/3 + t*6; P(i%2 ? 'wh' : 'yl', tx + cs(a)*r, ty + sn(a)*r); }
      if (chg > 0.6) spark('yl', tx+1, ty, true);
    }
    if (bolt) {
      const zz = [tx+1,ty, tx+5,ty-4, tx+8,ty+1, tx+12,ty-5, tx+15,ty-1, tx+19,ty-6];
      for (let i = 0; i+3 < zz.length; i += 2) { LN('yl', zz[i], zz[i+1]+1, zz[i+2], zz[i+3]+1); LN('wh', zz[i], zz[i+1], zz[i+2], zz[i+3]); }
      spark('yl', tx+1, ty, true); spark('wh', 63-ox, ty-5);
    }
    if (flash) for (const q of [[22,14],[42,13],[20,30],[44,31]]) spark('yl', q[0], q[1]);
    if (trail > 0) {
      const n = rn(trail*5);
      for (let i = 0; i < n; i++) { const x = 22 - i*5, y = 46 + (i%2 ? -2 : 1); LN(i%2 ? 'yl' : 'wh', x, y, x-4, y + (i%2 ? 3 : -3)); }
    }
  };

  // =========================================================== TABOA ESPINHOSA
  W8['taboa-espinhosa'] = function(g,t,st,p){
    begin();
    let sw = rn(sn(t*1.3)), lsw = rn(sn(t*1.3+1.4)*1.5), bl = blink(t,4.1), shut = 0, squint = 0, angry = 0;
    let whip = 0, wq = 0, rise = 0, fluff = 1;
    if (st === 'atk') {
      const a = ak(p); fluff = 0; bl = false;
      if (p < 0.35) { whip = 1; wq = a.w; sw = -1; angry = 1; }
      else if (p < 0.55) { whip = 2; wq = 1; sw = 1; angry = 1; }
      else { whip = 3; wq = a.k; sw = a.k < 0.5 ? 1 : 0; }
    } else if (st === 'hit') { ox = (fl(p*12)%2) ? 1 : -1; squint = 1; lsw = (fl(p*12)%2) ? 2 : -2; bl = false; }
    else if (st === 'sono') { shut = 1; sw = sn(t*0.9) > 0 ? -1 : 0; lsw = 0; bl = false; fluff = 0; }
    else if (st === 'entra') { const e = 1 - Math.pow(1-p, 2); rise = rn((1-e)*54); fluff = 0; bl = false; angry = 0; }
    oy = rise;
    const leaf = (x0,y0,x1,y1,x2,y2,w,side)=>{
      const f = bezF(x0,y0,x1,y1,x2,y2,w,1,30);
      SH(f, [Math.min(x0,x2)-4, Math.min(y0,y2)-4, Math.max(x0,x2)+4, Math.max(y0,y2)+4], 'gr', 'gd', 'lm', 'ol', 1);
      for (const u of [0.32,0.54,0.76]) {
        const a = bez(x0,y0,x1,y1,x2,y2,u), b = bez(x0,y0,x1,y1,x2,y2,u+0.02);
        let nx = -(b[1]-a[1]), ny = b[0]-a[0]; const L = Math.hypot(nx,ny) || 1; nx /= L; ny /= L;
        const ww = w + (1-w)*u;
        P('lm', a[0]+nx*side*(ww+0.6), a[1]+ny*side*(ww+0.6));
        P('ol', a[0]+nx*side*(ww+1.8), a[1]+ny*side*(ww+1.8));
      }
    };
    // back leaves
    leaf(27,60, 14,48, 6+lsw,24, 3.2, 1);
    leaf(37,60, 50,47, 58+lsw,22, 3.2, -1);
    // small cattails
    const cat = (x,cy,d)=>{
      R('ol', x-1, cy+6, 3, 60-cy-6); R('gd', x, cy+6, 1, 60-cy-6);
      R('ol', x+d-1, cy-11, 3, 6); R('gd', x+d, cy-10, 1, 5);
      SH(eF(x+d+0.5, cy, 2.8, 7), [x-4, cy-8, x+5, cy+8], 'wo', 'wd', 'st', 'ol', 1);
    };
    cat(19, 33, -sw); cat(45, 30, -sw);
    // main stem + big cattail head
    R('ol', 30, 33, 5, 27); R('gd', 31, 33, 3, 27); R('gr', 31, 34, 1, 26);
    R('ol', 31+sw, 3, 3, 9); R('gd', 32+sw, 4, 1, 8);
    const hx = 32.5 + sw;
    SH(eF(hx, 22, 7.2, 12), [24, 9, 42, 35], 'wo', 'wd', 'st', 'ol', 2);
    for (const q of [[28,14],[33,12],[36,17],[29,29],[36,28],[27,21],[34,31],[30,11]]) P('wd', q[0]+sw, q[1]);
    // face
    const fx = 28 + sw;
    if (shut || bl) { R('ol', fx, 21, 3, 1); R('ol', fx+6, 21, 3, 1); }
    else if (squint) { S(fx, 19, ['oo.....oo','..o...o..','oo.....oo']); }
    else if (angry) { S(fx, 18, ['o.......o','.oo...oo.','ooo...ooo','oWo...oWo']); }
    else S(fx, 20, ['ooo...ooo','oWo...oWo']);
    R('pk', fx-2, 24, 2, 1); R('pk', fx+9, 24, 2, 1);
    if (whip === 2) S(fx+3, 25, ['ooo','onn','ooo']);
    else S(fx+3, 25, ['.oo','.on']);
    // front leaves; the right one is the whip
    leaf(29,60, 21,54, 12-lsw,40, 2.9, 1);
    let rt;
    if (whip === 1) rt = [36,60, lerp(45,40,wq),lerp(54,49,wq), lerp(53,40,wq),lerp(41,24,wq)];
    else if (whip === 2) rt = [36,60, 52,56, 63,49];
    else if (whip === 3) rt = [36,60, lerp(52,45,wq),lerp(56,54,wq), lerp(63,53,wq),lerp(49,41,wq)];
    else rt = [36,60, 45,54, 53+lsw,41];
    leaf(rt[0],rt[1],rt[2],rt[3],rt[4],rt[5], 2.9, -1);
    if (whip === 2) {
      // whoosh + flying thorns
      LN('lg', 44, 34, 52, 36); LN('lg', 47, 31, 57, 36); LN('wh', 54, 40, 60, 42);
      P('ol', 59, 44); P('ol', 62, 41); P('lm', 58, 44); P('lm', 61, 41);
    }
    if (st === 'hit') { P('cr', 40, 12); P('cr', 24, 15); P('wh', 42, 9); }
    // drifting seed fluff
    if (fluff) for (let k = 0; k < 2; k++) {
      const u = (t*0.35 + k*0.5) % 1;
      if (u < 0.85) { const x = 38 + k*4 + u*12 + sn(t*3+k)*1.5, y = 16 - u*12 + k*6; P('cr', x, y); P('wh', x+1, y-1); }
    }
    if (rise) { clipRows(61, 63); for (const q of [[24,59],[27,57],[38,58],[41,59],[33,56]]) { P('wd', q[0], q[1]-rise); P('wo', q[0]+1, q[1]-rise-1); } }
  };

  // =========================================================== GARCA PESCADORA
  W8['garca-pescadora'] = function(g,t,st,p){
    begin();
    const X = x=>(x-30)*1.25+30, Y = y=>(y-43)*1.3+60, M = pp=>pp.map((v,i)=>i%2 ? Y(v) : X(v));
    const wg = fl(t*5)%2, nb = sn(t*1.6) > 0.5 ? 1 : 0;
    const POSE = {
      idle: {n:[36.25,31.4, 40,26.2, 38.75,22.3, 41.25,18.4], hx:43.75, hy:17.75, a:0.2},
      back: {n:[36,31, 37.5,27, 34,23, 36,20], hx:38, hy:19, a:-0.05},
      strike: {n:[36.5,31, 42,30, 47,32], hx:49, hy:34, a:0.62},
      tuck: {n:[35,31, 35,29], hx:34, hy:27, a:PI-0.35}
    };
    let pz = POSE.idle, fish = 1, bl = blink(t,3.6), squint = 0, shut = 0, puff = 0, wingsUp = 0, wl = 0;
    const mix = (A,B,u)=>({n:A.n.map((v,i)=>lerp(v,B.n[i],u)), hx:lerp(A.hx,B.hx,u), hy:lerp(A.hy,B.hy,u), a:lerp(A.a,B.a,u)});
    if (st === 'atk') {
      const a = ak(p); fish = 0; bl = false;
      if (p < 0.35) pz = mix(POSE.idle, POSE.back, a.w);
      else if (p < 0.55) { pz = mix(POSE.back, POSE.strike, cl(a.k*2.2,0,1)); wl = -1; }
      else pz = mix(POSE.strike, POSE.idle, cl(a.k*1.4,0,1));
    } else if (st === 'hit') { pz = mix(POSE.idle, POSE.back, 0.6); ox = p < 0.5 ? -2 : -1; squint = 1; puff = 1; fish = 0; }
    else if (st === 'sono') { pz = POSE.tuck; shut = 1; fish = 0; oy = sn(t*1.2) > 0 ? 0 : 1; }
    else if (st === 'entra') { wingsUp = p < 0.85 ? 1 : 0; oy = -rn((1-p)*10); fish = 0; wl = -1; }
    else { pz = {n:pz.n.map((v,i)=>i > 3 ? v + (i%2 ? -nb : 0) : v), hx:pz.hx, hy:pz.hy-nb, a:pz.a}; }
    // spread wings for the landing
    if (wingsUp) {
      const fw = fl(p*8)%2;
      const lw = fw ? [22,33, 6,16, 2,22, 10,31, 18,37] : [22,33, 4,24, 2,30, 10,35, 18,38];
      SH(pF(lw), pbox(lw), 'wh', 'lg', null, 'ol', 2);
      LN('gy', 5, fw ? 19 : 26, 12, fw ? 29 : 32);
    }
    // standing leg + feet
    R('ol', 28, 43, 3, 17); R('or', 29, 43, 1, 16); P('wd', 29, 51);
    R('or', 25, 58, 8, 1); R('ol', 24, 59, 10, 1); P('ol', 24, 58); P('ol', 33, 58);
    // tail feathers
    const tl = M([20,25, 9,32, 11,34, 22,31]);
    SH(pF(tl), pbox(tl), 'gy', null, 'lg', 'ol', 1);
    // body (puffed when hit)
    let bp = M([16,29, 20,22, 27,18, 34,18, 38,21, 37,26, 31,30, 21,31]);
    if (puff) bp = bp.map((v,i)=>i%2 ? 36 + (v-36)*1.12 : 28 + (v-28)*1.1);
    SH(pF(bp), pbox(bp), 'wh', 'lg', null, 'ol', 2);
    const wi = M([19,24, 27,21, 33,22, 32,27, 25,30, 17,30]).map((v,i)=>i%2 ? v + wl : v);
    const wf2 = pF(wi);
    F('lg', wf2, 12, 24, 44, 46);
    F('gy', (x,y)=>wf2(x,y) && !wf2(x,y+2), 12, 24, 44, 46);
    LN('gy', 21, 37+wl, 28, 34+wl); LN('gy', 20, 41+wl, 30, 37+wl);
    // tucked leg
    S(20, 44, ['.oo..','oOo..','oOo..','.oOoo','..ooOo','...oo.']);
    if (puff) { R('wh', 14, 26, 2, 1); P('lg', 15, 27); R('wh', 46, 24, 1, 2); }
    if (wingsUp) {
      const fw = fl(p*8)%2;
      const rw = fw ? [36,30, 50,12, 56,15, 50,26, 42,33] : [36,30, 54,20, 58,25, 50,31, 42,34];
      SH(pF(rw), pbox(rw), 'wh', 'lg', null, 'ol', 2);
      LN('gy', 54, fw ? 15 : 23, 47, fw ? 26 : 30);
    }
    // neck
    const nk = tubeF(pz.n.concat([pz.hx-1.5, pz.hy+0.5]), 2.1);
    SH(nk, [24,8,56,40], 'wh', null, null, 'ol');
    F('lg', (x,y)=>nk(x,y) && !nk(x+1,y), 24, 8, 56, 40);
    // head
    const hx = pz.hx, hy = pz.hy, back = pz.a > PI/2;
    SH(eF(hx, hy, 4.6, 3.4), [hx-6, hy-5, hx+6, hy+5], 'wh', 'lg', null, 'ol', 1);
    // crest plume
    if (back) { LN('ol', hx+2, hy-1, hx+9, hy-4); LN('ol', hx+2, hy, hx+8, hy-2); }
    else { LN('ol', hx-2, hy-1, hx-11, hy-5); LN('ol', hx-2, hy, hx-10, hy-2); P('ol', hx-1, hy-2); }
    // beak
    const L = st === 'atk' && p >= 0.35 && p < 0.6 ? 11 : 14, a = pz.a;
    const bx = back ? hx-2 : hx+2.5, tx = bx + L*cs(a), ty = hy + 0.3 + L*sn(a);
    const nx = -sn(a), ny = cs(a);
    const bk = [bx + nx*-1.6, hy + ny*-1.6, tx + nx*-0.3, ty + ny*-0.3, tx + nx*0.5, ty + ny*0.5, bx + nx*1.9, hy + 0.6 + ny*1.9];
    SH(pF(bk), pbox(bk), 'or', null, null, 'ol');
    LN('wd', bx + cs(a)*1.5, hy + 0.5 + sn(a)*1.5, tx - cs(a)*2, ty - sn(a)*2 + 0.3);
    // eye
    const ex = rn(back ? hx+1 : hx-1), eyy = rn(hy-1);
    if (shut) { R('ol', ex-1, eyy+1, 2, 1); }
    else if (squint) { R('ol', ex-1, eyy, 3, 1); P('ol', ex, eyy+1); }
    else S(ex, eyy, ['Wy','yo']);
    // fish in the beak
    if (fish) {
      const fx = rn(tx) - 6, fy = rn(ty) - 1;
      S(fx, fy, ['.oo.','oLWo','oLko','oLko','oLko','.oo.']);
      S(fx - 1 + wg, fy + 6, ['oLLo','.oo.']);
    }
    if (st === 'atk' && p >= 0.4 && p < 0.6) { LN('wh', 45, 40, 52, 41); LN('lg', 47, 43, 55, 44); }
  };

  // =========================================================== RAINHA DAS RAS
  W8['rainha-das-ras'] = function(g,t,st,p){
    begin();
    const X = x=>(x-32)*1.35+32, Y = y=>(y-44)*1.35+60, k = 1.35;
    let pu = fl(t*1.4)%2, sr = pu ? 1 : 0, bl = blink(t,4.4), shut = 0, wide = 0, sing = 0, rings = -1, ctilt = 0, sparkle = 0;
    if (st === 'atk') {
      const a = ak(p); bl = false;
      if (p < 0.35) { sr = 1 + a.w*2.4; shut = a.w > 0.5 ? 1 : 0; pu = 1; }
      else if (p < 0.55) { sr = 3.6; sing = 1; rings = a.k; pu = 1; }
      else { sr = 3.6 - a.k*2.6; rings = a.k < 0.5 ? 1 + a.k*2 : -1; sing = a.k < 0.3 ? 1 : 0; }
    } else if (st === 'hit') { ox = p < 0.5 ? -2 : -1; wide = 1; ctilt = 1; sr = 0; pu = 0; bl = false; }
    else if (st === 'sono') { shut = 1; sr = sn(t*1.2) > 0 ? 1 : 0; pu = 0; bl = false; oy = sn(t*1.2) > 0 ? 0 : 1; }
    else if (st === 'entra') { const e = 1 - Math.pow(1-p, 2); oy = rn((1-e)*16); sparkle = 1; bl = false; }
    // lily-pad cape / throne back
    const cy = Y(22), notch = Y(16);
    const back = (x,y)=>inE(x,y,32,cy,19.5*k,15*k) && !(y < notch && Math.abs(x+0.5-32) < (notch-y)*0.8);
    SH(back, [5,9,59,52], 'gd', 'td', 'gr', 'ol', 2);
    for (const a of [-2.75,-2.3,-0.84,-0.39]) { const c = cs(a), d = sn(a); LN('gr', 32+c*15, cy+5+d*11, 32+c*24, cy+5+d*17.5); }
    LN('gr', 9, 37, 13, 44); LN('gr', 55, 37, 51, 44);
    // fireflies / court lights
    for (let i = 0; i < 7; i++) {
      const a = t*0.7 + i*0.9, r = 28 + (i%3);
      if (((t*1.1 + i*0.41) % 1.7) < 1.2) P(i%3 ? 'lm' : 'yl', 32 + cs(a)*r, 32 + sn(a)*r*0.6);
    }
    // frog
    const fb = any(eF(32,Y(34),13*k,8.5*k), eF(32,Y(26.5),12.5*k,6.5*k), eF(X(24),Y(20),4.6*k,4.4*k), eF(X(40),Y(20),4.6*k,4.4*k), eF(X(19.5),Y(38),5*k,3.6*k), eF(X(44.5),Y(38),5*k,3.6*k));
    SH(fb, [8,20,56,59], 'gr', 'gd', 'lm', 'ol', 2);
    F('lm', (x,y)=>fb(x,y) && inE(x,y,32,Y(39),9.5,4.7), 20, 46, 44, 59);
    S(18, 56, ['.llll.','lgoglg']); S(40, 56, ['.llll.','glgogl']);
    // glowing throat sac
    const sy = Y(34), sac = (x,y)=>inE(x,y,32,sy,8.6+sr,4.9+sr*0.55) && y > Y(30.5);
    if (pu) FB('li', (x,y)=>{ const a = (x+0.5-32)/(11.5+sr), b = (y+0.5-sy)/(7.2+sr*0.5); const d = a*a+b*b; return d <= 1 && d > 0.62 && ((x+y)&1) && y > 41; }, 16, 38, 48, 58);
    SH(sac, [18,40,46,56], 'li', null, null, 'pu');
    F('pk', (x,y)=>sac(x,y) && !sac(x-1,y-2), 18, 40, 46, 56);
    R('wh', 27, 44, 2, 1); P('wh', 26, 45);
    // mouth
    if (sing) {
      const mo = eF(32, 41, 6, 2.4);
      SH(mo, [24,37,40,45], 'wn', null, null, 'ol');
      R('rd', 29, 42, 6, 1);
    } else { R('ol', 21, 41, 23, 1); P('ol', 20, 40); P('ol', 44, 40); }
    R('pk', 17, 38, 3, 1); R('pk', 45, 38, 3, 1);
    // half-lidded golden eyes
    for (const ex of [18, 40]) {
      if (shut || bl) { R('gr', ex, 25, 6, 3); R('ol', ex, 27, 6, 1); P('ol', ex-1, 26); P('ol', ex+6, 26); }
      else if (wide) S(ex, 23, ['.oooo.','oyyyyo','yWooyy','yyooyy','yyyyyy','.yyyy.']);
      else S(ex, 24, ['.oooo.','oooooo','yWooyy','yyooyy','.yyyy.']);
    }
    // lily-flower crown
    const cx = 23 + ctilt, cyy = 16 + ctilt;
    S(cx, cyy, [
      '.........o.........',
      '........oWo........',
      '.o.....oiWio.....o.',
      'oWo....oiiio....oWo',
      'oiio..oiiiiio..oiio',
      'oiiio.oiipiio.oiiio',
      '.oiiiooiipiiooiiio.',
      '..oiiipiipiipiiio..',
      '..oyyyyyyyyyyyyyo..',
      '..oyOyyyyryyyyOyo..',
      '...ooooooooooooo...'
    ]);
    const tw = fl(t*2.5)%4;
    if (tw === 0) P('wh', cx+9, cyy); else if (tw === 2) { P('wh', cx+1, cyy+4); P('wh', cx+17, cyy+4); }
    // song: sound rings + notes
    if (rings >= 0) {
      for (let i = 0; i < 2; i++) {
        const r = 6 + rings*10 + i*6;
        FB(i ? 'pk' : 'li', (x,y)=>{ const dx = x+0.5-32, dy = (y+0.5-42)*1.4, d = Math.sqrt(dx*dx+dy*dy); return Math.abs(d - r - 8) < 0.9 && Math.abs(dy) < 16 && Math.abs(dx) > 14; }, 0, 18, 63, 62);
      }
      const nx = rn(rings*8);
      S(50+nx, 20-nx, ['..ii','..i.','ii..','ii..']); S(6-nx, 24-nx, ['..pp','..p.','pp..','pp..']);
    }
    if (sparkle) for (let i = 0; i < 6; i++) { const a = i*1.05 + p*5, r = 30 - p*8; spark(i%2 ? 'li' : 'wh', 32 + cs(a)*r, 34 + sn(a)*r*0.7); }
    if (st === 'entra' && p > 0.35 && p < 0.75) { LN('yl', 32, 16, 32, 12); LN('yl', 26, 18, 23, 15); LN('yl', 38, 18, 41, 15); }
    if (oy) clipRows(61, 63);
  };

  // =========================================================== VELHO LODAO
  W8['velho-lodao'] = function(g,t,st,p){
    begin();
    let hv = sn(t*1.1) > 0 ? 0 : 1, glow = fl(t*2)%2, bl = blink(t,5.2), shut = 0, squint = 0;
    let o = 0, hdy = 0, splash = -1, bub = -1, rise = 0, mj = 0, flare = 0;
    const rs = rn(sn(t*1.5));
    if (st === 'atk') {
      const a = ak(p); bl = false;
      if (p < 0.35) { o = rn(a.w*5); hdy = -rn(a.w*2); }
      else if (p < 0.55) { o = 9; hdy = 1; flare = 1; }
      else { o = a.k < 0.15 ? 4 : 0; hdy = a.k < 0.4 ? 1 : 0; splash = a.k < 0.6 ? a.k/0.6 : -1; }
    } else if (st === 'hit') { ox = p < 0.5 ? -2 : -1; squint = 1; mj = p < 0.5 ? -1 : 0; bl = false; }
    else if (st === 'sono') { shut = 1; hv = sn(t*0.8) > 0 ? 0 : 1; bub = (t*0.45) % 1; bl = false; }
    else if (st === 'entra') { rise = rn(Math.pow(1-p, 1.5)*40); bl = false; glow = 1; }
    oy = rise;
    // ---- back: mossy island with mushrooms and reeds
    const by = 39 - hv;
    const isl = (x,y)=>inE(x,y,32,by,28.5,21) && y <= 47;
    const top = x=>{ for (let y = 16; y < 47; y++) if (isl(x,y)) return y; return 47; };
    for (const r of [[49,9],[51,7],[54,10],[47,12],[56,13]]) { const yt = r[1] - hv, s = rs*(r[0]%2 ? 1 : -1); LN('gr', r[0], top(r[0])+1, r[0]+s, yt); R('wo', r[0]+s, yt-2, 1, 3); P('wd', r[0]+s, yt); }
    for (let x = 6; x < 58; x += 6) { const y = top(x+1); S(x, y-3, ['.o.','ogo','ogg']); }
    SH(isl, [2,17,62,48], 'gd', 'td', 'gr', 'ol', 2);
    for (let x = 6; x < 58; x += 6) { const y = top(x+1); P('gr', x+1, y-2); P('lm', x+1, y-1); }
    // moss patches
    for (const m of [[14,30,4,2],[27,24,5,2],[45,27,4,2],[52,35,3,1.6],[9,38,3,1.6],[36,32,3,1.4]]) {
      const mf = eF(m[0], m[1]-hv, m[2], m[3]);
      F('gr', mf, m[0]-m[2]-1, m[1]-hv-m[3]-1, m[0]+m[2]+1, m[1]-hv+m[3]+1);
      F('lm', (x,y)=>mf(x,y) && !mf(x,y-1), m[0]-m[2]-1, m[1]-hv-m[3]-1, m[0]+m[2]+1, m[1]-hv+m[3]+1);
    }
    for (const q of [[20,28],[31,21],[40,23],[56,40],[6,42],[24,35]]) P('lm', q[0], q[1]-hv);
    // mushrooms (red caps, cream spots)
    S(11, top(15)-5+mj, ['..ooooo..','.orrcrro.','orcrrrrco','ooooooooo','...occo..','...occo..']);
    S(22, top(25)-4+mj, ['.ooooo.','orrcrro','ooooooo','..oco..','..oco..']);
    S(36, top(39)-4+mj, ['.oooo.','orcrro','orrrco','oooooo','..oco.']);
    // ---- head: lower jaw, mouth, upper head (eye bumps + snout)
    const hy0 = hdy, ML = 55 + hy0, SY = 52 + hy0;
    const snw = y=>{ const d = (y+0.5-SY)/8.2; return d*d < 1 ? 21*Math.sqrt(1-d*d) : -1; };
    const lower = (x,y)=>inE(x,y,32,SY,21,8.2) && y >= ML;
    // front claws
    for (const fx of [7, 57]) {
      SH(eF(fx, 56, 5.6, 4.4), [fx-7, 50, fx+7, 61], 'gr', 'gd', 'lm', 'ol', 1);
      S(fx-3, 59, ['c.c.c']);
    }
    SH(lower, [9,ML,55,61], 'gr', 'gd', null, 'ol', 2);
    if (o > 0) {
      const mi = (x,y)=>y >= ML-o && y <= ML && Math.abs(x+0.5-32) <= Math.max(snw(ML), 15) - 1.5;
      SH(mi, [10,ML-o-1,54,ML+1], 'wn', null, null, 'ol');
      if (o >= 4) F('rd', (x,y)=>inE(x,y,32,ML+0.5,9,2.6) && y <= ML, 20, ML-3, 44, ML+1);
      for (let x = 15; x < 50; x += 3) { R('cr', x+1, ML-1, 1, 1); if (o >= 4) R('cr', x+1, ML-2, 1, 1); }
    }
    const up = (x,y)=>{ const yy = y + o; return (inE(x,yy,32,SY,21,8.2) && yy >= 45+hy0 && yy < ML) || inE(x,yy,20,41.5+hy0,8.5,6.5) || inE(x,yy,44,41.5+hy0,8.5,6.5); };
    SH(up, [9,33+hy0-o,55,ML-o], 'gr', 'gd', 'lm', 'ol', 2);
    const uy = hy0 - o;
    for (const q of [[22,49],[42,49],[26,47],[38,47],[17,51],[47,51],[32,47],[13,52],[51,52]]) P('lm', q[0], q[1]+uy);
    S(27, 47+uy, ['.oo...oo.','oGLo.oLGo']);
    // teeth along the jaw line
    R('ol', 13, ML-1-o, 39, 1); P('ol', 12, ML-2-o); P('ol', 52, ML-2-o);
    for (let x = 14; x < 51; x += 3) { R('cr', x, ML-o, 1, 2); P('wh', x, ML-o); }
    // glowing eyes
    for (const ex of [20, 44]) {
      const ey = 41.5 + uy, ef = eF(ex, ey, 5, 3.2);
      if (shut || bl) { F('gd', ef, ex-6, ey-4, ex+6, ey+3); R('ol', ex-4, ey, 9, 1); P('ol', ex-5, ey-1); P('ol', ex+4, ey-1); continue; }
      if (squint) { F('gd', ef, ex-6, ey-4, ex+6, ey+3); S(ex-4, ey-1, ex < 32 ? ['ooo......','...oooooo'] : ['......ooo','oooooo...']); continue; }
      F(glow ? 'or' : 'yl', (x,y)=>!ef(x,y) && (ef(x-1,y) || ef(x+1,y) || ef(x,y-1) || ef(x,y+1)) && y <= ey, ex-7, ey-5, ex+7, ey+1);
      F(flare ? 'cr' : 'yl', ef, ex-6, ey-4, ex+6, ey+3);
      R('ol', ex, ey-2, 1, 5); P('ol', ex+1, ey-1); P('ol', ex+1, ey);
      P('wh', ex-2, ey-2); P('cr', ex-3, ey-1); P('or', ex+3, ey); P('or', ex-3, ey+1);
    }
    if (flare) { spark('yl', 13, 33+uy); spark('yl', 51, 33+uy); }
    // fireflies around the reeds
    for (let i = 0; i < 4; i++) if (((t*1.1 + i*0.41) % 1.7) < 1.25) P('lm', [6,58,2,61][i], [22,18,32,30][i] + rn(sn(t+i)));
    // sleeping nostril bubble
    if (bub >= 0) { const r = 1 + bub*3; F('sk', (x,y)=>{ const d = Math.hypot(x+0.5-39, y+0.5-(45-r)); return d <= r && d > r-1.1; }, 33, 36, 45, 47); P('wh', 38, rn(44-r*1.4)); }
    // mud splash after the bite
    if (splash >= 0) for (let i = 0; i < 4; i++) for (const sd of [1,-1]) {
      const x = 32 + sd*(20 + i*3 + splash*6), y = 56 - (i%2 ? 4 : 2) - splash*8 + splash*splash*6;
      R(i%2 ? 'td' : 'tq', x, y, 2, 1); P('sk', x, y-1);
    }
    if (rise) {
      clipRows(61, 63);
      for (let i = 0; i < 6; i++) { const x = 4 + i*11 + (i%2)*3, y = 58 - (i%3); R(i%2 ? 'tq' : 'sk', x, y-rise, 3, 1); P('wh', x+1, y-rise-1-(fl(t*8+i)%2)); }
    }
  };

  // =========================================================== PERERECA GRUDENTA
  W8['perereca-grudenta'] = function(g,t,st,p){
    begin();
    const pad = (x,y)=>{ S(x-1, y-1, ['.oo.','oyyo','oyyo','.oo.']); P('cr', x, y); };
    let gx = 32 + rn(cs(t*2.3)*17), gy = 15 + rn(sn(t*4.6)*4), gnat = 1, bl = blink(t,3.1);
    let shut = 0, tiny = 0, tongue = 0, lean = 0, air = 0, splay = 0, thr = sn(t*7) > 0.6 ? 1 : 0, narrow = 0;
    if (st === 'atk') {
      const a = ak(p); bl = false;
      if (p < 0.35) { lean = rn(a.w); narrow = 1; gx = 60; gy = 28; }
      else if (p < 0.55) { tongue = cl(a.k*2.5, 0, 1); gnat = 0; }
      else { tongue = 1 - cl(a.k*1.6, 0, 1); gnat = 0; }
    } else if (st === 'hit') { ox = p < 0.5 ? -2 : -1; tiny = 1; gnat = 0; bl = false; }
    else if (st === 'sono') { shut = 1; gnat = 0; oy = sn(t*1.3) > 0 ? 0 : 1; thr = sn(t*1.3) > 0.4 ? 1 : 0; bl = false; }
    else if (st === 'entra') { if (p < 0.55) { air = -rn(sn(p/0.55*PI)*10); splay = 1; } gnat = p > 0.7 ? 1 : 0; bl = false; }
    oy += air;
    const hy = lean;
    // back legs (thighs) + long feet
    for (const sd of [-1, 1]) {
      const kx = 32 + sd*13;
      SH(eF(kx, 51, 6, 5.5), [kx-7, 45, kx+7, 57], 'lm', 'gr', null, 'ol', 1);
      const ft = splay ? tubeF([32+sd*16, 55, 32+sd*25, 57], 1.3) : tubeF([32+sd*15, 56, 32+sd*22, 58.5], 1.3);
      SH(ft, [32+sd*13-8, 52, 32+sd*13+14, 61], 'lm', 'gr', null, 'ol', 1);
    }
    for (const sd of [-1, 1]) { if (splay) { pad(32+sd*26, 56); pad(32+sd*24, 59); } else { pad(32+sd*23, 57); pad(32+sd*20, 59); } }
    // body + head + eye bumps
    const fr = any(eF(32,47,10,10.5), eF(32,35.5+hy,12.5,7.5), eF(25,29+hy,4.8,4.8), eF(39,29+hy,4.8,4.8));
    SH(fr, [18,23,46,58], 'lm', 'gr', null, 'ol', 2);
    F('cr', (x,y)=>fr(x,y) && !fr(x-1,y-1) && !fr(x,y-2) && y < 36, 18, 23, 46, 38);
    F('cr', (x,y)=>inE(x,y,32,49,5.5,6.5), 25, 42, 39, 56);
    F('lm', (x,y)=>inE(x,y,32,49,5.5,6.5) && ((x+y)&1) && y < 46, 25, 42, 39, 56);
    if (thr) R('cr', 29, 41+hy, 6, 1);
    // arms down to sticky hands
    for (const sd of [-1, 1]) {
      const arm = splay ? tubeF([32+sd*8, 42, 32+sd*18, 40, 32+sd*23, 38], 1.4) : tubeF([32+sd*8, 42, 32+sd*11, 50, 32+sd*9, 55], 1.4);
      SH(arm, [32+sd*12-14, 34, 32+sd*12+14, 58], 'lm', 'gr', null, 'ol', 1);
      if (splay) { pad(32+sd*25, 36); pad(32+sd*25, 39); pad(32+sd*23, 41); }
      else { pad(32+sd*7, 57); pad(32+sd*10, 58); pad(32+sd*12, 56); }
    }
    // red eyes
    let pdx = gnat ? cl(rn((gx-32)/12), -1, 1) : 0, pdy = gnat && gy < 20 ? -1 : 0;
    if (narrow) { pdx = 1; pdy = 0; }
    for (const ex of [25, 39]) {
      const ey = 29 + hy;
      if (shut || bl) { R('ol', ex-3, ey, 7, 1); P('ol', ex-3, ey-1); P('ol', ex+3, ey-1); R('gr', ex-2, ey+1, 5, 1); continue; }
      E('rd', ex, ey, 3.3, 3.3);
      if (narrow) { R('lm', ex-3, ey-3, 7, 2); R('ol', ex-3, ey-2, 7, 1); }
      if (tiny) { P('ol', ex, ey); P('wh', ex-1, ey-1); }
      else { R('ol', ex-1+pdx, ey-1+pdy, 2, 2); if (!narrow) P('wh', ex-2+pdx, ey-2+pdy); }
      P('wn', ex+1, ey+2); P('wn', ex+2, ey+1);
    }
    // smile + tongue
    const my = 39 + hy;
    if (tongue > 0) {
      const L = tongue*17, tx = 41 + L, ty = my - tongue*7;
      R('ol', 27, my, 14, 1); P('ol', 26, my-1);
      R('wn', 37, my+1, 4, 1);
      LN('ol', 40, my-1, tx, ty-1); LN('pk', 40, my, tx, ty); LN('wn', 40, my+1, tx, ty+1); LN('ol', 40, my+2, tx, ty+2);
      if (tongue > 0.5) { SH(eF(tx, ty+0.5, 2.6, 2.3), [tx-4, ty-3, tx+4, ty+4], 'pk', 'wn', null, 'ol', 1); P('wh', tx-1, ty-1); }
    } else {
      R('ol', 27, my, 12, 1); P('ol', 26, my-1); P('ol', 39, my-1); P('ol', 40, my-2);
      if (!shut && (t%2.6) < 0.25) { R('pk', 39, my, 2, 1); P('wn', 40, my+1); }
    }
    R('pk', 20, 35+hy, 2, 1); R('pk', 43, 35+hy, 2, 1);
    // the gnat she is hunting
    if (gnat) { const wg = fl(t*12)%2; R('ol', gx, gy, 2, 1); if (wg) { P('lg', gx-1, gy-1); P('lg', gx+2, gy-1); } else { P('lg', gx, gy-1); P('lg', gx+1, gy-1); } }
  };

  // =========================================================== VAGA-LUME PISCANTE
  W8['vaga-lume-piscante'] = function(g,t,st,p){
    begin();
    let fr = fl(t/0.3)%3, br = fr !== 1, wf = fl(t*10)%2, bob = rn(sn(t*2.6)*1.5), ant = rn(sn(t*3.3));
    let bl = blink(t,3.4), shut = 0, squint = 0, folded = 0, halo = br ? 7 : 4.5, rays = -1, glowC = br ? 'yl' : 'lm', det = 0;
    if (st === 'atk') {
      const a = ak(p); bl = false;
      if (p < 0.35) { br = a.w > 0.3; halo = 3 + a.w*5; glowC = a.w > 0.6 ? 'cr' : 'yl'; det = 1; }
      else if (p < 0.55) { br = true; halo = 11; glowC = 'wh'; rays = a.k; squint = 1; }
      else { br = a.k > 0.5; halo = 9 - a.k*4; glowC = 'yl'; rays = a.k < 0.3 ? 1 : -1; }
      bob = 0;
    } else if (st === 'hit') { ox = p < 0.5 ? -2 : -1; squint = 1; br = fl(p*10)%2 === 0; halo = 3; glowC = 'gr'; bob = 0; }
    else if (st === 'sono') { shut = 1; folded = 1; br = sn(t*1.4) > 0.5; halo = br ? 4 : 0; glowC = 'lm'; bob = sn(t*1.2) > 0 ? 2 : 3; ant = 1; }
    else if (st === 'entra') { br = true; halo = 6 + (1-p)*8; glowC = p < 0.5 ? 'wh' : 'yl'; bob = rn((1-p)*-6); bl = false; }
    oy = bob - 1;
    const lx = 44, ly = 49;
    // flight wings (blur) behind
    if (!folded) {
      const fw = wf ? [bladeF(33,35,-2.2,15,3.6), bladeF(38,35,-0.9,15,3.6)] : [bladeF(33,35,-2.7,14,3.4), bladeF(38,35,-0.4,14,3.4)];
      for (const w of fw) { F('sk', (x,y)=>w(x,y) && ((x+y+wf)&1), 12, 16, 56, 40); F('wh', (x,y)=>w(x,y) && !w(x,y-1) && ((x+wf)&1), 12, 16, 56, 40); }
    }
    // halo glow (dither behind everything)
    if (halo > 0) {
      const hc = glowC === 'gr' ? 'gr' : 'lm';
      for (let y = fl(ly-halo); y <= ly+halo; y++) for (let x = fl(lx-halo) + ((y+1)&1); x <= lx+halo; x += 2) if (inE(x,y,lx,ly,halo,halo*0.85)) PB(inE(x,y,lx,ly,halo*0.7,halo*0.6) ? hc : 'tq', x, y);
    }
    // legs
    LN('ol', 31, 44, 29, 48); LN('ol', 35, 45, 34, 49); LN('ol', 38, 45, 40, 49);
    // body + abdomen to the lantern
    const ab = any(eF(34,40,6.5,5), eF(39,45,6,4.6));
    SH(ab, [26,34,46,51], 'sd', 'ol', 'wd', 'ol', 2);
    const ln = eF(lx, ly, 5.2, 4.6);
    SH(ln, [38,43,50,55], br ? glowC : 'lm', br ? 'lm' : 'gr', null, 'ol', 2);
    if (br) { R('cr', 41, 46, 3, 2); R('wh', 41, 46, 2, 1); } else P('yl', 42, 46);
    R('ol', 39, 46, 1, 6);
    // white wing cases
    const wl = bladeF(35,35,-2.25,11,3), wr = bladeF(37,34,-0.5,12,3.4);
    SH(wr, [34,26,50,40], 'wh', 'lg', null, 'ol', 1);
    SH(wl, [18,26,34,40], 'wh', 'lg', null, 'ol', 1);
    // head with red cap
    const hd = eF(30, 34, 8, 6.6);
    SH(hd, [21,27,39,41], 'sd', null, null, 'ol');
    const cap = (x,y)=>inE(x,y,30,31,8.6,5.2) && y <= 32;
    SH(cap, [20,24,40,33], 'rd', 'wn', 'pk', 'ol', 1);
    R('ol', 33, 27, 2, 2); P('ol', 26, 29); P('yl', 25, 31);
    // antennae with glowing tips
    LN('ol', 27, 26, 24+ant, 20); LN('ol', 33, 26, 36-ant, 20); P('lm', 23+ant, 19); P('lm', 37-ant, 19);
    // eyes
    for (const ex of [24, 31]) {
      if (shut || bl) { S(ex, 34, ['.cc.','c..c','.oo.']); continue; }
      if (squint) { S(ex, 33, ex < 28 ? ['cc..','.ccc','cc..'] : ['..cc','ccc.','..cc']); continue; }
      S(ex, 33, ['.cc.','cWoc','cooc','.cc.']);
      if (det) R('wd', ex, 33, 4, 1);
    }
    R('pk', 22, 38, 2, 1); R('pk', 36, 38, 2, 1);
    S(28, 38, rays >= 0 ? ['.pp.','pnnp','.pp.'] : ['p..p','.pp.']);
    // flash rays
    if (rays >= 0) {
      for (let i = 0; i < 8; i++) {
        const a = i*PI/4 + 0.2, r0 = 7, r1 = 10 + rays*6;
        LN(i%2 ? 'yl' : 'wh', lx + cs(a)*r0, ly + sn(a)*r0*0.85, lx + cs(a)*r1, ly + sn(a)*r1*0.85);
      }
      spark('wh', lx+14, ly-6, true);
    }
    if (st === 'entra') for (let i = 0; i < 5; i++) { const a = i*1.26 + p*8, r = 6 + (1-p)*16; P(i%2 ? 'yl' : 'lm', 32 + cs(a)*r, 40 + sn(a)*r*0.7); }
    // fireflies-friends blinking far away (idle only)
    if (st !== 'atk' && st !== 'hit' && st !== 'sono' && st !== 'entra') for (let i = 0; i < 3; i++) if (((t*1.1 + i*0.6) % 1.7) < 1.1) P('lm', [8,56,12][i], [24,20,44][i]);
  };

  // =========================================================== SAPO-CURURU
  W8['sapo-cururu'] = function(g,t,st,p){
    begin();
    const k = 1.35, X = x=>(x-32)*k+32, Y = y=>(y-45)*k+60;
    let pf = (t%2) >= 1.25, note = pf ? ((t%2) - 1.25)/0.75 : -1, bl = blink(t,3.9), shut = 0, squint = 0;
    let sq = 0, air = 0, legs = 0, shout = 0, mud = -1, hy = sn(t*2) > 0.5 ? -1 : 0, det = 0;
    if (st === 'atk') {
      const a = ak(p); pf = false; note = -1; bl = false; det = 1; hy = 0;
      if (p < 0.35) sq = a.w;
      else if (p < 0.55) { air = -rn(sn(cl(a.k,0,1)*PI*0.5+0.3)*8); legs = 1; shout = 1; }
      else { if (a.k < 0.18) { air = -3; legs = 1; } else if (a.k < 0.5) { sq = 0.8 - (a.k-0.18)*2; mud = (a.k-0.18)/0.32; } }
    } else if (st === 'hit') { ox = p < 0.5 ? -2 : -1; squint = 1; pf = false; note = -1; hy = 0; }
    else if (st === 'sono') { shut = 1; hy = sn(t*1.1) > 0 ? 0 : 1; pf = sn(t*1.1) > 0.3; note = -1; bl = false; }
    else if (st === 'entra') { if (p < 0.6) { air = -rn((1 - p/0.6)*14); legs = 1; } else if (p < 0.85) { sq = (0.85-p)/0.25; mud = (p-0.6)/0.25; } pf = false; note = -1; bl = false; }
    oy = air;
    const S2 = rn(sq*2.5), ey = S2 + hy;
    // stretched hind legs while airborne
    if (legs) for (const sd of [-1, 1]) {
      const lg = tubeF([32+sd*12, 52, 32+sd*15, 58, 32+sd*19, 61], 2.4);
      SH(lg, [32+sd*15-8, 48, 32+sd*15+8, 63], 'wo', 'wd', 'st', 'ol', 1);
      S(32+sd*19-3, 60, ['owtwo']);
    }
    const tb = any(eF(32,Y(36)+sq,15.5*k+sq*2.5,7.6*k-sq*1.2), eF(32,Y(28)+ey,12.8*k+sq,7*k), eF(X(24.5),Y(22)+ey,4.4*k,4.2*k), eF(X(39.5),Y(22)+ey,4.4*k,4.2*k), eF(X(19.5)-sq,Y(29.5)+ey,3.8*k,3.4*k), eF(X(44.5)+sq,Y(29.5)+ey,3.8*k,3.4*k));
    SH(tb, [6,20,58,60], 'wo', 'wd', 'st', 'ol', 2);
    F('st', (x,y)=>tb(x,y) && inE(x,y,32,Y(39)+sq,9*k+sq,5*k), 16, 44, 48, 60);
    F('cr', eF(X(30.5), Y(38)+sq, 4*k, 2*k), 20, 46, 40, 56);
    for (const w of [[19,31],[22,25],[29,23],[34,23],[42,25],[45,31],[17,36],[47,36],[25,29],[39,29]]) {
      const x = rn(X(w[0])), y = rn(Y(w[1])) + (w[1] < 33 ? ey : S2);
      R('sd', x, y, 2, 2); P('st', x, y);
    }
    // feet
    if (!legs) { S(12-S2, 56, ['.oooo..','owwwwo.','owotwto','.ooooo.']); S(45+S2, 56, ['..oooo.','.owwwwo','otwtowo','.ooooo.']); }
    // throat sac + note
    if (pf) {
      const sac = (x,y)=>inE(x,y,32,Y(35.5)+ey,7*k,4.6*k) && y > Y(31)+ey;
      SH(sac, [20,40+ey,44,56+ey], 'cr', 'st', null, 'ol', 2);
      R('wh', 26, 44+ey, 2, 1);
    }
    if (note >= 0) { const nx = 50 + rn(note*4), ny = 30 - rn(note*12); S(nx, ny, ['..cc','..c.','..c.','cc..','cc..']); }
    // mouth
    const my = 41 + ey;
    if (shout) {
      SH(eF(32, my+2, 9, 3.4), [21, my-3, 43, my+6], 'wn', null, null, 'ol');
      R('rd', 27, my+3, 10, 1); R('pk', 29, my+3, 5, 1);
    } else {
      R('ol', 21, my, 23, 1); R('ol', 17, my-1, 4, 1); R('ol', 44, my-1, 4, 1); P('ol', 16, my-2); P('ol', 48, my-2);
      R('wd', 22, my+1, 21, 1);
    }
    // heavy-lidded golden eyes
    for (const ex of [19, 39]) {
      const yy = 25 + ey;
      if (shut || bl) { S(ex, yy, ['.dddd.','dddddd','oooooo','.yyyy.']); continue; }
      if (squint) { S(ex, yy+1, ex < 30 ? ['oo....','..oooo','oo....'] : ['....oo','oooo..','....oo']); continue; }
      S(ex, yy, det ? ['.dddd.','oooooo','yyyWoy','.yyyy.'] : ['.dddd.','oooooo','yyyWoy','yyyooy','.yyyy.']);
    }
    // mud splash on landing
    if (mud >= 0) for (let i = 0; i < 4; i++) for (const sd of [1,-1]) {
      const x = 32 + sd*(22 + i*3 + mud*5), y = 58 - (i%2 ? 3 : 1) - mud*6 + mud*mud*5;
      R(i%2 ? 'wd' : 'wo', x, y, 2, 1); P('sd', x+sd, y+1);
    }
  };

  // =========================================================== CAGADO RANZINZA
  W8['cagado-ranzinza'] = function(g,t,st,p){
    begin();
    let hx = 13 + (sn(t*0.9) > 0.6 ? -1 : 0), hy = 38, mo = 0, tw = (t%3) > 1.2 && (t%3) < 1.5 ? -1 : 0, bl = blink(t,3.4);
    let inShell = 0, shut = 0, squint = 0, chew = fl(t*3)%4 === 1 ? 1 : 0, legsIn = 0, bump = 0, glint = fl(t*1.5)%5 === 0, huff = (t%3) > 2.2 && (t%3) < 2.6;
    if (st === 'atk') {
      const a = ak(p); bl = false; chew = 0; tw = 1; huff = false;
      if (p < 0.35) { hx = lerp(13, 17, a.w); hy = lerp(38, 37, a.w); }
      else if (p < 0.55) { hx = 11; hy = 41; mo = 4; }
      else { const u = cl(a.k*1.5,0,1); hx = lerp(11, 13, u); hy = lerp(43, 38, u); mo = a.k < 0.12 ? 3 : 0; }
      hx = rn(hx); hy = rn(hy);
    } else if (st === 'hit') { inShell = 1; ox = p < 0.5 ? -1 : 0; bump = p < 0.3 ? -1 : 0; squint = 1; huff = false; }
    else if (st === 'sono') { inShell = 1; shut = 1; legsIn = 1; bump = sn(t*1.1) > 0 ? 0 : 1; huff = false; }
    else if (st === 'entra') {
      if (p < 0.35) { inShell = 1; legsIn = 1; bump = -rn(sn(p/0.35*PI)*5); }
      else if (p < 0.5) { inShell = 1; legsIn = 0; }
      else { const u = cl((p-0.5)/0.3, 0, 1); hx = rn(lerp(21, 13, u)); hy = rn(lerp(44, 38, u)); tw = -1; }
      bl = false; chew = 0; huff = false;
    }
    oy = bump;
    const scx = 39, scy = 45, srx = 18.5, sry = 20;
    // legs + tail
    if (!legsIn) {
      for (const L of [[26,53],[54,53],[41,54]]) {
        const lf = any((x,y)=>inE(x,y,L[0],L[1],3.6,6) && y >= L[1]-6, eF(L[0]-1, L[1]+4, 4.6, 2.2));
        SH(lf, [L[0]-7, L[1]-7, L[0]+6, L[1]+7], 'gy', 'gd', null, 'ol', 1);
        P('gd', L[0]-1, L[1]+1); P('gd', L[0]+1, L[1]+3); P('lg', L[0]-2, L[1]-1);
        S(L[0]-5, L[1]+5, ['c.c.c']);
      }
      S(58, 49, ['oo..','oYoo','.ooo']);
    }
    // neck (behind the shell)
    if (!inShell) SH(tubeF([30, 47, hx+5, hy+3], 3.8), [hx-2, hy-4, 36, 54], 'gy', 'gd', null, 'ol', 1);
    // shell: high dome + rim
    const dome = (x,y)=>inE(x,y,scx,scy,srx,sry) && y <= scy;
    const rim = eF(scx, scy+0.5, srx+2.2, 3.4);
    const sh = any(dome, rim);
    SH(sh, [16,24,62,50], 'wo', 'wd', null, 'ol', 2);
    const pc = [[39,28.5],[30,34],[48,34],[39,39.5],[23,42],[55,42]];
    const pl = (x,y)=>{ let d1 = 1e9, d2 = 1e9, k = -1; for (let i = 0; i < pc.length; i++) { const dx = x+0.5-pc[i][0], dy = (y+0.5-pc[i][1])*1.25, d = Math.sqrt(dx*dx+dy*dy); if (d < d1) { d2 = d1; d1 = d; k = i; } else if (d < d2) d2 = d; } return [d1,d2,k]; };
    const inner = (x,y)=>inE(x,y,scx,scy,srx-1.8,sry-1.8) && y <= scy-1;
    for (let y = 25; y <= scy; y++) for (let x = 19; x <= 59; x++) {
      if (!inner(x,y)) continue;
      const q = pl(x,y), d = q[1]-q[0];
      if (d < 1.2) P('sd', x, y);
      else if (d >= 2.4) { const c = pc[q[2]]; P((x+0.5-c[0]) + (y+0.5-c[1]) < -3.6 ? 'cr' : 'st', x, y); }
    }
    F('wd', (x,y)=>dome(x,y) && y > scy-3 && !rim(x,y), 17, scy-3, 61, scy);
    F('wd', (x,y)=>rim(x,y) && y >= scy+1, 16, scy, 62, scy+4);
    for (let x = 21; x < 59; x += 4) R('sd', x, scy, 1, 3);
    R('st', 19, scy-1, 40, 1);
    // moss tufts
    S(33, 23, ['..l..l','.lggll','GGGGGG']);
    S(44, 25, ['.l.l','lggl','GGGG']);
    P('lm', 52, 30); P('gr', 53, 31);
    if (inShell) {
      // retracted: dark opening with the spectacles peeking out
      SH(eF(22, 45, 5.4, 3.8), [15, 40, 29, 50], 'sd', null, null, 'ol');
      S(17, 42, ['.L..L.','L.LL.L','.L..L.']);
      if (shut) { R('ol', 18, 43, 1, 1); R('ol', 21, 43, 1, 1); }
      else { P('wh', 18, 43); P('wh', 21, 43); }
      S(16, 40, squint ? ['.LL..LL.'] : ['LL....LL']);
      if (st === 'entra' && p >= 0.35) { R('gy', 13, 45, 3, 1); P('ol', 12, 45); }
      return;
    }
    // head (in front of the shell rim)
    const hd = any(eF(hx, hy, 9, 7.4), eF(hx-6.5, hy+3, 4.4, 3.4));
    if (mo) {
      const cut = hy+4;
      SH((x,y)=>y >= cut && y < cut+mo && hd(x, cut) && x < hx+3, [hx-12, cut, hx+4, cut+mo], 'wn', null, null, 'ol');
      R('rd', hx-8, cut+mo-1, 6, 1);
      SH((x,y)=>y >= cut+mo && hd(x, y-mo), [hx-12, cut+mo, hx+10, hy+9+mo], 'gy', 'gd', null, 'ol', 1);
      SH((x,y)=>y < cut && hd(x,y), [hx-12, hy-8, hx+10, cut], 'gy', null, null, 'ol', 1);
      P('cr', hx-9, cut); P('cr', hx-6, cut);
    } else {
      SH(hd, [hx-12, hy-8, hx+10, hy+9], 'gy', 'gd', null, 'ol', 1);
      F('gd', (x,y)=>hd(x,y) && y >= hy+5, hx-12, hy+4, hx+10, hy+9);
      R('ol', hx-10, hy+4+chew, 12, 1); P('ol', hx+2, hy+5); P('ol', hx+3, hy+6); P('ol', hx-11, hy+5);
    }
    // wrinkles + nostrils
    P('gd', hx+5, hy+2); P('gd', hx+6, hy+3); P('gd', hx+5, hy+5); P('gd', hx-2, hy-6); P('gd', hx+3, hy-6);
    P('ol', hx-10, hy+1); P('ol', hx-8, hy+1);
    if (huff) { P('lg', hx-13, hy); P('wh', hx-14, hy-1); }
    // round spectacles + beady eyes
    for (const ex of [hx-8, hx-2]) S(ex, hy-4, ['.LLL.','L...L','L...L','L...L','.LLL.']);
    P('lg', hx-3, hy-2); LN('lg', hx+3, hy-2, hx+7, hy-3);
    for (const ex of [hx-7, hx-1]) {
      if (bl) R('ol', ex, hy-2, 3, 1);
      else if (squint) { R('ol', ex, hy-2, 3, 1); P('ol', ex+1, hy-1); }
      else { R('ol', ex, hy-2, 2, 2); P('wh', ex, hy-2); }
    }
    if (glint) { P('wh', hx-5, hy-3); P('wh', hx+1, hy-3); }
    // bushy grumpy brows
    S(hx-10, hy-7+tw, ['LLL....','.WLLLL.','....LL.']);
    S(hx-1, hy-7+tw, ['....LLL','.LLLLW.','.LL....']);
    if (mo) { P('wh', hx-15, hy+1); LN('lg', hx-16, hy+4, hx-13, hy+4); }
  };

  // =========================================================== SUCURI DO CHARCO
  W8['sucuri-do-charco'] = function(g,t,st,p){
    begin();
    let hx = 34 + rn(sn(t*1.2)*1.6), hy = 12 + rn(sn(t*2.4)*0.6), mo = 0, tg = (t%1.6) > 1.25, bl = blink(t,4.6), shut = 0, squint = 0;
    let tail = 0, fb = blink(t,2.7,1.1), rest = 0, br = sn(t*1.6) > 0.4 ? 1 : 0, fang = 0;
    if (st === 'atk') {
      const a = ak(p); bl = false; tg = false;
      if (p < 0.35) { hx = lerp(34, 28, a.w); hy = lerp(12, 8, a.w); mo = rn(a.w*2); tail = -a.w; }
      else if (p < 0.55) { hx = 47; hy = 22; mo = 5; fang = 1; tail = 1; }
      else { const u = cl(a.k*1.4, 0, 1); hx = lerp(47, 34, u); hy = lerp(22, 12, u); mo = a.k < 0.15 ? 4 : 0; tail = 1 - u; }
      hx = rn(hx); hy = rn(hy);
    } else if (st === 'hit') { ox = p < 0.5 ? -2 : -1; hx = 31; hy = 10; squint = 1; tg = false; br = 1; }
    else if (st === 'sono') { rest = 1; shut = 1; hx = 25; hy = 35; tg = false; br = sn(t*1.0) > 0 ? 1 : 0; }
    else if (st === 'entra') { const u = 1 - Math.pow(1-p, 2); hx = rn(lerp(30, 34, u)); hy = rn(lerp(40, 12, u)); mo = p > 0.4 && p < 0.8 ? 3 : 0; tg = p > 0.45; }
    const snake = (f,bb)=>SH(f, bb, 'gr', 'gd', 'lm', 'ol', 2);
    const spots = pts=>{ for (const q of pts) { R('ol', q[0]-1, q[1], 3, 1); P('ol', q[0], q[1]-1); P('gd', q[0], q[1]); } };
    const ring = (cx,cy,rx,ry,a0,a1)=>{ const o = []; for (let i = 0; i <= 10; i++) { const a = a0 + (a1-a0)*i/10; o.push(cx + cs(a)*rx, cy + sn(a)*ry); } return o; };
    const ar = 21 + br*0.5, brx = 15 + br*0.5;
    // bottom coil (back half), middle coil (back half)
    snake(tubeF(ring(32,51.5,ar,4.5,PI,2*PI), 4), [6,42,58,58]);
    snake(tubeF(ring(31,43,brx,3.4,PI,2*PI), 3.6), [12,35,50,50]);
    // neck rising from the middle coil
    const nb = [41, 41], nm1 = [lerp(46, (41+hx)/2+6, 0.5), lerp(34, (41+hy)/2, 0.3)];
    const neck = rest ? [41,42, 38,38, 32,36, hx+3,hy] : [nb[0],nb[1], nm1[0],nm1[1], (nm1[0]+hx)/2+3, (nm1[1]+hy)/2+2, hx+2, hy+3];
    const nf = tubeF(neck, 3.2);
    snake(nf, [20,0,58,46]);
    F('lm', (x,y)=>nf(x,y) && !nf(x-1,y) && !nf(x-1,y+1) && y > hy+6, 20, 0, 58, 46);
    for (let i = 1; i < 3; i++) { const x = rn(lerp(neck[0], neck[6], i/3)), y = rn(lerp(neck[1], neck[7], i/3)); spots([[x+1, y]]); }
    // middle coil front, bottom coil front
    snake(tubeF(ring(31,43,brx,3.4,0,PI), 3.6), [12,38,50,52]);
    F('lm', (x,y)=>y >= 46 && y <= 47 && inE(x,y,31,43,brx-1,6) && !inE(x,y,31,43,brx-4,3.8), 14, 45, 48, 48);
    spots([[20,46],[31,47],[41,46]]);
    // tail tip (whips during the attack)
    const tt = tail > 0 ? [10,56, 4,52, 1+tail*4,44-tail*6] : tail < 0 ? [10,56, 5,55, 2,58] : [10,56, 5,55, 3+rn(sn(t*2)),51];
    SH(bezF(tt[0],tt[1], tt[2],tt[3], tt[4],tt[5], 3, 0.8), [0,36,16,60], 'gr', 'gd', 'lm', 'ol', 1);
    snake(tubeF(ring(32,51.5,ar,4.5,0,PI), 4), [6,46,58,61]);
    spots([[16,55],[27,57],[38,57],[48,55]]);
    for (const q of [[12,48],[25,51],[43,51],[18,40],[36,40]]) R('wh', q[0], q[1], 2, 1);
    // the tiny unafraid frog riding the coil
    if (!fang) S(13, 34, ['.oo.oo.', fb ? 'oloolo.' : 'olWolWo','ogggggo','pgggggp','.ooooo.'].map(r=>r.replace('.o','.o')));
    // head
    if (mo) {
      const u = rn(mo*0.6), jy = hy + 4 + (mo - u);
      hy -= u;
      SH((x,y)=>y >= hy+3 && y <= jy && x >= hx-10 && x <= hx+3, [hx-11, hy+2, hx+4, jy+1], 'wn', null, null, 'ol');
      R('rd', hx-7, jy-1, 7, 1);
      SH(eF(hx-2, jy+0.5, 7.5, 2.2), [hx-11, jy-3, hx+7, jy+4], 'lm', 'gr', null, 'ol', 1);
    }
    const hd = any(eF(hx+3, hy, 8, 5.2), eF(hx-3, hy+2, 6, 3.6));
    SH(hd, [hx-10, hy-6, hx+12, hy+6], 'gr', 'gd', 'lm', 'ol', 2);
    if (!mo) { R('lm', hx-6, hy+4, 11, 1); R('ol', hx-7, hy+3, 13, 1); P('ol', hx+6, hy+2); P('ol', hx-8, hy+2); }
    if (fang) { R('wh', hx-7, hy+5, 1, 2); R('wh', hx-2, hy+5, 1, 2); }
    P('ol', hx-7, hy+1); P('ol', hx-5, hy);
    spots([[hx+6, hy-3]]); P('ol', hx+9, hy-1);
    // sleepy golden eyes
    for (const ex of [hx-2, hx+5]) {
      if (shut || bl) { R('ol', ex, hy-1, 4, 1); continue; }
      if (squint) { R('ol', ex, hy-2, 4, 1); P('ol', ex+1, hy-1); P('ol', ex+2, hy); continue; }
      R('ol', ex, hy-3, 4, 1); R('gd', ex, hy-2, 4, 1); R(fang ? 'or' : 'yl', ex, hy-1, 4, 1); P('ol', ex+1, hy-1); P('wh', ex+3, hy-1); R('ol', ex, hy, 4, 1);
    }
    // forked tongue
    const tx = hx-9;
    if (tg) { R('rd', tx-1, hy+2, 2, 1); P('rd', tx-2, hy+1); P('rd', tx-2, hy+3); P('rd', tx-3, hy); P('rd', tx-3, hy+4); }
    if (fang) { LN('lg', hx-14, hy-6, hx-10, hy-2); LN('lg', hx-15, hy+2, hx-11, hy+2); }
    if (st === 'entra') { clipRows(61, 63); for (let i = 0; i < 4; i++) { const u = (p*2 + i*0.25) % 1; P(i%2 ? 'tq' : 'sk', 10 + i*14, 58 - u*8); } }
  };

  // =========================================================== GIRINO
  W8['girino'] = function(g,t,st,p){
    begin();
    let ph = t*7, bob = rn(sn(t*2.2)*1.6), bl = blink(t,3.2), shut = 0, squint = 0, sq = 0, spit = -1, puffC = 0, bub = 1;
    if (st === 'atk') {
      const a = ak(p); bl = false; bub = 0;
      if (p < 0.35) { puffC = a.w; ph = p*30; bob = 1; }
      else if (p < 0.55) { spit = a.k; ph = p*50; bob = 0; }
      else { spit = a.k < 0.4 ? 1 + a.k*2 : -1; ph = p*20; bob = 0; }
    } else if (st === 'hit') { ox = p < 0.5 ? 2 : 1; squint = 1; sq = p < 0.5 ? 1 : 0.5; bob = 0; bub = 0; }
    else if (st === 'sono') { shut = 1; ph = t*1.5; bob = sn(t*1.2) > 0 ? 2 : 3; bub = 2; }
    else if (st === 'entra') { bob = -rn(sn(p*PI)*8); sq = p > 0.75 ? (1-p)*3 : 0; bub = 0; }
    oy = bob;
    const cx = 30, cy = 44, w = sn(ph);
    // tail
    const tl = bezF(cx+8, cy, cx+17, cy - 3 + w*6, cx+29, cy - 9 - w*4, 3.8, 1.1);
    SH(tl, [cx+4, cy-20, 63, cy+12], 'gr', 'gd', 'lm', 'ol', 1);
    F('lm', (x,y)=>tl(x,y) && !tl(x,y-1), cx+4, cy-20, 63, cy+12);
    // body
    const bd = eF(cx, cy + sq, 12 + puffC*1.5 + sq*1.5, 11 - sq*1.5);
    SH(bd, [cx-14, cy-12, cx+14, cy+12], 'gr', 'gd', 'lm', 'ol', 2);
    F('lm', (x,y)=>bd(x,y) && inE(x,y,cx-1,cy+5+sq,7.5,4), cx-12, cy, cx+10, cy+12);
    F('cr', eF(cx-3, cy+5.5+sq, 3.4, 1.3), cx-7, cy+2, cx+1, cy+8);
    if (puffC > 0.4) { R('pk', cx-9, cy+2, 2, 1); }
    // tiny spike bump
    S(cx, cy-14+rn(sq), ['.o.','olo','olo']);
    // big eye
    const ex = cx-8, ey = cy-6+rn(sq);
    if (shut || bl) { S(ex, ey+2, ['.ooooo.','o.....o']); }
    else if (squint) { S(ex+1, ey+1, ['oo...','..ooo','oo...']); }
    else { S(ex, ey, ['.ooooo.','oWWWooo','oWWoooo','oWooooo','ooooooo','.ooooo.']); P('lg', ex+4, ey+4); }
    // mouth
    if (spit >= 0 && spit <= 1) { SH(eF(cx-11, cy+2, 2, 1.6), [cx-14, cy, cx-8, cy+4], 'wn', null, null, 'ol'); }
    else R('ol', cx-13, cy+2, 4, 1);
    // water squirt
    if (spit >= 0) {
      const x0 = cx-14, L = spit <= 1 ? rn(3 + spit*7) : 10, dr = spit > 1 ? rn((spit-1)*4) : 0;
      if (spit <= 1) { R('sk', x0-L, cy+1, L, 2); R('wh', x0-L+1, cy+1, L-2, 1); P('tq', x0-L, cy+3); }
      for (let i = 0; i < 4; i++) {
        const x = x0 - L - 1 - i*3 - dr, y = cy + (i%2 ? -2 : 3) - (i === 3 ? 2 : 0);
        R('sk', x, y, 2, 2); P('wh', x, y); P('tq', x+1, y+1);
      }
    }
    if (puffC > 0) { P('sk', cx-14, cy+1); }
    // bubbles
    if (bub) for (let k = 0; k < 2; k++) {
      const u = (t*0.5 + k*0.5) % 1;
      if (u < 0.85) { const r = bub === 2 ? 1.6 : 1.1, x = cx-12 - k*3 + sn(t*3+k), y = cy - 6 - u*16; F('sk', (a,b)=>{ const d = Math.hypot(a+0.5-x, b+0.5-y); return d <= r+0.5 && d > r-0.6; }, x-3, y-3, x+3, y+3); P('wh', x-1, y-1); }
    }
    if (st === 'entra' && p > 0.6) for (let i = 0; i < 3; i++) for (const sd of [1,-1]) { const u = (p-0.6)/0.4, x = 30 + sd*(14 + i*4 + u*6), y = 58 - i*2 - u*5; R('sk', x, y, 2, 1); P('tq', x, y+1); }
  };
  for (const id of Object.keys(W8)) {
    const draw = W8[id];
    window.CHAR_SPRITE[id] = function(g,t,st,p){
      t = +t || 0; p = cl(+p || 0, 0, 1);
      draw(g, t, st, p); out(g);
    };
  }
})();
