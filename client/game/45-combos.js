/* ===================== v4: FAMÍLIAS, DUPLAS E COMBO (regras, sem interface) =====================
 Tudo aqui é regra pura do motor: lê e muda só o objeto da batalha B (nunca o save "s"),
 e só emite eventos em B.ev. Nada disso roda no tutorial (B.tut).

 API usada pelo motor (50-engine) e pela interface:
   v4On(B)                          -> true quando os sistemas v4 valem (não é tutorial); cria os campos que faltarem
   vivoC(c)                         -> criatura viva (c && !c.dead && c.hp>0)
   nivelFamilia(B,cnt)              -> 0|1|2 para cnt criaturas da mesma família (regra 'familias': 2 já dá nível 2)
   contaFamilias(B,P)               -> {aves:n,...} criaturas vivas de P por família (fichas contam)
   bonusFamilia(fam,nivel)          -> {a,h,kw} do nível (ou null)
   recalcFamilias(B,P?)             -> aplica/retira os bônus de família (e a regra 'corvos'); sem P faz os dois lados
   duplasCompletas(B,P,lane,id)     -> [{D,la,lb}] duplas que a carta id completaria entrando em lane (PURA: a IA usa)
   checaDuplas(B,P,lane,id)         -> dispara as duplas completadas (evento 'combo' antes do efeito)
   limiarCombo(B,P)                 -> 3, ou 2 com um Sanfoneiro vivo
   checaSequencia(B,P,tipo)         -> conta a carta jogada no Combo do turno (só criatura/construção; x3 = +1 ATK no time; x4/x5 = 1 no herói)
   valorBonus(b), valorFamLado(B,P,troca) -> valores para a IA
*/
const vivoC=c=>!!c&&!c.dead&&c.hp>0;
function v4On(B){
  if(!B||B.tut)return false;
  if(!B.duplas)B.duplas={p:[],r:[]};
  if(!B.duplasLog)B.duplasLog=[];
  if(!B.seq)B.seq={p:{n:0,atk:false,dano:0},r:{n:0,atk:false,dano:0}};
  if(!B.famNiv)B.famNiv={p:{},r:{}};
  if(!B.famVisto)B.famVisto={p:{},r:{}};
  if(B.stats&&B.stats.duplas==null){B.stats.duplas=0;B.stats.combos=0;}
  return true;
}
const regraAtiva=(B,id)=>!!B&&!B.tut&&B.regra===id;
/* Lua Cheia: as criaturas entram acordadas (c.lua: no turno em que entrou só ataca criaturas) */
const luaAtiva=B=>regraAtiva(B,'lua');

/* ---------- famílias ---------- */
function nivelFamilia(B,cnt){if(cnt>=3)return 2;if(cnt>=2)return regraAtiva(B,'familias')?2:1;return 0;}
function contaFamilias(B,P,troca){
  // troca (opcional): {lane, id} = como ficaria com a carta id no terreno lane (a IA usa)
  const cnt={};
  B.sides[P].lanes.forEach((L,i)=>{
    let f=null;
    if(troca&&troca.lane===i)f=CARD[troca.id].familia;
    else if(vivoC(L.c))f=CARD[L.c.id].familia;
    if(f)cnt[f]=(cnt[f]||0)+1;
  });
  return cnt;
}
const bonusFamilia=(fam,niv)=>niv>0?FAMILIAS[fam].niv[niv-1]:null;
function mesmoBonus(x,y){
  if((x.a||0)!==(y.a||0)||(x.h||0)!==(y.h||0))return false;
  const kx=x.kw||{},ky=y.kw||{};
  for(const k in kx)if((kx[k]||0)!==(ky[k]||0))return false;
  for(const k in ky)if((kx[k]||0)!==(ky[k]||0))return false;
  return true;
}
/* troca o bônus de família guardado em c.fb pelo bônus "want" (tira o velho exatamente, põe o novo) */
function aplicaBonusFam(c,want){
  const fb=c.fb||{};want=want||{};
  if(mesmoBonus(fb,want))return false;
  c.famAtk=(c.famAtk||0)-(fb.a||0);
  if(fb.h){c.maxHp=Math.max(1,c.maxHp-fb.h);c.hp=Math.min(c.hp,c.maxHp);}
  for(const k in (fb.kw||{})){c.kw[k]=(c.kw[k]||0)-fb.kw[k];if(!(c.kw[k]>0))delete c.kw[k];}
  c.famAtk+=(want.a||0);
  if(want.h){c.maxHp+=want.h;c.hp+=want.h;}
  for(const k in (want.kw||{}))c.kw[k]=(c.kw[k]||0)+want.kw[k];
  c.fb={a:want.a||0,h:want.h||0,kw:Object.assign({},want.kw||{}),ra:fb.ra||0};
  return true;
}
const rotuloNivel=(B,niv)=>niv>=2?(regraAtiva(B,'familias')?'2+':'3+'):'2';
function recalcFamilias(B,P){
  if(!v4On(B))return;
  for(const Q of (P?[P]:['p','r'])){
    const S=B.sides[Q];
    const cnt=contaFamilias(B,Q);
    const niv={};for(const f of FAM_ORDEM)niv[f]=nivelFamilia(B,cnt[f]||0);
    // 1) bônus das famílias
    S.lanes.forEach(L=>{const c=L.c;if(!vivoC(c))return;if(!c.fb)c.fb={};if(c.famAtk==null)c.famAtk=0;
      const f=CARD[c.id].familia;aplicaBonusFam(c,f?bonusFamilia(f,niv[f]):null);});
    // 2) regra Noite dos Corvos: +1 ATK enquanto tiver Voar (depois que as palavras-chave da família assentaram)
    S.lanes.forEach(L=>{const c=L.c;if(!vivoC(c))return;
      const ra=(regraAtiva(B,'corvos')&&c.kw.voar)?1:0,ant=c.fb.ra||0;
      if(ra!==ant){c.famAtk+=ra-ant;c.fb.ra=ra;}});
    // 3) eventos de mudança de nível
    for(const f of FAM_ORDEM){
      const antes=B.famNiv[Q][f]||0,nivel=niv[f];if(nivel===antes)continue;
      B.famNiv[Q][f]=nivel;
      const F=FAMILIAS[f];
      const lanes=[];S.lanes.forEach((L,i)=>{if(vivoC(L.c)&&CARD[L.c.id].familia===f)lanes.push(i);});
      let primeira=false;if(nivel>0&&!B.famVisto[Q][f+nivel]){B.famVisto[Q][f+nivel]=1;primeira=true;}
      ev(B,{t:'familia',P:Q,fam:f,nivel,antes,lanes,cor:F.cor,primeira});
      if(nivel>0)log(B,'Família '+F.nome+' ('+rotuloNivel(B,nivel)+')'+(Q==='r'?' do rival':'')+': '+F.txt[nivel-1]+'.');
      else log(B,'Família '+F.nome+(Q==='r'?' do rival':'')+': o bônus acabou.');
    }
  }
}
/* valor de um bônus para a IA */
const VAL_KW_FAM={voar:2,pisotear:1,espinhos:1,brotar:2,bloqueiaVoo:1};
function valorBonus(b){if(!b)return 0;let v=1.5*(b.a||0)+(b.h||0);for(const k in (b.kw||{}))v+=(VAL_KW_FAM[k]||1)*b.kw[k];return v;}
/* soma dos bônus de família que o lado P teria (troca opcional {lane,id}) */
function valorFamLado(B,P,troca){
  const cnt=contaFamilias(B,P,troca);let v=0;
  B.sides[P].lanes.forEach((L,i)=>{
    let f=null;
    if(troca&&troca.lane===i)f=CARD[troca.id].familia;else if(vivoC(L.c))f=CARD[L.c.id].familia;
    if(f)v+=valorBonus(bonusFamilia(f,nivelFamilia(B,cnt[f]||0)));
  });
  return v;
}

/* ---------- duplas ---------- */
/* PURA: quais duplas a carta id completaria entrando no terreno lane do lado P (ainda não feitas nesta partida) */
function duplasCompletas(B,P,lane,id){
  if(!B||B.tut)return [];
  const lista=DUPLAS_DE[id];if(!lista)return [];
  const S=B.sides[P],feitas=(B.duplas&&B.duplas[P])||[],livre=regraAtiva(B,'duplas'),c=CARD[id];
  const out=[];
  for(const D of DUPLAS){
    if(!lista.includes(D)||feitas.includes(D.id))continue;
    const souA=D.a===id,par=souA?D.b:D.a;
    if(D.tipo==='vizinho'){
      if(c.tipo!=='criatura')continue;
      let j=-1;
      for(let k=0;k<4;k++){if(k===lane)continue;if(!livre&&Math.abs(k-lane)!==1)continue;const o=S.lanes[k].c;if(vivoC(o)&&o.id===par){j=k;break;}}
      if(j<0)continue;
      out.push({D,la:souA?lane:j,lb:souA?j:lane});
    }else{ // terreno: a = criatura, b = construção
      if(souA&&c.tipo==='criatura'){
        let j=-1;
        if(S.lanes[lane].b&&S.lanes[lane].b.id===par)j=lane;
        else if(livre)for(let k=0;k<4;k++){if(S.lanes[k].b&&S.lanes[k].b.id===par){j=k;break;}}
        if(j<0)continue;
        out.push({D,la:lane,lb:j});
      }else if(!souA&&c.tipo==='construcao'){
        let j=-1;
        if(vivoC(S.lanes[lane].c)&&S.lanes[lane].c.id===par)j=lane;
        else if(livre)for(let k=0;k<4;k++){const o=S.lanes[k].c;if(vivoC(o)&&o.id===par){j=k;break;}}
        if(j<0)continue;
        out.push({D,la:j,lb:lane});
      }
    }
  }
  return out;
}
function checaDuplas(B,P,lane,id){
  if(!v4On(B))return 0;
  const lista=duplasCompletas(B,P,lane,id);
  for(const x of lista){
    const D=x.D;if(B.duplas[P].includes(D.id))continue;
    B.duplas[P].push(D.id);
    if(P==='p'){B.stats.duplas++;B.duplasLog.push(D.id);}
    const lanes=x.la===x.lb?[x.la]:[x.la,x.lb];
    ev(B,{t:'combo',P,lanes,nome:D.nome,cor:D.cor,id:D.id,txt:D.txt});
    log(B,'Dupla'+(P==='r'?' do rival':'')+'! '+D.nome+': '+D.txt);
    for(const f of D.fx)efeitoDupla(B,P,x.la,x.lb,f);
  }
  return lista.length;
}
function efeitoDupla(B,P,la,lb,f){
  const S=B.sides[P],Q=opp(P),O=B.sides[Q];
  const quem=f.quem==='a'?[la]:f.quem==='b'?[lb]:f.quem==='ambas'?(la===lb?[la]:[la,lb]):[];
  const meus=()=>S.lanes.map((L,i)=>i).filter(i=>vivoC(S.lanes[i].c));
  const acordar=ls=>{const w=[];for(const i of ls){const c=S.lanes[i].c;if(vivoC(c)&&c.rest){c.rest=false;w.push(i);}}if(w.length)ev(B,{t:'acorda',P,lanes:w});};
  switch(f.op){
    case 'buffCarta':{const ls=quem.filter(i=>vivoC(S.lanes[i].c));ls.forEach(i=>buff(B,P,i,f.a||0,f.h||0,!!f.temp));if(f.acorda)acordar(ls);break;}
    case 'buffTime':{const ls=meus();ls.forEach(i=>buff(B,P,i,f.a||0,f.h||0,!!f.temp));if(f.acorda)acordar(ls);break;}
    case 'buffFamilia':meus().forEach(i=>{if(CARD[S.lanes[i].c.id].familia===f.fam)buff(B,P,i,f.a||0,f.h||0);});break;
    case 'curaHeroi':curarHeroi(B,P,f.v);break;
    case 'curaTotalAliadas':meus().forEach(i=>curarCriatura(B,P,i,S.lanes[i].c.maxHp));break;
    case 'danoTodasRivais':O.lanes.forEach((L,i)=>{if(vivoC(L.c))danoCriatura(B,Q,i,f.v);});break;
    case 'danoHeroiRival':danoHeroi(B,Q,f.v);break;
    case 'danoFrente':quem.forEach(i=>{if(vivoC(O.lanes[i].c))danoCriatura(B,Q,i,f.v);});break;
    case 'perdeAtkFrente':quem.forEach(i=>{const E=O.lanes[i].c;if(!vivoC(E))return;const a=E.atk;E.atk=Math.max(0,E.atk-f.v);if(a>E.atk)ev(B,{t:'debuff',P:Q,lane:i,n:a-E.atk});});break;
    case 'enraizaFrente':quem.forEach(i=>{const E=O.lanes[i].c;if(!vivoC(E))return;E.raiz=true;ev(B,{t:'raiz',P:Q,lane:i,on:true});});break;
    case 'energia':S.energy+=f.v;ev(B,{t:'energia',P,n:f.v});break;
    case 'criaFichaVazios':{
      const ls=[0,1,2,3].filter(i=>!S.lanes[i].c);if(!ls.length)break;
      ev(B,{t:'ninhada',P,de:la,para:ls,ficha:f.ficha});
      for(const i of ls){const inst=mkInst(f.ficha,1);invocar(B,P,i,inst,true);ev(B,{t:'play',P,id:f.ficha,uid:inst.uid,lane:i,tipo:'criatura',ficha:true});}
      break;}
  }
}

/* ---------- Combo (sequência de cartas no mesmo turno) ---------- */
const temSanfoneiro=(B,P)=>B.sides[P].lanes.some(L=>vivoC(L.c)&&CARD[L.c.id].fx.some(f=>f.op==='sequenciaMenos'));
const limiarCombo=(B,P)=>temSanfoneiro(B,P)?COMBO.limiarSanf:COMBO.limiar;
function checaSequencia(B,P,tipo){
  if(!v4On(B))return;
  if(tipo==='feitico'&&!COMBO.feiticos)return;
  const q=B.seq[P];q.n++;
  const T=limiarCombo(B,P);
  if(!q.atk){
    if(q.n<T)return;
    q.atk=true;
    B.sides[P].lanes.forEach((L,i)=>{if(vivoC(L.c))buff(B,P,i,1,0,true);});
    ev(B,{t:'sequencia',P,n:3,efeito:'atk'});
    log(B,'Combo x3! '+(P==='p'?'Suas criaturas ganharam':'As criaturas de '+quem(B,P)+' ganharam')+' +1 ATK neste turno.');
    if(P==='p')B.stats.combos++;
  }else if(q.dano<COMBO.danoMax){
    q.dano++;const x=3+q.dano;
    ev(B,{t:'sequencia',P,n:x,efeito:'dano'});danoHeroi(B,opp(P),1);
    log(B,'Combo x'+x+'! 1 de dano no '+(P==='p'?'herói rival':'seu herói')+'.');
  }
}

/* ---------- ícones de reserva para as palavras-chave novas ----------
 (se 30-gfx ainda não tiver desenhado guarda/couraca/raiz, o ícone padrão evita erro no cardHTML) */
const ICONS_V4={
 guarda:['kkkkkkkk','kyyyyyok','kyywyyok','kyyyyyok','.kyyyok.','.kyyyok.','..kyok..','...kk...'],
 couraca:['..kkkk..','.kgmmgk.','kgGgGgGk','kmgGgGmk','kGgmgGgk','kkkkkkkk','.kn..nk.','.kk..kk.'],
 raiz:['..kk.kk.','.kmgkmgk','kmgGgGk.','.kgkkgk.','kgk..kgk','.kGkkGk.','..kGGk..','...kk...']
};
if(typeof ICONS==='object'&&ICONS)for(const k in ICONS_V4)if(!ICONS[k])ICONS[k]=ICONS_V4[k];

