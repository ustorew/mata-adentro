// Uso único: separa o HTML do protótipo (Artifact) em arquivos-fonte editáveis.
// node tools/split.js caminho/do/orig.html
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(process.argv[2], 'utf8');
const root = path.join(__dirname, '..', 'client');
fs.mkdirSync(path.join(root, 'vendor'), { recursive: true });
fs.mkdirSync(path.join(root, 'game'), { recursive: true });
let out = '', i = 0;
const re = /<script>\n\/\* ---- ([^ ]+(?: \([^)]*\))?) ---- \*\/\n([\s\S]*?)<\/script>/g;
let m;
while ((m = re.exec(src))) {
  out += src.slice(i, m.index);
  const nome = m[1].replace(/ \(.*\)$/, '');
  const corpo = m[2];
  if (nome === '10-data') {
    // o script principal: um arquivo por módulo (marcadores "/* ---- NN-nome ---- */")
    const partes = ('/* ---- 10-data ---- */\n' + corpo).split(/^\/\* ---- ([0-9]{2}-[a-z0-9-]+) ---- \*\/\n/m);
    const lista = [];
    for (let k = 1; k < partes.length; k += 2) {
      fs.writeFileSync(path.join(root, 'game', partes[k] + '.js'), partes[k + 1]);
      lista.push(partes[k] + '.js');
    }
    out += '<!--GAME-->';
    fs.writeFileSync(path.join(root, 'game', 'ORDEM.txt'), lista.join('\n') + '\n');
  } else {
    fs.writeFileSync(path.join(root, 'vendor', nome), corpo);
    out += `<!--VENDOR:${nome}-->`;
  }
  i = m.index + m[0].length;
}
out += src.slice(i);
fs.writeFileSync(path.join(root, 'index.template.html'), out);
console.log('ok');
