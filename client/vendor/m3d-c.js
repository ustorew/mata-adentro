/* m3d-c.js (v10): modelos 3D chibi-heroicos de Aguas (Povo d'Agua). IIFE; unico global: window.CHAR3D.
   Contrato: MODELOS3D.md + spec-v10 12.2: CHAR3D[id](T,kit,o), o.asc 0..3 (III = detalhe proprio), olhos userData.olho, corpo userData.corpo. */
(function(){
'use strict';
var C = window.CHAR3D = window.CHAR3D || {};
var PI = Math.PI, sin = Math.sin, cos = Math.cos, abs = Math.abs;

/* ---------- curvas ---------- */
function cl(x){ return x < 0 ? 0 : x > 1 ? 1 : x; }
function sm(x){ x = cl(x); return x * x * (3 - 2 * x); }
function lerp(a, b, u){ return a + (b - a) * u; }
function fr(x){ return x - Math.floor(x); }
function atkW(p){ return p < 0.35 ? sm(p / 0.35) : 1 - sm((p - 0.35) / 0.12); }
function atkS(p){ return p < 0.35 ? 0 : p < 0.45 ? sm((p - 0.35) / 0.1) : p < 0.58 ? 1 : 1 - sm((p - 0.58) / 0.42); }
function hitH(p){ return Math.sin(PI * cl(p)); }
function backOut(x){ x = cl(x); var c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
function blink(t, per, off){ var u = ((t + off) % per + per) % per; return u < 0.16 ? Math.abs(u - 0.08) / 0.08 : 1; }
function pulse(t, per, off, len){ var u = ((t + off) % per + per) % per; return u < len ? Math.sin(PI * u / len) : 0; }
function norm(st){ return (st === 'atk' || st === 'hit' || st === 'sono' || st === 'entra') ? st : 'idle'; }
function num(x){ return (typeof x === 'number' && isFinite(x)) ? x : 0; }
/* estado do quadro: A preparo, S golpe, H susto, Z dormindo, E entrada (0..1, com sobra) */
function Q(st, t, p){
  st = norm(st); t = num(t); p = cl(num(p));
  var q = { st: st, t: t, p: p, A: 0, S: 0, H: 0, Z: 0, E: 1, e: 1 };
  if (st === 'atk'){ q.A = atkW(p); q.S = atkS(p); }
  else if (st === 'hit') q.H = hitH(p);
  else if (st === 'sono') q.Z = 1;
  else if (st === 'entra'){ q.e = sm(p / 0.8); q.E = backOut(p / 0.8); }
  return q;
}
/* pose base do corpo: entrada (cresce girando), susto (recua e tomba para tras) */
function base(b, q, lean){
  var e = Math.max(0.02, q.E);
  b.scale.set(e, e, e);
  b.position.set(0, 0, -0.1 * q.H);
  b.rotation.set(-(lean == null ? 0.22 : lean) * q.H, (1 - q.e) * -2.4, q.st === 'hit' ? Math.sin(q.p * PI * 3) * 0.07 * (1 - q.p) : 0);
}

/* ---------- kit local (nao depende do kit do motor) ---------- */
function mk(T, o){
  o = o || {};
  var K = { T: T, asc: (o.asc | 0) }, G = {}, M = {};
  function geo(k, f){ return G[k] || (G[k] = f()); }
  var SEG = [[6, 4], [10, 7], [14, 10], [20, 14]];
  K.sph = function(q){ q = q == null ? 2 : q; return geo('s' + q, function(){ return new T.SphereGeometry(1, SEG[q][0], SEG[q][1]); }); };
  K.hemi = function(q){ q = q == null ? 2 : q; return geo('h' + q, function(){ return new T.SphereGeometry(1, SEG[q][0], Math.ceil(SEG[q][1] / 2), 0, PI * 2, 0, PI / 2); }); };
  K.cyl = function(rt, rb, seg, open){ var k = 'c' + rt + '_' + rb + '_' + (seg || 12) + (open ? 'o' : ''); return geo(k, function(){ return new T.CylinderGeometry(rt, rb, 1, seg || 12, 1, !!open); }); };
  K.cone = function(seg){ return geo('k' + (seg || 10), function(){ return new T.ConeGeometry(1, 1, seg || 10); }); };
  K.cap = function(r, len, rs){ var k = 'p' + r + '_' + len + '_' + (rs || 10); return geo(k, function(){ return new T.CapsuleGeometry(r, len, 3, rs || 10); }); };
  K.tor = function(R, r, rs, ts, arc){ var k = 't' + [R, r, rs, ts, arc].join('_'); return geo(k, function(){ return new T.TorusGeometry(R, r, rs || 6, ts || 20, arc || PI * 2); }); };
  K.oct = function(){ return geo('o', function(){ return new T.OctahedronGeometry(1, 0); }); };
  K.ico = function(){ return geo('i', function(){ return new T.IcosahedronGeometry(1, 0); }); };
  K.box = function(){ return geo('b', function(){ return new T.BoxGeometry(1, 1, 1); }); };
  K.disc = function(seg, ts, tl){ var k = 'dc' + seg + '_' + ts + '_' + tl; return geo(k, function(){ return new T.CylinderGeometry(1, 1, 1, seg || 16, 1, false, ts || 0, tl || PI * 2); }); };
  K.lathe = function(k, pts, seg){ return geo('l' + k, function(){ return new T.LatheGeometry(pts.map(function(p){ return new T.Vector2(p[0], p[1]); }), seg || 16); }); };
  K.ext = function(k, pts, depth, bev){ return geo('e' + k, function(){
    var s = new T.Shape(); s.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    var g = new T.ExtrudeGeometry(s, { depth: depth || 0.04, bevelEnabled: !!bev, bevelThickness: bev || 0, bevelSize: bev || 0, bevelSegments: 1, curveSegments: 4 });
    g.translate(0, 0, -(depth || 0.04) / 2); return g; }); };
  K.geo = geo;
  function mp(c, o){
    var p = { color: c, roughness: o.r != null ? o.r : 0.62, metalness: o.m || 0 };
    if (o.e != null){ p.emissive = o.e; p.emissiveIntensity = o.ei != null ? o.ei : 1; }
    if (o.op != null){ p.transparent = true; p.opacity = o.op; p.depthWrite = false; }
    if (o.ds) p.side = T.DoubleSide;
    if (o.fs) p.flatShading = true;
    if (o.add) p.blending = T.AdditiveBlending;
    return new T.MeshStandardMaterial(p);
  }
  K.mat = function(c, o){
    o = o || {};
    var k = c + '|' + [o.r, o.m, o.e, o.ei, o.op, o.ds, o.fs, o.add].join(',');
    return M[k] || (M[k] = mp(c, o));
  };
  K.own = function(c, o){ return mp(c, o || {}); };           /* material proprio (a animacao mexe nele) */
  K.glow = function(c, k, o){ o = o || {}; o.e = c; o.ei = k == null ? 1.6 : k; o.r = o.r == null ? 0.4 : o.r; return K.mat(c, o); };
  K.corpo = function(m){ m.userData.corpo = true; return m; };
  K.m = function(par, g, mat, x, y, z, sx, sy, sz){
    var me = new T.Mesh(g, mat);
    me.position.set(x || 0, y || 0, z || 0);
    if (sx != null) me.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz);
    me.castShadow = !mat.transparent; me.receiveShadow = !mat.transparent;
    par.add(me); return me;
  };
  K.grp = function(par, x, y, z){ var g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); if (par) par.add(g); return g; };
  K.rot = function(ob, x, y, z){ ob.rotation.set(x || 0, y || 0, z || 0); return ob; };
  /* olho vivo: branco + iris + pupila + brilho; risco quando fechado. o: {r,x,y,z,ry,rz,iris,pupil,slit,lid(cor da palpebra),lv(0..1 caida)} */
  K.eye = function(par, o){
    var r = o.r, g = K.grp(par, o.x, o.y, o.z);
    g.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
    var ball = K.grp(g), wm = K.mat(o.white != null ? o.white : 0xFFFBF0, { r: 0.25, e: o.we, ei: o.wei });
    var w = K.m(ball, K.sph(o.q == null ? 2 : o.q), wm, 0, 0, 0, r); w.userData.olho = true;
    var look = K.grp(ball);
    var ir = r * (o.ir || 0.66), ic = Math.sqrt(r * r - ir * ir) * 0.96;
    var im = K.mat(o.iris != null ? o.iris : 0x3A2A1A, { r: 0.3, e: o.ie, ei: o.iei });
    var iris = K.m(look, K.sph(1), im, 0, 0, ic, ir, ir, r * 0.32); iris.userData.olho = true;
    var pr = r * (o.pr || 0.38);
    var pu = K.m(look, K.sph(1), K.mat(o.pupil || 0x0C0A10, { r: 0.2 }), 0, 0, ic + r * 0.2, o.slit ? pr * 0.36 : pr, o.slit ? pr * 1.6 : pr, r * 0.12);
    pu.userData.olho = true;
    var hm = K.mat(0xFFFFFF, { r: 0.1, e: 0xFFFFFF, ei: 1.2 });
    K.m(look, K.sph(0), hm, r * 0.3, r * 0.32, ic + r * 0.26, r * 0.2).userData.olho = true;
    var lid = null;
    if (o.lid != null){ lid = K.m(g, K.hemi(1), K.mat(o.lid, { r: 0.65, ds: true }), 0, 0, 0, r * 1.1); }
    var arc = K.m(g, K.tor(r * 0.7, r * 0.13, 4, 10, PI), K.mat(o.line || 0x1A1014, { r: 0.6 }), 0, -r * 0.1, r * 0.92, 1, 0.8, 1);
    arc.rotation.z = PI; arc.visible = false;
    var api = { g: g, ball: ball, look: look, lid: lid, lv: o.lv || 0,
      set: function(open, lx, ly){
        open = cl(open == null ? 1 : open);
        var closed = open < 0.2;
        ball.visible = !closed; arc.visible = closed;
        if (lid){ lid.visible = !closed; var l = cl(Math.max(api.lv, 1 - open)); lid.rotation.x = -PI / 2 - 0.2 + l * PI * 0.62; }
        else ball.scale.set(1, Math.max(open, 0.15), 1);
        look.rotation.set(-(ly || 0) * 0.4, (lx || 0) * 0.4, 0);
      } };
    api.set(1);
    return api;
  };
  /* olho oco de assombracao: cavidade escura + brasa de luz dentro */
  K.geye = function(par, o){
    var g = K.grp(par, o.x, o.y, o.z); g.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
    var sk = K.m(g, K.sph(1), K.mat(o.sock != null ? o.sock : 0x05060C, { r: 0.9 }), 0, 0, 0, o.r, o.r * (o.sy || 1.25), o.r * 0.5);
    var gm = o.own ? K.own(o.c, { e: o.c, ei: o.k || 2.2, r: 0.4 }) : K.glow(o.c, o.k || 2.2);
    var gl = K.m(g, K.sph(1), gm, 0, -o.r * 0.1, o.r * 0.32, o.r * 0.5, o.r * 0.5 * (o.sy || 1.25), o.r * 0.25);
    sk.userData.olho = true; gl.userData.olho = true;
    return { g: g, glow: gl, mat: gm, set: function(open){ open = cl(open == null ? 1 : open); g.scale.set(1, Math.max(0.12, open), 1); gl.visible = open > 0.2; } };
  };
  return K;
}
/* =========================================================
   SAPINHO DO IGARAPE (sapinho-verruguento)
   sapinho azul-esverdeado, verrugas turquesa que brilham, chapeu de folha de vitoria-regia
   ataque: barrigada (pula e cai de barriga)
   ========================================================= */
C['sapinho-verruguento'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var skin = K.corpo(K.mat(0x2C7A70, { r: 0.5 })), dk = K.mat(0x1B4E52, { r: 0.55 }), bel = K.mat(0x9FD6B2, { r: 0.6 });
  var wm = K.own(0x5FF2DC, { r: 0.35, e: 0x2FE8D0, ei: asc >= 3 ? 2.6 : 1.0 });
  var line = K.mat(0x0E1E22, { r: 0.6 }), pad = K.mat(0x3F8F3A, { r: 0.55, ds: true }), padD = K.mat(0x2C6A2E, { r: 0.6 });
  var flor = K.mat(0xF08AB8, { r: 0.5 }), flc = K.glow(0xFFE07A, 0.8);
  K.m(b, K.sph(3), skin, 0, 0.3, -0.04, 0.45, 0.3, 0.42);
  K.m(b, K.sph(2), dk, 0, 0.4, -0.14, 0.36, 0.2, 0.3);
  K.m(b, K.sph(2), bel, 0, 0.25, 0.17, 0.33, 0.21, 0.24);
  var hd = K.grp(b, 0, 0.5, 0.06);
  K.m(hd, K.sph(3), skin, 0, 0.04, 0.02, 0.4, 0.24, 0.34);
  var eyes = [], brows = [];
  [-1, 1].forEach(function(s){
    K.m(hd, K.sph(2), skin, s * 0.17, 0.2, 0.06, 0.135);
    eyes.push(K.eye(hd, { r: 0.105, x: s * 0.18, y: 0.23, z: 0.13, ry: s * 0.3, iris: 0xE9A21C, pr: 0.4 }));
    var bw = K.m(hd, K.cap(0.026, 0.12, 6), line, s * 0.17, 0.35, 0.17); bw.rotation.z = PI / 2 + s * 0.42; brows.push(bw);
  });
  var mouth = K.m(hd, K.tor(0.29, 0.015, 4, 16, PI), line, 0, -0.04, 0.02, 1.15, 1, 1.12); mouth.rotation.x = PI / 2;
  var th = [], ar = [];
  [-1, 1].forEach(function(s){
    var g = K.grp(b, s * 0.33, 0.15, -0.06);
    K.m(g, K.sph(2), skin, 0, 0, 0, 0.18, 0.15, 0.24);
    K.m(g, K.sph(1), dk, s * 0.06, -0.12, 0.2, 0.13, 0.035, 0.14);
    th.push(g);
    var a = K.grp(b, s * 0.21, 0.24, 0.27);
    K.m(a, K.cap(0.06, 0.12, 8), skin, 0, -0.08, 0);
    K.m(a, K.sph(1), dk, 0, -0.19, 0.04, 0.085, 0.025, 0.075);
    ar.push(a);
  });
  // verrugas
  var W = [[0.4, 0.55, -0.1], [-0.35, 0.5, -0.12], [0.15, 0.62, -0.25], [-0.18, 0.6, -0.3], [0.38, 0.35, -0.3], [-0.4, 0.3, -0.26], [0, 0.66, -0.06], [0.28, 0.66, 0.02], [-0.27, 0.65, 0.0]];
  W.forEach(function(w, i){ K.m(b, K.sph(1), wm, w[0], w[1], w[2], i % 3 ? 0.045 : 0.06); });
  // chapeu de folha
  var hat = K.grp(hd, 0.04, 0.32, 0.0); hat.rotation.set(0.2, 0, 0.18);
  K.m(hat, K.disc(18, 0.3, PI * 2 - 0.6), pad, 0, 0, 0, 0.3, 0.018, 0.3);
  K.m(hat, K.tor(0.3, 0.012, 3, 18, PI * 2 - 0.6), padD, 0, 0.01, 0, 1, 1, 1).rotation.set(PI / 2, 0, 0.3);
  var fl = K.grp(hat, -0.12, 0.02, -0.08);
  K.m(fl, K.sph(1), flor, 0, 0.05, 0, 0.06, 0.07, 0.06);
  K.m(fl, K.sph(0), flc, 0, 0.13, 0, 0.022);
  var stars = [];
  if (asc >= 3){
    var sm2 = K.glow(0xE6FFFA, 3.0);
    for (var i = 0; i < 4; i++) stars.push(K.m(b, K.oct(), sm2, 0, 0.8, 0, 0.035, 0.06, 0.035));
  }
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q);
    var br = q.Z ? sin(t * 1.6) * 0.03 : sin(t * 3.1) * 0.02;
    var hop = q.st === 'atk' ? 0.32 * Math.sin(PI * cl((q.p - 0.3) / 0.26)) : 0;
    if (q.st === 'entra') hop += 0.3 * Math.sin(PI * cl(q.p / 0.7));
    b.position.y += -0.05 * q.A + hop - (q.Z ? 0.03 : 0);
    b.position.z += 0.32 * q.S;
    b.rotation.x += -0.2 * q.A + 0.55 * q.S + (q.Z ? 0.1 : 0);
    b.scale.y *= 1 + br - 0.1 * q.A + 0.08 * q.S;
    hd.rotation.set(-0.1 * q.A + 0.15 * q.H + (q.Z ? 0.12 : 0), q.Z ? 0 : sin(t * 0.7) * 0.15, 0);
    th.forEach(function(g, i){ var s = i ? 1 : -1; g.rotation.set(-0.3 * q.A + 0.6 * q.S, 0, s * (0.2 * q.A - 0.3 * q.S)); });
    ar.forEach(function(a, i){ var s = i ? 1 : -1; a.rotation.set(-1.1 * q.S + 0.3 * q.A, 0, s * (0.5 * q.S + 0.35 * q.H)); });
    var op = q.Z ? 0 : q.H > 0.2 ? 0.3 : q.S > 0.5 ? 0.45 : blink(t, 3.7, 0.4);
    eyes.forEach(function(e, i){ e.set(op, sin(t * 0.7) * 0.4, 0); });
    brows.forEach(function(w, i){ var s = i ? 1 : -1; w.rotation.z = PI / 2 + s * (0.42 + 0.25 * q.A + 0.2 * q.H); });
    mouth.scale.set(1.15, 1, 1.12 + 0.2 * q.S);
    wm.emissiveIntensity = (asc >= 3 ? 2.6 : 1.4) + 0.7 * (q.Z ? 0 : (0.5 + 0.5 * sin(t * 2.4))) + 1.5 * q.S;
    hat.rotation.set(0.2 - 0.3 * q.S + (q.Z ? 0.3 : 0), sin(t * 0.9) * 0.1, 0.18 + 0.1 * q.H);
    stars.forEach(function(s, i){ var a = t * 1.2 + i * PI / 2; s.position.set(cos(a) * 0.55, 0.72 + sin(t * 2 + i) * 0.1, sin(a) * 0.5); s.rotation.y = t * 3 + i; var k = 0.8 + 0.4 * sin(t * 5 + i * 2); s.scale.set(0.035 * k, 0.06 * k, 0.035 * k); });
  } };
};

/* =========================================================
   LAVADEIRA FAISCA (libelula-faisca)
   libelula azul-eletrica, asas com ponta de raio, faiscas estalando. ataque: arrancada eletrica
   ========================================================= */
C['libelula-faisca'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root), fly = K.grp(b, 0, 0.78, 0); fly.scale.set(1.25, 1.25, 1.25);
  var bm = K.corpo(K.mat(0x1C5FD6, { r: 0.32, m: 0.35 })), dk = K.mat(0x0E2A66, { r: 0.4, m: 0.3 });
  var gl = K.glow(0x6FE6FF, 1.4), wing = K.mat(0xBFF2FF, { r: 0.15, op: 0.38, ds: true, e: 0x5FD8FF, ei: 0.35 });
  var bolt = K.own(0xFFC400, { e: 0xFFA800, ei: 1.4, r: 0.3 }), line = K.mat(0x0A1020);
  K.m(fly, K.sph(2), bm, 0, 0, 0, 0.13, 0.12, 0.17);
  var ab = K.grp(fly, 0, -0.02, -0.14), segs = [];
  var prev = ab;
  for (var i = 0; i < 6; i++){
    var g = K.grp(prev, 0, 0, i ? -0.1 : 0);
    K.m(g, K.sph(1), i % 2 ? dk : bm, 0, 0, -0.05, 0.065 - i * 0.006, 0.06 - i * 0.006, 0.07);
    if (i === 5) K.m(g, K.oct(), gl, 0, 0, -0.12, 0.03, 0.03, 0.05);
    segs.push(g); prev = g;
  }
  var hd = K.grp(fly, 0, 0.04, 0.17);
  K.m(hd, K.sph(2), bm, 0, 0, 0, 0.14, 0.12, 0.12);
  var eyes = [];
  [-1, 1].forEach(function(s){
    eyes.push(K.eye(hd, { r: 0.1, x: s * 0.09, y: 0.04, z: 0.07, ry: s * 0.35, iris: 0x0B8FD0, ir: 0.72, pr: 0.45 }));
    var w = K.m(hd, K.cap(0.016, 0.08, 6), line, s * 0.09, 0.15, 0.1); w.rotation.z = PI / 2 + s * 0.45;
  });
  K.m(hd, K.tor(0.04, 0.008, 3, 10, PI), line, 0, -0.06, 0.11).rotation.z = PI;
  var wings = [], tips = [], lines = [];
  [[-1, 0.04], [1, 0.04], [-1, -0.06], [1, -0.06]].forEach(function(w, i){
    var g = K.grp(fly, w[0] * 0.06, 0.08, w[1]);
    K.m(g, K.sph(1), wing, w[0] * 0.21, 0, 0, 0.21, 0.008, 0.065);
    tips.push(K.m(g, K.oct(), bolt, w[0] * 0.42, 0, 0, 0.05, 0.02, 0.035));
    if (asc >= 3){ var ln = K.m(g, K.box(), bolt, w[0] * 0.26, 0, -0.09, 0.42, 0.008, 0.012); ln.rotation.y = w[0] * 0.15; lines.push(ln); }
    wings.push(g);
  });
  var legs = [];
  [-1, 1].forEach(function(s){ [0.03, -0.05].forEach(function(z){
    var l = K.m(fly, K.cap(0.012, 0.12, 4), dk, s * 0.06, -0.14, z); l.rotation.z = s * 0.4; legs.push(l); }); });
  var sp = [];
  for (var j = 0; j < 4; j++) sp.push(K.m(fly, K.oct(), bolt, 0, 0, 0, 0.03, 0.06, 0.03));
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q);
    var land = q.Z ? 0.38 : 0;
    fly.position.set(0, 0.78 - land + (q.Z ? sin(t) * 0.01 : sin(t * 2.2) * 0.05), -0.2 * q.A + 0.55 * q.S);
    fly.rotation.set(0.15 * q.A - 0.2 * q.S + (q.Z ? 0 : sin(t * 1.3) * 0.05), q.Z ? 0 : sin(t * 0.6) * 0.25 * (1 - q.S), sin(t * 1.7) * 0.06 * (1 - q.Z));
    fly.scale.set(1.25, 1.25, 1.25 * (1 + 0.3 * q.S));
    segs.forEach(function(g, i){ g.rotation.x = q.Z ? -0.02 : -0.07 + sin(t * 2 - i * 0.6) * 0.05 + 0.06 * q.S - 0.08 * q.A; });
    var fl = q.Z ? 0 : (q.S > 0.2 ? 1.6 : 1) * sin(t * 40 + q.p * 30);
    wings.forEach(function(g, i){ var s = i % 2 ? 1 : -1;
      g.rotation.set(0, s * (q.Z ? 0.9 : 0.15 * q.S + 0.3 * q.A), s * (q.Z ? -0.05 : fl * 0.45 + 0.1)); });
    var on = q.Z ? 0.3 : 1.6 + 1.4 * q.S + 0.6 * pulse(t, 0.9, 0, 0.2);
    bolt.emissiveIntensity = on * 0.8;
    tips.forEach(function(m, i){ m.scale.set(0.05 + 0.03 * q.S, 0.02, 0.035); m.rotation.y = t * 9 + i; });
    lines.forEach(function(m, i){ m.visible = !q.Z && (pulse(t, 0.6, i * 0.15, 0.35) > 0.1 || q.S > 0.2); m.scale.x = 0.5 + 0.4 * q.S; });
    sp.forEach(function(m, i){
      var a = t * 6 + i * 1.7, u = fr(t * 1.3 + i * 0.27);
      m.visible = !q.Z && (u < 0.35 || q.S > 0.1);
      var r = 0.18 + 0.25 * u + 0.2 * q.S;
      m.position.set(cos(a) * r, sin(a * 1.3) * r * 0.6, sin(a) * r * 0.7 + 0.1 * q.S);
      m.rotation.set(a, a * 0.7, 0);
    });
    var op = q.Z ? 0 : q.H > 0.2 ? 0.35 : blink(t, 3.3, 1.1);
    eyes.forEach(function(e){ e.set(op, sin(t * 0.6) * 0.3, 0); });
    hd.rotation.set(0.15 * q.A - 0.1 * q.S + 0.2 * q.H, 0, 0);
    legs.forEach(function(l, i){ l.rotation.x = q.Z ? 0.6 : -0.3 * q.S + sin(t * 3 + i) * 0.1; });
  } };
};

/* =========================================================
   ANINGA ESPINHENTA (taboa-espinhosa)
   planta da varzea: folhas em ponta de flecha, talos com espinhos, cara sonolenta no talo, espata creme
   ataque: chicotada de espinhos
   ========================================================= */
C['taboa-espinhosa'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var st = K.corpo(K.mat(0x4E8A3A, { r: 0.6 })), stD = K.mat(0x335F2A, { r: 0.65 });
  var leaf = K.mat(0x23602E, { r: 0.55, ds: true }), leafL = K.mat(0x3A7E36, { r: 0.55, ds: true }), vein = K.mat(0x9CCB6A, { r: 0.6 });
  var mud = K.mat(0x3A2A1E, { r: 0.9 }), water = K.mat(0x2E5A6A, { r: 0.15, m: 0.1, op: 0.75 });
  var thorn = asc >= 3 ? K.mat(0xE6EEF6, { r: 0.18, m: 0.9, e: 0xBFD8FF, ei: 0.6 }) : K.mat(0xCDBB7A, { r: 0.5 });
  var spa = K.mat(0xF1E6C2, { r: 0.55, ds: true }), spx = K.glow(0xF2C84A, 0.35), line = K.mat(0x14200E);
  K.m(b, K.hemi(2), mud, 0, 0.0, 0, 0.4, 0.12, 0.36);
  K.m(b, K.disc(20), water, 0, 0.012, 0, 0.55, 0.01, 0.5);
  var LEAF = [[0, 0.44], [0.12, 0.2], [0.22, 0.06], [0.24, -0.2], [0.1, -0.12], [0, 0.0], [-0.1, -0.12], [-0.24, -0.2], [-0.22, 0.06], [-0.12, 0.2]];
  var lg = K.ext('aninga', LEAF, 0.016);
  function stalk(par, len, r){
    var g = K.grp(par);
    K.m(g, K.cyl(r * 0.75, r, 10), st, 0, len / 2, 0, 1, len, 1);
    return g;
  }
  function addLeaf(par, y, s, m){
    var g = K.grp(par, 0, y, 0);
    var l = K.m(g, lg, m, 0, 0.18 * s, 0.02, s, s, 1); l.rotation.x = -0.25;
    K.m(g, K.box(), vein, 0, 0.18 * s, 0.035, 0.012, 0.36 * s, 0.01).rotation.x = -0.25;
    return g;
  }
  // talo principal com rosto
  var main = stalk(b, 0.82, 0.11); main.position.set(0, 0.08, 0);
  var face = K.grp(main, 0, 0.55, 0.075);
  var eyes = [];
  [-1, 1].forEach(function(s){
    eyes.push(K.eye(face, { r: 0.055, x: s * 0.045, y: 0.03, z: 0.02, ry: s * 0.25, iris: 0x6A4A12, lid: 0x4E8A3A, lv: 0.45 }));
  });
  var mouth = K.m(face, K.sph(1), line, 0, -0.07, 0.025, 0.03, 0.012, 0.01);
  var topL = addLeaf(main, 0.82, 1.05, leaf); topL.rotation.set(-0.2, 0, 0.1);
  var spath = K.grp(main, 0, 0.66, 0.06); spath.rotation.x = 0.35;
  K.m(spath, K.sph(1), spa, 0, 0.09, 0, 0.06, 0.13, 0.035);
  K.m(spath, K.cap(0.02, 0.1, 6), spx, 0, 0.08, 0.02);
  // talos laterais
  var sideL = K.grp(b, -0.16, 0.08, -0.04), sideR = K.grp(b, 0.16, 0.08, 0.0);
  var sl = stalk(sideL, 0.6, 0.06), sr = stalk(sideR, 0.66, 0.065);
  var lL = addLeaf(sl, 0.6, 0.78, leafL), lR = addLeaf(sr, 0.66, 0.82, leafL);
  var low = addLeaf(b, 0.05, 0.75, leaf); low.position.set(0.08, 0.06, -0.2); low.rotation.set(-1.1, 0.4, 0);
  var thorns = [];
  [[main, 0.25, 0.11, 0.4], [main, 0.38, 0.1, -2.2], [main, 0.7, 0.09, 2.4], [main, 0.85, 0.08, -0.9],
    [sl, 0.25, 0.06, -1.6], [sl, 0.5, 0.055, 0.8], [sr, 0.3, 0.065, 1.4], [sr, 0.55, 0.06, -0.4], [sr, 0.7, 0.055, 2.6]].forEach(function(d){
    var m = K.m(d[0], K.cone(5), thorn, sin(d[3]) * d[2], d[1], cos(d[3]) * d[2], 0.022, 0.08, 0.022);
    m.rotation.set(PI / 2 * cos(d[3]) * 0.9, 0, -PI / 2 * sin(d[3]) * 0.9); thorns.push(m);
  });
  var glints = [];
  if (asc >= 3){ var gm = K.glow(0xFFFFFF, 3); [[sr, 0.55], [main, 0.7], [sl, 0.5]].forEach(function(d){ glints.push(K.m(d[0], K.oct(), gm, 0.07, d[1], 0.04, 0.025, 0.06, 0.025)); }); }
  
  return { obj: root, anim: function(stt, t, p){
    var q = Q(stt, t, p); t = q.t; base(b, q, 0.12);
    var sw = q.Z ? 0.02 : 0.05;
    main.rotation.set(sin(t * 0.9) * sw * 0.6 - 0.1 * q.A + 0.15 * q.S + (q.Z ? 0.12 : 0), 0, sin(t * 0.7) * sw);
    sideL.rotation.set(sin(t * 1.1 + 1) * sw, 0, 0.16 + sin(t * 0.8 + 2) * sw + (q.Z ? 0.15 : 0));
    sideR.rotation.set(-0.9 * q.A + 2.0 * q.S + sin(t * 1.0) * sw, 0.2 * q.S, -0.17 - 0.1 * q.A + (q.Z ? -0.15 : 0));
    sr.rotation.x = -0.4 * q.A + 0.7 * q.S;
    lR.rotation.set(0.6 * q.S - 0.3 * q.A, 0, 0);
    topL.rotation.set(-0.2 + sin(t * 1.3) * 0.08 + (q.Z ? 0.5 : 0), 0, 0.1 + sin(t * 0.9) * 0.05);
    lL.rotation.set(sin(t * 1.5 + 1) * 0.1 + (q.Z ? 0.5 : 0), 0, 0.2);
    spath.rotation.x = 0.35 + sin(t * 1.2) * 0.05;
    var op = q.Z ? 0 : q.S > 0.3 || q.A > 0.5 ? 1 : q.H > 0.2 ? 0.25 : blink(t, 4.5, 0.2) * 0.85;
    eyes.forEach(function(e){ e.lv = q.S > 0.3 || q.A > 0.5 ? 0.05 : 0.45; e.set(op, 0, 0); });
    mouth.scale.set(0.03 + 0.015 * q.S, 0.012 + 0.03 * (q.S + q.H) + (q.Z ? 0 : 0.006 * pulse(t, 5, 1, 1.2)), 0.01);
    var sh = asc >= 3 ? 1 + 0.4 * q.S : 1;
    thorns.forEach(function(m, i){ m.scale.set(0.022 * sh, (0.08 + 0.04 * q.A) * sh, 0.022 * sh); });
    glints.forEach(function(g, i){ var k = pulse(t, 1.8, i * 0.6, 0.4); g.scale.set(0.03 * k + 0.001, 0.07 * k + 0.001, 0.03 * k + 0.001); g.rotation.y = t * 4; });
  } };
};

/* =========================================================
   TUIUIU PESCADOR (garca-pescadora)
   tuiuiu do Pantanal: corpo branco, cabeca preta pelada, papo vermelho, bicao preto. ataque: lancada de bico
   ========================================================= */
C['garca-pescadora'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var wh = K.corpo(K.mat(0xF2EEE6, { r: 0.7 })), bl = K.mat(0x17161A, { r: 0.5 }), blS = K.mat(0x23222A, { r: 0.35, m: 0.2 });
  var red = asc >= 3 ? K.own(0xD8202A, { r: 0.45, e: 0xFF2A20, ei: 0.9 }) : K.own(0xC81E28, { r: 0.5 });
  var leg = K.mat(0x2A2A30, { r: 0.6 }), gold = K.mat(0xF2C340, { r: 0.25, m: 0.9, e: 0x6A4A00, ei: 0.4 });
  var bod = K.grp(b, 0, 0.76, 0);
  K.m(bod, K.sph(3), wh, 0, 0, -0.02, 0.29, 0.27, 0.36);
  K.m(bod, K.sph(2), wh, 0, -0.04, 0.16, 0.22, 0.2, 0.18);
  var wings = [];
  [-1, 1].forEach(function(s){
    var g = K.grp(bod, s * 0.24, 0.06, -0.02);
    K.m(g, K.sph(2), blS, s * 0.02, 0, -0.12, 0.08, 0.18, 0.32).rotation.x = -0.25;
    K.m(g, K.sph(1), wh, s * 0.03, 0.08, 0.06, 0.075, 0.12, 0.16);
    wings.push(g);
  });
  var tail = K.m(bod, K.cone(8), bl, 0, 0.0, -0.4, 0.13, 0.2, 0.06); tail.rotation.x = -PI / 2 - 0.3;
  // pernas
  var legs = [];
  [-1, 1].forEach(function(s){
    var g = K.grp(b, s * 0.11, 0.56, 0);
    K.m(g, K.cyl(0.032, 0.026, 8), leg, 0, -0.28, 0, 1, 0.56, 1);
    K.m(g, K.sph(1), leg, 0, -0.27, 0, 0.042);
    var f = K.grp(g, 0, -0.55, 0.02);
    [-0.5, 0, 0.5].forEach(function(a){ var tt = K.m(f, K.box(), leg, sin(a) * 0.05, 0, cos(a) * 0.05, 0.022, 0.016, 0.11); tt.rotation.y = a; });
    legs.push(g);
  });
  // pescoco
  var n1 = K.grp(bod, 0, 0.18, 0.18);
  var band = K.m(n1, K.sph(2), red, 0, 0.0, 0.02, 0.15, 0.12, 0.14);
  K.m(n1, K.cap(0.085, 0.16, 10), bl, 0, 0.14, 0);
  var n2 = K.grp(n1, 0, 0.24, 0);
  K.m(n2, K.cap(0.075, 0.12, 10), bl, 0, 0.08, 0);
  var hd = K.grp(n2, 0, 0.2, 0.02);
  K.m(hd, K.sph(2), bl, 0, 0, 0, 0.14, 0.13, 0.15);
  var eyes = [];
  [-1, 1].forEach(function(s){
    eyes.push(K.eye(hd, { r: 0.05, x: s * 0.095, y: 0.035, z: 0.07, ry: s * 0.75, iris: 0x2A1608, ir: 0.7 }));
    var bw = K.m(hd, K.cap(0.016, 0.06, 5), blS, s * 0.08, 0.09, 0.09); bw.rotation.z = PI / 2 + s * 0.35;
  });
  // bico enorme (levemente para cima)
  var bk = K.grp(hd, 0, -0.02, 0.1); bk.rotation.x = -0.1;
  var up = K.m(bk, K.cone(10), blS, 0, 0.012, 0.24, 0.065, 0.48, 0.05); up.rotation.x = PI / 2 + 0.05;
  var jaw = K.grp(bk, 0, -0.01, 0);
  var lo = K.m(jaw, K.cone(10), bl, 0, -0.006, 0.22, 0.05, 0.44, 0.035); lo.rotation.x = PI / 2 - 0.03;
  if (asc >= 3){
    K.m(bk, K.cone(8), gold, 0, 0.012, 0.44, 0.02, 0.09, 0.016).rotation.x = PI / 2;
    K.m(bk, K.tor(0.055, 0.012, 4, 14), gold, 0, 0, 0.02, 1, 0.8, 1);
    K.m(n1, K.tor(0.14, 0.014, 4, 18), gold, 0, 0.06, 0.01).rotation.x = PI / 2;
  }
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q, 0.18);
    var br = sin(t * (q.Z ? 1.4 : 2.2)) * 0.015;
    bod.position.y = 0.76 + br - 0.04 * q.A;
    bod.rotation.set(-0.1 * q.A + 0.35 * q.S + (q.Z ? 0.1 : 0), 0, 0);
    b.position.z += 0.18 * q.S;
    n1.rotation.set(-0.35 * q.A + 0.9 * q.S + (q.Z ? 1.0 : sin(t * 0.8) * 0.06), q.Z ? 0 : sin(t * 0.5) * 0.15, 0);
    n2.rotation.set(-0.5 * q.A + 0.6 * q.S + (q.Z ? 0.9 : sin(t * 0.8 + 1) * 0.08), 0, 0);
    hd.rotation.set(0.25 * q.A - 0.2 * q.S - (q.Z ? 0.4 : 0) + 0.2 * q.H, q.Z ? 0.3 : sin(t * 0.9) * 0.25 * (1 - q.A), 0);
    jaw.rotation.x = 0.25 * q.A * (1 - q.S) + (q.st === 'idle' ? 0.12 * pulse(t, 4.2, 0.5, 0.3) : 0) + 0.3 * q.H;
    wings.forEach(function(g, i){ var s = i ? 1 : -1; g.rotation.set(0, 0, s * (0.06 * pulse(t, 3, i * 0.2, 0.5) + 0.35 * q.A + 0.6 * q.H)); });
    legs.forEach(function(g, i){ g.rotation.x = (i ? 1 : -1) * 0.04 * q.S + (q.Z && i ? -0.0 : 0); });
    var op = q.Z ? 0 : q.H > 0.2 ? 0.3 : blink(t, 3.9, 0.7);
    eyes.forEach(function(e){ e.set(op, 0, 0); });
    red.emissiveIntensity = asc >= 3 ? 0.8 + 0.6 * sin(t * 2.5) + 1.2 * q.S : 0;
    band.scale.set(0.15 + 0.03 * q.A, 0.12 + 0.02 * sin(t * 1.5), 0.14 + 0.03 * q.A);
  } };
};

/* =========================================================
   IARA (rainha-das-ras)
   sereia de rio: cauda de escamas verde-ouro, cabelo de fitas de agua translucidas, coroa de conchas de rio e
   ninfeias, tunica de folhas tramadas, buzio na cintura. ataque: chicote de fita d'agua.
   (regra 2.3: so agua de rio e folhas; sem manto azul-branco, sem mar, sem espelho, sem pente)
   ========================================================= */
C['rainha-das-ras'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var skin = K.mat(0x9A5E3E, { r: 0.55 }), scale = K.corpo(K.mat(0x17705E, { r: 0.3, m: 0.4 })), sc2 = K.mat(0xB8A23E, { r: 0.3, m: 0.6 });
  var gold = K.mat(0xD8B04A, { r: 0.3, m: 0.85 }), fin = K.mat(0x8FD8A8, { r: 0.25, op: 0.7, ds: true, e: 0x3FB880, ei: 0.3 });
  var lf = K.mat(0x7A9A34, { r: 0.6, ds: true }), lf2 = K.mat(0x9AB04A, { r: 0.6, ds: true });
  var wat = K.own(0x3FD4E6, { r: 0.1, op: 0.72, e: 0x14A6C8, ei: 1.0, ds: true }), hairB = K.mat(0x174E5E, { r: 0.3, m: 0.2, e: 0x0A4A60, ei: 0.5 });
  var shell = K.mat(0xD8B888, { r: 0.4, m: 0.3 }), lily = K.mat(0xF29AC4, { r: 0.5 }), lilyC = K.glow(0xFFD24A, 0.8);
  var conch = K.mat(0xF0C8A8, { r: 0.4 }), line = K.mat(0x2A140C), lip = K.mat(0x7A3A2C, { r: 0.5 });
  // cauda enrolada no chao
  var tail = K.grp(b, 0, 0, 0);
  [[0, 0.4, -0.02, 0.21, 0.2, 0.19], [0.06, 0.24, -0.16, 0.19, 0.15, 0.2], [0.2, 0.12, -0.06, 0.15, 0.12, 0.17], [0.28, 0.08, 0.12, 0.11, 0.08, 0.12]].forEach(function(s, i){
    K.m(tail, K.sph(2), i % 2 ? sc2 : scale, s[0], s[1], s[2], s[3], s[4], s[5]);
  });
  var fins = K.grp(tail, 0.3, 0.08, 0.22); fins.rotation.set(0, 0.5, 0);
  [-1, 1].forEach(function(s){ var f = K.m(fins, K.sph(1), fin, s * 0.12, 0.05, 0.06, 0.16, 0.03, 0.11); f.rotation.set(0.2, s * 0.6, s * 0.4); });
  // saia / tunica de folhas
  var up = K.grp(b, 0, 0.56, 0);
  K.m(up, K.lathe('saia', [[0.0, -0.12], [0.2, -0.12], [0.24, -0.02], [0.17, 0.12], [0.0, 0.14]], 14), lf, 0, 0, 0);
  [0, 1, 2, 3].forEach(function(i){ var a = i * PI / 2 + 0.4; var l = K.m(up, K.sph(1), i % 2 ? lf2 : lf, sin(a) * 0.2, -0.06, cos(a) * 0.2, 0.08, 0.13, 0.03); l.rotation.set(-0.3 * cos(a), a, 0); });
  var cq = K.grp(up, 0.18, -0.02, 0.1); cq.rotation.set(0.2, 0.3, -0.5);
  K.m(cq, K.cone(8), conch, 0, 0.04, 0, 0.05, 0.13, 0.05);
  var tor = K.grp(up, 0, 0.12, 0);
  K.m(tor, K.sph(2), lf, 0, 0.12, 0, 0.145, 0.2, 0.115);
  K.m(tor, K.cyl(0.05, 0.06, 8), skin, 0, 0.32, 0, 1, 0.1, 1);
  // bracos
  var arms = [];
  [-1, 1].forEach(function(s){
    var sh = K.grp(tor, s * 0.17, 0.26, 0);
    K.m(sh, K.cap(0.045, 0.14, 8), skin, 0, -0.09, 0);
    var el = K.grp(sh, 0, -0.19, 0);
    K.m(el, K.cap(0.04, 0.12, 8), skin, 0, -0.08, 0);
    K.m(el, K.sph(1), skin, 0, -0.17, 0.01, 0.045);
    arms.push({ sh: sh, el: el });
  });
  // cabeca
  var hd = K.grp(tor, 0, 0.56, 0.01);
  K.m(hd, K.sph(3), skin, 0, 0, 0, 0.23, 0.22, 0.21);
  K.m(hd, K.hemi(2), hairB, 0, 0.0, -0.02, 0.245, 0.25, 0.235).rotation.x = -0.35;
  var eyes = [];
  [-1, 1].forEach(function(s){
    eyes.push(K.eye(hd, { r: 0.06, x: s * 0.085, y: 0.0, z: 0.165, ry: s * 0.28, iris: 0x2E5A2A, ir: 0.7, lid: 0x9A5E3E }));
    var bw = K.m(hd, K.cap(0.011, 0.06, 5), line, s * 0.085, 0.075, 0.19); bw.rotation.z = PI / 2 + s * 0.12;
  });
  var mouth = K.m(hd, K.sph(1), lip, 0, -0.11, 0.18, 0.035, 0.012, 0.015);
  // fitas de agua (cabelo)
  var rib = [];
  [[-0.2, -0.02, 0.5], [-0.1, -0.16, 0.2], [0.1, -0.16, -0.2], [0.2, -0.02, -0.5], [0.19, 0.04, -0.6]].forEach(function(r, i){
    var g = K.grp(hd, r[0], 0.08, r[1]); g.rotation.set(0.35, 0, r[2] * 0.3);
    var segs = [], prev = g;
    for (var k = 0; k < 2; k++){
      var s = K.grp(prev, 0, k ? -0.24 : 0, 0);
      K.m(s, K.cap(0.05 - k * 0.01, 0.2, 6), wat, 0, -0.12, 0, 1.3, 1, 0.4);
      segs.push(s); prev = s;
    }
    var fish = null;
    if (asc >= 3) fish = K.m(segs[1], K.sph(1), K.glow(0xFFE07A, 2.6), 0, -0.14, 0.02, 0.025, 0.012, 0.035);
    rib.push({ g: g, s: segs, f: fish });
  });
  // coroa de conchas de rio e ninfeias
  var cr = K.grp(hd, 0, 0.18, 0.02); cr.rotation.x = -0.25;
  [-0.12, 0, 0.12].forEach(function(x, i){ var m = K.m(cr, K.sph(1), shell, x, i === 1 ? 0.04 : 0.015, 0.12 - abs(x) * 0.4, 0.04, 0.05, 0.018); m.rotation.z = -x * 2; });
  [-1, 1].forEach(function(s){ var g = K.grp(cr, s * 0.19, -0.03, 0.04); K.m(g, K.cone(6), lily, 0, 0.02, 0, 0.06, 0.06, 0.06); K.m(g, K.sph(0), lilyC, 0, 0.05, 0, 0.022); });
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q, 0.15);
    var sway = q.Z ? 0.02 : 0.05;
    up.rotation.set(-0.12 * q.A + 0.2 * q.S + (q.Z ? 0.12 : 0), sin(t * 0.6) * 0.1 * (1 - q.Z) - 0.4 * q.A + 0.5 * q.S, sin(t * 0.9) * sway);
    up.position.y = 0.56 + sin(t * 1.4) * 0.012 - (q.Z ? 0.04 : 0);
    tor.rotation.set(sin(t * 1.2) * 0.03, 0, sin(t * 0.9 + 1) * sway * 0.6);
    fins.rotation.set(sin(t * 2) * 0.12, 0.5 + sin(t * 1.3) * 0.2, 0);
    hd.rotation.set(0.1 * q.H + (q.Z ? 0.35 : 0) - 0.1 * q.A, sin(t * 0.5) * 0.15 * (1 - q.Z), sin(t * 0.7) * 0.06 + (q.Z ? 0.2 : 0));
    // braco direito (s=+1) chicoteia
    var L = arms[0], R = arms[1];
    L.sh.rotation.set(-0.2 + sin(t * 1.1) * 0.08, 0, -0.25 - 0.2 * q.H);
    L.el.rotation.set(-0.5 + (q.Z ? 0.3 : 0), 0, 0);
    R.sh.rotation.set(-0.3 - 2.4 * q.A + 2.0 * q.S + (q.st === 'idle' ? -0.5 * pulse(t, 6, 2, 2) : 0), 0, 0.25 + 0.4 * q.A - 0.2 * q.S + 0.2 * q.H);
    R.el.rotation.set(-0.4 - 0.6 * q.A + 0.4 * q.S, 0, 0);
    rib.forEach(function(r, i){
      var wv = sin(t * 2.2 - i * 0.9);
      var whip = i === 4 ? 1 : 0;
      r.g.rotation.set(0.35 + wv * 0.12 + whip * (0.9 * q.A - 1.95 * q.S), whip * 0.3 * q.S, (i - 2) * 0.12 + sin(t * 1.3 + i) * 0.08);
      r.s[1].rotation.set(sin(t * 2.4 - i) * 0.3 - whip * 0.3 * q.S, 0, 0);
      r.s[1].scale.set(1, 1 + whip * 1.4 * q.S, 1);
      if (r.f){ r.f.position.y = -0.06 - 0.12 * fr(t * 0.5 + i * 0.23); }
    });
    wat.emissiveIntensity = 0.6 + 0.25 * sin(t * 2) + 1.2 * q.S;
    var sing = q.st === 'idle' ? pulse(t, 5, 0.5, 2.2) : 0;
    mouth.scale.set(0.035 - 0.01 * sing, 0.012 + 0.022 * sing + 0.02 * q.S + 0.02 * q.H, 0.015);
    var op = q.Z ? 0 : q.H > 0.2 ? 0.35 : blink(t, 4.1, 0.9);
    eyes.forEach(function(e){ e.lv = sing * 0.4 + 0.12; e.set(op, sin(t * 0.5) * 0.3, 0); });
  } };
};

/* =========================================================
   BOIUNA (velho-lodao) - lendaria, 2.0
   cobra-grande negra do rio, olhos de lanterna de barco, dorso de musgo com plantas do rio, remo quebrado na crista
   ataque: bote que engole
   ========================================================= */
C['velho-lodao'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var sk = K.corpo(K.mat(0x141C1A, { r: 0.34, m: 0.2 })), sk2 = K.mat(0x22302A, { r: 0.4, m: 0.15 });
  var moss = K.mat(0x3E6A2A, { r: 0.85 }), moss2 = K.mat(0x557F2E, { r: 0.85 }), grass = K.mat(0x6A9A3A, { r: 0.7 });
  var lantern = K.own(0xFFB020, { r: 0.3, e: 0xFF9000, ei: 1.3 }), bronze = K.mat(0x7A5A2A, { r: 0.35, m: 0.8 });
  var mouthM = K.mat(0x5A1A1A, { r: 0.7 }), fang = K.mat(0xF2EAD8, { r: 0.4 }), wood = K.mat(0x8A5E34, { r: 0.75 }), woodD = K.mat(0x5E3E22, { r: 0.8 });
  var lily = K.mat(0xF2E0EC), dots = K.own(0xFFB020, { r: 0.3, e: 0xFF9000, ei: 1.4 });
  var N = 14, seg = [], PP = [];
  for (var i = 0; i < N; i++){
    var r = i < 3 ? 0.06 + i * 0.05 : (i < 10 ? 0.2 + (i - 3) * 0.004 : 0.22 - (i - 10) * 0.012);
    var m = K.m(b, K.sph(2), i % 2 ? sk : sk2, 0, 0, 0, r * 1.15, r, r * 1.15);
    m.rotation.order = 'YXZ';
    seg.push({ m: m, r: r }); PP.push([0, 0, 0]);
  }
  [4, 6, 8, 10].forEach(function(i, k){ K.m(seg[i].m, K.sph(1), k % 2 ? moss : moss2, 0, 0.72, 0, 0.75, 0.38, 0.7); });
  [[5, 0.3], [7, -0.3], [9, 0.1]].forEach(function(d){ var g = K.m(seg[d[0]].m, K.cone(5), grass, d[1], 1.15, 0, 0.12, 0.7, 0.12); g.rotation.z = -d[1]; });
  K.m(seg[5].m, K.cone(7), lily, -0.3, 1.05, 0.3, 0.3, 0.25, 0.3);
  if (asc >= 3){ [2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(function(i, k){ K.m(seg[i].m, K.sph(1), dots, (k % 2 ? 1 : -1) * 0.9, 0.3, 0, 0.2, 0.2, 0.2); }); }
  // cabeca
  var hd = K.grp(b, 0, 1.5, 0.2); hd.scale.set(1.2, 1.2, 1.2);
  K.m(hd, K.sph(3), sk, 0, 0.03, 0.05, 0.3, 0.2, 0.36);
  K.m(hd, K.sph(2), sk2, 0, 0.0, 0.3, 0.22, 0.12, 0.18);
  var jaw = K.grp(hd, 0, -0.07, -0.08);
  K.m(jaw, K.sph(2), sk2, 0, -0.03, 0.22, 0.25, 0.07, 0.3);
  K.m(jaw, K.sph(1), mouthM, 0, 0.02, 0.24, 0.2, 0.035, 0.24);
  [-1, 1].forEach(function(s){ var f = K.m(hd, K.cone(6), fang, s * 0.11, -0.1, 0.36, 0.025, 0.09, 0.025); f.rotation.x = PI; });
  var eyes = [];
  [-1, 1].forEach(function(s){
    var g = K.grp(hd, s * 0.2, 0.12, 0.2); g.rotation.y = s * 0.45;
    K.m(g, K.tor(0.095, 0.022, 5, 14), bronze, 0, 0, 0.035);
    var ball = K.m(g, K.sph(2), lantern, 0, 0, 0, 0.095); ball.userData.olho = true;
    var pu = K.m(g, K.sph(1), K.mat(0x1A0A00), 0, 0, 0.075, 0.016, 0.06, 0.015); pu.userData.olho = true;
    K.m(g, K.sph(0), K.glow(0xFFFFFF, 1.5), 0.03, 0.035, 0.07, 0.018).userData.olho = true;
    var bw = K.m(hd, K.cone(5), sk2, s * 0.18, 0.22, 0.18, 0.05, 0.16, 0.05); bw.rotation.set(-1.1, 0, -s * 0.8);
    eyes.push({ g: g });
  });
  [0, 1, 2].forEach(function(k){ var c = K.m(hd, K.cone(5), sk2, 0, 0.2 - k * 0.02, -0.08 - k * 0.12, 0.05, 0.16 - k * 0.03, 0.06); c.rotation.x = -0.5; });
  var pad = K.grp(hd, 0.06, 0.16, -0.12); pad.rotation.set(-0.5, 0.4, -0.45);
  K.m(pad, K.cyl(0.02, 0.02, 6), wood, 0, 0.12, 0, 1, 0.32, 1);
  K.m(pad, K.ext('remo', [[-0.09, 0], [0.09, 0], [0.1, 0.18], [0.05, 0.24], [0.02, 0.19], [-0.04, 0.26], [-0.1, 0.17]], 0.025), woodD, 0, 0.27, 0, 1, 1, 1);
  function place(t, q){
    var lift = 1 - 0.55 * q.Z;
    for (var i = 0; i < N; i++){
      var s = seg[i], P = PP[i];
      if (i < 10){
        var a = 0.4 + i / 9 * 1.8 * PI + sin(t * 0.6) * 0.04, R = 0.62 - i * 0.022 + 0.02 * sin(t * 1.2 + i);
        P[0] = R * sin(a); P[1] = s.r * 0.96 + 0.01; P[2] = R * cos(a) - 0.05;
      } else {
        var u = (i - 9) / 4, a7 = 0.4 + 1.8 * PI, P7 = [0.42 * sin(a7), 0.3, 0.42 * cos(a7) - 0.05];
        var wv = sin(t * 1.1 - u * 2) * 0.06 * (1 - q.Z);
        var tx = 0 + wv, ty = 0.3 + (0.85 * lift + 0.15 * q.A - 0.35 * q.S) * u, tz = -0.1 + (0.05 - 0.2 * q.A + 0.45 * q.S) * u;
        P[0] = lerp(P7[0], tx, Math.pow(u, 0.6)); P[1] = ty; P[2] = lerp(P7[2], tz, u);
      }
      s.m.position.set(P[0], P[1], P[2]);
    }
    for (var j = 0; j < N; j++){
      var A0 = PP[j < N - 1 ? j : j - 1], A1 = PP[j < N - 1 ? j + 1 : j];
      var dx = A1[0] - A0[0], dy = A1[1] - A0[1], dz = A1[2] - A0[2], h = Math.sqrt(dx * dx + dz * dz), len = Math.sqrt(h * h + dy * dy);
      var sg = seg[j];
      if (j < 10){ dy = 0; len = h; }
      sg.m.rotation.set(-Math.atan2(dy, h + 1e-6), Math.atan2(dx, dz + 1e-9), 0);
      sg.m.scale.set(sg.r * 1.15, sg.r, Math.min(sg.r * 2, Math.max(sg.r * 1.1, len * 0.62)));
    }
    var last = seg[N - 1].m.position;
    hd.position.set(last.x, last.y + 0.18, last.z + 0.14);
  }
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q, 0.12);
    place(q.Z ? t * 0.4 : t, q);
    hd.rotation.set(-0.3 * q.A + 0.45 * q.S + (q.Z ? 0.35 : sin(t * 0.8) * 0.05) + 0.25 * q.H, sin(t * 0.55) * 0.25 * (1 - q.Z) * (1 - q.A), sin(t * 0.7) * 0.05);
    var open = q.st === 'atk' ? (q.p < 0.5 ? sm(q.p / 0.4) : 1 - sm((q.p - 0.5) / 0.15)) : 0;
    jaw.rotation.x = 0.85 * open + 0.15 * q.H + (q.st === 'idle' ? 0.12 * pulse(t, 6, 1, 0.8) : 0);
    hd.scale.setScalar(1.2 * (1 + 0.12 * q.S));
    lantern.emissiveIntensity = q.Z ? 0.15 : 1.2 + 0.35 * sin(t * 1.6) + 1.0 * q.S;
    dots.emissiveIntensity = q.Z ? 0.2 : 1.2 + 0.5 * sin(t * 2.2);
    eyes.forEach(function(e){ e.g.scale.set(1, q.Z ? 0.2 : (q.H > 0.3 ? 0.55 : blink(t, 5.5, 0.3) * 0.85 + 0.15), 1); });
    pad.rotation.z = -0.5 + sin(t * 0.9) * 0.03;
  } };
};

/* =========================================================
   PERERECA DO VISGO (perereca-grudenta)
   pererequinha verde-limao, ventosas que brilham, lingua comprida. ataque: linguada
   ========================================================= */
C['perereca-grudenta'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var skin = K.corpo(K.mat(0x78D22C, { r: 0.4 })), dk = K.mat(0x3E8A22, { r: 0.5 }), bel = K.mat(0xF2E8A6, { r: 0.6 });
  var side = K.mat(0x2D6FB8, { r: 0.45 }), padM = K.own(0xE6FF7A, { r: 0.3, e: 0xC8FF3A, ei: asc >= 3 ? 2.2 : 0.6 });
  var tng = K.own(0xF06A8A, { r: 0.3, e: 0xFF4A8A, ei: asc >= 3 ? 0.9 : 0.1 }), line = K.mat(0x18240C), halo = K.mat(0xE6FF7A, { op: 0.35, add: true, r: 0.3, e: 0xC8FF3A, ei: 1 });
  var bod = K.grp(b, 0, 0, 0);
  K.m(bod, K.sph(3), skin, 0, 0.26, -0.04, 0.27, 0.22, 0.3).rotation.x = -0.35;
  K.m(bod, K.sph(2), bel, 0, 0.2, 0.08, 0.2, 0.15, 0.18);
  [-1, 1].forEach(function(s){ K.m(bod, K.sph(1), side, s * 0.22, 0.22, -0.06, 0.05, 0.08, 0.2); });
  var hd = K.grp(bod, 0, 0.42, 0.1);
  K.m(hd, K.sph(3), skin, 0, 0, 0, 0.25, 0.16, 0.22);
  var eyes = [];
  [-1, 1].forEach(function(s){
    K.m(hd, K.sph(2), skin, s * 0.14, 0.1, 0.02, 0.12);
    eyes.push(K.eye(hd, { r: 0.11, x: s * 0.155, y: 0.13, z: 0.07, ry: s * 0.45, iris: 0xF05A1A, ir: 0.72, slit: true, pr: 0.42 }));
  });
  var mouth = K.m(hd, K.tor(0.2, 0.012, 4, 14, PI), line, 0, -0.04, 0.03, 1.05, 1, 1.0); mouth.rotation.x = PI / 2;
  var tg = K.grp(hd, 0, -0.04, 0.14);
  var tongue = K.m(tg, K.cap(0.03, 0.1, 6), tng, 0, 0, 0.06); tongue.rotation.x = PI / 2;
  var tip = K.m(tg, K.sph(1), tng, 0, 0, 0.12, 0.05, 0.04, 0.04);
  var pads = [], limbs = [], halos = [];
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function(d){
    var fr2 = d[1] > 0;
    var g = K.grp(bod, d[0] * (fr2 ? 0.16 : 0.22), fr2 ? 0.2 : 0.14, fr2 ? 0.17 : -0.12);
    var l = K.m(g, K.cap(fr2 ? 0.04 : 0.065, fr2 ? 0.1 : 0.12, 8), fr2 ? skin : dk, d[0] * 0.04, -0.06, fr2 ? 0.02 : 0.06);
    l.rotation.set(fr2 ? 0.3 : 1.2, 0, d[0] * 0.5);
    var pd = K.m(g, K.sph(1), padM, d[0] * 0.09, -0.13, fr2 ? 0.07 : 0.16, 0.05, 0.025, 0.05);
    pads.push(pd); limbs.push(g);
    if (asc >= 3) halos.push(K.m(g, K.sph(1), halo, d[0] * 0.09, -0.12, fr2 ? 0.07 : 0.16, 0.08, 0.04, 0.08));
  });
  var sparks = [];
  if (asc >= 3){ var gm = K.glow(0xFFFFFF, 3); for (var i = 0; i < 2; i++) sparks.push(K.m(tg, K.oct(), gm, 0, 0.03, 0.1, 0.02)); }
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q);
    var hop = q.st === 'entra' ? 0.25 * Math.sin(PI * cl(q.p / 0.7)) : 0;
    bod.position.set(0, hop + (q.Z ? -0.02 : 0) + 0.04 * q.A, 0.06 * q.S);
    bod.rotation.set(-0.15 * q.A + 0.15 * q.S + (q.Z ? 0.1 : 0), q.Z ? 0 : sin(t * 0.6) * 0.15, 0);
    bod.scale.set(1, 1 + (q.Z ? sin(t * 1.5) * 0.03 : sin(t * 3.5) * 0.025), 1);
    hd.rotation.set(-0.15 * q.A + 0.1 * q.S + 0.15 * q.H + (q.Z ? 0.15 : 0), 0, 0);
    var ext = q.st === 'atk' ? (q.p < 0.35 ? 0 : q.p < 0.55 ? sm((q.p - 0.35) / 0.12) : 1 - sm((q.p - 0.55) / 0.3)) : 0;
    tongue.scale.set(1, 1 + ext * 7, 1); tongue.position.z = 0.06 + ext * 0.38;
    tip.position.z = 0.12 + ext * 0.78;
    tg.visible = ext > 0.02 || asc >= 3 && q.st === 'idle' && pulse(t, 4, 0, 0.3) > 0.05;
    if (q.st === 'idle' && ext < 0.02){ var k = pulse(t, 4, 0, 0.3); tongue.scale.set(1, 1 + k * 2, 1); tongue.position.z = 0.06 + k * 0.1; tip.position.z = 0.12 + k * 0.22; tg.visible = k > 0.05; }
    sparks.forEach(function(s, i){ s.position.set((i ? 1 : -1) * 0.04, 0.03, tip.position.z - 0.1 * i); s.rotation.y = t * 5 + i; });
    padM.emissiveIntensity = (asc >= 3 ? 2.0 : 0.5) + 0.5 * sin(t * 3) + 1.5 * q.S;
    halos.forEach(function(h, i){ h.scale.setScalar(0.08 + 0.02 * sin(t * 3 + i)); h.scale.y = 0.04; });
    limbs.forEach(function(g, i){ g.rotation.x = (i < 2 ? -0.3 : 0.2) * q.A + (i < 2 ? 0.2 : -0.3) * q.S; });
    var op = q.Z ? 0 : q.H > 0.2 ? 0.3 : blink(t, 2.9, 0.1);
    eyes.forEach(function(e){ e.set(op, sin(t * 0.8) * 0.4, 0); });
  } };
};

/* =========================================================
   FOGO-FATUO (vaga-lume-piscante)
   chama-fantasma azul-palida, asinhas de inseto, barriga de vaga-lume acesa. olhos ocos. ataque: pulso de chama
   ========================================================= */
C['vaga-lume-piscante'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root), fl = K.grp(b, 0, 0.62, 0);
  var cBody = asc >= 3 ? 0xB8FFD8 : 0x5AA8FF, cEm = asc >= 3 ? 0x2AE890 : 0x1E6CFF;
  var flame = K.corpo(K.own(cBody, { r: 0.3, op: 0.78, e: cEm, ei: 0.8 })), tip = K.own(cBody, { r: 0.3, op: 0.6, e: cEm, ei: 1.8, add: true });
  var core = K.own(0xFFFFFF, { r: 0.3, e: asc >= 3 ? 0xCCFFE0 : 0xD8F0FF, ei: 2.2 }), wing = K.mat(0xE8F6FF, { op: 0.35, ds: true, r: 0.2, e: 0x8FD0FF, ei: 0.4 });
  var bug = K.mat(0x2A2A3A, { r: 0.5 }), lamp = K.own(0xE6FF6A, { r: 0.3, e: 0xD0FF30, ei: 2.2 }), ring = K.own(cEm, { op: 0.0, add: true, e: cEm, ei: 1.2 });
  K.m(fl, K.lathe('fatuo', [[0, -0.22], [0.12, -0.2], [0.2, -0.1], [0.21, 0.02], [0.16, 0.16], [0.09, 0.3], [0.04, 0.42], [0.0, 0.52]], 16), flame, 0, 0, 0);
  K.m(fl, K.sph(2), core, 0, -0.05, 0, 0.1);
  var tips = [];
  [[0, 0.55, 0, 0.05, 0.2], [-0.12, 0.26, -0.02, 0.05, 0.18], [0.13, 0.28, -0.03, 0.05, 0.18]].forEach(function(d){ tips.push(K.m(fl, K.cone(8), tip, d[0], d[1], d[2], d[3], d[4], d[3])); });
  var eyes = [];
  [-1, 1].forEach(function(s){ eyes.push(K.geye(fl, { r: 0.045, x: s * 0.075, y: 0.02, z: 0.17, ry: s * 0.3, c: 0xEAF8FF, k: 1.2, sock: 0x10224A })); });
  var mo = K.m(fl, K.sph(1), K.mat(0x10224A, { r: 0.8 }), 0, -0.07, 0.18, 0.03, 0.02, 0.012);
  var wings = [];
  [-1, 1].forEach(function(s){ var g = K.grp(fl, s * 0.1, 0.1, -0.1); K.m(g, K.sph(1), wing, s * 0.12, 0.06, -0.02, 0.13, 0.06, 0.008).rotation.y = s * 0.4; wings.push(g); });
  var bt = K.grp(fl, 0, -0.2, 0.0); bt.rotation.x = -1.4;
  K.m(bt, K.sph(1), bug, 0, 0, 0, 0.06, 0.04, 0.05);
  var lp = K.m(bt, K.sph(2), lamp, 0, -0.03, -0.11, 0.1, 0.085, 0.12);
  var ant = [];
  [-1, 1].forEach(function(s){ var g = K.grp(fl, s * 0.05, 0.2, 0.12); K.m(g, K.cap(0.006, 0.1, 4), bug, 0, 0.06, 0).rotation.z = -s * 0.4; K.m(g, K.sph(0), lamp, -s * 0.03, 0.12, 0, 0.018); ant.push(g); });
  var flash = K.m(fl, K.tor(0.25, 0.03, 4, 24), ring, 0, 0, 0.1);
  var orb = [];
  if (asc >= 3){ var om = K.glow(0xE8FFF0, 3); for (var i = 0; i < 4; i++) orb.push(K.m(fl, K.oct(), om, 0, 0, 0, 0.03, 0.05, 0.03)); }
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q, 0.15);
    fl.position.set(0, 0.62 - (q.Z ? 0.3 : 0) + (q.Z ? sin(t) * 0.01 : sin(t * 1.8) * 0.06), 0.25 * q.S);
    fl.rotation.set(sin(t * 1.1) * 0.06, sin(t * 0.5) * 0.3 * (1 - q.Z), sin(t * 1.5) * 0.08);
    var s = 1 - 0.15 * q.A + 0.4 * q.S - (q.Z ? 0.1 : 0);
    fl.scale.set(s, s * (1 + sin(t * 6) * 0.03), s);
    tips.forEach(function(m, i){ m.rotation.z = sin(t * 7 + i * 2) * 0.25; m.scale.y = (i ? 0.15 : 0.22) * (1 + 0.25 * sin(t * 9 + i) + 0.8 * q.S); });
    var dim = q.Z ? 0.35 : 1;
    flame.emissiveIntensity = (0.7 + 0.25 * sin(t * 5)) * dim + 1.2 * q.S;
    tip.emissiveIntensity = (1.0 + 0.4 * sin(t * 8)) * dim + 1.5 * q.S;
    core.emissiveIntensity = (1.4 + 0.5 * sin(t * 4)) * dim + 2.5 * q.S;
    lamp.emissiveIntensity = q.Z ? 0.5 : 0.6 + 2.2 * (0.5 + 0.5 * sin(t * 3.3));
    ring.opacity = q.S * 0.8 * (1 - cl((q.p - 0.45) / 0.4)); flash.scale.setScalar(0.5 + 2.5 * cl((q.p - 0.35) / 0.4));
    flash.visible = q.st === 'atk' && q.p > 0.33;
    wings.forEach(function(g, i){ var sg = i ? 1 : -1; g.rotation.set(0, 0, sg * (q.Z ? -0.3 : sin(t * 34) * 0.5)); });
    ant.forEach(function(g, i){ g.rotation.z = sin(t * 2 + i) * 0.15; });
    var op = q.Z ? 0 : q.H > 0.2 ? 0.3 : blink(t, 3.6, 0.2);
    eyes.forEach(function(e){ e.set(op); });
    mo.scale.set(0.03, 0.02 + 0.03 * q.S + 0.02 * q.H, 0.012);
    orb.forEach(function(m, i){ var a = t * 2.2 + i * PI / 2; m.position.set(cos(a) * 0.32, 0.05 + sin(a * 2) * 0.12, sin(a) * 0.32); m.rotation.y = t * 4; });
  } };
};

/* =========================================================
   SAPO-CURURU (sapo-cururu)
   sapao marrom bochechudo, sorrisao, chapeu de palha molhado, papo que brilha. ataque: linguada + onda do coaxo
   ========================================================= */
C['sapo-cururu'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var skin = K.corpo(K.mat(0x7A5432, { r: 0.6 })), dk = K.mat(0x553820, { r: 0.65 }), bel = K.mat(0xD8C496, { r: 0.65 });
  var wart = K.mat(0x4A3018, { r: 0.7 }), line = K.mat(0x1A0E06), straw = K.mat(0xB8924A, { r: 0.35 }), strawD = K.mat(0x8A6A30, { r: 0.4 });
  var band = K.mat(0x5A2A1A, { r: 0.6 }), drop = K.mat(0xBFE8FF, { r: 0.05, op: 0.7, e: 0x6FB8E0, ei: 0.3 });
  var sacM = K.own(0xF2B860, { r: 0.35, e: 0xFF9A2A, ei: asc >= 3 ? 1.8 : 0.35 }), tng = K.mat(0xE07080, { r: 0.35 });
  var ringM = K.own(0xFFE6B0, { op: 0, add: true, e: 0xFFC060, ei: 1.5 });
  K.m(b, K.sph(3), skin, 0, 0.38, -0.04, 0.5, 0.36, 0.46);
  K.m(b, K.sph(2), bel, 0, 0.3, 0.2, 0.38, 0.26, 0.26);
  [[0.3, 0.6, -0.1], [-0.32, 0.58, -0.12], [0.1, 0.72, -0.3], [-0.14, 0.7, -0.28], [0.42, 0.42, -0.25], [-0.44, 0.4, -0.22]].forEach(function(w){ K.m(b, K.sph(1), wart, w[0], w[1], w[2], 0.05); });
  var hd = K.grp(b, 0, 0.66, 0.1);
  K.m(hd, K.sph(3), skin, 0, 0, 0, 0.44, 0.24, 0.36);
  var eyes = [];
  [-1, 1].forEach(function(s){
    K.m(hd, K.sph(2), skin, s * 0.2, 0.16, 0.06, 0.13);
    eyes.push(K.eye(hd, { r: 0.11, x: s * 0.21, y: 0.18, z: 0.13, ry: s * 0.35, iris: 0xD89A2A, pr: 0.42, lid: 0x7A5432, lv: 0.2 }));
  });
  var grin = K.m(hd, K.tor(0.33, 0.02, 4, 18, PI), line, 0, -0.04, 0.02, 1.15, 1, 1.03); grin.rotation.set(PI / 2 - 0.12, 0, 0);
  [-1, 1].forEach(function(s){ K.m(hd, K.sph(1), dk, s * 0.35, -0.02, 0.2, 0.05, 0.04, 0.04); });
  var sac = K.m(b, K.sph(2), sacM, 0, 0.5, 0.33, 0.17, 0.12, 0.13);
  var halo = null;
  if (asc >= 3) halo = K.m(b, K.sph(2), K.mat(0xFFC060, { op: 0.25, add: true, e: 0xFF9A2A, ei: 1 }), 0, 0.5, 0.35, 0.26, 0.19, 0.2);
  var tg = K.grp(hd, 0, -0.06, 0.32);
  var tongue = K.m(tg, K.cap(0.045, 0.1, 6), tng, 0, 0, 0.05); tongue.rotation.x = PI / 2;
  var shock = K.m(b, K.tor(0.3, 0.035, 4, 24), ringM, 0, 0.55, 0.4);
  // chapeu de palha molhado
  var hat = K.grp(hd, -0.04, 0.24, -0.06); hat.rotation.set(-0.08, 0, -0.14);
  K.m(hat, K.cyl(0.36, 0.36, 18), straw, 0, 0, 0, 1, 0.025, 1);
  K.m(hat, K.cyl(0.17, 0.2, 14), straw, 0, 0.09, 0, 1, 0.17, 1);
  K.m(hat, K.cyl(0.205, 0.205, 14, true), band, 0, 0.03, 0, 1, 0.05, 1);
  K.m(hat, K.tor(0.36, 0.014, 3, 24), strawD, 0, 0, 0).rotation.x = PI / 2;
  var drops = [K.m(hat, K.sph(1), drop, 0.3, -0.04, 0.15, 0.025, 0.04, 0.025), K.m(hat, K.sph(1), drop, -0.2, -0.04, 0.27, 0.02, 0.035, 0.02)];
  var arms = [], legs = [];
  [-1, 1].forEach(function(s){
    var a = K.grp(b, s * 0.3, 0.4, 0.3);
    K.m(a, K.cap(0.075, 0.14, 8), skin, 0, -0.1, 0);
    K.m(a, K.sph(1), dk, 0, -0.23, 0.05, 0.1, 0.035, 0.09);
    arms.push(a);
    var l = K.grp(b, s * 0.4, 0.18, -0.08);
    K.m(l, K.sph(2), skin, 0, 0, 0, 0.2, 0.17, 0.26);
    K.m(l, K.sph(1), dk, s * 0.06, -0.15, 0.22, 0.14, 0.035, 0.15);
    legs.push(l);
  });
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q);
    b.position.y += 0.04 * q.A - 0.02 * q.S;
    b.position.z += 0.1 * q.S;
    b.rotation.x += -0.1 * q.A + 0.2 * q.S + (q.Z ? 0.06 : 0);
    var br = q.Z ? sin(t * 1.3) * 0.035 : sin(t * 2.6) * 0.02;
    b.scale.y *= 1 + br;
    hd.rotation.set(-0.12 * q.A + 0.12 * q.H + (q.Z ? 0.1 : 0), q.Z ? 0 : sin(t * 0.6) * 0.12, sin(t * 0.8) * 0.04);
    var croak = q.st === 'idle' ? pulse(t, 3.4, 0.5, 0.7) : 0;
    var inf = q.Z ? 0.1 + 0.1 * sin(t * 1.3) : croak + 1.2 * q.A + 0.6 * q.S;
    sac.scale.set(0.17 * (1 + 0.6 * inf), 0.12 * (1 + 0.8 * inf), 0.13 * (1 + 0.7 * inf));
    sacM.emissiveIntensity = (asc >= 3 ? 1.6 : 0.3) + 1.2 * inf;
    if (halo){ halo.scale.set(0.26 * (1 + 0.5 * inf), 0.19 * (1 + 0.7 * inf), 0.2 * (1 + 0.6 * inf)); }
    var ext = q.st === 'atk' ? (q.p < 0.35 ? 0 : q.p < 0.5 ? sm((q.p - 0.35) / 0.1) : 1 - sm((q.p - 0.5) / 0.3)) : 0;
    tongue.scale.set(1, 1 + 6 * ext, 1); tongue.position.z = 0.05 + 0.32 * ext; tg.visible = ext > 0.02;
    var sp = q.st === 'atk' ? cl((q.p - 0.4) / 0.5) : 0;
    shock.visible = sp > 0 && sp < 1; shock.scale.setScalar(0.5 + 2.6 * sp); ringM.opacity = 0.7 * (1 - sp); shock.position.z = 0.4 + 0.5 * sp;
    grin.scale.set(1.15 + 0.1 * q.S, 1, 1.03);
    arms.forEach(function(a, i){ var s = i ? 1 : -1; a.rotation.set(-0.3 * q.A + 0.2 * q.S, 0, s * (0.15 + 0.4 * q.H + 0.2 * q.A)); });
    legs.forEach(function(l, i){ l.rotation.x = -0.15 * q.A; });
    hat.rotation.set(-0.08 - 0.25 * q.S + (q.Z ? 0.35 : 0), 0, -0.14 + 0.08 * sin(t * 0.7) + 0.2 * q.H);
    drops.forEach(function(d, i){ d.position.y = -0.04 - 0.12 * fr(t * 0.5 + i * 0.5); });
    var op = q.Z ? 0 : q.H > 0.2 ? 0.3 : blink(t, 4.2, 0.6);
    eyes.forEach(function(e){ e.lv = q.A > 0.3 ? 0 : 0.2; e.set(op, 0, 0); });
  } };
};

/* =========================================================
   TRACAJA ANCIAO (cagado-ranzinza)
   tracaja do rio: manchas amarelas na cara, casco de mosaico de seixos com algas, sobrancelhonas brancas.
   ataque: cabecada de casco
   ========================================================= */
C['cagado-ranzinza'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var shell = K.corpo(K.mat(0x3A4628, { r: 0.6 })), rim = K.mat(0x2A321C, { r: 0.65 }), pl = K.mat(0xC8B884, { r: 0.7 });
  var skin = K.mat(0x4C5444, { r: 0.6 }), spot = K.mat(0xF2C632, { r: 0.45 }), brow = K.mat(0xF2F0E6, { r: 0.8 });
  var peb = asc >= 3 ? [K.mat(0x7A8A84, { r: 0.4, e: 0x2AE0C0, ei: 0.9 }), K.mat(0x8A7A62, { r: 0.4, e: 0x2AE0C0, ei: 0.7 })] : [K.mat(0x7E8478, { r: 0.45 }), K.mat(0x8E7A5E, { r: 0.5 })];
  var alg = K.mat(0x3E8A3A, { r: 0.7 }), line = K.mat(0x14140C);
  var sh = K.grp(b, 0, 0.3, -0.04);
  K.m(sh, K.hemi(3), shell, 0, 0, 0, 0.48, 0.34, 0.54);
  K.m(sh, K.sph(2), rim, 0, 0.0, 0, 0.5, 0.06, 0.56);
  K.m(sh, K.sph(2), pl, 0, -0.06, 0.02, 0.44, 0.08, 0.5);
  var P = [[0, 0.33, 0, 0.11], [0.2, 0.25, 0.12, 0.09], [-0.2, 0.25, 0.12, 0.09], [0.2, 0.24, -0.18, 0.09], [-0.21, 0.24, -0.16, 0.085], [0, 0.26, 0.28, 0.08], [0, 0.26, -0.3, 0.085], [0.36, 0.12, 0, 0.07], [-0.36, 0.12, 0, 0.07]];
  P.forEach(function(d, i){ var m = K.m(sh, K.sph(1), peb[i % 2], d[0], d[1], d[2], d[3], d[3] * 0.45, d[3]); m.rotation.set(-d[2] * 1.4, 0, d[0] * 1.6); });
  var algs = [];
  [[0.3, -0.3], [-0.35, -0.25], [0.05, -0.52]].forEach(function(d){ var a = K.m(sh, K.cone(5), alg, d[0], -0.07, d[1], 0.04, 0.18, 0.02); a.rotation.x = PI; algs.push(a); });
  var nk = K.grp(b, 0, 0.32, 0.4);
  K.m(nk, K.cap(0.09, 0.12, 8), skin, 0, 0.02, 0).rotation.x = -1.1;
  var hd = K.grp(nk, 0, 0.14, 0.14); hd.scale.set(1.4, 1.4, 1.4);
  K.m(hd, K.sph(3), skin, 0, 0, 0, 0.2, 0.17, 0.22);
  [[0.13, 0.06, 0.06, 0.04], [-0.13, 0.06, 0.06, 0.04], [0.09, 0.14, -0.02, 0.035], [-0.09, 0.14, -0.02, 0.035], [0, 0.17, 0.0, 0.03]].forEach(function(d){ K.m(hd, K.sph(1), spot, d[0], d[1], d[2], d[3], d[3] * 0.5, d[3]); });
  var eyes = [], brows = [];
  [-1, 1].forEach(function(s){
    eyes.push(K.eye(hd, { r: 0.06, x: s * 0.1, y: 0.03, z: 0.15, ry: s * 0.4, iris: 0x2A2014, ir: 0.68, lid: 0x4C5444, lv: 0.5 }));
    var bw = K.grp(hd, s * 0.11, 0.1, 0.16);
    K.m(bw, K.cap(0.022, 0.14, 6), brow, s * 0.07, -0.02, 0).rotation.z = PI / 2 + s * 0.3;
    brows.push(bw);
  });
  var mouth = K.m(hd, K.tor(0.08, 0.01, 3, 12, PI), line, 0, -0.08, 0.17); mouth.rotation.set(0, 0, 0);
  var legs = [];
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function(d){
    var g = K.grp(b, d[0] * 0.33, 0.14, d[1] * 0.26);
    K.m(g, K.sph(1), skin, 0, -0.05, 0, 0.1, 0.12, 0.11);
    legs.push(g);
  });
  K.m(b, K.cone(6), skin, 0, 0.2, -0.56, 0.05, 0.12, 0.05).rotation.x = -PI / 2;
  var glo = [];
  if (asc >= 3){ var gm = K.glow(0x6AFFE6, 2.4); [[0.1, 0.32, 0.18], [-0.1, 0.32, -0.18], [0.3, 0.2, 0.2], [-0.3, 0.2, -0.05]].forEach(function(d){ glo.push(K.m(sh, K.sph(0), gm, d[0], d[1], d[2], 0.03)); }); }
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q, 0.15);
    b.position.z += 0.32 * q.S - 0.05 * q.A;
    b.rotation.x += -0.12 * q.A + 0.2 * q.S;
    sh.position.y = 0.3 + (q.Z ? sin(t * 1.2) * 0.008 - 0.04 : sin(t * 2) * 0.008);
    var ret = q.Z ? 0.7 : q.A * (1 - q.S) * 0.9 + 0.5 * q.H;
    nk.position.set(0, 0.32 - 0.04 * ret, 0.4 - 0.18 * ret + 0.08 * q.S);
    nk.rotation.set(0.2 * q.S - 0.1 * q.A + (q.Z ? 0.3 : sin(t * 0.7) * 0.04), q.Z ? 0 : sin(t * 0.45) * 0.3, 0);
    hd.rotation.set(0.35 * q.S + (q.st === 'idle' ? 0.15 * pulse(t, 5, 1, 1.4) : 0), 0, sin(t * 0.6) * 0.06);
    brows.forEach(function(w, i){ var s = i ? 1 : -1; w.rotation.z = s * (-0.1 - 0.35 * q.A - 0.3 * q.S + sin(t * 1.4 + i) * 0.06 + (q.Z ? 0.2 : 0)); });
    legs.forEach(function(g, i){ g.rotation.x = (i < 2 ? 1 : -1) * 0.3 * q.S + (q.st === 'entra' ? sin(q.p * 20 + i * 2) * 0.4 * (1 - q.p) : 0); });
    algs.forEach(function(a, i){ a.rotation.z = sin(t * 1.5 + i) * 0.15; });
    var op = q.Z ? 0 : q.H > 0.2 ? 0.25 : blink(t, 4.8, 0.3);
    eyes.forEach(function(e){ e.lv = q.A > 0.3 ? 0.2 : 0.5; e.set(op, sin(t * 0.45) * 0.3, 0); });
    mouth.scale.set(1, 1 + 0.6 * q.S, 1);
    glo.forEach(function(g, i){ g.scale.setScalar(0.03 + 0.012 * sin(t * 3 + i * 1.5)); });
  } };
};

/* =========================================================
   BOTO ENCANTADO (sucuri-do-charco)
   boto-cor-de-rosa em pe na cauda, chapeu branco de aba larga, gravatinha borboleta, redemoinho de bolhas
   ataque: anel de bolhas e rabanada
   ========================================================= */
C['sucuri-do-charco'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var pk = K.corpo(K.mat(0xE48CA0, { r: 0.4 })), pkD = K.mat(0xC0647E, { r: 0.42 }), pkL = K.mat(0xF6C2CC, { r: 0.45 });
  var white = K.mat(0xF4F2EC, { r: 0.55 }), bandM = K.own(0x2A1A2A, { r: 0.5, e: 0xFF5AA8, ei: asc >= 3 ? 1.2 : 0 });
  var tie = K.mat(0xB0182E, { r: 0.45 }), bub = K.own(0xE6F8FF, { r: 0.05, op: 0.45, e: 0x8FD8FF, ei: 0.4 }), line = K.mat(0x3A1420);
  var ringM = K.own(0xBFEFFF, { op: 0, add: true, e: 0x8FD8FF, ei: 1.2 });
  var tl = K.grp(b, 0, 0, 0);
  K.m(tl, K.cap(0.13, 0.22, 10), pkD, 0, 0.22, -0.02).rotation.x = 0.25;
  var fl = K.grp(tl, 0, 0.05, -0.12);
  [-1, 1].forEach(function(s){ var f = K.m(fl, K.sph(1), pkD, s * 0.14, 0, -0.04, 0.17, 0.035, 0.09); f.rotation.y = s * 0.35; });
  var up = K.grp(b, 0, 0.42, 0);
  K.m(up, K.sph(3), pk, 0, 0.22, 0, 0.29, 0.34, 0.26);
  K.m(up, K.sph(2), pkL, 0, 0.18, 0.12, 0.2, 0.27, 0.16);
  var fins = [];
  [-1, 1].forEach(function(s){ var g = K.grp(up, s * 0.26, 0.3, 0.02); K.m(g, K.sph(1), pkD, s * 0.08, -0.08, 0, 0.06, 0.15, 0.04).rotation.z = s * 0.5; fins.push(g); });
  var hd = K.grp(up, 0, 0.66, 0);
  K.m(hd, K.sph(3), pk, 0, 0, 0, 0.25, 0.23, 0.24);
  K.m(hd, K.sph(2), pk, 0, 0.08, 0.1, 0.17, 0.12, 0.13);
  var ros = K.m(hd, K.cap(0.055, 0.3, 8), pkL, 0, -0.07, 0.32); ros.rotation.x = PI / 2 - 0.12;
  var eyes = [];
  [-1, 1].forEach(function(s){ eyes.push(K.eye(hd, { r: 0.055, x: s * 0.12, y: 0.0, z: 0.17, ry: s * 0.55, iris: 0x3A1A2A, ir: 0.7, lid: 0xE48CA0, lv: 0.25 })); });
  K.m(hd, K.tor(0.08, 0.008, 3, 10, PI), line, 0, -0.1, 0.24).rotation.set(-0.3, 0, PI);
  var hat = K.grp(hd, 0, 0.19, -0.02); hat.rotation.set(-0.12, 0, 0.12);
  K.m(hat, K.cyl(0.36, 0.36, 22), white, 0, 0, 0, 1, 0.02, 1);
  K.m(hat, K.cyl(0.15, 0.18, 16), white, 0, 0.1, 0, 1, 0.19, 1);
  K.m(hat, K.cyl(0.183, 0.183, 16, true), bandM, 0, 0.035, 0, 1, 0.05, 1);
  var bt = K.grp(up, 0, 0.53, 0.2);
  [-1, 1].forEach(function(s){ var c = K.m(bt, K.cone(6), tie, s * 0.045, 0, 0, 0.035, 0.07, 0.025); c.rotation.z = s * PI / 2; });
  K.m(bt, K.sph(1), tie, 0, 0, 0.01, 0.022);
  var jk = [];
  if (asc >= 3){
    K.m(up, K.lathe('paleto', [[0.0, -0.04], [0.28, -0.04], [0.31, 0.12], [0.3, 0.3], [0.24, 0.46], [0.0, 0.5]], 16), white, 0, 0.02, -0.01, 1.02, 1, 1.0);
    [-1, 1].forEach(function(s){ var l = K.m(up, K.box(), K.mat(0xDAD6CC, { r: 0.5 }), s * 0.08, 0.36, 0.25, 0.06, 0.2, 0.02); l.rotation.set(-0.2, 0, -s * 0.35); jk.push(l); });
  }
  var bubs = [];
  for (var i = 0; i < 6; i++) bubs.push(K.m(b, K.sph(1), bub, 0, 0, 0, 0.04 + (i % 3) * 0.012));
  var notes = [];
  if (asc >= 3){ var nm = K.glow(0xFFD8F0, 1.8); for (var j = 0; j < 2; j++){ var g = K.grp(b); K.m(g, K.sph(1), nm, 0, 0, 0, 0.04, 0.032, 0.03); K.m(g, K.box(), nm, 0.035, 0.07, 0, 0.012, 0.14, 0.012); notes.push(g); } }
  var ring = K.m(b, K.tor(0.2, 0.04, 5, 20), ringM, 0, 1.0, 0.4);
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q, 0.15);
    var slap = q.st === 'atk' ? (q.p < 0.5 ? 0 : q.p < 0.62 ? sm((q.p - 0.5) / 0.12) : 1 - sm((q.p - 0.62) / 0.38)) : 0;
    var sway = sin(t * 1.2);
    up.position.y = 0.42 + sin(t * 2) * 0.015 - (q.Z ? 0.03 : 0);
    up.rotation.set(-0.1 * q.A + 0.5 * slap + (q.Z ? 0.15 : 0), sway * 0.18 * (1 - q.Z) + 0.6 * slap, sway * 0.05 + (q.Z ? 0.15 : 0));
    tl.rotation.set(-0.9 * slap, 0, sin(t * 1.2 + 1) * 0.05);
    fl.rotation.set(-0.6 * slap + sin(t * 2) * 0.05, 0, 0);
    hd.rotation.set(0.12 * q.H + (q.Z ? 0.3 : 0) - 0.1 * q.A, sin(t * 0.8) * 0.12, sin(t * 1.2 + 0.5) * 0.08 + (q.Z ? 0.2 : 0));
    hat.rotation.set(-0.12 - 0.15 * slap, 0, 0.12 + 0.05 * sin(t * 1.2) + (q.st === 'idle' ? 0.12 * pulse(t, 6, 1, 1) : 0));
    fins.forEach(function(g, i){ var s = i ? 1 : -1; g.rotation.set(-1.4 * q.A * (i ? 1 : 0.3) + 0.6 * q.S * (i ? 1 : 0), 0, s * (0.2 + sin(t * 1.8 + i * PI) * 0.15 + 0.3 * q.H)); });
    var ringU = q.st === 'atk' ? cl((q.p - 0.25) / 0.35) : 0;
    bubs.forEach(function(m, i){
      var a = t * 1.4 + i * PI / 3, h = fr(t * 0.25 + i / 6);
      var R = 0.42 + 0.06 * sin(t + i), x = cos(a) * R, y = 0.2 + h * 1.1, z = sin(a) * R;
      var fa = i / 6 * PI * 2, rx = cos(fa) * 0.2, ry = 1.0 + sin(fa) * 0.2, rz = 0.4 + 0.5 * ringU;
      var u = q.st === 'atk' ? sm(q.p / 0.3) : 0;
      m.position.set(lerp(x, rx, u), lerp(y, ry, u), lerp(z, rz, u));
      m.visible = !q.Z && !(q.st === 'atk' && q.p > 0.6);
    });
    bub.emissiveIntensity = 0.4 + 0.3 * sin(t * 3);
    ring.visible = q.st === 'atk' && q.p > 0.3 && q.p < 0.9; ring.position.z = 0.4 + 0.7 * ringU; ring.scale.setScalar(0.8 + 1.4 * ringU); ringM.opacity = 0.6 * (1 - cl((q.p - 0.5) / 0.4));
    bandM.emissiveIntensity = asc >= 3 ? 1.0 + 0.6 * sin(t * 2.5) : 0;
    notes.forEach(function(g, i){ var a = -t * 0.9 + i * PI; g.position.set(cos(a) * 0.48, 0.9 + 0.3 * sin(t * 1.3 + i * 2), sin(a) * 0.48); g.rotation.set(0, -a, 0.2 * sin(t * 3 + i)); g.visible = !q.Z; });
    var op = q.Z ? 0 : q.H > 0.2 ? 0.3 : blink(t, 3.8, 1.3);
    var wink = q.st === 'idle' && pulse(t, 7, 3, 0.4) > 0.3;
    eyes.forEach(function(e, i){ e.set(wink && i === 1 ? 0 : op, sin(t * 0.8) * 0.3, 0); });
  } };
};

/* =========================================================
   GIRINO (girino) - ficha
   girino de olhao, ponta do rabo espinhenta. ataque: rabanada espinhosa
   ========================================================= */
C['girino'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root), bd = K.grp(b, 0, 0.28, 0);
  var skin = K.corpo(K.mat(0x3E4E34, { r: 0.4 })), bel = K.mat(0x9AA878, { r: 0.5 }), fin = K.mat(0x6A7A58, { r: 0.4, op: 0.75, ds: true });
  var sp = asc >= 3 ? K.glow(0x9FFFE0, 1.6) : K.mat(0xC8C29A, { r: 0.45 }), line = K.mat(0x101408);
  K.m(bd, K.sph(3), skin, 0, 0, 0, 0.25, 0.22, 0.26);
  K.m(bd, K.sph(2), bel, 0, -0.11, 0.02, 0.2, 0.12, 0.2);
  var eyes = [];
  [-1, 1].forEach(function(s){ eyes.push(K.eye(bd, { r: 0.1, x: s * 0.12, y: 0.12, z: 0.13, ry: s * 0.35, iris: 0x2A3A1A, pr: 0.42 })); });
  K.m(bd, K.tor(0.08, 0.01, 3, 12, PI), line, 0, -0.04, 0.24).rotation.z = PI;
  var tail = [], prev = K.grp(bd, 0, 0, -0.2);
  for (var i = 0; i < 3; i++){
    var g = K.grp(prev, 0, 0, i ? -0.13 : 0);
    K.m(g, K.sph(1), i ? fin : skin, 0, 0, -0.06, 0.08 - i * 0.015, 0.12 - i * 0.015, 0.1);
    tail.push(g); prev = g;
  }
  [-0.6, 0, 0.6].forEach(function(a){ var c = K.m(prev, K.cone(5), sp, 0, sin(a) * 0.05, -0.14, 0.022, 0.1, 0.022); c.rotation.x = -PI / 2 + a; });
  if (asc >= 3) K.m(prev, K.sph(0), K.glow(0xCFFFF0, 2.5), 0, 0, -0.2, 0.03);
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q);
    bd.position.set(0, 0.28 + (q.Z ? -0.02 : sin(t * 2.4) * 0.04), 0.15 * q.S);
    bd.rotation.set(0.1 * q.S - 0.1 * q.A, sin(t * 3) * 0.1 * (1 - q.Z) + PI * 0.9 * q.S, 0);
    tail.forEach(function(g, i){ g.rotation.y = (q.Z ? sin(t * 1.2 - i) * 0.1 : sin(t * 7 - i * 1.1) * 0.35) + 0.5 * q.A; });
    var op = q.Z ? 0 : q.H > 0.2 ? 0.3 : blink(t, 3.1, 0.5);
    eyes.forEach(function(e){ e.set(op, 0, 0); });
  } };
};
})();
