// Banco de dados (PostgreSQL). A URL vem de DATABASE_URL.
const { Pool } = require('pg');

function criarPool(url) {
  url = url || process.env.DATABASE_URL || 'postgres://mata:mata@localhost:5432/mata';
  // Bancos na nuvem (Neon, Render, Supabase) pedem SSL; o banco local não.
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  return new Pool({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false }, max: 10 });
}

// Cria as tabelas que faltarem. Seguro rodar toda vez que o servidor liga.
const ESQUEMA = `
CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  apelido     TEXT NOT NULL,
  apelido_min TEXT NOT NULL UNIQUE,
  senha       TEXT NOT NULL,
  gloria      INTEGER NOT NULL DEFAULT 0,
  pvp_vitorias INTEGER NOT NULL DEFAULT 0,
  pvp_derrotas INTEGER NOT NULL DEFAULT 0,
  pvp_empates  INTEGER NOT NULL DEFAULT 0,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessoes (
  token_hash TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  usado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS saves (
  usuario_id    INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  dados         JSONB NOT NULL,
  rev           INTEGER NOT NULL DEFAULT 1,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS caixa (
  id         SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL,
  dados      JSONB NOT NULL,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  pego_em    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS caixa_pendente ON caixa (usuario_id) WHERE pego_em IS NULL;
CREATE TABLE IF NOT EXISTS feira (
  id           SERIAL PRIMARY KEY,
  vendedor_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  carta        TEXT NOT NULL,
  preco        INTEGER NOT NULL,
  estado       TEXT NOT NULL DEFAULT 'aberto',
  comprador_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  taxa         INTEGER NOT NULL DEFAULT 0,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_em    TIMESTAMPTZ NOT NULL,
  fechado_em   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS feira_aberta ON feira (carta, preco) WHERE estado = 'aberto';
CREATE TABLE IF NOT EXISTS partidas (
  id         SERIAL PRIMARY KEY,
  a_id       INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  b_id       INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  resultado  TEXT,
  motivo     TEXT,
  rodadas    INTEGER,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  fim_em     TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS premios_dia (
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  dia        DATE NOT NULL,
  pagos      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (usuario_id, dia)
);
`;

async function migrar(pool) {
  await pool.query(ESQUEMA);
}

// Roda fn(client) numa transação; desfaz tudo se der erro.
async function transacao(pool, fn) {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const r = await fn(c);
    await c.query('COMMIT');
    return r;
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    throw e;
  } finally {
    c.release();
  }
}

module.exports = { criarPool, migrar, transacao };
