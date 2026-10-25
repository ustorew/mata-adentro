/* ===================== v12: BATALHA DAS TRILHAS — motor em tempo real (sem tela) =====================
 Três trilhas (esquerda, meio, direita), uma torre por trilha de cada lado e a Casa no fundo.
 A energia enche sozinha; a carta jogada numa trilha vira lenda que anda e briga sozinha.
 Ganha quem derrubar a Casa rival, ou quem tiver derrubado mais torres quando o tempo acabar.
 Só usa CARD, LVL_BONUS e RIVAIS (10-data): nada de DOM nem THREE, para o servidor poder rodar igual depois.

 Campo: x em [-6.5, 6.5] (trilhas em TRI.LX), y em [0, 32]. Você ('p') embaixo (y baixo), o rival ('r') em cima.
 API:
   TRI.nova({p:{deck:[{id,lvl}], terr:[3], nome}, r:{...}, seed, ia:{r:'facil'|'medio'|'dificil'}}) -> T
   TRI.passo(T, dt)                avança o mundo (dt em segundos; quebra em passos de 1/30 s)
   TRI.jogar(T, P, i, x, y)        joga a carta i da mão de P no ponto (x,y) -> {ok, motivo?}
   TRI.podeAqui(T, P, i, x, y)     mesma checagem sem jogar
   TRI.zona(T, P, lane)            [yMin, yMax] onde P pode soltar criaturas nessa trilha
   TRI.lane(x)                     trilha mais perto de x
   T.ev                            eventos para a tela (a tela esvazia): entra, golpe, tiro, dano, cura, morre, torre, feitico, buff, fim, aviso
   T.over, T.vencedor ('p'|'r'|'empate'), T.coroas {p,r}, T.t (s), T.en {p,r}, T.mao {p:[...]}, T.fila {p:[...]}
*/
const TRI=(function(){
  const LX=[-4.2,0,4.2],RIO=16,DUR=180,PRORROGA=60,EN_MAX=10,EN_REGEN=2.8,MAX_UN=16;
  const TORRE={hp:1100,dmg:58,cd:0.9,alc:6.6},CASA={hp:2200,dmg:85,cd:1.0,alc:7.2},EM_OBRA=1.5; // lendas batem mais forte em torres
  const DIST=['raio','respingo','estouro','ferrao'];
  const TIA={facil:{reacao:1.6,guarda:8,erro:0.35},medio:{reacao:1.0,guarda:7,erro:0.15},dificil:{reacao:0.6,guarda:6,erro:0.04}};
  const dirDe=P=>P==='p'?1:-1,outro=P=>P==='p'?'r':'p';
  const lane=x=>{let b=0,d=1e9;for(let i=0;i<3;i++){const k=Math.abs(x-LX[i]);if(k<d){d=k;b=i;}}return b;};
  function rng(seed){let a=seed>>>0;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

  /* ---------- cartas -> números em tempo real ---------- */
  function base(id,lvl){const c=CARD[id],b=LVL_BONUS[clamp((lvl||1)-1,0,4)];return {atk:(c.atk||0)+b[0],hp:(c.hp||0)+b[1]};}
  const nDe=(id,lvl)=>{const c=CARD[id];return c.n?c.n[clamp((lvl||1)-1,0,c.n.length-1)]:1;};
  function golpe(id){const c=CARD[id];return c.golpe||(typeof GOLPE_V1!=='undefined'&&GOLPE_V1[id])||'pisao';}
  function ficha(id,lvl){ // números de uma criatura (ou ficha) recém-criada
    const c=CARD[id],b=base(id,lvl),kw=Object.assign({},c.kw||{});
    const dist=DIST.includes(golpe(id));
    return {hp:90+b.hp*95,dmg:22+b.atk*30,cd:kw.furia?0.85:1.2,alc:dist?4.4:1.0,dist,
      vel:kw.voar?1.9:(b.hp>=6||c.custo>=6)?1.1:1.5,ar:!!kw.voar,kw,raio:c.custo>=6?0.62:c.custo>=4?0.5:0.4,
      entra:kw.furia?0.3:1.0};
  }
  /* texto curto da carta no modo Trilhas (o texto de turno não vale aqui) */
  function texto(id,lvl){
    const c=CARD[id];if(!c)return '';const L=[];
    if(c.tipo==='criatura'){const f=ficha(id,lvl);
      L.push((f.dist?'Ataca de longe':'Corpo a corpo')+(f.ar?' · Voa':'')+(c.kw&&c.kw.furia?' · Rápida':''));
      const k=c.kw||{};
      if(k.bloqueiaVoo)L.push('Acerta quem voa com força dobrada.');
      if(k.brotar)L.push('Cresce com o tempo.');if(k.espinhos)L.push('Espinhos: quem bate de perto se fere.');
      if(k.pisotear)L.push('Pisoteia: acerta quem está em volta.');if(k.ataqueDuplo)L.push('Ataca duas vezes.');
      if(k.guarda)L.push('Guarda: chama os golpes para si.');if(k.couraca)L.push('Couraça: sente menos cada golpe.');
      for(const x of c.fx||[]){const t=TXT_FX[x.op];if(t)L.push(t(x,id,lvl));}
    }else if(c.tipo==='feitico'){const t=TXT_FEIT[(c.fx[0]||{}).op];L.push(t?t(nDe(id,lvl)):'Magia.');}
    else{const t=TXT_OBRA[(c.fx[0]||{}).op];L.push('Fica parada na trilha por 40 s.');if(t)L.push(t);}
    return L.join(' ');
  }
  const TXT_FX={
    danoTodasRivais:x=>`Ao entrar: fere todos os rivais da trilha.`,buffOutrasTemp:()=>'Ao entrar: as aliadas da trilha batem mais forte por 6 s.',
    criaFicha:x=>`Ao entrar: chama ${x.n||1} ${CARD[x.ficha]?CARD[x.ficha].nome:'ajudante'}.`,acordaOutras:()=>'Ao entrar: as aliadas da trilha correm mais por 5 s.',
    danoMaiorAtk:()=>'Ao entrar: fere o rival mais forte da trilha.',curaHeroi:()=>'Cura a sua torre desta trilha.',curaTotalAliadas:()=>'Ao entrar: cura todas as aliadas da trilha.',
    buffVizinhas:()=>'Ao entrar: fortalece as aliadas da trilha.',buffOutras:()=>'Ao entrar: fortalece as aliadas da trilha.',buffSeFamiliaVizinha:()=>'Ao entrar: fica mais forte se tiver família na trilha.',
    buffFamiliaTemp:()=>'Ao entrar: a família dela na trilha bate mais forte.',danoFrente:()=>'Ao entrar: fere o rival da frente.',espinhosOutras:()=>'Ao entrar: as aliadas ganham Espinhos.',
    destroiFrente:()=>'Ao entrar: derruba o rival da frente (se estiver fraco).',perdeAtkFrente:()=>'Ao entrar: o rival da frente bate mais fraco.',kwVizinhas:()=>'Ao entrar: as aliadas ganham Couraça.',
    enraizaFrente:()=>'Ao entrar: prende o rival da frente por 3 s.',compra:()=>'Ao entrar: +1 de energia.',danoHeroiRival:()=>'Ao morrer: explode e fere quem está perto (até torres).',
    curaAliadas:()=>'A cada 6 s: cura as aliadas da trilha.',brotarAura:()=>'As aliadas da trilha crescem com o tempo.',brotarVizinhas:()=>'As aliadas da trilha crescem com o tempo.',
    cresce:()=>'Cada rival que derruba deixa ela maior.',festaEntrada:()=>'Quem entra na trilha dela chega mais forte.',sequenciaMenos:()=>'As aliadas da trilha andam mais rápido.'};
  const TXT_FEIT={danoCriatura:n=>`Fere os rivais na área (${n*90}).`,buffTimeTemp:n=>'Suas lendas na área batem mais forte e correm por 7 s.',buffAliadaTemp:n=>'Suas lendas na área batem mais forte e correm por 7 s.',
    buffAliada:n=>'Cura e fortalece suas lendas na área.',danoEnraiza:n=>'Fere e prende os rivais na área por 3 s.',perdeAtk:n=>'Os rivais na área batem mais fraco por 8 s.',
    destroiSeVidaAte:n=>`Derruba os rivais fracos na área (até ${n*110} de vida).`,vidaMaisCuraTotal:n=>'Cura por completo suas lendas na área.',vidaTimeCura:n=>'Cura todas as suas lendas e torres.'};
  const TXT_OBRA={inicioNinhada:'A cada 7 s nasce um Filhote.',inicioBuffLane:'As aliadas da trilha batem mais forte.',reduzDanoLane:'As aliadas da trilha sentem menos os golpes.',
    inicioEnergia:'+1 de energia a cada 6 s.',inicioTrator:'A cada 8 s solta uma carga que atropela os rivais da trilha.'};

  /* ---------- criação ---------- */
  function nova(o){
    const T={t:0,over:false,vencedor:null,porTempo:false,prorroga:false,seq:1,ents:[],tiros:[],ev:[],acc:0,
      en:{p:5,r:5},mao:{p:[],r:[]},fila:{p:[],r:[]},terr:{p:o.p.terr.slice(0,3),r:o.r.terr.slice(0,3)},nome:{p:o.p.nome||'Você',r:o.r.nome||'Rival'},
      coroas:{p:0,r:0},ia:{},rnd:rng(o.seed||Date.now()),stats:{p:{cartas:0,abates:0,feiticos:0,dano:0},r:{cartas:0,abates:0,feiticos:0,dano:0}}};
    for(const P of ['p','r']){
      const d=o[P].deck.slice();for(let i=d.length-1;i>0;i--){const j=Math.floor(T.rnd()*(i+1));[d[i],d[j]]=[d[j],d[i]];}
      T.mao[P]=d.splice(0,4);T.fila[P]=d;
      const yT=P==='p'?7:25,yC=P==='p'?2.4:29.6;
      for(let i=0;i<3;i++)T.ents.push(estrutura(T,P,'torre',i,LX[i],yT));
      T.ents.push(estrutura(T,P,'casa',-1,0,yC));
    }
    for(const P in (o.ia||{}))T.ia[P]={tier:TIA[o.ia[P]]?o.ia[P]:'medio',prox:2+T.rnd()*2,reage:null,modo:'junta'};
    return T;
  }
  function estrutura(T,P,kind,ln,x,y){
    const D=kind==='casa'?CASA:TORRE;
    return {uid:T.seq++,P,kind,lane:ln,x,y,hp:D.hp,maxHp:D.hp,dmg:D.dmg,cd0:D.cd,cd:0,alc:D.alc,raio:kind==='casa'?1.5:1.1,ar:false,dist:true,vivo:true,ativa:kind!=='casa',kw:{},buffs:[]};
  }
  function criarUnidade(T,P,id,lvl,ln,x,y,o){
    o=o||{};if(T.ents.filter(e=>e.P===P&&e.kind==='un'&&e.vivo).length>=MAX_UN&&o.ficha)return null;
    const c=CARD[id],f=ficha(id,lvl);let hp=f.hp,dmg=f.dmg;
    const naTerra=!o.ficha&&T.terr[P][ln]===c.terreno;if(naTerra){hp*=1.2;dmg*=1.2;}
    const u={uid:T.seq++,P,kind:'un',id,lvl,lane:ln,x,y,hp:Math.round(hp),maxHp:Math.round(hp),dmg:Math.round(dmg),cd0:f.cd,cd:0.4,alc:f.alc,dist:f.dist,vel:f.vel,ar:f.ar,
      kw:Object.assign({},f.kw),raio:f.raio,vivo:true,entra:o.ficha?0.35:f.entra,naTerra,buffs:[],alvo:null,golpeEm:-1,cresce:0,tBrota:0,tInicio:0,ficha:!!o.ficha,atordoa:0,fam:c.familia||null};
    T.ents.push(u);
    T.ev.push({t:'entra',uid:u.uid,P,id,lane:ln,x,y,rar:c.rar,naTerra,ficha:!!o.ficha});
    return u;
  }
  function criarObra(T,P,id,lvl,ln,x,y){
    const c=CARD[id],hp=600+c.custo*110;
    const o={uid:T.seq++,P,kind:'obra',id,lvl,lane:ln,x,y,hp,maxHp:hp,dmg:0,cd0:99,cd:99,alc:0,raio:0.7,ar:false,vivo:true,kw:{},buffs:[],vida:40,tFx:2,op:(c.fx[0]||{}).op,entra:0.6,fam:null};
    T.ents.push(o);T.ev.push({t:'entra',uid:o.uid,P,id,lane:ln,x,y,rar:c.rar,obra:true});return o;
  }

  /* ---------- buffs (temporários: {k:'dmg'|'vel'|'fraco'|'pele', v, ate}) ---------- */
  const buffV=(e,k)=>{let v=0;for(const b of e.buffs)if(b.k===k)v+=b.v;return v;};
  function dmgDe(T,e){
    let m=1+buffV(e,'dmg')-buffV(e,'fraco')+e.cresce*0.12;
    if(e.kind==='un'){
      for(const o of T.ents)if(o.vivo&&o.P===e.P&&o.lane===e.lane&&o!==e){if(o.kind==='obra'&&o.op==='inicioBuffLane')m+=0.25;}
      if(e.fam){let n=0;for(const o of T.ents)if(o.vivo&&o.kind==='un'&&o.P===e.P&&o.lane===e.lane&&o.fam===e.fam)n++;if(n>=2)m+=0.1;}
    }
    return Math.max(4,e.dmg*Math.max(0.25,m));
  }
  const velDe=e=>e.vel*(1+buffV(e,'vel'))*(e.atordoa>0?0:1);
  function buffLane(T,P,ln,k,v,dur,excl){for(const e of T.ents)if(e.vivo&&e.kind==='un'&&e.P===P&&e.lane===ln&&e!==excl){e.buffs.push({k,v,ate:T.t+dur});T.ev.push({t:'buff',uid:e.uid,k});}}

  /* ---------- dano / cura / morte ---------- */
  function dano(T,alvo,n,fonte,o){
    if(!alvo.vivo||n<=0)return 0;o=o||{};
    if(alvo.kw.couraca)n=Math.max(5,n-alvo.kw.couraca*12);
    if(alvo.kind==='un'){for(const e of T.ents)if(e.vivo&&e.kind==='obra'&&e.op==='reduzDanoLane'&&e.P===alvo.P&&e.lane===alvo.lane){n*=0.75;break;}}
    if((alvo.kind==='torre'||alvo.kind==='casa')&&fonte&&fonte.kind==='un')n*=EM_OBRA;
    n=Math.round(n);alvo.hp-=n;
    if(alvo.kind!=='un'&&alvo.kind!=='obra'&&!alvo.ativa){ativarCasa(T,alvo.P);}
    if(alvo.kind==='casa')alvo.ativa=true;
    if(fonte&&fonte.P)T.stats[fonte.P].dano+=n;
    T.ev.push({t:'dano',uid:alvo.uid,n,P:alvo.P,x:alvo.x,y:alvo.y,forte:!!o.forte});
    // espinhos: quem bate de perto se fere
    if(fonte&&fonte.vivo&&!o.longe&&!o.semEspinho&&alvo.kw.espinhos&&fonte.kind==='un')dano(T,fonte,alvo.kw.espinhos*18,alvo,{semEspinho:true});
    if(alvo.hp<=0)morrer(T,alvo,fonte);
    return n;
  }
  function curar(T,e,n){if(!e.vivo)return;const a=Math.min(n,e.maxHp-e.hp);if(a>0){e.hp+=a;T.ev.push({t:'cura',uid:e.uid,n:Math.round(a),x:e.x,y:e.y});}}
  function ativarCasa(T,P){const c=T.ents.find(e=>e.kind==='casa'&&e.P===P);if(c&&!c.ativa){c.ativa=true;T.ev.push({t:'aviso',P,txt:'casa'});}}
  function morrer(T,e,fonte){
    if(!e.vivo)return;e.vivo=false;e.hp=0;
    if(e.kind==='torre'||e.kind==='casa'){
      const Q=outro(e.P);T.coroas[Q]+=e.kind==='casa'?3:1;if(e.kind==='casa')T.coroas[Q]=3;
      T.ev.push({t:'torre',uid:e.uid,P:e.P,kind:e.kind,lane:e.lane,x:e.x,y:e.y});
      ativarCasa(T,e.P);
      if(e.kind==='casa')fim(T,Q);
      return;
    }
    T.ev.push({t:'morre',uid:e.uid,P:e.P,id:e.id,x:e.x,y:e.y,kind:e.kind});
    if(fonte&&fonte.P&&fonte.P!==e.P&&e.kind==='un'){T.stats[fonte.P].abates++;
      if(fonte.vivo&&fonte.kind==='un'&&(CARD[fonte.id].fx||[]).some(x=>x.op==='cresce')&&fonte.cresce<4){fonte.cresce++;fonte.maxHp+=80;fonte.hp+=80;T.ev.push({t:'buff',uid:fonte.uid,k:'cresce'});}}
    if(e.kind==='un'){for(const x of CARD[e.id].fx||[])if(x.on==='morrer'&&x.op==='danoHeroiRival'){
      T.ev.push({t:'feitico',P:e.P,op:'explode',x:e.x,y:e.y,r:2.2});
      for(const o of T.ents)if(o.vivo&&o.P!==e.P&&dist(o,e)<=2.2+o.raio)dano(T,o,(x.v||3)*80,e,{longe:true});}}
  }
  function fim(T,V){if(T.over)return;T.over=true;T.vencedor=V;T.ev.push({t:'fim',vencedor:V});}

  /* ---------- jogar carta ---------- */
  function zona(T,P,ln){
    const Q=outro(P),torreQ=T.ents.find(e=>e.kind==='torre'&&e.P===Q&&e.lane===ln);
    const caiu=torreQ&&!torreQ.vivo;
    return P==='p'?[1.6,caiu?20.5:14.6]:[caiu?11.5:17.4,30.4];
  }
  function podeAqui(T,P,i,x,y){
    if(T.over)return {ok:false,motivo:'fim'};
    const c=T.mao[P][i];if(!c)return {ok:false,motivo:'carta'};
    const C=CARD[c.id];if(T.en[P]<C.custo)return {ok:false,motivo:'energia'};
    if(C.tipo==='feitico')return {ok:true,lane:lane(x),x:clamp(x,-6.3,6.3),y:clamp(y,0.5,31.5)};
    const ln=lane(x),z=zona(T,P,ln);
    if(y<z[0]-0.6||y>z[1]+0.6)return {ok:false,motivo:'zona'};
    return {ok:true,lane:ln,x:LX[ln]+clamp(x-LX[ln],-0.9,0.9),y:clamp(y,z[0],z[1])};
  }
  function jogar(T,P,i,x,y){
    const v=podeAqui(T,P,i,x,y);if(!v.ok)return v;
    const c=T.mao[P][i],C=CARD[c.id];
    T.en[P]-=C.custo;T.mao[P].splice(i,1);T.fila[P].push(c);T.mao[P].splice(i,0,T.fila[P].shift());
    T.stats[P].cartas++;
    T.ev.push({t:'jogou',P,id:c.id,lane:v.lane,x:v.x,y:v.y,tipo:C.tipo});
    if(C.tipo==='feitico'){T.stats[P].feiticos++;feitico(T,P,c,v.x,v.y);}
    else if(C.tipo==='construcao')criarObra(T,P,c.id,c.lvl,v.lane,v.x,v.y);
    else{
      const u=criarUnidade(T,P,c.id,c.lvl,v.lane,v.x,v.y);
      // quem entra na trilha de um Boi-Bumbá chega mais forte
      if(u&&T.ents.some(e=>e.vivo&&e!==u&&e.P===P&&e.lane===v.lane&&e.kind==='un'&&(CARD[e.id].fx||[]).some(x=>x.op==='festaEntrada'))){u.buffs.push({k:'dmg',v:0.2,ate:T.t+10});}
      for(const x of C.fx||[])if(x.on==='entrar')aoEntrar(T,u,x);
    }
    // o rival "vê" a carta e prepara a defesa
    const Q=outro(P);if(T.ia[Q]&&C.tipo!=='feitico'){const I=T.ia[Q];I.reage={lane:v.lane,em:T.t+TIA[I.tier].reacao*(0.8+T.rnd()*0.4)};}
    return {ok:true,lane:v.lane};
  }
  function inimigosLane(T,P,ln){return T.ents.filter(e=>e.vivo&&e.P!==P&&(e.kind==='un'||e.kind==='obra')&&e.lane===ln);}
  function maisPerto(T,u,lista){let b=null,d=1e9;for(const e of lista){const k=dist(e,u);if(k<d){d=k;b=e;}}return b;}
  function aoEntrar(T,u,x){
    if(!u)return;const P=u.P,ln=u.lane,lvl=u.lvl,ini=inimigosLane(T,P,ln);
    switch(x.op){
      case 'danoTodasRivais':T.ev.push({t:'feitico',P,op:'onda',x:u.x,y:u.y,lane:ln});for(const e of ini)dano(T,e,(x.v||1)*90,u,{longe:true});break;
      case 'buffOutrasTemp':buffLane(T,P,ln,'dmg',0.25*(x.v||1),6,u);break;
      case 'criaFicha':{const n=x.n||1;for(let k=0;k<n;k++)criarUnidade(T,P,x.ficha,lvl,ln,u.x+(k%2?0.6:-0.6),u.y-dirDe(P)*0.4,{ficha:true});break;}
      case 'acordaOutras':buffLane(T,P,ln,'vel',0.3,5,u);buffLane(T,P,ln,'dmg',0.1,5,u);break;
      case 'danoMaiorAtk':{let b=null;for(const e of ini)if(e.kind==='un'&&(!b||e.dmg>b.dmg))b=e;if(b){T.ev.push({t:'tiro',de:u.uid,para:b.uid,golpe:'raio',x:u.x,y:u.y});dano(T,b,(x.v||3)*100,u,{longe:true,forte:true});}break;}
      case 'curaHeroi':{const t=T.ents.find(e=>e.vivo&&e.P===P&&e.kind==='torre'&&e.lane===ln)||T.ents.find(e=>e.vivo&&e.P===P&&e.kind==='casa');if(t)curar(T,t,(x.v||2)*60);break;}
      case 'curaTotalAliadas':for(const e of T.ents)if(e.vivo&&e.P===P&&e.kind==='un'&&e.lane===ln)curar(T,e,e.maxHp);break;
      case 'buffVizinhas':case 'buffOutras':case 'buffFamiliaTemp':
        for(const e of T.ents)if(e.vivo&&e.P===P&&e.kind==='un'&&e.lane===ln&&e!==u&&(x.op!=='buffFamiliaTemp'||e.fam===u.fam)){e.maxHp+=60;e.hp+=60;e.buffs.push({k:'dmg',v:0.15,ate:T.t+(x.op==='buffFamiliaTemp'?8:30)});T.ev.push({t:'buff',uid:e.uid,k:'dmg'});}break;
      case 'buffSeFamiliaVizinha':if(T.ents.some(e=>e.vivo&&e!==u&&e.P===P&&e.kind==='un'&&e.lane===ln&&e.fam&&e.fam===u.fam)){u.maxHp+=120;u.hp+=120;u.buffs.push({k:'dmg',v:0.25,ate:T.t+999});T.ev.push({t:'buff',uid:u.uid,k:'dmg'});}break;
      case 'danoFrente':{const b=maisPerto(T,u,ini);if(b){T.ev.push({t:'tiro',de:u.uid,para:b.uid,golpe:'raio',x:u.x,y:u.y});dano(T,b,(x.v||1)*100,u,{longe:true});}break;}
      case 'espinhosOutras':for(const e of T.ents)if(e.vivo&&e.P===P&&e.kind==='un'&&e.lane===ln&&e!==u){e.kw.espinhos=(e.kw.espinhos||0)+(x.v||1);T.ev.push({t:'buff',uid:e.uid,k:'pele'});}break;
      case 'destroiFrente':{const b=maisPerto(T,u,ini.filter(e=>e.kind==='un'));if(b){T.ev.push({t:'feitico',P,op:'engole',x:b.x,y:b.y});dano(T,b,b.hp<=450?b.hp:400,u,{longe:true,forte:true});}break;}
      case 'perdeAtkFrente':{const b=maisPerto(T,u,ini.filter(e=>e.kind==='un'));if(b){b.buffs.push({k:'fraco',v:0.25*(x.v||1),ate:T.t+10});T.ev.push({t:'buff',uid:b.uid,k:'fraco'});}break;}
      case 'kwVizinhas':for(const e of T.ents)if(e.vivo&&e.P===P&&e.kind==='un'&&e.lane===ln&&e!==u){e.kw.couraca=Math.max(e.kw.couraca||0,1);T.ev.push({t:'buff',uid:e.uid,k:'pele'});}break;
      case 'enraizaFrente':{const b=maisPerto(T,u,ini.filter(e=>e.kind==='un'));if(b){b.atordoa=3;T.ev.push({t:'buff',uid:b.uid,k:'raiz'});}break;}
      case 'compra':T.en[P]=Math.min(EN_MAX,T.en[P]+1);break;
    }
  }
  function feitico(T,P,c,x,y){
    const C=CARD[c.id],op=(C.fx[0]||{}).op,n=nDe(c.id,c.lvl),R=2.6;
    T.ev.push({t:'feitico',P,op,id:c.id,x,y,r:op==='vidaTimeCura'?99:R});
    const perto=(e,r)=>Math.hypot(e.x-x,e.y-y)<=(r||R)+e.raio*0.5;
    const ini=T.ents.filter(e=>e.vivo&&e.P!==P&&perto(e)),ali=T.ents.filter(e=>e.vivo&&e.P===P&&e.kind==='un'&&perto(e));
    switch(op){
      case 'danoCriatura':for(const e of ini)dano(T,e,n*90*(e.kind==='un'||e.kind==='obra'?1:0.35),{P},{longe:true,forte:true});break;
      case 'buffTimeTemp':case 'buffAliadaTemp':for(const e of ali){e.buffs.push({k:'dmg',v:0.3*n,ate:T.t+7},{k:'vel',v:0.3,ate:T.t+7});T.ev.push({t:'buff',uid:e.uid,k:'dmg'});}break;
      case 'buffAliada':for(const e of ali){e.maxHp+=n*40;curar(T,e,n*60+40);}break;
      case 'danoEnraiza':for(const e of ini){dano(T,e,n*80*(e.kind==='un'?1:0.35),{P},{longe:true});if(e.kind==='un'){e.atordoa=3;T.ev.push({t:'buff',uid:e.uid,k:'raiz'});}}break;
      case 'perdeAtk':for(const e of ini)if(e.kind==='un'){e.buffs.push({k:'fraco',v:Math.min(0.6,0.2*n),ate:T.t+8});T.ev.push({t:'buff',uid:e.uid,k:'fraco'});}break;
      case 'destroiSeVidaAte':for(const e of ini)if(e.kind==='un'&&e.hp<=n*110)dano(T,e,e.hp,{P},{longe:true,forte:true});break;
      case 'vidaMaisCuraTotal':for(const e of ali){e.maxHp+=n*40;curar(T,e,e.maxHp);}break;
      case 'vidaTimeCura':for(const e of T.ents)if(e.vivo&&e.P===P)curar(T,e,e.kind==='un'?n*50:n*60);break;
    }
  }

  /* ---------- alvos ---------- */
  function podeAcertar(a,b){if(!b.ar)return true;return a.kind!=='un'||a.dist||a.ar||a.kw.bloqueiaVoo;}
  function alvoPadrao(T,u){ // sem ninguém por perto: a torre da trilha; caída, a Casa
    const Q=outro(u.P);const t=T.ents.find(e=>e.kind==='torre'&&e.P===Q&&e.lane===u.lane);
    if(t&&t.vivo)return t;return T.ents.find(e=>e.kind==='casa'&&e.P===Q);
  }
  function escolherAlvo(T,u){
    const vista=Math.max(5.5,u.alc+1.5);let b=null,bd=1e9,guarda=false;
    for(const e of T.ents){
      if(!e.vivo||e.P===u.P||!podeAcertar(u,e))continue;
      if(e.kind==='un'||e.kind==='obra'){if(e.lane!==u.lane&&dist(e,u)>2.2)continue;}
      const d=dist(e,u)-e.raio;if(d>vista)continue;
      const g=!!e.kw.guarda;if(guarda&&!g)continue;
      if((g&&!guarda)||d<bd){b=e;bd=d;guarda=g;}
    }
    return b;
  }
  function escolherAlvoTorre(T,t){
    let b=null,bd=1e9;for(const e of T.ents){if(!e.vivo||e.P===t.P||e.kind==='torre'||e.kind==='casa')continue;const d=dist(e,t)-e.raio;if(d<=t.alc&&d<bd){b=e;bd=d;}}return b;
  }

  /* ---------- passo ---------- */
  function passo(T,dt){
    if(T.over)return;T.acc+=Math.min(dt,0.25);
    while(T.acc>=1/30-1e-9&&!T.over){T.acc-=1/30;tick(T,1/30);}
  }
  function tick(T,dt){
    T.t+=dt;
    const resta=DUR-T.t;
    const regen=(T.prorroga||resta<=60)?2:1;
    for(const P of ['p','r']){T.en[P]=Math.min(EN_MAX,T.en[P]+dt*regen/EN_REGEN);}
    if(!T.avisou60&&resta<=60){T.avisou60=true;T.ev.push({t:'aviso',txt:'dobro'});}
    if(T.t>=DUR&&!T.prorroga){
      if(T.coroas.p!==T.coroas.r)return fimTempo(T);
      T.prorroga=true;T.ev.push({t:'aviso',txt:'prorroga'});
    }
    if(T.prorroga){if(T.coroas.p!==T.coroas.r||T.t>=DUR+PRORROGA)return fimTempo(T);}
    for(const e of T.ents){if(!e.vivo)continue;
      if(e.buffs.length)e.buffs=e.buffs.filter(b=>b.ate>T.t);
      if(e.kind==='un')unidade(T,e,dt);else if(e.kind==='obra')obra(T,e,dt);else torre(T,e,dt);}
    // tiros em voo
    for(const s of T.tiros){const a=T.ents.find(e=>e.uid===s.para);if(!a||!a.vivo){s.fim=true;continue;}
      const d=Math.hypot(a.x-s.x,a.y-s.y),v=s.vel*dt;if(d<=v+0.1){s.fim=true;const f=T.ents.find(e=>e.uid===s.de);bater(T,f||{P:s.P,kind:'tiro',vivo:false,kw:{}},a,s.n,true);}
      else{s.x+=(a.x-s.x)/d*v;s.y+=(a.y-s.y)/d*v;}}
    if(T.tiros.length)T.tiros=T.tiros.filter(s=>!s.fim);
    separar(T);
    if(T.ents.length>80)T.ents=T.ents.filter(e=>e.vivo||e.kind==='torre'||e.kind==='casa');
    for(const P in T.ia)ia(T,P,dt);
  }
  function fimTempo(T){
    T.porTempo=true;
    if(T.coroas.p!==T.coroas.r)return fim(T,T.coroas.p>T.coroas.r?'p':'r');
    // empate em torres: quem tem mais vida somada nas torres
    const v=P=>T.ents.filter(e=>e.P===P&&(e.kind==='torre'||e.kind==='casa')).reduce((a,e)=>a+Math.max(0,e.hp)/e.maxHp,0);
    const a=v('p'),b=v('r');fim(T,Math.abs(a-b)<0.02?'empate':a>b?'p':'r');
  }
  function bater(T,a,b,n,longe){
    if(a.kw&&a.kw.pisotear&&!longe){for(const e of T.ents)if(e.vivo&&e!==b&&e.P===b.P&&(e.kind==='un'||e.kind==='obra')&&dist(e,b)<=1.3)dano(T,e,n*0.5,a,{longe:true});}
    dano(T,b,n,a,{longe});
  }
  function torre(T,t,dt){
    if(!t.ativa)return;t.cd-=dt;
    if(t.cd>0)return;const a=escolherAlvoTorre(T,t);if(!a)return;
    t.cd=t.cd0;T.tiros.push({de:t.uid,para:a.uid,P:t.P,x:t.x,y:t.y,vel:11,n:t.dmg});
    T.ev.push({t:'golpe',uid:t.uid,para:a.uid,dist:true,golpe:'torre'});
  }
  function obra(T,o,dt){
    if(o.entra>0){o.entra-=dt;return;}
    o.vida-=dt;o.hp-=o.maxHp/40*dt;if(o.hp<=0||o.vida<=0)return morrer(T,o,null);
    o.tFx-=dt;if(o.tFx>0)return;
    const C=CARD[o.id],n=nDe(o.id,o.lvl);
    if(o.op==='inicioNinhada'){o.tFx=7;const f=criarUnidade(T,o.P,'filhote',o.lvl,o.lane,o.x,o.y+dirDe(o.P)*0.6,{ficha:true});if(f)f.dmg+=Math.max(0,n-1)*30;}
    else if(o.op==='inicioEnergia'){o.tFx=6;T.en[o.P]=Math.min(EN_MAX,T.en[o.P]+1);T.ev.push({t:'buff',uid:o.uid,k:'energia'});}
    else if(o.op==='inicioTrator'){o.tFx=8;T.ev.push({t:'feitico',P:o.P,op:'carga',x:o.x,y:o.y,lane:o.lane});for(const e of inimigosLane(T,o.P,o.lane))if(e.kind==='un'&&Math.abs(e.y-o.y)<9)dano(T,e,160+n*20,o,{longe:true});}
    else o.tFx=99;
    void C;
  }
  function unidade(T,u,dt){
    if(u.entra>0){u.entra-=dt;return;}
    if(u.atordoa>0){u.atordoa-=dt;u.golpeEm=-1;return;}
    const C=CARD[u.id];
    // habilidades com tempo
    u.tInicio+=dt;
    if(u.tInicio>=6){u.tInicio=0;for(const x of C.fx||[]){
      if(x.on==='inicio'&&x.op==='curaAliadas'){for(const e of T.ents)if(e.vivo&&e.P===u.P&&e.kind==='un'&&e.lane===u.lane)curar(T,e,(x.v||1)*40);}
      if(x.on==='inicio'&&x.op==='curaHeroi'){const t=T.ents.find(e=>e.vivo&&e.P===u.P&&e.kind==='torre'&&e.lane===u.lane)||T.ents.find(e=>e.vivo&&e.P===u.P&&e.kind==='casa');if(t)curar(T,t,(x.v||2)*40);}}}
    const brota=u.kw.brotar||T.ents.some(e=>e.vivo&&e!==u&&e.P===u.P&&e.kind==='un'&&e.lane===u.lane&&(CARD[e.id].fx||[]).some(x=>x.op==='brotarAura'||x.op==='brotarVizinhas'));
    if(brota&&u.cresce<3){u.tBrota+=dt;if(u.tBrota>=6){u.tBrota=0;u.cresce++;u.maxHp+=60;u.hp+=60;T.ev.push({t:'buff',uid:u.uid,k:'cresce'});}}
    // golpe em andamento
    if(u.golpeEm>=0){u.golpeEm-=dt;if(u.golpeEm<0){const a=T.ents.find(e=>e.uid===u.alvo);
      if(a&&a.vivo){const n=dmgDe(T,u)*(a.ar&&u.kw.bloqueiaVoo?2:1);
        if(u.dist)T.tiros.push({de:u.uid,para:a.uid,P:u.P,x:u.x,y:u.y,vel:9,n});
        else{bater(T,u,a,n,false);if(u.kw.ataqueDuplo&&a.vivo)bater(T,u,a,n*0.6,false);}}}
      return;}
    u.cd-=dt;
    let a=escolherAlvo(T,u);const vaiPara=a||alvoPadrao(T,u);
    if(!vaiPara)return;
    const d=dist(u,vaiPara)-vaiPara.raio-u.raio;
    if(a===null&&vaiPara&&d<=u.alc)a=vaiPara;
    if(a&&d<=u.alc){u.alvo=a.uid;u.andando=false;
      if(u.cd<=0){u.cd=u.cd0;u.golpeEm=0.28;T.ev.push({t:'golpe',uid:u.uid,para:a.uid,dist:u.dist,golpe:golpe(u.id)});}
      return;}
    // andar: segue a trilha até perto do alvo
    const v=velDe(u)*dt;let tx=vaiPara.x,ty=vaiPara.y;
    if(!a){ // seguindo a trilha (na ponte do rio todos passam pelo meio da trilha)
      const lx=LX[u.lane];const longeDoAlvo=Math.abs(ty-u.y)>3;
      if(longeDoAlvo){tx=lx+(u.uid%3-1)*0.35;ty=u.y+dirDe(u.P)*2;}
    }
    const dx=tx-u.x,dy=ty-u.y,L=Math.hypot(dx,dy)||1;
    u.x+=dx/L*v;u.y+=dy/L*v;u.andando=v>0;u.alvo=a?a.uid:null;
  }
  function separar(T){ // empurrãozinho para ninguém ficar um dentro do outro
    const L=T.ents;for(let i=0;i<L.length;i++){const a=L[i];if(!a.vivo||a.kind!=='un')continue;
      for(let j=i+1;j<L.length;j++){const b=L[j];if(!b.vivo||b.kind!=='un'||a.ar!==b.ar)continue;
        const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),m=a.raio+b.raio;if(d>=m||d<1e-4)continue;
        const k=(m-d)*0.25/d;a.x-=dx*k;a.y-=dy*k;b.x+=dx*k;b.y+=dy*k;}
      a.x=clamp(a.x,-6.3,6.3);a.y=clamp(a.y,0.6,31.4);}
  }

  /* ---------- rival do computador: vê o que você jogou e responde ---------- */
  function ameacaLane(T,P,ln){ // perigo para P nessa trilha
    let a=0;for(const e of T.ents){if(!e.vivo||e.P===P||e.kind!=='un'||e.lane!==ln)continue;
      const perto=P==='r'?(e.y-6)/20:(26-e.y)/20;a+=(e.hp*dmgDe(T,e))/1000*(0.6+clamp(perto,0,1.4));}
    return a;
  }
  function defesaLane(T,P,ln){let a=0;for(const e of T.ents)if(e.vivo&&e.P===P&&e.kind==='un'&&e.lane===ln)a+=(e.hp*dmgDe(T,e))/1000;return a;}
  function valorCarta(T,P,c,ln,defesa){
    const C=CARD[c.id];if(C.tipo==='feitico'){
      const op=(C.fx[0]||{}).op;const ini=T.ents.filter(e=>e.vivo&&e.P!==P&&e.kind==='un'&&e.lane===ln);
      if(['danoCriatura','danoEnraiza','destroiSeVidaAte'].includes(op))return ini.length>=2||ini.some(e=>e.hp>500)?3+ini.length:-1;
      const ali=T.ents.filter(e=>e.vivo&&e.P===P&&e.kind==='un'&&e.lane===ln).length;return ali>=2?2:-1;}
    if(C.tipo==='construcao')return defesa?0.5:1.5;
    const f=ficha(c.id,c.lvl);let v=(f.hp*f.dmg)/(1000*Math.max(1,C.custo))*2;
    if(T.terr[P][ln]===C.terreno)v*=1.2;
    if(defesa&&T.ents.some(e=>e.vivo&&e.P!==P&&e.kind==='un'&&e.lane===ln&&e.ar)&&(f.ar||f.dist||f.kw.bloqueiaVoo))v+=2;
    return v;
  }
  function ia(T,P,dt){
    const I=T.ia[P],D=TIA[I.tier];I.prox-=dt;
    const lanesPerigo=[0,1,2].map(ln=>ameacaLane(T,P,ln)-defesaLane(T,P,ln)*0.8);
    let ln=-1,defesa=false;
    if(I.reage&&T.t>=I.reage.em){ln=I.reage.lane;defesa=true;I.reage=null;}
    else if(I.prox<=0){
      const pior=lanesPerigo.indexOf(Math.max(...lanesPerigo));
      if(lanesPerigo[pior]>0.6){ln=pior;defesa=true;}
      else if(T.en[P]>=D.guarda||(T.t>DUR-60&&T.en[P]>=5)){ // ataque: trilha onde a torre rival está mais fraca
        let b=0,bv=-1e9;for(let k=0;k<3;k++){const t=T.ents.find(e=>e.kind==='torre'&&e.P===outro(P)&&e.lane===k);
          const v=(t&&t.vivo?1-t.hp/t.maxHp:1.5)+defesaLane(T,P,k)*0.5-ameacaLane(T,P,k)*0.3+T.rnd()*0.4;if(v>bv){bv=v;b=k;}}
        ln=b;}
      I.prox=0.5+T.rnd()*0.6;
    }
    if(ln<0)return;
    if(T.rnd()<D.erro)ln=Math.floor(T.rnd()*3);
    // escolhe a carta
    let bi=-1,bv=0;T.mao[P].forEach((c,i)=>{const C=CARD[c.id];if(C.custo>T.en[P])return;const v=valorCarta(T,P,c,ln,defesa)+T.rnd()*0.3;if(v>bv){bv=v;bi=i;}});
    if(bi<0){if(defesa)I.reage={lane:ln,em:T.t+0.8};return;}
    const C=CARD[T.mao[P][bi].id];
    let x=LX[ln]+(T.rnd()-0.5)*0.8,y;
    const z=zona(T,P,ln);
    if(C.tipo==='feitico'){const ini=T.ents.filter(e=>e.vivo&&e.P!==P&&e.lane===ln&&(e.kind==='un'||e.kind==='obra'));
      const alvo=ini.sort((a,b)=>(P==='r'?b.y-a.y:a.y-b.y))[0];if(!alvo){I.prox=0.4;return;}x=alvo.x;y=alvo.y+(P==='r'?0.6:-0.6);}
    else if(defesa){ // na frente da própria torre, para segurar quem vem
      const ini=T.ents.filter(e=>e.vivo&&e.P!==P&&e.kind==='un'&&e.lane===ln);
      const frente=ini.length?(P==='r'?Math.min(...ini.map(e=>e.y)):Math.max(...ini.map(e=>e.y))):null;
      y=P==='r'?clamp(frente!=null?Math.max(frente+2.5,21):23,z[0],z[1]):clamp(frente!=null?Math.min(frente-2.5,11):9,z[0],z[1]);
    }else y=P==='r'?z[1]-0.6:z[0]+0.6;
    jogar(T,P,bi,x,y);
  }

  return {LX,RIO,DUR,PRORROGA,EN_MAX,TORRE,CASA,nova,passo,jogar,podeAqui,zona,lane,texto,ficha,golpe,nDe};
})();
