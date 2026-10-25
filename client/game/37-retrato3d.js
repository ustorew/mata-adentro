/* ===================== v9: RETRATOS 3D fora da batalha (window.R3D) =====================
   UM WebGLRenderer só, num canvas fora do DOM (1024×1024, nunca muda de tamanho: cada desenho usa um pedaço dele
   com viewport+scissor e é copiado para um canvas 2D). Ele desenha:
   - o retrato de cada carta: o modelo window.CHAR3D[id] numa pose de idle, em cima de um fundo pintado do terreno e
     da raridade, câmera 3/4 enquadrada na caixa do modelo. O resultado vira um canvas 2D guardado em cache (id+tamanho)
     e é copiado para cada <canvas class="art" data-art=id> (a tag continua a mesma: o DOM dos testes não muda);
   - bustos do herói e dos rivais (CHAR3D['heroi-voce'], 'mentora-zinha', 'rival-<key>') quando existirem (m3d-g.js);
   - pacotes e baús feitos em código (imagens paradas + as versões vivas da abertura, ver 70-reveal.js);
   - o "pulo" do personagem para fora da carta virada e a arte viva da carta em destaque (detalhe, mão selecionada).
   Fila preguiçosa: só o que está na tela (IntersectionObserver) e poucos por vez (orçamento de tempo por passo).
   Sem THREE, sem WebGL, contexto perdido ou modelo ausente/quebrado: a arte em pixel de sempre (30-gfx.js). */
/* v10: visual e acessório do herói equipados (Mascate/Vila) → opções do CHAR3D['heroi-voce'] e sufixo de cache */
function heroiVisual(){try{const u=typeof s!=='undefined'&&s&&s.cosm&&s.cosm.usa;if(!u)return null;const h=typeof u.heroi==='string'?u.heroi:'',a=typeof u.acessorio==='string'?u.acessorio:'';return h||a?{heroi:h||undefined,acessorio:a||undefined}:null;}catch(e){return null;}}
function heroiVisualK(){const v=heroiVisual();return v?'|v'+(v.heroi||'')+'+'+(v.acessorio||''):'';}
const R3D=(function(){
  const S={ok:null,T:null,r:null,cv:null,SZ:1024,soft:false,cena:null,cam:null,sombra:null,env:null,
    cache:new Map(),fundos:new Map(),reg:new Set(),vis:new Set(),io:null,tm:0,lru:[],falhou:new Set(),
    st:{n:0,ms:0,hit:0,t0:0},texs:{},packs:{},baus:{},vivoArte:null,vivoTm:0,pops:new Set(),raf:0,vivos:new Set()};
  const BUSTO=id=>/^(rival-|heroi-|mentora-)/.test(id);
  const sem=()=>(typeof RM!=='undefined'&&RM);
  /* ---------- arranque ---------- */
  function iniciar(){
    if(S.ok!==null)return S.ok;
    S.ok=false;
    const T=window.THREE;if(!T||!window.WebGLRenderingContext)return false;
    try{
      if(T.ColorManagement&&'legacyMode' in T.ColorManagement)T.ColorManagement.legacyMode=false;
      const cv=document.createElement('canvas');cv.width=cv.height=S.SZ;
      const r=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
      if(!r.getContext())return false;
      r.setPixelRatio(1);r.setSize(S.SZ,S.SZ,false);
      r.outputEncoding=T.sRGBEncoding;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.12;
      r.setClearColor(0x000000,0);r.setScissorTest(true);r.shadowMap.enabled=false;r.debug.checkShaderErrors=false;
      cv.addEventListener('webglcontextlost',e=>{e.preventDefault();S.ok=false;S.perdido=true;},false);
      try{const gl=r.getContext(),di=gl.getExtension('WEBGL_debug_renderer_info');S.soft=!!(di&&/swiftshader|llvmpipe|software|softpipe/i.test(gl.getParameter(di.UNMASKED_RENDERER_WEBGL)||''));}catch(e){}
      S.T=T;S.r=r;S.cv=cv;
      S.cena=novaCena('retrato');S.cam=new T.PerspectiveCamera(28,4/3,0.05,200);
      S.sombra=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:tex('sombra'),transparent:true,depthWrite:false,toneMapped:false,color:0x000000,opacity:0.42}));
      S.sombra.rotation.x=-Math.PI/2;S.sombra.renderOrder=-1;S.cena.add(S.sombra);
      S.alvo=new T.Group();S.cena.add(S.alvo);
      try{S.io=new IntersectionObserver(es=>{for(const e of es){if(e.isIntersecting){S.vis.add(e.target);if(e.target._r3k==='-')e.target._r3k='';}else S.vis.delete(e.target);}agenda();},{rootMargin:'320px'});}catch(e){S.io=null;}
      window.addEventListener('resize',()=>{clearTimeout(S.rz);S.rz=setTimeout(()=>{for(const cv of S.reg)cv._r3k='';agenda();},350);});
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)agenda();});
      S.ok=true;
    }catch(e){S.ok=false;}
    return S.ok;
  }
  function novaCena(tipo){
    const T=S.T,sc=new T.Scene();
    const hemi=new T.HemisphereLight(0xFFF4E0,0x6A5434,tipo==='objeto'?0.9:1.05);sc.add(hemi);
    const key=new T.DirectionalLight(0xFFF0D6,tipo==='objeto'?2.0:2.4);key.position.set(-2.6,4.2,4.4);sc.add(key);
    const fill=new T.DirectionalLight(0xD4E6FF,0.75);fill.position.set(3.4,1.4,2.4);sc.add(fill);
    const rim=new T.DirectionalLight(0xFFFFFF,tipo==='objeto'?0.9:1.5);rim.position.set(1.2,3.2,-4.5);sc.add(rim);
    sc.userData.luzes={hemi,key,fill,rim};
    return sc;
  }
  function tex(nome){
    if(S.texs[nome])return S.texs[nome];
    const T=S.T,c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
    if(nome==='sombra'){const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(0.55,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);}
    else if(nome==='brilho'){const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.22,'rgba(255,255,255,.8)');gr.addColorStop(0.55,'rgba(255,255,255,.22)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);}
    else if(nome==='anel'){g.lineWidth=10;const gr=g.createRadialGradient(64,64,30,64,64,62);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(0.55,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);}
    else if(nome==='estrela'){g.translate(64,64);const gr=g.createRadialGradient(0,0,0,0,0,64);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.3,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;
      g.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rr=i%2?14:62;g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}g.closePath();g.fill();}
    else if(nome==='feixe'){const gr=g.createLinearGradient(0,128,0,0);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);
      const gx=g.createLinearGradient(0,0,128,0);gx.addColorStop(0,'rgba(0,0,0,1)');gx.addColorStop(0.5,'rgba(0,0,0,0)');gx.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=gx;g.fillRect(0,0,128,128);}
    const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;S.texs[nome]=t;return t;
  }
  function addMat(cor,mapa,op){const T=S.T;return new T.MeshBasicMaterial({map:tex(mapa||'brilho'),color:cor,transparent:true,opacity:op==null?1:op,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false,side:T.DoubleSide});}
  /* luz de ambiente para metal/foil (gerada uma vez) */
  function envMap(){
    if(S.env)return S.env;
    const T=S.T;
    try{
      const sc=new T.Scene();const g=new T.SphereGeometry(10,24,12);const cols=[];const p=g.attributes.position;
      const top=new T.Color('#FFF6E4'),mid=new T.Color('#E8B888'),bot=new T.Color('#2A1C12'),c=new T.Color();
      for(let i=0;i<p.count;i++){const y=p.getY(i)/10;if(y>0)c.copy(mid).lerp(top,Math.min(1,y*1.6));else c.copy(mid).lerp(bot,Math.min(1,-y*2.5));cols.push(c.r,c.g,c.b);}
      g.setAttribute('color',new T.Float32BufferAttribute(cols,3));
      sc.add(new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide})));
      const lm=new T.MeshBasicMaterial({color:0xFFFFFF});
      for(const [x,y,z,w,h] of [[-6,5,4,4,2],[6,3,5,2,4],[0,7,-5,6,1.5],[-4,1,-7,2,2]]){const m=new T.Mesh(new T.PlaneGeometry(w,h),lm);m.position.set(x,y,z);m.lookAt(0,0,0);sc.add(m);}
      const pm=new T.PMREMGenerator(S.r);S.env=pm.fromScene(sc,0.02).texture;pm.dispose();
    }catch(e){S.env=null;}
    return S.env;
  }
  function descartar(o){
    try{o.traverse(m=>{if(m.geometry)m.geometry.dispose();const ms=m.material?(Array.isArray(m.material)?m.material:[m.material]):[];
      for(const x of ms){for(const k of ['map','emissiveMap','normalMap','roughnessMap','alphaMap'])if(x[k]&&!Object.values(S.texs).includes(x[k]))x[k].dispose();x.dispose();}});}catch(e){}
  }
  /* ---------- modelos ---------- */
  function temModelo(id){const C=window.CHAR3D;return !!(id&&C&&typeof C[id]==='function')&&!S.falhou.has(id);}
  /* v10: Ascensão (só das suas cartas; "mostrar forma básica" desliga). Tier I–II pelo kit, III pelo modelo. */
  function ascR(id){try{if(BUSTO(id)||typeof s==='undefined'||!s||!s.cards)return 0;if(typeof ascVisivel==='function')return Math.max(0,Math.min(3,ascVisivel(id)|0));const c=s.cards[id];return c&&!c.ascOff?Math.max(0,Math.min(3,c.asc|0)):0;}catch(e){return 0;}}
  function construir(id,asc){
    const T=S.T;let r=null;asc=asc|0;
    let op=asc?{asc}:undefined;if(id==='heroi-voce'){const v=heroiVisual();if(v)op=Object.assign({},op||{},v);}
    try{r=window.CHAR3D[id](T,window.KIT3D,op);}catch(e){r=null;}
    if(!r||!r.obj||!r.obj.isObject3D){S.falhou.add(id);return null;}
    let at=null;if(asc&&window.KIT3D&&KIT3D.ascAplicar){const terr=terrDe(id);try{at=KIT3D.ascAplicar(r.obj,asc,(typeof TERR_COR!=='undefined'&&TERR_COR[terr])||'#FFD35A',terr);}catch(e){at=null;}}
    const pose=(st,t,p)=>{if(typeof r.anim==='function')try{r.anim.call(r,st,t,p||0);}catch(e){}if(at)try{at.tick(t||0);}catch(e){}};
    return {id,key:id+'@'+asc+(id==='heroi-voce'?heroiVisualK():''),obj:r.obj,pose,asc};
  }
  function instancia(id,asc){
    const key=id+'@'+(asc|0)+(id==='heroi-voce'?heroiVisualK():'');let e=S.lru.find(x=>x.key===key);
    if(e){S.lru.splice(S.lru.indexOf(e),1);S.lru.push(e);return e;}
    e=construir(id,asc);if(!e)return null;
    S.lru.push(e);
    while(S.lru.length>4){const x=S.lru.shift();if(x.obj.parent)x.obj.parent.remove(x.obj);descartar(x.obj);}
    return e;
  }
  const _v=()=>new S.T.Vector3();
  /* caixa só do que está visível (efeitos escondidos no idle não contam), precisa nos vértices */
  function caixa(obj){
    const T=S.T,b=new T.Box3(),v=new T.Vector3(),pts=[];obj.updateMatrixWorld(true);
    obj.traverseVisible(m=>{if(!m.isMesh||!m.geometry||!m.geometry.attributes.position)return;
      const mt=m.material;if(mt&&!Array.isArray(mt)&&(mt.blending===T.AdditiveBlending||(mt.transparent&&mt.opacity<0.35)))return;
      const p=m.geometry.attributes.position,st=Math.max(1,Math.floor(p.count/400));
      for(let i=0;i<p.count;i+=st){v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);b.expandByPoint(v);pts.push(v.x,v.y,v.z);}});
    if(b.isEmpty())b.set(new T.Vector3(-0.5,0,-0.5),new T.Vector3(0.5,1.2,0.5));
    b.pts=pts;return b;
  }
  /* câmera: olha o centro da caixa de uma direção (yaw, pitch) e se afasta até os 8 cantos caberem (margens mx, my) */
  function enquadrar(cam,b,asp,yaw,pitch,mx,my,dy){
    const T=S.T,C=b.getCenter(new T.Vector3());const dyy=(dy||0)*(b.max.y-b.min.y);
    const d=new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
    const f=d.clone().negate(),rt=new T.Vector3().crossVectors(f,new T.Vector3(0,1,0)).normalize(),up=new T.Vector3().crossVectors(rt,f);
    cam.aspect=asp;const tv=Math.tan(cam.fov*Math.PI/360)*my,th=Math.tan(cam.fov*Math.PI/360)*asp*mx;
    let D=0;const q=new T.Vector3();
    if(b.pts&&b.pts.length){
      // pelos vértices de verdade (justo): centra no meio da silhueta e afasta até tudo caber
      const P=b.pts,ylim=b.min.y-1e-4;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;const L=[];
      for(let i=0;i<P.length;i+=3){if(P[i+1]<ylim)continue;q.set(P[i],P[i+1],P[i+2]).sub(C);const x=q.dot(rt),y=q.dot(up),z=q.dot(d);L.push(x,y,z);if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
      const cx=(x0+x1)/2,cy=(y0+y1)/2;C.addScaledVector(rt,cx).addScaledVector(up,cy);
      for(let i=0;i<L.length;i+=3){const x=L[i]-cx,y=L[i+1]-cy,z=L[i+2]-0;D=Math.max(D,z+Math.abs(x)/th,z+Math.abs(y)/tv);}
      // perspectiva: segunda passada com o centro já ajustado
    }else for(let i=0;i<8;i++){q.set(i&1?b.max.x:b.min.x,i&2?b.max.y:b.min.y,i&4?b.max.z:b.min.z).sub(C);
      const x=q.dot(rt),y=q.dot(up),z=q.dot(d);D=Math.max(D,z+Math.abs(x)/th,z+Math.abs(y)/tv);}
    C.y+=dyy;cam.position.copy(C).addScaledVector(d,D);cam.lookAt(C);cam.near=Math.max(0.01,D*0.05);cam.far=D*6+10;cam.updateProjectionMatrix();
    return D;
  }
  function desenharGL(sc,cam,w,h,exp){
    const r=S.r;r.toneMappingExposure=exp||1.12;
    r.setViewport(0,S.SZ-h,w,h);r.setScissor(0,S.SZ-h,w,h);r.setClearColor(0x000000,0);r.clear(true,true,true);
    r.render(sc,cam);
  }
  /* ---------- fundo pintado (terreno + raridade) ---------- */
  /* v10: fundos dos retratos nas terras das lendas (escuros, com um toque da luz do reino) */
  const FUNDO={
    milharal:{c1:'#3A1A34',c0:'#F09050',c2:'#7A3020',ch:'#6E321E',ch2:'#A8542E',sil:'#2A1218',luz:'#FFB060'},
    pomar:{c1:'#0C2620',c0:'#7AA266',c2:'#183C28',ch:'#244A22',ch2:'#3E7232',sil:'#0E2216',luz:'#E8F0B0'},
    brejo:{c1:'#081830',c0:'#3E7E8C',c2:'#0E3442',ch:'#174A56',ch2:'#2A7080',sil:'#08202A',luz:'#B8E8F0'},
    pasto:{c1:'#0E0A28',c0:'#5E4CA0',c2:'#1E163E',ch:'#2A2248',ch2:'#45387A',sil:'#0C0820',luz:'#E0D8FF'},
    neutro:{c1:'#160E28',c0:'#B8743A',c2:'#3A2216',ch:'#4E3420',ch2:'#7A5434',sil:'#1A0E0A',luz:'#FFD08A'}
  };
  function terrDe(id){
    if(typeof CARD!=='undefined'&&CARD[id])return CARD[id].terreno||'neutro';
    if(id==='heroi-voce')return 'pasto';if(id==='mentora-zinha')return 'pomar';
    try{for(const k in RIVAIS){const R=RIVAIS[k];if(R.retrato===id){const n={};for(const l of R.lanes||[])n[l]=(n[l]||0)+1;return Object.keys(n).sort((a,b)=>n[b]-n[a])[0]||'neutro';}}}catch(e){}
    return 'neutro';
  }
  const rarDe=id=>(typeof CARD!=='undefined'&&CARD[id])?CARD[id].rar:(BUSTO(id)?'rara':'comum');
  function estrela(g,x,y,r,cor){g.fillStyle=cor;g.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rr=i%2?r*0.28:r;g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}g.closePath();g.fill();}
  function pintarFundo(g,w,h,o){
    const k=[o.terr,o.rar,o.dark?1:0,o.busto?1:0,w,h].join('|');let c=S.fundos.get(k);
    if(!c){c=document.createElement('canvas');c.width=w;c.height=h;const q=c.getContext('2d');pintarFundo0(q,w,h,o);S.fundos.set(k,c);if(S.fundos.size>80)S.fundos.delete(S.fundos.keys().next().value);}
    g.drawImage(c,0,0);
  }
  function pintarFundo0(g,w,h,o){
    const P=FUNDO[o.terr]||FUNDO.neutro,rar=o.rar||'comum',luz=(typeof RAR_LUZ!=='undefined'&&RAR_LUZ[rar])||'#FFFFFF',m=Math.min(w,h);
    if(o.dark){const gr=g.createRadialGradient(w/2,h*0.45,0,w/2,h*0.45,Math.max(w,h)*0.7);gr.addColorStop(0,'#2E2630');gr.addColorStop(1,'#0E0A10');g.fillStyle=gr;g.fillRect(0,0,w,h);
      g.fillStyle='rgba(255,230,190,.05)';g.beginPath();g.ellipse(w/2,h*1.16,w*0.95,h*0.44,0,0,6.283);g.fill();return;}
    // céu do reino: escuro em cima, o clarão no horizonte
    let gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,P.c1);gr.addColorStop(0.62,P.c0);gr.addColorStop(1,P.c2);g.fillStyle=gr;g.fillRect(0,0,w,h);
    const cx=w/2,cy=h*0.46;
    gr=g.createRadialGradient(cx,cy,0,cx,cy,Math.max(w,h)*0.62);gr.addColorStop(0,rar==='comum'?hexA(P.luz,0.55):hexA(luz,0.75));gr.addColorStop(0.4,rar==='comum'?hexA(P.luz,0.16):hexA(luz,0.25));gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);
    // raios de xilogravura (Rara ou melhor, bustos)
    if(rar==='rara'||rar==='epica'||rar==='lendaria'||o.busto){const n=rar==='lendaria'?18:14,a0=0.12;g.save();g.translate(cx,cy);g.fillStyle=hexA(rar==='comum'?P.luz:luz,rar==='lendaria'?0.22:0.13);
      for(let i=0;i<n;i++){const a=a0+i*6.283/n;g.beginPath();g.moveTo(0,0);g.arc(0,0,Math.max(w,h),a,a+6.283/n*0.42);g.closePath();g.fill();}g.restore();}
    // silhuetas da região no fundo
    g.save();g.fillStyle=hexA(P.sil,0.8);g.strokeStyle=hexA(P.sil,0.8);g.lineCap='round';
    const base=h*0.86;
    if(o.terr==='milharal'){ // serrotes e mandacarus
      g.beginPath();g.moveTo(0,base);g.lineTo(w*0.08,h*0.62);g.lineTo(w*0.2,h*0.7);g.lineTo(w*0.3,base);g.closePath();g.fill();g.beginPath();g.moveTo(w*0.7,base);g.lineTo(w*0.84,h*0.6);g.lineTo(w,h*0.68);g.lineTo(w,base);g.closePath();g.fill();
      for(const [x,s] of [[0.12,1],[0.9,0.8]]){const X=w*x,H=h*0.42*s,lw=m*0.045*s;g.lineWidth=lw;g.beginPath();g.moveTo(X,base);g.lineTo(X,base-H);g.moveTo(X,base-H*0.45);g.lineTo(X-lw*1.8,base-H*0.45);g.lineTo(X-lw*1.8,base-H*0.8);g.moveTo(X,base-H*0.55);g.lineTo(X+lw*1.8,base-H*0.55);g.lineTo(X+lw*1.8,base-H*0.85);g.stroke();}
      g.fillStyle=hexA('#FFD090',0.5);for(let i=0;i<9;i++){g.beginPath();g.arc(w*((i*0.37+0.1)%1),h*(0.25+((i*0.53)%0.5)),m*0.008,0,6.283);g.fill();}}
    else if(o.terr==='pomar'){ // troncos de samaúma, folhas
      for(const [x,r] of [[0.07,0.05],[0.95,0.06],[0.82,0.025]]){g.fillRect(w*x-m*r/2,0,m*r,base);}
      g.globalAlpha=0.85;for(const [x,y,r] of [[0.0,0.12,0.22],[0.98,0.08,0.24],[0.5,-0.02,0.2]]){g.beginPath();g.ellipse(w*x,h*y,m*r*1.4,m*r,0,0,6.283);g.fill();}
      g.globalAlpha=0.6;g.fillStyle=hexA(P.luz,0.2);for(let i=0;i<3;i++){g.beginPath();g.moveTo(w*(0.25+i*0.22),0);g.lineTo(w*(0.3+i*0.22),0);g.lineTo(w*(0.42+i*0.2),h);g.lineTo(w*(0.32+i*0.2),h);g.closePath();g.fill();}}
    else if(o.terr==='brejo'){ // taboas e um tronco submerso
      g.lineWidth=m*0.018;for(const x of [0.05,0.1,0.14,0.88,0.93]){g.beginPath();g.moveTo(w*x,base);g.quadraticCurveTo(w*x+m*0.02,h*0.7,w*x-m*0.01,h*0.48);g.stroke();g.beginPath();g.ellipse(w*x-m*0.01,h*0.52,m*0.02,m*0.065,0,0,6.283);g.fill();}
      g.fillStyle=hexA('#FFFFFF',0.08);for(let i=0;i<5;i++){g.beginPath();g.ellipse(w*(0.2+i*0.15),h*(0.3+(i%2)*0.08),m*0.18,m*0.03,0,0,6.283);g.fill();}}
    else if(o.terr==='pasto'){ // lua e cerca torta
      g.fillStyle=hexA('#F4F0E0',0.9);g.beginPath();g.arc(w*0.82,h*0.18,m*0.1,0,6.283);g.fill();g.fillStyle=hexA(P.c1,0.5);g.beginPath();g.arc(w*0.85,h*0.16,m*0.085,0,6.283);g.fill();
      g.fillStyle=hexA(P.sil,0.8);for(let i=0;i<6;i++){const x=w*(0.02+i*0.06),ht=h*(0.16+(i%3)*0.03);g.save();g.translate(x,base);g.rotate((i%2?1:-1)*0.12);g.fillRect(-m*0.012,-ht,m*0.024,ht);g.restore();}
      g.fillStyle='rgba(220,210,255,.08)';for(let i=0;i<4;i++){g.beginPath();g.ellipse(w*(0.2+i*0.22),base-h*0.04,m*0.25,m*0.05,0,0,6.283);g.fill();}}
    else{ // arraial: bandeirinhas e balão de luz
      const cs=['#E8862E','#3FA34D','#2E9FB5','#7B5BD6','#F2C230'];for(let r2=0;r2<2;r2++){const y0=h*(0.1+r2*0.12);g.strokeStyle=hexA('#1A1010',0.6);g.lineWidth=Math.max(1,m*0.006);g.beginPath();g.moveTo(0,y0);g.quadraticCurveTo(w/2,y0+h*0.08,w,y0);g.stroke();
        for(let i=0;i<9;i++){const f=(i+0.5)/9,x=w*f,y=y0+h*0.08*4*f*(1-f)*0.5+1;g.fillStyle=hexA(cs[(i+r2)%5],0.75);g.beginPath();g.moveTo(x-m*0.03,y);g.lineTo(x+m*0.03,y);g.lineTo(x,y+m*0.06);g.closePath();g.fill();}}
      g.fillStyle=hexA('#FFC060',0.5);for(const x of [0.1,0.9]){g.beginPath();g.arc(w*x,h*0.5,m*0.035,0,6.283);g.fill();}}
    g.restore();
    // chão: um morro arredondado onde o personagem pisa
    const gy=h*0.86;
    gr=g.createLinearGradient(0,gy-h*0.08,0,h);gr.addColorStop(0,P.ch2);gr.addColorStop(1,P.ch);g.fillStyle=gr;
    g.beginPath();g.ellipse(w/2,gy+h*0.33,w*0.92,h*0.42,0,0,6.283);g.fill();
    g.strokeStyle=hexA(P.luz,0.28);g.lineWidth=Math.max(1,m*0.012);g.beginPath();g.ellipse(w/2,gy+h*0.33,w*0.92,h*0.42,0,Math.PI*1.12,Math.PI*1.88);g.stroke();
    if(o.terr==='milharal'){g.strokeStyle='rgba(30,10,6,.45)';g.lineWidth=Math.max(1,m*0.008);for(let i=0;i<5;i++){const x=w*(0.15+i*0.17);g.beginPath();g.moveTo(x,h*0.92);g.lineTo(x+m*0.04,h*0.96);g.lineTo(x+m*0.02,h);g.stroke();}}
    else if(o.terr==='brejo'){g.fillStyle=hexA('#4E9A3E',0.9);for(const [x,y] of [[0.2,0.94],[0.78,0.96]]){g.beginPath();g.ellipse(w*x,h*y,m*0.07,m*0.025,0,0.4,6.0);g.lineTo(w*x,h*y);g.fill();}}
    else if(o.terr==='pasto'){g.fillStyle='rgba(200,190,255,.12)';g.fillRect(0,h*0.88,w,h*0.12);}
    // brilhos da raridade
    if(rar==='lendaria'||rar==='epica'){const cs=rar==='lendaria'?['#FFF4D8','#FFD35A']:['#FFFFFF','#E6CCFF'];for(let i=0;i<7;i++){estrela(g,w*((i*0.29+0.07)%1),h*(0.08+((i*0.37)%0.6)),m*(0.025+(i%3)*0.012),cs[i%2]);}}
    // vinheta
    gr=g.createRadialGradient(w/2,h/2,Math.min(w,h)*0.35,w/2,h/2,Math.max(w,h)*0.75);gr.addColorStop(0,'rgba(10,6,10,0)');gr.addColorStop(1,'rgba(10,6,10,.42)');g.fillStyle=gr;g.fillRect(0,0,w,h);
  }
  /* v10: moldura da Ascensão pintada no retrato. I bronze (xilogravura), II prata com cantos, III ouro com estrelas */
  function molduraAsc(g,w,h,tier,terr){
    const m=Math.min(w,h),b=Math.max(3,Math.round(m*0.055)),cor=(typeof TERR_COR!=='undefined'&&TERR_COR[terr])||'#FFD35A';
    const M=[null,['#7A4A26','#C88A50','#E8B07A'],['#7E8492','#D6DAE4','#FFFFFF'],['#9A6A12','#F2C24A','#FFF0B0']][tier]||null;if(!M)return;
    g.save();
    let gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,M[2]);gr.addColorStop(0.35,M[1]);gr.addColorStop(0.7,M[0]);gr.addColorStop(1,M[1]);
    g.fillStyle=gr;g.beginPath();g.rect(0,0,w,h);g.rect(b,h-b,w-2*b,-(h-2*b));g.fill('evenodd');
    // dentes de goiva (xilogravura) na borda de dentro
    g.fillStyle='rgba(30,16,6,.7)';const n=Math.max(8,Math.round((w+h)/(b*1.6)));const tri=(x,y,dx,dy,nx,ny)=>{g.beginPath();g.moveTo(x,y);g.lineTo(x+dx,y+dy);g.lineTo(x+dx*0.5+nx*b*0.5,y+dy*0.5+ny*b*0.5);g.closePath();g.fill();};
    const sx=(w-2*b)/Math.round(n*w/(w+h)),sy=(h-2*b)/Math.round(n*h/(w+h));
    for(let x=b;x<w-b-1;x+=sx){tri(x,b,sx*0.6,0,0,1);tri(x,h-b,sx*0.6,0,0,-1);}
    for(let y=b;y<h-b-1;y+=sy){tri(b,y,0,sy*0.6,1,0);tri(w-b,y,0,sy*0.6,-1,0);}
    g.strokeStyle='#1E120C';g.lineWidth=Math.max(1,b*0.22);g.strokeRect(b,b,w-2*b,h-2*b);g.strokeRect(g.lineWidth/2,g.lineWidth/2,w-g.lineWidth,h-g.lineWidth);
    if(tier>=2){const r=b*1.35;for(const [x,y] of [[b,b],[w-b,b],[b,h-b],[w-b,h-b]]){g.fillStyle=M[1];g.strokeStyle='#1E120C';g.lineWidth=Math.max(1,b*0.18);g.beginPath();g.moveTo(x,y-r);g.lineTo(x+r,y);g.lineTo(x,y+r);g.lineTo(x-r,y);g.closePath();g.fill();g.stroke();
      g.fillStyle=cor;g.beginPath();g.arc(x,y,r*0.38,0,6.283);g.fill();}}
    if(tier>=3){g.strokeStyle=hexA(cor,0.85);g.lineWidth=Math.max(1,b*0.3);g.strokeRect(b*1.45,b*1.45,w-b*2.9,h-b*2.9);
      for(const [x,y] of [[w/2,b/2+0.5],[w/2,h-b/2-0.5]]){g.fillStyle='#FFF4D0';g.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,rr=i%2?b*0.35:b*0.95;g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}g.closePath();g.fill();}}
    // glifo do tier no canto de cima (☾ I, ☾☾ II, ✦ III)
    const gl=['','☾','☾☾','✦'][tier];const fs=Math.max(8,Math.round(m*0.13));g.font=`700 ${fs}px Fredoka, sans-serif`;g.textAlign='right';g.textBaseline='top';
    g.lineWidth=Math.max(2,fs*0.22);g.strokeStyle='#1E120C';g.strokeText(gl,w-b*1.8,b*1.6);g.fillStyle=M[2];g.fillText(gl,w-b*1.8,b*1.6);
    g.restore();
  }
  function hexA(hex,a){const n=parseInt(String(hex).slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`;}
  /* ---------- um retrato (canvas 2D w×h) ---------- */
  function retrato(id,w,h,o){
    const asc=o.dark?0:(o.asc==null?ascR(id):o.asc|0);
    const T=S.T,e=instancia(id,asc);if(!e)return null;
    const busto=BUSTO(id),sc=S.cena;
    S.alvo.add(e.obj);
    e.obj.position.set(0,0,0);e.obj.rotation.set(0,0,0);
    e.pose('idle',o.t==null?0.9:o.t,0);
    const b=caixa(e.obj);
    if(busto){const lw=Math.max(b.max.x-b.min.x,0.4);if(b.max.y-b.min.y>lw*1.5)b.min.y=b.max.y-lw*1.5;}
    S.sombra.visible=!busto&&!o.dark;
    const bw=b.max.x-b.min.x,bd=b.max.z-b.min.z;S.sombra.position.set((b.min.x+b.max.x)/2,b.min.y+0.004,(b.min.z+b.max.z)/2);S.sombra.scale.set(bw*1.15+0.15,Math.max(bd,bw*0.5)*1.1+0.12,1);
    const asp=w/h;
    if(busto)enquadrar(S.cam,b,asp,0.32,0.08,0.86,0.9,0.02);
    else enquadrar(S.cam,b,asp,0.5,0.16,o.crop?0.92:0.92,o.crop?0.92:0.88,-0.03);
    if(o.dark){sc.overrideMaterial=S.sil||(S.sil=new T.MeshBasicMaterial({color:0x0D0A08}));}
    desenharGL(sc,S.cam,w,h,o.dark?1:1.12);
    sc.overrideMaterial=null;
    S.alvo.remove(e.obj);
    const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
    pintarFundo(g,w,h,{terr:terrDe(id),rar:rarDe(id),dark:o.dark,busto});
    if(o.dark){g.save();g.shadowColor='rgba(255,220,160,.22)';g.shadowBlur=Math.max(2,w*0.03);g.drawImage(S.cv,0,0,w,h,0,0,w,h);g.restore();}
    else g.drawImage(S.cv,0,0,w,h,0,0,w,h);
    if(asc&&!o.semMoldura)molduraAsc(g,w,h,asc,terrDe(id));
    return c;
  }
  /* ---------- pacote 3D (feito em código) ---------- */
  /* v10: Pacote Causo = papel kraft amarrado com barbante, capa de cordel; Pacote Mata Adentro = papel preto, lacre violeta com lua */
  const PK={semente:{b0:'#C89A62',b1:'#8A6238',fo:'#B08050',fo2:'#E0BC88',band:'#3A2414',txt:'#F3E7CD',em:'#E9DDC2',em2:'#6A4428',nome:'CAUSO',crimp:'#8A6238',metal:0.04,rough:0.86},
    colheita:{b0:'#2A2236',b1:'#0E0A16',fo:'#5A3E9A',fo2:'#9A7AE0',band:'#1A1024',txt:'#E8DCFF',em:'#7B5BD6',em2:'#3A2470',nome:'MATA ADENTRO',crimp:'#2E2440',metal:0.3,rough:0.45}};
  function pkNome(tipo){try{const T=window.TEMA&&TEMA.packs&&TEMA.packs[tipo];if(T&&T.curto)return T.curto.toUpperCase();}catch(e){}return pkCores(tipo).nome;}
  function jogoNome(){try{if(window.TEMA&&TEMA.jogo&&TEMA.jogo.caps)return TEMA.jogo.caps;}catch(e){}return 'MATA ADENTRO';}
  function pkCores(tipo){return PK[tipo]||PK.semente;}
  function canvasTex(w,h,f){const T=S.T,c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;}
  function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
  function texPacote(tipo,frente){
    const C=pkCores(tipo);
    return canvasTex(512,588,(g,w,h)=>{
      let gr=g.createLinearGradient(0,0,w*0.4,h);gr.addColorStop(0,C.b0);gr.addColorStop(1,C.b1);g.fillStyle=gr;g.fillRect(0,0,w,h);
      // faixas de foil na diagonal
      g.save();g.globalAlpha=tipo==='semente'?0.18:0.35;for(let k=-h;k<w+h;k+=78){gr=g.createLinearGradient(k,0,k+30,0);gr.addColorStop(0,C.fo);gr.addColorStop(1,C.fo2);g.fillStyle=gr;g.beginPath();g.moveTo(k,0);g.lineTo(k+26,0);g.lineTo(k+26+h*0.55,h);g.lineTo(k+h*0.55,h);g.closePath();g.fill();}g.restore();
      // brilhinhos
      if(tipo==='semente'){g.strokeStyle='rgba(60,36,16,.25)';g.lineWidth=2;for(let i=0;i<70;i++){const x=(i*137)%w,y=(i*251)%h;g.beginPath();g.moveTo(x,y);g.lineTo(x+18,y+(i%5)-2);g.stroke();}
        // barbante cruzado
        g.strokeStyle='#E8D8B0';g.lineWidth=7;g.beginPath();g.moveTo(w*0.5,0);g.lineTo(w*0.5,h);g.moveTo(0,h*0.62);g.lineTo(w,h*0.62);g.stroke();g.strokeStyle='rgba(120,90,50,.6)';g.lineWidth=2;g.setLineDash([5,5]);g.beginPath();g.moveTo(w*0.5,0);g.lineTo(w*0.5,h);g.moveTo(0,h*0.62);g.lineTo(w,h*0.62);g.stroke();g.setLineDash([]);}
      else for(let i=0;i<40;i++){const x=(i*137)%w,y=(i*251)%h;estrela(g,x,y,2+(i%3)*1.5,'rgba(220,200,255,.45)');}
      // picote do rasgo (y da emenda = 11,6% do alto)
      const ty=h*0.116;g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,ty-3,w,6);g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=3;g.setLineDash([12,9]);g.beginPath();g.moveTo(0,ty);g.lineTo(w,ty);g.stroke();g.setLineDash([]);
      if(!frente){g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.arc(w/2,h*0.52,120,0,6.283);g.fill();g.font='700 72px Fredoka, Nunito, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle=C.txt;g.fillText('MA',w/2,h*0.53);return;}
      // título pequeno
      g.font='34px Rye, Fredoka, Georgia, serif';g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
      g.lineWidth=8;g.strokeStyle='rgba(20,10,6,.8)';g.strokeText(jogoNome(),w/2,h*0.19,w*0.9);g.fillStyle='#F3E7CD';g.fillText(jogoNome(),w/2,h*0.19,w*0.9);
      // brilho atrás do emblema
      gr=g.createRadialGradient(w/2,h*0.5,10,w/2,h*0.5,190);gr.addColorStop(0,'rgba(255,255,230,.55)');gr.addColorStop(1,'rgba(255,255,230,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);
      // faixa do nome
      const by=h*0.8;rr(g,40,by,w-80,74,30);g.fillStyle='rgba(0,0,0,.35)';g.save();g.translate(0,6);g.fill();g.restore();
      rr(g,40,by,w-80,74,30);g.fillStyle=C.band;g.fill();g.lineWidth=5;g.strokeStyle=C.fo2;g.stroke();
      g.font='44px Rye, Fredoka, Georgia, serif';g.lineWidth=9;g.strokeStyle='rgba(0,0,0,.55)';g.strokeText(pkNome(tipo),w/2,by+40,w-110);g.fillStyle=C.txt;g.fillText(pkNome(tipo),w/2,by+40,w-110);
    });
  }
  function texCrimp(tipo){const C=pkCores(tipo);return canvasTex(256,32,(g,w,h)=>{g.fillStyle=C.crimp;g.fillRect(0,0,w,h);for(let x=0;x<w;x+=8){const gr=g.createLinearGradient(x,0,x+8,0);gr.addColorStop(0,'rgba(255,255,255,.35)');gr.addColorStop(0.5,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(0,0,0,.3)');g.fillStyle=gr;g.fillRect(x,0,8,h);}});}
  function texEmblema(tipo){const C=pkCores(tipo);return canvasTex(256,256,(g,w,h)=>{const gr=g.createRadialGradient(w*0.4,h*0.35,10,w/2,h/2,w/2);gr.addColorStop(0,C.fo2);gr.addColorStop(1,C.em);g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=10;g.beginPath();g.arc(w/2,h/2,w/2-14,0,6.283);g.stroke();});}
  const ALT_PK=2.0,LAR_PK=1.5,TEAR_Y=0.66,CRIMP=0.14,BOJO=0.13;
  function mkPacote(tipo){
    const T=S.T,C=pkCores(tipo),env=envMap();
    const root=new T.Group(),corpo=new T.Group(),topo=new T.Group();root.add(corpo);root.add(topo);
    const hw=LAR_PK/2,hh=ALT_PK/2-CRIMP;
    const fm=new T.MeshStandardMaterial({map:texPacote(tipo,true),metalness:C.metal,roughness:C.rough,envMap:env,envMapIntensity:1.1});
    const bm=new T.MeshStandardMaterial({map:texPacote(tipo,false),metalness:C.metal,roughness:C.rough,envMap:env,envMapIntensity:1.0});
    const z=(x,y)=>BOJO*Math.sqrt(Math.max(0,1-Math.pow(Math.abs(x/hw),6)))*Math.sqrt(Math.max(0,1-Math.pow(Math.abs(y/hh),6)));
    const parte=(y0,y1,sgn,mat)=>{const sy=Math.max(2,Math.round((y1-y0)/0.06));const g=new T.PlaneGeometry(LAR_PK,y1-y0,28,sy);const p=g.attributes.position,uv=g.attributes.uv;
      for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i)+(y0+y1)/2;p.setXYZ(i,x*sgn,y,z(x,y)*sgn);uv.setXY(i,sgn>0?(x/LAR_PK+0.5):(0.5-x/LAR_PK),(y+hh)/(2*hh));}
      g.computeVertexNormals();const m=new T.Mesh(g,mat);return m;};
    corpo.add(parte(-hh,TEAR_Y,1,fm));corpo.add(parte(-hh,TEAR_Y,-1,bm));
    topo.add(parte(TEAR_Y,hh,1,fm));topo.add(parte(TEAR_Y,hh,-1,bm));
    // tiras serrilhadas (crimp) em cima e embaixo
    const cm=new T.MeshStandardMaterial({map:texCrimp(tipo),metalness:0.5,roughness:0.4,envMap:env,side:T.DoubleSide});
    const tira=(cima)=>{const s=new T.Shape();const n=22,dw=LAR_PK/n;s.moveTo(-hw,0);s.lineTo(hw,0);s.lineTo(hw,CRIMP*0.75);
      for(let i=n;i>0;i--){s.lineTo(-hw+(i-0.5)*dw,CRIMP);s.lineTo(-hw+(i-1)*dw,CRIMP*0.75);}s.closePath();
      const g=new T.ShapeGeometry(s);if(!cima)g.rotateZ(Math.PI);const m=new T.Mesh(g,cm);m.position.y=cima?hh-0.002:-hh+0.002;return m;};
    topo.add(tira(true));corpo.add(tira(false));
    // emblema 3D: medalhão + broto (semente) ou coroa de trigo (colheita)
    const em=new T.Group();em.position.set(0,-0.02,BOJO+0.03);corpo.add(em);
    const disco=new T.Mesh(new T.CylinderGeometry(0.4,0.4,0.07,40),[new T.MeshStandardMaterial({color:C.em2,metalness:0.6,roughness:0.3,envMap:env}),new T.MeshStandardMaterial({map:texEmblema(tipo),metalness:0.35,roughness:0.35,envMap:env}),new T.MeshStandardMaterial({color:C.em2})]);
    disco.rotation.x=Math.PI/2;em.add(disco);
    const aro=new T.Mesh(new T.TorusGeometry(0.4,0.035,10,40),new T.MeshStandardMaterial({color:tipo==='colheita'?'#B89AF0':'#3A2414',metalness:0.7,roughness:0.28,envMap:env}));aro.position.z=0.035;em.add(aro);
    if(tipo==='colheita'){ // lacre violeta com a lua
      const lacre=new T.MeshStandardMaterial({color:'#6A3AB8',roughness:0.35,metalness:0.1,envMap:env,emissive:'#2A0E50'}),lua=new T.MeshStandardMaterial({color:'#F4ECD0',roughness:0.4,emissive:'#5A4A80',emissiveIntensity:0.4});
      const sel=new T.Mesh(new T.CylinderGeometry(0.24,0.26,0.06,18),lacre);sel.rotation.x=Math.PI/2;sel.position.set(0,0,0.06);em.add(sel);
      for(let k=0;k<7;k++){const a=k/7*6.283;const gota=new T.Mesh(new T.SphereGeometry(0.06,10,8),lacre);gota.position.set(Math.cos(a)*0.25,Math.sin(a)*0.25,0.05);gota.scale.set(1,1,0.5);em.add(gota);}
      const cres=new T.Mesh(new T.TorusGeometry(0.12,0.04,10,24,Math.PI*1.25),lua);cres.position.set(0,0,0.1);cres.rotation.z=0.9;em.add(cres);
    }else{ // capa de cordel: um folheto aberto em xilogravura
      const papel=new T.MeshStandardMaterial({color:'#EFE2C4',roughness:0.85}),tinta=new T.MeshStandardMaterial({color:'#24160E',roughness:0.7});
      for(const s of [-1,1]){const f=new T.Mesh(new T.BoxGeometry(0.22,0.3,0.012),papel);f.position.set(s*0.115,0,0.07);f.rotation.y=-s*0.25;em.add(f);
        for(let k=0;k<4;k++){const l=new T.Mesh(new T.BoxGeometry(0.15,0.018,0.004),tinta);l.position.set(s*0.115,0.08-k*0.05,0.08+0.0);l.rotation.y=-s*0.25;em.add(l);}}
      const lomb=new T.Mesh(new T.CylinderGeometry(0.012,0.012,0.3,6),tinta);lomb.position.set(0,0,0.085);em.add(lomb);
    }
    root.traverse(m=>{if(m.isMesh)m.castShadow=false;});
    return {obj:root,corpo,topo,em,fm,bm,cm};
  }
  /* ---------- baú 3D ---------- */
  /* v10: Bornal (couro), Arca de Prata, Botija (barro), Botija Encantada (barro violeta), Botija da Mãe-do-Ouro (barro e ouro) */
  const BAU={madeira:{b:'#7A4A2A',d:'#4A2C18',h:'#B07A48',band:'#2E1C10',lk:'#C8A060',met:0,bm:0.55,run:null},
    prata:{b:'#B8C2C6',d:'#6E7C80',h:'#FFFFFF',band:'#4E5A5C',lk:'#9FD4F0',met:0.75,bm:0.8,run:null},
    ouro:{b:'#B8643A',d:'#7A3A1E',h:'#E09A62',band:'#E8B84A',lk:'#F2C230',met:0,bm:0.8,run:null},
    encantado:{b:'#5A3A6A',d:'#2E1A3A',h:'#9A7AC0',band:'#2B1A3A',lk:'#C8A0FF',met:0.05,bm:0.6,run:'#C8A0FF'},
    lendario:{b:'#A8562E',d:'#5A2A14',h:'#E8A060',band:'#F2C230',lk:'#FFF0B0',met:0.1,bm:0.9,run:'#FFD35A'}};
  function texMadeira(C,metal){return canvasTex(256,256,(g,w,h)=>{g.fillStyle=C.b;g.fillRect(0,0,w,h);
    if(metal){for(let i=0;i<40;i++){g.fillStyle=i%2?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)';g.fillRect(0,(i*53)%h,w,2+(i%3));}return;}
    for(let y=0;y<h;y+=64){g.fillStyle=hexA(C.d,0.9);g.fillRect(0,y,w,5);g.fillStyle=hexA(C.h,0.35);g.fillRect(0,y+5,w,3);}
    for(let i=0;i<60;i++){g.strokeStyle=i%3?hexA(C.d,0.35):hexA(C.h,0.25);g.lineWidth=1.5;const y=(i*37)%h,x=(i*91)%w;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+40,y+3,x+80,y-3,x+120,y+1);g.stroke();}});}
  function texRunas(cor){return canvasTex(256,256,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);g.strokeStyle=cor;g.lineWidth=6;g.lineCap='round';g.shadowColor=cor;g.shadowBlur=10;
    const runa=(x,y,s)=>{g.beginPath();g.moveTo(x-s,y-s);g.lineTo(x,y+s);g.lineTo(x+s,y-s);g.moveTo(x-s*0.5,y);g.lineTo(x+s*0.5,y);g.stroke();};
    runa(60,90,18);runa(128,150,22);runa(196,90,18);g.beginPath();g.arc(128,70,16,0,6.283);g.stroke();});}
  const BW=1.6,BH=0.78,BD=1.0;
  function caixaRed(w,h,d,r){const T=S.T,s=new T.Shape(),x=-w/2,y=0;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
    const b=Math.min(0.05,r*0.6);const g=new T.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:5});g.translate(0,0,-(d-2*b)/2);return g;}
  function mkBau(tipo){
    const T=S.T,C=BAU[tipo]||BAU.madeira,env=envMap();
    const metal=C.met>0.5;
    const tx=texMadeira(C,metal);tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(0.62,0.62);
    const mb=new T.MeshStandardMaterial({map:tx,metalness:C.met,roughness:metal?0.32:0.72,envMap:env,envMapIntensity:metal?1.2:0.5});
    if(C.run){mb.emissiveMap=texRunas(C.run);mb.emissiveMap.wrapS=mb.emissiveMap.wrapT=T.RepeatWrapping;mb.emissiveMap.repeat.set(0.62,0.62);mb.emissive=new T.Color('#FFFFFF');mb.emissiveIntensity=0.85;}
    const mband=new T.MeshStandardMaterial({color:C.band,metalness:C.bm,roughness:0.34,envMap:env,envMapIntensity:1.1});
    const root=new T.Group();
    const corpo=new T.Mesh(caixaRed(BW,BH,BD,0.08),mb);root.add(corpo);
    for(const x of [-0.5,0.5]){const bd=new T.Mesh(caixaRed(0.16,BH+0.03,BD+0.05,0.04),mband);bd.position.set(x,-0.015,0);root.add(bd);}
    const borda=new T.Mesh(caixaRed(BW+0.04,0.08,BD+0.04,0.03),mband);borda.position.y=BH-0.06;root.add(borda);
    const pe=new T.Mesh(caixaRed(BW+0.04,0.07,BD+0.04,0.03),mband);pe.position.y=-0.01;root.add(pe);
    // tampa (abre para trás em volta da dobradiça)
    const dob=new T.Group();dob.position.set(0,BH,-BD/2);root.add(dob);
    const tampa=new T.Group();tampa.position.set(0,0,BD/2);dob.add(tampa);
    const cil=(r,l,mat)=>{const g=new T.CylinderGeometry(r,r,l,26,1,false,0,Math.PI);g.rotateZ(Math.PI/2);return new T.Mesh(g,mat);};
    const tp=cil(BD/2,BW-0.02,mb);tp.scale.set(1,0.62,1);tampa.add(tp);
    for(const x of [-0.5,0.5]){const b=cil(BD/2+0.025,0.16,mband);b.scale.set(1,0.64,1);b.position.x=x;tampa.add(b);}
    // brilho de dentro (aparece ao abrir)
    const dentro=new T.Mesh(new T.PlaneGeometry(BW*0.86,BD*0.8),addMat('#FFF2C0','brilho',0));dentro.rotation.x=-Math.PI/2;dentro.position.y=BH+0.005;root.add(dentro);
    // fechadura
    const lk=new T.MeshStandardMaterial({color:C.lk,metalness:0.7,roughness:0.25,envMap:env,envMapIntensity:1.2});
    const placa=new T.Mesh(caixaRed(0.3,0.34,0.08,0.06),lk);placa.position.set(0,BH-0.27,BD/2+0.02);root.add(placa);
    const furo=new T.Mesh(new T.CylinderGeometry(0.035,0.035,0.03,12),new T.MeshStandardMaterial({color:'#1A1420'}));furo.rotation.x=Math.PI/2;furo.position.set(0,BH-0.08,BD/2+0.065);root.add(furo);
    const fenda=new T.Mesh(new T.BoxGeometry(0.03,0.08,0.03),furo.material);fenda.position.set(0,BH-0.13,BD/2+0.065);root.add(fenda);
    const trava=new T.Mesh(caixaRed(0.16,0.16,0.06,0.04),lk);trava.position.set(0,-0.12,BD+0.025-BD/2+0.0);tampa.add(trava);trava.position.set(0,-0.04,BD/2+0.015);
    if(tipo==='lendario'||tipo==='ouro'){const gem=new T.Mesh(new T.OctahedronGeometry(0.07,0),new T.MeshStandardMaterial({color:tipo==='ouro'?'#E04848':'#7FD3FF',metalness:0.2,roughness:0.12,envMap:env,emissive:tipo==='ouro'?'#3A0606':'#0A2A40'}));gem.position.set(0,0.3,BD/2-0.02);gem.scale.set(1,1.2,0.6);tampa.add(gem);}
    return {obj:root,dob,tampa,dentro,mb};
  }
  /* imagem parada de pacote/baú */
  function objeto(kind,tipo,w,h){
    const T=S.T;let M=kind==='pack'?S.packs[tipo]:S.baus[tipo];
    if(!M){M=kind==='pack'?mkPacote(tipo):mkBau(tipo);(kind==='pack'?S.packs:S.baus)[tipo]=M;}
    if(!S.cenaObj){S.cenaObj=novaCena('objeto');S.camObj=new T.PerspectiveCamera(26,1,0.05,100);}
    const sc=S.cenaObj;sc.add(M.obj);
    M.obj.rotation.set(kind==='pack'?0.04:0,kind==='pack'?-0.32:0,kind==='pack'?0.05:0);
    M.obj.updateMatrixWorld(true);const b=new T.Box3().setFromObject(M.obj);
    if(kind==='pack')enquadrar(S.camObj,b,w/h,0.0,0.06,0.9,0.9);else enquadrar(S.camObj,b,w/h,0.55,0.42,0.9,0.86);
    desenharGL(sc,S.camObj,w,h,1.05);sc.remove(M.obj);
    const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
    g.save();g.shadowColor='rgba(0,0,0,.5)';g.shadowBlur=Math.max(2,w*0.05);g.shadowOffsetY=Math.max(1,w*0.025);g.drawImage(S.cv,0,0,w,h,0,0,w,h);g.restore();
    return c;
  }
  /* ---------- fila ---------- */
  const BK_ART=[96,128,192,256,384,512],BK_SQ=[48,64,96,128,192,256],BK_PK=[72,96,144,192,288,384];
  function balde(lista,px){for(const b of lista)if(b>=px*0.92)return b;return lista[lista.length-1];}
  function chave(cv){
    const r=cv.getBoundingClientRect();if(!(r.width>1&&r.height>1))return null;
    const pr=Math.min(window.devicePixelRatio||1,2),px=r.width*pr;
    if(cv.dataset.pack){const w=balde(BK_PK,px);return {k:'P|'+cv.dataset.pack+'|'+w,kind:'pack',tipo:cv.dataset.pack,w,h:Math.round(w*4/3)};}
    if(cv.dataset.chest){const w=balde(BK_ART,px);return {k:'B|'+cv.dataset.chest+'|'+w,kind:'chest',tipo:cv.dataset.chest,w,h:Math.round(w*0.75)};}
    const id=cv.dataset.art,crop=!!cv.dataset.crop||Math.abs(r.width-r.height)<2,dark=!!cv.dataset.dark;
    const w=crop?balde(BK_SQ,px):balde(BK_ART,px),h=crop?w:Math.round(w*0.75);
    const asc=dark?0:ascR(id);
    return {k:'A|'+id+'|'+w+'x'+h+(dark?'|d':'')+(asc?'|a'+asc:'')+(id==='heroi-voce'?heroiVisualK():''),kind:'art',id,w,h,crop,dark,asc};
  }
  function copiar(cv,img){
    if(cv.width!==img.width)cv.width=img.width;if(cv.height!==img.height)cv.height=img.height;
    const g=cv.getContext('2d');if(!g)return;g.clearRect(0,0,cv.width,cv.height);g.drawImage(img,0,0);cv.classList.add('a3d');
  }
  function provisorio(cv){
    // enquanto o 3D não chega: só o fundo do terreno (nada de pixel piscando)
    try{const id=cv.dataset.art;if(!id)return;const g=cv.getContext('2d');cv.width=64;cv.height=cv.dataset.crop?64:48;
      pintarFundo(g,cv.width,cv.height,{terr:terrDe(id),rar:rarDe(id),dark:!!cv.dataset.dark,busto:BUSTO(id)});cv.classList.add('a3d');}catch(e){}
  }
  function quer(cv){
    if(!iniciar())return false;
    if(cv.dataset.pack||cv.dataset.chest)return true;
    return temModelo(cv.dataset.art);
  }
  function pedir(lista){
    if(!lista.length)return;
    const ks=lista.map(cv=>{try{return chave(cv);}catch(e){return null;}});
    lista.forEach((cv,i)=>{
      S.reg.add(cv);if(S.io)S.io.observe(cv);
      const k=ks[i];const img=k&&S.cache.get(k.k);
      if(img){copiar(cv,img);cv._r3k=k.k;S.st.hit++;}
      else{cv._r3k='';if(!cv.classList.contains('a3d'))provisorio(cv);}
    });
    if(S.reg.size>500)varrer();
    agenda();
  }
  function varrer(){for(const cv of S.reg)if(!cv.isConnected){S.reg.delete(cv);S.vis.delete(cv);if(S.io)S.io.unobserve(cv);}}
  function agenda(){if(S.tm||!S.ok)return;S.tm=setTimeout(passo,S.st.t0?16:0);}
  function falta(cv){return cv.isConnected&&!cv._r3k;}
  function proximo(){
    let outro=null;
    for(const cv of S.vis){if(falta(cv))return cv;}
    for(const cv of S.reg){if(!cv.isConnected){S.reg.delete(cv);S.vis.delete(cv);if(S.io)S.io.unobserve(cv);continue;}
      if(!cv._r3k&&!outro&&cv.offsetParent!==null&&!S.io)return cv;
      if(!cv._r3k&&!outro&&cv.offsetParent!==null)outro=cv;}
    return outro;
  }
  function passo(){
    S.tm=0;if(!S.ok)return falharTudo();
    if(document.hidden){S.tm=setTimeout(passo,400);return;}
    const t0=performance.now(),orc=S.soft?22:12;let n=0;const tentou=new Set();
    while(true){
      const cv=proximo();if(!cv||tentou.has(cv))break;tentou.add(cv);
      let k=null;try{k=chave(cv);}catch(e){}
      if(!k){cv._r3k='-';continue;} // sem tamanho (escondido): o IntersectionObserver traz de volta
      let img=S.cache.get(k.k);
      if(!img){
        if(n>0&&performance.now()-t0>orc)break;
        if(k.kind==='pack'&&document.fonts&&document.fonts.status!=='loaded'&&performance.now()<4000){S.tm=setTimeout(passo,120);return;}
        const a=performance.now();
        try{img=k.kind==='art'?retrato(k.id,k.w,k.h,{crop:k.crop,dark:k.dark,asc:k.asc}):objeto(k.kind,k.tipo,k.w,k.h);}catch(e){img=null;}
        if(!S.st.t0)S.st.t0=a;S.st.n++;S.st.ms+=performance.now()-a;n++;
        if(!img){pixel(cv);continue;}
        S.cache.set(k.k,img);
        if(S.cache.size>420)S.cache.delete(S.cache.keys().next().value);
      }else S.st.hit++;
      copiar(cv,img);cv._r3k=k.k;
    }
    if(temTrabalho())S.tm=setTimeout(passo,16);
  }
  function temTrabalho(){for(const cv of S.vis)if(falta(cv))return true;for(const cv of S.reg)if(falta(cv)&&cv.offsetParent!==null)return true;return false;}
  function pixel(cv){S.reg.delete(cv);S.vis.delete(cv);cv.classList.remove('a3d');cv._r3k='x';
    if(cv.dataset.art&&typeof artPixel==='function'){cv.width=cv.dataset.crop?40:64;cv.height=cv.dataset.crop?40:48;artPixel(cv);}
    else if(cv.dataset.pack&&typeof paintPack==='function'){cv.width=48;cv.height=64;paintPack(cv,cv.dataset.pack,'all');}
    else if(cv.dataset.chest&&typeof paintChest==='function'){cv.width=32;cv.height=24;paintChest(cv,cv.dataset.chest,'all');}}
  function falharTudo(){for(const cv of [...S.reg])if(cv.isConnected&&!cv._r3k)pixel(cv);}
  function pendentes(soVis){let n=0;for(const cv of (soVis?S.vis:S.reg))if(falta(cv)&&cv.offsetParent!==null)n++;return n;}

  /* ---------- laço dos vivos (pacote/baú da abertura, pulos, arte em destaque) ---------- */
  function kick(){if(S.raf||!S.ok)return;S.raf=requestAnimationFrame(quadro);}
  function quadro(now){
    S.raf=0;if(!S.ok){S.vivos.clear();return;}
    for(const v of [...S.vivos]){
      if(!v.cv.isConnected||v.morto){S.vivos.delete(v);try{v.fim&&v.fim();}catch(e){}continue;}
      const passo=v.fps?1000/v.fps:0;if(passo&&now-(v.last||0)<passo*0.9)continue;
      v.last=now;try{v.tick(now);}catch(e){S.vivos.delete(v);}
    }
    if(S.vivos.size&&!document.hidden)S.raf=requestAnimationFrame(quadro);
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S.vivos.size)kick();});
  function prepararCv(cv,maxPr){
    const r=cv.getBoundingClientRect();const pr=Math.min(window.devicePixelRatio||1,maxPr||(S.soft?1.25:2));
    let w=Math.round(r.width*pr),h=Math.round(r.height*pr);const k=Math.min(1,S.SZ/Math.max(w,h,1));w=Math.max(2,Math.floor(w*k));h=Math.max(2,Math.floor(h*k));
    if(cv.width!==w)cv.width=w;if(cv.height!==h)cv.height=h;return {w,h};
  }
  const lerp=(a,b,k)=>a+(b-a)*k,cl01=k=>k<0?0:k>1?1:k,eo=k=>1-Math.pow(1-cl01(k),3),eb=k=>{k=cl01(k);const c=1.70158;return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2);};
  function faiscas(sc,n,cor,mapa){const T=S.T,ms=[];const mat=addMat(cor,mapa||'estrela',1);for(let i=0;i<n;i++){const m=new T.Mesh(new T.PlaneGeometry(1,1),mat);m.visible=false;sc.add(m);ms.push({m,v:new T.Vector3(),p:new T.Vector3(),vida:0,t:-1,s:0.1});}return {ms,mat};}
  function soltar(F,orig,n,vel,s,vida,cima){for(let i=0,k=0;i<F.ms.length&&k<n;i++){const f=F.ms[i];if(f.t>=0&&f.t<f.vida)continue;k++;
    const a=Math.random()*6.283,u=Math.random();f.p.copy(orig);f.v.set(Math.cos(a)*vel*(0.4+u),(cima?1.2:0.3)*vel*(0.5+Math.random()),Math.sin(a)*vel*0.6*(0.4+u));f.t=0;f.vida=vida*(0.7+Math.random()*0.6);f.s=s*(0.6+Math.random()*0.8);f.m.visible=true;}}
  function animFaiscas(F,dt,cam,g){for(const f of F.ms){if(f.t<0)continue;f.t+=dt;if(f.t>=f.vida){f.m.visible=false;f.t=-1;continue;}
    f.v.y-=(g||2.5)*dt;f.p.addScaledVector(f.v,dt);f.m.position.copy(f.p);f.m.quaternion.copy(cam.quaternion);const k=1-f.t/f.vida;f.m.scale.setScalar(f.s*(0.4+k));}
    F.mat.opacity=1;}

  /* pacote vivo: balança, treme a cada toque, racha brilhando, rasga (a tira de cima voa), cartas pulam para fora */
  function pacoteVivo(cv,o){
    if(!iniciar())return null;
    const T=S.T,cor=new T.Color(o.cor||'#FFFFFF'),sc=novaCena('objeto');
    const M=mkPacote(o.tipo);sc.add(M.obj);
    const cam=new T.PerspectiveCamera(26,1,0.05,100);
    M.obj.updateMatrixWorld(true);const b=new T.Box3().setFromObject(M.obj);
    // racha: segmentos em zigue-zague na emenda, acesos aos poucos
    const rm=new T.MeshBasicMaterial({color:cor,toneMapped:false,transparent:true,opacity:1});
    const segs=[];const n=14;let px=-LAR_PK/2,py=TEAR_Y;
    for(let i=1;i<=n;i++){const x=-LAR_PK/2+i*LAR_PK/n,y=TEAR_Y+(i%2?0.035:-0.03);const dx=x-px,dy=y-py,L=Math.hypot(dx,dy);
      const m=new T.Mesh(new T.PlaneGeometry(L,0.03),rm);m.position.set((x+px)/2,(y+py)/2,BOJO*0.86+0.02);m.rotation.z=Math.atan2(dy,dx);m.visible=false;M.corpo.add(m);segs.push(m);px=x;py=y;}
    const vaz=new T.Mesh(new T.PlaneGeometry(1,1),addMat(cor,'brilho',0));vaz.position.set(0,TEAR_Y,BOJO+0.05);vaz.scale.set(LAR_PK*1.4,0.5,1);M.obj.add(vaz);
    const feixe=new T.Mesh(new T.PlaneGeometry(1,1),addMat(cor,'feixe',0));feixe.position.set(0,TEAR_Y+0.9,0.05);feixe.scale.set(LAR_PK*1.1,1.8,1);M.obj.add(feixe);
    const luz=new T.PointLight(cor,0,5,1.6);luz.position.set(0,TEAR_Y+0.2,0.7);sc.add(luz);
    const F=faiscas(sc,40,cor);
    // cartas que saltam do pacote
    const cb=canvasTex(128,180,(g,w,h)=>{rr(g,4,4,w-8,h-8,12);g.fillStyle='#2E4A26';g.fill();g.lineWidth=7;g.strokeStyle='#F2BE4A';g.stroke();g.fillStyle='#F2BE4A';g.beginPath();g.arc(w/2,h/2,30,0,6.283);g.fill();g.fillStyle='#2E1F05';g.font='700 26px Fredoka, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('CG',w/2,h/2+1);});
    const cm=new T.MeshStandardMaterial({map:cb,roughness:0.5,side:T.DoubleSide,transparent:true});
    const voam=[];for(let i=0;i<8;i++){const m=new T.Mesh(new T.PlaneGeometry(0.5,0.7),cm);m.visible=false;sc.add(m);voam.push({m,v:new T.Vector3(),w:new T.Vector3()});}
    const st={t0:performance.now(),last:performance.now(),choque:0,choqueT:0,racha:0,brilho:0,rasgo:-1,boom:-1,fim:-1};
    const mx=o.mx||0.6,my=o.my||0.7;
    const v={cv,fps:S.soft?24:40,tick(now){
      const dt=Math.min(0.05,(now-st.last)/1000);st.last=now;const t=sem()?0:(now-st.t0)/1000;
      const {w,h}=prepararCv(cv,o.pr);
      if(!st.fit||st.fit!==w+'x'+h){enquadrar(cam,b,w/h,0,0.04,mx,my);st.fit=w+'x'+h;}
      // balanço + tremor
      const ch=st.choque*Math.exp(-(t-st.choqueT)*7);
      const tremor=st.rasgo<0&&st.racha>=0.66?0.012*Math.sin(t*70):0;
      M.obj.rotation.set(0.05*Math.sin(t*0.9)+ch*0.05*Math.sin(t*40),0.28*Math.sin(t*1.1)*(st.boom<0?1:0.3)+ch*0.12*Math.sin(t*33),ch*0.1*Math.sin(t*46)+tremor);
      M.obj.position.x=ch*0.06*Math.sin(t*52)+tremor;
      const sq=ch*0.08*Math.sin(t*28);M.obj.scale.set(1+sq,1-sq,1);
      segs.forEach((s,i)=>{s.visible=i<Math.round(st.racha*n);});
      rm.opacity=0.75+0.25*Math.sin(t*12);
      const pulso=0.85+0.15*Math.sin(t*9);
      vaz.material.opacity=st.brilho*pulso;vaz.scale.y=0.35+st.brilho*0.5;
      luz.intensity=st.brilho*2.4*pulso;
      M.fm.emissive=M.fm.emissive||new T.Color();M.fm.emissive.copy(cor).multiplyScalar(st.brilho*0.12);
      if(st.rasgo>=0){const k=cl01((now-st.rasgo)/(o.rasgoMs||450)),e=eo(k);
        M.topo.position.set(0.55*e,1.2*e,0.25*e);M.topo.rotation.set(-1.1*e,0.3*e,-0.7*e);
        feixe.material.opacity=Math.min(1,k*2)*0.95;feixe.scale.y=0.55+e*0.3;feixe.position.y=TEAR_Y+feixe.scale.y/2-0.04;M.topo.scale.setScalar(1-e*0.45);vaz.material.opacity=Math.max(vaz.material.opacity,0.9);vaz.scale.set(LAR_PK*1.4,0.6+e*0.4,1);luz.intensity=Math.max(luz.intensity,3);}
      if(st.boom>=0){const k=(now-st.boom)/1000;
        luz.intensity=Math.max(0,5*(1-k*1.6));feixe.material.opacity=Math.max(0,0.95-k*1.2);
        voam.forEach((c,i)=>{if(k>0.75){c.m.visible=false;return;}c.m.visible=true;c.m.material.opacity=Math.max(0,1-k/0.75);
          c.m.position.addScaledVector(c.v,dt);c.v.y-=3.5*dt;c.m.rotation.x+=c.w.x*dt;c.m.rotation.y+=c.w.y*dt;c.m.rotation.z+=c.w.z*dt;});
        M.topo.visible=k<0.5;}
      animFaiscas(F,dt,cam,1.5);
      desenharGL(sc,cam,w,h,1.08);
      const g=cv.getContext('2d');g.clearRect(0,0,w,h);g.drawImage(S.cv,0,0,w,h,0,0,w,h);
    },fim(){sc.remove(M.obj);descartar(M.obj);for(const c of voam)c.m.geometry.dispose();cm.dispose();cb.dispose();}};
    S.vivos.add(v);kick();
    const orig=()=>new T.Vector3(0,TEAR_Y,0.15);
    return {
      toque(k){st.choque=1+k*0.35;st.choqueT=(performance.now()-st.t0)/1000;st.racha=Math.min(1,k/3);st.brilho=[0,0.35,0.7,1][Math.min(3,k)];soltar(F,orig(),3+k*3,1.2+k*0.4,0.08,0.6);kick();},
      rasgar(ms){st.rasgo=performance.now();o.rasgoMs=ms||450;st.racha=1;st.brilho=1;soltar(F,orig(),12,2,0.1,0.8,true);kick();},
      explodir(){st.boom=performance.now();voam.forEach((c,i)=>{const a=(i/voam.length-0.5)*2.2;c.m.position.set(0,TEAR_Y-0.2,0.05);c.v.set(Math.sin(a)*2.4,3.6+Math.random()*1.4,0.6+Math.random()*0.6);c.w.set((Math.random()-0.5)*8,(Math.random()-0.5)*10,(Math.random()-0.5)*6);c.m.rotation.set(0,0,a*0.5);});
        soltar(F,orig(),36,3.2,0.13,1.1,true);kick();},
      parar(){v.morto=true;}
    };
  }
  /* baú vivo: balança, treme, a tampa abre com mola, luz de dentro, moedas 3D pulam */
  function bauVivo(cv,o){
    if(!iniciar())return null;
    const T=S.T,cor=new T.Color(o.cor||'#FFF2C0'),sc=novaCena('objeto');
    const M=mkBau(o.tipo);sc.add(M.obj);
    const cam=new T.PerspectiveCamera(26,1,0.05,100);
    M.obj.updateMatrixWorld(true);const b=new T.Box3().setFromObject(M.obj);b.max.y+=0.15;
    const luz=new T.PointLight(cor,0,5,1.5);luz.position.set(0,BH+0.5,0.2);sc.add(luz);
    const feixe=new T.Mesh(new T.PlaneGeometry(1,1),addMat(cor,'feixe',0));feixe.position.set(0,BH+1.0,0);feixe.scale.set(BW*1.0,2.0,1);sc.add(feixe);
    const feixe2=feixe.clone();feixe2.material=feixe.material;feixe2.rotation.y=Math.PI/2;feixe2.scale.set(BD*1.2,2.0,1);sc.add(feixe2);
    const om=new T.MeshStandardMaterial({color:'#F7C843',metalness:0.8,roughness:0.28,envMap:envMap()});
    const moedas=[];for(let i=0;i<14;i++){const m=new T.Mesh(new T.CylinderGeometry(0.09,0.09,0.025,18),om);m.visible=false;sc.add(m);moedas.push({m,v:new T.Vector3(),w:Math.random()*10});}
    const F=faiscas(sc,30,cor);
    const st={t0:performance.now(),last:performance.now(),choque:0,choqueT:0,abre:-1};
    const v={cv,fps:S.soft?24:40,tick(now){
      const dt=Math.min(0.05,(now-st.last)/1000);st.last=now;const t=sem()?0:(now-st.t0)/1000;
      const {w,h}=prepararCv(cv,o.pr);
      if(st.fit!==w+'x'+h){enquadrar(cam,b,w/h,0.5,0.36,o.mx||0.62,o.my||0.62,0.08);st.fit=w+'x'+h;}
      const ch=st.choque*Math.exp(-(t-st.choqueT)*6);
      M.obj.rotation.set(0,0.12*Math.sin(t*0.8)+ch*0.1*Math.sin(t*30),ch*0.07*Math.sin(t*38));
      M.obj.position.y=0.03*Math.sin(t*2)*(st.abre<0?1:0.3);
      if(st.abre>=0){const k=(now-st.abre)/1000;const ka=cl01(k/0.38);
        M.dob.rotation.x=-1.95*eb(ka);
        const kl=cl01(k/0.3);M.dentro.material.opacity=kl;luz.intensity=3.2*kl*(0.85+0.15*Math.sin(t*8));feixe.material.opacity=0.8*kl*(0.85+0.15*Math.sin(t*5));feixe.scale.y=feixe2.scale.y=2+kl*0.8;
        moedas.forEach(c=>{if(!c.m.visible)return;c.v.y-=6*dt;c.m.position.addScaledVector(c.v,dt);c.m.rotation.x+=c.w*dt;c.m.rotation.z+=c.w*0.5*dt;if(c.m.position.y<-0.8)c.m.visible=false;});}
      else{M.dob.rotation.x=-0.04*Math.max(0,Math.sin(t*3))*(ch>0.2?1:0);}
      animFaiscas(F,dt,cam,1.2);
      desenharGL(sc,cam,w,h,1.08);
      const g=cv.getContext('2d');g.clearRect(0,0,w,h);g.drawImage(S.cv,0,0,w,h,0,0,w,h);
    },fim(){sc.remove(M.obj);descartar(M.obj);}};
    S.vivos.add(v);kick();
    return {
      toque(){st.choque=1.4;st.choqueT=(performance.now()-st.t0)/1000;kick();},
      abrir(){st.abre=performance.now();moedas.forEach((c,i)=>{c.m.visible=true;c.m.position.set((Math.random()-0.5)*0.8,BH+0.1,(Math.random()-0.5)*0.4);const a=Math.random()*6.283;c.v.set(Math.cos(a)*1.4,3.4+Math.random()*2,Math.sin(a)*0.9+0.6);});
        soltar(F,new T.Vector3(0,BH+0.2,0),24,2.4,0.12,1,true);kick();},
      parar(){v.morto=true;}
    };
  }
  /* o personagem pula para fora da carta virada, com explosão da cor da raridade (canvas temporário por cima) */
  function pular(card,id,rar,o){
    o=o||{};
    if(sem()||!iniciar()||!temModelo(id)||!card||!card.isConnected)return;
    if(S.pops.size>=(S.soft?2:3)){const v0=[...S.pops][0];if(v0)v0.morto=true;}
    const art=card.querySelector('.aw canvas.art')||card;const r=art.getBoundingClientRect();if(!(r.width>4))return;
    const host=o.host||card.closest('.rvov')||document.body;
    const W=r.width*(o.k||2.6),H=r.height*(o.k?o.k*1.25:3.4);
    const cv=document.createElement('canvas');cv.className='r3pop';cv.setAttribute('aria-hidden','true');
    cv.style.cssText=`position:fixed;left:${r.left+r.width/2-W/2}px;top:${r.top+r.height*0.75-H}px;width:${W}px;height:${H}px;z-index:${o.z||13};pointer-events:none`;
    host.appendChild(cv);
    const T=S.T,sc=novaCena('retrato'),e=construir(id,ascR(id));if(!e){cv.remove();return;}
    sc.add(e.obj);e.pose('idle',0.9,0);const b=caixa(e.obj);const alt=b.max.y-b.min.y,lar=Math.max(b.max.x-b.min.x,b.max.z-b.min.z);
    const luzC=new T.Color((typeof RAR_LUZ!=='undefined'&&RAR_LUZ[rar])||'#FFFFFF');
    const anel=new T.Mesh(new T.PlaneGeometry(1,1),addMat(luzC,'anel',0));anel.rotation.x=-Math.PI/2;sc.add(anel);
    const halo=new T.Mesh(new T.PlaneGeometry(1,1),addMat(luzC,'brilho',0));sc.add(halo);
    const F=faiscas(sc,rar==='lendaria'?36:22,luzC);
    const cam=new T.PerspectiveCamera(30,W/H,0.05,100);
    // enquadra um espaço maior que o modelo (ele sobe e cresce)
    const bb=new T.Box3(new T.Vector3(-lar*1.1,b.min.y-alt*0.55,-lar),new T.Vector3(lar*1.1,b.max.y+alt*0.5,lar));
    const t0=performance.now(),dur=(o.dur||({comum:900,incomum:1000,rara:1150,epica:1250,lendaria:1400}[rar]||1000));
    let solto=false,last=t0;const base=b.min.y;
    const v={cv,fps:S.soft?24:45,tick(now){
      const dt=Math.min(0.05,(now-last)/1000);last=now;
      const {w,h}=prepararCv(cv,S.soft?1:1.5);if(!v.fit){enquadrar(cam,bb,w/h,0.42,0.12,0.95,0.95);v.fit=1;}
      const p=(now-t0)/dur;if(p>=1){v.morto=true;return;}
      const up=eb(cl01(p/0.3)),down=cl01((p-0.72)/0.28);
      const y=lerp(-alt*0.45,alt*0.12,up)-down*down*alt*0.5,s=lerp(0.35,1.05,up)*(1-down*0.55);
      e.obj.position.set(0,y-base*s,0);e.obj.scale.setScalar(s);e.obj.rotation.y=(1-up)*-2.4+Math.sin(p*7)*0.08;
      if(p<0.3)e.pose('entra',cl01(p/0.3),cl01(p/0.3));else e.pose('idle',0.9+(p-0.3)*dur/1000,0);
      if(!solto&&p>0.22){solto=true;soltar(F,new T.Vector3(0,alt*0.4,0),rar==='lendaria'?36:rar==='comum'?10:22,rar==='comum'?1.6:2.6,rar==='lendaria'?0.16:0.11,0.9,true);}
      const kr=cl01((p-0.2)/0.5);anel.material.opacity=(1-kr)*(rar==='comum'?0.5:0.95);anel.scale.setScalar(lar*(0.6+kr*(rar==='comum'?1.6:2.8)));anel.position.y=y*0.3;
      halo.material.opacity=Math.sin(cl01(p/0.8)*Math.PI)*(rar==='comum'?0.35:0.8);halo.scale.setScalar(alt*(1.6+up*0.6));halo.position.set(0,y+alt*0.5*s,-lar*0.6);halo.quaternion.copy(cam.quaternion);
      animFaiscas(F,dt,cam,2.2);
      desenharGL(sc,cam,w,h,1.12);
      const g=cv.getContext('2d');g.clearRect(0,0,w,h);g.drawImage(S.cv,0,0,w,h,0,0,w,h);
      cv.style.opacity=String(1-cl01((p-0.86)/0.14));
    },fim(){S.pops.delete(v);cv.remove();sc.remove(e.obj);descartar(e.obj);anel.geometry.dispose();halo.geometry.dispose();}};
    S.pops.add(v);S.vivos.add(v);kick();
  }
  /* arte viva: a carta em destaque (detalhe, carta grande da lendária, épica no centro, carta selecionada na mão) */
  const SEL_VIVO='.lspot .sz-big canvas.art.a3d,.espot canvas.art.a3d,.sheet .sz-big canvas.art.a3d,.dbig canvas.art.a3d,.side .det canvas.art.a3d,#bHand .hc.sel canvas.art.a3d';
  function vigiarVivo(){
    clearTimeout(S.vivoTm);S.vivoTm=setTimeout(vigiarVivo,350);
    if(!S.ok||sem()||document.hidden)return;
    let alvo=null;for(const cv of document.querySelectorAll(SEL_VIVO)){if(cv.offsetParent!==null&&cv.dataset.art&&!cv.dataset.dark&&temModelo(cv.dataset.art)&&cv._r3k){alvo=cv;break;}}
    const A=S.vivoArte;
    if(A&&(A.cv!==alvo)){A.morto=true;S.vivoArte=null;}
    if(alvo&&!S.vivoArte)vivoArte(alvo);
  }
  function vivoArte(cv){
    const T=S.T,id=cv.dataset.art,asc=cv.dataset.dark?0:ascR(id),e=construir(id,asc);if(!e)return;
    const sc=novaCena('retrato');sc.add(e.obj);
    const sh=new T.Mesh(new T.PlaneGeometry(1,1),S.sombra.material);sh.rotation.x=-Math.PI/2;sc.add(sh);
    e.pose('idle',0.9,0);const b=caixa(e.obj);const busto=BUSTO(id);
    if(busto){const lw=Math.max(b.max.x-b.min.x,0.4);if(b.max.y-b.min.y>lw*1.5)b.min.y=b.max.y-lw*1.5;}
    sh.visible=!busto;const bw=b.max.x-b.min.x,bd=b.max.z-b.min.z;sh.position.set((b.min.x+b.max.x)/2,b.min.y+0.004,(b.min.z+b.max.z)/2);sh.scale.set(bw*1.15+0.15,Math.max(bd,bw*0.5)*1.1+0.12,1);
    const cam=new T.PerspectiveCamera(28,cv.width/cv.height,0.05,200);const w=cv.width,h=cv.height,crop=Math.abs(w-h)<2;
    if(busto)enquadrar(cam,b,w/h,0.32,0.08,0.86,0.9,0.02);else enquadrar(cam,b,w/h,0.5,0.16,crop?0.92:0.92,crop?0.92:0.88,-0.03);
    const C=b.getCenter(new T.Vector3()),R=cam.position.distanceTo(C),yaw0=busto?0.32:0.5,pit=busto?0.08:0.16;
    const fundo=document.createElement('canvas');fundo.width=w;fundo.height=h;pintarFundo(fundo.getContext('2d'),w,h,{terr:terrDe(id),rar:rarDe(id),busto});
    const t0=performance.now();
    const v={cv,fps:S.soft?10:24,tick(now){
      if(cv.width!==w||cv.height!==h||cv.offsetParent===null){v.morto=true;return;}
      const t=(now-t0)/1000;e.pose('idle',0.9+t,0);
      const yaw=yaw0+Math.sin(t*0.6)*0.12;cam.position.set(C.x+Math.sin(yaw)*Math.cos(pit)*R,C.y+Math.sin(pit)*R,C.z+Math.cos(yaw)*Math.cos(pit)*R);cam.lookAt(C);
      desenharGL(sc,cam,w,h,1.12);
      const g=cv.getContext('2d');g.drawImage(fundo,0,0);g.drawImage(S.cv,0,0,w,h,0,0,w,h);if(asc)molduraAsc(g,w,h,asc,terrDe(id));
    },fim(){if(S.vivoArte===v)S.vivoArte=null;sc.remove(e.obj);descartar(e.obj);sh.geometry.dispose();
      // volta para a imagem parada
      const img=cv._r3k&&S.cache.get(cv._r3k);if(img&&cv.isConnected)try{copiar(cv,img);}catch(e){}}};
    S.vivoArte=v;S.vivos.add(v);kick();
  }
  /* v10: XILOGRAVURA para o Livro de Causos: o modelo em 3 tons (papel, hachura, tinta) com contorno de tinta, em papel creme.
     Sem modelo/WebGL: o medalhão do reino em sépia. Devolve um <canvas>. */
  function xilo(id,w,h){
    w=Math.max(32,Math.round(w||240));h=Math.max(32,Math.round(h||180));
    const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
    const papel='#EFE2C4',meio='#A87A50',tinta='#24160E';
    g.fillStyle=papel;g.fillRect(0,0,w,h);
    let ok=false;
    if(iniciar()&&temModelo(id)){try{
      const T=S.T,e=instancia(id,0);if(e){const sc=S.cena;S.alvo.add(e.obj);e.obj.position.set(0,0,0);e.obj.rotation.set(0,0,0);e.pose('idle',0.9,0);
        const b=caixa(e.obj);const busto=BUSTO(id);if(busto){const lw=Math.max(b.max.x-b.min.x,0.4);if(b.max.y-b.min.y>lw*1.5)b.min.y=b.max.y-lw*1.5;}
        S.sombra.visible=false;if(busto)enquadrar(S.cam,b,w/h,0.32,0.08,0.84,0.86,0.02);else enquadrar(S.cam,b,w/h,0.55,0.16,0.86,0.84,-0.02);
        desenharGL(sc,S.cam,w,h,1.25);S.alvo.remove(e.obj);S.sombra.visible=true;
        const q=document.createElement('canvas');q.width=w;q.height=h;const qg=q.getContext('2d');qg.drawImage(S.cv,0,0,w,h,0,0,w,h);
        const im=qg.getImageData(0,0,w,h),d=im.data,out=g.getImageData(0,0,w,h),o=out.data;
        const P=[0xEF,0xE2,0xC4],Mi=[0xA8,0x7A,0x50],K=[0x24,0x16,0x0E];
        const A=(x,y)=>(x<0||y<0||x>=w||y>=h)?0:d[(y*w+x)*4+3];
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;const a=d[i+3];if(a<40)continue;
          const l=(d[i]*0.3+d[i+1]*0.59+d[i+2]*0.11)/Math.max(1,a/255);
          const borda=A(x-1,y)<40||A(x+1,y)<40||A(x,y-1)<40||A(x,y+1)<40||A(x-2,y)<40||A(x+2,y)<40;
          let C;if(borda||l<62)C=K;else if(l<128)C=((x+y)%4<2)?K:Mi;else if(l<185)C=((x-y+4096)%5===0)?K:Mi;else C=((x+y)%7===0)?Mi:P;
          o[i]=C[0];o[i+1]=C[1];o[i+2]=C[2];o[i+3]=255;}
        g.putImageData(out,0,0);ok=true;}
    }catch(e){ok=false;}}
    if(!ok&&typeof medalhaoPintar==='function'){const q=document.createElement('canvas');q.width=w;q.height=h;try{medalhaoPintar(q.getContext('2d'),id,{semNome:true});}catch(e){}
      g.save();g.filter='grayscale(1) sepia(.8) contrast(1.4)';g.globalAlpha=0.9;g.drawImage(q,0,0);g.restore();}
    // chão riscado e moldura de cordel
    g.strokeStyle=tinta;g.lineWidth=Math.max(1,w*0.006);for(let i=0;i<6;i++){const y=h*0.9+i*h*0.015;g.beginPath();g.moveTo(w*0.18+i*3,y);g.lineTo(w*0.82-i*3,y);g.stroke();}
    const bb=Math.max(3,Math.round(Math.min(w,h)*0.035));g.lineWidth=bb;g.strokeRect(bb/2,bb/2,w-bb,h-bb);g.lineWidth=Math.max(1,bb*0.35);g.strokeRect(bb*1.8,bb*1.8,w-bb*3.6,h-bb*3.6);
    return c;
  }
  setTimeout(vigiarVivo,1200);
  return {
    disponivel:()=>iniciar(),quer,pedir,pendentes,temModelo,pacoteVivo,bauVivo,pular,xilo,
    stats:()=>({renders:S.st.n,ms:Math.round(S.st.ms),medio:S.st.n?Math.round(S.st.ms/S.st.n):0,hits:S.st.hit,cache:S.cache.size,soft:S.soft,ok:S.ok}),
    _S:S
  };
})();
/* gancho do Livro de Causos (84-ralos-ui): retratoXilo(id,w,h) → HTML de um <img> em xilogravura (a imagem fica em cache) */
const XILO_CACHE=new Map();
function retratoXilo(id,w,h){try{const k=id+'|'+w+'x'+h+(id==='heroi-voce'?heroiVisualK():'');let u=XILO_CACHE.get(k);if(!u){const c=R3D.xilo(id,w,h);if(!c)return null;u=c.toDataURL('image/png');XILO_CACHE.set(k,u);if(XILO_CACHE.size>40)XILO_CACHE.delete(XILO_CACHE.keys().next().value);}
  return `<img class="xilo" src="${u}" width="${Math.round(w||240)}" height="${Math.round(h||180)}" alt="" style="display:block;max-width:100%;height:auto;image-rendering:auto">`;}catch(e){return null;}}

