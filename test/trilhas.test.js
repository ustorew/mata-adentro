// Motor da Batalha das Trilhas: partidas computador x computador terminam, sem números quebrados.
const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const G=path.join(__dirname,'..','client','game');
function motor(){
  const ctx={console,Math,Date,window:{}};vm.createContext(ctx);
  const src=['10-data.js','12-tema.js','62-trilhas.js'].map(f=>fs.readFileSync(path.join(G,f),'utf8')).join('\n;\n')+'\n;this.TRI=TRI;this.CARD=CARD;this.RIVAIS=RIVAIS;this.STARTER=STARTER;';
  vm.runInContext(src,ctx);return ctx;
}
const deckDe=(m,lvl)=>{const d=[];for(const id in m)for(let i=0;i<m[id];i++)d.push({id,lvl});return d;};
test('partidas entre computadores terminam com vencedor e sem NaN',()=>{
  const C=motor();const nomes=Object.keys(C.RIVAIS).filter(k=>C.RIVAIS[k].deck);
  const res={p:0,r:0,empate:0},dur=[];
  for(let k=0;k<40;k++){
    const a=C.RIVAIS[nomes[k%nomes.length]],b=C.RIVAIS[nomes[(k*3+1)%nomes.length]];
    const T=C.TRI.nova({seed:1000+k,p:{deck:deckDe(a.deck,2),terr:a.lanes},r:{deck:deckDe(b.deck,2),terr:b.lanes},ia:{p:'medio',r:'medio'}});
    let n=0;while(!T.over&&n<(260*30)){C.TRI.passo(T,1/30);n++;T.ev.length=0;
      for(const e of T.ents){if(!isFinite(e.x)||!isFinite(e.y)||!isFinite(e.hp))assert.fail('número quebrado em '+(e.id||e.kind));}}
    assert.ok(T.over,'partida '+k+' não terminou');res[T.vencedor]++;dur.push(Math.round(T.t));
  }
  console.log('resultados',res,'duração média',Math.round(dur.reduce((a,b)=>a+b)/dur.length),'s; antes do tempo:',dur.filter(d=>d<179).length);
});
test('jogar carta: custa energia, respeita a zona e roda a mão',()=>{
  const C=motor();const d=deckDe(C.STARTER,1);
  const T=C.TRI.nova({seed:7,p:{deck:d,terr:['milharal','pasto','milharal']},r:{deck:d.slice(),terr:['pasto','pasto','pasto']}});
  const i=T.mao.p.findIndex(c=>C.CARD[c.id].custo<=5&&C.CARD[c.id].tipo==='criatura');
  assert.equal(C.TRI.jogar(T,'p',i,0,25).ok,false,'não pode soltar no campo rival');
  const prox=T.fila.p[0],custo=C.CARD[T.mao.p[i].id].custo;
  assert.equal(C.TRI.jogar(T,'p',i,0.2,10).ok,true);
  assert.equal(T.en.p,5-custo);assert.equal(T.mao.p[i],prox);assert.equal(T.mao.p.length,4);
});
