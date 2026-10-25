/* ===================== BATALHA: tela, animações, turnos, tutorial ===================== */
let B=null;
const BU={fila:[],jogando:false,sel:null,insp:null,inspT:0,why:null,whyT:0,busy:false,tut:null,tutWait:null,tutTok:null,lp:0,lpFired:false,regraT:0,famPend:{},ultimo:null};
const PODE_RIVAL=()=>RIVAIS[B.rival];
const vel=ms=>RM?Math.min(ms,200):ms;
const TXT_TUT=Object.assign({},TEMA.tut); // textos do tutorial: TEMA.tut (12-tema.js)

/* ---------- começar ---------- */
/* o = {modo:'arena'|'treino'|'desafio'|'torneio', ...} (ver prepararPartida em 55-modos). Sem o: Arena, como sempre. */
function iniciarPartida(o){
  o=o||{modo:'arena'};
  if(s.guia===6){s.guia=7;save();}
  vovoFechar();
  const nb=prepararPartida(o);
  if(!nb){toast('Não deu para começar essa partida agora.');return false;}
  B=nb;BU.ultimo=Object.assign({},o);BU.famPend={};BU.regraT=0;
  abrirBatalha();
  iniciarTurno(B,'p');B.ev=[];
  BU.busy=false;bRender();
  log(B,'Partida contra '+RIVAIS[B.rival].nome+'! Você começa.');B.ev=[];
  const G=eventoRegra(B);
  bRender();
  if(G)tocarEventos(); // o evento "regra" mostra a carta da regra e depois o "Sua vez!"
  else fxBanner('Sua vez!','turno',{sub:subInicio()});
  focarMao();
  return true;
}
/* linha de baixo da faixa "Sua vez!" no começo da partida */
function subInicio(){
  if(B.modo==='treino')return 'Treino · '+TIER_NOME[B.tier];
  if(B.modo==='torneio'){const E=TORNEIO.etapas[B.etapa];return MODO_NOME.torneio+' · '+(TEMA.etapas[B.etapa]||(E?E.nome:''));}
  if(B.modo==='desafio')return MODO_NOME.desafio;
  const A=arenaDef(B.arena);return 'Arena '+A.n+' · '+A.nome;
}
function iniciarTutorial(){
  vovoFechar();
  missaoMute=true;
  const rest=deckDeMapa(STARTER);
  for(const id of TUT.hand.concat(TUT.draws)){const i=rest.indexOf(id);if(i>=0)rest.splice(i,1);}
  const pDeck=TUT.draws.map(id=>mkInst(id,1)).concat(shuffle(rest.map(id=>mkInst(id,1))));
  const rDeck=deckDeMapa(STARTER).slice(0,16).map(id=>mkInst(id,1));
  B=novaBatalha({tut:true,rival:'pipoca',arena:1,tier:'facil',p:{hp:20,deck:pDeck,lanes:STARTER_LANES.slice(),nome:'Você'},r:{hp:8,deck:rDeck,lanes:RIVAIS.pipoca.lanes.slice(),nome:RIVAIS.pipoca.nome}});
  B.sides.p.hand=TUT.hand.map(id=>mkInst(id,1));
  B.sides.r.hand=['ovelha-felpuda','pintinho-valente','gato-do-celeiro','bode-marrento'].map(id=>mkInst(id,1));
  abrirBatalha();
  iniciarTurno(B,'p');B.ev=[];
  BU.busy=false;BU.tut={hand:new Set(),lanes:new Set(),atk:false};bRender();
  tutorialScript();
}
function laneShell(P,i){
  const t=B.sides[P].lanes[i].terr;
  // v7: sem canteiro cercado. O botão é invisível, por cima do lugar do personagem no cenário (pintado atrás de tudo).
  // .chao = o anel no chão (marca do terreno vazio, brilho de alvo); .bs = construção; .sl = o personagem
  return `<button class="lane terr-${t} lado-${P}" id="ln-${P}-${i}" data-side="${P}" data-lane="${i}"><span class="chao" aria-hidden="true"></span><span class="aura" aria-hidden="true"></span><span class="bs" data-bs></span><span class="sl" data-sl></span></button>`;
}
/* tamanho do tabuleiro conforme a tela (ver CSS bm-*) */
function modoTabuleiro(){
  const w=window.innerWidth,h=window.innerHeight;
  if(w>=700&&h>=860)return 'l';
  if(w>=700&&h>=640)return 'lc';
  return h>=760?'m':'s';
}
const LARG_MAO={s:76,m:100,l:140,lc:140};
function aplicarModo(){const el=$('#battle');if(!el||!B)return;const m=modoTabuleiro();if(BU.bm!==m){BU.bm=m;el.className='battle ar'+B.arena+' bm-'+m+(P3D.on?' b3d':'');}medirPersonagem();}
/* v7: o tamanho dos personagens vem do espaço do cenário: a fila do rival (longe) é menor, a sua (perto) é maior,
   e sobra um chão no meio para a briga. Múltiplos de 8 px (o desenho é 64x64). */
function medirPersonagem(){
  const el=$('#battle'),cp=$('#bCampo'),ln=$('#ln-p-0');if(!el||!cp||!ln)return;
  const H=cp.clientHeight,Lw=ln.getBoundingClientRect().width;if(!H||!Lw)return;
  const cs=getComputedStyle(el),sth=parseFloat(cs.getPropertyValue('--sth'))||22,pz=parseFloat(cs.getPropertyValue('--pz'))||10;
  const nome=BU.bm!=='s';el.classList.toggle('sem-nome',!nome);
  const pe=sth+4+(nome?Math.round(pz*1.2+5):0);
  let sp=Math.floor(Math.min(H*0.40,Lw*1.42,192)/8)*8,sr=0,gap=0;
  const rv=v=>Math.max(56,Math.floor(v*0.8/8)*8);
  for(;sp>64;sp-=8){sr=rv(sp);gap=H-(sp*0.94+pe)-(sr*0.94+pe);if(gap>=H*(BU.bm==="l"||BU.bm==="lc"?0.1:0.22))break;}
  sp=Math.max(64,sp);sr=Math.min(sp,rv(sp));
  el.style.setProperty('--spr',sp+'px');el.style.setProperty('--sprR',sr+'px');el.style.setProperty('--pe',pe+'px');
  el.classList.remove('ul');
  if(typeof palcoMedir==='function')palcoMedir();
}
function motesHTML(){let h='';for(let i=0;i<10;i++)h+=`<i style="--mx:${(i*37+11)%96+2}%;--my:${(i*53+7)%90+4}%;--md:${7+(i%4)*2.5}s;--mdl:${(-(i*1.7)%9).toFixed(1)}s"></i>`;return h;}
function abrirBatalha(){
  inBattle=true;MUS.int=0;musica('arena');BU.fila=[];BU.jogando=false;BU.sel=null;BU.insp=null;BU.why=null;BU.eAnt=null;$('#toasts').innerHTML='';
  $('#app').hidden=true;
  fxLimpar();
  const el=$('#battle');el.hidden=false;BU.bm=null;aplicarModo();el.scrollTop=0;
  el.innerHTML=`<canvas class="bcena" id="bCena" aria-hidden="true"></canvas><div class="bwrap"><div class="board" id="board"><div class="thinking" id="bThink" role="status"></div>
    <div class="btop${B.regra?' com-regra':''}">${B.tut?'<button class="tbtn" data-bact="pular">Pular tutorial</button>':`<button class="ibtn" data-bact="desistir" aria-label="Desistir" title="Desistir">${ic('bandeira',18)}</button>`}${B.regra?`<button class="ibtn rgbtn" data-bact="regra" aria-label="Regra: ${escH(REGRA[B.regra].nome)}" title="${escH(REGRA[B.regra].nome)}">${ic(REGRA[B.regra].ic,24)}</button>`:''}<div class="rd" id="bRound" aria-live="polite"></div><button class="ibtn" data-bact="ajuda" aria-label="Como jogar" title="Como jogar">?</button>${musBtn()}${muteBtn()}</div>
    <div class="hero hero-r" id="hR"></div>
    <div class="campo" id="bCampo"><div class="ceu" aria-hidden="true"></div>
      <div class="lanes lanes-r" id="lR">${[0,1,2,3].map(i=>laneShell('r',i)).join('')}</div>
      <div class="meio" aria-hidden="true"></div>
      <div class="lanes lanes-p" id="lP">${[0,1,2,3].map(i=>laneShell('p',i)).join('')}</div>
    </div>
    <div class="mid"><div class="energy" id="eP"></div><button class="btn gold atkbtn" id="bAtk" data-bact="atacar">Atacar!</button></div>
    <div class="info" id="bInfo"></div>
    <div class="hand" id="bHand" role="group" aria-label="Sua mão"></div>
  </div><aside class="side" id="bSide" aria-label="Painel da partida"></aside></div>`;
  BU.duelo={};
  sprParar();if(!p3dIniciar(el))palcoIniciar($('#bCena'));medirPersonagem();
  window.scrollTo(0,0);
}
function fecharBatalha(){
  musica('fazenda');
  inBattle=false;missaoMute=false;BU.tut=null;BU.tutTok=null;BU.fila=[];BU.jogando=false;BU.sel=null;vovoFechar();
  p3dParar();palcoParar();fxLimpar();sprParar();
  const el=$('#battle');el.hidden=true;el.innerHTML='';$('#fx').innerHTML='';
  $('#app').hidden=false;B=null;
}

/* ---------- desenho ---------- */
function heroMontar(el,P){
  const nome=P==='r'?RIVAIS[B.rival].nome:'Você';
  const rid=P==='r'?RIVAIS[B.rival].retrato:retratoId('voce');
  el.dataset.m=B.rival+P;
  /* v10: título equipado (Vila/Livro de Causos) ao lado do nome: "Você · Vigia do Sertão" (uma linha só, reticências se faltar espaço) */
  let tit='';if(P==='p')try{const u=s&&s.cosm&&s.cosm.usa,t=u&&u.titulo,c=t&&typeof COSM!=='undefined'&&COSM[t];if(c&&c.nome)tit=c.nome;}catch(e){tit='';}
  el.dataset.tit=tit;const tCel=!!tit&&(()=>{try{return matchMedia('(max-width:899px)').matches;}catch(e){return false;}})(); // no celular o "deck N" sobe para a linha do nome
  el.innerHTML=`<span class="pt">${artCanvas(rid,{crop:true})}</span><span class="hn"><b${tit&&tCel?' style="padding-right:50px"':''}>${escH(nome)}${tit?`<span class="htit" style="font-weight:600;font-size:.86em;color:#F2C98A"> · <span style="display:inline-block;vertical-align:bottom;max-width:min(12em,20vw);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escH(tit)}</span></span>`:''}</b><span class="hpb"><span class="hpn">${ic('coracao',14)}<span class="num" data-hp></span><small class="num" data-hpm></small></span><span class="bar" aria-hidden="true"><i class="gh"></i><i class="fl"></i></span></span></span><span class="cnt"></span>`;
  hydrate(el);
}
function heroAtualizar(el,P){
  if(!el)return;
  if(el.dataset.m!==B.rival+P||!$('[data-hp]',el))heroMontar(el,P);
  const S=B.sides[P],hp=Math.max(0,S.hp),pct=(clamp(hp/S.maxHp,0,1)*100).toFixed(1)+'%';
  const n=$('[data-hp]',el);if(n.textContent!==String(hp)){const antes=n.textContent;n.textContent=hp;if(antes!==''&&!RM&&n.animate)n.animate([{transform:'scale(1.5)',color:+antes>hp?'#FF7A6A':'#9BFF8A'},{transform:'none'}],{duration:420,easing:'ease-out'});}
  $('[data-hpm]',el).textContent='/'+S.maxHp;
  $('.bar .fl',el).style.width=pct;$('.bar .gh',el).style.width=pct;
  el.classList.toggle('low',S.hp<=6);
  const cnt=$('.cnt',el);const mb=P==="r"?descModoTema(B):'';const ck=(P==='r'?S.hand.length+'|'+S.deck.length:String(S.deck.length))+'|'+mb;
  if(cnt.dataset.k!==ck){cnt.dataset.k=ck;
    const chs=P==='r'?`<span class="ch" title="Cartas na mão do rival">mão <span class="num">${S.hand.length}</span></span><span class="ch" title="Cartas no deck do rival">deck <span class="num">${S.deck.length}</span></span>`:`<span class="ch" title="Cartas no seu deck">deck <span class="num">${S.deck.length}</span></span>`;
    // v4: selo do modo (Treino, Desafio, Torneio · Final) em cima das contas do rival
    cnt.classList.toggle('com-modo',!!mb);
    cnt.innerHTML=mb?`<span class="mbadge mb-${B.modo}">${ic(MODO_IC[B.modo]||'treino',12)}<span>${escH(mb)}</span></span><span class="chs">${chs}</span>`:chs;}
}
function selInst(){return BU.sel?B.sides.p.hand.find(h=>h.uid===BU.sel):null;}
function alvosSel(){
  const inst=selInst();const set=new Set();if(!inst)return set;
  const c=CARD[inst.id];
  if(c.tipo==='feitico'&&!c.alvo){[0,1,2,3].forEach(i=>set.add('p'+i));return set;}
  for(const t of alvosLegais(B,'p',inst))set.add(t.side+t.lane);
  if(BU.tut&&BU.tut.laneFor&&BU.tut.laneFor[inst.id]){for(const k of [...set])if(!BU.tut.laneFor[inst.id].includes(k))set.delete(k);}
  return set;
}
function bldIc(id){return id==='moinho-de-vento'?ic('neutro',10):id==='colmeia-dourada'?ic('pomar',10):id==='galinheiro'?ic('ninhada',10):id==='trator-vermelho'?ic('pisotear',10):ic('pasto',10);}
const MODO_IC={treino:'treino',desafio:'desafio',torneio:'torneio',arena:'trofeu'};
/* nível de família que a tela mostra agora (o evento "familia" ainda não tocado segura o nível antigo) */
function famVisivel(P,f){const k=P+f;if(BU.famPend&&k in BU.famPend)return BU.famPend[k];return (B.famNiv&&B.famNiv[P]&&B.famNiv[P][f])||0;}
/* v6: a peça do campo é o PERSONAGEM (canvas 64x64 do sprite), não mais a carta.
   Contrato dos testes: continua um elemento .card com data-id e data-uid dentro do .lane. */
function unitStatsHTML(c){
  const b=statsBase(c.id,c.lvl),atk=effAtk(c),hp=Math.max(0,c.hp);
  const ac=atk>b.atk?'up':atk<b.atk?'down':'',hc=c.hp<c.maxHp?'dmg':c.hp>b.hp?'up':'';
  return `<span class="st atk ${ac}" title="Ataque">${ic('espada',12)}<b class="num">${atk}</b></span><span class="st hp ${hc}" title="Vida">${ic('coracao',12)}<b class="num">${hp}</b></span>`;
}
function unitSelosHTML(c,P,L,fniv){
  const C=CARD[c.id],F=C.familia?FAMILIAS[C.familia]:null;
  const famK=fniv&&c.fb&&c.fb.kw?{kw:c.fb.kw,cor:F.cor}:null;
  let k=kwIcons(c.kw,12,temHabilidadeExtra(c.id),famK);
  if(c.aff)k+=`<span class="kw affc" style="--tcc:${TERR_COR[L.terr]}" title="+1/+1 no terreno da mesma cor">${terrIc(L.terr,12)}</span>`;
  let h=`<span class="kws">${k}</span>`;
  if(c.rest&&!c.dead)h+='<span class="zz" aria-hidden="true"><i>z</i><i>Z</i><i>z</i></span>';
  if(fniv&&F)h+=`<span class="famc${fniv>=2?' n2':''}" style="--fc:${F.cor}" title="Família ${escH(F.nome)}: ${escH(F.txt[fniv-1])}">${ic(F.ic,11)}${fniv>=2?'<i>+</i>':''}</span>`;
  if(c.raiz)h+=`<span class="raizb" title="Enraizada: não ataca no próximo combate">${ic('raiz',12)}</span>`;
  return h;
}
function unitCls(c){return 'card unit r-'+CARD[c.id].rar+' tp-criatura'+(c.dead?' dying':'')+(c.aff?' affy':'')+(c.raiz?' raizc':'')+(c.rest&&!c.dead?' sono':'');}
function unitHTML(c,P,L,fniv){
  const C=CARD[c.id];
  // celular: nome curto (a primeira palavra quando a carta não tem um)
  const cel=BU.bm==='s'||BU.bm==='m',lim=cel?(BU.bm==='s'?9:11):16;
  let nome=C.nome;if(nome.length>lim){nome=C.curto&&C.curto.length<nome.length?C.curto:nome;if(nome.length>lim&&nome.split(' ')[0].length>=4)nome=nome.split(' ')[0];}
  return `<div class="${unitCls(c)}" data-id="${c.id}" data-uid="${c.uid}"><span class="fig"><i class="sh"></i><i class="ring"></i>${C.rar==='lendaria'?'<i class="halo"></i>':''}<canvas class="spr" width="64" height="64" aria-hidden="true"></canvas><i class="raizv"></i></span><span class="selos">${unitSelosHTML(c,P,L,fniv)}</span><div class="ft">${unitStatsHTML(c)}</div><span class="cn">${escH(nome)}</span></div>`;
}
function unitAtualizar(cur,c,P,L,fniv){
  const cls=unitCls(c);
  // classes do estado (sem tirar as que os efeitos puseram, como fx-pre)
  for(const k of ['dying','affy','raizc','sono'])cur.classList.toggle(k,cls.includes(' '+k));
  const ft=$('.ft',cur),nh=unitStatsHTML(c);
  if(ft.dataset.k!==nh){
    const antes=[...ft.querySelectorAll('.st b')].map(b=>b.textContent);
    ft.innerHTML=nh;ft.dataset.k=nh;
    if(!RM)[...ft.querySelectorAll('.st')].forEach((st,k)=>{const b=$('b',st);if(b&&antes[k]!=null&&antes[k]!==b.textContent&&st.animate)st.animate([{transform:'scale(1.5)'},{transform:'none'}],{duration:380,easing:'cubic-bezier(.2,1.6,.4,1)'});});
  }
  const se=$('.selos',cur),sh=unitSelosHTML(c,P,L,fniv);
  if(se.dataset.k!==sh){se.innerHTML=sh;se.dataset.k=sh;}
}
function updLane(P,i,alvos){
  const el=$('#ln-'+P+'-'+i);if(!el)return;
  const L=B.sides[P].lanes[i],c=L.c,sl=$('[data-sl]',el),bs=$('[data-bs]',el);
  const key=P+i;
  // construção: o prédio de pé no fundo do canteiro (personagem também), com a plaquinha do nome
  const bid=L.b?L.b.uid:'';
  if(bs.dataset.u!==String(bid)){bs.dataset.u=bid;bs.className='bs'+(L.b?' has r-'+CARD[L.b.id].rar:'');
    bs.innerHTML=L.b?`<span class="bfig"><i class="sh"></i><canvas class="spr" width="64" height="64"></canvas></span><span class="bt">${bldIc(L.b.id)}<span>${escH(CARD[L.b.id].curto)} <span class="num">${nDe(L.b.id,L.b.lvl)}</span></span></span>`:'';
    if(L.b)sprMontar(bs,L.b.id,'b'+L.b.uid);}
  el.classList.toggle('has-b',!!L.b);
  // criatura: o personagem em pé no canteiro (atualiza no lugar se for o mesmo: o desenho não reinicia)
  const cur=$('.card',sl);
  if(c){
    const fam=CARD[c.id].familia,fniv=fam&&!c.dead?famVisivel(P,fam):0;
    if(cur&&cur.dataset.uid===String(c.uid))unitAtualizar(cur,c,P,L,fniv);
    else{sl.innerHTML=unitHTML(c,P,L,fniv);sprMontar($('.card',sl),c.id,c.uid);}
    sprEstado(c.uid,{sono:!!c.rest&&!c.dead});
  }else if(cur||!sl.firstChild){sl.innerHTML=`<span class="en"><span class="eic">${terrIc(L.terr,16)}</span></span>`;}
  el.classList.toggle('has-c',!!c);
  // v4: aura da família (vem do estado; some sozinha quando a criatura sai)
  if(!B.tut){const fam=c&&!c.dead?CARD[c.id].familia:null,nv=fam?famVisivel(P,fam):0;const ak=nv?fam+nv:'';
    if(el.dataset.fa!==ak){el.dataset.fa=ak;fxAura(P,i,nv?FAMILIAS[fam].cor:null,!!nv);el.classList.toggle('fam2',nv>=2);}}
  // brilho de alvo
  const lb=$('.lbl',el);if(lb)lb.remove();
  const tgt=alvos.has(key);
  el.classList.toggle('tgt',tgt);
  el.classList.toggle('mira',tgt&&P==='r');
  if(tgt&&P==='p'){const inst=selInst();const cc=CARD[inst.id];
    if(cc.tipo==='criatura'){
      // rótulos na faixa de baixo do terreno, nunca por cima da carta
      const parts=[];if(L.c)parts.push('<span class="sw">Trocar</span>');if(cc.terreno!=='neutro'&&cc.terreno===L.terr)parts.push('<span class="aff">+1/+1</span>');
      if(parts.length)el.insertAdjacentHTML('beforeend',`<span class="lbl">${parts.join('·')}</span>`);
    }}
  // rótulo acessível
  el.setAttribute('aria-label',(P==='p'?'Seu terreno ':'Terreno do rival ')+(i+1)+', '+TERR_NOME[L.terr]+': '+(c?CARD[c.id].nome+' '+effAtk(c)+' de ataque e '+c.hp+' de vida'+(c.rest?', descansando':'')+(c.raiz?', Enraizada':''):'vazio')+(L.b?', com '+CARD[L.b.id].nome:'')+(tgt?'. Toque para escolher.':''));
  // tutorial
  if(BU.tut){const ok=tutPermite('lane',key,true);el.classList.toggle('tut-off',!ok);el.classList.toggle('tut-hi',ok&&tgt);}
  else{el.classList.remove('tut-off','tut-hi');}
}
function bRender(){
  if(!B)return;
  const rd=$('#bRound');if(!rd)return;
  const col=horaColheita(B);
  const rr=Math.max(1,B.round);
  const rk=rr+'|'+col;
  if(rd.dataset.k!==rk){rd.dataset.k=rk;rd.innerHTML=`<span class="rt"><span class="rw">Rodada </span><b class="num">${rr}</b>/10${col?'<span class="rcol"> · '+TEMA.meiaNoite.nome+'!</span>':''}</span><span class="rpips" aria-hidden="true">${Array.from({length:10},(_,k)=>`<i class="${k<rr?'on':''}${k+1===(B.rodadaColheita||RODADA_FURIA)?' cf':''}"></i>`).join('')}</span>`;}
  rd.classList.toggle('last',B.round>=10);rd.classList.toggle('colh',col&&B.round<10);
  rd.title=col?TEMA.meiaNoite.nome+': toda criatura ataca com +1 e tem Pisotear.':B.round>=RODADA_COMPRA2?'Você compra 2 cartas por turno.':'';
  heroAtualizar($('#hR'),'r');
  const alvos=alvosSel();
  for(const P of ['r','p'])for(let i=0;i<4;i++)updLane(P,i,alvos);
  // energia
  const S=B.sides.p;let g='';
  const ea=BU.eAnt==null?S.energy:BU.eAnt;
  for(let i=0;i<7;i++){const on=i<Math.min(7,S.energy);g+=`<i class="eg ${on?'on':i<S.maxEnergy?'sp':''}${on&&i>=ea?' nova':''}"></i>`;}
  BU.eAnt=S.energy;
  const ex=S.energy>7?`<span class="ex num">+${S.energy-7}</span>`:'';
  const ek=S.energy+'/'+S.maxEnergy;
  const eP=$('#eP');if(eP.dataset.k!==ek){eP.dataset.k=ek;eP.innerHTML=`<span class="gems">${g}${ex}</span><span class="et">${ic('energia',14)}<span class="num">${S.energy}</span><small class="num">/${S.maxEnergy}</small></span>`;}
  eP.setAttribute('aria-label','Energia '+S.energy+' de '+S.maxEnergy);
  // botão atacar
  const bt=$('#bAtk');const vez=B.turn==='p'&&!B.over;
  const algum=S.lanes.some(L=>podeAtacar(L.c));
  const lbl=!vez?'Vez do rival':algum?'Atacar!':'Passar a vez';
  if(bt.dataset.k!==lbl){bt.dataset.k=lbl;bt.innerHTML=(algum&&vez?`<span class="bi" aria-hidden="true">${ic('espada',18)}</span>`:'')+`<span class="bl">${lbl}</span>`;}
  bt.classList.toggle('pass',vez&&!algum);
  bt.classList.toggle('pronto',vez&&algum&&!BU.busy);
  bt.disabled=!vez||BU.busy;
  if(BU.tut){const ok=BU.tut.atk;bt.classList.toggle('tut-off',!ok);bt.classList.toggle('tut-hi',ok&&vez&&!BU.busy);}else bt.classList.remove('tut-off','tut-hi');
  renderInfo();renderMao();renderSide();
  fxSincronizar();
  palcoSincronizar();
}
function renderInfo(){
  const el=$('#bInfo');const inst=selInst();
  const now=Date.now();
  let hp=$('#hP',el),bd=$('.ibody',el);
  if(!hp||!bd){el.innerHTML='<div class="hero hero-p" id="hP"></div><div class="ibody"></div>';hp=$('#hP',el);bd=$('.ibody',el);}
  heroAtualizar(hp,'p');
  if(inst){
    const c=CARD[inst.id];const b=c.tipo==='criatura'?statsBase(inst.id,inst.lvl):null;
    el.className='info selm';bd.dataset.k='';
    bd.innerHTML=`<div class="sd"><b>${escH(c.nome)}</b> · ${ic('energia',10)}<span class="num">${c.custo}</span>${b?` · ${ic('espada',10)}<span class="num">${b.atk}</span> ${ic('coracao',10)}<span class="num">${b.hp}</span>`:''}<div class="stx">${textoCarta(inst.id,inst.lvl,true)||'Sem habilidade.'}</div></div>
      ${c.tipo==='feitico'&&!c.alvo?`<button class="btn gold small" data-bact="usar">Usar</button>`:`<button class="ibtn" data-bact="big" aria-label="Ver carta grande">i</button>`}<button class="ibtn" data-bact="cancelar" aria-label="Cancelar">✕</button>`;
    return;
  }
  if(B.regra&&BU.regraT>now){
    const G=REGRA[B.regra];el.className='info det regra';bd.dataset.k='';
    bd.innerHTML=`<div class="me rgi">${ic(G.ic,32)}</div><div class="sd"><b>${B.modo==='desafio'?MODO_NOME.desafio:'Regra especial'}: ${escH(G.nome)}</b><div class="stx">${escH(G.txt)}</div></div>`;
    return;
  }
  if(BU.why&&BU.whyT>now){
    el.className='info det';bd.dataset.k='';
    bd.innerHTML=`<div class="me">${artCanvas(BU.why.id,{crop:true})}</div><div class="sd"><b>${escH(CARD[BU.why.id].nome)}</b><div class="why">${escH(BU.why.txt)}</div></div>`;
    hydrate(bd);return;
  }
  if(BU.insp&&BU.inspT>now){
    const L=B.sides[BU.insp.side].lanes[BU.insp.lane];const c=L.c;
    if(c||L.b){
      const parts=[];
      if(c)parts.push(`<b>${escH(CARD[c.id].nome)}${BU.insp.side==='r'?' (rival)':''}</b> · ${ic('espada',10)}<span class="num">${effAtk(c)}</span> ${ic('coracao',10)}<span class="num">${c.hp}/${c.maxHp}</span>${c.rest?' · zZz':''}${c.raiz?' · <b class="rz">Enraizada</b>':''} <span class="stx">${textoCarta(c.id,c.lvl,true)||'Sem habilidade.'}${extrasInst(c,BU.insp.side)}</span>`);
      if(L.b)parts.push(`<b>${escH(CARD[L.b.id].nome)}</b>: ${textoCarta(L.b.id,L.b.lvl,true)}`);
      el.className='info det';bd.dataset.k='';
      bd.innerHTML=`<div class="me">${artCanvas(c?c.id:L.b.id,{crop:true})}</div><div class="sd"><div class="stx">${parts.join('<br>')}</div></div>`;
      hydrate(bd);return;
    }
  }
  el.className='info';
  // o mais novo vem primeiro (e inteiro); o anterior fica embaixo, se couber. Fora do tutorial, o toque abre o Diário.
  const last=B.log.slice(-2).reverse();
  const k='t|'+B.log.length+'|'+last.join('|')+'|'+!!B.tut;
  const txt=last.map((t,j)=>`<span class="${j?'tk2':'tk1'}">${escH(t)}</span>`).join('<br>')||'Sua vez!';
  if(bd.dataset.k!==k){bd.dataset.k=k;bd.innerHTML=B.tut?`<div class="ticker" aria-live="polite">${txt}</div>`:`<button class="ticker" data-bact="diario" aria-label="Abrir o diário da partida" aria-live="polite">${txt}</button>`;}
}
/* o que a criatura ganhou em campo (família, duplas, Cágado...) além do texto da carta */
function extrasInst(c,P){
  const base=CARD[c.id].kw||{},out=[];
  for(const k of KW_ORDEM){const v=c.kw[k]||0,b=base[k]||0;if(v>b)out.push(KW_INFO[k].nome+(KW_NUM[k]?' '+v:''));}
  const f=CARD[c.id].familia,nv=f?famVisivel(P,f):0;
  let t=out.length?' Ganhou: '+out.join(', ')+'.':'';
  if(nv)t+=' Família '+FAMILIAS[f].nome+': '+FAMILIAS[f].txt[nv-1]+'.';
  return escH(t);
}
function renderMao(){
  const el=$('#bHand');const H=B.sides.p.hand;
  const W=el.clientWidth||320;let cw=LARG_MAO[BU.bm||'s'];
  const n=H.length;
  // mão cheia no celular: se a faixa visível de cada carta ficar < 40px, usa a carta menor
  const encolhe=BU.bm==='m'&&n>1&&(W-cw)/(n-1)<40;el.classList.toggle('encolhe',encolhe);if(encolhe)cw=LARG_MAO.s;
  const step=n>1?Math.min(cw+6,(W-cw)/(n-1)):0;
  const total=cw+(n-1)*step;const x0=Math.max(0,(W-total)/2);
  const apertada=n>1&&step<cw*0.62;
  const sobre=n>1&&step<cw-4; // as cartas se cobrem: o nome quebra dentro da faixa que fica à vista
  el.classList.toggle('apertada',apertada);el.classList.toggle('sobre',sobre);el.style.setProperty('--vis',Math.floor(step)+'px');
  const prev=new Map($$('.hc',el).map(b=>[b.dataset.uid,b]));
  const keep=new Set();
  H.forEach((inst,i)=>{
    const why=B.turn==='p'?motivoBloqueio(B,'p',inst):null;
    let b=prev.get(String(inst.uid));
    if(!b){b=document.createElement('button');b.className='hc';b.dataset.uid=inst.uid;b.innerHTML=cardHTML(inst.id,{sz:'hand',lvl:inst.lvl,anim:true});el.appendChild(b);hydrate(b);
      if(!RM&&prev.size)b.animate([{transform:'translateX(60px)',opacity:0},{transform:'none',opacity:1}],{duration:250,easing:'ease-out'});}
    keep.add(String(inst.uid));
    // mão apertada: o nome cabe na faixa à vista (nome curto quando a carta tem um)
    {const ult=i===n-1,cn=$('.cn',b);b.classList.toggle('ult',ult);if(cn){const C=CARD[inst.id],nm=sobre&&!ult&&C.curto&&C.curto!==C.nome?C.curto:C.nome;if(cn.textContent!==nm)cn.textContent=nm;}}
    b.style.left=(x0+i*step)+'px';b.style.zIndex=BU.sel===inst.uid?20:i+1;
    b.classList.toggle('sel',BU.sel===inst.uid);b.classList.toggle('no',!!why);
    b.setAttribute('aria-pressed',BU.sel===inst.uid?'true':'false');
    const c=CARD[inst.id];
    b.setAttribute('aria-label',`${c.nome}, custo ${c.custo}${c.tipo==='criatura'?', '+statsBase(inst.id,inst.lvl).atk+'/'+statsBase(inst.id,inst.lvl).hp:''}${why?'. '+why:''}`);
    if(BU.tut){const ok=tutPermite('hand',inst.id,true);b.classList.toggle('tut-off',!ok);b.classList.toggle('tut-hi',ok&&BU.sel!==inst.uid);}else b.classList.remove('tut-off','tut-hi');
  });
  for(const [k,b] of prev)if(!keep.has(k))b.remove();
  // ordem de foco = ordem da mão; só reordena o DOM quando a ordem mudou (mover um botão tira o foco dele)
  const atual=$$('.hc',el).map(b=>b.dataset.uid).join(',');
  if(atual!==H.map(i=>String(i.uid)).join(',')){
    const f=document.activeElement&&document.activeElement.closest?document.activeElement.closest('#bHand .hc'):null;
    H.forEach(inst=>{const b=el.querySelector(`[data-uid="${inst.uid}"]`);if(b)el.appendChild(b);});
    if(f&&f.isConnected)try{f.focus({preventScroll:true});}catch(e){}
  }
}
/* teclado: começo do turno → primeira carta da mão; depois de escolher → primeiro terreno possível */
function focarMao(){if(!B||BU.tut)return;setTimeout(()=>{if(!B||OVS.length)return;const a=document.activeElement;if(a&&a!==document.body&&a.closest&&!a.closest('#battle'))return;const b=$('#bHand .hc:not(.no)')||$('#bHand .hc')||$('#bAtk');if(b)try{b.focus({preventScroll:true});}catch(e){}},60);}
function focarAlvo(){const ln=$('.lane.tgt');if(ln)try{ln.focus({preventScroll:true});}catch(e){}}
function renderSide(){
  const el=$('#bSide');if(!el||!isDesk())return;
  const R=RIVAIS[B.rival];
  const inst=selInst();let det='<p class="muted">Toque numa carta da mão ou do campo para ver os detalhes aqui.</p>';
  let cid=null,lvl=1,text='',st='';
  if(inst){cid=inst.id;lvl=inst.lvl;}
  else if(BU.insp&&BU.inspT>Date.now()){const L=B.sides[BU.insp.side].lanes[BU.insp.lane];if(L.c){cid=L.c.id;lvl=L.c.lvl;st=` · ${effAtk(L.c)}/${L.c.hp}`;}else if(L.b){cid=L.b.id;lvl=L.b.lvl;}}
  if(cid){const c=CARD[cid];det=`<div class="dbig">${artCanvas(cid,{anim:true})}<div><b>${escH(c.nome)}</b><div class="muted" style="font-size:12px">${TIPO_NOME[c.tipo]} · ${RAR_NOME[c.rar]} · custo ${c.custo}${c.tipo==='criatura'?' · '+statsBase(cid,lvl).atk+'/'+statsBase(cid,lvl).hp:''}${st}</div></div></div><div>${textoCarta(cid,lvl,true)||'Sem habilidade.'}</div>`;}
  const key=(cid||'')+'|'+B.log.length+'|'+B.sides.r.hand.length+'|'+B.sides.p.deck.length;
  if(el.dataset.k===key)return;el.dataset.k=key;
  el.innerHTML=`<section class="panel"><div class="rv">${artCanvas(R.retrato)}<div><b>${escH(R.nome)}</b><div class="muted" style="font-size:12px">${B.tut?'Tutorial':B.modo&&B.modo!=='arena'?escH(descModoTema(B))+' · '+TIER_NOME[B.tier]:'Arena '+B.arena+' · '+TIER_NOME[B.tier]}</div><div class="muted" style="font-size:12px">mão <span class="num">${B.sides.r.hand.length}</span> · deck <span class="num">${B.sides.r.deck.length}</span></div></div></div></section>
   ${B.regra?`<section class="panel srg">${ic(REGRA[B.regra].ic,28)}<div><b>${B.modo==='desafio'?MODO_NOME.desafio:'Regra especial'}: ${escH(REGRA[B.regra].nome)}</b><div class="muted" style="font-size:12px">${escH(REGRA[B.regra].txt)}</div></div></section>`:''}
   <section class="panel det">${det}</section>
   <section class="panel" style="min-height:0;display:flex;flex-direction:column"><h3 style="margin-bottom:6px">Diário</h3><div class="diario" aria-live="polite">${B.log.slice().reverse().map(t=>`<div>${escH(t)}</div>`).join('')}</div>
   <p class="muted" style="font-size:12px;margin-top:6px">Seu deck: <span class="num">${B.sides.p.deck.length}</span> · descarte: <span class="num">${B.sides.p.discard.length}</span></p></section>`;
  hydrate(el);
}

/* ---------- efeitos (o motor de FX fica em 35-fx.js) ---------- */
function laneEl(P,i){return $('#ln-'+P+'-'+i);}
function miniEl(P,i){const l=laneEl(P,i);return l?$('.card',l):null;}
function heroEl(P){return fxHeroiEl(P);}
function centro(el){const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,r};}
function floatNum(el,txt,cls){fxNumero(el,txt,cls==='buff'?'buff':cls==='heal'?'cura':cls==='blk'?'blk':'dano');}
function flashEl(el){fxPisca(el);}
function shakeHero(P){
  if(P!=='p')return;
  const v=$('#bVig')||(()=>{const d=document.createElement('div');d.className='vig';d.id='bVig';document.body.appendChild(d);return d;})();
  v.animate([{opacity:0},{opacity:RM?.5:.9},{opacity:0}],{duration:RM?300:420});
}
function efeitoFeitico(P,i,kind){sfx('magia',kind);fxFeitico(P,i,kind);}
/* a carta de feitiço voa da mão (ou da mostra do rival) até o alvo e estoura em luz */
async function voarFeitico(e,src){
  const sd=e.side||e.P;
  const tgt=e.lane>=0?(miniEl(sd,e.lane)||laneEl(sd,e.lane)):$(e.P==='p'?'#lP':'#lR');
  if(!tgt)return;
  const c=centro(tgt);const cor=TERR_COR[CARD[e.id].terreno]||'#FFFFFF';
  if(src&&!RM){
    const d=document.createElement('div');d.className='voo';d.style.left=src.left+'px';d.style.top=src.top+'px';d.innerHTML=cardHTML(e.id,{sz:'hand'});$('#fx').appendChild(d);hydrate(d);
    const dx=c.x-(src.left+src.width/2),dy=c.y-(src.top+src.height/2);
    d.animate([{transform:'none',opacity:1},{transform:`translate(${dx*0.45}px,${dy*0.45-34}px) rotate(-10deg) scale(.95)`,opacity:1,offset:0.45},{transform:`translate(${dx}px,${dy}px) rotate(8deg) scale(.35)`,opacity:0.3}],{duration:300,easing:'cubic-bezier(.5,0,.8,.6)',fill:'forwards'});
    await sleep(290);d.remove();
  }
  if(!RM&&fxCanvas()){fxEstrela(c.x,c.y,30,fxHex(cor,1),{n:8});fxFaiscas(c.x,c.y,12,['#FFFFFF',cor],{vel:240,g:200});}
}
/* criatura que entra e acerta a da frente (Gato, Garça, Revoada): um tiro rápido saindo dela */
async function tiroDeEntrada(inv,P,lane){
  if(RM||!inv)return;
  const de=$(`.card[data-uid="${inv.uid}"]`,laneEl(inv.P,inv.lane)),para=miniEl(P,lane);
  if(!de||!para||!fxCanvas())return;
  const a=fxRect(de),b=fxRect(para);if(!a||!b)return;
  const id=de.dataset.id,est=fxEstiloDe(id),cor=TERR_COR[CARD[id].terreno]||'#FFFFFF';
  if(est==='garra'||est==='bicada'){fxO({tipo:'rastro',x0:a.x,y0:a.y,x1:b.x,y1:b.y,rgb:fxRgb(cor),w:22,dur:300,kmov:0.5,ease:'in'});await sleep(140);if(est==='garra')fxO({tipo:'garra',x:b.x,y:b.y,ang:Math.atan2(b.y-a.y,b.x-a.x)+0.9,len:Math.min(b.w,80)*0.8,c:fxHex('#FF7A6A',0.9),dur:280});else fxEstrela(b.x,b.y,20,'#FFFFFF',{n:5});}
  else{fxO({tipo:'raio',x0:a.x,y0:a.y,x1:b.x,y1:b.y,rgb:fxRgb(cor),dur:260,amp:8});await sleep(120);}
  sfx('impacto',est);
}
/* liga quem entrou às criaturas que ele fortaleceu (Matriarca, Rei Milhão, Rainha das Rãs) */
function ligar(inv,P,lane){
  if(RM||!inv||!fxCanvas())return;
  const de=$(`.card[data-uid="${inv.uid}"]`,laneEl(inv.P,inv.lane)),para=miniEl(P,lane);
  const a=fxRect(de),b=fxRect(para);if(!a||!b)return;
  const cor=RAR_LUZ[CARD[de.dataset.id].rar]||'#FFD35A';
  fxO({tipo:'corrente',pts:[{x:a.x,y:a.y},{x:b.x,y:b.y}],rgb:fxRgb(cor),dur:650,kin:0.45});
}
/* toca os eventos acumulados no motor e redesenha (a ordem dos eventos é a do motor; só a apresentação muda) */
async function tocarEventos(o){
  o=o||{};
  const evs=B.ev;B.ev=[];
  // família: até o evento tocar, a tela segura o nível antigo (a aura acende junto com o efeito)
  for(const e of evs)if(e.t==='familia'){const k=e.P+e.fam;if(!(k in BU.famPend))BU.famPend[k]=e.antes;}
  bRender();
  // quem vai entrar agora fica escondido até a sua vez de aparecer
  if(!RM)for(const e of evs)if(e.t==='play'&&e.tipo!=='feitico'){const l=laneEl(e.P,e.lane);const el=l?(e.tipo==='construcao'?$('[data-bs]',l):$(`.card[data-uid="${e.uid}"]`,l)):null;if(el)el.classList.add('fx-pre');}
  let espera=0,invoc=null;const feitos=new Set();
  // Combo x3: os "+1 ATK" que vêm logo antes aparecem junto com a faixa do Combo
  for(let k=0;k<evs.length;k++)if(evs[k].t==='sequencia'&&evs[k].efeito==='atk'){for(let j=k-1;j>=0&&evs[j].t==='buff'&&evs[j].P===evs[k].P&&evs[j].a===1&&!evs[j].h&&!evs[j].txt;j--)feitos.add(j);}
  for(let k=0;k<evs.length;k++){
    const e=evs[k];
    if(feitos.has(k))continue;
    switch(e.t){
      case 'play':{
        if(e.tipo==='feitico'){
          await voarFeitico(e,o.src);
          sfx('spell');
          // o efeito do feitiço aparece antes dos números que ele causa
          let algum=false;for(let j=k+1;j<evs.length;j++){if(evs[j].t==='spell'){efeitoFeitico(evs[j].P,evs[j].lane,evs[j].kind);feitos.add(j);algum=true;}}
          if(algum)await sleep(RM?120:380);
        }else{
          const c=CARD[e.id];
          if(e.tipo==='construcao')sfx('build',{id:e.id,P:e.P});else sfx('play',{id:e.id,P:e.P,rar:c&&c.rar,grito:!!(c&&c.fx.some(f=>f.grito))});
          await fxInvocar(e.P,e.lane,e.ficha?'ficha':(c?c.rar:'comum'),{src:e.ficha?null:o.src,uid:e.uid,id:e.id,tipo:e.tipo,ficha:e.ficha});
          if(e.tipo==='criatura'&&!e.ficha)invoc={P:e.P,lane:e.lane,uid:e.uid};
        }
        break;}
      case 'replace':{const l=laneEl(e.P,e.lane);if(l&&!RM&&fxCanvas()){const r=fxRect($('.sl',l)||l);if(r)fxPoeira(r.x,r.b-8,r.w,8);}break;}
      case 'aff':{const el=miniEl(e.P,e.lane);if(el){fxBuff(el,'+1/+1',{cor:TERR_COR[B.sides[e.P].lanes[e.lane].terr]});sfx('buff');}espera=Math.max(espera,RM?200:420);break;}
      case 'buff':{const el=miniEl(e.P,e.lane);
        if(el&&invoc&&e.P===invoc.P&&e.lane!==invoc.lane&&!o.estilo)ligar(invoc,e.P,e.lane);
        if(el)fxBuff(el,e.txt||(!e.h?'+'+e.a+' ATK':'+'+e.a+'/+'+e.h));sfx('buff');espera=Math.max(espera,300);break;}
      case 'debuff':{const el=miniEl(e.P,e.lane);if(el)fxDebuff(el,'-'+e.n+' ATK');sfx('debuff');break;}
      case 'dmg':{const el=miniEl(e.P,e.lane);
        if(!o.estilo&&invoc&&e.P!==invoc.P&&!e.thorn)await tiroDeEntrada(invoc,e.P,e.lane);
        fxImpacto(el,e.n,{thorn:e.thorn,estilo:o.estilo});sfx('hit',{n:e.n,thorn:e.thorn});espera=Math.max(espera,RM?200:300);break;}
      case 'block':{fxBloqueio(miniEl(e.P,e.lane));espera=Math.max(espera,320);break;}
      case 'heal':{const el=e.lane<0?heroEl(e.P):miniEl(e.P,e.lane);fxCura(el,e.n);sfx('heal');break;}
      case 'hero':{fxImpacto(heroEl(e.P),e.n,{heroi:true,estilo:o.estilo});shakeHero(e.P);sfx('heroHit',{P:e.P,n:e.n});espera=Math.max(espera,RM?200:380);break;}
      case 'die':{const el=miniEl(e.P,e.lane),terr=B.sides[e.P].lanes[e.lane].terr;sfx('death');
        if(el){if(RM)fxMorte(el,terr);else setTimeout(()=>fxMorte(el,terr),170);}
        espera=Math.max(espera,RM?150:520);break;}
      case 'spell':if(!feitos.has(k)){efeitoFeitico(e.P,e.lane,e.kind);espera=Math.max(espera,RM?200:500);}break;
      case 'energia':if(e.P==='p'){fxNumero($('#eP'),'+'+e.n,'cura');sfx('energia');}break;
      case 'draw':if(e.P==='p')sfx('compra');break;
      case 'destroy':{fxAfundar(miniEl(e.P,e.lane));sfx('destroi');espera=Math.max(espera,RM?150:420);break;}
      /* ---- v4 ---- */
      case 'regra':mostrarRegraInicio(e);break;
      case 'combo':{
        let sub=e.P==='r'?'Dupla do rival: '+e.txt:e.txt,extra='';
        if(e.P==='p'&&!B.tut){const nova=!s.codex.duplas[e.id];s.codex.duplas[e.id]=(s.codex.duplas[e.id]||0)+1;if(nova){ganharPo(10);sub='Nova dupla descoberta! +10 '+BRAS;extra=`<span class="fb-x">${escH(e.txt)}</span>`;}save();}
        await fxCombo(e.P,e.lanes,e.nome,e.cor,{sub,extraHTML:extra,icHTML:ic('dupla',22),pressa:BU.fila.length>0});
        break;}
      case 'familia':{
        delete BU.famPend[e.P+e.fam];
        for(let i=0;i<4;i++)updLane(e.P,i,alvosSel());
        const F=FAMILIAS[e.fam];
        fxFamilia(e.P,e.lanes,e.cor,e.nivel,e.antes);
        if(e.nivel>e.antes)sfx('familia',{nivel:e.nivel,fam:e.fam});
        if(e.primeira&&e.nivel>0)fxBanner((e.P==='r'?'Rival · ':'')+F.nome+': '+F.txt[e.nivel-1]+'!','familia',{P:e.P,cor:F.cor,icHTML:ic(F.ic,18)});
        espera=Math.max(espera,e.nivel>e.antes?(RM?150:420):0);
        break;}
      case 'sequencia':{
        if(e.efeito==='atk')for(let j=0;j<4;j++){const el=miniEl(e.P,j),L=B.sides[e.P].lanes[j];if(el&&L.c&&!L.c.dead)fxBuff(el,'+1 ATK',{cor:'#FFB23D'});}
        await fxSequencia(e.P,e.n,e.efeito);
        break;}
      case 'grito':{const c=CARD[e.id];fxGrito(e.P,e.lane,RAR_LUZ[c.rar]||'#FFE58A');sfx('grito',{id:e.id,P:e.P});await sleep(RM?100:300);break;}
      case 'ninhada':await fxNinhada(e.P,e.de,e.para,e.ficha);break;
      case 'acorda':{fxAcorda(e.P,e.lanes);sfx('acorda');espera=Math.max(espera,RM?150:420);break;}
      case 'raiz':{fxRaiz(e.P,e.lane,e.on);espera=Math.max(espera,e.on?(RM?150:560):(RM?100:320));break;}
      case 'guarda':{const el=miniEl(e.P,e.para);if(el)fxNumero(el,'Guarda!','buff',{dy:-26});break;} // o pulo foi feito em combateAnim
      case 'reduz':{const el=miniEl(e.P,e.lane);if(el)fxReduz(el,e.n,e.fonte);break;}
      case 'festa':{fxFesta(e.P,e.de,e.para);await sleep(RM?80:320);break;}
      case 'lua':{fxLua(e.P,e.lane);espera=Math.max(espera,RM?200:760);break;}
    }
  }
  // toques esperando na fila: a espera final encurta (o brilho e as partículas continuam sem travar)
  if(espera)await sleep(BU.fila.length?Math.round(espera*0.5):espera);
}
/* começo de partida com regra (Desafio, ou Treino com "Regra especial"): a carta da regra, depois o "Sua vez!" */
async function mostrarRegraInicio(e){
  const meu=B;sfx('regra');
  await fxBanner(B.modo==='desafio'?MODO_NOME.desafio:'Regra especial','regra',{sub:'Você começa!',extraHTML:regraCardHTML(e.id)});
  if(B===meu&&B&&!B.over&&B.turn==='p'&&B.round<=1&&!document.querySelector('.fxban'))fxBanner('Sua vez!','turno');
}
async function varrerAnim(){
  let guard=0;
  while(guard++<6){
    const temMorto=['p','r'].some(P=>B.sides[P].lanes.some(L=>L.c&&L.c.dead));
    if(!temMorto)break;
    await sleep(RM?150:BU.fila.length?120:200);
    varrer(B);
    await tocarEventos();
  }
  bRender();
}
async function combateAnim(P){
  for(let i=0;i<4;i++){
    const c=B.sides[P].lanes[i].c;if(!c||!podeAtacar(c))continue;
    const vezes=c.kw.ataqueDuplo?2:1;
    for(let k=0;k<vezes;k++){
      if(B.sides[P].lanes[i].c!==c||c.dead||!podeAtacar(c))break;
      const t0=performance.now();
      // só leitura: para onde o golpe vai (o motor decide igualzinho dentro de ataque(); alvoReal é pura)
      const ar=alvoReal(B,P,i,c);
      // Lua Cheia: quem chegou neste turno não ataca o herói (o motor só avisa com o evento "lua")
      if(c.lua&&ar.tipo==='heroi'){ataque(B,P,i);await tocarEventos();break;}
      const alvo=ar.tipo==='heroi'?'heroi':{side:opp(P),lane:ar.lane};
      const estilo=fxEstiloDe(c.id);
      // v7: duelo = os dois do mesmo terreno se atacando, um de cada vez, turno após turno
      let duelo=0;
      if(ar.tipo!=='heroi'&&ar.lane===i&&!ar.guarda){const d=B.sides[opp(P)].lanes[i].c;
        if(d){const r=BU.duelo&&BU.duelo[i];duelo=r&&r.a===d.uid&&r.d===c.uid?r.n+1:1;if(BU.duelo)BU.duelo[i]={a:c.uid,d:d.uid,n:duelo};}}
      // Guarda: a vizinha pula na frente do terreno vazio antes do golpe chegar
      const volta=ar.guarda?await fxGuardaPula(opp(P),i,ar.lane):null;
      if(RM)sfx('ataque');
      await fxAtaque(P,i,alvo,estilo,{forte:effAtk(c)>=3,duelo});
      const ok=ataque(B,P,i);
      await tocarEventos({estilo});
      if(volta)await volta();
      const dt=performance.now()-t0;const alvoMs=vel(RM?450:640);
      if(dt<alvoMs)await sleep(alvoMs-dt);
      // o atacante volta para o lugar dele antes do próximo sair correndo
      const falta=(FX.atkAte||0)-performance.now();if(falta>0)await sleep(Math.min(700,falta));
      await varrerAnim();
      if(fimDeJogo(B))return;
      if(!ok)break;
    }
  }
}
function banner(txt,ms){return fxBanner(txt,'turno',{ms});}
const ART_RIVAL={pipoca:'do',tonico:'do',ameixa:'da',lodoso:'do',lanuda:'da',trovoada:'da',zeca:'do',cocada:'da',sanfona:'do'};
function vezDoRival(){const R=RIVAIS[B.rival];return 'Vez '+(ART_RIVAL[B.rival]||'de')+' '+R.curto;}
/* v11: o rival joga a carta de um jeito que dá para ver: um verso sai do painel dele, voa até o meio do campo do lado
   dele virando de frente, fica um instante maior com o brilho da raridade e "Fulano jogou", e só então voa para o lugar
   (a volta para o lugar é o fxVooCarta de sempre, que parte de onde a carta ficou). */
async function mostrarCartaRival(inst){
  // espera a faixa "Vez do rival" sair (senão a carta aparece por cima dela)
  for(let k=0;k<20&&!RM&&document.querySelector('.fxban.fb-rival');k++)await sleep(80);
  if(!B)return null;
  const fx=$('#fx'),hR=$('#hR'),cp=$('#bCampo'),lr=$('#lR');if(!fx||!hR)return null;
  const R=(typeof RIVAIS!=='undefined'&&RIVAIS[B.rival])||{},quem=R.curto||R.nome||'Rival';
  const larg=LARG_MAO[BU.bm||'s']||76,esc=Math.min(1.7,Math.max(1.15,118/larg));
  const d=document.createElement('div');d.className='rvjoga bm-'+(BU.bm||'s');
  d.innerHTML=`<div class="rvgiro"><div class="rvfrente hand" style="height:auto;margin:0">${cardHTML(inst.id,{sz:'hand',lvl:inst.lvl})}</div><div class="rvverso" aria-hidden="true"><i></i></div></div><div class="rvnome">${escH(quem)} jogou</div>`;
  d.style.setProperty('--rl',RAR_LUZ[CARD[inst.id].rar]||'#FFFFFF');
  fx.appendChild(d);hydrate(d);
  const g=$('.rvgiro',d),w=g.offsetWidth||larg,h=g.offsetHeight||Math.round(larg*1.4);
  // onde a carta para: no meio do campo, logo abaixo da fila do rival (ou abaixo do painel, se não houver campo)
  const hr=hR.getBoundingClientRect(),c=cp?cp.getBoundingClientRect():hr,l=lr?lr.getBoundingClientRect():null;
  const cx=c.left+c.width/2,topo=Math.max(hr.bottom+8,(l&&l.height?l.bottom-h*esc*0.35:hr.bottom+8));
  const cy=Math.min(window.innerHeight-h*esc/2-8,topo+h*esc/2);
  d.style.left=Math.round(cx-w/2)+'px';d.style.top=Math.round(cy-h/2)+'px';
  const ox=(hr.left+hr.width/2)-cx,oy=(hr.top+hr.height/2)-cy;
  if(RM||!g.animate){g.style.transform=`scale(${esc})`;await sleep(vel(700));const r=g.getBoundingClientRect();d.remove();return r;}
  try{sfx('flip');}catch(e){}
  const voo=g.animate([{transform:`translate(${ox}px,${oy}px) scale(.3) rotateY(180deg) rotateZ(-14deg)`,opacity:0},{transform:`translate(${ox*0.4}px,${oy*0.4-20}px) scale(${esc*0.75}) rotateY(150deg) rotateZ(-6deg)`,opacity:1,offset:0.35},
    {transform:`translate(0,-8px) scale(${esc*1.08}) rotateY(20deg)`,offset:0.8},{transform:`scale(${esc}) rotateY(0deg)`}],{duration:vel(520),easing:'cubic-bezier(.3,.7,.4,1)',fill:'forwards'});
  d.animate([{opacity:0},{opacity:1}],{duration:200,fill:'forwards'});
  await new Promise(r=>{voo.onfinish=r;setTimeout(r,vel(520)+200);});
  d.classList.add('mostra');
  try{const sp=c&&c.width?{x:cx,y:cy}:null;if(sp&&typeof fxAnel==='function')fxAnel(sp.x,sp.y,10,w*esc*0.9,fxHex(RAR_LUZ[CARD[inst.id].rar]||'#FFFFFF',0.8),420,{ry:0.9,w:5,add:true});}catch(e){}
  await sleep(vel(CARD[inst.id].rar==='lendaria'||CARD[inst.id].rar==='epica'?950:780));
  const r=g.getBoundingClientRect();d.remove();
  return r;
}

/* ---------- jogadas do jogador ---------- */
async function jogarDoJogador(uid,lane){
  const inst=B.sides.p.hand.find(h=>h.uid===uid);if(!inst)return;
  const hc=$(`#bHand .hc[data-uid="${uid}"]`);const src=hc?hc.getBoundingClientRect():null;
  BU.busy=true;BU.jogando=true;BU.sel=null;
  const c=CARD[inst.id];
  const ok=jogarCarta(B,'p',uid,c.tipo==='feitico'&&!c.alvo?-1:lane);
  if(!ok){BU.busy=false;BU.jogando=false;BU.fila=[];bRender();return;}
  await tocarEventos({src});
  await varrerAnim();
  BU.jogando=false;
  if(fimDeJogo(B)){BU.fila=[];terminar();return;}
  BU.busy=false;bRender();
  tutSinal('play',inst.id);
  if(BU.fila.length)setTimeout(drenarFila,0);
}
/* toques feitos enquanto a carta anterior ainda entrava: guardados e feitos em ordem logo depois */
function naFila(fn){
  if(!B||!BU.busy||!BU.jogando||B.turn!=='p'||B.over)return false;
  if(BU.fila.length<6)BU.fila.push(fn);
  return true;
}
function drenarFila(){
  while(BU.fila.length&&B&&!BU.busy&&!B.over){const fn=BU.fila.shift();fn();}
  if(!B||B.over||B.turn!=='p')BU.fila=[];
}
async function aoAtacar(){
  if(naFila(aoAtacar))return;
  if(!B||BU.busy||B.turn!=='p'||B.over)return;
  BU.fila=[];
  if(BU.tut&&!BU.tut.atk){vovoShake();return;}
  BU.busy=true;BU.sel=null;bRender();
  sfx('tap');
  await combateAnim('p');
  if(B.over){terminar();return;}
  fimTurno(B,'p');bRender();
  if(B.tut){tutSinal('atacar');return;}
  await turnoRival();
}
async function turnoRival(){
  const R=RIVAIS[B.rival];
  sfx('turnoRival');fxBanner(vezDoRival(),'rival');
  iniciarTurno(B,'r');await tocarEventos();await varrerAnim();
  if(fimDeJogo(B)){terminar();return;}
  const th=$('#bThink');th.textContent=R.curto+' está pensando…';th.classList.add('on');
  await sleep(vel(600));
  B.jogadasAI=0;
  for(let guard=0;guard<12;guard++){
    if(!B||B.over)return;
    const o=escolhaIA(B,'r',B.tier,B.jogadasAI);if(!o)break;
    const src=await mostrarCartaRival(o.inst);
    if(!B)return;
    jogarCarta(B,'r',o.inst.uid,o.lane);B.jogadasAI++;
    await tocarEventos({src});await varrerAnim();
    if(fimDeJogo(B)){th.classList.remove('on');terminar();return;}
    await sleep(vel(600));
  }
  th.classList.remove('on');
  await combateAnim('r');
  if(B.over){terminar();return;}
  fimTurno(B,'r');
  if(B.round>=10){fimPorRodadas(B);terminar();return;}
  sfx('seuTurno');
  iniciarTurno(B,'p');await tocarEventos();await varrerAnim();
  if(fimDeJogo(B)){terminar();return;}
  if(B.round===10){fxBanner('Última rodada!','ultima');sfx('banner','ultima');musIntensa(2);}
  else if(B.round===(B.rodadaColheita||RODADA_FURIA)){fxBanner(TEMA.meiaNoite.banner,'colheita',{sub:TEMA.meiaNoite.sub});sfx('banner','colheita');musIntensa(1);}
  else if(B.round===RODADA_COMPRA2){fxBanner('Sua vez!','turno',{sub:'Agora: 2 cartas por turno!',ms:2200});sfx('banner','compra2');}
  else fxBanner('Sua vez!','turno');
  BU.busy=false;bRender();
  focarMao();
}

/* ---------- entrada (toques) ---------- */
function aoTocarMao(uid){
  if(naFila(()=>aoTocarMao(uid)))return;
  if(!B||BU.busy||B.turn!=='p'||B.over)return;
  const inst=B.sides.p.hand.find(h=>h.uid===uid);if(!inst)return;
  if(BU.sel===uid){BU.sel=null;sfx('solta');bRender();tutSinal('deselect');return;}
  if(BU.tut&&!tutPermite('hand',inst.id)){vovoShake();return;}
  const why=motivoBloqueio(B,'p',inst);
  if(why){sfx('erro');BU.sel=null;BU.why={id:inst.id,txt:why};BU.whyT=Date.now()+2500;bRender();setTimeout(()=>{if(B&&!BU.sel)bRender();},2600);return;}
  BU.sel=uid;BU.insp=null;sfx('pega');bRender();
  if(BU.kb)focarAlvo();
  tutSinal('select',inst.id);
}
function aoTocarLane(P,i){
  if(!B||B.over)return;
  if(BU.fila.length&&naFila(()=>aoTocarLane(P,i)))return;
  if(BU.sel){
    if(BU.busy)return;
    const k=P+i;
    if(!alvosSel().has(k)){if(BU.tut)vovoShake();return;}
    if(BU.tut&&!tutPermite('lane',k)){vovoShake();return;}
    jogarDoJogador(BU.sel,i);
    return;
  }
  if(BU.tut&&!tutPermite('lane',P+i)){vovoShake();return;}
  const L=B.sides[P].lanes[i];
  if(L.c||L.b){BU.insp={side:P,lane:i};BU.inspT=Date.now()+4000;bRender();setTimeout(()=>{if(B)bRender();},4100);}
}
function verGrande(id,lvl,inst,P){
  const c=CARD[id];
  const kws=KW_ORDEM.filter(k=>(inst?inst.kw:c.kw)[k]);
  const ext=[];
  if(inst&&inst.raiz)ext.push(`<div>${ic('raiz',16)}<span><b>Enraizada:</b> não ataca no próximo combate do dono.</span></div>`);
  const fam=c.familia,fn=inst&&fam&&B?famVisivel(P||'p',fam):0;
  if(fam)ext.push(`<div>${ic(FAMILIAS[fam].ic,16)}<span><b>Família ${escH(FAMILIAS[fam].nome)}:</b> com 2: ${escH(FAMILIAS[fam].txt[0])} · com 3+: ${escH(FAMILIAS[fam].txt[1])}${fn?` <b class="okmsg">(valendo: ${escH(FAMILIAS[fam].txt[fn-1])})</b>`:''}</span></div>`);
  abrirFolha(`<div class="detail">${cardHTML(id,{sz:'big',lvl,inst,anim:true})}${kws.length||ext.length?`<div class="kwlist" style="width:100%">${kws.map(k=>`<div>${ic(k,16)}<span><b>${KW_INFO[k].nome}${KW_NUM[k]?' '+(inst?inst.kw:c.kw)[k]:''}:</b> ${escH(KW_INFO[k].tip)}</span></div>`).join('')}${ext.join('')}</div>`:''}
   ${c.n?`<div class="nrow" style="width:100%"><b>${escH(c.nLabel||'Valor')} por nível:</b>${c.n.map((v,i)=>`<span class="${i===lvl-1?'cur':''}">${v}</span>`).join('')}</div>`:''}</div>`,{titulo:c.nome+(P==='r'?' (rival)':'')});
}
function abrirAjuda(){
  const rc=B&&B.rodadaColheita||RODADA_FURIA;
  const reg=['Cada criatura ataca o que estiver na frente dela. Terreno vazio na frente? O ataque vai direto no herói rival.','Quem apanha não revida. O dano fica até a criatura ser curada.','Criatura nova descansa (zZz) no turno em que chega, a não ser que tenha Fúria.','Carta no terreno da mesma cor ganha +1/+1.','Energia: 2 na rodada 1, +1 por rodada, até 7.','Da rodada 4 em diante, cada lado compra 2 cartas por turno.','Rodada '+rc+' em diante é a '+TEMA.meiaNoite.nome+': toda criatura ataca com +1 e tem Pisotear.','Ao tocar em Atacar!, todas as suas criaturas acordadas atacam, do terreno 1 ao 4.','Vence quem zerar o herói rival. Depois da rodada 10, vence quem tiver mais vida.'];
  const r=ROTULO_INFO;
  const v4=[['familia',r.familia],['dupla',r.dupla],['combo',r.combo],['ninhada',r.ninhada],['grito',r.grito],['raiz',r.raiz]];
  const regra=B&&B.regra?REGRA[B.regra]:null;
  abrirFolha(`${regra?`<div class="helpregra">${regraCardHTML(regra.id)}</div>`:''}<ol class="helplist">${reg.map(t=>`<li>${escH(t)}</li>`).join('')}</ol>
   <div class="kwlist">${KW_ORDEM.map(k=>`<div>${ic(k,16)}<span><b>${KW_INFO[k].nome}${KW_NUM[k]?' X':''}:</b> ${escH(KW_INFO[k].tip)}</span></div>`).join('')}
   ${v4.map(([k,R])=>`<div>${ic(k,16)}<span><b>${escH(R.nome.replace(/:$/,''))}:</b> ${escH(R.tip.replace(/^[^:]+: /,''))}</span></div>`).join('')}
   <div>${ic('habilidade',16)}<span><b>Habilidade:</b> a carta tem um efeito escrito. Toque nela para ler.</span></div></div>`,{titulo:'Como jogar'});
}
function abrirDiario(){
  if(!B)return;
  const L=B.log.slice(-40).reverse();
  abrirFolha(`<ol class="diariolist">${L.map(t=>`<li>${escH(t)}</li>`).join('')||'<li>Nada aconteceu ainda.</li>'}</ol>`,{titulo:'Diário da partida',cls:'diariosh'});
}
async function desistir(){
  if(!B||B.over)return;
  const m=B.modo||'arena';
  const txt=m==='treino'?['Sair do treino? Treino não vale troféus nem '+MOE+', então você não perde nada.','Sair','Sair do treino?']
    :m==='desafio'?['Desistir conta como derrota no '+MODO_NOME.desafio+'. Você pode tentar de novo depois. Sair mesmo?','Desistir','Desistir?']
    :m==='torneio'?['Desistir conta como derrota e encerra a peleja. Sair mesmo?','Desistir','Desistir da peleja?']
    :['Desistir conta como derrota e não dá '+MOE+'. Sair mesmo?','Desistir','Desistir?'];
  const ok=await perguntar(txt[0],txt[1],{perigo:m!=='treino',titulo:txt[2]});
  if(!ok||!B||B.over)return;
  B.desistiu=true;B.over=true;B.result='derrota';BU.busy=true;terminar();
}
function mostrarRegraInfo(){if(!B||!B.regra)return;sfx('tap');BU.regraT=Date.now()+4000;bRender();setTimeout(()=>{if(B)bRender();},4100);}
document.addEventListener('click',e=>{
  if(!inBattle||!B)return;
  if(BU.lpFired){BU.lpFired=false;e.preventDefault();return;}
  const bt=e.target.closest('[data-bact]');
  if(bt&&!bt.disabled){
    const a=bt.dataset.bact;
    if(a==='atacar')aoAtacar();
    else if(a==='cancelar'){BU.sel=null;sfx('solta');bRender();tutSinal('deselect');}
    else if(a==='usar'){if(BU.sel&&alvosSel().size){if(BU.tut&&!tutPermite('lane','p0')){vovoShake();return;}jogarDoJogador(BU.sel,-1);}}
    else if(a==='big'){const inst=selInst();if(inst)verGrande(inst.id,inst.lvl);}
    else if(a==='ajuda')abrirAjuda();
    else if(a==='desistir')desistir();
    else if(a==='regra')mostrarRegraInfo();
    else if(a==='diario')abrirDiario();
    else if(a==='pular')pularTutorial();
    return;
  }
  const hp=e.target.closest('#hP');if(hp&&!B.tut&&typeof emoteRoda==='function'){emoteRoda(hp);return;}
  const hc=e.target.closest('#bHand .hc');if(hc){aoTocarMao(+hc.dataset.uid);return;}
  const ln=e.target.closest('.lane');if(ln){aoTocarLane(ln.dataset.side,+ln.dataset.lane);return;}
});
document.addEventListener('pointerdown',e=>{
  if(!inBattle||!B)return;
  const hc=e.target.closest('#bHand .hc'),ln=e.target.closest('.lane');
  if(!hc&&!(ln&&$('.card',ln)))return;
  clearTimeout(BU.lp);BU.lpFired=false;
  const x0=e.clientX,y0=e.clientY;
  BU.lpXY=[x0,y0];
  BU.lp=setTimeout(()=>{
    BU.lpFired=true;
    if(hc){const inst=B.sides.p.hand.find(h=>h.uid===+hc.dataset.uid);if(inst)verGrande(inst.id,inst.lvl);}
    else{const L=B.sides[ln.dataset.side].lanes[+ln.dataset.lane];if(L.c)verGrande(L.c.id,L.c.lvl,L.c,ln.dataset.side);}
  },450);
});
['pointerup','pointercancel'].forEach(t=>document.addEventListener(t,()=>clearTimeout(BU.lp)));
document.addEventListener('pointermove',e=>{if(BU.lpXY&&(Math.abs(e.clientX-BU.lpXY[0])>10||Math.abs(e.clientY-BU.lpXY[1])>10))clearTimeout(BU.lp);});
document.addEventListener('keydown',e=>{
  if(!inBattle||!B||OVS.length)return;
  if(e.key==='i'||e.key==='I'){
    const f=document.activeElement;
    const hc=f&&f.closest&&f.closest('#bHand .hc'),ln=f&&f.closest&&f.closest('.lane');
    if(hc){const inst=B.sides.p.hand.find(h=>h.uid===+hc.dataset.uid);if(inst)verGrande(inst.id,inst.lvl);}
    else if(ln){const L=B.sides[ln.dataset.side].lanes[+ln.dataset.lane];if(L.c)verGrande(L.c.id,L.c.lvl,L.c,ln.dataset.side);}
  }
  if(e.key==='Escape'&&BU.sel){const u=BU.sel;BU.sel=null;bRender();const b=$(`#bHand .hc[data-uid="${u}"]`);if(b)try{b.focus({preventScroll:true});}catch(e2){}}
});
document.addEventListener('keydown',e=>{if(e.key==='Tab'||e.key==='Enter'||e.key===' ')BU.kb=true;},true);
document.addEventListener('pointerdown',()=>{BU.kb=false;},true);
window.addEventListener('resize',()=>{if(inBattle&&B){aplicarModo();bRender();}});

/* ---------- fim de partida ---------- */
async function terminar(){
  if(!B||B.fechando)return;
  B.fechando=true;BU.busy=true;BU.sel=null;
  $('#bThink')&&$('#bThink').classList.remove('on');
  bRender();
  if(!B.desistiu&&B.result==='vitoria'&&!(B.tut&&!BU.tutTok)){fxVitoria();fxBanner('Vitória!','vitoria');await sleep(vel(1300));}
  else await sleep(B.desistiu?0:vel(600));
  if(B.tut){terminarTutorial();return;}
  // as contas de cada modo (Arena: as mesmas de sempre) ficam em fecharPartida (55-modos)
  const misAntes=s.missoes?s.missoes.lista.map(x=>x.id+':'+x.prog):null;
  const out=fecharPartida(B);out.misAntes=misAntes;
  typeof guardarDiario==='function'&&guardarDiario(B);
  musica(null);
  sfx(out.res==='vitoria'?'victory':out.res==='derrota'?'defeat':'empate');
  mostrarResultado(out);
}
function tituloRes(res){return res==='vitoria'?'<h1 class="vit">VITÓRIA!</h1>':res==='derrota'?'<h1 class="der">DERROTA</h1>':'<h1 class="emp">EMPATE</h1>';}
/* Arena: todas as missões do dia. Treino, Desafio e Torneio: só as que andaram nesta partida */
function missoesRes(o){if(!s.missoes)return '';const L=s.missoes.lista.filter(x=>!o||!o.modo||o.modo==='arena'||!o.misAntes||!o.misAntes.includes(x.id+':'+x.prog));
  return L.length&&o&&o.modo&&o.modo!=='arena'?'<div class="rmis-t">Missões que andaram:</div>'+missoesLista(L):missoesLista(L);}
function missoesLista(L){return L.map(x=>`<div>${escH(MISSAO[x.id].txt)}: <b class="num">${fmt(x.prog)}/${fmt(x.alvo)}</b>${x.prog>=x.alvo&&!x.pego?' · <span class="okmsg">pronta!</span>':''}</div>`).join('');}
/* duplas e Combos da partida (só aparece se teve alguma) */
function v4Res(){
  if(!B||!B.stats)return '';const d=B.duplasLog||[],n=B.stats.combos||0;if(!d.length&&!n)return '';
  return `<div class="rv4">${d.map(id=>`<span class="rchip" style="--dc:${DUPLA[id].cor}">${ic('dupla',12)}${escH(DUPLA[id].nome)}</span>`).join('')}${n?`<span class="rchip" style="--dc:#FFB23D">${ic('combo',12)}Combo x3${n>1?' ×'+n:''}</span>`:''}</div>`;
}
function premioHTML(P){
  const it=[];
  if(P.pacotes)for(const k in P.pacotes)for(let i=0;i<P.pacotes[k];i++)it.push(`<span class="pz">${packImg(k,40)}<small>${escH(PACKS[k].nome)}</small></span>`);
  if(P.po)it.push(`<span class="pz">${ic('po',28)}<small><b class="num">+${fmt(P.po)}</b> ${BRAS}</small></span>`);
  if(P.faixa)it.push(`<span class="pz">${ic('torneio',30)}<small>${escH(TEMA.lugares.faixa)}</small></span>`);
  return `<div class="premio">${it.join('')}</div>`;
}
function mostrarResultado(o){
  const R=RIVAIS[B.rival],modo=o.modo||'arena';
  const el=document.createElement('div');el.className='result res-'+modo;el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Resultado');
  const dT=o.depoisTr-o.antesTr;
  const mis=missoesRes(o);
  let corpo='',botoes=`<button class="btn gold big" data-cont>Continuar</button>`,festa=false;
  if(modo==='arena'){
    corpo=`${tituloRes(o.res)}
    <div class="rp">${artCanvas(R.retrato)}</div>
    <div class="muted">${o.desistiu?'Você desistiu.':o.porTempo?'Fim das 10 rodadas: venceu quem tinha mais vida.':'contra '+escH(R.nome)}</div>
    <div class="rl">${ic('trofeu',20)} <span class="num" id="rTr">${fmt(o.antesTr)}</span> ${dT?`<span class="num ${dT>0?'up':'down'}">${dT>0?'+':''}${dT}</span>`:''}</div>
    ${o.res==='derrota'&&arenaMax()===1&&!o.desistiu?'<div class="muted" style="font-size:12px">Na Arena 1 você não perde troféus.</div>':''}
    <div class="rl">${ic('coin',20)} <span class="num">+${fmt(o.pay.g)}</span> ${MOEC}</div>
    ${o.pay.cap?'<div class="capmsg">Limite diário de '+MOE+' por partidas atingido: tesouros e missões continuam valendo.</div>':''}
    ${o.res==='vitoria'?(o.bau?`<div class="rl" id="rBau">${chestImg(o.bau.tipo,48)} ${escH(BAUS[o.bau.tipo].nome)}!</div>`:'<div class="warn">Tesouros cheios! Abra um para ganhar mais.</div>'):''}
    ${v4Res()}`;
  }else if(modo==='treino'){
    corpo=`<div class="rmodo">${ic('treino',16)} Treino</div>${tituloRes(o.res)}
    <div class="rp">${artCanvas(R.retrato)}</div>
    <div class="muted">${o.desistiu?'Você saiu do treino.':o.porTempo?'Fim das 10 rodadas: venceu quem tinha mais vida.':'contra '+escH(R.nome)+' · '+TIER_NOME[B.tier]}</div>
    <div class="rnote">Treino: não vale troféus nem ${MOE}.</div>${v4Res()}`;
    botoes=`<button class="btn gold big" data-again>Jogar de novo</button><button class="btn md" data-cont>Voltar</button>`;
  }else if(modo==='desafio'){
    const G=REGRA[B.regra];
    if(o.premio){festa=true;corpo=`<div class="rmodo">${ic('desafio',16)} ${MODO_NOME.desafio}</div><h1 class="vit">Desafio vencido!</h1>${G?regraCardHTML(G.id,{cls:'mini'}):''}${premioHTML(o.premio)}<div class="muted" style="font-size:12px">O pacote foi para a Loja e as ${BRAS} já estão com você.</div>`;}
    else{corpo=`<div class="rmodo">${ic('desafio',16)} ${MODO_NOME.desafio}</div>${tituloRes(o.res)}${G?regraCardHTML(G.id,{cls:'mini'}):''}
      <div class="rnote">${o.res==='vitoria'?'Prêmio de hoje já pego ✓':'Tente de novo!'}</div>`;}
    corpo+=v4Res();
    botoes=o.res!=='vitoria'?`<button class="btn gold big" data-again>Tentar de novo</button><button class="btn md" data-cont>Voltar</button>`:`<button class="btn gold big" data-cont>Voltar</button>`;
  }else if(modo==='torneio'){
    const T=o.torneio||{};
    if(T.fim&&T.premio&&T.premio.campeao){festa=true;
      corpo=`<div class="rmodo">${ic('torneio',16)} ${MODO_NOME.torneio}</div><h1 class="vit campeao">CAMPEÃ<span class="nun">(O)</span> DA PELEJA!</h1><div class="rp faixa">${artCanvas(retratoId('voce'))}</div><div class="muted">Você venceu as 3 partidas!</div>${premioHTML(T.premio)}`;
      botoes=`<button class="btn gold big" data-cont>Oba!</button>`;
    }else if(T.fim){
      const v=T.premio?T.premio.vitorias:0;
      corpo=`<div class="rmodo">${ic('torneio',16)} ${MODO_NOME.torneio}</div>${tituloRes(o.res)}<div class="rp">${artCanvas(R.retrato)}</div><div class="rnote">Fim da peleja: ${v} ${v===1?'vitória':'vitórias'}</div>${T.premio?premioHTML(T.premio):''}`;
    }else if(T.prox){
      const P=T.prox,RP=RIVAIS[P.rival];
      corpo=`<div class="rmodo">${ic('torneio',16)} ${MODO_NOME.torneio}</div><h1 class="vit">Você venceu a ${escH(nomeEtapaTxt(T.nome))}!</h1><div class="rp">${artCanvas(R.retrato)}</div>
       <div class="rprox"><span class="rpt">${artCanvas(RP.retrato,{crop:true})}</span><span>Próxima: <b>${escH(TEMA.etapas[P.etapa]||(P.etapa===TORNEIO.etapas.length-1?'Final':P.nome))}</b> contra <b>${escH(RP.nome)}</b> (${TIER_NOME[P.tier]}) · você começa com <b class="num">${P.hp}</b> de vida</span></div>`;
      botoes=`<button class="btn gold big" data-cont>Continuar</button>`;
    }else corpo=tituloRes(o.res);
    corpo+=v4Res();
  }
  el.innerHTML=`<div class="panel rbox">${corpo}${mis?`<div class="rmis">${mis}</div>`:''}<div class="racts">${botoes}${typeof revancheHTML==='function'?revancheHTML(o):''}</div></div>`;
  document.body.appendChild(el);hydrateGfx(el);
  const b=$('[data-again]',el)||$('[data-cont]',el);setTimeout(()=>{try{b.focus();}catch(e){}},60);
  // troféus contando (Arena)
  const tr=$('#rTr',el);
  if(tr){const t0=performance.now(),dur=RM?0:800;const tick=()=>{const k=dur?clamp((performance.now()-t0)/dur,0,1):1;tr.textContent=fmt(Math.round(o.antesTr+(o.depoisTr-o.antesTr)*k));if(k<1)requestAnimationFrame(tick);};tick();}
  if(dT)setTimeout(()=>sfx('trofeu',dT>0),RM?100:400);
  if(o.bau)setTimeout(()=>sfx('bauGanho'),RM?300:900);
  if(o.bau&&!RM){const bb=$('#rBau',el);bb.animate([{transform:'scale(.3) translateY(40px)',opacity:0},{transform:'scale(1.15)',opacity:1,offset:.7},{transform:'none'}],{duration:600,delay:500,fill:'backwards',easing:'ease-out'});}
  // prêmio (Desafio, Torneio): cada item pula pra dentro
  $$('.premio .pz',el).forEach((z,i)=>{if(!RM)z.animate([{transform:'scale(.2) translateY(30px)',opacity:0},{transform:'scale(1.2)',opacity:1,offset:.7},{transform:'none'}],{duration:520,delay:450+i*160,fill:'backwards',easing:'ease-out'});setTimeout(()=>sfx(i?'coin':'bauGanho'),RM?100:500+i*160);});
  if(festa){setTimeout(()=>sfx('campeao'),RM?50:300);if(!RM)confete(el);}
  const sair=async(depois)=>{el.remove();fecharBatalha();UI.tab='inicio';refresh();
    if(o.novaArena)await mostrarArenaNova(o.novaArena);refresh();
    if(depois)return depois();
    // o foco não se perde: volta para o BATALHAR
    setTimeout(()=>{if(OVS.length||inBattle)return;const bt=$('[data-act="batalhar"]');if(bt&&!bt.disabled)try{bt.focus({preventScroll:true});}catch(e){}},80);};
  $('[data-cont]',el).onclick=()=>sair(
    modo==='torneio'&&o.torneio&&!o.torneio.fim?()=>abrirTorneio():
    modo==='torneio'&&o.torneio&&o.torneio.fim&&o.torneio.premio?()=>voarPremio(o.torneio.premio):
    modo==='desafio'&&o.premio?()=>voarPremio(o.premio):null);
  const ag=$('[data-again]',el);
  if(ag)ag.onclick=()=>{const q=modo==='desafio'?jogarDesafio():jogarTreino();el.remove();fecharBatalha();UI.tab='inicio';refresh();if(q&&deckOk())iniciarPartida(q);};
}
/* confete em pixel na tela de campeão / desafio vencido */
function confete(root){
  const fx=$('#fx');if(!fx)return;const W=window.innerWidth;
  for(let i=0;i<46;i++){const p=document.createElement('i');p.className='pxp conf';p.style.background=['#C4362F','#F2C230','#4A7FC1','#5DBB63','#F49AC1','#FFFFFF'][i%6];
    p.style.left=(rnd()*W)+'px';p.style.top='-10px';fx.appendChild(p);
    p.animate([{transform:'translateY(0) rotate(0)',opacity:1},{transform:`translate(${(rnd()-0.5)*120}px,${window.innerHeight*0.9}px) rotate(${rnd()*720}deg)`,opacity:.9}],{duration:1600+rnd()*1400,delay:rnd()*700,easing:'cubic-bezier(.3,.2,.6,1)',fill:'both'}).onfinish=()=>p.remove();}
}
/* o prêmio voa até a Loja (pacotes) e até o contador de Brasas */
function voarPremio(P){
  if(!P)return;const fx=$('#fx');if(!fx)return;
  const cx=window.innerWidth/2,cy=window.innerHeight/2;
  const alvo=sel=>{const t=$$(sel).find(x=>x.offsetParent!==null);return t?t.getBoundingClientRect():null;};
  const voar=(r,cor,n,glow)=>{if(!r)return;for(let i=0;i<n;i++){const p=document.createElement('i');p.className='pxp';p.style.width=p.style.height='6px';p.style.background=cor;p.style.boxShadow='0 0 6px '+glow;p.style.left=cx+'px';p.style.top=cy+'px';fx.appendChild(p);
    if(RM){setTimeout(()=>p.remove(),250);continue;}
    const dx=r.left+r.width/2-cx,dy=r.top+r.height/2-cy;
    p.animate([{transform:'none',opacity:1},{transform:`translate(${dx*0.35+(rnd()-0.5)*120}px,${dy*0.35-50}px)`,offset:.4},{transform:`translate(${dx}px,${dy}px)`,opacity:.7}],{duration:700+i*40,easing:'ease-in'}).onfinish=()=>p.remove();}};
  if(P.po)voar(alvo('#wPo'),'#B36BE8',10,'#E6CCFF');
  if(P.pacotes)setTimeout(()=>voar(alvo('[data-go="loja"]'),'#F2C230',8,'#FFE58A'),200);
  setTimeout(()=>{sfx('coin');refresh();},RM?100:800);
}
async function mostrarArenaNova(n){
  const A=ARENAS[n-1];const novas=novasDaArena(n);const mx=8,mais=Math.max(0,novas.length-mx);
  return new Promise(res=>{
    const el=document.createElement('div');el.className='arenaov';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
    el.innerHTML=`<h1>Nova arena: ${escH(A.nome)}!</h1><div class="banner" style="width:min(420px,100%);border:3px solid var(--wood-dk);border-radius:10px;overflow:hidden"><canvas data-scene="${n}" width="105" height="30"></canvas></div>
     ${novas.length?`<div class="afan">${novas.slice(0,mx).map(c=>cardHTML(c.id,{sz:'hand'})).join('')}${mais?`<span class="amais num">+${mais}</span>`:''}</div><p class="pix" style="font-size:18px">${novas.length} cartas novas nos pacotes!</p>`:`<p class="pix" style="font-size:18px">Rival mais difícil · mais ${MOE} por vitória</p>`}
     ${n===DESAFIO.arenaMin?`<p class="anovo">${ic('desafio',18)} Abriu o <b>${MODO_NOME.desafio}</b>!</p>`:''}${n===TORNEIO.arenaMin?`<p class="anovo">${ic('torneio',18)} Abriu a <b>${MODO_NOME.torneio}</b>!</p>`:''}
     <button class="btn gold md" data-ok>Oba!</button>`;
    document.body.appendChild(el);hydrateGfx(el);sfx('fanfare');
    if(!RM)$$('.afan .card, .afan .amais',el).forEach((c,i)=>c.animate([{transform:'translateY(80px) rotate(-10deg)',opacity:0},{transform:'none',opacity:1}],{duration:500,delay:i*110,fill:'backwards',easing:'ease-out'}));
    const b=$('[data-ok]',el);setTimeout(()=>{try{b.focus();}catch(e){}},50);
    b.onclick=()=>{el.remove();res();};
  });
}

/* ---------- tutorial ---------- */
function tutPermite(kind,v,visual){
  const T=BU.tut;if(!T)return true;
  if(kind==='hand')return !!(T.hand&&T.hand.has(v));
  if(kind==='lane'){
    const inst=selInst();
    if(inst&&T.laneFor&&T.laneFor[inst.id])return T.laneFor[inst.id].includes(v);
    return !!(T.lanes&&T.lanes.has(v));
  }
  return false;
}
function tutSinal(tipo,val){
  const w=BU.tutWait;if(!w)return;
  if(w.tipos.includes(tipo)){BU.tutWait=null;w.res({tipo,val});}
}
function tutEspera(tipos){return new Promise(res=>{BU.tutWait={tipos:[].concat(tipos),res};});}
function setTut(o){BU.tut={hand:new Set(o.hand||[]),lanes:new Set(o.lanes||[]),laneFor:o.laneFor||null,atk:!!o.atk};bRender();}
async function tutJogar(id,lanes,txtSel,txtLane,posSel,posLane){
  const tok=BU.tutTok;
  while(B&&B.tut&&BU.tutTok===tok&&B.sides.p.hand.some(h=>h.id===id)){
    setTut({hand:[id],laneFor:{[id]:lanes}});
    if(!BU.sel||selInst().id!==id){vovo(txtSel,{pos:posSel||'top',ok:false});const r=await tutEspera(['select','play']);if(r.tipo==='play')break;}
    vovo(txtLane,{pos:posLane||'top',ok:false});
    const r2=await tutEspera(['deselect','play']);
    if(r2.tipo==='play')break;
  }
}
async function tutRival(plays){
  sfx('turnoRival');
  iniciarTurno(B,'r',true);await tocarEventos();
  await sleep(vel(300));
  for(const p of plays){
    if(!B)return;
    const inst=mkInst(p.id,1);B.sides.r.hand.push(inst);B.sides.r.energy=99;
    const src=await mostrarCartaRival(inst);
    jogarCarta(B,'r',inst.uid,p.lane);
    await tocarEventos({src});await varrerAnim();await sleep(vel(300));
  }
  await combateAnim('r');
  fimTurno(B,'r');
}
async function tutVezJogador(){sfx('seuTurno');iniciarTurno(B,'p');await tocarEventos();BU.busy=false;bRender();}
async function tutorialScript(){
  const tok={};BU.tutTok=tok;
  const vivo=()=>B&&B.tut&&BU.tutTok===tok&&!B.over;
  setTut({});
  // T2/T3: Fagulha (espiga-sapeca) num Sertão (milharal)
  await tutJogar('espiga-sapeca',['p0','p2'],TXT_TUT.t2,TXT_TUT.t3);if(!vivo())return;
  // T4: Pintinho no terreno 2
  await tutJogar('pintinho-valente',['p1'],TXT_TUT.t4,TXT_TUT.t4);if(!vivo())return;
  // T5: atacar
  setTut({atk:true});vovo(TXT_TUT.t5,{pos:'top',ok:false});
  await tutEspera('atacar');if(!vivo())return;vovoFechar();setTut({});
  // primeira recompensa logo no 1º ataque (uma vez só, mesmo se recarregar)
  if(!s.tutorialFeito&&!s.tutBonus){s.tutBonus=true;ganhar(5,'vitorias');ecoSample();save();sfx('coin');toast(`${ic('coin',16)} <b>+5 ${MOE}</b> pelo primeiro ataque!`,{ms:2600});}
  // rival R1: Espiga na frente da sua Espiga
  const L=B.sides.p.lanes.findIndex(x=>x.c&&x.c.id==='espiga-sapeca');
  await tutRival([{id:'espiga-sapeca',lane:L>=0?L:0}]);if(!vivo())return;
  // R2
  await tutVezJogador();
  const LE=B.sides.r.lanes.findIndex(x=>x.c&&x.c.id==='espiga-sapeca');
  await tutJogar('chuva-de-graos',['r'+(LE>=0?LE:0)],TXT_TUT.t6,TXT_TUT.t6,'pl','pl');if(!vivo())return;
  setTut({atk:true});vovo(TXT_TUT.t7,{pos:'top',ok:false});
  await tutEspera('atacar');if(!vivo())return;vovoFechar();setTut({});
  await tutRival([{id:'corvo-ladino',lane:3}]);if(!vivo())return;
  // R3
  await tutVezJogador();
  const mil=[0,2].filter(i=>!B.sides.p.lanes[i].c).map(i=>'p'+i);
  vovo(TXT_TUT.t8,{pos:'top',ok:false});
  while(vivo()&&B.sides.p.hand.some(h=>h.id==='corvo-ladino'||h.id==='ovelha-felpuda')){
    const ids=['corvo-ladino','ovelha-felpuda'].filter(id=>B.sides.p.hand.some(h=>h.id===id));
    setTut({hand:ids,laneFor:{'corvo-ladino':mil.length?mil:['p0','p2'],'ovelha-felpuda':['p3']}});
    await tutEspera(['play']);
  }
  if(!vivo())return;
  setTut({atk:true});
  await tutEspera('atacar');if(!vivo())return;vovoFechar();setTut({});
  await tutRival([{id:'ovelha-felpuda',lane:1}]);if(!vivo())return;
  // R4: mão travada, só Atacar
  await tutVezJogador();
  setTut({atk:true});vovo(TXT_TUT.t9,{pos:'top',ok:false});
  await tutEspera('atacar');
}
function pularTutorial(){
  if(!B||!B.tut||B.fechando)return;
  BU.tutTok=null;BU.tutWait=null;vovoFechar();
  B.over=true;B.result='vitoria';terminar();
}
function terminarTutorial(){
  BU.tutTok=null;BU.tutWait=null;vovoFechar();
  // recompensas do tutorial (fora das missões e do limite diário)
  const antes=s.trofeus;
  if(!s.tutorialFeito){
    mudarTrofeus(30);ganhar(20,'vitorias');darBauTutorial();
    s.tutorialFeito=true;s.pacotes.semente+=1;s.guia=2;ecoSample();saveNow();
  }
  musica(null);sfx('victory');
  const el=document.createElement('div');el.className='result';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Vitória');
  el.innerHTML=`<div class="panel rbox"><h1 class="vit">VITÓRIA!</h1><div class="rp">${artCanvas(RIVAIS.pipoca.retrato)}</div><div class="muted">Você venceu o ${escH(RIVAIS.pipoca.curto)}!</div>
   <div class="rl">${ic('trofeu',20)} <span class="num" id="rTr">${fmt(antes)}</span> <span class="num up">+30</span></div>
   <div class="rl">${ic('coin',20)} <span class="num">+20</span> ${MOEC}</div>
   <div class="rl" id="rBau">${chestImg('madeira',48)} ${escH(BAUS.madeira.nome)} (abre em 10 s)</div>
   <div class="vovo inline" role="status"><div class="vp">${artCanvas(retratoId('zinha'))}</div><div><b>${escH(TEMA.mentora.curto)}</b><p>Tesouro leva um tempinho pra abrir. Enquanto isso, deixa eu te dar um presente...</p></div></div>
   <button class="btn gold big" data-cont>Abrir presente!</button></div>`;
  document.body.appendChild(el);hydrateGfx(el);
  const tr=$('#rTr',el);const t0=performance.now(),dur=RM?0:800;
  const tick=()=>{const k=dur?clamp((performance.now()-t0)/dur,0,1):1;tr.textContent=fmt(Math.round(antes+30*k));if(k<1)requestAnimationFrame(tick);};tick();
  if(!RM)$('#rBau',el).animate([{transform:'scale(.3) translateY(40px)',opacity:0},{transform:'scale(1.15)',opacity:1,offset:.7},{transform:'none'}],{duration:600,delay:400,fill:'backwards'});
  const b=$('[data-cont]',el);setTimeout(()=>{try{b.focus();}catch(e){}},60);
  b.onclick=async()=>{vovoFechar();el.remove();fecharBatalha();UI.tab='inicio';refresh();await fluxoPresente();};
}
/* pacote presente + primeira melhora (guia 2→3→4) */
async function fluxoPresente(){
  if(s.guia===2&&s.pacotes.semente>0&&!s.primeiroPacote){
    const res=abrirPacote('semente',false);
    if(res){s.guia=3;saveNow();refresh();await revelar(res,{guia:true});}
  }
  refresh();
}

