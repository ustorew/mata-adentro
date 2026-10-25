/* m3d-d.js (v10): modelos 3D chibi-heroicos de Noite (Assombracoes). IIFE; unico global: window.CHAR3D.
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
   VISAGEM (ovelha-felpuda)
   aparicao de lencol rasgado cinza-azulado, nucleo de luz de lamparina, olhos ocos; a barra flutua.
   ataque: empurrao que atravessa (fica translucida e avanca)
   ========================================================= */
C['ovelha-felpuda'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root), fl = K.grp(b, 0, 0.18, 0);
  var sheet = K.corpo(K.own(0x6E7EA8, { r: 0.75, op: 0.86, ds: true, e: 0x283860, ei: 0.4 }));
  var coreC = asc >= 3 ? 0xC07AFF : 0xFFC86A, coreE = asc >= 3 ? 0x8A3AFF : 0xFFA030;
  var core = K.own(coreC, { r: 0.3, e: coreE, ei: 1.2 }), halo = K.own(coreC, { op: 0.18, add: true, e: coreE, ei: 0.8 });
  var hollow = K.mat(0x0A0C18, { r: 0.9 });
  K.m(fl, K.lathe('visagem', [[0.47, 0.12], [0.4, 0.3], [0.35, 0.5], [0.33, 0.72], [0.31, 0.92], [0.25, 1.08], [0.14, 1.17], [0.0, 1.2]], 18), sheet, 0, 0, 0);
  var tat = [];
  for (var i = 0; i < 8; i++){
    var a = i / 8 * PI * 2 + 0.2, g = K.grp(fl, sin(a) * 0.42, 0.14, cos(a) * 0.42); g.rotation.y = a;
    K.m(g, K.cone(5), sheet, 0, -0.1, 0, 0.09, 0.22, 0.04).rotation.x = PI;
    tat.push(g);
  }
  var cg = K.grp(fl, 0, 0.62, 0.05);
  K.m(cg, K.sph(2), core, 0, 0, 0, 0.075);
  var hl = K.m(cg, K.sph(2), halo, 0, 0, 0, 0.14);
  var flame = null;
  if (asc >= 3){ flame = K.m(cg, K.cone(8), K.own(0xE0B0FF, { op: 0.8, add: true, e: 0xA040FF, ei: 2 }), 0, 0.17, 0, 0.07, 0.24, 0.07); }
  var eyes = [];
  [-1, 1].forEach(function(s){ eyes.push(K.geye(fl, { r: 0.065, x: s * 0.1, y: 0.96, z: 0.26, ry: s * 0.25, c: 0xCFE6FF, k: 1.8 })); });
  var mouth = K.m(fl, K.sph(1), hollow, 0, 0.83, 0.3, 0.045, 0.06, 0.02);
  var arms = [];
  [-1, 1].forEach(function(s){
    var g = K.grp(fl, s * 0.29, 0.82, 0.02);
    var m = K.m(g, K.cone(6), sheet, s * 0.06, -0.15, 0, 0.08, 0.34, 0.04); m.rotation.set(PI, 0, -s * 0.35);
    arms.push(g);
  });
  var mist = [];
  if (asc >= 3){ var mm = K.mat(0xB8C8F0, { op: 0.28, r: 0.9 }); for (var j = 0; j < 3; j++) mist.push(K.m(fl, K.sph(1), mm, 0, 0.1, -0.2 - j * 0.15, 0.2 - j * 0.04, 0.12, 0.2)); }
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q, 0.12);
    var rise = q.st === 'entra' ? (1 - q.e) * -0.4 : 0;
    fl.position.set(0, 0.18 + (q.Z ? -0.12 + sin(t * 0.8) * 0.01 : sin(t * 1.5) * 0.06) + rise, -0.15 * q.A + 0.45 * q.S);
    fl.rotation.set(-0.15 * q.A + 0.25 * q.S + (q.Z ? 0.1 : 0), sin(t * 0.5) * 0.2 * (1 - q.Z), sin(t * 1.1) * 0.06);
    fl.scale.set(1 + 0.05 * sin(t * 2), 1 - 0.04 * sin(t * 2) - (q.Z ? 0.08 : 0), 1);
    tat.forEach(function(g, i){ g.rotation.set(sin(t * 2.4 + i * 1.3) * 0.35 + 0.4 * q.S, g.rotation.y, 0); });
    sheet.opacity = 0.86 - 0.5 * Math.max(q.A, q.S) - (q.st === 'hit' ? 0.4 * (sin(q.p * 40) * 0.5 + 0.5) * q.H : 0);
    var dim = q.Z ? 0.35 : 1;
    core.emissiveIntensity = (1.1 + 0.4 * sin(t * 3)) * dim + 1.5 * q.S;
    halo.opacity = (0.15 + 0.06 * sin(t * 3)) * dim + 0.25 * q.S; hl.scale.setScalar(0.14 + 0.02 * sin(t * 3) + 0.08 * q.S);
    if (flame){ flame.scale.set(0.07, 0.24 * (1 + 0.25 * sin(t * 9)), 0.07); flame.rotation.z = sin(t * 7) * 0.2; }
    arms.forEach(function(g, i){ var s = i ? 1 : -1; g.rotation.set(-1.3 * q.S - 0.4 * q.A + sin(t * 1.3 + i) * 0.12, 0, s * (0.2 + 0.4 * q.H + sin(t * 1.1 + i * 2) * 0.1)); });
    var op = q.Z ? 0 : q.H > 0.3 ? 0.4 : blink(t, 5, 1);
    eyes.forEach(function(e){ e.set(op); });
    mouth.scale.set(0.045 + 0.02 * q.S, 0.06 + 0.06 * q.S + 0.04 * q.H, 0.02);
    mist.forEach(function(m, i){ var u = fr(t * 0.4 + i / 3); m.position.set(sin(t + i) * 0.1, 0.1 - u * 0.1, -0.15 - u * 0.4); m.scale.set(0.2 + u * 0.15, 0.1, 0.2 + u * 0.15); });
  } };
};

/* =========================================================
   MATINTA PERERA (vaca-mimosa)
   senhora digna de xale-capuz de penas negras, olhos que brilham no capuz, passaro preto no ombro, cajado.
   idle: assobia. ataque: rajada de asa-xale
   ========================================================= */
C['vaca-mimosa'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var cloak = K.corpo(K.mat(0x1E1A28, { r: 0.45, m: 0.15, ds: true })), f1 = K.mat(0x2A2438, { r: 0.4, m: 0.2, ds: true }), f2 = K.mat(0x4E3C78, { r: 0.3, m: 0.35, ds: true });
  var skin = K.mat(0x4E3020, { r: 0.6 }), hair = K.mat(0xD8D4CC, { r: 0.8 }), wood = K.mat(0x6A4628, { r: 0.75 }), beak = K.mat(0x8A8478, { r: 0.4 });
  var dark = K.mat(0x2A2C3E, { r: 0.35, m: 0.3 }), line = K.mat(0x2A140C);
  K.m(b, K.cyl(0.4, 0.43, 16), K.mat(0x5A2420, { r: 0.8 }), 0, 0.05, 0, 1, 0.1, 1);
  K.m(b, K.lathe('matinta', [[0.0, 0.08], [0.41, 0.08], [0.39, 0.2], [0.31, 0.5], [0.24, 0.8], [0.17, 0.98], [0.0, 1.02]], 16), cloak, 0, 0, 0);
  var fe = [];
  [[0, 0.62, 0.22, 0], [0.16, 0.6, 0.16, 0.7], [-0.16, 0.6, 0.16, -0.7], [0.08, 0.36, 0.3, 0.3], [-0.08, 0.36, 0.3, -0.3], [0.26, 0.34, 0.16, 1.0], [-0.26, 0.34, 0.16, -1.0], [0, 0.82, 0.18, 0]].forEach(function(d, i){
    var m = K.m(b, K.sph(1), i % 2 ? f1 : f2, d[0], d[1], d[2], 0.13, 0.26, 0.03); m.rotation.set(-0.25, d[3], 0); fe.push(m);
  });
  var hd = K.grp(b, 0, 1.12, 0.02);
  K.m(hd, K.sph(2), skin, 0, -0.02, 0.04, 0.16, 0.17, 0.15);
  var hood = K.m(hd, K.hemi(2), K.mat(0x1E1A28, { r: 0.45, m: 0.15, ds: true }), 0, 0.03, 0.02, 0.25, 0.27, 0.26); hood.rotation.x = -PI / 2 - 0.15;
  K.m(hd, K.sph(1), f1, 0, 0.2, -0.08, 0.2, 0.12, 0.2);
  [-1, 1].forEach(function(s){ var h = K.m(hd, K.cap(0.03, 0.07, 5), hair, s * 0.15, 0.04, 0.05); h.rotation.z = s * 0.5; });
  var eyes = [];
  [-1, 1].forEach(function(s){ eyes.push(K.geye(hd, { r: 0.04, x: s * 0.06, y: 0.0, z: 0.17, c: 0xFFC14A, k: 2.4, sock: 0x140A06, sy: 0.9 })); });
  K.m(hd, K.sph(1), skin, 0, -0.05, 0.19, 0.025, 0.03, 0.025);
  var mouth = K.m(hd, K.tor(0.016, 0.007, 4, 10), line, 0, -0.1, 0.17);
  // bracos, cajado
  var stf = K.grp(b, 0.3, 0.62, 0.18);
  K.m(stf, K.cyl(0.022, 0.026, 6), wood, 0, 0.0, 0, 1, 1.25, 1);
  K.m(stf, K.sph(1), wood, 0, 0.62, 0, 0.045);
  K.m(stf, K.sph(1), skin, -0.03, 0.06, 0.02, 0.05);
  var hL = K.m(b, K.sph(1), skin, -0.1, 0.72, 0.25, 0.04);
  // abas do xale (asas)
  var flaps = [];
  [-1, 1].forEach(function(s){
    var g = K.grp(b, s * 0.18, 0.98, 0.0);
    K.m(g, K.sph(1), f1, s * 0.12, -0.25, 0.02, 0.1, 0.3, 0.03).rotation.z = s * 0.25;
    K.m(g, K.sph(1), f2, s * 0.2, -0.32, -0.02, 0.08, 0.24, 0.025).rotation.z = s * 0.45;
    flaps.push(g);
  });
  // passaro no ombro
  var bird = K.grp(b, -0.3, 0.98, 0.02); bird.scale.set(1.35, 1.35, 1.35);
  K.m(bird, K.sph(1), dark, 0, 0.06, 0, 0.06, 0.055, 0.08);
  var bh = K.grp(bird, 0, 0.12, 0.04);
  K.m(bh, K.sph(1), dark, 0, 0, 0, 0.045);
  K.m(bh, K.cone(5), beak, 0, -0.005, 0.06, 0.014, 0.05, 0.014).rotation.x = PI / 2;
  var be = K.m(bh, K.sph(0), K.glow(0xFFC14A, 2.4), 0.025, 0.012, 0.03, 0.012); be.userData.olho = true;
  K.m(bird, K.cone(5), dark, 0, 0.04, -0.1, 0.03, 0.1, 0.02).rotation.x = -PI / 2 - 0.4;
  var wings = [];
  if (asc >= 3){
    [-1, 1].forEach(function(s){
      var g = K.grp(b, s * 0.12, 1.0, -0.2);
      for (var k = 0; k < 3; k++){ var m = K.m(g, K.sph(1), k % 2 ? f2 : f1, s * (0.2 + k * 0.12), 0.08 - k * 0.1, 0, 0.09, 0.3 - k * 0.04, 0.02); m.rotation.z = s * (0.9 + k * 0.35); }
      wings.push(g);
    });
  }
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q, 0.12);
    b.position.z += 0.15 * q.S;
    b.rotation.x += 0.15 * q.S - 0.08 * q.A + (q.Z ? 0.06 : 0);
    var wh = q.st === 'idle' ? pulse(t, 5.5, 1, 2.0) : 0;
    hd.rotation.set(0.25 * (q.Z ? 1 : 0) - 0.1 * wh + 0.15 * q.H, sin(t * 0.5) * 0.15 * (1 - q.Z), 0.12 * wh);
    mouth.scale.set(1 - 0.3 * wh, 1 + 0.6 * wh, 1);
    fe.forEach(function(m, i){ m.rotation.x = -0.25 - 0.1 * sin(t * 1.5 + i) - 0.3 * q.S; });
    flaps.forEach(function(g, i){ var s = i ? 1 : -1; g.rotation.set(-0.3 * q.S, 0, s * (1.6 * q.A + 1.2 * q.S + 0.08 * sin(t * 1.2) + 0.3 * q.H)); });
    stf.rotation.set(0.1 * q.A - 0.2 * q.S, 0, -0.05 + 0.03 * sin(t * 0.8));
    hL.position.set(-0.1 - 0.15 * q.S, 0.72 + 0.1 * q.S, 0.25 + 0.1 * q.S);
    var hop = q.st === 'idle' ? pulse(t, 3.3, 0.4, 0.35) : 0;
    bird.position.set(-0.3, 0.98 + 0.05 * hop + 0.25 * q.A * (1 - q.S) + (q.st === 'atk' ? 0.3 * q.S : 0), 0.0 + 0.3 * q.S);
    bird.rotation.set(0, sin(t * 0.7) * 0.6, 0);
    bh.rotation.set(q.Z ? 0.9 : 0.35 * pulse(t, 2.6, 1.2, 0.3), q.Z ? 2.4 : sin(t * 1.9) * 0.4, 0);
    var op = q.Z ? 0 : q.H > 0.3 ? 0.4 : blink(t, 4.6, 0.6);
    eyes.forEach(function(e){ e.set(op); });
    be.visible = !q.Z;
    wings.forEach(function(g, i){ var s = i ? 1 : -1; g.rotation.set(0, s * -0.3, s * (-0.1 + 0.08 * sin(t * 1.4) - 0.4 * q.S)); });
  } };
};

/* =========================================================
   LOBINHO DA LUA (bezerro-manhoso)
   filhote de lobo de orelhonas, marca de lua crescente na testa. ataque: bote com mordida
   ========================================================= */
C['bezerro-manhoso'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var fur = K.corpo(K.mat(0x5E6A82, { r: 0.75 })), dk = K.mat(0x3E4658, { r: 0.8 }), lt = K.mat(0xCDD2DC, { r: 0.8 }), inn = K.mat(0xB88A98, { r: 0.7 });
  var nose = K.mat(0x15141A, { r: 0.3 }), moon = K.own(0xE8EEFF, { r: 0.3, e: 0xBFD4FF, ei: asc >= 3 ? 2.2 : 0.25 }), tooth = K.mat(0xFFFFFF, { r: 0.4 }), mouthM = K.mat(0x5A1E2A);
  var bd = K.grp(b, 0, 0, 0);
  K.m(bd, K.sph(2), fur, 0, 0.3, -0.08, 0.25, 0.22, 0.32);
  K.m(bd, K.sph(2), lt, 0, 0.36, 0.12, 0.17, 0.2, 0.14);
  var hd = K.grp(bd, 0, 0.62, 0.1);
  K.m(hd, K.sph(3), fur, 0, 0, 0, 0.25, 0.22, 0.22);
  K.m(hd, K.sph(2), lt, 0, -0.07, 0.12, 0.17, 0.11, 0.13);
  var sn = K.grp(hd, 0, -0.05, 0.2);
  K.m(sn, K.sph(2), lt, 0, 0, 0.03, 0.09, 0.07, 0.1);
  K.m(sn, K.sph(1), nose, 0, 0.04, 0.12, 0.035, 0.025, 0.025);
  var jaw = K.grp(hd, 0, -0.1, 0.17);
  K.m(jaw, K.sph(1), lt, 0, -0.01, 0.04, 0.07, 0.03, 0.08);
  K.m(jaw, K.sph(1), mouthM, 0, 0.015, 0.04, 0.06, 0.015, 0.07);
  [-1, 1].forEach(function(s){ K.m(sn, K.cone(4), tooth, s * 0.035, -0.05, 0.08, 0.012, 0.03, 0.012).rotation.x = PI; });
  var eyes = [], ears = [];
  [-1, 1].forEach(function(s){
    eyes.push(K.eye(hd, { r: 0.075, x: s * 0.1, y: 0.03, z: 0.16, ry: s * 0.3, iris: 0x6C9ADA, ir: 0.72, pr: 0.45 }));
    var e = K.grp(hd, s * 0.15, 0.16, -0.02);
    K.m(e, K.cone(6), dk, 0, 0.16, 0, 0.11, 0.32, 0.06);
    K.m(e, K.cone(6), inn, 0, 0.14, 0.03, 0.065, 0.24, 0.02);
    ears.push(e);
  });
  var cres = K.m(hd, K.tor(0.05, 0.016, 5, 14, PI * 1.25), moon, 0, 0.12, 0.2); cres.rotation.set(-0.3, 0, -PI * 0.12);
  var howl = null;
  if (asc >= 3){ howl = K.m(hd, K.tor(0.14, 0.012, 4, 22), K.own(0xCFE0FF, { op: 0.6, add: true, e: 0xBFD4FF, ei: 1.5 }), 0, -0.06, 0.32); }
  var legs = [];
  [[-1, 0.12, 0.12], [1, 0.12, 0.12], [-1, 0.16, -0.2], [1, 0.16, -0.2]].forEach(function(d, i){
    var g = K.grp(bd, d[0] * d[1], i < 2 ? 0.28 : 0.2, d[2]);
    K.m(g, K.cap(i < 2 ? 0.055 : 0.09, i < 2 ? 0.18 : 0.08, 8), i < 2 ? fur : fur, 0, i < 2 ? -0.13 : -0.05, 0);
    K.m(g, K.sph(1), lt, 0, i < 2 ? -0.26 : -0.17, 0.04, 0.07, 0.04, 0.09);
    legs.push(g);
  });
  var tail = K.grp(bd, 0, 0.26, -0.36);
  K.m(tail, K.sph(1), dk, 0, 0.1, -0.06, 0.08, 0.18, 0.08).rotation.x = -0.6;
  K.m(tail, K.sph(1), lt, 0, 0.24, -0.15, 0.05, 0.06, 0.05);
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q);
    var leap = q.st === 'atk' ? 0.25 * Math.sin(PI * cl((q.p - 0.3) / 0.3)) : 0;
    bd.position.set(0, leap - 0.06 * q.A + (q.Z ? -0.1 : 0), 0.4 * q.S);
    bd.rotation.set(0.2 * q.A - 0.15 * q.S + (q.Z ? 0.1 : 0), 0, 0);
    hd.rotation.set(-0.2 * q.A + 0.2 * q.S + 0.2 * q.H + (q.Z ? 0.35 : 0), q.Z ? 0.4 : sin(t * 0.6) * 0.2, q.Z ? 0.3 : sin(t * 0.9) * 0.15);
    var bite = q.st === 'atk' ? (q.p < 0.45 ? sm(q.p / 0.4) : 1 - sm((q.p - 0.5) / 0.08)) : 0;
    jaw.rotation.x = 0.6 * bite + 0.3 * q.H;
    ears.forEach(function(e, i){ var s = i ? 1 : -1; e.rotation.set(-0.2 * q.A + (q.Z ? 0.7 : 0), 0, s * (-0.15 + 0.15 * pulse(t, 2.7, i * 0.9, 0.25) - 0.4 * q.H)); });
    legs.forEach(function(g, i){ g.rotation.x = (i < 2 ? -1.1 : 0.7) * q.S + (i < 2 ? 0.3 : -0.2) * q.A + (q.Z ? (i < 2 ? -1.2 : 0.5) : 0); });
    tail.rotation.set(-0.3 * q.A, sin(t * (q.Z ? 0.5 : 9)) * (q.Z ? 0.1 : 0.45), 0);
    var op = q.Z ? 0 : q.H > 0.3 ? 0.3 : blink(t, 3.4, 0.9);
    eyes.forEach(function(e){ e.set(op, 0, 0); });
    moon.emissiveIntensity = (asc >= 3 ? 1.8 + 0.6 * sin(t * 2) : 0.2) + 1.2 * q.S;
    if (howl){ var u = fr(t * 0.6); howl.scale.setScalar(0.6 + 1.2 * u); howl.material.opacity = 0.6 * (1 - u); }
  } };
};

/* =========================================================
   CABRA-CABRIOLA (cabrito-teimoso)
   cabra-monstro preta em duas patas: olhos de brasa, chifres tortos, sino rachado na coleira. ataque: carga de chifre
   ========================================================= */
C['cabrito-teimoso'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var fur = K.corpo(K.mat(0x221E26, { r: 0.75 })), fur2 = K.mat(0x3A3240, { r: 0.8 }), horn = K.mat(0x8E7C62, { r: 0.55 }), hoof = K.mat(0x121014, { r: 0.4 });
  var leather = K.mat(0x5A3A22, { r: 0.6 }), bronze = K.mat(0xA07A34, { r: 0.35, m: 0.85 }), crack = K.mat(0x140C06), beard = K.mat(0x5A5260, { r: 0.85 });
  var muz = K.mat(0x2E2830, { r: 0.7 }), fire = K.own(0xFF8A2A, { r: 0.4, op: 0.85, add: true, e: 0xFF5A00, ei: 2.2 });
  var tor = K.grp(b, 0, 0.62, 0);
  K.m(tor, K.sph(2), fur, 0, 0.1, 0, 0.23, 0.27, 0.2);
  [[0, 0.16, 0.16], [-0.1, 0.06, 0.15], [0.1, 0.06, 0.15]].forEach(function(d){ K.m(tor, K.cone(5), fur2, d[0], d[1], d[2], 0.07, 0.16, 0.05).rotation.x = PI + 0.3; });
  K.m(tor, K.tor(0.14, 0.03, 5, 16), leather, 0, 0.32, 0.02).rotation.x = PI / 2 - 0.2;
  var bell = K.grp(tor, 0, 0.27, 0.16);
  K.m(bell, K.lathe('sino', [[0.0, 0.0], [0.07, -0.01], [0.06, 0.04], [0.04, 0.09], [0.0, 0.1]], 10), bronze, 0, -0.08, 0);
  K.m(bell, K.box(), crack, 0.02, -0.03, 0.055, 0.008, 0.07, 0.01).rotation.z = 0.4;
  var hd = K.grp(tor, 0, 0.48, 0.02);
  K.m(hd, K.sph(3), fur, 0, 0, 0, 0.21, 0.2, 0.2);
  var mz = K.m(hd, K.sph(2), muz, 0, -0.08, 0.15, 0.1, 0.09, 0.14);
  K.m(hd, K.cone(5), beard, 0, -0.2, 0.18, 0.04, 0.12, 0.03).rotation.x = PI;
  var eyes = [];
  [-1, 1].forEach(function(s){
    eyes.push(K.eye(hd, { r: 0.065, x: s * 0.095, y: 0.04, z: 0.14, ry: s * 0.35, white: 0xFFC890, iris: 0xFF4A00, ie: 0xFF3A00, iei: 2.2, slit: true, ir: 0.8 }));
    var bw = K.m(hd, K.cap(0.02, 0.08, 5), hoof, s * 0.09, 0.12, 0.17); bw.rotation.z = PI / 2 + s * 0.45;
    var ea = K.m(hd, K.sph(1), fur2, s * 0.22, 0.04, -0.02, 0.1, 0.035, 0.05); ea.rotation.z = s * -0.3;
  });
  var horns = [], tips = [];
  [-1, 1].forEach(function(s){
    var g = K.grp(hd, s * 0.09, 0.15, -0.02); g.rotation.set(-0.3, s * 0.4, s * 0.35);
    var h = K.m(g, K.tor(0.19, 0.045, 6, 12, PI * 0.9), horn, -s * 0.0, 0, 0); h.rotation.set(0, PI / 2, s > 0 ? 0 : 0);
    var tp = K.grp(g, 0, 0.0, -0.38);
    K.m(tp, K.cone(6), horn, 0, -0.04, 0, 0.03, 0.1, 0.03).rotation.x = PI + 0.6 * s;
    horns.push(g); tips.push(tp);
  });
  var flames = [];
  if (asc >= 3){ tips.forEach(function(tp){ flames.push(K.m(tp, K.cone(6), fire, 0, -0.1, 0, 0.05, 0.16, 0.05)); flames.push(K.m(tp, K.sph(0), K.glow(0xFFD060, 2.5), 0, -0.1, 0, 0.03)); }); }
  var arms = [], legs = [];
  [-1, 1].forEach(function(s){
    var a = K.grp(tor, s * 0.22, 0.24, 0);
    K.m(a, K.cap(0.055, 0.16, 8), fur, 0, -0.12, 0);
    K.m(a, K.cyl(0.05, 0.06, 8), hoof, 0, -0.27, 0, 1, 0.06, 1);
    arms.push(a);
    var l = K.grp(b, s * 0.11, 0.5, 0);
    K.m(l, K.sph(1), fur, 0, 0.02, 0, 0.11, 0.13, 0.12);
    var sh = K.grp(l, 0, -0.06, 0.02);
    K.m(sh, K.cap(0.055, 0.26, 8), fur2, 0, -0.17, -0.03).rotation.x = 0.2;
    K.m(sh, K.cyl(0.065, 0.075, 8), hoof, 0, -0.4, 0.0, 1, 0.07, 1);
    legs.push(l);
  });
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q);
    b.position.z += 0.4 * q.S - 0.1 * q.A;
    tor.position.y = 0.62 + sin(t * 2.4) * 0.012 - 0.04 * q.A - (q.Z ? 0.06 : 0);
    tor.rotation.set(0.15 * q.A + 0.55 * q.S + (q.Z ? 0.2 : 0), sin(t * 0.7) * 0.12 * (1 - q.Z), sin(t * 1.2) * 0.04);
    hd.rotation.set(0.5 * q.A + 0.35 * q.S + 0.25 * q.H + (q.Z ? 0.4 : 0), q.Z ? 0 : sin(t * 0.9) * 0.2, (q.st === 'idle' ? 0.2 * pulse(t, 4.4, 0.5, 0.6) : 0));
    bell.rotation.set(0, 0, sin(t * 5) * 0.2 + sin(q.p * 30) * 0.4 * (q.S + q.H));
    arms.forEach(function(a, i){ var s = i ? 1 : -1; a.rotation.set(-0.6 * q.A + 0.8 * q.S - 0.2 + sin(t * 2 + i * PI) * 0.1, 0, s * (0.15 + 0.4 * q.H)); });
    legs.forEach(function(l, i){ l.rotation.x = (i ? 0.5 : -0.5) * q.S + (q.st === 'idle' ? sin(t * 2.4 + i * PI) * 0.05 : 0) + (q.Z ? -0.3 : 0); });
    var op = q.Z ? 0 : q.H > 0.3 ? 0.35 : blink(t, 3.9, 0.3);
    eyes.forEach(function(e){ e.set(op, 0, 0); });
    flames.forEach(function(f, i){ if (i % 2 === 0){ f.scale.set(0.05, 0.16 * (1 + 0.3 * sin(t * 11 + i) + 0.6 * q.S), 0.05); f.rotation.z = sin(t * 8 + i) * 0.2; } });
    fire.opacity = q.Z ? 0.3 : 0.85;
  } };
};

/* =========================================================
   CORPO-SECO (bode-marrento)
   casca de pau seco que anda: pele de casca, raizes pendendo dos bracos, olhos ocos verdes, chapeu de palha rasgado
   ataque: marretada dupla cambaleante
   ========================================================= */
C['bode-marrento'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var bark = K.corpo(K.mat(0x4E3E2E, { r: 0.85, fs: true })), bark2 = K.mat(0x3A2C20, { r: 0.9, fs: true }), root2 = K.mat(0x5E4A34, { r: 0.85 });
  var straw = K.mat(0x9A8450, { r: 0.8, ds: true }), strawD = K.mat(0x6E5C34, { r: 0.85 }), rag = K.mat(0x3A3A2C, { r: 0.9, ds: true }), hole = K.mat(0x0A0806, { r: 0.9 });
  var gf = K.own(0x8AFF6A, { r: 0.4, e: 0x3AFF2A, ei: 2.0 });
  var tor = K.grp(b, 0, 0.68, -0.02);
  K.m(tor, K.cap(0.15, 0.26, 8), bark, 0, 0.1, 0);
  K.m(tor, K.sph(1), bark2, 0, 0.0, 0.08, 0.13, 0.18, 0.08);
  var rg = K.m(tor, K.cyl(0.18, 0.22, 7, true), rag, 0, -0.08, 0, 1, 0.18, 1);
  var hd = K.grp(tor, 0, 0.42, 0.06);
  K.m(hd, K.sph(2), bark, 0, 0, 0, 0.18, 0.2, 0.17);
  K.m(hd, K.sph(1), bark2, 0, -0.1, 0.06, 0.13, 0.08, 0.11);
  var eyes = [];
  [-1, 1].forEach(function(s){ eyes.push(K.geye(hd, { r: 0.05, x: s * 0.07, y: 0.02, z: 0.15, ry: s * 0.2, c: 0x4AFF2A, k: 1.4, own: true })); });
  var mouth = K.m(hd, K.box(), hole, 0, -0.1, 0.155, 0.1, 0.02, 0.02);
  var hat = K.grp(hd, 0.02, 0.15, -0.01); hat.rotation.set(-0.15, 0, 0.22);
  K.m(hat, K.disc(14, 0.5, PI * 2 - 1.1), straw, 0, 0, 0, 0.32, 0.02, 0.32);
  K.m(hat, K.cyl(0.13, 0.16, 8, true), straw, 0, 0.08, 0, 1, 0.16, 1);
  K.m(hat, K.disc(8), strawD, 0, 0.16, 0, 0.12, 0.01, 0.12);
  var arms = [];
  [-1, 1].forEach(function(s){
    var sh = K.grp(tor, s * 0.19, 0.24, 0);
    K.m(sh, K.cap(0.045, 0.22, 6), bark, 0, -0.14, 0);
    var fa = K.grp(sh, 0, -0.29, 0);
    K.m(fa, K.cap(0.04, 0.2, 6), bark2, 0, -0.12, 0);
    K.m(fa, K.sph(1), bark, 0, -0.27, 0.01, 0.075, 0.08, 0.075);
    var rr = [];
    [[0.04, -0.05], [-0.04, -0.12], [0.0, -0.2]].forEach(function(d, k){ var r = K.m(fa, K.cone(4), root2, d[0], d[1] - 0.06, -0.04, 0.012, 0.18 - k * 0.03, 0.012); r.rotation.x = PI + 0.2; rr.push(r); });
    arms.push({ sh: sh, fa: fa, rr: rr });
  });
  var legs = [];
  [-1, 1].forEach(function(s){
    var l = K.grp(b, s * 0.09, 0.56, 0);
    K.m(l, K.cap(0.05, 0.4, 6), bark2, 0, -0.27, 0);
    K.m(l, K.sph(1), bark, 0, -0.54, 0.05, 0.07, 0.035, 0.12);
    K.m(l, K.cone(4), root2, s * 0.05, -0.54, 0.17, 0.02, 0.1, 0.02).rotation.x = PI / 2;
    legs.push(l);
  });
  var cracks = [];
  if (asc >= 3){
    [[0.05, 0.15, 0.15, 0.4], [-0.07, 0.02, 0.15, -0.5], [0.0, 0.3, 0.14, 0.1]].forEach(function(d){ var m = K.m(tor, K.box(), gf, d[0], d[1], d[2], 0.015, 0.14, 0.012); m.rotation.z = d[3]; cracks.push(m); });
    [-1, 1].forEach(function(s){ cracks.push(K.m(tor, K.cone(6), K.own(0x9AFF7A, { op: 0.8, add: true, e: 0x3AFF2A, ei: 2.2 }), s * 0.2, 0.36, 0, 0.05, 0.16, 0.05)); });
  }
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q, 0.15);
    var lurch = sin(t * 1.4);
    b.position.z += 0.3 * q.S;
    tor.position.y = 0.68 + abs(sin(t * 1.4)) * 0.02 - (q.Z ? 0.06 : 0);
    tor.rotation.set(0.25 + 0.05 * lurch - 0.3 * q.A + 0.55 * q.S + (q.Z ? 0.3 : 0), 0, 0.08 * lurch * (1 - q.Z));
    hd.rotation.set(-0.15 * q.A + 0.2 * q.H + (q.Z ? 0.4 : 0), sin(t * 0.6) * 0.2 * (1 - q.Z), -0.15 + 0.06 * sin(t * 0.9) - 0.1 * q.H);
    hat.rotation.set(-0.15 + (q.Z ? 0.35 : 0), 0, 0.22 + 0.05 * sin(t * 1.3));
    arms.forEach(function(a, i){
      var s = i ? 1 : -1;
      a.sh.rotation.set(0.3 - 2.9 * q.A + 3.3 * q.S + sin(t * 1.4 + i * PI) * 0.15 * (1 - q.Z), 0, s * (0.12 + 0.3 * q.H) - s * 0.15 * q.A);
      a.fa.rotation.set(-0.4 - 0.4 * q.A + 0.3 * q.S + (q.Z ? 0.3 : 0), 0, 0);
      a.rr.forEach(function(r, k){ r.rotation.set(PI + 0.2 + sin(t * 2.2 + k + i) * 0.25, 0, sin(t * 1.7 + k * 2) * 0.2); });
    });
    legs.forEach(function(l, i){ l.rotation.x = (i ? 1 : -1) * (q.st === 'idle' ? sin(t * 1.4) * 0.12 : 0) + (i ? -0.4 : 0.3) * q.S + (q.Z ? -0.3 : 0); });
    var op = q.Z ? 0 : q.H > 0.3 ? 0.4 : blink(t, 6, 2);
    eyes.forEach(function(e){ e.set(op); e.mat.emissiveIntensity = 1.2 + 0.4 * sin(t * 3) + 1.2 * q.S; });
    mouth.scale.set(0.1, 0.02 + 0.05 * q.S + 0.04 * q.H, 0.02);
    gf.emissiveIntensity = 1.6 + 0.8 * sin(t * 2.5) + q.S;
    if (cracks.length > 3) for (var k = 3; k < cracks.length; k++) cracks[k].scale.set(0.05, 0.16 * (1 + 0.3 * sin(t * 10 + k)), 0.05);
  } };
};

/* =========================================================
   LOBISOMEM (touro-trovao)
   lobisomem chibi parrudo: pelo cinza-pardo desgrenhado, camisa de trabalho rasgada, olhos prata de lua, patorras.
   ataque: duas garradas (casa com ataqueDuplo)
   ========================================================= */
C['touro-trovao'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var fur = K.corpo(K.mat(0x5C5046, { r: 0.8 })), dk = K.mat(0x3A322C, { r: 0.85 }), lt = K.mat(0x9C8E7C, { r: 0.8 });
  var tuft = asc >= 3 ? K.mat(0xDCE6F4, { r: 0.3, m: 0.6, e: 0x9FB8E0, ei: 0.6 }) : K.mat(0x4A4038, { r: 0.85 });
  var shirt = K.mat(0x3E5A7E, { r: 0.85, ds: true }), shirt2 = K.mat(0x2A3E5A, { r: 0.85, ds: true }), claw = K.mat(0xE8E0D0, { r: 0.4 }), nose = K.mat(0x120E10, { r: 0.3 });
  var mouthM = K.mat(0x4A1018), tooth = K.mat(0xFFFAF0, { r: 0.35 });
  var tor = K.grp(b, 0, 0.62, 0);
  K.m(tor, K.sph(3), fur, 0, 0.18, 0, 0.36, 0.34, 0.28);
  K.m(tor, K.sph(2), lt, 0, 0.12, 0.17, 0.22, 0.24, 0.12);
  K.m(tor, K.lathe('camisa', [[0.0, -0.08], [0.34, -0.08], [0.37, 0.08], [0.36, 0.26], [0.26, 0.42], [0.0, 0.44]], 14, 0), shirt, 0, 0, -0.04, 1, 1, 0.92);
  [[-0.2, -0.1, 0.22], [0.05, -0.12, 0.3], [0.25, -0.09, 0.15], [-0.3, -0.1, -0.1]].forEach(function(d, i){ K.m(tor, K.cone(4), i % 2 ? shirt2 : shirt, d[0], d[1] - 0.04, d[2], 0.06, 0.12, 0.03).rotation.x = PI; });
  [[-0.3, 0.42, 0.0], [0.3, 0.42, 0.0], [-0.18, 0.5, -0.05], [0.18, 0.5, -0.05], [0, 0.46, -0.12]].forEach(function(d){ var c = K.m(tor, K.cone(5), tuft, d[0], d[1], d[2], 0.07, 0.18, 0.06); c.rotation.z = -d[0] * 1.5; });
  var hd = K.grp(tor, 0, 0.6, 0.06);
  K.m(hd, K.sph(3), fur, 0, 0, 0, 0.27, 0.24, 0.24);
  [-1, 1].forEach(function(s){ var c = K.m(hd, K.cone(5), tuft, s * 0.25, -0.08, 0.04, 0.06, 0.16, 0.05); c.rotation.z = s * 1.9; });
  var sn = K.grp(hd, 0, -0.06, 0.2);
  K.m(sn, K.sph(2), lt, 0, 0, 0.08, 0.11, 0.09, 0.19);
  K.m(sn, K.sph(1), nose, 0, 0.05, 0.26, 0.045, 0.035, 0.035);
  [-1, 1].forEach(function(s){ K.m(sn, K.cone(4), tooth, s * 0.05, -0.07, 0.2, 0.016, 0.05, 0.016).rotation.x = PI; });
  var jaw = K.grp(hd, 0, -0.13, 0.18);
  K.m(jaw, K.sph(1), lt, 0, -0.01, 0.09, 0.09, 0.04, 0.15);
  K.m(jaw, K.sph(1), mouthM, 0, 0.02, 0.09, 0.075, 0.02, 0.13);
  var eyes = [], brows = [];
  [-1, 1].forEach(function(s){
    eyes.push(K.eye(hd, { r: 0.065, x: s * 0.11, y: 0.06, z: 0.17, ry: s * 0.3, white: 0xF2F6FF, iris: 0xBCD2F0, ie: 0x8FB4FF, iei: 1.3, ir: 0.74, pr: 0.34 }));
    var bw = K.m(hd, K.cap(0.025, 0.09, 5), dk, s * 0.1, 0.14, 0.2); bw.rotation.z = PI / 2 + s * 0.5; brows.push(bw);
    var e = K.m(hd, K.cone(5), dk, s * 0.17, 0.27, -0.02, 0.09, 0.3, 0.05); e.rotation.z = -s * 0.3;
  });
  var arms = [];
  [-1, 1].forEach(function(s){
    var sh = K.grp(tor, s * 0.36, 0.32, 0);
    K.m(sh, K.cap(0.09, 0.2, 8), fur, 0, -0.14, 0);
    var fa = K.grp(sh, 0, -0.3, 0);
    K.m(fa, K.cap(0.08, 0.12, 8), fur, 0, -0.08, 0);
    K.m(fa, K.sph(2), dk, 0, -0.22, 0.03, 0.14, 0.12, 0.13);
    [-0.06, 0, 0.06].forEach(function(x){ var c = K.m(fa, K.cone(5), claw, x, -0.3, 0.1, 0.022, 0.1, 0.022); c.rotation.x = PI - 0.6; });
    arms.push({ sh: sh, fa: fa });
  });
  var legs = [];
  [-1, 1].forEach(function(s){
    var l = K.grp(b, s * 0.17, 0.5, 0);
    K.m(l, K.sph(2), fur, 0, 0, 0, 0.14, 0.16, 0.15);
    K.m(l, K.cap(0.07, 0.16, 8), dk, 0, -0.24, -0.04).rotation.x = -0.25;
    K.m(l, K.sph(1), dk, 0, -0.46, 0.06, 0.1, 0.05, 0.15);
    legs.push(l);
  });
  var tail = K.grp(tor, 0, 0.0, -0.26);
  K.m(tail, K.sph(1), dk, 0, -0.08, -0.12, 0.08, 0.08, 0.2).rotation.x = 0.5;
  var moonD = null;
  if (asc >= 3){ moonD = K.m(b, K.disc(28), K.mat(0xD8E0F4, { r: 0.5, e: 0x8A9ACC, ei: 0.7, op: 0.95 }), 0, 1.3, -0.45, 0.45, 0.01, 0.45); moonD.rotation.x = PI / 2; moonD.castShadow = false; }
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q, 0.15);
    var s1 = 0, s2 = 0;
    if (q.st === 'atk'){ s1 = q.p < 0.3 ? 0 : q.p < 0.42 ? sm((q.p - 0.3) / 0.12) : 1 - sm((q.p - 0.42) / 0.3); s2 = q.p < 0.44 ? 0 : q.p < 0.56 ? sm((q.p - 0.44) / 0.12) : 1 - sm((q.p - 0.56) / 0.35); }
    var br = sin(t * (q.Z ? 1.2 : 2.2));
    b.position.z += 0.25 * Math.max(s1, s2);
    tor.position.y = 0.62 + br * 0.015 - 0.05 * q.A - (q.Z ? 0.08 : 0);
    tor.rotation.set(0.12 + 0.1 * q.A + 0.15 * Math.max(s1, s2) + (q.Z ? 0.3 : 0), 0.5 * s1 - 0.5 * s2 + sin(t * 0.5) * 0.08 * (1 - q.Z), 0.04 * br);
    tor.scale.set(1 + 0.02 * br, 1 + 0.015 * br, 1);
    hd.rotation.set(-0.2 + 0.1 * q.A + 0.25 * q.H + (q.Z ? 0.6 : 0) + (q.st === 'idle' ? -0.4 * pulse(t, 7, 2, 1.6) : 0), sin(t * 0.7) * 0.2 * (1 - q.Z), 0);
    jaw.rotation.x = 0.45 * q.A + 0.3 * Math.max(s1, s2) + 0.3 * q.H + (q.st === 'idle' ? 0.5 * pulse(t, 7, 2, 1.6) : 0);
    arms.forEach(function(a, i){
      var s = i ? 1 : -1, sw = i ? s1 : s2;
      a.sh.rotation.set(-0.2 - 1.6 * q.A + 0.4 * sw + sin(t * 2.2 + i) * 0.06, -s * 0.9 * sw, s * (0.12 + 0.3 * q.A - 0.3 * sw + 0.3 * q.H));
      a.fa.rotation.set(-0.6 - 0.6 * q.A + 0.4 * sw + (q.Z ? 0.4 : 0), 0, 0);
    });
    legs.forEach(function(l, i){ l.rotation.x = (i ? 0.3 : -0.3) * (s1 + s2) + (q.Z ? -0.2 : 0); });
    tail.rotation.set(0, sin(t * 3) * 0.3, 0);
    var op = q.Z ? 0 : q.H > 0.3 ? 0.4 : blink(t, 4.2, 1.2);
    eyes.forEach(function(e){ e.set(op, 0, 0); });
    brows.forEach(function(w, i){ var s = i ? 1 : -1; w.rotation.z = PI / 2 + s * (0.5 + 0.2 * q.A); });
    if (moonD){ moonD.material.emissiveIntensity = 0.6 + 0.15 * sin(t * 0.8); }
  } };
};

/* =========================================================
   MAPINGUARI (matriarca-mugidora) - lendaria, 2.0
   gigante peludo ruivo-escuro de um olho so, bocarra na barriga, placas de casco nas costas.
   ataque: soco duplo no chao
   ========================================================= */
C['matriarca-mugidora'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var fur = K.corpo(K.mat(0x5E2616, { r: 0.85 })), dk = K.mat(0x3E160E, { r: 0.85 }), plate = K.mat(0x5E5A3E, { r: 0.55, m: 0.1 }), plateE = K.mat(0x3E3C28, { r: 0.6 });
  var claw = K.mat(0x2A2220, { r: 0.5 }), lip = K.mat(0x3A1210, { r: 0.6 }), tooth = K.mat(0xF6EEDC, { r: 0.4 });
  var maw = K.own(0x2A0808, { r: 0.7, e: 0xFF6A1A, ei: asc >= 3 ? 1.4 : 0.0 }), vine = K.glow(0x6AFF5A, 1.6), ring = K.own(0xFFE0B0, { op: 0, add: true, e: 0xFFB060, ei: 1 });
  var tor = K.grp(b, 0, 0.0, 0);
  K.m(tor, K.sph(3), fur, 0, 0.9, 0, 0.56, 0.62, 0.48);
  var mg = K.grp(tor, 0, 0.78, 0.43);
  K.m(mg, K.sph(2), lip, 0, 0, -0.04, 0.3, 0.17, 0.1);
  var mw = K.m(mg, K.sph(2), maw, 0, 0, 0.0, 0.26, 0.13, 0.08);
  var teeth = [];
  [-0.16, -0.08, 0, 0.08, 0.16].forEach(function(x, i){ teeth.push(K.m(mg, K.cone(4), tooth, x, 0.09, 0.05, 0.03, 0.08, 0.02)); teeth[teeth.length - 1].rotation.x = PI; });
  [-0.11, 0, 0.11].forEach(function(x){ teeth.push(K.m(mg, K.cone(4), tooth, x, -0.09, 0.05, 0.028, 0.07, 0.02)); });
  var hd = K.grp(tor, 0, 1.52, 0.04);
  K.m(hd, K.sph(3), fur, 0, 0, 0, 0.32, 0.27, 0.3);
  var brow = K.m(hd, K.cap(0.06, 0.26, 8), dk, 0, 0.13, 0.22); brow.rotation.z = PI / 2;
  var eye = K.eye(hd, { r: 0.15, x: 0, y: 0.0, z: 0.21, iris: 0xE8A21A, ie: 0x7A4000, iei: 0.4, ir: 0.68, pr: 0.42, lid: 0x6E2E1C, lv: 0.2 });
  K.m(hd, K.box(), lip, 0, -0.16, 0.24, 0.12, 0.02, 0.02);
  [[-0.2, 0.2, -0.05], [0.2, 0.2, -0.05], [0, 0.27, -0.1]].forEach(function(d){ var c = K.m(hd, K.cone(5), dk, d[0], d[1], d[2], 0.08, 0.2, 0.07); c.rotation.z = -d[0] * 2; });
  // placas de casco nas costas
  var vines = [];
  [[0, 1.15, -0.4, 0.17], [-0.24, 0.92, -0.38, 0.15], [0.24, 0.92, -0.38, 0.15], [0, 0.7, -0.44, 0.16]].forEach(function(d){
    var g = K.grp(tor, d[0], d[1], d[2]); g.rotation.set(-PI / 2 - 0.15, 0, 0); g.lookAt(d[0] * 3, d[1] * 0.9 + 0.2, d[2] * 4);
    K.m(g, K.cyl(d[3], d[3] * 1.08, 6), plate, 0, 0, 0, 1, 0.07, 1).rotation.x = PI / 2;
    K.m(g, K.cyl(d[3] * 1.12, d[3] * 1.12, 6), plateE, 0, 0, -0.025, 1, 0.03, 1).rotation.x = PI / 2;
    if (asc >= 3) vines.push(K.m(g, K.tor(d[3] * 0.6, 0.012, 3, 12, PI * 1.4), vine, 0, 0, 0.04));
  });
  var arms = [];
  [-1, 1].forEach(function(s){
    var sh = K.grp(tor, s * 0.5, 1.15, 0.02);
    K.m(sh, K.sph(2), fur, 0, 0, 0, 0.2);
    K.m(sh, K.cap(0.13, 0.3, 8), fur, s * 0.04, -0.25, 0.02);
    var fa = K.grp(sh, s * 0.04, -0.5, 0.02);
    K.m(fa, K.cap(0.12, 0.18, 8), dk, 0, -0.1, 0);
    K.m(fa, K.sph(2), dk, 0, -0.3, 0.04, 0.17, 0.15, 0.16);
    [-0.08, 0, 0.08].forEach(function(x){ var c = K.m(fa, K.cone(5), claw, x, -0.38, 0.14, 0.03, 0.12, 0.03); c.rotation.x = PI - 0.7; });
    arms.push({ sh: sh, fa: fa });
  });
  var legs = [];
  [-1, 1].forEach(function(s){
    var l = K.grp(b, s * 0.26, 0.38, 0);
    K.m(l, K.cap(0.15, 0.14, 8), dk, 0, -0.14, 0);
    K.m(l, K.sph(2), dk, 0, -0.33, 0.07, 0.17, 0.07, 0.22);
    legs.push(l);
  });
  var shock = K.m(b, K.tor(0.5, 0.05, 4, 28), ring, 0, 0.04, 0.6); shock.rotation.x = PI / 2;
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q, 0.1);
    var br = sin(t * (q.Z ? 1 : 1.6));
    tor.position.y = br * 0.015 - (q.Z ? 0.06 : 0) - 0.05 * q.S;
    tor.rotation.set(-0.1 * q.A + 0.3 * q.S + (q.Z ? 0.18 : 0), sin(t * 0.45) * 0.08 * (1 - q.Z), 0.03 * br);
    tor.scale.set(1 + 0.015 * br, 1 + 0.01 * br, 1);
    hd.rotation.set(-0.15 * q.A + 0.15 * q.S + 0.2 * q.H + (q.Z ? 0.4 : 0), sin(t * 0.6) * 0.2 * (1 - q.Z), 0);
    var roar = q.st === 'idle' ? pulse(t, 6.5, 2, 1.4) : 0;
    mg.scale.set(1 + 0.1 * roar + 0.15 * q.A, 1 + 0.6 * roar + 0.9 * q.A * (1 - q.S) + 0.3 * q.H, 1);
    maw.emissiveIntensity = (asc >= 3 ? 1.2 + 0.6 * sin(t * 2.4) : 0) + 1.5 * roar * (asc >= 3 ? 1 : 0.3);
    arms.forEach(function(a, i){
      var s = i ? 1 : -1;
      a.sh.rotation.set(-0.15 - 2.6 * q.A + 2.3 * q.S + sin(t * 1.6 + i) * 0.06, 0, s * (0.2 + 0.2 * q.H) - s * 0.25 * q.A);
      a.fa.rotation.set(-0.5 - 0.6 * q.A + 0.5 * q.S + (q.Z ? 0.3 : 0), 0, 0);
    });
    legs.forEach(function(l, i){ l.rotation.x = (q.st === 'entra' ? sin(q.p * 14 + i * PI) * 0.3 * (1 - q.p) : 0); });
    var sp = q.st === 'atk' ? cl((q.p - 0.42) / 0.45) : 0;
    shock.visible = sp > 0 && sp < 1; shock.scale.setScalar(0.4 + 2.2 * sp); ring.opacity = 0.75 * (1 - sp);
    var op = q.Z ? 0 : q.H > 0.3 ? 0.3 : blink(t, 5.2, 0.9);
    eye.lv = q.A > 0.3 ? 0 : 0.2; eye.set(op, sin(t * 0.6) * 0.5, 0);
    brow.rotation.set(0, 0, PI / 2); brow.position.y = 0.13 - 0.03 * q.A + 0.02 * q.H;
    vines.forEach(function(v, i){ v.rotation.z = t * 0.4 + i; });
  } };
};

/* =========================================================
   BRADADOR (jegue-carregador)
   espirito magro de capuz e pala comprida do Sul, boca-buraco que brilha, carta enrolada na mao.
   ataque: cone de grito
   ========================================================= */
C['jegue-carregador'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root), fl = K.grp(b, 0, 0.12, 0);
  var pala = K.corpo(K.mat(0x3A3A56, { r: 0.85, ds: true })), hoodM = K.mat(0x34303A, { r: 0.85, ds: true }), stripe = K.mat(0xC8B48A, { r: 0.8 }), red = K.mat(0x7A2A26, { r: 0.8 });
  var bone = K.mat(0xB8B4AA, { r: 0.7 }), paper = K.mat(0xE8DCC0, { r: 0.8 }), seal = K.mat(0xA8201E, { r: 0.4 }), hole = K.mat(0x06060A, { r: 0.9 });
  var mouthG = K.own(0xBFE8FF, { r: 0.3, e: 0x6FC8FF, ei: 2.2 }), cone = K.own(0x6FB8FF, { op: 0, add: true, e: 0x3A90FF, ei: 0.8, ds: true });
  var blue = K.own(0x6FB8FF, { op: 0.85, add: true, e: 0x2A7CFF, ei: 2.2 });
  K.m(fl, K.lathe('pala', [[0.46, 0.08], [0.44, 0.2], [0.36, 0.55], [0.26, 0.85], [0.15, 1.0], [0.0, 1.04]], 16), pala, 0, 0, 0, 1, 1, 0.82);
  K.m(fl, K.tor(0.43, 0.022, 4, 22), stripe, 0, 0.22, 0, 1, 0.83, 1).rotation.x = PI / 2;
  K.m(fl, K.tor(0.395, 0.018, 4, 22), red, 0, 0.36, 0, 1, 0.83, 1).rotation.x = PI / 2;
  var fringe = [];
  for (var i = 0; i < 8; i++){ var a = i / 8 * PI * 2, m = K.m(fl, K.cone(4), hoodM, sin(a) * 0.44, 0.03, cos(a) * 0.37, 0.05, 0.14, 0.03); m.rotation.x = PI; fringe.push(m); }
  var hd = K.grp(fl, 0, 1.12, 0.03);
  K.m(hd, K.sph(2), hoodM, 0, 0.03, -0.02, 0.22, 0.25, 0.22);
  K.m(hd, K.cone(8), hoodM, 0, 0.26, -0.1, 0.12, 0.2, 0.12).rotation.x = -0.6;
  K.m(hd, K.sph(2), hole, 0, -0.01, 0.1, 0.16, 0.18, 0.12);
  var eyes = [];
  [-1, 1].forEach(function(s){ eyes.push(K.geye(hd, { r: 0.04, x: s * 0.065, y: 0.04, z: 0.2, c: 0xDDF4FF, k: 2.2 })); });
  var mouth = K.m(hd, K.sph(1), mouthG, 0, -0.08, 0.205, 0.04, 0.05, 0.015);
  var hand = K.grp(fl, 0.14, 0.68, 0.32);
  K.m(hand, K.sph(1), bone, 0, 0, 0, 0.05);
  var let_ = K.m(hand, K.cyl(0.035, 0.035, 10), paper, 0.0, 0.02, 0.05, 1, 0.22, 1); let_.rotation.z = PI / 2 - 0.3;
  K.m(hand, K.sph(1), seal, 0.0, 0.0, 0.09, 0.025, 0.025, 0.012);
  var hand2 = K.m(fl, K.sph(1), bone, -0.3, 0.62, 0.18, 0.045);
  var sc = K.m(hd, K.cone(14, ), cone, 0, -0.08, 0.6, 0.3, 0.8, 0.3); sc.rotation.x = -PI / 2;
  var flames = [];
  if (asc >= 3){
    K.m(fl, K.tor(0.46, 0.02, 4, 24), blue, 0, 0.09, 0, 1, 0.82, 1).rotation.x = PI / 2;
    for (var j = 0; j < 4; j++){ var a2 = j / 4 * PI * 2 + 0.4; flames.push(K.m(fl, K.cone(6), blue, sin(a2) * 0.45, 0.16, cos(a2) * 0.37, 0.05, 0.16, 0.05)); }
  }
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q, 0.12);
    fl.position.set(0, 0.12 + (q.Z ? -0.08 : sin(t * 1.3) * 0.04), 0.15 * q.S);
    fl.rotation.set(-0.08 * q.A + 0.12 * q.S + (q.Z ? 0.12 : 0), sin(t * 0.5) * 0.15 * (1 - q.Z), sin(t * 0.9) * 0.04);
    hd.rotation.set(-0.35 * q.A + 0.3 * q.S + 0.2 * q.H + (q.Z ? 0.5 : 0), sin(t * 0.7) * 0.25 * (1 - q.Z), 0);
    hd.position.z = 0.03 + 0.12 * q.S;
    var yell = q.st === 'idle' ? pulse(t, 6, 3, 0.9) : 0;
    mouth.scale.set(0.04 + 0.04 * q.S + 0.02 * yell, 0.05 + 0.08 * q.S + 0.04 * yell + 0.03 * q.H, 0.015);
    mouthG.emissiveIntensity = q.Z ? 0.4 : 1.8 + 0.4 * sin(t * 4) + 2 * q.S;
    sc.visible = q.st === 'atk' && q.p > 0.33 && q.p < 0.95;
    var u = cl((q.p - 0.35) / 0.3); sc.scale.set(0.3 * (0.4 + u), 0.8 * (0.3 + u), 0.3 * (0.4 + u)); sc.position.z = 0.2 + 0.45 * u; cone.opacity = 0.28 * (1 - cl((q.p - 0.6) / 0.35));
    hand.position.set(0.14, 0.68 + 0.1 * q.A + (q.st === 'idle' ? 0.05 * sin(t * 1.1) : 0), 0.32);
    hand.rotation.set(0, 0, -0.5 * q.S);
    hand2.position.set(-0.3 - 0.06 * q.S, 0.62 + 0.25 * q.S, 0.18 + 0.12 * q.S);
    fringe.forEach(function(m, i){ m.rotation.set(PI + sin(t * 2.2 + i) * 0.3, 0, 0); });
    var op = q.Z ? 0 : q.H > 0.3 ? 0.4 : blink(t, 5.3, 0.4);
    eyes.forEach(function(e){ e.set(op); });
    flames.forEach(function(f, i){ f.scale.set(0.05, 0.16 * (1 + 0.35 * sin(t * 9 + i * 2)), 0.05); });
  } };
};

/* =========================================================
   CAPELOBO (porco-comilao)
   bipede peludo de focinho de tamandua, pes redondos de casco, lingua comprida; fica mais redondo quando "come"
   (obj.userData.comeu ou o.comeu = quantas vezes cresceu). ataque: estocada de focinho
   ========================================================= */
C['porco-comilao'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var fur = K.corpo(K.mat(0x4E4238, { r: 0.85 })), dk = K.mat(0x2E2620, { r: 0.85 }), lt = K.mat(0xD8D0C0, { r: 0.8 }), blk = K.mat(0x141210, { r: 0.8 });
  var hoof = K.mat(0x1E1A18, { r: 0.45 }), tng = K.mat(0xD86A8A, { r: 0.35 }), claw = K.mat(0xD8D0B8, { r: 0.45 });
  var glow = K.glow(0xFFB040, 1.8);
  root.userData.comeu = (o && o.comeu) | 0;
  var bd = K.grp(b, 0, 0, 0);
  var belly = K.m(bd, K.sph(3), fur, 0, 0.55, 0, 0.3, 0.32, 0.28);
  K.m(bd, K.sph(2), dk, 0, 0.62, -0.12, 0.27, 0.3, 0.2);
  // faixa de tamandua (preta com borda clara) no ombro
  [-1, 1].forEach(function(s){
    K.m(bd, K.sph(1), lt, s * 0.25, 0.7, 0.0, 0.07, 0.28, 0.25).rotation.set(0, 0, s * 0.7);
    K.m(bd, K.sph(1), blk, s * 0.27, 0.68, 0.0, 0.07, 0.25, 0.22).rotation.set(0, 0, s * 0.7);
  });
  var hd = K.grp(bd, 0, 0.95, 0.06);
  K.m(hd, K.sph(2), fur, 0, 0, 0, 0.2, 0.18, 0.2);
  var sn = K.grp(hd, 0, -0.04, 0.14); sn.rotation.x = 0.35;
  K.m(sn, K.cyl(0.035, 0.09, 10), fur, 0, 0, 0.2, 1, 0.4, 1).rotation.x = PI / 2;
  K.m(sn, K.sph(1), blk, 0, 0, 0.41, 0.04, 0.035, 0.03);
  var tg = K.grp(sn, 0, -0.01, 0.4);
  var tongue = K.m(tg, K.cap(0.012, 0.1, 5), tng, 0, 0, 0.05); tongue.rotation.x = PI / 2;
  var bands = [];
  if (asc >= 3){ [0.1, 0.2, 0.3].forEach(function(z, i){ bands.push(K.m(sn, K.tor(0.075 - i * 0.012, 0.01, 4, 14), glow, 0, 0, z)); }); }
  var eyes = [];
  [-1, 1].forEach(function(s){
    eyes.push(K.eye(hd, { r: 0.05, x: s * 0.1, y: 0.06, z: 0.14, ry: s * 0.45, iris: 0x2A1A10, ir: 0.72 }));
    var e = K.m(hd, K.sph(1), dk, s * 0.14, 0.15, -0.04, 0.05, 0.06, 0.03); e.rotation.z = s * 0.3;
  });
  // pelos desgrenhados
  [[-0.15, 1.08, -0.08], [0.15, 1.08, -0.08], [0, 1.12, -0.12], [-0.28, 0.75, -0.1], [0.28, 0.75, -0.1]].forEach(function(d){ var c = K.m(bd, K.cone(4), dk, d[0], d[1], d[2], 0.06, 0.16, 0.05); c.rotation.set(-0.5, 0, -d[0] * 2); });
  var arms = [];
  [-1, 1].forEach(function(s){
    var a = K.grp(bd, s * 0.28, 0.72, 0.05);
    K.m(a, K.cap(0.065, 0.16, 8), fur, 0, -0.12, 0);
    [-0.025, 0.025].forEach(function(x){ var c = K.m(a, K.cone(5), claw, x, -0.27, 0.04, 0.02, 0.1, 0.02); c.rotation.x = PI - 0.4; });
    arms.push(a);
  });
  var legs = [];
  [-1, 1].forEach(function(s){
    var l = K.grp(b, s * 0.14, 0.32, 0);
    K.m(l, K.cap(0.08, 0.14, 8), fur, 0, -0.12, 0);
    K.m(l, K.cyl(0.09, 0.1, 12), hoof, 0, -0.29, 0.02, 1, 0.07, 1);
    legs.push(l);
  });
  var tail = K.grp(bd, 0, 0.5, -0.26);
  K.m(tail, K.sph(2), dk, 0, 0.12, -0.12, 0.08, 0.26, 0.16).rotation.x = -0.5;
  return { obj: root, anim: function(st2, t, p){
    var q = Q(st2, t, p); t = q.t; base(b, q);
    var n = Math.min(4, Math.max(0, num(root.userData.comeu)));
    var fat = 1 + 0.1 * n;
    belly.scale.set(0.3 * fat, 0.32 * (1 + 0.06 * n), 0.28 * fat);
    var br = sin(t * (q.Z ? 1.3 : 2.6));
    bd.position.set(0, (q.Z ? -0.05 : 0) - 0.04 * q.A, 0.25 * q.S);
    bd.rotation.set(0.1 * q.A + 0.35 * q.S + (q.Z ? 0.2 : 0), sin(t * 0.8) * 0.12 * (1 - q.Z), 0.05 * br);
    hd.rotation.set(-0.35 * q.A + 0.3 * q.S + 0.2 * q.H + (q.Z ? 0.4 : 0) + (q.st === 'idle' ? 0.25 * pulse(t, 3.2, 0, 0.6) : 0), sin(t * 1.1) * 0.25 * (1 - q.Z), 0);
    sn.scale.set(1, 1, 1 + 0.25 * q.S);
    var lick = q.st === 'idle' ? pulse(t, 3.2, 0.2, 0.35) : 0, ext = Math.max(lick, q.S * 0.6);
    tongue.scale.set(1, 1 + 4 * ext, 1); tongue.position.z = 0.05 + 0.2 * ext; tg.visible = ext > 0.03;
    arms.forEach(function(a, i){ var s = i ? 1 : -1; a.rotation.set(-0.3 * q.A + 0.5 * q.S + sin(t * 2.6 + i * PI) * 0.1, 0, s * (0.2 + 0.08 * n + 0.4 * q.H)); });
    legs.forEach(function(l, i){ l.rotation.x = (i ? 0.25 : -0.25) * (q.S + (q.st === 'idle' ? sin(t * 2.6) * 0.3 : 0)); });
    tail.rotation.set(-0.5 * q.A, sin(t * 1.5) * 0.3, 0);
    var op = q.Z ? 0 : q.H > 0.3 ? 0.3 : blink(t, 3.6, 0.8);
    eyes.forEach(function(e){ e.set(op, 0, 0); });
    bands.forEach(function(m, i){ m.material.emissiveIntensity = 1.4 + 0.6 * sin(t * 3 - i); });
  } };
};

/* =========================================================
   ABOIADOR DA NOITE (vaqueiro-aboiador)
   vaqueiro sertanejo de couro escuro (gibao, perneiras, chapeu de couro com barbicacho), acabamento de luar.
   idle: maos em concha na boca (aboio). ataque: chicote de laco
   ========================================================= */
C['vaqueiro-aboiador'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var lea = K.corpo(K.mat(0x3A2212, { r: 0.55 })), lea2 = K.mat(0x26160A, { r: 0.6 }), lea3 = K.mat(0x5A3820, { r: 0.6, ds: true });
  var trim = asc >= 3 ? K.mat(0xE6EEFA, { r: 0.25, m: 0.8, e: 0xBFD4FF, ei: 1.0 }) : K.mat(0xA8B8D0, { r: 0.4, m: 0.4, e: 0x5A70A0, ei: 0.35 });
  var skin = K.mat(0xB27A52, { r: 0.6 }), shirt = K.mat(0xC8BCA0, { r: 0.8 }), rope = K.mat(0xC8A46A, { r: 0.8 }), hair = K.mat(0x1E140E, { r: 0.8 }), line = K.mat(0x2A140A);
  var boot = K.mat(0x22140A, { r: 0.5 });
  var tor = K.grp(b, 0, 0.62, 0);
  K.m(tor, K.cap(0.2, 0.18, 10), lea, 0, 0.18, 0, 1, 1, 0.82);
  K.m(tor, K.box(), shirt, 0, 0.24, 0.15, 0.1, 0.26, 0.02);
  [-1, 1].forEach(function(s){ var l = K.m(tor, K.box(), lea3, s * 0.08, 0.26, 0.165, 0.06, 0.28, 0.02); l.rotation.z = s * 0.2; });
  K.m(tor, K.tor(0.205, 0.018, 4, 18), trim, 0, -0.02, 0, 1, 0.82, 1).rotation.x = PI / 2;
  K.m(tor, K.cyl(0.21, 0.21, 14, true), lea2, 0, 0.02, 0, 1, 0.05, 0.84);
  var coil = K.m(tor, K.tor(0.09, 0.016, 4, 16), rope, 0.2, 0.0, 0.06); coil.rotation.y = PI / 2;
  var hd = K.grp(tor, 0, 0.56, 0.02);
  K.m(hd, K.sph(3), skin, 0, 0, 0, 0.21, 0.21, 0.2);
  K.m(hd, K.sph(1), hair, 0, 0.02, -0.08, 0.2, 0.17, 0.15);
  var eyes = [];
  [-1, 1].forEach(function(s){
    eyes.push(K.eye(hd, { r: 0.05, x: s * 0.08, y: 0.0, z: 0.17, ry: s * 0.28, iris: 0x3A2414, ir: 0.72, lid: 0xB27A52, lv: 0.25 }));
    var bw = K.m(hd, K.cap(0.016, 0.06, 5), hair, s * 0.08, 0.07, 0.185); bw.rotation.z = PI / 2 + s * 0.2;
    K.m(hd, K.sph(1), skin, s * 0.2, -0.01, 0, 0.04, 0.05, 0.03);
  });
  K.m(hd, K.sph(1), skin, 0, -0.04, 0.2, 0.03, 0.035, 0.03);
  var mouth = K.m(hd, K.sph(1), line, 0, -0.1, 0.18, 0.04, 0.01, 0.01);
  // chapeu de couro: copa, aba com a frente virada para cima, barbicacho
  var hat = K.grp(hd, 0, 0.14, -0.01); hat.rotation.x = -0.12;
  K.m(hat, K.sph(2), lea, 0, 0.04, 0, 0.19, 0.16, 0.19);
  K.m(hat, K.disc(20), lea3, 0, -0.01, 0, 0.31, 0.02, 0.31);
  var flap = K.m(hat, K.disc(16, -PI / 2, PI), lea3, 0, 0.02, 0.06, 0.28, 0.02, 0.17); flap.rotation.x = -1.3;
  K.m(hat, K.tor(0.31, 0.012, 3, 24), trim, 0, -0.01, 0).rotation.x = PI / 2;
  K.m(hd, K.tor(0.2, 0.008, 3, 16, PI), lea2, 0, -0.02, 0.02, 1, 1.05, 1).rotation.set(0, PI / 2, PI);
  var arms = [];
  [-1, 1].forEach(function(s){
    var sh = K.grp(tor, s * 0.23, 0.33, 0);
    K.m(sh, K.cap(0.06, 0.14, 8), lea, 0, -0.1, 0);
    var el = K.grp(sh, 0, -0.2, 0);
    K.m(el, K.cap(0.05, 0.12, 8), lea, 0, -0.08, 0);
    K.m(el, K.tor(0.055, 0.012, 3, 12), trim, 0, -0.15, 0).rotation.x = PI / 2;
    K.m(el, K.sph(1), skin, 0, -0.2, 0.01, 0.055);
    arms.push({ sh: sh, el: el });
  });
  var loop = K.grp(arms[1].el, 0, -0.22, 0.02);
  var lasso = K.m(loop, K.tor(0.2, 0.014, 4, 22), rope, 0, 0, 0); lasso.rotation.x = PI / 2;
  var legs = [];
  [-1, 1].forEach(function(s){
    var l = K.grp(b, s * 0.1, 0.52, 0);
    K.m(l, K.cap(0.075, 0.18, 8), lea3, 0, -0.14, 0);
    K.m(l, K.cap(0.065, 0.1, 8), lea2, 0, -0.34, 0.01);
    K.m(l, K.sph(1), boot, 0, -0.47, 0.05, 0.075, 0.05, 0.12);
    legs.push(l);
  });
  var ghost = [];
  if (asc >= 3){
    var gm = K.mat(0x8FB0FF, { op: 0.3, add: true, e: 0x5A80E0, ei: 0.9, ds: true });
    [-1, 1].forEach(function(s){ var h = K.m(b, K.tor(0.32, 0.035, 4, 16, PI * 0.75), gm, s * 0.3, 1.25, -0.35); h.rotation.set(0, 0, s > 0 ? -0.2 : PI + 0.2); ghost.push(h); });
  }
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q, 0.15);
    var call = q.st === 'idle' ? sm(pulse(t, 7, 3.5, 2.6) * 1.6) : 0;
    var br = sin(t * (q.Z ? 1.2 : 2));
    tor.position.y = 0.62 + br * 0.008 - (q.Z ? 0.04 : 0);
    tor.rotation.set(-0.05 * call + 0.1 * q.S + (q.Z ? 0.2 : 0), -0.35 * q.A + 0.4 * q.S + sin(t * 0.5) * 0.06, 0);
    hd.rotation.set(-0.25 * call + 0.15 * q.H + (q.Z ? 0.45 : 0), sin(t * 0.6) * 0.18 * (1 - call) * (1 - q.Z), 0);
    var L = arms[0], R = arms[1];
    L.sh.rotation.set(-1.7 * call + 0.1 * sin(t * 2), 0.0, -0.18 - 0.55 * call * -1 * 0 + 0.55 * call + 0.3 * q.H);
    L.el.rotation.set(-1.3 * call - 0.2, 0, 0);
    L.sh.rotation.z = -(0.18 - 0.6 * call) + 0.3 * q.H;
    var spin = q.st === 'atk' ? q.p : 0;
    R.sh.rotation.set(-1.7 * call - 2.8 * q.A + 2.4 * q.S + 0.1 * sin(t * 2 + 1), 0, 0.18 - 0.6 * call + 0.3 * q.A);
    R.el.rotation.set(-1.3 * call - 0.2 - 0.3 * q.A, 0, 0);
    loop.visible = q.st === 'atk' && q.p > 0.05 && q.p < 0.9;
    coil.visible = !loop.visible;
    loop.rotation.set(0, spin * 40, 0);
    var throwU = q.st === 'atk' ? cl((q.p - 0.38) / 0.2) * (1 - cl((q.p - 0.7) / 0.2)) : 0;
    loop.position.set(0, -0.22 - 0.5 * throwU, 0.02 + 0.6 * throwU);
    loop.scale.setScalar(1 + 0.6 * throwU);
    mouth.scale.set(0.04 - 0.015 * call, 0.01 + 0.03 * call + 0.02 * q.H, 0.01);
    legs.forEach(function(l, i){ l.rotation.x = (i ? 0.3 : -0.3) * q.S + (q.st === 'entra' ? sin(q.p * 18 + i * PI) * 0.4 * (1 - q.p) : 0); });
    var op = q.Z ? 0 : q.H > 0.3 ? 0.3 : blink(t, 4.3, 0.2);
    eyes.forEach(function(e){ e.lv = call > 0.5 ? 0.6 : 0.25; e.set(op, 0, 0); });
    ghost.forEach(function(h, i){ h.position.y = 1.25 + 0.05 * sin(t * 1.2 + i); });
  } };
};

/* =========================================================
   TAPERA ASSOMBRADA (cerca-de-pedra) - construcao
   casa de taipa abandonada: telhado de palha arriado, uma janela acesa, porta que range com o vento
   ========================================================= */
C['cerca-de-pedra'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), b = K.grp(root);
  var taipa = K.corpo(K.mat(0x6A4E36, { r: 0.92 })), taipa2 = K.mat(0x523C2A, { r: 0.92 }), wattle = K.mat(0x4A3622, { r: 0.85 });
  var thatch = K.mat(0x6A5E36, { r: 0.9, ds: true }), thatch2 = K.mat(0x4E4426, { r: 0.9 }), wood = K.mat(0x4E3420, { r: 0.8 }), stone = K.mat(0x6A665E, { r: 0.9 });
  var win = K.own(0xFFC060, { r: 0.5, e: 0xFF9A20, ei: 2.0 }), lan = K.own(0xBFE0FF, { r: 0.4, e: 0x7AB8FF, ei: 2.2 });
  var house = K.grp(b, 0, 0, 0);
  K.m(house, K.box(), taipa, 0, 0.36, 0, 0.9, 0.72, 0.66);
  K.m(house, K.box(), taipa2, 0, 0.04, 0, 0.94, 0.08, 0.7);
  [-1, 1].forEach(function(s){ K.m(house, K.ext('oitao', [[-0.45, 0], [0.45, 0], [0, 0.32]], 0.6), taipa, 0, 0.72, 0, 1, 1, 1).rotation.y = PI / 2; });
  // pau-a-pique aparecendo onde o barro caiu
  var pat = K.grp(house, 0.24, 0.5, 0.335);
  K.m(pat, K.sph(1), taipa2, 0, 0, -0.01, 0.12, 0.1, 0.01);
  [-0.05, 0.03].forEach(function(x){ K.m(pat, K.box(), wattle, x, 0, 0.0, 0.015, 0.16, 0.015); });
  K.m(pat, K.box(), wattle, 0, 0.02, 0.005, 0.18, 0.015, 0.015).rotation.z = 0.1;
  // janela acesa
  var wg = K.grp(house, -0.22, 0.44, 0.335);
  var wm = K.m(wg, K.box(), win, 0, 0, 0, 0.18, 0.18, 0.02); wm.userData.olho = true;
  K.m(wg, K.box(), wood, 0, 0, 0.012, 0.02, 0.2, 0.02);
  K.m(wg, K.box(), wood, 0, 0, 0.012, 0.2, 0.02, 0.02);
  var shut = K.grp(wg, 0.1, 0, 0.015);
  K.m(shut, K.box(), wood, 0.06, 0, 0, 0.11, 0.2, 0.02);
  // porta
  var door = K.grp(house, 0.04, 0.06, 0.335);
  K.m(door, K.box(), wood, 0.11, 0.25, 0.01, 0.22, 0.5, 0.03);
  K.m(door, K.box(), wattle, 0.11, 0.35, 0.03, 0.2, 0.025, 0.02);
  K.m(house, K.box(), K.mat(0x140C06, { r: 0.9 }), 0.15, 0.31, 0.33, 0.22, 0.5, 0.01);
  K.m(house, K.cyl(0.18, 0.2, 7), stone, 0.15, 0.03, 0.46, 1, 0.06, 0.6);
  // telhado de palha arriado
  var roof = K.grp(house, 0, 0.72, 0);
  var sl = [];
  [-1, 1].forEach(function(s){
    var g = K.grp(roof, 0, 0.32, 0); g.rotation.x = s * 0.82;
    K.m(g, K.box(), thatch, 0, 0, s * 0.27, 1.08, 0.07, 0.6);
    for (var k = 0; k < 4; k++){ var c = K.m(g, K.cone(4), thatch2, -0.42 + k * 0.28, -0.02, s * 0.57, 0.08, 0.14, 0.04); c.rotation.x = s * PI / 2; }
    sl.push(g);
  });
  K.m(roof, K.cyl(0.04, 0.04, 6), wood, 0, 0.34, 0, 1, 1.12, 1).rotation.z = PI / 2;
  var hole = K.m(roof, K.sph(1), K.mat(0x1A140C, { r: 0.9 }), 0.25, 0.2, 0.18, 0.12, 0.03, 0.1); hole.rotation.x = 0.82;
  var post = K.m(b, K.cyl(0.03, 0.035, 6), wood, -0.52, 0.32, 0.3, 1, 0.64, 1); post.rotation.z = 0.15;
  var lans = [];
  if (asc >= 3){ for (var i = 0; i < 3; i++){ var g = K.grp(b); K.m(g, K.sph(1), lan, 0, 0, 0, 0.05, 0.065, 0.05); K.m(g, K.cone(5), wood, 0, 0.07, 0, 0.04, 0.04, 0.04); lans.push(g); } }
  return { obj: root, anim: function(st, t, p){
    var q = Q(st, t, p); t = q.t; base(b, q, 0.08);
    house.rotation.set(-0.1 * q.A + 0.12 * q.S, 0, sin(t * 0.6) * 0.01 + (q.st === 'hit' ? sin(q.p * 30) * 0.03 * (1 - q.p) : 0));
    house.position.set(0, 0.05 * Math.sin(PI * q.S), 0.15 * q.S);
    var gust = sin(t * 0.9) * 0.5 + 0.5;
    door.rotation.y = q.Z ? 0.05 : -(0.25 + 0.35 * gust * gust) - 1.0 * q.A + 1.1 * q.S;
    shut.rotation.y = q.Z ? 0 : -(0.2 + 0.4 * gust) - 0.3 * q.S;
    var fl = sin(t * 13) * 0.3 + sin(t * 7.3) * 0.3 + (pulse(t, 2.3, 0.5, 0.15) > 0.3 ? -1.2 : 0);
    win.emissiveIntensity = q.Z ? 0.25 : Math.max(0.3, 1.8 + fl * 0.6 + 2.5 * q.S);
    sl.forEach(function(g, i){ g.rotation.x = (i ? 1 : -1) * 0.82 + sin(t * 1.3 + i) * 0.015; });
    lans.forEach(function(g, i){ var a = t * 0.8 + i * PI * 2 / 3; g.position.set(cos(a) * 0.62, 1.2 + 0.08 * sin(t * 1.7 + i), sin(a) * 0.5); });
    lan.emissiveIntensity = 1.8 + 0.5 * sin(t * 3);
  } };
};
})();
