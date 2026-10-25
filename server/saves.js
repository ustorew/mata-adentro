// Jogo salvo na nuvem. Cada conta tem um save (o mesmo objeto que o navegador guardava) e um número de revisão.
// O navegador manda o save com a revisão que conhece; se outra tela salvou antes, o servidor recusa (409)
// e devolve o save mais novo, para ninguém apagar o progresso de outro aparelho sem querer.
const { transacao } = require('./db');
const { erro } = require('./auth');
const M = require('./motor');

const TAM_MAX = 1.5e6; // bytes

function confereSave(d) {
  if (!M.validState(d)) throw erro(400, 'Esse jogo salvo veio com defeito.');
  if (JSON.stringify(d).length > TAM_MAX) throw erro(413, 'Jogo salvo grande demais.');
  return d;
}

async function lerSave(pool, uid) {
  const r = await pool.query('SELECT dados, rev FROM saves WHERE usuario_id = $1', [uid]);
  return r.rows[0] ? { dados: r.rows[0].dados, rev: r.rows[0].rev } : { dados: null, rev: 0 };
}

async function gravarSave(pool, uid, dados, rev) {
  confereSave(dados);
  return transacao(pool, async c => {
    const r = await c.query('SELECT rev, dados FROM saves WHERE usuario_id = $1 FOR UPDATE', [uid]);
    const atual = r.rows[0];
    if ((atual ? atual.rev : 0) !== rev) throw Object.assign(erro(409, 'Seu jogo foi salvo em outro aparelho.'), { atual: atual ? { dados: atual.dados, rev: atual.rev } : null });
    if (!atual) await c.query('INSERT INTO saves (usuario_id, dados, rev) VALUES ($1, $2, 1)', [uid, dados]);
    else await c.query('UPDATE saves SET dados = $2, rev = rev + 1, atualizado_em = now() WHERE usuario_id = $1', [uid, dados]);
    return { rev: rev + 1 };
  });
}

// Operação do servidor sobre o save (Feira, caixa de entrada). O navegador manda o save atual dele junto
// (assim nada do que ele fez se perde), o servidor muda o que precisa e devolve o save novo.
async function comSave(c, uid, enviado, fn) {
  const r = await c.query('SELECT rev, dados FROM saves WHERE usuario_id = $1 FOR UPDATE', [uid]);
  const atual = r.rows[0];
  if (!atual) throw erro(409, 'Salve o jogo antes (abra o jogo de novo).');
  let dados = atual.dados;
  if (enviado && enviado.dados) {
    if (enviado.rev !== atual.rev) throw Object.assign(erro(409, 'Seu jogo foi salvo em outro aparelho.'), { atual: { dados: atual.dados, rev: atual.rev } });
    dados = confereSave(enviado.dados);
  }
  const extra = await fn(dados);
  await c.query('UPDATE saves SET dados = $2, rev = rev + 1, atualizado_em = now() WHERE usuario_id = $1', [uid, dados]);
  return Object.assign({ dados, rev: atual.rev + 1 }, extra || {});
}

/* ---- mudanças no save (mesmos campos que o jogo usa em 20-core.js) ---- */
function garantirCampos(s) {
  if (typeof s.eco.criado.feira !== 'number') s.eco.criado.feira = 0;
  if (!s.eco.ralos || typeof s.eco.ralos !== 'object') s.eco.ralos = {};
  if (typeof s.eco.ralos.feira !== 'number') s.eco.ralos.feira = 0;
  if (typeof s.eco.criado.pvp !== 'number') s.eco.criado.pvp = 0;
}
// Uma cópia sai da coleção (só cópias repetidas: a carta em si nunca sai).
function tirarCopia(s, id) {
  const c = s.cards[id];
  if (!c || !(c.copias >= 1)) throw erro(400, 'Você só pode vender cartas repetidas.');
  c.copias--;
  s.eco.cartas.vendidas = (s.eco.cartas.vendidas || 0) + 1;
}
function darCarta(s, id, fonte) {
  if (!s.cards[id]) s.cards[id] = { lvl: 1, copias: 0 };
  else s.cards[id].copias++;
  if (fonte) s.eco.cartas[fonte] = (s.eco.cartas[fonte] || 0) + 1;
}
function pagar(s, n) {
  garantirCampos(s);
  if (!(s.grao >= n)) throw erro(400, 'Vinténs não dão.');
  s.grao -= n; s.eco.ralos.feira += n;
}
function receber(s, n, fonte) {
  garantirCampos(s);
  s.grao += n; s.eco.criado[fonte] += n;
}

// Entrega o que está na caixa de entrada (vendas feitas, cartas que voltaram, prêmios).
async function pegarCaixa(c, uid, dados) {
  const r = await c.query('SELECT id, tipo, dados FROM caixa WHERE usuario_id = $1 AND pego_em IS NULL ORDER BY id FOR UPDATE', [uid]);
  for (const it of r.rows) {
    const d = it.dados;
    if (it.tipo === 'venda') receber(dados, d.liquido, 'feira');
    else if (it.tipo === 'devolucao') { darCarta(dados, d.carta, null); dados.eco.cartas.vendidas = Math.max(0, (dados.eco.cartas.vendidas || 0) - 1); }
    else if (it.tipo === 'premio') receber(dados, d.vintens, 'pvp');
  }
  if (r.rows.length) await c.query('UPDATE caixa SET pego_em = now() WHERE id = ANY($1)', [r.rows.map(x => x.id)]);
  return r.rows.map(x => Object.assign({ tipo: x.tipo }, x.dados));
}

module.exports = { lerSave, gravarSave, comSave, confereSave, tirarCopia, darCarta, pagar, receber, garantirCampos, pegarCaixa };
