// Feira entre jogadores: anunciar uma carta repetida, comprar de outra pessoa, cancelar.
// A carta anunciada sai da coleção na hora (fica guardada com a Feira) e volta se ninguém comprar em 3 dias.
// Em cada venda, 10% do preço é queimado: some do jogo, para segurar a inflação do Vintém.
const { transacao } = require('./db');
const { erro } = require('./auth');
const S = require('./saves');
const M = require('./motor');

const TAXA = 0.10;
const DIAS = 3;
const MAX_ANUNCIOS = 10;
const taxaDe = p => Math.max(1, Math.round(p * TAXA));
const COLECIONAVEL = new Set(M.COLECAO.map(c => c.id));
// faixa de preço por raridade: do lance dos robôs até 5x o preço base do Mercado
const faixa = rar => ({ min: Math.max(2, Math.floor(M.MERC[rar].base * 0.3)), max: M.MERC[rar].base * 5 });

function confereCarta(id) {
  if (typeof id !== 'string' || !COLECIONAVEL.has(id)) throw erro(400, 'Essa carta não existe.');
  return M.CARD[id];
}

async function anunciar(pool, uid, { carta, preco, save }) {
  const c = confereCarta(carta);
  preco = Number(preco);
  const f = faixa(c.rar);
  if (!Number.isInteger(preco) || preco < f.min || preco > f.max) throw erro(400, `O preço dessa carta vai de ${f.min} a ${f.max} Vinténs.`);
  return transacao(pool, async cx => {
    const n = await cx.query("SELECT count(*)::int AS n FROM feira WHERE vendedor_id = $1 AND estado = 'aberto'", [uid]);
    if (n.rows[0].n >= MAX_ANUNCIOS) throw erro(400, `Você já tem ${MAX_ANUNCIOS} cartas na Feira. Espere vender ou cancele uma.`);
    return S.comSave(cx, uid, save, async dados => {
      S.tirarCopia(dados, carta);
      const r = await cx.query(`INSERT INTO feira (vendedor_id, carta, preco, expira_em) VALUES ($1, $2, $3, now() + interval '${DIAS} days') RETURNING id, expira_em`,
        [uid, carta, preco]);
      return { anuncio: { id: r.rows[0].id, carta, preco, expira_em: r.rows[0].expira_em } };
    });
  });
}

async function comprar(pool, uid, { id, save }) {
  return transacao(pool, async cx => {
    const r = await cx.query(`SELECT f.*, u.apelido FROM feira f JOIN usuarios u ON u.id = f.vendedor_id
      WHERE f.id = $1 FOR UPDATE OF f`, [Number(id) || 0]);
    const a = r.rows[0];
    if (!a || a.estado !== 'aberto' || new Date(a.expira_em) <= new Date()) throw erro(410, 'Essa carta já foi vendida ou saiu da Feira.');
    if (a.vendedor_id === uid) throw erro(400, 'Essa carta é sua. Para tirar da Feira, use Cancelar.');
    const taxa = taxaDe(a.preco), liquido = a.preco - taxa;
    const comprador = (await cx.query('SELECT apelido FROM usuarios WHERE id = $1', [uid])).rows[0].apelido;
    const out = await S.comSave(cx, uid, save, async dados => {
      S.pagar(dados, a.preco);
      S.darCarta(dados, a.carta, 'compradas');
    });
    await cx.query("UPDATE feira SET estado = 'vendido', comprador_id = $2, taxa = $3, fechado_em = now() WHERE id = $1", [a.id, uid, taxa]);
    await cx.query("INSERT INTO caixa (usuario_id, tipo, dados) VALUES ($1, 'venda', $2)",
      [a.vendedor_id, { anuncio: a.id, carta: a.carta, preco: a.preco, taxa, liquido, comprador }]);
    out.compra = { carta: a.carta, preco: a.preco, vendedor: a.apelido };
    return out;
  });
}

async function cancelar(pool, uid, { id, save }) {
  return transacao(pool, async cx => {
    const r = await cx.query('SELECT * FROM feira WHERE id = $1 FOR UPDATE', [Number(id) || 0]);
    const a = r.rows[0];
    if (!a || a.vendedor_id !== uid) throw erro(404, 'Anúncio não encontrado.');
    if (a.estado !== 'aberto') throw erro(410, 'Essa carta já foi vendida.');
    const out = await S.comSave(cx, uid, save, async dados => {
      S.darCarta(dados, a.carta, null);
      dados.eco.cartas.vendidas = Math.max(0, (dados.eco.cartas.vendidas || 0) - 1);
    });
    await cx.query("UPDATE feira SET estado = 'cancelado', fechado_em = now() WHERE id = $1", [a.id]);
    out.cancelado = { carta: a.carta };
    return out;
  });
}

async function listar(pool, uid, { carta, rar, ordem } = {}) {
  const w = ["f.estado = 'aberto'", 'f.expira_em > now()'], v = [];
  if (carta) { v.push(String(carta)); w.push(`f.carta = $${v.length}`); }
  if (rar && M.RARS.includes(rar)) { v.push(M.COLECAO.filter(c => c.rar === rar).map(c => c.id)); w.push(`f.carta = ANY($${v.length})`); }
  const ord = ordem === 'novas' ? 'f.criado_em DESC' : 'f.preco ASC, f.criado_em ASC';
  const r = await pool.query(`SELECT f.id, f.carta, f.preco, f.criado_em, f.expira_em, u.apelido, (f.vendedor_id = ${Number(uid) || 0}) AS minha
    FROM feira f JOIN usuarios u ON u.id = f.vendedor_id WHERE ${w.join(' AND ')} ORDER BY ${ord} LIMIT 200`, v);
  return r.rows;
}

async function meus(pool, uid) {
  const r = await pool.query(`SELECT f.id, f.carta, f.preco, f.estado, f.taxa, f.criado_em, f.expira_em, f.fechado_em, u.apelido AS comprador
    FROM feira f LEFT JOIN usuarios u ON u.id = f.comprador_id
    WHERE f.vendedor_id = $1 AND (f.estado = 'aberto' OR f.fechado_em > now() - interval '7 days') ORDER BY f.criado_em DESC LIMIT 50`, [uid]);
  return r.rows;
}

// Números da Feira nos últimos 7 dias (para a aba Economia).
async function resumo(pool) {
  const r = await pool.query(`SELECT count(*)::int AS vendas, coalesce(sum(preco),0)::int AS volume, coalesce(sum(taxa),0)::int AS queimado
    FROM feira WHERE estado = 'vendido' AND fechado_em > now() - interval '7 days'`);
  const a = await pool.query("SELECT count(*)::int AS n FROM feira WHERE estado = 'aberto' AND expira_em > now()");
  return Object.assign({ anuncios: a.rows[0].n, taxa: TAXA }, r.rows[0]);
}

// Anúncios vencidos: a carta volta para o dono pela caixa de entrada.
async function expirar(pool) {
  return transacao(pool, async cx => {
    const r = await cx.query("UPDATE feira SET estado = 'expirado', fechado_em = now() WHERE estado = 'aberto' AND expira_em <= now() RETURNING id, vendedor_id, carta");
    for (const a of r.rows) await cx.query("INSERT INTO caixa (usuario_id, tipo, dados) VALUES ($1, 'devolucao', $2)", [a.vendedor_id, { anuncio: a.id, carta: a.carta }]);
    return r.rows.length;
  });
}

module.exports = { anunciar, comprar, cancelar, listar, meus, resumo, expirar, faixa, TAXA, DIAS, MAX_ANUNCIOS };
