/* ===================== ONLINE: conta, jogo salvo na nuvem, Feira dos jogadores, Duelo ao vivo =====================
 Fala com o servidor (server/): /api para contas, save, caixa e Feira; /ws para os duelos.
 Não mexe nas regras: as telas e contas antigas continuam iguais, aqui só entram as peças online.
 - onlineBoot(start): tela de conta → baixa o save da nuvem → start() (chamado em 90-boot)
 - saveNow continua gravando no aparelho e agora também sobe para a nuvem (com revisão, para não apagar outro aparelho)
 - Feira: aba "Jogadores" (anunciar repetidas, comprar de outras pessoas, meus anúncios); "Feirantes" é o mercado de robôs de sempre
 - Duelo ao vivo: o motor roda no servidor; aqui só tocamos os passos que ele manda (mesmas animações da batalha)
*/
const NET={token:null,usuario:null,rev:0,sujo:false,mud:0,timer:0,tranca:Promise.resolve(),falhas:0,offline:false,ws:null,wsTent:0,fila:null,ultCaixa:0,feira:{lista:null,em:0,minhas:null,resumo:null}};
const LSO={token:'ma-token',usuario:'ma-usuario',dono:'ma-dono',rev:'ma-rev',sujo:'ma-sujo'};
const lsG=k=>{try{return localStorage.getItem(k);}catch(e){return null;}};
const lsS=(k,v)=>{try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch(e){}};
let PVP=null;

/* ---------- estilos das telas online ---------- */
(function(){
  const st=document.createElement('style');
  st.textContent=`
.ma-conta .ma-form{width:min(380px,100%);display:grid;gap:10px;text-align:left}
.ma-conta label{display:grid;gap:4px;font-weight:800;font-size:13px}
.ma-conta .subtabs{margin:0}
.ma-conta .warn{margin:0}
.ma-conta .esq{font-size:12px;text-align:center}
@media (max-width:899px){.home{grid-template-areas:"arena" "duelo" "baus" "missoes" "trilha" "merc" "conta"}.home .a-duelo{grid-area:duelo}.home .a-conta{grid-area:conta}}
.a-duelo .dl-acts{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.a-duelo .dl-gl{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px}
.a-conta .ct{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:13px}
.nuvem{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:800;color:var(--muted)}
.nuvem i{width:8px;height:8px;border-radius:50%;background:var(--ok)}
.nuvem.sujo i{background:var(--gold)}.nuvem.off i{background:var(--danger)}
.mrow.fjrow{grid-template-columns:64px minmax(0,1fr) 92px}
.mrow.fjrow .bt .btn{width:92px}
.mrow.fjrow .mi>span.muted{display:block}
@media (min-width:900px){.mrow.fjrow{grid-template-columns:64px minmax(0,1fr) 120px}.mrow.fjrow .bt{grid-template-columns:1fr}.mrow.fjrow .bt .btn{width:120px}}
.fj-est{font-size:11px;font-weight:800;padding:1px 7px;border-radius:999px;background:var(--panel-2);border:1px solid var(--line)}
.fj-est.vendido{background:#1E4A22;color:#C9F5C2;border-color:#3A5A2A}.fj-est.aberto{background:#3E3012;color:var(--gold);border-color:#6B5520}
.fj-preco{display:grid;gap:10px;justify-items:center;text-align:center}
.fj-preco input{width:120px;text-align:center;font-size:20px;font-weight:800}
.dl-busca{display:grid;gap:12px;justify-items:center;text-align:center;padding:6px 0}
.dl-busca .cod{font-family:var(--body);font-weight:800;font-size:44px;letter-spacing:8px;color:var(--gold);font-variant-numeric:tabular-nums}
.dl-busca input{width:160px;text-align:center;font-size:26px;letter-spacing:6px;font-weight:800}
.dl-roda{width:44px;height:44px;border-radius:50%;border:5px solid var(--panel-2);border-top-color:var(--gold);animation:spin 1s linear infinite}
.pvp-rel{position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 50px);z-index:32;pointer-events:none;
  background:rgba(24,15,7,.88);border:2px solid #140B04;border-radius:999px;padding:3px 12px;font-weight:800;font-size:13px;color:#FFF0D2;white-space:nowrap;box-shadow:0 2px 0 rgba(0,0,0,.4)}
.pvp-rel.pouco{color:#FFB09A;border-color:var(--danger)}
.pvp-rel[hidden]{display:none}
.rk{width:100%;border-collapse:collapse;font-size:13px}
.rk th,.rk td{padding:6px 4px;border-bottom:1px solid var(--line);text-align:left}
.rk td.n,.rk th.n{text-align:right;font-variant-numeric:tabular-nums}
.rk tr.eu td{color:var(--gold);font-weight:800}
.res-pvp .rgl{display:flex;align-items:center;justify-content:center;gap:8px;font-weight:800;font-size:18px}
`;
  // depois dos estilos do jogo (que moram no body), para ganhar deles quando a força é igual
  document.body.appendChild(st);
})();

/* ---------- conversa com o servidor ---------- */
async function apiNet(metodo,rota,corpo,o){
  o=o||{};
  let r;
  try{
    r=await fetch('/api'+rota,{method:metodo,keepalive:!!o.keepalive,
      headers:Object.assign({'content-type':'application/json'},NET.token?{authorization:'Bearer '+NET.token}:{}),
      body:corpo==null?undefined:(typeof corpo==='string'?corpo:JSON.stringify(corpo))});
  }catch(e){const x=new Error('Sem conexão com o servidor.');x.status=0;throw x;}
  let j={};try{j=await r.json();}catch(e){}
  if(!r.ok){const x=new Error(j.erro||'Algo deu errado.');x.status=r.status;x.corpo=j;if(r.status===401&&NET.token&&!o.semSair)sessaoCaiu();throw x;}
  NET.offline=false;
  return j;
}
// uma operação por vez (envio do save, Feira, caixa): assim a revisão nunca se cruza
function tranca(fn){const p=NET.tranca.then(fn,fn);NET.tranca=p.catch(()=>{});return p;}

/* ---------- tela de conta ---------- */
function telaConta(msgInicial){
  return new Promise(res=>{
    const el=document.createElement('div');el.className='intro ma-conta';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Entrar no '+TEMA.jogo.nome);
    let modo=lsG(LSO.usuario)?'entrar':'criar';
    el.innerHTML=`<div class="logo titulo-rye">${escH(TEMA.jogo.nome)}</div><p class="sub">${escH(TEMA.jogo.intro||'')}</p>
     <form class="panel ma-form" novalidate>
      <div class="subtabs" role="group" aria-label="Conta"><button type="button" data-modo="entrar">Entrar</button><button type="button" data-modo="criar">Criar conta</button></div>
      <label>E-mail<input class="search" type="email" name="email" autocomplete="email" inputmode="email" required></label>
      <label data-so-criar>Apelido (o nome que as outras pessoas veem)<input class="search" name="apelido" maxlength="16" autocomplete="nickname"></label>
      <label>Senha<input class="search" type="password" name="senha" minlength="6" required></label>
      <p class="warn" role="alert" hidden></p>
      <button class="btn gold big" type="submit"></button>
      <p class="muted esq" data-so-entrar>Esqueceu a senha? Por enquanto, peça para quem cuida do jogo trocar para você.</p>
      <p class="muted esq">${escH(TEMA.moeda.nome)} é moeda de mentirinha: sem dinheiro real.</p>
     </form>`;
    document.body.appendChild(el);
    const f=$('form',el),aviso=$('.warn',el),bt=$('[type=submit]',el);
    const pintar=()=>{
      $$('[data-modo]',el).forEach(b=>b.setAttribute('aria-pressed',b.dataset.modo===modo?'true':'false'));
      $('[data-so-criar]',el).hidden=modo!=='criar';$('[data-so-entrar]',el).hidden=modo!=='entrar';
      bt.textContent=modo==='criar'?'Criar conta e jogar':'Entrar';
      f.senha.setAttribute('autocomplete',modo==='criar'?'new-password':'current-password');
    };
    const avisar=t=>{aviso.textContent=t||'';aviso.hidden=!t;};
    pintar();avisar(msgInicial);
    try{const u=JSON.parse(lsG(LSO.usuario)||'null');if(u&&u.email)f.email.value=u.email;}catch(e){}
    $$('[data-modo]',el).forEach(b=>b.onclick=()=>{modo=b.dataset.modo;avisar('');pintar();});
    setTimeout(()=>{try{(f.email.value?f.senha:f.email).focus({preventScroll:true});}catch(e){}},50);
    f.onsubmit=async e=>{
      e.preventDefault();avisar('');
      const dados={email:f.email.value.trim(),senha:f.senha.value,apelido:f.apelido.value.trim()};
      if(!dados.email||!dados.senha){avisar('Preencha o e-mail e a senha.');return;}
      if(modo==='criar'&&dados.apelido.length<3){avisar('Escolha um apelido de 3 a 16 letras.');return;}
      bt.disabled=true;const txt=bt.textContent;bt.textContent='Um instante…';
      try{
        const r=await apiNet('POST',modo==='criar'?'/conta/criar':'/conta/entrar',dados,{semSair:true});
        NET.token=r.token;NET.usuario=r.usuario;
        lsS(LSO.token,r.token);lsS(LSO.usuario,JSON.stringify(r.usuario));
        el.remove();res(r.usuario);
      }catch(x){avisar(x.message);bt.disabled=false;bt.textContent=txt;}
    };
  });
}
function sessaoCaiu(){
  NET.token=null;lsS(LSO.token,null);
  if(NET.ws)try{NET.ws.close();}catch(e){}
  if(document.querySelector('.ma-conta'))return;
  telaConta('Entre na sua conta de novo.').then(()=>location.reload());
}
async function sairDaConta(){
  const ok=await perguntar('Sair da conta neste aparelho? Seu jogo fica guardado na nuvem.','Sair',{titulo:'Sair da conta'});
  if(!ok)return;
  try{await tranca(()=>nuvemEnviar());}catch(e){}
  try{await apiNet('POST','/conta/sair',{});}catch(e){}
  lsS(LSO.token,null);lsS(LSO.sujo,null);
  location.reload();
}

/* ---------- jogo salvo na nuvem ---------- */
function marcaLocal(){lsS(LSO.dono,String(NET.usuario.id));lsS(LSO.rev,String(NET.rev));lsS(LSO.sujo,NET.sujo?'1':null);}
async function nuvemCarregar(){
  const srv=await apiNet('GET','/save');
  const uid=String(NET.usuario.id),dono=lsG(LSO.dono),sujo=lsG(LSO.sujo)==='1',base=+(lsG(LSO.rev)||0);
  const local=dono===uid?lsG(KEY):null;
  if(local&&sujo&&base===srv.rev){NET.rev=srv.rev;NET.sujo=true;}          // jogou sem internet: o daqui é o mais novo
  else if(srv.dados){lsS(KEY,JSON.stringify(srv.dados));NET.rev=srv.rev;NET.sujo=false;}
  else{NET.rev=0;NET.sujo=true;if(!local)lsS(KEY,null);}                    // conta nova: começa do zero (ou sobe o jogo deste aparelho)
  marcaLocal();
}
const _saveNowLocal=saveNow;
saveNow=function(){
  _saveNowLocal();
  if(!NET.usuario||!s)return;
  NET.sujo=true;NET.mud++;lsS(LSO.sujo,'1');
  clearTimeout(NET.timer);NET.timer=setTimeout(()=>tranca(()=>nuvemEnviar()).catch(()=>{}),2500);
};
async function nuvemEnviar(o){
  o=o||{};
  if(!NET.token||!NET.sujo||!s)return;
  clearTimeout(NET.timer);
  const mud=NET.mud,corpo=JSON.stringify({dados:s,rev:NET.rev});
  try{
    const r=await apiNet('PUT','/save',corpo,{keepalive:o.keepalive&&corpo.length<60000});
    NET.rev=r.rev;NET.falhas=0;
    if(NET.mud===mud)NET.sujo=false;
    marcaLocal();pintarNuvem();
  }catch(x){
    if(x.status===409)return conflito(x.corpo&&x.corpo.atual);
    if(x.status===0){NET.offline=true;NET.falhas++;pintarNuvem();
      clearTimeout(NET.timer);NET.timer=setTimeout(()=>tranca(()=>nuvemEnviar()).catch(()=>{}),Math.min(60000,5000*NET.falhas));}
    throw x;
  }
}
let conflitoAberto=false;
function conflito(atual){
  if(conflitoAberto)return;conflitoAberto=true;
  if(atual&&atual.dados){lsS(KEY,JSON.stringify(atual.dados));NET.rev=atual.rev;NET.sujo=false;marcaLocal();}
  NET.sujo=false;
  const ov=abrirFolha(`<div class="confirm"><p>Seu jogo foi salvo em outro aparelho (ou em outra aba). Vamos abrir o progresso mais novo.</p><div class="acts"><button class="btn gold md wide" data-ok>Abrir o mais novo</button></div></div>`,{titulo:'Jogo salvo em outro lugar',closable:false});
  $('[data-ok]',ov).onclick=()=>location.reload();
}
function pintarNuvem(){const el=$('#maNuvem');if(el){el.className='nuvem'+(NET.offline?' off':NET.sujo?' sujo':'');$('span',el).textContent=NET.offline?'sem internet: salvo só aqui':NET.sujo?'salvando…':'salvo na nuvem';}}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&NET.sujo)tranca(()=>nuvemEnviar({keepalive:true})).catch(()=>{});else if(!document.hidden)checarCaixa();});
window.addEventListener('pagehide',()=>{if(NET.sujo&&NET.token&&s){const c=JSON.stringify({dados:s,rev:NET.rev});if(c.length<60000)fetch('/api/save',{method:'PUT',keepalive:true,headers:{'content-type':'application/json',authorization:'Bearer '+NET.token},body:c}).catch(()=>{});}});
window.addEventListener('online',()=>{if(NET.sujo)tranca(()=>nuvemEnviar()).catch(()=>{});});

// operação no servidor que muda o save (Feira, caixa): sobe o save daqui junto e recebe o novo
function opServidor(rota,corpo){
  return tranca(async()=>{
    const r=await apiNet('POST',rota,Object.assign({},corpo,{save:{dados:s,rev:NET.rev}})).catch(x=>{if(x.status===409&&x.corpo&&x.corpo.atual&&/outro aparelho/.test(x.message))conflito(x.corpo.atual);throw x;});
    s=fixState(r.dados);NET.rev=r.rev;NET.sujo=false;
    _saveNowLocal();marcaLocal();pintarNuvem();
    return r;
  });
}

/* ---------- caixa de entrada: vendas, cartas que voltaram, prêmios ---------- */
async function checarCaixa(forcar){
  if(!NET.token||!s||!UI.started||inBattle||document.hidden)return;
  if(!forcar&&Date.now()-NET.ultCaixa<20000)return;
  NET.ultCaixa=Date.now();
  try{
    const c=await apiNet('GET','/caixa');
    if(!c.pendentes||inBattle)return;
    const r=await opServidor('/caixa/pegar',{});
    let ganho=0;
    for(const it of r.itens){
      if(it.tipo==='venda'){ganho+=it.liquido;toast(`<b>${escH(it.comprador)}</b> comprou sua <b>${escH(CARD[it.carta].nome)}</b> na Feira: +${fmt(it.liquido)} ${MOE}`,{ms:5000});}
      else if(it.tipo==='devolucao')toast(`Ninguém comprou <b>${escH(CARD[it.carta].nome)}</b> em ${3} dias: a carta voltou para você.`,{ms:5000});
      else if(it.tipo==='premio'){ganho+=it.vintens;toast(`Prêmio do duelo: +${fmt(it.vintens)} ${MOE}`,{ms:4000});}
    }
    if(ganho)sfx('coin');
    NET.feira.minhas=null;
    if(!inBattle)refresh();
  }catch(e){}
}
setInterval(()=>checarCaixa(),30000);

/* ---------- partida do jogo ---------- */
async function onlineBoot(start){
  NET.token=lsG(LSO.token);
  try{NET.usuario=JSON.parse(lsG(LSO.usuario)||'null');}catch(e){NET.usuario=null;}
  if(NET.token){
    try{const r=await apiNet('GET','/conta/eu',null,{semSair:true});NET.usuario=r.usuario;lsS(LSO.usuario,JSON.stringify(r.usuario));}
    catch(x){if(x.status===401){NET.token=null;lsS(LSO.token,null);}else NET.offline=true;}
  }
  if(!NET.token||!NET.usuario){NET.offline=false;await telaConta();}
  if(!NET.offline){
    try{await nuvemCarregar();}
    catch(x){NET.offline=true;}
  }
  if(NET.offline&&lsG(LSO.dono)!==String(NET.usuario.id)){
    // sem internet e sem jogo desta conta neste aparelho: não dá para começar
    await new Promise(res=>{const el=document.createElement('div');el.className='intro';el.innerHTML=`<div class="logo titulo-rye">${escH(TEMA.jogo.nome)}</div><p class="sub">Sem conexão com o servidor. Confira a internet e tente de novo.</p><button class="btn gold big">Tentar de novo</button>`;document.body.appendChild(el);$('button',el).onclick=()=>location.reload();});
  }
  if(NET.offline)NET.rev=+(lsG(LSO.rev)||0);
  start({});
  // conta nova (ou jogo que só estava aqui): sobe já
  setTimeout(()=>{if(NET.sujo)tranca(()=>nuvemEnviar()).catch(()=>{});},1500);
  wsConectar();
  setTimeout(()=>checarCaixa(true),4000);
}

/* ---------- Início: painéis de Duelo e Conta ---------- */
const _refresh=refresh;
refresh=function(){
  _refresh();
  if(!s||!UI.started||!NET.usuario)return;
  if(UI.tab==='inicio')pintarInicioOnline();
};
function pintarInicioOnline(){
  const home=$('#main .home');if(!home||$('.a-duelo',home))return;
  const u=NET.usuario,ok=deckOk(),liberado=s.tutorialFeito;
  const duelo=`<section class="panel a-duelo" aria-label="Duelo ao vivo"><div class="ph"><h3>${ic('torneio',18)} Duelo ao vivo</h3><button class="btn small" data-on="ranking" data-k="ranking">Ranking</button></div>
    <div class="dl-gl"><span class="chip">${ic('trofeu',12)} Glória <b class="num">${fmt(u.gloria||0)}</b></span><span class="muted">${fmt(u.pvp?u.pvp.vitorias:0)} vitórias · ${fmt(u.pvp?u.pvp.derrotas:0)} derrotas</span></div>
    <p class="muted" style="font-size:13px;margin:8px 0">Enfrente outra pessoa agora, com o seu deck. Vitória: <b>+25 de Glória</b> e <b>+15 ${MOE}</b> (até 5 por dia).</p>
    <div class="dl-acts"><button class="btn gold md" data-on="procurar" data-k="procurar" ${ok&&liberado?'':'disabled'}>Procurar rival</button><button class="btn md" data-on="amigo" data-k="amigo" ${ok&&liberado?'':'disabled'}>Jogar com amigo</button></div>
    ${!liberado?'<p class="muted" style="font-size:12px;margin-top:6px">Termine o tutorial para duelar.</p>':!ok?'<p class="warn" style="margin-top:6px">Seu deck precisa de 20 cartas.</p>':''}</section>`;
  const conta=`<section class="panel a-conta" aria-label="Sua conta"><div class="ct"><span>Conta: <b>${escH(u.apelido)}</b><br><span class="muted">${escH(u.email||'')}</span></span><span id="maNuvem" class="nuvem"><i></i><span></span></span><button class="btn small" data-on="sair" data-k="sairConta">Sair</button></div></section>`;
  const arena=$('.a-arena',home),dir=$('.hc-r',home);
  if(arena)arena.insertAdjacentHTML('afterend',duelo);
  if(dir)dir.insertAdjacentHTML('beforeend',conta);else home.insertAdjacentHTML('beforeend',conta);
  hydrateGfx(home);pintarNuvem();
}
async function atualizarUsuario(){try{const r=await apiNet('GET','/conta/eu');NET.usuario=r.usuario;lsS(LSO.usuario,JSON.stringify(r.usuario));}catch(e){}}
async function abrirRanking(){
  const ov=abrirFolha('<p class="muted">Carregando…</p>',{titulo:'Ranking dos duelos'});
  try{
    const r=await apiNet('GET','/ranking');
    const linhas=r.ranking.map((x,i)=>`<tr class="${x.apelido===NET.usuario.apelido?'eu':''}"><td class="n">${i+1}</td><td>${escH(x.apelido)}</td><td class="n">${fmt(x.gloria)}</td><td class="n">${x.vitorias}/${x.derrotas}/${x.empates}</td></tr>`).join('');
    $('.sbody',ov).innerHTML=r.ranking.length?`<table class="rk"><thead><tr><th class="n">#</th><th>Apelido</th><th class="n">Glória</th><th class="n">V/D/E</th></tr></thead><tbody>${linhas}</tbody></table><p class="muted" style="font-size:12px;margin-top:8px">Duelos com amigo (sala com número) não mudam a Glória.</p>`:'<p class="muted">Ninguém duelou ainda. Seja a primeira pessoa!</p>';
  }catch(x){$('.sbody',ov).innerHTML=`<p class="warn">${escH(x.message)}</p>`;}
}

/* ---------- Feira dos jogadores ---------- */
UI.fj={modo:'jog',aba:'comprar',rar:null,q:''};
const fjFaixa=id=>{const R=MERC[CARD[id].rar];return {min:Math.max(2,Math.floor(R.base*0.3)),max:R.base*5};};
const fjTaxa=p=>Math.max(1,Math.round(p*0.10));
const _renderMercado=renderMercado;
renderMercado=function(m){
  const seg=`<div class="subtabs" role="group" aria-label="Quem vende"><button data-on="fjModo" data-v="jog" aria-pressed="${UI.fj.modo==='jog'}" data-k="fj-jog">Jogadores</button><button data-on="fjModo" data-v="robos" aria-pressed="${UI.fj.modo==='robos'}" data-k="fj-robos">Feirantes (robôs)</button></div>`;
  if(UI.fj.modo==='robos'||!NET.usuario){_renderMercado(m);m.insertAdjacentHTML('afterbegin',seg);return;}
  const f=UI.fj;
  m.innerHTML=`${seg}<div class="mgrid"><div>
    <section class="panel mhead"><div class="ph" style="margin:0"><h2>${TEMA.lugares.mercado} dos jogadores</h2></div>
     <p class="muted" style="font-size:13px">Compre e venda cartas repetidas com outras pessoas. Moeda simulada, sem dinheiro real. Quem vende escolhe o preço; 10% de cada venda vai para a fogueira. O anúncio dura ${3} dias e, se ninguém comprar, a carta volta.</p>
     <div class="subtabs" role="group" aria-label="Feira"><button data-on="fjAba" data-v="comprar" aria-pressed="${f.aba==='comprar'}" data-k="fj-comprar">Comprar</button><button data-on="fjAba" data-v="vender" aria-pressed="${f.aba==='vender'}" data-k="fj-vender">Vender</button><button data-on="fjAba" data-v="minhas" aria-pressed="${f.aba==='minhas'}" data-k="fj-minhas">Meus anúncios</button></div>
     ${f.aba!=='minhas'?`<input class="search" type="search" id="fjBusca" placeholder="Buscar carta…" aria-label="Buscar carta" value="${escH(f.q)}">
     <div class="filters" style="margin:0">${RARS.map(r=>`<button class="fchip" data-on="fjRar" data-v="${r}" aria-pressed="${f.rar===r}" data-k="fj-${r}">${gemIc(r,12)}${RAR_NOME[r]}</button>`).join('')}</div>`:''}
    </section>
    <div class="mlist" id="fjLista"><p class="muted">Carregando…</p></div></div>
    <aside class="panel feed-p"><div class="ph"><h3>Feira nesta semana</h3></div><div class="feed" id="fjResumo"><div class="muted">…</div></div></aside></div>`;
  const b=$('#fjBusca');if(b)b.addEventListener('input',()=>{UI.fj.q=b.value;fjPintarLista();});
  fjCarregar();
};
async function fjCarregar(forcar){
  const F=NET.feira,f=UI.fj;
  try{
    if(f.aba==='comprar'&&(forcar||!F.lista||Date.now()-F.em>15000)){F.lista=(await apiNet('GET','/feira')).anuncios;F.em=Date.now();}
    if(f.aba==='minhas'&&(forcar||!F.minhas))F.minhas=(await apiNet('GET','/feira/minhas')).anuncios;
    if(!F.resumo||forcar)F.resumo=await apiNet('GET','/feira/resumo');
  }catch(x){const L=$('#fjLista');if(L)L.innerHTML=`<p class="warn">${escH(x.status===0?'Sem conexão com o servidor. Tente de novo daqui a pouco.':x.message)}</p>`;return;}
  fjPintarLista();
}
function fjPintarLista(){
  const L=$('#fjLista');if(!L||UI.tab!=='mercado')return;
  const f=UI.fj,F=NET.feira,q=f.q.trim().toLowerCase();
  const passa=id=>{const c=CARD[id];return c&&(!f.rar||c.rar===f.rar)&&(!q||c.nome.toLowerCase().includes(q));};
  if(f.aba==='comprar'){
    const lista=(F.lista||[]).filter(a=>passa(a.carta));
    L.innerHTML=lista.map(a=>{const c=CARD[a.carta],own=s.cards[a.carta];
      const bt=a.minha?`<button class="btn" disabled>É sua</button>`:`<button class="btn gold" data-on="fjComprar" data-id="${a.id}" data-k="fjc-${a.id}" ${s.grao>=a.preco?'':'disabled'} aria-label="Comprar ${escH(c.nome)} de ${escH(a.apelido)} por ${a.preco} ${MOE}">Comprar<span class="num">${fmt(a.preco)}</span></button>`;
      return `<div class="mrow fjrow">${artCanvas(a.carta)}<div class="mi"><b>${gemIc(c.rar,11)}<span>${escH(c.nome)}</span></b><span class="pr">${ic('coin',14)}<span class="num">${fmt(a.preco)}</span></span>
        <span class="muted">de <b>${escH(a.apelido)}</b>${own?` · você: Nv${own.lvl}${own.copias?' +'+own.copias:''}`:' · <b class="up">nova para você</b>'}</span></div><div class="bt">${bt}</div></div>`;}).join('')
      ||`<p class="muted">${F.lista&&F.lista.length?'Nenhuma carta com esse filtro.':'Ninguém anunciou ainda. Que tal ser a primeira pessoa? Vá em Vender.'}</p>`;
  }else if(f.aba==='vender'){
    const lista=COLECAO.filter(c=>s.cards[c.id]&&s.cards[c.id].copias>0&&passa(c.id));
    L.innerHTML=lista.map(c=>{const n=s.cards[c.id].copias,fx=fjFaixa(c.id);
      return `<div class="mrow fjrow">${artCanvas(c.id)}<div class="mi"><b>${gemIc(c.rar,11)}<span>${escH(c.nome)}</span></b><span class="muted">Você tem <b class="num">+${n}</b> ${n>1?'repetidas':'repetida'}</span>
        <span class="muted" style="font-size:12px">Preço: de <span class="num">${fmt(fx.min)}</span> a <span class="num">${fmt(fx.max)}</span> · feirantes cobram <span class="num">${fmt(preco(c.id))}</span></span></div>
        <div class="bt"><button class="btn gold" data-on="fjAnunciar" data-id="${c.id}" data-k="fja-${c.id}">Anunciar</button></div></div>`;}).join('')
      ||'<p class="muted">Você não tem cartas repetidas'+(q||f.rar?' com esse filtro':'')+'. Elas aparecem quando você ganha a mesma carta de novo em pacotes e tesouros.</p>';
  }else{
    const lista=F.minhas||[];
    const est=a=>a.estado==='aberto'?`<span class="fj-est aberto">à venda · vence em ${fjTempoAte(a.expira_em)}</span>`:a.estado==='vendido'?`<span class="fj-est vendido">vendida para ${escH(a.comprador||'alguém')}</span>`:a.estado==='expirado'?'<span class="fj-est">venceu: voltou para você</span>':'<span class="fj-est">cancelada</span>';
    L.innerHTML=lista.map(a=>{const c=CARD[a.carta];
      return `<div class="mrow fjrow">${artCanvas(a.carta)}<div class="mi"><b>${gemIc(c.rar,11)}<span>${escH(c.nome)}</span></b><span class="pr">${ic('coin',14)}<span class="num">${fmt(a.preco)}</span>${a.estado==='vendido'?`<small class="up">você recebeu ${fmt(a.preco-a.taxa)}</small>`:''}</span>${est(a)}</div>
        <div class="bt">${a.estado==='aberto'?`<button class="btn" data-on="fjCancelar" data-id="${a.id}" data-k="fjx-${a.id}">Cancelar</button>`:''}</div></div>`;}).join('')
      ||'<p class="muted">Você ainda não anunciou nada. Vá em Vender.</p>';
  }
  const R=$('#fjResumo'),r=F.resumo;
  if(R&&r)R.innerHTML=`<div>Vendas nos últimos 7 dias: <b class="num">${fmt(r.vendas)}</b></div><div>${MOEC} que trocaram de mão: <b class="num">${fmt(r.volume)}</b></div><div>Queimados na fogueira (taxa de 10%): <b class="num">${fmt(r.queimado)}</b></div><div>Cartas à venda agora: <b class="num">${fmt(r.anuncios)}</b></div>`;
  hydrateGfx(L);
}
function fjTempoAte(iso){const ms=new Date(iso)-Date.now();if(ms<=0)return 'já';const h=Math.floor(ms/3600e3);return h>=24?Math.ceil(h/24)+' dia'+(Math.ceil(h/24)>1?'s':''):h>=1?h+' h':Math.max(1,Math.round(ms/60e3))+' min';}
async function fjComprar(id){
  const a=(NET.feira.lista||[]).find(x=>x.id===id);if(!a)return;
  const c=CARD[a.carta];
  const ok=await perguntar(`Comprar <b>${escH(c.nome)}</b> de <b>${escH(a.apelido)}</b> por <b>${fmt(a.preco)} ${MOE}</b>?`,'Comprar',{titulo:'Comprar na Feira'});
  if(!ok)return;
  try{
    const r=await opServidor('/feira/comprar',{id});
    sfx('coin');toast(`Você comprou <b>${escH(c.nome)}</b> de ${escH(r.compra.vendedor)}!`);
    missaoEv('negocio',1);save();
  }catch(x){toast(escH(x.message));}
  NET.feira.lista=null;refresh();
}
function fjAnunciar(id){
  const c=CARD[id],fx=fjFaixa(id);
  let p=clamp(preco(id),fx.min,fx.max);
  const corpo=()=>`<div class="fj-preco">${cardHTML(id,{sz:'thumb',lvl:s.cards[id].lvl})}
    <p>Por quanto você quer vender 1 <b>${escH(c.nome)}</b>?</p>
    <div class="stepper"><button class="ibtn" data-p="-10" aria-label="Menos 10">−</button><input class="search num" type="number" inputmode="numeric" min="${fx.min}" max="${fx.max}" value="${p}" aria-label="Preço em ${MOE}"><button class="ibtn" data-p="10" aria-label="Mais 10">+</button></div>
    <p class="muted" style="font-size:13px" data-rec></p>
    <p class="muted" style="font-size:12px">De ${fmt(fx.min)} a ${fmt(fx.max)} ${MOE}. Os feirantes cobram ${fmt(preco(id))} por ela agora.</p>
    <div class="acts" style="width:100%"><button class="btn gold md wide" data-ok>Anunciar</button></div></div>`;
  const ov=abrirFolha(corpo(),{titulo:'Anunciar na Feira',focus:'input'});
  const inp=$('input',ov),rec=$('[data-rec]',ov);
  const pinta=()=>{p=clamp(Math.round(+inp.value||fx.min),fx.min,fx.max);rec.innerHTML=`Se vender, você recebe <b class="num">${fmt(p-fjTaxa(p))}</b> ${MOE} (taxa de <span class="num">${fjTaxa(p)}</span> vai para a fogueira).`;};
  inp.addEventListener('input',pinta);inp.addEventListener('change',()=>{pinta();inp.value=p;});
  $$('[data-p]',ov).forEach(b=>b.onclick=()=>{inp.value=clamp(p+(+b.dataset.p),fx.min,fx.max);pinta();});
  pinta();
  $('[data-ok]',ov).onclick=async()=>{
    pinta();const bt=$('[data-ok]',ov);bt.disabled=true;
    try{await opServidor('/feira/anunciar',{carta:id,preco:p});fecharOv(ov,true);sfx('coin');toast(`<b>${escH(c.nome)}</b> está na Feira por ${fmt(p)} ${MOE}.`);NET.feira.minhas=null;NET.feira.lista=null;refresh();}
    catch(x){bt.disabled=false;toast(escH(x.message));}
  };
}
async function fjCancelar(id){
  const ok=await perguntar('Tirar essa carta da Feira? Ela volta para a sua coleção.','Tirar da Feira',{titulo:'Cancelar anúncio'});
  if(!ok)return;
  try{const r=await opServidor('/feira/cancelar',{id});toast(`<b>${escH(CARD[r.cancelado.carta].nome)}</b> voltou para você.`);}
  catch(x){toast(escH(x.message));}
  NET.feira.minhas=null;NET.feira.lista=null;refresh();
}

/* ---------- toques nas peças online ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-on]');if(!b||b.disabled)return;
  const a=b.dataset.on,v=b.dataset.v;
  if(a==='fjModo'){sfx('aba');UI.fj.modo=v;refresh();}
  else if(a==='fjAba'){sfx('aba');UI.fj.aba=v;refresh();}
  else if(a==='fjRar'){sfx('tap');UI.fj.rar=UI.fj.rar===v?null:v;refresh();}
  else if(a==='fjComprar')fjComprar(+b.dataset.id);
  else if(a==='fjAnunciar')fjAnunciar(b.dataset.id);
  else if(a==='fjCancelar')fjCancelar(+b.dataset.id);
  else if(a==='procurar')pvpProcurar();
  else if(a==='amigo')pvpAmigo();
  else if(a==='ranking')abrirRanking();
  else if(a==='sair')sairDaConta();
});

/* ===================== DUELO AO VIVO ===================== */
function wsConectar(){
  if(!NET.token||(NET.ws&&NET.ws.readyState<2))return;
  let ws;
  try{ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws');}catch(e){return;}
  NET.ws=ws;
  ws.onopen=()=>{NET.wsTent=0;ws.send(JSON.stringify({t:'auth',token:NET.token}));};
  ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data);}catch(e){return;}pvpMensagem(m);};
  ws.onclose=()=>{
    if(NET.ws!==ws)return;NET.ws=null;
    if(NET.fila){NET.fila=null;pvpFecharBusca();if(!PVP)toast('A conexão caiu. Tente procurar de novo.');}
    if(PVP)toast('Conexão caiu. Voltando para o duelo…',{ms:3000});
    if(NET.token){NET.wsTent++;setTimeout(wsConectar,Math.min(15000,1000*NET.wsTent));}
  };
}
const wsManda=m=>{if(NET.ws&&NET.ws.readyState===1){NET.ws.send(JSON.stringify(m));return true;}toast('Sem conexão com o servidor. Tentando de novo…');wsConectar();return false;};
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&NET.token&&(!NET.ws||NET.ws.readyState>1))wsConectar();});

/* procurar rival / sala com amigo */
function pvpPodeComecar(){
  if(inBattle||PVP){toast('Termine a partida atual primeiro.');return false;}
  if(!deckOk()){toast('Seu deck precisa de 20 cartas.');return false;}
  return true;
}
function pvpProcurar(){
  if(!pvpPodeComecar())return;
  tranca(()=>nuvemEnviar()).catch(()=>{}).then(()=>{   // o servidor monta o deck a partir do save da nuvem
    if(!wsManda({t:'fila'}))return;
    NET.fila='fila';
    const ov=abrirFolha(`<div class="dl-busca"><div class="dl-roda" aria-hidden="true"></div><p><b>Procurando alguém para duelar…</b></p><p class="muted" style="font-size:13px">Pode levar um tempinho. Dica: chame alguém e use “Jogar com amigo”.</p><button class="btn md wide" data-cancelar>Cancelar</button></div>`,
      {titulo:'Duelo ao vivo',onClose:()=>pvpSairFila()});
    NET.filaOv=ov;
    $('[data-cancelar]',ov).onclick=()=>{fecharOv(ov);};
  });
}
function pvpAmigo(){
  if(!pvpPodeComecar())return;
  const ov=abrirFolha(`<div class="dl-busca"><p>Duele com quem você quiser. Uma pessoa cria a sala e passa o número; a outra entra com ele.</p>
    <button class="btn gold md wide" data-criar>Criar sala</button>
    <div style="display:grid;gap:8px;justify-items:center;width:100%"><label for="dlCod" class="muted" style="font-size:13px;font-weight:800">Ou entre com o número da sala</label><input id="dlCod" class="search num" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="0000"><button class="btn md wide" data-entrar>Entrar na sala</button></div>
    <p class="muted" style="font-size:12px">Duelo com amigo não mexe na Glória, mas vale o prêmio de ${MOE}.</p></div>`,{titulo:'Jogar com amigo',onClose:()=>pvpSairFila()});
  NET.filaOv=ov;
  const go=t=>tranca(()=>nuvemEnviar()).catch(()=>{}).then(()=>{if(wsManda(t))NET.fila='sala';});
  $('[data-criar]',ov).onclick=()=>go({t:'sala_criar'});
  $('[data-entrar]',ov).onclick=()=>{const c=$('#dlCod',ov).value.trim();if(!/^\d{4}$/.test(c)){toast('O número da sala tem 4 algarismos.');return;}go({t:'sala_entrar',codigo:c});};
  $('#dlCod',ov).addEventListener('keydown',e=>{if(e.key==='Enter')$('[data-entrar]',ov).click();});
}
function pvpSairFila(){if(NET.fila){NET.fila=null;wsManda({t:'sair_fila'});}NET.filaOv=null;}
function pvpFecharBusca(){const ov=NET.filaOv;NET.filaOv=null;if(ov)fecharOv(ov,true);}

function pvpMensagem(m){
  switch(m.t){
    case 'ola':
      if(NET.usuario){NET.usuario.gloria=m.gloria;}
      break;
    case 'erro':
      toast(escH(m.msg),{ms:4000});
      if(m.sair){NET.token=null;}
      if(NET.fila&&!PVP){NET.fila=null;}
      break;
    case 'fila':
      if(m.estado==='sala'&&NET.filaOv){
        $('.sbody',NET.filaOv).innerHTML=`<div class="dl-busca"><p>Passe este número para quem vai jogar com você:</p><div class="cod">${escH(m.codigo)}</div><div class="dl-roda" aria-hidden="true"></div><p class="muted" style="font-size:13px">Esperando a outra pessoa entrar…</p><button class="btn md wide" data-cancelar>Cancelar</button></div>`;
        $('[data-cancelar]',NET.filaOv).onclick=()=>fecharOv(NET.filaOv);
      }
      break;
    case 'inicio':pvpInicio(m);break;
    case 'passos':
      if(!PVP||m.id!==PVP.id)return;
      PVP.prazoAte=Date.now()+m.prazo;
      PVP.fila=PVP.fila.then(()=>pvpTocar(m.passos)).catch(e=>{console.error(e);pvpResync();});
      break;
    case 'recusado':
      if(!PVP)return;
      PVP.fila=PVP.fila.then(()=>{toast(escH(m.msg));B=pvpB(m.estado);BU.busy=B.turn!=='p';BU.jogando=false;bRender();});
      break;
    case 'fim':
      if(!PVP||m.id!==PVP.id)return;
      PVP.fila=PVP.fila.then(()=>pvpFim(m));
      break;
    case 'rival_saiu':if(PVP)toast(`<b>${escH(PVP.rival.apelido)}</b> caiu. Esperando voltar (até 1 min e meio)…`,{ms:6000});break;
    case 'rival_voltou':if(PVP)toast(`<b>${escH(PVP.rival.apelido)}</b> voltou!`);break;
    case 'emote':
      if(PVP&&inBattle&&typeof COSM!=='undefined'&&COSM[m.id]&&!s.cosm.emoteMudo){const q=$('#hR');if(q)rlFala(q.getBoundingClientRect(),COSM[m.id].nome,PVP.rival.apelido);}
      break;
  }
}
function pvpB(e){e.ev=[];if(!e.log)e.log=[];return e;}
function pvpInicio(m){
  pvpFecharBusca();NET.fila=null;
  RIVAIS.__pvp={nome:m.rival.apelido,curto:m.rival.apelido,retrato:retratoId('voce'),lanes:m.estado.sides.r.lanes.map(L=>L.terr)};
  ART_RIVAL.__pvp='de';TIER_NOME.pvp='Glória '+fmt(m.rival.gloria||0);
  if(PVP&&PVP.id===m.id&&inBattle){
    // voltou a conexão: a tela já está aberta, só acerta o estado
    PVP.prazoAte=Date.now()+m.prazo;
    PVP.fila=PVP.fila.then(()=>{B=pvpB(m.estado);BU.busy=B.turn!=='p';BU.jogando=false;bRender();});
    return;
  }
  if(inBattle)fecharBatalha();
  while(OVS.length)fecharOv(OVS[OVS.length-1].el,true);
  vovoFechar();
  PVP={id:m.id,rival:m.rival,amistoso:m.amistoso,prazoAte:Date.now()+m.prazo,fila:Promise.resolve(),src:null};
  B=pvpB(m.estado);
  BU.ultimo=null;BU.famPend={};BU.regraT=0;
  abrirBatalha();
  BU.busy=B.turn!=='p';bRender();
  sfx(m.primeiro?'seuTurno':'turnoRival');
  fxBanner(m.primeiro?'Sua vez!':'Vez de '+m.rival.apelido,m.primeiro?'turno':'rival',{sub:'Duelo ao vivo contra '+m.rival.apelido});
  pvpRelogio();
  if(m.primeiro)focarMao();
}
// algo saiu do roteiro: pede o estado de novo (o servidor manda "inicio" outra vez)
function pvpResync(){if(PVP)wsManda({t:'fila'});}

/* relógio do turno */
let pvpRelT=0;
function pvpRelogio(){
  clearInterval(pvpRelT);
  pvpRelT=setInterval(()=>{
    let el=$('#pvpRel');
    if(!PVP||!inBattle||!B){if(el)el.remove();clearInterval(pvpRelT);return;}
    if(!el){el=document.createElement('div');el.id='pvpRel';el.className='pvp-rel';el.setAttribute('role','timer');document.body.appendChild(el);}
    if(B.over){el.hidden=true;return;}
    const seg=Math.max(0,Math.ceil((PVP.prazoAte-Date.now())/1000));
    el.hidden=false;
    el.classList.toggle('pouco',seg<=15&&B.turn==='p');
    el.textContent=(B.turn==='p'?'Sua vez':'Vez de '+PVP.rival.apelido)+' · '+mmss(seg);
  },250);
}

const _descModoTema=descModoTema;
descModoTema=function(B){return B&&B.modo==='pvp'?'Duelo ao vivo':_descModoTema(B);};

/* as jogadas do jogador viram mensagens para o servidor */
const _jogarDoJogador=jogarDoJogador,_aoAtacar=aoAtacar,_desistir=desistir,_soltarEmote=typeof soltarEmote==='function'?soltarEmote:null;
jogarDoJogador=async function(uid,lane){
  if(!PVP)return _jogarDoJogador(uid,lane);
  const inst=B.sides.p.hand.find(h=>h.uid===uid);if(!inst)return;
  const hc=$(`#bHand .hc[data-uid="${uid}"]`);PVP.src=hc?hc.getBoundingClientRect():null;
  const c=CARD[inst.id];
  if(motivoBloqueio(B,'p',inst))return;
  BU.busy=true;BU.jogando=true;BU.sel=null;bRender();
  if(!wsManda({t:'jogar',uid,lane:c.tipo==='feitico'&&!c.alvo?-1:lane})){BU.busy=false;BU.jogando=false;bRender();}
};
aoAtacar=async function(){
  if(!PVP)return _aoAtacar();
  if(naFila(aoAtacar))return;
  if(!B||BU.busy||B.turn!=='p'||B.over)return;
  BU.fila=[];BU.busy=true;BU.sel=null;bRender();sfx('tap');
  if(!wsManda({t:'atacar'})){BU.busy=false;bRender();}
};
desistir=async function(){
  if(!PVP)return _desistir();
  if(!B||B.over)return;
  const ok=await perguntar(`Desistir conta como derrota e dá a vitória para ${escH(PVP.rival.apelido)}. Sair mesmo?`,'Desistir',{perigo:true,titulo:'Desistir do duelo?'});
  if(ok&&PVP)wsManda({t:'desistir'});
};
if(_soltarEmote)soltarEmote=function(id,box){
  if(!PVP)return _soltarEmote(id,box);
  const x=COSM[id];if(!x)return;const r=box&&box._ancora||{left:40,top:300,width:40};if(box)box.remove();
  rlEmoT=Date.now()+8000;sfxR('emote','tap');rlFala(r,x.nome);
  wsManda({t:'emote',id});
};

/* toca os passos que o servidor mandou, com as mesmas animações da batalha contra o computador */
async function pvpTocar(passos){
  for(const p of passos){
    if(!PVP||!inBattle)return;
    const aplicar=()=>{const e=pvpB(p.estado);e.ev=p.ev||[];B=e;};
    switch(p.k){
      case 'play':{
        let src=null;
        if(p.P==='r')src=await mostrarCartaRival({id:p.id,lvl:p.lvl});
        else{src=PVP.src;PVP.src=null;}
        aplicar();await tocarEventos({src});
        break;}
      case 'varrer':await sleep(RM?150:200);aplicar();await tocarEventos();break;
      case 'atk':{
        const t0=performance.now(),estilo=fxEstiloDe(p.id);
        const alvo=p.alvo<0?'heroi':{side:opp(p.P),lane:p.alvo};
        let duelo=0;
        if(p.alvo===p.lane&&!p.guarda){const d=B.sides[opp(p.P)].lanes[p.lane].c;
          if(d){const r=BU.duelo&&BU.duelo[p.lane];duelo=r&&r.a===d.uid&&r.d===p.uid?r.n+1:1;if(BU.duelo)BU.duelo[p.lane]={a:p.uid,d:d.uid,n:duelo};}}
        const volta=p.guarda?await fxGuardaPula(opp(p.P),p.lane,p.alvo):null;
        if(RM)sfx('ataque');
        await fxAtaque(p.P,p.lane,alvo,estilo,{forte:p.forte,duelo});
        aplicar();await tocarEventos({estilo});
        if(volta)await volta();
        const dt=performance.now()-t0,alvoMs=vel(RM?450:640);if(dt<alvoMs)await sleep(alvoMs-dt);
        const falta=(FX.atkAte||0)-performance.now();if(falta>0)await sleep(Math.min(700,falta));
        break;}
      case 'lua':aplicar();await tocarEventos();break;
      case 'tempo':toast(p.P==='p'?'Seu tempo acabou: suas criaturas atacaram sozinhas.':`O tempo de <b>${escH(PVP.rival.apelido)}</b> acabou.`,{ms:3500});break;
      case 'turno':{
        aplicar();bRender();
        if(p.P==='p'){
          sfx('seuTurno');
          if(B.round===10){fxBanner('Última rodada!','ultima');sfx('banner','ultima');musIntensa(2);}
          else if(B.round===RODADA_FURIA){fxBanner(TEMA.meiaNoite.banner,'colheita',{sub:TEMA.meiaNoite.sub});sfx('banner','colheita');musIntensa(1);}
          else if(B.round===RODADA_COMPRA2){fxBanner('Sua vez!','turno',{sub:'Agora: 2 cartas por turno!',ms:2200});sfx('banner','compra2');}
          else fxBanner('Sua vez!','turno');
        }else{sfx('turnoRival');fxBanner('Vez de '+PVP.rival.apelido,'rival');}
        await tocarEventos();
        break;}
      case 'fim':aplicar();bRender();break;
    }
  }
  if(!PVP||!B)return;
  BU.jogando=false;
  if(B.over){BU.busy=true;bRender();return;}
  BU.busy=B.turn!=='p';bRender();
  if(!BU.busy){focarMao();if(BU.fila.length)setTimeout(drenarFila,0);}
  else BU.fila=[];
}

async function pvpFim(m){
  if(!PVP)return;
  const P0=PVP;
  BU.busy=true;BU.sel=null;
  const res=m.resultado;
  if(B&&B.result!==res){B.result=res;B.over=true;}
  bRender();
  if(res==='vitoria'&&m.motivo!=='desistencia'&&m.motivo!=='abandono'){fxVitoria();fxBanner('Vitória!','vitoria');await sleep(vel(1300));}
  else await sleep(vel(600));
  musica(null);
  sfx(res==='vitoria'?'victory':res==='derrota'?'defeat':'empate');
  const ap=escH(P0.rival.apelido);
  const motivo=m.motivo==='desistencia'?(res==='vitoria'?ap+' desistiu.':'Você desistiu.'):m.motivo==='abandono'?(res==='vitoria'?ap+' saiu da partida.':'Você ficou fora tempo demais.'):m.motivo==='rodadas'?'Fim das 10 rodadas: venceu quem tinha mais vida.':'contra '+ap;
  const g=m.gloria,dg=g?g.depois-g.antes:0;
  const el=document.createElement('div');el.className='result res-pvp';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Resultado do duelo');
  el.innerHTML=`<div class="panel rbox"><div class="rmodo">${ic('torneio',16)} Duelo ao vivo${m.amistoso?' · com amigo':''}</div>${tituloRes(res)}
    <div class="rp">${artCanvas(retratoId('voce'))}</div><div class="muted">${motivo}</div>
    ${g&&!m.amistoso?`<div class="rgl">${ic('trofeu',20)} Glória <span class="num">${fmt(g.antes)}</span> → <span class="num">${fmt(g.depois)}</span> ${dg?`<span class="num ${dg>0?'up':'down'}">${dg>0?'+':''}${dg}</span>`:''}</div>`:''}
    ${m.premio?`<div class="rl">${ic('coin',20)} <span class="num">+${fmt(m.premio)}</span> ${MOEC} (chegam em instantes)</div>`:res==='vitoria'&&!m.premio?'<div class="rnote">Prêmio de '+MOE+' dos duelos de hoje já foi pago (5 por dia), ou o rival desistiu logo no começo.</div>':''}
    <div class="racts"><button class="btn gold big" data-again>Duelar de novo</button><button class="btn md" data-cont>Voltar</button></div></div>`;
  document.body.appendChild(el);hydrateGfx(el);
  setTimeout(()=>{try{$('[data-again]',el).focus();}catch(e){}},60);
  const sair=depois=>{el.remove();PVP=null;clearInterval(pvpRelT);const r=$('#pvpRel');if(r)r.remove();fecharBatalha();UI.tab='inicio';refresh();atualizarUsuario().then(()=>{if(!inBattle)refresh();});setTimeout(()=>checarCaixa(true),1500);if(depois)depois();};
  $('[data-cont]',el).onclick=()=>sair();
  $('[data-again]',el).onclick=()=>sair(m.amistoso?pvpAmigo:pvpProcurar);
}
