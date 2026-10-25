// Carrega as regras do jogo (os mesmos arquivos que o navegador usa) dentro do servidor.
// Assim a partida ao vivo é decidida aqui, com o mesmo motor, e ninguém trapaceia pelo navegador.
const fs = require('fs'), path = require('path'), vm = require('vm');

const ARQUIVOS = ['10-data', '12-tema', '20-core', '45-combos', '50-engine'];
const EXPOR = ['novaBatalha', 'iniciarTurno', 'fimTurno', 'jogarCarta', 'varrer', 'ataque', 'alvoReal', 'podeAtacar', 'effAtk',
  'fimDeJogo', 'fimPorRodadas', 'montarDeck', 'maoInicial', 'shuffle', 'mkInst', 'opp', 'motivoBloqueio', 'alvosLegais',
  'CARD', 'CARDS', 'COLECAO', 'RIVAIS', 'STARTER', 'STARTER_LANES', 'MERC', 'ARENAS', 'RARS', 'TERR_NOME', 'validState', 'freshState'];

function carregar() {
  const dir = path.join(__dirname, '..', 'client', 'game');
  let codigo = ARQUIVOS.map(f => fs.readFileSync(path.join(dir, f + '.js'), 'utf8')).join('\n;\n');
  // statsBase mora no arquivo de gráficos (30-gfx.js), que o servidor não carrega: copia só ela
  const gfx = fs.readFileSync(path.join(dir, '30-gfx.js'), 'utf8');
  codigo += '\n;' + gfx.match(/^function statsBase\(.*$/m)[0];
  codigo += '\n;globalThis.__MOTOR={' + EXPOR.join(',') + '};';
  const ctx = { console, Math, Date, JSON, window: {}, setTimeout, clearTimeout };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(codigo, ctx, { filename: 'motor-do-jogo.js' });
  // Duelo ao vivo: no Diário, cada lado aparece pelo apelido (o motor original escreve "Você" e "(rival)")
  const quem0 = ctx.quem, nomeC0 = ctx.nomeC;
  vm.runInContext(`quem = (B, P) => B.modo === 'pvp' ? (B.sides[P].nome || 'Rival') : __q(B, P);
    nomeC = (B, P, c) => B.modo === 'pvp' ? CARD[c.id].nome + ' (' + (B.sides[P].nome || 'Rival') + ')' : __n(B, P, c);`,
    Object.assign(ctx, { __q: quem0, __n: nomeC0 }));
  return ctx.__MOTOR;
}

module.exports = carregar();
