/* ===================== MOTOR DA BATALHA (regras síncronas) ===================== */
let UID=1;
const opp=P=>P==='p'?'r':'p';
const mkInst=(id,lvl)=>({uid:UID++,id,lvl:lvl||1});
/* ATK que vale: base + bônus do turno + bônus de família e de regra (famAtk) */
const effAtk=c=>Math.max(0,c.atk+(c.tmpAtk||0)+(c.famAtk||0));
const nVal=inst=>{const c=CARD[inst.id];return c.n?c.n[inst.lvl-1]:0;};
function novoLado(o){return {hp:o.hp,maxHp:o.maxHp||o.hp,deck:o.deck||[],hand:[],discard:[],energy:0,maxEnergy:0,lanes:o.lanes.map(t=>({terr:t,c:null,b:null})),nome:o.nome};}
/* o: {tut, rival, arena, tier, p:{hp,maxHp,deck,lanes,nome}, r:{...}, modo:'arena'|'treino'|'desafio'|'torneio', regra:id|null, etapa} */
function novaBatalha(o){
  const tut=!!o.tut;
  const B={tut,rival:o.rival,arena:o.arena||1,tier:o.tier||'facil',round:0,turn:'p',over:false,result:null,
    sides:{p:novoLado(o.p),r:novoLado(o.r)},ev:[],log:[],stats:{criaturas:0,feiticos:0,danoHeroi:0,abates:0,duplas:0,combos:0},jogadasAI:0,
    // v4
    modo:o.modo||'arena',regra:(!tut&&o.regra&&REGRA[o.regra])?o.regra:null,rodadaColheita:null,etapa:o.etapa,
    duplas:{p:[],r:[]},duplasLog:[],seq:{p:{n:0,atk:false,dano:0},r:{n:0,atk:false,dano:0}},famNiv:{p:{},r:{}},famVisto:{p:{},r:{}}};
  // regras do Desafio que mudam a montagem (as outras são lidas na hora)
  if(B.regra==='seca'){const T=REGRA.seca.troca||{brejo:'pasto'};for(const P of ['p','r'])B.sides[P].lanes.forEach(L=>{if(T[L.terr])L.terr=T[L.terr];});}
  if(B.regra==='colheita')B.rodadaColheita=REGRA.colheita.rodada||5;
  return B;
}
function quem(B,P){return P==='p'?'Você':(RIVAIS[B.rival]?RIVAIS[B.rival].curto:'Rival');}
function nomeC(B,P,c){return CARD[c.id].nome+(P==='r'?' (rival)':'');}
function ev(B,e){B.ev.push(e);}
function log(B,t){B.log.push(t);if(B.log.length>80)B.log.shift();ev(B,{t:'log',txt:t});}

/* mão inicial: 4 cartas (6 no Mutirão) com pelo menos 1 CRIATURA de custo ≤2 (reembaralha até 3 vezes) */
function maoInicial(S,n){
  n=n||4;
  for(let tent=0;tent<4;tent++){
    const top=S.deck.slice(0,n);
    if(top.some(i=>CARD[i.id].custo<=2&&CARD[i.id].tipo==='criatura')||tent===3){S.hand=S.deck.splice(0,n);return;}
    shuffle(S.deck);
  }
}
/* a partir desta rodada, cada lado compra 2 cartas por turno */
const RODADA_COMPRA2=4;
let comprasDoTurno=B=>(!B.tut&&B.round>=RODADA_COMPRA2)?2:1;
/* a partir desta rodada (Hora da Colheita), toda criatura ataca com +1 no turno do seu dono */
let RODADA_FURIA=6;
let COLHEITA_ATK=1,COLHEITA_PIS=true;
const horaColheita=B=>!B.tut&&B.round>=(B.rodadaColheita||RODADA_FURIA);
const furiaColheita=B=>horaColheita(B)?COLHEITA_ATK:0;
const temPisotear=(B,c)=>!!c.kw.pisotear||!!c.tmpPis||(COLHEITA_PIS&&horaColheita(B));
function comprar(B,P){
  const S=B.sides[P];if(!S.deck.length)return null;
  const inst=S.deck.shift();
  if(S.hand.length>=7){S.discard.push(inst);log(B,'Mão cheia: '+CARD[inst.id].nome+' foi descartada.');return null;}
  S.hand.push(inst);ev(B,{t:'draw',P,uid:inst.uid});return inst;
}
function temBrotar(B,P,c){
  if(c.kw.brotar)return true;
  if(regraAtiva(B,'chuva'))return true;
  const S=B.sides[P];
  if(S.lanes.some(L=>L.c&&L.c!==c&&!L.c.dead&&CARD[L.c.id].fx.some(f=>f.op==='brotarAura')))return true;
  // Pé de Maracujá: as vizinhas também têm Brotar
  const i=S.lanes.findIndex(L=>L.c===c);
  if(i>=0)for(const j of [i-1,i+1]){if(j<0||j>3)continue;const o=S.lanes[j].c;if(vivoC(o)&&CARD[o.id].fx.some(f=>f.op==='brotarVizinhas'))return true;}
  return false;
}
function curarHeroi(B,P,v){const S=B.sides[P];const a=Math.min(v,S.maxHp-S.hp);if(a>0){S.hp+=a;ev(B,{t:'heal',P,lane:-1,n:a});}return a;}
function curarCriatura(B,P,i,v){const c=B.sides[P].lanes[i].c;if(!c)return 0;const a=Math.min(v,c.maxHp-c.hp);if(a>0){c.hp+=a;ev(B,{t:'heal',P,lane:i,n:a});}return a;}
function danoHeroi(B,P,n,src){
  if(n<=0)return;const S=B.sides[P];S.hp-=n;ev(B,{t:'hero',P,n});
  if(P==='r')B.stats.danoHeroi+=n;
}
function danoCriatura(B,P,i,n){
  const c=B.sides[P].lanes[i].c;if(!c||n<=0)return;c.hp-=n;ev(B,{t:'dmg',P,lane:i,n});
}
function buff(B,P,i,a,h,temp,txt){
  const c=B.sides[P].lanes[i].c;if(!c)return;
  if(temp)c.tmpAtk+=a;else c.atk+=a;
  if(h){c.maxHp+=h;c.hp+=h;}
  const e={t:'buff',P,lane:i,a,h};if(txt)e.txt=txt;
  ev(B,e);
}
function marcarMortes(B){
  let n=0;
  for(const P of ['p','r'])B.sides[P].lanes.forEach((L,i)=>{if(L.c&&!L.c.dead&&L.c.hp<=0){L.c.dead=true;n++;ev(B,{t:'die',P,lane:i,uid:L.c.uid});}});
  return n;
}
/* remove os mortos e dispara "Ao morrer"; retorna quantos saíram */
function varrer(B){
  const mortos=[];
  for(const P of [B.turn,opp(B.turn)])B.sides[P].lanes.forEach((L,i)=>{if(L.c&&L.c.dead){mortos.push({P,i,c:L.c});L.c=null;}});
  for(const m of mortos){
    const S=B.sides[m.P];if(!m.c.ficha)S.discard.push({uid:m.c.uid,id:m.c.id,lvl:m.c.lvl});
    log(B,nomeC(B,m.P,m.c)+' caiu.');
    if(m.P==='r')B.stats.abates++;
    for(const f of CARD[m.c.id].fx)if(f.on==='morrer'&&f.op==='danoHeroiRival'){danoHeroi(B,opp(m.P),f.v);log(B,CARD[m.c.id].nome+' explodiu: '+f.v+' de dano no '+(m.P==='p'?'herói rival':'seu herói')+'.');}
  }
  if(mortos.length&&v4On(B)){
    // Porco Comilão: cresce +1/+1 por criatura rival que caiu (um Porco que caiu junto não cresce)
    for(const Q of ['p','r']){
      const k=mortos.filter(m=>m.P===Q).length;if(!k)continue;const R=opp(Q);
      B.sides[R].lanes.forEach((L,i)=>{const c=L.c;if(!vivoC(c))return;
        for(const f of CARD[c.id].fx)if(f.on==='abateRival'&&f.op==='cresce'){
          // f.max: quantas vezes pode crescer na partida (c.comeu guarda quantas já cresceu)
          const n=f.max?Math.min(k,f.max-(c.comeu||0)):k;if(n<=0)continue;c.comeu=(c.comeu||0)+n;
          const t=f.h?'+'+(f.a*n)+'/+'+(f.h*n):'+'+(f.a*n)+' ATK';
          buff(B,R,i,f.a*n,f.h*n,false,'Nhac! '+t);log(B,nomeC(B,R,c)+' comeu bem: '+t+'.');}});
    }
    recalcFamilias(B);
  }
  if(mortos.length)marcarMortes(B);
  return mortos.length;
}
function fimDeJogo(B){
  if(B.over)return true;
  const p=B.sides.p.hp,r=B.sides.r.hp;
  if(p<=0||r<=0){B.over=true;B.result=(p<=0&&r<=0)?'empate':(r<=0?'vitoria':'derrota');return true;}
  return false;
}
function fimPorRodadas(B){
  if(B.over)return;
  const p=B.sides.p.hp,r=B.sides.r.hp;B.over=true;B.result=p>r?'vitoria':p<r?'derrota':'empate';B.porTempo=true;
}

/* ---------- início e fim de turno ---------- */
function iniciarTurno(B,P,semCompra){
  const S=B.sides[P];
  if(P==='p')B.round++;
  B.turn=P;
  S.maxEnergy=Math.min(B.round+1,7)+(regraAtiva(B,'feira')?1:0);S.energy=S.maxEnergy;
  const v4=v4On(B);
  if(v4)B.seq[P]={n:0,atk:false,dano:0};
  const fc=furiaColheita(B);if(fc)S.lanes.forEach(L=>{if(L.c&&!L.c.dead)L.c.tmpAtk+=fc;});
  // construções primeiro
  S.lanes.forEach((L,i)=>{
    if(!L.b)return;const op=CARD[L.b.id].fx[0].op,n=nVal(L.b);
    if(op==='inicioBuffLane'&&L.c&&!L.c.dead){buff(B,P,i,1,n);log(B,'Colmeia: '+nomeC(B,P,L.c)+' ganhou +1/+'+n+'.');}
    if(op==='inicioEnergia'){S.energy+=n;ev(B,{t:'energia',P,n});log(B,'Moinho: '+(P==='p'?'você ganhou':quem(B,P)+' ganhou')+' +'+n+' de energia.');}
    if(op==='inicioNinhada'&&!L.c){
      // Galinheiro: nasce um Filhote n/1 com Fúria no terreno vazio
      const ficha=CARD[L.b.id].fx[0].ficha||'filhote';
      ev(B,{t:'ninhada',P,de:i,para:[i],ficha});
      const inst=mkInst(ficha,1);invocar(B,P,i,inst,true,{semLog:true});
      if(L.c&&n>1){L.c.atk+=n-1;}
      ev(B,{t:'play',P,id:ficha,uid:inst.uid,lane:i,tipo:'criatura',ficha:true});
      log(B,'Galinheiro'+(P==='r'?' do rival':'')+': nasceu um '+CARD[ficha].nome+' no terreno '+(i+1)+'.');
    }
    if(op==='inicioTrator'&&L.c&&!L.c.dead){
      // Trator: +n ATK e Pisotear neste turno (tmpPis some no fimTurno)
      L.c.tmpAtk+=n;L.c.tmpPis=true;
      ev(B,{t:'buff',P,lane:i,a:n,h:0,txt:'+'+n+' ATK e Pisotear'});
      log(B,'Trator: '+nomeC(B,P,L.c)+' ganhou +'+n+' ATK e Pisotear neste turno.');
    }
  });
  if(v4)recalcFamilias(B);
  // depois as criaturas
  S.lanes.forEach((L,i)=>{
    const c=L.c;if(!c||c.dead)return;
    if(temBrotar(B,P,c)){c.maxHp++;c.hp++;ev(B,{t:'buff',P,lane:i,a:0,h:1});}
    for(const f of CARD[c.id].fx){
      if(f.on!=='inicio')continue;
      if(f.op==='curaAliadas'){S.lanes.forEach((L2,j)=>{if(L2.c)curarCriatura(B,P,j,f.v);});log(B,nomeC(B,P,c)+' curou as criaturas aliadas.');}
      if(f.op==='curaHeroi'){const a=curarHeroi(B,P,f.v);if(a)log(B,nomeC(B,P,c)+' curou '+a+' do '+(P==='p'?'seu herói':'herói rival')+'.');}
    }
  });
  if(!semCompra&&!(P==='p'&&B.round===1)){const n=comprasDoTurno(B);for(let k=0;k<n;k++)comprar(B,P);}
}
function fimTurno(B,P){
  B.sides[P].lanes.forEach((L,i)=>{const c=L.c;if(!c)return;c.rest=false;c.tmpAtk=0;c.tmpPis=false;c.lua=0;
    // Enraizada: perdeu este combate; fica livre no fim do turno do dono
    if(c.raiz){c.raiz=false;ev(B,{t:'raiz',P,lane:i,on:false});}});
}

/* ---------- jogar cartas ---------- */
function alvosLegais(B,P,inst){
  const c=CARD[inst.id];
  if(c.tipo!=='feitico')return [0,1,2,3].map(i=>({side:P,lane:i}));
  if(!c.alvo)return [{side:P,lane:-1}];
  const sd=c.alvo==='aliada'?P:opp(P);const out=[];
  B.sides[sd].lanes.forEach((L,i)=>{
    if(!L.c||L.c.dead)return;
    if(c.fx[0].op==='destroiSeVidaAte'&&L.c.hp>nVal(inst))return;
    out.push({side:sd,lane:i});
  });
  return out;
}
function motivoBloqueio(B,P,inst){
  const c=CARD[inst.id];
  if(c.custo>B.sides[P].energy)return 'Falta energia';
  if(c.tipo==='feitico'&&c.alvo&&!alvosLegais(B,P,inst).length)return 'Sem alvo';
  return null;
}
function jogarCarta(B,P,uid,lane){
  const S=B.sides[P];const idx=S.hand.findIndex(h=>h.uid===uid);if(idx<0)return false;
  const inst=S.hand[idx],c=CARD[inst.id];
  if(motivoBloqueio(B,P,inst))return false;
  if(c.tipo==='feitico'&&c.alvo&&!alvosLegais(B,P,inst).some(t=>t.lane===lane))return false;
  S.hand.splice(idx,1);S.energy-=c.custo;
  if(c.tipo==='criatura'){
    ev(B,{t:'play',P,id:inst.id,uid:inst.uid,lane,tipo:'criatura'});
    invocar(B,P,lane,inst,false);
    if(P==='p')B.stats.criaturas++;
  }else if(c.tipo==='construcao'){
    const L=S.lanes[lane];if(L.b)S.discard.push(L.b);
    L.b={uid:inst.uid,id:inst.id,lvl:inst.lvl};
    ev(B,{t:'play',P,id:inst.id,uid:inst.uid,lane,tipo:'construcao'});
    log(B,quem(B,P)+' construiu '+c.nome+' no terreno '+(lane+1)+'.');
    if(v4On(B)){checaDuplas(B,P,lane,inst.id);recalcFamilias(B);}
  }else{
    const sd=c.alvo==='rival'?opp(P):P;
    ev(B,{t:'play',P,id:inst.id,uid:inst.uid,lane,tipo:'feitico',side:sd});
    feitico(B,P,inst,lane);S.discard.push(inst);
    if(P==='p')B.stats.feiticos++;
    if(v4On(B))recalcFamilias(B); // um feitiço pode derrubar quem segurava o nível de uma família
  }
  if(v4On(B))checaSequencia(B,P,c.tipo);
  marcarMortes(B);
  return true;
}
/* o: {semLog} (o Galinheiro escreve a própria linha no Diário) */
function invocar(B,P,lane,inst,ficha,o){
  const S=B.sides[P],L=S.lanes[lane],c=CARD[inst.id];
  if(L.c){const old=L.c;if(!old.ficha)S.discard.push({uid:old.uid,id:old.id,lvl:old.lvl});log(B,c.nome+' substituiu '+CARD[old.id].nome+' (sem efeito Ao morrer).');ev(B,{t:'replace',P,lane});}
  const b=statsBase(inst.id,inst.lvl);const aff=c.terreno!=='neutro'&&c.terreno===L.terr;
  const v4=v4On(B),xv=regraAtiva(B,'cerca')&&REGRA.cerca.vida||0; // Cerca Viva (versão +0/+vida)
  const cr={uid:inst.uid,id:inst.id,lvl:inst.lvl,atk:b.atk+(aff?1:0),maxHp:b.hp+(aff?1:0)+xv,hp:b.hp+(aff?1:0)+xv,kw:Object.assign({},c.kw),tmpAtk:B.turn===P?furiaColheita(B):0,rest:!c.kw.furia&&!luaAtiva(B),lua:!c.kw.furia&&luaAtiva(B)?1:0,aff,dead:false,ficha:!!ficha,
    raiz:false,famAtk:0,fb:{},tmpPis:false};
  L.c=cr;
  if(!ficha)log(B,quem(B,P)+(P==='p'?' jogou ':' jogou ')+c.nome+' no terreno '+(lane+1)+(aff?' (+1/+1 no '+TERR_NOME[L.terr]+')':'')+'.');
  else if(!(o&&o.semLog))log(B,'Nasceu '+(FICHA_ART[inst.id]||'um')+' '+c.nome+' no terreno '+(lane+1)+'.');
  if(aff)ev(B,{t:'aff',P,lane});
  if(v4){
    // Boi-Bumbá: quem entra depois dele também ganha +1/+1 (antes do próprio "Ao entrar")
    S.lanes.forEach((L2,j)=>{const o2=L2.c;if(j===lane||!vivoC(o2))return;
      for(const f of CARD[o2.id].fx)if(f.on==='passivo'&&f.op==='festaEntrada'){ev(B,{t:'festa',P,de:j,para:lane});buff(B,P,lane,f.a,f.h);}});
  }
  for(const f of c.fx)if(f.on==='entrar'){if(f.grito&&v4)ev(B,{t:'grito',P,lane,id:inst.id});aoEntrar(B,P,lane,cr,f);}
  if(v4){if(!ficha)checaDuplas(B,P,lane,inst.id);recalcFamilias(B);}
}
function aoEntrar(B,P,lane,cr,f){
  const S=B.sides[P],O=B.sides[opp(P)],E=O.lanes[lane].c,nome=CARD[cr.id].nome;
  const outras=()=>S.lanes.map((L,i)=>({L,i})).filter(x=>x.i!==lane&&x.L.c&&!x.L.c.dead);
  switch(f.op){
    case 'danoFrente':if(E&&!E.dead){danoCriatura(B,opp(P),lane,f.v);log(B,nome+' causou '+f.v+' em '+nomeC(B,opp(P),E)+'.');}break;
    case 'destroiFrente':if(E&&!E.dead){E.hp=Math.min(E.hp,0);ev(B,{t:'destroy',P:opp(P),lane});log(B,nome+' engoliu '+nomeC(B,opp(P),E)+'!');}break;
    case 'danoTodasRivais':O.lanes.forEach((L,i)=>{if(L.c&&!L.c.dead)danoCriatura(B,opp(P),i,f.v);});log(B,nome+' causou '+f.v+' em cada criatura '+(P==='p'?'rival':'sua')+'.');break;
    case 'curaHeroi':{const a=curarHeroi(B,P,f.v);log(B,nome+' curou '+a+' do '+(P==='p'?'seu herói':'herói rival')+'.');break;}
    case 'curaTotalAliadas':S.lanes.forEach((L,i)=>{if(L.c&&!L.c.dead)curarCriatura(B,P,i,L.c.maxHp);});break;
    case 'buffOutras':outras().forEach(x=>buff(B,P,x.i,f.a,f.h));if(outras().length)log(B,nome+': as outras criaturas ganharam +'+f.a+'/+'+f.h+'.');break;
    case 'buffOutrasTemp':outras().forEach(x=>{buff(B,P,x.i,f.v,0,true);x.L.c.rest=false;});if(outras().length)log(B,nome+': as outras criaturas ganharam +'+f.v+' ATK e acordaram.');break;
    case 'espinhosOutras':outras().forEach(x=>{x.L.c.kw.espinhos=(x.L.c.kw.espinhos||0)+f.v;ev(B,{t:'buff',P,lane:x.i,a:0,h:0,txt:'+1 Espinhos'});});if(outras().length)log(B,nome+': as outras criaturas ganharam +1 de Espinhos.');break;
    case 'criaFicha':{
      // Ninhada: fichas nos terrenos vazios vizinhos, esquerda primeiro
      const ficha=f.ficha||'cereja',n=f.n||1;
      const viz=[lane-1,lane+1].filter(i=>i>=0&&i<4&&!S.lanes[i].c).slice(0,n);
      if(!viz.length)break;
      ev(B,{t:'ninhada',P,de:lane,para:viz,ficha});
      for(const i of viz){const inst=mkInst(ficha,1);invocar(B,P,i,inst,true);ev(B,{t:'play',P,id:ficha,uid:inst.uid,lane:i,tipo:'criatura',ficha:true});}
      break;}
    // ---- v4 ----
    case 'acordaOutras':{const w=[];outras().forEach(x=>{if(x.L.c.hp>0&&x.L.c.rest){x.L.c.rest=false;w.push(x.i);}});
      if(w.length)ev(B,{t:'acorda',P,lanes:w});log(B,nome+': todo mundo acordou!');break;}
    case 'danoMaiorAtk':{
      let best=-1;O.lanes.forEach((L,i)=>{const c=L.c;if(!vivoC(c))return;if(best<0){best=i;return;}const b=O.lanes[best].c;
        if(effAtk(c)>effAtk(b)||(effAtk(c)===effAtk(b)&&c.hp<b.hp))best=i;});
      if(best>=0){const T=O.lanes[best].c;danoCriatura(B,opp(P),best,f.v);log(B,nome+' mergulhou em '+nomeC(B,opp(P),T)+': '+f.v+' de dano.');}
      break;}
    case 'buffVizinhas':[lane-1,lane+1].forEach(j=>{if(j>=0&&j<4&&vivoC(S.lanes[j].c))buff(B,P,j,f.a,f.h);});break;
    case 'kwVizinhas':[lane-1,lane+1].forEach(j=>{if(j<0||j>3)return;const o=S.lanes[j].c;if(!vivoC(o))return;
      o.kw[f.kw]=(o.kw[f.kw]||0)+f.v;ev(B,{t:'buff',P,lane:j,a:0,h:0,txt:'+'+f.v+' '+KW_INFO[f.kw].nome});});break;
    case 'perdeAtkFrente':if(vivoC(E)){const a=E.atk;E.atk=Math.max(0,E.atk-f.v);if(a>E.atk){ev(B,{t:'debuff',P:opp(P),lane,n:a-E.atk});log(B,nome+' grudou em '+nomeC(B,opp(P),E)+': −'+(a-E.atk)+' de ATK.');}}break;
    case 'enraizaFrente':{const ls=f.viz?[lane-1,lane,lane+1]:[lane];let k=0;
      ls.forEach(j=>{if(j<0||j>3)return;const T=O.lanes[j].c;if(!vivoC(T))return;T.raiz=true;k++;ev(B,{t:'raiz',P:opp(P),lane:j,on:true});});
      if(k)log(B,nome+': '+(k>1?k+' criaturas ficaram Enraizadas':'uma criatura ficou Enraizada')+'.');break;}
    case 'buffSeFamiliaVizinha':if([lane-1,lane+1].some(j=>j>=0&&j<4&&vivoC(S.lanes[j].c)&&CARD[S.lanes[j].c.id].familia===f.fam)){buff(B,P,lane,f.a,f.h);log(B,nome+' ficou valente: +'+f.a+'/+'+f.h+'.');}break;
    case 'compra':for(let k=0;k<(f.v||1);k++)comprar(B,P);break;
    case 'buffFamiliaTemp':{const w=[];let k=0;outras().forEach(x=>{const o=x.L.c;if(o.hp<=0||CARD[o.id].familia!==f.fam)return;buff(B,P,x.i,f.a,0,true);k++;if(f.acorda&&o.rest){o.rest=false;w.push(x.i);}});
      if(w.length)ev(B,{t:'acorda',P,lanes:w});if(k)log(B,nome+': o '+FAMILIAS[f.fam].nome+' ganhou +'+f.a+' ATK neste turno'+(f.acorda?' e acordou':'')+'.');break;}
  }
}
function feitico(B,P,inst,lane){
  const c=CARD[inst.id],f=c.fx[0],n=nVal(inst);
  const sd=c.alvo==='rival'?opp(P):P;
  const T=lane>=0?B.sides[sd].lanes[lane].c:null;
  const quemJ=quem(B,P);
  switch(f.op){
    case 'danoCriatura':danoCriatura(B,sd,lane,n);ev(B,{t:'spell',P:sd,lane,kind:'graos'});log(B,quemJ+' usou '+c.nome+': '+n+' de dano em '+nomeC(B,sd,T)+'.');break;
    case 'buffAliada':{const a=f.a!=null?f.a:n,h=f.h!=null?f.h:n;buff(B,sd,lane,a,h);ev(B,{t:'spell',P:sd,lane,kind:'brilho'});log(B,quemJ+' usou '+c.nome+': '+nomeC(B,sd,T)+' ganhou +'+a+'/+'+h+'.');break;}
    case 'vidaMaisCuraTotal':T.maxHp+=n;T.hp=T.maxHp;ev(B,{t:'buff',P:sd,lane,a:0,h:n});ev(B,{t:'spell',P:sd,lane,kind:'brilho'});log(B,quemJ+' usou '+c.nome+': '+nomeC(B,sd,T)+' ganhou +0/+'+n+' e curou tudo.');break;
    case 'perdeAtk':{const antes=T.atk;T.atk=Math.max(0,T.atk-n);ev(B,{t:'debuff',P:sd,lane,n:antes-T.atk});ev(B,{t:'spell',P:sd,lane,kind:'lama'});log(B,quemJ+' usou '+c.nome+': '+nomeC(B,sd,T)+' perdeu '+(antes-T.atk)+' de ATK.');break;}
    case 'destroiSeVidaAte':T.hp=Math.min(T.hp,0);ev(B,{t:'spell',P:sd,lane,kind:'lama'});ev(B,{t:'destroy',P:sd,lane});log(B,quemJ+' usou '+c.nome+': '+nomeC(B,sd,T)+' afundou no brejo.');break;
    case 'buffTimeTemp':B.sides[P].lanes.forEach((L,i)=>{if(L.c&&!L.c.dead){buff(B,P,i,n,0,true);L.c.rest=false;ev(B,{t:'spell',P,lane:i,kind:'vento'});}});log(B,quemJ+' usou '+c.nome+': +'+n+' ATK neste turno, e todas acordaram.');break;
    // ---- v4 ----
    case 'buffAliadaTemp':buff(B,sd,lane,n,0,true);T.rest=false;ev(B,{t:'spell',P:sd,lane,kind:'pamonha'});log(B,quemJ+' usou '+c.nome+': '+nomeC(B,sd,T)+' acordou e ganhou +'+n+' ATK neste turno.');break;
    case 'danoEnraiza':danoCriatura(B,sd,lane,n);ev(B,{t:'spell',P:sd,lane,kind:'cipo'});
      if(T.hp>0){T.raiz=true;ev(B,{t:'raiz',P:sd,lane,on:true});}
      log(B,quemJ+' usou '+c.nome+': '+n+' de dano em '+nomeC(B,sd,T)+(T.hp>0?', que ficou Enraizada.':'.'));break;
    case 'vidaTimeCura':{let k=0;B.sides[P].lanes.forEach((L,i)=>{const o=L.c;if(!vivoC(o))return;o.maxHp+=n;o.hp=o.maxHp;k++;ev(B,{t:'buff',P,lane:i,a:0,h:n});ev(B,{t:'spell',P,lane:i,kind:'chuva'});});
      log(B,quemJ+' usou '+c.nome+': '+(k?'+0/+'+n+' e vida cheia para '+(k>1?k+' criaturas':'1 criatura'):'mas não tinha criaturas')+'.');break;}
  }
}

/* ---------- combate (mão única: quem apanha não revida) ---------- */
/* para onde vai o ataque da criatura c (lado P, terreno i). PURA: a IA chama muitas vezes.
   -> {tipo:'heroi'} | {tipo:'criatura',lane:j,guarda?:true} */
function alvoReal(B,P,i,c){
  const O=B.sides[opp(P)];
  const voa=!!c.kw.voar&&!regraAtiva(B,'ventania');
  const E=O.lanes[i].c;
  if(E&&!E.dead){
    if(voa&&!E.kw.voar&&!E.kw.bloqueiaVoo)return {tipo:'heroi'};
    return {tipo:'criatura',lane:i};
  }
  // Guarda: um vizinho do terreno vazio entra na frente
  if(!B.tut){
    let g=-1;
    for(const j of [i-1,i+1]){
      if(j<0||j>3)continue;const G=O.lanes[j].c;
      if(!vivoC(G)||!G.kw.guarda)continue;
      if(voa&&!G.kw.voar&&!G.kw.bloqueiaVoo)continue;
      if(g<0||G.hp>O.lanes[g].c.hp)g=j;
    }
    if(g>=0)return {tipo:'criatura',lane:g,guarda:true};
  }
  return {tipo:'heroi'};
}
/* compatível com o código antigo: 'heroi' | 'criatura' */
function alvoAtaque(B,P,i,c){return alvoReal(B,P,i,c).tipo;}
/* quanto um ataque contra a criatura do terreno t do lado Q perde (Cerca, Couraça, regra Cerca Viva) */
function reducaoAtaque(B,Q,t){
  const L=B.sides[Q].lanes[t],E=L.c;let n=0,fonte=null,top=0;
  const soma=(v,f)=>{if(v>0){n+=v;if(v>top){top=v;fonte=f;}}};
  if(L.b&&CARD[L.b.id].fx[0].op==='reduzDanoLane')soma(nVal(L.b),'cerca');
  if(E)soma(E.kw.couraca||0,'couraca');
  if(regraAtiva(B,'cerca')&&!REGRA.cerca.vida)soma(1,'regra');
  return {n,fonte};
}
const podeAtacar=c=>!!c&&!c.dead&&!c.rest&&!c.raiz&&effAtk(c)>0;
function ataque(B,P,i){
  const S=B.sides[P],O=B.sides[opp(P)],c=S.lanes[i].c;
  if(!podeAtacar(c))return false;
  const alvo=alvoReal(B,P,i,c);let dmg=effAtk(c);
  // Lua Cheia: quem entrou acordado pela Lua só ataca criaturas no turno em que entrou
  if(c.lua&&alvo.tipo==='heroi'){if(c.lua===1){c.lua=2;ev(B,{t:'lua',P,lane:i});log(B,nomeC(B,P,c)+' chegou com a Lua Cheia: neste turno só ataca criaturas.');}return false;}
  if(alvo.tipo==='heroi'){
    ev(B,{t:'atk',P,lane:i,heroi:true,alvoLane:-1});
    danoHeroi(B,opp(P),dmg);
    const E=O.lanes[i].c;
    log(B,nomeC(B,P,c)+(E&&!E.dead?' voou e causou ':' causou ')+dmg+(P==='p'?' no herói rival.':' em você.'));
  }else{
    const t=alvo.lane,E=O.lanes[t].c;
    if(alvo.guarda){ev(B,{t:'guarda',P:opp(P),de:i,para:t});log(B,nomeC(B,opp(P),E)+' pulou na frente (Guarda)!');}
    ev(B,{t:'atk',P,lane:i,heroi:false,alvoLane:t});
    const red=reducaoAtaque(B,opp(P),t),d0=dmg;
    dmg=Math.max(0,dmg-red.n);
    const exc=dmg-E.hp;
    if(dmg>0){if(d0>dmg)ev(B,{t:'reduz',P:opp(P),lane:t,n:d0-dmg,fonte:red.fonte});danoCriatura(B,opp(P),t,dmg);}else ev(B,{t:'block',P:opp(P),lane:t});
    log(B,nomeC(B,P,c)+' atacou '+nomeC(B,opp(P),E)+' ('+dmg+' de dano).');
    if(temPisotear(B,c)&&exc>0){danoHeroi(B,opp(P),exc);log(B,'Pisotear! '+exc+' passou para o '+(P==='p'?'herói rival':'seu herói')+'.');}
    if(E.kw.espinhos&&dmg>=1){c.hp-=E.kw.espinhos;ev(B,{t:'dmg',P,lane:i,n:E.kw.espinhos,thorn:true});log(B,'Espinhos: '+nomeC(B,P,c)+' levou '+E.kw.espinhos+'.');}
  }
  marcarMortes(B);
  return true;
}
/* versão síncrona do combate inteiro (simulação, testes) */
function combateSync(B,P){
  for(let i=0;i<4;i++){
    const c=B.sides[P].lanes[i].c;if(!c)continue;
    const vezes=c.kw.ataqueDuplo?2:1;
    for(let k=0;k<vezes;k++){
      if(B.sides[P].lanes[i].c!==c||c.dead)break;
      if(!ataque(B,P,i))break;
      while(varrer(B));
      if(fimDeJogo(B))return;
    }
  }
}
function jogarSync(B,P,uid,lane){const ok=jogarCarta(B,P,uid,lane);while(varrer(B));fimDeJogo(B);return ok;}

/* ---------- IA ---------- */
let IA_FACIL_MAX=2; // Fácil: no máximo 2 jogadas por turno
let IA_WE=2,IA_WH=1,IA_WA=0; // Difícil: peso da previsão (jogada + combate), da vida e da ameaça do rival
let IA_TROCA=1; // troca uma criatura por outra melhor (usa a energia quando o campo está cheio)
let IA_FAM=1,IA_DUPLA=1,IA_COMBO=1; // v4: peso das famílias, das duplas e do Combo na escolha
/* valor de uma criatura em campo (B opcional: regras do Desafio) */
function V(c,B){const k=c.kw,a=effAtk(c);const voa=k.voar&&!regraAtiva(B,'ventania');
  return a+c.hp+(k.furia?1:0)+(voa?2:0)+(k.espinhos||0)+(k.brotar?2:0)+((k.pisotear||c.tmpPis)?1:0)+(k.ataqueDuplo?a:0)+(k.bloqueiaVoo?1:0)
    +(k.guarda?2:0)+1.5*(k.couraca||0)-(c.raiz?a:0);}
function prospecto(B,P,inst,lane){
  const c=CARD[inst.id],b=statsBase(inst.id,inst.lvl),aff=c.terreno!=='neutro'&&c.terreno===B.sides[P].lanes[lane].terr;
  return {atk:b.atk+(aff?1:0),hp:b.hp+(aff?1:0),maxHp:b.hp+(aff?1:0),kw:c.kw,tmpAtk:0,aff,rest:!c.kw.furia&&!luaAtiva(B)};
}
/* o rival que está no terreno j bateria no meu herói no próximo turno dele? */
const bateFace=(B,P,j)=>{const E=B.sides[opp(P)].lanes[j].c;return !!E&&!E.dead&&alvoReal(B,opp(P),j,E).tipo==='heroi';};
function fxBonus(B,P,c,lane,me){
  const S=B.sides[P],O=B.sides[opp(P)],E=O.lanes[lane].c;
  const outras=S.lanes.filter((L,i)=>i!==lane&&L.c).map(L=>L.c);
  const viz=[lane-1,lane+1].filter(j=>j>=0&&j<4);
  let b=0;
  for(const f of c.fx){
    switch(f.op){
      // ---- v4 ----
      case 'criaFicha':{const free=viz.filter(j=>!S.lanes[j].c).length,k=Math.min(f.n||1,free),fc=CARD[f.ficha||'cereja'];b+=k*(2+((fc.kw.furia||fc.kw.voar)?1:0));break;}
      case 'acordaOutras':outras.forEach(o=>{if(o.rest&&!o.raiz)b+=effAtk(o);});break;
      case 'buffFamiliaTemp':outras.forEach(o=>{if(CARD[o.id].familia===f.fam)b+=f.a+(o.rest&&!o.raiz?effAtk(o):0);});break;
      case 'danoMaiorAtk':{let T=null;O.lanes.forEach(L=>{const x=L.c;if(!vivoC(x))return;if(!T||effAtk(x)>effAtk(T)||(effAtk(x)===effAtk(T)&&x.hp<T.hp))T=x;});
        if(T)b+=f.v>=T.hp?effAtk(T)+T.hp:0.5*f.v;break;}
      case 'buffVizinhas':b+=(1.5*f.a+f.h)*viz.filter(j=>vivoC(S.lanes[j].c)).length;break;
      case 'kwVizinhas':b+=1.5*f.v*viz.filter(j=>vivoC(S.lanes[j].c)).length;break;
      case 'perdeAtkFrente':if(vivoC(E)){const g=Math.min(f.v,effAtk(E));const face=E.kw.voar&&!regraAtiva(B,'ventania')&&!me.kw.voar&&!me.kw.bloqueiaVoo;b+=face?1.5*g:g;}break;
      case 'enraizaFrente':(f.viz?[lane-1,lane,lane+1]:[lane]).forEach(j=>{if(j<0||j>3)return;const T=O.lanes[j].c;if(!vivoC(T)||T.raiz)return;b+=effAtk(T)*(j!==lane&&bateFace(B,P,j)?1.5:1);});break;
      case 'buffSeFamiliaVizinha':if(viz.some(j=>vivoC(S.lanes[j].c)&&CARD[S.lanes[j].c.id].familia===f.fam))b+=2.5;break;
      case 'compra':if(S.hand.length-1<6)b+=2*(f.v||1);break;
      case 'cresce':case 'festaEntrada':case 'brotarVizinhas':case 'sequenciaMenos':b+=2;break;
      case 'danoFrente':if(E)b+=f.v>=E.hp?effAtk(E)+E.hp:0.5*f.v;break;
      case 'destroiFrente':if(E)b+=effAtk(E)+E.hp;break;
      case 'danoTodasRivais':O.lanes.forEach(L=>{if(L.c)b+=f.v>=L.c.hp?effAtk(L.c)+L.c.hp:0.5*f.v;});break;
      case 'buffOutras':b+=(f.a+f.h)*outras.length;break;
      case 'buffOutrasTemp':outras.forEach(o=>{b+=f.v+(o.rest?effAtk(o):0);});break;
      case 'curaHeroi':b+=f.on==='inicio'?2:0.5*Math.min(f.v,20-S.hp);break;
      case 'curaTotalAliadas':S.lanes.forEach(L=>{if(L.c)b+=0.5*(L.c.maxHp-L.c.hp);});break;
      case 'espinhosOutras':b+=outras.length;break;
      case 'danoHeroiRival':case 'curaAliadas':case 'brotarAura':b+=2;break;
    }
  }
  return b;
}
function opcoesIA(B,P,tier){
  const S=B.sides[P];const out=[];
  S.hand.forEach(inst=>{
    const c=CARD[inst.id];if(c.custo>S.energy)return;
    if(c.tipo==='criatura'){for(let i=0;i<4;i++){if(tier==='facil'&&S.lanes[i].c)continue;out.push({inst,lane:i});}}
    else if(c.tipo==='construcao'){for(let i=0;i<4;i++)out.push({inst,lane:i});}
    else alvosLegais(B,P,inst).forEach(t=>out.push({inst,lane:t.lane}));
  });
  return out;
}
function pontuar(B,P,o){
  const S=B.sides[P],O=B.sides[opp(P)],c=CARD[o.inst.id];
  const v4=!B.tut;
  if(c.tipo==='criatura'){
    const me=prospecto(B,P,o.inst,o.lane);let sc=V(me,B);if(me.aff)sc+=3;
    const E=O.lanes[o.lane].c;
    const voa=me.kw.voar&&!regraAtiva(B,'ventania');
    if(E){if(me.atk>=E.hp)sc+=2;if(effAtk(E)<me.hp)sc+=2;
      // bloquear um golpe que iria no meu herói (não conta se uma Guarda minha já pegaria esse golpe)
      if(!S.lanes[o.lane].c){const aE=alvoReal(B,opp(P),o.lane,E);if(!aE.guarda)sc+=1.5*effAtk(E);}
      if(voa&&!E.kw.voar&&!E.kw.bloqueiaVoo)sc+=me.atk;}
    else{const ag=alvoReal(B,P,o.lane,me);sc+=ag.guarda?0.5*me.atk:me.atk;}
    if(me.kw.guarda)sc+=[o.lane-1,o.lane+1].filter(j=>j>=0&&j<4&&!S.lanes[j].c).length;
    sc+=fxBonus(B,P,c,o.lane,me);
    if(v4){
      sc+=IA_FAM*(valorFamLado(B,P,{lane:o.lane,id:o.inst.id})-valorFamLado(B,P));
      for(const x of duplasCompletas(B,P,o.lane,o.inst.id))sc+=IA_DUPLA*x.D.val;
    }
    const Ol=S.lanes[o.lane].c;
    if(Ol){if(!(V(me,B)>V(Ol,B)+IA_TROCA))return -999;sc-=V(Ol,B)+2;}
    return sc+bonusCombo(B,P,o,sc,me);
  }
  if(c.tipo==='construcao'){
    const op=c.fx[0].op,L=S.lanes[o.lane];let sc;
    if(op==='inicioEnergia')sc=B.round<=5?6:2;
    else if(op==='inicioBuffLane')sc=3+(L.c?2:0);
    else if(op==='inicioNinhada')sc=(B.round<=6?5:3)+(!L.c?2:0);
    else if(op==='inicioTrator'){sc=3;if(vivoC(L.c)&&effAtk(L.c)>=2){sc+=2;if(O.lanes[o.lane].c)sc+=1;}}
    else sc=2+(L.c&&O.lanes[o.lane].c?3:0);
    if(L.b)sc-=10;
    // não precisa de duas iguais
    if(S.lanes.some(x=>x.b&&x.b.id===o.inst.id))sc-=4;
    if(v4)for(const x of duplasCompletas(B,P,o.lane,o.inst.id))sc+=IA_DUPLA*x.D.val;
    return sc+bonusCombo(B,P,o,sc);
  }
  const sc=pontuarFeitico(B,P,o);
  return sc==null?null:sc+bonusCombo(B,P,o,sc);
}
/* Combo: desempate pequeno (nunca deixa positiva uma jogada ruim) */
function bonusCombo(B,P,o,sc,me){
  if(B.tut||!(sc>0)||!B.seq)return 0;
  const q=B.seq[P],S=B.sides[P],cri=CARD[o.inst.id].tipo==='criatura';
  if(CARD[o.inst.id].tipo==='feitico'&&!COMBO.feiticos)return 0;
  const T=CARD[o.inst.id].fx.some(f=>f.op==='sequenciaMenos')?COMBO.limiarSanf:limiarCombo(B,P);
  if(!q.atk&&q.n+1>=T){
    // +1 ATK para quem está acordado (a criatura nova conta se tiver Fúria)
    let k=S.lanes.filter((L,i)=>!(cri&&i===o.lane)&&vivoC(L.c)&&!L.c.rest&&!L.c.raiz).length;
    if(cri&&me&&!me.rest)k++;
    return IA_COMBO*k;
  }
  if(q.atk&&q.dano<COMBO.danoMax)return IA_COMBO*1.5;
  return 0;
}
/* Pamonha: só depois das outras jogadas (como o Vento Dourado) */
function pamonhaScore(B,P,o){
  const S=B.sides[P],O=B.sides[opp(P)],T=S.lanes[o.lane].c,n=nVal(o.inst);
  if(!vivoC(T)||T.raiz)return -999;
  const al=alvoReal(B,P,o.lane,T);
  let G=null,red=0;
  if(al.tipo==='criatura'){G=O.lanes[al.lane].c;red=reducaoAtaque(B,opp(P),al.lane).n;}
  if(!T.rest&&G&&effAtk(T)-red>=G.hp&&!temPisotear(B,T))return -999;
  let sc=(n+(T.rest?effAtk(T):0))*(al.tipo==='heroi'?1.5:1);
  if(G){const agora=T.rest?0:effAtk(T)-red;if(agora<G.hp&&effAtk(T)+n-red>=G.hp)sc+=3;}
  return sc;
}
function pontuarFeitico(B,P,o){
  const S=B.sides[P],O=B.sides[opp(P)],c=CARD[o.inst.id];
  const op=c.fx[0].op,n=nVal(o.inst);
  if(op==='danoCriatura'){const E=O.lanes[o.lane].c;return n>=E.hp?effAtk(E)+E.hp+CARD[E.id].custo:0.5*n-1;}
  if(op==='danoEnraiza'){const E=O.lanes[o.lane].c;
    if(n>=E.hp)return effAtk(E)+E.hp+CARD[E.id].custo;
    if(E.raiz)return -999;
    return 0.5*n+effAtk(E)*(bateFace(B,P,o.lane)?1.5:1);}
  if(op==='vidaTimeCura'){const cs=S.lanes.filter(L=>vivoC(L.c)).map(L=>L.c);if(!cs.length)return -999;
    return cs.reduce((a,x)=>a+n+(x.maxHp-x.hp),0)*0.7-1.5;}
  if(op==='buffAliadaTemp')return null; // tratado à parte (por último), como o Vento
  if(op==='destroiSeVidaAte'){const E=O.lanes[o.lane].c;return V(E)+CARD[E.id].custo;}
  if(op==='perdeAtk'){
    const E=O.lanes[o.lane].c,g=Math.min(n,effAtk(E));if(g<=0)return -999;
    const face=bateFace(B,P,o.lane);
    return face?1.5*g:g;
  }
  if(op==='buffAliada'||op==='vidaMaisCuraTotal'){
    const T=S.lanes[o.lane].c,E=O.lanes[o.lane].c;
    if(T.rest&&!E)return -999;
    const a=op==='buffAliada'?(c.fx[0].a!=null?c.fx[0].a:n):0;
    const h=op==='buffAliada'?(c.fx[0].h!=null?c.fx[0].h:n):n+(T.maxHp-T.hp);
    let sc=a*1.5+h;
    if(!T.rest&&!T.raiz){const al=alvoReal(B,P,o.lane,T);
      if(al.tipo==='criatura'){const G=O.lanes[al.lane].c,cer=reducaoAtaque(B,opp(P),al.lane).n;if(effAtk(T)-cer<G.hp&&effAtk(T)+a-cer>=G.hp)sc+=3;}}
    if(E&&effAtk(E)>=T.hp&&effAtk(E)<T.hp+h)sc+=2;
    return sc;
  }
  if(op==='buffTimeTemp')return null; // tratado à parte (por último)
  return 0;
}
const cp=o=>JSON.parse(JSON.stringify(o));
function simClone(B){return {tut:false,rival:B.rival,arena:B.arena,tier:B.tier,round:B.round,turn:B.turn,over:false,result:null,sides:cp(B.sides),ev:[],log:[],stats:{criaturas:0,feiticos:0,danoHeroi:0,abates:0,duplas:0,combos:0},
  modo:B.modo,regra:B.regra||null,rodadaColheita:B.rodadaColheita||null,etapa:B.etapa,
  duplas:cp(B.duplas||{p:[],r:[]}),duplasLog:[],seq:cp(B.seq||{p:{n:0,atk:false,dano:0},r:{n:0,atk:false,dano:0}}),famNiv:cp(B.famNiv||{p:{},r:{}}),famVisto:cp(B.famVisto||{p:{},r:{}})};}
function danoFace(B,P){
  let F=0;B.sides[P].lanes.forEach((L,i)=>{const c=L.c;if(!podeAtacar(c)||c.lua)return;if(alvoReal(B,P,i,c).tipo==='heroi')F+=effAtk(c)*(c.kw.ataqueDuplo?2:1);});return F;
}
/* dano que as criaturas de Q causariam no herói rival no próximo turno de Q (todas acordadas) */
function ameaca(B,Q){
  let F=0;const O=B.sides[opp(Q)];
  B.sides[Q].lanes.forEach((L,i)=>{const c=L.c;if(!c||c.dead||c.raiz)return;const a=Math.max(0,c.atk+(c.famAtk||0));if(!a)return;
    const al=alvoReal(B,Q,i,c),vezes=c.kw.ataqueDuplo?2:1;
    if(al.tipo==='heroi')F+=a*vezes;
    else{const E=O.lanes[al.lane].c;if(temPisotear(B,c)&&a>E.hp)F+=a-E.hp;}});
  return F;
}
/* avaliação do tabuleiro depois do combate (Difícil) */
function avaliar(C,P){
  if(C.over)return C.result===(P==='r'?'derrota':'vitoria')?1000:C.result==='empate'?0:-1000;
  const val=Q=>C.sides[Q].lanes.reduce((a,L)=>a+(L.c&&!L.c.dead?V(L.c,C):0),0);
  return val(P)-val(opp(P))+IA_WH*(C.sides[P].hp-C.sides[opp(P)].hp)-IA_WA*ameaca(C,opp(P));
}
function avaliarComCombate(T,P){const C=simClone(T);combateSync(C,P);if(!C.over)fimTurno(C,P);return avaliar(C,P);}
function letalApos(T,P,hpRival){return (T.over&&T.result===(P==='r'?'derrota':'vitoria'))||danoFace(T,P)>=hpRival;}
function escolhaIA(B,P,tier,jogadas){
  if(tier==='facil'&&jogadas>=IA_FACIL_MAX)return null;
  const S=B.sides[P];
  const ops=opcoesIA(B,P,tier);if(!ops.length)return null;
  const sc=ops.map(o=>({o,sc:pontuar(B,P,o)}));
  const vento=sc.filter(x=>x.sc===null),outros=sc.filter(x=>x.sc!==null);
  if(tier==='dificil'){
    // Difícil: simula cada jogada; procura vitória (em 1 ou 2 jogadas), dano no herói agora e defesa para o próximo turno
    const hpRival=B.sides[opp(P)].hp;
    const base=avaliarComCombate(B,P);
    let algumLetal=false;
    const sims=[];
    for(const x of outros){
      if(x.sc==null||x.sc<=-999)continue;
      const T=simClone(B);jogarSync(T,P,x.o.inst.uid,x.o.lane);
      if(letalApos(T,P,hpRival)){x.sc+=50;algumLetal=true;continue;}
      const op=CARD[x.o.inst.id].fx[0]&&CARD[x.o.inst.id].fx[0].op;
      if((op==='danoCriatura'||op==='destroiSeVidaAte')){const E=B.sides[opp(P)].lanes[x.o.lane].c;if(E&&V(E,B)<5)x.sc=-1;}
      if(x.sc>0)x.sc+=IA_WE*(avaliarComCombate(T,P)-base);
      sims.push({x,T});
    }
    // vitória em duas jogadas (só quando o rival está perto de cair)
    if(!algumLetal&&hpRival<=12){
      sims.sort((a,b)=>b.x.sc-a.x.sc);
      for(const {x,T} of sims.slice(0,8)){
        if(x.sc<=0)continue;
        const ops2=opcoesIA(T,P,tier);
        if(ops2.some(o2=>{if(o2.inst.uid===x.o.inst.uid)return false;const T2=simClone(T);jogarSync(T2,P,o2.inst.uid,o2.lane);return letalApos(T2,P,hpRival);})){x.sc+=40;break;}
      }
    }
  }
  let pos=outros.filter(x=>x.sc>0);
  if(!pos.length&&vento.length){
    const cri=S.lanes.filter(L=>L.c);
    for(const v of vento){const n=nVal(v.o.inst),op=CARD[v.o.inst.id].fx[0].op;
      if(op==='buffAliadaTemp'){v.sc=pamonhaScore(B,P,v.o);if(v.sc>0)v.sc+=bonusCombo(B,P,v.o,v.sc);continue;}
      v.sc=cri.length>=2?cri.reduce((a,L)=>a+n+(L.c.rest?effAtk(L.c)+n:0),0):-1;}
    pos=vento.filter(x=>x.sc>0);
  }
  if(!pos.length)return null;
  pos.sort((a,b)=>b.sc-a.sc);
  let pickd=pos[0];
  const rnd1=rnd();
  if(tier==='facil'&&rnd1<0.4)pickd=pick(pos);
  else if(tier==='medio'&&rnd1<0.1)pickd=pick(pos);
  if(tier==='facil'){
    const c=CARD[pickd.o.inst.id];
    if(c.tipo==='feitico'&&c.alvo&&rnd()<0.5){const alts=ops.filter(o=>o.inst.uid===pickd.o.inst.uid);pickd={o:pick(alts),sc:1};}
  }
  return pickd.o;
}
function nivelIA(arena,rar){
  if(arena<=3)return arena<=1?1:2;
  if(arena===4)return 2;
  return rar==='comum'?5:4; // v4: A5 um nível acima (as famílias ajudam mais o deck inicial do que a Vovó)
}
function montarDeck(lista,lvlFn){const d=[];for(const id of lista)d.push(mkInst(id,lvlFn(id)));return d;}
function deckDeMapa(m){const l=[];for(const id in m)for(let i=0;i<m[id];i++)l.push(id);return l;}

