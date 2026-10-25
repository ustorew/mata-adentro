// Testes do servidor: contas, jogo salvo, Feira e um duelo ao vivo inteiro entre dois "jogadores-robô".
// Precisa de um PostgreSQL de teste: TEST_DATABASE_URL (padrão: postgres://mata:mata@localhost:5432/mata_teste).
const test = require('node:test');
const assert = require('node:assert');
const WebSocket = require('ws');
const { iniciar } = require('../server/index');
const { criarPool } = require('../server/db');
const M = require('../server/motor');

const URL_BD = process.env.TEST_DATABASE_URL || 'postgres://mata:mata@localhost:5432/mata_teste';
let srv, base;

async function api(metodo, rota, corpo, token) {
  const r = await fetch(base + '/api' + rota, {
    method: metodo, headers: Object.assign({ 'content-type': 'application/json' }, token ? { authorization: 'Bearer ' + token } : {}),
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  return { status: r.status, corpo: await r.json() };
}
function saveNovo() {
  const s = M.freshState();
  s.tutorialFeito = true; s.guia = 9;
  return JSON.parse(JSON.stringify(s));
}

test.before(async () => {
  const p = criarPool(URL_BD);
  await p.query('DROP TABLE IF EXISTS premios_dia, partidas, feira, caixa, saves, sessoes, usuarios CASCADE');
  await p.end();
  srv = await iniciar({ porta: 0, databaseUrl: URL_BD });
  base = 'http://localhost:' + srv.porta;
});
test.after(async () => { await srv.parar(); });

let ana, bia;
test('criar conta, entrar e regras de apelido e e-mail', async () => {
  let r = await api('POST', '/conta/criar', { email: 'Ana@Exemplo.com', senha: 'segredo1', apelido: 'Ana Saci' });
  assert.equal(r.status, 200, JSON.stringify(r.corpo));
  ana = r.corpo.token;
  r = await api('POST', '/conta/criar', { email: 'ana@exemplo.com', senha: 'segredo1', apelido: 'Outra' });
  assert.equal(r.status, 409);
  r = await api('POST', '/conta/criar', { email: 'x@exemplo.com', senha: 'segredo1', apelido: 'ana saci' });
  assert.equal(r.status, 409, 'apelido igual com maiúsculas diferentes');
  r = await api('POST', '/conta/criar', { email: 'y@exemplo.com', senha: '123', apelido: 'Curta' });
  assert.equal(r.status, 400);
  r = await api('POST', '/conta/entrar', { email: 'ana@exemplo.com', senha: 'errada' });
  assert.equal(r.status, 401);
  r = await api('POST', '/conta/entrar', { email: 'ANA@exemplo.com', senha: 'segredo1' });
  assert.equal(r.status, 200);
  assert.equal(r.corpo.usuario.apelido, 'Ana Saci');
  r = await api('GET', '/conta/eu', null, r.corpo.token);
  assert.equal(r.corpo.usuario.email, 'ana@exemplo.com');
  r = await api('GET', '/conta/eu', null, 'token-falso');
  assert.equal(r.status, 401);
  r = await api('POST', '/conta/criar', { email: 'bia@exemplo.com', senha: 'segredo2', apelido: 'Bia Iara' });
  bia = r.corpo.token;
});

test('jogo salvo na nuvem com revisão', async () => {
  let r = await api('GET', '/save', null, ana);
  assert.deepEqual(r.corpo, { dados: null, rev: 0 });
  const s = saveNovo();
  r = await api('PUT', '/save', { dados: s, rev: 0 }, ana);
  assert.equal(r.corpo.rev, 1);
  s.grao = 999;
  r = await api('PUT', '/save', { dados: s, rev: 1 }, ana);
  assert.equal(r.corpo.rev, 2);
  r = await api('PUT', '/save', { dados: s, rev: 1 }, ana);
  assert.equal(r.status, 409, 'revisão velha é recusada');
  assert.equal(r.corpo.atual.rev, 2);
  r = await api('PUT', '/save', { dados: { v: 1 }, rev: 2 }, ana);
  assert.equal(r.status, 400, 'save com defeito é recusado');
  r = await api('GET', '/save', null, ana);
  assert.equal(r.corpo.dados.grao, 999);
  r = await api('PUT', '/save', { dados: saveNovo(), rev: 0 }, bia);
  assert.equal(r.corpo.rev, 1);
});

test('Feira: anunciar, comprar, taxa queimada e caixa de entrada', async () => {
  // Ana tem uma cópia repetida para vender
  let sv = (await api('GET', '/save', null, ana)).corpo;
  const id = Object.keys(sv.dados.cards)[0];
  sv.dados.cards[id].copias = 2;
  let r = await api('PUT', '/save', { dados: sv.dados, rev: sv.rev }, ana);
  sv.rev = r.corpo.rev;
  const rar = M.CARD[id].rar, preco = M.MERC[rar].base;
  r = await api('POST', '/feira/anunciar', { carta: id, preco: 1, save: sv }, ana);
  assert.equal(r.status, 400, 'preço fora da faixa');
  r = await api('POST', '/feira/anunciar', { carta: id, preco, save: sv }, ana);
  assert.equal(r.status, 200, JSON.stringify(r.corpo));
  assert.equal(r.corpo.dados.cards[id].copias, 1);
  sv = { dados: r.corpo.dados, rev: r.corpo.rev };
  const anuncio = r.corpo.anuncio.id;
  r = await api('POST', '/feira/comprar', { id: anuncio, save: sv }, ana);
  assert.equal(r.status, 400, 'não compra a própria carta');

  let svB = (await api('GET', '/save', null, bia)).corpo;
  const graoB = svB.dados.grao, copiasB = svB.dados.cards[id] ? svB.dados.cards[id].copias : -1;
  r = await api('GET', '/feira', null, bia);
  assert.equal(r.corpo.anuncios.length, 1);
  assert.equal(r.corpo.anuncios[0].apelido, 'Ana Saci');
  r = await api('POST', '/feira/comprar', { id: anuncio, save: { dados: svB.dados, rev: svB.rev + 5 } }, bia);
  assert.equal(r.status, 409, 'revisão errada não compra');
  r = await api('POST', '/feira/comprar', { id: anuncio, save: svB }, bia);
  assert.equal(r.status, 200, JSON.stringify(r.corpo));
  assert.equal(r.corpo.dados.grao, graoB - preco);
  assert.equal(r.corpo.dados.cards[id].copias, copiasB + 1);
  assert.equal(r.corpo.dados.eco.ralos.feira, preco);
  r = await api('POST', '/feira/comprar', { id: anuncio, save: { dados: r.corpo.dados, rev: r.corpo.rev } }, bia);
  assert.equal(r.status, 410, 'não compra duas vezes');

  r = await api('GET', '/caixa', null, ana);
  assert.equal(r.corpo.pendentes, 1);
  const graoA = sv.dados.grao;
  r = await api('POST', '/caixa/pegar', { save: sv }, ana);
  assert.equal(r.status, 200, JSON.stringify(r.corpo));
  const taxa = Math.max(1, Math.round(preco * 0.1));
  assert.equal(r.corpo.dados.grao, graoA + preco - taxa);
  assert.equal(r.corpo.dados.eco.criado.feira, preco - taxa);
  assert.equal(r.corpo.itens[0].comprador, 'Bia Iara');
  sv = { dados: r.corpo.dados, rev: r.corpo.rev };
  r = await api('GET', '/caixa', null, ana);
  assert.equal(r.corpo.pendentes, 0);

  // anunciar e cancelar devolve a carta
  r = await api('POST', '/feira/anunciar', { carta: id, preco, save: sv }, ana);
  assert.equal(r.corpo.dados.cards[id].copias, 0);
  sv = { dados: r.corpo.dados, rev: r.corpo.rev };
  r = await api('POST', '/feira/anunciar', { carta: id, preco, save: sv }, ana);
  assert.equal(r.status, 400, 'sem cópia repetida não anuncia');
  r = await api('POST', '/feira/cancelar', { id: r.corpo.anuncio ? r.corpo.anuncio.id : 0, save: sv }, ana);
  r = await api('GET', '/feira/minhas', null, ana);
  const aberto = r.corpo.anuncios.find(a => a.estado === 'aberto');
  r = await api('POST', '/feira/cancelar', { id: aberto.id, save: sv }, ana);
  assert.equal(r.status, 200, JSON.stringify(r.corpo));
  assert.equal(r.corpo.dados.cards[id].copias, 1);

  // anúncio vencido volta pela caixa
  sv = { dados: r.corpo.dados, rev: r.corpo.rev };
  r = await api('POST', '/feira/anunciar', { carta: id, preco, save: sv }, ana);
  await srv.pool.query("UPDATE feira SET expira_em = now() - interval '1 minute' WHERE id = $1", [r.corpo.anuncio.id]);
  const F = require('../server/feira');
  assert.equal(await F.expirar(srv.pool), 1);
  r = await api('POST', '/caixa/pegar', { save: { dados: r.corpo.dados, rev: r.corpo.rev } }, ana);
  assert.equal(r.corpo.dados.cards[id].copias, 1);
  assert.equal(r.corpo.itens[0].tipo, 'devolucao');
});

/* ---------- duelo ao vivo ---------- */
function cliente(token) {
  const ws = new WebSocket(base.replace('http', 'ws') + '/ws');
  const c = { ws, msgs: [], esperas: [] };
  ws.on('message', raw => {
    const m = JSON.parse(String(raw));
    c.msgs.push(m);
    c.esperas = c.esperas.filter(w => { if (w.f(m)) { w.r(m); return false; } return true; });
  });
  c.manda = m => ws.send(JSON.stringify(m));
  c.espera = (f, ms = 8000) => new Promise((res, rej) => {
    const ja = c.msgs.find(f); if (ja) { c.msgs.splice(c.msgs.indexOf(ja), 1); return res(ja); }
    const t = setTimeout(() => rej(new Error('demorou: ' + f)), ms);
    c.esperas.push({ f, r: m => { clearTimeout(t); c.msgs.splice(c.msgs.indexOf(m), 1); res(m); } });
  });
  c.pronto = new Promise(r => ws.on('open', () => { c.manda({ t: 'auth', token }); r(); }));
  return c;
}

test('duelo ao vivo: fila, jogadas, visão espelhada, fim e glória', async () => {
  const A = cliente(ana), Bc = cliente(bia);
  await A.pronto; await Bc.pronto;
  await A.espera(m => m.t === 'ola'); await Bc.espera(m => m.t === 'ola');
  A.manda({ t: 'fila' });
  await A.espera(m => m.t === 'fila' && m.estado === 'esperando');
  Bc.manda({ t: 'fila' });
  const iA = await A.espera(m => m.t === 'inicio'), iB = await Bc.espera(m => m.t === 'inicio');
  assert.equal(iA.primeiro, true); assert.equal(iB.primeiro, false);
  assert.equal(iA.rival.apelido, 'Bia Iara');
  assert.equal(iA.estado.turn, 'p'); assert.equal(iB.estado.turn, 'r', 'para a Bia, a vez é do rival (em cima)');
  assert.equal(iA.estado.sides.p.hand.length, 4);
  assert.ok(iA.estado.sides.r.hand.every(h => !h.id), 'a mão do rival vem escondida');
  assert.ok(iA.estado.sides.p.deck.every(h => !h.id), 'a ordem do próprio deck vem escondida');
  assert.equal(iA.estado.sides.p.nome, 'Ana Saci'); assert.equal(iB.estado.sides.p.nome, 'Bia Iara');

  // jogada fora de hora é recusada
  Bc.manda({ t: 'atacar' });
  const rec = await Bc.espera(m => m.t === 'recusado');
  assert.match(rec.msg, /vez/);

  const est = { A: iA.estado, B: iB.estado };
  const cli = { A, B: Bc };
  let fim = null, rodadas = 0;
  for (let volta = 0; volta < 60 && !fim; volta++) {
    const quem = est.A.turn === 'p' ? 'A' : 'B', outro = quem === 'A' ? 'B' : 'A';
    const c = cli[quem];
    // joga o que der, da mão, em terreno vazio ou alvo legal
    for (let tent = 0; tent < 6 && !fim; tent++) {
      const S = est[quem].sides.p;
      const h = S.hand.find(x => M.CARD[x.id].custo <= S.energy && (M.CARD[x.id].tipo !== 'feitico' || !M.CARD[x.id].alvo));
      if (!h) break;
      const lane = S.lanes.findIndex(L => !L.c);
      c.manda({ t: 'jogar', uid: h.uid, lane: lane < 0 ? 0 : lane });
      const m = await c.espera(x => x.t === 'passos' || x.t === 'recusado');
      if (m.t === 'recusado') break;
      const mo = await cli[outro].espera(x => x.t === 'passos');
      assert.equal(m.passos[0].k, 'play');
      assert.equal(m.passos[0].P, 'p'); assert.equal(mo.passos[0].P, 'r', 'o outro vê a jogada do lado de cima');
      assert.equal(mo.passos[0].id, h.id);
      est[quem] = m.passos[m.passos.length - 1].estado; est[outro] = mo.passos[mo.passos.length - 1].estado;
      if (m.passos.some(p => p.k === 'fim')) fim = true;
    }
    if (fim) break;
    c.manda({ t: 'atacar' });
    const m = await c.espera(x => x.t === 'passos'), mo = await cli[outro].espera(x => x.t === 'passos');
    est[quem] = m.passos[m.passos.length - 1].estado; est[outro] = mo.passos[mo.passos.length - 1].estado;
    // as duas visões batem (espelhadas)
    assert.equal(est.A.sides.p.hp, est.B.sides.r.hp);
    assert.equal(est.A.sides.r.hp, est.B.sides.p.hp);
    assert.equal(est.A.round, est.B.round);
    rodadas = est.A.round;
    if (m.passos.some(p => p.k === 'fim')) fim = true;
  }
  assert.ok(fim, 'a partida terminou');
  const fA = await A.espera(m => m.t === 'fim'), fB = await Bc.espera(m => m.t === 'fim');
  const par = [fA.resultado, fB.resultado].sort().join('/');
  assert.ok(['derrota/vitoria', 'empate/empate'].includes(par), par);
  if (fA.resultado === 'vitoria') { assert.equal(fA.gloria.depois, 25); assert.equal(fA.premio, 15); }
  assert.ok(rodadas >= 3, 'rodadas: ' + rodadas); console.log('duelo de teste:', rodadas, 'rodadas,', fA.resultado, fA.motivo);
  const rk = await api('GET', '/ranking', null, ana);
  assert.equal(rk.corpo.ranking.length, 2);
  A.ws.close(); Bc.ws.close();
});

test('duelo: sala com número, desistência e queda de conexão', async () => {
  const A = cliente(ana), Bc = cliente(bia);
  await A.pronto; await Bc.pronto;
  await A.espera(m => m.t === 'ola'); await Bc.espera(m => m.t === 'ola');
  A.manda({ t: 'sala_criar' });
  const sala = await A.espera(m => m.t === 'fila' && m.estado === 'sala');
  Bc.manda({ t: 'sala_entrar', codigo: '0000' });
  await Bc.espera(m => m.t === 'erro');
  Bc.manda({ t: 'sala_entrar', codigo: sala.codigo });
  await A.espera(m => m.t === 'inicio'); await Bc.espera(m => m.t === 'inicio');
  // Bia cai e volta: recebe a partida de novo
  Bc.ws.close();
  await A.espera(m => m.t === 'rival_saiu');
  const B2 = cliente(bia); await B2.pronto;
  const volta = await B2.espera(m => m.t === 'inicio');
  assert.equal(volta.estado.sides.p.nome, 'Bia Iara');
  await A.espera(m => m.t === 'rival_voltou');
  B2.manda({ t: 'desistir' });
  const fA = await A.espera(m => m.t === 'fim'), fB = await B2.espera(m => m.t === 'fim');
  assert.equal(fA.resultado, 'vitoria'); assert.equal(fB.resultado, 'derrota');
  assert.equal(fA.amistoso, true); assert.equal(fA.gloria.depois, fA.gloria.antes, 'sala com amigo não mexe na glória');
  assert.equal(fA.premio, 0, 'desistência logo no começo não dá prêmio');
  A.ws.close(); B2.ws.close();
});
