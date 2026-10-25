/* ===================== v12: BATALHA DAS TRILHAS — palco 3D (window.TR3) =====================
 Desenha o mundo do motor TRI (62-trilhas.js). Feito para ser leve no celular:
 - cada lenda é UMA malha (o modelo CHAR3D é fundido numa geometria só com as cores nos vértices, guardada por carta);
 - chão pintado num canvas só, árvores com InstancedMesh, partículas e tiros em dois THREE.Points;
 - sem mapa de sombras (um disco no chão com a cor do time faz o papel), celular a 30 quadros e pixel ratio ≤ 1,25.
 Campo do motor (x, y) -> mundo (x, 0, 16 - y): você embaixo (perto da câmera), o rival lá no fundo.
 API: TR3.iniciar(host) -> bool · TR3.montar(T) · TR3.eventos(T, lista) · TR3.quadro(T, now) · TR3.pick(cx, cy) -> {x,y}|null
      TR3.mira(o|null) (o = {tipo:'un'|'feitico', lane, x, y, ok, zonas:[[y0,y1]x3]}) · TR3.parar()
*/
const TR3=(function(){
  const S={on:false,r:null,cv:null,c2:null,g2:null,scene:null,cam:null,W:1,H:1,pr:1,cel:false,last:0,un:new Map(),geo:new Map(),
    pts:null,tiros:null,aneis:[],nums:[],tremor:0,mira:null,zonas:[],est:new Map(),ray:null,v:null,tex:{}};
  const COR={p:'#4FB3E8',r:'#F0603A'};
  const W=(x,y)=>({x,z:16-y});
  const celular=()=>{try{return matchMedia('(pointer:coarse)').matches||Math.min(innerWidth,innerHeight)<600;}catch(e){return innerWidth<700;}};

  /* ---------- arranque ---------- */
  function iniciar(host){
    const T=window.THREE;if(!T)return false;
    try{
      if(T.ColorManagement&&'legacyMode' in T.ColorManagement)T.ColorManagement.legacyMode=false;
      S.cel=celular();
      const cv=document.createElement('canvas');cv.className='tri-3d';host.appendChild(cv);
      const r=new T.WebGLRenderer({canvas:cv,antialias:!S.cel,alpha:false,powerPreference:S.cel?'low-power':'default'});
      if(!r.getContext())return false;
      r.outputEncoding=T.sRGBEncoding;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.1;
      const c2=document.createElement('canvas');c2.className='tri-2d';host.appendChild(c2);
      Object.assign(S,{on:true,r,cv,c2,g2:c2.getContext('2d'),host,ray:new T.Raycaster(),v:new T.Vector3()});
      S.cam=new T.PerspectiveCamera(40,1,6,170); // perto=6: o chão fica longe da câmera e o depth de 16 bits de alguns celulares não briga com as marcas no chão
      medir();
      S.ro=()=>medir();window.addEventListener('resize',S.ro);
      return true;
    }catch(e){try{parar();}catch(_){}return false;}
  }
  function medir(){
    if(!S.on)return;const rc=S.host.getBoundingClientRect();
    S.W=Math.max(50,rc.width|0);S.H=Math.max(50,rc.height|0);
    S.pr=Math.min(window.devicePixelRatio||1,S.cel?1.25:1.5);
    S.r.setPixelRatio(S.pr);S.r.setSize(S.W,S.H,false);
    S.c2.width=Math.round(S.W*S.pr);S.c2.height=Math.round(S.H*S.pr);
    enquadrar();
  }
  /* câmera inclinada por trás de você; afasta até o campo todo caber */
  function enquadrar(){
    const T=window.THREE,cam=S.cam;cam.aspect=S.W/S.H;
    const retrato=S.W<S.H*0.9;const pitch=retrato?0.98:0.9;cam.fov=retrato?42:36;cam.updateProjectionMatrix();
    const alvo=new T.Vector3(0,0,retrato?0.9:0.4);
    const cantos=[[-6.9,-16.4],[6.9,-16.4],[-6.9,16.6],[6.9,16.6]].map(([x,z])=>new T.Vector3(x,0,z));
    let lo=10,hi=120;
    for(let k=0;k<24;k++){const D=(lo+hi)/2;cam.position.set(alvo.x,alvo.y+D*Math.sin(pitch),alvo.z+D*Math.cos(pitch));cam.lookAt(alvo);cam.updateMatrixWorld();
      const ok=cantos.every(c=>{const p=c.clone().project(cam);return Math.abs(p.x)<=0.98&&p.y<=0.94&&p.y>=-0.98;});if(ok)hi=D;else lo=D;}
    const D=hi;cam.position.set(alvo.x,alvo.y+D*Math.sin(pitch),alvo.z+D*Math.cos(pitch));cam.lookAt(alvo);S.base=cam.position.clone();S.alvo=alvo;
  }
  function parar(){
    S.on=false;if(S.ro)window.removeEventListener('resize',S.ro);
    try{if(S.scene)S.scene.traverse(o=>{if(o.geometry&&!o.userData.geoCompart)o.geometry.dispose();const m=o.material;if(m)(Array.isArray(m)?m:[m]).forEach(x=>{if(x.map)x.map.dispose();x.dispose();});});}catch(e){}
    for(const g of S.geo.values())try{g.dispose();}catch(e){}
    try{S.r&&S.r.dispose();S.r&&S.r.forceContextLoss&&S.r.forceContextLoss();}catch(e){}
    try{S.cv&&S.cv.remove();S.c2&&S.c2.remove();}catch(e){}
    Object.assign(S,{r:null,cv:null,c2:null,g2:null,scene:null,un:new Map(),geo:new Map(),est:new Map(),aneis:[],nums:[],mira:null,zonas:[],tex:{}});
  }

  /* ---------- texturas pintadas ---------- */
  function texDisco(cor,borda){
    const cv=document.createElement('canvas');cv.width=cv.height=64;const g=cv.getContext('2d');
    const gr=g.createRadialGradient(32,32,4,32,32,31);gr.addColorStop(0,'rgba(0,0,0,.45)');gr.addColorStop(0.62,'rgba(0,0,0,.3)');
    if(borda){gr.addColorStop(0.7,borda);gr.addColorStop(0.86,borda);}gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gr;g.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;return t;
  }
  function texPonto(){const cv=document.createElement('canvas');cv.width=cv.height=32;const g=cv.getContext('2d');
    const gr=g.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.4,'rgba(255,255,255,.75)');gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr;g.fillRect(0,0,32,32);return new THREE.CanvasTexture(cv);}
  const COR_T={milharal:'#D9A04A',pomar:'#5DA84A',brejo:'#3E9AA8',pasto:'#7A62C8',neutro:'#B08A5A'};
  function pintarChao(T){
    const cv=document.createElement('canvas');const CW=512,CH=1152;cv.width=CW;cv.height=CH;const g=cv.getContext('2d');
    const px=x=>(x+8)/16*CW,py=y=>(1-(y+2)/36)*CH; // campo 16 x 36 (x -8..8, y -2..34)
    let gr=g.createLinearGradient(0,0,0,CH);gr.addColorStop(0,'#3F7A36');gr.addColorStop(0.5,'#4E8C3A');gr.addColorStop(1,'#467F35');g.fillStyle=gr;g.fillRect(0,0,CW,CH);
    // manchas de capim
    let sd=7;const rd=()=>((sd=(sd*16807)%2147483647)/2147483647);
    for(let i=0;i<900;i++){g.fillStyle=rd()<0.5?'rgba(110,170,70,.18)':'rgba(30,70,30,.16)';const x=rd()*CW,y=rd()*CH,r=3+rd()*10;g.beginPath();g.ellipse(x,y,r,r*0.6,rd()*3,0,6.283);g.fill();}
    // trilhas de terra (metade de cada lado com a cor do terreno daquela trilha)
    for(let i=0;i<3;i++){const x=TRI.LX[i];
      for(const P of ['p','r']){const t=T.terr[P][i]||'neutro',c=COR_T[t]||COR_T.neutro;const y0=P==='p'?0:16,y1=P==='p'?16:32;
        g.fillStyle='#8A6A44';g.fillRect(px(x-1.25),py(y1),px(x+1.25)-px(x-1.25),py(y0)-py(y1));
        g.fillStyle=c;g.globalAlpha=0.12;g.fillRect(px(x-1.25),py(y1),px(x+1.25)-px(x-1.25),py(y0)-py(y1));g.globalAlpha=1;
        g.strokeStyle=c;g.lineWidth=5;g.globalAlpha=0.7;g.beginPath();g.moveTo(px(x-1.3),py(y0));g.lineTo(px(x-1.3),py(y1));g.moveTo(px(x+1.3),py(y0));g.lineTo(px(x+1.3),py(y1));g.stroke();g.globalAlpha=1;}
      for(let k=0;k<70;k++){g.fillStyle=rd()<0.5?'rgba(60,40,20,.25)':'rgba(200,170,120,.2)';g.beginPath();g.arc(px(x-1.1+rd()*2.2),py(rd()*32),1.5+rd()*3,0,6.283);g.fill();}}
    // caminho até a Casa
    for(const yc of [2.4,29.6]){g.fillStyle='#8A6A44';g.beginPath();g.ellipse(px(0),py(yc),px(2.4)-px(0),(py(0)-py(2.4)),0,0,6.283);g.fill();}
    // rio
    gr=g.createLinearGradient(0,py(17.3),0,py(14.7));gr.addColorStop(0,'#2A6F8C');gr.addColorStop(0.5,'#3FA0C0');gr.addColorStop(1,'#2A6F8C');
    g.fillStyle='#6B5634';g.fillRect(0,py(17.5),CW,py(14.5)-py(17.5));g.fillStyle=gr;g.fillRect(0,py(17.2),CW,py(14.8)-py(17.2));
    g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=2;for(let i=0;i<26;i++){const x=rd()*CW,y=py(14.9+rd()*2.2);g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+8,y-3,x+16,y);g.stroke();}
    // linha do meio do seu lado
    g.setLineDash([10,10]);g.strokeStyle='rgba(255,255,255,.18)';g.lineWidth=3;g.beginPath();g.moveTo(0,py(14.6));g.lineTo(CW,py(14.6));g.moveTo(0,py(17.4));g.lineTo(CW,py(17.4));g.stroke();g.setLineDash([]);
    const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;
  }

  /* ---------- fundir um grupo numa geometria só (cores nos vértices) ---------- */
  function fundir(root){
    const T=window.THREE;root.updateMatrixWorld(true);
    const pos=[],nor=[],col=[];const c=new T.Color(),e=new T.Color(),nm=new T.Matrix3();
    root.traverse(m=>{
      if(!m.isMesh||!m.visible||!m.geometry||m.isInstancedMesh)return;
      let mat=Array.isArray(m.material)?m.material[0]:m.material;if(!mat||(mat.transparent&&mat.opacity<0.35))return;
      let g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();
      if(!g.attributes.normal)g.computeVertexNormals();
      g.applyMatrix4(m.matrixWorld);
      c.copy(mat.color||c.set('#ffffff'));
      if(mat.emissive&&(mat.emissive.r+mat.emissive.g+mat.emissive.b)>0.05){e.copy(mat.emissive).multiplyScalar(Math.min(1,(mat.emissiveIntensity||1)*0.6));c.add(e);}
      const P=g.attributes.position,N=g.attributes.normal;
      for(let i=0;i<P.count;i++){pos.push(P.getX(i),P.getY(i),P.getZ(i));nor.push(N.getX(i),N.getY(i),N.getZ(i));col.push(c.r,c.g,c.b);}
      g.dispose();
    });
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));
    g.computeBoundingSphere();return g;
  }
  function descartar(root){root.traverse(o=>{if(o.geometry)o.geometry.dispose();const m=o.material;if(m)(Array.isArray(m)?m:[m]).forEach(x=>{if(x.map)x.map.dispose();x.dispose();});});}
  function geoDe(id,asc){
    const k=id+'|'+(asc|0);if(S.geo.has(k))return S.geo.get(k);
    let g=null;
    try{if(typeof p3dModelo==='function'){const inst=p3dModelo(id,asc);try{inst.anim&&inst.anim('idle',0,0);}catch(e){}
      g=fundir(inst.obj);g.userData.alt=(()=>{g.computeBoundingBox();return g.boundingBox.max.y;})();descartar(inst.obj);}}catch(e){g=null;}
    if(!g||!g.attributes.position.count){const T=window.THREE;g=new T.SphereGeometry(0.5,14,10);g.translate(0,0.55,0);
      const n=g.attributes.position.count,cc=new T.Color(CARD[id]?(TERR_COR[CARD[id].terreno]||'#c8a070'):'#c8a070'),col=[];for(let i=0;i<n;i++)col.push(cc.r,cc.g,cc.b);
      g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.userData.alt=1.05;}
    S.geo.set(k,g);return g;
  }

  /* ---------- torres e Casa (feitas aqui, depois fundidas) ---------- */
  function torre3d(P,kind){
    const T=window.THREE,G=new T.Group(),M=(c,o)=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:0.8},o||{}));
    const time=COR[P],pedra=M('#9C8F80'),mad=M('#8E5F38'),madE=M('#5E3B22'),palha=M('#D9B25A');
    const add=(geo,mat,x,y,z,rx,ry,rz)=>{const m=new T.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);m.rotation.set(rx||0,ry||0,rz||0);G.add(m);return m;};
    if(kind==='casa'){
      add(new T.CylinderGeometry(1.9,2.1,0.5,10),pedra,0,0.25,0);
      add(new T.CylinderGeometry(1.45,1.55,1.5,10),mad,0,1.25,0);
      add(new T.ConeGeometry(1.95,1.9,10),M(time),0,2.95,0);
      add(new T.ConeGeometry(1.2,0.7,10),palha,0,4.05,0);
      add(new T.BoxGeometry(0.62,0.95,0.2),madE,0,0.95,P==='p'?-1.47:1.47);
      for(let i=0;i<6;i++){const a=i/6*6.283;add(new T.CylinderGeometry(0.1,0.12,1.4,6),madE,Math.cos(a)*1.52,1.15,Math.sin(a)*1.52);}
      add(new T.CylinderGeometry(0.06,0.06,1.6,6),madE,0,4.9,0);add(new T.BoxGeometry(0.9,0.5,0.04),M(time),0.47,5.4,0);
      // totens
      for(const sx of [-1,1]){add(new T.CylinderGeometry(0.28,0.32,2.2,8),mad,sx*2.1,1.1,P==='p'?-0.8:0.8);add(new T.SphereGeometry(0.34,10,8),M(time),sx*2.1,2.35,P==='p'?-0.8:0.8);}
    }else{
      add(new T.CylinderGeometry(1.0,1.15,0.6,8),pedra,0,0.3,0);
      add(new T.CylinderGeometry(0.75,0.85,1.8,8),mad,0,1.5,0);
      for(let i=0;i<8;i++){const a=i/8*6.283;add(new T.BoxGeometry(0.22,0.26,0.22),madE,Math.cos(a)*0.78,2.5,Math.sin(a)*0.78);}
      add(new T.CylinderGeometry(0.95,0.95,0.16,8),madE,0,2.36,0);
      add(new T.ConeGeometry(1.0,1.15,8),M(time),0,3.2,0);
      add(new T.CylinderGeometry(0.05,0.05,1.1,6),madE,0,4.2,0);add(new T.BoxGeometry(0.62,0.36,0.04),M(time),0.33,4.55,0);
      add(new T.SphereGeometry(0.22,10,8),M('#FFD35A',{emissive:'#FFB020',emissiveIntensity:0.8}),0,2.05,P==='p'?-0.78:0.78);
    }
    const g=fundir(G);descartar(G);return g;
  }

  /* ---------- montar a cena da partida ---------- */
  function montar(Tm){
    const T=window.THREE;const sc=new T.Scene();S.scene=sc;
    sc.background=new T.Color('#8CC7E8');sc.fog=new T.Fog('#9CCBE0',40,95);
    sc.add(new T.HemisphereLight('#E8F4FF','#4A6A2A',0.95));
    const sol=new T.DirectionalLight('#FFF1D6',1.5);sol.position.set(-6,14,8);sc.add(sol);
    // chão do campo + mundo em volta
    const chao=new T.Mesh(new T.PlaneGeometry(16,36),new T.MeshLambertMaterial({map:pintarChao(Tm)}));chao.rotation.x=-Math.PI/2;chao.position.set(0,0,0);sc.add(chao);S.chao=chao;
    const fora=new T.Mesh(new T.PlaneGeometry(160,160),new T.MeshLambertMaterial({color:'#3C6B2E'}));fora.rotation.x=-Math.PI/2;fora.position.y=-0.02;sc.add(fora);
    // água que brilha um pouco
    const agua=new T.Mesh(new T.PlaneGeometry(16,2.4),new T.MeshBasicMaterial({color:'#7FD8F0',transparent:true,opacity:0.18,depthWrite:false}));agua.rotation.x=-Math.PI/2;agua.position.set(0,0.02,0);sc.add(agua);S.agua=agua;
    // pontes (uma por trilha)
    {const G=new T.Group(),mad=new T.MeshStandardMaterial({color:'#9A6A3E',roughness:0.85}),esc=new T.MeshStandardMaterial({color:'#6A4428',roughness:0.85});
      for(const x of TRI.LX){for(let k=0;k<7;k++){const b=new T.Mesh(new T.BoxGeometry(2.6,0.14,0.36),k%2?mad:esc);b.position.set(x,0.12,-1.25+k*0.42);G.add(b);}
        for(const sx of [-1,1]){const c=new T.Mesh(new T.BoxGeometry(0.14,0.4,3.1),esc);c.position.set(x+sx*1.3,0.3,0);G.add(c);}}
      const m=new T.Mesh(fundir(G),new T.MeshLambertMaterial({vertexColors:true}));descartar(G);sc.add(m);}
    // árvores e pedras nas bordas (instanciadas)
    {const rnd=(()=>{let a=99;return()=>((a=(a*16807)%2147483647)/2147483647);})();const L=[];
      for(let i=0;i<70;i++){const lado=i%2?1:-1;const x=lado*(8.4+rnd()*9),z=-20+rnd()*42;L.push([x,z,0.8+rnd()*0.9]);}
      for(let i=0;i<26;i++){const x=-14+rnd()*28,z=-19-rnd()*12;L.push([x,z,0.9+rnd()]);}
      const tronco=new T.InstancedMesh(new T.CylinderGeometry(0.16,0.22,1.2,6),new T.MeshLambertMaterial({color:'#6A4428'}),L.length);
      const copa=new T.InstancedMesh(new T.ConeGeometry(1.0,2.4,7),new T.MeshLambertMaterial({color:'#2F6B32'}),L.length);
      const m=new T.Matrix4(),q=new T.Quaternion(),cc=new T.Color();
      L.forEach(([x,z,s],i)=>{m.compose(new T.Vector3(x,0.6*s,z),q,new T.Vector3(s,s,s));tronco.setMatrixAt(i,m);m.compose(new T.Vector3(x,(1.2+1.1)*s,z),q,new T.Vector3(s,s,s));copa.setMatrixAt(i,m);
        cc.setHSL(0.3+rnd()*0.08,0.45,0.25+rnd()*0.12);copa.setColorAt(i,cc);});
      sc.add(tronco,copa);}
    // torres
    S.est=new Map();
    const gTorre={p:torre3d('p','torre'),r:torre3d('r','torre')},gCasa={p:torre3d('p','casa'),r:torre3d('r','casa')};
    for(const e of Tm.ents){if(e.kind!=='torre'&&e.kind!=='casa')continue;
      const m=new T.Mesh(e.kind==='casa'?gCasa[e.P]:gTorre[e.P],new T.MeshLambertMaterial({vertexColors:true}));m.userData.geoCompart=true;
      const w=W(e.x,e.y);m.position.set(w.x,0,w.z);if(e.P==='r')m.rotation.y=Math.PI;sc.add(m);
      S.est.set(e.uid,{m,e,caiu:false,fl:0,alt:e.kind==='casa'?5.6:4.6});}
    S.geoTorres=[gTorre.p,gTorre.r,gCasa.p,gCasa.r];
    // discos dos times (sombra + cor do time)
    S.tex.disco={p:texDisco(COR.p,'rgba(79,179,232,.95)'),r:texDisco(COR.r,'rgba(240,96,58,.95)')};
    S.geoDisco=new T.PlaneGeometry(1,1);S.geoDisco.rotateX(-Math.PI/2);
    S.matDisco={p:new T.MeshBasicMaterial({map:S.tex.disco.p,transparent:true,depthWrite:false}),r:new T.MeshBasicMaterial({map:S.tex.disco.r,transparent:true,depthWrite:false})};
    // partículas e tiros
    S.tex.ponto=texPonto();
    S.pts=sistema(260,0.32,true);S.poeira=sistema(160,0.75,false);S.tiros=sistema(60,0.5,true);
    // anéis (feitiços, chegada)
    S.geoAnel=new T.RingGeometry(0.82,1,40);S.geoAnel.rotateX(-Math.PI/2);
    // mira (zonas onde dá para soltar + marcador)
    const tz=(()=>{const cv=document.createElement('canvas');cv.width=64;cv.height=256;const g=cv.getContext('2d');g.fillStyle='rgba(255,255,255,.45)';g.fillRect(0,0,64,256);
      g.strokeStyle='#FFFFFF';g.lineWidth=7;g.setLineDash([16,10]);g.strokeRect(4,4,56,248);const t=new T.CanvasTexture(cv);t.encoding=T.sRGBEncoding;return t;})();
    S.zonas=[0,1,2].map(i=>{const m=new T.Mesh(new T.PlaneGeometry(2.6,1),new T.MeshBasicMaterial({map:tz,color:'#FFFFFF',transparent:true,opacity:0.16,depthWrite:false,fog:false}));m.rotation.x=-Math.PI/2;m.visible=false;m.renderOrder=3;sc.add(m);return m;});
    S.alvoM=new T.Mesh(new T.RingGeometry(0.8,1.05,32),new T.MeshBasicMaterial({color:'#FFFFFF',transparent:true,opacity:0.85,depthWrite:false}));S.alvoM.rotation.x=-Math.PI/2;S.alvoM.visible=false;S.alvoM.renderOrder=4;sc.add(S.alvoM);
    S.areaM=new T.Mesh(new T.CircleGeometry(1,40),new T.MeshBasicMaterial({color:'#FFD35A',transparent:true,opacity:0.25,depthWrite:false}));S.areaM.rotation.x=-Math.PI/2;S.areaM.visible=false;S.areaM.renderOrder=4;sc.add(S.areaM);
    S.un=new Map();S.nums=[];S.aneis=[];S.tremor=0;S.last=0;
  }
  function sistema(n,tam,add){
    const T=window.THREE,g=new T.BufferGeometry(),p=new Float32Array(n*3),c=new Float32Array(n*3);for(let i=0;i<n;i++)p[i*3+1]=-50;
    g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('color',new T.BufferAttribute(c,3));
    const m=new T.PointsMaterial({size:tam,map:S.tex.ponto,vertexColors:true,transparent:true,depthWrite:false,blending:add?T.AdditiveBlending:T.NormalBlending,opacity:add?1:0.7,sizeAttenuation:true});
    const o=new T.Points(g,m);o.frustumCulled=false;S.scene.add(o);return {o,n,L:[],i:0};
  }
  function particula(sis,o){const s=sis;if(s.L.length>=s.n)s.L.shift();s.L.push(Object.assign({vx:0,vy:0,vz:0,g:0,vida:0.6,t:0,cor:'#ffffff'},o,{c:new THREE.Color(o.cor||'#ffffff')}));}
  function estouro(x,y,z,cor,n,forca,o){o=o||{};for(let i=0;i<n;i++){const a=Math.random()*6.283,v=(0.4+Math.random())*forca;
    particula(S.pts,{x,y:z,z:y,vx:Math.cos(a)*v,vz:Math.sin(a)*v,vy:(o.sobe||2)+Math.random()*2,g:o.g==null?7:o.g,vida:0.4+Math.random()*0.4,cor:Array.isArray(cor)?cor[i%cor.length]:cor});}}
  function poeira(x,z,n,cor){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=0.6+Math.random()*1.2;particula(S.poeira,{x,y:0.25,z,vx:Math.cos(a)*v,vz:Math.sin(a)*v,vy:0.6+Math.random(),g:0.6,vida:0.6+Math.random()*0.5,cor:cor||'#D8C8A8'});}}
  function anel(x,z,cor,r0,r1,ms,op){const m=new THREE.Mesh(S.geoAnel,new THREE.MeshBasicMaterial({color:cor,transparent:true,opacity:op||0.8,depthWrite:false,blending:THREE.AdditiveBlending}));
    m.position.set(x,0.12,z);m.renderOrder=5;m.userData.geoCompart=true;S.scene.add(m);S.aneis.push({m,r0,r1,t:0,d:ms/1000,op:op||0.8});}
  function numero(x,y,z,txt,cor,grande){S.nums.push({x,y,z,txt,cor,t:0,d:0.9,g:!!grande});if(S.nums.length>24)S.nums.shift();}

  /* ---------- unidades ---------- */
  function novaUnidade(e){
    const T=window.THREE;const asc=e.P==='p'&&typeof p3dAscDe==='function'&&!e.ficha?p3dAscDe(e.id):0;
    const g=geoDe(e.id,asc),alt=g.userData.alt||1.2;
    const C=CARD[e.id]||{};const altAlvo=e.kind==='obra'?2.2:e.ficha?1.25:C.custo>=6?2.7:C.custo>=4?2.25:1.85; // altura na tela (a torre tem 4,6)
    const esc=altAlvo/Math.max(0.5,alt);
    const mat=new T.MeshLambertMaterial({vertexColors:true});
    const m=new T.Mesh(g,mat);m.userData.geoCompart=true;m.scale.setScalar(esc);
    const holder=new T.Group();holder.add(m);
    const disco=new T.Mesh(S.geoDisco,S.matDisco[e.P]);disco.userData.geoCompart=true;disco.renderOrder=1;const dr=Math.max(1.3,e.raio*3.4);disco.scale.set(dr,1,dr);disco.position.y=0.08;holder.add(disco);
    const w=W(e.x,e.y);holder.position.set(w.x,0,w.z);S.scene.add(holder);
    const U={uid:e.uid,P:e.P,m,mat,holder,disco,esc,alt:alt*esc,yaw:e.P==='p'?Math.PI:0,atk:-1,fl:0,morto:-1,nasce:0,px:e.x,py:e.y,ar:!!e.ar,kind:e.kind,raiz:0};
    m.rotation.y=U.yaw;S.un.set(e.uid,U);return U;
  }
  function tirar(U){if(U.holder.parent)U.holder.parent.remove(U.holder);U.mat.dispose();S.un.delete(U.uid);}

  /* ---------- eventos do motor -> efeitos ---------- */
  const COR_GOLPE={raio:'#FFE070',respingo:'#7FD8F0',estouro:'#FF9A40',ferrao:'#F2E25A',torre:'#FFE9A0'};
  const COR_FEIT={danoCriatura:'#FF7A2E',buffTimeTemp:'#FFD35A',buffAliadaTemp:'#FFD35A',buffAliada:'#7FE07F',danoEnraiza:'#7FC04A',perdeAtk:'#A77BE0',destroiSeVidaAte:'#5A3E8C',
    vidaMaisCuraTotal:'#7FE07F',vidaTimeCura:'#7FE0C0',explode:'#FF7A2E',onda:'#FFB060',engole:'#3E9AA8',carga:'#E85A3A'};
  function eventos(Tm,L){
    if(!S.on||!S.scene)return;
    for(const v of L){
      if(v.t==='entra'){const e=Tm.ents.find(x=>x.uid===v.uid);if(!e)continue;const U=novaUnidade(e);U.nasce=0.001;
        const w=W(v.x,v.y),c=(typeof RAR_LUZ!=='undefined'&&RAR_LUZ[v.rar])||'#FFFFFF';
        if(!v.ficha){anel(w.x,w.z,c,0.3,v.rar==='lendaria'?3:v.rar==='epica'?2.4:1.8,520,0.9);estouro(w.x,w.z,0.4,[c,'#FFFFFF'],v.rar==='comum'?8:16,2.2,{sobe:3});}
        if(v.naTerra)anel(w.x,w.z,TERR_COR[CARD[v.id].terreno]||'#fff',0.5,1.4,700,0.6);}
      else if(v.t==='golpe'){const U=S.un.get(v.uid);if(U){U.atk=0;U.atkDist=!!v.dist;}
        const E=S.est.get(v.uid);if(E)E.fl=Math.max(E.fl,0.5);}
      else if(v.t==='dano'){const U=S.un.get(v.uid);const w=W(v.x,v.y);
        if(U){U.fl=1;}const E=S.est.get(v.uid);if(E){E.fl=1;if(v.n>=60)estouro(w.x,w.z,1.8,['#C8B8A0','#8E5F38'],3,1.2,{sobe:1.5});}
        if(v.forte||E)numero(w.x,(U?U.alt:E?E.alt*0.7:1)+0.6,w.z,'-'+v.n,v.P==='p'?'#FF8A70':'#FFE070',!!v.forte);}
      else if(v.t==='cura'){const w=W(v.x,v.y);numero(w.x,1.6,w.z,'+'+v.n,'#7FE07F');estouro(w.x,w.z,0.6,'#7FE07F',5,0.6,{sobe:2,g:0});}
      else if(v.t==='buff'){const U=S.un.get(v.uid);if(!U)continue;const c=v.k==='fraco'?'#A77BE0':v.k==='raiz'?'#7FC04A':v.k==='energia'?'#4FB3E8':'#FFD35A';
        estouro(U.holder.position.x,U.holder.position.z,0.5,c,6,0.8,{sobe:2.5,g:0});if(v.k==='raiz')U.raiz=3;}
      else if(v.t==='morre'){const U=S.un.get(v.uid);if(U&&U.morto<0){U.morto=0;const p=U.holder.position;poeira(p.x,p.z,10);estouro(p.x,p.z,0.6,['#FFFFFF','#D8C8A8'],8,1.6);}}
      else if(v.t==='torre'){const E=S.est.get(v.uid);if(E){E.caiu=true;E.tq=0;const p=E.m.position;for(let k=0;k<3;k++)poeira(p.x+(Math.random()-0.5)*2,p.z+(Math.random()-0.5)*2,14,'#B8A890');
        estouro(p.x,p.z,2,['#FF9A40','#FFD35A','#8E5F38'],30,4,{sobe:4});anel(p.x,p.z,'#FFB060',0.5,5,700,0.9);S.tremor=0.6;}}
      else if(v.t==='feitico'){const w=W(v.x,v.y),c=COR_FEIT[v.op]||'#FFFFFF';
        if(v.r>50){for(const U of S.un.values())if(U.P===v.P)estouro(U.holder.position.x,U.holder.position.z,0.5,c,4,0.6,{sobe:2,g:0});continue;}
        if(v.op==='carga'||v.op==='onda'){for(let k=0;k<5;k++)anel(w.x,w.z-(v.P==='p'?k*1.6:-k*1.6),c,0.4,1.6,380+k*90,0.7);estouro(w.x,w.z,0.3,c,14,3);continue;}
        const r=v.r||2.6;anel(w.x,w.z,c,0.2,r,520,0.95);anel(w.x,w.z,'#FFFFFF',0.2,r*0.8,380,0.6);
        estouro(w.x,w.z,0.3,[c,'#FFFFFF'],v.op==='danoCriatura'||v.op==='explode'?26:16,r*1.3,{sobe:3});
        if(v.op==='danoCriatura'||v.op==='explode'){S.tremor=Math.max(S.tremor,0.25);for(let k=0;k<14;k++)particula(S.pts,{x:w.x+(Math.random()-0.5)*r*1.4,y:6+Math.random()*3,z:w.z+(Math.random()-0.5)*r*1.4,vy:-14,vida:0.45,cor:c});}}
    }
  }

  /* ---------- tradução de toque para o campo ---------- */
  function pick(cx,cy){
    if(!S.on||!S.chao)return null;const rc=S.cv.getBoundingClientRect();
    const T=window.THREE;const v=new T.Vector2((cx-rc.left)/rc.width*2-1,-((cy-rc.top)/rc.height)*2+1);
    S.ray.setFromCamera(v,S.cam);const p=new T.Vector3();
    if(!S.ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),p))return null;
    return {x:p.x,y:16-p.z};
  }
  function mira(o){S.mira=o;}

  /* ---------- quadro ---------- */
  function quadro(Tm,now){
    if(!S.on||!S.scene)return;
    const dt=S.last?Math.min(0.1,(now-S.last)/1000):0.016;S.last=now;const t=now/1000;
    // unidades
    const vivos=new Set();
    for(const e of Tm.ents){if(e.kind!=='un'&&e.kind!=='obra')continue;let U=S.un.get(e.uid);
      if(!e.vivo){continue;}vivos.add(e.uid);if(!U)U=novaUnidade(e);
      const w=W(e.x,e.y),h=U.holder;const dx=e.x-U.px,dy=e.y-U.py,mv=Math.hypot(dx,dy);U.px=e.x;U.py=e.y;
      h.position.x=w.x;h.position.z=w.z;
      // olha para onde anda (ou para o alvo)
      let alvoYaw=null;if(mv>0.004)alvoYaw=Math.atan2(dx,-dy);
      else if(e.alvo){const a=Tm.ents.find(x=>x.uid===e.alvo);if(a)alvoYaw=Math.atan2(a.x-e.x,-(a.y-e.y));}
      if(alvoYaw!=null&&e.kind==='un'){let d=alvoYaw-U.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));U.yaw+=d*Math.min(1,dt*9);}
      const m=U.m;m.rotation.y=U.yaw;
      let y=U.ar?1.1+Math.sin(t*3+e.uid)*0.12:0,sx=1,sy=1,fx=0,fz=0;
      if(e.entra>0&&U.nasce>=0){const k=Math.min(1,U.nasce/0.45);U.nasce+=dt;y+=(1-k*k)*3.2;sy=k<1?0.7+k*0.3:1;if(k>=1&&U.nasce<0.6){sx=1.15;sy=0.85;}if(U.nasce>0.45&&!U.pousou){U.pousou=true;poeira(w.x,w.z,6);}}
      else if(mv>0.004){y+=Math.abs(Math.sin(t*11+e.uid))*0.12;sy=1+Math.sin(t*22+e.uid)*0.04;}
      else{sy=1+Math.sin(t*2.4+e.uid)*0.025;}
      if(U.atk>=0){U.atk+=dt;const p=U.atk/0.45;if(p>=1)U.atk=-1;else{const k=p<0.5?p/0.5:1-(p-0.5)/0.5;const f=U.atkDist?-0.12:0.45;fx=Math.sin(U.yaw)*k*f;fz=Math.cos(U.yaw)*k*f;sy*=1+k*0.1;}}
      if(e.atordoa>0){m.rotation.y=U.yaw+Math.sin(t*20)*0.08;}
      m.position.set(fx,y,fz);m.scale.set(U.esc*sx,U.esc*sy,U.esc*sx);
      U.disco.material.opacity=U.ar?0.6:1;
      if(U.fl>0){U.fl=Math.max(0,U.fl-dt*6);U.mat.emissive.setRGB(U.fl*0.9,U.fl*0.9,U.fl*0.9);}else if(e.buffs&&e.buffs.length&&e.buffs.some(b=>b.k==='dmg')){const k=0.15+Math.sin(t*6)*0.08;U.mat.emissive.setRGB(k,k*0.7,0);}else U.mat.emissive.setRGB(0,0,0);
    }
    for(const U of [...S.un.values()]){if(vivos.has(U.uid))continue;if(U.morto<0)U.morto=0;U.morto+=dt;const k=U.morto/0.45;
      if(k>=1){tirar(U);continue;}U.m.scale.set(U.esc*(1+k*0.3),U.esc*(1-k),U.esc*(1+k*0.3));U.m.rotation.z=k*0.6;U.disco.material=U.disco.material;}
    // torres
    for(const E of S.est.values()){const m=E.m;
      if(E.caiu){E.tq+=dt;const k=Math.min(1,E.tq/0.6);m.scale.set(1+k*0.1,Math.max(0.18,1-k*0.82),1+k*0.1);m.material.color.setRGB(1-k*0.5,1-k*0.55,1-k*0.6);continue;}
      if(E.fl>0){E.fl=Math.max(0,E.fl-dt*5);const k=E.fl*0.45;m.material.emissive.setRGB(k,k*0.8,k*0.5);}
      if(E.e.kind==='casa'&&!E.e.ativa){m.scale.y=1;}else if(E.e.kind==='casa'){m.scale.y=1+Math.sin(t*3)*0.01;}
    }
    // tiros (vêm direto do motor)
    {const s=S.tiros,p=s.o.geometry.attributes.position.array,c=s.o.geometry.attributes.color.array;let i=0;
      for(const q of Tm.tiros){if(i>=s.n)break;const w=W(q.x,q.y);const de=Tm.ents.find(e=>e.uid===q.de);const alt=de&&(de.kind==='torre'||de.kind==='casa')?2.6:(de&&de.ar?1.4:0.9);
        p[i*3]=w.x;p[i*3+1]=alt;p[i*3+2]=w.z;const cc=new THREE.Color(q.P==='p'?'#9FE0FF':'#FFB08A');c[i*3]=cc.r;c[i*3+1]=cc.g;c[i*3+2]=cc.b;i++;
        if(Math.random()<0.5)particula(S.pts,{x:w.x,y:alt,z:w.z,vida:0.25,cor:q.P==='p'?'#4FB3E8':'#F0603A'});}
      for(let k=i;k<s.n;k++)p[k*3+1]=-50;s.o.geometry.attributes.position.needsUpdate=true;s.o.geometry.attributes.color.needsUpdate=true;}
    // partículas
    for(const s of [S.pts,S.poeira]){const p=s.o.geometry.attributes.position.array,c=s.o.geometry.attributes.color.array;let i=0;
      s.L=s.L.filter(q=>(q.t+=dt)<q.vida);
      for(const q of s.L){q.vy-=q.g*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;if(q.y<0.05){q.y=0.05;q.vy=0;}const f=1-q.t/q.vida;
        p[i*3]=q.x;p[i*3+1]=q.y;p[i*3+2]=q.z;c[i*3]=q.c.r*f;c[i*3+1]=q.c.g*f;c[i*3+2]=q.c.b*f;i++;}
      for(let k=i;k<s.n;k++)p[k*3+1]=-50;s.o.geometry.attributes.position.needsUpdate=true;s.o.geometry.attributes.color.needsUpdate=true;}
    // anéis
    S.aneis=S.aneis.filter(a=>{a.t+=dt;const k=a.t/a.d;if(k>=1){S.scene.remove(a.m);a.m.material.dispose();return false;}const r=a.r0+(a.r1-a.r0)*(1-(1-k)*(1-k));a.m.scale.set(r,1,r);a.m.material.opacity=a.op*(1-k);return true;});
    // água mexendo
    if(S.agua)S.agua.material.opacity=0.14+Math.sin(t*1.5)*0.05;
    // mira
    const M=S.mira;
    S.zonas.forEach((z,i)=>{if(!M||M.tipo==='feitico'){z.visible=false;return;}const [y0,y1]=M.zonas[i];z.visible=true;const a=W(TRI.LX[i],(y0+y1)/2);z.position.set(a.x,0.1,a.z);z.scale.set(1,y1-y0,1);
      z.material.opacity=M.lane===i?1:0.6;z.material.color.set(M.lane===i?(M.ok?'#E8F8FF':'#FF7A60'):'#9FE0FF');});
    if(M&&M.x!=null){const a=W(M.x,M.y);S.alvoM.visible=true;S.alvoM.position.set(a.x,0.14,a.z);S.alvoM.material.color.set(M.ok?'#FFFFFF':'#FF7A60');const k=1+Math.sin(t*8)*0.08;S.alvoM.scale.set(k,k,k);
      S.areaM.visible=M.tipo==='feitico';if(S.areaM.visible){S.areaM.position.set(a.x,0.12,a.z);S.areaM.scale.set(2.6,2.6,2.6);}}
    else{S.alvoM.visible=false;S.areaM.visible=false;}
    // tremor da câmera
    if(S.tremor>0){S.tremor=Math.max(0,S.tremor-dt);const k=S.tremor*0.5;S.cam.position.set(S.base.x+(Math.random()-0.5)*k,S.base.y+(Math.random()-0.5)*k,S.base.z);}else S.cam.position.copy(S.base);
    S.r.render(S.scene,S.cam);
    desenhar2d(Tm,dt);
  }
  /* ---------- barras de vida e números (canvas 2D por cima) ---------- */
  function tela(x,y,z){S.v.set(x,y,z).project(S.cam);return {x:(S.v.x+1)/2*S.W,y:(1-S.v.y)/2*S.H,ok:S.v.z<1};}
  function barra(g,x,y,w,h,k,cor){g.fillStyle='rgba(20,12,8,.75)';g.fillRect(x-w/2-1,y-1,w+2,h+2);g.fillStyle=cor;g.fillRect(x-w/2,y,w*Math.max(0,Math.min(1,k)),h);}
  function desenhar2d(Tm,dt){
    const g=S.g2;if(!g)return;g.setTransform(S.pr,0,0,S.pr,0,0);g.clearRect(0,0,S.W,S.H);
    const fs=S.W<420?11:13;g.font=`800 ${fs}px Nunito,system-ui,sans-serif`;g.textAlign='center';g.textBaseline='middle';
    for(const e of Tm.ents){if(!e.vivo)continue;
      if(e.kind==='torre'||e.kind==='casa'){const E=S.est.get(e.uid);if(!E)continue;const w=W(e.x,e.y),p=tela(w.x,E.alt+0.5,w.z);
        const bw=e.kind==='casa'?58:44;barra(g,p.x,p.y,bw,6,e.hp/e.maxHp,COR[e.P]);
        if(e.hp<e.maxHp){g.fillStyle='#FFF6E0';g.strokeStyle='rgba(20,12,8,.8)';g.lineWidth=3;const t=String(Math.ceil(e.hp));g.strokeText(t,p.x,p.y-8);g.fillText(t,p.x,p.y-8);}
        if(e.kind==='casa'&&!e.ativa){g.font=`700 ${fs-1}px Nunito,system-ui,sans-serif`;g.fillStyle='rgba(255,246,224,.85)';g.fillText('zzz',p.x+bw/2+10,p.y+2);g.font=`800 ${fs}px Nunito,system-ui,sans-serif`;}
        continue;}
      const U=S.un.get(e.uid);if(!U)continue;
      if(e.hp<e.maxHp||e.kind==='obra'){const p=tela(U.holder.position.x,U.alt+(U.ar?1.2:0)+0.35,U.holder.position.z);barra(g,p.x,p.y,e.kind==='obra'?30:24,4,e.hp/e.maxHp,COR[e.P]);}
    }
    S.nums=S.nums.filter(n=>{n.t+=dt;if(n.t>=n.d)return false;const p=tela(n.x,n.y+n.t*1.2,n.z);g.globalAlpha=1-Math.max(0,(n.t-n.d*0.6)/(n.d*0.4));
      g.font=`900 ${n.g?fs+5:fs+1}px Nunito,system-ui,sans-serif`;g.lineWidth=3;g.strokeStyle='rgba(20,12,8,.85)';g.strokeText(n.txt,p.x,p.y);g.fillStyle=n.cor;g.fillText(n.txt,p.x,p.y);g.globalAlpha=1;return true;});
  }
  return {iniciar,montar,eventos,quadro,pick,mira,parar,medir,_S:S,get on(){return S.on;},get cel(){return S.cel;}};
})();
