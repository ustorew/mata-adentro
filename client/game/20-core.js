/* ===================== NÚCLEO: sorte, estado, economia ===================== */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let rnd=Math.random;
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
const pick=a=>a[Math.floor(rnd()*a.length)];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>Math.round(n).toLocaleString('pt-BR');
const escH=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rIdx=r=>RARS.indexOf(r);
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
function hashStr(t){let h=2166136261>>>0;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
const hoje=()=>new Date().toDateString();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

let s=null;

function freshState(){
  const now=Date.now();
  const st={v:1,criadoEm:now,grao:300,po:0,trofeus:0,trofeusMax:0,cards:{},
    deck:{cartas:[],terrenos:STARTER_LANES.slice()},
    baus:[null,null,null,null],bauCiclo:0,pacotes:{semente:0,colheita:0},pity:{epica:0,lendaria:0},
    missoes:null,trilhaPega:[],graoPartidasHoje:{dia:'',total:0},
    eco:{criado:{inicial:300,vitorias:0,baus:0,missoes:0,trilha:0},
      queimado:{pacotes:0,melhorias:0,pressa:0,taxasVoce:0,taxasRobos:0,torneio:0},
      reservaRobos:50000,cartas:{presente:0,pacotes:0,baus:0,criacao:0,queimadas:0,melhoria:0,compradas:0,vendidas:0,ascensao:0},
      poGanho:0,poGasto:0,hist:[],
      // v10: ralos novos ficam AQUI (o teste de migração compara eco.queimado por JSON) + histórico por dia
      ralos:{ascensao:0,vila:0,causos:0,mascate:0},dia:{}},
    mercado:{c:{},ultimoTick:now,feed:[],poolRobos:50000},
    stats:{vitorias:0,derrotas:0,empates:0,criaturasJogadas:0,feiticosJogados:0,danoHeroi:0,abates:0,pacotes:0,baus:0,
      treinos:0,desafios:0,torneios:0,duplas:0,combos:0},
    tutorialFeito:false,primeiroPacote:false,guia:0,mudo:false,semMusica:false,mig:MIGRACAO,partida:null,
    // v4: modos de batalha e códex das combinações
    desafio:{dia:'',venceu:false,tentativas:0,total:0},
    torneio:{dia:'',entradas:0,ativo:null,titulos:0,melhor:0,jogados:0}, // ativo={etapa,vitorias,hp,desde}
    treino:{rival:'tonico',tier:'facil',regra:null},
    codex:{duplas:{},regras:{}},
    // v10: ralos novos (25-ralos.js); nada disso muda s.cards[*], s.eco.queimado nem s.mig
    vila:{fogueira:0,sertao:0,mata:0,aguas:0,noite:0},
    causos:{lidos:{},folhetos:{}},
    cosm:{tem:{},usa:{moldura:null,verso:null,tabuleiro:{},heroi:null,emotes:[],rastro:null,titulo:null,acessorio:null},emoteMudo:false},
    decks:[],vigiaFeira:{},diarios:[],missaoTroca:{dia:'',usada:false},v10:1,v10em:now};
  for(const id in STARTER){st.cards[id]={lvl:1,copias:0};st.eco.cartas.presente++;for(let i=0;i<STARTER[id];i++)st.deck.cartas.push(id);}
  for(const c of COLECAO){const m={hype:0.9+rnd()*0.2,oferta:MERC[c.rar].T,hist:[]};st.mercado.c[c.id]=m;}
  return st;
}
function validState(d){
  try{return !!(d&&d.v===1&&typeof d.grao==='number'&&d.cards&&typeof d.cards==='object'&&d.deck&&Array.isArray(d.deck.cartas)&&Array.isArray(d.deck.terrenos)&&d.deck.terrenos.length===4&&Array.isArray(d.baus)&&d.baus.length===4&&d.eco&&d.eco.criado&&d.eco.queimado&&d.mercado&&d.mercado.c&&d.pacotes&&d.pity&&d.stats);}catch(e){return false;}
}
function fixState(d){
  // completa campos que possam faltar (sem mudar a economia)
  const f=freshState();
  const mig=d.mig||1; // saves antigos não têm "mig"
  for(const k in f)if(d[k]===undefined)d[k]=f[k];
  for(const k in f.eco)if(d.eco[k]===undefined)d.eco[k]=f.eco[k];
  for(const k in f.eco.cartas)if(d.eco.cartas[k]===undefined)d.eco.cartas[k]=0;
  for(const k in f.stats)if(d.stats[k]===undefined)d.stats[k]=0;
  for(const k in f.eco.queimado)if(d.eco.queimado[k]===undefined)d.eco.queimado[k]=0;
  // v4: objetos novos (completa um objeto escrito pela metade)
  for(const k of ['desafio','torneio','treino','codex']){if(!d[k]||typeof d[k]!=='object')d[k]=f[k];for(const j in f[k])if(d[k][j]===undefined)d[k][j]=f[k][j];}
  for(const k of ['duplas','regras'])if(!d.codex[k]||typeof d.codex[k]!=='object')d.codex[k]={};
  if(d.treino.rival&&!RIVAIS[d.treino.rival])d.treino.rival='tonico';
  if(!TIER_NOME[d.treino.tier])d.treino.tier='facil';
  if(d.treino.regra&&!REGRA[d.treino.regra])d.treino.regra=null;
  if(d.torneio.ativo&&!(d.torneio.ativo.etapa>=0&&d.torneio.ativo.etapa<TORNEIO.etapas.length))d.torneio.ativo=null;
  for(const c of COLECAO)if(!d.mercado.c[c.id])d.mercado.c[c.id]=f.mercado.c[c.id];
  if(!Array.isArray(d.mercado.feed))d.mercado.feed=[];
  for(const id in d.cards)if(!CARD[id]||CARD[id].ficha)delete d.cards[id];
  if(mig<2){
    // regras v2: preços do Mercado ancorados (o histórico antigo mostraria variações falsas)
    for(const id in d.mercado.c)d.mercado.c[id].hist=[];
    // gráfico da Economia: separa o que VOCÊ queimou das taxas antigas entre robôs
    const qTot=sum(d.eco.queimado)||1,qv=qTot-(d.eco.queimado.taxasRobos||0);
    for(const x of d.eco.hist)if(x.qv==null)x.qv=Math.round(x.q*qv/qTot);
    d.mig=2;
  }
  if(mig<3){
    // regras v4: a partida em andamento passa a guardar o modo
    if(d.partida&&!d.partida.modo)d.partida.modo='arena';
    d.mig=3;
  }
  if(d.partida===undefined)d.partida=null;
  // v10: completa os objetos novos (escritos pela metade ou de tipo errado), sem tocar em cards/queimado/mig
  if(!d.eco.ralos||typeof d.eco.ralos!=='object')d.eco.ralos={};
  for(const k in f.eco.ralos)if(typeof d.eco.ralos[k]!=='number')d.eco.ralos[k]=0;
  if(!d.eco.dia||typeof d.eco.dia!=='object'||Array.isArray(d.eco.dia))d.eco.dia={};
  for(const k of ['vila','causos','cosm','missaoTroca']){if(!d[k]||typeof d[k]!=='object'||Array.isArray(d[k]))d[k]=f[k];for(const j in f[k])if(d[k][j]===undefined)d[k][j]=f[k][j];}
  for(const k in d.vila)d.vila[k]=clamp(d.vila[k]|0,0,5);
  for(const k of ['lidos','folhetos'])if(!d.causos[k]||typeof d.causos[k]!=='object')d.causos[k]={};
  if(!d.cosm.tem||typeof d.cosm.tem!=='object')d.cosm.tem={};
  if(!d.cosm.usa||typeof d.cosm.usa!=='object')d.cosm.usa=f.cosm.usa;
  for(const j in f.cosm.usa)if(d.cosm.usa[j]===undefined)d.cosm.usa[j]=f.cosm.usa[j];
  if(!Array.isArray(d.cosm.usa.emotes))d.cosm.usa.emotes=[];
  if(!d.cosm.usa.tabuleiro||typeof d.cosm.usa.tabuleiro!=='object')d.cosm.usa.tabuleiro={};
  for(const k of ['decks','diarios'])if(!Array.isArray(d[k]))d[k]=[];
  if(!d.vigiaFeira||typeof d.vigiaFeira!=='object'||Array.isArray(d.vigiaFeira))d.vigiaFeira={};
  if(!d.v10)d.v10=1;
  if(typeof d.v10em!=='number')d.v10em=Date.now();
  return d;
}
let saveTimer=0;
function save(){clearTimeout(saveTimer);saveTimer=setTimeout(saveNow,300);}
function saveNow(){clearTimeout(saveTimer);try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){}}
function loadLS(){try{const raw=localStorage.getItem(KEY);if(!raw)return null;const d=JSON.parse(raw);return validState(d)?fixState(d):null;}catch(e){return null;}}

/* ---------- economia ---------- */
/* v10: chave do dia pelo calendário local (AAAA-MM-DD) e diário da economia dos últimos 14 dias */
function diaChave(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
/* t: 'c' criado, 'q' queimado, 'pg' Brasas ganhas, 'pq' Brasas gastas */
function ecoDia(t,k,n){
  if(!s||!s.eco||!n)return;
  const E=s.eco;if(!E.dia||typeof E.dia!=='object')E.dia={};
  const d=diaChave();let D=E.dia[d];
  if(!D)D=E.dia[d]={c:{},q:{}};
  const ks=Object.keys(E.dia);if(ks.length>14){ks.sort();while(ks.length>14){const k=ks.shift();if(k!==d)delete E.dia[k];}}
  const o=D[t]||(D[t]={});o[k]=(o[k]||0)+n;
}
function ganhar(n,fonte){n=Math.max(0,Math.round(n));if(!n)return 0;s.grao+=n;s.eco.criado[fonte]+=n;ecoDia('c',fonte,n);return n;}
/* ralos antigos continuam em eco.queimado; os novos (ascensao, vila, causos, mascate) vão para eco.ralos */
function gastar(n,ralo){n=Math.round(n);s.grao-=n;if(ralo in s.eco.queimado)s.eco.queimado[ralo]+=n;else{if(!s.eco.ralos)s.eco.ralos={};s.eco.ralos[ralo]=(s.eco.ralos[ralo]||0)+n;}ecoDia('q',ralo,n);}
const somaRalos=()=>s.eco.ralos?sum(s.eco.ralos):0;
function queimadoVoce(){const q=s.eco.queimado;return q.pacotes+q.melhorias+q.pressa+q.taxasVoce+(q.torneio||0)+somaRalos();}
function ecoTotais(){const c=sum(s.eco.criado),q=sum(s.eco.queimado)+somaRalos();return{c,q,qv:queimadoVoce(),circ:s.grao+s.mercado.poolRobos};}
function ecoInvariante(){const t=ecoTotais();return s.grao+s.mercado.poolRobos===t.c+s.eco.reservaRobos-t.q;}
function ecoSample(){const t=ecoTotais();s.eco.hist.push({c:t.c,q:t.q,qv:t.qv});if(s.eco.hist.length>40)s.eco.hist.splice(0,s.eco.hist.length-40);
  if(window.__CG_DEBUG&&!ecoInvariante())console.warn('invariante da economia quebrou');}
function ganharPo(n){s.po+=n;s.eco.poGanho+=n;ecoDia('pg','po',n);}
function gastarPo(n){if(!n)return;s.po-=n;s.eco.poGasto+=n;ecoDia('pq','po',n);}
/* v10: nomes do tema (12-tema.js) com o padrão Assombro se o tema não carregou */
const _TM=()=>typeof TEMA!=='undefined'&&TEMA?TEMA:null;
const MOEDA_CAPS=()=>{const T=_TM();return T&&T.moeda&&T.moeda.caps||'VINTÉNS';};
const MOEDA_PL=()=>{const T=_TM();return T&&T.moeda&&T.moeda.plural||'Vinténs';};
const PO_NOME=n=>{const T=_TM();const p=T&&T.po||{nome:'Brasa',plural:'Brasas'};return n===1?p.nome:p.plural;};

/* ---------- arenas e troféus ---------- */
function arenaMax(){let a=1;for(const A of ARENAS)if(s.trofeusMax>=A.trof)a=A.n;return a;}
function arenaDef(n){return ARENAS[(n||arenaMax())-1];}
function pisoTrofeus(){return arenaDef().trof;}
function mudarTrofeus(delta){
  const antes=arenaMax();
  s.trofeus=Math.max(pisoTrofeus(),s.trofeus+delta);
  s.trofeusMax=Math.max(s.trofeusMax,s.trofeus);
  const depois=arenaMax();
  return depois>antes?depois:0;
}
function poolCartas(rar,arena){const a=arena||arenaMax();return COLECAO.filter(c=>c.rar===rar&&c.arena<=a);}
function novasDaArena(n){return COLECAO.filter(c=>c.arena===n);}

/* ---------- coleção ---------- */
const temCarta=id=>!!s.cards[id];
const lvlOf=id=>s.cards[id]?s.cards[id].lvl:1;
function darCarta(id,fonte){
  let nova=false;
  if(!s.cards[id]){s.cards[id]={lvl:1,copias:0};nova=true;}else s.cards[id].copias++;
  if(fonte)s.eco.cartas[fonte]++;
  return nova;
}
function custoMelhora(id){
  const c=s.cards[id];if(!c||c.lvl>=5)return null;
  const rar=CARD[id].rar,[cop,g]=UPG[rar][c.lvl-1];
  const usa=Math.min(c.copias,cop),falta=cop-usa;
  return {cop,usa,falta,po:falta*PO_CRIAR[rar],grao:g,prox:c.lvl+1};
}
function podeMelhorar(id){const k=custoMelhora(id);return !!k&&s.grao>=k.grao&&s.po>=k.po;}
function podeMelhorarSoCopias(id){const k=custoMelhora(id);return !!k&&k.falta===0&&s.grao>=k.grao;}
function textoMelhora(k){
  if(!k)return 'Nível máximo';
  const parts=[];
  if(k.usa>0)parts.push(k.usa+(k.usa>1?' cópias':' cópia'));
  if(k.po>0)parts.push(fmt(k.po)+' '+PO_NOME(k.po));
  parts.push(fmt(k.grao)+' '+MOEDA_CAPS());
  return 'Melhorar ('+parts.join(' + ')+')';
}
function fazerMelhora(id){
  if(!podeMelhorar(id))return null;
  const k=custoMelhora(id),c=s.cards[id];
  c.copias-=k.usa;gastarPo(k.po);gastar(k.grao,'melhorias');
  const de=c.lvl;c.lvl++;s.eco.cartas.melhoria+=k.usa;
  missaoEv('melhoria',1);ecoSample();save();
  return {de,para:c.lvl};
}
function fazerQueima(id,n){
  const c=s.cards[id];if(!c||n<1||n>c.copias)return 0;
  // v10: Forno de Brasa (Casa de Farinha Nv 3+): +10% de Brasas, arredondado para baixo
  c.copias-=n;const po=Math.floor(n*PO_QUEIMA[CARD[id].rar]*(s.vila&&s.vila.mata>=3?1.1:1));ganharPo(po);s.eco.cartas.queimadas+=n;
  missaoEv('queimar',n);save();return po;
}
function podeCriar(id){return !temCarta(id)&&CARD[id].arena<=arenaMax()&&s.po>=PO_CRIAR[CARD[id].rar];}
function fazerCriar(id){if(!podeCriar(id))return false;const p=PO_CRIAR[CARD[id].rar];gastarPo(p);s.cards[id]={lvl:1,copias:0};s.eco.cartas.criacao++;save();return true;}

/* ---------- deck ---------- */
const naDeck=id=>s.deck.cartas.filter(x=>x===id).length;
const maxNoDeck=id=>CARD[id].rar==='lendaria'?1:2;
function problemasDeck(){
  const p=[];const n=s.deck.cartas.length;
  if(n<20)p.push('Faltam '+(20-n)+(20-n>1?' cartas':' carta'));
  if(n>20)p.push('Sobram '+(n-20)+(n-20>1?' cartas':' carta'));
  const cnt={};for(const id of s.deck.cartas)cnt[id]=(cnt[id]||0)+1;
  for(const id in cnt){if(CARD[id].rar==='lendaria'&&cnt[id]>1)p.push('Lendária: só 1');else if(cnt[id]>2)p.push('Máx. 2 cópias');if(!temCarta(id))p.push('Carta que você não tem');}
  return [...new Set(p)];
}
const deckOk=()=>problemasDeck().length===0;
function podePorNoDeck(id){return temCarta(id)&&!CARD[id].ficha&&naDeck(id)<maxNoDeck(id);}
/* "Pôr no deck": entra 1 cópia, sai 1 da carta de custo mais próximo */
function porNoDeck(id){
  if(!podePorNoDeck(id))return null;
  const antes=s.deck.cartas.slice();
  let sai=null;
  if(s.deck.cartas.length>=20){
    const cnt={};for(const x of s.deck.cartas)cnt[x]=(cnt[x]||0)+1;
    const cand=Object.keys(cnt).filter(x=>x!==id);
    const cu=CARD[id].custo;
    cand.sort((a,b)=>Math.abs(CARD[a].custo-cu)-Math.abs(CARD[b].custo-cu)||rIdx(CARD[a].rar)-rIdx(CARD[b].rar)||cnt[b]-cnt[a]||(a<b?-1:a>b?1:0));
    sai=cand[0];if(!sai)return null;
    s.deck.cartas.splice(s.deck.cartas.indexOf(sai),1);
  }
  s.deck.cartas.push(id);save();
  return {sai,antes};
}

/* ---------- pacotes ---------- */
function sorteiaRar(linha){
  const o=ODDS[linha];let r=rnd()*100,last=null;
  for(const k of RARS){if(o[k]==null)continue;last=k;if(r<o[k])return k;r-=o[k];}
  return last;
}
function sorteiaCarta(rar){return pick(poolCartas(rar)).id;}
function sorteiaPacote(tipo){
  const P=PACKS[tipo];const rars=P.slots.map(sorteiaRar);
  const temE=rars.some(r=>rIdx(r)>=3),temL=rars.includes('lendaria');
  if(!temL&&s.pity.lendaria>=39)rars[4]='lendaria';
  else if(!temE&&s.pity.epica>=9)rars[4]='epica';
  const e2=rars.some(r=>rIdx(r)>=3),l2=rars.includes('lendaria');
  s.pity.epica=e2?0:s.pity.epica+1;
  s.pity.lendaria=l2?0:s.pity.lendaria+1;
  return rars.map(sorteiaCarta);
}
function infoCopias(id){
  const c=s.cards[id];if(!c)return null;
  const k=custoMelhora(id);
  return {lvl:c.lvl,copias:c.copias,precisa:k?k.cop:0,max:!k,pode:!!k&&c.copias>=k.cop};
}
/* rola, entrega e salva ANTES da animação */
function abrirPacote(tipo,comprar){
  const P=PACKS[tipo];
  if(comprar){if(s.grao<P.preco)return null;gastar(P.preco,'pacotes');}
  else{if((s.pacotes[tipo]||0)<=0)return null;s.pacotes[tipo]--;}
  let ids,rig=false;
  if(tipo==='semente'&&!comprar&&!s.primeiroPacote){ids=TUT.pacote.slice();rig=true;s.primeiroPacote=true;}
  else ids=sorteiaPacote(tipo);
  const cards=ids.map(id=>{const nova=darCarta(id,'pacotes');return {id,nova,rar:CARD[id].rar,n:1};});
  for(const c of cards)c.info=infoCopias(c.id);
  s.stats.pacotes++;missaoEv('pacote',1);ecoSample();saveNow();
  return {kind:'pack',tipo,cards,rig,best:melhorRar(cards)};
}
const melhorRar=cards=>cards.reduce((b,c)=>rIdx(c.rar)>rIdx(b)?c.rar:b,'comum');

/* ---------- baús ---------- */
function bauEstado(b){if(!b)return null;if(b.estado==='abrindo'&&Date.now()>=b.fim){b.estado='pronto';b.fim=null;save();}return b.estado;}
const algumAbrindo=()=>s.baus.some(b=>b&&bauEstado(b)==='abrindo');
function tempoBau(b){return b.tut?10:BAUS[b.tipo].tempo;}
function restanteBau(b){const e=bauEstado(b);if(e==='abrindo')return Math.max(0,(b.fim-Date.now())/1000);if(e==='trancado')return tempoBau(b);return 0;}
/* GRÃO que o baú pode dar no máximo (um Pacote Semente conta pelo preço dele) */
function valorBau(b){
  if(b.tut)return TUT.bau.grao;
  const B=BAUS[b.tipo],A=arenaDef(b.arena);
  return Math.round(B.grao[1]*A.mult)+(B.pacote?PACKS.semente.preco:0);
}
/* abrir agora custa sempre mais do que o baú paga: a pressa é um ralo de verdade */
function custoPressa(b){return valorBau(b)+Math.max(5,Math.ceil(restanteBau(b)/3));}
function darBau(){
  const i=s.baus.indexOf(null);if(i<0)return null;
  let tipo;
  if(rnd()<0.02)tipo='lendario';
  else{tipo=BAU_CICLO[s.bauCiclo%BAU_CICLO.length];s.bauCiclo++;}
  s.baus[i]={tipo,estado:'trancado',fim:null,arena:arenaMax()};save();
  return {i,tipo};
}
function darBauTutorial(){s.baus[0]={tipo:'madeira',estado:'abrindo',fim:Date.now()+10000,arena:1,tut:true};save();}
function destrancar(i){const b=s.baus[i];if(!b||bauEstado(b)!=='trancado'||algumAbrindo())return false;b.estado='abrindo';b.fim=Date.now()+tempoBau(b)*1000;save();return true;}
function faixaBau(tipo,arena){
  const B=BAUS[tipo],A=arenaDef(arena);
  return {cartas:B.cartas(arena),g0:Math.round(B.grao[0]*A.mult),g1:Math.round(B.grao[1]*A.mult)};
}
function abrirBau(i,pagar){
  const b=s.baus[i];if(!b)return null;
  const e=bauEstado(b);
  if(e!=='pronto'){if(!pagar)return null;const k=custoPressa(b);if(s.grao<k)return null;gastar(k,'pressa');}
  let ids,grao,pacote=false;
  if(b.tut){ids=TUT.bau.cartas.slice();grao=TUT.bau.grao;}
  else{
    const B=BAUS[b.tipo],A=arenaDef(b.arena),n=B.cartas(b.arena);
    const rars=[];for(let k=0;k<n;k++)rars.push(sorteiaRar('normal'));
    if(B.garantia)rars[n-1]=sorteiaRar(B.garantia);
    ids=rars.map(r=>pick(poolCartas(r,b.arena)).id);
    grao=Math.round(ri(B.grao[0],B.grao[1])*A.mult);
    if(B.pacote){pacote=true;s.pacotes.semente++;}
  }
  const grupos=[];const gi={};
  for(const id of ids){const nova=darCarta(id,'baus');if(gi[id])gi[id].n++;else{gi[id]={id,n:1,nova,rar:CARD[id].rar};grupos.push(gi[id]);}}
  for(const g of grupos)g.info=infoCopias(g.id);
  ganhar(grao,'baus');
  s.baus[i]=null;s.stats.baus++;missaoEv('bau',1);ecoSample();saveNow();
  return {kind:'chest',tipo:b.tipo,grao,cards:grupos,pacote,best:melhorRar(grupos)};
}

/* ---------- missões ---------- */
/* v4: missões de um modo só entram no sorteio quando o modo já abriu */
function modoLiberado(m){
  if(m==='treino')return !!s.tutorialFeito;
  if(m==='desafio')return arenaMax()>=DESAFIO.arenaMin;
  if(m==='torneio')return arenaMax()>=TORNEIO.arenaMin;
  return true;
}
const missaoLiberada=m=>!m.req||modoLiberado(m.req);
function garantirMissoes(){
  const d=hoje();
  const modos=garantirModos(); // v4: a virada do dia dos modos anda junto com a das missões
  if(s.missoes&&s.missoes.dia===d)return modos;
  let ids;
  if(d===new Date(s.criadoEm).toDateString())ids=MISSOES_DIA1.slice();
  else{
    const h=hashStr(d);ids=[];
    ['batalha','progresso','economia'].forEach((g,k)=>{const pool=MISSOES.filter(m=>m.g===g&&!ids.includes(m.id)&&missaoLiberada(m));const alt=MISSOES.filter(m=>m.g==='progresso'&&!ids.includes(m.id)&&missaoLiberada(m));const p=pool.length?pool:alt;ids.push(p[(h>>>(k*5))%p.length].id);});
  }
  s.missoes={dia:d,lista:ids.map(id=>({id,prog:0,alvo:MISSAO[id].alvo,pego:false})),bonusPego:false,trocou:false};
  save();return true;
}
let missaoMute=false; // tutorial não conta
function missaoEv(ev,n){
  if(missaoMute||!s.missoes)return;
  for(const m of s.missoes.lista){if(m.pego)continue;if(MISSAO[m.id].ev===ev)m.prog=Math.min(m.alvo,m.prog+n);}
  save();
}
/* v10: Troca de missão da Fogueira (Nv 3+): uma troca extra por dia, depois da troca de sempre; o prêmio não muda */
function podeTrocaVila(){return !!(s.missoes&&s.missoes.trocou&&s.vila&&s.vila.fogueira>=3&&!(s.missaoTroca&&s.missaoTroca.dia===hoje()&&s.missaoTroca.usada));}
function trocarMissao(i){
  if(s.missoes.trocou){
    if(!podeTrocaVila())return false;const m=s.missoes.lista[i];if(!m||m.pego)return false;
    const rec=m.rec||MISSAO[m.id].rec,g=MISSAO[m.id].g,J=JSON.stringify(rec);
    const pool=MISSOES.filter(x=>x.g===g&&!s.missoes.lista.some(y=>y.id===x.id)&&missaoLiberada(x));if(!pool.length)return false;
    const igual=pool.filter(x=>JSON.stringify(x.rec)===J);
    const nid=pick(igual.length?igual:pool).id;
    s.missoes.lista[i]={id:nid,prog:0,alvo:MISSAO[nid].alvo,pego:false};
    if(JSON.stringify(MISSAO[nid].rec)!==J)s.missoes.lista[i].rec=rec;
    s.missaoTroca={dia:hoje(),usada:true};save();return true;
  }
  const m=s.missoes.lista[i];if(!m||m.pego)return false;
  const g=MISSAO[m.id].g;const pool=MISSOES.filter(x=>x.g===g&&!s.missoes.lista.some(y=>y.id===x.id)&&missaoLiberada(x));
  if(!pool.length)return false;
  const nid=pick(pool).id;s.missoes.lista[i]={id:nid,prog:0,alvo:MISSAO[nid].alvo,pego:false};s.missoes.trocou=true;save();return true;
}
function pegarMissao(i){
  const m=s.missoes.lista[i];if(!m||m.pego||m.prog<m.alvo)return null;
  m.pego=true;const r=m.rec||MISSAO[m.id].rec;
  if(r.grao)ganhar(r.grao,'missoes');if(r.po)ganharPo(r.po);
  let bonus=false;
  if(!s.missoes.bonusPego&&s.missoes.lista.every(x=>x.pego)){s.missoes.bonusPego=true;s.pacotes.semente++;bonus=true;}
  ecoSample();save();return {rec:r,bonus};
}

/* ---------- trilha ---------- */
const trilhaPegavel=st=>s.trofeusMax>=st.t&&!s.trilhaPega.includes(st.t);
function pegarTrilha(t){
  const st=TRILHA.find(x=>x.t===t);if(!st||!trilhaPegavel(st))return null;
  s.trilhaPega.push(t);
  if(st.grao)ganhar(st.grao,'trilha');
  if(st.po)ganharPo(st.po);
  if(st.pacotes)for(const k in st.pacotes)s.pacotes[k]+=st.pacotes[k];
  ecoSample();save();return st;
}
function premioTxt(st){
  const p=[];
  if(st.arena)p.push('Arena '+st.arena+' (abre sozinha)');
  if(st.grao)p.push(st.grao+' '+MOEDA_PL());
  if(st.pacotes){if(st.pacotes.semente)p.push(st.pacotes.semente>1?st.pacotes.semente+' × '+PACKS.semente.nome:PACKS.semente.nome);if(st.pacotes.colheita)p.push(PACKS.colheita.nome);}
  if(st.po)p.push(st.po+' '+PO_NOME(st.po));
  return p.join(' + ');
}

/* ---------- partida em andamento (fechar a aba no meio conta como desistência) ---------- */
/* só Arena e Torneio marcam: Treino e Desafio não perdem nada se a aba fechar */
function marcarPartida(arena,modo){s.partida={arena,t:Date.now(),modo:modo||'arena'};saveNow();}
function cobrarPartidaAbandonada(){
  const p=s.partida;if(!p)return null;
  if(p.modo==='torneio'){
    // a etapa conta como derrota: o torneio acaba e paga o prêmio das vitórias até aqui
    s.partida=null;let premio=null;if(s.torneio.ativo)premio=encerrarTorneio();
    saveNow();return {torneio:true,perdeu:0,premio};
  }
  s.partida=null;s.stats.derrotas++;
  const antes=s.trofeus;mudarTrofeus(arenaMax()===1?0:-15);
  ecoSample();saveNow();
  return {perdeu:antes-s.trofeus};
}

/* ---------- v4: modos (Desafio do Dia, Torneio da Feira, Treino) ---------- */
/* número do dia pelo calendário local (estável no horário de verão) */
function diaNum(d){d=d||new Date();return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5);}
/* regra e rival do Desafio do dia: as 11 regras giram a cada 11 dias, nunca a mesma em dois dias seguidos */
function desafioDoDia(d){const n=diaNum(d);const G=REGRAS[((n*4)%11+11)%11];return {dia:n,regra:G.id,rival:DESAFIO.rivais[((n*3)%8+8)%8],nomeRegra:G.nome,txt:G.txt};}
/* virada do dia dos modos (junto de garantirMissoes); devolve true se mudou algo */
function garantirModos(){
  const d=hoje();let mudou=false;
  if(s.desafio.dia!==d){s.desafio={dia:d,venceu:false,tentativas:0,total:s.desafio.total||0};mudou=true;}
  if(s.torneio.dia!==d){s.torneio.dia=d;s.torneio.entradas=0;mudou=true;} // um torneio já começado (ativo) continua
  if(mudou)save();
  return mudou;
}
/* por que não dá para entrar no Torneio agora (null = pode) */
function motivoTorneio(){
  if(arenaMax()<TORNEIO.arenaMin)return 'Abre na Arena '+TORNEIO.arenaMin+' ('+ARENAS[TORNEIO.arenaMin-1].trof+' troféus).';
  if(s.torneio.ativo)return 'Você já está numa peleja.';
  if(s.torneio.entradas>=TORNEIO.maxDia)return 'Volte amanhã: '+TORNEIO.maxDia+' pelejas por dia';
  if(s.grao<TORNEIO.taxa)return 'GRÃO insuficiente';
  return null;
}
/* paga a inscrição (queimada, conta na Economia como "torneio") e abre a chave */
function entrarTorneio(){
  garantirModos();
  const m=motivoTorneio();if(m)return {ok:false,motivo:m};
  gastar(TORNEIO.taxa,'torneio');
  s.torneio.entradas++;s.torneio.jogados++;
  s.torneio.ativo={etapa:0,vitorias:0,hp:20,desde:Date.now()};
  ecoSample();saveNow();
  return {ok:true,ativo:s.torneio.ativo};
}
/* fecha o torneio e entrega o prêmio pelas vitórias (0..3); devolve o prêmio com as vitórias */
function encerrarTorneio(){
  const a=s.torneio.ativo;if(!a)return null;
  const v=clamp(a.vitorias|0,0,TORNEIO.premios.length-1),P=TORNEIO.premios[v];
  if(P.po)ganharPo(P.po);
  if(P.pacotes)for(const k in P.pacotes)s.pacotes[k]=(s.pacotes[k]||0)+P.pacotes[k];
  if(P.faixa)s.torneio.titulos++;
  s.torneio.melhor=Math.max(s.torneio.melhor||0,v);
  s.stats.torneios++;s.torneio.ativo=null;
  ecoSample();saveNow();
  return Object.assign({vitorias:v,campeao:v>=TORNEIO.etapas.length},P);
}
const premioTorneioTxt=P=>{const p=[];if(P.pacotes){if(P.pacotes.semente)p.push(PACKS.semente.nome);if(P.pacotes.colheita)p.push(PACKS.colheita.nome);}if(P.po)p.push(P.po+' '+PO_NOME(P.po));if(P.faixa)p.push('Fita da Peleja');return p.join(' + ');};
/* arena "de casa" de um rival (os rivais da feira usam a arena máxima do jogador) */
const arenaDoRival=id=>(ARENAS.find(A=>A.rival===id)||{n:arenaMax()}).n;
/* rivais que dá para escolher no Treino */
function rivaisTreino(){
  const l=ARENAS.filter(A=>A.n<=arenaMax()).map(A=>A.rival);
  if(modoLiberado('torneio'))l.push(...RIVAIS_FEIRA);
  return l;
}
/* regras já vistas num Desafio (o Treino pode usar) */
const regrasVistas=()=>REGRAS.filter(r=>s.codex&&s.codex.regras[r.id]).map(r=>r.id);
/* milissegundos até a próxima regra do Desafio (meia-noite local) */
function msAteAmanha(){const n=new Date();const m=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1);return m-n;}

/* ---------- GRÃO das partidas (limite diário) ---------- */
function pagarPartida(n){
  const d=hoje();if(s.graoPartidasHoje.dia!==d)s.graoPartidasHoje={dia:d,total:0};
  const pode=Math.max(0,CAP_DIA-s.graoPartidasHoje.total);const g=Math.min(n,pode);
  s.graoPartidasHoje.total+=g;ganhar(g,'vitorias');
  return {g,cap:g<n};
}

/* ---------- mercado ---------- */
function preco(id){
  const m=s.mercado.c[id],R=MERC[CARD[id].rar];
  return Math.max(2,Math.round(R.base*m.hype*clamp(Math.sqrt((R.T+1)/(m.oferta+1)),0.5,3)));
}
const lance=id=>Math.max(2,Math.floor(preco(id)*LANCE_FRAC));
const liberadaNoMercado=id=>CARD[id].arena<=arenaMax();
const taxa=v=>Math.max(1,Math.round(v*0.10));
function feedPush(t){s.mercado.feed.push(t);if(s.mercado.feed.length>8)s.mercado.feed.splice(0,s.mercado.feed.length-8);}
function mercadoInitHist(){for(const id in s.mercado.c){const m=s.mercado.c[id];if(!m.hist.length)m.hist.push(preco(id));}}
function comprarCarta(id){
  const m=s.mercado.c[id];const p=preco(id);
  if(m.oferta<=0||s.grao<p||!liberadaNoMercado(id))return null;
  s.grao-=p;m.oferta--;const f=taxa(p);
  s.mercado.poolRobos+=p-f;s.eco.queimado.taxasVoce+=f;ecoDia('q','taxasVoce',f);
  const nova=darCarta(id,null);s.eco.cartas.compradas++;
  feedPush('Você comprou '+CARD[id].nome+' por '+fmt(p)+' '+MOEDA_CAPS());
  missaoEv('negocio',1);ecoSample();save();
  return {p,f,nova};
}
function venderCarta(id){
  const c=s.cards[id];if(!c||c.copias<1)return null;
  const b=lance(id);if(s.mercado.poolRobos<b)return null;
  const f=taxa(b);
  s.mercado.poolRobos-=b;s.grao+=b-f;s.eco.queimado.taxasVoce+=f;ecoDia('q','taxasVoce',f);
  c.copias--;s.mercado.c[id].oferta++;s.eco.cartas.vendidas++;
  feedPush('Você vendeu '+CARD[id].nome+' por '+fmt(b)+' '+MOEDA_CAPS());
  missaoEv('negocio',1);ecoSample();save();
  return {b,f,liq:b-f};
}
function mercadoTick(){
  const M=s.mercado;
  for(const c of COLECAO){
    const id=c.id,m=M.c[id],R=MERC[c.rar];
    m.hype=clamp(m.hype+(1-m.hype)*0.05+(rnd()*0.08-0.04),0.6,1.6);
    if(rnd()<R.q){
      const pc=clamp(0.5*m.hype*m.oferta/R.T,0.05,0.95);
      const robo=pick(ROBOS);
      if(m.oferta>0&&M.poolRobos>=1000&&rnd()<pc){
        // negócio entre robôs: o GRÃO só troca de mão entre eles (não cria nem queima)
        const p=preco(id);m.oferta--;
        feedPush(robo+' (feirante) comprou '+c.nome+' por '+fmt(p)+' '+MOEDA_CAPS());
      }else{m.oferta++;feedPush(robo+' (feirante) anunciou '+c.nome);}
    }
    m.hist.push(preco(id));if(m.hist.length>24)m.hist.splice(0,m.hist.length-24);
  }
  // v10: Rede de Olho (Ancoradouro Nv 3): histórico próprio e aviso de preço; não usa rnd
  if(s.vigiaFeira&&typeof vigiaTick==='function')vigiaTick();
}
function mercadoTicks(n){for(let i=0;i<n;i++)mercadoTick();}
function mercadoCatchUp(){
  const now=Date.now(),el=now-s.mercado.ultimoTick;
  const n=Math.min(30,Math.floor(el/TICK_MS));
  if(n>0)mercadoTicks(n);
  s.mercado.ultimoTick=n>=30?now:s.mercado.ultimoTick+n*TICK_MS;
  return n;
}
/* variação arredondada para exibir: seta e cor só quando o número arredondado não é zero */
function varHTML(v,cls){const r=Math.round(v*100);return r>0?`<${cls||'span'} class="num up">▲ +${r}%</${cls||'span'}>`:r<0?`<${cls||'span'} class="num down">▼ ${r}%</${cls||'span'}>`:`<${cls||'span'} class="num muted">0%</${cls||'span'}>`;}
/* chance média por pacote CONTANDO as garantias (cadeia de Markov nos dois contadores) */
const _oddsG={};
function chanceComGarantia(tipo){
  if(_oddsG[tipo])return _oddsG[tipo];
  let nE=1,nL=1;
  for(const l of PACKS[tipo].slots){const o=ODDS[l];nE*=1-((o.epica||0)+(o.lendaria||0))/100;nL*=1-(o.lendaria||0)/100;}
  const pL=1-nL,pE=nL-nE;
  const mk=()=>{const a=[];for(let e=0;e<10;e++)a.push(new Float64Array(40));return a;};
  let d=mk();d[0][0]=1;let rE=0,rL=0;
  for(let it=0;it<800;it++){
    const n=mk();let fe=0,fl=0;
    for(let e=0;e<10;e++)for(let l=0;l<40;l++){const w=d[e][l];if(!w)continue;
      let qL=pL,qE=pE,qN=1-pL-pE;
      if(l>=39){qL=1;qE=0;qN=0;}else if(e>=9){qE+=qN;qN=0;}
      fl+=w*qL;fe+=w*(qL+qE);
      n[0][0]+=w*qL;n[0][Math.min(39,l+1)]+=w*qE;n[Math.min(9,e+1)][Math.min(39,l+1)]+=w*qN;}
    d=n;rE=fe;rL=fl;
  }
  return _oddsG[tipo]={e:rE,l:rL};
}
const pctBR=(x,dig)=>(x*100).toFixed(dig==null?1:dig).replace('.',',')+'%';
function variacao(id){const h=s.mercado.c[id].hist;if(h.length<2)return 0;const a=h[Math.max(0,h.length-13)],b=h[h.length-1];return a?(b-a)/a:0;}
function mediaRar(rar,back){
  const cs=COLECAO.filter(c=>c.rar===rar);let t=0;
  for(const c of cs){const h=s.mercado.c[c.id].hist;t+=back?(h[Math.max(0,h.length-13)]||preco(c.id)):preco(c.id);}
  return t/cs.length;
}

