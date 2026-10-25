/* ===================== ABERTURA DE PACOTE / BAÚ ===================== */
const RV={speed:1,skip:false,anims:[],phase:'',el:null};
function rvWait(ms){
  return new Promise(res=>{let acc=0,last=performance.now();const f=()=>{const now=performance.now();acc+=(now-last)*RV.speed;last=now;if(acc>=ms||RV.skip)res();else setTimeout(f,16);};f();});
}
function rvAnim(el,kf,o){
  if(!el)return null;
  const a=el.animate(kf,o);a.playbackRate=RV.speed;RV.anims.push(a);
  a.onfinish=()=>{const i=RV.anims.indexOf(a);if(i>=0)RV.anims.splice(i,1);};
  return a;
}
function rvAcelera(){if(RV.speed>=3)return;RV.speed=3;for(const a of RV.anims)try{a.playbackRate=3;}catch(e){}}
function rvParticulas(layer,x,y,cores,n,o){
  o=o||{};
  for(let k=0;k<n;k++){
    const p=document.createElement('i');p.className='pxp';const sz=o.sz||3;p.style.width=p.style.height=sz+'px';p.style.background=cores[k%cores.length];
    p.style.left=x+'px';p.style.top=y+'px';p.style.zIndex=o.z||9;layer.appendChild(p);
    if(RM){rvAnim(p,[{opacity:1},{opacity:0}],{duration:500}).onfinish=()=>p.remove();continue;}
    let kf;
    if(o.confete){const dx=(rnd()-0.5)*window.innerWidth;kf=[{transform:`translate(${dx}px,-${window.innerHeight*0.6}px)`,opacity:1},{transform:`translate(${dx+(rnd()-0.5)*80}px,${window.innerHeight*0.5}px) rotate(${rnd()*720}deg)`,opacity:1}];}
    else{const ang=(o.ang0||0)+rnd()*Math.PI*2*(o.arc||1),d=(o.dist||120)*(0.4+rnd()*0.8);kf=[{transform:'none',opacity:1},{transform:`translate(${Math.cos(ang)*d}px,${Math.sin(ang)*d+(o.cai||0)}px)`,opacity:0}];}
    const a=rvAnim(p,kf,{duration:(o.dur||700)*(0.7+rnd()*0.6),delay:o.confete?rnd()*600:0,easing:o.confete?'linear':'cubic-bezier(.2,.8,.4,1)',fill:'backwards'});
    a.onfinish=()=>p.remove();
  }
}
const RAR_TXT={rara:'RARA!',epica:'ÉPICA!',lendaria:'LENDÁRIA!'};

function revelar(res,opts){
  opts=opts||{};
  return new Promise(resolve=>{
    RV.speed=1;RV.skip=false;RV.anims=[];RV.phase='entrada';
    if(guiaBolha){vovoFechar();guiaBolha=0;} // a bolha do Início volta depois, não fica por cima da abertura
    const isPack=res.kind==='pack';
    const best=res.best,cor=RAR_LUZ[best];
    const titulo=isPack?PACKS[res.tipo].nome:BAUS[res.tipo].nome;
    const el=document.createElement('div');el.className='rvov';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Abrindo '+titulo);
    el.style.setProperty('--rc',cor);
    const small=window.innerHeight<700;
    const grande=window.innerHeight>=800&&window.innerWidth>=700; // tablet/desktop alto: pacote e baú em 2×
    const em3d=typeof R3D!=='undefined'&&R3D.disponivel(); // v9: pacote/baú 3D vivos (37-retrato3d.js)
    const stageHTML=isPack&&em3d?`<div class="packw p3d ${small?'small':grande?'big':''}" id="rvObj" role="button" tabindex="0" aria-label="Pacote: toque 3 vezes para rasgar">
        <canvas class="pk3d" aria-hidden="true"></canvas><div class="beams"></div><div class="leak" style="background:${cor}"></div><div class="crack"><svg viewBox="0 0 100 8" preserveAspectRatio="none"><polyline id="rvCrack" points="0,4 100,4" fill="none" stroke="${cor}" stroke-width="2.4" stroke-dasharray="0 200" vector-effect="non-scaling-stroke"/></svg></div></div>`
      :!isPack&&em3d?`<div class="chestw p3d ${grande?'big':''}" id="rvObj" role="button" tabindex="0" aria-label="Tesouro: toque para abrir"><div class="clight" style="background:${cor}"></div><canvas class="ch3d" aria-hidden="true"></canvas></div>`
      :isPack?`<div class="packw ${small?'small':grande?'big':''}" id="rvObj" role="button" tabindex="0" aria-label="Pacote: toque 3 vezes para rasgar">
        <canvas class="ptop" width="48" height="10" data-pack="${res.tipo}" data-part="top"></canvas><canvas class="pbody" width="48" height="54" data-pack="${res.tipo}" data-part="body"></canvas>
        <div class="glint"></div><div class="beams"></div><div class="leak" style="background:${cor}"></div><div class="crack"><svg viewBox="0 0 100 8" preserveAspectRatio="none"><polyline id="rvCrack" points="0,4 8,1 16,6 24,2 32,6 40,1 48,5 56,2 64,6 72,1 80,5 88,2 96,6 100,3" fill="none" stroke="${cor}" stroke-width="2.4" stroke-dasharray="0 200" vector-effect="non-scaling-stroke"/></svg></div></div>`
      :`<div class="chestw ${grande?'big':''}" id="rvObj" role="button" tabindex="0" aria-label="Tesouro: toque para abrir"><div class="clight" style="background:${cor}"></div><canvas class="clid" width="32" height="9" data-chest="${res.tipo}" data-part="lid"></canvas><canvas class="cbase" width="32" height="15" data-chest="${res.tipo}" data-part="base"></canvas></div>`;
    el.innerHTML=`<div class="rtop"><span class="ttl">${escH(titulo)}</span>${muteBtn('rvm')}<button class="btn skip" data-rv="pular" aria-label="Pular animação">Pular</button></div>
      <div class="rvdim" id="rvDim"></div><div class="stage" id="rvStage"><div class="rays"></div><div class="ringx"></div>${stageHTML}<div class="rvhint" id="rvHint">${isPack?'Toque 3 vezes para rasgar!':'Toque para abrir'}</div></div>
      <div class="table" id="rvTable"></div><div class="rvbot" id="rvBot"></div><div class="flash" id="rvFlash"></div>`;
    $('#ovl').appendChild(el);RV.el=el;
    const rec={el,closable:false,opener:document.activeElement};OVS.push(rec);
    hydrateGfx(el);
    let viv=null;
    if(em3d){try{const c3=$(isPack?'.pk3d':'.ch3d',el);viv=isPack?R3D.pacoteVivo(c3,{tipo:res.tipo,cor,mx:0.588,my:0.667}):R3D.bauVivo(c3,{tipo:res.tipo,cor,mx:0.6,my:0.5});}catch(e){viv=null;}}
    const pararViv=()=>{if(viv){try{viv.parar();}catch(e){}viv=null;}};
    if(isPack&&!em3d){try{const gl=$('.glint',el),pb=$('.pbody',el);const u=`url(${pb.toDataURL()})`;gl.style.webkitMaskImage=gl.style.maskImage=u;gl.style.webkitMaskSize=gl.style.maskSize='100% 100%';}catch(e){}}
    const obj=$('#rvObj',el),stage=$('#rvStage',el),table=$('#rvTable',el),bot=$('#rvBot',el),hint=$('#rvHint',el),flash=$('#rvFlash',el);
    setTimeout(()=>{try{obj.focus({preventScroll:true});}catch(e){}},80);
    let taps=0,idleT=0,fechado=false;
    const cards=[];// {g, el, open}
    const fechar=(depois)=>{if(fechado)return;fechado=true;pararViv();musDuck(1);document.removeEventListener('keydown',onKey,true);vovoFechar();fecharOv(el,true);RV.el=null;resolve();if(depois)depois();};

    /* --- 0: entrada --- */
    musDuck(0.3);sfx('entra');
    if(RM)rvAnim(obj,[{opacity:0},{opacity:1}],{duration:300});
    else rvAnim(obj,[{transform:'translateY(70vh) scale(.6)',opacity:.4},{transform:'translateY(-6px) scale(1.05)',opacity:1,offset:.75},{transform:'none'}],{duration:600,easing:'cubic-bezier(.3,1.4,.5,1)'});
    setTimeout(()=>{if(RV.phase==='entrada'||RV.phase==='toque'){if(!RM)obj.classList.add('floaty');}},600);
    RV.phase='toque';
    const mostraDica=()=>{clearTimeout(idleT);idleT=setTimeout(()=>{if(RV.phase!=='toque'||fechado)return;const h=document.createElement('div');h.className='taph';h.innerHTML=ic('mao',40);const r=obj.getBoundingClientRect();h.style.left=(r.left+r.width*0.62)+'px';h.style.top=(r.top+(isPack?r.height*0.08:r.height*0.45))+'px';h.id='rvTap';el.appendChild(h);},4000);};
    mostraDica();
    const tiraDica=()=>{clearTimeout(idleT);const h=$('#rvTap',el);if(h)h.remove();};

    /* --- 1: antecipação (toques) --- */
    function toque(){
      if(RV.phase!=='toque')return;
      tiraDica();taps++;
      if(!isPack){abrirBauAnim();return;}
      sfx('crack',taps-1);
      const k=Math.min(3,taps);
      if(viv)try{viv.toque(k);}catch(e){}
      try{navigator.vibrate&&navigator.vibrate([15,30,60][k-1]);}catch(e){}
      // cada toque: o pacote cresce, amassa e estica, treme mais; a rachadura brilha mais e a luz vaza
      obj.classList.remove('floaty');
      const s0=[1,1.05,1.1][k-1],amp=[6,8,10][k-1];
      if(!RM)rvAnim(obj,[{transform:`scale(${s0-0.05})`},{transform:`scale(${(s0*1.1).toFixed(3)},${(s0*0.9).toFixed(3)}) translateX(${-amp}px) rotate(-2deg)`,offset:.25},{transform:`scale(${(s0*0.94).toFixed(3)},${(s0*1.08).toFixed(3)}) translateX(${amp}px) rotate(2deg)`,offset:.55},{transform:`scale(${s0}) translateX(${-amp/2}px)`,offset:.8},{transform:`scale(${s0})`}],{duration:240,easing:'ease-out',fill:'forwards'});
      else obj.style.transform=`scale(${s0})`;
      const cr=$('#rvCrack',el);cr.setAttribute('stroke-dasharray',(k*34)+' 200');
      $('.crack',el).style.filter=`drop-shadow(0 0 ${[2,5,9][k-1]}px ${cor}) brightness(${[1,1.3,1.7][k-1]})`;
      const lk=$('.leak',el);lk.style.opacity=[0.35,0.7,1][k-1];if(!RM)rvAnim(lk,[{transform:'scaleX(.6)'},{transform:'scaleX(1)'}],{duration:200});
      const bm=$('.beams',el);bm.style.top=(small?'30px':grande?'80px':'40px');bm.style.bottom='auto';
      rvAnim(bm,[{opacity:[0,0.25,0.45][k-1]*0.7,transform:`translateY(-100%) scaleY(${[0.2,0.35,0.55][k-1]*0.7})`},{opacity:[0,0.25,0.45][k-1],transform:`translateY(-100%) scaleY(${[0.2,0.35,0.55][k-1]})`}],{duration:220,fill:'forwards'});
      const dim=$('#rvDim',el);dim.style.opacity=[0.3,0.55,0.8][k-1];
      const r=obj.getBoundingClientRect(),er=el.getBoundingClientRect();
      rvParticulas(el,r.left+r.width*(0.2+rnd()*0.6)-er.left,r.top+r.height*0.16-er.top,['#F4E3B5','#D9A066',cor],4+k*3,{dist:50+k*20,dur:500,z:12,sz:k>=2?4:3});
      if(taps>=3)rasgar();else mostraDica();
    }
    // arrastar na faixa de cima conta como os 3 toques
    let drag=null;
    obj.addEventListener('pointerdown',e=>{const r=obj.getBoundingClientRect();if(isPack&&e.clientY-r.top<r.height*0.3)drag={x:e.clientX,r};});
    obj.addEventListener('pointermove',e=>{if(drag&&Math.abs(e.clientX-drag.x)>drag.r.width*0.55&&RV.phase==='toque'){drag=null;taps=2;toque();}});
    obj.addEventListener('pointerup',()=>{drag=null;});
    obj.addEventListener('click',e=>{e.stopPropagation();toque();});

    /* --- 2..4: rasgo, explosão, cartas voando --- */
    async function rasgar(){
      RV.phase='auto';obj.classList.remove('floaty');
      hint.textContent='';const gl=$('.glint',el);if(gl)gl.remove();
      const ptop=$('.ptop',el),beams=$('.beams',el);
      sfx('tear');
      if(viv&&!RM)try{viv.rasgar(450);}catch(e){}
      if(RM){rvAnim(obj,[{opacity:1},{opacity:0}],{duration:300,fill:'forwards'});rvAnim($('.rays',el),[{opacity:0},{opacity:.35}],{duration:300,fill:'forwards'});}
      else{
        rvAnim(ptop,[{transform:'none',opacity:1},{transform:'translate(60px,-140px) rotate(25deg)',opacity:0}],{duration:450,easing:'cubic-bezier(.3,.7,.4,1)',fill:'forwards'});
        beams.style.top=(small?'30px':grande?'80px':'40px');beams.style.bottom='auto';beams.style.transform='translateY(-100%)';
        rvAnim(beams,[{opacity:0,transform:'translateY(-100%) scaleY(0)'},{opacity:.9,transform:'translateY(-100%) scaleY(1)'}],{duration:350,fill:'forwards'});
        if(rIdx(best)>=3)rvAnim(stage,[{transform:'translate(0,0)'},{transform:'translate(-4px,3px)'},{transform:'translate(4px,-3px)'},{transform:'translate(-3px,-2px)'},{transform:'none'}],{duration:200});
      }
      await rvWait(450);if(RV.skip)return;
      // explosão
      sfx('whoosh');sfx('chord');
      if(viv&&!RM)try{viv.explodir();}catch(e){}
      const rays=$('.rays',el),ring=$('.ringx',el);
      if(!RM){
        rays.classList.add('on');rvAnim(rays,[{opacity:0},{opacity:.55}],{duration:300,fill:'forwards'});
        const sc=1.6*Math.max(window.innerWidth,window.innerHeight)/100;
        rvAnim(ring,[{transform:'scale(.2)',opacity:1},{transform:`scale(${sc})`,opacity:0}],{duration:600,easing:'ease-out'});
        const r=obj.getBoundingClientRect();
        // clarão branco curto e faíscas grandes na cor da melhor raridade
        flash.style.background='#fff';rvAnim(flash,[{opacity:0},{opacity:.85,offset:.3},{opacity:0}],{duration:240});
        rvParticulas(el,r.left+r.width/2,r.top+r.height*0.2,[cor,RAR_COR[best],'#FFFFFF','#FFE58A'],44,{dist:Math.max(window.innerWidth,window.innerHeight)*0.5,dur:850,z:4,sz:6});
        rvParticulas(el,r.left+r.width/2,r.top+r.height*0.2,[cor,'#FFFFFF'],18,{dist:120,dur:500,z:4,sz:5});
      }else{rvAnim(rays,[{opacity:0},{opacity:.35}],{duration:300,fill:'forwards'});rvAnim(ring,[{opacity:0},{opacity:.8},{opacity:0}],{duration:600});flash.style.background='#fff';rvAnim(flash,[{opacity:0},{opacity:.2},{opacity:0}],{duration:300});}
      await rvWait(600);if(RV.skip)return;
      await voarCartas();
    }
    async function abrirBauAnim(){
      RV.phase='auto';hint.textContent='';
      const lid=$('.clid',el),light=$('.clight',el);
      sfx('bauAbre');
      if(viv&&!RM)try{viv.toque();setTimeout(()=>{if(viv&&!RV.skip)viv.abrir();},300/RV.speed);}catch(e){}
      if(!RM){rvAnim(obj,[{transform:'rotate(0)'},{transform:'rotate(-4deg)'},{transform:'rotate(4deg)'},{transform:'rotate(-3deg)'},{transform:'none'}],{duration:300});await rvWait(300);if(RV.skip)return;
        rvAnim(lid,[{transform:'none'},{transform:'translateY(-26px) rotate(-18deg)'}],{duration:300,fill:'forwards',easing:'ease-out'});}
      else rvAnim(lid,[{opacity:1},{opacity:.3}],{duration:200,fill:'forwards'});
      rvAnim(light,[{opacity:0},{opacity:1}],{duration:300,fill:'forwards'});
      const rays=$('.rays',el);rays.classList.toggle('on',!RM);rvAnim(rays,[{opacity:0},{opacity:RM?.3:.5}],{duration:300,fill:'forwards'});
      // moedas
      const r=obj.getBoundingClientRect();
      rvParticulas(el,r.left+r.width/2,r.top+r.height*0.4,['#F2C230','#FFE58A','#B9801C'],26,{dist:160,dur:700,sz:5,cai:40,z:6});
      const gc=document.createElement('div');gc.className='gcount';gc.innerHTML=`${ic('coin',28)}<span class="num">+0</span> ${MOEC}`;el.appendChild(gc);
      const sp=$('.num',gc);const t0=performance.now();
      const tick=()=>{const k=RM?1:clamp((performance.now()-t0)*RV.speed/600,0,1);sp.textContent='+'+fmt(Math.round(res.grao*k));if(k<1&&!RV.skip)requestAnimationFrame(tick);else sp.textContent='+'+fmt(res.grao);};tick();
      sfx('moedas',8);
      await rvWait(700);if(RV.skip)return;
      gc.style.transition='opacity .3s';gc.style.opacity='0';
      await voarCartas();
    }
    async function voarCartas(){
      // monta a mesa
      const grupos=res.cards;
      table.classList.toggle('many',grupos.length>5);table.classList.add('live');
      table.style.gap='44px 10px';
      grupos.forEach((g,i)=>{
        const b=document.createElement('button');b.className='rvc a-'+g.rar;b.dataset.i=i;
        b.setAttribute('aria-label','Carta virada '+(i+1)+'. Toque para virar.');
        b.innerHTML=`<div class="aura"></div><div class="flip"><div class="rb">${cardBackHTML()}</div><div class="rf">${cardHTML(g.id,{sz:'rv',lvl:s.cards[g.id]?s.cards[g.id].lvl:1,anim:true})}</div></div>${g.n>1?`<span class="badge-x num">×${g.n}</span>`:''}`;
        if(g.rar==='epica'){b.insertAdjacentHTML('beforeend','<i class="sp2" style="top:-4px;right:12px"></i><i class="sp2" style="bottom:20px;left:-4px;animation-delay:.4s"></i>');}
        table.appendChild(b);cards.push({g,el:b,open:false});
      });
      hydrateGfx(table);
      const or=obj.getBoundingClientRect();const ox=or.left+or.width/2,oy=or.top+or.height*0.35;
      if(!RM)rvAnim(obj,[{transform:'none'},{transform:'translateY(120vh) rotate(8deg)'}],{duration:700,delay:200,easing:'ease-in',fill:'forwards'});
      else rvAnim(obj,[{opacity:1},{opacity:0}],{duration:200,fill:'forwards'});
      hint.textContent='';
      cards.forEach((c,i)=>{
        const r=c.el.getBoundingClientRect();const dx=ox-(r.left+r.width/2),dy=oy-(r.top+r.height/2);
        if(RM)rvAnim(c.el,[{opacity:0},{opacity:1}],{duration:300,delay:i*60,fill:'backwards'});
        else rvAnim(c.el,[{transform:`translate(${dx}px,${dy}px) scale(.3) rotate(-25deg)`,opacity:0},{transform:`translate(${dx*0.45}px,${dy*0.45-90}px) scale(.85) rotate(10deg)`,opacity:1,offset:.55},{transform:'translateY(6px) scale(1)',offset:.85},{transform:'none'}],{duration:620,delay:Math.min(i,12)*120,easing:'cubic-bezier(.25,.8,.4,1)',fill:'backwards'});
      });
      cards.forEach((c,i)=>setTimeout(()=>{if(!RV.skip&&!fechado)sfx('deal',i);},RM?i*60:(Math.min(i,12)*120+250)/RV.speed));
      await rvWait(RM?400:Math.min(cards.length,12)*120+640);
      if(RV.skip)return;
      const rays=$('.rays',el);rvAnim(rays,[{opacity:.5},{opacity:.18}],{duration:400,fill:'forwards'});
      // aviso de raridade: uma luz colorida para cada carta Rara ou melhor
      const boas=grupos.filter(g=>rIdx(g.rar)>=2).sort((a,b)=>rIdx(a.rar)-rIdx(b.rar));
      if(boas.length){
        const tz=document.createElement('div');tz.className='tease';tz.setAttribute('role','status');tz.setAttribute('aria-label',boas.length+(boas.length>1?' cartas Raras ou melhores':' carta Rara ou melhor')+' na mesa');
        tz.innerHTML=boas.map(g=>`<i style="--tc:${RAR_LUZ[g.rar]}" title="${RAR_NOME[g.rar]}"></i>`).join('');el.appendChild(tz);
        const luzes=$$('i',tz);
        for(let k=0;k<luzes.length;k++){if(RV.skip)break;luzes[k].style.opacity=1;if(!RM)rvAnim(luzes[k],[{transform:'scale(0)',opacity:0},{transform:'scale(1.5)',opacity:1,offset:.6},{transform:'scale(1)',opacity:1}],{duration:260,fill:'backwards'});else luzes[k].style.opacity=1;sfx('luz',k);await rvWait(RM?60:200);}
      }
      if(RV.skip)return;
      RV.phase='virar';pararViv();
      hint.style.bottom='auto';hint.style.top='58px';hint.style.zIndex=11;hint.style.fontSize='15px';
      hint.textContent='Toque nas cartas para virar';
      bot.innerHTML=`<button class="btn gold md" data-rv="todas">Virar todas</button>`;
      setTimeout(()=>{try{cards[0].el.focus({preventScroll:true});}catch(e){}},30);
    }

    /* --- 5..7: virar, momento lendário, selos --- */
    async function virar(i,auto){
      const c=cards[i];if(!c||c.open||RV.phase!=='virar'||RV.lend)return;
      c.open=true;const g=c.g;
      if(g.rar==='lendaria'){await momentoLendario(c);}
      else{
        sfx('flip');
        if(g.rar==='epica'&&!auto2(auto)){await momentoEpica(c);}
        else if(RM){rvAnim(c.el,[{opacity:1},{opacity:.2}],{duration:100});await sleep(100);c.el.classList.add('open');rvAnim(c.el,[{opacity:.2},{opacity:1}],{duration:100});}
        else await virar3D(c);
        explosaoCarta(c);
        if(!RM&&typeof R3D!=='undefined'&&g.rar!=='epica')R3D.pular($('.rf .card',c.el),g.id,g.rar,{host:el});
      }
      c.el.setAttribute('aria-label',CARD[g.id].nome+', '+RAR_NOME[g.rar]+(g.nova?', nova!':', repetida')+(g.n>1?', '+g.n+' cópias':''));
      selo(c);
      if(cards.every(x=>x.open)){bot.innerHTML='';hint.textContent='';const tz=$('.tease',el);if(tz)tz.remove();await rvWait(600);if(!fechado&&RV.phase==='virar')resumo();}
    }
    function auto2(a){return false;} // a Épica tem o seu momento até no "Virar todas"
    /* virada 3D de verdade: a carta sobe, a borda acende na cor da raridade e a frente gira para a vista */
    async function virar3D(c){
      const fl=$('.flip',c.el),luz=RAR_LUZ[c.g.rar];
      rvAnim(c.el,[{transform:'none',filter:'none'},{transform:'translateY(-8px) scale(1.15)',filter:`drop-shadow(0 10px 8px rgba(0,0,0,.6)) drop-shadow(0 0 6px ${luz})`,offset:.45},{transform:'translateY(-4px) scale(1.12)',filter:`drop-shadow(0 6px 6px rgba(0,0,0,.5)) drop-shadow(0 0 10px ${luz})`,offset:.8},{transform:'none',filter:'none'}],{duration:520,easing:'ease-out'});
      await new Promise(r=>{const a=rvAnim(fl,[{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],{duration:380,easing:'cubic-bezier(.3,.1,.3,1)',delay:60});a.onfinish=r;});
      c.el.classList.add('open');
    }
    /* mini momento da Épica: vai ao centro em 1,4×, raios roxos, brilho holográfico e volta */
    async function momentoEpica(c){
      if(RM){c.el.classList.add('open');rvAnim(flash,[{opacity:0},{opacity:.08},{opacity:0}],{duration:300});return;}
      RV.lend=true;
      const r=c.el.getBoundingClientRect();
      const sp=document.createElement('div');sp.className='rvc espot';sp.style.cssText=`position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:22;margin:0`;
      sp.innerHTML=`<div class="flip"><div class="rb">${cardBackHTML()}</div><div class="rf">${cardHTML(c.g.id,{sz:'rv',lvl:s.cards[c.g.id]?s.cards[c.g.id].lvl:1,anim:true})}</div></div><div class="holo"></div>`;
      el.appendChild(sp);hydrate(sp);c.el.style.visibility='hidden';
      const rays=$('.rays',el);const rc0=el.style.getPropertyValue('--rc');el.style.setProperty('--rc','#C88BFF');rays.classList.add('on');
      rvAnim(rays,[{opacity:.18},{opacity:.6}],{duration:300,fill:'forwards'});
      const dx=window.innerWidth/2-(r.left+r.width/2),dy=window.innerHeight/2-(r.top+r.height/2);
      await new Promise(rr=>{rvAnim(sp,[{transform:'none'},{transform:`translate(${dx}px,${dy}px) scale(1.4)`}],{duration:320,easing:'cubic-bezier(.3,.8,.3,1)',fill:'forwards'}).onfinish=rr;});
      sfx('stinger','epica');
      await new Promise(rr=>{rvAnim($('.flip',sp),[{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],{duration:360,easing:'ease-in-out',fill:'forwards'}).onfinish=rr;});
      rvAnim(flash,[{opacity:0},{opacity:.18},{opacity:0}],{duration:220});
      const cr=sp.getBoundingClientRect();rvParticulas(el,cr.left+cr.width/2,cr.top+cr.height/2,['#E6CCFF','#B36BE8','#FFFFFF'],26,{dist:150,dur:800,z:23,sz:5});
      if(typeof R3D!=='undefined')R3D.pular($('.rf .card',sp),c.g.id,'epica',{host:el,z:24,k:2.2});
      const lb=document.createElement('div');lb.className='rlabel big';lb.textContent='ÉPICA!';lb.style.color='#D9A8FF';sp.appendChild(lb);
      rvAnim(lb,[{transform:'translate(-50%,10px) scale(.5)',opacity:0},{transform:'translate(-50%,-4px) scale(1.15)',opacity:1,offset:.4},{transform:'translate(-50%,-6px) scale(1)',opacity:1}],{duration:400,fill:'forwards'});
      rvAnim($('.holo',sp),[{backgroundPosition:'150% 0',opacity:0},{opacity:1,offset:.2},{backgroundPosition:'-50% 0',opacity:0}],{duration:900});
      await rvWait(1000);
      await new Promise(rr=>{rvAnim(sp,[{transform:`translate(${dx}px,${dy}px) scale(1.4)`},{transform:'none'}],{duration:300,easing:'ease-in-out',fill:'forwards'}).onfinish=rr;});
      rvAnim(rays,[{opacity:.6},{opacity:.18}],{duration:300,fill:'forwards'});el.style.setProperty('--rc',rc0||cor);
      sp.remove();c.el.style.visibility='';c.el.classList.add('open');RV.lend=false;
    }
    function explosaoCarta(c){
      const g=c.g,r=c.el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      sfx('stinger',g.rar);
      if(g.rar==='comum')rvParticulas(el,cx,cy,['#FFFFFF','#C9CFC9'],8,{dist:50,dur:400,z:12});
      else if(g.rar==='incomum')rvParticulas(el,cx,cy,['#9BFF8A','#5DBB63','#FFFFFF'],14,{dist:70,dur:600,z:12,sz:4});
      else{
        const ring=document.createElement('div');ring.className='ringx';ring.style.borderColor=RAR_COR[g.rar];ring.style.left=cx+'px';ring.style.top=cy+'px';ring.style.zIndex=12;el.appendChild(ring);
        if(RM){ring.style.opacity=.9;ring.style.transform='scale(1.6)';setTimeout(()=>ring.remove(),600);}
        else rvAnim(ring,[{transform:'scale(.4)',opacity:1},{transform:'scale(2.6)',opacity:0}],{duration:600,easing:'ease-out'}).onfinish=()=>ring.remove();
        const lb=document.createElement('div');lb.className='rlabel';lb.textContent=RAR_TXT[g.rar];lb.style.color=RAR_COR[g.rar];c.el.appendChild(lb);
        rvAnim(lb,[{transform:'translate(-50%,8px) scale(.6)',opacity:0},{transform:'translate(-50%,-6px) scale(1.15)',opacity:1,offset:.3},{transform:'translate(-50%,-10px)',opacity:1,offset:.8},{transform:'translate(-50%,-14px)',opacity:0}],{duration:900}).onfinish=()=>lb.remove();
        if(g.rar==='epica'){rvParticulas(el,cx,cy,['#E6CCFF','#B36BE8'],14,{dist:90,dur:700,z:12,sz:5});}
        else{rvParticulas(el,cx,cy,['#BFE6FA','#4C9BE8','#FFFFFF'],14,{dist:80,dur:600,z:12,sz:4});if(!RM)rvAnim(c.el,[{transform:'none'},{transform:'translateX(-4px) rotate(-2deg)'},{transform:'translateX(4px) rotate(2deg)'},{transform:'translateX(-2px)'},{transform:'none'}],{duration:260});}
      }
    }
    function selo(c){
      const g=c.g;
      if(g.nova){setTimeout(()=>{if(!fechado)sfx('nova');},RM?150:350);const b=document.createElement('span');b.className='badge-nova';b.textContent='NOVA!';c.el.appendChild(b);if(!RM)rvAnim(b,[{transform:'rotate(-12deg) scale(0)'},{transform:'rotate(-12deg) scale(1.3)',offset:.6},{transform:'rotate(-12deg) scale(1)'}],{duration:200});}
      else{const b=document.createElement('span');b.className='badge-mais num';b.textContent='+'+g.n;c.el.appendChild(b);}
      const inf=infoCopias(g.id);
      if(inf&&(!g.nova||g.n>1)){
        const p=document.createElement('div');p.className='lprog';
        p.innerHTML=inf.max?`${escH(CARD[g.id].nome)} · nível máximo`:`<span>${inf.copias}/${inf.precisa}${inf.pode?' · <b style="color:#9BFF8A">pode melhorar!</b>':''}</span><div class="bar green"><i style="width:${Math.min(1,inf.copias/inf.precisa)*100}%"></i></div>`;
        c.el.appendChild(p);
        const bi=$('.bar>i',p);if(bi&&!RM){const w=bi.style.width;bi.style.width='0%';setTimeout(()=>{bi.style.transition='width .5s ease-out';bi.style.width=w;},50);}
      }
    }
    /* momento lendário: a carta GRANDE (com texto) no centro, em escala inteira da arte (pixels iguais) */
    async function momentoLendario(c){
      RV.lend=true;hint.style.visibility='hidden';bot.style.visibility='hidden';
      const tz=$('.tease',el);if(tz)tz.style.visibility='hidden';
      const others=cards.filter(x=>x!==c);others.forEach(x=>x.el.classList.add('dimmed'));
      const g=c.g,nome=CARD[g.id].nome,inf=infoCopias(g.id);
      const r=c.el.getBoundingClientRect();
      const L=document.createElement('div');L.className='lspot';L.setAttribute('role','status');
      const infoH=`${g.nova?'<span class="tagn">NOVA!</span>':`<span class="tagm num">+${g.n} ${g.n>1?'cópias':'cópia'}</span>`}${inf&&!inf.max&&(!g.nova||g.n>1)?`<span>${inf.copias}/${inf.precisa}${inf.pode?' · <b style="color:#9BFF8A">pode melhorar!</b>':''}</span><div class="bar green"><i style="width:${Math.min(1,inf.copias/inf.precisa)*100}%"></i></div>`:''}`;
      L.innerHTML=`<div class="ltit">LENDÁRIA!</div><div class="lcw"><div class="flip"><div class="rb">${cardBackHTML()}</div><div class="rf">${cardHTML(g.id,{sz:'big',lvl:s.cards[g.id]?s.cards[g.id].lvl:1,anim:true})}</div></div></div><div class="lnm"></div><div class="linfo">${infoH}</div><div class="lcont">Toque para continuar</div>`;
      el.appendChild(L);hydrate(L);
      const tit=$('.ltit',L),cw=$('.lcw',L),fl=$('.flip',cw),rb=$('.rb',cw),rf=$('.rf',cw),nm=$('.lnm',L),info=$('.linfo',L),cont=$('.lcont',L);
      // tamanho natural da carta grande (236 de largura, arte 192×144 = 3× a arte de 64×48)
      const big=$('.card',rf);const w0=big.offsetWidth||236,h0=big.offsetHeight||360;
      // escolhe k com arte em escala inteira: 3k ∈ {2,3,4,5,6}
      const resto=(tit.offsetHeight||40)+(nm.offsetHeight||27)+(info.offsetHeight||34)+(cont.offsetHeight||18)+4*8+56+16+8;
      const cabeW=window.innerWidth*0.9,cabeH=Math.min(window.innerHeight*0.66,window.innerHeight-resto);
      let k=2/3;for(const kk of [2,5/3,4/3,1])if(w0*kk<=cabeW&&h0*kk<=cabeH){k=kk;break;}
      const W=Math.round(w0*k),H=Math.round(h0*k);
      cw.style.width=W+'px';cw.style.height=H+'px';
      fl.style.width=w0+'px';fl.style.height=h0+'px';
      rb.style.width=rf.style.width=w0+'px';rb.style.height=rf.style.height=h0+'px';
      fl.style.left=((W-w0)/2)+'px';fl.style.top=((H-h0)/2)+'px';fl.style.transform=`scale(${k})`;
      const virada=`scale(${k}) rotateY(180deg)`; // gira em torno do centro sem sair do lugar
      const rays=$('.rays',el);el.style.setProperty('--rc','#F2BE4A');
      const cr=cw.getBoundingClientRect();
      if(RM){
        // sem movimento: a carta grande aparece já de frente, com um leve brilho dourado (≤10%)
        fl.style.transform=virada;tit.style.visibility='visible';nm.textContent=nome;info.style.visibility='visible';
        flash.style.background='#F2BE4A';rvAnim(flash,[{opacity:0},{opacity:.1}],{duration:300,fill:'forwards'});
        rvAnim(L,[{opacity:0},{opacity:1}],{duration:250});
        rvAnim(rays,[{opacity:.18},{opacity:.3}],{duration:300,fill:'forwards'});
        sfx('stinger','lendaria');
      }else{
        // FLIP: começa exatamente onde a carta está na mesa e cresce até o centro
        const sx=r.width/W,dx=(r.left+r.width/2)-(cr.left+cr.width/2),dy=(r.top+r.height/2)-(cr.top+cr.height/2);
        c.el.style.visibility='hidden';
        rays.classList.add('on');rvAnim(rays,[{opacity:.18},{opacity:.75}],{duration:500,fill:'forwards'});
        await new Promise(rr=>{rvAnim(cw,[{transform:`translate(${dx}px,${dy}px) scale(${sx})`},{transform:'none'}],{duration:520,easing:'cubic-bezier(.3,.8,.3,1)'}).onfinish=rr;});
        sfx('rise');
        const sh=rvAnim(cw,[{transform:'translate(0,0)'},{transform:'translate(-3px,2px)'},{transform:'translate(3px,-2px)'},{transform:'translate(-2px,-3px)'},{transform:'translate(2px,3px)'}],{duration:70,iterations:9});
        rvAnim(cw,[{filter:'drop-shadow(0 0 0 #F2BE4A)'},{filter:'drop-shadow(0 0 22px #F2BE4A)'}],{duration:630,fill:'forwards'});
        await rvWait(630);try{sh.cancel();}catch(e){}
        flash.style.background='#fff';rvAnim(flash,[{opacity:0},{opacity:1,offset:.4},{opacity:0}],{duration:160});
        await new Promise(rr=>{rvAnim(fl,[{transform:`scale(${k})`},{transform:virada}],{duration:260,easing:'ease-in-out',fill:'forwards'}).onfinish=rr;});
        fl.style.transform=virada;
        sfx('fanfare');
        if(typeof R3D!=='undefined')R3D.pular($('.card',rf),g.id,'lendaria',{host:el,z:23,k:2.0});
        rvParticulas(el,window.innerWidth/2,window.innerHeight/2,['#F2BE4A','#FFE58A','#FFF0C0','#B9801C'],60,{confete:true,dur:2200,sz:4,z:21});
        const ring=$('.ringx',el);rvAnim(ring,[{transform:'scale(.6)',opacity:1},{transform:`scale(${1.2*Math.max(window.innerWidth,window.innerHeight)/100})`,opacity:0}],{duration:700,easing:'ease-out'});
        tit.style.visibility='visible';
        rvAnim(tit,[{transform:'translateY(-80px) scale(.6)',opacity:0},{transform:'translateY(6px) scale(1.1)',opacity:1,offset:.7},{transform:'none',opacity:1}],{duration:480,easing:'ease-out'});
        for(let q=1;q<=nome.length;q++){nm.textContent=nome.slice(0,q);await sleep(28);}
        info.style.visibility='visible';rvAnim(info,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:250});
        const bi=$('.bar>i',info);if(bi){const w=bi.style.width;bi.style.width='0%';setTimeout(()=>{bi.style.transition='width .5s ease-out';bi.style.width=w;},60);}
        await sleep(500);
      }
      cont.style.visibility='visible';
      await new Promise(res=>{const f=e=>{e.stopPropagation();e.preventDefault&&e.preventDefault();el.removeEventListener('click',f,true);document.removeEventListener('keydown',k2,true);res();};const k2=e=>{if(e.key===' '||e.key==='Enter'||e.key==='Escape'){f(e);}};el.addEventListener('click',f,true);document.addEventListener('keydown',k2,true);});
      // volta para a mesa
      const r2=c.el.getBoundingClientRect(),cr2=cw.getBoundingClientRect();
      tit.style.visibility=nm.style.visibility=info.style.visibility=cont.style.visibility='hidden';
      if(!RM){const dx2=(r2.left+r2.width/2)-(cr2.left+cr2.width/2),dy2=(r2.top+r2.height/2)-(cr2.top+cr2.height/2);
        await new Promise(rr=>{rvAnim(cw,[{transform:'none'},{transform:`translate(${dx2}px,${dy2}px) scale(${r2.width/W})`}],{duration:340,easing:'ease-in-out',fill:'forwards'}).onfinish=rr;});}
      rvAnim(flash,[{opacity:getComputedStyle(flash).opacity},{opacity:0}],{duration:200,fill:'forwards'});
      rvAnim(rays,[{opacity:RM?.3:.75},{opacity:.18}],{duration:300,fill:'forwards'});
      L.remove();flash.style.background='#fff';c.el.style.visibility='';c.el.classList.add('open');
      others.forEach(x=>x.el.classList.remove('dimmed'));if(tz)tz.style.visibility='';
      RV.lend=false;hint.style.visibility='';bot.style.visibility='';
      try{c.el.focus({preventScroll:true});}catch(e){}
    }
    async function virarTodas(){
      bot.innerHTML='';
      const ordem=cards.map((c,i)=>({c,i})).filter(x=>!x.c.open).sort((a,b)=>rIdx(a.c.g.rar)-rIdx(b.c.g.rar));
      for(const x of ordem){if(fechado||RV.phase!=='virar')return;await virar(x.i,true);await sleep(RM?120:250);}
    }

    /* --- 8: resumo --- */
    function resumo(){
      if(fechado)return;
      RV.phase='resumo';RV.skip=false;tiraDica();pararViv();
      for(const a of RV.anims)try{a.finish();}catch(e){}
      table.remove();bot.innerHTML='';hint.textContent='';
      obj.style.display='none';const gc=$('.gcount',el);if(gc)gc.remove();
      $('.rays',el).style.opacity='0.12';
      const ord=res.cards.slice().sort((a,b)=>rIdx(b.rar)-rIdx(a.rar)||CARD_ORDER[a.id]-CARD_ORDER[b.id]);
      const novas=res.cards.filter(c=>c.nova).length,rep=res.cards.reduce((a,c)=>a+c.n,0)-novas;
      const tipo=res.tipo;
      let outro='';
      if(isPack){
        if(s.pacotes[tipo]>0)outro=`<button class="btn gold md" data-rv="outro">Abrir próximo pacote</button>`;
        else{const P=PACKS[tipo];outro=s.grao>=P.preco?`<button class="btn gold md" data-rv="outro">Abrir outro (${P.preco} ${MOEC})</button>`:`<button class="btn md" disabled>Abrir outro (${P.preco} ${MOEC}) · ${MOEC} insuficientes</button>`;}
      }
      const guiaMelhorar=opts.guia&&s.guia===3;
      const R=document.createElement('div');R.className='resumo';
      R.innerHTML=`<h2>${isPack?'Seu pacote':escH(titulo)}</h2>
        ${!isPack?`<div class="rl" style="display:flex;gap:8px;align-items:center;font-size:18px;font-weight:800">${ic('coin',20)} <span class="num">+${fmt(res.grao)}</span> ${MOEC}</div>`:''}
        ${res.pacote?`<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center">${packImg('semente',22)}<b>+1 ${escH(PACKS.semente.nome)} → Seus pacotes</b><button class="btn gold small" data-rv="abrirPac">Abrir agora</button></div>`:''}
        <p class="sum">Novas: <span class="num">${novas}</span> · Repetidas: <span class="num">${rep}</span></p>
        <div class="rgrid">${ord.map(g=>{const inf=infoCopias(g.id);const hl=guiaMelhorar&&g.id==='espiga-sapeca';
          return `<div class="rcell"><button class="thumbb ${hl?'hl':''}" data-rv="carta" data-id="${g.id}" aria-label="${escH(CARD[g.id].nome)}">${cardHTML(g.id,{sz:'rv',lvl:inf?inf.lvl:1,anim:g.rar==='lendaria'||g.rar==='epica'})}${g.nova?'<span class="badge-nova">NOVA!</span>':'<span class="badge-mais num">+'+g.n+'</span>'}${g.n>1&&g.nova?`<span class="badge-x num">×${g.n}</span>`:''}</button>
            ${inf&&!inf.max?`<div class="lprog" style="position:static;width:100px"><span>${inf.copias}/${inf.precisa}${inf.pode?' · <b style="color:#9BFF8A">pode melhorar!</b>':''}</span><div class="bar green"><i style="width:${Math.min(1,inf.copias/inf.precisa)*100}%"></i></div></div>`:''}
            ${g.nova&&podePorNoDeck(g.id)&&!guiaMelhorar?`<button class="btn small" style="margin-top:0" data-rv="deck" data-id="${g.id}">Pôr no deck</button>`:''}</div>`;}).join('')}</div>
        <div class="racts">${outro}<button class="btn md" data-rv="colecao">Ver coleção</button><button class="btn md" data-rv="fechar">Fechar</button>${isPack?'<button class="tbtn" data-rv="chances">Ver chances</button>':''}</div>`;
      el.appendChild(R);hydrateGfx(R);
      if(!RM)$$('.rcell',R).forEach((c,i)=>c.animate([{transform:'translateY(20px)',opacity:0},{transform:'none',opacity:1}],{duration:250,delay:i*40,fill:'backwards'}));
      if(RV.pulou&&res.cards.some(c=>c.rar==='lendaria')){flash.style.background='#F2BE4A';flash.animate([{opacity:0},{opacity:.45},{opacity:0}],{duration:800});sfx('stinger','lendaria');}
      setTimeout(()=>{const f=$('[data-rv="carta"].hl',R)||$('.racts .btn',R);try{f&&f.focus({preventScroll:true});}catch(e){}},60);
      if(guiaMelhorar){vovo('Ó, meu filho: toque para melhorar!',{pos:'bottom',ok:false});const h=$('[data-rv="carta"].hl',R);if(h)setTimeout(()=>h.scrollIntoView({block:'center'}),100);}
    }
    function pular(){
      if(RV.phase==='resumo'||fechado)return;
      if(RV.lend)return;
      RV.skip=true;RV.pulou=true;tiraDica();
      for(const a of RV.anims)try{a.finish();}catch(e){}
      resumo();
    }

    /* --- cliques e teclas --- */
    el.addEventListener('click',async e=>{
      const b=e.target.closest('[data-rv]');
      if(b){
        const a=b.dataset.rv;
        if(a==='pular'){pular();return;}
        if(a==='todas'){virarTodas();return;}
        if(a==='fechar'){fechar();return;}
        if(a==='colecao'){fechar(()=>{UI.tab='cartas';UI.sub='colecao';refresh();});return;}
        if(a==='outro'){fechar(()=>{if(s.pacotes[res.tipo]>0)abrirGuardadoFlow(res.tipo);else comprarPacoteFlow(res.tipo);});return;}
        if(a==='abrirPac'){fechar(()=>abrirGuardadoFlow('semente'));return;}
        if(a==='chances'){fechar(()=>{UI.tab='loja';UI.odds[isPack?res.tipo:'semente']=true;refresh();});return;}
        if(a==='deck'){const r=porNoDeck(b.dataset.id);toastDeck(b.dataset.id,r);b.remove();return;}
        if(a==='carta'){const id=b.dataset.id;
          if(opts.guia&&s.guia===3){if(id!=='espiga-sapeca'){vovoShake();return;}fechar(()=>abrirDetalhe('espiga-sapeca',{guia:true}));return;}
          abrirDetalhe(id);return;}
        return;
      }
      const cb=e.target.closest('.rvc');
      if(cb&&RV.phase==='virar'){virar(+cb.dataset.i);return;}
      if(RV.phase==='auto')rvAcelera();
    });
    const onKey=e=>{
      if(!el.isConnected)return;
      if(OVS[OVS.length-1]&&OVS[OVS.length-1].el!==el)return;
      if(e.key==='Escape'){e.preventDefault();if(RV.phase==='resumo')fechar();else pular();return;}
      const isBtn=document.activeElement&&document.activeElement.tagName==='BUTTON'&&el.contains(document.activeElement);
      if((e.key===' '||e.key==='Enter')&&isBtn)return;
      if(e.key===' '||e.key==='Enter'){
        if(RV.phase==='toque'){e.preventDefault();toque();return;}
        if(RV.phase==='auto'){e.preventDefault();rvAcelera();return;}
        if(RV.phase==='virar'&&!isBtn){e.preventDefault();const i=cards.findIndex(c=>!c.open);if(i>=0)virar(i);}
      }
    };
    document.addEventListener('keydown',onKey,true);
  });
}

