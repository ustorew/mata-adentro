// Duelo ao vivo: duas pessoas, o motor do jogo rodando aqui no servidor.
// Quem joga manda só a intenção ("jogar a carta X no terreno 2", "atacar"); o servidor aplica as regras
// e manda para cada lado os passos da partida (estado + eventos) já virados para a visão de cada um:
// cada jogador se vê embaixo (lado "p") e vê o outro em cima (lado "r").
const crypto = require('crypto');
const M = require('./motor');
const { usuarioDoToken } = require('./auth');
const { lerSave } = require('./saves');
const { transacao } = require('./db');

const TURNO_MS = 75e3;        // tempo de cada turno; acabou, o servidor ataca por você
const VOLTA_MS = 90e3;        // quem caiu tem esse tempo para voltar antes de perder
const GLORIA = { vitoria: 25, derrota: -15, empate: 5 };
const PREMIO = { vintens: 15, porDia: 5 };

const opp = P => (P === 'p' ? 'r' : 'p');
const copia = o => JSON.parse(JSON.stringify(o));
const TERRS = new Set(['milharal', 'pomar', 'brejo', 'pasto']);

/* ---------- deck vindo do jogo salvo ---------- */
function deckDoSave(s) {
  if (!s || !s.deck || !Array.isArray(s.deck.cartas) || !Array.isArray(s.deck.terrenos)) return { erro: 'Monte seu deck antes.' };
  const cartas = s.deck.cartas, cnt = {};
  if (cartas.length !== 20) return { erro: 'Seu deck precisa ter 20 cartas.' };
  for (const id of cartas) {
    const c = M.CARD[id];
    if (!c || c.ficha || !s.cards[id]) return { erro: 'Seu deck tem uma carta que você não tem.' };
    cnt[id] = (cnt[id] || 0) + 1;
    if (cnt[id] > (c.rar === 'lendaria' ? 1 : 2)) return { erro: 'Seu deck tem cópias demais de uma carta.' };
  }
  const terrenos = s.deck.terrenos.slice(0, 4);
  if (terrenos.length !== 4 || !terrenos.every(t => TERRS.has(t))) return { erro: 'Escolha os 4 terrenos do deck.' };
  const lvl = id => Math.min(5, Math.max(1, s.cards[id].lvl | 0));
  const arena = arenaDe(s.trofeusMax || 0);
  return { cartas: cartas.slice(), terrenos, lvl: Object.fromEntries(cartas.map(id => [id, lvl(id)])), arena };
}
function arenaDe(trof) { let a = 1; for (const A of M.ARENAS) if (trof >= A.trof) a = A.n; return a; }

/* ---------- a visão de cada lado ---------- */
function vista(B, lado) {
  const v = {
    round: B.round, turn: B.turn, over: B.over, result: B.result, porTempo: !!B.porTempo, desistiu: !!B.desistiu,
    arena: B.arena, rival: '__pvp', modo: 'pvp', tier: 'pvp', regra: null, rodadaColheita: null, tut: false,
    sides: copia(B.sides), log: B.log.slice(-80), stats: copia(B.stats), duplasLog: [],
    duplas: copia(B.duplas || { p: [], r: [] }), seq: copia(B.seq || {}), famNiv: copia(B.famNiv || {}), famVisto: copia(B.famVisto || {}),
  };
  // cartas escondidas: a ordem do próprio deck, e a mão e o deck do outro
  v.sides[lado].deck = v.sides[lado].deck.map(() => ({}));
  const o = v.sides[opp(lado)];
  o.deck = o.deck.map(() => ({}));
  o.hand = o.hand.map(h => ({ uid: h.uid }));
  if (lado === 'r') {
    for (const k of ['sides', 'duplas', 'seq', 'famNiv', 'famVisto']) if (v[k] && v[k].p !== undefined) v[k] = { p: v[k].r, r: v[k].p };
    v.turn = opp(v.turn);
    v.result = v.result === 'vitoria' ? 'derrota' : v.result === 'derrota' ? 'vitoria' : v.result;
  }
  return v;
}
function virarEv(evs, lado) {
  if (lado === 'p') return evs;
  return evs.map(e => {
    const c = Object.assign({}, e);
    if (c.P) c.P = opp(c.P);
    if (c.side) c.side = opp(c.side);
    return c;
  });
}

class Partida {
  constructor(id, a, b, sala) {
    this.id = id; this.sala = sala;
    // a joga embaixo no motor ("p") e começa; b é o lado "r"
    this.lados = { p: a, r: b };
    a.lado = 'p'; b.lado = 'r';
    const deck = j => M.shuffle(M.montarDeck(j.deck.cartas, id => j.deck.lvl[id]));
    this.B = M.novaBatalha({
      modo: 'pvp', rival: '__pvp', arena: a.deck.arena, tier: 'medio',
      p: { hp: 20, maxHp: 20, deck: deck(a), lanes: a.deck.terrenos.slice(), nome: a.apelido },
      r: { hp: 20, maxHp: 20, deck: deck(b), lanes: b.deck.terrenos.slice(), nome: b.apelido },
    });
    M.maoInicial(this.B.sides.p, 4); M.maoInicial(this.B.sides.r, 4);
    M.iniciarTurno(this.B, 'p'); this.B.ev = [];
    this.B.log.push('Duelo: ' + a.apelido + ' contra ' + b.apelido + '. ' + a.apelido + ' começa.');
    this.prazo = Date.now() + TURNO_MS;
    this.timer = null; this.fimFeito = false;
  }
  jogador(uid) { return this.lados.p.uid === uid ? this.lados.p : this.lados.r.uid === uid ? this.lados.r : null; }
}

function criarPvp({ pool, wss, log = () => {} }) {
  const conexoes = new Map();   // uid -> ws
  const partidas = new Map();   // id -> Partida
  const naPartida = new Map();  // uid -> Partida
  let fila = [];                // [{uid, apelido, gloria, deck}]
  const salas = new Map();      // codigo -> {uid, ...}
  let seq = 1;

  const enviar = (uid, msg) => { const ws = conexoes.get(uid); if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); };

  /* ---------- passos: o que mudou, para os dois lados ---------- */
  function mandarPassos(P, passos) {
    for (const lado of ['p', 'r']) {
      const j = P.lados[lado];
      enviar(j.uid, {
        t: 'passos', id: P.id, prazo: Math.max(0, P.prazo - Date.now()),
        passos: passos.map(x => Object.assign({}, x.extra, {
          k: x.k, P: x.P ? (lado === 'p' ? x.P : opp(x.P)) : undefined,
          estado: vista(x.B, lado), ev: virarEv(x.ev, lado),
        })),
      });
    }
  }
  // tira uma foto do estado (com os eventos desde a última)
  const foto = (P, k, lado, extra) => { const B = P.B; const ev = B.ev; B.ev = []; return { k, P: lado, B: copia(Object.assign({}, B, { ev: [] })), ev, extra }; };
  function varrerTudo(P, passos) {
    for (let g = 0; g < 8; g++) {
      const temMorto = ['p', 'r'].some(Q => P.B.sides[Q].lanes.some(L => L.c && L.c.dead));
      if (!temMorto) break;
      M.varrer(P.B);
      passos.push(foto(P, 'varrer'));
    }
  }

  function jogar(P, lado, uid, lane) {
    const B = P.B;
    if (B.over || B.turn !== lado) return 'Não é a sua vez.';
    const inst = B.sides[lado].hand.find(h => h.uid === uid);
    if (!inst) return 'Essa carta não está na sua mão.';
    const c = M.CARD[inst.id];
    const ln = c.tipo === 'feitico' && !c.alvo ? -1 : lane;
    if (!(ln === -1 || (Number.isInteger(ln) && ln >= 0 && ln <= 3))) return 'Terreno inválido.';
    if (!M.jogarCarta(B, lado, uid, ln)) return M.motivoBloqueio(B, lado, inst) || 'Essa jogada não vale.';
    const passos = [foto(P, 'play', lado, { id: inst.id, lvl: inst.lvl, uid: inst.uid, lane: ln })];
    varrerTudo(P, passos);
    if (M.fimDeJogo(B)) passos.push(foto(P, 'fim'));
    mandarPassos(P, passos);
    if (B.over) return terminar(P, 'normal');
    return null;
  }

  function atacar(P, lado, auto) {
    const B = P.B;
    if (B.over || B.turn !== lado) return 'Não é a sua vez.';
    const passos = [];
    if (auto) passos.push(foto(P, 'tempo', lado));
    // mesmo roteiro do combateAnim do navegador: terreno por terreno, da esquerda para a direita
    combate: for (let i = 0; i < 4; i++) {
      const c = B.sides[lado].lanes[i].c;
      if (!c || !M.podeAtacar(c)) continue;
      const vezes = c.kw.ataqueDuplo ? 2 : 1;
      for (let k = 0; k < vezes; k++) {
        if (B.sides[lado].lanes[i].c !== c || c.dead || !M.podeAtacar(c)) break;
        const ar = M.alvoReal(B, lado, i, c);
        if (c.lua && ar.tipo === 'heroi') { M.ataque(B, lado, i); passos.push(foto(P, 'lua', lado, { lane: i })); break; }
        const extra = { lane: i, uid: c.uid, id: c.id, alvo: ar.tipo === 'heroi' ? -1 : ar.lane, guarda: !!ar.guarda, forte: M.effAtk(c) >= 3 };
        const ok = M.ataque(B, lado, i);
        passos.push(foto(P, 'atk', lado, extra));
        varrerTudo(P, passos);
        if (M.fimDeJogo(B)) break combate;
        if (!ok) break;
      }
    }
    if (!B.over) {
      M.fimTurno(B, lado);
      if (lado === 'r' && B.round >= 10) M.fimPorRodadas(B);
    }
    if (!B.over) {
      const prox = opp(lado);
      M.iniciarTurno(B, prox);
      P.prazo = Date.now() + TURNO_MS;
      passos.push(foto(P, 'turno', prox));
      varrerTudo(P, passos);
      M.fimDeJogo(B);
    }
    if (B.over) passos.push(foto(P, 'fim'));
    mandarPassos(P, passos);
    if (B.over) return terminar(P, B.porTempo ? 'rodadas' : 'normal');
    armarRelogio(P);
    return null;
  }

  function armarRelogio(P) {
    clearTimeout(P.timer);
    if (P.B.over) return;
    P.timer = setTimeout(() => {
      if (P.B.over) return;
      atacar(P, P.B.turn, true);
    }, Math.max(0, P.prazo - Date.now()) + 300);
  }

  async function terminar(P, motivo) {
    if (P.fimFeito) return null;
    P.fimFeito = true;
    clearTimeout(P.timer);
    for (const lado of ['p', 'r']) clearTimeout(P.lados[lado].saiuTimer);
    const B = P.B;
    // resultado do ponto de vista de "p"
    const resP = B.result;
    const res = { p: resP, r: resP === 'vitoria' ? 'derrota' : resP === 'derrota' ? 'vitoria' : 'empate' };
    let saida = {};
    try {
      saida = await transacao(pool, async cx => {
        const o = {};
        for (const lado of ['p', 'r']) {
          const j = P.lados[lado], r = res[lado];
          const u = (await cx.query('SELECT gloria FROM usuarios WHERE id = $1 FOR UPDATE', [j.uid])).rows[0];
          const depois = Math.max(0, u.gloria + (P.sala ? 0 : GLORIA[r]));
          const col = r === 'vitoria' ? 'pvp_vitorias' : r === 'derrota' ? 'pvp_derrotas' : 'pvp_empates';
          await cx.query(`UPDATE usuarios SET gloria = $2, ${col} = ${col} + 1 WHERE id = $1`, [j.uid, depois]);
          let premio = 0;
          if (r === 'vitoria' && !B.desistiuAntes) {
            const d = (await cx.query(`INSERT INTO premios_dia (usuario_id, dia, pagos) VALUES ($1, (now() AT TIME ZONE 'America/Sao_Paulo')::date, 1)
              ON CONFLICT (usuario_id, dia) DO UPDATE SET pagos = premios_dia.pagos + 1 RETURNING pagos`, [j.uid])).rows[0];
            if (d.pagos <= PREMIO.porDia) {
              premio = PREMIO.vintens;
              await cx.query("INSERT INTO caixa (usuario_id, tipo, dados) VALUES ($1, 'premio', $2)", [j.uid, { vintens: premio, partida: P.id }]);
            }
          }
          o[lado] = { resultado: r, gloria: { antes: u.gloria, depois }, premio };
        }
        await cx.query('INSERT INTO partidas (a_id, b_id, resultado, motivo, rodadas, fim_em) VALUES ($1, $2, $3, $4, $5, now())',
          [P.lados.p.uid, P.lados.r.uid, resP, motivo, B.round]);
        return o;
      });
    } catch (e) { log('erro ao fechar partida', e); }
    for (const lado of ['p', 'r']) {
      const j = P.lados[lado];
      enviar(j.uid, Object.assign({ t: 'fim', id: P.id, motivo, amistoso: !!P.sala, rodadas: B.round }, saida[lado] || { resultado: res[lado] }));
      if (naPartida.get(j.uid) === P) naPartida.delete(j.uid);
    }
    partidas.delete(P.id);
    return null;
  }

  function desistir(P, lado, motivo) {
    const B = P.B;
    if (B.over) return;
    B.over = true; B.desistiu = true; B.result = lado === 'p' ? 'derrota' : 'vitoria';
    // quem desiste logo no começo não dá prêmio para o outro (evita combinar derrotas para farmar Vinténs)
    if (B.round <= 2) B.desistiuAntes = true;
    mandarPassos(P, [foto(P, 'fim', lado, { desistiu: true })]);
    terminar(P, motivo || 'desistencia');
  }

  /* ---------- formar partidas ---------- */
  function comecar(a, b, sala) {
    fila = fila.filter(x => x.uid !== a.uid && x.uid !== b.uid);
    const id = seq++;
    const P = new Partida(id, a, b, sala);
    partidas.set(id, P); naPartida.set(a.uid, P); naPartida.set(b.uid, P);
    for (const lado of ['p', 'r']) mandarInicio(P, lado);
    armarRelogio(P);
  }
  function mandarInicio(P, lado) {
    const j = P.lados[lado], o = P.lados[opp(lado)];
    enviar(j.uid, { t: 'inicio', id: P.id, amistoso: !!P.sala, voce: j.apelido, rival: { apelido: o.apelido, gloria: o.gloria },
      estado: vista(P.B, lado), prazo: Math.max(0, P.prazo - Date.now()), primeiro: lado === 'p' });
  }

  async function entrada(u) {
    const sv = await lerSave(pool, u.id);
    const deck = deckDoSave(sv.dados);
    if (deck.erro) return { erro: deck.erro };
    return { uid: u.id, apelido: u.apelido, gloria: u.gloria, deck, desde: Date.now() };
  }

  async function aoMensagem(ws, msg) {
    if (msg.t === 'auth') {
      const u = await usuarioDoToken(pool, msg.token);
      if (!u) return ws.send(JSON.stringify({ t: 'erro', msg: 'Entre na sua conta de novo.', sair: true }));
      const velho = conexoes.get(u.id);
      if (velho && velho !== ws) { try { velho.send(JSON.stringify({ t: 'erro', msg: 'Você abriu o jogo em outra tela.', sair: true })); velho.close(); } catch (_) {} }
      ws.uid = u.id; conexoes.set(u.id, ws);
      ws.send(JSON.stringify({ t: 'ola', apelido: u.apelido, gloria: u.gloria }));
      // voltou para uma partida que estava no meio
      const P = naPartida.get(u.id);
      if (P && !P.B.over) {
        const j = P.jogador(u.id);
        clearTimeout(j.saiuTimer); j.saiuTimer = null;
        mandarInicio(P, j.lado);
        enviar(P.lados[opp(j.lado)].uid, { t: 'rival_voltou' });
      }
      return;
    }
    const uid = ws.uid;
    if (!uid) return;
    const P = naPartida.get(uid);
    switch (msg.t) {
      case 'fila': {
        if (P) return mandarInicio(P, P.jogador(uid).lado);
        const u = (await pool.query('SELECT * FROM usuarios WHERE id = $1', [uid])).rows[0];
        const e = await entrada(u);
        if (e.erro) return enviar(uid, { t: 'erro', msg: e.erro });
        fila = fila.filter(x => x.uid !== uid);
        const par = fila.shift();
        if (par && conexoes.get(par.uid)) return comecar(par, e, null);
        fila.push(e);
        return enviar(uid, { t: 'fila', estado: 'esperando' });
      }
      case 'sala_criar': {
        if (P) return;
        const u = (await pool.query('SELECT * FROM usuarios WHERE id = $1', [uid])).rows[0];
        const e = await entrada(u);
        if (e.erro) return enviar(uid, { t: 'erro', msg: e.erro });
        for (const [k, v] of salas) if (v.uid === uid) salas.delete(k);
        let codigo;
        do codigo = String(crypto.randomInt(1000, 10000)); while (salas.has(codigo));
        salas.set(codigo, e);
        return enviar(uid, { t: 'fila', estado: 'sala', codigo });
      }
      case 'sala_entrar': {
        if (P) return;
        const codigo = String(msg.codigo || '').trim();
        const dono = salas.get(codigo);
        if (!dono || !conexoes.get(dono.uid)) return enviar(uid, { t: 'erro', msg: 'Não achei essa sala. Confira o número.' });
        if (dono.uid === uid) return enviar(uid, { t: 'erro', msg: 'Essa sala é sua: passe o número para quem vai jogar com você.' });
        const u = (await pool.query('SELECT * FROM usuarios WHERE id = $1', [uid])).rows[0];
        const e = await entrada(u);
        if (e.erro) return enviar(uid, { t: 'erro', msg: e.erro });
        salas.delete(codigo);
        return comecar(dono, e, codigo);
      }
      case 'sair_fila':
        fila = fila.filter(x => x.uid !== uid);
        for (const [k, v] of salas) if (v.uid === uid) salas.delete(k);
        return enviar(uid, { t: 'fila', estado: 'fora' });
      case 'jogar': {
        if (!P) return enviar(uid, { t: 'erro', msg: 'Você não está em uma partida.' });
        const lado = P.jogador(uid).lado;
        const e = jogar(P, lado, Number(msg.uid), Number(msg.lane));
        if (e) enviar(uid, { t: 'recusado', msg: e, estado: vista(P.B, lado) });
        return;
      }
      case 'atacar': {
        if (!P) return;
        const lado = P.jogador(uid).lado;
        const e = atacar(P, lado, false);
        if (e) enviar(uid, { t: 'recusado', msg: e, estado: vista(P.B, lado) });
        return;
      }
      case 'desistir':
        if (P) desistir(P, P.jogador(uid).lado);
        return;
      case 'emote': {
        if (!P || typeof msg.id !== 'string' || msg.id.length > 40) return;
        const agora = Date.now(), j = P.jogador(uid);
        if (j.ultEmote && agora - j.ultEmote < 2500) return;
        j.ultEmote = agora;
        return enviar(P.lados[opp(j.lado)].uid, { t: 'emote', id: msg.id });
      }
    }
  }

  function aoFechar(ws) {
    const uid = ws.uid;
    if (!uid || conexoes.get(uid) !== ws) return;
    conexoes.delete(uid);
    fila = fila.filter(x => x.uid !== uid);
    for (const [k, v] of salas) if (v.uid === uid) salas.delete(k);
    const P = naPartida.get(uid);
    if (P && !P.B.over) {
      const j = P.jogador(uid);
      enviar(P.lados[opp(j.lado)].uid, { t: 'rival_saiu', volta: VOLTA_MS });
      j.saiuTimer = setTimeout(() => { if (!conexoes.get(uid) && !P.B.over) desistir(P, j.lado, 'abandono'); }, VOLTA_MS);
    }
  }

  wss.on('connection', ws => {
    ws.vivo = true;
    ws.on('pong', () => { ws.vivo = true; });
    ws.on('message', async raw => {
      let msg;
      try { msg = JSON.parse(String(raw)); } catch (_) { return; }
      if (!msg || typeof msg.t !== 'string') return;
      try { await aoMensagem(ws, msg); } catch (e) { log('erro no duelo', e); try { ws.send(JSON.stringify({ t: 'erro', msg: 'Algo deu errado no servidor.' })); } catch (_) {} }
    });
    ws.on('close', () => aoFechar(ws));
  });
  // conexões mortas (celular que dormiu) caem em até 30 s
  const ping = setInterval(() => { for (const ws of wss.clients) { if (!ws.vivo) { ws.terminate(); continue; } ws.vivo = false; try { ws.ping(); } catch (_) {} } }, 30e3);

  return {
    estado: () => ({ conectados: conexoes.size, fila: fila.length, partidas: partidas.size }),
    parar: () => { clearInterval(ping); for (const P of partidas.values()) { clearTimeout(P.timer); for (const l of ['p', 'r']) clearTimeout(P.lados[l].saiuTimer); } },
    _interno: { partidas, naPartida, vista },
  };
}

module.exports = { criarPvp, deckDoSave, vista, TURNO_MS, GLORIA, PREMIO };
