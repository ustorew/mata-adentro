/* ===================== v4: MODOS DE BATALHA (núcleo, sem interface) =====================
 Arena (a escada de sempre), Treino, Desafio do Dia e Torneio da Feira.
 A interface (60-battle / 80-ui) só monta a tela; as contas ficam aqui e em 20-core.

 ---- funções para a interface ----
 prepararPartida(o) -> B | null
     o = {modo:'arena'|'treino'|'desafio'|'torneio', rival?, tier?, regra?, nivel?:(rar)=>lvl, hpP?, etapa?}
     Arena: usa a arena atual. Treino: usa o (ou s.treino) e guarda a escolha em s.treino.
     Desafio: regra e rival do dia (desafioDoDia), no nível do jogador; conta s.desafio.tentativas e marca s.codex.regras.
     Torneio: a etapa de s.torneio.ativo, com a vida que sobrou (null se não há torneio ativo).
     Monta os decks, chama novaBatalha (que já aplica seca/colheita), as mãos (6 cartas no Mutirão)
     e marcarPartida(arena,modo) para Arena e Torneio. NÃO abre a tela nem chama iniciarTurno.
     Uso típico em iniciarPartida(o):
       B=prepararPartida(o); abrirBatalha(); iniciarTurno(B,'p'); B.ev=[]; BU.busy=false; bRender();
       log(B,'Partida contra '+RIVAIS[B.rival].nome+'! Você começa.'); B.ev=[]; eventoRegra(B); bRender(); tocarEventos(); focarMao();
 eventoRegra(B) -> regra|null          emite {t:'regra',id,nome,txt} + linha no Diário (chamar depois de limpar B.ev)
 fecharPartida(B) -> resultado         contas do fim de partida para TODOS os modos (troca o miolo de terminar()):
     {res, modo, antesTr, depoisTr, pay:{g,cap}, bau, novaArena, porTempo, desistiu,
      premio (Desafio: {pacotes,po} na 1ª vitória do dia), jaPego (Desafio já pago hoje), contouTreino,
      torneio:{etapa, nome, fim, premio (de encerrarTorneio, quando acabou), prox:{etapa,nome,rival,tier,hp}}}
     Arena = exatamente as contas de hoje (troféus, pagarPartida, darBau, missões, stats) + duplas/Combos.
 jogarTreino(), jogarDesafio(), jogarTorneio() -> o pronto para iniciarPartida(o) (ou null)
 descricaoModo(B) -> 'Treino' | 'Desafio' | 'Torneio · Final' | ''   (selo na barra de cima)
 infoTorneio() -> {liberado, ativo, etapa, etapaNome, rival, tier, hp, vitorias, entradas, maxDia, taxa, motivo, premios, titulos}
 infoDesafio() -> {liberado, regra, rival, venceu, tentativas, total, msRestante}
 Em 20-core: entrarTorneio() -> {ok,motivo?,ativo?}; encerrarTorneio() -> prêmio|null; motivoTorneio();
   garantirModos(); desafioDoDia(d?) -> {dia,regra,rival,nomeRegra,txt}; marcarPartida(arena,modo);
   cobrarPartidaAbandonada() -> null | {perdeu} | {torneio:true,perdeu:0,premio};
   rivaisTreino(); regrasVistas(); arenaDoRival(id); modoLiberado('treino'|'desafio'|'torneio'); msAteAmanha();
   premioTorneioTxt(P).
 Regras na tela: horaColheita(B) (a Colheita Antecipada usa B.rodadaColheita, não RODADA_FURIA); REGRA[id].{nome,txt,ic}.
 Eventos novos em B.ev (spec v4, seção 12): combo{P,lanes,nome,cor,id,txt} · familia{P,fam,nivel,antes,lanes,cor,primeira} ·
   sequencia{P,n,efeito:'atk'|'dano'} · regra{id,nome,txt} · grito{P,lane,id} · ninhada{P,de,para,ficha} · acorda{P,lanes} ·
   raiz{P,lane,on} · guarda{P,de,para} · reduz{P,lane,n,fonte:'couraca'|'cerca'} · festa{P,de,para} · lua{P,lane} (Lua Cheia: não
   atacou o herói) · atk ganhou alvoLane · spell kind 'pamonha'|'cipo'|'chuva' · buff com txt ('Nhac! +1 ATK', '+1 Couraça', '+n ATK e Pisotear').
*/
function prepararPartida(o){
  o=Object.assign({modo:'arena'},o||{});
  if(o.modo==='arena'){const A=arenaDef();Object.assign(o,{rival:A.rival,tier:A.tier,arena:A.n,nivel:r=>nivelIA(A.n,r),regra:null});}
  else if(o.modo==='treino'){
    const t=s.treino;
    o.rival=o.rival||t.rival;if(!RIVAIS[o.rival]||!RIVAIS[o.rival].deck)o.rival='tonico';
    o.tier=TIER_NOME[o.tier]?o.tier:(TIER_NOME[t.tier]?t.tier:'facil');
    if(o.regra===undefined)o.regra=t.regra;if(o.regra&&!REGRA[o.regra])o.regra=null;
    s.treino={rival:o.rival,tier:o.tier,regra:o.regra||null};
    const ar=arenaDoRival(o.rival);
    o.nivel=o.nivel||(r=>nivelIA(ar,r));o.arena=ar;
  }else if(o.modo==='desafio'){
    const d=desafioDoDia();
    Object.assign(o,{rival:d.rival,regra:d.regra,tier:arenaDef().tier,arena:arenaMax(),nivel:r=>nivelIA(arenaMax(),r)});
  }else if(o.modo==='torneio'){
    const a=s.torneio.ativo;if(!a)return null;
    const E=TORNEIO.etapas[a.etapa];if(!E)return null;
    Object.assign(o,{etapa:a.etapa,rival:E.rival,tier:E.tier,hpP:a.hp,arena:arenaMax(),regra:null,
      nivel:r=>Math.min(5,nivelIA(arenaMax(),r)+(a.etapa===TORNEIO.etapas.length-1?TORNEIO.finalNv:0))});
  }else return null;
  const R=RIVAIS[o.rival];if(!R||!R.deck)return null;
  const pDeck=shuffle(montarDeck(s.deck.cartas,id=>lvlOf(id)));
  const rDeck=shuffle(montarDeck(deckDeMapa(R.deck),id=>o.nivel(CARD[id].rar)));
  const B=novaBatalha({modo:o.modo,regra:o.regra||null,etapa:o.etapa,rival:o.rival,arena:o.arena||arenaMax(),tier:o.tier,
    p:{hp:clamp(o.hpP||20,1,20),maxHp:20,deck:pDeck,lanes:s.deck.terrenos.slice(),nome:'Você'},
    r:{hp:20,deck:rDeck,lanes:R.lanes.slice(),nome:R.nome}});
  const nm=B.regra==='mutirao'?6:4;maoInicial(B.sides.p,nm);maoInicial(B.sides.r,nm);
  if(o.modo==='arena'||o.modo==='torneio')marcarPartida(B.arena,o.modo);
  if(o.modo==='desafio'){garantirModos();s.desafio.tentativas++;}
  if(B.regra&&o.modo==='desafio')s.codex.regras[B.regra]=1;
  save();
  return B;
}
function eventoRegra(B){
  if(!B||!B.regra)return null;
  const G=REGRA[B.regra];
  ev(B,{t:'regra',id:G.id,nome:G.nome,txt:G.txt});
  log(B,'Regra'+(B.modo==='desafio'?' do dia':' especial')+': '+G.nome+'. '+G.txt);
  return G;
}
const jogarTreino=()=>({modo:'treino',rival:s.treino.rival,tier:s.treino.tier,regra:s.treino.regra});
const jogarDesafio=()=>modoLiberado('desafio')?{modo:'desafio'}:null;
const jogarTorneio=()=>s.torneio.ativo?{modo:'torneio'}:null;
function descricaoModo(B){
  if(!B||B.tut)return '';
  if(B.modo==='treino')return 'Treino';
  if(B.modo==='desafio')return 'Desafio';
  if(B.modo==='torneio'){const E=TORNEIO.etapas[B.etapa];return 'Torneio'+(E?' · '+(B.etapa===TORNEIO.etapas.length-1?'Final':E.nome):'');}
  return '';
}
function infoTorneio(){
  const a=s.torneio.ativo,E=a?TORNEIO.etapas[a.etapa]:null;
  return {liberado:modoLiberado('torneio'),ativo:!!a,etapa:a?a.etapa:-1,etapaNome:E?E.nome:null,rival:E?E.rival:null,tier:E?E.tier:null,
    hp:a?a.hp:20,vitorias:a?a.vitorias:0,entradas:s.torneio.entradas,maxDia:TORNEIO.maxDia,taxa:TORNEIO.taxa,
    motivo:a?null:motivoTorneio(),premios:TORNEIO.premios,titulos:s.torneio.titulos,melhor:s.torneio.melhor};
}
function infoDesafio(){
  const d=desafioDoDia();
  return {liberado:modoLiberado('desafio'),regra:d.regra,rival:d.rival,venceu:!!s.desafio.venceu,tentativas:s.desafio.tentativas,total:s.desafio.total,msRestante:msAteAmanha()};
}
/* contas do fim da partida, por modo (ver tabela 5.7 da spec v4) */
function fecharPartida(B){
  const res=B.result,modo=B.modo||'arena',st=B.stats;
  const out={res,modo,antesTr:s.trofeus,depoisTr:s.trofeus,pay:{g:0,cap:false},bau:null,novaArena:0,porTempo:!!B.porTempo,desistiu:!!B.desistiu};
  const contaBatalha=()=>{
    missaoEv('criatura',st.criaturas);missaoEv('feitico',st.feiticos);missaoEv('danoHeroi',st.danoHeroi);missaoEv('abate',st.abates);
    missaoEv('dupla',st.duplas||0);missaoEv('sequencia',st.combos||0);
    s.stats.criaturasJogadas+=st.criaturas;s.stats.feiticosJogados+=st.feiticos;s.stats.danoHeroi+=st.danoHeroi;s.stats.abates+=st.abates;
    s.stats.duplas+=st.duplas||0;s.stats.combos+=st.combos||0;
  };
  if(modo==='arena'){
    const A=arenaDef(B.arena);let trof=0;
    if(res==='vitoria'){trof=30;s.stats.vitorias++;out.pay=pagarPartida(A.win);out.bau=darBau();missaoEv('vitoria',1);}
    else if(res==='derrota'){trof=arenaMax()===1?0:-15;s.stats.derrotas++;if(!B.desistiu)out.pay=pagarPartida(5);}
    else{s.stats.empates++;out.pay=pagarPartida(10);}
    out.novaArena=mudarTrofeus(trof);
    s.partida=null;
    contaBatalha();
  }else if(modo==='treino'){
    s.stats.treinos++;
    if(B.round>=1&&!(B.desistiu&&B.round<=1)){missaoEv('treino',1);out.contouTreino=true;}
  }else if(modo==='desafio'){
    contaBatalha();
    if(res==='vitoria'){
      missaoEv('vitoria',1);
      if(!s.desafio.venceu){
        const P=DESAFIO.premio;
        for(const k in P.pacotes)s.pacotes[k]=(s.pacotes[k]||0)+P.pacotes[k];
        ganharPo(P.po);s.desafio.venceu=true;s.desafio.total++;s.stats.desafios++;missaoEv('desafio',1);
        out.premio={pacotes:Object.assign({},P.pacotes),po:P.po};
      }else out.jaPego=true;
    }
  }else if(modo==='torneio'){
    s.partida=null;
    contaBatalha();
    const a=s.torneio.ativo;
    if(a){
      const E=TORNEIO.etapas[a.etapa];out.torneio={etapa:a.etapa,nome:E?E.nome:''};
      if(res==='vitoria'){
        missaoEv('vitoria',1);
        a.vitorias++;a.hp=Math.min(20,Math.max(1,B.sides.p.hp)+TORNEIO.cura);a.etapa++;
        if(a.etapa>=TORNEIO.etapas.length){out.torneio.fim=true;out.torneio.premio=encerrarTorneio();}
        else out.torneio.prox=Object.assign({etapa:a.etapa,hp:a.hp},TORNEIO.etapas[a.etapa]);
      }else{out.torneio.fim=true;out.torneio.premio=encerrarTorneio();}
    }
  }
  out.depoisTr=s.trofeus;
  ecoSample();saveNow();
  return out;
}

/* ---- funções novas no gancho de teste (window.__CG.eng), que 90-boot cria depois deste arquivo ---- */
(function(){
  const extra=()=>({alvoReal,alvoAtaque,podeAtacar,effAtk,reducaoAtaque,temBrotar,temPisotear,horaColheita,buff,danoCriatura,danoHeroi,
    jogarCarta,aoEntrar,feitico,comprar,simClone,pontuar,opcoesIA,prospecto,V,fxBonus,pamonhaScore,bonusCombo,
    recalcFamilias,contaFamilias,nivelFamilia,valorFamLado,duplasCompletas,checaDuplas,checaSequencia,limiarCombo,v4On,
    prepararPartida,fecharPartida,eventoRegra,descricaoModo,infoTorneio,infoDesafio,
    desafioDoDia,diaNum,entrarTorneio,encerrarTorneio,motivoTorneio,garantirModos,garantirMissoes,marcarPartida,cobrarPartidaAbandonada,
    rivaisTreino,regrasVistas,arenaDoRival,modoLiberado,missaoLiberada,freshState,fixState,validState,queimadoVoce,missaoEv,
    FAMILIAS,FAM_ORDEM,DUPLAS,DUPLA,REGRAS,REGRA,DESAFIO,TORNEIO,COMBO,KW_INFO,KW_ORDEM,MISSOES,MISSAO,MIGRACAO,CARDS,COLECAO});
  const juntar=v=>{try{if(v&&v.eng&&!v.eng.recalcFamilias)Object.defineProperties(v.eng,Object.getOwnPropertyDescriptors(extra()));}catch(e){}};
  try{
    if(window.__CG)juntar(window.__CG);
    else{let cg;Object.defineProperty(window,'__CG',{configurable:true,enumerable:true,get(){return cg;},set(v){cg=v;juntar(v);}});}
  }catch(e){}
})();

