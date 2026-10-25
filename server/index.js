// Servidor do Mata Adentro: entrega o jogo, guarda contas e jogos salvos, cuida da Feira e dos duelos ao vivo.
const http = require('http');
const path = require('path');
const express = require('express');
const compression = require('compression');
const { WebSocketServer } = require('ws');
const { criarPool, migrar } = require('./db');
const A = require('./auth');
const S = require('./saves');
const F = require('./feira');
const { criarPvp } = require('./pvp');
const { transacao } = require('./db');

const log = (...a) => console.log(new Date().toISOString(), ...a);

function criarApp(pool) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));

  const api = express.Router();
  const conta = A.exigeConta(pool);
  const rota = fn => async (req, res, next) => { try { res.json(await fn(req, res)); } catch (e) { next(e); } };

  /* contas */
  api.post('/conta/criar', rota(req => A.criarConta(pool, req.body || {})));
  api.post('/conta/entrar', rota(req => A.entrar(pool, req.body || {})));
  api.post('/conta/sair', rota(async req => { await A.sair(pool, A.tokenDe(req)); return { ok: true }; }));
  api.get('/conta/eu', conta, rota(req => ({ usuario: A.publico(req.usuario) })));

  /* jogo salvo */
  api.get('/save', conta, rota(req => S.lerSave(pool, req.usuario.id)));
  api.put('/save', conta, rota(req => S.gravarSave(pool, req.usuario.id, (req.body || {}).dados, Number((req.body || {}).rev) || 0)));

  /* caixa de entrada: vendas da Feira, cartas que voltaram, prêmios dos duelos */
  api.get('/caixa', conta, rota(async req => {
    const r = await pool.query('SELECT count(*)::int AS n FROM caixa WHERE usuario_id = $1 AND pego_em IS NULL', [req.usuario.id]);
    return { pendentes: r.rows[0].n };
  }));
  api.post('/caixa/pegar', conta, rota(req => transacao(pool, async cx => {
    let itens = [];
    const out = await S.comSave(cx, req.usuario.id, (req.body || {}).save, async dados => { itens = await S.pegarCaixa(cx, req.usuario.id, dados); });
    out.itens = itens;
    return out;
  })));

  /* Feira entre jogadores */
  api.get('/feira', conta, rota(req => F.listar(pool, req.usuario.id, req.query).then(anuncios => ({ anuncios }))));
  api.get('/feira/minhas', conta, rota(req => F.meus(pool, req.usuario.id).then(anuncios => ({ anuncios }))));
  api.get('/feira/resumo', conta, rota(() => F.resumo(pool)));
  api.post('/feira/anunciar', conta, rota(req => F.anunciar(pool, req.usuario.id, req.body || {})));
  api.post('/feira/comprar', conta, rota(req => F.comprar(pool, req.usuario.id, req.body || {})));
  api.post('/feira/cancelar', conta, rota(req => F.cancelar(pool, req.usuario.id, req.body || {})));

  /* ranking dos duelos */
  api.get('/ranking', conta, rota(async req => {
    const r = await pool.query(`SELECT apelido, gloria, pvp_vitorias AS vitorias, pvp_derrotas AS derrotas, pvp_empates AS empates
      FROM usuarios WHERE pvp_vitorias + pvp_derrotas + pvp_empates > 0 ORDER BY gloria DESC, pvp_vitorias DESC LIMIT 50`);
    return { ranking: r.rows, voce: A.publico(req.usuario) };
  }));

  api.get('/saude', rota(async () => { await pool.query('SELECT 1'); return { ok: true }; }));
  api.use((req, res) => res.status(404).json({ erro: 'Não encontrado.' }));
  app.use('/api', api);

  app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '5m' }));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

  app.use((e, req, res, next) => {
    const st = e.status || (e.type === 'entity.too.large' ? 413 : 500);
    if (st >= 500) log('erro', req.method, req.path, e);
    const corpo = { erro: st >= 500 ? 'Algo deu errado no servidor. Tente de novo.' : e.message };
    if (e.atual) corpo.atual = e.atual;
    res.status(st).json(corpo);
  });
  return app;
}

async function iniciar({ porta = process.env.PORT || 3000, databaseUrl } = {}) {
  const pool = criarPool(databaseUrl);
  await migrar(pool);
  const app = criarApp(pool);
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 64 * 1024 });
  const pvp = criarPvp({ pool, wss, log });
  const expira = setInterval(() => F.expirar(pool).catch(e => log('erro ao expirar anúncios', e)), 5 * 60e3);
  await new Promise(r => server.listen(porta, r));
  log('Mata Adentro no ar, porta', server.address().port);
  return {
    server, pool, pvp, porta: server.address().port,
    parar: async () => { clearInterval(expira); pvp.parar(); for (const c of wss.clients) c.terminate(); await new Promise(r => server.close(r)); await pool.end(); },
  };
}

module.exports = { iniciar, criarApp };
if (require.main === module) iniciar().catch(e => { console.error(e); process.exit(1); });
