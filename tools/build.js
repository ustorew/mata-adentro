// Monta public/index.html a partir de client/ (o jogo inteiro numa página só, como no protótipo).
const fs = require('fs'), path = require('path');
const C = path.join(__dirname, '..', 'client');
const ler = f => fs.readFileSync(path.join(C, f), 'utf8');
function montar() {
  const ordem = ler('game/ORDEM.txt').split('\n').filter(Boolean);
  const jogo = ordem.map(f => `/* ---- ${f.replace(/\.js$/, '')} ---- */\n` + ler('game/' + f)).join('');
  return ler('index.template.html')
    .replace(/<!--VENDOR:([^>]+)-->/g, (_, n) => `<script>\n/* ---- ${n === 'three.min.js' ? 'three.min.js (r149)' : n} ---- */\n${ler('vendor/' + n)}</script>`)
    .replace('<!--GAME-->', () => `<script>\n${jogo}</script>`);
}
module.exports = { montar };
if (require.main === module) {
  const out = path.join(__dirname, '..', 'public');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'index.html'), montar());
  console.log('public/index.html pronto');
}
