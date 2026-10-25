/* ===================== v10: RALOS (Ascensão, Vila das Lendas, Livro de Causos, Mascate) =====================
   Só lógica e constantes. Tudo que custa Vinténs passa por gastar() (20-core), então ecoInvariante() fecha
   depois de cada ação. Nada aqui cria moeda (Δcriado = 0), nada muda ATK, vida, palavras-chave ou energia,
   e nada usa rnd() (as batalhas e as simulações com semente continuam iguais). */

/* ---------- Ascensão (cosmética, por carta) ---------- */
const ASC_NV_MIN=[3,4,5];
const ASC_CUSTO={ // [Vinténs, cópias] para os tiers I, II, III
 comum:[[60,2],[150,4],[300,6]],
 incomum:[[90,2],[220,3],[450,4]],
 rara:[[150,1],[350,2],[700,2]],
 epica:[[250,1],[550,1],[1000,1]],
 lendaria:[[400,0],[800,1],[1500,1]]
};
const ASC_NOME=()=>(_TM()&&_TM().asc&&_TM().asc.tiers)||['Desperta','Assombrosa','Lenda Viva'];
const ASC_GLIFO=()=>(_TM()&&_TM().asc&&_TM().asc.glifo)||['☾','☾☾','✦'];
const ascDe=id=>(s.cards[id]&&s.cards[id].asc)|0;
/* o que o palco e o retrato devem mostrar (só o lado do jogador; os rivais nunca usam) */
const ascVisivel=id=>{const c=s&&s.cards[id];return c&&!c.ascOff?(c.asc|0):0;};
function custoAscensao(id){
  const c=s.cards[id],C=CARD[id];if(!c||!C||C.ficha)return null;
  const tier=c.asc|0;if(tier>=3)return null;
  const [v,cop]=ASC_CUSTO[C.rar][tier];
  const usa=Math.min(c.copias,cop),falta=cop-usa;
  return {tier:tier+1,grao:v,cop,usa,falta,po:falta*PO_CRIAR[C.rar],nvMin:ASC_NV_MIN[tier],nvOk:c.lvl>=ASC_NV_MIN[tier]};
}
function podeAscender(id){
  if(!s.cards[id])return {ok:false,motivo:'Você ainda não tem esta carta.'};
  const k=custoAscensao(id);if(!k)return {ok:false,motivo:'Já é '+ASC_NOME()[2]+'.'};
  if(!k.nvOk)return {ok:false,motivo:'Chegue ao Nv '+k.nvMin+'.',k};
  if(s.grao<k.grao)return {ok:false,motivo:'Faltam '+fmt(k.grao-s.grao)+' '+MOEDA_PL()+'.',k,falta:{grao:k.grao-s.grao}};
  if(s.po<k.po)return {ok:false,motivo:'Faltam '+fmt(k.po-s.po)+' '+PO_NOME(2)+' (ou '+(k.falta)+(k.falta>1?' cópias':' cópia')+').',k,falta:{po:k.po-s.po}};
  return {ok:true,k};
}
function fazerAscensao(id){
  const p=podeAscender(id);if(!p.ok)return p;
  const k=p.k,c=s.cards[id];
  c.copias-=k.usa;gastarPo(k.po);gastar(k.grao,'ascensao');
  s.eco.cartas.ascensao=(s.eco.cartas.ascensao||0)+k.usa;
  c.asc=k.tier;
  ecoSample();save();
  return {ok:true,tier:k.tier,k};
}
function alternarFormaBasica(id){const c=s.cards[id];if(!c||!c.asc)return false;if(c.ascOff)delete c.ascOff;else c.ascOff=true;save();return true;}
const totalAscensoes=()=>Object.values(s.cards).reduce((a,c)=>a+((c.asc|0)),0);

/* ---------- Vila das Lendas ---------- */
const VILA_CUSTO=[120,250,450,750,1200];
const VILA_ORDEM=['fogueira','sertao','mata','aguas','noite'];
const VILA_PREDIOS={
 fogueira:{reino:'neutro',arena:1,nome:'Fogueira',ic:'fogueira'},
 sertao:{reino:'milharal',arena:1,nome:'Torre do Vigia',ic:'torre'},
 mata:{reino:'pomar',arena:2,nome:'Casa de Farinha',ic:'casa'},
 aguas:{reino:'brejo',arena:3,nome:'Ancoradouro',ic:'barco'},
 noite:{reino:'pasto',arena:1,nome:'Mirante da Lua',ic:'lua'}
};
/* o que cada nível dá: t = texto curto; d = explicação; cosm = cosmético liberado */
const VILA_PREMIO={
 fogueira:[
  {t:'A Vila abre + emote "Eita!"',cosm:['emote-eita']},
  {t:'+1 deck salvo (2)',d:'Guarde mais um deck pronto e troque com um toque.'},
  {t:'Troca de missão',d:'Uma troca extra por dia, depois da troca de sempre. O prêmio da missão não muda.',perk:true},
  {t:'+1 deck salvo (3)',d:'Três decks guardados.'},
  {t:'Visual "Andarilho da Fogueira" + título "Dono da Fogueira"',cosm:['heroi-fogueira','titulo-fogueira']}],
 sertao:[
  {t:'Emote "Oxente!"',cosm:['emote-oxente']},
  {t:'Verso de carta "Couro de Gibão"',cosm:['verso-gibao']},
  {t:'Olho do Vigia',d:'O Início mostra qual tesouro a próxima vitória traz.',perk:true},
  {t:'Tabuleiro "Sertão ao Luar" (Arena 1)',cosm:['tab-sertao-luar']},
  {t:'Título "Vigia do Sertão" + chapéu de couro',cosm:['titulo-vigia','acess-chapeu']}],
 mata:[
  {t:'Emote "Égua!"',cosm:['emote-egua']},
  {t:'Verso de carta "Folha de Bananeira"',cosm:['verso-bananeira']},
  {t:'Forno de Brasa',d:'+10% de Brasas ao queimar cartas na fogueira.',perk:true},
  {t:'Tabuleiro "Mata em Chuva" (Arena 2)',cosm:['tab-mata-chuva']},
  {t:'Título "Mateiro" + bornal',cosm:['titulo-mateiro','acess-bornal']}],
 aguas:[
  {t:'Emote "Vixe!"',cosm:['emote-vixe']},
  {t:'Verso de carta "Escama de Rio"',cosm:['verso-escama']},
  {t:'Rede de Olho',d:'Vigie até 5 cartas da Feira: histórico de 30 tiques e aviso quando o preço cai abaixo da sua marca.',perk:true},
  {t:'Tabuleiro "Igapó Cheio" (Arena 3)',cosm:['tab-igapo-cheio']},
  {t:'Título "Pescador de Lendas" + tarrafa',cosm:['titulo-pescador','acess-tarrafa']}],
 noite:[
  {t:'Emote "Uai!"',cosm:['emote-uai']},
  {t:'Verso de carta "Lençol de Visagem"',cosm:['verso-lencol']},
  {t:'Caderno de Batalha',d:'Guarda os Diários das últimas 5 partidas e põe um botão "Revanche" no resultado.',perk:true},
  {t:'Tabuleiro "Tapera em Névoa" (Arena 4)',cosm:['tab-tapera-nevoa']},
  {t:'Título "Guardião da Noite" + lanterna violeta',cosm:['titulo-noite','acess-lanterna']}]
};
const nivelVila=p=>(s.vila&&s.vila[p])|0;
function custoVila(p){const n=nivelVila(p);return n>=5?null:VILA_CUSTO[n];}
function podeVila(p){
  const P=VILA_PREDIOS[p];if(!P)return {ok:false,motivo:'Construção desconhecida.'};
  const n=nivelVila(p);if(n>=5)return {ok:false,motivo:'Nível máximo.'};
  if(arenaMax()<P.arena)return {ok:false,motivo:'Abre na Arena '+P.arena+'.',trava:'arena'};
  if(p!=='fogueira'){
    const f=nivelVila('fogueira');
    if(f<1)return {ok:false,motivo:'Acenda a Fogueira primeiro.',trava:'fogueira'};
    if(n+1>f+1)return {ok:false,motivo:'Suba a Fogueira para o Nv '+n+' primeiro.',trava:'fogueira'};
  }
  const c=VILA_CUSTO[n];
  if(s.grao<c)return {ok:false,motivo:'Faltam '+fmt(c-s.grao)+' '+MOEDA_PL()+'.',custo:c,falta:{grao:c-s.grao}};
  return {ok:true,custo:c};
}
function subirVila(p){
  const r=podeVila(p);if(!r.ok)return r;
  gastar(r.custo,'vila');s.vila[p]++;
  ecoSample();save();
  return {ok:true,nivel:s.vila[p],premio:VILA_PREMIO[p][s.vila[p]-1]};
}
const totalVila=()=>VILA_ORDEM.reduce((a,p)=>a+nivelVila(p),0);
const temOlhoDoVigia=()=>nivelVila('sertao')>=3;
const temRedeDeOlho=()=>nivelVila('aguas')>=3;
const temCaderno=()=>nivelVila('noite')>=3;

/* ---------- decks salvos (Fogueira) ---------- */
const decksMax=()=>1+(nivelVila('fogueira')>=2?1:0)+(nivelVila('fogueira')>=4?1:0);
function salvarDeck(k,nome){
  if(!(k>=0&&k<decksMax()))return {ok:false,motivo:'Esse espaço abre com a Fogueira.'};
  if(!Array.isArray(s.decks))s.decks=[];
  s.decks[k]={nome:String(nome||('Deck '+(k+1))).slice(0,24),cartas:s.deck.cartas.slice(),terrenos:s.deck.terrenos.slice(),t:Date.now()};
  for(let i=0;i<k;i++)if(s.decks[i]===undefined)s.decks[i]=null;
  save();return {ok:true};
}
function carregarDeck(k){
  const d=s.decks&&s.decks[k];if(!d||!(k<decksMax()))return {ok:false,motivo:'Espaço vazio.'};
  const cnt={};for(const id of d.cartas)cnt[id]=(cnt[id]||0)+1;
  for(const id in cnt){if(!CARD[id]||!temCarta(id))return {ok:false,motivo:'Falta uma carta desse deck na coleção.'};if(cnt[id]>maxNoDeck(id))return {ok:false,motivo:'Deck com cópias demais.'};}
  if(!Array.isArray(d.terrenos)||d.terrenos.length!==4||d.terrenos.some(t=>!TERRS.includes(t)))return {ok:false,motivo:'Terrenos inválidos.'};
  const antes={cartas:s.deck.cartas.slice(),terrenos:s.deck.terrenos.slice()};
  s.deck.cartas=d.cartas.slice();s.deck.terrenos=d.terrenos.slice();save();
  return {ok:true,antes};
}

/* ---------- Olho do Vigia (Torre do Vigia Nv 3) ---------- */
/* o tipo que darBau() dá na próxima vitória, se a sorte de 2% da Botija da Mãe-do-Ouro não cair */
function proximoTesouro(){return BAU_CICLO[s.bauCiclo%BAU_CICLO.length];}

/* ---------- Rede de Olho (Ancoradouro Nv 3) ---------- */
const VIGIA_MAX=5,VIGIA_HIST=30;
function vigiar(id,marca){
  if(!temRedeDeOlho())return {ok:false,motivo:'Abre com o Ancoradouro Nv 3.'};
  if(!CARD[id]||CARD[id].ficha)return {ok:false,motivo:'Carta desconhecida.'};
  const V=s.vigiaFeira;
  if(!V[id]&&Object.keys(V).length>=VIGIA_MAX)return {ok:false,motivo:'Você já vigia '+VIGIA_MAX+' cartas.'};
  const p=preco(id);
  V[id]=Object.assign(V[id]||{h:[p],avisou:false},{marca:Math.max(1,Math.round(marca||Math.round(p*0.9)))});
  save();return {ok:true};
}
function desvigiar(id){if(s.vigiaFeira[id]){delete s.vigiaFeira[id];save();return true;}return false;}
let vigiaAvisos=[];
function vigiaTick(){
  if(!temRedeDeOlho())return;
  for(const id in s.vigiaFeira){
    const w=s.vigiaFeira[id];if(!CARD[id]||!s.mercado.c[id]){delete s.vigiaFeira[id];continue;}
    const p=preco(id);if(!Array.isArray(w.h))w.h=[];w.h.push(p);if(w.h.length>VIGIA_HIST)w.h.splice(0,w.h.length-VIGIA_HIST);
    if(p<w.marca&&!w.avisou){w.avisou=true;vigiaAvisos.push({id,p});}
    else if(p>=w.marca)w.avisou=false;
  }
  if(vigiaAvisos.length&&typeof toast==='function'&&typeof UI!=='undefined'&&UI.started){
    for(const a of vigiaAvisos.splice(0))toast(`${typeof ic==='function'?ic('coin',14):''} Rede de Olho: <b>${escH(CARD[a.id].nome)}</b> caiu para <b class="num">${fmt(a.p)}</b> ${MOEDA_PL()}.`,{ms:4200});
  }
}

/* ---------- Caderno de Batalha (Mirante da Lua Nv 3) ---------- */
function guardarDiario(B){
  if(!B||B.tut||!temCaderno()||!Array.isArray(B.log))return false;
  if(!Array.isArray(s.diarios))s.diarios=[];
  s.diarios.unshift({t:Date.now(),rival:B.rival,modo:B.modo||'arena',res:B.result||null,rodada:B.round|0,arena:B.arena||1,log:B.log.slice(-60)});
  if(s.diarios.length>5)s.diarios.length=5;
  save();return true;
}

/* ---------- Livro de Causos ---------- */
const CAUSO_PRECO={comum:30,incomum:45,rara:70,epica:110,lendaria:160};
const FOLHETOS=['milharal','pomar','brejo','pasto','neutro'];
const paginasDe=reino=>COLECAO.filter(c=>c.terreno===reino);
const causoLido=id=>!!(s.causos&&s.causos.lidos[id]);
function podeLerCauso(id){
  const C=CARD[id];if(!C||C.ficha)return {ok:false,motivo:'Carta desconhecida.'};
  if(causoLido(id))return {ok:false,motivo:'Você já leu este causo.'};
  if(!s.cards[id])return {ok:false,motivo:'Só para cartas da sua coleção.',trava:'colecao'};
  const p=CAUSO_PRECO[C.rar];
  if(s.grao<p)return {ok:false,motivo:'Faltam '+fmt(p-s.grao)+' '+MOEDA_PL()+'.',preco:p,falta:{grao:p-s.grao}};
  return {ok:true,preco:p};
}
function lerCauso(id){
  const r=podeLerCauso(id);if(!r.ok)return r;
  gastar(r.preco,'causos');s.causos.lidos[id]=1;
  const reino=CARD[id].terreno;let folheto=null,todos=false;
  if(!s.causos.folhetos[reino]&&paginasDe(reino).every(c=>causoLido(c.id))){s.causos.folhetos[reino]=1;folheto=reino;
    todos=FOLHETOS.every(k=>s.causos.folhetos[k]);}
  ecoSample();save();
  return {ok:true,preco:r.preco,folheto,todos};
}
const causosLidos=()=>COLECAO.filter(c=>causoLido(c.id)).length;
const folhetoCompleto=reino=>!!(s.causos&&s.causos.folhetos[reino]);
const todosFolhetos=()=>FOLHETOS.every(folhetoCompleto);

/* ---------- Mascate (catálogo fixo, para sempre, sem sorteio) ---------- */
const MASCATE_CATS=[
 {k:'moldura',nome:'Molduras de carta',slot:'moldura'},
 {k:'verso',nome:'Versos de carta',slot:'verso'},
 {k:'tabuleiro',nome:'Tabuleiros',slot:'tabuleiro'},
 {k:'heroi',nome:'Visuais do herói',slot:'heroi'},
 {k:'emote',nome:'Emotes',slot:'emotes'},
 {k:'rastro',nome:'Rastros de invocação',slot:'rastro'}
];
const MASCATE=[
 {id:'mold-brasa',cat:'moldura',nome:'Brasa',preco:300,reino:'milharal',cor:'#E8862E'},
 {id:'mold-musgo',cat:'moldura',nome:'Musgo',preco:300,reino:'pomar',cor:'#3FA34D'},
 {id:'mold-correnteza',cat:'moldura',nome:'Correnteza',preco:300,reino:'brejo',cor:'#2E9FB5'},
 {id:'mold-luar',cat:'moldura',nome:'Luar',preco:300,reino:'pasto',cor:'#7B5BD6'},
 {id:'mold-bandeirinha',cat:'moldura',nome:'Bandeirinha',preco:300,reino:'neutro',cor:'#B08A5A'},
 {id:'mold-lamparina',cat:'moldura',nome:'Lamparina',preco:500,premium:true,cor:'#FFB23D',d:'chama animada'},
 {id:'verso-cordel',cat:'verso',nome:'Cordel',preco:150,cor:'#D9C29A'},
 {id:'verso-couro',cat:'verso',nome:'Couro Trabalhado',preco:150,cor:'#8A5A32'},
 {id:'verso-renda',cat:'verso',nome:'Renda de Bilro',preco:150,cor:'#EFE6D4'},
 {id:'verso-chita',cat:'verso',nome:'Chita',preco:150,cor:'#D8443A'},
 {id:'verso-palha',cat:'verso',nome:'Palha Trançada',preco:150,cor:'#C9A35A'},
 {id:'verso-ceu-junho',cat:'verso',nome:'Céu de Junho',preco:150,cor:'#2B3A78'},
 {id:'tab-sertao-chamas',cat:'tabuleiro',nome:'Sertão em Chamas',preco:600,arena:1,cor:'#E8862E'},
 {id:'tab-mata-amanhecer',cat:'tabuleiro',nome:'Mata ao Amanhecer',preco:600,arena:2,cor:'#3FA34D'},
 {id:'tab-igapo-seco',cat:'tabuleiro',nome:'Igapó Seco',preco:600,arena:3,cor:'#2E9FB5'},
 {id:'tab-tapera-tempestade',cat:'tabuleiro',nome:'Tapera em Tempestade',preco:600,arena:4,cor:'#7B5BD6'},
 {id:'tab-arraial-fogos',cat:'tabuleiro',nome:'Arraial de Fogos',preco:600,arena:5,cor:'#B08A5A'},
 {id:'heroi-gibao',cat:'heroi',nome:'Gibão de Couro',preco:800,cor:'#8A5A32'},
 {id:'heroi-pescadora',cat:'heroi',nome:'Pescadora do Igapó',preco:800,cor:'#2E9FB5'},
 {id:'heroi-mateira',cat:'heroi',nome:'Mateira da Lua',preco:800,cor:'#3FA34D'},
 {id:'heroi-repentista',cat:'heroi',nome:'Repentista',preco:800,cor:'#E8862E'},
 {id:'emote-arretado',cat:'emote',nome:'Arretado!',preco:100},
 {id:'emote-bah',cat:'emote',nome:'Bah, tchê!',preco:100},
 {id:'emote-massa',cat:'emote',nome:'Massa!',preco:100},
 {id:'emote-danou',cat:'emote',nome:'Danou-se!',preco:100},
 {id:'emote-assombro',cat:'emote',nome:'Que assombro!',preco:100},
 {id:'emote-medo',cat:'emote',nome:'Tá com medo?',preco:100},
 {id:'emote-bemtevi',cat:'emote',nome:'Bem-te-vi!',preco:100},
 {id:'emote-visagem',cat:'emote',nome:'Sai, visagem!',preco:100},
 {id:'rastro-brasa',cat:'rastro',nome:'Brasa',preco:400,cor:'#E8862E'},
 {id:'rastro-folhas',cat:'rastro',nome:'Folhas',preco:400,cor:'#3FA34D'},
 {id:'rastro-bolhas',cat:'rastro',nome:'Bolhas',preco:400,cor:'#2E9FB5'},
 {id:'rastro-nevoa',cat:'rastro',nome:'Névoa',preco:400,cor:'#7B5BD6'},
 {id:'rastro-bandeirinhas',cat:'rastro',nome:'Bandeirinhas',preco:400,cor:'#B08A5A'}
];
/* cosméticos que não se compram: vêm da Vila, do Livro de Causos e das Fitas da Peleja */
const REINO_DE={milharal:'do Sertão',pomar:'da Mata',brejo:'das Águas',pasto:'da Noite',neutro:'do Arraial'};
const COSM_PREMIO=[
 {id:'emote-eita',cat:'emote',nome:'Eita!',fonte:'Fogueira Nv 1'},
 {id:'emote-oxente',cat:'emote',nome:'Oxente!',fonte:'Torre do Vigia Nv 1'},
 {id:'emote-egua',cat:'emote',nome:'Égua!',fonte:'Casa de Farinha Nv 1'},
 {id:'emote-vixe',cat:'emote',nome:'Vixe!',fonte:'Ancoradouro Nv 1'},
 {id:'emote-uai',cat:'emote',nome:'Uai!',fonte:'Mirante da Lua Nv 1'},
 {id:'verso-gibao',cat:'verso',nome:'Couro de Gibão',fonte:'Torre do Vigia Nv 2',cor:'#6B4427'},
 {id:'verso-bananeira',cat:'verso',nome:'Folha de Bananeira',fonte:'Casa de Farinha Nv 2',cor:'#4E8A3A'},
 {id:'verso-escama',cat:'verso',nome:'Escama de Rio',fonte:'Ancoradouro Nv 2',cor:'#2E7F95'},
 {id:'verso-lencol',cat:'verso',nome:'Lençol de Visagem',fonte:'Mirante da Lua Nv 2',cor:'#B9B4D6'},
 {id:'verso-xilo',cat:'verso',nome:'Xilogravura',fonte:'os 5 folhetos de Causos',cor:'#E9DDC2'},
 {id:'tab-sertao-luar',cat:'tabuleiro',nome:'Sertão ao Luar',arena:1,fonte:'Torre do Vigia Nv 4',cor:'#7B5BD6'},
 {id:'tab-mata-chuva',cat:'tabuleiro',nome:'Mata em Chuva',arena:2,fonte:'Casa de Farinha Nv 4',cor:'#3FA34D'},
 {id:'tab-igapo-cheio',cat:'tabuleiro',nome:'Igapó Cheio',arena:3,fonte:'Ancoradouro Nv 4',cor:'#2E9FB5'},
 {id:'tab-tapera-nevoa',cat:'tabuleiro',nome:'Tapera em Névoa',arena:4,fonte:'Mirante da Lua Nv 4',cor:'#7B5BD6'},
 {id:'heroi-fogueira',cat:'heroi',nome:'Andarilho da Fogueira',fonte:'Fogueira Nv 5',cor:'#FFB23D'},
 {id:'heroi-contador',cat:'heroi',nome:'Contador de Causos',fonte:'os 5 folhetos de Causos',cor:'#D9C29A'},
 {id:'acess-chapeu',cat:'acessorio',nome:'Chapéu de couro',fonte:'Torre do Vigia Nv 5'},
 {id:'acess-bornal',cat:'acessorio',nome:'Bornal',fonte:'Casa de Farinha Nv 5'},
 {id:'acess-tarrafa',cat:'acessorio',nome:'Tarrafa',fonte:'Ancoradouro Nv 5'},
 {id:'acess-lanterna',cat:'acessorio',nome:'Lanterna violeta',fonte:'Mirante da Lua Nv 5'},
 {id:'titulo-fogueira',cat:'titulo',nome:'Dono da Fogueira',fonte:'Fogueira Nv 5'},
 {id:'titulo-vigia',cat:'titulo',nome:'Vigia do Sertão',fonte:'Torre do Vigia Nv 5'},
 {id:'titulo-mateiro',cat:'titulo',nome:'Mateiro',fonte:'Casa de Farinha Nv 5'},
 {id:'titulo-pescador',cat:'titulo',nome:'Pescador de Lendas',fonte:'Ancoradouro Nv 5'},
 {id:'titulo-noite',cat:'titulo',nome:'Guardião da Noite',fonte:'Mirante da Lua Nv 5'},
 ...FOLHETOS.map(r=>({id:'mold-cordel-'+r,cat:'moldura',nome:'Moldura de Cordel '+REINO_DE[r],reino:r,fonte:'folheto '+REINO_DE[r]})),
 ...FOLHETOS.map(r=>({id:'titulo-cordel-'+r,cat:'titulo',nome:'Cordelista '+REINO_DE[r],fonte:'folheto '+REINO_DE[r]})),
 {id:'fita-chita',cat:'fita',nome:'Fita de Chita',titulos:1,fonte:'1 título da Peleja',cor:'#D8443A'},
 {id:'fita-couro',cat:'fita',nome:'Fita de Couro',titulos:3,fonte:'3 títulos da Peleja',cor:'#8A5A32'},
 {id:'fita-prata',cat:'fita',nome:'Fita de Prata',titulos:10,fonte:'10 títulos da Peleja',cor:'#C9D1D9'},
 {id:'fita-ouro',cat:'fita',nome:'Fita de Ouro',titulos:25,fonte:'25 títulos da Peleja',cor:'#F2BE4A'}
];
const COSM={};for(const x of MASCATE.concat(COSM_PREMIO))COSM[x.id]=x;
const MASCATE_TOTAL=MASCATE.reduce((a,x)=>a+x.preco,0);
/* tem o cosmético? (comprado no Mascate, ou ganho pela Vila / Causos / Peleja: esses são derivados do estado) */
function temCosm(id){
  const x=COSM[id];if(!x||!s||!s.cosm)return false;
  if(s.cosm.tem[id])return true;
  if(x.preco)return false;
  for(const p of VILA_ORDEM){const L=VILA_PREMIO[p];for(let i=0;i<nivelVila(p);i++)if(L[i].cosm&&L[i].cosm.includes(id))return true;}
  if(id.startsWith('mold-cordel-')||id.startsWith('titulo-cordel-'))return folhetoCompleto(id.split('-').pop());
  if(id==='heroi-contador'||id==='verso-xilo')return todosFolhetos();
  if(x.cat==='fita')return ((s.torneio&&s.torneio.titulos)|0)>=x.titulos;
  return false;
}
const cosmDaCat=cat=>MASCATE.concat(COSM_PREMIO).filter(x=>x.cat===cat);
function fitaAtual(){let f=null;for(const x of COSM_PREMIO)if(x.cat==='fita'&&temCosm(x.id))f=x;return f;}
function comprarMascate(item){
  const id=typeof item==='string'?item:item&&item.id;const x=MASCATE.find(m=>m.id===id);
  if(!x)return {ok:false,motivo:'Esse item não está no Mascate.'};
  if(s.cosm.tem[id])return {ok:false,motivo:'Você já tem este item.'};
  if(s.grao<x.preco)return {ok:false,motivo:'Faltam '+fmt(x.preco-s.grao)+' '+MOEDA_PL()+'.',falta:{grao:x.preco-s.grao}};
  gastar(x.preco,'mascate');s.cosm.tem[id]=1;
  // já veste o que comprou se o espaço estava vazio
  const U=s.cosm.usa;
  if(x.cat==='emote'){if(U.emotes.length<4)U.emotes.push(id);}
  else if(x.cat==='tabuleiro'){if(!U.tabuleiro[x.arena])U.tabuleiro[x.arena]=id;}
  else{const sl=MASCATE_CATS.find(c=>c.k===x.cat).slot;if(!U[sl])U[sl]=id;}
  ecoSample();save();
  return {ok:true,item:x};
}
/* slot: moldura | verso | tabuleiro | heroi | emotes | rastro | titulo | acessorio; item null = tirar.
   tabuleiro usa a arena do item (ou o 3º argumento quando item é null); emotes alterna (máx. 4) */
function equipar(slot,item,arena){
  const U=s.cosm.usa;const id=item==null?null:(typeof item==='string'?item:item.id);
  if(id!=null){const x=COSM[id];if(!x||!temCosm(id))return {ok:false,motivo:'Você ainda não tem este item.'};
    const cat=slot==='emotes'?'emote':slot;if(x.cat!==cat)return {ok:false,motivo:'Esse item não vai aí.'};}
  if(slot==='emotes'){
    if(id==null){U.emotes=[];save();return {ok:true};}
    const i=U.emotes.indexOf(id);
    if(i>=0)U.emotes.splice(i,1);else{if(U.emotes.length>=4)return {ok:false,motivo:'Só 4 emotes de cada vez.'};U.emotes.push(id);}
    save();return {ok:true,on:i<0};
  }
  if(slot==='tabuleiro'){const a=id?COSM[id].arena:arena;if(!a)return {ok:false,motivo:'Arena?'};if(id)U.tabuleiro[a]=id;else delete U.tabuleiro[a];save();return {ok:true};}
  if(!(slot in U))return {ok:false,motivo:'Espaço desconhecido.'};
  U[slot]=id;save();return {ok:true};
}
/* emotes da roda: os 4 escolhidos, ou os primeiros que o jogador tem */
function emotesDaRoda(){
  const U=s.cosm.usa;const own=cosmDaCat('emote').filter(x=>temCosm(x.id)).map(x=>x.id);
  const l=U.emotes.filter(id=>own.includes(id));
  return (l.length?l:own.slice(0,4)).map(id=>COSM[id]);
}

/* ---------- próximos passos (a meta mais perto de cada ralo) ---------- */
function proximosPassos(){
  const out=[];
  // Ascensão: carta do deck com o próximo tier mais barato e com o nível certo
  const ids=[...new Set(s.deck.cartas)].filter(id=>s.cards[id]);
  let best=null;
  for(const id of ids){const k=custoAscensao(id);if(!k||!k.nvOk)continue;const tot=k.grao+k.po/10;if(!best||tot<best.tot)best={id,k,tot};}
  if(best)out.push({tipo:'ascensao',id:best.id,nome:CARD[best.id].nome+' · '+ASC_NOME()[best.k.tier-1],custo:best.k.grao,po:best.k.po,falta:Math.max(0,best.k.grao-s.grao)});
  // Vila: o nível mais barato que já pode ser comprado (fora a moeda)
  let v=null;for(const p of VILA_ORDEM){const r=podeVila(p);if(!r.ok&&!r.falta)continue;const c=custoVila(p);if(!v||c<v.custo)v={p,custo:c};}
  if(v)out.push({tipo:'vila',id:v.p,nome:VILA_PREDIOS[v.p].nome+' Nv '+(nivelVila(v.p)+1),custo:v.custo,falta:Math.max(0,v.custo-s.grao)});
  // Causos: a página mais barata de uma carta que você tem
  let c=null;for(const x of COLECAO){if(!s.cards[x.id]||causoLido(x.id))continue;const p=CAUSO_PRECO[x.rar];if(!c||p<c.custo)c={id:x.id,custo:p};}
  if(c)out.push({tipo:'causos',id:c.id,nome:'Causo: '+CARD[c.id].nome,custo:c.custo,falta:Math.max(0,c.custo-s.grao)});
  // Mascate: o item mais barato que você não tem
  let m=null;for(const x of MASCATE){if(s.cosm.tem[x.id])continue;if(!m||x.preco<m.preco)m=x;}
  if(m)out.push({tipo:'mascate',id:m.id,nome:'Mascate: '+m.nome,custo:m.preco,falta:Math.max(0,m.preco-s.grao)});
  return out;
}

/* ---------- economia por dia (a aba Economia lê daqui) ---------- */
/* últimos n dias do calendário (hoje por último), cada um com c/q/pg/pq e os totais */
function ecoUltimosDias(n){
  const out=[];const d0=new Date();
  for(let i=n-1;i>=0;i--){
    const d=new Date(d0.getFullYear(),d0.getMonth(),d0.getDate()-i,12);const k=diaChave(d);
    const D=(s.eco.dia&&s.eco.dia[k])||{};const c=D.c||{},q=D.q||{};
    const tc=sum(c),tq=sum(q);
    out.push({k,d,c,q,pg:sum(D.pg||{}),pq:sum(D.pq||{}),tc,tq,net:tc-tq});
  }
  return out;
}

