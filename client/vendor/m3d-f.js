/* m3d-f.js (v10): modelos 3D chibi-heroicos de feiticos (emblemas). IIFE; unico global: window.CHAR3D.
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
/* Feiticos: emblemas que flutuam. anim: idle (flutua e brilha), atk (carrega 0-0.35, dispara 0.35-0.55, volta), entra (surge).
   hit e sono caem no idle. O ponto de luz principal de cada emblema leva userData.olho (o kit.ascAplicar acende ele). */
function fpose(g, q, y0){
  var e = Math.max(0.02, q.E), bob = sin(q.t * 1.6) * 0.04;
  g.scale.set(e, e, e);
  g.position.set(0, y0 + bob + 0.06 * q.A, -0.12 * q.A + 0.35 * q.S);
  g.rotation.set(-0.2 * q.A + 0.25 * q.S, (1 - q.e) * -3 + sin(q.t * 0.7) * 0.25, sin(q.t * 1.1) * 0.05);
}
function fq(st, t, p){ var q = Q(st, t, p); if (q.st === 'hit' || q.st === 'sono'){ q.st = 'idle'; q.H = 0; q.Z = 0; } return q; }

/* CHUVA DE BRASA (chuva-de-graos): pote de barro rachado tombando brasas, fumaca enrolando */
C['chuva-de-graos'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), g = K.grp(root);
  var clay = K.corpo(K.mat(0x9A4A26, { r: 0.75 })), clayD = K.mat(0x6A2E16, { r: 0.8 }), crack = K.own(0xFF7A1A, { r: 0.4, e: 0xFF5A00, ei: 1.6 });
  var ember = K.own(0xFF6A10, { r: 0.4, e: 0xFF3A00, ei: 1.4 }), smoke = K.own(0x8A8490, { r: 0.9, op: 0.45 }), trail = K.mat(0xFF8A2A, { op: 0.55, add: true, e: 0xFF5A00, ei: 1.5 });
  var pot = K.grp(g, 0, 0.32, 0); pot.rotation.set(0.9, 0, 0.25);
  K.m(pot, K.lathe('pote', [[0.0, -0.22], [0.16, -0.21], [0.25, -0.08], [0.26, 0.04], [0.2, 0.15], [0.13, 0.2], [0.15, 0.25], [0.12, 0.26]], 16), clay, 0, 0, 0);
  K.m(pot, K.tor(0.135, 0.025, 5, 16), clayD, 0, 0.25, 0).rotation.x = PI / 2;
  K.m(pot, K.tor(0.25, 0.012, 3, 20), clayD, 0, -0.02, 0).rotation.x = PI / 2;
  var mouthGlow = K.m(pot, K.disc(14), ember, 0, 0.23, 0, 0.1, 0.01, 0.1); mouthGlow.userData.olho = true;
  [[0.2, 0.0, 0.14, 0.5], [-0.18, 0.06, 0.16, -0.7], [0.05, -0.1, 0.25, 0.2]].forEach(function(d){ var c = K.m(pot, K.box(), crack, d[0], d[1], d[2], 0.012, 0.14, 0.012); c.rotation.set(0, Math.atan2(d[0], d[2]), d[3]); });
  var embers = [], trails = [];
  for (var i = 0; i < 7; i++){
    var m = K.m(g, K.ico(), ember, 0, 0, 0, 0.04 + (i % 3) * 0.012); embers.push(m);
    if (asc >= 3 && i < 4){ var tr = K.m(m, K.cone(6), trail, 0, 1.6, 0, 0.8, 3, 0.8); trails.push(tr); }
  }
  var smk = [];
  for (var j = 0; j < 3; j++) smk.push(K.m(g, K.sph(1), smoke, 0, 0, 0, 0.08));
  return { obj: root, anim: function(st, t, p){
    var q = fq(st, t, p); t = q.t; fpose(g, q, 0.22);
    pot.rotation.set(0.9 + 0.4 * q.A - 0.2 * q.S + sin(t * 1.3) * 0.05, 0, 0.25);
    var mx = 0.0, my = 0.55, mz = 0.25;
    embers.forEach(function(m, i){
      var u = fr(t * 0.55 + i / 7), sp = 1 + 1.5 * q.S;
      var x = mx + sin(i * 2.3) * 0.18 * u, z = mz + u * 0.45 * sp, y = my + 0.15 * u - 0.9 * u * u;
      m.position.set(x, Math.max(0.03, y), z);
      m.rotation.set(t * 3 + i, t * 2, 0);
    });
    trails.forEach(function(tr){ tr.rotation.x = -0.6; });
    ember.emissiveIntensity = 1.3 + 0.4 * sin(t * 6) + 1.0 * q.S;
    crack.emissiveIntensity = 1.2 + 0.6 * sin(t * 2.5) + 1.5 * q.A;
    smk.forEach(function(m, i){ var u = fr(t * 0.3 + i / 3); m.position.set(-0.1 + sin(t + i * 2) * 0.12, 0.55 + u * 0.7, 0.05 + u * 0.1); m.scale.setScalar(0.06 + u * 0.12); m.material.opacity = 0.45 * (1 - u); });
  } };
};

/* REDEMOINHO (vento-dourado): redemoinho de terra vermelha e folhas secas com um gorro vermelho voando no topo */
C['vento-dourado'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), g = K.grp(root);
  var dust = K.corpo(K.mat(0xA8502E, { r: 0.85, op: 0.82 })), dust2 = K.mat(0xC87A44, { r: 0.85, op: 0.6 }), cap = K.mat(0xC81E1E, { r: 0.55 }), capD = K.mat(0x8A1010, { r: 0.6 });
  var leafA = K.mat(0xB8782A, { r: 0.7, ds: true }), leafB = K.mat(0x7A5A22, { r: 0.7, ds: true }), ember = K.own(0xFFA040, { e: 0xFF5A00, ei: 2.2, r: 0.4 });
  var rings = [], N = 7;
  for (var i = 0; i < N; i++){
    var r = 0.05 + i * 0.055, m = K.m(g, K.tor(1, 0.18, 5, 18, PI * 1.6), i % 2 ? dust2 : dust, 0, 0.05 + i * 0.13, 0, r, r, r * 1.4);
    m.rotation.x = PI / 2; rings.push(m);
  }
  var capG = K.grp(g, 0, 1.08, 0);
  var cp = K.m(capG, K.cone(12), cap, 0, 0.1, 0, 0.13, 0.26, 0.13); cp.rotation.z = -0.35;
  K.m(capG, K.tor(0.13, 0.03, 5, 16), capD, 0, -0.02, 0).rotation.x = PI / 2;
  var tuft = K.m(capG, K.sph(1), cap, 0.1, 0.2, 0, 0.04); tuft.userData.olho = true;
  var LF = K.ext('folha', [[0, -0.06], [0.03, -0.02], [0.03, 0.03], [0, 0.07], [-0.03, 0.03], [-0.03, -0.02]], 0.006);
  var leaves = [];
  for (var j = 0; j < 7; j++) leaves.push(K.m(g, LF, j % 2 ? leafA : leafB, 0, 0, 0, 1.2, 1.2, 1));
  var trail = [];
  if (asc >= 3) for (var k = 0; k < 5; k++) trail.push(K.m(g, K.sph(1), ember, 0, 0, 0, 0.035));
  return { obj: root, anim: function(st, t, p){
    var q = fq(st, t, p); t = q.t; fpose(g, q, 0.05);
    var spin = t * 5 + 12 * q.S;
    rings.forEach(function(m, i){ m.rotation.set(PI / 2, 0, spin * (1 + i * 0.08) + i); m.position.x = sin(t * 2 + i * 0.6) * 0.04 * i; });
    capG.position.set(sin(t * 2) * 0.08, 1.08 + sin(t * 3) * 0.05 + 0.2 * q.S, 0);
    capG.rotation.set(0.2 * sin(t * 2.2), spin * 0.6, 0.3 * sin(t * 1.7));
    leaves.forEach(function(m, i){ var a = spin * 0.9 + i * 0.9, y = 0.15 + fr(t * 0.25 + i / 7) * 0.9, R = 0.12 + y * 0.35; m.position.set(cos(a) * R, y, sin(a) * R); m.rotation.set(a * 1.3, a, a * 0.7); });
    trail.forEach(function(m, i){ var a = spin * 0.9 - i * 0.35, y = 1.0 - i * 0.12, R = 0.12 + y * 0.35; m.position.set(cos(a) * R, y, sin(a) * R); m.scale.setScalar(0.035 * (1 - i * 0.15)); });
    ember.emissiveIntensity = 2 + sin(t * 7);
  } };
};

/* PIMENTA BRABA (pamonha-quentinha): malagueta vermelha gorda de olhos bravos, ponta fumegando */
C['pamonha-quentinha'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), g = K.grp(root);
  var red = K.corpo(K.mat(0xD01818, { r: 0.22, m: 0.05 })), redD = K.mat(0x9A0E0E, { r: 0.25 }), stem = K.mat(0x3E7A22, { r: 0.6 }), line = K.mat(0x2A0606);
  var smoke = K.own(0x9A929A, { r: 0.9, op: 0.45 }), fire = K.own(0xFFB040, { op: 0.85, add: true, e: 0xFF6A00, ei: 2.2 });
  var body = K.grp(g, 0, 0.5, 0); body.rotation.z = -0.25;
  K.m(body, K.lathe('pimenta', [[0.0, -0.44], [0.035, -0.38], [0.08, -0.24], [0.13, -0.06], [0.165, 0.12], [0.175, 0.28], [0.15, 0.4], [0.08, 0.46], [0.0, 0.47]], 16), red, 0, 0, 0);
  var tip = K.grp(body, 0, -0.42, 0);
  K.m(tip, K.cone(10), redD, 0, -0.04, 0, 0.05, 0.12, 0.05).rotation.z = PI;
  var cap = K.grp(body, 0, 0.45, 0);
  K.m(cap, K.sph(1), stem, 0, 0, 0, 0.15, 0.05, 0.15);
  K.m(cap, K.cyl(0.025, 0.035, 8), stem, 0.03, 0.09, 0, 1, 0.18, 1).rotation.z = -0.4;
  var eyes = [], brows = [];
  [-1, 1].forEach(function(s){
    eyes.push(K.eye(body, { r: 0.06, x: s * 0.075, y: 0.2, z: 0.14, ry: s * 0.3, iris: 0x3A1206, ir: 0.66 }));
    var bw = K.m(body, K.cap(0.016, 0.08, 5), line, s * 0.075, 0.29, 0.16); bw.rotation.z = PI / 2 + s * 0.55; brows.push(bw);
  });
  var mouth = K.m(body, K.tor(0.05, 0.012, 4, 10, PI), line, 0, 0.07, 0.16);
  var smk = [];
  for (var j = 0; j < 3; j++) smk.push(K.m(g, K.sph(1), smoke, 0, 0, 0, 0.06));
  var flame = null;
  if (asc >= 3){ flame = K.m(tip, K.cone(8), fire, 0, -0.14, 0, 0.06, 0.18, 0.06); flame.rotation.z = PI; K.m(tip, K.sph(1), K.glow(0xFFD060, 2.5), 0, -0.08, 0, 0.04); }
  return { obj: root, anim: function(st, t, p){
    var q = fq(st, t, p); t = q.t; fpose(g, q, 0.05);
    body.rotation.set(0, 0, -0.25 + sin(t * 2.4) * 0.08 + 0.4 * q.A - 0.6 * q.S);
    body.scale.set(1 + 0.05 * sin(t * 4) + 0.15 * q.A, 1 - 0.04 * sin(t * 4) - 0.1 * q.A, 1 + 0.05 * sin(t * 4));
    var op = blink(t, 3.2, 0.4);
    eyes.forEach(function(e){ e.set(op, 0, 0); });
    brows.forEach(function(w, i){ var s = i ? 1 : -1; w.rotation.z = PI / 2 + s * (0.55 + 0.2 * q.A + 0.08 * sin(t * 5)); });
    mouth.scale.set(1, 1 + 0.5 * q.S, 1);
    smk.forEach(function(m, i){ var u = fr(t * 0.45 + i / 3); m.position.set(-0.12 + sin(t * 2 + i) * 0.05, 0.02 + u * 0.3, 0.02); m.scale.setScalar(0.04 + 0.08 * u); m.material.opacity = 0.5 * (1 - u); });
    if (flame) flame.scale.set(0.06, 0.18 * (1 + 0.3 * sin(t * 10) + 0.8 * q.S), 0.06);
  } };
};

/* ORVALHO DA MATA (orvalho-da-manha): gota gigante de orvalho sobre folha de costela-de-adao, refratando luz */
C['orvalho-da-manha'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), g = K.grp(root);
  var leaf = K.corpo(K.mat(0x1E6A34, { r: 0.45, ds: true })), vein = K.mat(0x5A9A4A, { r: 0.6 }), stemM = K.mat(0x2E7A3A, { r: 0.6 });
  var drop = K.own(0x9FE6FF, { r: 0.04, m: 0.1, op: 0.55, e: 0x2A8AC0, ei: 0.35 }), shine = K.glow(0xFFFFFF, 2.2), sp = K.own(0xE6FFFF, { e: 0xBFF0FF, ei: 2.2, r: 0.3 });
  var lf = K.grp(g, 0, 0.3, 0); lf.rotation.x = -1.25;
  var MON = [[0, -0.4], [0.18, -0.34], [0.3, -0.2], [0.2, -0.16], [0.36, -0.06], [0.38, 0.06], [0.24, 0.04], [0.34, 0.18], [0.26, 0.3], [0.1, 0.38], [0, 0.32],
    [-0.1, 0.38], [-0.26, 0.3], [-0.34, 0.18], [-0.24, 0.04], [-0.38, 0.06], [-0.36, -0.06], [-0.2, -0.16], [-0.3, -0.2], [-0.18, -0.34]];
  K.m(lf, K.ext('monstera', MON, 0.02), leaf, 0, 0, 0, 1.2, 1.2, 1);
  K.m(lf, K.box(), vein, 0, 0.0, 0.015, 0.02, 0.85, 0.01);
  [-1, 1].forEach(function(s){ [0.12, -0.12].forEach(function(y){ var v = K.m(lf, K.box(), vein, s * 0.14, y, 0.014, 0.012, 0.3, 0.008); v.rotation.z = -s * 1.1; }); });
  var st2 = K.m(g, K.cyl(0.02, 0.025, 6), stemM, 0, 0.12, -0.38, 1, 0.3, 1); st2.rotation.x = 0.6;
  var dg = K.grp(g, 0, 0.5, 0.0);
  var dm = K.m(dg, K.sph(3), drop, 0, 0, 0, 0.22, 0.2, 0.22);
  K.m(dg, K.cone(16), drop, 0, 0.24, 0, 0.12, 0.16, 0.12);
  var hi = K.m(dg, K.sph(1), shine, 0.08, 0.1, 0.15, 0.04, 0.05, 0.02); hi.userData.olho = true;
  K.m(dg, K.sph(0), shine, -0.07, -0.08, 0.17, 0.02);
  var sparks = [];
  for (var i = 0; i < 4; i++) sparks.push(K.m(g, K.oct(), sp, 0, 0, 0, 0.025, 0.05, 0.025));
  var moon = null;
  if (asc >= 3){ moon = K.m(dg, K.tor(0.07, 0.022, 5, 14, PI * 1.2), K.glow(0xEEF4FF, 2.2), 0, 0.0, 0.0); moon.rotation.z = 0.8; }
  return { obj: root, anim: function(st, t, p){
    var q = fq(st, t, p); t = q.t; fpose(g, q, 0.15);
    lf.rotation.set(-1.25 + sin(t * 1.2) * 0.05 + 0.3 * q.A - 0.3 * q.S, 0, sin(t * 0.8) * 0.06);
    var wob = sin(t * 3) * 0.03;
    dg.position.set(0, 0.5 + 0.05 * sin(t * 1.6) + 0.15 * q.A, 0.5 * q.S);
    dg.scale.set(1 + wob + 0.1 * q.A, 1 - wob + 0.1 * q.A, 1 + wob);
    drop.emissiveIntensity = 0.35 + 0.15 * sin(t * 2) + 1.2 * q.S;
    sparks.forEach(function(m, i){ var a = t * 1.5 + i * PI / 2, k = pulse(t, 1.6, i * 0.4, 0.5); m.position.set(cos(a) * 0.36, 0.55 + sin(t * 2 + i) * 0.15, sin(a) * 0.36); m.scale.set(0.025 * k + 0.001, 0.05 * k + 0.001, 0.025 * k + 0.001); m.rotation.y = t * 3; });
    if (moon) moon.rotation.y = t * 0.8;
  } };
};

/* CIPO-MATAPAU (cipo-enrolado): mata-pau estrangulando um tronco, casca rachando */
C['cipo-enrolado'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), g = K.grp(root);
  var bark = K.mat(0x5E4632, { r: 0.9, fs: true }), barkD = K.mat(0x3A2A1C, { r: 0.9 }), crackM = K.own(0x1A0E06, { r: 0.9, e: 0xFF8A2A, ei: 0 });
  var vine = asc >= 3 ? K.corpo(K.own(0x5A7A2A, { r: 0.5, e: 0x3AFF4A, ei: 0.8 })) : K.corpo(K.own(0x5A6A2A, { r: 0.6 }));
  var leaf = K.mat(0x3E8A2E, { r: 0.6, ds: true }), glow = K.glow(0x8AFF6A, 2.2);
  var trunk = K.grp(g, 0, 0, 0);
  K.m(trunk, K.cyl(0.2, 0.26, 9), bark, 0, 0.45, 0, 1, 0.9, 1);
  K.m(trunk, K.cyl(0.2, 0.2, 9), barkD, 0, 0.91, 0, 1, 0.03, 1);
  [[-0.05, 0.25], [0.12, -0.2], [-0.2, 0.0]].forEach(function(d){ K.m(trunk, K.cone(5), bark, d[0], 0.95, d[1], 0.05, 0.12, 0.05); });
  var cracks = [];
  [[0.6, 0.6, 0.3], [2.2, 0.35, -0.4], [4.0, 0.7, 0.2]].forEach(function(d){ var c = K.m(trunk, K.box(), crackM, sin(d[0]) * 0.235, d[1], cos(d[0]) * 0.235, 0.015, 0.22, 0.015); c.rotation.set(0, d[0], d[2]); cracks.push(c); });
  var coils = [];
  for (var i = 0; i < 5; i++){
    var c = K.m(g, K.tor(0.27, 0.045, 6, 20), vine, 0, 0.15 + i * 0.17, 0); c.rotation.set(PI / 2 + 0.3 * (i % 2 ? 1 : -1), 0.2 * i, 0); coils.push(c);
  }
  var vertical = K.m(g, K.cap(0.04, 0.8, 6), vine, 0.22, 0.48, 0.12);
  var heads = [];
  [[0.2, 1.05, 0.1, -0.5], [-0.18, 0.98, -0.06, 0.6]].forEach(function(d){ var h = K.grp(g, d[0], d[1], d[2]); h.rotation.z = d[3]; K.m(h, K.cap(0.035, 0.18, 6), vine, 0, 0.08, 0); K.m(h, K.sph(1), leaf, 0.06, 0.18, 0, 0.09, 0.04, 0.06).rotation.z = 0.5; heads.push(h); });
  var core = K.m(g, K.sph(0), glow, 0.22, 1.14, 0.1, 0.03); core.userData.olho = true; core.visible = asc >= 3;
  var extra = [];
  if (asc >= 3){ for (var k = 0; k < 3; k++) extra.push(K.m(g, K.oct(), glow, 0, 0, 0, 0.03, 0.05, 0.03)); }
  return { obj: root, anim: function(st, t, p){
    var q = fq(st, t, p); t = q.t; fpose(g, q, 0.0);
    var sq = 0.5 + 0.5 * sin(t * 1.6), squeeze = 0.06 * sq + 0.2 * q.S + 0.08 * q.A;
    coils.forEach(function(c, i){ var s = 1 - squeeze * (0.7 + 0.3 * sin(i)); c.scale.set(s, s, 1 + 0.4 * squeeze); });
    trunk.scale.set(1 - 0.08 * q.S, 1 + 0.03 * q.S, 1 - 0.08 * q.S);
    crackM.emissiveIntensity = 0.3 * sq + 2.2 * q.S;
    cracks.forEach(function(c, i){ c.scale.set(0.015, 0.22 * (1 + 0.6 * q.S + 0.2 * sq), 0.015); });
    heads.forEach(function(h, i){ h.rotation.z = (i ? 0.6 : -0.5) + sin(t * 1.5 + i * 2) * 0.15 - (i ? -1 : 1) * 0.4 * q.S; });
    if (asc >= 3) vine.emissiveIntensity = 0.6 + 0.5 * sin(t * 2) + q.S;
    extra.forEach(function(m, i){ var a = t * 1.2 + i * 2.1; m.position.set(cos(a) * 0.36, 0.3 + fr(t * 0.3 + i / 3) * 0.8, sin(a) * 0.36); m.rotation.y = t * 3; });
  } };
};

/* GARRAFADA (adubo-magico): garrafa de vidro com rolha, cheia de raizes e folhas, liquido verde que brilha, etiqueta de barbante */
C['adubo-magico'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), g = K.grp(root);
  var glass = K.mat(0xCFEFE6, { r: 0.05, m: 0.1, op: 0.32, ds: true }), liq = K.corpo(K.own(0x4ADA5A, { r: 0.2, op: 0.82, e: 0x1AB83A, ei: 1.1 }));
  var cork = K.mat(0xB08A5A, { r: 0.85 }), root2 = K.mat(0x7A5434, { r: 0.8 }), leaf = K.mat(0x2E7A2A, { r: 0.6, ds: true }), twine = K.mat(0xC8B080, { r: 0.9 }), tag = K.mat(0xE8D8B0, { r: 0.85 });
  var gold = K.own(0xFFD25A, { op: 0.8, add: true, e: 0xFFB020, ei: 2 });
  var bt = K.grp(g, 0, 0, 0);
  var BP = [[0.0, 0.0], [0.2, 0.0], [0.24, 0.05], [0.25, 0.4], [0.2, 0.5], [0.08, 0.6], [0.075, 0.78], [0.09, 0.8], [0.0, 0.8]];
  K.m(bt, K.lathe('garrafa', BP, 18), glass, 0, 0, 0);
  K.m(bt, K.lathe('liq', [[0.0, 0.02], [0.18, 0.02], [0.22, 0.06], [0.225, 0.38], [0.0, 0.4]], 16), liq, 0, 0, 0).userData.olho = true;
  K.m(bt, K.cyl(0.07, 0.06, 10), cork, 0, 0.84, 0, 1, 0.14, 1);
  var rr = [];
  [[0.06, 0.2, 0.3], [-0.08, 0.22, -0.4], [0.0, 0.3, 0.1]].forEach(function(d){ var r = K.m(bt, K.cap(0.015, 0.3, 4), root2, d[0], d[1], 0.02, 1, 1, 1); r.rotation.z = d[2]; rr.push(r); });
  [[0.08, 0.34, 0.6], [-0.1, 0.28, -0.8], [0.02, 0.44, 0.1]].forEach(function(d){ var l = K.m(bt, K.sph(1), leaf, d[0], d[1], -0.03, 0.06, 0.02, 0.1); l.rotation.set(0.5, d[2], 0.4); rr.push(l); });
  K.m(bt, K.tor(0.08, 0.008, 3, 12), twine, 0, 0.72, 0).rotation.x = PI / 2;
  var tg = K.grp(bt, 0.08, 0.72, 0.03);
  K.m(tg, K.box(), twine, 0, -0.06, 0, 0.006, 0.12, 0.006);
  K.m(tg, K.box(), tag, 0.0, -0.14, 0.0, 0.08, 0.06, 0.008);
  var sw = null, gl = [];
  if (asc >= 3){ sw = K.m(bt, K.tor(0.14, 0.012, 3, 24, PI * 1.6), gold, 0, 0.2, 0); sw.rotation.x = PI / 2 - 0.3; for (var i = 0; i < 3; i++) gl.push(K.m(bt, K.sph(0), gold, 0, 0, 0, 0.018)); }
  return { obj: root, anim: function(st, t, p){
    var q = fq(st, t, p); t = q.t; fpose(g, q, 0.04);
    bt.rotation.set(0, 0, sin(t * 1.4) * 0.08 + 0.35 * q.A * sin(q.p * 40) * 0.3 - 0.5 * q.S);
    liq.emissiveIntensity = 1.0 + 0.4 * sin(t * 2.2) + 1.6 * q.S;
    tg.rotation.set(0, 0, sin(t * 2) * 0.25);
    rr.forEach(function(r, i){ r.position.y += 0; r.rotation.y = sin(t * 0.8 + i) * 0.4; });
    if (sw){ sw.rotation.z = t * 2; sw.position.y = 0.2 + 0.05 * sin(t * 1.3); }
    gl.forEach(function(m, i){ var a = t * 2.5 + i * 2.1; m.position.set(cos(a) * 0.15, 0.06 + fr(t * 0.4 + i / 3) * 0.3, sin(a) * 0.15); });
  } };
};

/* LODO DO IGAPO (lodo-pegajoso): bolha de lama preto-esverdeada com dois olhos e bolhas subindo */
C['lodo-pegajoso'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), g = K.grp(root);
  var mud = K.corpo(K.mat(0x1E2A1A, { r: 0.25, m: 0.1 })), mud2 = K.mat(0x2E3E22, { r: 0.3 }), line = K.mat(0x0A0A06);
  var bub = asc >= 3 ? K.own(0xC08AFF, { r: 0.1, op: 0.75, e: 0x8A3AFF, ei: 1.6 }) : K.own(0x7A9A6A, { r: 0.08, op: 0.6 });
  var bd = K.grp(g, 0, 0, 0);
  var main = K.m(bd, K.sph(3), mud, 0, 0.32, 0, 0.36, 0.3, 0.34);
  K.m(bd, K.sph(2), mud2, 0.22, 0.12, 0.12, 0.2, 0.12, 0.2);
  K.m(bd, K.sph(2), mud2, -0.26, 0.1, 0.0, 0.22, 0.1, 0.22);
  K.m(bd, K.sph(2), mud, 0.05, 0.62, -0.05, 0.16, 0.14, 0.15);
  var drips = [];
  [[0.28, 0.25, 0.18], [-0.2, 0.28, 0.24], [0.0, 0.2, 0.32]].forEach(function(d){ drips.push(K.m(bd, K.sph(1), mud, d[0], d[1], d[2], 0.05, 0.1, 0.05)); });
  var eyes = [];
  [-1, 1].forEach(function(s){ eyes.push(K.eye(bd, { r: 0.085, x: s * 0.11, y: 0.44, z: 0.27, ry: s * 0.25, iris: 0xC8B020, ie: 0x6A5A00, iei: 0.5, pr: 0.42, lid: 0x1E2A1A, lv: 0.3 })); });
  var mouth = K.m(bd, K.tor(0.08, 0.014, 4, 12, PI), line, 0, 0.3, 0.33); mouth.rotation.z = PI;
  var bubs = [];
  for (var i = 0; i < 5; i++) bubs.push(K.m(g, K.sph(1), bub, 0, 0, 0, 0.04 + (i % 3) * 0.015));
  var pops = [];
  if (asc >= 3) for (var j = 0; j < 2; j++) pops.push(K.m(g, K.tor(0.05, 0.008, 3, 12), bub, 0, 0, 0));
  return { obj: root, anim: function(st, t, p){
    var q = fq(st, t, p); t = q.t; fpose(g, q, 0.0);
    var w = sin(t * 2.2);
    bd.scale.set(1 + 0.05 * w + 0.15 * q.A - 0.1 * q.S, 1 - 0.05 * w - 0.15 * q.A + 0.2 * q.S, 1 + 0.05 * w + 0.1 * q.S);
    main.position.y = 0.32 + 0.02 * sin(t * 2.2 + 1);
    drips.forEach(function(d, i){ var u = fr(t * 0.4 + i / 3); d.scale.set(0.05, 0.1 + 0.08 * u, 0.05); d.position.y = [0.25, 0.28, 0.2][i] - 0.12 * u; });
    eyes.forEach(function(e){ e.lv = q.A > 0.3 ? 0.05 : 0.3; e.set(blink(t, 3.8, 0.5), sin(t * 0.7) * 0.4, 0); });
    mouth.scale.set(1 + 0.3 * q.S, 1 + 0.8 * q.S, 1);
    bubs.forEach(function(m, i){ var u = fr(t * 0.35 + i / 5); m.position.set(sin(i * 2.4) * 0.25, 0.35 + u * 0.75, cos(i * 2.4) * 0.15); m.visible = u < 0.92; m.scale.setScalar((0.04 + (i % 3) * 0.015) * (0.6 + u)); });
    pops.forEach(function(m, i){ var u = fr(t * 0.35 + i / 2 + 0.1); m.position.set(sin(i * 3) * 0.2, 1.05, 0); m.scale.setScalar(0.5 + 2 * u); m.rotation.x = PI / 2; });
  } };
};

/* BANZEIRO (atoleiro): onda escura do rio se enrolando e engolindo um remo de canoa */
C['atoleiro'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), g = K.grp(root);
  var wat = K.corpo(K.mat(0x1A4A5A, { r: 0.12, m: 0.15 })), wat2 = K.mat(0x2A6A7A, { r: 0.12, m: 0.1 }), foam = K.mat(0xE6F4F4, { r: 0.6 });
  var wood = K.mat(0x8A5A30, { r: 0.75 }), woodD = K.mat(0x5E3C20, { r: 0.8 }), light = K.own(0xEFFFFF, { r: 0.3, e: 0xBFF4FF, ei: 2.2 });
  K.m(g, K.hemi(2), wat, 0, 0.0, 0, 0.5, 0.16, 0.38);
  var wave = K.grp(g, 0, 0.16, -0.05);
  var w1 = K.m(wave, K.tor(0.33, 0.13, 8, 24, PI * 1.35), wat, 0, 0.3, 0, 1.3, 1, 1); w1.rotation.set(0, PI / 2, -0.3);
  var w2 = K.m(wave, K.tor(0.33, 0.09, 6, 20, PI * 1.2), wat2, 0.18, 0.28, 0.0, 1.1, 0.95, 1); w2.rotation.set(0, PI / 2, -0.15);
  var lip = K.m(wave, K.tor(0.33, 0.05, 5, 18, PI * 0.5), foam, 0, 0.3, 0, 1.3, 1, 1.45); lip.rotation.set(0, PI / 2, PI * 0.75);
  lip.userData.olho = true;
  var fd = [];
  [[0.25, 0.08, 0.3], [-0.3, 0.08, 0.25], [0.0, 0.1, 0.38]].forEach(function(d){ fd.push(K.m(g, K.sph(1), foam, d[0], d[1], d[2], 0.07, 0.04, 0.07)); });
  var pad = K.grp(g, 0.1, 0.42, 0.15); pad.rotation.set(0.6, 0.3, -0.7);
  K.m(pad, K.cyl(0.022, 0.022, 6), wood, 0, 0.0, 0, 1, 0.6, 1);
  K.m(pad, K.sph(2), woodD, 0, -0.4, 0, 0.12, 0.22, 0.025);
  var crown = [];
  if (asc >= 3){ for (var i = 0; i < 5; i++) crown.push(K.m(wave, K.sph(1), light, 0, 0, 0, 0.04)); crown.push(K.m(wave, K.tor(0.33, 0.015, 3, 18, PI * 0.6), light, 0, 0.3, 0, 1.3, 1, 1.5)); crown[5].rotation.set(0, PI / 2, PI * 0.7); }
  return { obj: root, anim: function(st, t, p){
    var q = fq(st, t, p); t = q.t; fpose(g, q, 0.0);
    var sw = sin(t * 1.5);
    wave.rotation.set(0.12 * sw - 0.3 * q.A + 0.7 * q.S, 0, 0);
    wave.scale.set(1, 1 + 0.06 * sw + 0.15 * q.A, 1);
    w1.rotation.z = -0.3 + 0.08 * sw; w2.rotation.z = -0.15 + 0.1 * sin(t * 1.5 + 1);
    lip.rotation.z = PI * 0.75 + 0.1 * sw;
    pad.position.set(0.1, 0.42 + 0.04 * sin(t * 1.1) - 0.25 * q.S, 0.15 - 0.1 * q.S);
    pad.rotation.set(0.6 + 0.1 * sin(t * 1.3) - 0.4 * q.S, 0.3, -0.7 + 0.1 * sw);
    fd.forEach(function(m, i){ m.scale.set(0.07 + 0.02 * sin(t * 2 + i), 0.04, 0.07 + 0.02 * sin(t * 2 + i)); });
    crown.forEach(function(m, i){ if (i < 5){ var a = PI * 0.55 + i * 0.25 + 0.1 * sw; m.position.set(0, 0.3 + sin(a) * 0.33 * 1.0, cos(a) * 0.33 * 1.3 * -1); m.scale.setScalar(0.035 + 0.015 * sin(t * 5 + i)); } });
    if (crown.length) light.emissiveIntensity = 2 + 0.5 * sin(t * 3);
  } };
};

/* SERENO DA MEIA-NOITE (feno-fresquinho): lua crescente pingando gotas de orvalho prateado */
C['feno-fresquinho'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), g = K.grp(root);
  var moonM = K.corpo(K.own(0xE6ECFA, { r: 0.35, m: 0.3, e: 0x9AB0E0, ei: 0.8 })), dropM = K.own(0xDDEBFF, { r: 0.05, m: 0.6, e: 0x9AB8F0, ei: 0.9 }), star = K.own(0xFFFFFF, { e: 0xDDE8FF, ei: 2.4, r: 0.3 });
  var mg = K.grp(g, 0, 0.75, 0);
  var cres = K.m(mg, K.tor(0.3, 0.1, 10, 28, PI * 1.25), moonM, 0, 0, 0); cres.rotation.z = PI * 0.375;
  [0.375, 1.625].forEach(function(f){ var tp = K.m(mg, K.sph(1), moonM, 0, 0, 0, 0.06); tp.position.set(cos(f * PI) * 0.3, sin(f * PI) * 0.3, 0); });
  var eyeG = K.grp(mg, -0.26, 0.04, 0.1);
  var cl1 = K.m(eyeG, K.tor(0.035, 0.008, 3, 10, PI), K.mat(0x3A4A7A), 0, 0, 0); cl1.rotation.z = PI; cl1.userData.olho = true;
  var drops = [];
  for (var i = 0; i < 4; i++){
    var d = K.grp(g);
    K.m(d, K.sph(1), dropM, 0, 0, 0, 0.04, 0.045, 0.04);
    K.m(d, K.cone(8), dropM, 0, 0.05, 0, 0.034, 0.07, 0.034);
    drops.push(d);
  }
  var stars = [];
  if (asc >= 3) for (var j = 0; j < 4; j++) stars.push(K.m(g, K.oct(), star, 0, 0, 0, 0.025, 0.05, 0.025));
  return { obj: root, anim: function(st, t, p){
    var q = fq(st, t, p); t = q.t; fpose(g, q, 0.0);
    mg.rotation.set(0, 0, sin(t * 0.9) * 0.12 - 0.3 * q.A + 0.4 * q.S);
    mg.position.y = 0.75 + 0.03 * sin(t * 1.3);
    moonM.emissiveIntensity = 0.7 + 0.2 * sin(t * 1.5) + 1.5 * q.S;
    eyeG.rotation.z = 0.2 + sin(t * 0.9) * 0.05;
    var bx = 0.115, by = 0.44;
    drops.forEach(function(d, i){ var u = fr(t * 0.55 + i / 4), sp = 1 + 2 * q.S; d.position.set(bx + sin(i * 2) * 0.05, Math.max(0.03, by + 0.05 - u * u * 0.5 * sp), 0.02 + 0.3 * q.S * u); var k = u < 0.1 ? u / 0.1 : 1; d.scale.set(k, k * (1 + 0.4 * u), k); });
    stars.forEach(function(m, i){ var u = fr(t * 0.55 + i / 4 + 0.08); m.position.set(bx + sin(i * 2) * 0.05 + 0.04, Math.max(0.05, by - u * u * 0.4 + 0.08), 0.02); var k = pulse(t, 0.6, i * 0.15, 0.3); m.scale.set(0.025 * k + 0.001, 0.05 * k + 0.001, 0.025 * k + 0.001); m.rotation.y = t * 4; });
  } };
};

/* CIRANDA (danca-da-chuva): roda de seis silhuetas dancando em volta de uma concha, base de espuma */
C['danca-da-chuva'] = function(T, kit, o){
  var K = mk(T, o), asc = K.asc, root = new T.Group(), g = K.grp(root);
  var sil = [K.corpo(K.mat(0x2A2A4A, { r: 0.6 })), K.mat(0x7A3A2A, { r: 0.6 }), K.mat(0x2A4A4A, { r: 0.6 })];
  var foam = K.mat(0xE6F4F8, { r: 0.7 }), sea = K.mat(0x3A8AA0, { r: 0.2, m: 0.1, op: 0.8 }), shell = K.mat(0xF2D2B8, { r: 0.45 }), shellD = K.mat(0xD8A888, { r: 0.5 });
  var hand = K.mat(0xD8B060, { r: 0.4, m: 0.5 }), trailM = K.own(0xFFE6A0, { op: 0.5, add: true, e: 0xFFC060, ei: 1.5 });
  K.m(g, K.disc(24), sea, 0, 0.02, 0, 0.62, 0.04, 0.62);
  var foams = [];
  for (var i = 0; i < 6; i++){ var a = i / 6 * PI * 2 + 0.3; foams.push(K.m(g, K.sph(1), foam, sin(a) * 0.58, 0.04, cos(a) * 0.58, 0.1, 0.04, 0.08)); }
  var sh = K.grp(g, 0, 0.06, 0);
  var sc = K.m(sh, K.sph(2), shell, 0, 0.12, 0, 0.17, 0.14, 0.04); sc.userData.olho = true;
  for (var r = 0; r < 4; r++){ var rb = K.m(sh, K.box(), shellD, 0, 0.12, 0.035, 0.014, 0.24, 0.012); rb.rotation.z = -0.6 + r * 0.4; }
  K.m(sh, K.sph(1), shellD, 0, 0.0, 0, 0.06, 0.04, 0.04);
  var ring = K.grp(g, 0, 0, 0), dancers = [];
  for (var j = 0; j < 6; j++){
    var a2 = j / 6 * PI * 2, d = K.grp(ring, sin(a2) * 0.42, 0.05, cos(a2) * 0.42); d.rotation.y = a2;
    var m = sil[j % 3];
    K.m(d, K.cone(8), m, 0, 0.2, 0, 0.09, 0.32, 0.09);
    K.m(d, K.sph(1), m, 0, 0.43, 0, 0.065);
    dancers.push(d);
  }
  var hands = K.m(ring, K.tor(0.42, 0.012, 3, 36), hand, 0, 0.31, 0); hands.rotation.x = PI / 2;
  var trails = [];
  if (asc >= 3){ var tr = K.m(ring, K.tor(0.48, 0.02, 3, 36, PI * 0.8), trailM, 0, 0.3, 0); tr.rotation.x = PI / 2; trails.push(tr); var tr2 = K.m(ring, K.tor(0.48, 0.02, 3, 36, PI * 0.8), trailM, 0, 0.3, 0); tr2.rotation.set(PI / 2, 0, PI); trails.push(tr2); }
  return { obj: root, anim: function(st, t, p){
    var q = fq(st, t, p); t = q.t; fpose(g, q, 0.0);
    g.rotation.y = 0;
    ring.rotation.y = t * 0.8 + 6 * q.S + (1 - q.e) * 3;
    var open = 1 + 0.25 * q.A - 0.1 * q.S;
    ring.scale.set(open, 1, open);
    dancers.forEach(function(d, i){ var k = sin(t * 4 + i * PI / 3); d.position.y = 0.05 + 0.04 * Math.max(0, k); d.rotation.set(0.12 * k, d.rotation.y, 0.1 * sin(t * 4 + i)); });
    sh.rotation.y = -t * 0.5; sh.position.y = 0.06 + 0.03 * sin(t * 1.5) + 0.12 * q.S;
    foams.forEach(function(f, i){ f.scale.set(0.1 + 0.03 * sin(t * 2 + i), 0.04, 0.08 + 0.02 * sin(t * 2.3 + i)); });
    trailM.opacity = 0.35 + 0.2 * sin(t * 3) + 0.3 * q.S;
  } };
};
})();
