/* ===================== v12: BATALHA DAS TRILHAS — tela, toque e fim de partida =====================
 Junta o motor (62-trilhas.js) e o palco 3D (63-trilhas3d.js). Modo em teste contra o computador:
 conta como Treino (missão de treino), sem troféus, para não mexer na economia enquanto as regras amadurecem.
 Entrada: botão "Batalha das Trilhas" no cartão da Arena (Início). */
(function(){
  const st=document.createElement('style');st.textContent=`
#trilhas{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;background:#1A2A1A;color:var(--ink);touch-action:none;user-select:none;-webkit-user-select:none;overscroll-behavior:none}
#trilhas[hidden]{display:none}
.tri-top{display:flex;align-items:center;gap:8px;padding:calc(6px + env(safe-area-inset-top,0px)) 10px 6px;background:linear-gradient(#120F12,#120F12cc);z-index:2}
.tri-lado{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.tri-lado.d{align-items:flex-end}
.tri-top .tri-nome{display:flex;align-items:center;gap:5px;font:700 13px var(--pix);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.tri-top .tri-nome i{display:inline-block;width:10px;height:10px;border-radius:50%;flex:none}
.tri-cor{display:flex;gap:2px;height:14px}
.tri-cor b{width:13px;height:13px;border-radius:3px;background:#0006;border:1.5px solid #fff3;transform:rotate(45deg) scale(.8)}
.tri-cor.r b.on{background:#F0603A;border-color:#FFB08A}.tri-cor.p b.on{background:#4FB3E8;border-color:#BFE8FF}
.tri-tempo{font:800 18px var(--body);font-variant-numeric:tabular-nums;min-width:58px;text-align:center;padding:2px 8px;border-radius:10px;background:#0008}
.tri-tempo.dobro{color:#FFD35A;box-shadow:0 0 0 2px #FFD35A inset}
.tri-campo{position:relative;flex:1;min-height:0;overflow:hidden}
.tri-campo canvas{position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:auto}
.tri-2d{pointer-events:none}
.tri-aviso{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);font:700 22px var(--pix);color:#FFF6E0;text-shadow:0 2px 0 #2E1F05,0 0 18px #000;pointer-events:none;text-align:center;opacity:0;transition:opacity .25s;width:90%}
.tri-aviso.on{opacity:1}
.tri-rival{position:absolute;right:8px;top:8px;display:flex;align-items:center;gap:6px;background:#120F12d0;border:2px solid #F0603A;border-radius:12px;padding:4px 8px 4px 4px;font:700 12px var(--body);pointer-events:none;transition:opacity .3s,transform .3s;max-width:70%}
.tri-rival canvas.art{width:40px;height:30px;border-radius:6px}
.tri-rival.off{opacity:0;transform:translateY(-8px)}
.tri-dica{position:absolute;left:8px;right:8px;bottom:6px;text-align:center;font:700 12px var(--body);color:#FFF6E0;text-shadow:0 1px 3px #000;pointer-events:none;min-height:16px}
.tri-base{background:linear-gradient(#2A1F18,#1A130E);border-top:2px solid #5E3B22;padding:6px 8px calc(8px + env(safe-area-inset-bottom,0px));z-index:2}
.tri-mao{display:flex;gap:6px;align-items:flex-end;justify-content:center}
.tri-prox{display:flex;flex-direction:column;align-items:center;gap:2px;font:700 10px var(--body);color:var(--muted);width:46px;flex:none}
.tri-prox canvas.art{width:40px;height:30px;border-radius:6px;opacity:.85}
.tri-c{position:relative;flex:1;max-width:96px;min-width:0;padding:4px 4px 5px;border-radius:12px;border:2px solid #6B4427;background:#3A2A20;display:flex;flex-direction:column;align-items:center;gap:3px;transition:transform .12s,border-color .12s,filter .2s}
.tri-c canvas.art{width:100%;height:auto;aspect-ratio:4/3;border-radius:8px;pointer-events:none}
.tri-c .tri-cn{font:700 11px var(--pix);line-height:1.1;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}
.tri-c .tri-cu{position:absolute;left:-4px;top:-6px;width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#9FE0FF,#2A7FC0);border:2px solid #0B2A40;font:900 13px var(--body);display:grid;place-items:center;color:#fff;text-shadow:0 1px 0 #0B2A40;pointer-events:none}
.tri-c.sel{transform:translateY(-10px) scale(1.04);border-color:#FFD35A;box-shadow:0 0 0 2px #FFD35A55,0 6px 14px #0008}
.tri-c.caro{filter:grayscale(.7) brightness(.7)}
.tri-c .tri-rr{position:absolute;inset:auto 6px 0;height:3px;border-radius:3px;pointer-events:none}
.tri-en{display:flex;align-items:center;gap:8px;margin-top:7px}
.tri-en b{font:900 18px var(--body);width:26px;text-align:center;color:#9FE0FF}
.tri-barra{flex:1;height:14px;border-radius:8px;background:#0B1A26;border:2px solid #0B2A40;position:relative;overflow:hidden}
.tri-barra i{position:absolute;inset:0 auto 0 0;background:linear-gradient(#9FE0FF,#2A7FC0);border-radius:6px}
.tri-barra s{position:absolute;top:0;bottom:0;width:2px;background:#0B2A40aa}
.tri-res{position:absolute;inset:0;z-index:5;display:grid;place-items:center;background:#000a;padding:16px}
.tri-res .rbox{background:var(--panel);border:2px solid var(--line);border-radius:18px;padding:18px;max-width:380px;width:100%;text-align:center}
.tri-res h1{margin:0 0 6px;font:700 30px var(--rye,var(--pix))}
.tri-res .cor{font:900 26px var(--body);margin:6px 0}
.tri-res .rbtn{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}
.tri-ajuda{position:absolute;inset:0;z-index:4;display:grid;place-items:center;background:#000b;padding:16px}
.tri-ajuda .rbox{background:var(--panel);border:2px solid var(--line);border-radius:18px;padding:16px 18px;max-width:400px;width:100%}
.tri-ajuda li{margin:6px 0;font-size:14px}
.tri-novo{margin-top:10px;padding:10px;border-radius:12px;border:2px dashed #FFD35A88;background:#FFD35A12}
.tri-novo p{margin:0 0 8px;font-size:13px}
.tri-novo .tri-nv{display:inline-block;background:#FFD35A;color:#2E1F05;font:800 10px var(--body);padding:2px 6px;border-radius:6px;margin-right:6px;vertical-align:middle}
.tri-niv{display:flex;gap:6px;margin-bottom:8px}
.tri-niv button{flex:1}
`;document.head.appendChild(st);
})();

const TRU={T:null,raf:0,sel:-1,arr:null,hk:'',fim:false,pausa:false,ultimo:0,ultRender:0,maoEls:[],tier:'facil',rival:null,avisoT:0,rivT:0,ajuda:false};
function triAbrir(tier){
  if(!s||!deckOk()){toast('Seu deck precisa de 20 cartas.');return;}
  if(!window.THREE){toast('Seu aparelho não abriu o 3D. Tente em outro navegador.');return;}
  TRU.tier=tier||TRU.tier||'facil';
  const A=arenaDef();const R=RIVAIS[A.rival]&&RIVAIS[A.rival].deck?RIVAIS[A.rival]:RIVAIS.tonico;TRU.rival=R;
  const nivelR=TRU.tier==='dificil'?Math.min(5,nivelIA(A.n,'comum')+1):nivelIA(A.n,'comum');
  const deckR=[];for(const id in R.deck)for(let i=0;i<R.deck[id];i++)deckR.push({id,lvl:Math.min(nivelR,5)});
  const T=TRI.nova({seed:(Date.now()^0x5bd1e995)>>>0,p:{deck:s.deck.cartas.map(id=>({id,lvl:lvlOf(id)})),terr:s.deck.terrenos.slice(0,3),nome:'Você'},
    r:{deck:deckR,terr:R.lanes.slice(0,3),nome:R.curto},ia:{r:TRU.tier}});
  TRU.T=T;TRU.sel=-1;TRU.hk='';TRU.fim=false;TRU.pausa=false;TRU.ultimo=0;TRU.ultRender=0;
  inBattle=true;try{MUS.int=0;}catch(e){}musica('arena');
  $('#app').hidden=true;
  let el=$('#trilhas');if(!el){el=document.createElement('div');el.id='trilhas';el.setAttribute('role','application');el.setAttribute('aria-label','Batalha das Trilhas');document.body.appendChild(el);}
  el.hidden=false;
  el.innerHTML=`<div class="tri-top"><button class="ibtn" data-tri="sair" aria-label="Sair" title="Sair">${ic('bandeira',18)}</button>
    <div class="tri-lado"><span class="tri-nome"><i style="background:#F0603A"></i>${escH(R.curto)}</span><span class="tri-cor r" id="triCorR" aria-label="Torres que o rival derrubou"></span></div>
    <div class="tri-tempo" id="triTempo">3:00</div>
    <div class="tri-lado d"><span class="tri-nome">Você<i style="background:#4FB3E8"></i></span><span class="tri-cor p" id="triCorP" aria-label="Torres que você derrubou"></span></div>
    <button class="ibtn" data-tri="ajuda" aria-label="Como jogar" title="Como jogar">?</button>${muteBtn()}</div>
  <div class="tri-campo" id="triCampo"><div class="tri-aviso" id="triAviso"></div><div class="tri-rival off" id="triRival"></div><div class="tri-dica" id="triDica"></div></div>
  <div class="tri-base"><div class="tri-mao" id="triMao"></div>
    <div class="tri-en"><b id="triEnN">5</b><div class="tri-barra"><i id="triEnB"></i>${[1,2,3,4,5,6,7,8,9].map(k=>`<s style="left:${k*10}%"></s>`).join('')}</div></div></div>`;
  const campo=$('#triCampo');
  if(!TR3.iniciar(campo)){triFechar();toast('Seu aparelho não abriu o 3D.');return;}
  TR3.montar(T);
  triMao();
  el.onclick=triClique;
  campo.addEventListener('pointerdown',triCampoDown);
  el.addEventListener('pointermove',triMove);
  el.addEventListener('pointerup',triUp);el.addEventListener('pointercancel',()=>{TRU.arr=null;TR3.mira(null);});
  $('#triMao').addEventListener('pointerdown',triMaoDown);
  if(!s.triAjuda){triAjuda();}
  else triAviso('Prepare-se!',1200);
  cancelAnimationFrame(TRU.raf);TRU.raf=requestAnimationFrame(triLoop);
}
function triFechar(){
  cancelAnimationFrame(TRU.raf);TRU.raf=0;try{TR3.parar();}catch(e){}
  const el=$('#trilhas');if(el){el.hidden=true;el.innerHTML='';el.onclick=null;}
  TRU.T=null;inBattle=false;musica('fazenda');$('#app').hidden=false;refresh();
}
function triAjuda(){
  const el=$('#trilhas');if(!el)return;TRU.pausa=true;TRU.ajuda=true;
  const d=document.createElement('div');d.className='tri-ajuda';d.innerHTML=`<div class="rbox" role="dialog" aria-label="Como jogar"><h2 style="margin:0 0 6px;font:700 20px var(--pix)">Batalha das Trilhas</h2><ul style="padding-left:18px;margin:0">
    <li><b>3 trilhas</b>: esquerda, meio e direita. Cada uma tem uma torre sua e uma do rival. A <b>Casa</b> fica no fundo.</li>
    <li>Toque numa carta e depois numa trilha do seu lado (ou arraste a carta até lá). A lenda <b>anda e briga sozinha</b>.</li>
    <li>A <b>energia</b> enche sozinha. No último minuto ela enche em dobro.</li>
    <li>O rival vê o que você joga e <b>responde na hora</b>. Defenda e contra-ataque!</li>
    <li>Lenda no <b>terreno da cor dela</b> chega mais forte. Derrubou uma torre? Pode soltar lendas mais à frente naquela trilha.</li>
    <li>Derrube a Casa para ganhar na hora. Se o tempo acabar, ganha quem derrubou mais torres.</li></ul>
    <button class="btn gold md" style="width:100%;margin-top:12px" data-tri="ok">Bora!</button></div>`;
  el.appendChild(d);
}
function triAviso(txt,ms){const a=$('#triAviso');if(!a)return;a.textContent=txt;a.classList.add('on');clearTimeout(TRU.avisoT);TRU.avisoT=setTimeout(()=>a.classList.remove('on'),ms||1500);}
function triRivalJogou(id){const el=$('#triRival');if(!el)return;const C=CARD[id];
  el.innerHTML=`${artCanvas(id)}<span><b>${escH(TRU.rival.curto)}</b> jogou<br>${escH(C.curto||C.nome)}</span>`;hydrateGfx(el);el.classList.remove('off');clearTimeout(TRU.rivT);TRU.rivT=setTimeout(()=>el.classList.add('off'),1800);}
function triMao(){
  const T=TRU.T;if(!T)return;const m=$('#triMao');if(!m)return;
  const k=T.mao.p.map(c=>c.id).join()+'|'+(T.fila.p[0]&&T.fila.p[0].id);if(k===TRU.hk)return;TRU.hk=k;
  const prox=T.fila.p[0];
  m.innerHTML=`<div class="tri-prox" aria-label="Próxima carta">${prox?artCanvas(prox.id):''}<span>Próxima</span></div>`+T.mao.p.map((c,i)=>{const C=CARD[c.id];
    return `<button class="tri-c${TRU.sel===i?' sel':''}" data-i="${i}" aria-label="${escH(C.nome)}, custa ${C.custo}">${artCanvas(c.id)}<span class="tri-cu">${C.custo}</span><span class="tri-cn">${escH(C.curto||C.nome)}</span><i class="tri-rr" style="background:${RAR_COR[C.rar]}"></i></button>`;}).join('');
  hydrateGfx(m);TRU.maoEls=[...m.querySelectorAll('.tri-c')];
}
function triSelecionar(i){
  const T=TRU.T;if(!T||TRU.fim)return;
  if(TRU.sel===i){TRU.sel=-1;}else{TRU.sel=i;sfx('pega');}
  TRU.maoEls.forEach((b,k)=>b.classList.toggle('sel',k===TRU.sel));
  const d=$('#triDica');if(d){if(TRU.sel>=0){const c=T.mao.p[TRU.sel];d.textContent=(CARD[c.id].curto||CARD[c.id].nome)+': '+TRI.texto(c.id,c.lvl);}else d.textContent='';}
  triMira(null);
}
function triMira(pt){
  const T=TRU.T;if(!T||TRU.sel<0){TR3.mira(null);return;}
  const c=T.mao.p[TRU.sel];const C=CARD[c.id];const zonas=[0,1,2].map(l=>TRI.zona(T,'p',l));
  if(!pt){TR3.mira({tipo:C.tipo==='feitico'?'feitico':'un',lane:-1,zonas,ok:false});return;}
  const v=TRI.podeAqui(T,'p',TRU.sel,pt.x,pt.y);
  TR3.mira({tipo:C.tipo==='feitico'?'feitico':'un',lane:TRI.lane(pt.x),x:v.ok?v.x:pt.x,y:v.ok?v.y:pt.y,ok:v.ok||v.motivo==='energia',zonas});
}
function triSoltar(pt){
  const T=TRU.T;if(!T||TRU.sel<0||!pt)return false;
  const r=TRI.jogar(T,'p',TRU.sel,pt.x,pt.y);
  if(!r.ok){if(r.motivo==='energia'){sfx('erro');triDica('Falta energia para essa carta.');}else if(r.motivo==='zona'){sfx('erro');triDica('Solte a carta no seu lado do campo, numa das 3 trilhas.');}return false;}
  TRU.sel=-1;TRU.hk='';triMao();TR3.mira(null);triDica('');return true;
}
let triDicaT=0;function triDica(t){const d=$('#triDica');if(d){d.textContent=t;clearTimeout(triDicaT);if(t)triDicaT=setTimeout(()=>{if(d.textContent===t)d.textContent='';},2500);}}
function triMaoDown(e){
  const b=e.target.closest('.tri-c');if(!b||!TRU.T)return;e.preventDefault();
  const i=+b.dataset.i;if(TRU.sel!==i)triSelecionar(i);else{TRU.arr={i,x:e.clientX,y:e.clientY,mexeu:false,toque:true};return;}
  TRU.arr={i,x:e.clientX,y:e.clientY,mexeu:false};
}
function triCampoDown(e){if(!TRU.T||TRU.sel<0)return;TRU.arr={i:TRU.sel,x:e.clientX,y:e.clientY,mexeu:true,campo:true};triMira(TR3.pick(e.clientX,e.clientY));}
function triMove(e){
  const a=TRU.arr;if(!a||!TRU.T)return;
  if(!a.mexeu&&Math.hypot(e.clientX-a.x,e.clientY-a.y)>12)a.mexeu=true;
  if(!a.mexeu)return;
  const campo=$('#triCampo').getBoundingClientRect();
  if(e.clientY<campo.bottom)triMira(TR3.pick(e.clientX,e.clientY));else triMira(null);
}
function triUp(e){
  const a=TRU.arr;TRU.arr=null;if(!a||!TRU.T)return;
  const campo=$('#triCampo').getBoundingClientRect();
  if(a.toque&&!a.mexeu){triSelecionar(a.i);return;} // tocou de novo na carta escolhida: larga
  if(a.mexeu&&e.clientY<campo.bottom&&e.clientY>campo.top){triSoltar(TR3.pick(e.clientX,e.clientY));}
  else if(a.mexeu)triMira(null);
}
function triClique(e){
  const b=e.target.closest('[data-tri]');if(b){const k=b.dataset.tri;
    if(k==='sair')triSair();else if(k==='ajuda'){sfx('tap');triAjuda();}
    else if(k==='ok'){sfx('tap');const d=b.closest('.tri-ajuda');if(d)d.remove();TRU.ajuda=false;TRU.pausa=false;TRU.ultimo=0;if(!s.triAjuda){s.triAjuda=1;save();}triAviso('Bora!',900);}
    else if(k==='denovo'){sfx('tap');const t=TRU.tier;triFechar();triAbrir(t);}
    else if(k==='voltar'){sfx('tap');triFechar();}
    return;}
  const m=e.target.closest('[data-act="mute"]');if(m){s.mudo=!s.mudo;save();m.outerHTML=muteBtn();if(!s.mudo)musica('arena');return;}
}
async function triSair(){
  if(TRU.fim){triFechar();return;}
  TRU.pausa=true;
  const ok=await perguntar('Sair agora conta como derrota nesta partida de teste. Sair mesmo?','Sair',{perigo:true,titulo:'Sair da batalha?'});
  if(ok){triFechar();return;}TRU.pausa=false;TRU.ultimo=0;
}
function triSons(T,L){
  for(const v of L){
    switch(v.t){
      case 'jogou':if(v.P==='p')sfx(v.tipo==='feitico'?'spell':'play');else{sfx('whoosh');triRivalJogou(v.id);}break;
      case 'golpe':if(Math.random()<0.5)sfx(v.dist?'whoosh':'ataque');break;
      case 'dano':if(v.forte)sfx('hit');break;
      case 'morre':sfx('death');break;
      case 'cura':sfx('heal');break;
      case 'feitico':sfx('magia');break;
      case 'torre':sfx('destroi');triAviso(v.P==='r'?(v.kind==='casa'?'A Casa rival caiu!':'Torre derrubada!'):(v.kind==='casa'?'Sua Casa caiu!':'Perdemos uma torre!'),1600);break;
      case 'aviso':if(v.txt==='dobro')triAviso('Último minuto: energia em dobro!',1800);else if(v.txt==='prorroga')triAviso('Prorrogação! Quem derrubar uma torre ganha.',2200);else if(v.txt==='casa'&&v.P==='r')triAviso('A Casa rival acordou!',1200);break;
    }
  }
}
function triHud(T){
  const tr=Math.max(0,(T.prorroga?TRI.DUR+TRI.PRORROGA:TRI.DUR)-T.t),mm=Math.floor(tr/60),ss=Math.floor(tr%60);
  const te=$('#triTempo');if(te){const txt=mm+':'+String(ss).padStart(2,'0');if(te.textContent!==txt)te.textContent=txt;te.classList.toggle('dobro',T.prorroga||TRI.DUR-T.t<=60);}
  const en=T.en.p;const n=$('#triEnN');if(n){const v=String(Math.floor(en));if(n.textContent!==v)n.textContent=v;}
  const b=$('#triEnB');if(b)b.style.width=(en/TRI.EN_MAX*100).toFixed(1)+'%';
  TRU.maoEls.forEach((el,i)=>{const c=T.mao.p[i];if(!c)return;el.classList.toggle('caro',CARD[c.id].custo>en);});
  const cr=(P,id)=>{const e=$(id);if(!e)return;const n=Math.min(3,T.coroas[P]);if(e.dataset.n===String(n))return;e.dataset.n=n;e.innerHTML=[0,1,2].map(k=>`<b class="${k<n?'on':''}"></b>`).join('');};
  cr('p','#triCorP');cr('r','#triCorR');
}
function triLoop(now){
  TRU.raf=0;const T=TRU.T;if(!T)return;
  if(document.hidden){TRU.ultimo=0;TRU.raf=requestAnimationFrame(triLoop);return;}
  const dt=TRU.ultimo?Math.min(0.1,(now-TRU.ultimo)/1000):0;TRU.ultimo=now;
  if(!TRU.pausa&&!TRU.fim)TRI.passo(T,dt);
  if(T.ev.length){const L=T.ev.splice(0);TR3.eventos(T,L);triSons(T,L);if(L.some(v=>v.t==='jogou'&&v.P==='p'))triMao();}
  // celular: 30 quadros por segundo; computador: até 60
  const passo=TR3.cel?1000/31:1000/61;
  if(now-TRU.ultRender>=passo){TRU.ultRender=now;TR3.quadro(T,now);triHud(T);}
  if(T.over&&!TRU.fim){TRU.fim=true;TRU.sel=-1;TR3.mira(null);setTimeout(()=>triResultado(T),1400);}
  TRU.raf=requestAnimationFrame(triLoop);
}
function triResultado(T){
  if(!TRU.T||TRU.T!==T)return;const el=$('#trilhas');if(!el)return;
  const res=T.vencedor==='p'?'vitoria':T.vencedor==='r'?'derrota':'empate';
  sfx(res==='vitoria'?'victory':res==='derrota'?'defeat':'empate');
  // conta como um Treino (missão de treino); sem troféus enquanto o modo está em teste
  try{fecharPartida({result:res,modo:'treino',round:2,stats:{criaturas:T.stats.p.cartas-T.stats.p.feiticos,feiticos:T.stats.p.feiticos,danoHeroi:0,abates:T.stats.p.abates}});
    s.trilhas=s.trilhas||{v:0,d:0,e:0};s.trilhas[res==='vitoria'?'v':res==='derrota'?'d':'e']++;save();}catch(e){}
  const tit=res==='vitoria'?'<h1 class="vit" style="color:#FFD35A">VITÓRIA!</h1>':res==='derrota'?'<h1 style="color:#F0806A">DERROTA</h1>':'<h1>EMPATE</h1>';
  const d=document.createElement('div');d.className='tri-res';d.innerHTML=`<div class="rbox" role="dialog" aria-label="Resultado">${tit}
    <div class="cor"><span style="color:#4FB3E8">${'★'.repeat(T.coroas.p)||'0'}</span> <span class="muted" style="font-size:16px">x</span> <span style="color:#F0603A">${'★'.repeat(T.coroas.r)||'0'}</span></div>
    <p class="muted" style="margin:4px 0">Torres derrubadas · ${T.stats.p.cartas} cartas jogadas · ${T.stats.p.abates} lendas derrubadas${T.porTempo?' · terminou no tempo':''}</p>
    <p class="muted" style="font-size:12px;margin:8px 0 0">Modo em teste: conta como Treino e ainda não dá troféus.</p>
    <div class="rbtn"><button class="btn md" data-tri="voltar">Voltar</button><button class="btn gold md" data-tri="denovo">Jogar de novo</button></div></div>`;
  el.appendChild(d);
}

/* ---------- entrada no Início (cartão da Arena) ---------- */
const _refreshTri=refresh;
refresh=function(){
  _refreshTri();
  if(!s||!UI.started||inBattle||UI.tab!=='inicio')return;
  const bt=$('#main [data-act="batalhar"]');if(!bt||$('#main .tri-novo'))return;
  const liberado=s.tutorialFeito,ok=deckOk();
  bt.insertAdjacentHTML('afterend',`<div class="tri-novo"><p><span class="tri-nv">NOVO</span><b>Batalha das Trilhas</b>: 3 trilhas, tudo ao vivo. As lendas andam e brigam sozinhas, e o rival responde na hora.</p>
    <div class="tri-niv" role="group" aria-label="Dificuldade">${['facil','medio','dificil'].map(t=>`<button class="btn small${(s.triTier||'facil')===t?' gold':''}" data-trn="${t}">${TIER_NOME[t]}</button>`).join('')}</div>
    <button class="btn gold md" style="width:100%" data-trn="jogar" ${liberado&&ok?'':'disabled'}>Jogar nas Trilhas</button>${!liberado?'<p class="muted" style="font-size:12px;margin:6px 0 0">Termine o tutorial primeiro.</p>':''}</div>`);
};
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-trn]');if(!b||!s)return;const k=b.dataset.trn;
  if(k==='jogar'){sfx('tap');triAbrir(s.triTier||'facil');}
  else{s.triTier=k;save();sfx('tap');const box=b.closest('.tri-niv');if(box)box.querySelectorAll('[data-trn]').forEach(x=>x.classList.toggle('gold',x.dataset.trn===k));}
});
