/* ===================== v10: VILA DAS LENDAS em 3D (diorama) =====================
   vila3dMontar(canvas,niveis) — gancho de 84-ralos-ui (Agente 2): desenha a Vila numa ilhota à noite, com a FOGUEIRA no
   meio e as 4 construções em volta: Torre do Vigia (Sertão), Casa de Farinha (Mata), Ancoradouro (Águas) e Mirante da
   Lua (Noite). Cada nível acrescenta um passo visível (spec v10, 9.4):
     L1 alicerce e esteios · L2 paredes e telhado · L3 a peça-assinatura (sino / forno com fumaça / píer com canoa /
     luneta e lua) · L4 luzes e bandeiras na cor do reino · L5 a lenda que brilha (Boitatá enrolado na torre, Caipora
     na casa de farinha, olhos da Boiúna na água, Mula com a cabeça em chamas no mirante). A Fogueira no L5 queima em 4 cores.
   Ao subir um nível (a aba redesenha), as peças novas "pulam" no lugar (1,2 s). Tocar numa construção abre a folha dela.
   Um WebGLRenderer só (guardado entre montagens), desenhando fora da tela e copiando para o canvas da aba (2D).
   Sem THREE/WebGL: lança erro e a aba usa o diorama 2D (vila2d). Movimento reduzido: um quadro parado. */
const V3D={r:null,cv:null,raf:0,cena:null,cam:null,alvo:null,amb:[],ult:null,t0:0,anim:[],ancoras:{},falhou:false};
function vila3dMontar(cv,niveis){
  const T=window.THREE;if(!T||V3D.falhou)throw new Error('sem 3D');
  niveis=niveis||{};const N=p=>Math.max(0,Math.min(5,niveis[p]|0));
  if(!V3D.r){
    const c=document.createElement('canvas');
    const r=new T.WebGLRenderer({canvas:c,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
    if(!r.getContext())throw new Error('sem contexto');
    r.outputEncoding=T.sRGBEncoding;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.15;r.debug.checkShaderErrors=false;
    c.addEventListener('webglcontextlost',e=>{e.preventDefault();V3D.falhou=true;},false);
    V3D.r=r;V3D.cv=c;
  }
  const r=V3D.r,W=cv.width||720,H=cv.height||400;
  r.setPixelRatio(1);r.setSize(W,H,false);
  if(V3D.cena)vila3dDescartar(V3D.cena);
  const sc=new T.Scene();V3D.cena=sc;V3D.amb=[];V3D.anim=[];V3D.ancoras={};
  sc.background=new T.Color('#120E24');sc.fog=new T.Fog('#1A1430',14,30);
  const cam=new T.PerspectiveCamera(32,W/H,0.1,80);cam.position.set(0,7.0,12.9);cam.lookAt(0,0.6,0.2);V3D.cam=cam;
  // céu: degradê + lua + estrelas
  const ceu=new T.Mesh(new T.SphereGeometry(40,24,12),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,
    uniforms:{a:{value:new T.Color('#0A0820')},b:{value:new T.Color('#3A2A5E')}},vertexShader:'varying float vy;void main(){vy=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform vec3 a;uniform vec3 b;varying float vy;void main(){gl_FragColor=vec4(mix(b,a,smoothstep(-0.05,0.5,vy)),1.0);\n#include <encodings_fragment>\n}'}));sc.add(ceu);
  {const n=120,p=new Float32Array(n*3);for(let k=0;k<n;k++){const a=Math.random()*6.283,e=0.05+Math.random()*0.9;p.set([Math.cos(a)*Math.cos(e)*30,Math.sin(e)*30,Math.sin(a)*Math.cos(e)*30-8],k*3);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));sc.add(new T.Points(g,new T.PointsMaterial({color:'#FFF6D8',size:1.6,sizeAttenuation:false,fog:false})));}
  // luzes: lua fria + fogueira quente (mais forte com o nível da Fogueira)
  const nf=N('fogueira');
  sc.add(new T.HemisphereLight('#7A80D0','#2A1A14',0.75));
  const lua=new T.DirectionalLight('#B8C4FF',0.7);lua.position.set(-6,10,4);sc.add(lua);
  const fogo=new T.PointLight('#FF9A40',nf?1.4+nf*0.35:0.25,16,1.6);fogo.position.set(0,1.3,0.3);sc.add(fogo);
  V3D.amb.push(t=>{fogo.intensity=(nf?1.4+nf*0.35:0.25)*(1+Math.sin(t*11)*0.06+Math.sin(t*17)*0.04);});
  const raiz=new T.Group();sc.add(raiz);
  vila3dIlha(raiz,T);
  const ant=V3D.ult;V3D.ult=Object.assign({},niveis);
  const ord=[['fogueira',0,0.3,0],['sertao',-3.7,-1.5,0.35],['mata',3.5,-1.7,-0.4],['aguas',3.7,2.0,-0.9],['noite',-3.6,2.0,0.7]];
  for(const [p,x,z,ry] of ord){const n=N(p);const g=new T.Group();g.position.set(x,0,z);g.rotation.y=ry;raiz.add(g);V3D.ancoras[p]=new T.Vector3(x,1.2,z);
    const novo=ant&&n>(ant[p]|0)?n:0;vila3dPredio(g,p,n,novo,T);}
  // tudo em 3 tons como o palco
  if(typeof p3dToonTudo==='function')try{p3dToonTudo(raiz);}catch(e){}
  // laço
  V3D.t0=performance.now();V3D.alvo=cv;
  const g2=cv.getContext('2d');
  const quadro=now=>{V3D.raf=0;if(V3D.alvo!==cv||!cv.isConnected||V3D.falhou)return;
    const t=(typeof RM!=='undefined'&&RM)?2:(now-V3D.t0)/1000;
    for(const f of V3D.amb)f(t);
    for(const a of V3D.anim){const k=Math.max(0,Math.min(1,(t-a.at)/0.45));const e=k<1?1+2.2*Math.pow(k-1,3)+1.2*Math.pow(k-1,2):1;a.o.scale.setScalar(Math.max(0.001,e));}
    r.render(sc,cam);g2.drawImage(V3D.cv,0,0,W,H);
    if(typeof RM!=='undefined'&&RM)return;
    if(!document.hidden&&cv.offsetParent!==null)V3D.raf=requestAnimationFrame(n2=>setTimeout(()=>quadro(n2),16));
    else setTimeout(()=>{if(!V3D.raf)V3D.raf=requestAnimationFrame(quadro);},500);};
  if(V3D.raf)cancelAnimationFrame(V3D.raf);V3D.raf=requestAnimationFrame(quadro);
  quadro(performance.now());
  // tocar numa construção abre a folha dela
  cv.style.cursor='pointer';
  cv.addEventListener('click',ev=>{const rc=cv.getBoundingClientRect();const mx=(ev.clientX-rc.left)/rc.width,my=(ev.clientY-rc.top)/rc.height;let melhor=null,d0=0.16;
    for(const p in V3D.ancoras){const v=V3D.ancoras[p].clone().project(cam);const sx=(v.x+1)/2,sy=(1-v.y)/2;const d=Math.hypot((sx-mx)*1.8,sy-my);if(d<d0){d0=d;melhor=p;}}
    if(melhor&&typeof abrirPredio==='function')abrirPredio(melhor);});
  return true;
}
function vila3dDescartar(o){o.traverse(m=>{if(m.geometry)try{m.geometry.dispose();}catch(e){}if(m.material){for(const x of (Array.isArray(m.material)?m.material:[m.material]))try{if(x.map)x.map.dispose();x.dispose();}catch(e){}}});}
/* a ilhota: topo de terra e grama, beirada de pedra, um laguinho para o ancoradouro */
function vila3dIlha(raiz,T){
  const M=(c,o)=>{o=o||{};const m=new T.MeshStandardMaterial({color:c,roughness:o.r==null?0.85:o.r,flatShading:!!o.flat});if(o.emi){m.emissive=new T.Color(o.emi);m.emissiveIntensity=o.ei||1;}if(o.vc)m.vertexColors=true;return m;};
  const L=[];const P=(g,x,y,z,rx,ry,rz,sx,sy,sz,c)=>p3dPeca(L,g,x,y,z,rx,ry,rz,sx,sy,sz,c);
  P(new T.CylinderGeometry(1,0.94,1,48),0,-0.25,0.2,0,0,0,6.6,0.5,4.6,'#2E3A26');
  P(new T.CylinderGeometry(1,0.6,1,48),0,-1.1,0.2,0,0,0,6.3,1.3,4.4,'#4A3626');
  P(new T.ConeGeometry(1,1,24),0,-2.6,0.2,Math.PI,0,0,3.8,1.8,2.6,'#2E2218');
  // trilhas de terra batida até a fogueira
  for(const [x,z] of [[-3.7,-1.5],[3.5,-1.7],[3.7,2.0],[-3.6,2.0]]){const d=Math.hypot(x,z-0.3),a=Math.atan2(x,z-0.3);P(new T.BoxGeometry(1,1,1),x/2,0.005,(z+0.3)/2,0,a,0,0.7,0.02,d,'#5A4430');}
  P(new T.CylinderGeometry(1,1,1,32),0,0.01,0.3,0,0,0,1.5,0.02,1.5,'#5A4430');
  // tufos e pedras
  const rnd=p3dRng(4040);
  for(let k=0;k<26;k++){const a=rnd()*6.283,d=1.9+rnd()*3.8;const x=Math.cos(a)*d*1.3,z=0.2+Math.sin(a)*d*0.85;if(Math.abs(x)>6||Math.abs(z-0.2)>4.2)continue;
    if(k%3)P(new T.IcosahedronGeometry(1,1),x,0.08,z,0,0,0,0.22,0.16,0.22,k%2?'#3A5A30':'#2E4A28');else P(new T.DodecahedronGeometry(1,0),x,0.06,z,0.3,rnd()*3,0,0.16,0.12,0.14,'#5A5468');}
  const m=new T.Mesh(p3dJuntar(L),M('#FFFFFF',{vc:true}));raiz.add(m);
  // laguinho (Águas)
  const ag=new T.Mesh(new T.CircleGeometry(1,32),new T.MeshStandardMaterial({color:'#1E5A6A',roughness:0.15,metalness:0.1,emissive:'#0A2A3A',emissiveIntensity:0.5}));ag.rotation.x=-Math.PI/2;ag.scale.set(1.8,1.3,1);ag.position.set(5.0,0.02,3.0);raiz.add(ag);V3D.agua=ag;
}
/* uma construção: n = nível (0..5); novo = nível que acabou de subir (as peças dele pulam no lugar) */
function vila3dPredio(g,p,n,novo,T){
  const cor={fogueira:'#B08A5A',sertao:'#E8862E',mata:'#3FA34D',aguas:'#2E9FB5',noite:'#7B5BD6'}[p];
  const cores={fogueira:['#FF7A2A','#FFD040'],sertao:['#E8862E','#FFC060'],mata:['#3FA34D','#B8F070'],aguas:['#2E9FB5','#A8F0FF'],noite:['#7B5BD6','#D8C8FF']}[p];
  const etapa=(k)=>{const L=[],E=[];return {L,E,P:(geo,x,y,z,rx,ry,rz,sx,sy,sz,c)=>p3dPeca(L,geo,x,y,z,rx,ry,rz,sx,sy,sz,c),B:(geo,x,y,z,sx,sy,sz,c)=>p3dPeca(E,geo,x,y,z,0,0,0,sx,sy,sz,c),k};};
  const fecha=(e)=>{const grp=new T.Group();if(e.L.length){grp.add(new T.Mesh(p3dJuntar(e.L),new T.MeshStandardMaterial({vertexColors:true,roughness:0.82})));}
    if(e.E.length){grp.add(new T.Mesh(p3dJuntar(e.E),new T.MeshBasicMaterial({vertexColors:true,toneMapped:false})));}
    g.add(grp);if(e.k===novo&&!(typeof RM!=='undefined'&&RM)){grp.scale.setScalar(0.001);V3D.anim.push({o:grp,at:0.15+V3D.anim.length*0.18});}return grp;};
  const G=p3dGeo(),cx=new T.BoxGeometry(1,1,1),cil=new T.CylinderGeometry(1,1,1,12),cone4=new T.ConeGeometry(1,1,4),esf=new T.SphereGeometry(1,14,10);
  const madeira='#6A4A30',mad2='#8A6440',pedra='#6E6A74',taipa='#A08868',palha='#B8984E';
  const chama=(x,y,z,s,c1,c2,lista)=>{const m1=new T.MeshBasicMaterial({color:c1,toneMapped:false}),m2=new T.MeshBasicMaterial({color:c2,toneMapped:false});
    const a=new T.Mesh(new T.ConeGeometry(0.22*s,0.75*s,8),m1),b=new T.Mesh(new T.ConeGeometry(0.13*s,0.5*s,8),m2);a.position.set(x,y+0.36*s,z);b.position.set(x,y+0.27*s,z+0.02);(lista||g).add(a);(lista||g).add(b);
    V3D.amb.push(t=>{const f=1+Math.sin(t*9+x*3)*0.1;a.scale.set(1,f+Math.sin(t*7)*0.08,1);b.scale.set(1,1.1-Math.sin(t*8+1)*0.12,1);a.rotation.y=t;b.rotation.y=-t*1.3;});return [a,b];};
  const fumaca=(x,y,z,cor)=>{const n=10,p=new Float32Array(n*3),gm=new T.BufferGeometry();gm.setAttribute('position',new T.BufferAttribute(p,3));
    const pts=new T.Points(gm,new T.PointsMaterial({color:cor||'#C8C0B8',size:0.5,transparent:true,opacity:0.35,depthWrite:false,map:vila3dBrilho(T)}));pts.frustumCulled=false;g.add(pts);
    V3D.amb.push(t=>{for(let i=0;i<n;i++){const f=((t*0.35+i/n)%1);p.set([x+Math.sin(t+i)*0.15*f,y+f*2.2,z+Math.cos(t*0.7+i)*0.1*f],i*3);}gm.attributes.position.needsUpdate=true;});};
  const halo=(x,y,z,c,s)=>{const sp=new T.Sprite(new T.SpriteMaterial({map:vila3dBrilho(T),color:c,transparent:true,blending:T.AdditiveBlending,depthWrite:false,opacity:0.9}));sp.position.set(x,y,z);sp.scale.set(s,s,1);g.add(sp);return sp;};
  const bandeira=(e,x,h,z,c)=>{e.P(cil,x,h/2,z,0,0,0,0.035,h,0.035,madeira);e.P(cx,x+0.16,h-0.18,z,0,0,0,0.3,0.3,0.015,c);e.P(G.tri,x+0.16,h-0.33,z,0,0,0,0.3,0.14,1,c);};
  const lanterna=(e,x,y,z,c)=>{e.P(cx,x,y+0.12,z,0,0,0,0.12,0.03,0.12,'#2A1E18');e.B(esf,x,y,z,0.08,0.1,0.08,c);halo(x,y,z,c,0.9);};
  // ---- L0: só o terreno marcado (pedrinhas em roda) ----
  if(n===0){const e=etapa(0);for(let k=0;k<10;k++){const a=k/10*6.283;e.P(G.pedra,Math.cos(a)*0.9,0.04,Math.sin(a)*0.75,0,a,0,0.09,0.06,0.08,'#4A4652');}fecha(e);
    if(p==='fogueira'){const e2=etapa(0);for(let k=0;k<5;k++){const a=k/5*6.283;e2.P(cil,Math.cos(a)*0.2,0.06,Math.sin(a)*0.2,Math.sin(a)*1.2,0,Math.cos(a)*1.2,0.04,0.5,0.04,'#3A2A20');}fecha(e2);}
    return;}
  if(p==='fogueira'){
    {const e=etapa(1);for(let k=0;k<10;k++){const a=k/10*6.283;e.P(G.pedra,Math.cos(a)*0.55,0.08,Math.sin(a)*0.55,0,a,0,0.14,0.1,0.13,pedra);}for(let k=0;k<6;k++){const a=k/6*6.283;e.P(cil,Math.cos(a)*0.16,0.16,Math.sin(a)*0.16,Math.sin(a)*1.1,0,Math.cos(a)*1.1,0.05,0.7,0.05,'#4A3020');}fecha(e);}
    if(n<5)chama(0,0.05,0,1+n*0.12,'#FF7A2A','#FFD040');
    else{const cs=[['#E8862E','#FFC060'],['#3FA34D','#B8F070'],['#2E9FB5','#A8F0FF'],['#7B5BD6','#D8C8FF']];cs.forEach(([a,b],i)=>{const an=i/4*6.283;chama(Math.cos(an)*0.14,0.05,Math.sin(an)*0.14,1.15,a,b);});}
    halo(0,0.6,0,n>=5?'#FFFFFF':'#FFB040',2.2+n*0.3);
    if(typeof p3dBrasas==='function'){/* faíscas do palco precisam do P3D.amb; aqui, um Points próprio */}
    if(n>=2){const e=etapa(2);for(let k=0;k<4;k++){const a=k/4*6.283+0.4;e.P(cil,Math.cos(a)*1.25,0.14,Math.sin(a)*1.0,0,-a,Math.PI/2,0.12,0.75,0.12,mad2);}fecha(e);}
    if(n>=3){const e=etapa(3);// o cordel: barbante com folhetos entre dois mourões (Livro de Causos)
      e.P(cil,-1.0,0.55,-0.95,0,0,0,0.04,1.1,0.04,madeira);e.P(cil,1.0,0.55,-0.95,0,0,0,0.04,1.1,0.04,madeira);e.P(cx,0,1.03,-0.95,0,0,0,2.0,0.012,0.012,'#E8D8B0');
      const fc=['#E8862E','#3FA34D','#2E9FB5','#7B5BD6','#B08A5A'];for(let k=0;k<5;k++)e.P(cx,-0.72+k*0.36,0.86,-0.95,0,0,(k%2?0.08:-0.08),0.24,0.32,0.015,k%2?'#EFE2C4':'#E2D2B0'),e.P(cx,-0.72+k*0.36,0.92,-0.94,0,0,0,0.16,0.08,0.01,fc[k]);fecha(e);}
    if(n>=4){const e=etapa(4);const cs=['#E8862E','#3FA34D','#2E9FB5','#7B5BD6','#F2C230'];
      for(const [a,b] of [[[-1.4,1.2],[1.4,1.2]],[[-1.4,-0.6],[1.4,-0.6]]]){e.P(cil,a[0],0.8,a[1],0,0,0,0.035,1.6,0.035,madeira);e.P(cil,b[0],0.8,b[1],0,0,0,0.035,1.6,0.035,madeira);
        p3dBandeiras(e.L,a[0],1.55,a[1],b[0],1.55,b[1],10,cs,0.25,0.12);}
      lanterna(e,-1.4,1.62,1.2,'#FFC860');lanterna(e,1.4,1.62,1.2,'#FFC860');fecha(e);}
    return;
  }
  // ---- as 4 construções ----
  const e1=etapa(1);
  e1.P(cx,0,0.06,0,0,0,0,1.5,0.12,1.2,pedra);
  for(const [x,z] of [[-0.62,-0.48],[0.62,-0.48],[-0.62,0.48],[0.62,0.48]])e1.P(cx,x,0.7,z,0,0,0,0.1,1.2,0.1,madeira);
  if(n===1){e1.P(cx,0,1.3,-0.48,0,0,0,1.35,0.08,0.08,madeira);e1.P(cx,0,1.3,0.48,0,0,0,1.35,0.08,0.08,madeira);e1.P(cx,0,1.0,0.49,0,0,0.6,1.4,0.06,0.05,mad2);}
  fecha(e1);
  if(n>=2){const e=etapa(2);
    if(p==='sertao'){ // torre de taipa e madeira
      e.P(cx,0,1.1,0,0,0,0,1.25,2.0,1.0,taipa);e.P(cx,0,2.15,0,0,0,0,1.45,0.12,1.2,madeira);e.P(cone4,0,2.55,0,0,Math.PI/4,0,1.0,0.7,0.85,'#8A4A2A');
      e.P(cx,0,0.45,0.505,0,0,0,0.3,0.7,0.02,'#2A1A12');e.P(cx,0,1.55,0.505,0,0,0,0.3,0.3,0.02,'#2A1A12');}
    else if(p==='mata'){ // casa de farinha: paredes de taipa, telhado de palha comprido
      e.P(cx,0,0.62,0,0,0,0,1.35,1.0,1.05,taipa);e.P(cone4,0,1.45,0,0,Math.PI/4,0,1.25,0.75,1.05,palha);e.P(cx,-0.3,0.4,0.53,0,0,0,0.32,0.65,0.02,'#2A1A12');}
    else if(p==='aguas'){ // ancoradouro: casinha de palafita no seco + deque
      e.P(cx,0,0.62,0,0,0,0,1.15,0.95,0.95,'#7A5A3A');e.P(cone4,0,1.35,0,0,Math.PI/4,0,1.05,0.6,0.95,palha);for(let k=0;k<5;k++)e.P(cx,0.55+k*0.24,0.22,0.0,0,0,0,0.22,0.05,0.8,mad2);}
    else{ // mirante: plataforma alta com teto aberto
      e.P(cx,0,1.25,0,0,0,0,1.4,0.1,1.15,mad2);for(const [x,z] of [[-0.6,-0.45],[0.6,-0.45],[-0.6,0.45],[0.6,0.45]])e.P(cx,x,1.75,z,0,0,0,0.08,1.0,0.08,madeira);
      e.P(cone4,0,2.55,0,0,Math.PI/4,0,1.15,0.6,0.95,'#3E3466');e.P(cx,0,1.45,0.55,0,0,0,1.3,0.06,0.04,madeira);for(let k=0;k<5;k++)e.P(cx,0.2,0.2+k*0.22,0.75,0,0,0,0.5,0.04,0.18,mad2);}
    fecha(e);}
  if(n>=3){const e=etapa(3);
    if(p==='sertao'){e.P(cil,0,2.4,0,0,0,0,0.04,0.3,0.04,madeira);e.P(new T.ConeGeometry(0.2,0.3,12,1,true),0,2.25,0,0,0,0,1,1,1,'#E8B84A');e.P(esf,0,2.1,0,0,0,0,0.05,0.05,0.05,'#8A6A2A');}
    else if(p==='mata'){e.P(esf,0.95,0.3,0.25,0,0,0,0.42,0.38,0.4,'#B8643A');e.P(cil,0.95,0.6,0.25,0,0,0,0.12,0.25,0.12,'#A0542E');e.B(cx,0.95,0.18,0.62,0.16,0.12,0.02,'#FF8A30');fumaca(0.95,0.75,0.25);}
    else if(p==='aguas'){for(let k=0;k<4;k++)e.P(cil,1.85+k*0.28,0.1,-0.42+(k%2)*0.84,0,0,0,0.04,0.4,0.04,madeira);for(let k=0;k<5;k++)e.P(cx,1.75+k*0.24,0.24,0,0,0,0,0.22,0.05,0.85,mad2);
      e.P(esf,2.5,0.08,-0.5,0,0.2,0,0.6,0.1,0.15,'#6A4428');e.P(esf,2.5,0.11,-0.5,0,0.2,0,0.53,0.05,0.11,'#3A2414');}
    else{e.P(cil,0.25,1.75,0.1,0,0,-0.7,0.06,0.7,0.06,'#C8A060');e.P(cil,0.5,1.97,0.1,0,0,-0.7,0.09,0.1,0.09,'#2A2230');e.P(cil,0.05,1.5,0.1,0,0,0,0.025,0.5,0.025,'#2A2230');
      const l=new T.Mesh(new T.SphereGeometry(0.35,16,12),new T.MeshBasicMaterial({color:'#F4F0D8',toneMapped:false}));l.position.set(1.6,4.4,-1.6);g.add(l);halo(1.6,4.4,-1.6,'#C8D0FF',2.6);}
    fecha(e);}
  if(n>=4){const e=etapa(4);
    bandeira(e,-0.85,p==='sertao'?2.6:2.0,0.55,cor);bandeira(e,0.85,p==='sertao'?2.6:2.0,-0.55,cor);
    const y=p==='noite'?2.2:p==='sertao'?2.1:1.25;lanterna(e,-0.7,y,0.62,cores[1]);lanterna(e,0.7,y,0.62,cores[1]);
    fecha(e);}
  if(n>=5){const e=etapa(5);
    if(p==='sertao'){ // Boitatá: a cobra de fogo enrolada na torre, de olhos grandes
      const m=new T.MeshBasicMaterial({color:'#FF8A30',toneMapped:false});const pts=[];for(let k=0;k<=60;k++){const f=k/60,a=f*6.283*1.6;pts.push(new T.Vector3(Math.cos(a)*0.8,0.3+f*1.9,Math.sin(a)*0.68));}
      const tb=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),80,0.07,8),m);g.add(tb);const hd=pts[pts.length-1];
      for(const s of [-1,1])e.B(esf,hd.x+s*0.08,hd.y+0.05,hd.z+0.12,0.06,0.06,0.06,'#FFF6C0');halo(hd.x,hd.y,hd.z,'#FF8A30',1.4);
      V3D.amb.push(t=>{m.color.setHSL(0.07+Math.sin(t*3)*0.02,1,0.55+Math.sin(t*5)*0.08);});}
    else if(p==='mata'){ // Caipora montada no caititu (silhueta escura de olhos verdes)
      const x=-0.95,z=0.75;e.P(esf,x,0.28,z,0,0,0,0.32,0.2,0.18,'#2A2018');e.P(esf,x+0.32,0.3,z,0,0,0,0.13,0.11,0.11,'#2A2018');for(const [a,b] of [[-0.15,-0.08],[-0.15,0.08],[0.15,-0.08],[0.15,0.08]])e.P(cil,x+a,0.1,z+b,0,0,0,0.03,0.2,0.03,'#2A2018');
      e.P(cil,x,0.6,z,0,0,0,0.1,0.42,0.1,'#24301C');e.P(esf,x,0.88,z,0,0,0,0.12,0.13,0.12,'#24301C');e.P(cone4,x,1.02,z,0,0,0,0.12,0.12,0.12,'#C84A2A');
      for(const s of [-1,1])e.B(esf,x+0.06,0.9,z+s*0.04,0.022,0.022,0.022,'#9BFF6A');halo(x,0.8,z,'#7FE07F',1.6);}
    else if(p==='aguas'){ // olhos da Boiúna na água (luz de navio) e as costas da cobra
      for(const s of [-1,1])e.B(esf,1.4+s*0.2,0.06,-1.2,0.12,0.06,0.09,'#FFF4C0');halo(1.4,0.15,-1.2,'#FFE890',2.0);
      for(let k=0;k<3;k++)e.P(new T.TorusGeometry(0.25,0.08,8,16,Math.PI),1.9+k*0.35,0.0,-1.0+k*0.05,0,0.3,0,0.8,0.8,0.8,'#1E2A2A');
      V3D.amb.push(t=>{if(V3D.agua)V3D.agua.material.emissiveIntensity=0.5+Math.sin(t*1.5)*0.2;});}
    else{ // Mula sem Cabeça: corpo escuro, fogo no lugar da cabeça
      const x=0.95,z=0.8;e.P(cx,x,0.42,z,0,0.4,0,0.6,0.28,0.24,'#2A2024');for(const [a,b] of [[-0.22,-0.08],[-0.22,0.08],[0.22,-0.08],[0.22,0.08]])e.P(cil,x+a,0.15,z+b,0,0,0,0.035,0.32,0.035,'#2A2024');
      e.P(cil,x+0.3,0.62,z+0.12,0,0,-0.6,0.07,0.3,0.07,'#2A2024');fecha(e);chama(x+0.4,0.68,z+0.15,0.75,'#FF6A1A','#FFD040');halo(x+0.4,0.95,z+0.15,'#FF7A2A',1.5);return;}
    fecha(e);}
}
function vila3dBrilho(T){if(V3D.tex)return V3D.tex;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.3,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);
  V3D.tex=new T.CanvasTexture(c);V3D.tex.userData.fica=true;return V3D.tex;}

