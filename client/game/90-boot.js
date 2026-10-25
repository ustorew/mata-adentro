/* ===================== PARTIDA DO JOGO ===================== */
let ultimoEco=Date.now(),ultimoDia=0;
function relogio(){
  if(!s)return;
  const now=Date.now();
  // baús
  let mudou=false;
  for(const b of s.baus)if(b&&b.estado==='abrindo'&&now>=b.fim){bauEstado(b);mudou=true;}
  if(UI.started&&!inBattle&&UI.tab==='inicio'){
    if(mudou)refresh();
    else s.baus.forEach((b,i)=>{if(!b||b.estado!=='abrindo')return;const t=$(`[data-timer="${i}"]`);if(t)t.textContent=mmss(restanteBau(b));const r=$(`[data-ring="${i}"]`);if(r)r.setAttribute('stroke-dasharray',((1-restanteBau(b)/tempoBau(b))*50.3).toFixed(1)+' 60');});
  }
  const ts=$('[data-timer-s]');if(ts){const b=s.baus.find(x=>x&&x.estado==='abrindo');if(b)ts.textContent=mmss(restanteBau(b));}
  if(mudou&&!inBattle){toast('Um tesouro está pronto para abrir!');sfx('bauPronto');}
  // mercado: 1 tique a cada 20 s
  let n=0;
  while(now-s.mercado.ultimoTick>=TICK_MS&&n<30){mercadoTick();s.mercado.ultimoTick+=TICK_MS;n++;}
  if(now-s.mercado.ultimoTick>=TICK_MS)s.mercado.ultimoTick=now;
  if(n){save();if(UI.started&&!inBattle&&UI.tab==='mercado'&&!OVS.length)renderMList();}
  // amostra da economia a cada 60 s
  if(now-ultimoEco>=60000){ultimoEco=now;ecoSample();save();}
  // virada do dia (a cada 30 s)
  if(now-ultimoDia>=30000){ultimoDia=now;if(garantirMissoes()&&UI.started&&!inBattle)refresh();}
}
setInterval(relogio,1000);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&s)saveNow();});
window.addEventListener('pagehide',()=>{if(s)saveNow();});
let resizeT=0;
window.addEventListener('resize',()=>{clearTimeout(resizeT);resizeT=setTimeout(()=>{if(UI.started&&!inBattle)refresh();},150);});

async function start(data){
  data=data||{};
  let veioDoHot=false;
  if(data.s&&validState(data.s)){s=fixState(data.s);veioDoHot=true;}
  else s=loadLS();
  const novo=!s;
  if(!s)s=freshState();
  mercadoInitHist();mercadoCatchUp();garantirMissoes();
  if(!s.eco.hist.length)ecoSample();
  saveNow();
  $('#app').hidden=false;UI.started=true;refresh();
  musica('fazenda');
  if(!veioDoHot)await telaAbertura(!novo);
  const ab=cobrarPartidaAbandonada();
  if(ab){refresh();toast('A partida anterior não terminou e contou como desistência'+(ab.perdeu?` (−${ab.perdeu} troféus)`:'')+'.',{ms:6000});}
  if(s.guia===0){await telaPresente();s.guia=1;saveNow();iniciarTutorial();}
  else if(s.guia===1&&!s.tutorialFeito)iniciarTutorial();
  else if(s.guia===2)await fluxoPresente();
  else if(s.guia===3){UI.tab='inicio';refresh();abrirDetalhe('espiga-sapeca',{guia:true});vovo('Ó, meu filho: toque para melhorar!',{pos:'top',ok:false,foco:false});}
  else{refresh();setTimeout(()=>{if(OVS.length||inBattle)return;const a=document.activeElement;if(a&&a!==document.body)return;const bt=$('[data-act="batalhar"]');if(bt&&!bt.disabled)try{bt.focus({preventScroll:true});}catch(e){}},80);}
}

/* gancho de teste (inofensivo) */
window.__CG={
  get s(){return s;},
  get B(){return B;},
  eng:{novaBatalha,mkInst,invocar,ataque,varrer,combateSync,jogarSync,fimDeJogo,fimPorRodadas,iniciarTurno,fimTurno,escolhaIA,alvosLegais,marcarMortes,maoInicial,montarDeck,deckDeMapa,shuffle,nivelIA,RIVAIS,STARTER,ARENAS,CARD},
  ecoInvariante,ecoTotais,cardCusto:Object.fromEntries(CARDS.map(c=>[c.id,c.custo])),cardRar:Object.fromEntries(CARDS.map(c=>[c.id,c.rar]))
  
};
// online: primeiro a conta e o jogo salvo na nuvem (85-online.js), depois o jogo de sempre
onlineBoot(start);

