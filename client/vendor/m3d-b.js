// m3d-b.js — modelos 3D v10 (Three.js r149), reino da Mata: crescimento, cura e guardiões da floresta (folclore brasileiro).
// Contrato: MODELOS3D.md + spec-v10 §12.2. window.CHAR3D[id](T, kit, o) -> { obj, anim(st, t, p) }; o.asc 0..3 (III = detalhe próprio).
// Estilo chibi-heroico: cabeça grande, silhueta clara, paleta escura com acentos saturados; emissivo só em fogo, olhos e magia.
// Olhos marcados mesh.userData.olho, material do corpo mat.userData.corpo. Não depende do kit do motor.
(function(){
  window.CHAR3D = window.CHAR3D || {};
  const PI = Math.PI, TAU = PI * 2, sin = Math.sin, cos = Math.cos, abs = Math.abs, mx = Math.max, mn = Math.min, pw = Math.pow;
  const cl = (v, a, b) => v < a ? a : v > b ? b : v;
  const sm = x => { x = cl(x, 0, 1); return x * x * (3 - 2 * x); };
  const seg = (p, a, b) => sm((p - a) / (b - a));
  const lin = (p, a, b) => cl((p - a) / (b - a), 0, 1);
  const fr = (t, per) => ((t % per) + per) % per / per;
  // ataque: w = preparação (0..0.35), s = golpe (pico 0.38..0.56), recupera até 0.98
  const AP = p => ({ w: seg(p, 0, 0.33) * (1 - seg(p, 0.35, 0.46)), s: seg(p, 0.34, 0.46) * (1 - seg(p, 0.58, 0.98)) });
  const HP = p => p < 0.14 ? sm(p / 0.14) : 1 - sm((p - 0.14) / 0.86);
  const blink = (t, per, off) => { const u = ((t + (off || 0)) % per + per) % per; return u < 0.14 ? mx(0.08, abs(u - 0.07) / 0.07) : 1; };

  // ---------------------------------------------------------------- construtor de peças (um por modelo; não usa o kit do motor)
  function K(T) {
    const k = { T }, G = {}, FL = [];
    k.S = (w, h) => G['s' + w + '_' + h] || (G['s' + w + '_' + h] = new T.SphereGeometry(1, w, h));
    k.Hs = (w, h) => G['h' + w + '_' + h] || (G['h' + w + '_' + h] = new T.SphereGeometry(1, w, h, 0, TAU, 0, PI / 2));
    k.Cy = (rt, rb, n, open) => { const key = 'c' + rt + '_' + rb + '_' + n + (open ? 'o' : ''); return G[key] || (G[key] = new T.CylinderGeometry(rt, rb, 1, n, 1, !!open)); };
    k.Co = n => G['co' + n] || (G['co' + n] = new T.ConeGeometry(1, 1, n));
    k.Cap = (r, l, cs, rs) => { const key = 'k' + r + '_' + l + '_' + (rs || 12); return G[key] || (G[key] = new T.CapsuleGeometry(r, l, cs || 4, rs || 12)); };
    k.To = (r, tb, rs, ts, arc) => { const key = 't' + r + '_' + tb + '_' + rs + '_' + ts + '_' + (arc || 0); return G[key] || (G[key] = new T.TorusGeometry(r, tb, rs, ts, arc || TAU)); };
    k.Bx = () => G.bx || (G.bx = new T.BoxGeometry(1, 1, 1));
    k.Oc = () => G.oc || (G.oc = new T.OctahedronGeometry(1, 0));
    k.Ic = d => G['ic' + d] || (G['ic' + d] = new T.IcosahedronGeometry(1, d || 0));
    k.mat = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.66, metalness: 0 }, o || {}));
    k.corpo = m => { m.userData.corpo = true; return m; };
    // brilho (fogo, olhos, magia): emissivo; op<1 deixa translúcido sem escrever profundidade
    k.glow = (c, ei, op, e2) => new T.MeshStandardMaterial({ color: c, emissive: e2 || c, emissiveIntensity: ei == null ? 1.2 : ei, transparent: op != null && op < 1, opacity: op == null ? 1 : op, depthWrite: !(op != null && op < 1), roughness: 0.8, metalness: 0 });
    k.white = k.mat('#F6F2EA', { roughness: 0.3 });
    k.ink = k.mat('#120E16', { roughness: 0.25 });
    k.shine = k.mat('#FFFFFF', { emissive: '#FFFFFF', emissiveIntensity: 1.0, roughness: 0.2 });
    k.m = (parent, geo, mat, x, y, z, sx, sy, sz) => {
      const o = new T.Mesh(geo, mat);
      o.position.set(x || 0, y || 0, z || 0);
      if (sx != null) o.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz);
      o.castShadow = !mat.transparent; o.receiveShadow = !mat.transparent;
      parent.add(o); return o;
    };
    k.g = (parent, x, y, z) => { const o = new T.Group(); o.position.set(x || 0, y || 0, z || 0); parent.add(o); return o; };
    k.rot = (o, x, y, z) => { o.rotation.set(x || 0, y || 0, z || 0); return o; };
    // cápsula/cilindro entre dois pontos (no espaço do pai)
    const UP = new T.Vector3(0, 1, 0);
    k.bone = (parent, geo, mat, a, b, r) => {
      const d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length();
      const o = k.m(parent, geo, mat, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, r, L, r);
      o.quaternion.setFromUnitVectors(UP, d.normalize()); return o;
    };
    // olho: branco + pupila + brilho (tudo marcado userData.olho); 'closed' é um arco (dormindo/susto)
    k.eye = (parent, x, y, z, r, o) => {
      o = o || {};
      const g = k.g(parent, x, y, z);
      g.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
      const open = k.g(g);
      const tall = o.tall || 1.12;
      const w = k.m(open, k.S(18, 14), o.whiteM || k.white, 0, 0, 0, r, r * tall, r * 0.72); w.userData.olho = true;
      const pup = k.g(open, 0, -r * 0.04, r * 0.42);
      const ps = o.pupil || 0.62;
      const pm = k.m(pup, k.S(14, 10), o.pupilM || k.ink, 0, 0, 0, r * ps, r * ps * tall * (o.slit ? 1.5 : 1.05), r * 0.36);
      if (o.slit) pm.scale.x *= o.slit;
      pm.userData.olho = true;
      const sh = k.m(pup, k.S(8, 6), k.shine, -r * ps * 0.38, r * ps * 0.42, r * 0.3, r * 0.2); sh.userData.olho = true;
      const closed = k.m(g, G.arc || (G.arc = new T.TorusGeometry(1, 0.2, 6, 14, PI)), o.lidM || k.ink, 0, -r * 0.1, r * 0.55, r * 0.62, r * 0.62, r * 0.62);
      closed.visible = false;
      let brow = null;
      if (o.brow) { // sobrancelha heroica (ângulo o.brow, + = brava)
        brow = k.m(g, k.Cap(0.5, 2, 2, 6), o.browM || k.ink, 0, r * 1.05, r * 0.45, r * 0.32, r * 0.42, r * 0.3);
        brow.rotation.z = PI / 2 + (x < 0 ? -1 : 1) * o.brow;
      }
      return { g, open, pup, closed, r, brow };
    };
    k.eyes = (list, s) => { for (const e of list) { e.open.visible = true; e.closed.visible = false; e.open.scale.y = s; } };
    k.shut = (list, sleep) => { for (const e of list) { e.open.visible = false; e.closed.visible = true; e.closed.rotation.z = sleep ? PI : 0; e.closed.position.y = sleep ? e.r * 0.15 : -e.r * 0.1; } };
    k.look = (list, x, y) => { for (const e of list) { e.pup.position.x = x * e.r; e.pup.position.y = -e.r * 0.04 + y * e.r; } };
    // pose base de toda a árvore + materiais; reset() volta tudo (anim só aplica deltas)
    k.rig = (top, mats) => {
      const L = [];
      top.traverse(o => L.push([o, o.position.clone(), o.quaternion.clone(), o.scale.clone(), o.visible]));
      const M = (mats || []).map(m => [m, m.emissiveIntensity, m.opacity]);
      return () => {
        for (const e of L) { e[0].position.copy(e[1]); e[0].quaternion.copy(e[2]); e[0].scale.copy(e[3]); e[0].visible = e[4]; }
        for (const e of M) { e[0].emissiveIntensity = e[1]; e[0].opacity = e[2]; }
      };
    };
    // perfil de torno r(v), v 0..1 ao longo da altura h; com cores por vértice opcionais (c0 embaixo -> c1 em cima)
    k.lathe = (fn, h, n, segs, c0, c1, cf) => {
      const pts = [];
      for (let i = 0; i <= n; i++) { const v = i / n; pts.push(new T.Vector2(mx(0.0001, fn(v)), v * h)); }
      const g = new T.LatheGeometry(pts, segs || 20);
      if (c0) {
        const A = new T.Color(c0), B = new T.Color(c1), C = new T.Color(), pos = g.attributes.position, col = [];
        for (let i = 0; i < pos.count; i++) { const v = pos.getY(i) / h; C.copy(A).lerp(B, cf ? cf(v) : v); col.push(C.r, C.g, C.b); }
        g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      }
      return g;
    };
    // gota de chama (base redonda, ponta fina), altura 1, raio 1
    k.drop = lo => lo ? (G.dropL || (G.dropL = k.lathe(v => sin(PI * pw(v, 0.6)), 1, 8, 8))) : (G.drop || (G.drop = k.lathe(v => sin(PI * pw(v, 0.6)), 1, 12, 12)));
    // une várias geometrias (cada [geo, matrix]) numa só malha
    k.merge = list => {
      const P = [], N = [], U = [], I = [];
      let off = 0;
      for (const [g0, M] of list) {
        const g = g0.index ? g0.clone() : g0.clone();
        g.applyMatrix4(M);
        const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
        for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); N.push(n.getX(i), n.getY(i), n.getZ(i)); U.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0); }
        if (g.index) for (let i = 0; i < g.index.count; i++) I.push(g.index.getX(i) + off);
        else for (let i = 0; i < p.count; i++) I.push(i + off);
        off += p.count;
      }
      const out = new T.BufferGeometry();
      out.setAttribute('position', new T.Float32BufferAttribute(P, 3));
      out.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
      out.setAttribute('uv', new T.Float32BufferAttribute(U, 2));
      out.setIndex(I);
      return out;
    };
    const _o = new T.Object3D();
    k.M = (x, y, z, rx, ry, rz, sx, sy, sz) => { _o.position.set(x || 0, y || 0, z || 0); _o.rotation.set(rx || 0, ry || 0, rz || 0); _o.scale.set(sx == null ? 1 : sx, sy == null ? (sx == null ? 1 : sx) : sy, sz == null ? (sx == null ? 1 : sx) : sz); _o.updateMatrix(); return _o.matrix.clone(); };
    // textura de canvas (cores sRGB)
    k.tex = (w, h, draw) => {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      draw(cv.getContext('2d'), w, h);
      const tx = new T.CanvasTexture(cv);
      if (T.sRGBEncoding) tx.encoding = T.sRGBEncoding;
      tx.anisotropy = 4;
      return tx;
    };
    // faíscas/partículas que sobem em ciclo: lista de malhas, cada uma com fase própria
    k.sparks = (parent, n, mat, r, geo) => { const L = []; for (let i = 0; i < n; i++) { const s = k.m(parent, geo || k.Oc(), mat, 0, 0, 0, r); s.visible = false; s.userData.r0 = r; L.push(s); } return L; };
    // posiciona partículas num ciclo de subida (x0,z0 espalhados, altura h); f(i,u) opcional
    k.rise = (L, t, per, h, spread, y0, sc) => {
      for (let i = 0; i < L.length; i++) {
        const u = fr(t + i * per / L.length, per), a = i * 2.39996;
        const s = L[i];
        s.visible = true;
        s.position.set(cos(a) * spread * (0.4 + 0.6 * u) + sin(u * 9 + i) * 0.03, y0 + h * u, sin(a) * spread * (0.4 + 0.6 * u));
        const q = (sc || 1) * sin(PI * mn(1, u * 1.3));
        s.scale.setScalar(mx(0.001, q * s.userData.r0));
        s.rotation.set(u * 6 + i, u * 4, 0);
      }
    };
    k.burst = (L, p, dist, y0, dir) => { // explosão radial (p 0..1), dir = +1 para frente
      for (let i = 0; i < L.length; i++) {
        const s = L[i], a = i * 2.39996, e = i / L.length;
        s.visible = p > 0.001 && p < 0.999;
        const d = dist * pw(p, 0.6);
        s.position.set(cos(a) * d * 0.8, y0 + sin(a * 1.7) * d * 0.5 + d * 0.25 * e, (dir || 0) * d * 0.9 + sin(a) * d * 0.5);
        s.scale.setScalar(mx(0.001, s.userData.r0 * (1 - p)));
      }
    };
    k.fl = (o, fq, amp, off) => FL.push([o, fq, amp, off || 0, o.scale.clone()]);
    k.flick = t => { for (const [o, fq, amp, off, s0] of FL) { const f = 1 + amp * (0.6 * sin(t * fq + off) + 0.4 * sin(t * fq * 2.3 + off * 1.7)); o.scale.set(s0.x * (2 - f) * 0.5 + s0.x * 0.5, s0.y * f, s0.z * (2 - f) * 0.5 + s0.z * 0.5); } };
    // tubo afilado ao longo de f(u)->[x,y,z], raio rf(u); pontas fechadas por bolinhas de quem usa
    k.ttube = (f, rf, n, rad) => {
      const P = [], I = [], V = T.Vector3, up = new V(0, 1, 0);
      for (let i = 0; i <= n; i++) {
        const u = i / n, c = new V(...f(u)), d = new V(...f(mn(1, u + 0.01))).sub(new V(...f(mx(0, u - 0.01)))).normalize();
        let nx = new V().crossVectors(d, up); if (nx.lengthSq() < 1e-6) nx.set(1, 0, 0); nx.normalize();
        const ny = new V().crossVectors(nx, d).normalize(), r = rf(u);
        for (let j = 0; j <= rad; j++) { const a = j / rad * TAU; P.push(c.x + (nx.x * cos(a) + ny.x * sin(a)) * r, c.y + (nx.y * cos(a) + ny.y * sin(a)) * r, c.z + (nx.z * cos(a) + ny.z * sin(a)) * r); }
      }
      for (let i = 0; i < n; i++) for (let j = 0; j < rad; j++) { const a = i * (rad + 1) + j, b = a + rad + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
      return g;
    };
    return k;
  }

  // ---------------------------------------------------------------- peças comuns da Mata
  // listras (vespa/abelha): faixas ao longo de v
  const listras = (k, a, b, n, fr0) => k.tex(16, 128, (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b; for (let i = 0; i < n; i++) g.fillRect(0, h * (fr0 + i * (1 - fr0) / n), w, h * (1 - fr0) / n * 0.5); });
  // asa de inseto translúcida (disco achatado com nervuras numa textura)
  const asaTex = (k, c, v) => k.tex(64, 64, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); g.strokeStyle = v; g.lineWidth = 1.5; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(0, h / 2); g.quadraticCurveTo(w * 0.5, h * (0.1 + i * 0.2), w, h * (0.1 + i * 0.2)); g.stroke(); } });
  // pequi com rosto: devolve {g, eyes, mouth}
  function pequi(k, T, parent, x, y, z, r, mats, o) {
    o = o || {};
    const g = k.g(parent, x, y, z);
    const fruit = k.g(g, 0, r, 0);
    k.m(fruit, k.S(22, 18), mats.skin, 0, 0, 0, r, r * 0.94, r);
    k.m(fruit, k.S(10, 8), mats.dark, 0, r * 0.93, 0, r * 0.18, r * 0.1, r * 0.18);
    const lf = k.g(fruit, 0, r * 0.96, 0); lf.rotation.z = o.lean || 0.3;
    k.rot(k.m(lf, k.S(10, 6), mats.leaf, r * 0.25, r * 0.12, 0, r * 0.32, r * 0.06, r * 0.14), 0, 0, 0.35);
    const eyes = [];
    for (const s of [-1, 1]) eyes.push(k.eye(fruit, s * r * 0.36, r * 0.12, r * 0.8, r * 0.27, { ry: s * 0.38, brow: o.brow == null ? 0.35 : o.brow, browM: mats.dark }));
    for (const s of [-1, 1]) k.m(fruit, k.S(8, 6), mats.cheek, s * r * 0.62, -r * 0.18, r * 0.7, r * 0.13, r * 0.08, r * 0.05);
    const mouth = k.g(fruit, 0, -r * 0.24, r * 0.92);
    k.rot(k.m(mouth, k.To(r * 0.16, r * 0.04, 5, 12, PI), mats.dark, 0, 0, 0), 0, 0, PI);
    for (const s of [-1, 1]) k.m(g, k.S(8, 6), mats.dark, s * r * 0.45, r * 0.06, r * 0.1, r * 0.2, r * 0.1, r * 0.26);
    return { g, fruit, eyes, mouth };
  }

  // ================================================================ BROTINHO DO MATO (maca-rolica) — espírito de semente redonda, orelhas de folha, broto-antena, pés de musgo
  window.CHAR3D['maca-rolica'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const podTex = k.tex(128, 64, (g, w, h) => { g.fillStyle = '#7A5A30'; g.fillRect(0, 0, w, h); g.strokeStyle = '#5A3E1E'; g.lineWidth = 2; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.bezierCurveTo(i * w / 8 + 6, h * 0.3, i * w / 8 - 6, h * 0.7, i * w / 8, h); g.stroke(); } g.fillStyle = 'rgba(160,190,90,0.35)'; g.fillRect(0, h * 0.75, w, h * 0.25); });
    const pod = k.corpo(k.mat('#FFFFFF', { map: podTex, roughness: 0.7 }));
    const leaf = k.mat('#4E9A3A', { roughness: 0.6 }), leafD = k.mat('#2F6E2A', { roughness: 0.62 }), moss = k.mat('#4A6E2A', { roughness: 1 });
    const stem = k.mat('#6AA03A', { roughness: 0.6 }), dark = k.mat('#2A1E12', { roughness: 0.5 });
    const body = k.g(root);
    const feet = [];
    for (const s of [-1, 1]) { const f = k.m(body, k.S(12, 8), moss, s * 0.13, 0.04, 0.03, 0.1, 0.06, 0.12); feet.push(f); }
    const ball = k.g(body, 0, 0.3, 0);
    const shell = k.g(ball);
    k.m(shell, k.S(24, 18), pod, 0, 0, 0, 0.29, 0.27, 0.28);
    k.m(shell, k.S(10, 8), moss, -0.12, -0.18, -0.15, 0.1, 0.06, 0.09);
    // orelhas de folha
    const ears = [];
    for (const s of [-1, 1]) {
      const e = k.g(ball, s * 0.22, 0.15, -0.02); e.rotation.set(0, 0, -s * 0.9);
      k.m(e, k.S(12, 8), s < 0 ? leaf : leafD, 0, 0.12, 0, 0.07, 0.15, 0.025);
      ears.push({ e, s });
    }
    // broto-antena
    const sprout = k.g(ball, 0.02, 0.26, -0.02);
    k.m(sprout, k.Cy(0.012, 0.016, 6), stem, 0, 0.08, 0, 1, 0.16, 1);
    const sl = [];
    for (const s of [-1, 1]) { const l = k.g(sprout, 0, 0.16, 0); l.rotation.z = -s * 0.9; k.m(l, k.S(10, 6), leaf, 0, 0.06, 0, 0.035, 0.07, 0.014); sl.push(l); }
    let flower = null;
    if (asc >= 3) {
      flower = k.g(sprout, 0, 0.18, 0);
      const pm = k.glow('#FFB8E8', 1.5, 1, '#FF6AC8');
      for (let i = 0; i < 5; i++) { const a = i * TAU / 5; const pt = k.m(flower, k.S(8, 6), pm, cos(a) * 0.04, 0.02, sin(a) * 0.04, 0.035, 0.012, 0.022); pt.rotation.y = -a; }
      k.m(flower, k.S(8, 6), k.glow('#FFE47A', 2.0), 0, 0.025, 0, 0.022);
    }
    const eyes = [k.eye(ball, -0.1, 0.03, 0.22, 0.085, { ry: -0.35, brow: 0.3, browM: dark }), k.eye(ball, 0.1, 0.03, 0.22, 0.085, { ry: 0.35, brow: 0.3, browM: dark })];
    const mouth = k.g(ball, 0, -0.08, 0.26);
    k.rot(k.m(mouth, k.To(0.035, 0.01, 5, 10, PI), dark, 0, 0, 0), 0, 0, PI);
    const reset = k.rig(root);

    function anim(st, t, p) {
      reset();
      if (st === 'atk') {
        const { w, s } = AP(p);
        const roll = seg(p, 0.25, 0.55) * (1 - seg(p, 0.6, 0.95));
        body.position.z = -0.08 * w + 0.4 * roll; body.position.y = 0.12 * sin(roll * PI);
        ball.rotation.x = TAU * seg(p, 0.25, 0.55) - 0.3 * w;
        ball.scale.set(1 + 0.1 * w, 1 - 0.1 * w, 1 + 0.1 * w);
        for (const f of feet) f.visible = roll < 0.3;
        for (const e of ears) e.e.rotation.z = -e.s * (0.9 + 0.5 * roll);
        k.eyes(eyes, 1 - 0.4 * w); k.look(eyes, 0, -0.1);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        body.position.z = -0.1 * h; ball.rotation.x = -0.4 * h; ball.scale.set(1 + 0.1 * h, 1 - 0.12 * h, 1 + 0.1 * h);
        for (const e of ears) e.e.rotation.z = -e.s * (0.9 - 0.6 * h);
        sprout.rotation.z = 0.5 * h * sin(p * 20);
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.5);
        ball.position.y -= 0.03; ball.rotation.z = 0.12;
        ball.scale.set(1 + 0.025 * b, 1 + 0.03 * b, 1 + 0.025 * b);
        for (const e of ears) e.e.rotation.z = -e.s * 1.5;
        sprout.rotation.z = 0.7; for (const l of sl) l.scale.y = 0.7;
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const g = sm(lin(p, 0, 0.5)), sp = seg(p, 0.45, 0.8);
        ball.scale.setScalar(mx(0.05, g * (1 + 0.12 * sin(lin(p, 0.4, 0.9) * PI))));
        sprout.scale.setScalar(mx(0.05, sp)); for (const e of ears) e.e.scale.setScalar(mx(0.05, sp));
        body.position.y = 0.05 * sin(lin(p, 0.5, 1) * PI);
        k.eyes(eyes, 1);
        return;
      }
      // idle: o broto balança, orelhas de folha abanam, saltinhos de semente
      const hop = abs(sin(t * 2.4));
      ball.position.y += 0.025 * hop; ball.rotation.z = sin(t * 1.2) * 0.07;
      sprout.rotation.z = sin(t * 1.7) * 0.3; sprout.rotation.x = sin(t * 1.3) * 0.15;
      for (let i = 0; i < sl.length; i++) sl[i].rotation.x = 0.2 * sin(t * 2.5 + i);
      for (const e of ears) e.e.rotation.z = -e.s * (0.9 + 0.15 * sin(t * 3 + e.s));
      if (flower) flower.rotation.y = t;
      k.eyes(eyes, blink(t, 3.1, 0.7)); k.look(eyes, sin(t * 0.8) * 0.2, 0);
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ ABELHA JATAÍ (abelha-operaria) — abelhinha dourada sem ferrão, asas âmbar, tubinho de cera como trombeta
  window.CHAR3D['abelha-operaria'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const gold = k.corpo(k.mat('#E2A52A', { roughness: 0.5 })), brownD = k.mat('#3A2614', { roughness: 0.5 });
    const abd = k.mat('#FFFFFF', { map: listras(k, '#D89A22', '#6A4416', 3, 0.3), roughness: 0.5 });
    const wingM = k.mat('#FFFFFF', { map: asaTex(k, '#F2C46A', '#B07A2A'), transparent: true, opacity: 0.55, depthWrite: false, roughness: 0.2, side: T.DoubleSide });
    const wax = k.mat('#D9B064', { roughness: 0.55 }), waxD = k.mat('#9A7232', { roughness: 0.6 });
    const body = k.g(root, 0, 0.0, 0);
    const torso = k.g(body, 0, 0.5, 0);
    k.m(torso, k.S(18, 14), gold, 0, 0, 0, 0.15, 0.14, 0.15);
    const abdG = k.g(torso, 0, -0.04, -0.14); abdG.rotation.x = 0.35;
    k.rot(k.m(abdG, k.S(18, 14), abd, 0, 0, -0.08, 0.13, 0.17, 0.13), PI / 2, 0, 0);
    const legs = [];
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const lg = k.g(torso, s * 0.08, -0.1, 0.04 - i * 0.08); lg.rotation.z = s * 0.4; k.m(lg, k.Cap(0.014, 0.08, 2, 5), brownD, 0, -0.05, 0); legs.push(lg); }
    const wings = [];
    for (const s of [-1, 1]) { const w = k.g(torso, s * 0.08, 0.11, -0.04); const wm = k.m(w, k.S(14, 8), wingM, s * 0.16, 0.0, 0, 0.19, 0.012, 0.11); wm.rotation.set(0.5, s * 0.3, 0); wings.push({ w, s }); }
    // cabeça grande
    const head = k.g(torso, 0, 0.17, 0.1);
    k.m(head, k.S(22, 16), gold, 0, 0, 0, 0.17, 0.155, 0.16);
    const eyes = [];
    for (const s of [-1, 1]) eyes.push(k.eye(head, s * 0.075, 0.02, 0.12, 0.068, { ry: s * 0.35, brow: 0.2, browM: brownD }));
    const ant = [];
    for (const s of [-1, 1]) { const a = k.g(head, s * 0.06, 0.13, 0.06); a.rotation.set(-0.4, 0, -s * 0.35); k.m(a, k.Cy(0.008, 0.008, 5), brownD, 0, 0.06, 0, 1, 0.12, 1); k.m(a, k.S(8, 6), brownD, 0, 0.125, 0, 0.022); ant.push(a); }
    // tubinho de cera (entrada do ninho) segurado como trombeta
    const tube = k.g(head, 0, -0.07, 0.15); tube.rotation.x = 1.2;
    k.m(tube, k.Cy(0.03, 0.022, 10), wax, 0, 0.08, 0, 1, 0.16, 1);
    k.m(tube, k.lathe(v => 0.03 + 0.04 * pw(v, 2), 0.08, 4, 12), waxD, 0, 0.15, 0);
    const arms = [];
    for (const s of [-1, 1]) { const a = k.g(torso, s * 0.11, 0.0, 0.1); a.rotation.set(-1.1, 0, s * 0.3); k.m(a, k.Cap(0.016, 0.1, 2, 5), brownD, 0, 0.07, 0); arms.push(a); }
    let trail = [];
    if (asc >= 3) { const hm = k.glow('#FFC24A', 2.0, 0.85); for (let i = 0; i < 6; i++) { const d = k.m(root, k.S(8, 6), hm, 0, 0, 0, 0.03); trail.push(d); } }
    const reset = k.rig(root);

    function anim(st, t, p) {
      reset();
      const buzz = sin(t * 60);
      for (const a of wings) { a.w.rotation.z = a.s * 0.5 * buzz; a.w.rotation.x = 0.2 * buzz; }
      for (let i = 0; i < trail.length; i++) { const u = fr(t * 0.6 + i / trail.length, 1); trail[i].position.set(0.12 + u * 0.3 + 0.05 * sin(t * 1.4 - u * 3), 0.4 - u * 0.25 + 0.05 * sin(t * 2 - u * 4), -0.15 - u * 0.25); trail[i].scale.setScalar(0.035 * (1 - u)); }
      if (st === 'atk') {
        const { w, s } = AP(p);
        body.position.y = 0.06 * w; body.position.z = -0.1 * w + 0.32 * s;
        torso.rotation.x = -0.3 * w + 0.4 * s;
        head.rotation.x = -0.3 * w + 0.5 * s;
        tube.rotation.x = 1.2 - 1.0 * w + 0.5 * s;
        for (const a of arms) a.rotation.x = -1.1 - 1.2 * w + 0.8 * s;
        k.eyes(eyes, 1 - 0.4 * w); k.look(eyes, 0, -0.1);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        body.position.z = -0.12 * h; body.position.y = -0.05 * h; torso.rotation.z = 0.5 * h * sin(p * 20);
        tube.rotation.x = 1.2 - 0.6 * h;
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.6);
        body.position.y = -0.38; torso.rotation.x = 0.2;
        for (const a of wings) { a.w.rotation.z = -a.s * 0.25; a.w.rotation.x = 0; }
        torso.scale.set(1 + 0.03 * b, 1 + 0.03 * b, 1);
        tube.rotation.x = 1.5; tube.position.y -= 0.03;
        for (const a of ant) a.rotation.x = 0.3;
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const f = 1 - seg(p, 0.1, 0.8);
        body.position.set(0.5 * f * sin(p * 9), 0.5 * f, -0.6 * f);
        torso.rotation.y = 1.5 * f;
        tube.rotation.x = 1.2 - 1.2 * seg(p, 0.8, 0.9) * (1 - seg(p, 0.95, 1));
        k.eyes(eyes, 1);
        return;
      }
      // idle: zumbido pairando, sopra a trombetinha de cera, antenas mexem
      body.position.y = 0.04 * sin(t * 2.6); body.position.x = 0.02 * sin(t * 1.3);
      torso.rotation.z = 0.06 * sin(t * 1.3);
      const u = fr(t, 3.2) * 3.2, toot = u > 2.0 && u < 2.7 ? sin((u - 2.0) / 0.7 * PI) : 0;
      tube.rotation.x = 1.2 - 0.9 * toot; head.rotation.x = -0.15 * toot;
      tube.scale.set(1 + 0.1 * toot * sin(t * 30), 1, 1 + 0.1 * toot * sin(t * 30));
      for (let i = 0; i < ant.length; i++) ant[i].rotation.x = -0.4 + 0.2 * sin(t * 3 + i);
      abdG.rotation.x = 0.35 + 0.08 * sin(t * 2.6);
      k.eyes(eyes, toot > 0.4 ? 0.5 : blink(t, 3.0, 0.2));
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ PEQUIS GÊMEOS (cerejas-gemeas) — dois pequis de cara marota, a casca espinhenta de dentro aparecendo atrás
  window.CHAR3D['cerejas-gemeas'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const skinTex = k.tex(64, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9CB23E'); gr.addColorStop(1, '#5E7A22'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(220,210,90,0.35)'; for (let i = 0; i < 30; i++) g.fillRect((i * 17) % w, (i * 29) % h, 2, 2); });
    const mats = { skin: k.corpo(k.mat('#FFFFFF', { map: skinTex, roughness: 0.55 })), dark: k.mat('#2A2412', { roughness: 0.5 }), leaf: k.mat('#3E7A2E', { roughness: 0.6 }), cheek: k.mat('#E8A23A', { roughness: 0.8 }) };
    const pulp = k.mat('#E07A0C', { roughness: 0.45, emissive: '#7A3A00', emissiveIntensity: 0.25 }), spine = k.mat('#5A3414', { roughness: 0.4 }), husk = k.mat('#4E6A20', { roughness: 0.7 });
    const body = k.g(root);
    // caroço espinhento entre as metades da casca, atrás
    const back = k.g(body, 0, 0, -0.2);
    k.m(back, k.S(18, 14), pulp, 0, 0.3, 0, 0.21, 0.24, 0.2);
    const sp = [];
    for (let i = 0; i < 46; i++) { const a = i * 2.39996, v = 0.06 + 0.5 * (i / 46), y = 0.3 + 0.24 * cos(PI * v), rr = 0.21 * sin(PI * v); const ob = new T.Object3D(); ob.position.set(cos(a) * rr, y, sin(a) * rr * 0.95); ob.lookAt(cos(a) * 3, y + (y - 0.3) * 3, sin(a) * 3); ob.rotateX(PI / 2); ob.scale.set(0.028, 0.17, 0.028); ob.updateMatrix(); sp.push([k.Co(4), ob.matrix.clone()]); }
    k.m(back, k.merge(sp), spine, 0, 0, 0);
    for (const s of [-1, 1]) { const h = k.m(back, k.Hs(16, 8), husk, s * 0.2, 0.25, -0.02, 0.2, 0.27, 0.2); h.rotation.set(0, 0, s * PI / 2 + s * 0.3); }
    const glow = asc >= 3 ? k.m(back, k.S(14, 10), k.glow('#FF9A2A', 1.6, 0.35), 0, 0.3, 0, 0.36) : null;
    // os gêmeos
    const twins = [];
    for (const s of [-1, 1]) {
      const P = pequi(k, T, body, s * 0.2, 0, 0.1, 0.19 + (s > 0 ? 0 : 0.01), mats, { lean: s * 0.4 });
      P.g.rotation.y = -s * 0.15;
      if (asc >= 3) { const gm = k.mat('#FFC83A', { metalness: 0.85, roughness: 0.25, emissive: '#B06A00', emissiveIntensity: 0.45 }); k.m(P.fruit, k.Hs(16, 6), gm, 0, 0.05, 0, 0.2, 0.17, 0.2); }
      twins.push({ ...P, s });
    }
    const reset = k.rig(root);

    function anim(st, t, p) {
      reset();
      if (glow) glow.scale.setScalar(0.36 * (1 + 0.06 * sin(t * 3)));
      const all = [...twins[0].eyes, ...twins[1].eyes];
      if (st === 'atk') {
        const { w, s } = AP(p);
        for (const P of twins) {
          const d = P.s < 0 ? lin(p, 0.3, 0.5) : lin(p, 0.4, 0.6), b = sin(d * PI);
          P.g.position.z = 0.1 - 0.06 * w + 0.35 * b; P.g.position.y = 0.12 * b;
          P.fruit.rotation.x = -0.3 * w + 0.5 * b; P.g.position.x = P.s * (0.2 - 0.07 * b);
        }
        back.rotation.x = -0.15 * w;
        k.eyes(all, 1 - 0.35 * w); k.look(all, 0, -0.1);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        for (const P of twins) { P.g.position.z = 0.1 - 0.12 * h; P.fruit.rotation.x = -0.35 * h; P.g.position.x = P.s * (0.2 + 0.06 * h); P.fruit.scale.set(1 + 0.1 * h, 1 - 0.1 * h, 1 + 0.1 * h); }
        if (h > 0.12) k.shut(all, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.4);
        for (const P of twins) { P.fruit.rotation.z = P.s * -0.25; P.g.position.x = P.s * 0.17; P.fruit.scale.set(1 + 0.025 * b, 1 + 0.03 * b, 1); }
        k.shut(all, true);
        return;
      }
      if (st === 'entra') {
        for (const P of twins) { const d = lin(p, P.s < 0 ? 0.1 : 0.3, P.s < 0 ? 0.6 : 0.8); P.g.scale.setScalar(mx(0.05, sm(d) * (1 + 0.2 * sin(d * PI)))); P.g.position.y = 0.3 * sin(d * PI); }
        back.scale.setScalar(mx(0.05, sm(lin(p, 0, 0.4))));
        k.eyes(all, 1);
        return;
      }
      // idle: os dois balançam em contratempo e trocam olhares
      for (const P of twins) {
        const ph = t * 2.6 + (P.s > 0 ? PI : 0);
        P.g.position.y = 0.025 * abs(sin(ph)); P.fruit.rotation.z = 0.08 * sin(ph);
      }
      const u = fr(t, 4) * 4, lk = u > 1.5 && u < 2.6 ? 1 : 0;
      k.look(twins[0].eyes, 0.35 * lk, 0); k.look(twins[1].eyes, -0.35 * lk, 0);
      k.eyes(all, blink(t, 3.3, 0.5));
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ MARIPOSA CURANDEIRA (joaninha-curandeira) — mariposa gorducha, gola felpuda, asas verde-menta com olhos falsos, pó que cura
  window.CHAR3D['joaninha-curandeira'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const fur = k.corpo(k.mat('#B8B2A8', { roughness: 1 })), furL = k.mat('#F2EEE6', { roughness: 1 }), furD = k.mat('#6E665E', { roughness: 1 });
    const wTex = k.tex(128, 128, (g, w, h) => {
      const gr = g.createRadialGradient(w * 0.2, h * 0.5, 4, w * 0.5, h * 0.5, w * 0.7); gr.addColorStop(0, '#A8E8C8'); gr.addColorStop(0.6, '#3FB585'); gr.addColorStop(1, '#1E6A50');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(30,80,60,0.5)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h * i / 5); g.stroke(); }
    });
    const wingM = k.mat('#FFFFFF', { map: wTex, roughness: 0.7, side: T.DoubleSide });
    const spotD = k.mat('#1E2A24', { roughness: 0.6 }), spotO = asc >= 3 ? k.glow('#FFB040', 2.0) : k.mat('#E8962A', { roughness: 0.5 });
    const dustM = asc >= 3 ? k.glow('#FFD24A', 2.2) : k.glow('#C8FFE0', 1.8, 0.9);
    const body = k.g(root);
    const torso = k.g(body, 0, 0.55, 0);
    k.m(torso, k.S(18, 14), fur, 0, 0, -0.04, 0.17, 0.17, 0.2);
    const abd = k.g(torso, 0, -0.06, -0.16); abd.rotation.x = 0.5;
    k.rot(k.m(abd, k.S(16, 12), k.mat('#FFFFFF', { map: listras(k, '#A8A296', '#7A7268', 4, 0.2), roughness: 1 }), 0, 0, -0.1, 0.14, 0.2, 0.14), PI / 2, 0, 0);
    // gola felpuda
    const col = [];
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; col.push([k.S(8, 6), k.M(cos(a) * 0.15, 0.1 + 0.02 * sin(a * 3), sin(a) * 0.14 + 0.03, 0, 0, 0, 0.07)]); }
    k.m(torso, k.merge(col), furL, 0, 0, 0);
    const legs = [];
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const lg = k.g(torso, s * 0.08, -0.12, 0.04 - i * 0.08); lg.rotation.z = s * 0.5; k.m(lg, k.Cap(0.016, 0.08, 2, 5), furD, 0, -0.05, 0); legs.push(lg); }
    // asas
    const wings = [];
    for (const s of [-1, 1]) {
      const w = k.g(torso, s * 0.1, 0.06, -0.06); w.rotation.set(0, 0, s * 0.3);
      const fw = k.m(w, k.S(16, 10), wingM, s * 0.25, 0.05, 0, 0.28, 0.2, 0.012); fw.rotation.z = s * 0.25;
      const hw = k.m(w, k.S(14, 10), wingM, s * 0.17, -0.15, -0.02, 0.18, 0.14, 0.012); hw.rotation.z = -s * 0.3;
      wings.push({ w, s });
      const spot = k.g(w, s * 0.3, 0.07, 0.0); spot.rotation.z = s * 0.25;
      for (const z of [-1, 1]) {
        k.m(spot, k.S(12, 6), spotD, 0, 0, z * 0.012, 0.075, 0.075, 0.006);
        k.m(spot, k.S(12, 6), spotO, 0, 0, z * 0.016, 0.052, 0.052, 0.006);
        k.m(spot, k.S(8, 6), spotD, 0, 0, z * 0.02, 0.026, 0.026, 0.005);
      }
      if (asc >= 3) k.m(spot, k.S(12, 6), k.glow('#FFD070', 1.6, 0.4), 0, 0, 0, 0.1, 0.1, 0.03);
    }
    // cabeça
    const head = k.g(torso, 0, 0.17, 0.1);
    k.m(head, k.S(20, 16), fur, 0, 0, 0, 0.15, 0.14, 0.14);
    const eyes = [];
    for (const s of [-1, 1]) eyes.push(k.eye(head, s * 0.068, 0.0, 0.11, 0.06, { ry: s * 0.35, brow: -0.1, browM: furD }));
    const ant = [];
    for (const s of [-1, 1]) {
      const a = k.g(head, s * 0.05, 0.12, 0.05); a.rotation.set(-0.5, 0, -s * 0.45);
      const L = [[k.Cy(0.008, 0.008, 5), k.M(0, 0.09, 0, 0, 0, 0, 1, 0.18, 1)]];
      for (let i = 0; i < 6; i++) for (const q of [-1, 1]) L.push([k.Cy(0.004, 0.004, 4), k.M(q * 0.02, 0.04 + i * 0.022, 0, 0, 0, q * 1.1, 1, 0.045 - Math.abs(i - 2.5) * 0.006, 1)]);
      k.m(a, k.merge(L), furD, 0, 0, 0);
      ant.push(a);
    }
    const dust = k.sparks(root, 6, dustM, 0.02);
    const reset = k.rig(root, [dustM]);

    function anim(st, t, p) {
      reset();
      for (const s of dust) s.visible = false;
      if (st === 'atk') {
        const { w, s } = AP(p);
        body.position.y = 0.05 * w; body.position.z = -0.06 * w + 0.12 * s;
        for (const a of wings) { a.w.rotation.z = a.s * (0.3 + 0.9 * w - 0.9 * s); a.w.rotation.y = -a.s * 0.9 * s; }
        torso.rotation.x = -0.15 * w + 0.2 * s;
        k.burst(dust, lin(p, 0.36, 0.95), 0.8, 0.55, 1);
        k.eyes(eyes, 1 - 0.3 * w);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        body.position.z = -0.12 * h; body.position.y = -0.05 * h; torso.rotation.z = 0.35 * h * sin(p * 20);
        for (const a of wings) a.w.rotation.z = a.s * (0.3 - 0.6 * h);
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.3);
        body.position.y = -0.36; for (const l of legs) l.rotation.z *= 1.6;
        for (const a of wings) { a.w.rotation.z = -a.s * 0.5; a.w.rotation.y = a.s * 0.5; }
        torso.scale.set(1 + 0.03 * b, 1 + 0.03 * b, 1);
        for (const a of ant) a.rotation.x = 0.2;
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const f = 1 - seg(p, 0.1, 0.85);
        body.position.set(0.3 * f * sin(p * 8), 0.5 * f, -0.5 * f);
        for (const a of wings) a.w.rotation.z = a.s * (0.3 + 0.9 * sin(p * 28));
        k.burst(dust, lin(p, 0.5, 1), 0.6, 0.55, 0);
        k.eyes(eyes, 1);
        return;
      }
      // idle: batidas lentas e largas, pó de cura caindo, antenas plumosas mexem
      const fl = sin(t * 4.2);
      for (const a of wings) a.w.rotation.z = a.s * (0.3 + 0.55 * fl);
      body.position.y = 0.05 * sin(t * 4.2 + 1);
      for (let i = 0; i < ant.length; i++) ant[i].rotation.x = -0.5 + 0.15 * sin(t * 2 + i);
      k.rise(dust, -t, 2.4, 0.5, 0.35, 0.1, 1);
      k.eyes(eyes, blink(t, 3.5, 0.6)); k.look(eyes, sin(t * 0.7) * 0.2, 0);
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ ERVA-DE-PASSARINHO (pe-de-maracuja) — emaranhado de cipó com frutinhas vermelhas e cara sonsa no nó do meio
  window.CHAR3D['pe-de-maracuja'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const vine = k.corpo(k.mat('#4E6A2A', { roughness: 0.75 })), vineD = k.mat('#34481C', { roughness: 0.8 }), knot = k.mat('#6A6A30', { roughness: 0.7 });
    const leaf = k.mat('#4E9A3A', { roughness: 0.6 }), leafL = k.mat('#7CBF4A', { roughness: 0.6 }), berry = k.mat('#C81E2A', { roughness: 0.3 });
    const dark = k.mat('#1E1A10', { roughness: 0.5 });
    const body = k.g(root);
    // raízes
    const rt = [];
    for (let i = 0; i < 5; i++) { const a = i * TAU / 5 + 0.3; rt.push([k.Cy(1, 0.6, 5), k.M(cos(a) * 0.1, 0.03, sin(a) * 0.1, sin(a) * 0.9, 0, -cos(a) * 0.9, 0.025, 0.14, 0.025)]); }
    k.m(body, k.merge(rt), vineD, 0, 0, 0);
    const core = k.g(body, 0, 0.42, 0);
    // emaranhado (nó de toro) + nó do meio com o rosto
    const tangle = k.m(core, new T.TorusKnotGeometry(0.2, 0.04, 64, 6, 2, 3), vine, 0, 0.02, -0.04, 1, 1.15, 0.8);
    k.m(core, k.Cy(0.06, 0.09, 8), vineD, 0, -0.25, 0, 1, 0.3, 1);
    const face = k.g(core, 0, 0, 0.05);
    k.m(face, k.S(20, 16), knot, 0, 0, 0, 0.18, 0.17, 0.15);
    const eyes = [];
    for (const s of [-1, 1]) { const e = k.eye(face, s * 0.075, 0.03, 0.12, 0.058, { ry: s * 0.35, brow: s < 0 ? 0.35 : -0.1, browM: dark }); const lid = k.m(e.open, k.S(12, 8), knot, 0, 0.04, 0.01, 0.068, 0.04, 0.05); eyes.push(e); }
    const mouth = k.g(face, 0.02, -0.07, 0.14); mouth.rotation.z = PI + 0.25;
    k.m(mouth, k.To(0.04, 0.009, 5, 10, PI * 0.8), dark, 0, 0, 0);
    // folhas e frutinhas
    const L = [], B = [];
    for (let i = 0; i < 12; i++) { const a = i * 2.39996, y = -0.12 + (i % 4) * 0.1; L.push([k.S(8, 6), k.M(cos(a) * 0.22, y, sin(a) * 0.17 - 0.02, 0, -a, 0.6 * ((i % 3) - 1), 0.07, 0.02, 0.045)]); }
    k.m(core, k.merge(L), leaf, 0, 0, 0);
    const BP = [];
    for (let i = 0; i < 9; i++) { const a = i * 2.1 + 0.5, y = -0.05 + (i % 3) * 0.11, r = 0.2 + (i % 2) * 0.03; BP.push([cos(a) * r, y + 0.04, sin(a) * r * 0.8]); B.push([k.S(10, 8), k.M(cos(a) * r, y + 0.04, sin(a) * r * 0.8, 0, 0, 0, 0.032)]); }
    k.m(core, k.merge(B), berry, 0, 0, 0);
    if (asc >= 3) k.m(core, k.merge(BP.map(q => [k.S(8, 6), k.M(q[0], q[1], q[2], 0, 0, 0, 0.055)])), k.glow('#FF5A3A', 1.8, 0.45), 0, 0, 0);
    // gavinhas que buscam as vizinhas (cadeias)
    const tend = [];
    for (const s of [-1, 1]) {
      let par = k.g(core, s * 0.2, -0.02, 0.0); par.rotation.z = -s * 1.3;
      const ch = [];
      for (let i = 0; i < 3; i++) { const sg = k.g(par, 0, i ? 0.13 : 0, 0); sg.rotation.z = s * 0.25; k.m(sg, k.Cy(0.018 - i * 0.004, 0.022 - i * 0.004, 6), vine, 0, 0.065, 0, 1, 0.14, 1); if (i === 1) k.rot(k.m(sg, k.S(8, 6), leafL, s * 0.03, 0.06, 0, 0.05, 0.015, 0.03), 0, 0, s * 0.5); ch.push(sg); par = sg; }
      const curl = k.g(par, 0, 0.13, 0); k.rot(k.m(curl, k.To(0.035, 0.008, 4, 10, PI * 1.5), vine, -s * 0.03, 0.02, 0), 0, 0, 0);
      tend.push({ ch, s, curl });
    }
    const reset = k.rig(root);

    function anim(st, t, p) {
      reset();
      if (st === 'atk') {
        const { w, s } = AP(p);
        core.rotation.x = -0.15 * w + 0.25 * s; core.position.z = 0.1 * s;
        for (const g of tend) { g.ch[0].rotation.y = -g.s * (0.3 * w - 1.4 * s) * -1; g.ch[0].rotation.z = -g.s * (1.3 - 0.4 * w + 0.2 * s); for (let i = 1; i < 3; i++) g.ch[i].rotation.z = g.s * (0.25 + 0.4 * w - 0.3 * s); g.curl.rotation.z = 2 * s; }
        tangle.rotation.z = 0.3 * s;
        k.eyes(eyes, 1.2 - 0.4 * w); k.look(eyes, 0, -0.1);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        core.rotation.x = -0.3 * h; core.position.z = -0.08 * h; core.rotation.z = 0.15 * sin(p * 25) * h;
        for (const g of tend) g.ch[0].rotation.z = -g.s * (1.3 + 0.5 * h);
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.2);
        core.rotation.x = 0.15; core.position.y -= 0.03; core.scale.set(1 + 0.02 * b, 1 + 0.025 * b, 1);
        for (const g of tend) { g.ch[0].rotation.z = -g.s * 2.0; for (let i = 1; i < 3; i++) g.ch[i].rotation.z = g.s * 0.6; }
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const g0 = sm(lin(p, 0, 0.6));
        core.scale.setScalar(mx(0.05, g0)); core.position.y = 0.42 * g0;
        tangle.rotation.z = (1 - g0) * 3;
        for (const g of tend) { const e = sm(lin(p, 0.5, 1)); g.ch[0].scale.setScalar(mx(0.05, e)); }
        k.eyes(eyes, 1);
        return;
      }
      // idle: gavinhas tateiam para os lados, o emaranhado gira devagar, olhar de lado
      for (const g of tend) { for (let i = 0; i < 3; i++) g.ch[i].rotation.z = g.s * (0.25 + 0.15 * sin(t * 1.6 + i * 0.8 + g.s)); g.curl.rotation.z = 0.4 * sin(t * 2 + g.s); }
      tangle.rotation.z = 0.08 * sin(t * 0.7);
      core.rotation.y = 0.12 * sin(t * 0.6); core.scale.set(1, 1 + 0.02 * sin(t * 1.8), 1);
      k.eyes(eyes, 0.9 * blink(t, 3.7, 0.1)); k.look(eyes, 0.3 + 0.1 * sin(t * 0.8), 0);
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ SAÚVA CARREGADEIRA (formiga-carregadeira) — saúva vermelha com uma folha enorme de escudo
  window.CHAR3D['formiga-carregadeira'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const red = k.corpo(k.mat('#8E2814', { roughness: 0.4 })), redD = k.mat('#5A160A', { roughness: 0.45 }), dark = k.mat('#1E120E', { roughness: 0.4 });
    const lTex = k.tex(128, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#2E7A2A'); gr.addColorStop(0.5, '#58A83A'); gr.addColorStop(1, '#2E7A2A'); g.fillStyle = gr; g.fillRect(0, 0, w, h);  });
    const leafM = k.mat('#FFFFFF', { map: lTex, roughness: 0.6, side: T.DoubleSide });
    const body = k.g(root, 0, 0.065, 0);
    const torso = k.g(body, 0, 0.34, -0.05); torso.rotation.x = -0.5;
    k.m(torso, k.S(16, 12), red, 0, 0, 0, 0.1, 0.13, 0.1);
    const gaster = k.g(torso, 0, -0.12, -0.12);
    k.m(gaster, k.S(18, 14), redD, 0, 0, -0.06, 0.15, 0.14, 0.18);
    const legs = [];
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) {
      const lg = k.g(body, s * 0.08, 0.27, -0.06 - i * 0.1); lg.rotation.set(0, 0, s * 0.9);
      k.m(lg, k.Cap(0.018, 0.12, 2, 5), redD, 0, -0.08, 0);
      const lo = k.g(lg, 0, -0.16, 0); lo.rotation.z = -s * 1.2; k.m(lo, k.Cap(0.014, 0.12, 2, 5), dark, 0, -0.08, 0);
      legs.push({ lg, lo, s });
    }
    // cabeça grande
    const head = k.g(body, 0, 0.6, 0.04);
    k.m(head, k.S(22, 16), red, 0, 0, 0, 0.19, 0.17, 0.17);
    for (const s of [-1, 1]) k.m(head, k.S(10, 8), red, s * 0.11, 0.1, -0.05, 0.08, 0.08, 0.08);
    const eyes = [];
    for (const s of [-1, 1]) eyes.push(k.eye(head, s * 0.085, 0.03, 0.12, 0.06, { ry: s * 0.4, brow: 0.45, browM: dark }));
    const mand = [];
    for (const s of [-1, 1]) { const m = k.g(head, s * 0.06, -0.09, 0.12); m.rotation.y = s * 0.4; k.rot(k.m(m, k.Co(6), dark, 0, 0, 0.04, 0.02, 0.09, 0.015), PI / 2, 0, -s * 0.5); mand.push({ m, s }); }
    const ant = [];
    for (const s of [-1, 1]) { const a = k.g(head, s * 0.06, 0.13, 0.08); a.rotation.set(-0.3, 0, -s * 0.5); k.m(a, k.Cy(0.009, 0.009, 5), dark, 0, 0.07, 0, 1, 0.14, 1); const e2 = k.g(a, 0, 0.14, 0); e2.rotation.x = 1.0; k.m(e2, k.Cy(0.008, 0.006, 5), dark, 0, 0.06, 0, 1, 0.12, 1); ant.push(a); }
    // braços e a folha-escudo
    const arms = [];
    for (const s of [-1, 1]) { const a = k.g(body, s * 0.09, 0.44, 0.04); a.rotation.set(-1.0, 0, s * 0.3); k.m(a, k.Cap(0.018, 0.13, 2, 5), redD, 0, 0.08, 0); arms.push({ a, s }); }
    const shield = k.g(body, -0.16, 0.45, 0.2); shield.rotation.set(-0.15, -0.55, 0.1);
    const lf = k.m(shield, k.S(20, 14), leafM, 0, 0.0, 0, 0.27, 0.36, 0.03);
    k.m(shield, k.Cy(0.012, 0.012, 5), k.mat('#3E6A22', { roughness: 0.7 }), 0, -0.4, -0.01, 1, 0.12, 1);
    {
      const gv = asc >= 3 ? k.mat('#FFC83A', { metalness: 0.85, roughness: 0.25, emissive: '#B07000', emissiveIntensity: 0.6 }) : k.mat('#A8D86A', { roughness: 0.6 });
      const V = [[k.Cy(1, 1, 5), k.M(0, 0, 0.033, 0, 0, 0, 0.008, 0.68, 0.008)]];
      for (let i = 1; i < 6; i++) for (const q of [-1, 1]) { const y = -0.34 + i * 0.115; V.push([k.Cy(1, 1, 4), k.M(q * 0.09, y + 0.04, 0.032, 0, 0, -q * 1.0, 0.006, 0.2 - Math.abs(y) * 0.2, 0.006)]); }
      k.m(shield, k.merge(V), gv, 0, 0, 0);
    }
    if (asc >= 3) k.m(shield, k.To(1, 0.025, 5, 40), k.mat('#FFC83A', { metalness: 0.85, roughness: 0.25, emissive: '#C88000', emissiveIntensity: 0.8 }), 0, 0, 0.0, 0.27, 0.36, 1);
    const reset = k.rig(root);

    function anim(st, t, p) {
      reset();
      if (st === 'atk') {
        const { w, s } = AP(p);
        body.position.z = -0.1 * w + 0.32 * s;
        shield.position.z = 0.2 - 0.08 * w + 0.15 * s; shield.position.x = -0.16 + 0.14 * s; shield.rotation.y = -0.55 + 0.55 * s; shield.rotation.x = -0.15 - 0.3 * w + 0.35 * s;
        head.rotation.x = 0.2 * w - 0.1 * s;
        for (const a of arms) a.a.rotation.x = -1.0 - 0.4 * w + 0.5 * s;
        for (const l of legs) l.lg.rotation.x = (l.s * 0.3) * s;
        for (const m of mand) m.m.rotation.y = m.s * (0.4 + 0.4 * s);
        k.eyes(eyes, 1 - 0.35 * w); k.look(eyes, 0, -0.1);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        body.position.z = -0.12 * h; shield.rotation.x = -0.15 - 0.5 * h; shield.position.z = 0.2 - 0.1 * h; head.rotation.z = 0.2 * h;
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.4);
        body.position.y = -0.06; head.rotation.x = 0.35; head.position.z += 0.02;
        shield.rotation.x = -1.2; shield.position.y = 0.2; shield.position.z = 0.2;
        for (const a of arms) a.a.rotation.x = -0.4;
        torso.scale.set(1 + 0.03 * b, 1 + 0.03 * b, 1);
        for (const a of ant) a.rotation.x = 0.3;
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const step = sin(p * 18) * (1 - seg(p, 0.7, 0.8));
        body.position.z = -0.4 * (1 - seg(p, 0, 0.7));
        for (const l of legs) l.lg.rotation.x = 0.4 * step * l.s;
        const up = seg(p, 0.7, 0.85) * (1 - seg(p, 0.92, 1));
        shield.position.y = 0.45 + 0.2 * up; shield.rotation.x = -0.15 - 0.6 * up;
        k.eyes(eyes, 1);
        return;
      }
      // idle: firme atrás da folha, antenas tateiam, pezinhos marcam passo
      for (let i = 0; i < ant.length; i++) ant[i].rotation.x = -0.3 + 0.25 * sin(t * 3.1 + i * 1.7);
      for (let i = 0; i < legs.length; i++) legs[i].lg.rotation.x = 0.12 * sin(t * 5 + i * 1.6) * (sin(t * 0.8) > 0.3 ? 1 : 0);
      shield.rotation.z = 0.1 + 0.05 * sin(t * 1.2); shield.position.y = 0.45 + 0.01 * sin(t * 2.4);
      torso.scale.set(1, 1 + 0.02 * sin(t * 2.4), 1);
      for (const m of mand) m.m.rotation.y = m.s * (0.4 + 0.15 * abs(sin(t * 2.2)));
      k.eyes(eyes, blink(t, 3.3, 0.9)); k.look(eyes, sin(t * 0.7) * 0.2, 0);
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ PÕE-MESA (louva-a-deus) — louva-a-deus verde-folha, foices dobradas, cabeça triangular, capa em forma de folha
  window.CHAR3D['louva-a-deus'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const green = k.corpo(k.mat('#5E9A34', { roughness: 0.55 })), greenD = k.mat('#3A6A22', { roughness: 0.6 }), greenL = k.mat('#9CCB52', { roughness: 0.55 });
    const capeTex = k.tex(64, 128, (g, w, h) => { g.fillStyle = '#3E7A2A'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8CC456'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke(); for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(w / 2, h * i / 8); g.lineTo(2, h * i / 8 + 10); g.moveTo(w / 2, h * i / 8); g.lineTo(w - 2, h * i / 8 + 10); g.stroke(); } });
    const capeM = k.mat('#FFFFFF', { map: capeTex, roughness: 0.65, side: T.DoubleSide });
    const dark = k.mat('#1A2410', { roughness: 0.4 }), eyeM = k.mat('#D8E89A', { roughness: 0.3 });
    const body = k.g(root);
    // pernas finas (4)
    const legs = [];
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) {
      const lg = k.g(body, s * 0.06, 0.34, -0.04 - i * 0.12); lg.rotation.set(i ? 0.3 : -0.2, 0, s * 0.6);
      k.m(lg, k.Cy(0.012, 0.012, 5), greenD, 0, -0.1, 0, 1, 0.2, 1);
      const lo = k.g(lg, 0, -0.2, 0); lo.rotation.z = -s * 0.9; k.m(lo, k.Cy(0.01, 0.008, 5), greenD, 0, -0.1, 0, 1, 0.2, 1);
      legs.push(lg);
    }
    const abd = k.g(body, 0, 0.36, -0.1); abd.rotation.x = 1.0;
    k.m(abd, k.S(14, 10), greenL, 0, -0.18, 0, 0.09, 0.24, 0.07);
    const torso = k.g(body, 0, 0.38, 0); torso.rotation.x = -0.25;
    k.m(torso, k.Cap(0.055, 0.32, 3, 10), green, 0, 0.2, 0);
    // capa-folha nas costas
    const cape = k.g(torso, 0, 0.32, -0.06); cape.rotation.x = 0.35;
    k.m(cape, k.S(16, 12), capeM, 0, -0.22, -0.02, 0.17, 0.3, 0.02);
    // braços-foice dobrados (2 segmentos com espinhos)
    const arms = [];
    for (const s of [-1, 1]) {
      const sh = k.g(torso, s * 0.06, 0.32, 0.04); sh.rotation.set(-1.9, 0, s * 0.15);
      k.m(sh, k.Cap(0.03, 0.18, 3, 8), green, 0, 0.12, 0);
      const fo = k.g(sh, 0, 0.25, 0); fo.rotation.x = 2.6;
      const bl = [[k.Cap(0.024, 0.18, 3, 6), k.M(0, 0.11, 0)]];
      for (let i = 0; i < 4; i++) bl.push([k.Co(4), k.M(0, 0.04 + i * 0.045, 0.025, 0.5, 0, 0, 0.008, 0.035, 0.008)]);
      k.m(fo, k.merge(bl), greenL, 0, 0, 0);
      if (asc >= 3) k.m(fo, k.Cap(0.008, 0.2, 2, 5), k.glow('#E8FFB8', 2.4, 1, '#C8FF6A'), 0, 0.12, 0.03);
      arms.push({ sh, fo, s });
    }
    // cabeça triangular
    const head = k.g(torso, 0, 0.5, 0.03);
    const tri = new T.CylinderGeometry(0.17, 0.05, 0.16, 3, 1);
    k.rot(k.m(head, tri, green, 0, -0.02, 0, 1, 1, 0.55), PI / 2, PI, 0);
    k.m(head, k.S(14, 10), green, 0, 0.02, -0.02, 0.12, 0.09, 0.08);
    const eyes = [];
    for (const s of [-1, 1]) eyes.push(k.eye(head, s * 0.12, 0.06, 0.03, 0.06, { ry: s * 0.7, whiteM: eyeM, pupil: 0.45, brow: 0.5, browM: greenD }));
    const ant = [];
    for (const s of [-1, 1]) { const a = k.g(head, s * 0.03, 0.09, 0.02); a.rotation.set(-0.6, 0, -s * 0.5); k.m(a, k.Cy(0.005, 0.004, 4), greenD, 0, 0.12, 0, 1, 0.24, 1); ant.push(a); }
    k.m(head, k.S(8, 6), dark, 0, -0.08, 0.06, 0.03, 0.02, 0.02);
    const reset = k.rig(root);

    function anim(st, t, p) {
      reset();
      if (st === 'atk') {
        const { w, s } = AP(p);
        torso.rotation.x = -0.25 - 0.25 * w + 0.45 * s; body.position.z = -0.06 * w + 0.22 * s;
        for (const a of arms) {
          const d = a.s < 0 ? lin(p, 0.34, 0.5) : lin(p, 0.42, 0.58), b = sin(d * PI) * (d < 1 ? 1 : 0) + (d >= 1 ? 0 : 0);
          a.sh.rotation.x = -1.9 - 0.7 * w + 1.6 * sm(d) * (1 - seg(p, 0.65, 0.98));
          a.fo.rotation.x = 2.6 - 1.4 * w - 1.0 * b;
          a.sh.rotation.z = a.s * (0.15 + 0.4 * w);
        }
        cape.rotation.x = 0.35 + 0.4 * s;
        k.eyes(eyes, 1); k.look(eyes, 0, -0.2);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        torso.rotation.x = -0.25 - 0.4 * h; body.position.z = -0.1 * h; head.rotation.z = 0.3 * h;
        for (const a of arms) a.sh.rotation.z = a.s * (0.15 + 0.6 * h);
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.2);
        torso.rotation.x = 0.1; head.rotation.x = 0.4; body.position.y = -0.04;
        for (const a of arms) { a.sh.rotation.x = -2.4; a.fo.rotation.x = 2.9; }
        cape.rotation.x = 0.2 + 0.03 * b; torso.scale.set(1, 1 + 0.02 * b, 1);
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const up = sm(lin(p, 0, 0.6)), pose = seg(p, 0.6, 0.8) * (1 - seg(p, 0.92, 1));
        torso.rotation.x = -0.25 + 1.0 * (1 - up); body.position.y = -0.15 * (1 - up);
        for (const a of arms) { a.sh.rotation.x = -1.9 - 0.9 * pose; a.sh.rotation.z = a.s * (0.15 + 0.5 * pose); }
        cape.rotation.x = 0.35 + 0.6 * pose;
        k.eyes(eyes, 1);
        return;
      }
      // idle: "reza" com as foices juntas, balança como folha ao vento, cabeça gira atenta
      torso.rotation.z = 0.06 * sin(t * 1.1); body.position.x = 0.02 * sin(t * 1.1);
      head.rotation.y = 0.5 * sin(t * 0.5) * (sin(t * 0.25) > 0 ? 1 : 0.3);
      for (const a of arms) { a.sh.rotation.x = -1.9 + 0.08 * sin(t * 1.6); a.fo.rotation.x = 2.6 + 0.06 * sin(t * 1.6 + 1); }
      cape.rotation.x = 0.35 + 0.08 * sin(t * 1.5);
      for (let i = 0; i < ant.length; i++) ant[i].rotation.x = -0.6 + 0.2 * sin(t * 2.3 + i);
      k.eyes(eyes, blink(t, 4.0, 0.2)); k.look(eyes, -0.3 * sin(t * 0.5), 0);
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ---------------------------------------------------------------- vespa (marimbondo): corpo comum da Rainha e do Marimbondo
  function vespa(k, T, root, sc, mats) {
    const body = k.g(root);
    const torso = k.g(body, 0, 0.62 * sc, 0);
    k.m(torso, k.S(18, 14), mats.amber, 0, 0, 0, 0.13 * sc, 0.13 * sc, 0.14 * sc);
    const waist = k.m(torso, k.Cy(0.03, 0.03, 6), mats.blk, 0, -0.1 * sc, -0.08 * sc, sc, 0.1 * sc, sc); waist.rotation.x = 0.8;
    const abd = k.g(torso, 0, -0.14 * sc, -0.14 * sc); abd.rotation.x = 0.7;
    k.rot(k.m(abd, k.S(18, 14), mats.stripe, 0, 0, -0.14 * sc, 0.13 * sc, 0.21 * sc, 0.13 * sc), PI / 2, 0, 0);
    const sting = k.m(abd, k.Co(6), mats.blk, 0, 0, -0.37 * sc, 0.022 * sc, 0.08 * sc, 0.022 * sc); sting.rotation.x = -PI / 2;
    const legs = [];
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const lg = k.g(torso, s * 0.07 * sc, -0.09 * sc, (0.02 - i * 0.08) * sc); lg.rotation.set(0.2 * (i ? 1 : -1), 0, s * 0.35); k.m(lg, k.Cap(0.014 * sc, 0.16 * sc, 2, 5), mats.blk, 0, -0.09 * sc, 0); legs.push(lg); }
    const wings = [];
    for (const s of [-1, 1]) { const w = k.g(torso, s * 0.06 * sc, 0.1 * sc, -0.04 * sc); const wm = k.m(w, k.S(14, 8), mats.wing, s * 0.2 * sc, 0.02 * sc, -0.04 * sc, 0.22 * sc, 0.012, 0.08 * sc); wm.rotation.set(0.5, s * 0.5, 0); wings.push({ w, s }); }
    const head = k.g(torso, 0, 0.19 * sc, 0.06 * sc);
    k.m(head, k.S(20, 16), mats.amber, 0, 0, 0, 0.16 * sc, 0.15 * sc, 0.15 * sc);
    k.m(head, k.S(14, 8), mats.blk, 0, 0.07 * sc, -0.02 * sc, 0.15 * sc, 0.09 * sc, 0.14 * sc);
    const eyes = [];
    for (const s of [-1, 1]) eyes.push(k.eye(head, s * 0.07 * sc, 0.0, 0.115 * sc, 0.06 * sc, { ry: s * 0.38, brow: 0.5, browM: mats.blk }));
    const mand = [];
    for (const s of [-1, 1]) { const m = k.g(head, s * 0.04 * sc, -0.1 * sc, 0.1 * sc); k.rot(k.m(m, k.Co(5), mats.blk, 0, -0.02 * sc, 0, 0.015 * sc, 0.05 * sc, 0.012 * sc), PI, 0, -s * 0.4); mand.push(m); }
    const ant = [];
    for (const s of [-1, 1]) { const a = k.g(head, s * 0.05 * sc, 0.12 * sc, 0.06 * sc); a.rotation.set(-0.5, 0, -s * 0.5); k.m(a, k.Cy(0.007 * sc, 0.006 * sc, 4), mats.blk, 0, 0.08 * sc, 0, 1, 0.16 * sc, 1); ant.push(a); }
    return { body, torso, abd, legs, wings, head, eyes, mand, ant };
  }
  function vespaMats(k, T) {
    return {
      amber: k.corpo(k.mat('#D88A1A', { roughness: 0.45 })), blk: k.mat('#16120E', { roughness: 0.4 }),
      stripe: k.mat('#FFFFFF', { map: listras(k, '#E09A1E', '#16120E', 4, 0.12), roughness: 0.45 }),
      wing: k.mat('#FFFFFF', { map: asaTex(k, '#C8D4E0', '#6A7480'), transparent: true, opacity: 0.5, depthWrite: false, roughness: 0.2, side: T.DoubleSide }),
      paper: k.mat('#FFFFFF', { map: k.tex(64, 32, (g, w, h) => { g.fillStyle = '#9A948A'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6E685E'; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(0, i * 4 + 2); for (let x = 0; x <= w; x += 8) g.lineTo(x, i * 4 + 2 + ((x / 8) % 2) * 2); g.stroke(); } }), roughness: 0.95 })
    };
  }

  // ================================================================ RAINHA-MARIMBONDO (abelha-rainha) — vespa régia listrada, coroa de ninho de papel, lança-ferrão
  window.CHAR3D['abelha-rainha'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const M = vespaMats(k, T);
    const V = vespa(k, T, root, 1.45, M);
    // coroa de papel em camadas
    const crown = k.g(V.head, 0, 0.2, -0.02); crown.scale.setScalar(1.5);
    for (let i = 0; i < 3; i++) k.m(crown, k.Cy(1, 1, 12), M.paper, 0, i * 0.045, 0, 0.13 - i * 0.03, 0.04, 0.13 - i * 0.03);
    for (let i = 0; i < 5; i++) { const a = i * TAU / 5; k.m(crown, k.Co(5), M.paper, cos(a) * 0.12, 0.05, sin(a) * 0.12, 0.025, 0.07, 0.025); }
    let lantern = null, lglow = null;
    if (asc >= 3) {
      lantern = k.g(crown, 0, 0.17, 0);
      k.m(lantern, k.S(16, 12), M.paper, 0, 0.06, 0, 0.11, 0.13, 0.11);
      for (let i = 0; i < 3; i++) k.m(lantern, k.To(0.105 - i * 0.008, 0.006, 4, 16), k.mat('#6E685E', { roughness: 0.9 }), 0, 0.0 + i * 0.06, 0).rotation.x = PI / 2;
      lglow = k.m(lantern, k.S(12, 8), k.glow('#FFB040', 1.5, 0.45), 0, 0.06, 0, 0.16, 0.18, 0.16);
      k.m(lantern, k.S(8, 6), k.glow('#FFD070', 2.2), 0, -0.06, 0.06, 0.025);
    }
    // lança-ferrão na mão direita
    const arm = k.g(V.torso, 0.15, 0.02, 0.1); arm.rotation.set(-0.6, 0, -0.4);
    k.m(arm, k.Cap(0.02, 0.12, 2, 5), M.blk, 0, -0.08, 0);
    const lance = k.g(arm, 0, -0.16, 0.0); lance.rotation.set(0.6, 0, 0.4);
    k.m(lance, k.Cy(0.014, 0.014, 6), M.blk, 0, 0.1, 0, 1, 0.9, 1);
    k.m(lance, k.Co(8), M.amber, 0, 0.66, 0, 0.035, 0.22, 0.035);
    k.m(lance, k.To(0.03, 0.01, 4, 10), M.amber, 0, 0.53, 0).rotation.x = PI / 2;
    const armL = k.g(V.torso, -0.15, 0.02, 0.1); armL.rotation.set(-0.8, 0, 0.5); k.m(armL, k.Cap(0.02, 0.12, 2, 5), M.blk, 0, -0.08, 0);
    const eyes = V.eyes;
    const reset = k.rig(root);

    function anim(st, t, p) {
      reset();
      const buzz = sin(t * 55);
      for (const a of V.wings) a.w.rotation.z = a.s * 0.45 * buzz;
      if (lglow) lglow.scale.set(0.16 * (1 + 0.08 * sin(t * 4)), 0.18 * (1 + 0.08 * sin(t * 4)), 0.16 * (1 + 0.08 * sin(t * 4)));
      if (st === 'atk') {
        const { w, s } = AP(p);
        V.body.position.z = -0.12 * w + 0.4 * s; V.body.position.y = 0.06 * w;
        V.torso.rotation.x = -0.2 * w + 0.3 * s;
        arm.rotation.x = -0.6 - 0.6 * w + 1.2 * s; lance.rotation.x = 0.6 + 0.4 * w + 0.5 * s; arm.position.z = 0.1 + 0.1 * s;
        V.abd.rotation.x = 0.7 + 0.4 * w - 0.3 * s;
        k.eyes(eyes, 1 - 0.3 * w); k.look(eyes, 0, -0.1);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        V.body.position.z = -0.14 * h; V.torso.rotation.x = -0.3 * h; V.head.rotation.z = 0.25 * h; lance.rotation.z = 0.4 + 0.4 * h;
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.2);
        V.body.position.y = -0.3; V.head.rotation.x = 0.35; V.torso.scale.set(1 + 0.02 * b, 1 + 0.02 * b, 1);
        for (const a of V.wings) a.w.rotation.z = -a.s * 0.3;
        for (const l of V.legs) l.rotation.z *= 1.8;
        arm.rotation.x = -0.1; lance.rotation.x = 0.2;
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const f = 1 - seg(p, 0.1, 0.75), r2 = seg(p, 0.75, 0.88) * (1 - seg(p, 0.95, 1));
        V.body.position.set(0, 0.6 * f, -0.5 * f);
        arm.rotation.x = -0.6 - 1.2 * r2; lance.rotation.x = 0.6 + 0.8 * r2;
        V.head.rotation.x = -0.25 * r2;
        k.eyes(eyes, 1);
        return;
      }
      // idle: paira majestosa, lança em guarda, abdômen pulsa, antenas varrem
      V.body.position.y = 0.04 * sin(t * 2);
      V.abd.rotation.x = 0.7 + 0.1 * sin(t * 2.4);
      lance.rotation.z = 0.06 * sin(t * 1.2);
      for (let i = 0; i < V.ant.length; i++) V.ant[i].rotation.x = -0.5 + 0.2 * sin(t * 2.2 + i * 2);
      for (let i = 0; i < V.mand.length; i++) V.mand[i].rotation.y = (i ? 1 : -1) * 0.2 * abs(sin(t * 3));
      k.eyes(eyes, blink(t, 3.6, 0.7)); k.look(eyes, sin(t * 0.6) * 0.2, 0);
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ PEQUI (cereja, ficha) — um pequi sozinho de cara marota
  window.CHAR3D['cereja'] = function (T, kit, o) {
    o = o || {};
    const k = K(T), root = new T.Group();
    const skinTex = k.tex(64, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9CB23E'); gr.addColorStop(1, '#5E7A22'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(220,210,90,0.35)'; for (let i = 0; i < 30; i++) g.fillRect((i * 17) % w, (i * 29) % h, 2, 2); });
    const mats = { skin: k.corpo(k.mat('#FFFFFF', { map: skinTex, roughness: 0.55 })), dark: k.mat('#2A2412', { roughness: 0.5 }), leaf: k.mat('#3E7A2E', { roughness: 0.6 }), cheek: k.mat('#E8A23A', { roughness: 0.8 }) };
    const body = k.g(root);
    const P = pequi(k, T, body, 0, 0, 0, 0.24, mats, { lean: 0.35, brow: 0.3 });
    const eyes = P.eyes;
    const reset = k.rig(root);

    function anim(st, t, p) {
      reset();
      if (st === 'atk') {
        const { w, s } = AP(p);
        P.g.position.z = -0.06 * w + 0.32 * s; P.g.position.y = 0.1 * s;
        P.fruit.rotation.x = -0.3 * w + 0.5 * s; P.fruit.scale.set(1 + 0.1 * w, 1 - 0.1 * w, 1 + 0.1 * w);
        k.eyes(eyes, 1 - 0.35 * w);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        P.g.position.z = -0.1 * h; P.fruit.rotation.x = -0.35 * h; P.fruit.scale.set(1 + 0.1 * h, 1 - 0.12 * h, 1 + 0.1 * h);
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.5);
        P.fruit.rotation.z = 0.2; P.fruit.scale.set(1 + 0.025 * b, 1 + 0.03 * b, 1);
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const d = lin(p, 0, 0.7);
        P.g.scale.setScalar(mx(0.05, sm(d) * (1 + 0.2 * sin(d * PI)))); P.g.position.y = 0.3 * sin(d * PI);
        k.eyes(eyes, 1);
        return;
      }
      // idle: quica de leve e olha de lado
      P.g.position.y = 0.03 * abs(sin(t * 2.6)); P.fruit.rotation.z = 0.08 * sin(t * 2.6);
      k.look(eyes, 0.3 * sin(t * 0.9), 0);
      k.eyes(eyes, blink(t, 2.8, 0.1));
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ MARIMBONDO (zangao, ficha) — vespinha com um capacete de ninho de papel
  window.CHAR3D['zangao'] = function (T, kit, o) {
    o = o || {};
    const k = K(T), root = new T.Group();
    const M = vespaMats(k, T);
    const V = vespa(k, T, root, 0.95, M);
    const helm = k.g(V.head, 0, 0.07, 0);
    k.m(helm, k.Hs(16, 8), M.paper, 0, 0, 0, 0.16, 0.13, 0.16);
    k.m(helm, k.Cy(1, 1, 12), M.paper, 0, 0, 0.0, 0.17, 0.015, 0.17);
    k.m(helm, k.Co(5), M.paper, 0, 0.14, 0, 0.03, 0.06, 0.03);
    const eyes = V.eyes;
    const reset = k.rig(root);

    function anim(st, t, p) {
      reset();
      const buzz = sin(t * 60);
      for (const a of V.wings) a.w.rotation.z = a.s * 0.5 * buzz;
      if (st === 'atk') {
        const { w, s } = AP(p);
        V.body.position.z = -0.08 * w + 0.35 * s; V.body.position.y = 0.08 * w - 0.06 * s;
        V.abd.rotation.x = 0.7 + 0.9 * w + 0.8 * s;
        V.torso.rotation.x = -0.2 * w + 0.35 * s;
        k.eyes(eyes, 1 - 0.3 * w);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        V.body.position.z = -0.12 * h; V.torso.rotation.z = 0.4 * h * sin(p * 20); helm.rotation.z = 0.3 * h;
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        V.body.position.y = -0.22; V.head.rotation.x = 0.3; helm.rotation.x = 0.25;
        for (const a of V.wings) a.w.rotation.z = -a.s * 0.3;
        V.torso.scale.set(1, 1 + 0.03 * sin(t * 1.5), 1);
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const f = 1 - seg(p, 0.05, 0.8);
        V.body.position.set(0.4 * f * sin(p * 10), 0.5 * f, -0.4 * f);
        k.eyes(eyes, 1);
        return;
      }
      // idle: zumbe em zigue-zague, abdômen pronto pra ferroar
      V.body.position.y = 0.05 * sin(t * 3.1); V.body.position.x = 0.04 * sin(t * 1.7);
      V.torso.rotation.z = 0.1 * sin(t * 1.7);
      V.abd.rotation.x = 0.7 + 0.12 * sin(t * 3.1);
      k.eyes(eyes, blink(t, 2.7, 0.3)); k.look(eyes, sin(t * 1.1) * 0.25, 0);
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };
})();
