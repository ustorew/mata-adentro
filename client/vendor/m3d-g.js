// m3d-g.js (v10, Mata Adentro): bustos/retratos 3D chibi-heroicos do Andarilho (você), da Vó Zinha Candeia e dos 9 rivais (window.CHAR3D).
// Contrato: MODELOS3D.md + spec v10 §7/§12.2. Bonequinhos inteiros, pés em y=0, olhando para +Z (o retrato enquadra cabeça e ombros).
// Olhos com mesh.userData.olho=true; roupa principal com mat.userData.corpo=true. Cores em sRGB (ColorManagement.legacyMode=false).
(function () {
  'use strict';
  window.CHAR3D = window.CHAR3D || {};
  const CH = window.CHAR3D;
  const PI = Math.PI, sin = Math.sin, cos = Math.cos, abs = Math.abs;
  const cl = (x, a, b) => (x < a ? a : (x > b ? b : x));
  const sm = x => { x = cl(x, 0, 1); return x * x * (3 - 2 * x); };
  const sg = (p, a, b) => sm((p - a) / (b - a));
  const mix = (a, b, k) => a + (b - a) * k;
  const fr = x => x - Math.floor(x);
  const tiny = 0.001;
  // ataque: w = preparação (0..0.35), s = golpe (0.35..0.55 no extremo, volta até 1)
  function atkC(p) {
    p = cl(p, 0, 1);
    const w = p < 0.35 ? sm(p / 0.35) : 1 - sg(p, 0.35, 0.44);
    const s = p < 0.35 ? 0 : (p < 0.55 ? sg(p, 0.35, 0.45) : 1 - sg(p, 0.55, 1));
    return { w, s };
  }
  function hitC(p) { p = cl(p, 0, 1); return p < 0.2 ? sm(p / 0.2) : 1 - sg(p, 0.2, 1); }
  function blinkC(t, per, off) { const x = (t + (off || 0)) % per; return x < 0.18 ? sin(x / 0.18 * PI) : 0; }

  // ------------------------------------------------------------ kit local (não depende do KIT3D do motor)
  function kit(T) {
    const mats = {}, geos = {};
    const K = { T };
    K.mat = (c, o) => {
      const k = c + JSON.stringify(o || {});
      if (!mats[k]) mats[k] = new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6, metalness: 0 }, o || {}));
      return mats[k];
    };
    // material próprio (quando a animação mexe em emissive/opacity)
    K.own = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6, metalness: 0 }, o || {}));
    K.glow = (c, k) => K.mat(c, { roughness: 0.35, emissive: c, emissiveIntensity: k == null ? 0.5 : k });
    const Q = { h: [22, 15], m: [16, 12], l: [10, 8], x: [8, 6] };
    K.sgeo = (q) => { const k = 's' + q; return geos[k] || (geos[k] = new T.SphereGeometry(1, Q[q][0], Q[q][1])); };
    K.grp = (parent, x, y, z) => { const g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(g); return g; };
    K.mesh = (parent, geo, mat, x, y, z) => {
      const m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
      m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
    };
    K.ball = (parent, mat, r, x, y, z, sx, sy, sz, q) => {
      const m = K.mesh(parent, K.sgeo(q || 'm'), mat, x, y, z);
      m.scale.set(r * (sx == null ? 1 : sx), r * (sy == null ? (sx == null ? 1 : sx) : sy), r * (sz == null ? (sx == null ? 1 : sx) : sz));
      return m;
    };
    // calota de esfera (cabelo, bonés, gorros): theta = fração do polo até onde cobre
    K.dome = (parent, mat, r, th, x, y, z, sx, sy, sz) => {
      const k = 'd' + th;
      const g = geos[k] || (geos[k] = new T.SphereGeometry(1, 20, 10, 0, PI * 2, 0, PI * th));
      const m = K.mesh(parent, g, mat, x, y, z);
      m.scale.set(r * (sx || 1), r * (sy || sx || 1), r * (sz || sx || 1));
      return m;
    };
    K.cyl = (parent, mat, rt, rb, h, x, y, z, seg) => {
      const k = 'c' + rt + '_' + rb + '_' + h + '_' + (seg || 14);
      const g = geos[k] || (geos[k] = new T.CylinderGeometry(rt, rb, h, seg || 14));
      return K.mesh(parent, g, mat, x, y, z);
    };
    K.cap = (parent, mat, r, len, x, y, z, rs) => {
      const k = 'p' + r + '_' + len + '_' + (rs || 10);
      const g = geos[k] || (geos[k] = new T.CapsuleGeometry(r, len, 3, rs || 10));
      return K.mesh(parent, g, mat, x, y, z);
    };
    K.torus = (parent, mat, R, r, x, y, z, arc, rs, ts) => {
      const k = 't' + R + '_' + r + '_' + (arc || 0) + '_' + (rs || 8) + '_' + (ts || 24);
      const g = geos[k] || (geos[k] = new T.TorusGeometry(R, r, rs || 8, ts || 24, arc || PI * 2));
      return K.mesh(parent, g, mat, x, y, z);
    };
    K.cone = (parent, mat, r, h, x, y, z, seg) => {
      const k = 'k' + r + '_' + h + '_' + (seg || 12);
      const g = geos[k] || (geos[k] = new T.ConeGeometry(r, h, seg || 12));
      return K.mesh(parent, g, mat, x, y, z);
    };
    K.box = (parent, mat, w, h, d, x, y, z) => {
      const k = 'b' + w + '_' + h + '_' + d;
      const g = geos[k] || (geos[k] = new T.BoxGeometry(w, h, d, 1, 1, 1));
      return K.mesh(parent, g, mat, x, y, z);
    };
    // brilho (estrelinha de 4 pontas barata)
    K.spark = (parent, mat, r, x, y, z) => {
      const g = geos.oct || (geos.oct = new T.OctahedronGeometry(1, 0));
      const m = K.mesh(parent, g, mat, x, y, z); m.scale.set(r * 0.45, r, r * 0.45); return m;
    };
    K.lathe = (parent, mat, pts, seg, x, y, z) => {
      const g = new T.LatheGeometry(pts.map(q => new T.Vector2(q[0], q[1])), seg || 24);
      return K.mesh(parent, g, mat, x, y, z);
    };
    // tubo afinado ao longo de pontos
    K.tube = (parent, mat, pts, r0, r1, ts, rs, closed) => {
      ts = ts || 14; rs = rs || 8;
      const curve = new T.CatmullRomCurve3(pts.map(a => new T.Vector3(a[0], a[1], a[2])), !!closed);
      const g = new T.TubeGeometry(curve, ts, 1, rs, !!closed);
      const pos = g.attributes.position, v = new T.Vector3(), c = new T.Vector3();
      for (let i = 0; i <= ts; i++) {
        curve.getPointAt(i / ts, c);
        const r = mix(r0, r1, i / ts);
        for (let j = 0; j <= rs; j++) { const k = i * (rs + 1) + j; v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c); pos.setXYZ(k, v.x, v.y, v.z); }
      }
      g.computeVertexNormals();
      return K.mesh(parent, g, mat, 0, 0, 0);
    };
    K.shape = (parent, mat, pts, depth, bev, x, y, z, curved) => {
      const s = new T.Shape();
      if (curved) curved(s); else { s.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) s.lineTo(pts[i], pts[i + 1]); s.closePath(); }
      const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 6 });
      g.translate(0, 0, -depth / 2);
      return K.mesh(parent, g, mat, x, y, z);
    };
    // caixa arredondada (fardo de feno, sacos, bandejas)
    K.rbox = (parent, mat, w, h, d, r, x, y, z) => {
      const ww = w / 2 - r, hh = h / 2 - r;
      return K.shape(parent, mat, null, Math.max(0.001, d - 2 * r), r, x, y, z, s => {
        const c = Math.min(ww, hh) * 0.35;
        s.moveTo(-ww + c, -hh); s.lineTo(ww - c, -hh); s.quadraticCurveTo(ww, -hh, ww, -hh + c);
        s.lineTo(ww, hh - c); s.quadraticCurveTo(ww, hh, ww - c, hh);
        s.lineTo(-ww + c, hh); s.quadraticCurveTo(-ww, hh, -ww, hh - c);
        s.lineTo(-ww, -hh + c); s.quadraticCurveTo(-ww, -hh, -ww + c, -hh);
      });
    };
    // olho fofo: branco + pupila + brilho + cílio (olho fechado)
    K.eye = (parent, x, y, z, r, o) => {
      o = o || {};
      const sy = o.sy || 1.15;
      const g = K.grp(parent, x, y, z);
      g.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
      const bg = K.grp(g, 0, 0, 0);
      K.ball(bg, K.mat(o.white || '#F4EFE6', { roughness: 0.25 }), r, 0, 0, 0, 1, sy, 0.6, 'l').userData.olho = true;
      const pg = K.grp(bg, 0, 0, 0);
      K.ball(pg, K.mat(o.pupil || '#1E1626', o.pe ? { roughness: 0.2, emissive: o.pe, emissiveIntensity: 1.3 } : { roughness: 0.2 }), r * (o.pr || 0.66), 0, -r * 0.05, r * 0.4, 1, 1.1, 0.5, 'l').userData.olho = true;
      K.ball(pg, K.mat('#FFFFFF', { roughness: 0.2, emissive: '#FFFFFF', emissiveIntensity: 0.8 }), r * 0.24, r * 0.24, r * 0.3, r * 0.66, 1, 1, 0.6, 'x');
      const lash = K.torus(g, K.mat('#2A1E22', { roughness: 0.6 }), r * 0.7, r * 0.13, 0, r * 0.1, r * 0.5, PI, 5, 10);
      lash.rotation.z = PI;
      return { g, bg, pg, lash, r };
    };
    K.eyes = (parent, x, y, z, r, o) => {
      o = o || {};
      return [1, -1].map(s => K.eye(parent, x * s, y, z, r, Object.assign({}, o, { ry: (o.ry || 0.32) * s, rz: (o.rz || 0) * s })));
    };
    // c = fechado 0..1 ; lx/ly olhar ; happy = olho fechado em arco feliz (^ ^)
    K.setEyes = (E, c, lx, ly, happy) => {
      for (const e of E) {
        const sq = c > 0.85 ? tiny : Math.max(0.12, 1 - c * 1.05);
        e.bg.scale.set(1, sq, 1);
        e.lash.scale.setScalar(c > 0.85 ? 1 : tiny);
        e.lash.rotation.z = happy ? 0 : PI;
        e.lash.position.y = happy ? -e.r * 0.25 : e.r * 0.1;
        e.pg.position.set((lx || 0) * e.r * 0.3, (ly || 0) * e.r * 0.3, 0);
      }
    };
    K.zzz = (parent, x, y, z) => {
      const g = K.grp(parent, x, y, z);
      const m = K.mat('#EAF2FF', { roughness: 0.4, emissive: '#9DB8FF', emissiveIntensity: 0.35 });
      const zs = [];
      for (let i = 0; i < 2; i++) {
        const s = 0.07 - i * 0.02;
        zs.push(K.shape(g, m, [-s, s, s, s, s, s * 0.6, -s * 0.35, -s * 0.6, s, -s * 0.6, s, -s, -s, -s, -s, -s * 0.6, s * 0.35, s * 0.6, -s, s * 0.6], 0.025, 0.008, 0, 0, 0));
      }
      return { g, zs };
    };
    K.setZzz = (Z, on, t) => {
      for (let i = 0; i < Z.zs.length; i++) {
        const z = Z.zs[i];
        if (!on) { z.scale.setScalar(tiny); continue; }
        const f = ((t * 0.45) + i * 0.5) % 1;
        z.position.set(sin(f * 5 + i) * 0.06 + f * 0.12, f * 0.4, 0);
        z.rotation.z = 0.25 * sin(f * 4);
        z.scale.setScalar(Math.max(tiny, sin(f * PI) * 1.2));
      }
    };
    return K;
  }

  // poses comuns do rig: hit / entra
  function baseRig(rig, st, t, p) {
    rig.position.set(0, 0, 0); rig.rotation.set(0, 0, 0); rig.scale.set(1, 1, 1);
    if (st === 'hit') {
      const f = hitC(p);
      rig.position.z = -0.12 * f; rig.rotation.x = -0.12 * f;
      rig.position.x = sin(p * 46) * 0.03 * (1 - p);
      rig.scale.set(1 + 0.05 * f, 1 - 0.07 * f, 1 + 0.05 * f);
    } else if (st === 'entra') {
      const drop = 1 - sg(p, 0, 0.42);
      rig.position.y = drop * drop * 1.1;
      const sq = p > 0.38 && p < 0.78 ? sin((p - 0.38) / 0.4 * PI) : 0;
      rig.scale.set(1 + sq * 0.12, 1 - sq * 0.16, 1 + sq * 0.12);
    }
  }

  // ------------------------------------------------------------ bonequinho chibi (cabeça grande, corpo pequeno)
  // o: skin, hair, shirt, sleeve, pants, shoes, skirt, hipY, bw, bh, bd, hr, ...
  function person(T, o) {
    const K = kit(T);
    const P = { K, o };
    P.root = new T.Group();
    const rig = P.rig = K.grp(P.root);
    const hipY = P.hipY = o.hipY || 0.3;
    const skin = P.skin = K.mat(o.skin, { roughness: 0.6 });
    const skinD = K.mat(o.skinD || o.skin, { roughness: 0.6 });
    P.hairM = K.mat(o.hair || '#3B2A2F', { roughness: 0.7 });
    const legM = K.mat(o.pants || '#4A3328', { roughness: 0.7 }), shoeM = K.mat(o.shoes || '#4A3328', { roughness: 0.5 });
    P.legs = [1, -1].map(sd => {
      const g = K.grp(rig, sd * (o.legX || 0.08), hipY, 0);
      K.cap(g, legM, o.legR || 0.062, Math.max(0.02, hipY - 0.14), 0, -hipY / 2 + 0.03, 0, 10);
      K.ball(g, shoeM, 0.08, 0, -hipY + 0.045, 0.03, 0.95, 0.6, 1.3, 'm');
      return g;
    });
    P.hips = K.grp(rig, 0, hipY, 0);
    P.chest = K.grp(P.hips, 0, 0, 0);
    const bw = P.bw = o.bw || 0.2, bh = P.bh = o.bh || 0.22, bd = P.bd = o.bd || 0.16;
    const tc = P.tc = bh * 0.8;
    P.shirtM = K.own(o.shirt, { roughness: 0.65 }); P.shirtM.userData.corpo = true;
    P.torso = K.ball(P.chest, P.shirtM, 1, 0, tc, 0, bw, bh, bd, 'h');
    if (o.skirt) {
      const yb = -hipY * 0.62, rb = bw * (o.skirtW || 1.25);
      P.skirt = K.lathe(P.chest, K.mat(o.skirt, { roughness: 0.65 }), [[0.0001, yb], [rb * 0.96, yb], [rb, yb + 0.025], [rb * 0.93, yb + 0.12], [bw * 0.98, tc - 0.06], [bw * 0.8, tc + 0.02]], 22, 0, 0, 0);
    }
    P.arms = [1, -1].map(sd => {
      const g = K.grp(P.chest, sd * bw * 0.93, tc + bh * 0.48, 0);
      K.cap(g, K.mat(o.sleeve || o.shirt, { roughness: 0.65 }), 0.05, 0.13, 0, -0.1, 0, 10);
      const hand = K.grp(g, 0, -0.22, 0);
      if (!o.noHands) K.ball(hand, skin, 0.055, 0, 0, 0, 1, 1, 1, 'l');
      return { g, hand, sd };
    });
    const hr = P.hr = o.hr || 0.27;
    P.neck = K.grp(P.chest, 0, tc + bh * 0.88, 0);
    P.head = K.grp(P.neck, 0, hr * 0.85, 0.01);
    P.skull = K.ball(P.head, skin, hr, 0, 0, 0, o.hsx || 1, o.hsy || 0.95, 0.95, 'h');
    if (!o.noEars) for (const sd of [1, -1]) K.ball(P.head, skin, hr * 0.17, sd * hr * 0.96 * (o.hsx || 1), -hr * 0.06, 0, 0.55, 1, 0.8, 'l');
    P.nose = K.ball(P.head, skinD, hr * (o.nose || 0.12), 0, -hr * 0.13, hr * 0.94, 1, 0.85, 0.8, 'l');
    if (o.cheek !== false) for (const sd of [1, -1]) K.ball(P.head, K.mat(o.cheek || '#F49AC1', { roughness: 0.6 }), hr * 0.14, sd * hr * 0.55, -hr * 0.26, hr * 0.77, 1, 0.6, 0.4, 'l');
    P.E = K.eyes(P.head, hr * 0.34, hr * (o.eyeY || 0.06), hr * 0.85, hr * (o.eyeR || 0.2), { ry: 0.36, pupil: o.pupil, pe: o.pupilE, pr: o.pr, white: o.white });
    P.browM = K.mat(o.brow || o.hair || '#3B2A2F', { roughness: 0.7 });
    P.brows = [1, -1].map(sd => K.cap(P.head, P.browM, o.browR || 0.013, hr * 0.17, sd * hr * 0.34, hr * 0.33, hr * 0.88, 6));
    const my = -hr * (o.mouthY || 0.38), mz = hr * (o.mouthZ || 0.87);
    P.smile = K.torus(P.head, K.mat('#4A1A24', { roughness: 0.5 }), hr * (o.smileR || 0.15), 0.012, 0, my, mz, PI, 5, 12);
    P.smile.rotation.set(-0.35, 0, PI);
    P.open = K.ball(P.head, K.mat('#6A1A2A', { roughness: 0.5 }), hr * 0.13, 0, my - hr * 0.04, mz - 0.01, 1, 1, 0.45, 'l');
    P.Z = K.zzz(P.head, hr * 0.9, hr * 0.9, 0);
    return P;
  }
  // chapéu de palha / de aba: brim + copa + fita
  function hat(K, P, o) {
    const hr = P.hr;
    const g = K.grp(P.head, o.x || 0, hr * (o.y == null ? 0.62 : o.y), o.z || -hr * 0.04);
    g.rotation.set(o.rx == null ? -0.15 : o.rx, 0, o.rz || 0);
    const m = K.mat(o.c, { roughness: 0.7 });
    const R = hr * (o.brim || 1.5);
    if (o.lathe) {
      K.lathe(g, K.mat(o.c, { roughness: 0.7, side: T0(K).DoubleSide }), [[R * 0.4, -0.005], [R * 0.75, -0.008], [R * 0.95, 0.01], [R, 0.04]], 28, 0, 0, 0);
    } else {
      K.cyl(g, m, R, R * 0.98, 0.028, 0, 0, 0, 28);
    }
    const ch = hr * (o.crownH || 0.5);
    K.cyl(g, K.mat(o.c2 || o.c, { roughness: 0.7 }), hr * (o.crownT || 0.58), hr * (o.crownB || 0.68), ch, 0, ch / 2, 0, 20);
    if (o.top !== false) K.ball(g, K.mat(o.c2 || o.c, { roughness: 0.7 }), hr * (o.crownT || 0.58), 0, ch, 0, 1, 0.35, 1, 'm');
    let band = null;
    if (o.band) { band = K.torus(g, K.mat(o.band, { roughness: 0.55 }), hr * (o.crownB || 0.68) * 0.99, 0.022, 0, 0.035, 0, PI * 2, 6, 24); band.rotation.x = PI / 2; }
    return { g, band, ch };
  }
  function T0(K) { return K.T; }
  // olhar vivo: piscar, olhar em volta
  function stateIdle(t, off) {
    return {
      br: sin(t * 2 + off) * 0.5 + 0.5, hrx: 0, hry: sin(t * 0.55 + off) * 0.16, hrz: sin(t * 0.9 + off) * 0.04,
      closed: blinkC(t, 3.4, off), lx: sin(t * 0.55 + off) * 0.5, ly: 0, mouth: 0, happy: false,
      aR: [0.06, 0.14, 0], aL: [0.06, 0.14, 0], cRx: 0, cRy: 0, cRz: 0, legs: [0, 0], jump: 0, brow: 0, browY: 0
    };
  }
  function animPerson(P, pose, off) {
    const K = P.K;
    // rosto legível no retrato: a cabeça não recebe a sombra da aba do chapéu
    P.head.traverse(m => { if (m.isMesh) m.receiveShadow = false; });
    const T = K.T, qa = new T.Quaternion(), qb = new T.Quaternion();
    return function anim(st, t, p) {
      baseRig(P.rig, st, t, p);
      const S = stateIdle(t, off || 0);
      if (st === 'atk') {
        // padrão: comemora (braços pra cima, pulinho)
        const { w, s } = atkC(p);
        S.jump = s * 0.1; S.legs = [-0.3 * s, 0.3 * s];
        S.aR = [0.3 * w, 0.14 + 2.5 * s, 0]; S.aL = [0.3 * w, 0.14 + 2.5 * s, 0];
        S.mouth = s; S.happy = s > 0.3; S.closed = s > 0.3 ? 1 : 0; S.cRx = 0.12 * w - 0.08 * s; S.hrx = -0.15 * s; S.hry = 0;
        S.w = w; S.s = s;
      } else if (st === 'hit') {
        const f = hitC(p);
        S.closed = f; S.mouth = 0.6 * f; S.brow = -f; S.cRx = -0.15 * f; S.hrx = -0.2 * f; S.hry = 0; S.hrz = 0.15 * f;
        S.aR = [0.7 * f, 0.4 + 0.3 * f, 0]; S.aL = [0.7 * f, 0.4 + 0.3 * f, 0]; S.f = f;
      } else if (st === 'sono') {
        S.br = sin(t * 1.1) * 0.5 + 0.5; S.closed = 1; S.hrx = 0.32; S.hrz = 0.14; S.hry = 0; S.cRx = 0.06; S.lx = 0;
        S.aR = [0.02, 0.1, 0]; S.aL = [0.02, 0.1, 0]; S.mouth = 0;
      } else if (st === 'entra') {
        const k = sg(p, 0.45, 0.7) * (1 - sg(p, 0.9, 1));
        S.aR = [0.2, 0.14 + 2.4 * k + sin(p * 40) * 0.2 * k, 0]; S.mouth = 0.6 * k; S.happy = k > 0.5; S.closed = k > 0.5 ? 1 : 0;
      }
      if (pose) pose(st === 'atk' || st === 'hit' || st === 'sono' || st === 'entra' ? st : 'idle', t, p, S, P);
      P.rig.position.y += S.jump;
      P.hips.position.y = P.hipY + S.br * 0.004;
      P.chest.rotation.set(S.cRx, S.cRy, S.cRz);
      P.torso.scale.set(P.bw * (1 + S.br * 0.02), P.bh, P.bd * (1 + S.br * 0.03));
      P.head.rotation.set(S.hrx, S.hry, S.hrz);
      for (let i = 0; i < 2; i++) {
        const A = P.arms[i], a = i ? S.aL : S.aR;
        A.g.rotation.set(-a[0], a[2] || 0, A.sd * a[1]);
      }
      P.legs[0].rotation.x = S.legs[0]; P.legs[1].rotation.x = S.legs[1];
      K.setEyes(P.E, S.closed, S.lx, S.ly, S.happy);
      const m = cl(S.mouth, 0, 1);
      P.smile.scale.setScalar(m > 0.3 ? tiny : 1);
      if (m > 0.3) P.open.scale.set(P.hr * 0.13 * (0.9 + m * 0.3), P.hr * 0.13 * (0.3 + m * 0.8), P.hr * 0.13 * 0.45);
      else P.open.scale.setScalar(tiny);
      for (let i = 0; i < 2; i++) {
        const sd = i ? -1 : 1;
        P.brows[i].rotation.set(0, 0, PI / 2 + sd * S.brow * 0.35);
        P.brows[i].position.y = P.hr * 0.33 + S.browY * P.hr * 0.06 - S.brow * 0.004;
      }
      K.setZzz(P.Z, st === 'sono', t);
      // lanternas penduradas ficam de pé (prumo), com um balanço leve
      if (K.levels) {
        P.root.updateMatrixWorld(true); P.root.getWorldQuaternion(qb);
        K.levels.forEach((g, i) => { g.parent.getWorldQuaternion(qa); g.quaternion.copy(qa.invert()).multiply(qb); g.rotateZ(0.12 * sin(t * 1.7 + i)); g.rotateX(0.06 * sin(t * 1.3 + i)); });
      }
    };
  }
  const kitOf = P => P.K;

  // várias esferas numa malha só (economiza malhas): itens [r, x, y, z, sx, sy, sz, rx, ry, rz]
  function mballs(K, par, mat, list, q) {
    const T = K.T, Q = { m: [16, 12], l: [10, 8], x: [8, 6] }[q || 'l'];
    const src = new T.SphereGeometry(1, Q[0], Q[1]).toNonIndexed(), n = src.attributes.position.count;
    const pos = new Float32Array(n * 3 * list.length), nor = new Float32Array(n * 3 * list.length);
    const o = new T.Object3D(), v = new T.Vector3(), nm = new T.Matrix3();
    list.forEach((it, k) => {
      const r = it[0], sx = it[4] == null ? 1 : it[4], sy = it[5] == null ? sx : it[5], sz = it[6] == null ? sx : it[6];
      o.position.set(it[1], it[2], it[3]); o.rotation.set(it[7] || 0, it[8] || 0, it[9] || 0); o.scale.set(r * sx, r * sy, r * sz); o.updateMatrix();
      nm.getNormalMatrix(o.matrix);
      for (let i = 0; i < n; i++) {
        v.fromBufferAttribute(src.attributes.position, i).applyMatrix4(o.matrix); pos.set([v.x, v.y, v.z], (k * n + i) * 3);
        v.fromBufferAttribute(src.attributes.normal, i).applyMatrix3(nm).normalize(); nor.set([v.x, v.y, v.z], (k * n + i) * 3);
      }
    });
    src.dispose();
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nor, 3));
    g.computeBoundingSphere();
    return K.mesh(par, g, mat, 0, 0, 0);
  }
  // várias geometrias quaisquer numa malha só: itens [geo, x, y, z, rx, ry, rz, sx, sy, sz]
  function mgeo(K, par, mat, list) {
    const T = K.T, o = new T.Object3D(), v = new T.Vector3(), nm = new T.Matrix3(), P = [], N = [];
    for (const it of list) {
      const g = it[0].index ? it[0].toNonIndexed() : it[0], pa = g.attributes.position, na = g.attributes.normal;
      const sx = it[7] == null ? 1 : it[7], sy = it[8] == null ? sx : it[8], sz = it[9] == null ? sx : it[9];
      o.position.set(it[1] || 0, it[2] || 0, it[3] || 0); o.rotation.set(it[4] || 0, it[5] || 0, it[6] || 0); o.scale.set(sx, sy, sz); o.updateMatrix(); nm.getNormalMatrix(o.matrix);
      for (let i = 0; i < pa.count; i++) {
        v.fromBufferAttribute(pa, i).applyMatrix4(o.matrix); P.push(v.x, v.y, v.z);
        v.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); N.push(v.x, v.y, v.z);
      }
      if (g !== it[0]) g.dispose(); it[0].dispose();
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); g.computeBoundingSphere();
    return K.mesh(par, g, mat, 0, 0, 0);
  }
  // ------------------------------------------------------------ adereços comuns
  // lanterna de vidro (andarilho) ou candeeiro de lata com bico (sertão); devolve a chama para piscar
  function lampada(K, par, o) {
    o = o || {};
    const g = K.grp(par, o.x || 0, o.y || 0, o.z || 0);
    if (o.nivel !== false) (K.levels || (K.levels = [])).push(g);
    const met = K.mat(o.met || '#3A3A40', { roughness: 0.4, metalness: 0.7 });
    const fm = K.own(o.c || '#FFC060', { roughness: 0.3, emissive: o.e || '#FF8A1A', emissiveIntensity: 2.2 });
    let flame;
    if (o.tipo === 'lata') { // candeeiro/candeia: potinho de lata (ou barro) com bico e chama em cima
      K.cyl(g, K.mat(o.pot || '#8A8A90', { roughness: 0.45, metalness: o.pot ? 0 : 0.6 }), 0.035, 0.045, 0.05, 0, -0.02, 0, 12);
      K.cone(g, met, 0.018, 0.04, 0, 0.022, 0.01, 8);
      K.torus(g, met, 0.022, 0.006, -0.05, -0.02, 0, PI * 2, 4, 10).rotation.y = PI / 2;
      flame = K.ball(g, fm, 0.02, 0, 0.06, 0.012, 0.8, 1.6, 0.8, 'l');
    } else {
      const T = K.T;
      mgeo(K, g, met, [[new T.TorusGeometry(0.028, 0.006, 4, 10), 0, 0.07, 0], [new T.ConeGeometry(0.05, 0.035, 8), 0, 0.045, 0], [new T.CylinderGeometry(0.045, 0.045, 0.014, 10), 0, -0.05, 0],
        ...[0.8, 2.4, 4.0, 5.6].map(a => [new T.CylinderGeometry(0.004, 0.004, 0.09, 4), sin(a) * 0.04, 0, cos(a) * 0.04])]);
      K.cyl(g, K.mat(o.c || '#FFC060', { roughness: 0.2, emissive: o.e || '#FF8A1A', emissiveIntensity: 0.5, transparent: true, opacity: 0.35, depthWrite: false }), 0.038, 0.038, 0.085, 0, 0, 0, 12).castShadow = false;
      flame = K.ball(g, fm, 0.02, 0, -0.005, 0, 0.8, 1.4, 0.8, 'l');
    }
    const halo = K.ball(g, K.mat(o.c || '#FFC060', { emissive: o.e || '#FF8A1A', emissiveIntensity: 0.8, transparent: true, opacity: 0.12, depthWrite: false }), o.halo || 0.1, 0, 0.01, 0, 1, 1, 1, 'l');
    halo.castShadow = false;
    return { g, flame, fm, halo, base: flame.scale.clone(), hb: halo.scale.x };
  }
  function piscar(L, t, k) {
    const f = 0.85 + 0.15 * sin(t * 13 + (k || 0)) * sin(t * 7.3);
    L.flame.scale.set(L.base.x * f, L.base.y * (0.9 + 0.2 * f), L.base.z * f);
    L.fm.emissiveIntensity = 2.2 * f; L.halo.scale.setScalar(L.hb * f);
  }
  // livreto de cordel (capa clara com xilogravura escura)
  function cordel(K, par, x, y, z, c) {
    const g = K.grp(par, x, y, z);
    K.box(g, K.mat(c || '#E8DCC0', { roughness: 0.85 }), 0.06, 0.085, 0.008, 0, 0, 0);
    K.box(g, K.mat('#2A2420', { roughness: 0.8 }), 0.04, 0.035, 0.002, 0, 0.01, 0.005);
    K.box(g, K.mat('#2A2420', { roughness: 0.8 }), 0.04, 0.006, 0.002, 0, -0.03, 0.005);
    return g;
  }

  // ============================================================ VOCÊ, ANDARILHO DAS LENDAS (heroi-voce)
  // jovem andarilho (gênero ambíguo): lanterna, bornal de couro, bandana, um bem-te-vi no ombro
  // visuais do herói (Mascate / Vila): cores da roupa + uma peça-assinatura cada (o = { heroi, acessorio })
  const HEROI_LOOK = {
    'heroi-gibao': { shirt: '#8A5A32', sleeve: '#7A4E2A', pants: '#4A3626', band: '#B8322A' },
    'heroi-pescadora': { shirt: '#2E7F95', sleeve: '#2A6E82', pants: '#6A5A44', band: '#E8D8A8' },
    'heroi-mateira': { shirt: '#3E6A3A', sleeve: '#355C32', pants: '#3A3328', band: '#B8B0E8' },
    'heroi-repentista': { shirt: '#E8862E', sleeve: '#D0742A', pants: '#33395A', band: '#2E5AA8' },
    'heroi-fogueira': { shirt: '#5A2A1E', sleeve: '#4A2218', pants: '#2A1E1A', band: '#FF7A1A' },
    'heroi-contador': { shirt: '#D9C29A', sleeve: '#C8B086', pants: '#4A3A2E', band: '#7A3A2A' }
  };
  CH['heroi-voce'] = function (T, _k, o) {
    o = o || {};
    const look = typeof o.heroi === 'string' && HEROI_LOOK[o.heroi] ? o.heroi : '', LK = HEROI_LOOK[look] || {};
    const acc = typeof o.acessorio === 'string' ? o.acessorio : '';
    const P = person(T, { skin: '#B07850', skinD: '#966240', hair: '#2A1A14', shirt: LK.shirt || '#2E4A52', sleeve: LK.sleeve || '#2E4A52', pants: LK.pants || '#3A2A22', shoes: '#4A3020', cheek: '#C47A6A', hipY: 0.3, bw: 0.19, bh: 0.21, bd: 0.155 });
    const K = kitOf(P), hr = P.hr, tc = P.tc;
    const leather = K.mat('#7A4A28', { roughness: 0.6 }), leatherD = K.mat('#5A3420', { roughness: 0.65 });
    const ember = look === 'heroi-fogueira' ? K.own('#FF7A1A', { roughness: 0.4, emissive: '#FF4A00', emissiveIntensity: 0.9 }) : null;
    const red = ember || K.mat(LK.band || '#B8322A', { roughness: 0.6 });
    // cabelo na altura do queixo, franja de lado
    const cap = K.dome(P.head, P.hairM, hr * 1.06, 0.52, 0, hr * 0.02, -hr * 0.03, 1, 1, 1); cap.rotation.x = -0.4;
    mballs(K, P.head, P.hairM, [[0.88, -0.25, -0.15, 0.3], [-0.88, -0.25, -0.15, 0.3], [0, -0.2, -0.75, 0.42], [0.45, 0.5, 0.7, 0.26], [0.15, 0.62, 0.62, 0.2]].map(([x, y, z, r]) => [hr * r, x * hr, y * hr, z * hr, 1, 1.15, 0.9]));
    // bandana no pescoço (cor do visual; brasa no Andarilho da Fogueira)
    K.torus(P.chest, red, 0.09, 0.03, 0, tc + P.bh * 0.82, 0, PI * 2, 6, 16).rotation.x = PI / 2;
    const nk = K.cone(P.chest, red, 0.075, 0.11, 0.02, tc + P.bh * 0.62, P.bd * 0.8, 3); nk.rotation.set(PI + 0.45, 0, 0); nk.scale.set(1, 1, 0.35);
    // cinto
    K.cyl(P.chest, leatherD, P.bw * 1.0, P.bw * 1.02, 0.03, 0, tc - P.bh * 0.62, 0, 18);
    // lanterna na mão esquerda (violeta com o acessório "Lanterna violeta")
    const vio = acc === 'acess-lanterna';
    const L = lampada(K, P.arms[1].hand, vio ? { y: -0.1, z: 0.02, c: '#D8B8FF', e: '#8A3AFF', halo: 0.12 } : { y: -0.1, z: 0.02 }); L.g.scale.setScalar(1.35);
    // bem-te-vi no ombro direito
    const bird = K.grp(P.chest, P.bw * 1.22, tc + P.bh * 0.85, 0.04); bird.scale.setScalar(1.25);
    const bBrown = K.mat('#6A4A2E', { roughness: 0.6 }), bYel = K.mat('#F2C21A', { roughness: 0.5 }), bBlk = K.mat('#1A1614', { roughness: 0.5 }), bWh = K.mat('#F4F0E6', { roughness: 0.5 });
    K.ball(bird, bBrown, 0.045, 0, 0.04, -0.01, 1, 0.9, 1.2, 'm');
    K.ball(bird, bYel, 0.04, 0, 0.03, 0.015, 0.95, 0.95, 0.9, 'm');
    const bh = K.grp(bird, 0, 0.085, 0.02);
    K.ball(bh, bBlk, 0.032, 0, 0, 0, 1, 1, 1, 'm');
    K.torus(bh, bWh, 0.028, 0.006, 0, 0.004, 0.0, PI * 1.3, 4, 14).rotation.set(PI / 2, 0, PI * 1.35 + PI / 2);
    K.cone(bh, bBlk, 0.008, 0.03, 0, -0.004, 0.04, 6).rotation.x = PI / 2;
    for (const sd of [1, -1]) { const e = K.ball(bh, K.mat('#0A0808', { roughness: 0.2 }), 0.006, sd * 0.022, 0.004, 0.02, 1, 1, 1, 'x'); e.userData.olho = true; }
    const bw = [1, -1].map(sd => { const w = K.grp(bird, sd * 0.04, 0.05, -0.01); K.ball(w, K.mat('#8A5A30', { roughness: 0.6 }), 0.035, 0, -0.005, -0.01, 0.35, 0.8, 1.2, 'l'); return w; });
    const tail = K.cone(bird, bBrown, 0.02, 0.07, 0, 0.02, -0.07, 6); tail.rotation.x = -PI / 2 - 0.4;

    // bolsinha de couro no cinto (o Bornal do acessório é a versão grande, a tiracolo)
    if (acc !== 'acess-bornal') mgeo(K, P.chest, leather, [[new T.BoxGeometry(0.07, 0.06, 0.035), -P.bw * 0.72, tc - P.bh * 0.78, P.bd * 0.62, 0, -0.5, 0], [new T.BoxGeometry(0.074, 0.025, 0.04), -P.bw * 0.72, tc - P.bh * 0.66, P.bd * 0.63, 0, -0.5, 0]]);
    // ---------- peça-assinatura do visual ----------
    let glow = null, glowK = 0, book = null;
    if (look === 'heroi-gibao') {
      // gibão de couro: gola alta, pespontos em losango e tachas de cobre
      K.ball(P.chest, K.mat('#5E3A20', { roughness: 0.6 }), 1, 0, tc + P.bh * 0.62, 0, P.bw * 0.8, P.bh * 0.3, P.bd * 0.97, 'm');
      mgeo(K, P.chest, K.mat('#D8B888', { roughness: 0.7 }), [0, 1, 2].map(i => [new T.BoxGeometry(0.04, 0.04, 0.006), 0, tc + 0.05 - i * 0.065, P.bd * 0.99, 0, 0, PI / 4]));
      mballs(K, P.chest, K.mat('#C08A40', { roughness: 0.35, metalness: 0.6 }), [1, -1].flatMap(sd => [0, 1, 2].map(i => [0.009, sd * 0.055, tc + 0.05 - i * 0.065, P.bd * 0.96, 1, 1, 0.5])), 'x');
    } else if (look === 'heroi-pescadora' && acc !== 'acess-chapeu') {
      // chapéu de palha de pescadora e uma rede miúda na cintura
      P.hat = hat(K, P, { c: '#D8B870', c2: '#C9A85E', band: '#2E7F95', brim: 1.7, crownH: 0.34, y: 0.5, rx: -0.2, top: false });
      const nt = new T.Mesh(new T.ConeGeometry(0.08, 0.16, 10, 3, true), K.mat('#E8DCC0', { roughness: 0.8, wireframe: true })); nt.castShadow = true;
      nt.position.set(P.bw * 0.95, tc - P.bh * 0.8, 0.02); nt.rotation.z = 0.15; P.chest.add(nt);
    } else if (look === 'heroi-pescadora') {
      const nt = new T.Mesh(new T.ConeGeometry(0.08, 0.16, 10, 3, true), K.mat('#E8DCC0', { roughness: 0.8, wireframe: true })); nt.castShadow = true;
      nt.position.set(P.bw * 0.95, tc - P.bh * 0.8, 0.02); nt.rotation.z = 0.15; P.chest.add(nt);
    } else if (look === 'heroi-mateira') {
      // capa de folhas (duas camadas) e pingente de lua
      const lv = (a0, n, rr, y, s) => Array.from({ length: n }, (_, i) => { const a = PI * a0 + i / (n - 1) * PI * (2 - 2 * a0); return [new T.ConeGeometry(1, 1, 4), sin(a) * rr, y, cos(a) * rr, PI + 0.3, a, 0, 0.065 * s, 0.2 * s, 0.02]; });
      mgeo(K, P.chest, K.mat('#4C7A2C', { roughness: 0.7, side: T.DoubleSide }), lv(0.16, 11, P.bw * 1.04, tc + P.bh * 0.62, 1));
      mgeo(K, P.chest, K.mat('#2F5A24', { roughness: 0.7, side: T.DoubleSide }), lv(0.45, 7, P.bw * 1.12, tc + P.bh * 0.05, 1.2));
      glow = K.own('#EDE6FF', { roughness: 0.4, emissive: '#B8A8FF', emissiveIntensity: 0.8 }); glowK = 0.8;
      K.torus(P.chest, glow, 0.026, 0.009, 0, tc + P.bh * 0.25, P.bd * 1.02, PI * 1.25, 5, 12).rotation.z = -PI * 0.12;
    } else if (look === 'heroi-repentista') {
      // viola nas costas, na diagonal
      const vg = K.grp(P.chest, 0.02, tc - 0.03, P.bd * 1.08); vg.rotation.set(0, 0, 0.75);
      mgeo(K, vg, K.mat('#B07A3A', { roughness: 0.5 }), [[new T.SphereGeometry(1, 14, 8), 0, -0.07, 0, 0, 0, 0, 0.09, 0.1, 0.03], [new T.SphereGeometry(1, 14, 8), 0, 0.04, 0, 0, 0, 0, 0.07, 0.075, 0.03]]);
      mgeo(K, vg, K.mat('#4A2C18', { roughness: 0.6 }), [[new T.BoxGeometry(0.03, 0.22, 0.02), 0, 0.2, 0], [new T.BoxGeometry(0.045, 0.06, 0.022), 0, 0.33, 0], [new T.CylinderGeometry(0.022, 0.022, 0.004, 12), 0, -0.02, 0.03, PI / 2, 0, 0]]);
    } else if (look === 'heroi-fogueira') {
      // lenço de brasa: pontas soltas e faíscas (o lenço pulsa)
      mgeo(K, P.chest, ember, [[new T.ConeGeometry(0.03, 0.16, 4), -0.07, tc + P.bh * 0.55, -P.bd * 0.75, 0.5, 0, 0.35], [new T.ConeGeometry(0.025, 0.13, 4), -0.02, tc + P.bh * 0.5, -P.bd * 0.85, 0.6, 0, -0.1]]);
      glow = K.own('#FFD070', { emissive: '#FFA030', emissiveIntensity: 2.2 }); glowK = 2.2;
      mballs(K, P.chest, glow, [[0.012, -0.12, tc + P.bh * 0.95, -P.bd * 0.7], [0.009, -0.05, tc + P.bh * 1.15, -P.bd * 0.9], [0.008, -0.15, tc + P.bh * 1.25, -P.bd * 0.5]], 'x');
    } else if (look === 'heroi-contador') {
      // livro de causos aberto na mão direita
      book = K.grp(P.arms[0].hand, 0, -0.02, 0.05);
      mgeo(K, book, K.mat('#7A3A2A', { roughness: 0.7 }), [[new T.BoxGeometry(0.1, 0.006, 0.08), -0.05, 0, 0, 0, 0, 0.18], [new T.BoxGeometry(0.1, 0.006, 0.08), 0.05, 0, 0, 0, 0, -0.18]]);
      mgeo(K, book, K.mat('#F2E8D0', { roughness: 0.85 }), [[new T.BoxGeometry(0.092, 0.012, 0.072), -0.047, 0.008, 0, 0, 0, 0.18], [new T.BoxGeometry(0.092, 0.012, 0.072), 0.047, 0.008, 0, 0, 0, -0.18]]);
    }

    // ---------- acessório ----------
    if (acc === 'acess-chapeu') {
      P.hat = hat(K, P, { c: '#6A4426', c2: '#5A3820', band: '#3A2414', brim: 1.55, crownH: 0.42, y: 0.5, rx: -0.2, top: false });
    } else if (acc === 'acess-bornal') {
      // bornal de couro a tiracolo
      const st = K.cap(P.chest, leather, 0.016, 0.36, 0, tc + 0.02, 0.0, 6); st.rotation.z = 0.75;
      const bag = K.grp(P.chest, -P.bw * 0.95, tc - 0.12, 0.05);
      mgeo(K, bag, leather, [[new T.BoxGeometry(0.13, 0.11, 0.055), 0, 0, 0], [new T.TorusGeometry(P.bw * 1.02, 0.014, 4, 24), P.bw * 0.95, 0.14, -0.05, PI / 2, 0.75, 0]]);
      mgeo(K, bag, leatherD, [[new T.BoxGeometry(0.135, 0.055, 0.06), 0, 0.03, 0.003], [new T.SphereGeometry(0.012, 8, 6), 0, 0.01, 0.033]]);
    } else if (acc === 'acess-tarrafa') {
      // tarrafa jogada no ombro esquerdo, com chumbadas
      const tf = K.grp(P.chest, -P.bw * 0.95, tc + P.bh * 0.75, 0.05); tf.rotation.set(-0.1, 0, -0.25);
      const cn = new T.Mesh(new T.ConeGeometry(0.13, 0.32, 12, 4, true), K.mat('#D8CFB0', { roughness: 0.8, wireframe: true })); cn.castShadow = true; cn.position.y = -0.14; cn.rotation.x = PI; tf.add(cn);
      const lead = K.mat('#6A6E78', { roughness: 0.4, metalness: 0.6 });
      K.torus(tf, lead, 0.13, 0.01, 0, -0.3, 0, PI * 2, 4, 18).rotation.x = PI / 2;
      mballs(K, tf, lead, [0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * PI * 2; return [0.014, sin(a) * 0.13, -0.31, cos(a) * 0.13]; }), 'x');
    }

    const anim = animPerson(P, (st, t, p, S) => {
      piscar(L, t);
      bh.rotation.set(0, 0, 0); bw[0].rotation.z = 0; bw[1].rotation.z = 0; bird.position.y = tc + P.bh * 0.85;
      const hop = fr(t / 2.6), hq = hop < 0.15 ? sin(hop / 0.15 * PI) : 0;
      bh.rotation.y = sin(t * 1.3) * 0.8; bird.position.y += hq * 0.03;
      S.aL = [0.55, 0.16, 0];
      if (book) S.aR = [0.75, 0.2, 0];
      if (ember) ember.emissiveIntensity = 0.9 * (0.8 + 0.3 * sin(t * 5) * sin(t * 2.3));
      if (glow) glow.emissiveIntensity = glowK * (0.85 + 0.2 * sin(t * 3.1));
      if (st === 'idle') { if (!book) S.aR = [0.1, 0.16 + 0.05 * sin(t * 1.5), 0]; }
      else if (st === 'atk') {
        // ergue a lanterna e avança; o bem-te-vi grita e bate asas
        S.aL = [0.55 + S.w * 0.6 + S.s * 1.7, 0.2, 0];
        S.aR = [0.3 - S.w * 0.4 + S.s * 0.9, 0.3, 0]; S.legs = [-0.3 * S.s, 0.25 * S.s]; S.happy = false; S.closed = 0; S.brow = 0.6 * S.s; S.mouth = S.s * 0.8;
        bw[0].rotation.z = 0.9 * sin(p * 60) * (S.w + S.s); bw[1].rotation.z = -bw[0].rotation.z; bh.rotation.x = -0.4 * S.s;
        if (glow) glow.emissiveIntensity = glowK * (1 + 1.5 * S.s);
      } else if (st === 'sono') { S.aL = [0.1, 0.12, 0]; L.fm.emissiveIntensity = 0.8; bh.rotation.x = 0.6; bh.rotation.y = 0; }
    }, 0.3);
    return { obj: P.root, anim };
  };

  // ============================================================ VÓ ZINHA CANDEIA (mentora-zinha)
  // avó contadora de causos: candeia acesa, xale, livro de cordel debaixo do braço
  CH['mentora-zinha'] = function (T) {
    const P = person(T, { skin: '#C08A64', skinD: '#A67452', hair: '#D3D8DF', brow: '#B8BEC6', shirt: '#2E3A5C', skirt: '#28324F', pants: '#C08A64', shoes: '#3A2A22', cheek: '#C47A72', hipY: 0.24, bw: 0.21, bh: 0.22, bd: 0.17 });
    const K = kitOf(P), hr = P.hr, tc = P.tc;
    const shawl = K.mat('#5E3A5A', { roughness: 0.8, side: T.DoubleSide }), fringe = K.mat('#7A4E72', { roughness: 0.8 }), gold = K.mat('#C99A3A', { roughness: 0.35, metalness: 0.5 });
    // xale nos ombros (cone aberto) com franjas
    K.lathe(P.chest, shawl, [[P.bw * 0.55, tc + P.bh * 0.95], [P.bw * 1.0, tc + P.bh * 0.65], [P.bw * 1.22, tc + P.bh * 0.1], [P.bw * 1.18, tc - P.bh * 0.15]], 22, 0, 0, 0);
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; K.cap(P.chest, fringe, 0.006, 0.04, sin(a) * P.bw * 1.18, tc - P.bh * 0.24, cos(a) * P.bw * 1.12, 4); }
    // cabelo + coque + óculos
    const cap = K.dome(P.head, P.hairM, hr * 1.07, 0.52, 0, hr * 0.02, -hr * 0.03, 1, 1, 1); cap.rotation.x = -0.4;
    K.ball(P.head, P.hairM, hr * 0.42, 0, hr * 0.95, -hr * 0.35, 1, 0.9, 1, 'm');
    for (const sd of [1, -1]) K.ball(P.head, P.hairM, hr * 0.28, sd * hr * 0.85, hr * 0.05, -hr * 0.15, 0.8, 1, 1, 'l');
    for (const sd of [1, -1]) K.torus(P.head, gold, hr * 0.22, 0.01, sd * hr * 0.34, hr * 0.06, hr * 0.95, PI * 2, 5, 18).rotation.y = sd * 0.36;
    K.cap(P.head, gold, 0.008, hr * 0.14, 0, hr * 0.1, hr * 1.0, 4).rotation.z = PI / 2;
    // candeia de barro na mão direita
    const L = lampada(K, P.arms[0].hand, { tipo: 'lata', pot: '#A8643A', y: 0.03, z: 0.04, halo: 0.14 });
    // livro de cordel debaixo do braço esquerdo
    const book = cordel(K, P.chest, -P.bw * 1.08, tc - 0.02, 0.02, '#E2D2A8'); book.rotation.set(0, PI / 2 - 0.2, 0.15); book.scale.setScalar(1.5);
    const anim = animPerson(P, (st, t, p, S) => {
      S.cRx += 0.08;
      piscar(L, t, 1);
      S.aL = [0.25, 0.32, 0];
      if (st === 'idle') {
        const k = 0.5 + 0.5 * sin(t * 0.9);
        S.aR = [0.9 + 0.15 * k, 0.15, 0]; S.hrx = 0.05 - 0.08 * k; S.happy = k > 0.92; L.g.rotation.x = -S.aR[0];
      } else if (st === 'atk') {
        // ergue a candeia: a luz cresce
        S.aR = [0.9 + S.w * 0.4 + S.s * 1.4, 0.2, 0]; L.g.rotation.x = -S.aR[0]; S.brow = 0.5 * S.s; S.mouth = S.s * 0.7; S.happy = false; S.closed = 0;
        L.halo.scale.setScalar(L.hb * (1 + 2.5 * S.s)); L.fm.emissiveIntensity = 2.2 + 3 * S.s;
      } else { S.aR = [0.7, 0.15, 0]; L.g.rotation.x = -0.7; if (st === 'sono') L.fm.emissiveIntensity = 0.8; }
    }, 1.1);
    return { obj: P.root, anim };
  };

  // ============================================================ ZÉ CANDEEIRO, O VIGIA APRENDIZ (rival-pipoca)
  // menino vigia: chapéu de couro grande demais, candeeiro no queixo, sorriso nervoso
  CH['rival-pipoca'] = function (T) {
    const P = person(T, { skin: '#A87048', skinD: '#8E5C38', hair: '#2A1A12', shirt: '#8A6A34', sleeve: '#7A5C2C', pants: '#3E4A3A', shoes: '#4A3020', cheek: '#C47A62', hipY: 0.28, bw: 0.175, bh: 0.2, bd: 0.145, hr: 0.28 });
    const K = kitOf(P), hr = P.hr, tc = P.tc;
    K.dome(P.head, P.hairM, hr * 1.05, 0.5, 0, hr * 0.02, -hr * 0.04, 1, 1, 1).rotation.x = -0.35;
    // chapéu de couro grande demais (cai na testa)
    P.hat = hat(K, P, { c: '#5E4026', c2: '#4E3420', band: '#2E1C10', brim: 1.95, crownH: 0.5, crownT: 0.6, crownB: 0.74, y: 0.5, rx: -0.05 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; K.ball(P.hat.g, K.mat('#C9A060', { roughness: 0.4, metalness: 0.4 }), 0.012, sin(a) * hr * 0.74, 0.04, cos(a) * hr * 0.74, 1, 1, 1, 'x'); }
    // gota de suor
    const drop = K.ball(P.head, K.mat('#BFE0FF', { roughness: 0.1, transparent: true, opacity: 0.7 }), 0.02, hr * 0.75, hr * 0.3, hr * 0.6, 0.8, 1.2, 0.6, 'x');
    // candeeiro de lata nas duas mãos, perto do queixo
    const L = lampada(K, P.arms[0].hand, { tipo: 'lata', x: -0.05, y: 0.02, z: 0.05, halo: 0.13 });
    const anim = animPerson(P, (st, t, p, S) => {
      piscar(L, t, 2);
      S.aR = [1.75, 0.45, -0.3]; S.aL = [1.75, 0.45, 0.3]; L.g.rotation.set(-1.75, 0, 0);
      if (st === 'idle') {
        // treme e espia de um lado pro outro
        S.lx = sin(t * 2.3) > 0 ? 0.8 : -0.8; S.hry = S.lx * 0.12; S.browY = 1; S.brow = -0.5;
        P.root.children[0].position.x += sin(t * 40) * 0.002;
        drop.position.y = hr * 0.3 - fr(t * 0.4) * 0.06;
      } else if (st === 'atk') {
        // toma coragem: estica o candeeiro pra frente
        S.aR = [1.75 - S.w * 0.4 + S.s * 0.1, 0.2, -0.3 + S.s * 0.3]; S.aL = [1.2 + S.s * 0.2, 0.3, 0.3]; L.g.rotation.x = -S.aR[0] + S.s * 0.3;
        S.brow = 0.6 * S.s - 0.3 * S.w; S.mouth = S.s; S.closed = S.w * 0.7; S.happy = false;
        L.halo.scale.setScalar(L.hb * (1 + 2 * S.s));
      } else if (st === 'sono') { S.aR = [0.6, 0.2, 0]; S.aL = [0.6, 0.2, 0]; L.g.rotation.x = -0.6; L.fm.emissiveIntensity = 0.6; }
      P.hat.g.rotation.x = -0.05 + (st === 'hit' ? -0.35 * S.f : 0) + (st === 'sono' ? 0.3 : 0);
    }, 0.5);
    return { obj: P.root, anim };
  };

  // ============================================================ SEVERINO GIBÃO (rival-tonico)
  // vaqueiro jovem e valente: gibão de couro, chapéu meia-lua com barbicacho, brasa no olhar (personagem fictício)
  CH['rival-tonico'] = function (T) {
    const P = person(T, { skin: '#9A6440', skinD: '#7E4E30', hair: '#1E140E', shirt: '#8E6C3C', sleeve: '#7E5E32', pants: '#4A3A2A', shoes: '#3A2414', cheek: false, pupil: '#FF8A2A', pupilE: '#FF5A10', hipY: 0.3, bw: 0.2, bh: 0.22, bd: 0.16, browR: 0.016 });
    const K = kitOf(P), hr = P.hr, tc = P.tc;
    const lea = K.mat('#5E3A20', { roughness: 0.6 }), leaD = K.mat('#3E2614', { roughness: 0.65 }), cream = K.mat('#D8B888', { roughness: 0.7 }), cop = K.mat('#C08A40', { roughness: 0.35, metalness: 0.6 });
    // gibão: gola alta, frente com pespontos em losango e tachas
    K.ball(P.chest, leaD, 1, 0, tc + P.bh * 0.62, 0, P.bw * 0.78, P.bh * 0.3, P.bd * 0.95, 'm');
    for (let i = 0; i < 3; i++) { const d = K.box(P.chest, cream, 0.045, 0.045, 0.006, 0, tc + 0.07 - i * 0.07, P.bd * 0.98); d.rotation.z = PI / 4; }
    for (const sd of [1, -1]) for (let i = 0; i < 3; i++) K.ball(P.chest, cop, 0.009, sd * 0.06, tc + 0.07 - i * 0.07, P.bd * 0.96, 1, 1, 0.5, 'x');
    // perneiras de couro
    for (const Lg of P.legs) K.cap(Lg, lea, 0.072, Math.max(0.02, P.hipY - 0.16), 0, -P.hipY / 2 + 0.03, 0, 10);
    // cabelo
    K.dome(P.head, P.hairM, hr * 1.04, 0.5, 0, hr * 0.02, -hr * 0.05, 1, 1, 1).rotation.x = -0.4;
    // chapéu de couro meia-lua: copa + aba virada pra cima na frente, estrela de cobre, barbicacho
    const hg = K.grp(P.head, 0, hr * 0.6, -hr * 0.05); hg.rotation.x = -0.12;
    K.ball(hg, lea, hr * 0.68, 0, hr * 0.12, 0, 1, 0.75, 1, 'm');
    const half = new T.CylinderGeometry(hr * 1.25, hr * 1.25, 0.025, 24, 1, false, -PI / 2, PI);
    const front = new T.Mesh(half, lea); front.castShadow = true; front.rotation.set(-(PI / 2 - 0.3), 0, 0); front.position.set(0, hr * 0.05, hr * 0.32); front.scale.set(1, 1, 0.8); hg.add(front);
    const back = new T.Mesh(half, leaD); back.castShadow = true; back.rotation.set(PI / 2 - 0.7, PI, 0); back.position.set(0, hr * 0.05, -hr * 0.3); back.scale.set(0.95, 1, 0.6); hg.add(back);
    const star = K.shape(hg, cop, (() => { const a = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.024 : 0.055, an = PI / 2 + i * PI / 5; a.push(cos(an) * r, sin(an) * r); } return a; })(), 0.01, 0.003, 0, hr * 0.6, hr * 0.58);
    star.rotation.x = -0.3;
    const strap = K.torus(P.head, leaD, hr * 0.95, 0.009, 0, -hr * 0.05, hr * 0.1, PI, 4, 18); strap.rotation.set(-0.3, 0, PI);
    // laço de corda na mão
    const lasso = K.torus(P.arms[0].hand, K.mat('#C9A86A', { roughness: 0.8 }), 0.07, 0.008, 0, -0.04, 0.02, PI * 2, 4, 18);
    const anim = animPerson(P, (st, t, p, S) => {
      S.brow = 0.35; S.aL = [0.1, 0.35, 0]; S.happy = false;
      lasso.rotation.set(PI / 2, 0, 0); lasso.scale.setScalar(1);
      if (st === 'idle') { S.aR = [0.35, 0.2, 0]; S.mouth = 0; lasso.rotation.z = t * 0.6; S.cRy = 0.08 * sin(t * 0.7); }
      else if (st === 'atk') {
        // gira o laço por cima da cabeça e manda
        S.aR = [1.0 + 2.2 * S.w + 0.5 * S.s, 0.4, 0]; lasso.rotation.set(0, t * 25, 0); lasso.scale.setScalar(1 + 1.6 * (S.w + S.s));
        S.mouth = S.s; S.brow = 0.8; S.closed = 0; S.legs = [-0.25 * S.s, 0.2 * S.s];
      } else if (st === 'sono') S.aR = [0.2, 0.15, 0];
      hg.rotation.x = -0.12 + (st === 'hit' ? -0.3 * S.f : 0) + (st === 'sono' ? 0.35 : 0);
    }, 0.2);
    return { obj: P.root, anim };
  };

  // ============================================================ RAIMUNDA MATEIRA (rival-ameixa)
  // mateira (guia da mata, não é pajé): chapéu de palha largo, facão na bainha, bolsa trançada, capa de fibra; sem cocar, sem pintura
  CH['rival-ameixa'] = function (T) {
    const P = person(T, { skin: '#9A6646', skinD: '#7E5034', hair: '#1A120C', shirt: '#4E5A36', sleeve: '#46512F', pants: '#3A3328', shoes: '#3A2414', cheek: false, hipY: 0.3, bw: 0.215, bh: 0.23, bd: 0.165, browR: 0.015 });
    const K = kitOf(P), hr = P.hr, tc = P.tc;
    const fib = K.mat('#8A7A4A', { roughness: 0.9, side: T.DoubleSide }), fibD = K.mat('#6A5A34', { roughness: 0.9 }), lea = K.mat('#5A3820', { roughness: 0.6 });
    const weave = K.mat('#B89A58', { roughness: 0.9 }), weaveD = K.mat('#8A6E38', { roughness: 0.9 }), steel = K.mat('#A8AEB8', { roughness: 0.3, metalness: 0.8 });
    // capa de fibra (franjas)
    K.lathe(P.chest, fib, [[P.bw * 0.6, tc + P.bh * 0.92], [P.bw * 1.05, tc + P.bh * 0.6], [P.bw * 1.3, tc - P.bh * 0.2], [P.bw * 1.36, tc - P.bh * 0.55]], 20, 0, 0, -0.01).rotation.y = PI;
    for (let i = 0; i < 10; i++) { const a = PI * 0.25 + i / 9 * PI * 1.5; K.cone(P.chest, fibD, 0.025, 0.09, sin(a) * P.bw * 1.33, tc - P.bh * 0.68, cos(a) * P.bw * 1.33, 4).rotation.x = PI; }
    // cabelo preso em trança
    K.dome(P.head, P.hairM, hr * 1.06, 0.55, 0, hr * 0.02, -hr * 0.04, 1, 1, 1).rotation.x = -0.4;
    K.tube(P.head, P.hairM, [[0, -hr * 0.1, -hr * 0.85], [0, -hr * 0.6, -hr * 1.0], [0.02, -hr * 1.3, -hr * 0.9], [0.03, -hr * 1.8, -hr * 0.75]], 0.04, 0.02, 12, 6);
    // chapéu de palha largo
    P.hat = hat(K, P, { c: '#C9A45A', c2: '#B8904A', band: '#5A3820', brim: 2.0, crownH: 0.42, y: 0.62, lathe: true });
    // facão embainhado na cintura + cinto
    K.cyl(P.chest, lea, P.bw * 1.0, P.bw * 1.02, 0.035, 0, tc - P.bh * 0.62, 0, 18);
    const fac = K.grp(P.chest, P.bw * 0.9, tc - P.bh * 0.75, 0.04); fac.rotation.set(0.15, 0, 0.35);
    K.rbox(fac, lea, 0.04, 0.24, 0.02, 0.008, 0, -0.1, 0);
    K.cap(fac, K.mat('#3A2414', { roughness: 0.6 }), 0.014, 0.06, 0, 0.06, 0, 6);
    K.box(fac, steel, 0.05, 0.008, 0.02, 0, 0.025, 0);
    // bolsa trançada a tiracolo
    K.torus(P.chest, lea, P.bw * 1.03, 0.012, 0, tc + 0.03, 0, PI * 2, 4, 24).rotation.set(PI / 2, -0.75, 0);
    const bag = K.grp(P.chest, -P.bw * 1.0, tc - 0.14, 0.03);
    K.ball(bag, weave, 0.075, 0, 0, 0, 1, 0.9, 0.6, 'm');
    for (let i = 0; i < 3; i++) K.torus(bag, weaveD, 0.072 - i * 0.004, 0.006, 0, -0.03 + i * 0.03, 0, PI * 2, 4, 16).rotation.x = PI / 2;
    const anim = animPerson(P, (st, t, p, S) => {
      S.brow = 0.2; S.happy = false;
      if (st === 'idle') {
        // mão na aba do chapéu, espiando a trilha
        const k = 0.5 + 0.5 * sin(t * 0.6);
        S.aL = [1.9 + 0.2 * k, 0.6, 0.5]; S.aR = [0.15, 0.2, 0]; S.hry = 0.35 * sin(t * 0.45); S.lx = sin(t * 0.45);
        S.closed = Math.max(S.closed, 0.35);
      } else if (st === 'atk') {
        // aponta o caminho: "por aqui!"
        S.aR = [0.3 + S.w * 0.4 + S.s * 1.25, 0.15, -0.2]; S.aL = [0.2, 0.25, 0]; S.mouth = S.s; S.brow = 0.6 * S.s; S.closed = 0;
        S.cRy = -0.2 * S.s; S.legs = [-0.3 * S.s, 0.15 * S.s];
      } else { S.aL = [0.1, 0.2, 0]; S.aR = [0.1, 0.2, 0]; }
      P.hat.g.rotation.x = -0.15 + (st === 'hit' ? -0.3 * S.f : 0) + (st === 'sono' ? 0.4 : 0);
    }, 0.7);
    return { obj: P.root, anim };
  };

  // ============================================================ SEU JUCA TARRAFA, O PESCADOR (rival-lodoso)
  // pescador velho do igapó: tarrafa no ombro, botas de borracha, chapéu com lamparina, sorriso de olhos apertados
  CH['rival-lodoso'] = function (T) {
    const P = person(T, { skin: '#A06C48', skinD: '#865636', hair: '#D8D4CC', brow: '#E8E4DC', shirt: '#4A6A8A', sleeve: '#43617E', pants: '#5A5444', shoes: '#C8A020', cheek: '#B86A5A', hipY: 0.3, bw: 0.2, bh: 0.21, bd: 0.16 });
    const K = kitOf(P), hr = P.hr, tc = P.tc;
    const white = K.mat('#E8E4DC', { roughness: 0.85 }), boot = K.mat('#C8A020', { roughness: 0.35 }), net = K.mat('#D8CFB0', { roughness: 0.8, wireframe: true });
    const lead = K.mat('#6A6E78', { roughness: 0.4, metalness: 0.6 });
    // botas de borracha
    for (const Lg of P.legs) K.cyl(Lg, boot, 0.072, 0.075, P.hipY * 0.7, 0, -P.hipY * 0.62, 0.0, 12);
    // barba branca rala e cabelo das laterais
    K.dome(P.head, white, hr * 0.98, 0.42, 0, -hr * 0.08, hr * 0.06, 1, 1, 1).rotation.x = PI + 0.45;
    for (const sd of [1, -1]) K.ball(P.head, white, hr * 0.25, sd * hr * 0.88, hr * 0.05, -hr * 0.1, 0.7, 1, 1, 'l');
    // chapéu de pano com lamparina na frente
    P.hat = hat(K, P, { c: '#5A5A3E', c2: '#4E4E34', band: '#3A3A28', brim: 1.35, crownH: 0.42, y: 0.64 });
    const L = lampada(K, P.hat.g, { tipo: 'lata', x: 0, y: hr * 0.2, z: hr * 0.66, halo: 0.12, c: '#FFE08A', nivel: false });
    // tarrafa no ombro (rede em cone com chumbada)
    const tf = K.grp(P.chest, P.bw * 0.8, tc + P.bh * 0.8, -0.02); tf.rotation.set(0.1, 0, -0.5);
    const cone = new T.Mesh(new T.ConeGeometry(0.17, 0.42, 14, 4, true), net); cone.position.y = -0.18; cone.rotation.x = PI; cone.castShadow = true; tf.add(cone);
    K.torus(tf, lead, 0.17, 0.012, 0, -0.39, 0, PI * 2, 4, 20).rotation.x = PI / 2;
    mballs(K, tf, lead, [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i / 8 * PI * 2; return [0.016, sin(a) * 0.17, -0.4, cos(a) * 0.17]; }), 'x');
    // calça arregaçada
    for (const Lg of P.legs) K.torus(Lg, K.mat('#6A6450', { roughness: 0.8 }), 0.075, 0.018, 0, -P.hipY * 0.27, 0, PI * 2, 4, 14).rotation.x = PI / 2;
    const anim = animPerson(P, (st, t, p, S) => {
      piscar(L, t, 3);
      S.closed = Math.max(S.closed, 0.6); S.happy = false; S.cRx += 0.06;
      tf.rotation.set(0.1, 0, -0.5);
      if (st === 'idle') { S.aR = [1.3, 0.55, -0.6]; S.aL = [0.2, 0.2, 0]; S.mouth = 0; S.hrz = 0.08 * sin(t * 0.8); }
      else if (st === 'atk') {
        // gira e lança a tarrafa
        S.aR = [1.3 + S.w * 1.0 - S.s * 0.5, 0.55 + S.s * 0.6, -0.6]; S.cRy = -0.5 * S.w + 0.4 * S.s; S.mouth = S.s; S.closed = 0.3;
        tf.rotation.set(0.1 - S.s * 1.2, S.s * 2, -0.5 + S.s * 0.6); tf.scale.setScalar(1 + S.s * 0.6);
      } else { S.aR = [1.0, 0.5, -0.5]; S.aL = [0.1, 0.2, 0]; if (st === 'sono') L.fm.emissiveIntensity = 0.6; }
      if (st !== 'atk') tf.scale.setScalar(1);
    }, 0.9);
    return { obj: P.root, anim };
  };

  // ============================================================ SEU AGENOR, O BENZEDOR (rival-lanuda)
  // benzedor da tapera: camisa branca, raminho de arruda na mão, olhar bondoso e cansado, uma visagem enroscada nele. Sem símbolos religiosos.
  CH['rival-lanuda'] = function (T) {
    const P = person(T, { skin: '#8E5E40', skinD: '#764C32', hair: '#E4E0D8', brow: '#E8E4DC', shirt: '#E6E0D2', sleeve: '#E6E0D2', pants: '#3A3630', shoes: '#2A221C', cheek: false, hipY: 0.29, bw: 0.19, bh: 0.215, bd: 0.155 });
    const K = kitOf(P), hr = P.hr, tc = P.tc;
    const white = K.mat('#E4E0D8', { roughness: 0.85 }), leaf = K.mat('#4E7A3A', { roughness: 0.6 }), stem = K.mat('#5A6A2A', { roughness: 0.7 });
    const ghost = K.own('#D8E8FF', { roughness: 0.3, emissive: '#7AA0FF', emissiveIntensity: 0.6, transparent: true, opacity: 0.38, depthWrite: false });
    // careca no topo, cabelo branco dos lados e atrás, bigode
    for (const sd of [1, -1]) K.ball(P.head, white, hr * 0.32, sd * hr * 0.82, hr * 0.02, -hr * 0.2, 0.7, 1, 1.1, 'l');
    K.ball(P.head, white, hr * 0.5, 0, -hr * 0.02, -hr * 0.62, 1.4, 0.9, 0.7, 'l');
    K.ball(P.head, white, hr * 0.16, 0, -hr * 0.27, hr * 0.88, 1.6, 0.5, 0.6, 'l');
    // gola e botões da camisa, suspensórios de pano
    for (let i = 0; i < 3; i++) K.ball(P.chest, K.mat('#C8C0B0', { roughness: 0.5 }), 0.01, 0, tc + 0.08 - i * 0.07, P.bd * 0.98, 1, 1, 0.5, 'x');
    // raminho de arruda
    const sprig = K.grp(P.arms[0].hand, 0, 0.0, 0.03);
    K.cyl(sprig, stem, 0.006, 0.006, 0.2, 0, 0.08, 0, 4);
    for (let i = 0; i < 8; i++) { const y = 0.04 + i * 0.022, sd = i % 2 ? 1 : -1; K.ball(sprig, leaf, 0.02, sd * 0.018, y, 0, 1, 0.5, 0.5, 'l').rotation.z = sd * 0.6; }
    // visagem enroscada (fiapo espiral)
    const wisp = K.grp(P.rig, 0, 0, 0);
    const pts = []; for (let i = 0; i <= 14; i++) { const a = i / 14 * PI * 3.2, r = 0.3 - i * 0.008; pts.push([sin(a) * r, 0.15 + i * 0.06, cos(a) * r]); }
    K.tube(wisp, ghost, pts, 0.012, 0.05, 40, 8).castShadow = false;
    const wh = K.ball(wisp, ghost, 0.07, pts[14][0], pts[14][1] + 0.02, pts[14][2], 1, 1.1, 1, 'm'); wh.castShadow = false;
    for (const sd of [1, -1]) K.ball(wisp, K.mat('#1A2440', { roughness: 0.4 }), 0.012, pts[14][0] + sd * 0.025, pts[14][1] + 0.035, pts[14][2] + 0.055, 1, 1.3, 0.6, 'x');
    const anim = animPerson(P, (st, t, p, S) => {
      S.closed = Math.max(S.closed, 0.45); S.happy = false; S.cRx += 0.05; S.brow = -0.3;
      wisp.rotation.y = t * 0.5; wisp.position.y = 0.02 * sin(t * 1.3); wisp.scale.setScalar(1);
      if (st === 'idle') { S.aR = [0.9 + 0.1 * sin(t * 1.2), 0.2, 0]; S.aL = [0.1, 0.18, 0]; sprig.rotation.set(-0.9 + 0.25 * sin(t * 2.4), 0, 0.2 * sin(t * 2.4)); }
      else if (st === 'atk') {
        // ergue o raminho e a visagem se desenrola e vai
        S.aR = [0.9 + S.w * 0.6 + S.s * 1.2, 0.2, 0]; sprig.rotation.set(-S.aR[0] + 0.3 + sin(p * 30) * 0.3 * S.s, 0, 0);
        S.mouth = 0.4 * S.s; S.closed = 0.3; wisp.rotation.y = t * 0.5 + p * 8; wisp.scale.setScalar(1 + 0.6 * S.s); wisp.position.z = 0.3 * S.s;
      } else { S.aR = [0.5, 0.2, 0]; sprig.rotation.set(-0.5, 0, 0); }
      ghost.opacity = st === 'sono' ? 0.18 : 0.32 + 0.08 * sin(t * 2);
    }, 1.4);
    return { obj: P.root, anim };
  };

  // ============================================================ A CUCA, SENHORA DOS PESADELOS (rival-trovoada)
  // velha bruxa das cantigas (NÃO é jacaré): alta e curvada, xale de penas de coruja, cabelo prateado comprido,
  // cajado torto com uma lua dormindo, névoa de caldeirão aos pés
  CH['rival-trovoada'] = function (T) {
    const P = person(T, { skin: '#9AA08A', skinD: '#7E8470', hair: '#C8CCD8', brow: '#D8DCE6', shirt: '#2A2234', sleeve: '#2A2234', skirt: '#221A2C', skirtW: 1.5, pants: '#9AA08A', shoes: '#1A1420', cheek: false, pupil: '#F2D040', pupilE: '#E0A010', pr: 0.5, hipY: 0.36, bw: 0.2, bh: 0.26, bd: 0.17, hr: 0.27, nose: 0.2, mouthY: 0.45 });
    const K = kitOf(P), hr = P.hr, tc = P.tc;
    const silver = P.hairM, f1 = K.mat('#7A6650', { roughness: 0.8 }), f2 = K.mat('#9A8668', { roughness: 0.8 }), f3 = K.mat('#E2D6BA', { roughness: 0.8 });
    const wood = K.mat('#4A3626', { roughness: 0.8 }), moon = K.own('#F2E2A0', { roughness: 0.4, emissive: '#D8B850', emissiveIntensity: 0.8 });
    const fog = K.own('#B8A8D8', { roughness: 0.6, emissive: '#5A4A8A', emissiveIntensity: 0.4, transparent: true, opacity: 0.3, depthWrite: false });
    // nariz comprido e queixo pontudo
    K.cone(P.head, P.skin, hr * 0.12, hr * 0.42, 0, -hr * 0.12, hr * 1.08, 8).rotation.x = PI / 2 + 0.35;
    K.cone(P.head, P.skin, hr * 0.2, hr * 0.3, 0, -hr * 0.85, hr * 0.5, 8).rotation.x = PI - 0.5;
    // cabelo prateado comprido
    K.dome(P.head, silver, hr * 1.07, 0.5, 0, hr * 0.03, -hr * 0.06, 1, 1, 1).rotation.x = -0.62;
    for (const [x, z] of [[0.75, -0.3], [-0.75, -0.3], [0.4, -0.75], [-0.4, -0.75], [0, -0.9]]) K.tube(P.head, silver, [[x * hr, 0, z * hr], [x * hr * 1.15, -hr * 0.7, z * hr * 1.1], [x * hr * 1.2, -hr * 1.5, z * hr * 1.2 - 0.04], [x * hr * 1.1, -hr * 2.3, z * hr * 1.1 - 0.08]], 0.035, 0.012, 10, 6);
    // xale de penas de coruja (camadas)
    const FA = [[], [], []];
    for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
      const a = PI * 0.12 + i / 8 * PI * 1.76, r = P.bw * (0.98 + row * 0.1), y = tc + P.bh * (0.8 - row * 0.26);
      FA[(row + i) % 2].push([0.075, sin(a) * r, y, cos(a) * r * 0.95, 0.85, 1.25, 0.28, 0.35, a, 0]);
      if (row === 2 && i % 2) FA[2].push([0.02, sin(a) * r * 1.02, y - 0.03, cos(a) * r * 0.97, 1, 1, 0.4]);
    }
    mballs(K, P.chest, f1, FA[0]); mballs(K, P.chest, f2, FA[1]); mballs(K, P.chest, f3, FA[2], 'x');
    // cajado torto com lua dormindo
    const staff = K.grp(P.arms[0].hand, 0, 0, 0.02);
    K.tube(staff, wood, [[0, 0.2, 0], [0.02, 0.05, 0.01], [-0.02, -0.15, 0], [0.03, -0.35, -0.01], [0.0, -0.5, 0.02]], 0.022, 0.016, 16, 6);
    const mg = K.grp(staff, 0.0, -0.58, 0.02); mg.rotation.z = PI;
    K.torus(mg, moon, 0.06, 0.022, 0, 0, 0, PI * 1.25, 6, 16).rotation.z = -PI * 0.35;
    K.torus(mg, K.mat('#5A4A2A', { roughness: 0.6 }), 0.012, 0.003, 0.035, 0.0, 0.02, PI, 4, 8).rotation.z = PI;
    // névoa aos pés
    const fogs = [0, 1, 2, 3].map(i => { const m = K.ball(P.root, fog, 0.18, 0, 0.05, 0, 1.4, 0.35, 1.1, 'l'); m.castShadow = false; return m; });
    const anim = animPerson(P, (st, t, p, S) => {
      S.cRx += 0.32; S.hrx -= 0.25; S.brow = 0.6; S.happy = false;
      moon.emissiveIntensity = 0.7 + 0.2 * sin(t * 1.3);
      if (st === 'idle') { S.aR = [0.45, 0.45, 0]; staff.rotation.set(0.45 - PI + 0.1 + 0.05 * sin(t), 0, 0.5); S.aL = [0.9 + 0.3 * sin(t * 1.1), 0.3, 0.3]; S.mouth = 0.25 + 0.2 * sin(t * 0.7); }
      else if (st === 'atk') {
        // ergue o cajado: "vem buscar!"
        S.aR = [0.6 + S.w * 1.0 + S.s * 1.3, 0.35, 0]; staff.rotation.set(-S.aR[0] + 0.3, 0, 0); S.aL = [0.6 + 1.6 * S.s, 0.7, 0.3];
        S.mouth = S.s; S.closed = 0; S.cRx = 0.32 - 0.25 * S.s; moon.emissiveIntensity = 0.8 + 2.5 * S.s;
      } else { S.aR = [0.4, 0.3, 0]; staff.rotation.set(0.4 - PI + 0.1, 0, 0.4); }
      fogs.forEach((m, i) => { const a = t * 0.3 + i * PI / 2; m.position.set(sin(a) * 0.28, 0.05 + 0.02 * sin(t + i), cos(a) * 0.24); });
      fog.opacity = 0.22 + 0.06 * sin(t * 1.4);
    }, 0.6);
    return { obj: P.root, anim };
  };

  // ============================================================ ZECA CORDEL, O REPENTISTA (rival-zeca)
  // poeta magro e alegre: folhetos de cordel pendurados num cordão com pregadores, pandeiro nas costas
  CH['rival-zeca'] = function (T) {
    const P = person(T, { skin: '#B07A50', skinD: '#96643E', hair: '#2A1C14', shirt: '#B8862E', sleeve: '#A8782A', pants: '#33354A', shoes: '#3A2414', cheek: '#C47A62', hipY: 0.33, bw: 0.165, bh: 0.215, bd: 0.135 });
    const K = kitOf(P), hr = P.hr, tc = P.tc;
    const str = K.mat('#E8DCC0', { roughness: 0.8 }), pin = K.mat('#C9A060', { roughness: 0.6 }), wood = K.mat('#A8784A', { roughness: 0.6 }), skin2 = K.mat('#E8D8B8', { roughness: 0.7 }), cym = K.mat('#C8C8D0', { roughness: 0.3, metalness: 0.8 });
    K.dome(P.head, P.hairM, hr * 1.05, 0.5, 0, hr * 0.02, -hr * 0.04, 1, 1, 1).rotation.x = -0.4;
    P.hat = hat(K, P, { c: '#C9A45A', c2: '#B8904A', band: '#8A2A22', brim: 1.35, crownH: 0.4, y: 0.66, rz: -0.18 });
    // pandeiro nas costas
    const pd = K.grp(P.chest, 0, tc + 0.02, -P.bd * 1.25); pd.rotation.set(0.1, 0, 0.4);
    K.cyl(pd, wood, 0.12, 0.12, 0.035, 0, 0, 0, 20).rotation.x = PI / 2;
    K.cyl(pd, skin2, 0.115, 0.115, 0.038, 0, 0, 0, 20).rotation.x = PI / 2;
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; K.cyl(pd, cym, 0.018, 0.018, 0.006, sin(a) * 0.12, cos(a) * 0.12, 0, 8).rotation.x = PI / 2; }
    K.torus(P.chest, K.mat('#5A3A22', { roughness: 0.7 }), P.bw * 1.04, 0.01, 0, tc + 0.02, 0, PI * 2, 4, 22).rotation.set(PI / 2, 0.6, 0);
    // cordão de folhetos entre as mãos
    const line = K.grp(P.chest, 0, tc + 0.12, P.bd + 0.11);
    const ln = K.cyl(line, str, 0.004, 0.004, 0.42, 0, 0, 0, 4); ln.rotation.z = PI / 2;
    const books = [];
    ['#E8DCC0', '#D8C8F0', '#F0D0B8', '#C8E0D0'].forEach((c, i) => { const b = cordel(K, line, -0.15 + i * 0.1, -0.05, 0, c); K.box(b, pin, 0.008, 0.025, 0.012, 0, 0.045, 0.004); books.push(b); });
    const anim = animPerson(P, (st, t, p, S) => {
      S.aR = [1.1, 0.55, -0.4]; S.aL = [1.1, 0.55, 0.4];
      line.position.y = tc + 0.12; line.rotation.z = 0;
      books.forEach((b, i) => { b.rotation.set(0, 0, 0.1 * sin(t * 2.2 + i)); });
      if (st === 'idle') {
        // recita balançando o corpo
        S.cRz = 0.06 * sin(t * 2); S.hrz = 0.1 * sin(t * 2); S.mouth = 0.5 + 0.5 * sin(t * 6) > 0.7 ? 0.5 : 0; S.happy = true; S.closed = 1;
        line.rotation.z = 0.05 * sin(t * 2);
      } else if (st === 'atk') {
        // sacode o cordão e solta a rima
        S.aR = [1.1 + 0.8 * S.s, 0.55, -0.4]; S.aL = [1.1 + 0.8 * S.s, 0.55, 0.4]; line.position.y = tc + 0.12 + 0.15 * S.s;
        books.forEach((b, i) => { b.rotation.set(0.5 * sin(p * 40 + i) * S.s, 0, 0.4 * sin(p * 30 + i) * (S.w + S.s)); });
        S.mouth = S.s; S.happy = false; S.closed = 0; S.brow = 0.4 * S.s; S.jump = 0.04 * S.s;
      } else if (st === 'sono') { S.aR = [0.5, 0.3, -0.2]; S.aL = [0.5, 0.3, 0.2]; line.position.y = tc - 0.05; }
      P.hat.g.rotation.x = -0.15 + (st === 'hit' ? -0.3 * S.f : 0) + (st === 'sono' ? 0.35 : 0);
    }, 0.8);
    return { obj: P.root, anim };
  };

  // ============================================================ TIA JATAÍ, A MELEIRA (rival-cocada)
  // redonda e sorridente: véu de apicultora jogado pra trás, pote de mel, abelhinhas em halo
  CH['rival-cocada'] = function (T) {
    const P = person(T, { skin: '#A87048', skinD: '#8E5C38', hair: '#2A1A12', shirt: '#3E6E5E', skirt: '#2F5A4C', skirtW: 1.35, pants: '#A87048', shoes: '#3A2414', cheek: '#C8706A', hipY: 0.24, bw: 0.25, bh: 0.24, bd: 0.21 });
    const K = kitOf(P), hr = P.hr, tc = P.tc;
    const cream = K.mat('#EAD8B0', { roughness: 0.8 }), clay = K.mat('#A0582E', { roughness: 0.7 }), honey = K.own('#F5A623', { roughness: 0.15, emissive: '#E08A10', emissiveIntensity: 0.5 });
    const veil = K.mat('#F2EEE4', { roughness: 0.7, transparent: true, opacity: 0.55, depthWrite: false, side: T.DoubleSide });
    // avental
    K.ball(P.chest, cream, 1, 0, tc - 0.06, P.bd * 0.72, P.bw * 0.7, P.bh * 0.95, P.bd * 0.42, 'm');
    // cabelo em coque crespo
    K.dome(P.head, P.hairM, hr * 1.06, 0.55, 0, hr * 0.02, -hr * 0.04, 1, 1, 1).rotation.x = -0.4;
    mballs(K, P.head, P.hairM, [[0, 0.8, -0.5], [0.3, 0.75, -0.55], [-0.3, 0.75, -0.55], [0, 0.6, -0.8]].map(([x, y, z]) => [hr * 0.3, x * hr, y * hr, z * hr]));
    // chapéu de apicultora com o véu jogado pra trás
    P.hat = hat(K, P, { c: '#E8DCC0', c2: '#DCCFB0', band: '#C9A060', brim: 1.45, crownH: 0.45, y: 0.66, rx: -0.4 });
    const vm = new T.Mesh(new T.CylinderGeometry(hr * 1.4, hr * 1.5, hr * 1.3, 18, 1, true, PI * 0.6, PI * 0.8), veil);
    vm.position.set(0, -hr * 0.6, -hr * 0.1); P.hat.g.add(vm);
    // pote de mel nas mãos
    const pot = K.grp(P.arms[0].hand, -0.04, 0.02, 0.07);
    K.lathe(pot, clay, [[0.001, -0.06], [0.06, -0.055], [0.075, -0.01], [0.06, 0.04], [0.045, 0.055], [0.05, 0.065]], 16, 0, 0, 0);
    K.ball(pot, honey, 0.045, 0, 0.06, 0, 1, 0.3, 1, 'm');
    const drip = K.ball(pot, honey, 0.012, 0.048, 0.04, 0.02, 1, 2, 1, 'x');
    K.cyl(pot, K.mat('#8A6038', { roughness: 0.7 }), 0.006, 0.006, 0.16, 0.02, 0.1, 0, 4).rotation.z = -0.3;
    // abelhas em halo
    const beeY = K.mat('#F2B020', { roughness: 0.5 }), beeK = K.mat('#2A1C10', { roughness: 0.5 }), wingM = K.mat('#EAF4FF', { roughness: 0.2, transparent: true, opacity: 0.6, depthWrite: false });
    const halo = K.grp(P.head, 0, hr * 1.0, 0);
    const bees = [0, 1, 2, 3, 4].map(i => { const g = K.grp(halo, 0, 0, 0); K.ball(g, beeY, 0.02, 0, 0, 0, 1, 0.9, 1.3, 'l'); K.ball(g, beeK, 0.012, 0, 0, -0.018, 1, 1, 1, 'x'); const w = K.ball(g, wingM, 0.018, 0, 0.016, 0, 1.3, 0.25, 0.8, 'x'); w.castShadow = false; return g; });
    const anim = animPerson(P, (st, t, p, S) => {
      S.aR = [1.0, 0.45, -0.4]; S.aL = [1.0, 0.45, 0.4]; S.happy = true; S.closed = Math.max(S.closed, 0.0); S.mouth = 0;
      halo.rotation.y = t * 1.2; let rr = hr * 1.1;
      drip.position.y = 0.04 - fr(t * 0.5) * 0.05; honey.emissiveIntensity = 0.5;
      if (st === 'idle') { S.cRz = 0.05 * sin(t * 1.4); S.hrz = 0.08 * sin(t * 1.4); S.happy = sin(t * 0.7) > 0.3; S.closed = S.happy ? 1 : S.closed; }
      else if (st === 'atk') {
        // ergue o pote e manda as abelhas
        S.aR = [1.0 + 1.0 * S.s, 0.45, -0.4]; S.aL = [1.0 + 1.0 * S.s, 0.45, 0.4]; S.mouth = S.s; S.happy = false; S.closed = 0;
        rr = hr * (1.1 + 2.0 * S.s); halo.rotation.y = t * 1.2 + p * 12; honey.emissiveIntensity = 0.5 + 1.5 * S.s;
      } else if (st === 'sono') { rr = hr * 0.9; halo.rotation.y = t * 0.2; }
      bees.forEach((g, i) => { const a = i / 5 * PI * 2; g.position.set(sin(a) * rr, 0.03 * sin(t * 5 + i), cos(a) * rr); g.rotation.y = a + PI / 2; });
      P.hat.g.rotation.x = -0.4 + (st === 'hit' ? -0.2 * S.f : 0);
    }, 0.4);
    return { obj: P.root, anim };
  };

  // ============================================================ MESTRE TIÃO VIOLEIRO (rival-sanfona)
  // violeiro campeão das pelejas: barba branca, viola caipira, um gorro vermelho escondido no bolso (dizem que aprendeu com o Saci)
  CH['rival-sanfona'] = function (T) {
    const P = person(T, { skin: '#9A6A48', skinD: '#805436', hair: '#E8E4DC', brow: '#F0ECE4', shirt: '#E2DAC8', sleeve: '#E2DAC8', pants: '#3A3028', shoes: '#2A1C14', cheek: false, hipY: 0.3, bw: 0.205, bh: 0.22, bd: 0.165 });
    const K = kitOf(P), hr = P.hr, tc = P.tc;
    const white = K.mat('#ECE8E0', { roughness: 0.85 }), vest = K.mat('#4A2E22', { roughness: 0.75 }), red = K.mat('#C21E1A', { roughness: 0.55 });
    const wood = K.mat('#B8783A', { roughness: 0.45 }), woodD = K.mat('#5A3420', { roughness: 0.6 }), strM = K.mat('#E8E0C8', { roughness: 0.3, metalness: 0.6 });
    // colete escuro
    K.ball(P.chest, vest, 1, 0, tc, -0.01, P.bw * 1.04, P.bh * 0.98, P.bd * 1.02, 'm');
    K.ball(P.chest, P.shirtM, 1, 0, tc + 0.02, P.bd * 0.55, P.bw * 0.4, P.bh * 0.85, P.bd * 0.5, 'm');
    // gorro vermelho escapando do bolso
    K.rbox(P.chest, vest, 0.07, 0.05, 0.02, 0.008, P.bw * 0.5, tc + 0.02, P.bd * 0.95);
    const cp = K.cone(P.chest, red, 0.03, 0.09, P.bw * 0.5, tc + 0.07, P.bd * 0.95, 8); cp.rotation.z = -0.5;
    // barba branca grande, cabelo branco, chapéu de feltro
    K.ball(P.head, white, hr * 0.62, 0, -hr * 0.55, hr * 0.42, 1.25, 1.1, 0.8, 'm');
    K.ball(P.head, white, hr * 0.2, 0, -hr * 0.24, hr * 0.9, 1.7, 0.55, 0.6, 'l');
    K.dome(P.head, white, hr * 1.05, 0.5, 0, hr * 0.02, -hr * 0.05, 1, 1, 1).rotation.x = -0.4;
    P.hat = hat(K, P, { c: '#3A3028', c2: '#2E261E', band: '#8A2A22', brim: 1.4, crownH: 0.5, y: 0.62 });
    // viola caipira
    const vi = K.grp(P.chest, -0.02, tc - 0.04, P.bd + 0.07); vi.rotation.set(0, 0, 0.9);
    K.ball(vi, wood, 0.12, 0, -0.06, 0, 1, 0.95, 0.32, 'm');
    K.ball(vi, wood, 0.095, 0, 0.09, 0, 1, 0.9, 0.32, 'm');
    K.cyl(vi, woodD, 0.03, 0.03, 0.006, 0, 0.0, 0.04, 14).rotation.x = PI / 2;
    K.box(vi, woodD, 0.04, 0.32, 0.02, 0, 0.3, 0.012);
    K.rbox(vi, woodD, 0.06, 0.09, 0.022, 0.01, 0, 0.5, 0.008);
    for (let i = 0; i < 5; i++) K.box(vi, strM, 0.003, 0.52, 0.003, -0.012 + i * 0.006, 0.2, 0.04);
    const anim = animPerson(P, (st, t, p, S) => {
      S.closed = Math.max(S.closed, 0.3); S.happy = false;
      S.aR = [1.1, 0.3, 0.3]; S.aL = [1.25, 0.5, -0.8];
      if (st === 'idle') {
        // ponteia a viola
        S.aR = [1.1 + 0.08 * sin(t * 9), 0.3, 0.3]; S.hrz = 0.08 * sin(t * 1.2); S.cRz = 0.04 * sin(t * 1.2); S.closed = 0.6;
      } else if (st === 'atk') {
        // floreio campeão: rasqueado e braço pro alto
        S.aR = [1.1 + 0.4 * S.w + 1.6 * S.s, 0.3 + 0.8 * S.s, 0.3]; S.mouth = S.s; S.closed = S.s > 0.3 ? 1 : 0; S.happy = S.s > 0.3;
        S.hrx = -0.2 * S.s; S.jump = 0.03 * S.s;
      } else if (st === 'sono') S.aR = [1.0, 0.3, 0.3];
      P.hat.g.rotation.x = -0.15 + (st === 'hit' ? -0.3 * S.f : 0) + (st === 'sono' ? 0.35 : 0);
    }, 0.0);
    return { obj: P.root, anim };
  };
})();
