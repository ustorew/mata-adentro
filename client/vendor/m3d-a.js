// m3d-a.js — modelos 3D v10 (Three.js r149), reino do Sertão: fogo, fúria e aves de agouro (folclore brasileiro).
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

  // ================================================================ FAGULHA SALTADEIRA (espiga-sapeca) — diabrete de brasa que pula da fogueira
  window.CHAR3D['espiga-sapeca'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const flameBody = k.corpo(k.mat('#FFFFFF', { vertexColors: true, emissive: '#7A1802', emissiveIntensity: 0.55, roughness: 0.5 }));
    const coal = k.mat('#2B2326', { roughness: 0.92, emissive: '#3A0A00', emissiveIntensity: 0.4 });
    const tongueA = k.glow('#FFC23A', 1.6, 0.9, '#FF9A1A'), tongueB = k.glow('#F0400E', 1.5, 0.88, '#E8300A');
    const ember = k.glow('#FFE07A', 2.2), mouthM = k.mat('#3A0905', { roughness: 0.4, emissive: '#7A1A00', emissiveIntensity: 0.6 });
    const body = k.g(root);
    const legs = [];
    for (const s of [-1, 1]) {
      const lg = k.g(body, s * 0.11, 0.16, 0);
      k.m(lg, k.Cap(0.055, 0.06), coal, 0, -0.07, 0);
      k.m(lg, k.S(12, 8), coal, 0, -0.125, 0.035, 0.075, 0.045, 0.1);
      legs.push(lg);
    }
    const torso = k.g(body, 0, 0.14, 0);
    const H = 0.8;
    k.m(torso, k.lathe(v => 0.34 * pw(sin(PI * pw(v, 0.62)), 0.85), H, 18, 22, '#8E1404', '#FF9A1E', v => sm(v * 1.1 - 0.05)), flameBody, 0, 0, 0);
    // línguas de fogo no alto da cabeça
    const tongues = [];
    for (const [x, z, h, r, rz, m] of [[0, -0.06, 0.62, 0.15, 0, tongueB], [0, 0.0, 0.42, 0.1, 0.05, tongueA], [-0.14, -0.04, 0.4, 0.1, 0.5, tongueB], [0.15, -0.05, 0.36, 0.09, -0.55, tongueB], [-0.06, -0.14, 0.44, 0.11, 0.25, tongueB], [0.08, -0.13, 0.4, 0.1, -0.3, tongueA]]) {
      const tg = k.g(torso, x, H * 0.62, z); tg.rotation.z = rz;
      const f = k.m(tg, k.drop(), m, 0, 0, 0, r, h, r);
      k.fl(f, 11 + x * 20, 0.16, x * 9 + z * 5);
      tongues.push(tg);
    }
    // chifrinhos de brasa
    for (const s of [-1, 1]) {
      const hg = k.g(torso, s * 0.17, 0.6, 0.06); hg.rotation.set(0.2, 0, -s * 0.45);
      k.m(hg, k.Co(10), coal, 0, 0.06, 0, 0.045, 0.12, 0.045);
      k.m(hg, k.S(8, 6), ember, 0, 0.12, 0, 0.02);
    }
    // bracinhos de carvão
    const arms = [];
    for (const s of [-1, 1]) {
      const a = k.g(torso, s * 0.3, 0.28, 0.02); a.rotation.z = s * 0.7;
      k.m(a, k.Cap(0.04, 0.1), coal, 0, -0.08, 0);
      k.m(a, k.S(10, 8), coal, 0, -0.16, 0.01, 0.052);
      arms.push({ a, s });
    }
    // rosto
    const face = k.g(torso, 0, 0.34, 0.255);
    const eyes = [k.eye(face, -0.1, 0.03, 0.06, 0.085, { ry: -0.3, brow: 0.38, browM: coal }), k.eye(face, 0.1, 0.03, 0.06, 0.085, { ry: 0.3, brow: 0.38, browM: coal })];
    const mouth = k.g(face, 0, -0.115, 0.045);
    k.m(mouth, k.S(14, 8), mouthM, 0, 0, 0, 0.085, 0.04, 0.04);
    for (const s of [-1, 1]) k.rot(k.m(mouth, k.Co(6), k.white, s * 0.045, 0.022, 0.03, 0.014, 0.03, 0.014), PI, 0, 0);
    // faíscas
    const sparks = k.sparks(root, 5, ember, 0.022);
    const burst = k.sparks(torso, 6, ember, 0.03);
    // Asc III: chama-núcleo azul-branca e auréola de faíscas
    let core = null, halo = null, haloS = [];
    if (asc >= 3) {
      const blue = k.glow('#D8F2FF', 2.4, 0.95, '#6FB8FF');
      core = k.g(torso, 0, H * 0.66, 0.0);
      const cf = k.m(core, k.drop(), blue, 0, 0.02, 0.08, 0.1, 0.5, 0.1); k.fl(cf, 13, 0.2, 2);
      halo = k.g(torso, 0, H + 0.08, -0.04); halo.rotation.x = 1.2;
      k.m(halo, k.To(0.3, 0.018, 6, 36), k.glow('#9FD8FF', 2.4, 0.9), 0, 0, 0);
      haloS = k.sparks(halo, 4, blue, 0.03);
    }
    const reset = k.rig(root, [flameBody, coal, ember, tongueA, tongueB]);

    function anim(st, t, p) {
      reset();
      k.flick(t);
      for (const s of sparks) s.visible = false;
      for (const s of burst) s.visible = false;
      if (halo) { halo.rotation.z = t * 1.6; for (let i = 0; i < haloS.length; i++) { const a = t * 1.6 + i * TAU / haloS.length; haloS[i].visible = true; haloS[i].position.set(cos(a) * 0.3, sin(a) * 0.3, 0); haloS[i].scale.setScalar(0.045 * (0.7 + 0.3 * sin(t * 9 + i))); } }
      if (st === 'atk') {
        const { w, s } = AP(p);
        body.position.z = -0.1 * w + 0.24 * s; body.position.y = 0.06 * w;
        torso.rotation.x = -0.3 * w + 0.55 * s;
        body.scale.set(1 + 0.1 * w, 1 - 0.14 * w + 0.08 * s, 1 + 0.1 * w);
        for (const a of arms) { a.a.rotation.x = -1.2 * w + 0.6 * s; a.a.rotation.z = a.s * (0.7 + 0.5 * s); }
        for (const tg of tongues) tg.scale.y = 1 + 0.5 * s;
        flameBody.emissiveIntensity = 0.55 + 0.9 * s;
        const b = seg(p, 0.4, 0.8);
        k.burst(burst, b, 0.5, 0.5, 1);
        k.eyes(eyes, 1 - 0.3 * w); k.look(eyes, 0, -0.1);
        mouth.scale.set(1.2, 1 + 1.4 * s, 1);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        body.position.z = -0.14 * h; body.position.x = sin(p * 40) * 0.03 * h;
        torso.rotation.x = -0.35 * h; torso.rotation.z = 0.15 * h;
        for (const tg of tongues) tg.scale.y = 1 - 0.45 * h;
        for (const a of arms) a.a.rotation.z = a.s * (0.7 + 1.0 * h);
        flameBody.emissiveIntensity = 0.55 + 1.2 * h;
        if (h > 0.15) k.shut(eyes, false);
        mouth.scale.set(0.7, 1.6, 1);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.6);
        body.position.y = -0.1; torso.rotation.x = 0.15;
        torso.scale.set(1 + 0.025 * b, 0.94 + 0.03 * b, 1 + 0.025 * b);
        for (const tg of tongues) tg.scale.set(0.8, 0.55 + 0.08 * b, 0.8);
        for (const a of arms) a.a.rotation.z = a.s * 0.25;
        flameBody.emissiveIntensity = 0.25 + 0.08 * b; tongueA.opacity = 0.55; tongueB.opacity = 0.45;
        legs[0].rotation.x = -1.2; legs[1].rotation.x = -1.2; legs[0].position.z = legs[1].position.z = 0.08;
        k.shut(eyes, true); mouth.scale.set(0.5, 0.6, 1);
        return;
      }
      if (st === 'entra') {
        const g = 1 - pw(1 - lin(p, 0, 0.55), 3), j = sin(lin(p, 0.1, 0.8) * PI);
        body.scale.setScalar(mx(0.05, g * (1 + 0.15 * sin(lin(p, 0.5, 1) * PI))));
        body.position.y = 0.45 * j;
        torso.rotation.y = TAU * seg(p, 0.05, 0.6);
        for (const tg of tongues) tg.scale.y = 1 + 0.6 * j;
        flameBody.emissiveIntensity = 0.55 + 0.8 * (1 - g);
        k.burst(burst, lin(p, 0.6, 1), 0.5, 0.2, 0);
        k.eyes(eyes, 1); mouth.scale.set(1.1, 1.6, 1);
        return;
      }
      // idle: pulinhos que deixam faíscas, chamas tremendo, olhar maroto
      const u = fr(t, 0.62), hop = sin(u * PI);
      body.position.y = 0.11 * hop;
      const sq = 1 - hop;
      body.scale.set(1 + 0.07 * pw(sq, 4), 1 - 0.1 * pw(sq, 4) + 0.03 * hop, 1 + 0.07 * pw(sq, 4));
      torso.rotation.z = sin(t * 2.0) * 0.08; torso.rotation.y = sin(t * 0.8) * 0.25;
      for (const a of arms) a.a.rotation.z = a.s * (0.7 + 0.35 * hop);
      legs[0].rotation.x = 0.3 * hop; legs[1].rotation.x = -0.3 * hop;
      flameBody.emissiveIntensity = 0.55 + 0.12 * sin(t * 7.3);
      k.rise(sparks, t, 1.1, 0.75, 0.22, 0.05, 1);
      k.eyes(eyes, blink(t, 3.0, 0.4)); k.look(eyes, sin(t * 0.8) * 0.25, 0.05);
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ ACAUÃ AGOURENTA (corvo-ladino) — falcão-que-ri, máscara negra, vintém de cobre no bico
  window.CHAR3D['corvo-ladino'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const back = k.corpo(k.mat('#5B3A22', { roughness: 0.7 })), backD = k.mat('#3A2416', { roughness: 0.72 });
    const cream = k.mat('#C7A266', { roughness: 0.78 }), creamL = k.mat('#DCC394', { roughness: 0.78 }), mask = k.mat('#17110F', { roughness: 0.45 });
    const legM = k.mat('#D9A426', { roughness: 0.5 }), claw = k.mat('#1C1612', { roughness: 0.3 }), beakM = k.mat('#2A2523', { roughness: 0.32 });
    const coinM = asc >= 3 ? k.mat('#FFC83A', { metalness: 0.85, roughness: 0.25, emissive: '#C77A00', emissiveIntensity: 0.55 }) : k.mat('#C46A34', { metalness: 0.8, roughness: 0.32, emissive: '#3A1404', emissiveIntensity: 0.3 });
    const tailTex = k.tex(16, 128, (g, w, h) => { g.fillStyle = '#2A1A10'; g.fillRect(0, 0, w, h); g.fillStyle = '#E3D2AA'; for (let i = 0; i < 5; i++) g.fillRect(0, h * (0.2 + i * 0.15), w, h * 0.05); });
    const tailM = k.mat('#FFFFFF', { map: tailTex, roughness: 0.72 });
    const body = k.g(root);
    const legs = [];
    for (const s of [-1, 1]) {
      const lg = k.g(body, s * 0.085, 0.27, 0.02);
      k.m(lg, k.Cy(0.028, 0.024, 8), legM, 0, -0.12, 0, 1, 0.24, 1);
      const foot = k.g(lg, 0, -0.245, 0);
      for (const a of [-0.5, 0, 0.5]) {
        const tg = k.g(foot, 0, 0, 0); tg.rotation.y = a;
        k.rot(k.m(tg, k.Cap(0.018, 0.06, 3, 6), legM, 0, 0.012, 0.045), PI / 2, 0, 0);
        k.rot(k.m(tg, k.Co(6), claw, 0, 0.0, 0.1, 0.014, 0.04, 0.014), PI / 2 + 0.6, 0, 0);
      }
      legs.push({ lg, foot });
    }
    const torso = k.g(body, 0, 0.48, 0);
    k.rot(k.m(torso, k.S(22, 16), back, 0, 0, -0.04, 0.25, 0.27, 0.33), -0.35, 0, 0);
    k.m(torso, k.S(18, 14), creamL, 0, -0.05, 0.11, 0.17, 0.2, 0.18);
    // asas (cobertura + rêmiges escuras)
    const wings = [];
    for (const s of [-1, 1]) {
      const w = k.g(torso, s * 0.22, 0.08, -0.02);
      w.rotation.set(0.45, 0, -s * 0.08);
      k.m(w, k.S(16, 12), back, 0, -0.05, -0.1, 0.07, 0.2, 0.25);
      const tip = k.g(w, s * 0.01, -0.12, -0.3); tip.rotation.x = -0.25;
      k.m(tip, k.S(12, 8), backD, 0, 0, 0, 0.05, 0.1, 0.2);
      if (asc >= 3) { const em = k.glow('#FF6A1A', 2.0, 0.9); k.m(tip, k.S(10, 6), em, s * 0.012, -0.03, -0.16, 0.055, 0.085, 0.11); }
      wings.push({ w, s, tip });
    }
    // cauda listrada
    const tail = k.g(torso, 0, -0.06, -0.26); tail.rotation.x = 0.5;
    k.rot(k.m(tail, k.S(14, 12), tailM, 0, 0, -0.24, 0.085, 0.3, 0.035), PI / 2, 0, 0);
    // cabeça grande creme com a faixa-máscara negra até a nuca
    const head = k.g(body, 0, 0.8, 0.12);
    k.m(head, k.S(24, 18), cream, 0, 0, 0, 0.215, 0.205, 0.215);
    const band = k.m(head, k.S(24, 12), mask, 0, 0.01, -0.014, 0.236, 0.125, 0.23); band.rotation.x = -0.12;
    k.m(head, k.S(12, 8), cream, 0, 0.05, 0.155, 0.075, 0.07, 0.06);
    for (const [x, y, z, r] of [[0, 0.17, -0.1, 0.06], [0, 0.12, -0.17, 0.05]]) k.m(head, k.S(10, 8), cream, x, y, z, r * 1.1, r * 0.8, r * 1.3);
    const eyes = [];
    for (const s of [-1, 1]) eyes.push(k.eye(head, s * 0.105, 0.012, 0.175, 0.068, { ry: s * 0.42, brow: 0.42, browM: mask, pupil: 0.7 }));
    const bk = k.g(head, 0, -0.05, 0.19);
    const up = k.g(bk, 0, 0, 0); up.rotation.x = 0.35;
    k.rot(k.m(up, k.Co(12), beakM, 0, 0, 0.07, 0.065, 0.17, 0.05), PI / 2, 0, 0);
    k.rot(k.m(up, k.Cap(0.02, 0.04, 3, 6), beakM, 0, -0.025, 0.145), 0.7, 0, 0);
    k.m(up, k.S(10, 8), legM, 0, 0.0, 0.0, 0.07, 0.05, 0.04);
    const jaw = k.g(bk, 0, -0.025, -0.01);
    k.rot(k.m(jaw, k.Co(10), beakM, 0, 0, 0.045, 0.04, 0.1, 0.025), PI / 2, 0, 0);
    const coin = k.g(bk, 0, -0.06, 0.15); coin.rotation.set(0.25, 0.7, 0);
    k.rot(k.m(coin, k.Cy(1, 1, 18), coinM, 0, 0, 0, 0.068, 0.014, 0.068), PI / 2, 0, 0.3);
    let embers = [];
    if (asc >= 3) embers = k.sparks(torso, 4, k.glow('#FFB040', 2.2), 0.018);
    const mats = [coinM];
    const reset = k.rig(root, mats);

    function anim(st, t, p) {
      reset();
      if (embers.length) { for (const s of embers) s.visible = false; k.rise(embers, t, 1.4, 0.4, 0.28, -0.05, 1); for (let i = 0; i < embers.length; i++) embers[i].position.z -= 0.25; }
      if (st === 'atk') {
        const { w, s } = AP(p);
        body.position.y = 0.12 * w + 0.2 * s; body.position.z = -0.1 * w + 0.3 * s;
        body.rotation.x = -0.25 * w + 0.35 * s;
        for (const a of wings) { a.w.rotation.z = -a.s * (0.1 + 1.6 * w + 0.9 * s); a.w.rotation.x = 0.45 - 0.5 * w + 0.4 * s; a.tip.rotation.x = -0.25 - 0.4 * w; }
        for (const l of legs) { l.lg.rotation.x = -1.3 * s + 0.3 * w; l.foot.rotation.x = -0.6 * s; }
        head.rotation.x = 0.3 * s - 0.15 * w; tail.rotation.x = 0.5 + 0.5 * w - 0.4 * s;
        jaw.rotation.x = 0.2 * s;
        k.eyes(eyes, 1 - 0.25 * w); k.look(eyes, 0, -0.2 * s);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        body.position.z = -0.14 * h; body.rotation.x = -0.35 * h; body.position.x = sin(p * 40) * 0.025 * h;
        head.rotation.z = 0.3 * h; head.rotation.x = -0.2 * h;
        for (const a of wings) a.w.rotation.z = -a.s * (0.1 + 1.1 * h);
        tail.rotation.x = 0.5 + 0.5 * h; jaw.rotation.x = 0.5 * h;
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.4);
        head.position.y -= 0.13; head.position.z -= 0.06; head.rotation.x = 0.55; head.rotation.y = 0.25;
        torso.scale.set(1 + 0.03 * b, 1 + 0.03 * b, 1 + 0.02 * b); body.position.y = -0.05;
        for (const l of legs) l.lg.scale.y = 0.75;
        tail.rotation.x = 0.35;
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const f = 1 - seg(p, 0.45, 0.92), fl = sin(p * 30);
        body.position.y = 0.7 * f; body.position.z = -0.4 * f; body.rotation.x = 0.4 * f;
        for (const a of wings) { a.w.rotation.z = -a.s * (0.1 + f * (1.6 + 0.5 * fl)); a.w.rotation.x = 0.45 - 0.5 * f; }
        for (const l of legs) l.lg.rotation.x = -0.6 * f;
        const land = seg(p, 0.85, 1);
        head.rotation.x = -0.4 * sin(land * PI); jaw.rotation.x = 0.4 * sin(land * PI);
        k.eyes(eyes, 1);
        return;
      }
      // idle: a risada da acauã (rajadas de "ha-ha" com a cabeça pra trás), cauda que bate, olhar de agouro
      const u = fr(t, 4.2) * 4.2;
      const laugh = u > 1.2 && u < 2.6 ? sin((u - 1.2) / 1.4 * PI) : 0;
      const ha = laugh * (0.5 + 0.5 * sin(u * 22));
      head.rotation.x = -0.4 * laugh + 0.05 * ha; jaw.rotation.x = 0.35 * ha;
      head.rotation.y = sin(t * 0.7) * 0.4 * (1 - laugh);
      body.position.y = 0.012 * ha;
      torso.scale.set(1 + 0.02 * ha, 1 + 0.03 * ha + 0.015 * sin(t * 2), 1 + 0.02 * ha);
      tail.rotation.x = 0.5 + 0.12 * sin(t * 6) * (sin(t * 0.9) > 0.4 ? 1 : 0.2);
      for (const a of wings) a.w.rotation.z = -a.s * (0.08 + 0.04 * sin(t * 2));
      k.eyes(eyes, laugh > 0.3 ? 0.55 : blink(t, 3.3, 0.6)); k.look(eyes, sin(t * 0.7) * 0.25, 0);
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ VIGIA DA PORTEIRA (espantalho-guardiao) — velho vigia de chapéu de couro, capa de palha, candeeiro na vara
  window.CHAR3D['espantalho-guardiao'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const skin = k.corpo(k.mat('#8A5638', { roughness: 0.7 })), pants = k.mat('#3E3A44', { roughness: 0.85 }), boot = k.mat('#3A2216', { roughness: 0.6 });
    const shirt = k.mat('#7C5C3C', { roughness: 0.85 }), leather = k.mat('#6A3F22', { roughness: 0.55 }), leatherD = k.mat('#40240F', { roughness: 0.5 });
    const strawTex = k.tex(64, 64, (g, w, h) => { g.fillStyle = '#B88D3C'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.fillStyle = i % 3 ? '#D9B25A' : '#8E6A2A'; g.fillRect((i * 37) % w, 0, 1 + (i % 2), h); } });
    const straw = k.mat('#FFFFFF', { map: strawTex, roughness: 0.9 }), strawF = k.mat('#C8A04A', { roughness: 0.9 });
    const hair = k.mat('#C9C3BA', { roughness: 0.9 }), wood = k.mat('#6A4527', { roughness: 0.85 }), woodL = k.mat('#7E5733', { roughness: 0.85 });
    const tin = k.mat('#8A8276', { metalness: 0.6, roughness: 0.4 });
    const fc = asc >= 3 ? '#B57BFF' : '#FFB347';
    const flameM = k.glow(fc, 2.4, 0.95), glassM = k.glow(asc >= 3 ? '#9E6CFF' : '#FFC45A', 1.8, 0.8);
    const body = k.g(root);
    // pernas compridas e botas
    const legs = [];
    for (const s of [-1, 1]) {
      const lg = k.g(body, s * 0.085, 0.56, 0);
      k.m(lg, k.Cap(0.055, 0.36, 4, 10), pants, 0, -0.25, 0);
      k.m(lg, k.S(14, 10), boot, 0, -0.5, 0.035, 0.075, 0.06, 0.12);
      legs.push(lg);
    }
    const torso = k.g(body, 0, 0.55, 0);
    k.m(torso, k.lathe(v => 0.15 + 0.03 * sin(PI * v) - 0.04 * v, 0.42, 8, 16), shirt, 0, 0, 0);
    k.rot(k.m(torso, k.To(0.155, 0.022, 6, 20), leatherD, 0, 0.04, 0), PI / 2, 0, 0);
    // capa de palha + franja (uma malha só)
    const cape = k.g(torso, 0, 0.42, -0.01);
    k.m(cape, k.lathe(v => 0.27 - 0.19 * pw(v, 0.8), 0.3, 6, 18), straw, 0, -0.3, 0);
    const fr0 = [];
    for (let i = 0; i < 22; i++) { const a = i / 22 * TAU; fr0.push([k.Co(5), k.M(sin(a) * 0.26, -0.34, cos(a) * 0.26, PI + 0.25 * cos(a) * 0, 0, 0, 0.03, 0.1 + 0.03 * ((i * 7) % 3), 0.03)]); }
    k.m(cape, k.merge(fr0), strawF, 0, 0, 0);
    // cabeça grande
    const head = k.g(torso, 0, 0.63, 0.02);
    k.m(head, k.S(24, 18), skin, 0, 0, 0, 0.2, 0.205, 0.19);
    k.m(head, k.S(12, 10), skin, 0, -0.035, 0.19, 0.048, 0.045, 0.045);
    for (const s of [-1, 1]) k.m(head, k.S(10, 8), skin, s * 0.195, 0, 0, 0.035, 0.05, 0.03);
    const eyes = [];
    for (const s of [-1, 1]) {
      const e = k.eye(head, s * 0.078, 0.03, 0.155, 0.052, { ry: s * 0.3, brow: -0.15, browM: hair });
      const lid = k.m(e.open, k.S(14, 8), skin, 0, 0.032, 0.012, 0.062, 0.042, 0.05); lid.rotation.x = -0.2;
      eyes.push(e);
    }
    const stache = k.g(head, 0, -0.085, 0.175);
    for (const s of [-1, 1]) k.rot(k.m(stache, k.Cap(0.026, 0.07, 3, 8), hair, s * 0.045, -0.01, 0), 0, 0, s * 1.15);
    k.m(head, k.S(12, 8), hair, 0, -0.06, -0.12, 0.17, 0.11, 0.1);
    // chapéu de couro (aba virada na frente)
    const hat = k.g(head, 0, 0.13, 0); hat.rotation.x = -0.12;
    k.m(hat, k.Cy(0.3, 0.3, 24), leather, 0, 0, 0, 1, 0.022, 1);
    k.m(hat, k.lathe(v => 0.155 - 0.03 * v + 0.0 * v, 0.13, 4, 18), leather, 0, 0, 0);
    k.m(hat, k.S(16, 8), leather, 0, 0.13, 0, 0.125, 0.04, 0.125);
    k.m(hat, k.Cy(0.158, 0.158, 18, true), leatherD, 0, 0.03, 0, 1, 0.03, 1);
    const flap = new T.CylinderGeometry(0.3, 0.3, 0.022, 18, 1, false, -PI / 2, PI);
    const fg = k.g(hat, 0, 0.0, 0.0); fg.rotation.x = -0.95;
    k.m(fg, flap, leatherD, 0, 0, 0, 0.98, 1, 0.55);
    // braço direito com a vara e o candeeiro
    const armR = k.g(torso, 0.2, 0.38, 0.02); armR.rotation.set(-0.35, 0, 0.18);
    k.m(armR, k.Cap(0.05, 0.25, 4, 10), shirt, 0, -0.17, 0);
    k.m(armR, k.S(12, 10), skin, 0, -0.36, 0, 0.055);
    const pole = k.g(armR, 0, -0.36, 0); pole.rotation.set(0.35, 0, -0.18);
    k.m(pole, k.Cy(0.022, 0.026, 8), wood, 0, 0.2, 0, 1, 1.25, 1);
    k.rot(k.m(pole, k.To(0.06, 0.012, 5, 10, PI), tin, 0, 0.84, 0.06), 0, PI / 2, 0);
    const lamp = k.g(pole, 0, 0.84, 0.12); lamp.scale.setScalar(1.5);
    const lampB = k.g(lamp, 0, 0, 0);
    k.rot(k.m(lampB, k.To(0.04, 0.007, 4, 10, PI), tin, 0, -0.02, 0), 0, 0, 0);
    k.m(lampB, k.Co(10), tin, 0, -0.07, 0, 0.065, 0.05, 0.065);
    k.m(lampB, k.Cy(0.05, 0.05, 10), glassM, 0, -0.14, 0, 1, 0.1, 1);
    k.m(lampB, k.Cy(0.06, 0.055, 10), tin, 0, -0.2, 0, 1, 0.03, 1);
    const flame = k.m(lampB, k.drop(), flameM, 0, -0.185, 0, 0.026, 0.085, 0.026); k.fl(flame, 14, 0.2, 1);
    // braço esquerdo apoiado na porteira
    const armL = k.g(torso, -0.2, 0.38, 0.02); armL.rotation.set(-0.15, 0, -0.75);
    k.m(armL, k.Cap(0.05, 0.25, 4, 10), shirt, 0, -0.17, 0);
    k.m(armL, k.S(12, 10), skin, 0, -0.36, 0, 0.055);
    // porteira curta de madeira (uma malha)
    const gate = k.g(body, -0.47, 0, -0.02); gate.rotation.y = 0.35;
    const gp = [];
    for (const x of [-0.17, 0.17]) gp.push([k.Bx(), k.M(x, 0.33, 0, 0, 0, 0, 0.065, 0.66, 0.065)]);
    for (const y of [0.2, 0.38, 0.56]) gp.push([k.Bx(), k.M(0, y, 0, 0, 0, 0, 0.36, 0.05, 0.035)]);
    gp.push([k.Bx(), k.M(0, 0.38, 0.012, 0, 0, 0.82, 0.045, 0.46, 0.03)]);
    k.m(gate, k.merge(gp), woodL, 0, 0, 0);
    for (const x of [-0.17, 0.17]) k.m(gate, k.Co(4), wood, x, 0.7, 0, 0.05, 0.08, 0.05);
    let stars = [];
    if (asc >= 3) {
      const sm2 = k.glow('#D9B8FF', 2.0);
      for (const [x, y] of [[-0.08, 0.29], [0.08, 0.47], [0.0, 0.11]]) { const st = k.m(gate, k.Oc(), sm2, x, y, 0.03, 0.06, 0.06, 0.015); st.rotation.z = PI / 4; stars.push(st); }
      k.m(lampB, k.S(10, 8), k.glow('#B57BFF', 1.4, 0.25), 0, -0.14, 0, 0.14);
    }
    const reset = k.rig(root, [flameM, glassM]);

    function anim(st, t, p) {
      reset();
      k.flick(t);
      for (let i = 0; i < stars.length; i++) stars[i].rotation.y = t * 1.5 + i;
      flameM.emissiveIntensity = 2.4 + 0.4 * sin(t * 13) + 0.2 * sin(t * 31);
      if (st === 'atk') {
        const { w, s } = AP(p);
        torso.rotation.y = 0.6 * w - 1.0 * s; torso.rotation.x = -0.1 * w + 0.15 * s;
        armR.rotation.x = -0.35 - 0.5 * w - 0.6 * s; armR.rotation.z = 0.18 + 0.8 * w + 0.2 * s;
        pole.rotation.x = 0.35 - 0.4 * w + 1.0 * s; pole.rotation.z = -0.18 - 0.6 * w + 0.9 * s;
        lamp.rotation.z = -0.8 * s + 0.4 * w; lamp.rotation.x = 0.6 * s;
        body.position.z = 0.12 * s; legs[0].rotation.x = -0.3 * s; legs[1].rotation.x = 0.25 * s;
        head.rotation.y = -0.3 * w + 0.4 * s;
        k.eyes(eyes, 1.15); k.look(eyes, 0.2 * w - 0.2 * s, 0);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        body.position.z = -0.1 * h; torso.rotation.x = -0.25 * h; head.rotation.x = -0.2 * h; hat.rotation.z = 0.3 * h; hat.position.y += 0.05 * h;
        lamp.rotation.z = 0.7 * h * sin(p * 14);
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.2);
        head.rotation.x = 0.42; head.position.y -= 0.03; hat.rotation.x = 0.15;
        torso.rotation.z = 0.08; torso.rotation.x = 0.06; torso.scale.set(1 + 0.02 * b, 1 + 0.02 * b, 1);
        armR.rotation.x = -0.15; pole.rotation.x = 0.15;
        flameM.emissiveIntensity = 1.2 + 0.2 * b; glassM.emissiveIntensity = 0.5;
        stache.position.y += 0.004 * b;
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const a = sin(lin(p, 0, 1) * PI), up = seg(p, 0.2, 0.6) * (1 - seg(p, 0.8, 1));
        body.position.z = -0.25 * (1 - seg(p, 0, 0.5));
        legs[0].rotation.x = 0.4 * sin(p * 12) * (1 - seg(p, 0.5, 0.6)); legs[1].rotation.x = -legs[0].rotation.x;
        armR.rotation.x = -0.35 - 1.6 * up; pole.rotation.x = 0.35 + 1.2 * up; lamp.rotation.x = -1.2 * up;
        flameM.emissiveIntensity = 2.4 + 2 * up;
        hat.rotation.x = -0.12 - 0.2 * a;
        k.eyes(eyes, 1.2);
        return;
      }
      // idle: cochila em pé (a cabeça cai devagar e volta num susto), candeeiro balança, capa mexe
      const u = fr(t, 5.0) * 5.0;
      const nod = u < 3.6 ? sm(u / 3.6) * 0.35 : 0.35 * (1 - sm((u - 3.6) / 0.25));
      head.rotation.x = nod; head.rotation.z = sin(t * 0.6) * 0.05;
      torso.scale.set(1 + 0.012 * sin(t * 1.8), 1 + 0.015 * sin(t * 1.8), 1);
      lamp.rotation.z = sin(t * 1.9) * 0.22; lamp.rotation.x = sin(t * 1.3) * 0.12;
      cape.rotation.z = sin(t * 1.1) * 0.03;
      k.eyes(eyes, u < 3.6 ? 1 - 0.55 * sm(u / 3.6) : 1.15);
      k.look(eyes, u > 3.6 ? 0.3 : 0, -0.1);
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ MANDACARU EM BRASA (pipoqueiro-explosivo) — espírito de cacto com rachaduras de lava
  window.CHAR3D['pipoqueiro-explosivo'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const crack = k.tex(256, 128, (g, w, h) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#FF9A3A'; g.lineCap = 'round';
      let sd = 7; const rnd = () => { sd = (sd * 9301 + 49297) % 233280; return sd / 233280; };
      for (let i = 0; i < 22; i++) {
        let x = rnd() * w, y = h * (0.15 + rnd() * 0.75);
        g.lineWidth = 1.2 + rnd() * 2.2; g.beginPath(); g.moveTo(x, y);
        for (let j = 0; j < 6; j++) {
          x += (rnd() - 0.5) * 22; y += (rnd() - 0.55) * 16; g.lineTo(x, y);
          if (rnd() < 0.3) { g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 18, y + (rnd() - 0.5) * 14); g.moveTo(x, y); }
        }
        g.stroke();
      }
    });
    const cactus = k.corpo(k.mat('#2E5B33', { roughness: 0.72, emissive: '#FF5A12', emissiveMap: crack, emissiveIntensity: 1.5 }));
    const cactusD = k.mat('#24472A', { roughness: 0.75, emissive: '#FF5A12', emissiveMap: crack, emissiveIntensity: 1.2 });
    const spineM = k.mat('#EADFB8', { roughness: 0.5 }), budM = k.mat('#C41E2C', { roughness: 0.5 }), budD = k.mat('#7E1020', { roughness: 0.55 });
    const lava = k.glow('#FF7A1E', 2.0), dark = k.mat('#1B1A14', { roughness: 0.6 });
    // corpo de barril com gomos
    const ribbed = (n, amp, ws, hs) => { const g = new T.SphereGeometry(1, ws || 32, hs || 20), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), f = 1 + amp * cos(n * Math.atan2(z, x)); P.setX(i, x * f); P.setZ(i, z * f); } g.computeVertexNormals(); return g; };
    const body = k.g(root);
    const torso = k.g(body, 0, 0.06, 0);
    k.m(torso, ribbed(9, 0.07), cactus, 0, 0.46, 0, 0.33, 0.47, 0.3);
    for (const s of [-1, 1]) k.m(torso, k.S(10, 8), cactusD, s * 0.13, 0.0, 0.05, 0.1, 0.07, 0.12);
    // espinhos (uma malha)
    const sp = [];
    for (let i = 0; i < 46; i++) {
      const a = (i * 2.39996) % TAU, v = 0.12 + 0.8 * (i / 46), yy = 0.46 + 0.47 * cos(PI * v) * -1;
      const rr = sin(PI * v) * 0.33 * (1 + 0.07);
      if (abs(((a + PI) % TAU) - PI) < 0.55 && yy > 0.42 && yy < 0.78) continue;
      sp.push([k.Co(4), k.M(sin(a) * rr * 1.04, yy, cos(a) * rr * 0.95, 0, 0, 0, 0.012, 0.07, 0.012)]);
      const last = sp[sp.length - 1]; const ob = new T.Object3D(); ob.position.set(sin(a) * rr * 1.06, yy, cos(a) * rr * 0.97); ob.lookAt(sin(a) * 2, yy + 0.3 * (yy - 0.46), cos(a) * 2); ob.rotateX(PI / 2); ob.scale.set(0.012, 0.075, 0.012); ob.updateMatrix(); last[1] = ob.matrix.clone();
    }
    k.m(torso, k.merge(sp), spineM, 0, 0, 0);
    // braços de cacto
    const arms = [];
    for (const s of [-1, 1]) {
      const a = k.g(torso, s * 0.28, 0.5, 0);
      k.rot(k.m(a, ribbed(7, 0.08, 14, 8), cactusD, s * 0.08, 0, 0, 0.1, 0.075, 0.075), 0, 0, PI / 2);
      const up = k.g(a, s * 0.17, 0.0, 0);
      k.m(up, ribbed(7, 0.08, 14, 10), cactus, 0, 0.13, 0, 0.085, 0.17, 0.085);
      arms.push({ a, up, s });
    }
    // rosto bravo + boca de lava
    const face = k.g(torso, 0, 0.62, 0.28);
    const eyes = [k.eye(face, -0.1, 0, 0.0, 0.082, { ry: -0.3, brow: 0.5, browM: dark }), k.eye(face, 0.1, 0, 0.0, 0.082, { ry: 0.3, brow: 0.5, browM: dark })];
    const mouth = k.g(face, 0, -0.13, -0.01);
    k.m(mouth, k.S(14, 8), dark, 0, 0, 0, 0.1, 0.045, 0.04);
    const mlava = k.m(mouth, k.S(12, 6), lava, 0, -0.008, 0.012, 0.075, 0.025, 0.03);
    for (const x of [-0.05, 0, 0.05]) k.rot(k.m(mouth, k.Co(4), spineM, x, 0.03, 0.03, 0.014, 0.03, 0.014), PI, 0, 0);
    // botão de flor vermelho no alto
    const bud = k.g(torso, 0, 0.92, -0.02);
    k.m(bud, k.S(14, 10), budD, 0, 0.0, 0, 0.1, 0.06, 0.1);
    const petals = [];
    for (let i = 0; i < 5; i++) {
      const pg = k.g(bud, 0, 0.02, 0); pg.rotation.y = i * TAU / 5;
      const pe = k.g(pg, 0, 0, 0.03); pe.rotation.x = -0.25;
      k.m(pe, k.S(10, 8), budM, 0, 0.1, 0, 0.07, 0.14, 0.05);
      petals.push(pe);
    }
    // espinhos-projétil (ataque) e brasas
    const shots = [];
    for (let i = 0; i < 4; i++) { const s = k.m(torso, k.Co(5), lava, 0, 0, 0, 0.022, 0.13, 0.022); s.visible = false; shots.push(s); }
    const embers = k.sparks(root, 4, k.glow('#FFB347', 2.2), 0.02);
    let crown = [];
    if (asc >= 3) {
      const fA = k.glow('#FFB02E', 1.8, 0.9, '#FF8A1A'), fB = k.glow('#FF4A12', 1.7, 0.88);
      for (let i = 0; i < 6; i++) { const cg = k.g(bud, sin(i * TAU / 6) * 0.08, 0.02, cos(i * TAU / 6) * 0.08); cg.rotation.set(cos(i * TAU / 6) * 0.45, 0, -sin(i * TAU / 6) * 0.45); const f = k.m(cg, k.drop(), i % 2 ? fA : fB, 0, 0, 0, 0.05, 0.22, 0.05); k.fl(f, 12 + i, 0.18, i); crown.push(cg); }
    }
    const reset = k.rig(root, [cactus, cactusD, lava]);

    function anim(st, t, p) {
      reset();
      k.flick(t);
      for (const s of embers) s.visible = false;
      if (crown.length) for (const pe of petals) pe.rotation.x = -1.2;
      const pulse = 0.5 + 0.5 * sin(t * 2.6);
      cactus.emissiveIntensity = 1.2 + 0.6 * pulse; cactusD.emissiveIntensity = 0.9 + 0.5 * pulse;
      if (st === 'atk') {
        const { w, s } = AP(p);
        torso.scale.set(1 + 0.08 * w - 0.03 * s, 1 - 0.1 * w + 0.08 * s, 1 + 0.08 * w);
        torso.rotation.x = -0.18 * w + 0.22 * s;
        for (const a of arms) { a.a.rotation.z = a.s * (0.3 * w - 0.2 * s); a.up.rotation.z = -a.s * 0.6 * w; a.a.rotation.y = a.s * 0.6 * s; }
        cactus.emissiveIntensity = 1.4 + 2.2 * (w + s); lava.emissiveIntensity = 2 + 2 * s;
        const q = lin(p, 0.38, 0.85);
        for (let i = 0; i < shots.length; i++) {
          const s2 = shots[i]; s2.visible = q > 0 && q < 1;
          s2.position.set((i - 1.5) * 0.12 * (1 + q), 0.55 + 0.1 * sin(i * 2) * q, 0.3 + q * 1.1);
          s2.rotation.set(PI / 2, 0, 0);
        }
        mouth.scale.set(1.1, 1 + 1.5 * s, 1);
        k.eyes(eyes, 1 - 0.4 * w); k.look(eyes, 0, -0.1);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        body.position.z = -0.1 * h; torso.rotation.x = -0.25 * h; torso.rotation.z = 0.1 * sin(p * 30) * h;
        for (const a of arms) a.a.rotation.z = a.s * 0.5 * h;
        cactus.emissiveIntensity = 1.2 + 2.5 * h;
        k.burst(embers, lin(p, 0.05, 0.8), 0.5, 0.6, 0);
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.3);
        torso.rotation.x = 0.12; torso.scale.set(1 + 0.02 * b, 1 + 0.025 * b, 1 + 0.02 * b);
        for (const a of arms) { a.a.rotation.z = a.s * 0.5; a.up.rotation.z = a.s * 0.9; }
        for (const pe of petals) pe.rotation.x = 0.15;
        cactus.emissiveIntensity = 0.35 + 0.15 * b; cactusD.emissiveIntensity = 0.3; lava.emissiveIntensity = 0.6;
        k.shut(eyes, true); mouth.scale.set(0.6, 0.6, 1);
        return;
      }
      if (st === 'entra') {
        const g = sm(lin(p, 0, 0.6));
        body.scale.set(mx(0.05, g * (1 + 0.12 * sin(lin(p, 0.5, 1) * PI))), mx(0.05, g), mx(0.05, g * (1 + 0.12 * sin(lin(p, 0.5, 1) * PI))));
        body.position.y = -0.1 * (1 - g);
        for (const pe of petals) pe.rotation.x = -0.25 - 0.9 * sin(lin(p, 0.4, 1) * PI);
        cactus.emissiveIntensity = 1.2 + 2.5 * sin(lin(p, 0.3, 1) * PI);
        k.burst(embers, lin(p, 0.5, 1), 0.6, 0.7, 0);
        k.eyes(eyes, 1);
        return;
      }
      // idle: respira pesado, lava pulsando nas rachaduras, braços flexionam, brasas sobem
      const b = sin(t * 2.6);
      torso.scale.set(1 + 0.025 * b, 1 + 0.02 * b, 1 + 0.025 * b);
      torso.rotation.z = sin(t * 0.9) * 0.05; torso.rotation.y = sin(t * 0.6) * 0.15;
      for (const a of arms) { a.up.rotation.z = a.s * 0.12 * sin(t * 1.3 + a.s); a.a.rotation.y = a.s * 0.1 * sin(t * 0.9); }
      for (let i = 0; i < petals.length; i++) petals[i].rotation.x += 0.06 * sin(t * 2 + i);
      k.rise(embers, t, 1.6, 0.8, 0.25, 0.5, 1);
      k.eyes(eyes, blink(t, 3.6, 1.1)); k.look(eyes, sin(t * 0.6) * 0.2, 0);
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ RASGA-MORTALHA (revoada-noturna) — suindara pálida de rosto em coração, asas que se desfiam como mortalha
  window.CHAR3D['revoada-noturna'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const mott = k.tex(64, 64, (g, w, h) => { g.fillStyle = '#A8A098'; g.fillRect(0, 0, w, h); for (let i = 0; i < 140; i++) { g.fillStyle = i % 3 ? '#8E8A90' : '#F2EEE6'; g.fillRect((i * 29) % w, (i * 47) % h, 2, 1 + (i % 2)); } });
    const back = k.corpo(k.mat('#FFFFFF', { map: mott, roughness: 0.8 })), backD = k.mat('#6A645E', { roughness: 0.85 });
    const pale = k.mat('#ECE9E3', { roughness: 0.85 }), face = k.mat('#F6F4F0', { roughness: 0.7 }), rim = k.mat('#5C5048', { roughness: 0.75 }), beakM = k.mat('#CDBFB2', { roughness: 0.4 });
    const claw = k.mat('#1E1A1E', { roughness: 0.35 });
    const cloth = asc >= 3 ? k.glow('#EEF4FF', 1.5, 0.88, '#DCE8FF') : k.mat('#E4E2DC', { roughness: 0.95, transparent: true, opacity: 0.8, depthWrite: false });
    cloth.side = T.DoubleSide;
    const socket = k.mat('#050307', { roughness: 1, metalness: 0 }), spark = k.glow('#D8E6FF', 1.8, 1, '#B8D0FF');
    const ringM = k.glow('#DDE6FF', 1.2, 0.0);
    // tira de mortalha: plano dobrado que afina e se curva para trás
    const SG = {};
    const strip = (len, w, bend) => { const key = len + '_' + w + '_' + bend; if (SG[key]) return SG[key];
      const g = new T.PlaneGeometry(w, len, 2, 8), P = g.attributes.position;
      for (let i = 0; i < P.count; i++) { const x = P.getX(i), v = 0.5 - P.getY(i) / len; P.setXYZ(i, x * (1 - 0.55 * v) + 0.03 * sin(v * 6) * w, -v * len, -bend * len * v * v + abs(x) * 0.35 * (1 - 0.5 * v)); }
      g.computeVertexNormals(); return (SG[key] = g); };
    const body = k.g(root, 0, 0.0, 0);
    const torso = k.g(body, 0, 0.8, 0);
    k.rot(k.m(torso, k.S(22, 16), back, 0, 0.04, -0.07, 0.29, 0.38, 0.28), -0.22, 0, 0);
    k.m(torso, k.S(18, 14), pale, 0, -0.04, 0.08, 0.19, 0.32, 0.18);
    // pernas emplumadas curtas e garras escuras penduradas
    const legs = [];
    for (const s of [-1, 1]) {
      const lg = k.g(torso, s * 0.1, -0.27, 0.06);
      k.m(lg, k.Cap(0.055, 0.06, 2, 8), pale, 0, -0.06, 0);
      k.m(lg, k.merge([-0.5, 0, 0.5].map(a => [k.Co(6), k.M(sin(a) * 0.035, -0.16, 0.03 + cos(a) * 0.02, PI - 0.5, a, 0, 0.016, 0.1, 0.016)])), claw, 0, 0, 0);
      legs.push(lg);
    }
    // asas de manto que se desfiam em tiras
    const wings = [];
    for (const s of [-1, 1]) {
      const w = k.g(torso, s * 0.21, 0.18, -0.02);
      w.rotation.set(0.12, 0, -s * 0.22);
      k.m(w, k.S(16, 12), back, s * 0.05, -0.24, 0.02, 0.1, 0.46, 0.24);
      k.m(w, k.S(12, 10), backD, s * 0.08, -0.5, -0.02, 0.075, 0.16, 0.15);
      const rags = [];
      for (let i = 0; i < 3; i++) {
        const rg = k.g(w, s * (0.07 + i * 0.015), -0.56 + abs(i - 1) * 0.04, -0.1 + i * 0.09);
        rg.rotation.y = s * 0.3;
        k.m(rg, strip(0.5 - abs(i - 1) * 0.12, 0.11, 0.5), cloth, 0, 0, 0);
        rags.push(rg);
      }
      wings.push({ w, s, rags });
    }
    const tail = k.g(torso, 0, -0.22, -0.22); tail.rotation.x = 0.7;
    k.m(tail, k.S(12, 8), backD, 0, 0, -0.08, 0.12, 0.04, 0.14);
    // fitas de mortalha que arrastam atrás (3 pedaços cada, para ondular)
    const ribs = [];
    const mkRibbon = (x, y, z, n, L, W) => { let par = k.g(torso, x, y, z); par.rotation.y = x * 1.2; par.rotation.z = x * 2.2; const R = []; for (let i = 0; i < n; i++) { const sg = k.g(par, 0, i ? -L * 0.97 : 0, 0); k.m(sg, strip(L, W * (1 - i * 0.25), 0.35), cloth, 0, 0, 0); R.push(sg); par = sg; } return R; };
    ribs.push(mkRibbon(0.15, -0.14, -0.06, 3, 0.34, 0.28));
    ribs.push(mkRibbon(-0.14, -0.18, -0.08, 3, 0.3, 0.24));
    if (asc >= 3) { ribs.push(mkRibbon(0.02, 0.1, -0.24, 3, 0.34, 0.24)); ribs.push(mkRibbon(-0.06, -0.2, -0.02, 3, 0.24, 0.14)); }
    // cabeça: disco facial em coração, branco, com órbitas fundas e escuras
    const head = k.g(body, 0, 1.3, 0.04);
    k.m(head, k.S(22, 16), back, 0, 0.03, -0.05, 0.27, 0.25, 0.23);
    const disc = k.g(head, 0, -0.02, 0.18);
    for (const s of [-1, 1]) {
      k.rot(k.m(disc, k.S(18, 14), rim, s * 0.105, 0.0, -0.03, 0.17, 0.225, 0.08), 0, 0, s * 0.45);
      k.rot(k.m(disc, k.S(18, 14), face, s * 0.097, -0.01, 0.0, 0.15, 0.2, 0.08), 0, 0, s * 0.45);
    }
    const eyes = [];
    for (const s of [-1, 1]) {
      const e = k.eye(disc, s * 0.09, -0.005, 0.058, 0.074, { ry: s * 0.2, whiteM: socket, pupilM: spark, pupil: 0.3, tall: 1.25 });
      e.pup.remove(e.pup.children[1]); e.pup.position.z = 0.074 * 0.55; eyes.push(e);
      const lid = k.m(e.g, k.Hs(12, 6), face, 0, 0.035, 0.006, 0.082, 0.07, 0.062); lid.rotation.set(0.15, 0, s * 0.5);
    }
    k.m(disc, k.Cap(0.5, 2, 2, 6), rim, 0, 0.07, 0.07, 0.022, 0.05, 0.02);
    const beakG = k.g(disc, 0, -0.06, 0.07);
    k.rot(k.m(beakG, k.Co(8), beakM, 0, 0, 0, 0.022, 0.09, 0.018), PI - 0.25, 0, 0);
    const ring = k.m(head, k.To(0.2, 0.025, 6, 32), ringM, 0, -0.02, 0.3); ring.visible = false;
    const reset = k.rig(root, [ringM]);

    function anim(st, t, p) {
      reset();
      const wave = (amp, sp) => { for (let r = 0; r < ribs.length; r++) for (let i = 0; i < ribs[r].length; i++) { ribs[r][i].rotation.x = (i ? 0.25 : 0.55) + amp * sin(t * sp - i * 0.9 + r); ribs[r][i].rotation.z = amp * 0.4 * sin(t * sp * 0.7 - i + r * 2); } };
      const rag = a => { for (const wg of wings) for (let i = 0; i < wg.rags.length; i++) wg.rags[i].rotation.x = a * sin(t * 5 + i * 1.3) + 0.15; };
      if (st === 'atk') {
        const { w, s } = AP(p);
        body.position.y = 0.08 * w; body.position.z = -0.1 * w + 0.18 * s;
        torso.rotation.x = -0.15 * w + 0.2 * s;
        head.position.z += 0.12 * s; head.rotation.x = -0.2 * w + 0.15 * s;
        for (const a of wings) { a.w.rotation.z = -a.s * (0.35 + 1.0 * w + 0.6 * s); a.w.rotation.y = a.s * 0.4 * s; }
        beakG.rotation.x = 0.5 * s; beakG.scale.y = 1 + s;
        const q = lin(p, 0.38, 0.9);
        ring.visible = q > 0 && q < 1; ring.position.z = 0.3 + q * 0.9; ring.scale.setScalar(0.5 + q * 2.4); ringM.opacity = 0.9 * (1 - q);
        wave(0.5, 9); rag(0.6);
        k.eyes(eyes, 1.1);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        body.position.z = -0.14 * h; torso.rotation.x = -0.3 * h; head.rotation.z = 0.35 * h; head.rotation.x = -0.25 * h;
        for (const a of wings) a.w.rotation.z = -a.s * (0.35 + 1.2 * h);
        wave(0.6 * h + 0.1, 12); rag(0.8 * h);
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.1);
        body.position.y = -0.18;
        for (const l of legs) { l.scale.y = 0.6; }
        head.position.y -= 0.06; head.rotation.x = 0.25; head.rotation.z = 0.2;
        torso.scale.set(1 + 0.025 * b, 1 + 0.025 * b, 1);
        for (const a of wings) { a.w.rotation.z = -a.s * 0.05; a.w.position.z += 0.06; }
        wave(0.08, 1.2); rag(0.1);
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const f = 1 - seg(p, 0.35, 0.9), fl = sin(p * 26);
        body.position.y = 0.6 * f; body.position.z = -0.5 * f;
        torso.rotation.x = 0.35 * f;
        for (const a of wings) a.w.rotation.z = -a.s * (0.35 + f * (1.3 + 0.5 * fl));
        head.rotation.y = 0.8 * sin(seg(p, 0.7, 1) * PI) * (1 - seg(p, 0.9, 1));
        wave(0.4, 10); rag(0.6);
        k.eyes(eyes, 1);
        return;
      }
      // idle: paira, batidas lentas, giro de cabeça de coruja, a mortalha ondula
      const b = sin(t * 2.2);
      body.position.y = 0.04 * b;
      for (const a of wings) { a.w.rotation.z = -a.s * (0.24 + 0.16 * (0.5 + 0.5 * sin(t * 2.2 + 1))); }
      const tilt = fr(t, 6) * 6;
      head.rotation.z = tilt > 2 && tilt < 3.6 ? 0.4 * sin((tilt - 2) / 1.6 * PI) : 0;
      head.rotation.y = sin(t * 0.5) * 0.5;
      for (const l of legs) l.rotation.x = 0.15 * sin(t * 2.2 + 0.6);
      wave(0.22, 3.2); rag(0.35);
      k.eyes(eyes, blink(t, 4.5, 0.9));
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ BOITATÁ (rei-milhao, lendária) — serpente de fogo: corpo de brasa, labaredas azuis sobre laranja, olhos enormes
  window.CHAR3D['rei-milhao'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const A3 = asc >= 3;
    const core = k.corpo(k.mat(A3 ? '#0A1640' : '#2E0802', { emissive: A3 ? '#1A50E0' : '#B82400', emissiveIntensity: 0.6, roughness: 0.45 }));
    const belly = k.mat(A3 ? '#1A3A8A' : '#7A2406', { emissive: A3 ? '#5AAEFF' : '#FF8A1A', emissiveIntensity: 1.1, roughness: 0.5 });
    const ridge = k.mat(A3 ? '#081440' : '#2A0602', { emissive: A3 ? '#1A4AC0' : '#A01E00', emissiveIntensity: 0.6, roughness: 0.4 });
    const blue = k.glow(A3 ? '#4A9CFF' : '#1C4CFF', 2.6, 0.85, A3 ? '#3A8CFF' : '#1A3CFF');
    const orange = k.glow(A3 ? '#D8F0FF' : '#FFB43A', 2.0, 0.95, A3 ? '#9FD4FF' : '#FF8A10');
    const eyeG = k.glow(A3 ? '#FFE24A' : '#FFC21A', 2.2, 1, A3 ? '#FFC000' : '#FFA000'), pupM = k.mat('#1A0400', { roughness: 0.3 });
    const ember = k.glow(A3 ? '#FFD86A' : '#FF8A2A', 2.2), mouthM = k.glow('#FF5A10', 1.6), fang = k.mat('#FFF1D8', { roughness: 0.3 });
    const body = k.g(k.g(root)); body.parent.scale.setScalar(1.18);
    const flames = [];
    const flame = (par, x, y, z, rx, rz, h, s) => { // labareda: azul por fora, laranja por dentro
      const g = k.g(par, x, y, z); g.rotation.set(rx, 0, rz);
      const b = k.m(g, k.drop(1), blue, 0, 0, 0, 0.075 * s, h, 0.055 * s); k.fl(b, 9 + flames.length * 1.3, 0.22, flames.length * 1.7);
      const f = k.m(g, k.drop(1), orange, 0, 0.0, 0.012, 0.045 * s, h * 0.66, 0.035 * s); k.fl(f, 12 + flames.length, 0.25, flames.length * 2.3);
      flames.push(g); return g;
    };
    // corpo enrolado no chão (tubo liso e afilado) até a cauda em chama
    const cpath = u => { const a = PI * 0.5 + u * TAU * 1.22, rr = 0.47 - 0.17 * u, r = 0.165 * (1 - 0.86 * u); return [cos(a) * rr, r * 0.9 + 0.004, sin(a) * rr - 0.12]; };
    const crad = u => 0.165 * (1 - 0.86 * u);
    const coilG = k.g(body);
    k.m(coilG, k.ttube(cpath, crad, 48, 10), core, 0, 0, 0);
    for (const u of [0.3, 0.68]) { const q = cpath(u); flame(coilG, q[0], q[1] + crad(u) * 0.6, q[2], -0.2, 0, 0.26 * (1.2 - u), 1.1 - u * 0.5); }
    const tq = cpath(1), tailF = k.g(coilG, tq[0], tq[1], tq[2]); tailF.rotation.set(0, 0, -0.9);
    flame(tailF, 0, 0, 0, 0, 0, 0.32, 0.8);
    // pescoço liso: cápsulas encadeadas que se sobrepõem
    const neck = [];
    const NR = [0.165, 0.158, 0.151, 0.144, 0.138, 0.132, 0.127, 0.123], NX = [-0.42, -0.3, -0.12, 0.08, 0.26, 0.38, 0.4, 0.3];
    let par = k.g(body, 0, 0.2, 0.35);
    const base = par;
    for (let i = 0; i < NR.length; i++) {
      const sg = i ? k.g(par, 0, 0.165, 0) : par;
      sg.rotation.x = NX[i];
      k.m(sg, k.Cap(NR[i], 0.17, 2, 10), core, 0, 0.085, 0);
      k.m(sg, k.Cap(NR[i] * 0.5, 0.17, 1, 6), belly, 0, 0.085, NR[i] * 0.56, 1, 1, 0.8);
      if (i >= 1 && i <= 6 && i % 1 === 0 && i !== 4) flame(sg, 0, 0.08, -NR[i] * 0.85, -0.95, 0, 0.4 - i * 0.02, 1.25);
      neck.push(sg); par = sg;
    }
    // cabeça em cunha, mandíbula, olhos enormes de brasa sob sobrancelhas ferozes
    const head = k.g(neck[7], 0, 0.21, 0.02); head.scale.setScalar(1.22);
    const HX = -NX.reduce((a, b) => a + b, 0) + 0.3;
    head.rotation.x = HX;
    k.m(head, k.S(18, 14), core, 0, 0.03, 0.04, 0.22, 0.12, 0.28);
    k.m(head, k.S(14, 10), core, 0, 0.005, 0.27, 0.13, 0.07, 0.19);
    for (const s of [-1, 1]) { const b = k.m(head, k.Cap(0.5, 2, 2, 8), ridge, s * 0.115, 0.125, 0.17, 0.045, 0.06, 0.04); b.rotation.set(-0.2, 0, PI / 2 + s * 0.42); }
    const jaw = k.g(head, 0, -0.07, 0.0);
    k.m(jaw, k.S(14, 8), belly, 0, -0.01, 0.17, 0.19, 0.05, 0.28);
    k.m(jaw, k.S(10, 6), mouthM, 0, 0.025, 0.18, 0.16, 0.025, 0.24);
    k.m(head, k.merge([[k.Co(6), k.M(-0.085, -0.08, 0.33, PI, 0, 0, 0.022, 0.09, 0.022)], [k.Co(6), k.M(0.085, -0.08, 0.33, PI, 0, 0, 0.022, 0.09, 0.022)]]), fang, 0, 0, 0);
    const eyes = [];
    for (const s of [-1, 1]) { const e = k.eye(head, s * 0.13, 0.065, 0.18, 0.072, { ry: s * 0.55, rz: -s * 0.3, whiteM: eyeG, pupilM: pupM, slit: 0.3, pupil: 0.6, tall: 0.85 }); e.pup.remove(e.pup.children[1]); eyes.push(e);
      const lid = k.m(e.g, k.Hs(12, 6), ridge, 0, -0.01, 0.004, 0.084, 0.06, 0.07); lid.rotation.set(0.25, 0, s * 0.42); }
    const crest = [];
    { const c = k.m(head, k.merge([0, 1, 2].map(i => [k.S(8, 6), k.M((i - 1) * 2.7, 0, -abs(i - 1) * 1.5, 0, 0, 0, 1, 1, 1)])), ember, 0, 0.15, -0.05, 0.026); c.userData.olho = true; crest.push(c); }
    for (const s of [-1, 1]) flame(head, s * 0.1, 0.11, -0.12, -1.25, s * 0.35, 0.34, 0.9);
    const embers = k.sparks(root, 3, ember, 0.03);
    let ring = null;
    if (A3) {
      ring = k.g(root, 0, 0.02, -0.1);
      k.rot(k.m(ring, k.To(0.8, 0.035, 6, 48), k.glow('#4A9CFF', 2.2, 0.85), 0, 0, 0), PI / 2, 0, 0);
      { const f = k.m(ring, k.merge([0, 1, 2, 3].map(i => { const a = i * TAU / 4 + 0.4; return [k.drop(1), k.M(cos(a) * 0.8 / 0.07, 0, sin(a) * 0.8 / 0.07, 0, 0, 0, 1, 4.3, 1)]; })), blue, 0, 0, 0, 0.07, 0.07, 0.07); k.fl(f, 12, 0.25, 0); }
    }
    const reset = k.rig(root, [core, belly, blue, orange, eyeG, mouthM]);

    function anim(st, t, p) {
      reset();
      k.flick(t);
      for (const s of embers) s.visible = false;
      core.emissiveIntensity = 0.6 + 0.12 * sin(t * 5.1); belly.emissiveIntensity = 1.1 + 0.2 * sin(t * 6.3 + 1);
      if (ring) ring.rotation.y = t * 0.5;
      if (st === 'atk') {
        const { w, s } = AP(p);
        for (let i = 0; i < neck.length; i++) neck[i].rotation.x = NX[i] - 0.18 * w + 0.2 * s;
        head.rotation.x = HX + 0.25 * w - 0.45 * s;
        base.position.z += 0.12 * s;
        jaw.rotation.x = 0.35 * w + 0.75 * s;
        core.emissiveIntensity = 0.6 + 0.5 * s; mouthM.emissiveIntensity = 1.6 + 1.5 * s;
        for (const f of flames) f.scale.y = 1 + 0.5 * s;
        k.eyes(eyes, 1 - 0.35 * w + 0.15 * s); k.look(eyes, 0, -0.1);
        k.burst(embers, lin(p, 0.4, 0.9), 0.7, 1.5, 1);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        for (let i = 0; i < neck.length; i++) neck[i].rotation.x = NX[i] - 0.15 * h;
        head.rotation.z = 0.3 * h * sin(p * 20); body.position.z = -0.1 * h;
        for (const f of flames) f.scale.setScalar(1 - 0.45 * h);
        core.emissiveIntensity = 0.6 + 0.6 * h; jaw.rotation.x = 0.4 * h;
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.0);
        const SX = [0.25, 0.25, 0.22, 0.18, 0.12, 0.08, 0.04, 0.0];
        for (let i = 0; i < neck.length; i++) neck[i].rotation.x = SX[i];
        base.position.z -= 0.12;
        head.rotation.x = -SX.reduce((a, c) => a + c, 0) + 1.0;
        coilG.scale.setScalar(1 + 0.02 * b);
        core.emissiveIntensity = 0.35 + 0.1 * b; belly.emissiveIntensity = 0.4; blue.opacity = 0.4; orange.opacity = 0.5;
        for (const f of flames) f.scale.set(0.8, 0.45, 0.8);
        for (const c of crest) c.scale.setScalar(0.015);
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const g = sm(lin(p, 0, 0.7));
        for (let i = 0; i < neck.length; i++) { neck[i].scale.setScalar(mx(0.05, sm(lin(p, i * 0.07, 0.35 + i * 0.07)))); neck[i].rotation.z = 0.4 * sin(p * 12 - i) * (1 - g); }
        coilG.scale.setScalar(mx(0.05, sm(lin(p, 0, 0.5))));
        core.emissiveIntensity = 0.6 + 0.6 * sin(lin(p, 0.2, 1) * PI);
        jaw.rotation.x = 0.7 * sin(lin(p, 0.6, 1) * PI);
        k.burst(embers, lin(p, 0.4, 1), 0.9, 0.8, 0);
        k.eyes(eyes, 1);
        return;
      }
      // idle: o pescoço ondula como labareda, o corpo respira, brasas sobem, a boca fumega
      for (let i = 0; i < neck.length; i++) { neck[i].rotation.z = 0.07 * sin(t * 1.7 - i * 0.6); neck[i].rotation.x = NX[i] + 0.04 * sin(t * 1.3 - i * 0.5); }
      head.rotation.y = sin(t * 0.6) * 0.3;
      coilG.scale.setScalar(1 + 0.015 * sin(t * 2));
      jaw.rotation.x = 0.1 + 0.08 * sin(t * 2.3);
      for (let i = 0; i < crest.length; i++) crest[i].scale.set(0.026, 0.026 * (1 + 0.3 * sin(t * 4 + i)), 0.026);
      k.rise(embers, t, 1.8, 1.4, 0.45, 0.2, 1);
      k.eyes(eyes, blink(t, 4.2, 0.3)); k.look(eyes, sin(t * 0.6) * 0.12, 0);
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ MÃE-DA-LUA (codorna-ninheira) — urutau que vira galho seco, até abrir os olhos amarelos
  window.CHAR3D['codorna-ninheira'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const barkTex = k.tex(128, 256, (g, w, h) => {
      g.fillStyle = '#76695C'; g.fillRect(0, 0, w, h); g.filter = 'blur(1.2px)';
      for (let i = 0; i < 160; i++) { g.strokeStyle = ['#544840', '#9A8E80', '#3E352E', '#B8AD9C'][i % 4]; g.lineWidth = 1 + (i % 3); const x = (i * 53) % w, y = (i * 97) % h; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 4, y + 8, x + (i % 5) - 2, y + 10 + (i % 7) * 3); g.stroke(); }
    });
    const plum = k.corpo(k.mat('#FFFFFF', { map: barkTex, roughness: 0.9 })), plumD = k.mat('#4E443C', { roughness: 0.9 });
    const wood = k.mat('#4A3A2C', { roughness: 0.95 }), woodL = k.mat('#6A5442', { roughness: 0.95 });
    const yel = k.mat('#F4C21C', { roughness: 0.25, emissive: '#6A4A00', emissiveIntensity: 0.35 }), beakM = k.mat('#2E2824', { roughness: 0.4 }), gape = k.mat('#5A2224', { roughness: 0.5 });
    // toco de galho quebrado
    const stump = k.g(root);
    k.m(stump, k.Cy(0.12, 0.16, 12), wood, 0, 0.22, -0.02, 1, 0.44, 1);
    k.m(stump, k.merge([[k.Co(5), k.M(0.05, 0.47, 0.02, 0, 0, -0.3, 0.05, 0.12, 0.05)], [k.Co(5), k.M(-0.06, 0.46, -0.05, 0.2, 0, 0.35, 0.045, 0.1, 0.045)], [k.Cy(0.035, 0.05, 6), k.M(0.13, 0.28, 0, 0, 0, -1.0, 1, 0.2, 1)]]), woodL, 0, 0, 0);
    for (const s of [-1, 1]) k.m(stump, k.S(10, 6), wood, s * 0.11, 0.02, 0.04, 0.09, 0.04, 0.08);
    const body = k.g(root, 0, 0.44, 0);
    const torso = k.g(body);
    k.m(torso, k.S(18, 14), plum, 0, 0.26, 0, 0.19, 0.3, 0.17);
    k.rot(k.m(torso, k.S(12, 8), plumD, 0, 0.02, -0.12, 0.08, 0.26, 0.04), 0.25, 0, 0);
    const wings = [];
    for (const s of [-1, 1]) { const w = k.g(torso, s * 0.17, 0.33, -0.02); w.rotation.z = -s * 0.08; k.m(w, k.S(14, 10), plum, 0, -0.1, -0.02, 0.06, 0.2, 0.13); wings.push({ w, s }); }
    // cabeça
    const head = k.g(torso, 0, 0.58, 0.01);
    k.m(head, k.S(20, 16), plum, 0, 0, 0, 0.2, 0.18, 0.18);
    for (const s of [-1, 1]) k.rot(k.m(head, k.Cap(0.025, 0.06, 3, 6), plumD, s * 0.11, 0.12, 0.07), 0, 0, s * 1.2);
    const eyes = [];
    for (const s of [-1, 1]) eyes.push(k.eye(head, s * 0.085, 0.035, 0.13, 0.085, { ry: s * 0.35, whiteM: yel, pupil: 0.42, tall: 1.0, brow: 0.3, browM: plumD }));
    const mouth = k.g(head, 0, -0.06, 0.12);
    k.m(mouth, k.S(16, 8), plum, 0, 0.01, 0, 0.15, 0.04, 0.07);
    k.rot(k.m(mouth, k.Co(8), beakM, 0, 0.0, 0.07, 0.025, 0.05, 0.02), PI / 2 + 0.6, 0, 0);
    const jaw = k.g(mouth, 0, -0.005, -0.04);
    k.m(jaw, k.S(14, 8), gape, 0, 0, 0.04, 0.13, 0.025, 0.07);
    k.m(jaw, k.S(14, 8), plum, 0, -0.018, 0.04, 0.14, 0.03, 0.075);
    let moon = null;
    if (asc >= 3) {
      moon = k.g(head, 0, 0.06, -0.24);
      k.rot(k.m(moon, k.Cy(1, 1, 32), k.glow('#F3EFD8', 1.3, 1, '#E8E0B8'), 0, 0, 0, 0.36, 0.015, 0.36), PI / 2, 0, 0);
      k.rot(k.m(moon, k.To(0.4, 0.015, 6, 40), k.glow('#CFE0FF', 1.6, 0.6), 0, 0, 0.01), 0, 0, 0);
      for (const [x, y, r] of [[-0.12, 0.08, 0.06], [0.1, -0.1, 0.045], [0.14, 0.12, 0.03]]) k.rot(k.m(moon, k.Cy(1, 1, 12), k.mat('#C9C2A6', { roughness: 0.9, emissive: '#8E886E', emissiveIntensity: 0.5 }), x, y, 0.012, r, 0.008, r), PI / 2, 0, 0);
    }
    const reset = k.rig(root);

    function anim(st, t, p) {
      reset();
      if (st === 'atk') {
        const { w, s } = AP(p);
        body.rotation.x = -0.2 * w + 0.45 * s; body.position.z = 0.08 * s;
        head.rotation.x = -0.25 * w + 0.15 * s; head.position.z += 0.1 * s;
        jaw.rotation.x = 0.2 * w + 1.0 * s; mouth.scale.set(1 + 0.4 * s, 1, 1);
        for (const a of wings) a.w.rotation.z = -a.s * (0.08 + 1.0 * w + 0.6 * s);
        k.eyes(eyes, 1.15); k.look(eyes, 0, -0.15 * s);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        body.rotation.x = -0.35 * h; body.position.z = -0.06 * h; head.rotation.z = 0.25 * h * sin(p * 25);
        for (const a of wings) a.w.rotation.z = -a.s * (0.08 + 0.8 * h);
        jaw.rotation.x = 0.4 * h;
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.0);
        head.rotation.x = -0.7; torso.scale.set(1 + 0.02 * b, 1 + 0.02 * b, 1);
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const g = seg(p, 0.0, 0.5), op = seg(p, 0.6, 0.75);
        stump.scale.y = mx(0.05, sm(lin(p, 0, 0.4)));
        body.position.y = 0.44 * stump.scale.y; body.scale.setScalar(mx(0.05, g));
        head.rotation.x = -0.7 * (1 - op);
        jaw.rotation.x = 0.8 * sin(lin(p, 0.7, 1) * PI);
        if (op < 0.5) k.eyes(eyes, 0.12); else k.eyes(eyes, 1.15);
        return;
      }
      // idle: vira galho (bico pro alto, olhos em fresta, imóvel), depois abre os olhões, olha em volta e pisca
      const u = fr(t, 6.5) * 6.5;
      const v = (u + 3.3) % 6.5; const fz = v < 3.2 ? 1 - seg(v, 3.0, 3.2) : seg(v, 6.1, 6.5);
      head.rotation.x = -0.75 * fz;
      body.rotation.x = -0.08 * fz;
      for (const a of wings) a.w.rotation.z = -a.s * 0.02 * fz;
      torso.scale.set(1, 1 + 0.01 * sin(t * 1.5) * (1 - fz) + 0.006 * sin(t * 0.9), 1); body.rotation.z = 0.025 * sin(t * 0.7);
      if (fz > 0.5) { k.eyes(eyes, 0.14); k.look(eyes, 0, 0.3); }
      else {
        head.rotation.y = 0.5 * sin((v - 3.2) * 1.4); head.rotation.z = 0.08 * sin((v - 3.2) * 2.1);
        k.eyes(eyes, 1.1 * blink(v, 1.6, 0.2)); k.look(eyes, -0.25 * sin((v - 3.2) * 1.4), 0);
        jaw.rotation.x = v > 4.6 && v < 5.2 ? 0.25 * sin((v - 4.6) / 0.6 * PI) : 0;
      }
      if (moon) moon.rotation.z = t * 0.2;
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ GALO DE FOGO (galo-despertador) — crista de chama, cauda de brasa, esporas de bronze
  window.CHAR3D['galo-despertador'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const chest = k.corpo(k.mat('#5A140E', { roughness: 0.6 })), backM = k.mat('#3A1410', { roughness: 0.6 }), hackle = k.mat('#D9661A', { roughness: 0.55 });
    const tailM = k.mat('#3A120C', { roughness: 0.4, emissive: '#C23A08', emissiveIntensity: 0.45 }), legM = k.mat('#C9A050', { roughness: 0.5 }), bronze = k.mat('#B07434', { metalness: 0.8, roughness: 0.3 });
    const beakM = k.mat('#F0B428', { roughness: 0.4 }), wattle = k.mat('#D41E26', { roughness: 0.5 }), headM = k.mat('#B8361A', { roughness: 0.6 });
    const flA = k.glow('#FFC23A', 1.8, 0.92, '#FF9A1A'), flB = k.glow('#FF4A12', 1.7, 0.9), ember = k.glow('#FF7A22', 2.0);
    const body = k.g(root);
    const legs = [];
    for (const s of [-1, 1]) {
      const lg = k.g(body, s * 0.09, 0.32, 0);
      k.m(lg, k.Cy(0.028, 0.024, 8), legM, 0, -0.15, 0, 1, 0.3, 1);
      k.rot(k.m(lg, k.Co(6), bronze, 0, -0.2, -0.04, 0.018, 0.07, 0.018), -2.2, 0, 0);
      const foot = k.g(lg, 0, -0.3, 0);
      for (const a of [-0.5, 0, 0.5]) { const tg = k.g(foot, 0, 0, 0); tg.rotation.y = a; k.rot(k.m(tg, k.Cap(0.018, 0.07, 3, 6), legM, 0, 0.012, 0.05), PI / 2, 0, 0); }
      legs.push(lg);
    }
    const torso = k.g(body, 0, 0.55, 0);
    k.rot(k.m(torso, k.S(20, 16), backM, 0, 0.03, -0.06, 0.25, 0.25, 0.32), -0.3, 0, 0);
    const puff = k.m(torso, k.S(18, 14), chest, 0, -0.02, 0.09, 0.21, 0.23, 0.2);
    const wings = [];
    for (const s of [-1, 1]) { const w = k.g(torso, s * 0.22, 0.06, -0.04); w.rotation.set(0.3, 0, -s * 0.08); k.m(w, k.S(14, 10), backM, 0, -0.04, -0.08, 0.065, 0.17, 0.24); k.m(w, k.S(10, 8), hackle, s * 0.02, 0.04, 0.02, 0.05, 0.08, 0.14); wings.push({ w, s }); }
    // cauda: foices escuras com pontas de brasa
    const tail = k.g(torso, 0, 0.1, -0.24); tail.rotation.x = -0.45;
    const sick = [];
    for (let i = 0; i < 5; i++) {
      const a = (i - 2) * 0.22;
      const sg = k.g(tail, sin(a) * 0.05, 0, 0); sg.rotation.set(0, a * 0.6, a);
      k.rot(k.m(sg, k.To(0.3 - i % 2 * 0.04, 0.026, 5, 14, PI * 0.75), tailM, 0, 0.3, 0.0, 1, 1, 1.6), 0, PI / 2, PI * 0.1);
      const tip = k.m(sg, k.S(8, 6), ember, 0, 0.05 + i % 2 * 0.03, -0.31, 0.045, 0.06, 0.04);
      sick.push(sg);
    }
    let fan = [];
    if (asc >= 3) for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.38; const fg = k.g(tail, 0, 0.1, -0.05); fg.rotation.set(-0.7, 0, a); const f = k.m(fg, k.drop(1), i % 2 ? flA : flB, 0, 0, 0, 0.08, 0.5, 0.05); k.fl(f, 11 + i, 0.2, i); fan.push(fg); }
    // pescoço e cabeça
    const neck = k.g(torso, 0, 0.18, 0.08);
    k.m(neck, k.lathe(v => 0.19 - 0.08 * v, 0.24, 4, 14), hackle, 0, -0.1, 0);
    const head = k.g(neck, 0, 0.24, 0.03);
    k.m(head, k.S(20, 16), headM, 0, 0, 0, 0.17, 0.16, 0.17);
    const eyes = [];
    for (const s of [-1, 1]) eyes.push(k.eye(head, s * 0.085, 0.03, 0.12, 0.062, { ry: s * 0.4, brow: 0.45, browM: backM }));
    const bk = k.g(head, 0, -0.02, 0.15);
    k.rot(k.m(bk, k.Co(10), beakM, 0, 0.01, 0.04, 0.045, 0.11, 0.035), PI / 2 + 0.1, 0, 0);
    const jaw = k.g(bk, 0, -0.012, 0);
    k.rot(k.m(jaw, k.Co(8), beakM, 0, 0, 0.03, 0.035, 0.08, 0.02), PI / 2 + 0.2, 0, 0);
    k.m(head, k.S(12, 8), wattle, 0, -0.13, 0.12, 0.04, 0.06, 0.03);
    // crista de fogo
    const comb = [];
    for (const [z, h, m] of [[0.06, 0.2, flB], [-0.02, 0.26, flA], [-0.1, 0.2, flB], [0.0, 0.18, flA]]) { const cg = k.g(head, 0, 0.12, z); cg.rotation.x = -z * 2; const f = k.m(cg, k.drop(), m, 0, 0, 0, 0.05, h, 0.04); k.fl(f, 12 + z * 30, 0.2, z * 40); comb.push(cg); }
    const reset = k.rig(root, [flA, flB, ember]);

    function anim(st, t, p) {
      reset();
      k.flick(t);
      ember.emissiveIntensity = 1.8 + 0.5 * sin(t * 6);
      if (st === 'atk') {
        const { w, s } = AP(p);
        body.position.z = -0.06 * w + 0.18 * s; body.position.y = 0.08 * s;
        torso.rotation.x = -0.2 * w + 0.45 * s;
        neck.rotation.x = -0.4 * w + 0.6 * s; head.rotation.x = 0.2 * w;
        const fl = sin(p * 40);
        for (const a of wings) { a.w.rotation.z = -a.s * (0.1 + (1.3 + 0.4 * fl) * (w + s * 0.8)); a.w.rotation.x = 0.3 - 0.5 * w; }
        jaw.rotation.x = 0.4 * w + 0.1 * s;
        for (const c of comb) c.scale.y = 1 + 0.5 * s;
        tail.rotation.x = -0.2 + 0.3 * w - 0.2 * s;
        k.eyes(eyes, 1 - 0.3 * w); k.look(eyes, 0, -0.2);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        body.position.z = -0.12 * h; torso.rotation.x = -0.3 * h; neck.rotation.x = -0.4 * h; head.rotation.z = 0.25 * h;
        for (const a of wings) a.w.rotation.z = -a.s * (0.1 + 1.0 * h);
        for (const c of comb) c.scale.setScalar(1 - 0.4 * h);
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.3);
        body.position.y = -0.12; for (const l of legs) l.scale.y = 0.6;
        neck.rotation.x = 0.7; neck.position.z -= 0.04; head.rotation.x = 0.3; head.rotation.y = 0.5;
        torso.scale.set(1 + 0.03 * b, 1 + 0.03 * b, 1);
        for (const c of comb) c.scale.set(0.8, 0.5, 0.8);
        flA.opacity = 0.6; flB.opacity = 0.55; ember.emissiveIntensity = 0.6;
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const j = sin(lin(p, 0, 0.6) * PI), cr = seg(p, 0.55, 0.7) * (1 - seg(p, 0.92, 1));
        body.position.y = 0.4 * j;
        for (const a of wings) a.w.rotation.z = -a.s * (0.1 + 1.4 * j * (0.7 + 0.3 * sin(p * 40)));
        neck.rotation.x = -0.5 * cr; head.rotation.x = -0.5 * cr; jaw.rotation.x = 0.6 * cr; puff.scale.set(0.21 * (1 + 0.15 * cr), 0.23 * (1 + 0.15 * cr), 0.2 * (1 + 0.2 * cr));
        for (const c of comb) c.scale.y = 1 + 0.6 * cr;
        k.eyes(eyes, cr > 0.5 ? 0.3 : 1);
        return;
      }
      // idle: canta fora de hora (cabeça pra trás, peito estufado), bica o chão, crista tremula
      const u = fr(t, 4.6) * 4.6;
      const cr = u > 2.4 && u < 3.8 ? sin((u - 2.4) / 1.4 * PI) : 0;
      neck.rotation.x = -0.55 * cr + (u < 1.2 ? 0.5 * sin(u / 1.2 * PI) * sin(u * 10) * 0.3 : 0);
      head.rotation.x = -0.35 * cr; jaw.rotation.x = 0.55 * cr;
      puff.scale.set(0.21 * (1 + 0.12 * cr), 0.23 * (1 + 0.12 * cr), 0.2 * (1 + 0.18 * cr));
      for (const c of comb) c.scale.y = 1 + 0.4 * cr;
      for (const a of wings) a.w.rotation.z = -a.s * (0.08 + 0.3 * cr);
      head.rotation.y = sin(t * 0.9) * 0.3 * (1 - cr);
      for (let i = 0; i < sick.length; i++) sick[i].rotation.x = 0.06 * sin(t * 2 + i);
      k.eyes(eyes, cr > 0.3 ? 0.35 : blink(t, 3.4, 0.2));
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ MÃE-DO-OURO (gaviao-real, lendária) — ave-cometa: orbe de ouro, asas de chama, cauda de cometa
  window.CHAR3D['gaviao-real'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const gold = k.corpo(k.mat('#D29410', { metalness: 0.8, roughness: 0.2, emissive: '#F08A00', emissiveIntensity: 0.6 }));
    const nug = k.mat('#FFC83A', { metalness: 0.9, roughness: 0.35, emissive: '#7A4A00', emissiveIntensity: 0.4 }), beakM = k.mat('#4A2808', { roughness: 0.3, metalness: 0.4 });
    const flA = k.glow('#FFC040', 1.9, 0.9, '#FF9A10'), flB = k.glow('#FF5A12', 1.8, 0.88), flC = k.glow('#FFF0B0', 2.0, 0.7, '#FFD060');
    const tailIn = k.glow('#FFB030', 1.6, 0.85, '#FF8A00'), tailOut = k.glow('#FF4A00', 1.6, 0.35);
    const eyeG = k.glow('#FFE060', 2.4, 1, '#FFB800'), pupM = k.mat('#3A1400', { roughness: 0.3 });
    const body = k.g(k.g(root)); body.parent.scale.setScalar(1.07);
    const orb = k.g(body, 0, 1.3, 0);
    // cabeça-cometa: gota de ouro alongada, ponta para trás
    const skull = k.m(orb, k.drop(), gold, 0, 0, 0.17, 0.33, 0.78, 0.31); skull.rotation.x = -PI / 2;
    const halo = k.m(orb, k.S(16, 12), k.glow('#FF9A20', 1.3, 0.08), 0, 0, 0.0, 0.42, 0.38, 0.5);
    // olhos ferozes que brilham, sob sobrancelhas de ouro escuro
    const eyes = [];
    for (const s of [-1, 1]) { const e = k.eye(orb, s * 0.12, 0.04, 0.22, 0.072, { ry: s * 0.45, rz: -s * 0.25, whiteM: eyeG, pupilM: pupM, slit: 0.3, pupil: 0.6, tall: 0.85, brow: 0.5, browM: beakM }); e.pup.remove(e.pup.children[1]); eyes.push(e); }
    const bk = k.g(orb, 0, -0.06, 0.3);
    k.rot(k.m(bk, k.Co(10), beakM, 0, 0, 0.03, 0.04, 0.11, 0.035), PI / 2 + 0.55, 0, 0);
    // coroa de pepitas
    const crown = k.g(orb, 0, 0.13, 0.1);
    k.m(crown, k.merge([[0, 0.05, 0.045], [-0.06, 0.0, 0.035], [0.06, 0.0, 0.035]].map(([x, z, r]) => [k.Ic(1), k.M(x, 0.02, z, 0.3, x * 5, 0, r, r * 1.2, r)])), nug, 0, 0, 0);
    const crest = k.m(crown, k.merge([-1, 0, 1].map(i => [k.drop(1), k.M(i * 0.06, 0, -0.02, -1.15, 0, -i * 0.35, 0.05, 0.42 - abs(i) * 0.1, 0.035)])), flA, 0, 0, 0); k.fl(crest, 11, 0.12, 0.5);
    // asas de chama varridas para trás
    const wings = [];
    for (const s of [-1, 1]) {
      const w = k.g(orb, s * 0.2, 0.04, -0.02);
      w.rotation.set(0, 0, -s * 0.2);
      const fs = [];
      for (let i = 0; i < 3; i++) {
        const fg = k.g(w, s * (0.04 + i * 0.03), 0, -i * 0.06); fg.rotation.set(-0.55 - i * 0.25, 0, -s * (1.05 + i * 0.22));
        const f = k.m(fg, k.drop(1), [flA, flB, flA][i], 0, 0, 0, 0.12 - i * 0.015, 0.72 - i * 0.12, 0.04);
        k.fl(f, 9 + i * 2, 0.15, s + i);
        fs.push(fg);
      }
      wings.push({ w, s, fs });
    }
    // cauda de cometa lisa e afilada (dois trechos, para ondular) com véu de fogo por fora
    const tails = [];
    const TX = -0.7, TY = -0.75;
    const mkTail = (yaw, sc, outer) => {
      const a = k.g(orb, 0, 0, -0.1); a.rotation.set(TX, TY + yaw, 0);
      const r1 = u => sc * (0.2 - 0.09 * u), r2 = u => sc * 0.11 * pw(1 - u, 1.3);
      const p1 = u => [0, 0.03 * sin(u * PI), -u * 0.55 * sc], p2 = u => [0, 0, -u * 0.75 * sc];
      k.m(a, k.ttube(p1, r1, 16, 12), tailIn, 0, 0, 0);
      if (outer) k.m(a, k.ttube(p1, u => r1(u) * 1.45, 12, 10), tailOut, 0, 0, 0);
      const b = k.g(a, 0, 0, -0.52 * sc);
      k.m(b, k.ttube(p2, r2, 20, 12), tailIn, 0, 0, 0);
      if (outer) k.m(b, k.ttube(p2, u => r2(u) * 1.5 + 0.004, 14, 10), tailOut, 0, 0, 0);
      tails.push([a, b]);
    };
    mkTail(0, 1.5, true);
    let dust = [];
    if (asc >= 3) { mkTail(0.5, 0.95, false); mkTail(-0.5, 0.95, false); dust = k.sparks(root, 6, flC, 0.025); }
    const reset = k.rig(root, [gold, flA, flB, tailIn, tailOut]);

    function anim(st, t, p) {
      reset();
      k.flick(t);
      for (const s of dust) s.visible = false;
      gold.emissiveIntensity = 0.6 + 0.12 * sin(t * 3); tailIn.emissiveIntensity = 1.6 + 0.3 * sin(t * 7);
      const tailWave = (a, sp) => { for (let j = 0; j < tails.length; j++) { const b = tails[j][1]; b.rotation.x = a * sin(t * sp - 0.8 + j); b.rotation.y = a * 0.8 * sin(t * sp * 0.7 + j * 2); tails[j][0].rotation.y += a * 0.3 * sin(t * sp * 0.7 + j); } };
      const flap = (a, ph) => { for (const wg of wings) { wg.w.rotation.z = -wg.s * (0.2 - a * sin(ph)); wg.w.rotation.x = -0.2 * a * cos(ph); } };
      if (st === 'atk') {
        const { w, s } = AP(p);
        body.position.y = 0.25 * w - 0.35 * s; body.position.z = -0.15 * w + 0.45 * s;
        orb.rotation.x = -0.3 * w + 0.6 * s;
        for (const wg of wings) { wg.w.rotation.z = -wg.s * (0.2 + 0.7 * w - 0.6 * s); wg.w.rotation.y = wg.s * 0.8 * s; }
        for (const L of tails) L[0].rotation.x = TX + 0.3 * w - 0.4 * s;
        tailWave(0.1 + 0.25 * s, 12);
        gold.emissiveIntensity = 0.55 + 1.2 * s; halo.scale.set(0.42 * (1 + 0.4 * s), 0.38 * (1 + 0.4 * s), 0.5 * (1 + 0.4 * s));
        k.eyes(eyes, 1 - 0.3 * w); k.look(eyes, 0, -0.2 * s);
        if (dust.length) k.burst(dust, lin(p, 0.4, 0.95), 0.7, 1.0, 1);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        body.position.z = -0.15 * h; body.position.y = 0.06 * h; orb.rotation.x = -0.35 * h; orb.rotation.z = 0.2 * sin(p * 30) * h;
        flap(0.5 * h, PI / 2);
        tailWave(0.3 * h, 15);
        gold.emissiveIntensity = 0.55 + 1.0 * h;
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.1);
        body.position.y = -0.55;
        orb.rotation.x = 0.25;
        for (const wg of wings) { wg.w.rotation.z = wg.s * 0.6; wg.w.position.z = 0.0; for (const f of wg.fs) f.scale.set(0.7, 0.5, 0.7); }
        for (const L of tails) L[0].rotation.x = -1.1;
        orb.scale.setScalar(1 + 0.02 * b);
        gold.emissiveIntensity = 0.25 + 0.06 * b; halo.visible = false; flA.opacity = 0.5; flB.opacity = 0.45; tailIn.opacity = 0.5; tailOut.opacity = 0.15;
        tailWave(0.05, 1);
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const f = 1 - seg(p, 0.0, 0.7);
        body.position.y = 1.2 * f; body.position.z = -0.6 * f; body.position.x = 0.4 * f;
        orb.rotation.x = 0.5 * f;
        for (const L of tails) L[0].rotation.x = TX + 0.5 * f;
        tailWave(0.2, 10);
        flap(0.6, p * 30);
        gold.emissiveIntensity = 0.55 + 1.2 * f;
        if (dust.length) k.burst(dust, lin(p, 0.6, 1), 0.8, 0.9, 0);
        k.eyes(eyes, 1);
        return;
      }
      // idle: paira e bate as asas de chama, cauda de cometa ondula, faísca de ouro
      body.position.y = 0.06 * sin(t * 1.8);
      orb.rotation.z = 0.05 * sin(t * 0.9);
      flap(0.35, t * 3.6);
      tailWave(0.16, 3);
      halo.scale.multiplyScalar(1 + 0.05 * sin(t * 4));
      if (dust.length) { k.rise(dust, t, 2.2, 0.9, 0.5, 0.4, 1); for (const s of dust) s.position.z -= 0.35; }
      k.eyes(eyes, blink(t, 3.8, 0.5)); k.look(eyes, sin(t * 0.7) * 0.2, 0);
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ FILHOTE (ficha) — filhote de urutau, penugem cinza, pontas de asa cor de brasa, olhos amarelos enormes
  window.CHAR3D['filhote'] = function (T, kit, o) {
    o = o || {};
    const k = K(T), root = new T.Group();
    const down = k.corpo(k.mat('#9A928A', { roughness: 0.95 })), downL = k.mat('#C4BCB2', { roughness: 0.95 }), downD = k.mat('#6E665E', { roughness: 0.95 });
    const emb = k.mat('#E8641A', { roughness: 0.7, emissive: '#FF4A0A', emissiveIntensity: 0.6 });
    const yel = k.mat('#F6C820', { roughness: 0.25, emissive: '#6A4A00', emissiveIntensity: 0.35 }), beakM = k.mat('#3A3230', { roughness: 0.4 }), legM = k.mat('#5A524C', { roughness: 0.7 });
    const body = k.g(root);
    for (const s of [-1, 1]) { const f = k.g(body, s * 0.07, 0.05, 0.03); k.m(f, k.Cap(0.022, 0.04, 3, 6), legM, 0, 0, 0); k.m(f, k.S(8, 6), legM, 0, -0.03, 0.03, 0.035, 0.018, 0.05); }
    const torso = k.g(body, 0, 0.08, 0);
    k.m(torso, k.S(20, 16), down, 0, 0.22, 0, 0.25, 0.23, 0.23);
    // tufos de penugem (uma malha)
    const tf = [];
    for (let i = 0; i < 16; i++) { const a = i * 2.39996, y = 0.08 + (i % 5) * 0.07; tf.push([k.S(8, 6), k.M(sin(a) * 0.22, y, cos(a) * 0.2, 0, 0, 0, 0.06, 0.05, 0.06)]); }
    tf.push([k.S(8, 6), k.M(0, 0.47, -0.02, 0, 0, 0.3, 0.03, 0.08, 0.03)], [k.S(8, 6), k.M(0.04, 0.46, -0.04, 0, 0, -0.4, 0.025, 0.07, 0.025)]);
    k.m(torso, k.merge(tf), downL, 0, 0, 0);
    k.m(torso, k.S(14, 10), downL, 0, 0.14, 0.12, 0.15, 0.13, 0.12);
    const wings = [];
    for (const s of [-1, 1]) { const w = k.g(torso, s * 0.23, 0.24, -0.02); w.rotation.z = -s * 0.25; k.m(w, k.S(12, 8), downD, 0, -0.06, 0, 0.05, 0.11, 0.09); k.m(w, k.S(10, 8), emb, 0, -0.16, -0.01, 0.04, 0.05, 0.07); wings.push({ w, s }); }
    const eyes = [];
    for (const s of [-1, 1]) eyes.push(k.eye(torso, s * 0.1, 0.29, 0.17, 0.095, { ry: s * 0.33, whiteM: yel, pupil: 0.5, tall: 1.0 }));
    const mouth = k.g(torso, 0, 0.19, 0.21);
    k.m(mouth, k.S(12, 6), downD, 0, 0, 0, 0.1, 0.025, 0.05);
    k.rot(k.m(mouth, k.Co(6), beakM, 0, 0.0, 0.05, 0.018, 0.035, 0.014), PI / 2 + 0.5, 0, 0);
    const jaw = k.g(mouth, 0, -0.01, 0);
    k.m(jaw, k.S(12, 6), k.mat('#3A1E1E', { roughness: 0.5 }), 0, -0.004, 0.0, 0.08, 0.014, 0.04);
    const reset = k.rig(root);

    function anim(st, t, p) {
      reset();
      if (st === 'atk') {
        const { w, s } = AP(p);
        body.position.z = -0.05 * w + 0.22 * s; body.position.y = 0.12 * s * (1 - s) * 4;
        torso.rotation.x = -0.2 * w + 0.4 * s;
        jaw.rotation.x = 0.9 * s; mouth.scale.set(1 + 0.3 * s, 1, 1);
        for (const a of wings) a.w.rotation.z = -a.s * (0.25 + 1.2 * (w + s));
        k.eyes(eyes, 1 - 0.3 * w);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        body.position.z = -0.1 * h; torso.rotation.x = -0.3 * h; torso.scale.set(1 + 0.1 * h, 1 - 0.1 * h, 1 + 0.1 * h);
        for (const a of wings) a.w.rotation.z = -a.s * (0.25 + 0.8 * h);
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.6);
        torso.scale.set(1 + 0.03 * b, 1 + 0.035 * b, 1 + 0.03 * b); torso.rotation.z = 0.1; body.position.y = -0.03;
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const g = sm(lin(p, 0, 0.5)), j = sin(lin(p, 0.3, 0.8) * PI);
        body.scale.setScalar(mx(0.05, g)); body.position.y = 0.2 * j;
        for (const a of wings) a.w.rotation.z = -a.s * (0.25 + 1.4 * j * (0.6 + 0.4 * sin(p * 40)));
        k.eyes(eyes, 1);
        return;
      }
      // idle: balança de um lado pro outro, bate os cotos de asa, pia de bico aberto
      torso.rotation.z = sin(t * 2.2) * 0.1;
      torso.scale.set(1 + 0.02 * sin(t * 4.4), 1 - 0.02 * sin(t * 4.4), 1);
      const u = fr(t, 2.6) * 2.6;
      const peep = u > 1.6 && u < 2.1 ? sin((u - 1.6) / 0.5 * PI) : 0;
      jaw.rotation.x = 0.6 * peep; torso.rotation.x = -0.15 * peep;
      for (const a of wings) a.w.rotation.z = -a.s * (0.25 + 0.5 * peep * (0.5 + 0.5 * sin(t * 30)));
      k.eyes(eyes, blink(t, 2.9, 0.3)); k.look(eyes, sin(t * 1.1) * 0.2, 0);
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ BEM-TE-VI VALENTE (pintinho-valente) — peito amarelo, cabeça listrada, chapeuzinho de couro e espada de espinho
  window.CHAR3D['pintinho-valente'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const yel = k.corpo(k.mat('#F2C324', { roughness: 0.6 })), brown = k.mat('#6A4A2C', { roughness: 0.65 }), brownD = k.mat('#4A321E', { roughness: 0.7 });
    const blk = k.mat('#18141A', { roughness: 0.45 }), wht = k.mat('#F4F0E6', { roughness: 0.6 }), legM = k.mat('#3A3438', { roughness: 0.6 });
    const leather = k.mat('#7A4A26', { roughness: 0.55 }), leatherD = k.mat('#4A2A12', { roughness: 0.5 });
    const thorn = asc >= 3 ? k.glow('#E8FFD0', 1.4, 1, '#9AFF7A') : k.mat('#CDBE8E', { roughness: 0.4 }), hilt = k.mat('#5A3A1E', { roughness: 0.6 });
    const body = k.g(root);
    const legs = [];
    for (const s of [-1, 1]) {
      const lg = k.g(body, s * 0.07, 0.17, 0.0);
      k.m(lg, k.Cy(0.02, 0.018, 8), legM, 0, -0.08, 0, 1, 0.17, 1);
      for (const a of [-0.45, 0, 0.45]) { const tg = k.g(lg, 0, -0.165, 0); tg.rotation.y = a; k.rot(k.m(tg, k.Cap(0.014, 0.05, 3, 6), legM, 0, 0, 0.035), PI / 2, 0, 0); }
      legs.push(lg);
    }
    const torso = k.g(body, 0, 0.36, 0);
    k.rot(k.m(torso, k.S(20, 16), brown, 0, 0.02, -0.05, 0.2, 0.2, 0.25), -0.3, 0, 0);
    const chest = k.m(torso, k.S(18, 14), yel, 0, -0.02, 0.07, 0.19, 0.2, 0.18);
    const tail = k.g(torso, 0, 0.0, -0.22); tail.rotation.x = 0.4;
    k.m(tail, k.S(12, 8), brownD, 0, 0, -0.1, 0.07, 0.025, 0.15);
    const wings = [];
    for (const s of [-1, 1]) { const w = k.g(torso, s * 0.18, 0.06, -0.02); w.rotation.set(0.3, 0, -s * 0.1); k.m(w, k.S(14, 10), brown, 0, -0.04, -0.06, 0.05, 0.13, 0.19); wings.push({ w, s }); }
    // cabeça: coroa preta, sobrancelha branca, máscara preta, garganta branca
    const head = k.g(torso, 0, 0.3, 0.06);
    k.m(head, k.S(22, 16), blk, 0, 0, 0, 0.19, 0.18, 0.19);
    k.m(head, k.S(22, 10), wht, 0, 0.055, 0.005, 0.196, 0.04, 0.19);
    k.m(head, k.S(16, 12), wht, 0, -0.1, 0.06, 0.13, 0.08, 0.12);
    const eyes = [];
    for (const s of [-1, 1]) eyes.push(k.eye(head, s * 0.085, 0.0, 0.14, 0.062, { ry: s * 0.4, brow: 0.5, browM: wht }));
    const bk = k.g(head, 0, -0.04, 0.17);
    k.rot(k.m(bk, k.Co(10), blk, 0, 0.008, 0.06, 0.04, 0.14, 0.032), PI / 2, 0, 0);
    const jaw = k.g(bk, 0, -0.008, 0);
    k.rot(k.m(jaw, k.Co(8), blk, 0, -0.006, 0.05, 0.032, 0.11, 0.02), PI / 2 + 0.08, 0, 0);
    // chapeuzinho de couro
    const hat = k.g(head, 0.02, 0.16, -0.01); hat.rotation.set(-0.15, 0, -0.2);
    k.m(hat, k.Cy(0.15, 0.15, 18), leather, 0, 0, 0, 1, 0.018, 1);
    k.m(hat, k.lathe(v => 0.085 - 0.02 * v, 0.08, 3, 14), leather, 0, 0, 0);
    k.m(hat, k.S(12, 6), leather, 0, 0.08, 0, 0.065, 0.025, 0.065);
    const flap = new T.CylinderGeometry(0.15, 0.15, 0.018, 14, 1, false, -PI / 2, PI);
    const fg = k.g(hat, 0, 0, 0); fg.rotation.x = -0.9; k.m(fg, flap, leatherD, 0, 0, 0, 1, 1, 0.55);
    let medal = null;
    if (asc >= 3) {
      const sh = new T.Shape();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.02 : 0.045, a = i / 10 * TAU + PI / 2; i ? sh.lineTo(cos(a) * r, sin(a) * r) : sh.moveTo(cos(a) * r, sin(a) * r); }
      medal = k.m(hat, new T.ExtrudeGeometry(sh, { depth: 0.01, bevelEnabled: false }), k.mat('#FFC83A', { metalness: 0.85, roughness: 0.25, emissive: '#C88000', emissiveIntensity: 0.6 }), 0, 0.05, 0.085);
      medal.rotation.x = 0.25;
    }
    // espada de espinho na asa direita
    const arm = wings[1].w;
    const sword = k.g(torso, 0.22, -0.02, 0.1); sword.rotation.set(-0.5, 0, -0.25);
    k.m(sword, k.Cy(0.016, 0.016, 8), hilt, 0, -0.04, 0, 1, 0.1, 1);
    k.rot(k.m(sword, k.Cap(0.012, 0.09, 2, 6), hilt, 0, 0.01, 0), 0, 0, PI / 2);
    const blade = k.m(sword, k.Co(10), thorn, 0, 0.22, 0, 0.03, 0.42, 0.022);
    let aura = null;
    if (asc >= 3) aura = k.m(sword, k.Co(10), k.glow('#B8FF8A', 1.8, 0.35), 0, 0.23, 0, 0.06, 0.5, 0.05);
    const reset = k.rig(root);

    function anim(st, t, p) {
      reset();
      if (aura) aura.scale.set(0.06 * (1 + 0.15 * sin(t * 6)), 0.5, 0.05 * (1 + 0.15 * sin(t * 6)));
      if (medal) medal.rotation.y = 0.4 * sin(t * 2);
      if (st === 'atk') {
        const { w, s } = AP(p);
        body.position.z = -0.08 * w + 0.32 * s;
        torso.rotation.x = -0.15 * w + 0.35 * s; torso.rotation.y = 0.3 * w - 0.2 * s;
        sword.rotation.x = -0.5 + 0.3 * w + 1.9 * s * 0 - 1.3 * w * 0; sword.rotation.set(-0.5 - 0.9 * w + 1.95 * s, 0, -0.25 + 0.25 * s);
        sword.position.z = 0.1 + 0.15 * s;
        legs[0].rotation.x = -0.6 * s; legs[1].rotation.x = 0.5 * s;
        for (const a of wings) a.w.rotation.z = -a.s * (0.1 + 0.6 * w);
        jaw.rotation.x = 0.35 * s; head.rotation.x = 0.1 * s;
        k.eyes(eyes, 1 - 0.3 * w); k.look(eyes, 0, -0.1);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        body.position.z = -0.12 * h; torso.rotation.x = -0.3 * h; head.rotation.z = 0.25 * h; hat.rotation.z = -0.2 - 0.4 * h; hat.position.y += 0.04 * h;
        sword.rotation.x = -0.5 - 0.6 * h;
        for (const a of wings) a.w.rotation.z = -a.s * (0.1 + 0.9 * h);
        if (h > 0.12) k.shut(eyes, false);
        return;
      }
      if (st === 'sono') {
        const b = sin(t * 1.5);
        body.position.y = -0.07; for (const l of legs) l.scale.y = 0.6;
        head.rotation.x = 0.4; head.position.y -= 0.03; hat.rotation.x = 0.25;
        sword.rotation.set(0.4, 0, -0.6); sword.position.y -= 0.05;
        torso.scale.set(1 + 0.03 * b, 1 + 0.03 * b, 1);
        k.shut(eyes, true);
        return;
      }
      if (st === 'entra') {
        const j = sin(lin(p, 0, 0.55) * PI), up = seg(p, 0.55, 0.75) * (1 - seg(p, 0.92, 1));
        body.position.y = 0.35 * j; torso.rotation.y = TAU * seg(p, 0, 0.5);
        sword.rotation.set(-0.5 - 1.2 * up, 0, -0.25 - 0.5 * up);
        jaw.rotation.x = 0.5 * up; head.rotation.x = -0.3 * up; chest.scale.set(0.19 * (1 + 0.15 * up), 0.2 * (1 + 0.12 * up), 0.18 * (1 + 0.15 * up));
        for (const a of wings) a.w.rotation.z = -a.s * (0.1 + 1.2 * j);
        k.eyes(eyes, 1);
        return;
      }
      // idle: estufa o peito e grita "bem-te-vi!", gira a espada, cauda abana
      const u = fr(t, 3.6) * 3.6;
      const cry = u > 2.0 && u < 2.9 ? sin((u - 2.0) / 0.9 * PI) : 0;
      const ha = cry * (0.5 + 0.5 * sin((u - 2) * 22));
      jaw.rotation.x = 0.45 * ha; head.rotation.x = -0.3 * cry;
      chest.scale.set(0.19 * (1 + 0.1 * cry), 0.2 * (1 + 0.08 * cry), 0.18 * (1 + 0.12 * cry));
      body.position.y = 0.02 * abs(sin(t * 3)) * (1 - cry);
      head.rotation.y = sin(t * 1.1) * 0.35 * (1 - cry);
      tail.rotation.x = 0.4 + 0.25 * sin(t * 7) * (sin(t * 1.3) > 0.5 ? 1 : 0.15);
      sword.rotation.x = -0.5 + 0.12 * sin(t * 2); sword.rotation.z = -0.25 + 0.08 * sin(t * 1.4);
      k.eyes(eyes, cry > 0.4 ? 0.6 : blink(t, 2.8, 0.4));
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };

  // ================================================================ NINHO DE BRASAS (galinheiro, construção) — ninho de gravetos espinhentos num tronco forquilhado da caatinga, brasas e um ovo pintado
  window.CHAR3D['galinheiro'] = function (T, kit, o) {
    o = o || {}; const asc = o.asc | 0;
    const k = K(T), root = new T.Group();
    const bark = k.corpo(k.mat('#5C5248', { roughness: 0.92 })), barkD = k.mat('#4E463E', { roughness: 0.95 });
    const twig = k.mat('#8A6A44', { roughness: 0.95 }), twigD = k.mat('#5A4028', { roughness: 0.95 }), thornM = k.mat('#D8CBA4', { roughness: 0.6 });
    const coal = k.glow('#FF7A22', 2.0, 1, '#FF5A00'), coalD = k.mat('#2A1E1A', { roughness: 0.8, emissive: '#7A1A00', emissiveIntensity: 0.6 });
    const eggTex = k.tex(64, 64, (g, w, h) => { g.fillStyle = '#EADFC6'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.fillStyle = i % 3 ? '#7A5A3A' : '#3A2A1E'; g.beginPath(); g.arc((i * 23) % w, (i * 41) % h, 1 + (i % 3), 0, TAU); g.fill(); } });
    const eggM = k.mat('#FFFFFF', { map: eggTex, roughness: 0.4 });
    const smokeM = k.mat('#B4B0B8', { roughness: 1, transparent: true, opacity: 0.22, depthWrite: false });
    const body = k.g(root);
    // tronco torto que se abre em forquilha
    const trunk = k.g(body);
    k.m(trunk, k.ttube(u => [0.05 * sin(u * 3), u * 0.5, 0.03 * cos(u * 4)], u => 0.12 - 0.03 * u, 10, 10), bark, 0, 0, 0);
    for (const s of [-1, 1]) {
      k.m(trunk, k.ttube(u => [0.05 * sin(3) + s * (0.04 + u * 0.32), 0.45 + u * 0.42 + 0.06 * sin(u * 4), 0.02 - u * 0.06], u => 0.065 - 0.045 * u, 8, 8), barkD, 0, 0, 0);
      k.m(trunk, k.S(8, 6), barkD, s * 0.13, 0.03, 0.05, 0.08, 0.04, 0.07);
    }
    k.m(trunk, k.ttube(u => [0.2 + u * 0.18, 0.75 + u * 0.08, -0.04], u => 0.03 - 0.02 * u, 4, 6), barkD, 0, 0, 0);
    // ninho
    const nest = k.g(body, 0.0, 0.62, 0.0);
    k.rot(k.m(nest, k.To(0.22, 0.09, 8, 20), twig, 0, 0, 0, 1, 1, 0.8), PI / 2, 0, 0);
    k.m(nest, k.S(14, 8), twigD, 0, -0.04, 0, 0.21, 0.07, 0.21);
    const sticks = [];
    for (let i = 0; i < 18; i++) {
      const a = i * 2.39996, r = 0.22 + (i % 3) * 0.02;
      const ob = new T.Object3D(); ob.position.set(cos(a) * r, -0.02 + (i % 4) * 0.025, sin(a) * r); ob.rotation.set((i % 3 - 1) * 0.5, -a, PI / 2 + (i % 5 - 2) * 0.25); ob.scale.set(0.012, 0.22, 0.012); ob.updateMatrix();
      sticks.push([k.Cy(1, 1, 5), ob.matrix.clone()]);
    }
    k.m(nest, k.merge(sticks), twigD, 0, 0, 0);
    const th = [];
    for (let i = 0; i < 16; i++) { const a = i * 2.39996 + 0.3, r = 0.27; const ob = new T.Object3D(); ob.position.set(cos(a) * r, 0.01 + (i % 3) * 0.03, sin(a) * r); ob.lookAt(cos(a) * 2, 0.4 + (i % 3) * 0.2, sin(a) * 2); ob.rotateX(PI / 2); ob.scale.set(0.01, 0.06, 0.01); ob.updateMatrix(); th.push([k.Co(4), ob.matrix.clone()]); }
    k.m(nest, k.merge(th), thornM, 0, 0, 0);
    // brasas no fundo
    const coals = [];
    for (let i = 0; i < 6; i++) { const a = i * 1.1; const c = k.m(nest, k.Ic(0), i % 2 ? coal : coalD, cos(a) * 0.13, 0.07, sin(a) * 0.13, 0.055, 0.04, 0.055); c.rotation.y = i; coals.push(c); }
    // ovo pintado
    const egg = k.g(nest, 0.02, 0.04, 0.02);
    k.m(egg, k.lathe(v => 0.1 * pw(sin(PI * v), 0.7) * (1 - 0.18 * v), 0.24, 12, 16), eggM, 0, 0, 0);
    // fumaça e faíscas
    const smoke = [];
    for (let i = 0; i < 3; i++) { const s = k.m(nest, k.S(10, 8), smokeM, 0, 0.2, 0, 0.06); smoke.push(s); }
    const sparks = k.sparks(nest, 5, k.glow('#FFC048', 2.2), 0.02);
    let blue = null;
    if (asc >= 3) {
      const bm = k.glow('#4A9CFF', 2.2, 0.85), bf = k.glow('#9FD0FF', 2.0, 0.85, '#3A8CFF');
      blue = k.g(nest, 0, 0.06, 0);
      k.rot(k.m(blue, k.To(0.14, 0.022, 6, 32), bm, 0, 0, 0), PI / 2, 0, 0);
      for (let i = 0; i < 5; i++) { const a = i * TAU / 5; const f = k.m(blue, k.drop(1), bf, cos(a) * 0.14, 0, sin(a) * 0.14, 0.035, 0.14, 0.035); k.fl(f, 12 + i, 0.25, i); }
    }
    const reset = k.rig(root, [coal, smokeM]);

    function anim(st, t, p) {
      reset();
      k.flick(t);
      for (const s of sparks) s.visible = false;
      for (let i = 0; i < smoke.length; i++) {
        const u = fr(t * 0.45 + i / smoke.length, 1);
        smoke[i].position.set(sin(u * 5 + i) * 0.05, 0.15 + u * 0.7, cos(u * 4 + i) * 0.04 - u * 0.05);
        smoke[i].scale.setScalar(0.03 + 0.08 * u);
      }
      smokeM.opacity = 0.22;
      coal.emissiveIntensity = 1.6 + 0.5 * sin(t * 3.1) + 0.2 * sin(t * 7.7);
      if (blue) blue.rotation.y = t * 0.8;
      if (st === 'atk') {
        const { w, s } = AP(p);
        body.scale.set(1 + 0.05 * w, 1 - 0.06 * w + 0.04 * s, 1 + 0.05 * w);
        egg.position.y += 0.18 * s; egg.rotation.z = 0.5 * s;
        coal.emissiveIntensity = 1.6 + 3 * s;
        nest.rotation.x = 0.15 * s;
        k.burst(sparks, lin(p, 0.38, 0.95), 0.8, 0.3, 1);
        return;
      }
      if (st === 'hit') {
        const h = HP(p);
        body.rotation.z = 0.08 * sin(p * 35) * h; nest.position.x = 0.03 * sin(p * 40) * h;
        egg.rotation.z = 0.5 * sin(p * 30) * h;
        k.burst(sparks, lin(p, 0.05, 0.7), 0.4, 0.2, 0);
        return;
      }
      if (st === 'sono') {
        coal.emissiveIntensity = 0.5 + 0.15 * sin(t * 1.2);
        smokeM.opacity = 0.12;
        egg.rotation.z = 0.04 * sin(t * 0.8);
        return;
      }
      if (st === 'entra') {
        trunk.scale.set(1, mx(0.05, sm(lin(p, 0, 0.5))), 1);
        nest.position.y = 0.62 * trunk.scale.y; nest.scale.setScalar(mx(0.05, sm(lin(p, 0.3, 0.7))));
        egg.scale.setScalar(mx(0.05, sm(lin(p, 0.6, 0.9)) * (1 + 0.2 * sin(lin(p, 0.6, 1) * PI))));
        coal.emissiveIntensity = 1.6 + 2 * sin(lin(p, 0.5, 1) * PI);
        k.burst(sparks, lin(p, 0.6, 1), 0.5, 0.2, 0);
        return;
      }
      // idle: o ovo bamboleia, fumaça sobe em fios, brasas respiram, faísca escapa
      const u = fr(t, 3.0) * 3.0;
      const wob = u < 1.0 ? sin(u * PI * 4) * (1 - u) : 0;
      egg.rotation.z = 0.25 * wob; egg.rotation.x = 0.1 * wob;
      k.rise(sparks, t, 2.0, 0.5, 0.12, 0.08, 1);
    }
    anim('idle', 0, 0);
    return { obj: root, anim };
  };
})();
