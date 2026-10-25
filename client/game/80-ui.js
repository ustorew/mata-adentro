/* ===================== INTERFACE: casca, telas, folhas ===================== */
const $=(q,r)=>(r||document).querySelector(q);
const $$=(q,r)=>[...(r||document).querySelectorAll(q)];
const UI={tab:'inicio',sub:'colecao',cf:{terr:null,rar:null,tenho:false,fam:null,novas:false},mf:{q:'',terr:null,rar:null,extra:false,sort:'preco'},odds:{},started:false};
const TABS=[['inicio','Início'],['cartas','Cartas'],['loja','Loja'],['mercado','Feira'],['vila','Vila'],['economia','Economia']];
const isDesk=()=>window.innerWidth>=900;
let inBattle=false;

function muteBtn(cls){return `<button class="ibtn ${cls||''}" data-act="mute" aria-pressed="${s.mudo?'true':'false'}" aria-label="${s.mudo?'Ligar o som':'Desligar o som'}" title="${s.mudo?'Ligar o som':'Desligar o som'}">${ic(s.mudo?'mudo':'som',18)}</button>`;}
function musBtn(){const off=!!s.semMusica;return `<button class="ibtn" data-act="musica" aria-pressed="${off?'false':'true'}" aria-label="${off?'Ligar a música':'Desligar a música'}" title="${off?'Ligar a música':'Desligar a música'}">${ic(off?'semmusica':'musica',18)}</button>`;}
function lojaDot(){return (s.pacotes.semente+s.pacotes.colheita>0)||s.grao>=PACKS.semente.preco;}
function tabsHTML(){
  return TABS.map(([k,n])=>`<button data-go="${k}" data-k="tab-${k}" ${UI.tab===k?'aria-current="page"':''}>${ic(k,20)}<span>${n}</span>${k==='loja'&&lojaDot()&&s.guia>=6?'<i class="dot" aria-label="tem pacote"></i>':''}${k==='cartas'&&s.guia>=7&&duplaPendente()?'<i class="dot" aria-label="tem dupla para descobrir"></i>':''}</button>`).join('');
}
function renderTop(){
  $('#top').innerHTML=`<div class="logo"><span class="titulo-rye">${escH(TEMA.jogo.nome)}</span></div><nav class="tabsD" aria-label="Navegação">${tabsHTML()}</nav>
  <div class="wallet">
    <button class="pill grao" data-go="economia" data-k="pill-grao" title="${MOEC}: moeda simulada · sem dinheiro real" aria-label="${MOEC} ${fmt(s.grao)}, moeda simulada, sem dinheiro real">${ic('coin',18)}<span class="gv"><b class="num" id="wGrao">${fmt(s.grao)}</b><small>moeda simulada</small><small>sem dinheiro real</small></span></button>
    <span class="pill po" id="wPo" title="${BRAS}">${ic('po',16)}<b>${fmt(s.po)}</b><span class="sr">${BRAS}</span></span>
    <span class="pill tr" title="Troféus">${ic('trofeu',16)}<b>${fmt(s.trofeus)}</b><span class="sr">troféus</span></span>
    ${musBtn()}${muteBtn()}
  </div>`;
  $('#bnav').innerHTML=tabsHTML();
}
function refresh(){
  if(!s||!UI.started)return;
  const ae=document.activeElement,k=ae&&ae.dataset?ae.dataset.k:null;
  renderTop();
  const m=$('#main');
  if(UI.tab==='inicio')renderInicio(m);
  else if(UI.tab==='cartas')renderCartas(m);
  else if(UI.tab==='loja')renderLoja(m);
  else if(UI.tab==='mercado')renderMercado(m);
  else if(UI.tab==='vila'&&typeof renderVila==='function')renderVila(m);
  else (typeof renderEconomiaV10==='function'?renderEconomiaV10:renderEconomia)(m);
  hydrateGfx(document.body);
  if(k){const el=document.querySelector(`[data-k="${CSS.escape(k)}"]`);if(el&&el!==document.activeElement)try{el.focus({preventScroll:true});}catch(e){}}
  guiaDepoisRender();
}
function go(tab){if(UI.tab!==tab){sfx('aba');UI.tab=tab;window.scrollTo(0,0);if(guiaBolha&&tab!=='inicio'){vovoFechar();guiaBolha=0;}}refresh();}

/* ---------- sobreposições, folhas, confirmações, toasts ---------- */
const OVS=[];
function focaveis(el){return $$('button:not([disabled]),[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',el).filter(x=>x.offsetParent!==null||x===document.activeElement);}
function abrirOv(el,o){
  o=o||{};
  $('#ovl').appendChild(el);
  const rec={el,closable:o.closable!==false,onClose:o.onClose,opener:document.activeElement};
  OVS.push(rec);
  hydrateGfx(el);
  setTimeout(()=>{const f=o.focus?$(o.focus,el):focaveis(el)[0];if(f)try{f.focus({preventScroll:true});}catch(e){}},30);
  return rec;
}
function fecharOv(el,silent){
  const i=OVS.findIndex(r=>r.el===el);if(i<0)return;
  const r=OVS.splice(i,1)[0];r.el.remove();
  if(!silent&&r.onClose)r.onClose();
  let op=r.opener;
  if(op&&!op.isConnected&&op.dataset&&op.dataset.k)op=document.querySelector(`[data-k="${CSS.escape(op.dataset.k)}"]`);
  if(op&&op.isConnected)try{op.focus({preventScroll:true});}catch(e){}
}
function topOv(){return OVS[OVS.length-1];}
document.addEventListener('keydown',e=>{
  const t=topOv();
  if(e.key==='Escape'&&t&&t.closable&&!t.el.classList.contains('rvov')){e.preventDefault();sfx('fechar');fecharOv(t.el);return;}
  if(e.key==='Tab'&&t){
    const f=focaveis(t.el);if(!f.length)return;
    const a=f[0],z=f[f.length-1];
    if(!t.el.contains(document.activeElement)){e.preventDefault();a.focus();return;}
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}
    else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}
  }
});
function abrirFolha(html,o){
  o=o||{};
  const ov=document.createElement('div');ov.className='ov';
  ov.innerHTML=`<div class="sheet ${o.cls||''}" role="dialog" aria-modal="true" aria-label="${escH(o.titulo||'Detalhes')}">
    <div class="sh"><h2>${o.tituloHTML||escH(o.titulo||'')}</h2><button class="ibtn" data-x aria-label="Fechar">✕</button></div>
    <div class="sbody">${html}</div></div>`;
  ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('[data-x]')){sfx('fechar');fecharOv(ov);}});
  abrirOv(ov,o);sfx('abrir');
  return ov;
}
function perguntar(texto,ok,o){
  o=o||{};
  return new Promise(res=>{
    let done=false;
    const ov=abrirFolha(`<div class="confirm"><p>${texto}</p><div class="acts"><button class="btn ${o.perigo?'danger':'gold'} md wide" data-ok>${escH(ok)}</button><button class="btn md wide" data-no>${escH(o.nao||'Cancelar')}</button></div></div>`,
      {titulo:o.titulo||'Confirmar',cls:'confirm',focus:'[data-ok]',onClose:()=>{if(!done){done=true;res(false);}}});
    $('[data-ok]',ov).onclick=()=>{done=true;fecharOv(ov,true);res(true);};
    $('[data-no]',ov).onclick=()=>{done=true;fecharOv(ov,true);res(false);};
  });
}
function toast(html,o){
  o=o||{};
  const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');
  t.innerHTML=`<span>${html}</span>${o.desfazer?'<button class="btn small" data-u>Desfazer</button>':''}`;
  $('#toasts').appendChild(t);
  if(o.desfazer)$('[data-u]',t).onclick=()=>{o.desfazer();t.remove();};
  setTimeout(()=>t.remove(),o.ms||(o.desfazer?5000:2600));
}
function toastDeck(id,r){
  if(!r)return;
  const nome=CARD[id].nome;
  const txt=r.sai?`<b>${escH(nome)}</b> entrou no deck no lugar de 1 <b>${escH(CARD[r.sai].nome)}</b>.`:`<b>${escH(nome)}</b> entrou no deck.`;
  toast(txt,{desfazer:()=>{s.deck.cartas=r.antes;save();refresh();toast('Deck desfeito.');}});
}

/* ---------- Vó Zinha (mentora) ---------- */
let vovoEl=null;
function vovo(texto,o){
  o=o||{};
  vovoFechar();
  return new Promise(res=>{
    let pos=o.pos||'nav';
    // na batalha (celular) a bolha fica embaixo da barra de cima, longe da mão e dos seus terrenos;
    // 'pl' fica por cima dos SEUS terrenos (quando o alvo é o terreno do rival)
    if(inBattle&&(pos==='top'||pos==='pl'||pos==='mid'||pos==='bottom')){if(isDesk())pos='side';else if(pos!=='pl')pos='btop';}
    const el=document.createElement('div');el.className='vovo v-'+pos;el.setAttribute('role','status');el.setAttribute('aria-live','polite');
    el.innerHTML=`<div class="vp">${artCanvas(retratoId('zinha'))}</div><div><b>${escH(TEMA.mentora.curto)}</b><p>${texto}</p>${o.ok!==false?'<div class="va"><button class="btn gold" data-vok>Ok</button></div>':''}<p class="warn2" hidden>Siga a ${escH(TEMA.mentora.curto)}!</p></div>`;
    document.body.appendChild(el);hydrate(el);vovoEl=el;sfx('bolha');
    if(pos==='btop'){const tb=$('#battle .btop');if(tb)el.style.top=Math.round(tb.getBoundingClientRect().bottom+4)+'px';}
    if(pos==='pl'){const l=$('#ln-p-0');if(l)el.style.top=Math.round(l.getBoundingClientRect().top)+'px';}
    const b=$('[data-vok]',el);
    if(b){b.onclick=()=>{vovoFechar();res(true);};if(o.foco!==false)setTimeout(()=>{try{b.focus({preventScroll:true});}catch(e){}},40);}
    else res(true);
  });
}
function vovoFechar(){if(vovoEl){vovoEl.remove();vovoEl=null;}}
function vovoShake(){sfx('erro');if(!vovoEl)return;vovoEl.classList.remove('shake');void vovoEl.offsetWidth;vovoEl.classList.add('shake');const w=$('.warn2',vovoEl);if(w)w.hidden=false;}

/* ---------- Início ---------- */
function proxArena(){return ARENAS[arenaMax()]||null;}
function renderInicio(m){
  garantirMissoes();
  const A=arenaDef(),R=RIVAIS[A.rival],P=proxArena();
  const okDeck=deckOk();
  const prog=P?clamp((s.trofeus-A.trof)/(P.trof-A.trof),0,1):1;
  let prox='';
  if(P){
    const novas=P.terr?novasDaArena(P.n):[];
    prox=`<div class="prox"><span>Próxima arena: <b>${escH(P.nome)}</b> · ${novas.length?novas.length+' cartas novas':'Rival mais difícil · mais '+MOE+' por vitória'}</span>${novas.length?`<span class="sil">${novas.slice(0,3).map(c=>artCanvas(c.id,{dark:true})).join('')}</span>`:''}</div>`;
  }
  const bw=Math.max(60,Math.round(Math.min(isDesk()?560:Math.min(window.innerWidth,1200)-32,560)/4));
  const arena=`<section class="panel arena-card a-arena" aria-label="Arena">
    <div class="banner"><canvas data-scene="${A.n}" width="${bw}" height="${isDesk()?40:30}"></canvas><div class="bt"><small>Arena ${A.n}</small><b>${escH(A.nome)}</b></div></div>
    <div class="arena-body">
      <div class="trbar"><span class="num">${ic('trofeu',14)} ${fmt(s.trofeus)}</span><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(prog*100)}"><i style="width:${prog*100}%"></i></div><span class="num muted">${P?fmt(P.trof)+' → '+escH(P.nome):'Arena máxima!'}</span></div>
      <div class="rival-row"><div class="rt">${artCanvas(R.retrato)}</div><div><small>Próximo rival</small><b>${escH(R.nome)}</b><span class="tier ${A.tier}">${TIER_NOME[A.tier]}</span></div></div>
      <button class="btn gold big ${s.guia===6?'pulse':''}" data-act="batalhar" data-k="batalhar" ${okDeck?'':'disabled'}>BATALHAR</button>
      ${okDeck?'':'<p class="warn">Seu deck precisa de 20 cartas. Arrume em Cartas › Meu deck.</p>'}
      ${s.tutorialFeito?modosHTML():''}
      ${prox}
    </div></section>`;
  const baus=`<section class="panel a-baus" aria-label="Tesouros"><div class="ph"><h3>Tesouros</h3><span class="muted" style="font-size:12px">Só um abre por vez</span></div><div class="slots">${s.baus.map((b,i)=>slotHTML(b,i)).join('')}</div>${typeof vigiaHTML==='function'?vigiaHTML():''}</section>`;
  const ms=s.missoes;const feitas=ms.lista.filter(x=>x.pego).length;
  const missoes=`<section class="panel a-missoes" aria-label="Missões do dia"><div class="ph"><h3>Missões do dia <span class="num muted">(${feitas}/3)</span></h3>${!ms.trocou&&ms.lista.some(x=>!x.pego)?'<button class="btn small" data-act="trocar" data-k="trocar">Trocar</button>':''}</div>
    ${ms.lista.map((x,i)=>{const M=MISSAO[x.id];const pr=x.prog/x.alvo;const pode=x.prog>=x.alvo&&!x.pego;
      return `<div class="missao ${x.pego?'feita':''}"><div class="mt">${escH(M.txt)}</div><div class="ml"><div class="bar green"><i style="width:${pr*100}%"></i></div><span class="c num">${fmt(x.prog)}/${fmt(x.alvo)}</span>${x.pego?'<span class="rw okmsg">Feita!</span>':pode?`<button class="btn gold small ${s.guia===5&&x.id==='melhorar1'?'hl':''}" data-act="pegarM" data-i="${i}" data-k="pegarM${i}">Pegar</button>`:`<span class="rw">${recHTML(M.rec)}</span>`}</div>${typeof trocaMissaoHTML==='function'?trocaMissaoHTML(i):''}</div>`;}).join('')}
    <div class="bonus">${packImg('semente',18)}<span>Bônus: ${escH(PACKS.semente.nome)} <span class="num">(${feitas}/3)</span>${ms.bonusPego?' · <b class="okmsg">pego!</b>':''}</span></div></section>`;
  const trilha=`<section class="panel a-trilha" aria-label="${TEMA.lugares.trilha}"><div class="ph"><h3>${TEMA.lugares.trilha}</h3><span class="muted num" style="font-size:12px">${ic('trofeu',12)} máx. ${fmt(s.trofeusMax)}</span></div><div class="trilha" id="trilha">${TRILHA.map(st=>{
      const ok=s.trilhaPega.includes(st.t),pode=trilhaPegavel(st);
      return `<div class="tstep ${ok?'ok':pode?'pode':'trav'}"><span class="tt">${ic('trofeu',12)}<span class="num">${st.t}</span></span><span>${escH(premioTxt(st))}</span>${ok?'<span class="okmsg">Pego</span>':pode?`<button class="btn gold small ${s.guia===6&&st.t===30?'hl':''}" data-act="pegarT" data-t="${st.t}" data-k="pegarT${st.t}">Pegar</button>`:`<span class="muted" style="font-size:11px">Faltam <b class="num">${fmt(st.t-s.trofeusMax)}</b></span>`}</div>`;}).join('')}</div></section>`;
  const mov=COLECAO.map(c=>({c,v:variacao(c.id)})).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v)).slice(0,3);
  const merc=`<section class="panel a-merc movers" aria-label="${TEMA.lugares.mercado} agora"><div class="ph"><h3>${TEMA.lugares.mercado} agora</h3><button class="btn small" data-go="mercado">Ver</button></div>${mov.map(x=>`<div class="mv">${artCanvas(x.c.id,{crop:true})}<span>${escH(x.c.nome)}</span>${varHTML(x.v)}</div>`).join('')}</section>`;
  m.innerHTML=`<div class="home"><div class="hcol hc-c">${arena}${baus}</div>${missoes}<div class="hcol hc-r">${trilha}${merc}</div></div>`;
  // rola a trilha até o próximo passo
  const tr=$('#trilha');if(tr&&!isDesk()){const p=$('.tstep.pode',tr)||$('.tstep.trav',tr);if(p)tr.scrollLeft=Math.max(0,p.offsetLeft-tr.offsetLeft-8);}
}
function recHTML(r){return r.grao?`${ic('coin',14)}<span class="num">${r.grao}</span> ${MOE}`:`${ic('po',14)}<span class="num">${r.po}</span> ${BRAS}`;}
function mmss(sec){sec=Math.ceil(sec);const m=Math.floor(sec/60),s2=sec%60;return m+':'+String(s2).padStart(2,'0');}
function tempoTxt(sec){return sec>=60?Math.round(sec/60)+' min':Math.round(sec)+' s';}
function slotHTML(b,i){
  if(!b)return `<div class="slot" data-k="slot${i}"><span>Vença para ganhar um tesouro</span></div>`;
  const e=bauEstado(b),B=BAUS[b.tipo];const hl=s.guia===4&&b.tut?'hl':'';
  let inner;
  if(e==='pronto')inner=`${chestImg(b.tipo,46)}<span class="ab">ABRIR</span>`;
  else if(e==='abrindo'){const tot=tempoBau(b),r=restanteBau(b);const fr=1-r/tot;
    inner=`${chestImg(b.tipo,40)}<span class="tm" data-timer="${i}">${mmss(r)}</span><svg class="ring" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="8" fill="none" stroke="#14100B" stroke-width="4"/><circle data-ring="${i}" cx="11" cy="11" r="8" fill="none" stroke="#F2BE4A" stroke-width="4" stroke-dasharray="${(fr*50.3).toFixed(1)} 60" transform="rotate(-90 11 11)"/></svg>`;}
  else inner=`${chestImg(b.tipo,40)}<span class="num">${tempoTxt(tempoBau(b))}</span><b>${algumAbrindo()?'Trancado':'Destrancar'}</b>`;
  return `<button class="slot full ${e} ${hl}" data-act="bau" data-i="${i}" data-k="slot${i}" aria-label="${escH(B.nome)}: ${e==='pronto'?'pronto para abrir':e==='abrindo'?'abrindo':'trancado'}">${inner}</button>`;
}
function oddsTable(linhas){
  return `<div class="oddswrap"><table class="odds"><thead><tr><th>Espaço</th>${RARS.map(r=>`<th>${RAR_NOME[r]}</th>`).join('')}</tr></thead><tbody>${linhas.map(l=>`<tr><td>${escH(ODDS_NOME[l])}</td>${RARS.map(r=>`<td class="num">${ODDS[l][r]!=null?String(ODDS[l][r]).replace('.',',')+'%':'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function abrirFolhaBau(i){
  const b=s.baus[i];if(!b)return;
  const B=BAUS[b.tipo],e=bauEstado(b),f=faixaBau(b.tipo,b.arena);
  const draw=()=>{
    const e2=bauEstado(b);const k=custoPressa(b);
    let acts='';
    if(e2==='pronto')acts=`<button class="btn gold md wide" data-a="abrir">Abrir</button>`;
    else{
      if(e2==='trancado'&&!algumAbrindo())acts+=`<button class="btn gold md wide" data-a="destrancar">Destrancar (${tempoTxt(tempoBau(b))})</button>`;
      if(e2==='trancado'&&algumAbrindo())acts+=`<p class="muted" style="font-size:13px">Outro tesouro já está abrindo. Só um abre por vez.</p>`;
      acts+=`<button class="btn md wide" data-a="pressa" ${s.grao<k?'disabled':''}>Abrir agora por ${ic('coin',16)} <span class="num">${fmt(k)}</span> ${MOEC}</button>${s.grao<k?'<p class="note">'+MOEC+' insuficientes</p>':''}<p class="muted" style="font-size:12px">Abrir agora sempre custa mais do que os ${MOE} que vêm no tesouro. Esses ${MOE} vão para a fogueira (saem de circulação).</p>`;
    }
    return `<div class="detail"><div style="line-height:0">${chestImg(b.tipo,120)}</div>
      <div class="meta"><div><b>${b.tut?3:f.cartas} cartas</b> · ${b.tut?'15':f.g0===f.g1?fmt(f.g0):fmt(f.g0)+'–'+fmt(f.g1)} ${MOE}${B.pacote&&!b.tut?' · <b>+1 '+escH(PACKS.semente.nome)+'</b>':''}</div>
      ${B.garantia&&!b.tut?`<div>Garantia: <b>1 ${RAR_NOME[B.garantia]}${B.garantia==='lendaria'?'':' ou melhor'}</b></div>`:''}
      ${b.tut?'<div>Conteúdo do presente: '+TUT.bau.cartas.map(x=>escH(CARD[x].nome)).join(', ')+'.</div>':''}
      <div>${e2==='abrindo'?'Abrindo: falta <b class="num" data-timer-s>'+mmss(restanteBau(b))+'</b>':e2==='pronto'?'<b class="okmsg">Pronto!</b>':'Tempo para abrir: <b class="num">'+tempoTxt(tempoBau(b))+'</b>'}</div>
      ${b.tut?'':`<details><summary class="tbtn" style="display:inline-block">Ver chances</summary>${oddsTable(B.garantia?['normal',B.garantia]:['normal'])}<p class="muted" style="font-size:12px;margin-top:4px">As outras cartas usam a linha Normal. Chance de ${escH(BAUS.lendario.nome)} em cada tesouro ganho: 2%.</p></details>`}
      </div><div class="acts" style="width:100%">${acts}</div></div>`;
  };
  const ov=abrirFolha(draw(),{titulo:B.nome});
  const body=$('.sbody',ov);
  body.addEventListener('click',async ev=>{
    const a=ev.target.closest('[data-a]');if(!a)return;
    const act=a.dataset.a;
    if(act==='destrancar'){destrancar(i);sfx('destrancar');body.innerHTML=draw();hydrateGfx(body);refresh();}
    else if(act==='abrir'||act==='pressa'){
      if(act==='pressa'){const k=custoPressa(b);const ok=await perguntar(`Abrir agora por <b>${fmt(k)} ${MOEC}</b>? Esses ${MOE} vão para a fogueira.`,'Abrir agora');if(!ok)return;}
      fecharOv(ov,true);await abrirBauFlow(i,act==='pressa');
    }
  });
}
async function abrirBauFlow(i,pagar){
  const res=abrirBau(i,pagar);
  if(!res){toast('Não deu para abrir agora.');return;}
  sfx(pagar?'caixa':'tap');refresh();
  await revelar(res);
  if(s.guia===4){s.guia=5;save();}
  refresh();
}

/* ---------- Cartas ---------- */
function renderCartas(m){
  const sub=UI.sub;
  if(sub==='combos'&&marcarDuplasVistas())renderTop();
  m.innerHTML=`<div class="subtabs" role="group" aria-label="Cartas"><button data-act="sub" data-v="colecao" aria-pressed="${sub==='colecao'}" data-k="sub-col">Coleção</button><button data-act="sub" data-v="deck" aria-pressed="${sub==='deck'}" data-k="sub-deck">Meu deck <span class="num">(${s.deck.cartas.length}/20)</span></button><button data-act="sub" data-v="combos" aria-pressed="${sub==='combos'}" data-k="sub-combos">Combinações${duplaPendente()?'<i class="dot" aria-hidden="true"></i>':''}</button></div><div id="cbody"></div>`;
  const b=$('#cbody');
  if(sub==='colecao')renderColecao(b);else if(sub==='combos')renderCombinacoes(b);else renderDeck(b);
}
function renderColecao(b){
  const f=UI.cf;
  const lista=COLECAO.filter(c=>(!f.terr||c.terreno===f.terr)&&(!f.rar||c.rar===f.rar)&&(!f.tenho||temCarta(c.id))&&(!f.fam||c.familia===f.fam)&&(!f.novas||c.v4));
  const tem=COLECAO.filter(c=>temCarta(c.id)).length;
  b.innerHTML=`<div class="filters" role="group" aria-label="Filtros">${['milharal','pomar','brejo','pasto','neutro'].map(t=>`<button class="fchip" data-act="cf" data-f="terr" data-v="${t}" aria-pressed="${f.terr===t}" data-k="cf-${t}">${terrIc(t,12)}${TERR_NOME[t]}</button>`).join('')}</div>
   <div class="filters" role="group" aria-label="Raridade">${RARS.map(r=>`<button class="fchip" data-act="cf" data-f="rar" data-v="${r}" aria-pressed="${f.rar===r}" data-k="cf-${r}">${gemIc(r,12)}${RAR_NOME[r]}</button>`).join('')}<button class="fchip" data-act="cf" data-f="tenho" aria-pressed="${f.tenho}" data-k="cf-tenho">Só as que tenho</button></div>
   <div class="filters" role="group" aria-label="Família">${FAM_ORDEM.map(k=>`<button class="fchip ffam" style="--fc:${FAMILIAS[k].cor}" data-act="cf" data-f="fam" data-v="${k}" aria-pressed="${f.fam===k}" data-k="cf-${k}">${ic(FAMILIAS[k].ic,13)}${FAMILIAS[k].nome}</button>`).join('')}<button class="fchip fnov" data-act="cf" data-f="novas" aria-pressed="${f.novas}" data-k="cf-novas"><span class="novo4 in">NOVO</span>Novas</button></div>
   <p class="muted" style="margin-bottom:10px"><b class="num" style="color:var(--ink)">${tem}/${COLECAO.length}</b> cartas</p>
   <div class="grid">${lista.map(c=>thumbHTML(c.id)).join('')||'<p class="muted">Nenhuma carta com esses filtros.</p>'}</div>`;
}
function thumbHTML(id){
  const own=s.cards[id],c=CARD[id];
  const k=own?custoMelhora(id):null;
  const up=own&&podeMelhorarSoCopias(id);
  const nd=naDeck(id);
  let lb='';
  if(own)lb=`<span class="lb"><span class="bar green"><i style="width:${k?Math.min(1,own.copias/k.cop)*100:100}%"></i></span><span class="num">${k?own.copias+'/'+k.cop:'MÁX'}</span></span>`;
  else lb=`<span class="lb"><span class="muted">Não tem</span></span>`;
  return `<button class="thumbb" data-act="carta" data-id="${id}" data-k="th-${id}" aria-label="${escH(c.nome)}${own?', nível '+own.lvl:', não tem'}">${up?'<span class="upg" aria-label="pode melhorar">▲</span>':''}${typeof ascBadgeHTML==='function'?ascBadgeHTML(id):''}${cardHTML(id,{sz:'thumb',lvl:own?own.lvl:1,unknown:!own,novo:!own})}${lb}${nd?`<span class="ndl"><span class="num">${nd}×</span> no deck</span>`:''}</button>`;
}
function renderDeck(b){
  const cnt={};for(const id of s.deck.cartas)cnt[id]=(cnt[id]||0)+1;
  const probs=problemasDeck();
  const curva=[1,2,3,4,5,6,7].map(k=>s.deck.cartas.filter(id=>Math.min(7,CARD[id].custo)===k).length);
  const mx=Math.max(1,...curva);
  const ids=Object.keys(cnt).sort((a,b2)=>CARD[a].custo-CARD[b2].custo||CARD_ORDER[a]-CARD_ORDER[b2]);
  let grupos='';let last=-1;
  for(const id of ids){const c=CARD[id];if(c.custo!==last){grupos+=`<div class="grp">${ic('energia',12)}Custo ${c.custo}</div>`;last=c.custo;}
    grupos+=drowHTML(id,cnt[id],true);}
  const fora=COLECAO.filter(c=>temCarta(c.id)&&(cnt[c.id]||0)<maxNoDeck(c.id)).sort((a,b2)=>a.custo-b2.custo||CARD_ORDER[a.id]-CARD_ORDER[b2.id]);
  b.innerHTML=`<div class="deck-top">
    <section class="panel"><div class="ph"><h3>Terrenos do deck</h3><span class="muted" style="font-size:12px">Toque para trocar</span></div>
    <div class="lanechips">${s.deck.terrenos.map((t,i)=>`<button class="lanechip" style="background:${TERR_COR[t]}" data-act="lanechip" data-i="${i}" data-k="lc${i}" aria-label="Terreno ${i+1}: ${TERR_NOME[t]}. Toque para trocar.">${terrIc(t,14)}<span>${i+1} · ${TERR_NOME[t]}</span></button>`).join('')}</div>
    <p class="muted" style="font-size:12px;margin-top:6px">Carta no terreno da mesma cor ganha +1/+1.</p></section>
    <section class="panel"><div class="ph"><h3>Curva de custo</h3>${probs.length?`<span class="warn">${escH(probs.join(' · '))}</span>`:'<span class="okmsg">Deck pronto!</span>'}</div>
    <div class="curve" aria-label="Curva de custo">${curva.map((n,i)=>`<div class="cb"><span class="num">${n}</span><i style="height:${n/mx*44}px"></i><span>${i+1}${i===6?'+':''}</span></div>`).join('')}</div>
    ${famDeckHTML(cnt)}</section>
    ${typeof decksSalvosHTML==='function'?decksSalvosHTML():''}
    <section class="panel dlist"><div class="ph"><h3>No deck <span class="num muted">(${s.deck.cartas.length}/20)</span></h3></div>${grupos||'<p class="muted">Deck vazio.</p>'}</section>
    <section class="panel dlist"><div class="ph"><h3>Sua coleção</h3></div>${fora.map(c=>drowHTML(c.id,cnt[c.id]||0,false)).join('')||'<p class="muted">Todas as suas cartas já estão no deck.</p>'}</section>
  </div>`;
}
function famDeckHTML(cnt){
  const fc={};for(const id in cnt){const f=CARD[id].familia;if(f)fc[f]=(fc[f]||0)+cnt[id];}
  const ds=DUPLAS.filter(d=>cnt[d.a]&&cnt[d.b]);
  return `<div class="dfams" aria-label="Famílias do deck">${FAM_ORDEM.filter(f=>fc[f]).map(f=>`<span class="dfc" style="--fc:${FAMILIAS[f].cor}">${ic(FAMILIAS[f].ic,13)}${FAMILIAS[f].nome} <b class="num">${fc[f]}</b></span>`).join('')||'<span class="muted">Nenhuma família no deck.</span>'}</div>
    <div class="dposs">${ic('dupla',13)} Duplas possíveis: <b class="num">${ds.length}</b>${ds.length?` <span class="muted">(${ds.map(d=>escH(d.nome)).join(', ')})</span>`:''}</div>`;
}
function drowHTML(id,n,noDeck){
  const c=CARD[id];const podeMais=n<maxNoDeck(id)&&s.deck.cartas.length<20&&temCarta(id);
  return `<div class="drow">${artCanvas(id)}<div class="dn"><b>${escH(c.nome)}</b><small>${gemIc(c.rar,10)}${terrIc(c.terreno,10)}${ic('energia',10)}<span class="num">${c.custo}</span> · Nv${lvlOf(id)}${c.tipo==='criatura'?` · <span class="num">${statsBase(id,lvlOf(id)).atk}/${statsBase(id,lvlOf(id)).hp}</span>`:''}</small></div>
   ${noDeck?`<button class="ibtn" data-act="dmenos" data-id="${id}" data-k="dm-${id}" aria-label="Tirar 1 ${escH(c.nome)}">−</button><span class="q">${n}</span>`:'<span></span><span class="q muted">'+n+'</span>'}
   <button class="ibtn" data-act="dmais" data-id="${id}" data-k="dp-${id}" aria-label="Pôr 1 ${escH(c.nome)}" ${podeMais?'':'disabled'}>+</button></div>`;
}

/* ---------- detalhe da carta ---------- */
let detalheOv=null;
function abrirDetalhe(id,o){
  o=o||{};
  if(detalheOv&&detalheOv.isConnected)fecharOv(detalheOv,true);
  const ov=abrirFolha('',{titulo:CARD[id].nome,onClose:()=>{detalheOv=null;refresh();}});
  detalheOv=ov;
  const body=$('.sbody',ov);
  const draw=()=>{body.innerHTML=detalheHTML(id,o);hydrateGfx(body);typeof ascLigar==='function'&&ascLigar(body,id);};
  draw();
  body.addEventListener('click',async ev=>{
    const a=ev.target.closest('[data-a]');if(!a||a.disabled)return;
    const act=a.dataset.a;
    if(act==='melhorar'){
      const k=custoMelhora(id);
      const r=fazerMelhora(id);if(!r)return;
      sfx('levelup');refresh();
      await mostrarLevelUp(id,r.de,r.para);
      if(o.guia&&s.guia===3){
        s.guia=4;save();
        fecharOv(ov,true);detalheOv=null;
        const rr=porNoDeck('pipoqueiro-explosivo');
        UI.tab='inicio';refresh();
        if(rr)toastDeck('pipoqueiro-explosivo',rr);
        return;
      }
      draw();
    }else if(act==='queimar'){fluxoQueimar(id,()=>draw());}
    else if(act==='vender'){const ok=await confirmarVenda(id);if(ok)draw();}
    else if(act==='comprar'){await confirmarCompra(id);draw();}
    else if(act==='deck'){const r=porNoDeck(id);toastDeck(id,r);draw();refresh();}
    else if(act==='criar'){const ok=await perguntar(`Criar <b>${escH(CARD[id].nome)}</b> por <b>${fmt(PO_CRIAR[CARD[id].rar])} ${BRAS}</b>?`,'Criar');if(ok&&fazerCriar(id)){sfx('forja');setTimeout(()=>sfx('stinger',CARD[id].rar),250);toast(`${escH(CARD[id].nome)} entrou na sua coleção!`);draw();refresh();}}
    else if(act==='dupla'){sfx('tap');abrirDupla(a.dataset.v);}
    else if(act==='big'){/* nada */}
  });
  return ov;
}
function detalheHTML(id,o){
  const c=CARD[id],own=s.cards[id],lvl=own?own.lvl:1;
  const k=own?custoMelhora(id):null;
  let acts='';
  if(own){
    if(k){const pode=podeMelhorar(id);const why=!pode?(s.grao<k.grao?'Faltam '+MOE:'Faltam '+BRAS+' (ou cópias)'):'';
      acts+=`<button class="btn gold md wide ${o.guia?'hl':''}" data-a="melhorar" ${pode?'':'disabled'}>${escH(textoMelhora(k))}</button>${why?`<p class="note">${why}</p>`:''}`;
    }
    if(own.copias>0){
      acts+=`<button class="btn po md wide" data-a="queimar">Queimar na fogueira (+${PO_QUEIMA[c.rar]} ${BRAS} cada)</button>`;
      const b=lance(id),f=taxa(b);
      acts+=`<button class="btn md wide" data-a="vender">Vender 1 na ${TEMA.lugares.mercado} (${fmt(b-f)} ${MOEC})</button>`;
    }
    if(podePorNoDeck(id))acts+=`<button class="btn md wide" data-a="deck">Pôr no deck</button>`;
  }else{
    if(c.arena<=arenaMax())acts+=`<button class="btn po md wide" data-a="criar" ${s.po>=PO_CRIAR[c.rar]?'':'disabled'}>Criar (${fmt(PO_CRIAR[c.rar])} ${BRAS})</button>${s.po<PO_CRIAR[c.rar]?`<p class="muted" style="font-size:12px">Você tem ${fmt(s.po)} ${BRAS}. Ganhe ${BRAS} queimando cópias extras na fogueira.</p>`:''}`;
    else acts+=`<p class="muted" style="font-size:13px">Sai nos pacotes a partir da Arena ${c.arena} · ${escH(ARENAS[c.arena-1].nome)}.</p>`;
    const p=preco(id),m=s.mercado.c[id];
    if(!liberadaNoMercado(id))acts+=`<button class="btn md wide" disabled>Na ${TEMA.lugares.mercado} a partir da Arena ${c.arena}</button>`;
    else acts+=`<button class="btn md wide" data-a="comprar" ${m.oferta>0&&s.grao>=p?'':'disabled'}>${m.oferta>0?`Comprar na ${TEMA.lugares.mercado} (${fmt(p)} ${MOEC})`:'Esgotado na '+TEMA.lugares.mercado}</button>`;
  }
  const nrow=c.n?`<div class="nrow"><b>${escH(c.nLabel||'Valor')} por nível:</b>${c.n.map((v,i)=>`<span class="${i===lvl-1?'cur':''}" title="Nv${i+1}">${v}</span>`).join('')}</div>`:'';
  const crow=c.tipo==='criatura'?`<div class="nrow"><b>Bônus por nível:</b>${LVL_BONUS.map((b,i)=>`<span class="${i===lvl-1?'cur':''}" title="Nv${i+1}">+${b[0]}/+${b[1]}</span>`).join('')}</div>`:'';
  const meta=own?`<div>Nível <b class="num">${lvl}</b>${k?` · próximo: Nv${k.prox} precisa de <b class="num">${k.cop}</b> ${k.cop>1?'cópias':'cópia'} + <b class="num">${k.grao}</b> ${MOE}`:' · nível máximo'}</div>
     <div>Cópias extras: <b class="num">${own.copias}</b> · No deck: <b class="num">${naDeck(id)}</b></div>`:`<div class="muted">Você ainda não tem esta carta.</div>`;
  return `<div class="detail">${cardHTML(id,{sz:'big',lvl,anim:true})}<div class="meta">${famDuplasHTML(id)}${meta}${nrow}${crow}${typeof ascHTML==='function'?ascHTML(id):''}<div class="muted" style="font-size:12px">${RAR_NOME[c.rar]} · ${TEMA.lugares.mercado}: <span class="num">${fmt(preco(id))}</span> ${MOE}</div></div><div class="acts" style="width:100%">${acts}</div></div>`;
}
async function confirmarVenda(id){
  const b=lance(id),f=taxa(b);const c=CARD[id];
  if(!s.cards[id]||s.cards[id].copias<1){toast('Você só pode vender cópias extras.');return false;}
  if(s.mercado.poolRobos<b){toast('Os feirantes estão sem '+MOE+'.');return false;}
  const ok=await perguntar(`Vender 1 ${escH(RAR_NOME[c.rar])} (<b>${escH(c.nome)}</b>) por <b>${fmt(b)} ${MOEC}</b>? A taxa de <b>${fmt(f)} ${MOEC}</b> vai para a fogueira. Você recebe <b>${fmt(b-f)}</b>.`,'Vender');
  if(!ok)return false;
  const r=venderCarta(id);if(!r){toast('Os feirantes estão sem '+MOE+'.');return false;}
  sfx('caixa');toast(`Vendeu ${escH(c.nome)}: +${fmt(r.liq)} ${MOE} (taxa de ${fmt(r.f)} na fogueira).`);refresh();return true;
}
async function confirmarCompra(id){
  const p=preco(id),c=CARD[id];
  if(!liberadaNoMercado(id)){toast('Esta carta chega à '+TEMA.lugares.mercado+' na Arena '+c.arena+'.');return false;}
  if(s.grao<p){toast(MOEC+' insuficientes.');return false;}
  const ok=await perguntar(`Comprar <b>${escH(c.nome)}</b> por <b>${fmt(p)} ${MOEC}</b>? O feirante paga a taxa de ${fmt(taxa(p))} ${MOE}, que vai para a fogueira.`,'Comprar');
  if(!ok)return false;
  const r=comprarCarta(id);if(!r){toast('Não deu para comprar.');return false;}
  sfx('caixa');toast(r.nova?`<b>${escH(c.nome)}</b> é NOVA na sua coleção!`:`Comprou ${escH(c.nome)} (+1 cópia).`);refresh();return true;
}
function fluxoQueimar(id,depois){
  const own=s.cards[id];if(!own||own.copias<1)return;
  const c=CARD[id];let n=1;
  const ov=abrirFolha(`<div class="detail"><p>Quantas cópias extras jogar na fogueira? Elas viram ${BRAS}.</p>
   <div class="stepper"><button class="ibtn" data-s="-1" aria-label="Menos">−</button><output class="num" aria-live="polite">1</output><button class="ibtn" data-s="1" aria-label="Mais">+</button></div>
   <p>${ic('po',16)} <b class="num" data-po>+${PO_QUEIMA[c.rar]}</b> ${BRAS} · <span class="muted">+${PO_QUEIMA[c.rar]} ${BRAS} cada</span></p>
   <div class="acts" style="width:100%"><button class="btn po md wide" data-q>Queimar</button></div></div>`,{titulo:'Fogueira: '+c.nome});
  const upd=()=>{$('output',ov).textContent=n;$('[data-po]',ov).textContent='+'+fmt(n*PO_QUEIMA[c.rar]);};
  $$('[data-s]',ov).forEach(b=>b.onclick=()=>{n=clamp(n+(+b.dataset.s),1,own.copias);upd();});
  $('[data-q]',ov).onclick=async()=>{
    const ok=await perguntar(`Queimar ${n} ${n>1?'cópias':'cópia'} de <b>${escH(c.nome)}</b>? Elas somem pra sempre.`,'Queimar',{perigo:true});
    if(!ok)return;
    const from=$('.sz-big',detalheOv||document)||$('.sheet',ov);
    const po=fazerQueima(id,n);fecharOv(ov,true);
    sfx('burn');await animQueima(from);
    toast(`${ic('po',14)} +${fmt(po)} ${BRAS}`);refresh();depois&&depois();
  };
}
async function animQueima(el){
  if(!el)return;
  const r=el.getBoundingClientRect();const fx=$('#fx');
  if(!RM){
    const a=el.animate([{filter:'none',opacity:1},{filter:'sepia(1) saturate(4) hue-rotate(-20deg) brightness(1.4)',opacity:.6,offset:.5},{filter:'brightness(.2)',opacity:.15}],{duration:600});
    for(let i=0;i<22;i++){const p=document.createElement('i');p.className='pxp';p.style.background=pick(['#E8862E','#F2C230','#C4362F']);p.style.left=(r.left+rnd()*r.width)+'px';p.style.top=(r.top+r.height*(0.3+rnd()*0.7))+'px';fx.appendChild(p);
      p.animate([{transform:'none',opacity:1},{transform:`translate(${(rnd()-0.5)*20}px,${-40-rnd()*60}px)`,opacity:0}],{duration:500+rnd()*300,easing:'ease-out'}).onfinish=()=>p.remove();}
    await sleep(600);a.cancel();
  }else await sleep(200);
  const tgt=$('#wPo')||$('.pill.po');const tr=tgt?tgt.getBoundingClientRect():{left:window.innerWidth-80,top:10,width:40,height:30};
  for(let i=0;i<10;i++){const p=document.createElement('i');p.className='pxp';p.style.width=p.style.height='5px';p.style.background='#B36BE8';p.style.boxShadow='0 0 6px #E6CCFF';p.style.left=(r.left+r.width/2)+'px';p.style.top=(r.top+r.height/2)+'px';fx.appendChild(p);
    const dx=tr.left+tr.width/2-(r.left+r.width/2),dy=tr.top+tr.height/2-(r.top+r.height/2);
    if(RM){setTimeout(()=>p.remove(),300);continue;}
    p.animate([{transform:'none',opacity:1},{transform:`translate(${dx*0.4+(rnd()-0.5)*80}px,${dy*0.4-40}px)`,offset:.4},{transform:`translate(${dx}px,${dy}px)`,opacity:.6}],{duration:650+i*30,easing:'ease-in'}).onfinish=()=>p.remove();}
  await sleep(RM?100:700);
}
function mostrarLevelUp(id,de,para){
  return new Promise(res=>{
    const c=CARD[id];
    const el=document.createElement('div');el.className='lvlov';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Carta melhorou');
    let st='';
    if(c.tipo==='criatura'){const a=statsBase(id,de),b=statsBase(id,para);
      st=`<div class="ls"><span>${ic('espada',16)} <b class="num" data-tk="atk">${a.atk}</b>${b.atk>a.atk?' <span class="plus num">+'+(b.atk-a.atk)+'</span>':''}</span><span>${ic('coracao',16)} <b class="num" data-tk="hp">${a.hp}</b>${b.hp>a.hp?' <span class="plus num">+'+(b.hp-a.hp)+'</span>':''}</span></div>`;}
    else{const a=c.n[de-1],b=c.n[para-1];
      if(b>a)st=`<div class="ls"><span>${escH(c.nLabel||'Valor')}: <b class="num">${a}</b> <span class="plus num">+${b-a}</span></span></div>`;
      else{let nx=para;while(nx<5&&c.n[nx]<=b)nx++;const msg=nx<5?`Próxima melhora no Nv ${nx+1}: ${c.n[nx]} de ${escH((c.nLabel||'valor').toLowerCase())}`:'Este já é o valor máximo.';st=`<div class="ln">${msg}</div>`;}}
    el.innerHTML=`<div class="lt">Nv ${de} → Nv ${para}</div><div style="position:relative">${cardHTML(id,{sz:'big',lvl:para,anim:true})}</div>${st}<button class="btn gold md" data-ok>Oba!</button>`;
    $('#ovl').appendChild(el);hydrateGfx(el);
    const rec={el,closable:true,onClose:()=>res(),opener:document.activeElement};OVS.push(rec);
    const card=$('.card',el);
    if(!RM){card.animate([{transform:'scale(.6)',filter:'brightness(2)'},{transform:'scale(1.06)',filter:'brightness(1.4)',offset:.6},{transform:'scale(1)',filter:'none'}],{duration:700,easing:'ease-out'});
      const r=card.getBoundingClientRect();
      for(let i=0;i<12;i++){const p=document.createElement('i');p.className='pxp';p.style.width=p.style.height='5px';p.style.background=i%2?'#FFE58A':'#9BFF8A';p.style.left=(r.left+r.width/2)+'px';p.style.top=(r.top+r.height/2)+'px';el.appendChild(p);
        const ang=i/12*Math.PI*2;p.animate([{transform:'none',opacity:1},{transform:`translate(${Math.cos(ang)*150}px,${Math.sin(ang)*190}px)`,opacity:0}],{duration:900,easing:'ease-out'}).onfinish=()=>p.remove();}}
    $$('.plus',el).forEach((p,i)=>{p.style.opacity=0;setTimeout(()=>{p.style.opacity=1;if(!RM)p.animate([{transform:'translateY(8px)',opacity:0},{transform:'none',opacity:1}],{duration:300});},RM?0:500+i*150);});
    const b=$('[data-ok]',el);setTimeout(()=>{try{b.focus();}catch(e){}},50);
    b.onclick=()=>fecharOv(el);
  });
}

/* ---------- Loja ---------- */
function renderLoja(m){
  const held=['semente','colheita'].filter(t=>s.pacotes[t]>0);
  m.innerHTML=`<div class="shop">
   <div class="resp"><b>Moeda simulada · sem dinheiro real.</b> As chances estão publicadas. Pacotes também saem de tesouros, missões e da Trilha.</div>
   ${held.length?`<section class="panel"><div class="ph"><h3>Seus pacotes</h3></div><div class="held">${held.map(t=>`<div class="hr"><span>${packImg(t,24)}${PACKS[t].curto} <b class="num">×${s.pacotes[t]}</b></span><button class="btn gold small" data-act="abrirP" data-t="${t}" data-k="abrirP-${t}">Abrir</button></div>`).join('')}</div></section>`:''}
   <div class="packs">${['semente','colheita'].map(t=>{const P=PACKS[t];const falta=P.preco-s.grao;return `<section class="panel packcard"><div class="pk">${packImg(t,96)}</div><div class="pi"><h2>${P.nome}</h2><div class="price">${ic('coin',20)}<span class="num">${P.preco}</span> <span style="font-size:14px">${MOEC}</span></div><div style="font-size:13.5px">${P.linha}</div>
     <div class="muted" style="font-size:12px">Chance por pacote, sem contar a garantia: Rara+ <b class="num">${P.chance[0]}</b> · Épica+ <b class="num">${P.chance[1]}</b> · Lendária <b class="num">${P.chance[2]}</b></div>
     <div class="muted" style="font-size:12px">Com a garantia, em média: Épica+ <b class="num">≈${pctBR(chanceComGarantia(t).e)}</b> · Lendária <b class="num">≈${pctBR(chanceComGarantia(t).l)}</b></div>
     <button class="btn gold md" data-act="comprarP" data-t="${t}" data-k="comprarP-${t}">Comprar e abrir</button>
     ${UI.odds['n'+t]?`<p class="note">Faltam ${fmt(falta)} ${MOE}. Vença partidas e abra tesouros!</p>`:''}
     <button class="tbtn" data-act="odds" data-t="${t}" aria-expanded="${!!UI.odds[t]}" data-k="odds-${t}">${UI.odds[t]?'Esconder chances':'Ver chances'}</button>
     ${UI.odds[t]?oddsTable(['normal',P.slots[4]].concat(t==='colheita'?['incomum']:[]).filter((v,i,a)=>a.indexOf(v)===i))+`<table class="odds"><thead><tr><th>Por pacote</th><th>≥1 Rara+</th><th>≥1 Épica+</th><th>≥1 Lendária</th></tr></thead><tbody><tr><td>${P.curto} (sem garantia)</td>${P.chance.map(x=>`<td class="num">${x}</td>`).join('')}</tr><tr><td>Com a garantia, em média</td><td class="num">—</td><td class="num">≈${pctBR(chanceComGarantia(t).e)}</td><td class="num">≈${pctBR(chanceComGarantia(t).l)}</td></tr></tbody></table><p class="muted" style="font-size:11px;margin-top:4px">A média com garantia vale para quem abre só este pacote. As garantias contam todos os pacotes.</p>`:''}
   </div></section>`;}).join('')}</div>
   <section class="panel pity"><div class="ph"><h3>Garantias</h3></div>
     <div class="pr"><span>Épica garantida em até 10 pacotes: faltam <b class="num">${10-s.pity.epica}</b></span><div class="bar po"><i style="width:${s.pity.epica/10*100}%"></i></div></div>
     <div class="pr"><span>Lendária garantida em até 40 pacotes: faltam <b class="num">${40-s.pity.lendaria}</b></span><div class="bar"><i style="width:${s.pity.lendaria/40*100}%"></i></div></div>
     <p class="muted" style="font-size:12px">Contam todos os pacotes abertos (comprados ou ganhos). Cartas de tesouros não contam.</p></section>
   <section class="panel"><div class="ph"><h3>Todas as chances</h3></div>${oddsTable(['normal','incomum','rara','epica','lendaria'])}<p class="muted" style="font-size:12px;margin-top:6px">Dentro de uma raridade, todas as cartas das arenas que você já abriu têm a mesma chance. Chance de ${escH(BAUS.lendario.nome)} em cada tesouro ganho: 2%.</p></section>
   ${typeof mascateHTML==='function'?mascateHTML():''}
  </div>`;
  typeof mascateLigar==='function'&&mascateLigar(m);
}
async function comprarPacoteFlow(tipo){
  const P=PACKS[tipo];
  if(s.grao<P.preco){UI.odds['n'+tipo]=true;refresh();setTimeout(()=>{delete UI.odds['n'+tipo];},4000);return;}
  const res=abrirPacote(tipo,true);if(!res)return;
  sfx('caixa');refresh();await revelar(res);refresh();
}
async function abrirGuardadoFlow(tipo){
  const res=abrirPacote(tipo,false);if(!res)return;
  refresh();await revelar(res);refresh();
}

/* ---------- Mercado (Feira) ---------- */
function renderMercado(m){
  const f=UI.mf;
  m.innerHTML=`<div class="mgrid"><div>
    <section class="panel mhead"><div class="ph" style="margin:0"><h2>${TEMA.lugares.mercado} de cartas · moeda simulada</h2></div>
     <p class="muted" style="font-size:13px">Sem dinheiro real. Do outro lado estão os feirantes (robôs): vendem caro e compram de volta por 30% do preço. A taxa de 10% de cada negócio seu vai para a fogueira. Só aparecem para compra as cartas das arenas que você já abriu.</p>
     <input class="search" type="search" id="msearch" placeholder="Buscar carta…" aria-label="Buscar carta" value="${escH(f.q)}">
     <div class="filters" style="margin:0">${['milharal','pomar','brejo','pasto','neutro'].map(t=>`<button class="fchip" data-act="mf" data-f="terr" data-v="${t}" aria-pressed="${f.terr===t}" data-k="mf-${t}" aria-label="${TERR_NOME[t]}">${terrIc(t,12)}<span>${TERR_NOME[t]}</span></button>`).join('')}</div>
     <div class="filters" style="margin:0">${RARS.map(r=>`<button class="fchip" data-act="mf" data-f="rar" data-v="${r}" aria-pressed="${f.rar===r}" data-k="mf-${r}">${gemIc(r,12)}${RAR_NOME[r]}</button>`).join('')}<button class="fchip" data-act="mf" data-f="extra" aria-pressed="${f.extra}" data-k="mf-extra">Tenho cópias extras</button></div>
     <label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800">Ordenar <select class="sel" id="msort" data-k="msort"><option value="preco" ${f.sort==='preco'?'selected':''}>preço</option><option value="var" ${f.sort==='var'?'selected':''}>variação</option><option value="nome" ${f.sort==='nome'?'selected':''}>nome</option></select></label>
    </section>
    <div class="mlist" id="mlist"></div></div>
    <aside class="panel feed-p"><div class="ph"><h3>Últimas negociações</h3></div><div class="feed" id="mfeed"></div>
     <p class="muted" style="font-size:12px;margin-top:8px">${MOE} com os feirantes: <b class="num">${fmt(s.mercado.poolRobos)}</b></p></aside></div>`;
  renderMList();
  const inp=$('#msearch');inp.addEventListener('input',()=>{UI.mf.q=inp.value;renderMList();});
  $('#msort').addEventListener('change',e=>{UI.mf.sort=e.target.value;renderMList();});
}
function sparkSVG(h){
  if(h.length<2)return '';
  const mn=Math.min(...h),mx=Math.max(...h),r=mx-mn||1;
  const pts=h.map((v,i)=>`${(i/(h.length-1)*58+1).toFixed(1)},${(19-(v-mn)/r*18).toFixed(1)}`).join(' ');
  const up=h[h.length-1]>=h[0];
  return `<svg class="spark" width="60" height="20" viewBox="0 0 60 20" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${up?'#7FD07F':'#F0806A'}" stroke-width="1.5"/></svg>`;
}
function renderMList(){
  const L=$('#mlist');if(!L)return;
  const f=UI.mf;const q=f.q.trim().toLowerCase();
  let lista=COLECAO.filter(c=>(!f.terr||c.terreno===f.terr)&&(!f.rar||c.rar===f.rar)&&(!f.extra||(s.cards[c.id]&&s.cards[c.id].copias>0))&&(!q||c.nome.toLowerCase().includes(q)));
  if(f.sort==='preco')lista.sort((a,b)=>preco(b.id)-preco(a.id));
  else if(f.sort==='var')lista.sort((a,b)=>variacao(b.id)-variacao(a.id));
  else lista.sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  lista.sort((a,b)=>(liberadaNoMercado(b.id)?1:0)-(liberadaNoMercado(a.id)?1:0)); // travadas no fim (sort estável)
  L.innerHTML=lista.map(c=>{
    const m=s.mercado.c[c.id],p=preco(c.id),v=variacao(c.id),own=s.cards[c.id];
    const b=lance(c.id),fe=taxa(b),ext=own&&own.copias>0,lib=liberadaNoMercado(c.id);
    const bc=!lib?`<button class="btn gold" disabled aria-label="${escH(c.nome)}: chega à ${TEMA.lugares.mercado} na Arena ${c.arena}">Arena <span class="num">${c.arena}</span></button>`
      :`<button class="btn gold" data-act="mcomprar" data-id="${c.id}" data-k="mc-${c.id}" ${m.oferta>0&&s.grao>=p?'':'disabled'} aria-label="Comprar ${escH(c.nome)} por ${p} ${MOE}">${m.oferta>0?'Comprar<span class="num">'+fmt(p)+'</span>':'Esgotado'}</button>`;
    return `<div class="mrow ${lib?'':'trav'}">${artCanvas(c.id)}<div class="mi"><b>${gemIc(c.rar,11)}<span>${escH(c.nome)}</span></b>
      <span class="pr">${ic('coin',14)}<span class="num">${fmt(p)}</span>${varHTML(v,'small')}</span>
      <span class="muted">${!lib?`Abre na Arena ${c.arena}`:m.oferta>0?`<span class="num">${m.oferta}</span> à venda`:'<b class="down">Esgotado</b>'}${own?` · você: Nv${own.lvl}${own.copias?' +'+own.copias:''}`:''}</span></div>
      ${sparkSVG(m.hist)}
      <div class="bt">${bc}
      <button class="btn" data-act="mvender" data-id="${c.id}" data-k="mv-${c.id}" ${ext?'':'disabled'} aria-label="Vender 1 ${escH(c.nome)} por ${b-fe} ${MOE} líquidos">Vender<span class="num">${fmt(b-fe)}</span></button></div></div>`;
  }).join('')||'<p class="muted">Nenhuma carta encontrada.</p>';
  if(s.grao<2)L.insertAdjacentHTML('afterbegin','<p class="note">'+MOEC+' insuficientes para comprar.</p>');
  const F=$('#mfeed');if(F)F.innerHTML=s.mercado.feed.slice().reverse().map(t=>`<div>${escH(t)}</div>`).join('')||'<div class="muted">Ainda sem negócios.</div>';
  hydrateGfx(L);
}

/* ---------- Economia ---------- */
function renderEconomia(m){
  const E=s.eco,t=ecoTotais();
  const cr=E.criado,qu=E.queimado;
  const ratio=t.c?t.qv/t.c:0;
  const lbl=ratio>=1.10?'Deflação: moeda ficando rara':ratio>=0.80?'Equilibrada':ratio>=0.50?'Aquecida':'Inflando';
  const pos=clamp(ratio/1.5,0,1)*100;
  // gráfico: criado × queimado por você (a mesma base do termômetro)
  const h=(E.hist.length?E.hist:[{c:t.c,q:t.q,qv:t.qv}]).map(x=>({c:x.c,v:x.qv!=null?x.qv:x.q}));
  const mx=Math.max(1,...h.map(x=>Math.max(x.c,x.v)));
  const W=600,H=200;
  const line=k=>h.map((x,i)=>`${(h.length<2?W/2:i/(h.length-1)*(W-20)+10).toFixed(1)},${(H-14-x[k]/mx*(H-30)).toFixed(1)}`).join(' ');
  const C=E.cartas;const saldo=t.c-t.qv;
  m.innerHTML=`<div style="display:grid;gap:14px">
   <section class="panel"><h2 style="margin-bottom:6px">Economia dos ${MOE}</h2><p style="font-size:14px">Toda moeda nova precisa de um ralo. Se o ralo acompanha a torneira, o ${TEMA.moeda.nome} não perde valor.</p><p class="muted" style="font-size:12px;margin-top:4px">Moeda simulada · sem dinheiro real. Aqui só entra o que <b>você</b> ganhou e queimou; os feirantes têm o quadro deles.</p></section>
   <div class="tiles">
    <div class="tile"><h3>${MOE} criados para você</h3><div class="big num">${fmt(t.c)}</div><ul><li>presente inicial<b>${fmt(cr.inicial)}</b></li><li>vitórias<b>${fmt(cr.vitorias)}</b></li><li>tesouros<b>${fmt(cr.baus)}</b></li><li>missões<b>${fmt(cr.missoes)}</b></li><li>trilha<b>${fmt(cr.trilha)}</b></li></ul></div>
    <div class="tile"><h3>${MOE} queimados por você</h3><div class="big num">${fmt(t.qv)}</div><ul><li>pacotes<b>${fmt(qu.pacotes)}</b></li><li>melhorias<b>${fmt(qu.melhorias)}</b></li><li>pressa nos tesouros<b>${fmt(qu.pressa)}</b></li><li>taxas dos seus negócios<b>${fmt(qu.taxasVoce)}</b></li><li>inscrições da Peleja<b>${fmt(qu.torneio||0)}</b></li></ul></div>
    <div class="tile"><h3>Saldo da torneira</h3><div class="big num ${saldo>0?'':'up'}">${saldo>0?'+':''}${fmt(saldo)}</div><ul><li>criado − queimado por você<b></b></li><li>com você agora<b>${fmt(s.grao)}</b></li></ul><p class="muted" style="font-size:11px">O resto foi para os feirantes, em compras na ${TEMA.lugares.mercado}.</p></div>
    <div class="tile term"><h3>Termômetro</h3><div class="big" style="font-size:17px">${lbl}</div><div class="gauge" role="img" aria-label="Termômetro: ${lbl}, razão ${ratio.toFixed(2).replace('.',',')}"><i></i><i></i><i></i><i></i><span class="ptr" style="left:calc(${pos}% - 2px)"></span></div><div class="glabels"><span>Inflando</span><span>Aquecida</span><span>Equilibrada</span><span>Deflação</span></div><p class="muted" style="font-size:11px">Queimado por você ÷ criado = <b class="num">${ratio.toFixed(2).replace('.',',')}</b></p></div>
    <div class="tile"><h3>${TEMA.lugares.feirantes}</h3><div class="big num">${fmt(s.mercado.poolRobos)}</div><ul><li>${MOE} com os feirantes agora<b></b></li><li>reserva inicial<b>${fmt(E.reservaRobos)}</b></li>${qu.taxasRobos?`<li>taxas antigas entre feirantes<b>${fmt(qu.taxasRobos)}</b></li>`:''}</ul><p class="muted" style="font-size:11px">Negócios entre feirantes não criam nem queimam ${MOE}. ${ecoInvariante()?'Conta fechada: você + feirantes = criado + reserva − tudo o que foi queimado.':'Conta não fechou!'}</p></div>
    <div class="tile"><h3>Cartas</h3><ul><li>criadas: presente<b>${fmt(C.presente)}</b></li><li>pacotes<b>${fmt(C.pacotes)}</b></li><li>tesouros<b>${fmt(C.baus)}</b></li><li>criação (${BRAS})<b>${fmt(C.criacao)}</b></li><li>queimadas na fogueira<b>${fmt(C.queimadas)}</b></li><li>consumidas em melhorias<b>${fmt(C.melhoria)}</b></li><li>compradas na ${TEMA.lugares.mercado}<b>${fmt(C.compradas)}</b></li><li>vendidas na ${TEMA.lugares.mercado}<b>${fmt(C.vendidas)}</b></li></ul></div>
    <div class="tile"><h3>${BRAS}</h3><div class="big num">${fmt(s.po)}</div><ul><li>ganho<b>${fmt(E.poGanho)}</b></li><li>gasto<b>${fmt(E.poGasto)}</b></li></ul><p class="muted" style="font-size:11px">${BRAS} não se vendem e nunca viram ${MOE}.</p></div>
    <div class="tile" style="grid-column:span 2"><h3>Preço médio por raridade na ${TEMA.lugares.mercado}</h3><ul>${RARS.map(r=>{const a=mediaRar(r),b=mediaRar(r,true);const v=b?(a-b)/b:0;return `<li><span>${gemIc(r,11)} ${RAR_NOME[r]}</span><b>${fmt(a)} ${MOE} ${varHTML(v)}</b></li>`;}).join('')}</ul></div>
   </div>
   <section class="panel"><div class="ph"><h3>Criado × queimado por você (acumulado)</h3><div class="legend"><span><i style="background:#F2BE4A"></i>criado</span><span><i style="background:#F0806A"></i>queimado por você</span></div></div>
    <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Gráfico: ${MOE} criados ${fmt(t.c)} e queimados por você ${fmt(t.qv)}">
     <line x1="10" y1="${H-14}" x2="${W-10}" y2="${H-14}" stroke="#4D3D2A" stroke-width="1"/>
     <polyline points="${line('c')}" fill="none" stroke="#F2BE4A" stroke-width="3" vector-effect="non-scaling-stroke"/>
     <polyline points="${line('v')}" fill="none" stroke="#F0806A" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>
    <p class="muted" style="font-size:12px">Quando a linha vermelha fica muito abaixo da amarela, entram mais ${MOE} do que saem: é inflação. Pacotes, melhorias, pressa nos tesouros e taxas puxam a vermelha para cima.</p>
    <p class="muted" style="font-size:12px;margin-top:6px">Como a ${TEMA.lugares.mercado} se mexe: cada carta tem um “hype” que sobe e desce sozinho, e os feirantes anunciam ou compram cópias até a oferta voltar para perto do normal. Pouca oferta deixa o preço alto. Quando você compra, a oferta cai e o preço sobe; quando você vende, acontece o contrário.</p></section>
  </div>`;
}

/* ===================== v4: modos de jogo (Treino, Desafio do Dia, Torneio da Feira) ===================== */
const tempoAte=ms=>{const m=Math.max(1,Math.ceil(ms/60000)),h=Math.floor(m/60);return h?h+' h '+(m%60)+' min':m+' min';};
const nomeEtapa=i=>TEMA.etapas[i]||(i===TORNEIO.etapas.length-1?'Final':TORNEIO.etapas[i].nome);
function modosHTML(){
  const D=infoDesafio(),T=infoTorneio(),G=REGRA[D.regra];
  const tile=(m,icH,tit,sub,o)=>{o=o||{};
    return `<button class="mtile mt-${m}${o.trav?' trav':''}${o.hot?' hot':''}" data-act="modo" data-m="${m}" data-k="modo-${m}" aria-label="${escH(tit)}: ${escH(o.aria||sub)}">
      <span class="mti">${icH}${o.trav?`<span class="mlock">${ic('cadeado',14)}</span>`:''}</span>
      <span class="mtt"><b>${escH(tit)}</b><small>${sub}</small></span>${o.hot?'<i class="dot" aria-hidden="true"></i>':''}</button>`;};
  const tr=tile('treino',ic('treino',26),'Treino','sem troféus');
  const dTrav=!D.liberado;
  const de=tile('desafio',ic(dTrav?'desafio':G.ic,26),MODO_NOME.desafio,dTrav?'Arena '+DESAFIO.arenaMin:D.venceu?'Prêmio pego ✓':escH(G.nome),{trav:dTrav,hot:!dTrav&&!D.venceu,aria:dTrav?'abre na Arena '+DESAFIO.arenaMin:D.venceu?'prêmio de hoje já pego':'regra de hoje: '+G.nome+', prêmio disponível'});
  const tTrav=!T.liberado;
  const tsub=tTrav?'Arena '+TORNEIO.arenaMin:T.ativo?escH(nomeEtapa(T.etapa))+' te espera!':T.entradas>=T.maxDia?'Volte amanhã':`<span class="num">${T.taxa}</span> ${MOEC} · <span class="num">${T.entradas}/${T.maxDia}</span> hoje`;
  const to=tile('torneio',ic('torneio',26)+(T.titulos?`<span class="mfx num">×${T.titulos}</span>`:''),MODO_NOME.torneio,tsub,{trav:tTrav,hot:T.ativo,aria:tTrav?'abre na Arena '+TORNEIO.arenaMin:T.ativo?nomeEtapa(T.etapa)+' te espera':T.taxa+' '+MOE+', '+T.entradas+' de '+T.maxDia+' hoje'});
  return `<div class="modos" role="group" aria-label="Modos de jogo"><h4>Modos de jogo</h4><div class="mtiles">${tr}${de}${to}</div></div>`;
}
function abrirModo(m){
  if(!deckOk()){sfx('erro');toast('Seu deck precisa de 20 cartas. Arrume em Cartas › Meu deck.');return;}
  if(m==='treino')return abrirTreino();
  if(m==='desafio'){if(!modoLiberado('desafio')){sfx('erro');toast('Abre na Arena '+DESAFIO.arenaMin+' ('+ARENAS[DESAFIO.arenaMin-1].trof+' troféus).');return;}return abrirDesafio();}
  if(m==='torneio'){if(!modoLiberado('torneio')){sfx('erro');toast('Abre na Arena '+TORNEIO.arenaMin+' ('+ARENAS[TORNEIO.arenaMin-1].trof+' troféus).');return;}return abrirTorneio();}
}
function comecarModo(ov,o){if(!o)return;fecharOv(ov,true);if(deckOk())iniciarPartida(o);}
/* ---------- Treino ---------- */
function abrirTreino(){
  garantirModos();
  const t=s.treino,lista=rivaisTreino();
  if(!lista.includes(t.rival))t.rival=lista[0];
  const vistas=regrasVistas();if(t.regra&&!vistas.includes(t.regra))t.regra=null;
  const draw=()=>`<div class="treino">
    <div class="tsec"><h4>Rival</h4><div class="rgrid">${lista.map(id=>{const R=RIVAIS[id],ar=ARENAS.find(A=>A.rival===id);
      return `<button class="rvb${t.rival===id?' on':''}" data-tr="rival" data-v="${id}" aria-pressed="${t.rival===id}"><span class="rvp">${artCanvas(R.retrato)}</span><b>${escH(R.curto||R.nome)}</b><small>${ar?'Arena '+ar.n:'Feira'}</small></button>`;}).join('')}</div></div>
    <div class="tsec"><h4>Dificuldade</h4><div class="seg" role="group" aria-label="Dificuldade">${['facil','medio','dificil'].map(k=>`<button data-tr="tier" data-v="${k}" aria-pressed="${t.tier===k}">${TIER_NOME[k]}</button>`).join('')}</div></div>
    <div class="tsec"><h4>Regra especial</h4><div class="rchips"><button class="fchip" data-tr="regra" data-v="" aria-pressed="${!t.regra}">Nenhuma</button>${vistas.map(id=>`<button class="fchip" data-tr="regra" data-v="${id}" aria-pressed="${t.regra===id}">${ic(REGRA[id].ic,14)}${escH(REGRA[id].nome)}</button>`).join('')}</div>
      ${vistas.length?'':'<p class="muted" style="font-size:12px;margin-top:4px">As regras do ${MODO_NOME.desafio} que você já jogou aparecem aqui.</p>'}
      ${t.regra?regraCardHTML(t.regra,{cls:'mini'}):''}</div>
    <p class="tnote">Treino não vale troféus nem ${MOE}. É só pra praticar!</p>
    <button class="btn gold big wide" data-tr="jogar">Jogar treino</button></div>`;
  const ov=abrirFolha(draw(),{titulo:'Treino',tituloHTML:ic('treino',22)+' Treino',cls:'sh-modo'});
  const body=$('.sbody',ov);
  body.addEventListener('click',e=>{const b=e.target.closest('[data-tr]');if(!b)return;const k=b.dataset.tr;
    if(k==='jogar'){save();sfx('tap');comecarModo(ov,jogarTreino());return;}
    if(k==='regra')t.regra=b.dataset.v||null;else t[k]=b.dataset.v;
    save();sfx('tap');const y=body.scrollTop;body.innerHTML=draw();hydrateGfx(body);body.scrollTop=y;
    const f=$(`[data-tr="${k}"][data-v="${b.dataset.v}"]`,body);if(f)try{f.focus({preventScroll:true});}catch(e2){}});
}
/* ---------- Desafio do Dia (Desafio da Lua) ---------- */
function abrirDesafio(){
  garantirModos();
  const D=infoDesafio(),R=RIVAIS[D.rival],P=DESAFIO.premio;
  const html=`<div class="desafio">
    ${regraCardHTML(D.regra,{cls:'grande'})}
    <div class="drv"><span class="rvp">${artCanvas(R.retrato)}</span><span>Rival de hoje: <b>${escH(R.nome)}</b> <span class="muted">(no seu nível)</span></span></div>
    <div class="dpr ${D.venceu?'ok':''}">${D.venceu?`<b class="okmsg">Prêmio de hoje já pego ✓</b>`:`<i class="dot" aria-hidden="true"></i><span>Prêmio: <b>${escH(PACKS.semente.nome)} + ${P.po} ${BRAS}</b> <span class="muted">(1 vez por dia)</span></span>`}${packImg('semente',26)}${ic('po',20)}</div>
    <p class="muted dct">Nova regra amanhã${D.tentativas?` · tentativas hoje: <b class="num">${D.tentativas}</b>`:''}</p>
    <button class="btn gold big wide" data-dj>${D.venceu?'Jogar de novo (sem prêmio)':'Jogar desafio'}</button></div>`;
  const ov=abrirFolha(html,{titulo:MODO_NOME.desafio,tituloHTML:ic('desafio',22)+' '+MODO_NOME.desafio,cls:'sh-modo'});
  $('[data-dj]',ov).onclick=()=>{sfx('tap');comecarModo(ov,jogarDesafio());};
}
/* ---------- Torneio (Peleja das Lendas) ---------- */
let torneioOv=null;
function abrirTorneio(){
  garantirModos();
  if(torneioOv&&torneioOv.isConnected)fecharOv(torneioOv,true);
  const ov=abrirFolha('',{titulo:MODO_NOME.torneio,tituloHTML:ic('torneio',22)+' '+MODO_NOME.torneio,cls:'sh-modo sh-torneio',onClose:()=>{torneioOv=null;refresh();}});
  torneioOv=ov;const body=$('.sbody',ov);
  const draw=()=>{body.innerHTML=torneioHTML();hydrateGfx(body);};
  draw();
  body.addEventListener('click',async e=>{const b=e.target.closest('[data-tn]');if(!b||b.disabled)return;const k=b.dataset.tn;
    if(k==='entrar'){
      const ok=await perguntar(`Entrar na ${MODO_NOME.torneio} por <b>${TORNEIO.taxa} ${MOEC}</b>? A inscrição vai para a fogueira (some da economia).`,'Entrar',{titulo:MODO_NOME.torneio});
      if(!ok)return;
      const r=entrarTorneio();if(!r.ok){sfx('erro');toast(escH(txtMoeda(r.motivo)));draw();return;}
      sfx('torneio');renderTop();draw();
      const n=$('.tnode.prox',body);if(n&&!RM)n.animate([{transform:'scale(.7)',opacity:0},{transform:'scale(1.08)',opacity:1,offset:.7},{transform:'none'}],{duration:520,easing:'ease-out'});
    }else if(k==='jogar'){sfx('tap');comecarModo(ov,jogarTorneio());torneioOv=null;}
    else if(k==='encerrar'){
      const T=infoTorneio();const P=TORNEIO.premios[T.vitorias];
      const ok=await perguntar(`Encerrar a peleja agora e pegar o prêmio de <b>${T.vitorias} ${T.vitorias===1?'vitória':'vitórias'}</b> (${escH(premioTorneioTxt(P))})?`,'Encerrar',{titulo:'Encerrar a peleja?'});
      if(!ok)return;
      const pr=encerrarTorneio();if(pr){sfx('bauGanho');toast('Prêmio da peleja: '+escH(premioTorneioTxt(pr)),{ms:3600});voarPremio(pr);}
      draw();renderTop();
    }});
}
function torneioHTML(){
  const T=infoTorneio(),E=TORNEIO.etapas;
  const atual=T.ativo?T.etapa:-1;
  // sem torneio ativo e sem inscrições hoje: a chave fica apagada até amanhã
  const fechado=!T.ativo&&T.entradas>=T.maxDia;
  const nodes=E.map((e,i)=>{const R=RIVAIS[e.rival];
    const st=T.ativo?(i<atual?'venceu':i===atual?'prox':'trav'):(i===0&&!fechado?'prox':'trav');
    const lbl=st==='venceu'?'<span class="okmsg">✓ Venceu</span>':st==='prox'?'<span class="tprox">Próxima</span>':`<span class="tlock">${ic('cadeado',12)}</span>`;
    return `<li class="tnode ${st}"><span class="tpt">${artCanvas(R.retrato,{crop:true,anim:st==='prox'})}</span><span class="tni"><small>${escH(nomeEtapa(i))}</small><b>${escH(R.nome)}</b><span class="tier ${e.tier}">${TIER_NOME[e.tier]}</span></span><span class="tst">${lbl}</span>
      ${st==='prox'?`<span class="thp">${ic('coracao',12)} Você começa com <b class="num">${T.ativo?T.hp:20}</b> de vida</span>`:fechado&&i===0?`<span class="thp">${ic('cadeado',12)} Novas inscrições amanhã</span>`:''}</li>`;}).join('');
  const lad=TORNEIO.premios.map((P,v)=>`<li class="${T.ativo&&v===T.vitorias?'cur':''}${v===3?' camp':''}"><span class="pv num">${v}</span><span>${v===1?'vitória':'vitórias'}${v===3?' · campeã(o)':''}</span><b>${escH(premioTorneioTxt(P))}</b></li>`).join('');
  let acts='';
  if(T.ativo){
    acts=`<button class="btn gold big wide" data-tn="jogar">Jogar a ${escH(nomeEtapa(T.etapa))}</button>
      <button class="btn md wide" data-tn="encerrar">Encerrar e pegar prêmio</button>`;
  }else{
    const m=T.motivo;
    acts=`<button class="btn gold big wide" data-tn="entrar" ${m?'disabled':''}>Entrar · ${ic('coin',20)} <span class="num">${T.taxa}</span> ${MOEC}</button>${m?`<p class="note">${escH(txtMoeda(m))}</p>`:''}`;
  }
  return `<div class="torneio">
    <p class="tintro">3 partidas seguidas. Perdeu ou empatou, acabou. Sua vida passa de uma partida para a outra (+${TORNEIO.cura} de cura entre elas).</p>
    <ol class="chave" aria-label="Chave da peleja">${nodes}</ol>
    <section class="tlad"><h4>Prêmios por vitórias</h4><ol>${lad}</ol></section>
    <div class="tacts">${acts}</div>
    <p class="tburn">${ic('coin',14)} A inscrição vai para a fogueira: some da economia.</p>
    <p class="muted tinfo">Hoje: <b class="num">${T.entradas}/${T.maxDia}</b> pelejas${T.titulos?` · Fitas da Peleja: <b class="num">${T.titulos}</b>`:''}${T.melhor?` · melhor: <b class="num">${T.melhor}</b> ${T.melhor===1?'vitória':'vitórias'}`:''}</p>
  </div>`;
}

/* ===================== v4: Combinações (famílias, duplas, Combo) ===================== */
const capital=t=>t.charAt(0).toUpperCase()+t.slice(1);
const duplaFeita=id=>(s.codex&&s.codex.duplas[id])||0;
const duplasDescobertas=()=>DUPLAS.filter(d=>duplaFeita(d.id)).length;
/* uma dupla que você já pode fazer (tem as duas cartas) e ainda não descobriu */
const duplasPend=()=>DUPLAS.filter(d=>!duplaFeita(d.id)&&temCarta(d.a)&&temCarta(d.b)).map(d=>d.id);
/* o pontinho só acende para dupla possível que você ainda não viu na aba Combinações */
const duplaPendente=()=>{const v=((s.codex&&s.codex.dpVisto)||'').split(',');return duplasPend().some(id=>!v.includes(id));};
function marcarDuplasVistas(){if(!s.codex||!duplaPendente())return false;const v=new Set(((s.codex.dpVisto)||'').split(',').filter(Boolean));duplasPend().forEach(id=>v.add(id));s.codex.dpVisto=[...v].join(',');save();return true;}
function famMembros(f){return COLECAO.filter(c=>c.familia===f);}
function renderCombinacoes(b){
  const fams=FAM_ORDEM.map(f=>{const F=FAMILIAS[f],ms=famMembros(f),tem=ms.filter(c=>temCarta(c.id)).length;
    return `<button class="famrow" data-act="famfiltro" data-v="${f}" data-k="fam-${f}" style="--fc:${F.cor}" aria-label="Família ${escH(F.nome)}: com 2, ${escH(F.txt[0])}; com 3 ou mais, ${escH(F.txt[1])}. Você tem ${tem} de ${ms.length}. Toque para ver na coleção.">
      <span class="fhd"><span class="fico">${ic(F.ic,22)}</span><b>${escH(F.nome)}</b><span class="num muted">${tem}/${ms.length} que você tem</span></span>
      <span class="fbn"><span><small>com 2</small>${escH(F.txt[0])}</span><span><small>com 3+</small>${escH(F.txt[1])}</span></span>
      <span class="fms">${ms.map(c=>`<span class="fm${temCarta(c.id)?'':' nt'}" title="${escH(c.nome)}">${artCanvas(c.id,{crop:true,dark:!temCarta(c.id)})}</span>`).join('')}</span></button>`;}).join('');
  const dps=DUPLAS.map(d=>duplaCardHTML(d)).join('');
  b.innerHTML=`<div class="combos">
    <section class="panel"><div class="ph"><h3>${ic('familia',18)} Famílias</h3></div><p class="muted cxp">${escH(capital(ROTULO_INFO.familia.tip.replace(/^Família: /,'')))}</p><div class="famlist">${fams}</div></section>
    <section class="panel"><div class="ph"><h3>${ic('dupla',18)} Duplas</h3><span class="num dcnt">Duplas descobertas: <b>${duplasDescobertas()}/${DUPLAS.length}</b></span></div><p class="muted cxp">${escH(capital(ROTULO_INFO.dupla.tip.replace(/^Dupla: /,'')))} A primeira vez que você faz cada uma vale <b>+10 ${BRAS}</b>.</p><div class="dgrid">${dps}</div></section>
    <section class="panel ccombo"><div class="ph"><h3>${ic('combo',18)} Combo</h3></div>
      <div class="cfan" aria-hidden="true">${['codorna-ninheira','galo-despertador','vaca-mimosa'].map((id,i)=>`<span style="--i:${i}">${cardHTML(id,{sz:'thumb'})}</span>`).join('')}<span class="cx3">Combo x3!</span></div>
      <p>${escH(capital(ROTULO_INFO.combo.tip.replace(/^Combo: /,'')))}</p><p class="muted" style="font-size:12px;margin-top:4px">Com o ${escH(CARD['sanfoneiro-do-forro'].nome)} em campo, o Combo começa já na 2ª carta.</p></section>
  </div>`;
}
function duplaCardHTML(d){
  const n=duplaFeita(d.id);
  const pc=id=>`<span class="dpc" title="${escH(CARD[id].nome)}">${artCanvas(id,{crop:true,dark:!temCarta(id)})}<small>${escH(CARD[id].curto||CARD[id].nome)}</small></span>`;
  return `<button class="dcard${n?' ok':''}" data-act="dupla" data-v="${d.id}" data-k="dp-${d.id}" style="--dc:${d.cor}" aria-label="Dupla ${escH(d.nome)}: ${escH(CARD[d.a].nome)} e ${escH(CARD[d.b].nome)}, ${DUPLA_TIPO_TXT[d.tipo]}. ${escH(d.txt)} ${n?'Descoberta':'Ainda não descoberta'}.">
    <span class="dpar">${pc(d.a)}<span class="dplus">+</span>${pc(d.b)}</span>
    <span class="dinf"><b>${escH(d.nome)}</b><span class="dtx">${escH(d.txt)}</span><span class="dtp">${ic(d.tipo==='terreno'?'neutro':'dupla',11)} ${DUPLA_TIPO_TXT[d.tipo]}</span>
    <span class="dst">${n?`<span class="okmsg">Descoberta ✓ · <span class="num">${n}×</span></span>`:'<i class="dot" aria-hidden="true"></i><span class="dnew">Descubra! +10 '+BRAS+'</span>'}</span></span></button>`;
}
function abrirDupla(id){
  const d=DUPLA[id];if(!d)return;const n=duplaFeita(id);
  abrirFolha(`<div class="dupdet" style="--dc:${d.cor}"><div class="dfan">${cardHTML(d.a,{sz:'hand',lvl:lvlOf(d.a),unknown:!temCarta(d.a)})}<span class="dplus big">+</span>${cardHTML(d.b,{sz:'hand',lvl:lvlOf(d.b),unknown:!temCarta(d.b)})}</div>
    <p class="dtxt">${escH(d.txt)}</p>
    <p class="muted">${escH(CARD[d.a].nome)} + ${escH(CARD[d.b].nome)} · ${DUPLA_TIPO_TXT[d.tipo]}${d.tipo==='vizinho'?' (terrenos vizinhos)':' (criatura e construção)'}. Uma vez por partida.</p>
    <p>${n?`<b class="okmsg">Descoberta ✓ · ${n}× feita</b>`:'<b class="dnew">Ainda não descoberta: a primeira vez vale +10 '+BRAS+'!</b>'}</p></div>`,{titulo:d.nome,tituloHTML:ic('dupla',20)+' '+escH(d.nome)});
}
/* bloco de família e duplas no detalhe da carta */
function famDuplasHTML(id){
  const c=CARD[id],F=c.familia?FAMILIAS[c.familia]:null,ds=DUPLAS_DE[id]||[];
  let h='';
  if(F)h+=`<div class="dfam" style="--fc:${F.cor}">${ic(F.ic,16)}<span><b>Família: ${escH(F.nome)}</b> · com 2: ${escH(F.txt[0])} · com 3+: ${escH(F.txt[1])}</span></div>`;
  if(ds.length)h+=`<div class="ddup"><b>${ic('dupla',14)} Duplas</b>${ds.map(d=>{const par=d.a===id?d.b:d.a,n=duplaFeita(d.id);
    return `<button class="ddr" data-a="dupla" data-v="${d.id}" style="--dc:${d.cor}"><span class="dpc">${artCanvas(par,{crop:true,dark:!temCarta(par)})}</span><span><b>${escH(d.nome)}</b> · com ${escH(CARD[par].nome)} <small>(${DUPLA_TIPO_TXT[d.tipo]})</small><span class="dtx">${escH(d.txt)}</span>${n?'<span class="okmsg">Descoberta ✓</span>':'<span class="muted">Ainda não descoberta</span>'}</span></button>`;}).join('')}</div>`;
  return h;
}

/* ---------- cliques globais ---------- */
document.addEventListener('click',async e=>{
  const g=e.target.closest('[data-go]');
  if(g&&!inBattle){go(g.dataset.go);return;}
  const a=e.target.closest('[data-act]');if(!a||a.disabled)return;
  const act=a.dataset.act;
  switch(act){
    case 'mute':s.mudo=!s.mudo;save();$$('[data-act="mute"]').forEach(b=>{b.outerHTML=muteBtn(b.classList.contains('rvm')?'rvm':'');});audioInit();sndAplicar();if(!s.mudo)sfx('tap');break;
    case 'musica':s.semMusica=!s.semMusica;save();$$('[data-act="musica"]').forEach(b=>{b.outerHTML=musBtn();});audioInit();musTentar();sfx('tap');break;
    case 'batalhar':if(deckOk())iniciarPartida();break;
    case 'bau':abrirFolhaBau(+a.dataset.i);break;
    case 'trocar':abrirTroca();break;
    case 'pegarM':{const i=+a.dataset.i;const r=pegarMissao(i);if(r){sfx('missao');toast(`Missão feita: +${r.rec.grao?r.rec.grao+' '+MOE:r.rec.po+' '+BRAS}`);if(r.bonus)toast(`Presente do dia: 1 ${escH(PACKS.semente.nome)}! Abra na Loja.`,{ms:4000});if(s.guia===5){s.guia=6;save();vovoFechar();}refresh();}break;}
    case 'pegarT':{const r=pegarTrilha(+a.dataset.t);if(r){sfx('missao');toast('Trilha: '+escH(premioTxt(r).replace(/Arena \d+ \(abre sozinha\) \+ /,'')));refresh();}break;}
    case 'sub':UI.sub=a.dataset.v;refresh();break;
    case 'cf':{const f=a.dataset.f;if(f==='tenho'||f==='novas')UI.cf[f]=!UI.cf[f];else UI.cf[f]=UI.cf[f]===a.dataset.v?null:a.dataset.v;refresh();break;}
    case 'carta':abrirDetalhe(a.dataset.id);break;
    case 'modo':sfx('tap');abrirModo(a.dataset.m);break;
    case 'dupla':sfx('tap');abrirDupla(a.dataset.v);break;
    case 'famfiltro':sfx('tap');UI.sub='colecao';UI.cf={terr:null,rar:null,tenho:false,fam:a.dataset.v,novas:false};refresh();window.scrollTo(0,0);break;
    case 'lanechip':{const i=+a.dataset.i;const t=s.deck.terrenos[i];s.deck.terrenos[i]=TERRS[(TERRS.indexOf(t)+1)%4];save();sfx('tap');refresh();break;}
    case 'dmenos':{const i=s.deck.cartas.indexOf(a.dataset.id);if(i>=0){s.deck.cartas.splice(i,1);save();sfx('solta');refresh();}break;}
    case 'dmais':{const id=a.dataset.id;if(naDeck(id)<maxNoDeck(id)&&s.deck.cartas.length<20&&temCarta(id)){s.deck.cartas.push(id);save();sfx('pega');refresh();}else{sfx('erro');toast(naDeck(id)>=maxNoDeck(id)?(CARD[id].rar==='lendaria'?'Lendária: só 1':'Máx. 2 cópias'):'Deck completo (20/20).');}break;}
    case 'comprarP':comprarPacoteFlow(a.dataset.t);break;
    case 'abrirP':abrirGuardadoFlow(a.dataset.t);break;
    case 'odds':UI.odds[a.dataset.t]=!UI.odds[a.dataset.t];refresh();break;
    case 'mf':{const f=a.dataset.f;if(f==='extra')UI.mf.extra=!UI.mf.extra;else UI.mf[f]=UI.mf[f]===a.dataset.v?null:a.dataset.v;refresh();break;}
    case 'mcomprar':await confirmarCompra(a.dataset.id);break;
    case 'mvender':await confirmarVenda(a.dataset.id);break;
  }
});
function abrirTroca(){
  const ms=s.missoes;if(ms.trocou)return;
  const ov=abrirFolha(`<p style="margin-bottom:8px">Qual missão trocar? Você tem <b>1 troca grátis</b> por dia.</p><div class="acts">${ms.lista.map((x,i)=>x.pego?'':`<button class="btn md wide" data-i="${i}">${escH(MISSAO[x.id].txt)}</button>`).join('')}</div>`,{titulo:'Trocar missão'});
  $$('[data-i]',ov).forEach(b=>b.onclick=()=>{trocarMissao(+b.dataset.i);fecharOv(ov,true);sfx('tap');refresh();});
}

/* ---------- guia da primeira sessão ---------- */
let guiaBolha=0;
function guiaDepoisRender(){
  if(inBattle||OVS.length)return;
  if(s.guia===4&&UI.tab==='inicio'&&!s.baus.some(b=>b&&b.tut)){s.guia=5;save();}
  if(s.guia===5&&UI.tab==='inicio'){
    const m=s.missoes.lista.find(x=>x.id==='melhorar1');
    if(!m||m.pego||m.prog<m.alvo){s.guia=6;save();vovoFechar();return;}
    if(guiaBolha!==5){guiaBolha=5;vovo('Escuta essa: todo dia tem 3 missões. Complete as 3 e ganhe um pacote! Uma já está pronta.',{pos:'nav',foco:false});}
    const b=$('[data-act="pegarM"].hl');if(b&&!isDesk())b.scrollIntoView({block:'center',behavior:RM?'auto':'smooth'});
  }
  if(s.guia===6&&UI.started){/* sem bolha: brilho na trilha e no Batalhar */}
}

/* ---------- abertura e presente ---------- */
function telaAbertura(retorno){
  const el=document.createElement('div');el.className='intro';el.setAttribute('role','dialog');el.setAttribute('aria-label',TEMA.jogo.nome);
  el.innerHTML=`<div class="introcards">${['espiga-sapeca','corvo-ladino','vaca-mimosa'].map((id,i)=>`<div style="transform:rotate(${(i-1)*8}deg) translateY(${i===1?-8:0}px)">${cardHTML(id,{sz:'hand',anim:true})}</div>`).join('')}</div>
   <div class="logo titulo-rye">${escH(TEMA.jogo.nome)}</div><p class="sub">${escH(TEMA.jogo.intro)}</p>
   <button class="btn gold big" data-start>${retorno?'Continuar':'Começar'}</button>
   <p class="muted" style="font-size:12px;max-width:320px">${escH(TEMA.moeda.nome)} aqui é moeda de mentirinha: sem dinheiro real.</p>`;
  document.body.appendChild(el);hydrate(el);
  const b=$('[data-start]',el);setTimeout(()=>{try{b.focus({preventScroll:true});}catch(e){}},50);
  return new Promise(res=>{b.onclick=()=>{audioInit();sfx('tap');el.remove();res();};});
}
function telaPresente(){
  const el=document.createElement('div');el.className='intro';el.setAttribute('role','dialog');el.setAttribute('aria-label','Presente de boas-vindas');
  const ids=deckDeMapa(STARTER);
  el.innerHTML=`<h1 class="pix" style="color:var(--gold);font-size:28px">Presente de boas&#8209;vindas!</h1>
   <div class="fan" aria-hidden="true">${ids.map((id,i)=>`<div class="fc">${cardHTML(id,{sz:'hand'})}</div>`).join('')}</div>
   <p class="gift">20 cartas · o deck “Primeiras Lendas”</p>
   <p class="gift">${ic('coin',22)} <span class="num">+300</span> ${MOEC} <span class="muted" style="font-size:14px">(moeda simulada)</span></p>
   <button class="btn gold big" data-go2>Vamos jogar!</button>`;
  document.body.appendChild(el);hydrate(el);
  const fcs=$$('.fc',el);const n=fcs.length;
  fcs.forEach((f,i)=>{const ang=(i-(n-1)/2)*4;const tr=`rotate(${ang}deg)`;if(RM){f.style.transform=tr;f.animate([{opacity:0},{opacity:1}],{duration:400,fill:'backwards',delay:i*20});}else f.animate([{transform:'translateY(160px) rotate(0deg)',opacity:0},{transform:tr,opacity:1}],{duration:700,delay:i*25,easing:'cubic-bezier(.2,.8,.3,1.2)',fill:'both'});f.style.transform=tr;});
  sfx('moedas',8);
  const b=$('[data-go2]',el);setTimeout(()=>{try{b.focus({preventScroll:true});}catch(e){}},50);
  return new Promise(res=>{b.onclick=()=>{sfx('tap');el.remove();res();};});
}

