// Contas: criar, entrar, sair. Senhas com scrypt; a sessão é um token guardado só como hash.
const crypto = require('crypto');

const erro = (status, msg) => Object.assign(new Error(msg), { status });

function hashSenha(senha) {
  const sal = crypto.randomBytes(16);
  const h = crypto.scryptSync(senha, sal, 64);
  return 'scrypt$' + sal.toString('hex') + '$' + h.toString('hex');
}
function confereSenha(senha, guardada) {
  const [tipo, salHex, hHex] = String(guardada).split('$');
  if (tipo !== 'scrypt' || !salHex || !hHex) return false;
  const h = crypto.scryptSync(senha, Buffer.from(salHex, 'hex'), 64);
  const g = Buffer.from(hHex, 'hex');
  return g.length === h.length && crypto.timingSafeEqual(g, h);
}
const hashToken = t => crypto.createHash('sha256').update(t).digest('hex');

const normEmail = e => String(e || '').trim().toLowerCase();
const normApelido = a => String(a || '').trim().replace(/\s+/g, ' ');
const apelidoMin = a => normApelido(a).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function validar({ email, senha, apelido }, criando) {
  email = normEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) throw erro(400, 'Esse e-mail não parece certo.');
  if (typeof senha !== 'string' || senha.length < 6) throw erro(400, 'A senha precisa ter pelo menos 6 letras ou números.');
  if (senha.length > 200) throw erro(400, 'Senha comprida demais.');
  if (criando) {
    apelido = normApelido(apelido);
    if (apelido.length < 3 || apelido.length > 16) throw erro(400, 'O apelido precisa ter de 3 a 16 letras.');
    if (!/^[\p{L}\p{N} _.-]+$/u.test(apelido)) throw erro(400, 'Use só letras, números, espaço, ponto, traço ou sublinhado no apelido.');
  }
  return { email, senha, apelido };
}

// Freio simples contra quem tenta adivinhar senhas: 10 tentativas erradas por 15 minutos.
const tentativas = new Map();
function freio(chave) {
  const agora = Date.now(), t = tentativas.get(chave);
  if (t && agora - t.desde < 15 * 60e3 && t.n >= 10) throw erro(429, 'Muitas tentativas. Espere uns minutos e tente de novo.');
}
function anotaErro(chave) {
  const agora = Date.now(), t = tentativas.get(chave);
  if (!t || agora - t.desde >= 15 * 60e3) tentativas.set(chave, { n: 1, desde: agora });
  else t.n++;
}

async function novaSessao(pool, usuarioId) {
  const token = crypto.randomBytes(32).toString('base64url');
  await pool.query('INSERT INTO sessoes (token_hash, usuario_id) VALUES ($1, $2)', [hashToken(token), usuarioId]);
  return token;
}

const publico = u => ({ id: u.id, apelido: u.apelido, email: u.email, gloria: u.gloria,
  pvp: { vitorias: u.pvp_vitorias, derrotas: u.pvp_derrotas, empates: u.pvp_empates } });

async function criarConta(pool, dados) {
  const { email, senha, apelido } = validar(dados, true);
  const ja = await pool.query('SELECT email, apelido_min FROM usuarios WHERE email = $1 OR apelido_min = $2', [email, apelidoMin(apelido)]);
  if (ja.rows.some(r => r.email === email)) throw erro(409, 'Já existe uma conta com esse e-mail. Tente entrar.');
  if (ja.rows.length) throw erro(409, 'Esse apelido já tem dono. Escolha outro.');
  let r;
  try {
    r = await pool.query('INSERT INTO usuarios (email, apelido, apelido_min, senha) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, apelido, apelidoMin(apelido), hashSenha(senha)]);
  } catch (e) {
    if (e.code === '23505') throw erro(409, 'Esse e-mail ou apelido acabou de ser usado. Tente outro.');
    throw e;
  }
  const u = r.rows[0];
  return { token: await novaSessao(pool, u.id), usuario: publico(u) };
}

async function entrar(pool, dados) {
  const { email, senha } = validar(dados, false);
  freio(email);
  const r = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
  const u = r.rows[0];
  if (!u || !confereSenha(senha, u.senha)) { anotaErro(email); throw erro(401, 'E-mail ou senha não conferem.'); }
  return { token: await novaSessao(pool, u.id), usuario: publico(u) };
}

async function sair(pool, token) {
  if (token) await pool.query('DELETE FROM sessoes WHERE token_hash = $1', [hashToken(token)]);
}

// Descobre o usuário a partir do token (cabeçalho "Authorization: Bearer ...").
async function usuarioDoToken(pool, token) {
  if (!token || token.length > 100) return null;
  const r = await pool.query(
    `UPDATE sessoes SET usado_em = now() WHERE token_hash = $1
     RETURNING (SELECT row_to_json(u) FROM usuarios u WHERE u.id = sessoes.usuario_id) AS u`, [hashToken(token)]);
  return r.rows[0] ? r.rows[0].u : null;
}
const tokenDe = req => {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
};
function exigeConta(pool) {
  return async (req, res, next) => {
    try {
      const u = await usuarioDoToken(pool, tokenDe(req));
      if (!u) return res.status(401).json({ erro: 'Entre na sua conta de novo.' });
      req.usuario = u;
      next();
    } catch (e) { next(e); }
  };
}

module.exports = { criarConta, entrar, sair, usuarioDoToken, exigeConta, tokenDe, publico, erro, hashSenha, confereSenha };
