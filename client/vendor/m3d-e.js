// m3d-e.js (v10, Mata Adentro) - modelos 3D chibi-heroicos do Arraial e de duas lendas da Mata/Noite.
// ids mantidos: gato-do-celeiro (Romãozinho), vira-lata-caramelo (Caramelo Caça-Visagem), sanfoneiro-do-forro (Saci-Pererê),
// boi-bumba (Mula sem Cabeça), guardia-florada (Caipora no caititu), macieira-ancia (Curupira), colmeia-dourada (Cortiço de Jataí),
// moinho-de-vento (Fogueira do Arraial), trator-vermelho (Carro de Boi Fantasma).
// Contrato: MODELOS3D.md + spec v10 §12.2: CHAR3D[id](T,kit,o) -> {obj,anim}; o.asc>=3 acrescenta o detalhe de Asc III;
// olhos com mesh.userData.olho=true; material do corpo com mat.userData.corpo=true. Funciona com kit undefined.
// Cores em hex sRGB (o three converte com ColorManagement.legacyMode=false).
(function(){
  'use strict';
  window.CHAR3D = window.CHAR3D || {};
  var C3 = window.CHAR3D;
  var PI = Math.PI, sin = Math.sin, cos = Math.cos;
  function cl(x){ return x < 0 ? 0 : x > 1 ? 1 : x; }
  function sm(x){ x = cl(x); return x * x * (3 - 2 * x); }
  function fr(x){ return x - Math.floor(x); }
  function mix(a, b, k){ return a + (b - a) * k; }
  // fases do ataque: w = preparo (0-0.35), s = golpe (0.35-0.55 extremo), depois recupera
  function ph(p){ var w = sm(p / 0.35), s = sm((p - 0.35) / 0.12), r = sm((p - 0.55) / 0.45); return { w: w * (1 - s), s: s * (1 - r), r: r }; }
  function hitc(p){ return Math.sin(cl(p) * PI); }
  function blink(t, per, off){ var x = ((t + off) % per + per) % per; return x < 0.18 ? 1 - 0.93 * Math.sin(x / 0.18 * PI) : 1; }
  function norm(st){ return (st === 'atk' || st === 'hit' || st === 'sono' || st === 'entra') ? st : 'idle'; }
  function ascOf(o){ return (o && o.asc) | 0; }

  // ------------------------------------------------------------------ kit local (privado)
  function kit(T){
    var B = {}, gc = {}, base = [];
    function G(k, f){ return gc[k] || (gc[k] = f()); }
    B.sph = function(q){ return G('s' + q, function(){
      return q === 3 ? new T.SphereGeometry(1, 28, 20) : q === 2 ? new T.SphereGeometry(1, 20, 14) : q === 1 ? new T.SphereGeometry(1, 14, 10) : new T.SphereGeometry(1, 9, 7); }); };
    B.ico = function(d){ return G('i' + d, function(){ return new T.IcosahedronGeometry(1, d); }); };
    B.oct = function(){ return G('oct', function(){ return new T.OctahedronGeometry(1, 0); }); };
    B.cyl = function(rt, rb, q, oe){ return G('c' + rt + '_' + rb + '_' + q + (oe ? 'o' : ''), function(){ return new T.CylinderGeometry(rt, rb, 1, q || 14, 1, !!oe); }); };
    B.cone = function(q){ return G('k' + q, function(){ return new T.ConeGeometry(1, 1, q || 14); }); };
    B.cap = function(r, l, q){ return G('p' + r + '_' + l + '_' + q, function(){ return new T.CapsuleGeometry(r, l, 3, q || 12); }); };
    B.tor = function(R, r, a, q, rs){ return G('t' + R + '_' + r + '_' + a + '_' + q + '_' + rs, function(){ return new T.TorusGeometry(R, r, rs || 8, q || 20, a || PI * 2); }); };
    B.box = function(){ return G('b', function(){ return new T.BoxGeometry(1, 1, 1); }); };
    B.circ = function(q){ return G('ci' + q, function(){ var g = new T.CircleGeometry(1, q || 16); g.rotateX(-PI / 2); return g; }); };
    // caixa arredondada (cantos de esfera) - visual de brinquedo
    B.rbox = function(w, h, d, r, lo){ return G('r' + w + '_' + h + '_' + d + '_' + r + (lo ? 'l' : ''), function(){
      var g = lo ? new T.SphereGeometry(1, 8, 7, PI / 8) : new T.SphereGeometry(1, 16, 11, PI / 16), p = g.attributes.position, n = g.attributes.normal;
      var ix = w / 2 - r, iy = h / 2 - r, iz = d / 2 - r;
      for (var i = 0; i < p.count; i++){
        var x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        var sx = x > 1e-6 ? ix : x < -1e-6 ? -ix : 0, sy = y > 1e-6 ? iy : y < -1e-6 ? -iy : 0, sz = z > 1e-6 ? iz : z < -1e-6 ? -iz : 0;
        p.setXYZ(i, sx + x * r, sy + y * r, sz + z * r); n.setXYZ(i, x, y, z);
      }
      return g; }); };
    B.lathe = function(pts, seg){ return new T.LatheGeometry(pts.map(function(a){ return new T.Vector2(a[0], a[1]); }), seg || 24); };
    B.star = function(R, r, d, n){ n = n || 5; return G('st' + R + '_' + r + '_' + d + '_' + n, function(){
      var s = new T.Shape();
      for (var i = 0; i < n * 2; i++){ var a = PI / 2 + i * PI / n, rr = i % 2 ? r : R; if (i) s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      var g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: d * 0.6, bevelSize: r * 0.22, bevelSegments: 2, curveSegments: 4 });
      g.translate(0, 0, -d / 2); g.computeVertexNormals(); return g; }); };
    // folha (losango curvo achatado) ao longo de +Y, comprimento 1
    B.leaf = function(){ return G('leaf', function(){
      var s = new T.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.32, 0.4, 0, 1); s.quadraticCurveTo(-0.32, 0.4, 0, 0);
      var g = new T.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1, curveSegments: 6 });
      g.translate(0, 0, -0.01); g.computeVertexNormals(); return g; }); };
    // tubo afinado ao longo de pontos (cabelo, rabo, rédeas, chifre)
    B.tube = function(pts, r0, r1, ts, rs){
      ts = ts || 14; rs = rs || 8;
      var curve = new T.CatmullRomCurve3(pts.map(function(a){ return new T.Vector3(a[0], a[1], a[2]); }));
      var g = new T.TubeGeometry(curve, ts, 1, rs, false), pos = g.attributes.position, v = new T.Vector3(), c = new T.Vector3();
      for (var i = 0; i <= ts; i++){
        curve.getPointAt(i / ts, c); var r = mix(r0, r1, i / ts);
        for (var j = 0; j <= rs; j++){ var k = i * (rs + 1) + j; v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c); pos.setXYZ(k, v.x, v.y, v.z); }
      }
      g.computeVertexNormals(); return g;
    };
    B.mat = function(c, o){
      o = o || {};
      var m = new T.MeshStandardMaterial({ color: o.vc ? 0xffffff : c, roughness: o.r != null ? o.r : 0.62, metalness: o.m || 0, vertexColors: !!o.vc, flatShading: !!o.flat });
      if (o.e != null){ m.emissive = new T.Color(o.e); m.emissiveIntensity = o.ei != null ? o.ei : 1; }
      if (o.op != null){ m.transparent = true; m.opacity = o.op; m.depthWrite = false; }
      if (o.ds) m.side = T.DoubleSide;
      if (o.corpo) m.userData.corpo = true;
      return m;
    };
    B.add = function(par, geo, mat, p, s, r){
      var m = new T.Mesh(geo, mat);
      m.castShadow = !mat.transparent; m.receiveShadow = true;
      if (p) m.position.set(p[0], p[1], p[2]);
      if (s) { if (typeof s === 'number') m.scale.set(s, s, s); else m.scale.set(s[0], s[1], s[2]); }
      if (r) m.rotation.set(r[0], r[1], r[2]);
      par.add(m); return m;
    };
    B.grp = function(par, p, r){ var g = new T.Group(); if (p) g.position.set(p[0], p[1], p[2]); if (r) g.rotation.set(r[0], r[1], r[2]); par.add(g); return g; };
    var _m = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _v = new T.Vector3(), _s = new T.Vector3();
    B.mtx = function(p, s, r){
      _e.set(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0); _q.setFromEuler(_e);
      if (typeof s === 'number') _s.set(s, s, s); else if (s) _s.set(s[0], s[1], s[2]); else _s.set(1, 1, 1);
      _v.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0);
      return _m.clone().compose(_v, _q, _s);
    };
    B.paint = function(geo, fn){
      var g = geo.clone(), p = g.attributes.position, nn = g.attributes.normal, col = new Float32Array(p.count * 3), c = new T.Color();
      for (var i = 0; i < p.count; i++){ c.setRGB(1, 1, 1); fn(p.getX(i), p.getY(i), p.getZ(i), c, nn.getX(i), nn.getY(i), nn.getZ(i)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      g.setAttribute('color', new T.BufferAttribute(col, 3)); return g;
    };
    B.col = function(h){ return new T.Color(h); };
    // junta varias pecas numa geometria so (com cor por vertice): parts = [geo, pos, escala, rot, cor]
    B.merge = function(parts){
      var P = [], N = [], C = [], c = new T.Color();
      parts.forEach(function(a){
        var g = a[0].index ? a[0].toNonIndexed() : a[0].clone();
        g.applyMatrix4(B.mtx(a[1], a[2], a[3]));
        var p = g.attributes.position, n = g.attributes.normal, cc = g.attributes.color;
        if (a[4] != null) c.set(a[4]);
        for (var i = 0; i < p.count; i++){
          P.push(p.getX(i), p.getY(i), p.getZ(i)); N.push(n.getX(i), n.getY(i), n.getZ(i));
          if (a[4] == null && cc) C.push(cc.getX(i), cc.getY(i), cc.getZ(i)); else if (a[4] == null) C.push(1, 1, 1); else C.push(c.r, c.g, c.b);
        }
        g.dispose();
      });
      var out = new T.BufferGeometry();
      out.setAttribute('position', new T.Float32BufferAttribute(P, 3));
      out.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
      out.setAttribute('color', new T.Float32BufferAttribute(C, 3));
      out.computeBoundingSphere();
      return out;
    };
    var M = {};
    B.eyeMats = function(){
      if (!M.w){ M.w = B.mat(0xF6F1E8, { r: 0.25 }); M.p = B.mat(0x120E16, { r: 0.2 }); M.h = B.mat(0xffffff, { r: 0.2, e: 0xffffff, ei: 0.9 }); }
      return M;
    };
    function tag(m){ m.userData.olho = true; return m; }
    // olho chibi: branco + (iris) + pupila + brilho; arco fechado (sono / dor). o.ghost = olho oco que brilha
    B.eye = function(par, x, y, z, r, o){
      o = o || {}; var m = B.eyeMats();
      var g = B.grp(par, [x, y, z], [o.rx || 0, o.ry || 0, o.rz || 0]);
      var op = B.grp(g);
      if (o.ghost){
        tag(B.add(op, B.sph(1), o.socket || m.p, [0, 0, 0], [r, r * 1.15, r * 0.5]));
        tag(B.add(op, B.sph(0), o.ghost, [0, -r * 0.08, r * 0.32], [r * 0.34, r * 0.46, r * 0.22]));
      } else {
        tag(B.add(op, B.sph(1), m.w, [0, 0, 0], [r, r * 1.1, r * 0.62]));
        if (o.iris) tag(B.add(op, B.sph(1), o.iris, [0, -r * 0.06, r * 0.36], [r * 0.74, r * 0.82, r * 0.34]));
        tag(B.add(op, B.sph(0), m.p, [0, -r * 0.08, r * 0.47], o.slit ? [r * 0.2, r * 0.62, r * 0.22] : [r * 0.48, r * 0.58, r * 0.24]));
        B.add(op, B.sph(0), m.h, [r * 0.22, r * 0.3, r * 0.6], [r * 0.22, r * 0.22, r * 0.1]);
      }
      var c = B.add(g, B.tor(0.72, 0.13, PI, 10, 5), o.lid || m.p, [0, 0, r * 0.45], [r, r, r], [0, 0, PI]);
      c.visible = false;
      return { g: g, op: op, cl: c };
    };
    // olho apoiado na superficie de uma cabeca elipsoide (centro hc, raios hs)
    B.eyeOn = function(par, hc, hs, x, y, r, o){
      var q = 1 - Math.pow((x - hc[0]) / hs[0], 2) - Math.pow((y - hc[1]) / hs[1], 2);
      var z = hc[2] + hs[2] * Math.sqrt(Math.max(0.05, q)) - r * 0.2;
      o = o || {}; if (o.ry == null) o.ry = Math.asin(Math.max(-0.9, Math.min(0.9, (x - hc[0]) / hs[0]))) * 0.75;
      if (o.rx == null) o.rx = -Math.asin(Math.max(-0.9, Math.min(0.9, (y - hc[1]) / hs[1]))) * 0.6;
      return B.eye(par, x, y, z, r, o);
    };
    // olho simples de bicho (bolinha escura + brilho)
    B.beady = function(par, x, y, z, r){
      var g = B.grp(par, [x, y, z]), m = B.eyeMats();
      var op = B.grp(g);
      tag(B.add(op, B.sph(1), m.p, [0, 0, 0], r));
      B.add(op, B.sph(0), m.h, [r * 0.35, r * 0.4, r * 0.7], r * 0.3);
      var c = B.add(g, B.tor(0.72, 0.13, PI, 10, 5), m.p, [0, 0, r * 0.4], [r, r, r], [0, 0, PI]); c.visible = false;
      return { g: g, op: op, cl: c };
    };
    // mode: 'o' aberto (bl = abertura), 's' dormindo (arco u), 'h' apertado (arco n)
    B.eyes = function(arr, mode, bl){
      arr.forEach(function(e){
        e.op.visible = mode === 'o'; e.cl.visible = mode !== 'o';
        if (mode === 'o') e.op.scale.y = Math.max(0.06, bl);
        else { e.cl.rotation.z = mode === 's' ? PI : 0; e.cl.position.y = 0; }
      });
    };
    B.done = function(root){
      base.length = 0;
      root.traverse(function(o){ base.push([o, o.position.clone(), o.rotation.clone(), o.scale.clone(), o.visible]); });
    };
    B.reset = function(){ for (var i = 0; i < base.length; i++){ var b = base[i]; b[0].position.copy(b[1]); b[0].rotation.copy(b[2]); b[0].scale.copy(b[3]); b[0].visible = b[4]; } };
    return B;
  }
  function col(T, h){ return new T.Color(h); }

  // =================================================================== ROMÃOZINHO (gato-do-celeiro)
  // moleque-fantasma de Goiás: pele cinza-azulada que brilha de leve, calção, camiseta rasgada, olhos ocos, sorriso luminoso, estilingue
  C3['gato-do-celeiro'] = function(T, _k, o){
    var B = kit(T), root = new T.Group(), asc = ascOf(o);
    var mSk = B.mat(0x7F93B8, { r: 0.45, e: 0x2C4C86, ei: 0.45, corpo: 1 });
    var mSh = B.mat(0x9AA6BC, { r: 0.75 }), mPa = B.mat(0x3E2C24, { r: 0.8 }), mHa = B.mat(0x232A44, { r: 0.7 });
    var mWd = B.mat(0x6B4426, { r: 0.7 }), mBand = B.mat(0x8A2E2A, { r: 0.6 }), mSt = B.mat(asc >= 3 ? 0xFFB040 : 0x8C8C94, asc >= 3 ? { r: 0.4, e: 0xFF7A1A, ei: 1.6 } : { r: 0.8 });
    var mGl = B.mat(0x7FE8FF, { r: 0.3, e: 0x38C8FF, ei: 1.3 }), mSock = B.mat(0x0A0E1C, { r: 0.4 });
    var mAura = B.mat(0x9FC8FF, { e: 0x5A8CFF, ei: 0.8, op: 0.08 });
    var bod = B.grp(root);
    // pernas e pés descalços
    var legs = [-1, 1].map(function(s){
      var g = B.grp(bod, [s * 0.075, 0.33, 0]);
      B.add(g, B.cap(0.05, 0.19, 10), mSk, [0, -0.16, 0]);
      B.add(g, B.sph(1), mSk, [0, -0.3, 0.035], [0.06, 0.035, 0.09]);
      return g;
    });
    var up = B.grp(bod, [0, 0.33, 0]);
    // calção + camiseta rasgada (barra em pontas)
    B.add(up, B.sph(2), mPa, [0, 0.03, 0], [0.15, 0.1, 0.12]);
    var hem = [[B.cap(0.135, 0.12, 14), [0, 0.19, 0], [1, 1, 0.85], null, 0x9AA6BC]];
    for (var i = 0; i < 9; i++){ var a = i / 9 * PI * 2; hem.push([B.cone(5), [sin(a) * 0.125, 0.06, cos(a) * 0.105], [0.035, 0.07, 0.025], [PI + cos(a) * 0.3, 0, -sin(a) * 0.3], i % 2 ? 0x8592AA : 0x9AA6BC]); }
    hem.push([B.box(), [0.05, 0.2, 0.118], [0.05, 0.035, 0.01], [0, 0, 0.5], 0x5C6A84]);
    var torso = B.add(up, B.merge(hem), B.mat(0xffffff, { vc: 1, r: 0.75 }), [0, 0, 0]);
    // braços (R segura o elástico, L segura o estilingue)
    var arms = [-1, 1].map(function(s){
      var g = B.grp(up, [s * 0.155, 0.27, 0], [0, 0, s * 0.25]);
      B.add(g, B.cap(0.042, 0.15, 8), mSk, [0, -0.1, 0]);
      var h = B.grp(g, [0, -0.21, 0]);
      B.add(h, B.sph(1), mSk, [0, 0, 0], 0.048);
      return { g: g, h: h };
    });
    var armR = arms[1], armL = arms[0];
    // estilingue na mão esquerda
    var sl = B.grp(armL.h, [0, -0.01, 0.03], [-0.2, 0, 0]); sl.scale.setScalar(1.7);
    B.add(sl, B.merge([[B.cyl(1, 1, 6), [0, 0.05, 0], [0.012, 0.1, 0.012]], [B.cyl(1, 1, 6), [-0.025, 0.12, 0], [0.01, 0.07, 0.01], [0, 0, 0.45]], [B.cyl(1, 1, 6), [0.025, 0.12, 0], [0.01, 0.07, 0.01], [0, 0, -0.45]]]), mWd, [0, 0, 0]);
    var bands = [-1, 1].map(function(s){ var g = B.grp(sl, [s * 0.04, 0.15, 0]); B.add(g, B.cyl(1, 1, 5), mBand, [0, 0, 0.5], [0.006, 1, 0.006], [PI / 2, 0, 0]); return g; });
    // pedra (voa no golpe) + cauda de cometa (Asc III)
    var stone = B.grp(root, [0, 0, 0]);
    B.add(stone, B.ico(1), mSt, [0, 0, 0], 0.034);
    var tail = null;
    if (asc >= 3){ tail = B.add(stone, B.cone(10), B.mat(0xFFC060, { e: 0xFF8A20, ei: 1.4, op: 0.55 }), [0, 0, -0.12], [0.03, 0.22, 0.03], [-PI / 2, 0, 0]); }
    // cabeça
    var hd = B.grp(up, [0, 0.55, 0.01]);
    B.add(hd, B.sph(3), mSk, [0, 0, 0], [0.26, 0.24, 0.24]);
    [-1, 1].forEach(function(s){ B.add(hd, B.sph(0), mSk, [s * 0.255, -0.01, 0], [0.05, 0.07, 0.035]); });
    var eyes = [-1, 1].map(function(s){ return B.eyeOn(hd, [0, 0, 0], [0.26, 0.24, 0.24], s * 0.095, 0.035, 0.07, { ghost: mGl, socket: mSock, lid: mGl }); });
    var grin = B.add(hd, B.tor(0.09, 0.016, PI, 14, 6), mGl, [0, -0.085, 0.215], [1, 0.8, 1], [0.15, 0, PI]);
    B.add(hd, B.sph(0), mSk, [0, -0.02, 0.24], [0.03, 0.025, 0.025]);
    var brows = [-1, 1].map(function(s){ return B.add(hd, B.cap(0.014, 0.07, 6), mHa, [s * 0.1, 0.12, 0.215], 1, [0.2, 0, PI / 2 + s * 0.35]); });
    // cabelo arrepiado
    var hair = [[B.sph(1), [0, 0.07, -0.025], [0.265, 0.2, 0.245], null, 0x3A4670]];
    [[0, 0.22, 0.02, -0.3, 0], [0.1, 0.22, 0.1, -0.6, -0.5], [-0.1, 0.23, 0.08, -0.5, 0.5], [0.16, 0.16, -0.04, 0, -1.0], [-0.16, 0.17, -0.02, 0, 1.0], [0.04, 0.2, -0.16, 0.7, 0], [0.12, 0.1, 0.17, -1.0, -0.8]]
      .forEach(function(q){ hair.push([B.cone(6), [q[0], q[1], q[2]], [0.055, 0.15, 0.055], [q[3], 0, q[4]], 0x46557F]); });
    B.add(hd, B.merge(hair), B.mat(0xffffff, { vc: 1, r: 0.7 }), [0, 0.02, -0.01]);
    // aura de visagem
    var aura = B.add(bod, B.sph(1), mAura, [0, 0.6, 0], [0.42, 0.62, 0.38]);
    // Asc III: um cometinha orbitando
    var orb = null;
    if (asc >= 3){ orb = B.grp(root, [0, 0.75, 0]); var oc = B.grp(orb, [0.45, 0, 0]); B.add(oc, B.ico(1), mSt, [0, 0, 0], 0.03); B.add(oc, B.cone(8), B.mat(0xFFC060, { e: 0xFF8A20, ei: 1.3, op: 0.5 }), [0, 0, -0.1], [0.026, 0.18, 0.026], [-PI / 2, 0, 0]); }
    B.done(root);
    var ei0 = mSk.emissiveIntensity, eg0 = mGl.emissiveIntensity;
    function band(pz){ // elástico do estilingue até a bolsinha em (0, 0.15, pz) no espaço do estilingue
      bands.forEach(function(g, i){ var dx = (i ? -0.04 : 0.04), L = Math.max(0.01, Math.sqrt(dx * dx + pz * pz)); g.rotation.y = Math.atan2(dx, pz); g.scale.set(1, 1, L); });
    }
    return { obj: root, anim: function(st, t, p){
      st = norm(st); t = t || 0; p = p || 0; B.reset();
      var bl = blink(t, 3.6, 0.7), mode = 'o', br = sin(t * 2.4);
      up.position.y += 0.012 * br; hd.rotation.z += 0.1 * sin(t * 0.9); hd.rotation.y += 0.18 * sin(t * 0.6);
      mSk.emissiveIntensity = ei0 * (0.85 + 0.15 * sin(t * 3.1)); mGl.emissiveIntensity = eg0 * (0.85 + 0.15 * sin(t * 5.3));
      mAura.opacity = 0.07 + 0.03 * sin(t * 2);
      aura.scale.y *= 1 + 0.04 * br;
      // idle: joga a pedra pra cima e pega
      var q = fr(t / 1.6), toss = sin(q * PI);
      armR.g.rotation.x -= 0.9 + 0.3 * toss; armL.g.rotation.x -= 0.5;
      var sx = 0.2, sy = 0.52 + 0.3 * toss, sz = 0.17, pz = 0.0, flying = 0;
      if (st === 'atk'){
        var a = ph(p);
        bod.rotation.y = -0.35 * a.w; up.rotation.x += -0.1 * a.w + 0.12 * a.s;
        armL.g.rotation.set(-1.45, 0, 0.1); armR.g.rotation.set(-1.25 + 0.25 * a.w, 0, -0.05 - 0.15 * a.w);
        sl.rotation.x = 1.2;
        pz = -0.24 * a.w; flying = p > 0.4 ? cl((p - 0.4) / 0.3) : 0;
        sx = -0.12; sy = 0.82; sz = 0.33 + pz + flying * 1.4; if (flying) { sx = -0.12 * (1 - flying); sy = 0.82 + 0.06 * sin(flying * PI); }
        hd.rotation.y = 0.25 * a.w;
        if (p > 0.4 && p < 0.8) grin.scale.x *= 1.2;
      } else if (st === 'hit'){
        var h = hitc(p);
        up.rotation.x -= 0.3 * h; bod.position.z -= 0.08 * h; mode = h > 0.2 ? 'h' : 'o';
        mSk.emissiveIntensity = ei0 * (1 + 2 * h * (0.5 + 0.5 * sin(p * 60))); mAura.opacity = 0.14 + 0.25 * h;
      } else if (st === 'sono'){
        var b2 = sin(t * 1.1);
        up.rotation.x += 0.25; hd.rotation.x = 0.35; hd.rotation.z = 0.2; hd.rotation.y = 0; up.position.y = 0.3 + 0.01 * b2;
        legs.forEach(function(l, i){ l.rotation.x = -0.15; }); armR.g.rotation.x = -0.3; mode = 's'; sy = 0.3; sx = 0.2; sz = 0.16;
        mSk.emissiveIntensity = ei0 * 0.6;
      } else if (st === 'entra'){
        var e = sm(p / 0.6);
        bod.scale.set(mix(0.4, 1, e), mix(0.05, 1, e), mix(0.4, 1, e)); bod.rotation.y = (1 - e) * 4;
        mAura.opacity = 0.14 + 0.4 * (1 - e); mSk.emissiveIntensity = ei0 * (1 + 3 * (1 - e));
      }
      band(st === 'atk' && flying === 0 ? Math.min(-0.01, pz) : -0.02);
      stone.position.set(sx, sy, sz); stone.visible = st !== 'sono';
      if (tail) tail.visible = st === 'atk' ? flying > 0 : true;
      if (orb){ orb.rotation.y = t * 2.2; orb.rotation.z = 0.25 * sin(t); }
      B.eyes(eyes, mode, bl);
    } };
  };

  // =================================================================== CARAMELO CAÇA-VISAGEM (vira-lata-caramelo)
  // vira-lata caramelo de bandana vermelha e lanterninha na coleira; uma orelha em pé. Asc III: a lanterna queima violeta
  C3['vira-lata-caramelo'] = function(T, _k, o){
    var B = kit(T), root = new T.Group(), asc = ascOf(o);
    var CA = 0xC2742F, EA = 0x6E3D1E, CR = 0xE9CFA2, RD = 0xC42A2A;
    var cCa = col(T, CA), cCr = col(T, CR);
    var mCa = B.mat(CA, { r: 0.72 }), mEa = B.mat(EA, { r: 0.72 }), mCr = B.mat(CR, { r: 0.72 }), mRd = B.mat(RD, { r: 0.6 });
    var mVc = B.mat(0xffffff, { vc: 1, r: 0.72, corpo: 1 }), mNo = B.mat(0x2A1E22, { r: 0.25 }), mTg = B.mat(0xF27A9A, { r: 0.4 });
    var mMo = B.mat(0x7A1F3D, { r: 0.6 }), mBl = B.mat(0xF49AC1, { op: 0.7 }), mIrisD = B.mat(0x5A3220, { r: 0.3 });
    var bod = B.grp(root);
    var torso = B.add(bod, B.paint(B.sph(2), function(x, y, z, c){ c.copy(cCa).lerp(cCr, sm((z - 0.2) / 0.3) * sm((0.55 - y) / 0.3) * sm((0.45 - Math.abs(x)) / 0.2)); }), mVc, [0, 0.36, -0.02], [0.34, 0.37, 0.32]);
    [-1, 1].forEach(function(s){
      B.add(bod, B.sph(1), mCa, [s * 0.21, 0.18, -0.06], [0.17, 0.17, 0.22]);
      B.add(bod, B.sph(1), mCr, [s * 0.23, 0.045, 0.11], [0.095, 0.05, 0.12]);
    });
    var legs = [-1, 1].map(function(s){
      var g = B.grp(bod, [s * 0.115, 0.4, 0.15]);
      B.add(g, B.cap(0.07, 0.22, 10), mCa, [0, -0.17, 0]);
      B.add(g, B.sph(1), mCr, [0, -0.35, 0.03], [0.09, 0.06, 0.105]);
      return g;
    });
    // bandana vermelha de bolinhas
    B.add(bod, B.tor(0.17, 0.045, 0, 16, 6), mRd, [0, 0.66, 0.03], [1, 1, 0.95], [PI / 2 - 0.15, 0, 0]);
    var dots = [];
    [[0, 0.03, 0.065], [-0.07, 0.07, 0.06], [0.07, 0.07, 0.06], [0, 0.11, 0.055]].forEach(function(d){ dots.push([B.ico(1), [d[0], d[1] - 0.12, d[2]], [0.018, 0.018, 0.008], null, 0xffffff]); });
    var flap = B.merge([[B.cone(4), [0, -0.05, 0], [0.17, 0.2, 0.05], [PI, PI / 4, 0], RD]].concat(dots));
    B.add(bod, flap, mVc, [0, 0.62, 0.27], [1.25, 1.2, 1.4], [-0.35, 0, 0]);
    // cabeca
    var hd = B.grp(bod, [0, 0.92, 0.05]);
    B.add(hd, B.paint(B.sph(2), function(x, y, z, c){ c.copy(cCa).lerp(cCr, sm((0.12 - Math.abs(x)) / 0.06) * sm((z - 0.2) / 0.2) * sm((y + 0.3) / 0.2)); }), mVc, [0, 0, 0], [0.31, 0.28, 0.28]);
    B.add(hd, B.sph(1), mCr, [0, -0.075, 0.235], [0.145, 0.1, 0.13]);
    B.add(hd, B.sph(1), mNo, [0, -0.025, 0.36], [0.055, 0.04, 0.04]);
    B.add(hd, B.sph(1), mMo, [0, -0.15, 0.22], [0.095, 0.045, 0.09]);
    var jaw = B.grp(hd, [0, -0.12, 0.17]);
    B.add(jaw, B.sph(1), mCr, [0, -0.025, 0.07], [0.105, 0.05, 0.1]);
    var tongue = B.add(jaw, B.sph(1), mTg, [0, 0.0, 0.12], [0.05, 0.018, 0.065]);
    var eyes = [-1, 1].map(function(s){ return B.eyeOn(hd, [0, 0, 0], [0.31, 0.28, 0.28], s * 0.12, 0.05, 0.08, { iris: mIrisD }); });
    var brows = [-1, 1].map(function(s){ return B.add(hd, B.cap(0.016, 0.06, 6), mEa, [s * 0.12, 0.155, 0.235], 1, [0.3, 0, PI / 2 - s * 0.3]); });
    var ears = [-1, 1].map(function(s){
      if (s < 0){ // orelha em pé (a que escuta visagem)
        var gu = B.grp(hd, [-0.17, 0.2, 0.0], [0, 0, 0.22]);
        B.add(gu, B.cone(10), mEa, [0, 0.1, 0], [0.085, 0.22, 0.05]);
        B.add(gu, B.cone(8), mCr, [0, 0.08, 0.025], [0.05, 0.15, 0.02]);
        return gu;
      }
      var g = B.grp(hd, [s * 0.235, 0.15, 0.03], [0, 0, -s * 0.3]);
      B.add(g, B.sph(1), mEa, [s * 0.035, -0.07, 0], [0.1, 0.17, 0.06], [0, s * 0.3, s * 0.2]);
      return g;
    });
    // lanterninha amarrada na coleira
    var LC = asc >= 3 ? 0xB57CFF : 0xFFB347, LE = asc >= 3 ? 0x9A4DFF : 0xFF8A1A;
    var lant = B.grp(bod, [0.13, 0.6, 0.25]); lant.scale.setScalar(1.55);
    var mMet = B.mat(0x3A3A40, { r: 0.4, m: 0.6 }), mFl = B.mat(LC, { r: 0.3, e: LE, ei: 2.2 }), mGlass = B.mat(LC, { e: LE, ei: 0.6, op: 0.35 });
    B.add(lant, B.tor(0.025, 0.006, 0, 10, 4), mMet, [0, 0.0, 0], 1, [0, PI / 2, 0]);
    var lb = B.grp(lant, [0, -0.06, 0]);
    B.add(lb, B.merge([[B.cone(8), [0, 0.045, 0], [0.045, 0.03, 0.045]], [B.cyl(1, 1, 8), [0, -0.045, 0], [0.04, 0.012, 0.04]],
      [B.cyl(1, 1, 4), [0.035, 0, 0], [0.005, 0.08, 0.005]], [B.cyl(1, 1, 4), [-0.035, 0, 0], [0.005, 0.08, 0.005]], [B.cyl(1, 1, 4), [0, 0, 0.035], [0.005, 0.08, 0.005]]]), mMet, [0, 0, 0]);
    var flame = B.add(lb, B.sph(1), mFl, [0, -0.005, 0], [0.022, 0.03, 0.022]);
    B.add(lb, B.cyl(1, 1, 10), mGlass, [0, 0, 0], [0.036, 0.075, 0.036]);
    var halo = B.add(lb, B.sph(1), B.mat(LC, { e: LE, ei: 1, op: 0.14 }), [0, 0, 0], 0.11);
    var ghosts = null;
    if (asc >= 3){ // visagens que só ele vê, rodeando a luz violeta
      ghosts = B.grp(bod, [0, 0.75, 0]);
      var mGh = B.mat(0xD9C8FF, { e: 0x8A5CFF, ei: 0.8, op: 0.45 });
      [0, 1].forEach(function(i){ var gg = B.grp(ghosts, [cos(i * PI) * 0.5, 0.1 * i, sin(i * PI) * 0.5]); B.add(gg, B.sph(1), mGh, [0, 0, 0], [0.06, 0.09, 0.06]); B.add(gg, B.cone(8), mGh, [0, -0.1, 0], [0.06, 0.1, 0.06], [PI, 0, 0]); });
    }
    var tails = [], par = bod;
    for (var i = 0; i < 3; i++){
      var g = B.grp(par, i ? [0, 0.12, 0] : [0, 0.14, -0.3], [i ? 0.45 : -0.95, 0, 0]);
      B.add(g, B.cap(i === 2 ? 0.045 : 0.055, 0.08, 10), i === 2 ? mCr : mCa, [0, 0.06, 0]);
      tails.push(g); par = g;
    }
    B.done(root);
    return { obj: root, anim: function(st, t, p){
      st = norm(st); t = t || 0; p = p || 0; B.reset();
      var bl = blink(t, 2.9, 1.2), mode = 'o', pant = Math.sin(t * 9);
      torso.scale.y *= 1 + 0.02 * pant; torso.scale.z *= 1 + 0.015 * pant;
      jaw.rotation.x += 0.2 + 0.08 * pant; tongue.position.z += 0.01 * pant;
      tails[0].rotation.z += 0.55 * Math.sin(t * 11); tails[1].rotation.z += 0.3 * Math.sin(t * 11 - 0.8);
      hd.rotation.z += 0.13 * Math.sin(t * 0.7); hd.rotation.x += 0.03 * Math.sin(t * 1.4);
      ears.forEach(function(e, i){ e.rotation.z += 0.08 * Math.sin(t * 9 + i); });
      if (st === 'atk'){
        var a = ph(p);
        bod.rotation.x += -0.16 * a.w + 0.3 * a.s; bod.position.z += 0.18 * a.s - 0.04 * a.w;
        hd.position.z += 0.16 * a.s - 0.04 * a.w; hd.rotation.x += -0.25 * a.w + 0.2 * a.s; hd.rotation.z *= 0.3;
        jaw.rotation.x = 0.2 + 0.85 * a.w - 0.15 * a.s;
        ears.forEach(function(e, i){ e.rotation.z += (i ? 1 : -1) * 0.5 * (a.w + a.s); e.rotation.x -= 0.4 * a.s; });
        legs.forEach(function(l){ l.rotation.x -= 0.3 * a.s; });
      } else if (st === 'hit'){
        var h = hitc(p);
        bod.rotation.x -= 0.3 * h; bod.position.z -= 0.1 * h; bod.scale.y *= 1 - 0.1 * h;
        hd.rotation.x -= 0.25 * h; jaw.rotation.x = 0.35 * h;
        ears.forEach(function(e, i){ e.rotation.z += (i ? 1 : -1) * 0.7 * h; });
        mode = h > 0.2 ? 'h' : 'o';
      } else if (st === 'sono'){
        var b2 = Math.sin(t * 1.1);
        bod.scale.y *= 0.78 + 0.02 * b2; bod.scale.x *= 1.1; bod.scale.z *= 1.08;
        hd.position.y -= 0.2; hd.position.z += 0.1; hd.rotation.x += 0.25; hd.rotation.z = 0.1;
        jaw.rotation.x = 0; tongue.visible = false;
        tails[0].rotation.x = -1.5; tails[0].rotation.z = 0.6; tails[1].rotation.x = 0.1; tails[1].rotation.z = 0.5;
        ears.forEach(function(e, i){ e.rotation.z += (i ? -1 : 1) * 0.3; });
        legs.forEach(function(l){ l.rotation.x -= 0.55; l.position.y -= 0.06; });
        mode = 's';
      } else if (st === 'entra'){
        var j = Math.sin(cl(p) * PI);
        bod.position.y += 0.38 * j; bod.scale.y *= 1 + 0.1 * j;
        legs.forEach(function(l){ l.rotation.x -= 0.8 * j; });
        ears.forEach(function(e, i){ e.rotation.z += (i ? 1 : -1) * 0.6 * j; });
        jaw.rotation.x += 0.3 * j; tails[0].rotation.x += 0.4 * j;
      }
      if (st !== 'sono') tongue.visible = true;
      ears[0].rotation.z = 0.22 + 0.06 * sin(t * 4.3); // a orelha em pé gira atrás de visagem
      lb.rotation.z = 0.25 * sin(t * 2.3) + (st === 'atk' ? -0.5 * ph(p).s : 0); lb.rotation.x = 0.15 * sin(t * 1.7);
      var fl = 0.85 + 0.15 * sin(t * 13) * sin(t * 7.3);
      flame.scale.set(0.022 * fl, 0.03 * (0.9 + 0.2 * fl), 0.022 * fl); mFl.emissiveIntensity = 2.2 * fl;
      halo.scale.setScalar(0.11 * (0.9 + 0.15 * fl)); halo.visible = st !== 'sono';
      if (st === 'sono') mFl.emissiveIntensity = 0.6;
      if (ghosts){ ghosts.rotation.y = t * 0.9; ghosts.position.y = 0.75 + 0.05 * sin(t * 1.5); }
      B.eyes(eyes, mode, bl);
    } };
  };


  // =================================================================== SACI-PERERÊ (sanfoneiro-do-forro)
  // nosso Saci: uma perna, gorro vermelho, colete de palha trançada, redemoinho na perna, sorriso maroto. Pele marrom, traços naturais, sem cachimbo.
  C3['sanfoneiro-do-forro'] = function(T, _k, o){
    var B = kit(T), root = new T.Group(), asc = ascOf(o);
    var mSk = B.mat(0x8A5636, { r: 0.55, corpo: 1 }), mSkD = B.mat(0x734429, { r: 0.6 }), mHa = B.mat(0x1E1410, { r: 0.75 });
    var mRed = B.mat(0xC21E1A, { r: 0.55 }), mRedD = B.mat(0x8C1512, { r: 0.6 }), mPa = B.mat(0x5A2A1C, { r: 0.75 });
    var mVc = B.mat(0xffffff, { vc: 1, r: 0.8 }), mMo = B.mat(0x3A1418, { r: 0.6 }), mTe = B.mat(0xF4EEE2, { r: 0.4 });
    var mIris = B.mat(0x4A2A14, { r: 0.3 });
    var mW1 = B.mat(0xE8D9B0, { e: 0x8A7A50, ei: 0.25, op: 0.38, ds: 1 }), mW2 = B.mat(0xC9B07A, { op: 0.28, ds: 1 });
    var mLf = B.mat(0x5C8A2E, { r: 0.6, ds: 1 }), mEm = B.mat(0xFFA040, { e: 0xFF6A10, ei: 1.8 });
    var cS1 = B.col(0xD9B45A), cS2 = B.col(0xA9822E), cSk = B.col(0x8A5636);
    var bod = B.grp(root);
    // a perna (uma só), pé descalço
    var leg = B.grp(bod, [0, 0.36, 0.0]);
    B.add(leg, B.cap(0.066, 0.22, 10), mSk, [0, -0.17, 0]);
    var foot = B.add(leg, B.sph(1), mSk, [0, -0.335, 0.045], [0.075, 0.042, 0.11]);
    var up = B.grp(bod, [0, 0.36, 0]);
    // calção vermelho-terra
    B.add(up, B.sph(2), mPa, [0, 0.02, 0], [0.155, 0.1, 0.13]);
    // tronco com colete de palha trançada (aberto na frente)
    var torsoG = B.paint(B.sph(2), function(x, y, z, c){
      var open = z > 0.55 && Math.abs(x) < 0.22 + 0.25 * (y + 0.2);
      var wv = ((Math.floor((x + 2) * 9) + Math.floor((y + 2) * 9)) % 2) ? cS1 : cS2;
      c.copy(open ? cSk : wv);
    });
    var torso = B.add(up, torsoG, mVc, [0, 0.19, 0], [0.165, 0.17, 0.13]);
    // braços
    var arms = [-1, 1].map(function(s){
      var g = B.grp(up, [s * 0.16, 0.28, 0], [0, 0, s * 0.3]);
      B.add(g, B.cap(0.044, 0.15, 8), mSk, [0, -0.1, 0]);
      var h = B.grp(g, [0, -0.21, 0]); B.add(h, B.sph(1), mSk, [0, 0, 0], 0.05);
      return { g: g, h: h, s: s };
    });
    // cabeça
    var hd = B.grp(up, [0, 0.56, 0.01]);
    B.add(hd, B.sph(3), mSk, [0, 0, 0], [0.25, 0.235, 0.235]);
    [-1, 1].forEach(function(s){ B.add(hd, B.sph(0), mSk, [s * 0.245, -0.01, 0], [0.045, 0.065, 0.035]); });
    B.add(hd, B.sph(1), mSkD, [0, -0.035, 0.235], [0.042, 0.034, 0.03]);
    var eyes = [-1, 1].map(function(s){ return B.eyeOn(hd, [0, 0, 0], [0.25, 0.235, 0.235], s * 0.09, 0.03, 0.062, { iris: mIris }); });
    var brows = [-1, 1].map(function(s){ return B.add(hd, B.cap(0.013, 0.06, 6), mHa, [s * 0.09, 0.115, 0.215], 1, [0.2, 0, PI / 2 + (s < 0 ? 0.35 : -0.15)]); });
    var mouth = B.grp(hd, [0.012, -0.095, 0.208], [0.2, 0.05, -0.1]);
    B.add(mouth, B.sph(1, 0), mMo, [0, -0.008, 0], [0.068, 0.026, 0.022]);
    B.add(mouth, B.sph(0), mTe, [0, 0.006, 0.01], [0.06, 0.013, 0.013]);
    B.add(mouth, B.tor(0.075, 0.009, PI, 12, 5), mSkD, [0, 0.012, 0.004], [1, 0.75, 1], [0, 0, PI]);
    // cabelo crespo curtinho por baixo do gorro
    var curls = [];
    for (var i = 0; i < 9; i++){ var a = PI * 0.45 + i / 8 * PI * 1.1; curls.push([B.sph(0), [sin(a) * 0.215, 0.0 + 0.025 * cos(a * 3), cos(a) * 0.2 - 0.01], 0.05]); }
    B.add(hd, B.merge(curls), B.mat(0xffffff, { vc: 1, r: 0.85 }), [0, 0, 0]).material.color.set(0x1E1410);
    // gorro vermelho (carapuça) de ponta caída
    var cap = B.grp(hd, [0, 0.12, -0.02], [-0.22, 0, 0.1]);
    B.add(cap, B.sph(2), mRed, [0, 0.0, 0], [0.225, 0.13, 0.215]);
    B.add(cap, B.tor(0.212, 0.022, 0, 22, 6), mRedD, [0, -0.03, 0], [1, 1, 0.95], [PI / 2, 0, 0]);
    var tipG = B.grp(cap, [0, 0.07, -0.03]);
    B.add(tipG, B.tube([[0, 0, 0], [0, 0.13, -0.05], [0.03, 0.17, -0.18], [0.07, 0.09, -0.3], [0.09, -0.02, -0.33]], 0.12, 0.022, 18, 10), mRed, [0, 0, 0]);
    B.add(tipG, B.sph(0), mRedD, [0.09, -0.03, -0.33], 0.032);
    // redemoinho na perna
    var whirl = B.grp(bod, [0, 0, 0]);
    var rings = [0, 1, 2].map(function(i){ return B.add(whirl, B.tor(0.13 + i * 0.05, 0.012, PI * 1.5, 20, 4), i % 2 ? mW2 : mW1, [0, 0.05 + i * 0.09, 0], 1, [PI / 2, 0, 0]); });
    var bits = [0, 1, 2].map(function(i){ return B.add(whirl, B.leaf(), mLf, [0, 0, 0], 0.07); });
    // Asc III: redemoinho completo de folhas e brasas em volta dele
    var big = null, bigBits = [];
    if (asc >= 3){
      big = B.add(whirl, B.lathe([[0.16, 0], [0.22, 0.3], [0.3, 0.7], [0.38, 1.1]], 20), B.mat(0xE8D2A0, { e: 0x7A5A30, ei: 0.3, op: 0.13, ds: 1 }), [0, 0, 0]);
      for (var k = 0; k < 6; k++) bigBits.push(B.add(whirl, k % 2 ? B.oct() : B.leaf(), k % 2 ? mEm : mLf, [0, 0, 0], k % 2 ? 0.025 : 0.06));
    }
    B.done(root);
    return { obj: root, anim: function(st, t, p){
      st = norm(st); t = t || 0; p = p || 0; B.reset();
      var bl = blink(t, 3.1, 0.4), mode = 'o', hop = Math.abs(sin(t * 3.6)), sq = 1 - hop, wsp = 5, wsc = 1;
      bod.position.y += 0.06 * hop; leg.scale.y *= 1 - 0.1 * Math.pow(sq, 4); up.position.y -= 0.02 * Math.pow(sq, 4);
      arms[0].g.rotation.z -= 0.25 * hop; arms[1].g.rotation.z += 0.25 * hop;
      hd.rotation.z += 0.08 * sin(t * 1.8); cap.rotation.z += 0.12 * sin(t * 1.8 + 0.6); tipG.rotation.x += 0.25 * sin(t * 3.6 + 1);
      // tira o gorro de leve a cada 4 s
      var cq = fr(t / 4) * 4, tip = cq < 0.7 ? sin(cq / 0.7 * PI) : 0;
      arms[1].g.rotation.z += 2.2 * tip; arms[1].g.rotation.x -= 0.4 * tip; cap.position.y += 0.05 * tip; cap.rotation.z -= 0.4 * tip;
      if (st === 'atk'){
        var a = ph(p);
        bod.position.y = 0.06 * a.s; bod.rotation.y = -0.5 * a.w + (p > 0.1 ? sm((p - 0.1) / 0.32) * PI * 2 : 0);
        up.rotation.x += -0.15 * a.w + 0.1 * a.s; leg.rotation.x = 0.4 * a.w - 1.3 * a.s; foot.scale.z *= 1 + 0.3 * a.s;
        arms.forEach(function(A){ A.g.rotation.z = A.s * (0.3 + 1.2 * (a.w + a.s)); });
        wsp = 5 + 25 * (a.w + a.s); wsc = 1 + 0.9 * a.s + 0.3 * a.w;
        mouth.scale.y *= 1 + a.s;
      } else if (st === 'hit'){
        var h = hitc(p);
        up.rotation.x -= 0.3 * h; bod.position.z -= 0.1 * h; cap.rotation.x -= 0.4 * h; mode = h > 0.2 ? 'h' : 'o'; wsc = 1 - 0.4 * h;
      } else if (st === 'sono'){
        bod.position.y = 0; leg.scale.y = 1; up.position.y = 0.34; up.rotation.x = 0.2; hd.rotation.x = 0.35; hd.rotation.z = 0.15;
        arms[0].g.rotation.z = -0.3; arms[1].g.rotation.z = 0.3; arms[1].g.rotation.x = 0; cap.position.y = 0.1; cap.rotation.z = 0.08;
        cap.rotation.x = 0.3; mode = 's'; wsp = 0.8; wsc = 0.6;
      } else if (st === 'entra'){
        var e = sm(p / 0.7);
        bod.rotation.y = (1 - e) * PI * 4; bod.position.y = 0.4 * sin(e * PI); wsc = 1 + 1.5 * (1 - e); wsp = 30 * (1 - e) + 5;
      }
      whirl.rotation.y = t * wsp * 0.6 + (st === 'atk' ? p * 20 : 0); whirl.scale.set(wsc, 1 + 0.4 * (wsc - 1), wsc);
      rings.forEach(function(r, i){ r.rotation.z = t * (3 + i) * (i % 2 ? -1 : 1); r.position.y = 0.05 + i * 0.09 + 0.02 * sin(t * 4 + i); });
      bits.forEach(function(b, i){ var a2 = t * 4 + i * 2.1; b.position.set(cos(a2) * 0.22, 0.08 + 0.12 * i + 0.04 * sin(t * 3 + i), sin(a2) * 0.22); b.rotation.set(t * 3 + i, a2, 0.5); });
      bigBits.forEach(function(b, i){ var a2 = t * 3 + i * 1.05, rr = 0.25 + 0.04 * i, yy = fr(t * 0.35 + i / 6); b.position.set(cos(a2) * (rr + yy * 0.2), 0.1 + yy * 1.0, sin(a2) * (rr + yy * 0.2)); b.rotation.set(t * 4 + i, a2, 0); });
      if (big) big.rotation.y = -t * 2;
      B.eyes(eyes, mode, bl);
    } };
  };

  // =================================================================== MULA SEM CABEÇA (boi-bumba)
  // mula escura de ferraduras de prata; no lugar da cabeça, uma coluna de fogo; freio e rédeas de ferro flutuando; cascos deixam brasa.
  // Asc III: o fogo fica branco-azulado e as pegadas continuam queimando.
  C3['boi-bumba'] = function(T, _k, o){
    var B = kit(T), root = new T.Group(), asc = ascOf(o);
    var F1 = asc >= 3 ? 0x9FD8FF : 0xFF6A12, F2 = asc >= 3 ? 0xE8F6FF : 0xFFC23A, FE1 = asc >= 3 ? 0x3A9AFF : 0xFF4A00, FE2 = asc >= 3 ? 0xBFE6FF : 0xFFA020;
    var cB1 = B.col(0x5E4656), cB2 = B.col(0x8A7080), cB0 = B.col(0x3A2C3A);
    var mBody = B.mat(0xffffff, { vc: 1, r: 0.55, corpo: 1 });
    var mDk = B.mat(0x1C1620, { r: 0.6 }), mSil = B.mat(0xD8DEE8, { r: 0.25, m: 0.9 }), mIron = B.mat(0x4A4650, { r: 0.35, m: 0.85 });
    var mBl = B.mat(0x6A1A22, { r: 0.7 }), mF1 = B.mat(F1, { r: 0.3, e: FE1, ei: 1.6, op: 0.85 }), mF2 = B.mat(F2, { r: 0.3, e: FE2, ei: 2.2 });
    var mF0 = B.mat(F1, { e: FE1, ei: 1.0, op: 0.14 }), mPr = B.mat(F1, { e: FE1, ei: asc >= 3 ? 2.2 : 1.2, op: 0.8 });
    var mEmb = B.mat(F2, { e: FE2, ei: 2 });
    var piv = B.grp(root, [0, 0, -0.32]);           // pivô nas patas de trás (empinar)
    var bod = B.grp(piv, [0, 0, 0.32]);
    var bodyG = B.paint(B.sph(3), function(x, y, z, c){ c.copy(cB1).lerp(cB2, sm((-y - 0.2) / 0.6) * 0.8).lerp(cB0, sm((y - 0.5) / 0.4) * 0.6); });
    var body = B.add(bod, bodyG, mBody, [0, 0.8, -0.02], [0.27, 0.29, 0.5]);
    B.add(bod, B.sph(2), mBody, [0, 0.82, 0.3], [0.25, 0.27, 0.22]);  // peito
    B.add(bod, B.sph(2), mBody, [0, 0.83, -0.34], [0.26, 0.26, 0.22]); // anca
    // manta de sela com tachas de prata
    var studs = [[B.rbox(0.62, 0.05, 0.42, 0.02), [0, 0, 0], 1, null, 0x6A1A22]];
    for (var i = 0; i < 6; i++) studs.push([B.sph(0), [(i % 2 ? 1 : -1) * 0.295, -0.08, -0.14 + Math.floor(i / 2) * 0.14], 0.018, null, 0xD8DEE8]);
    B.add(bod, B.merge(studs), B.mat(0xffffff, { vc: 1, r: 0.6, m: 0.2 }), [0, 1.06, -0.04], 1, [0, 0, 0]).scale.set(1, 1, 1);
    // patas com ferraduras de prata
    var legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(function(q){
      var g = B.grp(bod, [q[0] * 0.15, 0.7, q[1] * 0.34]);
      B.add(g, B.cap(0.088, 0.22, 10), mBody, [0, -0.12, 0]);
      var low = B.grp(g, [0, -0.32, 0]);
      B.add(low, B.cap(0.06, 0.22, 8), mBody, [0, -0.12, 0]);
      B.add(low, B.cyl(0.055, 0.07, 10), mDk, [0, -0.33, 0.01], [1, 0.08, 1]);
      B.add(low, B.tor(0.055, 0.014, PI * 1.6, 12, 5), mSil, [0, -0.365, 0.01], 1, [PI / 2, 0, PI * 0.7]);
      return { g: g, low: low, f: q[1] > 0 };
    });
    // pescoço até o toco, e a coluna de fogo
    var neck = B.grp(bod, [0, 0.95, 0.38], [0.55, 0, 0]);
    B.add(neck, B.cap(0.13, 0.26, 12), mBody, [0, 0.18, 0]);
    B.add(neck, B.tor(0.125, 0.03, 0, 18, 6), mIron, [0, 0.36, 0], 1, [PI / 2, 0, 0]);
    var mane = [];
    for (var j = 0; j < 5; j++) mane.push([B.cone(5), [0, 0.06 + j * 0.065, -0.12], [0.035, 0.1, 0.03], [-0.5, 0, 0], j > 2 ? 0x8A2A10 : 0x1C1620]);
    B.add(neck, B.merge(mane), B.mat(0xffffff, { vc: 1, r: 0.7 }), [0, 0, 0]);
    var fire = B.grp(neck, [0, 0.38, 0], [-0.45, 0, 0]);
    var flG = B.lathe([[0.001, 0], [0.55, 0.08], [0.85, 0.25], [0.8, 0.45], [0.55, 0.65], [0.3, 0.82], [0.12, 0.93], [0.001, 1]], 16);
    var fl = [
      B.add(fire, flG, mF1, [0, -0.02, 0], [0.19, 0.72, 0.19]),
      B.add(fire, flG, mF2, [0, 0.0, 0.02], [0.11, 0.5, 0.11]),
      B.add(fire, flG, mF1, [0.08, 0.04, -0.04], [0.08, 0.42, 0.08], [0, 0, -0.35]),
      B.add(fire, flG, mF1, [-0.08, 0.03, 0.0], [0.07, 0.36, 0.07], [0, 0, 0.4])
    ];
    var fglow = B.add(fire, B.sph(1), mF0, [0, 0.25, 0], [0.22, 0.36, 0.22]);
    var embers = [0, 1, 2].map(function(k){ return B.add(fire, B.oct(), mEmb, [0, 0, 0], 0.02); });
    // freio e rédeas de ferro, flutuando onde estaria a boca
    var bit = B.grp(bod, [0, 1.42, 0.72]);
    B.add(bit, B.merge([[B.cyl(1, 1, 6), [0, 0, 0], [0.012, 0.22, 0.012], [0, 0, PI / 2]], [B.tor(0.04, 0.009, 0, 12, 4), [0.11, 0, 0], 1, [0, PI / 2, 0]], [B.tor(0.04, 0.009, 0, 12, 4), [-0.11, 0, 0], 1, [0, PI / 2, 0]]]), mIron, [0, 0, 0]);
    var reins = [-1, 1].map(function(s){ return B.add(bod, B.tube([[s * 0.11, 1.42, 0.72], [s * 0.2, 1.25, 0.55], [s * 0.24, 1.1, 0.25], [s * 0.2, 1.1, 0.05]], 0.012, 0.012, 14, 5), mIron, [0, 0, 0]); });
    // rabo com ponta em brasa
    var tail = B.grp(bod, [0, 0.95, -0.52], [0.5, 0, 0]);
    B.add(tail, B.tube([[0, 0, 0], [0, -0.1, -0.08], [0, -0.3, -0.1], [0, -0.48, -0.06]], 0.045, 0.03, 12, 6), mDk, [0, 0, 0]);
    B.add(tail, B.cone(8), mEmb, [0, -0.54, -0.06], [0.045, 0.14, 0.045], [PI, 0, 0]);
    // pegadas em brasa atrás dela
    var nPr = asc >= 3 ? 8 : 4, prints = [];
    for (var k2 = 0; k2 < nPr; k2++){ prints.push(B.add(root, B.tor(0.055, 0.016, PI * 1.6, 12, 4), mPr, [(k2 % 2 ? 1 : -1) * 0.15, 0.006, -0.62 - k2 * 0.2], [1, 1, 1.3], [PI / 2, 0, PI * 0.7])); }
    B.done(root);
    var e1 = mF1.emissiveIntensity, e2 = mF2.emissiveIntensity;
    return { obj: root, anim: function(st, t, p){
      st = norm(st); t = t || 0; p = p || 0; B.reset();
      var br = sin(t * 1.8), fk = 0.5 + 0.5 * sin(t * 11) * sin(t * 6.7), fs = 1;
      body.scale.y *= 1 + 0.02 * br; bod.position.y += 0.008 * br;
      tail.rotation.z += 0.35 * sin(t * 1.6); tail.rotation.x += 0.1 * sin(t * 2.3);
      neck.rotation.x += 0.04 * sin(t * 1.1);
      bit.position.y += 0.03 * sin(t * 1.9); bit.rotation.z += 0.1 * sin(t * 1.3);
      // pata da frente cavando o chão a cada 3 s
      var pq = fr(t / 3) * 3, paw = pq < 0.8 ? sin(pq / 0.8 * PI) : 0;
      legs[1].g.rotation.x -= 0.5 * paw; legs[1].low.rotation.x += 0.9 * paw;
      if (st === 'atk'){
        var a = ph(p), rear = a.w;
        piv.rotation.x = -0.75 * rear + 0.12 * a.s;
        legs.forEach(function(L, i){
          if (L.f){ L.g.rotation.x = -1.1 * rear + (i % 2 ? -1 : 1) * 0.5 * sin(p * 40) * rear - 0.9 * a.s; L.low.rotation.x = 0.9 * rear - 0.2 * a.s; }
          else L.g.rotation.x = 0.75 * rear - 0.12 * a.s;
        });
        bod.position.z += 0.25 * a.s; fs = 1 + 0.25 * a.w + 0.45 * a.s;
        tail.rotation.x += 0.6 * rear;
      } else if (st === 'hit'){
        var h = hitc(p);
        piv.rotation.x = 0.12 * h; bod.position.z -= 0.12 * h; fs = 1 - 0.4 * h; neck.rotation.x -= 0.25 * h;
      } else if (st === 'sono'){
        // deitada: patas dobradas, o fogo vira brasa baixa
        bod.position.y -= 0.36; legs.forEach(function(L){ L.g.rotation.x = L.f ? -1.4 : 1.4; L.low.rotation.x = L.f ? 2.4 : -2.4; });
        neck.rotation.x += 0.5; fs = 0.35 + 0.05 * br; tail.rotation.x = 1.3;
      } else if (st === 'entra'){
        var e = sm(p / 0.5), land = p > 0.4 && p < 0.75 ? sin((p - 0.4) / 0.35 * PI) : 0;
        piv.rotation.x = -0.8 * sin(cl(p / 0.8) * PI); fs = 0.2 + 0.8 * e + 0.8 * land;
        legs.forEach(function(L){ if (L.f) L.g.rotation.x = -1.0 * sin(cl(p / 0.8) * PI); });
      }
      fire.scale.set(fs * (0.92 + 0.12 * fk), fs * (0.9 + 0.2 * fk), fs * (0.92 + 0.12 * fk));
      fl[0].rotation.y = t * 2; fl[2].rotation.z = -0.35 + 0.2 * sin(t * 7); fl[3].rotation.z = 0.4 + 0.2 * sin(t * 8.3);
      mF1.emissiveIntensity = e1 * (0.8 + 0.4 * fk); mF2.emissiveIntensity = e2 * (0.85 + 0.3 * fk);
      fglow.scale.set(0.22 * (0.9 + 0.2 * fk), 0.36, 0.22 * (0.9 + 0.2 * fk));
      embers.forEach(function(m, i){ var q = fr(t * 0.8 + i / 3); m.position.set(0.08 * sin(t * 3 + i * 2), 0.3 + q * 0.6, 0.06 * cos(t * 2 + i)); m.scale.setScalar(0.022 * (1 - q) + 0.001); });
      prints.forEach(function(m, i){ var q = asc >= 3 ? 1 : 1 - i / prints.length; m.scale.set(q, q, 1.3 * q); });
      mPr.opacity = asc >= 3 ? 0.7 + 0.2 * fk : 0.55 + 0.25 * fk;
    } };
  };

  // =================================================================== CURUPIRA (macieira-ancia)
  // guardião magro da mata: cabelo vermelho de folhas em brasa, pele verde com placas de casca, PÉS VIRADOS PARA TRÁS,
  // máscara de folha nos olhos, capa de musgo, cajado entalhado. Ataque: cajado no chão que estoura raízes.
  // Asc III: o cabelo vira fogo de verdade e aparecem pegadas brilhantes apontando ao contrário.
  C3['macieira-ancia'] = function(T, _k, o){
    var B = kit(T), root = new T.Group(), asc = ascOf(o);
    var cG = B.col(0x4F7D3A), cGd = B.col(0x3A6230), cBk = B.col(0x5A3E26), cBk2 = B.col(0x6E5034);
    function barkSkin(x, y, z, c){ var k = sm((-y - 0.35 + 0.18 * sin(x * 23) * sin(z * 19)) / 0.08), g = sin(Math.atan2(x, z) * 14 + y * 3); c.copy(cG).lerp(cGd, sm(-y) * 0.6); if (k > 0) c.lerp(g > 0.6 ? cBk2 : cBk, k); }
    var mSkV = B.mat(0xffffff, { vc: 1, r: 0.7, corpo: 1 }), mSk = B.mat(0x4F7D3A, { r: 0.65 });
    var mBk = B.mat(0x5A3E26, { r: 0.85 }), mWd = B.mat(0x6B4426, { r: 0.75 }), mWdD = B.mat(0x3E2616, { r: 0.8 });
    var mMoss = B.mat(0x3E5C26, { r: 0.95, ds: 1 }), mMask = B.mat(0x24561F, { r: 0.55 }), mVein = B.mat(0x9BC870, { r: 0.6 });
    var mIris = B.mat(0xE8B428, { r: 0.3, e: 0xC07A10, ei: 0.5 }), mMo = B.mat(0x2A1414, { r: 0.6 });
    var mHair = B.mat(0xffffff, { vc: 1, r: 0.55, e: 0xC0280A, ei: asc >= 3 ? 1.2 : 0.35 });
    var mFire = B.mat(0xFFB040, { e: 0xFF5A10, ei: 2, op: 0.8 }), mLeaf = B.mat(0x4C7A2C, { r: 0.6, ds: 1 }), mLeafD = B.mat(0x2F5A22, { r: 0.6, ds: 1 });
    var bod = B.grp(root);
    // pernas finas e pés virados para trás (dedos para -Z)
    var legs = [-1, 1].map(function(s){
      var g = B.grp(bod, [s * 0.075, 0.48, 0]);
      B.add(g, B.cap(0.042, 0.2, 8), mSk, [0, -0.13, 0]);
      var kn = B.grp(g, [0, -0.25, 0]);
      B.add(kn, B.cap(0.038, 0.17, 8), mSk, [0, -0.1, 0]);
      var ft = B.grp(kn, [0, -0.215, 0]);
      B.add(ft, B.merge([[B.sph(1), [0, 0, -0.06], [0.055, 0.032, 0.105]], [B.sph(0), [-0.025, -0.002, -0.155], 0.022], [B.sph(0), [0, 0, -0.16], 0.023], [B.sph(0), [0.025, -0.002, -0.155], 0.022], [B.sph(0), [0, 0.01, 0.02], [0.04, 0.03, 0.035]]]), mSk, [0, -0.01, 0]);
      return { g: g, kn: kn };
    });
    var up = B.grp(bod, [0, 0.48, 0]);
    // saiote de folhas
    var sk = [];
    for (var i = 0; i < 10; i++){ var a = i / 10 * PI * 2; sk.push([B.leaf(), [sin(a) * 0.1, 0.06, cos(a) * 0.08], [0.11, 0.17, 0.11], [PI + 0.35 * cos(a), a, 0], i % 2 ? 0x4C7A2C : 0x6A8A34]); }
    B.add(up, B.merge(sk), B.mat(0xffffff, { vc: 1, r: 0.65, ds: 1 }), [0, 0, 0]);
    var torso = B.add(up, B.paint(B.sph(2), barkSkin), mSkV, [0, 0.17, 0], [0.13, 0.19, 0.1]);
    // capa de musgo nas costas
    var capeG = new T.CylinderGeometry(0.17, 0.3, 0.62, 14, 1, true, PI * 0.55, PI * 0.9);
    var cape = B.grp(up, [0, 0.36, -0.01]);
    B.add(cape, capeG, mMoss, [0, -0.3, 0]);
    // braços (R segura o cajado)
    var arms = [-1, 1].map(function(s){
      var g = B.grp(up, [s * 0.125, 0.31, 0], [0, 0, s * 0.18]);
      B.add(g, B.cap(0.036, 0.22, 8), mSk, [0, -0.14, 0]);
      var h = B.grp(g, [0, -0.29, 0]); B.add(h, B.sph(1), mSk, [0, 0, 0], 0.045);
      return { g: g, h: h, s: s };
    });
    var armR = arms[1];
    // cajado entalhado
    var staff = B.grp(armR.h, [0, 0, 0.0]);
    var stp = [[B.cyl(0.022, 0.03, 8), [0, 0.06, 0], [1, 1.05, 1]]];
    for (var r = 0; r < 5; r++) stp.push([B.tor(0.028, 0.008, 0, 10, 4), [0, -0.3 + r * 0.1, 0], 1, [PI / 2, 0, r * 0.3]]);
    stp.push([B.sph(1), [0, 0.6, 0], [0.055, 0.07, 0.055]], [B.cone(6), [0.03, 0.66, 0], [0.025, 0.1, 0.025], [0, 0, -0.5]], [B.cone(6), [-0.03, 0.66, 0.01], [0.022, 0.09, 0.022], [0, 0, 0.6]]);
    B.add(staff, B.merge(stp), mWd, [0, 0, 0]);
    B.add(staff, B.leaf(), mLeaf, [0, 0.6, 0.04], 0.12, [0.3, 0, -0.6]);
    // cabeça
    var hd = B.grp(up, [0, 0.62, 0.01]);
    B.add(hd, B.paint(B.sph(3), barkSkin), mSkV, [0, 0, 0], [0.23, 0.225, 0.22]);
    [-1, 1].forEach(function(s){ B.add(hd, B.cone(8), mSk, [s * 0.24, 0.03, -0.02], [0.04, 0.12, 0.03], [0, 0, -s * 1.15]); });
    B.add(hd, B.sph(1), mSk, [0, -0.03, 0.22], [0.032, 0.03, 0.03]);
    var mouth = B.add(hd, B.cap(0.01, 0.06, 6), mMo, [0, -0.1, 0.2], 1, [0, 0, PI / 2]);
    // máscara de folha cobrindo os olhos
    B.add(hd, B.merge([[B.leaf(), [-0.01, 0.03, 0.2], [0.48, 0.3, 0.12], [0, 0.0, -PI / 2 - 0.08]], [B.leaf(), [0.01, 0.03, 0.2], [0.48, 0.3, 0.12], [0, 0, PI / 2 + 0.08]]]), mMask, [0, 0, 0]);
    B.add(hd, B.merge([[B.cyl(1, 1, 4), [0.08, 0.03, 0.228], [0.004, 0.15, 0.004], [0, 0, PI / 2]], [B.cyl(1, 1, 4), [-0.08, 0.03, 0.228], [0.004, 0.15, 0.004], [0, 0, PI / 2]]]), mVein, [0, 0, 0]);
    var eyes = [-1, 1].map(function(s){ return B.eyeOn(hd, [0, 0, 0.02], [0.23, 0.225, 0.22], s * 0.085, 0.03, 0.05, { iris: mIris, lid: mMask }); });
    // cabelo de folhas vermelhas em brasa
    var hl = [];
    [[0, 0.17, 0.05, -0.3, 0, 0.3], [0.1, 0.16, 0.02, -0.4, -0.5, 0.27], [-0.1, 0.16, 0.02, -0.4, 0.5, 0.27], [0.17, 0.1, -0.05, -0.2, -1.0, 0.24], [-0.17, 0.1, -0.05, -0.2, 1.0, 0.24],
     [0.05, 0.15, -0.12, -1.0, -0.2, 0.3], [-0.06, 0.14, -0.13, -1.0, 0.3, 0.3], [0, 0.08, -0.18, -1.5, 0, 0.27], [0.13, 0.04, -0.15, -1.4, -0.6, 0.22], [-0.13, 0.04, -0.15, -1.4, 0.6, 0.22]]
      .forEach(function(q, i){ hl.push([B.leaf(), [q[0], q[1], q[2]], [q[5] * 0.85, q[5], q[5] * 0.9], [q[3], 0, q[4]], [0xD8321E, 0xF0602A, 0xB8200E, 0xF2902E][i % 4]]); });
    hl.push([B.sph(1), [0, 0.07, -0.03], [0.22, 0.17, 0.21], null, 0xA8200E]);
    var hair = B.grp(hd, [0, 0, 0]);
    B.add(hair, B.merge(hl), mHair, [0, 0, 0]);
    var flames = [];
    if (asc >= 3){
      var flG = B.lathe([[0.001, 0], [0.55, 0.1], [0.8, 0.3], [0.6, 0.6], [0.25, 0.85], [0.001, 1]], 12);
      [[0, 0.2, -0.02, 0.13, 0.36], [0.11, 0.17, -0.06, 0.09, 0.26], [-0.11, 0.17, -0.06, 0.09, 0.26]].forEach(function(q){ flames.push(B.add(hair, flG, mFire, [q[0], q[1], q[2]], [q[3], q[4], q[3]], [-0.3, 0, -q[0] * 3])); });
    }
    // raízes que estouram do chão no golpe
    var roots = [0, 1, 2].map(function(k){
      var g = B.grp(root, [(k - 1) * 0.16, 0, 0.5 + (k % 2) * 0.1], [0, (k - 1) * 0.5, 0]);
      B.add(g, B.tube([[0, -0.05, 0], [0.02, 0.12, 0.03], [-0.03, 0.25, 0.08], [0.02, 0.36, 0.14]], 0.05, 0.008, 10, 6), mBk, [0, 0, 0]);
      return g;
    });
    // Asc III: pegadas brilhantes apontando ao contrário
    if (asc >= 3){
      var mFp = B.mat(0xB8F070, { e: 0x7AD030, ei: 1.4, op: 0.75 });
      var fp = [];
      for (var q2 = 0; q2 < 4; q2++){ var x0 = (q2 % 2 ? 1 : -1) * 0.1, z0 = 0.45 + q2 * 0.24;
        fp.push([B.circ(10), [x0, 0.006, z0], [0.045, 1, 0.08]], [B.circ(6), [x0 - 0.025, 0.006, z0 - 0.1], 0.018], [B.circ(6), [x0, 0.006, z0 - 0.11], 0.019], [B.circ(6), [x0 + 0.025, 0.006, z0 - 0.1], 0.018]); }
      var prints = B.add(root, B.merge(fp), mFp, [0, 0, 0]); prints.castShadow = false;
    }
    B.done(root);
    var eh = mHair.emissiveIntensity;
    return { obj: root, anim: function(st, t, p){
      st = norm(st); t = t || 0; p = p || 0; B.reset();
      var bl = blink(t, 3.8, 0.9), mode = 'o', br = sin(t * 1.9), shift = sin(t * 0.8);
      bod.position.x += 0.02 * shift; up.rotation.z -= 0.04 * shift; hd.rotation.z += 0.05 * shift; hd.rotation.y += 0.35 * sin(t * 0.45);
      torso.scale.y *= 1 + 0.02 * br; cape.rotation.x -= 0.1 + 0.06 * sin(t * 1.3); cape.rotation.z += 0.04 * sin(t * 1.1);
      hair.scale.set(1 + 0.03 * sin(t * 6.1), 1 + 0.05 * sin(t * 7.3), 1); mHair.emissiveIntensity = eh * (0.8 + 0.3 * sin(t * 9) * sin(t * 4.1));
      armR.g.rotation.x -= 0.35; arms[0].g.rotation.z -= 0.15;
      var rs = 0;
      if (st === 'atk'){
        var a = ph(p);
        armR.g.rotation.x = -0.35 - 2.4 * a.w + 1.6 * a.s; armR.g.rotation.z = 0.18 - 0.5 * a.w;
        arms[0].g.rotation.x = -1.6 * a.w + 0.9 * a.s; arms[0].g.rotation.z = -0.18 + 0.5 * a.w;
        staff.rotation.x = 0.3 * a.w + 0.9 * a.s;
        up.rotation.x += -0.25 * a.w + 0.45 * a.s; bod.position.y -= 0.06 * a.s;
        legs.forEach(function(L, i){ L.g.rotation.x += (i ? -0.4 : 0.3) * a.s; L.kn.rotation.x += 0.4 * a.s; });
        rs = p > 0.36 ? sm((p - 0.36) / 0.1) * (1 - sm((p - 0.75) / 0.25)) : 0;
        mHair.emissiveIntensity = eh * (1 + 2 * a.s);
      } else if (st === 'hit'){
        var h = hitc(p);
        up.rotation.x -= 0.3 * h; bod.position.z -= 0.1 * h; mode = h > 0.2 ? 'h' : 'o'; hair.rotation.x -= 0.3 * h;
      } else if (st === 'sono'){
        up.rotation.x += 0.18; hd.rotation.x = 0.35; hd.rotation.y = 0; hd.rotation.z = 0.15; armR.g.rotation.x = -0.6; staff.rotation.x = 0.5;
        legs.forEach(function(L){ L.kn.rotation.x = 0.25; }); bod.position.y -= 0.02; mode = 's'; mHair.emissiveIntensity = eh * 0.4;
      } else if (st === 'entra'){
        var e = sm(p / 0.6);
        bod.scale.set(mix(0.6, 1, e), mix(0.1, 1, e), mix(0.6, 1, e)); rs = sin(cl(p / 0.7) * PI) * 0.8;
        roots.forEach(function(g, k){ g.position.set(sin(k * 2.1) * 0.3, 0, cos(k * 2.1) * 0.3); });
      }
      roots.forEach(function(g, k){ var q = cl(rs * 1.3 - k * 0.15) * 1.7; g.scale.set(q + 0.001, q + 0.001, q + 0.001); g.visible = q > 0.01; });
      flames.forEach(function(f, i){ f.scale.y *= 0.85 + 0.25 * sin(t * (9 + i * 2) + i); f.rotation.z += 0.15 * sin(t * 7 + i); });
      B.eyes(eyes, mode, bl * 0.75);
    } };
  };

  // =================================================================== CAIPORA (guardia-florada)
  // guardiã montada num caititu enorme: pele em tons de casca (um espírito, não uma etnia), cabelo de samambaia, olhos âmbar,
  // berrante de raiz na mão. Caititu com presas, colar claro e crina de cerdas. Ataque: investida do caititu + sopro do berrante.
  // Asc III: as samambaias florescem e as presas viram cristal.
  C3['guardia-florada'] = function(T, _k, o){
    var B = kit(T), root = new T.Group(), asc = ascOf(o);
    var cP = B.col(0x3E342E), cPd = B.col(0x262019), cPc = B.col(0xB8AE98);
    var mPig = B.mat(0xffffff, { vc: 1, r: 0.85, corpo: 1 }), mPigS = B.mat(0x3E342E, { r: 0.85 }), mHoof = B.mat(0x1A1612, { r: 0.5 });
    var mSn = B.mat(0x6A5A56, { r: 0.5 }), mTusk = asc >= 3 ? B.mat(0xBFF4FF, { r: 0.1, m: 0.1, e: 0x5ACFFF, ei: 0.9 }) : B.mat(0xF2EAD8, { r: 0.35 });
    var cS = B.col(0x7A5638), cSd = B.col(0x553A24), cSl = B.col(0x9A7048);
    var mSkV = B.mat(0xffffff, { vc: 1, r: 0.7 }), mSk = B.mat(0x7A5638, { r: 0.65 }), mSkD = B.mat(0x5E4028, { r: 0.7 });
    var mIris = B.mat(0xF0A020, { r: 0.3, e: 0xD07A10, ei: 0.7 }), mMo = B.mat(0x2A1414, { r: 0.6 });
    var mFern = B.mat(0xffffff, { vc: 1, r: 0.6, ds: 1 }), mWrap = B.mat(0x5E6E2A, { r: 0.85 });
    var mHorn = B.mat(0x6B4A2A, { r: 0.7 }), mRing = B.mat(0xCFF09A, { e: 0x8AD040, ei: 1, op: 0.6, ds: 1 });
    // ---------------- caititu
    var piv = B.grp(root, [0, 0, 0]);
    var pig = B.grp(piv);
    var bodyG = B.paint(B.sph(2), function(x, y, z, c){
      var collar = sm((0.14 - Math.abs(z - 0.42 + 0.25 * y)) / 0.06) * sm((y + 0.2) / 0.3);
      var bris = 0.5 + 0.5 * sin(x * 40 + z * 13) * sin(y * 37);
      c.copy(cP).lerp(cPd, sm((y - 0.3) / 0.6) * 0.7 + bris * 0.15).lerp(cPc, collar * 0.6);
    });
    var body = B.add(pig, bodyG, mPig, [0, 0.48, -0.02], [0.3, 0.3, 0.5]);
    // crina de cerdas no dorso
    var mn = [];
    for (var i = 0; i < 9; i++) mn.push([B.cone(5), [0, 0.28 + 0.02 * sin(i), -0.36 + i * 0.085], [0.04, 0.13 + 0.04 * sin(i * 1.7), 0.03], [-0.25, 0, 0], i % 2 ? 0x15110E : 0x2E2620]);
    B.add(pig, B.merge(mn), B.mat(0xffffff, { vc: 1, r: 0.9 }), [0, 0.48, 0]);
    // cabeça do caititu
    var ph2 = B.grp(pig, [0, 0.53, 0.38], [0.05, 0, 0]);
    B.add(ph2, B.sph(2), mPigS, [0, 0, 0.12], [0.18, 0.18, 0.25]);
    B.add(ph2, B.cyl(0.07, 0.11, 12), mPigS, [0, -0.02, 0.32], [1, 0.22, 1], [PI / 2, 0, 0]);
    var snout = B.add(ph2, B.cyl(1, 1, 14), mSn, [0, -0.02, 0.43], [0.075, 0.03, 0.06], [PI / 2, 0, 0]);
    B.add(ph2, B.merge([[B.sph(0), [0.025, -0.02, 0.447], [0.015, 0.02, 0.01]], [B.sph(0), [-0.025, -0.02, 0.447], [0.015, 0.02, 0.01]]]), mHoof, [0, 0, 0]);
    B.add(ph2, B.merge([[B.cone(8), [0.075, -0.05, 0.36], [0.03, 0.13, 0.03], [0.3, 0, -0.4]], [B.cone(8), [-0.075, -0.05, 0.36], [0.03, 0.13, 0.03], [0.3, 0, 0.4]]]), mTusk, [0, 0, 0]);
    var pears = B.add(ph2, B.merge([[B.cone(6), [0.12, 0.15, 0.0], [0.05, 0.1, 0.03], [0, 0, -0.5]], [B.cone(6), [-0.12, 0.15, 0.0], [0.05, 0.1, 0.03], [0, 0, 0.5]]]), mPigS, [0, 0, 0]);
    var peyes = [-1, 1].map(function(s){ return B.beady(ph2, s * 0.11, 0.07, 0.27, 0.028); });
    // patas curtas
    var plegs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(function(q){
      var g = B.grp(pig, [q[0] * 0.17, 0.3, q[1] * 0.27]);
      B.add(g, B.cap(0.06, 0.16, 8), mPigS, [0, -0.11, 0]);
      B.add(g, B.cyl(0.04, 0.05, 8), mHoof, [0, -0.27, 0.01], [1, 0.07, 1]);
      return g;
    });
    var ptail = B.add(pig, B.cone(5), mPigS, [0, 0.55, -0.5], [0.03, 0.08, 0.03], [-1.2, 0, 0]);
    // ---------------- a Caipora (espírito da mata, cor de casca)
    var rid = B.grp(pig, [0, 0.76, -0.06]);
    var trG = B.paint(B.sph(2), function(x, y, z, c){ var g = sin(Math.atan2(x, z) * 10 + y * 4); c.copy(cS).lerp(cSd, g > 0.7 ? 0.8 : 0).lerp(cSl, sm((z - 0.6) / 0.4) * 0.4); });
    var torso = B.add(rid, trG, mSkV, [0, 0.17, 0], [0.13, 0.17, 0.11]);
    torso.material.userData.corpo = true; mPig.userData.corpo = false;
    B.add(rid, B.cyl(0.135, 0.15, 12), mWrap, [0, 0.04, 0], [1, 0.09, 0.85]);
    var rlegs = [-1, 1].map(function(s){ var g = B.grp(rid, [s * 0.09, 0.04, 0.02], [0.3, 0, s * 1.0]); B.add(g, B.cap(0.042, 0.16, 8), mSk, [0, -0.11, 0]); var k = B.grp(g, [0, -0.21, 0], [0, 0, -s * 0.9]); B.add(k, B.cap(0.036, 0.13, 8), mSk, [0, -0.08, 0]); return g; });
    var rarms = [-1, 1].map(function(s){
      var g = B.grp(rid, [s * 0.12, 0.27, 0], [0, 0, s * 0.25]);
      B.add(g, B.cap(0.036, 0.15, 8), mSk, [0, -0.1, 0]);
      var h = B.grp(g, [0, -0.2, 0]); B.add(h, B.sph(1), mSk, [0, 0, 0], 0.042);
      return { g: g, h: h, s: s };
    });
    // berrante de raiz na mão direita
    var horn = B.grp(rarms[1].h, [0, 0, 0.02], [0.2, 0, 0]);
    B.add(horn, B.tube([[0, -0.05, -0.03], [0, 0.07, 0.05], [0.03, 0.18, 0.1], [0.09, 0.27, 0.07], [0.15, 0.31, -0.02]], 0.016, 0.07, 14, 8), mHorn, [0, 0, 0]);
    var ring = B.add(rid, B.tor(0.14, 0.02, 0, 22, 5), mRing, [0, 0.55, 0.4]);
    // cabeça
    var hd = B.grp(rid, [0, 0.52, 0.02]);
    B.add(hd, B.paint(B.sph(3), function(x, y, z, c){ c.copy(cS).lerp(cSl, sm((z - 0.5) / 0.5) * 0.35).lerp(cSd, sm((-y - 0.5) / 0.4) * 0.4); }), mSkV, [0, 0, 0], [0.21, 0.2, 0.2]);
    [-1, 1].forEach(function(s){ B.add(hd, B.cone(6), mSk, [s * 0.21, 0.02, -0.02], [0.035, 0.09, 0.025], [0, 0, -s * 1.2]); });
    B.add(hd, B.sph(1), mSkD, [0, -0.03, 0.2], [0.026, 0.024, 0.022]);
    var mouth = B.add(hd, B.tor(0.04, 0.008, PI, 10, 4), mMo, [0, -0.085, 0.185], [1, 0.7, 1], [0.2, 0, PI]);
    var eyes = [-1, 1].map(function(s){ return B.eyeOn(hd, [0, 0, 0], [0.21, 0.2, 0.2], s * 0.08, 0.03, 0.055, { iris: mIris, lid: mSkD }); });
    // cabelo de samambaia (frondes com folíolos)
    var fern = [], flw = [], cF1 = 0x3F8A2E, cF2 = 0x2C6A24, cF3 = 0x6AAA3A;
    var fr2 = [[0, 0.16, 0.02, -0.25, 0, 0.42], [0.1, 0.14, -0.02, -0.4, -0.6, 0.38], [-0.1, 0.14, -0.02, -0.4, 0.6, 0.38], [0.16, 0.06, -0.08, -0.7, -1.1, 0.34], [-0.16, 0.06, -0.08, -0.7, 1.1, 0.34], [0.05, 0.1, -0.15, -1.2, -0.3, 0.4], [-0.05, 0.1, -0.15, -1.2, 0.3, 0.4], [0.17, 0.0, 0.06, -0.2, -1.4, 0.3], [-0.17, 0.0, 0.06, -0.2, 1.4, 0.3]];
    fr2.forEach(function(q, j){
      var L = q[5], m = B.mtx([q[0], q[1], q[2]], 1, [q[3], 0, q[4]]);
      fern.push([B.cyl(1, 1, 4), [q[0], q[1], q[2]], [0.006, 0.001, 0.006], null, cF2]);
      for (var k = 0; k < 6; k++){
        var yy = (k + 0.5) / 6 * L, w = 0.075 * (1 - k / 7.5);
        [-1, 1].forEach(function(s){
          var v = new T.Vector3(s * w * 0.6, yy, 0).applyMatrix4(m);
          fern.push([B.cone(4), [v.x, v.y, v.z], [w * 0.6, w * 1.7, w * 0.15], [q[3] + 0.1, 0, q[4] - s * 1.15], k % 2 ? cF1 : cF3]);
        });
        if (asc >= 3 && k % 2 === 1){ var vf = new T.Vector3(0, yy, 0.01).applyMatrix4(m); flw.push([B.ico(0), [vf.x, vf.y, vf.z], 0.026, null, (j + k) % 2 ? 0xF7A8D0 : 0xFFF2F8]); }
      }
      var vt = new T.Vector3(0, L * 0.5, 0).applyMatrix4(m);
      fern.push([B.cyl(1, 1, 4), [vt.x, vt.y, vt.z], [0.008, L, 0.008], [q[3], 0, q[4]], cF2]);
    });
    fern.push([B.sph(1), [0, 0.06, -0.02], [0.2, 0.15, 0.19], null, 0x2C5A20]);
    var hair = B.grp(hd);
    B.add(hair, B.merge(fern), mFern, [0, 0, 0]);
    if (flw.length) B.add(hair, B.merge(flw), B.mat(0xffffff, { vc: 1, r: 0.5, e: 0xFF9AC8, ei: 0.25 }), [0, 0, 0]);
    B.done(root);
    return { obj: root, anim: function(st, t, p){
      st = norm(st); t = t || 0; p = p || 0; B.reset();
      var bl = blink(t, 3.4, 0.2), mode = 'o', br = sin(t * 1.7), sniff = sin(t * 7) * Math.max(0, sin(t * 0.9));
      body.scale.y *= 1 + 0.02 * br; ph2.rotation.x += 0.06 * sniff + 0.05 * sin(t * 0.7); snout.scale.y *= 1 + 0.3 * Math.max(0, sniff);
      pears.rotation.z += 0.05 * sin(t * 5); ptail.rotation.z += 0.4 * sin(t * 9);
      rid.position.y += 0.008 * br; hd.rotation.y += 0.35 * sin(t * 0.5); hd.rotation.z += 0.05 * sin(t * 0.8);
      hair.rotation.z += 0.04 * sin(t * 1.4); hair.rotation.x += 0.03 * sin(t * 1.1);
      rarms[0].g.rotation.x -= 0.9; rarms[1].g.rotation.x -= 0.4;
      var rq = -1;
      if (st === 'atk'){
        var a = ph(p);
        piv.position.z += -0.12 * a.w + 0.4 * a.s; pig.rotation.x = 0.06 * a.w + 0.12 * a.s; ph2.rotation.x += 0.35 * a.s - 0.1 * a.w;
        plegs.forEach(function(g, i){ g.rotation.x = sin(p * 30 + i * 1.6) * 0.6 * (a.w + a.s); });
        rarms[1].g.rotation.set(-1.9 * (a.w + a.s) - 0.4 * (1 - a.w - a.s), 0, 0.5 * (a.w + a.s) + 0.25);
        horn.rotation.x = 0.2 - 0.6 * (a.w + a.s);
        rid.rotation.x = -0.15 * a.w + 0.1 * a.s; hd.rotation.y *= 0.2; hd.rotation.x -= 0.15 * a.s;
        rq = p > 0.38 ? (p - 0.38) / 0.45 : -1;
      } else if (st === 'hit'){
        var h = hitc(p);
        piv.position.z -= 0.12 * h; pig.rotation.x = -0.1 * h; rid.rotation.x = -0.25 * h; mode = h > 0.2 ? 'h' : 'o';
      } else if (st === 'sono'){
        pig.position.y = -0.17; plegs.forEach(function(g, i){ g.rotation.x = i < 2 ? -1.3 : 1.3; }); ph2.rotation.x = 0.45;
        rid.rotation.x = 0.55; hd.rotation.x = 0.4; hd.rotation.y = 0; rarms[0].g.rotation.x = -0.6; rarms[1].g.rotation.x = -0.5; mode = 's';
      } else if (st === 'entra'){
        var j = sin(cl(p) * PI);
        piv.position.y += 0.35 * j; pig.rotation.x = -0.3 * j + 0.1 * (p > 0.6 ? sin((p - 0.6) / 0.4 * PI) : 0);
        plegs.forEach(function(g, i){ g.rotation.x = (i < 2 ? -0.7 : 0.7) * j; });
        rarms[1].g.rotation.x = -2.2 * j; mouth.scale.y *= 1 + 2 * j;
      }
      ring.visible = rq >= 0 && rq < 1;
      if (ring.visible){ ring.scale.setScalar(0.4 + 2.2 * rq); ring.position.z = 0.4 + 1.0 * rq; mRing.opacity = 0.7 * (1 - rq); }
      B.eyes(eyes, mode, bl * 0.8); B.eyes(peyes, mode === 'h' ? 'h' : mode, blink(t, 4.2, 1.7));
    } };
  };

  // =================================================================== CORTIÇO DE JATAÍ (colmeia-dourada)
  // tronco oco deitado sobre um toco, tubinho de cera na entrada, mel pingando, 3 abelhinhas jataí orbitando.
  // Asc III: o tronco ganha sóis de cordel entalhados e o mel brilha.
  C3['colmeia-dourada'] = function(T, _k, o){
    var B = kit(T), root = new T.Group(), asc = ascOf(o);
    var cBk = B.col(0x5C4029), cBkD = B.col(0x3A2818), cWd = B.col(0xC9A06A), cWdD = B.col(0x9A7244), cMoss = B.col(0x55782E);
    var mLog = B.mat(0xffffff, { vc: 1, r: 0.85, corpo: 1 });
    var mWax = B.mat(0xE8B04A, { r: 0.35, e: 0xB8781A, ei: asc >= 3 ? 0.7 : 0.25 });
    var mHon = B.mat(0xF5A623, { r: 0.15, e: 0xE08A10, ei: asc >= 3 ? 1.3 : 0.45 });
    var mBee = B.mat(0xffffff, { vc: 1, r: 0.45 }), mWing = B.mat(0xEAF4FF, { r: 0.2, op: 0.55, ds: 1 }), mLeaf = B.mat(0x4C7A2C, { r: 0.6, ds: 1 });
    function bark(x, y, z, c){ var g = sin(Math.atan2(x, z) * 16 + y * 2.5); c.copy(cBk).lerp(cBkD, g > 0.5 ? 0.85 : 0); }
    var base = B.grp(root);
    // toco com raízes
    var stumpG = B.paint(B.cyl(0.26, 0.31, 18), function(x, y, z, c, nx, ny){
      if (ny > 0.9){ var r = Math.sqrt(x * x + z * z); c.copy(cWd).lerp(cWdD, 0.5 + 0.5 * sin(r * 70)); } else bark(x, y, z, c); });
    B.add(base, stumpG, mLog, [0, 0.17, 0], [1, 0.34, 1]);
    var rts = [];
    for (var i = 0; i < 5; i++){ var a = i / 5 * PI * 2 + 0.3; rts.push([B.sph(1), [sin(a) * 0.3, 0.035, cos(a) * 0.3], [0.06, 0.045, 0.15], [0, a, 0], 0x4A3220]); }
    B.add(base, B.merge(rts), B.mat(0xffffff, { vc: 1, r: 0.85 }), [0, 0, 0]);
    // tronco oco deitado
    var lg = B.grp(base, [0, 0.55, 0], [0, 0.12, 0.05]);
    var logG = B.paint(B.cyl(1, 1, 20), function(x, y, z, c, nx, ny){
      if (Math.abs(ny) > 0.9){ var r = Math.sqrt(x * x + z * z); c.copy(cWd).lerp(cWdD, 0.5 + 0.5 * sin(r * 22)); if (r < 0.35) c.copy(cBkD); }
      else { bark(x, y, z, c); if (x < -0.6 && Math.abs(y) < 0.3) c.lerp(cMoss, 0.8); } });
    var log = B.add(lg, logG, mLog, [0, 0, 0], [0.22, 0.86, 0.22], [0, 0, PI / 2]);
    // musgo e um brotinho em cima
    B.add(lg, B.leaf(), mLeaf, [0.18, 0.2, 0.02], 0.12, [0, 0, -0.5]);
    B.add(lg, B.leaf(), mLeaf, [0.2, 0.2, -0.02], 0.09, [0, 0.6, 0.5]);
    // tubinho de cera (a entrada da jataí)
    var tube = B.grp(lg, [0.04, 0.03, 0.2], [PI / 2 - 0.15, 0, 0]);
    B.add(tube, B.cyl(0.03, 0.04, 12, true), mWax, [0, 0.07, 0], [1, 0.15, 1]);
    B.add(tube, B.tor(0.032, 0.012, 0, 14, 6), mWax, [0, 0.145, 0], 1, [PI / 2, 0, 0]);
    // pingos de mel
    var drips = [[-0.22, 0.0], [0.15, 0.05], [0.3, -0.03]].map(function(q){
      var g = B.grp(lg, [q[0], -0.17, 0.12 + q[1]]);
      var d = B.add(g, B.sph(1), mHon, [0, -0.02, 0], [0.025, 0.04, 0.025]);
      return { g: g, d: d };
    });
    var pool = B.add(base, B.sph(1), mHon, [0.15, 0.35, 0.2], [0.09, 0.012, 0.07]);
    // abelhinhas
    var cY = B.col(0xF2B020), cK = B.col(0x2A1C10);
    var beeG = B.paint(B.sph(1), function(x, y, z, c){ c.copy(Math.floor((z + 1) * 2.2) % 2 ? cK : cY); });
    var bees = [0, 1, 2].map(function(k){
      var g = B.grp(root);
      B.add(g, beeG, mBee, [0, 0, 0], [0.032, 0.03, 0.045]);
      var w1 = B.add(g, B.sph(0), mWing, [0.03, 0.025, 0], [0.035, 0.006, 0.02], [0, 0, 0.4]);
      var w2 = B.add(g, B.sph(0), mWing, [-0.03, 0.025, 0], [0.035, 0.006, 0.02], [0, 0, -0.4]);
      return { g: g, w1: w1, w2: w2 };
    });
    // Asc III: sóis de cordel entalhados
    var suns = null;
    if (asc >= 3){
      var sp = [];
      [[-0.28, 0.08], [0.32, 0.06], [-0.05, -0.02]].forEach(function(q, i){ sp.push([B.star(0.07, 0.04, 0.012, 8), [q[0], q[1], 0.215], i === 2 ? 0.6 : 1, [0, 0, i * 0.2]], [B.sph(0), [q[0], q[1], 0.225], [0.03, 0.03, 0.01]]); });
      suns = B.add(lg, B.merge(sp), B.mat(0xF2C230, { r: 0.3, m: 0.6, e: 0xD09010, ei: 0.8 }), [0, 0, 0]);
    }
    B.done(root);
    var eh = mHon.emissiveIntensity;
    return { obj: root, anim: function(st, t, p){
      st = norm(st); t = t || 0; p = p || 0; B.reset();
      var spd = 1, out = 0, rest = 0, sq = 0;
      tube.scale.y *= 1 + 0.06 * sin(t * 3);
      mHon.emissiveIntensity = eh * (0.85 + 0.25 * sin(t * 2.3));
      if (st === 'atk'){ var a = ph(p); out = a.s + 0.4 * a.w; spd = 2.2; base.scale.set(1 + 0.04 * a.w, 1 - 0.05 * a.w + 0.06 * a.s, 1 + 0.04 * a.w); mHon.emissiveIntensity = eh * (1 + 2 * a.s); }
      else if (st === 'hit'){ var h = hitc(p); base.rotation.z = 0.08 * sin(p * 40) * h; base.position.z -= 0.05 * h; spd = 2; }
      else if (st === 'sono'){ rest = 1; spd = 0.25; mHon.emissiveIntensity = eh * 0.5; }
      else if (st === 'entra'){ var e = cl(p / 0.45); base.position.y += (1 - sm(e)) * 0.9; sq = p > 0.4 && p < 0.8 ? sin((p - 0.4) / 0.4 * PI) : 0; base.scale.set(1 + 0.12 * sq, 1 - 0.16 * sq, 1 + 0.12 * sq); }
      drips.forEach(function(D, i){ var q = fr(t * 0.35 * spd + i * 0.37); D.d.scale.set(0.025, 0.03 + 0.05 * sm(q / 0.7), 0.025); D.d.position.y = -0.02 - 0.05 * sm(q / 0.7) - (q > 0.85 ? (q - 0.85) * 1.6 : 0); D.d.visible = q < 0.97; });
      pool.scale.x *= 1 + 0.08 * sin(t * 1.3);
      bees.forEach(function(b, k){
        var a2 = t * 2.2 * spd + k * 2.1, r = 0.3 + 0.08 * sin(t * 1.7 + k);
        var x = cos(a2) * r, y = 0.62 + 0.12 * sin(t * 2.9 + k * 1.3), z = 0.32 + sin(a2) * r * 0.7;
        if (out){ z += out * (0.5 + 0.2 * k); y += out * 0.1; }
        if (rest){ x = 0.04 + (k - 1) * 0.06; y = 0.62 + 0.05 * k; z = 0.38; }
        b.g.position.set(x, y, z); b.g.rotation.y = rest ? 0 : -a2;
        var fl = rest ? 0.2 : sin(t * 70 + k);
        b.w1.rotation.z = 0.4 + 0.6 * fl; b.w2.rotation.z = -0.4 - 0.6 * fl;
      });
      if (suns) suns.rotation.z = 0;
    } };
  };

  // =================================================================== FOGUEIRA DO ARRAIAL (moinho-de-vento)
  // toras cruzadas num anel de pedras, dois mastros com cordão de bandeirinhas, faíscas subindo.
  // Asc III: as chamas passeiam pelas 4 cores dos reinos (Sertão, Mata, Águas, Noite) e o cordão ganha 4 lanterninhas.
  C3['moinho-de-vento'] = function(T, _k, o){
    var B = kit(T), root = new T.Group(), asc = ascOf(o);
    var cBk = B.col(0x5C3E26), cBkD = B.col(0x3A2616), cCh = B.col(0x1E1612), cWd = B.col(0xC9A06A);
    var mLog = B.mat(0xffffff, { vc: 1, r: 0.85, corpo: 1 });
    var mSt = B.mat(0xffffff, { vc: 1, r: 0.9 }), mPole = B.mat(0x6B4A2E, { r: 0.8 }), mStr = B.mat(0xE8DCC0, { r: 0.8 });
    var mBed = B.mat(0xFF7A20, { e: 0xFF4A00, ei: 1.4 });
    var mF1 = B.mat(0xFF5A0A, { r: 0.3, e: 0xFF3A00, ei: 1.3, op: 0.85 }), mF3 = asc >= 3 ? B.mat(0x9A5CFF, { r: 0.3, e: 0x6A2AE0, ei: 1.3, op: 0.85 }) : mF1, mF2 = B.mat(0xFFC23A, { r: 0.3, e: 0xFFA020, ei: 2.2 });
    var mSp = B.mat(0xFFD070, { e: 0xFFA030, ei: 2.2 }), mFlag = B.mat(0xffffff, { vc: 1, r: 0.7, ds: 1 });
    var fogo = B.grp(root);
    // anel de pedras
    var sts = [];
    for (var i = 0; i < 9; i++){ var a = i / 9 * PI * 2; sts.push([B.sph(1), [sin(a) * 0.3, 0.045, cos(a) * 0.3], [0.08, 0.055, 0.07], [0, a, 0.2 * sin(i * 3)], i % 2 ? 0x6E6A66 : 0x55524E]); }
    B.add(fogo, B.merge(sts), mSt, [0, 0, 0]);
    var bed = B.add(fogo, B.sph(1), mBed, [0, 0.03, 0], [0.24, 0.035, 0.24]);
    // toras em pirâmide
    var logG = B.paint(B.cyl(1, 1, 10), function(x, y, z, c, nx, ny){ if (Math.abs(ny) > 0.9) c.copy(cWd); else c.copy(cBk).lerp(cBkD, sin(Math.atan2(x, z) * 8) > 0.4 ? 0.8 : 0).lerp(cCh, sm((-y - 0.1) / 0.3)); });
    var logs = [];
    for (var j = 0; j < 5; j++){ var b2 = j / 5 * PI * 2 + 0.4; logs.push(B.add(fogo, logG, mLog, [sin(b2) * 0.12, 0.24, cos(b2) * 0.12], [0.045, 0.48, 0.045], [-cos(b2) * 0.45, 0, sin(b2) * 0.45])); }
    // chamas
    var flG = B.lathe([[0.001, 0], [0.55, 0.08], [0.85, 0.25], [0.8, 0.45], [0.55, 0.65], [0.3, 0.82], [0.12, 0.93], [0.001, 1]], 14);
    var fire = B.grp(fogo, [0, 0.06, 0]);
    var fl = [
      B.add(fire, flG, mF1, [0, 0, 0], [0.24, 0.72, 0.24]),
      B.add(fire, flG, mF2, [0, 0, 0.02], [0.14, 0.48, 0.14]),
      B.add(fire, flG, mF3, [0.1, 0, -0.04], [0.11, 0.46, 0.11], [0, 0, -0.3]),
      B.add(fire, flG, mF3, [-0.1, 0, 0.03], [0.1, 0.4, 0.1], [0, 0, 0.35])
    ];
    var sparks = [0, 1, 2, 3, 4].map(function(){ return B.add(fogo, B.oct(), mSp, [0, 0, 0], 0.02); });
    // mastros e cordão de bandeirinhas
    var poles = [-1, 1].map(function(s){ return B.add(root, B.cyl(0.025, 0.035, 8), mPole, [s * 0.5, 0.66, -0.12], [1, 1.32, 1]); });
    function sag(x){ return 1.24 - 0.22 * (1 - Math.pow(x / 0.5, 2)); }
    var sp = []; for (var k = 0; k <= 8; k++){ var xx = -0.5 + k / 8; sp.push([xx, sag(xx), -0.12]); }
    var flags = B.grp(root, [0, 0, 0]);
    B.add(flags, B.tube(sp, 0.006, 0.006, 16, 4), mStr, [0, 0, 0]);
    var fp = [], FC = [0xE0442A, 0x3FA34A, 0x2A9AD0, 0x8A55D6, 0xF2C230, 0xE87A2A, 0x2FB8A0];
    for (var f = 0; f < 9; f++){ var xf = -0.4 + f * 0.1; fp.push([B.cone(3), [xf, sag(xf) - 0.055, -0.12], [0.045, 0.1, 0.006], [PI, 0, 0], FC[f % FC.length]]); }
    var flagM = B.add(flags, B.merge(fp), mFlag, [0, 0, 0]);
    var lamps = [];
    if (asc >= 3){
      var LC = [0xFF6A1A, 0x4CD43A, 0x2ACFE0, 0x9A5CFF];
      LC.forEach(function(c, q){ var xl = -0.36 + q * 0.24; lamps.push(B.add(flags, B.sph(1), B.mat(c, { e: c, ei: 1.6 }), [xl, sag(xl) - 0.04, -0.12], [0.03, 0.04, 0.03])); });
    }
    B.done(root);
    var RC = [B.col(0xFF6A12), B.col(0x4CD43A), B.col(0x2ACFE0), B.col(0x9A5CFF)], RE = [B.col(0xFF4A00), B.col(0x20A020), B.col(0x0A90C0), B.col(0x6A2AE0)];
    var tmpC = B.col(0xffffff), tmpE = B.col(0xffffff);
    return { obj: root, anim: function(st, t, p){
      st = norm(st); t = t || 0; p = p || 0; B.reset();
      var fk = 0.5 + 0.5 * sin(t * 11) * sin(t * 6.3), fs = 1, burst = 0;
      if (st === 'atk'){ var a = ph(p); fs = 1 - 0.25 * a.w + 0.75 * a.s; burst = a.s; }
      else if (st === 'hit'){ var h = hitc(p); fs = 1 - 0.45 * h; fogo.position.x = 0.03 * sin(p * 50) * h; }
      else if (st === 'sono'){ fs = 0.35 + 0.05 * sin(t * 1.3); }
      else if (st === 'entra'){ fs = sm(cl((p - 0.15) / 0.5)) * (1 + 0.4 * sin(cl(p) * PI)); }
      fire.scale.set(fs * (0.92 + 0.12 * fk), Math.max(0.01, fs * (0.88 + 0.22 * fk)), fs * (0.92 + 0.12 * fk));
      fl[0].rotation.y = t * 1.7; fl[2].rotation.z = -0.3 + 0.2 * sin(t * 7); fl[3].rotation.z = 0.35 + 0.2 * sin(t * 8.1);
      mF1.emissiveIntensity = 1.3 * (0.8 + 0.4 * fk); mF3.emissiveIntensity = mF1.emissiveIntensity; mF2.emissiveIntensity = 2.2 * (0.85 + 0.3 * fk); mBed.emissiveIntensity = 1.4 * (0.75 + 0.25 * fk) * Math.max(0.5, fs);
      sparks.forEach(function(m, i){ var q = fr(t * (0.5 + 0.1 * i) + i / 5 + burst * 0.3); m.position.set(0.12 * sin(t * 2 + i * 1.7) * (1 + q), 0.25 + q * (0.9 + burst * 0.6), 0.1 * cos(t * 1.6 + i)); m.scale.setScalar((0.025 * (1 - q) + 0.001) * (st === 'sono' ? 0.2 : 1 + burst)); m.rotation.y = t * 4 + i; });
      flagM.rotation.x = 0.12 * sin(t * 1.6); flags.position.y = 0.006 * sin(t * 1.6);
      if (asc >= 3){ // passeia pelas 4 cores dos reinos
        var u = fr(t / 8) * 4, i0 = Math.floor(u) % 4, i1 = (i0 + 1) % 4, w = sm(fr(u) * 2 - 1);
        tmpC.copy(RC[i0]).lerp(RC[i1], w); tmpE.copy(RE[i0]).lerp(RE[i1], w);
        mF1.color.copy(tmpC); mF1.emissive.copy(tmpE); mBed.color.copy(tmpC); mBed.emissive.copy(tmpE);
        var j0 = (i0 + 2) % 4, j1 = (i1 + 2) % 4; mF3.color.copy(RC[j0]).lerp(RC[j1], w); mF3.emissive.copy(RE[j0]).lerp(RE[j1], w);
        lamps.forEach(function(l, q){ l.scale.y = 0.04 * (1 + 0.1 * sin(t * 3 + q)); });
      }
    } };
  };

  // =================================================================== CARRO DE BOI FANTASMA (trator-vermelho)
  // carro de boi velho de madeira, rodas maciças, brilho azul de assombração, cangas vazias. Idle: a roda chia e gira.
  // Asc III: aparecem as silhuetas dos bois-fantasma nas cangas.
  C3['trator-vermelho'] = function(T, _k, o){
    var B = kit(T), root = new T.Group(), asc = ascOf(o);
    var cW1 = B.col(0x6A4A2E), cW2 = B.col(0x4E3420), cW3 = B.col(0x7A5A3A);
    var mWd = B.mat(0xffffff, { vc: 1, r: 0.85, e: 0x1A3A8A, ei: 0.14, corpo: 1 });
    var mWd2 = B.mat(0x5A3E26, { r: 0.85, e: 0x1A3A8A, ei: 0.12 });
    var mIron = B.mat(0x3E4048, { r: 0.4, m: 0.8, e: 0x2050C0, ei: 0.25 });
    var mGh = B.mat(0x8FB8FF, { e: 0x3A7AFF, ei: 1.1, op: 0.3, ds: 1 }), mGl = B.mat(0xBFE0FF, { e: 0x5A9AFF, ei: 2 });
    var mYoke = B.mat(0x8AB0FF, { r: 0.4, e: 0x3A6AFF, ei: 0.9, op: 0.75 });
    var cart = B.grp(root);
    var body = B.grp(cart, [0, 0, 0]);
    // rodas maciças de tábuas com aro de ferro
    var wheelG = B.paint(B.cyl(1, 1, 22), function(x, y, z, c, nx, ny){
      var k = Math.floor((x + 1) * 1.5); c.copy(k === 1 ? cW1 : k === 0 ? cW2 : cW3); if (Math.abs(ny) < 0.5) c.copy(cW2);
      if (Math.abs(ny) > 0.5 && Math.abs(Math.abs(x) - 0.33) < 0.03) c.multiplyScalar(0.55); });
    var wheels = [-1, 1].map(function(s){
      var g = B.grp(body, [s * 0.36, 0.3, -0.05]);
      B.add(g, wheelG, mWd, [0, 0, 0], [0.29, 0.06, 0.29], [0, 0, PI / 2]);
      B.add(g, B.tor(0.29, 0.018, 0, 24, 5), mIron, [0, 0, 0], 1, [0, PI / 2, 0]);
      B.add(g, B.cyl(1, 1, 10), mWd2, [s * 0.04, 0, 0], [0.06, 0.06, 0.06], [0, 0, PI / 2]);
      return g;
    });
    B.add(body, B.cyl(1, 1, 8), mWd2, [0, 0.3, -0.05], [0.04, 0.78, 0.04], [0, 0, PI / 2]);
    // mesa do carro, fueiros e esteira
    var bed = [[B.rbox(0.56, 0.05, 0.78, 0.02), [0, 0, 0], 1, null, 0x7A5634]];
    for (var i = 0; i < 4; i++){ bed.push([B.box(), [-0.2 + i * 0.135, 0.028, 0], [0.012, 0.004, 0.76], null, 0x4A3220]); }
    [-1, 1].forEach(function(s){
      for (var j = 0; j < 4; j++) bed.push([B.cyl(1, 1, 6), [s * 0.26, 0.17, -0.33 + j * 0.22], [0.016, 0.32, 0.016], [0, 0, s * 0.12], 0x5E4026]);
      bed.push([B.box(), [s * 0.28, 0.3, -0.0], [0.03, 0.03, 0.74], [0, 0, s * 0.12], 0x6A4A2C]);
      bed.push([B.box(), [s * 0.268, 0.17, 0], [0.012, 0.18, 0.7], [0, 0, s * 0.12], 0xA88A58]);
    });
    B.add(body, B.merge(bed), mWd, [0, 0.47, -0.05]);
    // cabeçalho até a canga vazia
    B.add(body, B.cyl(1, 1, 8), mWd2, [0, 0.45, 0.48], [0.035, 0.75, 0.035], [PI / 2 + 0.12, 0, 0]);
    var yoke = B.grp(body, [0, 0.52, 0.82]);
    B.add(yoke, B.merge([[B.cyl(1, 1, 8), [0, 0, 0], [0.035, 0.86, 0.035], [0, 0, PI / 2]],
      [B.cyl(1, 1, 6), [-0.3, -0.1, 0], [0.012, 0.22, 0.012]], [B.cyl(1, 1, 6), [-0.14, -0.1, 0], [0.012, 0.22, 0.012]],
      [B.cyl(1, 1, 6), [0.14, -0.1, 0], [0.012, 0.22, 0.012]], [B.cyl(1, 1, 6), [0.3, -0.1, 0], [0.012, 0.22, 0.012]]]), mYoke, [0, 0, 0]);
    // lampião azul num fueiro da frente
    var lamp = B.grp(body, [0.26, 0.96, 0.25]);
    B.add(lamp, B.cyl(1, 1, 6), mIron, [0, -0.03, 0], [0.004, 0.06, 0.004]);
    B.add(lamp, B.merge([[B.cone(6), [0, -0.07, 0], [0.035, 0.025, 0.035]], [B.cyl(1, 1, 6), [0, -0.15, 0], [0.03, 0.01, 0.03]]]), mIron, [0, 0, 0]);
    var lgl = B.add(lamp, B.sph(1), mGl, [0, -0.11, 0], [0.022, 0.032, 0.022]);
    // névoa / assombração em volta
    var wisps = [0, 1, 2].map(function(k){ return B.add(root, B.sph(1), mGh, [0, 0, 0], [0.08, 0.06, 0.11]); });
    var aura = B.add(body, B.sph(1), B.mat(0x6A9AFF, { e: 0x3A6AFF, ei: 0.6, op: 0.07 }), [0, 0.45, 0.1], [0.55, 0.45, 0.85]);
    // Asc III: bois-fantasma nas cangas
    var oxen = [];
    if (asc >= 3){
      var mOx = B.mat(0xA8C8FF, { e: 0x4A8AFF, ei: 1.2, op: 0.5 });
      var oxG = B.merge([[B.sph(1), [0, 0.52, 0.05], [0.13, 0.17, 0.3]], [B.sph(1), [0, 0.6, 0.38], [0.1, 0.11, 0.14]], [B.sph(1), [0, 0.68, 0.0], [0.09, 0.06, 0.1]],
        [B.cone(6), [0.09, 0.72, 0.35], [0.022, 0.14, 0.022], [0, 0, -0.8]], [B.cone(6), [-0.09, 0.72, 0.35], [0.022, 0.14, 0.022], [0, 0, 0.8]],
        [B.cap(0.04, 0.28, 6), [0.07, 0.2, 0.22]], [B.cap(0.04, 0.28, 6), [-0.07, 0.2, 0.22]], [B.cap(0.04, 0.28, 6), [0.07, 0.2, -0.12]], [B.cap(0.04, 0.28, 6), [-0.07, 0.2, -0.12]]]);
      [-1, 1].forEach(function(s){
        var g = B.grp(body, [s * 0.22, 0.0, 0.88]);
        B.add(g, oxG, mOx, [0, 0, 0]);
        var e1 = B.add(g, B.sph(0), mGl, [0.05, 0.63, 0.49], 0.016); e1.userData.olho = true;
        var e2 = B.add(g, B.sph(0), mGl, [-0.05, 0.63, 0.49], 0.016); e2.userData.olho = true;
        oxen.push(g);
      });
    }
    B.done(root);
    var eg = mGh.emissiveIntensity;
    return { obj: root, anim: function(st, t, p){
      st = norm(st); t = t || 0; p = p || 0; B.reset();
      // a roda chia: anda um tiquinho pra frente e pra trás
      var creep = 0.07 * sin(t * 0.9) + 0.025 * sin(t * 3.1), roll = creep, dz = creep * 0.29;
      body.rotation.z += 0.025 * sin(t * 1.3); body.position.y += 0.006 * Math.abs(sin(t * 3.1));
      if (st === 'atk'){ var a = ph(p); dz = -0.1 * a.w + 0.45 * a.s; roll = dz / 0.29 + p * 6; body.rotation.x = 0.06 * a.w - 0.1 * a.s; mYoke.emissiveIntensity = 0.9 + 1.5 * a.s; }
      else if (st === 'hit'){ var h = hitc(p); dz = -0.1 * h; body.rotation.z = 0.12 * sin(p * 30) * h; roll = dz / 0.29; }
      else if (st === 'sono'){ dz = 0; roll = 0; body.rotation.z = 0; body.position.y = 0; mGh.emissiveIntensity = eg * 0.4; }
      else if (st === 'entra'){ var e = sm(cl(p / 0.6)); dz = -0.8 * (1 - e); roll = dz / 0.29; aura.scale.multiplyScalar(1 + (1 - e)); }
      cart.position.z = dz; wheels.forEach(function(w){ w.rotation.x = roll; });
      yoke.rotation.z = 0.04 * sin(t * 1.7);
      lamp.rotation.z = 0.25 * sin(t * 2.1 + 0.4); lamp.rotation.x = 0.15 * sin(t * 1.5);
      mGl.emissiveIntensity = 2 * (0.8 + 0.2 * sin(t * 9) * sin(t * 4.7));
      wisps.forEach(function(w, k){ var q = fr(t * 0.25 + k / 3); w.position.set((k - 1) * 0.36 + 0.05 * sin(t + k), 0.12 + q * 0.6, -0.35 - q * 0.3 + dz); w.scale.set(0.08 * (1 + q), 0.06 * (1 + q), 0.11 * (1 + q)); });
      mGh.opacity = st === 'sono' ? 0.12 : 0.3;
      oxen.forEach(function(g, k){ g.position.y = 0.02 * sin(t * 2 + k); g.rotation.y = 0.05 * sin(t * 1.3 + k); });
    } };
  };
})();
